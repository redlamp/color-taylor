import { useState, useEffect, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { hexToRgb } from '../utils/colorConversions';

export default function HexInput({ hex, onChange }) {
  const [text, setText] = useState(hex.toUpperCase());
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (!focused) {
      setText(hex.toUpperCase());
    }
  }, [hex, focused]);

  const isValid = useMemo(() => {
    if (!focused) return true;
    return hexToRgb(text) !== null;
  }, [text, focused]);

  const handleChange = (e) => {
    const raw = e.target.value;
    setText(raw);
    const parsed = hexToRgb(raw);
    if (parsed) onChange(parsed);
  };

  const handleBlur = () => {
    setFocused(false);
    setText(hex.toUpperCase());
  };

  return (
    <Input
      type="text"
      aria-label="Hex color value"
      value={text}
      onChange={handleChange}
      onFocus={(e) => { setFocused(true); e.target.select(); }}
      onBlur={handleBlur}
      className={`font-mono text-sm ${!isValid ? 'border-red-500 focus-visible:border-red-500 focus-visible:ring-red-500/50' : ''}`}
    />
  );
}
