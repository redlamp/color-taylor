/**
 * Swatch sequencer - the audio half. A lookahead scheduler after Chris Wilson's
 * "A Tale of Two Clocks": a coarse JS timer wakes every 25 ms and books every
 * step that starts inside the lookahead window straight onto the AudioContext
 * clock. The timer only decides *what*; the audio clock decides *when*, so a
 * late tick never makes a late note.
 *
 * Every track (1 to 6 of them) shares one step clock and each loops over its
 * own length, so rows of different lengths drift against each other into a
 * polyrhythm. With `loop` off each track plays through once and falls silent
 * at its end, and the transport stops itself (calling `onEnded`) once the
 * last one has - switched off mid-play, the lap each track is on is its last.
 * Play
 * starts every enabled track at step 0 on the same audio time; a track
 * switched on mid-play waits for the next bar (a multiple of BAR steps on the
 * shared counter) and starts its own step 0 there, so the tracks stay in phase.
 * A track added mid-play is a track switched on: it joins at the next bar too.
 *
 * Every note in a step is its own voice - one oscillator -> lowpass -> gain
 * chain - keyed by the step's `keys`. Glide and legato work key by key: a
 * voice glides from the last pitch its key played, and a held voice carries on
 * only into a step that has its key. In RGB Instruments the keys are the channels,
 * each with its own instrument (wave, level, mute, fixed cutoff).
 *
 * A hold step (sequencer.ts, the alpha notches) books voices only for the keys
 * it strikes; a held key's voice was booked long enough when it struck,
 * because a voice's length is worked out ahead through every tie and every
 * hold that holds its key (carrySteps). A silence (alpha 0) is a rest: it
 * books nothing and ends every voice, held ones included.
 *
 * Visuals read the same clock through `visualAt` - nothing here waits on a
 * frame, and nothing a frame does reaches the audio.
 */
import { getAudioCtx, getMasterGain } from '../utils/audioContext';
import { midiToFreq } from '../utils/synthConfig';
import {
  CUTOFF_MAX, carrySteps, clampGlide, gateSeconds, isLegato, soundingAfter, stepSeconds, sustainedKeys,
  type Channel, type NoteStep, type Step, type Subdivision,
} from './sequencer';

export type Wave = 'triangle' | 'sine' | 'sawtooth' | 'square';

/** One RGB Instruments instrument's sound. Its pitch span lives in the mapping (sequencer.ts). */
export interface Instrument { wave: Wave; level: number; muted: boolean }

export interface EngineParams {
  bpm: number;
  subdivision: Subdivision;
  gatePct: number;
  glideMs: number;
  wave: Wave;
  instruments: Record<Channel, Instrument>;
  /** Off: every track plays once and the transport stops when the longest is done. */
  loop: boolean;
}

export interface TrackInput {
  /** Stable across re-renders and reorders: a track's playing state follows its id, not its position. */
  id: string;
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
/** RGB Instruments: a fixed lowpass per instrument, set to its waveform - bright waves get tamed more. */
export const WAVE_CUTOFF: Record<Wave, number> = { sine: 8000, triangle: 5000, sawtooth: 2800, square: 2400 };

interface Voice {
  key: string;
  osc: OscillatorNode;
  filter: BiquadFilterNode;
  gain: GainNode;
  level: number;
  freq: number;
  cutoff: number;
  dead: boolean;
}

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
  /** Held legato voices by key, carried into the next step. */
  held: Map<string, Voice>;
  /** Every voice this track has booked and not yet ended, so removing the track can silence them. */
  booked: Set<Voice>;
  /** Last pitch each key played, for its glide into the next note. */
  lastMidi: Map<string, number>;
  lastHex: string | null;
  scheduledIndex: number;
  events: StepEvent[];
  /** Shared-counter step where this track's step 0 falls. */
  origin: number;
  /** A note (or a muted one) is carrying on, so a tie extends rather than rests. */
  sounding: boolean;
  /** The note each key is sounding after the last step booked - what a hold step compares against. */
  now: Map<string, number>;
  /** Per key, the last counter step its booked voice runs through; a hold only sustains a voice still running. */
  until: Map<string, number>;
  /** Loop off: the last lap (0 = the first pass) this track plays. */
  lastLap: number;
  /** Counter and audio time of the track's first booked step since start or join; -1 before. */
  startStep: number;
  startTime: number;
}

const HISTORY = 64;
/** Steps per bar - one row of cells. */
export const BAR = 16;

