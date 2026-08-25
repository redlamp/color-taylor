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

  test('one picker draws both shapes', async ({ page }) => {
    // Two renderers is how the deck drifted from the app before - see
    // decision-intro-renders-the-real-picker. The field canvas is ColorHexagon's,
    // so its presence on the wheel slide is the assertion that there is one.
    await openAt(page, '#/intro/11');
    await expect(page.locator('#hex-outline')).toHaveCount(1);
    await expect(page.locator('canvas').first()).toBeVisible();
  });
});
