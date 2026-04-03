import { createContext, useContext, useState, useEffect, useRef } from 'react';

const ThemeContext = createContext({ isDark: false, toggle: () => {}, setDark: () => {}, restore: () => {} });

export function ThemeProvider({ children }) {
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

  const toggle = () => setIsDark((d) => !d);

  // Force dark theme, remembering the previous setting
  const setDark = () => {
    if (savedTheme.current === null) {
      savedTheme.current = isDark;
    }
    setIsDark(true);
  };

  // Restore theme to what it was before setDark was called
  const restore = () => {
    if (savedTheme.current !== null) {
      setIsDark(savedTheme.current);
      savedTheme.current = null;
    }
  };

  return (
    <ThemeContext.Provider value={{ isDark, toggle, setDark, restore }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