/** One booked step, for verification: how many voices it started or retuned. */
export interface VoiceLogEntry { track: number; index: number; keys: string[] }

export interface SeqCounters {
  readonly notesScheduled: number;
  readonly lastStepTime: number;
  readonly trackIndex: readonly number[];
  readonly trackStartStep: readonly number[];
  readonly trackStartTime: readonly number[];
  readonly voiceLog: readonly VoiceLogEntry[];
  readonly playing: boolean;
  /** Audition notes started since load: held keys, Run notes and Chord voices. */
  readonly auditionNotes: number;
  /** Audition keys held down right now. */
  readonly auditionHeld: number;
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
  private voiceLog: VoiceLogEntry[] = [];
  private ctx: AudioContext | null = null;
  /** Audition voices, apart from `live` so a transport stop leaves a held key sounding. */
  private auditions = new Map<Channel, { v: Voice; midi: number }>();
  private auditionRuns = new Set<Voice>();
  private auditionNotes = 0;
  /** Loop off: audio time the last track's last step ends, once every track is done. */
  private endAt: number | null = null;
  /** Called when the transport stops itself - loop off, every track played through. */
  onEnded: (() => void) | null = null;

  constructor(params: EngineParams) {
    this.params = { ...params };
    this.tracks = [];
  }

  get playing(): boolean { return this.timer !== null; }

  /** Takes effect from the next step booked - no restart. */
  setParams(p: Partial<EngineParams>): void {
    const loopOff = p.loop === false && this.params.loop;
    Object.assign(this.params, p);
    if (p.loop) this.endAt = null;
    // Switched off mid-play: each track finishes the lap it is on.
    if (loopOff) for (const t of this.tracks) t.lastLap = Math.max(0, Math.floor((this.stepCounter - t.origin) / Math.max(1, t.steps.length)));
    // A held audition key follows its instrument's settings as they change.
    const ctx = this.ctx;
    if (ctx) for (const [ch, a] of this.auditions) this.retune(a.v, auditionStep(ch, a.midi), 0, ctx.currentTime, 0);
  }

  /**
   * The whole track list, in order. A track keeps its playing state by id; a
   * new id is a new track (joining at the next bar if the transport runs), and
   * a missing one is removed, its held voices released.
   */
  setTracks(inputs: readonly TrackInput[]): void {
    const byId = new Map(this.tracks.map((t) => [t.id, t]));
    const next = inputs.map((input) => {
      const tr = byId.get(input.id) ?? {
        id: input.id, steps: [], enabled: false, muted: false,
        held: new Map(), booked: new Set(), lastMidi: new Map(), lastHex: null, scheduledIndex: -1, events: [],
        origin: 0, sounding: false, now: new Map(), until: new Map(), lastLap: 0, startStep: -1, startTime: -1,
      };
      byId.delete(input.id);
      if (this.playing && input.enabled && !tr.enabled) {
        // Join at the next bar line still to be booked, never mid-bar.
        tr.origin = Math.ceil(this.stepCounter / BAR) * BAR;
        tr.startStep = -1; tr.startTime = -1;
        tr.lastMidi.clear(); tr.sounding = false; tr.now.clear(); tr.until.clear(); tr.lastLap = 0;
      }
      Object.assign(tr, input);
      return tr;
    });
    // A removed track's notes may be booked well ahead (a long tie): cut them all now.
    const at = this.ctx?.currentTime ?? 0;
    for (const gone of byId.values()) for (const v of gone.booked) this.kill(v, at);
    this.tracks = next;
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
    this.voiceLog = [];
    for (const t of this.tracks) {
      t.held.clear(); t.lastMidi.clear(); t.lastHex = null; t.scheduledIndex = -1; t.events = [];
      t.origin = 0; t.sounding = false; t.now.clear(); t.until.clear(); t.lastLap = 0; t.startStep = -1; t.startTime = -1;
    }
    this.endAt = null;
    this.tick();
    this.timer = setInterval(() => this.tick(), TICK_MS);
  }

  stop(): void {
    if (this.timer !== null) clearInterval(this.timer);
    this.timer = null;
    this.endAt = null;
    const ctx = this.ctx;
    if (ctx) {
      // Steps are booked up to 1.5 s ahead, so a stop has to reach into the future too.
      for (const v of this.live) this.kill(v, ctx.currentTime);
    }
    this.live.clear();
    for (const t of this.tracks) { t.held.clear(); t.booked.clear(); t.events = []; t.scheduledIndex = -1; }
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
    const ev = this.tracks[i]?.events ?? [];
    for (let k = ev.length - 1; k >= 0; k--) if (ev[k].time <= now) return ev[k];
    return null;
  }

