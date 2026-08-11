import { useEffect, useRef } from 'react';

/**
 * Paints two colour-reactive effects onto the panel chrome: an ambient glow that
 * moves to wherever the selected colour sits on the hexagon, and a conic rim
 * light on the inner sections whose spread narrows as saturation climbs.
 *
 * Three things about how this is built, all of them deliberate:
 *
 * 1. **It writes CSS custom properties, not React state.** Nothing here causes a
 *    render. The effects are decoration derived from a value the picker already
 *    holds, and re-rendering the panel tree on every drag frame to move a
 *    gradient would be the wrong trade - see issue #23, which is already about
 *    repaint cost during hexagon drags. The properties land on
 *    documentElement once and CSS does the rest.
 *
 * 2. **Updates are quantised, then coalesced into one rAF.** A conic gradient
 *    re-rasterises whenever its angle or stops change, and there is one rim per
 *    inner section, so a drag that rewrote them every frame would multiply that
 *    cost by however many sections are open. Below ~1.5 degrees of hue or 1.5%
 *    of saturation the change is invisible mid-drag, so it is skipped.
 *
 * 3. **Brightness is not an input.** Both effects read hue and saturation only,
 *    so dragging the brightness bar costs nothing at all.
 *
 * The plugin aliases this module to a no-op (figma/vite.figma.config.ts), so the
 * properties are never written there and the CSS - which defaults every one of
 * them to `transparent` - paints nothing. The effects are app-only by
 * construction rather than by a runtime check.
 */

/** Linear's indigo, and where the effect hue sits when there is no saturation to read. */
const ACCENT_HUE = 285;

/** Skip a repaint below this much movement; both are under the visible threshold mid-drag. */
const HUE_EPSILON = 1.5;
const SAT_EPSILON = 0.015;

/**
 * Radius of the highlight on the frame's edge, in px, at zero and full
 * saturation. A length rather than a percentage on purpose: a percentage would
 * resolve against each card's own box, so the same colour would light a short
 * stretch of the hexagon card and a huge stretch of the equations bar. A fixed
 * radius lights the same amount of edge everywhere.
 */
const SPOT_MAX = 340;
const SPOT_MIN = 150;

/**
 * Where each hue sits on a card's border.
 *
 * The six hexagon vertices map onto four corners and two edge midpoints, and
 * everything between is interpolated along the edge, so the path runs
 * continuously around the perimeter as hue sweeps. Green lands on the top-left
 * corner, magenta on the bottom-right, red and cyan halfway down the right and
 * left edges.
 *
 * Coordinates are normalised to -1..1 per axis, which is the whole point: they
 * become percentages of the element's own width and height, so the mapping
 * holds whatever shape the card is. An angle cannot do this - a conic gradient
 * measures in screen space, so on a 1370x50 bar a 45-degree ray leaves through
 * the top edge 25px along and never reaches the corner at all.
 */
const PERIMETER: ReadonlyArray<readonly [number, number, number]> = [
  [0, 1, 0], // R  right edge, middle
  [60, 1, -1], // Y  top-right corner
  [120, -1, -1], // G  top-left corner
  [180, -1, 0], // C  left edge, middle
  [240, -1, 1], // B  bottom-left corner
  [300, 1, 1], // M  bottom-right corner
  [360, 1, 0], // wraps back to R
];

function perimeterPoint(hue: number): { x: number; y: number } {
  for (let i = 0; i < PERIMETER.length - 1; i++) {
    const [h0, x0, y0] = PERIMETER[i];
    const [h1, x1, y1] = PERIMETER[i + 1];
    if (hue >= h0 && hue <= h1) {
      const t = (hue - h0) / (h1 - h0);
      return { x: x0 + (x1 - x0) * t, y: y0 + (y1 - y0) * t };
    }
  }
  return { x: 1, y: 0 };
}

interface Hsb {
  h: number;
  s: number;
  b: number;
}

interface Options {
  enabled: boolean;
  hsb: Hsb;
  isDark: boolean;
}

const FX_PROPS = [
  '--fx-glow',
  '--fx-glow-x',
  '--fx-glow-y',
  '--fx-rim',
  '--fx-rim-shadow',
] as const;

function clear(root: HTMLElement) {
  root.classList.remove('color-fx');
  for (const prop of FX_PROPS) root.style.removeProperty(prop);
}

