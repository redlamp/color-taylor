/**
 * The panel's interface sounds: a flit when saved colors re-sort, a click on
 * reorder, a chime on save, a pop on delete.
 *
 * Deliberately its own module rather than part of ColorHexagon. A color
 * picker should not own an oscillator graph - the sounds are a layer on top of
 * it, switchable two ways: at runtime through `muted`, and at build time by
 * aliasing this module to a silent one, which is what the Figma plugin does.
 * Nothing here is imported unless a host asks for it.
 */
import { useCallback, useEffect, useRef } from 'react';
import { getAudioCtx, getMasterGain } from '../utils/audioContext';

export interface UiSounds {
  /** Saved colors settling into a new sort order. */
  playFlit: () => void;
  /** A slot picked up or dropped while reordering. */
  playClick: () => void;
  /** A color committed to a slot. */
  playSave: () => void;
  /** A slot cleared. */
  playPop: () => void;
}

export default function useUiSounds(muted?: boolean): UiSounds {
  const mutedRef = useRef<boolean>(!!muted);
  useEffect(() => { mutedRef.current = !!muted; }, [muted]);

  const rand = useCallback((center: number, spread: number) => center + (Math.random() * 2 - 1) * spread, []);

  const ensureAudioCtx = useCallback(() => getAudioCtx(), []);

  const playFlit = useCallback(() => {
    if (mutedRef.current) return;
    try {
      const ctx = ensureAudioCtx();
      const t = ctx.currentTime;
      const duration = rand(0.36, 0.04);
      const startFreq = rand(450, 60);
      const peakFreq = rand(1700, 180);
      const endFreq = rand(900, 100);
      const Q = rand(1.2, 0.25);
      const peakGain = rand(0.22, 0.03);

      const buf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * duration), ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;

      const src = ctx.createBufferSource();
      src.buffer = buf;

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.Q.value = Q;
      filter.frequency.setValueAtTime(startFreq, t);
      filter.frequency.exponentialRampToValueAtTime(peakFreq, t + duration * 0.7);
      filter.frequency.exponentialRampToValueAtTime(endFreq, t + duration);

      const tilt = ctx.createBiquadFilter();
      tilt.type = 'highshelf';
      tilt.frequency.value = 3000;
      tilt.gain.value = -6;

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(peakGain, t + 0.09);
      gain.gain.linearRampToValueAtTime(peakGain * 0.82, t + 0.24);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);

      src.connect(filter).connect(tilt).connect(gain).connect(getMasterGain());
      src.start(t);
      src.stop(t + duration + 0.02);
    } catch { /* localStorage unavailable */ }
  }, [ensureAudioCtx, rand]);

  const playClick = useCallback(() => {
    if (mutedRef.current) return;
    try {
      const ctx = ensureAudioCtx();
      const t = ctx.currentTime;

      const duration = rand(0.04, 0.008);
      const filterFreq = rand(2000, 260);
      const filterQ = rand(0.8, 0.18);
      const peakGain = rand(0.18, 0.04);

      const buffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * duration), ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < data.length; i++) {
        data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
      }

      const src = ctx.createBufferSource();
      src.buffer = buffer;

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = filterFreq;
      filter.Q.value = filterQ;

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.001, t);
      gain.gain.exponentialRampToValueAtTime(peakGain, t + 0.002);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);

      src.connect(filter).connect(gain).connect(getMasterGain());
      src.start(t);
      src.stop(t + duration + 0.01);
    } catch { /* localStorage unavailable */ }
  }, [ensureAudioCtx, rand]);

  const playSave = useCallback(() => {
    if (mutedRef.current) return;
    try {
      const ctx = ensureAudioCtx();
      const t = ctx.currentTime;

      const duration = rand(0.11, 0.015);
      const noiseFreq = rand(750, 90);
      const noiseQ = rand(1.1, 0.18);
      const noisePeak = rand(0.18, 0.03);
      const thumpStart = rand(140, 18);
      const thumpEnd = rand(55, 8);
      const thumpDur = rand(0.085, 0.012);
      const thumpPeak = rand(0.18, 0.03);

      const noiseBuf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * duration), ctx.sampleRate);
      const data = noiseBuf.getChannelData(0);
      for (let i = 0; i < data.length; i++) {
        data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
      }
      const noise = ctx.createBufferSource();
      noise.buffer = noiseBuf;

      const bandpass = ctx.createBiquadFilter();
      bandpass.type = 'bandpass';
      bandpass.frequency.value = noiseFreq;
      bandpass.Q.value = noiseQ;

      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.0001, t);
      noiseGain.gain.exponentialRampToValueAtTime(noisePeak, t + 0.003);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, t + duration);

      noise.connect(bandpass).connect(noiseGain).connect(getMasterGain());
      noise.start(t);
      noise.stop(t + duration + 0.02);

      const thump = ctx.createOscillator();
      const thumpGain = ctx.createGain();
      thump.type = 'sine';
      thump.frequency.setValueAtTime(thumpStart, t);
      thump.frequency.exponentialRampToValueAtTime(thumpEnd, t + thumpDur);
      thumpGain.gain.setValueAtTime(0.0001, t);
      thumpGain.gain.exponentialRampToValueAtTime(thumpPeak, t + 0.005);
      thumpGain.gain.exponentialRampToValueAtTime(0.0001, t + thumpDur + 0.01);
      thump.connect(thumpGain).connect(getMasterGain());
      thump.start(t);
      thump.stop(t + thumpDur + 0.02);
    } catch { /* localStorage unavailable */ }
  }, [ensureAudioCtx, rand]);

  const playPop = useCallback(() => {
    if (mutedRef.current) return;
    try {
      const ctx = ensureAudioCtx();

      // Crumple: filtered noise burst with random crinkle envelope.
      const duration = rand(0.32, 0.04);
      const bandpassFreq = rand(2800, 250);
      const bandpassQ = rand(1.4, 0.25);
      const shelfFreq = rand(4000, 300);
      const shelfGain = rand(4, 1);

      const buffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * duration), ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;

      const src = ctx.createBufferSource();
      src.buffer = buffer;

      const bandpass = ctx.createBiquadFilter();
      bandpass.type = 'bandpass';
      bandpass.frequency.value = bandpassFreq;
      bandpass.Q.value = bandpassQ;

      const highshelf = ctx.createBiquadFilter();
      highshelf.type = 'highshelf';
      highshelf.frequency.value = shelfFreq;
      highshelf.gain.value = shelfGain;

      const gain = ctx.createGain();
      const t = ctx.currentTime;
      gain.gain.setValueAtTime(0.0001, t);

      // Random crinkle envelope: 6–10 short spikes within the duration.
      const spikes = 7 + Math.floor(Math.random() * 4);
      const step = duration / spikes;
      let cur = t;
      for (let i = 0; i < spikes; i++) {
        const slot = step * (0.4 + Math.random() * 0.6);
        const rise = 0.004 + Math.random() * 0.01;
        const fall = slot - rise;
        const peak = 0.06 + Math.random() * 0.18;
        cur += rise;
        gain.gain.exponentialRampToValueAtTime(peak, cur);
        cur += Math.max(0.005, fall);
        gain.gain.exponentialRampToValueAtTime(0.003, cur);
      }
      gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);

      src.connect(bandpass).connect(highshelf).connect(gain).connect(getMasterGain());
      src.start(t);
      src.stop(t + duration + 0.05);
    } catch { /* localStorage unavailable */ }
  }, [ensureAudioCtx, rand]);


  return { playFlit, playClick, playSave, playPop };
}
