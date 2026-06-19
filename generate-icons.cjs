// Genera los íconos PNG de la PWA (sin dependencias externas).
// Uso: node generate-icons.cjs   ->  crea icon-192.png, icon-512.png, icon-180.png
const fs = require("fs");
const zlib = require("zlib");

// ── PNG encoder mínimo (RGBA, 8 bits) ──────────────────────
function crc32(buf) {
  let c = ~0;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xEDB88320 & -(c & 1));
  }
  return ~c >>> 0;
}
function chunk(type, data) {
  const t = Buffer.from(type, "ascii");
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length, 0);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(Buffer.concat([t, data])), 0);
  return Buffer.concat([len, t, data, crc]);
}
function encodePNG(W, H, rgba) {
  const raw = Buffer.alloc(H * (W * 4 + 1));
  for (let y = 0; y < H; y++) {
    raw[y * (W * 4 + 1)] = 0; // filtro 0
    rgba.copy(raw, y * (W * 4 + 1) + 1, y * W * 4, y * W * 4 + W * 4);
  }
  const idat = zlib.deflateSync(raw, { level: 9 });
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(W, 0); ihdr.writeUInt32BE(H, 4);
  ihdr[8] = 8; ihdr[9] = 6; // bit depth 8, color type 6 (RGBA)
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  return Buffer.concat([sig, chunk("IHDR", ihdr), chunk("IDAT", idat), chunk("IEND", Buffer.alloc(0))]);
}

// ── Dibujo del ícono a resolución S (supersample) ──────────
const GOLD = [240, 192, 96];
function lerp(a, b, t) { return Math.round(a + (b - a) * t); }

function drawIcon(S) {
  const buf = Buffer.alloc(S * S * 4);
  const cx = S / 2, cy = S / 2;
  const set = (x, y, r, g, b, a) => {
    x |= 0; y |= 0;
    if (x < 0 || y < 0 || x >= S || y >= S) return;
    const i = (y * S + x) * 4;
    // mezcla sobre lo existente
    const ia = a / 255, na = 1 - ia;
    buf[i]   = Math.round(r * ia + buf[i] * na);
    buf[i+1] = Math.round(g * ia + buf[i+1] * na);
    buf[i+2] = Math.round(b * ia + buf[i+2] * na);
    buf[i+3] = 255;
  };

  // Fondo: degradado vertical (#14253b -> #0a1422)
  for (let y = 0; y < S; y++) {
    const t = y / S;
    const r = lerp(0x14, 0x0a, t), g = lerp(0x25, 0x14, t), b = lerp(0x3b, 0x22, t);
    for (let x = 0; x < S; x++) {
      const i = (y * S + x) * 4;
      buf[i] = r; buf[i+1] = g; buf[i+2] = b; buf[i+3] = 255;
    }
  }

  // Anillos dorados
  function ring(R, th, alpha) {
    const r0 = R - th / 2, r1 = R + th / 2;
    const y0 = Math.max(0, cy - r1 - 2), y1 = Math.min(S, cy + r1 + 2);
    for (let y = y0; y < y1; y++)
      for (let x = cx - r1 - 2; x < cx + r1 + 2; x++) {
        const d = Math.hypot(x - cx, y - cy);
        if (d >= r0 && d <= r1) set(x, y, GOLD[0], GOLD[1], GOLD[2], alpha);
      }
  }
  ring(S * 0.365, S * 0.016, 255);
  ring(S * 0.305, S * 0.008, 165);

  // Rectángulo redondeado dorado
  function rrect(x0, y0, w, h, rad, alpha = 255) {
    for (let y = y0; y < y0 + h; y++)
      for (let x = x0; x < x0 + w; x++) {
        let inside = true;
        const corners = [
          [x0 + rad, y0 + rad], [x0 + w - rad, y0 + rad],
          [x0 + rad, y0 + h - rad], [x0 + w - rad, y0 + h - rad],
        ];
        if (x < x0 + rad && y < y0 + rad) inside = Math.hypot(x - corners[0][0], y - corners[0][1]) <= rad;
        else if (x > x0 + w - rad && y < y0 + rad) inside = Math.hypot(x - corners[1][0], y - corners[1][1]) <= rad;
        else if (x < x0 + rad && y > y0 + h - rad) inside = Math.hypot(x - corners[2][0], y - corners[2][1]) <= rad;
        else if (x > x0 + w - rad && y > y0 + h - rad) inside = Math.hypot(x - corners[3][0], y - corners[3][1]) <= rad;
        if (inside) set(x, y, GOLD[0], GOLD[1], GOLD[2], alpha);
      }
  }

  // Cuchillo (izquierda)
  const barW = S * 0.032;
  const kx = cx - S * 0.072;
  rrect(kx - barW / 2, cy - S * 0.155, barW, S * 0.31, barW / 2);

  // Tenedor (derecha)
  const fx = cx + S * 0.072;
  // mango
  rrect(fx - barW / 2, cy + S * 0.0, barW, S * 0.155, barW / 2);
  // base de las púas
  rrect(fx - S * 0.034, cy - S * 0.03, S * 0.068, S * 0.045, S * 0.02);
  // 3 púas
  const tW = S * 0.014, tH = S * 0.11, tTop = cy - S * 0.155;
  rrect(fx - S * 0.030 - tW / 2, tTop, tW, tH, tW / 2);
  rrect(fx - tW / 2,             tTop, tW, tH, tW / 2);
  rrect(fx + S * 0.030 - tW / 2, tTop, tW, tH, tW / 2);

  return buf;
}

// ── Downsample (box filter) de S -> target ─────────────────
function downsample(src, S, target) {
  const out = Buffer.alloc(target * target * 4);
  const f = S / target;
  for (let y = 0; y < target; y++)
    for (let x = 0; x < target; x++) {
      let r = 0, g = 0, b = 0, a = 0, n = 0;
      const x0 = Math.floor(x * f), x1 = Math.floor((x + 1) * f);
      const y0 = Math.floor(y * f), y1 = Math.floor((y + 1) * f);
      for (let sy = y0; sy < y1; sy++)
        for (let sx = x0; sx < x1; sx++) {
          const i = (sy * S + sx) * 4;
          r += src[i]; g += src[i+1]; b += src[i+2]; a += src[i+3]; n++;
        }
      const o = (y * target + x) * 4;
      out[o] = Math.round(r/n); out[o+1] = Math.round(g/n);
      out[o+2] = Math.round(b/n); out[o+3] = Math.round(a/n);
    }
  return out;
}

function make(target) {
  const SS = 4;
  const S = target * SS;
  const big = drawIcon(S);
  const small = downsample(big, S, target);
  return encodePNG(target, target, small);
}

[["icon-512.png", 512], ["icon-192.png", 192], ["icon-180.png", 180]].forEach(([name, size]) => {
  fs.writeFileSync(__dirname + "/" + name, make(size));
  console.log("✓", name);
});
