# GhostFlow Engineering Loop: Plan → Propose → Review → Apply

## Philosophy
GhostFlow treats LLM output as intent, not authority. Every run moves through a constrained loop:
1. **Plan**: Agents stream analysis and intent with current repo context attached.
2. **Propose**: LLM may emit `fileOps` intent (create/modify/delete with diff/content). These are inert until approved.
3. **Review**: Humans inspect proposed paths, diffs, and operations in a read-only view.
4. **Apply**: On explicit approval, deterministic writes occur via the guarded preload path.

This keeps execution transparent and prevents silent mutation.

## Phase Breakdown
- **Plan**: Reasoning and logging only; no file mutation.
- **Propose (coding intent)**: Structured `fileOps` array produced as intent. Nothing writes automatically.
- **Review**: UI surfaces ops (path, type, diff/content) for approval or rejection. Proposals persist until acted on.
- **Apply**: Renderer calls the preload API after approval. Paths are validated, scope is enforced to the active repo, and deterministic writes execute. Rejection discards proposals with no side effects.

## Why Proposal-Based Coding is Safer
- Untrusted output never bypasses human review.
- Authority stays with the operator; each change set is inspectable before execution.
- Deterministic application of diffs/content avoids drift and clarifies failure modes.

## Safety Guarantees
- No background or silent edits.
- Apply validates repo boundaries and blocks absolute/`..` traversal.
- Plan/stream phases remain read-only; Apply never triggers new LLM calls.
