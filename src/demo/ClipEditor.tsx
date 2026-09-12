/**
 * The clip editor: one spoken line's audio, with its in and out points and the
 * silence before it.
 *
 * Double-clicking a line on presentation mode's timeline opens this. It is a
 * dev tool for one job — hearing a join and seeing why it sounds wrong — so it
 * shows the clip's own waveform rather than the assembled track: the assembled
 * track cannot tell you that a consonant is on the wrong side of a boundary,
 * and the clip can.
 *
 * Everything it reads and writes goes through the dev server's `/__clip/`
 * middleware (vite.config.js): the split's record of the clip, the placement
 * entry, the trim the last join actually used, and the clip's WAV, which is
 * decoded here so dragging a handle costs no round trip. Apply writes the
 * placement entry back and runs join, retime and the copy into public/scripts.
 *
 * The scale is the same across all three panels — the previous line's tail, the
 * clip, the next line's head — so the gaps either side read as widths.
 */

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';

/** Clip-local seconds. The frame `lineStart`, `lineEnd` and `words` are in. */
interface ClipTrim { start: number; end: number }

interface ClipWord { text: string; start: number; end: number }

/** A placement entry, as `cut-NN-placement.json` holds it. */
interface PlacementEntry {
  id: string;
  text?: string;
  gap: number;
  trim?: { start?: number; end?: number };
  cuts?: [number, number][];
  noAutoTrim?: boolean;
  note?: string;
}

/** What the last join actually did to this clip (`cut-NN-effective.json`). */
interface ClipEffective {
  id: string;
  full: number;
  gap: number;
  trim: ClipTrim;
  cuts: [number, number][];
  explicitEnd: boolean;
  noAutoTrim: boolean;
  autoTrimmed: number | null;
  clipStart: number;
  dur: number;
}

interface ClipNeighbour {
  id: string;
  text: string;
  full: number;
  trim: ClipTrim | null;
  gap: number | null;
  audio: string;
}

interface ClipDoc {
  name: string;
  id: string;
  beat: number;
  line: number;
  text: string;
  file: string;
  full: number;
  lineStart: number;
  lineEnd: number;
  words: ClipWord[];
  audio: string;
  placement: PlacementEntry | null;
  effective: ClipEffective | null;
  prev: ClipNeighbour | null;
  next: ClipNeighbour | null;
}

export interface ClipEditorProps {
  name: string;
  /** Line id, `beat.line`. */
  id: string;
  onClose: () => void;
  /** Called after a successful apply, so the transport can reload the cut. */
  onApplied: () => void;
}

const MAIN_W = 720, SIDE_W = 110, WAVE_H = 116;
/** The arrow-key step, and the gap steppers. A tenth of a frame is plenty. */
const NUDGE = 0.01;
/** How much of the trimmed region each preview plays at a join. */
const JOIN_TASTE = 0.9;

const s3 = (x: number) => x.toFixed(3);

/** One min/max pair per pixel column of a span of the buffer. */
function peaks(buf: AudioBuffer, from: number, to: number, columns: number) {
  const ch = buf.getChannelData(0);
  const a = Math.max(0, Math.round(from * buf.sampleRate));
  const b = Math.min(ch.length, Math.round(to * buf.sampleRate));
  const per = Math.max(1, (b - a) / columns);
  const out: [number, number][] = [];
  for (let c = 0; c < columns; c += 1) {
    const s = a + Math.floor(c * per);
    const e = Math.min(b, a + Math.floor((c + 1) * per));
    let lo = 0, hi = 0;
    for (let i = s; i < e; i += 1) {
      const v = ch[i];
      if (v < lo) lo = v;
      if (v > hi) hi = v;
    }
    out.push([lo, hi]);
  }
  return out;
}

/**
 * Draw a span of a buffer into a canvas. `strong` is the audio that plays;
 * anything outside the kept region, and a neighbour, is drawn faint, because
 * the point of showing it is the shape of the join and not its level.
 */
