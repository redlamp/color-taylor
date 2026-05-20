// Shared AudioContext + master gain singletons. Tiny module so consumers
// who only need to route a quick UI sound (flit / click / save / pop) don't
// pull in the full synth engine.

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

export function _getMasterCompressor(): DynamicsCompressorNode | null {
  return masterCompressor;
}
