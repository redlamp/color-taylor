/**
 * Plain <input>, same classes as src/components/ui/input.tsx save one: the
 * horizontal padding drops from 10px to 6px.
 *
 * The panel sets its numbers in Inter to match Figma, and Inter's digits are
 * wider than the mono face the app uses - "100" and "255" overflowed a 44px
 * readout by 2px. Trimming the padding buys the room without shrinking the
 * text, which is the wrong lever on a value you have to read.
 */
import type { ComponentProps } from 'react';
import { cn } from '@/lib/utils';

function Input({ className, type, ...props }: ComponentProps<'input'>) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        'h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-1.5 py-1 text-base transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 md:text-sm dark:bg-input/30 dark:disabled:bg-input/80',
        className,
      )}
      {...props}
    />
  );
}

export { Input };