function drawWave(
  canvas: HTMLCanvasElement,
  buf: AudioBuffer,
  from: number,
  to: number,
  keep: [number, number][],
) {
  const dpr = window.devicePixelRatio || 1;
  const w = canvas.clientWidth, h = canvas.clientHeight;
  canvas.width = Math.round(w * dpr);
  canvas.height = Math.round(h * dpr);
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.scale(dpr, dpr);
  ctx.clearRect(0, 0, w, h);
  const mid = h / 2;
  ctx.strokeStyle = '#3a3a44';
  ctx.beginPath();
  ctx.moveTo(0, mid);
  ctx.lineTo(w, mid);
  ctx.stroke();
  const cols = peaks(buf, from, to, Math.max(1, Math.round(w)));
  const perSec = w / Math.max(0.001, to - from);
  const strong = (x: number) => {
    const t = from + x / perSec;
    return keep.some(([a, b]) => t >= a && t <= b);
  };
  cols.forEach(([lo, hi], x) => {
    ctx.strokeStyle = strong(x) ? '#7dff9a' : 'rgba(125,255,154,0.22)';
    ctx.beginPath();
    ctx.moveTo(x + 0.5, mid - hi * (h / 2 - 2));
    ctx.lineTo(x + 0.5, mid - lo * (h / 2 - 2));
    ctx.stroke();
  });
}

