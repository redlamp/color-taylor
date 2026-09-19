/**
 * Sequencer bench: the user's Saved and Recent swatches, a built-in palette, a
 * song, or a Custom row edited here, played as a step sequencer of one to six
 * tracks (A to F) - a test bench for turning colour into music without
 * touching the app.
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
 *
 * Selecting a cell makes it the current swatch in the side column
 * (SequencerCellEditor: the app's hexagon and Color Editor parts). Saved
 * arrangements - every track and the settings they play under - their JSON
 * file and the share link are in sequencerTracks.ts and SequencerLibrary.tsx.
 */
import { Fragment, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Link, Minus, Play, Plus, RefreshCw, Repeat, Square, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { hexToRgb, rgbToHex } from '../utils/colorConversions';
import {
  BUILTIN_PALETTES, CHANNELS, DEFAULT_NAMES, NOTE_NAMES, RGB_SONGS, SCALES, SCALE_LABELS, SONGS, parseRecentSlots, parseSavedSlots,
  alphaToStepKind, heldChannels, instrumentName, migrateLegacyRow, rgbSongConfig, rgbSongSlots, songConfig, songSlots,
  swatchToStep,
  type Channel, type LegacyAlpha, type MapConfig, type NoteStep, type ScaleName, type SeqMode, type Slot, type Subdivision,
} from './sequencer';
import { BAR, SequencerEngine, type Instrument, type SeqCounters, type Wave } from './sequencerEngine';
import {
  MAX_TRACKS, decodeShare, encodeShare, newId, parseLibrary,
  type Arrangement, type ChordsSettings, type InstrumentCfg, type MelodySettings, type RgbSettings, type SavedArrangement,
} from './sequencerTracks';
import CollapsibleSection from '../components/CollapsibleSection';
import SequencerStepEditor from './SequencerStepEditor';
import SequencerCellEditor, { type CellEditorHandle, type FollowTarget } from './SequencerCellEditor';
import SequencerLibrary from './SequencerLibrary';
import AuditionStrip from './SequencerAudition';

type SongKey = keyof typeof SONGS;
type SongSource = `${SongKey}-${'melody' | 'bass'}`;
type RgbSongKey = keyof typeof RGB_SONGS;
type Source = 'saved' | 'recent' | 'rainbow' | 'pulse' | 'sunset' | SongSource | RgbSongKey | 'custom';

interface TrackCfg {
  /** Stable while tracks are added and removed around it; the engine keys its playing state by it. */
  id: string;
  source: Source;
  enabled: boolean;
  octave: number;
  muted: boolean;
  /** The track's own row, made by editing a cell of any other source. */
  custom: Slot[];
}

/** Each mode keeps its own values, so switching away and back loses nothing. */
interface Settings {
  version: 5;
  bpm: number;
  subdivision: Subdivision;
  glideMs: number;
  gatePct: number;
  /** Off: each track plays through once and the transport stops after the longest. */
  loop: boolean;
  mode: SeqMode;
  melody: MelodySettings;
  chords: ChordsSettings;
  rgb: RgbSettings;
  /** 1..MAX_TRACKS, lettered A, B, C... by position. */
  tracks: TrackCfg[];
  /** A Custom row was edited since the last save or load: loading another arrangement asks first. */
  dirty: boolean;
  /** Snap a dragged cell to its note's centre on release. */
  snap: boolean;
  /** Saved arrangements - "Save as..." and the JSON import land here. */
  library: SavedArrangement[];
  /** Which collapsible sections are open, by id. Absent is open. */
  open: Record<string, boolean>;
}

const DEFAULTS: Settings = {
  version: 5,
  bpm: 110,
  subdivision: 8,
  glideMs: 40,
  gatePct: 70,
  loop: true,
  mode: 'melody',
  melody: { scale: 'pentatonic', root: 0, baseOctave: 3, octaveRange: 2, wave: 'triangle' },
  chords: { root: 0, baseOctave: 3, wave: 'triangle' },
  rgb: {
    scale: 'pentatonic',
    root: 0,
    // Physics order: R bass, G middle, B lead.
    instruments: {
      r: { name: DEFAULT_NAMES.r, octave: 2, range: 1, wave: 'sine', level: 90, muted: false },
      g: { name: DEFAULT_NAMES.g, octave: 3, range: 2, wave: 'triangle', level: 70, muted: false },
      b: { name: DEFAULT_NAMES.b, octave: 4, range: 2, wave: 'sawtooth', level: 70, muted: false },
    },
  },
  tracks: [
    { id: 'track-a', source: 'saved', enabled: true, octave: 0, muted: false, custom: [] },
    { id: 'track-b', source: 'pulse', enabled: false, octave: -1, muted: false, custom: [] },
  ],
  dirty: false,
  snap: true,
  library: [],
  open: {},
};

/** The lab's own key. Nothing else here is ever written to storage. */
const LAB_KEY = 'color-taylor-lab-sequencer';

function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(LAB_KEY);
    if (!raw) return DEFAULTS;
    const s = JSON.parse(raw) as Omit<Partial<Settings>, 'version'> & { version?: number };
    // Version 3 is the two-track shape, the same fields: it reads straight into
    // this one, and its library's single-track entries migrate in parseLibrary.
    // 3 and 4 predate the alpha hold notches, so their rows - Custom and
    // library - are migrated into them. Anything older is dropped rather than
    // migrated: it is a lab.
    if (s.version !== 3 && s.version !== 4 && s.version !== 5) return DEFAULTS;
    const legacyAlpha = s.version !== 5;
    const inst = (c: Channel) => ({ ...DEFAULTS.rgb.instruments[c], ...s.rgb?.instruments?.[c] });
    const seen = new Set<string>();
    const tracks = (Array.isArray(s.tracks) ? s.tracks : []).slice(0, MAX_TRACKS).map((t, i): TrackCfg => {
      const base = DEFAULTS.tracks[i] ?? blankTrack();
      const merged = { ...base, ...t };
      const id = typeof merged.id === 'string' && !seen.has(merged.id) ? merged.id : newId();
      seen.add(id);
      return {
        ...merged, id,
        source: ALL_SOURCES.has(merged.source) ? merged.source : base.source,
        custom: Array.isArray(merged.custom) ? merged.custom : [],
      };
    });
    const out: Settings = {
      ...DEFAULTS,
      ...s,
      version: 5,
      melody: { ...DEFAULTS.melody, ...s.melody },
      chords: { ...DEFAULTS.chords, ...s.chords },
      rgb: { ...DEFAULTS.rgb, ...s.rgb, instruments: { r: inst('r'), g: inst('g'), b: inst('b') } },
      tracks: tracks.length ? tracks : DEFAULTS.tracks,
      dirty: s.dirty === true,
      library: parseLibrary(s.library, legacyAlpha),
      open: s.open && typeof s.open === 'object' ? s.open : {},
    };
    if (legacyAlpha) {
      out.tracks = out.tracks.map((t) => ({ ...t, custom: migrateLegacyRow(t.custom, mapConfig(out, t.octave)) }));
    }
    return out;
  } catch {
    return DEFAULTS;
  }
}

