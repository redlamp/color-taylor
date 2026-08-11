/**
 * Plain-DOM ToggleGroup for the plugin. Same classes as the Base UI version;
 * `multiple` is the only mode the panel uses, so that is the only one here.
 *
 * Trade: no arrow-key navigation. Tab and click both work.
 */
import { createContext, useContext, type ComponentProps, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

const GroupCtx = createContext<{ value: readonly string[]; toggle: (v: string) => void }>({
  value: [],
  toggle: () => {},
});

function ToggleGroup({
  className,
  value = [],
  onValueChange,
  children,
  ...props
}: {
  className?: string;
  multiple?: boolean;
  value?: readonly string[];
  onValueChange?: (v: string[]) => void;
  children?: ReactNode;
} & Omit<ComponentProps<'div'>, 'onChange' | 'defaultValue'>) {
  const toggle = (v: string) =>
    onValueChange?.(value.includes(v) ? value.filter((x) => x !== v) : [...value, v]);
  return (
    <div
      data-slot="toggle-group"
      role="group"
      className={cn(
        'inline-flex h-8 w-fit items-center justify-center gap-1 rounded-lg bg-muted p-[3px] text-muted-foreground',
        className,
      )}
      {...props}
    >
      <GroupCtx.Provider value={{ value, toggle }}>{children}</GroupCtx.Provider>
    </div>
  );
}

function ToggleGroupItem({
  className,
  value,
  ...props
}: Omit<ComponentProps<'button'>, 'value'> & { value: string }) {
  const ctx = useContext(GroupCtx);
  const pressed = ctx.value.includes(value);
  return (
    <button
      type="button"
      aria-pressed={pressed}
      data-slot="toggle-group-item"
      data-pressed={pressed ? '' : undefined}
      onClick={() => ctx.toggle(value)}
      className={cn(
        'relative inline-flex h-[calc(100%-1px)] items-center justify-center gap-1.5 rounded-md border border-transparent px-2 py-0.5 text-sm font-medium whitespace-nowrap text-foreground/60 transition-all',
        'hover:text-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-1 focus-visible:outline-ring',
        'disabled:pointer-events-none disabled:opacity-50',
        'dark:text-muted-foreground dark:hover:text-foreground',
        'data-pressed:bg-background data-pressed:text-foreground data-pressed:shadow-sm',
        'dark:data-pressed:border-input dark:data-pressed:bg-input/30 dark:data-pressed:text-foreground',
        "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className,
      )}
      {...props}
    />
  );
}

export { ToggleGroup, ToggleGroupItem };
