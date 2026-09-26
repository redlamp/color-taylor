import { test, expect } from '@playwright/test';

/**
 * A ColorSlider whose props change in place must drag with the new props.
 *
 * The Oklch lab's bank swaps its second row between a C slider (0..0.4,
 * writes chroma) and an S slider (0..100, writes a percentage) on a mode
 * switch. React reused the C instance for S, and the drag hook inside it kept
 * serving C's callback: a press on the S track worked, because the press takes
 * a fresh handler, but every pointer move went through the stale one and moved
 * chroma by a chroma-sized amount instead. The lab keys the two sliders now,
 * and the shared hook takes the latest callback on every render, so either
 * guard alone holds this.
 */
test('relative S drags after switching from absolute C', async ({ page }) => {
  await page.goto('/lab/oklch.html');
  await page.getByRole('tab', { name: /Relative/ }).click();

  const slider = page.locator('#slider-oklch-s');
  // The bank sits below the fold at the default viewport, and the mouse does
  // not scroll: bring it up first, and let the layout settle.
  await slider.scrollIntoViewIfNeeded();
  await page.waitForTimeout(200);
  const track = await slider.locator('[role=slider]').boundingBox();
  if (!track) throw new Error('no S track');
  const y = track.y + track.height / 2;
  await page.mouse.move(track.x + track.width * 0.9, y);
  await page.mouse.down();
  await page.mouse.move(track.x + track.width * 0.3, y, { steps: 6 });
  await page.mouse.up();

  await expect(slider.getByRole('textbox')).toHaveValue('30');
});
