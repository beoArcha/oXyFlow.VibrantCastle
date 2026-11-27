import { BackgroundLayerTier, ParallaxLayerSchema } from "./schema/locationSchema";
import { LocationDefinition, WorldId } from "./types";

// Existing 5 worlds (25 high-res parallax layers)
import courtyardFarPng from "@assets/parallax/courtyard/courtyard_far_high.png";
import courtyardMidFarPng from "@assets/parallax/courtyard/courtyard_var_a_high.png";
import courtyardMidPng from "@assets/parallax/courtyard/courtyard_var_b_high.png";
import courtyardMidClosePng from "@assets/parallax/courtyard/courtyard_var_c_high.png";
import courtyardClosePng from "@assets/parallax/courtyard/courtyard_var_d_high.png";

import thornChasmFarPng from "@assets/parallax/thorn_chasm/thorn_chasm_far_high.png";
import thornChasmMidFarPng from "@assets/parallax/thorn_chasm/thorn_chasm_var_a_high.png";
import thornChasmMidPng from "@assets/parallax/thorn_chasm/thorn_chasm_var_b_high.png";
import thornChasmMidClosePng from "@assets/parallax/thorn_chasm/thorn_chasm_var_c_high.png";
import thornChasmClosePng from "@assets/parallax/thorn_chasm/thorn_chasm_var_d_high.png";

import clocktowerFarPng from "@assets/parallax/clocktower/clocktower_far_high.png";
import clocktowerMidFarPng from "@assets/parallax/clocktower/clocktower_var_a_high.png";
import clocktowerMidPng from "@assets/parallax/clocktower/clocktower_var_b_high.png";
import clocktowerMidClosePng from "@assets/parallax/clocktower/clocktower_var_c_high.png";
import clocktowerClosePng from "@assets/parallax/clocktower/clocktower_var_d_high.png";

import aetherFarPng from "@assets/parallax/aether_sanctuary/aether_sanctuary_far_high.png";
import aetherMidFarPng from "@assets/parallax/aether_sanctuary/aether_sanctuary_var_a_high.png";
import aetherMidPng from "@assets/parallax/aether_sanctuary/aether_sanctuary_var_b_high.png";
import aetherMidClosePng from "@assets/parallax/aether_sanctuary/aether_sanctuary_var_c_high.png";
import aetherClosePng from "@assets/parallax/aether_sanctuary/aether_sanctuary_var_d_high.png";

import bastionFarPng from "@assets/parallax/grand_bastion/grand_bastion_far_high.png";
import bastionMidFarPng from "@assets/parallax/grand_bastion/grand_bastion_var_a_high.png";
import bastionMidPng from "@assets/parallax/grand_bastion/grand_bastion_var_b_high.png";
import bastionMidClosePng from "@assets/parallax/grand_bastion/grand_bastion_var_c_high.png";
import bastionClosePng from "@assets/parallax/grand_bastion/grand_bastion_var_d_high.png";

// Newly generated AI backdrops for 3 new worlds, shared mid motifs, and Level/World Boss layers
import ashenCatacombsFarJpg from "@assets/parallax/ashen_catacombs/ashen_catacombs_far_high.jpg";
import alchemistLibraryFarJpg from "@assets/parallax/alchemist_library/alchemist_library_far_high.jpg";
import eclipseCrownFarJpg from "@assets/parallax/eclipse_crown/eclipse_crown_far_high.jpg";
import sharedMidCatacombArchesJpg from "@assets/parallax/ashen_catacombs/ashen_catacombs_var_b_high.jpg";
import sharedMidAlchemyShelvesJpg from "@assets/parallax/alchemist_library/alchemist_library_var_b_high.jpg";
import sharedMidObsidianSpiresJpg from "@assets/parallax/eclipse_crown/eclipse_crown_var_b_high.jpg";
import bossStageArcaneSigilJpg from "@assets/parallax/_shared/fx_sigil_high.jpg";
import bossWorldEclipseThroneJpg from "@assets/parallax/eclipse_crown/eclipse_crown_fx_throne_high.jpg";

