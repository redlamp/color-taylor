/**
 * The one switch the Settings panel uses.
 *
 * There were five copies of this markup - one in DisplaySettings and four in
 * AudioSettings - and they had already drifted: the fix that stopped the knob
 * vanishing in dark mode (bg-white on a pale bg-primary track) only ever
 * landed on the Display copy, so Color Synth, Compressor, Hold note and Linked
 * kept the bug. The Audio copies also had no accessible name at all: a
 * role="switch" with no aria-label and no htmlFor'd label reads as an unnamed
 * control. Both are fixed here once.
 */
import { useId, type ReactNode } from 'react';
import { Label } from '@/components/ui/label';

type SwitchSize = 'sm' | 'md';

const TRACK: Record<SwitchSize, string> = {
  md: 'h-5 w-9',
  sm: 'h-4 w-8',
};

const KNOB: Record<SwitchSize, string> = {
  md: 'h-4 w-4',
  sm: 'h-3 w-3',
};

interface SettingsSwitchProps {
  checked: boolean;
  onToggle: () => void;
  /** Required: these are bare buttons, so nothing else names them. */
  ariaLabel: string;
  /** Optional glyph inside the knob. The theme row uses it to show which way it is set. */
  knob?: ReactNode;
  size?: SwitchSize;
  /** Set by SwitchRow so its label can point at this. */
  id?: string;
}

export function SettingsSwitch({ checked, onToggle, ariaLabel, knob, size = 'md', id }: SettingsSwitchProps) {
  return (
    <button
      type="button"
      id={id}
      role="switch"
      aria-checked={checked}
      onClick={onToggle}
      aria-label={ariaLabel}
      className={
        'relative inline-flex shrink-0 cursor-pointer rounded-full border border-input transition-colors select-none ' +
        TRACK[size] + ' ' +
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
          'inline-flex items-center justify-center rounded-full shadow transform transition-transform ' +
          KNOB[size] + ' ' +
          (checked
            ? 'bg-primary-foreground text-primary translate-x-4'
            : 'bg-foreground text-background translate-x-0.5')
        }
      >
        {knob}
      </span>
    </button>
  );
}

interface SwitchRowProps extends SettingsSwitchProps {
  label: string;
}

/** Label on the left, switch on the right - the panel's standard row. */
export function SwitchRow({ label, ...props }: SwitchRowProps) {
  /*
   * The label drives the switch, so the words are a hit target too - a 36px
   * track at the far end of the row is a small thing to ask someone to aim at,
   * and on a phone it is the only thing in the row worth aiming at.
   *
   * `htmlFor` rather than an onClick, because `button` is a labelable element:
   * the browser forwards the activation itself, which brings the focus and the
   * keyboard behaviour with it. `aria-label` still wins for the accessible
   * name, so the switch is announced as what it does rather than as the row it
   * sits in.
   */
  const id = useId();
  return (
    // No mt-0.5 on the switch - that nudged it down to line up with the first
    // line of a two-line row. Every row is a single line now, so the row
    // centres them instead.
    <div className="flex items-center justify-between gap-3">
      <Label htmlFor={id} className="cursor-pointer select-none text-base text-muted-foreground">
        {label}
      </Label>
      <SettingsSwitch id={id} {...props} />
    </div>
  );
}
