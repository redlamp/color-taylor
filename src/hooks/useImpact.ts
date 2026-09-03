import { useMemo } from 'react';

/**
 * Which readouts have moved since the pointer took hold of a control.
 *
 * The picker's point is that its controls are one colour seen several ways,
 * so dragging one should show which of the others it moves. This is the diff
 * behind that: while the pointer holds something, every key whose value
 * differs from what it showed at the press joins the set. Comparing against
 * the press rather than the previous frame is what keeps a highlight from
 * flickering when a value pauses mid-drag, and it makes the set a pure
 * function of state - nothing accumulates, nothing needs an effect.
 *
 * Nothing is excluded here. The held control's own key is in the set too, and
 * each consumer decides whether it wants itself lit - a slider does not, a
 * hexagon stem does.
 *
 * `values` must be memoised on its scalars: the memo keys off its identity.
 */
export interface Hold {
  /** What the pointer is on; see holdKeyOf. */
  key: string;
  /** The readouts as they were at the press. */
  base: Record<string, number>;
}

const EMPTY: ReadonlySet<string> = new Set();

export function useImpact(values: Record<string, number>, hold: Hold | null): ReadonlySet<string> {
  return useMemo(() => {
    if (!hold) return EMPTY;
    const set = new Set<string>();
    for (const k of Object.keys(values)) if (values[k] !== hold.base[k]) set.add(k);
    return set;
  }, [values, hold]);
}

/**
 * The control under the pointer, read from the nearest `data-hold` ancestor.
 *
 * Keys: `sl:<group>-<letter>` a slider track, `hex:<channels>` a stem or a
 * joint on the hexagon naming every channel it drives, `hue` the hue badge.
 * Anything else pressed counts as `other`, so the bars on the hexagon, its
 * open field and the SB box still light the sliders they move without a tag
 * each.
 */
export function holdKeyOf(target: EventTarget | null): string {
  const el = target instanceof Element ? target.closest<HTMLElement | SVGElement>('[data-hold]') : null;
  return el?.getAttribute('data-hold') || 'other';
}
