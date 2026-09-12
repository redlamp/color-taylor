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
 * Taylor on camera - the intro and the wrap - are cut into one continuous
 * video per beat by redlamp-videos `tools/takes/cut-pip-clips.mjs`, and
 * `scripts/<cut>-pip.json` says where each one belongs in the cut. That is
 * what makes those beats watchable in context; between them the panel is
 * dragged off the right edge anyway, so nothing is cut for the middle of the
 * video. Where the manifest is missing, or the cut is being played on the
 * page's own clock under `?script=`, the webcam and the plate stand in as
 * before.
 *
 * One file per beat rather than per line, and two `<video>` elements rather
 * than one, because every `src` write is a visible pop: the element blanks
 * while the new file is decoded. So the element that is on screen never has
 * its `src` touched. The span it is playing runs the whole beat - the lines
 * and the silences between them - and the other element sits hidden with the
 * *next* span loaded and seeked to its first frame, so the change of span is a
 * change of which one is opaque. The one that just went hidden then takes the
 * span after that.
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

/** One span of footage: `video.currentTime = t - cutStart + clipOffset`. */
interface PipClip {
  id: string;
  /** Relative to `scripts/`, as the tool writes it: `pip/<cut>/<id>.mp4`. */
  file: string;
  cutStart: number;
  cutEnd: number;
  clipOffset: number;
}

/**
 * How far the picture may drift from the voice while it is playing before it is
 * seeked, in seconds. A frame of the take is 1/60 s, so this is two frames:
 * tight enough that a spoken word and the mouth saying it stay together, loose
 * enough that a `currentTime` write - which restarts decoding, and shows as a
 * stutter - is rare. It is a threshold and not a correction on every frame for
 * that reason: a decoder a frame behind catches itself up, a scrub does not.
 */
const DRIFT = 0.04;

/**
 * And how far while it is paused, which is half a frame: a scrub has to land on
 * the exact frame, because nothing after it is going to move.
 */
const EXACT = 1 / 120;

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
function clipAt(clips: PipClip[], t: number): { clip: PipClip; i: number; inside: boolean } | null {
  if (!clips.length) return null;
  let prev = -1;
  for (let i = 0; i < clips.length; i++) {
    if (t < clips[i].cutStart) break;
    if (t < clips[i].cutEnd) return { clip: clips[i], i, inside: true };
    prev = i;
  }
  // Before the first entry the panel holds that entry's first frame; after one
  // it holds its last, which is the take carrying on past the line.
  return prev >= 0 ? { clip: clips[prev], i: prev, inside: false } : { clip: clips[0], i: 0, inside: false };
}

/** One of the two elements, and the span it is pointed at. */
interface Slot {
  el: HTMLVideoElement | null;
  entry: PipClip | null;
  /** Whether its first frame has been decoded, so showing it is free. */
  parked: boolean;
}

