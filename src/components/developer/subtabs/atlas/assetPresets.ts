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
];
