import { fonts, type Colors } from '@/theme/tokens';

import { WEEKDAY_LABELS, type WeekRecap } from './streak';

export type RecapCard = {
  title: string;
  range: string;
  /** Under the big number, e.g. "days you both trained". */
  headline: string;
  recap: WeekRecap;
  rows: readonly (readonly [label: string, value: string])[];
};

const WIDTH = 1080;
const HEIGHT = 1520;
const EDGE = 96;

// shortcut: the image is drawn by hand on a canvas and has to be kept in step with the card on the recap
// screen; switch to a rendering library if the card design grows.
export function drawRecapImage(card: RecapCard, colors: Colors): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('no_canvas');
  const text = (value: string, x: number, y: number, font: string, color: string, align: CanvasTextAlign = 'left') => {
    ctx.font = font;
    ctx.fillStyle = color;
    ctx.textAlign = align;
    ctx.fillText(value, x, y, WIDTH - EDGE * 2);
  };

  ctx.fillStyle = colors.bg;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
  text('FitCircle', EDGE, 140, `36px ${fonts.display}, sans-serif`, colors.textMuted);
  text(card.title, EDGE, 250, `76px ${fonts.displayHeavy}, sans-serif`, colors.text);
  text(card.range, EDGE, 320, '40px sans-serif', colors.textMuted);
  text(String(card.recap.both), EDGE, 620, `300px ${fonts.displayHeavy}, sans-serif`, colors.accent);
  text(card.headline, EDGE, 700, `48px ${fonts.display}, sans-serif`, colors.text);

  const cell = (WIDTH - EDGE * 2) / 7;
  card.recap.days.forEach((day, index) => {
    const x = EDGE + cell * index + cell / 2;
    // The same marks as the app's day dots (DayDots.tsx): your colour, your partner's colour, grey.
    ctx.beginPath();
    ctx.arc(x, 850, day === 'rest' ? 8 : 46, 0, Math.PI * 2);
    ctx.lineWidth = 8;
    ctx.strokeStyle = day === 'partner' ? colors.partner : day === 'none' ? colors.borderStrong : colors.accent;
    ctx.fillStyle = day === 'both' ? colors.accent : day === 'rest' ? colors.border : colors.bg;
    ctx.fill();
    if (day !== 'both' && day !== 'rest') ctx.stroke();
    if (day === 'covered') {
      ctx.beginPath();
      ctx.arc(x, 850, 15, 0, Math.PI * 2);
      ctx.fillStyle = colors.accent;
      ctx.fill();
    }
    text(WEEKDAY_LABELS[index], x, 950, '32px sans-serif', colors.textMuted, 'center');
  });

  card.rows.forEach(([label, value], index) => {
    const y = 1070 + index * 76;
    text(label, EDGE, y, '42px sans-serif', colors.textMuted);
    text(value, WIDTH - EDGE, y, 'bold 42px sans-serif', colors.text, 'right');
  });
  return canvas;
}

/** Shares the week's card as a picture, or saves it where the browser cannot share files. */
export async function shareRecapImage(card: RecapCard, colors: Colors): Promise<'shared' | 'saved' | 'cancelled'> {
  // The display face may not have been used at this size yet; without it the canvas falls back to sans-serif.
  await document.fonts.load(`76px ${fonts.displayHeavy}`).catch(() => undefined);
  const canvas = drawRecapImage(card, colors);
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
  if (!blob) throw new Error('no_image');
  const file = new File([blob], 'fitcircle-week.png', { type: 'image/png' });

  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: card.title });
      return 'shared';
    } catch (error) {
      if ((error as Error).name === 'AbortError') return 'cancelled';
      throw error;
    }
  }
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = file.name;
  link.click();
  URL.revokeObjectURL(link.href);
  return 'saved';
}
