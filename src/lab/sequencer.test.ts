import { describe, expect, test } from 'bun:test';
import {
  BUILTIN_PALETTES, CHANNELS, COLTRANE_CHANGES, DEFAULT_RANGES, HOLD_ALPHA, ODE_RGB, RGB_SONGS, SCALES, SCALE_LABELS, SONGS, SPY_STRINGS,
  carrySteps, rgbSongHolds, soundingAfter, sustainedKeys, type Channel, type NoteStep, type RgbSong, type Sounding, type Step,
  channelBase, channelChoices, channelNoteToHex, channelNotes, channelToMidi, chordRootToHex,
  clampGlide, gateSeconds, hueToFifthsRoot, hueToMidi, isLegato, melodyChoices, melodyNoteToHex,
  midiToChannel, midiToHue, noteNameToMidi, parseRecentSlots, parseSavedSlots, rgbSongConfig,
  rgbSongMidis, rgbSongSlots, saturationToCutoff, songConfig, songMidis, songSlots, stepSeconds,
  swatchToStep, type MapConfig, type ScaleName,
  instrumentName, noteIndices, snapToIndices, stickyIndex, stickyIndices,
} from './sequencer';
import { hexToRgb, hsbToRgb, rgbToHex, rgbToHsb } from '../utils/colorConversions';

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

describe('ties', () => {
  test('alpha 0 is a tie whatever the colour; black at full alpha is a rest', () => {
    const tie = swatchToStep({ hex: '#000000', alpha: 0 }, MELODY);
    expect(tie.rest && tie.tie).toBe(true);
    const rest = swatchToStep({ hex: '#000000', alpha: 100 }, MELODY);
    expect(rest.rest && !rest.tie).toBe(true);
    const empty = swatchToStep(null, MELODY);
    expect(empty.rest && !empty.tie).toBe(true);
  });
});

describe('songs', () => {
  test('note names', () => {
    expect(noteNameToMidi('C4')).toBe(60);
    expect(noteNameToMidi('F#4')).toBe(66);
    expect(noteNameToMidi('D2')).toBe(38);
  });

  test('midiToHue is the band centre and refuses notes off the scale', () => {
    expect(midiToHue(62, 'major', 1, 62)).toBeCloseTo(360 / 14);
    expect(() => midiToHue(63, 'major', 1, 62)).toThrow();
    expect(() => midiToHue(50, 'major', 1, 62)).toThrow();
  });

  for (const song of Object.values(SONGS)) {
    for (const partName of ['melody', 'bass'] as const) {
      test(`${song.name} ${partName}: every colour plays its intended note`, () => {
        const part = song[partName];
        const slots = songSlots(song, part);
        const want = songMidis(part);
        expect(slots.length).toBe(64);
        slots.forEach((slot, i) => {
          const step = swatchToStep(slot, songConfig(song, part));
          if (want[i] === null) {
            expect(step.rest).toBe(true);
            // A tie token becomes a tie step, a '.' a plain rest.
            expect(step.rest && step.tie).toBe(slot !== null);
          } else {
            expect(step.rest ? null : step.midis).toEqual([want[i] as number]);
          }
        });
      });
    }
  }
});

const RGB: MapConfig = { mode: 'rgb', scale: 'major', root: 2, octaveRange: 2, octaveOffset: 0 };

