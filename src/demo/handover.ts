/**
 * The one thing the two ghosts have to agree on: who has the screen, and
 * where the one going out of it was standing.
 *
 * The script runner and the built-in demo each draw their own cursor, and for
 * the length of an `over: "demo"` action both are up. Two cursors read as a
 * glitch, so while such an action is in hand the script's ghost is the cursor
 * and the demo's is hidden - and the demo's own sign-off choreography (the
 * walk home and the colour tweening back) waits, so the gesture the script is
 * making is the only thing moving.
 *
 * The cut hands the cursor over four times - the script's ghost clicks the ?
 * and the demo's takes it, the script's comes back out for the "Have fun!"
 * underline, the demo's takes it again for the goodbye, and the script's has
 * it from the demo's exit to the end - and every one of them has to look like
 * one hand, not two. So each side reports where its cursor is every frame and
 * the one arriving is placed on the one leaving. Reported rather than passed:
 * the two components are mounted by the same parent but neither owns the
 * other, and the last position has to outlive the component that had it (the
 * demo unmounts at its exit, and that exit is a handover).
 *
 * A window event rather than a prop for the over-demo flag, for the same
 * reason: it is a moment of the recording rather than a piece of app state.
 */

const EVENT = 'color-taylor:script-over-demo';

/** Client pixels. Declared here rather than imported so this stays leaf-level. */
export interface CursorPoint { x: number; y: number }

/** The two cursors, by the component that draws each. */
export type CursorOwner = 'ghost' | 'demo';

/**
 * Where each cursor last was, and whether it is currently drawn.
 *
 * A position is never cleared, only overwritten: the demo's last point is
 * read *after* it unmounts, which is exactly the moment the script's ghost
 * needs it.
 */
const at: Record<CursorOwner, CursorPoint | null> = { ghost: null, demo: null };
/**
 * And where each cursor last was while it was still in the window.
 *
 * The last position and the last *visible* position are not the same point,
 * and the handover wants the visible one. Both ends of the demo walk off
 * screen: its sign-off takes its cursor out through the edge below the fold,
 * so the point it leaves behind is a hundred-odd pixels past the bottom of
 * the window. Seeding the script's ghost there meant the first gesture after
 * the demo flew in from off screen - a long trip at whatever speed its `ms`
 * implied, which read as the hand jetting rather than reaching (Taylor,
 * round 5, on beat 2.9). Picked up from where the hand was last *seen*, the
 * same gesture is a move across the screen at a hand's pace.
 */
const seen: Record<CursorOwner, CursorPoint | null> = { ghost: null, demo: null };
const drawn: Record<CursorOwner, boolean> = { ghost: false, demo: false };
let overDemo = false;

/**
 * Inside the window, with nothing to spare. The cursor is drawn with its
 * hotspot on this point, so a point on the edge is a cursor the viewer can
 * still see - and a slack of even a few pixels defeats the whole thing, since
 * an exit walks out through the edge one frame at a time and the last frame
 * inside the slack is as good as off screen.
 */
const onScreen = (p: CursorPoint) =>
  p.x >= 0 && p.y >= 0 && p.x <= window.innerWidth && p.y <= window.innerHeight;

/** Every frame, from whichever component draws that cursor. */
export function reportCursor(who: CursorOwner, p: CursorPoint): void {
  at[who] = { x: p.x, y: p.y };
  if (onScreen(p)) seen[who] = { x: p.x, y: p.y };
}

/** As a cursor's component mounts and unmounts. */
export function markCursor(who: CursorOwner, on: boolean): void {
  drawn[who] = on;
}

/** Where `who` last stood, or null if it has never been on screen this session. */
export const cursorPos = (who: CursorOwner): CursorPoint | null => at[who];

/**
 * Which cursor the viewer is looking at: the demo's while it is mounted,
 * except for the span of an `over: "demo"` gesture, when the script's ghost
 * is out and the demo's is hidden. Null before either is up.
 */
export function liveCursor(): CursorOwner | null {
  if (drawn.demo && !overDemo) return 'demo';
  if (drawn.ghost) return 'ghost';
  return drawn.demo ? 'demo' : null;
}

/**
 * Where a cursor about to become live should start: on top of the one it is
 * taking over from. Null when nothing was on screen to take over from, which
 * is the cue to fall back to a walk-on from off screen.
 */
/**
 * Named override: cut 04's 10.5 -> 10.6 handover. The demo's sign-off starts
 * its own walk/fade the moment its countdown begins, so a script gesture
 * that claims the screen after that moment seeds from the exit point, not
 * the resting one. cut-04-actions-extra.json arms a zero-offset `drift`
 * cue at the top of 10.6 - `over: "demo"` - purely so ScriptRunner's
 * generic handover (below) fires before the demo has moved anything. No
 * code branches on this; it is named here so the cue and the mechanism it
 * leans on are grep-able as one fix, and it touches no other transition.
 */
export function handoverPoint(to: CursorOwner): CursorPoint | null {
  const from: CursorOwner = to === 'demo' ? 'ghost' : 'demo';
  // The last point it was seen at, not the last point it was at: see `seen`.
  return seen[from] ?? at[from];
}

/** The script runner, as an `over: "demo"` action starts and ends. */
export function setScriptOverDemo(on: boolean): void {
  overDemo = on;
  window.dispatchEvent(new CustomEvent<boolean>(EVENT, { detail: on }));
}

