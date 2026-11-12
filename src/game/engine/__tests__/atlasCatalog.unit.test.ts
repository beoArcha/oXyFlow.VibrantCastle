import { describe, it, expect } from "bun:test";
import { readFileSync } from "node:fs";
import { buildAtlasCatalog, discoverAtlasFiles, REGISTERED_STRUCTURE_IDS } from "../atlas";
import type { AtlasFileMap } from "../atlas";

const FIXTURE_DIR = "src/game/engine/__tests__/__fixtures__/sample_golem";

function rawMeta(extra: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    entityType: "creature",
    atlas: { columns: 2, rows: 1, cellWidth: 96, cellHeight: 96 },
    animations: { idle: { row: 0, frames: 2, fps: 4 } },
    layout: { origin: { type: "feet", normalized: { x: 0.5, y: 1 } }, bodyBox: { x: 0.2, y: 0.1, w: 0.6, h: 0.9 } },
    ...extra,
  };
}

function files(images: string[], metas: string[]): AtlasFileMap {
  const imageMap: Record<string, string> = {};
  const metaMap: Record<string, unknown> = {};
  for (const path of images) imageMap[`/src/assets/${path}`] = `url:${path}`;
  for (const path of metas) metaMap[`/src/assets/${path}`] = rawMeta();
  return { images: imageMap, metas: metaMap };
}

const OPTIONS = { structureAllowList: ["aether_gate"] };

