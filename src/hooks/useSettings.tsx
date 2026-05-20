import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { DEFAULT_SYNTH_CONFIG, type SynthConfig } from '@/utils/synthConfig';
import { toneController } from '@/utils/toneControllerLazy';

export interface AppSettings {
  synth: SynthConfig;
}

const STORAGE_KEY = 'color-taylor-settings';

const DEFAULTS: AppSettings = {
  synth: { ...DEFAULT_SYNTH_CONFIG },
};

function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULTS;
    const parsed = JSON.parse(raw);
    return {
      synth: { ...DEFAULTS.synth, ...(parsed?.synth ?? {}) },
    };
  } catch {
    return DEFAULTS;
  }
}

interface SettingsContextValue {
  settings: AppSettings;
  updateSynth: (patch: Partial<SynthConfig>) => void;
  reset: () => void;
}

const SettingsContext = createContext<SettingsContextValue>({
  settings: DEFAULTS,
  updateSynth: () => {},
  reset: () => {},
});

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(() => loadSettings());

  useEffect(() => {
    toneController.setConfig(settings.synth);
  }, [settings.synth]);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(settings)); } catch { /* localStorage unavailable */ }
  }, [settings]);

  const updateSynth = useCallback((patch: Partial<SynthConfig>) => {
    setSettings(s => ({ ...s, synth: { ...s.synth, ...patch } }));
  }, []);

  const reset = useCallback(() => {
    setSettings(DEFAULTS);
    try { localStorage.removeItem(STORAGE_KEY); } catch { /* localStorage unavailable */ }
  }, []);

  return (
    <SettingsContext.Provider value={{ settings, updateSynth, reset }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  return useContext(SettingsContext);
}
