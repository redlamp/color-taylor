import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { DEFAULT_SYNTH_CONFIG, type SynthConfig } from '@/utils/synthConfig';
import { toneController, setAudioEnabled } from '@/utils/toneControllerLazy';

export interface AppSettings {
  /**
   * Whether the audio feature exists for this user at all: the color synth, the
   * music-note and volume controls in the header, the Audio settings section,
   * and the interface sounds on the swatch grids.
   *
   * Off by default, deliberately - sound on a first visit is a surprise rather
   * than a feature. Nothing audio-related loads while it is off.
   */
  audioEnabled: boolean;
  synth: SynthConfig;
  /**
   * The frame-rate meter, top-left. A field here rather than its own
   * localStorage key so "Reset all settings" clears it for free - see the
   * table in CLAUDE.md for why every new key otherwise needs an owner. `?fps`
   * in the URL turns it on too, without touching this.
   */
  fpsMeter: boolean;
  /**
   * Keep the menu open while the app is used, and take its scrim away.
   *
   * The menu is modal by default: a scrim, a focus trap, and a click outside
   * closes it. That is right for a settings sheet you visit and leave, and
   * wrong for the synth, which you can only judge by hearing it against
   * colours you are changing - the panel closes on the first thing you touch.
   *
   * A Display setting: what it changes is how the menu behaves against the
   * app, and every row above it in that section is something you judge by
   * looking at the app while you toggle it.
   */
  keepMenuOpen: boolean;
}

const STORAGE_KEY = 'color-taylor-settings';

const DEFAULTS: AppSettings = {
  audioEnabled: false,
  synth: { ...DEFAULT_SYNTH_CONFIG },
  fpsMeter: false,
  keepMenuOpen: false,
};

function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULTS;
    const parsed = JSON.parse(raw);
    return {
      // Strict true, so anything else stored - or nothing - reads as off.
      audioEnabled: parsed?.audioEnabled === true,
      synth: { ...DEFAULTS.synth, ...(parsed?.synth ?? {}) },
      fpsMeter: parsed?.fpsMeter === true,
      keepMenuOpen: parsed?.keepMenuOpen === true,
    };
  } catch {
    return DEFAULTS;
  }
}

interface SettingsContextValue {
  settings: AppSettings;
  updateSynth: (patch: Partial<SynthConfig>) => void;
  setAudioEnabled: (next: boolean) => void;
  setFpsMeter: (next: boolean) => void;
  setKeepMenuOpen: (next: boolean) => void;
  reset: () => void;
}

const SettingsContext = createContext<SettingsContextValue>({
  settings: DEFAULTS,
  updateSynth: () => {},
  setAudioEnabled: () => {},
  setFpsMeter: () => {},
  setKeepMenuOpen: () => {},
  reset: () => {},
});

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(() => loadSettings());

  // The gate reaches the engine wrapper before the config does, so a disabled
  // feature never gets as far as the dynamic import.
  useEffect(() => {
    setAudioEnabled(settings.audioEnabled);
  }, [settings.audioEnabled]);

  useEffect(() => {
    toneController.setConfig(settings.synth);
  }, [settings.synth]);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(settings)); } catch { /* localStorage unavailable */ }
  }, [settings]);

  const updateSynth = useCallback((patch: Partial<SynthConfig>) => {
    setSettings(s => ({ ...s, synth: { ...s.synth, ...patch } }));
  }, []);

  const setAudio = useCallback((next: boolean) => {
    setSettings(s => ({
      ...s,
      audioEnabled: next,
      // Switching the feature on turns the synth on with it. Enabling audio and
      // then finding it still silent until you also press the music note is a
      // dead end - the switch should hand over something that works. Turning the
      // feature off leaves synthEnabled alone; it is gated anyway, so the value
      // survives for the next time.
      synth: next ? { ...s.synth, synthEnabled: true } : s.synth,
    }));
  }, []);

  const setFpsMeter = useCallback((next: boolean) => {
    setSettings(s => ({ ...s, fpsMeter: next }));
  }, []);

  const setKeepMenuOpen = useCallback((next: boolean) => {
    setSettings(s => ({ ...s, keepMenuOpen: next }));
  }, []);

  const reset = useCallback(() => {
    setSettings(DEFAULTS);
    try { localStorage.removeItem(STORAGE_KEY); } catch { /* localStorage unavailable */ }
  }, []);

  return (
    <SettingsContext.Provider value={{ settings, updateSynth, setAudioEnabled: setAudio, setFpsMeter, setKeepMenuOpen, reset }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  return useContext(SettingsContext);
}