describe('RGB Instruments', () => {
  test('channel value picks a degree across its own range; below 8 is silent', () => {
    // Major over 1 octave from D2 (38): 7 buckets over 8..255.
    expect(channelToMidi(7, 'major', 1, 38)).toBeNull();
    expect(channelToMidi(8, 'major', 1, 38)).toBe(38);
    expect(channelToMidi(255, 'major', 1, 38)).toBe(49);
    expect(channelToMidi(128, 'major', 1, 38)).toBe(43);
  });

  test('pure red plays R alone, white all three, black rests', () => {
    const red = swatchToStep({ hex: '#ff0000', alpha: 100 }, RGB);
    expect(red.rest ? null : red.keys).toEqual(['r']);
    const white = swatchToStep({ hex: '#ffffff', alpha: 100 }, RGB);
    expect(white.rest ? null : white.keys).toEqual(['r', 'g', 'b']);
    expect(swatchToStep({ hex: '#000000', alpha: 100 }, RGB).rest).toBe(true);
    const tie = swatchToStep({ hex: '#ffffff', alpha: 0 }, RGB);
    expect(tie.rest && tie.tie).toBe(true);
  });

  test('R is the bass, B the lead, by default', () => {
    const w = swatchToStep({ hex: '#808080', alpha: 100 }, RGB);
    if (w.rest) throw new Error('rest');
    expect(w.midis[0]).toBeLessThan(w.midis[1]);
    expect(w.midis[1]).toBeLessThan(w.midis[2]);
  });

  test('midiToChannel round-trips every note, every scale and range', () => {
    for (const scale of Object.keys(SCALES) as ScaleName[]) {
      for (const range of [1, 2, 3]) {
        const base = 40;
        const table = SCALES[scale];
        for (let i = 0; i < table.length * range; i++) {
          const midi = base + Math.floor(i / table.length) * 12 + table[i % table.length];
          const v = midiToChannel(midi, scale, range, base);
          expect(v).toBeGreaterThanOrEqual(8);
          expect(channelToMidi(v, scale, range, base)).toBe(midi);
        }
      }
    }
  });

  test('Ode to Joy, full theme: 16 bars of 1/8 steps, every note inside its instrument\'s range', () => {
    const cfg = rgbSongConfig(ODE_RGB);
    expect(rgbSongSlots(ODE_RGB).length).toBe(128);
    const want = rgbSongMidis(ODE_RGB);
    for (const ch of CHANNELS) {
      const playable = new Set(channelChoices(ch, cfg));
      const notes = want.flatMap((w) => (w && w[ch] !== null ? [w[ch] as number] : []));
      expect(notes.length).toBeGreaterThan(50);
      for (const n of notes) expect(playable.has(n)).toBe(true);
    }
    // The lead's lowest note is the A3 of bar 12.
    expect(Math.min(...want.flatMap((w) => (w?.b ? [w.b] : [])))).toBe(57);
    // Bar 12 beat 4: the lead's F#4 enters over the A harmony still held (E3, A2)...
    expect(want[94]).toEqual({ r: 45, g: 52, b: 66 });
    expect(rgbSongHolds(ODE_RGB)[94]).toEqual(['r', 'g']);
    // ...and on the downbeat of bar 13 the lead holds while harmony and bass strike D.
    expect(want[96]).toEqual({ r: 38, g: 54, b: 66 });
    expect(rgbSongHolds(ODE_RGB)[96]).toEqual(['b']);
    expect([want[95], want[97]]).toEqual([null, null]);
  });

  test('Ode to Joy, full theme: every step decodes to its three notes, a tie or a rest', () => {
    const cfg = rgbSongConfig(ODE_RGB);
    const slots = rgbSongSlots(ODE_RGB);
    const want = rgbSongMidis(ODE_RGB);
    slots.forEach((slot, i) => {
      const w = want[i];
      if (w === null) {
        const step = swatchToStep(slot, cfg);
        expect(step.rest && step.tie).toBe(true);
        return;
      }
      expect(channelNotes(slot!.hex, cfg)).toEqual(w);
      const step = swatchToStep(slot, cfg);
      expect(step.rest ? null : step.keys).toEqual(CHANNELS.filter((c) => w[c] !== null));
    });
  });
});

