import { Player, Enemy, PlayerId, SoundType, PlayerStatKey, ParticleBurstType } from "../types";
import { SPELL_REGISTRY } from "../logic/magic";
import { ITEM_REGISTRY } from "../logic/inventory";
import { statsManager } from "../logic/stats";

/**
 * Context provided by the GameEngine or Test Harness to execute debug/cheat actions.
 */
export interface IDebugCheatsContext {
  getPlayers: () => Player[];
  getEnemies: () => Enemy[];
  getLevelDimensions: () => { width: number; height: number };
  spawnBurst: (x: number, y: number, color: string, type: ParticleBurstType, count: number) => void;
  playSFX: (type: SoundType) => void;
  recordKill?: (playerId: PlayerId, enemyId: string) => void;
  triggerNarration?: (key: string) => void;
  stopEngine?: () => void;
  setVictory?: (v: boolean) => void;
  setDefeat?: (d: boolean) => void;
  notifyReact: () => void;
}

interface DebugEnemyProps {
  maxHp: number;
  width: number;
  height: number;
  name: string;
  isAerial: boolean;
  isDummy: boolean;
}

function resolveDebugEnemyProps(enemyType: string): DebugEnemyProps {
  if (enemyType.includes("dummy") || enemyType.includes("target")) {
    return { maxHp: 9999, width: 36, height: 48, name: "Kukła Treningowa", isAerial: false, isDummy: true };
  }
  if (enemyType.includes("boss") || enemyType.includes("sentinel_boss")) {
    return { maxHp: 600, width: 56, height: 70, name: "Bastion Sentinel Boss", isAerial: false, isDummy: false };
  }
  if (enemyType.includes("gargoyle") || enemyType.includes("wisp")) {
    return { maxHp: 120, width: 32, height: 36, name: enemyType.replace(/_/g, " "), isAerial: true, isDummy: false };
  }
  if (enemyType.includes("crawler")) {
    return { maxHp: 90, width: 44, height: 28, name: enemyType.replace(/_/g, " "), isAerial: false, isDummy: false };
  }
  return { maxHp: 150, width: 38, height: 52, name: enemyType.replace(/_/g, " "), isAerial: false, isDummy: false };
}

/**
 * DebugCheatsController extracts testing, inspection, and cheat capabilities
 * from the monolithic GameEngine (Single Responsibility Principle - SRP).
 */
export class DebugCheatsController {
  constructor(private readonly context: IDebugCheatsContext) {}

  public teleportPlayer(playerId: PlayerId = PlayerId.Player1, x: number, y: number): void {
    if (!Number.isFinite(x) || !Number.isFinite(y)) return;

    const players = this.context.getPlayers();
    const player = players.find((p) => p.id === playerId) || players[0];
    if (!player) return;

    // Burst at old position
    this.context.spawnBurst(player.x + player.width / 2, player.y + player.height / 2, "#38bdf8", "spark", 10);

    const { width: levelWidth, height: levelHeight } = this.context.getLevelDimensions();
    player.x = Math.max(0, Math.min(levelWidth - player.width, x));
    player.y = Math.max(0, Math.min(levelHeight - player.height, y));
    player.vx = 0;
    player.vy = 0;
    player.isGrounded = false;

    // Burst at new arrival position
    this.context.spawnBurst(player.x + player.width / 2, player.y + player.height / 2, "#a855f7", "magic", 16);
    this.context.playSFX(SoundType.SFX_UNLOCK);
    this.context.notifyReact();
  }

  public damageEnemy(enemyId: string, amount: number = 50): boolean {
    const enemies = this.context.getEnemies();
    const enemy = enemies.find((e) => e.id === enemyId);
    if (!enemy || enemy.isDead) return false;

    const damage = Math.max(1, Math.round(amount));
    enemy.health = Math.max(0, enemy.health - damage);
    this.context.spawnBurst(
      enemy.x + enemy.width / 2,
      enemy.y + enemy.height / 2,
      "#f43f5e",
      "spark",
      8
    );
    this.context.playSFX(SoundType.SFX_HIT);

    if (enemy.health <= 0) {
      enemy.isDead = true;
      if (this.context.recordKill) {
        this.context.recordKill(PlayerId.Player1, enemy.id);
      } else {
        statsManager.recordKill(PlayerId.Player1, enemy.id);
      }
    }

    this.context.notifyReact();
    return true;
  }

