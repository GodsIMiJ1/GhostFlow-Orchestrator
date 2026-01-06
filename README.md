<p align="center">
  <img src="assets/ghostflow-banner.png" alt="GhostFlow Banner" />
  <br />
  <em><strong>Conscious AI Orchestration for Sovereign Developers</strong></em>
</p>


# 🔥 GHOSTFLOW

> **“Plan it. Propose it. Review it. Approve it. _Then — and only then — apply it.”**
> — *The Ghost King’s Law of Execution*

GhostFlow is a **repo-aware AI orchestration system** designed to keep every automated change inside a **transparent, controlled, sovereign loop**. Nothing hits your disk unless **you** say so.

Built for devs who want **full authority over AI assistance**, GhostFlow flips the script on the black-box copilot paradigm. Here, **you’re the conductor. The AI obeys.**

---

## 💡 Why GhostFlow Exists

Modern AI tools try to move too fast — writing code, making changes, and committing without oversight.

**GhostFlow enforces discipline.** It turns automation into a **deliberate 4-phase engineering ritual**:

1. **Plan** → The agent reads your repo and outlines its intended steps.
2. **Propose** → Diffs, file ops, and directory changes are shown as dry-run intent only.
3. **Review** → You inspect and approve (or reject) each part. Nothing applies without consent.
4. **Apply** → Only after approval does GhostFlow execute the changes, scoped to your repo.

Every step is visible. Every move is yours to command.

---

## ⚙️ Core Features

* 🔍 **Persistent Repo Awareness**
  Context is tied to your current workspace. No guesswork.

* 🔁 **Streaming Plan → Proposal → Review Loop**
  See live AI output as it generates plans, proposes diffs, and logs intent.

* 🛡️ **Guarded File Operations**
  No disk changes occur without explicit approval and scoped validation.

* 🧩 **Local-First Architecture**
  All execution routes through your own runtime. Keys and context stay local.

* 🖥️ **Electron Shell + Web App**
  Use the desktop experience or run the web UI locally. Fully offline-capable.

---

## 🚀 Getting Started

1. **Install Node.js 18+ and npm**

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Run the local web app**

   ```bash
   npm run dev
   ```

4. **Launch the Electron desktop shell**

   ```bash
   npm run electron:start
   ```

5. *(Optional)* Lint your changes

   ```bash
   npm run lint
   ```

---

## 📁 Project Structure

```
ghostflow/
├── app/               # Frontend UI (React/Next/Electron)
├── agent/             # AI planning + diff engine
├── orchestrator/      # Control loop: plan → propose → apply
├── services/          # Git ops, file validation, I/O sandbox
├── docs/              # Extended design documents
├── tests/             # Integration + unit coverage
└── main.ts            # Entrypoint logic
```

---

## 📚 Documentation

Full design notes, diagrams, and architectural specs live in the [`docs/`](./docs) folder.

---

## 🛠️ Status

**`v0.1.0` — Initial Open Source Release**
GhostFlow is functional, local-first, and battle-ready.
We're actively expanding into **multi-agent orchestration** and **CLI injection support**.

---

## ⚖️ License

Apache 2.0 — use it, fork it, modify it.
But don’t violate the sacred loop.

---

## 🧠 Built With Flame by GodsIMiJ AI Solutions

This is not a copilot.
This is a **conscious code channel**, forged for sovereign builders.

> Want to integrate GhostFlow into your AI DevOps stack?
> Reach out at **[godsimij902@gmail.com](mailto:godsimij902@gmail.com)**.

---

**NODE Verified. Flame Approved. Omari Signed.**