describe('note pickers', () => {
  const HUE_CFGS: MapConfig[] = [
    MELODY,
    { ...MELODY, scale: 'chromatic', octaveRange: 3, root: 5, baseOctave: 2 },
    { ...MELODY, scale: 'minor', octaveRange: 1, octaveOffset: 1 },
  ];
  test('melody: every choice, from any starting colour, plays that note', () => {
    for (const cfg of HUE_CFGS) {
      for (const start of ['#ffffff', '#000000', '#3a2f1c', '#ff0000', '#20c0f0']) {
        for (const midi of melodyChoices(cfg)) {
          const hex = melodyNoteToHex(start, midi, cfg);
          const step = swatchToStep({ hex, alpha: 100 }, cfg);
          expect(step.rest ? null : step.midis).toEqual([midi]);
        }
      }
    }
  });

  test('melody keeps S and B when they are high enough', () => {
    const hex = melodyNoteToHex('#804040', 55, MELODY);
    expect(hex).not.toBe('#804040');
    // #804040 is S 50, B 50: both above the floors, so kept.
    expect(swatchToStep({ hex, alpha: 100 }, MELODY).rest).toBe(false);
  });

  test('chord root: every pitch class, keeping minor for low saturation', () => {
    const cfg: MapConfig = { ...MELODY, mode: 'chords', root: 3 };
    for (let pc = 0; pc < 12; pc++) {
      const major = swatchToStep({ hex: chordRootToHex('#ff0000', pc, cfg), alpha: 100 }, cfg);
      expect(major.rest ? null : major.label).toBe(['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'][pc]);
      const minor = swatchToStep({ hex: chordRootToHex('#808080', pc, cfg), alpha: 100 }, cfg);
      expect(minor.rest ? null : minor.label.endsWith('m')).toBe(true);
    }
  });

  test('channel pickers set one channel and leave the others', () => {
    for (const ch of CHANNELS) {
      for (const midi of channelChoices(ch, RGB)) {
        const hex = channelNoteToHex('#102030', ch, midi, RGB);
        expect(channelNotes(hex, RGB)[ch]).toBe(midi);
      }
    }
    expect(channelNoteToHex('#ffffff', 'g', null, RGB)).toBe('#ff00ff');
    const base = channelBase(DEFAULT_RANGES.r, 2, 0);
    expect(channelChoices('r', RGB)[0]).toBe(base);
  });
});

describe('stickyIndex', () => {
  // 10 buckets, each 0.1 wide; margin 0.2 of a bucket = 0.02.
  test('no previous index: the plain bucket', () => {
    expect(stickyIndex(0.35, null, 10)).toBe(3);
    expect(stickyIndex(1, null, 10)).toBe(9);
    expect(stickyIndex(-0.5, null, 10)).toBe(0);
  });
  test('holds inside the margin past either edge', () => {
    expect(stickyIndex(0.41, 3, 10)).toBe(3); // 0.1 bucket past the top edge
    expect(stickyIndex(0.29, 3, 10)).toBe(3); // 0.1 bucket under the bottom edge
    expect(stickyIndex(0.419, 3, 10)).toBe(3);
  });
  test('moves once past the margin', () => {
    expect(stickyIndex(0.425, 3, 10)).toBe(4);
    expect(stickyIndex(0.275, 3, 10)).toBe(2);
    expect(stickyIndex(0.9, 3, 10)).toBe(9); // a jump lands on the bucket under it
  });
  test('the margin is a parameter', () => {
    expect(stickyIndex(0.425, 3, 10, 0.3)).toBe(3);
    expect(stickyIndex(0.405, 3, 10, 0)).toBe(4);
  });
  test('an out-of-range previous index is ignored', () => {
    expect(stickyIndex(0.35, 12, 10)).toBe(3);
    expect(stickyIndex(0.35, -1, 10)).toBe(3);
  });
  test('wrap: the first and last buckets are neighbours', () => {
    expect(stickyIndex(0.01, 9, 10, 0.2, true)).toBe(9); // 0.1 bucket past 1.0
    expect(stickyIndex(0.03, 9, 10, 0.2, true)).toBe(0);
    expect(stickyIndex(0.99, 0, 10, 0.2, true)).toBe(0);
    expect(stickyIndex(0.97, 0, 10, 0.2, true)).toBe(9);
    // without wrap the same move is a long way off
    expect(stickyIndex(0.01, 9, 10)).toBe(0);
  });
});

