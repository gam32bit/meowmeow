// =============================================================================
// config.js — ALL gameplay balance + personalization in one place.
// Tweak anything here to retune the game; no other file should need editing.
// =============================================================================

// --- Personalization -------------------------------------------------------
// Change the title to make it personal, e.g. "Grandma's Cat Kitchen".
export const TITLE = 'Meow Meow';
export const SUBTITLE = "Grandma's Cat Kitchen";

// --- Core rules ------------------------------------------------------------
export const LIVES = 3;            // explosions you can survive before game over

// --- Grandma (the player's avatar) -----------------------------------------
// She is small, has brown hair + glasses, and wears a cozy cardigan. She walks
// across the house to do things, so timing your taps is the whole challenge.
export const GRANDMA = {
  speedFrac: 0.5,   // how fast she walks: fraction of min(w,h) per second
  actionTime: 0.4,  // seconds she pauses to open a can / scoop / feed
  reach: 8,         // px arrival slack
};

// --- Cat zones (where cats appear around the house) ------------------------
// The scene is horizontal: the house sits in the middle and stray cats wander
// in along the ground on either side of it. `fx` is a fraction of the play
// width; every cat stands on the same ground line (resolved in layout.js), so
// Grandma's whole journey is a left-right stroll.
export const ZONES = [
  { id: 'farLeft',  label: 'Yard',  fx: 0.06, side: -1 },
  { id: 'left',     label: 'Step',  fx: 0.24, side: -1 },
  { id: 'right',    label: 'Step',  fx: 0.76, side: 1 },
  { id: 'farRight', label: 'Yard',  fx: 0.94, side: 1 },
];

// --- Difficulty curve ------------------------------------------------------
// `level` rises by 1 every LEVEL_UP_EVERY cats fed. Each getter is clamped so
// the game stays hard-but-fair forever. Patience is generous because Grandma
// physically walks to every cat — that travel time is the real pressure.
export const LEVEL_UP_EVERY = 5;   // cats fed per level

export const DIFFICULTY = {
  // Seconds between spawns: starts gentle, ramps to frantic — and ramps faster
  // now (steeper per-level drop + lower floor) so cats arrive thick and fast.
  spawnInterval(level) {
    return Math.max(1.3, 3.8 - level * 0.42);
  },
  // Seconds of patience a new cat has before exploding. Shorter + a steeper
  // drop than before, so the hunger ring drains noticeably faster.
  patience(level) {
    return Math.max(7, 14 - level * 1.0);
  },
  // Max cats on screen at once. Climbs by one every level so the yard fills up
  // fast: 1 cat at the start, then 2, 3, and all 4 zones swarming by level 3.
  maxCats(level) {
    return Math.min(ZONES.length, level + 1);
  },
};

// --- Scoring ---------------------------------------------------------------
export const SCORE = {
  base: 100,                // per cat fed
  speedBonusMax: 100,       // max bonus for feeding with full patience left
  comboStep: 0.25,          // each combo adds 25% to the multiplier
  comboMax: 4,              // cap the multiplier at 4x
};

// --- Feel ------------------------------------------------------------------
// Explosions are BIG now: a real boom on the cat plus a screen-wide kick and a
// short flash. Kept tasteful (not cranked) so phones don't stutter — dial these
// down toward 0 if you ever want the quieter, contained pop back.
export const FEEL = {
  explosionShake: 14,       // screen shake magnitude on explosion (px)
  explosionFlashMs: 130,    // full-screen flash on explosion (ms)
  wrongFlashMs: 400,        // how long the local red "✗" shows on a mis-tap (ms)
};

// --- Explosions grow over a run --------------------------------------------
// Each blast in a single run is bigger than the last: the first is a contained
// pop, the final one (when the last life is lost) nearly fills the screen. The
// returned value is the radius (px) handed to the explosion art, sized relative
// to the screen diagonal so it scales across phones and desktops.
export const EXPLOSION = {
  smallFrac: 0.11,  // first blast radius as a fraction of the screen diagonal
  hugeFrac: 0.36,   // last blast radius as a fraction of the screen diagonal
  // n is 1-based (1..total); diag = hypot(screenW, screenH).
  radius(n, total, diag) {
    const frac = total > 1 ? Math.max(0, Math.min(1, (n - 1) / (total - 1))) : 1;
    return diag * (this.smallFrac + (this.hugeFrac - this.smallFrac) * frac);
  },
};
