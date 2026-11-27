# Vibrant Castle: character system (VC-030)

Status: draft for owner approval. Nothing here is implemented yet. Code changes come after sign-off, in small PRs.

Anchored on: `src/game/characters/characterProfiles.ts` (flat `baseStats`), `src/game/logic/inventoryStats.ts` (`calculatePlayerDerivedStats`), `src/game/logic/magic.ts` (spell damage/cost), `src/game/engine/combatSystem.ts` (melee = `totalAttack`, no enemy defense), `src/game/physics/collisions.ts` (flat 20 hazard damage), `src/data/enemies/enemies.json`, `src/data/items/items.json`, `src/data/skills/*`, `src/data/progression/skill_trees.json`, baseline `8121dad:src/data/defaults/defaultPlayerStats.json`.

What exists today: fixed per-hero numbers, no level, no XP, +1 skill point per kill, defense is summed but never applied.

---

## 1. Attributes (fixed owner decisions)

| Attr | Role in this spec |
|---|---|
| STR | melee for STR weapons (default), small HP term |
| DEX | melee for finesse weapons (rapiers), stamina, attack speed, crit |
| CON | max HP, stamina, stamina regen, defense |
| INT | spell power for astral, frost and chrono magic, max MP |
| WIS | max MP, MP regen, mana cost, spell cooldowns |
| CHA | spell power for solar magic, soul drop chance |

- Values are stored as D20 x10 integers. 110 is D20 11 and 180 is D20 18. Any integer is valid (147).
- Level 1: no rolling. Average 151, so the sum is 906. Each attribute sits between 110 and 180. 180 is the starting maximum, not a cap.
- Approved level 1 values:

| Hero | STR | DEX | CON | INT | WIS | CHA | Default priority 1/2/3 |
|---|---|---|---|---|---|---|---|
| Valen (Sun Knight) | 151 | 166 | 156 | 136 | 146 | 151 | DEX / CON / CHA |
| Aurelia (Arcane Scholar) | 131 | 152 | 136 | 176 | 162 | 149 | INT / WIS / CON |

The default priorities are a proposal that fits the lore. The player can pick any 3 distinct attributes.

### Modifier

```
mod(A) = (A - 100) / 20        // float, never rounded
```

Why this formula: it is the D20 rule `(score - 10) / 2` carried into the x10 scale, made continuous. 180 gives +4 (like 18 in D20), 110 gives +0.5 and 151 gives +2.55. Every point matters, so 147 and 150 really differ. It is linear, so it cannot misbehave, and it goes negative only below 100, which only weak monsters reach. The formulas use `mod` and round only the final integer.

## 2. Level growth (deterministic)

Each level adds growth to every attribute, by priority:

| Priority | Rate per level | In tenths (integers in code) |
|---|---|---|
| 1 | +6 | 60 |
| 2 | +4 | 40 |
| 3 | +3 | 30 |
| other three | +1.5 (alternating +1 / +2) | 15 |

```
attr(L) = base + floor(RATE_TENTHS[p] * (L - 1) / 10)
```

The rule for fractions: growth is always computed from level 1 with integer maths and one `floor`, never added up per level. So "other" attributes go +1, +2, +1, +2 (L2 +1, L3 +3, L4 +4, L5 +6). The same inputs always give the same result, and no fractional state is saved. A level-up gives +17.5 attribute points on average (sum 906 at L1, 1412 at L30).

Saved state is only `level`, `xp` and `priority[3]`. Attributes are always recomputed from them.

## 3. Derived stats

`L` = level. `A` = attribute after equipment and passive attribute bonuses (section 6). Pools are rounded with `Math.round`. Regen is per tick (60 Hz), like `playerController.ts`.

