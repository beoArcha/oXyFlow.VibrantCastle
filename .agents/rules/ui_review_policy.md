---
trigger: model_decision
description: When it's part of UI/UX flow
---

# UI Review Policy

## 0. PURPOSE

This document defines general rules for AI-assisted review of UI code.

It applies to UI layers built with component-based or reactive UI frameworks.

This policy is technology- and project-agnostic.

Project-specific `AGENT.md`, UI-specific rule files, and design-system rules remain authoritative for implementation details, architecture, naming, testing, and framework conventions.

---

# 1. UI RESPONSIBILITY

UI code SHOULD primarily be responsible for:

- presentation
- user interaction
- presentation state
- navigation and view flow
- accessibility
- formatting and display

UI code SHOULD NOT own business rules, domain state, persistence, or infrastructure responsibilities unless explicitly allowed by the project architecture.

Review MUST identify logic that belongs to another layer.

---

# 2. COMPONENT RESPONSIBILITY

Every component SHOULD have one clear primary responsibility.

Review for:

- multiple unrelated responsibilities
- business logic mixed with rendering
- data fetching mixed with presentation
- lifecycle logic mixed with visual concerns
- excessive orchestration
- components that know too much about unrelated features

Prefer clear responsibility boundaries.

Do NOT split a component merely to reduce line count.

---

# 3. COMPONENT CLASSIFICATION

When useful, classify components as:

- **Presentational** — renders data and emits UI events
- **Container** — connects state, hooks, or external interfaces to presentation
- **Feature** — represents a domain-specific or feature-specific UI composition
- **Composite** — reusable composition of smaller UI elements

A component that contains domain or business logic SHOULD be treated as a potential architectural violation when the project separates presentation from domain logic.

---

# 4. PRESENTATIONAL COMPONENTS

Pure presentational components SHOULD:

- receive explicit inputs
- render predictable output
- expose explicit interaction callbacks
- avoid side effects
- avoid hidden external dependencies
- avoid owning domain state

Prefer declarative props and clear contracts.

A presentational component SHOULD NOT secretly fetch data, mutate shared state, or perform unrelated application orchestration.

---

# 5. CONTAINER COMPONENTS

Containers MAY coordinate:

- hooks
- state subscriptions
- external interfaces
- view-model preparation
- user interaction dispatch

Containers SHOULD remain focused on orchestration.

Do NOT allow container components to become God Components containing:

- business rules
- complex transformations
- unrelated state
- extensive rendering logic
- infrastructure concerns

Complex transformations SHOULD be separated when they have an independent responsibility or require isolated testing.

---

# 6. FEATURE COMPONENTS

Feature-specific components MAY combine multiple reusable UI elements.

They SHOULD remain specific to their feature.

Do NOT move feature behavior into shared UI merely because it is visually reusable.

Shared components should expose generic UI behavior rather than feature-specific semantics.

---

# 7. COMPOSITION

Prefer composition over inheritance.

Composition SHOULD be used to combine:

- layout
- controls
- content
- states
- reusable behaviors

Composite components are appropriate when they represent a meaningful reusable UI composition.

Avoid composite abstractions that merely hide several unrelated components behind another layer.

---

# 8. DECOMPOSITION

Consider decomposition when a component has:

- multiple responsibilities
- repeated internal logic
- complex conditional rendering
- difficult-to-test behavior
- excessive prop coordination
- unrelated state concerns
- deeply nested UI structures

Consider consolidation when several components:

- always change together
- have no independent responsibility
- only forward props
- create unnecessary abstraction

The goal is high cohesion and low unnecessary coupling.

---

# 9. HOOKS

Hooks SHOULD encapsulate a clear UI behavior or reusable reactive concern.

Review for:

- unnecessary hooks
- hooks with multiple unrelated responsibilities
- business logic hidden inside hooks
- unnecessary effects
- derived state implemented as stored state
- unstable dependencies
- missing cleanup
- hidden subscriptions
- excessive hook composition

A hook should make behavior clearer, not obscure where the behavior occurs.

---

# 10. UI STATE

Local state SHOULD represent UI state.

Examples include:

- open / closed
- selected tab
- temporary input
- focus state
- local interaction state
- visual expansion state

Do NOT duplicate external or domain state locally without a clear reason.

Avoid synchronization patterns in which one state exists only to mirror another.

---

# 11. VIEW MODELS AND DATA TRANSFORMATION

UI SHOULD consume data in a form appropriate for presentation.

Complex transformations from external or domain structures into UI structures SHOULD be isolated from rendering when this improves:

- readability
- testability
- reuse
- separation of concerns

Presentation transformations SHOULD remain free of business rules unless the project explicitly defines otherwise.

---

# 12. REUSABILITY

A reusable UI component SHOULD represent a genuinely reusable responsibility.

Good candidates include:

- controls
- layout primitives
- feedback components
- overlays
- common interaction patterns
- generic data presentation

Avoid generic components that exist only because two feature components currently look similar.

Do NOT introduce extensive configurability before multiple real use cases require it.

---

# 13. DESIGN SYSTEM

