import { test, expect, type Page } from '@playwright/test';

/**
 * The hexagon's channel tooltips: named on hover, quiet while moving, and
 * back the moment the drag lets go - if the pointer is still on the thing it
 * was dragging. pointerenter never fires again for an element the pointer
 * never left, so the release has to re-read what is under it.
 */

const center = async (page: Page, sel: string) => {
  const b = (await page.locator(sel).boundingBox())!;
  return { x: b.x + b.width / 2, y: b.y + b.height / 2 };
};

const tipOpacity = (page: Page, ch: string) =>
  page.locator(`#stem-tip-${ch}`).evaluate((el) => getComputedStyle(el).opacity);

test.describe('Hexagon channel tooltips', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => { try { localStorage.clear();
    // The welcome panel is modal and would eat the first click of a test.
    localStorage.setItem('color-taylor-about-seen', '1'); } catch { /* ignore */ } });
    await page.setViewportSize({ width: 1400, height: 1000 });
    await page.goto('/');
    await page.locator('#rgb-dot-green').waitFor();
  });

  test('a hovered joint names every stem it drives', async ({ page }) => {
    const g = await center(page, '#rgb-dot-green');
    await page.mouse.move(g.x, g.y);
    // Mounted whether or not they are showing - they crossfade now, and a
    // pill that is only in the DOM while hovered has nothing to ease in from.
    // Which are showing is a question about opacity.
    await expect.poll(() => tipOpacity(page, 'r')).toBe('1');
    await expect.poll(() => tipOpacity(page, 'g')).toBe('1');
    expect(await tipOpacity(page, 'b')).toBe('0');
  });

  test('tooltips fade for the drag and return on release over the joint', async ({ page }) => {
    const g = await center(page, '#rgb-dot-green');
    await page.mouse.move(g.x, g.y);
    await page.mouse.down();
    await page.mouse.move(g.x + 10, g.y + 6, { steps: 4 });
    await page.waitForTimeout(400);
    expect(await tipOpacity(page, 'g')).toBe('0');

    // Release where the joint is now, which is under the pointer.
    await page.mouse.up();
    await page.waitForTimeout(400);
    await expect(page.locator('#stem-tip-g')).toHaveCount(1);
    expect(await tipOpacity(page, 'g')).toBe('1');
  });

  test('a release away from any stem or joint shows nothing', async ({ page }) => {
    const g = await center(page, '#rgb-dot-green');
    await page.mouse.move(g.x, g.y);
    await page.mouse.down();
    await page.mouse.move(g.x + 10, g.y + 6, { steps: 4 });
    // The joint follows the pointer, so to leave it behind the pointer has to
    // go where the joint cannot: well outside the hexagon, where it clamps.
    await page.mouse.move(g.x + 500, g.y + 300, { steps: 6 });
    await page.mouse.up();
    await page.waitForTimeout(400);
    for (const ch of ['r', 'g', 'b']) expect(await tipOpacity(page, ch)).toBe('0');
  });
});

test.describe('Impact highlights during the colour cycle', () => {
  test('sliders light as their values move; the chain does not', async ({ page }) => {
    await page.addInitScript(() => { try { localStorage.clear();
    // The welcome panel is modal and would eat the first click of a test.
    localStorage.setItem('color-taylor-about-seen', '1'); } catch { /* ignore */ } });
    await page.setViewportSize({ width: 1400, height: 1000 });
    await page.goto('/');
    await page.getByRole('button', { name: 'Play color animation' }).click();
    await page.waitForTimeout(1200);

    const lit = await page.evaluate(() =>
      [...document.querySelectorAll('[id^="slider-"][id$="-keyline"]')]
        .filter((el) => getComputedStyle(el).opacity === '1')
        .map((el) => el.id));
    expect(lit.length, 'at least one slider is moving').toBeGreaterThan(0);

    const halos = await page.evaluate(() =>
      [...document.querySelectorAll('[id^="impact-stem-"]')].map((el) => getComputedStyle(el).opacity));
    expect(halos.every((o) => o === '0'), 'no stem halos while playing').toBe(true);

    await page.getByRole('button', { name: 'Pause color animation' }).click();
  });
});
