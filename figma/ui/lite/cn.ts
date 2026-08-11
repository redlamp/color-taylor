/**
 * cn() without tailwind-merge - 26 KB of runtime class-conflict resolution.
 *
 * twMerge exists so a passed className beats a component's default when the
 * two set the same Tailwind property. Dropping it means both classes survive
 * and CSS source order decides instead. That is only safe because the panel's
 * overrides are verified visually; it is not a change to make blind.
 */
import { clsx, type ClassValue } from 'clsx';

export function cn(...inputs: ClassValue[]): string {
  return clsx(inputs);
}
