---
trigger: always_on
---

# Code Cleanliness & Commenting Standards

Rules for code quality, architectural comments, error handling, and formatting in **Vibrant Castle**.

---

## 0. PURPOSE & BOUNDARIES

1. This document defines the non-negotiable coding and commenting standards across all TypeScript and React source code in `src/`.
2. It governs self-documenting code, legitimate commenting patterns, strict error hierarchies (`GameBaseError`), and the elimination of architectural noise.
3. Adherence is verified during the mandatory `Subphase X.Review` of every implementation phase.

---

## 1. HARD INVARIANTS

- ❌ **FORBIDDEN: `new Error(...)` in production code**: Throwing generic JavaScript errors is strictly forbidden. All domain, simulation, asset, and context errors MUST instantiate a structured domain class inheriting from `GameBaseError` (`src/lib/errors/GameBaseError.ts`).
- ❌ **FORBIDDEN: Declarative Compliance & Buzzwords**: Never write comments asserting design patterns or standards (*"adhering to SRP/OCP"*, *"implements Clean Architecture"*, *"Bastion-like combat implementation"*). Architectural quality must be self-evident from the code itself.
- ❌ **FORBIDDEN: Comments Justifying Architectural Smells**: Never use comments to paper over Single Responsibility Principle (SRP) or boundary violations. If a file or class does multiple distinct jobs, **do not write the comment — decompose the file**.
- ❌ **FORBIDDEN: Tautological Paraphrasing & Name Echoing**: Never repeat or paraphrase the name of a function, variable, or class in a comment.
- ❌ **FORBIDDEN: Visual Dividers & ASCII Banners**: Decorative dividers (`================`, `----------------`, `////////////////`) are forbidden. Structure code using small cohesive modules and clean single blank lines.
- ❌ **FORBIDDEN: Dead Code & Commit Metadata**: Commented-out code, author tags, and date stamps are prohibited. Version control (git) is the authoritative history.
- ❌ **FORBIDDEN: Deep Nesting (Rule of 3 Ifs)**: Maximum allowable nested condition depth is 2 ($\le 2$). Use early return guard clauses or extract helper methods.
- ❌ **FORBIDDEN: `any` and compiler suppression**: `strict` TypeScript mode is required. `any` is forbidden; use `unknown` with type guards. Never use `@ts-ignore` or `@ts-expect-error`.
- ❌ **FORBIDDEN: Empty `catch` blocks & fake error handling**: Never write empty `catch` blocks or use `try/catch` with dummy comments (`// ignore error`, `// silence linter`) to paper over unverified property accesses or swallow exceptions. Use idiomatic language guards (`typeof`, `in`, optional chaining `?.`, type guards) instead of `try/catch` for feature detection. When catching real exceptions, handle them explicitly, log them via `Logger`, or propagate via `Result<T, GameBaseError>`.
- ✅ **REQUIRED: Explain the "WHY", never the "WHAT" or "HOW"**: Clean code self-documents what it executes. Comments exist solely to document non-obvious intent: physics math trade-offs, delta time accumulation, sub-pixel rendering interpolation, or external library quirks.
- ✅ **REQUIRED: Technical English Only**: All comments, docstrings, error messages, and log entries must be in technical English.
- ✅ **REQUIRED: File Length Discipline (~300 LOC)**: Proactively decompose files that exceed ~300 lines of code or accumulate multiple distinct responsibilities.

---

## 2. ERROR HIERARCHY CONTRACTS (`GameBaseError`)

All runtime errors must provide strong typing with a unique string literal `code`, a clear `message`, and structured `details` metadata.

| Error Family | Location | Scope & Purpose |
| :--- | :--- | :--- |
| `GameBaseError` | `src/lib/errors/GameBaseError.ts` | Abstract root of all system errors; encapsulates code, message, and details. |
| `DomainError` / `GameplayError` | `src/lib/errors/DomainError.ts` | Simulation, combat resolution, cooldown, or state transition failures. |
| `AssetError` | `src/lib/errors/AssetError.ts` | Missing textures, atlas parsing geometry failures, invalid slicing presets. |
| `ParserError` | `src/lib/errors/ParserError.ts` | Malformed JSON blueprints, missing required location keys, corrupted schemas. |
| `PhysicsError` | `src/lib/errors/PhysicsError.ts` | AABB collision numerical overflow, invalid bounding box coordinates. |
| `MissingContextProviderError`| `src/lib/errors/ContextErrors.ts`| React hook invoked outside its mandatory Context provider. |

