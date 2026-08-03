import { useState, type ReactNode } from 'react';
import { ChevronRight } from 'lucide-react';

type Level = 'h2' | 'h3';

const levelStyles: Record<Level, string> = {
  h2: 'text-lg font-semibold tracking-tight text-foreground',
  h3: 'text-sm font-semibold uppercase tracking-wider text-muted-foreground',
};

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
  const shell = flush
    ? 'border-t border-input pt-2'
    : level === 'h3'
      ? 'border border-input rounded-lg p-2.5'
      : '';

  return (
    <div id={id} className={`flex flex-col gap-1.5 ${shell} ${extraClass || ''}`}>
      <div
        role="button"
        tabIndex={0}
        aria-expanded={open}
        className={`flex items-center gap-1.5 cursor-pointer select-none ${flush ? 'h-8' : ''}`}
        onClick={() => setOpen((o) => !o)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setOpen((o) => !o);
          }
        }}
      >
        <ChevronRight
          className={`!size-4 text-muted-foreground transition-transform duration-200 ${open ? 'rotate-90' : ''}`}
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
      {open && !flush && level === 'h3' && <hr className="border-input" />}
      {open && children}
    </div>
  );
}
