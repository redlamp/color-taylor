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

/**
 * A colour to start from that is not the one the script lands on.
 *
 * The app's default colour *is* the demo's landing colour - steps 1 and 2 aim
 * at it, and step 3's sweeps hand it back - so a test that opens on the
 * default and then asks whether the demo moved the colour is asking nothing.
 * Anything else works; this is the one the landing test also uses.
 */
const SEEDED = { h: 34, s: 88, b: 42 };
async function seeded(page: Page) {
  await page.addInitScript((hsb) => {
    localStorage.setItem('color-taylor-hsb', JSON.stringify(hsb));
  }, SEEDED);
  await page.goto(FAST);
  await page.locator('#rgb-dot-green').waitFor();
}

/**
 * How many choreographed steps there are, read from the panel rather than
 * written down: there is one tick per step plus one for the sign-off, and the
 * script gains and loses steps as the demo is tuned.
 */
const stepCount = async (page: Page) => {
  // The panel is lazy-loaded, so it is not there the instant the ? is pressed.
  await page.locator('[data-testid="demo-ticks"] > span').first().waitFor();
  return await page.locator('[data-testid="demo-ticks"] > span').count() - 1;
};

/**
 * Every tick lit, which is where the sign-off leaves them. The zero check is
 * not decoration: before the lazy panel mounts both counts are 0, and without
 * it this reads as "finished" the instant the demo is asked for.
 */
const allTicksLit = async (page: Page) => {
  const total = await page.locator('[data-testid="demo-ticks"] > span').count();
  return total > 0 && await litTicks(page).count() === total;
};

/** The three RGB readouts, which are on screen in the default slider groups. */
async function rgb(page: Page): Promise<string> {
  const ids = ['#slider-rgb-r-track', '#slider-rgb-g-track', '#slider-rgb-b-track'];
  const vals = await Promise.all(ids.map((id) => page.locator(id).getAttribute('aria-valuenow')));
  return vals.join(',');
}

/** Hue off the strip, saturation and brightness off the colour box's label. */
async function hsb(page: Page): Promise<string> {
  return await page.evaluate(() => {
    const h = document.querySelector('#hue-bar-wrapper')?.getAttribute('aria-valuenow');
    const sb = document.querySelector('#sb-area')?.getAttribute('aria-valuetext') ?? '';
    const [, s, b] = /Saturation (\d+)%, Brightness (\d+)%/.exec(sb) ?? [];
    return `${h}/${s}/${b}`;
  });
}

const panel = (page: Page) => page.getByTestId('demo-bar');
/** Ticks light up to and including the step being played, so the count is the step number. */
const litTicks = (page: Page) => page.locator('[data-testid="demo-ticks"] i[data-on]');
const primary = (page: Page) => page.getByTestId('demo-primary');
/** The button carries its longer label invisibly to hold the width, so read the visible one. */
const primaryLabel = (page: Page) => page.getByTestId('demo-primary-label');

