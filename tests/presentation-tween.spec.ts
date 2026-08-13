import { test, expect, type Page } from '@playwright/test';

/**
 * The intro deck's keyframe animation must survive a slide change.
 *
 * It used not to. The cycle's origin came from `performance.now()` while the rAF
 * callback compares against the rAF clock, which is the timestamp of the frame
 * that has already begun - so a callback scheduled inside a commit running in
 * that same frame could receive a timestamp EARLIER than the origin it was
 * subtracted from. Negative elapsed, and because JS `%` keeps its left operand's
 * sign, a negative frame index: `keyframes[-1]` is undefined and reading `.r` off
 * it threw inside the callback, before the reschedule. The loop did not stall, it
 * died, and stayed dead across every following slide.
 *
 * It only triggered when the nearest keyframe was black (`timeOffset === 0`), so
 * it depended on where in the colour cycle you happened to advance - which is why
 * it read as "sometimes the tween gets stuck". Any test for it has to force the
 * dark case rather than hope for it.
 */

/**
 * The R/G/B slider values, which the animation drives.
 *
 * By id, not by position: the HSB sliders are in the DOM on these slides too
 * (hidden, but present), so an index into all `[role=slider]` is not the three
 * channels. Ids are `slider-${group}-${label}` - see decision-scoped-slider-ids.
 *
 * A missing channel reads as 0 rather than as unknown. The red-channel slide
 * suppresses G and B via `lockedChannels`, so they are absent from the DOM - and
 * absent is exactly 0 there, because RED_KEYFRAMES holds both at zero.
 */
async function channels(page: Page): Promise<string> {
  return page.evaluate(() =>
    ['r', 'g', 'b']
      .map((c) => document.querySelector(`#slider-rgb-${c}-track`)?.getAttribute('aria-valuenow') ?? '0')
      .join(','),
  );
}

/** Distinct values seen over ~2.5s. More than one means it is still animating. */
async function distinctOver(page: Page, samples = 10): Promise<number> {
  const seen = new Set<string>();
  for (let i = 0; i < samples; i++) {
    seen.add(await channels(page));
    await page.waitForTimeout(250);
  }
  return seen.size;
}

/** Walk to a slide index by pressing ArrowRight, which is the only way that works. */
async function advanceTo(page: Page, index: number) {
  for (let i = 0; i < index; i++) {
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(650);
  }
}

test.describe('Intro deck keyframe animation', () => {
  test('survives the slide change that used to kill it', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(String(e).split('\n')[0]));

    await page.goto('/#/presentation');
    // The shell is lazy-loaded.
    await page.locator('[role="slider"]').first().waitFor({ timeout: 15000 });

    // Index 7 is 'The Red Channel', the first slide with showRgbAnimate.
    // (It was 8 before the thousands/millions merge removed a slide.)
    await advanceTo(page, 7);
    await expect
      .poll(() => distinctOver(page, 3), { timeout: 15000, message: 'the red-channel slide should animate' })
      .toBeGreaterThan(1);

    // Force the failing condition: wait until the cycle is near black, which is
    // what made timeOffset 0 and left elapsed free to go negative.
    await expect
      .poll(async () => {
        const [r, g, b] = (await channels(page)).split(',').map(Number);
        return r + g + b;
      }, { timeout: 12000, message: 'cycle should pass near black' })
      .toBeLessThan(90);

    // Cross into the next slide at that colour.
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(400);

    expect(await distinctOver(page), 'animation must continue past the boundary').toBeGreaterThan(1);
    expect(errors, 'no page errors while crossing slides').toEqual([]);
  });

  /**
   * Breadth, not the guard. Checked against the pre-fix code: this one passed
   * while the crash was still live, because it advances on whatever colour the
   * cycle happens to be on and the bug only fires near black. The test above is
   * what actually holds the line.
   */
  test('keeps animating across every remaining slide', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(String(e).split('\n')[0]));

    await page.goto('/#/presentation');
    await page.locator('[role="slider"]').first().waitFor({ timeout: 15000 });
    await advanceTo(page, 7);
    await page.waitForTimeout(1200);

    // Indices 7..13 carry showRgbAnimate; 14 is the live app and has none.
    for (let target = 8; target <= 13; target++) {
      await page.keyboard.press('ArrowRight');
      await page.waitForTimeout(400);
      expect(await distinctOver(page, 6), `slide ${target} should animate`).toBeGreaterThan(1);
    }
    expect(errors).toEqual([]);
  });
});
