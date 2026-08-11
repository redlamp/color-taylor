import type { ReactNode } from 'react';
import { Sun, Moon } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { useTheme } from '@/hooks/useTheme';

interface Props {
  colorFx: boolean;
  onToggleColorFx: () => void;
}

interface SwitchRowProps {
  label: string;
  hint?: string;
  checked: boolean;
  onToggle: () => void;
  ariaLabel: string;
  /** Optional glyph inside the knob. The theme row uses it to show which way it is set. */
  knob?: ReactNode;
}

/**
 * Extracted rather than copied. The theme row had this markup inline, and adding
 * a second switch beside it would have meant a second copy of the same twelve
 * classes - which is the drift the shared-utility rule in CLAUDE.md is aimed at.
 */
function SwitchRow({ label, hint, checked, onToggle, ariaLabel, knob }: SwitchRowProps) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="flex flex-col">
        <Label className="text-sm text-muted-foreground">{label}</Label>
        {hint && <span className="text-2xs text-muted-foreground/80 leading-snug">{hint}</span>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={onToggle}
        aria-label={ariaLabel}
        className={
          'relative mt-0.5 inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border border-input transition-colors select-none ' +
          (checked ? 'bg-primary' : 'bg-muted')
        }
      >
        <span
          className={
            'inline-flex h-4 w-4 items-center justify-center rounded-full bg-white shadow transform transition-transform ' +
            (checked ? 'translate-x-4' : 'translate-x-0.5')
          }
        >
          {knob}
        </span>
      </button>
    </div>
  );
}

export function DisplaySettings({ colorFx, onToggleColorFx }: Props) {
  const { isDark, toggle } = useTheme();
  return (
    <div className="flex flex-col gap-3 px-1">
      <SwitchRow
        label="Theme"
        checked={isDark}
        onToggle={toggle}
        ariaLabel="Toggle theme"
        knob={
          isDark
            ? <Moon className="size-2.5 text-foreground" />
            : <Sun className="size-2.5 text-foreground" />
        }
      />
      <SwitchRow
        label="Color effects"
        hint="Panel edges and glow follow the selected color"
        checked={colorFx}
        onToggle={onToggleColorFx}
        ariaLabel="Toggle color effects"
      />
    </div>
  );
}
