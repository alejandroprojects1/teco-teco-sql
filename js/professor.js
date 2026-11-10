// Área do professor: login, lista de alunos, renomear, apagar, zerar e baixar planilha.
import { CONFIG } from './config.js';
import { rankingAtivo, entrar, renovarSessao, sairDaConta, rpc, buscarTodasPartidas } from './ranking.js';

const $ = (id) => document.getElementById(id);
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const CHAVE_SESSAO = 'teco:professor';

let sessao = null;
let partidas = [];
let jogadores = [];

// ───────────── Sessão ─────────────
function guardarSessao(s) {
  sessao = s;
  try {
    if (s) sessionStorage.setItem(CHAVE_SESSAO, JSON.stringify(s));
    else sessionStorage.removeItem(CHAVE_SESSAO);
  } catch { /* ignora */ }
}
function lerSessao() {
  try { return JSON.parse(sessionStorage.getItem(CHAVE_SESSAO)); } catch { return null; }
}
function deResposta(r) {
  return {
    token: r.access_token,
    renovar: r.refresh_token,
    expira: Date.now() + (r.expires_in || 3600) * 1000,
    email: r.user?.email || '',
  };
}
async function token() {
  if (!sessao) throw new Error('Entre novamente.');
  if (Date.now() > sessao.expira - 60000) {
    guardarSessao(deResposta(await renovarSessao(sessao.renovar)));
  }
  return sessao.token;
}

// ───────────── Telas ─────────────
function mostrar(qual) {
  $('sem-config').hidden = qual !== 'sem-config';
  $('form-login').hidden = qual !== 'login';
  $('painel').hidden = qual !== 'painel';
  $('btn-sair').hidden = qual !== 'painel';
}

function aviso(texto, tipo = 'ok') {
  const el = $('aviso');
  el.textContent = texto;
  el.className = `prof-aviso ${tipo}`;
  el.hidden = false;
  clearTimeout(aviso.t);
  aviso.t = setTimeout(() => { el.hidden = true; }, 3500);
}

// ───────────── Login ─────────────
$('form-login').addEventListener('submit', async (ev) => {
  ev.preventDefault();
  const erro = $('erro-login');
  const email = $('email').value.trim();
  const senha = $('senha').value;
  if (!email || !senha) {
    erro.textContent = 'Preencha o e-mail e a senha.';
    erro.hidden = false;
    return;
  }
  erro.hidden = true;
  const btn = $('btn-entrar');
  btn.disabled = true;
  btn.textContent = 'Entrando…';
  try {
    guardarSessao(deResposta(await entrar(email, senha)));
    const professor = await rpc('eh_professor', {}, sessao.token);
    if (!professor) {
      await sairDaConta(sessao.token);
      guardarSessao(null);
      throw new Error('Este e-mail não está cadastrado como professor (tabela "professores").');
    }
    $('senha').value = '';
    mostrar('painel');
    await carregar();
  } catch (e) {
    erro.textContent = e.message;
    erro.hidden = false;
  } finally {
    btn.disabled = false;
    btn.textContent = 'Entrar';
  }
});

$('btn-sair').addEventListener('click', async () => {
  if (sessao) await sairDaConta(sessao.token);
  guardarSessao(null);
  mostrar('login');
});

// ───────────── Dados ─────────────
function agrupar(lista) {
  const mapa = new Map();
  for (const p of lista) {
    const chave = p.nome.trim().toLowerCase();
    let j = mapa.get(chave);
    if (!j) {
      j = { nome: p.nome, melhor: p, partidas: 0, ultima: p.criado_em };
      mapa.set(chave, j);
    }
    j.partidas++;
    if (p.pontos > j.melhor.pontos) j.melhor = p;
    if (p.criado_em > j.ultima) { j.ultima = p.criado_em; j.nome = p.nome; }
  }
  return [...mapa.values()].sort((a, b) => b.melhor.pontos - a.melhor.pontos);
}

async function carregar() {
  const area = $('lista-jogadores');
  area.innerHTML = '<p class="prof-vazio"><span class="mini-girando"></span> Carregando…</p>';
  try {
    partidas = await buscarTodasPartidas(await token());
    jogadores = agrupar(partidas);
    $('n-jogadores').textContent = jogadores.length;
    $('n-partidas').textContent = partidas.length;
    const media = partidas.length ? partidas.reduce((s, p) => s + p.acertos, 0) / partidas.length : 0;
    $('n-media').textContent = `${media.toFixed(1).replace('.', ',')}/15`;
    desenhar();
  } catch (e) {
    area.innerHTML = `<p class="prof-vazio">Não foi possível carregar: ${esc(e.message)}</p>`;
    if (/sessão|JWT|Entre/i.test(e.message)) { guardarSessao(null); mostrar('login'); }
  }
}

const dataCurta = (iso) => new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });

function desenhar() {
  const area = $('lista-jogadores');
  const termo = $('busca').value.trim().toLowerCase();
  const visiveis = jogadores
    .map((j, i) => ({ ...j, posicao: i + 1 }))
    .filter((j) => !termo || j.nome.toLowerCase().includes(termo));
  if (!jogadores.length) {
    area.innerHTML = '<p class="prof-vazio">Nenhuma partida no ranking ainda.</p>';
    return;
  }
  if (!visiveis.length) {
    area.innerHTML = '<p class="prof-vazio">Nenhum aluno encontrado.</p>';
    return;
  }
  area.innerHTML = visiveis.map((j) => `
    <div class="jogador">
      <span class="jogador-pos">${j.posicao}º</span>
      <div class="jogador-info">
        <strong>${esc(j.nome)}</strong>
        <span>${j.melhor.pontos} pts · ✓ ${j.melhor.acertos}/15 · ${j.partidas} ${j.partidas === 1 ? 'partida' : 'partidas'} · ${dataCurta(j.ultima)}</span>
      </div>
      <div class="jogador-acoes">
        <button class="btn-icone" data-acao="renomear" data-nome="${esc(j.nome)}" aria-label="Renomear ${esc(j.nome)}" title="Renomear">✏️</button>
        <button class="btn-icone perigo" data-acao="apagar" data-nome="${esc(j.nome)}" aria-label="Apagar ${esc(j.nome)}" title="Apagar">🗑️</button>
      </div>
    </div>`).join('');
}

