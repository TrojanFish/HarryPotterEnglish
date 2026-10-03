/**
 * spellAudioSynthesizer.js
 * Hogwarts Web Audio API Pure Synthetic Sound Generator
 * 
 * Generates instant, crystal-clear magical audio cues without loading external MP3 files:
 * - Crystal chime on correct word/tile (晶体魔咒命中音)
 * - Upward arpeggio on combo streak (炽热连击琶音)
 * - Muffled low thud on typo / shield loss (护盾受损沉闷音)
 * - Victory fanfare chord on chapter complete (通关魔法和弦)
 * - Safe fallback when Web Audio is unsupported or muted
 */

let audioCtx = null;
let isSoundEnabled = true;

// Initialize sound preference from localStorage
try {
  const savedPref = localStorage.getItem('hp_dictation_sound_enabled');
  if (savedPref !== null) {
    isSoundEnabled = savedPref === 'true';
  }
} catch {
  isSoundEnabled = true;
}

function getAudioContext() {
  if (typeof window === 'undefined') return null;
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return null;
  if (!audioCtx) {
    audioCtx = new AudioContextClass();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

/**
 * Toggle sound effects on/off
 * @param {boolean} [forceState]
 * @returns {boolean} New state
 */
export function toggleSpellSound(forceState) {
  if (typeof forceState === 'boolean') {
    isSoundEnabled = forceState;
  } else {
    isSoundEnabled = !isSoundEnabled;
  }
  try {
    localStorage.setItem('hp_dictation_sound_enabled', String(isSoundEnabled));
  } catch {}
  return isSoundEnabled;
}

/**
 * Check if sound is currently enabled
 * @returns {boolean}
 */
export function getSpellSoundStatus() {
  return isSoundEnabled;
}

/**
 * Play a bell chime when a correct word or tile is selected
 */
export function playCorrectChime() {
  if (!isSoundEnabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sine';
  osc.frequency.setValueAtTime(880, now); // A5 note
  osc.frequency.exponentialRampToValueAtTime(1760, now + 0.15); // A6 sparkle

  gain.gain.setValueAtTime(0.12, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + 0.36);
}

/**
 * Play an upward arpeggio on combo streak
 */
export function playComboArpeggio() {
  if (!isSoundEnabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6 (Major triad)

  notes.forEach((freq, idx) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const noteStart = now + idx * 0.06;

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, noteStart);

    gain.gain.setValueAtTime(0.15, noteStart);
    gain.gain.exponentialRampToValueAtTime(0.001, noteStart + 0.25);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(noteStart);
    osc.stop(noteStart + 0.26);
  });
}

/**
 * Play a muffled wooden thud on mistake or shield break
 */
export function playMistakeThud() {
  if (!isSoundEnabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(180, now);
  osc.frequency.exponentialRampToValueAtTime(60, now + 0.2);

  gain.gain.setValueAtTime(0.15, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + 0.23);
}

/**
 * Play a celebratory fanfare on completing chapter quest
 */
export function playVictoryFanfare() {
  if (!isSoundEnabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  // Hogwarts fanfare: G4 -> C5 -> E5 -> G5
  const chords = [
    { freq: 392.00, delay: 0 },
    { freq: 523.25, delay: 0.12 },
    { freq: 659.25, delay: 0.24 },
    { freq: 783.99, delay: 0.38 },
  ];

  chords.forEach(({ freq, delay }) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const noteStart = now + delay;

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, noteStart);

    gain.gain.setValueAtTime(0.18, noteStart);
    gain.gain.exponentialRampToValueAtTime(0.001, noteStart + 0.6);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(noteStart);
    osc.stop(noteStart + 0.62);
  });
}

export default {
  toggleSpellSound,
  getSpellSoundStatus,
  playCorrectChime,
  playComboArpeggio,
  playMistakeThud,
  playVictoryFanfare,
};
