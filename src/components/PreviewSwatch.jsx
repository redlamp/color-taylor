import { useCallback } from 'react';
import { toast } from 'sonner';

export default function PreviewSwatch({ hex }) {
  const handleClick = useCallback(() => {
    navigator.clipboard.writeText(hex.toUpperCase()).then(() => {
      toast('Copied!', { duration: 2000 });
    });
  }, [hex]);

  return (
    <div
      id="preview-swatch"
      role="button"
      aria-label={`Color swatch ${hex.toUpperCase()}. Click to copy.`}
      className="shrink-0 self-stretch cursor-pointer select-none rounded-md"
      style={{ width: 50, backgroundColor: hex, boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.1)' }}
      onClick={handleClick}
    />
  );
}
