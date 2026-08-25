import { test, expect, type Page } from '@playwright/test';

/**
 * The play/pause control for the deck's colour cycle.
 *
 * Worth a spec because the failure is silent in both directions. A pause that
 * does not take leaves a button that looks like it worked; a pause that leaks
 * into the slide-change effect leaves the cycle dead for the rest of the deck
 * with no error. Neither shows up in a screenshot.
 */

/** The RGB the deck is currently showing, read off the sliders. */
async function channels(page: Page): Promise<string> {
  return page.evaluate(() =>
    ['r', 'g', 'b']
      .map((c) => document.querySelector(`#slider-rgb-${c}-track`)?.getAttribute('aria-valuenow') ?? '0')
      .join(','),
  );
}

/** Distinct colours seen over ~2s. One means frozen; more means running. */
async function distinctOver(page: Page, samples = 8): Promise<number> {
  const seen = new Set<string>();
  for (let i = 0; i < samples; i++) {
    seen.add(await channels(page));
    await page.waitForTimeout(250);
  }
  return seen.size;
}

const control = (page: Page) =>
  page.getByRole('button', { name: /(Play|Pause) color animation/ });

/** Index 7 is 'The Red Channel', the first slide with showRgbAnimate. */
async function goToCyclingSlide(page: Page) {
  await page.goto('/#/intro');
  await page.locator('[role="slider"]').first().waitFor({ timeout: 15000 });
  for (let i = 0; i < 7; i++) {
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(650);
  }
}

test.describe('Colour cycle play/pause', () => {
  test('only appears on slides that actually cycle', async ({ page }) => {
    await page.goto('/#/intro');
    await page.locator('[role="slider"]').first().waitFor({ timeout: 15000 });

    // A control that does nothing is worse than no control.
    await expect(control(page)).toBeHidden();

    await goToCyclingSlide(page);
    await expect(control(page)).toBeVisible();
  });

  test('pausing freezes the colour, and resuming restarts it', async ({ page }) => {
    await goToCyclingSlide(page);
    await expect
      .poll(() => distinctOver(page, 3), { timeout: 15000, message: 'should be cycling to begin with' })
      .toBeGreaterThan(1);

    await control(page).click();
    await expect(control(page)).toHaveAccessibleName('Play color animation');

    // Settle first: the frame in flight when the click lands still commits.
    await page.waitForTimeout(300);
    expect(await distinctOver(page), 'paused means one colour, not a slower cycle').toBe(1);

    await control(page).click();
    await expect(control(page)).toHaveAccessibleName('Pause color animation');
    expect(await distinctOver(page), 'resuming restarts the cycle').toBeGreaterThan(1);
  });

  test('a pause survives changing slides', async ({ page }) => {
    await goToCyclingSlide(page);
    await control(page).click();
    await page.waitForTimeout(300);

    // The Stage re-derives whether to animate on every slide change, so a pause
    // stored down there would be undone by simply advancing. It lives in the
    // shell for this reason, and this is the assertion that holds that.
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(650);

    await expect(control(page)).toHaveAccessibleName('Play color animation');
    expect(await distinctOver(page), 'still paused on the next slide').toBe(1);
  });
});
