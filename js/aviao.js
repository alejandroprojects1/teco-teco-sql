// Biplano de madeira em 3D, montado com formas simples (low-poly).
// O nariz aponta para -Z (para frente, longe da câmera).
import * as THREE from '../vendor/three.module.min.js';

const material = (cor, extra = {}) =>
  new THREE.MeshStandardMaterial({ color: cor, flatShading: true, roughness: 0.72, metalness: 0, ...extra });

const CORES = {
  madeira: 0xd8a05a,
  madeiraEscura: 0xa96a33,
  vermelho: 0xd5473b,
  metal: 0x5d6068,
  pneu: 0x34353b,
  pele: 0xf2c48d,
  gorro: 0x7a4a26,
  cachecol: 0xfff4e0,
};

// Retângulo de cantos arredondados, extrudado e deitado (para asas)
function placaArredondada(largura, profundidade, raio, espessura) {
  const s = new THREE.Shape();
  const w = largura / 2, h = profundidade / 2, r = Math.min(raio, h, w);
  s.moveTo(-w + r, -h);
  s.lineTo(w - r, -h);
  s.quadraticCurveTo(w, -h, w, -h + r);
  s.lineTo(w, h - r);
  s.quadraticCurveTo(w, h, w - r, h);
  s.lineTo(-w + r, h);
  s.quadraticCurveTo(-w, h, -w, h - r);
  s.lineTo(-w, -h + r);
  s.quadraticCurveTo(-w, -h, -w + r, -h);
  const g = new THREE.ExtrudeGeometry(s, {
    depth: espessura, bevelEnabled: true, bevelThickness: 0.025, bevelSize: 0.025, bevelSegments: 1, curveSegments: 4,
  });
  g.translate(0, 0, -espessura / 2);
  g.rotateX(Math.PI / 2); // deita a placa: profundidade vira o eixo Z
  return g;
}

function haste(raio, altura, mat) {
  return new THREE.Mesh(new THREE.CylinderGeometry(raio, raio, altura, 6), mat);
}

