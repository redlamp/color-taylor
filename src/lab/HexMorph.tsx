/**
 * The hexagon, told the truth: the picker's own field, bent into the shape the
 * colours are really in.
 *
 * Drag the morph slider and nothing is recoloured - every pixel keeps the
 * colour it had and moves to where the target space puts it. So every
 * difference you can see between the two ends is a claim the hexagon makes
 * that is not true.
 *
 * Four things ride the morph, and each is there for a different reason:
 *
 * - **The field**, in WebGL, because it is the thing being claimed about. See
 *   hexMorphRenderer.ts for why both ends live in the vertex buffer.
 * - **Your own colour's marker**, because watching the colour you chose move
 *   is a stronger argument than watching a field move.
 * - **The six corners**, labelled, because the collapse from six-fold to
 *   three-fold is the single best thing the figure shows and it is only
 *   followable if you can keep your eye on which corner is which.
 * - **A ray every 30 degrees of HSB hue**, because evenly spaced spokes
 *   bunching up is what makes the distortion legible rather than merely
 *   pretty. The hexagon spaces them 30 degrees apart by construction; nothing
 *   else does.
 *
 * The arithmetic is in src/utils/gamutMorph.ts and asserted against culori in
 * gamutMorph.test.ts. Nothing here computes a colour position itself.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { rgbToHex, type HSB, type RGB } from '@/utils/colorConversions';
import {
  cornerReadings, rimShape, anchorReach, CORNERS, type MorphTarget,
} from '@/utils/gamutMorph';
import {
  CENTER_X, CENTER_Y, RADIUS, HEX_SIZE, colorAtPoint, pointForColor,
} from '@/components/hex/hexConstants';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import {
  buildMorphMesh, createHexMorphRenderer, fieldPointFor, hexPointAt,
  type FieldPoint, type HexMorphRenderer,
} from './hexMorphRenderer';

/** A ray every 30 degrees: the twelve the hexagon claims are evenly spaced. */
const RAY_STEP = 30;
/** Points along one ray. Enough that a bent ray reads as a curve, not a kink. */
const RAY_SAMPLES = 32;
/** Points round an outline. 180 hits all six corners exactly. */
const RIM_SAMPLES = 180;

/**
 * Text inside the figure is sized in SVG user units, the same way CieDiagram
 * sizes its labels and for the same reason: it scales with the viewBox, so a
 * Tailwind step would not survive the figure being resized and `text-base`
 * would not mean anything here. 20 units is about 17 CSS px at the size this
 * renders, which is a label.
 */
const LABEL_PX = 20;
const READOUT_PX = 16;

/** One thing that moves: the same points at both ends of the morph. */
interface Track {
  a: FieldPoint[];
  b: FieldPoint[];
}

const lerp = (p: FieldPoint, q: FieldPoint, t: number) => ({
  x: p.x + (q.x - p.x) * t,
  y: p.y + (q.y - p.y) * t,
});

const points = (track: Track, t: number) => track.a
  .map((p, i) => {
    const q = lerp(p, track.b[i], t);
    return `${q.x.toFixed(1)},${q.y.toFixed(1)}`;
  })
  .join(' ');

export interface HexMorphProps {
  rgb: RGB;
  hsb: HSB;
  target: MorphTarget;
}

