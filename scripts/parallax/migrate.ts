/**
 * One-off migration for the parallax asset taxonomy (docs/design/parallax.md §4.1).
 *
 * Moves every parallax image from its legacy location (`src/assets/bg/<world>/` and
 * `src/assets/images/`) to `src/assets/parallax/<worldId>/` with the canonical
 * `<worldId>_{far|var_a..d|fx_*}_high.<ext>` names, using `git mv` so history follows
 * the files. The import specifiers in the layer registry are rewritten to match.
 * Registry keys and aliases are not touched (that is VC-101c).
 *
 * Usage: bun scripts/parallax/migrate.ts
 * Idempotent: a move whose source is already gone and whose target exists is skipped.
 */
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

export interface ParallaxMove {
  /** Path relative to `src/assets/`, forward slashes. */
  readonly from: string;
  /** Path relative to `src/assets/`, forward slashes. */
  readonly to: string;
}

const PNG_WORLDS = ["courtyard", "thorn_chasm", "clocktower", "aether_sanctuary", "grand_bastion"] as const;

/** Five PNG worlds: far, then four variation slots (var_a..var_d). Legacy names differ per world. */
function pngWorldMoves(worldId: (typeof PNG_WORLDS)[number]): ParallaxMove[] {
  const midFarLegacy = worldId === "courtyard" ? "mid-far" : "mid_far";
  const midCloseLegacy =
    worldId === "courtyard" ? "mid-close" : worldId === "thorn_chasm" ? "close_mid" : "mid_close";
  const dir = `parallax/${worldId}`;
  return [
    { from: `bg/${worldId}/${worldId}_far_high.png`, to: `${dir}/${worldId}_far_high.png` },
    { from: `bg/${worldId}/${worldId}_${midFarLegacy}_high.png`, to: `${dir}/${worldId}_var_a_high.png` },
    { from: `bg/${worldId}/${worldId}_mid_high.png`, to: `${dir}/${worldId}_var_b_high.png` },
    { from: `bg/${worldId}/${worldId}_${midCloseLegacy}_high.png`, to: `${dir}/${worldId}_var_c_high.png` },
    { from: `bg/${worldId}/${worldId}_close_high.png`, to: `${dir}/${worldId}_var_d_high.png` },
  ];
}

/** The eight JPG layers. They keep their format (no re-encode in this step). */
const JPG_MOVES: readonly ParallaxMove[] = [
  {
    from: "images/ashen_catacombs_far_1795727387342.jpg",
    to: "parallax/ashen_catacombs/ashen_catacombs_far_high.jpg",
  },
  {
    from: "images/shared_mid_catacomb_arches_1795727389151.jpg",
    to: "parallax/ashen_catacombs/ashen_catacombs_var_b_high.jpg",
  },
  {
    from: "images/alchemist_library_far_1795727386557.jpg",
    to: "parallax/alchemist_library/alchemist_library_far_high.jpg",
  },
  {
    from: "images/shared_mid_alchemy_shelves_1795727389972.jpg",
    to: "parallax/alchemist_library/alchemist_library_var_b_high.jpg",
  },
  {
    from: "images/eclipse_crown_far_1795727388177.jpg",
    to: "parallax/eclipse_crown/eclipse_crown_far_high.jpg",
  },
  {
    from: "images/shared_mid_obsidian_spires_1795727392169.jpg",
    to: "parallax/eclipse_crown/eclipse_crown_var_b_high.jpg",
  },
  {
    from: "images/boss_world_eclipse_throne_1795727391907.jpg",
    to: "parallax/eclipse_crown/eclipse_crown_fx_throne_high.jpg",
  },
  {
    from: "images/boss_stage_arcane_sigil_1795727392388.jpg",
    to: "parallax/_shared/fx_sigil_high.jpg",
  },
];

/** Full rename map from §4.1. */
export const PARALLAX_MOVES: readonly ParallaxMove[] = [
  ...PNG_WORLDS.flatMap((worldId) => pngWorldMoves(worldId)),
  ...JPG_MOVES,
];

const MOVE_BY_FROM: ReadonlyMap<string, string> = new Map(PARALLAX_MOVES.map((m) => [m.from, m.to]));

/**
 * Pure mapping from a legacy path (relative to `src/assets/`, either slash style) to its
 * canonical path. Returns `undefined` for anything outside the §4.1 table.
 */
export function mapParallaxPath(oldRelPath: string): string | undefined {
  return MOVE_BY_FROM.get(oldRelPath.split("\\").join("/"));
}

function runMigration(): void {
  const repoRoot = fileURLToPath(new URL("../../", import.meta.url));
  const assetsDir = join(repoRoot, "src", "assets");
  const registryPath = join(repoRoot, "src", "game", "locations", "parallaxLayerRegistry.ts");

  let moved = 0;
  let skipped = 0;
  for (const move of PARALLAX_MOVES) {
    const srcAbs = join(assetsDir, move.from);
    const dstAbs = join(assetsDir, move.to);
    if (!existsSync(srcAbs)) {
      if (existsSync(dstAbs)) {
        skipped++;
        continue;
      }
      console.error(`[migrate] missing source and target: ${move.from}`);
      process.exit(1);
    }
    mkdirSync(dirname(dstAbs), { recursive: true });
    execFileSync("git", ["mv", `src/assets/${move.from}`, `src/assets/${move.to}`], {
      cwd: repoRoot,
      stdio: "inherit",
    });
    moved++;
  }

  // Rewrite only the `@assets/...` import specifiers. Keys and aliases stay as they are.
  const registrySource = readFileSync(registryPath, "utf-8");
  let rewritten = registrySource;
  for (const move of PARALLAX_MOVES) {
    rewritten = rewritten.split(`"@assets/${move.from}"`).join(`"@assets/${move.to}"`);
  }
  if (rewritten !== registrySource) {
    writeFileSync(registryPath, rewritten, "utf-8");
  }

  console.log(`[migrate] moved ${moved}, already moved ${skipped}, registry ${rewritten !== registrySource ? "updated" : "unchanged"}`);
}

if (import.meta.main) {
  runMigration();
}
