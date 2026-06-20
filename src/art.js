// =============================================================================
// art.js — Custom vector art, all drawn in code (no image files).
// Every function takes a CanvasRenderingContext2D and draws in local space;
// callers translate/scale beforehand. Sizes are in pixels.
// =============================================================================

import { INGREDIENTS } from './config.js';

// --- low-level helpers -----------------------------------------------------
function roundRect(ctx, x, y, w, h, r) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

export function heart(ctx, cx, cy, s, color) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(0, s * 0.3);
  ctx.bezierCurveTo(s * 0.5, -s * 0.4, s * 1.1, s * 0.25, 0, s);
  ctx.bezierCurveTo(-s * 1.1, s * 0.25, -s * 0.5, -s * 0.4, 0, s * 0.3);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

// --- the cat ---------------------------------------------------------------
// mood: 'calm' | 'worried' | 'panic' | 'happy'.  blink/mouth animate over time.
export function cat(ctx, r, opts = {}) {
  const { mood = 'calm', color = '#9b8bb4', t = 0 } = opts;
  const panic = mood === 'panic';
  const happy = mood === 'happy';

  // tail (wags faster when panicking)
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = r * 0.28;
  ctx.lineCap = 'round';
  const wag = Math.sin(t * (panic ? 14 : 4)) * (panic ? 0.5 : 0.25);
  ctx.beginPath();
  ctx.moveTo(r * 0.7, r * 0.7);
  ctx.quadraticCurveTo(r * 1.5, r * 0.5, r * (1.3 + wag), r * (-0.1 + wag));
  ctx.stroke();
  ctx.restore();

  // body
  ctx.fillStyle = color;
  roundRect(ctx, -r * 0.85, r * 0.05, r * 1.7, r * 1.1, r * 0.55);
  ctx.fill();

  // head
  ctx.beginPath();
  ctx.arc(0, -r * 0.25, r * 0.85, 0, Math.PI * 2);
  ctx.fill();

  // ears
  ctx.fillStyle = color;
  for (const sx of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(sx * r * 0.35, -r * 0.85);
    ctx.lineTo(sx * r * 0.72, -r * 1.45);
    ctx.lineTo(sx * r * 0.78, -r * 0.7);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = shade(color, 30);
    ctx.beginPath();
    ctx.moveTo(sx * r * 0.45, -r * 0.92);
    ctx.lineTo(sx * r * 0.66, -r * 1.28);
    ctx.lineTo(sx * r * 0.68, -r * 0.82);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = color;
  }

  // eyes
  const blink = Math.sin(t * 1.7 + 1) > 0.96 ? 0.1 : 1;
  ctx.fillStyle = '#2b2533';
  for (const sx of [-1, 1]) {
    ctx.save();
    ctx.translate(sx * r * 0.34, -r * 0.32);
    if (happy) {
      // happy closed-curve eyes
      ctx.strokeStyle = '#2b2533';
      ctx.lineWidth = r * 0.08;
      ctx.beginPath();
      ctx.arc(0, r * 0.05, r * 0.16, Math.PI * 1.1, Math.PI * 1.9);
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.ellipse(0, 0, r * (panic ? 0.2 : 0.14), r * 0.18 * blink, 0, 0, Math.PI * 2);
      ctx.fill();
      // shine
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(r * 0.05, -r * 0.05, r * 0.045, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#2b2533';
    }
    ctx.restore();
  }

  // nose
  ctx.fillStyle = '#d98ca5';
  ctx.beginPath();
  ctx.moveTo(0, -r * 0.12);
  ctx.lineTo(-r * 0.08, -r * 0.02);
  ctx.lineTo(r * 0.08, -r * 0.02);
  ctx.closePath();
  ctx.fill();

  // mouth: opens + quivers when panicking (meowing)
  ctx.strokeStyle = '#2b2533';
  ctx.lineWidth = r * 0.05;
  ctx.beginPath();
  if (panic) {
    const open = (0.5 + 0.5 * Math.sin(t * 18)) * r * 0.22;
    ctx.ellipse(0, r * 0.08, r * 0.12, r * 0.05 + open, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#7a2f3a';
    ctx.fill();
  } else if (happy) {
    ctx.arc(0, -r * 0.02, r * 0.12, 0.1 * Math.PI, 0.9 * Math.PI);
    ctx.stroke();
  } else {
    ctx.moveTo(-r * 0.12, r * 0.05);
    ctx.quadraticCurveTo(0, r * 0.12, r * 0.12, r * 0.05);
    ctx.stroke();
  }

  // whiskers
  ctx.strokeStyle = shade(color, -50);
  ctx.lineWidth = r * 0.02;
  for (const sx of [-1, 1]) {
    for (let i = -1; i <= 1; i++) {
      ctx.beginPath();
      ctx.moveTo(sx * r * 0.12, r * 0.0 + i * r * 0.06);
      ctx.lineTo(sx * r * 0.7, r * 0.0 + i * r * 0.12);
      ctx.stroke();
    }
  }
}

// --- a dish: bowl + stacked ingredients ------------------------------------
export function dish(ctx, r, steps = []) {
  // bowl
  if (steps.includes('bowl') || steps.length === 0) {
    ctx.fillStyle = INGREDIENTS.bowl.color;
    ctx.beginPath();
    ctx.ellipse(0, 0, r, r * 0.42, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = shade(INGREDIENTS.bowl.color, -18);
    ctx.beginPath();
    ctx.ellipse(0, r * 0.12, r * 0.92, r * 0.34, 0, 0, Math.PI);
    ctx.fill();
  }
  // contents (everything after the bowl), stacked as little mounds
  const contents = steps.filter((s) => s !== 'bowl');
  contents.forEach((id, i) => {
    const ing = INGREDIENTS[id];
    if (!ing) return;
    ctx.fillStyle = ing.color;
    const yy = -i * r * 0.16;
    if (id === 'milk') {
      ctx.beginPath();
      ctx.ellipse(0, yy - r * 0.02, r * 0.8, r * 0.3, 0, 0, Math.PI * 2);
      ctx.fill();
    } else if (id === 'fish') {
      ctx.save();
      ctx.translate(0, yy - r * 0.1);
      ctx.beginPath();
      ctx.ellipse(0, 0, r * 0.55, r * 0.22, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath(); // tail
      ctx.moveTo(r * 0.5, 0);
      ctx.lineTo(r * 0.78, -r * 0.18);
      ctx.lineTo(r * 0.78, r * 0.18);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    } else if (id === 'garnish') {
      ctx.beginPath();
      ctx.arc(-r * 0.2, yy - r * 0.18, r * 0.12, 0, Math.PI * 2);
      ctx.arc(r * 0.18, yy - r * 0.12, r * 0.1, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // mound (kibble / tuna)
      ctx.beginPath();
      ctx.ellipse(0, yy - r * 0.1, r * 0.62, r * 0.28, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  });
}

// --- ingredient / control icon for a station button -----------------------
export function stationIcon(ctx, id, r) {
  if (id === 'bowl') {
    dish(ctx, r, ['bowl']);
    return;
  }
  if (id === 'trash') {
    ctx.fillStyle = '#7a8aa0';
    roundRect(ctx, -r * 0.55, -r * 0.45, r * 1.1, r * 1.0, r * 0.12);
    ctx.fill();
    ctx.fillStyle = '#5b6b80';
    roundRect(ctx, -r * 0.65, -r * 0.6, r * 1.3, r * 0.18, r * 0.08);
    ctx.fill();
    ctx.strokeStyle = '#dfe7f0';
    ctx.lineWidth = r * 0.07;
    for (const x of [-0.2, 0, 0.2]) {
      ctx.beginPath();
      ctx.moveTo(x * r, -r * 0.3);
      ctx.lineTo(x * r, r * 0.4);
      ctx.stroke();
    }
    return;
  }
  // a small portion of the ingredient on its own
  dish(ctx, r * 0.9, ['bowl', id]);
}

// --- explosion particle puff ----------------------------------------------
export function puff(ctx, r, alpha) {
  ctx.save();
  ctx.globalAlpha = alpha;
  const colors = ['#ffd166', '#ff7b54', '#ffffff'];
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    ctx.fillStyle = colors[i % colors.length];
    ctx.beginPath();
    ctx.arc(Math.cos(a) * r, Math.sin(a) * r, r * 0.35, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

// little halo (the dark-humor beat) — a ring + glow that floats up
export function halo(ctx, r, alpha) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = '#ffe680';
  ctx.lineWidth = r * 0.22;
  ctx.beginPath();
  ctx.ellipse(0, 0, r, r * 0.4, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

// --- color util ------------------------------------------------------------
export function shade(hex, amt) {
  const n = parseInt(hex.slice(1), 16);
  let r = (n >> 16) + amt;
  let g = ((n >> 8) & 0xff) + amt;
  let b = (n & 0xff) + amt;
  r = Math.max(0, Math.min(255, r));
  g = Math.max(0, Math.min(255, g));
  b = Math.max(0, Math.min(255, b));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}
