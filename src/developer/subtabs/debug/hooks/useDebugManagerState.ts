import { useSyncExternalStore } from "react";
import { debugManager, DebugState } from "@game/debug/debugManager";

let currentSnapshot: DebugState = { ...debugManager.state };

const subscribe = (onStoreChange: () => void): (() => void) => {
  return debugManager.subscribe(() => {
    currentSnapshot = { ...debugManager.state };
    onStoreChange();
  });
};

const getSnapshot = (): DebugState => currentSnapshot;
const getServerSnapshot = (): DebugState => currentSnapshot;

/**
 * Hook providing reactive, concurrent-safe access to debugManager state
 * using React's useSyncExternalStore primitive.
 */
export function useDebugManagerState(): DebugState {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export default useDebugManagerState;
