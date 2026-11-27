import { defineStructureSprite } from "../defineStructureSprite";
import baseMeta from "../../../src/assets/enemies/training_dummy/training_dummy_meta.json";
import { drawDummyHi8bit, drawDummyHi16bit, type DummyAnim } from "./helpers/training_dummy_art";

export default defineStructureSprite<DummyAnim>({
  id: "training_dummy",
  description:
    "Straw training dummy with wooden cross base, leather bindings and iron helmet. Used as a passive training target. Includes gameplay animations and bestiary presentation row.",
  hitbox: { width: 52, height: 76 },
  assetCategory: "enemies",
  pngBacked: true,
  allowBottomMargin: true,
  columns: 6,
  animationOrder: ["idle", "hit", "broken", "bestiary"],
  baseMeta,
  metaStates: {
    idle: { animation: "idle" },
    hit: { animation: "hit" },
    broken: { animation: "broken" },
    death: { animation: "broken" },
    destroy: { animation: "broken" },
  },
  cellSize: {
    hi8bit: { width: 64, height: 64 },
    hi16bit: { width: 128, height: 128 },
    high: { width: 256, height: 256 },
  },
  animations: {
    idle: { frames: 6, fps: 6, loop: true },
    hit: { frames: 5, fps: 10, loop: false },
    broken: { frames: 6, fps: 8, loop: false },
    bestiary: { frames: 8, fps: 1, loop: false },
  },
  states: {
    idle: { animation: "idle" },
    hit: { animation: "hit" },
    broken: { animation: "broken" },
    death: { animation: "broken" },
    destroy: { animation: "broken" },
  },
  draw: {
    hi8bit: drawDummyHi8bit,
    hi16bit: drawDummyHi16bit,
  },
});