test.describe('Picker demo', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => { try { localStorage.clear();
    // The welcome panel is modal and would eat the first click of a test.
    localStorage.setItem('color-taylor-about-seen', '1'); } catch { /* ignore */ } });
    await page.setViewportSize({ width: 1400, height: 1000 });
    await page.goto(FAST);
    await page.locator('#rgb-dot-green').waitFor();
  });

  test('the ? button runs the script through to the sign-off', async ({ page }) => {
    await page.locator('#demo-button').click();
    await expect(panel(page)).toBeVisible();

    // The tick for the step being played is lit, so the count is the step.
    await expect(litTicks(page)).toHaveCount(1, { timeout: 5000 });
    await expect.poll(() => allTicksLit(page), { timeout: 25000 }).toBe(true);
    await expect(primaryLabel(page)).toHaveText('Start exploring', { timeout: 20000 });

    // The overlay stays up until the user takes it down.
    await primary(page).click();
    await expect(panel(page)).toHaveCount(0);
  });

  test('the colour it borrowed comes back when it finishes', async ({ page }) => {
    await seeded(page);
    const before = await rgb(page);
    await page.locator('#demo-button').click();
    await expect(primaryLabel(page)).toHaveText('Start exploring', { timeout: 25000 });
    // The restore is the same tween an undo uses, so it lands a moment later.
    await expect.poll(() => rgb(page), { timeout: 4000 }).toBe(before);
  });

  test('skipping restores the colour and takes the overlay down', async ({ page }) => {
    await seeded(page);
    const before = await rgb(page);
    await page.locator('#demo-button').click();
    // Far enough in that the demo has moved the colour off where it started -
    // which is only true because the page opened somewhere the script is not
    // heading. See SEEDED.
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
    await expect.poll(() => allTicksLit(page), { timeout: 25000 }).toBe(true);
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
    for (let i = await stepCount(page); i > 0; i--) {
      await page.getByRole('button', { name: 'Next step' }).click();
    }
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
    await seeded(page);
    const before = await rgb(page);
    await page.locator('#demo-button').click();
    for (let i = await stepCount(page); i > 0; i--) {
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

  /**
   * The fills are written two ways - a style prop from the render and a direct
   * DOM write from the frame loop - and going back is where they used to
   * disagree. The tick being left was already "not yet played" as far as the
   * prop was concerned, so React saw no change, wrote nothing, and the
   * half-filled bar the loop had left stayed on screen behind a dimmed tick.
   */
  test('going back empties the tick it just left', async ({ page }) => {
    await page.locator('#demo-button').click();
    const scale = async (i: number) => Number(
      /scaleX\(([\d.]+)\)/.exec(
        await page.locator(`[data-testid="demo-ticks"] > span`).nth(i)
          .locator('i').evaluate((el) => (el as HTMLElement).style.transform),
      )?.[1] ?? -1,
    );

    await page.getByRole('button', { name: 'Next step' }).click();
    // Something on the second tick worth leaving behind.
    await expect.poll(() => scale(1), { timeout: 5000 }).toBeGreaterThan(0.05);

    await page.getByRole('button', { name: 'Previous step' }).click();
    await expect.poll(() => scale(1), { timeout: 2000 }).toBe(0);
    // And it stays empty - nothing is still driving it.
    await page.waitForTimeout(250);
    expect(await scale(1)).toBe(0);
    // The step it came back to runs again from the start rather than resuming.
    expect(await scale(0)).toBeLessThan(0.9);
  });

  /**
   * Steps 1 and 2 aim at one chosen colour - LANDING in steps.ts - from three
   * directions: the hexagon by angle and radius, the colour box by saturation
   * and brightness, the hue strip by height. The default colour is that
   * colour, so this has to start somewhere else to see any of it happen.
   *
   * It asserts the arrival rather than the path. Every gesture that lands is
   * written so its wobble term vanishes at t=1, and that is the property worth
   * keeping: it is what stops the demo finishing wherever its last frame
   * happened to fall.
   */
  test('the script lands on the colour it aims at', async ({ page }) => {
    await seeded(page);
    expect(await hsb(page)).toBe('34/88/42');

    await page.locator('#demo-button').click();
    // The hexagon sets hue and saturation and holds the brightness it began
    // with, so this is step one arriving, not step two.
    await expect.poll(() => hsb(page), { timeout: 15000, intervals: [50] }).toBe('216/69/42');
    // The colour box and the hue strip, which bring brightness with them.
    await expect.poll(() => hsb(page), { timeout: 15000, intervals: [50] }).toBe('216/69/100');
  });

  /**
   * The panel is opaque and the demo is a thing you watch, so the one must
   * never sit on top of the other. On a phone the header wraps, the panel
   * drops to the foot of the screen, and `bring` scrolls each target into
   * whatever band is left - the invariant is the same at any width, which is
   * why this asserts the property rather than a layout.
   */
  test('the demo never works behind its own panel', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 664 });
    await page.goto(FAST);
    await page.locator('#rgb-dot-green').waitFor();
    await page.locator('#demo-button').click();
    await expect(panel(page)).toBeVisible();

    let samples = 0;
    let behind = 0;
    for (let i = 0; i < 24; i++) {
      await page.waitForTimeout(120);
      const hit = await page.evaluate(() => {
        const cursor = document.querySelector<HTMLElement>('[data-testid="demo-cursor"]');
        const panelEl = document.querySelector('[data-demo-chrome]');
        if (!cursor || !panelEl) return null;
        const p = panelEl.getBoundingClientRect();
        const x = parseFloat(cursor.style.left || '0');
        const y = parseFloat(cursor.style.top || '0');
        const tips = [...document.querySelectorAll('[id^="stem-tip-"]')]
          .filter((el) => getComputedStyle(el).opacity !== '0')
          .map((el) => el.getBoundingClientRect());
        return {
          ghost: y >= p.top && y <= p.bottom && x >= p.left && x <= p.right,
          tips: tips.some((r) => r.bottom > p.top && r.top < p.bottom),
        };
      });
      if (!hit) continue;
      samples += 1;
      if (hit.ghost || hit.tips) behind += 1;
    }
    expect(samples).toBeGreaterThan(10);
    expect(behind).toBe(0);
  });
});
