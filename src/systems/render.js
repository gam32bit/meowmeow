// =============================================================================
// render.js — draws the entire scene each frame from (state, layout).
// Screen shake + DPR scaling are applied by the caller (main.js).
//
// The scene is a sunny green yard with a cutaway house in the middle. Cats
// wander in along the ground on either side; Grandma strolls left-right to
// fetch a bowl, fill it and carry it out to each cat.
// =============================================================================

import { TITLE, SUBTITLE, LIVES, FEEL } from '../config.js';
import { catMood } from '../entities/cat.js';
import * as art from '../art.js';

// palette --------------------------------------------------------------------
const GRASS = '#6cae4d';
const GRASS_HI = '#84c25f';
const GRASS_DK = '#588f3f';
const WALL = '#ecd6a6';      // interior back wall (cutaway)
const WAINSCOT = '#dcc08c';  // lower wall band
const POST = '#9c7b48';      // framing posts
const FLOOR = '#b58a55';     // kitchen floor
const ROOF = '#c05a44';
const ROOF_DK = '#9c4634';

export function render(ctx, state, layout) {
  drawBackground(ctx, layout);

  if (state.phase === 'playing' || state.phase === 'gameover') {
    drawStations(ctx, state, layout);
    drawCats(ctx, state, layout);
    if (state.grandma) drawGrandma(ctx, state.grandma, layout);
    drawStationLabels(ctx, layout); // on top so Grandma never hides them
    drawEffects(ctx, state, layout);
    drawHints(ctx, state, layout);
  }

  drawHud(ctx, state, layout);
  drawFlash(ctx, state, layout);

  if (state.phase === 'start') drawStartScreen(ctx, state, layout);
  if (state.phase === 'gameover') drawGameOver(ctx, state, layout);
}

// full-screen blast flash — a quick warm wash right when a cat explodes
function drawFlash(ctx, state, layout) {
  if (state.flash <= 0 || FEEL.explosionFlashMs <= 0) return;
  const a = Math.min(1, state.flash / FEEL.explosionFlashMs) * 0.5;
  ctx.fillStyle = `rgba(255,236,180,${a})`;
  ctx.fillRect(0, 0, layout.w, layout.h);
}

// --- background: sky, sun, grass, the cutaway house ------------------------
function drawBackground(ctx, layout) {
  const { w, h, play, groundY, house } = layout;

  // daytime sky
  const sky = ctx.createLinearGradient(0, 0, 0, groundY);
  sky.addColorStop(0, '#6fb9ef');
  sky.addColorStop(1, '#cdeafa');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, groundY);

  // sun (top-left, out of the HUD's way over on the right)
  ctx.fillStyle = '#ffe27a';
  pixelDisc(ctx, Math.round(w * 0.12), Math.round(play.y + play.h * 0.1), Math.round(Math.min(w, h) * 0.05));

  // a couple of soft clouds
  cloud(ctx, w * 0.7, play.y + play.h * 0.08, Math.min(w, h) * 0.04);
  cloud(ctx, w * 0.42, play.y + play.h * 0.16, Math.min(w, h) * 0.03);

  // grass yard
  ctx.fillStyle = GRASS;
  ctx.fillRect(0, groundY, w, h - groundY);
  ctx.fillStyle = GRASS_HI;
  ctx.fillRect(0, groundY, w, Math.max(3, (h - groundY) * 0.04));
  ctx.fillStyle = GRASS_DK;
  ctx.fillRect(0, groundY + (h - groundY) * 0.55, w, (h - groundY) * 0.45);

  drawHouse(ctx, layout);
}

