// Teco-Teco SQL — controle das telas e regras da partida.
import { Mundo } from './mundo.js';
import { CONFIG } from './config.js';
import { TEMAS, PERGUNTAS } from './perguntas.js';
import { perguntar, mostrarRetorno, fecharPergunta, embaralhar } from './quiz.js';
import { som, iniciarAudio, alternarSom, estaMudo, motorLigado, motorVelocidade, vibrar } from './audio.js';

const $ = (id) => document.getElementById(id);
const armazenamento = {
  ler(chave, padrao) { try { return JSON.parse(localStorage.getItem(chave)) ?? padrao; } catch { return padrao; } },
  gravar(chave, valor) { try { localStorage.setItem(chave, JSON.stringify(valor)); } catch { /* ignora */ } },
};

// ───────────── Mundo 3D ─────────────
let mundo;
try {
  mundo = new Mundo($('cena'));
} catch (erro) {
  $('carregando').innerHTML = '<span>Seu navegador não conseguiu abrir o jogo em 3D. Tente atualizar o navegador ou usar o Chrome.</span>';
  throw erro;
}

let fase = 'menu'; // menu | voo | pergunta | contagem | pausa | queda | fim
let estado = null;

// ───────────── Tela inicial ─────────────
const jogador = armazenamento.ler('teco:jogador', { nome: '', turma: '' });
$('nome').value = jogador.nome;

$('turmas').innerHTML = CONFIG.turmas.map((t) => `
  <button type="button" class="turma${t === jogador.turma ? ' ativa' : ''}" role="radio" aria-checked="${t === jogador.turma}" data-turma="${t}">${t}</button>`).join('');
$('turmas').addEventListener('click', (ev) => {
  const b = ev.target.closest('.turma');
  if (!b) return;
  document.querySelectorAll('.turma').forEach((x) => { x.classList.toggle('ativa', x === b); x.setAttribute('aria-checked', x === b); });
  jogador.turma = b.dataset.turma;
  iniciarAudio();
  som.clique();
});

function mostrarTela(id) {
  document.querySelectorAll('.tela').forEach((t) => t.classList.toggle('ativa', t.id === id));
}

$('form-inicio').addEventListener('submit', (ev) => {
  ev.preventDefault();
  iniciarAudio();
  const nome = $('nome').value.trim().replace(/\s+/g, ' ');
  const erro = $('erro-inicio');
  if (nome.length < 2) {
    erro.textContent = 'Digite seu nome (pelo menos 2 letras).';
    erro.hidden = false;
    $('nome').focus();
    som.erro();
    return;
  }
  if (!jogador.turma) {
    erro.textContent = 'Escolha a sua turma.';
    erro.hidden = false;
    som.erro();
    return;
  }
  erro.hidden = true;
  jogador.nome = nome;
  armazenamento.gravar('teco:jogador', jogador);
  $('nome').blur();
  novaPartida();
});

$('btn-como').addEventListener('click', () => { iniciarAudio(); som.clique(); $('tela-como').hidden = false; });
$('btn-fechar-como').addEventListener('click', () => { som.clique(); $('tela-como').hidden = true; });

// ───────────── Partida ─────────────
function montarPerguntas() {
  const lista = [];
  for (const tema of TEMAS) {
    const doTema = PERGUNTAS.filter((p) => p.tema === tema.id);
    const porTipo = ['vf', 'escolha', 'montar'].map((tipo) => embaralhar(doTema.filter((p) => p.tipo === tipo)));
    const escolhidas = [];
    // Uma de cada tipo; se precisar de mais, continua alternando
    for (let i = 0; escolhidas.length < CONFIG.perguntasPorTema; i++) {
      const grupo = porTipo[i % 3];
      const p = grupo[Math.floor(i / 3)];
      if (p) escolhidas.push(p);
      if (i > 60) break;
    }
    lista.push(...embaralhar(escolhidas));
  }
  return lista;
}

