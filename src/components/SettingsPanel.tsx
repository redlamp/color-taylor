import { useEffect } from 'react';
import { X } from 'lucide-react';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
import { AudioSettings } from '@/components/settings/AudioSettings';

interface Props {
  open: boolean;
  onClose: () => void;
}

export function SettingsPanel({ open, onClose }: Props) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

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
        aria-hidden={!open}
        className={
          'fixed z-50 bg-background border border-input rounded-lg shadow-xl ' +
          'transition-transform duration-200 ease-out flex flex-col ' +
          // desktop
          'md:top-20 md:right-4 md:w-[360px] md:max-h-[calc(100vh-6rem)] ' +
          // mobile
          'max-md:top-0 max-md:right-0 max-md:bottom-0 max-md:w-[88vw] max-md:max-w-[360px] max-md:rounded-none max-md:border-l max-md:border-y-0 max-md:border-r-0 ' +
          (open ? 'translate-x-0' : 'translate-x-[110%]')
        }
      >
        <div className="flex items-center justify-between px-3 py-2 border-b border-input">
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
        <div className="overflow-y-auto px-3 pb-3">
          <Accordion defaultValue={['audio']}>
            <AccordionItem value="audio">
              <AccordionTrigger>Audio</AccordionTrigger>
              <AccordionContent>
                <AudioSettings />
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </aside>
    </>
  );
}
