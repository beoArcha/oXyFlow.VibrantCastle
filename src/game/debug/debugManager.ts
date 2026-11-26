import { Player, Enemy, Entity, Projectile, PlayerId, Vector2D } from "../types";
import { statsManager } from "../logic/stats";
import { SPELL_REGISTRY } from "../logic/magic";
import { LocationId } from "../locations";
import { BackgroundLayerTier } from "../locations/schema/locationSchema";
import { debugLogger } from "../logger/gameLogger";

export interface DebugState {
  godMode: boolean;
  infiniteMana: boolean;
  infiniteStamina: boolean;
  noClip: boolean;
  freezeAI: boolean;
  timeScale: number; // 0.25, 0.5, 1.0, 2.0, 4.0
  showHitboxes: boolean;
  showProfiler: boolean;
  clickToTeleport: boolean;
  parallaxTiers: Record<BackgroundLayerTier, boolean>;
}

export interface SpawnPreset {
  id: string;
  name: string;
  namePl: string;
  x: number;
  y: number;
}

export class DebugManager {
  private static instance: DebugManager;

  public state: DebugState = {
    godMode: false,
    infiniteMana: false,
    infiniteStamina: false,
    noClip: false,
    freezeAI: false,
    timeScale: 1.0,
    showHitboxes: false,
    showProfiler: false,
    clickToTeleport: false,
    parallaxTiers: {
      far: true,
      mid_far: true,
      mid: true,
      mid_close: true,
      close: true,
      boss_stage: true,
      boss_world: true,
    },
  };

  private listeners: Set<() => void> = new Set();

