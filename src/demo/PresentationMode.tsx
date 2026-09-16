/**
 * Presentation mode: the video script played against its voice track.
 *
 * `?present=<name>` (dev only) mounts the ScriptRunner under a clock read off
 * an `<audio>` of `public/scripts/<name>.m4a`, with a transport at the foot
 * of the page: play/pause, a scrubbable timeline with a tick per action and
 * a span per script line (`<name>-lines.json`), the current line and action
 * above it, and timed notes underneath. Notes go through the dev server's
 * `/__notes/<name>` middleware (vite.config.js) to a JSON file beside the
 * cut's other cue files.
 *
 * Double-clicking a line's span on the timeline opens the clip editor
 * (ClipEditor.tsx): the waveform of that line's own clip, its in and out
 * points, and the gap before it. Applying there rebuilds the cut on disk and
 * this component re-fetches it in place.
 *
 * Four props turn the same component into the shipped walkthrough. `mode`
 * `'production'` mounts none of the authoring pieces - no notes, no clip
 * editor, no `/__notes` (or any other `/__`) request, no collapse chrome -
 * regardless of `transport`. `transport` is the separate, orthogonal knob for
 * how much of the transport itself shows: `'full'` is the timeline with line
 * spans and cue ticks, the beat band on the plan clock, the line/action
 * readout, and arrow-key seeking; `'reduced'` is play/pause, a bare scrub bar
 * and the time readout, nothing else. It defaults to `'full'` when `mode` is
 * `'dev'` and `'reduced'` when `mode` is `'production'`, so the shipped
 * walkthrough is reduced unless told otherwise. `voice` hands in an `<audio>`
 * the host created and started inside its own click handler, which this
 * component adopts as its clock rather than rendering one of its own.
 * Playback needs that user gesture, and the host is the only place a `play()`
 * can be synchronous with it. `onLeave` is the fourth, and the way out: with
 * one, the reduced transport shows a red X at the right of the bar and
 * **Escape** calls the same thing - and so does the end of the voice track,
 * a second and a half after the last sound. What leaving means belongs to the
 * host, which created the media and mounts this. Which builds mount the
 * component at all is the host's business: there is no dev guard in here.
 *
 * The shipped bar arrives and goes on a slide: it mounts below the viewport
 * and is let up over 300 ms, and every way out plays the same move in reverse
 * before `onLeave` is called, so the host unmounts into an empty screen. Its
 * colours, that slide, and the fade at its top are `--bar-*` tokens on the
 * `.present-bar` class in presentation-bar.css, keyed off the app's own
 * light/dark class. The dev transport has none of this: it mounts and
 * unmounts on a frame, in the tool's own fixed colours, and it stays put at
 * the end of the track.
 *
 * The shipped walkthrough also takes the app's input away for as long as it
 * is up. An audience is being shown the tool, not handed it, and a viewer's
 * press on a slider fights the cut for the same colour - so every real press,
 * every wheel and every key that is not the transport's is swallowed, and the
 * one decision left to the viewer is whether to stay: a press anywhere but
 * the bar offers "Leave the presentation?" rather than doing anything. The
 * line is `isTrusted` rather than a layer that eats the events, so the cut's
 * own hands - which work the app through events the runner dispatches - are
 * untouched; see the comment on `shielded` below for why a layer could not
 * draw it. None of this applies to the `?present=` tool, which is somebody
 * working on the cut and needs the app.
 *
 * This is a tool, not a surface of the app: the styling is deliberately not
 * the app's, except on the shipped transport's clock, which an audience
 * reads. See docs/demo-script.md, "Presentation mode".
 *
 * A caption above the bar is part of the same component on both transports,
 * off by default and remembered per viewer (`localStorage`, wrapped in
 * try/catch). The dev transport reaches it behind a toggle in the authoring
 * row; the shipped (reduced) transport has no control for it at the moment -
 * the state and the caption layers are there, the checkbox comes back in the
 * captions pass. When `public/scripts/<name>
 * -words.json` word timings are present, the caption groups them into small
 * HyperFrames-style read-along chunks (`captions.ts`), each word filling in
 * as the playhead passes its start; otherwise it falls back to the current
 * line's whole text (`captionAt` below). With `frames=` in the URL (see
 * Frames.tsx) the whole bar, labels and caption included, starts hidden - a
 * capture shows only the app, the ghost and the webcam panel - and **T**
 * brings it back for editing.
 */

import {
  Fragment, useCallback, useEffect, useMemo, useRef, useState,
  type CSSProperties, type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
} from 'react';
import { createPortal } from 'react-dom';
import ScriptRunner, {
  scriptAudioUrl,
  sortActions,
  type Script,
  type ScriptAction,
  type ScriptClock,
  type ScriptRunnerHandle,
} from './ScriptRunner';
import type { DemoHost } from './steps';
import ClipEditor from './ClipEditor';
import { captureFlag, FrameControls, RATIO_COLOR, RATIOS, useFrames } from './Frames';
import { setBarLeaving, setTransportHeight } from './frameState';
import {
  LABEL_ANGLE_DEG, labelRowHeight, layoutSectionLabels, loadSections, resolveSectionMarks,
  type Section,
} from './sections';
import { buildCaptionChunks, chunkAt, type CaptionChunk, type CaptionWord } from './captions';
import { Button } from '@/components/ui/button';
import './presentation-bar.css';

/** One spoken line of the cut, with where it sits in the voice track. */
interface ScriptLine {
  beat: number;
  title?: string;
  line: number;
  text: string;
  start: number;
  end: number;
}

/** A note pinned to a moment of the cut. */
interface Note {
  t: number;
  beat: number | null;
  line: number | null;
  text: string;
  created: string;
}

interface NotesFile {
  source: string;
  notes: Note[];
}

export interface PresentationModeProps {
  name: string;
  host: DemoHost;
  onDemo: (from?: { x: number; y: number } | null) => void;
  onColor: (hsb: { h: number; s: number; b: number }) => void;
  demoOpen: boolean;
  /**
   * The voice track, created and played by the host inside the click handler
   * that started the walkthrough. Adopted as this transport's clock: its `src`
   * is left alone when it already points at the cut's voice, and it is taken
   * over whether it is already playing or still paused. Without it the
   * component renders its own `<audio>`, as it always has.
   */
  voice?: HTMLAudioElement;
  /**
   * `'production'` mounts none of the authoring tool - no notes, no clip
   * editor, no N or C keys, no collapse chrome, no `/__notes` (or any other
   * `/__`) request - regardless of `transport`. `'dev'`, the default, mounts
   * all of it.
   */
  mode?: 'dev' | 'production';
  /**
   * How much of the transport shows, independent of `mode`. `'full'` is the
   * timeline with line spans and cue ticks, scrub, the time readout, the beat
   * band on the plan clock, the line/action readout, and the keyboard
   * transport (Space play/pause, arrow seeks). `'reduced'` is play/pause, a
   * bare scrub bar and the time readout - nothing else - with Space still
   * working. Defaults to `'full'` when `mode` is `'dev'` and `'reduced'` when
   * `mode` is `'production'`.
   */
  transport?: 'full' | 'reduced';
  /**
   * The way out of the walkthrough, for a viewer who has seen enough. Given
   * one, the shipped (reduced) transport grows a red X at the right of the
   * bar and **Escape** calls the same thing; without one there is no way out
   * but a reload, which is what every entry had until now. The host owns what
   * leaving means - stopping the media it started, unmounting this - because
   * the host is what created them.
   */
  onLeave?: () => void;
}

/** How far an arrow key moves the playhead when the full transport is up. */
const SEEK_STEP = 5;

/**
 * How far past a keyframe's arrival time a keyframe jump lands, in seconds.
 *
 * A keyframe's `t` is when its move *arrives*, and the move itself runs in the
 * `ms` before it, so the clock at exactly `t` is the last instant of the move
 * in. Landing a hair later puts the frame that arrives at `t` in force and
 * still, which is the state the jump is there to let somebody look at.
 */
const KEYFRAME_LANDING = 0.05;

/**
 * The slack around the playhead when the arrows walk the frame layer's
 * keyframes, in seconds.
 *
 * A jump lands a little past the keyframe it picked, so "the previous
 * keyframe" has to mean something strictly earlier than the one the playhead
 * is sitting just after rather than that same one over again. Anything wider
 * than the landing offset does that, and a tenth of a second is far narrower
 * than the gap between two marks of a real cut, so it never steps over one.
 */
const KEYFRAME_EPSILON = 0.1;

/** The caption crossfade's duration, each way. Short: a caption is a
 *  subtitle, not a title card. */
const CAPTION_FADE_MS = 200;
/** How long the shipped bar takes to arrive, and to go. Matches the
 *  `.present-bar` transition in presentation-bar.css, which is what actually
 *  moves it; this is only how long to wait before handing over. */
const SLIDE_MS = 300;
/** The gap between the last sound of the cut and the bar starting down: long
 *  enough for the final frame and the camera panel's drag-out to settle. */
const END_HOLD_MS = 1500;

/** How long a gap between two lines still carries the first one's caption.
 *  Past this the caption blanks rather than sit there through a long pause. */
const CAPTION_GAP_S = 1.5;

/** Transport icons, sized to the row and matching the button text's color via
 *  `currentColor`. Kept as plain inline SVG rather than a dependency. */
const PlayIcon = () => (
  <svg width="12" height="12" viewBox="0 0 16 16" aria-hidden="true" focusable="false">
    <path d="M3 1.5 L14 8 L3 14.5 Z" fill="currentColor" />
  </svg>
);
const PauseIcon = () => (
  <svg width="12" height="12" viewBox="0 0 16 16" aria-hidden="true" focusable="false">
    <rect x="3" y="1.5" width="3.5" height="13" fill="currentColor" />
    <rect x="9.5" y="1.5" width="3.5" height="13" fill="currentColor" />
  </svg>
);
/** A chevron with a bar at its point: the beat transport's "skip to the edge
 *  of the adjacent beat" gesture, distinct from a plain play/seek chevron. */
const PrevBeatIcon = () => (
  <svg width="12" height="12" viewBox="0 0 16 16" aria-hidden="true" focusable="false">
    <rect x="2" y="1.5" width="2" height="13" fill="currentColor" />
    <path d="M14 1.5 L14 14.5 L5 8 Z" fill="currentColor" />
  </svg>
);
const NextBeatIcon = () => (
  <svg width="12" height="12" viewBox="0 0 16 16" aria-hidden="true" focusable="false">
    <rect x="12" y="1.5" width="2" height="13" fill="currentColor" />
    <path d="M2 1.5 L2 14.5 L11 8 Z" fill="currentColor" />
  </svg>
);
/** The way out. A stroked X rather than a filled glyph: it is the one button
 *  on the bar that ends something, and it reads as a close, not as transport. */
const LeaveIcon = () => (
  <svg width="12" height="12" viewBox="0 0 16 16" aria-hidden="true" focusable="false">
    <path
      d="M3.5 3.5 L12.5 12.5 M12.5 3.5 L3.5 12.5"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      fill="none"
    />
  </svg>
);

/** Read the URL once: the presentation name. */
export function presentName(): string | null {
  try {
    const raw = new URLSearchParams(window.location.search).get('present');
    return raw && /^[\w-]+$/.test(raw) ? raw : null;
  } catch {
    return null;
  }
}

/**
 * `&clock=plan` runs the cut on its planned times instead of on a voice track:
 * `public/scripts/<name>-plan.json` (the video pipeline's prompter tooling)
 * carries every line's planned start and end and the beats they sit in, and the
 * transport runs a `performance.now()` clock over them. There is no audio, so a
 * cut can be watched, choreographed and captured before a word of it is
 * recorded; the sync flash at t=0 is what an OBS capture is lined up on.
 */
