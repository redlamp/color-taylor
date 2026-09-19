/**
 * The step popover: quick edits to one cell, notes first. The colour itself is
 * edited in the side column (the app's hexagon and Color Editor), so this is
 * only what is quicker at the cell - pick a note off the drawn picker, set
 * alpha, make it a rest, a tie or a hold.
 *
 * The picker goes notes -> colour through the inverse mappings in
 * sequencer.ts; see SequencerNotePicker.
 */
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { HOLD_ALPHA, swatchToStep, type MapConfig, type Slot } from './sequencer';
import SequencerNotePicker from './SequencerNotePicker';

const FIELD = 'h-9 text-base md:text-base tabular-nums';

export default function SequencerStepEditor({ slot, cfg, onChange }: {
  slot: Slot;
  cfg: MapConfig;
  onChange: (slot: Slot) => void;
}) {
  const hex = slot?.hex ?? '#000000';
  const alpha = slot?.alpha ?? 100;
  const step = swatchToStep(slot, cfg);
  const put = (nextHex: string, nextAlpha = alpha) => onChange({ hex: nextHex, alpha: nextAlpha });
  // A pick on an empty slot starts from a colour with a hue to move.
  const pickFrom = slot ? hex : '#ff0000';
  const sounding = !!slot && !(step.rest && !step.tie);
  const playing = step.rest ? (step.tie ? 'tie - holds the note before' : 'rest') : step.detail;

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
        <label className="flex w-20 flex-col gap-1">
          <span className="text-base text-muted-foreground">Alpha</span>
          <Input
            aria-label="Alpha"
            type="number"
            min={0}
            max={100}
            className={FIELD}
            value={alpha}
            onChange={(e) => {
              const v = Number(e.currentTarget.value);
              if (e.currentTarget.value !== '' && Number.isFinite(v)) put(hex, Math.min(100, Math.max(0, Math.round(v))));
            }}
          />
        </label>
      </div>

      <SequencerNotePicker hex={pickFrom} sounding={sounding} cfg={cfg} onPick={(next) => put(next, alpha || 100)} />

      <div className="flex gap-2">
        <Button variant="outline" className="flex-1 text-base" onClick={() => onChange(null)}>Rest</Button>
        <Button variant="outline" className="flex-1 text-base" onClick={() => put(hex, 0)}>Tie</Button>
        <Button variant="outline" className="flex-1 text-base" disabled={!slot} onClick={() => put(hex, HOLD_ALPHA)}
          title="Voices whose note is unchanged carry on; only the ones that changed strike">
          Hold
        </Button>
      </div>
      <p className="text-base text-muted-foreground">
        Alpha 0 is a tie, holding every voice. Alpha {HOLD_ALPHA} is a hold: voices whose note is unchanged carry on and
        only the changed ones strike. The hexagon beside the tracks edits this cell&apos;s colour.
      </p>
    </div>
  );
}
