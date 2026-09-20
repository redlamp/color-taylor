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
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { type RGB } from '@/utils/colorConversions';
import { SPECTRAL_LOCUS, SRGB_TRIANGLE, P3_TRIANGLE, rgbToXyY, D65_WHITE } from '@/utils/cie';
import {
  createCubeRenderer, DEFAULT_PARAMS,
  type CubeParams, type CubeRenderer, type CubeStep, type FloorPath,
} from './cubeRenderer';

const ring = (pts: readonly { x: number; y: number }[]) => pts.map((p) => [p.x, p.y] as const);

/** The floor never changes, so it is built once. */
const LOCUS_PATH: FloorPath = { points: ring(SPECTRAL_LOCUS), colour: [0.62, 0.64, 0.70], closed: true, widthPx: 2 };
const SRGB_PATH: FloorPath = { points: ring(SRGB_TRIANGLE), colour: [1, 1, 1], closed: true, widthPx: 3 };
const P3_PATH: FloorPath = { points: ring(P3_TRIANGLE), colour: [0.55, 0.85, 0.95], closed: true, widthPx: 2 };

export interface CieSolidProps {
  rgb: RGB;
  /** `xyY` the CIE solid, `cube` the RGB cube it is made of. Morphs between. */
  shape: 'xyY' | 'cube';
  showP3: boolean;
  /** 1 is 256 steps a side; 17 is 16, which is easier to see through. */
  step: CubeStep;
}

export default function CieSolid({ rgb, shape, showP3, step }: CieSolidProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rendererRef = useRef<CubeRenderer | null>(null);
  const [unsupported, setUnsupported] = useState(false);
  const [mix, setMix] = useState(1);
  const [cam, setCam] = useState({ theta: Math.PI / 2, phi: Math.PI / 7 });

  // The drop line is the panel's whole argument about brightness: it runs from
  // the colour down to the chromaticity the flat diagram puts it at. Drag
  // brightness and this line is what changes length while the foot stays put.
  const floor = useMemo<FloorPath[]>(() => {
    const paths: FloorPath[] = [LOCUS_PATH, SRGB_PATH];
    if (showP3) paths.push(P3_PATH);
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
  }, [rgb.r, rgb.g, rgb.b, showP3]);

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
    theta: cam.theta,
    phi: cam.phi,
    zoom: 0.68,
    ground: [0x16 / 255, 0x18 / 255, 0x1c / 255],
  }), [rgb.r, rgb.g, rgb.b, step, mix, floor, cam.theta, cam.phi]);

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

  const drag = useRef<{ x: number; y: number; th: number; ph: number } | null>(null);
  const onPointerDown = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    drag.current = { x: e.clientX, y: e.clientY, th: paramsRef.current.theta, ph: paramsRef.current.phi };
    e.currentTarget.setPointerCapture(e.pointerId);
  }, []);
  const onPointerMove = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    const d = drag.current;
    if (!d) return;
    setCam({
      theta: d.th + (e.clientX - d.x) * 0.008,
      phi: Math.max(-Math.PI / 2, Math.min(Math.PI / 2, d.ph + (e.clientY - d.y) * 0.008)),
    });
  }, []);
  const onPointerUp = useCallback(() => { drag.current = null; }, []);
  const reset = useCallback(() => setCam({ theta: Math.PI / 2, phi: Math.PI / 7 }), []);

  if (unsupported) {
    return <p className="p-6 text-base text-muted-foreground">WebGL2 is not available here, so the solid cannot be drawn.</p>;
  }
  return (
    <canvas
      ref={canvasRef}
      data-testid="cie-solid"
      className="block h-full w-full touch-none cursor-grab rounded-md active:cursor-grabbing"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onDoubleClick={reset}
      aria-label={`The sRGB gamut as a solid in CIE xyY. Drag to orbit, double-click to reset. Showing ${D65_WHITE.x.toFixed(4)}, ${D65_WHITE.y.toFixed(4)} as the neutral axis.`}
    />
  );
}
