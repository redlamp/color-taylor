/**
 * Swatch sequencer - the audio half. A lookahead scheduler after Chris Wilson's
 * "A Tale of Two Clocks": a coarse JS timer wakes every 25 ms and books every
 * step that starts inside the lookahead window straight onto the AudioContext
 * clock. The timer only decides *what*; the audio clock decides *when*, so a
 * late tick never makes a late note.
 *
 * Both tracks share one step clock and each loops over its own length, so two
 * rows of different lengths drift against each other into a polyrhythm.
 *
 * Visuals read the same clock through `visualAt` - nothing here waits on a
 * frame, and nothing a frame does reaches the audio.
 */
import { getAudioCtx, getMasterGain } from '../utils/audioContext';
import { midiToFreq } from '../utils/synthConfig';
import {
  clampGlide, gateSeconds, isLegato, stepSeconds,
  type NoteStep, type Step, type Subdivision,
} from './sequencer';

export type Wave = 'triangle' | 'sine' | 'sawtooth' | 'square';

export interface EngineParams {
  bpm: number;
  subdivision: Subdivision;
  gatePct: number;
  glideMs: number;
  wave: Wave;
}

export interface TrackInput {
  steps: Step[];
  enabled: boolean;
  muted: boolean;
}

const TICK_MS = 25;
const LOOKAHEAD = 0.1;
/** Background tabs clamp timers to ~1 s, so book further ahead while hidden. */
const LOOKAHEAD_HIDDEN = 1.5;
const ATTACK = 0.005;
const RELEASE = 0.04;
/** Level change on a held legato voice, short enough to be a new note's accent. */
const LEGATO_SLEW = 0.01;
const TRACK_GAIN = 0.28;
/** Rough equal-loudness trim per waveform, so switching wave doesn't jump the level. */
const WAVE_LOUDNESS: Record<Wave, number> = { sine: 1, triangle: 0.9, sawtooth: 0.38, square: 0.32 };

interface Osc { osc: OscillatorNode; filter: BiquadFilterNode; gain: GainNode; level: number; freq: number; cutoff: number }
interface Voice { oscs: Osc[]; dead: boolean }

/** What a track was doing at one scheduled step - the visuals' record. */
export interface StepEvent {
  time: number;
  index: number;
  /** Colour at the step start - the previous step's colour. */
  fromHex: string | null;
  toHex: string | null;
  /** Seconds the colour tweens over: the pitch glide, or 0 for a cut. */
  glide: number;
}

interface TrackState extends TrackInput {
  /** Held legato voice, carried into the next step. */
  held: Voice | null;
  /** Last sounding pitches, for the glide into the next note. */
  lastMidis: number[] | null;
  lastHex: string | null;
  scheduledIndex: number;
  events: StepEvent[];
}

const HISTORY = 64;

export interface SeqCounters {
  readonly notesScheduled: number;
  readonly lastStepTime: number;
  readonly trackIndex: readonly number[];
  readonly playing: boolean;
}

export class SequencerEngine {
  private params: EngineParams;
  private tracks: TrackState[];
  private live = new Set<Voice>();
  private timer: ReturnType<typeof setInterval> | null = null;
  private nextStepTime = 0;
  private stepCounter = 0;
  private notesScheduled = 0;
  private lastStepTime = 0;
  private ctx: AudioContext | null = null;

  constructor(params: EngineParams, trackCount = 2) {
    this.params = { ...params };
    this.tracks = Array.from({ length: trackCount }, () => ({
      steps: [], enabled: false, muted: false,
      held: null, lastMidis: null, lastHex: null, scheduledIndex: -1, events: [],
    }));
  }

  get playing(): boolean { return this.timer !== null; }

  /** Takes effect from the next step booked - no restart. */
  setParams(p: Partial<EngineParams>): void { Object.assign(this.params, p); }

  setTrack(i: number, input: TrackInput): void {
    Object.assign(this.tracks[i], input);
  }

