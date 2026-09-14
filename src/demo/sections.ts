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
 * `layoutSectionLabels` turns resolved marks into on-screen label boxes: one
 * row above the timeline, packed left to right, dropping a colliding label to
 * a second row and, failing that, truncating it with an ellipsis (the full
 * text is still available as a tooltip via the caller's `title`).
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

/** One laid-out label: pixel position, which of the two rows, and the text
 *  actually drawn (ellipsized when it would not otherwise fit). */
export interface SectionLabelLayout {
  mark: SectionMark;
  row: 0 | 1;
  leftPx: number;
  text: string;
  truncated: boolean;
}

const LABEL_FONT = '12px ui-monospace, Consolas, monospace';
/** Clearance kept between one label's measured end and the next label's start
 *  (or the row's own end, when truncating) before they read as colliding. */
const MIN_GAP = 10;

let measureCtx: CanvasRenderingContext2D | null | undefined;
function measure(text: string): number {
  if (measureCtx === undefined) {
    measureCtx = document.createElement('canvas').getContext('2d');
  }
  if (!measureCtx) return text.length * 7.2; // no canvas (jsdom etc.): a rough monospace estimate
  measureCtx.font = LABEL_FONT;
  return measureCtx.measureText(text).width;
}

/** Binary-search the longest prefix of `text` (plus an ellipsis) that fits in
 *  `maxWidth`. Never returns wider than `maxWidth` allows. */
function truncateToWidth(text: string, maxWidth: number): string {
  const ellipsis = '…';
  if (maxWidth <= 0) return '';
  if (measure(text) <= maxWidth) return text;
  if (measure(ellipsis) > maxWidth) return '';
  let lo = 0;
  let hi = text.length;
  while (lo < hi) {
    const mid = Math.ceil((lo + hi) / 2);
    if (measure(text.slice(0, mid) + ellipsis) <= maxWidth) lo = mid;
    else hi = mid - 1;
  }
  return lo > 0 ? text.slice(0, lo) + ellipsis : ellipsis;
}

/**
 * Lay out resolved section marks along a `containerWidth`-px timeline
 * (`duration` seconds wide): left-to-right, packed into up to two rows, with
 * a label that fits nowhere truncated to an ellipsis on the more open row.
 */
export function layoutSectionLabels(
  marks: SectionMark[],
  duration: number,
  containerWidth: number,
): SectionLabelLayout[] {
  if (!duration || !containerWidth || !marks.length) return [];
  const sorted = [...marks].sort((a, b) => a.t - b.t);
  const rowRight: [number, number] = [-Infinity, -Infinity];
  const out: SectionLabelLayout[] = [];
  sorted.forEach((mark, i) => {
    const leftPx = (mark.t / duration) * containerWidth;
    const width = measure(mark.label);
    if (leftPx >= rowRight[0] + MIN_GAP) {
      out.push({ mark, row: 0, leftPx, text: mark.label, truncated: false });
      rowRight[0] = leftPx + width;
      return;
    }
    if (leftPx >= rowRight[1] + MIN_GAP) {
      out.push({ mark, row: 1, leftPx, text: mark.label, truncated: false });
      rowRight[1] = leftPx + width;
      return;
    }
    // Collides with the last label on both rows: truncate on whichever row
    // has more room before the next label (or the timeline's own edge).
    const nextLeftPx = i + 1 < sorted.length ? (sorted[i + 1].t / duration) * containerWidth : containerWidth;
    const row: 0 | 1 = rowRight[0] <= rowRight[1] ? 0 : 1;
    const avail = Math.max(0, Math.min(nextLeftPx, containerWidth) - leftPx - MIN_GAP);
    const text = truncateToWidth(mark.label, avail);
    out.push({ mark, row, leftPx, text, truncated: text !== mark.label });
    rowRight[row] = leftPx + measure(text);
  });
  return out;
}

/** How many rows the layout actually used (1 or 2), for reserving height. */
export function labelRowCount(layout: SectionLabelLayout[]): 1 | 2 {
  return layout.some((l) => l.row === 1) ? 2 : 1;
}
