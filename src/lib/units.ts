export type Units = 'kg' | 'lb';

const KG_PER_LB = 0.45359237;

/** Weights are stored in kilograms; this converts one for display, rounded to one decimal. */
export function kgToDisplay(kg: number, units: Units): number {
  const value = units === 'kg' ? kg : kg / KG_PER_LB;
  return Math.round(value * 10) / 10;
}

/** Converts a weight typed in the user's units to kilograms, rounded to two decimals. */
export function displayToKg(value: number, units: Units): number {
  const kg = units === 'kg' ? value : value * KG_PER_LB;
  return Math.round(kg * 100) / 100;
}

export function formatWeight(kg: number, units: Units): string {
  return `${kgToDisplay(kg, units)} ${units}`;
}

/** A random UUID. `crypto.randomUUID` is missing on plain-http pages (a phone on the LAN), so build one. */
export function uuid(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}
