// A square PNG for the crop e2e test, generated at load time and written to a
// stable path because Playwright's setInputFiles takes a path, not a buffer
//
// Square on purpose: every crop template is portrait, so cropping to one is a
// change the assertions can see. The 1x1 JPEG the other image tests use has no
// room to drag a frame in

import { deflateSync } from "node:zlib";
import { writeFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const SIZE = 900;

const crcTable = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});

const crc32 = (buf: Buffer) => {
  let c = 0xffffffff;
  for (const byte of buf) c = crcTable[(c ^ byte) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};

const chunk = (type: string, data: Buffer) => {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([length, body, crc]);
};

const png = () => {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(SIZE, 0);
  ihdr.writeUInt32BE(SIZE, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 0; // grayscale
  // compression, filter, interlace all 0

  // One filter byte per row, then the row itself. A gradient rather than a
  // flat fill, so a crop of the wrong region is distinguishable from the right
  // one if anyone ever looks at the bytes
  const raw = Buffer.alloc(SIZE * (SIZE + 1));
  for (let y = 0; y < SIZE; y++) {
    const row = y * (SIZE + 1);
    raw[row] = 0;
    for (let x = 0; x < SIZE; x++) raw[row + 1 + x] = (x + y) & 0xff;
  }

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw)),
    chunk("IEND", Buffer.alloc(0)),
  ]);
};

let path: string | undefined;

// Absolute path to the fixture, written on first use
export const squarePngPath = () => {
  if (!path) {
    path = join(tmpdir(), `stash-box-e2e-${SIZE}x${SIZE}.png`);
    if (!existsSync(path)) writeFileSync(path, png());
  }
  return path;
};

// The source's own dimensions, for asserting that a crop changed them
export const SQUARE_PNG_SIZE = SIZE;
