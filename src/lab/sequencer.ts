/**
 * Swatch sequencer - the pure half. No audio, no DOM: a swatch goes in, a step
 * comes out, and the timing maths the engine schedules by lives here too, so
 * all of it is unit-tested (sequencer.test.ts).
 *
 * A step is one swatch played for one step length:
 *
 *   hue          pitch. Melody snaps it to the scale across the octave range;
 *                Chords picks a root on the circle of fifths.
 *   saturation   lowpass cutoff, exponential 200..8000 Hz
 *   brightness   velocity, (b/100)^1.5 - the app's curve. Below 3 it is a rest.
 *   alpha        multiplies velocity, so a see-through swatch is a ghost note
 *   alpha 0      a tie: the previous note carries on through this step with no
 *                retrigger. After a rest (or first in a row) it is a rest.
 *   null slot    a rest, so a Saved bank keeps its gaps as rhythm
 */
import { hexToRgb, hsbToRgb, rgbToHex, rgbToHsb } from '../utils/colorConversions';
import { midiToName } from '../utils/synthConfig';

export type ScaleName = 'pentatonic' | 'major' | 'minor' | 'chromatic';
/** 'chords' is Hue Chords (a circle-of-fifths triad); 'rgb' is RGB Instruments (a note per channel). */
export type SeqMode = 'melody' | 'chords' | 'rgb';
export type Channel = 'r' | 'g' | 'b';
export const CHANNELS: readonly Channel[] = ['r', 'g', 'b'];
export type Subdivision = 4 | 8 | 16;

export const SCALES: Record<ScaleName, readonly number[]> = {
  pentatonic: [0, 2, 4, 7, 9],
  major: [0, 2, 4, 5, 7, 9, 11],
  minor: [0, 2, 3, 5, 7, 8, 10],
  chromatic: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
};

export const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'] as const;

/** C3. The octave range climbs from here, the track's octave offset moves it. */
export const BASE_MIDI = 48;
/** Brightness (0-100) below this is a rest: near-black is silence, not a whisper. */
export const REST_BRIGHTNESS = 3;
/**
 * Chords mode: a swatch less saturated than this plays a minor triad. Greys and
 * pastels read as muted, so they get the darker chord; vivid colours are major.
 */
export const MINOR_SATURATION = 35;
export const CUTOFF_MIN = 200;
export const CUTOFF_MAX = 8000;
const VELOCITY_CURVE = 1.5;

export interface SwatchIn { hex: string; alpha: number }
/** A source is a row of slots; null is an empty slot and plays as a rest. */
export type Slot = SwatchIn | null;

export interface MapConfig {
  mode: SeqMode;
  scale: ScaleName;
  /** Pitch class of the key, 0 = C. */
  root: number;
  /** 1..3 octaves the hue circle is spread across (Melody mode). */
  octaveRange: number;
  /** The track's own shift, -2..+2. */
  octaveOffset: number;
  /** Hue modes: the octave whose C is the bottom of the range (3 = C3). Default 3. */
  baseOctave?: number;
  /** RGB Instruments: each channel's own base octave and range. DEFAULT_RANGES when absent. */
  ranges?: Record<Channel, ChannelRange>;
  /** RGB Instruments: what each channel's instrument is called. DEFAULT_NAMES when absent. */
  names?: Record<Channel, string>;
}

/** The instruments' default names, in physics order. */
export const DEFAULT_NAMES: Record<Channel, string> = { r: 'Bass', g: 'Harmony', b: 'Lead' };

/** Channel `ch`'s instrument name under `cfg`. */
export function instrumentName(ch: Channel, cfg: Pick<MapConfig, 'names'>): string {
  return cfg.names?.[ch]?.trim() || DEFAULT_NAMES[ch];
}

/** An RGB-chords instrument's pitch span: base octave (2 = C2 plus the root) and 1..3 octaves. */
export interface ChannelRange { octave: number; range: number }

/**
 * Physics order: red is the lowest frequency of visible light, so R is the
 * bass, G the middle voice and B the lead.
 */
export const DEFAULT_RANGES: Record<Channel, ChannelRange> = {
  r: { octave: 2, range: 1 },
  g: { octave: 3, range: 2 },
  b: { octave: 4, range: 2 },
};
/** RGB Instruments: a channel below this is silent, so pure red plays R alone. */
export const CHANNEL_REST = 8;

