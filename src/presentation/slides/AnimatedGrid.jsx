import { useState, useRef, useEffect } from 'react';
import { rgbToHex, hslToRgb } from '../../utils/colorConversions';
import { MAC_CLUT8 } from '../../utils/palettes';

// ── Palette data ────────────────────────────────────────────────────

const MAC_16 = [
  ['#000000', '#404040', '#808080', '#C0C0C0', '#90713A', '#562C05', '#006412', '#1FB714'],
  ['#02ABEA', '#0000D4', '#4600A5', '#F20884', '#DD0907', '#FF6403', '#FBF305', '#FFFFFF'],
];

function generate256() {
  const reversed = [...MAC_CLUT8].reverse();
  const grid = [];
  for (let r = 0; r < 8; r++) grid.push(reversed.slice(r * 32, (r + 1) * 32));
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

function getLayout(mode, swatchColor) {
  switch (mode) {
    case 'intro':
    case 'acronyms':
      return []; // empty panel — just shows background

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

    // Millions: same cells as thousands. Smooth gradient overlay handles the visual.
    // This means thousands→millions has all cells matched (no fade-in needed),
    // and millions→hsl-gradient uses the 256 thousands cells for the tween.
    case 'millions':
      return assignIds(THOUSANDS.flatMap((row, ri) =>
        row.map((color, ci) => ({
          color, x: ci / row.length, y: ri / 4, w: 1 / row.length, h: 1 / 4,
        }))
      ));

    // HSL gradient: hue across width, lightness top (white) to bottom (black)
    // Small square cells with gaps, centered in each grid position
    case 'hsl-gradient': {
      const cols = 64;
      const rows = 16;
      const scale = 0.65; // fraction of cell slot used (rest is gap)
      const sz = (1 / cols) * scale;
      const padX = (1 / cols) * (1 - scale) / 2;
      const cells = [];
      for (let row = 0; row < rows; row++) {
        const l = Math.round(100 - (row / (rows - 1)) * 100);
        const rowCenterY = (row + 0.5) / rows;
        for (let col = 0; col < cols; col++) {
          const hue = Math.round((col / cols) * 360);
          const { r, g, b } = hslToRgb(hue, 100, l);
          cells.push({
            color: rgbToHex(r, g, b),
            x: col / cols + padX,
            y: rowCenterY - sz / 2,
            w: sz,
            h: sz,
          });
        }
      }
      return assignIds(cells);
    }

    // Single cell filling the panel — used for static↔interactive transitions
    case 'swatch':
      return assignIds([
        { color: swatchColor || '#ff0000', x: 0, y: 0, w: 1, h: 1 },
      ]);

    default:
      return [];
  }
}

// ── Animated grid component ─────────────────────────────────────────

const FADE_DUR = '0.6s';
const STAGGER_MAX = 0.5; // seconds — max delay for the stagger wave
const EASE = 'cubic-bezier(0.4, 0, 0.2, 1)'; // Material standard — quick start, smooth decel
// Default cell tween: width/x first (300ms), then height/y (400ms after 300ms delay)
const MOVE_TRANS = `left 0.3s ${EASE}, width 0.3s ${EASE}, top 0.4s ${EASE} 0.3s, height 0.4s ${EASE} 0.3s, background-color 0.7s ${EASE}`;
const MOVE_TOTAL_MS = 900; // 300ms + 400ms + 200ms max stagger
// Swatch expand: height/y first (400ms), then width/x (300ms after 400ms delay)
const SWATCH_EXPAND_TRANS = `top 0.4s ${EASE}, height 0.4s ${EASE}, left 0.3s ${EASE} 0.4s, width 0.3s ${EASE} 0.4s, background-color 0.7s ${EASE}`;
const SWATCH_EXPAND_TOTAL_MS = 900;
const FADEOUT_TRANS = `opacity 0.6s ${EASE}`;

// Compute a stagger delay from hex color: bright = early, dark = late
function colorDelay(hexColor, maxDelay) {
  const raw = hexColor.replace('#', '').replace(/:.*/, '');
  const n = parseInt(raw, 16) || 0;
  return maxDelay * (1 - n / 0xFFFFFF);
}

// Staggered fade-in for new cells
function staggeredFade(hexColor, maxDelay = STAGGER_MAX) {
  const delay = colorDelay(hexColor, maxDelay);
  return `opacity ${FADE_DUR} ${EASE} ${delay.toFixed(3)}s`;
}

// Staggered move for matched cells (shorter max delay so they lead)
const MOVE_STAGGER_MAX = 0.2; // seconds
function staggeredMove(hexColor) {
  const delay = colorDelay(hexColor, MOVE_STAGGER_MAX);
  return `left 0.4s ${EASE} ${delay.toFixed(3)}s, width 0.4s ${EASE} ${delay.toFixed(3)}s, top 0.6s ${EASE} ${(0.4 + delay).toFixed(3)}s, height 0.6s ${EASE} ${(0.4 + delay).toFixed(3)}s, background-color 1s ${EASE} ${delay.toFixed(3)}s`;
}

// ── Nearest-neighbor color matching ─────────────────────────────────

function parseRgb(hex) {
  const raw = hex.replace('#', '').replace(/:.*/, '');
  const n = parseInt(raw, 16) || 0;
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function colorDist(a, b) {
  const [r1, g1, b1] = parseRgb(a);
  const [r2, g2, b2] = parseRgb(b);
  return Math.sqrt((r1 - r2) ** 2 + (g1 - g2) ** 2 + (b1 - b2) ** 2);
}

const MAX_MATCH_DIST = 80; // max RGB distance for nearest-neighbor pairing

// Build transition pairs: exact matches, nearest-neighbor matches, and unmatched
function buildPairs(fromLayout, toLayout) {
  const fromMap = new Map(fromLayout.map(c => [c.id, c]));
  const toMap = new Map(toLayout.map(c => [c.id, c]));

  const pairs = [];      // { key, from, to }
  const usedTo = new Set();

  // 1. Exact ID matches
  for (const [id, from] of fromMap) {
    const to = toMap.get(id);
    if (to) {
      pairs.push({ key: id, from, to });
      usedTo.add(id);
    }
  }

  // 2. Nearest-neighbor matches for unmatched source cells
  const unmatchedFrom = fromLayout.filter(c => !toMap.has(c.id));
  const unmatchedTo = toLayout.filter(c => !fromMap.has(c.id) && !usedTo.has(c.id));

  // Build candidates sorted by distance (greedy closest-first)
  const candidates = [];
  for (const from of unmatchedFrom) {
    for (const to of unmatchedTo) {
      candidates.push({ from, to, dist: colorDist(from.color, to.color) });
    }
  }
  candidates.sort((a, b) => a.dist - b.dist);

  const pairedFrom = new Set();
  const pairedTo = new Set();
  for (const c of candidates) {
    if (pairedFrom.has(c.from.id) || pairedTo.has(c.to.id)) continue;
    if (c.dist > MAX_MATCH_DIST) continue;
    pairs.push({ key: `near:${c.from.id}`, from: c.from, to: c.to });
    pairedFrom.add(c.from.id);
    pairedTo.add(c.to.id);
  }

  // 3. Remaining unmatched
  const removed = unmatchedFrom.filter(c => !pairedFrom.has(c.id));
  const added = unmatchedTo.filter(c => !pairedTo.has(c.id));

  return { pairs, removed, added };
}

// ── Component ───────────────────────────────────────────────────────

export default function AnimatedGrid({ mode, swatchColor, enterColor }) {
  const containerRef = useRef(null);
  const [cells, setCells] = useState(() =>
    getLayout(mode, swatchColor).map(c => ({ ...c, opacity: 1, z: 1, transition: 'none' }))
  );
  const prevMode = useRef(mode);
  const latestSwatch = useRef(swatchColor);
  latestSwatch.current = swatchColor; // always tracks the latest color
  const isTransitioning = useRef(false); // true while a mode transition is in flight
  const timers = useRef([]);
  const rafs = useRef([]);
  const generation = useRef(0); // increments each transition; stale callbacks become no-ops

  useEffect(() => {
    if (mode === prevMode.current) return;

    // Cancel any in-flight animations from previous transitions
    timers.current.forEach(clearTimeout);
    timers.current = [];
    rafs.current.forEach(cancelAnimationFrame);
    rafs.current = [];
    const gen = ++generation.current;
    isTransitioning.current = true;

    const fromMode = prevMode.current;
    const enteringSwatch = mode === 'swatch';
    const leavingSwatch = fromMode === 'swatch';

    // Entering swatch: use enterColor (e.g. #ff0000) so the correct grid cell expands
    // Leaving swatch: use the current slider color so it shrinks to the right position
    const fromColor = leavingSwatch ? latestSwatch.current : swatchColor;
    const toColor = enteringSwatch ? (enterColor || swatchColor) : swatchColor;

    const fromLayout = getLayout(fromMode, fromColor);
    const toLayout = getLayout(mode, toColor);
    prevMode.current = mode;

    let { pairs, removed, added } = buildPairs(fromLayout, toLayout);

    // When coming from an empty layout (intro/acronyms), convert "added" cells
    // into matched pairs with synthetic start positions so they get the
    // height-then-width shape tween instead of just fading in.
    const fromEmpty = fromLayout.length === 0 && toLayout.length > 0;
    if (fromEmpty) {
      const sz = 1 / 64; // small square, similar to full spectrum cell size
      pairs = toLayout.map(c => {
        // Black starts top-left, white starts bottom-right
        const isLight = parseInt((c.color || '#000000').replace('#', ''), 16) > 0x808080;
        const startX = isLight ? 1 - sz : 0;
        const startY = isLight ? 1 - sz : 0;
        return {
          key: c.id,
          from: { ...c, x: startX, y: startY, w: sz, h: sz },
          to: c,
        };
      });
      added = [];
      removed = [];
    }

    const matchedKeys = new Set(pairs.map(p => p.key));
    const removedKeys = new Set(removed.map(c => c.id));
    const addedKeys = new Set(added.map(c => c.id));


    // Step 1: Set start positions — matched + removed visible (z:2), new hidden (z:1)
    setCells([
      ...pairs.map(p => ({
        id: p.key, color: p.from.color, x: p.from.x, y: p.from.y, w: p.from.w, h: p.from.h,
        opacity: 1, z: 2, transition: 'none',
      })),
      ...removed.map(c => ({
        id: c.id, color: c.color, x: c.x, y: c.y, w: c.w, h: c.h,
        opacity: 1, z: 2, transition: 'none',
      })),
      ...added.map(c => ({
        id: c.id, color: c.color, x: c.x, y: c.y, w: c.w, h: c.h,
        opacity: 0, z: 1, transition: 'none',
      })),
    ]);

    // Step 2: After paint — matched tween to target, removed fade out
    // Use rAF + setTimeout(0) to guarantee the browser has painted step 1
    // before we apply transitions (React 18 batching can swallow double-rAF)
    const raf1 = requestAnimationFrame(() => {
      // Force layout read to flush step 1 to the DOM
      containerRef.current?.offsetHeight;
      const tid = setTimeout(() => {
        if (generation.current !== gen) return; // stale
        const pairMap = new Map(pairs.map(p => [p.key, p.to]));

        // Fast path: if no cells move, are added, or removed (e.g. thousands→millions),
        // skip all animation timers and finish immediately.
        const noMovement = removed.length === 0 && added.length === 0 &&
          pairs.every(p => p.from.x === p.to.x && p.from.y === p.to.y && p.from.w === p.to.w && p.from.h === p.to.h);

        if (noMovement) {
          isTransitioning.current = false;
          setCells(toLayout.map(c => ({ ...c, opacity: 1, z: 1, transition: 'none' })));
        } else {
          setCells(prev => prev.map(cell => {
            if (matchedKeys.has(cell.id)) {
              const to = pairMap.get(cell.id);
              return { ...cell, color: to.color, x: to.x, y: to.y, w: to.w, h: to.h, transition: (enteringSwatch || fromEmpty) ? SWATCH_EXPAND_TRANS : staggeredMove(to.color) };
            }
            if (removedKeys.has(cell.id)) {
              return { ...cell, opacity: 0, transition: FADEOUT_TRANS };
            }
            return cell; // added cells stay hidden
          }));

          // Allow reactive swatch updates once matched cells have finished their tween
          const totalMs = enteringSwatch ? SWATCH_EXPAND_TOTAL_MS : MOVE_TOTAL_MS;
          timers.current.push(setTimeout(() => {
            if (generation.current !== gen) return;
            isTransitioning.current = false;
          }, totalMs));

          // Step 3: New cells fade in — skip overlap delay if no matched cells to wait for
          const overlapMs = pairs.length > 0 ? totalMs * 0.7 : 0;
          const fadeStagger = mode === 'hsl-gradient' ? 0.15 : STAGGER_MAX;
          timers.current.push(setTimeout(() => {
            if (generation.current !== gen) return; // stale
            setCells(prev => prev.map(cell => {
              if (addedKeys.has(cell.id)) {
                return { ...cell, opacity: 1, transition: staggeredFade(cell.color, fadeStagger) };
              }
              return cell;
            }));

            // Clean up after stagger + fade completes
            const cleanupMs = (fadeStagger + parseFloat(FADE_DUR) + 0.1) * 1000;
            timers.current.push(setTimeout(() => {
              if (generation.current !== gen) return; // stale
              setCells(toLayout.map(c => ({ ...c, opacity: 1, z: 1, transition: 'none' })));
            }, cleanupMs));
          }, overlapMs));
        }
      }, 0);
      timers.current.push(tid);
    });

    rafs.current.push(raf1);

    return () => {
      rafs.current.forEach(cancelAnimationFrame);
      rafs.current = [];
      timers.current.forEach(clearTimeout);
      timers.current = [];
    };
  }, [mode]);

  // Reactively update swatch color and ensure visibility
  // Skip during transitions so the cell tween from small→large isn't overwritten
  useEffect(() => {
    if (mode !== 'swatch' || !swatchColor || isTransitioning.current) return;
    setCells([{
      id: swatchColor.toLowerCase(),
      color: swatchColor,
      x: 0, y: 0, w: 1, h: 1,
      opacity: 1, z: 1, transition: 'none',
    }]);
  }, [swatchColor, mode]);

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%', height: '100%' }}>
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
