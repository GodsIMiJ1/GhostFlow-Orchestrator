**🧠 GHOSTVAULT SYNC PATTERN**
**Topic:** *Local Persistent Context Store for GhostFlow Agents*
**Purpose:** To enable sovereign AI memory, persistent repo state, and flame-aligned execution tracking — all **locally**, with no cloud, no vendor lock-in, and **total developer control**.

---

## 🔐 Overview

GhostFlow runs **context-aware AI agents** — but context fades fast unless you **sync memory persistently**.
This pattern uses **GhostVault** as the **local-first, schema-strict memory backend**, enabling:

* Agent state restoration between sessions
* Plan → Proposal → Review history
* Repo-linked AI memories
* Sovereign “internal logs” for dev self-reflection

---

## 🧩 Pattern Goals

| Goal                         | Implementation Tactic                                    |
| ---------------------------- | -------------------------------------------------------- |
| 🔁 Session Persistence       | Save/restore agent, repo, and loop state                 |
| 🧠 Contextual Memory         | Maintain prior agent steps, file analysis, and diffs     |
| 🔐 Sovereign Storage         | **Local only** → SQLite or Postgres via Docker, no cloud |
| 🧾 Review Logs + Time Travel | Timestamped FlameLogs stored in `vault.context_history`  |
| 🗂️ Repo-specific Isolation  | Namespace memory per `repo_id` hash                      |
| 🔥 Flame-Aligned UX Support  | Sync with UI stream logs and proposal viewers            |

---

## 📂 Recommended Schema (`GhostVault` → `context`)

```sql
-- ghostvault.schema: context

CREATE TABLE context.agent_state (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  repo_id TEXT NOT NULL,
  agent_name TEXT NOT NULL,
  memory JSONB DEFAULT '{}',
  loop_stage TEXT CHECK (loop_stage IN ('plan', 'propose', 'review', 'apply')),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE context.context_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  repo_id TEXT NOT NULL,
  event_type TEXT, -- plan, propose, apply, etc
  payload JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Optional: cache file fingerprints for rapid rehydration
CREATE TABLE context.repo_snapshot (
  repo_id TEXT PRIMARY KEY,
  files JSONB, -- { "src/index.ts": "SHA256", ... }
  captured_at TIMESTAMP DEFAULT NOW()
);
```

---

## 🧬 Sync Pattern — `ghostflow/contextSync.ts`

```ts
import { GhostVaultClient } from "@/lib/vault";
import { getCurrentRepoId, captureRepoState } from "@/lib/repo";
import { getAgentMemory, setAgentMemory } from "@/agents";

export async function hydrateContext(agentName: string) {
  const repoId = await getCurrentRepoId();
  const memory = await GhostVaultClient.fetchAgentMemory(repoId, agentName);
  if (memory) setAgentMemory(agentName, memory);
}

export async function persistContext(agentName: string) {
  const repoId = await getCurrentRepoId();
  const memory = getAgentMemory(agentName);
  await GhostVaultClient.saveAgentMemory(repoId, agentName, memory);
}

export async function logContextEvent(eventType: string, payload: any) {
  const repoId = await getCurrentRepoId();
  await GhostVaultClient.appendEvent(repoId, eventType, payload);
}

export async function snapshotRepo() {
  const repoId = await getCurrentRepoId();
  const snapshot = await captureRepoState();
  await GhostVaultClient.saveRepoSnapshot(repoId, snapshot);
}
```

---

## 🔁 When to Call These

| Trigger                      | Action                                  |
| ---------------------------- | --------------------------------------- |
| App load                     | `hydrateContext()`                      |
| On Plan → Propose transition | `persistContext()`, `logContextEvent()` |
| On Proposal review accepted  | `logContextEvent('review', {...})`      |
| On Apply                     | `logContextEvent('apply', {...})`       |
| On File Change               | `snapshotRepo()`                        |

---

## 🔐 Storage Backend Options

| Mode             | Tech                             | Notes                                      |
| ---------------- | -------------------------------- | ------------------------------------------ |
| **Local Dev**    | SQLite                           | Fast, easy, bundle with Electron           |
| **Local Docker** | Postgres + GhostVault Dockerfile | Persistent vault with RLS + schema control |
| **Optional**     | MinIO (for binary diffs)         | Advanced repo state diffs, if needed       |

---

## 🔥 Flame Alignment Rules

* **No data is ever sent to the cloud**
* **Every context entry is viewable, editable, deletable by the dev**
* **All memory is scoped to the active repo hash (no overlap)**
* **RLS (Row-Level Security)** enforced if PostgreSQL is used
* **Logs are sacred** → use them for review, reflection, and recovery

---

## 🧠 Future Expansion

* Add **FlameMemoryScorer** to weight memory chunks by usefulness
* Add **context diff viewer** in UI with time-travel navigation
* Enable **AI-assisted summarization** of prior review sessions
* Sync with WhisperNet for **distributed memory propagation**


