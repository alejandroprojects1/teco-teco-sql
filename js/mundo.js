// Mundo 3D: céu, terreno, nuvens, obstáculos, estrelas, câmera e colisões.
import * as THREE from '../vendor/three.module.min.js';
import { criarAviao } from './aviao.js';

const CHAO_Y = -16;
const TRECHO = 160; // comprimento de cada pedaço de terreno
const NUM_TRECHOS = 3;
const Y_MIN = 0.6;
const Y_MAX = 6.6;
const Y_CENTRO = 3.4;
const NASCER_Z = -175; // onde os objetos aparecem (lá no fundo)
const VEL_MIN = 24;
const VEL_MAX = 38;

const rnd = (a, b) => a + Math.random() * (b - a);
const escolher = (lista) => lista[Math.floor(Math.random() * lista.length)];
const suavizar = (atual, alvo, dt, taxa) => atual + (alvo - atual) * (1 - Math.exp(-dt * taxa));

const CEU_TOPO = new THREE.Color(0x2f8fe0);
const CEU_MEIO = new THREE.Color(0x8fd0f7);
const CEU_HORIZONTE = new THREE.Color(0xffd9b0);
const CEU_SOL = new THREE.Color(0xfff3d6);

function alturaTerreno(x, z) {
  const k = (Math.PI * 2) / TRECHO; // periódico no comprimento do trecho: emenda sem costura
  let h = Math.sin(x * 0.045 + Math.cos(z * k * 2) * 1.3) * 3.2
    + Math.sin(x * 0.11 + z * k * 3) * 1.6
    + Math.cos(z * k * 5 + x * 0.03) * 1.1;
  h += Math.max(0, Math.abs(x) - 45) * 0.16; // morros nas laterais
  return h;
}

const MAT = (cor, extra = {}) => new THREE.MeshStandardMaterial({ color: cor, flatShading: true, roughness: 0.85, ...extra });

export class Mundo {
  constructor(canvas) {
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;

    this.cena = new THREE.Scene();
    this.cena.fog = new THREE.Fog(CEU_HORIZONTE, 60, 200);
    this.camera = new THREE.PerspectiveCamera(55, 1, 0.5, 600);
    this.olhar = new THREE.Vector3(0, Y_CENTRO, 0);

    this.cena.add(new THREE.HemisphereLight(0xcfe8ff, 0xe9c28f, 1.5));
    const sol = new THREE.DirectionalLight(0xfff0d8, 2.4);
    sol.position.set(-8, 14, 6);
    this.cena.add(sol);

    this._criarCeu();
    this._criarTerreno();
    this._criarGeometriasCompartilhadas();
    this._criarNuvensDecorativas();

    const { grupo, corpo, helice, disco } = criarAviao();
    this.aviao = grupo;
    this.aviaoCorpo = corpo;
    this.helice = helice;
    this.disco = disco;
    this.aviao.position.set(0, Y_CENTRO, 0);
    this.cena.add(this.aviao);

    this.obstaculos = [];
    this.estrelas = [];
    this.particulas = [];
    this.alvo = new THREE.Vector2(0, Y_CENTRO);
    this.velAviao = new THREE.Vector2();
    this.modo = 'menu'; // 'menu' | 'jogo' | 'queda'
    this.relogio = 0;
    this.tempoVoo = 0;
    this.distancia = 0;
    this.velocidade = VEL_MIN;
    this.proxObstaculo = 1.2;
    this.proxEstrela = 2;
    this.invencivel = 0;
    this.tremor = 0;
    this.xMax = 4;
    this.aoBater = null;
    this.aoPegarEstrela = null;

    this.redimensionar();
  }

