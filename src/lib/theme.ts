import { atom } from 'jotai';

export type Theme = 'dark';

export const themeAtom = atom<Theme>('dark');

export const colors = {
  dark: {
    primary: '#FFD700', // Gold
    secondary: '#ffffff',
    background: '#0A0A1B',
    surface: '#1A1A2F',
    text: '#ffffff',
    border: '#2A2A4F',
    accent1: '#FF3366',
    accent2: '#33FF99',
    accent3: '#3366FF'
  }
};