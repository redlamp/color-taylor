// Frame-rate bench for the picker, so two builds can be compared with numbers.
//
//   node scripts/fps-bench.mjs <url> [mode=hex] [runs=5]
//
// Modes - each exercises a different part of the pipeline:
//   hex   a circular drag inside the hexagon. Hue and saturation only, so the
//         field does not repaint; this measures the chain, the handles and the
//         React commit under vsync. Reports frame timing.
//   bar   a drag along the editor's Brightness slider. Every move changes
//         brightness, which repaints the WebGL field - this is the one that
//         exercises the shader. Reports frame timing.
//   sync  a burst of synthetic pointermove events dispatched back to back with
//         no vsync between them. Reports milliseconds per move: the handler
//         plus the render, with the compositor taken out of the picture. The
//         sensitive one for JS-side regressions.
//
// Absolute numbers depend on the machine and on headless Chromium's compositor,
// so only compare runs from the same session against each other, and never run
// two benches at once.
import { chromium } from '@playwright/test';

const [url, mode = 'hex', runsArg = '5'] = process.argv.slice(2);
const runs = Number(runsArg);
if (!url) { console.error('usage: node scripts/fps-bench.mjs <url> [hex|bar|sync] [runs]'); process.exit(2); }

const SAMPLE_MS = 2500;
const median = (xs) => { const s = [...xs].sort((a, b) => a - b); return s[Math.floor(s.length / 2)]; };

async function startSampling(page) {
  await page.evaluate((ms) => {
    window.__dts = []; window.__done = false;
    let last = performance.now(); const t0 = last;
    const tick = (now) => {
      window.__dts.push(now - last); last = now;
      if (now - t0 < ms) requestAnimationFrame(tick); else window.__done = true;
    };
    requestAnimationFrame(tick);
  }, SAMPLE_MS);
}

async function collect(page) {
  await page.waitForFunction(() => window.__done, null, { timeout: SAMPLE_MS + 5000 });
  const dts = (await page.evaluate(() => window.__dts)).slice(1);
  const s = [...dts].sort((a, b) => a - b);
  const sum = s.reduce((a, b) => a + b, 0);
  return {
    frames: s.length, fps: s.length / (sum / 1000),
    p50: s[Math.floor(s.length * 0.5)], p95: s[Math.floor(s.length * 0.95)],
    max: s[s.length - 1], long: s.filter((d) => d > 32).length,
  };
}

/** Move the mouse along a path over SAMPLE_MS, paced to real time. */
async function dragPath(page, points) {
  const steps = points.length, per = SAMPLE_MS / steps, start = Date.now();
  await page.mouse.move(points[0][0], points[0][1]);
  await page.mouse.down();
  for (let i = 1; i < steps; i++) {
    await page.mouse.move(points[i][0], points[i][1]);
    const wait = start + i * per - Date.now();
    if (wait > 0) await page.waitForTimeout(wait);
  }
  await page.mouse.up();
}

async function benchHex(page) {
  const box = await page.locator('#hex-canvas').boundingBox();
  const cx = box.x + box.width * 0.48, cy = box.y + box.height * 0.5, r = Math.min(box.width, box.height) * 0.28;
  const pts = Array.from({ length: 200 }, (_, i) => { const a = (i / 200) * Math.PI * 3; return [cx + r * Math.cos(a), cy - r * Math.sin(a)]; });
  await startSampling(page);
  await dragPath(page, pts);
  return collect(page);
}

async function benchBar(page) {
  const box = await page.locator('#slider-hsb-b-track').boundingBox();
  const y = box.y + box.height / 2;
  // Sweep the whole track four times so brightness changes on every move.
  const pts = Array.from({ length: 200 }, (_, i) => {
    const t = (i / 200) * 4, f = t % 2 < 1 ? t % 1 : 1 - (t % 1);
    return [box.x + 2 + f * (box.width - 4), y];
  });
  await startSampling(page);
  await dragPath(page, pts);
  return collect(page);
}

async function benchSync(page) {
  const box = await page.locator('#hex-canvas').boundingBox();
  const cx = box.x + box.width * 0.48, cy = box.y + box.height * 0.5, r = Math.min(box.width, box.height) * 0.28;
  await page.mouse.move(cx + r, cy);
  await page.mouse.down();
  const N = 400;
  const ms = await page.evaluate(async ({ cx, cy, r, N }) => {
    const t0 = performance.now();
    for (let i = 0; i < N; i++) {
      const a = (i / N) * Math.PI * 2;
      window.dispatchEvent(new PointerEvent('pointermove', {
        clientX: cx + r * Math.cos(a), clientY: cy - r * Math.sin(a),
        pointerId: 1, pointerType: 'mouse', buttons: 1, bubbles: true,
      }));
    }
    // Let React commit whatever the burst left pending before stopping the clock.
    await new Promise((res) => requestAnimationFrame(() => requestAnimationFrame(res)));
    return performance.now() - t0;
  }, { cx, cy, r, N });
  await page.mouse.up();
  return { moves: N, msPerMove: ms / N, totalMs: ms };
}

// BENCH_DPR=2 BENCH_HEADED=1 for a GPU-side comparison: per-pixel shader cost
// scales with canvas pixels, which a 1400x900 DPR-1 headless run understates.
const browser = await chromium.launch({ headless: !process.env.BENCH_HEADED });
const ctx = await browser.newContext({
  viewport: { width: 1600, height: 1000 },
  deviceScaleFactor: Number(process.env.BENCH_DPR ?? 1),
});
const page = await ctx.newPage();
await page.goto(url, { waitUntil: 'networkidle' });
await page.locator('#hex-canvas').waitFor({ timeout: 15000 });
await page.waitForTimeout(500);

const fn = { hex: benchHex, bar: benchBar, sync: benchSync }[mode];
if (!fn) { console.error(`unknown mode ${mode}`); process.exit(2); }
const results = [];
for (let i = 0; i < runs; i++) results.push(await fn(page));
await browser.close();

const key = (k) => median(results.map((r) => r[k]));
console.log(`${url}  mode=${mode}  runs=${runs}`);
if (mode === 'sync') {
  console.log(`  ${key('msPerMove').toFixed(3)} ms per move   (${key('totalMs').toFixed(0)} ms for ${results[0].moves})`);
} else {
  console.log(`  fps ${key('fps').toFixed(1)}   p50 ${key('p50').toFixed(2)} ms   p95 ${key('p95').toFixed(2)} ms   max ${key('max').toFixed(1)} ms   >32ms ${key('long')}`);
}