function novaPartida() {
  estado = {
    vidas: CONFIG.vidas,
    pontos: 0,
    combo: 0,
    maiorCombo: 0,
    acertos: 0,
    estrelas: 0,
    perguntas: montarPerguntas(),
    respondidas: 0,
    resultados: [], // { tema, correto }
    proximaEm: CONFIG.intervaloPrimeiraPergunta,
    tempoEntre: CONFIG.intervaloPrimeiraPergunta,
  };
  mostrarTela(null);
  $('hud').hidden = false;
  $('dica-arraste').classList.remove('sumiu');
  setTimeout(() => $('dica-arraste').classList.add('sumiu'), 3500);
  atualizarHUD();
  mundo.iniciarJogo();
  motorLigado(true);
  fase = 'contagem';
  contagem().then(() => { fase = 'voo'; });
}

function multiplicador(combo) {
  for (const c of CONFIG.combo) if (combo >= c.aPartirDe) return c.multiplicador;
  return 1;
}

async function abrirPergunta() {
  fase = 'pergunta';
  motorLigado(false);
  som.pergunta();
  const q = estado.perguntas[estado.respondidas];
  const numero = estado.respondidas + 1;
  const total = estado.perguntas.length;
  const r = await perguntar(q, { numero, total });

  estado.respondidas++;
  estado.resultados.push({ tema: q.tema, correto: r.correto });
  let ganhos = 0;
  if (r.correto) {
    estado.combo++;
    estado.maiorCombo = Math.max(estado.maiorCombo, estado.combo);
    estado.acertos++;
    const mult = multiplicador(estado.combo);
    ganhos = Math.round((CONFIG.pontos.acerto + CONFIG.pontos.bonusTempoMax * r.fracaoTempo) * mult);
    estado.pontos += ganhos;
    som.acerto();
    vibrar(30);
    confete();
  } else {
    estado.combo = 0;
    estado.vidas--;
    som.erro();
    vibrar([60, 40, 60]);
  }
  atualizarHUD(true);

  const acabou = estado.vidas <= 0 || estado.respondidas >= estado.perguntas.length;
  await mostrarRetorno({
    correto: r.correto,
    esgotou: r.esgotou,
    pontos: ganhos,
    combo: multiplicador(estado.combo),
    textoBotao: acabou ? 'Ver resultado' : 'Continuar voo',
  });
  await fecharPergunta();

  if (acabou) {
    finalizar(estado.vidas > 0);
    return;
  }
  estado.tempoEntre = CONFIG.intervaloPerguntas;
  estado.proximaEm = CONFIG.intervaloPerguntas;
  mundo.liberarCaminho();
  fase = 'contagem';
  motorLigado(true);
  await contagem();
  if (fase === 'contagem') fase = 'voo';
}

function contagem() {
  const el = $('contagem');
  el.hidden = false;
  const passos = ['3', '2', '1', 'Voe!'];
  return new Promise((resolver) => {
    let i = 0;
    const passo = () => {
      if (i >= passos.length) { el.hidden = true; el.innerHTML = ''; resolver(); return; }
      el.innerHTML = `<span class="contagem-num${i === 3 ? ' contagem-vai' : ''}">${passos[i]}</span>`;
      if (i === 3) som.vai(); else som.tique();
      i++;
      setTimeout(passo, i === 4 ? 550 : 650);
    };
    passo();
  });
}

// ───────────── Eventos do mundo ─────────────
mundo.aoBater = () => {
  if (fase !== 'voo') return;
  estado.vidas--;
  som.batida();
  vibrar(120);
  aviso('-1 vida', 'aviso-ruim');
  atualizarHUD(true);
  if (estado.vidas <= 0) {
    estado.caiu = true;
    fase = 'queda';
    motorLigado(false);
    mundo.iniciarQueda();
    setTimeout(() => finalizar(false), 1900);
  }
};

