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
      expect(hash).toMatch(/^#seq=v3;[A-Za-z0-9%;:,.@_=-]+$/);
    });
  }
  test('a v1 single-track link still opens, as a one-track arrangement, its old tie migrated', () => {
    const arr = decodeShare('#seq=v1;nm:Old;m:melody;t:120;d:16;g:70;l:40;o:-1;s:major;r:2;b:3;n:2;w:sine;x:ff0000,.,00ff00@0');
    expect(arr?.name).toBe('Old');
    expect(arr?.melody?.scale).toBe('major');
    expect(arr?.tracks).toEqual([{
      steps: [{ hex: '#ff0000', alpha: 100 }, null, { hex: '#00ff00', alpha: 13 }], octave: -1, enabled: true, muted: false,
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

describe('the new scales', () => {
  for (const scale of ['harmonicMinor', 'phrygianDominant'] as const) {
    test(`${scale} survives the share link and the library, and is described by name`, () => {
      const hue: Arrangement = { ...MELODY, melody: { ...MELODY.melody!, scale } };
      const rgb: Arrangement = { ...RGB, rgb: { ...RGB.rgb!, scale } };
      for (const arr of [hue, rgb]) {
        expect(decodeShare(`#${encodeShare(arr)}`)).toEqual(arr);
        const lib = parseLibrary([{ ...arr, id: 'x', savedAt: 1 }]);
        expect(parseLibrary(JSON.parse(libraryFile(lib)))).toEqual(lib);
      }
      expect(describeArr(rgb)).toContain(scale === 'harmonicMinor' ? 'D harmonic minor' : 'D phrygian dominant');
    });
  }
});

describe('migrating from before the hold notches', () => {
  // D major RGB, default-ish ranges: R D2 (1 octave), G D3 (2), B D4 (2).
  const OLD_RGB = {
    name: 'Old holds', mode: 'rgb', bpm: 100, subdivision: 8, gatePct: 70, glideMs: 0,
    rgb: {
      scale: 'major', root: 2, instruments: {
        r: { name: 'Bass', octave: 2, range: 1, wave: 'sine', level: 90, muted: false },
        g: { name: 'Harmony', octave: 3, range: 2, wave: 'triangle', level: 70, muted: false },
        b: { name: 'Lead', octave: 4, range: 2, wave: 'sawtooth', level: 70, muted: false },
      },
    },
    // A chord, an old tie, an old hold moving only R (G and B unchanged), an old accent.
    tracks: [{ steps: [{ hex: '#406080', alpha: 100 }, { hex: '#406080', alpha: 0 }, { hex: '#a06080', alpha: 1 }, { hex: '#a06080', alpha: 40 }], octave: 0 }],
  };
  const MIGRATED = [{ hex: '#406080', alpha: 100 }, { hex: '#406080', alpha: 13 }, { hex: '#a06080', alpha: 25 }, { hex: '#a06080', alpha: 100 }];

  test('a version 2 file: ties to 13, holds to the unchanged voices\' mask, accents to 100', () => {
    const lib = parseLibrary({ format: 'color-taylor-sequencer', version: 2, arrangements: [{ ...OLD_RGB, id: 'o', savedAt: 1 }] });
    expect(lib[0].tracks[0].steps).toEqual(MIGRATED);
  });
  test('a bare stored list migrates only when told it is old', () => {
    expect(parseLibrary([OLD_RGB], true)[0].tracks[0].steps).toEqual(MIGRATED);
    expect(parseLibrary([OLD_RGB])[0].tracks[0].steps).toEqual(OLD_RGB.tracks[0].steps);
  });
  test('a version 3 file is read as written: alpha 0 is a silence', () => {
    const lib = parseLibrary(JSON.parse(libraryFile(parseLibrary([{ ...OLD_RGB, id: 'o', savedAt: 1 }]))));
    expect(lib[0].tracks[0].steps).toEqual(OLD_RGB.tracks[0].steps);
    expect(JSON.parse(libraryFile(lib)).version).toBe(3);
  });
  test('a v2 share link migrates; a v3 one does not', () => {
    const arr = arrangementFrom(OLD_RGB)!;
    const v3 = encodeShare(arr);
    expect(decodeShare(v3)?.tracks[0].steps).toEqual(OLD_RGB.tracks[0].steps);
    expect(decodeShare(v3.replace('seq=v3;', 'seq=v2;'))?.tracks[0].steps).toEqual(MIGRATED);
  });
  test('arrangementFrom migrates under the track\'s own octave and mode', () => {
    const hue = {
      name: 'h', mode: 'melody', melody: { scale: 'major', root: 0, baseOctave: 3, octaveRange: 2, wave: 'sine' },
      tracks: [{ steps: [{ hex: '#ff0000', alpha: 100 }, { hex: '#ff0000', alpha: 1 }, { hex: '#0000ff', alpha: 1 }, { hex: '#0000ff', alpha: 0 }], octave: 1 }],
    };
    expect(arrangementFrom(hue, true)?.tracks[0].steps.map((s) => s?.alpha)).toEqual([100, 13, 100, 13]);
  });
});

describe('loop', () => {
  test('play-once rides in the share link and the library; looping is the default and stays implicit', () => {
    const once: Arrangement = { ...RGB, loop: false };
    const hash = `#${encodeShare(once)}`;
    expect(hash).toContain(';lp:0;');
    expect(decodeShare(hash)).toEqual(once);
    expect(encodeShare(RGB)).not.toContain('lp:');
    const lib = parseLibrary([{ ...once, id: 'x', savedAt: 1 }]);
    expect(lib[0].loop).toBe(false);
    expect(parseLibrary(JSON.parse(libraryFile(lib)))).toEqual(lib);
    expect(arrangementFrom(JSON.parse(JSON.stringify(RGB)))?.loop).toBeUndefined();
  });
});
