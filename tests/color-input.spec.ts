import { test, expect } from '@playwright/test';
import { openSections } from './open-sections';

/**
 * Direct input must beat an animation that is already running.
 *
 * A tween is a requestAnimationFrame loop calling setHsb every frame, so a
 * handler that only sets state loses the argument: the loop overwrites it on the
 * next frame and still lands on its own target up to a second later. Every
 * interaction handler stopped the play-button colour cycle, but none of them
 * cancelled a tween - so typing a hex or dragging a slider during the tween that
 * a swatch click starts was silently discarded. The value appeared, then snapped
 * back to wherever the tween was going.
 *
 * Nothing threw and nothing logged; the only symptom was losing your input.
 */

function clearStorage() {
  try { localStorage.clear();
    // The welcome panel is modal and would eat the first click of a test.
    localStorage.setItem('color-taylor-about-seen', '1'); } catch { /* ignore */ }
}

test.describe('Input during a tween', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(clearStorage);
    await page.goto('/');
    await openSections(page);
    await page.locator('#saved-colors [data-saved-idx="0"]').waitFor();
  });

  test('a typed hex wins over a tween in flight', async ({ page }) => {
    const hexInput = page.getByLabel('Hex color value');

    // Clicking a saved swatch starts a 1s tween towards red.
    await page.locator('#saved-colors [data-saved-idx="0"]').click();
    await page.waitForTimeout(120);

    await hexInput.click();
    await hexInput.fill('123456');
    await hexInput.blur();

    // Well past the tween's 1s, so a surviving tween would have won by now.
    await page.waitForTimeout(1600);
    // Not exactly 123456: the HSB round-trip is lossy by a unit at this
    // saturation. The assertion that matters is that it is not red.
    await expect(hexInput).toHaveValue(/^#1234[0-9a-f]{2}$/i);
  });

  test('a slider drag wins over a tween in flight', async ({ page }) => {
    await page.locator('#saved-colors [data-saved-idx="2"]').click(); // green
    await page.waitForTimeout(120);

    const track = page.locator('#slider-rgb-r-track');
    const box = (await track.boundingBox())!;
    await page.mouse.click(box.x + box.width * 0.5, box.y + box.height / 2);

    await page.waitForTimeout(1600);
    // Red was pushed to roughly mid-range, which pure green could never be.
    const r = Number(await track.getAttribute('aria-valuenow'));
    expect(r).toBeGreaterThan(60);
    expect(r).toBeLessThan(200);
  });
});
