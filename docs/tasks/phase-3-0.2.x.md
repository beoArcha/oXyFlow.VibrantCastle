# Phase 3: playable vertical slice (0.2.x, done)

Part of the [task folder](./README.md). A summary of past work; this phase had no task cards.

## About this phase

**Goal:** turn the engine into a playable slice: a real UI, distribution and CI, rebuilt maps with enemies, and an art pipeline for heroes, tiles and props. **Period:** 2026-10-25 (`0.2.1`, 14bb1fe) to 2026-11-14 (`0.3.0`, 6072a16, released with #61 / 8121dad). Work moved from direct commits to PRs #1-#61.

## What was built

- **UI split and design system.** `src/components` split into `src/game-menu` and `src/hud` (f9e71b3); Base UI, CVA and semantic Bastion tokens (f59502f); typography primitives and a forbidden-raw-tag arch test (d31a8bb, cf5ab20).
- **Distribution and CI.** GitHub Pages build and the Markdown wiki (51c13e7, 284623e); multi-stage CI, release promotion and the coverage gate (1d1c22f, 56f5f19, c8bc297); manual Main CI runs (#12).
- **Engine hardening.** `GameEngine` split into sub-controllers, no `any`, files under 300 lines, no swallowed catches (1e72070, 575418c, 26e7c45); character selection and identity persistence (#2).
- **Maps and enemies (#3-#9, #11).** The level-logic validator and CLI, atlas repack and frame checker, the pixel sprite compiler for enemies (#3); enemy animation state and lever targets (#4); atlas quality tiers, culling and parallax (#5); five rebuilt maps with enemy sheets (#6, #7); the HUD follows the selected duelist (#8); wiki, lore and manifesto refresh (#9).
- **Hero art (#16-#25).** Valen repack (#16); the injected sprite source factory (#17); tiers renamed to `hi8bit` / `hi16bit` (#18); the hero sprite compiler and runtime loading (#19, #21); hero tiers in Atlas Studio (#22); hero sheets quantized from painted frames and shipped as PNG (#24); cleanup (#25).
- **Tilesets (#26-#36).** The platform tileset renderer with procedural fallback (#26), the `defineTileset` compiler (#27) and eight tilesets: courtyard stone, wood and marble, chasm ledge and rock, sanctuary crystal, bastion stone, clocktower brick (#28-#36).
- **Decor (#37-#52).** The `defineProp` compiler (#37), the decor layer (#38), placement in all five maps (#39), twelve props (#40-#51) and ledge anchoring for hanging decor (#52).
- **Polish and release (#53-#61).** Trademark matcher narrowed (#53); hero brightness and attack visibility fixes (#54, #55); tile polish (#56, #57); gate opening with structure atlases (#58); art pipeline docs (#59); test typing (#60); the `0.3.0` release with wiki and lore refresh (#61).

## What was learned

- Small, one-asset PRs (one tileset or prop each) were easy to review and to fix in rounds.
- Painted frames plus a palette quantizer gave better hero sheets than hand-drawn pixel sheets; the hand-drawn hero PRs (#20, #23) were closed.
- Generated assets need their pipeline in the repo, or they cannot be rebuilt. Losing that pipeline in phase 4 proved it.
- Brand names in tier labels were replaced by `hi8bit` / `hi16bit`, and a trademark arch test now guards the repo.
