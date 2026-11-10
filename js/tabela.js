// Executa comandos SQL de verdade (SQLite no navegador, via sql.js)
// e desenha a tabela resultante, destacando o que mudou.

// Dados de exemplo usados nas demonstrações.
// Se mudar aqui, confira se as perguntas em js/perguntas.js continuam fazendo sentido.
const DADOS_EXEMPLO = `
  CREATE TABLE alunos (nome TEXT, idade INTEGER, turma TEXT);
  INSERT INTO alunos VALUES ('Ana', 12, '7A'), ('Pedro', 13, '7B'), ('Bia', 12, '7B'), ('Caio', 11, '7A'), ('Duda', 13, '7C');
  CREATE TABLE pets (nome TEXT, idade INTEGER);
  INSERT INTO pets VALUES ('Rex', 3), ('Mia', 5), ('Bob', 8);
  CREATE TABLE livros (titulo TEXT, paginas INTEGER);
  INSERT INTO livros VALUES ('Dom Casmurro', 208), ('O Alienista', 80), ('Iracema', 152);
`;

let carregando = null;

function carregarScript(src) {
  return new Promise((ok, falha) => {
    const s = document.createElement('script');
    s.src = src;
    s.onload = ok;
    s.onerror = () => falha(new Error('Não foi possível carregar ' + src));
    document.head.appendChild(s);
  });
}

/** Carrega o SQLite (uma vez só). Pode ser chamado antes, para já deixar pronto. */
export function prepararSQL() {
  if (!carregando) {
    carregando = carregarScript('vendor/sql-wasm.js')
      .then(() => window.initSqlJs({ locateFile: (f) => `vendor/${f}` }))
      .catch((e) => { carregando = null; throw e; });
  }
  return carregando;
}

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

function linhasDe(resultado) {
  if (!resultado.length) return { colunas: [], linhas: [] };
  return { colunas: resultado[0].columns, linhas: resultado[0].values };
}

/**
 * Executa o comando e devolve um resumo do que aconteceu:
 * { tipo, tabela, colunas, linhas, novas: Set(índices), alteradas: Set('linha:coluna'), tipos, legenda }
 */
export async function demonstrar(sql) {
  const SQL = await prepararSQL();
  const comando = sql.trim();
  const tipo = comando.split(/\s+/)[0].toUpperCase();
  const db = new SQL.Database();
  try {
    if (tipo === 'CREATE') {
      db.run(comando);
      const tabela = comando.match(/CREATE\s+TABLE\s+(\w+)/i)[1];
      const info = linhasDe(db.exec(`PRAGMA table_info(${tabela})`));
      const colunas = info.linhas.map((l) => l[1]);
      const tipos = info.linhas.map((l) => l[2]);
      return {
        tipo, tabela, colunas, tipos, linhas: [],
        legenda: `Tabela <b>${esc(tabela)}</b> criada com ${colunas.length} colunas. Ela começa vazia, sem nenhuma linha.`,
      };
    }

    db.run(DADOS_EXEMPLO);

    if (tipo === 'INSERT') {
      const tabela = comando.match(/INSERT\s+INTO\s+(\w+)/i)[1];
      const antes = db.exec(`SELECT COUNT(*) FROM ${tabela}`)[0].values[0][0];
      db.run(comando);
      const { colunas, linhas } = linhasDe(db.exec(`SELECT * FROM ${tabela}`));
      const novas = new Set(linhas.map((_, i) => i).filter((i) => i >= antes));
      return {
        tipo, tabela, colunas, linhas, novas,
        legenda: `A tabela <b>${esc(tabela)}</b> ganhou <b>1 linha nova</b> (destacada).`,
      };
    }

    if (tipo === 'UPDATE') {
      const tabela = comando.match(/UPDATE\s+(\w+)/i)[1];
      const antes = linhasDe(db.exec(`SELECT * FROM ${tabela}`));
      db.run(comando);
      const mudaram = db.getRowsModified();
      const depois = linhasDe(db.exec(`SELECT * FROM ${tabela}`));
      const alteradas = new Set();
      const linhasMudadas = new Set();
      depois.linhas.forEach((l, i) => l.forEach((v, j) => {
        if (v !== antes.linhas[i][j]) { alteradas.add(`${i}:${j}`); linhasMudadas.add(i); }
      }));
      const n = mudaram;
      return {
        tipo, tabela, colunas: depois.colunas, linhas: depois.linhas, alteradas, linhasMudadas,
        legenda: n === depois.linhas.length && n > 1
          ? `Sem <code>WHERE</code>: <b>todas as ${n} linhas</b> foram alteradas!`
          : `<b>${n} ${n === 1 ? 'linha foi alterada' : 'linhas foram alteradas'}</b> (valor novo destacado).`,
      };
    }

    // SELECT
    const tabela = (comando.match(/FROM\s+(\w+)/i) || [])[1];
    const total = tabela ? db.exec(`SELECT COUNT(*) FROM ${tabela}`)[0].values[0][0] : 0;
    const { colunas, linhas } = linhasDe(db.exec(comando));
    const temWhere = /\bWHERE\b/i.test(comando);
    const cols = colunas.length || '';
    return {
      tipo, tabela, colunas, linhas,
      legenda: temWhere
        ? `O filtro deixou passar <b>${linhas.length} de ${total} linhas</b> da tabela <b>${esc(tabela)}</b>.`
        : `Resultado: <b>${linhas.length} linhas</b> com ${cols === 1 ? '1 coluna' : `${cols} colunas`}.`,
    };
  } finally {
    db.close();
  }
}

