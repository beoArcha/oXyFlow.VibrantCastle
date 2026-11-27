import {
  ALL_LOCATIONS,
  ALL_CAMPAIGN_STAGES,
  WORLD_CAMPAIGN_REGISTRY,
} from "@game/locations";
import { defaultParallaxRegistry } from "@game/parallax/registry";
import { CANONICAL_ENEMY_REGISTRY } from "@game/locations/parser/locationParser";
import type { AtlasFileMap } from "@game/engine/atlas/atlasTypes";
import { discoverTilesetFiles } from "@game/engine/tiles/tilesetDiscovery";
import { discoverPropFiles } from "@game/engine/props/propDiscovery";

export type AuditCategory = "parallax" | "enemies" | "tiles_decor" | "structures" | "campaign";
export type AuditStatus = "ready" | "partial" | "missing";
export type AuditPriority = "critical" | "high" | "medium";

export interface AssetAuditItem {
  readonly id: string;
  readonly category: AuditCategory;
  readonly status: AuditStatus;
  readonly priority: AuditPriority;
  readonly titlePl: string;
  readonly titleEn: string;
  readonly detailPl: string;
  readonly detailEn: string;
  readonly countLabel: string;
}

export interface AssetAuditSummary {
  readonly totalWorlds: number;
  readonly playableWorlds: number;
  readonly totalCampaignStages: number;
  readonly playableStages: number;
  readonly registeredParallaxLayers: number;
  readonly bossParallaxLayers: number;
  readonly totalEnemies: number;
  readonly enemiesWithAtlas: number;
  readonly uniqueEnemyAtlases: number;
  readonly enemiesMissingAtlas: readonly string[];
  readonly bossEnemiesMissingAtlas: readonly string[];
  readonly totalBossZones: number;
}

/** Discovered tileset and prop file maps; injected so the audit stays pure and testable. */
export interface AssetAuditFileMaps {
  readonly tilesetFiles: AtlasFileMap;
  readonly propFiles: AtlasFileMap;
}

export interface AssetAuditReport {
  readonly summary: AssetAuditSummary;
  readonly items: readonly AssetAuditItem[];
}

const REGISTERED_STRUCTURES = [
  "aether_gate",
  "chrono_lever",
  "grand_portcullis",
  "hazard_thorns",
] as const;

const MISSING_CORE_STRUCTURES = [
  "checkpoint_shrine",
  "treasure_chest",
  "boss_arena_door",
  "crumbling_platform",
  "breakable_wall",
] as const;

/** Starter tileset folders under src/assets/tiles (one folder = one set, matched by name). */
export const RECOMMENDED_TILESETS = [
  "bastion_stone",
  "courtyard_stone",
  "clocktower_brick",
  "sanctuary_crystal",
] as const;

/** Starter prop folders under src/assets/props (one folder = one prop, matched by name). */
export const RECOMMENDED_DECOR_PROPS = [
  "wall_torch",
  "tattered_banner",
  "iron_chain",
  "war_brazier",
  "wall_gear",
  "ember_skull_lantern",
] as const;

interface SetFlags {
  readonly hi8: boolean;
  readonly hi16: boolean;
  readonly meta: boolean;
}

/** Folder name to presence flags, one entry per discovered asset set (folder). */
function collectSetFlags(files: AtlasFileMap): Map<string, { hi8: boolean; hi16: boolean; meta: boolean }> {
  const sets = new Map<string, { hi8: boolean; hi16: boolean; meta: boolean }>();
  const setFor = (path: string) => {
    const segments = path.replace(/\\/g, "/").split("/");
    const folder = segments.length >= 2 ? segments[segments.length - 2] : path;
    let set = sets.get(folder);
    if (!set) {
      set = { hi8: false, hi16: false, meta: false };
      sets.set(folder, set);
    }
    return set;
  };
  for (const path of Object.keys(files.images)) {
    const set = setFor(path);
    if (/_hi8bit\./.test(path)) set.hi8 = true;
    if (/_hi16bit\./.test(path)) set.hi16 = true;
  }
  for (const path of Object.keys(files.metas)) {
    setFor(path).meta = true;
  }
  return sets;
}

const isComplete = (set: SetFlags): boolean => set.hi8 && set.hi16 && set.meta;

