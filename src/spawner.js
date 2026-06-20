// =============================================================================
// spawner.js — decides when a new hungry cat shows up and where, following the
// difficulty curve in config.js.
// =============================================================================

import { DIFFICULTY, ZONES } from './config.js';
import { makeCat } from './entities/cat.js';

// Called every frame. Counts down a timer; spawns when it hits zero and there's
// both room on screen and a free zone.
export function updateSpawner(state, dt) {
  state.spawnTimer -= dt;
  if (state.spawnTimer > 0) return;

  const liveCats = state.cats.filter((c) => c.status === 'waiting');
  if (liveCats.length >= DIFFICULTY.maxCats(state.level)) {
    // at capacity — try again shortly
    state.spawnTimer = 0.5;
    return;
  }

  const occupied = new Set(liveCats.map((c) => c.zoneId));
  const free = ZONES.filter((z) => !occupied.has(z.id));
  if (free.length === 0) {
    state.spawnTimer = 0.5;
    return;
  }

  const zone = free[Math.floor(Math.random() * free.length)];
  state.cats.push(makeCat(state, zone.id));

  // schedule the next one, with a little randomness so it isn't metronomic
  const base = DIFFICULTY.spawnInterval(state.level);
  state.spawnTimer = base * (0.8 + Math.random() * 0.4);
}