export function criarAviao() {
  const aviao = new THREE.Group();
  const corpo = new THREE.Group(); // tudo que inclina junto
  aviao.add(corpo);

  const m = {
    madeira: material(CORES.madeira),
    madeiraEscura: material(CORES.madeiraEscura),
    vermelho: material(CORES.vermelho),
    metal: material(CORES.metal, { metalness: 0.45, roughness: 0.45 }),
    pneu: material(CORES.pneu, { roughness: 0.9 }),
    pele: material(CORES.pele),
    gorro: material(CORES.gorro),
    cachecol: material(CORES.cachecol),
    escuro: material(0x2a1c12),
  };

  // Fuselagem: cilindro afinando para trás
  const fus = new THREE.CylinderGeometry(0.44, 0.17, 3.1, 10);
  fus.rotateX(-Math.PI / 2);
  const fuselagem = new THREE.Mesh(fus, m.madeira);
  fuselagem.position.z = 0.15;
  corpo.add(fuselagem);

  // Faixas de madeira mais escura (detalhe)
  for (const z of [-0.55, 0.65]) {
    const r = 0.44 - ((z + 1.4) / 3.1) * 0.27;
    const anel = new THREE.Mesh(new THREE.CylinderGeometry(r + 0.012, r + 0.012, 0.06, 10), m.madeiraEscura);
    anel.rotation.x = Math.PI / 2;
    anel.position.z = z + 0.15;
    corpo.add(anel);
  }

  // Motor (capô cinza) + cone da hélice
  const capo = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.47, 0.42, 16), m.metal);
  capo.rotation.x = Math.PI / 2;
  capo.position.z = -1.55;
  corpo.add(capo);
  const frente = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.36, 0.05, 16), m.escuro);
  frente.rotation.x = Math.PI / 2;
  frente.position.z = -1.77;
  corpo.add(frente);
  const cone = new THREE.ConeGeometry(0.15, 0.34, 10);
  cone.rotateX(-Math.PI / 2);
  const ponta = new THREE.Mesh(cone, m.metal);
  ponta.position.z = -1.95;
  corpo.add(ponta);

  // Hélice: duas pás de madeira + disco de "borrão" quando gira
  const helice = new THREE.Group();
  helice.position.z = -1.86;
  for (const lado of [1, -1]) {
    const pa = new THREE.Mesh(new THREE.BoxGeometry(0.17, 0.78, 0.045), m.madeiraEscura);
    pa.position.y = 0.42 * lado;
    pa.rotation.y = 0.35 * lado;
    helice.add(pa);
  }
  corpo.add(helice);
  const disco = new THREE.Mesh(
    new THREE.CircleGeometry(0.86, 28),
    new THREE.MeshBasicMaterial({ color: 0xf6dcb4, transparent: true, opacity: 0.22, depthWrite: false, side: THREE.DoubleSide }),
  );
  disco.position.z = -1.9;
  corpo.add(disco);

  // Asas (superior maior, inferior menor)
  const asaSup = new THREE.Mesh(placaArredondada(4.6, 1.0, 0.45, 0.07), m.vermelho);
  asaSup.position.set(0, 0.72, -0.55);
  corpo.add(asaSup);
  const asaInf = new THREE.Mesh(placaArredondada(4.0, 0.92, 0.42, 0.07), m.vermelho);
  asaInf.position.set(0, -0.26, -0.45);
  corpo.add(asaInf);

  // Nervuras das asas (linhas um pouco mais escuras)
  const matNervura = material(0xb83a30);
  for (let i = -4; i <= 4; i++) {
    if (i === 0) continue;
    const nerv = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.012, 0.92), matNervura);
    nerv.position.set(i * 0.5, 0.77, -0.55);
    corpo.add(nerv);
  }

  // Hastes entre as asas
  for (const x of [-1.6, 1.6]) {
    for (const dz of [-0.28, 0.22]) {
      const h = haste(0.04, 0.98, m.madeira);
      h.position.set(x, 0.23, -0.5 + dz);
      corpo.add(h);
    }
  }
  for (const x of [-0.42, 0.42]) {
    const h = haste(0.035, 0.42, m.madeira);
    h.position.set(x, 0.52, -0.55);
    h.rotation.z = x > 0 ? -0.35 : 0.35;
    corpo.add(h);
  }

  // Cabos cruzados (em X) entre as hastes
  const pts = [];
  for (const x of [-1.6, 1.6]) {
    const dentro = x > 0 ? 0.5 : -0.5;
    pts.push(x, 0.68, -0.55, dentro, -0.22, -0.5);
    pts.push(x, -0.22, -0.5, dentro, 0.68, -0.55);
  }
  const geoCabos = new THREE.BufferGeometry();
  geoCabos.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
  corpo.add(new THREE.LineSegments(geoCabos, new THREE.LineBasicMaterial({ color: 0x6b4a2e })));

  // Cauda: estabilizador horizontal + leme arredondado
  const estab = new THREE.Mesh(placaArredondada(1.7, 0.6, 0.28, 0.06), m.vermelho);
  estab.position.set(0, 0.08, 1.55);
  corpo.add(estab);
  const formaLeme = new THREE.Shape();
  formaLeme.moveTo(-0.35, 0);
  formaLeme.lineTo(0.3, 0);
  formaLeme.absellipse(0, 0, 0.32, 0.78, 0, Math.PI, false);
  formaLeme.lineTo(-0.35, 0);
  const geoLeme = new THREE.ExtrudeGeometry(formaLeme, {
    depth: 0.06, bevelEnabled: true, bevelThickness: 0.02, bevelSize: 0.02, bevelSegments: 1, curveSegments: 10,
  });
  geoLeme.translate(0, 0, -0.03);
  geoLeme.rotateY(Math.PI / 2);
  const leme = new THREE.Mesh(geoLeme, m.vermelho);
  leme.position.set(0, 0.12, 1.5);
  corpo.add(leme);

  // Cabine + piloto
  const cabine = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 0.1, 14), m.escuro);
  cabine.position.set(0, 0.38, 0.2);
  corpo.add(cabine);
  const cabeca = new THREE.Mesh(new THREE.SphereGeometry(0.19, 12, 10), m.pele);
  cabeca.position.set(0, 0.56, 0.2);
  corpo.add(cabeca);
  const gorro = new THREE.Mesh(new THREE.SphereGeometry(0.205, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), m.gorro);
  gorro.position.set(0, 0.58, 0.2);
  gorro.rotation.x = 0.25;
  corpo.add(gorro);
  const oculos = new THREE.Mesh(new THREE.TorusGeometry(0.17, 0.035, 6, 16), m.metal);
  oculos.position.set(0, 0.6, 0.2);
  oculos.rotation.x = Math.PI / 2 - 0.25;
  corpo.add(oculos);
  const cachecol = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.03, 0.55), m.cachecol);
  cachecol.position.set(0.1, 0.44, 0.5);
  cachecol.rotation.set(0.15, 0.25, 0);
  corpo.add(cachecol);

  // Trem de pouso: pernas + rodas
  for (const x of [-0.5, 0.5]) {
    const perna = haste(0.035, 0.62, m.madeira);
    perna.position.set(x * 0.8, -0.58, -0.95);
    perna.rotation.z = x > 0 ? 0.35 : -0.35;
    corpo.add(perna);
    const roda = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.26, 0.13, 16), m.pneu);
    roda.rotation.z = Math.PI / 2;
    roda.position.set(x * 1.05, -0.9, -0.95);
    corpo.add(roda);
    const cubo = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.15, 10), m.madeira);
    cubo.rotation.z = Math.PI / 2;
    cubo.position.copy(roda.position);
    corpo.add(cubo);
  }
  const eixo = haste(0.03, 1.05, m.madeiraEscura);
  eixo.rotation.z = Math.PI / 2;
  eixo.position.set(0, -0.9, -0.95);
  corpo.add(eixo);

  corpo.scale.setScalar(0.82);

  return { grupo: aviao, corpo, helice, disco };
}
