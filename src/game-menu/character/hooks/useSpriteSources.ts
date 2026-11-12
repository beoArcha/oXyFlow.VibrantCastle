import { useContext, useSyncExternalStore } from "react";
import { AssetQuality } from "@game/types";
import type { ISpriteSourceFactory } from "@game/engine/sprites";
import { assetLoader } from "@game/engine/assetLoader";
import { GameEngineContext } from "@context/GameEngineContext";

/**
 * Sprite source factory of the running engine. Trees rendered without an engine provider
 * (isolated previews, tests) read the default loader's factory, which the default engine also uses.
 */
export function useSpriteSources(): ISpriteSourceFactory {
  const engine = useContext(GameEngineContext);
  return engine?.spriteSources ?? assetLoader.spriteSources;
}

/** Quality currently resolved by the factory; `override` pins a tier for tooling that inspects one. */
export function useSpriteQuality(override?: AssetQuality): AssetQuality {
  const sources = useSpriteSources();
  const current = useSyncExternalStore(
    (onChange) => sources.subscribe(onChange),
    () => sources.getQuality()
  );
  return override ?? current;
}
