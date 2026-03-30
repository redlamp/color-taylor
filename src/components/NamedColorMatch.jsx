import { useState, useMemo, useRef } from 'react';
import { findNearestNamedColor } from '../utils/namedColors';
import NAMED_COLORS from '../utils/namedColors';
import { rgbToHex, rgbToHsb } from '../utils/colorConversions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { Minus, Plus, Search } from 'lucide-react';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Command, CommandInput, CommandList, CommandEmpty, CommandItem } from '@/components/ui/command';

export default function NamedColorMatch({ rgb, onAnimateToHsb, onHoverMatch, hoveredHtmlColor }) {
  const [threshold, setThreshold] = useState(30);

  const match = useMemo(
    () => findNearestNamedColor(rgb.r, rgb.g, rgb.b),
    [rgb.r, rgb.g, rgb.b]
  );

  // Show hovered HTML color from hex if available, otherwise show nearest match
  const display = hoveredHtmlColor
    ? { name: hoveredHtmlColor.name, hex: hoveredHtmlColor.hex, distance: 0, isMatch: true, isExact: true }
    : { name: match.name, hex: rgbToHex(match.r, match.g, match.b), distance: match.distance, isMatch: match.distance <= threshold, isExact: match.distance === 0 };

  const matchHex = display.hex;
  const isMatch = display.isMatch;
  const isExact = display.isExact;
  const matchR = hoveredHtmlColor ? parseInt(matchHex.slice(1, 3), 16) : match.r;
  const matchG = hoveredHtmlColor ? parseInt(matchHex.slice(3, 5), 16) : match.g;
  const matchB = hoveredHtmlColor ? parseInt(matchHex.slice(5, 7), 16) : match.b;
  const textColor = (matchR * 0.299 + matchG * 0.587 + matchB * 0.114) > 150 ? '#000' : '#fff';

  const clamp = (v) => Math.max(0, Math.min(100, v));
  const [hovering, setHovering] = useState(false);
  const [comboOpen, setComboOpen] = useState(false);

  const handleClick = () => {
    if (isMatch && onAnimateToHsb) {
      onAnimateToHsb(rgbToHsb(matchR, matchG, matchB));
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr auto', gap: 8, alignItems: 'stretch' }}>
        <Popover open={comboOpen} onOpenChange={setComboOpen}>
          <PopoverTrigger>
            <button className="flex items-center justify-center w-8 h-8 border border-input rounded-md bg-transparent text-muted-foreground cursor-pointer hover:text-foreground">
              <Search className="!size-4" />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-0" side="top" sideOffset={4} align="start">
            <Command className="flex flex-col-reverse">
              <CommandInput placeholder="Search colors..." className="text-sm" />
              <CommandList>
                <CommandEmpty>No color found.</CommandEmpty>
                {NAMED_COLORS.map((c) => {
                  const hex = rgbToHex(c.r, c.g, c.b);
                  return (
                    <CommandItem
                      key={c.name}
                      value={c.name}
                      onSelect={() => {
                        if (onAnimateToHsb) {
                          onAnimateToHsb(rgbToHsb(c.r, c.g, c.b));
                        }
                        setComboOpen(false);
                      }}
                      className="flex items-center gap-2 text-sm cursor-pointer"
                      onMouseEnter={() => onHoverMatch?.({ r: c.r, g: c.g, b: c.b })}
                      onMouseLeave={() => onHoverMatch?.(null)}
                    >
                      <div className="w-4 h-4 rounded-sm shrink-0" style={{ backgroundColor: hex }} />
                      <span className="flex-1">{c.name}</span>
                      <span className="font-mono text-xs text-muted-foreground text-right">{hex}</span>
                    </CommandItem>
                  );
                })}
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
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
                {isMatch ? display.name : 'No match'}
              </span>
              {isMatch && !isExact && (
                <span className="text-xs opacity-70">~{display.distance}</span>
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
    </div>
  );
}
