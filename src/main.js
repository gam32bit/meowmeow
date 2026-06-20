// =============================================================================
// main.js — bootstrap: canvas + DPR setup, the RAF game loop, input wiring,
// and the "hooks" that let entities trigger sounds/effects without importing
// each other in a tangle.
// =============================================================================

import { createState } from './state.js';
import { computeLayout } from './systems/layout.js';
import { render } from './systems/render.js';
import { handleTap } from './systems/input.js';
import { updateSpawner } from './spawner.js';
import { updateCat } from './entities/cat.js';
import { submitScore } from './systems/storage.js';
import * as audio from './systems/audio.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

const state = createState();
let layout = computeLayout(window.innerWidth, window.innerHeight);

// --- responsive canvas (DPR-aware) -----------------------------------------
function resize() {
  const dpr = Math.min(window.devicePixelRatio || 1, 3);
  const w = window.innerWidth;
  const h = window.innerHeight;
  canvas.width = Math.round(w * dpr);
  canvas.height = Math.round(h * dpr);
  canvas.style.width = w + 'px';
  canvas.style.height = h + 'px';
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  layout = computeLayout(w, h);
}
window.addEventListener('resize', resize);
window.addEventListener('orientationchange', resize);
resize();

// --- hooks: how entities reach audio + effects + game-over -----------------
const hooks = {
  spawnExplosion(zoneId) {
    state.effects.push({ type: 'explosion', zoneId, t: 0, life: 0.65 });
  },
  spawnHearts(zoneId, points) {
    state.effects.push({ type: 'hearts', zoneId, points, t: 0, life: 1.0 });
  },
  playExplosion: () => audio.playExplosion(),
  playSuccess: () => audio.playSuccess(),
  playWrong: () => audio.playWrong(),
  gameOver() {
    state.phase = 'gameover';
    state.newHighScore = submitScore(state.score);
    state.highScore = Math.max(state.highScore, state.score);
  },
};

// --- input: one unified tap handler for touch + mouse ----------------------
function pointerPos(e) {
  const rect = canvas.getBoundingClientRect();
  const src = e.touches && e.touches[0] ? e.touches[0] : e;
  return { x: src.clientX - rect.left, y: src.clientY - rect.top };
}
function onTap(e) {
  e.preventDefault();
  const { x, y } = pointerPos(e);
  handleTap(state, layout, x, y, hooks);
}
canvas.addEventListener('touchstart', onTap, { passive: false });
canvas.addEventListener('mousedown', onTap);

// pause the clock when the tab is hidden so cats don't all die in the background
let hidden = false;
document.addEventListener('visibilitychange', () => {
  hidden = document.hidden;
});

// --- update ----------------------------------------------------------------
function update(dt) {
  state.time += dt;

  // decay feedback timers
  if (state.shake > 0) state.shake = Math.max(0, state.shake - dt * 60);
  if (state.wrongFlash > 0) state.wrongFlash = Math.max(0, state.wrongFlash - dt * 1000);

  // advance effects, drop finished ones
  for (const e of state.effects) e.t += dt;
  state.effects = state.effects.filter((e) => e.t < e.life);

  if (state.phase !== 'playing') return;

  updateSpawner(state, dt);

  for (const cat of state.cats) {
    updateCat(cat, dt, state, hooks);
    // periodic meow with rising urgency as patience drains
    if (cat.status === 'waiting') {
      cat.meowTimer -= dt;
      if (cat.meowTimer <= 0) {
        const ratio = cat.patience / cat.patienceMax;
        const urgency = 1 - Math.max(0, Math.min(1, ratio));
        audio.playMeow(urgency);
        cat.meowTimer = 0.6 + ratio * 2.2; // calmer cats meow less often
      }
    }
  }
  state.cats = state.cats.filter((c) => c.status !== 'dead');
}

// --- loop ------------------------------------------------------------------
let last = performance.now();
function frame(now) {
  let dt = (now - last) / 1000;
  last = now;
  if (hidden) dt = 0;
  dt = Math.min(dt, 0.05); // clamp big gaps (tab switches, slow frames)

  update(dt);

  // screen shake
  ctx.save();
  if (state.shake > 0) {
    const s = state.shake;
    ctx.translate((Math.random() - 0.5) * s, (Math.random() - 0.5) * s);
  }
  render(ctx, state, layout);
  ctx.restore();

  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

// --- service worker (PWA offline) ------------------------------------------
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  });
}
