// =============================================================================
// make-icons.mjs — generates the PWA app icons (a cat face) as PNGs, with NO
// dependencies: it rasterizes per-pixel and encodes PNG using Node's built-in
// zlib. Run: `node tools/make-icons.mjs`. Outputs assets/icon-{192,512}.png.
// =============================================================================

import { deflateSync } from 'node:zlib';
import { writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

// --- tiny CRC32 for PNG chunks --------------------------------------------
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();
function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const body = Buffer.concat([typeBuf, data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body), 0);
  return Buffer.concat([len, body, crc]);
}
function encodePng(size, rgba) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;   // bit depth
  ihdr[9] = 6;   // color type RGBA
  // rows prefixed with filter byte 0
  const stride = size * 4;
  const raw = Buffer.alloc((stride + 1) * size);
  for (let y = 0; y < size; y++) {
    raw[y * (stride + 1)] = 0;
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, y * stride + stride);
  }
  const idat = deflateSync(raw, { level: 9 });
  return Buffer.concat([
    sig,
    chunk('IHDR', ihdr),
    chunk('IDAT', idat),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

// --- draw a cat face -------------------------------------------------------
function set(buf, size, x, y, r, g, b, a = 255) {
  if (x < 0 || y < 0 || x >= size || y >= size) return;
  const i = (y * size + x) * 4;
  const ia = a / 255;
  buf[i] = Math.round(buf[i] * (1 - ia) + r * ia);
  buf[i + 1] = Math.round(buf[i + 1] * (1 - ia) + g * ia);
  buf[i + 2] = Math.round(buf[i + 2] * (1 - ia) + b * ia);
  buf[i + 3] = Math.max(buf[i + 3], a);
}
// soft-edged filled circle
function disc(buf, size, cx, cy, rad, col) {
  const r0 = rad - 1.5;
  for (let y = Math.floor(cy - rad - 2); y <= cy + rad + 2; y++) {
    for (let x = Math.floor(cx - rad - 2); x <= cx + rad + 2; x++) {
      const d = Math.hypot(x - cx, y - cy);
      if (d <= rad) {
        const a = d <= r0 ? 255 : 255 * (1 - (d - r0) / 1.5);
        set(buf, size, x, y, col[0], col[1], col[2], a);
      }
    }
  }
}
function triangle(buf, size, ax, ay, bx, by, cx, cy, col) {
  const minX = Math.floor(Math.min(ax, bx, cx));
  const maxX = Math.ceil(Math.max(ax, bx, cx));
  const minY = Math.floor(Math.min(ay, by, cy));
  const maxY = Math.ceil(Math.max(ay, by, cy));
  const sign = (px, py, qx, qy, rx, ry) =>
    (px - rx) * (qy - ry) - (qx - rx) * (py - ry);
  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      const d1 = sign(x, y, ax, ay, bx, by);
      const d2 = sign(x, y, bx, by, cx, cy);
      const d3 = sign(x, y, cx, cy, ax, ay);
      const neg = d1 < 0 || d2 < 0 || d3 < 0;
      const pos = d1 > 0 || d2 > 0 || d3 > 0;
      if (!(neg && pos)) set(buf, size, x, y, col[0], col[1], col[2], 255);
    }
  }
}

function makeIcon(size) {
  const buf = Buffer.alloc(size * size * 4);
  // background fill (dark plum)
  const bg = [36, 31, 51];
  for (let i = 0; i < size * size; i++) {
    buf[i * 4] = bg[0];
    buf[i * 4 + 1] = bg[1];
    buf[i * 4 + 2] = bg[2];
    buf[i * 4 + 3] = 255;
  }
  const c = size / 2;
  const coat = [155, 139, 180];
  const inner = [196, 169, 196];
  // ears
  const eo = size * 0.26;
  triangle(buf, size, c - eo, c - size * 0.05, c - size * 0.34, c - size * 0.42, c - size * 0.05, c - size * 0.24, coat);
  triangle(buf, size, c + eo, c - size * 0.05, c + size * 0.34, c - size * 0.42, c + size * 0.05, c - size * 0.24, coat);
  triangle(buf, size, c - eo * 0.9, c - size * 0.08, c - size * 0.3, c - size * 0.36, c - size * 0.1, c - size * 0.2, inner);
  triangle(buf, size, c + eo * 0.9, c - size * 0.08, c + size * 0.3, c - size * 0.36, c + size * 0.1, c - size * 0.2, inner);
  // head
  disc(buf, size, c, c + size * 0.02, size * 0.3, coat);
  // eyes
  disc(buf, size, c - size * 0.11, c - size * 0.02, size * 0.045, [43, 37, 51]);
  disc(buf, size, c + size * 0.11, c - size * 0.02, size * 0.045, [43, 37, 51]);
  disc(buf, size, c - size * 0.095, c - size * 0.035, size * 0.015, [255, 255, 255]);
  disc(buf, size, c + size * 0.125, c - size * 0.035, size * 0.015, [255, 255, 255]);
  // nose
  disc(buf, size, c, c + size * 0.07, size * 0.028, [217, 140, 165]);
  return encodePng(size, buf);
}

mkdirSync(join(root, 'assets'), { recursive: true });
for (const size of [192, 512]) {
  const png = makeIcon(size);
  writeFileSync(join(root, 'assets', `icon-${size}.png`), png);
  console.log(`wrote assets/icon-${size}.png (${png.length} bytes)`);
}