describe('sticky notes on a colour', () => {
  const hueHex = (h: number) => { const c = hsbToRgb(h, 100, 100); return rgbToHex(c.r, c.g, c.b); };
  test('noteIndices agrees with swatchToStep', () => {
    for (let h = 0; h < 360; h += 7) {
      const hex = hueHex(h);
      const idx = noteIndices(hex, MELODY)[0];
      const step = swatchToStep({ hex, alpha: 100 }, MELODY);
      expect(step.rest).toBe(false);
      if (!step.rest) expect(step.midis[0]).toBe(melodyChoices(MELODY)[idx]);
    }
    const RGB: MapConfig = { ...MELODY, mode: 'rgb' };
    expect(noteIndices('#000000', RGB)).toEqual([-1, -1, -1]);
    expect(noteIndices('#000000', MELODY)).toEqual([-1]);
  });
  test('a hue just over a boundary keeps the note, well over moves it', () => {
    // Pentatonic over 2 octaves: 10 bands of 36 degrees; band 2 is 72..108.
    expect(stickyIndices(hueHex(110), MELODY, [2])).toEqual([2]);
    expect(stickyIndices(hueHex(118), MELODY, [2])).toEqual([3]);
  });
  test('snapToIndices lands on the bucket centre and plays that note', () => {
    const snapped = snapToIndices(hueHex(110), MELODY, [2]);
    expect(noteIndices(snapped, MELODY)).toEqual([2]);
    const { r, g, b } = hexToRgb(snapped)!;
    expect(Math.abs(rgbToHsb(r, g, b).h - 90)).toBeLessThan(1.5);
    const RGB: MapConfig = { ...MELODY, mode: 'rgb' };
    const s2 = snapToIndices('#7f0305', RGB, [4, -1, -1]);
    expect(noteIndices(s2, RGB)).toEqual([4, -1, -1]);
  });
});

describe('instrument names', () => {
  test('the step detail names each instrument', () => {
    const cfg: MapConfig = { ...MELODY, mode: 'rgb', names: { r: 'Low', g: '', b: 'Top' } };
    const step = swatchToStep({ hex: '#ffffff', alpha: 100 }, cfg);
    expect(step.rest).toBe(false);
    if (!step.rest) expect(step.detail).toMatch(/^Low \S+ · Harmony \S+ · Top \S+$/);
    expect(instrumentName('r', {})).toBe('Bass');
  });
});

describe('harmonic minor and Phrygian dominant', () => {
  test('the tables', () => {
    expect(SCALES.harmonicMinor).toEqual([0, 2, 3, 5, 7, 8, 11]);
    expect(SCALES.phrygianDominant).toEqual([0, 1, 4, 5, 7, 8, 10]);
    // Phrygian dominant is harmonic minor's fifth mode: the same notes from the 5th.
    const fifthMode = SCALES.harmonicMinor.map((d) => (d - 7 + 12) % 12).sort((a, b) => a - b);
    expect(fifthMode).toEqual([...SCALES.phrygianDominant]);
    expect(Object.keys(SCALE_LABELS).sort()).toEqual(Object.keys(SCALES).sort());
  });

  for (const scale of ['harmonicMinor', 'phrygianDominant'] as ScaleName[]) {
    test(`${scale}: every note round-trips through hue and through a channel, and the pickers offer it`, () => {
      const hueCfg: MapConfig = { mode: 'melody', scale, root: 4, octaveRange: 2, octaveOffset: 0 };
      const hueNotes = melodyChoices(hueCfg);
      expect(hueNotes).toHaveLength(14);
      for (const midi of hueNotes) {
        const hex = melodyNoteToHex('#ff0000', midi, hueCfg);
        const step = swatchToStep({ hex, alpha: 100 }, hueCfg);
        expect(step.rest ? null : step.midis).toEqual([midi]);
      }
      const rgbCfg: MapConfig = { mode: 'rgb', scale, root: 4, octaveRange: 1, octaveOffset: 0, ranges: DEFAULT_RANGES };
      for (const ch of CHANNELS) {
        const notes = channelChoices(ch, rgbCfg);
        expect(notes).toHaveLength(7 * DEFAULT_RANGES[ch].range);
        for (const midi of notes) {
          const hex = channelNoteToHex('#000000', ch, midi, rgbCfg);
          expect(channelNotes(hex, rgbCfg)[ch]).toBe(midi);
        }
      }
      // A note off the scale is refused by the inverse mapping.
      const offScale = [...Array(12).keys()].find((pc) => !SCALES[scale].includes(pc))!;
      expect(() => midiToHue(60 + offScale, scale, 1, 60)).toThrow();
    });
  }
});

