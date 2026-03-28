import { useState } from 'react';
import { ChevronRight } from 'lucide-react';

export default function CollapsibleSection({ id, title, defaultOpen = true, headerRight, children }) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div id={id} className="flex flex-col gap-1.5">
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          className="flex items-center gap-1.5 cursor-pointer select-none text-left"
          onClick={() => setOpen((o) => !o)}
        >
          <ChevronRight
            className={`!size-4 text-muted-foreground transition-transform duration-200 ${open ? 'rotate-90' : ''}`}
          />
          <span className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            {title}
          </span>
        </button>
        {open && headerRight && (
          <div className="ml-auto" onClick={(e) => e.stopPropagation()}>
            {headerRight}
          </div>
        )}
      </div>
      {open && children}
    </div>
  );
}
