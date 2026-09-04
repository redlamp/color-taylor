/**
 * The ghost cursor's artwork.
 *
 * It is the platform's own arrow, drawn large: macOS is black filled with a
 * white outline, Windows is white filled with a black one, which is the
 * difference a person actually recognises. Both are drawn in a 24-unit box
 * with the point at (1, 1) so the hotspot is the same for either.
 *
 * The size is deliberate. A system arrow is 11-12 CSS px wide; at
 * CURSOR_SCALE the ghost is a little over three times that, big enough to
 * read as a character on stage rather than as the user's own pointer, which
 * is on screen at the same time and must not be confused with it.
 *
 * Coarse pointers get a disc instead, centred on its own hotspot - there is
 * no system arrow to imitate on a touchscreen.
 */

export type CursorKind = 'mac' | 'windows' | 'touch';

/** Multiplier over the 24-unit artwork box; 3 puts the arrow at ~3.2x life size. */
export const CURSOR_SCALE = 3;

/** Art-unit hotspot per kind: the point that does the clicking. */
const HOTSPOT: Record<CursorKind, { x: number; y: number }> = {
  mac: { x: 1, y: 1 },
  windows: { x: 1, y: 1 },
  touch: { x: 12, y: 12 },
};

/** Client-pixel hotspot, which is what the runner offsets and pivots on. */
export function hotspotOf(kind: CursorKind) {
  const h = HOTSPOT[kind];
  return { x: h.x * CURSOR_SCALE, y: h.y * CURSOR_SCALE };
}

export const CURSOR_BOX = 24 * CURSOR_SCALE;

/**
 * Which arrow to draw. `userAgentData.platform` where it exists, the user
 * agent string otherwise; a coarse pointer wins over both.
 */
export function cursorKind(): CursorKind {
  if (typeof window === 'undefined') return 'windows';
  if (window.matchMedia('(pointer: coarse)').matches) return 'touch';
  const nav = navigator as Navigator & { userAgentData?: { platform?: string } };
  const platform = nav.userAgentData?.platform ?? navigator.userAgent;
  return /mac|iphone|ipad|ipod/i.test(platform) ? 'mac' : 'windows';
}

// Same topology either way: point, left edge, notch, tail, shoulder. Windows'
// is the blunter of the two and carries a slightly longer tail.
const MAC_ARROW = 'M1 1 L1 17.6 L5.05 13.9 L7.4 19.5 L10.35 18.25 L8 12.8 L13.2 12.8 Z';
const WIN_ARROW = 'M1 1 L1 18.4 L5.4 14.1 L8.1 20.2 L11.2 18.8 L8.6 13 L14.2 13 Z';

export default function DemoCursor({ kind }: { kind: CursorKind }) {
  if (kind === 'touch') {
    return (
      <svg viewBox="0 0 24 24" width={CURSOR_BOX} height={CURSOR_BOX} aria-hidden="true">
        <circle cx="12" cy="12" r="9" fill="rgba(255,255,255,0.28)" stroke="#fff" strokeWidth="1.6" />
        <circle cx="12" cy="12" r="2.4" fill="#fff" />
      </svg>
    );
  }
  const mac = kind === 'mac';
  return (
    <svg viewBox="0 0 24 24" width={CURSOR_BOX} height={CURSOR_BOX} aria-hidden="true">
      <path
        d={mac ? MAC_ARROW : WIN_ARROW}
        fill={mac ? '#000' : '#fff'}
        stroke={mac ? '#fff' : '#000'}
        // In art units, so the outline grows with the arrow. A non-scaling
        // stroke would hold it at a device pixel and vanish at this size.
        strokeWidth={mac ? 1.15 : 1}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}
