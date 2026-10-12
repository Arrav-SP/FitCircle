import { useEffect, useState, type PropsWithChildren } from 'react';
import { useColorScheme } from 'react-native';

import { accentColors, isAccentId, type AccentId } from './accents';
import { palettes, ThemeContext, type Colors, type Scheme, type ThemePreference } from './tokens';

const STORAGE_KEY = 'fitcircle.theme';
const ACCENT_KEY = 'fitcircle.accent';

function readPreference(): ThemePreference {
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored === 'light' || stored === 'dark' ? stored : 'system';
}

function readAccent(): AccentId {
  const stored = localStorage.getItem(ACCENT_KEY);
  return isAccentId(stored) ? stored : 'navy';
}

/** The full set of colours for a theme with a chosen accent. */
export function themeColors(scheme: Scheme, accent: AccentId): Colors {
  return { ...palettes[scheme], ...accentColors(accent, scheme) };
}

export function ThemeProvider({ children }: PropsWithChildren) {
  const system = useColorScheme() === 'dark' ? 'dark' : 'light';
  const [preference, setPreferenceState] = useState<ThemePreference>(readPreference);
  const [accent, setAccentState] = useState<AccentId>(readAccent);
  const scheme = preference === 'system' ? system : preference;
  const colors = themeColors(scheme, accent);

  function setPreference(next: ThemePreference) {
    setPreferenceState(next);
    if (next === 'system') localStorage.removeItem(STORAGE_KEY);
    else localStorage.setItem(STORAGE_KEY, next);
  }

  function setAccent(next: AccentId) {
    setAccentState(next);
    if (next === 'navy') localStorage.removeItem(ACCENT_KEY);
    else localStorage.setItem(ACCENT_KEY, next);
  }

  // Paint the page behind the app too, so overscroll and the browser bar match the theme.
  useEffect(() => {
    document.documentElement.style.backgroundColor = colors.bg;
    document.documentElement.style.colorScheme = scheme;
  }, [colors.bg, scheme]);

  return (
    <ThemeContext value={{ colors, scheme, preference, setPreference, accent, setAccent }}>{children}</ThemeContext>
  );
}
