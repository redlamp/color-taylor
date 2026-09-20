/**
 * Two ways of stopping text from moving the page under it.
 *
 * The lab pages are built for watching one figure while dragging another, so a
 * block of text that grows a line and shoves the picture down the screen is
 * not a cosmetic problem - it is the page failing at its one job. Every
 * readout that can change its wording, its line count or its digit count
 * belongs in one of these.
 *
 * WHY NOT A `min-height`. A height fitted to what happens to be on screen is
 * a guess, and it is wrong at the first narrower window or the first longer
 * value. Both tools below reserve the *real* height of the worst case at
 * whatever width they are given, so there is nothing to re-measure when the
 * layout changes.
 *
 * - `Stack` is for a readout with a few known wordings. Every one of them is
 *   laid out, in the same grid cell, and all but the current one is made
 *   invisible. The box is as tall as the tallest wording at the current width,
 *   automatically and at every width. `visibility: hidden` rather than
 *   `display: none` is the whole mechanism: a hidden element still takes its
 *   space, which is exactly what is wanted.
 * - `Reserved` is the bordered box those readouts usually sit in, which also
 *   changes its border and its text color when it has something to say. It
 *   never changes its size doing so.
 *
 * Where the *values* inside one wording vary, `tabular-nums` and a fixed
 * number of decimals keep the digits from reflowing sideways; where a whole
 * phrase varies, it is a `Stack`.
 */
import type { ReactNode } from 'react';

export interface StackProps {
  /**
   * Every state the slot can be in, keyed. All of them are laid out; the one
   * named by `show` is the one you can see.
   */
  states: ReadonlyArray<{ key: string; node: ReactNode }>;
  show: string;
  className?: string;
}

export function Stack({ states, show, className }: StackProps) {
  return (
    // One grid cell, every child in it: the container takes the height of the
    // tallest child, and `invisible` children still have one.
    <div className={`grid ${className ?? ''}`}>
      {states.map((s) => (
        <div
          key={s.key}
          className={`col-start-1 row-start-1 ${s.key === show ? '' : 'invisible'}`}
          aria-hidden={s.key === show ? undefined : true}
        >
          {s.node}
        </div>
      ))}
    </div>
  );
}

export interface ReservedProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Draw the border and full-strength text: something is being said. */
  lit?: boolean;
  children: ReactNode;
}

export function Reserved({ lit = false, className, children, ...rest }: ReservedProps) {
  return (
    <div
      {...rest}
      className={`shrink-0 rounded-md border px-3 py-2 text-base leading-snug transition-colors ${lit
        ? 'border-foreground/40 bg-foreground/5 text-foreground'
        : 'border-transparent text-muted-foreground opacity-60'} ${className ?? ''}`}
    >
      {children}
    </div>
  );
}
