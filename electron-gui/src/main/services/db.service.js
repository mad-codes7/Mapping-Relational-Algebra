const mysql = require('mysql2/promise');
const { formatError } = require('./errors');

const dbPool = mysql.createPool({
  host:               process.env.DB_HOST     || 'localhost',
  user:               process.env.DB_USER     || 'root',
  password:           process.env.DB_PASSWORD || '',
  database:           process.env.DB_NAME     || '',
  waitForConnections: true,
  connectionLimit:    10,
  queueLimit:         0,
});

async function runSqlQuery(sql) {
  try {
    const [rows, fields] = await dbPool.execute(sql);

    if (!fields)
      return { type: 'success', message: `Query OK, ${rows.affectedRows} row(s) affected.` };

    if (rows.length === 0)
      return { type: 'success', message: 'Query OK — 0 rows returned.' };

    return {
      type:    'table',
      headers: fields.map(f => f.name),
      rows:    rows.map(r => Object.values(r)),
    };
  } catch (err) {
    return formatError(err);
  }
}

async function getSchema() {
  const dbName = process.env.DB_NAME || '(unknown)';
  try {
    const conn = await dbPool.getConnection();

    const [tableRows] = await conn.query('SHOW TABLES');
    // Key name varies: e.g. "Tables_in_mydb"
    const tableKey   = Object.keys(tableRows[0] || {})[0];
    const tableNames = tableRows.map(r => r[tableKey]);

    const tables = await Promise.all(
      tableNames.map(async (tName) => {
        const [cols] = await conn.query(`SHOW COLUMNS FROM \`${tName}\``);
        return {
          name:    tName,
          columns: cols.map(c => ({ name: c.Field, type: c.Type, key: c.Key })),
        };
      })
    );

    conn.release();
    return { dbName, tables };
  } catch (err) {
    return { dbName, tables: [], error: err.message };
  }
}

module.exports = { runSqlQuery, getSchema };