mundo.aoPegarEstrela = () => {
  if (fase !== 'voo') return;
  estado.estrelas++;
  estado.pontos += CONFIG.pontos.estrela;
  som.estrela();
  atualizarHUD();
};

// ───────────── HUD ─────────────
const CORACAO = '<svg viewBox="0 0 24 24"><path d="M12 20.5s-7.5-4.6-9.3-9.3C1.4 7.8 3.6 4.5 7 4.5c2 0 3.6 1.1 5 2.9 1.4-1.8 3-2.9 5-2.9 3.4 0 5.6 3.3 4.3 6.7-1.8 4.7-9.3 9.3-9.3 9.3z"/></svg>';
let vidasMostradas = -1;

function atualizarHUD(animar = false) {
  if (vidasMostradas !== estado.vidas) {
    $('vidas').innerHTML = Array.from({ length: CONFIG.vidas }, (_, i) => {
      const cheio = i < estado.vidas;
      const perdeuAgora = animar && i === estado.vidas && vidasMostradas > estado.vidas;
      return `<span class="coracao${cheio ? '' : ' vazio'}${perdeuAgora ? ' perdeu' : ''}">${CORACAO}</span>`;
    }).join('');
    $('vidas').setAttribute('aria-label', `${estado.vidas} vidas`);
    vidasMostradas = estado.vidas;
  }
  const atual = Math.min(estado.respondidas + (fase === 'pergunta' ? 0 : 1), estado.perguntas.length);
  $('progresso').innerHTML = `<span class="pilula-rotulo">Pergunta</span> ${atual}/${estado.perguntas.length}`;
  const pontos = $('pontos');
  if (pontos.textContent !== String(estado.pontos)) {
    pontos.textContent = estado.pontos;
    pontos.classList.remove('pulo');
    void pontos.offsetWidth;
    pontos.classList.add('pulo');
  }
  const mult = multiplicador(estado.combo);
  const combo = $('combo');
  combo.hidden = estado.combo < 2;
  combo.textContent = mult > 1 ? `🔥 Combo x${mult}` : `🔥 ${estado.combo} seguidas`;
  combo.classList.toggle('quente', mult > 1);
}

function aviso(texto, classe) {
  const el = document.createElement('div');
  el.className = `aviso ${classe}`;
  el.textContent = texto;
  $('avisos').appendChild(el);
  setTimeout(() => el.remove(), 1200);
}

function confete() {
  const area = $('confete');
  const cores = ['#ff6b6b', '#ffd43b', '#51cf66', '#4dabf7', '#cc5de8', '#ff922b'];
  for (let i = 0; i < 36; i++) {
    const p = document.createElement('i');
    p.style.setProperty('--x', `${(Math.random() - 0.5) * 120}vw`);
    p.style.setProperty('--y', `${-30 - Math.random() * 50}vh`);
    p.style.setProperty('--r', `${Math.random() * 720 - 360}deg`);
    p.style.setProperty('--d', `${0.9 + Math.random() * 0.7}s`);
    p.style.background = cores[i % cores.length];
    area.appendChild(p);
    setTimeout(() => p.remove(), 1800);
  }
}

// ───────────── Pausa e som ─────────────
let faseAntesPausa = null;
function pausar() {
  if (fase !== 'voo') return;
  faseAntesPausa = fase;
  fase = 'pausa';
  motorLigado(false);
  $('tela-pausa').hidden = false;
}
async function despausar() {
  if (fase !== 'pausa') return;
  $('tela-pausa').hidden = true;
  fase = 'contagem';
  motorLigado(true);
  await contagem();
  if (fase === 'contagem') fase = faseAntesPausa || 'voo';
}
$('btn-pausa').addEventListener('click', () => { som.clique(); pausar(); });
$('btn-continuar-pausa').addEventListener('click', () => { som.clique(); despausar(); });
$('btn-sair').addEventListener('click', () => { som.clique(); $('tela-pausa').hidden = true; irParaInicio(); });
document.addEventListener('visibilitychange', () => { if (document.hidden) pausar(); });

