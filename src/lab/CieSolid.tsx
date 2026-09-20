/**
 * The sRGB gamut as a solid in CIE xyY: chromaticity on the floor, relative
 * luminance up the vertical axis.
 *
 * It is the same cloud of colours the RGB cube is made of, positioned by the
 * xyY arm of `cubeRenderer`'s vertex shader - not a second renderer. So the
 * `Cube` toggle is a morph rather than a cut, and the two pictures are
 * demonstrably the same solid.
 *
 * What it is here to show is the *roof*: the tallest luminance sRGB holds over
 * each chromaticity. Green reaches Y = 0.7152 and blue reaches Y = 0.0722, so
 * the solid towers over one corner of its floor and lies almost flat over the
 * other. That is why blue is dark, drawn rather than tabulated.
 *
 * FIVE VIEWS, AND ONE OF THEM IS AN ARGUMENT. `front`, `right` and `iso` are
 * conveniences. `top` is the panel's whole point: from straight overhead the
 * solid's silhouette is its own floor, and that floor is the flat chromaticity
 * diagram drawn elsewhere on the page. It only lands if it arrives the same
 * way up, so `top` pins the azimuth as well as the elevation - see
 * cieViews.ts, and the test in cieSolid.test.ts that holds the two figures to
 * one orientation.
 *
 * `camera` is not a position. It is where a drag left the camera, which is why
 * dragging switches to it rather than fighting it.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { type RGB } from '@/utils/colorConversions';
import { SPECTRAL_LOCUS, rgbToXyY, D65_WHITE } from '@/utils/cie';
import { gamutMaths, type Gamut, type GamutId } from '@/utils/gamuts';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GAMUT_TINT } from './CieDiagram';
import { VIEW_ANGLES, VIEW_LABELS, type CieView } from './cieViews';
import { DISPLAY_IS_P3 } from './wideGamut';
import {
  createCubeRenderer, DEFAULT_PARAMS,
  type CubeParams, type CubeRenderer, type CubeStep, type FloorPath,
} from './cubeRenderer';

const ring = (pts: readonly { x: number; y: number }[]) => pts.map((p) => [p.x, p.y] as const);

/** The locus never changes, so it is built once. */
const LOCUS_PATH: FloorPath = { points: ring(SPECTRAL_LOCUS), colour: [0.62, 0.64, 0.70], closed: true, widthPx: 2 };

/** The order the toggles appear in. `camera` last: it is the odd one out. */
const VIEW_ORDER: readonly CieView[] = ['front', 'right', 'top', 'iso', 'camera'];

export interface CieSolidProps {
  rgb: RGB;
  /** `xyY` the CIE solid, `cube` the RGB cube it is made of. Morphs between. */
  shape: 'xyY' | 'cube';
  /** Every gamut to lay on the floor. The active one is drawn white and thick. */
  gamuts: readonly Gamut[];
  activeId: GamutId;
  /** 1 is 256 steps a side; 17 is 16, which is easier to see through. */
  step: CubeStep;
}

