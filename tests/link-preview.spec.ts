import { test, expect } from '@playwright/test';

/**
 * Guards the Open Graph / Twitter card tags in index.html.
 *
 * These have no visible failure mode. Break them and the app looks fine; you
 * only find out when a link pasted into WhatsApp or Discord comes back as a
 * bare URL, which is exactly the sort of thing nobody re-tests. The two ways
 * they break are covered here: the tag going missing, and the URL ceasing to
 * be absolute.
 *
 * The dev server is enough - `%SITE_URL%` is filled by a transformIndexHtml
 * hook, which runs in serve as well as build.
 */
const meta = (page: import('@playwright/test').Page, key: string) =>
  page.locator(`head > meta[property="${key}"], head > meta[name="${key}"]`);

test.describe('Link preview metadata', () => {
  test('declares a large-image card with an absolute image URL', async ({ page }) => {
    await page.goto('/');

    // summary_large_image has no og:* equivalent, and without it X falls back
    // to the small square thumbnail.
    await expect(meta(page, 'twitter:card')).toHaveAttribute(
      'content',
      'summary_large_image'
    );

    for (const key of ['og:image', 'twitter:image']) {
      const content = await meta(page, key).getAttribute('content');
      // Absolute, not %BASE_URL%-relative: the scraper never loaded the page,
      // so it has no document to resolve a relative path against.
      expect(content, key).toMatch(/^https:\/\/.+\/og-image\.jpg$/);
    }

    const url = await meta(page, 'og:url').getAttribute('content');
    expect(url).toMatch(/^https:\/\//);
  });

  test('the image the tags point at is the one that ships', async ({ page, request }) => {
    await page.goto('/');
    const declared = await meta(page, 'og:image').getAttribute('content');

    // Fetch it from the dev server rather than the absolute URL - the tags name
    // the deployed origin, which is not what is under test here.
    const res = await request.get('/' + declared!.split('/').pop());
    expect(res.status()).toBe(200);
    expect(res.headers()['content-type']).toContain('image/jpeg');

    // The declared dimensions are used to lay the card out before the image
    // arrives, so a stale value shows as a reflow in the preview.
    await expect(meta(page, 'og:image:width')).toHaveAttribute('content', '1200');
    await expect(meta(page, 'og:image:height')).toHaveAttribute('content', '630');
  });

  test('the card copy matches the manifest', async ({ page, request }) => {
    await page.goto('/');
    const description = await meta(page, 'og:description').getAttribute('content');

    // One product, one blurb. The manifest, the Figma listing and this all
    // carry the same sentence; drifting them apart is the failure.
    const manifest = await (await request.get('/manifest.webmanifest')).json();
    expect(description).toBe(manifest.description);

    await expect(page.locator('head > meta[name="description"]')).toHaveAttribute(
      'content',
      manifest.description
    );
  });
});
