# GhostFlow Security Model

## Threat Model
- Untrusted LLM output must not mutate the filesystem directly.
- Renderer is untrusted for FS: no Node integration; only a narrow preload API is exposed.
- Repo integrity: writes must be scoped to the active repo; absolute or traversal paths are blocked.
- Streaming execution: errors surface; mock fallback only when backend is unreachable.

## Why LLMs cannot touch the filesystem directly
- LLM output is proposals (`fileOps` intent), not commands.
- Apply requires human approval and passes through guarded IPC to main.
- No direct FS APIs exist in the renderer; contextIsolation + sandbox prevent Node access.

## Electron Security Posture
- `contextIsolation: true`, `sandbox: true`, `nodeIntegration: false`.
- Preload exposes only `applyFileOps(repoPath, fileOps)`.
- Path validation in preload/main: no absolute paths, no `..`, must resolve under repo root.
- No shell or network helpers in preload/main; only deterministic FS writes.

## Path Validation Rules
- Reject absolute paths.
- Reject `..` traversal.
- Resolve targets under the active repo root; anything else fails fast with explicit error.

## Why Apply Requires Approval
- Prevents silent or automatic writes from untrusted output.
- Ensures human-visible review of diffs/content before mutation.
- Failed validation or patching raises explicit errors; no silent fallback to mock.

## Intentional Exclusions
- No autonomous editing.
- No shell execution.
- No global FS access outside the active repo root.
- No background repo indexing or hidden writes.