| Stat | Formula | Notes |
|---|---|---|
| maxHP | `60 + 5L + 15·mod(CON) + 4·mod(STR)` | then + item `maxHpBonus` + passives |
| maxMP | `40 + 3L + 12·mod(WIS) + 10·mod(INT)` | + item `maxManaBonus` |
| maxStamina | `60 + 3L + 10·mod(CON) + 6·mod(DEX)` | + item `maxStaminaBonus` |
| manaRegen | `0.01 + 0.02·mod(WIS) + 0.01·mod(INT)` | + item `manaRegenBonus` |
| staminaRegen | `0.15 + 0.05·mod(CON)` | + item `staminaRegenBonus` |
| baseAttack | `10 + 2L + 3.5·mod(W)` | `W` = weapon `scalingAttribute` (default STR, rapiers DEX, staves INT); then + weapon `attackBonus` |
| baseDefense | `1 + 0.5L + 2·mod(CON)` | + item `defenseBonus` |
| spellPower | `(0.85 + 0.08·mod(C)) · (1 + 0.04·(L-1))` | `C` = CHA for `solar`, INT for `astral`/`frost`/`chrono`, the average of both for `unison` |
| manaCostMult | `max(0.70, 1.05 - 0.04·mod(WIS))` | cost = `max(1, round(manaCost · mult))` |
| spellCooldown | `round(cooldownFrames · (1 - min(0.30, 0.02·mod(WIS))))` | |
| attackCooldownTicks | `round(10 + 84 / (6 + mod(DEX)))` | gets closer to 10, never reaches it |
| critChance (melee only) | `min(0.25, 0.02 + 0.01·mod(DEX))`, crit x1.5 | uses the engine's random source; tests stub it |
| soulDropRate | `dropRate · (1 + 0.02·mod(CHA))` | |

- **Damage dealt (melee):** `round(totalAttack · (crit ? 1.5 : 1) · 100 / (100 + targetDEF))`, minimum 1.
- **Spell damage:** `round(spell.damage · spellPower · 100 / (100 + targetDEF))`. It replaces `computeEffectiveSpellDamage`.
- **Damage taken:** `max(1, round(raw · 100 / (100 + playerDEF)))`. This is the first time defense is applied.
- **Hazards** (spikes and chasms, `collisions.ts`, today a flat 20): `round(0.12 · maxHP)`, ignoring DEF. A platforming mistake costs the same at any level.
- **No evasion stat.** Dodging stays a player skill (backstep, slide, i-frames).
- **These stay per-hero constants**, the movement identity: `dashStaminaCost`, `slideCooldownTicks`, `backstepCooldownTicks`, plus all jump and run physics.

### Pseudo-code (single module, e.g. `src/game/logic/characterStats.ts`)

```ts
const RATE_TENTHS = [60, 40, 30];  // priority 1, 2, 3
const OTHER_TENTHS = 15;
const mod = (a: number) => (a - 100) / 20;

function attributesAt(base: Attr6, priority: AttrKey[3], level: number): Attr6 {
  const out = { ...base };
  for (const k of ATTR_KEYS) {
    const i = priority.indexOf(k);
    const rate = i >= 0 ? RATE_TENTHS[i] : OTHER_TENTHS;
    out[k] = base[k] + Math.floor((rate * (level - 1)) / 10);
  }
  return out;
}

function deriveStats(hero, level, priority, equipment, passives): DerivedStats {
  const a = addBonuses(attributesAt(hero.baseAttributes, priority, level),
                       equipment.attributeBonuses, passives.attributeBonuses);
  const w = equipment.mainHand?.scalingAttribute ?? "STR";
  return {
    maxHp:      Math.round(60 + 5*level + 15*mod(a.CON) + 4*mod(a.STR)) + flat.maxHp,
    maxMana:    Math.round(40 + 3*level + 12*mod(a.WIS) + 10*mod(a.INT)) + flat.maxMana,
    maxStamina: Math.round(60 + 3*level + 10*mod(a.CON) + 6*mod(a.DEX)) + flat.maxStamina,
    totalAttack:  Math.round(10 + 2*level + 3.5*mod(a[w])) + flat.attack,
    totalDefense: Math.round(1 + 0.5*level + 2*mod(a.CON)) + flat.defense,
    // ...regen, spellPower(domain), manaCostMult, cooldowns as in the table
  };
}
```

