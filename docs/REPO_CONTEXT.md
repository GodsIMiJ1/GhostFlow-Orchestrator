# Repo Context in GhostFlow

## What “repo context” means
- Active project includes:
  - `path`: absolute or user-selected repo folder
  - `hasGit`: boolean hint if `.git/` is present
- This context is required for execution and is attached to every LLM payload.

## Detection
- When selecting a repo folder, GhostFlow records the path and checks for `.git/` in the selection (boolean only).
- No deep git operations (status/diff/indexing) are performed during connect.

## Persistence
- Projects (including `path` and `hasGit`) persist across reloads and restarts.
- Active project selection is restored on hydration.

## Execution attachment
- Every `/api/llm/chat` payload includes:
  - `metadata.projectId`
  - `metadata.repoPath`
  - `metadata.hasGit`
- Executions require an active project; runs, retries, and chained executions all carry repo metadata.

## Non-goals (now)
- No automatic indexing or scanning.
- No automatic git status/diff on connect.
- No backend registration; repo info is sent as metadata only.

## Why it matters
- Ensures agents operate in a consistent, repo-scoped context.
- Future-proof for explicit “scan” or git-aware actions without weakening the current safety model.
