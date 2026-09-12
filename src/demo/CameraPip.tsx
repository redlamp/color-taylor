/**
 * The presenter's camera, as the picture-in-picture panel the recording has.
 *
 * A fixed box in the bottom-right corner, the same 399x362 at a 20px margin
 * with a 12px radius that the OBS scene uses, so what the script drags around
 * lines up with what the camera is composited into afterwards. It shows the
 * camera footage of the cut where there is any (see below), the webcam where
 * the browser gives one, and a dark plate with a camera glyph where it does
 * not - the placeholder is not a fallback, it is what the take is recorded
 * against when the real camera is on the OBS side.
 *
 * Under `?present=<cut>` the panel plays the take instead: the beats that have
 * Taylor on camera - the intro and the wrap - are cut into one small video per
 * line by redlamp-videos `tools/takes/cut-pip-clips.mjs`, and
 * `scripts/<cut>-pip.json` says where each one belongs in the cut. That is
 * what makes those beats watchable in context; between them the panel is
 * dragged off the right edge anyway, so nothing is cut for the middle of the
 * video. Where the manifest is missing, or the cut is being played on the
 * page's own clock under `?script=`, the webcam and the plate stand in as
 * before.
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

/** One line's footage: `video.currentTime = t - cutStart + clipOffset`. */
interface PipClip {
  id: string;
  /** Relative to `scripts/`, as the tool writes it: `pip/<cut>/<id>.mp4`. */
  file: string;
  cutStart: number;
  cutEnd: number;
  clipOffset: number;
}

/**
 * How far the picture may drift from the voice before it is seeked, in
 * seconds. A frame of the take is 1/60 s, so this is two frames: tight enough
 * that a spoken word and the mouth saying it stay together, loose enough that
 * a `currentTime` write - which restarts decoding - is rare while playing.
 */
const DRIFT = 0.04;

/** Read the URL once, the way presentation mode does. Dev builds only. */
function presentName(): string | null {
  if (!import.meta.env.DEV) return null;
  try {
    const raw = new URLSearchParams(window.location.search).get('present');
    return raw && /^[\w-]+$/.test(raw) ? raw : null;
  } catch {
    return null;
  }
}

/** The entry covering `t`, or the one to hold a frame of when none does. */
function clipAt(clips: PipClip[], t: number): { clip: PipClip; inside: boolean } | null {
  if (!clips.length) return null;
  let prev: PipClip | null = null;
  for (const c of clips) {
    if (t < c.cutStart) break;
    if (t < c.cutEnd) return { clip: c, inside: true };
    prev = c;
  }
  // Before the first entry the panel holds that entry's first frame; after one
  // it holds its last, which is the take carrying on past the line.
  return prev ? { clip: prev, inside: false } : { clip: clips[0], inside: false };
}

export default function CameraPip() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [live, setLive] = useState(false);
  const [clips, setClips] = useState<PipClip[]>([]);

  /* The cut's camera footage, when this presentation has any. */
  useEffect(() => {
    const name = presentName();
    if (!name) return;
    let alive = true;
    fetch(`${import.meta.env.BASE_URL}scripts/${name}-pip.json`)
      .then((res) => (res.ok ? (res.json() as Promise<{ lines?: PipClip[] }>) : null))
      .then((data) => {
        if (!alive || !data || !Array.isArray(data.lines)) return;
        setClips([...data.lines].sort((a, b) => a.cutStart - b.cutStart));
      })
      // No manifest: the cut has no camera clips yet, and the webcam stands in.
      .catch(() => { /* nothing to play */ });
    return () => { alive = false; };
  }, []);

  /* The webcam, unless the cut's own footage is playing instead. */
  useEffect(() => {
    if (clips.length) return;
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
  }, [clips.length]);

  /**
   * The footage against the presentation's clock.
   *
   * Presentation mode's clock is its `<audio>` element's position - the same
   * one the script runner is driven by - so the panel reads that element
   * rather than taking a prop: the transport, a scrub of the timeline and a
   * pause all show up in `currentTime` and `paused` with nothing to subscribe
   * to. Read every frame, because a scrub writes `currentTime` without ever
   * firing a distinguishable event.
   */
  useEffect(() => {
    if (!clips.length) return;
    let raf = 0;
    let src = '';
    const base = `${import.meta.env.BASE_URL}scripts/`;
    const frame = () => {
      raf = requestAnimationFrame(frame);
      const v = videoRef.current;
      const audio = document.querySelector<HTMLAudioElement>('audio[data-testid="present-audio"]');
      if (!v || !audio) return;
      const t = audio.currentTime;
      const hit = clipAt(clips, t);
      if (!hit) return;
      const { clip, inside } = hit;
      if (src !== clip.file) {
        src = clip.file;
        v.src = base + clip.file;
      }
      // Outside the entry the panel is a still: its last frame, or - before
      // the cut has reached the first entry - its first.
      const want = inside
        ? t - clip.cutStart + clip.clipOffset
        : t < clip.cutStart
          ? clip.clipOffset
          : clip.cutEnd - clip.cutStart + clip.clipOffset;
      const playing = inside && !audio.paused && !audio.ended;
      const at = Math.max(0, v.duration ? Math.min(want, v.duration - 1 / 120) : want);
      if (v.readyState >= 1 && Math.abs(v.currentTime - at) > DRIFT) v.currentTime = at;
      if (playing && v.paused) v.play().catch(() => { /* seeking, or not decodable yet */ });
      else if (!playing && !v.paused) v.pause();
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [clips]);

  const showVideo = clips.length > 0 || live;
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
        preload="auto"
        data-testid="camera-pip-video"
        data-source={clips.length ? 'cut' : 'webcam'}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          // A webcam preview is mirrored, the way every camera preview is: the
          // presenter is watching themselves while the script runs. The cut's
          // footage is not - it is the picture as it was recorded, and the
          // shelf behind him reads backwards if it is flipped.
          transform: clips.length ? 'none' : 'scaleX(-1)',
          display: showVideo ? 'block' : 'none',
        }}
      />
      {!showVideo && (
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
