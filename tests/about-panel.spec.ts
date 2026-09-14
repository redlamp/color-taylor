import { test, expect, type Page } from '@playwright/test';
import { CURRENT_CUT } from '../src/demo/currentCut';

/**
 * The welcome panel: shown once on a first visit, from the header's ? and from
 * Settings after that. It is the one door to the demo and to the narrated
 * walkthrough, so the entries and the 900px gate on the walkthrough are here.
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

  test('Escape dismisses it', async ({ page }) => {
    await firstVisit(page);
    await page.goto('/');
    // Wait for it before pressing: without this the key can land before the
    // dialog is listening, and the assertion then passes or fails on timing
    // rather than on Escape doing anything.
    await expect(panel(page)).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(panel(page)).toHaveCount(0);
  });

  test('a click on the scrim dismisses it', async ({ page }) => {
    await firstVisit(page);
    await page.goto('/');
    await expect(panel(page)).toBeVisible();
    // Outside the card, which on a 1280-wide viewport is well clear of it.
    await page.mouse.click(60, 60);
    await expect(panel(page)).toHaveCount(0);
  });

  test('"Watch the demo" hands over to the demo', async ({ page }) => {
    await firstVisit(page);
    await page.goto('/?demospeed=8');
    await panel(page).getByRole('button', { name: 'Demo' }).click();
    await expect(panel(page)).toHaveCount(0);
    await expect(page.getByTestId('demo-bar')).toBeVisible();
  });

  test('the ? button opens it rather than starting the demo', async ({ page }) => {
    await page.goto('/?demospeed=8');
    await expect(panel(page)).toHaveCount(0);
    await expect(page.locator('#demo-button')).toHaveAttribute('aria-label', 'About');
    await page.locator('#demo-button').click();
    await expect(panel(page)).toBeVisible();
    // The panel, not the tour: the tour is one press further in.
    await expect(page.getByTestId('demo-bar')).toHaveCount(0);
    await page.locator('#about-watch-demo').click();
    await expect(page.getByTestId('demo-bar')).toBeVisible();
  });

  test('three entries, in order, with their running times', async ({ page }) => {
    await page.setViewportSize({ width: 1376, height: 868 });
    await page.goto('/');
    await page.locator('#demo-button').click();
    await expect(panel(page)).toBeVisible();
    // Order matters: the way out on its own row, then the two things to
    // watch on the row below it.
    await expect(panel(page).locator('button')).toHaveText(['Get Started', 'Demo', 'Presentation']);
    const ids = await panel(page).locator('button').evaluateAll((els) => els.map((e) => e.id));
    expect(ids).toEqual(['about-close', 'about-watch-demo', 'about-presentation']);
    await expect(panel(page)).toContainText('40 seconds');
    await expect(panel(page)).toContainText('~6 min');
  });

  test('Get Started spans row one; Demo and Presentation split row two evenly', async ({ page }) => {
    await page.setViewportSize({ width: 1376, height: 868 });
    await page.goto('/');
    await page.locator('#demo-button').click();
    await expect(panel(page)).toBeVisible();
    // The card zooms in over 200ms; measuring mid-animation reads a scaled,
    // not final, width.
    await page.waitForTimeout(300);

    const getStarted = await panel(page).locator('#about-close').boundingBox();
    const demo = await panel(page).locator('#about-watch-demo').boundingBox();
    const presentation = await panel(page).locator('#about-presentation').boundingBox();
    if (!getStarted || !demo || !presentation) throw new Error('missing bounding box');

    const gap = presentation.x - (demo.x + demo.width);
    expect(Math.abs(getStarted.width - (demo.width + gap + presentation.width))).toBeLessThan(1.5);
    expect(Math.abs(demo.width - presentation.width)).toBeLessThan(1.5);
    expect(Math.abs(demo.y - presentation.y)).toBeLessThan(1.5);
  });

  // A "phone" width is always below the 900px gate (sm itself is 640), so
  // Presentation is never offered here - the stacking this checks is the
  // Get Started / Demo arrangement, which is all a phone ever sees.
  test('Get Started and Demo stack full width on a phone, Get Started first', async ({ page }) => {
    await page.setViewportSize({ width: 400, height: 800 });
    await page.goto('/');
    await page.locator('#demo-button').click();
    await expect(panel(page)).toBeVisible();
    await page.waitForTimeout(300);

    const buttons = panel(page).locator('button');
    await expect(buttons).toHaveText(['Get Started', 'Demo']);
    const getStarted = await panel(page).locator('#about-close').boundingBox();
    const demo = await panel(page).locator('#about-watch-demo').boundingBox();
    if (!getStarted || !demo) throw new Error('missing bounding box');

    expect(Math.abs(getStarted.width - demo.width)).toBeLessThan(1.5);
    // Stacked: Demo's row below Get Started's.
    expect(demo.y).toBeGreaterThan(getStarted.y);
  });

  test('gated at 880px, Demo alone fills row two at Get Started\'s width', async ({ page }) => {
    await page.setViewportSize({ width: 880, height: 860 });
    await page.goto('/');
    await page.locator('#demo-button').click();
    await expect(panel(page)).toBeVisible();
    await expect(panel(page).locator('#about-presentation')).toHaveCount(0);
    await page.waitForTimeout(300);

    const getStarted = await panel(page).locator('#about-close').boundingBox();
    const demo = await panel(page).locator('#about-watch-demo').boundingBox();
    if (!getStarted || !demo) throw new Error('missing bounding box');
    expect(Math.abs(getStarted.width - demo.width)).toBeLessThan(1.5);
  });

  test('the presentation entry is gated at 900px, live', async ({ page }) => {
    await page.setViewportSize({ width: 1000, height: 860 });
    await page.goto('/');
    await page.locator('#demo-button').click();
    await expect(panel(page)).toBeVisible();
    await expect(panel(page).locator('button')).toHaveCount(3);

    // Not disabled, not rendered - and without a reload, because the query is
    // subscribed rather than read once.
    await page.setViewportSize({ width: 880, height: 860 });
    await expect(panel(page).locator('#about-presentation')).toHaveCount(0);
    await expect(panel(page).locator('button')).toHaveCount(2);
    // The demo has no gate of its own.
    await expect(panel(page).locator('#about-watch-demo')).toBeVisible();

    await page.setViewportSize({ width: 1000, height: 860 });
    await expect(panel(page).locator('#about-presentation')).toBeVisible();
  });

  test('the presentation entry starts the walkthrough and leaves the panel open', async ({ page }) => {
    await page.setViewportSize({ width: 1376, height: 868 });
    await page.goto('/');
    await page.locator('#demo-button').click();
    await expect(panel(page)).toBeVisible();
    await page.locator('#about-presentation').click();
    // The runner closes it itself: the cut's first beat underlines the title
    // inside the panel, and beat two clicks Get Started.
    await expect(panel(page)).toBeVisible();
    // The reduced transport: play, time and a bare scrub bar, and none of the
    // authoring half or the full transport's readouts.
    await expect(page.getByTestId('present-transport')).toBeVisible();
    await expect(page.getByTestId('present-play')).toBeVisible();
    await expect(page.getByTestId('present-time')).toBeVisible();
    await expect(page.getByTestId('present-line')).toHaveCount(0);
    await expect(page.getByTestId('present-note')).toHaveCount(0);
    await expect(page.getByTestId('present-line-span')).toHaveCount(0);
    // The host's own elements, adopted: the click is the only moment playback
    // can be granted, so they are created and started there.
    await expect(page.locator('audio[data-testid="present-audio"]')).toHaveAttribute('src', new RegExp(`scripts/${CURRENT_CUT}\\.m4a$`));
    await expect(page.locator('#camera-pip video[data-front="1"]'))
      // WebcamPip fetches the file and attaches it as an object URL once it
      // has it, so the adopted element reads either the path or a blob.
      .toHaveAttribute('src', new RegExp(`(scripts/pip/${CURRENT_CUT}/full\\.mp4$|^blob:)`));
  });

  test('?present= mounts paused, with the full transport and no dev endpoints', async ({ page }) => {
    const dev: string[] = [];
    page.on('request', (r) => { if (r.url().includes('/__')) dev.push(r.url()); });
    await page.setViewportSize({ width: 1376, height: 868 });
    await page.goto('/?present=cut-03');
    await expect(page.getByTestId('present-transport')).toBeVisible();
    // A link is not the gesture playback needs, so it opens stopped.
    await expect.poll(() => page.locator('audio[data-testid="present-audio"]').evaluate(
      (el: HTMLAudioElement) => el.paused,
    )).toBe(true);
    // Full transport under the URL parameter - it is a tool worth showing.
    await expect(page.getByTestId('present-line')).toBeVisible();
    await expect(page.getByTestId('present-timeline')).toBeVisible();
    // ...but the authoring half only where the dev server can serve it. The
    // URL mounts dev mode on the Vite dev server (notes, clip editor) and
    // production mode in a build, so which half to expect is a fact about the
    // server, not the spec: probe the notes endpoint rather than guess from
    // the port.
    // A production preview answers every unknown path with index.html, so
    // the tell is JSON, not a 200.
    const devServer = ((await page.request.get('/__notes/cut-03')).headers()['content-type'] ?? '').includes('json');
    if (devServer) {
      await expect(page.getByTestId('present-note').first()).toBeVisible();
    } else {
      await expect(page.getByTestId('present-note')).toHaveCount(0);
      await expect(page.getByTestId('present-collapse')).toHaveCount(0);
      expect(dev).toEqual([]);
    }
  });

  test('?script= mounts nothing outside a recording session', async ({ page }) => {
    await page.setViewportSize({ width: 1376, height: 868 });
    await page.goto('/?script=cut-03');
    await page.locator('#rgb-dot-green').waitFor();
    // Dev-only, and this suite may be pointed at either build: the one thing
    // that holds in both is that it never mounts presentation mode.
    await expect(page.getByTestId('present-transport')).toHaveCount(0);
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
