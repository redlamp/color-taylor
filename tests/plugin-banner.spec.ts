import { test, expect } from '@playwright/test';

const banner = (page: import('@playwright/test').Page) =>
  page.getByRole('region', { name: 'Color Taylor plugin' });

// No beforeEach clearing the dismissal key: each test gets a fresh browser
// context, so localStorage starts empty anyway - and doing it via
// addInitScript actively breaks the reload test, because that script re-runs
// on every navigation and wipes the dismissal the test just made.
test.describe('Plugin banner', () => {
  test('shows on the picker route', async ({ page }) => {
    await page.goto('/');
    await expect(banner(page)).toBeVisible();
  });

  test('dismissing hides it and survives a reload', async ({ page }) => {
    await page.goto('/');
    await banner(page).getByRole('button', { name: 'Dismiss' }).click();
    await expect(banner(page)).toBeHidden();

    await page.reload();
    // The promo must not come back on the next visit - that is the whole point
    // of persisting the dismissal rather than keeping it in component state.
    await expect(banner(page)).toBeHidden();
  });

  test('links to the Community listing, in a new tab', async ({ page }) => {
    await page.goto('/');
    const link = banner(page).getByRole('link');
    await expect(link).toHaveAttribute(
      'href',
      'https://www.figma.com/community/plugin/1671457712575610716/color-taylor',
    );
    // target=_blank without rel=noopener hands the opened page a reference
    // back to this window.
    await expect(link).toHaveAttribute('target', '_blank');
    await expect(link).toHaveAttribute('rel', /noopener/);
  });

  test('"Reset all settings" brings it back after a dismissal', async ({ page }) => {
    await page.goto('/');
    await banner(page).getByRole('button', { name: 'Dismiss' }).click();
    await expect(banner(page)).toBeHidden();

    await page.getByRole('button', { name: 'Open settings' }).click();
    await page.getByRole('dialog').getByRole('button', { name: /reset all settings/i }).click();

    // Dismissing is a preference like any other; a reset that restores the
    // theme and swatches but leaves this hidden would be lying about scope.
    await expect(banner(page)).toBeVisible();

    // And the reset has to clear the stored flag too, not just the in-memory
    // state - otherwise it reappears now and vanishes again on reload.
    await page.reload();
    await expect(banner(page)).toBeVisible();
  });

  test('on a phone it moves into the settings sheet instead', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 700 });
    await page.goto('/');

    // Not on the picker at all. It used to render here as a stacked two-row
    // block; a phone's first screen is the picker, and an announcement strip
    // was spending a scarce row on something nobody opened the app to read.
    await expect(banner(page)).toBeHidden();

    await page.getByRole('button', { name: 'Open settings' }).click();
    const news = page.getByRole('dialog').getByRole('region', { name: 'Color Taylor plugin' });
    await expect(news).toBeVisible();

    // Still the real link, not just a mention of it.
    const link = news.getByRole('link');
    await expect(link).toHaveAttribute(
      'href',
      'https://www.figma.com/community/plugin/1671457712575610716/color-taylor',
    );
    await expect(link).toHaveAttribute('target', '_blank');
    await expect(link).toHaveAttribute('rel', /noopener/);

    // One line of button text, never "Get the / plugin".
    const linkBox = await link.boundingBox();
    expect(linkBox!.height).toBeLessThan(40);
  });

  test('the settings news item is desktop-hidden, where the banner takes over', async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 800 });
    await page.goto('/');
    await expect(banner(page)).toBeVisible();

    await page.getByRole('button', { name: 'Open settings' }).click();
    // Both surfaces visible at once would be the same news twice on one screen.
    await expect(
      page.getByRole('dialog').getByRole('region', { name: 'Color Taylor plugin' }),
    ).toBeHidden();
  });

  test('is a single-row pill on a wide viewport', async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 800 });
    await page.goto('/');
    const box = await banner(page).boundingBox();
    expect(box!.height).toBeLessThan(60);
  });

  test('does not appear in the presentation', async ({ page }) => {
    // PresentationStage renders a whole ColorPicker inside a scaled wrapper,
    // and a transformed ancestor captures position:fixed. Mounting the banner
    // at app level rather than inside ColorPicker is what keeps it out; this
    // pins that placement.
    await page.goto('/#/intro');
    await page.waitForTimeout(1200);
    await expect(banner(page)).toBeHidden();
  });
});
