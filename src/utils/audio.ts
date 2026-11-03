/**
 * Pure Web Audio API Sound Synthesizer.
 * No external audio files or network requests required.
 */

class SoundSystem {
  private ctx: AudioContext | null = null;
  private engineOsc: OscillatorNode | null = null;
  private engineGain: GainNode | null = null;
  private isEngineRunning = false;
  public enabled = true;

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  public setEnabled(enabled: boolean) {
    this.enabled = enabled;
    if (!enabled && this.engineGain) {
      this.engineGain.gain.setValueAtTime(0, this.ctx?.currentTime || 0);
    }
  }

  /**
   * Start looping synthesized engine rumble.
   */
  public startEngine() {
    if (!this.enabled) return;
    this.initContext();
    if (!this.ctx || this.isEngineRunning) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(55, this.ctx.currentTime);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(320, this.ctx.currentTime);

      gain.gain.setValueAtTime(0.06, this.ctx.currentTime);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      this.engineOsc = osc;
      this.engineGain = gain;
      this.isEngineRunning = true;
    } catch {
      // AudioContext policy
    }
  }

  /**
   * Update engine pitch and volume based on speed (km/h) and nitro
   */
  public updateEngine(speed: number, maxSpeed: number, isNitro: boolean) {
    if (!this.enabled || !this.ctx || !this.engineOsc || !this.engineGain) return;

    try {
      const ratio = Math.max(0, Math.min(1.5, speed / Math.max(1, maxSpeed)));
      const baseFreq = 50 + ratio * 140 + (isNitro ? 45 : 0);
      const volume = (0.04 + ratio * 0.08) * (this.enabled ? 1 : 0);

      const t = this.ctx.currentTime;
      this.engineOsc.frequency.setTargetAtTime(baseFreq, t, 0.05);
      this.engineGain.gain.setTargetAtTime(volume, t, 0.05);
    } catch {
      // Ignore audio glitch
    }
  }

  public stopEngine() {
    if (this.engineOsc) {
      try {
        this.engineOsc.stop();
        this.engineOsc.disconnect();
      } catch {
        // Safe disconnect
      }
      this.engineOsc = null;
    }
    this.engineGain = null;
    this.isEngineRunning = false;
  }

  /**
   * Coin / item pickup chime (sparkling bell)
   */
  public playCoin() {
    if (!this.enabled) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const t = this.ctx.currentTime;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(987.77, t); // B5
      osc.frequency.exponentialRampToValueAtTime(1318.51, t + 0.12); // E6

      gain.gain.setValueAtTime(0.18, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + 0.23);
    } catch {
      // Audio context catch
    }
  }

  /**
   * Near miss swoosh and congratulatory ding!
   */
  public playNearMiss(combo: number) {
    if (!this.enabled) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const t = this.ctx.currentTime;
      const osc1 = this.ctx.createOscillator();
      const gain1 = this.ctx.createGain();

      const pitchMultiplier = 1 + Math.min(1, combo * 0.08);
      osc1.type = 'triangle';
      osc1.frequency.setValueAtTime(523.25 * pitchMultiplier, t);
      osc1.frequency.exponentialRampToValueAtTime(880 * pitchMultiplier, t + 0.15);

      gain1.gain.setValueAtTime(0.15, t);
      gain1.gain.exponentialRampToValueAtTime(0.001, t + 0.25);

      osc1.connect(gain1);
      gain1.connect(this.ctx.destination);

      osc1.start(t);
      osc1.stop(t + 0.26);
    } catch {
      // Audio context catch
    }
  }

  /**
   * Nitro boost ignition swoosh
   */
  public playNitroBoost() {
    if (!this.enabled) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(120, t);
      osc.frequency.exponentialRampToValueAtTime(440, t + 0.3);

      gain.gain.setValueAtTime(0.2, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.35);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + 0.36);
    } catch {
      // Audio context catch
    }
  }

  /**
   * Crash explosion & metal crunch
   */
  public playCrash() {
    if (!this.enabled) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const t = this.ctx.currentTime;
      // Low impact punch
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(160, t);
      osc.frequency.exponentialRampToValueAtTime(30, t + 0.45);

      gain.gain.setValueAtTime(0.35, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.5);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + 0.52);

      // Noise burst for crunch
      const bufferSize = this.ctx.sampleRate * 0.3;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }
      const whiteNoise = this.ctx.createBufferSource();
      whiteNoise.buffer = buffer;

      const noiseFilter = this.ctx.createBiquadFilter();
      noiseFilter.type = 'bandpass';
      noiseFilter.frequency.setValueAtTime(600, t);
      noiseFilter.Q.setValueAtTime(1.5, t);

      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(0.3, t);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);

      whiteNoise.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(this.ctx.destination);

      whiteNoise.start(t);
      whiteNoise.stop(t + 0.35);
    } catch {
      // Audio catch
    }
  }

  /**
   * Powerup pickup (shield / magnet / repair)
   */
  public playPowerup() {
    if (!this.enabled) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const t = this.ctx.currentTime;
      const notes = [440, 554.37, 659.25, 880]; // A4, C#5, E5, A5
      notes.forEach((freq, idx) => {
        if (!this.ctx) return;
        const noteOsc = this.ctx.createOscillator();
        const noteGain = this.ctx.createGain();
        const startTime = t + idx * 0.06;

        noteOsc.type = 'sine';
        noteOsc.frequency.setValueAtTime(freq, startTime);

        noteGain.gain.setValueAtTime(0.12, startTime);
        noteGain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.15);

        noteOsc.connect(noteGain);
        noteGain.connect(this.ctx.destination);

        noteOsc.start(startTime);
        noteOsc.stop(startTime + 0.16);
      });
    } catch {
      // Audio catch
    }
  }

  /**
   * Tire screech when braking hard or sudden swerve
   */
  public playScreech() {
    if (!this.enabled) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(750, t);
      osc.frequency.linearRampToValueAtTime(600, t + 0.2);

      gain.gain.setValueAtTime(0.08, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + 0.21);
    } catch {
      // Audio catch
    }
  }

  /**
   * Police siren blip for Police Chase mode
   */
  public playSiren() {
    if (!this.enabled) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(700, t);
      osc.frequency.linearRampToValueAtTime(950, t + 0.25);
      osc.frequency.linearRampToValueAtTime(700, t + 0.5);

      gain.gain.setValueAtTime(0.1, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.5);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + 0.51);
    } catch {
      // Audio catch
    }
  }
}

export const sound = new SoundSystem();
