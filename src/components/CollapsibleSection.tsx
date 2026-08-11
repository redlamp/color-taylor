import { useState, type ReactNode } from 'react';
import { ChevronRight } from 'lucide-react';

type Level = 'h2' | 'h3';

/*
 * h3 was `text-sm font-semibold uppercase tracking-wider`. The dated part was
 * uppercase at a wide tracking and a heavy weight - it shouts, and it costs
 * legibility for nothing. What was wrong with the first attempt at fixing it was
 * also dropping to text-xs: the size was never the problem, so shrinking it just
 * made the headers hard to read. Size stays where it was and only the shouting
 * goes. The authored strings already carry their own capitalisation, so "RGB"
 * and "HSB / HSL" stay acronyms while "Color Editor" reads as words.
 */
const levelStyles: Record<Level, string> = {
  h2: 'text-lg font-semibold tracking-tight text-foreground',
  h3: 'text-sm font-medium tracking-normal text-foreground/80',
};

/** Both headers take the same chevron; two sizes read as a mistake at this scale. */
const chevronSize: Record<Level, string> = { h2: '!size-4', h3: '!size-4' };

/**
 * 'card' boxes the section in a rounded border - right when it sits on a page
 * among other cards. 'flush' is the Figma sidebar shape instead: no box, a
 * full-bleed rule above each section, and the content inset by the host's own
 * padding. Sections then stack as one continuous list rather than a stack of
 * floating panels, which is what a plugin panel wants.
 */
type Variant = 'card' | 'flush';

interface CollapsibleSectionProps {
  id?: string;
  title: string;
  level?: Level;
  defaultOpen?: boolean;
  headerLeft?: ReactNode;
  headerRight?: ReactNode;
  className?: string;
  variant?: Variant;
  children: ReactNode;
}

export default function CollapsibleSection({ id, title, level = 'h3', defaultOpen = true, headerLeft, headerRight, className: extraClass, variant = 'card', children }: CollapsibleSectionProps) {
  const [open, setOpen] = useState(defaultOpen);
  const Tag = level;
  const flush = variant === 'flush';
  // panel-inset carries the fill one step off the frame. It deliberately gets
  // none of the colour-reactive chrome: those live on the outer frame, and the
  // inner sections are where the swatches sit. The flush variant is the
  // plugin's shape and gets neither.
  // p-3 rather than p-2.5. At 10px the content sat almost on the border, and the
  // negative margins below have to move with it or the header's hit area stops
  // lining up with the padding it is reaching over.
  const shell = flush
    ? 'border-t border-input pt-2'
    : level === 'h3'
      ? 'panel-inset border border-input rounded-lg p-3'
      : '';

  return (
    <div
      id={id}
      // Only the h2 sections are a panel's own collapse, so only they report it.
      // The enclosing .panel-frame reads this to drop its glow when closed -
      // marking inner sections too would let a nested collapse trigger that.
      // Written as a string rather than a boolean so `false` survives to the DOM.
      {...(level === 'h2' ? { 'data-panel-open': open ? 'true' : 'false' } : {})}
      className={`flex flex-col gap-2 ${shell} ${extraClass || ''}`}
    >
      {/* The hit area reaches back over the shell's own padding.
          Left to itself the row is only as tall as its text, so the band
          between the section rule and the title looked like header and did
          nothing when clicked. Negative margin plus matching padding puts
          those pixels inside the button without moving anything. */}
      <div
        role="button"
        tabIndex={0}
        aria-expanded={open}
        // relative z-10: the hexagon's SVG box is taller than its stage and
        // overhangs the top ~10px of whatever follows it. That is the exact
        // band the negative margin above just claimed, so without a stacking
        // context the SVG keeps winning the hit test and the header only
        // *looks* clickable there. No visual change - the header has no
        // background of its own.
        // box-content + h-8 pins the *content* box at 32px, which is what keeps
        // the title from moving when the section opens.
        //
        // min-h-8 did not: it is border-box, so the 12px pt-3 came out of the
        // 32px and left a 20px content box. Collapsing hides headerLeft and
        // headerRight, the row lost its 32px buttons, the content box shrank to
        // the height of the text, and items-center re-centred the title 6px up.
        //
        // With a fixed content box the padding sits outside it, so the title is
        // 12px + half of 32px from the panel edge whether or not anything else
        // is in the row. The flush variant already worked this way.
        className={`relative z-10 box-content flex h-8 items-center gap-2 cursor-pointer select-none ${
          flush ? '-mt-2 pt-2' : level === 'h3' ? '-mt-3 -mx-3 px-3 pt-3' : ''
        }`}
        onClick={() => setOpen((o) => !o)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setOpen((o) => !o);
          }
        }}
      >
        <ChevronRight
          className={`${flush ? '!size-4' : chevronSize[level]} text-muted-foreground transition-transform duration-200 ${open ? 'rotate-90' : ''}`}
        />
        <Tag className={flush ? 'text-xs font-semibold text-foreground' : levelStyles[level]}>
          {title}
        </Tag>
        {open && headerLeft && (
          <div onClick={(e) => e.stopPropagation()}>
            {headerLeft}
          </div>
        )}
        {open && headerRight && (
          <div className="ml-auto" onClick={(e) => e.stopPropagation()}>
            {headerRight}
          </div>
        )}
      </div>
      {/* No rule under the header any more. It was doing the work the section's
          own fill now does - panel-inset gives every card a surface, so a divider
          inside one is a second boundary for the same edge. Spacing separates
          the header instead. */}
      {open && children}
    </div>
  );
}
