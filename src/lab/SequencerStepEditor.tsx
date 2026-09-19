/**
 * The step popover: quick edits to one cell, notes first. The colour itself is
 * edited in the side column (the app's hexagon and Color Editor), so this is
 * only what is quicker at the cell - pick a note off the drawn picker, hold
 * voices, silence the step or clear the slot.
 *
 * Alpha is not typed here: it is one of nine notches (sequencer.ts,
 * alphaToStepKind) and the Hold toggles and Silence set it, shown read-only.
 * A hold copies the previous step's value into each held channel, so the
 * colour says what the held voice carries on playing.
 *
 * The picker goes notes -> colour through the inverse mappings in
 * sequencer.ts; see SequencerNotePicker.
 */
import { Button } from '@/components/ui/button';
import {
  ALL_HOLD, CHANNELS, HOLD_BIT, SILENCE_ALPHA, alphaToStepKind, copyHeld, instrumentName, maskToAlpha, swatchToStep,
  type Channel, type MapConfig, type Slot,
} from './sequencer';
import { hexToRgb } from '../utils/colorConversions';
import SequencerNotePicker from './SequencerNotePicker';

export default function SequencerStepEditor({ slot, prevHex, cfg, onChange }: {
  slot: Slot;
  /** The step before's colour, which a hold copies into its held channels; null with none. */
  prevHex: string | null;
  cfg: MapConfig;
  onChange: (slot: Slot) => void;
}) {
  const hex = slot?.hex ?? '#000000';
  const alpha = slot?.alpha ?? 100;
  const kind = alphaToStepKind(alpha);
  const mask = kind.silence ? 0 : kind.mask;
  const step = swatchToStep(slot, cfg);
  // A pick on an empty slot starts from a colour with a hue to move.
  const pickFrom = slot ? hex : '#ff0000';
  const sounding = !!slot && !(step.rest && !step.tie);
  const playing = step.rest ? (step.tie ? 'tie - holds the note before' : step.label) : step.detail;

  /** A new hold mask: the notch, with the newly held channels copied from the step before. */
  const setMask = (next: number) => onChange({ hex: copyHeld(hex, next & ~mask, prevHex), alpha: maskToAlpha(next) });

  /** A note picked: a channel it changed no longer holds (it strikes the new note); the hue modes strike. */
  const pick = (next: string) => {
    if (cfg.mode !== 'rgb') { onChange({ hex: next, alpha: 100 }); return; }
    const a = hexToRgb(hex);
    const b = hexToRgb(next);
    const changed = CHANNELS.filter((ch) => !a || !b || a[ch] !== b[ch]);
    onChange({ hex: next, alpha: maskToAlpha(changed.reduce((m, ch) => m & ~HOLD_BIT[ch], mask)) });
  };

  const holds: { label: string; bits: number; ch?: Channel }[] = cfg.mode === 'rgb'
    ? CHANNELS.map((ch) => ({ label: `Hold ${instrumentName(ch, cfg)}`, bits: HOLD_BIT[ch], ch }))
    : [{ label: 'Hold', bits: ALL_HOLD }];

  return (
    <div className="flex flex-col gap-3 text-base" data-editor="">
      <div className="flex items-center gap-3">
        <div
          className="size-10 shrink-0 rounded-md border border-border"
          style={{ backgroundColor: slot ? hex : 'transparent' }}
        />
        <div className="min-w-0 flex-1">
          <div className="text-base text-muted-foreground">Plays</div>
          <div className="truncate text-base" data-plays="">{playing}</div>
        </div>
        <div className="flex w-20 flex-col gap-1">
          <span className="text-base text-muted-foreground">Alpha</span>
          <output aria-label="Alpha" className="h-9 text-base leading-9 tabular-nums" data-alpha="">{slot ? alpha : '-'}</output>
        </div>
      </div>

      <SequencerNotePicker hex={pickFrom} sounding={sounding} cfg={cfg} onPick={pick} />

      <div className="flex flex-wrap gap-2" role="group" aria-label="Hold">
        {holds.map(({ label, bits }) => {
          const on = !kind.silence && (mask & bits) === bits;
          return (
            <Button key={label} variant={on ? 'default' : 'outline'} className="flex-1 text-base" aria-pressed={on}
              title={cfg.mode === 'rgb' ? 'This voice carries on its previous note, whatever its channel reads' : 'The note before carries on - a tie'}
              onClick={() => setMask(on ? mask & ~bits : mask | bits)}>
              {label}
            </Button>
          );
        })}
      </div>
      <div className="flex gap-2">
        <Button variant={kind.silence && slot ? 'default' : 'outline'} className="flex-1 text-base" aria-pressed={kind.silence && !!slot}
          title="Every voice stops, held ones too; the step keeps its colour"
          onClick={() => onChange({ hex, alpha: kind.silence ? 100 : SILENCE_ALPHA })}>
          Silence
        </Button>
        <Button variant="outline" className="flex-1 text-base" disabled={!slot} onClick={() => onChange(null)}>Clear slot</Button>
      </div>
      <p className="text-base text-muted-foreground">
        {cfg.mode === 'rgb'
          ? 'A held voice carries on its previous note; the others strike. Silence stops every voice.'
          : 'Hold carries the note before on - a tie. Silence stops it.'}
        {' '}The hexagon beside the tracks edits this cell&apos;s colour.
      </p>
    </div>
  );
}
