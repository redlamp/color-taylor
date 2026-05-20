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

function load(): Promise<ToneControllerLike> {
  if (!loadPromise) {
    loadPromise = import('./colorSynth').then(mod => {
      real = mod.toneController;
      return real;
    });
  }
  return loadPromise;
}

// Methods that should trigger module load on first call (user gesture / start).
// Others (update, stop, release, isActive, notifyPointerUp) no-op until loaded.
export const toneController: ToneControllerLike = {
  start(hsb, owner, force) {
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
    if (real) real.pulse(hsb, isPointerDown);
    else load().then(c => c.pulse(hsb, isPointerDown));
  },
  setConfig(patch) {
    if (real) real.setConfig(patch);
    else load().then(c => c.setConfig(patch));
  },
  setMuted(muted) {
    if (real) real.setMuted(muted);
    else load().then(c => c.setMuted(muted));
  },
  notifyPointerUp() {
    if (real) real.notifyPointerUp();
  },
  isActive() {
    return real ? real.isActive() : false;
  },
};
