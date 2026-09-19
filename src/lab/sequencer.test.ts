import { describe, expect, test } from 'bun:test';
import {
  BUILTIN_PALETTES, SCALES, clampGlide, gateSeconds, hueToFifthsRoot, hueToMidi, isLegato,
  parseRecentSlots, parseSavedSlots, saturationToCutoff, stepSeconds, swatchToStep,
  type MapConfig,
} from './sequencer';

const MELODY: MapConfig = { mode: 'melody', scale: 'pentatonic', root: 0, octaveRange: 2, octaveOffset: 0 };
const CHORDS: MapConfig = { ...MELODY, mode: 'chords' };

describe('scale snapping', () => {
  test('pentatonic over two octaves: 10 even hue bands', () => {
    // Band width is 36 degrees; each lands on the next scale degree.
    const got = [0, 36, 72, 108, 144, 180, 216, 252, 288, 324].map((h) => hueToMidi(h, 'pentatonic', 2, 48));
    expect(got).toEqual([48, 50, 52, 55, 57, 60, 62, 64, 67, 69]);
  });

  test('every note is in the scale, for every scale and range', () => {
    for (const scale of Object.keys(SCALES) as (keyof typeof SCALES)[]) {
      for (const range of [1, 2, 3]) {
        for (let h = 0; h < 360; h += 7) {
          const m = hueToMidi(h, scale, range, 50);
          expect(SCALES[scale]).toContain((m - 50) % 12);
          expect(m).toBeGreaterThanOrEqual(50);
          expect(m).toBeLessThan(50 + 12 * range);
        }
      }
    }
  });

  test('hue wraps and 359.99 stays in the top band', () => {
    expect(hueToMidi(360, 'major', 1, 48)).toBe(48);
    expect(hueToMidi(-30, 'chromatic', 1, 48)).toBe(59);
    expect(hueToMidi(359.99, 'major', 1, 48)).toBe(59);
  });

  test('root and octave offset shift the melody', () => {
    const red = { hex: '#ff0000', alpha: 100 };
    const a = swatchToStep(red, MELODY);
    const b = swatchToStep(red, { ...MELODY, root: 2, octaveOffset: -1 });
    expect(a.rest || a.midis).toEqual([48]);
    expect(b.rest || b.midis).toEqual([38]);
    expect(a.rest ? '' : a.label).toBe('C3');
  });
});

describe('circle of fifths', () => {
  test('slice i is (root + 7i) % 12', () => {
    const roots = Array.from({ length: 12 }, (_, i) => hueToFifthsRoot(i * 30 + 15, 0));
    expect(roots).toEqual([0, 7, 2, 9, 4, 11, 6, 1, 8, 3, 10, 5]);
    expect(hueToFifthsRoot(29.9, 0)).toBe(0);
    expect(hueToFifthsRoot(30, 0)).toBe(7);
    expect(hueToFifthsRoot(45, 5)).toBe(0);
  });

  test('vivid is a major triad, low saturation minor; levels follow R, G, B', () => {
    const yellow = swatchToStep({ hex: '#ffff00', alpha: 100 }, CHORDS);
    if (yellow.rest) throw new Error('rest');
    // hue 60 -> slice 2 -> D
    expect(yellow.midis).toEqual([50, 54, 57]);
    expect(yellow.label).toBe('D');
    expect(yellow.levels).toEqual([1, 1, 0]);

    const grey = swatchToStep({ hex: '#808080', alpha: 100 }, CHORDS);
    if (grey.rest) throw new Error('rest');
    expect(grey.midis).toEqual([48, 51, 55]);
    expect(grey.label).toBe('Cm');
  });
});

describe('rests', () => {
  test('null slot, black, near-black, zero alpha and bad hex rest', () => {
    expect(swatchToStep(null, MELODY).rest).toBe(true);
    expect(swatchToStep({ hex: '#000000', alpha: 100 }, MELODY).rest).toBe(true);
    expect(swatchToStep({ hex: '#050505', alpha: 100 }, MELODY).rest).toBe(true); // b = 1.96
    expect(swatchToStep({ hex: '#ff0000', alpha: 0 }, MELODY).rest).toBe(true);
    expect(swatchToStep({ hex: 'nope', alpha: 100 }, CHORDS).rest).toBe(true);
    expect(swatchToStep({ hex: '#0a0a0a', alpha: 100 }, MELODY).rest).toBe(false); // b = 3.9
  });

  test('velocity is (b/100)^1.5 times alpha; cutoff 200..8000', () => {
    const s = swatchToStep({ hex: '#ffffff', alpha: 50 }, MELODY);
    if (s.rest) throw new Error('rest');
    expect(s.velocity).toBeCloseTo(0.5);
    expect(s.cutoff).toBeCloseTo(200);
    expect(saturationToCutoff(100)).toBeCloseTo(8000);
    expect(saturationToCutoff(50)).toBeCloseTo(Math.sqrt(200 * 8000));
  });
});

describe('timing', () => {
  test('step length from BPM and subdivision', () => {
    expect(stepSeconds(120, 4)).toBeCloseTo(0.5);
    expect(stepSeconds(120, 8)).toBeCloseTo(0.25);
    expect(stepSeconds(120, 16)).toBeCloseTo(0.125);
    expect(stepSeconds(60, 8)).toBeCloseTo(0.5);
  });

  test('glide is absolute and clamped to the step', () => {
    expect(clampGlide(40, 0.25)).toBeCloseTo(0.04);
    expect(clampGlide(300, 0.125)).toBeCloseTo(0.125);
    expect(clampGlide(-10, 0.25)).toBe(0);
    expect(clampGlide(0, 0.25)).toBe(0);
  });

  test('gate share and legato', () => {
    expect(gateSeconds(70, 0.5)).toBeCloseTo(0.35);
    expect(gateSeconds(1, 0.5)).toBeCloseTo(0.025);
    expect(isLegato(100)).toBe(true);
    expect(isLegato(99)).toBe(false);
  });
});

describe('sources', () => {
  test('saved keeps null positions, trims trailing empties, takes legacy strings', () => {
    const raw = [{ hex: '#ff0000', alpha: 80, addedAt: 1 }, null, '#00ff00', null, null];
    expect(parseSavedSlots(raw, { '#00ff00': 40 })).toEqual([
      { hex: '#ff0000', alpha: 80 }, null, { hex: '#00ff00', alpha: 40 },
    ]);
    expect(parseSavedSlots(null)).toEqual([]);
    expect(parseSavedSlots([null, null])).toEqual([]);
  });

  test('recent reads objects and legacy strings', () => {
    expect(parseRecentSlots([{ hex: '#123456', alpha: 30 }, '#abcdef', 7])).toEqual([
      { hex: '#123456', alpha: 30 }, { hex: '#abcdef', alpha: 100 },
    ]);
    expect(parseRecentSlots('junk')).toEqual([]);
  });

  test('built-ins: 12-hue rainbow, pulse has rests', () => {
    expect(BUILTIN_PALETTES.rainbow.length).toBe(12);
    expect(BUILTIN_PALETTES.rainbow[0]).toEqual({ hex: '#ff0000', alpha: 100 });
    expect(BUILTIN_PALETTES.pulse.some((s) => swatchToStep(s, MELODY).rest)).toBe(true);
  });
});
