import { SaveState, Player, Enemy, Entity, SoundType } from "../types";
import { gameAudio } from "../engine/audioEngine";
import { statsManager } from "./stats";
import { calculatePlayerDerivedStats } from "./inventory";

/**
 * Game Save Manager.
 * Implements real JSON file export and import, as well as offline LocalStorage fallback.
 */
export class GameSaveSystem {
  private STORAGE_KEY = "vibrant_castle_save_state";

  constructor() {}

  /**
   * Compiles current state, saves to LocalStorage, and returns the JSON string.
   */
  public compileSaveState(
    players: Player[],
    enemies: Enemy[],
    entities: Entity[],
    levelId: string
  ): SaveState {
    const p1 = players.find(p => p.id === "player1")!;
    const p2 = players.find(p => p.id === "player2");

    const activatedLevers = entities
      .filter(e => e.type === "lever" && e.isActivated)
      .map(e => e.id);

    const defeatedEnemies = enemies
      .filter(e => e.isDead)
      .map(e => e.id);

    const state: SaveState = {
      timestamp: new Date().toISOString(),
      p1Health: p1.health,
      p1Mana: p1.mana,
      p1Stamina: p1.stamina,
      p1Score: p1.score,
      p1SkillPoints: p1.skillPoints,
      p1UnlockedSkills: p1.unlockedSkills,
      p1PrimarySpellId: p1.primarySpellId,
      p1SecondarySpellId: p1.secondarySpellId,
      p1Inventory: JSON.parse(JSON.stringify(p1.inventory)),
      p2Health: p2 ? p2.health : 0,
      p2Mana: p2 ? p2.mana : 0,
      p2Stamina: p2 ? p2.stamina : 0,
      p2Score: p2 ? p2.score : 0,
      p2SkillPoints: p2 ? p2.skillPoints : undefined,
      p2UnlockedSkills: p2 ? p2.unlockedSkills : undefined,
      p2PrimarySpellId: p2 ? p2.primarySpellId : undefined,
      p2SecondarySpellId: p2 ? p2.secondarySpellId : undefined,
      p2Inventory: p2 ? JSON.parse(JSON.stringify(p2.inventory)) : undefined,
      levelId,
      activatedLevers,
      defeatedEnemies,
      checkpointX: p1.x,
      checkpointY: p1.y,
      stats: statsManager.getStats(),
    };

    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(state));
    return state;
  }

  /**
   * Triggers a browser file download containing the compiled SaveState in pure JSON format.
   */
  public exportToFile(state: SaveState) {
    const jsonStr = JSON.stringify(state, null, 2);
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement("a");
    a.href = url;
    a.download = `vibrant_castle_save_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    gameAudio.playSFX(SoundType.SFX_SAVE);
  }

  /**
   * Loads from LocalStorage if available.
   */
  public loadFromLocalStorage(): SaveState | null {
    const data = localStorage.getItem(this.STORAGE_KEY);
    if (!data) return null;
    try {
      return JSON.parse(data) as SaveState;
    } catch (e) {
      console.error("Failed to parse LocalStorage save:", e);
      return null;
    }
  }

  /**
   * Decodes a loaded JSON string, validates it, and applies it to the active game structures.
   */
  public applySaveState(
    state: SaveState,
    players: Player[],
    enemies: Enemy[],
    entities: Entity[]
  ): boolean {
    try {
      const p1 = players.find(p => p.id === "player1");
      if (p1) {
        p1.x = state.checkpointX;
        p1.y = state.checkpointY;
        p1.health = state.p1Health;
        p1.mana = state.p1Mana !== undefined ? state.p1Mana : p1.maxMana;
        p1.stamina = state.p1Stamina !== undefined ? state.p1Stamina : p1.maxStamina;
        p1.score = state.p1Score;
        if (state.p1SkillPoints !== undefined) p1.skillPoints = state.p1SkillPoints;
        if (state.p1UnlockedSkills) p1.unlockedSkills = state.p1UnlockedSkills;
        if (state.p1PrimarySpellId) p1.primarySpellId = state.p1PrimarySpellId;
        if (state.p1SecondarySpellId) p1.secondarySpellId = state.p1SecondarySpellId;
        if (state.p1Inventory) {
          p1.inventory = JSON.parse(JSON.stringify(state.p1Inventory));
          const stats = calculatePlayerDerivedStats(p1);
          p1.maxHealth = stats.maxHp;
          p1.maxMana = stats.maxMana;
          p1.maxStamina = stats.maxStamina;
        }
        p1.isDead = p1.health <= 0;
        p1.vx = 0;
        p1.vy = 0;
      }

      const p2 = players.find(p => p.id === "player2");
      if (p2 && state.p2Health > 0) {
        p2.x = state.checkpointX - 30;
        p2.y = state.checkpointY;
        p2.health = state.p2Health;
        p2.mana = state.p2Mana !== undefined ? state.p2Mana : p2.maxMana;
        p2.stamina = state.p2Stamina !== undefined ? state.p2Stamina : p2.maxStamina;
        p2.score = state.p2Score;
        if (state.p2SkillPoints !== undefined) p2.skillPoints = state.p2SkillPoints;
        if (state.p2UnlockedSkills) p2.unlockedSkills = state.p2UnlockedSkills;
        if (state.p2PrimarySpellId) p2.primarySpellId = state.p2PrimarySpellId;
        if (state.p2SecondarySpellId) p2.secondarySpellId = state.p2SecondarySpellId;
        if (state.p2Inventory) {
          p2.inventory = JSON.parse(JSON.stringify(state.p2Inventory));
          const stats = calculatePlayerDerivedStats(p2);
          p2.maxHealth = stats.maxHp;
          p2.maxMana = stats.maxMana;
          p2.maxStamina = stats.maxStamina;
        }
        p2.isDead = p2.health <= 0;
        p2.vx = 0;
        p2.vy = 0;
      }

      // Restore levers
      entities.forEach(entity => {
        if (entity.type === "lever") {
          entity.isActivated = state.activatedLevers.includes(entity.id);
        }
      });

      // Restore defeated enemies
      enemies.forEach(enemy => {
        if (state.defeatedEnemies.includes(enemy.id)) {
          enemy.isDead = true;
          enemy.health = 0;
        }
      });

      // Restore statistics if present
      if (state.stats) {
        statsManager.loadStats(state.stats);
      }

      return true;
    } catch (e) {
      console.error("Failed to apply save state:", e);
      return false;
    }
  }
}

export const gameSave = new GameSaveSystem();
export default gameSave;
