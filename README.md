# GhostFlow

Deterministic, repo-aware AI orchestration with explicit human control.

GhostFlow is an AI execution framework built around a strict plan → review → apply control loop. It enables powerful AI-assisted development without surrendering authority, transparency, or safety.

GhostFlow does not “auto-edit your code.” It proposes, you inspect, and only then does anything change.

## Why GhostFlow Exists
Most AI coding tools collapse intent, execution, and mutation into a single opaque step. GhostFlow deliberately separates thinking from action. This architecture exists to solve three hard problems:

- **Trust** — You should see exactly what an AI intends to do before it touches your repo.
- **Safety** — File writes must be scoped, validated, and explicitly approved.
- **Agency** — Humans stay in control of execution, timing, and scope.

GhostFlow treats AI as a junior engineer with a clipboard, not a root shell.

## Core Execution Model
GhostFlow enforces a four-stage, non-bypassable loop:

1. **Plan**  
   The agent analyzes the active repository and produces a structured execution plan: files involved, intended operations, dependency assumptions, and order of execution. No files are modified at this stage.

2. **Propose**  
   The agent generates intent-only outputs: draft diffs, file operation manifests, and path-level change previews. These are proposals, not actions.

3. **Review**  
   You inspect diffs, paths, operation types, and scope boundaries. Nothing proceeds without explicit approval.

4. **Apply**  
   Approved changes are executed through a guarded file system layer: repo-scoped, path-validated, write-restricted, and auditable. There is no silent execution path.

## Key Features
**Repo-Aware Context**
- Persistent understanding of the active workspace
- No stateless prompt guessing

**Explicit Control Loop**
- Plan → Propose → Review → Apply is enforced by design

**Guarded File Operations**
- Zero writes without approval
- Path and scope validation before execution

**Live Streaming Visibility**
- Real-time plans, proposals, and execution logs
- No hidden background actions

**Local-First Architecture**
- Runs on your machine
- Your keys, your code, your context

**Electron Desktop Shell**
- Native app experience
- Offline-friendly
- No dependency on hosted environments

## What GhostFlow Is Not
- ❌ An autonomous code mutator
- ❌ A black-box “AI writes directly to disk” tool
- ❌ A prompt-to-commit generator

GhostFlow is an orchestration layer, not an autopilot.

## Getting Started (Local Development)
**Prerequisites**
- Node.js 18+
- npm

**Setup**
- `npm install`

**Run the Web App**
- `npm run dev`

**Launch the Desktop Shell**
- `npm run electron:start`

**Lint (Optional but Recommended)**
- `npm run lint`

## Documentation
Design notes, architectural decisions, and deeper implementation details are available in the `/docs` directory.

## Project Status
v0.1.0 — Initial open-source release. This release establishes the core orchestration model, guarded execution flow, and desktop runtime. Future versions will expand agent capabilities, policy layers, and orchestration depth.

## License
Apache License 2.0. See `LICENSE` for details.
