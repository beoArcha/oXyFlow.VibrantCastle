export type GameEventType =
  | "PLAYER_DAMAGED"
  | "PLAYER_HEALED"
  | "ITEM_CONSUMED"
  | "NARRATION_TRIGGERED"
  | "LOCATION_CHANGED"
  | "STATE_SNAPSHOT"
  | "LEVEL_RESET";

export interface GameEventPayloads {
  PLAYER_DAMAGED: {
    readonly playerIndex: number;
    readonly damage: number;
    readonly currentHealth: number;
    readonly maxHealth: number;
    readonly source?: string;
  };
  PLAYER_HEALED: {
    readonly playerIndex: number;
    readonly amount: number;
    readonly currentHealth: number;
    readonly maxHealth: number;
  };
  ITEM_CONSUMED: {
    readonly playerIndex: number;
    readonly slotIndex: number;
    readonly itemId?: string;
    readonly itemType?: string;
  };
  NARRATION_TRIGGERED: {
    readonly textKey: string;
    readonly text: string;
  };
  LOCATION_CHANGED: {
    readonly locationId: string;
    readonly locationNameKey: string;
  };
  STATE_SNAPSHOT: {
    readonly isPaused: boolean;
    readonly isVictory: boolean;
    readonly isDefeat: boolean;
  };
  LEVEL_RESET: {
    readonly locationId: string;
  };
}

export type GameEventListener<T extends GameEventType> = (payload: GameEventPayloads[T]) => void;

/**
 * Strongly-typed domain event bus for decoupled engine-to-context notifications.
 * Pure TypeScript, zero UI or React dependencies.
 */
export class GameEventBus {
  private readonly listeners = new Map<GameEventType, Set<(payload: unknown) => void>>();

  public on<T extends GameEventType>(type: T, listener: GameEventListener<T>): () => void {
    let set = this.listeners.get(type);
    if (!set) {
      set = new Set();
      this.listeners.set(type, set);
    }
    const rawListener = listener as (payload: unknown) => void;
    set.add(rawListener);
    return () => this.off(type, listener);
  }

  public off<T extends GameEventType>(type: T, listener: GameEventListener<T>): void {
    const set = this.listeners.get(type);
    if (set) {
      set.delete(listener as (payload: unknown) => void);
    }
  }

  public emit<T extends GameEventType>(type: T, payload: GameEventPayloads[T]): void {
    const set = this.listeners.get(type);
    if (set && set.size > 0) {
      set.forEach((listener) => {
        try {
          listener(payload);
        } catch {
          // Prevent listener errors from breaking engine loops
        }
      });
    }
  }

  public listenerCount<T extends GameEventType>(type: T): number {
    return this.listeners.get(type)?.size ?? 0;
  }

  public clear(): void {
    this.listeners.clear();
  }
}

export const gameEventBus = new GameEventBus();
