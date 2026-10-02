# 🧱 AGENT.md v4 — Vibrant Castle

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

### 1.4 Engineering Goals

Every engineering decision should improve at least one of the following without unnecessarily harming the others.

* Simplicity
* Maintainability
* Correctness
* Predictability
* Testability
* Native User Experience
* Long-Term Sustainability
* SOLID Principles
* Clean Code Principles
* KISS
* YAGNI
* DRY

---

### 1.5 Code Goals

Always produce code that is:

* Correct
* Predictable
* Maintainable
* Readable
* Consistent
* Easy to extend

Architecture is always more important than implementation speed.

---

### 1.6 CHANGE MANAGEMENT PROTOCOL (MANDATORY)

#### 1.6.1 When Required

This protocol MUST be used when:

* change affects multiple systems (ENGINE / UI / CONTENT / AI)
* change impacts determinism, rendering, input, or state flow
* change introduces or modifies core mechanics
* change touches multiple technical domains
* change complexity is non-trivial

❌ FORBIDDEN:

* implementing complex changes in a single step
* skipping analysis phase
* introducing partial, non-working states

---

#### 1.6.2 Required Workflow

Every complex change MUST follow:

* ANALYSIS
* IMPLEMENTATION PLAN
* PHASED DELIVERY
* VALIDATION

---

#### 1.6.3 Analysis (MANDATORY)

Analysis MUST include:

* problem definition

* affected domains:

  * ENGINE
  * UI
  * CONTENT
  * AI

* technical layers:

  * rendering
  * simulation
  * collision
  * input
  * persistence
  * logging

* risks:

  * determinism break
  * performance degradation
  * visual inconsistency

* invariants that MUST NOT be broken

Output: structured analysis document

---

#### 1.6.4 Implementation Plan (MANDATORY)

Plan MUST:

* define phases
* define scope per phase
* define expected output per phase

Each phase MUST produce:

* working
* testable
* stable

Must NOT break:

* game loop
* determinism
* rendering pipeline
* UI contract

---

#### 1.6.5 Phased Delivery Rules

Each phase MUST:

* be independently runnable
* not require unfinished future work
* maintain full engine integrity

Allowed:

* temporary adapters
* feature flags

❌ FORBIDDEN:

* partially implemented systems
* dead code paths
* broken contracts

---

#### 1.6.6 Domain vs Technical Decomposition

Changes MUST be decomposed along:

A. System Domains:

* ENGINE
* UI
* CONTENT
* AI

B. Technical Concerns:

* rendering
* simulation
* collision
* input
* animation
* logging
* persistence

---

#### 1.6.7 Phase Design Strategy

Order:

1. Data structures
2. Core logic (ENGINE)
3. Rendering
4. UI integration
5. Content integration

Never reverse this order.

---

#### 1.6.8 Validation (MANDATORY)

Each phase MUST pass:

* determinism check
* performance check
* rendering correctness
* no regression

---

#### 1.6.9 Output Format (STRICT)

* ANALYSIS
* PHASE PLAN
* IMPLEMENTATION
* VALIDATION REPORT

---

### 1.7 TypeScript Architecture & Patterns (STRICT)

#### General Rules

* `strict` mode REQUIRED
* `any` FORBIDDEN
* implicit types FORBIDDEN
* explicit return types REQUIRED for public APIs

#### Type Safety

* Prefer `unknown` over `any`
* Use discriminated unions
* Avoid unsafe casting

#### UI Note

Detailed UI TypeScript, hooks and component rules are defined in:

➡ **UI_RULES.md (source of truth for UI implementation)**

---

### 1.8 Comments

* Comments must follow CleanCode principles
* Comments must be concise
* Comments must be in English
* Prefer self-explanatory code
* Use comments only for non-obvious logic

---

## 2. ENGINE ARCHITECTURE (TS + CANVAS 2D)

### 2.1 Game Loop (MANDATORY)

* 30/60/90/120 Hz
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

#### UI Contract

* Snapshot is immutable
* UI is read-only
* UI communicates via commands only

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

### 3.4 UI Implementation Rules

UI implementation details are defined in:

➡ **UI_RULES.md (MANDATORY)**

This includes:

* component architecture
* hooks rules
* adapters
* testing
* naming
* performance guidelines

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

### 4.4 Level JSON schema

Must include schema validation and CI enforcement.

---

## 5. AI OPERATING CONTRACT

### 5.1 Allowed

AI MAY:

* generate assets
* modify JSON
* adjust visuals

---

### 5.2 Forbidden

AI MUST NOT:

* change gameplay systems
* break consistency
* introduce mechanics

---

### 5.3 Modes

* GENERATE
* FIX
* VALIDATE
* REFACTOR

---

### 5.4 Validation

* lore consistency
* technical correctness
* asset compliance

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

* MUST cover 100% of scene and MUST be opaque (no alpha).
* Exception to "PNG ONLY / TRUE transparency": FAR is allowed to be an opaque PNG without transparency and must have opaque: true in level JSON. All other parallax layers must use true transparency.

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

Provide bun minimal version; include Dockerfile/GHA sample; provide node fallback commands or state that contributors must use bun. Include ci/bun-setup.yml example.

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
* Unit tests >= 80% coverage for engine core.
* Performance: 60 FPS smoke test on defined CI runner.
* Asset validator clean.
* Level schema validated.
* i18n keys complete.
* a11y implemented at atleast minimum useful level

---

## 🔚 END
