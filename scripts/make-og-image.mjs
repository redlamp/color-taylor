/**
 * Builds the link-preview (Open Graph / Twitter card) image in public/ from the
 * Figma Community thumbnail.
 *
 *   node scripts/make-og-image.mjs
 *
 * (node, not bun - chromium.launch() hangs under bun on Windows. Same reason as
 * scripts/make-favicons.mjs, which this deliberately mirrors.)
 *
 * Source: figma/brand/cover-1920x1080.png - the export of "thumbnail / 1920x1080
 * / 16:9", node 49:3 in the Color Taylor Figma file. Sharing the one artwork is
 * the point: the Community listing and a link pasted into WhatsApp or Discord
 * should look like the same product.
 *
 * Two transforms, both deliberate:
 *
 * 1920x1080 is 16:9; Open Graph's de facto size is 1200x630, which is 1.905:1.
 * A centre crop of 36px off the top and bottom gets there, and at that scale it
 * only takes empty backdrop - the title block sits between y=210 and y=740, and
 * the hexagon already bleeds off three edges. Feeding a 16:9 image instead just
 * moves the crop to each platform, where it is centred anyway but unpredictable.
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
const SRC = join(REPO, 'figma', 'brand', 'cover-1920x1080.png');
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

    // Centre crop the source to the output aspect, then scale in one drawImage.
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
