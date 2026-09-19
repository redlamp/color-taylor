import { describe, expect, test } from 'bun:test';
import {
  decodeShare, decodeSteps, encodeShare, encodeSteps, libraryFile, parseLibrary, snapshotFrom,
  type TrackSnapshot,
} from './sequencerTracks';

const MELODY: TrackSnapshot = {
  name: 'Riff; with: separators, & 100% unicode é_._',
  steps: [{ hex: '#ff0000', alpha: 100 }, { hex: '#00ff80', alpha: 50 }, null, { hex: '#00ff80', alpha: 0 }, { hex: '#123abc', alpha: 1 }],
  mode: 'melody', bpm: 132, subdivision: 16, gatePct: 85, glideMs: 20, octave: -1,
  melody: { scale: 'minor', root: 9, baseOctave: 2, octaveRange: 3, wave: 'square' },
};

const RGB: TrackSnapshot = {
  name: 'Three',
  steps: [{ hex: '#e8dcc8', alpha: 100 }, null, null],
  mode: 'rgb', bpm: 90, subdivision: 8, gatePct: 100, glideMs: 0, octave: 1,
  rgb: {
    scale: 'chromatic', root: 2,
    instruments: {
      r: { name: 'Sub.bass_1', octave: 1, range: 1, wave: 'sine', level: 100, muted: false },
      g: { name: 'Pad', octave: 3, range: 3, wave: 'triangle', level: 0, muted: true },
      b: { name: 'Lead (hot)', octave: 5, range: 2, wave: 'sawtooth', level: 55, muted: false },
    },
  },
};

const CHORDS: TrackSnapshot = {
  name: 'Fifths', steps: [{ hex: '#336699', alpha: 100 }], mode: 'chords', bpm: 60, subdivision: 4, gatePct: 5, glideMs: 300, octave: 2,
  chords: { root: 11, baseOctave: 5, wave: 'sine' },
};

describe('steps encoding', () => {
  test('hex, alpha only where it is not 100, "." for an empty slot', () => {
    expect(encodeSteps(MELODY.steps)).toBe('ff0000,00ff80@50,.,00ff80@0,123abc@1');
  });
  test('round-trips', () => {
    expect(decodeSteps(encodeSteps(MELODY.steps))).toEqual(MELODY.steps);
    expect(decodeSteps('')).toEqual([]);
  });
  test('junk tokens are empty slots, alpha is clamped', () => {
    expect(decodeSteps('zzz,ff0000@250,.')).toEqual([null, { hex: '#ff0000', alpha: 100 }, null]);
  });
});

describe('share link', () => {
  for (const snap of [MELODY, RGB, CHORDS]) {
    test(`round-trips ${snap.mode}`, () => {
      const hash = `#${encodeShare(snap)}`;
      expect(decodeShare(hash)).toEqual(snap);
      // Nothing in it needs escaping by the address bar.
      expect(hash).toMatch(/^#seq=[A-Za-z0-9%;:,.@_=-]+$/);
    });
  }
  test('not a share link', () => {
    expect(decodeShare('#/')).toBeNull();
    expect(decodeShare('#seq=v9;x:ff0000')).toBeNull();
    expect(decodeShare('#seq=v1;m:melody')).toBeNull();
  });
  test('bad settings fall back rather than fail', () => {
    const snap = decodeShare('#seq=v1;m:melody;t:9999;d:7;s:nope;x:ff0000');
    expect(snap?.bpm).toBe(240);
    expect(snap?.subdivision).toBe(8);
    expect(snap?.melody?.scale).toBe('pentatonic');
    expect(snap?.steps).toEqual([{ hex: '#ff0000', alpha: 100 }]);
  });
});

describe('library file', () => {
  test('round-trips through JSON, ids kept', () => {
    const lib = parseLibrary([{ ...MELODY, id: 'a', savedAt: 1 }, { ...RGB, id: 'b', savedAt: 2 }]);
    expect(parseLibrary(JSON.parse(libraryFile(lib)))).toEqual(lib);
  });
  test('bad entries are dropped, missing instrument names get defaults', () => {
    const lib = parseLibrary({ tracks: [{ nope: 1 }, { steps: [{ hex: 'fff000' }], mode: 'rgb', rgb: { instruments: { r: { octave: 2 } } } }] });
    expect(lib).toHaveLength(1);
    expect(lib[0].steps).toEqual([{ hex: '#fff000', alpha: 100 }]);
    expect(lib[0].rgb?.instruments.r.name).toBe('Bass');
    expect(lib[0].rgb?.instruments.b.name).toBe('Lead');
  });
  test('snapshotFrom needs a steps array', () => {
    expect(snapshotFrom({ mode: 'melody' })).toBeNull();
    expect(snapshotFrom(null)).toBeNull();
  });
});
