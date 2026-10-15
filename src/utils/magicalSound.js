/**
 * Procedural Web Audio API Magical Sound Engine (霍格沃茨魔法音效合成引擎)
 * Synthesizes organic parchment rustles, wand chimes, and hourglass gem drops in real-time:
 * - 0 kB External Audio Binary Assets (Pure native Web Audio nodes)
 * - Safe lazy initialization (resumes suspended AudioContext on user interaction)
 * - Zero emoji compliance
 * - Fully configurable mute state persisted in localStorage ('hp_magical_sound_muted')
 */

class MagicalSoundEngine {
  constructor() {
    this._ctx = null;
    this._muted = false;

    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('hp_magical_sound_muted');
        this._muted = stored === 'true';
      } catch {}
    }
  }

  _getAudioContext() {
    if (typeof window === 'undefined') return null;
    try {
      if (!this._ctx) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) {
          this._ctx = new AudioCtx();
        }
      }
      if (this._ctx && this._ctx.state === 'suspended') {
        this._ctx.resume().catch(() => {});
      }
      return this._ctx;
    } catch {
      return null;
    }
  }

  isMuted() {
    return this._muted;
  }

  toggleMute() {
    this._muted = !this._muted;
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('hp_magical_sound_muted', this._muted ? 'true' : 'false');
      } catch {}
    }
    return this._muted;
  }

  setMuted(val) {
    this._muted = !!val;
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('hp_magical_sound_muted', this._muted ? 'true' : 'false');
      } catch {}
    }
  }

  /**
   * playParchment — Soft organic rustle of ancient parchment turning
   * Filtered white noise with quick low-pass decay envelope (120ms)
   */
  playParchment() {
    if (this._muted) return;
    try {
      const ctx = this._getAudioContext();
      if (!ctx) return;

      const bufferSize = ctx.sampleRate * 0.12; // 120ms
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);

      // Generate soft pinkish-brown noise
      let last = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        last = (last + 0.03 * white) / 1.03;
        data[i] = last * 1.5;
      }

      const noise = ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(900, ctx.currentTime);
      filter.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.12);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.01, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.08, ctx.currentTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      noise.start();
    } catch {}
  }

  /**
   * playWandTap — Crisp, celestial wand tip chime
   * Dual sine waves (A5: 880Hz, A6: 1760Hz) with exponential bell decay
   */
  playWandTap() {
    if (this._muted) return;
    try {
      const ctx = this._getAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;

      // Primary tone
      const osc1 = ctx.createOscillator();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(880, now);
      osc1.frequency.exponentialRampToValueAtTime(1100, now + 0.08);

      // Shimmer harmonic
      const osc2 = ctx.createOscillator();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(1760, now);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.16);
      osc2.stop(now + 0.16);
    } catch {}
  }

  /**
   * playGemDrop — Crystalline gem drop into Great Hall House Hourglass
   * Dual high-frequency crystal resonance with resonant decay
   */
  playGemDrop() {
    if (this._muted) return;
    try {
      const ctx = this._getAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;

      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1318, now); // E6
      osc.frequency.exponentialRampToValueAtTime(2637, now + 0.04); // E7
      osc.frequency.exponentialRampToValueAtTime(1318, now + 0.18);

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1800, now);
      filter.Q.setValueAtTime(5, now);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.2);
    } catch {}
  }
}

export const magicalSound = new MagicalSoundEngine();
export default magicalSound;