describe("buildAtlasCatalog", () => {
  it("maps hi8bit.svg to low, hi16bit.svg to mid and the original png to high", () => {
    const catalog = buildAtlasCatalog(
      files(
        ["enemies/imp/imp_hi8bit.svg", "enemies/imp/imp_hi16bit.svg", "enemies/imp/imp_high.png"],
        ["enemies/imp/imp_meta.json"]
      ),
      OPTIONS
    );

    expect(catalog).toHaveLength(1);
    const { variants } = catalog[0];
    expect(variants.low).toMatchObject({ src: "url:enemies/imp/imp_hi8bit.svg", format: "svg" });
    expect(variants.mid).toMatchObject({ src: "url:enemies/imp/imp_hi16bit.svg", format: "svg" });
    expect(variants.high).toMatchObject({ src: "url:enemies/imp/imp_high.png", format: "png" });
    expect(catalog[0].category).toBe("enemy");
  });

  it("prefers the packed png with its own meta over the original sheet", () => {
    const catalog = buildAtlasCatalog(
      files(
        ["enemies/imp/imp_high.png", "enemies/imp/imp_packed_high.png"],
        ["enemies/imp/imp_meta.json", "enemies/imp/imp_packed_meta.json"]
      ),
      OPTIONS
    );

    expect(catalog[0].variants.high?.src).toBe("url:enemies/imp/imp_packed_high.png");
  });

  it("does not use the packed png without its packed meta", () => {
    const catalog = buildAtlasCatalog(
      files(["enemies/imp/imp_high.png", "enemies/imp/imp_packed_high.png"], ["enemies/imp/imp_meta.json"]),
      OPTIONS
    );

    expect(catalog[0].variants.high?.src).toBe("url:enemies/imp/imp_high.png");
  });

  it("keeps the packed and shared metas separate per variant", () => {
    const catalog = buildAtlasCatalog(
      files(
        ["enemies/imp/imp_hi8bit.svg", "enemies/imp/imp_packed_high.png"],
        ["enemies/imp/imp_meta.json", "enemies/imp/imp_packed_meta.json"]
      ),
      OPTIONS
    );

    expect(catalog[0].variants.low?.meta).not.toBe(catalog[0].variants.high?.meta);
  });

  it("shares one parsed meta between both svg tiers", () => {
    const catalog = buildAtlasCatalog(
      files(["enemies/imp/imp_hi8bit.svg", "enemies/imp/imp_hi16bit.svg"], ["enemies/imp/imp_meta.json"]),
      OPTIONS
    );

    expect(catalog[0].variants.low?.meta).toBe(catalog[0].variants.mid?.meta);
  });

  it("follows the svg file names declared in variants.low.file and variants.mid.file", () => {
    const map = files(["enemies/imp/a.svg", "enemies/imp/b.svg"], []);
    const metas = {
      "/src/assets/enemies/imp/imp_meta.json": rawMeta({
        variants: { low: { file: "a.svg" }, mid: { file: "b.svg" } },
      }),
    };

    const catalog = buildAtlasCatalog({ images: map.images, metas }, OPTIONS);

    expect(catalog[0].variants.low?.src).toBe("url:enemies/imp/a.svg");
    expect(catalog[0].variants.mid?.src).toBe("url:enemies/imp/b.svg");
  });

  it("carries layout.bodyBox into the parsed meta", () => {
    const catalog = buildAtlasCatalog(
      files(["enemies/imp/imp_high.png"], ["enemies/imp/imp_meta.json"]),
      OPTIONS
    );

    const layout = (catalog[0].variants.high?.meta as { layout?: { bodyBox?: unknown } }).layout;
    expect(layout?.bodyBox).toEqual({ x: 0.2, y: 0.1, w: 0.6, h: 0.9 });
  });

  it("skips variants without a meta and folders without any variant", () => {
    const catalog = buildAtlasCatalog(
      files(["enemies/imp/imp_hi8bit.svg", "enemies/ghost/ghost_notes.txt.png"], []),
      OPTIONS
    );

    expect(catalog).toHaveLength(0);
  });

  it("registers every enemy folder but only allow-listed structures", () => {
    const catalog = buildAtlasCatalog(
      files(
        [
          "enemies/imp/imp_high.png",
          "structures/aether_gate/aether_gate_high.png",
          "structures/chrono_lever/chrono_lever_high.png",
          "structures/hazard_thorns/hazard_thorns_high.png",
        ],
        [
          "enemies/imp/imp_meta.json",
          "structures/aether_gate/aether_gate_meta.json",
          "structures/chrono_lever/chrono_lever_meta.json",
          "structures/hazard_thorns/hazard_thorns_meta.json",
        ]
      ),
      OPTIONS
    );

    expect(catalog.map((entry) => `${entry.category}:${entry.id}`)).toEqual([
      "structure:aether_gate",
      "enemy:imp",
    ]);
  });

  it("normalises Windows separators in file keys", () => {
    const catalog = buildAtlasCatalog(
      {
        images: { "C:\\game\\src\\assets\\enemies\\imp\\imp_high.png": "u" },
        metas: { "C:\\game\\src\\assets\\enemies\\imp\\imp_meta.json": rawMeta() },
      },
      OPTIONS
    );

    expect(catalog[0].id).toBe("imp");
  });

  it("builds the sample golem with svg low and mid tiers from the compiler output", () => {
    const prefix = "/src/assets/enemies/sample_golem";
    const catalog = buildAtlasCatalog(
      {
        images: {
          [`${prefix}/sample_golem_hi8bit.svg`]: "hi8bit",
          [`${prefix}/sample_golem_hi16bit.svg`]: "hi16bit",
        },
        metas: {
          [`${prefix}/sample_golem_meta.json`]: JSON.parse(
            readFileSync(`${FIXTURE_DIR}/sample_golem_meta.json`, "utf-8")
          ),
        },
      },
      OPTIONS
    );

    expect(catalog[0].variants.low?.src).toBe("hi8bit");
    expect(catalog[0].variants.mid?.src).toBe("hi16bit");
    expect(catalog[0].variants.high).toBeUndefined();
  });
});

describe("discoverAtlasFiles (filesystem fallback)", () => {
  it("registers the three packed legacy atlases and leaves other structures out", () => {
    const catalog = buildAtlasCatalog(discoverAtlasFiles(), { structureAllowList: REGISTERED_STRUCTURE_IDS });
    const byId = new Map(catalog.map((entry) => [entry.id, entry]));

    for (const id of ["training_dummy", "clockwork_owl_gargoyle", "aether_gate"]) {
      expect(byId.get(id)?.variants.high?.src).toContain(`${id}_packed_high.png`);
    }
    expect(byId.has("chrono_lever")).toBe(false);
    expect(byId.has("grand_portcullis")).toBe(false);
    expect(byId.has("hazard_thorns")).toBe(false);
  });
});
