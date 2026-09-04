import type { Page } from '@playwright/test';

/**
 * Recent, Saved and Hex start closed - the hexagon and the sliders are the
 * whole first screen - so a test that reaches into one of them opens it first.
 * Idempotent: a section already open is left alone. Waits out the collapse
 * animation so the content is visible, not merely attached.
 */
export async function openSections(page: Page, ids: string[] = ['recent-colors', 'saved-colors', 'hex-group']) {
  for (const id of ids) {
    const trigger = page.locator(`#${id}-trigger`);
    await trigger.waitFor();
    if ((await trigger.getAttribute('aria-expanded')) === 'false') await trigger.click();
  }
  await page.waitForTimeout(400);
}
