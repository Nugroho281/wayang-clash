// Wayang Clash — sounds, synthesized live with WebAudio. No audio files, no
// network: a few short blips (play, clash, heal, win fanfare, loss drone).
// Everything is guarded: a browser without audio just plays silently.

let ctx = null;

function audioCtx() {
  if (ctx) return ctx;
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  } catch {
    return null;
  }
  return ctx;
}

function tone(freq, seconds, type, gainValue, when = 0) {
  const ac = audioCtx();
  if (!ac) return;
  try {
    if (ac.state === 'suspended') void ac.resume();
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    const start = ac.currentTime + when;
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(gainValue, start + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + seconds);
    osc.connect(gain);
    gain.connect(ac.destination);
    osc.start(start);
    osc.stop(start + seconds + 0.05);
  } catch {
    // Sound is garnish; a failure here must never break the game.
  }
}

/** Unlock audio on the first user gesture (browsers require one). */
export function unlockAudio() {
  audioCtx();
}

export function playCardSound() {
  tone(520, 0.12, 'triangle', 0.12);
  tone(780, 0.1, 'triangle', 0.08, 0.05);
}

export function clashSound() {
  tone(160, 0.18, 'sawtooth', 0.1);
  tone(90, 0.22, 'square', 0.06, 0.03);
}

export function healSound() {
  tone(660, 0.15, 'sine', 0.1);
  tone(880, 0.2, 'sine', 0.08, 0.08);
}

export function winSound() {
  [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.35, 'triangle', 0.12, i * 0.12));
}

export function lossSound() {
  [392, 330, 262, 196].forEach((f, i) => tone(f, 0.4, 'sawtooth', 0.06, i * 0.15));
}
