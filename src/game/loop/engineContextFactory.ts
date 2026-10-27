import { Player, Enemy, Entity, SoundType, PlayerId, GameSettings, ParticleBurstType } from "@game/types";
import { IDebugCheatsContext } from "../debug/debugCheatsController";
import { ILevelLifecycleContext } from "../locations/levelLifecycleManager";
import { ParticleSystem } from "../engine/particleSystem";
import { GameAudioEngine } from "@game/engine/audioEngine";
import { CameraManager } from "../engine/cameraManager";
import { statsManager } from "../logic/stats";
import { GameRenderer } from "../renderer/renderer";

export interface IEngineContextHost {
  players: Player[];
  enemies: Enemy[];
  entities: Entity[];
  levelWidth: number;
  levelHeight: number;
  spawnPoint: { x: number; y: number };
  isVictory: boolean;
  isDefeat: boolean;
  settings: GameSettings;
  particleSystem: ParticleSystem;
  cameraManager: CameraManager;
  audio: GameAudioEngine;
  getRenderer(): GameRenderer | null;
  isRunning: boolean;
  triggerNarration(key: string): void;
  resetNarration(): void;
  stop(): void;
  start(): void;
  notifyReact(): void;
}

export function createDebugCheatsContext(host: IEngineContextHost): IDebugCheatsContext {
  return {
    getPlayers: () => host.players,
    getEnemies: () => host.enemies,
    getLevelDimensions: () => ({ width: host.levelWidth, height: host.levelHeight }),
    spawnBurst: (x: number, y: number, color: string, type: ParticleBurstType, count: number) =>
      host.particleSystem.spawnBurst(x, y, color, type, count),
    playSFX: (type: SoundType) => host.audio.playSFX(type),
    recordKill: (playerId: PlayerId, enemyId: string) => statsManager.recordKill(playerId, enemyId),
    triggerNarration: (key: string) => host.triggerNarration(key),
    stopEngine: () => host.stop(),
    setVictory: (v: boolean) => { host.isVictory = v; },
    setDefeat: (d: boolean) => { host.isDefeat = d; },
    notifyReact: () => host.notifyReact(),
  };
}

export function createLevelLifecycleContext(host: IEngineContextHost): ILevelLifecycleContext {
  return {
    getPlayers: () => host.players,
    setPlayers: (p: Player[]) => { host.players = p; },
    getEnemies: () => host.enemies,
    setEnemies: (e: Enemy[]) => { host.enemies = e; },
    getEntities: () => host.entities,
    setEntities: (ent: Entity[]) => { host.entities = ent; },
    clearProjectiles: () => {},
    getIsTwoPlayer: () => host.settings.isTwoPlayer,
    setIsTwoPlayer: (val: boolean) => { host.settings.isTwoPlayer = val; },
    getViewportSize: () => ({
      width: host.getRenderer()?.viewportWidth || 1280,
      height: host.getRenderer()?.viewportHeight || 720,
    }),
    snapCamera: (pList: Player[], w: number, h: number) =>
      host.cameraManager.snapToPlayers(
        pList,
        host.getRenderer()?.viewportWidth || 1280,
        host.getRenderer()?.viewportHeight || 720,
        w,
        h
      ),
    triggerNarration: (key: string) => host.triggerNarration(key),
    resetNarration: () => host.resetNarration(),
    playSFX: (type: SoundType) => host.audio.playSFX(type),
    setMusicIntensity: (intensity: number) => host.audio.setMusicIntensity(intensity),
    spawnBurst: (x: number, y: number, color: string, type: ParticleBurstType, count: number) =>
      host.particleSystem.spawnBurst(x, y, color, type, count),
    stopEngine: () => host.stop(),
    startEngine: () => host.start(),
    isRunning: () => host.isRunning,
    notifyReact: () => host.notifyReact(),
  };
}

