# GhostFlow Engineering Loop: Plan → Propose → Review → Apply

## Philosophy
GhostFlow treats LLM output as proposals, not commands. The system enforces a deliberate loop:
1. **Plan**: Agents stream analysis and intent.
2. **Propose**: LLM may emit `fileOps` intent (create/modify/delete with diff/content).
3. **Review**: Human reviews proposed changes in the UI (read-only diff).
4. **Apply**: User explicitly approves; deterministic writes occur via Electron preload.

This eliminates blind writes and keeps the human in control, while still enabling rapid iteration.

## Phase Breakdown
- **Planning**: The LLM performs normal reasoning and streams output; terminals and logs remain untouched by any file mutations.
- **Propose (Coding intent)**: The LLM may include a structured `fileOps` array. These are intents only; no filesystem changes are performed automatically.
- **Review**: The UI surfaces proposed ops (path, type, diff/content) for explicit approval or rejection. Proposals persist until acted upon.
- **Apply**: On approval, the renderer calls a guarded preload API. Paths are validated, scopes are enforced to the active repo, and deterministic writes occur. Rejection discards proposals with no side effects.

## Why Proposal-Based Coding is Safer
- LLM output is untrusted; proposals avoid direct, implicit mutation.
- Humans retain authority to accept/reject per change set.
- Deterministic, audited application of diffs/content prevents silent drift.

## Difference from Auto-Claude / Claude Code
- No direct file writes from LLM output.
- Mandatory review-before-apply step.
- Repo scoping enforced at apply time; no global file access.
- Mock fallback only when backend is unreachable; otherwise always real streaming.

## Safety Guarantees
- No background or silent edits.
- Apply path validates repo boundaries and blocks absolute/`..` traversal.
- Plan/stream phases are unchanged; Apply never triggers new LLM calls.
