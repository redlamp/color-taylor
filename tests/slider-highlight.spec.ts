import { test, expect, type Page } from '@playwright/test';

/**
 * The white highlight each slider puts on the shape it explains: the brightness
 * bar lights the limit hexagon, the saturation bar fills the hue ray.
 *
 * Worth a spec because the tween case is the one that breaks quietly. Dragging
 * holds the highlight up with a pointer, but a click on a track or a marker has
 * no pointer to hold it - it runs on a timer sized to HSB_TWEEN_MS, and if that
 * timer is wrong the highlight either never appears or never leaves. Neither
 * throws, and both look plausible in a still screenshot.
 */

function clearStorage() {
  try {
    localStorage.removeItem('color-taylor-hsb');
  } catch { /* ignore */ }
}

const opacity = (page: Page, id: string) =>
  page.locator(`#${id}`).getAttribute('opacity');

test.describe('Slider highlights', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(clearStorage);
    await page.goto('/');
    await page.locator('#sat-bar').waitFor();
  });

  /**
   * The chain never lights itself, and the field counts as the chain.
   *
   * Dragging a stem or a joint keeps the chain quiet: the thing moving under
   * your hand is its own feedback, and the halos are for showing what it did
   * elsewhere. A press on the field moves the chain just as directly, but read
   * as `other` rather than as a hex hold, so it lit the whole chain - the one
   * gesture on the hexagon that looked different from the rest.
   *
   * `holdKeyOf` walks to the nearest `[data-hold]`, so tagging the svg catches
   * only what has no tag of its own; every handle and both bars still win.
   */
  test('dragging the field leaves the chain quiet, the same as a handle does', async ({ page }) => {
    const chainLit = () => page.evaluate(() =>
      [...document.querySelectorAll('[id^="impact-stem-"], [id^="impact-dot-"]')]
        .filter((el) => Number(getComputedStyle(el).opacity) > 0.5).length);
    const sliderLit = () => page.evaluate(() =>
      Number(getComputedStyle(document.querySelector('#slider-rgb-r-keyline')!).opacity) > 0.5);

    const drag = async (from: { x: number; y: number }, dx: number, dy: number) => {
      await page.mouse.move(from.x, from.y);
      await page.mouse.down();
      for (let i = 1; i <= 12; i++) await page.mouse.move(from.x + (dx / 12) * i, from.y + (dy / 12) * i);
    };

    // The baseline: a handle. Held, so the chain stays dark and the bank lights.
    const tip = await page.evaluate(() => {
      const dots = document.querySelectorAll('[data-joint]');
      const r = dots[dots.length - 1].getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    });
    await drag(tip, 48, 36);
    expect(await chainLit(), 'handle drag').toBe(0);
    expect(await sliderLit()).toBe(true);
    await page.mouse.up();
    await page.waitForTimeout(700);

    // And the field, away from any handle, has to look the same.
    const field = await page.evaluate(() => {
      const r = document.querySelector('#hex-svg')!.getBoundingClientRect();
      return { x: r.left + r.width * 0.3, y: r.top + r.height * 0.62 };
    });
    await drag(field, 48, -36);
    expect(await chainLit(), 'field drag').toBe(0);
    expect(await sliderLit()).toBe(true);
    await page.mouse.up();
  });

  /**
   * Nor do the channel tooltips, for the same reason. A drag across the field
   * pulls the chain along under the cursor, so it crosses its own stems - and
   * a gesture that is not asking what a stem is was getting answered anyway,
   * over the thing it was moving.
   */
  test('dragging the field raises no channel tooltips', async ({ page }) => {
    const shown = () => page.evaluate(() =>
      [...document.querySelectorAll('[id^="stem-tip-"]')]
        .filter((el) => Number(getComputedStyle(el).opacity) > 0.5).length);

    const svg = (await page.locator('#hex-svg').boundingBox())!;
    const from = { x: svg.x + svg.width * 0.44 - 130, y: svg.y + svg.height * 0.5 + 90 };
    await page.mouse.move(from.x, from.y);
    await page.mouse.down();
    let raised = 0;
    // Straight through the chain, sampling as it goes rather than at the end.
    for (let i = 1; i <= 24; i++) {
      await page.mouse.move(from.x + i * 10, from.y - i * 6);
      raised += await shown();
    }
    await page.mouse.up();
    expect(raised).toBe(0);

    // The tooltips are suppressed, not broken: a hover with no drag still shows.
    await page.waitForTimeout(400);
    const stem = await page.evaluate(() => {
      const r = document.querySelector('[data-stem]')!.getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    });
    await page.mouse.move(stem.x, stem.y);
    await expect.poll(shown, { timeout: 2000 }).toBeGreaterThan(0);
  });

  test('a saturation marker click lights the hue ray for the tween, then lets it fade', async ({ page }) => {
    expect(await opacity(page, 'hue-line-fill')).toBe('0');

    await page.getByRole('button', { name: 'Set saturation to 100' }).click();

    // Up during the tween...
    await expect
      .poll(() => opacity(page, 'hue-line-fill'), { timeout: 1000 })
      .toBe('1');

    // ...and released once it lands. The element stays mounted at 0 rather than
    // unmounting, which is what gives it something to fade out from.
    await expect
      .poll(() => opacity(page, 'hue-line-fill'), { timeout: 4000 })
      .toBe('0');
    await expect(page.locator('#hue-line-fill')).toHaveCount(1);
  });

  test('a brightness marker click lights the limit hexagon for the tween', async ({ page }) => {
    expect(await opacity(page, 'hex-brightness-limit-active')).toBe('0');

    await page.getByRole('button', { name: 'Set brightness to 50' }).click();

    await expect
      .poll(() => opacity(page, 'hex-brightness-limit-active'), { timeout: 1000 })
      .toBe('1');
    await expect
      .poll(() => opacity(page, 'hex-brightness-limit-active'), { timeout: 4000 })
      .toBe('0');
  });

  test('the highlight fades out rather than blinking, and does so slower than it arrives', async ({ page }) => {
    const ray = page.locator('#hue-line-fill');

    await page.getByRole('button', { name: 'Set saturation to 100' }).click();
    await expect.poll(() => opacity(page, 'hue-line-fill'), { timeout: 1000 }).toBe('1');
    // Arriving is quick; leaving is not. Asymmetric by design - a highlight owes
    // instant feedback going in and a soft landing coming out.
    expect(await ray.getAttribute('class')).toContain('duration-150');

    await expect.poll(() => opacity(page, 'hue-line-fill'), { timeout: 4000 }).toBe('0');
    expect(await ray.getAttribute('class')).toContain('duration-500');
  });

  test('each slider lights only its own shape', async ({ page }) => {
    await page.getByRole('button', { name: 'Set brightness to 50' }).click();
    await expect
      .poll(() => opacity(page, 'hex-brightness-limit-active'), { timeout: 1000 })
      .toBe('1');
    expect(await opacity(page, 'hue-line-fill')).toBe('0');
  });
});
