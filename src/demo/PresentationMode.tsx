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
}

/** Read the URL once: the presentation name, in dev builds only. */
export function presentName(): string | null {
  if (!import.meta.env.DEV) return null;
  try {
    const raw = new URLSearchParams(window.location.search).get('present');
    return raw && /^[\w-]+$/.test(raw) ? raw : null;
  } catch {
    return null;
  }
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

export default function PresentationMode({ name, host, onDemo, onColor, demoOpen }: PresentationModeProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timelineRef = useRef<HTMLDivElement | null>(null);
  const handleRef = useRef<ScriptRunnerHandle | null>(null);
  const noteInputRef = useRef<HTMLInputElement | null>(null);
  const [script, setScript] = useState<Script | null>(null);
  const [lines, setLines] = useState<ScriptLine[]>([]);
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
    fetch(`${base}-lines.json${bust}`)
      .then((res) => (res.ok ? (res.json() as Promise<{ lines?: ScriptLine[] }>) : null))
      .then((data) => {
        if (live && data && Array.isArray(data.lines)) {
          setLines([...data.lines].sort((a, b) => a.start - b.start));
        }
      })
      .catch(() => { /* No lines file: the timeline just has no spans. */ });
    fetch(notesUrl(name))
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
  }, [name, rebuilt]);

  /* The clock: the audio element's position, read on every frame. */
  useEffect(() => {
    let raf = 0;
    const frame = () => {
      const a = audioRef.current;
      if (a) {
        setTime(a.currentTime);
        if (a.duration && Number.isFinite(a.duration)) setDuration(a.duration);
        setPlaying(!a.paused && !a.ended);
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, []);

  const clock = useMemo<ScriptClock>(() => ({
    now: () => audioRef.current?.currentTime ?? 0,
    running: () => {
      const a = audioRef.current;
      return !!a && !a.paused && !a.ended;
    },
  }), []);
  const onHandle = useCallback((h: ScriptRunnerHandle | null) => { handleRef.current = h; }, []);

  const seek = useCallback((t: number) => {
    const a = audioRef.current;
    if (!a) return;
    const clamped = Math.max(0, Math.min(t, a.duration || t));
    a.currentTime = clamped;
    setTime(clamped);
    handleRef.current?.seek(clamped);
  }, []);

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
    const a = audioRef.current;
    if (!a) return;
    if (a.paused) a.play().catch((err: unknown) => console.warn('[present] audio did not start', err));
    else a.pause();
  }, []);

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
      } else if (e.key === 'n' || e.key === 'N') {
        e.preventDefault();
        e.stopPropagation();
        setNoting(true);
      } else if (e.key === 'c' || e.key === 'C') {
        e.preventDefault();
        e.stopPropagation();
        setCollapsed((v) => !v);
      }
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [toggle, editing]);

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
            padding: collapsed ? '4px 12px' : '6px 12px 8px',
            userSelect: 'none',
          }}
        >
          <audio
            ref={audioRef}
            src={rebuilt ? `${scriptAudioUrl(name)}?v=${rebuilt}` : scriptAudioUrl(name)}
            preload="auto"
            data-testid="present-audio"
          />

          <div style={{ display: collapsed ? 'none' : 'flex', gap: 16, alignItems: 'baseline', minHeight: 18 }}>
            <span data-testid="present-line" style={{ flex: 1, color: '#fff', fontSize: 13 }}>
              {line ? `${line.beat}.${line.line}  ${line.text}` : '—'}
            </span>
            <span data-testid="present-action" style={{ color: '#9fd0ff', whiteSpace: 'nowrap' }}>
              {current ? `now: ${describe(current)} @${current.at}` : 'now: —'}
              {demoWouldRun ? '  (demo would be running)' : ''}
              {following ? `   next: ${describe(following)} @${following.at}` : '   next: —'}
            </span>
          </div>

          <div
            ref={timelineRef}
            data-testid="present-timeline"
            onPointerDown={onTimelineDown}
            onPointerMove={onTimelineMove}
            onDoubleClick={onTimelineDouble}
            style={{
              display: collapsed ? 'none' : 'block',
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
            {lines.map((l, i) => (
              <div
                key={`line-${i}`}
                data-testid="present-line-span"
                data-line-id={`${l.beat}.${l.line}`}
                title={`${l.beat}.${l.line} ${l.text} — double-click to edit the clip`}
                style={{
                  position: 'absolute',
                  top: 4,
                  bottom: 4,
                  left: pct(l.start),
                  width: pct(Math.max(0.05, l.end - l.start)),
                  background: l === line ? 'rgba(245,166,35,0.55)' : `rgba(120,160,255,${l.beat % 2 ? 0.28 : 0.18})`,
                  borderRadius: 2,
                }}
              />
            ))}
            {actions.map((a, i) => (
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
            {notes.map((n, i) => (
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
            <button type="button" data-testid="present-note" onClick={() => setNoting(true)} style={buttonStyle}>
              Note (N)
            </button>
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
            {collapsed && !noting && (
              <span style={{ flex: 1, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {line ? `${line.beat}.${line.line}  ${line.text}` : '—'}
              </span>
            )}
            <span style={{ marginLeft: 'auto', color: '#888', whiteSpace: 'nowrap' }}>
              {collapsed ? '' : `present:${name} · Space play/pause · N note · C collapse`}
              {notesError ? `  · ${notesError}` : ''}
            </span>
            <button
              type="button"
              data-testid="present-collapse"
              onClick={() => setCollapsed((v) => !v)}
              title={collapsed ? 'Expand (C)' : 'Collapse (C)'}
              style={{ ...buttonStyle, padding: '2px 6px' }}
            >
              {collapsed ? '▴' : '▾'}
            </button>
          </div>

          {!collapsed && notes.length > 0 && (
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
      {editing !== null && createPortal(
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
