import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { DEFAULT_SYNTH_CONFIG, type SynthConfig, toneController } from '@/utils/colorSynth';
import { setHapticsEnabled } from '@/utils/haptics';

export interface HapticsConfig {
  enabled: boolean;
}

export interface AppSettings {
  synth: SynthConfig;
  haptics: HapticsConfig;
}

const STORAGE_KEY = 'color-taylor-settings';

const DEFAULT_HAPTICS: HapticsConfig = { enabled: true };

const DEFAULTS: AppSettings = {
  synth: { ...DEFAULT_SYNTH_CONFIG },
  haptics: { ...DEFAULT_HAPTICS },
};

function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULTS;
    const parsed = JSON.parse(raw);
    return {
      synth: { ...DEFAULTS.synth, ...(parsed?.synth ?? {}) },
      haptics: { ...DEFAULTS.haptics, ...(parsed?.haptics ?? {}) },
    };
  } catch {
    return DEFAULTS;
  }
}

interface SettingsContextValue {
  settings: AppSettings;
  updateSynth: (patch: Partial<SynthConfig>) => void;
  updateHaptics: (patch: Partial<HapticsConfig>) => void;
  reset: () => void;
}

const SettingsContext = createContext<SettingsContextValue>({
  settings: DEFAULTS,
  updateSynth: () => {},
  updateHaptics: () => {},
  reset: () => {},
});

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(() => loadSettings());

  useEffect(() => {
    toneController.setConfig(settings.synth);
  }, [settings.synth]);

  useEffect(() => {
    setHapticsEnabled(settings.haptics.enabled);
  }, [settings.haptics.enabled]);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(settings)); } catch {}
  }, [settings]);

  const updateSynth = useCallback((patch: Partial<SynthConfig>) => {
    setSettings(s => ({ ...s, synth: { ...s.synth, ...patch } }));
  }, []);

  const updateHaptics = useCallback((patch: Partial<HapticsConfig>) => {
    setSettings(s => ({ ...s, haptics: { ...s.haptics, ...patch } }));
  }, []);

  const reset = useCallback(() => {
    setSettings(DEFAULTS);
    try { localStorage.removeItem(STORAGE_KEY); } catch {}
  }, []);

  return (
    <SettingsContext.Provider value={{ settings, updateSynth, updateHaptics, reset }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  return useContext(SettingsContext);
}
