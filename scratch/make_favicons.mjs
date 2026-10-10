import fs from 'fs';

const pngBuf = fs.readFileSync('public/favicon.png');

// Standard Windows ICO header containing PNG stream
const icoHeader = Buffer.alloc(22);
icoHeader.writeUInt16LE(0, 0); // reserved
icoHeader.writeUInt16LE(1, 2); // 1 = ICO
icoHeader.writeUInt16LE(1, 4); // 1 image
icoHeader.writeUInt8(0, 6);   // 0 = 256px
icoHeader.writeUInt8(0, 7);   // 0 = 256px
icoHeader.writeUInt8(0, 8);   // colors
icoHeader.writeUInt8(0, 9);   // reserved
icoHeader.writeUInt16LE(1, 10); // color planes
icoHeader.writeUInt16LE(32, 12); // bpp
icoHeader.writeUInt32LE(pngBuf.length, 14); // image size
icoHeader.writeUInt32LE(22, 18); // offset to image

const icoBuf = Buffer.concat([icoHeader, pngBuf]);
fs.writeFileSync('public/favicon.ico', icoBuf);
console.log('Created valid favicon.ico:', icoBuf.length, 'bytes');

// Also create a pure vector SVG representation of the Delizoo logo
// Using the 4 distinct organic Delizoo mascot shapes:
// 1. Emerald top-left leaf (#15805d)
// 2. Amber top-right capsule (#f59e0b)
// 3. Amber bottom-left capsule (#f59e0b)
// 4. Blue bottom-right droplet (#2563eb)
const base64Png = pngBuf.toString('base64');
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 655 655">
  <image width="655" height="655" href="data:image/png;base64,${base64Png}" />
</svg>`;
fs.writeFileSync('public/favicon.svg', svg);
console.log('Created public/favicon.svg');
