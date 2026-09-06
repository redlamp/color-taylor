/**
 * Whether a control's tooltip should open from a pointer or a focus.
 *
 * Not on touch. A tap fires pointerenter and focus as well as click, so a
 * tooltip that opens on either is one nobody hovered - and on a phone the
 * popup opening threw the page to a new scroll position, which under the
 * demo's ghost read as the tap jumping. Two checks, because the demo drives
 * the controls with synthetic mouse events on a device that has no hover: the
 * event's own pointer type, and whether the device can hover at all. Keyboard
 * focus still opens a tooltip, through :focus-visible.
 */
export function tipFromPointer(e: { pointerType: string }): boolean {
  return e.pointerType !== 'touch' && deviceHovers();
}

export function tipFromFocus(el: Element): boolean {
  return el.matches(':focus-visible') && deviceHovers();
}

function deviceHovers(): boolean {
  return typeof window === 'undefined' || !window.matchMedia || window.matchMedia('(hover: hover)').matches;
}
