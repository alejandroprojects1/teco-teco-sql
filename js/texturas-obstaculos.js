// Texturas dos obstáculos, desenhadas em código (canvas):
// blocos de brinquedo com símbolos, telhas, balões com gomos e faixa, cesto de vime
// e nuvens de tempestade carregadas.
import * as THREE from '../vendor/three.module.min.js';
import { tela, paraTextura, sorteador } from './texturas-aviao.js';

const hex = (n) => '#' + n.toString(16).padStart(6, '0');
const escurecer = (n, f) => '#' + new THREE.Color(n).multiplyScalar(f).getHexString();

// ───────────── Blocos de brinquedo ─────────────
// A imagem é em tons de cinza claro: a cor do bloco vem do material (que "tinge" a textura).
// Assim a moldura fica na cor viva e o símbolo gravado, num tom mais escuro da mesma cor.
export const SIMBOLOS_DOS_BLOCOS = ['S', 'Q', 'L', '*', ';', '=', '<', '>'];

function bloco(simbolo, semente) {
  const T = 128;
  const [c, g] = tela(T, T);
  const [r, h] = tela(T, T);
  const rnd = sorteador(semente);

  // Moldura clara (parte mais alta do bloco)
  g.fillStyle = '#ffffff';
  g.fillRect(0, 0, T, T);
  h.fillStyle = '#f0f0f0';
  h.fillRect(0, 0, T, T);
  // Cantos e bordas um pouco gastos
  const borda = g.createRadialGradient(T / 2, T / 2, T * 0.45, T / 2, T / 2, T * 0.75);
  borda.addColorStop(0, 'rgba(0, 0, 0, 0)');
  borda.addColorStop(1, 'rgba(0, 0, 0, 0.22)');
  g.fillStyle = borda;
  g.fillRect(0, 0, T, T);

  // Painel rebaixado no meio
  const m = 15;
  g.fillStyle = 'rgba(0, 0, 0, 0.3)';
  g.fillRect(m - 2, m - 2, T - 2 * m + 4, T - 2 * m + 4); // sombra da moldura
  g.fillStyle = '#e2e2e2';
  g.fillRect(m, m, T - 2 * m, T - 2 * m);
  g.fillStyle = 'rgba(255, 255, 255, 0.55)'; // brilho na quina de baixo/direita
  g.fillRect(m, T - m - 2, T - 2 * m, 2);
  g.fillRect(T - m - 2, m, 2, T - 2 * m);
  h.fillStyle = '#9a9a9a';
  h.fillRect(m, m, T - 2 * m, T - 2 * m);

  // Veios de madeira bem leves
  for (let i = 0; i < 26; i++) {
    const y = rnd() * T;
    g.strokeStyle = `rgba(0, 0, 0, ${0.03 + rnd() * 0.06})`;
    g.lineWidth = 0.6 + rnd() * 1.2;
    g.beginPath();
    g.moveTo(0, y);
    g.bezierCurveTo(T * 0.3, y + rnd() * 8 - 4, T * 0.7, y + rnd() * 8 - 4, T, y + rnd() * 6 - 3);
    g.stroke();
  }

  // Símbolo gravado
  const fonte = '700 74px "Fredoka", "Arial Rounded MT Bold", "Trebuchet MS", Arial, sans-serif';
  for (const [ctx, cor, dx, dy] of [[g, 'rgba(255, 255, 255, 0.7)', 2, 2], [g, 'rgba(0, 0, 0, 0.5)', 0, 0], [h, '#303030', 0, 0]]) {
    ctx.font = fonte;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = cor;
    ctx.fillText(simbolo, T / 2 + dx, T / 2 + (simbolo === '*' ? 14 : 4) + dy);
  }
  return { map: paraTextura(c), bumpMap: paraTextura(r, { cor: false }) };
}

export function texturasDosBlocos() {
  return SIMBOLOS_DOS_BLOCOS.map((s, i) => bloco(s, 40 + i));
}