`calculatePlayerDerivedStats` keeps its signature and calls `deriveStats`, so `syncPlayerMaxStats` and the HUD do not change.

## 4. Hero curves, levels 1-30 (default priorities, no gear)

ATK is without the weapon bonus. Both heroes use a DEX weapon (the starter rapier). SP = spellPower for the hero's own domain.

| Hero | L | STR/DEX/CON/INT/WIS/CHA | HP | MP | ST | ATK | DEF | SP | atk CD | crit |
|---|---|---|---|---|---|---|---|---|---|---|
| Valen | 1 | 151/166/156/136/146/151 | 117 | 89 | 111 | 24 | 7 | 1.05 | 19 | 5.3% |
| | 5 | 157/190/172/142/152/163 | 150 | 107 | 138 | 36 | 11 | 1.28 | 18 | 6.5% |
| | 10 | 164/220/192/149/159/178 | 192 | 130 | 172 | 51 | 15 | 1.58 | 17 | 8.0% |
| | 20 | 179/280/232/164/174/208 | 275 | 176 | 240 | 82 | 24 | 2.26 | 16 | 11% |
| | 30 | 194/340/272/179/189/238 | 358 | 223 | 308 | 112 | 33 | 3.03 | 15 | 14% |
| Aurelia | 1 | 131/152/136/176/162/149 | 98 | 118 | 97 | 21 | 5 | 1.15 | 20 | 4.6% |
| | 5 | 137/158/148/200/178/155 | 128 | 152 | 116 | 30 | 8 | 1.45 | 19 | 4.9% |
| | 10 | 144/165/163/230/198/162 | 166 | 194 | 141 | 41 | 12 | 1.86 | 19 | 5.3% |
| | 20 | 159/180/193/290/238/177 | 242 | 278 | 191 | 64 | 20 | 2.83 | 18 | 6.0% |
| | 30 | 174/195/223/350/278/192 | 317 | 362 | 240 | 87 | 28 | 4.00 | 18 | 6.8% |

**Sanity check at level 1 against the current `baseStats`** (current to new):

| | HP | MP | ST | ATK | DEF | mana regen | stam regen | spell x | cost x | atk CD |
|---|---|---|---|---|---|---|---|---|---|---|
| Valen | 115 to 117 | 90 to 89 | 115 to 111 | 23 to 24 | 7 to 7 | 0.07 to 0.074 | 0.30 to 0.29 | 1.00 to 1.05 | 1.00 to 0.96 | 18 to 19 |
| Aurelia | 90 to 98 | 125 to 118 | 95 to 97 | 18 to 21 | 4 to 5 | 0.14 to 0.110 | 0.24 to 0.24 | 1.15 to 1.15 | 0.90 to 0.93 | 22 to 20 |

- Level 1 feels the same as today. The hero gaps shrink a little, as intended: the owner wants moderate gaps.
- The 8121dad baseline (`defaultPlayerStats.json`: Valen 100/60/100 with ATK 15, Aurelia 120/80/90 with ATK 18) had the heroes the other way around. The current profiles match the lore better, so the spec follows them.
- At L30, pools are about 3x and melee about 4.5x level 1 (with world 8 gear). Time to refill MP stays about 20-27 s at every level, because regen grows with the pool.
- With DEX as priority 1, Valen's attack speed gets closer to 15 ticks and never runs away. The dash cost stays at 18 stamina, so dashes become relatively cheaper. This is intended: you feel the growth.

## 5. Monsters

Monsters use the same attributes and the same `attributesAt` growth (each archetype has its own priority). Only the derived formulas differ.

**Level by map:** `monsterLevel = min(30, 1 + 4·(world-1) + floor((map-1)/2))`. World 1 covers L1-4 and world 8 reaches L29-30. This is also the target level for the hero on that map.