export default function ClipEditor({ name, id, onClose, onApplied }: ClipEditorProps) {
  const [doc, setDoc] = useState<ClipDoc | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [buf, setBuf] = useState<AudioBuffer | null>(null);
  const [prevBuf, setPrevBuf] = useState<AudioBuffer | null>(null);
  const [nextBuf, setNextBuf] = useState<AudioBuffer | null>(null);
  const [trimStart, setTrimStart] = useState(0);
  const [trimEnd, setTrimEnd] = useState(0);
  const [gap, setGap] = useState(0);
  const [cuts, setCuts] = useState<[number, number][]>([]);
  // The tail is either the user's number or the auto-trim's. Moving the OUT
  // handle pins it, which is the rule the join already follows; unpinning hands
  // the tail back to the measured end of the speech.
  const [pinTail, setPinTail] = useState(false);
  const [applying, setApplying] = useState(false);
  const [log, setLog] = useState<string | null>(null);
  const mainRef = useRef<HTMLCanvasElement | null>(null);
  const prevRef = useRef<HTMLCanvasElement | null>(null);
  const nextRef = useRef<HTMLCanvasElement | null>(null);
  const audioCtx = useRef<AudioContext | null>(null);
  const playing = useRef<AudioBufferSourceNode[]>([]);

  /*
   * The clip: its record, and the WAVs for it and its two neighbours. Nothing
   * is reset here because the editor is keyed on the line id and a different
   * line is a different instance - see PresentationMode.
   */
  useEffect(() => {
    let live = true;
    const ctx = audioCtx.current ?? new AudioContext();
    audioCtx.current = ctx;
    const decode = (url: string) => fetch(url)
      .then((r) => {
        if (!r.ok) throw new Error(`${url}: ${r.status} ${r.statusText}`);
        return r.arrayBuffer();
      })
      .then((b) => ctx.decodeAudioData(b));
    fetch(`/__clip/${name}/${id}`)
      .then((r) => r.json() as Promise<ClipDoc & { error?: string }>)
      .then((d) => {
        if (!live) return;
        if (d.error) throw new Error(d.error);
        setDoc(d);
        const eff = d.effective;
        setTrimStart(eff?.trim.start ?? d.placement?.trim?.start ?? 0);
        setTrimEnd(eff?.trim.end ?? d.full);
        setGap(d.placement?.gap ?? 0);
        setCuts(eff?.cuts ?? d.placement?.cuts ?? []);
        setPinTail(!!eff?.explicitEnd || d.placement?.trim?.end !== undefined);
        decode(d.audio).then((b) => { if (live) setBuf(b); }).catch((e: unknown) => { if (live) setError(String(e)); });
        if (d.prev) decode(d.prev.audio).then((b) => { if (live) setPrevBuf(b); }).catch(() => { /* the edge is just blank */ });
        if (d.next) decode(d.next.audio).then((b) => { if (live) setNextBuf(b); }).catch(() => { /* likewise */ });
      })
      .catch((e: unknown) => { if (live) setError(e instanceof Error ? e.message : String(e)); });
    return () => { live = false; };
  }, [name, id]);

  const full = doc?.full ?? 1;
  const perSec = MAIN_W / Math.max(0.001, full);
  const sideSpan = SIDE_W / perSec;

  /** The spans of the clip that play: [in, out] with every cut taken out. */
  const keep = useMemo<[number, number][]>(() => {
    let k: [number, number][] = [[trimStart, trimEnd]];
    for (const [a, b] of cuts) {
      k = k.flatMap(([x, y]) => (b <= x || a >= y
        ? [[x, y] as [number, number]]
        : ([[x, Math.min(y, a)], [Math.max(x, b), y]] as [number, number][])))
        .filter(([x, y]) => y - x > 0.001);
    }
    return k;
  }, [trimStart, trimEnd, cuts]);

  useEffect(() => {
    if (mainRef.current && buf) drawWave(mainRef.current, buf, 0, full, keep);
  }, [buf, full, keep]);
  useEffect(() => {
    const c = prevRef.current;
    if (!c || !prevBuf || !doc?.prev) return;
    const end = doc.prev.trim?.end ?? prevBuf.duration;
    drawWave(c, prevBuf, Math.max(0, end - sideSpan), end, [[-1e9, 1e9]]);
  }, [prevBuf, doc, sideSpan]);
  useEffect(() => {
    const c = nextRef.current;
    if (!c || !nextBuf || !doc?.next) return;
    const start = doc.next.trim?.start ?? 0;
    drawWave(c, nextBuf, start, start + sideSpan, [[-1e9, 1e9]]);
  }, [nextBuf, doc, sideSpan]);

  /* Playback: every preview stops whatever the last one started. */
  const stop = useCallback(() => {
    for (const s of playing.current) { try { s.stop(); } catch { /* already done */ } }
    playing.current = [];
  }, []);
  useEffect(() => stop, [stop]);

  const play = useCallback((parts: { buf: AudioBuffer; offset: number; dur: number; at: number }[]) => {
    const ctx = audioCtx.current;
    if (!ctx) return;
    stop();
    void ctx.resume();
    const t0 = ctx.currentTime + 0.06;
    for (const p of parts) {
      if (!(p.dur > 0.005)) continue;
      const src = ctx.createBufferSource();
      src.buffer = p.buf;
      src.connect(ctx.destination);
      src.start(t0 + p.at, Math.max(0, p.offset), p.dur);
      playing.current.push(src);
    }
  }, [stop]);

  /** The trimmed clip, cuts and all: what this line will sound like. */
  const playClip = useCallback(() => {
    if (!buf) return;
    let at = 0;
    play(keep.map(([a, b]) => {
      const part = { buf, offset: a, dur: b - a, at };
      at += b - a;
      return part;
    }));
  }, [buf, keep, play]);

  /** The join into this line: the tail before it, the silence, and its head. */
  const playHead = useCallback(() => {
    if (!buf) return;
    const parts: { buf: AudioBuffer; offset: number; dur: number; at: number }[] = [];
    let at = 0;
    if (prevBuf && doc?.prev) {
      const end = doc.prev.trim?.end ?? prevBuf.duration;
      const from = Math.max(doc.prev.trim?.start ?? 0, end - JOIN_TASTE);
      parts.push({ buf: prevBuf, offset: from, dur: end - from, at });
      at += end - from + gap;
    }
    parts.push({ buf, offset: trimStart, dur: Math.min(JOIN_TASTE, trimEnd - trimStart), at });
    play(parts);
  }, [buf, prevBuf, doc, gap, trimStart, trimEnd, play]);

  /** The join out of this line, so the OUT handle can be heard in place. */
  const playTail = useCallback(() => {
    if (!buf) return;
    const parts: { buf: AudioBuffer; offset: number; dur: number; at: number }[] = [];
    const from = Math.max(trimStart, trimEnd - JOIN_TASTE);
    parts.push({ buf, offset: from, dur: trimEnd - from, at: 0 });
    if (nextBuf && doc?.next) {
      const start = doc.next.trim?.start ?? 0;
      parts.push({
        buf: nextBuf, offset: start, dur: JOIN_TASTE,
        at: trimEnd - from + (doc.next.gap ?? 0),
      });
    }
    play(parts);
  }, [buf, nextBuf, doc, trimStart, trimEnd, play]);

  /* Dragging a handle. Clip-local seconds from the pointer's x. */
  const drag = (which: 'in' | 'out') => (e: React.PointerEvent<HTMLDivElement>) => {
    const canvas = mainRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    e.currentTarget.setPointerCapture(e.pointerId);
    const move = (ev: PointerEvent) => {
      const t = Math.max(0, Math.min(full, ((ev.clientX - rect.left) / rect.width) * full));
      if (which === 'in') setTrimStart(Math.min(t, trimEnd - 0.02));
      else { setTrimEnd(Math.max(t, trimStart + 0.02)); setPinTail(true); }
    };
    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };

  const nudge = (which: 'in' | 'out', by: number) => {
    if (which === 'in') setTrimStart((v) => Math.max(0, Math.min(trimEnd - 0.02, +(v + by).toFixed(3))));
    else { setTrimEnd((v) => Math.max(trimStart + 0.02, Math.min(full, +(v + by).toFixed(3)))); setPinTail(true); }
  };
  const onHandleKey = (which: 'in' | 'out') => (e: React.KeyboardEvent) => {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    e.preventDefault();
    e.stopPropagation();
    nudge(which, e.key === 'ArrowLeft' ? -NUDGE : NUDGE);
  };

  const apply = () => {
    if (!doc) return;
    setApplying(true);
    setLog('joining…');
    const eff = doc.effective;
    const movedIn = !eff || Math.abs(trimStart - eff.trim.start) > 0.0005;
    const movedOut = !eff || Math.abs(trimEnd - eff.trim.end) > 0.0005;
    const body: { gap: number; trim?: { start: number; end: number | null }; cuts: [number, number][] } = {
      gap: +gap.toFixed(3),
      cuts,
    };
    if (movedIn || movedOut || pinTail !== !!eff?.explicitEnd) {
      body.trim = { start: +trimStart.toFixed(3), end: pinTail ? +trimEnd.toFixed(3) : null };
    }
    fetch(`/__clip/${name}/${id}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    })
      .then((r) => r.json() as Promise<{ ok?: boolean; log?: string; error?: string }>)
      .then((r) => {
        setLog(r.error ? `failed: ${r.error}` : (r.log ?? ''));
        if (r.ok) onApplied();
      })
      .catch((e: unknown) => setLog(`failed: ${e instanceof Error ? e.message : String(e)}`))
      .finally(() => setApplying(false));
  };

  /* Esc closes, and no key reaches the transport underneath. */
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') { e.stopPropagation(); onClose(); }
    else e.stopPropagation();
  };

  const eff = doc?.effective;
  const words = doc?.words ?? [];
  const kept = keep.reduce((n, [a, b]) => n + (b - a), 0);

  return (
    <div
      data-testid="clip-editor"
      onKeyDown={onKeyDown}
      role="dialog"
      aria-label={`clip ${id}`}
      tabIndex={-1}
      style={{
        position: 'fixed',
        left: '50%',
        top: 24,
        transform: 'translateX(-50%)',
        zIndex: 90,
        width: MAIN_W + 2 * SIDE_W + 48,
        maxWidth: 'calc(100vw - 24px)',
        background: '#15151a',
        color: '#e6e6e6',
        font: '12px/1.5 ui-monospace, Consolas, monospace',
        border: '2px solid #f5a623',
        borderRadius: 6,
        boxShadow: '0 12px 40px rgba(0,0,0,0.6)',
        padding: 14,
      }}
    >
      <div style={{ display: 'flex', gap: 10, alignItems: 'baseline' }}>
        <strong style={{ color: '#f5a623' }}>{id}</strong>
        <span style={{ flex: 1, color: '#fff', fontSize: 13 }}>{doc?.text ?? '…'}</span>
        <button type="button" data-testid="clip-editor-close" onClick={onClose} style={btn}>
          Close (Esc)
        </button>
      </div>

      {error && <div style={{ color: '#ff8f8f', paddingTop: 8 }}>{error}</div>}

      {doc && (
        <>
          <div style={{ color: '#888', paddingTop: 4 }}>
            {doc.file} · {s3(full)} s · first word at {s3(doc.lineStart)}
            {eff?.autoTrimmed ? ` · auto tail trim took ${s3(eff.autoTrimmed)} s off` : ''}
            {eff?.noAutoTrim ? ' · noAutoTrim' : ''}
          </div>

          <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', paddingTop: 10 }}>
            <div style={{ width: SIDE_W }}>
              <div style={label}>{doc.prev ? `${doc.prev.id} tail` : 'no line before'}</div>
              <canvas ref={prevRef} style={{ ...side, width: SIDE_W }} />
            </div>

            <div style={{ position: 'relative', width: MAIN_W }}>
              <div style={label}>gap before: {s3(gap)} s</div>
              <canvas
                ref={mainRef}
                data-testid="clip-editor-wave"
                style={{ width: MAIN_W, height: WAVE_H, display: 'block', background: '#101014', borderRadius: 3 }}
              />
              {/* The kept region, and the two handles over it. */}
              <div style={{ ...shade, left: 0, width: trimStart * perSec }} />
              <div style={{ ...shade, left: trimEnd * perSec, width: Math.max(0, (full - trimEnd) * perSec) }} />
              {cuts.map(([a, b], i) => (
                <div key={`cut-${i}`} style={{ ...shade, left: a * perSec, width: (b - a) * perSec, background: 'rgba(255,110,110,0.30)' }} />
              ))}
              <div
                data-testid="clip-editor-in"
                role="slider"
                aria-label="in point"
                aria-valuenow={trimStart}
                tabIndex={0}
                onPointerDown={drag('in')}
                onKeyDown={onHandleKey('in')}
                title="IN — drag, or arrow keys for 10 ms"
                style={{ ...handle, left: trimStart * perSec }}
              />
              <div
                data-testid="clip-editor-out"
                role="slider"
                aria-label="out point"
                aria-valuenow={trimEnd}
                tabIndex={0}
                onPointerDown={drag('out')}
                onKeyDown={onHandleKey('out')}
                title="OUT — drag, or arrow keys for 10 ms"
                style={{ ...handle, left: trimEnd * perSec, background: '#ff9d4d' }}
              />
              {/* The aligner's word times, as ticks under the waveform. */}
              <div style={{ position: 'relative', height: 22, marginTop: 2 }}>
                {words.map((w, i) => (
                  <div
                    key={`w-${i}`}
                    title={`${w.text} ${s3(w.start)}–${s3(w.end)}`}
                    style={{
                      position: 'absolute',
                      left: w.start * perSec,
                      top: 0,
                      borderLeft: '1px solid #6f8fd0',
                      paddingLeft: 2,
                      height: 20,
                      fontSize: 9,
                      color: '#8fa8d8',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      maxWidth: Math.max(14, (w.end - w.start) * perSec + 22),
                    }}
                  >
                    {w.text}
                  </div>
                ))}
              </div>
            </div>

            <div style={{ width: SIDE_W }}>
              <div style={label}>{doc.next ? `${doc.next.id} head` : 'no line after'}</div>
              <canvas ref={nextRef} style={{ ...side, width: SIDE_W }} />
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', paddingTop: 10 }}>
            <span>
              IN <input
                data-testid="clip-editor-in-value"
                type="number"
                step={NUDGE}
                value={trimStart}
                onChange={(e) => setTrimStart(Math.max(0, Math.min(trimEnd - 0.02, Number(e.currentTarget.value))))}
                style={num}
              />
            </span>
            <span>
              OUT <input
                data-testid="clip-editor-out-value"
                type="number"
                step={NUDGE}
                value={trimEnd}
                onChange={(e) => {
                  setTrimEnd(Math.max(trimStart + 0.02, Math.min(full, Number(e.currentTarget.value))));
                  setPinTail(true);
                }}
                style={num}
              />
            </span>
            <span style={{ color: '#888' }}>plays {s3(kept)} s</span>
            <label style={{ display: 'flex', gap: 4, alignItems: 'center', color: pinTail ? '#f5a623' : '#888' }}>
              <input type="checkbox" checked={pinTail} onChange={(e) => setPinTail(e.currentTarget.checked)} />
              pin the tail
            </label>
            <span style={{ marginLeft: 'auto' }}>
              GAP
              <button type="button" onClick={() => setGap((v) => Math.max(0, +(v - NUDGE).toFixed(3)))} style={{ ...btn, marginLeft: 6 }}>−</button>
              <input
                data-testid="clip-editor-gap"
                type="number"
                step={NUDGE}
                min={0}
                value={gap}
                onChange={(e) => setGap(Math.max(0, Number(e.currentTarget.value)))}
                style={num}
              />
              <button type="button" onClick={() => setGap((v) => +(v + NUDGE).toFixed(3))} style={btn}>+</button>
            </span>
          </div>

          {cuts.length > 0 && (
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', paddingTop: 6, color: '#ff9d9d' }}>
              cuts:
              {cuts.map(([a, b], i) => (
                <span key={`cl-${i}`} style={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                  {s3(a)}–{s3(b)}
                  <button
                    type="button"
                    title="drop this cut"
                    onClick={() => setCuts(cuts.filter((_, k) => k !== i))}
                    style={{ ...btn, padding: '0 4px' }}
                  >
                    x
                  </button>
                </span>
              ))}
            </div>
          )}

          <div style={{ display: 'flex', gap: 8, alignItems: 'center', paddingTop: 8 }}>
            <button type="button" data-testid="clip-editor-play" onClick={playClip} style={btn} disabled={!buf}>
              Play line
            </button>
            <button type="button" onClick={playHead} style={btn} disabled={!buf}>
              Play the join in
            </button>
            <button type="button" onClick={playTail} style={btn} disabled={!buf}>
              Play the join out
            </button>
            <button type="button" onClick={stop} style={btn}>Stop</button>
            <button
              type="button"
              data-testid="clip-editor-apply"
              onClick={apply}
              disabled={applying}
              style={{ ...btn, background: '#2f6f3f', borderColor: '#4f9f5f', color: '#fff' }}
            >
              {applying ? 'Joining…' : 'Apply'}
            </button>
            {doc.placement?.note && (
              <span style={{ flex: 1, color: '#888', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                title={doc.placement.note}
              >
                {doc.placement.note}
              </span>
            )}
          </div>

          {log !== null && (
            <pre
              data-testid="clip-editor-log"
              style={{
                margin: '8px 0 0',
                maxHeight: 140,
                overflow: 'auto',
                background: '#0c0c10',
                border: '1px solid #333',
                borderRadius: 3,
                padding: 6,
                color: log.startsWith('failed') ? '#ff8f8f' : '#9fd0ff',
                whiteSpace: 'pre-wrap',
              }}
            >
              {log}
            </pre>
          )}
        </>
      )}
    </div>
  );
}

const btn: CSSProperties = {
  background: '#333',
  color: '#eee',
  border: '1px solid #555',
  borderRadius: 3,
  padding: '2px 8px',
  font: 'inherit',
  cursor: 'pointer',
};
const num: CSSProperties = {
  width: 72,
  background: '#111',
  color: '#fff',
  border: '1px solid #555',
  font: 'inherit',
  padding: '1px 4px',
  margin: '0 4px',
};
const label: CSSProperties = { color: '#888', fontSize: 10, height: 14 };
const side: CSSProperties = { height: WAVE_H, display: 'block', background: '#0c0c10', borderRadius: 3, opacity: 0.65 };
const shade: CSSProperties = {
  position: 'absolute',
  top: 14,
  height: WAVE_H,
  background: 'rgba(10,10,14,0.62)',
  pointerEvents: 'none',
};
const handle: CSSProperties = {
  position: 'absolute',
  top: 14,
  height: WAVE_H,
  width: 9,
  marginLeft: -4,
  background: '#f5a623',
  opacity: 0.9,
  cursor: 'ew-resize',
  borderRadius: 2,
};
