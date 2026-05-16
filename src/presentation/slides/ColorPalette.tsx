import { useMemo } from 'react';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';

const CGA_16 = [
  '#000000', '#0000AA', '#00AA00', '#00AAAA',
  '#AA0000', '#AA00AA', '#AA5500', '#AAAAAA',
  '#555555', '#5555FF', '#55FF55', '#55FFFF',
  '#FF5555', '#FF55FF', '#FFFF55', '#FFFFFF',
];

// Classic 216 web-safe colors (6x6x6 cube) + 40 grays to reach 256
function generateWebSafe256() {
  const colors = [];
  const steps = [0x00, 0x33, 0x66, 0x99, 0xCC, 0xFF];
  for (const r of steps) {
    for (const g of steps) {
      for (const b of steps) {
        colors.push('#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join(''));
      }
    }
  }
  // Fill remaining 40 slots with grays
  for (let i = 0; colors.length < 256; i++) {
    const v = Math.round((i / 39) * 255);
    const hex = '#' + v.toString(16).padStart(2, '0').repeat(3);
    if (!colors.includes(hex)) colors.push(hex);
  }
  return colors.slice(0, 256);
}

export default function ColorPalette({ palette }) {
  const colors = useMemo(() => {
    if (palette === 'cga16') return CGA_16;
    if (palette === 'websafe256') return generateWebSafe256();
    return [];
  }, [palette]);

  const is16 = palette === 'cga16';
  const cols = is16 ? 4 : 16;
  const cellSize = is16 ? 64 : 24;
  const label = is16
    ? 'picked from a fixed list.'
    : 'indexed color \u2014 each one has a number.';

  return (
    <div className="flex flex-col items-center gap-6">
      <p className="text-sm text-muted-foreground tracking-wide uppercase">{label}</p>
      <div
        className="grid border border-muted-foreground/20 rounded overflow-hidden"
        style={{
          gridTemplateColumns: `repeat(${cols}, ${cellSize}px)`,
        }}
      >
        {colors.map((color, i) => (
          <Tooltip key={i}>
            <TooltipTrigger asChild>
              <div
                style={{
                  width: cellSize,
                  height: cellSize,
                  backgroundColor: color,
                }}
              />
            </TooltipTrigger>
            <TooltipContent side="bottom" sideOffset={4} className="text-xs font-mono">
              {is16 ? `#${i}: ` : `${i}: `}{color.toUpperCase()}
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
    </div>
  );
}
