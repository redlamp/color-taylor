/**
 * Sequencer bench: the user's Saved and Recent swatches, a built-in palette, a
 * song, or a Custom row edited here, played as a two-track step sequencer - a
 * test bench for turning colour into music without touching the app.
 *
 * Three modes, each with its own controls (switching keeps each one's values):
 *   Hue Melody       hue -> a note of the scale, S -> filter, B -> volume
 *   Hue Chords       hue -> a triad root on the circle of fifths
 *   RGB Instruments  R, G and B each an instrument whose value picks its note
 *
 * Mapping lives in sequencer.ts, timing and voices in sequencerEngine.ts. This
 * file reads the app's swatch keys (never writes them), holds the controls in
 * the lab's own key, and paints what the audio clock says is sounding. The
 * paint loop reads `currentTime`; it never drives the audio.
 */
import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Minus, Play, Plus, RefreshCw, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { hexToRgb, rgbToHex } from '../utils/colorConversions';
import {
  BUILTIN_PALETTES, CHANNELS, NOTE_NAMES, ODE_RGB, SONGS, parseRecentSlots, parseSavedSlots, rgbSongSlots, songSlots,
  swatchToStep,
  type Channel, type LegacyAlpha, type MapConfig, type ScaleName, type SeqMode, type Slot, type Subdivision,
} from './sequencer';
import { BAR, SequencerEngine, type Instrument, type SeqCounters, type Wave } from './sequencerEngine';
import SequencerStepEditor from './SequencerStepEditor';

type SongKey = keyof typeof SONGS;
type SongSource = `${SongKey}-${'melody' | 'bass'}`;
type Source = 'saved' | 'recent' | 'rainbow' | 'pulse' | 'sunset' | SongSource | 'ode-rgb' | 'custom';

interface TrackCfg {
  source: Source;
  enabled: boolean;
  octave: number;
  muted: boolean;
  /** The track's own row, made by editing a cell of any other source. */
  custom: Slot[];
}

interface InstrumentCfg { octave: number; range: number; wave: Wave; level: number; muted: boolean }

/** Each mode keeps its own values, so switching away and back loses nothing. */
interface Settings {
  version: 3;
  bpm: number;
  subdivision: Subdivision;
  glideMs: number;
  gatePct: number;
  mode: SeqMode;
  melody: { scale: ScaleName; root: number; baseOctave: number; octaveRange: number; wave: Wave };
  chords: { root: number; baseOctave: number; wave: Wave };
  rgb: { scale: ScaleName; root: number; instruments: Record<Channel, InstrumentCfg> };
  tracks: [TrackCfg, TrackCfg];
}

const DEFAULTS: Settings = {
  version: 3,
  bpm: 110,
  subdivision: 8,
  glideMs: 40,
  gatePct: 70,
  mode: 'melody',
  melody: { scale: 'pentatonic', root: 0, baseOctave: 3, octaveRange: 2, wave: 'triangle' },
  chords: { root: 0, baseOctave: 3, wave: 'triangle' },
  rgb: {
    scale: 'pentatonic',
    root: 0,
    // Physics order: R bass, G middle, B lead.
    instruments: {
      r: { octave: 2, range: 1, wave: 'sine', level: 90, muted: false },
      g: { octave: 3, range: 2, wave: 'triangle', level: 70, muted: false },
      b: { octave: 4, range: 2, wave: 'sawtooth', level: 70, muted: false },
    },
  },
  tracks: [
    { source: 'saved', enabled: true, octave: 0, muted: false, custom: [] },
    { source: 'pulse', enabled: false, octave: -1, muted: false, custom: [] },
  ],
};

/** The lab's own key. Nothing else here is ever written to storage. */
const LAB_KEY = 'color-taylor-lab-sequencer';

function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(LAB_KEY);
    if (!raw) return DEFAULTS;
    const s = JSON.parse(raw) as Partial<Settings>;
    // An older shape is dropped rather than migrated: it is a lab.
    if (s.version !== 3) return DEFAULTS;
    const track = (i: 0 | 1) => ({ ...DEFAULTS.tracks[i], ...s.tracks?.[i] });
    const inst = (c: Channel) => ({ ...DEFAULTS.rgb.instruments[c], ...s.rgb?.instruments?.[c] });
    return {
      ...DEFAULTS,
      ...s,
      melody: { ...DEFAULTS.melody, ...s.melody },
      chords: { ...DEFAULTS.chords, ...s.chords },
      rgb: { ...DEFAULTS.rgb, ...s.rgb, instruments: { r: inst('r'), g: inst('g'), b: inst('b') } },
      tracks: [track(0), track(1)],
    };
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

