import { useEffect, useRef, useState } from 'react';
import { X, RotateCcw } from 'lucide-react';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { AudioSettings } from '@/components/settings/AudioSettings';
import { DisplaySettings } from '@/components/settings/DisplaySettings';
import { useSettings } from '@/hooks/useSettings';
import { useTheme } from '@/hooks/useTheme';

interface Props {
  open: boolean;
  onClose: () => void;
  muted: boolean;
  onToggleMute: () => void;
  colorFx: boolean;
  onToggleColorFx: () => void;
}

export function SettingsPanel({ open, onClose, muted, onToggleMute, colorFx, onToggleColorFx }: Props) {
  const { reset: resetSynth } = useSettings();
  const { reset: resetTheme } = useTheme();
  const asideRef = useRef<HTMLElement | null>(null);
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const dragOffset = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const resetAll = () => {
    resetSynth();
    resetTheme();
    window.dispatchEvent(new CustomEvent('color-taylor:reset-all'));
  };

  const onHeaderPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (window.innerWidth < 768) return;
    if (e.target instanceof Element && e.target.closest('button')) return;
    const aside = asideRef.current;
    if (!aside) return;
    const rect = aside.getBoundingClientRect();
    dragOffset.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    setPos({ x: rect.left, y: rect.top });
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onHeaderPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragOffset.current) return;
    const aside = asideRef.current;
    const w = aside?.offsetWidth ?? 360;
    const h = aside?.offsetHeight ?? 200;
    const nx = Math.max(0, Math.min(window.innerWidth - w, e.clientX - dragOffset.current.x));
    const ny = Math.max(0, Math.min(window.innerHeight - h, e.clientY - dragOffset.current.y));
    setPos({ x: nx, y: ny });
  };
  const onHeaderPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragOffset.current) return;
    dragOffset.current = null;
    try { e.currentTarget.releasePointerCapture(e.pointerId); } catch { /* */ }
  };

  return (
    <>
      {/* Mobile backdrop */}
      <div
        className={
          'md:hidden fixed inset-0 z-40 bg-black/40 transition-opacity ' +
          (open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none')
        }
        onClick={onClose}
      />
      <aside
        ref={asideRef}
        aria-hidden={!open}
        className={
          'fixed z-50 bg-background border border-input rounded-lg shadow-xl ' +
          // Read dragOffset ref during render to switch transition style — avoids
          // triggering a re-render on every drag frame. Lint exception intentional.
          // eslint-disable-next-line react-hooks/refs
          (dragOffset.current ? '' : (pos ? 'transition-opacity duration-200 ease-out ' : 'transition-transform duration-200 ease-out ')) +
          'flex flex-col ' +
          // desktop default position (overridden by inline style when dragged)
          (pos ? '' : 'md:top-20 md:right-4 ') +
          'md:w-[360px] md:max-h-[calc(100vh-6rem)] ' +
          // mobile
          'max-md:top-0 max-md:right-0 max-md:bottom-0 max-md:w-[88vw] max-md:max-w-[360px] max-md:rounded-none max-md:border-l max-md:border-y-0 max-md:border-r-0 ' +
          (pos
            ? (open ? 'opacity-100' : 'opacity-0 pointer-events-none')
            : (open ? 'translate-x-0' : 'translate-x-[110%]'))
        }
        style={pos && window.innerWidth >= 768 ? { top: pos.y, left: pos.x, right: 'auto' } : undefined}
      >
        <div
          className="flex items-center justify-between px-3 py-2 border-b border-input md:cursor-grab md:active:cursor-grabbing select-none md:touch-none"
          onPointerDown={onHeaderPointerDown}
          onPointerMove={onHeaderPointerMove}
          onPointerUp={onHeaderPointerUp}
          onPointerCancel={onHeaderPointerUp}
        >
          <h2 className="text-sm font-semibold">Settings</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close settings"
            className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer select-none"
          >
            <X className="size-4" />
          </button>
        </div>
        <div className="overflow-y-auto px-3 pb-3 flex-1">
          <Accordion multiple defaultValue={['display', 'audio']}>
            <AccordionItem value="display">
              <AccordionTrigger>Display</AccordionTrigger>
              <AccordionContent keepMounted>
                <DisplaySettings colorFx={colorFx} onToggleColorFx={onToggleColorFx} />
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="audio">
              <AccordionTrigger>Audio</AccordionTrigger>
              <AccordionContent keepMounted>
                <AudioSettings muted={muted} onToggleMute={onToggleMute} />
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
        <div className="border-t border-input px-3 py-2">
          <Button variant="secondary" size="sm" onClick={resetAll} className="w-full">
            <RotateCcw className="size-4" />
            Reset all settings
          </Button>
        </div>
      </aside>
    </>
  );
}
