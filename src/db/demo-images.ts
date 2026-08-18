/**
 * Deterministic placeholder photos for the demo seed.
 * Images are generated (no network, no binaries in git) as simple landscape
 * scenes so posts and comments have something to show.
 */
import { createHash } from "node:crypto";
import { deflateSync } from "node:zlib";

const WIDTH = 640;
const HEIGHT = 400;

export type GeneratedImage = {
  fileName: string;
  mimeType: string;
  byteSize: number;
  data: Buffer;
};

type Rgb = [number, number, number];

const PALETTES: { sky: [Rgb, Rgb]; sun: Rgb; hills: Rgb[] }[] = [
  {
    sky: [
      [252, 211, 170],
      [244, 133, 116],
    ],
    sun: [255, 244, 214],
    hills: [
      [124, 78, 108],
      [80, 51, 84],
      [46, 30, 56],
    ],
  },
  {
    sky: [
      [186, 226, 245],
      [240, 249, 255],
    ],
    sun: [255, 255, 255],
    hills: [
      [122, 168, 178],
      [72, 118, 137],
      [36, 66, 88],
    ],
  },
  {
    sky: [
      [214, 231, 199],
      [246, 246, 226],
    ],
    sun: [255, 250, 205],
    hills: [
      [141, 176, 122],
      [90, 132, 86],
      [48, 84, 63],
    ],
  },
  {
    sky: [
      [58, 74, 128],
      [148, 130, 178],
    ],
    sun: [255, 236, 179],
    hills: [
      [72, 74, 122],
      [46, 48, 88],
      [24, 26, 52],
    ],
  },
];

function crc32(buffer: Buffer): number {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = crc & 1 ? (crc >>> 1) ^ 0xedb88320 : crc >>> 1;
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type: string, data: Buffer): Buffer {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([length, body, crc]);
}

function encodePng(pixels: Buffer): Buffer {
  const header = Buffer.alloc(13);
  header.writeUInt32BE(WIDTH, 0);
  header.writeUInt32BE(HEIGHT, 4);
  header[8] = 8; // bit depth
  header[9] = 2; // truecolour
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", header),
    chunk("IDAT", deflateSync(pixels, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

function mix(from: Rgb, to: Rgb, ratio: number): Rgb {
  return [
    Math.round(from[0] + (to[0] - from[0]) * ratio),
    Math.round(from[1] + (to[1] - from[1]) * ratio),
    Math.round(from[2] + (to[2] - from[2]) * ratio),
  ];
}

/** Stable UUID-shaped name so re-seeding reuses the same file instead of piling up copies. */
function fileNameFor(seed: string): string {
  const hex = createHash("sha256").update(seed).digest("hex").slice(0, 32);
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}.png`;
}

export function generateImage(seed: string): GeneratedImage {
  const digest = createHash("sha256").update(seed).digest();
  const palette = PALETTES[digest[0] % PALETTES.length];
  const sunX = 90 + (digest[1] / 255) * (WIDTH - 180);
  const sunY = 60 + (digest[2] / 255) * 110;
  const sunRadius = 34 + (digest[3] / 255) * 26;
  const ridges = palette.hills.map((color, layer) => ({
    color,
    baseY: HEIGHT * (0.52 + layer * 0.14),
    amplitude: 18 + ((digest[4 + layer] ?? 0) / 255) * 46,
    frequency: 1 + ((digest[8 + layer] ?? 0) / 255) * 2.2,
    phase: ((digest[12 + layer] ?? 0) / 255) * Math.PI * 2,
  }));

  const pixels = Buffer.alloc(HEIGHT * (WIDTH * 3 + 1));
  for (let y = 0; y < HEIGHT; y += 1) {
    const rowStart = y * (WIDTH * 3 + 1);
    pixels[rowStart] = 0; // filter type: none
    for (let x = 0; x < WIDTH; x += 1) {
      let color = mix(palette.sky[0], palette.sky[1], y / HEIGHT);

      const distance = Math.hypot(x - sunX, y - sunY);
      if (distance < sunRadius) {
        color = mix(palette.sun, color, distance / sunRadius);
      }

      for (const ridge of ridges) {
        const crest =
          ridge.baseY -
          Math.sin((x / WIDTH) * Math.PI * ridge.frequency + ridge.phase) *
            ridge.amplitude;
        if (y >= crest) {
          color = mix(
            ridge.color,
            [255, 255, 255],
            ((y - crest) / HEIGHT) * 0.35,
          );
        }
      }

      const offset = rowStart + 1 + x * 3;
      pixels[offset] = color[0];
      pixels[offset + 1] = color[1];
      pixels[offset + 2] = color[2];
    }
  }

  const data = encodePng(pixels);
  return {
    fileName: fileNameFor(seed),
    mimeType: "image/png",
    byteSize: data.byteLength,
    data,
  };
}
