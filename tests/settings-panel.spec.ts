import { test, expect } from '@playwright/test';
import { openSections } from './open-sections';

/**
 * The settings sheet's interaction contract.
 *
 * There was no coverage here at all while the panel was a hand-rolled fixed
 * <aside>, which is part of how it kept a tabbable-but-aria-hidden subtree, no
 * focus return, and desktop-only-missing click-outside. These are the
 * behaviours the base-ui Dialog is relied on for, so they are worth pinning:
 * a future shell swap that silently drops one should fail here.
 */

const menuButton = (page: import('@playwright/test').Page) =>
  page.getByRole('button', { name: 'Open menu' });

const sheet = (page: import('@playwright/test').Page) =>
  page.getByRole('dialog');

test.describe('Settings sheet', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await menuButton(page).waitFor();
    await openSections(page, ['hex-group']);
  });

  test('opens from the menu button and is a named dialog', async ({ page }) => {
    await expect(sheet(page)).toBeHidden();
    await menuButton(page).click();
    await expect(sheet(page)).toBeVisible();
    // The <h2> is the dialog's accessible name, not just decoration.
    await expect(sheet(page)).toHaveAccessibleName(/menu/i);
  });

  test('Escape closes it', async ({ page }) => {
    await menuButton(page).click();
    await expect(sheet(page)).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(sheet(page)).toBeHidden();
  });

  test('clicking outside closes it — including on desktop', async ({ page }) => {
    // The old panel only dismissed on outside-click below the md breakpoint;
    // on desktop there was no way out but the X or Escape.
    await page.setViewportSize({ width: 1280, height: 900 });
    await menuButton(page).click();
    await expect(sheet(page)).toBeVisible();
    // Far left, clear of the sheet on the right edge.
    await page.mouse.click(40, 500);
    await expect(sheet(page)).toBeHidden();
  });

  test('focus moves into the sheet and returns to the menu button on close', async ({ page }) => {
    await menuButton(page).click();
    await expect(sheet(page)).toBeVisible();
    await expect(sheet(page).locator(':focus')).toHaveCount(1);
    await page.keyboard.press('Escape');
    await expect(sheet(page)).toBeHidden();
    await expect(menuButton(page)).toBeFocused();
  });

  test('its controls are not reachable by keyboard while closed', async ({ page }) => {
    // The regression this replaces: aria-hidden={!open} on a subtree that
    // stayed in the tab order, so a screen-reader user could focus controls
    // inside a panel the same attribute claimed did not exist.
    await expect(page.getByRole('switch', { name: 'Toggle theme' })).toHaveCount(0);
  });

  test('the theme switch inside works', async ({ page }) => {
    await menuButton(page).click();
    const themeSwitch = sheet(page).getByRole('switch', { name: 'Toggle theme' });
    const before = await themeSwitch.getAttribute('aria-checked');
    await themeSwitch.click();
    await expect(themeSwitch).not.toHaveAttribute('aria-checked', before ?? '');
  });

  test('"Default Settings" returns the colour to the default', async ({ page }) => {
    const hexInput = page.locator('input[value^="#"]').first();
    await expect(hexInput).toHaveValue('#4F95FF');

    // Move the colour somewhere else and let it persist.
    await hexInput.fill('#FF0000');
    await hexInput.press('Enter');
    await expect(hexInput).toHaveValue('#FF0000');

    await menuButton(page).click();
    await sheet(page).getByRole('button', { name: /default settings/i }).click();

    // Tweened, not snapped, so allow it to arrive.
    await expect(hexInput).toHaveValue('#4F95FF', { timeout: 4000 });
  });

  /**
   * Which sections are open is show/hide state like the slider banks and the
   * blend mode, both of which the reset already returned. It is not persisted -
   * closing a section once should not close it forever - but it does outlive
   * the components, so the reset has to reach in and clear it.
   *
   * Color Editor defaults open and Recent defaults closed, so moving both and
   * resetting checks that a default is restored in each direction rather than
   * everything simply being opened or shut.
   */
  test('"Default Settings" restores which sections are open', async ({ page }) => {
    // The grid row the section animates, whose height is 0 while collapsed.
    const height = (id: string) => async () =>
      (await page.locator(`#${id}-content`).locator('..').boundingBox())?.height ?? -1;
    // The trigger by what it controls, rather than by its title text: the
    // header holds the section's own action buttons beside it.
    const toggle = (id: string) => page.locator(`[aria-controls="${id}-content"]`);

    await toggle('color-editor-group').click();
    await expect.poll(height('color-editor-group')).toBe(0);
    await toggle('recent-colors').click();
    await expect.poll(height('recent-colors')).toBeGreaterThan(0);

    await menuButton(page).click();
    await sheet(page).getByRole('button', { name: /default settings/i }).click();

    await expect.poll(height('color-editor-group'), { timeout: 4000 }).toBeGreaterThan(0);
    await expect.poll(height('recent-colors'), { timeout: 4000 }).toBe(0);
  });

  /**
   * Edge to edge on a phone, a detached rail on a desktop that hangs from the
   * row the content starts on and stops where its contents stop.
   *
   * The top has to be measured: the header sits at 44px, 77px or 107px from the
   * top depending on how the title row and the plugin banner wrap, so no fixed
   * inset is level with anything. What is worth pinning is not the height -
   * that is a layout detail - but that it is level with the app, that it caps
   * rather than running off the bottom, and that the reset stays reachable when
   * it does.
   */
  test('the menu stands off the edges and sizes to its contents', async ({ page }) => {
    const box = async () => {
      await page.waitForTimeout(300);
      return page.evaluate(() => {
        const pop = document.querySelector('[role="dialog"]')!;
        const r = pop.getBoundingClientRect();
        const body = pop.children[1];
        const foot = pop.lastElementChild!.getBoundingClientRect();
        return {
          top: Math.round(r.top),
          right: Math.round(window.innerWidth - r.right),
          bottom: Math.round(window.innerHeight - r.bottom),
          height: Math.round(r.height),
          viewport: window.innerHeight,
          scrolls: body.scrollHeight > body.clientHeight + 1,
          resetOnScreen: foot.bottom <= window.innerHeight + 1,
        };
      });
    };

    await menuButton(page).click();
    const desktop = await box();
    expect(desktop.right).toBe(16);

    // Level with the first card, at two widths that wrap the header differently.
    for (const [w, h] of [[1400, 1000], [1100, 900]]) {
      await page.setViewportSize({ width: w, height: h });
      await page.waitForTimeout(250);
      const level = await page.evaluate(() => {
        const top = (sel: string) => Math.round(document.querySelector(sel)!.getBoundingClientRect().top);
        return { panel: top('[role="dialog"]'), card: top('#color-hexagon') };
      });
      expect(level.panel, `${w}x${h}`).toBe(level.card);
    }
    await page.setViewportSize({ width: 1400, height: 1000 });
    await page.waitForTimeout(250);
    // Sized to its contents rather than to the window, and clear of the foot.
    expect(desktop.height).toBeLessThan(desktop.viewport * 0.6);
    expect(desktop.bottom).toBeGreaterThan(16);
    expect(desktop.scrolls).toBe(false);

    // Too short for the contents: it caps at the same inset the rail used to
    // end on, the list scrolls, and the reset is still reachable.
    await page.setViewportSize({ width: 1400, height: 380 });
    const short = await box();
    expect(short.bottom).toBe(16);
    expect(short.scrolls).toBe(true);
    expect(short.resetOnScreen).toBe(true);

    await page.setViewportSize({ width: 390, height: 844 });
    const phone = await box();
    expect({ top: phone.top, right: phone.right, bottom: phone.bottom }).toEqual({ top: 0, right: 0, bottom: 0 });
  });

  /**
   * The label drives the switch. A 36px track at the far end of the row is a
   * small thing to aim at, and on a phone the words are the only part of the
   * row worth aiming at.
   *
   * `htmlFor` on a `button`, which is a labelable element - so the browser
   * forwards the activation and it fires once, not twice. `aria-label` still
   * wins for the accessible name, which is why the switch is still found by
   * what it does rather than by the row it sits in.
   */
  test('tapping a row label works its switch', async ({ page }) => {
    await menuButton(page).click();
    const highlights = sheet(page).getByRole('switch', { name: 'Toggle interaction highlights' });
    await expect(highlights).toHaveAttribute('aria-checked', 'true');

    await sheet(page).getByText('Interaction Highlights', { exact: true }).click();
    await expect(highlights).toHaveAttribute('aria-checked', 'false');

    // Once per click: a row that toggled twice would land back where it was.
    await sheet(page).getByText('Interaction Highlights', { exact: true }).click();
    await expect(highlights).toHaveAttribute('aria-checked', 'true');
  });

  /**
   * "Keep Menu Open" makes the menu non-modal.
   *
   * The synth can only be judged against colours you are changing, and a modal
   * menu closes on the first thing you touch. So the scrim goes, outside
   * pointer events reach the app, and an outside press no longer dismisses -
   * but Escape and the X still do, because what should go is dismissal by
   * accident, not the ways out.
   *
   * It is a field inside the settings object rather than its own key, so the
   * existing reset owns it; see the table in CLAUDE.md.
   */
  test('"Keep Menu Open" drops the scrim and survives a click on the app', async ({ page }) => {
    const scrim = page.locator('[data-testid="app-scrim"], .fixed.inset-0.isolate');
    const trackPoint = async () => {
      const r = (await page.locator('#slider-rgb-g-track').boundingBox())!;
      return { x: Math.round(r.x + 40), y: Math.round(r.y + r.height / 2) };
    };
    const colour = () => page.locator('#slider-rgb-g-track').getAttribute('aria-valuenow');

    // Modal to begin with: there is a scrim, the rail sits over the tool, and
    // a press outside closes it.
    await menuButton(page).click();
    await expect(scrim).toBeVisible();
    // Polled: it slides in from the right, so it overlaps nothing until it
    // has landed.
    await expect.poll(() => page.evaluate(() => {
      const rail = document.querySelector('[role="dialog"]')!.getBoundingClientRect();
      const content = document.querySelector('#color-picker-root')!.getBoundingClientRect();
      return content.right > rail.left;
    }), { timeout: 4000 }).toBe(true);
    let at = await trackPoint();
    await page.mouse.click(at.x, at.y);
    await expect(sheet(page)).toHaveCount(0);

    await menuButton(page).click();
    await sheet(page).getByRole('switch', { name: 'Keep the menu open while using the app' }).click();
    await expect(scrim).toHaveCount(0);

    /*
     * The stage narrows by the rail's footprint, so the tool stops sitting
     * under it. Measured on the picker rather than on the stage: the stage is
     * a full-width flex container and stays one - it is its padding that moves
     * the content, so its own box still spans the viewport either way.
     *
     * Polled, because the padding is transitioned and one reading catches it
     * part way across.
     */
    await expect.poll(() => page.evaluate(() => {
      const rail = document.querySelector('[role="dialog"]')!.getBoundingClientRect();
      const content = document.querySelector('#color-picker-root')!.getBoundingClientRect();
      return content.right <= rail.left + 1;
    }), { timeout: 4000 }).toBe(true);

    // The press now reaches the slider, and the menu is still there.
    const before = await colour();
    at = await trackPoint();
    await page.mouse.click(at.x, at.y);
    await expect(sheet(page)).toBeVisible();
    expect(await colour()).not.toBe(before);

    // The ways out that were asked for still work.
    await page.keyboard.press('Escape');
    await expect(sheet(page)).toHaveCount(0);

    // And "Default Settings" puts it back, since it lives in the settings
    // object. The reset does not close the panel, so the scrim returning under
    // the open panel is the whole of the assertion.
    await menuButton(page).click();
    await sheet(page).getByRole('button', { name: /default settings/i }).click();
    await expect(scrim).toBeVisible();
  });

  /**
   * The header is a handle, and it slides the rail up and down its own edge.
   *
   * Vertical only - a sidebar that can be put in the middle of the screen is a
   * floating window with extra steps, and that is what this panel was before
   * decision-settings-sheet. What the sliding is for is height: the cap on the
   * rail's height is measured from wherever it hangs, so moving it up is how a
   * long list gets more room.
   *
   * The old drag's worst fault was that its position went stale on resize, so
   * that is asserted too.
   */
  test('the header slides the rail up and down, and only that', async ({ page }) => {
    const at = () => page.evaluate(() => {
      const pop = document.querySelector('[role="dialog"]')!;
      const r = pop.getBoundingClientRect();
      const foot = pop.lastElementChild!.getBoundingClientRect();
      return {
        top: Math.round(r.top),
        right: Math.round(window.innerWidth - r.right),
        resetOnScreen: foot.bottom <= window.innerHeight + 1,
      };
    });
    const slide = async (dy: number) => {
      const h = await page.evaluate(() => {
        const r = document.querySelector('[role="dialog"]')!.children[0].getBoundingClientRect();
        return { x: Math.round(r.left + 40), y: Math.round(r.top + r.height / 2) };
      });
      await page.mouse.move(h.x, h.y);
      await page.mouse.down();
      // Sideways as well as down, to prove the sideways half is ignored.
      for (let i = 1; i <= 15; i++) await page.mouse.move(h.x - i * 20, h.y + (dy / 15) * i);
      await page.mouse.up();
      await page.waitForTimeout(120);
    };

    await menuButton(page).click();
    // It slides in from the right; measuring before that lands reads a panel
    // that is still off the edge.
    await page.waitForTimeout(400);
    const opened = await at();
    await slide(250);
    const moved = await at();
    expect(moved.top).toBe(opened.top + 250);
    expect(moved.right).toBe(opened.right);

    // Where you put it is where it is next time.
    await page.keyboard.press('Escape');
    await menuButton(page).click();
    await page.waitForTimeout(300);
    expect((await at()).top).toBe(moved.top);

    // Slid at the foot it shrinks rather than leaving; the reset stays reachable.
    await slide(2000);
    expect((await at()).resetOnScreen).toBe(true);

    // And a smaller window brings it back rather than leaving it out of reach.
    await page.setViewportSize({ width: 700, height: 480 });
    await page.waitForTimeout(300);
    const shrunk = await at();
    expect(shrunk.top).toBeLessThanOrEqual(480 - 160);
    expect(shrunk.resetOnScreen).toBe(true);
  });

  /**
   * Display is four switches and always worth seeing. Audio is a switch that,
   * once on, unfolds into the synth controls - which is most of the rail's
   * height and none of what somebody opening the menu is usually after.
   */
  test('the Audio section starts collapsed and Display does not', async ({ page }) => {
    await menuButton(page).click();
    await expect(sheet(page).getByRole('button', { name: 'Display' })).toHaveAttribute('aria-expanded', 'true');
    const audio = sheet(page).getByRole('button', { name: 'Audio' });
    await expect(audio).toHaveAttribute('aria-expanded', 'false');

    // Still a section, not a dead label.
    await audio.click();
    await expect(audio).toHaveAttribute('aria-expanded', 'true');
    await expect(sheet(page).getByText('Enable audio')).toBeVisible();
  });

  test('the audio section is always there; its controls arrive with the feature', async ({ page }) => {
    await menuButton(page).click();
    // The section holds the switch that brings the feature into existence, so
    // it cannot be conditional on the feature - it used to be, which put that
    // switch under Display and left no Audio heading to look under.
    await expect(sheet(page).getByRole('button', { name: 'Audio', exact: true })).toBeVisible();
    await expect(sheet(page).getByRole('switch', { name: 'Toggle color synth' })).toHaveCount(0);

    // The section starts collapsed - it is most of the rail's height once the
    // synth controls unfold, and none of what a menu is usually opened for.
    await sheet(page).getByRole('button', { name: 'Audio', exact: true }).click();
    await sheet(page).getByRole('switch', { name: 'Toggle audio features' }).click();

    // Named switches: the Audio copies used to be bare role="switch" buttons
    // with no accessible name at all. The synth only mounts once the feature
    // is on, so that it does not start an AudioContext behind the user.
    await expect(sheet(page).getByRole('switch', { name: 'Toggle color synth' })).toBeVisible();
  });

  test('the frame rate meter switch shows the meter, and reset-all clears it', async ({ page }) => {
    await expect(page.locator('#fps-meter')).toHaveCount(0);

    await menuButton(page).click();
    await sheet(page).getByRole('switch', { name: 'Toggle frame rate meter' }).click();
    await expect(page.locator('#fps-meter')).toBeVisible();

    // Lives inside the settings object, so the existing reset owns it. A new
    // localStorage key without a reset listener would survive this.
    await sheet(page).getByRole('button', { name: /default settings/i }).click();
    await expect(page.locator('#fps-meter')).toHaveCount(0);
  });

  /**
   * The impact highlights are one gate in ColorPicker - every lit thing in the
   * picker derives from the same hold - so this drags one slider and watches
   * another's keyline, which is the cross-control case the whole feature is
   * for. The keyline is always mounted and crossfades, so it is opacity that
   * is asserted, not presence.
   */
  test('the interaction highlights switch silences them, and reset-all brings them back', async ({ page }) => {
    const keyline = page.locator('#slider-hsb-h-keyline');
    const opacityOf = () => keyline.evaluate((el) => getComputedStyle(el).opacity);

    const dragRed = async () => {
      const box = (await page.locator('#slider-rgb-r-arrow').boundingBox())!;
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      await page.mouse.down();
      await page.mouse.move(box.x + box.width / 2 + 60, box.y + box.height / 2, { steps: 6 });
    };

    await dragRed();
    await expect.poll(opacityOf, { timeout: 1000 }).toBe('1');
    await page.mouse.up();

    await menuButton(page).click();
    await sheet(page).getByRole('switch', { name: 'Toggle interaction highlights' }).click();
    await page.keyboard.press('Escape');
    await expect(sheet(page)).toBeHidden();

    await dragRed();
    await page.waitForTimeout(400);
    expect(await opacityOf()).toBe('0');
    await page.mouse.up();

    await menuButton(page).click();
    await sheet(page).getByRole('button', { name: /default settings/i }).click();
    await page.keyboard.press('Escape');
    await expect(sheet(page)).toBeHidden();

    await dragRed();
    await expect.poll(opacityOf, { timeout: 1000 }).toBe('1');
    await page.mouse.up();
  });
});