/** Every track as an arrangement: rows, per-track settings and the settings they play under. */
function arrangementOf(s: Settings, rows: readonly Slot[][], name: string): Arrangement {
  const arr: Arrangement = {
    name, mode: s.mode, bpm: s.bpm, subdivision: s.subdivision, gatePct: s.gatePct, glideMs: s.glideMs,
    ...(s.loop ? {} : { loop: false }),
    tracks: s.tracks.map((t, i) => ({
      steps: (rows[i] ?? []).map((x) => (x ? { ...x } : null)),
      octave: t.octave, enabled: t.enabled, muted: t.muted,
      ...(FIXED_SOURCES.has(t.source) ? { source: t.source } : {}),
    })),
  };
  if (s.mode === 'melody') arr.melody = { ...s.melody };
  if (s.mode === 'chords') arr.chords = { ...s.chords };
  if (s.mode === 'rgb') arr.rgb = { ...s.rgb, instruments: { ...s.rgb.instruments } };
  return arr;
}

const sameRow = (a: readonly Slot[], b: readonly Slot[]) => a.length === b.length
  && a.every((x, i) => (x === null ? b[i] === null : b[i] !== null && x.hex === b[i]!.hex && x.alpha === b[i]!.alpha));

/**
 * An arrangement replacing every track, with the settings it was made with. A
 * track whose row is still exactly its built-in source goes back on that
 * source; any other row becomes the track's Custom row.
 */
function applyArrangement(s: Settings, arr: Arrangement): Settings {
  const tracks = arr.tracks.map((t): TrackCfg => {
    const hint = t.source as Source | undefined;
    const fixed = hint !== undefined && FIXED_SOURCES.has(hint) && sameRow(fixedSlots(hint), t.steps);
    return {
      id: newId(), source: fixed ? hint : 'custom', custom: fixed ? [] : t.steps.map((x) => (x ? { ...x } : null)),
      octave: t.octave, enabled: t.enabled, muted: t.muted,
    };
  });
  return {
    ...s,
    mode: arr.mode, bpm: arr.bpm, subdivision: arr.subdivision, gatePct: arr.gatePct, glideMs: arr.glideMs,
    loop: arr.loop !== false,
    melody: arr.melody ?? s.melody,
    chords: arr.chords ?? s.chords,
    rgb: arr.rgb ?? s.rgb,
    tracks,
    dirty: false,
  };
}

/** Settings, with a `#seq=` share link in the URL loaded in place of the tracks. */
function initialSettings(): Settings {
  const s = loadSettings();
  const shared = typeof location === 'undefined' ? null : decodeShare(location.hash);
  return shared ? applyArrangement(s, shared) : s;
}

/** The share link drops out of the address bar once loaded, so a reload doesn't undo edits made since. */
function clearShareHash() {
  if (location.hash.startsWith('#seq=')) history.replaceState(null, '', location.pathname + location.search);
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
const RGB_SONG_KEYS = Object.keys(RGB_SONGS) as RgbSongKey[];
const RGB_SONG_SLOTS = Object.fromEntries(RGB_SONG_KEYS.map((k) => [k, rgbSongSlots(RGB_SONGS[k])])) as Record<RgbSongKey, Slot[]>;

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
      ...RGB_SONG_KEYS.map((k): [Source, string] => [k, RGB_SONGS[k].name]),
    ],
  },
];

/**
 * The Load song menu, one group per mode. A song's group is the mode its own
 * config plays under - read from the song, not listed by hand - and a mode
 * with no songs has no group.
 */
const SONG_MENU: { mode: SeqMode; songs: [string, string][] }[] = (() => {
  const all: { mode: SeqMode; key: string; name: string }[] = [
    ...SONG_KEYS.map((k) => ({ mode: songConfig(SONGS[k], SONGS[k].melody).mode, key: k as string, name: `${SONGS[k].name} (two tracks)` })),
    ...RGB_SONG_KEYS.map((k) => ({ mode: rgbSongConfig(RGB_SONGS[k]).mode, key: k as string, name: `${RGB_SONGS[k].name} (one track)` })),
  ];
  return (['melody', 'chords', 'rgb'] as const)
    .map((mode) => ({ mode, songs: all.filter((x) => x.mode === mode).map((x): [string, string] => [x.key, x.name]) }))
    .filter((g) => g.songs.length > 0);
})();

