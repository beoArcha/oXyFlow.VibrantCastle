import { defineEnemySprite } from "../defineEnemySprite";
import baseMeta from "../../../src/assets/enemies/clockwork_owl_gargoyle/clockwork_owl_gargoyle_meta.json";
import { drawOwlHi8bit, drawOwlHi16bit } from "./helpers/clockwork_owl_art";

export default defineEnemySprite({
  id: "clockwork_owl_gargoyle",
  kind: "aerial",
  description:
    "Clockwork Owl Gargoyle. Flying brass sentinel with articulated wings and glowing cyan optics. Patrols airspace and performs precise strike attacks.",
  hitbox: { width: 62, height: 58 },
  cellScale: 1,
  animationOrder: ["fly", "attack", "hit", "death", "bestiary"],
  baseMeta,
  metaStates: {
    idle: { animation: "fly" },
    fly: { animation: "fly" },
    move: { animation: "fly" },
    hit: { animation: "hit" },
    attack: { animation: "attack" },
    death: { animation: "death" },
  },
  animations: {
    fly: { frames: 7, fps: 9, loop: true },
    attack: { frames: 7, fps: 11, loop: true },
    hit: { frames: 4, fps: 12, loop: false },
    death: { frames: 6, fps: 8, loop: false },
    bestiary: { frames: 7, fps: 1, loop: false },
  },
  draw: {
    hi8bit: (c, anim, frame) => drawOwlHi8bit(c, anim, frame),
    hi16bit: (c, anim, frame) => drawOwlHi16bit(c, anim, frame),
  },
});
