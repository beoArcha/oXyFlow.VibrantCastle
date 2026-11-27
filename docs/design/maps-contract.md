# Vibrant Castle: map contract (VC-020)

One set of rules for VC-021 to VC-028 and for every later map. A map PR that breaks a **must** rule does not merge.
Sources: baseline maps at `8121dad`, HEAD maps in `src/data/locations/*.json`, `worldCampaignRegistry.ts`,
`parallaxLayerRegistry.ts`, `playerKinematics.ts` and the validator constants in `src/tests/arch/helpers/levelLogic/constants.ts`.

## 1. Slots, ids and links (8 worlds x 8 maps)

- **Slot code** `W<w>-<m>` (w, m = 1..8) comes from `WORLD_CAMPAIGN_REGISTRY`. The map number fixes the archetype:
  1 intro, 2 exploration, 3 gauntlet, 4 stage_boss, 5 vertical, 6 secret_wing, 7 siege, 8 world_boss.
- **Location id**: map 1 keeps the bare world id (`courtyard`, `thorn_chasm`, ...) so saves and links stay valid.
  Maps 2-8 use `<worldId>_m<m>` (`courtyard_m2`, `eclipse_crown_m8`). The file name is `<id>.json`.
  The blueprint must set `worldId` and `stageNumber`, and they must match the id.
- **Forward chain**: `nextLocationId` of `W<w>-<m>` is `W<w>-<m+1>`. Map 8 points at map 1 of the next world.
  While only map 1 exists, map 1 points at the next world's map 1 (today's chain:
  courtyard, thorn_chasm, ashen_catacombs, clocktower, alchemist_library, aether_sanctuary, grand_bastion, eclipse_crown).
  When a map 2 lands, the map 1 forward portal moves to map 2 in the same PR.
- **Entry keys** are `from_<sourceLocationId>`. The only other allowed key is `checkpoint_mid`.
- **Portal ids**: `portal_back_<target>` (towards the previous map), `portal_to_<target>` (forward/goal),
  `portal_side_<target>` (optional branch). Every portal names `targetLocationId` and `targetEntryKey`; no raw `targetSpawnPoint`.
- **Two-way rule**: every portal A to B needs a portal B to A, and the entry it lands on must sit within 320 px of that return portal.
  The one allowed exception is the campaign loop `eclipse_crown` to `courtyard` (see open questions).

## 2. Size bands per archetype

Run speed is 4.8 px/tick (about 288 px/s). The baseline maps (6000-8000 x 1350-1600, clocktower 3600 x 3000) felt coherent;
HEAD maps (2440-4840 wide) end before the world's identity is set. Bands below sit between the two.

| Archetype (map) | Width px | Height px | Note |
|---|---|---|---|
| intro (1) | 5600-7200 | 1100-1600 | tutorial beats spread over the full width |
| intro, vertical world (W4-1 only) | 2800-3600 | 2600-3200 | baseline clocktower scale |
| exploration (2) | 6000-8000 | 1300-2000 | most branches and secrets |
| gauntlet (3) | 5000-7000 | 1000-1500 | denser enemies and hazards, few branches |
| stage_boss (4) | 3600-5600 | 1100-1600 | short approach plus arena |
| vertical (5) | 2400-3600 | 2600-4000 | climb, the goal sits in the top 20% |
| secret_wing (6) | 2400-4000 | 1000-2000 | reached from a side portal of map 2 or 3 |
| siege (7) | 6400-8000 | 1200-1600 | two lever-gate pairs minimum |
| world_boss (8) | 4000-6400 | 1400-2400 | arena of at least 1000 x 600 |

Hard limits for every map: 2400-8000 wide, 1000-4000 high. `parallaxBackground.boxWidth` stays at or above width + 400.

## 3. Stage flow

Mario spine, Aria-style ribs, Bastion voice.

