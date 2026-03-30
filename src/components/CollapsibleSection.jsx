import { useState } from 'react';
import { ChevronRight } from 'lucide-react';

const levelStyles = {
  h2: 'text-lg font-semibold tracking-tight text-foreground',
  h3: 'text-sm font-semibold uppercase tracking-wider text-muted-foreground',
};

export default function CollapsibleSection({ id, title, level = 'h3', defaultOpen = true, headerRight, className: extraClass, children }) {
  const [open, setOpen] = useState(defaultOpen);
  const Tag = level;

  return (
    <div id={id} className={`flex flex-col gap-1.5 ${level === 'h3' ? 'border border-input rounded-lg p-2.5' : ''} ${extraClass || ''}`}>
      <div
        className="flex items-center gap-1.5 cursor-pointer select-none"
        onClick={() => setOpen((o) => !o)}
      >
        <ChevronRight
          className={`!size-4 text-muted-foreground transition-transform duration-200 ${open ? 'rotate-90' : ''}`}
        />
        <Tag className={levelStyles[level]}>
          {title}
        </Tag>
        {open && headerRight && (
          <div className="ml-auto" onClick={(e) => e.stopPropagation()}>
            {headerRight}
          </div>
        )}
      </div>
      {open && level === 'h3' && <hr className="border-input" />}
      {open && children}
    </div>
  );
}
