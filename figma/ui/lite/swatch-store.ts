/**
 * Swatch storage for the plugin, over figma.clientStorage.
 *
 * localStorage is not an option here: the plugin UI is a null-origin iframe and
 * touching it raises SecurityError, so the app's store silently loses every
 * write. clientStorage is the sanctioned equivalent, but it lives on the
 * sandbox side and is async, so this keeps a synchronous cache in front of it:
 *
 *   boot      cache is empty, readSwatch returns null, state falls back
 *   hydrate   code.js posts the stored blob, cache fills, SWATCHES_READY fires
 *   writes    update the cache and post to code.js to persist
 *
 * Writes before hydration are cached but not sent. Without that guard the
 * default state a component builds on an empty cache would immediately
 * overwrite the real data on its way in - the swatches would vanish on every
 * launch, which is worse than not persisting at all.
 */
export const SWATCHES_READY = 'color-taylor:swatches-ready';

let cache: Record<string, unknown> = {};
let hydrated = false;

window.addEventListener('message', (event: MessageEvent) => {
  const msg = event.data?.pluginMessage;
  if (!msg || msg.type !== 'swatches') return;
  cache = (msg.data as Record<string, unknown>) ?? {};
  hydrated = true;
  window.dispatchEvent(new Event(SWATCHES_READY));
});

export function readSwatch(key: string): unknown {
  return key in cache ? cache[key] : null;
}

export function writeSwatch(key: string, value: unknown): void {
  cache[key] = value;
  if (!hydrated) return;
  parent.postMessage({ pluginMessage: { type: 'saveSwatches', key, value } }, '*');
}
