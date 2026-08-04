/**
 * Generates the Community listing assets from the same hexagon math the app
 * draws, so the icon cannot drift from the product.
 *
 *   bun run figma/brand/make-assets.mjs
 *
 * Outputs icon-128.png and cover-1920x960.png next to this file. Both are the
 * sizes Figma's publish modal asks for. Committed so the listing can be
 * refreshed without a browser, but regenerate rather than editing by hand.
 *
 * Needs Playwright, which the repo already has for the e2e specs - the canvas
 * work happens in a real browser rather than pulling in an image library.
 */
import { writeFileSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));
const { chromium } = await import(
  pathToFileURL(join(HERE, '../../node_modules/playwright/index.mjs')).href
);

/**
 * Drawn per-pixel rather than as SVG gradients: the field is a true HSV
 * hexagon - hue from the angle, saturation from the distance as a fraction of
 * the hexagon's own radius at that angle - and SVG has no mesh gradient that
 * reproduces it. Six triangles with two-stop gradients get close but band
 * visibly along the seams at cover-art size.
 */
const DRAW = function (w, h, cx, cy, R, bg, radius) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d');

  if (bg) {
    ctx.fillStyle = bg;
    if (radius) {
      ctx.beginPath();
      ctx.roundRect(0, 0, w, h, radius);
      ctx.fill();
    } else {
      ctx.fillRect(0, 0, w, h);
    }
  }

  const img = ctx.createImageData(w, h);
  const d = img.data;
  const COS30 = Math.cos(Math.PI / 6);
  const SEG = Math.PI / 3;

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      // +y is down on a canvas, so negate to get the usual math angle. That
      // puts yellow up-and-right and green up-and-left, as the app draws it.
      const dx = x + 0.5 - cx;
      const dy = -(y + 0.5 - cy);
      const dist = Math.hypot(dx, dy);
      let a = Math.atan2(dy, dx);
      if (a < 0) a += Math.PI * 2;

      // Radius of a regular hexagon at this angle: vertices sit at 0, 60, ...
      const rHex = (R * COS30) / Math.cos((a % SEG) - SEG / 2);
      const s = dist / rHex;
      if (s > 1) continue;

      // Antialias the single pixel ring at the boundary.
      const alpha = s > 1 - 1.4 / rHex ? Math.max(0, (1 - s) * rHex / 1.4) : 1;

      const hue = (a * 180) / Math.PI;
      const hp = hue / 60;
      const cc = s;
      const xx = cc * (1 - Math.abs((hp % 2) - 1));
      let r = 0, g = 0, b = 0;
      if (hp < 1) { r = cc; g = xx; }
      else if (hp < 2) { r = xx; g = cc; }
      else if (hp < 3) { g = cc; b = xx; }
      else if (hp < 4) { g = xx; b = cc; }
      else if (hp < 5) { r = xx; b = cc; }
      else { r = cc; b = xx; }
      const m = 1 - s; // value stays 1, so the centre is white

      const i = (y * w + x) * 4;
      d[i] = Math.round((r + m) * 255);
      d[i + 1] = Math.round((g + m) * 255);
      d[i + 2] = Math.round((b + m) * 255);
      d[i + 3] = Math.round(alpha * 255);
    }
  }

  const layer = document.createElement('canvas');
  layer.width = w;
  layer.height = h;
  layer.getContext('2d').putImageData(img, 0, 0);
  ctx.drawImage(layer, 0, 0);
  return c;
};

const browser = await chromium.launch();
const page = await browser.newPage();
await page.setContent('<!doctype html><body style="margin:0">');

const save = (name, dataUrl) => {
  writeFileSync(join(HERE, name), Buffer.from(dataUrl.split(',')[1], 'base64'));
  console.log('wrote %s', name);
};

// --- icon: 128x128, hexagon centred on a neutral dark tile -----------------
save('icon-128.png', await page.evaluate(({ src }) => {
  const draw = new Function('return ' + src)();
  const c = draw(128, 128, 64, 64, 52, '#2c2c2c', 28);
  return c.toDataURL('image/png');
}, { src: DRAW.toString() }));

// --- cover: 1920x960, hexagon left, wordmark right -------------------------
save('cover-1920x960.png', await page.evaluate(({ src }) => {
  const draw = new Function('return ' + src)();
  const W = 1920, H = 960;
  const c = draw(W, H, 640, H / 2, 330, '#2c2c2c', 0);
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#ffffff';
  ctx.font = '600 104px Inter, "Segoe UI", system-ui, sans-serif';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText('Color Taylor', 1080, 452);
  ctx.fillStyle = 'rgba(255,255,255,0.62)';
  ctx.font = '400 42px Inter, "Segoe UI", system-ui, sans-serif';
  ctx.fillText('See how RGB, HSB and HSL', 1080, 536);
  ctx.fillText('describe the same color.', 1080, 592);
  return c.toDataURL('image/png');
}, { src: DRAW.toString() }));

await browser.close();
