import { describe, expect, test } from 'bun:test';
import {
  CHANNELS, channelChoices, channelNotes, noteNameToMidi, rgbSongConfig, rgbSongHolds, rgbSongMidis,
  rgbSongSlots, swatchToStep, type Channel, type RgbSong,
} from './sequencer';
import { JAZZ_SONGS, MAPLE_RGB, RHYTHM_RGB, SOFTLY_RGB, arrange } from './sequencerJazzSongs';

const n = noteNameToMidi;
const toks = (s: string) => s.trim().split(/\s+/);

describe('arrange', () => {
  test('"_" everywhere is a tie, "_" beside a strike is a hold', () => {
    expect(arrange({ r: ['C2 _ _'], g: ['E3 _ G3'], b: ['G4 _ _'] }))
      .toEqual({ r: 'C2 - ~', g: 'E3 - G3', b: 'G4 - ~' });
  });
  test('a repeated note over held voices re-strikes them with it', () => {
    expect(arrange({ r: ['C2 _'], g: ['E3 _'], b: ['G4 G4'] })).toEqual({ r: 'C2 C2', g: 'E3 E3', b: 'G4 G4' });
  });
  test('"_" after silence throws', () => {
    expect(() => arrange({ r: ['. _'], g: ['E3 G3'], b: ['G4 A4'] })).toThrow();
  });
});

const CASES: [string, RgbSong, { bpm: number; subdivision: number; root: number; steps: number }][] = [
  ['softly-rgb', SOFTLY_RGB, { bpm: 132, subdivision: 8, root: 0, steps: 256 }],
  ['rhythm-rgb', RHYTHM_RGB, { bpm: 200, subdivision: 8, root: 10, steps: 256 }],
  ['maple-rgb', MAPLE_RGB, { bpm: 96, subdivision: 16, root: 8, steps: 256 }],
];

for (const [key, song, want] of CASES) {
  describe(song.name, () => {
    const cfg = rgbSongConfig(song);

    test('registered, chromatic, 32 bars, the three parts the same length', () => {
      expect(JAZZ_SONGS[key as keyof typeof JAZZ_SONGS]).toBe(song);
      const st = song.settings;
      expect([st.bpm, st.subdivision, st.scale, st.root]).toEqual([want.bpm, want.subdivision, 'chromatic', want.root]);
      for (const ch of CHANNELS) expect(toks(song.parts[ch])).toHaveLength(want.steps);
      expect(rgbSongSlots(song)).toHaveLength(want.steps);
    });

    test('every note inside its instrument\'s range', () => {
      const midis = rgbSongMidis(song);
      for (const ch of CHANNELS) {
        const playable = new Set(channelChoices(ch, cfg));
        const notes = midis.flatMap((w) => (w && w[ch] !== null ? [w[ch] as number] : []));
        expect(notes.length).toBeGreaterThan(40);
        for (const m of notes) expect(playable.has(m)).toBe(true);
      }
    });

    test('every step decodes to its notes, a tie or an empty slot', () => {
      const slots = rgbSongSlots(song);
      const midis = rgbSongMidis(song);
      const holds = rgbSongHolds(song);
      slots.forEach((slot, i) => {
        const w = midis[i];
        const step = swatchToStep(slot, cfg);
        if (w === null) {
          expect(step.rest).toBe(true);
          expect(step.rest && step.tie).toBe(slot !== null);
          return;
        }
        expect(channelNotes(slot!.hex, cfg)).toEqual(w);
        // Held voices carry on and are not struck, so they leave `keys` for `held`.
        const held = holds[i] ?? [];
        expect(step.rest ? null : step.keys).toEqual(CHANNELS.filter((c) => w[c] !== null && !held.includes(c)));
        expect(step.rest ? null : (step.held ?? null)).toEqual(holds[i]);
      });
      // The songs lean on "~": a voice held while another moves.
      expect(holds.filter(Boolean).length).toBeGreaterThan(50);
    });
  });
}

/** The intended notes at bar `bar` (1-based), step `step` (1-based), as MIDI. */
function at(song: RgbSong, bar: number, step: number): Record<Channel, number | null> | null {
  return rgbSongMidis(song)[(bar - 1) * 8 + (step - 1)];
}
const chord = (r: string | null, g: string | null, b: string | null) =>
  ({ r: r === null ? null : n(r), g: g === null ? null : n(g), b: b === null ? null : n(b) });

describe('answer key spot checks', () => {
  test('Softly: the opening, a held lead over the walking bass, the bridge', () => {
    expect(at(SOFTLY_RGB, 1, 1)).toEqual(chord('C2', 'D#3', 'C5'));
    expect(at(SOFTLY_RGB, 1, 5)).toEqual(chord('D#2', 'D#3', 'G4')); // G4 strikes, Eb3 held
    expect(at(SOFTLY_RGB, 1, 7)).toEqual(chord('C#2', 'D#3', 'G4')); // G4 and Eb3 held
    expect(rgbSongHolds(SOFTLY_RGB)[6]).toEqual(['g', 'b']);
    expect(at(SOFTLY_RGB, 2, 1)).toEqual(chord('D2', 'C3', null)); // the lead's eighth rest
    expect(at(SOFTLY_RGB, 17, 1)).toEqual(chord('D#2', 'G2', 'A#4'));
    expect(at(SOFTLY_RGB, 32, 7)).toEqual(chord('G1', 'B2', 'C4')); // the turnaround under the held C
    // Bar 24's repeated F4s: a plain step, all three strike.
    expect(rgbSongHolds(SOFTLY_RGB)[23 * 8 + 2]).toBeNull();
  });

  test('Rhythm: "I got rhy-thm", the bridge push, the last bar', () => {
    const lead = [3, 6, 9, 12].map((s) => at(RHYTHM_RGB, 1 + Math.floor((s - 1) / 8), ((s - 1) % 8) + 1)?.b);
    expect(lead).toEqual([n('F4'), n('G4'), n('A#4'), n('C5')]);
    expect(at(RHYTHM_RGB, 1, 1)).toEqual(chord('A#1', 'D3', null));
    expect(at(RHYTHM_RGB, 17, 6)).toEqual(chord('F#2', 'F#3', 'D5')); // the kick: all re-strike
    expect(rgbSongHolds(RHYTHM_RGB)[16 * 8 + 5]).toBeNull();
    expect(at(RHYTHM_RGB, 18, 4)).toEqual(chord('A2', 'C4', 'E5'));
    expect(at(RHYTHM_RGB, 32, 7)).toEqual(chord('F2', 'D#3', 'A#4'));
  });

  test('Maple Leaf: the opening figure, the Fb chord, the B strain', () => {
    const bar1 = [1, 2, 3, 4, 5, 6, 7, 8].map((s) => at(MAPLE_RGB, 1, s));
    expect(bar1.map((w) => w?.b ?? null)).toEqual([null, n('G#4'), n('D#5'), n('G#4'), n('C5'), n('D#5'), n('D#5'), n('G#4')]);
    expect(bar1[0]).toEqual(chord('G#1', null, null)); // bass alone on the downbeat
    expect(bar1[2]).toEqual(chord(null, 'C4', 'D#5')); // the off-beat stab
    expect(at(MAPLE_RGB, 5, 1)).toEqual(chord('E2', null, null));
    expect(at(MAPLE_RGB, 5, 4)).toEqual(chord(null, null, 'E5'));
    expect(at(MAPLE_RGB, 17, 3)).toEqual(chord(null, 'C#4', 'D#6'));
    expect(at(MAPLE_RGB, 29, 2)).toEqual(chord('F2', null, 'F4'));
  });
});
