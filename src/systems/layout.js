// =============================================================================
// layout.js — computes pixel rects for every interactive/visual region from
// the current canvas size. Both render.js and input.js consume this so drawing
// and hit-testing never drift apart. Pure function of (w, h).
// =============================================================================

import { ZONES } from '../config.js';

export function computeLayout(w, h) {
  const hudH = Math.max(54, h * 0.085);
  const counterH = Math.max(116, h * 0.19);
  const playTop = hudH;
  const playH = h - hudH - counterH;

  // HUD: mute button sits top-right.
  const muteR = hudH * 0.32;
  const muteBtn = { x: w - muteR - 14, y: hudH / 2, r: muteR };

  // House: place each cat zone by its fractional position. Sprites are kept
  // small so Grandma has plenty of room to roam.
  const zoneR = Math.min(w, playH) * 0.075;
  const zones = ZONES.map((z) => ({
    id: z.id,
    label: z.label,
    x: z.fx * w,
    y: playTop + z.fy * playH,
    r: zoneR,
  }));

  // Counter band at the bottom: the cat-food stack (left) and bowl stack
  // (right). Grandma walks down here to assemble a bowl.
  const counterTop = playTop + playH;
  const stackW = Math.min(w * 0.3, counterH * 1.15);
  const stackH = counterH * 0.72;
  const stackY = counterTop + counterH * 0.52;
  const foodStack = { id: 'food', x: w * 0.24, y: stackY, w: stackW, h: stackH };
  const bowlStack = { id: 'bowl', x: w * 0.76, y: stackY, w: stackW, h: stackH };

  // Where Grandma starts / idles: lower-middle of the play area.
  const home = { x: w * 0.5, y: playTop + playH * 0.86 };

  // How big to draw Grandma (a touch larger than a cat so she reads as the
  // star of the show).
  const grandmaR = zoneR * 1.15;

  return {
    w, h, hudH, muteBtn,
    play: { x: 0, y: playTop, w, h: playH },
    counter: { x: 0, y: counterTop, w, h: counterH },
    zones,
    foodStack,
    bowlStack,
    home,
    grandmaR,
  };
}
