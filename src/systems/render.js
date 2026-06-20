// =============================================================================
// render.js — draws the entire scene each frame from (state, layout).
// Screen shake + DPR scaling are applied by the caller (main.js).
// =============================================================================

import { TITLE, SUBTITLE, INGREDIENTS, LIVES } from '../config.js';
import * as art from '../art.js';
import { catMood } from '../entities/cat.js';
import { matchRecipe } from '../entities/station.js';

const SKY = '#2a2440';
const GROUND = '#3b3357';
const KITCHEN_BG = '#241f33';

export function render(ctx, state, layout) {
  const { w, h } = layout;
  drawBackground(ctx, layout);
  drawHud(ctx, state, layout);

  if (state.phase === 'playing' || state.phase === 'gameover') {
    drawZones(ctx, state, layout);
    drawCats(ctx, state, layout);
    drawEffects(ctx, state, layout);
    drawKitchen(ctx, state, layout);
  }

  // red flash when a wrong dish is served
  if (state.wrongFlash > 0) {
    ctx.save();
    ctx.globalAlpha = Math.min(0.4, state.wrongFlash / 600);
    ctx.fillStyle = '#ff3b3b';
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
  }

  if (state.phase === 'start') drawStartScreen(ctx, state, layout);
  if (state.phase === 'gameover') drawGameOver(ctx, state, layout);
}

// --- background ------------------------------------------------------------
function drawBackground(ctx, layout) {
  const { w, h, house, kitchen } = layout;
  // sky / night
  const g = ctx.createLinearGradient(0, 0, 0, kitchen.y);
  g.addColorStop(0, SKY);
  g.addColorStop(1, GROUND);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, kitchen.y);

  // a cozy house silhouette in the middle
  const hx = w / 2, hw = w * 0.62, hy = house.y + house.h * 0.16, hh = house.h * 0.7;
  ctx.fillStyle = '#4a4168';
  ctx.fillRect(hx - hw / 2, hy, hw, hh);
  ctx.beginPath(); // roof
  ctx.moveTo(hx - hw / 2 - 10, hy);
  ctx.lineTo(hx, hy - hh * 0.45);
  ctx.lineTo(hx + hw / 2 + 10, hy);
  ctx.closePath();
  ctx.fillStyle = '#5b5080';
  ctx.fill();
  // warm windows
  ctx.fillStyle = '#ffd98a';
  for (const fx of [0.3, 0.7]) {
    ctx.fillRect(hx - hw / 2 + hw * fx - hw * 0.08, hy + hh * 0.25, hw * 0.16, hh * 0.2);
  }
  // door
  ctx.fillStyle = '#3a3252';
  ctx.fillRect(hx - hw * 0.08, hy + hh * 0.55, hw * 0.16, hh * 0.45);

  // kitchen counter band
  ctx.fillStyle = KITCHEN_BG;
  ctx.fillRect(kitchen.x, kitchen.y, kitchen.w, kitchen.h);
  ctx.fillStyle = '#322a45';
  ctx.fillRect(kitchen.x, kitchen.y, kitchen.w, 6);
}

