/**
 * Saved arrangements, their JSON file and the share link - the pure half, no
 * DOM, so the round trips are unit-tested (sequencerTracks.test.ts).
 *
 * An arrangement is every track - each one's row, octave, on and mute - plus
 * the settings they were made with: the mode, that mode's own settings (the
 * instruments and their names included), tempo, subdivision, gate and glide.
 * Loading one puts the settings back too, because a row of colours only means
 * the same music under the mapping it was written for. Entries saved before
 * arrangements were single tracks; they are migrated on read (arrangementFrom).
 *
 * Alpha changed meaning with the hold notches (sequencer.ts, alphaToStepKind):
 * data written before them - file version 1 and 2, links v1 and v2, the
 * bench's stored settings before version 5 - is read with `legacyAlpha`, and
 * each row goes through migrateLegacyRow under the arrangement's own mapping.
 */
import {
  CHANNELS, DEFAULT_NAMES, NOTE_NAMES, SCALES, SCALE_LABELS, migrateLegacyRow,
  type Channel, type MapConfig, type ScaleName, type SeqMode, type Slot, type Subdivision,
} from './sequencer';
import type { Wave } from './sequencerEngine';

export interface MelodySettings { scale: ScaleName; root: number; baseOctave: number; octaveRange: number; wave: Wave }
export interface ChordsSettings { root: number; baseOctave: number; wave: Wave }
export interface InstrumentCfg { name: string; octave: number; range: number; wave: Wave; level: number; muted: boolean }
export interface RgbSettings { scale: ScaleName; root: number; instruments: Record<Channel, InstrumentCfg> }

/** One track of an arrangement: its row and its own settings. */
export interface ArrangementTrack {
  steps: Slot[];
  /** The track's own octave offset. */
  octave: number;
  enabled: boolean;
  muted: boolean;
  /**
   * The built-in source the row came from (a palette or a song part), so a
   * load can put the track back on it. A hint only: `steps` is the truth, and
   * the bench loads the track as Custom when the hint is missing or no longer
   * matches.
   */
  source?: string;
}

export interface Arrangement {
  name: string;
  mode: SeqMode;
  bpm: number;
  subdivision: Subdivision;
  gatePct: number;
  glideMs: number;
  /** false: each track plays through once. Absent is on (looping), as before the switch existed. */
  loop?: boolean;
  /** Only the arrangement's own mode's settings are present. */
  melody?: MelodySettings;
  chords?: ChordsSettings;
  rgb?: RgbSettings;
  /** 1..MAX_TRACKS, in order: the first is Track A. */
  tracks: ArrangementTrack[];
}

export interface SavedArrangement extends Arrangement { id: string; savedAt: number }

export const MAX_TRACKS = 6;
const MAX_STEPS = 256;
/** A source hint is a short key like `rainbow` or `ode-melody`, never free text. */
const SOURCE_HINT = /^[a-z][a-z0-9-]{0,31}$/;

export const FILE_FORMAT = 'color-taylor-sequencer';
/** The export file's version. 3 is the first with the alpha hold notches; 1 and 2 are migrated on import. */
export const FILE_VERSION = 3;
/** The share link's version. v3 is the first with the alpha hold notches; v1 and v2 are migrated on open. */
export const SHARE_VERSION = 'v3';

const WAVES: readonly Wave[] = ['triangle', 'sine', 'sawtooth', 'square'];
const SCALE_NAMES = Object.keys(SCALES) as ScaleName[];
const MODES: readonly SeqMode[] = ['melody', 'chords', 'rgb'];
const SUBDIVISIONS: readonly Subdivision[] = [4, 8, 16];

const clampInt = (v: unknown, lo: number, hi: number, dflt: number) => {
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) ? Math.min(hi, Math.max(lo, Math.round(n))) : dflt;
};
const oneOf = <T>(v: unknown, list: readonly T[], dflt: T): T => (list.includes(v as T) ? (v as T) : dflt);
const HEX = /^#?([0-9a-f]{6})$/i;

/** An instrument name: trimmed, at most 24 characters, the default when blank. */
export function cleanName(v: unknown, dflt: string): string {
  return typeof v === 'string' && v.trim() ? v.trim().slice(0, 24) : dflt;
}

