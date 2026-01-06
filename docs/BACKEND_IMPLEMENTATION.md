# GhostFlow Backend Implementation Guide

## Architecture Overview

GhostFlow requires a local backend to handle Ollama communication, Git operations, and file system access.

### Option 1: Node.js + Express (Recommended for quick start)
```bash
npm init -y
npm install express cors ws simple-git glob
```

### Option 2: Rust + Axum (Recommended for Tauri)
```bash
cargo new ghostflow-backend
cargo add axum tokio serde git2
```

## Core Endpoints

### Health Check
```
GET /api/health
Response: { status: "healthy", ollamaConnected: true, gitAvailable: true }
```

### Ollama Integration
```
POST /api/ollama/chat
Body: { model: string, messages: [], stream: boolean }
Response: Server-Sent Events stream
```

### Git Operations
```
GET  /api/git/status?path=<projectPath>
POST /api/git/branch { branchName, checkout }
GET  /api/git/diff?staged=true
POST /api/git/commit { message, files }
```

### File Operations
```
GET  /api/files?path=<filePath>
POST /api/files { path, content }
POST /api/files/search { pattern, type: "glob" | "regex" }
```

### Tool Execution
```
POST /api/tools/execute { agentId, toolName, arguments }
```

## WebSocket Events

```typescript
// Server -> Client
{ type: "agent:output", payload: { token, agentId, phase } }
{ type: "phase:change", payload: { taskId, currentPhase } }
{ type: "tool:invoked", payload: { toolName, result } }
{ type: "git:updated", payload: { status } }
```

## Security Considerations

1. **Path Validation**: Prevent traversal attacks
2. **Command Whitelist**: Only allow safe commands
3. **Sandboxed Execution**: Restrict file access to project directory

## Quick Start (Node.js)

```javascript
const express = require('express');
const cors = require('cors');
const { simpleGit } = require('simple-git');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', ollamaConnected: true, gitAvailable: true });
});

app.post('/api/ollama/chat', async (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  const response = await fetch('http://localhost:11434/api/chat', {
    method: 'POST',
    body: JSON.stringify({ ...req.body, stream: true })
  });
  response.body.pipe(res);
});

app.listen(3001, () => console.log('Backend running on :3001'));
```

See `src/types/api.ts` for complete TypeScript interfaces.
