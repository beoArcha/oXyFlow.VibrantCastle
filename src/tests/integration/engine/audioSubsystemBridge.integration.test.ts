import { describe, it, expect, beforeEach, afterEach, mock } from "bun:test";
import { GameEngine } from "@game/loop/engine";
import { GameAudioEngine, ISfxSynthesizer, IBgmSynthesizer } from "@game/engine/audioEngine";
import { SoundType } from "@game/types";

describe("Audio Subsystem & Settings Bridge Integration Tests", () => {
  let engine: GameEngine;
  let mockSfxSynth: ISfxSynthesizer;
  let mockBgmSynth: IBgmSynthesizer;
  let audioEngine: GameAudioEngine;
  let playedSfx: SoundType[];
  let playedBgmTracks: string[];

  beforeEach(() => {
    playedSfx = [];
    playedBgmTracks = [];

    mockSfxSynth = {
      playSFX: mock((ctx, dest, type) => {
        playedSfx.push(type);
      }),
    };

    mockBgmSynth = {
      start: mock((ctx, dest) => {}),
      setIntensity: mock(() => {}),
      setTempo: mock(() => {}),
      isPlaying: mock(() => false),
      stop: mock(() => {}),
    };

    audioEngine = new GameAudioEngine({
      sfxSynthesizer: mockSfxSynth,
      bgmSynthesizer: mockBgmSynth,
    });

    const mockGain = {
      gain: { setValueAtTime: mock(() => {}) },
      connect: mock(() => {}),
    } as unknown as GainNode;
    const mockCtx = {
      currentTime: 0,
      createGain: () => mockGain,
      destination: {},
    } as unknown as AudioContext;

    audioEngine["ctx"] = mockCtx;
    audioEngine["masterSFXNode"] = mockGain;
    audioEngine["masterBGMNode"] = mockGain;

    engine = new GameEngine({
      audio: audioEngine,
    });
    engine.resetLevel("courtyard");
  });

  afterEach(() => {
    engine.stop();
  });

  it("synchronizes audio master volumes when settings are updated", () => {
    // Initial settings from engine configuration
    expect(audioEngine["volumeSFX"]).toBeDefined();
    expect(audioEngine["volumeBGM"]).toBeDefined();

    // Update settings via engine facade (simulating SettingsContext update)
    engine.applySettings({
      volumeSFX: 0.85,
      volumeMusic: 0.25,
    });

    expect(audioEngine["volumeSFX"]).toBe(0.85);
    expect(audioEngine["volumeBGM"]).toBe(0.25);
  });

  it("mutes and clamps audio volume when set to zero", () => {
    engine.applySettings({
      volumeSFX: 0,
      volumeMusic: 0,
    });

    expect(audioEngine["volumeSFX"]).toBe(0);
    expect(audioEngine["volumeBGM"]).toBe(0);
  });

  it("dispatches SFX playback through synthesizer when playSFX is called", () => {
    // Dispatch sound through the engine's audio subsystem
    audioEngine.playSFX(SoundType.SFX_HIT);
    expect(mockSfxSynth.playSFX).toHaveBeenCalled();
    expect(playedSfx).toContain(SoundType.SFX_HIT);

    audioEngine.playSFX(SoundType.SFX_MAGIC_BOLT);
    expect(playedSfx).toContain(SoundType.SFX_MAGIC_BOLT);
  });

  it("modulates background music intensity dynamically during combat engagement", () => {
    audioEngine.setMusicIntensity(0.8);
    expect(mockBgmSynth.setIntensity).toHaveBeenCalled();

    audioEngine.stopBGM();
    expect(mockBgmSynth.stop).toHaveBeenCalled();
  });
});
