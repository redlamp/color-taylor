import { Sun, Moon } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { useTheme } from '@/hooks/useTheme';
import { useSettings } from '@/hooks/useSettings';

export function DisplaySettings() {
  const { isDark, toggle } = useTheme();
  const { settings, updateHaptics } = useSettings();
  const hapticsOn = settings.haptics.enabled;
  return (
    <div className="flex flex-col gap-3 px-1">
      <div className="flex items-center justify-between">
        <Label className="text-sm text-muted-foreground">Theme</Label>
        <button
          type="button"
          role="switch"
          aria-checked={isDark}
          onClick={toggle}
          aria-label="Toggle theme"
          className={
            'relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border border-input transition-colors select-none ' +
            (isDark ? 'bg-primary' : 'bg-muted')
          }
        >
          <span
            className={
              'inline-flex h-4 w-4 items-center justify-center rounded-full bg-white shadow transform transition-transform ' +
              (isDark ? 'translate-x-4' : 'translate-x-0.5')
            }
          >
            {isDark ? <Moon className="size-2.5 text-foreground" /> : <Sun className="size-2.5 text-foreground" />}
          </span>
        </button>
      </div>
      <div className="flex items-center justify-between">
        <Label className="text-sm text-muted-foreground">Haptics</Label>
        <button
          type="button"
          role="switch"
          aria-checked={hapticsOn}
          onClick={() => updateHaptics({ enabled: !hapticsOn })}
          aria-label="Toggle haptics"
          className={
            'relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border border-input transition-colors select-none ' +
            (hapticsOn ? 'bg-primary' : 'bg-muted')
          }
        >
          <span
            className={
              'inline-block h-4 w-4 rounded-full bg-white shadow transform transition-transform ' +
              (hapticsOn ? 'translate-x-4' : 'translate-x-0.5')
            }
          />
        </button>
      </div>
    </div>
  );
}
