import { useRef, useEffect } from 'react';
import { hsbToRgb } from '../../utils/colorConversions';
import { HEX_SIZE, CENTER, RADIUS, PI, hexEdgeDist } from './hexConstants';

export default function HexCanvas({ brightness }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const rafId = requestAnimationFrame(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      const imageData = ctx.createImageData(HEX_SIZE, HEX_SIZE);
      const data = imageData.data;

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
          const color = hsbToRgb(h, s, brightness);

          const idx = (py * HEX_SIZE + px) * 4;
          data[idx] = color.r;
          data[idx + 1] = color.g;
          data[idx + 2] = color.b;
          data[idx + 3] = 255;
        }
      }

      ctx.putImageData(imageData, 0, 0);
    });
    return () => cancelAnimationFrame(rafId);
  }, [brightness]);

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
