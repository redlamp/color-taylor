/**
 * A dismissible pill at the top of the picker, announcing the plugin.
 *
 * Wide viewports only. On a phone the same announcement is a news item at the
 * foot of the settings sheet instead - see settings/IntegrationNews, which owns
 * the reasoning for the split.
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
import { GLYPHS } from '@/components/IntegrationGlyph';

const DISMISS_KEY = 'color-taylor-plugin-banner';

function readDismissed(): boolean {
  try {
    return localStorage.getItem(DISMISS_KEY) === 'dismissed';
  } catch {
    // Private mode, or the null-origin iframe the plugin build runs in.
    return false;
  }
}

export default function PluginBanner() {
  const [dismissed, setDismissed] = useState(readDismissed);
  /** The arrow moves only while the pointer or focus is on the link. */
  const [nudging, setNudging] = useState(false);
  const [reducedMotion] = useState(() =>
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
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

  /*
   * A centred pill rather than a full-width bar: the app is a centred column,
   * so a bar spanning the whole viewport underlines nothing and reads as
   * chrome from a different product.
   *
   * At the top rather than the bottom (user call, 2026-08-18) - it is an
   * announcement, and the bottom edge is where a page's least important
   * furniture lives.
   *
   * In the flow, not `fixed`. Pinned, it covered the app's own title outright
   * at phone widths: a top strip and the header want the same pixels, and the
   * header is the one that has to win. In flow it displaces instead, and the
   * layout closes back up when it is dismissed.
   *
   * From `sm` up only. It used to carry a second, stacked shape for narrow
   * viewports - the glyph spanning two rows, the caption and button as a column
   * beside it, the dismiss button absolutely placed - because side by side at
   * 320px both labels wrapped mid-phrase. That shape is gone with it: on a
   * phone the announcement moved into the settings sheet
   * (settings/IntegrationNews), where it costs the picker no vertical room at
   * all. One shape, one breakpoint, no `sm:contents` trick to maintain.
   */
  /*
   * Floating, not in the flow. It used to be a sibling above the centring row
   * so it displaced the picker rather than covering it - which meant the whole
   * tool jumped up the moment anyone dismissed it, and jumped again on the
   * next visit. A notice about something else should not be able to move the
   * thing you came for. The row keeps its padding so the pill sits clear of
   * the top edge, and only the pill itself takes a pointer.
   */
  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-40 hidden justify-center p-3 sm:flex">
      <div
        role="region"
        aria-label="Color Taylor plugin"
        className={
          'pointer-events-auto relative flex items-center gap-2 rounded-full border border-border ' +
          'bg-card/95 py-1.5 pr-1.5 pl-3.5 shadow-lg supports-backdrop-filter:backdrop-blur-sm'
        }
      >
        {/*
          The message states, the button acts. It read "Try the Color Taylor
          plugin" beside "Get it for Figma", which is two imperatives for one
          action - the eye takes "try", then "get", and has to work out they
          are the same ask. The platform also appeared only on the button, so
          the sentence was incomplete on its own. Now the sentence carries the
          news and names the platform, and the button is the only verb.

          While the listing is private there is no link at all: an invitation
          pointing at a 404 is worse than saying it is not ready yet.
        */}
        {Glyph && <Glyph className="size-4 shrink-0" />}

        <span className="text-sm text-foreground">
          {live
            ? `Try Color Taylor in ${item.platform}`
            : `Color Taylor is coming to ${item.platform}`}
        </span>

        {live && (
          <a
            // nowrap: the label must never break to "Get the / plugin".
            className="ctl-quiet h-7 shrink-0 rounded-full px-3 text-xs whitespace-nowrap no-underline"
            href={item.href}
            target="_blank"
            rel="noopener noreferrer"
            onPointerEnter={() => setNudging(true)}
            onPointerLeave={() => setNudging(false)}
            onFocus={() => setNudging(true)}
            onBlur={() => setNudging(false)}
          >
            Get the plugin
            {/* Nudges along its own diagonal - up and to the right, the way it
                already points and the way the link goes - while the pointer is
                on the button, and rests otherwise. Inline rather than a hover
                rule in the stylesheet: see the keyframes in index.css for why
                the decision lives here. `none` is explicit, so nothing in a
                stylesheet can start it. */}
            <ArrowUpRight
              className="size-3.5"
              aria-hidden="true"
              style={{
                animation: nudging && !reducedMotion
                  ? 'plugin-arrow-nudge 1.6s ease-in-out infinite'
                  : 'none',
                transition: reducedMotion ? 'none' : 'transform 200ms ease-out',
              }}
            />
            <span className="sr-only">
              on the {item.platform} Community (opens in a new tab)
            </span>
          </a>
        )}

        <button
          type="button"
          onClick={dismiss}
          aria-label="Dismiss"
          className={
            'ml-0.5 inline-flex size-7 shrink-0 cursor-pointer items-center ' +
            'justify-center rounded-full text-muted-foreground select-none ' +
            'hover:bg-muted hover:text-foreground'
          }
        >
          <X className="size-4" />
        </button>
      </div>
    </div>
  );
}
