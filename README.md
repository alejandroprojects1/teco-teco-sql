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
- A partir da **pergunta 5 começa a chover**, e a chuva aumenta a cada pergunta. Na **pergunta 10 vira tempestade**, com relâmpagos e trovões. (No modo treino não chove. Para ajustar ou desligar, veja `chuva` em `js/config.js`.)
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

## Ranking e área do professor

- No fim de cada partida, a pontuação vai para o **ranking online**. O ranking mostra a **melhor** pontuação de cada aluno, com pódio e posição.
- Sem internet, a pontuação fica guardada no celular e é enviada depois.
- Nomes impróprios são bloqueados (`js/filtro.js`), e o professor pode corrigir qualquer nome.
- **Área do professor** (`professor.html`, com link no fim da tela do ranking): entrar com e-mail e senha, **renomear** ou **apagar** aluno, **zerar o ranking** e **baixar a planilha** (CSV para Excel ou Google Planilhas).

### Configurar o ranking (Supabase, gratuito)

1. Crie uma conta em [supabase.com](https://supabase.com) e clique em **New project**. Escolha um nome (ex.: `teco-teco-sql`), uma senha para o banco (guarde-a) e a região **South America (São Paulo)**.
2. No menu lateral, abra **SQL Editor**, cole todo o conteúdo de [`supabase/configurar.sql`](supabase/configurar.sql), **troque `SEU-EMAIL@exemplo.com` pelo e-mail do professor** (última linha) e clique em **Run**.
3. Abra **Authentication → Users → Add user → Create new user**: use o **mesmo e-mail** do passo 2, crie uma senha e marque **Auto Confirm User**.
4. Em **Authentication → Sign In / Providers**, desligue **Allow new users to sign up** (assim ninguém cria outra conta).
5. Em **Project Settings → API** (ou **Data API** e **API Keys**), copie o **Project URL** e a chave pública **anon** / **publishable**.
6. Cole os dois em `js/config.js`, no bloco `ranking`:
   ```js
   ranking: {
     url: 'https://abcdefgh.supabase.co',
     chave: 'eyJhbGciOi...',
   },
   ```
   ⚠️ Use só a chave pública (**anon** / **publishable**). **Nunca** coloque a chave **service_role** / **secret** no site.

A chave pública pode ficar no código: ela só permite o que o `configurar.sql` libera (ver o ranking e enviar pontuações). Editar, apagar e zerar exigem o login do professor.

O Supabase gratuito **pausa o projeto depois de 7 dias sem uso**. O robô em `.github/workflows/manter-ranking-ativo.yml` consulta o ranking duas vezes por semana para evitar isso. Se mesmo assim pausar, entre no painel do Supabase e clique em **Restore project**: os dados não se perdem.

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
| `js/filtro.js` | Lista de palavras bloqueadas nos nomes |
| `js/tabela.js` | Os dados das tabelas de exemplo (`alunos`, `pets`, `livros`) usadas para mostrar os resultados |

## Estrutura

```
index.html          Página do jogo
css/estilo.css      Visual
js/main.js          Telas, regras da partida, pontuação e controles
js/mundo.js         Cenário 3D, obstáculos, câmera e colisões
js/aviao.js         O teco-teco em 3D (modelo feito em código)
js/vegetacao.js     Árvores (pinheiro, frondosa e ipê), grama, flores e pedras
js/quiz.js          Painel de perguntas
js/tabela.js        Executa o SQL (SQLite no navegador) e desenha a tabela
js/perguntas.js     Banco de perguntas
js/audio.js         Efeitos sonoros (gerados no navegador)
js/ranking.js       Comunicação com o Supabase (ranking e login)
js/professor.js     Área do professor
js/filtro.js        Filtro de nomes impróprios
professor.html      Página da área do professor
supabase/           Script do banco de dados do ranking
js/config.js        Configurações
vendor/             Three.js (3D) e sql.js (SQLite no navegador), ambos MIT
assets/             Ícones
```

## Próximas etapas

- [x] **Etapa 1**: jogo completo no celular (avião, obstáculos, vidas, perguntas, tempo, combo e resultado)
- [x] **Etapa 2**: modo treino (escolher o tema) e tabela mostrando o resultado de cada comando
- [x] **Etapa 3**: ranking online e área do professor (renomear, apagar, zerar e baixar planilha)

## Créditos

- Gráficos 3D feitos com [Three.js](https://threejs.org) (MIT).
- Banco de dados no navegador com [sql.js](https://sql.js.org) (MIT).
- Fontes [Fredoka](https://fonts.google.com/specimen/Fredoka) e [JetBrains Mono](https://fonts.google.com/specimen/JetBrains+Mono) (Google Fonts, OFL).