  /** Must run inside a user gesture, or the context stays suspended. */
  async start(): Promise<void> {
    if (this.timer !== null) return;
    const ctx = getAudioCtx();
    this.ctx = ctx;
    if (ctx.state !== 'running') await ctx.resume();
    getMasterGain();
    this.nextStepTime = ctx.currentTime + 0.06;
    this.stepCounter = 0;
    for (const t of this.tracks) {
      t.held = null; t.lastMidis = null; t.lastHex = null; t.scheduledIndex = -1; t.events = [];
    }
    this.tick();
    this.timer = setInterval(() => this.tick(), TICK_MS);
  }

  stop(): void {
    if (this.timer !== null) clearInterval(this.timer);
    this.timer = null;
    const ctx = this.ctx;
    if (ctx) {
      // Steps are booked up to 1.5 s ahead, so a stop has to reach into the future too.
      for (const v of this.live) this.kill(v, ctx.currentTime);
    }
    this.live.clear();
    for (const t of this.tracks) { t.held = null; t.events = []; t.scheduledIndex = -1; }
  }

  /** The clock the listener hears: currentTime less the output latency. */
  audibleTime(): number {
    const ctx = this.ctx;
    if (!ctx) return 0;
    const latency = (ctx as AudioContext & { outputLatency?: number }).outputLatency ?? 0;
    return ctx.currentTime - (Number.isFinite(latency) ? latency : 0);
  }

  /** The event sounding on track `i` at audio time `now`, or null before the first. */
  visualAt(i: number, now: number): StepEvent | null {
    const ev = this.tracks[i].events;
    for (let k = ev.length - 1; k >= 0; k--) if (ev[k].time <= now) return ev[k];
    return null;
  }

  counters(): SeqCounters {
    return {
      notesScheduled: this.notesScheduled,
      lastStepTime: this.lastStepTime,
      trackIndex: this.tracks.map((t) => t.scheduledIndex),
      playing: this.playing,
    };
  }

  private tick(): void {
    const ctx = this.ctx;
    if (!ctx) return;
    const ahead = typeof document !== 'undefined' && document.hidden ? LOOKAHEAD_HIDDEN : LOOKAHEAD;
    // A stalled timer (a laptop lid, a debugger) must not book a burst of past steps.
    if (this.nextStepTime < ctx.currentTime - 0.2) this.nextStepTime = ctx.currentTime + 0.02;
    while (this.nextStepTime < ctx.currentTime + ahead) {
      const stepSec = stepSeconds(this.params.bpm, this.params.subdivision);
      for (let i = 0; i < this.tracks.length; i++) this.scheduleTrack(ctx, i, this.stepCounter, this.nextStepTime, stepSec);
      this.lastStepTime = this.nextStepTime;
      this.nextStepTime += stepSec;
      this.stepCounter++;
    }
  }

  private scheduleTrack(ctx: AudioContext, i: number, counter: number, t: number, stepSec: number): void {
    const tr = this.tracks[i];
    const len = tr.steps.length;
    if (!tr.enabled || len === 0) {
      if (tr.held) { this.release(tr.held, t); tr.held = null; }
      tr.scheduledIndex = -1;
      return;
    }
    const index = counter % len;
    const step = tr.steps[index];
    tr.scheduledIndex = index;

    const { gatePct, glideMs } = this.params;
    const legato = isLegato(gatePct);
    const glide = clampGlide(glideMs, stepSec);

    if (step.rest) {
      if (tr.held) { this.release(tr.held, t); tr.held = null; }
      this.record(tr, { time: t, index, fromHex: tr.lastHex, toHex: step.hex, glide: 0 });
      tr.lastHex = step.hex;
      return;
    }

    const from = tr.lastMidis && tr.lastMidis.length === step.midis.length ? tr.lastMidis : null;
    this.record(tr, { time: t, index, fromHex: tr.lastHex, toHex: step.hex, glide: from ? glide : 0 });
    tr.lastHex = step.hex;
    tr.lastMidis = step.midis;

    if (tr.muted) {
      if (tr.held) { this.release(tr.held, t); tr.held = null; }
      return;
    }

    this.notesScheduled++;
    if (legato && tr.held && tr.held.oscs.length === step.midis.length) {
      this.retune(tr.held, step, t, glide);
      return;
    }
    if (tr.held) { this.release(tr.held, t); tr.held = null; }
    const voice = this.voice(ctx, step, from, t, glide);
    if (legato) {
      tr.held = voice;
    } else {
      this.release(voice, Math.max(t + ATTACK, t + gateSeconds(gatePct, stepSec)));
    }
  }