  public static getInstance(): DebugManager {
    if (!DebugManager.instance) {
      DebugManager.instance = new DebugManager();
    }
    return DebugManager.instance;
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  public notify(): void {
    this.listeners.forEach((cb) => {
      try {
        cb();
      } catch (err) {
        debugLogger.error("Error in DebugManager listener:", { listenerCount: this.listeners.size }, err);
      }
    });
  }

  public updateState(partial: Partial<DebugState>): void {
    this.state = {
      ...this.state,
      ...partial,
      parallaxTiers: {
        ...this.state.parallaxTiers,
        ...(partial.parallaxTiers || {}),
      },
    };
    this.notify();
  }

  public toggleGodMode(): boolean {
    this.state = { ...this.state, godMode: !this.state.godMode };
    this.notify();
    return this.state.godMode;
  }

  public toggleInfiniteMana(): boolean {
    this.state = { ...this.state, infiniteMana: !this.state.infiniteMana };
    this.notify();
    return this.state.infiniteMana;
  }

  public toggleInfiniteStamina(): boolean {
    this.state = { ...this.state, infiniteStamina: !this.state.infiniteStamina };
    this.notify();
    return this.state.infiniteStamina;
  }

  public toggleNoClip(): boolean {
    this.state = { ...this.state, noClip: !this.state.noClip };
    this.notify();
    return this.state.noClip;
  }

  public toggleFreezeAI(): boolean {
    this.state = { ...this.state, freezeAI: !this.state.freezeAI };
    this.notify();
    return this.state.freezeAI;
  }

  public setTimeScale(scale: number): void {
    this.state = { ...this.state, timeScale: Math.max(0.1, Math.min(5.0, scale)) };
    this.notify();
  }

  public toggleHitboxes(): boolean {
    this.state = { ...this.state, showHitboxes: !this.state.showHitboxes };
    this.notify();
    return this.state.showHitboxes;
  }

  public toggleProfiler(): boolean {
    this.state = { ...this.state, showProfiler: !this.state.showProfiler };
    this.notify();
    return this.state.showProfiler;
  }

  public toggleClickToTeleport(): boolean {
    this.state = { ...this.state, clickToTeleport: !this.state.clickToTeleport };
    this.notify();
    return this.state.clickToTeleport;
  }

  public toggleParallaxTier(tier: BackgroundLayerTier): boolean {
    this.state = {
      ...this.state,
      parallaxTiers: {
        ...this.state.parallaxTiers,
        [tier]: !this.state.parallaxTiers[tier],
      },
    };
    this.notify();
    return this.state.parallaxTiers[tier];
  }

  /**
   * Predefined checkpoints for each location in the game.
   */
  public getSpawnPresets(locationId: LocationId): SpawnPreset[] {
    switch (locationId) {
      case "courtyard":
        return [
          { id: "start", name: "Level Start", namePl: "Początek lokacji", x: 140, y: 640 },
          { id: "terrace", name: "Practice Terrace", namePl: "Taras szkoleniowy", x: 750, y: 460 },
          { id: "arcade", name: "Grand Arcade", namePl: "Arkady dziedzińca", x: 1400, y: 640 },
          { id: "gate", name: "Gate Lever", namePl: "Dźwignia bramy", x: 2350, y: 530 },
          { id: "vault", name: "Secret Vault", namePl: "Tajemny skarbiec", x: 3050, y: 190 },
          { id: "portal", name: "Goal Portal", namePl: "Portal wyjściowy", x: 3380, y: 640 },
        ];
      case "thorn_chasm":
        return [
          { id: "start", name: "Chasm Entrance", namePl: "Wejście do rozpadliny", x: 100, y: 480 },
          { id: "mid", name: "Bramble Bridge", namePl: "Most cierniowy", x: 1150, y: 440 },
          { id: "upper", name: "Canopy Route", namePl: "Górna ścieżka", x: 1220, y: 270 },
          { id: "boss", name: "Thorn Warden Arena", namePl: "Arena Strażnika Cierni", x: 2220, y: 420 },
          { id: "portal", name: "To Catacombs", namePl: "Portal do Katakumb", x: 2660, y: 420 },
        ];
      case "ashen_catacombs":
        return [
          { id: "start", name: "Ossuary Descent", namePl: "Zejście do Ossuarium", x: 110, y: 440 },
          { id: "hall", name: "Hall of Chains", namePl: "Korytarz Łańcuchów", x: 1040, y: 560 },
          { id: "crypt", name: "Ember Crypt", namePl: "Krypta Żaru", x: 1860, y: 520 },
          { id: "boss", name: "Chapel of Embers (Boss)", namePl: "Kaplica Żaru (Boss)", x: 2480, y: 460 },
        ];
      case "clocktower":
        return [
          { id: "start", name: "Clocktower Base", namePl: "Podstawa wieży zegarowej", x: 100, y: 560 },
          { id: "mid", name: "Giant Gears", namePl: "Koła zębate", x: 1100, y: 420 },
          { id: "gargoyle", name: "Gargoyle Roost", namePl: "Gniazdo gargulców", x: 1700, y: 340 },
          { id: "boss", name: "Spire Summit", namePl: "Szczyt Iglicy", x: 2200, y: 280 },
        ];
      case "alchemist_library":
        return [
          { id: "start", name: "Reading Hall", namePl: "Czytelnia Szmaragdu", x: 110, y: 540 },
          { id: "galleries", name: "Upper Galleries", namePl: "Górne Galerie", x: 1180, y: 320 },
          { id: "distillery", name: "Aether Distillery", namePl: "Destylarnia Eteru", x: 1820, y: 440 },
          { id: "boss", name: "Astrolabe Rotunda (Boss)", namePl: "Rotunda Astrolabium (Boss)", x: 2520, y: 420 },
        ];
      case "aether_sanctuary":
        return [
          { id: "start", name: "Sanctuary Steps", namePl: "Schody sanktuarium", x: 100, y: 480 },
          { id: "mid", name: "Astral Bridge", namePl: "Most astralny", x: 1200, y: 420 },
          { id: "boss", name: "Archon Altar (Boss)", namePl: "Ołtarz Archonta (Boss)", x: 2220, y: 400 },
        ];
      case "grand_bastion":
        return [
          { id: "start", name: "Bastion Gates", namePl: "Bramy Bastionu", x: 100, y: 520 },
          { id: "mid", name: "Great Rampart", namePl: "Główne mury", x: 1200, y: 480 },
          { id: "boss", name: "Commander Arena (Boss)", namePl: "Arena Komendanta (Boss)", x: 2150, y: 460 },
          { id: "portal", name: "To Eclipse Crown", namePl: "Portal do Korony Zaćmienia", x: 2800, y: 440 },
        ];
      case "eclipse_crown":
        return [
          { id: "start", name: "Obsidian Steps", namePl: "Schody Obsydianu", x: 110, y: 560 },
          { id: "spires", name: "Crimson Spires", namePl: "Karmazynowe Iglice", x: 1280, y: 440 },
          { id: "bridge", name: "Sacrificial Bridge", namePl: "Most Ofiarny", x: 2040, y: 460 },
          { id: "world_boss", name: "Eclipse Throne (World Boss)", namePl: "Tron Zaćmienia (Boss Świata)", x: 2740, y: 420 },
        ];
      default:
        return [
          { id: "start", name: "Start", namePl: "Początek", x: 100, y: 450 },
          { id: "mid", name: "Middle", namePl: "Środek", x: 1200, y: 450 },
          { id: "end", name: "End", namePl: "Koniec", x: 2300, y: 450 },
        ];
    }
  }
}

export const debugManager = DebugManager.getInstance();
