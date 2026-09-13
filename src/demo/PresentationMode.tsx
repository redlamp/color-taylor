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
 * Three props turn the same component into the shipped walkthrough. `mode`
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
 * can be synchronous with it. Which builds mount the component at all is the
 * host's business: there is no dev guard in here.
 *
 * This is a tool, not a surface of the app: the styling is deliberately not
 * the app's. See docs/demo-script.md, "Presentation mode".
 */

import {
  useCallback, useEffect, useMemo, useRef, useState,
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
}

/** How far an arrow key moves the playhead when the full transport is up. */
const SEEK_STEP = 5;

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
 * `public/scripts/<name>-plan.json` (redlamp-videos `tools/prompter/plan.mjs`)
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
  name, host, onDemo, onColor, demoOpen, voice, mode = 'dev', transport,
}: PresentationModeProps) {
  /** The authoring tool's half: notes, the clip editor, and the keys for them. */
  const authoring = mode === 'dev';
  /** The rich transport's half: line spans, cue ticks, the beat band, the
   *  line/action readout and arrow-key seeking. Independent of `authoring`. */
  const fullTransport = (transport ?? (mode === 'dev' ? 'full' : 'reduced')) === 'full';
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const voiceHostRef = useRef<HTMLSpanElement | null>(null);
  const timelineRef = useRef<HTMLDivElement | null>(null);
  const handleRef = useRef<ScriptRunnerHandle | null>(null);
  const noteInputRef = useRef<HTMLInputElement | null>(null);
  const [script, setScript] = useState<Script | null>(null);
  const [lines, setLines] = useState<ScriptLine[]>([]);
  const [beats, setBeats] = useState<PlanBeat[]>([]);
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
  const onHandle = useCallback((h: ScriptRunnerHandle | null) => { handleRef.current = h; }, []);

  const seek = useCallback((t: number) => {
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
  }, [planMode]);

  /** Arrow-key seeking: reads the live position rather than closing over
   *  `time`, so the keydown effect below does not need to churn every frame. */
  const seekBy = useCallback((delta: number) => {
    const t = planMode ? planTime() : (audioRef.current?.currentTime ?? 0);
    seek(t + delta);
  }, [planMode, planTime, seek]);

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
      } else {
        run.current = { base: planTime(), since: null };
      }
      setPlaying(run.current.since !== null);
      return;
    }
    const a = audioRef.current;
    if (!a) return;
    if (a.paused) a.play().catch((err: unknown) => console.warn('[present] audio did not start', err));
    else a.pause();
  }, [planMode, planTime]);

  /* Space plays and pauses; N opens a note. Neither while typing. */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (inTextField(e.target)) return;
      // The clip editor owns the keyboard while it is open: its handles nudge
      // with the arrow keys and Space would otherwise start the track under it.
      if (editing !== null) return;
      if (e.code === 'Space' || e.key === ' ') {
        e.preventDefault();
        e.stopPropagation();
        toggle();
      } else if (fullTransport && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) {
        e.preventDefault();
        e.stopPropagation();
        seekBy(e.key === 'ArrowRight' ? SEEK_STEP : -SEEK_STEP);
      } else if (authoring && (e.key === 'n' || e.key === 'N')) {
        e.preventDefault();
        e.stopPropagation();
        setNoting(true);
      } else if (authoring && (e.key === 'c' || e.key === 'C')) {
        e.preventDefault();
        e.stopPropagation();
        setCollapsed((v) => !v);
      }
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [toggle, editing, authoring, fullTransport, seekBy]);

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

  const pct = (t: number) => (duration ? `${(100 * t) / duration}%` : '0%');

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
      {createPortal(
        <div
          data-testid="present-transport"
          style={{
            position: 'fixed',
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 80,
            background: '#1b1b1f',
            color: '#e6e6e6',
            font: '12px/1.4 ui-monospace, Consolas, monospace',
            borderTop: '2px solid #f5a623',
            boxShadow: '0 -4px 16px rgba(0,0,0,0.4)',
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

          <div
            ref={timelineRef}
            data-testid="present-timeline"
            onPointerDown={onTimelineDown}
            onPointerMove={onTimelineMove}
            onDoubleClick={onTimelineDouble}
            style={{
              display: shrunk ? 'none' : 'block',
              position: 'relative',
              height: 28,
              margin: '6px 0',
              background: '#2a2a30',
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
            {fullTransport && notes.map((n, i) => (
              <div
                key={`note-${i}`}
                title={n.text}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: pct(n.t),
                  width: 0,
                  height: 0,
                  borderLeft: '4px solid transparent',
                  borderRight: '4px solid transparent',
                  borderTop: '6px solid #f5a623',
                  marginLeft: -4,
                }}
              />
            ))}
            <div
              data-testid="present-playhead"
              style={{
                position: 'absolute',
                top: 0,
                bottom: 0,
                left: pct(time),
                width: 2,
                marginLeft: -1,
                background: '#ffffff',
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <button type="button" data-testid="present-play" onClick={toggle} style={buttonStyle}>
              {playing ? 'Pause' : 'Play'}
            </button>
            <span data-testid="present-time" style={{ minWidth: 110 }}>
              {mmssTenths(time)} / {mmss(duration)}
            </span>
            {authoring && (
            <button type="button" data-testid="present-note" onClick={() => setNoting(true)} style={buttonStyle}>
              Note (N)
            </button>
            )}
            {authoring && (
            <button type="button" onClick={copyNotes} style={buttonStyle} disabled={!notes.length}>
              {copied ? 'Copied' : 'Copy as markdown'}
            </button>
            )}
            {authoring && (
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
            )}
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
          </div>

          {authoring && !shrunk && notes.length > 0 && (
            <ul
              data-testid="present-notes"
              style={{ listStyle: 'none', margin: '6px 0 0', padding: 0, maxHeight: 96, overflowY: 'auto' }}
            >
              {notes.map((n, i) => (
                <li key={i} style={{ display: 'flex', gap: 8, alignItems: 'baseline', padding: '1px 0' }}>
                  <button
                    type="button"
                    onClick={() => seek(n.t)}
                    style={{ ...buttonStyle, padding: '0 4px', color: '#f5a623' }}
                  >
                    {mmss(n.t)}
                  </button>
                  <span style={{ color: '#888' }}>{n.beat ?? '?'}.{n.line ?? '?'}</span>
                  <span style={{ flex: 1 }}>{n.text}</span>
                  <button type="button" onClick={() => removeNote(n)} style={{ ...buttonStyle, padding: '0 4px' }} title="delete">
                    x
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>,
        document.body,
      )}
      {authoring && editing !== null && createPortal(
        <ClipEditor
          key={`${name}:${editing}`}
          name={name}
          id={editing}
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
