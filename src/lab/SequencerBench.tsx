/**
 * Sequencer bench: the user's Saved and Recent swatches, or a built-in
 * palette, played as a two-track step sequencer - a test bench for turning
 * colour into music without touching the app.
 *
 * Mapping lives in sequencer.ts, timing and voices in sequencerEngine.ts. This
 * file only reads storage (never writes a swatch key), holds the controls and
 * paints what the audio clock says is sounding. The paint loop reads
 * `currentTime`; it never drives the audio.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Play, RefreshCw, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { hexToRgb, rgbToHex } from '../utils/colorConversions';
import {
  BUILTIN_PALETTES, NOTE_NAMES, parseRecentSlots, parseSavedSlots, swatchToStep,
  type LegacyAlpha, type ScaleName, type SeqMode, type Slot, type Subdivision,
} from './sequencer';
import { SequencerEngine, type SeqCounters, type Wave } from './sequencerEngine';

type Source = 'saved' | 'recent' | 'rainbow' | 'pulse' | 'sunset';

interface TrackCfg { source: Source; enabled: boolean; octave: number; muted: boolean }

interface Settings {
  bpm: number;
  subdivision: Subdivision;
  glideMs: number;
  gatePct: number;
  mode: SeqMode;
  scale: ScaleName;
  root: number;
  octaveRange: number;
  wave: Wave;
  tracks: [TrackCfg, TrackCfg];
}

const DEFAULTS: Settings = {
  bpm: 110,
  subdivision: 8,
  glideMs: 40,
  gatePct: 70,
  mode: 'melody',
  scale: 'pentatonic',
  root: 0,
  octaveRange: 2,
  wave: 'triangle',
  tracks: [
    { source: 'saved', enabled: true, octave: 0, muted: false },
    { source: 'pulse', enabled: false, octave: -1, muted: false },
  ],
};

/** The lab's own key. Nothing else here is ever written to storage. */
const LAB_KEY = 'color-taylor-lab-sequencer';

function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(LAB_KEY);
    if (!raw) return DEFAULTS;
    const s = JSON.parse(raw) as Partial<Settings>;
    const tracks = Array.isArray(s.tracks) && s.tracks.length === 2
      ? [{ ...DEFAULTS.tracks[0], ...s.tracks[0] }, { ...DEFAULTS.tracks[1], ...s.tracks[1] }] as [TrackCfg, TrackCfg]
      : DEFAULTS.tracks;
    return { ...DEFAULTS, ...s, tracks };
  } catch {
    return DEFAULTS;
  }
}

