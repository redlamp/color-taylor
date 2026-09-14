import { test, expect } from '@playwright/test';

/**
 * The Intro button is not advertised: the header shows it only when the URL
 * carries `?intro` (or `?intro=1`). The deck's own route stays reachable
 * either way - tests/presentation-deep-link.spec.ts covers that.
 */
test.describe('Intro button', () => {
  test('is hidden by default', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#picker-tools')).toBeVisible();
    await expect(page.locator('#intro-button')).toHaveCount(0);
  });

  test('shows under ?intro and ?intro=1, and opens the deck', async ({ page }) => {
    await page.goto('/?intro');
    await expect(page.locator('#intro-button')).toHaveText('Intro');
    await page.goto('/?intro=1');
    await expect(page.locator('#intro-button')).toBeVisible();
    await page.locator('#intro-button').click();
    await expect(page).toHaveURL(/#\/intro$/);
  });
});