const ALL_SOURCES = new Set<Source>(SOURCE_GROUPS.flatMap((g) => g.options.map(([v]) => v)));
/** Sources whose row never changes: palettes and song parts. A saved arrangement names them as a hint. */
const FIXED_SOURCES = new Set<Source>([...ALL_SOURCES].filter((x) => x !== 'saved' && x !== 'recent' && x !== 'custom'));

/** A palette's or song part's row. */
function fixedSlots(source: Source): Slot[] {
  if (source in RGB_SONG_SLOTS) return RGB_SONG_SLOTS[source as RgbSongKey];
  if (source in SONG_SLOTS) return SONG_SLOTS[source as SongSource];
  return BUILTIN_PALETTES[source as keyof typeof BUILTIN_PALETTES] ?? [];
}

function slotsFor(track: TrackCfg, stored: Stored): Slot[] {
  const source = track.source;
  if (source === 'custom') return track.custom;
  if (source === 'saved') return stored.saved;
  if (source === 'recent') return stored.recent;
  return fixedSlots(source);
}

/** Track letters by position: A, B, C... */
const trackLetter = (i: number) => String.fromCharCode(65 + i);

/** A track added with the + button: the rainbow, on, so it has something to play straight away. */
function blankTrack(): TrackCfg {
  return { id: newId(), source: 'rainbow', enabled: true, octave: 0, muted: false, custom: [] };
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
    names: { r: inst.r.name, g: inst.g.name, b: inst.b.name },
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
const SCALE_OPTIONS = (Object.keys(SCALES) as ScaleName[]).map((k) => `${k}:${SCALE_LABELS[k]}`).join('|');
const ROOTS = NOTE_NAMES.map((n, i) => `${i}:${n}`).join('|');
const MODES = 'melody:Hue Melody|chords:Hue Chords|rgb:RGB Instruments';
const HELP: Record<SeqMode, string> = {
  melody: 'Hue picks a note of the scale across the octave range. Saturation opens the filter, brightness sets the volume.',
  chords: 'Hue picks a triad root on the circle of fifths, 30 degrees a step from the root below. Saturation under 35 is minor. Brightness sets the volume.',
  rgb: 'Red, green and blue are three instruments: each channel\'s value picks its note across that instrument\'s range, and a channel under 8 is silent. Each instrument\'s level sets its volume.',
};
/** How alpha reads, per mode: nine notches, none of them a volume. */
const ALPHA_HELP: Record<SeqMode, string> = {
  melody: 'Alpha is not volume: 100 strikes, any lower notch holds the note before (a tie, marked with a bar), and 0 silences the step.',
  chords: 'Alpha is not volume: 100 strikes, any lower notch holds the chord before (a tie, marked with a bar), and 0 silences the step.',
  rgb: 'Alpha is not volume but which instruments hold, in notches of 12.5: 100 strikes all three, 88 holds Bass, 75 Harmony, 50 Lead, the notches between hold two, 13 all three, and 0 silences every voice. A held voice keeps its note whatever its channel reads, marked with a tick in its colour.',
};
const CHANNEL_INK: Record<Channel, string> = { r: '#e74c4c', g: '#2fa84f', b: '#3385ff' };
const CHANNEL_NAME: Record<Channel, string> = { r: 'Red', g: 'Green', b: 'Blue' };
/** The Chord audition's step: a warm off-white, so all three instruments sound. */
const CHORD_SAMPLE = '#e8dcc8';
interface Selection { track: number; step: number }
/** A drag's sticky colour for one cell: what it plays until release. */
interface Live extends Selection { hex: string }

const MODE_TITLE: Record<SeqMode, string> = { melody: 'Hue Melody', chords: 'Hue Chords', rgb: 'RGB Instruments' };

/**
 * The app's CollapsibleSection, with its open state kept in the lab's key.
 * The section is uncontrolled and reports nothing, so its trigger's
 * aria-expanded is watched instead: the DOM is the truth, whatever toggled it.
 */
function LabSection({ id, title, open, onOpenChange, headerRight, children }: {
  id: string; title: string; open: boolean; onOpenChange: (id: string, open: boolean) => void;
  headerRight?: ReactNode; children: ReactNode;
}) {
  useEffect(() => {
    const trigger = document.getElementById(`${id}-trigger`);
    if (!trigger) return;
    const obs = new MutationObserver(() => onOpenChange(id, trigger.getAttribute('aria-expanded') === 'true'));
    obs.observe(trigger, { attributes: true, attributeFilter: ['aria-expanded'] });
    return () => obs.disconnect();
  }, [id, onOpenChange]);
  return (
    <CollapsibleSection id={id} title={title} level="h2" variant="plain" defaultOpen={open} headerRight={headerRight}>
      {children}
    </CollapsibleSection>
  );
}

/** A segmented control: `options` is `value:Label|value:Label`. */
/** `wrap` lets a long list (the six scales) run onto a second line on a narrow screen instead of overflowing. */
function Seg({ value, options, onChange, label, control, wrap }: {
  value: string; options: string; onChange: (x: string) => void; label: string; control?: string; wrap?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1.5" data-control={control}>
      <span className="text-base text-muted-foreground">{label}</span>
      <Tabs value={value} onValueChange={(x) => onChange(String(x))}>
        <TabsList className={wrap ? 'w-full flex-wrap group-data-horizontal/tabs:h-auto' : 'h-9 w-full'}>
          {options.split('|').map((o) => {
            const [val, text] = o.split(':');
            return <TabsTrigger key={val} value={val} className={wrap ? 'h-8 flex-1 text-base' : 'flex-1 text-base'}>{text}</TabsTrigger>;
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
  const [settings, setSettings] = useState<Settings>(initialSettings);
  useEffect(clearShareHash, []);
  const [stored, setStored] = useState<Stored>(readStored);
  const [playing, setPlaying] = useState(false);
  const [engine] = useState(() => new SequencerEngine({
    bpm: settings.bpm, subdivision: settings.subdivision, gatePct: settings.gatePct, glideMs: settings.glideMs,
    wave: settings.mode === 'chords' ? settings.chords.wave : settings.melody.wave,
    instruments: engineInstruments(settings), loop: settings.loop,
  }));
  // Loop off: the engine stops itself after the longest track, and the button goes back to Play.
  useEffect(() => {
    engine.onEnded = () => setPlaying(false);
    return () => { engine.onEnded = null; };
  }, [engine]);

  const set = useCallback(<K extends keyof Settings>(k: K, v: Settings[K]) => {
    setSettings((s) => ({ ...s, [k]: v }));
  }, []);
  const setMelody = useCallback((p: Partial<Settings['melody']>) => setSettings((s) => ({ ...s, melody: { ...s.melody, ...p } })), []);
  const setChords = useCallback((p: Partial<Settings['chords']>) => setSettings((s) => ({ ...s, chords: { ...s.chords, ...p } })), []);
  const setRgb = useCallback((p: Partial<Settings['rgb']>) => setSettings((s) => ({ ...s, rgb: { ...s.rgb, ...p } })), []);
  const setInstrument = useCallback((c: Channel, p: Partial<InstrumentCfg>) => setSettings((s) => ({
    ...s, rgb: { ...s.rgb, instruments: { ...s.rgb.instruments, [c]: { ...s.rgb.instruments[c], ...p } } },
  })), []);
  const setTrack = useCallback((i: number, patch: Partial<TrackCfg>) => {
    setSettings((s) => ({ ...s, tracks: s.tracks.map((t, k) => (k === i ? { ...t, ...patch } : t)) }));
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
  const editTrack = useCallback((i: number, edit: (row: Slot[]) => Slot[]) => {
    setSettings((s) => {
      const t = s.tracks[i];
      if (!t) return s;
      const row = t.source === 'custom' ? t.custom : [...slotsFor(t, stored)];
      const tracks = s.tracks.map((x, k) => (k === i ? { ...t, source: 'custom' as const, custom: edit([...row]) } : x));
      return { ...s, tracks, dirty: true };
    });
  }, [stored]);

  const configs = useMemo(() => settings.tracks.map((t) => mapConfig(settings, t.octave)), [settings]);
  const slots = useMemo(() => settings.tracks.map((t) => slotsFor(t, stored)), [settings.tracks, stored]);
  const [selected, setSelected] = useState<Selection | null>(null);
  const [live, setLive] = useState<Live | null>(null);
  const steps = useMemo(() => slots.map((row, i) => row.map((slot, si) => (
    // A cell being dragged plays its sticky note, not the raw colour under the pointer.
    live && slot && live.track === i && live.step === si
      ? swatchToStep({ hex: live.hex, alpha: slot.alpha }, configs[i])
      : swatchToStep(slot, configs[i])
  ))), [slots, configs, live]);

  const wave = settings.mode === 'chords' ? settings.chords.wave : settings.melody.wave;
  const instruments = useMemo(() => engineInstruments(settings), [settings]);
  useEffect(() => {
    engine.setParams({
      bpm: settings.bpm, subdivision: settings.subdivision, gatePct: settings.gatePct,
      glideMs: settings.glideMs, wave, instruments, loop: settings.loop,
    });
  }, [engine, settings.bpm, settings.subdivision, settings.gatePct, settings.glideMs, wave, instruments, settings.loop]);

  useEffect(() => {
    engine.setTracks(settings.tracks.map((t, i) => ({ id: t.id, steps: steps[i] ?? [], enabled: t.enabled, muted: t.muted })));
  }, [engine, settings.tracks, steps]);

  // Verification hook: read-only counters, nothing to drive the engine with.
  useEffect(() => {
    const view = {} as SeqCounters;
    for (const k of ['notesScheduled', 'lastStepTime', 'trackIndex', 'trackStartStep', 'trackStartTime', 'voiceLog', 'playing', 'auditionNotes', 'auditionHeld'] as const) {
      Object.defineProperty(view, k, { get: () => engine.counters()[k], enumerable: true });
    }
    window.__seq = Object.freeze(view);
    return () => { delete window.__seq; engine.stop(); };
  }, [engine]);

  /*
   * Follow: while playing, the side column shows the colour sounding on one
   * track, straight from the paint loop below. Default the first track that
   * is on; a followed track that is off hands over to the first one on. A
   * press on the editor pauses it; the next Play, or picking a Follow button,
   * resumes.
   */
  const [followPick, setFollow] = useState<FollowTarget>(() => Math.max(0, settings.tracks.findIndex((t) => t.enabled)));
  // A followed track that has since been removed falls back to Track A.
  const follow: FollowTarget = typeof followPick === 'number' && followPick >= settings.tracks.length ? 0 : followPick;
  const [followPaused, setFollowPaused] = useState(false);
  const editorRef = useRef<CellEditorHandle | null>(null);
  const followRef = useRef<FollowTarget | null>(follow);
  useEffect(() => { followRef.current = followPaused ? null : follow; }, [follow, followPaused]);
  const pickFollow = useCallback((f: FollowTarget) => { setFollow(f); setFollowPaused(false); }, []);

  const toggle = useCallback(() => {
    if (engine.playing) {
      engine.stop();
      setPlaying(false);
    } else {
      setFollowPaused(false);
      void engine.start().then(() => setPlaying(true));
    }
  }, [engine]);

  /** Every track on and playing from step 0 together - a restart if already playing. */
  const playAll = useCallback(() => {
    engine.stop();
    setSettings((s) => ({ ...s, tracks: s.tracks.map((t) => ({ ...t, enabled: true })) }));
    // Straight to the engine as well: the state lands a render later, after the first steps are booked.
    engine.setTracks(settings.tracks.map((t, i) => ({ id: t.id, steps: steps[i] ?? [], enabled: true, muted: t.muted })));
    setFollowPaused(false);
    void engine.start().then(() => setPlaying(true));
  }, [engine, settings.tracks, steps]);

  /**
   * Loads a song with its own settings onto the first tracks, one per part,
   * adding tracks if there are too few; any tracks after those are switched
   * off. Stops first, so the next Play starts it at bar one.
   */
  const loadSong = useCallback((key: string) => {
    engine.stop();
    setPlaying(false);
    const fill = (tracks: TrackCfg[], parts: { source: Source; octave: number }[]) => {
      const out = [...tracks];
      while (out.length < parts.length) out.push(blankTrack());
      return out.map((t, i) => (i < parts.length ? { ...t, ...parts[i], enabled: true } : { ...t, enabled: false }));
    };
    if (key in RGB_SONGS) {
      const k = key as RgbSongKey;
      const { bpm, subdivision, scale, root, ranges, gatePct, glideMs, waves } = RGB_SONGS[k].settings;
      const inst = (s: Settings, ch: Channel): InstrumentCfg => ({ ...s.rgb.instruments[ch], ...ranges[ch], wave: waves?.[ch] ?? s.rgb.instruments[ch].wave });
      setSettings((s) => ({
        ...s, bpm, subdivision, mode: 'rgb',
        gatePct: gatePct ?? s.gatePct, glideMs: glideMs ?? s.glideMs,
        rgb: { scale, root, instruments: { r: inst(s, 'r'), g: inst(s, 'g'), b: inst(s, 'b') } },
        tracks: fill(s.tracks, [{ source: k, octave: 0 }]),
      }));
      return;
    }
    const k = key as SongKey;
    const song = SONGS[k];
    const { bpm, subdivision, scale, root, octaveRange } = song.settings;
    setSettings((s) => ({
      ...s, bpm, subdivision, mode: 'melody',
      melody: { ...s.melody, scale, root, octaveRange, baseOctave: 3 },
      tracks: fill(s.tracks, [
        { source: `${k}-melody`, octave: song.melody.octave },
        { source: `${k}-bass`, octave: song.bass.octave },
      ]),
    }));
  }, [engine]);

  // --- adding and removing tracks ---------------------------------------------
  /** The track waiting on a remove confirm (it has a Custom row), by id. */
  const [removing, setRemoving] = useState<string | null>(null);
  const addTrack = useCallback(() => {
    setSettings((s) => (s.tracks.length >= MAX_TRACKS ? s : { ...s, tracks: [...s.tracks, blankTrack()] }));
  }, []);
  const removeTrack = useCallback((id: string) => {
    setRemoving(null);
    // Positions shift, so a selection or share link pointing past here would point at the wrong track.
    setSelected(null);
    setShareLink(null);
    setSettings((s) => (s.tracks.length <= 1 ? s : { ...s, tracks: s.tracks.filter((t) => t.id !== id) }));
  }, []);

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
  const cellRefs = useRef<(HTMLElement | null)[][]>([]);
  const nowRefs = useRef<(HTMLDivElement | null)[]>([]);
  const nowLabelRefs = useRef<(HTMLSpanElement | null)[]>([]);
  /** The colour last pushed to the side column, so a held note costs no render. */
  const followShown = useRef<string | null>(null);
  const tracksOn = useRef<boolean[]>([]);
  useEffect(() => { tracksOn.current = settings.tracks.map((t) => t.enabled); }, [settings.tracks]);
  // Stopped, or following switched off or paused: the side column goes back to the cell.
  useEffect(() => {
    if (playing && follow !== 'off' && !followPaused) return;
    followShown.current = null;
    editorRef.current?.follow(null);
  }, [playing, follow, followPaused]);
  useEffect(() => {
    const n = steps.length;
    const active: number[] = new Array(n).fill(-1);
    const clear = () => {
      for (let i = 0; i < n; i++) {
        cellRefs.current[i]?.[active[i]]?.removeAttribute('data-active');
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
      // The followed track, or the first one on if it is off; -1 when following is off or paused.
      const f = followRef.current;
      const on = tracksOn.current;
      const target = f === null || f === 'off' ? -1 : (on[f] || !on.some(Boolean) ? f : on.findIndex(Boolean));
      for (let i = 0; i < n; i++) {
        const ev = engine.visualAt(i, t);
        const idx = ev ? ev.index : -1;
        if (idx !== active[i]) {
          cellRefs.current[i]?.[active[i]]?.removeAttribute('data-active');
          cellRefs.current[i]?.[idx]?.setAttribute('data-active', '');
          active[i] = idx;
          const label = nowLabelRefs.current[i];
          if (label) label.textContent = idx >= 0 ? (steps[i][idx]?.label ?? '') : '';
        }
        const now = nowRefs.current[i];
        if (!ev || !ev.toHex) { if (now) now.style.backgroundColor = ''; continue; }
        // Same window as the pitch glide, then hold.
        const k = ev.glide > 0 && ev.fromHex ? Math.min(1, Math.max(0, (t - ev.time) / ev.glide)) : 1;
        const colour = ev.fromHex && k < 1 ? mixHex(ev.fromHex, ev.toHex, k) : ev.toHex;
        if (now) now.style.backgroundColor = colour;
        if (target === i && colour !== followShown.current) {
          followShown.current = colour;
          editorRef.current?.follow(colour);
        }
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => { cancelAnimationFrame(raf); clear(); };
  }, [playing, engine, steps]);

  const { mode } = settings;
  const openOf = (id: string) => settings.open[id] !== false;
  const setSectionOpen = useCallback((id: string, open: boolean) => {
    setSettings((s) => (s.open[id] === open ? s : { ...s, open: { ...s.open, [id]: open } }));
  }, []);

  // --- selection and the side column -----------------------------------------
  const sel = selected && selected.track < slots.length && selected.step < slots[selected.track].length ? selected : null;
  const selSlot = sel ? slots[sel.track][sel.step] : null;
  const writeSelected = useCallback((next: Slot) => {
    if (!sel) return;
    editTrack(sel.track, (row) => { row[sel.step] = next; return row; });
  }, [sel, editTrack]);
  const onLive = useCallback((hex: string | null) => {
    setLive(hex && sel ? { ...sel, hex } : null);
  }, [sel]);
  const onGrab = useCallback(() => setFollowPaused(true), []);

  // --- library and share --------------------------------------------------
  const saveArrangement = useCallback((name: string) => {
    setSettings((s) => ({
      ...s,
      dirty: false,
      library: [...s.library, { ...arrangementOf(s, s.tracks.map((t) => slotsFor(t, stored)), name), id: newId(), savedAt: Date.now() }],
    }));
  }, [stored]);
  const replaceWith = useCallback((arr: Arrangement) => {
    engine.stop();
    setPlaying(false);
    setSelected(null);
    setShareLink(null);
    setRemoving(null);
    setSettings((s) => applyArrangement(s, arr));
  }, [engine]);
  const loadArrangement = useCallback((id: string) => {
    const arr = settings.library.find((x) => x.id === id);
    if (arr) replaceWith(arr);
  }, [settings.library, replaceWith]);
  const [shareLink, setShareLink] = useState<{ url: string; copied: boolean; tracks: number } | null>(null);
  const share = useCallback(() => {
    const arr = arrangementOf(settings, slots, 'Shared arrangement');
    const url = `${location.origin}${location.pathname}${location.search}#${encodeShare(arr)}`;
    setShareLink({ url, copied: false, tracks: arr.tracks.length });
    void navigator.clipboard?.writeText(url).then(
      () => setShareLink((l) => (l && l.url === url ? { ...l, copied: true } : l)),
      () => { /* no clipboard permission: the field below still has it */ },
    );
  }, [settings, slots]);
  // A share link pasted into this tab's address bar arrives as a hash change, not a load.
  const dirtyRef = useRef(settings.dirty);
  useEffect(() => { dirtyRef.current = settings.dirty; }, [settings.dirty]);
  useEffect(() => {
    const onHash = () => {
      const arr = decodeShare(location.hash);
      if (!arr) return;
      if (!dirtyRef.current || window.confirm('Replace the current tracks with the shared ones? Their Custom edits are not saved.')) {
        replaceWith(arr);
      }
      clearShareHash();
    };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, [replaceWith]);

  const rgbCfg = useMemo(() => mapConfig({ ...settings, mode: 'rgb' }, 0), [settings]);
  const playChord = useCallback(() => {
    const step = swatchToStep({ hex: CHORD_SAMPLE, alpha: 100 }, rgbCfg);
    if (!step.rest) engine.auditionSequence([step as NoteStep], 4);
  }, [engine, rgbCfg]);

  return (
    <div className="min-h-screen bg-background text-base text-foreground">
      <div className="mx-auto flex max-w-[96rem] flex-col gap-6 px-4 py-6">
        <header className="flex flex-wrap items-center gap-3">
          <h1 className="mr-auto text-2xl font-semibold">Sequencer Lab</h1>
        </header>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_24rem]">
        <div className="flex min-w-0 flex-col gap-6">
        <section className="flex flex-col rounded-xl bg-muted/40 p-4" data-panel="mode">
          <LabSection id="lab-seq-mode" title="Mode" open={openOf('lab-seq-mode')} onOpenChange={setSectionOpen}>
          <div className="flex flex-col gap-5">
          <Seg label="Mode" control="mode" value={mode} options={MODES} onChange={(v) => set('mode', v as SeqMode)} />
          <p className="text-base text-muted-foreground" data-help="">
            {HELP[mode]} {ALPHA_HELP[mode]} A silenced step shows its colour faded and struck through. Empty slots
            rest. Click a cell to edit it. Space plays and stops.
          </p>
          <div className="grid grid-cols-1 gap-x-8 gap-y-5 sm:grid-cols-2">
            <Knob label="Tempo" unit=" BPM" value={settings.bpm} min={40} max={240} onChange={(v) => set('bpm', v)} />
            <Seg label="Subdivision" value={String(settings.subdivision)} options="4:1/4|8:1/8|16:1/16"
              onChange={(v) => set('subdivision', Number(v) as Subdivision)} />
            <Knob label="Glide" unit=" ms" value={settings.glideMs} min={0} max={300} step={5} onChange={(v) => set('glideMs', v)} />
            <Knob label="Gate" unit="%" value={settings.gatePct} min={5} max={100} onChange={(v) => set('gatePct', v)} />
          </div>

          <LabSection id="lab-seq-mode-settings" title={`${MODE_TITLE[mode]} settings`} open={openOf('lab-seq-mode-settings')}
            onOpenChange={setSectionOpen}>
          {mode === 'melody' && (
            <div className="grid grid-cols-1 gap-x-8 gap-y-5 sm:grid-cols-2">
              <Seg label="Scale" control="scale" value={settings.melody.scale} options={SCALE_OPTIONS} wrap
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
            <div className="grid grid-cols-1 gap-x-8 gap-y-5">
              <Seg label="Scale" control="scale" value={settings.rgb.scale} options={SCALE_OPTIONS} wrap
                onChange={(v) => setRgb({ scale: v as ScaleName })} />
              <Seg label="Root" control="root" value={String(settings.rgb.root)} options={ROOTS}
                onChange={(v) => setRgb({ root: Number(v) })} />
            </div>
          )}
          </LabSection>

          {mode === 'rgb' && (
            <LabSection id="lab-seq-instruments" title="Instruments" open={openOf('lab-seq-instruments')} onOpenChange={setSectionOpen}
              headerRight={
                <Button variant="outline" className="text-base" onClick={playChord} aria-label="Play all three instruments together">
                  Chord
                </Button>
              }>
              <div className="flex flex-col gap-3" data-control="instruments">
                <p className="text-base text-muted-foreground">
                  Hold a key to hear that note; slide along the keys to glide. Run plays the range up and back; Chord plays all three on a warm white.
                </p>
                {CHANNELS.map((c) => {
                  const inst = settings.rgb.instruments[c];
                  return (
                    <div
                      key={c}
                      data-instrument={c}
                      className="grid grid-cols-1 items-end gap-4 rounded-lg border-l-4 bg-background/60 p-3 md:grid-cols-[9rem_1fr_9rem_1.4fr_1fr_auto]"
                      style={{ borderLeftColor: CHANNEL_INK[c], backgroundColor: withAlpha(CHANNEL_INK[c], 10) }}
                    >
                      <label className="flex flex-col gap-1.5">
                        <span className="text-base font-semibold" style={{ color: CHANNEL_INK[c] }}>{CHANNEL_NAME[c]}</span>
                        <Input
                          aria-label={`${CHANNEL_NAME[c]} instrument name`}
                          className="h-9 text-base md:text-base"
                          maxLength={24}
                          value={inst.name}
                          placeholder={DEFAULT_NAMES[c]}
                          onChange={(e) => setInstrument(c, { name: e.currentTarget.value })}
                        />
                      </label>
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
                      <div className="md:col-span-6">
                        <AuditionStrip ch={c} cfg={rgbCfg} engine={engine} ink={CHANNEL_INK[c]} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </LabSection>
          )}
          </div>
          </LabSection>
        </section>

        {/* The transport: what you reach for while listening, next to what you are listening to. */}
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border p-3" data-transport="">
          <Button size="lg" className="w-28 text-base" onClick={toggle} aria-pressed={playing}>
            {playing ? <><Square /> Stop</> : <><Play /> Play</>}
          </Button>
          <Button size="lg" variant="outline" className="text-base" onClick={playAll}>
            <Play /> Play all
          </Button>
          <Button size="lg" variant={settings.loop ? 'secondary' : 'outline'} className="text-base" aria-pressed={settings.loop}
            onClick={() => set('loop', !settings.loop)}
            title={settings.loop ? 'Looping - click to play each track once' : 'Plays each track once - click to loop'}>
            <Repeat /> {settings.loop ? 'Loop on' : 'Loop off'}
          </Button>
          <select
            aria-label="Load song"
            className="h-9 min-w-48 grow basis-48 max-sm:basis-full rounded-lg border border-border bg-background px-2 text-base text-foreground"
            value=""
            onChange={(e) => { if (e.currentTarget.value) loadSong(e.currentTarget.value); }}
          >
            <option value="">Load song...</option>
            {SONG_MENU.map((g) => (
              <optgroup key={g.mode} label={MODE_TITLE[g.mode]}>
                {g.songs.map(([k, name]) => <option key={k} value={k}>{name}</option>)}
              </optgroup>
            ))}
          </select>
          <Button size="lg" variant="outline" className="text-base" onClick={addTrack} disabled={settings.tracks.length >= MAX_TRACKS}
            aria-label="Add a track">
            <Plus /> Track
          </Button>
          <Button size="lg" variant="outline" className="text-base" onClick={share} aria-label="Share all tracks">
            <Link /> Share
          </Button>
          <Button size="lg" variant="outline" className="ml-auto text-base" onClick={reload}>
            <RefreshCw /> Reload swatches
          </Button>
          {shareLink && (
            <div className="flex w-full flex-col gap-1.5">
              <span className="text-base text-muted-foreground">
                {shareLink.copied ? 'Link copied. ' : 'Share link - '}
                opening it loads these {shareLink.tracks} track{shareLink.tracks === 1 ? '' : 's'} and their settings.
              </span>
              <Input readOnly value={shareLink.url} aria-label="Share link"
                className="h-9 font-mono text-base md:text-base" onFocus={(e) => e.currentTarget.select()} />
            </div>
          )}
        </div>

        {settings.tracks.map((t, i) => {
          const rowSteps = steps[i];
          const name = trackLetter(i);
          return (
            <section key={t.id} className="flex flex-col gap-4 rounded-xl border border-border p-4" data-track={name}>
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
                <Button variant="ghost" size="icon" aria-label={`Remove track ${name}`} disabled={settings.tracks.length <= 1}
                  onClick={() => (t.custom.length > 0 ? setRemoving(t.id) : removeTrack(t.id))}>
                  <X />
                </Button>
              </div>
              {removing === t.id && (
                <div className="flex flex-wrap items-center gap-2" data-confirm="remove-track">
                  <span className="text-base">Remove Track {name}? Its Custom row ({t.custom.length} step{t.custom.length === 1 ? '' : 's'}) goes with it.</span>
                  <Button variant="destructive" className="text-base" onClick={() => removeTrack(t.id)}>Remove</Button>
                  <Button variant="outline" className="text-base" onClick={() => setRemoving(null)}>Keep</Button>
                </div>
              )}
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
                      // The marks read the alpha notch itself, so a hold shows even where it has nothing to hold.
                      const kind = slot ? alphaToStepKind(slot.alpha) : null;
                      const silence = !!kind?.silence;
                      const held = kind && !kind.silence ? heldChannels(kind.mask) : [];
                      const isSel = sel?.track === i && sel.step === si;
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
                                ref={(el: HTMLElement | null) => { (cellRefs.current[i] ??= [])[si] = el; }}
                                data-step={si}
                                data-selected={isSel || undefined}
                                onClick={() => setSelected({ track: i, step: si })}
                                aria-label={`Track ${name} step ${si + 1}: ${s.rest ? s.label : s.detail}`}
                                className={
                                  'aspect-square w-full cursor-pointer rounded-md border border-border transition-transform duration-75 '
                                  + 'focus-visible:outline-2 focus-visible:outline-ring '
                                  + 'data-selected:outline-3 data-selected:outline-offset-2 data-selected:outline-foreground '
                                  + 'data-active:scale-110 data-active:ring-3 data-active:ring-foreground '
                                  + 'relative '
                                  + (slot ? '' : 'border-dashed bg-muted/40')
                                }
                                data-hold={held.length ? held.join('') : undefined}
                                data-silence={silence || undefined}
                                // Alpha is no longer transparency: every cell is its solid colour, except a
                                // silence, faded and struck through - at its real alpha 0 it would vanish.
                                style={slot ? { backgroundColor: withAlpha(slot.hex, silence ? 35 : 100) } : undefined}
                                title={slot ? `${slot.hex} alpha ${slot.alpha} - ${s.rest ? s.label : s.detail}` : 'empty slot'}
                              >
                                {silence && (
                                  <svg aria-hidden viewBox="0 0 10 10" preserveAspectRatio="none" className="pointer-events-none absolute inset-0 size-full">
                                    <line x1="1" y1="9" x2="9" y2="1" className="stroke-foreground" strokeWidth={2} strokeLinecap="round" vectorEffect="non-scaling-stroke" />
                                  </svg>
                                )}
                                {held.length > 0 && mode !== 'rgb' && (
                                  <span aria-hidden data-tick="hold"
                                    className="absolute bottom-1 left-1/2 h-1.5 w-3/5 -translate-x-1/2 rounded-full border border-foreground bg-background" />
                                )}
                                {held.length > 0 && mode === 'rgb' && (
                                  <span aria-hidden className="pointer-events-none absolute inset-x-1 bottom-1 flex justify-between">
                                    {CHANNELS.map((ch) => (
                                      <span key={ch} data-tick={held.includes(ch) ? ch : undefined}
                                        title={held.includes(ch) ? `${instrumentName(ch, configs[i])} holds` : undefined}
                                        className={'h-2.5 w-1.5 rounded-sm ' + (held.includes(ch) ? 'ring-1 ring-background' : 'invisible')}
                                        style={held.includes(ch) ? { backgroundColor: CHANNEL_INK[ch] } : undefined} />
                                    ))}
                                  </span>
                                )}
                              </PopoverTrigger>
                              <PopoverContent className="w-96 p-3 text-base">
                                <SequencerStepEditor
                                  slot={slot}
                                  prevHex={slots[i][(si + slots[i].length - 1) % slots[i].length]?.hex ?? null}
                                  cfg={configs[i]}
                                  onChange={(next) => editTrack(i, (row) => { row[si] = next; return row; })}
                                />
                              </PopoverContent>
                            </Popover>
                            {/* RGB Instruments plays three notes a cell - too many to print; the tooltip and aria-label carry them. */}
                            {mode !== 'rgb' && (
                              <span data-label={si} className={'w-full truncate text-center text-base leading-tight ' + (s.rest ? 'text-muted-foreground' : 'text-foreground')}>
                                {s.label}
                              </span>
                            )}
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

        <aside className="flex flex-col gap-4 rounded-xl border border-border p-4 lg:sticky lg:top-4 lg:row-span-2 lg:max-h-[calc(100vh-2rem)] lg:self-start lg:overflow-y-auto">
          <SequencerCellEditor
            ref={editorRef}
            selectionKey={sel ? `${sel.track}:${sel.step}` : null}
            title={sel ? `Track ${trackLetter(sel.track)}, step ${sel.step + 1}${selSlot ? '' : ' (empty - an edit fills it)'}` : 'No step selected'}
            slot={selSlot}
            step={sel ? steps[sel.track][sel.step] ?? null : null}
            cfg={configs[sel?.track ?? 0]}
            snap={settings.snap}
            onSnapChange={(v) => set('snap', v)}
            onChange={writeSelected}
            onLive={onLive}
            follow={follow}
            onFollow={pickFollow}
            followPaused={followPaused}
            onGrab={onGrab}
            trackNames={settings.tracks.map((_, i) => trackLetter(i))}
          />
        </aside>

        <SequencerLibrary
          library={settings.library}
          trackCount={settings.tracks.length}
          dirty={settings.dirty}
          onSave={saveArrangement}
          onLoad={loadArrangement}
          onRename={(id, name) => setSettings((s) => ({ ...s, library: s.library.map((t) => (t.id === id ? { ...t, name } : t)) }))}
          onDelete={(id) => setSettings((s) => ({ ...s, library: s.library.filter((t) => t.id !== id) }))}
          onImport={(list) => setSettings((s) => ({ ...s, library: [...s.library, ...list] }))}
        />
        </div>
      </div>
    </div>
  );
}
