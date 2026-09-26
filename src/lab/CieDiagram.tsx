/**
 * The CIE 1931 chromaticity diagram, with one color's chromaticity on it.
 *
 * Two layers over the same coordinates: a canvas that paints the gamut, and an
 * SVG that draws everything with a name. They share `sx` / `sy` and one aspect
 * ratio, so the outline on the SVG lands on the edge of the paint underneath.
 *
 * The horseshoe is the spectral locus from real color-matching functions -
 * see src/utils/cieCmf1931.ts. It is 65 straight chords at 5 nm, which is the
 * data, not a smoothing of it.
 *
 * What is painted, and why not more: inside the sRGB triangle every point has
 * a color and the brightest one is painted. Outside it, no screen can show
 * the color, so the region is a flat wash. Filling it with clamped rainbow -
 * which most published versions of this diagram do - would be a lie about
 * precisely the region the diagram exists to talk about.
 *
 * THE PAINT DOES NOT FOLLOW THE ACTIVE GAMUT, AND CANNOT. Several gamuts can
 * be outlined at once and one of them is active, but the fill underneath stays
 * sRGB whichever that is - because the fill is made of pixels on this screen,
 * and this screen is sRGB. Painting P3's interior would mean clamping, which
 * is the one thing this file refuses to do. So an outline is a boundary and
 * the wash inside it means exactly what it meant before: no color here.
 */
import { memo, useEffect, useRef } from 'react';
import { rgbToHex, type RGB } from '@/utils/colorConversions';
import {
  SPECTRAL_LOCUS, D65_WHITE,
  brightestRgbAt, insidePolygon, type Xy,
} from '@/utils/cie';
import { gamutRgbToXyY, brightestInGamut, type Gamut, type GamutId } from '@/utils/gamuts';
import { DISPLAY_IS_P3, get2dContext } from './wideGamut';

/*
 * The drawing window in chromaticity, and user units per unit of x or y.
 * The left and top margins are wider than the locus needs: the 500 nm label
 * hangs outward from the leftmost point of the horseshoe, and 520 nm from its
 * top, so a window cut to the curve clips both.
 */
const X0 = -0.085, X1 = 0.80, Y0 = -0.05, Y1 = 0.90;
const K = 700;
const W = Math.round((X1 - X0) * K);
const H = Math.round((Y1 - Y0) * K);
const sx = (x: number) => (x - X0) * K;
const sy = (y: number) => H - (y - Y0) * K;

/**
 * Text inside the diagram is sized in SVG user units, not in Tailwind steps:
 * it scales with the viewBox, so a class would be the wrong tool and
 * `text-base` would not mean anything here. 15 user units is about 13 CSS px
 * at the size the page renders the diagram, which is a tick label.
 */
const TICK_PX = 15;
const CORNER_PX = 20;

/** Wavelengths worth naming on the rim. Every 20 nm through the bend. */
const TICKS = [460, 480, 500, 520, 540, 560, 580, 600, 620, 700];

/**
 * A tint per gamut, so several outlines at once stay tellable apart - here and
 * on the solid's floor next door, which imports this table rather than picking
 * its own. Presentation, which is why it lives with the drawing and not in
 * src/utils/gamuts.ts: a gamut is three chromaticities, and none of them is a
 * color to draw the outline in.
 *
 * Deliberately not each gamut's own primaries: an outline colored like the
 * region it encloses reads as a fill, and the fill here means something else.
 */
export const GAMUT_TINT: Record<GamutId, [number, number, number]> = {
  srgb: [1, 1, 1],
  p3: [0.55, 0.85, 0.95],
  a98: [0.98, 0.78, 0.45],
  rec2020: [0.70, 0.95, 0.62],
  prophoto: [0.92, 0.65, 0.92],
};

const css = (c: [number, number, number]) =>
  `rgb(${c.map((v) => Math.round(v * 255)).join(' ')})`;

const path = (pts: readonly Xy[], close: boolean) =>
  pts.map((p, i) => `${i ? 'L' : 'M'}${sx(p.x).toFixed(2)},${sy(p.y).toFixed(2)}`).join('') + (close ? 'Z' : '');