const SONG_KEYS = Object.keys(SONGS) as SongKey[];

/** Song parts are fixed, so their colours are generated once. */
const SONG_SLOTS = Object.fromEntries(SONG_KEYS.flatMap((k) => [
  [`${k}-melody`, songSlots(SONGS[k], SONGS[k].melody)],
  [`${k}-bass`, songSlots(SONGS[k], SONGS[k].bass)],
])) as Record<SongSource, Slot[]>;
const ODE_RGB_SLOTS = rgbSongSlots(ODE_RGB);

const SOURCE_GROUPS: { label: string; options: [Source, string][] }[] = [
  { label: 'Your swatches', options: [['saved', 'Saved'], ['recent', 'Recent'], ['custom', 'Custom']] },
  { label: 'Palettes', options: [['rainbow', 'Rainbow'], ['pulse', 'Pulse'], ['sunset', 'Sunset']] },
  {
    label: 'Songs',
    options: [
      ...SONG_KEYS.flatMap((k): [Source, string][] => [
        [`${k}-melody`, `${SONGS[k].name} - melody`],
        [`${k}-bass`, `${SONGS[k].name} - bass`],
      ]),
      ['ode-rgb', ODE_RGB.name],
    ],
  },
];

const SONG_MENU: [string, string][] = [
  ...SONG_KEYS.map((k): [string, string] => [k, `${SONGS[k].name} (Hue Melody, A + B)`]),
  ['ode-rgb', `${ODE_RGB.name} (one track)`],
];

function slotsFor(track: TrackCfg, stored: Stored): Slot[] {
  const source = track.source;
  if (source === 'custom') return track.custom;
  if (source === 'saved') return stored.saved;
  if (source === 'recent') return stored.recent;
  if (source === 'ode-rgb') return ODE_RGB_SLOTS;
  if (source in SONG_SLOTS) return SONG_SLOTS[source as SongSource];
  return BUILTIN_PALETTES[source as keyof typeof BUILTIN_PALETTES];
}

/** The mapping a track plays under, from the current mode's own settings. */
function mapConfig(s: Settings, octaveOffset: number): MapConfig {
  if (s.mode === 'melody') return { mode: 'melody', ...s.melody, octaveOffset };
  if (s.mode === 'chords') {
    // Scale and range play no part in Hue Chords; they are fixed so nothing downstream reads a stale one.
    return { mode: 'chords', scale: 'major', octaveRange: 1, root: s.chords.root, baseOctave: s.chords.baseOctave, octaveOffset };
  }
  const inst = s.rgb.instruments;
  return {
    mode: 'rgb', scale: s.rgb.scale, root: s.rgb.root, octaveRange: 1, octaveOffset,
    ranges: { r: inst.r, g: inst.g, b: inst.b },
  };
}

