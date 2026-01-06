# GhostFlow Orchestrator — Project Status Summary

Generated: 2026-01-06

---

## 1. Project Overview

GhostFlow Orchestrator is a local-first, sovereign AI development orchestration system designed to achieve feature parity with Auto-Claude while operating entirely on local infrastructure. The system coordinates multiple AI agents through a fixed five-phase workflow (Spec, Plan, Code, Review, QA) to execute software development tasks. All execution decisions, provider integrations, and tool invocations are routed through a self-hosted backend (GhostVault), ensuring complete data sovereignty and offline capability. The frontend serves as an observation and control interface, never storing secrets or making direct external API calls.

---

## 2. Current Phase Status

| Phase | Status | Scope Boundary |
|-------|--------|----------------|
| UI Build & Parity | Complete / Locked | All frontend UI systems: layout, task management, agent inspection, terminal output, MCP overview, settings, execution controls |
| Backend Integration | In Progress | Frontend wiring to GhostVault API endpoints; service layer and provider abstraction created; streaming infrastructure in place |

---

## 3. Implemented Systems

| System | What Is Implemented |
|--------|---------------------|
| Task Board | Kanban-style board with columns for Queued, Active, Review, Done; task cards with status badges; task creation dialog with title, description, priority, agent assignment |
| Agent Inspector | Agent selection panel with role-based categories; status indicators (idle, working, error); capability badges; MCP bindings panel showing tool permissions per agent |
| Agent Terminals | Multi-agent terminal layout; streaming log display with phase context; entry-level rendering with timestamp, phase, and content; real-time token streaming infrastructure |
| MCP Overview | Server list with connection status indicators; server rows displaying name, status, and tool count; expandable tool listings |
| Execution Engine Settings | Provider selection (Ollama/OpenRouter); endpoint configuration for Ollama; API key input for OpenRouter (display only, not stored); model assignment dropdowns; connection test functionality wired to GhostVault |
| Approval Gate | Gate display within phase timeline; approve/reject action buttons; visual distinction for pending approval states |
| Three-Pane Layout | Resizable left sidebar, main content area, and right panel; collapsible panels with smooth transitions; responsive breakpoints for different viewport sizes |
| Provider Abstraction (Frontend) | LLM service layer (`llm-service.ts`) targeting GhostVault endpoints; SSE streaming parser for token-by-token output; provider registry routing through GhostVault; health check and model listing integration |
| Mock/Demo Streaming | `use-mock-streaming.ts` hook for demonstration mode; simulated agent output by phase; character-by-character streaming simulation |
| Persistence Layer | `use-persistence.ts` hook for localStorage; persists tasks, settings, agents, and UI preferences; automatic save on state changes |

---

## 4. Architecture Snapshot

### UI Layer
React 18 with TypeScript. Tailwind CSS for styling. Radix UI primitives for accessible components. shadcn/ui component library. Vite for build tooling.

### State/Context Layer
`OrchestrationContext` provides global state via `useReducer`. State includes projects, tasks, agents, settings, UI state, terminal entries, and connection status. Actions dispatched for all state mutations. No external state management library.

### Provider Abstraction
`llm-service.ts` serves as the sole interface to backend LLM operations. All provider calls route through GhostVault endpoints (`/health`, `/models`, `/chat`). SSE parsing handles streaming responses. Provider-specific logic exists only in GhostVault, not frontend.

### Backend Dependency
GhostVault is the expected local HTTP server providing LLM gateway, secrets management, and provider routing. GhostVault is not part of this codebase. Frontend assumes GhostVault availability at configurable endpoint (default: `http://localhost:3001/api/llm`).

---

## 5. What Is Intentionally Not Implemented

| Item | Reason |
|------|--------|
| Backend Execution | GhostVault implementation is separate; frontend only wires to expected API contract |
| MCP Server Execution | MCP Overview displays configuration but does not invoke tools or connect to MCP servers |
| MCP Server Execution | MCP Overview displays configuration but does not invoke tools or connect to MCP servers |
| Git Side Effects | No actual Git operations (clone, commit, push); UI displays mock Git status only |
| Live Orchestration Logic | Phase progression, agent handoffs, and task state machine not automated; UI reflects mock/static state |
| Secret Storage | API keys and credentials never stored in frontend; GhostVault handles all secrets |
| Authentication | No user authentication or session management |
| Multi-Project Persistence | Project list is mock data; no project creation or storage |

---

## 6. UX & Design Principles Preserved

- Progressive disclosure: advanced settings collapsed by default; complexity revealed on demand
- Calm execution focus: no status spam, no alert modals, no intrusive notifications
- UI observes state: interface reflects backend state rather than driving it
- No manual agent control: agents cannot be individually started or stopped from UI
- Silence as a feature: idle states are visually quiet; activity revealed only when present
- Streaming reveal: terminal output appears token-by-token, maintaining execution presence
- Error containment: failures surface within terminals or subtle indicators, never modal dialogs

---

## 7. Readiness Statement

This project is ready for:

- **Backend Integration Completion**: Wiring `ExecutionControls` "Start" button to trigger real agent execution via GhostVault `streamChat()`
- **Persistence Layer**: Adding localStorage or IndexedDB for tasks, settings, and execution engine configuration
- **Live Orchestration**: Implementing phase progression logic and agent handoff automation
- **Git Integration**: Connecting to real Git operations via GhostVault
- **MCP Execution**: Wiring MCP server connections and tool invocations

The frontend infrastructure supports all of the above without architectural changes.

---

## 8. File Structure Reference

```
src/
├── components/
│   ├── agents/           # Agent selector, terminal, MCP bindings
│   ├── layout/           # Three-pane layout, sidebar, topbar
│   ├── mcp/              # MCP server list and rows
│   ├── orchestration/    # Phase timeline, execution controls, approval gate
│   └── ui/               # shadcn/ui components
├── context/
│   └── OrchestrationContext.tsx
├── hooks/
│   ├── use-llm-provider.ts
│   └── use-mock-streaming.ts
├── pages/
│   ├── AgentsPage.tsx
│   ├── AgentTerminalsPage.tsx
│   ├── Dashboard.tsx
│   ├── MCPOverviewPage.tsx
│   ├── SettingsPage.tsx
│   └── TasksPage.tsx
├── providers/
│   ├── providerRegistry.ts
│   ├── ollamaProvider.ts
│   └── openRouterProvider.ts
├── services/
│   └── llm-service.ts
└── types/
    ├── orchestrator.ts
    ├── api.ts
    ├── terminals.ts
    └── mcp.ts
```

---

*This document reflects the implemented state as of 2026-01-06. It is not a roadmap.*
