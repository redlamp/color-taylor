/**
 * The CIE 1931 chromaticity diagram, with one colour's chromaticity on it.
 *
 * Two layers over the same coordinates: a canvas that paints the gamut, and an
 * SVG that draws everything with a name. They share `sx` / `sy` and one aspect
 * ratio, so the outline on the SVG lands on the edge of the paint underneath.
 *
 * The horseshoe is the spectral locus from real colour-matching functions -
 * see src/utils/cieCmf1931.ts. It is 65 straight chords at 5 nm, which is the
 * data, not a smoothing of it.
 *
 * What is painted, and why not more: inside the sRGB triangle every point has
 * a colour and the brightest one is painted. Outside it, no screen can show
 * the colour, so the region is a flat wash. Filling it with clamped rainbow -
 * which most published versions of this diagram do - would be a lie about
 * precisely the region the diagram exists to talk about.
 */
import { useEffect, useRef } from 'react';
import { rgbToHex, type RGB } from '@/utils/colorConversions';
import {
  SPECTRAL_LOCUS, SRGB_TRIANGLE, P3_TRIANGLE, D65_WHITE,
  brightestRgbAt, insidePolygon, rgbToXyY, type Xy,
} from '@/utils/cie';

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

const path = (pts: readonly Xy[], close: boolean) =>
  pts.map((p, i) => `${i ? 'L' : 'M'}${sx(p.x).toFixed(2)},${sy(p.y).toFixed(2)}`).join('') + (close ? 'Z' : '');

export interface CieDiagramProps {
  /** The colour whose chromaticity is marked. */
  rgb: RGB;
  /** Display P3 as a second outline - a boundary, never a mode. */
  showP3: boolean;
  /**
   * A circle of fixed radius about white: the shape a colour wheel implies.
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

export default function CieDiagram({ rgb, showP3, showCircle, circleRadius = 0.20, ghost = null }: CieDiagramProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Painted once. It does not depend on the colour, only on the gamut.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const img = ctx.createImageData(W, H);
    const d = img.data;
    for (let py = 0; py < H; py++) {
      const y = Y0 + (H - py - 0.5) / K;
      for (let px = 0; px < W; px++) {
        const x = X0 + (px + 0.5) / K;
        const i = (py * W + px) * 4;
        const c = brightestRgbAt(x, y);
        if (c) {
          d[i] = c.r; d[i + 1] = c.g; d[i + 2] = c.b; d[i + 3] = 255;
        } else if (insidePolygon({ x, y }, SPECTRAL_LOCUS)) {
          // Flat, and deliberately not a colour: nothing here is showable.
          d[i] = 140; d[i + 1] = 140; d[i + 2] = 140; d[i + 3] = 76;
        }
      }
    }
    ctx.putImageData(img, 0, 0);
  }, []);

  const here = rgbToXyY(rgb.r, rgb.g, rgb.b);
  const hex = rgbToHex(rgb.r, rgb.g, rgb.b);
  const corners: Array<[string, Xy, [number, number]]> = [
    ['R', SRGB_TRIANGLE[0], [18, 6]],
    ['G', SRGB_TRIANGLE[1], [6, -12]],
    ['B', SRGB_TRIANGLE[2], [-20, 14]],
  ];

  return (
    <div className="relative w-full" style={{ aspectRatio: `${W} / ${H}` }}>
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" aria-hidden="true" />
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="absolute inset-0 h-full w-full text-foreground"
        role="img"
        aria-label={
          here
            ? `CIE 1931 chromaticity diagram. The colour ${hex.toUpperCase()} sits at x ${here.x.toFixed(4)}, y ${here.y.toFixed(4)}.`
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

        {showP3 && (
          <g>
            <path d={path(P3_TRIANGLE, true)} fill="none" stroke="currentColor" strokeOpacity={0.85} strokeWidth={2} strokeDasharray="9 7" />
            <text x={sx(P3_TRIANGLE[1].x) + 4} y={sy(P3_TRIANGLE[1].y) - 10} fill="currentColor" fillOpacity={0.8} fontSize={TICK_PX}>P3</text>
          </g>
        )}

        {showCircle && (
          <circle
            cx={sx(D65_WHITE.x)} cy={sy(D65_WHITE.y)} r={circleRadius * K}
            fill="none" stroke="currentColor" strokeOpacity={0.9} strokeWidth={2} strokeDasharray="3 6"
          />
        )}

        {/* The sRGB triangle. Bright, because everything else defers to it. */}
        <path d={path(SRGB_TRIANGLE, true)} fill="none" stroke="#ffffff" strokeOpacity={0.95} strokeWidth={3} />
        <path d={path(SRGB_TRIANGLE, true)} fill="none" stroke="#000000" strokeOpacity={0.45} strokeWidth={1} />
        <g fontSize={CORNER_PX} fontWeight={600} fill="#ffffff" stroke="#000000" strokeWidth={3} paintOrder="stroke">
          {corners.map(([label, p, [dx, dy]]) => (
            <text key={label} x={sx(p.x) + dx} y={sy(p.y) + dy}>{label}</text>
          ))}
        </g>

        {/* D65, and the reach from it to the colour - the distance that varies 3.7x. */}
        {here && (
          <line
            x1={sx(D65_WHITE.x)} y1={sy(D65_WHITE.y)} x2={sx(here.x)} y2={sy(here.y)}
            stroke="#ffffff" strokeOpacity={0.55} strokeWidth={1.5} strokeDasharray="4 4"
          />
        )}
        <g stroke="#ffffff" strokeOpacity={0.9} strokeWidth={2}>
          <line x1={sx(D65_WHITE.x) - 8} y1={sy(D65_WHITE.y)} x2={sx(D65_WHITE.x) + 8} y2={sy(D65_WHITE.y)} />
          <line x1={sx(D65_WHITE.x)} y1={sy(D65_WHITE.y) - 8} x2={sx(D65_WHITE.x)} y2={sy(D65_WHITE.y) + 8} />
        </g>
        {/* Clear of the cross rather than over it - the cross is the datum. */}
        <text
          x={sx(D65_WHITE.x) + 13} y={sy(D65_WHITE.y) - 12} textAnchor="start"
          fontSize={TICK_PX} fill="#ffffff" stroke="#000000" strokeWidth={3} paintOrder="stroke"
        >D65</text>

        {/* Where the dot stood when this brightness run started. */}
        {ghost && (
          <circle
            cx={sx(ghost.x)} cy={sy(ghost.y)} r={20}
            fill="none" stroke="#ffffff" strokeOpacity={0.9} strokeWidth={2} strokeDasharray="5 5"
          />
        )}

        {/* The colour itself. The app's handle look: a core inside a ring. */}
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
