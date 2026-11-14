import { describe, it, expect } from "bun:test";
import type { AssetQuality, InputMap, Player } from "@game/types";
import { createMockPlayer } from "@test-utils";
import { CHARACTER_MANIFESTS } from "../characterManifests";
import { PlayerController } from "../playerController";
import { resolvePlayerAnimation } from "../playerAnimationState";
import { resolveAnimationFrame } from "../portraitResolver";
import type { SpriteAtlasMap, SpriteSheetTexture } from "../spriteTypes";

const HEROES = ["valen", "aurelia"] as const;
const QUALITIES: readonly AssetQuality[] = ["low", "mid", "high"];
/** step multipliers of the 120 / 60 / 30 Hz tick rates */
const STEP_MULTIPLIERS = [0.5, 1, 2] as const;

const IDLE_INPUTS: InputMap = {
  left: false,
  right: false,
  up: false,
  down: false,
  jump: false,
  action1: false,
  action2: false,
  magic1: false,
  magic2: false,
  potion1: false,
  potion2: false,
  potion3: false,
};

interface DrawnFrame {
  tick: number;
  state: string;
  frameIndex: number | undefined;
  x: number;
  y: number;
  w: number;
  h: number;
  originX: number;
  originY: number;
}

function nominalSheet(map: SpriteAtlasMap): SpriteSheetTexture {
  return { source: {} as CanvasImageSource, width: map.meta.sheetWidth, height: map.meta.sheetHeight, crisp: false };
}

/** Steps a grounded hero from the attack key press until the swing ends, sampling the drawn frame each tick. */
function sampleAttack(map: SpriteAtlasMap, characterId: Player["characterId"], stepMultiplier: number): DrawnFrame[] {
  const controller = new PlayerController();
  const player: Player = createMockPlayer({ characterId, isGrounded: true, vx: 0, vy: 0 });
  const samples: DrawnFrame[] = [];

  controller.updateResourcesAndActions(player, { ...IDLE_INPUTS, action1: true }, stepMultiplier);
  for (let tick = 0; player.isAttacking && tick < 200; tick++) {
    const { state, frameIndex } = resolvePlayerAnimation(player, map);
    const { frame } = resolveAnimationFrame(map, state, frameIndex ?? tick, nominalSheet, () => undefined);
    if (frame) samples.push({ tick, state, frameIndex, ...frame });
    else samples.push({ tick, state, frameIndex, x: NaN, y: NaN, w: 0, h: 0, originX: NaN, originY: NaN });
    controller.updateResourcesAndActions(player, IDLE_INPUTS, stepMultiplier);
  }
  return samples;
}

function isDrawable(sample: DrawnFrame, map: SpriteAtlasMap): boolean {
  const values = [sample.x, sample.y, sample.w, sample.h, sample.originX, sample.originY];
  if (!values.every(Number.isFinite)) return false;
  if (sample.w <= 0 || sample.h <= 0) return false;
  return sample.x >= 0 && sample.y >= 0 && sample.x + sample.w <= map.meta.sheetWidth + 1 && sample.y + sample.h <= map.meta.sheetHeight + 1;
}

describe("Hero attack frames", () => {
  for (const hero of HEROES) {
    for (const quality of QUALITIES) {
      for (const step of STEP_MULTIPLIERS) {
        it(`should draw a finite in-sheet attack frame on every tick when ${hero} swings at ${quality} quality with step ${step}`, () => {
          // Arrange
          const map = CHARACTER_MANIFESTS[hero].spriteMaps[quality];

          // Act
          const samples = sampleAttack(map, hero, step);

          // Assert
          expect(samples.length).toBeGreaterThan(0);
          expect(samples.filter((s) => s.state !== "attack")).toEqual([]);
          expect(samples.filter((s) => !isDrawable(s, map))).toEqual([]);
        });
      }

      it(`should visit every attack frame in order when ${hero} swings at ${quality} quality`, () => {
        // Arrange
        const map = CHARACTER_MANIFESTS[hero].spriteMaps[quality];
        const frameCount = map.animations.attack.frameCount;

        // Act
        const indices = sampleAttack(map, hero, 1).map((s) => s.frameIndex);

        // Assert
        expect([...new Set(indices)]).toEqual(Array.from({ length: frameCount }, (_, i) => i));
      });
    }
  }
});
