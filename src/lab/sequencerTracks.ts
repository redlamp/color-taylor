/**
 * Saved tracks, their JSON file and the share link - the pure half, no DOM, so
 * the round trips are unit-tested (sequencerTracks.test.ts).
 *
 * A snapshot is a row of slots plus the settings it was made with: the mode,
 * that mode's own settings, tempo, subdivision, gate, glide and the track's
 * octave. Loading one puts the settings back too, because a row of colours
 * only means the same music under the mapping it was written for.
 */
import { CHANNELS, DEFAULT_NAMES, NOTE_NAMES, SCALES, type Channel, type ScaleName, type SeqMode, type Slot, type Subdivision } from './sequencer';
import type { Wave } from './sequencerEngine';

export interface MelodySettings { scale: ScaleName; root: number; baseOctave: number; octaveRange: number; wave: Wave }
export interface ChordsSettings { root: number; baseOctave: number; wave: Wave }
export interface InstrumentCfg { name: string; octave: number; range: number; wave: Wave; level: number; muted: boolean }
export interface RgbSettings { scale: ScaleName; root: number; instruments: Record<Channel, InstrumentCfg> }

export interface TrackSnapshot {
  name: string;
  steps: Slot[];
  mode: SeqMode;
  bpm: number;
  subdivision: Subdivision;
  gatePct: number;
  glideMs: number;
  /** The track's own octave offset. */
  octave: number;
  /** Only the snapshot's own mode's settings are present. */
  melody?: MelodySettings;
  chords?: ChordsSettings;
  rgb?: RgbSettings;
}

export interface SavedTrack extends TrackSnapshot { id: string; savedAt: number }

export const FILE_FORMAT = 'color-taylor-sequencer';

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

// --- validation (shared by the file import and the share link) ---------------

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

/** A snapshot from anything - a stored entry, a file, a decoded link. Null if it has no steps array. */
export function snapshotFrom(v: unknown): TrackSnapshot | null {
  if (!v || typeof v !== 'object') return null;
  const o = v as Record<string, unknown>;
  if (!Array.isArray(o.steps)) return null;
  const mode = oneOf(o.mode, MODES, 'melody');
  const snap: TrackSnapshot = {
    name: typeof o.name === 'string' && o.name.trim() ? o.name.trim().slice(0, 80) : 'Untitled track',
    steps: o.steps.slice(0, 256).map(slotFrom),
    mode,
    bpm: clampInt(o.bpm, 40, 240, 110),
    subdivision: oneOf(Number(o.subdivision) as Subdivision, SUBDIVISIONS, 8),
    gatePct: clampInt(o.gatePct, 5, 100, 70),
    glideMs: clampInt(o.glideMs, 0, 300, 40),
    octave: clampInt(o.octave, -2, 2, 0),
  };
  if (mode === 'melody') snap.melody = melodyFrom(o.melody);
  if (mode === 'chords') snap.chords = chordsFrom(o.chords);
  if (mode === 'rgb') snap.rgb = rgbFrom(o.rgb);
  return snap;
}

export function newId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

/** The stored library, or a file's `tracks`. Bad entries are dropped, not fatal. */
export function parseLibrary(raw: unknown): SavedTrack[] {
  const list = Array.isArray(raw) ? raw : (raw && typeof raw === 'object' && Array.isArray((raw as { tracks?: unknown }).tracks)
    ? (raw as { tracks: unknown[] }).tracks : []);
  const out: SavedTrack[] = [];
  for (const v of list) {
    const snap = snapshotFrom(v);
    if (!snap) continue;
    const o = v as { id?: unknown; savedAt?: unknown };
    out.push({
      ...snap,
      id: typeof o.id === 'string' && o.id ? o.id : newId(),
      savedAt: typeof o.savedAt === 'number' ? o.savedAt : Date.now(),
    });
  }
  return out;
}

/** The export file's contents. */
export function libraryFile(tracks: readonly SavedTrack[]): string {
  return JSON.stringify({ format: FILE_FORMAT, version: 1, tracks }, null, 2);
}

// --- the share link -------------------------------------------------------

