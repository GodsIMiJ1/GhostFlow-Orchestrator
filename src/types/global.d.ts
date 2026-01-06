export {};

declare global {
  interface Window {
    ghostflow?: {
      applyFileOps: (repoPath: string, fileOps: Array<{ type: string; path: string; diff: string }>) => Promise<{ ok: boolean }>;
    };
  }
}
