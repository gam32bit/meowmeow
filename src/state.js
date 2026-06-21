// =============================================================================
// state.js — the whole mutable game world in one object + helpers to reset it.
// =============================================================================

import { LIVES } from './config.js';
import { getHighScore } from './systems/storage.js';

// phase: 'start' | 'playing' | 'gameover'
export function createState() {
  return {
    phase: 'start',
    score: 0,
    combo: 0,            // consecutive feeds without an explosion
    lives: LIVES,
    catsFed: 0,
    level: 0,
    highScore: getHighScore(),
    newHighScore: false,

    time: 0,             // seconds since game start (drives spawner + animation)
    spawnTimer: 0,       // counts down to next spawn

    // First-run hints, shown one at a time then gone for good:
    // 'bowl' → 'food' → 'feed' → 'done'.
    tutorial: 'bowl',

    cats: [],            // active Cat instances
    grandma: null,       // the player's avatar; created lazily once layout exists
    effects: [],         // transient visual effects (explosions, hearts)

    shake: 0,            // current screen-shake magnitude (explosions keep this 0)
    flash: 0,            // ms remaining of any full-screen flash (kept 0 now)
    muted: false,
  };
}

// Reset for a fresh run while keeping the persisted high score.
export function startRun(state) {
  const hs = getHighScore();
  Object.assign(state, createState(), { phase: 'playing', highScore: hs });
}