  public removeEnemy(enemyId: string): boolean {
    const enemies = this.context.getEnemies();
    const idx = enemies.findIndex((e) => e.id === enemyId);
    if (idx === -1) return false;

    const enemy = enemies[idx];
    this.context.spawnBurst(
      enemy.x + enemy.width / 2,
      enemy.y + enemy.height / 2,
      "#78716c",
      "dust",
      10
    );
    enemies.splice(idx, 1);
    this.context.notifyReact();
    return true;
  }

  public killAllEnemies(): void {
    const enemies = this.context.getEnemies();
    enemies.forEach((enemy) => {
      if (!enemy.isDead) {
        enemy.health = 0;
        enemy.isDead = true;
        this.context.spawnBurst(
          enemy.x + enemy.width / 2,
          enemy.y + enemy.height / 2,
          "#f43f5e",
          "spark",
          12
        );
        if (this.context.recordKill) {
          this.context.recordKill(PlayerId.Player1, enemy.id);
        } else {
          statsManager.recordKill(PlayerId.Player1, enemy.id);
        }
      }
    });
    this.context.playSFX(SoundType.SFX_HIT);
    this.context.notifyReact();
  }

  public spawnEnemy(enemyType: string, customX?: number, customY?: number): Enemy {
    const players = this.context.getPlayers();
    const p1 = players[0];
    const spawnX = customX !== undefined ? customX : (p1 ? p1.x + 120 : 300);
    const spawnY = customY !== undefined ? customY : (p1 ? p1.y : 400);

    const id = `debug_${enemyType}_${Date.now()}`;
    const props = resolveDebugEnemyProps(enemyType);
    const { width: levelWidth } = this.context.getLevelDimensions();

    const newEnemy: Enemy = {
      id,
      defaultName: props.name,
      x: spawnX,
      y: spawnY,
      vx: 0,
      vy: 0,
      width: props.width,
      height: props.height,
      health: props.maxHp,
      maxHealth: props.maxHp,
      isDead: false,
      patrolMinX: Math.max(0, spawnX - 200),
      patrolMaxX: Math.min(levelWidth, spawnX + 200),
      facingLeft: true,
      isDummy: props.isDummy,
      damageTimer: 0,
      isAerial: props.isAerial,
    };

    this.context.getEnemies().push(newEnemy);
    this.context.spawnBurst(spawnX + width / 2, spawnY + height / 2, "#f43f5e", "magic", 20);
    this.context.playSFX(SoundType.SFX_SKILL_UNLOCK);
    this.context.notifyReact();
    return newEnemy;
  }

  public refillVitals(playerIndex: number = 0): void {
    const player = this.context.getPlayers()[playerIndex];
    if (player) {
      player.health = player.maxHealth;
      player.mana = player.maxMana;
      player.stamina = player.maxStamina;
      player.isDead = false;
      this.context.spawnBurst(player.x + player.width / 2, player.y + player.height / 2, "#22c55e", "spark", 15);
      this.context.playSFX(SoundType.SFX_POTION);
      this.context.notifyReact();
    }
  }

  public setPlayerStat(
    playerIndex: number,
    stat: PlayerStatKey,
    value: number
  ): void {
    const player = this.context.getPlayers()[playerIndex];
    if (!player) return;
    const clamped = Math.max(1, Math.min(9999, Math.round(value)));
    player[stat] = clamped;
    if (stat === "maxHealth" && player.health > clamped) player.health = clamped;
    if (stat === "maxMana" && player.mana > clamped) player.mana = clamped;
    if (stat === "maxStamina" && player.stamina > clamped) player.stamina = clamped;
    this.context.notifyReact();
  }

