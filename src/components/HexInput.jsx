import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { hexToRgb } from '../utils/colorConversions';

export default function HexInput({ hex, onChange }) {
  const [text, setText] = useState(hex.toUpperCase());
  const [focused, setFocused] = useState(false);

  // Sync from parent when not focused
  useEffect(() => {
    if (!focused) {
      setText(hex.toUpperCase());
    }
  }, [hex, focused]);

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
      value={text}
      onChange={handleChange}
      onFocus={() => setFocused(true)}
      onBlur={handleBlur}
      className="font-mono text-sm"
    />
  );
}
