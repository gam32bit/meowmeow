// =============================================================================
// audio.js — tiny WebAudio synth. No sound files: everything is generated.
// Must be unlocked by a user gesture (mobile autoplay policy) — call unlock()
// from the first tap.
// =============================================================================

let ctx = null;
let muted = false;

export function unlock() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
  }
  if (ctx.state === 'suspended') ctx.resume();
}

export function setMuted(v) {
  muted = v;
}
export function isMuted() {
  return muted;
}

function env(g, gain, t0, attack, hold, release) {
  g.gain.cancelScheduledValues(t0);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(gain, t0 + attack);
  g.gain.setValueAtTime(gain, t0 + attack + hold);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + attack + hold + release);
}

function tone(freqStart, freqEnd, type, gain, dur) {
  if (!ctx || muted) return;
  const t0 = ctx.currentTime;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freqStart, t0);
  osc.frequency.exponentialRampToValueAtTime(Math.max(1, freqEnd), t0 + dur);
  env(g, gain, t0, 0.01, dur * 0.3, dur * 0.6);
  osc.connect(g).connect(ctx.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.05);
}

// A meow: two quick pitch sweeps. `urgency` 0..1 raises pitch + speed.
export function playMeow(urgency = 0) {
  if (!ctx || muted) return;
  const base = 480 + urgency * 360;
  tone(base, base * 1.5, 'sawtooth', 0.12, 0.12);
  setTimeout(() => tone(base * 1.4, base * 0.8, 'sawtooth', 0.1, 0.16), 90);
}

// Success chime: a happy little arpeggio.
export function playSuccess() {
  if (!ctx || muted) return;
  [523, 659, 784, 1046].forEach((f, i) =>
    setTimeout(() => tone(f, f, 'triangle', 0.14, 0.18), i * 70)
  );
}

// Wrong dish: a short low buzz.
export function playWrong() {
  tone(220, 160, 'square', 0.12, 0.18);
}

// Explosion: filtered noise burst + a low thump.
export function playExplosion() {
  if (!ctx || muted) return;
  const t0 = ctx.currentTime;
  const dur = 0.5;
  const buffer = ctx.createBuffer(1, ctx.sampleRate * dur, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
  }
  const noise = ctx.createBufferSource();
  noise.buffer = buffer;
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(1800, t0);
  filter.frequency.exponentialRampToValueAtTime(200, t0 + dur);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.5, t0);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  noise.connect(filter).connect(g).connect(ctx.destination);
  noise.start(t0);
  // low thump under it
  tone(120, 40, 'sine', 0.3, 0.35);
}

// Soft tick for UI taps (cooking actions).
export function playTap() {
  tone(660, 660, 'sine', 0.06, 0.06);
}
