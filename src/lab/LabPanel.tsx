/**
 * A lab page's card: a title, a `?` with the explanation behind it, an optional
 * one-line caption and an optional control at the right of the header.
 *
 * The CIE lab's numbered `Panel` is the original of this and stays where it
 * is - it sizes a figure to a grid cell, which this does not. This is the same
 * header for pages whose panels hold controls and readouts: the header never
 * wraps, so its height is the same in every panel and every state, and nothing
 * longer than one line is allowed to sit above the content. Longer goes in
 * `help`.
 */
import type { ReactNode } from 'react';
import HelpTip from './HelpTip';

export interface LabPanelProps {
  /** The panel's number in a grid of figures, as on the CIE page. */
  n?: number;
  title: string;
  help: ReactNode;
  /** A long explanation gets a wider card rather than a taller one. */
  helpWide?: boolean;
  /** The one line that stays visible. */
  caption?: ReactNode;
  /** A control for the header's right-hand end. */
  aside?: ReactNode;
  className?: string;
  children: ReactNode;
}

export default function LabPanel({ n, title, help, helpWide = false, caption, aside, className, children }: LabPanelProps) {
  return (
    <section className={`flex min-w-0 flex-col gap-3 rounded-lg border border-border bg-card p-3 ${className ?? ''}`}>
      <header className="flex shrink-0 flex-nowrap items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col">
          <h2 className="flex items-center gap-1.5 text-lg font-semibold text-foreground">
            {n !== undefined && <span className="tabular-nums text-muted-foreground">{n}</span>}
            <span className="truncate">{title}</span>
            <HelpTip label={`About ${title}`} className={helpWide ? 'max-w-[72ch]' : undefined}>{help}</HelpTip>
          </h2>
          {caption && <p className="truncate leading-snug text-muted-foreground">{caption}</p>}
        </div>
        {aside && <div className="flex shrink-0 items-start gap-1.5">{aside}</div>}
      </header>
      {children}
    </section>
  );
}