function drawHouse(ctx, layout) {
  const { house } = layout;
  const { left, right, cx, wallTopY, roofTopY, floorY } = house;
  const wallW = right - left;
  const wallH = floorY - wallTopY;
  const oh = Math.round(wallW * 0.1); // roof overhang

  // interior back wall (we see inside — the front wall is "removed")
  ctx.fillStyle = WALL;
  ctx.fillRect(left, wallTopY, wallW, wallH);
  ctx.fillStyle = WAINSCOT;
  ctx.fillRect(left, floorY - wallH * 0.26, wallW, wallH * 0.26);

  // window on the back wall
  const wsz = Math.round(wallW * 0.26);
  const wx = Math.round(cx - wsz / 2);
  const wy = Math.round(wallTopY + wallH * 0.16);
  ctx.fillStyle = '#aee0f2';
  ctx.fillRect(wx, wy, wsz, wsz);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(wx - 3, wy - 3, wsz + 6, 4);            // top frame
  ctx.fillRect(wx + wsz / 2 - 2, wy, 4, wsz);          // mullion vertical
  ctx.fillRect(wx, wy + wsz / 2 - 2, wsz, 4);          // mullion horizontal
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 3;
  ctx.strokeRect(wx, wy, wsz, wsz);

  // floor line
  ctx.fillStyle = FLOOR;
  ctx.fillRect(left, floorY - 4, wallW, 6);

  // framing posts (left + right walls, seen edge-on)
  ctx.fillStyle = POST;
  ctx.fillRect(left - 7, wallTopY, 7, wallH + 4);
  ctx.fillRect(right, wallTopY, 7, wallH + 4);

  // roof
  ctx.fillStyle = ROOF;
  ctx.beginPath();
  ctx.moveTo(left - oh, wallTopY);
  ctx.lineTo(cx, roofTopY);
  ctx.lineTo(right + oh, wallTopY);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = ROOF_DK;
  ctx.fillRect(left - oh, wallTopY, wallW + oh * 2, Math.max(5, wallH * 0.06));
}

function cloud(ctx, x, y, r) {
  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  for (const [dx, dy, rr] of [[-r, 0, r * 0.9], [0, -r * 0.4, r * 1.1], [r, 0, r * 0.9]]) {
    pixelDisc(ctx, Math.round(x + dx), Math.round(y + dy), Math.round(rr));
  }
}

// a chunky filled "disc" that still reads as pixel-ish
function pixelDisc(ctx, cx, cy, r) {
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
}

// --- stations (food + bowls, inside the house on the floor) ----------------
function drawStations(ctx, state, layout) {
  drawStack(ctx, layout.foodStack, (c, w, h) => art.foodStackArt(c, w, h));
  drawStack(ctx, layout.bowlStack, (c, w, h) => art.bowlStackArt(c, w, h));
}

// Captions under the two stations so it's clear what to tap. Drawn on TOP of the
// scene (after Grandma) and sat just below each stack on the floor. The stacks
// are close together, so both labels share one size that keeps the wider caption
// inside the stack spacing — they never collide on a narrow phone.
function drawStationLabels(ctx, layout) {
  const maxW = layout.house.w * 0.36; // stacks are ~0.4*houseW apart; stay inside that
  let fs = Math.max(11, Math.round(layout.zoneR * 0.72));
  ctx.font = `bold ${fs}px system-ui, sans-serif`;
  while (fs > 9 && ctx.measureText('Cat Food').width > maxW) {
    fs -= 1;
    ctx.font = `bold ${fs}px system-ui, sans-serif`;
  }
  drawStationLabel(ctx, layout.foodStack, 'Cat Food', fs);
  drawStationLabel(ctx, layout.bowlStack, 'Bowls', fs);
}

