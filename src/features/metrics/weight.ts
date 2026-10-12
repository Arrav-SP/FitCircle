import { displayToKg, kgToDisplay, type Units } from '../../lib/units.ts';

export type WeightEntry = { id: string; local_date: string; kg: number };

/** The typed body weight in kilograms, or null if it is not a sensible number (20 to 400 kg). */
export function parseBodyWeight(text: string, units: Units): number | null {
  const typed = text.trim().replace(',', '.');
  if (typed === '' || Number.isNaN(Number(typed))) return null;
  const kg = displayToKg(Number(typed), units);
  return kg >= 20 && kg <= 400 ? kg : null;
}

/** "Down 0.4 kg" between two weights in the person's units; null when there is nothing to compare. */
export function weightChange(latestKg: number, earlierKg: number | undefined, units: Units): string | null {
  if (earlierKg === undefined) return null;
  const difference = Math.round((kgToDisplay(latestKg, units) - kgToDisplay(earlierKg, units)) * 10) / 10;
  if (difference === 0) return 'No change';
  return `${difference > 0 ? 'Up' : 'Down'} ${Math.abs(difference)} ${units}`;
}
