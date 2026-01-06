// GhostFlow Electron entrypoint
// Dev: loads Vite dev server (set ELECTRON_DEV_URL or default localhost:5173)
// Prod: loads built dist/index.html

const { app, BrowserWindow } = require('electron');
const { ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const { applyPatch } = require('diff');

const DEV_URL = process.env.ELECTRON_DEV_URL || process.env.VITE_DEV_SERVER_URL || 'http://localhost:5173';

function createWindow() {
  const win = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      preload: path.join(__dirname, 'preload.cjs'),
    },
  });

  if (process.env.NODE_ENV === 'development' || process.env.ELECTRON_DEV_URL || process.env.VITE_DEV_SERVER_URL) {
    win.loadURL(DEV_URL);
  } else {
    const indexPath = path.join(__dirname, '../dist/index.html');
    win.loadFile(indexPath);
  }

  // On focus, nudge renderer to revalidate backend health (uses existing focus listener/polling)
  win.on('focus', () => {
    if (win.webContents && !win.webContents.isDestroyed()) {
      win.webContents.send('app:focus');
    }
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

ipcMain.handle('apply-file-ops', async (event, payload) => {
  const { repoPath, fileOps } = payload || {};
  if (!repoPath || !Array.isArray(fileOps)) {
    throw new Error('Invalid payload');
  }

  const repoRoot = path.resolve(repoPath);

  const ensureInsideRepo = (target) => {
    const full = path.resolve(repoRoot, target);
    if (!full.startsWith(repoRoot)) {
      throw new Error(`Invalid path: ${target}`);
    }
    return full;
  };

  for (const op of fileOps) {
    if (!op || typeof op.path !== 'string' || typeof op.diff !== 'string') {
      throw new Error('Invalid file operation');
    }
    if (op.path.startsWith('/') || op.path.includes('..')) {
      throw new Error(`Blocked path: ${op.path}`);
    }
    const targetPath = ensureInsideRepo(op.path);
    const dir = path.dirname(targetPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    if (op.type === 'delete') {
      if (fs.existsSync(targetPath)) {
        fs.rmSync(targetPath, { force: true });
      }
      continue;
    }

    if (op.type === 'create') {
      fs.writeFileSync(targetPath, op.diff, 'utf8');
      continue;
    }

    if (op.type === 'modify') {
      const current = fs.existsSync(targetPath) ? fs.readFileSync(targetPath, 'utf8') : '';
      let nextContent = op.diff;
      if (op.diff.includes('@@') || op.diff.startsWith('---') || op.diff.startsWith('*** Begin Patch')) {
        const patched = applyPatch(current, op.diff);
        if (patched === false) {
          throw new Error(`Failed to apply patch for ${op.path}`);
        }
        nextContent = patched;
      }
      fs.writeFileSync(targetPath, nextContent, 'utf8');
    }
  }

  return { ok: true };
});
