import { describe, it, expect } from "bun:test";
import {
  resolveCharacterPortraitVM,
  resolveCharacterSpriteVM,
  resolveCharacterProfileVM,
  resolveAtlasSheetMetaVM,
  subscribeToAssetLoader,
  preloadCharacterAssets,
} from "../characterAdapter";

describe("characterAdapter - Engine to UI Data Transformation", () => {
  describe("resolveCharacterPortraitVM", () => {
    it("resolves default main portrait for Valen with correct metadata", () => {
      const vm = resolveCharacterPortraitVM("valen", "main");

      expect(vm.characterId).toBe("valen");
      expect(vm.mood).toBe("main");
      expect(vm.isMain).toBe(true);
      expect(vm.crop).toBeUndefined();
      expect(typeof vm.src).toBe("string");
      expect(vm.src.length).toBeGreaterThan(0);
      expect(vm.alt).toContain("Valen");
    });

    it("resolves cropped emotion expression portrait when mood is specified", () => {
      const vm = resolveCharacterPortraitVM("valen", "serious");

      expect(vm.characterId).toBe("valen");
      expect(vm.mood).toBe("serious");
      expect(vm.isMain).toBe(false);
      expect(vm.crop).toBeDefined();
      if (vm.crop) {
        expect(typeof vm.crop.x).toBe("number");
        expect(typeof vm.crop.y).toBe("number");
        expect(vm.crop.width).toBeGreaterThan(0);
        expect(vm.crop.height).toBeGreaterThan(0);
      }
    });

    it("handles fallback gracefully for unknown character identity", () => {
      const vm = resolveCharacterPortraitVM("custom_warrior", "neutral");

      expect(vm.characterId).toBe("custom_warrior");
      expect(vm.alt).toContain("Custom_warrior");
    });
  });

  describe("resolveCharacterSpriteVM", () => {
    it("resolves sprite view model with frame resolution function", () => {
      const vm = resolveCharacterSpriteVM("valen", "high", "idle", 1);

      expect(vm.characterId).toBe("valen");
      expect(vm.quality).toBe("high");
      expect(vm.state).toBe("idle");
      expect(vm.tier).toBe(1);
      expect(typeof vm.getFrameForTick).toBe("function");

      const tick0 = vm.getFrameForTick(0);
      expect(tick0).toHaveProperty("frame");
      expect(typeof tick0.frameIndex).toBe("number");

      const tick60 = vm.getFrameForTick(60);
      expect(tick60).toHaveProperty("frame");
      expect(typeof tick60.frameIndex).toBe("number");
    });
  });

  describe("resolveCharacterProfileVM", () => {
    it("maps Valen profile data correctly", () => {
      const profile = resolveCharacterProfileVM("valen");

      expect(profile.characterId).toBe("valen");
      expect(profile.classTitleKey).toBe("valenClassTitle");
      expect(profile.classTagsKey).toBe("valenClassTags");
      expect(profile.accentColor).toBe("#d97706");
    });

    it("maps Aurelia profile data correctly", () => {
      const profile = resolveCharacterProfileVM("aurelia");

      expect(profile.characterId).toBe("aurelia");
      expect(profile.classTitleKey).toBe("aureliaClassTitle");
      expect(profile.classTagsKey).toBe("aureliaClassTags");
      expect(profile.accentColor).toBe("#06b6d4");
    });

    it("handles unknown character fallback", () => {
      const profile = resolveCharacterProfileVM("unknown_hero");

      expect(profile.characterId).toBe("unknown_hero");
      expect(profile.name).toBe("Unknown_hero");
      expect(profile.accentColor).toBe("#d97706");
    });
  });

  describe("resolveAtlasSheetMetaVM", () => {
    it("resolves distinct grid geometry for spritesheet and portraits", () => {
      const meta = resolveAtlasSheetMetaVM("valen", "high");

      expect(meta.spritesheetUrl.length).toBeGreaterThan(0);
      expect(meta.portraitsGridUrl.length).toBeGreaterThan(0);

      // Spritesheet grid is 12 columns x 8 rows
      expect(meta.spritesheetGrid.columns).toBe(12);
      expect(meta.spritesheetGrid.rows).toBe(8);
      expect(meta.spritesheetGrid.cellWidth).toBeGreaterThan(0);
      expect(meta.spritesheetGrid.cellHeight).toBeGreaterThan(0);

      // Portraits grid is 5 columns x 5 rows
      expect(meta.portraitsGrid.columns).toBe(5);
      expect(meta.portraitsGrid.rows).toBe(5);
      expect(meta.portraitsGrid.cellWidth).toBeGreaterThan(0);
      expect(meta.portraitsGrid.cellHeight).toBeGreaterThan(0);

      // Animation rows track list
      expect(meta.animationRows.length).toBe(8);
      expect(meta.animationRows[0].name).toBe("idle");
    });
  });

  describe("subscription and preloading adapters", () => {
    it("allows subscribing and unsubscribing cleanly", () => {
      let called = false;
      const unsubscribe = subscribeToAssetLoader(() => {
        called = true;
      });

      expect(typeof unsubscribe).toBe("function");
      unsubscribe();
      expect(called).toBe(false);
    });

    it("preloads character textures asynchronously without error", async () => {
      await expect(preloadCharacterAssets("valen", "high", 1)).resolves.toBeUndefined();
    });
  });
});
