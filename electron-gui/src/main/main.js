require('dotenv').config({ path: require('node:path').join(__dirname, '..', '..', '.env') });

const { app, BrowserWindow } = require('electron');
const path = require('node:path');

require('./ipc');

function createWindow() {
  const win = new BrowserWindow({
    width: 1100,
    height: 750,
    webPreferences: {
      preload: path.join(__dirname, '..', 'preload', 'preload.js'),
    },
  });
  win.loadFile(path.join(__dirname, '..', 'renderer', 'index.html'));
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
