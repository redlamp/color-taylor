import { useRef, useEffect, useState } from 'react';
import { hsbToRgb, linearToSrgb } from '../../utils/colorConversions';
import type { ColorSpace } from '../../utils/sliderGradients';
import { HEX_SIZE, SIZE, CENTER_X, CENTER_Y, RADIUS, PI, hexEdgeDist } from './hexConstants';
import { createHexGL, type HexGL } from './hexShader';

/**
 * The field at full brightness. 540x540 with an atan2 and a sqrt per pixel is
 * ~292k iterations, so this is the expensive pass - and it only has to run when
 * the color space changes.
 */
function buildBase(isLinear: boolean): Uint8ClampedArray {
  const data = new Uint8ClampedArray(HEX_SIZE * HEX_SIZE * 4);
  {
    const brightness = 100;

      for (let py = 0; py < HEX_SIZE; py++) {
        for (let px = 0; px < HEX_SIZE; px++) {
          const dx = px - CENTER_X;
          const dy = py - CENTER_Y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist > RADIUS) continue;

          const angle = Math.atan2(-dy, dx);
          const edgeDist = hexEdgeDist(angle, RADIUS);

          if (dist > edgeDist) continue;

          let h = (angle * 180) / PI;
          if (h < 0) h += 360;
          const s = (dist / edgeDist) * 100;
          const idx = (py * HEX_SIZE + px) * 4;

          let r, g, b;
          if (isLinear) {
            const bLinear = brightness / 100;
            const sNorm = s / 100;
            const c = bLinear * sNorm;
            const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
            const m = bLinear - c;
            let r1, g1, b1;
            if (h < 60) { [r1, g1, b1] = [c, x, 0]; }
            else if (h < 120) { [r1, g1, b1] = [x, c, 0]; }
            else if (h < 180) { [r1, g1, b1] = [0, c, x]; }
            else if (h < 240) { [r1, g1, b1] = [0, x, c]; }
            else if (h < 300) { [r1, g1, b1] = [x, 0, c]; }
            else { [r1, g1, b1] = [c, 0, x]; }
            // Stored linear and un-transferred; linearToSrgb is applied after
            // the brightness scale, since the two do not commute.
            r = (r1 + m) * 255;
            g = (g1 + m) * 255;
            b = (b1 + m) * 255;
          } else {
            const color = hsbToRgb(h, s, brightness);
            r = color.r;
            g = color.g;
            b = color.b;
          }

          data[idx] = r;
          data[idx + 1] = g;
          data[idx + 2] = b;
          data[idx + 3] = 255;
        }
      }

  }
  return data;
}

export default function HexCanvas({ brightness, colorSpace, extent = SIZE, svgHeight = HEX_SIZE }: { brightness: number; colorSpace: ColorSpace; extent?: number; svgHeight?: number }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const baseRef = useRef<{ space: ColorSpace; data: Uint8ClampedArray } | null>(null);
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
        gl.draw(brightness, colorSpace === 'linear');
        return;
      }

      // No WebGL: the original per-pixel path, at the fixed 540 grid.
      if (canvas.width !== HEX_SIZE) {
        canvas.width = HEX_SIZE;
        canvas.height = HEX_SIZE;
      }
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // HSB is linear in brightness: rgb(h, s, b) === (b/100) * rgb(h, s, 100).
      // So the trig-heavy pass runs once per color space and a brightness
      // change becomes a per-channel multiply.
      if (!baseRef.current || baseRef.current.space !== colorSpace) {
        baseRef.current = { space: colorSpace, data: buildBase(colorSpace === 'linear') };
      }
      const base = baseRef.current.data;
      const out = ctx.createImageData(HEX_SIZE, HEX_SIZE);
      const data = out.data;
      const k = brightness / 100;
      const isLinear = colorSpace === 'linear';

      for (let i = 0; i < base.length; i += 4) {
        if (base[i + 3] === 0) continue;
        if (isLinear) {
          data[i] = linearToSrgb((base[i] / 255) * k);
          data[i + 1] = linearToSrgb((base[i + 1] / 255) * k);
          data[i + 2] = linearToSrgb((base[i + 2] / 255) * k);
        } else {
          data[i] = base[i] * k;
          data[i + 1] = base[i + 1] * k;
          data[i + 2] = base[i + 2] * k;
        }
        data[i + 3] = 255;
      }
      ctx.putImageData(out, 0, 0);
    });
    return () => cancelAnimationFrame(rafId);
  }, [brightness, colorSpace, box]);

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
