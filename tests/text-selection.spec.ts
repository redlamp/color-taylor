import { test, expect } from '@playwright/test';
import { openSections } from './open-sections';

/**
 * The two panels you drag on do not hand out text selections.
 *
 * Every surface in the hexagon and the colour editor is a control, and a
 * gesture that begins a hair beside one used to run off dragging a highlight
 * behind it. `select-none` on the controls themselves could never fix that: the
 * selection lands on whatever the drag passes *over*, not on where it started.
 *
 * Scoped to those two panels, not to the page - the title and the equations
 * panel are ordinary text and stay copyable. What is worth pinning is which
 * side of that line each thing falls.
 */
test.describe('Text selection', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      try { localStorage.clear(); localStorage.setItem('color-taylor-about-seen', '1'); } catch { /* ignore */ }
    });
    await page.setViewportSize({ width: 1400, height: 1000 });
    await page.goto('/');
    await page.locator('#rgb-dot-green').waitFor();
  });

  test('only the readouts you would want to copy are selectable', async ({ page }) => {
    await openSections(page, ['equations-group']);

    const selectable = (selector: string) => page.evaluate((s) => {
      const el = document.querySelector(s);
      return el ? getComputedStyle(el).userSelect : 'absent';
    }, selector);

    // Inside the two panels: a heading, a channel label, the colour field.
    for (const s of ['#color-hexagon h2', '#slider-rgb-r-label', '#sb-area']) {
      expect(await selectable(s), s).toBe('none');
    }
    // The readouts inside them, which are all real inputs, so one rule covers
    // both the channel steppers and the hex field.
    for (const s of ['#slider-rgb-r-stepper input', 'input[aria-label="Hex color value"]']) {
      expect(await selectable(s), s).toBe('text');
    }
    // And everything outside them is ordinary text.
    for (const s of ['h1', '#equations-group-content']) {
      expect(await selectable(s), s).not.toBe('none');
    }
  });

  /**
   * The gesture that actually did it, which is not the one you would guess.
   *
   * A drag starting *on* a control was always fine - those handlers
   * preventDefault, so the browser never begins a selection. What caught text
   * was starting a hair beside one: on a channel label, on a panel heading, in
   * the gap between two sliders. From the R label this used to select
   * "R G B H S B".
   */
  for (const [what, selector] of [['a channel label', '#slider-rgb-r-label'], ['a panel heading', '#color-hexagon h2']]) {
    test(`a drag beginning on ${what} selects nothing`, async ({ page }) => {
      const from = await page.evaluate((s) => {
        const el = document.querySelector(s);
        if (!el) return null;
        const r = el.getBoundingClientRect();
        return { x: r.left + 4, y: r.top + r.height / 2 };
      }, selector);
      expect(from).not.toBeNull();

      await page.mouse.move(from!.x, from!.y);
      await page.mouse.down();
      for (let i = 1; i <= 30; i++) await page.mouse.move(from!.x + i * 14, from!.y + i * 7);
      await page.mouse.up();

      expect(await page.evaluate(() => String(getSelection()))).toBe('');
    });
  }

  test('the equations panel can still be selected', async ({ page }) => {
    await openSections(page, ['equations-group']);
    const selected = await page.evaluate(() => {
      const panel = document.querySelector('#equations-group-content');
      if (!panel) return '';
      const range = document.createRange();
      range.selectNodeContents(panel);
      getSelection()?.removeAllRanges();
      getSelection()?.addRange(range);
      return String(getSelection()).trim();
    });
    expect(selected.length).toBeGreaterThan(20);
  });
});
