import { describe, expect, test } from "bun:test";
import { readdirSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";
import type { AtlasFileMap } from "@game/engine/atlas/atlasTypes";
import {
  auditRecommendedSets,
  buildAssetReadinessAudit,
  deriveAssetStatus,
  discoverAssetAuditFiles,
  RECOMMENDED_DECOR_PROPS,
  RECOMMENDED_TILESETS,
  type AssetAuditFileMaps,
  type AssetAuditItem,
  type RecommendedSetAudit,
} from "../assetReadinessAudit";

interface FakeSet {
  readonly id: string;
  readonly hi8?: boolean;
  readonly hi16?: boolean;
  readonly meta?: boolean;
}

/** Builds a fake discovery map in the same path shape the Vite glob and disk fallback produce. */
function fakeFiles(group: string, sets: readonly FakeSet[]): AtlasFileMap {
  const images: Record<string, string> = {};
  const metas: Record<string, unknown> = {};
  for (const set of sets) {
    const dir = `/src/assets/${group}/${set.id}`;
    if (set.hi8) images[`${dir}/${set.id}_hi8bit.png`] = `${dir}/${set.id}_hi8bit.png`;
    if (set.hi16) images[`${dir}/${set.id}_hi16bit.png`] = `${dir}/${set.id}_hi16bit.png`;
    if (set.meta) metas[`${dir}/${set.id}_meta.json`] = {};
  }
  return { images, metas };
}

const completeSet = (id: string): FakeSet => ({ id, hi8: true, hi16: true, meta: true });

function build(tilesets: readonly FakeSet[], props: readonly FakeSet[] = []) {
  const files: AssetAuditFileMaps = {
    tilesetFiles: fakeFiles("tiles", tilesets),
    propFiles: fakeFiles("props", props),
  };
  return buildAssetReadinessAudit(files);
}

function row(items: readonly AssetAuditItem[], id: string): AssetAuditItem {
  const found = items.find((item) => item.id === id);
  if (!found) throw new Error(`missing audit row ${id}`);
  return found;
}

/** Immediate subfolder names of a directory on disk (one per asset set). */
function folderNames(dir: string): string[] {
  return readdirSync(dir).filter((name) => statSync(resolve(dir, name)).isDirectory());
}

const ASSETS_DIR = fileURLToPath(new URL("../../../../assets", import.meta.url));

describe("auditRecommendedSets", () => {
  test("classifies recommended names as complete, partial or missing", () => {
    const audit = auditRecommendedSets(
      fakeFiles("tiles", [completeSet("a"), { id: "b", hi8: true, meta: true }]),
      ["a", "b", "c"]
    );
    expect(audit.complete).toEqual(["a"]);
    expect(audit.partial).toEqual(["b"]);
    expect(audit.missing).toEqual(["c"]);
  });

  test("unrelated complete sets do not satisfy recommended names", () => {
    const audit = auditRecommendedSets(
      fakeFiles("tiles", [completeSet("x"), completeSet("y"), completeSet("z"), completeSet("w"), completeSet("v")]),
      ["a", "b"]
    );
    expect(audit.complete).toEqual([]);
    expect(audit.missing).toEqual(["a", "b"]);
    expect(audit.discoveredComplete).toBe(5);
  });

  test("reports discovered totals across all folders", () => {
    const audit = auditRecommendedSets(
      fakeFiles("tiles", [completeSet("a"), { id: "b", hi8: true, meta: true }, { id: "c", hi16: true }]),
      []
    );
    expect(audit.discoveredComplete).toBe(1);
    expect(audit.discoveredPartial).toBe(2);
  });
});

describe("deriveAssetStatus", () => {
  const audit = (complete: string[], partial: string[], missing: string[]): RecommendedSetAudit => ({
    complete,
    partial,
    missing,
    discoveredComplete: complete.length,
    discoveredPartial: partial.length,
  });

  test("ready only when nothing is partial or missing", () => {
    expect(deriveAssetStatus(audit(["a"], [], []))).toBe("ready");
  });

  test("partial when some recommended names have files", () => {
    expect(deriveAssetStatus(audit(["a"], [], ["b"]))).toBe("partial");
    expect(deriveAssetStatus(audit([], ["b"], ["a"]))).toBe("partial");
  });

  test("missing when no recommended name has files", () => {
    expect(deriveAssetStatus(audit([], [], ["a", "b"]))).toBe("missing");
  });
});

describe("buildAssetReadinessAudit tileset row", () => {
  test("all recommended tilesets complete reports ready", () => {
    const tilesets = RECOMMENDED_TILESETS.map((id) => completeSet(id));
    const item = row(build(tilesets).items, "audit_platform_tilesets");
    expect(item.status).toBe("ready");
    expect(item.countLabel).toBe(`${RECOMMENDED_TILESETS.length}/${RECOMMENDED_TILESETS.length} zestawów`);
  });

  test("partial recommended set names the incomplete and missing folders", () => {
    const [first, second, third, fourth] = RECOMMENDED_TILESETS;
    const items = build([
      completeSet(first),
      completeSet(second),
      { id: third, hi8: true, meta: true },
      { id: "unrelated_set", hi8: true, hi16: true, meta: true },
    ]).items;
    const item = row(items, "audit_platform_tilesets");
    expect(item.status).toBe("partial");
    expect(item.countLabel).toBe(`2/${RECOMMENDED_TILESETS.length} zestawów`);
    expect(item.detailEn).toContain(`complete: 2/${RECOMMENDED_TILESETS.length} (${first}, ${second})`);
    expect(item.detailEn).toContain(`Incomplete: ${third}`);
    expect(item.detailEn).toContain(`Missing: ${fourth}`);
    expect(item.detailEn).toContain("All discovered sets: 3 complete, 1 incomplete");
  });

  test("unrelated complete sets do not raise the recommended count", () => {
    const items = build([completeSet("unrelated_a"), completeSet("unrelated_b"), completeSet("unrelated_c"), completeSet("unrelated_d"), completeSet("unrelated_e")]).items;
    const item = row(items, "audit_platform_tilesets");
    expect(item.status).toBe("missing");
    expect(item.countLabel).toBe(`0/${RECOMMENDED_TILESETS.length} zestawów`);
  });

  test("no tileset files reports missing", () => {
    const item = row(build([]).items, "audit_platform_tilesets");
    expect(item.status).toBe("missing");
    expect(item.countLabel).toBe(`0/${RECOMMENDED_TILESETS.length} zestawów`);
  });
});

describe("buildAssetReadinessAudit prop row", () => {
  test("no prop files reports missing", () => {
    const item = row(build([]).items, "audit_decor_props");
    expect(item.status).toBe("missing");
    expect(item.countLabel).toMatch(new RegExp(`^0/${RECOMMENDED_DECOR_PROPS.length} rekw\\.`));
  });

  test("partial prop files report partial and name the partial prop", () => {
    const item = row(build([], [{ id: "wall_torch", hi8: true, meta: true }]).items, "audit_decor_props");
    expect(item.status).toBe("partial");
    expect(item.countLabel).toMatch(new RegExp(`^0/${RECOMMENDED_DECOR_PROPS.length} rekw\\.`));
    expect(item.detailEn).toContain("Incomplete: wall_torch");
  });
});

describe("recommended ids against the real asset folders", () => {
  test("every recommended tileset has a folder under src/assets/tiles", () => {
    const folders = folderNames(resolve(ASSETS_DIR, "tiles"));
    const missing = RECOMMENDED_TILESETS.filter((id) => !folders.includes(id));
    expect(missing).toEqual([]);
  });

  test("every recommended prop has a folder under src/assets/props", () => {
    const folders = folderNames(resolve(ASSETS_DIR, "props"));
    const missing = RECOMMENDED_DECOR_PROPS.filter((id) => !folders.includes(id));
    expect(missing).toEqual([]);
  });

  test("the real discovery reports every recommended tileset and prop complete", () => {
    const report = buildAssetReadinessAudit(discoverAssetAuditFiles());
    const tilesets = row(report.items, "audit_platform_tilesets");
    const props = row(report.items, "audit_decor_props");
    expect(tilesets.detailEn).toContain("Missing: none");
    expect(props.detailEn).toContain("Missing: none");
  });
});
