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

/*
 * Which sections the user has opened or closed, keyed by id and outliving the
 * components themselves.
 *
 * Closing a section unmounts its children, so a nested section lost its own
 * state and came back at defaultOpen - collapse Sliders with RGB closed, reopen
 * it, and RGB was open again. The state has to sit somewhere that survives the
 * unmount, and the section already has a stable id to key it by.
 *
 * Module scope rather than localStorage on purpose: this is for the length of a
 * session, and persisting it would mean a section you closed once stayed closed
 * on every future visit, which is a different decision from this one.
 */
const OPEN_STATE = new Map<string, boolean>();

interface CollapsibleSectionProps {
  id?: string;
  title: string;
  level?: Level;
  defaultOpen?: boolean;
  headerLeft?: ReactNode;
  headerRight?: ReactNode;
  className?: string;
  variant?: Variant;
  /**
   * Take the leftover height of the parent flex column, but only while open. The
   * section has to own this rather than the caller passing `flex-1`, because only
   * the section knows whether it is open - a collapsed section that still filled
   * would be a header stretched down the whole column.
   *
   * It also has to reach the content wrapper, not just the section root, or the
   * height stops at the wrapper and whatever is inside sizes to its own content.
   */
  fill?: boolean;
  /**
   * On top of `fill`: report that this section will soak up slack, so the
   * enclosing panel is worth stretching to the row height.
   *
   * Separate from `fill` because the two are not the same claim. The Sliders
   * panel's own h2 section fills its card - that is plumbing - but the section
   * that actually absorbs is the Color Editor nested inside it. If the h2 also
   * reported absorbing, the panel would stretch even with the Color Editor
   * closed, which is the empty-card bug this pair exists to avoid.
   */
  absorbs?: boolean;
  children: ReactNode;
}

export default function CollapsibleSection({ id, title, level = 'h3', defaultOpen = true, headerLeft, headerRight, className: extraClass, variant = 'card', fill, absorbs, children }: CollapsibleSectionProps) {
  const [open, setOpen] = useState(
    () => (id !== undefined && OPEN_STATE.has(id) ? OPEN_STATE.get(id)! : defaultOpen),
  );
  const toggle = () =>
    setOpen((o) => {
      const next = !o;
      if (id !== undefined) OPEN_STATE.set(id, next);
      return next;
    });
  const Tag = level;
  const flush = variant === 'flush';
  // aria-controls and aria-labelledby need ids on both ends. Only wired up when
  // the caller gave the section an id; every current callsite does.
  const triggerId = id ? `${id}-trigger` : undefined;
  const contentId = id ? `${id}-content` : undefined;
  // panel-inset carries the fill one step off the frame. It deliberately gets
  // none of the colour-reactive chrome: those live on the outer frame, and the
  // inner sections are where the swatches sit. The flush variant is the
  // plugin's shape and gets neither.
  // 12px on the sides, 8px top and bottom. The vertical is tighter on purpose:
  // the header row is a fixed 32px and the content below it carries its own
  // spacing, so the same number reads as larger vertically than it does beside
  // content. The negative margins below have to track the top value, or the
  // header's hit area stops lining up with the padding it reaches over.
  const shell = flush
    ? 'border-t border-input pt-2'
    : level === 'h3'
      ? 'panel-inset border border-input rounded-lg px-3 py-2'
      : '';

  return (
    <div
      id={id}
      // Only the h2 sections are a panel's own collapse, so only they report it.
      // The enclosing .panel-frame reads this to drop its glow when closed -
      // marking inner sections too would let a nested collapse trigger that.
      // Written as a string rather than a boolean so `false` survives to the DOM.
      {...(level === 'h2' ? { 'data-panel-open': open ? 'true' : 'false' } : {})}
      // The enclosing .panel-frame reads this to decide whether stretching to
      // the row height is worth anything: with an open absorbing section it has
      // somewhere to put the space, without one it should sit at its natural
      // height instead of becoming a mostly-empty card.
      {...(absorbs && open ? { 'data-section-grow': 'true' } : {})}
      className={`flex flex-col ${fill && open ? 'flex-1 min-h-0' : ''} ${shell} ${extraClass || ''}`}
    >
      {/* The hit area reaches back over the shell's own padding.
          Left to itself the row is only as tall as its text, so the band
          between the section rule and the title looked like header and did
          nothing when clicked. Negative margin plus matching padding puts
          those pixels inside the button without moving anything. */}
      {/*
        The row is not the control any more; the button inside it is.

        It used to be a `div role="button"` wrapping the whole header - including
        the Clear / Defaults / Sort buttons, which is invalid nesting and made a
        screen reader announce the header and its three actions as one control.
        The trigger and the actions are siblings now, and the trigger is
        `flex-1`, so it still covers every part of the row that is not an action
        (see 7767ea9, which made the whole header clickable on purpose).

        relative z-10: the hexagon's SVG box is taller than its stage and
        overhangs the top ~10px of whatever follows it - the exact band the
        negative margin claims - so without a stacking context the SVG wins the
        hit test and the header only *looks* clickable there.

        box-content + h-8 pins the content box at 32px, which is what keeps the
        title from moving when the section opens. min-h-8 did not: it is
        border-box, so the padding came out of the 32px, and the row then resized
        with whatever the actions did.
      */}
      <div
        className={`relative z-10 box-content flex h-8 items-center gap-2 ${
          flush ? '-mt-2 pt-2' : level === 'h3' ? '-mt-2 -mx-3 px-3 pt-2' : ''
        }`}
      >
        <button
          type="button"
          id={triggerId}
          aria-expanded={open}
          aria-controls={contentId}
          onClick={toggle}
          // No keydown handler: a real button already activates on Enter and
          // Space. The div it replaced needed one.
          className="flex h-full flex-1 min-w-0 items-center gap-2 cursor-pointer select-none rounded-sm text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          <ChevronRight
            className={`${flush ? '!size-4' : chevronSize[level]} shrink-0 text-muted-foreground transition-transform duration-200 ${open ? 'rotate-90' : ''}`}
          />
          <Tag className={flush ? 'text-xs font-semibold text-foreground' : levelStyles[level]}>
            {title}
          </Tag>
        </button>
        {open && headerLeft}
        {open && headerRight && <div className="flex shrink-0 items-center">{headerRight}</div>}
      </div>

      {/*
        Children stay mounted so the height can animate.

        `{open && children}` unmounted them, which meant there was nothing to
        transition - a section snapped from 170px to 50px in a single frame - and
        anything inside lost its state on the way. A two-row grid animating
        0fr <-> 1fr is what gets an auto-height transition without measuring
        anything in JS.

        The spacing above the content lives on the region rather than as a gap on
        the section, because a gap applies whether or not the row has height and
        a collapsed section would carry 8px of it.
      */}
      <div
        className={`grid transition-[grid-template-rows] duration-200 ease-out motion-reduce:transition-none ${
          fill && open ? 'flex-1 min-h-0' : ''
        }`}
        style={{ gridTemplateRows: open ? '1fr' : '0fr' }}
      >
        <div
          id={contentId}
          role="region"
          aria-labelledby={triggerId}
          // inert rather than hidden. `hidden` is display:none, which would kill
          // the transition the mounted children exist for; inert leaves the box
          // in the layout so it can animate, while taking the content out of the
          // tab order and the accessibility tree.
          inert={!open}
          className={`min-h-0 overflow-hidden pt-2 ${fill ? 'flex flex-col' : ''}`}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