const ICONE_SOM = '<svg viewBox="0 0 24 24"><path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" fill="currentColor"/><path d="M15.5 9a4 4 0 010 6M18 6.5a7.5 7.5 0 010 11" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
const ICONE_MUDO = '<svg viewBox="0 0 24 24"><path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" fill="currentColor"/><path d="M16 9.5l5 5M21 9.5l-5 5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
const desenharSom = () => { $('btn-som').innerHTML = estaMudo() ? ICONE_MUDO : ICONE_SOM; };
desenharSom();
$('btn-som').addEventListener('click', () => { iniciarAudio(); alternarSom(); desenharSom(); });

// ───────────── Fim de partida ─────────────
function finalizar(completou) {
  fase = 'fim';
  motorLigado(false);
  $('hud').hidden = true;
  const bonusDistancia = Math.floor(mundo.distancia / CONFIG.pontos.metrosPorPonto);
  const pontosPerguntas = estado.pontos - estado.estrelas * CONFIG.pontos.estrela;
  const total = estado.pontos + bonusDistancia;
  const nPerg = estado.perguntas.length;

  const recorde = armazenamento.ler('teco:recorde', 0);
  const novoRecorde = recorde > 0 && total > recorde;
  if (total > recorde) armazenamento.gravar('teco:recorde', total);

  const taxa = estado.acertos / nPerg;
  const [selo, titulo] = taxa >= 0.85 ? ['🏆', 'Ás do SQL!']
    : taxa >= 0.65 ? ['🥇', 'Piloto de primeira!']
      : taxa >= 0.4 ? ['✈️', 'Bom voo!']
        : ['🧭', 'Continue treinando!'];
  $('res-selo').textContent = selo;
  $('res-titulo').textContent = titulo;
  $('res-sub').textContent = completou
    ? `${jogador.nome}, você completou as ${nPerg} perguntas!`
    : estado.caiu
      ? `${jogador.nome}, seu teco-teco caiu! Você respondeu ${estado.respondidas} de ${nPerg} perguntas.`
      : `${jogador.nome}, suas vidas acabaram na pergunta ${estado.respondidas}.`;
  $('res-acertos').textContent = `${estado.acertos}/${nPerg}`;
  $('res-combo').textContent = estado.maiorCombo;
  $('res-distancia').textContent = `${Math.round(mundo.distancia)} m`;
  $('res-recorde').hidden = !novoRecorde;
  $('res-detalhe').innerHTML = `
    <span>Perguntas <b>${pontosPerguntas}</b></span>
    <span>Estrelas <b>${estado.estrelas * CONFIG.pontos.estrela}</b></span>
    <span>Distância <b>${bonusDistancia}</b></span>`;

  $('res-temas').innerHTML = TEMAS.map((t) => {
    const r = estado.resultados.filter((x) => x.tema === t.id);
    const bolinhas = Array.from({ length: CONFIG.perguntasPorTema }, (_, i) => {
      const c = r[i] ? (r[i].correto ? 'ok' : 'nao') : '';
      return `<i class="bolinha ${c}"></i>`;
    }).join('');
    return `<div class="res-tema tema-${t.id}" title="${t.nome}"><span class="chip-tema">${t.nome.split(' ')[0]}</span><span class="bolinhas">${bolinhas}</span></div>`;
  }).join('');

  mostrarTela('tela-resultado');
  if (taxa >= 0.65) { som.vitoria(); confete(); } else som.fim();
  animarNumero($('res-pontos'), total);
}

function animarNumero(el, alvo) {
  const inicio = performance.now();
  const dur = 1200;
  const passo = (agora) => {
    const t = Math.min(1, (agora - inicio) / dur);
    el.textContent = Math.round(alvo * (1 - (1 - t) ** 3));
    if (t < 1) requestAnimationFrame(passo);
  };
  requestAnimationFrame(passo);
}

