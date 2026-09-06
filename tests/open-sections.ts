import type { Page } from '@playwright/test';

/**
 * Recent starts closed - the hexagon, the editor and Saved are the whole
 * first screen - so a test that reaches into it opens it first. Idempotent: a
 * section already open is left alone, so the Swatches panel that holds both
 * lists is in the default list too. Waits out the collapse animation so the
 * content is visible, not merely attached.
 */
export async function openSections(page: Page, ids: string[] = ['swatches-group', 'recent-colors']) {
  for (const id of ids) {
    const trigger = page.locator(`#${id}-trigger`);
    await trigger.waitFor();
    if ((await trigger.getAttribute('aria-expanded')) === 'false') await trigger.click();
  }
  await page.waitForTimeout(400);
}
