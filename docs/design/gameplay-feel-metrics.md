# Gameplay Feel Metrics (VC-085)

Measured at the fixed 60 Hz simulation step (`dtMultiplier = 1.0`, 16.667 ms/tick) in `courtyard` using [`gameplayFeel.integration.test.ts`](../../src/tests/integration/engine/gameplayFeel.integration.test.ts).

## Movement & Jump Feel

| Metric | Measured | Target | Status / Gap |
| :--- | :--- | :--- | :--- |
| Tap jump apex height (1-tick press) | 45.05 px | > 0 px | On target |
| Hold jump apex height (20-tick hold) | 132.93 px | >= 1.5x tap | On target |
| Hold / Tap jump ratio | 2.95x | >= 1.50x | On target |
| Tap jump air time | 29 ticks (483.3 ms) | > 0 | On target |
| Hold jump air time | 51 ticks (850.0 ms) | > tap | On target |
| Run-jump horizontal distance | 259.20 px | > 0 px | On target |
| Ticks to top speed (`4.8 px/tick`) | 7 ticks (116.7 ms) | Responsive | On target (`groundAcceleration = 0.75`) |
| Coyote time window | 6 ticks (100.0 ms) | 80–120 ms | On target (`maxCoyoteFrames = 6`) |
| Jump buffer window | 6 ticks (100.0 ms) | 100–150 ms | At lower bound (`maxJumpBufferFrames = 6`) |
| Mid-air direction reversal (`+4.8` to `< 0`) | 9 ticks (150.0 ms) | Responsive | On target (`airAcceleration = 0.55`) |

## Combat & Damage Feel

| Mechanic | Current Behavior | Target | Gap |
| :--- | :--- | :--- | :--- |
| Melee attack vs enemy | Reduces enemy HP by `stats.totalAttack` and sets `enemy.damageTimer = 15` | Reduces HP + hit feedback | Implemented |
| Enemy death | Sets `enemy.isDead = true`, awards score (+150) & skill point (+1) | Death state + rewards | Implemented |
| Hazard hit knockback | Applies `vx = ±6`, `vy = -5` and deals 20 HP damage | Knockback + damage | Implemented in `HazardCollisionStrategy` |
| Player i-frames on hit | Not implemented (`Player` has no `damageTimer` / invulnerability window) | Invulnerability window after hit | **Gap**: repeated hazard overlap damages every tick |
| Enemy contact damage | Not implemented (`EnemyAISystem` only updates patrol movement) | Enemy contact / attack deals HP damage + knockback | **Gap**: enemies do not damage the player |

## Traversal Smoke

Every location JSON in `src/data/locations/*.json` (8 locations) is stepped for 600 ticks (10 s at 60 Hz) with scripted rightward movement and periodic jumps under `debugManager.state.godMode = true` (damage off), verifying zero `NaN` values, zero out-of-bounds falls, and zero exceptions.
