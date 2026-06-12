function formatError(err) {
  const m = err.message || '';
  let msg;

  if (m.includes('Access denied'))
    msg = 'Access Denied.\n\nFix: Update DB_USER and DB_PASSWORD in electron-gui/.env';
  else if (m.includes('Unknown database'))
    msg = 'Database not found.\n\nFix: Update DB_NAME in electron-gui/.env';
  else if (m.includes('ECONNREFUSED') || m.includes('connect ENOENT'))
    msg = 'MySQL server is not running.\n\nStart MySQL and try again.';
  else if (m.includes('EXCEPT'))
    msg = 'Set Difference (−) requires MySQL 8.0.31+.\n\nPlease upgrade MySQL.';
  else if (m.includes('INTERSECT'))
    msg = 'Intersection (∩) requires MySQL 8.0.31+.\n\nPlease upgrade MySQL.';
  else if (m.includes("doesn't exist") || m.includes('Table'))
    msg = `Table not found.\n\n${m}`;
  else
    msg = `Error: ${m}`;

  return { type: 'error', message: msg };
}

module.exports = { formatError };
