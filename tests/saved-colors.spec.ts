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

test.describe('Saved colors row', () => {
  test.beforeEach(async ({ page }) => {
    // Start from a clean slot grid so the test always sees the 9 defaults.
    await page.addInitScript(() => {
      try {
        localStorage.removeItem('color-taylor-saved');
        localStorage.removeItem('color-taylor-recent');
      } catch { /* ignore */ }
    });
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
});
