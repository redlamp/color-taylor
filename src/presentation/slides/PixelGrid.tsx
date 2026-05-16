import { useMemo } from 'react';

// Classic Mac-style dithering pattern
const DITHER_8x8 = [
  [0,1,0,1,0,1,0,1],
  [1,0,1,0,1,0,1,0],
  [0,1,0,0,0,1,0,1],
  [1,0,0,1,1,0,1,0],
  [0,1,0,1,0,1,0,0],
  [1,0,1,0,1,0,0,1],
  [0,0,0,1,0,0,1,0],
  [1,1,1,0,1,1,0,1],
];

export default function PixelGrid({ bitDepth }) {
  const rows = 8;
  const cols = 8;
  const cellSize = 40;

  const grid = useMemo(() => {
    if (bitDepth === 1) return DITHER_8x8;
    return Array.from({ length: rows }, () =>
      Array.from({ length: cols }, () => Math.round(Math.random()))
    );
  }, [bitDepth]);

  return (
    <div className="flex flex-col items-center gap-6">
      <p className="text-sm text-muted-foreground tracking-wide uppercase">
        black. white. that's it.
      </p>
      <svg
        width={cols * cellSize}
        height={rows * cellSize}
        className="border border-muted-foreground/20 rounded"
      >
        {grid.map((row, y) =>
          row.map((val, x) => (
            <rect
              key={`${x}-${y}`}
              x={x * cellSize}
              y={y * cellSize}
              width={cellSize}
              height={cellSize}
              fill={val ? '#fff' : '#000'}
              stroke="rgba(128,128,128,0.15)"
              strokeWidth={0.5}
            />
          ))
        )}
      </svg>
    </div>
  );
}
