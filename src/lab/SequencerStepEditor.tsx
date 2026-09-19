/**
 * The step editor: a popover body for one cell of a sequencer track. Every
 * field reads from the slot and writes a whole new slot through `onChange`, so
 * hex, RGB and HSB can't drift apart - they are three views of one value.
 *
 * The note pickers go the other way, notes -> colour, through the inverse
 * mappings in sequencer.ts, one picker shape per mode.
 */
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { hexToRgb, hsbToRgb, rgbToHex, rgbToHsb } from '../utils/colorConversions';
import { midiToName } from '../utils/synthConfig';
import {
  CHANNELS, NOTE_NAMES, channelChoices, channelNoteToHex, channelNotes, chordRootToHex, hueToFifthsRoot,
  melodyChoices, melodyNoteToHex, swatchToStep,
  type Channel, type MapConfig, type Slot,
} from './sequencer';

const CHANNEL_NAME: Record<Channel, string> = { r: 'Red', g: 'Green', b: 'Blue' };
const FIELD = 'h-9 text-base md:text-base tabular-nums';
const SELECT = 'h-9 w-full rounded-lg border border-border bg-background px-2 text-base text-foreground';

function NumField({ label, value, min, max, onCommit }: {
  label: string; value: number; min: number; max: number; onCommit: (v: number) => void;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-base text-muted-foreground">{label === 'Brightness' ? 'Br' : label.slice(0, 1)}</span>
      <Input
        aria-label={label}
        type="number"
        min={min}
        max={max}
        className={FIELD}
        value={value}
        onChange={(e) => {
          const v = Number(e.currentTarget.value);
          if (e.currentTarget.value !== '' && Number.isFinite(v)) onCommit(Math.min(max, Math.max(min, Math.round(v))));
        }}
      />
    </label>
  );
}

