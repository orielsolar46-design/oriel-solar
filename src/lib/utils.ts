import { clsx, type ClassValue } from 'clsx';
import { extendTailwindMerge } from 'tailwind-merge';

/**
 * tailwind-merge only knows Tailwind's stock type scale, so every custom step
 * in this project (`text-small`, `text-body`, …) looked like a colour to it.
 * Merging `text-oriel-white` with `text-body` therefore dropped the white —
 * which is why a green button on a light card had navy lettering. Teaching it
 * the project scale keeps size and colour in separate groups, where they
 * belong.
 */
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      'font-size': [
        {
          text: [
            'display',
            'h1',
            'h2',
            'h3',
            'body-lg',
            'body',
            'small',
            'caption',
            'micro',
            'data',
            'eyebrow',
          ],
        },
      ],
    },
  },
});

/** Merge conditional class names, de-duplicating Tailwind utilities. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format a whole-shilling amount as KES, no decimals (prices round to KES 100). */
export function formatKES(amount: number): string {
  return new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: 'KES',
    maximumFractionDigits: 0,
  }).format(amount);
}
