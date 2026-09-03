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
import { RotateCcw, X } from 'lucide-react';
import { Dialog as DialogPrimitive } from '@base-ui/react/dialog';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { AudioSettings } from '@/components/settings/AudioSettings';
import { DisplaySettings } from '@/components/settings/DisplaySettings';
import { IntegrationNews } from '@/components/settings/IntegrationNews';
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
  onToggleColorFx: () => void;
}

export function SettingsPanel({
  open, onClose, muted, onToggleMute, colorFx, onToggleColorFx, highlights, onToggleHighlights,
}: Props) {
  const { reset: resetSynth, settings, setAudioEnabled } = useSettings();
  const audioEnabled = settings.audioEnabled;
  const { reset: resetTheme } = useTheme();

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
          className={
            'fixed top-0 right-0 bottom-0 z-50 flex w-[min(88vw,380px)] flex-col ' +
            'border-l border-border bg-background shadow-xl outline-none duration-200 ' +
            'data-open:animate-in data-open:slide-in-from-right ' +
            'data-closed:animate-out data-closed:slide-out-to-right'
          }
        >
          <div className="flex items-center justify-between border-b border-border px-3 py-2">
            <DialogPrimitive.Title className="text-sm font-semibold">Settings</DialogPrimitive.Title>
            <DialogPrimitive.Close
              aria-label="Close settings"
              className="cursor-pointer select-none rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <X className="size-4" />
            </DialogPrimitive.Close>
          </div>

          <div className="flex-1 overflow-y-auto px-3 pb-3">
            <Accordion multiple defaultValue={['display', 'audio']}>
              <AccordionItem value="display">
                <AccordionTrigger>Display</AccordionTrigger>
                <AccordionContent keepMounted>
                  <DisplaySettings
                    colorFx={colorFx}
                    highlights={highlights}
                    onToggleHighlights={onToggleHighlights}
                    onToggleColorFx={onToggleColorFx}
                    audioEnabled={audioEnabled}
                    onToggleAudio={() => setAudioEnabled(!audioEnabled)}
                  />
                </AccordionContent>
              </AccordionItem>
              {/* The Audio section only exists once the feature is switched on -
                  its own switch lives in Display, which is always there, so there
                  is somewhere to turn it on from. AudioSettings previews the synth
                  as you adjust it, so mounting it while the feature is off would
                  pull the engine in behind the user's back. */}
              {audioEnabled && (
                <AccordionItem value="audio">
                  <AccordionTrigger>Audio</AccordionTrigger>
                  <AccordionContent keepMounted>
                    <AudioSettings muted={muted} onToggleMute={onToggleMute} />
                  </AccordionContent>
                </AccordionItem>
              )}
            </Accordion>

            {/* Below the settings, not among them: it is news, not a control,
                and it hides itself from `sm` up where the banner takes over. */}
            <IntegrationNews />
          </div>

          <div className="border-t border-border px-3 py-2">
            <Button variant="secondary" size="sm" onClick={resetAll} className="w-full">
              <RotateCcw className="size-4" />
              Reset all settings
            </Button>
          </div>
        </DialogPrimitive.Popup>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