// ───────────── Telhado (telhas em escama) ─────────────
export function texturaDoTelhado() {
  const T = 128;
  const [c, g] = tela(T, T);
  const [r, h] = tela(T, T);
  g.fillStyle = '#d5473b';
  g.fillRect(0, 0, T, T);
  h.fillStyle = '#808080';
  h.fillRect(0, 0, T, T);
  const fileiras = 4, porFileira = 4;
  const alt = T / fileiras, larg = T / porFileira;
  for (let f = 0; f < fileiras; f++) {
    for (let i = -1; i <= porFileira; i++) {
      const x = i * larg + (f % 2 ? larg / 2 : 0);
      const y = f * alt;
      for (const [ctx, corTelha, corSombra] of [[g, f % 2 ? '#dd5144' : '#cc4034', 'rgba(90, 15, 10, 0.6)'], [h, '#c8c8c8', '#3a3a3a']]) {
        ctx.fillStyle = corSombra;
        ctx.beginPath();
        ctx.moveTo(x, y); ctx.lineTo(x + larg, y); ctx.lineTo(x + larg, y + alt * 0.55);
        ctx.quadraticCurveTo(x + larg / 2, y + alt * 1.25, x, y + alt * 0.55);
        ctx.fill();
        ctx.fillStyle = corTelha;
        ctx.beginPath();
        ctx.moveTo(x + 2, y); ctx.lineTo(x + larg - 2, y); ctx.lineTo(x + larg - 2, y + alt * 0.5);
        ctx.quadraticCurveTo(x + larg / 2, y + alt * 1.12, x + 2, y + alt * 0.5);
        ctx.fill();
      }
      g.fillStyle = 'rgba(255, 255, 255, 0.16)';
      g.fillRect(x + 5, y + 3, larg - 10, 3);
    }
  }
  return { map: paraTextura(c, { repetir: [4, 2] }), bumpMap: paraTextura(r, { cor: false, repetir: [4, 2] }) };
}

// ───────────── Balão ─────────────
// A imagem tem 2 gomos (um de cada cor) e se repete 6 vezes ao redor do balão.
// De cima para baixo: topo, faixa decorativa no meio e a "saia" perto da boca.
function balao(corA, corB) {
  const L = 128, A = 256;
  const [c, g] = tela(L, A);
  const gomo = L / 2;
  [corA, corB].forEach((cor, i) => {
    g.fillStyle = hex(cor);
    g.fillRect(i * gomo, 0, gomo, A);
    // gomo "estufado": claro no meio, mais escuro perto das costuras
    const luz = g.createLinearGradient(i * gomo, 0, (i + 1) * gomo, 0);
    luz.addColorStop(0, 'rgba(0, 0, 0, 0.2)');
    luz.addColorStop(0.5, 'rgba(255, 255, 255, 0.16)');
    luz.addColorStop(1, 'rgba(0, 0, 0, 0.2)');
    g.fillStyle = luz;
    g.fillRect(i * gomo, 0, gomo, A);
  });

  // Topo mais escuro
  g.fillStyle = escurecer(corA, 0.6);
  g.fillRect(0, 0, L, A * 0.07);
  g.fillStyle = 'rgba(0, 0, 0, 0.25)';
  g.fillRect(0, A * 0.07, L, 3);

  // Faixa decorativa na parte mais larga: fundo claro com triângulos
  const y0 = A * 0.36, hf = A * 0.13;
  g.fillStyle = '#fff6e3';
  g.fillRect(0, y0, L, hf);
  g.fillStyle = escurecer(corA, 0.85);
  for (let i = 0; i < 4; i++) {
    const x = i * (L / 4);
    g.beginPath();
    g.moveTo(x, y0 + hf - 4); g.lineTo(x + L / 8, y0 + 5); g.lineTo(x + L / 4, y0 + hf - 4);
    g.fill();
  }
  g.fillStyle = 'rgba(60, 30, 10, 0.45)';
  g.fillRect(0, y0 - 2, L, 3);
  g.fillRect(0, y0 + hf - 1, L, 3);

  // Saia perto da boca: recortes arredondados
  const ys = A * 0.86;
  g.fillStyle = escurecer(corB, 0.7);
  g.fillRect(0, ys, L, A - ys);
  g.fillStyle = hex(corA);
  for (let i = 0; i < 4; i++) {
    g.beginPath();
    g.arc(i * (L / 4) + L / 8, ys, L / 8 - 2, 0, Math.PI);
    g.fill();
  }

  // Costuras entre os gomos
  for (const x of [0, gomo, L]) {
    g.fillStyle = 'rgba(40, 20, 10, 0.5)';
    g.fillRect(x - 1.5, 0, 3, A);
  }
  return paraTextura(c, { repetir: [6, 1] });
}

