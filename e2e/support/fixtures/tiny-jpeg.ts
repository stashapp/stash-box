// Tiny synthetic JPEG used by the image-upload e2e tests. Generated once at
// load time and written to a stable path so successive tests can reuse the
// file (Playwright's setInputFiles takes a path, not a buffer). The byte
// sequence is a standards-compliant 1×1 grayscale JFIF that libvips decodes
// cleanly — enough to satisfy stash-box's image pipeline without committing
// a binary asset.

import { writeFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const TINY_JPEG = Buffer.from([
  // SOI
  0xff, 0xd8,
  // APP0 JFIF header
  0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01, 0x01, 0x00,
  0x00, 0x01, 0x00, 0x01, 0x00, 0x00,
  // DQT
  0xff, 0xdb, 0x00, 0x43, 0x00,
  ...Array(64).fill(0x10),
  // SOF0 — 1x1 grayscale
  0xff, 0xc0, 0x00, 0x0b, 0x08, 0x00, 0x01, 0x00, 0x01, 0x01, 0x01, 0x11, 0x00,
  // DHT DC
  0xff, 0xc4, 0x00, 0x1f, 0x00,
  0, 1, 5, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11,
  // DHT AC
  0xff, 0xc4, 0x00, 0xb5, 0x10,
  0, 2, 1, 3, 3, 2, 4, 3, 5, 5, 4, 4, 0, 0, 1, 0x7d,
  ...Array(162)
    .fill(0)
    .map((_, i) => i),
  // SOS
  0xff, 0xda, 0x00, 0x08, 0x01, 0x01, 0x00, 0x00, 0x3f, 0x00,
  // Scan data
  0x00,
  // EOI
  0xff, 0xd9,
]);

export function tinyJpegPath(): string {
  const p = join(tmpdir(), "stashbox-e2e-tiny.jpg");
  if (!existsSync(p)) {
    writeFileSync(p, TINY_JPEG);
  }
  return p;
}