describe('Spy Strings', () => {
  const cfg = rgbSongConfig(SPY_STRINGS);
  const slots = rgbSongSlots(SPY_STRINGS);
  const want = rgbSongMidis(SPY_STRINGS);

  test('eight bars of 1/16 in D harmonic minor at 140, gate 25, no glide, a sawtooth lead', () => {
    expect(RGB_SONGS['spy-rgb']).toBe(SPY_STRINGS);
    expect(slots).toHaveLength(128);
    const st = SPY_STRINGS.settings;
    expect([st.bpm, st.subdivision, st.scale, st.root, st.gatePct, st.glideMs, st.waves?.b]).toEqual([140, 16, 'harmonicMinor', 2, 25, 0, 'sawtooth']);
    for (const ch of CHANNELS) {
      const playable = new Set(channelChoices(ch, cfg));
      const notes = want.flatMap((w) => (w && w[ch] !== null ? [w[ch] as number] : []));
      expect(notes.length).toBeGreaterThan(20);
      for (const n of notes) expect(playable.has(n)).toBe(true);
    }
    // The bass line, one note per two bars: D3 C#3 A#2 A2.
    expect([0, 32, 64, 96].map((i) => want[i]?.r)).toEqual([50, 49, 46, 45]);
    // Ties hold the chords closing bars 4 and 8.
    for (const i of [61, 62, 63, 125, 126, 127]) expect(slots[i]?.alpha).toBe(0);
  });

  test('every step decodes to its notes, a tie or an empty slot', () => {
    slots.forEach((slot, i) => {
      const w = want[i];
      const step = swatchToStep(slot, cfg);
      if (w === null) {
        expect(step.rest).toBe(true);
        expect(step.rest && step.tie).toBe(slot !== null);
        return;
      }
      expect(channelNotes(slot!.hex, cfg)).toEqual(w);
      expect(step.rest ? null : step.keys).toEqual(CHANNELS.filter((c) => w[c] !== null));
    });
  });
});

/** Plays a row through the hold rule the engine uses: the keys each step strikes, null for a tie or rest. */
function struck(steps: Step[]): (string[] | null)[] {
  let now: Sounding = new Map();
  return steps.map((step) => {
    const out = step.rest ? null : step.keys.filter((k) => !sustainedKeys(step, now).has(k));
    now = soundingAfter(step, now);
    return out;
  });
}

const note = (keys: string[], midis: number[], hold = false): NoteStep => ({
  rest: false, hex: '#000000', midis, keys, rgb: true, levels: midis.map(() => 1), velocity: 1, cutoff: 8000, label: '', detail: '', hold,
});
const TIE: Step = { rest: true, tie: true, hex: '#000000', label: 'tie' };
const REST: Step = { rest: true, tie: false, hex: null, label: 'rest' };

