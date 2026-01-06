# Welcome to your Lovable project

## Project info

**URL**: GodsIMiJ AI Solutions

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the GodsIMiJ AI Solutions project URL and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open the GodsIMiJ AI Solutions project page and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: Setting up a custom domain (GodsIMiJ AI Solutions).

## Runbook: Local Sovereign Execution

GhostFlow Orchestrator is wired to GhostVault at `VITE_GHOSTVAULT_URL` (default `http://localhost:3001/api/llm`). Use these local commands to validate the contract:

```sh
# Set base (override VITE_GHOSTVAULT_URL if needed)
GV_URL="${VITE_GHOSTVAULT_URL:-http://localhost:3001/api/llm}"

# 1) Health
curl -s "$GV_URL/health"

# 2) Models (ollama)
curl -s "$GV_URL/models?provider=ollama"

# 3) Streaming chat (SSE)
curl -N "$GV_URL/chat" \
  -H "Content-Type: application/json" \
  -d '{
    "provider": "ollama",
    "model": "llama3.2",
    "messages": [{"role":"user","content":"Say: Sovereign link confirmed."}],
    "temperature": 0.2,
    "maxTokens": 64
  }'
```

In-app verification:
- Settings → Test Connection should show connected (green dot) when health passes.
- Start on a task streams live tokens to both Agent Terminal and Streaming Log; mock fallback only triggers if health fails.

## Why GhostFlow Is Safer Than Auto-Claude
- Explicit plan → review → apply: LLMs propose `fileOps` intent; nothing writes without user approval.
- No blind writes: Apply is guarded via Electron preload, repo-bound path validation, and explicit errors.
- Local-first, vendor-agnostic: Streams through GhostVault; no cloud storage or key handling in the UI; repo context stays local.

## How It Works (Concise)
- Connect a repo (path + hasGit). Repo context persists and is attached to every LLM call.
- Run tasks: SSE streams tokens from GhostVault; backend health OK forces real execution (mock only if unreachable).
- LLM may propose `fileOps` (create/modify/delete with diff/content). These are intent-only.
- Review: UI shows proposed changes; Apply/Reject is explicit.
- Apply: Guarded via Electron preload; paths validated to repo root; deterministic writes; errors surface.

## Why GhostFlow Is Different
- Proposal-first, review-required: No direct LLM writes; Apply is human-approved.
- Repo-scoped and local-first: All writes constrained to the active repo; no cloud persistence.
- Deterministic execution: SSE-only when backend is healthy; mock only as last resort.

## Documentation
- Architecture: docs/ARCHITECTURE.md
- Security: docs/SECURITY.md
- Engineering loop: docs/ENGINEERING_LOOP.md
- Repo context: docs/REPO_CONTEXT.md
- LLM execution: docs/LLM_EXECUTION.md
- Filesystem apply: docs/FILESYSTEM_APPLY.md
- Contributing: docs/CONTRIBUTING.md
