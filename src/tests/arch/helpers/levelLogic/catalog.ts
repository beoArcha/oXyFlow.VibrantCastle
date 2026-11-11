import fs from "fs";
import path from "path";
import type { LocationJsonSchema } from "@game/locations/schema/locationSchema";
import type { LocationCatalog } from "./types";

export const LOCATIONS_DIR = path.resolve(__dirname, "../../../../data/locations");

export function loadBlueprintFile(filePath: string): LocationJsonSchema {
  return JSON.parse(fs.readFileSync(filePath, "utf-8")) as LocationJsonSchema;
}

/** Every blueprint under src/data/locations, keyed by location id. */
export function loadLocationCatalog(dir: string = LOCATIONS_DIR): LocationCatalog {
  const catalog: Record<string, LocationJsonSchema> = {};
  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".json") && !f.endsWith(".schema.json"));
  for (const file of files) {
    const bp = loadBlueprintFile(path.join(dir, file));
    catalog[bp.id] = bp;
  }
  return catalog;
}
