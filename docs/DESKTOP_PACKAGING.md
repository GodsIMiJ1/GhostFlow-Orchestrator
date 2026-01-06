# GhostFlow Desktop Packaging Guide

## Electron Setup

### Installation
```bash
npm install electron electron-builder --save-dev
```

### Main Process (electron/main.js)
```javascript
const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow() {
  const win = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
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

---

## Tauri Setup (Recommended)

### Installation
```bash
npm install @tauri-apps/cli @tauri-apps/api --save-dev
npx tauri init
```

### Configuration (src-tauri/tauri.conf.json)
```json
{
  "productName": "GhostFlow",
  "identifier": "com.ghostflow.app",
  "build": { "devPath": "http://localhost:5173", "distDir": "../dist" },
  "bundle": { "active": true, "targets": "all" }
}
```

### Rust Commands (src-tauri/src/main.rs)
```rust
#[tauri::command]
fn git_status(path: &str) -> Result<GitStatus, String> {
    // Implement with git2 crate
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![git_status])
        .run(tauri::generate_context!())
        .expect("error running app");
}
```

---

## Build Commands

| Platform | Electron | Tauri |
|----------|----------|-------|
| macOS | `npm run electron:build -- --mac` | `npm run tauri build` |
| Windows | `npm run electron:build -- --win` | `npm run tauri build` |
| Linux | `npm run electron:build -- --linux` | `npm run tauri build` |

## Bundle Sizes
- Electron: ~150MB
- Tauri: ~10MB
