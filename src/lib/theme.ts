import { atom } from 'jotai';

export type Theme = 'light' | 'dark';

export const themeAtom = atom<Theme>(
  typeof window !== 'undefined'
    ? (localStorage.getItem('theme') as Theme) || 
      (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
    : 'light'
);

export const colors = {
  light: {
    primary: '#FFD700', // Gold
    secondary: '#1a1a1a',
    background: '#ffffff',
    surface: '#f3f4f6',
    text: '#1a1a1a',
    border: '#e5e7eb',
  },
  dark: {
    primary: '#FFD700', // Gold
    secondary: '#ffffff',
    background: '#1a1a1a',
    surface: '#2d2d2d',
    text: '#ffffff',
    border: '#404040',
  },
};