/**
 * A `?` beside a title, with the explanation behind it.
 *
 * The lab pages used to carry their prose as a caption under every figure.
 * Four figures in a 2x2 that has to fit a screen have no room for four
 * paragraphs, so the paragraph moves in here and the panel keeps one line.
 *
 * The pattern is the app's own - see the hex tooltip in EquationsPanel.tsx -
 * and it is copied rather than imported because that one is welded to the
 * equations row it sits in. Same primitive, same trigger, same `cursor-help`.
 */
import type { ReactNode } from 'react';
import { CircleHelp } from 'lucide-react';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';

export interface HelpTipProps {
  /** What the `?` is about, read out to a screen reader. */
  label: string;
  children: ReactNode;
  /** Wider than the default where the explanation is a real paragraph. */
  className?: string;
}

export default function HelpTip({ label, children, className }: HelpTipProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          aria-label={label}
          className="inline-flex size-5 shrink-0 cursor-help items-center justify-center rounded-full text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50"
        >
          <CircleHelp className="size-4" />
        </button>
      </TooltipTrigger>
      {/* text-base: the tooltip primitive defaults to text-xs, which is right
          for a two-word hint and wrong for a paragraph of explanation. */}
      <TooltipContent
        side="bottom"
        sideOffset={6}
        className={`max-w-[46ch] text-base font-normal leading-snug ${className ?? ''}`}
      >
        {children}
      </TooltipContent>
    </Tooltip>
  );
}
