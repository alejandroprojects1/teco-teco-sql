// Vegetação low-poly: 3 tipos de árvore, tufos de grama, flores, pedras e as cores do gramado.
// Cada modelo é uma única geometria com cores por vértice, para desenhar
// centenas de cópias de uma vez (InstancedMesh) sem pesar no celular.
import * as THREE from '../vendor/three.module.min.js';

const rnd = (a, b) => a + Math.random() * (b - a);

/** Junta várias peças (cada uma com sua cor) em uma geometria só. */
function juntar(pecas) {
  const prontas = pecas.map(({ geo, cor }) => ({ g: geo.index ? geo.toNonIndexed() : geo, cor: new THREE.Color(cor) }));
  const total = prontas.reduce((s, p) => s + p.g.attributes.position.count, 0);
  const pos = new Float32Array(total * 3);
  const cores = new Float32Array(total * 3);
  let o = 0;
  for (const { g, cor } of prontas) {
    const a = g.attributes.position.array;
    pos.set(a, o * 3);
    // leve variação de tom por face, para o visual low-poly
    for (let i = 0; i < g.attributes.position.count; i += 3) {
      const c = cor.clone().offsetHSL(0, 0, rnd(-0.025, 0.025));
      for (let j = 0; j < 3; j++) c.toArray(cores, (o + i + j) * 3);
    }
    o += g.attributes.position.count;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(cores, 3));
  geo.computeVertexNormals();
  return geo;
}

const em = (geo, x, y, z) => { geo.translate(x, y, z); return geo; };

// ───────────── Árvores ─────────────
const MARROM = 0x7a4f2c;
const MARROM_CLARO = 0x8f6238;

/** 🌲 Pinheiro: três "andares" de cone. */
export function pinheiro() {
  return juntar([
    { geo: em(new THREE.CylinderGeometry(0.28, 0.4, 1.8, 6), 0, 0.9, 0), cor: MARROM },
    { geo: em(new THREE.ConeGeometry(2.1, 2.8, 7), 0, 2.7, 0), cor: 0x2e7442 },
    { geo: em(new THREE.ConeGeometry(1.65, 2.4, 7), 0, 3.9, 0), cor: 0x37844a },
    { geo: em(new THREE.ConeGeometry(1.1, 2.0, 7), 0, 5.0, 0), cor: 0x429553 },
  ]);
}

/** 🌳 Árvore frondosa: copa redonda feita de várias "bolas". */
export function frondosa() {
  const bola = (r, x, y, z) => {
    const g = new THREE.IcosahedronGeometry(r, 0);
    g.rotateY(rnd(0, Math.PI));
    return em(g, x, y, z);
  };
  return juntar([
    { geo: em(new THREE.CylinderGeometry(0.3, 0.48, 2.6, 6), 0, 1.3, 0), cor: MARROM_CLARO },
    { geo: em(new THREE.CylinderGeometry(0.12, 0.18, 1.3, 5).rotateZ(0.8), 0.55, 2.4, 0), cor: MARROM_CLARO },
    { geo: bola(1.9, 0, 3.9, 0), cor: 0x5aa84f },
    { geo: bola(1.35, 1.25, 3.4, 0.35), cor: 0x4f9c46 },
    { geo: bola(1.3, -1.15, 3.5, -0.35), cor: 0x63b257 },
    { geo: bola(1.15, 0.2, 5.0, 0.3), cor: 0x6dbb5d },
  ]);
}

/** 🌸 Ipê: tronco fino e copa larga e achatada, florida. */
export function ipe(corFlor, corFlorClara) {
  const copa = (r, x, y, z, achatar) => {
    const g = new THREE.DodecahedronGeometry(r, 0);
    g.scale(1, achatar, 1);
    g.rotateY(rnd(0, Math.PI));
    return em(g, x, y, z);
  };
  return juntar([
    { geo: em(new THREE.CylinderGeometry(0.2, 0.36, 3.2, 6), 0, 1.6, 0), cor: 0x6b4428 },
    { geo: em(new THREE.CylinderGeometry(0.1, 0.15, 1.6, 5).rotateZ(-0.7), -0.6, 3.2, 0), cor: 0x6b4428 },
    { geo: em(new THREE.CylinderGeometry(0.1, 0.15, 1.5, 5).rotateZ(0.75), 0.6, 3.3, 0.1), cor: 0x6b4428 },
    { geo: copa(2.5, 0, 4.1, 0, 0.5), cor: corFlor },
    { geo: copa(1.6, 1.3, 4.6, 0.4, 0.55), cor: corFlorClara },
    { geo: copa(1.5, -1.3, 4.5, -0.3, 0.55), cor: corFlorClara },
  ]);
}

