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
 *  untruncated text. */
export interface SectionLabelLayout {
  mark: SectionMark;
  leftPx: number;
  text: string;
}

const LABEL_FONT_PX = 14;
const LABEL_FONT = `${LABEL_FONT_PX}px ui-monospace, Consolas, monospace`;
/** Line height of a label, pre-rotation. */
const LABEL_LINE_HEIGHT = 16;
/** Counterclockwise tilt applied to every label, like a spreadsheet column
 *  header: the left end stays pinned to the section's start marker and the
 *  text reads upward to the right. 30 degrees, per Taylor's Figma pass
 *  (node 172:1479, 2026-09-16); 15 collided at every width past 1600. */
export const LABEL_ANGLE_DEG = 30;
const LABEL_ANGLE_RAD = (LABEL_ANGLE_DEG * Math.PI) / 180;
/** A little slack above the tallest rotated label so its top isn't flush
 *  with the row's edge. */
const LABEL_ROW_PADDING = 2;

let measureCtx: CanvasRenderingContext2D | null | undefined;
function measure(text: string): number {
  if (measureCtx === undefined) {
    measureCtx = document.createElement('canvas').getContext('2d');
  }
  if (!measureCtx) return text.length * 7.2; // no canvas (jsdom etc.): a rough monospace estimate
  measureCtx.font = LABEL_FONT;
  return measureCtx.measureText(text).width;
}

/**
 * Lay out resolved section marks along a `containerWidth`-px timeline
 * (`duration` seconds wide): one label per mark, left end anchored at the
 * mark's own position, full text, no packing and no truncation — the
 * -15deg tilt applied by the caller is what keeps them from overlapping.
 */
export function layoutSectionLabels(
  marks: SectionMark[],
  duration: number,
  containerWidth: number,
): SectionLabelLayout[] {
  if (!duration || !containerWidth || !marks.length) return [];
  return [...marks]
    .sort((a, b) => a.t - b.t)
    .map((mark) => ({ mark, leftPx: (mark.t / duration) * containerWidth, text: mark.label }));
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
