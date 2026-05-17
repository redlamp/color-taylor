import { useSettings } from '@/hooks/useSettings';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { toneController, type Scale, type OscType } from '@/utils/colorSynth';

const SCALES: { value: Scale; label: string }[] = [
  { value: 'pentatonic', label: 'Pentatonic' },
  { value: 'major', label: 'Major' },
  { value: 'chromatic', label: 'Chromatic' },
  { value: 'continuous', label: 'Continuous' },
];

const OSCS: { value: OscType; label: string }[] = [
  { value: 'sine', label: 'Sine' },
  { value: 'triangle', label: 'Triangle' },
  { value: 'sawtooth', label: 'Saw' },
  { value: 'square', label: 'Square' },
];

function SegmentedRow<T extends string>({
  value, options, onChange,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <div className="grid grid-flow-col auto-cols-fr gap-1 rounded-md border border-input p-0.5">
      {options.map(o => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={
            'px-2 py-1 text-xs rounded-sm cursor-pointer select-none transition ' +
            (value === o.value
              ? 'bg-primary text-primary-foreground'
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
        <Label className="text-xs text-muted-foreground">{label}</Label>
        <span className="text-xs tabular-nums text-foreground">{format ? format(value) : value}</span>
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

export function AudioSettings() {
  const { settings, updateSynth, reset } = useSettings();
  const s = settings.synth;

  const preview = () => {
    toneController.start({ h: 200, s: 60, b: 80 });
    setTimeout(() => toneController.update({ h: 320, s: 80, b: 90 }), 200);
    setTimeout(() => toneController.update({ h: 60, s: 100, b: 100 }), 500);
    setTimeout(() => toneController.stop(120), 800);
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">Tap colors → tones. Drag to sweep.</span>
        <Button variant="outline" size="xs" onClick={preview}>Preview</Button>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label className="text-xs text-muted-foreground">Scale</Label>
        <SegmentedRow value={s.scale} options={SCALES} onChange={(v) => updateSynth({ scale: v })} />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label className="text-xs text-muted-foreground">Oscillator</Label>
        <SegmentedRow value={s.oscType} options={OSCS} onChange={(v) => updateSynth({ oscType: v })} />
      </div>

      <SliderRow
        label="Base octave" value={s.baseOctave} min={1} max={6}
        onChange={(v) => updateSynth({ baseOctave: v })}
      />
      <SliderRow
        label="Octave range" value={s.octaveRange} min={1} max={4}
        onChange={(v) => updateSynth({ octaveRange: v })}
      />
      <SliderRow
        label="Attack" value={s.attackMs} min={0} max={200}
        format={(v) => `${v} ms`}
        onChange={(v) => updateSynth({ attackMs: v })}
      />
      <SliderRow
        label="Release" value={s.releaseMs} min={20} max={500}
        format={(v) => `${v} ms`}
        onChange={(v) => updateSynth({ releaseMs: v })}
      />
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
        label="Brightness curve" value={s.gainCurve} min={0.5} max={3} step={0.1}
        format={(v) => v.toFixed(1)}
        onChange={(v) => updateSynth({ gainCurve: v })}
      />

      <Button variant="ghost" size="sm" onClick={reset} className="self-end">
        Reset to defaults
      </Button>
    </div>
  );
}
