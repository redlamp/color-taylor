import { useRef, useEffect, useState } from 'react';
import { hsbToRgb, hslToRgb, linearToSrgb } from '../../utils/colorConversions';
import type { ColorSpace } from '../../utils/sliderGradients';
import { HEX_SIZE, SIZE, CENTER_X, CENTER_Y, RADIUS, PI, shapeEdgeDist, blLimitScale, type BLMode } from './hexConstants';
import { createHexGL, type HexGL } from './hexShader';

/**
 * The field, drawn the way the geometry actually works.
 *
 * Radius is chroma, not saturation: at brightness b the reachable colours are
 * the cube's cross-section, a hexagon of radius b/100. Inside it saturation is
 * measured against *that* edge, so the vector chain's tip lands under the
 * cursor. Outside it each pixel previews what dragging there would select -
 * full saturation at the brightness that reach requires - at a low alpha,
 * because getting there means moving the brightness bar. See hexShader.ts,
 * which does the same thing on the GPU and is the path that normally runs.
 *
 * This used to cache a brightness-100 base and scale it per frame, since HSB is
 * linear in brightness. That no longer holds: the cross-section's edge moves
 * with brightness, so the saturation at a given pixel is not a fixed value
 * being dimmed. The trig runs per draw now - 540x540 with an atan2 and a sqrt
 * each - which is why this is the fallback and WebGL is the path taken.
 */
function buildField(isLinear: boolean, brightness: number, lightness: number, mode: BLMode, shapeMix: number): Uint8ClampedArray {
  const data = new Uint8ClampedArray(HEX_SIZE * HEX_SIZE * 4);

  for (let py = 0; py < HEX_SIZE; py++) {
    for (let px = 0; px < HEX_SIZE; px++) {
      const dx = px - CENTER_X;
      const dy = py - CENTER_Y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > RADIUS) continue;

      const angle = Math.atan2(-dy, dx);
      const edgeDist = shapeEdgeDist(angle, RADIUS, shapeMix);
      if (dist > edgeDist) continue;

      let h = (angle * 180) / PI;
      if (h < 0) h += 360;

      const limit = edgeDist * blLimitScale(mode, brightness, lightness);
      const rN = dist / edgeDist;
      const sIn = limit > 0 ? Math.min((dist / limit) * 100, 100) : 0;
      const inside = dist <= limit;
      const a = inside ? 255 : 82; // 82 is the 0.32 the shader uses

      // Under HSL the field is HSL colours against the HSL cross-section, and
      // expanding runs L toward 50 rather than up. Values are carried as HSB
      // below only because that is what the srgb branch needs.
      let s: number;
      let b: number;
      if (mode === 'brightness') {
        s = inside ? sIn : 100;
        b = inside ? brightness : rN * 100;
      } else {
        const lOut = lightness <= 50 ? rN * 50 : 100 - rN * 50;
        const asRgb = inside ? hslToRgb(h, sIn, lightness) : hslToRgb(h, 100, lOut);
        const idxL = (py * HEX_SIZE + px) * 4;
        data[idxL] = isLinear ? linearToSrgb(asRgb.r / 255) : asRgb.r;
        data[idxL + 1] = isLinear ? linearToSrgb(asRgb.g / 255) : asRgb.g;
        data[idxL + 2] = isLinear ? linearToSrgb(asRgb.b / 255) : asRgb.b;
        data[idxL + 3] = a;
        continue;
      }

      const idx = (py * HEX_SIZE + px) * 4;
      let r: number, g: number, bl: number;
      if (isLinear) {
        const bN = b / 100;
        const sN = s / 100;
        const c = bN * sN;
        const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
        const m = bN - c;
        let r1: number, g1: number, b1: number;
        if (h < 60) { [r1, g1, b1] = [c, x, 0]; }
        else if (h < 120) { [r1, g1, b1] = [x, c, 0]; }
        else if (h < 180) { [r1, g1, b1] = [0, c, x]; }
        else if (h < 240) { [r1, g1, b1] = [0, x, c]; }
        else if (h < 300) { [r1, g1, b1] = [x, 0, c]; }
        else { [r1, g1, b1] = [c, 0, x]; }
        // The transfer is applied after the brightness scale; the two do not
        // commute.
        r = linearToSrgb(r1 + m);
        g = linearToSrgb(g1 + m);
        bl = linearToSrgb(b1 + m);
      } else {
        const color = hsbToRgb(h, s, b);
        r = color.r;
        g = color.g;
        bl = color.b;
      }

      data[idx] = r;
      data[idx + 1] = g;
      data[idx + 2] = bl;
      data[idx + 3] = a;
    }
  }
  return data;
}

export default function HexCanvas({ brightness, lightness = 50, blMode = 'brightness', colorSpace, extent = SIZE, svgHeight = HEX_SIZE, shapeMix = 1 }: { brightness: number; lightness?: number; blMode?: BLMode; colorSpace: ColorSpace; extent?: number; svgHeight?: number; shapeMix?: number }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const glRef = useRef<HexGL | null | undefined>(undefined);
  const [box, setBox] = useState({ w: HEX_SIZE, h: HEX_SIZE });

  // Render at the size actually shown. The 2D path used to paint a fixed
  // 540x540 bitmap and let CSS stretch it, which is why a wide panel looked
  // soft.
  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;
    const measure = () => {
      const r = el.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      const w = Math.max(1, Math.round(r.width * dpr));
      const h = Math.max(1, Math.round(r.height * dpr));
      setBox((prev) => (prev.w === w && prev.h === h ? prev : { w, h }));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const rafId = requestAnimationFrame(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      if (glRef.current === undefined) glRef.current = createHexGL(canvas);
      const gl = glRef.current;

      if (gl) {
        if (canvas.width !== box.w || canvas.height !== box.h) gl.resize(box.w, box.h);
        gl.draw(brightness, lightness, blMode === 'lightness', colorSpace === 'linear', shapeMix);
        return;
      }

      // No WebGL: the original per-pixel path, at the fixed 540 grid.
      if (canvas.width !== HEX_SIZE) {
        canvas.width = HEX_SIZE;
        canvas.height = HEX_SIZE;
      }
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Rebuilt per draw rather than scaled from a cached base - see buildField
      // for why the brightness-is-a-multiply shortcut no longer holds.
      const out = ctx.createImageData(HEX_SIZE, HEX_SIZE);
      out.data.set(buildField(colorSpace === 'linear', brightness, lightness, blMode, shapeMix));
      ctx.putImageData(out, 0, 0);
    });
    return () => cancelAnimationFrame(rafId);
  }, [brightness, lightness, blMode, colorSpace, shapeMix, box]);

  useEffect(() => () => glRef.current?.dispose(), []);

  return (
    <canvas
      id="hex-canvas"
      ref={canvasRef}
      className="absolute top-0 left-0 rounded-sm"
      // The field is HEX_SIZE user units square. Both axes are percentages of
      // the wrapper for that reason - `height: 100%` was only ever right while
      // the wrapper was exactly HEX_SIZE tall, and it stretches the hexagon
      // past its own outline once the saturation bar makes the box taller.
      style={{ width: `${(HEX_SIZE / extent) * 100}%`, height: `${(HEX_SIZE / svgHeight) * 100}%` }}
    />
  );
}
