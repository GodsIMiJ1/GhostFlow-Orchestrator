# GhostFlow

Repo-aware AI orchestration with an explicit plan → review → apply control loop.

## Why GhostFlow Exists
GhostFlow keeps AI-assisted changes inside a transparent guardrail: plans are stated up front, proposals are reviewable before anything touches disk, and users keep full control over when and how changes are applied.

## Engineering Loop
1. **Plan**: The agent outlines intended steps using current repo context.
2. **Propose**: It drafts diffs and file operations as intent-only outputs.
3. **Review**: You inspect the proposed changes, paths, and diffs before anything is written.
4. **Apply**: Approved changes are executed with guarded file access scoped to the active repo.

## Features
- Repo awareness with persistent context tied to the active workspace.
- Live streaming output for plans, proposals, and logs.
- Guarded file operations: no writes occur without explicit approval and path validation.
- Local-first execution routed through your own runtime; keys and context stay on your machine.
- Electron desktop shell for a native, offline-friendly experience.

## Getting Started (Local)
- Install Node.js 18+ and npm.
- Install dependencies: `npm install`.
- Run the web app: `npm run dev`.
- Launch the desktop shell against the local app: `npm run electron:start`.
- Lint before changes if desired: `npm run lint`.

## Documentation
Additional design and implementation details live in `docs/`.

## Status
v0.1.0 — initial open-source release.

## License
Apache 2.0. See `LICENSE` for details.
