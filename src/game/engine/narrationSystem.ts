import { translations } from "@i18n";

export interface INarrationSystem {
  trigger(key: string, language: "pl" | "en"): boolean;
  update(dtMultiplier: number): boolean; // returns true if text changed
  getCurrentText(): string;
  setLanguage(newLang: "pl" | "en"): void;
  reset(): void;
  hasShown(key: string): boolean;
}

/**
 * Manages timed narrative subtitles, language switching, and playback tracking.
 */
export class NarrationSystem implements INarrationSystem {
  private currentText: string = "";
  private timer: number = 0;
  private shownKeys: Set<string> = new Set();
  private defaultDuration: number = 220;

  constructor(defaultDuration: number = 220) {
    this.defaultDuration = defaultDuration;
  }

  public trigger(key: string, language: "pl" | "en"): boolean {
    const dict = translations[language] as unknown as Record<string, string>;
    const text = dict[key];

    if (text) {
      this.currentText = text;
      this.timer = this.defaultDuration;
      this.shownKeys.add(key);
      return true;
    }
    return false;
  }

  public update(dtMultiplier: number): boolean {
    if (this.timer > 0) {
      this.timer = Math.max(0, this.timer - dtMultiplier);
      if (this.timer <= 0) {
        this.currentText = "";
        return true; // text cleared
      }
    }
    return false;
  }

  public getCurrentText(): string {
    return this.currentText;
  }

  public setLanguage(newLang: "pl" | "en"): void {
    if (!this.currentText) return;

    for (const key of Object.keys(translations.en)) {
      const transKey = key as keyof typeof translations.en;
      if (
        translations.pl[transKey] === this.currentText ||
        translations.en[transKey] === this.currentText
      ) {
        this.currentText = translations[newLang][transKey];
        break;
      }
    }
  }

  public reset(): void {
    this.currentText = "";
    this.timer = 0;
    this.shownKeys.clear();
  }

  public hasShown(key: string): boolean {
    return this.shownKeys.has(key);
  }
}
