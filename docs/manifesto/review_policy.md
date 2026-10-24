---
trigger: always_on
---

# Review Policy

## 0. PURPOSE

This document defines general rules for AI-assisted Code Review.

It is project-agnostic and MUST NOT contain:

- project-specific architecture
- domain-specific rules
- project-specific folder structure
- technology-specific business rules
- implementation details belonging to project rules

Project-specific `AGENT.md` and specialized rule files remain authoritative for their respective areas.

---

## 1. RULE HIERARCHY

When reviewing code, apply rules in this order:

1. Project-specific `AGENT.md`
2. Specialized rules for the reviewed area
3. This review policy
4. General engineering principles

Higher-priority rules take precedence.

If applicable rules conflict, identify the conflict explicitly. Do NOT resolve it by guessing.

---

## 2. REVIEW IS EVIDENCE-BASED

Every significant finding MUST be supported by evidence from the codebase.

A finding SHOULD identify:

- location
- concrete problem
- evidence
- impact
- severity

Do NOT report issues based only on personal preference, style preference, or theoretical possibility.

Do NOT assume an abstraction is incorrect merely because it is unfamiliar.

---

## 3. ARCHITECTURE FIRST

Review architectural correctness before local code quality.

Evaluate:

- responsibility boundaries
- module boundaries
- dependency direction
- coupling
- cohesion
- state ownership
- communication contracts
- architectural violations
- leakage between layers

A locally elegant implementation is still incorrect when it violates the defined architecture.

---

## 4. RESPONSIBILITY BOUNDARIES

Every module, class, function, hook, and component SHOULD have a clear primary responsibility.

Look for:

- multiple unrelated responsibilities
- business logic in inappropriate layers
- orchestration mixed with implementation
- data transformation mixed with side effects
- infrastructure concerns mixed with presentation
- duplicated responsibility
- unclear ownership

Recommend separation when it creates a meaningful boundary.

Do NOT split code merely to reduce file size.

---

## 5. DEPENDENCIES AND COUPLING

Review the direction and strength of dependencies.

Look for:

- dependencies crossing forbidden boundaries
- unnecessary coupling
- circular dependencies
- direct dependency on implementation details
- bypassed abstraction boundaries
- duplicated communication paths
- hidden dependencies

Prefer explicit, narrow and stable contracts.

---

## 6. STATE OWNERSHIP

Important state MUST have a clear owner.

Determine:

- who owns the state
- who may modify it
- who may observe it
- how it flows through the system
- whether the state is unnecessarily duplicated

Look for:

- duplicated sources of truth
- mirrored state
- synchronization loops
- state copied without justification
- state stored in the wrong layer

Do not move state merely for stylistic reasons. Evaluate ownership and responsibility.

---

## 7. SOLID

Review the practical application of:

- **SRP** — one clear responsibility
- **OCP** — extension without unnecessary modification
- **LSP** — valid substitutability
- **ISP** — focused interfaces
- **DIP** — appropriate dependency direction

Report SOLID violations when they cause:

- excessive coupling
- poor cohesion
- fragile changes
- difficult testing
- unnecessary complexity

Do NOT apply SOLID mechanically.

---

## 8. KISS, YAGNI AND DRY

### KISS

Prefer the simplest solution that correctly solves the actual problem.

### YAGNI

Do not introduce abstractions, extension points, configuration mechanisms, or patterns without a current need.

### DRY

Remove duplicated knowledge and responsibility.

Not every repeated line is duplication.

Small repetition is acceptable when abstraction would increase complexity without meaningful benefit.

---

## 9. ABSTRACTION AND DESIGN PATTERNS

Design patterns are optional tools, not requirements.

Before recommending an abstraction, determine:

- what concrete problem it solves
- whether the problem occurs more than once
- whether the abstraction reduces complexity
- whether it improves cohesion or coupling
- whether a simpler design would work

Avoid:

- speculative abstractions
- unnecessary interfaces
- abstraction for abstraction's sake
- excessive indirection
- patterns applied only because they are available

Existing patterns SHOULD be reviewed for correctness and appropriate scope.

---

## 10. DECOMPOSITION

Evaluate decomposition in both directions.

A unit may be:

- too large
- too small
- too fragmented
- too deeply nested
- artificially abstracted

Consider:

- cohesion
- coupling
- readability
- reuse
- testability
- change frequency
- responsibility

Prefer meaningful boundaries over arbitrary file or function splitting.

---

## 11. REUSABILITY

Promote reuse only when there is a genuine shared responsibility or contract.

Distinguish between:

- real reusable abstractions
- feature-specific code
- accidental duplication
- premature generalization

Do NOT generalize code solely because two implementations currently look similar.

Prefer abstractions based on stable shared behavior.

---

## 12. TYPES AND CONTRACTS

Type safety is part of design quality.

Review for:

- weak or ambiguous contracts
- unsafe casts
- broad types
- duplicated type definitions
- inconsistent models
- unclear nullable states
- invalid state combinations
- loss of type information

Prefer:

- precise types
- narrow interfaces
- explicit contracts
- immutable data where appropriate
- discriminated unions where appropriate
- safe handling of unknown data

Follow project-specific typing rules when they exist.

---

