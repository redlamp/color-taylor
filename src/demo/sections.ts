/**
 * Section labels for presentation mode's transport.
 *
 * `public/scripts/<cut>-sections.json` (written by redlamp-videos'
 * cue tooling) names twelve or so sections of a cut, each anchored to a line
 * id ("3.1", or mid-beat like "11.2") rather than a time — the file has no
 * clock of its own, so a section's start is resolved against the cut's own
 * `<cut>-lines.json`, the same way a beat's start already is in
 * `PresentationMode.tsx`. A cut with no sections file (or a section whose
 * line id matches nothing in the lines file) yields no marks at all, and the
 * caller falls back to the beat markers it already draws.
 *
 * `layoutSectionLabels` turns resolved marks into on-screen label boxes: a
 * single row above the timeline, each label's left end anchored at its
 * section's start marker and the whole label rotated -15deg (counterclockwise,
 * like a spreadsheet column header) about that anchor so the text reads
 * upward to the right. `labelRowHeight` sizes that row to fit the tallest
 * (i.e. widest, pre-rotation) label at that angle.
 */

/** One entry of `<cut>-sections.json`. */
export interface Section {
  id: number;
  label: string;
  /** A line id, "beat.line" — where the section starts, possibly mid-beat. */
  line: string;
}

interface SectionsFile {
  source?: string;
  sections?: Section[];
}

/** A section resolved to a time, in playback order. */
export interface SectionMark {
  id: number;
  label: string;
  t: number;
}

/** Fetch `<base>-sections.json`, or `[]` if the file is missing or malformed. */
export async function loadSections(base: string, bust: string): Promise<Section[]> {
  const res = await fetch(`${base}-sections.json${bust}`);
  if (!res.ok) return [];
  const data = (await res.json()) as SectionsFile;
  return Array.isArray(data.sections) ? data.sections : [];
}

/**
 * Resolve each section's `line` id against the lines file (`beat.line` ids,
 * as `ClipEditor` and the timeline's spans already key on). A section whose
 * id matches no line is dropped rather than guessed at.
 */
export function resolveSectionMarks(
  sections: Section[],
  lines: { beat: number; line: number; start: number }[],
): SectionMark[] {
  const marks: SectionMark[] = [];
  for (const s of sections) {
    const match = lines.find((l) => `${l.beat}.${l.line}` === s.line);
    if (match) marks.push({ id: s.id, label: s.label, t: match.start });
  }
  return marks.sort((a, b) => a.t - b.t);
}

/** One laid-out label: pixel position (its rotation anchor) and the full,
 *  untruncated text. `leftPx` is the anchor after collision resolution has
 *  possibly moved it off its section's start; `anchorPx` keeps the original
 *  section-start position, unused today but there for a future leader line
 *  back to the tick it was pushed off of. */
export interface SectionLabelLayout {
  mark: SectionMark;
  leftPx: number;
  anchorPx: number;
  text: string;
}

const LABEL_FONT_PX = 14;
const LABEL_FONT = `${LABEL_FONT_PX}px ui-monospace, Consolas, monospace`;
/** Line height of a label, pre-rotation. */
const LABEL_LINE_HEIGHT = 16;
/** Counterclockwise tilt applied to every label, like a spreadsheet column
 *  header: the left end stays pinned to the section's start marker and the
 *  text reads upward to the right. 45 degrees (Taylor, 2026-09-16, after
 *  trying 15 and 30): the steeper the tilt, the less of the track each label
 *  takes, and the overlap push below has less to do. */
export const LABEL_ANGLE_DEG = 45;
const LABEL_ANGLE_RAD = (LABEL_ANGLE_DEG * Math.PI) / 180;
/** A little slack above the tallest rotated label so its top isn't flush
 *  with the row's edge. */
const LABEL_ROW_PADDING = 2;

let measureCtx: CanvasRenderingContext2D | null | undefined;
function measure(text: string): number {
  if (measureCtx === undefined) {
    // `bun test` runs sections.ts with no DOM at all (no jsdom shim), not
    // just a canvas-less one, so guard the global itself rather than only
    // the context it would return.
    measureCtx = typeof document === 'undefined' ? null : document.createElement('canvas').getContext('2d');
  }
  if (!measureCtx) return text.length * 7.2; // no canvas (bun test, jsdom, etc.): a rough monospace estimate
  measureCtx.font = LABEL_FONT;
  return measureCtx.measureText(text).width;
}

/** Minimum horizontal gap (px) between two labels' extents. Negative on
 *  purpose: an extent is the rotated text's bounding box, and at 45 degrees
 *  that box overstates the glyphs by a good margin at each end, so boxes
 *  may overlap by this much before the letters themselves come close.
 *  Taylor's call, 2026-09-16, after 6 and 2 read as too spread. Exported for
 *  the test, which computes its expectations from the same numbers. */
