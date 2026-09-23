import { ISectionParser } from "./ISectionParser";
import { IStateMapping } from "../types";

export class StateMappingParser implements ISectionParser<IStateMapping | undefined> {
  public readonly sectionName = "states";

  public canParse(raw: unknown): boolean {
    if (typeof raw !== "object" || raw === null) return false;
    const doc = raw as Record<string, any>;
    return !!doc.states && typeof doc.states === "object";
  }

  public parse(raw: unknown): IStateMapping | undefined {
    if (!this.canParse(raw)) return undefined;

    const doc = raw as Record<string, any>;
    const rawStates = doc.states || {};

    const states: Record<string, { animation: string }> = {};

    Object.keys(rawStates).forEach((stateKey) => {
      const stateItem = rawStates[stateKey];
      if (typeof stateItem === "object" && stateItem !== null && stateItem.animation) {
        states[stateKey] = { animation: String(stateItem.animation) };
      } else if (typeof stateItem === "string") {
        states[stateKey] = { animation: stateItem };
      }
    });

    return Object.keys(states).length > 0 ? { states } : undefined;
  }
}

export const defaultStateMappingParser = new StateMappingParser();
