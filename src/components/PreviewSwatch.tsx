import { useCallback, memo, type CSSProperties } from 'react';
import { toast } from 'sonner';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { getContrastTextColor } from '../utils/colorConversions';

function PreviewSwatch({ hex, className }: { hex: string; className?: string }) {
  const handleClick = useCallback(() => {
    navigator.clipboard.writeText(hex.toUpperCase()).then(() => {
      toast('Copied!', { duration: 2000 });
      if (navigator.vibrate) navigator.vibrate(8);
    });
  }, [hex]);

  const textColor = (() => {
    const r = parseInt(hex.slice(1, 3), 16) || 0;
    const g = parseInt(hex.slice(3, 5), 16) || 0;
    const b = parseInt(hex.slice(5, 7), 16) || 0;
    return getContrastTextColor(r, g, b, 150);
  })();

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          id="preview-swatch"
          role="button"
          aria-label={`Color swatch ${hex.toUpperCase()}. Click to copy.`}
          // Size in classes rather than inline, so a caller's container-query
          // variant can win: at narrow card widths the swatch becomes a band
          // above the SB box instead of a column beside it.
          className={cn('w-[50px] min-h-8 shrink-0 self-stretch cursor-pointer select-none rounded-md', className)}
          style={{ backgroundColor: hex, boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.1)' }}
          onClick={handleClick}
        />
      </TooltipTrigger>
      <TooltipContent
        side="bottom"
        sideOffset={8}
        className="text-xs font-semibold border-0"
        style={{ '--tooltip-bg': hex, backgroundColor: hex, color: textColor } as CSSProperties}
      >
        Click to copy
      </TooltipContent>
    </Tooltip>
  );
}

export default memo(PreviewSwatch);