describe('hold steps', () => {
  test('alpha HOLD_ALPHA is a hold at full accent; alpha 0 still a tie', () => {
    const h = swatchToStep({ hex: '#ffffff', alpha: HOLD_ALPHA }, RGB);
    expect(h.rest ? null : [h.hold, h.velocity]).toEqual([true, 1]);
    expect(h.rest ? '' : h.detail).toMatch(/^hold - /);
    const plain = swatchToStep({ hex: '#ffffff', alpha: 50 }, RGB);
    expect(plain.rest ? null : [!!plain.hold, plain.velocity]).toEqual([false, 0.5]);
    const tie = swatchToStep({ hex: '#ffffff', alpha: 0 }, RGB);
    expect(tie.rest && tie.tie).toBe(true);
    // Black at the hold alpha is still a rest - there is nothing to hold with.
    expect(swatchToStep({ hex: '#000000', alpha: HOLD_ALPHA }, RGB).rest).toBe(true);
  });

  test('a hold strikes only the voices whose note changed', () => {
    const prev: Sounding = new Map([['r', 45], ['g', 52], ['b', 57]]);
    expect([...sustainedKeys(note(['r', 'g', 'b'], [45, 52, 66], true), prev)]).toEqual(['r', 'g']);
    // A plain step strikes every voice, changed or not.
    expect([...sustainedKeys(note(['r', 'g', 'b'], [45, 52, 66]), prev)]).toEqual([]);
    // A voice silent before the hold strikes; one silent in it stops.
    expect([...sustainedKeys(note(['g', 'b'], [52, 57], true), new Map([['b', 57]]))]).toEqual(['b']);
    expect(soundingAfter(note(['b'], [57], true), prev)).toEqual(new Map([['b', 57]]));
    expect(soundingAfter(TIE, prev)).toEqual(new Map(prev));
    expect(soundingAfter(REST, prev)).toEqual(new Map());
  });

  test('hue modes: a hold on the same note is a tie, on a new note a full-accent note', () => {
    const red = swatchToStep({ hex: '#ff0000', alpha: 100 }, MELODY);
    const redHold = swatchToStep({ hex: '#ff0000', alpha: HOLD_ALPHA }, MELODY);
    const blueHold = swatchToStep({ hex: '#0000ff', alpha: HOLD_ALPHA }, MELODY);
    expect(struck([red, redHold, blueHold])).toEqual([['0'], [], ['0']]);
    expect(blueHold.rest ? 0 : blueHold.velocity).toBe(1);
  });

  test('a voice carries on through ties and through holds that keep its note', () => {
    const steps: Step[] = [
      note(['r', 'b'], [38, 66]), TIE, note(['r', 'b'], [45, 66], true), note(['r', 'b'], [45, 67], true), REST,
    ];
    expect(carrySteps(steps, 0, 'b', 66)).toBe(2);
    expect(carrySteps(steps, 0, 'r', 38)).toBe(1);
    expect(carrySteps(steps, 2, 'r', 45)).toBe(1);
    expect(struck(steps)).toEqual([['r', 'b'], null, ['r'], ['b'], null]);
    // Round the loop, but not past the end when the row plays once.
    const loop: Step[] = [note(['b'], [60], true), note(['b'], [62]), TIE];
    expect(carrySteps(loop, 1, 'b', 62)).toBe(1);
    expect(carrySteps(loop, 2, 'b', 60)).toBe(1);
    expect(carrySteps(loop, 2, 'b', 60, false)).toBe(0);
  });
});

describe('RGB song tokens: "~" holds one voice', () => {
  const song = (b: string, g: string, r: string): RgbSong => ({
    name: 't', settings: { bpm: 100, subdivision: 8, scale: 'major', root: 2, octaveRange: 2, ranges: DEFAULT_RANGES }, parts: { r, g, b },
  });
  test('a "~" step is a hold whose held voices keep their note', () => {
    const s = song('F#4 ~ ~ -', 'D4 E4 ~ -', 'D2 ~ A2 -');
    const slots = rgbSongSlots(s);
    expect(slots.map((x) => x?.alpha)).toEqual([100, HOLD_ALPHA, HOLD_ALPHA, 0]);
    expect(rgbSongMidis(s)).toEqual([
      { r: 38, g: 62, b: 66 }, { r: 38, g: 64, b: 66 }, { r: 45, g: 64, b: 66 }, null,
    ]);
    expect(rgbSongHolds(s)).toEqual([null, ['r', 'b'], ['g', 'b'], null]);
    const cfg = rgbSongConfig(s);
    expect(struck(slots.map((x) => swatchToStep(x, cfg)))).toEqual([['r', 'g', 'b'], ['g'], ['r'], null]);
  });
  test('malformed holds throw', () => {
    expect(() => rgbSongSlots(song('~ F#4', 'D4 E4', 'D2 A2'))).toThrow(/holds with nothing/);
    expect(() => rgbSongSlots(song('F#4 G4', 'D4 D4', 'D2 ~'))).toThrow(/repeats its note/);
    expect(() => rgbSongSlots(song('F#4 -', 'D4 ~', 'D2 -'))).toThrow(/tie must hold all three/);
    expect(() => rgbSongSlots(song('F#4 .', 'D4 .', '. ~'))).toThrow(/holds with nothing/);
  });
});

