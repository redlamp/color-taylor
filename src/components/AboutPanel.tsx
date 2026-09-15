/**
 * The first thing a new visitor sees, and the About panel afterwards.
 *
 * One sentence and three ways out. It is not a tour and it is not a settings
 * screen: the tour is behind "Demo", the narrated walkthrough behind
 * "Presentation", and everything else is the picker, which is already on
 * screen behind the scrim. Since the header's ? opens this panel rather than
 * starting the demo, this card is the one door to both.
 *
 * Dismissing is deliberately loose - the panel, the scrim, Escape, and every
 * button close it. Nothing here is a decision, so nothing here should need
 * aiming at. The two that are not just a dismissal are the demo and the
 * presentation, which close this and start something.
 */

import { useEffect, useState, type ReactNode } from 'react';
import { Dialog as DialogPrimitive } from '@base-ui/react/dialog';
import { Film, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * The narrated walkthrough drives the full desktop layout - it drags a camera
 * panel around the margin and points at controls that are not on screen at all
 * on a phone - so below this the entry is not offered.
 */
const PRESENTATION_MIN_WIDTH = 900;

/**
 * Live, not read once: someone who widens a window should be offered the
 * presentation without reloading, and someone who narrows one should stop
 * being offered it. A walkthrough already running is unaffected - the host
 * owns that state, not this panel.
 */
function useMinWidth(px: number): boolean {
  const [matches, setMatches] = useState(() => {
    try { return window.matchMedia(`(min-width: ${px}px)`).matches; } catch { return true; }
  });
  useEffect(() => {
    let mq: MediaQueryList;
    try { mq = window.matchMedia(`(min-width: ${px}px)`); } catch { return; }
    const onChange = () => setMatches(mq.matches);
    onChange();
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [px]);
  return matches;
}

export interface AboutPanelProps {
  open: boolean;
  onClose: () => void;
  /** Close and hand over to the self-running demo. */
  onWatchDemo: () => void;
  /** Close and hand over to the narrated walkthrough. Desktop widths only. */
  onPresentation: () => void;
}

export function AboutPanel({ open, onClose, onWatchDemo, onPresentation }: AboutPanelProps) {
  const roomForPresentation = useMinWidth(PRESENTATION_MIN_WIDTH);
  return (
    <DialogPrimitive.Root open={open} onOpenChange={(next) => { if (!next) onClose(); }}>
      <DialogPrimitive.Portal>
        {/* Darker than the settings sheet's. That one is there to be looked
            past while you judge a colour; this one is the thing being read. */}
        {/* A little blur, unlike the settings sheet, which has none on purpose
            because you judge a colour against the app while toggling things
            behind it. Nothing behind this one is being judged. Small on
            purpose: the picker being recognisable behind the invitation is
            part of the invitation. */}
        <DialogPrimitive.Backdrop className="fixed inset-0 isolate z-50 bg-black/45 backdrop-blur-[6px] duration-200 data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0" />
        <DialogPrimitive.Popup
          // The whole card closes on click. The buttons below still do their
          // own work first; this is the catch-all for everywhere else.
          data-testid="about-panel"
          onClick={onClose}
          className={
            // `speaks` is the drifting channel hairline the demo's caption
            // panel wears. These two are the only surfaces where the app is
            // talking rather than being used, which is what the ornament means.
            'speaks fixed top-1/2 left-1/2 z-50 w-[min(92vw,560px)] -translate-x-1/2 -translate-y-1/2 ' +
            // Asymmetric on purpose: the credit is a footnote, and the room a
            // title needs above it is not the room a footnote needs below.
            'cursor-pointer rounded-2xl bg-card px-8 pt-11 pb-7 text-center ' +
            'shadow-2xl outline-none duration-200 ' +
            'data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 ' +
            'data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95'
          }
        >
          {/* The emoji sit outside .wordmark on purpose: that class paints the
              glyphs with a background clipped to the text, so anything inside
              it loses its own colour. Same reason as the header's title. */}
          {/* Wide enough to hold this on one line: the wordmark breaking off
              its emoji reads as a layout fault rather than as a title. */}
          <DialogPrimitive.Title id="about-title" className="text-3xl font-semibold whitespace-nowrap sm:text-5xl">
            <span className="wordmark">Color Taylor</span>{' '}
            <span className="whitespace-nowrap">🎨🧵</span>
          </DialogPrimitive.Title>

          {/* Two lines, and the break is the point: the first is the
              invitation, the second is what to look for while you take it. */}
          <DialogPrimitive.Description className="mx-auto mt-6 text-2xl leading-snug text-muted-foreground">
            {/* Non-breaking, so "models," never lands alone on its own line
                when the card narrows. */}
            Play with different color{' '}modes,
            <br />
            {/* The whole clause leans; only the verb is lit. */}
            <em>
              <span className="text-foreground">see</span> how they move together!
            </em>
          </DialogPrimitive.Description>

          {/* Get Started is the way out, so it gets the row to itself; Demo
              and Presentation are the two things to watch, so they share the
              second row instead of competing with a decision for space. Both
              rows sit in one capped, centred column so row two - one button
              wide when gated, two when not - always measures out to exactly
              what row one has.

              `2xl` again, now that row two never holds more than two: it is
              only "Presentation" set against three columns that overflowed,
              and that arrangement is gone. */}
          <div className="mx-auto mt-9 max-w-[26rem] space-y-3">
            <div>
              <Button id="about-close" size="2xl" className="w-full" onClick={(e) => { e.stopPropagation(); onClose(); }}>
                Get Started
              </Button>
            </div>
            {/* The ids are for the video script runner, which points at these
                by name (about-watch-demo, about-presentation). One column
                below `sm`, where everything stacks; two from `sm` up, unless
                the walkthrough is gated out, in which case Demo alone still
                fills the row rather than sitting half-width. */}
            <div className={'grid gap-3 ' + (roomForPresentation ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1')}>
              <div>
                <Button
                  id="about-watch-demo"
                  variant="secondary"
                  size="2xl"
                  className="w-full"
                  onClick={(e) => { e.stopPropagation(); onWatchDemo(); }}
                >
                  <Play />
                  Demo
                </Button>
                <Caption>40 seconds</Caption>
              </div>
              {/* Not disabled below 900: an entry that cannot be taken is a
                  question the visitor has to answer, and there is nothing they
                  could do about this one. */}
              {roomForPresentation && (
                <div>
                  <Button
                    id="about-presentation"
                    variant="secondary"
                    size="2xl"
                    className="w-full"
                    onClick={(e) => { e.stopPropagation(); onPresentation(); }}
                  >
                    <Film />
                    Presentation
                  </Button>
                  <Caption>~5.5 min</Caption>
                </div>
              )}
            </div>
          </div>

          {/* The link keeps the click to itself: everything else on this card
              dismisses it, and a panel that vanishes as a new tab opens behind
              it is a confusing way to leave. https rather than http - the site
              redirects, so this is the same destination without the hop. */}
          <p className="mt-10 text-base text-muted-foreground">
            Made by{' '}
            <a
              id="about-author"
              href="https://redlamp.org"
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="cursor-pointer text-foreground underline underline-offset-4 hover:no-underline"
            >
              Taylor Wright
            </a>
          </p>
        </DialogPrimitive.Popup>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

/**
 * The running time under an entry. `text-base` like the rest of the app's
 * text: it fits under the button at every width the card takes, so there is
 * no reason to step it down. Muted and centred is what makes it read as a
 * caption rather than as a second label.
 */
function Caption({ children }: { children: ReactNode }) {
  return <p className="mt-1.5 text-center text-base text-muted-foreground">{children}</p>;
}
