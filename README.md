# ✈️ Teco-Teco SQL

Jogo educativo de SQL para alunos do **7º ano**. O aluno pilota um teco-teco (um aviãozinho de madeira), desvia de obstáculos e, de tempos em tempos, o voo **para** para uma pergunta de SQL.

Feito para funcionar **principalmente no celular**, direto no navegador, sem instalar nada.

## Como jogar

- **Arraste o dedo** em qualquer lugar da tela para pilotar (no computador, use as setas ou W A S D).
- Desvie das **nuvens de tempestade**, dos **balões** e das **torres de blocos**.
- Quando aparece uma pergunta, o jogo **congela** até você responder. Depois vem uma contagem 3, 2, 1 e o voo continua.
- Você tem **5 vidas**: bater em um obstáculo ou errar uma pergunta tira 1 vida.
- Responda **rápido** para ganhar bônus de tempo, e acerte **em sequência** para ativar o combo (3 seguidas = x2, 5 seguidas = x3).
- Pegue as **estrelas** no caminho para ganhar pontos extras.
- Depois de cada resposta, o jogo **executa o comando SQL de verdade** e mostra a tabela: a linha nova do `INSERT`, as linhas filtradas pelo `WHERE`, o valor alterado pelo `UPDATE`.

## Modo treino

Na tela inicial, toque em **Modo treino** e escolha um tema (ou "Todos os temas"):

- **sem obstáculos**, **sem cronômetro** e **sem pontos**: o aluno responde com calma;
- todas as perguntas do tema, com explicação e tabela depois de cada uma;
- no final, um resumo com os acertos e a sugestão de jogar valendo pontos.

## Conteúdo

Cada partida tem **15 perguntas**: 3 de cada tema, na ordem abaixo, sorteadas de um banco com 55 perguntas.

| Tema | O que o aluno pratica |
|---|---|
| `CREATE TABLE` | Criar tabelas com colunas `TEXT` e `INTEGER` |
| `INSERT INTO` | Adicionar linhas com `VALUES` |
| `SELECT` | Consultar colunas com `FROM` e `*` |
| `WHERE` | Filtrar linhas com `=`, `>` e `<` |
| `UPDATE` | Alterar dados com `SET` e `WHERE` |

Tipos de pergunta: **verdadeiro ou falso**, **múltipla escolha** e **montar o comando** (tocando nas peças na ordem certa).

## Publicar no GitHub Pages

1. No repositório, abra **Settings → Pages**.
2. Em **Source**, escolha **Deploy from a branch**.
3. Selecione a branch **main** e a pasta **/ (root)** e clique em **Save**.
4. Em 1 ou 2 minutos o jogo estará em `https://SEU-USUARIO.github.io/teco-teco-sql/`.

Dica: no celular, abra o link e use **"Adicionar à tela inicial"**. O jogo abre como um aplicativo, em tela cheia.

## Testar no computador

O jogo usa módulos JavaScript, então precisa de um servidor local simples (abrir o `index.html` direto não funciona):

```bash
python3 -m http.server 8000
```

Depois acesse `http://localhost:8000`.

## Personalizar

| Arquivo | O que dá para mudar |
|---|---|
| `js/perguntas.js` | Adicionar, editar ou remover perguntas (há instruções no topo do arquivo) |
| `js/config.js` | Turma, número de vidas, tempo de cada pergunta, pontuação, combo e modo treino |
| `js/tabela.js` | Os dados das tabelas de exemplo (`alunos`, `pets`, `livros`) usadas para mostrar os resultados |

## Estrutura

```
index.html          Página do jogo
css/estilo.css      Visual
js/main.js          Telas, regras da partida, pontuação e controles
js/mundo.js         Cenário 3D, obstáculos, câmera e colisões
js/aviao.js         O teco-teco em 3D (modelo feito em código)
js/quiz.js          Painel de perguntas
js/tabela.js        Executa o SQL (SQLite no navegador) e desenha a tabela
js/perguntas.js     Banco de perguntas
js/audio.js         Efeitos sonoros (gerados no navegador)
js/config.js        Configurações
vendor/             Three.js (3D) e sql.js (SQLite no navegador), ambos MIT
assets/             Ícones
```

## Próximas etapas

- [x] **Etapa 1**: jogo completo no celular (avião, obstáculos, vidas, perguntas, tempo, combo e resultado)
- [x] **Etapa 2**: modo treino (escolher o tema) e tabela mostrando o resultado de cada comando
- [ ] **Etapa 3**: ranking online por turma e área do professor (editar nomes e zerar o ranking)

## Créditos

- Gráficos 3D feitos com [Three.js](https://threejs.org) (MIT).
- Banco de dados no navegador com [sql.js](https://sql.js.org) (MIT).
- Fontes [Fredoka](https://fonts.google.com/specimen/Fredoka) e [JetBrains Mono](https://fonts.google.com/specimen/JetBrains+Mono) (Google Fonts, OFL).
