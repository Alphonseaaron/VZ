import React, { useEffect } from 'react';
import { useAtom } from 'jotai';
import { themeAtom, type Theme } from '../../lib/theme';

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useAtom(themeAtom);

  useEffect(() => {
    localStorage.setItem('theme', theme);
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${theme}`}>
      {children}
    </div>
  );
};

export const useTheme = () => {
  const [theme, setTheme] = useAtom(themeAtom);
  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');
  return { theme, toggleTheme };
};