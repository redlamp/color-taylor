/**
 * Stands in for src/utils/toneControllerLazy in the plugin build.
 *
 * That module dynamically imports ./colorSynth, and the plugin bundles as a
 * single IIFE with codeSplitting off - so the dynamic import is inlined and
 * the whole synth engine ships in the panel, for a hold-tone nobody asked a
 * color picker plugin to make. It also produced the EMPTY_IMPORT_META
 * warning on every build: rolldown rewrites the inlined import's loader to
 * reference `import.meta.url`, which has no meaning in an IIFE.
 *
 * Aliased in vite.figma.config.ts. The app is untouched and keeps its audio.
 */
import type { HSB } from '../../src/utils/colorConversions';
import type { SynthConfig } from '../../src/utils/synthConfig';

type Owner = 'animation' | 'press' | 'pulse';

export const toneController = {
  start(_hsb: HSB, _owner?: Owner, _force?: boolean) {},
  update(_hsb: HSB) {},
  stop(_fadeMs?: number) {},
  release() {},
  pulse(_hsb: HSB, _isPointerDown: boolean) {},
  setConfig(_patch: Partial<SynthConfig>) {},
  setMuted(_muted: boolean) {},
  notifyPointerUp() {},
  isActive() {
    return false;
  },
};
