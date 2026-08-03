import { ToggleGroup as ToggleGroupPrimitive } from "@base-ui/react/toggle-group"
import { Toggle as TogglePrimitive } from "@base-ui/react/toggle"
import type { ComponentProps } from "react"

import { cn } from "@/lib/utils"

/**
 * Segmented control that allows more than one selection.
 *
 * Deliberately styled off Tabs so the two read as the same control family - the
 * difference the user should notice is the behaviour (`multiple`), not the
 * chrome. Base UI's prop is `multiple`, and value is an array either way.
 */
function ToggleGroup({
  className,
  ...props
}: ComponentProps<typeof ToggleGroupPrimitive>) {
  return (
    <ToggleGroupPrimitive
      data-slot="toggle-group"
      className={cn(
        "inline-flex h-8 w-fit items-center justify-center rounded-lg bg-muted p-[3px] text-muted-foreground",
        className
      )}
      {...props}
    />
  )
}

function ToggleGroupItem({
  className,
  ...props
}: ComponentProps<typeof TogglePrimitive>) {
  return (
    <TogglePrimitive
      data-slot="toggle-group-item"
      className={cn(
        "relative inline-flex h-[calc(100%-1px)] items-center justify-center gap-1.5 rounded-md border border-transparent px-2 py-0.5 text-sm font-medium whitespace-nowrap text-foreground/60 transition-all",
        "hover:text-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-1 focus-visible:outline-ring",
        "disabled:pointer-events-none disabled:opacity-50",
        "dark:text-muted-foreground dark:hover:text-foreground",
        "data-pressed:bg-background data-pressed:text-foreground data-pressed:shadow-sm",
        "dark:data-pressed:border-input dark:data-pressed:bg-input/30 dark:data-pressed:text-foreground",
        "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...props}
    />
  )
}

export { ToggleGroup, ToggleGroupItem }
