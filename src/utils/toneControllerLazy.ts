// Lazy wrapper around the heavy ./colorSynth engine. Methods queue or no-op
// while the module loads; once loaded, subsequent calls delegate directly.
// All consumers should import { toneController } from here, NOT from
// './colorSynth', so Vite can keep the engine in its own dynamic chunk.

import type { HSB } from './colorConversions';
import type { SynthConfig } from './synthConfig';

type Owner = 'animation' | 'press' | 'pulse';

interface ToneControllerLike {
  start(hsb: HSB, owner?: Owner, force?: boolean): void;
  update(hsb: HSB): void;
  stop(fadeMs?: number): void;
  release(): void;
  pulse(hsb: HSB, isPointerDown: boolean): void;
  setConfig(patch: Partial<SynthConfig>): void;
  setMuted(muted: boolean): void;
  notifyPointerUp(): void;
  isActive(): boolean;
}

let real: ToneControllerLike | null = null;
let loadPromise: Promise<ToneControllerLike> | null = null;

/*
 * Whether the audio feature is switched on at all.
 *
 * The gate lives here rather than at the ~25 call sites in ColorPicker and
 * ColorHexagon, because this module is already the single door to the engine -
 * every consumer is required to come through it. One check here cannot be
 * forgotten at a new callsite the way twenty-five could.
 *
 * Off by default: nothing makes a sound, and more to the point nothing loads,
 * until the setting says so.
 */
let enabled = false;

/*
 * Config and mute arrive before anything wants to make a sound - the settings
 * provider pushes the synth config on mount - so they are held here rather than
 * forcing the engine in to receive them.
 *
 * They used to call load(). That quietly defeated the whole point of this
 * wrapper: synthConfig, audioContext and colorSynth were all fetched on every
 * page load, with the synth disabled, before the user had touched anything.
 */
let pendingConfig: Partial<SynthConfig> | null = null;
let pendingMuted: boolean | null = null;

function load(): Promise<ToneControllerLike> {
  if (!loadPromise) {
    loadPromise = import('./colorSynth').then(mod => {
      real = mod.toneController;
      if (pendingConfig) {
        real.setConfig(pendingConfig);
        pendingConfig = null;
      }
      if (pendingMuted !== null) {
        real.setMuted(pendingMuted);
        pendingMuted = null;
      }
      return real;
    });
  }
  return loadPromise;
}

/**
 * Turn the audio feature on or off. Called by the settings provider.
 *
 * Switching off silences anything already sounding but keeps the loaded module -
 * there is no way to unload it, and a user toggling back on should not wait for
 * a second fetch.
 */
export function setAudioEnabled(next: boolean): void {
  enabled = next;
  if (!next && real) real.stop(0);
}

// Methods that should trigger module load on first call (user gesture / start).
// Others (update, stop, release, isActive, notifyPointerUp) no-op until loaded.
export const toneController: ToneControllerLike = {
  start(hsb, owner, force) {
    if (!enabled) return;
    if (real) real.start(hsb, owner, force);
    else load().then(c => c.start(hsb, owner, force));
  },
  update(hsb) {
    if (real) real.update(hsb);
    // No-op pre-load: nothing to update yet.
  },
  stop(fadeMs) {
    if (real) real.stop(fadeMs);
  },
  release() {
    if (real) real.release();
  },
  pulse(hsb, isPointerDown) {
    if (!enabled) return;
    if (real) real.pulse(hsb, isPointerDown);
    else load().then(c => c.pulse(hsb, isPointerDown));
  },
  setConfig(patch) {
    if (real) real.setConfig(patch);
    else pendingConfig = { ...(pendingConfig ?? {}), ...patch };
  },
  setMuted(muted) {
    if (real) real.setMuted(muted);
    else pendingMuted = muted;
  },
  notifyPointerUp() {
    if (real) real.notifyPointerUp();
  },
  isActive() {
    return real ? real.isActive() : false;
  },
};
