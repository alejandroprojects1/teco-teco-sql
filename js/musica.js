// Música de aventura do Teco-Teco SQL (composição original, gerada no navegador).
// Forma: Abertura (2 compassos, só na primeira vez) → A (tema) → B (parte nova, com cordas)
// → A com tudo (segunda voz, sininhos, bateria cheia) → volta para o A.
// Dó maior, 120 BPM. Cada volta completa dura cerca de 48 segundos.
import { saidaDeAudio, bufferDeRuido } from './audio.js';

const BPM = 120;
const PASSO = 60 / BPM / 4; // 1 semicolcheia (1/16 de compasso)
const POR_COMPASSO = 16;
const VOLUME = 0.8;

// ───────────── Notas ─────────────
const ESCALA = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
const SEMITONS = { C: -9, D: -7, E: -5, F: -4, G: -2, A: 0, B: 2 };
function freq(nota) {
  const [, letra, oitava] = nota.match(/^([A-G])(\d)$/);
  return 440 * 2 ** ((SEMITONS[letra] + (Number(oitava) - 4) * 12) / 12);
}
// Terça abaixo dentro da escala de dó maior (para a segunda voz)
function tercaAbaixo(nota) {
  const [, letra, oitava] = nota.match(/^([A-G])(\d)$/);
  const i = ESCALA.indexOf(letra) + Number(oitava) * 7 - 2;
  return ESCALA[i % 7] + Math.floor(i / 7);
}

// Acordes: [baixo, ...notas do acorde]
const C = ['C3', 'C4', 'E4', 'G4'];
const G = ['G2', 'B3', 'D4', 'G4'];
const Am = ['A2', 'C4', 'E4', 'A4'];
const F = ['F2', 'A3', 'C4', 'F4'];

// Melodias: [nota, duração em semicolcheias] ('-' = pausa). Cada compasso soma 16.
const TEMA = [
  [['G4', 4], ['C5', 2], ['D5', 2], ['E5', 6], ['G5', 2]],
  [['D5', 4], ['B4', 2], ['G4', 2], ['D5', 6], ['-', 2]],
  [['C5', 2], ['D5', 2], ['E5', 4], ['A5', 4], ['G5', 4]],
  [['F5', 4], ['E5', 2], ['D5', 2], ['C5', 4], ['A4', 4]],
  [['G4', 4], ['C5', 2], ['E5', 2], ['G5', 6], ['A5', 2]],
  [['G5', 4], ['F5', 2], ['E5', 2], ['D5', 6], ['G4', 2]],
  [['A4', 2], ['C5', 2], ['F5', 4], ['E5', 2], ['D5', 2], ['C5', 4]],
  [['B4', 4], ['C5', 2], ['D5', 2], ['G5', 8]],
];
const PARTE_B = [
  [['E5', 4], ['A5', 4], ['G5', 2], ['E5', 2], ['C5', 4]],
  [['F5', 6], ['E5', 2], ['F5', 2], ['A5', 2], ['C6', 4]],
  [['G5', 4], ['E5', 2], ['C5', 2], ['E5', 4], ['G5', 4]],
  [['D5', 6], ['E5', 2], ['D5', 2], ['B4', 2], ['G4', 4]],
  [['E5', 4], ['A5', 4], ['B5', 2], ['C6', 2], ['A5', 4]],
  [['C6', 4], ['A5', 2], ['F5', 2], ['A5', 6], ['G5', 2]],
  [['G5', 2], ['A5', 2], ['B5', 4], ['D6', 4], ['B5', 4]],
  [['G5', 4], ['A5', 2], ['B5', 2], ['D6', 8]],
];

function compassos(melodia, acordes, opcoes) {
  return melodia.map((linha, i) => {
    const notas = new Map();
    let passo = 0;
    for (const [nota, dur] of linha) {
      if (nota !== '-') notas.set(passo, { nota, dur });
      passo += dur;
    }
    return { acorde: acordes[i], notas, inicio: i === 0, fim: i === melodia.length - 1, ...opcoes };
  });
}

const ABERTURA = [
  { acorde: C, notas: new Map(), abertura: 1 },
  { acorde: G, notas: new Map(), abertura: 2 },
];
const CICLO = [
  ...compassos(TEMA, [C, G, Am, F, C, G, F, G], { bateria: 'leve', baixo: 'galope' }),
  ...compassos(PARTE_B, [Am, F, C, G, Am, F, G, G], { bateria: 'media', baixo: 'oitavas', cordas: true }),
  ...compassos(TEMA, [C, G, Am, F, C, G, F, G], { bateria: 'cheia', baixo: 'galope', cordas: true, segundaVoz: true, sinos: true }),
];

