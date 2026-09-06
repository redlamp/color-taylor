import { useState, useMemo, memo, type CSSProperties } from 'react';
import { findNearestNamedColor } from '../utils/namedColors';
import NAMED_COLORS from '../utils/namedColors';
import { rgbToHex, rgbToHsb } from '../utils/colorConversions';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { Search, Tags } from 'lucide-react';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Command, CommandInput, CommandList, CommandEmpty, CommandItem } from '@/components/ui/command';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

interface NamedColorMatchProps {
  rgb: { r: number; g: number; b: number };
  onAnimateToHsb: (target: { h: number; s: number; b: number }) => void;
  onHoverMatch: (rgb: { r: number; g: number; b: number } | null) => void;
  hoveredHtmlColor: { hex: string; name: string } | null;
  showOnHex: boolean;
  onShowOnHexChange: (v: boolean) => void;
}

function NamedColorMatch({ rgb, onAnimateToHsb, onHoverMatch, hoveredHtmlColor, showOnHex, onShowOnHexChange }: NamedColorMatchProps) {
  const [threshold] = useState(30);

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

  const [hovering, setHovering] = useState(false);
  const [comboOpen, setComboOpen] = useState(false);
  // Controlled, like the blend toggle's: the tooltip names the state the
  // press changes, and base-ui would otherwise close it on the press and not
  // reopen until the pointer left and came back.
  const [tagsTipOpen, setTagsTipOpen] = useState(false);

  const handleClick = () => {
    if (isMatch && onAnimateToHsb) {
      onAnimateToHsb(rgbToHsb(matchR, matchG, matchB));
      if (navigator.vibrate) navigator.vibrate(10);
    }
  };

  return (
    <div className="flex flex-col gap-2 @container/match">
      <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] gap-2 items-stretch">
        <Popover open={comboOpen} onOpenChange={setComboOpen}>
          <PopoverTrigger asChild>
            <button className="flex items-center justify-center h-8 w-[50px] @max-xs/match:w-9 border border-input rounded-md bg-transparent text-muted-foreground cursor-pointer hover:text-foreground">
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
              <span className={`text-sm truncate min-w-0 ${isMatch ? 'font-semibold' : 'italic text-xs'}`}>
                {isMatch ? display.name : 'No match'}
              </span>
              {isMatch && !isExact && (
                <span className="text-xs opacity-70 shrink-0 @max-xs/match:hidden">~{display.distance}</span>
              )}
            </button>
          </TooltipTrigger>
          {isMatch && hovering && (
            <TooltipContent
              side="bottom"
              sideOffset={8}
              className="text-xs font-mono font-semibold border-0"
              style={{ '--tooltip-bg': matchHex, backgroundColor: matchHex, color: textColor } as CSSProperties}
            >
              {matchHex.toUpperCase()}
            </TooltipContent>
          )}
        </Tooltip>
        {/* One pressed pill, the shape of the blend toggle: pressed, the named
            colours are pinned on the hexagon. It was a Show / Hide pair at
            full width and an eye at narrow widths; one control now serves
            both, and the name chip gets the width the pair took. */}
        <ToggleGroup
          multiple
          value={showOnHex ? ['tags'] : []}
          onValueChange={(v) => onShowOnHexChange?.(v.length > 0)}
        >
          <Tooltip
            open={tagsTipOpen}
            onOpenChange={(next) => { if (next) setTagsTipOpen(true); }}
          >
            <TooltipTrigger
              render={
                <ToggleGroupItem
                  value="tags"
                  className="px-2"
                  id="html-colors-toggle"
                  onPointerEnter={() => setTagsTipOpen(true)}
                  onPointerLeave={() => setTagsTipOpen(false)}
                  onFocus={() => setTagsTipOpen(true)}
                  onBlur={() => setTagsTipOpen(false)}
                  aria-label={showOnHex ? 'Hide HTML colors on hex' : 'Show HTML colors on hex'}
                >
                  <Tags />
                </ToggleGroupItem>
              }
            />
            <TooltipContent side="top" sideOffset={4} className="text-sm font-semibold">
              {showOnHex ? 'HTML colors on the hexagon' : 'HTML colors hidden'}
            </TooltipContent>
          </Tooltip>
        </ToggleGroup>
      </div>
    </div>
  );
}

export default memo(NamedColorMatch);