/** Monta o HTML da demonstração. */
export function desenharDemonstracao(sql, r) {
  const cabecalho = r.colunas.map((c, j) => `<th>${esc(c)}${r.tipos ? `<small>${esc(r.tipos[j])}</small>` : ''}</th>`).join('');
  let corpo;
  if (!r.linhas.length) {
    corpo = `<tr class="vazia"><td colspan="${r.colunas.length || 1}">${r.tipo === 'CREATE' ? 'sem linhas ainda' : 'nenhuma linha'}</td></tr>`;
  } else {
    corpo = r.linhas.map((l, i) => {
      const nova = r.novas?.has(i);
      const mudou = r.linhasMudadas?.has(i);
      const celulas = l.map((v, j) => {
        const alterada = r.alteradas?.has(`${i}:${j}`);
        const texto = v === null ? '—' : esc(v);
        return `<td class="${typeof v === 'number' ? 'num' : ''}${alterada ? ' alterada' : ''}">${texto}</td>`;
      }).join('');
      return `<tr class="${nova ? 'nova' : ''}${mudou ? ' mudou' : ''}" style="--i:${i}">${celulas}</tr>`;
    }).join('');
  }
  const icone = { CREATE: '🧱', INSERT: '➕', SELECT: '🔍', UPDATE: '✏️' }[r.tipo] || '▶️';
  return `
    <div class="demo">
      <div class="demo-cabecalho"><span class="demo-icone">${icone}</span><span>Veja o comando funcionando</span></div>
      <code class="demo-sql">${esc(sql)}</code>
      <div class="demo-tabela-moldura">
        ${r.tabela ? `<div class="demo-nome-tabela">${esc(r.tabela)}</div>` : ''}
        <div class="demo-rolagem"><table class="demo-tabela"><thead><tr>${cabecalho}</tr></thead><tbody>${corpo}</tbody></table></div>
      </div>
      <p class="demo-legenda">${r.legenda}</p>
    </div>`;
}

/** Descobre qual comando demonstrar para uma pergunta (ou null). */
export function comandoDaPergunta(q) {
  if (q.exemplo) return q.exemplo;
  if (q.tipo === 'montar') return q.pecas.join(' ').replace(/\( /g, '(').replace(/ \)/g, ')');
  if (q.tipo === 'escolha' && q.codigo) {
    const certa = q.alternativas[q.correta];
    if (/^(CREATE|INSERT|SELECT|UPDATE)\b/i.test(certa)) return certa;
  }
  return null;
}
