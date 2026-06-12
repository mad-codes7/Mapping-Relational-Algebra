const { ipcMain } = require('electron');
const { runCppTranslator, cppExeExists } = require('./services/cpp.service');
const { runSqlQuery, getSchema }         = require('./services/db.service');
const { formatError }                    = require('./services/errors');

ipcMain.handle('translate', async (_event, raExpression) => {
  if (!raExpression || !raExpression.trim())
    return { sql: '', results: { type: 'warning', message: 'Please enter a Relational Algebra expression.' } };

  if (!cppExeExists())
    return {
      sql: 'Error: Translator not built.',
      results: { type: 'error', message: 'C++ translator not found.\n\nBuild it:\n  cd cpp-translator/build\n  cmake --build .' },
    };

  try {
    const sql = await runCppTranslator(raExpression);

    if (sql.startsWith('Parsing Error:') || sql.startsWith('Error:'))
      return { sql, results: { type: 'warning', message: 'Fix the expression and try again.' } };

    const results = await runSqlQuery(sql);
    return { sql, results };
  } catch (err) {
    return { sql: 'Error', results: formatError(err) };
  }
});

ipcMain.handle('get-schema', async () => {
  return await getSchema();
});
