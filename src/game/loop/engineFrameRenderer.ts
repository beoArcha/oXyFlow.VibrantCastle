import { Player, Enemy, Entity, Projectile, GameSettings } from "@game/types";
import { CameraManager } from "../engine/cameraManager";
import { ParticleSystem } from "../engine/particleSystem";
import { GameRenderer } from "../renderer/renderer";
import { LocationDefinition } from "../locations";
import { fpsManager } from "../engine/fpsManager";
import { debugManager } from "../debug/debugManager";

export interface IEngineFrameRenderHost {
  getRenderer(): GameRenderer | null;
  cameraManager: CameraManager;
  particleSystem: ParticleSystem;
  players: Player[];
  enemies: Enemy[];
  entities: Entity[];
  projectiles: Projectile[];
  levelWidth: number;
  levelHeight: number;
  currentLocation?: LocationDefinition;
  settings: GameSettings;
  simulationTicks: number;
  isPaused: boolean;
}

/**
 * Executes decoupled Canvas 2D scene rendering pass with camera tracking and sub-pixel interpolation.
 */
export function renderEngineFrame(host: IEngineFrameRenderHost, interpolationAlpha: number = 1.0): void {
  const renderer = host.getRenderer();
  if (!renderer) return;

  const cameraState = host.cameraManager.update(
    host.players,
    renderer.viewportWidth,
    renderer.viewportHeight,
    host.levelWidth,
    host.levelHeight
  );

  const continuousTick =
    host.simulationTicks +
    (host.isPaused ? 0 : interpolationAlpha * (debugManager.state.timeScale || 1.0));

  renderer.render(
    host.players,
    host.enemies,
    host.entities,
    host.projectiles,
    host.particleSystem.getParticles(),
    cameraState,
    host.levelWidth,
    host.levelHeight,
    host.settings.display.assetQuality,
    host.currentLocation,
    host.settings.language,
    continuousTick,
    {
      targetFps: fpsManager.getTargetFps(),
      measuredFps: fpsManager.getMeasuredFps(),
      showFps: !!host.settings.display.showFpsCounter,
    }
  );
}
