/**
 * Word-level captions: grouping a cut's word timings into small read-along
 * chunks, HyperFrames-style, rather than showing a whole line at once.
 *
 * Source is `public/scripts/<name>-words.json` (copied from the master's
 * `<cut>.words.json`, seconds match the cut's own voice track): an array of
 * `{ text, start, end }` word timings. When that file is missing, the caller
 * falls back to the line-text caption (`captionAt` in `PresentationMode.tsx`).
 */

/** One word's timing, in the cut's own seconds. */
export interface CaptionWord {
  text: string;
  start: number;
  end: number;
}

/** The span a chunk must not cross — a script line's own start/end. */
interface LineSpan {
  start: number;
  end: number;
}

/** A small group of words shown together, read-along style. */
export interface CaptionChunk {
  id: string;
  words: CaptionWord[];
  start: number;
  end: number;
}

/** A chunk holds at most this many words... */
const MAX_WORDS = 6;
/** ...and spans at most this long, start of its first word to end of its last. */
const MAX_SPAN_S = 2.4;
/** A word ending in one of these is a preferred break point: the chunk closes
 *  right after it even though it hasn't hit the caps above, so a chunk reads
 *  as a phrase rather than an arbitrary slice. */
const PUNCT_RE = /[.,!?;:—-]$/;

/**
 * Groups `words` into chunks, walking one script line at a time so a chunk
 * never crosses a line boundary. Within a line, greedily fills a chunk up to
 * `MAX_WORDS`/`MAX_SPAN_S`, breaking early right after a word that ends in
 * punctuation once the chunk has at least two words.
 */
export function buildCaptionChunks(words: CaptionWord[], lines: LineSpan[]): CaptionChunk[] {
  if (!words.length || !lines.length) return [];
  const sortedLines = [...lines].sort((a, b) => a.start - b.start);
  const chunks: CaptionChunk[] = [];
  let current: CaptionWord[] = [];
  let chunkIdx = 0;

  const flush = () => {
    if (!current.length) return;
    chunks.push({
      id: `c${chunkIdx++}`,
      words: current,
      start: current[0].start,
      end: current[current.length - 1].end,
    });
    current = [];
  };

  for (const line of sortedLines) {
    const lineWords = words
      .filter((w) => w.start >= line.start && w.start < line.end)
      .sort((a, b) => a.start - b.start);
    for (const word of lineWords) {
      const tentative = [...current, word];
      const span = word.end - tentative[0].start;
      if (current.length > 0 && (tentative.length > MAX_WORDS || span > MAX_SPAN_S)) {
        flush();
        current = [word];
      } else {
        current = tentative;
      }
      if (current.length >= 2 && PUNCT_RE.test(word.text)) flush();
    }
    flush(); // a chunk never crosses a line boundary
  }
  return chunks;
}

/** How long a gap after a chunk still shows it, fully filled, before blanking
 *  rather than leave stale text up through a pause it wasn't spoken across. */
export const CHUNK_GAP_S = 0.8;

/**
 * The chunk covering `t`, or the one just finished while the gap to now is
 * `graceS` or less. Mirrors `captionAt`'s shape for the line-text fallback.
 */
export function chunkAt(chunks: CaptionChunk[], t: number, graceS = CHUNK_GAP_S): CaptionChunk | null {
  let lastIdx = -1;
  for (let i = 0; i < chunks.length; i += 1) {
    const c = chunks[i];
    if (c.start > t) break;
    if (c.end > t) return c;
    lastIdx = i;
  }
  if (lastIdx < 0) return null;
  const last = chunks[lastIdx];
  return t - last.end <= graceS ? last : null;
}
