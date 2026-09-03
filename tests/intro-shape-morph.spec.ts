import { test, expect, type Page } from '@playwright/test';

/**
 * The wheel morphing into the hexagon on slide 11 -> 12.
 *
 * The deck's argument at this point is that the wheel every picker shows is a
 * guess at a shape the cube actually has, so the two slides have to be the same
 * object seen twice, not two pictures. That is only true if one component draws
 * both, which is what this holds: the outline is a single polygon whose vertex
 * radii vary on the hexagon and are equal on the circle.
 *
 * Verified here rather than by eye because the preview pane never composites
 * frames - every measurement taken there is an intermediate value.
 */

const outline = (page: Page) => page.locator('#hex-outline');

/** Ratio of the outline's longest vertex radius to its shortest.
 *  1 is a circle, 2/sqrt(3) ~ 1.155 a hexagon. */
async function radiusSpread(page: Page): Promise<number> {
  return page.evaluate(() => {
    const el = document.querySelector('#hex-outline');
    if (!el) return NaN;
    const pts = (el.getAttribute('points') ?? '')
      .trim().split(/\s+/).map((p) => p.split(',').map(Number));
    const cx = pts.reduce((a, p) => a + p[0], 0) / pts.length;
    const cy = pts.reduce((a, p) => a + p[1], 0) / pts.length;
    const rs = pts.map(([x, y]) => Math.hypot(x - cx, y - cy));
    return Math.max(...rs) / Math.min(...rs);
  });
}

/** Opacity of the group holding an RGB stem. 0 on the wheel, 1 on the hexagon. */
async function chainOpacity(page: Page): Promise<number> {
  return page.evaluate(() => {
    const stem = document.querySelector('#hex-svg line[stroke^="#"]')?.closest('g');
    return stem ? Number(stem.getAttribute('opacity') ?? '1') : NaN;
  });
}

/** Opacity of the handle at the end of the chain - the selected colour. */
async function tipOpacity(page: Page): Promise<number> {
  return page.evaluate(() => {
    const g = document.querySelector('#rgb-dot-blue')?.closest('g');
    return g ? Number(g.getAttribute('opacity') ?? '1') : NaN;
  });
}

/**
 * Where the loop sits, as a fraction of the shape's edge along its own ray,
 * plus the values that are supposed to explain it. Measured in the SVG's user
 * units off the outline itself, so it holds at any rendered size.
 */
async function loop(page: Page): Promise<{ r: number; s: number; b: number; ring: string | null }> {
  return page.evaluate(() => {
    const dot = document.querySelector('#rgb-dot-blue') as SVGCircleElement;
    const out = document.querySelector('#hex-outline')!;
    const pts = (out.getAttribute('points') ?? '').trim().split(/\s+/).map((p) => p.split(',').map(Number));
    const ox = pts.reduce((a, p) => a + p[0], 0) / pts.length;
    const oy = pts.reduce((a, p) => a + p[1], 0) / pts.length;
    const cx = Number(dot.getAttribute('cx')), cy = Number(dot.getAttribute('cy'));
    const ang = Math.atan2(-(cy - oy), cx - ox);
    let best = Infinity, edge = NaN;
    for (const [px, py] of pts) {
      const a = Math.atan2(-(py - oy), px - ox);
      let d = Math.abs(a - ang);
      if (d > Math.PI) d = 2 * Math.PI - d;
      if (d < best) { best = d; edge = Math.hypot(px - ox, py - oy); }
    }
    const v = (id: string) => Number(document.querySelector(`#slider-hsb-${id}-track`)?.getAttribute('aria-valuenow') ?? '0');
    return { r: Math.hypot(cx - ox, cy - oy) / edge, s: v('s'), b: v('b'), ring: dot.getAttribute('stroke') };
  });
}

/** Set brightness from the deck's own bar, clicking `frac` of the way down. */
async function setBrightness(page: Page, frac: number) {
  const box = (await page.locator('rect[fill="url(#disc-b-gradient)"]').boundingBox())!;
  await page.mouse.click(box.x + box.width / 2, box.y + box.height * frac);
  await page.waitForTimeout(350);
}

async function settle(page: Page, hash: string) {
  await openAt(page, hash);
  // The colour cycle would move the loop under every measurement below. A pause
  // survives changing slides by design, so only click when it is still running.
  const pause = page.getByRole('button', { name: /Pause color animation/ });
  if (await pause.isVisible()) await pause.click();
  await page.waitForTimeout(900);
}

async function openAt(page: Page, hash: string) {
  await page.goto(`/${hash}`);
  await outline(page).waitFor({ timeout: 15000 });
}

