import { useState, type ChangeEvent } from 'react';
import { Input } from '@/components/ui/input';
import { hexToRgb, type RGB } from '../utils/colorConversions';

/**
 * The hex readout, editable.
 *
 * What it shows is derived: the colour's hex until the field is focused, and
 * the draft being typed while it is. The draft is the only state, and it is
 * null whenever the field is not being edited, so a colour changing under the
 * field needs no syncing at all.
 *
 * It used to hold the text in state and copy the hex into it from an effect
 * on every change. During a drag that is one state update scheduled from
 * inside the effect flush per frame, and fifty frames in a row is where React
 * warns "Maximum update depth exceeded" - which the demo's tip lap did, four
 * times a run.
 */
export default function HexInput({ hex, onChange }: { hex: string; onChange: (rgb: RGB) => void }) {
  const [draft, setDraft] = useState<string | null>(null);
  const editing = draft !== null;
  const text = editing ? draft : hex.toUpperCase();
  const isValid = !editing || hexToRgb(draft) !== null;

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setDraft(raw);
    const parsed = hexToRgb(raw);
    if (parsed) onChange(parsed);
  };

  return (
    <Input
      type="text"
      aria-label="Hex color value"
      value={text}
      onChange={handleChange}
      onFocus={(e) => { setDraft(hex.toUpperCase()); e.target.select(); }}
      onBlur={() => setDraft(null)}
      className={`font-mono text-sm ${!isValid ? 'border-red-500 focus-visible:border-red-500 focus-visible:ring-red-500/50' : ''}`}
    />
  );
}
