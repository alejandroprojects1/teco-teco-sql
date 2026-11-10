// Filtro simples de nomes impróprios para o ranking.
// Não é perfeito: o professor pode corrigir qualquer nome na área do professor.

// Palavras que não podem aparecer em nenhuma parte do nome
const PROIBIDAS = [
  'merda', 'merdinh', 'porra', 'caralh', 'buceta', 'boceta', 'xoxota', 'xereca', 'piroca', 'pica', 'cacete',
  'puta', 'puto', 'putinha', 'viado', 'veado', 'bosta', 'foder', 'fuder', 'foda', 'fodase',
  'arrombad', 'desgraca', 'vagabund', 'otario', 'imbecil', 'retardad', 'babaca', 'corno',
  'cuzao', 'bunda', 'punheta', 'siririca', 'porno', 'sexo', 'rola', 'penis', 'vagina',
  'idiota', 'burro', 'nazi', 'hitler',
];
// Palavras curtas: só bloqueadas quando aparecem sozinhas (para não bloquear "Cunha", "Paulo"...)
const PROIBIDAS_INTEIRAS = ['cu', 'pau', 'fdp', 'pqp', 'vsf', 'krl', 'kct', 'prr', 'tnc', 'vtnc', 'gay', 'cuzinho'];
// Nomes comuns que contêm uma palavra proibida
const PERMITIDOS = ['rolando', 'rolanda', 'picard', 'piccolo', 'picasso', 'ipora'];

function normalizar(texto) {
  return texto
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[0@4]/g, (c) => ({ 0: 'o', '@': 'a', 4: 'a' }[c]))
    .replace(/1/g, 'i').replace(/3/g, 'e').replace(/5/g, 's').replace(/7/g, 't')
    .replace(/(.)\1+/g, '$1'); // "puuuta" → "puta"
}

// As listas passam pela mesma normalização do nome digitado
const L_PROIBIDAS = PROIBIDAS.map(normalizar);
const L_INTEIRAS = PROIBIDAS_INTEIRAS.map(normalizar);
const L_PERMITIDOS = PERMITIDOS.map(normalizar);

export function nomeImproprio(nome) {
  const n = normalizar(nome);
  const palavras = n.split(/[^a-z]+/).filter(Boolean);
  if (palavras.some((p) => L_INTEIRAS.includes(p))) return true;
  const junto = palavras.filter((p) => !L_PERMITIDOS.includes(p)).join('');
  return L_PROIBIDAS.some((p) => junto.includes(p));
}
