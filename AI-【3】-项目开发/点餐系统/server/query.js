const { getDB, saveDB } = require('./db');

// Helper: convert exec result to row object
function row(sql, params = []) {
  const db = getDB();
  const stmt = db.prepare(sql);
  if (params.length) stmt.bind(params);
  if (stmt.step()) {
    const cols = stmt.getColumnNames();
    const vals = stmt.get();
    stmt.free();
    const obj = {};
    cols.forEach((c, i) => { obj[c] = vals[i]; });
    return obj;
  }
  stmt.free();
  return null;
}

function rows(sql, params = []) {
  const db = getDB();
  const stmt = db.prepare(sql);
  if (params.length) stmt.bind(params);
  const result = [];
  const cols = stmt.getColumnNames();
  while (stmt.step()) {
    const vals = stmt.get();
    const obj = {};
    cols.forEach((c, i) => { obj[c] = vals[i]; });
    result.push(obj);
  }
  stmt.free();
  return result;
}

function run(sql, params = []) {
  const db = getDB();
  db.run(sql, params);
  saveDB();
  return { changes: db.getRowsModified(), lastInsertRowid: db.exec("SELECT last_insert_rowid() as id")[0]?.values[0][0] };
}

module.exports = { row, rows, run };
