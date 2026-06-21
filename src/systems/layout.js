// =============================================================================
// layout.js — computes pixel rects for every interactive/visual region from
// the current canvas size. Both render.js and input.js consume this so drawing
// and hit-testing never drift apart. Pure function of (w, h).
//
// The scene is horizontal: a cutaway house in the middle (kitchen visible
// inside), grass yard to either side, and one shared GROUND LINE that Grandma,
// the cats and the stations all stand on. Grandma's travel is a left-right walk.
// =============================================================================

import { ZONES } from '../config.js';

export function computeLayout(w, h) {
  const hudH = Math.max(54, h * 0.085);
  const playTop = hudH;
  const playH = h - hudH;
  const play = { x: 0, y: playTop, w, h: playH };

  // HUD: mute button sits top-right.
  const muteR = hudH * 0.32;
  const muteBtn = { x: w - muteR - 14, y: hudH / 2, r: muteR };

  // The ground line — everyone's feet rest here.
  const groundY = Math.round(playTop + playH * 0.8);

  // House in the centre, drawn as a cutaway so the kitchen shows inside.
  // Kept fairly wide and short so it reads as a cottage, not a tower.
  const houseW = Math.min(w * 0.44, playH * 0.42);
  const cx = Math.round(w * 0.5);
  const house = {
    cx,
    w: houseW,
    left: cx - houseW / 2,
    right: cx + houseW / 2,
    roofTopY: Math.round(playTop + playH * 0.26), // peak of the roof
    wallTopY: Math.round(playTop + playH * 0.47), // eaves: where walls meet roof
    floorY: groundY,
  };

  // Cat sizing — modest so two cats per side still fit a phone in portrait.
  const zoneR = Math.round(Math.min(w * 0.072, playH * 0.05));
  const zones = ZONES.map((z) => ({
    id: z.id,
    label: z.label,
    side: z.side,
    x: Math.round(z.fx * w),
    y: groundY,
    r: zoneR,
  }));

  // Food + bowl stations live INSIDE the house, on the floor. Rect is centred
  // on the visual middle of the little stack so taps line up with the art.
  const stationW = Math.round(houseW * 0.34);
  const stationH = Math.round(zoneR * 2.3);
  const stationY = groundY - Math.round(stationH * 0.5);
  const foodStack = { id: 'food', x: Math.round(cx - houseW * 0.2), y: stationY, w: stationW, h: stationH };
  const bowlStack = { id: 'bowl', x: Math.round(cx + houseW * 0.2), y: stationY, w: stationW, h: stationH };

  // Grandma starts in the middle of the house, on the floor.
  const home = { x: cx, y: groundY };
  const grandmaR = Math.round(zoneR * 1.3);

  return {
    w, h, hudH, muteBtn,
    play, groundY, house, zoneR,
    zones, foodStack, bowlStack, home, grandmaR,
  };
}