function relevoDoBalao() {
  const L = 128, A = 16;
  const [c, g] = tela(L, A);
  for (let i = 0; i < 2; i++) {
    const r = g.createLinearGradient(i * 64, 0, (i + 1) * 64, 0);
    r.addColorStop(0, '#202020');
    r.addColorStop(0.18, '#b0b0b0');
    r.addColorStop(0.5, '#f0f0f0');
    r.addColorStop(0.82, '#b0b0b0');
    r.addColorStop(1, '#202020');
    g.fillStyle = r;
    g.fillRect(i * 64, 0, 64, A);
  }
  return paraTextura(c, { cor: false, repetir: [6, 1] });
}

export function texturasDosBaloes(paletas) {
  const bumpMap = relevoDoBalao();
  return paletas.map(([a, b]) => ({ map: balao(a, b), bumpMap }));
}

// ───────────── Cesto de vime ─────────────
export function texturaDoCesto() {
  const T = 64;
  const [c, g] = tela(T, T);
  const [r, h] = tela(T, T);
  g.fillStyle = '#8a5a2c';
  g.fillRect(0, 0, T, T);
  h.fillStyle = '#404040';
  h.fillRect(0, 0, T, T);
  const passo = 16;
  for (let y = 0; y < T; y += passo) {
    for (let x = 0; x < T; x += passo) {
      const porCima = ((x + y) / passo) % 2 === 0;
      for (const [ctx, claro, escuro] of [[g, '#c08a4c', '#a87238'], [h, '#f0f0f0', '#a0a0a0']]) {
        ctx.fillStyle = porCima ? claro : escuro;
        if (porCima) ctx.fillRect(x + 1, y + 4, passo - 2, passo - 8); // tira deitada
        else ctx.fillRect(x + 4, y + 1, passo - 8, passo - 2); // tira em pé
      }
      g.fillStyle = 'rgba(255, 235, 200, 0.25)';
      if (porCima) g.fillRect(x + 1, y + 4, passo - 2, 2); else g.fillRect(x + 4, y + 1, 2, passo - 2);
    }
  }
  return { map: paraTextura(c, { repetir: [3, 1] }), bumpMap: paraTextura(r, { cor: false, repetir: [3, 1] }) };
}

// ───────────── Nuvem de tempestade ─────────────
// O topo da imagem cai no topo da nuvem: claro em cima, quase preto na barriga.
export function texturaDaTempestade() {
  const T = 128;
  const [c, g] = tela(T, T);
  const rnd = sorteador(88);
  const grad = g.createLinearGradient(0, 0, 0, T);
  grad.addColorStop(0, '#a9b2c4'); // topo: mais claro
  grad.addColorStop(0.3, '#7a8397');
  grad.addColorStop(0.65, '#4a5263');
  grad.addColorStop(1, '#232834'); // barriga da nuvem: quase preta
  g.fillStyle = grad;
  g.fillRect(0, 0, T, T);
  // Manchas para a nuvem não ficar lisa
  for (let i = 0; i < 40; i++) {
    const x = rnd() * T, y = rnd() * T, raio = 8 + rnd() * 22;
    const m = g.createRadialGradient(x, y, 0, x, y, raio);
    m.addColorStop(0, rnd() < 0.5 ? 'rgba(255, 255, 255, 0.10)' : 'rgba(10, 12, 20, 0.16)');
    m.addColorStop(1, 'rgba(0, 0, 0, 0)');
    g.fillStyle = m;
    g.fillRect(x - raio, y - raio, raio * 2, raio * 2);
  }
  // Risquinhos de chuva na barriga
  g.strokeStyle = 'rgba(190, 205, 230, 0.22)';
  g.lineWidth = 1;
  for (let i = 0; i < 46; i++) {
    const x = rnd() * T, y = T * 0.68 + rnd() * T * 0.3;
    g.beginPath(); g.moveTo(x, y); g.lineTo(x - 2, y + 7 + rnd() * 6); g.stroke();
  }
  return { map: paraTextura(c) };
}
