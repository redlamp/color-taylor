import { useState, useRef } from 'react';
import { useSettings } from '@/hooks/useSettings';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
import { Volume, Volume1, Volume2, VolumeOff } from 'lucide-react';
import { hsbToRgb, rgbToHex } from '@/utils/colorConversions';
import { toneController } from '@/utils/toneControllerLazy';
import {
  midiToName, midiToFreq,
  type Scale, type OscType, type SynthMode, type Chord, type VoiceOrder,
} from '@/utils/synthConfig';

const MODES: { value: SynthMode; label: string }[] = [
  { value: 'rgb-chord', label: 'RGB chord' },
  { value: 'hue-voice', label: 'Hue voice' },
];

const CHORDS: { value: Chord; label: string }[] = [
  { value: 'major', label: 'Maj' },
  { value: 'minor', label: 'Min' },
  { value: 'stacked-fifths', label: '5ths' },
  { value: 'octaves', label: 'Oct' },
];

const ORDERS: { value: VoiceOrder; label: string }[] = [
  { value: 'r-low', label: 'R = low' },
  { value: 'r-high', label: 'R = high' },
];

const SCALES: { value: Scale; label: string }[] = [
  { value: 'continuous', label: 'Free' },
  { value: 'pentatonic', label: 'Penta' },
  { value: 'major', label: 'Diatonic' },
  { value: 'chromatic', label: 'Chrom' },
];

const OSCS: { value: OscType; label: string }[] = [
  { value: 'sine', label: 'Sine' },
  { value: 'triangle', label: 'Triangle' },
  { value: 'sawtooth', label: 'Saw' },
  { value: 'square', label: 'Square' },
];

