import { test, expect } from '@playwright/test';
import { openSections } from './open-sections';

/**
 * The settings sheet's interaction contract.
 *
 * There was no coverage here at all while the panel was a hand-rolled fixed
 * <aside>, which is part of how it kept a tabbable-but-aria-hidden subtree, no
 * focus return, and desktop-only-missing click-outside. These are the
 * behaviours the base-ui Dialog is relied on for, so they are worth pinning:
 * a future shell swap that silently drops one should fail here.
 */

const menuButton = (page: import('@playwright/test').Page) =>
  page.getByRole('button', { name: 'Open menu' });

const sheet = (page: import('@playwright/test').Page) =>
  page.getByRole('dialog');

test.describe('Settings sheet', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await menuButton(page).waitFor();
    await openSections(page, ['hex-group']);
  });

  test('opens from the menu button and is a named dialog', async ({ page }) => {
    await expect(sheet(page)).toBeHidden();
    await menuButton(page).click();
    await expect(sheet(page)).toBeVisible();
    // The <h2> is the dialog's accessible name, not just decoration.
    await expect(sheet(page)).toHaveAccessibleName(/menu/i);
  });

  test('Escape closes it', async ({ page }) => {
    await menuButton(page).click();
    await expect(sheet(page)).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(sheet(page)).toBeHidden();
  });

  test('clicking outside closes it — including on desktop', async ({ page }) => {
    // The old panel only dismissed on outside-click below the md breakpoint;
    // on desktop there was no way out but the X or Escape.
    await page.setViewportSize({ width: 1280, height: 900 });
    await menuButton(page).click();
    await expect(sheet(page)).toBeVisible();
    // Far left, clear of the sheet on the right edge.
    await page.mouse.click(40, 500);
    await expect(sheet(page)).toBeHidden();
  });

  test('focus moves into the sheet and returns to the menu button on close', async ({ page }) => {
    await menuButton(page).click();
    await expect(sheet(page)).toBeVisible();
    await expect(sheet(page).locator(':focus')).toHaveCount(1);
    await page.keyboard.press('Escape');
    await expect(sheet(page)).toBeHidden();
    await expect(menuButton(page)).toBeFocused();
  });

  test('its controls are not reachable by keyboard while closed', async ({ page }) => {
    // The regression this replaces: aria-hidden={!open} on a subtree that
    // stayed in the tab order, so a screen-reader user could focus controls
    // inside a panel the same attribute claimed did not exist.
    await expect(page.getByRole('switch', { name: 'Toggle theme' })).toHaveCount(0);
  });

  test('the theme switch inside works', async ({ page }) => {
    await menuButton(page).click();
    const themeSwitch = sheet(page).getByRole('switch', { name: 'Toggle theme' });
    const before = await themeSwitch.getAttribute('aria-checked');
    await themeSwitch.click();
    await expect(themeSwitch).not.toHaveAttribute('aria-checked', before ?? '');
  });

  test('"Default Settings" returns the colour to the default', async ({ page }) => {
    const hexInput = page.locator('input[value^="#"]').first();
    await expect(hexInput).toHaveValue('#4F95FF');

    // Move the colour somewhere else and let it persist.
    await hexInput.fill('#FF0000');
    await hexInput.press('Enter');
    await expect(hexInput).toHaveValue('#FF0000');

    await menuButton(page).click();
    await sheet(page).getByRole('button', { name: /default settings/i }).click();

    // Tweened, not snapped, so allow it to arrive.
    await expect(hexInput).toHaveValue('#4F95FF', { timeout: 4000 });
  });

  /**
   * Which sections are open is show/hide state like the slider banks and the
   * blend mode, both of which the reset already returned. It is not persisted -
   * closing a section once should not close it forever - but it does outlive
   * the components, so the reset has to reach in and clear it.
   *
   * Color Editor defaults open and Recent defaults closed, so moving both and
   * resetting checks that a default is restored in each direction rather than
   * everything simply being opened or shut.
   */
  test('"Default Settings" restores which sections are open', async ({ page }) => {
    // The grid row the section animates, whose height is 0 while collapsed.
    const height = (id: string) => async () =>
      (await page.locator(`#${id}-content`).locator('..').boundingBox())?.height ?? -1;
    // The trigger by what it controls, rather than by its title text: the
    // header holds the section's own action buttons beside it.
    const toggle = (id: string) => page.locator(`[aria-controls="${id}-content"]`);

    await toggle('color-editor-group').click();
    await expect.poll(height('color-editor-group')).toBe(0);
    await toggle('recent-colors').click();
    await expect.poll(height('recent-colors')).toBeGreaterThan(0);

    await menuButton(page).click();
    await sheet(page).getByRole('button', { name: /default settings/i }).click();

    await expect.poll(height('color-editor-group'), { timeout: 4000 }).toBeGreaterThan(0);
    await expect.poll(height('recent-colors'), { timeout: 4000 }).toBe(0);
  });

  test('the audio section is always there; its controls arrive with the feature', async ({ page }) => {
    await menuButton(page).click();
    // The section holds the switch that brings the feature into existence, so
    // it cannot be conditional on the feature - it used to be, which put that
    // switch under Display and left no Audio heading to look under.
    await expect(sheet(page).getByRole('button', { name: 'Audio', exact: true })).toBeVisible();
    await expect(sheet(page).getByRole('switch', { name: 'Toggle color synth' })).toHaveCount(0);

    await sheet(page).getByRole('switch', { name: 'Toggle audio features' }).click();

    // Named switches: the Audio copies used to be bare role="switch" buttons
    // with no accessible name at all. The synth only mounts once the feature
    // is on, so that it does not start an AudioContext behind the user.
    await expect(sheet(page).getByRole('switch', { name: 'Toggle color synth' })).toBeVisible();
  });

  test('the frame rate meter switch shows the meter, and reset-all clears it', async ({ page }) => {
    await expect(page.locator('#fps-meter')).toHaveCount(0);

    await menuButton(page).click();
    await sheet(page).getByRole('switch', { name: 'Toggle frame rate meter' }).click();
    await expect(page.locator('#fps-meter')).toBeVisible();

    // Lives inside the settings object, so the existing reset owns it. A new
    // localStorage key without a reset listener would survive this.
    await sheet(page).getByRole('button', { name: /default settings/i }).click();
    await expect(page.locator('#fps-meter')).toHaveCount(0);
  });

  /**
   * The impact highlights are one gate in ColorPicker - every lit thing in the
   * picker derives from the same hold - so this drags one slider and watches
   * another's keyline, which is the cross-control case the whole feature is
   * for. The keyline is always mounted and crossfades, so it is opacity that
   * is asserted, not presence.
   */
  test('the interaction highlights switch silences them, and reset-all brings them back', async ({ page }) => {
    const keyline = page.locator('#slider-hsb-h-keyline');
    const opacityOf = () => keyline.evaluate((el) => getComputedStyle(el).opacity);

    const dragRed = async () => {
      const box = (await page.locator('#slider-rgb-r-arrow').boundingBox())!;
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      await page.mouse.down();
      await page.mouse.move(box.x + box.width / 2 + 60, box.y + box.height / 2, { steps: 6 });
    };

    await dragRed();
    await expect.poll(opacityOf, { timeout: 1000 }).toBe('1');
    await page.mouse.up();

    await menuButton(page).click();
    await sheet(page).getByRole('switch', { name: 'Toggle interaction highlights' }).click();
    await page.keyboard.press('Escape');
    await expect(sheet(page)).toBeHidden();

    await dragRed();
    await page.waitForTimeout(400);
    expect(await opacityOf()).toBe('0');
    await page.mouse.up();

    await menuButton(page).click();
    await sheet(page).getByRole('button', { name: /default settings/i }).click();
    await page.keyboard.press('Escape');
    await expect(sheet(page)).toBeHidden();

    await dragRed();
    await expect.poll(opacityOf, { timeout: 1000 }).toBe('1');
    await page.mouse.up();
  });
});
