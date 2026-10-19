const fs = require('fs');
const zlib = require('zlib');
const path = require('path');

function crc32(buf) {
  let table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[i] = c;
  }
  let crc = 0 ^ (-1);
  for (let i = 0; i < buf.length; i++) {
    crc = (crc >>> 8) ^ table[(crc ^ buf[i]) & 0xff];
  }
  return (crc ^ (-1)) >>> 0;
}

function makeChunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii');
  const lenBuf = Buffer.alloc(4);
  lenBuf.writeUInt32BE(data.length, 0);
  const combined = Buffer.concat([typeBuf, data]);
  const crc = crc32(combined);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc, 0);
  return Buffer.concat([lenBuf, combined, crcBuf]);
}

function createPng(width, height, getPixel) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // 8 bits per channel
  ihdrData[9] = 6; // RGBA
  ihdrData[10] = 0;
  ihdrData[11] = 0;
  ihdrData[12] = 0;
  const ihdr = makeChunk('IHDR', ihdrData);

  const rawRows = [];
  for (let y = 0; y < height; y++) {
    const row = Buffer.alloc(1 + width * 4);
    row[0] = 0; // Filter None
    for (let x = 0; x < width; x++) {
      const [r, g, b, a] = getPixel(x, y, width, height);
      const offset = 1 + x * 4;
      row[offset] = r;
      row[offset + 1] = g;
      row[offset + 2] = b;
      row[offset + 3] = a;
    }
    rawRows.push(row);
  }
  const idatData = zlib.deflateSync(Buffer.concat(rawRows), { level: 9 });
  const idat = makeChunk('IDAT', idatData);
  const iend = makeChunk('IEND', Buffer.alloc(0));
  return Buffer.concat([sig, ihdr, idat, iend]);
}

// Distance from point to line segment
function distToSegment(px, py, x1, y1, x2, y2) {
  const l2 = (x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1);
  if (l2 === 0) return Math.hypot(px - x1, py - y1);
  let t = ((px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)) / l2;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(px - (x1 + t * (x2 - x1)), py - (y1 + t * (y2 - y1)));
}

// Draw Philippine Peso ₱ inside icon
function renderIcon(size, isMaskable = false) {
  const cx = size / 2;
  const cy = size / 2;
  const cornerRadius = isMaskable ? 0 : size * 0.22;
  const scale = isMaskable ? 0.72 : 0.82;

  // Peso geometry relative to center
  const glyphH = size * 0.48 * scale;
  const topY = cy - glyphH / 2;
  const botY = cy + glyphH / 2;
  const strokeW = Math.max(4, size * 0.052 * scale);

  const stemX = cx - glyphH * 0.22;
  const bowlR = glyphH * 0.26;
  const bowlCenterY = topY + bowlR;
  const bowlCenterX = stemX;

  const bar1Y = topY + glyphH * 0.18;
  const bar2Y = topY + glyphH * 0.34;
  const barLeft = stemX - glyphH * 0.22;
  const barRight = stemX + glyphH * 0.42;

  return createPng(size, size, (x, y) => {
    // Check squircle bounds if not maskable
    if (!isMaskable) {
      const dx = Math.max(0, Math.abs(x - cx) - (cx - cornerRadius));
      const dy = Math.max(0, Math.abs(y - cy) - (cy - cornerRadius));
      if (Math.hypot(dx, dy) > cornerRadius) {
        return [0, 0, 0, 0]; // Transparent outside squircle
      }
    }

    // Background gradient: Emerald 600 -> Emerald 800
    const tY = y / size;
    const tX = x / size;
    const grad = (tX + tY) / 2;
    const bgR = Math.round(5 * (1 - grad) + 4 * grad);
    const bgG = Math.round(150 * (1 - grad) + 100 * grad);
    const bgB = Math.round(105 * (1 - grad) + 70 * grad);

    // Inner subtle ring
    const distCenter = Math.hypot(x - cx, y - cy);
    const ringR = size * 0.42 * scale;
    const isRing = Math.abs(distCenter - ringR) < (strokeW * 0.35);

    // Peso Stem
    const inStem = x >= (stemX - strokeW / 2) && x <= (stemX + strokeW / 2) &&
                  y >= topY && y <= botY;

    // Peso Bowl (semi-circle on the right)
    let inBowl = false;
    if (x >= bowlCenterX && y >= topY && y <= topY + bowlR * 2) {
      const d = Math.hypot(x - bowlCenterX, y - bowlCenterY);
      if (Math.abs(d - bowlR) <= strokeW / 2) {
        inBowl = true;
      }
    }

    // Top horizontal cap
    const inTopCap = y >= topY && y <= topY + strokeW && x >= stemX && x <= bowlCenterX;
    // Bottom horizontal cap of bowl
    const inMidCap = y >= topY + bowlR * 2 - strokeW && y <= topY + bowlR * 2 && x >= stemX && x <= bowlCenterX;

    // Crossbar 1
    const inBar1 = y >= (bar1Y - strokeW * 0.42) && y <= (bar1Y + strokeW * 0.42) &&
                   x >= barLeft && x <= barRight;
    // Crossbar 2
    const inBar2 = y >= (bar2Y - strokeW * 0.42) && y <= (bar2Y + strokeW * 0.42) &&
                   x >= barLeft && x <= barRight;

    if (inStem || inBowl || inTopCap || inMidCap || inBar1 || inBar2) {
      return [255, 255, 255, 255]; // Crisp white glyph
    }

    if (isRing) {
      return [255, 255, 255, 45]; // Subtle white ring
    }

    // Sparkle accent at upper-right
    const sparkleDist = Math.hypot(x - (cx + size * 0.28), y - (cy - size * 0.28));
    if (sparkleDist < size * 0.035) {
      return [251, 191, 36, 255]; // Gold amber sparkle
    }

    return [bgR, bgG, bgB, 255];
  });
}

const publicDir = path.resolve(__dirname, '../public');

// 1. 192x192
fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), renderIcon(192, false));
console.log('✓ Created pwa-192x192.png');

// 2. 512x512
fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), renderIcon(512, false));
console.log('✓ Created pwa-512x512.png');

// 3. 512x512 Maskable
fs.writeFileSync(path.join(publicDir, 'pwa-maskable-512x512.png'), renderIcon(512, true));
console.log('✓ Created pwa-maskable-512x512.png');

// 4. Apple Touch Icon 180x180
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), renderIcon(180, false));
console.log('✓ Created apple-touch-icon.png');

// 5. Favicon 64x64
fs.writeFileSync(path.join(publicDir, 'favicon.ico'), renderIcon(64, false));
console.log('✓ Created favicon.ico');
