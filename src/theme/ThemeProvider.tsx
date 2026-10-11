import { useEffect, useState, type PropsWithChildren } from 'react';
import { useColorScheme } from 'react-native';

import { palettes, ThemeContext, type ThemePreference } from './tokens';

const STORAGE_KEY = 'fitcircle.theme';

function readPreference(): ThemePreference {
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored === 'light' || stored === 'dark' ? stored : 'system';
}

export function ThemeProvider({ children }: PropsWithChildren) {
  const system = useColorScheme() === 'dark' ? 'dark' : 'light';
  const [preference, setPreferenceState] = useState<ThemePreference>(readPreference);
  const scheme = preference === 'system' ? system : preference;
  const colors = palettes[scheme];

  function setPreference(next: ThemePreference) {
    setPreferenceState(next);
    if (next === 'system') localStorage.removeItem(STORAGE_KEY);
    else localStorage.setItem(STORAGE_KEY, next);
  }

  // Paint the page behind the app too, so overscroll and the browser bar match the theme.
  useEffect(() => {
    document.documentElement.style.backgroundColor = colors.bg;
    document.documentElement.style.colorScheme = scheme;
  }, [colors.bg, scheme]);

  return <ThemeContext value={{ colors, scheme, preference, setPreference }}>{children}</ThemeContext>;
}
