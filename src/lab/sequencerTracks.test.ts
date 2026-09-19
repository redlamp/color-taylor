import { describe, expect, test } from 'bun:test';
import {
  arrangementFrom, decodeShare, decodeSteps, describe as describeArr, encodeShare, encodeSteps, libraryFile, parseLibrary,
  type Arrangement,
} from './sequencerTracks';

const MELODY: Arrangement = {
  name: 'Riff; with: separators, & 100% unicode é_._',
  mode: 'melody', bpm: 132, subdivision: 16, gatePct: 85, glideMs: 20,
  melody: { scale: 'minor', root: 9, baseOctave: 2, octaveRange: 3, wave: 'square' },
  tracks: [
    {
      steps: [{ hex: '#ff0000', alpha: 100 }, { hex: '#00ff80', alpha: 50 }, null, { hex: '#00ff80', alpha: 0 }, { hex: '#123abc', alpha: 1 }],
      octave: -1, enabled: true, muted: false,
    },
    { steps: [{ hex: '#ffffff', alpha: 100 }], octave: 2, enabled: false, muted: true, source: 'pulse' },
    { steps: [], octave: 0, enabled: true, muted: true },
    { steps: [null, null, { hex: '#abcdef', alpha: 0 }], octave: 1, enabled: false, muted: false, source: 'ode-melody' },
  ],
};

const RGB: Arrangement = {
  name: 'Three',
  mode: 'rgb', bpm: 90, subdivision: 8, gatePct: 100, glideMs: 0,
  rgb: {
    scale: 'chromatic', root: 2,
    instruments: {
      r: { name: 'Sub.bass_1', octave: 1, range: 1, wave: 'sine', level: 100, muted: false },
      g: { name: 'Pad', octave: 3, range: 3, wave: 'triangle', level: 0, muted: true },
      b: { name: 'Lead (hot)', octave: 5, range: 2, wave: 'sawtooth', level: 55, muted: false },
    },
  },
  tracks: [{ steps: [{ hex: '#e8dcc8', alpha: 100 }, null, null], octave: 1, enabled: true, muted: false }],
};

const CHORDS: Arrangement = {
  name: 'Fifths', mode: 'chords', bpm: 60, subdivision: 4, gatePct: 5, glideMs: 300,
  chords: { root: 11, baseOctave: 5, wave: 'sine' },
  tracks: Array.from({ length: 6 }, (_, i) => ({ steps: [{ hex: '#336699', alpha: 10 * i }], octave: i - 2 > 2 ? 2 : i - 2, enabled: i % 2 === 0, muted: i === 5 })),
};

describe('steps encoding', () => {
  test('hex, alpha only where it is not 100, "." for an empty slot', () => {
    expect(encodeSteps(MELODY.tracks[0].steps)).toBe('ff0000,00ff80@50,.,00ff80@0,123abc@1');
  });
  test('round-trips', () => {
    expect(decodeSteps(encodeSteps(MELODY.tracks[0].steps))).toEqual(MELODY.tracks[0].steps);
    expect(decodeSteps('')).toEqual([]);
  });
  test('junk tokens are empty slots, alpha is clamped', () => {
    expect(decodeSteps('zzz,ff0000@250,.')).toEqual([null, { hex: '#ff0000', alpha: 100 }, null]);
  });
});

