import { useCallback, memo } from 'react';
import { toast } from 'sonner';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

function PreviewSwatch({ hex, className }: { hex: string; className?: string }) {
  const handleClick = useCallback(() => {
    navigator.clipboard.writeText(hex.toUpperCase()).then(() => {
      toast('Copied!', { duration: 2000 });
      if (navigator.vibrate) navigator.vibrate(8);
    });
  }, [hex]);

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
      <TooltipContent side="top" sideOffset={4} className="text-sm font-semibold">
        Click to copy
      </TooltipContent>
    </Tooltip>
  );
}

export default memo(PreviewSwatch);
