import { ISectionParser } from "./ISectionParser";
import { IInteractionConfig, IInteractionTrigger, IInteractionEffects } from "../types";

export class InteractionParser implements ISectionParser<IInteractionConfig | undefined> {
  public readonly sectionName = "interaction";

  public canParse(raw: unknown): boolean {
    if (typeof raw !== "object" || raw === null) return false;
    const doc = raw as Record<string, any>;
    return !!doc.interaction;
  }

  public parse(raw: unknown): IInteractionConfig | undefined {
    if (!this.canParse(raw)) return undefined;

    const doc = raw as Record<string, any>;
    const rawInteraction = doc.interaction || {};

    const type = String(rawInteraction.type || "generic_interaction");

    let trigger: IInteractionTrigger | undefined;
    if (rawInteraction.trigger && typeof rawInteraction.trigger === "object") {
      trigger = {
        onPlayerEnterRadius: Boolean(rawInteraction.trigger.onPlayerEnterRadius),
        onPlayerInteract: Boolean(rawInteraction.trigger.onPlayerInteract),
        radius: Number(rawInteraction.trigger.radius) || 100,
      };
    }

    let effects: IInteractionEffects | undefined;
    if (rawInteraction.effects && typeof rawInteraction.effects === "object") {
      effects = { ...rawInteraction.effects };
    }

    return {
      type,
      trigger,
      effects,
    };
  }
}

export const defaultInteractionParser = new InteractionParser();
