// =============================================================================
// input.js — turns a single tap/click (in CSS pixels) into a game action,
// using the shared layout for hit-testing. Pointer wiring lives in main.js.
// =============================================================================

import { startRun } from '../state.js';
import { startBowl, addIngredient, trashActive, selectSlot } from '../entities/station.js';
import { tryFeed } from '../entities/cat.js';
import * as audio from './audio.js';

function dist2(ax, ay, bx, by) {
  const dx = ax - bx, dy = ay - by;
  return dx * dx + dy * dy;
}

export function handleTap(state, layout, px, py, hooks) {
  audio.unlock(); // first gesture unlocks WebAudio on mobile

  // Start / restart from the title or game-over screens.
  if (state.phase !== 'playing') {
    startRun(state);
    return;
  }

  // Mute toggle.
  const m = layout.muteBtn;
  if (dist2(px, py, m.x, m.y) <= (m.r * 1.3) ** 2) {
    state.muted = !state.muted;
    audio.setMuted(state.muted);
    return;
  }

  // Station buttons.
  for (const s of layout.stations) {
    if (Math.abs(px - s.x) <= s.w / 2 + 4 && Math.abs(py - s.y) <= s.h / 2 + 4) {
      doStation(state, s.id);
      return;
    }
  }

  // Plating slots — tap to make active.
  for (const p of layout.plates) {
    if (dist2(px, py, p.x, p.y) <= (p.r * 1.25) ** 2) {
      selectSlot(state, p.index);
      audio.playTap();
      return;
    }
  }

  // Cats — tap to serve the active dish.
  for (const z of layout.zones) {
    const cat = state.cats.find((c) => c.zoneId === z.id && c.status === 'waiting');
    if (!cat) continue;
    if (dist2(px, py, z.x, z.y) <= (z.r * 1.3) ** 2) {
      tryFeed(cat, state, hooks);
      return;
    }
  }
}

function doStation(state, id) {
  let ok = false;
  if (id === 'bowl') ok = startBowl(state);
  else if (id === 'trash') ok = trashActive(state);
  else ok = addIngredient(state, id);
  if (ok) audio.playTap();
  else audio.playWrong();
}
