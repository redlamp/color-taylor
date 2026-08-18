/**
 * Where Color Taylor runs besides this page.
 *
 * Data only, so the promo surface that renders it can change shape - footer,
 * banner, ribbon - without the list being rewritten each time. More versions
 * are expected; adding one is an entry here plus a glyph in the renderer.
 */

/**
 * `live` links out. Anything else deliberately renders no link: a Figma
 * Community listing is private until review passes, so a link published early
 * is a 404 for every visitor. Flip to 'live' when the listing goes public -
 * that one word is the whole change.
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
    status: 'in-review',
  },
];

/** The one the banner leads with: a shipped version wins over a pending one. */
export function primaryIntegration(): Integration | null {
  return INTEGRATIONS.find((i) => i.status === 'live') ?? INTEGRATIONS[0] ?? null;
}