**Archetypes** (L1 values, regular tier, sum 906, priority 1/2/3):

| Archetype | STR/DEX/CON/INT/WIS/CHA | Priority | Current enemies |
|---|---|---|---|
| Brute | 166/146/166/130/146/152 | STR, CON, DEX | chasm_gargoyle, bastion_gargoyle, gargoyle_scout |
| Skirmisher | 146/176/146/136/156/146 | DEX, STR, WIS | chrono_hound, chasm_crawler, clockwork_owl_gargoyle |
| Construct | 170/126/180/140/150/140 | CON, STR, INT | clockwork_automaton, court_sentinel, gear_mite, thorn_creeper |
| Caster | 120/146/140/180/170/150 | INT, WIS, DEX | aether_sentinel, aether_archon, lantern_warden |
| Spirit | 110/170/130/156/170/170 | WIS, DEX, CHA | aether_wisp |

Tier shift to every L1 attribute: minion -10, regular 0, heavy +5, elite +10, boss +20. The world sets which archetypes appear (theme), not extra multipliers. Scaling comes only from level.

| Tier | HITS | TIER_DMG | TIER_DEF | TTK target (main melee, on level) |
|---|---|---|---|---|
| minion | 1 | 0.7 | 0 | 1 hit |
| regular | 2.5 | 1.0 | 2 | 2-3 hits, under 1 s |
| heavy | 4 | 1.3 | 5 | 4-5 hits |
| elite | 6 | 1.5 | 6 | 6-8 hits, 3-5 s |
| boss | 20 | 2.0 | 8 | about 25 hits plus spells, 45-90 s |

```
monsterHP  = round(HITS[tier] · (24 + 3.6L + 4·mod(CON)))
monsterDEF = round(TIER_DEF[tier] + 0.4L + mod(CON))
monsterDMG = round(TIER_DMG[tier] · (12 + 2.6L + 3·mod(STR)))   // casters: INT instead of STR
```

`24 + 3.6L + 4·mod(CON)` is one on-level player hit, so HITS is the time-to-kill target directly. Monster spell attacks (`spells.json`, `ownerType: enemy/boss`) deal `round(damage · TIER_DMG[tier] · (1 + 0.04·(L-1)))`. This is the same level factor heroes get.

**Check at on-level** (Valen; gear assumed at DEF 30+3L, HP 75+5(L-1); reference weapon `attackBonus = 15 + 8·(world-1)`):

| L | Regular HP / hit taken | Elite HP / hit taken | Boss HP / hit taken | Valen hits to kill (reg / elite / boss) |
|---|---|---|---|---|
| 1 | 94 / 17 (9% HP) | 238 / 27 (14%) | 872 / 38 (20%) | 2.5 / 6.6 / 25 |
| 5 | 138 / 24 (10%) | 338 / 37 (15%) | 1224 / 52 (21%) | 2.5 / 6.4 / 24 |
| 10 | 193 / 31 (10%) | 464 / 46 (15%) | 1664 / 66 (21%) | 2.6 / 6.4 / 24 |
| 20 | 303 / 42 (9%) | 716 / 60 (13%) | 2544 / 87 (20%) | 2.7 / 6.6 / 25 |
| 30 | 413 / 49 (8%) | 968 / 70 (12%) | 3424 / 101 (17%) | 2.8 / 6.6 / 24 |

Aurelia takes about 15% more hits in melee. She makes up for it with spells: aether_bolt does 30 at L1 and 104 at L30, so 3-4 bolts kill a regular. Current world 1 data agrees: court_sentinel has 80 HP (new 94), and attackPower 15-28 (new 24). Bosses differ: aether_archon has 220 HP today, 872 with the new formula (see Q3).

Data change: each enemy in `enemies.json` gets `tier`, `archetype` and an optional `levelOffset` (-2..+2). `health`, `attackPower` and `defense` become derived. Dummies (`isDummy`) keep hand-set values through `statOverrides`.

