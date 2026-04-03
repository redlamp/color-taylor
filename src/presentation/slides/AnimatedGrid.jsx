import { useState, useRef, useEffect } from 'react';
import { rgbToHex, hslToRgb } from '../../utils/colorConversions';

// ── Palette data ────────────────────────────────────────────────────

const MAC_16 = [
  ['#000000', '#404040', '#808080', '#C0C0C0', '#90713A', '#562C05', '#006412', '#1FB714'],
  ['#02ABEA', '#0000D4', '#4600A5', '#F20884', '#DD0907', '#FF6403', '#FBF305', '#FFFFFF'],
];

// Mac CLUT8: exact 256-color palette from the Mac OS clut resource ID 8.
// 6x6x6 RGB cube (descending, 215 entries) + 10 red ramp + 10 green ramp
// + 10 blue ramp + 10 gray ramp + black. Displayed as 8 rows × 32 columns.
const MAC_CLUT8 = [
  '#FFFFFF','#FFFFCC','#FFFF99','#FFFF66','#FFFF33','#FFFF00','#FFCCFF','#FFCCCC',
  '#FFCC99','#FFCC66','#FFCC33','#FFCC00','#FF99FF','#FF99CC','#FF9999','#FF9966',
  '#FF9933','#FF9900','#FF66FF','#FF66CC','#FF6699','#FF6666','#FF6633','#FF6600',
  '#FF33FF','#FF33CC','#FF3399','#FF3366','#FF3333','#FF3300','#FF00FF','#FF00CC',
  '#FF0099','#FF0066','#FF0033','#FF0000','#CCFFFF','#CCFFCC','#CCFF99','#CCFF66',
  '#CCFF33','#CCFF00','#CCCCFF','#CCCCCC','#CCCC99','#CCCC66','#CCCC33','#CCCC00',
  '#CC99FF','#CC99CC','#CC9999','#CC9966','#CC9933','#CC9900','#CC66FF','#CC66CC',
  '#CC6699','#CC6666','#CC6633','#CC6600','#CC33FF','#CC33CC','#CC3399','#CC3366',
  '#CC3333','#CC3300','#CC00FF','#CC00CC','#CC0099','#CC0066','#CC0033','#CC0000',
  '#99FFFF','#99FFCC','#99FF99','#99FF66','#99FF33','#99FF00','#99CCFF','#99CCCC',
  '#99CC99','#99CC66','#99CC33','#99CC00','#9999FF','#9999CC','#999999','#999966',
  '#999933','#999900','#9966FF','#9966CC','#996699','#996666','#996633','#996600',
  '#9933FF','#9933CC','#993399','#993366','#993333','#993300','#9900FF','#9900CC',
  '#990099','#990066','#990033','#990000','#66FFFF','#66FFCC','#66FF99','#66FF66',
  '#66FF33','#66FF00','#66CCFF','#66CCCC','#66CC99','#66CC66','#66CC33','#66CC00',
  '#6699FF','#6699CC','#669999','#669966','#669933','#669900','#6666FF','#6666CC',
  '#666699','#666666','#666633','#666600','#6633FF','#6633CC','#663399','#663366',
  '#663333','#663300','#6600FF','#6600CC','#660099','#660066','#660033','#660000',
  '#33FFFF','#33FFCC','#33FF99','#33FF66','#33FF33','#33FF00','#33CCFF','#33CCCC',
  '#33CC99','#33CC66','#33CC33','#33CC00','#3399FF','#3399CC','#339999','#339966',
  '#339933','#339900','#3366FF','#3366CC','#336699','#336666','#336633','#336600',
  '#3333FF','#3333CC','#333399','#333366','#333333','#333300','#3300FF','#3300CC',
  '#330099','#330066','#330033','#330000','#00FFFF','#00FFCC','#00FF99','#00FF66',
  '#00FF33','#00FF00','#00CCFF','#00CCCC','#00CC99','#00CC66','#00CC33','#00CC00',
  '#0099FF','#0099CC','#009999','#009966','#009933','#009900','#0066FF','#0066CC',
  '#006699','#006666','#006633','#006600','#0033FF','#0033CC','#003399','#003366',
  '#003333','#003300','#0000FF','#0000CC','#000099','#000066','#000033','#EE0000',
  '#DD0000','#BB0000','#AA0000','#880000','#770000','#550000','#440000','#220000',
  '#110000','#00EE00','#00DD00','#00BB00','#00AA00','#008800','#007700','#005500',
  '#004400','#002200','#001100','#0000EE','#0000DD','#0000BB','#0000AA','#000088',
  '#000077','#000055','#000044','#000022','#000011','#EEEEEE','#DDDDDD','#BBBBBB',
  '#AAAAAA','#888888','#777777','#555555','#444444','#222222','#111111','#000000',
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
const MILLIONS = generateThousands(128);

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

    // Millions: denser 4-bar layout (128 cols × 4 rows = 512 cells)
    case 'millions':
      return assignIds(MILLIONS.flatMap((row, ri) =>
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

        // Step 3: New cells fade in — skip overlap delay if no matched cells to wait for
        const totalMs = enteringSwatch ? SWATCH_EXPAND_TOTAL_MS : MOVE_TOTAL_MS;
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
            isTransitioning.current = false;
            setCells(toLayout.map(c => ({ ...c, opacity: 1, z: 1, transition: 'none' })));
          }, cleanupMs));
        }, overlapMs));
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
