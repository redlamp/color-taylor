import { useRef, useEffect } from 'react';
import { hsbToRgb, srgbToLinear, linearToSrgb } from '../../utils/colorConversions';
import { HEX_SIZE, CENTER, RADIUS, PI, hexEdgeDist } from './hexConstants';

export default function HexCanvas({ brightness, colorSpace }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const rafId = requestAnimationFrame(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      const imageData = ctx.createImageData(HEX_SIZE, HEX_SIZE);
      const data = imageData.data;
      const isLinear = colorSpace === 'linear';

      for (let py = 0; py < HEX_SIZE; py++) {
        for (let px = 0; px < HEX_SIZE; px++) {
          const dx = px - CENTER;
          const dy = py - CENTER;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist > RADIUS) continue;

          const angle = Math.atan2(-dy, dx);
          const edgeDist = hexEdgeDist(angle, RADIUS);

          if (dist > edgeDist) continue;

          let h = (angle * 180) / PI;
          if (h < 0) h += 360;
          const s = (dist / edgeDist) * 100;
          const idx = (py * HEX_SIZE + px) * 4;

          if (isLinear) {
            // HSB mixing in linear space: treat HSB output as linear, gamma-encode for display
            // This produces physically accurate blending — mid-tones appear brighter
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
            data[idx] = linearToSrgb(r1 + m);
            data[idx + 1] = linearToSrgb(g1 + m);
            data[idx + 2] = linearToSrgb(b1 + m);
            data[idx + 3] = 255;
          } else {
            const color = hsbToRgb(h, s, brightness);
            data[idx] = color.r;
            data[idx + 1] = color.g;
            data[idx + 2] = color.b;
            data[idx + 3] = 255;
          }
        }
      }

      ctx.putImageData(imageData, 0, 0);
    });
    return () => cancelAnimationFrame(rafId);
  }, [brightness, colorSpace]);

  return (
    <canvas
      id="hex-canvas"
      ref={canvasRef}
      width={HEX_SIZE}
      height={HEX_SIZE}
      className="absolute inset-0 rounded-sm"
    />
  );
}
