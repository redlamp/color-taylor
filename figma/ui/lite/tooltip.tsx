/**
 * No tooltips in the plugin.
 *
 * Base UI's Tooltip is the single most expensive thing in the panel: 66 KB
 * once its positioning engine, collision detection, safe-polygon hover paths
 * and dismissal handling are counted. It was labelling six letters and a few
 * icon buttons, all of which already carry aria-label.
 *
 * The trigger renders, the content does not. Aliased in vite.figma.config.ts;
 * the app keeps the real thing.
 */
import type { ReactNode } from 'react';

export function TooltipProvider({ children }: { children?: ReactNode }) {
  return <>{children}</>;
}

export function Tooltip({ children }: { children?: ReactNode }) {
  return <>{children}</>;
}

/** `asChild` is accepted and ignored - there is no wrapper to collapse. */
export function TooltipTrigger({ children }: { children?: ReactNode; asChild?: boolean }) {
  return <>{children}</>;
}

export function TooltipContent(_props: Record<string, unknown>) {
  return null;
}
