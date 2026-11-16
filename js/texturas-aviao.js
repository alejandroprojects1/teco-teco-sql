// Texturas do teco-teco, desenhadas em código (canvas): madeira, tecido das asas,
// metal do motor e borracha dos pneus. Cada uma tem a imagem de cor e um "relevo"
// (bumpMap) para as tábuas, nervuras e rebites pegarem luz.
import * as THREE from '../vendor/three.module.min.js';

// Sorteio com semente fixa: o avião fica igual toda vez que o jogo abre
function sorteador(semente) {
  let a = semente;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function tela(largura, altura) {
  const c = document.createElement('canvas');
  c.width = largura;
  c.height = altura;
  return [c, c.getContext('2d')];
}

function paraTextura(canvas, { cor = true, repetir = [1, 1], deslocar = [0, 0] } = {}) {
  const t = new THREE.CanvasTexture(canvas);
  if (cor) t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = THREE.RepeatWrapping;
  t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(...repetir);
  t.offset.set(...deslocar);
  t.anisotropy = 4;
  return t;
}

// ───────────── Madeira (tábuas com veios e nós) ─────────────
// O canvas tem 2 tábuas lado a lado; os veios correm na vertical e emendam em cima/embaixo.
function madeira() {
  const T = 256;
  const [c, g] = tela(T, T);
  const [r, h] = tela(T, T);
  const rnd = sorteador(7);
  const tons = ['#dba55f', '#cf9650'];
  h.fillStyle = '#8c8c8c';
  h.fillRect(0, 0, T, T);

  tons.forEach((tom, i) => {
    g.fillStyle = tom;
    g.fillRect(i * T / 2, 0, T / 2, T);
  });

  // Veios: linhas onduladas (ondas inteiras na altura, para emendar)
  for (let i = 0; i < 90; i++) {
    const x0 = rnd() * T;
    const amp = 1.5 + rnd() * 5;
    const ondas = 1 + Math.floor(rnd() * 3);
    const fase = rnd() * Math.PI * 2;
    const claro = rnd() < 0.3;
    g.strokeStyle = claro ? `rgba(255, 226, 170, ${0.1 + rnd() * 0.15})` : `rgba(110, 62, 22, ${0.08 + rnd() * 0.2})`;
    g.lineWidth = 0.6 + rnd() * 1.8;
    g.beginPath();
    for (let y = 0; y <= T; y += 8) {
      const x = x0 + Math.sin((y / T) * Math.PI * 2 * ondas + fase) * amp;
      if (y === 0) g.moveTo(x, y); else g.lineTo(x, y);
    }
    g.stroke();
    if (!claro && rnd() < 0.35) { // alguns veios também viram um risquinho no relevo
      h.strokeStyle = 'rgba(40, 40, 40, 0.18)';
      h.lineWidth = 1;
      h.beginPath(); h.moveTo(x0, 0); h.lineTo(x0, T); h.stroke();
    }
  }

  // Nós da madeira
  for (const [x, y, raio] of [[44, 70, 9], [176, 182, 7]]) {
    for (let k = 4; k >= 0; k--) {
      g.strokeStyle = `rgba(96, 52, 18, ${0.16 + k * 0.05})`;
      g.lineWidth = 1.4;
      g.beginPath();
      g.ellipse(x, y, raio * (0.3 + k * 0.28), raio * (0.6 + k * 0.45), 0, 0, Math.PI * 2);
      g.stroke();
    }
    g.fillStyle = 'rgba(86, 46, 16, 0.75)';
    g.beginPath(); g.ellipse(x, y, raio * 0.3, raio * 0.5, 0, 0, Math.PI * 2); g.fill();
  }

  // Emendas entre as tábuas: risco escuro com um filete claro ao lado
  for (const x of [0, T / 2, T]) {
    g.fillStyle = 'rgba(70, 38, 14, 0.75)';
    g.fillRect(x - 1.5, 0, 3, T);
    g.fillStyle = 'rgba(255, 230, 180, 0.28)';
    g.fillRect(x + 2, 0, 1.5, T);
    h.fillStyle = '#2a2a2a';
    h.fillRect(x - 2, 0, 4, T);
  }
  return { cor: c, relevo: r };
}

// ───────────── Tecido das asas (lona com nervuras e costura) ─────────────
// Largura do canvas = espaço entre duas nervuras; altura = da frente (embaixo) até a ponta de trás.
function tecido() {
  const T = 256;
  const [c, g] = tela(T, T);
  const [r, h] = tela(T, T);
  const rnd = sorteador(21);

  g.fillStyle = '#d6493c';
  g.fillRect(0, 0, T, T);

  // A lona "afunda" entre as nervuras: mais clara perto delas, mais escura no meio
  const sombra = g.createLinearGradient(0, 0, T, 0);
  sombra.addColorStop(0, 'rgba(255, 190, 170, 0.20)');
  sombra.addColorStop(0.5, 'rgba(60, 0, 0, 0.14)');
  sombra.addColorStop(1, 'rgba(255, 190, 170, 0.20)');
  g.fillStyle = sombra;
  g.fillRect(0, 0, T, T);
  const altura = h.createLinearGradient(0, 0, T, 0);
  altura.addColorStop(0, '#e6e6e6');
  altura.addColorStop(0.12, '#909090');
  altura.addColorStop(0.5, '#6e6e6e');
  altura.addColorStop(0.88, '#909090');
  altura.addColorStop(1, '#e6e6e6');
  h.fillStyle = altura;
  h.fillRect(0, 0, T, T);

  // Trama do tecido
  for (let i = 0; i < T; i += 2) {
    g.fillStyle = `rgba(90, 10, 5, ${0.03 + rnd() * 0.05})`;
    g.fillRect(0, i, T, 1);
    g.fillStyle = `rgba(255, 200, 180, ${0.02 + rnd() * 0.04})`;
    g.fillRect(i, 0, 1, T);
  }
  // Manchas leves de uso
  for (let i = 0; i < 14; i++) {
    const x = rnd() * T, y = rnd() * T, raio = 20 + rnd() * 45;
    const m = g.createRadialGradient(x, y, 0, x, y, raio);
    m.addColorStop(0, rnd() < 0.5 ? 'rgba(255, 215, 190, 0.07)' : 'rgba(70, 0, 0, 0.07)');
    m.addColorStop(1, 'rgba(0, 0, 0, 0)');
    g.fillStyle = m;
    g.fillRect(x - raio, y - raio, raio * 2, raio * 2);
  }

  // Nervura (nas bordas do canvas) com fita de reforço e costura pontilhada
  for (const x of [0, T]) {
    g.fillStyle = 'rgba(170, 45, 35, 0.9)';
    g.fillRect(x - 9, 0, 18, T);
    g.fillStyle = 'rgba(105, 20, 14, 0.85)';
    g.fillRect(x - 1.5, 0, 3, T);
  }
  g.fillStyle = 'rgba(255, 214, 196, 0.75)';
  for (let y = 4; y < T; y += 12) {
    g.fillRect(6, y, 2, 6);
    g.fillRect(T - 8, y, 2, 6);
  }

  // Borda da frente (embaixo no canvas): faixa de reforço; borda de trás: filete escuro
  g.fillStyle = 'rgba(95, 15, 10, 0.22)';
  g.fillRect(0, T - 30, T, 30);
  g.fillStyle = 'rgba(95, 15, 10, 0.55)';
  g.fillRect(0, T - 32, T, 2);
  g.fillRect(0, 0, T, 5);
  h.fillStyle = 'rgba(255, 255, 255, 0.3)';
  h.fillRect(0, T - 30, T, 30);
  return { cor: c, relevo: r };
}

// ───────────── Metal do motor (escovado, com rebites) ─────────────
function metal() {
  const L = 256, A = 64;
  const [c, g] = tela(L, A);
  const [r, h] = tela(L, A);
  const rnd = sorteador(3);
  g.fillStyle = '#676a72';
  g.fillRect(0, 0, L, A);
  h.fillStyle = '#808080';
  h.fillRect(0, 0, L, A);
  for (let i = 0; i < 260; i++) { // riscos do metal escovado
    g.fillStyle = rnd() < 0.5 ? `rgba(255, 255, 255, ${0.03 + rnd() * 0.07})` : `rgba(0, 0, 0, ${0.04 + rnd() * 0.08})`;
    g.fillRect(rnd() * L, rnd() * A, 30 + rnd() * 120, 1);
  }
  // Desgaste claro nas bordas
  const borda = g.createLinearGradient(0, 0, 0, A);
  borda.addColorStop(0, 'rgba(255, 255, 255, 0.18)');
  borda.addColorStop(0.18, 'rgba(255, 255, 255, 0)');
  borda.addColorStop(0.82, 'rgba(0, 0, 0, 0)');
  borda.addColorStop(1, 'rgba(0, 0, 0, 0.25)');
  g.fillStyle = borda;
  g.fillRect(0, 0, L, A);
  // Emenda das chapas e rebites
  g.fillStyle = 'rgba(25, 26, 30, 0.8)';
  g.fillRect(0, 0, 2, A);
  h.fillStyle = '#303030';
  h.fillRect(0, 0, 3, A);
  for (let x = 16; x < L; x += 32) {
    for (const y of [10, A - 10]) {
      g.fillStyle = 'rgba(20, 20, 24, 0.55)';
      g.beginPath(); g.arc(x + 1, y + 1, 3.4, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#a4a8b0';
      g.beginPath(); g.arc(x, y, 3, 0, Math.PI * 2); g.fill();
      g.fillStyle = 'rgba(255, 255, 255, 0.6)';
      g.beginPath(); g.arc(x - 1, y - 1, 1.1, 0, Math.PI * 2); g.fill();
      h.fillStyle = '#ffffff';
      h.beginPath(); h.arc(x, y, 3.2, 0, Math.PI * 2); h.fill();
    }
  }
  return { cor: c, relevo: r };
}

// ───────────── Frente do motor (aletas de refrigeração) ─────────────
function frenteDoMotor() {
  const T = 256, m = T / 2;
  const [c, g] = tela(T, T);
  g.fillStyle = '#26282c';
  g.fillRect(0, 0, T, T);
  const aletas = 18;
  for (let i = 0; i < aletas; i++) {
    const a0 = (i / aletas) * Math.PI * 2;
    const a1 = a0 + (Math.PI * 2 / aletas) * 0.62;
    g.fillStyle = i % 2 ? '#80848c' : '#6a6e76';
    g.beginPath();
    g.arc(m, m, 120, a0, a1);
    g.arc(m, m, 44, a1, a0, true);
    g.closePath();
    g.fill();
    g.strokeStyle = 'rgba(255, 255, 255, 0.22)';
    g.lineWidth = 1.5;
    g.beginPath(); g.arc(m, m, 118, a0, a1); g.stroke();
  }
  // Anéis das aletas
  g.strokeStyle = 'rgba(20, 21, 24, 0.7)';
  g.lineWidth = 3;
  for (const raio of [66, 88, 106]) { g.beginPath(); g.arc(m, m, raio, 0, Math.PI * 2); g.stroke(); }
  // Miolo com parafusos
  g.fillStyle = '#8f939b';
  g.beginPath(); g.arc(m, m, 40, 0, Math.PI * 2); g.fill();
  g.fillStyle = '#4a4d54';
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    g.beginPath(); g.arc(m + Math.cos(a) * 29, m + Math.sin(a) * 29, 4, 0, Math.PI * 2); g.fill();
  }
  g.fillStyle = '#3a3c42';
  g.beginPath(); g.arc(m, m, 16, 0, Math.PI * 2); g.fill();
  return { cor: c };
}

// ───────────── Pneu (sulcos em "V") ─────────────
function pneu() {
  const L = 64, A = 64;
  const [c, g] = tela(L, A);
  const [r, h] = tela(L, A);
  g.fillStyle = '#34353b';
  g.fillRect(0, 0, L, A);
  h.fillStyle = '#b0b0b0';
  h.fillRect(0, 0, L, A);
  for (const [ctx, cor] of [[g, '#17181b'], [h, '#202020']]) {
    ctx.strokeStyle = cor;
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.moveTo(L * 0.5, -4); ctx.lineTo(L * 0.1, A / 2); ctx.lineTo(L * 0.5, A + 4);
    ctx.stroke();
  }
  g.fillStyle = 'rgba(255, 255, 255, 0.07)';
  g.fillRect(L * 0.62, 0, 6, A);
  return { cor: c, relevo: r };
}

/** Cria todas as texturas do avião. */
export function criarTexturas() {
  const md = madeira();
  const tc = tecido();
  const mt = metal();
  const pn = pneu();
  return {
    // Fuselagem: 10 tábuas ao redor (5 repetições × 2 tábuas), que casam com as faces do cilindro
    tabuas: { map: paraTextura(md.cor, { repetir: [5, 3] }), bumpMap: paraTextura(md.relevo, { cor: false, repetir: [5, 3] }) },
    // Peças pequenas de madeira (hastes, hélice, eixo): só os veios
    madeira: { map: paraTextura(md.cor, { repetir: [0.5, 1] }) },
    // Asas e cauda: uma nervura a cada 0,5 de envergadura; a corda da asa ocupa a altura da imagem
    tecido: {
      map: paraTextura(tc.cor, { repetir: [2, 1], deslocar: [0, 0.5] }),
      bumpMap: paraTextura(tc.relevo, { cor: false, repetir: [2, 1], deslocar: [0, 0.5] }),
    },
    metal: { map: paraTextura(mt.cor, { repetir: [4, 1] }), bumpMap: paraTextura(mt.relevo, { cor: false, repetir: [4, 1] }) },
    motor: { map: paraTextura(frenteDoMotor().cor) },
    pneu: { map: paraTextura(pn.cor, { repetir: [14, 1] }), bumpMap: paraTextura(pn.relevo, { cor: false, repetir: [14, 1] }) },
  };
}