/** The demo, for as long as it is mounted. Returns the unsubscribe. */
export function onScriptOverDemo(fn: (on: boolean) => void): () => void {
  const handler = (e: Event) => fn(!!(e as CustomEvent<boolean>).detail);
  window.addEventListener(EVENT, handler);
  return () => window.removeEventListener(EVENT, handler);
}

const HOLD_COLOUR = 'color-taylor:hold-colour';

/** An HSB colour, as the app reads it. Declared here to keep this leaf-level. */
export interface Hsb { h: number; s: number; b: number }

/**
 * The demo, as its sign-off hands the colour back while the script has the
 * screen: "leave the colour where I am leaving it."
 *
 * The demo's ending restores the app to the snapshot it took when it opened -
 * the sections, the banks, the blend, and the colour. Under the presentation
 * the first three are wanted and the last is not: beat 10.6 is Taylor saying
 * "having fun is the goal of the tool" over a colour the ghost put there, and
 * the restore jumped it to something no cursor had touched (Taylor, round 5,
 * cut 04). The restore itself belongs to the app, which this side does not
 * own, so the demo says what the colour was and the runner - which has the
 * app's own colour setter, and whose tween supersedes the restore's in the
 * same tick - puts it straight back. Nothing else about the demo changes.
 */
export function holdColour(hsb: Hsb): void {
  window.dispatchEvent(new CustomEvent<Hsb>(HOLD_COLOUR, { detail: hsb }));
}

/** The script runner, for as long as it is mounted. Returns the unsubscribe. */
export function onHoldColour(fn: (hsb: Hsb) => void): () => void {
  const handler = (e: Event) => fn((e as CustomEvent<Hsb>).detail);
  window.addEventListener(HOLD_COLOUR, handler);
  return () => window.removeEventListener(HOLD_COLOUR, handler);
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

/* ── The camera panel's opening state ─────────────────────────────────────
 *
 * The other thing the two sides have to agree on, and for the same reason as
 * the cursor: the panel is drawn by WebcamPip and moved by ScriptRunner, the
 * two mount independently, and which of them is up first is a race between a
 * lazy chunk and a fetch.
 *
 * A cut whose first `pip` cue drags the panel *on* opens with it off screen.
 * The runner knows that as soon as it has the cut; the panel paints as soon
 * as its own module has loaded. Whichever way round those land, the viewer
 * must never see the panel sitting at home in a cut that opens without it -
 * which is exactly what Taylor saw on the shipped path, a panel in the corner
 * for the moment before the hand reached off the right edge for it.
 *
 * So the runner states the opening here and it sticks, and the panel reads it
 * as it mounts: reported rather than passed, because neither component owns
 * the other and the statement has to outlive the order they arrive in.
 */

/** How much past the right edge the panel sits once it is off screen. */
export const PIP_OFF_CLEAR = 8;
/** How much lower the panel's off-screen resting position sits than home. */
export const PIP_OFF_DROP = 80;

/**
 * How far the camera panel is currently pushed off its home position, and how
 * to put it there. Kept on the element rather than in the schedule, so a seek
 * can set it without replaying the drag, and so the panel's own markup is the
 * only thing that knows how it is moved.
 */
export const pipOffset = (el: HTMLElement): CursorPoint => ({
  x: Number(el.dataset.pipX ?? '0') || 0,
  y: Number(el.dataset.pipY ?? '0') || 0,
});
export function setPipOffset(el: HTMLElement, x: number, y = 0): void {
  el.dataset.pipX = String(Math.round(x));
  el.dataset.pipY = String(Math.round(y));
  el.style.transform = `translate(${Math.round(x)}px, ${Math.round(y)}px)`;
}

/**
 * Put the panel off screen or at home at once, with no gesture. False when
 * the panel is not in the document yet, which is the caller's cue to ask
 * again on the next frame.
 */
export function parkPip(off: boolean): boolean {
  const el = document.getElementById('camera-pip');
  if (!el) return false;
  // Home is where the panel sits with no offset on it.
  const home = el.getBoundingClientRect().left - pipOffset(el).x;
  setPipOffset(el, off ? window.innerWidth - home + PIP_OFF_CLEAR : 0, off ? PIP_OFF_DROP : 0);
  return true;
}

/** Where the panel stands when the cut opens. */
export type PipOpening = 'off' | 'home';

const PIP_OPENING = 'color-taylor:pip-opening';
let opening: PipOpening | null = null;

/** The runner, as its schedule comes up: this is how the cut opens. */
export function setPipOpening(state: PipOpening): void {
  opening = state;
  parkPip(state === 'off');
  window.dispatchEvent(new CustomEvent<PipOpening>(PIP_OPENING, { detail: state }));
}

/** What the runner said, or null if no runner has said anything yet. */
export const pipOpening = (): PipOpening | null => opening;

/** The panel, for as long as it is mounted. Returns the unsubscribe. */
export function onPipOpening(fn: (state: PipOpening) => void): () => void {
  const handler = (e: Event) => fn((e as CustomEvent<PipOpening>).detail);
  window.addEventListener(PIP_OPENING, handler);
  return () => window.removeEventListener(PIP_OPENING, handler);
}

/**
 * How long the panel waits for a runner to say how the cut opens before
 * showing itself anyway. Long enough for the cut's JSON to arrive over a dev
 * server, short enough that a page with no runner at all - `?webcam=live`,
 * a cut whose script failed to load - is not left staring at nothing.
 */
export const PIP_OPENING_GRACE_MS = 1500;
