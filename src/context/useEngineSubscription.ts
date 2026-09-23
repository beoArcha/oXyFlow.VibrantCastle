import { useEffect, useRef } from "react";
import gameEngine from "../game/loop/engine";

export interface EngineSubscribable {
  registerStateListener: (cb: () => void) => () => void;
}

/**
 * Reusable composition hook to subscribe to game engine lifecycle and state notifications.
 *
 * Guarantees proper unbinding on unmount, handles engine instance updates,
 * and maintains stable callback reference to prevent unnecessary unbind/rebind cycles (DRY & SRP).
 */
export function useEngineSubscription(
  onUpdate: () => void,
  engine: EngineSubscribable = gameEngine
): void {
  const onUpdateRef = useRef(onUpdate);
  onUpdateRef.current = onUpdate;

  useEffect(() => {
    if (!engine || typeof engine.registerStateListener !== "function") return;

    const unsubscribe = engine.registerStateListener(() => {
      onUpdateRef.current();
    });

    return () => {
      unsubscribe();
    };
  }, [engine]);
}