// ───────────── Chão ─────────────
/** Tufo de grama: 5 folhas finas, escuras na base e claras na ponta. */
export function tufoDeGrama() {
  const pos = [];
  const cores = [];
  const base = new THREE.Color(0x3c7a35);
  const ponta = new THREE.Color(0xa9d86c);
  for (let i = 0; i < 5; i++) {
    const ang = (i / 5) * Math.PI * 2 + rnd(-0.3, 0.3);
    const alt = rnd(0.7, 1.25);
    const larg = 0.1;
    const incl = rnd(0.15, 0.4);
    const cx = Math.cos(ang), cz = Math.sin(ang);
    const px = -cz * larg, pz = cx * larg; // perpendicular, para a largura da folha
    pos.push(px, 0, pz, -px, 0, -pz, cx * incl, alt, cz * incl);
    base.toArray(cores, cores.length);
    base.toArray(cores, cores.length);
    ponta.toArray(cores, cores.length);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('color', new THREE.Float32BufferAttribute(cores, 3));
  geo.computeVertexNormals();
  return geo;
}

/** Florzinha: miolo amarelo com pétalas (a cor das pétalas vem de cada cópia). */
export function flor() {
  const petalas = new THREE.OctahedronGeometry(0.26, 0);
  petalas.scale(1, 0.45, 1);
  const miolo = new THREE.OctahedronGeometry(0.1, 0);
  return juntar([
    { geo: em(new THREE.CylinderGeometry(0.025, 0.025, 0.4, 3), 0, 0.2, 0), cor: 0x3c7a35 },
    { geo: em(petalas, 0, 0.42, 0), cor: 0xffffff },
    { geo: em(miolo, 0, 0.5, 0), cor: 0xffd43b },
  ]);
}

export function pedra() {
  const g = new THREE.DodecahedronGeometry(1, 0);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) p.setY(i, p.getY(i) * 0.6);
  return juntar([{ geo: g, cor: 0x9a9c98 }]);
}

// ───────────── Cores do gramado ─────────────
const GRAMA = [0x4a9343, 0x5ba64d, 0x6fb757, 0x88c862, 0x9fd36a].map((c) => new THREE.Color(c));
const SECO = new THREE.Color(0xbcc66c);
const MORRO = new THREE.Color(0x4d8a4a);
const TERRA = new THREE.Color(0xc2a476);

/**
 * Cor de um pedaço do chão, formando manchas naturais de grama.
 * z vai de -comprimento/2 a +comprimento/2 e o padrão se repete a cada trecho.
 */
export function corDoGramado(x, z, h, comprimento, alvo) {
  const k = (Math.PI * 2) / comprimento;
  const n = Math.sin(x * 0.06 + Math.sin(z * k * 3) * 1.8) * Math.cos(z * k * 4 + x * 0.027)
    + 0.55 * Math.sin(x * 0.15 - z * k * 7 + 1.3)
    + 0.3 * Math.sin(x * 0.31 + z * k * 11);
  const t = THREE.MathUtils.clamp((n + 1.6) / 3.2, 0, 0.999);
  const i = Math.floor(t * (GRAMA.length - 1));
  alvo.copy(GRAMA[i]).lerp(GRAMA[i + 1], t * (GRAMA.length - 1) - i);
  // manchas de grama seca
  const seco = Math.sin(x * 0.045 - z * k * 2 + 2.1) * Math.sin(x * 0.09 + z * k * 5);
  if (seco > 0.55) alvo.lerp(SECO, Math.min(1, (seco - 0.55) * 2.2));
  // morros mais altos: verde mais fechado; pontos mais altos: terra
  if (h > 4) alvo.lerp(MORRO, Math.min(0.7, (h - 4) * 0.12));
  if (h > 9) alvo.lerp(TERRA, Math.min(0.8, (h - 9) * 0.2));
  return alvo.offsetHSL(rnd(-0.006, 0.006), 0, rnd(-0.022, 0.022));
}
