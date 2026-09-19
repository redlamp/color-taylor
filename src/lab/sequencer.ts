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
export type SeqMode = 'melody' | 'chords';
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
}

/** A silent step. `tie` means "keep the previous note sounding" rather than silence. */
export interface RestStep { rest: true; tie: boolean; hex: string | null; label: 'rest' | 'tie' }
export interface NoteStep {
  rest: false;
  hex: string;
  /** One note in Melody mode, a triad in Chords mode. */
  midis: number[];
  /** Per-voice level 0..1, parallel to `midis`. 1 in Melody mode; R, G, B in Chords. */
  levels: number[];
  /** 0..1 - brightness curve times alpha. */
  velocity: number;
  cutoff: number;
  label: string;
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

export function swatchToStep(slot: Slot, cfg: MapConfig): Step {
  if (!slot) return { rest: true, tie: false, hex: null, label: 'rest' };
  const rgb = hexToRgb(slot.hex);
  if (!rgb) return { rest: true, tie: false, hex: null, label: 'rest' };
  const hex = slot.hex;
  const alpha = clamp(slot.alpha, 0, 100) / 100;
  // Alpha 0 is checked before brightness: a tie's colour doesn't matter.
  if (alpha <= 0) return { rest: true, tie: true, hex, label: 'tie' };
  const hsb = rgbToHsb(rgb.r, rgb.g, rgb.b);
  if (hsb.b < REST_BRIGHTNESS) return { rest: true, tie: false, hex, label: 'rest' };

  const velocity = brightnessToVelocity(hsb.b) * alpha;
  const cutoff = saturationToCutoff(hsb.s);
  const base = BASE_MIDI + cfg.root + 12 * cfg.octaveOffset;

  if (cfg.mode === 'melody') {
    const midi = hueToMidi(hsb.h, cfg.scale, cfg.octaveRange, base);
    return { rest: false, hex, midis: [midi], levels: [1], velocity, cutoff, label: midiToName(midi) };
  }

  // The chord root sits in the octave above the track's base C, whatever the key.
  const pc = hueToFifthsRoot(hsb.h, cfg.root);
  const rootMidi = BASE_MIDI + 12 * cfg.octaveOffset + pc;
  const minor = hsb.s < MINOR_SATURATION;
  const midis = [rootMidi, rootMidi + (minor ? 3 : 4), rootMidi + 7];
  // Brightness is the largest channel and already rides in velocity, so each
  // voice's level is its channel relative to that largest one: the brightest
  // channel's voice is at full velocity, the others under it.
  const max = Math.max(rgb.r, rgb.g, rgb.b);
  const levels = [rgb.r, rgb.g, rgb.b].map((c) => Math.pow(c / max, VELOCITY_CURVE));
  return { rest: false, hex, midis, levels, velocity, cutoff, label: `${NOTE_NAMES[pc]}${minor ? 'm' : ''}` };
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