For fallible operations (parsing, asset discovery), prefer returning `Result<T, GameBaseError>` (`Ok(value)` / `Err(error)`) over throwing exceptions.

---

## 3. ANTI-PATTERNS VS PATTERNS (CONTRASTIVE EXAMPLES)

### 3.1. Declarative Buzzwords vs Clean Implementation
❌ **BAD:**
```ts
/**
 * Combat system controller.
 * Adheres to SRP by handling only damage calculations,
 * OCP by allowing custom attack modifiers,
 * and Clean Architecture by decoupling from React.
 */
export class CombatSystem { ... }
```
✅ **GOOD:**
```ts
/**
 * Resolves kinetic damage, elemental affinities, and poise reduction.
 */
export class CombatSystem { ... }
```

### 3.2. Tautology vs Non-Obvious Intent (The "WHY")
❌ **BAD:**
```ts
// Sets the player health
function setHealth(hp: number) { this.health = hp; }

// Loop through enemies
for (const enemy of enemies) { ... }
```
✅ **GOOD:**
```ts
// Clamp to zero to trigger death sequence on the next fixed simulation tick.
this.health = Math.max(0, hp);

// Render back-to-front within the same parallax tier to preserve sprite occlusion depth.
for (const entity of sortedEntities) { ... }
```

### 3.3. Generic `new Error` vs Structured Domain Error
❌ **BAD:**
```ts
if (!blueprint) {
  throw new Error(`Location ${id} not found!`);
}
```
✅ **GOOD:**
```ts
if (!blueprint) {
  throw new ParserError({
    code: 'LOCATION_BLUEPRINT_NOT_FOUND',
    message: `Location blueprint '${id}' could not be resolved from src/data/locations/`,
    details: { locationId: id, searchedPath: `src/data/locations/${id}.json` }
  });
}
```

### 3.4. Deep Nesting vs Guard Clauses
❌ **BAD:**
```ts
function processAttack(entity: Entity, target: Entity) {
  if (entity.isAlive) {
    if (entity.canAttack) {
      if (this.isInRange(entity, target)) {
        this.applyDamage(entity, target);
      }
    }
  }
}
```
✅ **GOOD:**
```ts
function processAttack(entity: Entity, target: Entity) {
  if (!entity.isAlive || !entity.canAttack) return;
  if (!this.isInRange(entity, target)) return;

  this.applyDamage(entity, target);
}
```

### 3.5. Procedural Step Narration
❌ **BAD:**
```ts
// Step 1: Clear canvas
ctx.clearRect(0, 0, width, height);
// Step 2: Render background
this.renderBackground(ctx);
// Step 3: Render entities
this.renderEntities(ctx);
```
✅ **GOOD:**
```ts
ctx.clearRect(0, 0, width, height);
this.renderBackground(ctx);
this.renderEntities(ctx);
```

### 3.6. Fake Catch Blocks vs Idiomatic Guards
❌ **BAD:**
```ts
try {
  // Check process env
  if (typeof process !== "undefined" && process.env) {
    if (process.env.NODE_ENV === "test") return "test";
  }
} catch {
  // Ignore error if process is unavailable
}
```
✅ **GOOD:**
```ts
if (typeof process !== "undefined" && process.env?.NODE_ENV === "test") {
  return "test";
}
```

---

## 4. ENFORCEMENT & VERIFICATION

Compliance is verified through automated architecture tests and static analysis:
- `bun lint` — Validates strict typing, no implicit types, and no unhandled compile warnings.
- `bun test src/tests/arch/architectureBoundaries.test.ts` — Enforces structural and error import boundaries.
- `Subphase X.Review` — Formal code audit enforcing comment cleanliness, no ASCII banners, and Rule of 3 Ifs.