Review whether the UI consistently uses the project's established design system.

Look for:

- duplicated controls
- duplicated interaction patterns
- inconsistent component behavior
- feature components recreating shared primitives
- unnecessary one-off styling
- inconsistent spacing or sizing
- multiple implementations of the same UI concept

Prefer extending an existing generic component when the responsibility is genuinely shared.

Do NOT duplicate a design-system primitive inside a feature without a concrete reason.

---

# 14. PROPS AND COMPONENT CONTRACTS

Component APIs SHOULD be:

- explicit
- minimal
- predictable
- semantically meaningful

Review for:

- excessive prop counts
- boolean-prop explosion
- deeply nested configuration objects
- prop drilling caused by poor boundaries
- overly generic callback signatures
- props exposing internal implementation details

Prefer composition over increasingly complex configuration when it makes the contract clearer.

---

# 15. RENDERING LOGIC

Rendering code SHOULD remain declarative and readable.

Review for:

- large conditional trees
- deeply nested JSX
- repeated markup
- complex calculations during render
- side effects during render
- mixing data preparation with large rendering blocks

Extract logic when it creates a meaningful conceptual boundary.

Do NOT extract every expression into a helper merely to reduce visual size.

---

# 16. REACTIVE PERFORMANCE

Review performance where the UI is sensitive to frequent updates or large amounts of data.

Look for:

- unnecessary re-renders
- unstable references
- repeated expensive calculations
- unnecessary subscriptions
- rendering large collections without appropriate strategy
- excessive state propagation

Memoization SHOULD be introduced only when it addresses a meaningful rendering cost or stability problem.

Do NOT use `memo`, callbacks, or derived caching mechanically.

---

# 17. USER STATES

UI review SHOULD consider all meaningful states, including:

- normal
- loading
- empty
- error
- disabled
- unavailable
- partially populated
- long or unexpected content

Missing states SHOULD be reported when they can create broken or ambiguous user experiences.

---

# 18. ACCESSIBILITY

Review accessibility as part of UI correctness.

Consider:

- keyboard navigation
- focus management
- semantic elements
- accessible names
- appropriate ARIA usage
- visible interaction state
- error communication
- non-color-only meaning

Do NOT treat accessibility as a cosmetic enhancement.

Follow the project's specific accessibility requirements where defined.

---

# 19. UI TESTING

UI tests SHOULD focus on user-visible behavior and important contracts.

Prioritize:

- meaningful interactions
- state transitions
- keyboard behavior
- important conditional rendering
- error handling
- critical user flows

Avoid excessive testing of:

- implementation details
- trivial markup
- framework internals
- styling that has no behavioral significance

Pure presentation MAY require little or no testing when it contains no meaningful behavior.

---

# 20. NAMING AND READABILITY

Names SHOULD communicate UI responsibility and intent.

Review for:

- misleading component names
- generic names with unclear meaning
- inconsistent terminology
- names that describe implementation instead of behavior
- unclear event and callback names
- component names that imply responsibilities they do not own

Prefer readable composition over comments explaining unclear component structure.

---

# 21. UI CODE SMELLS

Pay particular attention to:

- God Components
- prop drilling caused by poor boundaries
- boolean-prop explosion
- duplicated controls
- duplicated styling logic
- unnecessary wrapper components
- hidden side effects
- business logic in hooks
- business logic in components
- excessive conditional rendering
- premature generic components
- feature-specific logic inside shared UI
- multiple sources of UI truth

These are signals for investigation, not automatic defects.

---

# 22. UI ARCHITECTURE VIOLATIONS

When project architecture separates UI from other layers, explicitly check for:

- domain leakage
- business-rule leakage
- runtime or infrastructure leakage
- direct access to lower-level implementation details
- UI-owned external state that should belong elsewhere
- bypassed communication boundaries

A UI component can be visually correct and still be architecturally incorrect.

---

# 23. REVIEW SCOPE

Review only the requested UI scope unless inspecting another module is necessary to establish:

- a dependency
- a contract
- a state-flow problem
- an architectural violation

Do NOT turn a UI review into an unrelated application-wide refactor.

---

# 24. FINDING QUALITY

UI findings SHOULD distinguish between:

- actual defects
- architectural violations
- maintainability problems
- consistency problems
- opportunities for reuse
- optional improvements

Do NOT present subjective visual preferences as defects.

For significant findings provide:

- location
- problem
- evidence
- impact
- severity
- recommended refactoring direction

Do NOT implement the recommendation during review.

---

# 25. UI REVIEW STANDARD

A high-quality UI review should establish:

- whether responsibilities are correctly separated
- whether components are appropriately decomposed
- whether reusable UI is genuinely reusable
- whether shared design-system elements are used correctly
- whether hooks have clear responsibilities
- whether state has a correct owner
- whether rendering remains understandable and performant
- whether important UI states are handled
- whether accessibility requirements are respected
- whether tests protect meaningful behavior

The objective is NOT to maximize component reuse or minimize component count.

The objective is to produce a UI that is **clear, cohesive, predictable, maintainable, accessible, and appropriately reusable without unnecessary abstraction**.