  counters(): SeqCounters {
    return {
      notesScheduled: this.notesScheduled,
      lastStepTime: this.lastStepTime,
      trackIndex: this.tracks.map((t) => t.scheduledIndex),
      trackStartStep: this.tracks.map((t) => t.startStep),
      trackStartTime: this.tracks.map((t) => t.startTime),
      voiceLog: this.voiceLog.map((e) => ({ ...e, keys: [...e.keys] })),
      playing: this.playing,
      auditionNotes: this.auditionNotes,
      auditionHeld: this.auditions.size,
    };
  }

  // --- audition: an instrument on its own, over the transport or without it ----

  /** The context, resumed. Called from a press, so the resume counts as a gesture. */
  private auditionCtx(): AudioContext {
    const ctx = getAudioCtx();
    this.ctx = ctx;
    if (ctx.state !== 'running') void ctx.resume();
    getMasterGain();
    return ctx;
  }

  /**
   * Hold `midi` on channel `ch`'s instrument until `auditionOff`. A key
   * already down on that channel glides to the new note instead (sliding
   * across the strip), over the transport's glide time.
   */
  auditionOn(ch: Channel, midi: number): void {
    const ctx = this.auditionCtx();
    const t = ctx.currentTime;
    const step = auditionStep(ch, midi);
    const held = this.auditions.get(ch);
    if (held) {
      if (held.midi === midi) return;
      this.retune(held.v, step, 0, t, Math.min(0.3, this.params.glideMs / 1000));
      held.midi = midi;
    } else {
      const v = this.voice(ctx, step, 0, null, t, 0);
      this.live.delete(v);
      this.auditions.set(ch, { v, midi });
    }
    this.auditionNotes++;
  }

  auditionOff(ch: Channel): void {
    const held = this.auditions.get(ch);
    if (!held || !this.ctx) return;
    this.release(held.v, this.ctx.currentTime);
    this.auditions.delete(ch);
  }

  /**
   * Play `steps` one after another at the transport's tempo, subdivision and
   * gate - a scale run, or a single chord step held for `holdSteps`. A new
   * run cuts off the one before it.
   */
  auditionSequence(steps: readonly NoteStep[], holdSteps = 1): void {
    const ctx = this.auditionCtx();
    for (const v of this.auditionRuns) this.kill(v, ctx.currentTime);
    this.auditionRuns.clear();
    const stepSec = stepSeconds(this.params.bpm, this.params.subdivision);
    const gate = holdSteps > 1 ? stepSec * (holdSteps - 1) + gateSeconds(this.params.gatePct, stepSec) : gateSeconds(this.params.gatePct, stepSec);
    let t = ctx.currentTime + 0.03;
    for (const step of steps) {
      step.keys.forEach((_, n) => {
        const v = this.voice(ctx, step, n, null, t, 0);
        this.live.delete(v);
        this.auditionRuns.add(v);
        v.osc.addEventListener('ended', () => this.auditionRuns.delete(v));
        this.release(v, t + gate);
        this.auditionNotes++;
      });
      t += stepSec;
    }
  }

  private tick(): void {
    const ctx = this.ctx;
    if (!ctx) return;
    if (this.endAt !== null && ctx.currentTime >= this.endAt + RELEASE) {
      this.stop();
      this.onEnded?.();
      return;
    }
    const ahead = typeof document !== 'undefined' && document.hidden ? LOOKAHEAD_HIDDEN : LOOKAHEAD;
    // A stalled timer (a laptop lid, a debugger) must not book a burst of past steps.
    if (this.nextStepTime < ctx.currentTime - 0.2) this.nextStepTime = ctx.currentTime + 0.02;
    while (this.nextStepTime < ctx.currentTime + ahead) {
      const stepSec = stepSeconds(this.params.bpm, this.params.subdivision);
      for (let i = 0; i < this.tracks.length; i++) this.scheduleTrack(ctx, i, this.stepCounter, this.nextStepTime, stepSec);
      if (this.endAt === null && !this.params.loop && this.allDone(this.stepCounter)) this.endAt = this.nextStepTime;
      this.lastStepTime = this.nextStepTime;
      this.nextStepTime += stepSec;
      this.stepCounter++;
    }
  }