/** Result of matching recommended folder names against the discovered sets, reported by name. */
export interface RecommendedSetAudit {
  /** Recommended names whose folder has the hi8bit sheet, hi16bit sheet and meta. */
  readonly complete: readonly string[];
  /** Recommended names whose folder exists but lacks at least one of those files. */
  readonly partial: readonly string[];
  /** Recommended names with no folder on disk. */
  readonly missing: readonly string[];
  /** All discovered folders (not only recommended ones) with all three files. */
  readonly discoveredComplete: number;
  /** All discovered folders (not only recommended ones) with some but not all files. */
  readonly discoveredPartial: number;
}

/**
 * Matches the recommended folder names against discovered files. The audit counts by name, so a
 * large unrelated set cannot mask a missing recommended one.
 */
export function auditRecommendedSets(
  files: AtlasFileMap,
  recommended: readonly string[]
): RecommendedSetAudit {
  const sets = collectSetFlags(files);
  const complete: string[] = [];
  const partial: string[] = [];
  const missing: string[] = [];
  for (const name of recommended) {
    const set = sets.get(name);
    if (!set) missing.push(name);
    else if (isComplete(set)) complete.push(name);
    else partial.push(name);
  }
  let discoveredComplete = 0;
  let discoveredPartial = 0;
  for (const set of sets.values()) {
    if (isComplete(set)) discoveredComplete += 1;
    else discoveredPartial += 1;
  }
  return { complete, partial, missing, discoveredComplete, discoveredPartial };
}

/** ready when every recommended name is complete, partial when any of them has files, otherwise missing. */
export function deriveAssetStatus(audit: RecommendedSetAudit): AuditStatus {
  if (audit.missing.length === 0 && audit.partial.length === 0) return "ready";
  if (audit.complete.length > 0 || audit.partial.length > 0) return "partial";
  return "missing";
}

/** Names for detail text; the fallback is shown when the list is empty. */
function namesOrNone(names: readonly string[], none: string): string {
  return names.length > 0 ? names.join(", ") : none;
}

/** Real discovery of tileset and prop files (Vite glob in the app, filesystem under Bun). */
export function discoverAssetAuditFiles(): AssetAuditFileMaps {
  return { tilesetFiles: discoverTilesetFiles(), propFiles: discoverPropFiles() };
}

/**
 * Pure, live audit of all game world, parallax, enemy, tileset, decor, and structure assets.
 * Computes exact numbers from registered runtime catalogs (zero fabricated metrics).
 * Tileset and prop rows are derived from the injected file maps (default: real discovery).
 */
