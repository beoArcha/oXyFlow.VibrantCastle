import { describe, it, expect } from "bun:test";
import defaultControls from "@data/defaults/defaultControls.json";
import { translations } from "@i18n";

/** Display label for a KeyboardEvent.code, or null when the hint describes it collectively (WASD, Arrows). */
function labelFor(code: string): string | null {
  if (["KeyW", "KeyA", "KeyS", "KeyD"].includes(code)) return null;
  if (code.startsWith("Key")) return code.slice(3);
  if (code.startsWith("Digit")) return code.slice(5);
  if (code.startsWith("Numpad")) return `Numpad ${code.slice(6)}`;
  if (code === "Space") return "Space|Spacja"; // localized in PL
  if (code === "Enter") return code;
  return null;
}

/** Expands "Numpad 7-9" into "Numpad 7 / Numpad 8 / Numpad 9" so every key is checkable. */
function expandRanges(text: string): string {
  return text.replace(/Numpad (\d)-(\d)/g, (_, from: string, to: string) => {
    const parts: string[] = [];
    for (let n = Number(from); n <= Number(to); n++) parts.push(`Numpad ${n}`);
    return parts.join(" / ");
  });
}

function hasToken(text: string, token: string): boolean {
  return new RegExp(`(^|[^A-Za-z0-9])(?:${token})($|[^A-Za-z0-9])`).test(text);
}

const players = [
  { name: "player1", hintKey: "p1Controls", bindings: defaultControls.keyboard.player1 },
  { name: "player2", hintKey: "p2Controls", bindings: defaultControls.keyboard.player2 },
] as const;

describe("Control hints match defaultControls.json", () => {
  for (const lang of ["pl", "en"] as const) {
    const dict = translations[lang] as unknown as Record<string, string>;

    for (const player of players) {
      describe(`${lang} ${player.name}`, () => {
        const hint = expandRanges(dict[player.hintKey]);
        const codes = Object.values(player.bindings)
          .flat()
          .filter((code) => code.length > 1);
        const labels = codes.map(labelFor).filter((label): label is string => label !== null);

        it("names every default keyboard binding", () => {
          const missing = labels.filter((label) => !hasToken(hint, label));
          expect(missing).toEqual([]);
        });

        it("names no Numpad key that is not bound by default", () => {
          const mentioned = hint.match(/Numpad \d/g) ?? [];
          const unbound = mentioned.filter((label) => !labels.includes(label));
          expect(unbound).toEqual([]);
        });
      });
    }
  }
});
