import { SoundType } from "../types";
import {
  ISfxSynthesizer,
  SfxSynthesizer,
  defaultSfxSynthesizer,
} from "./audio/sfxSynthesizer";
import {
  IBgmSynthesizer,
  BgmSynthesizer,
  defaultBgmSynthesizer,
} from "./audio/bgmSynthesizer";
import { audioLogger } from "../logger/gameLogger";

export type { ISfxSynthesizer, IBgmSynthesizer };
export { SfxSynthesizer, BgmSynthesizer };

export interface IAudioEngineDependencies {
  sfxSynthesizer?: ISfxSynthesizer;
  bgmSynthesizer?: IBgmSynthesizer;
}

export interface IGameAudioEngine {
  init(): void;
  setSFXVolume(vol: number): void;
  setBGMVolume(vol: number): void;
  setMusicIntensity(intensity: number): void;
  playSFX(type: SoundType): void;
  stopBGM(): void;
}

/**
 * Web Audio API Master Audio Orchestrator and Facade.
 * Coordinates AudioContext, master gain buses, and delegates audio generation:
 * - SRP: SFX synthesis delegated to ISfxSynthesizer; dynamic BGM sequencing delegated to IBgmSynthesizer.
 * - DIP: Injects audio sub-synthesizers with robust defaults.
 */
export class GameAudioEngine implements IGameAudioEngine {
  private ctx: AudioContext | null = null;
  private masterSFXNode: GainNode | null = null;
  private masterBGMNode: GainNode | null = null;

  // Volume levels (0.0 to 1.0)
  private volumeSFX: number = 0.6;
  private volumeBGM: number = 0.4;

  // Injected sub-synthesizers (SRP & DIP)
  private readonly sfxSynth: ISfxSynthesizer;
  private readonly bgmSynth: IBgmSynthesizer;

  constructor(deps: IAudioEngineDependencies = {}) {
    this.sfxSynth = deps.sfxSynthesizer || defaultSfxSynthesizer;
    this.bgmSynth = deps.bgmSynthesizer || defaultBgmSynthesizer;
  }

  /**
   * Initializes the AudioContext. Must be triggered via a user gesture.
   */
  public init() {
    if (typeof window === "undefined" || this.ctx) return;

    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;

    try {
      this.ctx = new AudioContextClass();

      // SFX Gain Node
      this.masterSFXNode = this.ctx.createGain();
      this.masterSFXNode.gain.setValueAtTime(this.volumeSFX, this.ctx.currentTime);
      this.masterSFXNode.connect(this.ctx.destination);

      // BGM Gain Node
      this.masterBGMNode = this.ctx.createGain();
      this.masterBGMNode.gain.setValueAtTime(this.volumeBGM, this.ctx.currentTime);
      this.masterBGMNode.connect(this.ctx.destination);

      this.bgmSynth.start(this.ctx, this.masterBGMNode);
      audioLogger.info("AudioContext and synthesizers initialized successfully");
    } catch (err) {
      audioLogger.warn("Failed to initialize AudioContext:", { action: "init_audio_context" }, err);
    }
  }

  public setSFXVolume(vol: number) {
    this.volumeSFX = Math.max(0, Math.min(1, vol));
    if (this.masterSFXNode && this.ctx) {
      this.masterSFXNode.gain.setValueAtTime(this.volumeSFX, this.ctx.currentTime);
    }
  }

  public setBGMVolume(vol: number) {
    this.volumeBGM = Math.max(0, Math.min(1, vol));
    if (this.masterBGMNode && this.ctx) {
      this.masterBGMNode.gain.setValueAtTime(this.volumeBGM, this.ctx.currentTime);
    }
  }

  /**
   * Dynamically alters the music intensity.
   * 0.0 = Peaceful, bright courtyard exploration (sunny, warm).
   * 1.0 = High energy combat / action sequences.
   */
  public setMusicIntensity(intensity: number) {
    this.bgmSynth.setIntensity(intensity);
  }

  /**
   * Plays custom synthesized sound effects based on game events.
   */
  public playSFX(type: SoundType) {
    if (!this.ctx || !this.masterSFXNode) {
      return;
    }
    this.sfxSynth.playSFX(this.ctx, this.masterSFXNode, type);
  }

  /**
   * Stops background music sequencer.
   */
  public stopBGM() {
    this.bgmSynth.stop();
  }
}

export const gameAudio = new GameAudioEngine();
