/**
 * Whether this screen can actually show the colours outside the sRGB triangle.
 *
 * The lab pages draw gamuts wider than sRGB, and until now everything painted
 * inside them was still an sRGB pixel - so a P3 outline enclosed colours the
 * screen could not reach and the picture quietly implied otherwise. Chromium
 * and Safari can do better, on hardware that can: a 2D canvas opened with
 * `{ colorSpace: 'display-p3' }` and a WebGL context with
 * `drawingBufferColorSpace = 'display-p3'` both render the wider primaries at
 * full width, and `color(display-p3 ...)` does the same in CSS.
 *
 * DETECTED, NEVER ASSUMED, AND SAID OUT LOUD. `(color-gamut: p3)` is what the
 * browser reports about the display it is on. Whether it is true is a fact
 * about the reader's hardware, not about this page, and it changes what the
 * page means: the same picture is either honest or clamped depending on the
 * screen. So the answer is put on the page as a line of copy rather than kept
 * as a diagnostic - somebody opening the standalone build on an sRGB laptop
 * should be told, not misled.
 *
 * Read once, at module load. A display can in principle change under a window
 * being dragged between two monitors, and re-detecting on every frame would
 * cost a media query per paint to catch something that happens once a week; a
 * reload is the honest price.
 */

/** True when the browser says this display covers Display P3. */
export const DISPLAY_IS_P3: boolean = (() => {
  try {
    return typeof window !== 'undefined'
      && typeof window.matchMedia === 'function'
      && window.matchMedia('(color-gamut: p3)').matches;
  } catch {
    return false;
  }
})();

/** The colour space to open a canvas or a drawing buffer in. */
export const CANVAS_SPACE: 'srgb' | 'display-p3' = DISPLAY_IS_P3 ? 'display-p3' : 'srgb';

/**
 * A 2D context in the widest space this screen supports.
 *
 * `colorSpace` is ignored by browsers that do not know it, and a browser that
 * knows it but is on an sRGB screen gives a display-p3 buffer that the
 * compositor then squeezes - so the option is only asked for when the display
 * says it is worth asking for.
 */
export function get2dContext(canvas: HTMLCanvasElement): CanvasRenderingContext2D | null {
  if (DISPLAY_IS_P3) {
    const wide = canvas.getContext('2d', { colorSpace: 'display-p3' });
    if (wide) return wide;
  }
  return canvas.getContext('2d');
}
