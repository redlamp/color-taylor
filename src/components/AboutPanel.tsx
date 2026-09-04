/**
 * The first thing a new visitor sees, and the About panel afterwards.
 *
 * One sentence and two ways out. It is not a tour and it is not a settings
 * screen: the tour is behind "Watch the demo", and everything else is the
 * picker, which is already on screen behind the scrim.
 *
 * Dismissing is deliberately loose - the panel, the scrim, Escape, and both
 * buttons all close it. Nothing here is a decision, so nothing here should
 * need aiming at. The one thing that is not just a dismissal is the demo,
 * which closes this and starts the tour.
 */

import { Dialog as DialogPrimitive } from '@base-ui/react/dialog';
import { Play } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface AboutPanelProps {
  open: boolean;
  onClose: () => void;
  /** Close and hand over to the self-running demo. */
  onWatchDemo: () => void;
}

export function AboutPanel({ open, onClose, onWatchDemo }: AboutPanelProps) {
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
            'cursor-pointer rounded-2xl bg-card px-8 py-11 text-center ' +
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
          <DialogPrimitive.Title className="text-3xl font-semibold whitespace-nowrap sm:text-5xl">
            <span className="wordmark">Color Taylor</span>{' '}
            <span className="whitespace-nowrap">🎨🧵</span>
          </DialogPrimitive.Title>

          {/* Two lines, and the break is the point: the first is the
              invitation, the second is what to look for while you take it. */}
          <DialogPrimitive.Description className="mx-auto mt-6 text-xl leading-snug text-balance text-muted-foreground sm:text-2xl">
            Have fun with different color modes
            <br />
            <em className="text-foreground">see</em> how they move together
          </DialogPrimitive.Description>

          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
            <Button
              variant="secondary"
              onClick={(e) => { e.stopPropagation(); onWatchDemo(); }}
            >
              <Play className="size-4" />
              Watch the demo
            </Button>
            <Button onClick={(e) => { e.stopPropagation(); onClose(); }}>
              Get started
            </Button>
          </div>
        </DialogPrimitive.Popup>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