export const LABEL_MIN_GAP = -8;
/** Passes the overlap-resolution loop below will make before giving up.
 *  A push can open a new overlap with the next neighbour, so one pass isn't
 *  enough in general, but Taylor's row of ~12 sections settles in far fewer
 *  than this. */
const LABEL_RESOLVE_PASSES = 12;

/** How far right of its anchor a label of unrotated width `w` reaches once
 *  tilted `LABEL_ANGLE_DEG` about its bottom-left corner: the text run's own
 *  horizontal reach plus the sliver the line height contributes at that
 *  angle. */
function labelExtent(w: number): number {
  return w * Math.cos(LABEL_ANGLE_RAD) + LABEL_LINE_HEIGHT * Math.sin(LABEL_ANGLE_RAD);
}

/**
 * Lay out resolved section marks along a `containerWidth`-px timeline
 * (`duration` seconds wide): one label per mark, anchored at the mark's own
 * position, full text, no truncation. The tilt keeps most neighbours clear
 * of each other, but a run of short sections (or a long label butting a
 * short one) can still overlap, so afterward each pair is pushed apart —
 * left label left, right label right, split evenly — the way Taylor called
 * it out on the Figma pass: "Figma moves left a little, Outro moves right a
 * little, until they're no longer overlapped." Ticks are untouched; only
 * the label text moves off its anchor.
 */
export function layoutSectionLabels(
  marks: SectionMark[],
  duration: number,
  containerWidth: number,
): SectionLabelLayout[] {
  if (!duration || !containerWidth || !marks.length) return [];
  const sorted = [...marks].sort((a, b) => a.t - b.t);
  const layouts = sorted.map((mark) => {
    const anchorPx = (mark.t / duration) * containerWidth;
    return { mark, leftPx: anchorPx, anchorPx, text: mark.label, extent: labelExtent(measure(mark.label)) };
  });

  // Repeated left-to-right sweep: a push to resolve one pair can reopen (or
  // create) an overlap with the next, so keep sweeping until a full pass
  // makes no change or the pass cap is hit.
  for (let pass = 0; pass < LABEL_RESOLVE_PASSES; pass++) {
    let moved = false;
    for (let i = 0; i < layouts.length - 1; i++) {
      const left = layouts[i];
      const right = layouts[i + 1];
      const overlap = left.leftPx + left.extent + LABEL_MIN_GAP - right.leftPx;
      if (overlap > 0) {
        left.leftPx -= overlap / 2;
        right.leftPx += overlap / 2;
        moved = true;
      }
    }
    if (!moved) break;
  }

  // Clamp to the track: the first label can't start left of it and the last
  // can't reach past its right edge. Each clamp only ever moves its own
  // label inward, which can reopen an overlap with its neighbour, so each
  // is followed by a one-directional repair sweep away from the edge that
  // moved — right-to-left off the right clamp, left-to-right off the left
  // clamp — rather than the two-directional overlap loop above, which would
  // just push a clamped label back out past the edge it was pinned to. Two
  // rounds: a repair sweep can itself push the far end past its edge again
  // (a short track with several wide labels), so the second round catches
  // that before the pass cap gives up.
  for (let round = 0; round < 2 && layouts.length; round++) {
    const last = layouts[layouts.length - 1];
    const rightEdge = last.leftPx + last.extent;
    if (rightEdge > containerWidth) {
      last.leftPx -= rightEdge - containerWidth;
      for (let i = layouts.length - 1; i > 0; i--) {
        const left = layouts[i - 1];
        const right = layouts[i];
        const overlap = left.leftPx + left.extent + LABEL_MIN_GAP - right.leftPx;
        if (overlap > 0) left.leftPx -= overlap;
      }
    }
    const first = layouts[0];
    if (first.leftPx < 0) {
      first.leftPx = 0;
      for (let i = 0; i < layouts.length - 1; i++) {
        const left = layouts[i];
        const right = layouts[i + 1];
        const overlap = left.leftPx + left.extent + LABEL_MIN_GAP - right.leftPx;
        if (overlap > 0) right.leftPx += overlap;
      }
    }
  }

  return layouts.map(({ mark, leftPx, anchorPx, text }) => ({ mark, leftPx, anchorPx, text }));
}

/**
 * Height (px) the single label row needs so that the widest label, rotated
 * -15deg about its bottom-left corner, isn't clipped at the top. Computed
 * from the tallest rotated bounding box among all marks, not just the
 * longest string, since font metrics aren't strictly monotonic in length.
 */
export function labelRowHeight(marks: SectionMark[]): number {
  if (!marks.length) return 0;
  const maxWidth = Math.max(...marks.map((m) => measure(m.label)));
  const rotatedHeight = maxWidth * Math.sin(LABEL_ANGLE_RAD) + LABEL_LINE_HEIGHT * Math.cos(LABEL_ANGLE_RAD);
  return Math.ceil(rotatedHeight) + LABEL_ROW_PADDING;
}