export function presentClock(): 'audio' | 'plan' {
  try {
    return new URLSearchParams(window.location.search).get('clock') === 'plan' ? 'plan' : 'audio';
  } catch {
    return 'audio';
  }
}

/**
 * `&flash=1` paints the one-frame white sync flash at the start of a run on the
 * voice clock too, not only under `&clock=plan`: a screen grab of
 * `?present=<cut>` then has a white frame to trim to, so the recording lines up
 * on the cut's t=0 rather than by eye against the first word. Opt-in, so the
 * shipped path - the About panel's Presentation button - never paints it.
 */
export function presentFlash(): boolean {
  try {
    return new URLSearchParams(window.location.search).get('flash') === '1';
  } catch {
    return false;
  }
}

/** A beat of the plan, drawn as a band along the top of the timeline. */
interface PlanBeat {
  n: number;
  title: string;
  start: number;
  end: number;
  estimate: number | null;
}

/** What `<name>-plan.json` holds. Lines carry `id` ("3.4") rather than beat/line. */
interface PlanFile {
  lines?: { id: string | null; beat: number; line: number | null; text: string; start: number; end: number }[];
  beats?: PlanBeat[];
  total?: number;
}

const notesUrl = (name: string) => `/__notes/${name}`;

const mmss = (t: number) => {
  const s = Math.max(0, Math.floor(t));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};
const mmssTenths = (t: number) => `${mmss(t)}.${Math.floor((Math.max(0, t) % 1) * 10)}`;

/** Whether a key press belongs to a text field rather than to the transport. */
const inTextField = (target: EventTarget | null) => {
  const el = target as HTMLElement | null;
  if (!el) return false;
  return el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable;
};

/**
 * The walkthrough's own surfaces: the transport bar and the leave offer.
 *
 * These are the only two places a real press or a real key is allowed to land
 * while the shield is up, which is the whole of Taylor's rule - the viewer
 * decides whether to stay, and decides nothing else.
 */
const CHROME_SELECTOR = '[data-present-chrome]';
const fromChrome = (target: EventTarget | null) =>
  target instanceof Element && target.closest(CHROME_SELECTOR) !== null;

/** What Tab is allowed to walk around inside the chrome. */
const FOCUSABLE_SELECTOR = 'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]),'
  + ' textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/** How far a press may travel and still count as a click rather than a drag. */
const OFFER_SLOP_PX = 6;

/** The keys the transport answers, which the shield therefore lets past. */
const isTransportKey = (e: KeyboardEvent) =>
  e.code === 'Space' || e.key === ' ' || e.key === 'Escape'
  || e.key === 'ArrowLeft' || e.key === 'ArrowRight';

/** The line being spoken at `t`: the last one begun, preferring one still going. */
function lineAt(lines: ScriptLine[], t: number): ScriptLine | null {
  let last: ScriptLine | null = null;
  for (const l of lines) {
    if (l.start > t) break;
    if (l.end > t) return l;
    last = l;
  }
  return last;
}

/**
 * The caption text at `t`: the line whose span contains the playhead while
 * one does, otherwise the line just finished - but only through a gap of
 * `CAPTION_GAP_S` or less before the next one starts. A longer gap blanks the
 * caption rather than leave it sitting there through a pause it wasn't
 * spoken across.
 */
function captionAt(lines: ScriptLine[], t: number): string | null {
  let lastIdx = -1;
  for (let i = 0; i < lines.length; i += 1) {
    const l = lines[i];
    if (l.start > t) break;
    if (l.end > t) return l.text;
    lastIdx = i;
  }
  if (lastIdx < 0) return null;
  const last = lines[lastIdx];
  const next = lines[lastIdx + 1];
  const gap = next ? next.start - last.end : Infinity;
  return gap <= CAPTION_GAP_S ? last.text : null;
}

const describe = (a: ScriptAction) => {
  const target = a.target ?? (a.targets ? a.targets.join(' > ') : '');
  const extra = a.do === 'color' ? ` ${a.h ?? 0}/${a.s ?? 0}/${a.b ?? 0}` : a.do === 'tip' ? ` ${a.degrees ?? 0}deg` : '';
  return `${a.do}${target ? ' ' + target : ''}${extra}`;
};

const notesMarkdown = (notes: Note[]) =>
  notes
    .map((n) => `- [${mmss(n.t)}] ${n.beat ?? '?'}.${n.line ?? '?'} — ${n.text}`)
    .join('\n');

/** Whether a media element is already pointed at `url`, resolved the same way. */
function pointedAt(el: HTMLMediaElement, url: string): boolean {
  if (!el.getAttribute('src') && !el.src) return false;
  try {
    return new URL(el.src, window.location.href).href === new URL(url, window.location.href).href;
  } catch {
    return false;
  }
}