export type ParallaxLayerNamespace = "world" | "shared" | "boss";

export interface ParallaxLayerAssetEntry {
  /** Canonical hybrid key: world:<worldId>:far | shared:<tier>:<motif> | boss:<scope>:<motif> */
  readonly key: string;
  readonly namespace: ParallaxLayerNamespace;
  readonly tier: BackgroundLayerTier;
  readonly labelPl: string;
  readonly labelEn: string;
  readonly url: string;
  readonly worldId?: WorldId;
  readonly aliases?: readonly string[];
  readonly defaultOpacity?: number;
  readonly defaultBlendMode?: GlobalCompositeOperation;
  readonly generatedByAi?: boolean;
}

/**
 * Central Hybrid Parallax Layer Registry (Open/Closed Principle).
 * - `world:<worldId>:far` — shared horizon backdrop for all 8 stages of a world.
 * - `shared:<tier>:<motif>_<variant>` — reusable intermediate layers mixed across all 64 stages.
 * - `boss:<scope>:<motif>` — dedicated spatial arena layers for Level Bosses & World Bosses.
 */
export const PARALLAX_LAYER_CATALOG: readonly ParallaxLayerAssetEntry[] = [
  // ── 8 WORLD FAR BACKDROPS (shared across 8 stages per world) ──
  {
    key: "world:courtyard:far",
    namespace: "world",
    tier: "far",
    worldId: "courtyard",
    labelPl: "W1 Niebo Dziedzińca",
    labelEn: "W1 Courtyard Sky & Citadel",
    url: courtyardFarPng,
    aliases: ["bg_far", "courtyard_far_high"],
  },
  {
    key: "world:thorn_chasm:far",
    namespace: "world",
    tier: "far",
    worldId: "thorn_chasm",
    labelPl: "W2 Otchłań Cierni",
    labelEn: "W2 Thorn Chasm Depths",
    url: thornChasmFarPng,
    aliases: ["bg_chasm_far", "thorn_chasm_far_high"],
  },
  {
    key: "world:ashen_catacombs:far",
    namespace: "world",
    tier: "far",
    worldId: "ashen_catacombs",
    labelPl: "W3 Bazylika Popiołu",
    labelEn: "W3 Ashen Catacombs Basilica",
    url: ashenCatacombsFarJpg,
    aliases: ["bg_catacombs_far", "ashen_catacombs_far"],
    generatedByAi: true,
  },
  {
    key: "world:clocktower:far",
    namespace: "world",
    tier: "far",
    worldId: "clocktower",
    labelPl: "W4 Dalekie Tryby Wieży",
    labelEn: "W4 Clocktower Distant Gears",
    url: clocktowerFarPng,
    aliases: ["bg_clocktower_far", "clocktower_far_high"],
  },
  {
    key: "world:alchemist_library:far",
    namespace: "world",
    tier: "far",
    worldId: "alchemist_library",
    labelPl: "W5 Kopuła Biblioteki Alchemika",
    labelEn: "W5 Alchemist Library Dome",
    url: alchemistLibraryFarJpg,
    aliases: ["bg_library_far", "alchemist_library_far"],
    generatedByAi: true,
  },
  {
    key: "world:aether_sanctuary:far",
    namespace: "world",
    tier: "far",
    worldId: "aether_sanctuary",
    labelPl: "W6 Nieboskłon Eteru",
    labelEn: "W6 Celestial Aether Sky",
    url: aetherFarPng,
    aliases: ["bg_aether_far", "aether_sanctuary_far_high"],
  },
  {
    key: "world:grand_bastion:far",
    namespace: "world",
    tier: "far",
    worldId: "grand_bastion",
    labelPl: "W7 Niebo Wielkiego Bastionu",
    labelEn: "W7 Grand Bastion Sky",
    url: bastionFarPng,
    aliases: ["bg_bastion_far", "grand_bastion_far_high"],
  },
  {
    key: "world:eclipse_crown:far",
    namespace: "world",
    tier: "far",
    worldId: "eclipse_crown",
    labelPl: "W8 Zaćmienie nad Koroną",
    labelEn: "W8 Solar Eclipse Over Citadel",
    url: eclipseCrownFarJpg,
    aliases: ["bg_eclipse_far", "eclipse_crown_far"],
    generatedByAi: true,
  },

  // ── SHARED MID_FAR LIBRARY ──
  {
    key: "shared:mid_far:courtyard_ramparts_a",
    namespace: "shared",
    tier: "mid_far",
    labelPl: "Odległe Mury Dziedzińca",
    labelEn: "Distant Courtyard Ramparts",
    url: courtyardMidFarPng,
    aliases: ["bg_mid_far", "courtyard_mid-far_high"],
  },
  {
    key: "shared:mid_far:chasm_cliffs_a",
    namespace: "shared",
    tier: "mid_far",
    labelPl: "Urwiska Rozpadliny",
    labelEn: "Distant Chasm Cliffs",
    url: thornChasmMidFarPng,
    aliases: ["bg_chasm_mid_far", "thorn_chasm_mid_far_high"],
  },
  {
    key: "shared:mid_far:clockwork_pendulums_a",
    namespace: "shared",
    tier: "mid_far",
    labelPl: "Zewnętrzne Wahadła",
    labelEn: "Outer Clockwork Pendulums",
    url: clocktowerMidFarPng,
    aliases: ["bg_clocktower_mid_far", "clocktower_mid_far_high"],
  },
  {
    key: "shared:mid_far:aether_aqueduct_a",
    namespace: "shared",
    tier: "mid_far",
    labelPl: "Podniebny Akwedukt",
    labelEn: "Distant Aether Aqueduct",
    url: aetherMidFarPng,
    aliases: ["bg_aether_mid_far", "aether_sanctuary_mid_far_high"],
  },
  {
    key: "shared:mid_far:bastion_walls_a",
    namespace: "shared",
    tier: "mid_far",
    labelPl: "Zewnętrzne Wały Bastionu",
    labelEn: "Outer Bastion Walls",
    url: bastionMidFarPng,
    aliases: ["bg_bastion_mid_far", "grand_bastion_mid_far_high"],
  },

  // ── SHARED MID LIBRARY ──
  {
    key: "shared:mid:courtyard_arches_a",
    namespace: "shared",
    tier: "mid",
    labelPl: "Arkady Dziedzińca",
    labelEn: "Courtyard Stone Arches",
    url: courtyardMidPng,
    aliases: ["bg_mid", "courtyard_mid_high"],
  },
  {
    key: "shared:mid:thorn_arches_a",
    namespace: "shared",
    tier: "mid",
    labelPl: "Łuki Cierniowe",
    labelEn: "Thorn Stone Arches",
    url: thornChasmMidPng,
    aliases: ["bg_chasm_mid", "thorn_chasm_mid_high"],
  },
  {
    key: "shared:mid:catacomb_arches_a",
    namespace: "shared",
    tier: "mid",
    labelPl: "Arkady Katakumb i Łańcuchy",
    labelEn: "Catacomb Ossuary Arches",
    url: sharedMidCatacombArchesJpg,
    aliases: ["bg_catacombs_mid", "shared_mid_catacomb_arches"],
    defaultOpacity: 0.56,
    defaultBlendMode: "screen",
    generatedByAi: true,
  },
  {
    key: "shared:mid:clockface_hall_a",
    namespace: "shared",
    tier: "mid",
    labelPl: "Wielka Tarcza Zegara",
    labelEn: "Great Clockface Hall",
    url: clocktowerMidPng,
    aliases: ["bg_clocktower_mid", "clocktower_mid_high"],
  },
  {
    key: "shared:mid:alchemy_shelves_a",
    namespace: "shared",
    tier: "mid",
    labelPl: "Galerie i Regały Alchemiczne",
    labelEn: "Alchemical Library Galleries",
    url: sharedMidAlchemyShelvesJpg,
    aliases: ["bg_library_mid", "shared_mid_alchemy_shelves"],
    defaultOpacity: 0.52,
    defaultBlendMode: "screen",
    generatedByAi: true,
  },
  {
    key: "shared:mid:aether_islets_a",
    namespace: "shared",
    tier: "mid",
    labelPl: "Lewitujące Wysepki",
    labelEn: "Floating Aether Islets",
    url: aetherMidPng,
    aliases: ["bg_aether_mid", "aether_sanctuary_mid_high"],
  },
  {
    key: "shared:mid:bastion_ramparts_a",
    namespace: "shared",
    tier: "mid",
    labelPl: "Wielkie Blanki Bastionu",
    labelEn: "Great Bastion Ramparts",
    url: bastionMidPng,
    aliases: ["bg_bastion_mid", "grand_bastion_mid_high"],
  },
  {
    key: "shared:mid:obsidian_spires_a",
    namespace: "shared",
    tier: "mid",
    labelPl: "Obsydianowe Iglice i Gargulce",
    labelEn: "Obsidian Rune Spires",
    url: sharedMidObsidianSpiresJpg,
    aliases: ["bg_eclipse_mid", "shared_mid_obsidian_spires"],
    defaultOpacity: 0.58,
    defaultBlendMode: "screen",
    generatedByAi: true,
  },

  // ── SHARED MID_CLOSE LIBRARY ──
  {
    key: "shared:mid_close:autumn_trees_a",
    namespace: "shared",
    tier: "mid_close",
    labelPl: "Jesienne Drzewa",
    labelEn: "Autumn Courtyard Trees",
    url: courtyardMidClosePng,
    aliases: ["bg_mid_close", "courtyard_mid-close_high"],
  },
  {
    key: "shared:mid_close:bramble_pillars_a",
    namespace: "shared",
    tier: "mid_close",
    labelPl: "Kolumny Cierni",
    labelEn: "Bramble Stone Pillars",
    url: thornChasmMidClosePng,
    aliases: ["bg_chasm_mid_close", "thorn_chasm_close_mid_high"],
  },
  {
    key: "shared:mid_close:brass_galleries_a",
    namespace: "shared",
    tier: "mid_close",
    labelPl: "Mosiężne Galerie",
    labelEn: "Brass Clockwork Galleries",
    url: clocktowerMidClosePng,
    aliases: ["bg_clocktower_mid_close", "clocktower_mid_close_high"],
  },
  {
    key: "shared:mid_close:astral_pillars_a",
    namespace: "shared",
    tier: "mid_close",
    labelPl: "Astralne Filary",
    labelEn: "Astral Runed Pillars",
    url: aetherMidClosePng,
    aliases: ["bg_aether_mid_close", "aether_sanctuary_mid_close_high"],
  },
  {
    key: "shared:mid_close:iron_battlements_a",
    namespace: "shared",
    tier: "mid_close",
    labelPl: "Żelazne Przedpiersia",
    labelEn: "Iron Fortified Battlements",
    url: bastionMidClosePng,
    aliases: ["bg_bastion_mid_close", "grand_bastion_mid_close_high"],
  },

  // ── SHARED CLOSE LIBRARY ──
  {
    key: "shared:close:stone_battlements_a",
    namespace: "shared",
    tier: "close",
    labelPl: "Kamienne Blanki Pierwszego Planu",
    labelEn: "Foreground Stone Battlements",
    url: courtyardClosePng,
    aliases: ["bg_close", "courtyard_close_high"],
  },
  {
    key: "shared:close:foreground_thorns_a",
    namespace: "shared",
    tier: "close",
    labelPl: "Ciernie Pierwszego Planu",
    labelEn: "Foreground Bramble Thorns",
    url: thornChasmClosePng,
    aliases: ["bg_chasm_close", "thorn_chasm_close_high"],
  },
  {
    key: "shared:close:foreground_cogs_a",
    namespace: "shared",
    tier: "close",
    labelPl: "Tryby Pierwszego Planu",
    labelEn: "Foreground Brass Cogs",
    url: clocktowerClosePng,
    aliases: ["bg_clocktower_close", "clocktower_close_high"],
  },
  {
    key: "shared:close:foreground_runes_a",
    namespace: "shared",
    tier: "close",
    labelPl: "Runy Pierwszego Planu",
    labelEn: "Foreground Astral Runes",
    url: aetherClosePng,
    aliases: ["bg_aether_close", "aether_sanctuary_close_high"],
  },
  {
    key: "shared:close:foreground_towers_a",
    namespace: "shared",
    tier: "close",
    labelPl: "Baszty Pierwszego Planu",
    labelEn: "Foreground Bastion Towers",
    url: bastionClosePng,
    aliases: ["bg_bastion_close", "grand_bastion_close_high"],
  },

  // ── DEDICATED BOSS ARENA LAYERS (Level Boss & World Boss) ──
  {
    key: "boss:stage:arcane_sigil_arena",
    namespace: "boss",
    tier: "boss_stage",
    labelPl: "Ołtarz Pieczęci (Boss Poziomu)",
    labelEn: "Arcane Sigil Shrine (Level Boss)",
    url: bossStageArcaneSigilJpg,
    aliases: ["boss_stage_arcane_sigil", "bg_boss_stage"],
    defaultOpacity: 0.72,
    defaultBlendMode: "screen",
    generatedByAi: true,
  },
  {
    key: "boss:world:eclipse_throne_colossus",
    namespace: "boss",
    tier: "boss_world",
    labelPl: "Tron Zaćmienia (Boss Świata)",
    labelEn: "Eclipse Throne Apse (World Boss)",
    url: bossWorldEclipseThroneJpg,
    aliases: ["boss_world_eclipse_throne", "bg_boss_world"],
    defaultOpacity: 0.88,
    defaultBlendMode: "screen",
    generatedByAi: true,
  },
];