/*
 * `#seq=` then `;`-separated `key:value` fields, the steps last:
 *
 *   v1;nm:Riff;m:melody;t:110;d:8;g:70;l:40;o:0;s:pentatonic;r:0;b:3;n:2;w:triangle;x:ff0000,00ff00@50,.
 *
 * Steps are hex without the hash, `@alpha` only where alpha is not 100 (so a
 * tie is `@0`), and `.` for an empty slot. RGB Instruments carries its three
 * instruments as `i:` octave.range.wave.level.muted.name, joined by `_` in R
 * G B order. Everything is URL-safe as written except the names, which are
 * percent-encoded - separators included.
 */
export const SHARE_PREFIX = 'seq=';

export function encodeSteps(steps: readonly Slot[]): string {
  return steps.map((s) => (s ? `${s.hex.replace('#', '').toLowerCase()}${s.alpha === 100 ? '' : `@${s.alpha}`}` : '.')).join(',');
}

export function decodeSteps(text: string): Slot[] {
  if (!text) return [];
  return text.split(',').map((tok) => {
    if (tok === '.' || tok === '') return null;
    const [hex, alpha] = tok.split('@');
    return slotFrom({ hex, alpha: alpha === undefined ? 100 : Number(alpha) });
  });
}

export function encodeShare(snap: TrackSnapshot): string {
  const f: [string, string | number][] = [
    ['nm', encodeField(snap.name)], ['m', snap.mode], ['t', snap.bpm], ['d', snap.subdivision],
    ['g', snap.gatePct], ['l', snap.glideMs], ['o', snap.octave],
  ];
  if (snap.mode === 'melody' && snap.melody) {
    const m = snap.melody;
    f.push(['s', m.scale], ['r', m.root], ['b', m.baseOctave], ['n', m.octaveRange], ['w', m.wave]);
  } else if (snap.mode === 'chords' && snap.chords) {
    const c = snap.chords;
    f.push(['r', c.root], ['b', c.baseOctave], ['w', c.wave]);
  } else if (snap.mode === 'rgb' && snap.rgb) {
    const r = snap.rgb;
    f.push(['s', r.scale], ['r', r.root], ['i', CHANNELS.map((ch) => {
      const x = r.instruments[ch];
      return [x.octave, x.range, x.wave, x.level, x.muted ? 1 : 0, encodeField(x.name)].join('.');
    }).join('_')]);
  }
  f.push(['x', encodeSteps(snap.steps)]);
  return `${SHARE_PREFIX}v1;${f.map(([k, v]) => `${k}:${v}`).join(';')}`;
}

/** A hash (with or without `#`) back to a snapshot, or null if it isn't a share link. */
export function decodeShare(hash: string): TrackSnapshot | null {
  const body = hash.replace(/^#/, '');
  if (!body.startsWith(SHARE_PREFIX)) return null;
  const parts = body.slice(SHARE_PREFIX.length).split(';');
  if (parts[0] !== 'v1') return null;
  const f: Record<string, string> = {};
  for (const p of parts.slice(1)) {
    const at = p.indexOf(':');
    if (at > 0) f[p.slice(0, at)] = p.slice(at + 1);
  }
  if (f.x === undefined) return null;
  const name = f.nm ? decodeField(f.nm, 'Shared track') : 'Shared track';
  const raw: Record<string, unknown> = {
    name, steps: [], mode: f.m, bpm: f.t, subdivision: f.d, gatePct: f.g, glideMs: f.l, octave: f.o,
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
  const snap = snapshotFrom(raw);
  if (!snap) return null;
  snap.steps = decodeSteps(f.x);
  return snap;
}

/** A one-line summary for the library list: "Hue Melody - D major - 16 steps - 100 BPM". */
export function describe(snap: TrackSnapshot): string {
  const mode = snap.mode === 'melody' ? 'Hue Melody' : snap.mode === 'chords' ? 'Hue Chords' : 'RGB Instruments';
  const key = snap.mode === 'melody' && snap.melody ? `${NOTE_NAMES[snap.melody.root]} ${snap.melody.scale}`
    : snap.mode === 'chords' && snap.chords ? `root ${NOTE_NAMES[snap.chords.root]}`
      : snap.rgb ? `${NOTE_NAMES[snap.rgb.root]} ${snap.rgb.scale}` : '';
  return [mode, key, `${snap.steps.length} step${snap.steps.length === 1 ? '' : 's'}`, `${snap.bpm} BPM`].filter(Boolean).join(' - ');
}
