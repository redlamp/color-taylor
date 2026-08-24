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
