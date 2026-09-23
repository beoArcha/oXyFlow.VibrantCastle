export interface IBgmSynthesizer {
  start(ctx: AudioContext, destination: AudioNode): void;
  stop(): void;
  setIntensity(intensity: number): void;
  setTempo(bpm: number): void;
  isPlaying(): boolean;
}

/**
 * Algorithmic dynamic background music synthesizer and step-sequencer using Web Audio API (SRP).
 * Dynamically shifts between bright exploration themes and high-tension combat drives.
 */
export class BgmSynthesizer implements IBgmSynthesizer {
  private isBGMPlaying: boolean = false;
  private bgmIntervalId: ReturnType<typeof setInterval> | null = null;
  private bgmStep: number = 0;
  private bgmIntensity: number = 0.0; // 0.0 (explore) to 1.0 (combat)
  private currentTempoBpm: number = 110;

  // Musical scales
  private readonly solarScaleExplore = [220, 246.94, 277.18, 329.63, 369.99, 440]; // A Dorian / Warm sun
  private readonly solarScaleCombat = [110, 130.81, 146.83, 164.81, 196.0, 220]; // D / A Minor drive

  public isPlaying(): boolean {
    return this.isBGMPlaying;
  }

  public setIntensity(intensity: number): void {
    this.bgmIntensity = Math.max(0, Math.min(1, intensity));
  }

  public setTempo(bpm: number): void {
    this.currentTempoBpm = Math.max(60, Math.min(200, bpm));
  }

  public start(ctx: AudioContext, destination: AudioNode): void {
    if (this.isBGMPlaying) return;
    this.isBGMPlaying = true;

    const stepDurationMs = (60 / this.currentTempoBpm / 2) * 1000; // 8th note steps

    this.bgmIntervalId = setInterval(() => {
      if (!ctx || ctx.state !== "running") return;

      const t = ctx.currentTime;
      const isCombat = this.bgmIntensity > 0.4;
      const scale = isCombat ? this.solarScaleCombat : this.solarScaleExplore;

      // 1. Bassline
      if (this.bgmStep % 2 === 0) {
        const rootFreq = scale[0];
        const bassFreq = isCombat
          ? (this.bgmStep % 8 === 0 ? rootFreq : scale[(this.bgmStep / 2) % scale.length]) / 2
          : rootFreq / 2;

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = isCombat ? "sawtooth" : "triangle";
        osc.frequency.setValueAtTime(bassFreq, t);

        const filter = ctx.createBiquadFilter();
        filter.type = "lowpass";
        filter.frequency.setValueAtTime(isCombat ? 450 : 280, t);

        gain.gain.setValueAtTime(isCombat ? 0.25 : 0.15, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(destination);

        osc.start(t);
        osc.stop(t + 0.36);
      }

      // 2. Melodic Motif / Arpeggio
      if (Math.random() > (isCombat ? 0.2 : 0.4)) {
        const noteIdx = (this.bgmStep * 3) % scale.length;
        const noteFreq = scale[noteIdx] * (isCombat ? 2 : 1.5);

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = "sine";
        osc.frequency.setValueAtTime(noteFreq, t);

        gain.gain.setValueAtTime(0.08, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);

        osc.connect(gain);
        gain.connect(destination);

        osc.start(t);
        osc.stop(t + 0.26);
      }

      // 3. Ambient Chime Pad (Solar Bastion aura)
      if (this.bgmStep % 16 === 0 && !isCombat) {
        const chord = [329.63, 440, 554.37];
        chord.forEach((freq) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();

          osc.type = "triangle";
          osc.frequency.setValueAtTime(freq, t);

          gain.gain.setValueAtTime(0.03, t);
          gain.gain.exponentialRampToValueAtTime(0.001, t + 1.8);

          osc.connect(gain);
          gain.connect(destination);

          osc.start(t);
          osc.stop(t + 1.85);
        });
      }

      this.bgmStep = (this.bgmStep + 1) % 64;
    }, stepDurationMs);
  }

  public stop(): void {
    this.isBGMPlaying = false;
    if (this.bgmIntervalId) {
      clearInterval(this.bgmIntervalId);
      this.bgmIntervalId = null;
    }
  }
}

export const defaultBgmSynthesizer = new BgmSynthesizer();
