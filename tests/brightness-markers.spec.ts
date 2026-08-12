import { test, expect, type Page } from '@playwright/test';

/**
 * The hexagon's brightness bar: its 100/50/0 markers, and the label naming
 * which axis the bar drives.
 *
 * Both fail silently when they fail. The markers spent a while completely dead -
 * #hex-svg sits at z-[5] and, being a root <svg> rather than a shape, takes the
 * hit over its whole box, so the labels beneath it never fired and never even
 * lit up on hover. Nothing threw, nothing logged, and the cursor still turned
 * into a pointer. Only an assertion on the resulting value catches that.
 */

function clearStorage() {
  try {
    localStorage.removeItem('color-taylor-hsb');
    localStorage.removeItem('color-taylor-recent');
  } catch { /* ignore */ }
}

/** The bar's value, read off the handle pill. */
async function barValue(page: Page): Promise<number> {
  const text = await page.locator('#bl-handle').innerText();
  return Number(text.trim().replace('%', ''));
}

/** The markers tween rather than snap, so the value has to settle first. */
async function expectBarValue(page: Page, value: number) {
  await expect
    .poll(() => barValue(page), { timeout: 4000, message: `bar should reach ${value}` })
    .toBe(value);
}

test.describe('Brightness bar markers', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(clearStorage);
    await page.goto('/');
    await page.locator('#bl-bar').waitFor();
  });

  test('each marker takes the bar to its exact value', async ({ page }) => {
    // Walked as a sequence rather than three independent tests because each
    // step has to start away from its own target - see the dead-zone test.
    for (const value of [0, 50, 100, 0]) {
      await page.getByRole('button', { name: `Set brightness to ${value}` }).click();
      await expectBarValue(page, value);
    }
  });

  test('the tick mark beside a marker is a target too', async ({ page }) => {
    await page.getByRole('button', { name: 'Set brightness to 0' }).click();
    await expectBarValue(page, 0);

    // The tick itself is 4x1 user units; the row is clickable across the whole
    // gutter, which is the only reason a click at the bar's edge lands.
    const bar = (await page.locator('#bl-bar').boundingBox())!;
    await page.mouse.click(bar.x + bar.width + 6, bar.y + bar.height / 2);
    await expectBarValue(page, 50);
  });

  /**
   * The value pill is anchored to the bar's right edge and is wider than the
   * gutter behind it, so it covers whichever marker it is parked on. That is
   * inherent to a readout sitting over a scale, and self-limiting: a marker is
   * only unreachable while the value is already within ~3 of it.
   *
   * Pinned here so the zone cannot quietly widen. If the pill grows, or the
   * markers move under it at other values, this fails.
   */
  test('the pill only masks the marker it is parked on', async ({ page }) => {
    const bar = (await page.locator('#bl-bar').boundingBox())!;
    const masked = async () => {
      await page.waitForTimeout(1200);
      return page.evaluate(() =>
        ['100', '50', '0'].filter((label) => {
          const el = [...document.querySelectorAll('#hex-stage button')]
            .find((b) => b.textContent!.trim() === label)!;
          const r = el.getBoundingClientRect();
          return document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2) !== el;
        }));
    };

    // Mid-bar: the pill sits on 50, and both extremes stay reachable.
    await page.mouse.click(bar.x + bar.width / 2, bar.y + bar.height / 2);
    expect(await masked()).toEqual(['50']);

    // A tenth of the way down clears every marker.
    await page.mouse.click(bar.x + bar.width / 2, bar.y + bar.height * 0.1);
    expect(await masked()).toEqual([]);
  });

  test('the label names the live axis, not "Luminance"', async ({ page }) => {
    const stage = page.locator('#hex-stage');
    await expect(stage.getByText('Brightness', { exact: true })).toBeVisible();

    await page.locator('#color-hexagon').getByRole('tab', { name: 'HSL' }).click();
    await expect(stage.getByText('Lightness', { exact: true })).toBeVisible();
    await expect(stage.getByText('Brightness', { exact: true })).toHaveCount(0);

    // B is max(R,G,B) and L is (max+min)/2 - neither weights the channels nor
    // linearises, so neither is luminance. Blue and yellow sit at the same
    // point on this bar and differ 13x in relative luminance.
    await expect(page.getByText('Luminance', { exact: true })).toHaveCount(0);
  });

  /**
   * The channel letters lost their name tooltips; aria-label is what carries
   * the name now, and being invisible it is the kind of thing a later edit
   * drops without anyone noticing.
   */
  test('the channel letters name their hue without a tooltip', async ({ page }) => {
    const red = page.locator('#hex-stage').getByRole('button', { name: 'Red' });
    await expect(red).toHaveText('R');

    await red.hover();
    await page.waitForTimeout(1000);
    await expect(page.getByText('Red', { exact: true })).toHaveCount(0);

    // Still a control, not decoration: it jumps the wheel to its hue.
    await page.locator('#hex-stage').getByRole('button', { name: 'Green' }).click();
    await expect(page.locator('#hue-handle')).toHaveText('120°', { timeout: 4000 });
  });

  test('the HSB/HSL tabs are not covered by the hexagon canvas', async ({ page }) => {
    // #hex-svg's box is HEX_SIZE tall inside a DISPLAY_HEIGHT stage, so 40 user
    // units of empty canvas overhang the header above it. Playwright's own
    // actionability check is the assertion: it refuses to click a covered
    // element rather than clicking through to whatever is on top.
    const tab = page.locator('#color-hexagon').getByRole('tab', { name: 'HSL' });
    await tab.click({ timeout: 3000 });
    await expect(tab).toHaveAttribute('aria-selected', 'true');
  });
});

