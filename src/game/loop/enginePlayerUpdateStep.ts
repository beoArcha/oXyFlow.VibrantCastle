import { Player, Projectile, InputMap } from "@game/types";
import { GameInputEngine } from "./input";
import { GamePhysicsEngine } from "../physics/physics";
import { IPlayerController } from "../engine/playerController";
import { IPlayerCommandController } from "../controllers/playerCommandController";
import { GameAudioEngine } from "@game/engine/audioEngine";
import { ParticleSystem } from "../engine/particleSystem";
import { attemptCastSpell } from "../logic/magic";
import { statsManager } from "../logic/stats";
import { debugManager } from "../debug/debugManager";

export interface IEnginePlayerUpdateContext {
  getInputs(playerId: string): InputMap;
  getPhysics(): GamePhysicsEngine;
  getPlayerController(): IPlayerController;
  getAudio(): GameAudioEngine;
  particleSystem: ParticleSystem;
  getLevelDimensions(): { width: number; height: number };
  getSpawnPoint(): { x: number; y: number };
  triggerNarration(key: string): void;
  setDefeat(val: boolean): void;
  notifyReact(): void;
  pushProjectiles(projectiles: Projectile[]): void;
  usePlayerPotion(playerIndex: number, slotIndex: number): boolean;
}

interface VitalsCacheEntry {
  health: number;
  mana: number;
  stamina: number;
  skillPoints: number;
}

/**
 * Executes per-player simulation updates: input polling, resource lifecycles,
 * kinematics, bound clamping, pit falls, and spell casting particle bursts.
 */
export class EnginePlayerUpdateStep {
  private readonly vitalsCache: Map<string, VitalsCacheEntry> = new Map();

  constructor(private readonly context: IEnginePlayerUpdateContext) {}

  public updatePlayers(players: Player[], effectiveDt: number): boolean {
    let anyPlayerAttacking = false;
    const { width: levelWidth, height: levelHeight } = this.context.getLevelDimensions();
    const spawnPoint = this.context.getSpawnPoint();

    for (let pIndex = 0; pIndex < players.length; pIndex++) {
      const player = players[pIndex];
      this.syncPlayerProgressionTier(player);

      const inputs = this.context.getInputs(player.id);
      this.applyPlayerDebugCheats(player);

      this.context.getPlayerController().updateResourcesAndActions(
        player,
        inputs,
        effectiveDt,
        this.context.getAudio()
      );

      this.updatePlayerKinematics(player, inputs, effectiveDt);

      if (player.isAttacking || player.isCasting) {
        anyPlayerAttacking = true;
      }

      this.processPotionInputs(player, inputs, pIndex);
      this.processMagicInputs(player, inputs);
      this.clampPlayerBounds(player, levelWidth);
      this.handlePitFall(player, levelHeight, spawnPoint);
    }

    return anyPlayerAttacking;
  }

  public checkAndUpdateVitals(players: Player[]): boolean {
    let changed = false;

    for (let i = 0; i < players.length; i++) {
      const p = players[i];
      const h = Math.round(p.health);
      const m = Math.round(p.mana);
      const s = Math.round(p.stamina);
      const sp = p.skillPoints;

      const cached = this.vitalsCache.get(p.id);
      if (!cached || cached.health !== h || cached.mana !== m || cached.stamina !== s || cached.skillPoints !== sp) {
        this.vitalsCache.set(p.id, { health: h, mana: m, stamina: s, skillPoints: sp });
        changed = true;
      }
    }

    return changed;
  }

  private syncPlayerProgressionTier(player: Player): void {
    const skillCount = player.unlockedSkills ? player.unlockedSkills.length : 0;
    const computedTier: 1 | 2 | 3 = skillCount >= 6 ? 3 : skillCount >= 3 ? 2 : 1;
    player.levelGroup = computedTier;
    player.characterTier = computedTier;
  }

  private applyPlayerDebugCheats(player: Player): void {
    if (debugManager.state.infiniteMana) {
      player.mana = player.maxMana;
    }
    if (debugManager.state.infiniteStamina) {
      player.stamina = player.maxStamina;
    }
    if (debugManager.state.godMode) {
      player.health = player.maxHealth;
      player.isDead = false;
    }
  }

  private updatePlayerKinematics(player: Player, inputs: InputMap, effectiveDt: number): void {
    if (debugManager.state.noClip) {
      const flySpeed = 8;
      player.vx = inputs.left ? -flySpeed : inputs.right ? flySpeed : 0;
      player.vy = inputs.up ? -flySpeed : inputs.down ? flySpeed : 0;
      player.x += player.vx * effectiveDt;
      player.y += player.vy * effectiveDt;
      player.isGrounded = false;
    } else {
      this.context.getPhysics().updatePlayer(player, inputs, effectiveDt);
    }
  }

  private processPotionInputs(player: Player, inputs: InputMap, playerIndex: number): void {
    const p1Used = inputs.potion1 && this.context.usePlayerPotion(playerIndex, 0);
    const p2Used = inputs.potion2 && this.context.usePlayerPotion(playerIndex, 1);
    const p3Used = inputs.potion3 && this.context.usePlayerPotion(playerIndex, 2);

    if (p1Used || p2Used || p3Used) {
      this.checkAndUpdateVitals([player]);
    }
  }

  private processMagicInputs(player: Player, inputs: InputMap): void {
    if (inputs.magic1 && player.magicCooldown === 0) {
      this.castSpellSlot(player, player.primarySpellId, inputs, "#38bdf8");
    } else if (inputs.magic2 && player.magicCooldown === 0) {
      this.castSpellSlot(player, player.secondarySpellId, inputs, "#a855f7");
    }
  }

  private castSpellSlot(
    player: Player,
    spellId: string | undefined,
    inputs: InputMap,
    particleColor: string
  ): void {
    if (!spellId) return;
    const castRes = attemptCastSpell(player, spellId, inputs, this.context.getAudio());
    if (!castRes.ok) return;

    player.isCasting = true;
    player.castTime = 16;
    statsManager.recordSpellCast(player.id);

    if (castRes.value.projectiles.length > 0) {
      this.context.pushProjectiles(castRes.value.projectiles);
    }

    this.context.particleSystem.spawnBurst(
      player.x + player.width / 2,
      player.y + player.height / 2,
      particleColor,
      "magic",
      6
    );

    this.checkAndUpdateVitals([player]);
    this.context.notifyReact();
  }

  private clampPlayerBounds(player: Player, levelWidth: number): void {
    if (player.x < 0) {
      player.x = 0;
    } else if (player.x + player.width > levelWidth) {
      player.x = levelWidth - player.width;
    }
  }

  private handlePitFall(
    player: Player,
    levelHeight: number,
    spawnPoint: { x: number; y: number }
  ): void {
    if (player.y <= levelHeight + 100) return;

    if (debugManager.state.godMode) {
      player.x = spawnPoint.x;
      player.y = spawnPoint.y;
      player.vx = 0;
      player.vy = 0;
      this.context.particleSystem.spawnBurst(player.x, player.y, "#22c55e", "spark", 15);
    } else {
      player.health = 0;
      player.isDead = true;
      this.context.setDefeat(true);
      this.context.triggerNarration("defeat");
    }
  }
}
