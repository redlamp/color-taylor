/**
 * "Also available in..." — where Color Taylor runs besides this page.
 *
 * Built as a list rather than a hardcoded Figma pitch because more versions
 * are expected. Adding one is an entry in INTEGRATIONS plus a glyph in GLYPHS;
 * the layout, the responsive behaviour and the "in review" handling all come
 * for free, and the heading switches from singular to plural on its own.
 *
 * Not rendered inside the Figma plugin: the plugin builds from
 * figma/ui/main.tsx, which mounts ColorHexagon directly and never sees this.
 * Telling someone already inside Figma about the Figma plugin would be a bug,
 * so if this ever moves into a shared component, gate it.
 */
import type { ReactElement } from 'react';
import { ArrowUpRight } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * `live` links out. Anything else deliberately renders no anchor: a Community
 * listing is private until Figma's review passes, so a link published early is
 * a 404 for every visitor. Flip to 'live' when the listing goes public - that
 * one word is the whole change.
 */
type IntegrationStatus = 'live' | 'in-review';

type Integration = {
  id: string;
  /** Glyph key, mapped in GLYPHS below. */
  icon: string;
  /** The surface, not the product: "Figma", not "Color Taylor for Figma". */
  platform: string;
  /** One line, present tense, describing what it does *there*. */
  blurb: string;
  href: string;
  status: IntegrationStatus;
};

export const INTEGRATIONS: Integration[] = [
  {
    id: 'figma',
    icon: 'figma',
    platform: 'Figma',
    blurb: 'Pick from the hexagon and paint your selection, without leaving the canvas.',
    href: 'https://www.figma.com/community/plugin/1671457712575610716/color-taylor',
    status: 'in-review',
  },
];

/**
 * Figma's mark, inline rather than from lucide - the icon set dropped its
 * brand glyphs, and this is five shapes.
 */
function FigmaGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 38 57" className={className} role="img" aria-hidden="true" focusable="false">
      <path d="M19 28.5a9.5 9.5 0 1 1 19 0 9.5 9.5 0 0 1-19 0z" fill="#1ABCFE" />
      <path d="M0 47.5A9.5 9.5 0 0 1 9.5 38H19v9.5a9.5 9.5 0 1 1-19 0z" fill="#0ACF83" />
      <path d="M19 0h9.5a9.5 9.5 0 1 1 0 19H19V0z" fill="#FF7262" />
      <path d="M0 9.5A9.5 9.5 0 0 1 9.5 0H19v19H9.5A9.5 9.5 0 0 1 0 9.5z" fill="#F24E1E" />
      <path d="M0 28.5A9.5 9.5 0 0 1 9.5 19H19v19H9.5A9.5 9.5 0 0 1 0 28.5z" fill="#A259FF" />
    </svg>
  );
}

const GLYPHS: Record<string, (props: { className?: string }) => ReactElement> = {
  figma: FigmaGlyph,
};

function IntegrationRow({ item }: { item: Integration }) {
  const Glyph = GLYPHS[item.icon];
  const live = item.status === 'live';

  return (
    <li className="flex items-center gap-3">
      {Glyph && <Glyph className="size-5 shrink-0" />}
      {/* The platform is the heading: the section above already says what this
          is a list of, so repeating "Color Taylor for ..." on every row would
          be three words of nothing. */}
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-foreground">{item.platform}</p>
        <p className="text-xs text-muted-foreground">{item.blurb}</p>
      </div>
      {live ? (
        <a
          className={cn('ctl-quiet shrink-0 no-underline')}
          href={item.href}
          target="_blank"
          rel="noopener noreferrer"
        >
          Get it
          <ArrowUpRight className="size-4" aria-hidden="true" />
          <span className="sr-only">on the {item.platform} Community (opens in a new tab)</span>
        </a>
      ) : (
        // No anchor at all while the listing is private - a disabled-looking
        // link still invites the click that lands on a 404.
        <span
          className="shrink-0 rounded-md bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground select-none"
          title="Waiting on Figma's review"
        >
          In review
        </span>
      )}
    </li>
  );
}

export default function IntegrationsFooter() {
  if (INTEGRATIONS.length === 0) return null;

  return (
    <footer className="mt-3 rounded-lg border border-border/60 bg-card/40 px-3 py-2.5">
      <h2 className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        Also available in
      </h2>
      <ul className="flex flex-col gap-2.5">
        {INTEGRATIONS.map((item) => (
          <IntegrationRow key={item.id} item={item} />
        ))}
      </ul>
    </footer>
  );
}
