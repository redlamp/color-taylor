/**
 * Settings, as a right-edge sheet.
 *
 * It used to be a hand-rolled `position: fixed` <aside> that floated over the
 * app at top-20 right-4 and could be dragged anywhere. That carried its own
 * Escape listener, its own drag maths, a mobile-only backdrop, and a
 * hide-by-translating-off-screen trick - and with it a list of defects:
 *
 *   - `aria-hidden` on a subtree that stayed tabbable, so a closed panel's
 *     controls were still reachable by keyboard while hidden from screen
 *     readers. That is the textbook aria-hidden violation.
 *   - No dialog semantics, no focus trap, no focus return to the trigger.
 *   - Click-outside dismissed it on mobile only; on desktop nothing did.
 *   - Hiding by sliding "off the viewport" broke inside the presentation,
 *     where a transformed ancestor makes `fixed` resolve against the wrapper
 *     instead - 181px of a supposedly hidden panel sat on the last slide, and
 *     the fix had to live in the consumer (PresentationStage). Portalling to
 *     the body removes the failure mode rather than working around it.
 *   - The drag position was captured in an inline style guarded by a
 *     `window.innerWidth` read at render, so it went stale on resize/rotate.
 *
 * base-ui's Dialog supplies portal, backdrop, focus trap, focus restore,
 * Escape and click-outside, so all of the above is deleted rather than fixed.
 * The sheet shape is the same one the panel already used below `md` - now it
 * is the only shape, which is why the drag went: a panel anchored to an edge
 * has nowhere to be dragged to.
 */
import { useLayoutEffect, useState, type CSSProperties } from 'react';
import { Info, RotateCcw, X } from 'lucide-react';
import { Dialog as DialogPrimitive } from '@base-ui/react/dialog';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { AudioSettings } from '@/components/settings/AudioSettings';
import { DisplaySettings } from '@/components/settings/DisplaySettings';
import { IntegrationNews } from '@/components/settings/IntegrationNews';
import { SwitchRow } from '@/components/settings/SettingsSwitch';
import { useSettings } from '@/hooks/useSettings';
import { useTheme } from '@/hooks/useTheme';

interface Props {
  open: boolean;
  onClose: () => void;
  muted: boolean;
  onToggleMute: () => void;
  colorFx: boolean;
  highlights: boolean;
  onToggleHighlights: () => void;
  /** Reopen the welcome panel. */
  onAbout: () => void;
  onToggleColorFx: () => void;
}