/** Hex keeps a draft while typing; only a complete colour is committed. Remounted (keyed) when the slot changes. */
function HexField({ hex, onCommit }: { hex: string; onCommit: (hex: string) => void }) {
  const [draft, setDraft] = useState(hex);
  return (
    <Input
      aria-label="Hex"
      className={FIELD}
      value={draft}
      spellCheck={false}
      onChange={(e) => {
        const v = e.currentTarget.value.trim();
        setDraft(v);
        const withHash = v.startsWith('#') ? v : `#${v}`;
        if (/^#[0-9a-fA-F]{6}$/.test(withHash)) onCommit(withHash.toLowerCase());
      }}
    />
  );
}

export default function SequencerStepEditor({ slot, cfg, onChange }: {
  slot: Slot;
  cfg: MapConfig;
  onChange: (slot: Slot) => void;
}) {
  const hex = slot?.hex ?? '#000000';
  const alpha = slot?.alpha ?? 100;
  const rgb = hexToRgb(hex) ?? { r: 0, g: 0, b: 0 };
  const hsb = rgbToHsb(rgb.r, rgb.g, rgb.b);
  const h = Math.round(hsb.h) % 360;
  const s = Math.round(hsb.s);
  const b = Math.round(hsb.b);
  const step = swatchToStep(slot, cfg);
  const put = (nextHex: string, nextAlpha = alpha) => onChange({ hex: nextHex, alpha: nextAlpha });
  const putRgb = (patch: Partial<typeof rgb>) => {
    const n = { ...rgb, ...patch };
    put(rgbToHex(n.r, n.g, n.b));
  };
  const putHsb = (patch: Partial<{ h: number; s: number; b: number }>) => {
    const n = { h, s, b, ...patch };
    const c = hsbToRgb(n.h, n.s, n.b);
    put(rgbToHex(c.r, c.g, c.b));
  };
  // A hue picker starting from nothing starts from a colour with a hue to move.
  const hueStart = slot ? hex : '#ff0000';

  const playing = step.rest ? (step.tie ? 'tie - holds the note before' : 'rest') : step.detail;

  return (
    <div className="flex flex-col gap-3 text-base" data-editor="">
      <div className="flex items-center gap-3">
        <div
          className="size-10 shrink-0 rounded-md border border-border"
          style={{ backgroundColor: slot ? hex : 'transparent' }}
        />
        <div className="min-w-0">
          <div className="text-base text-muted-foreground">Plays</div>
          <div className="truncate text-base" data-plays="">{playing}</div>
        </div>
      </div>

      <div className="grid grid-cols-[1fr_5rem] gap-2">
        <label className="flex flex-col gap-1">
          <span className="text-base text-muted-foreground">Hex</span>
          <HexField key={hex} hex={hex} onCommit={(v) => put(v)} />
        </label>
        <label className="flex flex-col gap-1">
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
      <p className="text-base text-muted-foreground">Alpha 0 is a tie.</p>

      <div className="grid grid-cols-3 gap-2">
        <NumField label="Red" value={rgb.r} min={0} max={255} onCommit={(v) => putRgb({ r: v })} />
        <NumField label="Green" value={rgb.g} min={0} max={255} onCommit={(v) => putRgb({ g: v })} />
        <NumField label="Blue" value={rgb.b} min={0} max={255} onCommit={(v) => putRgb({ b: v })} />
        <NumField label="Hue" value={h} min={0} max={359} onCommit={(v) => putHsb({ h: v })} />
        <NumField label="Saturation" value={s} min={0} max={100} onCommit={(v) => putHsb({ s: v })} />
        <NumField label="Brightness" value={b} min={0} max={100} onCommit={(v) => putHsb({ b: v })} />
      </div>

      {cfg.mode === 'melody' && (
        <label className="flex flex-col gap-1">
          <span className="text-base text-muted-foreground">Note</span>
          <select
            aria-label="Note"
            className={SELECT}
            value={!step.rest ? String(step.midis[0]) : ''}
            onChange={(e) => put(melodyNoteToHex(hueStart, Number(e.currentTarget.value), cfg), alpha || 100)}
          >
            <option value="" disabled>-</option>
            {melodyChoices(cfg).map((m) => <option key={m} value={m}>{midiToName(m)}</option>)}
          </select>
        </label>
      )}

      {cfg.mode === 'chords' && (
        <label className="flex flex-col gap-1">
          <span className="text-base text-muted-foreground">Chord root</span>
          <select
            aria-label="Chord root"
            className={SELECT}
            value={!step.rest ? String(hueToFifthsRoot(hsb.h, cfg.root)) : ''}
            onChange={(e) => put(chordRootToHex(hueStart, Number(e.currentTarget.value), cfg), alpha || 100)}
          >
            <option value="" disabled>-</option>
            {NOTE_NAMES.map((n, pc) => <option key={n} value={pc}>{n}</option>)}
          </select>
        </label>
      )}

      {cfg.mode === 'rgb' && (
        <div className="grid grid-cols-3 gap-2">
          {CHANNELS.map((ch) => {
            const notes = channelNotes(hex, cfg);
            return (
              <label key={ch} className="flex flex-col gap-1">
                <span className="text-base text-muted-foreground">{CHANNEL_NAME[ch]}</span>
                <select
                  aria-label={`${CHANNEL_NAME[ch]} note`}
                  className={SELECT}
                  value={notes[ch] === null ? 'rest' : String(notes[ch])}
                  onChange={(e) => {
                    const v = e.currentTarget.value;
                    put(channelNoteToHex(hex, ch, v === 'rest' ? null : Number(v), cfg), alpha || 100);
                  }}
                >
                  <option value="rest">rest</option>
                  {channelChoices(ch, cfg).map((m) => <option key={m} value={m}>{midiToName(m)}</option>)}
                </select>
              </label>
            );
          })}
        </div>
      )}

      <div className="flex gap-2">
        <Button variant="outline" className="flex-1 text-base" onClick={() => onChange(null)}>Rest</Button>
        <Button variant="outline" className="flex-1 text-base" onClick={() => put(hex, 0)}>Tie</Button>
      </div>
    </div>
  );
}
