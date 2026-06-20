// =============================================================================
// art.js — Custom vector art, all drawn in code (no image files).
// Every function takes a CanvasRenderingContext2D and draws in local space;
// callers translate/scale beforehand. Sizes are in pixels.
// =============================================================================

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

// --- Grandma ---------------------------------------------------------------
// A small lady with brown hair (in a bun), round glasses, and a cozy cardigan.
// Drawn centered on her torso. `hands` selects what she's carrying; `walking`
// + `phase` drive a gentle waddle; `facing` flips her left/right.
const SKIN = '#eac6a3';
const HAIR = '#6f4e34';
const CARDIGAN = '#c98fae';      // dusty-rose cardigan
const CARDIGAN_DK = '#a9728f';
const SKIRT = '#6a5b7e';

export function grandma(ctx, r, opts = {}) {
  const { facing = 1, walking = false, phase = 0, hands = 'empty', acting = false } = opts;
  const swing = walking ? Math.sin(phase) : 0;

  ctx.save();
  ctx.scale(facing, 1); // face left or right

  // shadow
  ctx.fillStyle = 'rgba(0,0,0,0.18)';
  ctx.beginPath();
  ctx.ellipse(0, r * 1.55, r * 0.85, r * 0.22, 0, 0, Math.PI * 2);
  ctx.fill();

  // legs (waddle with the walk phase)
  ctx.strokeStyle = '#5a4b6e';
  ctx.lineWidth = r * 0.22;
  ctx.lineCap = 'round';
  for (const s of [-1, 1]) {
    const sw = s * swing * r * 0.28;
    ctx.beginPath();
    ctx.moveTo(s * r * 0.28, r * 1.0);
    ctx.lineTo(s * r * 0.28 + sw, r * 1.5);
    ctx.stroke();
  }
  // little shoes
  ctx.fillStyle = '#3c3450';
  for (const s of [-1, 1]) {
    const sw = s * swing * r * 0.28;
    ctx.beginPath();
    ctx.ellipse(s * r * 0.3 + sw, r * 1.52, r * 0.2, r * 0.1, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // skirt hem peeking below the cardigan
  ctx.fillStyle = SKIRT;
  roundRect(ctx, -r * 0.6, r * 0.5, r * 1.2, r * 0.6, r * 0.18);
  ctx.fill();

  // cardigan body
  ctx.fillStyle = CARDIGAN;
  roundRect(ctx, -r * 0.72, -r * 0.3, r * 1.44, r * 1.0, r * 0.4);
  ctx.fill();
  // cardigan center seam + buttons
  ctx.strokeStyle = CARDIGAN_DK;
  ctx.lineWidth = r * 0.06;
  ctx.beginPath();
  ctx.moveTo(0, -r * 0.25);
  ctx.lineTo(0, r * 0.6);
  ctx.stroke();
  ctx.fillStyle = '#f3e2c7';
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.arc(0, -r * 0.08 + i * r * 0.22, r * 0.05, 0, Math.PI * 2);
    ctx.fill();
  }

  // arms — held forward cradling an item, else resting at her sides
  ctx.strokeStyle = CARDIGAN;
  ctx.lineWidth = r * 0.24;
  const carrying = hands !== 'empty';
  for (const s of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(s * r * 0.6, -r * 0.05);
    if (carrying) {
      ctx.quadraticCurveTo(s * r * 0.7, r * 0.35, s * r * 0.34, r * 0.55);
    } else {
      const sw = -s * swing * r * 0.18;
      ctx.quadraticCurveTo(s * r * 0.78, r * 0.3, s * r * 0.66 + sw, r * 0.6);
    }
    ctx.stroke();
  }

  // head
  ctx.fillStyle = SKIN;
  ctx.beginPath();
  ctx.arc(0, -r * 0.75, r * 0.52, 0, Math.PI * 2);
  ctx.fill();

  // hair: a bun on top + a soft frame around the face
  ctx.fillStyle = HAIR;
  ctx.beginPath();
  ctx.arc(0, -r * 1.28, r * 0.26, 0, Math.PI * 2); // bun
  ctx.fill();
  ctx.beginPath();
  ctx.arc(0, -r * 0.82, r * 0.54, Math.PI * 1.05, Math.PI * 1.95); // hair cap
  ctx.fill();
  // side wisps
  for (const s of [-1, 1]) {
    ctx.beginPath();
    ctx.ellipse(s * r * 0.46, -r * 0.78, r * 0.14, r * 0.26, s * 0.3, 0, Math.PI * 2);
    ctx.fill();
  }

  // glasses
  ctx.strokeStyle = '#3a3340';
  ctx.lineWidth = r * 0.05;
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  for (const s of [-1, 1]) {
    ctx.beginPath();
    ctx.arc(s * r * 0.2, -r * 0.74, r * 0.17, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }
  ctx.beginPath(); // bridge
  ctx.moveTo(-r * 0.05, -r * 0.74);
  ctx.lineTo(r * 0.05, -r * 0.74);
  ctx.stroke();

  // eyes (little dots behind the lenses)
  ctx.fillStyle = '#2b2533';
  for (const s of [-1, 1]) {
    ctx.beginPath();
    ctx.arc(s * r * 0.2, -r * 0.73, r * 0.05, 0, Math.PI * 2);
    ctx.fill();
  }

  // rosy cheeks + a warm smile
  ctx.fillStyle = 'rgba(214,120,140,0.4)';
  for (const s of [-1, 1]) {
    ctx.beginPath();
    ctx.arc(s * r * 0.34, -r * 0.6, r * 0.09, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.strokeStyle = '#7a4a52';
  ctx.lineWidth = r * 0.045;
  ctx.beginPath();
  ctx.arc(0, -r * 0.56, r * 0.12, 0.15 * Math.PI, 0.85 * Math.PI);
  ctx.stroke();

  // the item she's carrying, cradled in front of her
  if (hands !== 'empty') {
    ctx.save();
    ctx.translate(0, r * 0.5);
    if (hands === 'can') can(ctx, r * 0.42, true);
    else if (hands === 'bowl') bowl(ctx, r * 0.6, false);
    else if (hands === 'fullbowl') bowl(ctx, r * 0.6, true);
    ctx.restore();
  }

  // tiny "tk" sparkle while she's mid-action
  if (acting) {
    ctx.fillStyle = '#fff2b0';
    for (let i = 0; i < 3; i++) {
      const a = -Math.PI / 2 + (i - 1) * 0.5;
      ctx.beginPath();
      ctx.arc(Math.cos(a) * r * 0.7, r * 0.2 + Math.sin(a) * r * 0.7, r * 0.05, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.restore();
}

// --- a can of cat food -----------------------------------------------------
// Centered. `opened` lifts the lid ajar.
export function can(ctx, r, opened = false) {
  const w = r * 1.3, h = r * 1.5;
  // body
  ctx.fillStyle = '#d6473f';
  roundRect(ctx, -w / 2, -h / 2, w, h, r * 0.12);
  ctx.fill();
  // label band
  ctx.fillStyle = '#f4e3c4';
  ctx.fillRect(-w / 2, -h * 0.12, w, h * 0.34);
  // a tiny fish on the label
  ctx.fillStyle = '#7fb0d8';
  ctx.beginPath();
  ctx.ellipse(0, h * 0.05, w * 0.22, h * 0.08, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(w * 0.18, h * 0.05);
  ctx.lineTo(w * 0.32, h * -0.02);
  ctx.lineTo(w * 0.32, h * 0.12);
  ctx.closePath();
  ctx.fill();
  // rim / lid
  ctx.fillStyle = '#cdd6df';
  if (opened) {
    // lid peeled back above the can
    ctx.save();
    ctx.translate(0, -h / 2);
    ctx.rotate(-0.5);
    ctx.fillStyle = '#dde4ec';
    ctx.beginPath();
    ctx.ellipse(0, -r * 0.3, w * 0.5, r * 0.16, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    // food showing at the top
    ctx.fillStyle = '#9a6b3f';
    ctx.beginPath();
    ctx.ellipse(0, -h / 2 + r * 0.05, w * 0.46, r * 0.18, 0, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.beginPath();
    ctx.ellipse(0, -h / 2, w * 0.5, r * 0.16, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

// --- a bowl (empty or full of food) ----------------------------------------
export function bowl(ctx, r, full = false) {
  // bowl body
  ctx.fillStyle = '#e9eef5';
  ctx.beginPath();
  ctx.ellipse(0, 0, r, r * 0.42, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#c3ccd9';
  ctx.beginPath();
  ctx.ellipse(0, r * 0.12, r * 0.92, r * 0.34, 0, 0, Math.PI);
  ctx.fill();
  // blue rim stripe
  ctx.strokeStyle = '#7fa8d8';
  ctx.lineWidth = r * 0.08;
  ctx.beginPath();
  ctx.ellipse(0, 0, r * 0.9, r * 0.38, 0, 0, Math.PI * 2);
  ctx.stroke();

  if (full) {
    // a mound of brown cat food
    ctx.fillStyle = '#9a6b3f';
    ctx.beginPath();
    ctx.ellipse(0, -r * 0.06, r * 0.7, r * 0.3, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#7d5530';
    for (const dx of [-0.3, 0.05, 0.32]) {
      ctx.beginPath();
      ctx.arc(dx * r, -r * 0.12, r * 0.1, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

// --- the counter stacks ----------------------------------------------------
// A little pyramid of cans the player taps to send Grandma for food.
export function foodStackArt(ctx, w, h) {
  const cw = w * 0.3;
  const rows = [
    { y: h * 0.32, xs: [-cw * 1.1, 0, cw * 1.1] },
    { y: -h * 0.05, xs: [-cw * 0.55, cw * 0.55] },
    { y: -h * 0.42, xs: [0] },
  ];
  for (const row of rows) {
    for (const x of row.xs) {
      ctx.save();
      ctx.translate(x, row.y);
      can(ctx, cw * 0.5, false);
      ctx.restore();
    }
  }
}

// A short tower of nested bowls the player taps to send Grandma for a bowl.
export function bowlStackArt(ctx, w, h) {
  const bw = w * 0.42;
  for (let i = 0; i < 4; i++) {
    const y = h * 0.3 - i * h * 0.16;
    ctx.save();
    ctx.translate(0, y);
    bowl(ctx, bw, false);
    ctx.restore();
  }
}

// --- a big, dramatic explosion (Exploding-Kittens style) -------------------
// p is 0..1 progress. `parts` is a pre-generated list of flying debris vectors
// so each blast looks unique. Draw centered on the blast point.
export function explosion(ctx, r, p, parts = []) {
  const grow = 0.35 + p * 1.5;
  const fade = 1 - p;

  // flying debris (fur tufts + sparks) shooting outward
  ctx.save();
  for (const d of parts) {
    const dist = grow * r * d.sp;
    const px = Math.cos(d.a) * dist;
    const py = Math.sin(d.a) * dist - p * r * 0.4; // slight upward drift
    ctx.globalAlpha = Math.max(0, fade);
    if (d.kind === 'spark') {
      ctx.fillStyle = '#ffd76a';
      ctx.beginPath();
      ctx.arc(px, py, r * 0.12 * fade, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.save();
      ctx.translate(px, py);
      ctx.rotate(d.a + p * 6);
      ctx.fillStyle = '#cbb89a';
      ctx.beginPath();
      ctx.ellipse(0, 0, r * 0.16 * fade, r * 0.07 * fade, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();

  // jagged comic starburst (orange → red), expanding
  ctx.save();
  ctx.globalAlpha = Math.max(0, 1 - p * 0.85);
  const R = grow * r;
  const points = 12;
  ctx.beginPath();
  for (let i = 0; i <= points * 2; i++) {
    const ang = (i / (points * 2)) * Math.PI * 2;
    const rad = i % 2 === 0 ? R : R * 0.55;
    const x = Math.cos(ang) * rad;
    const y = Math.sin(ang) * rad;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  const grad = ctx.createRadialGradient(0, 0, R * 0.1, 0, 0, R);
  grad.addColorStop(0, '#fff3b0');
  grad.addColorStop(0.45, '#ff8a3d');
  grad.addColorStop(1, '#e23b2e');
  ctx.fillStyle = grad;
  ctx.fill();
  ctx.restore();

  // white-hot core flash (early frames only)
  if (p < 0.4) {
    ctx.save();
    ctx.globalAlpha = (1 - p / 0.4) * 0.9;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(0, 0, R * 0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // a comic "BOOM!" that pops out and rises
  ctx.save();
  ctx.globalAlpha = Math.max(0, 1 - p * 1.2);
  const ts = r * (0.9 + p * 0.6);
  ctx.translate(0, -p * r * 1.2);
  ctx.rotate(-0.12);
  ctx.font = `900 ${ts}px system-ui, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = '#4a1410';
  ctx.lineWidth = ts * 0.16;
  ctx.strokeText('BOOM!', 0, 0);
  ctx.fillStyle = '#ffe14d';
  ctx.fillText('BOOM!', 0, 0);
  ctx.restore();
}

// little halo (the dark-humor beat) — a ring that floats up after the blast
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
