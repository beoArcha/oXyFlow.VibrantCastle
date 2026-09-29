import React from "react";
import { describe, it, expect, beforeEach, afterEach, mock } from "bun:test";
import { renderIntoDom, cleanupDom } from "@test-utils/domTestUtils";
import { CharacterProvider } from "../CharacterContext";
import { useCharacterPortrait } from "../useCharacterPortrait";
import { useCharacterSprite } from "../useCharacterSprite";
import { assetLoader } from "@game/engine/assetLoader";

describe("Character Module Hooks (useCharacterPortrait & useCharacterSprite)", () => {
  beforeEach(async () => {
    await cleanupDom();
  });

  afterEach(async () => {
    await cleanupDom();
  });

  describe("useCharacterPortrait", () => {
    it("resolves default character portrait from CharacterContext", async () => {
      let portraitData: any = null;

      const TestConsumer = () => {
        portraitData = useCharacterPortrait();
        return <div data-testid="resolved">{portraitData.characterId}</div>;
      };

      await renderIntoDom(
        <CharacterProvider characterId="valen" mood="main">
          <TestConsumer />
        </CharacterProvider>
      );

      expect(portraitData).not.toBeNull();
      expect(portraitData.characterId).toBe("valen");
      expect(portraitData.mood).toBe("main");
      expect(portraitData.isMain).toBe(true);
      expect(typeof portraitData.src).toBe("string");
      expect(portraitData.src.length).toBeGreaterThan(0);
      expect(portraitData.alt).toContain("Valen");
    });

    it("allows overriding characterId and mood expression", async () => {
      let portraitData: any = null;

      const TestConsumer = () => {
        portraitData = useCharacterPortrait("aurelia", "smile");
        return <div data-testid="resolved">{portraitData.characterId}</div>;
      };

      await renderIntoDom(
        <CharacterProvider characterId="valen">
          <TestConsumer />
        </CharacterProvider>
      );

      expect(portraitData.characterId).toBe("aurelia");
      expect(portraitData.mood).toBe("smile");
      expect(portraitData.alt).toContain("Aurelia");
    });

    it("handles dynamic fallback name for unknown characterId gracefully", async () => {
      let portraitData: any = null;

      const TestConsumer = () => {
        portraitData = useCharacterPortrait("custom_hero", "neutral");
        return <div>{portraitData.alt}</div>;
      };

      await renderIntoDom(<TestConsumer />);

      expect(portraitData.characterId).toBe("custom_hero");
      expect(portraitData.alt).toContain("Custom_hero");
    });

    it("subscribes to assetLoader and cleans up listener on unmount", async () => {
      let subscribeCalled = false;
      let unsubscribeCalled = false;

      const origSubscribe = assetLoader.subscribe.bind(assetLoader);
      assetLoader.subscribe = (cb: () => void) => {
        subscribeCalled = true;
        const origUnsub = origSubscribe(cb);
        return () => {
          unsubscribeCalled = true;
          origUnsub();
        };
      };

      const TestConsumer = () => {
        useCharacterPortrait("valen");
        return <div>Hook</div>;
      };

      await renderIntoDom(<TestConsumer />);
      expect(subscribeCalled).toBe(true);

      await cleanupDom();
      expect(unsubscribeCalled).toBe(true);

      assetLoader.subscribe = origSubscribe;
    });
  });

  describe("useCharacterSprite", () => {
    it("extracts sprite configuration without running continuous setState loops", async () => {
      let spriteData: any = null;
      let renderCount = 0;

      const TestConsumer = () => {
        renderCount++;
        spriteData = useCharacterSprite("valen", "high", "idle", 1, 1);
        return <div data-testid="rendered">{renderCount}</div>;
      };

      await renderIntoDom(
        <CharacterProvider characterId="valen" quality="high" tier={1}>
          <TestConsumer />
        </CharacterProvider>
      );

      expect(spriteData).not.toBeNull();
      expect(spriteData.characterId).toBe("valen");
      expect(spriteData.state).toBe("idle");
      expect(spriteData.quality).toBe("high");
      expect(spriteData.tier).toBe(1);
      expect(typeof spriteData.getFrameForTick).toBe("function");

      // Verify that initial render count is minimal (1 or 2 at mount, NOT ticking at 60Hz)
      const countAfterMount = renderCount;
      expect(countAfterMount).toBeLessThanOrEqual(2);
    });

    it("resolves sprite frames correctly via getFrameForTick", async () => {
      let spriteData: any = null;

      const TestConsumer = () => {
        spriteData = useCharacterSprite("valen", "high", "idle");
        return <div>Loaded</div>;
      };

      await renderIntoDom(<TestConsumer />);

      const frameAtTick0 = spriteData.getFrameForTick(0);
      expect(frameAtTick0).toHaveProperty("frame");
      expect(frameAtTick0).toHaveProperty("frameIndex");
      expect(typeof frameAtTick0.frameIndex).toBe("number");

      const frameAtTick30 = spriteData.getFrameForTick(30);
      expect(frameAtTick30).toHaveProperty("frame");
      expect(typeof frameAtTick30.frameIndex).toBe("number");
    });

    it("preloads textures when character, quality, or tier change", async () => {
      const preloadSpy = mock(assetLoader.preloadCharacter.bind(assetLoader));
      assetLoader.preloadCharacter = preloadSpy;

      const TestConsumer = ({ characterId }: { characterId: string }) => {
        useCharacterSprite(characterId, "mid", "run", 1, 2);
        return <div>Sprite</div>;
      };

      await renderIntoDom(<TestConsumer characterId="valen" />);
      expect(preloadSpy).toHaveBeenCalledWith("valen", "mid", 2);
    });
  });
});
