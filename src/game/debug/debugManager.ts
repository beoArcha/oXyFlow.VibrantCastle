import { Player, Enemy, Entity, Projectile, PlayerId, LocationId, Vector2D } from "../types";
import { statsManager } from "../logic/stats";
import { ITEM_REGISTRY } from "../logic/inventory";
import { SPELL_REGISTRY } from "../data/spells";
import { BackgroundLayerTier } from "../locations/schema/locationSchema";

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
        console.error("Error in DebugManager listener:", err);
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
    this.state.godMode = !this.state.godMode;
    this.notify();
    return this.state.godMode;
  }

  public toggleInfiniteMana(): boolean {
    this.state.infiniteMana = !this.state.infiniteMana;
    this.notify();
    return this.state.infiniteMana;
  }

  public toggleInfiniteStamina(): boolean {
    this.state.infiniteStamina = !this.state.infiniteStamina;
    this.notify();
    return this.state.infiniteStamina;
  }

  public toggleNoClip(): boolean {
    this.state.noClip = !this.state.noClip;
    this.notify();
    return this.state.noClip;
  }

  public toggleFreezeAI(): boolean {
    this.state.freezeAI = !this.state.freezeAI;
    this.notify();
    return this.state.freezeAI;
  }

  public setTimeScale(scale: number): void {
    this.state.timeScale = Math.max(0.1, Math.min(5.0, scale));
    this.notify();
  }

  public toggleHitboxes(): boolean {
    this.state.showHitboxes = !this.state.showHitboxes;
    this.notify();
    return this.state.showHitboxes;
  }

  public toggleProfiler(): boolean {
    this.state.showProfiler = !this.state.showProfiler;
    this.notify();
    return this.state.showProfiler;
  }

  public toggleClickToTeleport(): boolean {
    this.state.clickToTeleport = !this.state.clickToTeleport;
    this.notify();
    return this.state.clickToTeleport;
  }

  public toggleParallaxTier(tier: BackgroundLayerTier): boolean {
    this.state.parallaxTiers[tier] = !this.state.parallaxTiers[tier];
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
          { id: "spikes", name: "Jagged Pillars", namePl: "Szpiczaste filary", x: 1850, y: 400 },
          { id: "portal", name: "Exit Portal", namePl: "Portal do Bastionu", x: 2350, y: 420 },
        ];
      case "grand_bastion":
        return [
          { id: "start", name: "Bastion Gates", namePl: "Bramy Bastionu", x: 100, y: 520 },
          { id: "mid", name: "Great Rampart", namePl: "Główne mury", x: 1200, y: 480 },
          { id: "knight", name: "Bastion Knight Arena", namePl: "Arena rycerza", x: 1950, y: 460 },
          { id: "portal", name: "Spire Portal", namePl: "Portal do Iglicy", x: 2650, y: 440 },
        ];
      case "clocktower":
        return [
          { id: "start", name: "Clocktower Base", namePl: "Podstawa wieży zegarowej", x: 100, y: 560 },
          { id: "mid", name: "Giant Gears", namePl: "Koła zębate", x: 1100, y: 420 },
          { id: "gargoyle", name: "Gargoyle Roost", namePl: "Gniazdo gargulców", x: 1700, y: 340 },
          { id: "portal", name: "Tower Spire", namePl: "Szczyt wieży", x: 2200, y: 280 },
        ];
      case "aether_sanctuary":
        return [
          { id: "start", name: "Sanctuary Steps", namePl: "Schody sanktuarium", x: 100, y: 480 },
          { id: "mid", name: "Astral Bridge", namePl: "Most astralny", x: 1200, y: 420 },
          { id: "portal", name: "Celestial Altar", namePl: "Niebiański ołtarz", x: 2400, y: 400 },
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
