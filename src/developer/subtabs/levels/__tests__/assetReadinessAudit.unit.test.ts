import { describe, expect, test } from "bun:test";
import type { AtlasFileMap } from "@game/engine/atlas/atlasTypes";
import {
  buildAssetReadinessAudit,
  countAssetSets,
  type AssetAuditFileMaps,
  type AssetAuditItem,
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

describe("countAssetSets", () => {
  test("counts complete and partial sets per folder", () => {
    const counts = countAssetSets(
      fakeFiles("tiles", [completeSet("a"), { id: "b", hi8: true, meta: true }, { id: "c", hi16: true }])
    );
    expect(counts).toEqual({ complete: 1, partial: 2 });
  });

  test("an empty map has no sets", () => {
    expect(countAssetSets({ images: {}, metas: {} })).toEqual({ complete: 0, partial: 0 });
  });
});

describe("buildAssetReadinessAudit tileset row", () => {
  const TILESETS_TARGET = 4;

  test("complete set of tilesets reports ready", () => {
    const tilesets = Array.from({ length: TILESETS_TARGET }, (_, i) => completeSet(`set_${i}`));
    const item = row(build(tilesets).items, "audit_platform_tilesets");
    expect(item.status).toBe("ready");
    expect(item.countLabel).toBe(`${TILESETS_TARGET}/${TILESETS_TARGET} zestawów`);
  });

  test("partial set of tilesets reports partial with real counts", () => {
    const items = build([completeSet("a"), completeSet("b"), { id: "c", hi8: true, meta: true }]).items;
    const item = row(items, "audit_platform_tilesets");
    expect(item.status).toBe("partial");
    expect(item.countLabel).toBe("2/4 zestawów");
    expect(item.detailEn).toContain("2 complete tileset sets");
    expect(item.detailEn).toContain("1 incomplete");
  });

  test("no tileset files reports missing", () => {
    const item = row(build([]).items, "audit_platform_tilesets");
    expect(item.status).toBe("missing");
    expect(item.countLabel).toBe("0/4 zestawów");
  });
});

describe("buildAssetReadinessAudit prop row", () => {
  test("no prop files reports missing", () => {
    const item = row(build([]).items, "audit_decor_props");
    expect(item.status).toBe("missing");
    expect(item.countLabel).toMatch(/^0\/6 rekw\./);
  });

  test("partial prop files report partial", () => {
    const item = row(build([], [{ id: "wall_torch", hi8: true, meta: true }]).items, "audit_decor_props");
    expect(item.status).toBe("partial");
    expect(item.countLabel).toMatch(/^0\/6 rekw\./);
  });
});
