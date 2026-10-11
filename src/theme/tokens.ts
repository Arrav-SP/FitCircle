import { createContext, use } from 'react';

// Every text/background pair below was checked for WCAG AA contrast (4.5:1 text, 3:1 graphics).
// "accent" (navy) is you, "partner" (marigold) is your streak partner; the two meet in the pair rings.
export const palettes = {
  light: {
    bg: '#F3F5F9',
    surface: '#FFFFFF',
    surfaceSunken: '#E9EDF4',
    text: '#0E1526',
    textMuted: '#55607A',
    textOnAccent: '#FFFFFF',
    accent: '#14235A',
    accentMuted: '#DDE4F6',
    // Trained muscles on the body figure: a vivid blue reads better than navy on a pale figure.
    highlight: '#2448D8',
    highlightSoft: '#8FA6F2',
    bodyFill: '#E6EAF2',
    partner: '#B97700',
    textOnPartner: '#0E1526',
    success: '#1E7A46',
    warning: '#8A5A00',
    danger: '#C0292B',
    border: '#D8DEEA',
    borderStrong: '#7C869C',
  },
  // True black. Navy cannot be read on black, so the dark accent is a lighter blue of the same hue.
  dark: {
    bg: '#000000',
    surface: '#131316',
    surfaceSunken: '#1E1E23',
    text: '#F5F5F7',
    textMuted: '#9A9CA6',
    textOnAccent: '#00081C',
    accent: '#8FB0FF',
    accentMuted: '#16203A',
    highlight: '#8FB0FF',
    highlightSoft: '#44598F',
    bodyFill: '#2A2A30',
    partner: '#F5B83D',
    textOnPartner: '#000000',
    success: '#5BD08A',
    warning: '#F0B455',
    danger: '#FF8A85',
    border: '#2A2A30',
    borderStrong: '#70737F',
  },
} as const;

export type Colors = { [K in keyof typeof palettes.light]: string };
export type Scheme = keyof typeof palettes;
export type ThemePreference = 'system' | Scheme;

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32, xxxl: 48 } as const;
export const fontSize = { xs: 12, sm: 14, md: 16, lg: 20, xl: 24, xxl: 32, streak: 48 } as const;
// Radius follows hierarchy: controls are tighter than the cards that hold them.
export const radius = { input: 12, card: 24, full: 999 } as const;
export const motion = { press: 150, transition: 250 } as const;

// Headings and numbers use the display face; body text uses the device's own font.
export const fonts = {
  display: 'BricolageGrotesque_700Bold',
  displayHeavy: 'BricolageGrotesque_800ExtraBold',
} as const;

export type Theme = {
  colors: Colors;
  scheme: Scheme;
  preference: ThemePreference;
  setPreference: (preference: ThemePreference) => void;
};

export const ThemeContext = createContext<Theme>({
  colors: palettes.light,
  scheme: 'light',
  preference: 'system',
  setPreference: () => {},
});

export function useTheme() {
  return use(ThemeContext);
}

export function useColors() {
  return use(ThemeContext).colors;
}
