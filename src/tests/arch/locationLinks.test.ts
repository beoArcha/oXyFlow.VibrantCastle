import { describe, it, expect } from "bun:test";
import fs from "fs";
import path from "path";

const locationsDir = path.resolve(__dirname, "../../data/locations");

type Json = unknown;
type LocationFile = { file: string; data: Record<string, Json> & { id?: string; spawnPoints?: Json } };

function loadLocations(): LocationFile[] {
  return fs
    .readdirSync(locationsDir)
    .filter((f) => f.endsWith(".json"))
    .sort()
    .map((file) => ({
      file,
      data: JSON.parse(fs.readFileSync(path.join(locationsDir, file), "utf8")),
    }));
}

/** Visits every object node in a JSON tree (depth-first). */
function walkObjects(node: Json, visit: (obj: Record<string, Json>) => void): void {
  if (Array.isArray(node)) {
    for (const item of node) walkObjects(item, visit);
    return;
  }
  if (node && typeof node === "object") {
    const obj = node as Record<string, Json>;
    visit(obj);
    for (const key of Object.keys(obj)) walkObjects(obj[key], visit);
  }
}

/** Collects ids of every entity found in any `solids` array, at any depth. */
function collectSolidIds(location: Json): Set<string> {
  const ids = new Set<string>();
  walkObjects(location, (obj) => {
    if (!Array.isArray(obj.solids)) return;
    walkObjects(obj.solids, (solid) => {
      if (typeof solid.id === "string") ids.add(solid.id);
    });
  });
  return ids;
}

const locations = loadLocations();
const locationsById = new Map<string, LocationFile["data"]>();
for (const loc of locations) {
  const id = typeof loc.data.id === "string" ? loc.data.id : loc.file.replace(/\.json$/, "");
  locationsById.set(id, loc.data);
}

describe("Location cross-reference integrity", () => {
  it("loads at least one location", () => {
    expect(locations.length).toBeGreaterThan(0);
  });

  describe.each(locations.map((l) => [l.file, l] as const))("%s", (_file, loc) => {
    const solidIds = collectSolidIds(loc.data);

    it("every targetGateId points to an existing solid in this location", () => {
      const missing: string[] = [];
      walkObjects(loc.data, (obj) => {
        if (typeof obj.targetGateId === "string" && !solidIds.has(obj.targetGateId)) {
          missing.push(obj.targetGateId);
        }
      });
      expect(missing).toEqual([]);
    });

    it("every portal targetLocationId/targetEntryKey resolves to an existing location entry", () => {
      const broken: string[] = [];
      walkObjects(loc.data, (obj) => {
        if (typeof obj.targetLocationId !== "string" || typeof obj.targetEntryKey !== "string") return;
        const target = locationsById.get(obj.targetLocationId);
        if (!target) {
          broken.push(`${obj.targetLocationId} (location not found)`);
          return;
        }
        const spawnPoints = target.spawnPoints as { entries?: Record<string, Json> } | undefined;
        const entries = spawnPoints?.entries ?? {};
        if (!Object.prototype.hasOwnProperty.call(entries, obj.targetEntryKey)) {
          broken.push(`${obj.targetLocationId}.${obj.targetEntryKey} (entry not found)`);
        }
      });
      expect(broken).toEqual([]);
    });
  });
});
