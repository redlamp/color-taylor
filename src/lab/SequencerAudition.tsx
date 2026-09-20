/**
 * Audition an RGB instrument on its own: a strip of keys, one per note of the
 * channel's range, and a Run up the scale and back. Press and hold a key to
 * hold its note; slide along the strip and it glides; release or leave and it
 * ends. Everything goes through the engine's audition API, which builds its
 * voices with the same code the scheduler does, so a key sounds exactly like
 * that channel in a track - and mixes over the transport if it is playing.
 */
import { useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { Button } from '@/components/ui/button';
import { midiToName } from '../utils/synthConfig';
import { channelChoices, instrumentName, type Channel, type MapConfig } from './sequencer';
import { auditionStep, type SequencerEngine } from './sequencerEngine';

export default function AuditionStrip({ ch, cfg, engine, ink }: {
  ch: Channel; cfg: MapConfig; engine: SequencerEngine; ink: string;
}) {
  const choices = channelChoices(ch, cfg);
  const name = instrumentName(ch, cfg);
  const [held, setHeld] = useState<number | null>(null);
  const down = useRef(false);
  const stripRef = useRef<HTMLDivElement | null>(null);

  /** The key under the pointer, by x - so a drag reads across keys even under implicit touch capture. */
  const keyAt = (clientX: number): number | null => {
    const el = stripRef.current;
    if (!el) return null;
    const r = el.getBoundingClientRect();
    if (clientX < r.left || clientX > r.right) return null;
    return Math.min(choices.length - 1, Math.max(0, Math.floor(((clientX - r.left) / r.width) * choices.length)));
  };
  const play = (i: number | null) => {
    if (i === null) return;
    engine.auditionOn(ch, choices[i]);
    setHeld(i);
  };
  const end = () => {
    if (!down.current) return;
    down.current = false;
    engine.auditionOff(ch);
    setHeld(null);
  };

  const onDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    down.current = true;
    play(keyAt(e.clientX));
  };
  const onMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!down.current) return;
    const i = keyAt(e.clientX);
    if (i !== null && i !== held) play(i);
  };
  const run = () => {
    const up = [...choices, ...choices.slice(0, -1).reverse()];
    engine.auditionSequence(up.map((m) => auditionStep(ch, m)));
  };

  return (
    <div className="flex items-center gap-3" data-audition={ch}>
      <div
        ref={stripRef}
        className="flex h-11 flex-1 touch-none select-none overflow-hidden rounded-md border border-border"
        role="group"
        aria-label={`${name} audition keys`}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={end}
        onPointerCancel={end}
        onPointerLeave={end}
      >
        {choices.map((m, i) => {
          // Tint deepens up the range; the first key of each octave is named.
          const strength = 25 + Math.round((60 * i) / Math.max(1, choices.length - 1));
          const named = i % Math.max(1, choices.length / (cfg.ranges?.[ch].range ?? 1)) === 0;
          return (
            <div
              key={m}
              data-key={midiToName(m)}
              aria-label={midiToName(m)}
              aria-pressed={held === i}
              className={'flex min-w-0 flex-1 items-end justify-center border-r border-background pb-0.5 text-base last:border-r-0 '
                + (held === i ? 'ring-3 ring-inset ring-foreground' : '')}
              style={{ backgroundColor: `color-mix(in srgb, ${ink} ${strength}%, transparent)` }}
            >
              {named && <span className="truncate px-0.5 leading-tight text-foreground">{midiToName(m)}</span>}
            </div>
          );
        })}
      </div>
      <Button variant="outline" className="text-base" onClick={run} aria-label={`Run the ${name} scale`}>Run</Button>
    </div>
  );
}
