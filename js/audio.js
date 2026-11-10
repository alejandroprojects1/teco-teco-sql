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

// Ronco suave do motor durante o voo
export function motorLigado(ligado) {
  if (!ctx) return;
  if (ligado && !motor) {
    const osc = ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.value = 62;
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 14;
    const lfoG = ctx.createGain();
    lfoG.gain.value = 0.006;
    const filtro = ctx.createBiquadFilter();
    filtro.type = 'lowpass';
    filtro.frequency.value = 260;
    const g = ctx.createGain();
    g.gain.value = 0;
    g.gain.setTargetAtTime(0.022, ctx.currentTime, 0.3);
    lfo.connect(lfoG).connect(g.gain);
    osc.connect(filtro).connect(g).connect(mestre);
    osc.start();
    lfo.start();
    motor = { osc, lfo, g };
  } else if (!ligado && motor) {
    const m = motor;
    motor = null;
    m.g.gain.setTargetAtTime(0, ctx.currentTime, 0.15);
    setTimeout(() => { m.osc.stop(); m.lfo.stop(); }, 600);
  }
}

export function motorVelocidade(v) {
  if (motor) motor.osc.frequency.setTargetAtTime(52 + v * 1.1, ctx.currentTime, 0.2);
}

export function vibrar(padrao) {
  try { navigator.vibrate?.(padrao); } catch { /* ignora */ }
}