// ───────────── Saídas (com eco de sala) ─────────────
let audio = null;
let barramento = null; // volume geral da música
let entrada = null; // onde os instrumentos se ligam
let ecoArpejo = null;
let relogio = null;
let proximoTempo = 0;
let passoAtual = 0;
let aberturaTocada = false;
let tocando = false;

function montarSaidas() {
  const { ctx, mestre } = audio;
  barramento = ctx.createGain();
  barramento.gain.value = 0.0001;
  const compressor = ctx.createDynamicsCompressor();
  compressor.threshold.value = -16;
  compressor.ratio.value = 3;
  compressor.attack.value = 0.01;
  compressor.release.value = 0.2;
  entrada = ctx.createGain();

  // Reverberação: resposta de uma "sala" feita com ruído que vai sumindo
  const segundos = 1.9;
  const n = Math.floor(ctx.sampleRate * segundos);
  const impulso = ctx.createBuffer(2, n, ctx.sampleRate);
  for (let canal = 0; canal < 2; canal++) {
    const d = impulso.getChannelData(canal);
    for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n) ** 2.6;
  }
  const sala = ctx.createConvolver();
  sala.buffer = impulso;
  const molhado = ctx.createGain();
  molhado.gain.value = 0.22;

  entrada.connect(compressor);
  entrada.connect(sala).connect(molhado).connect(compressor);
  compressor.connect(barramento).connect(mestre);

  // Eco só do arpejo (repete 3 semicolcheias depois)
  ecoArpejo = ctx.createDelay(1);
  ecoArpejo.delayTime.value = PASSO * 3;
  const retorno = ctx.createGain();
  retorno.gain.value = 0.32;
  ecoArpejo.connect(retorno).connect(ecoArpejo);
  ecoArpejo.connect(entrada);
}

const lado = (pan) => {
  const { ctx } = audio;
  if (!ctx.createStereoPanner) return entrada;
  const p = ctx.createStereoPanner();
  p.pan.value = pan;
  p.connect(entrada);
  return p;
};

// ───────────── Instrumentos ─────────────
function envelope(g, t, pico, ataque, duracao) {
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(pico, t + ataque);
  g.gain.exponentialRampToValueAtTime(0.0001, t + duracao);
}

// Metais (tipo trompete): duas ondas "serra" e um filtro que abre no ataque
function metais(f, t, dur, vol = 0.085, brilho = 1) {
  const { ctx } = audio;
  const fim = t + Math.max(0.14, dur * 0.94);
  const filtro = ctx.createBiquadFilter();
  filtro.type = 'lowpass';
  filtro.Q.value = 1.2;
  filtro.frequency.setValueAtTime(500, t);
  filtro.frequency.linearRampToValueAtTime(3400 * brilho, t + 0.045);
  filtro.frequency.exponentialRampToValueAtTime(1500 * brilho, t + 0.32);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + 0.025);
  g.gain.exponentialRampToValueAtTime(vol * 0.72, t + 0.2);
  g.gain.setValueAtTime(vol * 0.72, Math.max(t + 0.2, fim - 0.06));
  g.gain.exponentialRampToValueAtTime(0.0001, fim + 0.09);
  const vib = ctx.createOscillator();
  vib.frequency.value = 5.6;
  const vibG = ctx.createGain();
  vibG.gain.setValueAtTime(0, t);
  vibG.gain.setValueAtTime(0, t + 0.3);
  vibG.gain.linearRampToValueAtTime(dur > 0.45 ? 10 : 0, t + 0.55);
  vib.connect(vibG);
  const fontes = [vib];
  for (const desafino of [-5, 6]) {
    const o = ctx.createOscillator();
    o.type = 'sawtooth';
    o.frequency.value = f;
    o.detune.value = desafino;
    vibG.connect(o.detune);
    o.connect(filtro);
    fontes.push(o);
  }
  filtro.connect(g).connect(entrada);
  for (const o of fontes) { o.start(t); o.stop(fim + 0.12); }
}

// Sininhos dobrando a melodia uma oitava acima
function sino(f, t) {
  const { ctx } = audio;
  const g = ctx.createGain();
  envelope(g, t, 0.04, 0.004, 0.7);
  for (const [mult, ganho] of [[2, 1], [4.02, 0.35]]) {
    const o = ctx.createOscillator();
    o.frequency.value = f * mult;
    const gg = ctx.createGain();
    gg.gain.value = ganho;
    o.connect(gg).connect(g);
    o.start(t);
    o.stop(t + 0.75);
  }
  g.connect(lado(0.3));
}

