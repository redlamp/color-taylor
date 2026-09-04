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
        <DialogPrimitive.Backdrop className="fixed inset-0 isolate z-50 bg-black/45 duration-200 data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0" />
        <DialogPrimitive.Popup
          // The whole card closes on click. The buttons below still do their
          // own work first; this is the catch-all for everywhere else.
          data-testid="about-panel"
          onClick={onClose}
          className={
            'fixed top-1/2 left-1/2 z-50 w-[min(92vw,460px)] -translate-x-1/2 -translate-y-1/2 ' +
            'cursor-pointer rounded-2xl border border-border bg-card px-7 py-8 text-center ' +
            'shadow-2xl outline-none duration-200 ' +
            'data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 ' +
            'data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95'
          }
        >
          {/* The emoji sit outside .wordmark on purpose: that class paints the
              glyphs with a background clipped to the text, so anything inside
              it loses its own colour. Same reason as the header's title. */}
          <DialogPrimitive.Title className="text-4xl font-semibold sm:text-5xl">
            <span className="wordmark">Color Taylor</span>{' '}
            <span className="whitespace-nowrap">🎨🧵</span>
          </DialogPrimitive.Title>

          <DialogPrimitive.Description className="mx-auto mt-4 max-w-[34ch] text-base text-muted-foreground sm:text-lg">
            Have fun with different color modes and see how they move together.
          </DialogPrimitive.Description>

          <div className="mt-7 flex flex-wrap items-center justify-center gap-2">
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
