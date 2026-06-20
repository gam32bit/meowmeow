// =============================================================================
// layout.js — computes pixel rects for every interactive/visual region from
// the current canvas size. Both render.js and input.js consume this so drawing
// and hit-testing never drift apart. Pure function of (w, h).
// =============================================================================

import { ZONES, STATIONS, PLATING_SLOTS } from '../config.js';

export function computeLayout(w, h) {
  const hudH = Math.max(54, h * 0.09);
  const kitchenH = Math.max(180, h * 0.34);
  const houseTop = hudH;
  const houseH = h - hudH - kitchenH;

  // HUD: mute button sits top-right.
  const muteR = hudH * 0.32;
  const muteBtn = { x: w - muteR - 14, y: hudH / 2, r: muteR };

  // House: place each zone by its fractional position.
  const zoneR = Math.min(w, houseH) * 0.13;
  const zones = ZONES.map((z) => ({
    id: z.id,
    label: z.label,
    x: z.fx * w,
    y: houseTop + z.fy * houseH,
    r: zoneR,
  }));

  // Kitchen: plating slots on top sub-row, stations below.
  const kitchenTop = houseTop + houseH;
  const plateRowY = kitchenTop + kitchenH * 0.26;
  const plateR = kitchenH * 0.16;
  const plateGap = plateR * 2.6;
  const plates = [];
  const startX = w / 2 - ((PLATING_SLOTS - 1) * plateGap) / 2;
  for (let i = 0; i < PLATING_SLOTS; i++) {
    plates.push({ index: i, x: startX + i * plateGap, y: plateRowY, r: plateR });
  }

  // Station buttons: evenly spaced row.
  const n = STATIONS.length;
  const pad = w * 0.02;
  const cellW = (w - pad * 2) / n;
  const btnSize = Math.min(cellW * 0.86, kitchenH * 0.34);
  const stationY = kitchenTop + kitchenH * 0.72;
  const stations = STATIONS.map((id, i) => ({
    id,
    x: pad + cellW * (i + 0.5),
    y: stationY,
    w: btnSize,
    h: btnSize,
    r: btnSize / 2,
  }));

  return {
    w, h, hudH, muteBtn,
    house: { x: 0, y: houseTop, w, h: houseH },
    zones,
    kitchen: { x: 0, y: kitchenTop, w, h: kitchenH },
    plates,
    stations,
  };
}
