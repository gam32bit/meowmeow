// =============================================================================
// station.js — cooking actions + recipe matching that operate on the plates.
// Plates live on state.plates; each is { steps: ['bowl', ...] } or null.
// =============================================================================

import { RECIPES, INGREDIENTS } from '../config.js';

// Does a list of steps exactly match a known recipe? Returns the recipe or null.
export function matchRecipe(steps) {
  if (!steps || steps.length === 0) return null;
  return (
    RECIPES.find(
      (r) =>
        r.steps.length === steps.length &&
        r.steps.every((s, i) => s === steps[i])
    ) || null
  );
}

// Tap the bowl station: start a fresh bowl on the active slot (if free).
// Returns true if something happened (for sfx/feedback).
export function startBowl(state) {
  const i = state.activeSlot;
  if (state.plates[i]) return false; // slot busy — keep what's there
  state.plates[i] = { steps: ['bowl'] };
  return true;
}

// Tap an ingredient station: add it to the active plate (must have a bowl).
export function addIngredient(state, id) {
  if (!INGREDIENTS[id] || id === 'bowl') return false;
  const plate = state.plates[state.activeSlot];
  if (!plate) return false;            // no bowl started yet
  if (plate.steps.length >= 4) return false; // sane cap
  plate.steps.push(id);
  return true;
}

// Tap the trash: discard the active plate.
export function trashActive(state) {
  if (!state.plates[state.activeSlot]) return false;
  state.plates[state.activeSlot] = null;
  return true;
}

// Select which slot upcoming ingredients land on.
export function selectSlot(state, i) {
  if (i < 0 || i >= state.plates.length) return false;
  state.activeSlot = i;
  return true;
}

// Pretty label for the dish currently on a plate (for debugging/labels).
export function plateName(plate) {
  if (!plate) return '';
  const r = matchRecipe(plate.steps);
  return r ? r.name : '…';
}
