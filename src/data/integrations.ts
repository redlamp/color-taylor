/**
 * Where Color Taylor runs besides this page.
 *
 * Data only, so the promo surface that renders it can change shape - footer,
 * banner, ribbon - without the list being rewritten each time. More versions
 * are expected; adding one is an entry here plus a glyph in the renderer.
 */

/**
 * `live` links out; anything else renders no link, because a listing that is
 * still private is a 404 for every visitor.
 *
 * Figma is marked `live` even though the listing is still with Figma's
 * reviewers, on an explicit call (2026-08-18): **the app is not deployed until
 * the plugin is approved**, so by the time anyone can see this banner the link
 * resolves. The gate is the deploy, not the flag - do not run `bun run deploy`
 * until the Community listing is public.
 *
 * The flag still matters for anything added later: a second platform in review
 * while Figma is live must be `in-review`, or it ships a dead link.
 */
export type IntegrationStatus = 'live' | 'in-review';

export interface Integration {
  id: string;
  /** Glyph key, mapped to a component by whatever renders this. */
  icon: string;
  /** The surface, not the product: "Figma", not "Color Taylor for Figma". */
  platform: string;
  href: string;
  status: IntegrationStatus;
}

export const INTEGRATIONS: Integration[] = [
  {
    id: 'figma',
    icon: 'figma',
    platform: 'Figma',
    href: 'https://www.figma.com/community/plugin/1671457712575610716/color-taylor',
    status: 'live',
  },
];

/** The one the banner leads with: a shipped version wins over a pending one. */
export function primaryIntegration(): Integration | null {
  return INTEGRATIONS.find((i) => i.status === 'live') ?? INTEGRATIONS[0] ?? null;
}
