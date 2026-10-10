import fs from 'fs';
import zlib from 'zlib';

function processLogo() {
  const buf = fs.readFileSync('public/logo.png');
  let pos = 8;
  const idats = [];
  while (pos < buf.length) {
    const len = buf.readUInt32BE(pos);
    const type = buf.toString('ascii', pos + 4, pos + 8);
    if (type === 'IDAT') idats.push(buf.slice(pos + 8, pos + 8 + len));
    pos += 12 + len;
  }
  const decomp = zlib.inflateSync(Buffer.concat(idats));
  const srcW = 1024, srcH = 1024;
  const unfilter = Buffer.alloc(srcW * srcH * 4);
  let srcPos = 0;
  const bpp = 4;
  for (let y = 0; y < srcH; y++) {
    const filterType = decomp[srcPos++];
    const prevRowOffset = (y - 1) * srcW * 4;
    const currRowOffset = y * srcW * 4;
    for (let x = 0; x < srcW * 4; x++) {
      const raw = decomp[srcPos++];
      const a = x >= bpp ? unfilter[currRowOffset + x - bpp] : 0;
      const b = y > 0 ? unfilter[prevRowOffset + x] : 0;
      const c = (x >= bpp && y > 0) ? unfilter[prevRowOffset + x - bpp] : 0;
      let val = 0;
      if (filterType === 0) val = raw;
      else if (filterType === 1) val = (raw + a) & 0xff;
      else if (filterType === 2) val = (raw + b) & 0xff;
      else if (filterType === 3) val = (raw + Math.floor((a + b) / 2)) & 0xff;
      else if (filterType === 4) {
        const p = a + b - c;
        const pa = Math.abs(p - a);
        const pb = Math.abs(p - b);
        const pc = Math.abs(p - c);
        const pr = (pa <= pb && pa <= pc) ? a : (pb <= pc ? b : c);
        val = (raw + pr) & 0xff;
      }
      unfilter[currRowOffset + x] = val;
    }
  }

  // Find exact non-white bounding box
  let minX = srcW, maxX = 0, minY = srcH, maxY = 0;
  for (let y = 0; y < srcH; y++) {
    for (let x = 0; x < srcW; x++) {
      const idx = (y * srcW + x) * 4;
      const r = unfilter[idx], g = unfilter[idx+1], b = unfilter[idx+2];
      if (r < 250 || g < 250 || b < 250) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  console.log('Bounding Box:', { minX, maxX, minY, maxY });

  // Add a balanced 24px margin
  const pad = 24;
  const cropX1 = Math.max(0, minX - pad);
  const cropX2 = Math.min(srcW - 1, maxX + pad);
  const cropY1 = Math.max(0, minY - pad);
  const cropY2 = Math.min(srcH - 1, maxY + pad);

  // Make it square for clean icons
  let cropW = cropX2 - cropX1 + 1;
  let cropH = cropY2 - cropY1 + 1;
  const maxDim = Math.max(cropW, cropH);

  const finalSize = maxDim;
  const offsetX = Math.floor((finalSize - cropW) / 2);
  const offsetY = Math.floor((finalSize - cropH) / 2);

  console.log({ cropW, cropH, finalSize, offsetX, offsetY });

  // Create final RGBA buffer
  const outBuf = Buffer.alloc(finalSize * (1 + finalSize * 4));
  let outPos = 0;

  for (let y = 0; y < finalSize; y++) {
    outBuf[outPos++] = 0; // Filter byte 0 (None)
    for (let x = 0; x < finalSize; x++) {
      const srcX = cropX1 + (x - offsetX);
      const srcY = cropY1 + (y - offsetY);

      if (srcX >= 0 && srcX < srcW && srcY >= 0 && srcY < srcH &&
          x >= offsetX && x < offsetX + cropW &&
          y >= offsetY && y < offsetY + cropH) {
        const srcIdx = (srcY * srcW + srcX) * 4;
        const r = unfilter[srcIdx];
        const g = unfilter[srcIdx + 1];
        const b = unfilter[srcIdx + 2];

        // Smooth transparency: if close to pure white, fade alpha smoothly
        if (r > 248 && g > 248 && b > 248) {
          outBuf[outPos++] = 0;
          outBuf[outPos++] = 0;
          outBuf[outPos++] = 0;
          outBuf[outPos++] = 0; // transparent
        } else if (r > 235 && g > 235 && b > 235) {
          // Antialiased edge transition
          const dist = Math.min(255 - r, 255 - g, 255 - b);
          const alpha = Math.min(255, Math.floor((dist / 20) * 255));
          outBuf[outPos++] = r;
          outBuf[outPos++] = g;
          outBuf[outPos++] = b;
          outBuf[outPos++] = alpha;
        } else {
          outBuf[outPos++] = r;
          outBuf[outPos++] = g;
          outBuf[outPos++] = b;
          outBuf[outPos++] = 255;
        }
      } else {
        outBuf[outPos++] = 0;
        outBuf[outPos++] = 0;
        outBuf[outPos++] = 0;
        outBuf[outPos++] = 0;
      }
    }
  }

  // Compress IDAT
  const compressedIDAT = zlib.deflateSync(outBuf, { level: 9 });

  // Helper to build PNG chunks
  function makeChunk(type, data) {
    const len = data.length;
    const chunk = Buffer.alloc(12 + len);
    chunk.writeUInt32BE(len, 0);
    chunk.write(type, 4, 4, 'ascii');
    data.copy(chunk, 8);
    const crc = crc32(chunk.slice(4, 8 + len));
    chunk.writeInt32BE(crc, 8 + len);
    return chunk;
  }

  // CRC32 table
  const crcTable = [];
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      if (c & 1) c = 0xedb88320 ^ (c >>> 1);
      else c = c >>> 1;
    }
    crcTable[n] = c;
  }
  function crc32(buf) {
    let c = 0xffffffff;
    for (let i = 0; i < buf.length; i++) {
      c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
    }
    return (c ^ 0xffffffff);
  }

  // IHDR chunk
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(finalSize, 0);
  ihdrData.writeUInt32BE(finalSize, 4);
  ihdrData[8] = 8; // bit depth
  ihdrData[9] = 6; // color type RGBA
  ihdrData[10] = 0; // compression
  ihdrData[11] = 0; // filter
  ihdrData[12] = 0; // interlace

  const pngHeader = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const ihdrChunk = makeChunk('IHDR', ihdrData);
  const idatChunk = makeChunk('IDAT', compressedIDAT);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  const finalPng = Buffer.concat([pngHeader, ihdrChunk, idatChunk, iendChunk]);
  console.log('Generated cropped transparent PNG size:', finalPng.length, 'Resolution:', finalSize + 'x' + finalSize);

  fs.writeFileSync('public/logo.png', finalPng);
  fs.writeFileSync('src/assets/logo.png', finalPng);
  fs.writeFileSync('public/favicon.png', finalPng);
  console.log('Successfully written to public/logo.png, src/assets/logo.png, public/favicon.png');
}

processLogo();
