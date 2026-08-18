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

  test('offers no link while the listing is still in review', async ({ page }) => {
    await page.goto('/');
    // A link published before the Community listing is public is a 404 for
    // every visitor, so the in-review state deliberately renders no anchor.
    await expect(banner(page).getByRole('link')).toHaveCount(0);
  });

  test('does not appear in the presentation', async ({ page }) => {
    // PresentationStage renders a whole ColorPicker inside a scaled wrapper,
    // and a transformed ancestor captures position:fixed. Mounting the banner
    // at app level rather than inside ColorPicker is what keeps it out; this
    // pins that placement.
    await page.goto('/#/presentation');
    await page.waitForTimeout(1200);
    await expect(banner(page)).toBeHidden();
  });
});