export function SettingsPanel({
  open, onClose, muted, onToggleMute, colorFx, onToggleColorFx, highlights, onToggleHighlights,
  onAbout,
}: Props) {
  const { reset: resetSynth, settings, setAudioEnabled } = useSettings();
  const audioEnabled = settings.audioEnabled;
  const { reset: resetTheme } = useTheme();

  /*
   * Hang the rail from the row the content starts on.
   *
   * A fixed inset cannot be level with anything here: the header sits at 44px,
   * 77px or 107px from the top depending on how the title row and the plugin
   * banner wrap. The hexagon card is where the answer is - it is the first
   * thing in the app's own column and it moves with all of that.
   *
   * Out through a custom property so the media query stays in CSS; below `sm`
   * the rail is welded to the top edge and this does not apply. A layout effect
   * rather than an effect, so the measurement lands in the paint the panel
   * opens in instead of starting at the top and hopping down.
   */
  const [top, setTop] = useState<number | null>(null);
  useLayoutEffect(() => {
    if (!open) return;
    const measure = () => {
      const card = document.querySelector('#color-hexagon')?.getBoundingClientRect().top;
      if (card !== undefined) setTop(Math.max(8, Math.round(card)));
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [open]);

  const resetAll = () => {
    resetSynth();
    resetTheme();
    window.dispatchEvent(new CustomEvent('color-taylor:reset-all'));
  };

  return (
    <DialogPrimitive.Root open={open} onOpenChange={(next) => { if (!next) onClose(); }}>
      <DialogPrimitive.Portal>
        {/*
          Deliberately faint, and no backdrop-blur. Two of the settings behind
          it - theme and the border colour effects - are judged by looking at
          the app while you toggle them, and this is a colour tool besides, so
          the scrim says "modal" without recolouring what it sits over.
        */}
        <DialogPrimitive.Backdrop className="fixed inset-0 isolate z-50 bg-black/20 duration-200 data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0" />
        <DialogPrimitive.Popup
          /*
           * Edge to edge on a phone, a detached rail on a desktop.
           *
           * A sidebar either way - it hangs from the top right, it is not a
           * menu that drops out of its button - but on a wider window it stands
           * off the edges instead of being welded to them, and stops where its
           * contents stop. The border goes from one side to all four and the
           * corners round, because at that point it is a panel sitting on the
           * app rather than a wall built into it.
           *
           * `bottom-auto` is what lets it size to its contents; the cap keeps
           * the same 1rem inset at the foot, so a long list stops level with
           * where the rail would have ended rather than running off the screen.
           * It is measured from the top the rail is actually hanging from,
           * which is not a constant - see the layout effect above.
           *
           * Below `sm` it stays welded: there is no room to give away on a
           * phone, and an inset rail there is a rail with less rail in it.
           */
          className={
            'fixed top-0 right-0 bottom-0 z-50 flex w-[min(88vw,380px)] flex-col ' +
            'border-l border-border bg-background shadow-xl outline-none duration-200 ' +
            'sm:top-(--menu-top) sm:right-4 sm:bottom-auto ' +
            'sm:max-h-[calc(100dvh-var(--menu-top)-1rem)] ' +
            'sm:rounded-xl sm:border ' +
            'data-open:animate-in data-open:slide-in-from-right ' +
            'data-closed:animate-out data-closed:slide-out-to-right'
          }
          // 16px is the frame before the measurement, and the layout effect
          // beats the paint - so in practice it is the fallback for a host with
          // no hexagon on the page.
          style={{ '--menu-top': `${top ?? 16}px` } as CSSProperties}
        >
          <div className="flex items-center justify-between border-b border-border px-3 py-2">
            <DialogPrimitive.Title className="text-base font-semibold">Menu</DialogPrimitive.Title>
            <DialogPrimitive.Close
              aria-label="Close menu"
              className="cursor-pointer select-none rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <X className="size-4" />
            </DialogPrimitive.Close>
          </div>

          {/* `flex-1` fills the rail on a phone; `sm:flex-initial` lets the
              panel size to this instead. `min-h-0` is what allows it to shrink
              under the cap above rather than pushing the panel past it - without
              it the overflow never engages and the reset walks off screen.

              `pb-6` rather than `pb-3`: with the panel sized to its contents the
              divider now sits directly under the last switch, and a reset button
              is not something to put within a thumb's width of the thing above
              it. */}
          <div className="min-h-0 flex-1 sm:flex-initial overflow-y-auto px-3 pb-6">
            {/* First in the sheet, not last. It is the way in to what the tool
                is, so it belongs where someone opening the menu looks first -
                the reset at the foot is the way out. */}
            <Button
              variant="secondary"
              onClick={onAbout}
              className="mt-2 mb-3 w-full text-base"
            >
              <Info className="size-4" />
              About Color Taylor
            </Button>

            <Accordion multiple defaultValue={['display', 'audio']}>
              <AccordionItem value="display">
                <AccordionTrigger>Display</AccordionTrigger>
                <AccordionContent keepMounted>
                  <DisplaySettings
                    colorFx={colorFx}
                    highlights={highlights}
                    onToggleHighlights={onToggleHighlights}
                    onToggleColorFx={onToggleColorFx}
                  />
                </AccordionContent>
              </AccordionItem>
              {/* Audio is its own section, always present, and the switch that
                  brings the feature into existence is the first row in it -
                  which is where anyone looking for it would look. It used to
                  live under Display, because the section itself only appeared
                  once the feature was on and the switch needed somewhere to be;
                  a heading that is missing until you find its switch somewhere
                  else is a worse trade than an almost-empty section.

                  The controls below it stay conditional: AudioSettings previews
                  the synth as you adjust it, so mounting it while the feature is
                  off would pull the engine in behind the user's back. */}
              <AccordionItem value="audio">
                <AccordionTrigger>Audio</AccordionTrigger>
                <AccordionContent keepMounted>
                  <div className="flex flex-col gap-3 px-1">
                    <SwitchRow
                      // Not "Audio": it sits under a heading that already says
                      // that, and the row is the switch that turns the feature
                      // on rather than a setting within it.
                      label="Enable audio"
                      checked={audioEnabled}
                      onToggle={() => setAudioEnabled(!audioEnabled)}
                      ariaLabel="Toggle audio features"
                    />
                  </div>
                  {audioEnabled && <AudioSettings muted={muted} onToggleMute={onToggleMute} />}
                </AccordionContent>
              </AccordionItem>
            </Accordion>

            {/* Below the settings, not among them: it is news, not a control,
                and it hides itself from `sm` up where the banner takes over. */}
            <IntegrationNews />
          </div>

          <div className="border-t border-border px-3 py-2">
            <Button variant="secondary" size="sm" onClick={resetAll} className="w-full text-base">
              <RotateCcw className="size-4" />
              Default Settings
            </Button>
          </div>
        </DialogPrimitive.Popup>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
