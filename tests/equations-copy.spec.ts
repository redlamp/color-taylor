import { test, expect } from '@playwright/test';
import { openSections } from './open-sections';

/**
 * The Hex and Normalized cells' underlined result doubles as a copy button.
 * Clipboard access needs an explicit grant per browser context - see
 * playwright.config.ts for why the rest of the suite runs off the shared
 * storage state instead of per-test permissions.
 */
test.describe('Equations panel copy buttons', () => {
  test.use({ permissions: ['clipboard-read', 'clipboard-write'] });

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.locator('#rgb-dot-green').waitFor();
    await openSections(page, ['equations-group']);

    // 10/11/12 -> #0A0B0C, a value distinct from the initial colour so a
    // stale clipboard read can't pass by accident.
    await page.locator('#slider-rgb-r-stepper input').fill('10');
    await page.locator('#slider-rgb-r-stepper input').press('Tab');
    await page.locator('#slider-rgb-g-stepper input').fill('11');
    await page.locator('#slider-rgb-g-stepper input').press('Tab');
    await page.locator('#slider-rgb-b-stepper input').fill('12');
    await page.locator('#slider-rgb-b-stepper input').press('Tab');
  });

  test('clicking the Hex result copies the hex string', async ({ page }) => {
    const button = page.getByRole('button', { name: 'Copy #0A0B0C' });
    await expect(button).toHaveText('#0A0B0C');

    await button.click();
    await expect(button).toHaveText('Copied');

    const clipboardText = await page.evaluate(() => navigator.clipboard.readText());
    expect(clipboardText).toBe('#0A0B0C');

    await expect(button).toHaveText('#0A0B0C', { timeout: 2000 });
  });

  test('clicking the Normalized result copies the rgb string', async ({ page }) => {
    const button = page.getByRole('button', { name: 'Copy color(srgb 0.039 0.043 0.047)' });
    await expect(button).toHaveText('color(srgb 0.039 0.043 0.047)');

    await button.click();
    await expect(button).toHaveText('Copied');

    const clipboardText = await page.evaluate(() => navigator.clipboard.readText());
    expect(clipboardText).toBe('color(srgb 0.039 0.043 0.047)');
  });

  test('the Hex result is reachable by keyboard and copies on Enter', async ({ page }) => {
    const button = page.getByRole('button', { name: 'Copy #0A0B0C' });
    await button.focus();
    await page.keyboard.press('Enter');

    const clipboardText = await page.evaluate(() => navigator.clipboard.readText());
    expect(clipboardText).toBe('#0A0B0C');
  });
});