  public unlockAllSkills(playerIndex: number = 0): void {
    const player = this.context.getPlayers()[playerIndex];
    if (!player) return;
    const allSpellIds = Object.keys(SPELL_REGISTRY);
    player.unlockedSkills = Array.from(new Set([...player.unlockedSkills, ...allSpellIds]));
    player.skillPoints = Math.max(player.skillPoints, 10);
    this.context.spawnBurst(player.x + player.width / 2, player.y + player.height / 2, "#facc15", "magic", 25);
    this.context.playSFX(SoundType.SFX_SKILL_UNLOCK);
    this.context.notifyReact();
  }

  public giveAllWeapons(playerIndex: number = 0): void {
    const player = this.context.getPlayers()[playerIndex];
    if (!player) return;
    const weapons = Object.values(ITEM_REGISTRY).filter((item) => item.type === "weapon");
    weapons.forEach((w) => {
      const emptyIdx = player.inventory.backpack.findIndex((s) => s === null);
      if (emptyIdx !== -1) {
        player.inventory.backpack[emptyIdx] = { ...w };
      }
    });
    this.context.spawnBurst(player.x + player.width / 2, player.y + player.height / 2, "#fbbf24", "spark", 20);
    this.context.playSFX(SoundType.SFX_SAVE);
    this.context.notifyReact();
  }

  public givePotions(playerIndex: number = 0): void {
    const player = this.context.getPlayers()[playerIndex];
    if (!player) return;
    player.inventory.quickPotions = [
      ITEM_REGISTRY.potion_health ? { ...ITEM_REGISTRY.potion_health, count: 5 } : null,
      ITEM_REGISTRY.potion_mana ? { ...ITEM_REGISTRY.potion_mana, count: 5 } : null,
      ITEM_REGISTRY.potion_elixir ? { ...ITEM_REGISTRY.potion_elixir, count: 5 } : null,
    ];
    this.context.playSFX(SoundType.SFX_POTION);
    this.context.notifyReact();
  }

  public addGold(amount: number): void {
    statsManager.addXp(PlayerId.Player1, amount);
    const p1 = this.context.getPlayers()[0];
    if (p1) {
      p1.skillPoints = (p1.skillPoints || 0) + Math.max(1, Math.round(amount / 500));
    }
    this.context.playSFX(SoundType.SFX_UNLOCK);
    this.context.notifyReact();
  }

  public clearInventory(playerIndex: number = 0): void {
    const player = this.context.getPlayers()[playerIndex];
    if (!player) return;
    player.inventory.backpack = Array(12).fill(null);
    this.context.playSFX(SoundType.SFX_HIT);
    this.context.notifyReact();
  }

  public triggerParticleBurst(type: ParticleBurstType, count: number = 25): void {
    const p1 = this.context.getPlayers()[0];
    const { width: levelWidth, height: levelHeight } = this.context.getLevelDimensions();
    const x = p1 ? p1.x + p1.width / 2 : levelWidth / 2;
    const y = p1 ? p1.y + p1.height / 2 : levelHeight / 2;
    const burstColors: Record<ParticleBurstType, string> = { spark: "#f59e0b", magic: "#a855f7", dust: "#d97706" };
    this.context.spawnBurst(x, y, burstColors[type], type, count);
  }

  public forceVictory(): void {
    this.context.setVictory?.(true);
    this.context.triggerNarration?.("trainingGoalSuccess");
    this.context.playSFX(SoundType.SFX_SKILL_UNLOCK);
    this.context.stopEngine?.();
    this.context.notifyReact();
  }

  public forceDefeat(): void {
    const p1 = this.context.getPlayers()[0];
    if (p1) { p1.health = 0; p1.isDead = true; }
    this.context.setDefeat?.(true);
    this.context.triggerNarration?.("defeat");
    this.context.playSFX(SoundType.SFX_HIT);
    this.context.notifyReact();
  }
}