  /** Loop off and past its last lap: the track has played through and is silent. */
  private done(tr: TrackState, counter: number): boolean {
    return !this.params.loop && counter >= tr.origin && Math.floor((counter - tr.origin) / tr.steps.length) > tr.lastLap;
  }

  /** Every enabled track with steps has played through (and there is at least one). */
  private allDone(counter: number): boolean {
    const on = this.tracks.filter((t) => t.enabled && t.steps.length > 0);
    return on.length > 0 && on.every((t) => this.done(t, counter));
  }

  private releaseHeld(tr: TrackState, at: number, keep?: ReadonlySet<string>): void {
    for (const [key, v] of tr.held) {
      if (keep?.has(key)) continue;
      this.release(v, at);
      tr.held.delete(key);
    }
  }

  private scheduleTrack(ctx: AudioContext, i: number, counter: number, t: number, stepSec: number): void {
    const tr = this.tracks[i];
    const len = tr.steps.length;
    if (!tr.enabled || len === 0 || counter < tr.origin || this.done(tr, counter)) {
      this.releaseHeld(tr, t);
      tr.scheduledIndex = -1;
      tr.sounding = false;
      tr.now.clear();
      return;
    }
    const index = (counter - tr.origin) % len;
    const step = tr.steps[index];
    tr.scheduledIndex = index;
    if (tr.startStep < 0) { tr.startStep = counter; tr.startTime = t; }

    const { gatePct, glideMs } = this.params;
    const legato = isLegato(gatePct);
    const glide = clampGlide(glideMs, stepSec);

    if (step.rest && step.tie && tr.sounding) {
      // The notes booked earlier already run through this step - every voice
      // of them. Hold the colour, book nothing.
      this.record(tr, { time: t, index, fromHex: tr.lastHex, toHex: tr.lastHex, glide: 0 });
      return;
    }
    if (step.rest) {
      this.releaseHeld(tr, t);
      // A tie with nothing to carry on is a rest, and shows as one.
      const hex = step.tie ? null : step.hex;
      this.record(tr, { time: t, index, fromHex: tr.lastHex, toHex: hex, glide: 0 });
      tr.lastHex = hex;
      tr.sounding = false;
      tr.now.clear();
      return;
    }
    // A hold step: held keys that were sounding carry on - if their voice is still running.
    const sustained = sustainedKeys(step, tr.now);
    for (const k of sustained) if (legato ? !tr.held.has(k) : (tr.until.get(k) ?? -1) < counter) sustained.delete(k);
    tr.now = soundingAfter(step, tr.now);
    for (const k of tr.now.keys()) if (!sustained.has(k) && !step.keys.includes(k)) tr.now.delete(k);
    tr.sounding = tr.now.size > 0;

    const from = step.keys.map((k) => tr.lastMidi.get(k) ?? null);
    const glides = step.keys.some((k, n) => from[n] !== null && !sustained.has(k)) && glide > 0;
    this.record(tr, { time: t, index, fromHex: tr.lastHex, toHex: step.hex, glide: glides ? glide : 0 });
    tr.lastHex = step.hex;
    step.keys.forEach((k, n) => tr.lastMidi.set(k, step.midis[n]));

    if (tr.muted) {
      this.releaseHeld(tr, t);
      return;
    }

    const struck = step.keys.filter((k) => !(step.rgb && this.params.instruments[k as Channel].muted));
    // A held legato voice whose key neither strikes nor holds here (a channel fell silent) ends here.
    this.releaseHeld(tr, t, legato ? new Set([...struck, ...sustained]) : undefined);
    this.notesScheduled++;
    this.voiceLog.push({ track: i, index, keys: struck });
    if (this.voiceLog.length > HISTORY) this.voiceLog.splice(0, this.voiceLog.length - HISTORY);

    step.keys.forEach((key, n) => {
      if (!struck.includes(key)) return;
      const held = tr.held.get(key);
      if (legato && held) { this.retune(held, step, n, t, glide); return; }
      const v = this.voice(ctx, step, n, from[n], t, glide);
      tr.booked.add(v);
      v.osc.addEventListener('ended', () => tr.booked.delete(v));
      if (legato) { tr.held.set(key, v); return; }
      // The voice's length is known now: it runs through every tie, and every
      // hold that holds this key, and the gate applies to the last of those
      // steps. Deciding later is too late - with a short gate the release time
      // can pass before the next step is booked.
      const carry = carrySteps(tr.steps, index, key, this.params.loop);
      tr.until.set(key, counter + carry);
      this.release(v, Math.max(t + ATTACK, t + carry * stepSec + gateSeconds(gatePct, stepSec)));
    });
  }

