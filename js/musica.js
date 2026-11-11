// Música de aventura do Teco-Teco SQL (composição original, gerada no navegador).
// 8 compassos em dó maior que se repetem: melodia, baixo galopante, arpejo e bateria.
import { saidaDeAudio, bufferDeRuido } from './audio.js';

const BPM = 116;
const SEMICOLCHEIA = 60 / BPM / 4; // duração de 1 passo (1/16 de compasso)
const PASSOS_POR_COMPASSO = 16;
const VOLUME = 0.9;

// Nome da nota → frequência (A4 = 440 Hz)
const SEMITONS = { C: -9, D: -7, E: -5, F: -4, G: -2, A: 0, B: 2 };
function freq(nota) {
  const [, letra, oitava] = nota.match(/^([A-G])(\d)$/);
  return 440 * 2 ** ((SEMITONS[letra] + (Number(oitava) - 4) * 12) / 12);
}

// Acordes de cada compasso: C  G  Am  F  C  G  F  G
const ACORDES = [
  ['C3', 'C4', 'E4', 'G4'],
  ['G2', 'B3', 'D4', 'G4'],
  ['A2', 'C4', 'E4', 'A4'],
  ['F2', 'A3', 'C4', 'F4'],
  ['C3', 'C4', 'E4', 'G4'],
  ['G2', 'B3', 'D4', 'G4'],
  ['F2', 'A3', 'C4', 'F4'],
  ['G2', 'B3', 'D4', 'G4'],
];

// Melodia: [nota, duração em semicolcheias] ('-' = pausa). Cada compasso soma 16.
const MELODIA = [
  [['G4', 4], ['C5', 2], ['D5', 2], ['E5', 6], ['G5', 2]],
  [['D5', 4], ['B4', 2], ['G4', 2], ['D5', 6], ['-', 2]],
  [['C5', 2], ['D5', 2], ['E5', 4], ['A5', 4], ['G5', 4]],
  [['F5', 4], ['E5', 2], ['D5', 2], ['C5', 4], ['A4', 4]],
  [['G4', 4], ['C5', 2], ['E5', 2], ['G5', 6], ['A5', 2]],
  [['G5', 4], ['F5', 2], ['E5', 2], ['D5', 6], ['G4', 2]],
  [['A4', 2], ['C5', 2], ['F5', 4], ['E5', 2], ['D5', 2], ['C5', 4]],
  [['B4', 4], ['C5', 2], ['D5', 2], ['G5', 8]],
];

// Converte a melodia em "nota que começa no passo X"
const NOTAS_MELODIA = new Map();
MELODIA.forEach((compasso, c) => {
  let passo = c * PASSOS_POR_COMPASSO;
  for (const [nota, dur] of compasso) {
    if (nota !== '-') NOTAS_MELODIA.set(passo, { f: freq(nota), dur });
    passo += dur;
  }
});
const TOTAL_PASSOS = MELODIA.length * PASSOS_POR_COMPASSO;

let audio = null;
let barramento = null;
let relogio = null;
let proximoTempo = 0;
let passoAtual = 0;
let tocando = false;

// ───────────── Instrumentos ─────────────
function envelope(g, t, pico, ataque, duracao) {
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(pico, t + ataque);
  g.gain.exponentialRampToValueAtTime(0.0001, t + duracao);
}

function melodia(f, t, dur) {
  const { ctx } = audio;
  const g = ctx.createGain();
  const filtro = ctx.createBiquadFilter();
  filtro.type = 'lowpass';
  filtro.frequency.value = 2600;
  const a = ctx.createOscillator();
  a.type = 'square';
  a.frequency.value = f;
  const b = ctx.createOscillator();
  b.type = 'triangle';
  b.frequency.value = f * 2;
  b.detune.value = 6;
  const gb = ctx.createGain();
  gb.gain.value = 0.35;
  // vibrato leve nas notas longas
  const vib = ctx.createOscillator();
  vib.frequency.value = 5.5;
  const vibG = ctx.createGain();
  vibG.gain.value = dur > 0.4 ? 9 : 0;
  vib.connect(vibG).connect(a.detune);
  a.connect(filtro);
  b.connect(gb).connect(filtro);
  filtro.connect(g).connect(barramento);
  const fim = t + Math.max(0.12, dur * 0.95);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(0.11, t + 0.015);
  g.gain.exponentialRampToValueAtTime(0.07, t + 0.15);
  g.gain.setValueAtTime(0.07, fim - 0.05);
  g.gain.exponentialRampToValueAtTime(0.0001, fim + 0.08);
  for (const o of [a, b, vib]) { o.start(t); o.stop(fim + 0.1); }
}

