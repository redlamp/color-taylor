/**
 * Three public-domain standards as RGB Instruments tracks: Romberg's "Softly,
 * as in a Morning Sunrise" (1928), Gershwin's "I Got Rhythm" (1930) and
 * Joplin's "Maple Leaf Rag" (1899). The melodies are the composers'; the bass
 * and harmony parts are written for this lab, not taken from any arrangement.
 *
 * Each voice is written on its own, bar by bar, with "_" for "my note carries
 * on" - a voice's rhythm reads more plainly that way than as three aligned
 * columns. `arrange` then turns the three voices into the song's token
 * columns (see `RgbSong.parts`):
 *
 *   - a step where every voice is "_" becomes a tie, "-" in all three;
 *   - otherwise each "_" becomes "~", the voice holding while others strike;
 *   - a hold step may not re-strike a voice on the note it is already
 *     sounding (it would carry on instead). Where a melody repeats a note
 *     over held voices, that step becomes a plain step and the held voices
 *     re-strike their notes with it - a rhythm-section "kick" on the accent.
 *     Each case is listed in the song's comment.
 */
import type { Channel, RgbSong } from './sequencer';

const CH: readonly Channel[] = ['r', 'g', 'b'];

/** "F#4" -> 66, as `noteNameToMidi` in sequencer.ts; kept local so this file only needs types from there. */
function midiOf(name: string): number {
  const m = /^([A-G]#?)(-?\d)$/.exec(name);
  if (!m) throw new Error(`bad note name: ${name}`);
  const pc = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'].indexOf(m[1]);
  return (Number(m[2]) + 1) * 12 + pc;
}

/**
 * Three independently written voices (bars of tokens: a note, "." silent, "_"
 * carry on) -> the aligned RgbSong columns. Throws on a "_" with nothing
 * sounding or bars of different lengths.
 */
export function arrange(voices: Record<Channel, readonly string[]>): Record<Channel, string> {
  const barCount = voices.r.length;
  if (CH.some((c) => voices[c].length !== barCount)) throw new Error('voices have different bar counts');
  const sounding: Record<Channel, string | null> = { r: null, g: null, b: null };
  const out: Record<Channel, string[]> = { r: [], g: [], b: [] };
  for (let bar = 0; bar < barCount; bar++) {
    const cols = CH.map((c) => voices[c][bar].trim().split(/\s+/));
    if (cols.some((col) => col.length !== cols[0].length)) throw new Error(`bar ${bar + 1}: voices differ in length`);
    const row: Record<Channel, string[]> = { r: [], g: [], b: [] };
    cols[0].forEach((_, i) => {
      const toks = CH.map((_c, k) => cols[k][i]);
      CH.forEach((c, k) => {
        if (toks[k] === '_' && sounding[c] === null) throw new Error(`bar ${bar + 1} step ${i + 1}: ${c} carries on with nothing sounding`);
      });
      if (toks.every((t) => t === '_')) {
        CH.forEach((c) => row[c].push('-'));
        return;
      }
      const hold = toks.includes('_');
      const restrike = hold && CH.some((c, k) => toks[k] !== '_' && toks[k] !== '.' && sounding[c] !== null && midiOf(toks[k]) === midiOf(sounding[c]!));
      CH.forEach((c, k) => {
        const t = toks[k];
        if (t === '_') row[c].push(restrike ? sounding[c]! : '~');
        else row[c].push(t);
        if (t === '.') sounding[c] = null;
        else if (t !== '_') sounding[c] = t;
      });
      if (toks.every((t) => t === '.')) CH.forEach((c) => { sounding[c] = null; });
    });
    CH.forEach((c) => out[c].push(row[c].join(' ')));
  }
  return { r: out.r.join('   '), g: out.g.join('   '), b: out.b.join('   ') };
}

// --- Softly, as in a Morning Sunrise ------------------------------------------

/*
 * Softly, as in a Morning Sunrise - Sigmund Romberg, 1928, from "The New Moon"
 * (public domain). The 32-bar chorus, A A B A, in C minor, 4/4 as 1/8 steps
 * (8 a bar, 256 steps), 132 BPM: a medium swing written straight.
 *
 * Scale: chromatic, root C. Harmonic minor would not do: the bridge melody
 * has E natural (bars 19-20) and D natural over F#dim7, and the changes need
 * B natural (G7), E natural and Db (C7b9), F# and A (F#dim7).
 *
 * Lead = the tune; Harmony = one guide tone (3rd or 7th) per chord, moving
 * by step where it can; Bass = roots on the chord changes, walking quarters
 * into the next change. Notes per bar (h half, w whole, q quarter, e eighth,
 * "(e)" an eighth rest; "~" in the Bass/Harmony column = held):
 *
 *   bar chords           Lead                          Harmony        Bass
 *   A   1 Cm7            C5 h, G4 h                    Eb3 w          C2 h, Eb2 q, C#2 q
 *       2 Dm7b5 G7b9     (e) F4 G4 F4 e, G4 q, F4 q    C3 h, B2 h     D2 F2 G1 B1 q
 *       3 Cm7            C5 h, Eb4 h                   Bb2 w          C2 h, G1 q, C#2 q
 *       4 Dm7b5 G7b9     (e) D4 Eb4 D4 e, Eb4 q, D4 q  C3 h, B2 h     D2 F2 G1 B1 q
 *       5 Cm7            G4 h, C4 h                    Eb3 w          C2 h, Bb1 q, C#2 q
 *       6 Dm7b5 G7b9     (e) F4 G4 F4 e, Eb4 q, D4 q   F3 w           D2 F2 G1 B1 q
 *       7 Cm7            C4 w                          Eb3 w          C2 h, Eb2 q, C#2 q
 *       8 Dm7b5 G7b9     (C4 held a q), rests          C3 h, B2 h     D2 F2 G1 B1 q
 *   A   9-14 as 1-6
 *      15 Cm7            C4 w                          Eb3 w          C2 h, D2 q, E2 q
 *      16 Fm7 Bb7        C4 held e, D4 q, Eb4 e,       Ab2 w          F2 C2 Bb1 D2 q
 *                        F4 e, G4 q, Ab4 e  (*)
 *   B  17 Ebmaj7         Bb4 h, Eb4 h                  G2 w           Eb2 h, Bb1 h
 *      18 Ebmaj7         (e) Bb4 C5 Bb4 e, C5 q, Bb4 q D3 w           Eb2 G2 D2 Db2 q
 *      19 C7b9           Bb4 h, E4 h                   E3 w           C2 h, G1 h
 *      20 C7b9           E4 held dotted q, F4 e, G4 e, Bb2 w          C2 E2 G2 E2 q
 *                        Ab4 q, Bb4 e  (*)
 *      21 Fm7            C5 h, F4 h                    Ab2 w          F2 h, Ab2 q, G2 q
 *      22 F#dim7         (e) C5 D5 C5 e, D5 q, C5 q    A2 w           F#2 h, A2 q, Eb2 q
 *      23 Dm7b5          D5 w                          C3 w           D2 h, C2 q, Ab1 q
 *      24 G7b9           F4 q, F4 e, F4 e, Eb4 q, D4 q B2 w           G1 h, D2 q, B1 q
 *   A  25-31 as 1-7
 *      32 (Cm7) Dm7b5 G7 C4 held on, w                 C3 h, B2 h     C2 Eb2 D2 G1 q (turnaround)
 *
 * (*) Unsure / approximated: the lead sheet has quarter-note triplets in bars
 * 16 and 20 (C-D-Eb, F-G-Ab; E-E-F, G-Ab-Bb), which 1/8 steps cannot hold, so
 * they are rounded to the nearest eighth; bar 20's re-struck E is dropped. A
 * musician should check bars 16, 20 and 24 (F-F-F-Eb-D) against the score.
 *
 * Kicks (see `arrange`): bar 24's repeated F4s - the held Bass and Harmony
 * re-strike with them.
 *
 * Ranges: Bass C1..B2 (octave 1, 2 octaves; notes G1..A2), Harmony C2..B3
 * (octave 2, 2; notes G2..F3), Lead C4..B5 (octave 4, 2; notes C4..D5).
 */
const SOFTLY_A_LEAD = [
  'C5 _ _ _ G4 _ _ _', '. F4 G4 F4 G4 _ F4 _', 'C5 _ _ _ D#4 _ _ _', '. D4 D#4 D4 D#4 _ D4 _',
  'G4 _ _ _ C4 _ _ _', '. F4 G4 F4 D#4 _ D4 _', 'C4 _ _ _ _ _ _ _',
];
const SOFTLY_A_HARMONY = [
  'D#3 _ _ _ _ _ _ _', 'C3 _ _ _ B2 _ _ _', 'A#2 _ _ _ _ _ _ _', 'C3 _ _ _ B2 _ _ _',
  'D#3 _ _ _ _ _ _ _', 'F3 _ _ _ _ _ _ _', 'D#3 _ _ _ _ _ _ _',
];
const SOFTLY_A_BASS = [
  'C2 _ _ _ D#2 _ C#2 _', 'D2 _ F2 _ G1 _ B1 _', 'C2 _ _ _ G1 _ C#2 _', 'D2 _ F2 _ G1 _ B1 _',
  'C2 _ _ _ A#1 _ C#2 _', 'D2 _ F2 _ G1 _ B1 _', 'C2 _ _ _ D#2 _ C#2 _',
];
const SOFTLY_PARTS = arrange({
  b: [
    ...SOFTLY_A_LEAD, '_ _ . . . . . .',
    ...SOFTLY_A_LEAD, '_ D4 _ D#4 F4 G4 _ G#4',
    'A#4 _ _ _ D#4 _ _ _', '. A#4 C5 A#4 C5 _ A#4 _', 'A#4 _ _ _ E4 _ _ _', '_ _ _ F4 G4 G#4 _ A#4',
    'C5 _ _ _ F4 _ _ _', '. C5 D5 C5 D5 _ C5 _', 'D5 _ _ _ _ _ _ _', 'F4 _ F4 F4 D#4 _ D4 _',
    ...SOFTLY_A_LEAD, '_ _ _ _ _ _ _ _',
  ],
  g: [
    ...SOFTLY_A_HARMONY, 'C3 _ _ _ B2 _ _ _',
    ...SOFTLY_A_HARMONY, 'G#2 _ _ _ _ _ _ _',
    'G2 _ _ _ _ _ _ _', 'D3 _ _ _ _ _ _ _', 'E3 _ _ _ _ _ _ _', 'A#2 _ _ _ _ _ _ _',
    'G#2 _ _ _ _ _ _ _', 'A2 _ _ _ _ _ _ _', 'C3 _ _ _ _ _ _ _', 'B2 _ _ _ _ _ _ _',
    ...SOFTLY_A_HARMONY, 'C3 _ _ _ B2 _ _ _',
  ],
  r: [
    ...SOFTLY_A_BASS, 'D2 _ F2 _ G1 _ B1 _',
    ...SOFTLY_A_BASS.slice(0, 6), 'C2 _ _ _ D2 _ E2 _', 'F2 _ C2 _ A#1 _ D2 _',
    'D#2 _ _ _ A#1 _ _ _', 'D#2 _ G2 _ D2 _ C#2 _', 'C2 _ _ _ G1 _ _ _', 'C2 _ E2 _ G2 _ E2 _',
    'F2 _ _ _ G#2 _ G2 _', 'F#2 _ _ _ A2 _ D#2 _', 'D2 _ _ _ C2 _ G#1 _', 'G1 _ _ _ D2 _ B1 _',
    ...SOFTLY_A_BASS, 'C2 _ D#2 _ D2 _ G1 _',
  ],
});

export const SOFTLY_RGB: RgbSong = {
  name: 'Softly, as in a Morning Sunrise - RGB Instruments',
  settings: {
    bpm: 132, subdivision: 8, scale: 'chromatic', root: 0, octaveRange: 2,
    ranges: { r: { octave: 1, range: 2 }, g: { octave: 2, range: 2 }, b: { octave: 4, range: 2 } },
    gatePct: 90, glideMs: 0,
    waves: { r: 'sine', g: 'triangle', b: 'sawtooth' },
  },
  parts: SOFTLY_PARTS,
};

// --- I Got Rhythm ---------------------------------------------------------------

/*
 * I Got Rhythm - George Gershwin, 1930, from "Girl Crazy" (public domain).
 * The chorus in Bb, A A B A, 32 bars: the jazz form. The published song's
 * chorus is 34 bars, a 2-bar tag repeating "who could ask for anything more";
 * the tag is left out so the track loops as the rhythm changes do. 4/4 as 1/8
 * steps (256 steps), 200 BPM.
 *
 * Scale: chromatic, root Bb. The melody is major-scale except the bridge's E
 * natural (bar 18), but the changes need Ab and Db (Bb7, Eb7), E and Db
 * (Edim7), F#, B, E and Ab (the bridge's D7-G7-C7-F7) and walking chromatic
 * approach notes.
 *
 * Lead = the tune ("dq" dotted quarter = 3 eighths, "tied" = held over);
 * Harmony = guide tones, 3rd to 7th; Bass = walking quarters, chord roots
 * on the changes and approach notes between.
 *
 *   bar chords          Lead                          Harmony       Bass (quarters)
 *   A   1 Bb6 Gm7       (q) F4 dq, G4 dq              D3 h, F3 h    Bb1 D2 G2 B1
 *       2 Cm7 F7        Bb4 dq, C5 (5 e)              Eb3 w         C2 Eb2 F2 A2
 *       3 Bb6 Gm7       (q) C5 dq, Bb4 dq             D3 h, F3 h    Bb2 D2 G2 B1
 *       4 Cm7 F7        G4 dq, F4 (5 e)               Eb3 w         C2 G2 F2 A2
 *       5 Bb7 Bb7/D     (q) F4 dq, G4 dq              D3 h, Ab3 h   Bb2 Ab2 D2 F2
 *       6 Eb7 Edim7     Bb4 dq, C5 q, Eb5 q, C5 e     G3 w          Eb2 Db2 E2 G2
 *       7 Bb6/F F7      D5 q, D5 q, C5 e, D5 e, C5 q  F3 h, Eb3 h   F2 Bb2 C3 A2
 *       8 Bb6 F7        Bb4 h, (h)                    D3 h, Eb3 h   Bb2 G2 F2 C2
 *   A   9-15 as 1-7
 *      16 Bb6           Bb4 w                         D3 w          Bb1 D2 C2 C#2
 *   B  17 D7            (q) D5 dq, D5 dq              F#3 w         D2 E2 F#2 A2
 *      18 D7            D5 dq, E5 (5 e)               C4 w          C3 A2 F#2 Ab2
 *      19 G7            (q) D5 dq, D5 dq              B3 w          G2 A2 B2 D3
 *      20 G7            D5 dq, G4 (5 e)               F3 w          F3 D3 B2 Db3
 *      21 C7            (q) C5 dq, C5 dq              E3 w          C3 Bb2 G2 E2
 *      22 C7            C5 dq, D5 (5 e)               Bb3 w         C2 D2 E2 F#2
 *      23 F7            (q) C5 dq, C5 dq              A3 w          F2 A2 C3 A2
 *      24 F7            C5 dq, F4 (5 e)               Eb3 w         Eb3 C3 A2 F2
 *   A  25-31 as 1-7
 *      32 Bb6 (Cm7 F7)  Bb4 w                         D3 h, Eb3 h   Bb2 G2 C2 F2 (turnaround)
 *
 * No bar flagged as unsure: the tune is short and repetitive, and it agrees
 * with the lead-sheet rhythm (the "dq, 5 eighths" anticipations).
 *
 * Kicks (see `arrange`): the repeated D5 on beat 2 of bars 7, 15 and 31, and
 * the repeated notes on the "and" of 3 in bridge bars 17, 19, 21 and 23 - the
 * held Harmony (and Bass, when it is mid-quarter) re-strike with the melody,
 * a push under its accent.
 *
 * Ranges: Bass Bb1..A3 (octave 1, 2 octaves; notes Bb1..F3), Harmony
 * Bb2..A4 (octave 2, 2; notes D3..C4), Lead Bb3..A5 (octave 3, 2; F4..E5).
 */
const RHYTHM_A_LEAD = [
  '. . F4 _ _ G4 _ _', 'A#4 _ _ C5 _ _ _ _', '. . C5 _ _ A#4 _ _', 'G4 _ _ F4 _ _ _ _',
  '. . F4 _ _ G4 _ _', 'A#4 _ _ C5 _ D#5 _ C5', 'D5 _ D5 _ C5 D5 C5 _',
];
const RHYTHM_A_HARMONY = [
  'D3 _ _ _ F3 _ _ _', 'D#3 _ _ _ _ _ _ _', 'D3 _ _ _ F3 _ _ _', 'D#3 _ _ _ _ _ _ _',
  'D3 _ _ _ G#3 _ _ _', 'G3 _ _ _ _ _ _ _', 'F3 _ _ _ D#3 _ _ _',
];
const RHYTHM_A_BASS = [
  'A#1 _ D2 _ G2 _ B1 _', 'C2 _ D#2 _ F2 _ A2 _', 'A#2 _ D2 _ G2 _ B1 _', 'C2 _ G2 _ F2 _ A2 _',
  'A#2 _ G#2 _ D2 _ F2 _', 'D#2 _ C#2 _ E2 _ G2 _', 'F2 _ A#2 _ C3 _ A2 _',
];
const RHYTHM_PARTS = arrange({
  b: [
    ...RHYTHM_A_LEAD, 'A#4 _ _ _ . . . .',
    ...RHYTHM_A_LEAD, 'A#4 _ _ _ _ _ _ _',
    '. . D5 _ _ D5 _ _', 'D5 _ _ E5 _ _ _ _', '. . D5 _ _ D5 _ _', 'D5 _ _ G4 _ _ _ _',
    '. . C5 _ _ C5 _ _', 'C5 _ _ D5 _ _ _ _', '. . C5 _ _ C5 _ _', 'C5 _ _ F4 _ _ _ _',
    ...RHYTHM_A_LEAD, 'A#4 _ _ _ _ _ _ _',
  ],
  g: [
    ...RHYTHM_A_HARMONY, 'D3 _ _ _ D#3 _ _ _',
    ...RHYTHM_A_HARMONY, 'D3 _ _ _ _ _ _ _',
    'F#3 _ _ _ _ _ _ _', 'C4 _ _ _ _ _ _ _', 'B3 _ _ _ _ _ _ _', 'F3 _ _ _ _ _ _ _',
    'E3 _ _ _ _ _ _ _', 'A#3 _ _ _ _ _ _ _', 'A3 _ _ _ _ _ _ _', 'D#3 _ _ _ _ _ _ _',
    ...RHYTHM_A_HARMONY, 'D3 _ _ _ D#3 _ _ _',
  ],
  r: [
    ...RHYTHM_A_BASS, 'A#2 _ G2 _ F2 _ C2 _',
    ...RHYTHM_A_BASS, 'A#1 _ D2 _ C2 _ C#2 _',
    'D2 _ E2 _ F#2 _ A2 _', 'C3 _ A2 _ F#2 _ G#2 _', 'G2 _ A2 _ B2 _ D3 _', 'F3 _ D3 _ B2 _ C#3 _',
    'C3 _ A#2 _ G2 _ E2 _', 'C2 _ D2 _ E2 _ F#2 _', 'F2 _ A2 _ C3 _ A2 _', 'D#3 _ C3 _ A2 _ F2 _',
    ...RHYTHM_A_BASS, 'A#2 _ G2 _ C2 _ F2 _',
  ],
});

export const RHYTHM_RGB: RgbSong = {
  name: 'I Got Rhythm - RGB Instruments',
  settings: {
    bpm: 200, subdivision: 8, scale: 'chromatic', root: 10, octaveRange: 2,
    ranges: { r: { octave: 1, range: 2 }, g: { octave: 2, range: 2 }, b: { octave: 3, range: 2 } },
    gatePct: 80, glideMs: 0,
    waves: { r: 'triangle', g: 'triangle', b: 'square' },
  },
  parts: RHYTHM_PARTS,
};

// --- Maple Leaf Rag -------------------------------------------------------------

/*
 * Maple Leaf Rag - Scott Joplin, 1899 (public domain). The A strain and the B
 * strain, 16 bars each, both in Ab major; 2/4 as 1/16 steps, 8 a bar, 256
 * steps; 96 BPM (the quarter), "not fast", as Joplin asked.
 *
 * Scale: chromatic, root Ab. The rag leans on the flat-six Fb chord (Cb, Fb in
 * the tune), an Ab-minor arpeggio, Abdim (D natural), and the B strain's
 * chromatic Ab-G-Gb descent into F and Bb major (A natural, D natural).
 *
 * Lead = the right hand's top line, its syncopations as "_" holds over the
 * beat. The left hand's oom-pah is split: Bass takes the bass note on each
 * beat (an eighth: steps 1 and 5), Harmony one chord tone as a sixteenth
 * stab on each off-beat (steps 3 and 7) - the 3rd of a triad, the 7th of a
 * dominant seventh. Sharps spell the flats: G# = Ab, D# = Eb, B = Cb, E = Fb.
 * Per bar, the lead's eight sixteenths ("." rest, "_" held), then the chord:
 *
 *   A strain                                          Harmony (off-beats)  Bass (beats)
 *    1 Ab     . Ab4 Eb5 Ab4 C5 Eb5 _ Ab4             C4 C4                Ab1 Eb2
 *    2 Eb7    Eb5 G4 Bb4 Eb5 _ _ _ _                 Db4 Db4              Eb2 Bb1
 *    3-4 as 1-2
 *    5 Fb|Eb7 . Ab4 Cb5 Fb5 . Eb5 _ Eb5              Ab3 Db4              Fb2 Eb2
 *    6 Fb|Eb7 . Ab4 Cb5 Fb5 . Eb5 _ _                Ab3 Db4              Fb2 Eb2
 *    7 Abm    Ab4 Cb5 Eb5 Ab5 Ab5 Cb6 Eb6 _  (*)     Cb4 Cb4              Ab1 Eb2
 *    8 Abm    as 7                                   Cb4 Cb4              Ab1 Eb2
 *    9 Abdim  Ab5 _ Ab5 _ Ab5 _ Ab5 Ab5 (tied over)  D4 D4                Ab1 D2
 *   10 Ab     _ Eb5 F5 C5 Eb5 F5 _ _                 C4 C4                Ab1 Eb2
 *   11 Fb|Ab  Ab4 Bb4 Cb5 Ab4 Bb4 C5 _ Ab4           Ab3 C4               Fb2 Ab1
 *   12 Ab Eb7 Ab  C5 Ab4 Bb4 _ Ab4 _ . .             C4 Db4 C4 (on 1, the "and", 2)  Ab1 Eb2 Ab1 (the same)
 *   13-16 as 9-12
 *
 *   B strain
 *    1 Eb7    . G5 Eb6 G5 Bb5 D6 _ G5                Db4 Db4              Eb2 Bb1
 *    2 Eb7    Db6 G5 Bb5 C6 _ Eb5 Bb5 Eb5            Db4 Db4              Eb2 Bb1
 *    3 Ab     . C5 Ab5 C5 Eb5 F5 _ Eb5               C4 C4                Ab1 Eb2
 *    4 Ab     Ab5 C5 Eb5 F5 _ C5 F5 _                C4 C4                Ab1 Eb2
 *    5 Eb7    . Eb5 G5 Bb4 Db5 F5 _ Eb5              Db4 Db4              Eb2 Bb1
 *    6 Eb7    G5 Bb4 Db5 F5 _ Db5 F5 _               Db4 Db4              Eb2 Bb1
 *    7-8 as 3-4, 9-11 as 1-3
 *   12 Ab G7 Gb7  Ab5 _ Ab5 _ G5 _ Gb5 _             C4, B3 Bb3 (on 2 and its "and")  Ab2, G2 Gb2
 *   13 F      . F4 A4 C5 F5 C5 A4 F4                 A3 A3                F2 C2
 *   14 Bb     . F4 Bb4 D5 F5 _ D5 _  (*)             D4 D4                Bb1 F2
 *   15 Bb7|Eb7 C5 _ . C5 _ Bb4 _ _                   D4 Db4               Bb1 Eb2
 *   16 Ab     . Ab4 C5 Eb5 Ab5 _ . .                 C4 C4                Ab1 Eb2
 *
 * (*) Unsure / changed: bars A7-8 climb to Ab6 in the score; the last note
 * is held on Eb6 instead, so the lead fits one 3-octave range (Ab3..G6)
 * with the B strain's low F4. Bar B14's middle note is written D natural,
 * for the Bb-major (V/V) chord - check it against the score, as also the
 * octave of the B strain's opening zig-zag (B1-2) and the A strain's bar 12
 * cadence rhythm. The strain repeats (AABB) are not written out.
 *
 * Kicks: none needed - the Bass and Harmony are short notes, so every
 * repeated melody note (A5, A9, B12) falls on a plain step.
 *
 * Ranges: Bass Ab1..G3 (octave 1, 2 octaves; notes Ab1..Ab2), Harmony
 * Ab3..G4 (octave 3, 1; notes Ab3..D4), Lead Ab3..G6 (octave 3, 3; F4..Eb6).
 */
const OOM = {
  ab: ['G#1 _ . . D#2 _ . .', '. . C4 . . . C4 .'],
  eb7: ['D#2 _ . . A#1 _ . .', '. . C#4 . . . C#4 .'],
  fbEb7: ['E2 _ . . D#2 _ . .', '. . G#3 . . . C#4 .'],
  abm: ['G#1 _ . . D#2 _ . .', '. . B3 . . . B3 .'],
  abdim: ['G#1 _ . . D2 _ . .', '. . D4 . . . D4 .'],
  fbAb: ['E2 _ . . G#1 _ . .', '. . G#3 . . . C4 .'],
  cadence: ['G#1 _ D#2 _ G#1 _ . .', 'C4 . C#4 . C4 . . .'],
  descent: ['G#2 _ . . G2 _ F#2 _', '. . C4 . B3 . A#3 .'],
  f: ['F2 _ . . C2 _ . .', '. . A3 . . . A3 .'],
  bb: ['A#1 _ . . F2 _ . .', '. . D4 . . . D4 .'],
  bb7Eb7: ['A#1 _ . . D#2 _ . .', '. . D4 . . . C#4 .'],
} satisfies Record<string, [string, string]>;
type Oom = keyof typeof OOM;

const MAPLE_A_LEAD = [
  '. G#4 D#5 G#4 C5 D#5 _ G#4', 'D#5 G4 A#4 D#5 _ _ _ _',
  '. G#4 D#5 G#4 C5 D#5 _ G#4', 'D#5 G4 A#4 D#5 _ _ _ _',
  '. G#4 B4 E5 . D#5 _ D#5', '. G#4 B4 E5 . D#5 _ _',
  'G#4 B4 D#5 G#5 G#5 B5 D#6 _', 'G#4 B4 D#5 G#5 G#5 B5 D#6 _',
];
const MAPLE_A_LEAD_2 = [
  'G#5 _ G#5 _ G#5 _ G#5 G#5', '_ D#5 F5 C5 D#5 F5 _ _',
  'G#4 A#4 B4 G#4 A#4 C5 _ G#4', 'C5 G#4 A#4 _ G#4 _ . .',
];
const MAPLE_A_CHORDS: Oom[] = [
  'ab', 'eb7', 'ab', 'eb7', 'fbEb7', 'fbEb7', 'abm', 'abm',
  'abdim', 'ab', 'fbAb', 'cadence', 'abdim', 'ab', 'fbAb', 'cadence',
];
const MAPLE_B_LEAD = [
  '. G5 D#6 G5 A#5 D6 _ G5', 'C#6 G5 A#5 C6 _ D#5 A#5 D#5',
  '. C5 G#5 C5 D#5 F5 _ D#5', 'G#5 C5 D#5 F5 _ C5 F5 _',
  '. D#5 G5 A#4 C#5 F5 _ D#5', 'G5 A#4 C#5 F5 _ C#5 F5 _',
  '. C5 G#5 C5 D#5 F5 _ D#5', 'G#5 C5 D#5 F5 _ C5 F5 _',
  '. G5 D#6 G5 A#5 D6 _ G5', 'C#6 G5 A#5 C6 _ D#5 A#5 D#5',
  '. C5 G#5 C5 D#5 F5 _ D#5', 'G#5 _ G#5 _ G5 _ F#5 _',
  '. F4 A4 C5 F5 C5 A4 F4', '. F4 A#4 D5 F5 _ D5 _',
  'C5 _ . C5 _ A#4 _ _', '. G#4 C5 D#5 G#5 _ . .',
];
const MAPLE_B_CHORDS: Oom[] = [
  'eb7', 'eb7', 'ab', 'ab', 'eb7', 'eb7', 'ab', 'ab',
  'eb7', 'eb7', 'ab', 'descent', 'f', 'bb', 'bb7Eb7', 'ab',
];
const MAPLE_CHORDS = [...MAPLE_A_CHORDS, ...MAPLE_B_CHORDS];
const MAPLE_PARTS = arrange({
  b: [...MAPLE_A_LEAD, ...MAPLE_A_LEAD_2, ...MAPLE_A_LEAD_2, ...MAPLE_B_LEAD],
  g: MAPLE_CHORDS.map((c) => OOM[c][1]),
  r: MAPLE_CHORDS.map((c) => OOM[c][0]),
});

export const MAPLE_RGB: RgbSong = {
  name: 'Maple Leaf Rag (A and B strains) - RGB Instruments',
  settings: {
    bpm: 96, subdivision: 16, scale: 'chromatic', root: 8, octaveRange: 2,
    ranges: { r: { octave: 1, range: 2 }, g: { octave: 3, range: 1 }, b: { octave: 3, range: 3 } },
    gatePct: 70, glideMs: 0,
    waves: { r: 'triangle', g: 'square', b: 'triangle' },
  },
  parts: MAPLE_PARTS,
};

/** The jazz and ragtime songs, by the source key a track names them with. */
export const JAZZ_SONGS = {
  'softly-rgb': SOFTLY_RGB,
  'rhythm-rgb': RHYTHM_RGB,
  'maple-rgb': MAPLE_RGB,
} satisfies Record<string, RgbSong>;
