---
trigger: always_on
---

# Orchestration, Merge and Phase Rules

How work is delegated, reviewed, merged and released in **Vibrant Castle**. When this file and an older rule disagree, this file wins.

---

## 1. ROLES

- **Owner**: sets direction. Approves decisions that shape future direction or carry great weight, such as a design contract, a new pillar, deleting a system, or a version bump. Everything else is delegated.
- **Orchestrator**: a Claude agent. It picks cards from the current phase file in [`docs/tasks/`](../../docs/tasks/README.md) and delegates each one to a delegate of the card's model class. It reviews every result and merges the PR itself once review and CI pass. It asks the owner only for the decisions listed above.
- **Delegate**: works on exactly one card in its own branch or worktree. It commits locally and reports back. A delegate **never pushes and never merges**.

## 2. MODEL CLASSES

Each card names a class, never a specific model. The orchestrator maps classes to the models it has.

| Class | Use for |
| :--- | :--- |
| `tiny` | Small local or open models; one-line fixes, renames, single-value tweaks. |
| `small` | Cheap, well-specified edits with a clear test. |
| `medium` | Engine and cross-cutting code, larger features. |
| `large` | Design docs, plans, hard refactors, reviews. |
| `huge` | Whole-system work. |

## 3. PR AND BRANCH RULES

- ✅ **One small PR per task card.** A card that grows is split into new cards, not into a bigger PR.
- ✅ **Branch from `origin/main`.** Fetch first; never branch from another delegate's branch unless the card says so.
- ✅ **At most 4 concurrent delegated tasks that run builds or tests.** Tasks that only read or write docs do not count.
- ✅ **Commit trailer convention.** Every commit message ends with a `Co-Authored-By:` trailer naming the agent that wrote it. PR descriptions end with the generator line the tooling provides.
- ✅ **Review before merge.** The orchestrator reads the full diff. It checks the change against `.agents/rules/`, runs or confirms `bun run typecheck`, `bun test src/tests/arch` and the suites the card touches, and checks visual changes with a headless browser screenshot. It merges only when review and CI are green.
- ❌ **FORBIDDEN: delegates pushing or merging.** Only the orchestrator pushes and merges.
- ❌ **FORBIDDEN: release or version bump outside a phase gate.** A hotfix release inside a phase needs the owner's decision.
- ❌ **FORBIDDEN: local absolute user paths and trademarked console brand names** in code, commits, PRs or docs (enforced: `trademarkNames.test.ts`). Use `%TEMP%`, `%LOCALAPPDATA%` or `%USERPROFILE%` in examples.

## 4. PHASES AND VERSIONS

- Work runs in phases tied to minor versions: phase N ships as `0.(N-1).x`. Phase 4 = `0.3.x` (current). Closing phase 4 starts phase 5 and `0.4.0`.
- The phases, their goals and their planned / done cards are in [`docs/tasks/ROADMAP.md`](../../docs/tasks/ROADMAP.md). Every task card carries a `Phase` field.
- **Quality gate** at the end of every phase, strictly in this order:
  1. Docs quality and conformance check (the docs match the code).
  2. Docs update.
  3. General review.
  4. Release.
  5. Version bump. This is the only moment the minor version changes. The owner approves it.
- The gate is itself a task card (type `review` / `workflow`). Unfinished cards move to the next phase at the gate, never silently.

## 5. HIERARCHY OF AUTHORITY

When sources disagree:

$$\text{Code \& arch tests} \longrightarrow \text{.agents/rules/} \longrightarrow \text{docs/tasks/ (roadmap, vision, phase files)} \longrightarrow \text{other docs}$$

A mismatch found anywhere is a defect: fix it in the same PR if the PR touches it, otherwise file a card.