1. **Start** (first 15% of the route): a safe flat run of at least 480 px from the spawn, no enemy within 400 px, one teaching obstacle.
2. **Mid checkpoint** (35-65% of the route): spawn entry `checkpoint_mid` on flat ground and a trigger with the same id.
   The runtime has no checkpoint entity yet; until it does, the entry and trigger are data only (follow-up card).
3. **Goal** (the last 15% horizontally; the top 20% for vertical maps): the forward portal, preceded by the map's main gate.
4. **Branches**: at least one optional branch off the core path (a high route, a lower cave, a side room) that ends in a reward
   or a secret trigger (`secret_<name>`, voiced by `narratorSecretFoundQuote`). Branches rejoin the core path or
   return to it by a one-way drop that lands on the core path.
5. **Backtracking hooks**: places meant for later abilities are tagged by id prefix `hook_<ability>_` (for example `hook_dash_ledge`).
   A tagged area may be dash-only or unreachable today; an untagged one may not. The core path never needs a hook.
6. **Arrival from any entry**: from every entry (not only the default spawn) the player must reach both the goal portal
   and the back portal. Arriving from the next map must never leave the player behind a closed gate with no lever.

## 4. Mandatory elements per map

- **Spawns**: `spawnPoints.default`, one `from_<id>` entry per incoming portal, `checkpoint_mid`. All grounded
  (drop of 64 px or less), at least 160 px from any portal box, facing into the level.
- **Lever-gate pairs**: at least one (two on siege and world_boss maps). The gate (`*_portcullis` / `*_gate` solid,
  56 px wide) must block the core path (`GATE_BLOCKS_NOTHING` stays silent), and its lever must be reachable at the
  comfortable tier without passing that gate. Restored pairs are named in section 7 and protected by `REQUIRED_GATES`.
- **Portals**: back portal near the start, forward portal at the goal, optional side portals; all two-way (section 1).
- **Narration beats**: three triggers per map with map-specific keys `narrationW<w>M<m>Entry`, `...Mid`, `...Goal`
  in EN and PL (`src/i18n/modules/narrations.ts`). Entry may reuse `openingNarrationKey`. Shared tutorial keys
  (`trainingLeverPrompt`, ...) are allowed in addition, never instead. No two maps share an `openingNarrationKey`.
- **Enemy density** (non-dummy, non-`twoPlayerOnly` enemies per 1000 px of route, route = width + max(0, height - 600)):

  | World tier | Worlds | Band | Two-player extras |
  |---|---|---|---|
  | early | W1-W2 | 1.5-2.5 | up to +30% via `twoPlayerOnly` |
  | middle | W3-W5 | 2.0-3.0 | up to +30% |
  | late | W6-W8 | 2.5-3.5 | up to +30% |

  Gauntlet and siege maps may go 0.5 above the band; secret wings 1.0 below. The boss in a boss zone does not count.
- **Parallax**: exactly one opaque `far` layer (`world:<id>:far`), at least one `mid` and one `close` layer;
  `mid_far` / `mid_close` are optional, five layers minimum, all keys resolved by `parallaxLayerRegistry.ts`.
  A `boss_stage` layer requires a `stage` boss zone and the other way round; the same for `boss_world`.
  stage_boss and world_boss maps must have the matching boss zone and layer; other maps may have one stage-scope mini arena.

## 5. Geometry rules from the movement