/**
 * The two columns' bottom edges, which drift on their own.
 *
 * Neither panel declares a height - each is its content - so an edit to either
 * one moves the relationship, and nothing about the page looks broken when it
 * does. Removing a single 10px caption from the hexagon header left it 17px
 * short of the sliders column. See the align-self rules in index.css.
 */
test.describe('Picker column heights', () => {
  /**
   * Swept across widths on purpose. The hexagon's height follows its width and
   * the sliders column's rows do not, so the gap between them is a function of
   * the window - checking one width proved nothing: at 1500px the columns were
   * 17px apart and at 900px, 128px.
   */
  test('the columns end level and Saved sits at the card bottom, at every width', async ({ page }) => {
    await page.setViewportSize({ width: 1500, height: 1300 });
    await page.goto('/');
    await page.locator('#bl-bar').waitFor();

    // CollapsibleSection triggers only - not the Settings popover or the
    // colour-name combobox, which also carry aria-expanded.
    for (let pass = 0; pass < 5; pass++) {
      const closed = page.locator('button[id$="-trigger"][aria-expanded="false"]');
      const n = await closed.count();
      if (!n) break;
      for (let i = n - 1; i >= 0; i--) await closed.nth(i).click().catch(() => {});
      await page.waitForTimeout(350);
    }
    await expect(page.locator('button[id$="-trigger"][aria-expanded="false"]')).toHaveCount(0);

    for (const width of [1900, 1500, 1100, 900]) {
      await page.setViewportSize({ width, height: 1300 });
      await page.waitForTimeout(500);
      const m = await page.evaluate(() => {
        const r = (s: string) => document.querySelector(s)!.getBoundingClientRect();
        const card = r('#color-hexagon');
        return {
          columnGap: Math.abs(card.bottom - r('#picker-layout').bottom),
          // Only the card's own p-3 should be left under Saved. Slack goes into
          // the stage above, where the wheel centres in it.
          savedGap: card.bottom - r('#saved-colors').bottom,
        };
      });
      expect(m.columnGap, `columns level at ${width}px`).toBeLessThanOrEqual(1);
      expect(m.savedGap, `Saved flush at ${width}px`).toBeLessThanOrEqual(16);
    }
  });

  /**
   * What replaced the `absorbs` / `data-section-grow` mechanism.
   *
   * Both columns stretch unconditionally now, which is only safe because each
   * has a permanent absorber: the SB box on the right, #hex-stage on the left.
   * If the SB box ever stops soaking up the room its neighbours give back, the
   * old failure returns - a stretched card with empty space pooled in it - and
   * nothing throws.
   */
  test('the SB box takes the room when the sections below it close', async ({ page }) => {
    await page.setViewportSize({ width: 1500, height: 1300 });
    await page.goto('/');
    await page.locator('#sb-wrapper').waitFor();

    const sb = page.locator('#sb-wrapper');
    const before = (await sb.boundingBox())!.height;

    for (const id of ['rgb-group', 'hsb-hsl-group', 'hex-group']) {
      await page.locator(`#${id}-trigger`).click();
      await page.waitForTimeout(250);
    }
    await page.waitForTimeout(500);

    const after = (await sb.boundingBox())!.height;
    expect(after, 'SB box should grow into the vacated room').toBeGreaterThan(before + 100);

    // And the columns are still level, with no slack pooled anywhere.
    const m = await page.evaluate(() => {
      const r = (s: string) => document.querySelector(s)!.getBoundingClientRect();
      return { gap: Math.abs(r('#color-hexagon').bottom - r('#picker-layout').bottom) };
    });
    expect(m.gap).toBeLessThanOrEqual(1);
  });

  test('the hexagon still collapses to its header', async ({ page }) => {
    // The flex-1 that passes height down to the stage is conditional on the
    // panel being open; left on, it would hold the 0fr row open.
    await page.setViewportSize({ width: 1500, height: 1300 });
    await page.goto('/');
    await page.locator('#bl-bar').waitFor();
    const card = page.locator('#color-hexagon');
    expect((await card.boundingBox())!.height).toBeGreaterThan(400);
    await page.locator('#color-hexagon h2').click();
    await page.waitForTimeout(600);
    expect((await card.boundingBox())!.height).toBeLessThan(80);
  });
});