/** A silent step. `tie` means "keep the previous note sounding" rather than silence. */
export interface RestStep { rest: true; tie: boolean; hex: string | null; label: 'rest' | 'tie' }
export interface NoteStep {
  rest: false;
  hex: string;
  /** One note in Melody mode, a triad in Hue Chords, one per sounding channel in RGB Instruments. */
  midis: number[];
  /**
   * Parallel to `midis`: which voice each note is. The engine glides and holds
   * voice by voice, matching keys. '0'.. for Melody and Hue Chords, the
   * channel ('r' | 'g' | 'b') in RGB Instruments.
   */
  keys: string[];
  /** RGB Instruments: each key is a channel, played by that channel's instrument. */
  rgb: boolean;
  /** Per-voice level 0..1, parallel to `midis`. 1 in Melody mode; R, G, B in Chords. */
  levels: number[];
  /** 0..1 - brightness curve times alpha. */
  velocity: number;
  cutoff: number;
  label: string;
  /** Every voice spelled out, for a tooltip. */
  detail: string;
}
export type Step = RestStep | NoteStep;

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const wrapHue = (h: number) => ((h % 360) + 360) % 360;

/** Melody: hue snapped to `scale`, spread evenly across `octaveRange` octaves above `base`. */
export function hueToMidi(h: number, scale: ScaleName, octaveRange: number, base: number): number {
  const table = SCALES[scale];
  const total = table.length * octaveRange;
  const idx = Math.min(total - 1, Math.floor((wrapHue(h) / 360) * total));
  return base + Math.floor(idx / table.length) * 12 + table[idx % table.length];
}

/** Chords: 12 slices of 30 degrees; slice i is pitch class (root + 7i) % 12. */
export function hueToFifthsRoot(h: number, root: number): number {
  const slice = Math.min(11, Math.floor(wrapHue(h) / 30));
  return (((root + 7 * slice) % 12) + 12) % 12;
}

export function saturationToCutoff(s: number): number {
  return CUTOFF_MIN * Math.pow(CUTOFF_MAX / CUTOFF_MIN, clamp(s, 0, 100) / 100);
}

export function brightnessToVelocity(b: number): number {
  return Math.pow(clamp(b, 0, 100) / 100, VELOCITY_CURVE);
}

/** The C at the bottom of a hue mode's range: base octave plus the track's offset. */
export function hueBase(cfg: MapConfig): number {
  return BASE_MIDI + 12 * ((cfg.baseOctave ?? 3) - 3) + 12 * cfg.octaveOffset;
}

export function swatchToStep(slot: Slot, cfg: MapConfig): Step {
  if (!slot) return { rest: true, tie: false, hex: null, label: 'rest' };
  const rgb = hexToRgb(slot.hex);
  if (!rgb) return { rest: true, tie: false, hex: null, label: 'rest' };
  const hex = slot.hex;
  const alpha = clamp(slot.alpha, 0, 100) / 100;
  // Alpha 0 is checked before brightness: a tie's colour doesn't matter.
  if (alpha <= 0) return { rest: true, tie: true, hex, label: 'tie' };
  if (cfg.mode === 'rgb') return rgbChordStep(rgb, hex, alpha, cfg);
  const hsb = rgbToHsb(rgb.r, rgb.g, rgb.b);
  if (hsb.b < REST_BRIGHTNESS) return { rest: true, tie: false, hex, label: 'rest' };

  const velocity = brightnessToVelocity(hsb.b) * alpha;
  const cutoff = saturationToCutoff(hsb.s);
  const base = hueBase(cfg) + cfg.root;

  if (cfg.mode === 'melody') {
    const midi = hueToMidi(hsb.h, cfg.scale, cfg.octaveRange, base);
    const name = midiToName(midi);
    return { rest: false, hex, midis: [midi], keys: ['0'], rgb: false, levels: [1], velocity, cutoff, label: name, detail: name };
  }

  // The chord root sits in the octave above the track's base C, whatever the key.
  const pc = hueToFifthsRoot(hsb.h, cfg.root);
  const rootMidi = hueBase(cfg) + pc;
  const minor = hsb.s < MINOR_SATURATION;
  const midis = [rootMidi, rootMidi + (minor ? 3 : 4), rootMidi + 7];
  // Brightness is the largest channel and already rides in velocity, so each
  // voice's level is its channel relative to that largest one: the brightest
  // channel's voice is at full velocity, the others under it.
  const max = Math.max(rgb.r, rgb.g, rgb.b);
  const levels = [rgb.r, rgb.g, rgb.b].map((c) => Math.pow(c / max, VELOCITY_CURVE));
  const label = `${NOTE_NAMES[pc]}${minor ? 'm' : ''}`;
  return {
    rest: false, hex, midis, keys: ['0', '1', '2'], rgb: false, levels, velocity, cutoff, label,
    detail: `${label}: ${midis.map(midiToName).join(' ')}`,
  };
}

// --- RGB Instruments -----------------------------------------------------------

/** The lowest note an instrument plays: its base octave's C, plus the key's root and the track offset. */
export function channelBase(range: ChannelRange, root: number, octaveOffset: number): number {
  return (range.octave + 1) * 12 + root + 12 * octaveOffset;
}