const BY_KEY_OR_ALIAS = new Map<string, ParallaxLayerAssetEntry>();
for (const entry of PARALLAX_LAYER_CATALOG) {
  BY_KEY_OR_ALIAS.set(entry.key, entry);
  if (entry.aliases) {
    for (const alias of entry.aliases) {
      BY_KEY_OR_ALIAS.set(alias, entry);
    }
  }
}

export function resolveParallaxLayerAsset(
  keyOrAlias: string | undefined
): ParallaxLayerAssetEntry | undefined {
  if (!keyOrAlias) return undefined;
  return BY_KEY_OR_ALIAS.get(keyOrAlias);
}

/**
 * Hydrates all imageUrl / tier / blend defaults on a parsed LocationDefinition
 * using the central hybrid Parallax Layer Registry (eliminating duplicated per-location urlMaps).
 */
export function resolveLocationParallaxLayers(
  location: LocationDefinition
): LocationDefinition {
  const layers = location.parallaxBackground?.layers;
  if (!layers) return location;

  for (const layer of layers) {
    const asset =
      resolveParallaxLayerAsset(layer.layerKey) ??
      resolveParallaxLayerAsset(layer.imageUrl) ??
      resolveParallaxLayerAsset(layer.id);

    if (asset) {
      layer.imageUrl = asset.url;
      layer.layerKey = asset.key;
      if (!layer.tier) {
        layer.tier = asset.tier;
      }
      if (layer.opacity === undefined && asset.defaultOpacity !== undefined) {
        layer.opacity = asset.defaultOpacity;
      }
      if (layer.blendMode === undefined && asset.defaultBlendMode !== undefined) {
        layer.blendMode = asset.defaultBlendMode;
      }
    }
  }

  return location;
}

export function getRegisteredParallaxLayerCount(): number {
  return PARALLAX_LAYER_CATALOG.length;
}