## 13. SIDE EFFECTS

Side effects SHOULD be explicit, controlled and located at appropriate boundaries.

Look for:

- hidden side effects
- side effects during pure computation or rendering
- uncontrolled subscriptions
- missing cleanup
- duplicated effects
- unnecessary effects
- lifecycle logic mixed with unrelated responsibilities

Each side effect SHOULD have a clear:

- trigger
- owner
- lifecycle
- cleanup strategy

---

## 14. ERROR HANDLING

Error handling SHOULD be explicit and diagnosable.

Review for:

- swallowed errors
- empty error handlers
- silent failures
- inconsistent error handling
- loss of useful context
- incorrect error boundaries
- missing fallback behavior

Use the project's defined error-handling model when one exists.

Do NOT impose a generic error-handling architecture over a project that already defines one.

---

## 15. TESTING

Testing SHOULD be driven by behavior, risk and responsibility.

Prioritize tests for:

- business logic
- state transitions
- transformations
- contracts
- important interactions
- integration boundaries
- edge cases
- failure scenarios

Do NOT create tests solely to increase coverage.

Avoid tests that:

- duplicate implementation details
- provide no meaningful protection
- are unnecessarily brittle
- over-mock internal behavior

Consider:

- happy path
- edge cases
- failure scenarios

Follow specialized testing rules when available.

---

## 16. PERFORMANCE

Review performance when it is relevant to the actual workload or architecture.

Look for:

- unnecessary recomputation
- excessive rendering
- unnecessary allocations
- expensive operations in hot paths
- excessive subscriptions
- large collection processing
- repeated I/O
- inappropriate caching or memoization

Do NOT recommend optimization without evidence, a defined requirement, or a clear architectural risk.

Avoid speculative micro-optimization.

---

## 17. READABILITY AND NAMING

Code SHOULD be self-descriptive.

Review for:

- misleading names
- ambiguous names
- overly generic names
- inconsistent conventions
- names describing implementation instead of responsibility
- unnecessary indirection

Prefer clear code over explanatory comments.

---

## 18. COMMENTS AND DOCUMENTATION

Comments SHOULD explain information that is not obvious from the code.

Useful comments explain:

- why an unusual decision exists
- non-obvious constraints
- important invariants
- architectural reasoning

Avoid:

- comments repeating the code
- obvious comments
- redundant documentation
- decorative or noisy comments

Follow project-specific documentation conventions.

---

## 19. SCOPE CONTROL

Stay within the requested review scope.

Inspect code outside the requested path only when necessary to understand:

- a dependency
- a contract
- an architectural violation
- a reported behavior

Do NOT silently expand the review into unrelated technical debt.

Unrelated findings SHOULD remain separate from the main refactoring scope.

---

## 20. NO SPECULATIVE FINDINGS

Do NOT report a problem solely because:

- another architecture could be used
- another design pattern is possible
- the code might need future extension
- a file could theoretically be smaller
- a different library could be used

A recommendation SHOULD answer:

**What concrete problem does this solve?**

---

## 21. CODE REVIEW IS ANALYTICAL

During Code Review:

- inspect
- analyze
- diagnose
- prioritize
- explain impact

Do NOT implement fixes unless explicitly requested.

Do NOT silently rewrite code.

Do NOT mix implementation decisions into findings.

A review MAY state that code should be:

- extracted
- merged
- removed
- generalized
- moved
- redesigned

but implementation belongs to a separate refactoring task or plan.

---

## 22. REFACTORING INPUT

A good review should provide actionable input for refactoring.

For each important issue, establish:

**problem → evidence → root cause → impact → priority**

Prefer root causes over symptoms.

Multiple symptoms caused by the same architectural problem **should** be grouped when appropriate.

Avoid producing a long list of low-value findings when several issues have one common cause.

---

## 23. PRIORITIZATION

Severity MUST reflect impact, not implementation effort.

### 🔴 Critical

Examples:

- architecture violations
- broken layer boundaries
- incorrect state ownership
- broken contracts
- correctness defects
- severe security or data-integrity risks

### 🟡 Medium

Examples:

- poor decomposition
- unnecessary coupling
- significant duplication
- excessive abstraction
- maintainability problems
- important missing tests

### 🟢 Low

Examples:

- naming inconsistencies
- minor readability issues
- cosmetic cleanup
- low-impact style issues

Do NOT classify an issue as critical merely because it is undesirable.

---

## 24. REFACTORING MUST BE MINIMAL AND SAFE

Recommended changes SHOULD solve the identified problem with the smallest reasonable architectural change.

Avoid:

- unrelated cleanup
- speculative redesign
- unnecessary migrations
- broad convention changes
- unrelated dependency changes

Preserve existing behavior unless a behavior change is explicitly required.

When planning non-trivial changes, follow the project's defined change-management process.

---

## 25. FINAL REVIEW QUALITY

A high-quality review is:

- evidence-based
- architecture-aware
- technically precise
- focused on root causes
- risk-aware
- actionable
- proportional to the actual problem
- free from speculative work

The objective is NOT to maximize the number of findings.

The objective is to identify the **smallest set of meaningful problems and changes that materially improve correctness, architecture, maintainability, testability, and long-term sustainability**.
