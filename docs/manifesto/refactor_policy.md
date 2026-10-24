---
trigger: model_decision
description: When it's refactoring code
---

# Refactoring Policy

## 0. PURPOSE

This document defines general rules for AI-assisted refactoring.

It governs:

- refactoring analysis
- refactoring planning
- phased implementation
- validation
- regression prevention
- scope control

This policy is project-agnostic.

Project-specific `AGENT.md` and specialized rule files remain authoritative for architecture, technology, domain behavior, testing requirements, and implementation conventions.

---

## 1. SOURCE OF TRUTH

A refactoring plan MUST be based on:

1. the existing codebase
2. the Code Review findings
3. project-specific architecture rules
4. applicable specialized rules
5. explicit user requirements

Do NOT invent requirements that are not supported by these sources.

Do NOT treat personal preference as a refactoring requirement.

---

## 2. ANALYSIS BEFORE IMPLEMENTATION

Non-trivial refactoring MUST follow:

**ANALYSIS → PLAN → IMPLEMENTATION → VALIDATION**

Do NOT begin implementation before the affected responsibilities, dependencies, risks, and expected behavior are understood.

The analysis SHOULD establish:

- current structure
- current responsibilities
- current dependencies
- current behavior
- architectural constraints
- affected areas
- risks
- invariants that must remain intact

---

## 3. CODE REVIEW IS THE PRIMARY INPUT

When a Code Review exists, the refactoring plan MUST use its findings as the primary source of work.

Every planned change SHOULD map to one or more identified problems.

Do NOT add unrelated cleanup simply because it is visible during implementation.

A finding that does not require a code change MAY remain documented without being included in the refactor.

---

## 4. ROOT CAUSE OVER SYMPTOMS

Refactoring SHOULD address root causes rather than repeatedly fixing symptoms.

When multiple findings originate from the same structural problem:

- group them
- identify the common cause
- design one coherent correction

Do NOT create separate refactoring tasks for every superficial symptom when one architectural change addresses all of them.

---

## 5. MINIMAL EFFECTIVE CHANGE

Use the smallest change that correctly resolves the identified problem.

Prefer:

- local improvements
- focused extraction
- clear responsibility boundaries
- removal of unnecessary code
- simplification

Avoid:

- speculative redesign
- broad rewrites
- unrelated migrations
- replacing working systems without a demonstrated need
- introducing new abstractions without a concrete benefit

The goal is improvement, not change for its own sake.

---

## 6. BEHAVIOR PRESERVATION

Unless an explicit behavior change is required, refactoring MUST preserve existing behavior.

Before changing structure, identify:

- externally visible behavior
- public contracts
- important state transitions
- integrations
- persistence behavior
- error behavior
- user-visible behavior
- performance constraints

A refactor is unsuccessful if structural quality improves while required behavior regresses.

---

## 7. PHASED IMPLEMENTATION

Non-trivial refactors MUST be divided into phases.

Each phase MUST:

- have one clear objective
- have a defined scope
- be independently understandable
- leave the system in a valid state
- be testable
- be verifiable
- avoid dependency on unfinished future phases

Do NOT create phases that intentionally leave the codebase broken.

---

## 8. PHASE ORDER

Whenever practical, prefer this dependency order:

1. establish or adjust contracts and data structures
2. move or isolate responsibilities
3. refactor internal implementation
4. update integrations
5. remove obsolete code
6. validate the result

Do NOT choose an order that requires a later phase to make an earlier phase functional.

When project-specific architecture defines another safe order, follow the project rules.

---

## 9. SUBPHASES

Each phase SHOULD be divided into small sequential subphases when the work is complex.

A subphase MUST be:

- specific
- unambiguous
- limited in scope
- independently understandable
- executable without guessing

Each subphase SHOULD describe:

- what changes
- where it changes
- why it changes
- what must remain unchanged
- how success is verified

Avoid vague instructions such as:

- "clean up the architecture"
- "improve the components"
- "make the code better"

Prefer concrete actions with observable outcomes.

---

## 10. PHASE ACCEPTANCE

Each phase MUST end with validation.

Where a human review gate is part of the workflow:

**Implementation → Validation → Human Review → Approval → Next Phase**

The next phase MUST NOT begin before the current phase has been accepted.

If the current phase is rejected:

- address the requested changes
- revalidate the phase
- obtain acceptance again

Do NOT continue to later phases while an earlier phase has unresolved review feedback.

---

## 11. WORKING STATE AT EVERY PHASE

The codebase SHOULD remain:

- buildable
- type-safe
- runnable
- testable
- internally consistent

A phase MUST NOT intentionally introduce:

- dead code paths
- broken contracts
- unfinished dependencies
- duplicate active implementations without justification
- disabled functionality merely to simplify the refactor

Temporary adapters MAY be used when they reduce migration risk and are explicitly tracked for removal.

---

## 12. RISK MANAGEMENT

The refactoring plan MUST identify high-risk areas.

Consider:

- public interfaces
- state ownership
- dependency boundaries
- persistence
- concurrency
- lifecycle management
- external integrations
- rendering or performance-sensitive paths
- user-visible behavior
- shared abstractions

