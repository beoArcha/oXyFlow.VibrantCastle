import {
  GameSettings,
  TargetFps,
  AssetQuality,
  ParallaxQuality,
  ResolvedParallaxQuality,
  AspectRatioMode,
  ScalingFilterMode,
  SupportedLanguage,
} from "@game/types";
import { GameAudioEngine } from "@game/engine/audioEngine";
import { INarrationSystem } from "@game/engine/narrationSystem";
import { fpsManager } from "@game/engine/fpsManager";
import type { ISpriteSourceFactory } from "@game/engine/sprites";
import {
  resolveParallaxQuality,
  downgradeParallaxQualityOnce,
  resolveFrameBudgetMsForFps,
  ParallaxFrameTimeProbe,
  type DeviceParallaxSignals,
} from "@game/parallax/parallaxQualityHeuristic";
import defaultSettingsJson from "@data/defaults/defaultSettings.json";

export interface IEngineSettingsContext {
  audio: GameAudioEngine;
  narration: INarrationSystem;
  spriteSources: ISpriteSourceFactory;
  onHardwareAccelerationChanged(enabled: boolean): void;
  onTwoPlayerChanged(enabled: boolean): void;
  onPrimaryCharacterChanged?(characterId: "valen" | "aurelia"): void;
  onParallaxQualityChanged?(quality: ResolvedParallaxQuality): void;
  initialDeviceParallaxSignals?: DeviceParallaxSignals;
  getPlayerCount(): number;
  notifyStateChanged(): void;
}

function areParallaxSignalsEqual(a: DeviceParallaxSignals, b: DeviceParallaxSignals): boolean {
  return (
    a.devicePixelRatio === b.devicePixelRatio &&
    a.hardwareConcurrency === b.hardwareConcurrency &&
    a.deviceMemory === b.deviceMemory &&
    a.screenWidth === b.screenWidth &&
    a.screenHeight === b.screenHeight &&
    Boolean(a.prefersReducedMotion) === Boolean(b.prefersReducedMotion)
  );
}

/**
 * Manages mutable game settings, synchronizing audio volumes, display attributes,
 * rendering hardware acceleration, and language localization.
 */
export class EngineSettingsController {
  public readonly settings: GameSettings;
  private resolvedParallaxQuality: ResolvedParallaxQuality;
  private deviceSignals: DeviceParallaxSignals;
  private readonly autoDowngradeProbe: ParallaxFrameTimeProbe;
  private hasProbeDowngraded = false;

  constructor(private readonly context: IEngineSettingsContext) {
    const initialParallaxQuality =
      (defaultSettingsJson.display.parallaxQuality as ParallaxQuality) || "auto";
    const initialTargetFps = (defaultSettingsJson.display.targetFps as TargetFps) || 60;
    this.deviceSignals = context.initialDeviceParallaxSignals ?? {};
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
        parallaxQuality: initialParallaxQuality,
        hardwareAcceleration: defaultSettingsJson.display.hardwareAcceleration,
        targetFps: initialTargetFps,
        showFpsCounter: !!defaultSettingsJson.display.showFpsCounter,
      },
    };
    this.autoDowngradeProbe = new ParallaxFrameTimeProbe({
      budgetMs: resolveFrameBudgetMsForFps(initialTargetFps),
    });
    this.autoDowngradeProbe.setEnabled(initialParallaxQuality === "auto");
    this.resolvedParallaxQuality = resolveParallaxQuality(initialParallaxQuality, this.deviceSignals);
    this.context.spriteSources.setQuality(this.settings.display.assetQuality);
    this.context.onParallaxQualityChanged?.(this.resolvedParallaxQuality);
  }

  public getResolvedParallaxQuality(): ResolvedParallaxQuality {
    return this.resolvedParallaxQuality;
  }

  public setDeviceParallaxSignals(signals: DeviceParallaxSignals): void {
    if (areParallaxSignalsEqual(this.deviceSignals, signals)) return;
    this.deviceSignals = signals;
    this.hasProbeDowngraded = false;
    if (this.settings.display.parallaxQuality !== "auto") return;

    this.autoDowngradeProbe.reset();
    const nextQuality = resolveParallaxQuality("auto", this.deviceSignals);
    if (nextQuality !== this.resolvedParallaxQuality) {
      this.resolvedParallaxQuality = nextQuality;
      this.context.onParallaxQualityChanged?.(nextQuality);
      this.context.notifyStateChanged();
    }
  }

  public recordAutoProbeFrame(workMs: number, nowMs: number): boolean {
    if (this.settings.display.parallaxQuality !== "auto" || this.hasProbeDowngraded) return false;
    if (!this.autoDowngradeProbe.recordFrame(workMs, nowMs)) return false;

    this.hasProbeDowngraded = true;
    const downgraded = downgradeParallaxQualityOnce(this.resolvedParallaxQuality);
    if (downgraded === this.resolvedParallaxQuality) return false;
    this.resolvedParallaxQuality = downgraded;
    this.context.onParallaxQualityChanged?.(downgraded);
    this.context.notifyStateChanged();
    return true;
  }

  public setLanguage(lang: SupportedLanguage): void {
    this.settings.language = lang;
    this.context.narration.setLanguage(lang);
    this.context.notifyStateChanged();
  }

  public setTargetFps(fps: TargetFps): void {
    this.settings.display.targetFps = fps;
    fpsManager.setTargetFps(fps);
    this.autoDowngradeProbe.setBudgetMs(resolveFrameBudgetMsForFps(fps));
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
    if (display.assetQuality !== undefined) {
      this.context.spriteSources.setQuality(display.assetQuality);
    }
    if (
      display.parallaxQuality !== undefined &&
      display.parallaxQuality !== this.settings.display.parallaxQuality
    ) {
      this.syncParallaxQualitySetting(display.parallaxQuality);
    }
    this.settings.display = { ...this.settings.display, ...display };
  }

  private syncParallaxQualitySetting(setting: ParallaxQuality): void {
    const isAuto = setting === "auto";
    this.hasProbeDowngraded = false;
    this.autoDowngradeProbe.setEnabled(isAuto);
    if (isAuto) {
      this.autoDowngradeProbe.reset();
    }
    const nextQuality = resolveParallaxQuality(setting, this.deviceSignals);
    if (nextQuality !== this.resolvedParallaxQuality) {
      this.resolvedParallaxQuality = nextQuality;
      this.context.onParallaxQualityChanged?.(nextQuality);
    }
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
