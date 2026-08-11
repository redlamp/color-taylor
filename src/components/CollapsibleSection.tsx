import { useState, type ReactNode } from 'react';
import { ChevronRight } from 'lucide-react';

type Level = 'h2' | 'h3';

/*
 * h3 was `text-sm font-semibold uppercase tracking-wider`. Uppercase at a wide
 * tracking and a heavy weight is the part that read as dated - it shouts, and it
 * costs legibility at this size for nothing. Sentence case at a lighter weight
 * lets the section titles sit under the panel title instead of competing with
 * it, and the authored strings already carry their own capitalisation, so "RGB"
 * and "HSB / HSL" stay acronyms while "Color Editor" reads as words.
 */
const levelStyles: Record<Level, string> = {
  h2: 'text-lg font-semibold tracking-tight text-foreground',
  h3: 'text-xs font-medium tracking-normal text-muted-foreground',
};

/** The chevron is sized to its header rather than to the other one. */
const chevronSize: Record<Level, string> = { h2: '!size-4', h3: '!size-3.5' };

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
  const shell = flush
    ? 'border-t border-input pt-2'
    : level === 'h3'
      ? 'panel-inset border border-input rounded-lg p-2.5'
      : '';

  return (
    <div
      id={id}
      // Only the h2 sections are a panel's own collapse, so only they report it.
      // The enclosing .panel-frame reads this to drop its glow when closed -
      // marking inner sections too would let a nested collapse trigger that.
      // Written as a string rather than a boolean so `false` survives to the DOM.
      {...(level === 'h2' ? { 'data-panel-open': open ? 'true' : 'false' } : {})}
      className={`flex flex-col gap-1.5 ${shell} ${extraClass || ''}`}
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
        className={`relative z-10 flex items-center gap-1.5 cursor-pointer select-none ${
          flush ? 'h-8 -mt-2 pt-2 box-content' : level === 'h3' ? '-mt-2.5 -mx-2.5 px-2.5 pt-2.5' : ''
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