// --- HUD -------------------------------------------------------------------
function drawHud(ctx, state, layout) {
  const { w, hudH, muteBtn } = layout;
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.fillRect(0, 0, w, hudH);

  ctx.textBaseline = 'middle';
  const fs = Math.round(hudH * 0.3);

  // score (left)
  ctx.textAlign = 'left';
  ctx.fillStyle = '#fff';
  ctx.font = `bold ${fs}px system-ui, sans-serif`;
  ctx.fillText(`${state.score}`, 14, hudH * 0.36);
  ctx.fillStyle = '#b9aee0';
  ctx.font = `${Math.round(fs * 0.62)}px system-ui, sans-serif`;
  ctx.fillText(`best ${state.highScore}`, 14, hudH * 0.74);

  // lives as hearts (center)
  const hs = hudH * 0.18;
  const totalW = LIVES * hs * 2.4;
  let lx = w / 2 - totalW / 2 + hs;
  for (let i = 0; i < LIVES; i++) {
    art.heart(ctx, lx, hudH * 0.4, hs, i < state.lives ? '#ff5b7f' : '#5b5470');
    lx += hs * 2.4;
  }
  // level + combo under the hearts
  ctx.textAlign = 'center';
  ctx.fillStyle = '#cfc6ee';
  ctx.font = `${Math.round(fs * 0.6)}px system-ui, sans-serif`;
  const comboTxt = state.combo > 1 ? `  ·  combo x${state.combo}` : '';
  ctx.fillText(`level ${state.level + 1}${comboTxt}`, w / 2, hudH * 0.8);

  // mute button (right)
  ctx.beginPath();
  ctx.fillStyle = 'rgba(255,255,255,0.12)';
  ctx.arc(muteBtn.x, muteBtn.y, muteBtn.r, 0, Math.PI * 2);
  ctx.fill();
  drawSpeaker(ctx, muteBtn.x, muteBtn.y, muteBtn.r * 0.7, state.muted);
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

// --- zones (markers only; cats drawn separately) ---------------------------
function drawZones(ctx, state, layout) {
  for (const z of layout.zones) {
    ctx.beginPath();
    ctx.fillStyle = 'rgba(255,255,255,0.05)';
    ctx.ellipse(z.x, z.y + z.r * 0.8, z.r * 1.1, z.r * 0.4, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

// --- cats + their order bubbles + patience rings ---------------------------
function drawCats(ctx, state, layout) {
  for (const cat of state.cats) {
    if (cat.status === 'dead') continue;
    const z = layout.zones.find((zz) => zz.id === cat.zoneId);
    if (!z) continue;
    const mood = catMood(cat);

    ctx.save();
    ctx.translate(z.x, z.y);
    // pop-in + a little happy hop when leaving
    let s = 0.6 + 0.4 * cat.pop;
    if (cat.status === 'leaving') {
      s *= 1 + 0.1 * Math.sin(cat.leaveTimer * 18);
      ctx.globalAlpha = Math.max(0, 1 - cat.leaveTimer / 0.8);
      ctx.translate(0, -cat.leaveTimer * 40);
    }
    // panic shudder
    if (mood === 'panic') ctx.translate(Math.sin(cat.t * 40) * 2, 0);
    ctx.scale(s, s);
    art.cat(ctx, z.r * 0.7, { mood, color: cat.coat, t: cat.t });
    ctx.restore();

    if (cat.status === 'waiting') {
      drawPatienceRing(ctx, z, cat);
      drawOrderBubble(ctx, z, cat);
    }
  }
}

function drawPatienceRing(ctx, z, cat) {
  const ratio = Math.max(0, cat.patience / cat.patienceMax);
  const col = ratio > 0.5 ? '#6fe06f' : ratio > 0.22 ? '#ffd166' : '#ff5b5b';
  ctx.save();
  ctx.lineWidth = z.r * 0.14;
  ctx.lineCap = 'round';
  ctx.strokeStyle = 'rgba(0,0,0,0.25)';
  ctx.beginPath();
  ctx.arc(z.x, z.y, z.r * 1.1, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = col;
  ctx.beginPath();
  ctx.arc(z.x, z.y, z.r * 1.1, -Math.PI / 2, -Math.PI / 2 + ratio * Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

function drawOrderBubble(ctx, z, cat) {
  const bw = z.r * 2.1, bh = z.r * 1.0;
  const bx = z.x - bw / 2, by = z.y - z.r * 2.5;
  ctx.save();
  ctx.fillStyle = '#fff';
  roundRectPath(ctx, bx, by, bw, bh, bh * 0.28);
  ctx.fill();
  // tail of the speech bubble
  ctx.beginPath();
  ctx.moveTo(z.x - bh * 0.18, by + bh);
  ctx.lineTo(z.x + bh * 0.18, by + bh);
  ctx.lineTo(z.x, by + bh + bh * 0.3);
  ctx.closePath();
  ctx.fill();

  // mini dish icon
  ctx.save();
  ctx.translate(bx + bh * 0.7, by + bh * 0.5);
  art.dish(ctx, bh * 0.34, cat.recipe.steps);
  ctx.restore();

  // recipe name
  ctx.fillStyle = '#2b2533';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.font = `bold ${Math.round(bh * 0.32)}px system-ui, sans-serif`;
  ctx.fillText(cat.recipe.name, bx + bh * 1.25, by + bh * 0.5);
  ctx.restore();
}

// --- transient effects -----------------------------------------------------
function drawEffects(ctx, state, layout) {
  for (const e of state.effects) {
    const z = layout.zones.find((zz) => zz.id === e.zoneId);
    if (!z) continue;
    const p = e.t / e.life; // 0..1 progress
    if (e.type === 'explosion') {
      ctx.save();
      ctx.translate(z.x, z.y);
      art.puff(ctx, z.r * (0.5 + p * 1.3), 1 - p);
      ctx.restore();
      // halo floats up in the second half (dark-humor beat)
      if (p > 0.35) {
        ctx.save();
        ctx.translate(z.x, z.y - z.r * 1.2 - (p - 0.35) * z.r * 3);
        art.halo(ctx, z.r * 0.5, Math.max(0, 1 - (p - 0.35) / 0.65));
        ctx.restore();
      }
    } else if (e.type === 'hearts') {
      ctx.save();
      ctx.globalAlpha = 1 - p;
      for (let i = 0; i < 3; i++) {
        const a = (i - 1) * 0.5;
        art.heart(ctx, z.x + a * z.r, z.y - z.r - p * z.r * 2.2, z.r * 0.22, '#ff8fae');
      }
      // floating score
      ctx.fillStyle = '#fff7c2';
      ctx.textAlign = 'center';
      ctx.font = `bold ${Math.round(z.r * 0.45)}px system-ui, sans-serif`;
      ctx.fillText(`+${e.points}`, z.x, z.y - z.r * 1.6 - p * z.r * 2);
      ctx.restore();
    }
  }
}

// --- kitchen: plating slots + station buttons ------------------------------
function drawKitchen(ctx, state, layout) {
  // plating slots
  for (const p of layout.plates) {
    const active = p.index === state.activeSlot;
    ctx.save();
    ctx.beginPath();
    ctx.fillStyle = active ? 'rgba(255,217,138,0.18)' : 'rgba(255,255,255,0.06)';
    ctx.arc(p.x, p.y, p.r * 1.15, 0, Math.PI * 2);
    ctx.fill();
    if (active) {
      ctx.strokeStyle = '#ffd98a';
      ctx.lineWidth = 3;
      ctx.stroke();
    }
    const plate = state.plates[p.index];
    if (plate) {
      ctx.translate(p.x, p.y);
      art.dish(ctx, p.r, plate.steps);
      // show recipe name if it matches something
      const r = matchRecipe(plate.steps);
      if (r) {
        ctx.fillStyle = '#fff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.font = `${Math.round(p.r * 0.4)}px system-ui, sans-serif`;
        ctx.fillText(r.name, 0, p.r * 0.9);
      }
    } else {
      ctx.fillStyle = 'rgba(255,255,255,0.25)';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = `${Math.round(p.r * 0.45)}px system-ui, sans-serif`;
      ctx.fillText('empty', p.x, p.y);
    }
    ctx.restore();
  }

  // station buttons
  for (const s of layout.stations) {
    ctx.save();
    roundRectPath(ctx, s.x - s.w / 2, s.y - s.h / 2, s.w, s.h, s.w * 0.18);
    ctx.fillStyle = s.id === 'trash' ? 'rgba(180,80,90,0.25)' : 'rgba(255,255,255,0.08)';
    ctx.fill();
    ctx.translate(s.x, s.y - s.h * 0.08);
    art.stationIcon(ctx, s.id, s.w * 0.3);
    ctx.restore();

    // label
    ctx.fillStyle = '#cfc6ee';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.font = `${Math.round(s.h * 0.18)}px system-ui, sans-serif`;
    const label = s.id === 'bowl' ? 'Bowl' : s.id === 'trash' ? 'Trash' : INGREDIENTS[s.id].label;
    ctx.fillText(label, s.x, s.y + s.h * 0.5);
  }
}

// --- overlays --------------------------------------------------------------
function drawStartScreen(ctx, state, layout) {
  const { w, h } = layout;
  dim(ctx, w, h, 0.55);
  ctx.textAlign = 'center';

  // a big friendly cat
  ctx.save();
  ctx.translate(w / 2, h * 0.3);
  art.cat(ctx, Math.min(w, h) * 0.12, { mood: 'calm', color: '#9b8bb4', t: state.time });
  ctx.restore();

  ctx.fillStyle = '#fff';
  ctx.font = `bold ${Math.round(Math.min(w, h) * 0.11)}px system-ui, sans-serif`;
  ctx.fillText(TITLE, w / 2, h * 0.46);
  ctx.fillStyle = '#ffd98a';
  ctx.font = `${Math.round(Math.min(w, h) * 0.045)}px system-ui, sans-serif`;
  ctx.fillText(SUBTITLE, w / 2, h * 0.53);

  ctx.fillStyle = '#cfc6ee';
  ctx.font = `${Math.round(Math.min(w, h) * 0.035)}px system-ui, sans-serif`;
  const lines = [
    'Tap a Bowl, then ingredients, to cook.',
    'Tap a cat to serve its order in time.',
    "Don't let hungry cats go BOOM! 💥",
  ];
  lines.forEach((t, i) => ctx.fillText(t, w / 2, h * 0.62 + i * Math.min(w, h) * 0.05));

  if (state.highScore > 0) {
    ctx.fillStyle = '#fff7c2';
    ctx.fillText(`Best: ${state.highScore}`, w / 2, h * 0.8);
  }
  pulseText(ctx, 'TAP TO START', w / 2, h * 0.88, Math.min(w, h) * 0.05, state.time);
}

function drawGameOver(ctx, state, layout) {
  const { w, h } = layout;
  dim(ctx, w, h, 0.62);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#fff';
  ctx.font = `bold ${Math.round(Math.min(w, h) * 0.09)}px system-ui, sans-serif`;
  ctx.fillText('Game Over', w / 2, h * 0.34);

  ctx.font = `${Math.round(Math.min(w, h) * 0.05)}px system-ui, sans-serif`;
  ctx.fillText(`Score: ${state.score}`, w / 2, h * 0.46);
  ctx.fillText(`Cats fed: ${state.catsFed}`, w / 2, h * 0.53);

  if (state.newHighScore) {
    ctx.fillStyle = '#ffd166';
    ctx.font = `bold ${Math.round(Math.min(w, h) * 0.055)}px system-ui, sans-serif`;
    ctx.fillText('★ NEW HIGH SCORE! ★', w / 2, h * 0.63);
  } else {
    ctx.fillStyle = '#cfc6ee';
    ctx.fillText(`Best: ${state.highScore}`, w / 2, h * 0.63);
  }
  pulseText(ctx, 'TAP TO PLAY AGAIN', w / 2, h * 0.78, Math.min(w, h) * 0.045, state.time);
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