function readJson(key: string): unknown {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

interface Stored { saved: Slot[]; recent: Slot[] }

/** Read-only: the app owns these keys. */
function readStored(): Stored {
  const legacy = (readJson('color-taylor-alpha') ?? {}) as LegacyAlpha;
  return {
    saved: parseSavedSlots(readJson('color-taylor-saved'), legacy),
    recent: parseRecentSlots(readJson('color-taylor-recent'), legacy),
  };
}

const SOURCES = 'saved:Saved|recent:Recent|rainbow:Rainbow|pulse:Pulse|sunset:Sunset';

function slotsFor(source: Source, stored: Stored): Slot[] {
  if (source === 'saved') return stored.saved;
  if (source === 'recent') return stored.recent;
  return BUILTIN_PALETTES[source];
}

function withAlpha(hex: string, alpha: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return 'transparent';
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${Math.max(0, Math.min(100, alpha)) / 100})`;
}

function mixHex(a: string, b: string, t: number): string {
  const x = hexToRgb(a);
  const y = hexToRgb(b);
  if (!x || !y) return b;
  const m = (p: number, q: number) => Math.round(p + (q - p) * t);
  return rgbToHex(m(x.r, y.r), m(x.g, y.g), m(x.b, y.b));
}

/** A segmented control: `options` is `value:Label|value:Label`. */
function Seg({ value, options, onChange, label }: {
  value: string; options: string; onChange: (x: string) => void; label: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-base text-muted-foreground">{label}</span>
      <Tabs value={value} onValueChange={(x) => onChange(String(x))}>
        <TabsList className="h-9 w-full">
          {options.split('|').map((o) => {
            const [val, text] = o.split(':');
            return <TabsTrigger key={val} value={val} className="flex-1 text-base">{text}</TabsTrigger>;
          })}
        </TabsList>
      </Tabs>
    </div>
  );
}

function Knob({ label, value, min, max, step = 1, unit, onChange }: {
  label: string; value: number; min: number; max: number; step?: number; unit?: string; onChange: (v: number) => void;
}) {
  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex items-baseline justify-between text-base">
        <span className="text-muted-foreground">{label}</span>
        <span className="tabular-nums text-foreground">{value}{unit ?? ''}</span>
      </div>
      <Slider
        aria-label={label}
        value={[value]}
        min={min}
        max={max}
        step={step}
        onValueChange={(v) => {
          const next = Array.isArray(v) ? v[0] : v;
          if (typeof next === 'number') onChange(next);
        }}
      />
    </div>
  );
}

declare global {
  interface Window { __seq?: SeqCounters }
}

export default function SequencerBench() {
  const [settings, setSettings] = useState<Settings>(loadSettings);
  const [stored, setStored] = useState<Stored>(readStored);
  const [playing, setPlaying] = useState(false);
  const [engine] = useState(() => new SequencerEngine({
    bpm: settings.bpm, subdivision: settings.subdivision, gatePct: settings.gatePct,
    glideMs: settings.glideMs, wave: settings.wave,
  }));

  const set = useCallback(<K extends keyof Settings>(k: K, v: Settings[K]) => {
    setSettings((s) => ({ ...s, [k]: v }));
  }, []);
  const setTrack = useCallback((i: 0 | 1, patch: Partial<TrackCfg>) => {
    setSettings((s) => {
      const tracks = [...s.tracks] as [TrackCfg, TrackCfg];
      tracks[i] = { ...tracks[i], ...patch };
      return { ...s, tracks };
    });
  }, []);

  useEffect(() => {
    try { localStorage.setItem(LAB_KEY, JSON.stringify(settings)); } catch { /* private mode */ }
  }, [settings]);

  // The app may be open in another tab: its writes arrive as storage events.
  const reload = useCallback(() => setStored(readStored()), []);
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'color-taylor-saved' || e.key === 'color-taylor-recent') reload();
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [reload]);

  const steps = useMemo(() => settings.tracks.map((t) => slotsFor(t.source, stored).map((slot) => swatchToStep(slot, {
    mode: settings.mode, scale: settings.scale, root: settings.root,
    octaveRange: settings.octaveRange, octaveOffset: t.octave,
  }))), [settings.tracks, settings.mode, settings.scale, settings.root, settings.octaveRange, stored]);
  const slots = useMemo(() => settings.tracks.map((t) => slotsFor(t.source, stored)), [settings.tracks, stored]);

  useEffect(() => {
    engine.setParams({
      bpm: settings.bpm, subdivision: settings.subdivision, gatePct: settings.gatePct,
      glideMs: settings.glideMs, wave: settings.wave,
    });
  }, [engine, settings.bpm, settings.subdivision, settings.gatePct, settings.glideMs, settings.wave]);

  useEffect(() => {
    settings.tracks.forEach((t, i) => engine.setTrack(i, { steps: steps[i], enabled: t.enabled, muted: t.muted }));
  }, [engine, settings.tracks, steps]);

  // Verification hook: read-only counters, nothing to drive the engine with.
  useEffect(() => {
    const view = {} as SeqCounters;
    for (const k of ['notesScheduled', 'lastStepTime', 'trackIndex', 'playing'] as const) {
      Object.defineProperty(view, k, { get: () => engine.counters()[k], enumerable: true });
    }
    window.__seq = Object.freeze(view);
    return () => { delete window.__seq; engine.stop(); };
  }, [engine]);

  const toggle = useCallback(() => {
    if (engine.playing) {
      engine.stop();
      setPlaying(false);
    } else {
      void engine.start().then(() => setPlaying(true));
    }
  }, [engine]);

  useEffect(() => {
    const isField = (el: EventTarget | null) => {
      if (!(el instanceof HTMLElement)) return false;
      return el.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.code !== 'Space' || isField(e.target)) return;
      // Swallow keyup too, or a focused button would also click on release.
      e.preventDefault();
      if (e.type === 'keydown' && !e.repeat) toggle();
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener('keyup', onKey);
    return () => { window.removeEventListener('keydown', onKey); window.removeEventListener('keyup', onKey); };
  }, [toggle]);

  // Paint from the audio clock. Written straight to the DOM - no re-render per frame.
  const cellRefs = useRef<(HTMLDivElement | null)[][]>([[], []]);
  const nowRefs = useRef<(HTMLDivElement | null)[]>([]);
  const nowLabelRefs = useRef<(HTMLSpanElement | null)[]>([]);
  useEffect(() => {
    const active: number[] = [-1, -1];
    const clear = () => {
      for (let i = 0; i < 2; i++) {
        cellRefs.current[i][active[i]]?.removeAttribute('data-active');
        active[i] = -1;
        const now = nowRefs.current[i];
        if (now) now.style.backgroundColor = '';
        const label = nowLabelRefs.current[i];
        if (label) label.textContent = '';
      }
    };
    if (!playing) { clear(); return; }
    let raf = 0;
    const frame = () => {
      const t = engine.audibleTime();
      for (let i = 0; i < 2; i++) {
        const ev = engine.visualAt(i, t);
        const idx = ev ? ev.index : -1;
        if (idx !== active[i]) {
          cellRefs.current[i][active[i]]?.removeAttribute('data-active');
          cellRefs.current[i][idx]?.setAttribute('data-active', '');
          active[i] = idx;
          const label = nowLabelRefs.current[i];
          if (label) label.textContent = idx >= 0 ? (steps[i][idx]?.label ?? '') : '';
        }
        const now = nowRefs.current[i];
        if (!now) continue;
        if (!ev || !ev.toHex) { now.style.backgroundColor = ''; continue; }
        // Same window as the pitch glide, then hold.
        const k = ev.glide > 0 && ev.fromHex ? Math.min(1, Math.max(0, (t - ev.time) / ev.glide)) : 1;
        now.style.backgroundColor = ev.fromHex && k < 1 ? mixHex(ev.fromHex, ev.toHex, k) : ev.toHex;
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => { cancelAnimationFrame(raf); clear(); };
  }, [playing, engine, steps]);

  return (
    <div className="min-h-screen bg-background text-base text-foreground">
      <div className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-6">
        <header className="flex flex-wrap items-center gap-3">
          <h1 className="mr-auto text-2xl font-semibold">Sequencer Lab</h1>
          <Button size="lg" variant="outline" className="text-base" onClick={reload}>
            <RefreshCw /> Reload swatches
          </Button>
          <Button size="lg" className="w-28 text-base" onClick={toggle} aria-pressed={playing}>
            {playing ? <><Square /> Stop</> : <><Play /> Play</>}
          </Button>
        </header>
        <p className="text-base text-muted-foreground">
          Hue is pitch, brightness velocity, saturation the filter, alpha an accent. Empty slots and near-black swatches rest.
          Space plays and stops.
        </p>

        <section className="grid grid-cols-1 gap-x-8 gap-y-5 rounded-xl bg-muted/40 p-4 sm:grid-cols-2">
          <Knob label="Tempo" unit=" BPM" value={settings.bpm} min={40} max={240} onChange={(v) => set('bpm', v)} />
          <Seg label="Subdivision" value={String(settings.subdivision)} options="4:1/4|8:1/8|16:1/16"
            onChange={(v) => set('subdivision', Number(v) as Subdivision)} />
          <Knob label="Glide" unit=" ms" value={settings.glideMs} min={0} max={300} step={5} onChange={(v) => set('glideMs', v)} />
          <Knob label="Gate" unit="%" value={settings.gatePct} min={5} max={100} onChange={(v) => set('gatePct', v)} />
          <Seg label="Mode" value={settings.mode} options="melody:Melody|chords:Chords" onChange={(v) => set('mode', v as SeqMode)} />
          <Seg label="Waveform" value={settings.wave} options="triangle:Triangle|sine:Sine|sawtooth:Saw|square:Square"
            onChange={(v) => set('wave', v as Wave)} />
          <Seg label="Scale" value={settings.scale} options="pentatonic:Pentatonic|major:Major|minor:Minor|chromatic:Chromatic"
            onChange={(v) => set('scale', v as ScaleName)} />
          <Seg label="Octave range" value={String(settings.octaveRange)} options="1:1|2:2|3:3"
            onChange={(v) => set('octaveRange', Number(v))} />
          <div className="sm:col-span-2">
            <Seg label="Root" value={String(settings.root)} options={NOTE_NAMES.map((n, i) => `${i}:${n}`).join('|')}
              onChange={(v) => set('root', Number(v))} />
          </div>
        </section>

        {settings.tracks.map((t, ti) => {
          const i = ti as 0 | 1;
          const rowSteps = steps[i];
          return (
            <section key={i} className="flex flex-col gap-4 rounded-xl border border-border p-4" data-track={i === 0 ? 'A' : 'B'}>
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="text-xl font-semibold">Track {i === 0 ? 'A' : 'B'}</h2>
                <Button variant={t.enabled ? 'default' : 'outline'} className="text-base" aria-pressed={t.enabled}
                  onClick={() => setTrack(i, { enabled: !t.enabled })}>
                  {t.enabled ? 'On' : 'Off'}
                </Button>
                <Button variant={t.muted ? 'secondary' : 'outline'} className="text-base" aria-pressed={t.muted}
                  onClick={() => setTrack(i, { muted: !t.muted })}>
                  {t.muted ? 'Muted' : 'Mute'}
                </Button>
                <span className="ml-auto text-base text-muted-foreground">
                  {rowSteps.length} step{rowSteps.length === 1 ? '' : 's'}
                </span>
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_16rem]">
                <Seg label="Source" value={t.source} options={SOURCES} onChange={(v) => setTrack(i, { source: v as Source })} />
                <Knob label="Octave" value={t.octave} min={-2} max={2} onChange={(v) => setTrack(i, { octave: v })} />
              </div>
              <div className="flex items-start gap-4">
                <div className="flex shrink-0 flex-col items-center gap-1.5">
                  <div
                    ref={(el) => { nowRefs.current[i] = el; }}
                    className="size-20 rounded-xl border border-border bg-muted"
                    aria-label={`Track ${i === 0 ? 'A' : 'B'} now playing`}
                  />
                  <span ref={(el) => { nowLabelRefs.current[i] = el; }} className="h-6 text-base tabular-nums" />
                </div>
                {rowSteps.length === 0 ? (
                  <p className="text-base text-muted-foreground">
                    Nothing here - {t.source === 'saved' ? 'no Saved swatches' : 'no Recent swatches'} in this browser yet.
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {rowSteps.map((s, si) => {
                      const slot = slots[i][si];
                      return (
                        <div key={si} className="flex w-12 flex-col items-center gap-1">
                          <div
                            ref={(el) => { cellRefs.current[i][si] = el; }}
                            data-step={si}
                            className={
                              'size-12 rounded-lg border border-border transition-transform duration-75 '
                              + 'data-active:scale-110 data-active:ring-3 data-active:ring-foreground '
                              + (slot ? '' : 'border-dashed bg-muted/40')
                            }
                            style={slot ? { backgroundColor: withAlpha(slot.hex, slot.alpha) } : undefined}
                            title={slot ? `${slot.hex} ${slot.alpha}%` : 'empty slot'}
                          />
                          <span className={'text-base leading-tight ' + (s.rest ? 'text-muted-foreground' : 'text-foreground')}>
                            {s.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
