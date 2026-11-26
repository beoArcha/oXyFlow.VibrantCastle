import { useEffect, useRef } from "react";
import defaultGameEngine, { GameEngine } from "@game/loop/engine";

/**
 * Subscribes a React component to GameEngine state listener notifications
 * while keeping the callback reference stable across renders.
 */
export function useEngineSubscription(
  callback: () => void,
  engine: GameEngine = defaultGameEngine
): void {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useEffect(() => {
    const unsubscribe = engine.registerStateListener(() => {
      callbackRef.current();
    });
    return unsubscribe;
  }, [engine]);
}

export default useEngineSubscription;