$('busca').addEventListener('input', desenhar);
$('btn-atualizar').addEventListener('click', carregar);

// ───────────── Janela (confirmações e edição) ─────────────
function janela({ titulo, corpo, textoOk, perigo = false, aoConfirmar, aoAbrir }) {
  $('janela-titulo').textContent = titulo;
  $('janela-corpo').innerHTML = corpo;
  $('janela-erro').hidden = true;
  const ok = $('janela-ok');
  ok.textContent = textoOk;
  ok.className = `btn ${perigo ? 'btn-perigo' : 'btn-principal'}`;
  $('janela').hidden = false;
  aoAbrir?.();
  const fechar = () => { $('janela').hidden = true; ok.onclick = null; };
  $('janela-cancelar').onclick = fechar;
  ok.onclick = async () => {
    ok.disabled = true;
    try {
      await aoConfirmar();
      fechar();
    } catch (e) {
      $('janela-erro').textContent = e.message;
      $('janela-erro').hidden = false;
    } finally {
      ok.disabled = false;
    }
  };
}
document.addEventListener('keydown', (ev) => { if (ev.key === 'Escape' && !$('janela').hidden) $('janela-cancelar').click(); });

$('lista-jogadores').addEventListener('click', (ev) => {
  const b = ev.target.closest('[data-acao]');
  if (!b) return;
  const nome = b.dataset.nome;
  if (b.dataset.acao === 'renomear') {
    janela({
      titulo: 'Renomear aluno',
      corpo: `<p>Novo nome para <b>${esc(nome)}</b>:</p>
        <label class="campo"><input id="novo-nome" maxlength="20" value="${esc(nome)}"></label>`,
      textoOk: 'Salvar',
      aoAbrir: () => setTimeout(() => $('novo-nome').select(), 30),
      aoConfirmar: async () => {
        const novo = $('novo-nome').value.trim().replace(/\s+/g, ' ');
        if (novo.length < 2 || novo.length > 20) throw new Error('O nome deve ter de 2 a 20 letras.');
        const n = await rpc('renomear_jogador', { antigo: nome, novo }, await token());
        aviso(`Nome alterado em ${n} ${n === 1 ? 'partida' : 'partidas'}.`);
        await carregar();
      },
    });
  } else {
    janela({
      titulo: 'Apagar aluno do ranking?',
      corpo: `<p>Todas as partidas de <b>${esc(nome)}</b> serão apagadas. Isso não pode ser desfeito.</p>`,
      textoOk: 'Apagar',
      perigo: true,
      aoConfirmar: async () => {
        const n = await rpc('apagar_jogador', { alvo: nome }, await token());
        aviso(`${n} ${n === 1 ? 'partida apagada' : 'partidas apagadas'}.`);
        await carregar();
      },
    });
  }
});

$('btn-zerar').addEventListener('click', () => {
  janela({
    titulo: 'Zerar o ranking?',
    corpo: `<p>Isso apaga <b>todas as ${partidas.length} partidas</b> de todos os alunos. Não pode ser desfeito.</p>
      <p>Se quiser guardar as notas, <button type="button" class="btn-link" id="csv-antes">baixe a planilha antes</button>.</p>
      <label class="campo"><span class="campo-rotulo">Para confirmar, digite ZERAR</span><input id="confirma-zerar" autocomplete="off"></label>`,
    textoOk: 'Zerar ranking',
    perigo: true,
    aoAbrir: () => { $('csv-antes').onclick = baixarCSV; },
    aoConfirmar: async () => {
      if ($('confirma-zerar').value.trim().toUpperCase() !== 'ZERAR') throw new Error('Digite ZERAR para confirmar.');
      const n = await rpc('zerar_ranking', {}, await token());
      aviso(`Ranking zerado: ${n} ${n === 1 ? 'partida apagada' : 'partidas apagadas'}.`);
      await carregar();
    },
  });
});

// ───────────── Planilha (CSV para Excel / Google Planilhas) ─────────────
function baixarCSV() {
  const campo = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const linhas = [['Nome', 'Turma', 'Pontos', 'Acertos (de 15)', 'Maior combo', 'Distância (m)', 'Data']];
  for (const p of [...partidas].sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR') || b.pontos - a.pontos)) {
    linhas.push([p.nome, p.turma, p.pontos, p.acertos, p.maior_combo, p.distancia, new Date(p.criado_em).toLocaleString('pt-BR')]);
  }
  const csv = '﻿' + linhas.map((l) => l.map(campo).join(';')).join('\r\n');
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = `teco-teco-sql-ranking-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  aviso('Planilha baixada.');
}
$('btn-csv').addEventListener('click', baixarCSV);

// ───────────── Início ─────────────
(async () => {
  if (!rankingAtivo()) { mostrar('sem-config'); return; }
  const salva = lerSessao();
  if (salva) {
    sessao = salva;
    mostrar('painel');
    await carregar();
    if (!sessao) mostrar('login');
  } else {
    mostrar('login');
  }
  document.title = `Área do professor · ${CONFIG.turmas[0] || 'Teco-Teco SQL'}`;
})();
