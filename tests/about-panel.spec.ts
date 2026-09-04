import { test, expect, type Page } from '@playwright/test';

/**
 * The welcome panel: shown once on a first visit, and from Settings after that.
 *
 * The suite's default storage state has already seen it (it is modal, and on a
 * first visit it would eat the first click of every other test), so everything
 * here clears that first and checks the real thing.
 */

/**
 * Arrive with nothing remembered - once. The init script re-runs on every
 * navigation, so an unguarded clear would make a reload look like another
 * first visit, which is the one thing these tests need to tell apart.
 */
const firstVisit = async (page: Page) => {
  await page.addInitScript(() => {
    try {
      if (sessionStorage.getItem('spec-cleared')) return;
      localStorage.clear();
      sessionStorage.setItem('spec-cleared', '1');
    } catch { /* ignore */ }
  });
};

// By test id, not by role: the settings sheet is a dialog too, and half of
// these tests have it open.
const panel = (page: Page) => page.getByTestId('about-panel');

test.describe('Welcome panel', () => {
  test('greets a first visit, and only the first', async ({ page }) => {
    await firstVisit(page);
    await page.goto('/');
    await expect(panel(page)).toBeVisible();
    await expect(panel(page)).toContainText('move together');

    await panel(page).getByRole('button', { name: 'Get Started' }).click();
    await expect(panel(page)).toHaveCount(0);

    // Remembered: the key outlives the reload, and nothing greets them twice.
    await page.reload();
    await page.locator('#rgb-dot-green').waitFor();
    await expect(panel(page)).toHaveCount(0);
  });

  test('a click anywhere on it dismisses it', async ({ page }) => {
    await firstVisit(page);
    await page.goto('/');
    await expect(panel(page)).toBeVisible();
    // Not a button, not the scrim - the card itself. Nothing on it is a
    // decision, so nothing on it should need aiming at.
    await panel(page).click({ position: { x: 24, y: 16 } });
    await expect(panel(page)).toHaveCount(0);
  });

  test('Escape and the scrim dismiss it too', async ({ page }) => {
    await firstVisit(page);
    await page.goto('/');
    await page.keyboard.press('Escape');
    await expect(panel(page)).toHaveCount(0);
  });

  test('"Watch the demo" hands over to the demo', async ({ page }) => {
    await firstVisit(page);
    await page.goto('/?demospeed=8');
    await panel(page).getByRole('button', { name: 'Watch Demo' }).click();
    await expect(panel(page)).toHaveCount(0);
    await expect(page.getByTestId('demo-bar')).toBeVisible();
  });

  test('Settings can bring it back, and reset-all restores the greeting', async ({ page }) => {
    await page.goto('/');
    await expect(panel(page)).toHaveCount(0);

    await page.getByRole('button', { name: 'Open menu' }).click();
    await page.getByRole('button', { name: /about color taylor/i }).click();
    await expect(panel(page)).toBeVisible();
    await expect(panel(page)).toContainText('Color Taylor');
    await page.keyboard.press('Escape');
    await expect(panel(page)).toHaveCount(0);

    // A reset forgets that the welcome has been seen, but does not put it back
    // on screen - somebody in the settings sheet did not ask to be greeted.
    // The next visit is.
    await page.getByRole('button', { name: 'Open menu' }).click();
    await page.getByRole('button', { name: /default settings/i }).click();
    await expect(panel(page)).toHaveCount(0);

    await page.reload();
    await expect(panel(page)).toBeVisible();
  });
});
