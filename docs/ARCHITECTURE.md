# GhostFlow Architecture

## High-Level System Overview
- **Renderer (React/Vite)**: UI, execution orchestration, streaming terminals/logs, fileOps proposal parsing, review controls.
- **Orchestration Layer**: Manages projects, tasks, agent runs, and persistence (repo context, fileOp proposals, logs).
- **LLM Execution Pipeline**: Builds payloads with repo metadata, streams SSE tokens from GhostVault (`/api/llm/chat`), captures fileOps intent.
- **Electron Preload Bridge**: Exposes a single guarded API (`applyFileOps`) to the renderer; enforces isolation, no Node integration in renderer.
- **Main Process (Filesystem Ops)**: Validates paths, applies fileOps deterministically inside the active repo root; no shell or network side-effects.

## Data Flow
```
[Repo Path + hasGit] --> [Project Context] --> [Renderer builds LLM payload with metadata]
       |                                               |
       v                                               v
 (Persisted in state)                          /api/llm/chat (SSE)
                                                         |
                                    tokens + optional fileOps intent
                                                         v
                                   [Renderer parsing -> fileOp proposals]
                                                         |
                           [Review UI: Apply/Reject (human approval)]
                                                         |
                          Apply -> window.ghostflow.applyFileOps(repoPath, ops)
                                                         |
                        [Preload validation] -> [Main deterministic FS writes]
                                                         |
                                           [Local Repo Path only]
```

## Boundaries and Enforcement
- **Repo scoping**: Paths must resolve under the active project’s repo path; absolute or `..` traversal is blocked in preload/main.
- **No direct LLM FS access**: Renderer treats fileOps as intent only; Apply requires user action and guarded IPC.
- **Path validation**: Per-op validation before any write; invalid targets fail loudly, no partial silent writes.
- **SSE-only execution**: Backend health OK → real `/api/llm/chat` SSE; mock only when unreachable.

## Why No Silent Automation
- Prevents untrusted LLM output from mutating code without review.
- Ensures deterministic, auditable changes with clear human approval.
- Keeps repo integrity by enforcing boundaries at the only write surface (preload/main).
