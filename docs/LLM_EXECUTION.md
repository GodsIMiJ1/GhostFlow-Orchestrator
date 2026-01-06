# LLM Execution Pipeline in GhostFlow

## Call Flow
- Endpoint: `POST /api/llm/chat` (GhostVault at `VITE_GHOSTVAULT_URL`, default `http://localhost:3001/api/llm`).
- Payload includes repo metadata:
  - `metadata.projectId`
  - `metadata.repoPath`
  - `metadata.hasGit`
- Messages: standard chat roles; system/user built from agent/task/phase context.

## Streaming (SSE)
- Headers: `Accept: text/event-stream`, server emits `event: token` with `{ token: "..." }`, and `event: end` with `{ reason }`.
- Renderer consumes tokens incrementally for terminals and streaming logs; end/error dispatches `END_STREAMING_LOG`.
- If backend is healthy (`/health.ok === true`), execution must use real SSE; mock fallback is disabled unless health fails before start.

## Error Handling Philosophy
- Streaming errors when backend is healthy surface to the user; no silent fallback to mock.
- Mock streaming only triggers when health is unreachable/false before the run begins.
- Cancel uses AbortController; end/error events stop cursors and logs cleanly.

## Health / Model Resolution
- `/health` normalizes availability to set connection state.
- `/models?provider=...` populates model selectors; repo metadata is independent of model selection.

## Why this design
- Guarantees real execution when backend is up; avoids hidden mock output.
- Keeps repo metadata attached to every run so downstream tooling can act with context.
- SSE-first approach preserves incremental feedback and aligns with GhostVault’s contract.