function apply(root: HTMLElement, h: number, s: number, isDark: boolean) {
  /*
   * Hue blends from the accent toward the selection in proportion to saturation,
   * along the shortest path round the wheel. A grey selection carries no hue
   * worth reading, so it leaves the accent alone rather than tinting an
   * arbitrary direction at low chroma.
   */
  const delta = ((h - ACCENT_HUE + 540) % 360) - 180;
  const hue = (ACCENT_HUE + delta * s + 360) % 360;
  const chroma = 0.13 + 0.09 * s;
  const lightness = isDark ? 0.68 : 0.58;
  const colour = (alpha: number) =>
    `oklch(${lightness} ${chroma.toFixed(3)} ${hue.toFixed(1)} / ${alpha.toFixed(3)})`;

  /* The point on the card's border this hue owns, in -1..1 per axis. Both
     effects aim at it, so the glow drifts toward the same corner the keyline
     lights rather than the two disagreeing. */
  const pt = perimeterPoint(h);

  /* Glow: partway from the centre toward that point, the distance set by
     saturation. 40 rather than 50 keeps it off the edge. */
  root.style.setProperty('--fx-glow', colour(isDark ? 0.11 : 0.055));
  root.style.setProperty('--fx-glow-x', `${(50 + pt.x * s * 40).toFixed(1)}%`);
  root.style.setProperty('--fx-glow-y', `${(50 + pt.y * s * 40).toFixed(1)}%`);

  /*
   * The keyline. A radial spot sitting on the perimeter point, over a flat wash.
   *
   * Two layers rather than one because they answer different ends of the range:
   * the wash carries zero saturation, where the light should ring the whole card
   * evenly as though it were behind it, and the spot carries the top end, where
   * it should be one place on the edge. Their alphas trade off, so the highlight
   * gathers into a corner as saturation climbs instead of just brightening.
   */
  const spotX = (50 + pt.x * 50).toFixed(1);
  const spotY = (50 + pt.y * 50).toFixed(1);
  const spot = (SPOT_MAX - s * (SPOT_MAX - SPOT_MIN)).toFixed(0);
  const arc = colour((isDark ? 0.95 : 0.78) * s);
  const wash = colour((isDark ? 0.5 : 0.34) * (1 - s));
  root.style.setProperty(
    '--fx-rim',
    `radial-gradient(circle ${spot}px at ${spotX}% ${spotY}%, ${arc}, transparent 72%), ` +
      `linear-gradient(${wash}, ${wash})`,
  );

  /* A faint bleed off the card, offset toward the same point so the light reads
     as directional once saturation gives it a direction. Kept tight: the ring is
     meant to read as a drawn line, not as a halo around one. */
  const offset = s * 3.5;
  root.style.setProperty(
    '--fx-rim-shadow',
    `${(pt.x * offset).toFixed(1)}px ${(pt.y * offset).toFixed(1)}px ` +
      `8px -2px ${colour(isDark ? 0.13 : 0.07)}`,
  );

  root.classList.add('color-fx');
}

export default function useColorEffects({ enabled, hsb, isDark }: Options): void {
  const frame = useRef<number | null>(null);
  const last = useRef<{ h: number; s: number; isDark: boolean } | null>(null);

  useEffect(() => {
    const root = document.documentElement;

    if (!enabled) {
      last.current = null;
      clear(root);
      return;
    }

    const h = ((hsb.h % 360) + 360) % 360;
    const s = Math.min(1, Math.max(0, hsb.s / 100));

    // Quantise: skip movement too small to see, but never skip a theme flip or
    // the first paint after being switched on.
    const prev = last.current;
    if (prev && prev.isDark === isDark) {
      const dh = Math.abs(((h - prev.h + 540) % 360) - 180);
      if (dh < HUE_EPSILON && Math.abs(s - prev.s) < SAT_EPSILON) return;
    }

    if (frame.current !== null) cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(() => {
      frame.current = null;
      last.current = { h, s, isDark };
      apply(root, h, s, isDark);
    });
  }, [enabled, hsb.h, hsb.s, isDark]);

  // Drop the class and the properties on unmount, or the presentation view
  // inherits a glow from whatever the picker was last showing.
  useEffect(
    () => () => {
      if (frame.current !== null) cancelAnimationFrame(frame.current);
      clear(document.documentElement);
    },
    [],
  );
}
