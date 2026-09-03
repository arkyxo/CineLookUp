import { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext({ theme: 'dark', toggleTheme: () => {} });

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    try {
      const saved = localStorage.getItem('cinelookup-theme');
      if (saved === 'light' || saved === 'dark') return saved;
    } catch {
      // localStorage unavailable — fall through to the default below.
    }
    // Defaults to dark regardless of system preference — this app's whole
    // visual identity was designed dark-first, so that's the truer default
    // rather than following prefers-color-scheme.
    return 'dark';
  });

  useEffect(() => {
    document.documentElement.classList.toggle('light', theme === 'light');
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', theme === 'light' ? '#f6f3ee' : '#07070a');
    try {
      localStorage.setItem('cinelookup-theme', theme);
    } catch {
      // Non-fatal — theme just won't persist across sessions.
    }
  }, [theme]);

  const toggleTheme = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'));

  return <ThemeContext.Provider value={{ theme, toggleTheme }}>{children}</ThemeContext.Provider>;
}

export const useTheme = () => useContext(ThemeContext);