  // ───────────── Construção do cenário ─────────────
  _criarCeu() {
    const geo = new THREE.SphereGeometry(450, 32, 16);
    const mat = new THREE.ShaderMaterial({
      side: THREE.BackSide,
      depthWrite: false,
      fog: false,
      uniforms: {
        topo: { value: CEU_TOPO },
        meio: { value: CEU_MEIO },
        horizonte: { value: CEU_HORIZONTE },
        corSol: { value: CEU_SOL },
        dirSol: { value: new THREE.Vector3(-0.35, 0.18, -1).normalize() },
      },
      vertexShader: `
        varying vec3 vDir;
        void main() {
          vDir = normalize(position);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }`,
      fragmentShader: `
        uniform vec3 topo; uniform vec3 meio; uniform vec3 horizonte; uniform vec3 corSol; uniform vec3 dirSol;
        varying vec3 vDir;
        void main() {
          float h = vDir.y;
          float hh = clamp(h, 0.0, 1.0);
          vec3 cor = mix(horizonte, meio, smoothstep(0.0, 0.16, hh));
          cor = mix(cor, topo, smoothstep(0.12, 0.6, hh));
          float sol = pow(max(dot(normalize(vDir), dirSol), 0.0), 18.0);
          cor = mix(cor, corSol, sol * 0.85);
          gl_FragColor = vec4(cor, 1.0);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }`,
    });
    this.ceu = new THREE.Mesh(geo, mat);
    this.cena.add(this.ceu);
  }

