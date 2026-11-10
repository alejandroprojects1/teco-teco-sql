// Comunicação com o Supabase: enviar pontuações, buscar o ranking e login do professor.
// Usa a API REST do Supabase diretamente (sem bibliotecas extras).
import { CONFIG } from './config.js';

const cfg = CONFIG.ranking || {};
const CHAVE_PENDENTES = 'teco:pendentes';

export const rankingAtivo = () => Boolean(cfg.url && cfg.chave);

const base = () => String(cfg.url).replace(/\/+$/, '');

/** Chamada genérica à API do Supabase. Lança Error com mensagem amigável. */
export async function chamar(caminho, { metodo = 'GET', corpo, token, prefer } = {}) {
  if (!rankingAtivo()) throw new Error('O ranking ainda não foi configurado.');
  const cabecalhos = { apikey: cfg.chave, 'Content-Type': 'application/json' };
  if (token) cabecalhos.Authorization = `Bearer ${token}`;
  if (prefer) cabecalhos.Prefer = prefer;
  const controle = new AbortController();
  const limite = setTimeout(() => controle.abort(), 12000);
  let resposta;
  try {
    resposta = await fetch(base() + caminho, {
      method: metodo,
      headers: cabecalhos,
      body: corpo === undefined ? undefined : JSON.stringify(corpo),
      signal: controle.signal,
    });
  } catch {
    throw new Error('Sem conexão com a internet.');
  } finally {
    clearTimeout(limite);
  }
  const texto = await resposta.text();
  let dados = null;
  try { dados = texto ? JSON.parse(texto) : null; } catch { dados = texto; }
  if (!resposta.ok) {
    const msg = dados?.message || dados?.msg || dados?.error_description || dados?.error || `Erro ${resposta.status}`;
    const erro = new Error(traduzir(msg));
    erro.status = resposta.status;
    throw erro;
  }
  return dados;
}

function traduzir(msg) {
  if (/invalid login credentials/i.test(msg)) return 'E-mail ou senha incorretos.';
  if (/email not confirmed/i.test(msg)) return 'Este e-mail ainda não foi confirmado no Supabase.';
  if (/JWT expired/i.test(msg)) return 'Sua sessão expirou. Entre de novo.';
  if (/check constraint/i.test(msg)) return 'Pontuação inválida.';
  return msg;
}

// ───────────── Alunos ─────────────
export function enviarPontuacao(p) {
  return chamar('/rest/v1/pontuacoes', { metodo: 'POST', corpo: p, prefer: 'return=minimal' });
}

export function buscarRanking(limite = 50) {
  return chamar(`/rest/v1/ranking?select=nome,turma,pontos,acertos,maior_combo,criado_em&order=pontos.desc,criado_em.asc&limit=${limite}`);
}

// Pontuações que não puderam ser enviadas (sem internet) ficam guardadas para depois
function lerPendentes() {
  try { return JSON.parse(localStorage.getItem(CHAVE_PENDENTES)) || []; } catch { return []; }
}
function gravarPendentes(lista) {
  try { localStorage.setItem(CHAVE_PENDENTES, JSON.stringify(lista.slice(-20))); } catch { /* ignora */ }
}
export function guardarPendente(p) {
  gravarPendentes([...lerPendentes(), p]);
}
export async function enviarPendentes() {
  if (!rankingAtivo()) return 0;
  const lista = lerPendentes();
  if (!lista.length) return 0;
  const restantes = [];
  let enviadas = 0;
  for (const p of lista) {
    try {
      await enviarPontuacao(p);
      enviadas++;
    } catch (e) {
      // Recusada pelo banco (dados inválidos): descarta. Sem internet: tenta depois.
      if (!e.status || e.status >= 500 || /Aguarde/.test(e.message)) restantes.push(p);
    }
  }
  gravarPendentes(restantes);
  return enviadas;
}

// ───────────── Professor ─────────────
export async function entrar(email, senha) {
  return chamar('/auth/v1/token?grant_type=password', { metodo: 'POST', corpo: { email, password: senha } });
}
export async function renovarSessao(refreshToken) {
  return chamar('/auth/v1/token?grant_type=refresh_token', { metodo: 'POST', corpo: { refresh_token: refreshToken } });
}
export async function sairDaConta(token) {
  try { await chamar('/auth/v1/logout', { metodo: 'POST', token }); } catch { /* ignora */ }
}
export function rpc(funcao, args, token) {
  return chamar(`/rest/v1/rpc/${funcao}`, { metodo: 'POST', corpo: args || {}, token });
}
export function buscarTodasPartidas(token) {
  return chamar('/rest/v1/pontuacoes?select=id,nome,turma,pontos,acertos,maior_combo,distancia,criado_em&order=criado_em.desc&limit=10000', { token });
}
