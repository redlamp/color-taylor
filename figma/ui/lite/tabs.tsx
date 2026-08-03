/**
 * Plain-DOM Tabs for the plugin, styled identically to the Base UI version.
 *
 * The panel uses tabs twice - HSB/HSL and Fill/Stroke/off - and neither needs
 * what the primitive brings: a composite roving-focus machine, panel wiring,
 * activation modes. Two segmented controls of three buttons.
 *
 * The class strings are copied verbatim from src/components/ui/tabs.tsx, so
 * the same data attributes have to be emitted for them to bite: data-slot,
 * data-orientation/data-horizontal on the root, data-variant on the list,
 * data-active on the selected trigger.
 *
 * Trade: no arrow-key navigation between tabs. Tab and click both work.
 */
import { createContext, useContext, type ComponentProps, type ReactNode } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const TabsCtx = createContext<{ value?: string; onValueChange?: (v: string) => void }>({});

function Tabs({
  className,
  value,
  onValueChange,
  children,
  ...props
}: {
  className?: string;
  value?: string;
  onValueChange?: (v: string) => void;
  children?: ReactNode;
} & Omit<ComponentProps<'div'>, 'onChange'>) {
  return (
    <div
      data-slot="tabs"
      data-orientation="horizontal"
      data-horizontal=""
      className={cn('group/tabs flex gap-2 data-horizontal:flex-col', className)}
      {...props}
    >
      <TabsCtx.Provider value={{ value, onValueChange }}>{children}</TabsCtx.Provider>
    </div>
  );
}

const tabsListVariants = cva(
  'group/tabs-list inline-flex w-fit items-center justify-center rounded-lg p-[3px] text-muted-foreground group-data-horizontal/tabs:h-8 group-data-vertical/tabs:h-fit group-data-vertical/tabs:flex-col data-[variant=line]:rounded-none',
  {
    variants: {
      variant: {
        default: 'bg-muted',
        line: 'gap-1 bg-transparent',
      },
    },
    defaultVariants: { variant: 'default' },
  },
);

function TabsList({
  className,
  variant = 'default',
  ...props
}: ComponentProps<'div'> & VariantProps<typeof tabsListVariants>) {
  return (
    <div
      data-slot="tabs-list"
      data-variant={variant}
      role="tablist"
      className={cn(tabsListVariants({ variant }), className)}
      {...props}
    />
  );
}

function TabsTrigger({
  className,
  value,
  ...props
}: Omit<ComponentProps<'button'>, 'value'> & { value: string }) {
  const ctx = useContext(TabsCtx);
  const active = ctx.value === value;
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      data-slot="tabs-trigger"
      data-active={active ? '' : undefined}
      onClick={() => ctx.onValueChange?.(value)}
      className={cn(
        "relative inline-flex h-[calc(100%-1px)] flex-1 items-center justify-center gap-1.5 rounded-md border border-transparent px-1.5 py-0.5 text-sm font-medium whitespace-nowrap text-foreground/60 transition-all group-data-vertical/tabs:w-full group-data-vertical/tabs:justify-start hover:text-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-1 focus-visible:outline-ring disabled:pointer-events-none disabled:opacity-50 dark:text-muted-foreground dark:hover:text-foreground group-data-[variant=default]/tabs-list:data-active:shadow-sm group-data-[variant=line]/tabs-list:data-active:shadow-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        'group-data-[variant=line]/tabs-list:bg-transparent group-data-[variant=line]/tabs-list:data-active:bg-transparent dark:group-data-[variant=line]/tabs-list:data-active:border-transparent dark:group-data-[variant=line]/tabs-list:data-active:bg-transparent',
        'data-active:bg-background data-active:text-foreground dark:data-active:border-input dark:data-active:bg-input/30 dark:data-active:text-foreground',
        className,
      )}
      {...props}
    />
  );
}

function TabsContent({ className, ...props }: ComponentProps<'div'>) {
  return <div data-slot="tabs-content" className={cn('flex-1 text-sm outline-none', className)} {...props} />;
}

export { Tabs, TabsList, TabsTrigger, TabsContent, tabsListVariants };
