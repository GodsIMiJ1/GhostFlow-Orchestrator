const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('ghostflow', {
  applyFileOps: async (repoPath, fileOps) => {
    return ipcRenderer.invoke('apply-file-ops', { repoPath, fileOps });
  },
});
