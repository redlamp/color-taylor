/**
 * Silent stand-in for src/hooks/useUiSounds.
 *
 * The sounds are a layer on top of the picker, not part of it, and the plugin
 * does not want that layer - a Figma panel making noises on save and delete is
 * out of place, and it would drag an AudioContext and four oscillator graphs
 * into the bundle for something that never plays. The app is unaffected and
 * keeps its own runtime `muted` switch.
 */
export interface UiSounds {
  playFlit: () => void;
  playClick: () => void;
  playSave: () => void;
  playPop: () => void;
}

const noop = () => {};

export default function useUiSounds(_muted?: boolean): UiSounds {
  return { playFlit: noop, playClick: noop, playSave: noop, playPop: noop };
}
