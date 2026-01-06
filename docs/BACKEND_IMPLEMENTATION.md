# GhostFlow Backend Implementation Guide

GhostFlow expects a local backend (GhostVault or equivalent) that provides deterministic, repo-scoped execution. The frontend sends intent and context; the backend streams tokens and never writes to disk on its own.

## Required Capabilities
- Serve `/api/llm/chat` as SSE with streamed tokens and optional `fileOps` intent.
- Expose `/health` and `/models` to signal availability and model inventory.
- Keep all operations scoped to the provided `repoPath`; do not perform implicit writes.
- Surface errors directly; avoid silent fallbacks or retries that hide failure modes.

## Minimal Node.js Skeleton
```bash
npm init -y
npm install express cors
```

```javascript
import express from 'express';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

app.get('/api/models', (_req, res) => {
  res.json({ models: [] }); // populate from your runtime
});

app.post('/api/llm/chat', async (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  // Stream tokens from your provider; attach repo metadata from req.body.metadata
  res.write(`event: token\ndata: ${JSON.stringify({ token: 'placeholder' })}\n\n`);
  res.write(`event: end\ndata: ${JSON.stringify({ reason: 'demo' })}\n\n`);
  res.end();
});

app.listen(3001, () => {
  console.log('GhostFlow backend listening on :3001');
});
```

## Security Considerations
- Validate every path and repo input; reject absolute/`..` traversal.
- Avoid shell execution or side effects that escape the provided repo scope.
- Keep streaming deterministic; do not downgrade to mock output without surfacing the reason.

See `src/types/api.ts` for the current frontend contract.