export default function HexMorph({ rgb, hsb, target }: HexMorphProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rendererRef = useRef<HexMorphRenderer | null>(null);
  const [unsupported, setUnsupported] = useState(false);
  const [t, setT] = useState(0);
  // Only the ResizeObserver reads this, and only after a paint - so writing it
  // from an effect is both correct and what CieSolid does next door.
  const tRef = useRef(0);
  useEffect(() => { tRef.current = t; }, [t]);

  /*
   * The expensive half, and it deliberately does not depend on `t`: both ends
   * of every vertex are computed here and the slider only mixes them. It does
   * depend on brightness, because the field is the picker's field at whatever
   * the bar says - so a brightness drag rebuilds and a morph drag does not.
   */
  const mesh = useMemo(() => buildMorphMesh(hsb.b, target), [hsb.b, target]);

  /** The overlay's tracks, on the same terms: both ends once, mixed per frame. */
  const overlay = useMemo(() => {
    const ray = (hueDeg: number): Track => {
      const a: FieldPoint[] = [], b: FieldPoint[] = [];
      for (let i = 0; i < RAY_SAMPLES; i++) {
        const f = i / (RAY_SAMPLES - 1);
        const p = hexPointAt(hueDeg, f);
        a.push(p);
        // The colour the picker paints there, read straight off the field's
        // own rule, so a ray is made of the pixels it runs over rather than of
        // an idealised HSB ramp.
        const c = colorAtPoint(p.x, p.y, hsb.b);
        b.push(fieldPointFor(c.r, c.g, c.b, target));
      }
      return { a, b };
    };
    const ring = (fraction: number): Track => {
      const a: FieldPoint[] = [], b: FieldPoint[] = [];
      for (let i = 0; i <= RIM_SAMPLES; i++) {
        const h = ((i % RIM_SAMPLES) / RIM_SAMPLES) * 360;
        const p = hexPointAt(h, fraction);
        a.push(p);
        const c = colorAtPoint(p.x, p.y, hsb.b);
        b.push(fieldPointFor(c.r, c.g, c.b, target));
      }
      return { a, b };
    };
    return {
      rays: Array.from({ length: 360 / RAY_STEP }, (_, i) => ({
        hue: i * RAY_STEP,
        landmark: (i * RAY_STEP) % 60 === 0,
        track: ray(i * RAY_STEP),
      })),
      rim: ring(1),
      // What is actually reachable at this brightness. The picker draws it as
      // a dashed limit; at 100 it is the rim itself, so there is nothing to
      // draw twice.
      crossSection: hsb.b < 100 && hsb.b > 0 ? ring(hsb.b / 100) : null,
      landmarks: CORNERS.map((c) => ({
        name: c.name,
        letter: c.name[0],
        hex: rgbToHex(c.rgb.r, c.rgb.g, c.rgb.b),
        a: hexPointAt(c.hsbHue, 1),
        b: fieldPointFor(c.rgb.r, c.rgb.g, c.rgb.b, target),
      })),
    };
  }, [hsb.b, target]);

  /*
   * The marker. `pointForColor` is what the picker uses to place a colour on
   * its own field, so at t = 0 this sits exactly where the picker's handle
   * would - not near it.
   */
  const marker = useMemo(() => ({
    a: pointForColor(rgb, 'brightness', 1),
    b: fieldPointFor(rgb.r, rgb.g, rgb.b, target),
  }), [rgb, target]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let r: HexMorphRenderer | null = null;
    try { r = createHexMorphRenderer(canvas); } catch (e) { console.error(e); }
    if (!r) { queueMicrotask(() => setUnsupported(true)); return; }
    rendererRef.current = r;
    const ro = new ResizeObserver(() => r.draw(tRef.current));
    ro.observe(canvas);
    return () => { ro.disconnect(); r.destroy(); rendererRef.current = null; };
  }, []);

  useEffect(() => { rendererRef.current?.setMesh(mesh); }, [mesh]);
  useEffect(() => { rendererRef.current?.draw(t); }, [t, mesh]);

  const readings = useMemo(() => cornerReadings(target), [target]);
  const shape = useMemo(() => rimShape(target), [target]);
  const here = useMemo(() => {
    const m = fieldPointFor(rgb.r, rgb.g, rgb.b, target);
    const dx = m.x - CENTER_X, dy = CENTER_Y - m.y;
    const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
    return { angle: angle < 0 ? angle + 360 : angle, reach: Math.hypot(dx, dy) / RADIUS };
  }, [rgb, target]);

  const hex = rgbToHex(rgb.r, rgb.g, rgb.b);
  const at = (track: { a: FieldPoint; b: FieldPoint }) => lerp(track.a, track.b, t);
  const markerAt = at(marker);
  const spaceName = target === 'xy' ? 'CIE xy' : 'Oklab a/b';

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,420px)]">
      {/* Capped rather than free: the figure is square, so a full-width column
          on a wide page makes it a thousand pixels tall and pushes the reading
          matter beside it off the screen. */}
      <div className="mx-auto flex w-full min-w-0 max-w-[560px] flex-col gap-3">
        <div className="relative w-full overflow-hidden rounded-md bg-muted/40" style={{ aspectRatio: '1 / 1' }}>
          <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" aria-hidden="true" />
          {unsupported && (
            <p className="absolute inset-0 flex items-center justify-center p-6 text-center text-base text-muted-foreground">
              This figure needs WebGL2, which this browser has not given us.
            </p>
          )}
          <svg
            viewBox={`0 0 ${HEX_SIZE} ${HEX_SIZE}`}
            className="absolute inset-0 h-full w-full"
            role="img"
            aria-label={
              `The picker's hexagon morphed ${(t * 100).toFixed(0)}% of the way into ${spaceName}. `
              + `The colour ${hex.toUpperCase()} sits at ${here.angle.toFixed(1)} degrees from red, `
              + `${here.reach.toFixed(2)} of red's distance from white.`
            }
          >
            {/* The twelve hue rays. Even at t = 0 they are the figure's claim:
                thirty degrees apart, all the way round, by construction. */}
            <g fill="none" strokeLinecap="round" strokeLinejoin="round">
              {overlay.rays.map((r) => (
                <g key={r.hue}>
                  <polyline points={points(r.track, t)} stroke="#000000" strokeOpacity={0.35} strokeWidth={r.landmark ? 4 : 3} />
                  <polyline points={points(r.track, t)} stroke="#ffffff" strokeOpacity={r.landmark ? 0.95 : 0.55} strokeWidth={r.landmark ? 2 : 1} />
                </g>
              ))}
            </g>

            {/* The reachable cross-section at this brightness: the picker's
                dashed limit, morphed with everything else. */}
            {overlay.crossSection && (
              <g fill="none" strokeLinejoin="round">
                <polyline points={points(overlay.crossSection, t)} stroke="#000000" strokeOpacity={0.4} strokeWidth={4} strokeDasharray="8 8" />
                <polyline points={points(overlay.crossSection, t)} stroke="#ffffff" strokeOpacity={0.9} strokeWidth={2} strokeDasharray="8 8" />
              </g>
            )}

            {/* The outline. A regular hexagon at one end, the gamut at the other. */}
            <g fill="none" strokeLinejoin="round">
              <polyline points={points(overlay.rim, t)} stroke="#000000" strokeOpacity={0.45} strokeWidth={6} />
              <polyline points={points(overlay.rim, t)} stroke="#ffffff" strokeOpacity={0.95} strokeWidth={3} />
            </g>

            {/* White, pinned. It is an anchor rather than a measurement - the
                hexagon puts it here by construction and so does the morph. */}
            <g stroke="#ffffff" strokeOpacity={0.9} strokeWidth={2}>
              <line x1={CENTER_X - 9} y1={CENTER_Y} x2={CENTER_X + 9} y2={CENTER_Y} />
              <line x1={CENTER_X} y1={CENTER_Y - 9} x2={CENTER_X} y2={CENTER_Y + 9} />
            </g>

            {/* Where the shape's own middle is, once nothing holds it at white. */}
            <g>
              {(() => {
                const c = lerp(
                  { x: CENTER_X, y: CENTER_Y },
                  { x: CENTER_X + RADIUS * shape.centroid.x, y: CENTER_Y - RADIUS * shape.centroid.y },
                  t,
                );
                return (
                  <circle
                    cx={c.x} cy={c.y} r={7} fill="none"
                    stroke="#ffffff" strokeOpacity={0.55 * t} strokeWidth={2} strokeDasharray="3 4"
                  />
                );
              })()}
            </g>

            {/* The six corners, tracked and named. */}
            <g>
              {overlay.landmarks.map((l) => {
                const p = lerp(l.a, l.b, t);
                const dx = p.x - CENTER_X, dy = p.y - CENTER_Y;
                const len = Math.hypot(dx, dy) || 1;
                return (
                  <g key={l.name}>
                    <circle cx={p.x} cy={p.y} r={8} fill={l.hex} stroke="#000000" strokeOpacity={0.6} strokeWidth={4} />
                    <circle cx={p.x} cy={p.y} r={8} fill={l.hex} stroke="#ffffff" strokeWidth={2} />
                    <text
                      x={p.x + (dx / len) * 26} y={p.y + (dy / len) * 26 + 7}
                      textAnchor="middle" fontSize={LABEL_PX} fontWeight={600}
                      fill="#ffffff" stroke="#000000" strokeWidth={3} paintOrder="stroke"
                    >{l.letter}</text>
                  </g>
                );
              })}
            </g>

            {/* Your colour. The trail is where it came from, so the move reads
                as a move even when the slider is parked at one end. */}
            <line
              x1={marker.a.x} y1={marker.a.y} x2={markerAt.x} y2={markerAt.y}
              stroke="#ffffff" strokeOpacity={0.5} strokeWidth={2} strokeDasharray="4 5"
            />
            <g data-testid="morph-marker" data-t={t.toFixed(3)} data-x={markerAt.x.toFixed(2)} data-y={markerAt.y.toFixed(2)}>
              <circle cx={markerAt.x} cy={markerAt.y} r={13} fill="none" stroke="#000000" strokeOpacity={0.5} strokeWidth={7} />
              <circle cx={markerAt.x} cy={markerAt.y} r={13} fill={hex} stroke="#ffffff" strokeWidth={4} />
            </g>

            <text
              x={12} y={HEX_SIZE - 12} fontSize={READOUT_PX} className="tabular-nums"
              fill="#ffffff" stroke="#000000" strokeWidth={3} paintOrder="stroke"
            >{t === 0 ? 'the hexagon' : t === 1 ? spaceName : `${(t * 100).toFixed(0)}% of the way to ${spaceName}`}</text>
          </svg>
        </div>

        <div className="flex items-center gap-3">
          <span className="w-16 shrink-0 text-base tabular-nums text-muted-foreground">t {t.toFixed(2)}</span>
          <Slider
            aria-label="Morph the hexagon into the target space"
            value={[t]}
            min={0}
            max={1}
            step={0.005}
            onValueChange={(v) => {
              const next = Array.isArray(v) ? v[0] : v;
              if (typeof next === 'number') setT(next);
            }}
            className="flex-1"
          />
          <div className="flex shrink-0 gap-1">
            {([['0', 0], ['½', 0.5], ['1', 1]] as const).map(([label, v]) => (
              <Button key={label} size="sm" variant="outline" onClick={() => setT(v)}>{label}</Button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex min-w-0 flex-col gap-3">
        <div className="rounded-md border border-border p-3">
          <h3 className="mb-1 font-semibold">This colour</h3>
          <p className="text-base text-muted-foreground">
            The hexagon puts <code className="font-mono">{hex.toUpperCase()}</code> at
            hue <span className="tabular-nums text-foreground">{hsb.h.toFixed(0)}&deg;</span> and
            saturation <span className="tabular-nums text-foreground">{hsb.s.toFixed(0)}</span>.
            {' '}{spaceName} puts it at <span className="tabular-nums text-foreground">{here.angle.toFixed(1)}&deg;</span> from
            red, <span className="tabular-nums text-foreground">{here.reach.toFixed(2)}</span> of
            red&rsquo;s own distance from white. Drag the slider and watch the marker make that trip.
          </p>
        </div>

        <table className="w-full text-base tabular-nums">
          <caption className="mb-1 text-left font-semibold">
            The six corners in {spaceName}
          </caption>
          <thead className="text-muted-foreground">
            <tr>
              <th scope="col" className="text-left font-medium">Corner</th>
              <th scope="col" className="text-right font-medium">HSB</th>
              <th scope="col" className="text-right font-medium">Here</th>
              <th scope="col" className="text-right font-medium">Gap</th>
              <th scope="col" className="text-right font-medium">Reach</th>
            </tr>
          </thead>
          <tbody>
            {readings.map((c) => (
              <tr key={c.name}>
                <th scope="row" className="text-left font-normal">{c.name}</th>
                <td className="text-right text-muted-foreground">{c.hsbHue}&deg;</td>
                <td className="text-right">{c.angle.toFixed(1)}&deg;</td>
                <td className="text-right">{c.gap.toFixed(1)}&deg;</td>
                <td className="text-right">{c.reach.toFixed(2)}</td>
              </tr>
            ))}
            <tr className="border-t border-border text-muted-foreground">
              <th scope="row" className="text-left font-normal">Hexagon</th>
              <td className="text-right">&mdash;</td>
              <td className="text-right">even</td>
              <td className="text-right">60.0&deg;</td>
              <td className="text-right">1.00</td>
            </tr>
          </tbody>
        </table>

        <p className="text-base text-muted-foreground">
          Reach is a multiple of red&rsquo;s own distance from white, which is one
          hexagon radius by construction &mdash; {anchorReach(target).toFixed(3)} in {spaceName}&rsquo;s
          own units. White and red are the only two points pinned; everything
          else went where it was sent.
        </p>
      </div>
    </div>
  );
}

