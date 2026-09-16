/**
 * The presenter's camera, as the picture-in-picture panel the recording has.
 *
 * A fixed box in the bottom-right corner - above the transport bar where
 * there is one, and never further right than a centred 1920-wide box, so a
 * very wide display does not walk it off to the side - the same 400x400 at a
 * 20px margin with a 12px radius that the OBS scene uses, so what the script
 * drags around lines up with what the camera is composited into afterwards. It shows the
 * camera footage of the cut where there is any (see below), the live webcam
 * when one is asked for and the browser gives it, and a dark plate with a
 * camera glyph otherwise - the placeholder is not a fallback, it is what the
 * take is recorded against when the real camera is on the OBS side.
 *
 * Under `?present=<cut>` the panel plays the take instead: the video
 * pipeline cuts **one continuous video for the whole
 * cut** - the footage where the panel is on screen, and black frames for the
 * middle, where the panel has been dragged off the right edge anyway - and
 * `scripts/<cut>-pip.json` says where it belongs. One file covering the whole
 * track means the element's `src` is written once, at mount, and never again:
 * every `src` write is a visible pop, because the element blanks while the new
 * file decodes. Where the manifest is missing, or the cut is being played on
 * the page's own clock under `?script=`, the plate stands in unless the live
 * webcam was asked for - see `wantsLiveWebcam` - so a rebuild that leaves the
 * pip files briefly missing does not prompt for camera access.
 *
 * The two `<video>` elements are still here because the tool's `--multi-span`
 * mode writes one file per beat and the panel still plays those: the element
 * on screen never has its `src` touched, the other sits hidden with the *next*
 * span loaded and seeked to its first frame, so the change of span is a change
 * of which one is opaque. With the single file there is only ever one entry,
 * so the second element never gets pointed at anything.
 *
 * The shipped walkthrough hands its own `<video>` in as `webcam`: playback
 * needs the user gesture that opened it, so the element is created and played
 * in the host's click handler and adopted into the panel box here.
 *
 * Mounted under `?script=` or `?present=` in dev, and by the app's own
 * walkthrough entry in production. It moves by `transform` alone, written by the script
 * runner's `pip` action, which drags it off the right edge and back; the
 * current offset lives on `data-pip-x` so a seek can put it back without
 * replaying the gesture.
 */

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Video } from 'lucide-react';
import { CURRENT_CUT } from './currentCut';
import { barLeaving, captureBox, onFrameChange, transportHeight } from './frameState';
import {
  onPipOpening, parkPip, pipOpening, PIP_OPENING_GRACE_MS, type PipOpening,
} from './handover';

/** The OBS picture-in-picture box, to the pixel. Square since round 8. */
export const PIP_WIDTH = 400;
export const PIP_HEIGHT = 400;
export const PIP_MARGIN = 20;
export const PIP_RADIUS = 12;

/**
 * The widest the panel's home corner travels out to.
 *
 * The panel belongs to the bottom right of the *picture*, and the picture is
 * 1920 wide. On a wider display the corner would otherwise keep walking out
 * with the window, away from the app and off the edge of anything an audience
 * is looking at, so past this width the corner stops where a 1920 box centred
 * in the viewport would put it.
 */
export const PIP_BOUND = 1920;

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
 *
 * While the panel is still `hidden` (see `hiddenRef` below) this threshold is
 * still what decides *whether* to correct, but not *how*: a `currentTime`
 * write is invisible on a panel nobody can see, so the frame loop always
 * seeks past it there rather than spending the ~15s a NUDGE would take to
 * close a handover-sized gap. That gap - the shipped path's audio and camera
 * starting together but the audio alone getting rewound to 0 at handover -
 * is exactly `JUMP`-sized in the worst case and would otherwise sit just
 * under it, in NUDGE territory, for the whole on-camera intro.
 */
const DRIFT = 0.04;

/**
 * And how far while it is paused, which is half a frame: a scrub has to land on
 * the exact frame, because nothing after it is going to move.
 */
const EXACT = 1 / 120;

