---
trigger: model_decision
description: When designing, authoring, refactoring, or running automated tests (unit AAA, integration BDT, architecture AST rules, or smoke performance tests) in src/tests/
---

# Testing Standards (Unit, Integration & Architecture)

The single source of truth for test structure, naming, isolation, and assertion discipline in **Vibrant Castle**.

---

## 0. PURPOSE & BOUNDARIES

1. Governs all automated test suites executed by Bun: unit tests, integration tests, and AST architecture tests in `src/tests/`.
2. Enforces structural separation between AAA (unit) and BDT (integration) paradigms.
3. Architecture tests in `src/tests/arch/` are non-negotiable gates that protect layer boundaries and data purity.

---

## 1. TEST TIERS & HARD INVARIANTS

| Tier | File Pattern | Target | Paradigm | Allowed Side-Effects |
| :--- | :--- | :--- | :--- | :--- |
| **Unit** | `src/**/__tests__/*.unit.test.ts` | Vector math, AABB intersections, damage formulas, state mappers, atlas slicing. | **AAA** | **None.** Pure in-memory logic. Zero Canvas API, zero DOM, zero mock timers. |
| **Integration** | `src/**/__tests__/*.integration.test.ts` | Engine $\rightarrow$ Context $\rightarrow$ UI data flow, GameEventBus listeners, composite panels. | **BDT** | Mock Context providers, event bus subscribers, memory repositories. |
| **Architecture** | `src/tests/arch/*.test.ts` | AST source scanning, boundary violations, circular cycles, data purity, design system rules. | **Rule Assertions** | Read-only file system traversal and TypeScript AST inspection. |
| **Smoke / Perf** | `src/tests/smoke/`, CI smoke | Game boot, loop initialization, zero GC allocations in render. | Minimal | Canvas mock / headless initialization. |

### Hard Invariants
- ❌ **FORBIDDEN: Mixing AAA and BDT Paradigms**: Never place `// Arrange` markers in integration tests, and never place `// Given` markers in unit tests. Never combine them (`// Given (Arrange)`).
- ❌ **FORBIDDEN: Vague Test Names**: Generic names like `it('works')`, `it('renders properly')`, or snake_case titles are forbidden. Unit tests MUST follow `it('should <expected outcome> when <action or condition>')`.
- ❌ **FORBIDDEN: Canvas 2D or DOM in Engine Unit Tests**: Simulation math, collision physics, and combat formulas must be verified purely as mathematical functions without instantiating canvas contexts.
- ❌ **FORBIDDEN: Modifying or Weakening Architecture Tests**: Disabling, deleting, or skipping tests in `src/tests/arch/` to pass a build is strictly forbidden.
- ✅ **REQUIRED: Triple Decoupling**:
  1. *From Localization*: Never assert translated copy (e.g. `expect(el.text()).toBe('Wznów')`). Assert semantic keys, roles, or `data-testid`.
  2. *From Theming & CSS*: Never assert hex color codes, theme variant names, or arbitrary CSS classes.
  3. *From Native Runtimes*: Unit tests run purely in Bun without browser window dependencies.
- ✅ **REQUIRED: Test Data Builders**: Complex game models (monsters, items, blueprints) must be created via builders (`MonsterBuilder`, `LocationBuilder`) with realistic defaults, overriding only fields relevant to the specific test scenario.

---

## 2. UNIT TESTS (AAA PARADIGM)

Unit tests verify isolated algorithms, pure functions, and stateless mappers.

```ts
describe('CombatSystem - Damage Mitigation', () => {
  it('should reduce physical damage by armor percentage when entity is guarded', () => {
    // Arrange
    const defender = aCombatant({ armor: 25, isGuarding: true });
    const attack = anAttack({ rawDamage: 100, type: DamageType.PHYSICAL });

    // Act
    const resolvedDamage = CombatSystem.calculateMitigatedDamage(attack, defender);

    // Assert
    expect(resolvedDamage).toBe(75);
  });
});
```

- Section markers are strictly: `// Arrange`, `// Act`, `// Assert`.
- Exactly **one** Arrange-Act-Assert cycle per test function. If a scenario needs a second Act, split it into another test.

---

## 3. INTEGRATION TESTS (BDT PARADIGM)

Integration tests verify the contract between Engine snapshots, GameEventBus dispatch, Context ports, and UI overlays.

```ts
describe('Given an active player in combat', () => {
  describe('When the player receives fatal damage', () => {
    it('Then it should emit PLAYER_DIED event and notify GameEngineContext', async () => {
      // Given
      const { engine, contextHarness } = setupEngineTestHarness();
      const deathListener = mock();
      engine.eventBus.on('PLAYER_DIED', deathListener);

      // When
      engine.applyDamageToPlayer(9999);
      engine.tick(16.666);

      // Then
      expect(deathListener).toHaveBeenCalledTimes(1);
      expect(contextHarness.isGameOver).toBe(true);
    });
  });
});
```

- Section markers are strictly: `// Given`, `// When`, `// Then`.
- Structure uses nested `describe` blocks capturing context and action.

---

## 4. ARCHITECTURE TESTS (`src/tests/arch/`)

Architecture tests act as executable linters guarding the codebase:

| Spec File | Invariant Enforced |
| :--- | :--- |
| `architectureBoundaries.test.ts` | Enforces directional layer boundaries (Engine $\rightarrow$ Data, Context $\rightarrow$ Engine, UI $\rightarrow$ Context). |
| `layerLeakage.test.ts` | Guarantees UI components never instantiate engine singletons or import physics directly. |
| `circularDependencies.test.ts` | Scans the full module graph to ensure zero circular dependency cycles. |
| `dataPurity.test.ts` | Guarantees `src/data/` contains only declarative JSON and `index.ts` (zero binary assets, zero logic). |
| `dataIntegrity.test.ts` | Validates spell progressions, item IDs, unique atlas entries, and dialogue graphs. |
| `designSystemBoundaries.test.ts` | Prohibits native HTML tags (`<button>`, `<input>`) outside `@ui` and bans hardcoded hex colors in JSX. |
| `locationBlueprints.test.ts` | Verifies room portals, spawn points, monster templates, and parallax bounding boxes. |
| `assetIntegrity.test.ts` | Validates atlas manifests, non-empty textures on disk, and MetaParser geometries. |
| `i18nParity.test.ts` | Enforces 100% dictionary key parity across English and Polish. |

---

## 5. ENFORCEMENT & COMMANDS

| Command | Target | Expected Result |
| :--- | :--- | :--- |
| `bun test:unit` | Fast isolated unit tests | All unit tests pass in < 2 seconds |
| `bun test:integration` | Context and composite integration suites | All integration flows pass |
| `bun test:arch` | Full AST architecture and contract suite | 83/83 checks pass with zero violations |
| `bun test` | Complete test suite execution | Full green suite |
