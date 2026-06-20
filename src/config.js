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
// Positions are fractions of the play area (0..1), resolved to pixels at
// layout time. Keeps everything responsive.
export const ZONES = [
  { id: 'door',   label: 'Front Door', fx: 0.16, fy: 0.22 },
  { id: 'window', label: 'Window',     fx: 0.84, fy: 0.20 },
  { id: 'porch',  label: 'Back Porch', fx: 0.16, fy: 0.58 },
  { id: 'garden', label: 'Garden',     fx: 0.84, fy: 0.56 },
];

// --- Difficulty curve ------------------------------------------------------
// `level` rises by 1 every LEVEL_UP_EVERY cats fed. Each getter is clamped so
// the game stays hard-but-fair forever. Patience is generous because Grandma
// physically walks to every cat — that travel time is the real pressure.
export const LEVEL_UP_EVERY = 5;   // cats fed per level

export const DIFFICULTY = {
  // Seconds between spawns: starts gentle, ramps to frantic.
  spawnInterval(level) {
    return Math.max(2.0, 4.4 - level * 0.28);
  },
  // Seconds of patience a new cat has before exploding.
  patience(level) {
    return Math.max(9, 20 - level * 0.9);
  },
  // Max cats on screen at once.
  maxCats(level) {
    return Math.min(ZONES.length, 1 + Math.floor(level / 2));
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
export const FEEL = {
  explosionShake: 34,       // screen shake magnitude on explosion (px)
  explosionFlashMs: 320,    // white/orange full-screen flash on explosion
  wrongFlashMs: 250,        // red flash when you tap a cat with empty hands
};
