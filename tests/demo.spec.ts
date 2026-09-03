import { test, expect, type Page } from '@playwright/test';

/**
 * The self-running demo behind the ? button.
 *
 * It runs at `?demospeed=N`, which divides every duration - the same shape as
 * `?fps`, a query param rather than stored state - so the whole five-step
 * script fits in a few seconds here while staying itself.
 *
 * What is worth asserting is not the choreography, which will keep changing,
 * but the contract around it: the ticks advance, the bar ends on "Start
 * exploring", and the colour the demo borrowed comes back whether it finished
 * or was interrupted.
 */

const FAST = '/?demospeed=8';

/** Four choreographed steps; the fifth index is the sign-off. */
const STEPS_LENGTH = 4;

/** The three RGB readouts, which are on screen in the default slider groups. */
async function rgb(page: Page): Promise<string> {
  const ids = ['#slider-rgb-r-track', '#slider-rgb-g-track', '#slider-rgb-b-track'];
  const vals = await Promise.all(ids.map((id) => page.locator(id).getAttribute('aria-valuenow')));
  return vals.join(',');
}

const panel = (page: Page) => page.getByTestId('demo-bar');
/** Ticks light up to and including the step being played, so the count is the step number. */
const litTicks = (page: Page) => page.locator('[data-testid="demo-ticks"] i[data-on]');
const primary = (page: Page) => page.getByTestId('demo-primary');
/** The button carries its longer label invisibly to hold the width, so read the visible one. */
const primaryLabel = (page: Page) => page.getByTestId('demo-primary-label');

test.describe('Picker demo', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => { try { localStorage.clear(); } catch { /* ignore */ } });
    await page.setViewportSize({ width: 1400, height: 1000 });
    await page.goto(FAST);
    await page.locator('#rgb-dot-green').waitFor();
  });

  test('the ? button runs the script through to the sign-off', async ({ page }) => {
    await page.locator('#demo-button').click();
    await expect(panel(page)).toBeVisible();

    // The tick for the step being played is lit, so the count is the step.
    await expect(litTicks(page)).toHaveCount(1, { timeout: 5000 });
    await expect(litTicks(page)).toHaveCount(4, { timeout: 20000 });
    await expect(primaryLabel(page)).toHaveText('Start exploring', { timeout: 20000 });

    // The overlay stays up until the user takes it down.
    await primary(page).click();
    await expect(panel(page)).toHaveCount(0);
  });

  test('the colour it borrowed comes back when it finishes', async ({ page }) => {
    const before = await rgb(page);
    await page.locator('#demo-button').click();
    await expect(primaryLabel(page)).toHaveText('Start exploring', { timeout: 25000 });
    // The restore is the same tween an undo uses, so it lands a moment later.
    await expect.poll(() => rgb(page), { timeout: 4000 }).toBe(before);
  });

  test('skipping restores the colour and takes the overlay down', async ({ page }) => {
    const before = await rgb(page);
    await page.locator('#demo-button').click();
    // Far enough in that the demo has moved the colour off where it started.
    await expect(litTicks(page)).toHaveCount(3, { timeout: 15000 });
    expect(await rgb(page)).not.toBe(before);

    await primary(page).click();
    await expect(panel(page)).toHaveCount(0);
    await expect.poll(() => rgb(page), { timeout: 4000 }).toBe(before);
  });

  test('a real press ends it; the demo\'s own presses do not', async ({ page }) => {
    await page.locator('#demo-button').click();
    // The script drives the app with synthetic events all the way through
    // step one. If those counted as user input it would skip itself here.
    await expect(litTicks(page)).toHaveCount(3, { timeout: 15000 });
    await expect(panel(page)).toBeVisible();

    await page.locator('h1').first().click();
    await expect(panel(page)).toHaveCount(0);
  });

  test('a key ends it too', async ({ page }) => {
    await page.locator('#demo-button').click();
    await expect(litTicks(page)).toHaveCount(1, { timeout: 5000 });
    await page.keyboard.press('Escape');
    await expect(panel(page)).toHaveCount(0);
  });

  test('reduced motion runs the same script without the arcs', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto(FAST);
    await page.locator('#rgb-dot-green').waitFor();
    await page.locator('#demo-button').click();
    await expect(litTicks(page)).toHaveCount(4, { timeout: 20000 });
    await expect(primaryLabel(page)).toHaveText('Start exploring');
  });

  test('Next and Back walk the steps', async ({ page }) => {
    await page.locator('#demo-button').click();
    await expect(litTicks(page)).toHaveCount(1);

    await page.getByRole('button', { name: 'Next step' }).click();
    await expect(litTicks(page)).toHaveCount(2);
    await page.getByRole('button', { name: 'Next step' }).click();
    await expect(litTicks(page)).toHaveCount(3);

    await page.getByRole('button', { name: 'Previous step' }).click();
    await expect(litTicks(page)).toHaveCount(2);

    // Back is off at the start and Next is off at the sign-off; nothing here
    // can walk past either end.
    await page.getByRole('button', { name: 'Previous step' }).click();
    await expect(page.getByRole('button', { name: 'Previous step' })).toBeDisabled();
  });

  test('Next all the way through reaches the sign-off', async ({ page }) => {
    await page.locator('#demo-button').click();
    for (let i = 0; i < 4; i++) await page.getByRole('button', { name: 'Next step' }).click();
    await expect(primaryLabel(page)).toHaveText('Start exploring');
    await expect(page.getByRole('button', { name: 'Next step' })).toBeDisabled();
  });

  test('the tick for the step being played fills as it runs', async ({ page }) => {
    await page.locator('#demo-button').click();
    const head = page.getByTestId('demo-playhead');
    const fill = async () => Number(
      /scaleX\(([\d.]+)\)/.exec(await head.evaluate((el) => el.style.transform))?.[1] ?? 0,
    );

    // Slow enough to catch it mid-step: at demospeed=8 a step is under a
    // second and the playhead would be at either end by the time this looks.
    await expect.poll(fill, { timeout: 4000 }).toBeGreaterThan(0.05);
    const early = await fill();
    await page.waitForTimeout(250);
    expect(await fill()).toBeGreaterThan(early);
  });

  test('the sign-off takes itself down, and hands the colour back on the way', async ({ page }) => {
    const before = await rgb(page);
    await page.locator('#demo-button').click();
    for (let i = 0; i < STEPS_LENGTH; i++) {
      await page.getByRole('button', { name: 'Next step' }).click();
    }
    await expect(primaryLabel(page)).toHaveText('Start exploring');

    // Five real seconds, whatever ?demospeed says: it is reading time, not
    // choreography. Still there a moment later, gone a few seconds after.
    await page.waitForTimeout(1500);
    await expect(panel(page)).toBeVisible();
    await expect(panel(page)).toHaveCount(0, { timeout: 9000 });
    await expect.poll(() => rgb(page), { timeout: 4000 }).toBe(before);
  });
});
