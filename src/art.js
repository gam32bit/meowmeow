// =============================================================================
// art.js — chunky pixel-art sprites, all drawn in code (no image files).
// Style is deliberately simplified — think Risk of Rain / Noita silhouettes,
// not fine detail. Grandma is "just hair + glasses", cats have no faces.
//
// Everything is drawn from a small grid of characters mapped to colors. By
// default a sprite's BOTTOM-CENTRE lands on the current origin (0,0), so
// callers translate to a point on the ground and the sprite stands on it.
// =============================================================================

// --- core pixel renderer ---------------------------------------------------
// rows: equal-length strings; each char keys `palette` ('.'/' ' = transparent).
// px: size of one pixel cell. opts.ox / opts.oy override the origin (in cells).
export function pixels(ctx, rows, palette, px, opts = {}) {
  const cols = rows[0].length;
  const ox = opts.ox != null ? opts.ox : cols / 2;
  const oy = opts.oy != null ? opts.oy : rows.length; // default: sit on the floor
  px = Math.max(1, Math.round(px));
  for (let y = 0; y < rows.length; y++) {
    const row = rows[y];
    for (let x = 0; x < row.length; x++) {
      const col = palette[row[x]];
      if (!col) continue;
      ctx.fillStyle = col;
      ctx.fillRect(Math.round((x - ox) * px), Math.round((y - oy) * px), px, px);
    }
  }
}

export function heart(ctx, cx, cy, s, color) {
  // small pixel heart (used for HUD lives + the feed reward)
  const rows = [
    '.XX.XX.',
    'XXXXXXX',
    'XXXXXXX',
    '.XXXXX.',
    '..XXX..',
    '...X...',
  ];
  ctx.save();
  ctx.translate(cx, cy);
  pixels(ctx, rows, { X: color }, s / 3.2, { oy: 3 });
  ctx.restore();
}

// --- the cat (sitting kitty: ears, face, belly, front paws, curled tail) ---
// mood: 'calm' | 'worried' | 'panic' | 'happy'. `t` drives a little idle bob;
// panic adds a nervous jitter. Face features (E eyes, P nose) are baked in so
// it always reads as a cat; the patience ring + jitter carry the urgency.
const CAT = [
  '...C.....C...', //  0 ear tips
  '..CCC...CCC..', //  1 ears
  '..CPC...CPC..', //  2 pink inner ears
  '..CCCCCCCCC..', //  3 head top
  '.CCCCCCCCCCC.', //  4 head
  '.CCEECCCEECC.', //  5 eyes
  '.CCCLLPLLCCC.', //  6 nose + muzzle
  '..CCLLLLLCC..', //  7 chin
  '..CCCCCCCCC..', //  8 neck
  '.CCCCCCCCCCC.', //  9 chest
  '.CCCLLLLLCCC.', // 10 belly
  '.CCCLLLLLCCCD', // 11 belly + tail down the side
  '.CCCCCCCCCCCD', // 12 lower body + tail
  '.CCC.CCC.CCDD', // 13 front paws + tail curl
  '......DDDDD..', // 14 tail tip hooks across the front
];

export function cat(ctx, r, opts = {}) {
  const { mood = 'calm', color = '#9b8bb4', t = 0, facing = 1 } = opts;
  const px = Math.max(2, Math.round(r / 6));
  const palette = {
    C: color,
    D: shade(color, -50),  // tail / shading
    L: shade(color, 62),   // light belly + muzzle
    E: '#23202b',          // eyes
    P: '#e98ba1',          // pink nose + inner ears
  };

  ctx.save();
  // idle breathing bob; panic = fast nervous shiver
  const panic = mood === 'panic';
  const bob = panic ? Math.round(Math.sin(t * 22) * 1) : Math.round(Math.sin(t * 3) * 0.6);
  const jitter = panic ? Math.round((Math.random() - 0.5) * 2) : 0;
  ctx.translate(jitter, bob);
  ctx.scale(facing, 1);
  pixels(ctx, CAT, palette, px);
  ctx.restore();
}

