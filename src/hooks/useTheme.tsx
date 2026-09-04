import { createContext, useContext, useState, useEffect, useRef, useCallback, type ReactNode } from 'react';

const ThemeContext = createContext({ isDark: false, toggle: () => {}, setDark: () => {}, restore: () => {}, reset: () => {} });

export function ThemeProvider({ children }: { children: ReactNode }) {
  /*
   * Dark is the default, not the system's preference. This is a colour tool:
   * a light surround shifts how every swatch in it reads, and the app is built
   * and judged dark. A stored choice still wins, and always did.
   */
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('color-taylor-theme');
    if (saved !== null) return saved === 'dark';
    return true;
  });

  // Saved theme before presentation override
  const savedTheme = useRef<boolean | null>(null);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
    // Only persist to localStorage when not in a presentation override
    if (savedTheme.current === null) {
      localStorage.setItem('color-taylor-theme', isDark ? 'dark' : 'light');
    }
  }, [isDark]);

  const toggle = useCallback(() => setIsDark(d => !d), []);

  // Force dark theme, remembering the previous setting
  const setDark = useCallback(() => {
    setIsDark(current => {
      if (savedTheme.current === null) savedTheme.current = current;
      return true;
    });
  }, []);

  // Restore theme to what it was before setDark was called
  const restore = useCallback(() => {
    if (savedTheme.current !== null) {
      setIsDark(savedTheme.current);
      savedTheme.current = null;
    }
  }, []);

  // Reset to the default, which is dark - "reset all settings" has to land on
  // the same theme a first visit does, or the two disagree about what default
  // means. Clears the stored value on the way so nothing outlives the reset.
  const reset = useCallback(() => {
    try { localStorage.removeItem('color-taylor-theme'); } catch { /* localStorage unavailable */ }
    savedTheme.current = null;
    setIsDark(true);
  }, []);

  return (
    <ThemeContext.Provider value={{ isDark, toggle, setDark, restore, reset }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
