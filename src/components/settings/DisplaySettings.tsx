import { Sun, Moon } from 'lucide-react';
import { SwitchRow } from '@/components/settings/SettingsSwitch';
import { useTheme } from '@/hooks/useTheme';
import { useSettings } from '@/hooks/useSettings';

interface Props {
  colorFx: boolean;
  onToggleColorFx: () => void;
  audioEnabled: boolean;
  onToggleAudio: () => void;
}

export function DisplaySettings({ colorFx, onToggleColorFx, audioEnabled, onToggleAudio }: Props) {
  const { isDark, toggle } = useTheme();
  const { settings, setFpsMeter } = useSettings();
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
      {/* Diagnostic. Same meter `?fps` in the URL shows; this one persists. */}
      <SwitchRow
        label="Frame Rate Meter"
        checked={settings.fpsMeter}
        onToggle={() => setFpsMeter(!settings.fpsMeter)}
        ariaLabel="Toggle frame rate meter"
      />
    </div>
  );
}