// --- Grandma (brown hair + round glasses + cozy buttoned cardigan) ---------
// Drawn standing with her feet on the origin. `hands` selects what she cradles;
// `walking` adds a 1px waddle bob; `facing` flips her left/right. Body is kept
// armless-blocky so the bowl/can she cradles in front always reads cleanly.
const GMA = [
  '...HHHHHHH...', //  0 hair crown (dark, full)
  '.HHHHHHHHHHH.', //  1 hair
  '.HHHHhhhHHHH.', //  2 hair + soft highlight
  '.HHHHHHHHHHH.', //  3 hair
  '.HHSSSSSSSHH.', //  4 forehead (hair frames the face)
  '.HGGGGSGGGGH.', //  5 glasses: top rims, nose gap
  '.HGggGGGggGH.', //  6 lenses + bridge bar
  '.HGggGSGggGH.', //  7 lenses, nose shows through
  '.HGGGGSGGGGH.', //  8 glasses: bottom rims
  '.HSSSSSSSSSH.', //  9 cheeks
  '.HSSSMMMSSSH.', // 10 little smile
  '..SSSSSSSSS..', // 11 chin
  '...SSSSSSS...', // 12 jaw
  '....SSSSS....', // 13 neck
  '..cCCCCCCCc..', // 14 cardigan collar
  '.cCCCCWCCCCc.', // 15 cardigan + button
  '.cCCCCWCCCCc.', // 16 cardigan + button
  '.cCCCCWCCCCc.', // 17 cardigan + button
  '..CCCCCCCCC..', // 18 hem
  '..KKKKKKKKK..', // 19 skirt
  '..KKKKKKKKK..', // 20 skirt
  '...FF...FF...', // 21 shoes
];
const GMA_PAL = {
  H: '#4d3422', // dark brown hair
  h: '#6b4a30', // warm hair highlight
  S: '#e8b98f', // skin
  G: '#23202b', // glasses frame (bold near-black so it reads at any size)
  g: '#dff2fb', // bright glasses lens
  M: '#bd6f66', // little smile
  C: '#d98fb0', // cardigan
  c: '#b06a8a', // cardigan shading / collar
  W: '#fff0d0', // buttons
  K: '#5b6b8c', // skirt
  F: '#3a3550', // shoes
};

