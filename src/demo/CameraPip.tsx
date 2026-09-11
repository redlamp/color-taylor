/**
 * The presenter's camera, as the picture-in-picture panel the recording has.
 *
 * A fixed box in the bottom-right corner, the same 399x362 at a 20px margin
 * with a 12px radius that the OBS scene uses, so what the script drags around
 * lines up with what the camera is composited into afterwards. It shows the
 * webcam where the browser gives one and a dark plate with a camera glyph
 * where it does not - the placeholder is not a fallback, it is what the take
 * is recorded against when the real camera is on the OBS side.
 *
 * Mounted only under `?script=` or `?present=` (dev), so nothing about it
 * reaches the app. It moves by `transform` alone, written by the script
 * runner's `pip` action, which drags it off the right edge and back; the
 * current offset lives on `data-pip-x` so a seek can put it back without
 * replaying the gesture.
 */

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Video } from 'lucide-react';

/** The OBS picture-in-picture box, to the pixel. */
export const PIP_WIDTH = 399;
export const PIP_HEIGHT = 362;
export const PIP_MARGIN = 20;
export const PIP_RADIUS = 12;

export default function CameraPip() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [live, setLive] = useState(false);

  useEffect(() => {
    let alive = true;
    let stream: MediaStream | null = null;
    const media = navigator.mediaDevices;
    if (!media?.getUserMedia) return;
    media
      .getUserMedia({ video: { width: 1280, height: 720 }, audio: false })
      .then((s) => {
        if (!alive) { s.getTracks().forEach((t) => t.stop()); return; }
        stream = s;
        const el = videoRef.current;
        if (el) {
          el.srcObject = s;
          el.play().catch(() => { /* autoplay blocked; the plate stands in */ });
        }
        setLive(true);
      })
      // No permission, no camera, or an insecure origin: the plate stands in.
      .catch(() => { if (alive) setLive(false); });
    return () => {
      alive = false;
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  return createPortal(
    <div
      id="camera-pip"
      data-testid="camera-pip"
      data-pip-x="0"
      aria-hidden="true"
      className="pointer-events-none fixed overflow-hidden"
      style={{
        right: PIP_MARGIN,
        bottom: PIP_MARGIN,
        width: PIP_WIDTH,
        height: PIP_HEIGHT,
        borderRadius: PIP_RADIUS,
        // Under the ghost cursor's layer (z-60) so the cursor that drags it
        // stays on top of it, and over the app so it reads as an overlay.
        zIndex: 55,
        background: '#111114',
        boxShadow: '0 10px 28px rgba(0,0,0,0.45)',
        transform: 'translateX(0px)',
        willChange: 'transform',
      }}
    >
      <video
        ref={videoRef}
        muted
        playsInline
        data-testid="camera-pip-video"
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          // Mirrored, the way every camera preview is: the presenter is
          // watching themselves while the script runs.
          transform: 'scaleX(-1)',
          display: live ? 'block' : 'none',
        }}
      />
      {!live && (
        <div
          data-testid="camera-pip-placeholder"
          style={{
            display: 'flex',
            width: '100%',
            height: '100%',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'rgba(255,255,255,0.28)',
          }}
        >
          <Video size={64} strokeWidth={1.25} />
        </div>
      )}
    </div>,
    document.body,
  );
}
