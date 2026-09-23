# 🧱 AGENT.md v2 — Vibrant Castle

---

## 0. PURPOSE

This document defines a **STRICT, EXECUTABLE CONTRACT** for:

* Game Engine (TypeScript + Canvas 2D)
* UI Layer (React)
* Content Pipeline (SCENARIO → JSON → ASSETS)
* AI generation and modification rules
* Visual, gameplay, and narrative consistency

All outputs (code, JSON, assets) **MUST comply**.

---

## 1. CORE PRINCIPLES

### 1.1 Layered Architecture

System is strictly separated:

ENGINE → simulation + rendering
UI → React (HUD, menus only)
CONTENT → JSON + assets
AI → generation + modification

❌ FORBIDDEN:

* Mixing UI with game logic
* Storing gameplay state in React

---

### 1.2 Single Source of Truth

* Engine owns ALL gameplay state
* UI is read-only

---

### 1.3 Deterministic Simulation

* Fixed timestep required
* No frame-dependent logic

---

## 2. ENGINE ARCHITECTURE (TS + CANVAS 2D)

### 2.1 Game Loop (MANDATORY)

* Framerates: 30/60/90/120 Hz
* Decoupled render

Structure:

update(fixedStep)
render(interpolation)

❌ FORBIDDEN:

* Game logic in React
* Variable timestep gameplay

---

### 2.2 State Flow

Input → Command → Engine → State → Snapshot → UI

❌ FORBIDDEN:

* React mutating engine state
* Bidirectional state sync

---

### 2.3 Systems (MANDATORY)

* MovementSystem
* CombatSystem
* AnimationSystem
* CollisionSystem
* InputSystem

❌ FORBIDDEN:

* Monolithic update loop

---

### 2.4 Collision & Physics

* AABB collision
* Layer-based collision
* Gravity required

---

### 2.5 Input Pipeline

Raw Input → Normalize → Action → Engine

❌ FORBIDDEN:

* Using raw keys in logic

---

## 3. UI LAYER (REACT)

### 3.1 Responsibilities

React is ONLY for:

* HUD
* menus
* overlays
* settings

---

### 3.2 Communication

* Command dispatch to engine
* Read-only state snapshot

---

### 3.3 Performance

❌ FORBIDDEN:

* Per-frame React updates
* Rendering game entities in React

---

## 4. CONTENT PIPELINE

### 4.1 Pipeline

SCENARIO → LEVEL JSON → ASSETS → ENGINE

---

### 4.2 Level Requirements

Each level MUST define:

* id
* dimensions
* spawn points
* parallax layers
* environment metadata

---

### 4.3 Lore Consistency

Each level MUST:

* match SCENARIO
* reflect world state
* contain narrative meaning

❌ FORBIDDEN:

* random decorative assets

---

## 5. AI OPERATING CONTRACT

### 5.1 Allowed

AI MAY:

* generate PNG assets
* modify level JSON
* adjust parallax

---

### 5.2 Forbidden

AI MUST NOT:

* change gameplay systems
* break lore consistency
* introduce new mechanics

---

### 5.3 Modes

* GENERATE
* FIX
* VALIDATE
* REFACTOR

---

### 5.4 Validation (MANDATORY)

Every output MUST satisfy:

* lore consistency
* asset rules
* technical constraints

---

## 6. VISUAL DIRECTION (STRICT)

### 6.1 Style

Hybrid:

* Bastion → colors, lighting, mood
* Owlboy → clarity, readability
* Castlevania → gameplay structure

---

### 6.2 Rules

✅ REQUIRED:

* strong silhouettes
* depth separation
* controlled lighting

❌ FORBIDDEN:

* realistic textures
* muddy colors
* visual noise

---

## 7. PARALLAX SYSTEM (STRICT)

### 7.1 Layer Hierarchy

FAR → full background
MID_FAR → distant depth
MID → gameplay layer
MID_CLOSE → near depth
CLOSE → foreground

---

### 7.2 FAR (CRITICAL RULE)

* MUST cover 100% of scene
* MUST NOT contain transparency
* Acts as base/fill layer

❌ FORBIDDEN:

* transparent FAR
* holes or gaps

---

### 7.3 Other Layers

* MAY contain transparency
* MUST NOT break composition

---

### 7.4 Global Rules

* No fake transparency
* No visual holes
* Consistent lighting across layers

---

## 8. GAMEPLAY SYSTEM

### 8.1 Type

Castlevania-style action platformer

* narrative overlay (Bastion-like)

---

### 8.2 Combat

* hit detection required
* attack telegraphing required
* animation-driven

---

### 8.3 Readability

❌ FORBIDDEN:

* hidden threats
* unclear hitboxes

---

## 9. NARRATIVE SYSTEM

### 9.1 Style

* reactive narration
* minimal
* contextual

---

### 9.2 Tone

* calm
* reflective
* observant

---

### 9.3 Rules

❌ FORBIDDEN:

* long exposition
* generic fantasy narration

---

## 10. ASSET RULES

### 10.1 General

* PNG ONLY
* TRUE transparency
* NO background
* NO text/UI

---

### 10.2 Sprite Rules

* grid-aligned
* consistent baseline
* wide frames = 2–3 cells

---

### 10.3 Parallax Assets

* must respect depth
* must not flatten scene

---

## 11. LOCALIZATION (i18n)

### 11.1 Rules

* NO hardcoded text
* dictionary-based

---

### 11.2 Language

* EN = canonical
* PL = stylistic equivalent

---

## 12. PERFORMANCE

### 12.1 Target

* 60 FPS stable

---

### 12.2 Rules

❌ FORBIDDEN:

* allocations in render loop
* canvas resize per frame

---

## 13. TOOLING (BUN ONLY)

### 13.1 Runtime

* Bun ONLY
* No Node / npm

---

### 13.2 Commands

bun dev
bun run build
bun run lint

---

## 14. DEFINITION OF DONE

A task is complete ONLY if:

* type-safe
* linted
* i18n compliant
* performance safe
* lore consistent
* asset rules satisfied

---

## 🔚 END
