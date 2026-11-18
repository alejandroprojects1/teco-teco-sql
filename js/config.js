// Configurações do jogo. Ajuste à vontade.
export const CONFIG = {
  // Ranking online (Supabase). Veja o passo a passo no README.
  // Em Supabase → Project Settings → API (ou Data API / API Keys), copie:
  //   url:   o "Project URL" (ex.: https://abcdefgh.supabase.co)
  //   chave: a chave pública "anon" / "publishable" (NUNCA a "service_role" / "secret")
  // Enquanto estiver vazio, o jogo funciona normalmente, só sem ranking.
  ranking: {
    url: 'https://gfooxeqeapcupqgqyasl.supabase.co',
    chave: 'sb_publishable_TQVwCQadH9Xq8xP3qqA0xQ_Yk55mlYs',
  },

  // Turmas que aparecem para o aluno escolher.
  // Com uma turma só, o campo de turma não aparece (ela é preenchida sozinha).
  // Para várias, use por exemplo: ['7º A', '7º B', '7º C']
  turmas: ['7º ano Vespertino'],

  vidas: 5,
  // Perguntas por partida, divididas entre os temas (com 6 temas: 2 ou 3 de cada).
  // Atenção: o banco do ranking aceita no máximo 15 acertos (veja supabase/configurar.sql).
  perguntasPorPartida: 15,

  // Tempo (segundos) para responder, por tipo de pergunta
  tempo: { vf: 10, escolha: 10, montar: 45 },

  // Modo treino: sem obstáculos, sem tempo e sem pontos
  treino: { intervaloPrimeira: 2.5, intervalo: 3 },
  perguntasTreinoMisturado: 15, // quando o aluno escolhe "Todos os temas"

  // Música de aventura nas telas de menu (começa no primeiro toque na tela)
  musica: true,

  // Moeda dourada 2x: aparece uma única vez por partida, logo depois de uma pergunta
  // sorteada entre as indicadas. Quem pega dobra a pontuação que tem naquele momento.
  // Não aparece no modo treino.
  moeda: { ativa: true, depoisDaPergunta: [3, 10] },

  // Chuva: começa na pergunta 5 e vira tempestade (com relâmpagos) na 10.
  // Não chove no modo treino. Para desligar, use ativa: false.
  chuva: { ativa: true, aPartirDaPergunta: 5, tempestadeNaPergunta: 10 },

  // Segundos de voo entre uma pergunta e outra
  intervaloPrimeiraPergunta: 4,
  intervaloPerguntas: 7,

  pontos: {
    acerto: 100,
    bonusTempoMax: 100, // bônus por responder rápido
    estrela: 10,
    metrosPorPonto: 20, // bônus de distância no final
  },

  // Combo: acertos seguidos → multiplicador
  combo: [
    { aPartirDe: 5, multiplicador: 3 },
    { aPartirDe: 3, multiplicador: 2 },
  ],
};
