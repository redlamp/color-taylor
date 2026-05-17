import type { HSB } from './colorConversions';

export type Scale = 'pentatonic' | 'chromatic' | 'major' | 'continuous';
export type OscType = 'sine' | 'triangle' | 'sawtooth' | 'square';

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
}

export const DEFAULT_SYNTH_CONFIG: SynthConfig = {
  scale: 'continuous',
  oscType: 'sine',
  baseOctave: 3,
  octaveRange: 2,
  attackMs: 20,
  releaseMs: 80,
  glideMs: 30,
  cutoffMin: 200,
  cutoffMax: 8000,
  gainPeak: 0.18,
  gainCurve: 1.5,
};

const PENTATONIC = [0, 2, 4, 7, 9];
const MAJOR = [0, 2, 4, 5, 7, 9, 11];

function scaleTable(scale: Scale): number[] {
  if (scale === 'pentatonic') return PENTATONIC;
  if (scale === 'major') return MAJOR;
  if (scale === 'chromatic') return [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
  return [];
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

let ctx: AudioContext | null = null;
export function getAudioCtx(): AudioContext {
  if (!ctx) {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    ctx = new AC();
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

interface Voice {
  osc: OscillatorNode;
  filter: BiquadFilterNode;
  gain: GainNode;
  noteIndex: number;
}

export class ToneController {
  private cfg: SynthConfig = { ...DEFAULT_SYNTH_CONFIG };
  private voice: Voice | null = null;
  private muted = false;
  private endTimer: number | null = null;

  setConfig(patch: Partial<SynthConfig>): void {
    this.cfg = { ...this.cfg, ...patch };
    if (this.voice && patch.oscType && patch.oscType !== this.voice.osc.type) {
      this.voice.osc.type = patch.oscType;
    }
  }

  getConfig(): SynthConfig {
    return { ...this.cfg };
  }

  setMuted(m: boolean): void {
    this.muted = m;
    if (m && this.voice) this.stop(20);
  }

  isActive(): boolean {
    return this.voice !== null;
  }

  start(hsb: HSB): void {
    if (this.muted) return;
    try {
      if (this.voice) this.stop(20);
      const audio = getAudioCtx();
      const t = audio.currentTime;
      const freq = hueToFrequency(hsb.h, this.cfg);
      const cutoff = saturationToCutoff(hsb.s, this.cfg);
      const target = brightnessToGain(hsb.b, this.cfg);

      const osc = audio.createOscillator();
      osc.type = this.cfg.oscType;
      osc.frequency.setValueAtTime(freq, t);

      const filter = audio.createBiquadFilter();
      filter.type = 'lowpass';
      filter.Q.value = 0.7;
      filter.frequency.setValueAtTime(cutoff, t);

      const gain = audio.createGain();
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, target), t + this.cfg.attackMs / 1000);

      osc.connect(filter).connect(gain).connect(audio.destination);
      osc.start(t);

      this.voice = { osc, filter, gain, noteIndex: hueToNoteIndex(hsb.h, this.cfg) };
      if (this.endTimer !== null) { clearTimeout(this.endTimer); this.endTimer = null; }
    } catch { /* audio init failed */ }
  }

  update(hsb: HSB): void {
    if (this.muted) return;
    if (!this.voice) return;
    try {
      const audio = getAudioCtx();
      const t = audio.currentTime;
      const tau = Math.max(0.001, this.cfg.glideMs / 1000);
      const newIdx = hueToNoteIndex(hsb.h, this.cfg);
      const freq = hueToFrequency(hsb.h, this.cfg);
      const cutoff = saturationToCutoff(hsb.s, this.cfg);
      const target = brightnessToGain(hsb.b, this.cfg);

      if (this.cfg.scale !== 'continuous' && newIdx !== this.voice.noteIndex) {
        this.voice.osc.frequency.cancelScheduledValues(t);
        this.voice.osc.frequency.setValueAtTime(freq, t);
        this.voice.gain.gain.cancelScheduledValues(t);
        this.voice.gain.gain.setValueAtTime(Math.max(0.0001, this.voice.gain.gain.value), t);
        this.voice.gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, target), t + this.cfg.attackMs / 1000);
        this.voice.noteIndex = newIdx;
      } else {
        this.voice.osc.frequency.setTargetAtTime(freq, t, tau);
        this.voice.gain.gain.setTargetAtTime(Math.max(0.0001, target), t, tau);
      }
      this.voice.filter.frequency.setTargetAtTime(cutoff, t, tau);
    } catch { /* audio update failed */ }
  }

  stop(fadeMs: number = 80): void {
    if (!this.voice) return;
    try {
      const audio = getAudioCtx();
      const t = audio.currentTime;
      const fade = Math.max(0.005, fadeMs / 1000);
      const v = this.voice;
      v.gain.gain.cancelScheduledValues(t);
      v.gain.gain.setValueAtTime(Math.max(0.0001, v.gain.gain.value), t);
      v.gain.gain.exponentialRampToValueAtTime(0.0001, t + fade);
      v.osc.stop(t + fade + 0.02);
      this.voice = null;
      if (this.endTimer !== null) clearTimeout(this.endTimer);
      this.endTimer = window.setTimeout(() => {
        try { v.osc.disconnect(); v.filter.disconnect(); v.gain.disconnect(); } catch { /* already disconnected */ }
        this.endTimer = null;
      }, (fade + 0.05) * 1000);
    } catch {
      this.voice = null;
    }
  }
}

export const toneController = new ToneController();
