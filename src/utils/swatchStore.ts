/**
 * Where Recent and Saved swatches live.
 *
 * A seam rather than direct localStorage calls, because the two hosts cannot
 * share one mechanism. The app has localStorage. The Figma plugin's UI is a
 * null-origin iframe, where touching localStorage raises SecurityError - so
 * every read there fails and nothing has ever survived closing the panel. The
 * plugin aliases this module to a version backed by figma.clientStorage.
 *
 * Reads are synchronous because React state initializers are. The plugin's
 * store cannot be - clientStorage is async - so it starts empty and announces
 * SWATCHES_READY once the real data arrives. Anything holding swatch state
 * listens for that and re-reads.
 */

/** Fired when an async store has finished loading. Never fired here. */
export const SWATCHES_READY = 'color-taylor:swatches-ready';

/** Parsed JSON for `key`, or null if absent, unreadable or malformed. */
export function readSwatch(key: string): unknown {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function writeSwatch(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage unavailable - nothing to fall back to in the app */
  }
}
