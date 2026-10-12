// Personal accent colours. The accent is "you": primary buttons, the selected day, your ring, trained muscles.
// "navy" is the built-in look and changes nothing. Every other colour is derived from a hue so that it stays
// readable: a deep shade on a pale tinted page on the light theme, a pastel shade on black on the dark theme
// (accents.test.ts checks them all).

type Generated = { hue: number; sat: number; warm?: boolean };

export const ACCENTS = [
  { id: 'navy', label: 'Navy' },
  { id: 'blue', label: 'Blue', hue: 218, sat: 80 },
  { id: 'sky', label: 'Sky', hue: 199, sat: 85 },
  { id: 'teal', label: 'Teal', hue: 176, sat: 75 },
  { id: 'mint', label: 'Mint', hue: 160, sat: 55 },
  { id: 'green', label: 'Green', hue: 140, sat: 60 },
  { id: 'lime', label: 'Lime', hue: 85, sat: 65 },
  { id: 'yellow', label: 'Yellow', hue: 48, sat: 90, warm: true },
  { id: 'orange', label: 'Orange', hue: 27, sat: 90, warm: true },
  { id: 'coral', label: 'Coral', hue: 12, sat: 85, warm: true },
  { id: 'red', label: 'Red', hue: 356, sat: 75 },
  { id: 'rose', label: 'Rose', hue: 342, sat: 75 },
  { id: 'pink', label: 'Pink', hue: 325, sat: 75 },
  { id: 'magenta', label: 'Magenta', hue: 300, sat: 60 },
  { id: 'purple', label: 'Purple', hue: 280, sat: 65 },
  { id: 'violet', label: 'Violet', hue: 262, sat: 70 },
  { id: 'lavender', label: 'Lavender', hue: 245, sat: 60 },
  { id: 'brown', label: 'Brown', hue: 25, sat: 40, warm: true },
  { id: 'slate', label: 'Slate', hue: 215, sat: 15 },
] as const;

export type AccentId = (typeof ACCENTS)[number]['id'];

export function isAccentId(value: string | null): value is AccentId {
  return ACCENTS.some((accent) => accent.id === value);
}

export function hslToHex(hue: number, sat: number, light: number): string {
  const s = sat / 100;
  const l = light / 100;
  const a = s * Math.min(l, 1 - l);
  const channel = (n: number) => {
    const k = (n + hue / 30) % 12;
    const value = l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1));
    return Math.round(value * 255).toString(16).padStart(2, '0');
  };
  return `#${channel(0)}${channel(8)}${channel(4)}`.toUpperCase();
}

function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((start) => {
    const value = parseInt(hex.slice(start, start + 2), 16) / 255;
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** WCAG contrast ratio between two #RRGGBB colours, from 1 to 21. */
export function contrast(a: string, b: string): number {
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (light + 0.05) / (dark + 0.05);
}

// The accent must read as text on the page it sits on; 5.2 leaves room above the 4.5 minimum.
function lightAccent({ hue, sat }: Generated, bg: string): string {
  for (let light = 55; light > 5; light -= 1) {
    const hex = hslToHex(hue, sat, light);
    if (contrast(hex, bg) >= 5.2) return hex;
  }
  return hslToHex(hue, sat, 5);
}

export type AccentColors = {
  accent: string;
  textOnAccent: string;
  accentMuted: string;
  highlight: string;
  highlightSoft: string;
  partner?: string;
  textOnPartner?: string;
  // Light theme only: the page and its quiet surfaces take a pale tint of the accent. Dark stays black.
  bg?: string;
  surfaceSunken?: string;
  border?: string;
  bodyFill?: string;
};

/** The tokens this accent replaces in a theme. Empty for navy, which is the built-in palette. */
export function accentColors(id: AccentId, scheme: 'light' | 'dark'): AccentColors | Record<string, never> {
  const accent = ACCENTS.find((item) => item.id === id);
  if (!accent || !('hue' in accent)) return {};
  const { hue, sat } = accent;
  // The partner colour is marigold. Next to a yellow, orange or brown accent the two rings would look
  // alike, so the partner becomes teal for those.
  const warm = 'warm' in accent && accent.warm;

  if (scheme === 'light') {
    const bg = hslToHex(hue, Math.min(sat, 60), 96);
    const main = lightAccent(accent, bg);
    return {
      bg,
      surfaceSunken: hslToHex(hue, 35, 91),
      border: hslToHex(hue, 30, 86),
      bodyFill: hslToHex(hue, 25, 90),
      accent: main,
      textOnAccent: '#FFFFFF',
      accentMuted: hslToHex(hue, Math.min(sat, 70), 92),
      highlight: main,
      highlightSoft: hslToHex(hue, sat * 0.8, 75),
      ...(warm ? { partner: '#0E7480', textOnPartner: '#FFFFFF' } : {}),
    };
  }
  const main = hslToHex(hue, Math.min(sat + 10, 95), 80);
  return {
    accent: main,
    textOnAccent: '#0B0B0F',
    accentMuted: hslToHex(hue, sat * 0.5, 15),
    highlight: main,
    highlightSoft: hslToHex(hue, sat * 0.5, 42),
    ...(warm ? { partner: '#5FD4E0', textOnPartner: '#000000' } : {}),
  };
}