  private record(tr: TrackState, ev: StepEvent): void {
    tr.events.push(ev);
    if (tr.events.length > HISTORY) tr.events.splice(0, tr.events.length - HISTORY);
  }

  /** Wave, level and cutoff for note `n`: the channel's instrument in RGB Instruments, the globals otherwise. */
  private sound(step: NoteStep, n: number): { wave: Wave; level: number; cutoff: number } {
    if (step.rgb) {
      const inst = this.params.instruments[step.keys[n] as Channel];
      // Three instruments at once: trim so full levels on all three don't clip the bus.
      const level = step.velocity * inst.level * TRACK_GAIN * WAVE_LOUDNESS[inst.wave] / Math.sqrt(3);
      return { wave: inst.wave, level, cutoff: WAVE_CUTOFF[inst.wave] };
    }
    const wave = this.params.wave;
    const level = step.velocity * step.levels[n] * TRACK_GAIN * WAVE_LOUDNESS[wave] / Math.sqrt(step.midis.length);
    return { wave, level, cutoff: step.cutoff };
  }

  /** A new voice: glides from its key's previous pitch if there is one, attacks from 0. */
  private voice(ctx: AudioContext, step: NoteStep, n: number, from: number | null, t: number, glide: number): Voice {
    const { wave, level, cutoff } = this.sound(step, n);
    const osc = ctx.createOscillator();
    osc.type = wave;
    const freq = midiToFreq(step.midis[n]);
    if (from !== null && glide > 0) {
      osc.frequency.setValueAtTime(midiToFreq(from), t);
      osc.frequency.linearRampToValueAtTime(freq, t + glide);
    } else {
      osc.frequency.setValueAtTime(freq, t);
    }
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.Q.value = 0.7;
    filter.frequency.setValueAtTime(cutoff, t);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(level, t + ATTACK);
    osc.connect(filter).connect(gain).connect(getMasterGain());
    osc.start(t);
    const v: Voice = { key: step.keys[n], osc, filter, gain, level, freq, cutoff, dead: false };
    osc.onended = () => {
      osc.disconnect(); filter.disconnect(); gain.disconnect();
      this.live.delete(v);
    };
    this.live.add(v);
    return v;
  }

  /** Legato: keep the voice sounding, ramp it to the new note instead of retriggering. */
  private retune(v: Voice, step: NoteStep, n: number, t: number, glide: number): void {
    const { wave, level, cutoff } = this.sound(step, n);
    const freq = midiToFreq(step.midis[n]);
    v.osc.frequency.setValueAtTime(v.freq, t);
    if (glide > 0) v.osc.frequency.linearRampToValueAtTime(freq, t + glide);
    else v.osc.frequency.setValueAtTime(freq, t);
    v.filter.frequency.setValueAtTime(v.cutoff, t);
    v.filter.frequency.exponentialRampToValueAtTime(cutoff, t + Math.max(glide, LEGATO_SLEW));
    v.gain.gain.setValueAtTime(v.level, t);
    v.gain.gain.linearRampToValueAtTime(level, t + LEGATO_SLEW);
    v.osc.type = wave;
    v.freq = freq; v.level = level; v.cutoff = cutoff;
  }

  /** Hold to `at`, fade over RELEASE, then stop (and disconnect, via onended). */
  private release(v: Voice, at: number): void {
    v.gain.gain.setValueAtTime(v.level, at);
    v.gain.gain.linearRampToValueAtTime(0, at + RELEASE);
    v.osc.stop(at + RELEASE + 0.01);
  }

  /** Stop now, whatever was booked: cancel the future automation and fade fast. */
  private kill(v: Voice, now: number): void {
    if (v.dead) return;
    v.dead = true;
    try {
      v.gain.gain.cancelScheduledValues(now);
      v.gain.gain.setTargetAtTime(0, now, 0.005);
      v.osc.stop(now + 0.04);
    } catch { /* already stopped */ }
  }
}

/** One RGB Instruments note on one channel at full accent - what an audition key plays. */
export function auditionStep(ch: Channel, midi: number): NoteStep {
  return {
    rest: false, hex: '#000000', midis: [midi], keys: [ch], rgb: true, levels: [1], velocity: 1,
    cutoff: CUTOFF_MAX, label: '', detail: '',
  };
}
