// Sync-imported synth config: types, defaults, and label helpers.
// Heavy engine code (ToneController, AudioContext setup, oscillators)
// lives in ./colorSynth and is loaded lazily via ./toneControllerLazy.

export type Scale = 'pentatonic' | 'chromatic' | 'major' | 'continuous';
export type OscType = 'sine' | 'triangle' | 'sawtooth' | 'square';
export type SynthMode = 'hue-voice' | 'rgb-chord';
export type Chord = 'major' | 'minor' | 'stacked-fifths' | 'octaves';
export type VoiceOrder = 'r-low' | 'r-high';

export interface SynthConfig {
  scale: Scale;
  oscType: OscType;
  baseOctave: number;
  octaveRange: number;
  attackMs: number;
  releaseMs: number;
  glideMs: number;
  cutoffMin: number;
  cutoffMax: number;
  gainPeak: number;
  gainCurve: number;

  mode: SynthMode;
  chord: Chord;
  rootMidi: number;
  voiceOrder: VoiceOrder;
  masterGain: number;
  holdMs: number;
  sustainLatch: boolean;
  oscLinked: boolean;
  oscR: OscType;
  oscG: OscType;
  oscB: OscType;
  tuning: 'just' | 'equal';
  detuneCents: number;
  compressorOn: boolean;
  synthEnabled: boolean;
}

export const DEFAULT_SYNTH_CONFIG: SynthConfig = {
  scale: 'continuous',
  oscType: 'sine',
  baseOctave: 3,
  octaveRange: 1,
  attackMs: 20,
  releaseMs: 900,
  glideMs: 30,
  cutoffMin: 200,
  cutoffMax: 8000,
  gainPeak: 0.15,
  gainCurve: 1.5,

  mode: 'rgb-chord',
  chord: 'major',
  rootMidi: 48,
  voiceOrder: 'r-low',
  masterGain: 1,
  holdMs: 300,
  sustainLatch: false,
  oscLinked: true,
  oscR: 'sine',
  oscG: 'sine',
  oscB: 'sine',
  tuning: 'just',
  detuneCents: 3,
  compressorOn: true,
  synthEnabled: false,
};

export function midiToFreq(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
export function midiToName(midi: number): string {
  const octave = Math.floor(midi / 12) - 1;
  const name = NOTE_NAMES[((midi % 12) + 12) % 12];
  return `${name}${octave}`;
}