/** A 0..255 channel value -> a scale degree across the instrument's range (over 8..255), or null (silent) below CHANNEL_REST. */
export function channelToMidi(v: number, scale: ScaleName, octaveRange: number, base: number): number | null {
  if (v < CHANNEL_REST) return null;
  const table = SCALES[scale];
  const steps = table.length * octaveRange;
  // The audible span 8..255 is split evenly - measuring from 0 would leave the
  // lowest bucket wholly under the rest line at 3 octaves of chromatic (36 steps).
  const deg = Math.min(steps - 1, Math.floor(((clamp(v, 0, 255) - CHANNEL_REST) / (256 - CHANNEL_REST)) * steps));
  return base + Math.floor(deg / table.length) * 12 + table[deg % table.length];
}

/**
 * The inverse: the channel value at the centre of `midi`'s bucket. Throws for
 * a note off the scale or out of range.
 */
export function midiToChannel(midi: number, scale: ScaleName, octaveRange: number, base: number): number {
  const table = SCALES[scale];
  const offset = midi - base;
  const oct = Math.floor(offset / 12);
  const degree = table.indexOf(((offset % 12) + 12) % 12);
  if (degree < 0 || oct < 0 || oct >= octaveRange) {
    throw new Error(`midi ${midi} is not in ${scale} over ${octaveRange} octave(s) from ${base}`);
  }
  const steps = table.length * octaveRange;
  const idx = oct * table.length + degree;
  return Math.min(255, Math.floor(CHANNEL_REST + ((idx + 0.5) / steps) * (256 - CHANNEL_REST)));
}

/**
 * RGB Instruments: each channel is its own instrument and its value picks its note.
 * Loudness is the instrument's level times the alpha accent (the engine owns
 * the levels), so `velocity` here is alpha alone; the filter is the
 * instrument's too, so `cutoff` is left open.
 */
function rgbChordStep(rgb: { r: number; g: number; b: number }, hex: string, alpha: number, cfg: MapConfig): Step {
  const ranges = cfg.ranges ?? DEFAULT_RANGES;
  const midis: number[] = [];
  const keys: string[] = [];
  for (const ch of CHANNELS) {
    const midi = channelToMidi(rgb[ch], cfg.scale, ranges[ch].range, channelBase(ranges[ch], cfg.root, cfg.octaveOffset));
    if (midi !== null) { midis.push(midi); keys.push(ch); }
  }
  if (midis.length === 0) return { rest: true, tie: false, hex, label: 'rest' };
  // The cell shows the lead - the highest channel sounding; the tooltip has them all.
  const detail = keys.map((k, i) => `${instrumentName(k as Channel, cfg)} ${midiToName(midis[i])}`).join(' · ');
  return {
    rest: false, hex, midis, keys, rgb: true, levels: midis.map(() => 1), velocity: alpha,
    cutoff: CUTOFF_MAX, label: midiToName(midis[midis.length - 1]), detail,
  };
}

// --- timing ---------------------------------------------------------------

/** Seconds per step: a quarter note is 60/bpm, a 1/8 step half that, 1/16 a quarter. */
export function stepSeconds(bpm: number, subdivision: Subdivision): number {
  return (60 / clamp(bpm, 1, 1000)) * (4 / subdivision);
}

/** Glide in seconds: absolute time, never longer than the step it starts. */
export function clampGlide(glideMs: number, stepSec: number): number {
  return clamp(glideMs / 1000, 0, stepSec);
}

/** How long the note sounds inside its step. */
export function gateSeconds(gatePct: number, stepSec: number): number {
  return (stepSec * clamp(gatePct, 5, 100)) / 100;
}

/** Gate 100 is legato: the voice is held and glides instead of retriggering. */
export function isLegato(gatePct: number): boolean {
  return gatePct >= 100;
}

// --- sources --------------------------------------------------------------

/** Hex -> alpha, the legacy `color-taylor-alpha` map older strings take alpha from. */
export type LegacyAlpha = Record<string, number>;

function toSwatch(v: unknown, legacy: LegacyAlpha): SwatchIn | null {
  if (typeof v === 'string') return { hex: v, alpha: legacy[v] ?? 100 };
  if (v && typeof v === 'object' && typeof (v as { hex?: unknown }).hex === 'string') {
    const o = v as { hex: string; alpha?: unknown };
    return { hex: o.hex, alpha: typeof o.alpha === 'number' ? o.alpha : (legacy[o.hex] ?? 100) };
  }
  return null;
}

/**
 * `color-taylor-saved`: `{hex, alpha, addedAt} | null`, or a bare hex string
 * from before alpha. Positions are kept - an empty slot is a rest - but the
 * trailing empties are trimmed: the stored length is the bank's capacity, and
 * a half-full bank would otherwise loop through a long silence.
 */
export function parseSavedSlots(raw: unknown, legacy: LegacyAlpha = {}): Slot[] {
  if (!Array.isArray(raw)) return [];
  const slots = raw.map((v) => toSwatch(v, legacy));
  let end = slots.length;
  while (end > 0 && slots[end - 1] === null) end--;
  return slots.slice(0, end);
}

