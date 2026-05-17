import { hsbToRgb, type HSB } from './colorConversions';

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

const OSC_LOUDNESS: Record<OscType, number> = {
  sine: 1.0,
  triangle: 0.85,
  sawtooth: 0.475,
  square: 0.425,
};

function oscTypeFor(cfg: SynthConfig, channel: 'r' | 'g' | 'b' | null): OscType {
  if (channel && !cfg.oscLinked) {
    if (channel === 'r') return cfg.oscR;
    if (channel === 'g') return cfg.oscG;
    return cfg.oscB;
  }
  return cfg.oscType;
}

const PENTATONIC = [0, 2, 4, 7, 9];
const MAJOR = [0, 2, 4, 5, 7, 9, 11];

function scaleTable(scale: Scale): number[] {
  if (scale === 'pentatonic') return PENTATONIC;
  if (scale === 'major') return MAJOR;
  if (scale === 'chromatic') return [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
  return [];
}

const JUST_INTERVALS: Record<Chord, [number, number, number]> = {
  major: [0, 3.8631, 7.0195],
  minor: [0, 3.1564, 7.0195],
  'stacked-fifths': [0, 7.0195, 14.0391],
  octaves: [0, 12, 24],
};
const EQUAL_INTERVALS: Record<Chord, [number, number, number]> = {
  major: [0, 4, 7],
  minor: [0, 3, 7],
  'stacked-fifths': [0, 7, 14],
  octaves: [0, 12, 24],
};
export const CHORD_INTERVALS = JUST_INTERVALS;
function intervalsFor(cfg: SynthConfig): [number, number, number] {
  const table = cfg.tuning === 'equal' ? EQUAL_INTERVALS : JUST_INTERVALS;
  return table[cfg.chord] ?? table.major;
}

export function midiToFreq(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
export function midiToName(midi: number): string {
  const octave = Math.floor(midi / 12) - 1;
  const name = NOTE_NAMES[((midi % 12) + 12) % 12];
  return `${name}${octave}`;
}

function baseFreq(octave: number): number {
  return 16.35 * Math.pow(2, octave);
}

function semitonesToFreq(base: number, semitones: number): number {
  return base * Math.pow(2, semitones / 12);
}

export function hueToFrequency(h: number, cfg: SynthConfig): number {
  const base = baseFreq(cfg.baseOctave);
  const totalSemis = cfg.octaveRange * 12;
  const norm = ((h % 360) + 360) % 360 / 360;
  if (cfg.scale === 'continuous') {
    return semitonesToFreq(base, norm * totalSemis);
  }
  const table = scaleTable(cfg.scale);
  const stepsPerOctave = table.length;
  const totalSteps = stepsPerOctave * cfg.octaveRange;
  const idx = Math.min(totalSteps - 1, Math.floor(norm * totalSteps));
  const octave = Math.floor(idx / stepsPerOctave);
  const within = idx % stepsPerOctave;
  return semitonesToFreq(base, octave * 12 + table[within]);
}

export function hueToNoteIndex(h: number, cfg: SynthConfig): number {
  if (cfg.scale === 'continuous') return -1;
  const table = scaleTable(cfg.scale);
  const totalSteps = table.length * cfg.octaveRange;
  const norm = ((h % 360) + 360) % 360 / 360;
  return Math.min(totalSteps - 1, Math.floor(norm * totalSteps));
}

export function saturationToCutoff(s: number, cfg: SynthConfig): number {
  const t = Math.max(0, Math.min(100, s)) / 100;
  return cfg.cutoffMin * Math.pow(cfg.cutoffMax / cfg.cutoffMin, t);
}

export function brightnessToGain(b: number, cfg: SynthConfig): number {
  const t = Math.max(0, Math.min(100, b)) / 100;
  return Math.pow(t, cfg.gainCurve) * cfg.gainPeak;
}

function channelToGain(value: number, cfg: SynthConfig): number {
  const t = Math.max(0, Math.min(255, value)) / 255;
  return Math.pow(t, cfg.gainCurve) * cfg.gainPeak;
}

function chordFreqs(cfg: SynthConfig): [number, number, number] {
  const intervals = intervalsFor(cfg);
  const order = cfg.voiceOrder === 'r-low' ? [0, 1, 2] : [2, 1, 0];
  return [
    midiToFreq(cfg.rootMidi + intervals[order[0]]),
    midiToFreq(cfg.rootMidi + intervals[order[1]]),
    midiToFreq(cfg.rootMidi + intervals[order[2]]),
  ];
}
function detuneFor(channel: 'r' | 'g' | 'b' | null, cfg: SynthConfig): number {
  if (!channel) return 0;
  if (channel === 'g') return cfg.detuneCents;
  if (channel === 'b') return -cfg.detuneCents;
  return 0;
}

let ctx: AudioContext | null = null;
let masterGainNode: GainNode | null = null;
let masterCompressor: DynamicsCompressorNode | null = null;
export function getAudioCtx(): AudioContext {
  if (!ctx) {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    ctx = new AC();
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}
export function getMasterGain(): GainNode {
  const audio = getAudioCtx();
  if (!masterCompressor) {
    masterCompressor = audio.createDynamicsCompressor();
    masterCompressor.threshold.value = -3;
    masterCompressor.knee.value = 20;
    masterCompressor.ratio.value = 2;
    masterCompressor.attack.value = 0.02;
    masterCompressor.release.value = 0.25;
    masterCompressor.connect(audio.destination);
  }
  if (!masterGainNode) {
    masterGainNode = audio.createGain();
    masterGainNode.gain.value = 1;
    masterGainNode.connect(masterCompressor);
  }
  return masterGainNode;
}

interface Voice {
  osc: OscillatorNode;
  filter: BiquadFilterNode;
  gain: GainNode;
  noteIndex: number;
  channel: 'r' | 'g' | 'b' | null;
}

type Owner = 'animation' | 'press' | 'pulse';

export class ToneController {
  private cfg: SynthConfig = { ...DEFAULT_SYNTH_CONFIG };
  private voices: Voice[] = [];
  private activeMode: SynthMode | null = null;
  private muted = false;
  private endTimer: number | null = null;
  private lastHsb: HSB | null = null;
  private owner: Owner | null = null;
  private pulseStopTimer: number | null = null;

  setConfig(patch: Partial<SynthConfig>): void {
    const prev = this.cfg;
    this.cfg = { ...this.cfg, ...patch };
    if (patch.masterGain !== undefined && patch.masterGain !== prev.masterGain) {
      try {
        const m = getMasterGain();
        m.gain.setTargetAtTime(Math.max(0, patch.masterGain), getAudioCtx().currentTime, 0.02);
      } catch { /* master gain set failed */ }
    }
    if (patch.compressorOn !== undefined && patch.compressorOn !== prev.compressorOn) {
      try {
        if (masterCompressor) {
          const tNow = getAudioCtx().currentTime;
          masterCompressor.ratio.setTargetAtTime(patch.compressorOn ? 2 : 1, tNow, 0.02);
          masterCompressor.threshold.setTargetAtTime(patch.compressorOn ? -3 : 0, tNow, 0.02);
        }
      } catch { /* compressor set failed */ }
    }
    if (patch.sustainLatch === false && prev.sustainLatch === true && this.voices.length > 0) {
      this.release();
    }
    if (patch.synthEnabled === false && prev.synthEnabled === true && this.voices.length > 0) {
      this.stop(30);
    }
    if (this.voices.length === 0) return;

    const modeChanged = patch.mode !== undefined && patch.mode !== prev.mode;
    if (modeChanged && this.lastHsb) {
      const hsb = this.lastHsb;
      this.stop(40);
      window.setTimeout(() => { if (!this.muted) this.start(hsb); }, 50);
      return;
    }

    try {
      const audio = getAudioCtx();
      const t = audio.currentTime;
      const tau = Math.max(0.005, this.cfg.glideMs / 1000);

      const oscChanged =
        (patch.oscType !== undefined && patch.oscType !== prev.oscType)
        || (patch.oscLinked !== undefined && patch.oscLinked !== prev.oscLinked)
        || (patch.oscR !== undefined && patch.oscR !== prev.oscR)
        || (patch.oscG !== undefined && patch.oscG !== prev.oscG)
        || (patch.oscB !== undefined && patch.oscB !== prev.oscB);
      if (oscChanged) {
        for (const v of this.voices) {
          const newType = oscTypeFor(this.cfg, v.channel);
          if (v.osc.type !== newType) v.osc.type = newType;
        }
        if (this.lastHsb) {
          const hsb = this.lastHsb;
          if (this.activeMode === 'rgb-chord') {
            const rgb = hsbToRgb(hsb.h, hsb.s, hsb.b);
            for (const v of this.voices) {
              if (!v.channel) continue;
              const newType = oscTypeFor(this.cfg, v.channel);
              const target = channelToGain(rgb[v.channel], this.cfg) * OSC_LOUDNESS[newType];
              v.gain.gain.setTargetAtTime(Math.max(0.0001, target), t, tau);
            }
          } else if (this.activeMode === 'hue-voice' && this.voices[0]) {
            const newType = oscTypeFor(this.cfg, null);
            const target = brightnessToGain(hsb.b, this.cfg) * OSC_LOUDNESS[newType];
            this.voices[0].gain.gain.setTargetAtTime(Math.max(0.0001, target), t, tau);
          }
        }
      }

      const chordParamsChanged =
        (patch.chord !== undefined && patch.chord !== prev.chord)
        || (patch.rootMidi !== undefined && patch.rootMidi !== prev.rootMidi)
        || (patch.voiceOrder !== undefined && patch.voiceOrder !== prev.voiceOrder)
        || (patch.tuning !== undefined && patch.tuning !== prev.tuning);

      if (chordParamsChanged && this.activeMode === 'rgb-chord') {
        const freqs = chordFreqs(this.cfg);
        const channels: Array<'r' | 'g' | 'b'> = ['r', 'g', 'b'];
        for (let i = 0; i < this.voices.length; i++) {
          const v = this.voices[i];
          if (!v.channel) continue;
          const idx = channels.indexOf(v.channel);
          if (idx >= 0) v.osc.frequency.setTargetAtTime(freqs[idx], t, tau);
        }
      }

      if (patch.detuneCents !== undefined && patch.detuneCents !== prev.detuneCents) {
        for (const v of this.voices) {
          v.osc.detune.setTargetAtTime(detuneFor(v.channel, this.cfg), t, tau);
        }
      }
    } catch { /* retune failed */ }
  }

  getConfig(): SynthConfig {
    return { ...this.cfg };
  }

  setMuted(m: boolean): void {
    this.muted = m;
    if (m && this.voices.length > 0) this.stop(20);
  }

  isActive(): boolean {
    return this.voices.length > 0;
  }

  start(hsb: HSB, owner: Owner = 'animation', force = false): void {
    if (this.muted) return;
    if (!force && !this.cfg.synthEnabled) return;
    if (this.voices.length > 0) this.stop(20);
    this.lastHsb = hsb;
    this.owner = owner;
    if (this.pulseStopTimer !== null) { clearTimeout(this.pulseStopTimer); this.pulseStopTimer = null; }
    if (this.cfg.mode === 'rgb-chord') this.startChord(hsb);
    else this.startHueVoice(hsb);
  }

  pulse(hsb: HSB, isPointerDown: boolean): void {
    if (this.muted) return;
    if (!this.cfg.synthEnabled) return;
    if (!this.isActive()) this.start(hsb, 'pulse');
    else { this.owner = 'pulse'; this.update(hsb); }
    if (this.pulseStopTimer !== null) clearTimeout(this.pulseStopTimer);
    if (!isPointerDown) {
      this.pulseStopTimer = window.setTimeout(() => {
        if (this.owner === 'pulse') this.release();
        this.pulseStopTimer = null;
      }, 200);
    }
  }

  notifyPointerUp(): void {
    if (this.owner !== 'pulse') return;
    if (this.pulseStopTimer !== null) clearTimeout(this.pulseStopTimer);
    this.pulseStopTimer = window.setTimeout(() => {
      if (this.owner === 'pulse') this.stop(120);
      this.pulseStopTimer = null;
    }, 200);
  }

  update(hsb: HSB): void {
    if (this.muted) return;
    if (this.voices.length === 0) return;
    this.lastHsb = hsb;
    if (this.activeMode === 'rgb-chord') this.updateChord(hsb);
    else this.updateHueVoice(hsb);
  }

  release(): void {
    if (this.voices.length === 0) return;
    if (this.cfg.sustainLatch) return;
    const hold = Math.max(0, this.cfg.holdMs / 1000);
    const fade = Math.max(0.03, this.cfg.releaseMs / 1000);
    this.fadeVoices(hold, fade);
  }

  stop(fadeMs: number = 30): void {
    if (this.voices.length === 0) return;
    const fade = Math.max(0.03, fadeMs / 1000);
    this.fadeVoices(0, fade);
  }

  private fadeVoices(hold: number, fade: number): void {
    try {
      const audio = getAudioCtx();
      const t = audio.currentTime;
      const dying = this.voices;
      for (const v of dying) {
        try { v.gain.gain.cancelAndHoldAtTime(t); }
        catch { v.gain.gain.cancelScheduledValues(t); v.gain.gain.setValueAtTime(v.gain.gain.value, t); }
        if (hold > 0) v.gain.gain.setValueAtTime(v.gain.gain.value, t + hold);
        v.gain.gain.linearRampToValueAtTime(0, t + hold + fade);
        v.gain.gain.setValueAtTime(0, t + hold + fade + 0.005);
        v.osc.stop(t + hold + fade + 0.06);
      }
      this.voices = [];
      this.activeMode = null;
      this.owner = null;
      if (this.pulseStopTimer !== null) { clearTimeout(this.pulseStopTimer); this.pulseStopTimer = null; }
      if (this.endTimer !== null) clearTimeout(this.endTimer);
      this.endTimer = window.setTimeout(() => {
        for (const v of dying) {
          try { v.osc.disconnect(); v.filter.disconnect(); v.gain.disconnect(); } catch { /* already disconnected */ }
        }
        this.endTimer = null;
      }, (hold + fade + 0.12) * 1000);
    } catch {
      this.voices = [];
      this.activeMode = null;
      this.owner = null;
    }
  }

  private startHueVoice(hsb: HSB): void {
    try {
      const audio = getAudioCtx();
      const t = audio.currentTime;
      const freq = hueToFrequency(hsb.h, this.cfg);
      const cutoff = saturationToCutoff(hsb.s, this.cfg);
      const target = brightnessToGain(hsb.b, this.cfg);

      const oscType = oscTypeFor(this.cfg, null);
      const osc = audio.createOscillator();
      osc.type = oscType;
      osc.frequency.setValueAtTime(freq, t);

      const filter = audio.createBiquadFilter();
      filter.type = 'lowpass';
      filter.Q.value = 0.7;
      filter.frequency.setValueAtTime(cutoff, t);

      const gain = audio.createGain();
      gain.gain.setValueAtTime(0, t);
      gain.gain.setTargetAtTime(Math.max(0, target * OSC_LOUDNESS[oscType]), t, Math.max(0.003, this.cfg.attackMs / 3000));

      osc.connect(filter).connect(gain).connect(getMasterGain());
      osc.start(t);

      this.voices = [{ osc, filter, gain, noteIndex: hueToNoteIndex(hsb.h, this.cfg), channel: null }];
      this.activeMode = 'hue-voice';
      if (this.endTimer !== null) { clearTimeout(this.endTimer); this.endTimer = null; }
    } catch { /* audio init failed */ }
  }

  private updateHueVoice(hsb: HSB): void {
    const v = this.voices[0];
    if (!v) return;
    try {
      const audio = getAudioCtx();
      const t = audio.currentTime;
      const tau = Math.max(0.001, this.cfg.glideMs / 1000);
      const newIdx = hueToNoteIndex(hsb.h, this.cfg);
      const freq = hueToFrequency(hsb.h, this.cfg);
      const cutoff = saturationToCutoff(hsb.s, this.cfg);
      const target = brightnessToGain(hsb.b, this.cfg);

      const oscType = oscTypeFor(this.cfg, null);
      const scaledTarget = target * OSC_LOUDNESS[oscType];
      if (this.cfg.scale !== 'continuous' && newIdx !== v.noteIndex) {
        try { v.osc.frequency.cancelAndHoldAtTime(t); v.gain.gain.cancelAndHoldAtTime(t); }
        catch {
          v.osc.frequency.cancelScheduledValues(t); v.osc.frequency.setValueAtTime(v.osc.frequency.value, t);
          v.gain.gain.cancelScheduledValues(t); v.gain.gain.setValueAtTime(v.gain.gain.value, t);
        }
        v.osc.frequency.linearRampToValueAtTime(freq, t + Math.max(0.005, this.cfg.glideMs / 1000));
        v.gain.gain.linearRampToValueAtTime(Math.max(0, scaledTarget), t + this.cfg.attackMs / 1000);
        v.noteIndex = newIdx;
      } else {
        v.osc.frequency.setTargetAtTime(freq, t, tau);
        v.gain.gain.setTargetAtTime(Math.max(0.0001, scaledTarget), t, tau);
      }
      v.filter.frequency.setTargetAtTime(cutoff, t, tau);
    } catch { /* audio update failed */ }
  }

  private startChord(hsb: HSB): void {
    try {
      const audio = getAudioCtx();
      const t = audio.currentTime;
      const freqs = chordFreqs(this.cfg);
      const cutoff = saturationToCutoff(hsb.s, this.cfg);
      const rgb = hsbToRgb(hsb.h, hsb.s, hsb.b);
      const channels: Array<'r' | 'g' | 'b'> = ['r', 'g', 'b'];

      const voices: Voice[] = [];
      for (let i = 0; i < 3; i++) {
        const ch = channels[i];
        const oscType = oscTypeFor(this.cfg, ch);
        const target = channelToGain(rgb[ch], this.cfg) * OSC_LOUDNESS[oscType];

        const osc = audio.createOscillator();
        osc.type = oscType;
        osc.frequency.setValueAtTime(freqs[i], t);
        osc.detune.setValueAtTime(detuneFor(ch, this.cfg), t);

        const filter = audio.createBiquadFilter();
        filter.type = 'lowpass';
        filter.Q.value = 0.7;
        filter.frequency.setValueAtTime(cutoff, t);

        const gain = audio.createGain();
        gain.gain.setValueAtTime(0, t);
        gain.gain.setTargetAtTime(Math.max(0, target), t, Math.max(0.003, this.cfg.attackMs / 3000));

        osc.connect(filter).connect(gain).connect(getMasterGain());
        osc.start(t);

        voices.push({ osc, filter, gain, noteIndex: -1, channel: ch });
      }
      this.voices = voices;
      this.activeMode = 'rgb-chord';
      if (this.endTimer !== null) { clearTimeout(this.endTimer); this.endTimer = null; }
    } catch { /* audio init failed */ }
  }

  private updateChord(hsb: HSB): void {
    try {
      const audio = getAudioCtx();
      const t = audio.currentTime;
      const tau = Math.max(0.001, this.cfg.glideMs / 1000);
      const cutoff = saturationToCutoff(hsb.s, this.cfg);
      const rgb = hsbToRgb(hsb.h, hsb.s, hsb.b);
      for (const v of this.voices) {
        if (!v.channel) continue;
        const oscType = oscTypeFor(this.cfg, v.channel);
        const target = channelToGain(rgb[v.channel], this.cfg) * OSC_LOUDNESS[oscType];
        v.gain.gain.setTargetAtTime(Math.max(0.0001, target), t, tau);
        v.filter.frequency.setTargetAtTime(cutoff, t, tau);
      }
    } catch { /* audio update failed */ }
  }
}

export const toneController = new ToneController();
