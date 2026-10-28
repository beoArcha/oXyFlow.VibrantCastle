import { useEffect, useRef } from "react";
import gameEngine from "@game/loop/engine";

export interface EngineSubscribable {
  registerStateListener: (cb: () => void) => () => void;
}

/**
 * Reusable composition hook to subscribe to game engine lifecycle and state notifications.
 *
 * Guarantees proper unbinding on unmount, handles engine instance updates,
 * and maintains a stable callback reference across renders to prevent unnecessary re-subscription cycles.
 */
export function useEngineSubscription(
  onUpdate: () => void,
  engine: EngineSubscribable = gameEngine
): void {
  const onUpdateRef = useRef(onUpdate);
  onUpdateRef.current = onUpdate;

  useEffect(() => {
    let isMounted = true;
    if (!engine || typeof engine.registerStateListener !== "function") return;

    const unsubscribe = engine.registerStateListener(() => {
      if (isMounted) {
        onUpdateRef.current();
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [engine]);
}
