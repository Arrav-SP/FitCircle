import { useColorScheme } from 'react-native';

// Colour values are provisional; they are chosen and contrast-checked in step 2.
const light = {
  bg: '#F6F7F9',
  surface: '#FFFFFF',
  text: '#14171A',
  textMuted: '#5B6470',
  textOnAccent: '#FFFFFF',
  accent: '#2F6BFF',
  danger: '#C62828',
  border: '#DDE1E6',
};

const dark: typeof light = {
  bg: '#0E1013',
  surface: '#181B20',
  text: '#F2F4F7',
  textMuted: '#9AA3AF',
  textOnAccent: '#FFFFFF',
  accent: '#5B8CFF',
  danger: '#EF6B6B',
  border: '#2A2F37',
};

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32, xxxl: 48 } as const;
export const fontSize = { xs: 12, sm: 14, md: 16, lg: 20, xl: 24, xxl: 32, streak: 48 } as const;
export const radius = { input: 8, card: 16, full: 999 } as const;

export function useColors() {
  return useColorScheme() === 'dark' ? dark : light;
}
