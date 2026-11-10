// Configurações do jogo. Ajuste à vontade.
export const CONFIG = {
  // Ranking online (Supabase). Veja o passo a passo no README.
  // Em Supabase → Project Settings → API (ou Data API / API Keys), copie:
  //   url:   o "Project URL" (ex.: https://abcdefgh.supabase.co)
  //   chave: a chave pública "anon" / "publishable" (NUNCA a "service_role" / "secret")
  // Enquanto estiver vazio, o jogo funciona normalmente, só sem ranking.
  ranking: {
    url: '',
    chave: '',
  },

  // Turmas que aparecem para o aluno escolher.
  // Com uma turma só, o campo de turma não aparece (ela é preenchida sozinha).
  // Para várias, use por exemplo: ['7º A', '7º B', '7º C']
  turmas: ['7º ano Vespertino'],

  vidas: 5,
  perguntasPorTema: 3, // 5 temas × 3 = 15 perguntas por partida

  // Tempo (segundos) para responder, por tipo de pergunta
  tempo: { vf: 20, escolha: 25, montar: 45 },

  // Modo treino: sem obstáculos, sem tempo e sem pontos
  treino: { intervaloPrimeira: 2.5, intervalo: 3 },
  perguntasTreinoMisturado: 15, // quando o aluno escolhe "Todos os temas"

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
