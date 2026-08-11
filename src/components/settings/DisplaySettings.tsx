import type { ReactNode } from 'react';
import { Sun, Moon } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { useTheme } from '@/hooks/useTheme';

interface Props {
  colorFx: boolean;
  onToggleColorFx: () => void;
  audioEnabled: boolean;
  onToggleAudio: () => void;
}

interface SwitchRowProps {
  label: string;
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
function SwitchRow({ label, checked, onToggle, ariaLabel, knob }: SwitchRowProps) {
  return (
    <div className="flex items-center justify-between gap-3">
      <Label className="text-sm text-muted-foreground">{label}</Label>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={onToggle}
        aria-label={ariaLabel}
        className={
          // No mt-0.5 - that nudged the switch down to line up with the first
          // line of a two-line row. Both rows are a single line now, so the row
          // centres them instead.
          'relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border border-input transition-colors select-none ' +
          (checked ? 'bg-primary' : 'bg-muted')
        }
      >
        {/*
          The knob takes whichever token pairs with the track behind it, and sets
          the text colour so the glyph inside inherits its opposite.

          It used to be bg-white in both themes with a text-foreground glyph, so
          in dark mode a near-white Moon sat on a near-white knob and vanished -
          and that knob was itself near-white against a near-white bg-primary
          track. One fixed colour cannot work here, because bg-primary inverts
          between themes: the track is 0.95 in light-unchecked and 0.922 in
          dark-checked, both pale, but 0.205 in light-checked and 0.34 in
          dark-unchecked. Pairing by token covers all four, since
          primary/primary-foreground and foreground/background are contrasting
          by definition.
        */}
        <span
          className={
            'inline-flex h-4 w-4 items-center justify-center rounded-full shadow transform transition-transform ' +
            (checked
              ? 'bg-primary-foreground text-primary translate-x-4'
              : 'bg-foreground text-background translate-x-0.5')
          }
        >
          {knob}
        </span>
      </button>
    </div>
  );
}

export function DisplaySettings({ colorFx, onToggleColorFx, audioEnabled, onToggleAudio }: Props) {
  const { isDark, toggle } = useTheme();
  return (
    <div className="flex flex-col gap-3 px-1">
      <SwitchRow
        label="Theme"
        checked={isDark}
        onToggle={toggle}
        ariaLabel="Toggle theme"
        // No colour on the glyph: it inherits currentColor from the knob, which
        // is the only thing that knows what it is sitting on.
        knob={isDark ? <Moon className="size-2.5" /> : <Sun className="size-2.5" />}
      />
      <SwitchRow
        label="Border Color Effects"
        checked={colorFx}
        onToggle={onToggleColorFx}
        ariaLabel="Toggle border color effects"
      />
      {/* The switch that brings the whole audio feature into existence: the synth
          and volume controls in the header, the Audio settings section, and the
          interface sounds. It lives here rather than under Audio because Audio
          does not exist until this is on. */}
      <SwitchRow
        label="Audio"
        checked={audioEnabled}
        onToggle={onToggleAudio}
        ariaLabel="Toggle audio features"
      />
    </div>
  );
}
