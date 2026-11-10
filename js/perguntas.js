// Banco de perguntas do Teco-Teco SQL
//
// Cada pergunta tem:
//   tema:       'create' | 'insert' | 'select' | 'where' | 'update'
//   tipo:       'vf' (verdadeiro ou falso) | 'escolha' (múltipla escolha) | 'montar' (montar o comando)
//   pergunta:   texto da pergunta. Trechos entre `crases` aparecem como código.
//   explicacao: mostrada depois que o aluno responde.
//
// Por tipo:
//   vf:      resposta: true ou false
//   escolha: alternativas: [...], correta: índice da alternativa certa (começa em 0)
//            codigo: true se as alternativas forem comandos SQL
//   montar:  pecas: peças na ordem certa
//            extras: peças "pegadinha" que não fazem parte da resposta
//
// Em cada partida o jogo sorteia, para cada tema, 1 pergunta de cada tipo.

export const TEMAS = [
  { id: 'create', nome: 'CREATE TABLE', descricao: 'Criar tabelas' },
  { id: 'insert', nome: 'INSERT INTO', descricao: 'Adicionar dados' },
  { id: 'select', nome: 'SELECT', descricao: 'Consultar dados' },
  { id: 'where', nome: 'WHERE', descricao: 'Filtrar resultados' },
  { id: 'update', nome: 'UPDATE', descricao: 'Alterar dados' },
];

