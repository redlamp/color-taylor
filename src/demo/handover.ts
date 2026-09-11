/**
 * The one thing the two ghosts have to agree on: who has the screen.
 *
 * The script runner and the built-in demo each draw their own cursor, and for
 * the length of an `over: "demo"` action both are up. Two cursors read as a
 * glitch, so while such an action is in hand the script's ghost is the cursor
 * and the demo's is hidden - and the demo's own sign-off choreography (the
 * walk home and the colour tweening back) waits, so the gesture the script is
 * making is the only thing moving.
 *
 * A window event rather than a prop: the two components are mounted by the
 * same parent but neither owns the other, and this is a moment of the
 * recording rather than a piece of app state.
 */

const EVENT = 'color-taylor:script-over-demo';

/** The script runner, as an `over: "demo"` action starts and ends. */
export function setScriptOverDemo(on: boolean): void {
  window.dispatchEvent(new CustomEvent<boolean>(EVENT, { detail: on }));
}

/** The demo, for as long as it is mounted. Returns the unsubscribe. */
export function onScriptOverDemo(fn: (on: boolean) => void): () => void {
  const handler = (e: Event) => fn(!!(e as CustomEvent<boolean>).detail);
  window.addEventListener(EVENT, handler);
  return () => window.removeEventListener(EVENT, handler);
}

/**
 * Whether a video script runner is mounted at all.
 *
 * The demo's sign-off starts a fraction before the script's gesture over it
 * does, so "is the script drawing right now?" is asked too early to be true.
 * With a script on screen the goodbye gives it OVER_DEMO_GRACE_MS to speak up
 * before going ahead; with no script it never waits at all.
 */
let mounted = 0;
export function markScriptRunner(on: boolean): void {
  mounted = Math.max(0, mounted + (on ? 1 : -1));
}
export const scriptRunnerPresent = (): boolean => mounted > 0;

/** How long the goodbye waits to find out whether the script wants this moment. */
export const OVER_DEMO_GRACE_MS = 800;