export default function CameraPip() {
  // A is the one the webcam uses, and the one a span is shown on first; B is
  // its double, hidden, holding the span that comes next.
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const spareRef = useRef<HTMLVideoElement | null>(null);
  const [live, setLive] = useState(false);
  const [clips, setClips] = useState<PipClip[]>([]);
  /** Whether the footage has a frame to show. Until it has, the plate does. */
  const [decoded, setDecoded] = useState(false);
  /**
   * The panel's home `left`, so the gap between the app's right edge and the
   * panel equals the gap between the panel and the display's right edge -
   * rather than the panel sitting flush 20px off the display edge regardless
   * of how much room the viewport leaves past the app. `null` while there
   * isn't a sane app edge to measure from, or the viewport is too narrow to
   * leave more than a sliver either side; the fixed 20px margin stands in.
   */
  const [homeLeft, setHomeLeft] = useState<number | null>(null);

  useEffect(() => {
    const compute = () => {
      const app = document.querySelector('#color-editor-group');
      const appRight = app?.getBoundingClientRect().right;
      if (appRight == null) { setHomeLeft(null); return; }
      const gap = (window.innerWidth - appRight - PIP_WIDTH) / 2;
      setHomeLeft(gap >= 8 ? appRight + gap : null);
    };
    compute();
    window.addEventListener('resize', compute);
    return () => window.removeEventListener('resize', compute);
  }, []);

  /* The cut's camera footage, when this presentation has any. */
  useEffect(() => {
    const name = presentName();
    if (!name) return;
    let alive = true;
    fetch(`${import.meta.env.BASE_URL}scripts/${name}-pip.json`)
      .then((res) => (res.ok ? (res.json() as Promise<{ spans?: PipClip[]; lines?: PipClip[] }>) : null))
      .then((data) => {
        // `spans` is what the tool writes now; `lines` is its --per-line mode,
        // which plays by the same rule, one entry to a line.
        const entries = data?.spans ?? data?.lines;
        if (!alive || !Array.isArray(entries) || !entries.length) return;
        setClips([...entries].sort((a, b) => a.cutStart - b.cutStart));
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
   *
   * What a frame does *not* do is touch the `src` of the element on screen.
   * The two elements hand over instead: the visible one plays its span through,
   * the hidden one holds the next span decoded at its first frame, and the
   * moment the clock crosses into it the two swap opacity. See the top of the
   * file.
   */
  useEffect(() => {
    if (!clips.length) return;
    let raf = 0;
    const base = `${import.meta.env.BASE_URL}scripts/`;
    const slots: Slot[] = [
      { el: null, entry: null, parked: false },
      { el: null, entry: null, parked: false },
    ];
    /** Which slot is on screen. The other is always hidden and always paused. */
    let front = 0;
    /** Set once the front element has a frame. Before that the plate is up. */
    let ready = false;
    const show = () => {
      slots.forEach((s, i) => {
        if (!s.el) return;
        s.el.style.opacity = i === front && ready ? '1' : '0';
        // Which element is live, for a test to read: both are in the DOM.
        s.el.dataset.front = i === front ? '1' : '0';
      });
    };
    /** Point a slot at a span. Only ever the hidden one, once a span is up. */
    const attach = (s: Slot, entry: PipClip) => {
      if (!s.el || s.entry?.file === entry.file) return;
      s.entry = entry;
      s.parked = false;
      s.el.src = base + entry.file;
      s.el.load();
    };
    /**
     * Its first frame, decoded and waiting. `load()` alone leaves the element
     * with nothing painted, which is the blank frame the swap is there to
     * avoid; a seek is what makes it produce one.
     */
    const park = (s: Slot) => {
      if (!s.el || !s.entry || s.parked || s.el.readyState < 1) return;
      s.el.currentTime = s.entry.clipOffset;
      s.parked = true;
    };
    const frame = () => {
      raf = requestAnimationFrame(frame);
      slots[0].el = videoRef.current;
      slots[1].el = spareRef.current;
      const audio = document.querySelector<HTMLAudioElement>('audio[data-testid="present-audio"]');
      if (!slots[0].el || !slots[1].el || !audio) return;
      const t = audio.currentTime;
      const hit = clipAt(clips, t);
      if (!hit) return;
      const { clip, i, inside } = hit;

      if (slots[front].entry?.file !== clip.file) {
        if (slots[1 - front].entry?.file === clip.file) {
          // The handover: the span was loaded and decoded before it was due, so
          // arriving at it costs an opacity write and nothing else.
          front = 1 - front;
        } else {
          // Nothing is holding this span - the first mount, or a scrub across
          // the middle of the cut - so the visible element takes it. This is
          // the one case that blanks, and there is no frame to hold instead.
          attach(slots[front], clip);
        }
      }
      const back = slots[1 - front];
      const next = clips[i + 1] ?? clips[i - 1];
      if (next && next.file !== clip.file) {
        attach(back, next);
        park(back);
      }
      if (back.el && !back.el.paused) back.el.pause();

      const v = slots[front].el;
      if (!v) return;
      // Outside the entry the panel is a still: its last frame, or - before
      // the cut has reached the first entry - its first.
      const want = inside
        ? t - clip.cutStart + clip.clipOffset
        : t < clip.cutStart
          ? clip.clipOffset
          : clip.cutEnd - clip.cutStart + clip.clipOffset;
      const playing = inside && !audio.paused && !audio.ended;
      const at = Math.max(0, v.duration ? Math.min(want, v.duration - 1 / 120) : want);
      // Playing, only a gap wide enough to be a seek rather than a decoder a
      // frame or two behind: correcting every frame is a stutter of its own.
      // Paused or scrubbed, exactly - the frame on screen is the whole picture.
      if (v.readyState >= 1 && Math.abs(v.currentTime - at) > (playing ? DRIFT : EXACT)) v.currentTime = at;
      if (playing && v.paused) v.play().catch(() => { /* seeking, or not decodable yet */ });
      else if (!playing && !v.paused) v.pause();
      if (v.readyState >= 2) { ready = true; setDecoded(true); }
      show();
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [clips]);

  // With the cut's own footage the panel waits for a decoded frame rather than
  // showing an empty element: at t=0 the first frame of the intro is already
  // there, so the picture never opens on black.
  const showVideo = (clips.length > 0 && decoded) || live;
  const shared = {
    position: 'absolute' as const,
    inset: 0,
    width: '100%',
    height: '100%',
    objectFit: 'cover' as const,
    // A webcam preview is mirrored, the way every camera preview is: the
    // presenter is watching themselves while the script runs. The cut's
    // footage is not - it is the picture as it was recorded, and the shelf
    // behind him reads backwards if it is flipped.
    transform: clips.length ? 'none' : 'scaleX(-1)',
    // Always laid out, so the element decodes while it is still invisible; what
    // hides it is opacity, and the plate underneath shows through until then.
    display: 'block',
  };
  return createPortal(
    <div
      id="camera-pip"
      data-testid="camera-pip"
      data-pip-x="0"
      aria-hidden="true"
      className="pointer-events-none fixed overflow-hidden"
      style={{
        ...(homeLeft != null ? { left: homeLeft } : { right: PIP_MARGIN }),
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
        data-front="1"
        style={{ ...shared, opacity: showVideo ? 1 : 0 }}
      />
      {/* The double, for the span after the one playing. It is never seen
          while it loads: it is opaque only once it is the one being played. */}
      {clips.length > 0 && (
        <video
          ref={spareRef}
          muted
          playsInline
          preload="auto"
          data-testid="camera-pip-video-b"
          data-source="cut"
          data-front="0"
          style={{ ...shared, opacity: 0 }}
        />
      )}
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
