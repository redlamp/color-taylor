import { test, expect, type Page } from '@playwright/test';

/**
 * Opening the deck at a given slide.
 *
 * This was broken for the deck's whole life and nothing caught it: the shell
 * *wrote* the slide into the hash on every change and never read it back, so
 * every link anyone copied out of their address bar silently rewound to slide
 * one. It looks like a working link right up until someone follows it, which is
 * exactly the shape of bug a test is for - and it matters more now `/intro` is
 * a link people are handed.
 */

const counter = (page: Page) => page.getByText(/^\d+ \/ \d+$/);

async function openAt(page: Page, hash: string) {
  await page.goto(`/${hash}`);
  await page.locator('[role="slider"]').first().waitFor({ timeout: 15000 });
}

test.describe('Intro deep links', () => {
  test('opens on the slide the URL names', async ({ page }) => {
    await openAt(page, '#/intro/11');
    await expect(counter(page)).toHaveText('12 / 15');
    await expect(page.getByText('The Color Wheel')).toBeVisible();
  });

  test('accepts a slide id as well as an index', async ({ page }) => {
    // Costs three lines and means links shared today survive #79 moving the
    // route to ids.
    await openAt(page, '#/intro/12-hexagon');
    await expect(counter(page)).toHaveText('13 / 15');
    await expect(page.getByText('The Color Hexagon')).toBeVisible();
    // Normalised back to the canonical form the deck writes.
    await expect.poll(() => page.evaluate(() => location.hash)).toBe('#/intro/12');
  });

  test('bare #/intro still starts at the beginning', async ({ page }) => {
    await openAt(page, '#/intro');
    await expect(counter(page)).toHaveText('1 / 15');
  });

  test('an out-of-range slide clamps instead of blanking', async ({ page }) => {
    // Hand-edited URLs and links to slides that no longer exist should land at
    // the end of the deck, not on an empty screen.
    await openAt(page, '#/intro/999');
    await expect(counter(page)).toHaveText('15 / 15');
  });

  test('changing the hash moves the deck', async ({ page }) => {
    await openAt(page, '#/intro/11');
    await page.evaluate(() => { location.hash = '#/intro/3'; });
    await expect(counter(page)).toHaveText('4 / 15');
    await expect(page.getByText('16 Colors')).toBeVisible();
  });
});
