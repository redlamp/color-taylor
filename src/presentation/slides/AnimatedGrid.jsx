import { useState, useRef, useEffect } from 'react';
import { rgbToHex } from '../../utils/colorConversions';

// ── Palette data ────────────────────────────────────────────────────

const MAC_16 = [
  ['#000000', '#404040', '#808080', '#C0C0C0', '#90713A', '#562C05', '#006412', '#1FB714'],
  ['#02ABEA', '#0000D4', '#4600A5', '#F20884', '#DD0907', '#FF6403', '#FBF305', '#FFFFFF'],
];

function generate256() {
  const hex = (r, g, b) => '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('');
  const colors = [];
  for (const r of [0xFF, 0xCC, 0x99, 0x66, 0x33, 0x00])
    for (const g of [0xFF, 0xCC, 0x99, 0x66, 0x33, 0x00])
      for (const b of [0xFF, 0xCC, 0x99, 0x66, 0x33, 0x00])
        colors.push(hex(r, g, b));
  for (let i = 0; i < 40; i++) {
    const v = Math.round(255 - (i / 39) * 255);
    colors.push(hex(v, v, v));
  }
  const grid = [];
  for (let r = 0; r < 8; r++) grid.push(colors.slice(r * 32, (r + 1) * 32));
  return grid;
}

function generateThousands(count = 64) {
  const make = (fn) => Array.from({ length: count }, (_, i) => {
    const v = Math.round((i / (count - 1)) * 255);
    return fn(v);
  });
  return [
    make(v => rgbToHex(v, 0, 0)),
    make(v => rgbToHex(0, v, 0)),
    make(v => rgbToHex(0, 0, v)),
    make(v => rgbToHex(v, v, v)),
  ];
}

const GRID_256 = generate256();
const THOUSANDS = generateThousands(64);

// ── Layout generators ───────────────────────────────────────────────
// Each cell: { id, color, x, y, w, h } — all in 0–1 normalized coords.
// IDs use the hex color; duplicates get a suffix so only the first
// occurrence of each color matches across layouts.

function assignIds(cells) {
  const seen = {};
  return cells.map(c => {
    const key = c.color.toLowerCase();
    const n = seen[key] || 0;
    seen[key] = n + 1;
    return { ...c, id: n === 0 ? key : `${key}:${n}` };
  });
}

function getLayout(mode) {
  switch (mode) {
    case 'bw':
      return assignIds([
        { color: '#000000', x: 0, y: 0, w: 0.5, h: 1 },
        { color: '#FFFFFF', x: 0.5, y: 0, w: 0.5, h: 1 },
      ]);

    case 'c16':
      return assignIds(MAC_16.flatMap((row, ri) =>
        row.map((color, ci) => ({
          color, x: ci / 8, y: ri / 2, w: 1 / 8, h: 1 / 2,
        }))
      ));

    case 'c256':
      return assignIds(GRID_256.flatMap((row, ri) =>
        row.map((color, ci) => ({
          color, x: ci / 32, y: ri / 8, w: 1 / 32, h: 1 / 8,
        }))
      ));

    case 'thousands':
      return assignIds(THOUSANDS.flatMap((row, ri) =>
        row.map((color, ci) => ({
          color, x: ci / row.length, y: ri / 4, w: 1 / row.length, h: 1 / 4,
        }))
      ));

    default:
      return [];
  }
}

// ── Animated grid component ─────────────────────────────────────────

const DURATION = '1s';
const EASING = 'ease-in-out';
const TRANS = `left ${DURATION} ${EASING}, top ${DURATION} ${EASING}, width ${DURATION} ${EASING}, height ${DURATION} ${EASING}, opacity ${DURATION} ${EASING}, background-color ${DURATION} ${EASING}`;

export default function AnimatedGrid({ mode }) {
  const [cells, setCells] = useState(() =>
    getLayout(mode).map(c => ({ ...c, opacity: 1, transition: 'none' }))
  );
  const prevMode = useRef(mode);

  useEffect(() => {
    if (mode === prevMode.current) return;

    const fromLayout = getLayout(prevMode.current);
    const toLayout = getLayout(mode);
    prevMode.current = mode;

    const fromMap = new Map(fromLayout.map(c => [c.id, c]));
    const toMap = new Map(toLayout.map(c => [c.id, c]));
    const allIds = [...new Set([...fromMap.keys(), ...toMap.keys()])];

    // Step 1: jump to start positions (no transition)
    setCells(allIds.map(id => {
      const from = fromMap.get(id);
      const to = toMap.get(id);
      if (from) {
        return { id, color: from.color, x: from.x, y: from.y, w: from.w, h: from.h, opacity: 1, transition: 'none' };
      }
      // New cell — start invisible at target position
      return { id, color: to.color, x: to.x, y: to.y, w: to.w, h: to.h, opacity: 0, transition: 'none' };
    }));

    // Step 2: after paint, set end positions with CSS transition
    const raf = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setCells(allIds.map(id => {
          const from = fromMap.get(id);
          const to = toMap.get(id);
          if (from && to) {
            // Matched — tween position, size, color
            return { id, color: to.color, x: to.x, y: to.y, w: to.w, h: to.h, opacity: 1, transition: TRANS };
          }
          if (to) {
            // New — fade in
            return { id, color: to.color, x: to.x, y: to.y, w: to.w, h: to.h, opacity: 1, transition: TRANS };
          }
          // Removed — fade out
          return { id, color: from.color, x: from.x, y: from.y, w: from.w, h: from.h, opacity: 0, transition: TRANS };
        }));

        // Clean up after transition
        setTimeout(() => {
          setCells(toLayout.map(c => ({ ...c, opacity: 1, transition: 'none' })));
        }, 1100);
      });
    });

    return () => cancelAnimationFrame(raf);
  }, [mode]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      {cells.map(cell => (
        <div
          key={cell.id}
          style={{
            position: 'absolute',
            left: `${cell.x * 100}%`,
            top: `${cell.y * 100}%`,
            width: `${cell.w * 100}%`,
            height: `${cell.h * 100}%`,
            backgroundColor: cell.color,
            opacity: cell.opacity,
            transition: cell.transition,
          }}
        />
      ))}
    </div>
  );
}
