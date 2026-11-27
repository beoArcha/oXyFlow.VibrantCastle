---
trigger: model_decision
description: How to use the Graphify knowledge graph (neighbourhood checks, blast radius, god nodes in src/game/loop/)
---

# Graphify Architecture Guide for Agents

How to navigate the Vibrant Castle codebase with the Graphify knowledge graph (`graphify-out/graph.json`, git-ignored) and its MCP tools. Everything here applies only when the graph has been built (`bun run graph:build`).

---

## 1. GENERAL RULES AND GRAPH NAVIGATION

Prefer the graph over broad multi-file text searches:
1. **Architecture questions**: start with `query_graph` / `graphify query "<question>"` to find the relevant subgraph and module context.
2. **Relationships**: use `shortest_path(source, target)` or `graphify path "<A>" "<B>"` to see how distant components talk to each other (e.g. UI -> game loop -> systems).
3. **Single concepts**: use `get_node(node_id)` or `graphify explain "<name>"` for a summary of a node and its 20 most important connections.

---

## 2. NEIGHBOURHOOD CHECK (`get_neighbors`)

Before editing or refactoring a component or source file:
1. **Direct dependencies**: call `get_neighbors(node_id, depth=1)` or `graphify explain "<symbol>"`.
2. **Direction of flow**:
   - **Inbound edges**: who depends on this symbol or module? Will a change of signature, type or behaviour force consumer updates?
   - **Outbound edges**: what does this module use? Does it break the layer rules (e.g. no imports from `src/game-menu/`, `src/hud/` or `src/ui/` into `src/game/`)?
3. **2-hop rule for refactors**: when a public interface changes, check the neighbourhood to depth 2 (`depth=2`) to catch indirect side effects.

---

## 3. BLAST RADIUS (`get_pr_impact`)

Before handing over a change:
1. **Impact**: call `get_pr_impact(files)` with the list of changed files. It returns the transitively dependent nodes and the critical risk paths.
2. **Tests**: every test module inside the blast radius must run and pass. If the radius reaches Core/Engine modules, also run the architecture integrity tests (`architectureBoundaries.test.ts`, `layerLeakage.test.ts`).

---

## 4. GOD NODES AND CRITICAL ZONES (`src/game/loop/`)

Nodes with a very high degree (god nodes) carry the highest regression risk.

### Key critical node: `GameEngine` (`src/game/loop/engine.ts`)
The loop in `src/game/loop/` coordinates the whole simulation and rendering lifecycle:
- **Change restrictions**:
  - ❌ **No allocations in tick / render**: no new objects, arrays or anonymous functions inside per-frame methods (`update`, `render`, `tick`).
  - ❌ **No UI / DOM imports**: `src/game/loop/` must not import React components or UI state.
  - ✅ **Fixed-step determinism**: all physics and simulation in the loop run on a fixed step.
  - ✅ **Event-based communication**: events from the loop to the outside world go through `GameEventBus`.
- **Impact check for changes in `src/game/loop/`**:
  - Before the change, run `get_neighbors` on the `GameEngine` node or `get_pr_impact(["src/game/loop/engine.ts"])`.
  - After the change, confirm that no new cycles or new dependencies on outer layers appeared.

---

## 5. UPDATING THE GRAPH

1. After changing source files, run `bun run graph:build` (or `graphify --code-only`) to keep the graph current.
2. For architecture and call-flow reviews before a release (phase gate), run `bun run graph:viz` and `bun run graph:callflow`.
