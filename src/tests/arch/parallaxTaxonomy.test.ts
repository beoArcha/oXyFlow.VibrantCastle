import { describe, expect, it } from "bun:test";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, relative, sep } from "node:path";
import type { WorldParallaxMeta } from "@game/parallax/meta";

const PARALLAX_ROOT = join(process.cwd(), "src", "assets", "parallax");

const WORLD_IDS = [
  "courtyard",
  "thorn_chasm",
  "ashen_catacombs",
  "clocktower",
  "alchemist_library",
  "aether_sanctuary",
  "grand_bastion",
  "eclipse_crown",
] as const;

/**
 * Legacy JPG files awaiting PNG replacement in VC-109.
 * This list may only shrink; adding new JPG files is forbidden.
 */
const LEGACY_PARALLAX_JPG_ALLOWLIST: ReadonlySet<string> = new Set([
  "_shared/fx_sigil_high.jpg",
  "alchemist_library/alchemist_library_far_high.jpg",
  "alchemist_library/alchemist_library_var_b_high.jpg",
  "ashen_catacombs/ashen_catacombs_far_high.jpg",
  "ashen_catacombs/ashen_catacombs_var_b_high.jpg",
  "eclipse_crown/eclipse_crown_far_high.jpg",
  "eclipse_crown/eclipse_crown_fx_throne_high.jpg",
  "eclipse_crown/eclipse_crown_var_b_high.jpg",
]);

const TIER_SUFFIX = "(?:hi8bit|hi16bit|high)";
const SHARED_FX_PATTERN = new RegExp(`^fx_[a-z0-9_]+_${TIER_SUFFIX}\\.(png|jpg)$`);
const HEX_NO_ALPHA_PATTERN = /^#[0-9a-f]{6}$/i;
const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

function worldFilePattern(worldId: string): RegExp {
  return new RegExp(
    `^${worldId}_(?:far|var_[a-e](?:_zone_(?:boss|rest|secret|story))?|fx_[a-z0-9_]+)_${TIER_SUFFIX}\\.(png|jpg)$`
  );
}

function collectFilesRecursive(dir: string): string[] {
  const results: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) results.push(...collectFilesRecursive(full));
    else results.push(full);
  }
  return results.sort();
}

function assertPngHasNoAlpha(filePath: string): void {
  const buf = readFileSync(filePath);
  expect(buf.subarray(0, 8).equals(PNG_SIGNATURE)).toBe(true);
  const colorType = buf[25];
  // PNG color types 0 (grayscale) and 2 (RGB) have no alpha channel; 4 and 6 do.
  expect([0, 2]).toContain(colorType);
}

describe("Architectural Rule: Parallax Taxonomy (§3.1 / §3.2)", () => {
  it("contains only _shared and the 8 world directories at the parallax root", () => {
    const entries = readdirSync(PARALLAX_ROOT, { withFileTypes: true });
    const dirs = entries.filter((e) => e.isDirectory()).map((e) => e.name).sort();
    const files = entries.filter((e) => !e.isDirectory()).map((e) => e.name);

    expect(files).toEqual([]);
    expect(dirs).toEqual(["_shared", ...WORLD_IDS].sort());
  });

  it("matches §3.1 file naming rules in _shared and every world folder", () => {
    const sharedFiles = readdirSync(join(PARALLAX_ROOT, "_shared")).sort();
    for (const file of sharedFiles) {
      expect(SHARED_FX_PATTERN.test(file)).toBe(true);
    }

    for (const worldId of WORLD_IDS) {
      const worldDir = join(PARALLAX_ROOT, worldId);
      const pattern = worldFilePattern(worldId);
      const files = readdirSync(worldDir).sort();
      expect(files).toContain(`${worldId}_parallax_meta.json`);

      for (const file of files) {
        if (file === `${worldId}_parallax_meta.json`) continue;
        expect(pattern.test(file)).toBe(true);
      }
    }
  });

  it("enforces alpha-free far layers and alpha-free far/placeholder hex colours", () => {
    for (const worldId of WORLD_IDS) {
      const worldDir = join(PARALLAX_ROOT, worldId);
      const meta = JSON.parse(
        readFileSync(join(worldDir, `${worldId}_parallax_meta.json`), "utf-8")
      ) as WorldParallaxMeta;

      expect(HEX_NO_ALPHA_PATTERN.test(meta.placeholder.top)).toBe(true);
      expect(HEX_NO_ALPHA_PATTERN.test(meta.placeholder.bottom)).toBe(true);
      expect(HEX_NO_ALPHA_PATTERN.test(meta.placeholder.silhouette)).toBe(true);
      expect(meta.generated.far).toBeDefined();
      expect(HEX_NO_ALPHA_PATTERN.test(meta.generated.far.avg)).toBe(true);

      for (const file of readdirSync(worldDir)) {
        if (file.startsWith(`${worldId}_far_`) && file.endsWith(".png")) {
          assertPngHasNoAlpha(join(worldDir, file));
        }
      }
    }
  });

  it("ensures every zones entry in a world meta has at least one matching file on disk", () => {
    for (const worldId of WORLD_IDS) {
      const worldDir = join(PARALLAX_ROOT, worldId);
      const files = readdirSync(worldDir);
      const meta = JSON.parse(
        readFileSync(join(worldDir, `${worldId}_parallax_meta.json`), "utf-8")
      ) as WorldParallaxMeta;

      for (const [slot, layer] of Object.entries(meta.layers)) {
        if (!layer.zones) continue;
        for (const zoneKind of Object.keys(layer.zones)) {
          const prefix = `${worldId}_${slot}_zone_${zoneKind}_`;
          const hasMatch = files.some((f) => f.startsWith(prefix) && (f.endsWith(".png") || f.endsWith(".jpg")));
          expect(hasMatch).toBe(true);
        }
      }
    }
  });

  it("restricts JPG parallax files to the explicit VC-109 shrinking allow-list", () => {
    const allFiles = collectFilesRecursive(PARALLAX_ROOT);
    const jpgRelPaths = allFiles
      .filter((f) => f.toLowerCase().endsWith(".jpg") || f.toLowerCase().endsWith(".jpeg"))
      .map((f) => relative(PARALLAX_ROOT, f).split(sep).join("/"));

    for (const rel of jpgRelPaths) {
      expect(LEGACY_PARALLAX_JPG_ALLOWLIST.has(rel)).toBe(true);
    }
    expect(existsSync(join(PARALLAX_ROOT, "_shared", "fx_sigil_high.jpg"))).toBe(true);
  });

  it("ensures every location JSON selects only slots declared in its world meta", () => {
    const locationsDir = join(process.cwd(), "src", "data", "locations");
    const files = readdirSync(locationsDir).filter((f) => f.endsWith(".json") && !f.endsWith(".schema.json"));

    for (const file of files) {
      const json = JSON.parse(readFileSync(join(locationsDir, file), "utf-8")) as {
        id: string;
        worldId?: string;
        parallax?: { layers?: string[] };
        parallaxBackground?: unknown;
        bossZones?: unknown;
      };
      const worldId = json.worldId ?? json.id;
      const meta = JSON.parse(
        readFileSync(join(PARALLAX_ROOT, worldId, `${worldId}_parallax_meta.json`), "utf-8")
      ) as WorldParallaxMeta;

      expect(json.parallax).toBeDefined();
      expect(json.parallaxBackground).toBeUndefined();
      expect(json.bossZones).toBeUndefined();
      for (const slot of json.parallax?.layers ?? []) {
        expect(slot).not.toBe("far");
        expect(meta.layers[slot]).toBeDefined();
      }
    }
  });
});