function engineInstruments(s: Settings): Record<Channel, Instrument> {
  const i = s.rgb.instruments;
  const one = (c: InstrumentCfg): Instrument => ({ wave: c.wave, level: c.level / 100, muted: c.muted });
  return { r: one(i.r), g: one(i.g), b: one(i.b) };
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

const WAVES = 'triangle:Triangle|sine:Sine|sawtooth:Saw|square:Square';
const SCALE_OPTIONS = 'pentatonic:Pentatonic|major:Major|minor:Minor|chromatic:Chromatic';
const ROOTS = NOTE_NAMES.map((n, i) => `${i}:${n}`).join('|');
const MODES = 'melody:Hue Melody|chords:Hue Chords|rgb:RGB Instruments';
const HELP: Record<SeqMode, string> = {
  melody: 'Hue picks a note of the scale across the octave range. Saturation opens the filter, brightness sets the volume.',
  chords: 'Hue picks a triad root on the circle of fifths, 30 degrees a step from the root below. Saturation under 35 is minor. Brightness sets the volume.',
  rgb: 'Red, green and blue are three instruments: each channel\'s value picks its note across that instrument\'s range, and a channel under 8 is silent. Alpha is an accent for all three.',
};
const CHANNEL_INK: Record<Channel, string> = { r: '#e74c4c', g: '#2fa84f', b: '#3385ff' };
const CHANNEL_NAME: Record<Channel, string> = { r: 'Red', g: 'Green', b: 'Blue' };

/** A segmented control: `options` is `value:Label|value:Label`. */
function Seg({ value, options, onChange, label, control }: {
  value: string; options: string; onChange: (x: string) => void; label: string; control?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5" data-control={control}>
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
    bpm: settings.bpm, subdivision: settings.subdivision, gatePct: settings.gatePct, glideMs: settings.glideMs,
    wave: settings.mode === 'chords' ? settings.chords.wave : settings.melody.wave,
    instruments: engineInstruments(settings),
  }));

  const set = useCallback(<K extends keyof Settings>(k: K, v: Settings[K]) => {
    setSettings((s) => ({ ...s, [k]: v }));
  }, []);
  const setMelody = useCallback((p: Partial<Settings['melody']>) => setSettings((s) => ({ ...s, melody: { ...s.melody, ...p } })), []);
  const setChords = useCallback((p: Partial<Settings['chords']>) => setSettings((s) => ({ ...s, chords: { ...s.chords, ...p } })), []);
  const setRgb = useCallback((p: Partial<Settings['rgb']>) => setSettings((s) => ({ ...s, rgb: { ...s.rgb, ...p } })), []);
  const setInstrument = useCallback((c: Channel, p: Partial<InstrumentCfg>) => setSettings((s) => ({
    ...s, rgb: { ...s.rgb, instruments: { ...s.rgb.instruments, [c]: { ...s.rgb.instruments[c], ...p } } },
  })), []);
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

  /**
   * Editing a cell forks the track into its Custom row first (a copy of what
   * it was playing), so no source but the lab's own is ever changed.
   */
  const editTrack = useCallback((i: 0 | 1, edit: (row: Slot[]) => Slot[]) => {
    setSettings((s) => {
      const t = s.tracks[i];
      const row = t.source === 'custom' ? t.custom : [...slotsFor(t, stored)];
      const tracks = [...s.tracks] as [TrackCfg, TrackCfg];
      tracks[i] = { ...t, source: 'custom', custom: edit([...row]) };
      return { ...s, tracks };
    });
  }, [stored]);

  const configs = useMemo(() => settings.tracks.map((t) => mapConfig(settings, t.octave)), [settings]);
  const slots = useMemo(() => settings.tracks.map((t) => slotsFor(t, stored)), [settings.tracks, stored]);
  const steps = useMemo(() => slots.map((row, i) => row.map((slot) => swatchToStep(slot, configs[i]))), [slots, configs]);

  const wave = settings.mode === 'chords' ? settings.chords.wave : settings.melody.wave;
  const instruments = useMemo(() => engineInstruments(settings), [settings]);
  useEffect(() => {
    engine.setParams({
      bpm: settings.bpm, subdivision: settings.subdivision, gatePct: settings.gatePct,
      glideMs: settings.glideMs, wave, instruments,
    });
  }, [engine, settings.bpm, settings.subdivision, settings.gatePct, settings.glideMs, wave, instruments]);

  useEffect(() => {
    settings.tracks.forEach((t, i) => engine.setTrack(i, { steps: steps[i], enabled: t.enabled, muted: t.muted }));
  }, [engine, settings.tracks, steps]);

  // Verification hook: read-only counters, nothing to drive the engine with.
  useEffect(() => {
    const view = {} as SeqCounters;
    for (const k of ['notesScheduled', 'lastStepTime', 'trackIndex', 'trackStartStep', 'trackStartTime', 'voiceLog', 'playing'] as const) {
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

  /** Both tracks on and playing from step 0 together - a restart if already playing. */
  const playBoth = useCallback(() => {
    engine.stop();
    setSettings((s) => ({ ...s, tracks: [{ ...s.tracks[0], enabled: true }, { ...s.tracks[1], enabled: true }] }));
    // Straight to the engine as well: the state lands a render later, after the first steps are booked.
    settings.tracks.forEach((t, i) => engine.setTrack(i, { steps: steps[i], enabled: true, muted: t.muted }));
    void engine.start().then(() => setPlaying(true));
  }, [engine, settings.tracks, steps]);

  /** Loads a song with its own settings. Stops first, so the next Play starts it at bar one. */
  const loadSong = useCallback((key: string) => {
    engine.stop();
    setPlaying(false);
    if (key === 'ode-rgb') {
      const { bpm, subdivision, scale, root, ranges } = ODE_RGB.settings;
      setSettings((s) => ({
        ...s, bpm, subdivision, mode: 'rgb',
        rgb: {
          scale, root,
          instruments: {
            r: { ...s.rgb.instruments.r, ...ranges.r },
            g: { ...s.rgb.instruments.g, ...ranges.g },
            b: { ...s.rgb.instruments.b, ...ranges.b },
          },
        },
        tracks: [{ ...s.tracks[0], source: 'ode-rgb', octave: 0, enabled: true }, { ...s.tracks[1], enabled: false }],
      }));
      return;
    }
    const song = SONGS[key as SongKey];
    const { bpm, subdivision, scale, root, octaveRange } = song.settings;
    setSettings((s) => ({
      ...s, bpm, subdivision, mode: 'melody',
      melody: { ...s.melody, scale, root, octaveRange, baseOctave: 3 },
      tracks: [
        { ...s.tracks[0], source: `${key as SongKey}-melody`, octave: song.melody.octave, enabled: true },
        { ...s.tracks[1], source: `${key as SongKey}-bass`, octave: song.bass.octave, enabled: true },
      ],
    }));
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
  const cellRefs = useRef<(HTMLElement | null)[][]>([[], []]);
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

  const { mode } = settings;

  return (
    <div className="min-h-screen bg-background text-base text-foreground">
      <div className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-6">
        <header className="flex flex-wrap items-center gap-3">
          <h1 className="mr-auto text-2xl font-semibold">Sequencer Lab</h1>
          <select
            aria-label="Load song"
            className="h-9 rounded-lg border border-border bg-background px-2 text-base text-foreground"
            value=""
            onChange={(e) => { if (e.currentTarget.value) loadSong(e.currentTarget.value); }}
          >
            <option value="">Load song...</option>
            {SONG_MENU.map(([k, name]) => <option key={k} value={k}>{name}</option>)}
          </select>
          <Button size="lg" variant="outline" className="text-base" onClick={reload}>
            <RefreshCw /> Reload swatches
          </Button>
          <Button size="lg" variant="outline" className="text-base" onClick={playBoth}>
            <Play /> Play A+B
          </Button>
          <Button size="lg" className="w-28 text-base" onClick={toggle} aria-pressed={playing}>
            {playing ? <><Square /> Stop</> : <><Play /> Play</>}
          </Button>
        </header>

        <section className="flex flex-col gap-5 rounded-xl bg-muted/40 p-4">
          <Seg label="Mode" control="mode" value={mode} options={MODES} onChange={(v) => set('mode', v as SeqMode)} />
          <p className="text-base text-muted-foreground" data-help="">
            {HELP[mode]} Empty slots rest; alpha 0 is a tie, holding the note before it. Click a cell to edit it.
            Space plays and stops.
          </p>
          <div className="grid grid-cols-1 gap-x-8 gap-y-5 sm:grid-cols-2">
            <Knob label="Tempo" unit=" BPM" value={settings.bpm} min={40} max={240} onChange={(v) => set('bpm', v)} />
            <Seg label="Subdivision" value={String(settings.subdivision)} options="4:1/4|8:1/8|16:1/16"
              onChange={(v) => set('subdivision', Number(v) as Subdivision)} />
            <Knob label="Glide" unit=" ms" value={settings.glideMs} min={0} max={300} step={5} onChange={(v) => set('glideMs', v)} />
            <Knob label="Gate" unit="%" value={settings.gatePct} min={5} max={100} onChange={(v) => set('gatePct', v)} />
          </div>

          {mode === 'melody' && (
            <div className="grid grid-cols-1 gap-x-8 gap-y-5 sm:grid-cols-2">
              <Seg label="Scale" control="scale" value={settings.melody.scale} options={SCALE_OPTIONS}
                onChange={(v) => setMelody({ scale: v as ScaleName })} />
              <Seg label="Waveform" control="wave" value={settings.melody.wave} options={WAVES}
                onChange={(v) => setMelody({ wave: v as Wave })} />
              <Seg label="Base octave" control="base-octave" value={String(settings.melody.baseOctave)} options="1:1|2:2|3:3|4:4|5:5"
                onChange={(v) => setMelody({ baseOctave: Number(v) })} />
              <Seg label="Octave range" control="octave-range" value={String(settings.melody.octaveRange)} options="1:1|2:2|3:3"
                onChange={(v) => setMelody({ octaveRange: Number(v) })} />
              <div className="sm:col-span-2">
                <Seg label="Root" control="root" value={String(settings.melody.root)} options={ROOTS}
                  onChange={(v) => setMelody({ root: Number(v) })} />
              </div>
            </div>
          )}

          {mode === 'chords' && (
            <div className="grid grid-cols-1 gap-x-8 gap-y-5 sm:grid-cols-2">
              <Seg label="Base octave" control="base-octave" value={String(settings.chords.baseOctave)} options="1:1|2:2|3:3|4:4|5:5"
                onChange={(v) => setChords({ baseOctave: Number(v) })} />
              <Seg label="Waveform" control="wave" value={settings.chords.wave} options={WAVES}
                onChange={(v) => setChords({ wave: v as Wave })} />
              <div className="sm:col-span-2">
                <Seg label="Root - the chord red plays; each 30 degrees of hue goes up a fifth" control="root"
                  value={String(settings.chords.root)} options={ROOTS} onChange={(v) => setChords({ root: Number(v) })} />
              </div>
            </div>
          )}

          {mode === 'rgb' && (
            <>
              <div className="grid grid-cols-1 gap-x-8 gap-y-5">
                <Seg label="Scale" control="scale" value={settings.rgb.scale} options={SCALE_OPTIONS}
                  onChange={(v) => setRgb({ scale: v as ScaleName })} />
                <Seg label="Root" control="root" value={String(settings.rgb.root)} options={ROOTS}
                  onChange={(v) => setRgb({ root: Number(v) })} />
              </div>
              <div className="flex flex-col gap-3" data-control="instruments">
                <h2 className="text-xl font-semibold">Instruments</h2>
                {CHANNELS.map((c) => {
                  const inst = settings.rgb.instruments[c];
                  return (
                    <div
                      key={c}
                      data-instrument={c}
                      className="grid grid-cols-1 items-end gap-4 rounded-lg border-l-4 bg-background/60 p-3 md:grid-cols-[6rem_1fr_9rem_1.4fr_1fr_auto]"
                      style={{ borderLeftColor: CHANNEL_INK[c], backgroundColor: withAlpha(CHANNEL_INK[c], 10) }}
                    >
                      <span className="text-base font-semibold" style={{ color: CHANNEL_INK[c] }}>{CHANNEL_NAME[c]}</span>
                      <Seg label="Base octave" value={String(inst.octave)} options="1:1|2:2|3:3|4:4|5:5"
                        onChange={(v) => setInstrument(c, { octave: Number(v) })} />
                      <Seg label="Range" value={String(inst.range)} options="1:1|2:2|3:3"
                        onChange={(v) => setInstrument(c, { range: Number(v) })} />
                      <Seg label="Waveform" value={inst.wave} options="sine:Sine|triangle:Tri|sawtooth:Saw|square:Sq"
                        onChange={(v) => setInstrument(c, { wave: v as Wave })} />
                      <Knob label="Level" unit="%" value={inst.level} min={0} max={100} onChange={(v) => setInstrument(c, { level: v })} />
                      <Button variant={inst.muted ? 'secondary' : 'outline'} className="text-base" aria-pressed={inst.muted}
                        onClick={() => setInstrument(c, { muted: !inst.muted })}>
                        {inst.muted ? 'Muted' : 'Mute'}
                      </Button>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </section>

        {settings.tracks.map((t, ti) => {
          const i = ti as 0 | 1;
          const rowSteps = steps[i];
          const name = i === 0 ? 'A' : 'B';
          return (
            <section key={i} className="flex flex-col gap-4 rounded-xl border border-border p-4" data-track={name}>
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="text-xl font-semibold">Track {name}</h2>
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
                <Button variant="outline" className="text-base" aria-label={`Add a step to track ${name}`}
                  onClick={() => editTrack(i, (row) => [...row, null])}>
                  <Plus /> Step
                </Button>
                <Button variant="outline" className="text-base" aria-label={`Remove the last step of track ${name}`}
                  disabled={rowSteps.length === 0} onClick={() => editTrack(i, (row) => row.slice(0, -1))}>
                  <Minus /> Step
                </Button>
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_16rem]">
                <label className="flex flex-col gap-1.5">
                  <span className="text-base text-muted-foreground">Source</span>
                  <select
                    aria-label={`Track ${name} source`}
                    className="h-9 rounded-lg border border-border bg-background px-2 text-base text-foreground"
                    value={t.source}
                    onChange={(e) => setTrack(i, { source: e.target.value as Source })}
                  >
                    {SOURCE_GROUPS.map((g) => (
                      <optgroup key={g.label} label={g.label}>
                        {g.options.map(([v, text]) => <option key={v} value={v}>{text}</option>)}
                      </optgroup>
                    ))}
                  </select>
                </label>
                <Knob label="Octave" value={t.octave} min={-2} max={2} onChange={(v) => setTrack(i, { octave: v })} />
              </div>
              <div className="flex items-start gap-4">
                <div className="flex shrink-0 flex-col items-center gap-1.5">
                  <div
                    ref={(el) => { nowRefs.current[i] = el; }}
                    className="size-20 rounded-xl border border-border bg-muted"
                    aria-label={`Track ${name} now playing`}
                  />
                  <span ref={(el) => { nowLabelRefs.current[i] = el; }} className="h-6 text-base tabular-nums" />
                </div>
                {rowSteps.length === 0 ? (
                  <p className="text-base text-muted-foreground">
                    Nothing here yet{t.source === 'custom' ? ' - add a step' : ` - no ${t.source === 'saved' ? 'Saved' : 'Recent'} swatches in this browser`}.
                  </p>
                ) : (
                  <div className="grid flex-1 grid-cols-[2rem_repeat(16,minmax(0,1fr))] gap-x-1.5 gap-y-2">
                    {rowSteps.map((s, si) => {
                      const slot = slots[i][si];
                      const tie = s.rest && s.tie;
                      return (
                        <Fragment key={si}>
                          {si % BAR === 0 && (
                            <span className="pt-2 text-right text-base tabular-nums text-muted-foreground" title={`bar ${si / BAR + 1}`}>
                              {si / BAR + 1}
                            </span>
                          )}
                          <div className="flex min-w-0 flex-col items-center gap-1">
                            <Popover>
                              <PopoverTrigger
                                ref={(el: HTMLElement | null) => { cellRefs.current[i][si] = el; }}
                                data-step={si}
                                aria-label={`Track ${name} step ${si + 1}: ${s.rest ? s.label : s.detail}`}
                                className={
                                  'aspect-square w-full cursor-pointer rounded-md border border-border transition-transform duration-75 '
                                  + 'focus-visible:outline-2 focus-visible:outline-ring '
                                  + 'data-active:scale-110 data-active:ring-3 data-active:ring-foreground '
                                  + (slot ? '' : 'border-dashed bg-muted/40')
                                }
                                // A tie shows its note's colour, faded - at its real alpha 0 it would vanish.
                                style={slot ? { backgroundColor: withAlpha(slot.hex, tie ? 35 : slot.alpha) } : undefined}
                                title={slot ? `${slot.hex} ${slot.alpha}% - ${s.rest ? s.label : s.detail}` : 'empty slot'}
                              />
                              <PopoverContent className="w-80 p-3 text-base">
                                <SequencerStepEditor
                                  slot={slot}
                                  cfg={configs[i]}
                                  onChange={(next) => editTrack(i, (row) => { row[si] = next; return row; })}
                                />
                              </PopoverContent>
                            </Popover>
                            <span data-label={si} className={'w-full truncate text-center text-base leading-tight ' + (s.rest ? 'text-muted-foreground' : 'text-foreground')}>
                              {s.label}
                            </span>
                          </div>
                        </Fragment>
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