// Cordas: o acorde sustentado durante o compasso
function cordas(notas, t, dur) {
  const { ctx } = audio;
  const filtro = ctx.createBiquadFilter();
  filtro.type = 'lowpass';
  filtro.frequency.value = 1500;
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(0.05, t + 0.3);
  g.gain.setValueAtTime(0.05, t + dur - 0.1);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.35);
  for (const nota of notas) {
    for (const desafino of [-8, 8]) {
      const o = ctx.createOscillator();
      o.type = 'sawtooth';
      o.frequency.value = freq(nota);
      o.detune.value = desafino;
      o.connect(filtro);
      o.start(t);
      o.stop(t + dur + 0.4);
    }
  }
  filtro.connect(g).connect(lado(-0.25));
}

function baixo(f, t, vol = 0.17) {
  const { ctx } = audio;
  const o = ctx.createOscillator();
  o.type = 'sawtooth';
  o.frequency.value = f;
  const sub = ctx.createOscillator();
  sub.frequency.value = f;
  const filtro = ctx.createBiquadFilter();
  filtro.type = 'lowpass';
  filtro.frequency.setValueAtTime(950, t);
  filtro.frequency.exponentialRampToValueAtTime(240, t + 0.18);
  const g = ctx.createGain();
  envelope(g, t, vol, 0.008, 0.24);
  o.connect(filtro).connect(g);
  sub.connect(g);
  g.connect(entrada);
  for (const x of [o, sub]) { x.start(t); x.stop(t + 0.3); }
}

function arpejo(f, t, pan) {
  const { ctx } = audio;
  const o = ctx.createOscillator();
  o.type = 'triangle';
  o.frequency.value = f;
  const g = ctx.createGain();
  envelope(g, t, 0.05, 0.005, 0.2);
  o.connect(g);
  g.connect(lado(pan));
  g.connect(ecoArpejo);
  o.start(t);
  o.stop(t + 0.25);
}

function tambor(t, { de, para, vol, dur }) {
  const { ctx } = audio;
  const o = ctx.createOscillator();
  o.frequency.setValueAtTime(de, t);
  o.frequency.exponentialRampToValueAtTime(para, t + dur * 0.6);
  const g = ctx.createGain();
  envelope(g, t, vol, 0.003, dur);
  o.connect(g).connect(entrada);
  o.start(t);
  o.stop(t + dur + 0.05);
}
const bumbo = (t) => tambor(t, { de: 140, para: 45, vol: 0.45, dur: 0.22 });
const timpano = (t, f, vol = 0.4) => tambor(t, { de: f * 1.12, para: f, vol, dur: 0.9 });
const tom = (t, f) => tambor(t, { de: f * 1.4, para: f, vol: 0.3, dur: 0.22 });

function ruido(t, { corte, tipo = 'highpass', vol, dur, pan = 0 }) {
  const { ctx } = audio;
  const src = ctx.createBufferSource();
  src.buffer = bufferDeRuido();
  const filtro = ctx.createBiquadFilter();
  filtro.type = tipo;
  filtro.frequency.value = corte;
  const g = ctx.createGain();
  envelope(g, t, vol, 0.002, dur);
  src.connect(filtro).connect(g).connect(pan ? lado(pan) : entrada);
  src.start(t, Math.random() * 1.5);
  src.stop(t + dur + 0.02);
}
function caixa(t, vol = 0.16) {
  ruido(t, { corte: 1400, vol, dur: 0.14 });
  tambor(t, { de: 230, para: 150, vol: vol * 0.6, dur: 0.09 });
}
const chimbal = (t, vol) => ruido(t, { corte: 7500, vol, dur: 0.04, pan: 0.2 });
const prato = (t) => ruido(t, { corte: 4500, vol: 0.075, dur: 1.6 });

// ───────────── Sequenciador ─────────────
function tocarAbertura(c, p, t) {
  const [raiz, ...notas] = c.acorde;
  if (p === 0) {
    cordas(notas, t, PASSO * POR_COMPASSO);
    timpano(t, freq(raiz) / 2);
  }
  // arpejo subindo, cada vez mais agudo
  if (p % 2 === 0) arpejo(freq(notas[(p / 2) % 3]) * (c.abertura === 1 ? 2 : 4), t, p % 4 ? -0.4 : 0.4);
  if (c.abertura === 1 && p === 8) timpano(t, freq(raiz) / 2, 0.3);
  if (c.abertura === 2) {
    if (p % 4 === 0) timpano(t, freq(raiz) / 2, 0.25 + p * 0.012);
    if (p >= 8) caixa(t, 0.05 + (p - 8) * 0.016); // rufar crescendo
    if (p === 0) metais(freq('G4'), t, PASSO * 8, 0.06);
    if (p === 8) metais(freq('B4'), t, PASSO * 4, 0.07);
    if (p === 12) metais(freq('D5'), t, PASSO * 4, 0.08);
  }
}