test.describe('Wheel to hexagon morph', () => {
  test('slide 11 settles on a circle, slide 12 on a hexagon', async ({ page }) => {
    await openAt(page, '#/intro/11');
    await expect.poll(() => radiusSpread(page), { timeout: 5000 }).toBeLessThan(1.01);

    await openAt(page, '#/intro/12');
    await expect.poll(() => radiusSpread(page), { timeout: 5000 }).toBeCloseTo(2 / Math.sqrt(3), 2);
  });

  test('advancing passes through the shapes in between', async ({ page }) => {
    await openAt(page, '#/intro/11');
    await expect.poll(() => radiusSpread(page), { timeout: 5000 }).toBeLessThan(1.01);

    await page.keyboard.press('ArrowRight');

    // A cut would step straight from one to the other; a morph is sampleable
    // partway. Anything strictly between the two is proof of interpolation.
    const seen: number[] = [];
    for (let i = 0; i < 14; i++) {
      seen.push(await radiusSpread(page));
      await page.waitForTimeout(50);
    }
    const mid = seen.filter((v) => v > 1.02 && v < 1.14);
    expect(mid.length, `spread samples: ${seen.map((v) => v.toFixed(3)).join(' ')}`).toBeGreaterThan(0);

    await expect.poll(() => radiusSpread(page), { timeout: 5000 }).toBeCloseTo(2 / Math.sqrt(3), 2);
  });

  test('the wheel shows the handle alone, the hexagon the whole chain', async ({ page }) => {
    // The wheel has no geometry that corresponds to the RGB channels, so the
    // stems would be an explanation it cannot support. The handle is the
    // selected colour and every picker shows that, so it never leaves.
    await openAt(page, '#/intro/11');
    await page.waitForTimeout(900);
    await expect(page.locator('#rgb-dot-blue')).toBeVisible();
    expect(await chainOpacity(page), 'the wheel draws no stems').toBeLessThan(0.02);

    await openAt(page, '#/intro/12');
    await page.waitForTimeout(900);
    await expect.poll(() => chainOpacity(page), { timeout: 5000 }).toBeGreaterThan(0.98);
  });

  test('the stems fade in with the shape, and the handle never fades', async ({ page }) => {
    await openAt(page, '#/intro/11');
    await page.waitForTimeout(900);
    await page.keyboard.press('ArrowRight');

    const chain: number[] = [];
    const tip: number[] = [];
    for (let i = 0; i < 14; i++) {
      chain.push(await chainOpacity(page));
      tip.push(await tipOpacity(page));
      await page.waitForTimeout(50);
    }
    expect(chain.filter((v) => v > 0.05 && v < 0.95).length, `chain: ${chain.join(' ')}`).toBeGreaterThan(0);
    // The selected colour is not part of the argument the stems are making, so
    // it has nothing to fade in from.
    expect(Math.min(...tip), `tip: ${tip.join(' ')}`).toBeGreaterThan(0.99);
  });

  test('on the wheel the radius is saturation, and brightness does not move the loop', async ({ page }) => {
    // A wheel draws no cross-section, so brightness has nowhere to show and the
    // classic mapping is angle for hue, distance for saturation, nothing for
    // brightness. The hexagon *does* draw one, so there the loop sits at chroma.
    await settle(page, '#/intro/11');
    for (const frac of [0, 0.3, 0.5, 0.8]) {
      await setBrightness(page, frac);
      const m = await loop(page);
      expect(m.r, `wheel at b=${m.b}, s=${m.s}`).toBeCloseTo(m.s / 100, 2);
    }
  });

  test('on the hexagon the radius is chroma, which brightness does move', async ({ page }) => {
    await settle(page, '#/intro/12');
    for (const frac of [0, 0.3, 0.5, 0.8]) {
      await setBrightness(page, frac);
      const m = await loop(page);
      expect(m.r, `hexagon at b=${m.b}, s=${m.s}`).toBeCloseTo((m.s / 100) * (m.b / 100), 2);
    }
  });

  test('the loop is white with no chain, and the channel colour with one', async ({ page }) => {
    // A blue ring on an orange colour is a label for an explanation that is not
    // on screen. It earns the channel's colour when the stems arrive.
    await settle(page, '#/intro/11');
    expect((await loop(page)).ring?.toLowerCase()).toBe('#ffffff');

    await settle(page, '#/intro/12');
    expect((await loop(page)).ring?.toLowerCase()).toBe('#0000ff');
  });

  test('the deck brightness bar is not buried under the hexagon', async ({ page }) => {
    // It was: the component reserves width either side for a hue badge the deck
    // turns off, and that transparent padding sat on top of the bar, leaving it
    // dead across its whole width. Found while checking the loop's radius.
    await settle(page, '#/intro/11');
    const top = await page.evaluate(() => {
      const r = document.querySelector('rect[fill="url(#disc-b-gradient)"]')!.getBoundingClientRect();
      const el = document.elementFromPoint(r.x + r.width / 2, r.y + r.height * 0.7)!;
      return el.tagName.toLowerCase() + (el.id ? '#' + el.id : '');
    });
    expect(top).toBe('rect');
  });

  test('one picker draws both shapes', async ({ page }) => {
    // Two renderers is how the deck drifted from the app before - see
    // decision-intro-renders-the-real-picker. The field canvas is ColorHexagon's,
    // so its presence on the wheel slide is the assertion that there is one.
    await openAt(page, '#/intro/11');
    await expect(page.locator('#hex-outline')).toHaveCount(1);
    await expect(page.locator('canvas').first()).toBeVisible();
  });
});
