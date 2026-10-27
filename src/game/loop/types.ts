import { GameAudioEngine } from "@game/engine/audioEngine";
import { GameInputEngine } from "./input";
import { GamePhysicsEngine } from "../physics/physics";
import { ICollisionEngine } from "../physics/collisions";
import { ICombatSystem } from "../engine/combatSystem";
import { IEnemyAISystem } from "../engine/enemyAISystem";
import { INarrationSystem } from "../engine/narrationSystem";
import { IPlayerController } from "../engine/playerController";
import { DebugCheatsController } from "../debug/debugCheatsController";
import { IPlayerCommandController } from "../controllers/playerCommandController";
import { ILevelLifecycleManager } from "../locations/levelLifecycleManager";
import { IEnvironmentCollisionSystem } from "../physics/environmentCollisionSystem";
import { LoopCircuitBreaker } from "./loopCircuitBreaker";
import { GameEventBus } from "../engine/eventBus";
import { ILogger } from "@/lib/logger";
import { gameSave } from "../logic/save";

/**
 * Dependency container for GameEngine (Dependency Inversion Principle - DIP).
 */
export interface IGameDependencies {
  audio?: GameAudioEngine;
  inputs?: GameInputEngine;
  physics?: GamePhysicsEngine;
  collisions?: ICollisionEngine;
  combat?: ICombatSystem;
  enemyAI?: IEnemyAISystem;
  narration?: INarrationSystem;
  playerController?: IPlayerController;
  saveManager?: typeof gameSave;
  debugCheats?: DebugCheatsController;
  playerCommands?: IPlayerCommandController;
  levelManager?: ILevelLifecycleManager;
  environmentCollisions?: IEnvironmentCollisionSystem;
  logger?: ILogger;
  circuitBreaker?: LoopCircuitBreaker;
  eventBus?: GameEventBus;
}