function tocarPasso(c, p, t) {
  if (c.abertura) { tocarAbertura(c, p, t); return; }
  const [raiz, ...notas] = c.acorde;

  // Bateria
  const bumbos = { leve: [0, 8], media: [0, 8, 10], cheia: [0, 6, 8, 11] }[c.bateria];
  if (bumbos.includes(p)) bumbo(t);
  if (p === 4 || p === 12) caixa(t);
  if (c.bateria === 'cheia') chimbal(t, p % 4 === 2 ? 0.05 : p % 2 ? 0.018 : 0.03);
  else if (p % 2 === 0) chimbal(t, p % 4 === 2 ? 0.045 : 0.025);
  if (c.inicio && p === 0) prato(t);
  if (c.fim && p >= 12) { // virada de tambores no fim de cada parte
    tom(t, [220, 185, 150, 120][p - 12]);
    if (p >= 14) caixa(t, 0.12);
  }

  // Baixo
  if (c.baixo === 'galope') {
    if ([0, 3, 6, 8, 11, 14].includes(p)) baixo(freq(raiz) * (p === 8 ? 1.5 : p === 14 ? 2 : 1), t);
  } else if (p % 2 === 0) {
    baixo(freq(raiz) * (p % 4 === 2 ? 2 : 1), t, 0.14);
  }

  // Harmonia
  if (c.cordas && p === 0) cordas(notas, t, PASSO * POR_COMPASSO);
  if (p % 2 === 0) arpejo(freq(notas[[0, 1, 2, 1][(p / 2) % 4]]) * 2, t, p % 4 ? -0.35 : 0.35);

  // Melodia (com segunda voz e sininhos na última parte)
  const n = c.notas.get(p);
  if (n) {
    const dur = n.dur * PASSO;
    metais(freq(n.nota), t, dur);
    if (c.segundaVoz) metais(freq(tercaAbaixo(n.nota)), t, dur, 0.04, 0.7);
    if (c.sinos) sino(freq(n.nota), t);
  }
}

function agendar() {
  const { ctx } = audio;
  while (proximoTempo < ctx.currentTime + 0.15) {
    const total = (aberturaTocada ? CICLO : ABERTURA).length * POR_COMPASSO;
    const lista = aberturaTocada ? CICLO : ABERTURA;
    tocarPasso(lista[Math.floor(passoAtual / POR_COMPASSO)], passoAtual % POR_COMPASSO, proximoTempo);
    proximoTempo += PASSO;
    passoAtual++;
    if (passoAtual >= total) { passoAtual = 0; aberturaTocada = true; }
  }
}

/** Começa a música (com a abertura), com entrada suave. */
export function tocarMusica() {
  audio = saidaDeAudio();
  if (!audio || tocando) return;
  const { ctx } = audio;
  if (ctx.state !== 'running') {
    // o áudio ainda está "acordando": tenta de novo quando estiver pronto
    ctx.resume().then(() => { if (ctx.state === 'running') tocarMusica(); }).catch(() => {});
    return;
  }
  tocando = true;
  if (!barramento) montarSaidas();
  barramento.gain.cancelScheduledValues(ctx.currentTime);
  barramento.gain.setValueAtTime(0.0001, ctx.currentTime);
  barramento.gain.exponentialRampToValueAtTime(VOLUME, ctx.currentTime + 0.6);
  passoAtual = 0;
  aberturaTocada = false;
  proximoTempo = ctx.currentTime + 0.1;
  clearInterval(relogio);
  relogio = setInterval(agendar, 25);
  agendar();
}

/** Para a música com saída suave. */
export function pararMusica(fade = 0.6) {
  if (!tocando || !audio) return;
  tocando = false;
  const { ctx } = audio;
  barramento.gain.cancelScheduledValues(ctx.currentTime);
  barramento.gain.setTargetAtTime(0.0001, ctx.currentTime, fade / 3);
  const r = relogio;
  setTimeout(() => { if (!tocando) clearInterval(r); }, fade * 1000 + 200);
}

export const musicaTocando = () => tocando;
