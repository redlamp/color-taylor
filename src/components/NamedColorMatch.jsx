import { useState, useMemo, useRef } from 'react';
import { findNearestNamedColor } from '../utils/namedColors';
import { rgbToHex, rgbToHsb } from '../utils/colorConversions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { Minus, Plus } from 'lucide-react';

export default function NamedColorMatch({ rgb, onAnimateToHsb, onHoverMatch }) {
  const [threshold, setThreshold] = useState(30);

  const match = useMemo(
    () => findNearestNamedColor(rgb.r, rgb.g, rgb.b),
    [rgb.r, rgb.g, rgb.b]
  );

  const matchHex = rgbToHex(match.r, match.g, match.b);
  const isMatch = match.distance <= threshold;
  const isExact = match.distance === 0;
  const textColor = (match.r * 0.299 + match.g * 0.587 + match.b * 0.114) > 150 ? '#000' : '#fff';

  const clamp = (v) => Math.max(0, Math.min(100, v));
  const [hovering, setHovering] = useState(false);

  const handleClick = () => {
    if (isMatch && onAnimateToHsb) {
      onAnimateToHsb(rgbToHsb(match.r, match.g, match.b));
    }
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 8, alignItems: 'stretch' }}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            className="flex items-center justify-between gap-2 px-3 rounded-md shadow-sm w-full text-left"
            style={{
              backgroundColor: isMatch ? matchHex : 'transparent',
              color: isMatch ? textColor : 'var(--muted-foreground)',
              cursor: isMatch ? 'pointer' : 'default',
              border: isMatch ? '1px solid transparent' : '1px solid var(--input)',
              minHeight: 32,
            }}
            onClick={isMatch ? handleClick : undefined}
            onMouseEnter={() => {
              setHovering(true);
              if (isMatch) onHoverMatch?.({ r: match.r, g: match.g, b: match.b });
            }}
            onMouseLeave={() => {
              setHovering(false);
              onHoverMatch?.(null);
            }}
          >
            <span className={`text-sm ${isMatch ? 'font-semibold' : 'italic text-xs'}`}>
              {isMatch ? match.name : 'No match'}
            </span>
            {isMatch && !isExact && (
              <span className="text-xs opacity-70">~{match.distance}</span>
            )}
          </button>
        </TooltipTrigger>
        {isMatch && hovering && (
          <TooltipContent
            side="bottom"
            sideOffset={8}
            className="text-xs font-mono font-semibold border-0"
            style={{ '--tooltip-bg': matchHex, backgroundColor: matchHex, color: textColor }}
          >
            {matchHex.toUpperCase()}
          </TooltipContent>
        )}
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center border border-input rounded-md overflow-hidden h-8 w-[84px]">
            <Button
              variant="ghost"
              size="icon-xs"
              className="h-8 w-5 rounded-none border-none"
              tabIndex={-1}
              onClick={() => setThreshold(clamp(threshold - 1))}
            >
              <Minus className="!size-3" />
            </Button>
            <Input
              type="text"
              inputMode="numeric"
              value={threshold}
              onChange={(e) => {
                const v = parseInt(e.target.value, 10);
                if (!isNaN(v)) setThreshold(clamp(v));
              }}
              className="h-8 w-full border-none rounded-none text-right text-xs px-1 font-mono tabular-nums focus-visible:ring-0 focus-visible:border-transparent"
            />
            <Button
              variant="ghost"
              size="icon-xs"
              className="h-8 w-5 rounded-none border-none"
              tabIndex={-1}
              onClick={() => setThreshold(clamp(threshold + 1))}
            >
              <Plus className="!size-3" />
            </Button>
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" sideOffset={8} className="text-xs font-semibold">
          Tolerance
        </TooltipContent>
      </Tooltip>
    </div>
  );
}
