import { useState, useMemo, useRef, useCallback } from 'react';
import { findNearestNamedColor } from '../utils/namedColors';
import { rgbToHex, rgbToHsb } from '../utils/colorConversions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Minus, Plus } from 'lucide-react';
import useDrag from '../hooks/useDrag';

export default function NamedColorMatch({ rgb, onAnimateToHsb, onHoverMatch }) {
  const [threshold, setThreshold] = useState(30);
  const trackRef = useRef(null);

  const match = useMemo(
    () => findNearestNamedColor(rgb.r, rgb.g, rgb.b),
    [rgb.r, rgb.g, rgb.b]
  );

  const matchHex = rgbToHex(match.r, match.g, match.b);
  const isMatch = match.distance <= threshold;
  const isExact = match.distance === 0;
  const textColor = (match.r * 0.299 + match.g * 0.587 + match.b * 0.114) > 150 ? '#000' : '#fff';

  const clamp = (v) => Math.max(0, Math.min(100, v));

  const updateFromTrack = useCallback((clientX) => {
    if (!trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    setThreshold(Math.round((x / rect.width) * 100));
  }, []);

  const { startDrag } = useDrag(useCallback((e) => {
    updateFromTrack(e.clientX);
  }, [updateFromTrack]));

  const handleClick = () => {
    if (isMatch && onAnimateToHsb) {
      onAnimateToHsb(rgbToHsb(match.r, match.g, match.b));
    }
  };

  const pct = threshold;

  return (
    <div id="html-names" className="border border-input rounded-lg p-2.5 flex flex-col gap-1.5 flex-1">
      <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">HTML Names</h3>
      <hr className="border-input" />
      <div className="flex flex-col gap-1.5 flex-1">
        {/* Color name display */}
        <div
          className="flex items-center justify-between gap-2 px-3 py-1.5 rounded-md shadow-sm"
          style={{
            backgroundColor: isMatch ? matchHex : 'transparent',
            color: isMatch ? textColor : 'var(--muted-foreground)',
            cursor: isMatch ? 'pointer' : 'default',
            border: isMatch ? '1px solid transparent' : '1px solid var(--input)',
            minHeight: 34,
          }}
          onClick={isMatch ? handleClick : undefined}
          onMouseEnter={isMatch ? () => onHoverMatch?.({ r: match.r, g: match.g, b: match.b }) : undefined}
          onMouseLeave={() => onHoverMatch?.(null)}
        >
          <span className={`text-sm ${isMatch ? 'font-semibold' : 'italic text-xs'}`}>
            {isMatch ? match.name : 'No match'}
          </span>
          {isMatch && !isExact && (
            <span className="text-xs opacity-70">~{match.distance}</span>
          )}
        </div>

        {/* Threshold slider + stepper */}
        <div className="flex items-start gap-2">
          <div className="flex-1 min-w-0 pb-3 relative">
            <div
              ref={trackRef}
              className="h-4 w-full rounded cursor-pointer select-none"
              style={{
                background: 'linear-gradient(to right, var(--muted), var(--foreground))',
                boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.1)',
              }}
              onMouseDown={(e) => {
                startDrag();
                updateFromTrack(e.clientX);
              }}
            />
            <div
              className="absolute top-4 -translate-x-1/2 cursor-pointer px-1 py-0.5"
              style={{ left: `${pct}%` }}
              onMouseDown={(e) => {
                e.preventDefault();
                startDrag();
              }}
            >
              <div
                className="w-0 h-0"
                style={{
                  borderLeft: '5px solid transparent',
                  borderRight: '5px solid transparent',
                  borderBottom: '6px solid var(--foreground)',
                }}
              />
            </div>
          </div>
          <div className="flex items-center h-6 shrink-0">
            <div className="flex items-center border border-input rounded-md overflow-hidden h-6 w-[84px]">
              <Button
                variant="ghost"
                size="icon-xs"
                className="h-6 w-5 rounded-none border-none"
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
                className="h-6 w-full border-none rounded-none text-right text-xs px-1 font-mono tabular-nums focus-visible:ring-0 focus-visible:border-transparent"
              />
              <Button
                variant="ghost"
                size="icon-xs"
                className="h-6 w-5 rounded-none border-none"
                tabIndex={-1}
                onClick={() => setThreshold(clamp(threshold + 1))}
              >
                <Plus className="!size-3" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
