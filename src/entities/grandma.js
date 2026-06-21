// =============================================================================
// grandma.js — the player's avatar. She is a small lady with brown hair and
// glasses who physically walks across the house to do everything. The player
// taps a destination + intent; she ambles there and performs the action on
// arrival. Her travel time IS the game's difficulty.
//
// hands state machine (what she's carrying):
//   'empty'  → nothing
//   'can'    → an opened can of cat food
//   'bowl'   → an empty bowl
//   'fullbowl' → a bowl of cat food, ready to serve a cat
//
// Combining is order-independent: empty→can→fullbowl, or empty→bowl→fullbowl.
// =============================================================================

import { GRANDMA } from '../config.js';
import { feedCat } from './cat.js';

export function makeGrandma(home) {
  return {
    x: home.x,
    y: home.y,
    hands: 'empty',
    target: null,    // { x, y } she is walking toward
    pending: null,   // { type: 'food' | 'bowl' | 'feed', catId? } to do on arrival
    facing: 1,       // -1 = facing left, 1 = facing right
    acting: 0,       // seconds left in the open-can / scoop / feed pause
    walkPhase: 0,    // animation phase while walking (drives the waddle)
  };
}

// Player intent: walk to `target` and then do `pending`.
export function sendGrandma(g, target, pending) {
  g.target = { x: target.x, y: target.y };
  g.pending = pending;
}

// Would this intent actually accomplish something given what she's holding?
// Used by input.js to give "nope" feedback instead of a pointless walk.
export function intentIsUseful(g, type) {
  if (type === 'food') return g.hands === 'empty' || g.hands === 'bowl';
  if (type === 'bowl') return g.hands === 'empty' || g.hands === 'can';
  if (type === 'feed') return g.hands === 'fullbowl';
  return false;
}

export function updateGrandma(g, dt, state, layout, hooks) {
  // mid-action pause (opening a can, scooping, feeding)
  if (g.acting > 0) {
    g.acting -= dt;
    if (g.acting <= 0) finishAction(g, state, hooks);
    return;
  }

  if (!g.target) return;

  const dx = g.target.x - g.x;
  const dy = g.target.y - g.y;
  const d = Math.hypot(dx, dy);
  if (dx !== 0) g.facing = dx < 0 ? -1 : 1;

  const speed = GRANDMA.speedFrac * Math.min(layout.w, layout.h);
  const step = speed * dt;

  if (d <= step + GRANDMA.reach) {
    // arrived — settle in and start the little action pause
    g.x = g.target.x;
    g.y = g.target.y;
    g.target = null;
    g.acting = GRANDMA.actionTime;
  } else {
    g.x += (dx / d) * step;
    g.y += (dy / d) * step;
    g.walkPhase += dt * 11;
  }
}

function finishAction(g, state, hooks) {
  const p = g.pending;
  g.pending = null;
  if (!p) return;

  if (p.type === 'food') {
    if (g.hands === 'empty') g.hands = 'can';        // opened a can
    else if (g.hands === 'bowl') g.hands = 'fullbowl'; // scooped into the bowl
    hooks.playCan();
  } else if (p.type === 'bowl') {
    if (g.hands === 'empty') g.hands = 'bowl';        // grabbed a clean bowl
    else if (g.hands === 'can') g.hands = 'fullbowl'; // tipped the can in
    hooks.playScoop();
  } else if (p.type === 'feed') {
    const cat = state.cats.find((c) => c.id === p.catId && c.status === 'waiting');
    if (cat && g.hands === 'fullbowl') {
      feedCat(cat, state, hooks);
      g.hands = 'empty';
    }
    // If the cat is gone (left or exploded), she just keeps the bowl for the
    // next hungry customer.
  }
}

// Keep her on-screen (and on the ground line) if the window was resized.
export function clampGrandma(g, layout) {
  g.x = Math.max(layout.w * 0.04, Math.min(layout.w * 0.96, g.x));
  g.y = layout.groundY;
}
