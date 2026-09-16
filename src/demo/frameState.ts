/**
 * The one place the rest of `src/demo` reads the frame layer from.
 *
 * Frames.tsx owns the transform on the app root; the ghost's speed cap
 * (ScriptRunner) and the camera panel's home corner (WebcamPip) both have to
 * know about it, and neither should import the layer itself - Frames.tsx
 * imports from ScriptRunner, so a reverse import would be a cycle. A module of
 * plain state with a subscription is the whole of it.
 *
 * When no frame layer is mounted - which is every URL without `frames=`, and
 * every production build - the scale is 1 and the capture box is null, so the
 * readers behave exactly as they did before frames existed.
 *
 * The transport bar's own height lives here too, for the same reason: the
 * camera panel's home corner has to stay clear of it, and PresentationMode.tsx
 * (which owns the bar) shouldn't be imported by WebcamPip.tsx just for one
 * number. It shares this module's subscription - a `setTransportHeight` call
 * notifies the same listeners a frame-state change does.
 */

/** The rectangle of the viewport the capture will keep, in client px. */
export interface CaptureBox {
  left: number;
  top: number;
  width: number;
  height: number;
}

let scale = 1;
let box: CaptureBox | null = null;
let transportH = 0;
let barLeavingNow = false;
const listeners = new Set<() => void>();

/**
 * How much the frame layer is magnifying the page right now. 1 with no frame
 * layer, and 1 while the layer is showing the whole app.
 *
 * The ghost's ceiling is in page px, so a page scaled by `s` puts the hand on
 * screen `s` times faster than the cue asked for. Divide the cap by this.
 */
export const frameScale = () => scale;

/** Where the capture box is, or null when nothing is framing the page. */
export const captureBox = () => box;

/** Told whenever either of the two above changes. Returns an unsubscribe. */
export function onFrameChange(fn: () => void): () => void {
  listeners.add(fn);
  return () => { listeners.delete(fn); };
}

/** Frames.tsx only: publish the layer's current state. */
export function setFrameState(next: { scale: number; box: CaptureBox | null }) {
  if (next.scale === scale
    && box?.left === next.box?.left && box?.top === next.box?.top
    && box?.width === next.box?.width && box?.height === next.box?.height) return;
  scale = next.scale;
  box = next.box;
  listeners.forEach((fn) => fn());
}

/** The transport bar's current on-screen height, in client px. 0 before it
 *  has measured itself. */
export const transportHeight = () => transportH;

/** PresentationMode.tsx only: publish the transport bar's measured height. */
export function setTransportHeight(next: number) {
  if (next === transportH) return;
  transportH = next;
  listeners.forEach((fn) => fn());
}

/**
 * True while the shipped walkthrough is sliding its bar out and has not yet
 * told the host to unmount. The camera panel fades on the same 300ms so the
 * two leave together rather than the panel vanishing under a bar still on
 * screen - the same reason the bar's height lives here: the panel and the bar
 * are siblings under ColorPicker and neither should import the other.
 */
export const barLeaving = () => barLeavingNow;

/** PresentationMode.tsx only: the bar has started its way out (or is back). */
export function setBarLeaving(next: boolean) {
  if (next === barLeavingNow) return;
  barLeavingNow = next;
  listeners.forEach((fn) => fn());
}
