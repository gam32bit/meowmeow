// =============================================================================
// storage.js — persist the arcade high score in localStorage.
// =============================================================================

const KEY = 'meowmeow.highscore.v1';

export function getHighScore() {
  try {
    return parseInt(localStorage.getItem(KEY) || '0', 10) || 0;
  } catch {
    return 0;
  }
}

// Saves only if higher; returns true when a new record was set.
export function submitScore(score) {
  try {
    if (score > getHighScore()) {
      localStorage.setItem(KEY, String(score));
      return true;
    }
  } catch {
    /* storage may be blocked (private mode) — fail quietly */
  }
  return false;
}
