import { useRef, useEffect } from 'react';
import { hsbToRgb, linearToSrgb } from '../../utils/colorConversions';
import type { ColorSpace } from '../../utils/sliderGradients';
import { HEX_SIZE, SIZE, CENTER_X, CENTER_Y, RADIUS, PI, hexEdgeDist } from './hexConstants';

/**
 * The field at full brightness. 540x540 with an atan2 and a sqrt per pixel is
 * ~292k iterations, so this is the expensive pass - and it only has to run when
 * the colour space changes.
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

export default function HexCanvas({ brightness, colorSpace }: { brightness: number; colorSpace: ColorSpace }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const baseRef = useRef<{ space: ColorSpace; data: Uint8ClampedArray } | null>(null);

  useEffect(() => {
    const rafId = requestAnimationFrame(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // HSB is linear in brightness: rgb(h, s, b) === (b/100) * rgb(h, s, 100).
      // So the trig-heavy pass runs once per colour space and a brightness
      // change becomes a per-channel multiply. That is the difference between
      // keeping up with a colour being dragged elsewhere and not.
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
          // linearToSrgb is not linear, so it has to come after the scale.
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
  }, [brightness, colorSpace]);

  return (
    <canvas
      id="hex-canvas"
      ref={canvasRef}
      width={HEX_SIZE}
      height={HEX_SIZE}
      className="absolute top-0 left-0 rounded-sm"
      style={{ width: `${(HEX_SIZE / SIZE) * 100}%`, height: '100%' }}
    />
  );
}
