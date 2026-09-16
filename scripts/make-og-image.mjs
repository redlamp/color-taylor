/**
 * Builds the link-preview (Open Graph / Twitter card) image in public/ from the
 * Figma Community thumbnail.
 *
 *   node scripts/make-og-image.mjs
 *
 * (node, not bun - chromium.launch() hangs under bun on Windows. Same reason as
 * scripts/make-favicons.mjs, which this deliberately mirrors.)
 *
 * Source: figma/brand/og-1200x630.png - the export of "thumbnail / 1200x630 /
 * 40:21", node 181:54 in the Color Taylor Figma file, a sibling of the Community
 * thumbnail (49:3) laid out for Open Graph's own size. Sharing the one artwork is
 * the point: the Community listing and a link pasted into WhatsApp or Discord
 * should look like the same product.
 *
 * No crop and no scale. Until 2026-09-16 this cropped the 1920x1080 thumbnail
 * to 1.905:1 in code; the card now has its own designed frame at that size, so
 * nothing is trimmed and the script only compresses. Platforms crop toward
 * 1.91:1, so a card already that shape is shown as designed everywhere.
 *
 * JPEG, not PNG. The same frame encodes to 884 KB as PNG and 79 KB at quality
 * 0.92 - it is a continuous colour field, which is what JPEG is for. Size is not
 * cosmetic here: WhatsApp is the strictest consumer of these and quietly drops
 * previews for large images. WebP is smaller still (40 KB) but not every
 * scraper decodes it, and 79 KB is already far inside every limit.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = join(HERE, '..');
const SRC = join(REPO, 'figma', 'brand', 'og-1200x630.png');
const OUT = join(REPO, 'public', 'og-image.jpg');

// Keep these in step with the og:image:width / og:image:height tags in
// index.html - the meta values are read by scrapers that lay out the card
// before the image finishes downloading, so a mismatch shows as a reflow.
const WIDTH = 1200;
const HEIGHT = 630;
const QUALITY = 0.92;

const { chromium } = await import(
  pathToFileURL(join(REPO, 'node_modules/playwright/index.mjs')).href
);

const src = 'data:image/png;base64,' + readFileSync(SRC).toString('base64');

const browser = await chromium.launch();
const page = await browser.newPage();
await page.setContent('<!doctype html><body style="margin:0">');

const dataUrl = await page.evaluate(
  async ({ src, width, height, quality }) => {
    const img = new Image();
    img.src = src;
    await img.decode();

    // The source is already 1200x630, so this draws it 1:1. The centre crop
    // stays as a guard: a re-export at another size still comes out at the
    // declared size rather than stretched.
    const sh = Math.round((img.width * height) / width);
    const sy = Math.round((img.height - sh) / 2);

    const c = document.createElement('canvas');
    c.width = width;
    c.height = height;
    const ctx = c.getContext('2d');
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, 0, sy, img.width, sh, 0, 0, width, height);

    return c.toDataURL('image/jpeg', quality);
  },
  { src, width: WIDTH, height: HEIGHT, quality: QUALITY }
);

const buf = Buffer.from(dataUrl.split(',')[1], 'base64');
writeFileSync(OUT, buf);
console.log('wrote public/og-image.jpg (%dx%d, %d bytes)', WIDTH, HEIGHT, buf.length);

await browser.close();
