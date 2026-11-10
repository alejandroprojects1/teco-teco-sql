// Painel de perguntas: verdadeiro/falso, múltipla escolha e montar o comando.
import { som } from './audio.js';
import { TEMAS } from './perguntas.js';
import { CONFIG } from './config.js';
import { demonstrar, desenharDemonstracao, comandoDaPergunta } from './tabela.js';

const painel = document.getElementById('painel-pergunta');

const TIPOS = {
  vf: 'Verdadeiro ou falso?',
  escolha: 'Escolha a resposta certa',
  montar: 'Monte o comando',
};

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
// `trecho` vira <code>trecho</code>
const formatar = (s) => esc(s).replace(/`([^`]+)`/g, '<code>$1</code>');
// Junta as peças em um comando legível: "( nome" → "(nome", "TEXT )" → "TEXT)"
const juntar = (pecas) => pecas.join(' ').replace(/\( /g, '(').replace(/ \)/g, ')');

export function embaralhar(lista) {
  const a = [...lista];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const ICONE_CERTO = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.2 4.2L19 7" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const ICONE_ERRADO = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6.5 6.5l11 11M17.5 6.5l-11 11" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"/></svg>';
const ICONE_RELOGIO = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="13" r="8" fill="none" stroke="currentColor" stroke-width="2.4"/><path d="M12 9v4.5l3 2M9.5 2.5h5" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg>';

let estadoAtual = null;

/**
 * Mostra a pergunta e espera a resposta.
 * Resolve com { correto, fracaoTempo, esgotou }.
 * semTempo: sem cronômetro (modo treino).
 */
export function perguntar(q, { numero, total, semTempo = false }) {
  const tema = TEMAS.find((t) => t.id === q.tema);
  const tempoTotal = CONFIG.tempo[q.tipo];

  painel.innerHTML = `
    <div class="cartao-pergunta tema-${q.tema}" role="dialog" aria-modal="true" aria-labelledby="pq-texto">
      <div class="pq-topo">
        <span class="chip-tema">${esc(tema.nome)}</span>
        <span class="pq-num">${numero} de ${total}</span>
      </div>
      ${semTempo ? '<div class="pq-sem-tempo">Sem pressa: pense com calma</div>' : '<div class="pq-tempo" aria-hidden="true"><div class="pq-tempo-barra"></div></div>'}
      <div class="pq-tipo">${TIPOS[q.tipo]}</div>
      <h2 id="pq-texto" class="pq-texto">${formatar(q.pergunta)}</h2>
      <div class="pq-corpo"></div>
      <div class="pq-retorno" hidden></div>
    </div>`;
  painel.hidden = false;
  requestAnimationFrame(() => painel.classList.add('visivel'));

  const cartao = painel.querySelector('.cartao-pergunta');
  const corpo = painel.querySelector('.pq-corpo');
  const barra = painel.querySelector('.pq-tempo-barra');

  return new Promise((resolver) => {
    const inicio = performance.now();
    let encerrada = false;
    let raf = 0;

    const concluir = (correto, extras = {}) => {
      if (encerrada) return;
      encerrada = true;
      cancelAnimationFrame(raf);
      const decorrido = (performance.now() - inicio) / 1000;
      const fracaoTempo = semTempo ? 1 : Math.max(0, 1 - decorrido / tempoTotal);
      cartao.classList.add('respondida', correto ? 'acertou' : 'errou');
      corpo.querySelectorAll('button').forEach((b) => { b.disabled = true; });
      resolver({ correto, fracaoTempo, ...extras });
    };

    const tique = () => {
      const decorrido = (performance.now() - inicio) / 1000;
      const f = Math.max(0, 1 - decorrido / tempoTotal);
      barra.style.transform = `scaleX(${f})`;
      barra.classList.toggle('alerta', f < 0.3);
      if (f <= 0) {
        marcarRespostaCerta();
        concluir(false, { esgotou: true });
        return;
      }
      raf = requestAnimationFrame(tique);
    };
    if (!semTempo) raf = requestAnimationFrame(tique);

    let marcarRespostaCerta = () => {};

    if (q.tipo === 'vf') {
      corpo.innerHTML = `
        <div class="opcoes-vf">
          <button class="btn-opcao btn-vf vf-verdadeiro" data-valor="true"><span class="vf-icone">${ICONE_CERTO}</span>Verdadeiro</button>
          <button class="btn-opcao btn-vf vf-falso" data-valor="false"><span class="vf-icone">${ICONE_ERRADO}</span>Falso</button>
        </div>`;
      const botoes = [...corpo.querySelectorAll('button')];
      marcarRespostaCerta = () => botoes.find((b) => b.dataset.valor === String(q.resposta)).classList.add('certa');
      botoes.forEach((b) => b.addEventListener('click', () => {
        const correto = b.dataset.valor === String(q.resposta);
        b.classList.add(correto ? 'certa' : 'errada');
        if (!correto) marcarRespostaCerta();
        concluir(correto);
      }));
    }

    if (q.tipo === 'escolha') {
      const ordem = embaralhar(q.alternativas.map((texto, i) => ({ texto, certa: i === q.correta })));
      corpo.innerHTML = `<div class="opcoes-escolha">${ordem.map((o, i) => `
        <button class="btn-opcao btn-escolha" data-i="${i}">
          <span class="letra">${'ABCD'[i]}</span>
          <span class="texto${q.codigo ? ' codigo' : ''}">${q.codigo ? esc(o.texto) : formatar(o.texto)}</span>
        </button>`).join('')}</div>`;
      const botoes = [...corpo.querySelectorAll('button')];
      marcarRespostaCerta = () => botoes[ordem.findIndex((o) => o.certa)].classList.add('certa');
      botoes.forEach((b) => b.addEventListener('click', () => {
        const correto = ordem[Number(b.dataset.i)].certa;
        b.classList.add(correto ? 'certa' : 'errada');
        if (!correto) marcarRespostaCerta();
        concluir(correto);
      }));
    }

    if (q.tipo === 'montar') {
      const todas = [...q.pecas, ...q.extras].map((texto, id) => ({ texto, id }));
      let pool = embaralhar(todas);
      // Evita que as peças já venham na ordem certa
      while (pool.slice(0, q.pecas.length).every((p, i) => p.texto === q.pecas[i])) pool = embaralhar(todas);
      const escolhidas = [];

      corpo.innerHTML = `
        <div class="montagem" aria-live="polite">
          <span class="montagem-dica">Toque nas peças abaixo, na ordem certa</span>
          <div class="montagem-linha"></div>
        </div>
        <div class="pecas"></div>
        <div class="acoes-montar">
          <button class="btn btn-secundario btn-limpar" disabled>Limpar</button>
          <button class="btn btn-principal btn-confirmar" disabled>Confirmar</button>
        </div>`;
      const linha = corpo.querySelector('.montagem-linha');
      const dica = corpo.querySelector('.montagem-dica');
      const areaPecas = corpo.querySelector('.pecas');
      const btnLimpar = corpo.querySelector('.btn-limpar');
      const btnConfirmar = corpo.querySelector('.btn-confirmar');

      const desenhar = () => {
        linha.innerHTML = escolhidas.map((p) => `<button class="peca peca-usada" data-id="${p.id}">${esc(p.texto)}</button>`).join('');
        areaPecas.innerHTML = pool.map((p) => {
          const usada = escolhidas.some((e) => e.id === p.id);
          return `<button class="peca${usada ? ' peca-vazia' : ''}" data-id="${p.id}" ${usada ? 'disabled aria-hidden="true"' : ''}>${esc(p.texto)}</button>`;
        }).join('');
        dica.hidden = escolhidas.length > 0;
        btnLimpar.disabled = escolhidas.length === 0 || encerrada;
        btnConfirmar.disabled = escolhidas.length === 0 || encerrada;
      };

      areaPecas.addEventListener('click', (ev) => {
        const b = ev.target.closest('.peca');
        if (!b || b.disabled || encerrada) return;
        escolhidas.push(todas[Number(b.dataset.id)]);
        som.peca();
        desenhar();
      });
      linha.addEventListener('click', (ev) => {
        const b = ev.target.closest('.peca');
        if (!b || encerrada) return;
        const i = escolhidas.findIndex((p) => p.id === Number(b.dataset.id));
        escolhidas.splice(i, 1);
        som.clique();
        desenhar();
      });
      btnLimpar.addEventListener('click', () => { escolhidas.length = 0; som.clique(); desenhar(); });

      const mostrarGabarito = () => {
        const g = document.createElement('div');
        g.className = 'gabarito';
        g.innerHTML = `<span>Resposta certa</span><code>${esc(juntar(q.pecas))}</code>`;
        corpo.querySelector('.montagem').after(g);
      };
      marcarRespostaCerta = () => mostrarGabarito();

      btnConfirmar.addEventListener('click', () => {
        const correto = escolhidas.map((p) => p.texto).join(' ') === q.pecas.join(' ');
        corpo.querySelector('.montagem').classList.add(correto ? 'certa' : 'errada');
        if (!correto) mostrarGabarito();
        corpo.querySelector('.acoes-montar').remove();
        areaPecas.remove();
        concluir(correto);
      });
      desenhar();
    }

    estadoAtual = { cartao, q };
  });
}

/**
 * Mostra o retorno (acertou/errou + explicação) e espera o botão "Continuar".
 */
export function mostrarRetorno({ correto, esgotou, pontos, combo, textoBotao, treino = false }) {
  const { cartao, q } = estadoAtual;
  const retorno = cartao.querySelector('.pq-retorno');
  const titulo = correto ? 'Acertou!' : esgotou ? 'Tempo esgotado!' : 'Não foi dessa vez';
  const icone = correto ? ICONE_CERTO : esgotou ? ICONE_RELOGIO : ICONE_ERRADO;
  retorno.innerHTML = `
    <div class="retorno-cabecalho">
      <span class="retorno-icone">${icone}</span>
      <div class="retorno-titulo">
        <strong>${titulo}</strong>
        <span>${treino
          ? (correto ? 'Muito bem, piloto!' : 'Tudo bem, é treino! Leia a explicação.')
          : (correto ? `+${pontos} pontos${combo > 1 ? ` · combo x${combo}` : ''}` : 'Você perdeu 1 vida')}</span>
      </div>
    </div>
    <p class="retorno-explicacao">${formatar(q.explicacao)}</p>
    <div class="demo-espaco"></div>
    <button class="btn btn-principal btn-continuar">${textoBotao}</button>`;
  retorno.hidden = false;
  cartao.querySelector('.pq-tempo')?.classList.add('parado');
  mostrarDemonstracao(q, retorno.querySelector('.demo-espaco'));
  // Garante que o botão fique visível em telas pequenas
  requestAnimationFrame(() => retorno.scrollIntoView({ behavior: 'smooth', block: 'start' }));

  return new Promise((resolver) => {
    const btn = retorno.querySelector('.btn-continuar');
    btn.addEventListener('click', () => { som.clique(); resolver(); }, { once: true });
    setTimeout(() => btn.focus({ preventScroll: true }), 50);
  });
}

export function fecharPergunta() {
  painel.classList.remove('visivel');
  return new Promise((r) => setTimeout(() => { painel.hidden = true; painel.innerHTML = ''; r(); }, 220));
}

// Executa o comando de exemplo e mostra a tabela no retorno
async function mostrarDemonstracao(q, espaco) {
  const sql = comandoDaPergunta(q);
  if (!sql || !espaco) return;
  espaco.innerHTML = '<div class="demo demo-carregando"><span class="demo-girando"></span>Executando o comando…</div>';
  try {
    const r = await demonstrar(sql);
    if (!espaco.isConnected) return;
    espaco.innerHTML = desenharDemonstracao(sql, r);
  } catch (erro) {
    console.warn('Não foi possível mostrar a tabela:', erro);
    espaco.innerHTML = '';
  }
}
