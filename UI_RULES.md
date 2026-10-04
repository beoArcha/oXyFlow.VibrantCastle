# 🎨 UI_RULES.md — Vibrant Castle (React + TypeScript)

---

## 0. PURPOSE

This document defines **strict implementation rules for the UI layer (React + TypeScript)**.

It extends **AGENT.md** and focuses only on UI concerns:

* component architecture
* hooks
* typing
* data flow
* testing
* performance

> AGENT.md remains the **source of truth** for:

* Engine ownership of state
* Snapshot contract
* System architecture

---

## 1. CORE RULES

### 1.1 UI IS NOT ENGINE

UI is strictly:

* presentation
* user input
* visualization

❌ FORBIDDEN:

* business logic
* gameplay rules
* simulation logic
* state mutation of engine

---

### 1.2 DATA FLOW (STRICT)

```graph TD
Engine --> Snapshot / EventBus --> Context Ports --> View Mappers --> Container / Presentational
```

Rules:

* Snapshot is **read-only**
* UI NEVER mutates engine state directly
* UI communicates via **commands and context ports only**
* Discrete domain notifications flow via **GameEventBus**

---

### 1.3 DESIGN PRINCIPLES

All UI code must follow:

* SOLID (especially SRP)
* KISS
* YAGNI
* DRY
* Clean Code

Priority:

1. Simplicity
2. Maintainability
3. Predictability

---

## 2. COMPONENT ARCHITECTURE

### 2.1 COMPONENT TYPES (MANDATORY)

Every component MUST be one of:

#### 1. Presentational (Pure UI)

* no logic
* no side effects
* receives props only

#### 2. Container

* connects hooks + context ports
* orchestrates data flow

#### 3. Feature Component

* specific to feature
* may combine multiple UI elements

#### 4. View Model Mapper (`*.mapper.ts`) (not a component)

* localized pure projection function within component feature folder
* maps Engine/Data snapshot → UI ViewModel
* pure functions only (zero side effects, zero React state)

---

### 2.2 RULES

✅ REQUIRED:

* small components
* clear responsibility
* composition over inheritance

❌ FORBIDDEN:

* "God components"
* mixing UI + logic
* deep nesting without reason

---

### 2.3 DECOMPOSITION

Split when:

* component > 200–300 LOC
* multiple responsibilities
* repeated logic

---

## 3. TYPESCRIPT RULES (STRICT)

### 3.1 GENERAL

* `strict: true`
* `noImplicitAny: true`
* `exactOptionalPropertyTypes: true`

---

### 3.2 FORBIDDEN

* `any`
* implicit types
* unsafe casting

---

### 3.3 REQUIRED

* explicit return types (public API)
* readonly props
* discriminated unions for state

---

### 3.4 PATTERN

```ts
type Props = Readonly<{
  items: ItemVM[];
  onSelect: (id: string) => void;
}>;
```

---

## 4. HOOKS RULES

### 4.1 RESPONSIBILITY

Hooks are for:

* UI state
* UI behavior
* UI interactions

❌ NOT FOR:

* business logic
* engine logic

---

### 4.2 RULES

* must be deterministic
* no hidden side effects
* use `useEffect` only when needed
* cleanup required

---

### 4.3 NAMING

* must start with `use`
* must describe behavior

---

### 4.4 TESTING

Hooks must be testable in isolation.

---

## 5. PORTS & VIEW MODEL MAPPERS (CRITICAL)

### 5.1 PURPOSE & SEPARATION

Communication and presentation transformations are strictly decoupled:

1. **Context Ports (`src/context/`)**:
   * Encapsulate engine lifecycle, canvas attachment, gamepad polling, and command dispatch.
   * Provide reactive state and event bus subscriptions to UI components.

2. **View Model Mappers (`*.mapper.ts`)**:
   * Localized pure functions transforming raw domain data into UI-ready ViewModel structures:

   ```graph TD
   Engine Snapshot / Data --> Pure Mapper (*.mapper.ts) --> UI ViewModel
   ```

### 5.2 MAPPER RULES

* Pure projection functions ONLY.
* Zero side effects, zero mutable state.
* Resilient: Must handle missing/undefined/invalid data gracefully with safe fallbacks.
* 100% testable in unit tests without mounting React components.
* Located alongside the feature components (e.g. `src/components/inventory/inventory.mapper.ts`).

### 5.3 FORBIDDEN

* Business logic in mappers.
* Direct engine mutations in components.
* Central `src/components/adapters/` directory (abolished).

---

## 6. REUSABLE UI (DESIGN SYSTEM)

### 6.1 STRUCTURE

```graph
ui/
  primitives/
  controls/
  layout/
  hooks/
  adapters/
  feature/
```

---

### 6.2 REQUIRED CONTROLS

Minimum set:

* Button
* Input
* Select
* Dialog / Modal
* Tooltip
* Table (virtualized)
* Spinner / Skeleton
* Toast / Notification
* Layout containers

---

### 6.3 COMPOSITE COMPONENTS

Allowed when:

* reusable
* UI-only logic

❌ NOT allowed:

* embedding business logic

---

## 7. NAMING & READABILITY

### 7.1 RULES

* components: `PascalCase`
* hooks: `useCamelCase`
* files: consistent naming

---

### 7.2 CODE STYLE

* self-descriptive code
* minimal comments
* no redundant naming

---

## 8. COMMENTS

### REQUIRED

* JSDoc for public APIs
* explanation for complex logic

---

### FORBIDDEN

* obvious comments
* duplicated information

---

## 9. TESTING STRATEGY

### 9.1 SHOULD TEST

* view model mappers
* context ports & hooks
* container logic
* interactions

---

### 9.2 SHOULD NOT TEST

* pure UI (unless complex)

---

### 9.3 MUST COVER

* happy path
* edge cases
* failure scenarios

---

## 10. PERFORMANCE

### RULES

* no per-frame React rendering
* avoid unnecessary re-renders
* use memoization carefully
* virtualize large lists

---

### FORBIDDEN PERFORMANCE ELEMENTS

* heavy computations in render
* allocations in render loop

---

## 11. ERROR HANDLING

* never fail silently
* show fallback UI
* central logging

---

## 12. ACCESSIBILITY (A11Y)

### REQUIRED A11Y ELEMENTS

* keyboard navigation
* ARIA attributes
* focus management

---

### FORBIDDEN A11Y ELEMENTS

* click-only UI
* color-only meaning

---

## 13. STATE MANAGEMENT

### LOCAL STATE

Allowed for:

* UI-only state

---

### GLOBAL STATE

Only for:

* UI concerns (theme, settings)

---

### FORBIDDEN GLOBAL STATE USAGE

* storing engine data in UI store

---

## 14. CHANGE MANAGEMENT (UI)

If change affects:

* snapshot structure
* command contract

➡ MUST follow AGENT.md Change Protocol

---

## 15. DEFINITION OF DONE (UI)

A UI task is complete only if:

* type-safe
* no warnings
* follows UI rules
* tested (where needed)
* no domain logic leakage
* accessible (basic level)
* no performance regressions

---

## 🔚 END