/** Every step of an RGB song decodes to its notes, and plays through the hold rule striking exactly the voices not written "~". */
function roundTrip(song: RgbSong) {
  const cfg = rgbSongConfig(song);
  const slots = rgbSongSlots(song);
  const want = rgbSongMidis(song);
  const holds = rgbSongHolds(song);
  const steps = slots.map((slot) => swatchToStep(slot, cfg));
  const hits = struck(steps);
  slots.forEach((slot, i) => {
    const w = want[i];
    const step = steps[i];
    if (w === null) {
      expect(step.rest).toBe(true);
      expect(step.rest && step.tie).toBe(slot !== null);
      return;
    }
    expect(channelNotes(slot!.hex, cfg)).toEqual(w);
    const sounding = CHANNELS.filter((c) => w[c] !== null);
    expect(step.rest ? null : step.keys).toEqual(sounding);
    expect(hits[i]).toEqual(sounding.filter((c) => !(holds[i] ?? []).includes(c)));
  });
  for (const ch of CHANNELS) {
    const playable = new Set(channelChoices(ch, cfg));
    for (const w of want) if (w && w[ch] !== null) expect(playable.has(w[ch] as number)).toBe(true);
  }
}

describe('songs with holds round-trip', () => {
  test('Ode to Joy: every step, holds included; the bar 13 downbeat strikes harmony and bass only', () => {
    roundTrip(ODE_RGB);
    const hits = struck(rgbSongSlots(ODE_RGB).map((s) => swatchToStep(s, rgbSongConfig(ODE_RGB))));
    expect(hits[94]).toEqual(['b']);
    expect(hits[96]).toEqual(['r', 'g']);
  });
  test('Spy Strings still round-trips', () => roundTrip(SPY_STRINGS));
});

describe('Coltrane Changes (original line)', () => {
  const want = rgbSongMidis(COLTRANE_CHANGES);
  test('16 bars of eighths in half time, chromatic from C, in the RGB song menu', () => {
    expect(RGB_SONGS['coltrane-rgb']).toBe(COLTRANE_CHANGES);
    expect(rgbSongSlots(COLTRANE_CHANGES)).toHaveLength(128);
    const st = COLTRANE_CHANGES.settings;
    expect([st.bpm, st.subdivision, st.scale, st.root]).toEqual([140, 16, 'chromatic', 0]);
    roundTrip(COLTRANE_CHANGES);
  });
  test('the bass lands on each chord root as the chord arrives', () => {
    // [step, pitch class]: a change every half tune bar (4 steps) or bar (8).
    const roots: [number, number][] = [
      [0, 11], [4, 2], [8, 7], [12, 10], [16, 3], [24, 9], [28, 2], [32, 7], [36, 10], [40, 3], [44, 6], [48, 11],
      [56, 5], [60, 10], [64, 3], [72, 9], [76, 2], [80, 7], [88, 1], [92, 6], [96, 11], [104, 5], [108, 10], [112, 3],
      [120, 1], [124, 6],
    ];
    for (const [i, pc] of roots) expect((want[i]?.r ?? -1) % 12).toBe(pc);
  });
  test('the harmony stays between the bass and the lead', () => {
    for (const w of want) {
      if (!w) continue;
      const on = (ch: Channel) => w[ch];
      if (on('g') !== null && on('b') !== null) expect(on('g')!).toBeLessThan(on('b')!);
      if (on('r') !== null && on('g') !== null) expect(on('r')!).toBeLessThan(on('g')!);
    }
  });
});
