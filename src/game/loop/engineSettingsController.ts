import {
  GameSettings,
  TargetFps,
  AssetQuality,
  AspectRatioMode,
  ScalingFilterMode,
  SupportedLanguage,
} from "@game/types";
import { GameAudioEngine } from "@game/engine/audioEngine";
import { INarrationSystem } from "@game/engine/narrationSystem";
import { fpsManager } from "@game/engine/fpsManager";
import defaultSettingsJson from "@data/defaults/defaultSettings.json";

export interface IEngineSettingsContext {
  audio: GameAudioEngine;
  narration: INarrationSystem;
  onHardwareAccelerationChanged(enabled: boolean): void;
  onTwoPlayerChanged(enabled: boolean): void;
  onPrimaryCharacterChanged?(characterId: "valen" | "aurelia"): void;
  getPlayerCount(): number;
  notifyStateChanged(): void;
}

/**
 * Manages mutable game settings, synchronizing audio volumes, display attributes,
 * rendering hardware acceleration, and language localization.
 */
export class EngineSettingsController {
  public readonly settings: GameSettings;

  constructor(private readonly context: IEngineSettingsContext) {
    this.settings = {
      language: defaultSettingsJson.language as SupportedLanguage,
      volumeMusic: defaultSettingsJson.volumeMusic,
      volumeSFX: defaultSettingsJson.volumeSFX,
      isTwoPlayer: defaultSettingsJson.isTwoPlayer,
      primaryCharacter: "valen",
      display: {
        aspectRatio: defaultSettingsJson.display.aspectRatio as AspectRatioMode,
        scalingFilter: defaultSettingsJson.display.scalingFilter as ScalingFilterMode,
        assetQuality: defaultSettingsJson.display.assetQuality as AssetQuality,
        hardwareAcceleration: defaultSettingsJson.display.hardwareAcceleration,
        targetFps: (defaultSettingsJson.display.targetFps as TargetFps) || 60,
        showFpsCounter: !!defaultSettingsJson.display.showFpsCounter,
      },
    };
  }

  public setLanguage(lang: SupportedLanguage): void {
    this.settings.language = lang;
    this.context.narration.setLanguage(lang);
    this.context.notifyStateChanged();
  }

  public setTargetFps(fps: TargetFps): void {
    this.settings.display.targetFps = fps;
    fpsManager.setTargetFps(fps);
    this.context.notifyStateChanged();
  }

  public setShowFpsCounter(show: boolean): void {
    this.settings.display.showFpsCounter = show;
    this.context.notifyStateChanged();
  }

  public setHardwareAcceleration(enabled: boolean): void {
    this.settings.display.hardwareAcceleration = enabled;
    this.context.onHardwareAccelerationChanged(enabled);
    this.context.notifyStateChanged();
  }

  public setPrimaryCharacter(charId: "valen" | "aurelia"): void {
    this.settings.primaryCharacter = charId;
    this.context.onPrimaryCharacterChanged?.(charId);
    this.context.notifyStateChanged();
  }

  public applySettings(partial: Partial<GameSettings>): void {
    if (partial.volumeMusic !== undefined) {
      this.settings.volumeMusic = partial.volumeMusic;
      this.context.audio.setBGMVolume(partial.volumeMusic);
    }

    if (partial.volumeSFX !== undefined) {
      this.settings.volumeSFX = partial.volumeSFX;
      this.context.audio.setSFXVolume(partial.volumeSFX);
    }

    if (partial.language !== undefined) {
      this.settings.language = partial.language;
      this.context.narration.setLanguage(partial.language);
    }

    if (partial.primaryCharacter !== undefined) {
      this.settings.primaryCharacter = partial.primaryCharacter;
      this.context.onPrimaryCharacterChanged?.(partial.primaryCharacter);
    }

    if (partial.display) {
      this.applyDisplaySettings(partial.display);
    }

    if (partial.isTwoPlayer !== undefined) {
      this.applyTwoPlayerSetting(partial.isTwoPlayer);
    }

    this.context.notifyStateChanged();
  }

  private applyDisplaySettings(display: Partial<GameSettings["display"]>): void {
    if (display.targetFps !== undefined) {
      this.setTargetFps(display.targetFps);
    }
    if (display.showFpsCounter !== undefined) {
      this.setShowFpsCounter(display.showFpsCounter);
    }
    if (display.hardwareAcceleration !== undefined) {
      this.setHardwareAcceleration(display.hardwareAcceleration);
    }
    this.settings.display = { ...this.settings.display, ...display };
  }

  private applyTwoPlayerSetting(isTwoPlayer: boolean): void {
    const currentCount = this.context.getPlayerCount();
    if (isTwoPlayer && currentCount === 1) {
      this.context.onTwoPlayerChanged(true);
    } else if (!isTwoPlayer && currentCount > 1) {
      this.context.onTwoPlayerChanged(false);
    }
  }
}
