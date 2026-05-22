import { createContext, useContext, useState, useEffect, useRef, useCallback, type ReactNode } from 'react';

const ThemeContext = createContext({ isDark: false, toggle: () => {}, setDark: () => {}, restore: () => {}, reset: () => {} });

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('color-taylor-theme');
    if (saved !== null) return saved === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  // Saved theme before presentation override
  const savedTheme = useRef(null);

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

  // Reset theme to system preference, clear stored value
  const reset = useCallback(() => {
    try { localStorage.removeItem('color-taylor-theme'); } catch { /* localStorage unavailable */ }
    savedTheme.current = null;
    setIsDark(window.matchMedia('(prefers-color-scheme: dark)').matches);
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
