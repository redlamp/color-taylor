import { test, expect, type Page } from '@playwright/test';
import { openSections } from './open-sections';

/**
 * Which swatches read as selected.
 *
 * The rule is colour identity and nothing else: a Recent or Saved swatch shows
 * the ring exactly while it holds the current colour, or the colour a tween is
 * on its way to. Two sections can satisfy that at once, and so can two
 * identical Saved slots.
 *
 * It used to be two stored indices - which slot you last clicked - which is a
 * different claim and drifted from this one in three ways, all of them silent
 * and all of them covered below.
 */

function clearStorage() {
  try { localStorage.clear();
    // The welcome panel is modal and would eat the first click of a test.
    localStorage.setItem('color-taylor-about-seen', '1'); } catch { /* ignore */ }
}

/** The swatches currently showing the white selection ring, as `index:hex`. */
async function ringed(page: Page) {
  return page.evaluate(() => {
    const hasRing = (el: Element) => getComputedStyle(el).boxShadow.includes('rgb(255, 255, 255)');
    const read = (sel: string, prefix: string) =>
      [...document.querySelectorAll(sel)]
        .map((el, i) => ({ i, hex: el.getAttribute('aria-label')!.replace(prefix, ''), ring: hasRing(el) }))
        .filter((s) => s.ring)
        .map((s) => `${s.i}:${s.hex}`);
    return {
      recent: read('#recent-colors button[aria-label^="Select "]', 'Select '),
      saved: read('#saved-colors button[aria-label^="Load "]', 'Load '),
    };
  });
}

test.describe('Swatch selection ring', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(clearStorage);
    await page.goto('/');
    await openSections(page);
    await page.locator('#saved-colors [data-saved-idx="0"]').waitFor();
  });

  test('the ring leaves a swatch when the colour moves on', async ({ page }) => {
    const hexInput = page.getByLabel('Hex color value');
    await page.locator('#saved-colors [data-saved-idx="0"]').click();
    await expect.poll(async () => (await ringed(page)).saved).toEqual(['0:#ff0000']);

    // Wait for the tween to land before changing the colour, so this test is
    // about the ring and not about tween timing. Typing mid-tween does take
    // effect now - see tests/color-input.spec.ts, which covers exactly that -
    // but the resulting colour would depend on when the keystroke landed.
    await expect(hexInput).toHaveValue('#FF0000', { timeout: 4000 });

    // Any other route to a colour has to clear the ring. The stored index did
    // not: red stayed ringed while the current colour was something else.
    await hexInput.click();
    await hexInput.fill('123456');
    await hexInput.blur();

    await expect.poll(async () => (await ringed(page)).saved, {
      message: 'no saved swatch holds the current colour',
    }).toEqual([]);
  });

  test('one colour in both sections rings in both', async ({ page }) => {
    // Clicking Saved red loads it; the 1s debounce then logs it into Recent, so
    // the same colour is in both places at once.
    await page.locator('#saved-colors [data-saved-idx="0"]').click();

    await expect.poll(async () => {
      const r = await ringed(page);
      return { recent: r.recent, saved: r.saved };
    }, { timeout: 6000 }).toEqual({ recent: ['0:#ff0000'], saved: ['0:#ff0000'] });
  });

  test('a colour saved twice rings in both slots', async ({ page }) => {
    await page.locator('#saved-colors [data-saved-idx="0"]').click();
    // Wait for red to reach Recent so there is something to copy from.
    await expect.poll(async () => (await ringed(page)).recent, { timeout: 6000 }).toEqual(['0:#ff0000']);

    // Copying a Recent colour into a free slot leaves the same colour in Saved
    // twice. Both hold the current colour, so both ring.
    await page.locator('#recent-colors button[aria-label^="Select "]').first()
      .dragTo(page.locator('#saved-colors [data-saved-idx="10"]'));

    await expect.poll(async () => (await ringed(page)).saved, {
      message: 'both copies of red ring',
    }).toEqual(['0:#ff0000', '9:#ff0000']);
  });
});

test.describe('Saved sort modes', () => {
  /**
   * The app has no opacity - alpha is threaded by the Figma plugin only - so
   * Sort must not offer a mode that sorts by a value this surface cannot
   * express. Presence of `onAlphaRestore` is what ColorHexagon keys this on.
   */
  test('the app cycle omits alpha', async ({ page }) => {
    await page.goto('/');
    await openSections(page);
    const sort = page.locator('#saved-colors button[data-sort-mode]');
    await sort.waitFor();

    const seen: (string | null)[] = [];
    for (let i = 0; i < 6; i++) {
      seen.push(await sort.getAttribute('data-sort-mode'));
      await sort.click();
      await page.waitForTimeout(150);
    }
    expect(seen).not.toContain('alpha');
    // And it is a complete cycle of the four that remain, not a truncated one.
    expect(new Set(seen)).toEqual(new Set(['user', 'hue', 'saturation', 'brightness']));
  });
});