Prefer an order that reduces blast radius.

High-risk changes SHOULD be isolated from unrelated modifications.

---

## 13. REGRESSION CONTROL

For each meaningful change, determine how regression will be detected.

Use appropriate validation such as:

- existing tests
- new targeted tests
- type checking
- linting
- integration checks
- architecture checks
- build validation
- runtime verification
- manual verification where appropriate

Do NOT rely solely on compilation.

---

## 14. TESTING DURING REFACTORING

Preserve existing tests unless they are demonstrably obsolete.

Add or modify tests when the refactor changes:

- responsibility boundaries
- behavior contracts
- state transitions
- transformations
- important interactions
- failure handling

Tests SHOULD protect behavior rather than implementation details.

Do NOT rewrite a large test suite merely because internal structure changed if the existing tests still provide meaningful behavioral coverage.

---

## 15. SAFE EXTRACTION

When extracting a responsibility:

1. identify the complete responsibility boundary
2. identify its inputs and outputs
3. identify side effects
4. identify dependencies
5. preserve the existing contract
6. move the responsibility
7. update consumers
8. remove the obsolete implementation
9. validate behavior

Avoid extracting incomplete fragments that leave the original responsibility split across multiple places.

---

## 16. SAFE CONSOLIDATION

When merging duplicated or fragmented implementations:

- verify that the behavior is genuinely shared
- identify meaningful differences
- preserve required variations
- avoid creating a lowest-common-denominator abstraction

Do NOT merge code merely because it looks similar.

The resulting abstraction MUST remain understandable and appropriately scoped.

---

## 17. SAFE REMOVAL

Code SHOULD be removed only after confirming that it is:

- unused
- obsolete
- replaced
- unreachable
- explicitly deprecated by the architecture

Before removal, check relevant references and dependencies.

Do NOT retain obsolete compatibility code indefinitely without a reason.

---

## 18. ABSTRACTION CONTROL

Refactoring MUST NOT become an excuse for introducing unnecessary abstraction.

Before creating an interface, generic component, adapter, factory, service, hook, utility, or pattern, establish:

- the concrete problem
- the current duplication or coupling
- the expected benefit
- why a simpler alternative is insufficient

Prefer no abstraction over an abstraction with negative complexity.

---

## 19. NO MIXING UNRELATED REFACTORS

A refactor SHOULD have a coherent objective.

Do NOT combine unrelated changes such as:

- architecture migration
- visual redesign
- dependency upgrades
- unrelated bug fixes
- broad naming changes
- formatting migrations

unless they are technically inseparable.

Unrelated improvements SHOULD be recorded separately.

---

## 20. FILE AND FOLDER CHANGES

Moving files or changing folder structure is justified only when it improves:

- responsibility boundaries
- dependency direction
- discoverability
- ownership
- cohesion

Do NOT reorganize directories purely for aesthetics.

When moving code, preserve behavior and update all affected references systematically.

---

## 21. COMMENTS AND DOCUMENTATION

Refactoring SHOULD improve code clarity rather than compensate for unclear code with comments.

Prefer:

- better names
- smaller responsibilities
- simpler control flow
- clearer contracts

Add documentation only when the resulting design has a non-obvious public contract, invariant, or architectural constraint.

Follow the project's documentation rules.

---

## 22. NO COMMIT CREATION

Do NOT create commits during an AI-assisted refactoring workflow unless explicitly requested.

Commit boundaries MUST NOT replace:

- implementation phases
- validation
- human review
- architectural checkpoints

The human reviewer retains control over acceptance and version history.

---

## 23. IMPLEMENTATION DISCIPLINE

During implementation:

- modify only the agreed scope
- preserve established conventions
- follow project-specific architecture
- avoid opportunistic cleanup
- avoid speculative improvements
- keep changes internally consistent

When discovering a new issue outside the current scope:

- do not silently expand the task
- record it separately
- continue only when it is necessary for the current refactor

---

## 24. VALIDATION AFTER IMPLEMENTATION

Every phase MUST be validated against its intended outcome.

Validation SHOULD include, where applicable:

- type checking
- linting
- unit tests
- integration tests
- architecture checks
- build
- runtime behavior
- accessibility
- performance
- relevant project-specific validators

Validation SHOULD test both:

**what changed** and **what must not have changed**.

---

## 25. REFACTORING COMPLETION

A refactoring is complete only when:

- identified problems are resolved
- intended architecture is respected
- behavior is preserved unless explicitly changed
- obsolete code is removed
- tests remain meaningful
- validation passes
- no known broken intermediate state remains
- the resulting design is simpler or more maintainable than before

A refactor is NOT complete merely because the code compiles.

---

## 26. FINAL REFACTORING STANDARD

A good refactor should result in:

- clearer responsibilities
- lower unnecessary coupling
- simpler control flow
- stronger contracts
- easier testing
- improved maintainability
- preserved correctness

The objective is not maximum abstraction or maximum restructuring.

The objective is the **smallest safe sequence of changes that materially improves the design while preserving required behavior**.