function irParaInicio() {
  fase = 'menu';
  motorLigado(false);
  $('hud').hidden = true;
  $('contagem').hidden = true;
  mundo.voltarAoMenu();
  mostrarTela('tela-inicio');
}

$('btn-de-novo').addEventListener('click', () => { som.clique(); novaPartida(); });
$('btn-inicio').addEventListener('click', () => { som.clique(); irParaInicio(); });

// ───────────── Controles ─────────────
let toque = null;
window.addEventListener('pointerdown', (ev) => {
  if (fase !== 'voo' && fase !== 'contagem') return;
  if (ev.target.closest('button')) return;
  toque = { id: ev.pointerId, x: ev.clientX, y: ev.clientY };
});
window.addEventListener('pointermove', (ev) => {
  if (!toque || ev.pointerId !== toque.id) return;
  const dx = ev.clientX - toque.x;
  const dy = ev.clientY - toque.y;
  toque.x = ev.clientX;
  toque.y = ev.clientY;
  if (fase !== 'voo') return;
  const esc = mundo.escalaControle;
  const ref = Math.min(window.innerWidth, 520);
  mundo.moverAlvo((dx / ref) * esc.x, (-dy / Math.min(window.innerHeight, 700)) * esc.y);
  $('dica-arraste').classList.add('sumiu');
});
const soltar = (ev) => { if (toque && ev.pointerId === toque.id) toque = null; };
window.addEventListener('pointerup', soltar);
window.addEventListener('pointercancel', soltar);

const teclas = new Set();
window.addEventListener('keydown', (ev) => {
  if (ev.target.tagName === 'INPUT') return;
  const k = ev.key.toLowerCase();
  if (['arrowleft', 'arrowright', 'arrowup', 'arrowdown', 'a', 'd', 'w', 's'].includes(k)) {
    teclas.add(k);
    ev.preventDefault();
  }
  if (k === 'escape' || k === 'p') { if (fase === 'voo') pausar(); else if (fase === 'pausa') despausar(); }
});
window.addEventListener('keyup', (ev) => teclas.delete(ev.key.toLowerCase()));

function lerTeclado(dt) {
  if (!teclas.size) return;
  let x = 0, y = 0;
  if (teclas.has('arrowleft') || teclas.has('a')) x -= 1;
  if (teclas.has('arrowright') || teclas.has('d')) x += 1;
  if (teclas.has('arrowup') || teclas.has('w')) y += 1;
  if (teclas.has('arrowdown') || teclas.has('s')) y -= 1;
  mundo.moverAlvo(x * dt * 9, y * dt * 6);
}

// ───────────── Laço principal ─────────────
let ultimo = performance.now();
function quadro(agora) {
  const dt = Math.min(0.05, (agora - ultimo) / 1000);
  ultimo = agora;

  if (fase === 'voo') {
    lerTeclado(dt);
    mundo.atualizar(dt, true);
    motorVelocidade(mundo.velocidade);
    estado.proximaEm -= dt;
    $('proxima-barra').style.transform = `scaleX(${1 - Math.max(0, estado.proximaEm) / estado.tempoEntre})`;
    if (estado.proximaEm <= 0 && fase === 'voo') abrirPergunta();
  } else if (fase === 'menu' || fase === 'fim') {
    if (fase === 'fim' && mundo.modo !== 'menu') mundo.voltarAoMenu();
    mundo.atualizar(dt, false);
  } else if (fase === 'queda') {
    mundo.atualizar(dt, true);
  } else {
    mundo.atualizar(dt, false);
  }
  requestAnimationFrame(quadro);
}

window.addEventListener('resize', () => mundo.redimensionar());

// Pronto!
$('carregando').classList.add('sumiu');
setTimeout(() => $('carregando').remove(), 600);
mostrarTela('tela-inicio');
requestAnimationFrame(quadro);
