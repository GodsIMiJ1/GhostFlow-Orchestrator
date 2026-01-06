# GhostFlow Desktop Packaging Guide

The desktop shell must preserve GhostFlow’s safety model: context isolation, no Node integration in the renderer, and a narrow preload surface for guarded file operations.

## Electron Setup

### Installation
```bash
npm install electron electron-builder --save-dev
```

### Main Process (electron/main.js)
```javascript
const { app, BrowserWindow } = require('electron');

function createWindow() {
  const win = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
    }
  });

  win.loadURL('http://localhost:5173'); // Dev
  // win.loadFile('dist/index.html'); // Production
}

app.whenReady().then(createWindow);
```

### Build Config (package.json)
```json
{
  "build": {
    "appId": "com.ghostflow.app",
    "productName": "GhostFlow",
    "directories": { "output": "release" },
    "mac": { "target": "dmg" },
    "win": { "target": "nsis" },
    "linux": { "target": "AppImage" }
  }
}
```

## Build Commands
- macOS: `npm run electron:build -- --mac`
- Windows: `npm run electron:build -- --win`
- Linux: `npm run electron:build -- --linux`
