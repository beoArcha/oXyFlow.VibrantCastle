import { AtlasPresetItem, AtlasMetaDoc } from "./types";

import valenHighPng from "../../../../assets/characters/valen/valen_level_1_high.png";
import valenMetaJson from "../../../../assets/characters/valen/valen_meta.json";

import aureliaHighPng from "../../../../assets/characters/aurelia/aurelia_level_1_high.png";
import aureliaMetaJson from "../../../../assets/characters/aurelia/aurelia_meta.json";

import owlHighPng from "../../../../assets/enemies/clockwork_owl_gargoyle/clockwork_owl_gargoyle_high.png";
import owlMetaJson from "../../../../assets/enemies/clockwork_owl_gargoyle/clockwork_owl_gargoyle_meta.json";

import dummyHighPng from "../../../../assets/enemies/training_dummy/training_dummy_high.png";
import dummyMetaJson from "../../../../assets/enemies/training_dummy/training_dummy_meta.json";

import gateHighPng from "../../../../assets/structures/aether_gate/aether_gate_high.png";
import gateMetaJson from "../../../../assets/structures/aether_gate/aether_gate_meta.json";

import leverHighPng from "../../../../assets/structures/chrono_lever/chrono_lever_high.png";
import leverMetaJson from "../../../../assets/structures/chrono_lever/chrono_lever_meta.json";

import portcullisHighPng from "../../../../assets/structures/grand_portcullis/grand_portcullis_high.png";
import portcullisMetaJson from "../../../../assets/structures/grand_portcullis/grand_portcullis_meta.json";

import thornsHighPng from "../../../../assets/structures/hazard_thorns/hazard_thorns_high.png";
import thornsMetaJson from "../../../../assets/structures/hazard_thorns/hazard_thorns_meta.json";

import valenPortraitsPng from "../../../../assets/characters/valen/valen_portraits.png";
import aureliaPortraitsPng from "../../../../assets/characters/aurelia/aurelia_portraits.png";

const valenPortraitsMeta: AtlasMetaDoc = {
  characterId: "valen_portraits",
  entityType: "portrait",
  version: "1.0",
  description: "Valen 5x5 Emotion & Dialogue Portrait Matrix",
  atlas: {
    image: "valen_portraits.png",
    columns: 5,
    rows: 5,
    cellWidth: 232,
    cellHeight: 270,
    spacing: 0,
    safeMargin: 0,
    background: "transparent",
  },
  slicing: {
    method: "by_count",
    grid: {
      columns: 5,
      rows: 5,
      cellWidth: 232,
      cellHeight: 270,
      spacing: 0,
      safeMargin: 0,
    },
  },
  animations: {
    row_0_neutral_serious: { row: 0, frames: 5, fps: 2, loop: true },
    row_1_calm_confident: { row: 1, frames: 5, fps: 2, loop: true },
    row_2_angry_distant: { row: 2, frames: 5, fps: 2, loop: true },
    row_3_worried_profile: { row: 3, frames: 5, fps: 2, loop: true },
    row_4_stoic_pensive: { row: 4, frames: 5, fps: 2, loop: true },
  },
  anchor: { x: 0.5, y: 0.5 },
  layout: {
    origin: { type: "center", normalized: { x: 0.5, y: 0.5 } },
  },
};

const aureliaPortraitsMeta: AtlasMetaDoc = {
  characterId: "aurelia_portraits",
  entityType: "portrait",
  version: "1.0",
  description: "Aurelia 5x5 Emotion & Dialogue Portrait Matrix",
  atlas: {
    image: "aurelia_portraits.png",
    columns: 5,
    rows: 5,
    cellWidth: 235,
    cellHeight: 268,
    spacing: 0,
    safeMargin: 0,
    background: "transparent",
  },
  slicing: {
    method: "by_count",
    grid: {
      columns: 5,
      rows: 5,
      cellWidth: 235,
      cellHeight: 268,
      spacing: 0,
      safeMargin: 0,
    },
  },
  animations: {
    row_0_curious_focused: { row: 0, frames: 5, fps: 2, loop: true },
    row_1_radiant_smiling: { row: 1, frames: 5, fps: 2, loop: true },
    row_2_sorrow_pensive: { row: 2, frames: 5, fps: 2, loop: true },
    row_3_determined_battle: { row: 3, frames: 5, fps: 2, loop: true },
    row_4_serene_transcendent: { row: 4, frames: 5, fps: 2, loop: true },
  },
  anchor: { x: 0.5, y: 0.5 },
  layout: {
    origin: { type: "center", normalized: { x: 0.5, y: 0.5 } },
  },
};

export const ATLAS_PRESETS: AtlasPresetItem[] = [
  {
    id: "valen",
    name: "Valen (Duelist / Hero)",
    category: "character",
    imageSrc: valenHighPng,
    defaultMeta: valenMetaJson as unknown as AtlasMetaDoc,
  },
  {
    id: "aurelia",
    name: "Aurelia (Mage / Heroine)",
    category: "character",
    imageSrc: aureliaHighPng,
    defaultMeta: aureliaMetaJson as unknown as AtlasMetaDoc,
  },
  {
    id: "clockwork_owl_gargoyle",
    name: "Clockwork Owl Gargoyle",
    category: "enemy",
    imageSrc: owlHighPng,
    defaultMeta: owlMetaJson as unknown as AtlasMetaDoc,
  },
  {
    id: "training_dummy",
    name: "Training Dummy",
    category: "enemy",
    imageSrc: dummyHighPng,
    defaultMeta: dummyMetaJson as unknown as AtlasMetaDoc,
  },
  {
    id: "aether_gate",
    name: "Aether Gate (Portal)",
    category: "structure",
    imageSrc: gateHighPng,
    defaultMeta: gateMetaJson as unknown as AtlasMetaDoc,
  },
  {
    id: "chrono_lever",
    name: "Chrono Lever (Actuator)",
    category: "structure",
    imageSrc: leverHighPng,
    defaultMeta: leverMetaJson as unknown as AtlasMetaDoc,
  },
  {
    id: "grand_portcullis",
    name: "Grand Portcullis (Gate)",
    category: "structure",
    imageSrc: portcullisHighPng,
    defaultMeta: portcullisMetaJson as unknown as AtlasMetaDoc,
  },
  {
    id: "hazard_thorns",
    name: "Hazard Thorns (Spikes)",
    category: "structure",
    imageSrc: thornsHighPng,
    defaultMeta: thornsMetaJson as unknown as AtlasMetaDoc,
  },
  {
    id: "valen_portraits",
    name: "Valen Portraits (5x5)",
    category: "portrait",
    imageSrc: valenPortraitsPng,
    defaultMeta: valenPortraitsMeta,
  },
  {
    id: "aurelia_portraits",
    name: "Aurelia Portraits (5x5)",
    category: "portrait",
    imageSrc: aureliaPortraitsPng,
    defaultMeta: aureliaPortraitsMeta,
  },
];