function SegmentedRow<T extends string>({
  value, options, onChange, disabled, activeClass,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
  disabled?: boolean;
  activeClass?: string;
}) {
  const active = activeClass ?? 'bg-primary text-primary-foreground';
  return (
    <div className={'grid grid-flow-col auto-cols-fr gap-1 rounded-md border border-input p-0.5 ' + (disabled ? 'opacity-50 pointer-events-none' : '')}>
      {options.map(o => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={
            'px-2 py-1 text-sm rounded-sm cursor-pointer select-none transition ' +
            (value === o.value
              ? active
              : 'text-muted-foreground hover:text-foreground hover:bg-muted')
          }
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function SliderRow({
  label, value, min, max, step, onChange, format,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (v: number) => void;
  format?: (v: number) => string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <Label className="text-sm text-muted-foreground">{label}</Label>
        <span className="text-sm tabular-nums text-foreground">{format ? format(value) : value}</span>
      </div>
      <Slider
        value={[value]}
        min={min}
        max={max}
        step={step ?? 1}
        onValueChange={(v) => {
          const next = Array.isArray(v) ? v[0] : v;
          if (typeof next === 'number') onChange(next);
        }}
      />
    </div>
  );
}

interface AudioSettingsProps {
  muted: boolean;
  onToggleMute: () => void;
}

export function AudioSettings({ muted, onToggleMute }: AudioSettingsProps) {
  const { settings, updateSynth } = useSettings();
  const s = settings.synth;
  const isChord = s.mode === 'rgb-chord';
  const [previewHex, setPreviewHex] = useState<string | null>(null);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const previewRafRef = useRef<number | null>(null);
  const MuteIcon = muted || s.masterGain <= 0.01
    ? VolumeOff
    : s.masterGain < 0.66
      ? Volume
      : s.masterGain < 1.33
        ? Volume1
        : Volume2;

  // Ambient 100 BPM, quarter = 600ms. Whole = 2400ms, half = 1200ms.
  type Keyframe = { t: number; hsb: { h: number; s: number; b: number } };
  // Hue cycle = 4800ms motion (2 wholes) + 3 × half-note pauses at R/G/B = 8400ms total
  const CHORD_KEYFRAMES: Keyframe[] = [
    { t: 0,     hsb: { h: 0,   s: 100, b: 0   } },  // black (saturated, no brightness)
    { t: 2400,  hsb: { h: 0,   s: 100, b: 100 } },  // black -> red (1 whole)
    { t: 3600,  hsb: { h: 0,   s: 100, b: 100 } },  // pause at red (half)
    { t: 5200,  hsb: { h: 120, s: 100, b: 100 } },  // red -> green (1/3 of 4800ms = 1600)
    { t: 6400,  hsb: { h: 120, s: 100, b: 100 } },  // pause at green (half)
    { t: 8000,  hsb: { h: 240, s: 100, b: 100 } },  // green -> blue
    { t: 9200,  hsb: { h: 240, s: 100, b: 100 } },  // pause at blue (half)
    { t: 10800, hsb: { h: 360, s: 100, b: 100 } },  // blue -> red (h=360)
    { t: 13200, hsb: { h: 0,   s: 0,   b: 100 } },  // red -> white (1 whole)
    { t: 14400, hsb: { h: 0,   s: 0,   b: 100 } },  // hold white (half)
    { t: 15600, hsb: { h: 0,   s: 0,   b: 0   } },  // white -> black (half)
  ];

  // Hue voicing preview uses the same keyframe path as chord.
  const HUE_KEYFRAMES: Keyframe[] = CHORD_KEYFRAMES;

  const stopPreview = () => {
    if (previewRafRef.current !== null) {
      cancelAnimationFrame(previewRafRef.current);
      previewRafRef.current = null;
    }
    toneController.stop(150);
    setPreviewHex(null);
    setIsPreviewing(false);
  };

  const runPreview = (keyframes: Keyframe[]) => {
    toneController.start(keyframes[0].hsb, 'animation', true);
    setIsPreviewing(true);
    const startTime = performance.now();
    const totalMs = keyframes[keyframes.length - 1].t;
    const tick = (now: number) => {
      const elapsed = now - startTime;
      if (elapsed >= totalMs) {
        previewRafRef.current = null;
        toneController.stop(150);
        setPreviewHex(null);
        setIsPreviewing(false);
        return;
      }
      let i = 0;
      while (i < keyframes.length - 1 && keyframes[i + 1].t < elapsed) i++;
      const a = keyframes[i];
      const b = keyframes[i + 1];
      const span = b.t - a.t;
      const segT = span > 0 ? (elapsed - a.t) / span : 1;
      let dh = b.hsb.h - a.hsb.h;
      if (dh > 180) dh -= 360;
      if (dh < -180) dh += 360;
      const hsb = {
        h: ((a.hsb.h + dh * segT) % 360 + 360) % 360,
        s: a.hsb.s + (b.hsb.s - a.hsb.s) * segT,
        b: a.hsb.b + (b.hsb.b - a.hsb.b) * segT,
      };
      toneController.update(hsb);
      const rgb = hsbToRgb(hsb.h, hsb.s, hsb.b);
      setPreviewHex(rgbToHex(rgb.r, rgb.g, rgb.b));
      previewRafRef.current = requestAnimationFrame(tick);
    };
    previewRafRef.current = requestAnimationFrame(tick);
  };

  const preview = () => {
    if (isPreviewing) stopPreview();
    else runPreview(isChord ? CHORD_KEYFRAMES : HUE_KEYFRAMES);
  };

  return (
    <div className="flex flex-col gap-3 px-1">
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={onToggleMute}
              aria-label={muted ? 'Unmute sounds' : 'Mute sounds'}
              className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer select-none"
            >
              <MuteIcon className="size-3.5" />
            </button>
            <Label className="text-sm text-muted-foreground">Main volume</Label>
          </div>
          <span className="text-sm tabular-nums text-foreground">{(s.masterGain * 100).toFixed(0)}%</span>
        </div>
        <Slider
          value={[s.masterGain]}
          min={0} max={2} step={0.05}
          onValueChange={(v) => {
            const next = Array.isArray(v) ? v[0] : v;
            if (typeof next === 'number') updateSynth({ masterGain: next });
          }}
        />
      </div>

      <div className="flex items-center justify-between">
        <Label className="text-sm text-muted-foreground">Color Synth</Label>
        <button
          type="button"
          role="switch"
          aria-checked={s.synthEnabled}
          onClick={() => updateSynth({ synthEnabled: !s.synthEnabled })}
          className={
            'relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border border-input transition-colors select-none ' +
            (s.synthEnabled ? 'bg-primary' : 'bg-muted')
          }
        >
          <span
            className={
              'inline-block h-4 w-4 rounded-full bg-white shadow transform transition-transform ' +
              (s.synthEnabled ? 'translate-x-4' : 'translate-x-0.5')
            }
          />
        </button>
      </div>

      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between gap-2">
          <Label className="text-sm text-muted-foreground shrink-0">Mode</Label>
          <div className="flex-1 max-w-[65%]">
            <SegmentedRow value={s.mode} options={MODES} onChange={(v) => updateSynth({ mode: v })} />
          </div>
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs text-muted-foreground">
            {isChord ? 'R/G/B values mix three pitches.' : 'Hue → pitch. Drag to sweep.'}
          </span>
          <div className="flex items-center gap-2">
            <div
              aria-hidden
              className="h-7 w-12 rounded-md border border-input shrink-0"
              style={{ backgroundColor: previewHex ?? 'transparent' }}
            />
            <Button variant="outline" size="sm" onClick={preview} className="w-[68px]">{isPreviewing ? 'Stop' : 'Preview'}</Button>
          </div>
        </div>
      </div>

      <Accordion multiple defaultValue={[]}>
        {isChord && (
          <AccordionItem value="voicing">
            <AccordionTrigger className="text-sm text-muted-foreground">Voicing</AccordionTrigger>
            <AccordionContent>
              <div className="flex flex-col gap-3 pt-1 pl-3 pr-1 ml-0.5 border-l border-input/40">
                <div className="flex items-center justify-between gap-2">
                  <Label className="text-sm text-muted-foreground shrink-0">Chord</Label>
                  <div className="flex-1 max-w-[65%]">
                    <SegmentedRow value={s.chord} options={CHORDS} onChange={(v) => updateSynth({ chord: v })} />
                  </div>
                </div>

                <SliderRow
                  label="Root note" value={s.rootMidi} min={24} max={72}
                  format={(v) => `${midiToName(v)}  (${midiToFreq(v).toFixed(1)} Hz)`}
                  onChange={(v) => updateSynth({ rootMidi: v })}
                />

                <SliderRow
                  label="Detune spread" value={s.detuneCents} min={0} max={20} step={0.5}
                  format={(v) => `${v.toFixed(1)} cents`}
                  onChange={(v) => updateSynth({ detuneCents: v })}
                />

                <div className="flex items-center justify-between gap-2">
                  <Label className="text-sm text-muted-foreground shrink-0">Tuning</Label>
                  <div className="flex-1 max-w-[65%]">
                    <SegmentedRow
                      value={s.tuning}
                      options={[{ value: 'just', label: 'Just' }, { value: 'equal', label: 'Equal' }] as { value: 'just' | 'equal'; label: string }[]}
                      onChange={(v) => updateSynth({ tuning: v })}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2">
                  <Label className="text-sm text-muted-foreground shrink-0">Voice order</Label>
                  <div className="flex-1 max-w-[65%]">
                    <SegmentedRow value={s.voiceOrder} options={ORDERS} onChange={(v) => updateSynth({ voiceOrder: v })} />
                  </div>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        )}

        {!isChord && (
          <AccordionItem value="voicing">
            <AccordionTrigger className="text-sm text-muted-foreground">Voicing</AccordionTrigger>
            <AccordionContent>
              <div className="flex flex-col gap-3 pt-1 pl-3 pr-1 ml-0.5 border-l border-input/40">
                <div className="flex flex-col gap-1.5">
                  <Label className="text-sm text-muted-foreground">Scale</Label>
                  <SegmentedRow value={s.scale} options={SCALES} onChange={(v) => updateSynth({ scale: v })} />
                </div>
                <SliderRow
                  label="Base octave" value={s.baseOctave} min={1} max={6}
                  onChange={(v) => updateSynth({ baseOctave: v })}
                />
                <SliderRow
                  label="Octave range" value={s.octaveRange} min={1} max={4}
                  onChange={(v) => updateSynth({ octaveRange: v })}
                />
              </div>
            </AccordionContent>
          </AccordionItem>
        )}

        <AccordionItem value="sound">
          <AccordionTrigger className="text-sm text-muted-foreground">Sound</AccordionTrigger>
          <AccordionContent keepMounted>
            <div className="flex flex-col gap-3 pt-1 pl-3 pr-1 ml-0.5 border-l border-input/40">
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-sm text-muted-foreground">Oscillator</Label>
                  {isChord && (
                    <div className="flex items-center gap-1.5 shrink-0">
                      <Label className="text-xs text-muted-foreground">Linked</Label>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={s.oscLinked}
                        onClick={() => updateSynth({ oscLinked: !s.oscLinked })}
                        className={
                          'relative inline-flex h-4 w-8 shrink-0 cursor-pointer rounded-full border border-input transition-colors select-none ' +
                          (s.oscLinked ? 'bg-primary' : 'bg-muted')
                        }
                      >
                        <span
                          className={
                            'inline-block h-3 w-3 rounded-full bg-white shadow transform transition-transform ' +
                            (s.oscLinked ? 'translate-x-4' : 'translate-x-0.5')
                          }
                        />
                      </button>
                    </div>
                  )}
                </div>
                {(!isChord || s.oscLinked) && (
                  <SegmentedRow value={s.oscType} options={OSCS} onChange={(v) => updateSynth({ oscType: v })} />
                )}
                {isChord && !s.oscLinked && (
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center gap-2">
                      <span className="w-4 text-sm font-semibold text-red-500">R</span>
                      <div className="flex-1">
                        <SegmentedRow value={s.oscR} options={OSCS} onChange={(v) => updateSynth({ oscR: v })} activeClass="bg-red-600 text-white" />
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-4 text-sm font-semibold text-green-500">G</span>
                      <div className="flex-1">
                        <SegmentedRow value={s.oscG} options={OSCS} onChange={(v) => updateSynth({ oscG: v })} activeClass="bg-green-600 text-white" />
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-4 text-sm font-semibold text-blue-500">B</span>
                      <div className="flex-1">
                        <SegmentedRow value={s.oscB} options={OSCS} onChange={(v) => updateSynth({ oscB: v })} activeClass="bg-blue-600 text-white" />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <SliderRow
                label="Attack" value={s.attackMs} min={0} max={200}
                format={(v) => `${v} ms`}
                onChange={(v) => updateSynth({ attackMs: v })}
              />
              <SliderRow
                label="Hold (post-release)" value={s.holdMs} min={0} max={2000} step={10}
                format={(v) => `${v} ms`}
                onChange={(v) => updateSynth({ holdMs: v })}
              />
              <SliderRow
                label="Release" value={s.releaseMs} min={20} max={2000} step={10}
                format={(v) => `${v} ms`}
                onChange={(v) => updateSynth({ releaseMs: v })}
              />
              <Accordion defaultValue={[]}>
                <AccordionItem value="advanced">
                  <AccordionTrigger className="text-sm text-muted-foreground">Advanced</AccordionTrigger>
                  <AccordionContent keepMounted>
                    <div className="flex flex-col gap-3 pt-1 pl-3 pr-1 ml-0.5 border-l border-input/40">
                      <SliderRow
                        label="Glide" value={s.glideMs} min={0} max={200}
                        format={(v) => `${v} ms`}
                        onChange={(v) => updateSynth({ glideMs: v })}
                      />
                      <SliderRow
                        label="Cutoff min" value={s.cutoffMin} min={50} max={1000} step={10}
                        format={(v) => `${v} Hz`}
                        onChange={(v) => updateSynth({ cutoffMin: v })}
                      />
                      <SliderRow
                        label="Cutoff max" value={s.cutoffMax} min={2000} max={16000} step={100}
                        format={(v) => `${(v / 1000).toFixed(1)} kHz`}
                        onChange={(v) => updateSynth({ cutoffMax: v })}
                      />
                      <SliderRow
                        label="Gain peak" value={s.gainPeak} min={0} max={0.4} step={0.01}
                        format={(v) => v.toFixed(2)}
                        onChange={(v) => updateSynth({ gainPeak: v })}
                      />
                      <SliderRow
                        label={isChord ? 'Channel curve' : 'Brightness curve'} value={s.gainCurve} min={0.5} max={3} step={0.1}
                        format={(v) => v.toFixed(1)}
                        onChange={(v) => updateSynth({ gainCurve: v })}
                      />
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>

              <div className="flex items-center justify-between">
                <Label className="text-sm text-muted-foreground">Compressor</Label>
                <button
                  type="button"
                  role="switch"
                  aria-checked={s.compressorOn}
                  onClick={() => updateSynth({ compressorOn: !s.compressorOn })}
                  className={
                    'relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border border-input transition-colors select-none ' +
                    (s.compressorOn ? 'bg-primary' : 'bg-muted')
                  }
                >
                  <span
                    className={
                      'inline-block h-4 w-4 rounded-full bg-white shadow transform transition-transform ' +
                      (s.compressorOn ? 'translate-x-4' : 'translate-x-0.5')
                    }
                  />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <Label className="text-sm text-muted-foreground">Hold note</Label>
                <button
                  type="button"
                  role="switch"
                  aria-checked={s.sustainLatch}
                  onClick={() => updateSynth({ sustainLatch: !s.sustainLatch })}
                  className={
                    'relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border border-input transition-colors select-none ' +
                    (s.sustainLatch ? 'bg-primary' : 'bg-muted')
                  }
                >
                  <span
                    className={
                      'inline-block h-4 w-4 rounded-full bg-white shadow transform transition-transform ' +
                      (s.sustainLatch ? 'translate-x-4' : 'translate-x-0.5')
                    }
                  />
                </button>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
