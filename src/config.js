// =============================================================================
// config.js — ALL gameplay balance + personalization in one place.
// Tweak anything here to retune the game; no other file should need editing.
// =============================================================================

// --- Personalization -------------------------------------------------------
// Change the title to make it personal, e.g. "Mom's Stray Cat Kitchen".
export const TITLE = 'Meow Meow';
export const SUBTITLE = 'Stray Cat Kitchen';

// --- Core rules ------------------------------------------------------------
export const LIVES = 3;            // explosions you can survive before game over
export const PLATING_SLOTS = 2;    // dishes you can have in progress / ready at once

// --- Ingredients -----------------------------------------------------------
// Each ingredient has an id, a friendly label, and a color used by the art.
// "bowl" is special: it starts a dish. Others are steps added on top.
export const INGREDIENTS = {
  bowl:    { id: 'bowl',    label: 'Bowl',   color: '#cfd8e3' },
  kibble:  { id: 'kibble',  label: 'Kibble', color: '#b5651d' },
  milk:    { id: 'milk',    label: 'Milk',   color: '#f7f7fa' },
  tuna:    { id: 'tuna',    label: 'Tuna',   color: '#e8a07a' },
  fish:    { id: 'fish',    label: 'Fish',   color: '#8fc7e8' },
  garnish: { id: 'garnish', label: 'Herb',   color: '#7bbf6a' },
};

// Stations the player can tap in the kitchen. Order = left-to-right layout.
// "bowl" and "trash" are control stations; the rest add their ingredient.
export const STATIONS = ['bowl', 'kibble', 'milk', 'tuna', 'fish', 'garnish', 'trash'];

// --- Recipes ---------------------------------------------------------------
// A recipe is an ordered list of ingredient ids the player must add (the first
// is always "bowl"). `tier` gates when it can start appearing (see difficulty).
// `name` shows in the cat's order bubble. Matching is order-sensitive.
export const RECIPES = [
  { id: 'kibble_bowl', name: 'Kibble',  tier: 0, steps: ['bowl', 'kibble'] },
  { id: 'milk_bowl',   name: 'Milk',    tier: 0, steps: ['bowl', 'milk'] },
  { id: 'tuna_bowl',   name: 'Tuna',    tier: 1, steps: ['bowl', 'tuna'] },
  { id: 'fish_plate',  name: 'Fish',    tier: 1, steps: ['bowl', 'fish'] },
  { id: 'tuna_herb',   name: 'Tuna+Herb', tier: 2, steps: ['bowl', 'tuna', 'garnish'] },
  { id: 'fish_herb',   name: 'Fish+Herb', tier: 2, steps: ['bowl', 'fish', 'garnish'] },
  { id: 'surf_turf',   name: 'Surf&Turf', tier: 3, steps: ['bowl', 'tuna', 'fish'] },
  { id: 'deluxe',      name: 'Deluxe',  tier: 3, steps: ['bowl', 'fish', 'tuna', 'garnish'] },
];

// --- Cat zones (where cats appear around the house) ------------------------
// Positions are fractions of the "house" area (0..1), resolved to pixels at
// layout time. Keeps everything responsive.
export const ZONES = [
  { id: 'door',   label: 'Front Door', fx: 0.22, fy: 0.30 },
  { id: 'window', label: 'Window',     fx: 0.74, fy: 0.26 },
  { id: 'porch',  label: 'Back Porch', fx: 0.24, fy: 0.70 },
  { id: 'garden', label: 'Garden',     fx: 0.76, fy: 0.72 },
];

// --- Difficulty curve ------------------------------------------------------
// `level` rises by 1 every LEVEL_UP_EVERY cats fed. Each getter is clamped so
// the game stays hard-but-fair forever.
export const LEVEL_UP_EVERY = 5;   // cats fed per level

export const DIFFICULTY = {
  // Seconds between spawns: starts slow, ramps to a frantic minimum.
  spawnInterval(level) {
    return Math.max(1.4, 3.6 - level * 0.22);
  },
  // Seconds of patience a new cat has before exploding.
  patience(level) {
    return Math.max(6, 14 - level * 0.7);
  },
  // Max cats on screen at once.
  maxCats(level) {
    return Math.min(ZONES.length, 1 + Math.floor(level / 2));
  },
  // Highest recipe tier allowed to appear at this level.
  maxTier(level) {
    if (level < 2) return 0;
    if (level < 4) return 1;
    if (level < 7) return 2;
    return 3;
  },
};

// --- Scoring ---------------------------------------------------------------
export const SCORE = {
  base: 50,                 // per cat fed
  perStep: 25,              // bonus per recipe step (complexity reward)
  speedBonusMax: 100,       // max bonus for feeding with full patience left
  comboStep: 0.25,          // each combo adds 25% to the multiplier
  comboMax: 4,              // cap the multiplier at 4x
};

// --- Feel ------------------------------------------------------------------
export const FEEL = {
  explosionShake: 14,       // screen shake magnitude on explosion (px)
  wrongFlashMs: 300,        // red flash when a wrong dish is served
};
