// Efeitos sonoros sintetizados com Web Audio (sem arquivos de áudio).
let ctx = null;
let mestre = null;
let motor = null;
let mudo = false;
try { mudo = localStorage.getItem('teco:mudo') === '1'; } catch { /* sem armazenamento */ }

export function iniciarAudio() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
    mestre = ctx.createGain();
    mestre.gain.value = mudo ? 0 : 0.7;
    mestre.connect(ctx.destination);
  }
  if (ctx.state === 'suspended') ctx.resume();
}

export function estaMudo() { return mudo; }

export function alternarSom() {
  mudo = !mudo;
  try { localStorage.setItem('teco:mudo', mudo ? '1' : '0'); } catch { /* ignora */ }
  if (mestre) mestre.gain.setTargetAtTime(mudo ? 0 : 0.7, ctx.currentTime, 0.05);
  return mudo;
}

function tom(freq, dur, { tipo = 'sine', vol = 0.2, atraso = 0, freqFim = null } = {}) {
  if (!ctx) return;
  const t0 = ctx.currentTime + atraso;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = tipo;
  osc.frequency.setValueAtTime(freq, t0);
  if (freqFim) osc.frequency.exponentialRampToValueAtTime(freqFim, t0 + dur);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(vol, t0 + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(g).connect(mestre);
  osc.start(t0);
  osc.stop(t0 + dur + 0.05);
}

function ruido(dur, { vol = 0.3, filtro = 800 } = {}) {
  if (!ctx) return;
  const n = Math.floor(ctx.sampleRate * dur);
  const buf = ctx.createBuffer(1, n, ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n) ** 2;
  const src = ctx.createBufferSource();
  src.buffer = buf;
  const f = ctx.createBiquadFilter();
  f.type = 'lowpass';
  f.frequency.value = filtro;
  const g = ctx.createGain();
  g.gain.value = vol;
  src.connect(f).connect(g).connect(mestre);
  src.start();
}

export const som = {
  clique: () => tom(660, 0.05, { tipo: 'triangle', vol: 0.08 }),
  peca: () => tom(880, 0.06, { tipo: 'triangle', vol: 0.1 }),
  acerto: () => [523, 659, 784, 1047].forEach((f, i) => tom(f, 0.2, { tipo: 'triangle', vol: 0.18, atraso: i * 0.07 })),
  erro: () => {
    tom(240, 0.22, { tipo: 'square', vol: 0.07, freqFim: 150 });
    tom(170, 0.3, { tipo: 'square', vol: 0.06, atraso: 0.13, freqFim: 95 });
  },
  batida: () => {
    ruido(0.35, { vol: 0.5, filtro: 600 });
    tom(110, 0.3, { tipo: 'sine', vol: 0.3, freqFim: 45 });
  },
  estrela: () => {
    tom(1318, 0.12, { vol: 0.1 });
    tom(1976, 0.16, { vol: 0.08, atraso: 0.05 });
  },
  pergunta: () => {
    tom(587, 0.12, { tipo: 'triangle', vol: 0.12 });
    tom(880, 0.18, { tipo: 'triangle', vol: 0.12, atraso: 0.1 });
  },
  tique: () => tom(740, 0.09, { tipo: 'square', vol: 0.05 }),
  vai: () => tom(1175, 0.3, { tipo: 'triangle', vol: 0.14 }),
  fim: () => [784, 659, 523, 392].forEach((f, i) => tom(f, 0.25, { tipo: 'triangle', vol: 0.14, atraso: i * 0.12 })),
  vitoria: () => [523, 659, 784, 1047, 1319].forEach((f, i) => tom(f, 0.3, { tipo: 'triangle', vol: 0.15, atraso: i * 0.09 })),
};

// ───────────── Barulho do avião (motor + hélice + vento) ─────────────
// Volume do motor em relação aos outros sons (0 a 1)
const VOLUME_MOTOR = 0.42;

let ruidoBuffer = null;
function bufferDeRuido() {
  if (!ruidoBuffer) {
    const n = ctx.sampleRate * 2;
    ruidoBuffer = ctx.createBuffer(1, n, ctx.sampleRate);
    const d = ruidoBuffer.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
  }
  return ruidoBuffer;
}

function criarMotor() {
  const agora = ctx.currentTime;
  const fontes = [];
  const osc = (tipo, freq) => {
    const o = ctx.createOscillator();
    o.type = tipo;
    o.frequency.value = freq;
    fontes.push(o);
    return o;
  };
  const ganho = (v) => { const g = ctx.createGain(); g.gain.value = v; return g; };
  const filtro = (tipo, freq, q = 0.8) => {
    const f = ctx.createBiquadFilter();
    f.type = tipo;
    f.frequency.value = freq;
    f.Q.value = q;
    return f;
  };

  // Saída geral (liga e desliga suave)
  const saida = ganho(0);
  saida.connect(mestre);
  saida.gain.setTargetAtTime(VOLUME_MOTOR, agora, 0.35);

  // "Tuc-tuc" da hélice: um pulso rápido que modula o volume do motor
  const pulso = ganho(0.6);
  pulso.connect(saida);
  const helice = osc('sine', 26);
  const heliceForca = ganho(0.4);
  helice.connect(heliceForca).connect(pulso.gain);

  // Ronco do motor: dente de serra + oitava abaixo, filtrados
  const ronco = osc('sawtooth', 100);
  const sub = osc('square', 50);
  const filtroRonco = filtro('lowpass', 1000, 1.4);
  ronco.connect(ganho(0.55)).connect(filtroRonco);
  sub.connect(ganho(0.3)).connect(filtroRonco);
  filtroRonco.connect(pulso);

  // Leve oscilação do motor, para não soar "de máquina"
  const oscila = osc('sine', 0.6);
  const oscilaForca = ganho(12); // em cents
  oscila.connect(oscilaForca);
  oscilaForca.connect(ronco.detune);
  oscilaForca.connect(sub.detune);

  // Ar cortado pela hélice (ruído que também pulsa)
  const ar = ctx.createBufferSource();
  ar.buffer = bufferDeRuido();
  ar.loop = true;
  fontes.push(ar);
  const filtroAr = filtro('bandpass', 900, 0.7);
  ar.connect(filtroAr).connect(ganho(0.5)).connect(pulso);

  // Vento constante, bem baixinho
  const vento = ctx.createBufferSource();
  vento.buffer = bufferDeRuido();
  vento.loop = true;
  vento.playbackRate.value = 0.7;
  fontes.push(vento);
  vento.connect(filtro('lowpass', 450)).connect(ganho(0.25)).connect(saida);

  fontes.forEach((f) => f.start(agora));
  return { saida, fontes, ronco, sub, helice, filtroAr };
}

export function motorLigado(ligado) {
  if (!ctx) return;
  if (ligado && !motor) {
    motor = criarMotor();
  } else if (!ligado && motor) {
    const m = motor;
    motor = null;
    m.saida.gain.cancelScheduledValues(ctx.currentTime);
    m.saida.gain.setTargetAtTime(0, ctx.currentTime, 0.12);
    setTimeout(() => m.fontes.forEach((f) => { try { f.stop(); } catch { /* já parou */ } }), 700);
  }
}

// Quanto mais rápido o avião, mais agudo o motor e mais rápida a hélice
export function motorVelocidade(v) {
  if (!motor) return;
  const t = ctx.currentTime;
  motor.ronco.frequency.setTargetAtTime(78 + v * 1.25, t, 0.3);
  motor.sub.frequency.setTargetAtTime((78 + v * 1.25) / 2, t, 0.3);
  motor.helice.frequency.setTargetAtTime(18 + v * 0.45, t, 0.3);
  motor.filtroAr.frequency.setTargetAtTime(600 + v * 16, t, 0.3);
}

export function vibrar(padrao) {
  try { navigator.vibrate?.(padrao); } catch { /* ignora */ }
}
