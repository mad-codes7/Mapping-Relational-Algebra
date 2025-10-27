const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('node:path');
const { spawn } = require('node:child_process');
const mysql = require('mysql2/promise');

// --- THIS IS THE CRITICAL PATH ---
// It dynamically finds your C++ exe relative to this .js file
// This makes your project folder portable!
const cppExecutablePath = path.join(
  __dirname, // Current folder (electron-gui)
  '..',      // Go up to dbms4
  'cpp-translator',
  'build',
  'RelationalAlgebraMapper.exe'
);

// --- MySQL Connection ---
// This uses the modern mysql2 library, which handles SSL/auth correctly
const dbPool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: 'madhur@#12',
  database: 'event_management_db2',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// --- Electron Window Setup ---
function createWindow() {
  const win = new BrowserWindow({
    width: 800,
    height: 700,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
  });
  win.loadFile('index.html');
  // Optional: Open DevTools for debugging
  // win.webContents.openDevTools();
}

app.whenReady().then(createWindow);

// --- The Core Logic ---
// Listen for the 'translate' event from the GUI
ipcMain.handle('translate', async (event, raExpression) => {
  try {
    // 1. Run the C++ parser
    const sqlQuery = await runCppTranslator(raExpression);

    // Stop if translation failed
    if (sqlQuery.startsWith('Parsing Error:') || sqlQuery.startsWith('Error:')) {
      return { sql: sqlQuery, results: 'Translation failed.' };
    }

    // 2. Run the SQL query
    const results = await runSqlQuery(sqlQuery);
    return { sql: sqlQuery, results: results };

  } catch (error) {
    return { sql: 'Error', results: error.message };
  }
});


// Helper function to run your C++ tool
function runCppTranslator(raExpression) {
  return new Promise((resolve, reject) => {
    // Set encoding to utf8
    const options = { encoding: 'utf8' };
    const child = spawn(cppExecutablePath, [], options);

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (data) => {
      stdout += data;
    });

    child.stderr.on('data', (data) => {
      stderr += data;
    });

    child.on('close', (code) => {
      if (code !== 0 || stderr) {
        reject(new Error(stderr || `C++ process exited with code ${code}`));
      } else {
        resolve(stdout.trim()); // Send back the SQL
      }
    });

    // Send the RA expression to the C++ program's stdin
    child.stdin.setEncoding('utf8');
    child.stdin.write(raExpression);
    child.stdin.end();
  });
}

// Helper function to run the SQL query
async function runSqlQuery(sql) {
  try {
    const [rows, fields] = await dbPool.execute(sql);
    
    // Format the results for display
    if (!fields) {
      // Not a SELECT query (e.g., INSERT, UPDATE)
      return `Query OK, ${rows.affectedRows} rows affected.`;
    }

    if (rows.length === 0) {
      return 'Query OK. 0 rows returned.';
    }

    // Format as a simple string table
    const headers = fields.map(f => f.name);
    let output = headers.join('\t') + '\n';
    output += headers.map(h => '-'.repeat(h.length)).join('\t') + '\n';
    
    for (const row of rows) {
      output += Object.values(row).join('\t') + '\n';
    }
    return output;

  } catch (error) {
    return `MySQL Query Error: ${error.message}`;
  }
}