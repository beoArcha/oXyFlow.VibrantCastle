import { SoundType } from "../../types";

export interface ISfxSynthesizer {
  playSFX(ctx: AudioContext, destination: AudioNode, type: SoundType): void;
}

/**
 * Dedicated procedural sound effects synthesizer using Web Audio API (SRP).
 */
export class SfxSynthesizer implements ISfxSynthesizer {
  public playSFX(ctx: AudioContext, destination: AudioNode, type: SoundType): void {
    if (ctx.state === "suspended") {
      ctx.resume();
    }

    const t = ctx.currentTime;

    try {
      switch (type) {
        case SoundType.SFX_JUMP: {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();

          osc.type = "triangle";
          osc.frequency.setValueAtTime(150, t);
          osc.frequency.exponentialRampToValueAtTime(380, t + 0.15);

          gain.gain.setValueAtTime(0.3, t);
          gain.gain.linearRampToValueAtTime(0.01, t + 0.15);

          osc.connect(gain);
          gain.connect(destination);
          osc.start(t);
          osc.stop(t + 0.16);
          break;
        }

        case SoundType.SFX_SLASH: {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();

          osc.type = "sawtooth";
          osc.frequency.setValueAtTime(440, t);
          osc.frequency.exponentialRampToValueAtTime(80, t + 0.1);

          gain.gain.setValueAtTime(0.2, t);
          gain.gain.linearRampToValueAtTime(0.01, t + 0.12);

          const filter = ctx.createBiquadFilter();
          filter.type = "lowpass";
          filter.frequency.setValueAtTime(2000, t);

          osc.connect(filter);
          filter.connect(gain);
          gain.connect(destination);
          osc.start(t);
          osc.stop(t + 0.12);
          break;
        }

        case SoundType.SFX_DASH: {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();

          osc.type = "triangle";
          osc.frequency.setValueAtTime(500, t);
          osc.frequency.exponentialRampToValueAtTime(120, t + 0.25);

          gain.gain.setValueAtTime(0.4, t);
          gain.gain.exponentialRampToValueAtTime(0.01, t + 0.25);

          osc.connect(gain);
          gain.connect(destination);
          osc.start(t);
          osc.stop(t + 0.26);
          break;
        }

        case SoundType.SFX_HIT: {
          const osc = ctx.createOscillator();
          const oscGain = ctx.createGain();

          osc.type = "sine";
          osc.frequency.setValueAtTime(160, t);
          osc.frequency.linearRampToValueAtTime(40, t + 0.15);

          oscGain.gain.setValueAtTime(0.4, t);
          oscGain.gain.linearRampToValueAtTime(0.01, t + 0.15);

          osc.connect(oscGain);
          oscGain.connect(destination);

          // White noise punch
          const bufferSize = ctx.sampleRate * 0.08;
          const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
          const data = buffer.getChannelData(0);
          for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
          }
          const noise = ctx.createBufferSource();
          noise.buffer = buffer;
          const noiseGain = ctx.createGain();
          noiseGain.gain.setValueAtTime(0.35, t);
          noiseGain.gain.exponentialRampToValueAtTime(0.01, t + 0.08);

          noise.connect(noiseGain);
          noiseGain.connect(destination);

          osc.start(t);
          osc.stop(t + 0.16);
          noise.start(t);
          break;
        }

        case SoundType.SFX_SPELL_CAST: {
          const osc1 = ctx.createOscillator();
          const osc2 = ctx.createOscillator();
          const gain = ctx.createGain();

          osc1.type = "sine";
          osc2.type = "triangle";

          osc1.frequency.setValueAtTime(260, t);
          osc1.frequency.exponentialRampToValueAtTime(660, t + 0.25);

          osc2.frequency.setValueAtTime(520, t);
          osc2.frequency.exponentialRampToValueAtTime(1320, t + 0.25);

          gain.gain.setValueAtTime(0.25, t);
          gain.gain.exponentialRampToValueAtTime(0.01, t + 0.28);

          osc1.connect(gain);
          osc2.connect(gain);
          gain.connect(destination);

          osc1.start(t);
          osc2.start(t);
          osc1.stop(t + 0.29);
          osc2.stop(t + 0.29);
          break;
        }

        case SoundType.SFX_POTION: {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();

          osc.type = "sine";
          osc.frequency.setValueAtTime(320, t);
          osc.frequency.linearRampToValueAtTime(540, t + 0.1);
          osc.frequency.linearRampToValueAtTime(800, t + 0.25);

          gain.gain.setValueAtTime(0.3, t);
          gain.gain.linearRampToValueAtTime(0.01, t + 0.25);

          osc.connect(gain);
          gain.connect(destination);

          osc.start(t);
          osc.stop(t + 0.26);
          break;
        }

        case SoundType.SFX_LEVEL_CLEAR: {
          const notes = [261.63, 329.63, 392.0, 523.25, 659.25, 783.99]; // C E G C E G
          notes.forEach((freq, idx) => {
            const noteStart = t + idx * 0.08;
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.type = "triangle";
            osc.frequency.setValueAtTime(freq, noteStart);

            gain.gain.setValueAtTime(0.2, noteStart);
            gain.gain.exponentialRampToValueAtTime(0.001, noteStart + 0.4);

            osc.connect(gain);
            gain.connect(destination);

            osc.start(noteStart);
            osc.stop(noteStart + 0.41);
          });
          break;
        }

        case SoundType.SFX_LEVER: {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();

          osc.type = "square";
          osc.frequency.setValueAtTime(140, t);
          osc.frequency.linearRampToValueAtTime(90, t + 0.12);

          gain.gain.setValueAtTime(0.25, t);
          gain.gain.linearRampToValueAtTime(0.01, t + 0.12);

          osc.connect(gain);
          gain.connect(destination);

          osc.start(t);
          osc.stop(t + 0.13);
          break;
        }

        case SoundType.SFX_DEFEAT: {
          const notes = [300, 260, 220, 160];
          notes.forEach((freq, idx) => {
            const noteStart = t + idx * 0.15;
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.type = "sawtooth";
            osc.frequency.setValueAtTime(freq, noteStart);

            gain.gain.setValueAtTime(0.25, noteStart);
            gain.gain.linearRampToValueAtTime(0.01, noteStart + 0.2);

            osc.connect(gain);
            gain.connect(destination);

            osc.start(noteStart);
            osc.stop(noteStart + 0.22);
          });
          break;
        }

        case SoundType.SFX_BUTTON_CLICK: {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();

          osc.type = "sine";
          osc.frequency.setValueAtTime(600, t);
          osc.frequency.exponentialRampToValueAtTime(900, t + 0.05);

          gain.gain.setValueAtTime(0.15, t);
          gain.gain.linearRampToValueAtTime(0.01, t + 0.05);

          osc.connect(gain);
          gain.connect(destination);

          osc.start(t);
          osc.stop(t + 0.06);
          break;
        }
      }
    } catch {
      // Ignore audio synthesis errors on interrupted or unsupported context
    }
  }
}

export const defaultSfxSynthesizer = new SfxSynthesizer();
