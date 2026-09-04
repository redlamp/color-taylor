/**
 * The handshake that lets the demo open a panel the user had closed.
 *
 * A collapsed section keeps its children mounted - it has to, or there is no
 * height to animate and anything inside loses its state - so the demo's usual
 * guard does not catch it. `document.querySelector('#sb-area')` returns a real
 * element with a real rect inside a clipped, zero-height row, and the script
 * happily drives a control nobody can see: the colour lands correctly and the
 * ghost traces a careful pattern over a closed panel.
 *
 * So the demo asks for what it needs and puts it back, which is the same
 * contract it already has with the colour itself. Window events rather than
 * lifted state because the open flags are deliberately local - one is module
 * scope in CollapsibleSection, the other is the hexagon's own - and
 * `color-taylor:reset-all` established the pattern of each owner handling its
 * own affairs.
 *
 * Sections respond by id. Only the two the script actually works in are named,
 * because opening every section on the page would rearrange the whole tool to
 * demonstrate two corners of it.
 */

/** Open these, remembering what you were. `detail.ids` names who this is for. */
export const DEMO_OPEN = 'color-taylor:demo-open';
/** Go back to however you were when the last DEMO_OPEN arrived. */
export const DEMO_RESTORE = 'color-taylor:demo-restore';

/** The hexagon panel collapses on its own state rather than through CollapsibleSection. */
export const HEXAGON_SECTION = 'hexagon';

/** Everything the script touches lives in one of these two. */
export const DEMO_SECTIONS = [HEXAGON_SECTION, 'color-editor-group'];

/** True when this event is addressed to `id`. */
export function addressedTo(e: Event, id: string): boolean {
  return ((e as CustomEvent<{ ids?: string[] }>).detail?.ids ?? []).includes(id);
}

export function openDemoSections(): void {
  window.dispatchEvent(new CustomEvent(DEMO_OPEN, { detail: { ids: DEMO_SECTIONS } }));
}

export function restoreDemoSections(): void {
  window.dispatchEvent(new Event(DEMO_RESTORE));
}
