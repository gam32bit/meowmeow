// =============================================================================
// audio.js — tiny WebAudio layer. Most sounds are synthesized; the cat meow is
// a real recording (assets/…cat-meow.mp3) played back with a rising pitch as a
// cat gets more desperate. Must be unlocked by a user gesture (mobile autoplay
// policy) — call unlock() from the first tap.
// =============================================================================

const MEOW_URL = './assets/dragon-studio-cute-cat-meow-472372.mp3';

let ctx = null;
let muted = false;
let meowBuffer = null;   // decoded recording; null until loaded
let meowLoading = false;

export function unlock() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
    loadMeow();
  }
  if (ctx.state === 'suspended') ctx.resume();
}

function loadMeow() {
  if (meowBuffer || meowLoading || !ctx) return;
  meowLoading = true;
  fetch(MEOW_URL)
    .then((r) => r.arrayBuffer())
    .then((buf) => ctx.decodeAudioData(buf))
    .then((decoded) => { meowBuffer = decoded; })
    .catch(() => { meowLoading = false; }); // fall back to the synth meow
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

// The cat meow (recording). `urgency` 0..1 raises the pitch — calm cats sound
// normal, panicking ones squeak higher. Falls back to a synth meow until the
// recording has finished decoding.
export function playMeow(urgency = 0) {
  if (!ctx || muted) return;
  if (!meowBuffer) {
    loadMeow();
    synthMeow(urgency);
    return;
  }
  const t0 = ctx.currentTime;
  const src = ctx.createBufferSource();
  src.buffer = meowBuffer;
  // higher pitch (and slightly faster) as urgency rises, with a little variety
  src.playbackRate.value = 1.0 + urgency * 0.95 + (Math.random() - 0.5) * 0.08;
  const g = ctx.createGain();
  g.gain.value = 0.9;
  src.connect(g).connect(ctx.destination);
  src.start(t0);
}

// Backup meow if the recording isn't ready yet: two quick pitch sweeps.
function synthMeow(urgency = 0) {
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

// Explosion: a big, loud KABOOM — a fat filtered-noise blast, a deep sub-boom
// and a punchy crack, all summed through a limiter so it hits hard without
// turning into harsh clipping.
export function playExplosion() {
  if (!ctx || muted) return;
  const t0 = ctx.currentTime;
  const dur = 0.6;

  // shared bus: master gain → compressor (limiter) → speakers
  const bus = ctx.createGain();
  bus.gain.value = 0.95;
  const comp = ctx.createDynamicsCompressor();
  comp.threshold.setValueAtTime(-12, t0);
  comp.knee.setValueAtTime(8, t0);
  comp.ratio.setValueAtTime(14, t0);
  comp.attack.setValueAtTime(0.002, t0);
  comp.release.setValueAtTime(0.25, t0);
  bus.connect(comp).connect(ctx.destination);

  // fat filtered-noise blast (the body of the boom)
  const buffer = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * dur), ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) {
    const k = 1 - i / data.length;
    data[i] = (Math.random() * 2 - 1) * k * k;
  }
  const noise = ctx.createBufferSource();
  noise.buffer = buffer;
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(4200, t0);
  filter.frequency.exponentialRampToValueAtTime(90, t0 + dur);
  const ng = ctx.createGain();
  ng.gain.setValueAtTime(1.0, t0);
  ng.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  noise.connect(filter).connect(ng).connect(bus);
  noise.start(t0);

  // deep sub-boom that rolls underneath
  busTone(bus, 120, 30, 'sine', 0.9, 0.55, t0);
  // sharp punchy crack on the front
  busTone(bus, 240, 55, 'triangle', 0.55, 0.18, t0);
}

// like tone(), but plays into a provided node (e.g. the explosion limiter bus).
function busTone(dest, freqStart, freqEnd, type, gain, dur, t0) {
  if (!ctx || muted) return;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freqStart, t0);
  osc.frequency.exponentialRampToValueAtTime(Math.max(1, freqEnd), t0 + dur);
  env(g, gain, t0, 0.005, dur * 0.3, dur * 0.65);
  osc.connect(g).connect(dest);
  osc.start(t0);
  osc.stop(t0 + dur + 0.05);
}

// Soft tick for UI taps (issuing a command / selecting a target).
export function playTap() {
  tone(660, 660, 'sine', 0.06, 0.06);
}

// Opening a can of cat food: a short metallic "tk-pop".
export function playCan() {
  tone(900, 1500, 'square', 0.07, 0.05);
  setTimeout(() => tone(400, 260, 'triangle', 0.08, 0.1), 50);
}

// Scooping food into / grabbing a bowl: a soft ceramic clink.
export function playScoop() {
  tone(520, 520, 'triangle', 0.09, 0.09);
  setTimeout(() => tone(740, 700, 'sine', 0.07, 0.1), 60);
}
