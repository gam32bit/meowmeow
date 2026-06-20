// =============================================================================
// input.js — turns a single tap/click (in CSS pixels) into a Grandma command,
// using the shared layout for hit-testing. Pointer wiring lives in main.js.
//
// The whole game is three taps:
//   tap the cat-food stack  → she opens a can
//   tap the bowl stack      → she grabs a bowl  (either order makes a full bowl)
//   tap a hungry cat        → she carries the full bowl over and feeds it
// =============================================================================

import { startRun } from '../state.js';
import { sendGrandma, intentIsUseful } from '../entities/grandma.js';
import { FEEL } from '../config.js';
import * as audio from './audio.js';

function dist2(ax, ay, bx, by) {
  const dx = ax - bx, dy = ay - by;
  return dx * dx + dy * dy;
}

function inRect(px, py, r) {
  return (
    Math.abs(px - r.x) <= r.w / 2 + 6 &&
    Math.abs(py - r.y) <= r.h / 2 + 6
  );
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
  if (dist2(px, py, m.x, m.y) <= (m.r * 1.4) ** 2) {
    state.muted = !state.muted;
    audio.setMuted(state.muted);
    return;
  }

  const g = state.grandma;
  if (!g) return;

  // Cat-food stack.
  if (inRect(px, py, layout.foodStack)) {
    command(state, g, layout.foodStack, 'food', hooks);
    return;
  }

  // Bowl stack.
  if (inRect(px, py, layout.bowlStack)) {
    command(state, g, layout.bowlStack, 'bowl', hooks);
    return;
  }

  // Hungry cats — send Grandma to feed (only works with a full bowl).
  for (const z of layout.zones) {
    const cat = state.cats.find((c) => c.zoneId === z.id && c.status === 'waiting');
    if (!cat) continue;
    if (dist2(px, py, z.x, z.y) <= (z.r * 1.6) ** 2) {
      if (intentIsUseful(g, 'feed')) {
        // Stand just in front of (below) the cat to serve it.
        sendGrandma(g, { x: z.x, y: z.y + z.r * 1.4 }, { type: 'feed', catId: cat.id });
        audio.playTap();
      } else {
        state.wrongFlash = FEEL.wrongFlashMs;
        audio.playWrong();
      }
      return;
    }
  }
}

// Walk Grandma to a station if the action would actually do something.
function command(state, g, station, type, hooks) {
  if (intentIsUseful(g, type)) {
    // Stand just above the counter stack so she faces it.
    sendGrandma(g, { x: station.x, y: station.y - station.h * 0.55 }, { type });
    audio.playTap();
  } else {
    state.wrongFlash = FEEL.wrongFlashMs;
    audio.playWrong();
  }
}
