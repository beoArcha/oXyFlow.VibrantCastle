import valenHighPng from "@assets/characters/valen/valen_level_1_high.png";
import valenMetaJson from "@assets/characters/valen/valen_meta.json";
import valenPortraitsPng from "@assets/characters/valen/valen_portraits.png";
import valenPortraitsMetaJson from "@assets/characters/valen/valen_portraits_meta.json";

import aureliaHighPng from "@assets/characters/aurelia/aurelia_level_1_high.png";
import aureliaMetaJson from "@assets/characters/aurelia/aurelia_meta.json";
import aureliaPortraitsPng from "@assets/characters/aurelia/aurelia_portraits.png";
import aureliaPortraitsMetaJson from "@assets/characters/aurelia/aurelia_portraits_meta.json";

import owlHighPng from "@assets/enemies/clockwork_owl_gargoyle/clockwork_owl_gargoyle_high.png";
import owlMetaJson from "@assets/enemies/clockwork_owl_gargoyle/clockwork_owl_gargoyle_meta.json";

import dummyHighPng from "@assets/enemies/training_dummy/training_dummy_high.png";
import dummyMetaJson from "@assets/enemies/training_dummy/training_dummy_meta.json";

import aetherGateHighPng from "@assets/structures/aether_gate/aether_gate_high.png";
import aetherGateMetaJson from "@assets/structures/aether_gate/aether_gate_meta.json";

import chronoLeverHighPng from "@assets/structures/chrono_lever/chrono_lever_high.png";
import chronoLeverMetaJson from "@assets/structures/chrono_lever/chrono_lever_meta.json";

import grandPortcullisHighPng from "@assets/structures/grand_portcullis/grand_portcullis_high.png";
import grandPortcullisMetaJson from "@assets/structures/grand_portcullis/grand_portcullis_meta.json";

import hazardThornsHighPng from "@assets/structures/hazard_thorns/hazard_thorns_high.png";
import hazardThornsMetaJson from "@assets/structures/hazard_thorns/hazard_thorns_meta.json";

export type AtlasPresetCategory =
  | "character"
  | "enemy"
  | "structure"
  | "portrait"
  | "custom";

export interface AtlasPresetMeta {
  readonly atlas: {
    readonly columns: number;
    readonly rows: number;
    readonly cellWidth?: number;
    readonly cellHeight?: number;
    readonly spacing?: number;
    readonly safeMargin?: number;
    readonly image?: string;
    readonly [key: string]: unknown;
  };
  readonly variants?: Record<
    string,
    {
      readonly cellWidth?: number;
      readonly cellHeight?: number;
      readonly sheetWidth?: number;
      readonly sheetHeight?: number;
      readonly scale?: number;
      readonly [key: string]: unknown;
    }
  >;
  readonly animations?: Record<string, unknown>;
  readonly [key: string]: unknown;
}

export interface AtlasAssetPreset {
  readonly id: string;
  readonly name: string;
  readonly category: AtlasPresetCategory;
  readonly imageSrc: string;
  readonly defaultMeta: AtlasPresetMeta;
  readonly description?: string;
  readonly tags?: readonly string[];
}

/**
 * Canonical 10 standard game atlas presets covering characters, enemies, structures, and portraits.
 */
export const ATLAS_PRESETS: readonly AtlasAssetPreset[] = [
  {
    id: "valen",
    name: "Valen (Duelist / Hero)",
    category: "character",
    imageSrc: valenHighPng,
    defaultMeta: valenMetaJson as unknown as AtlasPresetMeta,
    description: "Master Duelist & Arcanist player character spritesheet",
    tags: ["hero", "duelist", "player1", "sword"],
  },
  {
    id: "aurelia",
    name: "Aurelia (Mage / Heroine)",
    category: "character",
    imageSrc: aureliaHighPng,
    defaultMeta: aureliaMetaJson as unknown as AtlasPresetMeta,
    description: "Archmage & Astral Scholar player character spritesheet",
    tags: ["heroine", "mage", "player2", "staff"],
  },
  {
    id: "clockwork_owl_gargoyle",
    name: "Clockwork Owl Gargoyle",
    category: "enemy",
    imageSrc: owlHighPng,
    defaultMeta: owlMetaJson as unknown as AtlasPresetMeta,
    description: "Gilded clockwork sentinel enemy",
    tags: ["enemy", "flying", "clockwork", "boss"],
  },
  {
    id: "training_dummy",
    name: "Training Dummy",
    category: "enemy",
    imageSrc: dummyHighPng,
    defaultMeta: dummyMetaJson as unknown as AtlasPresetMeta,
    description: "Resilient enchanted practice dummy",
    tags: ["enemy", "dummy", "practice", "combat"],
  },
  {
    id: "aether_gate",
    name: "Aether Gate (Portal)",
    category: "structure",
    imageSrc: aetherGateHighPng,
    defaultMeta: aetherGateMetaJson as unknown as AtlasPresetMeta,
    description: "Resonant celestial portal to higher castle terraces",
    tags: ["structure", "portal", "gateway", "teleport"],
  },
  {
    id: "chrono_lever",
    name: "Chrono Lever (Actuator)",
    category: "structure",
    imageSrc: chronoLeverHighPng,
    defaultMeta: chronoLeverMetaJson as unknown as AtlasPresetMeta,
    description: "Gilded clockwork lever operating castle portcullises",
    tags: ["structure", "lever", "switch", "interactive"],
  },
  {
    id: "grand_portcullis",
    name: "Grand Portcullis (Gate)",
    category: "structure",
    imageSrc: grandPortcullisHighPng,
    defaultMeta: grandPortcullisMetaJson as unknown as AtlasPresetMeta,
    description: "Heavy gilded iron security portcullis",
    tags: ["structure", "gate", "door", "barrier"],
  },
  {
    id: "hazard_thorns",
    name: "Hazard Thorns (Spikes)",
    category: "structure",
    imageSrc: hazardThornsHighPng,
    defaultMeta: hazardThornsMetaJson as unknown as AtlasPresetMeta,
    description: "Crystalline amber floor hazard spikes",
    tags: ["structure", "hazard", "trap", "thorns"],
  },
  {
    id: "valen_portraits",
    name: "Valen Portraits (5x5)",
    category: "portrait",
    imageSrc: valenPortraitsPng,
    defaultMeta: valenPortraitsMetaJson as unknown as AtlasPresetMeta,
    description: "Valen 5x5 emotional dialogue expression grid",
    tags: ["portrait", "dialogue", "valen", "emotions"],
  },
  {
    id: "aurelia_portraits",
    name: "Aurelia Portraits (5x5)",
    category: "portrait",
    imageSrc: aureliaPortraitsPng,
    defaultMeta: aureliaPortraitsMetaJson as unknown as AtlasPresetMeta,
    description: "Aurelia 5x5 emotional dialogue expression grid",
    tags: ["portrait", "dialogue", "aurelia", "emotions"],
  },
];

export default ATLAS_PRESETS;
