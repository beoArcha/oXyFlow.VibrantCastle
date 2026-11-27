import { Player, Enemy, Entity, Projectile, GameSettings } from "@game/types";
import { CameraManager } from "../engine/cameraManager";
import { ParticleSystem } from "../engine/particleSystem";
import { GameRenderer } from "../renderer/renderer";
import { LocationDefinition } from "../locations";
import { fpsManager } from "../engine/fpsManager";
import { debugManager } from "../debug/debugManager";
import { defaultLocationAssetLifecycle } from "../locations/locationAssetLifecycle";

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

const FPS_INFO_BUFFER = {
  targetFps: 60,
  measuredFps: 60,
  showFps: false,
};

/**
 * Executes decoupled Canvas 2D scene rendering pass with camera tracking and sub-pixel interpolation.
 */
export function renderEngineFrame(host: IEngineFrameRenderHost, interpolationAlpha: number = 1.0): void {
  const renderer = host.getRenderer();
  if (!renderer) return;

  // Idempotent (string compare): starts layer preload/eviction on any location switch path.
  if (host.currentLocation) {
    void defaultLocationAssetLifecycle.enterLocation(host.currentLocation.id);
  }

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

  FPS_INFO_BUFFER.targetFps = fpsManager.getTargetFps();
  FPS_INFO_BUFFER.measuredFps = fpsManager.getMeasuredFps();
  FPS_INFO_BUFFER.showFps = !!host.settings.display.showFpsCounter;

  renderer.render(
    host.players,
    host.enemies,
    host.entities,
    host.projectiles,
    host.particleSystem.getParticles(),
    cameraState,
    host.levelWidth,
    host.levelHeight,
    host.currentLocation,
    host.settings.language,
    continuousTick,
    FPS_INFO_BUFFER
  );
}