function drawStationLabel(ctx, rect, text, fs) {
  const cx = rect.x;
  const cy = rect.y + rect.h / 2 + Math.round(fs * 0.95); // just below the stack
  ctx.save();
  ctx.font = `bold ${fs}px system-ui, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const tw = ctx.measureText(text).width;
  const bw = tw + fs * 0.9;
  const bh = fs + fs * 0.55;
  // dark pill so the caption reads against grass, floor, or a fed cat's heart
  ctx.fillStyle = 'rgba(38,26,18,0.8)';
  if (ctx.roundRect) {
    ctx.beginPath();
    ctx.roundRect(cx - bw / 2, cy - bh / 2, bw, bh, bh / 2);
    ctx.fill();
  } else {
    ctx.fillRect(cx - bw / 2, cy - bh / 2, bw, bh);
  }
  ctx.fillStyle = '#fff3e0';
  ctx.fillText(text, cx, cy + 1);
  ctx.restore();
}

function drawStack(ctx, rect, drawFn) {
  ctx.save();
  ctx.translate(rect.x, rect.y);
  drawFn(ctx, rect.w, rect.h);
  ctx.restore();
}

// --- cats + patience rings -------------------------------------------------
function drawCats(ctx, state, layout) {
  for (const z of layout.zones) {
    const cat = state.cats.find((c) => c.zoneId === z.id && c.status !== 'dead');
    if (!cat) continue;
    const pop = easeOutBack(cat.pop);
    const cy = z.y - z.r; // body centre, sits above the feet line

    // little contact shadow so the cat sits on the grass
    ctx.fillStyle = 'rgba(0,0,0,0.14)';
    ctx.beginPath();
    ctx.ellipse(z.x, z.y, z.r * 0.7, z.r * 0.18, 0, 0, Math.PI * 2);
    ctx.fill();

    if (cat.status === 'waiting') drawPatienceRing(ctx, z.x, cy, z.r, cat);

    ctx.save();
    ctx.translate(z.x, z.y);
    ctx.scale(pop, pop);
    art.cat(ctx, z.r, {
      mood: catMood(cat),
      color: cat.coat,
      t: cat.t,
      facing: -z.side, // face in toward the house
    });
    ctx.restore();
  }
}

function drawPatienceRing(ctx, cx, cy, r, cat) {
  const ratio = Math.max(0, cat.patience / cat.patienceMax);
  const col = ratio > 0.5 ? '#5fd35f' : ratio > 0.22 ? '#ffce4d' : '#ff5b5b';
  const rad = r * 1.2;
  ctx.save();
  ctx.lineWidth = Math.max(3, r * 0.16);
  ctx.lineCap = 'round';
  ctx.strokeStyle = 'rgba(0,0,0,0.22)';
  ctx.beginPath();
  ctx.arc(cx, cy, rad, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = col;
  ctx.beginPath();
  ctx.arc(cx, cy, rad, -Math.PI / 2, -Math.PI / 2 + ratio * Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

// --- Grandma ---------------------------------------------------------------
function drawGrandma(ctx, g, layout) {
  ctx.save();
  ctx.translate(Math.round(g.x), Math.round(g.y));
  art.grandma(ctx, layout.grandmaR, {
    facing: g.facing,
    walking: !!g.target,
    hands: g.hands,
    phase: g.walkPhase,
  });
  ctx.restore();
}

// --- transient effects: explosions, halos, hearts, "Meow!" -----------------
function drawEffects(ctx, state, layout) {
  const { w } = layout;
  const zoneById = Object.fromEntries(layout.zones.map((z) => [z.id, z]));
  for (const e of state.effects) {
    // "nope" — a small red ✗ pulse right on whatever you mis-tapped
    if (e.type === 'nope') {
      const p = e.t / e.life;
      const rr = e.r * (0.7 + p * 0.7);
      const s = e.r * 0.45;
      ctx.save();
      ctx.globalAlpha = Math.max(0, 1 - p);
      ctx.strokeStyle = '#ff4d4d';
      ctx.lineCap = 'round';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(e.x, e.y, rr, 0, Math.PI * 2);
      ctx.stroke();
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(e.x - s, e.y - s);
      ctx.lineTo(e.x + s, e.y + s);
      ctx.moveTo(e.x + s, e.y - s);
      ctx.lineTo(e.x - s, e.y + s);
      ctx.stroke();
      ctx.restore();
      continue;
    }

    const z = zoneById[e.zoneId];
    if (!z) continue;
    const p = e.t / e.life;
    const cy = z.y - z.r;
    // keep floating text on-screen even for the edge-of-yard cats
    const tx = Math.max(w * 0.14, Math.min(w * 0.86, z.x));

    if (e.type === 'explosion') {
      ctx.save();
      ctx.translate(z.x, cy);
      // mag grows with each blast in a run (set in main.js); fall back to the
      // old contained size if an effect somehow lacks one.
      art.explosion(ctx, e.mag || z.r * 3.2, p, e.parts);
      ctx.restore();
      if (p > 0.45) {
        ctx.save();
        ctx.translate(z.x, cy - z.r - (p - 0.45) * z.r * 4);
        art.halo(ctx, z.r * 0.5, Math.max(0, 1 - (p - 0.45) / 0.55));
        ctx.restore();
      }
    } else if (e.type === 'hearts') {
      ctx.save();
      ctx.globalAlpha = 1 - p;
      for (let i = 0; i < 3; i++) {
        const a = (i - 1) * 0.6;
        art.heart(ctx, tx + a * z.r, cy - z.r - p * z.r * 2.2, z.r * 0.3, '#ff8fae');
      }
      ctx.fillStyle = '#fff7c2';
      ctx.strokeStyle = '#3a2f20';
      ctx.lineWidth = 4;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = `bold ${Math.round(z.r * 0.7)}px system-ui, sans-serif`;
      const ty = cy - z.r * 1.8 - p * z.r * 2;
      ctx.strokeText(`+${e.points}`, tx, ty);
      ctx.fillText(`+${e.points}`, tx, ty);
      ctx.restore();
    } else if (e.type === 'meow') {
      ctx.save();
      ctx.globalAlpha = Math.max(0, 1 - p);
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#3a3550';
      ctx.lineWidth = 4;
      ctx.lineJoin = 'round';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = `bold ${Math.round(z.r * 0.78)}px system-ui, sans-serif`;
      const ty = cy - z.r * 2 - p * z.r * 1.6;
      ctx.strokeText('Meow!', tx, ty);
      ctx.fillText('Meow!', tx, ty);
      ctx.restore();
    }
  }
}

// --- progressive hints (only the first three actions) ----------------------
function drawHints(ctx, state, layout) {
  if (state.phase !== 'playing') return;
  const step = state.tutorial;
  if (step === 'bowl') {
    const r = layout.bowlStack;
    hintBubble(ctx, r.x, r.y - r.h / 2, 'Grab Bowl', state.time);
  } else if (step === 'food') {
    const r = layout.foodStack;
    hintBubble(ctx, r.x, r.y - r.h / 2, 'Open Food', state.time);
  } else if (step === 'feed') {
    // point at the first waiting cat
    let target = null;
    for (const z of layout.zones) {
      if (state.cats.some((c) => c.zoneId === z.id && c.status === 'waiting')) {
        target = z;
        break;
      }
    }
    if (target) hintBubble(ctx, target.x, target.y - target.r * 2, 'Feed Cat', state.time);
  }
}

function hintBubble(ctx, x, topY, text, time) {
  const pulse = 0.5 + 0.5 * Math.sin(time * 5);
  ctx.save();
  ctx.font = 'bold 16px system-ui, sans-serif';
  const tw = ctx.measureText(text).width;
  const pad = 12;
  const bw = Math.round(tw + pad * 2);
  const bh = 30;
  const by = Math.round(topY - bh - 16 - pulse * 5);
  const bx = Math.round(x - bw / 2);

  ctx.fillStyle = '#2b2533';
  roundRectPath(ctx, bx, by, bw, bh, 9);
  ctx.fill();
  ctx.beginPath(); // little downward tail
  ctx.moveTo(x - 7, by + bh - 1);
  ctx.lineTo(x + 7, by + bh - 1);
  ctx.lineTo(x, by + bh + 9);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#ffe14d';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x, by + bh / 2);
  ctx.restore();
}

// --- HUD -------------------------------------------------------------------
function drawHud(ctx, state, layout) {
  const { w, hudH, muteBtn } = layout;
  ctx.fillStyle = 'rgba(20,16,30,0.28)';
  ctx.fillRect(0, 0, w, hudH);

  ctx.textBaseline = 'middle';
  const fs = Math.round(hudH * 0.3);

  // score (left)
  ctx.textAlign = 'left';
  ctx.fillStyle = '#fff';
  ctx.font = `bold ${fs}px system-ui, sans-serif`;
  ctx.fillText(`${state.score}`, 14, hudH * 0.36);
  ctx.fillStyle = '#eef7ff';
  ctx.font = `${Math.round(fs * 0.62)}px system-ui, sans-serif`;
  ctx.fillText(`best ${state.highScore}`, 14, hudH * 0.74);

  // lives as little hearts (centre)
  const hs = hudH * 0.13;          // heart size param
  const gap = hudH * 0.5;          // spacing > heart width so they don't merge
  const startX = w / 2 - ((LIVES - 1) * gap) / 2;
  for (let i = 0; i < LIVES; i++) {
    const alive = i < state.lives;
    art.heart(ctx, startX + i * gap, hudH * 0.4, hs, alive ? '#ff5b7a' : 'rgba(255,255,255,0.25)');
  }
  ctx.fillStyle = '#eef7ff';
  ctx.textAlign = 'center';
  ctx.font = `${Math.round(fs * 0.5)}px system-ui, sans-serif`;
  ctx.fillText(`level ${state.level + 1}`, w / 2, hudH * 0.78);

  // mute speaker (right)
  drawSpeaker(ctx, muteBtn.x, muteBtn.y, muteBtn.r, state.muted);
}

function drawSpeaker(ctx, cx, cy, r, muted) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.moveTo(-r * 0.6, -r * 0.3);
  ctx.lineTo(-r * 0.2, -r * 0.3);
  ctx.lineTo(r * 0.2, -r * 0.6);
  ctx.lineTo(r * 0.2, r * 0.6);
  ctx.lineTo(-r * 0.2, r * 0.3);
  ctx.lineTo(-r * 0.6, r * 0.3);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = r * 0.16;
  if (muted) {
    ctx.beginPath();
    ctx.moveTo(r * 0.4, -r * 0.4);
    ctx.lineTo(r * 0.9, r * 0.4);
    ctx.moveTo(r * 0.9, -r * 0.4);
    ctx.lineTo(r * 0.4, r * 0.4);
    ctx.stroke();
  } else {
    ctx.beginPath();
    ctx.arc(r * 0.3, 0, r * 0.5, -0.6, 0.6);
    ctx.stroke();
  }
  ctx.restore();
}

// --- overlays --------------------------------------------------------------
function drawStartScreen(ctx, state, layout) {
  const { w, h, groundY } = layout;
  dim(ctx, w, h, 0.4);
  ctx.textAlign = 'center';

  ctx.fillStyle = '#fff';
  ctx.font = `bold ${Math.round(Math.min(w, h) * 0.12)}px system-ui, sans-serif`;
  ctx.fillText(TITLE, w / 2, h * 0.18);
  ctx.fillStyle = '#ffe27a';
  ctx.font = `${Math.round(Math.min(w, h) * 0.05)}px system-ui, sans-serif`;
  ctx.fillText(SUBTITLE, w / 2, h * 0.25);

  // Grandma standing in her doorway, holding a full bowl, ready to go
  ctx.save();
  ctx.translate(w / 2, groundY);
  art.grandma(ctx, layout.grandmaR * 1.25, { facing: 1, hands: 'fullbowl' });
  ctx.restore();

  pulseText(ctx, 'TAP TO START', w / 2, h * 0.6, Math.min(w, h) * 0.055, state.time);
}

function drawGameOver(ctx, state, layout) {
  const { w, h } = layout;
  dim(ctx, w, h, 0.6);
  ctx.textAlign = 'center';

  ctx.fillStyle = '#fff';
  ctx.font = `bold ${Math.round(Math.min(w, h) * 0.1)}px system-ui, sans-serif`;
  ctx.fillText('Game Over', w / 2, h * 0.34);

  ctx.font = `${Math.round(Math.min(w, h) * 0.05)}px system-ui, sans-serif`;
  ctx.fillText(`Score: ${state.score}`, w / 2, h * 0.46);
  ctx.fillText(`Cats fed: ${state.catsFed}`, w / 2, h * 0.53);

  if (state.newHighScore) {
    ctx.fillStyle = '#ffd166';
    ctx.font = `bold ${Math.round(Math.min(w, h) * 0.055)}px system-ui, sans-serif`;
    ctx.fillText('★ NEW HIGH SCORE! ★', w / 2, h * 0.63);
  } else {
    ctx.fillStyle = '#eef7ff';
    ctx.fillText(`Best: ${state.highScore}`, w / 2, h * 0.63);
  }
  pulseText(ctx, 'TAP TO PLAY AGAIN', w / 2, h * 0.78, Math.min(w, h) * 0.05, state.time);
}

// --- small drawing utilities ----------------------------------------------
function dim(ctx, w, h, a) {
  ctx.fillStyle = `rgba(15,12,26,${a})`;
  ctx.fillRect(0, 0, w, h);
}
function pulseText(ctx, text, x, y, size, t) {
  const s = 1 + 0.06 * Math.sin(t * 4);
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  ctx.fillStyle = '#fff';
  ctx.textAlign = 'center';
  ctx.font = `bold ${Math.round(size)}px system-ui, sans-serif`;
  ctx.fillText(text, 0, 0);
  ctx.restore();
}
function roundRectPath(ctx, x, y, wd, ht, r) {
  const rr = Math.min(r, wd / 2, ht / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + wd, y, x + wd, y + ht, rr);
  ctx.arcTo(x + wd, y + ht, x, y + ht, rr);
  ctx.arcTo(x, y + ht, x, y, rr);
  ctx.arcTo(x, y, x + wd, y, rr);
  ctx.closePath();
}
function easeOutBack(p) {
  if (p >= 1) return 1;
  const c1 = 1.70158;
  const c3 = c1 + 1;
  const x = p - 1;
  return 1 + c3 * x * x * x + c1 * x * x;
}
