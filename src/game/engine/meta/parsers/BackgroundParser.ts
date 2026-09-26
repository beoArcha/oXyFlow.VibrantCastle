import { ISectionParser } from "./ISectionParser";
import { IAtlasBackgroundConfig, BackgroundMode } from "../types";

export class BackgroundParser implements ISectionParser<IAtlasBackgroundConfig | undefined> {
  public readonly sectionName = "background";

  public canParse(raw: unknown): boolean {
    if (typeof raw !== "object" || raw === null) return false;
    const doc = raw as Record<string, any>;
    return !!doc.background || !!doc.backgroundConfig || !!doc.atlas?.background;
  }

  public parse(raw: unknown): IAtlasBackgroundConfig | undefined {
    if (typeof raw !== "object" || raw === null) return { mode: "transparent" };
    const doc = raw as Record<string, any>;

    const bgObj = doc.backgroundConfig || doc.background || doc.atlas?.background;
    if (!bgObj) return { mode: "transparent" };

    // String form: "transparent", "#000000", "black", "white"
    if (typeof bgObj === "string") {
      const lower = bgObj.trim().toLowerCase();
      if (lower === "transparent" || lower === "" || lower === "none") {
        return { mode: "transparent" };
      }
      if (lower === "black") {
        return { mode: "color", colorHex: "#000000", tolerance: 15 };
      }
      if (lower === "white") {
        return { mode: "color", colorHex: "#ffffff", tolerance: 15 };
      }
      if (lower.startsWith("#") || lower.startsWith("rgb")) {
        return { mode: "color", colorHex: bgObj, tolerance: 15 };
      }
      return { mode: "solid", colorHex: bgObj };
    }

    // Object form
    if (typeof bgObj === "object") {
      const validModes: BackgroundMode[] = ["transparent", "color", "solid"];
      const rawMode = String(bgObj.mode || "transparent");
      const mode: BackgroundMode = validModes.includes(rawMode as BackgroundMode)
        ? (rawMode as BackgroundMode)
        : "transparent";

      return {
        mode,
        colorHex: bgObj.colorHex ? String(bgObj.colorHex) : undefined,
        tolerance: bgObj.tolerance !== undefined ? Math.max(0, Math.min(100, Number(bgObj.tolerance))) : 15,
        removeAtRuntime: Boolean(bgObj.removeAtRuntime),
      };
    }

    return undefined;
  }
}

export const defaultBackgroundParser = new BackgroundParser();
