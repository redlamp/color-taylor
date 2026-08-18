import { test, expect } from '@playwright/test';

/**
 * The settings sheet's interaction contract.
 *
 * There was no coverage here at all while the panel was a hand-rolled fixed
 * <aside>, which is part of how it kept a tabbable-but-aria-hidden subtree, no
 * focus return, and desktop-only-missing click-outside. These are the
 * behaviours the base-ui Dialog is relied on for, so they are worth pinning:
 * a future shell swap that silently drops one should fail here.
 */

const gear = (page: import('@playwright/test').Page) =>
  page.getByRole('button', { name: 'Open settings' });

const sheet = (page: import('@playwright/test').Page) =>
  page.getByRole('dialog');

test.describe('Settings sheet', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await gear(page).waitFor();
  });

  test('opens from the gear and is a named dialog', async ({ page }) => {
    await expect(sheet(page)).toBeHidden();
    await gear(page).click();
    await expect(sheet(page)).toBeVisible();
    // The <h2> is the dialog's accessible name, not just decoration.
    await expect(sheet(page)).toHaveAccessibleName(/settings/i);
  });

  test('Escape closes it', async ({ page }) => {
    await gear(page).click();
    await expect(sheet(page)).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(sheet(page)).toBeHidden();
  });

  test('clicking outside closes it — including on desktop', async ({ page }) => {
    // The old panel only dismissed on outside-click below the md breakpoint;
    // on desktop there was no way out but the X or Escape.
    await page.setViewportSize({ width: 1280, height: 900 });
    await gear(page).click();
    await expect(sheet(page)).toBeVisible();
    // Far left, clear of the sheet on the right edge.
    await page.mouse.click(40, 500);
    await expect(sheet(page)).toBeHidden();
  });

  test('focus moves into the sheet and returns to the gear on close', async ({ page }) => {
    await gear(page).click();
    await expect(sheet(page)).toBeVisible();
    await expect(sheet(page).locator(':focus')).toHaveCount(1);
    await page.keyboard.press('Escape');
    await expect(sheet(page)).toBeHidden();
    await expect(gear(page)).toBeFocused();
  });

  test('its controls are not reachable by keyboard while closed', async ({ page }) => {
    // The regression this replaces: aria-hidden={!open} on a subtree that
    // stayed in the tab order, so a screen-reader user could focus controls
    // inside a panel the same attribute claimed did not exist.
    await expect(page.getByRole('switch', { name: 'Toggle theme' })).toHaveCount(0);
  });

  test('the theme switch inside works', async ({ page }) => {
    await gear(page).click();
    const themeSwitch = sheet(page).getByRole('switch', { name: 'Toggle theme' });
    const before = await themeSwitch.getAttribute('aria-checked');
    await themeSwitch.click();
    await expect(themeSwitch).not.toHaveAttribute('aria-checked', before ?? '');
  });

  test('"Reset all settings" returns the colour to the default', async ({ page }) => {
    const hexInput = page.locator('input[value^="#"]').first();
    await expect(hexInput).toHaveValue('#4F95FF');

    // Move the colour somewhere else and let it persist.
    await hexInput.fill('#FF0000');
    await hexInput.press('Enter');
    await expect(hexInput).toHaveValue('#FF0000');

    await gear(page).click();
    await sheet(page).getByRole('button', { name: /reset all settings/i }).click();

    // Tweened, not snapped, so allow it to arrive.
    await expect(hexInput).toHaveValue('#4F95FF', { timeout: 4000 });
  });

  test('audio section appears only once audio is enabled, and its switches are named', async ({ page }) => {
    await gear(page).click();
    await expect(sheet(page).getByRole('button', { name: 'Audio', exact: true })).toHaveCount(0);

    await sheet(page).getByRole('switch', { name: 'Toggle audio features' }).click();

    // Named switches: the Audio copies used to be bare role="switch" buttons
    // with no accessible name at all.
    await expect(sheet(page).getByRole('switch', { name: 'Toggle color synth' })).toBeVisible();
  });
});