export default function PresentationMode({
  name, host, onDemo, onColor, demoOpen, voice, mode = 'dev', transport, onLeave,
}: PresentationModeProps) {
  /** The authoring tool's half: notes, the clip editor, and the keys for them. */
  const authoring = mode === 'dev';
  /** The rich transport's half: line spans, cue ticks, the beat band, the
   *  line/action readout and arrow-key seeking. Independent of `authoring`. */
  const fullTransport = (transport ?? (mode === 'dev' ? 'full' : 'reduced')) === 'full';
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const voiceHostRef = useRef<HTMLSpanElement | null>(null);
  const transportRef = useRef<HTMLDivElement | null>(null);
  const timelineRef = useRef<HTMLDivElement | null>(null);
  const handleRef = useRef<ScriptRunnerHandle | null>(null);
  const noteInputRef = useRef<HTMLInputElement | null>(null);
  const notesListRef = useRef<HTMLUListElement | null>(null);
  const noteRowRefs = useRef<Map<number, HTMLLIElement>>(new Map());
  // Set on wheel/scroll inside the notes list, so the auto-scroll below backs
  // off for 3s while the user is scrolling it themselves.
  const lastNotesListInteraction = useRef(0);
  const onNotesListInteraction = () => { lastNotesListInteraction.current = Date.now(); };
  // The auto-scroll only fires when the highlighted set actually changes, not
  // on every frame the clock advances.
  const lastHighlightKey = useRef('');
  const [script, setScript] = useState<Script | null>(null);
  const [lines, setLines] = useState<ScriptLine[]>([]);
  const [beats, setBeats] = useState<PlanBeat[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [timelineWidth, setTimelineWidth] = useState(0);
  /**
   * The plan clock: `base` is where the transport was left and `since` is when
   * it was last started, so the time is the sum and a pause is a subtraction.
   * Unused while the voice track is the clock.
   */
  const planMode = useMemo(() => presentClock() === 'plan', []);
  const run = useRef<{ base: number; since: number | null }>({ base: 0, since: null });
  const planTime = useCallback(
    () => run.current.base + (run.current.since !== null ? (performance.now() - run.current.since) / 1000 : 0),
    [],
  );
  /** Fired once, at the first start, so a capture has its mark. */
  const flashed = useRef(false);
  /** Whether that mark is painted at all: always in plan mode, and on the
   *  voice clock when `&flash=1` asks for it. */
  const syncFlash = useMemo(() => planMode || presentFlash(), [planMode]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [notesError, setNotesError] = useState<string | null>(null);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [noting, setNoting] = useState(false);
  const [copied, setCopied] = useState(false);
  // The clip editor: the line id being edited, opened by double-clicking a span.
  const [editing, setEditing] = useState<string | null>(null);
  // Bumped after an Apply. It re-fetches the cut and re-loads the audio in
  // place, so a round of trimming does not lose the playhead or the page's
  // state; the ref is where the playhead goes once the new audio has loaded.
  const [rebuilt, setRebuilt] = useState(0);
  const resumeAt = useRef<number | null>(null);
  // Collapsed keeps only the transport row on screen, so the app underneath
  // is not hidden by the panel while reviewing. Remembered per browser.
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    try { return localStorage.getItem('present:collapsed') === '1'; } catch { return false; }
  });
  useEffect(() => {
    try { localStorage.setItem('present:collapsed', collapsed ? '1' : '0'); } catch { /* private mode */ }
  }, [collapsed]);
  /** Collapsing is an authoring convenience; the shipped transport is one row. */
  const shrunk = authoring && collapsed;

  /**
   * Captions: off by default everywhere, remembered per viewer. Both
   * transports drive this same state - the dev transport's toggle in the
   * authoring row below, the shipped (reduced) transport's checkbox on the
   * transport row near the clock.
   */
  const [captionsOn, setCaptionsOn] = useState<boolean>(() => {
    try { return localStorage.getItem('present:captions') === '1'; } catch { return false; }
  });
  useEffect(() => {
    try { localStorage.setItem('present:captions', captionsOn ? '1' : '0'); } catch { /* private mode */ }
  }, [captionsOn]);
  /** The crossfade: at most two layers on screen, the outgoing one fading out
   *  while the incoming one fades in. Recomputed off `time` the same way the
   *  line readout above is - only the DOM update is gated behind a ref check,
   *  so a steady caption doesn't re-render every frame. */
  const captionTextRef = useRef<string | null>(null);
  const captionIdRef = useRef(0);
  const [captionLayers, setCaptionLayers] = useState<{ id: number; text: string; out: boolean }[]>([]);
  const captionFadeTimer = useRef<number | null>(null);

  /**
   * Word-level captions: `public/scripts/<name>-words.json`, when present,
   * grouped into small read-along chunks once the line spans it's grouped
   * against (`lines`, below) have loaded. `null` means "not available" - the
   * caption falls back to the current line's whole text below - which also
   * covers the fetch still being in flight, so a stray render doesn't flash
   * the fallback caption on top of a cut that does have word timings.
   */
  const [wordChunks, setWordChunks] = useState<CaptionChunk[] | null>(null);
  useEffect(() => {
    let live = true;
    if (!name || !lines.length) { setWordChunks(null); return; }
    fetch(`/scripts/${name}-words.json`)
      .then((res) => (res.ok ? (res.json() as Promise<CaptionWord[]>) : null))
      .then((words) => {
        if (!live) return;
        setWordChunks(words && words.length ? buildCaptionChunks(words, lines) : null);
      })
      .catch(() => { if (live) setWordChunks(null); });
    return () => { live = false; };
  }, [name, lines]);
  /** The word-chunk crossfade: same shape as the line-text one above, keyed
   *  by chunk id instead of text. */
  const wordChunkIdRef = useRef<string | null>(null);
  const wordChunkLayerIdRef = useRef(0);
  const [wordChunkLayers, setWordChunkLayers] = useState<{ id: number; chunk: CaptionChunk; out: boolean }[]>([]);
  const wordChunkFadeTimer = useRef<number | null>(null);

  /**
   * Adopting the host's `<audio>`.
   *
   * It is the same element the host called `play()` on inside the click that
   * started the walkthrough, so writing its `src` again would drop that
   * playback and re-download the track: it is only written when the element is
   * pointed somewhere else. The element is put in the DOM here, wearing the
   * `present-audio` test id, because the camera panel reads the clock off that
   * selector and a `new Audio()` is in no document.
   */
  /* eslint-disable react-hooks/immutability -- the element is the host's, and
     adopting it is exactly writing to it: the rule reads a DOM node arriving as
     a prop as component state. */
  useEffect(() => {
    const holder = voiceHostRef.current;
    const el: HTMLAudioElement | undefined = voice;
    if (!el || !holder) return;
    const url = scriptAudioUrl(name);
    if (!pointedAt(el, url)) {
      el.src = url;
      el.load();
    }
    el.preload = 'auto';
    el.setAttribute('data-testid', 'present-audio');
    if (el.parentElement !== holder) holder.appendChild(el);
    audioRef.current = el;
    return () => {
      if (el.parentElement === holder) holder.removeChild(el);
      if (audioRef.current === el) audioRef.current = null;
    };
  }, [voice, name]);
  /* eslint-enable react-hooks/immutability */

  /* The script and its lines; the lines are optional. */
  useEffect(() => {
    let live = true;
    // `?v=` only after an Apply: the built files were just overwritten, and the
    // dev server is happy to serve the copy the browser already has.
    const base = `${import.meta.env.BASE_URL}scripts/${name}`;
    const bust = rebuilt ? `?v=${rebuilt}` : '';
    fetch(`${base}.json${bust}`)
      .then((res) => {
        if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
        return res.json() as Promise<Script>;
      })
      .then((data) => {
        if (!live) return;
        if (!Array.isArray(data.actions)) throw new Error('script has no actions array');
        setScript({ actions: sortActions(data.actions) });
      })
      .catch((err: unknown) => console.error('[present] could not load', name, err));
    if (planMode) {
      // The plan is the lines *and* the clock: its total is the duration, since
      // there is no audio element with one.
      fetch(`${base}-plan.json${bust}`)
        .then((res) => {
          if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
          return res.json() as Promise<PlanFile>;
        })
        .then((data) => {
          if (!live) return;
          const planned = (data.lines ?? []).map((l) => ({
            beat: l.beat,
            line: l.line ?? (Number((l.id ?? '0.0').split('.')[1]) || 0),
            text: l.text,
            start: l.start,
            end: l.end,
          }));
          setLines(planned.sort((a, b) => a.start - b.start));
          setBeats(data.beats ?? []);
          setDuration(data.total ?? (planned.length ? planned[planned.length - 1].end : 0));
        })
        .catch((err: unknown) => console.error('[present] could not load the plan for', name, err));
    } else {
      fetch(`${base}-lines.json${bust}`)
        .then((res) => (res.ok ? (res.json() as Promise<{ lines?: ScriptLine[] }>) : null))
        .then((data) => {
          if (live && data && Array.isArray(data.lines)) {
            setLines([...data.lines].sort((a, b) => a.start - b.start));
          }
        })
        .catch(() => { /* No lines file: the timeline just has no spans. */ });
    }
    // The section labels: both transports, both clocks. A missing file (an
    // older cut, or one nobody has labeled yet) just yields no marks, and the
    // timeline falls back to the beat markers it already draws.
    loadSections(base, bust)
      .then((data) => { if (live) setSections(data); })
      .catch((err: unknown) => console.error('[present] could not load sections for', name, err));
    // Notes live on the dev server's middleware; the shipped walkthrough never
    // asks for them.
    if (authoring) fetch(notesUrl(name))
      .then((res) => {
        if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
        return res.json() as Promise<NotesFile>;
      })
      .then((data) => {
        if (live && Array.isArray(data.notes)) setNotes([...data.notes].sort((a, b) => a.t - b.t));
      })
      .catch((err: unknown) => {
        if (live) setNotesError(`notes: ${err instanceof Error ? err.message : String(err)}`);
      });
    return () => { live = false; };
  }, [name, rebuilt, planMode, authoring]);

  /* The clock: the audio element's position, or the plan clock, read every frame. */
  useEffect(() => {
    let raf = 0;
    const frame = () => {
      if (planMode) {
        const t = planTime();
        setTime(t);
        setPlaying(run.current.since !== null);
        // The plan is a fixed length; running past it stops the transport the
        // way the end of a track does.
        setDuration((d) => {
          if (d && t >= d && run.current.since !== null) {
            run.current = { base: d, since: null };
            setTime(d);
          }
          return d;
        });
      } else {
        const a = audioRef.current;
        if (a) {
          setTime(a.currentTime);
          if (a.duration && Number.isFinite(a.duration)) setDuration(a.duration);
          setPlaying(!a.paused && !a.ended);
        }
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [planMode, planTime]);

  const clock = useMemo<ScriptClock>(() => (planMode ? {
    now: planTime,
    running: () => run.current.since !== null,
  } : {
    now: () => audioRef.current?.currentTime ?? 0,
    running: () => {
      const a = audioRef.current;
      return !!a && !a.paused && !a.ended;
    },
  }), [planMode, planTime]);
  /**
   * The host's voice track and the schedule, started together.
   *
   * On the shipped path the track is playing before this component exists:
   * the browser only grants playback inside the click, so the About panel's
   * Presentation button creates the `<audio>` and calls `play()` there, and
   * this component and the runner inside it are a lazy chunk and a fetch
   * behind that. The runner then joined a clock that was already several
   * hundred ms in, so the cut's t=0 cue - the 400 ms reach and 1100 ms drag
   * that brings the camera panel on - fired late and landed after the first
   * word, which the plan puts at 1.8 s.
   *
   * So the track is wound back to the top at the moment the schedule is up
   * and the cut's opening state is applied, which is exactly when the runner
   * hands its handle over. It keeps playing across the rewind - playback
   * permission is the document's and it is sticky, so nothing has to be
   * started again - and the lead is silent, so there is nothing to hear in
   * the fraction of it that plays twice.
   *
   * Once only, and only for an adopted element: the `?present=` entry starts
   * its own track from the top off the transport's own button.
   */
  const rewound = useRef(false);
  const onHandle = useCallback((h: ScriptRunnerHandle | null) => {
    handleRef.current = h;
    if (!h || !voice || rewound.current) return;
    rewound.current = true;
    const a = audioRef.current;
    if (a && a.currentTime > 0) a.currentTime = 0;
    // And dispatch what is due at the top rather than a frame later.
    h.step();
  }, [voice]);

  /*
   * The framing layer, for capture. Nothing of it mounts without `frames=` in
   * the URL, and nothing of it mounts in the shipped walkthrough at all: the
   * viewer owns their window. See Frames.tsx.
   */
  const frames = useFrames({ name, host, time, enabled: mode !== 'production', authoring });
  /**
   * With `frames=` in the URL the capture is meant to show only the app, the
   * ghost cursor and the webcam panel - the transport bar (and everything
   * drawn on it: the labels, the captions) is furniture that belongs to
   * editing, not to the picture. So it starts hidden whenever the frame layer
   * is active, and **T** brings it back for editing (see the keydown effect
   * below). `?capture=1` asks for the same thing with no frame layer at all -
   * a full-page grab - so it hides the bar on its own. Without either this
   * never applies: both are false and the bar renders exactly as it always has.
   */
  const [framesBarVisible, setFramesBarVisible] = useState(false);
  const capturing = useMemo(() => captureFlag(), []);
  const hiddenForCapture = (frames.active || capturing) && !framesBarVisible;

  /**
   * On and off the bottom of the screen, on the shipped bar only.
   *
   * `barIn` is false for exactly one frame - the class that lets the bar up
   * has to arrive after the browser has painted it below the viewport, or
   * there is no transition to run - and `leaving` takes it off again. The
   * transition itself is in presentation-bar.css; all this owns is when the
   * class is on.
   *
   * Leaving is deferred rather than immediate because `onLeave` unmounts
   * everything: the bar, the voice, the camera panel. Called on the press,
   * the slide would be a component that no longer exists. So the press starts
   * the slide, and the host is told when it has finished.
   */
  const [barIn, setBarIn] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const leavingRef = useRef(false);
  const leaveTimer = useRef(0);
  /** No slide for a viewer who asked not to be moved; the wait goes too. */
  const reduceMotion = useMemo(
    () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches,
    [],
  );
  useEffect(() => {
    if (fullTransport) return;
    const raf = requestAnimationFrame(() => setBarIn(true));
    return () => cancelAnimationFrame(raf);
  }, [fullTransport]);
  const beginLeave = useCallback(() => {
    if (!onLeave || leavingRef.current) return;
    leavingRef.current = true;
    setLeaving(true);
    if (fullTransport || reduceMotion) {
      onLeave();
      return;
    }
    // The camera panel is a sibling under ColorPicker, so it hears about this
    // through the same module the bar's height goes out on.
    setBarLeaving(true);
    leaveTimer.current = window.setTimeout(onLeave, SLIDE_MS);
  }, [onLeave, fullTransport, reduceMotion]);
  useEffect(() => () => {
    window.clearTimeout(leaveTimer.current);
    setBarLeaving(false);
  }, []);

  /**
   * The end of the cut leaves by itself.
   *
   * A walkthrough that has said everything it has to say should not park a
   * transport bar over the app and wait to be dismissed. The wait after the
   * last sound is for the last frame and for the panel's drag-out to settle -
   * the cut ends on the sound, not on the motion - and it is cancelled if the
   * viewer starts the track again or scrubs back inside it, which is a viewer
   * who is not finished.
   *
   * Shipped transport only, and only where the host gave us an `onLeave`: the
   * `?present=` tool stays at the end of the track, which is where somebody
   * reviewing a cut wants to be left.
   */
  useEffect(() => {
    if (!onLeave || fullTransport || planMode) return;
    const a = audioRef.current;
    if (!a) return;
    let hold = 0;
    const onEnded = () => { hold = window.setTimeout(beginLeave, END_HOLD_MS); };
    const cancel = () => { window.clearTimeout(hold); hold = 0; };
    a.addEventListener('ended', onEnded);
    a.addEventListener('play', cancel);
    a.addEventListener('seeking', cancel);
    return () => {
      window.clearTimeout(hold);
      a.removeEventListener('ended', onEnded);
      a.removeEventListener('play', cancel);
      a.removeEventListener('seeking', cancel);
    };
  }, [onLeave, fullTransport, planMode, beginLeave, voice, name, rebuilt]);

  /*
   * The input shield.
   *
   * During the shipped walkthrough the app is the picture, not the controls:
   * a viewer's press on a slider fights the cut for the same colour, and the
   * hands the audience is watching are the runner's. So every real press,
   * every wheel and every key that is not the transport's is swallowed for as
   * long as this component is mounted - playing, paused, through the beat 10
   * hand-off to the built-in demo, and on the way out. What is left to the
   * viewer is the one decision Taylor kept for them: whether to stay.
   *
   * Only the shipped entry, and only where the host gave us an `onLeave`: a
   * lock with no way out is a trap, and the `?present=` tool is somebody
   * working on the cut, who needs the app.
   *
   * The lock is a capture-phase listener rather than a layer that eats the
   * events, though `shieldLayer` below still paints (and carries the offer).
   * A layer with `pointer-events: auto` would be the first thing
   * `document.elementFromPoint` finds, and three places read that point while
   * the cut plays - the ghost's hover sync (drive.ts `syncUnder`), the
   * hexagon's stem pick and the swatch drop target - so the shield would take
   * the cut's own hands off the app it is working. Filtering on `isTrusted`
   * draws the line where it actually belongs, between a person and the
   * runner, and it is the line the built-in demo already draws (DemoRunner's
   * "any real press ends the demo"). It also buys something a layer cannot:
   * a real hover no longer lights the app up under the audience's cursor.
   */
  const shielded = mode === 'production' && !!onLeave;
  const [offerOpen, setOfferOpen] = useState(false);
  const [offerIn, setOfferIn] = useState(false);
  const offerRef = useRef<HTMLDivElement | null>(null);
  const offerOpenRef = useRef(false);
  const offerReturn = useRef<HTMLElement | null>(null);
  useEffect(() => { offerOpenRef.current = offerOpen; }, [offerOpen]);

  const openOffer = useCallback(() => {
    offerReturn.current = document.activeElement instanceof HTMLElement && fromChrome(document.activeElement)
      ? document.activeElement
      : null;
    setOfferOpen(true);
  }, []);
  /** Back to the bar, so a viewer who was on the keyboard has not lost it. */
  const closeOffer = useCallback(() => {
    setOfferOpen(false);
    setOfferIn(false);
    const back = offerReturn.current
      ?? transportRef.current?.querySelector<HTMLElement>('[data-testid="present-play"]')
      ?? null;
    offerReturn.current = null;
    back?.focus();
  }, []);
  const toggleOffer = useCallback(() => {
    if (offerOpenRef.current) closeOffer();
    else openOffer();
  }, [closeOffer, openOffer]);

  /* The fade in is a frame late for the same reason the bar's slide is: the
     class has to arrive after the browser has painted the dialog at zero. */
  useEffect(() => {
    if (!offerOpen) return;
    const raf = requestAnimationFrame(() => setOfferIn(true));
    return () => cancelAnimationFrame(raf);
  }, [offerOpen]);

  /* Focus into the offer, on the button that changes nothing. */
  useEffect(() => {
    if (!offerOpen) return;
    offerRef.current?.querySelector<HTMLElement>('[data-testid="present-offer-stay"]')?.focus();
  }, [offerOpen]);

  /**
   * Tab stays inside the walkthrough's own chrome.
   *
   * The app has no single element to make `inert` - `#root` holds the
   * background layer and the app column as siblings, `#app-stage` leaves the
   * plugin banner out, and the About and Settings panels are portals of their
   * own in `<body>` - so there is nowhere to put one attribute that locks the
   * lot. A ring over the bar (or over the offer, while it is up) locks the
   * same thing without touching the app at all.
   */
  const trapFocus = useCallback((back: boolean) => {
    const scope = offerOpenRef.current ? offerRef.current : transportRef.current;
    if (!scope) return;
    const list = Array.from(scope.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR))
      .filter((el) => el.getClientRects().length > 0);
    if (!list.length) return;
    const here = list.indexOf(document.activeElement as HTMLElement);
    const next = here < 0
      ? (back ? list.length - 1 : 0)
      : (here + (back ? -1 : 1) + list.length) % list.length;
    list[next].focus();
  }, []);

  /* Read through refs so the lock below can register once, on mount: it has
     to sit ahead of the demo's own "any real press ends the demo" listener,
     which is registered when the hand-off mounts it. */
  const toggleOfferRef = useRef(toggleOffer);
  const trapFocusRef = useRef(trapFocus);
  useEffect(() => { toggleOfferRef.current = toggleOffer; }, [toggleOffer]);
  useEffect(() => { trapFocusRef.current = trapFocus; }, [trapFocus]);

  useEffect(() => {
    if (!shielded) return;
    const root = document.documentElement;
    root.setAttribute('data-present-locked', '');
    let downAt: { x: number; y: number } | null = null;
    /** A real person, anywhere but the bar and the offer. */
    const hijack = (e: Event) => e.isTrusted && !fromChrome(e.target);
    const swallow = (e: Event) => {
      e.stopPropagation();
      e.stopImmediatePropagation();
      if (e.cancelable) e.preventDefault();
    };
    const onPress = (e: Event) => {
      if (!hijack(e)) return;
      const p = e as PointerEvent;
      if (e.type === 'pointerdown') {
        downAt = { x: p.clientX, y: p.clientY };
      } else {
        // A press that stayed put is the click Taylor asked for: nothing
        // happens to the app, and the way out is offered instead. A drag is
        // somebody trying to work the app, and is answered with nothing.
        const still = downAt !== null && Math.hypot(p.clientX - downAt.x, p.clientY - downAt.y) <= OFFER_SLOP_PX;
        downAt = null;
        if (still) toggleOfferRef.current();
      }
      swallow(e);
    };
    const onQuiet = (e: Event) => { if (hijack(e)) swallow(e); };
    const onKey = (e: KeyboardEvent) => {
      if (!e.isTrusted) return;
      if (e.key === 'Tab') {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        trapFocusRef.current(e.shiftKey);
        return;
      }
      // The transport's own keys go on to the handler below, and a key typed
      // with the bar or the offer focused belongs to the button it is on.
      if (isTransportKey(e) || fromChrome(e.target)) return;
      e.stopPropagation();
      e.stopImmediatePropagation();
      // A chord is the browser's (Ctrl+R, Ctrl+T, Ctrl+W). Stopping it here
      // is enough to keep it off the app's own shortcuts - the undo pair is
      // the only thing listening - and taking its default away as well would
      // take the viewer's window with it.
      if (!e.ctrlKey && !e.metaKey && !e.altKey) e.preventDefault();
    };
    const quiet = [
      'pointermove', 'pointercancel', 'pointerover', 'pointerout',
      'mousedown', 'mouseup', 'mousemove', 'mouseover', 'mouseout',
      'click', 'dblclick', 'auxclick', 'contextmenu', 'dragstart',
    ];
    const opts = { capture: true } as const;
    // Not passive: a wheel and a touch drag are only stopped by a
    // preventDefault the browser has agreed to wait for. The cut's own scroll
    // cues are `window.scrollTo` calls and are untouched by this.
    const rude = { capture: true, passive: false } as const;
    window.addEventListener('pointerdown', onPress, opts);
    window.addEventListener('pointerup', onPress, opts);
    window.addEventListener('keydown', onKey, opts);
    window.addEventListener('wheel', onQuiet, rude);
    window.addEventListener('touchstart', onQuiet, rude);
    window.addEventListener('touchmove', onQuiet, rude);
    for (const type of quiet) window.addEventListener(type, onQuiet, opts);
    return () => {
      root.removeAttribute('data-present-locked');
      window.removeEventListener('pointerdown', onPress, opts);
      window.removeEventListener('pointerup', onPress, opts);
      window.removeEventListener('keydown', onKey, opts);
      window.removeEventListener('wheel', onQuiet, rude);
      window.removeEventListener('touchstart', onQuiet, rude);
      window.removeEventListener('touchmove', onQuiet, rude);
      for (const type of quiet) window.removeEventListener(type, onQuiet, opts);
    };
  }, [shielded]);

  const seek = useCallback((t: number) => {
    // A seek lands on the frame the cut says is in force there, rather than
    // easing into it: the same rule the actions follow.
    frames.jumped();
    if (planMode) {
      const clamped = Math.max(0, t);
      run.current = { base: clamped, since: run.current.since === null ? null : performance.now() };
      setTime(clamped);
      handleRef.current?.seek(clamped);
      return;
    }
    const a = audioRef.current;
    if (!a) return;
    const clamped = Math.max(0, Math.min(t, a.duration || t));
    a.currentTime = clamped;
    setTime(clamped);
    handleRef.current?.seek(clamped);
  }, [planMode, frames]);

  /** The live position, whichever clock is running. A getter, so a reader
   *  that wants it every frame - the clip editor's playhead - does not need
   *  this component to re-render to see it move. */
  const nowMaster = useCallback(
    () => (planMode ? planTime() : (audioRef.current?.currentTime ?? 0)),
    [planMode, planTime],
  );

  /** Arrow-key seeking: reads the live position rather than closing over
   *  `time`, so the keydown effect below does not need to churn every frame. */
  const seekBy = useCallback((delta: number) => seek(nowMaster() + delta), [nowMaster, seek]);

  /**
   * Arrow-key keyframe walking, for checking the frame layer's zoom marks.
   *
   * With `frames=` in the URL the arrows stop being a five-second scrub and
   * become a walk along the layer's keyframes instead: each press lands on the
   * next mark in the given direction, so somebody verifying a cut can see each
   * framing settle in turn without hunting for it on the scrub bar. There is
   * no wrap - walking off either end of the list simply does nothing, which is
   * the honest answer to "and then?" at the last mark, and it keeps a held key
   * from cycling the cut forever.
   *
   * The comparison is against the live clock rather than this render's `time`,
   * for the same reason `seekBy` reads it: the playhead moves every frame and
   * this component does not re-render with it.
   */
  const jumpKeyframe = useCallback((dir: 1 | -1) => {
    const now = nowMaster();
    const list = frames.keyframes;
    const kf = dir > 0
      ? list.find((k) => k.t > now + KEYFRAME_EPSILON)
      : [...list].reverse().find((k) => k.t < now - KEYFRAME_EPSILON);
    if (!kf) return;
    seek(kf.t + KEYFRAME_LANDING);
  }, [frames.keyframes, nowMaster, seek]);

  /**
   * After the clip editor's Apply: the audio, the lines and the cues have all
   * been rebuilt on disk. Re-fetch them rather than reloading the page, so the
   * app underneath keeps the state the edit was being judged against, and put
   * the playhead back where it was once the new track has its duration.
   */
  const onApplied = useCallback(() => {
    const a = audioRef.current;
    resumeAt.current = a ? a.currentTime : 0;
    a?.pause();
    setRebuilt(Date.now());
  }, []);
  useEffect(() => {
    const a = audioRef.current;
    const t = resumeAt.current;
    if (!a || !rebuilt || t === null) return;
    resumeAt.current = null;
    const restore = () => {
      a.currentTime = Math.min(t, a.duration || t);
      setTime(a.currentTime);
      handleRef.current?.seek(a.currentTime);
    };
    a.addEventListener('loadedmetadata', restore, { once: true });
    if (a.readyState >= 1) restore();
    return () => a.removeEventListener('loadedmetadata', restore);
  }, [rebuilt]);

  /**
   * The camera panel is this component's sibling under `ColorPicker.tsx`, not
   * its child, so `rebuilt` cannot reach it as a prop; a dynamic import of
   * `WebcamPip.tsx`'s own `notifyRebuilt` is the bridge instead (see that
   * file). Dynamic, not a static import, so this module does not drag the
   * panel's chunk in behind it - `ColorPicker.tsx` already lazy-loads the two
   * separately, and the About panel's shipped path may never render the panel
   * at all. `rebuilt` is 0 until the first Apply, which is not a rebuild to
   * announce.
   */
  useEffect(() => {
    if (!rebuilt) return;
    import('./WebcamPip').then((m) => m.notifyRebuilt(name, rebuilt));
  }, [rebuilt, name]);

  const toggle = useCallback(() => {
    if (planMode) {
      if (run.current.since === null) {
        // The sync flash belongs to the start of the cut, not to every resume:
        // it marks t=0 in a capture, and a second one mid-run would be a second
        // mark to cut on.
        if (!flashed.current && run.current.base === 0) {
          flashed.current = true;
          handleRef.current?.flash();
        }
        run.current.since = performance.now();
        // The clock is running as of this line; see ScriptRunnerHandle.step.
        handleRef.current?.step();
      } else {
        run.current = { base: planTime(), since: null };
      }
      setPlaying(run.current.since !== null);
      return;
    }
    const a = audioRef.current;
    if (!a) return;
    if (a.paused) {
      // The same mark plan mode paints, on the same terms: once, at the start
      // of the cut, never on a resume - and only when `&flash=1` asked for it.
      if (syncFlash && !flashed.current && a.currentTime === 0) {
        flashed.current = true;
        handleRef.current?.flash();
      }
      a.play().catch((err: unknown) => console.warn('[present] audio did not start', err));
      // `play()` clears `paused` in this task, so the schedule's clock is
      // running as of this line: a cue at t=0 belongs to this frame rather
      // than the next one. See ScriptRunnerHandle.step.
      handleRef.current?.step();
    } else a.pause();
  }, [planMode, planTime, syncFlash]);

  /* Space plays and pauses; N opens a note. Neither while typing. */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (inTextField(e.target)) return;
      // Chords belong to the browser (Ctrl+T, Ctrl+N, Ctrl+R): the keydown
      // still arrives here first, and T on a reload chord toggled the bar.
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      // The clip editor owns the keyboard while it is open: its handles nudge
      // with the arrow keys and Space would otherwise start the track under it.
      if (editing !== null) return;
      /*
       * The leave offer owns it while it is up. Escape closes the question
       * rather than answering it - a viewer who asked is not committed - so
       * leaving by keyboard is Escape twice, which is also what Escape means
       * everywhere else: close the nearest thing.
       */
      if (offerOpenRef.current) {
        if (e.key === 'Escape') {
          e.preventDefault();
          e.stopPropagation();
          closeOffer();
        }
        return;
      }
      if (e.code === 'Space' || e.key === ' ') {
        e.preventDefault();
        e.stopPropagation();
        toggle();
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        /*
         * Under a frame layer the arrows belong to its keyframes, and the
         * five-second scrub moves onto Shift. Without one - the shipped
         * walkthrough, and every dev entry that did not ask for `frames=` -
         * nothing about them changes.
         *
         * The third claim on these keys, the region nudge in Frames.tsx, never
         * reaches this line: that handler is registered first on the same
         * capture phase and stops the event while there is an editable outline
         * on screen, so a nudge is a nudge and anything else falls through to
         * here.
         */
        const jump = frames.active && !e.shiftKey;
        // The shipped bar seeks on the arrows too. It has no line spans to
        // step between, but a viewer who wants the last sentence again should
        // not have to hit a 3px track with a mouse to get it.
        if (!jump && !fullTransport && !shielded) return;
        e.preventDefault();
        e.stopPropagation();
        if (jump) jumpKeyframe(e.key === 'ArrowRight' ? 1 : -1);
        else seekBy(e.key === 'ArrowRight' ? SEEK_STEP : -SEEK_STEP);
      } else if (authoring && (e.key === 'n' || e.key === 'N')) {
        e.preventDefault();
        e.stopPropagation();
        setNoting(true);
      } else if (authoring && (e.key === 'c' || e.key === 'C')) {
        e.preventDefault();
        e.stopPropagation();
        setCollapsed((v) => !v);
      } else if (onLeave && e.key === 'Escape') {
        // The keyboard twin of the bar's X, and inert once the bar is already
        // on its way down. Only where the host gave us somewhere to go, so a
        // dev entry's Escape still belongs to whatever else wants it.
        e.preventDefault();
        e.stopPropagation();
        beginLeave();
      } else if ((frames.active || capturing) && (e.key === 't' || e.key === 'T')) {
        // Brings the transport bar back over a capture for editing; see
        // `hiddenForCapture` above. Only reachable at all with `frames=` or
        // `capture=1` in the URL, which are dev-only entries.
        e.preventDefault();
        e.stopPropagation();
        setFramesBarVisible((v) => !v);
      }
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [toggle, editing, authoring, fullTransport, seekBy, jumpKeyframe, frames.active, capturing, onLeave,
    beginLeave, shielded, closeOffer]);

  useEffect(() => {
    if (noting) noteInputRef.current?.focus();
  }, [noting]);

  /* Scrubbing: a press seeks, and dragging keeps seeking. */
  const timeFromPointer = (e: { clientX: number }) => {
    const el = timelineRef.current;
    if (!el || !duration) return null;
    const r = el.getBoundingClientRect();
    const u = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width));
    return u * duration;
  };
  const onTimelineDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    const t = timeFromPointer(e);
    if (t === null) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    seek(t);
  };
  const onTimelineMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!e.currentTarget.hasPointerCapture(e.pointerId)) return;
    const t = timeFromPointer(e);
    if (t !== null) seek(t);
  };
  /**
   * A double-click opens the clip editor for the line under the pointer.
   *
   * It is handled here rather than on the span itself: the press sets pointer
   * capture on the timeline so a drag keeps scrubbing, and the capture makes the
   * timeline the target of the click and double-click that follow, so a handler
   * on the span would never hear them.
   */
  const onTimelineDouble = (e: ReactMouseEvent<HTMLDivElement>) => {
    // Nothing to edit on the plan clock: the lines are planned, not recorded,
    // so there is no clip behind the span under the pointer. And nothing to
    // edit in the shipped walkthrough, which has no pipeline behind it.
    if (planMode || !authoring) return;
    const t = timeFromPointer(e);
    const l = t === null ? null : lineAt(lines, t);
    if (l) setEditing(`${l.beat}.${l.line}`);
  };

  /* Notes: kept on the dev server, whole file each time. */
  const persist = useCallback((next: Note[], clear = false) => {
    setNotes(next);
    const body: NotesFile & { clear?: boolean } = { source: name, notes: next, ...(clear ? { clear: true } : {}) };
    fetch(notesUrl(name), {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    })
      .then((res) => {
        if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
        setNotesError(null);
      })
      .catch((err: unknown) => setNotesError(`notes: ${err instanceof Error ? err.message : String(err)}`));
  }, [name]);

  const addNote = (text: string) => {
    const t = audioRef.current?.currentTime ?? time;
    const l = lineAt(lines, t);
    const note: Note = { t, beat: l?.beat ?? null, line: l?.line ?? null, text, created: new Date().toISOString() };
    persist([...notes, note].sort((a, b) => a.t - b.t));
  };
  const removeNote = (n: Note) => persist(notes.filter((x) => x !== n));
  // Clear confirms in place, the way the swatch library's bin does: first
  // click arms the button and it reads "Sure?", a second click within 3 s
  // clears, anything else disarms it.
  const [clearArmed, setClearArmed] = useState(false);
  const disarm = useRef<number | null>(null);
  useEffect(() => () => { if (disarm.current !== null) window.clearTimeout(disarm.current); }, []);
  const clearNotes = () => {
    if (!notes.length) return;
    if (clearArmed) {
      if (disarm.current !== null) window.clearTimeout(disarm.current);
      setClearArmed(false);
      persist([], true);
      return;
    }
    setClearArmed(true);
    disarm.current = window.setTimeout(() => setClearArmed(false), 3000);
  };
  const copyNotes = () => {
    navigator.clipboard.writeText(notesMarkdown(notes))
      .then(() => {
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1200);
      })
      .catch((err: unknown) => console.warn('[present] clipboard', err));
  };

  /* The readout: the line being spoken, the action in hand, the one after. */
  const actions = script?.actions ?? [];
  const line = lineAt(lines, time);
  let currentIdx = -1;
  for (let i = 0; i < actions.length && actions[i].at <= time; i += 1) currentIdx = i;
  const current = currentIdx >= 0 ? actions[currentIdx] : null;
  const following = currentIdx + 1 < actions.length ? actions[currentIdx + 1] : null;
  // The built-in demo runs from its action until the next scheduled one.
  const demoWouldRun = current?.do === 'demo' && (!following || time < following.at);

  /* The caption's crossfade: a new layer starts on top whenever the text
   * changes, and the one it replaces is marked to fade out and dropped once
   * the fade is done. */
  useEffect(() => {
    const next = captionAt(lines, time);
    if (next === captionTextRef.current) return;
    captionTextRef.current = next;
    captionIdRef.current += 1;
    const id = captionIdRef.current;
    setCaptionLayers((prev) => [
      ...prev.map((l) => ({ ...l, out: true })),
      ...(next !== null ? [{ id, text: next, out: false }] : []),
    ]);
    if (captionFadeTimer.current !== null) window.clearTimeout(captionFadeTimer.current);
    captionFadeTimer.current = window.setTimeout(() => {
      setCaptionLayers((prev) => prev.filter((l) => !l.out));
    }, CAPTION_FADE_MS + 50);
  }, [lines, time]);
  useEffect(() => () => {
    if (captionFadeTimer.current !== null) window.clearTimeout(captionFadeTimer.current);
  }, []);

  /* The word-chunk caption's crossfade, mirroring the line-text one above:
   * a new layer for the chunk now covering the playhead, the one it replaces
   * marked to fade out and dropped once the fade is done. */
  useEffect(() => {
    if (!wordChunks) return;
    const next = chunkAt(wordChunks, time);
    const nextId = next ? next.id : null;
    if (nextId === wordChunkIdRef.current) return;
    wordChunkIdRef.current = nextId;
    wordChunkLayerIdRef.current += 1;
    const id = wordChunkLayerIdRef.current;
    setWordChunkLayers((prev) => [
      ...prev.map((l) => ({ ...l, out: true })),
      ...(next !== null ? [{ id, chunk: next, out: false }] : []),
    ]);
    if (wordChunkFadeTimer.current !== null) window.clearTimeout(wordChunkFadeTimer.current);
    wordChunkFadeTimer.current = window.setTimeout(() => {
      setWordChunkLayers((prev) => prev.filter((l) => !l.out));
    }, CAPTION_FADE_MS + 50);
  }, [wordChunks, time]);
  useEffect(() => () => {
    if (wordChunkFadeTimer.current !== null) window.clearTimeout(wordChunkFadeTimer.current);
  }, []);

  const pct = (t: number) => (duration ? `${(100 * t) / duration}%` : '0%');

  /**
   * Notes within 2s of the playhead, on either clock: highlighted in the list
   * and on the timeline. Recomputed every frame off `time`, same as the rest
   * of the readout above.
   */
  const highlightedNotes = useMemo(() => {
    const s = new Set<number>();
    notes.forEach((n, i) => { if (Math.abs(time - n.t) <= 2) s.add(i); });
    return s;
  }, [notes, time]);

  /* Scroll the nearest highlighted row into view when the highlighted set
   * changes - not on every frame, and not while the user is scrolling the
   * list themselves (a wheel/scroll event there holds this off for 3s). */
  useEffect(() => {
    const key = Array.from(highlightedNotes).sort((a, b) => a - b).join(',');
    if (key === lastHighlightKey.current) return;
    lastHighlightKey.current = key;
    if (!highlightedNotes.size) return;
    if (Date.now() - lastNotesListInteraction.current < 3000) return;
    let nearestIdx = -1;
    let nearestDist = Infinity;
    highlightedNotes.forEach((i) => {
      const d = Math.abs(time - notes[i].t);
      if (d < nearestDist) { nearestDist = d; nearestIdx = i; }
    });
    const el = nearestIdx >= 0 ? noteRowRefs.current.get(nearestIdx) : undefined;
    el?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [highlightedNotes, notes, time]);

  /*
   * Where each beat starts, for the markers and for the prev/next buttons.
   *
   * The plan says so outright; a recorded cut does not, so the beat's start is
   * its first line's, which is what the ids in `<cut>-lines.json` are for. Both
   * transports get them: on the reduced one, where there are no line spans and
   * no cue ticks, the beats are the only landmarks there are.
   */
  const beatMarks: { n: number; t: number }[] = beats.length
    ? beats.map((b) => ({ n: b.n, t: b.start }))
    : lines.reduce<{ n: number; t: number }[]>((acc, l) => {
      if (!acc.some((m) => m.n === l.beat)) acc.push({ n: l.beat, t: l.start });
      return acc;
    }, []).sort((a, b) => a.t - b.t);
  /**
   * How far into a beat counts as being in it rather than at its start: a
   * "previous" press inside this lands on the beat before, and after it lands
   * on the top of the one being played. The rule every transport has.
   */
  const BEAT_GRACE = 1.5;
  /**
   * The resolved section labels: each section's `line` id looked up in
   * `lines` for its start time. Empty when there is no sections file for this
   * cut, or none of it matched — in which case every place below that reads
   * `sectionMarks` falls back to the beat markers instead.
   */
  const sectionMarks = useMemo(() => resolveSectionMarks(sections, lines), [sections, lines]);
  /* The timeline's own pixel width, for packing labels — percentages don't
   * tell us whether two labels' text actually overlaps. */
  useEffect(() => {
    const el = timelineRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width;
      if (w) setTimelineWidth(w);
    });
    ro.observe(el);
    setTimelineWidth(el.getBoundingClientRect().width);
    return () => ro.disconnect();
  }, []);
  /* The transport bar's own height, published to frameState so the camera
   * panel's home corner can sit above it rather than under it - see
   * WebcamPip.tsx's `compute`. Both transports measure themselves here, full
   * and reduced alike, since the bar's height differs between them (the
   * label row alone can change it). Hidden for a capture (`hiddenForCapture`)
   * the bar is `display: none`, so its own box is 0 already - but that is
   * asserted outright here rather than left to a resize-observer round trip,
   * so the panel's home corner moves on the same frame the bar disappears.
   *
   * Under a frame layer or a capture the bar is never part of the picture:
   * T brings it back only to edit over the capture, and it goes again before
   * the picture is judged. So its height is 0 there even while it shows.
   * Otherwise the panel's home corner lifted by the bar's 132 px on T, the
   * opening pip cue measured its grip on the lifted panel, and the second T
   * dropped the panel out from under the hand (the recorder's T/Space/T
   * start on 2026-09-15, and Taylor's own testing on the 16th). */
  useEffect(() => {
    const el = transportRef.current;
    if (!el) return;
    if (hiddenForCapture || frames.active || capturing) {
      setTransportHeight(0);
      return;
    }
    // contentRect excludes the bar's own padding and border, so measure the
    // full box directly rather than trust the observer entry's rect.
    const ro = new ResizeObserver(() => setTransportHeight(el.getBoundingClientRect().height));
    ro.observe(el);
    setTransportHeight(el.getBoundingClientRect().height);
    return () => {
      ro.disconnect();
      setTransportHeight(0);
    };
  }, [hiddenForCapture, frames.active, capturing]);
  const labelLayout = useMemo(
    () => layoutSectionLabels(sectionMarks, duration, timelineWidth),
    [sectionMarks, duration, timelineWidth],
  );
  const labelRowHeightPx = useMemo(() => labelRowHeight(sectionMarks), [sectionMarks]);
  /** The section the playhead is inside: its label is drawn brighter. */
  const currentSectionId = useMemo(() => {
    let cur: number | null = null;
    for (const m of sectionMarks) {
      if (m.t > time) break;
      cur = m.id;
    }
    return cur;
  }, [sectionMarks, time]);
  /** Reduced transport steps by section when a sections file resolved;
   *  otherwise, and always on the full transport, it steps by beat. */
  const navMarks = !fullTransport && sectionMarks.length ? sectionMarks : beatMarks;
  const toBeat = (dir: -1 | 1) => {
    if (!navMarks.length) return;
    if (dir < 0) {
      const prior = navMarks.filter((m) => m.t < time - BEAT_GRACE);
      seek(prior.length ? prior[prior.length - 1].t : 0);
      return;
    }
    const next = navMarks.find((m) => m.t > time + 0.05);
    if (next) seek(next.t);
  };

  return (
    <>
      {script && (
        <ScriptRunner
          host={host}
          onDemo={onDemo}
          onColor={onColor}
          demoOpen={demoOpen}
          script={script}
          clock={clock}
          onHandle={onHandle}
        />
      )}
      {frames.overlay}
      {createPortal(
        <div
          ref={transportRef}
          className={fullTransport ? undefined : `present-bar${barIn && !leaving ? ' present-bar-in' : ''}`}
          data-testid="present-transport"
          data-present-chrome=""
          data-frames-hidden={hiddenForCapture ? 'true' : undefined}
          style={{
            // Hidden for a capture rather than unmounted: the audio element
            // and the voice host below have to stay put so playback and the
            // schedule's clock are untouched by the toggle. `display: none`
            // takes the whole bar - labels and captions included - out of the
            // capture and collapses its own box, which is what zeroes the
            // height published to frameState above.
            display: hiddenForCapture ? 'none' : undefined,
            position: 'fixed',
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 80,
            // Tinted rather than solid, over a blur: the transport is a tool
            // sitting on top of the app, and a solid bar reads as part of the
            // page's furniture. Darker than the About panel's scrim (0.72
            // against 0.45) because everything on this bar is 12px monospace
            // over whatever the app happens to be showing, and the line spans
            // and cue ticks need their contrast.
            // The shipped bar (Taylor's Figma node 172:1479) has no rule and
            // no hard top edge: it fades up out of the page, so the app shows
            // through its top and the bar reads as a surface of the app
            // rather than a tool parked on it. That fade, and every other
            // colour on the shipped bar, is a `--bar-*` token from
            // presentation-bar.css keyed off the app's own light/dark class;
            // nothing here is a fixed near-black any more. The dev transport
            // keeps the orange rule and the flat tint, and no class.
            ...(fullTransport
              ? {
                  background: 'rgba(27,27,31,0.72)',
                  borderTop: '2px solid #f5a623',
                  boxShadow: '0 -4px 16px rgba(0,0,0,0.4)',
                }
              : {}),
            backdropFilter: 'blur(6px)',
            WebkitBackdropFilter: 'blur(6px)',
            color: fullTransport ? '#e6e6e6' : 'var(--bar-fg)',
            font: '12px/1.4 ui-monospace, Consolas, monospace',
            padding: shrunk ? '4px 12px' : '6px 12px 8px',
            userSelect: 'none',
          }}
        >
          {/* No element at all on the plan clock: there is no track to point it
              at, and an <audio> with a missing src is a 404 on every load. And
              none when the host handed one in - that one is adopted into the
              holder below, test id and all. */}
          {!planMode && !voice && (
            <audio
              ref={audioRef}
              src={rebuilt ? `${scriptAudioUrl(name)}?v=${rebuilt}` : scriptAudioUrl(name)}
              preload="auto"
              data-testid="present-audio"
            />
          )}
          {voice && <span ref={voiceHostRef} data-testid="present-voice-host" />}

          {/* The caption: centered above the label row and the rest of the
              bar. Its own layer, not a sibling of the line/action readout
              above - that readout is full-transport only and stays a
              developer's tool; this is meant to read from across the room.
              Crossfades rather than cutting. Two shapes, mutually exclusive:
              word chunks (HyperFrames-style, a word brightening as the
              playhead passes its start) when `<name>-words.json` loaded, the
              current line's whole text otherwise. */}
          {captionsOn && !hiddenForCapture && wordChunks && wordChunkLayers.length > 0 && (
            <div
              data-testid="present-captions"
              aria-live="polite"
              style={{
                position: 'absolute',
                left: '50%',
                bottom: '100%',
                transform: 'translateX(-50%)',
                marginBottom: 10,
                maxWidth: '70vw',
                textAlign: 'center',
                pointerEvents: 'none',
              }}
            >
              {wordChunkLayers.map((l) => (
                <div
                  key={l.id}
                  style={{
                    position: l.out ? 'absolute' : 'relative',
                    inset: l.out ? 0 : undefined,
                    fontSize: 22,
                    lineHeight: 1.3,
                    fontFamily: 'ui-monospace, Consolas, monospace',
                    whiteSpace: 'nowrap',
                    textShadow: '0 1px 2px rgba(0,0,0,0.95), 0 0 10px rgba(0,0,0,0.8)',
                    opacity: l.out ? 0 : 1,
                    transition: `opacity ${CAPTION_FADE_MS}ms ease`,
                  }}
                >
                  {l.chunk.words.map((w, i) => (
                    <span
                      key={i}
                      style={{
                        // Fill, not layout: only color changes as the
                        // playhead passes a word's start, so the chunk never
                        // reflows and there is no per-letter animation.
                        color: time >= w.start ? '#fff' : 'rgba(255,255,255,0.4)',
                        transition: 'color 120ms linear',
                      }}
                    >
                      {w.text}
                      {i < l.chunk.words.length - 1 ? ' ' : ''}
                    </span>
                  ))}
                </div>
              ))}
            </div>
          )}
          {captionsOn && !hiddenForCapture && !wordChunks && captionLayers.length > 0 && (
            <div
              data-testid="present-captions"
              aria-live="polite"
              style={{
                position: 'absolute',
                left: '50%',
                bottom: '100%',
                transform: 'translateX(-50%)',
                marginBottom: 10,
                maxWidth: '60vw',
                textAlign: 'center',
                pointerEvents: 'none',
              }}
            >
              {captionLayers.map((l) => (
                <div
                  key={l.id}
                  style={{
                    position: l.out ? 'absolute' : 'relative',
                    inset: l.out ? 0 : undefined,
                    fontSize: 18,
                    lineHeight: 1.3,
                    fontFamily: 'ui-monospace, Consolas, monospace',
                    color: '#fff',
                    textShadow: '0 1px 2px rgba(0,0,0,0.95), 0 0 10px rgba(0,0,0,0.8)',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    opacity: l.out ? 0 : 1,
                    transition: `opacity ${CAPTION_FADE_MS}ms ease`,
                  }}
                >
                  {l.text}
                </div>
              ))}
            </div>
          )}

          {fullTransport && (
          <div style={{ display: shrunk ? 'none' : 'flex', gap: 16, alignItems: 'baseline', minHeight: 18 }}>
            <span data-testid="present-line" style={{ flex: 1, color: '#fff', fontSize: 13 }}>
              {line ? `${line.beat}.${line.line}  ${line.text}` : '—'}
            </span>
            <span data-testid="present-action" style={{ color: '#9fd0ff', whiteSpace: 'nowrap' }}>
              {current ? `now: ${describe(current)} @${current.at}` : 'now: —'}
              {demoWouldRun ? '  (demo would be running)' : ''}
              {following ? `   next: ${describe(following)} @${following.at}` : '   next: —'}
            </span>
          </div>
          )}

          {/* The section-label row, shared by both transports: a single tilted
              row above the bar, each label anchored at its section's start
              marker. Built once and reused below so the reduced transport can
              place it above the buttons+bar row instead of sharing a row with
              them. */}
          {(() => {
          const labelsRow = labelLayout.length > 0 && (
            <div
              data-testid="present-section-labels"
              style={{
                position: 'relative',
                height: labelRowHeightPx,
                marginBottom: 3,
              }}
            >
              {labelLayout.map(({ mark, leftPx, text }) => (
                <span
                  key={`section-label-${mark.id}`}
                  data-testid="present-section-label"
                  data-section={mark.id}
                  data-current={mark.id === currentSectionId ? 'true' : undefined}
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    left: leftPx,
                    fontSize: 14,
                    lineHeight: '16px',
                    whiteSpace: 'nowrap',
                    fontFamily: 'ui-monospace, Consolas, monospace',
                    color: mark.id === currentSectionId
                      ? (fullTransport ? '#ffffff' : 'var(--bar-fg-strong)')
                      : (fullTransport ? '#cfcfcf' : 'var(--bar-fg-muted)'),
                    textShadow: mark.id === currentSectionId
                      ? (fullTransport ? '0 0 6px rgba(127,212,255,0.85), 0 1px 2px rgba(0,0,0,0.9)' : 'var(--bar-glow)')
                      : (fullTransport ? '0 1px 2px rgba(0,0,0,0.9)' : 'var(--bar-shadow)'),
                    transformOrigin: 'bottom left',
                    transform: `rotate(-${LABEL_ANGLE_DEG}deg)`,
                  }}
                >
                  {text}
                </span>
              ))}
            </div>
          );
          {/* The timeline and, outside it, the playhead: the head stands taller
              than the track it marks, and the track clips its own decoration,
              so the two cannot live in the same box. `flex: 1` only matters on
              the reduced transport, where this sits directly in the
              buttons+bar row; on the full transport it's inert since that
              row isn't itself a flex container. */}
          const timelineBar = (
          <div style={{ position: 'relative', flex: 1 }}>
          <div
            ref={timelineRef}
            data-testid="present-timeline"
            onPointerDown={onTimelineDown}
            onPointerMove={onTimelineMove}
            onDoubleClick={onTimelineDouble}
            style={{
              display: 'block',
              position: 'relative',
              height: 28,
              background: fullTransport ? '#2a2a30' : 'var(--bar-track)',
              borderRadius: 3,
              cursor: 'pointer',
              touchAction: 'none',
              overflow: 'hidden',
            }}
          >
            {/* The plan's beats, as a band along the top: the spans below are
                sentences, and a beat is the unit the pauses are built around.
                Reduced transport is a bare scrub bar, so none of this decoration
                mounts there. */}
            {fullTransport && beats.map((b) => (
              <div
                key={`beat-${b.n}`}
                data-testid="present-beat"
                data-beat={b.n}
                title={`${b.n} · ${b.title} — ${(b.end - b.start).toFixed(1)}s${b.estimate ? ` (est ${b.estimate}s)` : ''}`}
                style={{
                  position: 'absolute',
                  top: 0,
                  height: 7,
                  left: pct(b.start),
                  width: pct(Math.max(0.05, b.end - b.start)),
                  background: b.n % 2 ? 'rgba(245,166,35,0.45)' : 'rgba(245,166,35,0.25)',
                  borderLeft: '1px solid rgba(245,166,35,0.9)',
                  fontSize: 6,
                  color: '#1b1b1f',
                  paddingLeft: 2,
                  lineHeight: '7px',
                  overflow: 'hidden',
                }}
              >
                {b.n}
              </div>
            ))}
            {fullTransport && lines.map((l, i) => (
              <div
                key={`line-${i}`}
                data-testid="present-line-span"
                data-line-id={`${l.beat}.${l.line}`}
                title={`${l.beat}.${l.line} ${l.text} — double-click to edit the clip`}
                style={{
                  position: 'absolute',
                  top: beats.length ? 9 : 4,
                  bottom: 4,
                  left: pct(l.start),
                  width: pct(Math.max(0.05, l.end - l.start)),
                  background: l === line ? 'rgba(245,166,35,0.55)' : `rgba(120,160,255,${l.beat % 2 ? 0.28 : 0.18})`,
                  borderRadius: 2,
                }}
              />
            ))}
            {fullTransport && actions.map((a, i) => (
              <div
                key={`tick-${i}`}
                data-testid="present-tick"
                title={`${a.at}s ${describe(a)}`}
                style={{
                  position: 'absolute',
                  top: 0,
                  bottom: 0,
                  left: pct(a.at),
                  width: 1,
                  background: a.do === 'color' ? '#ff6e6e' : a.do === 'demo' ? '#7dff9a' : '#dddddd',
                }}
              />
            ))}
            {/* Where each beat starts, on both transports: a full-height rule
                with the number on it. Shorter and dimmer than the playhead by
                design - these are the map, and the head is where you are. */}
            {(fullTransport || !sectionMarks.length) && beatMarks.map((m) => (
              <div
                key={`beat-mark-${m.n}`}
                data-testid="present-beat-mark"
                data-beat={m.n}
                title={`beat ${m.n} — ${mmss(m.t)}`}
                style={{
                  position: 'absolute',
                  top: 0,
                  bottom: 0,
                  left: pct(m.t),
                  width: 1,
                  background: 'rgba(245,166,35,0.85)',
                  fontSize: 7,
                  lineHeight: '8px',
                  color: 'rgba(245,166,35,0.95)',
                  paddingLeft: 2,
                  whiteSpace: 'nowrap',
                }}
              >
                {m.n}
              </div>
            ))}
            {/* The resolved sections, as their own rule: the reduced transport
                shows these instead of the beat marks above (which only render
                there as a fallback, when there is no sections file); the full
                transport shows both, the beats it always has plus these. */}
            {sectionMarks.map((m) => (
              <div
                key={`section-mark-${m.id}`}
                data-testid="present-section-mark"
                data-section={m.id}
                title={`${m.label} — ${mmss(m.t)}`}
                style={{
                  position: 'absolute',
                  top: 0,
                  bottom: 0,
                  left: pct(m.t),
                  width: 1,
                  background: m.id === currentSectionId
                    ? (fullTransport ? 'rgba(127,212,255,0.95)' : 'var(--bar-tick-current)')
                    : (fullTransport ? 'rgba(90,209,201,0.85)' : 'var(--bar-tick)'),
                }}
              />
            ))}
            {/* The keyframe track: a marker per keyframe, in the colors of the
                ratios it actually frames, so a shot set for YouTube alone
                reads apart from one set for all four. A shot change is a
                landmark of the cut as much as a beat is. Pressing one seeks
                exactly to it, rather than to wherever on the bar the marker
                was clicked. A hold trails the marker as a bar: the keyframe
                arrives at its time and stands there for that long. */}
            {frames.active && frames.keyframes.map((k, i) => {
              const kRatios = RATIOS.filter((r) => k.regions[r]);
              const paint = kRatios.length ? kRatios : [frames.ratio];
              const held = Math.max(0, k.hold ?? 0);
              return (
                <Fragment key={`frame-${i}`}>
                  {held > 0 && (
                    <div
                      data-testid="present-frame-hold"
                      data-frame-t={k.t}
                      title={`frame holds ${held}s from ${mmssTenths(k.t)}`}
                      style={{
                        position: 'absolute',
                        bottom: 1,
                        height: 3,
                        left: pct(k.t),
                        width: pct(held),
                        background: RATIO_COLOR[paint[0]],
                        opacity: i === frames.activeIndex ? 0.8 : 0.4,
                      }}
                    />
                  )}
                  <div
                    data-testid="present-frame-mark"
                    data-frame-t={k.t}
                    data-frame-ratios={kRatios.join(' ')}
                    data-frame-hold={held || undefined}
                    data-frame-active={i === frames.activeIndex ? '1' : undefined}
                    title={`frame ${Object.keys(k.regions).join(' ')} — ${mmssTenths(k.t)}`
                      + `${k.ms ? ` · ${k.ms}ms in` : ''}${held ? ` · holds ${held}s` : ''}`}
                    onPointerDown={(e) => { e.stopPropagation(); seek(k.t); }}
                    style={{
                      position: 'absolute',
                      bottom: 0,
                      height: 8,
                      width: 7,
                      marginLeft: -3,
                      left: pct(k.t),
                      background: paint.length > 1
                        ? `linear-gradient(to bottom, ${paint
                          .map((r, n) => `${RATIO_COLOR[r]} ${(100 * n) / paint.length}% ${(100 * (n + 1)) / paint.length}%`)
                          .join(', ')})`
                        : RATIO_COLOR[paint[0]],
                      borderRadius: 1,
                      cursor: 'pointer',
                      pointerEvents: 'auto',
                      opacity: i === frames.activeIndex ? 1 : 0.55,
                    }}
                  />
                </Fragment>
              );
            })}
            {fullTransport && notes.map((n, i) => (
              <div
                key={`note-${i}`}
                data-testid="present-note-mark"
                data-highlighted={highlightedNotes.has(i) ? 'true' : undefined}
                title={n.text}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: pct(n.t),
                  width: 0,
                  height: 0,
                  borderLeft: '4px solid transparent',
                  borderRight: '4px solid transparent',
                  borderTop: `6px solid ${highlightedNotes.has(i) ? '#7fd4ff' : '#f5a623'}`,
                  marginLeft: -4,
                  filter: highlightedNotes.has(i) ? 'drop-shadow(0 0 3px rgba(127,212,255,0.9))' : undefined,
                }}
              />
            ))}
          </div>
            {/* Light blue and standing 4px proud of the track at each end: the
                head was a white hairline the same height as the cue ticks,
                which are white too, so on a timeline with a tick every second
                there was nothing to pick it out. Outside the track's own box,
                which clips. */}
            <div
              data-testid="present-playhead"
              style={{
                position: 'absolute',
                top: -4,
                bottom: -4,
                left: pct(time),
                width: 3,
                marginLeft: -1.5,
                borderRadius: 2,
                // Hue 30 on the shipped bar - the cut's own orange, the colour
                // the script keeps coming back to - and the tool's blue on the
                // dev transport.
                background: fullTransport ? '#7fd4ff' : 'var(--bar-playhead)',
                boxShadow: fullTransport ? '0 0 4px rgba(127,212,255,0.9)' : 'var(--bar-playhead-glow)',
                // Decoration, not a control: pressing it should scrub the
                // track underneath, not swallow the click. Without this, the
                // first click of a double-click seeks the playhead to sit
                // exactly under the pointer, so the second click lands on
                // this div instead of the timeline and never reaches
                // onTimelineDouble — a real mouse double-click stopped
                // opening the clip editor while a synthetic dblclick
                // (dispatched straight at the timeline element, skipping
                // hit-testing) still did.
                pointerEvents: 'none',
              }}
            />
          </div>
          );
          /* Full transport: unchanged from before — small buttons, clock and
             the labels+timeline column all on one row, vertically centered
             together.

             Reduced (shipped) transport: Taylor's layout for the shipped
             presentation timeline (Figma node 172:1479). The clock and the
             three transport buttons stack into one narrow column at the
             bar's left edge — clock on top, buttons beneath — so that the
             track is no longer paying for a clock's width out of its own
             line and can run all the way to the bar's right padding. The
             column is exactly as wide as the buttons row it holds, which is
             what keeps the clock's left edge and the first button's left
             edge on the same rule. The label row still lives inside the
             track's own column rather than spanning the whole transport row,
             so a label's percentage is a percentage of the track and not of
             the column+track width. */
          return fullTransport ? (
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', margin: '2px 0' }}>
            <button
              type="button"
              data-testid="present-prev-beat"
              onClick={() => toBeat(-1)}
              title="Previous beat"
              aria-label="Previous beat"
              style={buttonStyle}
            >
              <PrevBeatIcon />
            </button>
            <button
              type="button"
              data-testid="present-play"
              onClick={toggle}
              aria-label={playing ? 'Pause' : 'Play'}
              style={buttonStyle}
            >
              {playing ? <PauseIcon /> : <PlayIcon />}
            </button>
            <button
              type="button"
              data-testid="present-next-beat"
              onClick={() => toBeat(1)}
              title="Next beat"
              aria-label="Next beat"
              style={buttonStyle}
            >
              <NextBeatIcon />
            </button>
            <span data-testid="present-time" style={{ minWidth: 96, whiteSpace: 'nowrap' }}>
              {mmssTenths(time)} / {mmss(duration)}
            </span>
            <div style={{ display: shrunk ? 'none' : 'block', position: 'relative', flex: 1, margin: '8px 0' }}>
              {labelsRow}
              {timelineBar}
            </div>
          </div>
          ) : (
          <div style={{ display: shrunk ? 'none' : 'block', margin: '8px 0' }}>
            {/* Bottom-aligned on the track's own bottom edge, not centered on
                the whole row: the row's cross-axis extent is the label row
                (when there is one) plus the track, and centering the column
                against that put it too high whenever a label row was up.
                `flex-end` lands the column's bottom - the buttons row - on
                the track's bottom edge; the label row, if any, sits above
                the track and does not move that edge. The 24px gap is wide
                enough that a label anchored at 0s reads as the track's and
                not as something hanging off the buttons. */}
            <div style={{ display: 'flex', gap: 24, alignItems: 'flex-end' }}>
              {/* Clock over buttons, both flush with the bar's left padding.
                  The column takes its width from the buttons row underneath
                  (three 32px squares, 8px apart) rather than from the clock,
                  so the clock can grow to "10:06.0 / 12:34" without pushing
                  the track right. */}
              <div
                style={{
                  flex: '0 0 auto',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 8,
                  width: 3 * 32 + 2 * 8,
                }}
              >
                {/* The app's own monospace at the slider values' size, not the
                    bar's default face: this clock is the one thing on the
                    shipped bar an audience reads. Whole seconds - tenths are
                    for placing cues, not for watching - centred over the
                    buttons, and tabular figures so the digits hold still. */}
                <span
                  data-testid="present-time"
                  className="text-sm"
                  style={{
                    whiteSpace: 'nowrap',
                    fontFamily: 'var(--mono)',
                    fontVariantNumeric: 'tabular-nums',
                    color: 'var(--bar-fg)',
                  }}
                >
                  {mmss(time)} / {mmss(duration)}
                </span>
                <div style={{ display: 'flex', gap: 8 }}>
                  <Button
                    type="button"
                    data-testid="present-prev-beat"
                    onClick={() => toBeat(-1)}
                    title="Previous beat"
                    aria-label="Previous beat"
                    variant="secondary"
                    size="icon"
                    className="size-8"
                  >
                    <PrevBeatIcon />
                  </Button>
                  <Button
                    type="button"
                    data-testid="present-play"
                    onClick={toggle}
                    aria-label={playing ? 'Pause' : 'Play'}
                    variant="secondary"
                    size="icon"
                    className="size-8"
                  >
                    {playing ? <PauseIcon /> : <PlayIcon />}
                  </Button>
                  <Button
                    type="button"
                    data-testid="present-next-beat"
                    onClick={() => toBeat(1)}
                    title="Next beat"
                    aria-label="Next beat"
                    variant="secondary"
                    size="icon"
                    className="size-8"
                  >
                    <NextBeatIcon />
                  </Button>
                </div>
              </div>
              {/* No captions checkbox here: the caption layers and their
                  remembered `captionsOn` state stay, but the control comes
                  back on this bar in the captions pass, once there is a
                  place for it that isn't the transport row. */}
              <div style={{ position: 'relative', flex: 1, minWidth: 0 }}>
                {labelsRow}
                {timelineBar}
              </div>
              {/* The way out, where the host gave us one: the same square as
                  the three on the left, in the app's destructive colour, at
                  the far right of the bar and on the buttons row's own
                  baseline (the row is `flex-end`, and this is a bare button
                  rather than a column, so it lands there by itself). */}
              {onLeave && (
                <Button
                  type="button"
                  data-testid="present-leave"
                  onClick={beginLeave}
                  disabled={leaving}
                  title="Leave presentation"
                  aria-label="Leave presentation"
                  variant="destructive"
                  size="icon"
                  className="size-8"
                >
                  <LeaveIcon />
                </Button>
              )}
            </div>
          </div>
          );
          })()}

          {/* What is left of the old control row: the authoring affordances,
              which stay exactly as they were. Play, the clock and the beat
              buttons moved up onto the timeline's own row. */}
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            {authoring && (
            <button type="button" data-testid="present-note" onClick={() => setNoting(true)} style={buttonStyle}>
              Note (N)
            </button>
            )}
            {/* Captions default off here - the line/action readout above
                already says what's being spoken - but the same component the
                shipped transport shows is available behind this toggle. */}
            {authoring && (
            <button
              type="button"
              data-testid="present-captions-toggle"
              onClick={() => setCaptionsOn((v) => !v)}
              title="Toggle the caption shown above the bar"
              aria-pressed={captionsOn}
              style={captionsOn ? { ...buttonStyle, color: '#111', background: '#f5a623', borderColor: '#f5a623' } : buttonStyle}
            >
              Captions
            </button>
            )}
            <FrameControls frames={frames} button={buttonStyle} />
            {noting && (
              <input
                ref={noteInputRef}
                data-testid="present-note-input"
                placeholder={`note at ${mmss(time)} — Enter saves, Esc cancels`}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const text = e.currentTarget.value.trim();
                    if (text) addNote(text);
                    setNoting(false);
                  } else if (e.key === 'Escape') {
                    setNoting(false);
                  }
                  e.stopPropagation();
                }}
                style={{
                  flex: 1,
                  background: '#111',
                  color: '#fff',
                  border: '1px solid #f5a623',
                  padding: '3px 6px',
                  font: 'inherit',
                }}
              />
            )}
            {shrunk && !noting && (
              <span style={{ flex: 1, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {line ? `${line.beat}.${line.line}  ${line.text}` : '—'}
              </span>
            )}
            {authoring && (
            <span style={{ marginLeft: 'auto', color: '#888', whiteSpace: 'nowrap' }}>
              {shrunk ? '' : `present:${name}${planMode ? ' · clock=plan (no audio)' : ''} · Space play/pause · N note · C collapse`}
              {notesError ? `  · ${notesError}` : ''}
            </span>
            )}
            {authoring && (
            <button
              type="button"
              data-testid="present-collapse"
              onClick={() => setCollapsed((v) => !v)}
              title={shrunk ? 'Expand (C)' : 'Collapse (C)'}
              style={{ ...buttonStyle, padding: '2px 6px' }}
            >
              {shrunk ? '▴' : '▾'}
            </button>
            )}
            {/* The notes actions, at the row's far right: their own small
                group so they read apart from the transport and framing
                controls to their left. `marginLeft: auto` is enough in a
                flex row - it eats the row's remaining space and pushes the
                group (and nothing after it, since it is last) flush right. */}
            {authoring && (
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginLeft: 'auto' }}>
              <button type="button" onClick={copyNotes} style={buttonStyle} disabled={!notes.length}>
                {copied ? 'Copied' : 'Copy as markdown'}
              </button>
              <button
                type="button"
                data-testid="present-clear"
                onClick={clearNotes}
                onBlur={() => setClearArmed(false)}
                title={clearArmed ? 'Click again to clear every note' : 'Clear notes'}
                style={clearArmed ? { ...buttonStyle, color: '#fff', background: '#a12d2d', borderColor: '#d64545' } : buttonStyle}
                disabled={!notes.length}
              >
                {clearArmed ? 'Sure?' : 'Clear notes'}
              </button>
            </div>
            )}
          </div>

          {authoring && !shrunk && notes.length > 0 && (
            <ul
              ref={notesListRef}
              data-testid="present-notes"
              onWheel={onNotesListInteraction}
              onScroll={onNotesListInteraction}
              style={{ listStyle: 'none', margin: '6px 0 0', padding: 0, maxHeight: 96, overflowY: 'auto' }}
            >
              {notes.map((n, i) => {
                const isHighlighted = highlightedNotes.has(i);
                return (
                <li
                  key={i}
                  ref={(el) => {
                    if (el) noteRowRefs.current.set(i, el);
                    else noteRowRefs.current.delete(i);
                  }}
                  data-testid="present-note-row"
                  data-highlighted={isHighlighted ? 'true' : undefined}
                  style={{
                    display: 'flex',
                    gap: 8,
                    alignItems: 'baseline',
                    padding: '1px 0',
                    background: isHighlighted ? 'rgba(127,212,255,0.16)' : 'transparent',
                  }}
                >
                  <button
                    type="button"
                    onClick={() => seek(n.t)}
                    style={{ ...buttonStyle, padding: '0 4px', color: '#f5a623' }}
                  >
                    {mmss(n.t)}
                  </button>
                  <span style={{ color: '#888' }}>{n.beat ?? '?'}.{n.line ?? '?'}</span>
                  <span style={{ flex: 1, color: isHighlighted ? '#eaf6ff' : undefined }}>{n.text}</span>
                  <button type="button" onClick={() => removeNote(n)} style={{ ...buttonStyle, padding: '0 4px' }} title="delete">
                    x
                  </button>
                </li>
                );
              })}
            </ul>
          )}
        </div>,
        document.body,
      )}
      {shielded && createPortal(
        /*
         * The layer itself: transparent, and it paints nothing until there is
         * an offer to paint. `pointer-events: none` for the reason in the
         * lock above - the cut has to be able to find the app under here -
         * and `aria-hidden` because there is nothing on it to read.
         *
         * z-52 is the one gap in the stack that fits: it clears everything
         * the app puts up (the plugin banner at 40, the About and Settings
         * panels at 50) and sits under everything the walkthrough puts up -
         * the camera panel at 55, the ghost cursor at 60, the runner's own
         * overlay at 70 and the transport bar at 80 - so the offer never
         * lands on top of the picture the audience is being shown.
         */
        <div
          data-testid="present-shield"
          aria-hidden="true"
          style={{ position: 'fixed', inset: 0, zIndex: 52, pointerEvents: 'none' }}
        >
          {offerOpen && (
            <div
              ref={offerRef}
              data-testid="present-offer"
              data-present-chrome=""
              role="dialog"
              aria-modal="true"
              aria-labelledby="present-offer-title"
              // The About panel's card, so the two questions the app ever asks
              // a visitor look like the same app asking them: bg-card, the
              // 2xl radius and shadow, the `speaks` hairline, the app's sans.
              // Narrower than About's 560px - one line of question, not a
              // title and an invitation.
              className={
                `present-offer${offerIn ? ' present-offer-in' : ''} speaks ` +
                'w-[min(92vw,480px)] rounded-2xl bg-card px-8 pt-9 pb-8 text-center text-card-foreground shadow-2xl outline-none'
              }
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                pointerEvents: 'auto',
                userSelect: 'none',
              }}
            >
              <p id="present-offer-title" className="text-2xl font-semibold">Leave the presentation?</p>
              {/* About's buttons: size 2xl, full width, two to a row. Leave
                  wears the bar's X - the destructive variant and the same
                  glyph - so the way out reads as one control wherever it is
                  offered; Keep watching takes the secondary style the way Demo
                  and Presentation do. */}
              <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2">
                {/* The same `beginLeave` the bar's X calls, so the slide out
                    and the hand-back to the host are one path, not two. */}
                <Button
                  type="button"
                  data-testid="present-offer-leave"
                  onClick={beginLeave}
                  disabled={leaving}
                  variant="destructive"
                  size="2xl"
                  className="w-full"
                >
                  <LeaveIcon />
                  Leave
                </Button>
                {/* Nothing is paused to ask the question, so nothing is
                    resumed by answering it: the cut has kept playing behind
                    the dialog the whole time. */}
                <Button
                  type="button"
                  data-testid="present-offer-stay"
                  onClick={closeOffer}
                  variant="secondary"
                  size="2xl"
                  className="w-full"
                >
                  Keep watching
                </Button>
              </div>
            </div>
          )}
        </div>,
        document.body,
      )}
      {authoring && editing !== null && createPortal(
        <ClipEditor
          // Keyed on the cut, not the line: the editor walks between lines
          // itself now, with prev/next and the follow toggle, and a remount
          // per line would throw its audio context away every time.
          key={name}
          name={name}
          id={editing}
          lines={lines}
          now={nowMaster}
          onIdChange={setEditing}
          onClose={() => setEditing(null)}
          onApplied={onApplied}
        />,
        document.body,
      )}
    </>
  );
}

const buttonStyle: CSSProperties = {
  background: '#333',
  color: '#eee',
  border: '1px solid #555',
  borderRadius: 3,
  padding: '2px 8px',
  font: 'inherit',
  cursor: 'pointer',
};