describe('share link', () => {
  for (const arr of [MELODY, RGB, CHORDS]) {
    test(`round-trips ${arr.mode}, ${arr.tracks.length} track(s)`, () => {
      const hash = `#${encodeShare(arr)}`;
      expect(decodeShare(hash)).toEqual(arr);
      // Nothing in it needs escaping by the address bar.
      expect(hash).toMatch(/^#seq=v2;[A-Za-z0-9%;:,.@_=-]+$/);
    });
  }
  test('a v1 single-track link still opens, as a one-track arrangement', () => {
    const arr = decodeShare('#seq=v1;nm:Old;m:melody;t:120;d:16;g:70;l:40;o:-1;s:major;r:2;b:3;n:2;w:sine;x:ff0000,.,00ff00@0');
    expect(arr?.name).toBe('Old');
    expect(arr?.melody?.scale).toBe('major');
    expect(arr?.tracks).toEqual([{
      steps: [{ hex: '#ff0000', alpha: 100 }, null, { hex: '#00ff00', alpha: 0 }], octave: -1, enabled: true, muted: false,
    }]);
  });
  test('not a share link', () => {
    expect(decodeShare('#/')).toBeNull();
    expect(decodeShare('#seq=v9;x:ff0000')).toBeNull();
    expect(decodeShare('#seq=v1;m:melody')).toBeNull();
    expect(decodeShare('#seq=v2;m:melody;k:0')).toBeNull();
  });
  test('bad settings fall back rather than fail; tracks past six are dropped', () => {
    const arr = decodeShare('#seq=v2;m:melody;t:9999;d:7;s:nope;k:9;x0:ff0000;o0:7;c0:Not A Key!');
    expect(arr?.bpm).toBe(240);
    expect(arr?.subdivision).toBe(8);
    expect(arr?.melody?.scale).toBe('pentatonic');
    expect(arr?.tracks).toEqual([{ steps: [{ hex: '#ff0000', alpha: 100 }], octave: 2, enabled: true, muted: false }]);
    expect(arrangementFrom({ tracks: Array.from({ length: 9 }, () => ({ steps: [] })) })?.tracks).toHaveLength(6);
  });
});

describe('library', () => {
  test('round-trips through the JSON file, ids kept', () => {
    const lib = parseLibrary([{ ...MELODY, id: 'a', savedAt: 1 }, { ...RGB, id: 'b', savedAt: 2 }, { ...CHORDS, id: 'c', savedAt: 3 }]);
    expect(lib).toHaveLength(3);
    expect(parseLibrary(JSON.parse(libraryFile(lib)))).toEqual(lib);
    expect(lib[0].tracks).toEqual(MELODY.tracks);
  });

  // The shape saved before arrangements: one track, its steps and octave at the top.
  const LEGACY = {
    id: 'old', savedAt: 5, name: 'Old riff', steps: [{ hex: '#FF0000', alpha: 100 }, null, { hex: '00ff00', alpha: 0 }],
    mode: 'rgb', bpm: 90, subdivision: 16, gatePct: 60, glideMs: 10, octave: -1,
    rgb: { scale: 'major', root: 2, instruments: { r: { name: 'Sub', octave: 1, range: 2, wave: 'sine', level: 80, muted: false } } },
  };
  test('a legacy single-track entry migrates to a one-track arrangement', () => {
    const [arr] = parseLibrary([LEGACY]);
    expect(arr.id).toBe('old');
    expect(arr.savedAt).toBe(5);
    expect(arr.name).toBe('Old riff');
    expect(arr.mode).toBe('rgb');
    expect(arr.bpm).toBe(90);
    expect(arr.subdivision).toBe(16);
    expect(arr.rgb?.instruments.r).toEqual({ name: 'Sub', octave: 1, range: 2, wave: 'sine', level: 80, muted: false });
    expect(arr.rgb?.instruments.b.name).toBe('Lead');
    expect(arr.tracks).toEqual([{
      steps: [{ hex: '#ff0000', alpha: 100 }, null, { hex: '#00ff00', alpha: 0 }], octave: -1, enabled: true, muted: false,
    }]);
    expect(describeArr(arr)).toBe('RGB Instruments - D major - 1 track - 3 steps - 90 BPM');
  });
  test('a version 1 export file (`tracks` of single-track entries) imports', () => {
    const lib = parseLibrary({ format: 'color-taylor-sequencer', version: 1, tracks: [LEGACY, { nope: 1 }] });
    expect(lib).toHaveLength(1);
    expect(lib[0].tracks[0].octave).toBe(-1);
  });
  test('bad entries are dropped, missing instrument names get defaults', () => {
    const lib = parseLibrary({ arrangements: [{ nope: 1 }, { tracks: [] }, { mode: 'rgb', rgb: { instruments: { r: { octave: 2 } } }, tracks: [{ steps: [{ hex: 'fff000' }] }] }] });
    expect(lib).toHaveLength(1);
    expect(lib[0].tracks[0].steps).toEqual([{ hex: '#fff000', alpha: 100 }]);
    expect(lib[0].rgb?.instruments.r.name).toBe('Bass');
  });
  test('arrangementFrom needs tracks or legacy steps', () => {
    expect(arrangementFrom({ mode: 'melody' })).toBeNull();
    expect(arrangementFrom(null)).toBeNull();
  });
  test('describe counts tracks and the longest row', () => {
    expect(describeArr(MELODY)).toBe('Hue Melody - A minor - 4 tracks - 5 steps - 132 BPM');
  });
});
