/**
 * Where a frame went, printed to the console, behind `?perf`.
 *
 * The lab draws four figures off one colour, and three of them are expensive:
 * a per-pixel canvas, a 7,380-vertex mesh and a WebGL solid of up to 16.7
 * million points. When a drag on the hexagon feels wrong, the question is
 * always the same one - which of them is on the input path and what is it
 * costing - and bisecting a layout to find out is not a method anyone should
 * have to repeat.
 *
 * So: add `?perf` to any lab URL and every frame that did work prints one
 * line naming the work. The same switch style as `?fps`, which turns on the
 * frame-rate meter - see the root CLAUDE.md - and off by default, so the page
 * is quiet unless someone is asking.
 *
 *     [perf] 18.4ms frame · solid 12.1 (1) · morph mesh 4.6 (1) · morph draw 0.9 (1)
 *
 * The leading figure is wall-clock since the previous line, so it is the real
 * frame interval rather than a sum of the parts; the parts are what was
 * measured inside it, with a count in brackets because "ran twice in one
 * frame" is usually the finding. A frame that does nothing prints nothing.
 *
 * `perfTime` is a wrapper rather than a pair of calls so an early return or a
 * throw cannot leave a bucket open, and it compiles down to calling the
 * function when the switch is off.
 */

/** Read once: a query parameter does not change under a running page. */
export const PERF: boolean = (() => {
  try {
    return typeof location !== 'undefined' && new URLSearchParams(location.search).has('perf');
  } catch {
    return false;
  }
})();

interface Bucket {
  ms: number;
  n: number;
}

const buckets = new Map<string, Bucket>();
let flushing = 0;
let last = 0;

function flush() {
  flushing = 0;
  if (!buckets.size) return;
  const now = performance.now();
  const frame = last ? now - last : 0;
  last = now;
  const parts = [...buckets.entries()]
    .sort((a, b) => b[1].ms - a[1].ms)
    .map(([name, b]) => `${name} ${b.ms.toFixed(1)}${b.n > 1 ? ` (${b.n})` : ''}`);
  buckets.clear();
  console.log(`[perf] ${frame.toFixed(1)}ms frame · ${parts.join(' · ')}`);
}

function add(name: string, ms: number) {
  const b = buckets.get(name);
  if (b) { b.ms += ms; b.n += 1; } else { buckets.set(name, { ms, n: 1 }); }
  // Flushed a frame later, so everything one paint did lands on one line.
  if (!flushing) flushing = requestAnimationFrame(flush);
}

/** Time `fn` into `name`'s bucket. A no-op wrapper when `?perf` is absent. */
export function perfTime<T>(name: string, fn: () => T): T {
  if (!PERF) return fn();
  const t0 = performance.now();
  try {
    return fn();
  } finally {
    add(name, performance.now() - t0);
  }
}

/** Record a duration measured elsewhere - a GPU fence, an event handler. */
export function perfMark(name: string, ms: number): void {
  if (PERF) add(name, ms);
}
