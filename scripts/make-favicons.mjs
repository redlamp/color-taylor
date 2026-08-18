/**
 * Builds the favicon set in public/ from the three source PNGs in figma/brand/.
 *
 *   node scripts/make-favicons.mjs
 *
 * (node, not bun - chromium.launch() hangs under bun on Windows.)
 *
 * Sources, all exported from the Color Taylor Figma file:
 *
 *   favicon-src-16.png   node 94:600 - hexagon only, legs removed
 *   favicon-src-32.png   node 94:576 - hexagon only, legs removed
 *   logo-512.png         node 59:179 - the full logo, legs included
 *
 * The two small ones exist because the logo's three handles and their
 * connecting lines dissolve below about 32px - measured, not assumed. The .ico
 * therefore carries *different artwork per size*, which is the one thing the
 * format is genuinely good at.
 *
 * No SVG favicon. Figma's SVG export of these frames is 330 KB because the
 * hexagon is a continuous HSV field baked to a bitmap, and hand-authoring one
 * would mean approximating a conic sweep with gradient slices - SVG has no
 * conic gradient. Raster is the honest format for this artwork.
 *
 * Resizing runs through a real browser canvas via Playwright, already a
 * dependency for the e2e specs, rather than adding an image library.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = join(HERE, '..');
const BRAND = join(REPO, 'figma', 'brand');
const OUT = join(REPO, 'public');

const { chromium } = await import(
  pathToFileURL(join(REPO, 'node_modules/playwright/index.mjs')).href
);

const dataUrl = (p) => 'data:image/png;base64,' + readFileSync(p).toString('base64');
const src16 = dataUrl(join(BRAND, 'favicon-src-16.png'));
const src32 = dataUrl(join(BRAND, 'favicon-src-32.png'));
const src512 = dataUrl(join(BRAND, 'logo-512.png'));

const browser = await chromium.launch();
const page = await browser.newPage();
await page.setContent('<!doctype html><body style="margin:0">');

/**
 * @param {string} src        source data URL
 * @param {number} size       output edge
 * @param {number} inset      fraction of the edge left empty on each side
 * @param {string|null} bg    opaque backdrop, or null to keep alpha
 */
async function render(src, size, inset = 0, bg = null) {
  const url = await page.evaluate(async ({ src, size, inset, bg }) => {
    const img = new Image();
    img.src = src;
    await img.decode();
    const c = document.createElement('canvas');
    c.width = size;
    c.height = size;
    const ctx = c.getContext('2d');
    if (bg) {
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, size, size);
    }
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    const pad = Math.round(size * inset);
    ctx.drawImage(img, pad, pad, size - pad * 2, size - pad * 2);
    return c.toDataURL('image/png');
  }, { src, size, inset, bg });
  return Buffer.from(url.split(',')[1], 'base64');
}

/**
 * The tile's own colour, read off the source rather than hardcoded.
 *
 * Taken as the darkest fully-opaque pixel in the image. Sampling a fixed point
 * near the top edge does not work: the tile carries a rim light, so a few
 * pixels in from the edge returns that highlight (rgb(92,92,92)) rather than
 * the near-black fill, and the flattened corners came out visibly grey. The
 * tile is by some distance the darkest thing here - the hexagon is saturated
 * and bright throughout - so "darkest" identifies it without a magic
 * coordinate that breaks whenever the artwork is redrawn.
 */
const tile = await page.evaluate(async (src) => {
  const img = new Image();
  img.src = src;
  await img.decode();
  const c = document.createElement('canvas');
  c.width = c.height = img.width;
  const ctx = c.getContext('2d');
  ctx.drawImage(img, 0, 0);
  const d = ctx.getImageData(0, 0, img.width, img.height).data;
  let best = null;
  let bestLum = Infinity;
  for (let i = 0; i < d.length; i += 4) {
    if (d[i + 3] !== 255) continue;
    const lum = 0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2];
    if (lum < bestLum) {
      bestLum = lum;
      best = [d[i], d[i + 1], d[i + 2]];
    }
  }
  return best ? `rgb(${best[0]},${best[1]},${best[2]})` : '#000';
}, src512);

/**
 * ICO container. Each entry is just a PNG, which every browser in use has
 * understood for well over a decade - no BMP/AND-mask encoding needed.
 */
function buildIco(images) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // 1 = icon
  header.writeUInt16LE(images.length, 4);

  const dir = Buffer.alloc(16 * images.length);
  let offset = header.length + dir.length;
  images.forEach((img, i) => {
    const at = i * 16;
    dir.writeUInt8(img.size >= 256 ? 0 : img.size, at + 0); // 0 means 256
    dir.writeUInt8(img.size >= 256 ? 0 : img.size, at + 1);
    dir.writeUInt8(0, at + 2); // palette size
    dir.writeUInt8(0, at + 3); // reserved
    dir.writeUInt16LE(1, at + 4); // colour planes
    dir.writeUInt16LE(32, at + 6); // bits per pixel
    dir.writeUInt32LE(img.data.length, at + 8);
    dir.writeUInt32LE(offset, at + 12);
    offset += img.data.length;
  });

  return Buffer.concat([header, dir, ...images.map((i) => i.data)]);
}

const save = (name, buf) => {
  writeFileSync(join(OUT, name), buf);
  console.log('wrote %s (%d bytes)', name, buf.length);
};

// --- favicon.ico: purpose-built artwork at each size ------------------------
const ico16 = await render(src16, 16);
const ico32 = await render(src32, 32);
save('favicon.ico', buildIco([
  { size: 16, data: ico16 },
  { size: 32, data: ico32 },
]));

// PNG siblings, for browsers that prefer an explicit rel=icon over /favicon.ico.
save('favicon-16.png', ico16);
save('favicon-32.png', ico32);

// --- apple-touch-icon: 180, opaque -----------------------------------------
// iOS composites any transparency onto black and applies its own rounded mask,
// so this is flattened onto the tile colour and left full-bleed.
save('apple-touch-icon.png', await render(src512, 180, 0, tile));

// --- PWA ------------------------------------------------------------------
save('icon-192.png', await render(src512, 192));
save('icon-512.png', await render(src512, 512));

// Maskable: Android crops to a launcher-chosen shape, and only the middle 80%
// is guaranteed to survive. Inset by 10% a side and back it with the tile
// colour so the crop never bites into the hexagon.
save('icon-maskable-512.png', await render(src512, 512, 0.1, tile));

console.log('tile colour sampled as %s', tile);
await browser.close();
