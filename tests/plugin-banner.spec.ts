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
