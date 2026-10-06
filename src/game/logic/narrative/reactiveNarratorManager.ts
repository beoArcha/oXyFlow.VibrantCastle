/**
 * Reactive Narrator Manager
 * 
 * Evaluates in-game events, manages cooldowns, session trigger caps,
 * and priorities for responsive voice/subtitle narration cues.
 */

import { NarratorQuoteSchema } from "@lib/schemas/narratorSchema";

export interface NarrativeEventContext {
  playerLevel?: number;
  hpPercentage?: number;
  locationId?: string;
  storyFlags?: Set<string>;
  currentTimeMs?: number;
}

export class ReactiveNarratorManager {
  private readonly quotes: NarratorQuoteSchema[];
  private readonly lastTriggeredAt = new Map<string, number>();
  private readonly triggerCounts = new Map<string, number>();

  constructor(quotes: NarratorQuoteSchema[]) {
    this.quotes = [...quotes];
  }

  public evaluateEvent(
    eventType: string,
    context: NarrativeEventContext = {}
  ): NarratorQuoteSchema | null {
    const now = context.currentTimeMs ?? Date.now();

    const matching = this.quotes.filter((q) => q.eventType === eventType);
    if (matching.length === 0) return null;

    const candidates = matching.filter((quote) => {
      // 1. Session cap check
      const currentCount = this.triggerCounts.get(quote.id) ?? 0;
      if (quote.maxTriggersPerSession !== undefined && currentCount >= quote.maxTriggersPerSession) {
        return false;
      }

      // 2. Cooldown check
      const lastTime = this.lastTriggeredAt.get(quote.id);
      if (lastTime !== undefined) {
        const elapsedSec = (now - lastTime) / 1000;
        if (elapsedSec < quote.cooldownSeconds) {
          return false;
        }
      }

      // 3. Conditions check
      const cond = quote.conditions;
      if (cond) {
        if (cond.minPlayerLevel !== undefined) {
          const level = context.playerLevel ?? 1;
          if (level < cond.minPlayerLevel) return false;
        }

        if (cond.hpPercentageBelow !== undefined) {
          const hp = context.hpPercentage ?? 100;
          if (hp >= cond.hpPercentageBelow) return false;
        }

        if (cond.locationId !== undefined) {
          if (context.locationId !== cond.locationId) return false;
        }

        if (cond.requiredStoryFlag !== undefined) {
          if (!context.storyFlags?.has(cond.requiredStoryFlag)) return false;
        }
      }

      return true;
    });

    if (candidates.length === 0) return null;

    // Pick candidate with highest priority
    candidates.sort((a, b) => b.priority - a.priority);
    const selected = candidates[0];

    // Record trigger
    this.lastTriggeredAt.set(selected.id, now);
    const count = this.triggerCounts.get(selected.id) ?? 0;
    this.triggerCounts.set(selected.id, count + 1);

    return selected;
  }

  public getQuoteStats(quoteId: string): { triggerCount: number; lastTriggeredAt: number | null } {
    return {
      triggerCount: this.triggerCounts.get(quoteId) ?? 0,
      lastTriggeredAt: this.lastTriggeredAt.get(quoteId) ?? null
    };
  }

  public resetSession(): void {
    this.lastTriggeredAt.clear();
    this.triggerCounts.clear();
  }
}
