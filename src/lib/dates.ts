/** Local calendar day as YYYY-MM-DD. */
export function dayKey(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

function addDays(date: Date, days: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
}

/** Monday of the week containing the given date. */
export function startOfWeek(date: Date): Date {
  const daysSinceMonday = (date.getDay() + 6) % 7;
  return addDays(date, -daysSinceMonday);
}

/** The seven days, Monday to Sunday, of the week containing the given date. */
export function weekDays(date: Date): Date[] {
  const monday = startOfWeek(date);
  return Array.from({ length: 7 }, (_, index) => addDays(monday, index));
}

/** The last `count` weeks ending with the current one, oldest first; each week is Monday to Sunday. */
export function recentWeeks(date: Date, count: number): Date[][] {
  const thisMonday = startOfWeek(date);
  return Array.from({ length: count }, (_, index) => weekDays(addDays(thisMonday, (index - count + 1) * 7)));
}