/**
 * How the drift is taken out while the picture is playing: not by a seek, which
 * restarts the decoder and shows as a stutter, but by running the file 2 % fast
 * or slow until it has caught up. 2 % of a second is 20 ms, so the 40 ms the
 * threshold allows is gone inside two seconds, and a 2 % pitch-free speed
 * change on a silent video is nothing anyone can see.
 */
const NUDGE = 0.02;
/** And back to 1 once the gap is inside 20 ms, which gives the threshold its hysteresis. */
const SETTLE = 0.02;
/**
 * Past this the nudge would take minutes, so it is a seek even while playing: a
 * scrub that lands mid-play, or an element that has just been pointed at a file.
 */
const JUMP = 0.5;

/** Read the URL once, the way presentation mode does. */
function presentName(): string | null {
  try {
    const raw = new URLSearchParams(window.location.search).get('present');
    return raw && /^[\w-]+$/.test(raw) ? raw : null;
  } catch {
    return null;
  }
}

/**
 * Whether the live webcam fallback is wanted at all. Opt-in: without a cut's
 * camera footage or a host-adopted `<video>`, the panel used to reach for
 * `getUserMedia` on its own, which is a permission prompt every time a
 * rebuild leaves the manifest or its clips missing for a moment. `?webcam=live`
 * asks for the real camera explicitly (checking a take by eye, say); the host
 * asks the same way by handing in its own `webcam` element, which the caller
 * above this already treats as "live" without reaching this check.
 */
function wantsLiveWebcam(): boolean {
  try {
    return new URLSearchParams(window.location.search).get('webcam') === 'live';
  } catch {
    return false;
  }
}

/**
 * Told by `PresentationMode` once a clip-editor Apply's audio and lines have
 * landed on disk, so this panel knows a re-cut of the camera footage may be
 * on the way. The two are siblings under `ColorPicker.tsx`, not parent and
 * child, so `rebuilt` cannot arrive as a prop the way the manifest header
 * describes it; this small pub/sub - the same shape `handover.ts` already
 * uses between these two - is the bridge instead. `name` is checked against
 * `presentName()` by the listener, since a page can only ever be presenting
 * one cut and a stray notification for another should be ignored.
 */