  _criarTerreno() {
    this.trechos = [];
    const cores = [0x8ccf6c, 0x76c062, 0x62ad57, 0x529b4f, 0xc8b47c].map((c) => new THREE.Color(c));
    const largura = 360;
    const base = new THREE.PlaneGeometry(largura, TRECHO, 60, 28);
    base.rotateX(-Math.PI / 2);
    const pos = base.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      pos.setY(i, alturaTerreno(pos.getX(i), pos.getZ(i)));
    }
    const geo = base.toNonIndexed();
    const p = geo.attributes.position;
    const cor = new Float32Array(p.count * 3);
    const c = new THREE.Color();
    for (let i = 0; i < p.count; i += 3) {
      const h = (p.getY(i) + p.getY(i + 1) + p.getY(i + 2)) / 3;
      const idx = h > 7 ? 4 : h > 3.2 ? 3 : h > 0.5 ? 2 : h > -2.5 ? 1 : 0;
      c.copy(cores[idx]).offsetHSL(rnd(-0.012, 0.012), 0, rnd(-0.03, 0.03));
      for (let j = 0; j < 3; j++) c.toArray(cor, (i + j) * 3);
    }
    geo.setAttribute('color', new THREE.BufferAttribute(cor, 3));
    geo.computeVertexNormals();
    const matChao = new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 1 });

    // Árvores (instanciadas)
    const copa = new THREE.ConeGeometry(1.7, 4.2, 7);
    copa.translate(0, 3.2, 0);
    const tronco = new THREE.CylinderGeometry(0.3, 0.42, 1.4, 6);
    tronco.translate(0, 0.7, 0);
    const matCopa = MAT(0xffffff);
    const matTronco = MAT(0x8a5a33);
    const coresCopa = [0x3f8f4a, 0x4fa152, 0x2f7a43, 0x6fb35a].map((x) => new THREE.Color(x));

    for (let t = 0; t < NUM_TRECHOS; t++) {
      const grupo = new THREE.Group();
      grupo.add(new THREE.Mesh(geo, matChao));
      const n = 90;
      const copas = new THREE.InstancedMesh(copa, matCopa, n);
      const troncos = new THREE.InstancedMesh(tronco, matTronco, n);
      const m4 = new THREE.Matrix4();
      const q = new THREE.Quaternion();
      const s = new THREE.Vector3();
      for (let i = 0; i < n; i++) {
        const x = (Math.random() < 0.5 ? -1 : 1) * rnd(6, 120);
        const z = rnd(-TRECHO / 2, TRECHO / 2);
        const esc = rnd(0.7, 1.5);
        q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), rnd(0, Math.PI));
        s.set(esc, esc * rnd(0.9, 1.3), esc);
        m4.compose(new THREE.Vector3(x, alturaTerreno(x, z) - 0.2, z), q, s);
        copas.setMatrixAt(i, m4);
        troncos.setMatrixAt(i, m4);
        copas.setColorAt(i, escolher(coresCopa));
      }
      grupo.add(copas, troncos);
      grupo.position.set(0, CHAO_Y, -t * TRECHO + 40);
      this.cena.add(grupo);
      this.trechos.push(grupo);
    }
  }

  _criarGeometriasCompartilhadas() {
    this.geo = {
      bolha: new THREE.IcosahedronGeometry(1, 1),
      bloco: new THREE.BoxGeometry(1.5, 1.5, 1.5),
      telhado: new THREE.ConeGeometry(1.2, 1.3, 4),
      cesto: new THREE.CylinderGeometry(0.32, 0.26, 0.4, 8),
    };
    this.mat = {
      nuvem: MAT(0xffffff, { roughness: 1, emissive: 0xffffff, emissiveIntensity: 0.12 }),
      tempestade: MAT(0x5d6679, { roughness: 1 }),
      raio: new THREE.MeshBasicMaterial({ color: 0xffe066 }),
      cesto: MAT(0x9a6232),
      blocos: [0xe4513f, 0xf4b63d, 0x3d8fe0, 0x45b36b, 0x9b6ad6].map((c) => MAT(c, { roughness: 0.6 })),
      telhado: MAT(0xd5473b),
      estrela: new THREE.MeshStandardMaterial({
        color: 0xffd23f, emissive: 0xffb300, emissiveIntensity: 0.55, flatShading: true, roughness: 0.35, metalness: 0.3,
      }),
      fumaca: new THREE.MeshStandardMaterial({ color: 0x777b85, flatShading: true, transparent: true, opacity: 0.85 }),
      brilho: new THREE.MeshBasicMaterial({ color: 0xfff2a8, transparent: true }),
    };

    // Balão: forma de gota, com gomos coloridos
    const perfil = [];
    for (let i = 0; i <= 10; i++) {
      const t = i / 10;
      const ang = t * Math.PI;
      const r = Math.sin(ang) * (0.75 + 0.35 * t) + (t > 0.9 ? 0 : 0);
      perfil.push(new THREE.Vector2(Math.max(r, 0.18 * (1 - t) * (t < 0.15 ? 1 : 0)), -Math.cos(ang) * 1.25));
    }
    perfil[0].set(0.22, -1.25);
    const lathe = new THREE.LatheGeometry(perfil, 12).toNonIndexed();
    lathe.computeVertexNormals();
    this.geoBalao = lathe;
    this.paletasBalao = [
      [0xff6b6b, 0xfff1d6], [0x4dabf7, 0xffe066], [0x9775fa, 0xffffff], [0x38d9a9, 0xff922b], [0xf783ac, 0xfff3bf],
    ];

    // Estrela de 5 pontas
    const f = new THREE.Shape();
    for (let i = 0; i < 10; i++) {
      const r = i % 2 === 0 ? 0.75 : 0.32;
      const a = (i / 10) * Math.PI * 2 + Math.PI / 2;
      const x = Math.cos(a) * r, y = Math.sin(a) * r;
      if (i === 0) f.moveTo(x, y); else f.lineTo(x, y);
    }
    this.geoEstrela = new THREE.ExtrudeGeometry(f, { depth: 0.22, bevelEnabled: true, bevelSize: 0.06, bevelThickness: 0.06, bevelSegments: 1 });
    this.geoEstrela.center();

    // Raio (zigue-zague)
    const r = new THREE.Shape();
    r.moveTo(0.1, 0.9); r.lineTo(-0.35, 0); r.lineTo(0, 0); r.lineTo(-0.25, -0.9); r.lineTo(0.4, 0.15); r.lineTo(0.05, 0.15); r.lineTo(0.35, 0.9);
    this.geoRaio = new THREE.ExtrudeGeometry(r, { depth: 0.05, bevelEnabled: false });
  }

  _nuvem(material, n, raio) {
    const g = new THREE.Group();
    for (let i = 0; i < n; i++) {
      const b = new THREE.Mesh(this.geo.bolha, material);
      const s = raio * rnd(0.55, 1);
      b.scale.set(s, s * rnd(0.75, 0.95), s);
      b.position.set(rnd(-raio, raio) * 0.9, rnd(-raio, raio) * 0.25, rnd(-raio, raio) * 0.5);
      b.rotation.set(rnd(0, 3), rnd(0, 3), 0);
      g.add(b);
    }
    return g;
  }

  _criarNuvensDecorativas() {
    this.decoracao = [];
    for (let i = 0; i < 18; i++) {
      const nuvem = this._nuvem(this.mat.nuvem, Math.floor(rnd(4, 7)), rnd(2.2, 4.5));
      this._posicionarDecoracao(nuvem, rnd(NASCER_Z, 40));
      this.cena.add(nuvem);
      this.decoracao.push(nuvem);
    }
  }

  _posicionarDecoracao(obj, z) {
    // Longe do corredor de voo, para não confundir com obstáculos
    const lado = Math.random() < 0.5 ? -1 : 1;
    if (Math.random() < 0.7) {
      obj.position.set(lado * rnd(16, 70), rnd(-6, 22), z);
    } else {
      obj.position.set(rnd(-30, 30), rnd(16, 26), z);
    }
  }

  // ───────────── Obstáculos e estrelas ─────────────
  _criarTempestade() {
    const g = this._nuvem(this.mat.tempestade, 6, 1.35);
    const raio = new THREE.Mesh(this.geoRaio, this.mat.raio);
    raio.position.set(0, -1.3, 0.4);
    raio.scale.setScalar(0.9);
    g.add(raio);
    return { obj: g, tipo: 'tempestade', raio: 1.5, extra: raio };
  }

  _criarBalao() {
    const g = new THREE.Group();
    const [c1, c2] = escolher(this.paletasBalao);
    const geo = this.geoBalao.clone();
    const pos = geo.attributes.position;
    const cores = new Float32Array(pos.count * 3);
    const ca = new THREE.Color(c1), cb = new THREE.Color(c2);
    for (let i = 0; i < pos.count; i += 3) {
      const ang = Math.atan2(
        (pos.getZ(i) + pos.getZ(i + 1) + pos.getZ(i + 2)) / 3,
        (pos.getX(i) + pos.getX(i + 1) + pos.getX(i + 2)) / 3,
      );
      const gomo = Math.floor(((ang + Math.PI) / (Math.PI * 2)) * 12) % 2;
      const c = gomo ? ca : cb;
      for (let j = 0; j < 3; j++) c.toArray(cores, (i + j) * 3);
    }
    geo.setAttribute('color', new THREE.BufferAttribute(cores, 3));
    const balao = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 0.6 }));
    g.add(balao);
    const cesto = new THREE.Mesh(this.geo.cesto, this.mat.cesto);
    cesto.position.y = -1.75;
    g.add(cesto);
    const cordas = new THREE.BufferGeometry();
    const p = [];
    for (const [x, z] of [[0.25, 0.25], [-0.25, 0.25], [0.25, -0.25], [-0.25, -0.25]]) p.push(x * 0.9, -1.55, z * 0.9, x * 1.6, -1.1, z * 1.6);
    cordas.setAttribute('position', new THREE.Float32BufferAttribute(p, 3));
    g.add(new THREE.LineSegments(cordas, new THREE.LineBasicMaterial({ color: 0x5b3b22 })));
    g.rotation.y = rnd(0, Math.PI);
    return { obj: g, tipo: 'balao', raio: 1.25, fase: rnd(0, 6), geoPropria: geo };
  }

  _criarTorre(topoY) {
    const g = new THREE.Group();
    const lado = 1.5;
    let y = topoY - lado / 2;
    let i = Math.floor(rnd(0, 5));
    while (y > CHAO_Y - 4) {
      const b = new THREE.Mesh(this.geo.bloco, this.mat.blocos[i % this.mat.blocos.length]);
      b.position.y = y;
      b.rotation.y = rnd(-0.12, 0.12);
      g.add(b);
      y -= lado;
      i++;
    }
    const telhado = new THREE.Mesh(this.geo.telhado, this.mat.telhado);
    telhado.position.y = topoY + 0.62;
    telhado.rotation.y = Math.PI / 4;
    g.add(telhado);
    return { obj: g, tipo: 'torre', topo: topoY + 0.9, meiaLargura: 0.85 };
  }

  _novoObstaculo() {
    const sorteio = Math.random();
    let o;
    if (sorteio < 0.38) o = this._criarTempestade();
    else if (sorteio < 0.72) o = this._criarBalao();
    else o = this._criarTorre(rnd(Y_MIN + 0.4, Y_MAX - 1.8));

    // Às vezes mira perto do avião, para obrigar a desviar
    const mirar = Math.random() < 0.3;
    const x = mirar ? THREE.MathUtils.clamp(this.aviao.position.x + rnd(-1, 1), -this.xMax, this.xMax) : rnd(-this.xMax, this.xMax);
    const y = mirar ? THREE.MathUtils.clamp(this.aviao.position.y + rnd(-0.8, 0.8), Y_MIN, Y_MAX) : rnd(Y_MIN, Y_MAX);
    o.obj.position.set(x, o.tipo === 'torre' ? 0 : y, NASCER_Z);
    o.baseY = o.obj.position.y;
    this.cena.add(o.obj);
    this.obstaculos.push(o);
  }

  _novaEstrela() {
    const quantas = Math.random() < 0.35 ? 3 : 1;
    const x0 = rnd(-this.xMax, this.xMax);
    const y0 = rnd(Y_MIN + 0.3, Y_MAX - 0.3);
    const dx = rnd(-0.6, 0.6);
    for (let i = 0; i < quantas; i++) {
      const e = new THREE.Mesh(this.geoEstrela, this.mat.estrela);
      e.position.set(THREE.MathUtils.clamp(x0 + dx * i, -this.xMax, this.xMax), y0, NASCER_Z - i * 4);
      this.cena.add(e);
      this.estrelas.push(e);
    }
  }

  _removerObstaculo(o) {
    this.cena.remove(o.obj);
    if (o.geoPropria) o.geoPropria.dispose();
  }

  _explosao(pos, material, n, forca, escala) {
    for (let i = 0; i < n; i++) {
      const p = new THREE.Mesh(this.geo.bolha, material);
      p.position.copy(pos);
      p.scale.setScalar(escala * rnd(0.5, 1));
      p.userData = {
        v: new THREE.Vector3(rnd(-1, 1), rnd(-0.5, 1), rnd(-1, 1)).normalize().multiplyScalar(forca * rnd(0.5, 1)),
        vida: 0,
        max: rnd(0.5, 0.9),
        esc: p.scale.x,
      };
      this.cena.add(p);
      this.particulas.push(p);
    }
  }

  // ───────────── Controle ─────────────
  moverAlvo(dx, dy) {
    this.alvo.x = THREE.MathUtils.clamp(this.alvo.x + dx, -this.xMax, this.xMax);
    this.alvo.y = THREE.MathUtils.clamp(this.alvo.y + dy, Y_MIN, Y_MAX);
  }

  get escalaControle() {
    // Quanto do mundo corresponde a uma tela inteira de arraste
    return { x: this.xMax * 2.4, y: (Y_MAX - Y_MIN) * 1.6 };
  }

  iniciarJogo(comObstaculos = true) {
    for (const o of this.obstaculos) this._removerObstaculo(o);
    for (const e of this.estrelas) this.cena.remove(e);
    this.obstaculos = [];
    this.estrelas = [];
    this.modo = 'jogo';
    this.tempoVoo = 0;
    this.distancia = 0;
    this.velocidade = VEL_MIN;
    this.proxObstaculo = 1.5;
    this.proxEstrela = 1;
    this.invencivel = 0;
    this.alvo.set(0, Y_CENTRO);
    this.aviao.position.set(0, Y_CENTRO, 0);
    this.aviao.rotation.set(0, 0, 0);
    this.aviao.visible = true;
    // Alguns obstáculos já no caminho, para a ação começar logo
    if (comObstaculos) {
      for (const z of [-95, -125, -150]) {
        this._novoObstaculo();
        this.obstaculos[this.obstaculos.length - 1].obj.position.z = z;
      }
    }
  }

  voltarAoMenu() {
    this.iniciarJogo(false);
    this.modo = 'menu';
  }

  // Ao voltar de uma pergunta: tira obstáculos muito próximos e dá um respiro
  liberarCaminho() {
    this.obstaculos = this.obstaculos.filter((o) => {
      if (o.obj.position.z > -55) { this._removerObstaculo(o); return false; }
      return true;
    });
    this.invencivel = Math.max(this.invencivel, 1);
  }

  iniciarQueda() {
    this.modo = 'queda';
    this.tempoQueda = 0;
  }

  // ───────────── Atualização por quadro ─────────────
  atualizar(dt, emMovimento) {
    this.relogio += dt;
    const t = this.relogio;

    // Hélice sempre girando
    this.helice.rotation.z += dt * (emMovimento ? 38 : 30);
    this.disco.material.opacity = 0.18 + Math.sin(t * 40) * 0.04;

    if (this.modo === 'menu') {
      this._rolarCenario(dt, 12);
      this.aviao.position.set(0, Y_CENTRO + Math.sin(t * 1.4) * 0.25, 0);
      this.aviaoCorpo.rotation.set(Math.sin(t * 1.1) * 0.05, 0, Math.sin(t * 0.9) * 0.12);
      const retrato = this.aspecto < 1;
      const baixa = window.innerHeight < 720;
      const raio = retrato ? (9.5 / Math.max(this.aspecto, 0.45)) * (baixa ? 0.72 : 0.62) : 8.5;
      const a = t * 0.22 + 0.6;
      this._camera(dt, new THREE.Vector3(Math.sin(a) * raio, Y_CENTRO + 2.2, Math.cos(a) * raio),
        new THREE.Vector3(0, Y_CENTRO - (retrato ? (baixa ? 3.6 : 1.9) : 0.6), 0), 2.5);
    } else if (this.modo === 'jogo' && emMovimento) {
      this.tempoVoo += dt;
      const prog = Math.min(1, this.tempoVoo / 110);
      this.velocidade = VEL_MIN + (VEL_MAX - VEL_MIN) * prog;
      this.distancia += this.velocidade * dt;
      this._rolarCenario(dt, this.velocidade);
      this._pilotar(dt);
      this._gerar(dt, prog);
      this._moverObjetos(dt);
      this._cameraPerseguicao(dt);
    } else if (this.modo === 'jogo') {
      // Pausado: só um balanço leve, tudo congelado
      this.aviaoCorpo.position.y = Math.sin(t * 1.6) * 0.04;
      this._cameraPerseguicao(dt);
    } else if (this.modo === 'queda') {
      this.tempoQueda += dt;
      this._rolarCenario(dt, this.velocidade * 0.6);
      this.aviao.position.y -= dt * (3 + this.tempoQueda * 6);
      this.aviao.rotation.z += dt * 7;
      this.aviao.rotation.x = Math.min(0.9, this.aviao.rotation.x + dt * 0.8);
      if (Math.random() < 0.5) this._explosao(this.aviao.position, this.mat.fumaca, 1, 2, 0.35);
      this._moverObjetos(dt, true);
      this._cameraPerseguicao(dt);
    }

    this._atualizarParticulas(dt);

    // Piscar quando invencível
    if (this.invencivel > 0) {
      this.invencivel -= dt;
      this.aviao.visible = this.modo !== 'jogo' || !emMovimento || Math.floor(this.invencivel * 12) % 2 === 0 || this.invencivel <= 0;
    } else {
      this.aviao.visible = true;
    }

    this.ceu.position.copy(this.camera.position);
    this.renderer.render(this.cena, this.camera);
  }

  _rolarCenario(dt, vel) {
    const dz = vel * dt;
    const limite = this.camera.position.z + TRECHO / 2 + 20;
    for (const trecho of this.trechos) {
      trecho.position.z += dz;
      if (trecho.position.z > limite) trecho.position.z -= TRECHO * NUM_TRECHOS;
    }
    for (const n of this.decoracao) {
      n.position.z += dz * 0.85;
      if (n.position.z > this.camera.position.z + 10) this._posicionarDecoracao(n, NASCER_Z - rnd(0, 80));
    }
  }

  _pilotar(dt) {
    const p = this.aviao.position;
    const antes = { x: p.x, y: p.y };
    p.x = suavizar(p.x, this.alvo.x, dt, 9);
    p.y = suavizar(p.y, this.alvo.y, dt, 9);
    const vx = (p.x - antes.x) / Math.max(dt, 1e-4);
    const vy = (p.y - antes.y) / Math.max(dt, 1e-4);
    this.velAviao.set(vx, vy);
    const t = this.relogio;
    this.aviaoCorpo.rotation.z = suavizar(this.aviaoCorpo.rotation.z, THREE.MathUtils.clamp(-vx * 0.09, -0.85, 0.85), dt, 10);
    this.aviaoCorpo.rotation.x = suavizar(this.aviaoCorpo.rotation.x, THREE.MathUtils.clamp(vy * 0.06, -0.4, 0.4), dt, 10);
    this.aviaoCorpo.rotation.y = suavizar(this.aviaoCorpo.rotation.y, THREE.MathUtils.clamp(-vx * 0.03, -0.25, 0.25), dt, 10);
    this.aviaoCorpo.position.y = Math.sin(t * 2.2) * 0.06;
  }

  _gerar(dt, prog) {
    this.proxObstaculo -= dt;
    if (this.proxObstaculo <= 0) {
      this._novoObstaculo();
      this.proxObstaculo = THREE.MathUtils.lerp(1.35, 0.62, prog) * rnd(0.8, 1.2);
    }
    this.proxEstrela -= dt;
    if (this.proxEstrela <= 0) {
      this._novaEstrela();
      this.proxEstrela = rnd(1.4, 2.4);
    }
  }

  _moverObjetos(dt, semColisao = false) {
    const dz = this.velocidade * dt;
    const p = this.aviao.position;
    const t = this.relogio;

    for (let i = this.obstaculos.length - 1; i >= 0; i--) {
      const o = this.obstaculos[i];
      o.obj.position.z += dz;
      if (o.tipo === 'balao') o.obj.position.y = o.baseY + Math.sin(t * 1.5 + o.fase) * 0.3;
      if (o.tipo === 'tempestade') o.extra.visible = Math.sin(t * 9 + o.obj.position.x) > 0.2;

      if (!semColisao && this.invencivel <= 0 && Math.abs(o.obj.position.z) < 2.5) {
        if (this._colidiu(o, p)) {
          this.invencivel = 1.6;
          this.tremor = 0.6;
          this._explosao(p, this.mat.fumaca, 12, 5, 0.4);
          this.aoBater?.();
        }
      }
      if (o.obj.position.z > this.camera.position.z + 5) {
        this._removerObstaculo(o);
        this.obstaculos.splice(i, 1);
      }
    }

    for (let i = this.estrelas.length - 1; i >= 0; i--) {
      const e = this.estrelas[i];
      e.position.z += dz;
      e.rotation.y += dt * 3;
      const d = Math.hypot(e.position.x - p.x, (e.position.y - p.y) * 1.3, e.position.z - p.z);
      if (!semColisao && d < 1.6) {
        this._explosao(e.position, this.mat.brilho, 8, 4, 0.15);
        this.cena.remove(e);
        this.estrelas.splice(i, 1);
        this.aoPegarEstrela?.();
      } else if (e.position.z > this.camera.position.z + 5) {
        this.cena.remove(e);
        this.estrelas.splice(i, 1);
      }
    }
  }

  _colidiu(o, p) {
    const c = o.obj.position;
    const dx = c.x - p.x, dy = c.y - p.y, dz = c.z - p.z;
    if (o.tipo === 'torre') {
      return Math.abs(dx) < o.meiaLargura + 1.15 && p.y < o.topo + 0.3 && Math.abs(dz) < o.meiaLargura + 0.9;
    }
    const r = o.raio;
    const k = (dx / (r + 1.15)) ** 2 + (dy / (r + 0.45)) ** 2 + (dz / (r + 0.9)) ** 2;
    return k < 1;
  }

  _atualizarParticulas(dt) {
    for (let i = this.particulas.length - 1; i >= 0; i--) {
      const p = this.particulas[i];
      const u = p.userData;
      u.vida += dt;
      p.position.addScaledVector(u.v, dt);
      if (this.modo === 'jogo' || this.modo === 'queda') p.position.z += this.velocidade * dt * 0.5;
      const f = 1 - u.vida / u.max;
      p.scale.setScalar(Math.max(0.001, u.esc * (0.6 + f * 0.6)));
      if (u.vida >= u.max) {
        this.cena.remove(p);
        this.particulas.splice(i, 1);
      }
    }
  }

  _cameraPerseguicao(dt) {
    const p = this.aviao.position;
    const dist = this.distCamera;
    // Câmera atrás e acima, olhando um pouco para baixo
    let desejo = new THREE.Vector3(p.x * 0.35, Y_CENTRO + dist * 0.34 + (p.y - Y_CENTRO) * 0.3, dist);
    const olhar = new THREE.Vector3(p.x * 0.5, Y_CENTRO + 0.4 + (p.y - Y_CENTRO) * 0.5, -18);
    if (this.tremor > 0) {
      this.tremor -= dt;
      const a = this.tremor * 0.6;
      desejo = desejo.add(new THREE.Vector3(rnd(-a, a), rnd(-a, a), 0));
    }
    this._camera(dt, desejo, olhar, 5);
  }

  _camera(dt, pos, olhar, taxa) {
    this.camera.position.x = suavizar(this.camera.position.x, pos.x, dt, taxa);
    this.camera.position.y = suavizar(this.camera.position.y, pos.y, dt, taxa);
    this.camera.position.z = suavizar(this.camera.position.z, pos.z, dt, taxa);
    this.olhar.x = suavizar(this.olhar.x, olhar.x, dt, taxa);
    this.olhar.y = suavizar(this.olhar.y, olhar.y, dt, taxa);
    this.olhar.z = suavizar(this.olhar.z, olhar.z, dt, taxa);
    this.camera.lookAt(this.olhar);
  }

  redimensionar() {
    const w = window.innerWidth, h = window.innerHeight;
    this.aspecto = w / h;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = this.aspecto;
    // Celular em pé: corredor de voo mais estreito e câmera mais afastada
    this.xMax = THREE.MathUtils.clamp(3.2 + (this.aspecto - 0.5) * 3, 3.2, 6.5);
    const meiaLargura = this.xMax + 2.0;
    const tanMeio = Math.tan(THREE.MathUtils.degToRad(this.camera.fov / 2));
    this.distCamera = THREE.MathUtils.clamp(meiaLargura / (tanMeio * this.aspecto) * 0.9, 9, 26);
    this.cena.fog.near = this.distCamera + 40;
    this.cena.fog.far = this.distCamera + 185;
    this.camera.updateProjectionMatrix();
    if (this.camera.position.lengthSq() === 0) this.camera.position.set(0, Y_CENTRO + 2, 10);
  }
}
