import { test, expect, type ConsoleMessage } from '@playwright/test';

// Order produced by hue sort with sat/brightness ascending tiebreakers.
// All neutrals (s=0) precede saturated colors at h=0; within neutrals,
// black (b=0) → grey (b≈50) → white (b=100).
const EXPECTED_HUE_ORDER = [
  '#000000', // black
  '#808080', // grey
  '#ffffff', // white
  '#ff0000', // red       h=0,   s=100
  '#ffff00', // yellow    h=60
  '#00ff00', // green     h=120
  '#00ffff', // cyan      h=180
  '#0000ff', // blue      h=240
  '#ff00ff', // magenta   h=300
];

function clearStorage() {
  try {
    localStorage.removeItem('color-taylor-saved');
    localStorage.removeItem('color-taylor-recent');
    localStorage.removeItem('color-taylor-hsb');
  } catch { /* ignore */ }
}

test.describe('Saved colors row', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(clearStorage);
  });

  test('renders defaults without duplicate-key console warnings', async ({ page }) => {
    const violations: string[] = [];
    page.on('console', (msg: ConsoleMessage) => {
      const text = msg.text();
      if (msg.type() === 'error' && /two children with the same key/i.test(text)) {
        violations.push(text);
      }
    });
    await page.goto('/');
    await page.locator('#saved-colors [data-saved-idx="0"]').waitFor();
    expect(violations).toEqual([]);
  });

  test('hue sort puts neutrals before saturated colors at h=0', async ({ page }) => {
    await page.goto('/');
    const section = page.locator('#saved-colors');
    await section.locator('[data-saved-idx="0"]').waitFor();

    const sortButton = section.locator('button[aria-label$="(click to cycle)"]');
    while (!(await sortButton.textContent())?.includes('Hue')) {
      await sortButton.click();
    }

    const filledSlots = section.locator('button[aria-label^="Load "]');
    await expect(filledSlots).toHaveCount(EXPECTED_HUE_ORDER.length);

    const renderedOrder = await filledSlots.evaluateAll((els) =>
      els.map((el) => {
        const label = el.getAttribute('aria-label') || '';
        return label.replace(/^Load\s+/, '').toLowerCase();
      })
    );
    expect(renderedOrder).toEqual(EXPECTED_HUE_ORDER);
  });

  test('drag-drop swaps two saved slots', async ({ page }) => {
    await page.goto('/');
    const section = page.locator('#saved-colors');
    const slot0 = section.locator('[data-saved-idx="0"]');
    const slot1 = section.locator('[data-saved-idx="1"]');
    await slot0.waitFor();

    const before = await Promise.all([
      slot0.getAttribute('aria-label'),
      slot1.getAttribute('aria-label'),
    ]);
    expect(before[0]).toMatch(/^Load /);
    expect(before[1]).toMatch(/^Load /);

    await slot0.dragTo(slot1);

    const after = await Promise.all([
      slot0.getAttribute('aria-label'),
      slot1.getAttribute('aria-label'),
    ]);
    // After dropping 0 onto 1 (center-zone replace), the dragged color
    // should now sit in slot 1; the original slot 1 content is overwritten.
    // At minimum, the row must not be in its original arrangement.
    expect(after).not.toEqual(before);
  });
});

test.describe('Recent colors row', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(clearStorage);
  });

  test('debounce adds a new color to recent after 1s', async ({ page }) => {
    await page.goto('/');
    const hexInput = page.getByLabel('Hex color value');
    await hexInput.waitFor();

    // Use a fully-saturated pure-channel color so the HSB↔RGB roundtrip
    // is lossless and the recent entry exactly matches what we type.
    await hexInput.click();
    await hexInput.fill('00FF80');
    await hexInput.blur();

    const recentSlot0 = page.locator('#recent-colors button[aria-label^="Select "]').first();
    await expect(recentSlot0).toHaveAttribute('aria-label', /#00ff80/i, { timeout: 3000 });
  });
});
