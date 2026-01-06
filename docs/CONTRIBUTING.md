# Contributing to GhostFlow

## Repo Setup
- Requirements: Node 18+, npm, Git, GhostVault running at `http://localhost:3001/api/llm` for real streaming.
- Install deps: `npm install`
- Dev server: `npm run dev` (Vite + Electron dev loads http://localhost:5173 by default)
- Desktop build: `npm run electron:build`

## Architectural Principles
- Proposal-first: LLMs produce `fileOps` intent; no direct writes.
- Review-before-apply: Human approval is mandatory; Apply is guarded and repo-scoped.
- Local-first: Repo context (path + hasGit) is required and attached to every run.
- Separation of concerns: Renderer has no raw FS access; preload exposes a single guarded API.
- Deterministic Apply: Validate paths, block abs/`..`, write only under repo root, surface errors.

## Guidelines
- Do not introduce silent automation or unreviewed file writes.
- Do not bypass repo boundaries or path validation.
- Keep mock fallback only for unreachable backend; never mask errors when backend is healthy.
- Preserve streaming UX (SSE tokens, end/error handling).
- Keep preload API narrow; no shell execution or additional FS APIs without review.

## Changes & PRs
- Include tests or manual verification steps for new behavior.
- Document architectural/security implications for any changes to execution, preload, or Apply.
- Update relevant docs in `/docs` when modifying core flow or safety guarantees.