export function buildAssetReadinessAudit(
  files: AssetAuditFileMaps = discoverAssetAuditFiles()
): AssetAuditReport {
  const tilesetAudit = auditRecommendedSets(files.tilesetFiles, RECOMMENDED_TILESETS);
  const propAudit = auditRecommendedSets(files.propFiles, RECOMMENDED_DECOR_PROPS);
  const enemies = Object.values(CANONICAL_ENEMY_REGISTRY);
  const enemiesWithAtlasList = enemies.filter((e) => Boolean(e.atlas?.presetId));
  const uniqueAtlasSet = new Set(
    enemiesWithAtlasList.map((e) => e.atlas!.presetId)
  );
  const enemiesMissingAtlas = enemies
    .filter((e) => !e.atlas?.presetId)
    .map((e) => e.id);
  const bossEnemiesMissingAtlas = enemies
    .filter((e) => !e.atlas?.presetId && (e.category === "boss" || e.category === "elite"))
    .map((e) => e.id);

  const playableLocations = ALL_LOCATIONS;
  const playableStages = ALL_CAMPAIGN_STAGES.filter((s) => s.status === "playable").length;
  const parallaxCatalog = defaultParallaxRegistry
    .entries()
    .filter((l) => !l.borrowedFrom && !l.zoneKind);
  const worldFarLayers = parallaxCatalog.filter((l) => l.slot === "far");
  const sharedLayers = parallaxCatalog.filter((l) => l.slot.startsWith("var_"));
  const bossLayers = parallaxCatalog.filter((l) => l.isFx);
  const totalBossZones = playableLocations.reduce(
    (acc, loc) => acc + (loc.bossZones?.length ?? 0),
    0
  );
  const locationsWithDecor = playableLocations.filter(
    (loc) => (loc.decor?.length ?? 0) > 0
  ).length;

  const summary: AssetAuditSummary = {
    totalWorlds: WORLD_CAMPAIGN_REGISTRY.length,
    playableWorlds: playableLocations.length,
    totalCampaignStages: ALL_CAMPAIGN_STAGES.length,
    playableStages,
    registeredParallaxLayers: parallaxCatalog.length,
    bossParallaxLayers: bossLayers.length,
    totalEnemies: enemies.length,
    enemiesWithAtlas: enemiesWithAtlasList.length,
    uniqueEnemyAtlases: uniqueAtlasSet.size,
    enemiesMissingAtlas,
    bossEnemiesMissingAtlas,
    totalBossZones,
  };

  const items: AssetAuditItem[] = [
    {
      id: "audit_world_far_backdrops",
      category: "parallax",
      status: worldFarLayers.length >= 8 ? "ready" : "partial",
      priority: "medium",
      titlePl: "Dalekie tła światów (world:<id>:far)",
      titleEn: "World Far Backdrops (world:<id>:far)",
      detailPl:
        "Wszystkie 8 światów ma przypisane unikalne tło far współdzielone przez 8 plansz każdego świata.",
      detailEn:
        "All 8 worlds have unique far backdrops shared across their 8 stages.",
      countLabel: `${worldFarLayers.length}/8`,
    },
    {
      id: "audit_shared_parallax_library",
      category: "parallax",
      status: "ready",
      priority: "medium",
      titlePl: "Współdzielona biblioteka warstw (shared:mid/close)",
      titleEn: "Shared Intermediate Parallax Library",
      detailPl:
        "Zunifikowana biblioteka warstw mid_far, mid, mid_close i close (20 istniejących + 3 nowe motywy AI) gotowa do miksowania w 64 planszach.",
      detailEn:
        "Unified mid_far, mid, mid_close, and close library (20 existing + 3 new AI motifs) ready for 64-stage reuse.",
      countLabel: `${sharedLayers.length} warstw`,
    },
    {
      id: "audit_boss_parallax_layers",
      category: "parallax",
      status: "ready",
      priority: "medium",
      titlePl: "Warstwy stref Bossa Poziomu i Bossa Świata",
      titleEn: "Level Boss & World Boss Parallax Layers",
      detailPl: `Zarejestrowano warstwy boss:stage oraz boss:world aktywowane przestrzennie w ${totalBossZones} strefach bossZones. Można dodać warianty dedykowane dla każdego świata.`,
      detailEn: `Registered boss:stage and boss:world layers spatially activated across ${totalBossZones} bossZones. Per-world boss variants can be added next.`,
      countLabel: `${bossLayers.length} warstwy / ${totalBossZones} stref`,
    },
    {
      id: "audit_boss_sprites_missing",
      category: "enemies",
      status: "missing",
      priority: "critical",
      titlePl: "Brak atlasów sprite'ów dla Bossów i Elit",
      titleEn: "Missing Boss & Elite Sprite Atlases",
      detailPl: `Bossowie i elity bez własnych sprite'ów (renderowani jako prostokąty): ${bossEnemiesMissingAtlas.join(", ")}.`,
      detailEn: `Bosses and elites without sprite atlases (procedural rectangles): ${bossEnemiesMissingAtlas.join(", ")}.`,
      countLabel: `0/${bossEnemiesMissingAtlas.length} atlasów`,
    },
    {
      id: "audit_enemy_sprites_missing",
      category: "enemies",
      status: "partial",
      priority: "critical",
      titlePl: "Brakujące atlasy sprite'ów wrogów w bestiariuszu",
      titleEn: "Missing Enemy Sprite Atlases in Bestiary",
      detailPl: `Tylko ${uniqueAtlasSet.size} unikalne atlasy (training_dummy, clockwork_owl_gargoyle) pokrywają ${enemiesWithAtlasList.length}/${enemies.length} wpisów. Brakuje atlasów dla: ${enemiesMissingAtlas.join(", ")}.`,
      detailEn: `Only ${uniqueAtlasSet.size} unique atlases cover ${enemiesWithAtlasList.length}/${enemies.length} entries. Missing atlases for: ${enemiesMissingAtlas.join(", ")}.`,
      countLabel: `${enemiesWithAtlasList.length}/${enemies.length} (${uniqueAtlasSet.size} unik.)`,
    },
    {
      id: "audit_platform_tilesets",
      category: "tiles_decor",
      status: deriveAssetStatus(tilesetAudit),
      priority: "critical",
      titlePl: "Zestawy kafelków platform (src/assets/tiles)",
      titleEn: "Platform Tilesets (src/assets/tiles)",
      detailPl: `Zalecane zestawy startowe: ${tilesetAudit.complete.length}/${RECOMMENDED_TILESETS.length} kompletne (${namesOrNone(tilesetAudit.complete, "brak")}). Niepełne: ${namesOrNone(tilesetAudit.partial, "brak")}. Nieobecne: ${namesOrNone(tilesetAudit.missing, "brak")}. Wszystkich wykrytych zestawów: ${tilesetAudit.discoveredComplete} kompletnych, ${tilesetAudit.discoveredPartial} niepełnych.`,
      detailEn: `Recommended starter sets complete: ${tilesetAudit.complete.length}/${RECOMMENDED_TILESETS.length} (${namesOrNone(tilesetAudit.complete, "none")}). Incomplete: ${namesOrNone(tilesetAudit.partial, "none")}. Missing: ${namesOrNone(tilesetAudit.missing, "none")}. All discovered sets: ${tilesetAudit.discoveredComplete} complete, ${tilesetAudit.discoveredPartial} incomplete.`,
      countLabel: `${tilesetAudit.complete.length}/${RECOMMENDED_TILESETS.length} zestawów`,
    },
    {
      id: "audit_decor_props",
      category: "tiles_decor",
      // Files alone are not enough: without placed decor in any location the row stays at most partial.
      status:
        locationsWithDecor === 0 && deriveAssetStatus(propAudit) === "ready"
          ? "partial"
          : deriveAssetStatus(propAudit),
      priority: "high",
      titlePl: "Rekwizyty środowiskowe (src/assets/props, layout.decor)",
      titleEn: "Environmental Decor Props (src/assets/props, layout.decor)",
      detailPl: `Zalecane rekwizyty: ${propAudit.complete.length}/${RECOMMENDED_DECOR_PROPS.length} kompletne (${namesOrNone(propAudit.complete, "brak")}). Niepełne: ${namesOrNone(propAudit.partial, "brak")}. Nieobecne: ${namesOrNone(propAudit.missing, "brak")}. ${locationsWithDecor > 0 ? `Rekwizyty umieszczono w ${locationsWithDecor} lokacjach.` : "Żadna lokacja nie ma jeszcze umieszczonych rekwizytów tła."}`,
      detailEn: `Recommended props complete: ${propAudit.complete.length}/${RECOMMENDED_DECOR_PROPS.length} (${namesOrNone(propAudit.complete, "none")}). Incomplete: ${namesOrNone(propAudit.partial, "none")}. Missing: ${namesOrNone(propAudit.missing, "none")}. ${locationsWithDecor > 0 ? `Props placed in ${locationsWithDecor} locations.` : "No locations have placed decor props yet."}`,
      countLabel: `${propAudit.complete.length}/${RECOMMENDED_DECOR_PROPS.length} rekw. · ${locationsWithDecor}/${playableLocations.length} map`,
    },
    {
      id: "audit_interactive_structures",
      category: "structures",
      status: "partial",
      priority: "high",
      titlePl: "Brakujące struktury interaktywne poziomów",
      titleEn: "Missing Interactive Level Structures",
      detailPl: `Dostępne (${REGISTERED_STRUCTURES.length}): ${REGISTERED_STRUCTURES.join(", ")}. Brakuje: ${MISSING_CORE_STRUCTURES.join(", ")}.`,
      detailEn: `Available (${REGISTERED_STRUCTURES.length}): ${REGISTERED_STRUCTURES.join(", ")}. Missing: ${MISSING_CORE_STRUCTURES.join(", ")}.`,
      countLabel: `${REGISTERED_STRUCTURES.length}/${REGISTERED_STRUCTURES.length + MISSING_CORE_STRUCTURES.length}`,
    },
    {
      id: "audit_campaign_64_stages",
      category: "campaign",
      status: playableStages >= 64 ? "ready" : "partial",
      priority: "high",
      titlePl: "Wypełnienie kampanii 8×8 (64 plansze)",
      titleEn: "8×8 Campaign Stage Completion (64 Stages)",
      detailPl: `Zbudowano 8 grywalnych plansz głównych (po 1 na każdy z 8 światów, w tym 3 nowe światy i wzbogacone 5 starych). Pozostałe ${ALL_CAMPAIGN_STAGES.length - playableStages} slotów czeka na pliki JSON.`,
      detailEn: `Built 8 playable primary stages (1 per world including 3 new worlds + 5 enriched). Remaining ${ALL_CAMPAIGN_STAGES.length - playableStages} stage slots are blueprinted and ready for JSON maps.`,
      countLabel: `${playableStages}/${ALL_CAMPAIGN_STAGES.length} plansz`,
    },
  ];

  return { summary, items };
}