function baixo(f, t) {
  const { ctx } = audio;
  const o = ctx.createOscillator();
  o.type = 'sawtooth';
  o.frequency.value = f;
  const filtro = ctx.createBiquadFilter();
  filtro.type = 'lowpass';
  filtro.frequency.setValueAtTime(900, t);
  filtro.frequency.exponentialRampToValueAtTime(260, t + 0.18);
  const g = ctx.createGain();
  envelope(g, t, 0.16, 0.008, 0.24);
  o.connect(filtro).connect(g).connect(barramento);
  o.start(t);
  o.stop(t + 0.3);
}

function arpejo(f, t) {
  const { ctx } = audio;
  const o = ctx.createOscillator();
  o.type = 'triangle';
  o.frequency.value = f;
  const g = ctx.createGain();
  envelope(g, t, 0.05, 0.005, 0.22);
  o.connect(g).connect(barramento);
  o.start(t);
  o.stop(t + 0.25);
}

function bumbo(t) {
  const { ctx } = audio;
  const o = ctx.createOscillator();
  o.frequency.setValueAtTime(140, t);
  o.frequency.exponentialRampToValueAtTime(45, t + 0.13);
  const g = ctx.createGain();
  envelope(g, t, 0.42, 0.003, 0.22);
  o.connect(g).connect(barramento);
  o.start(t);
  o.stop(t + 0.25);
}

function ruido(t, { corte, tipo = 'highpass', vol, dur }) {
  const { ctx } = audio;
  const src = ctx.createBufferSource();
  src.buffer = bufferDeRuido();
  const filtro = ctx.createBiquadFilter();
  filtro.type = tipo;
  filtro.frequency.value = corte;
  const g = ctx.createGain();
  envelope(g, t, vol, 0.002, dur);
  src.connect(filtro).connect(g).connect(barramento);
  src.start(t, Math.random() * 1.5);
  src.stop(t + dur + 0.02);
}

const caixa = (t) => {
  ruido(t, { corte: 1400, vol: 0.16, dur: 0.14 });
  const { ctx } = audio;
  const o = ctx.createOscillator();
  o.type = 'triangle';
  o.frequency.setValueAtTime(220, t);
  o.frequency.exponentialRampToValueAtTime(140, t + 0.08);
  const g = ctx.createGain();
  envelope(g, t, 0.1, 0.002, 0.09);
  o.connect(g).connect(barramento);
  o.start(t);
  o.stop(t + 0.1);
};
const chimbal = (t, forte) => ruido(t, { corte: 7000, vol: forte ? 0.045 : 0.025, dur: 0.04 });
const prato = (t) => ruido(t, { corte: 5000, vol: 0.06, dur: 1.2 });

// ───────────── Sequenciador ─────────────
function tocarPasso(passo, t) {
  const compasso = Math.floor(passo / PASSOS_POR_COMPASSO);
  const p = passo % PASSOS_POR_COMPASSO;
  const [raiz, ...notas] = ACORDES[compasso];

  // Bateria
  if (p === 0 || p === 8 || (p === 10 && compasso % 2 === 1)) bumbo(t);
  if (p === 4 || p === 12) caixa(t);
  if (p % 2 === 0) chimbal(t, p % 4 === 2);
  if (passo === 0) prato(t);

  // Baixo "galopante"
  if ([0, 3, 6, 8, 11, 14].includes(p)) {
    const f = freq(raiz) * (p === 8 ? 1.5 : p === 14 ? 2 : 1);
    baixo(f, t);
  }

  // Arpejo do acorde (sobe e desce)
  if (p % 2 === 0) {
    const ordem = [0, 1, 2, 1];
    arpejo(freq(notas[ordem[(p / 2) % 4]]) * 2, t);
  }

  // Melodia
  const n = NOTAS_MELODIA.get(passo);
  if (n) melodia(n.f, t, n.dur * SEMICOLCHEIA);
}

function agendar() {
  const { ctx } = audio;
  while (proximoTempo < ctx.currentTime + 0.15) {
    tocarPasso(passoAtual, proximoTempo);
    proximoTempo += SEMICOLCHEIA;
    passoAtual = (passoAtual + 1) % TOTAL_PASSOS;
  }
}

/** Começa (ou continua) a música, com entrada suave. */
export function tocarMusica() {
  audio = saidaDeAudio();
  if (!audio || tocando) return;
  const { ctx, mestre } = audio;
  if (ctx.state !== 'running') {
    // o áudio ainda está "acordando": tenta de novo quando estiver pronto
    ctx.resume().then(() => { if (ctx.state === 'running') tocarMusica(); }).catch(() => {});
    return;
  }
  tocando = true;
  if (!barramento) {
    barramento = ctx.createGain();
    barramento.connect(mestre);
  }
  barramento.gain.cancelScheduledValues(ctx.currentTime);
  barramento.gain.setValueAtTime(0.0001, ctx.currentTime);
  barramento.gain.exponentialRampToValueAtTime(VOLUME, ctx.currentTime + 1.2);
  passoAtual = 0;
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