export interface CieDiagramProps {
  /** The color whose chromaticity is marked. */
  rgb: RGB;
  /**
   * Every gamut to outline, in the order they should be drawn. Boundaries,
   * never modes: the paint underneath is always the sRGB colors the screen
   * can actually show, whichever outline is on top of it.
   */
  gamuts: readonly Gamut[];
  /**
   * The one the panel's readouts belong to. Drawn solid and lettered; the rest
   * are dashed and named. Exactly one, even when several are visible - a
   * reading has to be about something.
   */
  activeId: GamutId;
  /**
   * A circle of fixed radius about white: the shape a color wheel implies.
   * 57.3% of its circumference at r = 0.20 is outside sRGB.
   */
  showCircle: boolean;
  circleRadius?: number;
  /**
   * Where the dot was when the current brightness run began. A hollow ring is
   * left there while the run lasts, so that "it has not moved" is something
   * you can see rather than something the caption claims.
   */
  ghost?: Xy | null;
}

function CieDiagram({ rgb, gamuts, activeId, showCircle, circleRadius = 0.20, ghost = null }: CieDiagramProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  /*
   * Painted once. It does not depend on the color, and it does not depend on
   * which gamut is being read from either - it depends on *this screen*.
   *
   * The rule has not changed: paint the brightest color of each chromaticity
   * the buffer can actually hold, and leave a flat wash where it cannot. What
   * has changed is how much the buffer can hold. On a display that reports
   * Display P3 the canvas is opened in it, and the fill then reaches every
   * chromaticity inside the P3 triangle rather than stopping at sRGB's - so
   * the wash is smaller, and it still means exactly what it meant: no color
   * here, on this screen.
   *
   * So the fill and the outlines answer two different questions, on purpose.
   * The outline says what a gamut contains. The paint says what you can see.
   */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = W;
    canvas.height = H;
    const ctx = get2dContext(canvas);
    if (!ctx) return;
    const img = DISPLAY_IS_P3
      ? new ImageData(W, H, { colorSpace: 'display-p3' })
      : ctx.createImageData(W, H);
    const d = img.data;
    // sRGB keeps cie.ts's own function: it has painted this diagram since the
    // page existed and there is nothing to gain from routing it elsewhere.
    const brightest = DISPLAY_IS_P3
      ? (x: number, y: number) => brightestInGamut('p3', x, y)
      : brightestRgbAt;
    for (let py = 0; py < H; py++) {
      const y = Y0 + (H - py - 0.5) / K;
      for (let px = 0; px < W; px++) {
        const x = X0 + (px + 0.5) / K;
        const i = (py * W + px) * 4;
        const c = brightest(x, y);
        if (c) {
          d[i] = c.r; d[i + 1] = c.g; d[i + 2] = c.b; d[i + 3] = 255;
        } else if (insidePolygon({ x, y }, SPECTRAL_LOCUS)) {
          // Flat, and deliberately not a color: nothing here is showable.
          d[i] = 140; d[i + 1] = 140; d[i + 2] = 140; d[i + 3] = 76;
        }
      }
    }
    ctx.putImageData(img, 0, 0);
  }, []);

  /*
   * Where the color sits depends on which space its three numbers are read
   * as - that is the page's whole claim about the picker, and this dot is
   * where it is cashed. With Display P3 active, #FF0000 is P3's red and lands
   * outside the sRGB triangle, because it *is* outside it.
   */
  const here = gamutRgbToXyY(activeId, rgb.r, rgb.g, rgb.b);
  const hex = rgbToHex(rgb.r, rgb.g, rgb.b);
  const active = gamuts.find((g) => g.id === activeId) ?? null;
  /** Letter offsets, outward from the middle of the triangle. */
  const corners: Array<[string, Xy, [number, number]]> = active
    ? [
      ['R', active.primaries[0], [18, 6]],
      ['G', active.primaries[1], [6, -12]],
      ['B', active.primaries[2], [-20, 14]],
    ]
    : [];
  const others = gamuts.filter((g) => g.id !== activeId);
  /** The datum every reach on this page is measured from: the active white. */
  const white = active ? active.white : D65_WHITE;

  return (
    <div className="relative w-full" style={{ aspectRatio: `${W} / ${H}` }}>
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" aria-hidden="true" />
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="absolute inset-0 h-full w-full text-foreground"
        role="img"
        aria-label={
          here
            ? `CIE 1931 chromaticity diagram. The color ${hex.toUpperCase()} sits at x ${here.x.toFixed(4)}, y ${here.y.toFixed(4)}.`
            : 'CIE 1931 chromaticity diagram. Black has no chromaticity, so nothing is marked.'
        }
      >
        {/* Axes, in tenths. Quiet: the diagram is the subject. */}
        <g stroke="currentColor" strokeOpacity={0.18} fill="none">
          {[0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7].map((v) => (
            <line key={`gx${v}`} x1={sx(v)} y1={sy(Y0)} x2={sx(v)} y2={sy(Y1)} />
          ))}
          {[0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8].map((v) => (
            <line key={`gy${v}`} x1={sx(X0)} y1={sy(v)} x2={sx(X1)} y2={sy(v)} />
          ))}
        </g>
        <g fill="currentColor" fillOpacity={0.55} fontSize={TICK_PX} className="tabular-nums">
          {[0.2, 0.4, 0.6].map((v) => (
            <text key={`tx${v}`} x={sx(v)} y={sy(0) + 18} textAnchor="middle">{v.toFixed(1)}</text>
          ))}
          {[0.2, 0.4, 0.6, 0.8].map((v) => (
            <text key={`ty${v}`} x={sx(0) - 6} y={sy(v) + 5} textAnchor="end">{v.toFixed(1)}</text>
          ))}
          <text x={sx(0.72)} y={sy(0) + 18} textAnchor="middle" fontStyle="italic">x</text>
          <text x={sx(0) - 6} y={sy(0.84)} textAnchor="end" fontStyle="italic">y</text>
        </g>

        {/* The spectral locus, closed by the line of purples. */}
        <path d={path(SPECTRAL_LOCUS, true)} fill="none" stroke="currentColor" strokeOpacity={0.75} strokeWidth={2.5} strokeLinejoin="round" />

        {/* Wavelength ticks: a stub outward along the normal, and the number. */}
        <g stroke="currentColor" strokeOpacity={0.6} strokeWidth={2} fill="currentColor" fillOpacity={0.75} fontSize={TICK_PX}>
          {TICKS.map((nm) => {
            const i = SPECTRAL_LOCUS.findIndex((s) => s.nm === nm);
            if (i < 0) return null;
            const p = SPECTRAL_LOCUS[i];
            const a = SPECTRAL_LOCUS[Math.max(0, i - 1)], b = SPECTRAL_LOCUS[Math.min(SPECTRAL_LOCUS.length - 1, i + 1)];
            // outward normal: perpendicular to the local tangent, away from white
            let nx = -(sy(b.y) - sy(a.y)), ny = sx(b.x) - sx(a.x);
            const len = Math.hypot(nx, ny) || 1;
            nx /= len; ny /= len;
            const away = (sx(p.x) - sx(D65_WHITE.x)) * nx + (sy(p.y) - sy(D65_WHITE.y)) * ny;
            if (away < 0) { nx = -nx; ny = -ny; }
            return (
              <g key={nm}>
                <line x1={sx(p.x)} y1={sy(p.y)} x2={sx(p.x) + nx * 9} y2={sy(p.y) + ny * 9} />
                <text
                  x={sx(p.x) + nx * 26} y={sy(p.y) + ny * 26 + 5}
                  textAnchor={nx > 0.3 ? 'start' : nx < -0.3 ? 'end' : 'middle'}
                  stroke="none"
                >{nm}</text>
              </g>
            );
          })}
        </g>

        {/* Every gamut but the active one: dashed and named, so several can be
            on at once and still be told apart. Drawn before the active one so
            the active outline is never underneath a dash. */}
        {others.map((g) => (
          <g key={g.id}>
            <path d={path(g.primaries, true)} fill="none" stroke="#000000" strokeOpacity={0.45} strokeWidth={4} strokeDasharray="9 7" />
            <path d={path(g.primaries, true)} fill="none" stroke={css(GAMUT_TINT[g.id])} strokeOpacity={0.9} strokeWidth={2} strokeDasharray="9 7" />
            <text
              x={sx(g.primaries[1].x) + 4} y={sy(g.primaries[1].y) - 10}
              fill={css(GAMUT_TINT[g.id])} stroke="#000000" strokeWidth={3} paintOrder="stroke" fontSize={TICK_PX}
            >{g.name}</text>
          </g>
        ))}

        {showCircle && (
          <circle
            cx={sx(white.x)} cy={sy(white.y)} r={circleRadius * K}
            fill="none" stroke="currentColor" strokeOpacity={0.9} strokeWidth={2} strokeDasharray="3 6"
          />
        )}

        {/* The active gamut. Bright, because everything else defers to it. */}
        {active && (
          <>
            <path d={path(active.primaries, true)} fill="none" stroke="#ffffff" strokeOpacity={0.95} strokeWidth={3} />
            <path d={path(active.primaries, true)} fill="none" stroke="#000000" strokeOpacity={0.45} strokeWidth={1} />
          </>
        )}
        <g fontSize={CORNER_PX} fontWeight={600} fill="#ffffff" stroke="#000000" strokeWidth={3} paintOrder="stroke">
          {corners.map(([label, p, [dx, dy]]) => (
            <text key={label} x={sx(p.x) + dx} y={sy(p.y) + dy}>{label}</text>
          ))}
        </g>

        {/* White, and the reach from it to the color - the distance that varies 3.7x. */}
        {here && (
          <line
            x1={sx(white.x)} y1={sy(white.y)} x2={sx(here.x)} y2={sy(here.y)}
            stroke="#ffffff" strokeOpacity={0.55} strokeWidth={1.5} strokeDasharray="4 4"
          />
        )}
        <g stroke="#ffffff" strokeOpacity={0.9} strokeWidth={2}>
          <line x1={sx(white.x) - 8} y1={sy(white.y)} x2={sx(white.x) + 8} y2={sy(white.y)} />
          <line x1={sx(white.x)} y1={sy(white.y) - 8} x2={sx(white.x)} y2={sy(white.y) + 8} />
        </g>
        {/* Clear of the cross rather than over it - the cross is the datum.
            It moves with the reading gamut, because "reach from white" means
            that space's white: four of the five here are D65 and ProPhoto's
            is D50, which is a fact about ProPhoto worth being able to see. */}
        <text
          x={sx(white.x) + 13} y={sy(white.y) - 12} textAnchor="start"
          fontSize={TICK_PX} fill="#ffffff" stroke="#000000" strokeWidth={3} paintOrder="stroke"
        >{active ? active.whiteName : 'D65'}</text>

        {/* Where the dot stood when this brightness run started. */}
        {ghost && (
          <circle
            cx={sx(ghost.x)} cy={sy(ghost.y)} r={20}
            fill="none" stroke="#ffffff" strokeOpacity={0.9} strokeWidth={2} strokeDasharray="5 5"
          />
        )}

        {/* The color itself. The app's handle look: a core inside a ring. */}
        {here && (
          <g data-testid="cie-dot" data-x={here.x.toFixed(5)} data-y={here.y.toFixed(5)}>
            <circle cx={sx(here.x)} cy={sy(here.y)} r={12} fill="none" stroke="#000000" strokeOpacity={0.5} strokeWidth={7} />
            <circle cx={sx(here.x)} cy={sy(here.y)} r={12} fill={hex} stroke="#ffffff" strokeWidth={4} />
          </g>
        )}
      </svg>
    </div>
  );
}

// memo: the host re-renders on every pointer move, and this figure only has
// to when its own props change.
export default memo(CieDiagram);
