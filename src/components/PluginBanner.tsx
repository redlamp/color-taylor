/**
 * A dismissible strip along the bottom, announcing the plugin.
 *
 * Mounted from App.tsx rather than from ColorPicker, and that placement is
 * load-bearing rather than tidiness: PresentationStage renders a whole
 * <ColorPicker /> inside a scaled wrapper, and a transformed ancestor makes
 * `position: fixed` resolve against that wrapper instead of the viewport.
 * A fixed banner parented to the picker would therefore turn up in the middle
 * of the slideshow, which is exactly the bug the old Settings panel had (see
 * decision-settings-sheet). At app level it is rendered only on the picker
 * route, so the presentation never sees it.
 *
 * Dismissal is permanent, in localStorage. A promo that returns on every
 * visit after being dismissed is a dark pattern, and this one has nothing
 * urgent enough to justify nagging.
 */
import { useEffect, useState } from 'react';
import { ArrowUpRight, X } from 'lucide-react';
import { primaryIntegration } from '@/data/integrations';

const DISMISS_KEY = 'color-taylor-plugin-banner';

function readDismissed(): boolean {
  try {
    return localStorage.getItem(DISMISS_KEY) === 'dismissed';
  } catch {
    // Private mode, or the null-origin iframe the plugin build runs in.
    return false;
  }
}

/** Figma's mark, inline - lucide dropped its brand glyphs, and this is five shapes. */
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

const GLYPHS: Record<string, (props: { className?: string }) => React.JSX.Element> = {
  figma: FigmaGlyph,
};

export default function PluginBanner() {
  const [dismissed, setDismissed] = useState(readDismissed);
  const item = primaryIntegration();

  /*
   * "Reset all settings" brings the banner back.
   *
   * Dismissing it is a preference like any other, so a reset that restores the
   * theme and the swatches but silently leaves this one hidden would be lying
   * about what it reset. SettingsPanel's resetAll() dispatches this event for
   * exactly this purpose - ColorHexagon already listens for it to restore the
   * default swatches.
   *
   * Declared before the early return below, because hooks cannot sit after one.
   */
  useEffect(() => {
    const onResetAll = () => {
      try {
        localStorage.removeItem(DISMISS_KEY);
      } catch { /* nothing stored; clearing the state below is enough */ }
      setDismissed(false);
    };
    window.addEventListener('color-taylor:reset-all', onResetAll);
    return () => window.removeEventListener('color-taylor:reset-all', onResetAll);
  }, []);

  if (!item || dismissed) return null;

  const Glyph = GLYPHS[item.icon];
  const live = item.status === 'live';

  const dismiss = () => {
    setDismissed(true);
    try {
      localStorage.setItem(DISMISS_KEY, 'dismissed');
    } catch { /* nothing to persist to; the session dismissal still holds */ }
  };

  // A centred pill rather than a full-width bar: the app is a centred column,
  // so a bar spanning the whole viewport underlines nothing and reads as
  // chrome from a different product.
  //
  // At the top rather than the bottom (user call, 2026-08-18) - it is an
  // announcement, and the bottom edge is where a page's least important
  // furniture lives.
  //
  // In the flow, not `fixed`. Pinned, it covered the app's own title outright
  // at phone widths: a top strip and the header want the same pixels, and the
  // header is the one that has to win. In flow it displaces instead, so it
  // cannot hide anything at any width, and the layout closes back up when it
  // is dismissed.
  return (
    <div className="flex justify-center p-3">
      <div
        role="region"
        aria-label="Color Taylor plugin"
        className="flex items-center gap-2 rounded-full border border-border bg-card/95 py-1.5 pr-1.5 pl-3.5 shadow-lg supports-backdrop-filter:backdrop-blur-sm"
      >
        {Glyph && <Glyph className="size-4 shrink-0" />}
        {/*
          The message states, the button acts. It read "Try the Color Taylor
          plugin" beside "Get it for Figma", which is two imperatives for one
          action - the eye takes "try", then "get", and has to work out they
          are the same ask. The platform also appeared only on the button, so
          the sentence was incomplete on its own. Now the sentence carries the
          news and names the platform, and the button is the only verb.
        */}
        {live ? (
          <>
            <span className="text-sm text-foreground">
              Color Taylor now runs inside {item.platform}
            </span>
            <a
              className="ctl-quiet h-7 rounded-full px-3 text-xs no-underline"
              href={item.href}
              target="_blank"
              rel="noopener noreferrer"
            >
              Get the plugin
              <ArrowUpRight className="size-3.5" aria-hidden="true" />
              <span className="sr-only">
                on the {item.platform} Community (opens in a new tab)
              </span>
            </a>
          </>
        ) : (
          // No link while the listing is private - an invitation pointing at a
          // 404 is worse than saying it is not ready yet.
          <span className="text-sm text-foreground">
            Color Taylor is coming to {item.platform}
          </span>
        )}
        <button
          type="button"
          onClick={dismiss}
          aria-label="Dismiss"
          className="ml-0.5 inline-flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-full text-muted-foreground select-none hover:bg-muted hover:text-foreground"
        >
          <X className="size-4" />
        </button>
      </div>
    </div>
  );
}