/** `color-taylor-recent`: `{hex, alpha}`, or a legacy bare hex string. */
export function parseRecentSlots(raw: unknown, legacy: LegacyAlpha = {}): Slot[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((v) => toSwatch(v, legacy)).filter((s): s is SwatchIn => s !== null);
}

const solid = (hexes: string[]): Slot[] => hexes.map((hex) => ({ hex, alpha: 100 }));

export const BUILTIN_PALETTES = {
  // Full saturation and brightness: each hue's pure colour, 30 degrees apart.
  rainbow: solid(Array.from({ length: 12 }, (_, i) => {
    const { r, g, b } = hsbToRgb(i * 30, 100, 100);
    return rgbToHex(r, g, b);
  })),
  // Greys are hue 0: one pitch, so the row is all rhythm and accent, black the rests.
  pulse: solid(['#ffffff', '#000000', '#808080', '#000000', '#ffffff', '#404040', '#b0b0b0', '#000000']),
  sunset: solid(['#2b1055', '#7b2869', '#c73866', '#fe676e', '#fd8f52', '#ffbd71', '#ffdca2', '#f9f871']),
} as const;

// --- songs ----------------------------------------------------------------

/** "F#4" -> 66. Sharps only, octave after the letter; C4 is 60. */
export function noteNameToMidi(name: string): number {
  const m = /^([A-G]#?)(-?\d)$/.exec(name);
  if (!m) throw new Error(`bad note name: ${name}`);
  const pc = NOTE_NAMES.indexOf(m[1] as (typeof NOTE_NAMES)[number]);
  return (Number(m[2]) + 1) * 12 + pc;
}

/**
 * Melody mode's inverse: the hue at the centre of the band `hueToMidi` maps to
 * `midi`, so a small drift from 8-bit rounding still lands on the same note.
 * Throws for a note outside the scale or the range - a song must fit its settings.
 */
export function midiToHue(midi: number, scale: ScaleName, octaveRange: number, base: number): number {
  const table = SCALES[scale];
  const offset = midi - base;
  const oct = Math.floor(offset / 12);
  const degree = table.indexOf(((offset % 12) + 12) % 12);
  if (degree < 0 || oct < 0 || oct >= octaveRange) {
    throw new Error(`midi ${midi} is not in ${scale} over ${octaveRange} octave(s) from ${base}`);
  }
  const total = table.length * octaveRange;
  return ((oct * table.length + degree + 0.5) / total) * 360;
}

export interface SongSettings {
  bpm: number;
  subdivision: Subdivision;
  scale: ScaleName;
  root: number;
  octaveRange: number;
}

export interface SongPart {
  /** The track's octave offset: the part's base is C3 + root + 12 * octave. */
  octave: number;
  /** Space-separated, one token per step: a note ("F#4"), "-" a tie, "." a rest. */
  notes: string;
}

export interface Song { name: string; settings: SongSettings; melody: SongPart; bass: SongPart }

/** The config a part plays under - Melody mode, the song's key and range. */
export function songConfig(song: Song, part: SongPart): MapConfig {
  const { scale, root, octaveRange } = song.settings;
  return { mode: 'melody', scale, root, octaveRange, octaveOffset: part.octave };
}

/** Each note is a full-saturation, full-brightness colour at its band's centre hue. */
export function songSlots(song: Song, part: SongPart): Slot[] {
  const cfg = songConfig(song, part);
  const base = BASE_MIDI + cfg.root + 12 * cfg.octaveOffset;
  let prev: string | null = null;
  return part.notes.trim().split(/\s+/).map((tok) => {
    if (tok === '.') { prev = null; return null; }
    if (tok === '-') {
      if (!prev) throw new Error('a tie needs a note before it');
      return { hex: prev, alpha: 0 };
    }
    const { r, g, b } = hsbToRgb(midiToHue(noteNameToMidi(tok), cfg.scale, cfg.octaveRange, base), 100, 100);
    prev = rgbToHex(r, g, b);
    return { hex: prev, alpha: 100 };
  });
}

/** The intended MIDI note per step (null for ties and rests) - the test's answer key. */
export function songMidis(part: SongPart): (number | null)[] {
  return part.notes.trim().split(/\s+/).map((tok) => (tok === '.' || tok === '-' ? null : noteNameToMidi(tok)));
}

// Quarter note = 2 steps at 1/8. Two four-bar phrases, 64 steps: four rows of 16.
const ODE_MELODY = [
  'F#4 - F#4 - G4 - A4 -   A4 - G4 - F#4 - E4 -   D4 - D4 - E4 - F#4 -   F#4 - - E4 E4 - - -',
  'F#4 - F#4 - G4 - A4 -   A4 - G4 - F#4 - E4 -   D4 - D4 - E4 - F#4 -   E4 - - D4 D4 - - -',
].join(' ');
// Half notes, tonic and dominant: the first phrase ends on A (half cadence), the second home on D.
const ODE_BASS = [
  'D2 - - - A2 - - -   D2 - - - A2 - - -   D2 - - - A2 - - -   D2 - - - A2 - - -',
  'D2 - - - A2 - - -   D2 - - - A2 - - -   D2 - - - A2 - - -   A2 - - - D2 - - -',
].join(' ');

// 2/4 at 1/16: "da-da-dum" is 16th 16th 8th. Eight bars, 64 steps.
const TELL_MELODY = [
  'B4 B4 B4 -  B4 B4 B4 -',
  'B4 B4 E5 -  F#5 - G#5 -',
  'B4 B4 B4 -  B4 B4 B4 -',
  'B4 B4 G#5 - E5 - G#5 -',
  'B4 B4 B4 -  B4 B4 B4 -',
  'B4 B4 E5 -  F#5 - G#5 -',
  'B4 B4 G#5 - F#5 - D#5 -',
  'F#5 - E5 -  - - . .',
].join(' ');
// Staccato eighths on the root and fifth; the dominant under bar 7.
const TELL_BASS = [
  'E2 . B2 . E2 . B2 .', 'E2 . B2 . E2 . B2 .', 'E2 . B2 . E2 . B2 .', 'E2 . B2 . E2 . B2 .',
  'E2 . B2 . E2 . B2 .', 'E2 . B2 . E2 . B2 .', 'B2 . F#2 . B2 . F#2 .', 'E2 . B2 . E2 . . .',
].join(' ');

export const SONGS = {
  ode: {
    name: 'Ode to Joy',
    settings: { bpm: 100, subdivision: 8, scale: 'major', root: 2, octaveRange: 2 },
    melody: { octave: 1, notes: ODE_MELODY }, // base D4
    bass: { octave: -1, notes: ODE_BASS }, // base D2
  },
  tell: {
    name: 'William Tell gallop',
    settings: { bpm: 132, subdivision: 16, scale: 'major', root: 4, octaveRange: 2 },
    melody: { octave: 1, notes: TELL_MELODY }, // base E4
    bass: { octave: -1, notes: TELL_BASS }, // base E2
  },
} satisfies Record<string, Song>;

// --- RGB Instruments songs -----------------------------------------------------

export interface RgbSong {
  name: string;
  settings: SongSettings & { ranges: Record<Channel, ChannelRange> };
  /**
   * One token string per channel, aligned step for step. A step is a tie only
   * if every channel ties ("-"), since a tie holds all three; "." silences
   * that channel; a step where every channel is "." is an empty slot.
   */
  parts: Record<Channel, string>;
}

export function rgbSongConfig(song: RgbSong): MapConfig {
  const { scale, root, octaveRange, ranges } = song.settings;
  return { mode: 'rgb', scale, root, octaveRange, octaveOffset: 0, ranges };
}

const tokens = (s: string) => s.trim().split(/\s+/);

/** Each step's colour: every channel set to the centre of its note's bucket. */
export function rgbSongSlots(song: RgbSong): Slot[] {
  const cfg = rgbSongConfig(song);
  const ranges = cfg.ranges ?? DEFAULT_RANGES;
  const cols = CHANNELS.map((ch) => tokens(song.parts[ch]));
  if (cols.some((c) => c.length !== cols[0].length)) throw new Error('RGB song parts differ in length');
  let prev: string | null = null;
  return cols[0].map((_, i) => {
    const toks = cols.map((c) => c[i]);
    if (toks.every((t) => t === '-')) {
      if (!prev) throw new Error('a tie needs a note before it');
      return { hex: prev, alpha: 0 };
    }
    if (toks.includes('-')) throw new Error(`step ${i}: a tie must hold all three channels`);
    if (toks.every((t) => t === '.')) { prev = null; return null; }
    const [r, g, b] = CHANNELS.map((ch, k) => (toks[k] === '.'
      ? 0
      : midiToChannel(noteNameToMidi(toks[k]), cfg.scale, ranges[ch].range, channelBase(ranges[ch], cfg.root, 0))));
    prev = rgbToHex(r, g, b);
    return { hex: prev, alpha: 100 };
  });
}

/** Intended notes per step as {r, g, b} MIDI (null = silent); null for ties and empty slots. */
export function rgbSongMidis(song: RgbSong): (Record<Channel, number | null> | null)[] {
  const cols = CHANNELS.map((ch) => tokens(song.parts[ch]));
  return cols[0].map((_, i) => {
    const toks = cols.map((c) => c[i]);
    if (toks.every((t) => t === '-') || toks.every((t) => t === '.')) return null;
    const note = (t: string) => (t === '.' ? null : noteNameToMidi(t));
    return { r: note(toks[0]), g: note(toks[1]), b: note(toks[2]) };
  });
}

/*
 * Ode to Joy, the whole main theme, as one RGB Instruments track: Beethoven's
 * 16 bars of 4/4 in D major, A A' B A' (public domain). 1/8 steps, so a
 * quarter is two steps ("F#4 -"), a dotted quarter three, a half four; 128
 * steps, two bars to a row of 16. B (Lead) is the tune, G (Harmony) mostly a
 * diatonic third under it with chord tones at the cadences, R (Bass) the
 * roots, walking at the cadences. A tie holds all three channels, so wherever
 * one voice moves the other two restrike.
 *
 * The notes, bar by bar - Lead / Harmony / Bass, one chord per melody note:
 *
 *   A   1  F#4 F#4 G4 A4     D4 D4 E4 F#4     D2 D2 A2 D2      D D A7 D
 *       2  A4 G4 F#4 E4      F#4 E4 D4 C#4    D2 A2 D2 A2      D A7 D A
 *       3  D4 D4 E4 F#4      B3 B3 C#4 D4     G2 G2 A2 D2      G G A D
 *       4  F#4. E4(8) E4(2)  D4 A3 C#4        D2 C#3 A2        D A/C# A   (half cadence)
 *   A'  5-7 as 1-3
 *       8  E4. D4(8) D4(2)   C#4 A3 F#3       A2 F#2 D2        A D/F# D   (full cadence)
 *   B   9  E4 E4 F#4 D4      C#4 C#4 D4 A3    A2 A2 D2 D2      A A D D
 *      10  E4 F#4(8) G4(8) F#4 D4   C#4 D4 E4 D4 A3   A2 D2 A2 D2 D2
 *      11  E4 F#4(8) G4(8) F#4 E4   C#4 D4 E4 D4 C#4  A2 D2 A2 D2 A2
 *      12  D4 E4 A3 F#4~     B3 B3 E3 D4~     B2 E2 A2 D2~     Bm Em A D
 *   A' 13  ~F# F#4 G4 A4     ~D4 D4 E4 F#4    ~D2 D2 A2 D2     (the syncopation: F# enters on
 *                                                               beat 4 of bar 12, tied over the bar)
 *      14-16 as 6-8
 *
 * Ranges: Bass D2..C#3 (octave 2, 1 octave), Harmony D3..C#5 and Lead D3..C#5
 * (octave 3, 2 octaves) - the lead drops to A3 in bar 12, below the default D4.
 */
const bars = (...b: string[]) => b.join('   ');
const ODE_FULL_LEAD = bars(
  'F#4 - F#4 - G4 - A4 -', 'A4 - G4 - F#4 - E4 -', 'D4 - D4 - E4 - F#4 -', 'F#4 - - E4 E4 - - -',
  'F#4 - F#4 - G4 - A4 -', 'A4 - G4 - F#4 - E4 -', 'D4 - D4 - E4 - F#4 -', 'E4 - - D4 D4 - - -',
  'E4 - E4 - F#4 - D4 -', 'E4 - F#4 G4 F#4 - D4 -', 'E4 - F#4 G4 F#4 - E4 -', 'D4 - E4 - A3 - F#4 -',
  '- - F#4 - G4 - A4 -', 'A4 - G4 - F#4 - E4 -', 'D4 - D4 - E4 - F#4 -', 'E4 - - D4 D4 - - -',
);
const ODE_FULL_HARMONY = bars(
  'D4 - D4 - E4 - F#4 -', 'F#4 - E4 - D4 - C#4 -', 'B3 - B3 - C#4 - D4 -', 'D4 - - A3 C#4 - - -',
  'D4 - D4 - E4 - F#4 -', 'F#4 - E4 - D4 - C#4 -', 'B3 - B3 - C#4 - D4 -', 'C#4 - - A3 F#3 - - -',
  'C#4 - C#4 - D4 - A3 -', 'C#4 - D4 E4 D4 - A3 -', 'C#4 - D4 E4 D4 - C#4 -', 'B3 - B3 - E3 - D4 -',
  '- - D4 - E4 - F#4 -', 'F#4 - E4 - D4 - C#4 -', 'B3 - B3 - C#4 - D4 -', 'C#4 - - A3 F#3 - - -',
);
const ODE_FULL_BASS = bars(
  'D2 - D2 - A2 - D2 -', 'D2 - A2 - D2 - A2 -', 'G2 - G2 - A2 - D2 -', 'D2 - - C#3 A2 - - -',
  'D2 - D2 - A2 - D2 -', 'D2 - A2 - D2 - A2 -', 'G2 - G2 - A2 - D2 -', 'A2 - - F#2 D2 - - -',
  'A2 - A2 - D2 - D2 -', 'A2 - D2 A2 D2 - D2 -', 'A2 - D2 A2 D2 - A2 -', 'B2 - E2 - A2 - D2 -',
  '- - D2 - A2 - D2 -', 'D2 - A2 - D2 - A2 -', 'G2 - G2 - A2 - D2 -', 'A2 - - F#2 D2 - - -',
);

export const ODE_RGB: RgbSong = {
  name: 'Ode to Joy (full theme) - RGB Instruments',
  settings: {
    bpm: 100, subdivision: 8, scale: 'major', root: 2, octaveRange: 2,
    ranges: { r: { octave: 2, range: 1 }, g: { octave: 3, range: 2 }, b: { octave: 3, range: 2 } },
  },
  parts: { b: ODE_FULL_LEAD, g: ODE_FULL_HARMONY, r: ODE_FULL_BASS },
};

// --- note pickers: notes -> colour, per mode --------------------------------

/**
 * A colour whose hue survives 8-bit rounding needs some chroma: at S or B near
 * 0 the hue is lost. The pickers keep the swatch's S and B but lift them to
 * these floors.
 */
const PICK_MIN_S = 40;
const PICK_MIN_B = 40;
/** Hue Chords keeps low saturation (minor) where it can: a floor under the minor line. */
const PICK_MIN_S_CHORD = 15;

function hsbOf(hex: string): { h: number; s: number; b: number } {
  const rgb = hexToRgb(hex) ?? { r: 255, g: 255, b: 255 };
  return rgbToHsb(rgb.r, rgb.g, rgb.b);
}
function hsbHex(h: number, s: number, b: number): string {
  const { r, g, b: bl } = hsbToRgb(h, s, b);
  return rgbToHex(r, g, bl);
}

/** Every note Hue Melody can play under `cfg`, low to high. */
export function melodyChoices(cfg: MapConfig): number[] {
  const table = SCALES[cfg.scale];
  const base = hueBase(cfg) + cfg.root;
  return Array.from({ length: table.length * cfg.octaveRange }, (_, i) => base + Math.floor(i / table.length) * 12 + table[i % table.length]);
}

/** Hue Melody: `hex` moved to the centre hue of `midi`'s band, S and B kept (above the floors). */
export function melodyNoteToHex(hex: string, midi: number, cfg: MapConfig): string {
  const { s, b } = hsbOf(hex);
  const hue = midiToHue(midi, cfg.scale, cfg.octaveRange, hueBase(cfg) + cfg.root);
  return hsbHex(hue, Math.max(PICK_MIN_S, s), Math.max(PICK_MIN_B, b));
}

/** Hue Chords: `hex` moved to the centre of the slice whose root is pitch class `pc`. */
export function chordRootToHex(hex: string, pc: number, cfg: MapConfig): string {
  const { s, b } = hsbOf(hex);
  // Slice i has root (root + 7i) % 12; 7 is its own inverse mod 12.
  const slice = ((((pc - cfg.root) * 7) % 12) + 12) % 12;
  return hsbHex(slice * 30 + 15, Math.max(PICK_MIN_S_CHORD, s), Math.max(PICK_MIN_B, b));
}

/** Every note channel `ch` can play under `cfg`, low to high. */
export function channelChoices(ch: Channel, cfg: MapConfig): number[] {
  const range = (cfg.ranges ?? DEFAULT_RANGES)[ch];
  const table = SCALES[cfg.scale];
  const base = channelBase(range, cfg.root, cfg.octaveOffset);
  return Array.from({ length: table.length * range.range }, (_, i) => base + Math.floor(i / table.length) * 12 + table[i % table.length]);
}

/** RGB Instruments: `hex` with channel `ch` set to `midi`'s bucket centre, or to 0 (silent) for null. */
export function channelNoteToHex(hex: string, ch: Channel, midi: number | null, cfg: MapConfig): string {
  const rgb = hexToRgb(hex) ?? { r: 0, g: 0, b: 0 };
  const range = (cfg.ranges ?? DEFAULT_RANGES)[ch];
  rgb[ch] = midi === null ? 0 : midiToChannel(midi, cfg.scale, range.range, channelBase(range, cfg.root, cfg.octaveOffset));
  return rgbToHex(rgb.r, rgb.g, rgb.b);
}

/** RGB Instruments: the note each channel of `hex` plays, null where silent. */
export function channelNotes(hex: string, cfg: MapConfig): Record<Channel, number | null> {
  const rgb = hexToRgb(hex) ?? { r: 0, g: 0, b: 0 };
  const ranges = cfg.ranges ?? DEFAULT_RANGES;
  const note = (ch: Channel) => channelToMidi(rgb[ch], cfg.scale, ranges[ch].range, channelBase(ranges[ch], cfg.root, cfg.octaveOffset));
  return { r: note('r'), g: note('g'), b: note('b') };
}

// --- hysteresis: sticky notes while a colour is dragged ------------------------

/**
 * A bucket index with hysteresis. `value` is normalised 0..1 across
 * `bucketCount` equal buckets; the answer stays `prevIndex` until the value is
 * past that bucket's edge by `margin` bucket widths, so a drag sitting on a
 * boundary does not flicker between two notes. `wrap` treats 0 and 1 as the
 * same point (hue), so the first and last buckets are neighbours.
 */
export function stickyIndex(value: number, prevIndex: number | null, bucketCount: number, margin = 0.2, wrap = false): number {
  const n = Math.max(1, Math.floor(bucketCount));
  const v = wrap ? ((value % 1) + 1) % 1 : clamp(value, 0, 1);
  const raw = Math.min(n - 1, Math.floor(v * n));
  if (prevIndex === null || prevIndex < 0 || prevIndex >= n || raw === prevIndex) return raw;
  const pos = v * n;
  let past: number;
  if (wrap) {
    // Signed circular distance from the previous bucket's centre, in buckets.
    const d = ((((pos - (prevIndex + 0.5)) % n) + n * 1.5) % n) - n / 2;
    past = Math.abs(d) - 0.5;
  } else {
    past = pos < prevIndex ? prevIndex - pos : pos - (prevIndex + 1);
  }
  return past > margin ? raw : prevIndex;
}

/**
 * The note buckets a mode reads out of a colour: one hue bucket in the hue
 * modes, one per channel in RGB Instruments. `wrap` for hue.
 */
export function noteBuckets(cfg: MapConfig): { count: number; wrap: boolean }[] {
  if (cfg.mode === 'melody') return [{ count: SCALES[cfg.scale].length * cfg.octaveRange, wrap: true }];
  if (cfg.mode === 'chords') return [{ count: 12, wrap: true }];
  const ranges = cfg.ranges ?? DEFAULT_RANGES;
  return CHANNELS.map((ch) => ({ count: SCALES[cfg.scale].length * ranges[ch].range, wrap: false }));
}

/** Each bucket's normalised value for `hex`, or null where it rests (dark, or a channel under the line). */
function bucketValues(hex: string, cfg: MapConfig): (number | null)[] {
  const rgb = hexToRgb(hex) ?? { r: 0, g: 0, b: 0 };
  if (cfg.mode === 'rgb') {
    return CHANNELS.map((ch) => (rgb[ch] < CHANNEL_REST ? null : (rgb[ch] - CHANNEL_REST) / (256 - CHANNEL_REST)));
  }
  const hsb = rgbToHsb(rgb.r, rgb.g, rgb.b);
  return [hsb.b < REST_BRIGHTNESS ? null : wrapHue(hsb.h) / 360];
}

/** The bucket each voice of `hex` falls in, -1 where it rests. Same answer as swatchToStep. */
export function noteIndices(hex: string, cfg: MapConfig): number[] {
  const buckets = noteBuckets(cfg);
  return bucketValues(hex, cfg).map((v, k) => (v === null ? -1 : Math.min(buckets[k].count - 1, Math.floor(v * buckets[k].count))));
}

/** `noteIndices` with hysteresis against `prev`. Rests are never sticky: dark is silent at once. */
export function stickyIndices(hex: string, cfg: MapConfig, prev: readonly number[] | null, margin = 0.2): number[] {
  const buckets = noteBuckets(cfg);
  return bucketValues(hex, cfg).map((v, k) => {
    if (v === null) return -1;
    const p = prev?.[k] ?? -1;
    return stickyIndex(v, p < 0 ? null : p, buckets[k].count, margin, buckets[k].wrap);
  });
}

/**
 * `hex` moved to the centre of the buckets `idx` names - hue in the hue modes
 * (S and B kept), each sounding channel in RGB Instruments - so it plays those
 * notes with room either side. Where S is too low for the hue to survive 8-bit
 * rounding it is lifted to the pickers' floor; failing that, `hex` comes back.
 */
export function snapToIndices(hex: string, cfg: MapConfig, idx: readonly number[]): string {
  const buckets = noteBuckets(cfg);
  if (cfg.mode === 'rgb') {
    const rgb = hexToRgb(hex) ?? { r: 0, g: 0, b: 0 };
    CHANNELS.forEach((ch, k) => {
      const i = idx[k];
      if (i >= 0) rgb[ch] = Math.min(255, Math.floor(CHANNEL_REST + ((i + 0.5) / buckets[k].count) * (256 - CHANNEL_REST)));
    });
    return rgbToHex(rgb.r, rgb.g, rgb.b);
  }
  const i = idx[0];
  if (i === undefined || i < 0) return hex;
  const { s, b } = hsbOf(hex);
  const hue = ((i + 0.5) / buckets[0].count) * 360;
  for (const sat of [s, Math.max(PICK_MIN_S, s)]) {
    const out = hsbHex(hue, sat, b);
    if (noteIndices(out, cfg)[0] === i) return out;
  }
  return hex;
}
