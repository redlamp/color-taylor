import { useState } from 'react';
import { Sun, Moon } from 'lucide-react';
import { SwitchRow } from '@/components/settings/SettingsSwitch';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useTheme } from '@/hooks/useTheme';
import { useSettings, PLAY_SPEED_MIN, PLAY_SPEED_MAX } from '@/hooks/useSettings';

/**
 * Seconds per swatch when Saved or Recent is played. A slider for the feel
 * of it and a field for the number, both on the one setting; the field keeps
 * a draft while it is being typed in, so a half-typed "1." is not clamped
 * out from under the cursor, and commits on blur or Enter.
 */
function PlaySpeedRow({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [draft, setDraft] = useState<string | null>(null);
  const commit = () => {
    if (draft === null) return;
    const n = Number(draft);
    if (Number.isFinite(n)) onChange(n);
    setDraft(null);
  };
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between gap-3">
        <Label htmlFor="play-speed" className="text-base text-muted-foreground">Play Speed</Label>
        <div className="flex items-center gap-1.5">
          <Input
            id="play-speed"
            type="text"
            inputMode="decimal"
            aria-label="Play speed, seconds per swatch"
            className="h-8 w-16 text-right font-mono tabular-nums"
            value={draft ?? String(value)}
            onChange={(e) => setDraft(e.target.value)}
            onFocus={(e) => { setDraft(String(value)); e.target.select(); }}
            onBlur={commit}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); (e.target as HTMLInputElement).blur(); } }}
          />
          <span className="text-base text-muted-foreground">s</span>
        </div>
      </div>
      <Slider
        aria-label="Play speed"
        value={[value]}
        min={PLAY_SPEED_MIN}
        max={PLAY_SPEED_MAX}
        step={0.1}
        onValueChange={(v) => {
          const next = Array.isArray(v) ? v[0] : v;
          if (typeof next === 'number') onChange(Math.round(next * 10) / 10);
        }}
      />
    </div>
  );
}

interface Props {
  highlights: boolean;
  onToggleHighlights: () => void;
  colorFx: boolean;
  onToggleColorFx: () => void;
}

export function DisplaySettings({
  highlights, onToggleHighlights, colorFx, onToggleColorFx,
}: Props) {
  const { isDark, toggle } = useTheme();
  const { settings, setFpsMeter, setKeepMenuOpen, setPlaySpeed } = useSettings();
  return (
    <div className="flex flex-col gap-3 px-1">
      {/* Checked is *light*, so the default sits on the left like every other
          row here: a switch to the right should mean "turned something on",
          and dark is where this app starts. The knob still shows which way it
          is set, so nothing depends on reading the direction. */}
      <SwitchRow
        label="Theme"
        checked={!isDark}
        onToggle={toggle}
        ariaLabel="Toggle theme"
        // No colour on the glyph: it inherits currentColor from the knob, which
        // is the only thing that knows what it is sitting on.
        knob={isDark ? <Moon className="size-2.5" /> : <Sun className="size-2.5" />}
      />
      {/* Above the border effects, and before them in the list for the same
          reason they sit near the top: both are the tool reacting to what you
          are doing rather than doing what you asked. This one is the louder of
          the two, and the one someone working rather than learning turns off. */}
      <SwitchRow
        label="Interaction Highlights"
        checked={highlights}
        onToggle={onToggleHighlights}
        ariaLabel="Toggle interaction highlights"
      />
      <SwitchRow
        label="Border Color Effects"
        checked={colorFx}
        onToggle={onToggleColorFx}
        ariaLabel="Toggle border color effects"
      />
      {/* How fast the Swatches panel's play buttons step through a list. */}
      <PlaySpeedRow value={settings.playSpeed} onChange={setPlaySpeed} />
      {/* Diagnostic. Same meter `?fps` in the URL shows; this one persists. */}
      <SwitchRow
        label="Frame Rate Meter"
        checked={settings.fpsMeter}
        onToggle={() => setFpsMeter(!settings.fpsMeter)}
        ariaLabel="Toggle frame rate meter"
      />
      {/* Last, because it is about the menu rather than about the app - and
          because what it is for is everything above it: the menu is modal, so
          judging a setting against the tool means the menu closing on the first
          thing you touch. On it, the scrim goes, the app takes the pointer, and
          the stage narrows so the rail has somewhere to be. */}
      <SwitchRow
        label="Keep Menu Open"
        checked={settings.keepMenuOpen}
        onToggle={() => setKeepMenuOpen(!settings.keepMenuOpen)}
        ariaLabel="Keep the menu open while using the app"
      />
    </div>
  );
}
