import { useCallback } from 'react';
import { toast } from 'sonner';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';

export default function PreviewSwatch({ hex }) {
  const handleClick = useCallback(() => {
    navigator.clipboard.writeText(hex.toUpperCase()).then(() => {
      toast('Copied!', { duration: 2000 });
    });
  }, [hex]);

  const textColor = (() => {
    const r = parseInt(hex.slice(1, 3), 16) || 0;
    const g = parseInt(hex.slice(3, 5), 16) || 0;
    const b = parseInt(hex.slice(5, 7), 16) || 0;
    return (r * 0.299 + g * 0.587 + b * 0.114) > 150 ? '#000' : '#fff';
  })();

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          id="preview-swatch"
          role="button"
          aria-label={`Color swatch ${hex.toUpperCase()}. Click to copy.`}
          className="shrink-0 cursor-pointer select-none rounded-md"
          style={{ width: 50, minHeight: 32, height: '100%', backgroundColor: hex, boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.1)' }}
          onClick={handleClick}
        />
      </TooltipTrigger>
      <TooltipContent
        side="bottom"
        sideOffset={8}
        className="text-xs font-semibold border-0"
        style={{ '--tooltip-bg': hex, backgroundColor: hex, color: textColor }}
      >
        Click to copy
      </TooltipContent>
    </Tooltip>
  );
}