## 6. Equipment and skill trees

**Items** (`items.json`), optional fields that do not break anything:
- `attributeBonuses?: Partial<Record<Attr, number>>` in the x10 scale. Guide by rarity: uncommon +5..10 to one attribute, rare +10..15 to up to two, epic and above up to +30 in total. Starting values: solar_rapier DEX+5 CHA+5, frost_rapier DEX+10, aether_staff INT+15, scholar_robe WIS+10, swift_ring DEX+10, garnet_ring STR+10, amber_amulet CON+5 CHA+5.
- `scalingAttribute?: Attr` on weapons. Rapiers use DEX, staves INT, anything else STR.
- The flat bonuses that exist (`attackBonus`, `maxHpBonus`, ...) stay and are added after derivation.
- Order: base(L) → + item and passive attribute bonuses → derived formulas → + flat item and passive bonuses.

**Skill trees** (`skill_trees.json` nodes): `attributeRequirements?: Partial<Record<Attr, number>>`. All of them must hold, together with `minLevel` and `prerequisites`. The check uses attributes **without equipment** (level and priority only). That way, changing gear never locks a skill, and the result stays deterministic. Proposed thresholds (level reached with the default priorities):

| Node | Req | Default reach | Node | Req | Default reach |
|---|---|---|---|---|---|
| solar_fireball | CHA 160 | L4 | frost_nova | INT 180 | L2 |
| radiant_strike | CHA 175 | L9 | celestial_comet | INT 200 | L5 |
| stamina_surge | DEX 170 | L2 | scholarly_focus | WIS 170 | L3 |
| prismatic_shield | CON 165 | L4 | chrono_rewind | WIS 175 | L5 |
| sun_sentinel | CHA 180 | L11 | sentinel_spark | INT 195 | L5 |
| vitality_surge | CON 185 | L9 | astral_attunement | WIS 190 | L8 |

Tier 1 nodes have no requirement. A build that ignores a tree reaches it about 2x later, but never too late. The passives in `inventoryStats.ts` (+15 ATK, +35 HP, ...) stay flat in v1. They can later become `attributeBonuses`.

## 7. Save migration

- `SaveState` gains `saveVersion: 2`, plus `p1Level`, `p1Xp` and `p1AttributePriority` (and the same for p2). `CharacterProgressionProfile` gets the same three fields, so each hero levels on its own, like `unlockedSkills`.
- Loading a save with no `saveVersion` (v1) sets level 1, xp 0 and the hero's default priority. `skillPoints`, `unlockedSkills`, inventory and score stay as they are.
- Current pools: if the saved value was at or above the old max, it becomes the new max. Otherwise the ratio is kept: `round(newMax · saved / oldMax)`. `oldMax` comes from a frozen `LEGACY_BASE_STATS` table (today's `baseStats`) plus the old gear and skill rule, both kept only in `saveMigration.ts`. Then `syncPlayerMaxStats` clamps.
- Skills that are already unlocked stay unlocked even if they miss a new attribute requirement.
- `CharacterBaseStats` is replaced by `baseAttributes` and `defaultPriority`. The movement constants stay. The `baseStats` numbers move to the legacy table.
- Tests: the L1 sum is 906 and every value is in 110..180 for each hero; growth matches the table; derived L1 stays within ±10% of today; a v1 save migrates the same way every time.

## 8. Open questions for the owner

1. **Level source:** XP from kills (`xpReward` already exists), or map milestones? Should the +1 skill point per kill move to level-ups (proposal: 1 per level, 2 at every 5th)?
2. **Priority changes:** pick once at level 1, or allow a free respec at checkpoints? Respec is easy, because attributes are recomputed from `level` and `priority`.
3. **Boss length:** is a boss of about 25 melee hits (about 4x today's HP) right, or should HITS for bosses be about 12?
4. **CHA scope:** confirm CHA = solar spell power + soul drop chance (later also shop prices and narration flavor).