export default function CieSolid({ rgb, shape, gamuts, activeId, step }: CieSolidProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rendererRef = useRef<CubeRenderer | null>(null);
  const [unsupported, setUnsupported] = useState(false);
  const [mix, setMix] = useState(1);
  const [cam, setCam] = useState(VIEW_ANGLES.iso);
  const [view, setView] = useState<CieView>('iso');
  /** Where a free orbit was left, so the `camera` tab has somewhere to return to. */
  const freeCam = useRef(VIEW_ANGLES.iso);

  // The drop line is the panel's whole argument about brightness: it runs from
  // the colour down to the chromaticity the flat diagram puts it at. Drag
  // brightness and this line is what changes length while the foot stays put.
  const floor = useMemo<FloorPath[]>(() => {
    const paths: FloorPath[] = [LOCUS_PATH];
    // Non-active first, so the active outline is never drawn under a dim one.
    for (const g of gamuts) {
      if (g.id === activeId) continue;
      paths.push({ points: ring(g.primaries), colour: GAMUT_TINT[g.id], closed: true, widthPx: 2 });
    }
    const active = gamuts.find((g) => g.id === activeId);
    if (active) paths.push({ points: ring(active.primaries), colour: [1, 1, 1], closed: true, widthPx: 3 });
    const here = rgbToXyY(rgb.r, rgb.g, rgb.b);
    if (here) {
      paths.push({
        points: [[here.x, here.y], [here.x, here.y]],
        heights: [0, here.Y],
        colour: [1, 1, 1],
        widthPx: 2,
        onTop: true,
      });
      // a crosshair on the floor, so the foot of the drop is findable. On top
      // too: the solid stands over its own floor everywhere it is in gamut.
      const d = 0.02;
      paths.push({ points: [[here.x - d, here.y], [here.x + d, here.y]], colour: [1, 1, 1], widthPx: 2, onTop: true });
      paths.push({ points: [[here.x, here.y - d], [here.x, here.y + d]], colour: [1, 1, 1], widthPx: 2, onTop: true });
    }
    return paths;
  }, [rgb.r, rgb.g, rgb.b, gamuts, activeId]);

  const params = useMemo<CubeParams>(() => ({
    ...DEFAULT_PARAMS,
    rgb: [rgb.r / 255, rgb.g / 255, rgb.b / 255],
    cubeStyle: 'dots',
    cubeStep: step,
    reveal: 'all',
    axes: false,
    // One step is about a pixel at 256 a side, and the marker is the point of
    // the panel, so it is drawn many times its cell.
    markerScale: step === 1 ? 13 : step === 17 ? 1.8 : 1,
    pointScale: step === 1 ? 2.4 : 1.1,
    outlineW: 2.5,
    xyYMix: mix,
    xyYFloor: floor,
    /*
     * The solid is a different shape in every space, and this is where that
     * happens: the same cube of 8-bit triples, decoded by this space's curve
     * and mapped by this space's matrix. Rec. 2020's roof towers higher over
     * green and lies flatter over blue than sRGB's; ProPhoto's blue carries
     * a ten-thousandth of white's luminance and its corner is on the floor.
     */
    xyYRgbToXyz: gamutMaths(activeId).toXyz,
    xyYTrc: [
      gamutMaths(activeId).trc.cut,
      gamutMaths(activeId).trc.slope,
      gamutMaths(activeId).trc.a,
      gamutMaths(activeId).trc.gamma,
    ],
    /*
     * Widened only for Display P3, and only where the screen has it.
     *
     * The dots are drawn in the values they stand for, so a P3 buffer shows
     * P3 values correctly and an sRGB buffer clamps them. Adobe RGB, Rec. 2020
     * and ProPhoto have no buffer of their own here: their *positions* are
     * exact - that is what the matrix above buys - but the colours are shown
     * as the nearest thing the buffer can say, and the page says so.
     */
    bufferColorSpace: DISPLAY_IS_P3 && activeId === 'p3' ? 'display-p3' : 'srgb',
    theta: cam.theta,
    phi: cam.phi,
    zoom: 0.68,
    ground: [0x16 / 255, 0x18 / 255, 0x1c / 255],
  }), [rgb.r, rgb.g, rgb.b, step, mix, floor, cam.theta, cam.phi, activeId]);

  const paramsRef = useRef(params);
  useEffect(() => { paramsRef.current = params; }, [params]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let r: CubeRenderer | null = null;
    try { r = createCubeRenderer(canvas); } catch (e) { console.error(e); }
    if (!r) { queueMicrotask(() => setUnsupported(true)); return; }
    rendererRef.current = r;
    const ro = new ResizeObserver(() => r.render(paramsRef.current));
    ro.observe(canvas);
    return () => { ro.disconnect(); r.destroy(); rendererRef.current = null; };
  }, []);

  useEffect(() => { rendererRef.current?.render(params); }, [params]);

  // Morph rather than cut: the claim is that these are one solid, and a cut
  // would only assert it.
  const mixRaf = useRef(0);
  useEffect(() => {
    const to = shape === 'xyY' ? 1 : 0;
    cancelAnimationFrame(mixRaf.current);
    const from = paramsRef.current.xyYMix;
    if (from === to) return;
    const start = performance.now(), ms = 900;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / ms);
      const e = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
      setMix(from + (to - from) * e);
      if (t < 1) mixRaf.current = requestAnimationFrame(tick);
    };
    mixRaf.current = requestAnimationFrame(tick);
  }, [shape]);
  useEffect(() => () => cancelAnimationFrame(mixRaf.current), []);

  /*
   * A tween to a named view, azimuth and elevation together.
   *
   * The azimuth takes the shortest way round, the same wrapping CubeBench's
   * `goView` does and for the same reason: after three drags theta can be six
   * radians from where it started, and interpolating to the target raw spins
   * the solid twice before arriving.
   */
  const viewRaf = useRef(0);
  const goView = useCallback((theta: number, phi: number) => {
    cancelAnimationFrame(viewRaf.current);
    const from = { theta: paramsRef.current.theta, phi: paramsRef.current.phi };
    const two = Math.PI * 2;
    let dTheta = ((theta - from.theta) % two + two * 1.5) % two - Math.PI;
    if (Math.abs(dTheta) < 1e-9) dTheta = 0;
    const start = performance.now(), ms = 550;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / ms);
      const e = 1 - (1 - t) * (1 - t) * (1 - t);
      setCam({ theta: from.theta + dTheta * e, phi: from.phi + (phi - from.phi) * e });
      if (t < 1) viewRaf.current = requestAnimationFrame(tick);
    };
    viewRaf.current = requestAnimationFrame(tick);
  }, []);
  useEffect(() => () => cancelAnimationFrame(viewRaf.current), []);

  const pickView = useCallback((next: CieView) => {
    setView(next);
    const to = next === 'camera' ? freeCam.current : VIEW_ANGLES[next];
    goView(to.theta, to.phi);
  }, [goView]);

  const drag = useRef<{ x: number; y: number; th: number; ph: number } | null>(null);
  const onPointerDown = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    cancelAnimationFrame(viewRaf.current);
    drag.current = { x: e.clientX, y: e.clientY, th: paramsRef.current.theta, ph: paramsRef.current.phi };
    e.currentTarget.setPointerCapture(e.pointerId);
  }, []);
  const onPointerMove = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    const d = drag.current;
    if (!d) return;
    const next = {
      theta: d.th + (e.clientX - d.x) * 0.008,
      phi: Math.max(-Math.PI / 2, Math.min(Math.PI / 2, d.ph + (e.clientY - d.y) * 0.008)),
    };
    // A drag *is* the camera view. Saying so beats a toggle that keeps
    // claiming "Top" while the solid is plainly not overhead any more.
    freeCam.current = next;
    setView('camera');
    setCam(next);
  }, []);
  const onPointerUp = useCallback(() => { drag.current = null; }, []);

  if (unsupported) {
    return <p className="p-6 text-base text-muted-foreground">WebGL2 is not available here, so the solid cannot be drawn.</p>;
  }
  return (
    <div className="relative h-full w-full">
      <canvas
        ref={canvasRef}
        data-testid="cie-solid"
        className="block h-full w-full touch-none cursor-grab rounded-md active:cursor-grabbing"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onDoubleClick={() => pickView('iso')}
        aria-label={`The sRGB gamut as a solid in CIE xyY, seen from ${VIEW_LABELS[view].toLowerCase()}. Drag to orbit, double-click to reset. The neutral axis stands on D65, ${D65_WHITE.x.toFixed(4)}, ${D65_WHITE.y.toFixed(4)}.`}
      />
      <div className="absolute bottom-2 left-2">
        <Tabs value={view} onValueChange={(v) => pickView(v as CieView)}>
          <TabsList>
            {VIEW_ORDER.map((v) => (
              // text-base is the page's size; the primitive's own text-sm is
              // for a dense panel and this strip sits on a picture.
              <TabsTrigger key={v} value={v} className="px-2.5 text-base">{VIEW_LABELS[v]}</TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>
    </div>
  );
}