  private record(tr: TrackState, ev: StepEvent): void {
    tr.events.push(ev);
    if (tr.events.length > HISTORY) tr.events.splice(0, tr.events.length - HISTORY);
  }

  private levelFor(step: NoteStep, k: number): number {
    const n = step.midis.length;
    return step.velocity * step.levels[k] * TRACK_GAIN * WAVE_LOUDNESS[this.params.wave] / Math.sqrt(n);
  }

  /** A new voice: glides from the previous pitches if there are any, attacks from 0. */
  private voice(ctx: AudioContext, step: NoteStep, from: number[] | null, t: number, glide: number): Voice {
    const out = getMasterGain();
    const oscs = step.midis.map((midi, k) => {
      const osc = ctx.createOscillator();
      osc.type = this.params.wave;
      const freq = midiToFreq(midi);
      if (from && glide > 0) {
        osc.frequency.setValueAtTime(midiToFreq(from[k]), t);
        osc.frequency.linearRampToValueAtTime(freq, t + glide);
      } else {
        osc.frequency.setValueAtTime(freq, t);
      }
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.Q.value = 0.7;
      filter.frequency.setValueAtTime(step.cutoff, t);
      const gain = ctx.createGain();
      const level = this.levelFor(step, k);
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(level, t + ATTACK);
      osc.connect(filter).connect(gain).connect(out);
      osc.start(t);
      return { osc, filter, gain, level, freq, cutoff: step.cutoff };
    });
    const v: Voice = { oscs, dead: false };
    oscs[0].osc.onended = () => {
      for (const o of oscs) { o.osc.disconnect(); o.filter.disconnect(); o.gain.disconnect(); }
      this.live.delete(v);
    };
    this.live.add(v);
    return v;
  }

  /** Legato: keep the voice sounding, ramp it to the new note instead of retriggering. */
  private retune(v: Voice, step: NoteStep, t: number, glide: number): void {
    v.oscs.forEach((o, k) => {
      const freq = midiToFreq(step.midis[k]);
      const level = this.levelFor(step, k);
      o.osc.frequency.setValueAtTime(o.freq, t);
      if (glide > 0) o.osc.frequency.linearRampToValueAtTime(freq, t + glide);
      else o.osc.frequency.setValueAtTime(freq, t);
      o.filter.frequency.setValueAtTime(o.cutoff, t);
      o.filter.frequency.exponentialRampToValueAtTime(step.cutoff, t + Math.max(glide, LEGATO_SLEW));
      o.gain.gain.setValueAtTime(o.level, t);
      o.gain.gain.linearRampToValueAtTime(level, t + LEGATO_SLEW);
      o.osc.type = this.params.wave;
      o.freq = freq; o.level = level; o.cutoff = step.cutoff;
    });
  }

  /** Hold to `at`, fade over RELEASE, then stop (and disconnect, via onended). */
  private release(v: Voice, at: number): void {
    for (const o of v.oscs) {
      o.gain.gain.setValueAtTime(o.level, at);
      o.gain.gain.linearRampToValueAtTime(0, at + RELEASE);
      o.osc.stop(at + RELEASE + 0.01);
    }
  }

  /** Stop now, whatever was booked: cancel the future automation and fade fast. */
  private kill(v: Voice, now: number): void {
    if (v.dead) return;
    v.dead = true;
    for (const o of v.oscs) {
      try {
        o.gain.gain.cancelScheduledValues(now);
        o.gain.gain.setTargetAtTime(0, now, 0.005);
        o.osc.stop(now + 0.04);
      } catch { /* already stopped */ }
    }
  }
}
