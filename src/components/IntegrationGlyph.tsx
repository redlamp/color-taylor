/**
 * Platform marks for the INTEGRATIONS list, inline as SVG.
 *
 * lucide-react dropped its brand icons and Figma's mark is five shapes, so it
 * is hand-written. Lifted out of PluginBanner because two surfaces draw it now:
 * the banner on wide viewports, and the settings news item on narrow ones,
 * where the banner does not render at all.
 *
 * Adding a platform is an entry in `INTEGRATIONS` plus a glyph here - the same
 * split decision-integrations-footer describes.
 */
import type { JSX } from 'react';

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

export const GLYPHS: Record<string, (props: { className?: string }) => JSX.Element> = {
  figma: FigmaGlyph,
};