Numbers come from `DESIGN_LIMITS` (the validator's SSOT, the lowest values across 30/60/90/120 Hz). Hero box is 32 x 48.

| Rule | Core path | Optional branch | Hard limit |
|---|---|---|---|
| Step-up (rise between surfaces) | 96 px | 109 px | above 109 needs a lift, a one-way platform chain or a `hook_` tag |
| Flat gap (same height) | 170 px | 216 px | dash-only gaps up to 216 + 136 = 352 px need a `hook_dash_` tag |
| Gap with a rise of 64-96 px | 130 px | 170 px | |
| Landing ledge width | 128 px (160 after a gap above 150 px) | 96 px | 64 px, gates and walls excepted |
| Head room where a jump is needed | 176 px | 160 px | walk-only passages 64 px or more |
| Drop to the next surface | 400 px | 480 px | above 540 px (the viewport is about 1000 x 560) the landing is off screen: not allowed |

Also: no hazard within 32 px of a core landing edge; no enemy on a landing ledge after a gap above 150 px;
bottomless pits must carry a hazard strip or a visible edge decor; nothing lands the player outside the map (death at height + 100).

## 6. Checklist per map PR

1. `bun scripts/validate-level.ts <id>` passes with no new ERROR; every WARN is fixed or explained in the PR.
2. `bun test src/tests/arch` green (`locationLinks`, `locationBlueprints`, trademark names, assets).
3. Headless walk-through: Playwright chromium-1248 from the scratchpad, one screenshot per 1000 px of route
   (spawn, each beat, the checkpoint, each gate before and after its lever, the goal) as one strip in the PR.
4. PR body: the size band row used, the density result, the list of lever-gate pairs and portals, and the section 7 row it closes.
5. Paths in the PR use `%TEMP%` / `%USERPROFILE%`, never a local user path.

## 7. Per-map plan

| Map (slot) | Keep from baseline (8121dad) | Keep from HEAD | Fix |
|---|---|---|---|
| courtyard (W1-1) | 7200 x 1350 length, the 7-step tutorial narration chain (opening, jump, combat, movement, lever, success, goal), parapet + main gate (the parapet gate needs its own lever) | trial-square boss arena, high vault portal to clocktower | widen to 6400-7200; give clocktower a return portal to `from_courtyard`; checkpoint before the arena |
| thorn_chasm (W2-1) | 6000 x 1500, nine thorn pits, low archways, moving rock, `chasm_portcullis` lever-gate | thorn warden lair, `from_catacombs` entry | **restore the lever-gate pair**; height back to 1400+ so pits read as a chasm; add the three beats (HEAD has no trigger) |
| ashen_catacombs (W3-1, new) | none | top-left descent start, ember chapel arena, ossuary gate | width 2640 to 5600+; mid checkpoint; entry/mid/goal beats; density to the middle band (7 enemies now, 13 or more at 5600 px) |
| clocktower (W4-1) | 3600 x 3000 vertical climb, lift, target ledges | three movers, summit chamber, `from_courtyard` entry | back to the vertical band (2800-3600 x 2600-3200); goal in the top 20%; return portal to courtyard |
| alchemist_library (W5-1, new) | none | archive lever and portcullis, astrolabe rotunda | width 3840 to 5600+; unique opening key (shares `narrationMagicUsed` with aether); book-stack branch as a `hook_` or secret |
| aether_sanctuary (W6-1) | 6400 x 1600, void hazards under islets, crystal platforms, altar lever-gate before the goal, mid narration | archon altar arena, two movers | **restore the altar lever-gate**; put back hazards (HEAD has none); beats (HEAD has no trigger); density 7 to 18 or more |
| grand_bastion (W7-1) | 8000 x 1500, keep **and ward** gates, lift, 22-enemy siege density | commander arena | **restore the ward gate pair** before the exit; widen to 7200-8000; add beats (HEAD has no trigger) |
| eclipse_crown (W8-1, new) | none | vanguard sanctum, obsidian layers | width 4640 to 5600+; beats (no trigger now); decide on the world-boss zone on map 1 (open question) |

## 8. New validator checks for `validate-level.ts`

Each is a `Rule` in `src/tests/arch/helpers/levelLogic/rules/`, registered in `RULES`. New ERRORs that HEAD maps already break
go into `KNOWN_LEVEL_DEFECTS` and leave it with the map PR that fixes them.

| Code | Severity | Exact condition |
|---|---|---|
| `MAP_ID_FORMAT` | error | id does not match `^<worldId>(_m[2-8])?$`, or `worldId` / `stageNumber` are missing or disagree with the id |
| `MAP_SIZE_RANGE` | error / warn | error outside 2400-8000 x 1000-4000; warn outside the archetype band of section 2 (archetype from `ALL_CAMPAIGN_STAGES`) |
| `NEXT_LOCATION_CHAIN` | error | `nextLocationId` is not the next slot (section 1), or no portal targets it |
| `LEVER_GATE_MIN` | error | fewer useful lever-gate pairs than required (1; 2 on siege and world_boss) |
| `GATE_WITHOUT_LEVER` | error | a solid whose prefab has a `structureId` or whose id matches `/gate\|portcullis/` is targeted by no lever |
| `REQUIRED_GATE_MISSING` | error | a gate id listed in a new `REQUIRED_GATES` map is absent (thorn_chasm, aether_sanctuary, grand_bastion keep + ward) |
| `PORTAL_ONE_WAY` | warn to error | promote the existing warn; skip only portals listed in `ALLOWED_ONE_WAY` |
| `ENTRY_FAR_FROM_RETURN` | warn | an entry used by portal A to B lies more than 320 px from B's portal back to A |
| `ENTRY_KEY_FORMAT` | warn | an entry key is neither `from_<existing id>` nor `checkpoint_mid` |
| `ENTRY_SOFTLOCK` | error | from some entry, at tier M with every reachable lever pulled, the goal portal or the back portal is not touched |
| `CORE_PATH_COMFORT` | error | the goal portal is not touched at tier C from the default spawn |
| `NARRATION_BEATS` | error | no trigger (or `openingNarrationKey`) in the first 15% of the route, none in 35-65%, or none within 400 px of the goal portal; or a beat key missing in EN/PL |
| `OPENING_KEY_SHARED` | warn | two catalog maps use the same `openingNarrationKey` |
| `CHECKPOINT_MID` | warn | no `checkpoint_mid` entry, or it is not grounded, or it lies outside 35-65% of the route |
| `GOAL_AT_END` | warn | the forward portal is not in the last 15% of the width (top 20% of the height for vertical archetypes) |
| `START_SAFE` | warn | an enemy within 400 px of the default spawn, an entry or `checkpoint_mid` |
| `ENEMY_DENSITY` | warn | density (section 4 formula) outside the world band, after archetype offsets |
| `PARALLAX_TIERS` | error | missing a `mid` or `close` layer, or a `boss_stage` / `boss_world` layer without the matching boss zone scope (or the reverse) |
| `BOSS_ARENA_SIZE` | error | a boss zone under 600 x 400 (world: 1000 x 600), or its `bossEnemyId` is not placed inside it |
| `LEDGE_TOO_NARROW` | warn / error | a surface reached at tier C that is not a gate or wall is under 128 px (warn) or under 64 px (error) |
| `BLIND_DROP` | warn / error | walking off a surface edge falls more than 400 px (warn) or more than 540 px (error) to the next surface below the hero's x span |
| `PIT_UNMARKED` | warn | a walk-off edge with no surface below, and no hazard under that x span |
| `HOOK_UNTAGGED` | warn | a surface or touchable reached only at tier D (or not at all) whose id lacks the `hook_` prefix |
| `SECRET_BRANCH` | warn | no `secret_*` trigger on a surface outside the shortest spawn-to-goal path |

## 9. Open questions for the owner

1. Mid checkpoint: add a real checkpoint entity and respawn logic (new card), or keep checkpoint as data only for now?
2. `eclipse_crown` has a world-boss zone on map 1, while the registry puts the world boss on W8-8. Keep it as a preview or move it?
3. The `eclipse_crown` to `courtyard` loop: keep it as the only allowed one-way portal (a new game plus hook), or drop it?
4. The courtyard vault portal to clocktower skips three worlds. Keep it as a secret shortcut (two-way), or remove it?
5. Size bands double the length of the new maps. Is 5600 px the right floor for map 1, or should new worlds stay shorter?