export function grandma(ctx, r, opts = {}) {
  const { facing = 1, walking = false, hands = 'empty', phase = 0 } = opts;
  const px = Math.max(2, Math.round(r / 6));
  const bob = walking ? -Math.round((Math.sin(phase) + 1) * 0.5) : 0; // 0 or -1px

  ctx.save();
  // soft contact shadow on the ground
  ctx.fillStyle = 'rgba(0,0,0,0.16)';
  ctx.beginPath();
  ctx.ellipse(0, 0, px * 5, px * 1.2, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.save();
  ctx.translate(0, bob);
  ctx.save();
  ctx.scale(facing, 1);
  pixels(ctx, GMA, GMA_PAL, px);
  ctx.restore();

  // the item she's cradling, held in front at belly height
  if (hands !== 'empty') {
    ctx.save();
    ctx.translate(0, -px * 6.5);
    if (hands === 'can') can(ctx, px * 2.6, true);
    else if (hands === 'bowl') bowl(ctx, px * 3, false);
    else if (hands === 'fullbowl') bowl(ctx, px * 3, true);
    ctx.restore();
  }
  ctx.restore();
  ctx.restore();
}

// --- a can of cat food -----------------------------------------------------
// `r` ~ half its width. `opened` shows food mounded on top.
const CAN_CLOSED = [
  '.MMMMM.',
  '.RRRRR.',
  '.RRRRR.',
  '.LLLLL.',
  '.LBFBL.',
  '.LLLLL.',
  '.RRRRR.',
  '.RRRRR.',
];
const CAN_OPEN = [
  '..OOO.M',
  '.OOOOO.',
  '.RRRRR.',
  '.LLLLL.',
  '.LBFBL.',
  '.LLLLL.',
  '.RRRRR.',
  '.RRRRR.',
];
const CAN_PAL = {
  R: '#d6473f', // can body
  L: '#f4e3c4', // label band
  F: '#7fb0d8', // little fish
  B: '#5d92bf', // fish shade
  M: '#cdd6df', // metal lid
  O: '#9a6b3f', // food
};

export function can(ctx, r, opened = false) {
  const px = Math.max(2, Math.round(r / 2.6));
  pixels(ctx, opened ? CAN_OPEN : CAN_CLOSED, CAN_PAL, px, { oy: 4 });
}

// --- a bowl (empty or full) ------------------------------------------------
const BOWL_EMPTY = [
  '.BBBBBBB.',
  'WWWWWWWWW',
  'SWWWWWWWS',
  '.SSSSSSS.',
  '..SSSSS..',
];
const BOWL_FULL = [
  '...OoO...',
  '.OOOOOOO.',
  'WBOOOOOBW',
  'SWWWWWWWS',
  '.SSSSSSS.',
  '..SSSSS..',
];
const BOWL_PAL = {
  W: '#eef3f8', // bowl
  S: '#c3ccd9', // bowl shadow
  B: '#7fa8d8', // blue rim
  O: '#9a6b3f', // food
  o: '#7d5530', // food dark bits
};

export function bowl(ctx, r, full = false) {
  const px = Math.max(2, Math.round(r / 4.5));
  pixels(ctx, full ? BOWL_FULL : BOWL_EMPTY, BOWL_PAL, px, { oy: full ? 6 : 5 });
}

// --- the counter stacks (drawn centred in a w×h rect) ----------------------
// A little pyramid of cans the player taps to send Grandma for food.
export function foodStackArt(ctx, w, h) {
  const px = Math.max(2, Math.round(w / 12));
  ctx.save();
  ctx.translate(0, h * 0.5); // drop to the rect's floor, then stack upward
  const positions = [
    [-px * 4.5, 0], [px * 0.5, 0], // bottom row
    [-px * 2, -px * 9],            // top can
  ];
  for (const [dx, dy] of positions) {
    ctx.save();
    ctx.translate(dx + px * 2, dy);
    pixels(ctx, CAN_CLOSED, CAN_PAL, px, { oy: 8 });
    ctx.restore();
  }
  ctx.restore();
}

// A short stack of nested bowls the player taps to send Grandma for a bowl.
export function bowlStackArt(ctx, w, h) {
  const px = Math.max(2, Math.round(w / 11));
  ctx.save();
  ctx.translate(0, h * 0.5);
  for (let i = 0; i < 3; i++) {
    ctx.save();
    ctx.translate(0, -i * px * 2.4);
    pixels(ctx, BOWL_EMPTY, BOWL_PAL, px, { oy: 5 });
    ctx.restore();
  }
  ctx.restore();
}

// --- a small, contained "dynamite" pop -------------------------------------
// p is 0..1 progress. `parts` is pre-generated debris so each blast varies.
// Stays roughly within ~2× the cat — no screen-wide drama.
export function explosion(ctx, r, p, parts = []) {
  const fade = Math.max(0, 1 - p);
  const px = Math.max(2, Math.round(r / 7));

  // expanding shockwave ring — grows past the cat and fades early
  if (p < 0.55) {
    const k = p / 0.55;
    ctx.save();
    ctx.globalAlpha = (1 - k) * 0.8;
    ctx.strokeStyle = p < 0.3 ? '#fff2c0' : '#ff9a3d';
    ctx.lineWidth = Math.max(3, px * (1.6 - k));
    ctx.beginPath();
    ctx.arc(0, 0, r * (0.3 + k * 1.05), 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  // a big bright core: white → yellow → orange diamond, shrinking
  if (p < 0.55) {
    const k = 1 - p / 0.55;
    const col = p < 0.16 ? '#ffffff' : p < 0.33 ? '#ffe14d' : '#ff8a3d';
    const s = Math.max(px, Math.round(r * (0.7 + p) * 0.9));
    ctx.save();
    ctx.fillStyle = col;
    // chunky plus/diamond shape
    ctx.fillRect(-s, -Math.round(s * 0.45 * k) - px, s * 2, Math.round(s * 0.9 * k) + px * 2);
    ctx.fillRect(-Math.round(s * 0.45 * k) - px, -s, Math.round(s * 0.9 * k) + px * 2, s * 2);
    ctx.restore();
  }

  // shards (sparks + fur tufts) flying outward and drifting up
  for (const d of parts) {
    const dist = (0.25 + p * 1.4) * r * d.sp;
    const x = Math.cos(d.a) * dist;
    const y = Math.sin(d.a) * dist - p * r * 0.55;
    ctx.globalAlpha = fade;
    if (d.kind === 'spark') {
      ctx.fillStyle = p < 0.5 ? '#ffe14d' : '#ff8a3d';
      const s = Math.max(2, Math.round(px * (0.7 + fade * 0.6)));
      ctx.fillRect(Math.round(x), Math.round(y), s, s);
    } else {
      ctx.fillStyle = '#6f5238';
      const s = Math.max(2, Math.round(px * (1.0 + fade * 0.6)));
      ctx.fillRect(Math.round(x), Math.round(y), s, s);
    }
  }
  ctx.globalAlpha = 1;
}

// little halo (the dark-humor beat) — a ring that floats up after the pop.
export function halo(ctx, r, alpha) {
  const px = Math.max(2, Math.round(r / 4));
  const rows = ['.YYYY.', 'Y....Y', '.YYYY.'];
  ctx.save();
  ctx.globalAlpha = alpha;
  pixels(ctx, rows, { Y: '#ffe680' }, px, { oy: 1.5 });
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
