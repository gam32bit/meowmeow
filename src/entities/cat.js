// =============================================================================
// cat.js — the Cat entity: an order, a patience timer, and a little mood
// state machine. Cats are created by the spawner; this file owns their update,
// their feeding payoff, and their (comedic) demise.
// =============================================================================

import { DIFFICULTY, SCORE, FEEL, RECIPES, LEVEL_UP_EVERY } from '../config.js';
import { matchRecipe } from './station.js';

let nextId = 1;

// Soft pastel coats so each cat reads as its own little guy.
const COATS = ['#9b8bb4', '#e0a96d', '#7fae8e', '#c98b9b', '#8badcf', '#b0a48f'];

export function makeCat(state, zoneId, recipe) {
  const patience = DIFFICULTY.patience(state.level);
  return {
    id: nextId++,
    zoneId,
    recipe,
    patienceMax: patience,
    patience,
    coat: COATS[(nextId * 3) % COATS.length],
    status: 'waiting', // 'waiting' | 'leaving' | 'dead'
    t: Math.random() * 10, // animation phase offset
    pop: 0,                // 0..1 spawn-in scale animation
    leaveTimer: 0,         // counts up while happily leaving
    meowTimer: 0.6,        // counts down to the next meow sfx
  };
}

export function catMood(cat) {
  if (cat.status === 'leaving') return 'happy';
  const ratio = cat.patience / cat.patienceMax;
  if (ratio > 0.5) return 'calm';
  if (ratio > 0.22) return 'worried';
  return 'panic';
}

// Advance one cat. May push effects + mutate lives/combo via callbacks given
// by the game loop (kept here so all cat consequences live together).
export function updateCat(cat, dt, state, hooks) {
  cat.t += dt;
  cat.pop = Math.min(1, cat.pop + dt * 5);

  if (cat.status === 'leaving') {
    cat.leaveTimer += dt;
    if (cat.leaveTimer > 0.8) cat.status = 'dead';
    return;
  }

  cat.patience -= dt;
  if (cat.patience <= 0) {
    explode(cat, state, hooks);
  }
}

function explode(cat, state, hooks) {
  cat.status = 'dead';
  state.lives -= 1;
  state.combo = 0;
  state.shake = FEEL.explosionShake;
  hooks.spawnExplosion(cat.zoneId);
  hooks.playExplosion();
  if (state.lives <= 0) hooks.gameOver();
}

// Try to serve the active plate to this cat. Returns true on a correct feed.
export function tryFeed(cat, state, hooks) {
  if (cat.status !== 'waiting') return false;
  const plate = state.plates[state.activeSlot];
  const recipe = plate && matchRecipe(plate.steps);
  if (!recipe || recipe.id !== cat.recipe.id) {
    // wrong / empty dish — feedback, but don't punish lives
    state.wrongFlash = FEEL.wrongFlashMs;
    hooks.playWrong();
    return false;
  }

  // Correct! Score with complexity + speed + combo.
  const ratio = Math.max(0, cat.patience / cat.patienceMax);
  const speedBonus = Math.round(SCORE.speedBonusMax * ratio);
  const complexity = SCORE.perStep * recipe.steps.length;
  const mult = Math.min(SCORE.comboMax, 1 + state.combo * SCORE.comboStep);
  const gained = Math.round((SCORE.base + complexity + speedBonus) * mult);

  state.score += gained;
  state.combo += 1;
  state.catsFed += 1;
  state.level = Math.floor(state.catsFed / LEVEL_UP_EVERY);
  state.plates[state.activeSlot] = null;

  cat.status = 'leaving';
  cat.leaveTimer = 0;
  hooks.spawnHearts(cat.zoneId, gained);
  hooks.playSuccess();
  return true;
}

// Pick a recipe allowed at the current level (within max tier).
export function pickRecipe(state) {
  const maxTier = DIFFICULTY.maxTier(state.level);
  const pool = RECIPES.filter((r) => r.tier <= maxTier);
  return pool[Math.floor(Math.random() * pool.length)];
}
