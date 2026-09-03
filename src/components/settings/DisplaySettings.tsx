import { Sun, Moon } from 'lucide-react';
import { SwitchRow } from '@/components/settings/SettingsSwitch';
import { useTheme } from '@/hooks/useTheme';
import { useSettings } from '@/hooks/useSettings';

interface Props {
  highlights: boolean;
  onToggleHighlights: () => void;
  colorFx: boolean;
  onToggleColorFx: () => void;
  audioEnabled: boolean;
  onToggleAudio: () => void;
}

export function DisplaySettings({
  highlights, onToggleHighlights, colorFx, onToggleColorFx, audioEnabled, onToggleAudio,
}: Props) {
  const { isDark, toggle } = useTheme();
  const { settings, setFpsMeter } = useSettings();
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
      {/* Diagnostic. Same meter `?fps` in the URL shows; this one persists. */}
      <SwitchRow
        label="Frame Rate Meter"
        checked={settings.fpsMeter}
        onToggle={() => setFpsMeter(!settings.fpsMeter)}
        ariaLabel="Toggle frame rate meter"
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