/** Percent-encoding that also covers the link's own separators, which encodeURIComponent leaves alone. */
const encodeField = (v: string) => encodeURIComponent(v).replace(/[._~!'()*-]/g, (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`);
const decodeField = (v: string, dflt: string) => {
  try { return decodeURIComponent(v); } catch { return dflt; }
};

// --- validation (shared by the stored library, the file import and the share link)

function slotFrom(v: unknown): Slot {
  if (!v || typeof v !== 'object') return null;
  const o = v as { hex?: unknown; alpha?: unknown };
  const m = typeof o.hex === 'string' ? HEX.exec(o.hex) : null;
  if (!m) return null;
  return { hex: `#${m[1].toLowerCase()}`, alpha: clampInt(o.alpha, 0, 100, 100) };
}

function melodyFrom(v: unknown): MelodySettings {
  const o = (v ?? {}) as Partial<Record<keyof MelodySettings, unknown>>;
  return {
    scale: oneOf(o.scale, SCALE_NAMES, 'pentatonic'),
    root: clampInt(o.root, 0, 11, 0),
    baseOctave: clampInt(o.baseOctave, 1, 5, 3),
    octaveRange: clampInt(o.octaveRange, 1, 3, 2),
    wave: oneOf(o.wave, WAVES, 'triangle'),
  };
}

function chordsFrom(v: unknown): ChordsSettings {
  const o = (v ?? {}) as Partial<Record<keyof ChordsSettings, unknown>>;
  return { root: clampInt(o.root, 0, 11, 0), baseOctave: clampInt(o.baseOctave, 1, 5, 3), wave: oneOf(o.wave, WAVES, 'triangle') };
}

const DEFAULT_INSTRUMENTS: Record<Channel, InstrumentCfg> = {
  r: { name: DEFAULT_NAMES.r, octave: 2, range: 1, wave: 'sine', level: 90, muted: false },
  g: { name: DEFAULT_NAMES.g, octave: 3, range: 2, wave: 'triangle', level: 70, muted: false },
  b: { name: DEFAULT_NAMES.b, octave: 4, range: 2, wave: 'sawtooth', level: 70, muted: false },
};

function instrumentFrom(v: unknown, dflt: InstrumentCfg): InstrumentCfg {
  const o = (v ?? {}) as Partial<Record<keyof InstrumentCfg, unknown>>;
  return {
    name: cleanName(o.name, dflt.name),
    octave: clampInt(o.octave, 1, 5, dflt.octave),
    range: clampInt(o.range, 1, 3, dflt.range),
    wave: oneOf(o.wave, WAVES, dflt.wave),
    level: clampInt(o.level, 0, 100, dflt.level),
    muted: o.muted === true,
  };
}

function rgbFrom(v: unknown): RgbSettings {
  const o = (v ?? {}) as { scale?: unknown; root?: unknown; instruments?: Partial<Record<Channel, unknown>> };
  const inst = o.instruments ?? {};
  return {
    scale: oneOf(o.scale, SCALE_NAMES, 'pentatonic'),
    root: clampInt(o.root, 0, 11, 0),
    instruments: {
      r: instrumentFrom(inst.r, DEFAULT_INSTRUMENTS.r),
      g: instrumentFrom(inst.g, DEFAULT_INSTRUMENTS.g),
      b: instrumentFrom(inst.b, DEFAULT_INSTRUMENTS.b),
    },
  };
}

type Shared = Omit<Arrangement, 'name' | 'tracks'>;

/** The settings every arrangement carries, whatever its tracks: mode, timing and that mode's own settings. */
function sharedFrom(o: Record<string, unknown>): Shared {
  const mode = oneOf(o.mode, MODES, 'melody');
  const out: Shared = {
    mode,
    bpm: clampInt(o.bpm, 40, 240, 110),
    subdivision: oneOf(Number(o.subdivision) as Subdivision, SUBDIVISIONS, 8),
    gatePct: clampInt(o.gatePct, 5, 100, 70),
    glideMs: clampInt(o.glideMs, 0, 300, 40),
  };
  if (o.loop === false) out.loop = false;
  if (mode === 'melody') out.melody = melodyFrom(o.melody);
  if (mode === 'chords') out.chords = chordsFrom(o.chords);
  if (mode === 'rgb') out.rgb = rgbFrom(o.rgb);
  return out;
}

const stepsFrom = (v: readonly unknown[]) => v.slice(0, MAX_STEPS).map(slotFrom);

function trackFrom(v: unknown): ArrangementTrack | null {
  if (!v || typeof v !== 'object') return null;
  const o = v as Record<string, unknown>;
  if (!Array.isArray(o.steps)) return null;
  const t: ArrangementTrack = {
    steps: stepsFrom(o.steps),
    octave: clampInt(o.octave, -2, 2, 0),
    enabled: o.enabled !== false,
    muted: o.muted === true,
  };
  if (typeof o.source === 'string' && SOURCE_HINT.test(o.source)) t.source = o.source;
  return t;
}

/** The mapping a track of `arr` plays under - the same one the bench builds from its settings. */
export function arrangementConfig(arr: Shared, octaveOffset: number): MapConfig {
  if (arr.mode === 'rgb') {
    const r = arr.rgb ?? rgbFrom(undefined);
    const inst = r.instruments;
    return {
      mode: 'rgb', scale: r.scale, root: r.root, octaveRange: 1, octaveOffset,
      ranges: { r: inst.r, g: inst.g, b: inst.b }, names: { r: inst.r.name, g: inst.g.name, b: inst.b.name },
    };
  }
  if (arr.mode === 'chords') {
    const c = arr.chords ?? chordsFrom(undefined);
    return { mode: 'chords', scale: 'major', octaveRange: 1, root: c.root, baseOctave: c.baseOctave, octaveOffset };
  }
  const m = arr.melody ?? melodyFrom(undefined);
  return { mode: 'melody', scale: m.scale, root: m.root, octaveRange: m.octaveRange, baseOctave: m.baseOctave, octaveOffset };
}

/**
 * An arrangement from anything - a stored entry, a file, a decoded link. Null
 * if it has no tracks. A single-track snapshot from before arrangements (a
 * `steps` array and the track's `octave` at the top level) is migrated into a
 * one-track arrangement rather than dropped. `legacyAlpha`: the rows were
 * written before the hold notches, and are migrated into them.
 */
export function arrangementFrom(v: unknown, legacyAlpha = false): Arrangement | null {
  if (!v || typeof v !== 'object') return null;
  const o = v as Record<string, unknown>;
  let tracks: ArrangementTrack[];
  if (Array.isArray(o.tracks)) {
    tracks = o.tracks.slice(0, MAX_TRACKS).map(trackFrom).filter((t): t is ArrangementTrack => t !== null);
  } else if (Array.isArray(o.steps)) {
    tracks = [{ steps: stepsFrom(o.steps), octave: clampInt(o.octave, -2, 2, 0), enabled: true, muted: false }];
  } else {
    return null;
  }
  if (tracks.length === 0) return null;
  const name = typeof o.name === 'string' && o.name.trim() ? o.name.trim().slice(0, 80) : 'Untitled';
  const shared = sharedFrom(o);
  if (legacyAlpha) for (const t of tracks) t.steps = migrateLegacyRow(t.steps, arrangementConfig(shared, t.octave));
  return { name, ...shared, tracks };
}

export function newId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * The stored library, or a file's `arrangements` (version 2 and 3) or
 * `tracks` (version 1: single-track snapshots). Bad entries are dropped, not
 * fatal. A file says for itself whether it predates the hold notches (a
 * version under 3, or none); a bare list - the bench's stored library - is
 * as old as `legacyAlpha` says.
 */
export function parseLibrary(raw: unknown, legacyAlpha = false): SavedArrangement[] {
  const o = (raw && typeof raw === 'object' ? raw : {}) as { arrangements?: unknown; tracks?: unknown; version?: unknown };
  const list: unknown[] = Array.isArray(raw) ? raw
    : Array.isArray(o.arrangements) ? o.arrangements
      : Array.isArray(o.tracks) ? o.tracks : [];
  const legacy = Array.isArray(raw) ? legacyAlpha : !(typeof o.version === 'number' && o.version >= FILE_VERSION);
  const out: SavedArrangement[] = [];
  for (const v of list) {
    const arr = arrangementFrom(v, legacy);
    if (!arr) continue;
    const e = v as { id?: unknown; savedAt?: unknown };
    out.push({
      ...arr,
      id: typeof e.id === 'string' && e.id ? e.id : newId(),
      savedAt: typeof e.savedAt === 'number' ? e.savedAt : Date.now(),
    });
  }
  return out;
}

/** The export file's contents. */
export function libraryFile(arrangements: readonly SavedArrangement[]): string {
  return JSON.stringify({ format: FILE_FORMAT, version: FILE_VERSION, arrangements }, null, 2);
}

// --- the share link -------------------------------------------------------

/*
 * `#seq=v3` then `;`-separated `key:value` fields:
 *
 *   v3;nm:Riff;m:melody;t:110;d:8;g:70;l:40;s:pentatonic;r:0;b:3;n:2;w:triangle;k:2;
 *     o0:0;f0:1;x0:ff0000,00ff00@50,.;o1:-1;f1:3;c1:pulse;x1:...
 *
 * The arrangement's settings first (`lp:0` only when it plays once), then `k` tracks, each as `o<i>` octave,
 * `f<i>` flags (1 on, 2 muted), an optional `c<i>` built-in source hint and
 * `x<i>` its steps. Steps are hex without the hash, `@alpha` only where alpha
 * is not 100 (a tie is `@13`, a silence `@0`), and `.` for an empty slot. RGB Instruments
 * carries its three instruments as `i:` octave.range.wave.level.muted.name,
 * joined by `_` in R G B order. Everything is URL-safe as written except the
 * names, which are percent-encoded - separators included.
 *
 * `v2` links are the same fields from before the hold notches: their steps
 * are migrated. `v1` links - one track, `o` and `x` with no index - still
 * open, as a migrated one-track arrangement.
 */
export const SHARE_PREFIX = 'seq=';

export function encodeSteps(steps: readonly Slot[]): string {
  return steps.map((s) => (s ? `${s.hex.replace('#', '').toLowerCase()}${s.alpha === 100 ? '' : `@${s.alpha}`}` : '.')).join(',');
}

export function decodeSteps(text: string): Slot[] {
  if (!text) return [];
  return text.split(',').slice(0, MAX_STEPS).map((tok) => {
    if (tok === '.' || tok === '') return null;
    const [hex, alpha] = tok.split('@');
    return slotFrom({ hex, alpha: alpha === undefined ? 100 : Number(alpha) });
  });
}

export function encodeShare(arr: Arrangement): string {
  const f: [string, string | number][] = [
    ['nm', encodeField(arr.name)], ['m', arr.mode], ['t', arr.bpm], ['d', arr.subdivision], ['g', arr.gatePct], ['l', arr.glideMs],
  ];
  if (arr.loop === false) f.push(['lp', 0]);
  if (arr.mode === 'melody' && arr.melody) {
    const m = arr.melody;
    f.push(['s', m.scale], ['r', m.root], ['b', m.baseOctave], ['n', m.octaveRange], ['w', m.wave]);
  } else if (arr.mode === 'chords' && arr.chords) {
    const c = arr.chords;
    f.push(['r', c.root], ['b', c.baseOctave], ['w', c.wave]);
  } else if (arr.mode === 'rgb' && arr.rgb) {
    const r = arr.rgb;
    f.push(['s', r.scale], ['r', r.root], ['i', CHANNELS.map((ch) => {
      const x = r.instruments[ch];
      return [x.octave, x.range, x.wave, x.level, x.muted ? 1 : 0, encodeField(x.name)].join('.');
    }).join('_')]);
  }
  f.push(['k', arr.tracks.length]);
  arr.tracks.forEach((t, i) => {
    f.push([`o${i}`, t.octave], [`f${i}`, (t.enabled ? 1 : 0) + (t.muted ? 2 : 0)]);
    if (t.source) f.push([`c${i}`, t.source]);
    f.push([`x${i}`, encodeSteps(t.steps)]);
  });
  return `${SHARE_PREFIX}${SHARE_VERSION};${f.map(([k, v]) => `${k}:${v}`).join(';')}`;
}

/** A hash (with or without `#`) back to an arrangement, or null if it isn't a share link. */
export function decodeShare(hash: string): Arrangement | null {
  const body = hash.replace(/^#/, '');
  if (!body.startsWith(SHARE_PREFIX)) return null;
  const parts = body.slice(SHARE_PREFIX.length).split(';');
  const version = parts[0];
  if (version !== 'v1' && version !== 'v2' && version !== SHARE_VERSION) return null;
  const f: Record<string, string> = {};
  for (const p of parts.slice(1)) {
    const at = p.indexOf(':');
    if (at > 0) f[p.slice(0, at)] = p.slice(at + 1);
  }
  const raw: Record<string, unknown> = {
    name: f.nm ? decodeField(f.nm, 'Shared') : 'Shared', mode: f.m, bpm: f.t, subdivision: f.d, gatePct: f.g, glideMs: f.l,
    loop: f.lp !== '0',
  };
  if (f.m === 'melody') raw.melody = { scale: f.s, root: f.r, baseOctave: f.b, octaveRange: f.n, wave: f.w };
  if (f.m === 'chords') raw.chords = { root: f.r, baseOctave: f.b, wave: f.w };
  if (f.m === 'rgb') {
    const inst = (f.i ?? '').split('_').map((one) => {
      const [octave, range, wave, level, muted, nm] = one.split('.');
      return { octave, range, wave, level, muted: muted === '1', name: nm === undefined ? undefined : decodeField(nm, '') };
    });
    raw.rgb = { scale: f.s, root: f.r, instruments: { r: inst[0], g: inst[1], b: inst[2] } };
  }

  // Steps are decoded after validation: the validator takes objects, the link carries tokens.
  const rows: string[] = [];
  if (version === 'v1') {
    if (f.x === undefined) return null;
    rows.push(f.x);
    raw.tracks = [{ steps: [], octave: f.o }];
  } else {
    const tracks: Record<string, unknown>[] = [];
    for (let i = 0; i < clampInt(f.k, 0, MAX_TRACKS, 0); i++) {
      if (f[`x${i}`] === undefined) continue;
      const flags = clampInt(f[`f${i}`], 0, 3, 1);
      rows.push(f[`x${i}`]);
      tracks.push({ steps: [], octave: f[`o${i}`], enabled: (flags & 1) === 1, muted: (flags & 2) === 2, source: f[`c${i}`] });
    }
    raw.tracks = tracks;
  }
  const arr = arrangementFrom(raw);
  if (!arr) return null;
  const legacy = version !== SHARE_VERSION;
  arr.tracks.forEach((t, i) => {
    const steps = decodeSteps(rows[i]);
    t.steps = legacy ? migrateLegacyRow(steps, arrangementConfig(arr, t.octave)) : steps;
  });
  return arr;
}

const MODE_NAME: Record<SeqMode, string> = { melody: 'Hue Melody', chords: 'Hue Chords', rgb: 'RGB Instruments' };

const keyName = (root: number, scale: ScaleName) => `${NOTE_NAMES[root]} ${SCALE_LABELS[scale].toLowerCase()}`;

/** A one-line summary for the library list: "Hue Melody - D major - 2 tracks - 64 steps - 100 BPM". */
export function describe(arr: Arrangement): string {
  const key = arr.mode === 'melody' && arr.melody ? keyName(arr.melody.root, arr.melody.scale)
    : arr.mode === 'chords' && arr.chords ? `root ${NOTE_NAMES[arr.chords.root]}`
      : arr.rgb ? keyName(arr.rgb.root, arr.rgb.scale) : '';
  const n = arr.tracks.length;
  const steps = Math.max(0, ...arr.tracks.map((t) => t.steps.length));
  return [MODE_NAME[arr.mode], key, `${n} track${n === 1 ? '' : 's'}`, `${steps} step${steps === 1 ? '' : 's'}`, `${arr.bpm} BPM`]
    .filter(Boolean).join(' - ');
}
