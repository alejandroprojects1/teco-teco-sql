// Configurações do jogo. Ajuste à vontade.
export const CONFIG = {
  // Turmas que aparecem para o aluno escolher
  turmas: ['7º A', '7º B', '7º C', '7º D'],

  vidas: 5,
  perguntasPorTema: 3, // 5 temas × 3 = 15 perguntas por partida

  // Tempo (segundos) para responder, por tipo de pergunta
  tempo: { vf: 20, escolha: 25, montar: 45 },

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
