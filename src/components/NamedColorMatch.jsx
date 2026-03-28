import { useState, useMemo } from 'react';
import { findNearestNamedColor } from '../utils/namedColors';
import { rgbToHex } from '../utils/colorConversions';

export default function NamedColorMatch({ rgb }) {
  const [threshold, setThreshold] = useState(30);

  const match = useMemo(
    () => findNearestNamedColor(rgb.r, rgb.g, rgb.b),
    [rgb.r, rgb.g, rgb.b]
  );

  const matchHex = rgbToHex(match.r, match.g, match.b);
  const isMatch = match.distance <= threshold;
  const isExact = match.distance === 0;
  const textColor = (match.r * 0.299 + match.g * 0.587 + match.b * 0.114) > 150 ? '#000' : '#fff';

  return (
    <div className="flex flex-col gap-1.5 items-end">
      {isMatch ? (
        <div
          className="flex items-center gap-2 px-3 py-1.5 rounded-md shadow-sm"
          style={{ backgroundColor: matchHex, color: textColor }}
        >
          <span className="text-sm font-semibold">{match.name}</span>
          {!isExact && (
            <span className="text-xs opacity-70">~{match.distance}</span>
          )}
        </div>
      ) : (
        <div className="text-xs text-muted-foreground italic">No match</div>
      )}
      <div className="flex items-center gap-2">
        <span className="text-[10px] text-muted-foreground whitespace-nowrap">Threshold: {threshold}</span>
        <input
          type="range"
          min={0}
          max={100}
          value={threshold}
          onChange={(e) => setThreshold(Number(e.target.value))}
          className="w-20 h-1 accent-foreground cursor-pointer"
        />
      </div>
    </div>
  );
}