export const PERGUNTAS = [
  // ───────────────────────── CREATE TABLE ─────────────────────────
  {
    tema: 'create', tipo: 'vf',
    pergunta: 'O comando `CREATE TABLE` serve para criar uma nova tabela no banco de dados.',
    resposta: true,
    explicacao: '`CREATE TABLE` cria uma tabela nova, dizendo o nome dela e quais colunas ela terá.',
  },
  {
    tema: 'create', tipo: 'vf',
    pergunta: 'O tipo `INTEGER` é usado para guardar textos, como o nome de uma pessoa.',
    resposta: false,
    explicacao: '`INTEGER` guarda números inteiros (como 12 ou 2025). Para textos usamos `TEXT`.',
  },
  {
    tema: 'create', tipo: 'vf',
    pergunta: 'No `CREATE TABLE`, as colunas ficam dentro de parênteses e são separadas por vírgulas.',
    resposta: true,
    explicacao: 'Exemplo: `CREATE TABLE alunos (nome TEXT, idade INTEGER);` — colunas entre parênteses, separadas por vírgula.',
  },
  {
    tema: 'create', tipo: 'vf',
    pergunta: 'Logo depois de criada com `CREATE TABLE`, a tabela já vem cheia de dados.',
    resposta: false,
    explicacao: 'A tabela nasce vazia: só com as colunas. Os dados são adicionados depois, com `INSERT INTO`.',
  },
  {
    tema: 'create', tipo: 'escolha',
    pergunta: 'Qual tipo de dado é o mais indicado para a coluna `idade`?',
    alternativas: ['INTEGER', 'TEXT', 'TABLE', 'SELECT'],
    correta: 0, codigo: true,
    explicacao: 'Idade é um número inteiro, então o tipo certo é `INTEGER`.',
  },
  {
    tema: 'create', tipo: 'escolha',
    pergunta: 'Qual comando cria a tabela `pets` com as colunas `nome` e `idade`?',
    alternativas: [
      'CREATE TABLE pets (nome TEXT, idade INTEGER);',
      'CREATE pets (nome TEXT, idade INTEGER);',
      'INSERT INTO pets (nome TEXT, idade INTEGER);',
      'CREATE TABLE (nome TEXT, idade INTEGER) pets;',
    ],
    correta: 0, codigo: true,
    explicacao: 'A ordem é: `CREATE TABLE`, o nome da tabela e, entre parênteses, as colunas com seus tipos.',
  },
  {
    tema: 'create', tipo: 'escolha',
    pergunta: 'Qual tipo de dado usar na coluna `cidade`, que guarda nomes como \'Recife\'?',
    alternativas: ['TEXT', 'INTEGER', 'WHERE'],
    correta: 0, codigo: true,
    explicacao: 'Nomes de cidades são textos, então usamos `TEXT`.',
  },
  {
    tema: 'create', tipo: 'escolha',
    pergunta: 'No comando `CREATE TABLE livros (titulo TEXT, paginas INTEGER);` qual é o nome da tabela?',
    alternativas: ['livros', 'titulo', 'paginas', 'TEXT'],
    correta: 0, codigo: true,
    explicacao: 'O nome da tabela vem logo depois de `CREATE TABLE`: `livros`. `titulo` e `paginas` são colunas.',
  },
  {
    tema: 'create', tipo: 'montar',
    pergunta: 'Monte o comando que cria a tabela `alunos` com as colunas `nome` (texto) e `idade` (número inteiro).',
    pecas: ['CREATE TABLE', 'alunos', '(', 'nome TEXT,', 'idade INTEGER', ');'],
    extras: ['INSERT INTO', 'idade TEXT'],
    explicacao: 'Idade é número, por isso `INTEGER`. Nome é texto, por isso `TEXT`.',
  },
  {
    tema: 'create', tipo: 'montar',
    pergunta: 'Monte o comando que cria a tabela `filmes` com as colunas `titulo` (texto) e `ano` (número inteiro).',
    pecas: ['CREATE TABLE', 'filmes', '(', 'titulo TEXT,', 'ano INTEGER', ');'],
    extras: ['SELECT', 'ano TEXT'],
    explicacao: 'O ano é um número inteiro (`INTEGER`) e o título é texto (`TEXT`).',
  },
  {
    tema: 'create', tipo: 'montar',
    pergunta: 'Monte o comando que cria a tabela `jogadores` com as colunas `nome` (texto) e `gols` (número inteiro).',
    pecas: ['CREATE TABLE', 'jogadores', '(', 'nome TEXT,', 'gols INTEGER', ');'],
    extras: ['UPDATE', 'gols TEXT'],
    explicacao: 'Quantidade de gols é um número inteiro, então a coluna é `gols INTEGER`.',
  },

  // ───────────────────────── INSERT INTO ─────────────────────────
  {
    tema: 'insert', tipo: 'vf',
    pergunta: 'O comando `INSERT INTO` serve para adicionar uma nova linha em uma tabela.',
    resposta: true,
    explicacao: 'Cada `INSERT INTO` adiciona um novo registro (uma linha) na tabela.',
  },
  {
    tema: 'insert', tipo: 'vf',
    pergunta: 'No `INSERT INTO`, textos como \'Ana\' devem ficar entre aspas simples.',
    resposta: true,
    explicacao: 'Textos vão entre aspas simples: `\'Ana\'`. Assim o banco sabe onde o texto começa e termina.',
  },
  {
    tema: 'insert', tipo: 'vf',
    pergunta: 'Números, como a idade 12, também precisam ficar entre aspas no `INSERT INTO`.',
    resposta: false,
    explicacao: 'Números são escritos sem aspas: `VALUES (\'Ana\', 12)`.',
  },
  {
    tema: 'insert', tipo: 'vf',
    pergunta: 'O comando `INSERT INTO` pode ser usado para apagar uma tabela.',
    resposta: false,
    explicacao: '`INSERT INTO` só adiciona dados. Ele nunca apaga tabelas.',
  },
  {
    tema: 'insert', tipo: 'escolha',
    pergunta: 'Qual comando cadastra a aluna Ana, de 12 anos, na tabela `alunos`?',
    alternativas: [
      "INSERT INTO alunos VALUES ('Ana', 12);",
      'INSERT alunos VALUES (Ana, 12);',
      "SELECT INTO alunos VALUES ('Ana', 12);",
      "INSERT INTO alunos ('Ana', 12);",
    ],
    correta: 0, codigo: true,
    explicacao: 'O formato é `INSERT INTO tabela VALUES (...)`, com o texto entre aspas e o número sem aspas.',
  },
  {
    tema: 'insert', tipo: 'escolha',
    pergunta: 'No `INSERT INTO`, qual palavra vem antes dos dados entre parênteses?',
    alternativas: ['VALUES', 'WHERE', 'TABLE', 'SET'],
    correta: 0, codigo: true,
    explicacao: '`VALUES` significa "valores": logo depois vêm os dados da nova linha.',
  },
  {
    tema: 'insert', tipo: 'escolha',
    pergunta: 'A coluna `nome` da tabela `pets` é do tipo `TEXT`. Qual valor está escrito do jeito certo?',
    alternativas: ["'Rex'", 'Rex', '(Rex)'],
    correta: 0, codigo: true,
    explicacao: 'Textos precisam de aspas simples: `\'Rex\'`.',
  },
  {
    tema: 'insert', tipo: 'escolha',
    pergunta: 'O que acontece depois de executar `INSERT INTO alunos VALUES (\'Bia\', 13);`?',
    alternativas: [
      'Uma nova linha com Bia e 13 é adicionada',
      'A tabela alunos é apagada',
      'Todos os alunos passam a se chamar Bia',
      'A tabela mostra só a Bia na tela',
    ],
    correta: 0,
    explicacao: 'O `INSERT INTO` adiciona uma linha nova, sem mexer nas linhas que já existiam.',
  },
  {
    tema: 'insert', tipo: 'montar',
    pergunta: 'Monte o comando que cadastra o aluno Pedro, de 13 anos, na tabela `alunos`.',
    pecas: ['INSERT INTO', 'alunos', 'VALUES', "('Pedro', 13);"],
    extras: ['WHERE', '(Pedro, 13);'],
    explicacao: 'O texto `\'Pedro\'` vai entre aspas; o número 13, sem aspas.',
  },
  {
    tema: 'insert', tipo: 'montar',
    pergunta: 'Monte o comando que cadastra o pet Rex, de 3 anos, na tabela `pets`.',
    pecas: ['INSERT INTO', 'pets', 'VALUES', "('Rex', 3);"],
    extras: ['SET', '(Rex, 3);'],
    explicacao: '`INSERT INTO pets VALUES (\'Rex\', 3);` — texto com aspas, número sem aspas.',
  },
  {
    tema: 'insert', tipo: 'montar',
    pergunta: 'Monte o comando que cadastra o livro \'O Pequeno Príncipe\', de 96 páginas, na tabela `livros`.',
    pecas: ['INSERT INTO', 'livros', 'VALUES', "('O Pequeno Príncipe', 96);"],
    extras: ['CREATE TABLE', 'FROM'],
    explicacao: 'Para adicionar uma linha: `INSERT INTO`, o nome da tabela, `VALUES` e os dados.',
  },

  // ───────────────────────── SELECT ─────────────────────────
  {
    tema: 'select', tipo: 'vf',
    pergunta: '`SELECT * FROM alunos;` mostra todas as colunas da tabela `alunos`.',
    resposta: true,
    explicacao: 'O `*` significa "todas as colunas".',
  },
  {
    tema: 'select', tipo: 'vf',
    pergunta: 'O comando `SELECT` altera os dados que estão na tabela.',
    resposta: false,
    explicacao: '`SELECT` só consulta (mostra) os dados. Quem altera é o `UPDATE`.',
  },
  {
    tema: 'select', tipo: 'vf',
    pergunta: 'No `SELECT`, o nome da tabela vem depois da palavra `FROM`.',
    resposta: true,
    explicacao: '`FROM` quer dizer "de": `SELECT nome FROM alunos` = mostre o nome DE alunos.',
  },
  {
    tema: 'select', tipo: 'vf',
    pergunta: '`SELECT nome FROM alunos;` mostra todas as colunas da tabela.',
    resposta: false,
    explicacao: 'Esse comando mostra apenas a coluna `nome`. Para todas as colunas usamos `*`.',
  },
  {
    tema: 'select', tipo: 'escolha',
    pergunta: 'Qual comando mostra só o nome dos alunos?',
    alternativas: [
      'SELECT nome FROM alunos;',
      'SELECT * FROM nome;',
      'SELECT alunos FROM nome;',
      'INSERT INTO alunos nome;',
    ],
    correta: 0, codigo: true,
    explicacao: 'Depois do `SELECT` vem a coluna (`nome`) e depois do `FROM` vem a tabela (`alunos`).',
  },
  {
    tema: 'select', tipo: 'escolha',
    pergunta: 'O que significa o `*` em `SELECT * FROM pets;`?',
    alternativas: ['Todas as colunas', 'Apenas a primeira coluna', 'Multiplicar os valores', 'Apagar tudo'],
    correta: 0,
    explicacao: 'No `SELECT`, o `*` é um atalho para "todas as colunas".',
  },
  {
    tema: 'select', tipo: 'escolha',
    pergunta: 'Qual comando mostra o nome e a idade de todos os pets?',
    alternativas: [
      'SELECT nome, idade FROM pets;',
      'SELECT nome idade FROM pets;',
      'SELECT pets FROM nome, idade;',
      'SELECT nome, idade WHERE pets;',
    ],
    correta: 0, codigo: true,
    explicacao: 'Para mostrar várias colunas, separe-as com vírgula: `nome, idade`.',
  },
  {
    tema: 'select', tipo: 'escolha',
    pergunta: 'Para que serve a palavra `FROM` no `SELECT`?',
    alternativas: [
      'Indicar de qual tabela vêm os dados',
      'Filtrar as linhas',
      'Criar uma tabela',
      'Mudar um valor',
    ],
    correta: 0,
    explicacao: '`FROM` indica a tabela de onde os dados serão buscados.',
  },
  {
    tema: 'select', tipo: 'montar',
    pergunta: 'Monte o comando que mostra todas as colunas da tabela `alunos`.',
    pecas: ['SELECT', '*', 'FROM', 'alunos;'],
    extras: ['WHERE', 'INTO'],
    explicacao: '`SELECT * FROM alunos;` — o `*` traz todas as colunas.',
  },
  {
    tema: 'select', tipo: 'montar',
    pergunta: 'Monte o comando que mostra só o título dos livros.',
    pecas: ['SELECT', 'titulo', 'FROM', 'livros;'],
    extras: ['*', 'VALUES'],
    explicacao: 'Como queremos só o título, escrevemos a coluna `titulo` em vez do `*`.',
  },
  {
    tema: 'select', tipo: 'montar',
    pergunta: 'Monte o comando que mostra o nome e a idade dos alunos.',
    pecas: ['SELECT', 'nome,', 'idade', 'FROM', 'alunos;'],
    extras: ['SET', 'TABLE'],
    explicacao: 'As colunas vêm separadas por vírgula: `SELECT nome, idade FROM alunos;`',
  },

  // ───────────────────────── WHERE ─────────────────────────
  {
    tema: 'where', tipo: 'vf',
    pergunta: 'A cláusula `WHERE` serve para filtrar quais linhas aparecem no resultado.',
    resposta: true,
    explicacao: 'O `WHERE` é um filtro: só aparecem as linhas que obedecem à condição.',
  },
  {
    tema: 'where', tipo: 'vf',
    pergunta: 'No `SELECT`, o `WHERE` vem antes do `FROM`.',
    resposta: false,
    explicacao: 'A ordem é `SELECT ... FROM ... WHERE ...`. O `WHERE` vem depois do nome da tabela.',
  },
  {
    tema: 'where', tipo: 'vf',
    pergunta: '`SELECT * FROM alunos WHERE idade = 12;` mostra apenas os alunos com 12 anos.',
    resposta: true,
    explicacao: 'A condição `idade = 12` deixa passar só as linhas em que a idade é 12.',
  },
  {
    tema: 'where', tipo: 'vf',
    pergunta: 'Para buscar o texto Ana, está certo escrever `WHERE nome = Ana` (sem aspas).',
    resposta: false,
    explicacao: 'Textos precisam de aspas simples: `WHERE nome = \'Ana\'`.',
  },
  {
    tema: 'where', tipo: 'escolha',
    pergunta: 'Qual comando mostra só os alunos com mais de 12 anos?',
    alternativas: [
      'SELECT * FROM alunos WHERE idade > 12;',
      'SELECT * FROM alunos WHERE idade < 12;',
      'SELECT * WHERE idade > 12 FROM alunos;',
      'SELECT idade > 12 FROM alunos;',
    ],
    correta: 0, codigo: true,
    explicacao: '`>` significa "maior que". E o `WHERE` vem depois do `FROM alunos`.',
  },
  {
    tema: 'where', tipo: 'escolha',
    pergunta: 'Qual comando mostra só os alunos da turma \'7B\'?',
    alternativas: [
      "SELECT * FROM alunos WHERE turma = '7B';",
      'SELECT * FROM alunos WHERE turma = 7B;',
      "SELECT * FROM turma WHERE alunos = '7B';",
      "SELECT '7B' FROM alunos;",
    ],
    correta: 0, codigo: true,
    explicacao: 'A turma é um texto, então vai entre aspas: `WHERE turma = \'7B\'`.',
  },
  {
    tema: 'where', tipo: 'escolha',
    pergunta: 'Qual símbolo significa "menor que" no `WHERE`?',
    alternativas: ['<', '>', '=', '*'],
    correta: 0, codigo: true,
    explicacao: '`<` é "menor que", `>` é "maior que" e `=` é "igual a".',
  },
  {
    tema: 'where', tipo: 'escolha',
    pergunta: 'A tabela `pets` tem: Rex (3 anos), Mia (5 anos) e Bob (8 anos). Quantas linhas aparecem em `SELECT * FROM pets WHERE idade > 4;`?',
    alternativas: ['2', '1', '3', '0'],
    correta: 0,
    explicacao: 'Só Mia (5) e Bob (8) têm mais de 4 anos. Rex (3) fica de fora.',
  },
  {
    tema: 'where', tipo: 'montar',
    pergunta: 'Monte o comando que mostra os alunos com 12 anos.',
    pecas: ['SELECT', '*', 'FROM', 'alunos', 'WHERE', 'idade = 12;'],
    extras: ['SET', 'idade > 12;'],
    explicacao: 'Queremos exatamente 12 anos, por isso usamos `=` e não `>`.',
  },
  {
    tema: 'where', tipo: 'montar',
    pergunta: 'Monte o comando que mostra os livros com mais de 100 páginas.',
    pecas: ['SELECT', '*', 'FROM', 'livros', 'WHERE', 'paginas > 100;'],
    extras: ['VALUES', 'paginas < 100;'],
    explicacao: '"Mais de 100" é `> 100`. O `WHERE` vem depois do nome da tabela.',
  },
  {
    tema: 'where', tipo: 'montar',
    pergunta: 'Monte o comando que mostra o nome dos alunos da turma \'7A\'.',
    pecas: ['SELECT', 'nome', 'FROM', 'alunos', 'WHERE', "turma = '7A';"],
    extras: ['INTO', 'turma = 7A;'],
    explicacao: 'A turma é texto, então precisa de aspas: `turma = \'7A\'`.',
  },

  // ───────────────────────── UPDATE ─────────────────────────
  {
    tema: 'update', tipo: 'vf',
    pergunta: 'O comando `UPDATE` serve para alterar dados que já existem na tabela.',
    resposta: true,
    explicacao: '`UPDATE` quer dizer "atualizar": ele muda valores de linhas que já existem.',
  },
  {
    tema: 'update', tipo: 'vf',
    pergunta: 'Um `UPDATE` sem `WHERE` altera todas as linhas da tabela.',
    resposta: true,
    explicacao: 'Cuidado! Sem `WHERE`, o banco altera TODAS as linhas. O `WHERE` escolhe quais mudar.',
  },
  {
    tema: 'update', tipo: 'vf',
    pergunta: 'No `UPDATE`, a palavra `VALUES` indica o novo valor da coluna.',
    resposta: false,
    explicacao: 'No `UPDATE` usamos `SET`: `UPDATE alunos SET idade = 13`. `VALUES` é do `INSERT INTO`.',
  },
  {
    tema: 'update', tipo: 'vf',
    pergunta: 'O comando `UPDATE` serve para criar uma tabela nova.',
    resposta: false,
    explicacao: 'Quem cria tabela é o `CREATE TABLE`. O `UPDATE` altera dados.',
  },
  {
    tema: 'update', tipo: 'escolha',
    pergunta: 'Qual comando muda a idade da Ana para 13?',
    alternativas: [
      "UPDATE alunos SET idade = 13 WHERE nome = 'Ana';",
      'UPDATE alunos SET idade = 13;',
      "UPDATE alunos WHERE nome = 'Ana' SET idade = 13;",
      'INSERT INTO alunos SET idade = 13;',
    ],
    correta: 0, codigo: true,
    explicacao: 'A ordem é `UPDATE tabela SET coluna = valor WHERE condição`. Sem o `WHERE`, todos mudariam.',
  },
  {
    tema: 'update', tipo: 'escolha',
    pergunta: 'Em um `UPDATE`, qual palavra vem logo depois do nome da tabela?',
    alternativas: ['SET', 'FROM', 'VALUES', 'INTO'],
    correta: 0, codigo: true,
    explicacao: '`UPDATE alunos SET ...` — o `SET` diz qual coluna vai mudar e para qual valor.',
  },
  {
    tema: 'update', tipo: 'escolha',
    pergunta: 'O que acontece com `UPDATE pets SET idade = 4;` (sem `WHERE`)?',
    alternativas: [
      'Todos os pets ficam com idade 4',
      'Só o primeiro pet muda',
      'Nada acontece',
      'A tabela é apagada',
    ],
    correta: 0,
    explicacao: 'Sem `WHERE`, o `UPDATE` vale para todas as linhas da tabela.',
  },
  {
    tema: 'update', tipo: 'escolha',
    pergunta: 'Qual é a função do `WHERE` em um `UPDATE`?',
    alternativas: [
      'Escolher quais linhas serão alteradas',
      'Escolher o nome da tabela',
      'Criar uma coluna nova',
      'Mostrar o resultado na tela',
    ],
    correta: 0,
    explicacao: 'O `WHERE` escolhe as linhas. Só elas recebem o novo valor.',
  },
  {
    tema: 'update', tipo: 'montar',
    pergunta: 'Monte o comando que muda a idade do Pedro para 14.',
    pecas: ['UPDATE', 'alunos', 'SET', 'idade = 14', 'WHERE', "nome = 'Pedro';"],
    extras: ['FROM', 'VALUES'],
    explicacao: '`SET` define o novo valor e `WHERE` garante que só o Pedro muda.',
  },
  {
    tema: 'update', tipo: 'montar',
    pergunta: 'Monte o comando que muda a turma da Bia para \'7C\'.',
    pecas: ['UPDATE', 'alunos', 'SET', "turma = '7C'", 'WHERE', "nome = 'Bia';"],
    extras: ['INTO', 'SELECT'],
    explicacao: '`UPDATE alunos SET turma = \'7C\' WHERE nome = \'Bia\';`',
  },
  {
    tema: 'update', tipo: 'montar',
    pergunta: 'Monte o comando que muda o número de páginas do livro \'Dom Casmurro\' para 256.',
    pecas: ['UPDATE', 'livros', 'SET', 'paginas = 256', 'WHERE', "titulo = 'Dom Casmurro';"],
    extras: ['FROM', 'paginas > 256'],
    explicacao: 'No `SET` usamos `=` para dar o novo valor. O `WHERE` escolhe o livro.',
  },
];