const rebuiltListeners = new Set<(name: string, rebuilt: number) => void>();
export function notifyRebuilt(name: string, rebuilt: number) {
  rebuiltListeners.forEach((fn) => fn(name, rebuilt));
}
function onRebuilt(fn: (name: string, rebuilt: number) => void): () => void {
  rebuiltListeners.add(fn);
  return () => { rebuiltListeners.delete(fn); };
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

export interface WebcamPipProps {
  /**
   * The panel's front `<video>`, created and played by the host inside the
   * click that started the walkthrough. Adopted into the panel box: it keeps
   * its own `src` when it already has one, because the host may have started
   * it, and takes the manifest's first file when it does not.
   */
  webcam?: HTMLVideoElement;
}

export default function WebcamPip({ webcam }: WebcamPipProps = {}) {
  // A is the one the webcam uses, and the one a span is shown on first; B is
  // its double, hidden, holding the span that comes next.
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const boxRef = useRef<HTMLDivElement | null>(null);
  const spareRef = useRef<HTMLVideoElement | null>(null);
  const [live, setLive] = useState(false);
  const [clips, setClips] = useState<PipClip[]>([]);
  /** Whether the footage has a frame to show. Until it has, the plate does. */
  const [decoded, setDecoded] = useState(false);
  /**
   * The panel's home `left`: 20px in from the right edge of a box that is the
   * viewport capped at `PIP_BOUND` and centred in it. Up to 1920 that is
   * simply 20px off the display's right edge; past it the corner holds still
   * at the edge of the centred 1920 box. `null` only until the effect below
   * has measured for the first time, when the fixed 20px margin stands in.
   */
  const [homeLeft, setHomeLeft] = useState<number | null>(null);

  /**
   * How far the panel sits above the foot of the screen: 20px above the
   * transport bar where there is one, and 20px above the foot of the window
   * where there is not (the `?script=` recording path has no bar). Under a
   * frame layer it is 20px above the foot of the *capture box* instead, so
   * the panel keeps its corner of the picture rather than sitting in a
   * letterbox band nothing is capturing; that rule wins, and the bar's height
   * is still added on top of it, because the bar is a fixed, portalled
   * element outside the frame layer's transform and always sits at the real
   * foot of the screen.
   */
  const [homeBottom, setHomeBottom] = useState<number>(PIP_MARGIN);

  /**
   * Where the cut this panel belongs to opens it, and the wait for an answer.
   *
   * A cut whose first `pip` cue drags the panel on opens with it off screen,
   * and the script runner is the one that knows so - but the runner is a lazy
   * chunk and a fetch away, and this panel is a lazy chunk of its own. On the
   * shipped path the panel won the race: it painted in the corner, at home,
   * and sat there for a moment before the hand reached off the right edge for
   * it. So it does not paint at all until a runner has said how the cut opens
   * - `visibility`, not unmounting, so the footage decodes meanwhile and the
   * first frame is ready when the panel is shown - and it is put where the
   * answer says before that first paint, in a layout effect.
   *
   * `waited` is the way out for a page with no runner in it, or one whose cut
   * never loaded: after the grace the panel simply shows itself at home.
   */
  const [opening, setOpening] = useState<PipOpening | null>(pipOpening);
  const [waited, setWaited] = useState(false);
  useEffect(() => onPipOpening(setOpening), []);
  useEffect(() => {
    if (opening) return;
    const t = window.setTimeout(() => setWaited(true), PIP_OPENING_GRACE_MS);
    return () => window.clearTimeout(t);
  }, [opening]);
  /*
   * Once, as the answer arrives: a park is the opening state, not a standing
   * rule. Re-running it when the panel's home moves - a resize, a frame layer
   * coming up - would snap a panel the cut had since dragged somewhere. The
   * offset it writes is measured against whatever home is current, and the
   * `pip` cue re-measures its own before it drags, so a home that moves after
   * this leaves the panel further off screen rather than wrong.
   */
  useLayoutEffect(() => { if (opening) parkPip(opening === 'off'); }, [opening]);
  const hidden = !opening && !waited;
  /**
   * Mirrored into a ref because the frame loop below (the effect on `[clips]`)
   * closes over `clips` only and does not re-run when visibility changes - it
   * reads this every frame instead. See the DRIFT comment for why the loop
   * cares: while `hiddenRef.current` is true a drift past DRIFT is always a
   * seek, because the correction is happening on a panel nobody can see.
   */
  const hiddenRef = useRef(hidden);
  useEffect(() => { hiddenRef.current = hidden; }, [hidden]);
  /**
   * Set when the adoption effect below hands the loop an element that may
   * already be mid-handover, and cleared the first time the loop evaluates it
   * on a playing frame. The voice rewind at handover happens before the
   * runner's reveal cue flips `hidden` to false (the reveal *is* that cue, via
   * `setPipOpening`), so `hiddenRef` alone covers the ordinary case; this is
   * the fallback for the case that guarantee doesn't cover - the adopted
   * element's first frame with a decoded position (`readyState >= 1`) landing
   * after `hidden` has already gone false - so that frame is still forced to
   * a seek instead of the slow nudge.
   */
  const adoptedPendingRef = useRef(false);

  /** The walkthrough is on its way out; see `barLeaving` in frameState. */
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    const compute = () => {
      setLeaving(barLeaving());
      /*
       * With a frame layer up the panel belongs to the capture, not to the
       * window: the frame is what the viewer will see, so its own
       * bottom-right corner is the one the panel takes - which is where the
       * OBS layout puts it too. The 1920 bound below is the same idea for a
       * window with no frame layer over it.
       */
      const bar = transportHeight();
      const box = captureBox();
      if (box) {
        setHomeLeft(box.left + box.width - PIP_WIDTH - PIP_MARGIN);
        setHomeBottom(Math.max(0, window.innerHeight - (box.top + box.height)) + bar + PIP_MARGIN);
        return;
      }
      setHomeBottom(bar + PIP_MARGIN);
      const inset = Math.max(0, (window.innerWidth - PIP_BOUND) / 2) + PIP_MARGIN;
      setHomeLeft(window.innerWidth - inset - PIP_WIDTH);
    };
    compute();
    window.addEventListener('resize', compute);
    const off = onFrameChange(compute);
    return () => {
      window.removeEventListener('resize', compute);
      off();
    };
  }, []);

  /**
   * The cache-buster on the manifest and on the video file it names: empty at
   * mount, `?v=<rebuilt>` once a rebuild has landed (see the effect below),
   * so neither is ever served from an earlier apply's HTTP cache. Read by the
   * clip-playback effect further down at the moment it (re)fetches - it is
   * not itself a dependency of anything, because `fetchManifest` below always
   * hands back a fresh `clips` array, and a fresh array is what actually
   * drives that effect to run again.
   */
  const bustRef = useRef('');

  /**
   * Fetch and parse `<name>-pip.json`, the one path both the mount effect and
   * a post-rebuild reload use - see the two effects below - so the manifest's
   * shape (`spans` now, `lines` for the tool's older --per-line mode) is
   * handled in exactly one place.
   */
  const fetchManifest = useCallback((name: string, bust: string): Promise<PipClip[] | null> => {
    bustRef.current = bust;
    return fetch(`${import.meta.env.BASE_URL}scripts/${name}-pip.json${bust}`)
      .then((res) => (res.ok ? (res.json() as Promise<{ spans?: PipClip[]; lines?: PipClip[] }>) : null))
      .then((data) => {
        const entries = data?.spans ?? data?.lines;
        return Array.isArray(entries) && entries.length
          ? [...entries].sort((a, b) => a.cutStart - b.cutStart)
          : null;
      })
      // No manifest: the cut has no camera clips yet, and the webcam stands in.
      .catch(() => null);
  }, []);

  /* The cut's camera footage, when this presentation has any. */
  useEffect(() => {
    // The app's own walkthrough has no `?present=` in the URL to read; the host
    // handing an element in is what says the shipping cut is the one playing.
    const name = presentName() ?? (webcam ? CURRENT_CUT : null);
    if (!name) return;
    let alive = true;
    fetchManifest(name, '').then((sorted) => { if (alive && sorted) setClips(sorted); });
    return () => { alive = false; };
  }, [webcam, fetchManifest]);

  /**
   * After a clip-editor Apply lands (dev only - `presentName()` is null on
   * the shipped path, so this never fires there): the re-cut runs on the
   * server in the background, so poll `GET /__clip/<name>/status` about once
   * a second until it says `synced` or `error`, 90s pass, another rebuild
   * notification arrives, or the panel unmounts. `idle` means there is no
   * re-cut coming at all (no `<name>-pip-options.json` measured for this
   * cut) - nothing to wait for, so the reload happens right away. `error`
   * still reloads: the file on disk did not change, but re-fetching costs
   * nothing and it is the best there is, and the log is worth a look.
   */
  useEffect(() => {
    const name = presentName();
    if (!name) return;
    let cancelCurrent: (() => void) | null = null;
    const off = onRebuilt((n, rebuilt) => {
      if (n !== name) return;
      cancelCurrent?.();
      let alive = true;
      let timer = 0;
      const deadline = Date.now() + 90_000;
      const reload = () => {
        fetchManifest(name, `?v=${rebuilt}`).then((sorted) => { if (alive && sorted) setClips(sorted); });
      };
      const poll = () => {
        fetch(`/__clip/${name}/status`)
          .then((res) => (res.ok ? (res.json() as Promise<{ state?: string; log?: string }>) : null))
          .then((data) => {
            if (!alive) return;
            const state = data?.state ?? 'idle';
            if (state === 'error') console.warn('[camera pip] re-cut failed; showing the current file', data?.log);
            if (state === 'synced' || state === 'error' || state === 'idle' || Date.now() >= deadline) {
              reload();
              return;
            }
            timer = window.setTimeout(poll, 1000);
          })
          .catch(() => {
            if (!alive) return;
            if (Date.now() >= deadline) { reload(); return; }
            timer = window.setTimeout(poll, 1000);
          });
      };
      poll();
      cancelCurrent = () => { alive = false; window.clearTimeout(timer); };
    });
    return () => { off(); cancelCurrent?.(); };
  }, [fetchManifest]);

  /**
   * Adopting the host's `<video>`: it is appended into the panel box and used
   * as the front slot, so the raf loop below drives it exactly as it drives the
   * element this component renders otherwise. Muted and inline are re-asserted
   * because an unmuted element is not allowed to play itself, and a `src` it
   * already carries is left alone - the host may have started it inside the
   * click, and a rewrite would drop that.
   */
  /* eslint-disable react-hooks/immutability -- the element is the host's, and
     adopting it is exactly writing to it: the rule reads a DOM node arriving as
     a prop as component state. */
  useEffect(() => {
    const box = boxRef.current;
    const el: HTMLVideoElement | undefined = webcam;
    if (!el || !box) return;
    el.muted = true;
    el.playsInline = true;
    el.preload = 'auto';
    el.setAttribute('data-testid', 'camera-pip-video');
    el.setAttribute('data-source', 'cut');
    el.dataset.front = '1';
    Object.assign(el.style, {
      position: 'absolute', inset: '0', width: '100%', height: '100%',
      objectFit: 'cover', display: 'block', transform: 'none',
    });
    if (el.parentElement !== box) box.appendChild(el);
    videoRef.current = el;
    // This element may already be mid-handover (see `adoptedPendingRef`
    // above): force its first playing frame in the loop below to a seek
    // regardless of `hidden`.
    adoptedPendingRef.current = true;
    return () => {
      if (el.parentElement === box) box.removeChild(el);
      if (videoRef.current === el) videoRef.current = null;
    };
  }, [webcam]);
  /* eslint-enable react-hooks/immutability */

  /* The webcam, unless the cut's own footage is playing instead. */
  useEffect(() => {
    // An adopted element is the walkthrough's own picture; asking for the
    // camera there would be a permission prompt in the middle of a talk. With
    // no manifest and no adopted element the live camera is opt-in - see
    // `wantsLiveWebcam` - so a rebuild with the pip files briefly missing
    // shows the plate instead of prompting for camera access.
    if (clips.length || webcam || !wantsLiveWebcam()) return;
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
  }, [clips.length, webcam]);

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
    // Carries the manifest's own cache-buster (see `bustRef` above) onto the
    // video files it names, so a reload after a rebuild pulls the re-cut
    // bytes rather than the HTTP cache's copy of the old `full.mp4`. Read
    // once, here: this effect reruns in full whenever `clips` gets a new
    // array, which a reload always hands it, so a later change is a later run.
    const bust = bustRef.current;
    /*
     * The file is fetched at mount and attached at play.
     *
     * Those used to be the same moment: the element was pointed at `full.mp4`
     * on the first frame, which starts a three-megabyte download the instant
     * presentation mode is up and leaves the panel decoding while nobody has
     * asked for anything. Now the bytes are pulled at mount - so they are on
     * the machine before the transport is touched - and nothing is written to
     * the element until the clock is actually running. The blob is what the
     * `src` becomes, so the attach costs no network at all; if the fetch fails
     * the plain URL stands in and the element downloads it the old way.
     *
     * The About panel's path is untouched: the host creates its own element
     * inside the click that started the walkthrough and hands it in already
     * pointed at the file, and `attach` leaves an element that has a `src`
     * alone. `begun` is true for it from the first frame for the same reason.
     */
    const fetched = new Map<string, string>();
    let begun = false;
    let alive = true;
    for (const file of new Set(clips.map((c) => c.file))) {
      fetch(base + file + bust)
        .then((res) => (res.ok ? res.blob() : null))
        .then((blob) => { if (alive && blob) fetched.set(file, URL.createObjectURL(blob)); })
        .catch(() => { /* the element will fetch it itself when it is attached */ });
    }
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
      // Nothing is written to an element before the clock has run: the fetch
      // above is what happens at mount, and this is what happens at play.
      if (!begun && !s.el.src) return;
      s.entry = entry;
      s.parked = false;
      const url = fetched.get(entry.file) ?? base + entry.file + bust;
      // An adopted element arrives already pointed at the file, and often
      // already playing: writing the same `src` again would blank it and start
      // the download over.
      if (s.el.src && new URL(s.el.src, window.location.href).href === new URL(url, window.location.href).href) return;
      s.el.src = url;
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
      // The first play press, whichever transport made it. An element handed in
      // by the host is already playing, so it counts as begun from the start.
      if (!begun && (!audio.paused || !!slots[0].el?.src)) begun = true;
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
      // Playing, the gap is taken out by running the file a couple of per cent
      // off speed until it closes - a seek mid-play restarts the decoder, which
      // is the stutter this is here to avoid - and only a gap too wide to nudge
      // out is still a seek. Paused or scrubbed, exactly, and at speed 1: the
      // frame on screen is the whole picture and nothing after it is moving.
      //
      // Before the panel is shown - `hiddenRef.current`, or an adopted element
      // on its first playing frame, `adoptedPendingRef` - a stutter cannot be
      // seen, so any drift past DRIFT is spent as a seek too rather than the
      // ~15s a NUDGE would take. This must run only once the voice's own
      // handover rewind has already happened: it has, by construction, because
      // that rewind is what the runner does *before* it reveals the panel (the
      // reveal is the `setPipOpening` cue that flips `hidden` to false), so
      // every frame this branch sees while still hidden is already past it.
      if (v.readyState >= 1) {
        const off = v.currentTime - at;
        const firstAdoptedFrame = playing && adoptedPendingRef.current;
        if (firstAdoptedFrame) adoptedPendingRef.current = false;
        const forceSeek = hiddenRef.current || firstAdoptedFrame;
        if (playing) {
          if (Math.abs(off) > JUMP || (forceSeek && Math.abs(off) > DRIFT)) {
            v.currentTime = at; v.playbackRate = 1;
          } else if (Math.abs(off) > DRIFT) v.playbackRate = off > 0 ? 1 - NUDGE : 1 + NUDGE;
          else if (Math.abs(off) <= SETTLE && v.playbackRate !== 1) v.playbackRate = 1;
        } else {
          if (v.playbackRate !== 1) v.playbackRate = 1;
          if (Math.abs(off) > EXACT) v.currentTime = at;
        }
      }
      if (playing && v.paused) v.play().catch(() => { /* seeking, or not decodable yet */ });
      else if (!playing && !v.paused) v.pause();
      if (v.readyState >= 2) { ready = true; setDecoded(true); }
      show();
    };
    raf = requestAnimationFrame(frame);
    return () => {
      alive = false;
      cancelAnimationFrame(raf);
      fetched.forEach((url) => URL.revokeObjectURL(url));
    };
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
      ref={boxRef}
      id="camera-pip"
      data-testid="camera-pip"
      data-pip-x="0"
      aria-hidden="true"
      className="pointer-events-none fixed overflow-hidden"
      style={{
        ...(homeLeft != null ? { left: homeLeft } : { right: PIP_MARGIN }),
        bottom: homeBottom,
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
        visibility: hidden ? 'hidden' : undefined,
        // Out with the bar, on the bar's own curve. Mid-cut the cut has
        // usually already dragged the panel off the right edge, so this only
        // shows on an early exit - but on that exit the panel would otherwise
        // blink out of a corner the viewer is still looking at. Opacity only:
        // what hides the panel before it is due is `visibility`, so the two
        // never fight.
        opacity: leaving ? 0 : undefined,
        transition: 'opacity 300ms cubic-bezier(0.2, 0, 0, 1)',
      }}
    >
      {/* The host's element stands in for this one when there is one: it is
          appended into this box by the effect above. */}
      {!webcam && (
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
      )}
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
