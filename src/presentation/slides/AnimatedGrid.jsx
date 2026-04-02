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

const MOVE_DUR = '0.8s';
const FADE_DUR = '0.6s';
const STAGGER_MAX = 0.8; // seconds — max delay for the stagger wave
const EASING = 'ease-in-out';
const MOVE_TRANS = `left ${MOVE_DUR} ${EASING}, top ${MOVE_DUR} ${EASING}, width ${MOVE_DUR} ${EASING}, height ${MOVE_DUR} ${EASING}, background-color ${MOVE_DUR} ${EASING}`;
const FADEOUT_TRANS = `opacity ${MOVE_DUR} ${EASING}`;

// Per-cell staggered fade: delay proportional to hex integer value
// #000000 = 0 delay, #FFFFFF = STAGGER_MAX delay
function staggeredFade(hexColor) {
  const raw = hexColor.replace('#', '').replace(/:.*/, ''); // strip dup suffix
  const n = parseInt(raw, 16) || 0;
  const delay = (n / 0xFFFFFF) * STAGGER_MAX;
  return `opacity ${FADE_DUR} ${EASING} ${delay.toFixed(3)}s`;
}

export default function AnimatedGrid({ mode }) {
  const [cells, setCells] = useState(() =>
    getLayout(mode).map(c => ({ ...c, opacity: 1, z: 1, transition: 'none' }))
  );
  const prevMode = useRef(mode);
  const timers = useRef([]);

  useEffect(() => {
    if (mode === prevMode.current) return;

    const fromLayout = getLayout(prevMode.current);
    const toLayout = getLayout(mode);
    prevMode.current = mode;

    const fromMap = new Map(fromLayout.map(c => [c.id, c]));
    const toMap = new Map(toLayout.map(c => [c.id, c]));
    const allIds = [...new Set([...fromMap.keys(), ...toMap.keys()])];

    // Classify cells
    const matched = [];
    const added = [];
    const removed = [];
    for (const id of allIds) {
      const from = fromMap.get(id);
      const to = toMap.get(id);
      if (from && to) matched.push(id);
      else if (to) added.push(id);
      else removed.push(id);
    }

    // Clear previous timers
    timers.current.forEach(clearTimeout);
    timers.current = [];

    // Step 1: Set start positions — matched + removed visible (z:2), new hidden (z:1)
    setCells([
      ...matched.map(id => {
        const from = fromMap.get(id);
        return { id, color: from.color, x: from.x, y: from.y, w: from.w, h: from.h, opacity: 1, z: 2, transition: 'none' };
      }),
      ...removed.map(id => {
        const from = fromMap.get(id);
        return { id, color: from.color, x: from.x, y: from.y, w: from.w, h: from.h, opacity: 1, z: 2, transition: 'none' };
      }),
      ...added.map(id => {
        const to = toMap.get(id);
        return { id, color: to.color, x: to.x, y: to.y, w: to.w, h: to.h, opacity: 0, z: 1, transition: 'none' };
      }),
    ]);

    // Step 2: After paint — matched cells tween to target, removed fade out
    const raf = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setCells(prev => prev.map(cell => {
          if (matched.includes(cell.id)) {
            const to = toMap.get(cell.id);
            return { ...cell, color: to.color, x: to.x, y: to.y, w: to.w, h: to.h, transition: MOVE_TRANS };
          }
          if (removed.includes(cell.id)) {
            return { ...cell, opacity: 0, transition: FADEOUT_TRANS };
          }
          return cell; // added cells stay hidden
        }));

        // Step 3: After matched cells arrive — fade in new cells with stagger
        timers.current.push(setTimeout(() => {
          setCells(prev => prev.map(cell => {
            if (added.includes(cell.id)) {
              return { ...cell, opacity: 1, transition: staggeredFade(cell.color) };
            }
            return cell;
          }));

          // Clean up after stagger + fade completes
          const cleanupMs = (STAGGER_MAX + parseFloat(FADE_DUR) + 0.1) * 1000;
          timers.current.push(setTimeout(() => {
            setCells(toLayout.map(c => ({ ...c, opacity: 1, z: 1, transition: 'none' })));
          }, cleanupMs));
        }, 850));
      });
    });

    return () => {
      cancelAnimationFrame(raf);
      timers.current.forEach(clearTimeout);
    };
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
            zIndex: cell.z,
            transition: cell.transition,
          }}
        />
      ))}
    </div>
  );
}
