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
          for a two-word hint and wrong for a paragraph of explanation.

          The inner div is load-bearing. The primitive's popup is an
          `inline-flex` row, built for an icon beside a word, and in a flex row
          every `<strong>` and every run of text between two of them is its own
          item - so a paragraph with two bold phrases in it was laid out as five
          narrow columns side by side. One block child puts it back in normal
          flow - a block, not a column, since most hosts pass bare text - and gives
          paragraphs a gap where a host passes more than one. */}
      <TooltipContent
        side="bottom"
        sideOffset={6}
        className={`max-w-[46ch] text-base font-normal leading-snug ${className ?? ''}`}
      >
        <div className="py-1 text-left [&>p+p]:mt-2">{children}</div>
      </TooltipContent>
    </Tooltip>
  );
}
