/**
 * The swatch library: Recent and Saved, their storage, sorting, drag and drop,
 * and the header actions that go with them.
 *
 * Lifted out of ColorHexagon so the app can put the two lists in a panel of
 * their own while the plugin keeps them under the hexagon. The state lives in
 * useSwatchLibrary and the host owns it - the picker needs `addToRecent` for
 * clicks on the hexagon that should record a colour at once - and
 * <SwatchLibrary> renders it in one of two layouts. See
 * wiki/notes/decision-swatches-panel.md.
 */
import { useRef, useEffect, useCallback, useLayoutEffect, useState, useMemo, type ComponentType, type CSSProperties, type MouseEvent as ReactMouseEvent } from 'react';
import { rgbToHsb, rgbToHex, type RGB, type HSB } from '../utils/colorConversions';
import { swatchBackground } from '../utils/sliderGradients';
import { RefreshCw, Trash2 } from 'lucide-react';
import CollapsibleSection from './CollapsibleSection';
import { readSwatch, writeSwatch, SWATCHES_READY } from '../utils/swatchStore';
import { HSB_TWEEN_MS } from '../utils/colorTween';
import useUiSounds from '../hooks/useUiSounds';

/** A recorded color. Opacity is part of it: two opacities are two paints. */
export type Swatch = { hex: string; alpha: number };

/** Stable identity for one, for the "have we just recorded this?" check. */
function swatchKey(hex: string, alpha: number) {
  return hex + '|' + alpha;
}

/**
 * Opacity for a color stored before swatches carried one.
 *
 * Two older shapes exist. Colors saved as bare hex predate alpha entirely and
 * are opaque. Colors saved while alpha lived in a side map keyed by hex - a
 * shape this replaced - have their opacity there, so read it across rather
 * than silently flattening those to 100.
 */
let legacyAlphaMap: Record<string, number> | null = null;
function legacyAlpha(hex: string): number {
  if (legacyAlphaMap === null) {
    try {
      legacyAlphaMap = (readSwatch('color-taylor-alpha') as Record<string, number>) ?? {};
    } catch {
      legacyAlphaMap = {};
    }
  }
  return legacyAlphaMap?.[hex] ?? 100;
}

export type SavedSlot = { hex: string; alpha: number; addedAt: number } | null;

export const RECENT_KEY = 'color-taylor-recent';
export const SAVED_KEY = 'color-taylor-saved';

/**
 * Saved grows a row at a time instead of being a fixed 12 (issue #64).
 *
 * The bank is 12 because both breakpoints have to come out even: the grid is
 * 6 columns narrow and 12 wide, so a bank is two rows or one. Growing by 6
 * would leave a half-empty row at the 12-column breakpoint, which is the thing
 * a fixed grid was avoiding in the first place. 36 is the ceiling - 3 rows
 * wide, 6 narrow. Past that the honest answer is Figma styles, not more slots.
 */
const SAVED_BANK = 12;
/** Ceiling, in banks: three rows at the panel's full width. */
const SAVED_BANKS = 3;
/** Free slots to keep available. The next bank opens only when the last one fills. */
const SAVED_MIN_FREE = 1;

/** Pad or trim to `size`, never dropping a filled slot. */
function resizeSaved(slots: SavedSlot[], size: number): SavedSlot[] {
  if (size === slots.length) return slots;
  if (size > slots.length) return slots.concat(Array(size - slots.length).fill(null));
  return slots.slice(0, size);
}

/** Index of the last filled slot, or -1. Not the same as the count: the user
 *  can drag colors apart and leave gaps, and those gaps have to survive. */
function lastFilled(slots: SavedSlot[]): number {
  for (let i = slots.length - 1; i >= 0; i--) if (slots[i]) return i;
  return -1;
}

/**
 * The size Saved should be for what it holds: enough banks to hold every
 * color and still leave SAVED_MIN_FREE slots open.
 *
 * Derived rather than stored, so growing and shrinking are the same rule read
 * in two directions and cannot disagree. Shrinking falls out of it: delete
 * enough and the trailing bank goes away on its own, with no second code path
 * to keep in step.
 *
 * One transition per bank, and it is symmetric: the save that fills the last
 * free slot opens the next bank, and deleting that same color closes it again.
 * Nothing can oscillate, because the size is a pure function of the contents
 * and the contents only change when the user acts.
 */
function fitSaved(slots: SavedSlot[], bank = SAVED_BANK): SavedSlot[] {
  const filled = slots.filter(Boolean).length;
  const last = lastFilled(slots);
  const max = bank * SAVED_BANKS;
  let size = bank;
  while (size < max && (last >= size || size - filled < SAVED_MIN_FREE)) size += bank;
  return resizeSaved(slots, size);
}

function toSwatch(v: unknown): Swatch {
  if (typeof v === 'string') return { hex: v, alpha: legacyAlpha(v) };
  const o = v as Swatch;
  return { hex: o.hex, alpha: typeof o.alpha === 'number' ? o.alpha : legacyAlpha(o.hex) };
}

function defaultSaved(bank = SAVED_BANK): SavedSlot[] {
  const slots: SavedSlot[] = DEFAULT_RECENT.map((hex, i) => ({ hex, alpha: 100, addedAt: -(i + 1) }));
  return fitSaved(slots, bank);
}

/**
 * Both parsers take whatever the store handed back - which may be null, and in
 * the plugin will be on first render - and are shared by the state
 * initializers and the late hydrate, so stored data is read the same way
 * whether it was there at mount or arrived after it.
 */
function parseRecent(raw: unknown): Swatch[] {
  return Array.isArray(raw) ? raw.map(toSwatch) : [];
}

function parseSaved(raw: unknown, bank = SAVED_BANK): SavedSlot[] {
  if (!Array.isArray(raw)) return defaultSaved(bank);
  const seen = new Set<number>();
  const slots: SavedSlot[] = raw.map((v: unknown, i: number) => {
    if (!v) return null;
    const stored = typeof v === 'string'
      ? { hex: v, addedAt: -(i + 1) }
      : (v as { hex: string; alpha?: number; addedAt: number });
    const slot = {
      ...stored,
      alpha: typeof stored.alpha === 'number' ? stored.alpha : legacyAlpha(stored.hex),
    };
    // addedAt keys the FLIP animation and the ref map, so duplicates from an
    // older write have to be separated or two slots animate as one.
    if (seen.has(slot.addedAt)) slot.addedAt = -(i + 1) * 1000;
    seen.add(slot.addedAt);
    return slot;
  });
  // The stored length is the capacity, so it has to be squared up on the way
  // in: data written before Saved could grow is 12 long, and a hand-edited or
  // truncated store could be any length at all.
  const size = Math.max(
    bank,
    Math.min(bank * SAVED_BANKS, Math.ceil(slots.length / bank) * bank),
    Math.ceil((lastFilled(slots) + 1) / bank) * bank,
  );
  return resizeSaved(slots, size);
}

const DEFAULT_RECENT = ['#ff0000', '#ffff00', '#00ff00', '#00ffff', '#0000ff', '#ff00ff', '#ffffff', '#808080', '#000000'];

const ACTION_BTN_CLASS = 'ctl-quiet px-2.5';
/**
 * The header actions in the app's Swatches panel stand at the height of the
 * pressed pills in the toggle groups beside them - 25px, the 32px control less
 * its 3px inset and the 1px the pill gives up - rather than the full control.
 */
const PILL_H = 'h-[25px]';

/**
 * Header controls hold a width instead of tracking their content, because all
 * three change what they say: Sort cycles five labels, and the two confirming
 * actions swap between an icon and "Sure?". Left to size themselves they shuffle
 * each other sideways on every click.
 *
 * Two values, not one: Sort spells out its mode and the actions do not, so
 * forcing them to a shared width would pad the icons out to fit "Sort: Bright".
 * Both are floors - an unexpected font should widen a button, not clip it - and
 * both are measured rather than guessed. See the MEASURED_WIDTHS test note.
 */
const ACTION_BTN_W = 'min-w-14';
const SORT_BTN_W = 'min-w-26';

type SortMode = 'user' | 'hue' | 'saturation' | 'brightness' | 'alpha';

/**
 * Cycle order for the Sort control, at its fullest.
 *
 * Alpha is dropped in hosts that have no opacity, which today is every one but
 * the plugin - see `alphaSorts` below. Sorting by a value the surface cannot
 * express means four clicks through a mode that does nothing.
 */
const SORT_ORDER: readonly SortMode[] = ['user', 'hue', 'saturation', 'brightness', 'alpha'];

const SORT_LABELS: Record<SortMode, string> = {
  user: 'User',
  hue: 'Hue',
  saturation: 'Sat',
  brightness: 'Bright',
  alpha: 'Alpha',
};

/*
 * Sort names its mode in text, the way the plugin does.
 *
 * It was briefly an icon per mode, which was a mistake: five glyphs standing in
 * for User / Hue / Sat / Bright / Alpha are guesswork at 14px, and the plugin
 * this was meant to match had always kept Sort as a label - only the two
 * destructive actions became icons there. Clear and Defaults are unambiguous as
 * a bin and a refresh; a sort order is not.
 */

/**
 * Header action for the Recent / Saved sections. Always an icon, with the label
 * carried by title and aria-label - except while armed, where "Sure?" is spelt
 * out. Confirmation is the one place words beat a glyph.
 */
function ActionButton({
  label,
  icon: Icon,
  onClick,
  confirm,
  onDropSwatch,
  className = '',
}: {
  label: string;
  icon: ComponentType<{ className?: string }>;
  onClick: (e: ReactMouseEvent) => void;
  /** Require a second click. For the actions that throw away saved work. */
  confirm?: boolean;
  /**
   * Accept a swatch dragged onto the button. Deliberately skips `confirm`:
   * dropping one color on the bin is already a deliberate, aimed gesture, and
   * it names its own target - unlike Clear, which takes everything.
   */
  onDropSwatch?: () => void;
  className?: string;
}) {
  const [armed, setArmed] = useState(false);
  const [dropOver, setDropOver] = useState(false);
  const disarm = useRef<number | null>(null);

  useEffect(() => () => {
    if (disarm.current !== null) window.clearTimeout(disarm.current);
  }, []);

  // Confirm in place rather than in a dialog. The panel is small, a modal over
  // it would cover the swatches you are deciding about, and a dialog component
  // would pull the primitives library back into the plugin bundle that the
  // build works to keep out.
  const handle = (e: ReactMouseEvent) => {
    if (!confirm || armed) {
      if (disarm.current !== null) window.clearTimeout(disarm.current);
      setArmed(false);
      onClick(e);
      return;
    }
    e.stopPropagation();
    setArmed(true);
    disarm.current = window.setTimeout(() => setArmed(false), 3000);
  };

  return (
    <button
      className={`${ACTION_BTN_CLASS} ${ACTION_BTN_W} transition-transform duration-100 ${className}`}
      // data-armed and data-drop-over share the danger styling: both mean the
      // next thing that happens removes a color.
      data-armed={armed || dropOver || undefined}
      style={dropOver ? {
        // Figma's danger token in the plugin, shadcn's in the app. The ring
        // reads currentColor so it follows whichever one resolved.
        color: 'var(--figma-color-text-danger, var(--destructive))',
        transform: 'scale(1.12)',
        boxShadow: '0 0 0 2px currentColor',
      } : undefined}
      title={armed ? `${label} - click again to confirm` : label}
      aria-label={armed ? `Confirm ${label.toLowerCase()}` : label}
      onClick={handle}
      onBlur={() => setArmed(false)}
      onDragOver={onDropSwatch && ((e) => {
        // preventDefault on dragover is what marks an element as a drop target;
        // without it the drop never fires and the drag reads as rejected.
        e.preventDefault();
        e.stopPropagation();
        e.dataTransfer.dropEffect = 'move';
        if (!dropOver) setDropOver(true);
      })}
      onDragLeave={onDropSwatch && (() => setDropOver(false))}
      onDrop={onDropSwatch && ((e) => {
        e.preventDefault();
        e.stopPropagation();
        setDropOver(false);
        onDropSwatch();
      })}
    >
      {armed ? 'Sure?' : <Icon className="!size-3.5" />}
    </button>
  );
}

export interface SwatchLibraryOptions {
  rgb: RGB;
  /** Opacity of the current colour, 0-100. Hosts without alpha leave it out. */
  alpha?: number;
  muted?: boolean;
  /** Whether a settled colour joins Recent. Off while the demo runs. */
  recordRecent?: boolean;
  onAnimateToHsb?: (target: HSB) => void;
  /** Restore a swatch's stored alpha when it is clicked. */
  onAlphaRestore?: (alpha: number) => void;
  /**
   * Slots per row of Saved, and the size of Recent. 12 for the plugin's
   * 6/12-column grid, 24 for the app's panel, where a row is the whole width.
   */
  bank?: number;
}

export function useSwatchLibrary({ rgb, alpha = 100, muted, recordRecent = true, onAnimateToHsb, onAlphaRestore, bank = SAVED_BANK }: SwatchLibraryOptions) {
  const [initialHex] = useState(() => rgbToHex(rgb.r, rgb.g, rgb.b));
  const [recentColors, setRecentColors] = useState<Swatch[]>(() => parseRecent(readSwatch(RECENT_KEY)));

  /**
   * The colour a swatch has to equal to read as selected, when that is not
   * simply the current one: the target of a tween already under way.
   *
   * Selection used to be two stored indices - which Recent slot and which Saved
   * slot were last clicked - and that is a different claim from the one the ring
   * makes. It said "you picked this" where the ring means "this is your colour",
   * so it drifted three ways: it survived the colour moving on, it lit only the
   * copy you clicked when the same colour sat in both sections, and it lit only
   * one of two identical Saved swatches. All three go away by deriving the ring
   * from colour identity, which also makes it free for however many swatches
   * match.
   *
   * This ref covers the one case identity cannot: clicking a swatch starts a
   * 1s tween, and the ring should land on the click rather than a second later.
   */
  const [pendingKey, setPendingKey] = useState<string | null>(null);
  const pendingTimer = useRef<number | null>(null);

  const alphaRef = useRef(alpha);
  alphaRef.current = alpha;

  const [savedSlots, setSavedSlots] = useState<SavedSlot[]>(() => parseSaved(readSwatch(SAVED_KEY), bank));
  const [savedSortMode, setSavedSortMode] = useState<SortMode>('user');
  const [draggedUserIdx, setDraggedUserIdx] = useState<number | null>(null);
  /**
   * A Recent swatch being dragged toward Saved. Separate from draggedUserIdx
   * rather than folded into one drag-source union, because the two behave
   * differently at every step: this one copies instead of moving, leaves its
   * source untouched, and has no slot to fall back to if the drop misses.
   */
  const [draggedRecent, setDraggedRecent] = useState<Swatch | null>(null);
  const [dragHover, setDragHover] = useState<{ displayIdx: number; zone: 'left' | 'center' | 'right' } | null>(null);
  const [touchArmedUserIdx, setTouchArmedUserIdx] = useState<number | null>(null);
  const touchDrag = useRef<{ startX: number; startY: number; userIdx: number; armed: boolean } | null>(null);
  const touchDragTimer = useRef<number | null>(null);
  const suppressNextClick = useRef(false);
  const desktopDroppedRef = useRef(false);

  type Poof = { id: string; x: number; y: number; w: number; h: number; color: string };
  const [poofs, setPoofs] = useState<Poof[]>([]);
  const { playFlit, playClick, playSave, playPop } = useUiSounds(muted);
  const triggerPoof = useCallback((idx: number, color: string) => {
    const btn = document.querySelector<HTMLElement>(`[data-saved-idx="${idx}"]`);
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    const id = `${Date.now()}-${Math.random()}`;
    setPoofs((prev) => [...prev, { id, x: rect.left, y: rect.top, w: rect.width, h: rect.height, color }]);
    window.setTimeout(() => setPoofs((prev) => prev.filter((p) => p.id !== id)), 450);
  }, []);

  const teardownTouchDrag = useCallback(() => {
    if (touchDragTimer.current !== null) {
      window.clearTimeout(touchDragTimer.current);
      touchDragTimer.current = null;
    }
    if (touchDrag.current?.armed) {
      document.body.style.overflow = '';
      document.body.style.userSelect = '';
    }
    touchDrag.current = null;
    setTouchArmedUserIdx(null);
    setDragHover(null);
  }, []);

  const lastRecorded = useRef(swatchKey(initialHex, 100));
  const skipNextRecent = useRef(false);

  // Persist recent + saved colors. Guarded like every read above: storage can
  // throw, not merely return null. A null-origin iframe — which is what the
  // Figma plugin host gives us — raises SecurityError on access, and an
  // uncaught throw inside an effect unmounts the entire tree.
  useEffect(() => { writeSwatch(RECENT_KEY, recentColors); }, [recentColors]);
  useEffect(() => { writeSwatch(SAVED_KEY, savedSlots); }, [savedSlots]);

  /**
   * Adopt swatches that arrive after mount.
   *
   * The plugin's store is asynchronous - clientStorage lives on the sandbox
   * side - so the first render builds on an empty cache and the real data
   * lands a moment later. The app's store is synchronous and never fires this.
   */
  useEffect(() => {
    const hydrate = () => {
      setRecentColors(parseRecent(readSwatch(RECENT_KEY)));
      setSavedSlots(parseSaved(readSwatch(SAVED_KEY), bank));
    };
    window.addEventListener(SWATCHES_READY, hydrate);
    return () => window.removeEventListener(SWATCHES_READY, hydrate);
  }, [bank]);


  // "Reset all" puts both lists back to how a first visit finds them.
  useEffect(() => {
    const onReset = () => {
      setRecentColors([]);
      setSavedSlots(defaultSaved(bank));
    };
    window.addEventListener('color-taylor:reset-all', onReset);
    return () => window.removeEventListener('color-taylor:reset-all', onReset);
  }, [bank]);

  const displaySlots = useMemo<{ slot: SavedSlot; userIdx: number }[]>(() => {
    const indexed = savedSlots.map((slot, userIdx) => ({ slot, userIdx }));
    if (savedSortMode === 'user') return indexed;
    const filled = indexed.filter((x): x is { slot: NonNullable<SavedSlot>; userIdx: number } => x.slot !== null);
    const empties = indexed.filter((x) => x.slot === null);
    filled.sort((a, b) => {
      const ar = parseInt(a.slot.hex.slice(1, 3), 16), ag = parseInt(a.slot.hex.slice(3, 5), 16), ab = parseInt(a.slot.hex.slice(5, 7), 16);
      const br = parseInt(b.slot.hex.slice(1, 3), 16), bg = parseInt(b.slot.hex.slice(3, 5), 16), bb = parseInt(b.slot.hex.slice(5, 7), 16);
      const aHsb = rgbToHsb(ar, ag, ab);
      const bHsb = rgbToHsb(br, bg, bb);
      if (savedSortMode === 'hue') {
        return (aHsb.h - bHsb.h) || (aHsb.s - bHsb.s) || (aHsb.b - bHsb.b);
      }
      if (savedSortMode === 'saturation') return bHsb.s - aHsb.s;
      // Most transparent first, so the ones you might have lost track of surface.
      if (savedSortMode === 'alpha') return a.slot.alpha - b.slot.alpha;
      return bHsb.b - aHsb.b;
    });
    return [...filled, ...empties];
  }, [savedSlots, savedSortMode]);

  const deleteSavedAt = useCallback((userIdx: number) => {
    const slot = savedSlots[userIdx];
    if (slot) {
      triggerPoof(userIdx, slot.hex);
      playPop();
      if (navigator.vibrate) navigator.vibrate(20);
    }
    const displayIdx = displaySlots.findIndex((d) => d.userIdx === userIdx);
    const flattened: SavedSlot[] = displaySlots.map((d) => d.slot);
    if (displayIdx >= 0) flattened[displayIdx] = null;
    setSavedSlots(fitSaved(flattened, bank));
    setSavedSortMode('user');
  }, [savedSlots, displaySlots, triggerPoof, playPop, bank]);

  /**
   * Copy a Recent color into a Saved slot. Recent keeps its own.
   *
   * Adopts the displayed order first, the same way clicking an empty slot
   * does, so the color lands in the slot that was under the pointer rather
   * than wherever that position maps to in the unsorted array.
   */
  const copyRecentToSaved = useCallback((swatch: Swatch, displayIdx: number) => {
    const flattened: SavedSlot[] = displaySlots.map((d) => d.slot);
    if (displayIdx < 0 || displayIdx >= flattened.length) return;
    flattened[displayIdx] = { hex: swatch.hex, alpha: swatch.alpha, addedAt: Date.now() };
    setSavedSlots(fitSaved(flattened, bank));
    setSavedSortMode('user');
    playSave();
    if (navigator.vibrate) navigator.vibrate(10);
  }, [displaySlots, playSave, bank]);

  // Refs keyed by COLOR identity (addedAt timestamp), not slot index, so we
  // can track a color across position changes for FLIP animation.
  const savedColorRefs = useRef<Map<number, HTMLButtonElement>>(new Map());
  const pendingFlipRects = useRef<{ rects: Map<number, DOMRect>; playSound: boolean; primaryAddedAt?: number } | null>(null);

  const captureFlipRects = useCallback((playSound: boolean, primaryAddedAt?: number) => {
    const rects = new Map<number, DOMRect>();
    savedColorRefs.current.forEach((el, addedAt) => {
      rects.set(addedAt, el.getBoundingClientRect());
    });
    pendingFlipRects.current = { rects, playSound, primaryAddedAt };
  }, []);

  const computeDragHover = useCallback((clientX: number, clientY: number): { displayIdx: number; zone: 'left' | 'center' | 'right' } | null => {
    const el = (document.elementFromPoint(clientX, clientY) as HTMLElement | null)?.closest('[data-saved-idx]') as HTMLElement | null;
    if (!el) return null;
    const userIdx = Number(el.dataset.savedIdx);
    if (Number.isNaN(userIdx)) return null;
    const displayIdx = displaySlots.findIndex((d) => d.userIdx === userIdx);
    if (displayIdx < 0) return null;
    const rect = el.getBoundingClientRect();
    const x = clientX - rect.left;
    const w = rect.width;
    const edge = Math.max(6, Math.min(12, w * 0.22));
    let zone: 'left' | 'center' | 'right' = 'center';
    if (x < edge) zone = 'left';
    else if (x > w - edge) zone = 'right';
    return { displayIdx, zone };
  }, [displaySlots]);

  const performSavedSwap = useCallback((fromUserIdx: number, toDisplayIdx: number) => {
    const fromDisplay = displaySlots.findIndex((d) => d.userIdx === fromUserIdx);
    if (fromDisplay < 0 || fromDisplay === toDisplayIdx) return;
    const sourceSlotPreview = displaySlots[fromDisplay].slot;
    captureFlipRects(false, sourceSlotPreview?.addedAt);
    const flattened: SavedSlot[] = displaySlots.map((d) => d.slot);
    [flattened[fromDisplay], flattened[toDisplayIdx]] = [flattened[toDisplayIdx], flattened[fromDisplay]];
    setSavedSlots(fitSaved(flattened, bank));
    setSavedSortMode('user');
    playClick();
    if (navigator.vibrate) navigator.vibrate(8);
  }, [displaySlots, playClick, captureFlipRects, bank]);

  const performSavedInsert = useCallback((fromUserIdx: number, insertBeforeDisplayIdx: number) => {
    const fromDisplay = displaySlots.findIndex((d) => d.userIdx === fromUserIdx);
    if (fromDisplay < 0) return;
    const target = insertBeforeDisplayIdx;
    // No-op: inserting at source's position or right after source.
    if (target === fromDisplay || target === fromDisplay + 1) return;
    if (target < 0 || target >= displaySlots.length) return;

    const sourceSlotPreview = displaySlots[fromDisplay].slot;
    captureFlipRects(false, sourceSlotPreview?.addedAt);
    const flattened: SavedSlot[] = displaySlots.map((d) => d.slot);
    const sourceSlot = flattened[fromDisplay];
    flattened[fromDisplay] = null;

    if (flattened[target] !== null) {
      // Push target's content toward the nearest empty slot AWAY from the source's now-vacated slot.
      const dir = fromDisplay < target ? +1 : -1;
      let probe = target;
      while (probe >= 0 && probe < flattened.length && flattened[probe] !== null) probe += dir;
      if (probe < 0 || probe >= flattened.length) {
        // No empty in the away direction — fall back to the source side (which is guaranteed empty).
        probe = target;
        const alt = -dir;
        while (probe >= 0 && probe < flattened.length && flattened[probe] !== null) probe += alt;
      }
      if (probe < 0 || probe >= flattened.length) return;
      if (probe > target) {
        for (let j = probe; j > target; j--) flattened[j] = flattened[j - 1];
      } else {
        for (let j = probe; j < target; j++) flattened[j] = flattened[j + 1];
      }
    }
    flattened[target] = sourceSlot;

    setSavedSlots(fitSaved(flattened, bank));
    setSavedSortMode('user');
    playClick();
    if (navigator.vibrate) navigator.vibrate(8);
  }, [displaySlots, playClick, captureFlipRects, bank]);

  const applyDragHoverDrop = useCallback((fromUserIdx: number, hover: { displayIdx: number; zone: 'left' | 'center' | 'right' } | null) => {
    if (!hover) return false;
    if (hover.zone === 'center') {
      performSavedSwap(fromUserIdx, hover.displayIdx);
    } else {
      const insertAt = hover.zone === 'left' ? hover.displayIdx : hover.displayIdx + 1;
      performSavedInsert(fromUserIdx, insertAt);
    }
    return true;
  }, [performSavedSwap, performSavedInsert]);

  /**
   * Whether this host has opacity at all, and so whether Sort offers it.
   *
   * `onAlphaRestore` is the signal rather than a flag of its own: it is the
   * callback a host provides only if it tracks an opacity to restore, which is
   * the same question. `alpha` cannot answer it - it defaults to 100, so a host
   * that never passes one is indistinguishable from a host at full opacity.
   */
  const sortOrder = useMemo<readonly SortMode[]>(
    () => (onAlphaRestore ? SORT_ORDER : SORT_ORDER.filter((m) => m !== 'alpha')),
    [onAlphaRestore],
  );

  const cycleSavedSort = useCallback(() => {
    captureFlipRects(true);
    // indexOf returns -1 for a mode this host does not offer - which can be
    // held over from a session that ran with alpha - and -1 + 1 lands on
    // 'user', which is where a mode you cannot cycle back to should go.
    const next = sortOrder[(sortOrder.indexOf(savedSortMode) + 1) % sortOrder.length];
    setSavedSortMode(next);
  }, [savedSortMode, captureFlipRects, sortOrder]);

  useLayoutEffect(() => {
    const pending = pendingFlipRects.current;
    if (!pending) return;
    pendingFlipRects.current = null;
    const before = pending.rects;
    const shouldPlaySound = pending.playSound;
    const primaryAddedAt = pending.primaryAddedAt;

    let movedCount = 0;
    savedColorRefs.current.forEach((el, addedAt) => {
      const oldRect = before.get(addedAt);
      if (!oldRect) return;
      const newRect = el.getBoundingClientRect();
      const dx = oldRect.left - newRect.left;
      const dy = oldRect.top - newRect.top;
      if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5) return;
      movedCount++;
      const isPrimary = addedAt === primaryAddedAt;
      el.style.transition = 'none';
      el.style.transform = `translate(${dx}px, ${dy}px)`;
      el.style.zIndex = isPrimary ? '20' : '10';
      requestAnimationFrame(() => {
        el.style.transition = 'transform 240ms cubic-bezier(0.3, 0.7, 0.3, 1)';
        el.style.transform = 'translate(0, 0)';
      });
      window.setTimeout(() => {
        el.style.transition = '';
        el.style.transform = '';
        el.style.zIndex = '';
      }, 280);
    });

    if (shouldPlaySound && movedCount > 0) playFlit();
  }, [savedSortMode, savedSlots, playFlit]);


  // Add to recent only after the color has settled (1000ms).
  const currentHex = rgbToHex(rgb.r, rgb.g, rgb.b);
  const addRecentTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const recentColorsRef = useRef(recentColors);
  recentColorsRef.current = recentColors;

  /**
   * The colour every swatch is compared against, and the whole of the selection
   * rule: a swatch reads as selected when it holds this exact colour. Two
   * sections can match it at once, and so can two identical Saved slots.
   *
   * A pending tween target wins over the live colour rather than joining it, so
   * the ring does not skip across whatever swatches the tween happens to pass
   * through on its way.
   */
  const activeKey = pendingKey ?? swatchKey(currentHex, alpha);

  const markPending = useCallback((hex: string, a: number) => {
    setPendingKey(swatchKey(hex, a));
    if (pendingTimer.current !== null) window.clearTimeout(pendingTimer.current);
    // The tween's own duration is the natural lifetime. The timer is the
    // backstop for a tween that never arrives because the user grabbed the
    // wheel half way through; the effect below is what ends it normally.
    pendingTimer.current = window.setTimeout(() => {
      setPendingKey(null);
      pendingTimer.current = null;
    }, HSB_TWEEN_MS + 100);
  }, []);

  useEffect(() => () => {
    if (pendingTimer.current !== null) window.clearTimeout(pendingTimer.current);
  }, []);

  // Once the colour has arrived, identity alone keeps the ring where it is, and
  // holding the target any longer would strand it there if the user moves on.
  useEffect(() => {
    if (pendingKey && swatchKey(currentHex, alpha) === pendingKey) setPendingKey(null);
  }, [pendingKey, currentHex, alpha]);

  // Reset debounce on currentHex change only; reads latest recentColors via ref
  // to avoid restarting the timer when the recent list updates.
  useEffect(() => {
    if (addRecentTimer.current) clearTimeout(addRecentTimer.current);
    if (!recordRecent) return;
    addRecentTimer.current = setTimeout(() => {
      if (skipNextRecent.current) {
        skipNextRecent.current = false;
        lastRecorded.current = swatchKey(currentHex, alphaRef.current);
        return;
      }
      const a = alphaRef.current;
      // Already in the list: nothing to record, and the ring is already on it.
      if (recentColorsRef.current.some((c) => c.hex === currentHex && c.alpha === a)) {
        lastRecorded.current = swatchKey(currentHex, a);
        return;
      }
      if (swatchKey(currentHex, a) !== lastRecorded.current) {
        lastRecorded.current = swatchKey(currentHex, a);
        setRecentColors((prev) => {
          if (prev.some((c) => c.hex === currentHex && c.alpha === a)) return prev;
          return [{ hex: currentHex, alpha: a }, ...prev].slice(0, bank);
        });
      }
    }, 1000);

    return () => {
      if (addRecentTimer.current) {
        clearTimeout(addRecentTimer.current);
        addRecentTimer.current = null;
      }
    };
    // Opacity is half of a swatch's identity now, so a change to it has to
    // restart the debounce or a new opacity would never be recorded.
  }, [currentHex, alpha, recordRecent, bank]);

  const addToRecent = useCallback((hex: string) => {
    const a = alphaRef.current;
    skipNextRecent.current = true;
    lastRecorded.current = swatchKey(hex, a);
    setRecentColors((prev) => {
      const filtered = prev.filter((c) => !(c.hex === hex && c.alpha === a));
      return [{ hex, alpha: a }, ...filtered].slice(0, bank);
    });
  }, [bank]);


  return {
    bank, alpha, rgb, onAnimateToHsb, onAlphaRestore,
    recentColors, setRecentColors, savedSlots, setSavedSlots, displaySlots,
    savedSortMode, setSavedSortMode, cycleSavedSort, activeKey, markPending, skipNextRecent,
    draggedUserIdx, setDraggedUserIdx, draggedRecent, setDraggedRecent, dragHover, setDragHover,
    touchArmedUserIdx, setTouchArmedUserIdx, touchDrag, touchDragTimer, suppressNextClick, desktopDroppedRef,
    savedColorRefs, computeDragHover, applyDragHoverDrop, deleteSavedAt, copyRecentToSaved, teardownTouchDrag,
    playSave, poofs, addToRecent,
  };
}

export type SwatchLibraryState = ReturnType<typeof useSwatchLibrary>;

interface SwatchLibraryProps {
  lib: SwatchLibraryState;
  /**
   * 'sections': Recent then Saved as two collapsible sections, the shape the
   * plugin sidebar wants. 'panel': one "Swatches" panel with Saved directly
   * under its title and Recent as a section beneath - the app's layout.
   */
  layout: 'sections' | 'panel';
  /** Section chrome in the 'sections' layout. See CollapsibleSection. */
  variant?: 'card' | 'flush';
  /** Start the sections closed. */
  collapsed?: boolean;
}

export default function SwatchLibrary({ lib, layout, variant = 'card', collapsed = false }: SwatchLibraryProps) {
  const {
    bank, alpha, rgb, onAnimateToHsb, onAlphaRestore,
    recentColors, setRecentColors, setSavedSlots, displaySlots,
    savedSortMode, setSavedSortMode, cycleSavedSort, activeKey, markPending, skipNextRecent,
    draggedUserIdx, setDraggedUserIdx, draggedRecent, setDraggedRecent, dragHover, setDragHover,
    touchArmedUserIdx, setTouchArmedUserIdx, touchDrag, touchDragTimer, suppressNextClick, desktopDroppedRef,
    savedColorRefs, computeDragHover, applyDragHoverDrop, deleteSavedAt, copyRecentToSaved, teardownTouchDrag,
    playSave, poofs,
  } = lib;
  const flushSections = variant === 'flush';
  const panel = layout === 'panel';
  // The plugin's 6/12 columns keep their breakpoint; the panel is one row of the bank.
  const gridClass = panel ? 'grid grid-cols-12 md:grid-cols-24 gap-1.5' : 'grid grid-cols-6 md:grid-cols-12 gap-1.5';
  // Header actions match the toggle pills beside them in the panel, not the 32px control.
  const actionClass = panel ? PILL_H : '';

  const recentActions = (
    <div className="flex gap-1">
      <ActionButton
        label="Clear"
        icon={Trash2}
        confirm
        className={actionClass}
        onClick={(e) => { e.stopPropagation(); setRecentColors([]); }}
      />
    </div>
  );
  const savedActions = (
    <div className="flex gap-1">
      {/* Sort sits with the other header actions rather than opposite
          them. It is the only one that reads rather than destroys, so
          it leads the group and the two confirming actions follow. */}
      <button
        className={`${ACTION_BTN_CLASS} ${SORT_BTN_W} tabular-nums ${actionClass}`}
        onClick={(e) => { e.stopPropagation(); cycleSavedSort(); }}
        // The mode as an attribute, not just inside a label. It is the
        // only way to read this control now that it renders a glyph, and
        // it lets a test assert on state rather than on presentation.
        data-sort-mode={savedSortMode}
        title={`Sorted by ${SORT_LABELS[savedSortMode]} - click to cycle`}
        aria-label={`Sorted by ${SORT_LABELS[savedSortMode]}. Click to cycle sort order.`}
      >
        Sort: {SORT_LABELS[savedSortMode]}
      </button>
      <ActionButton
        label="Defaults"
        icon={RefreshCw}
        confirm
        className={actionClass}
        onClick={(e) => {
          e.stopPropagation();
          setSavedSlots(defaultSaved(bank));
          setSavedSortMode('user');
        }}
      />
      <ActionButton
        label="Clear"
        icon={Trash2}
        confirm
        className={actionClass}
        onClick={(e) => { e.stopPropagation(); setSavedSlots(Array(bank).fill(null)); }}
        // A second way to delete one color, alongside dragging it out
        // of the grid. Marking the drop as handled is what stops
        // onDragEnd's drop-outside path deleting a second time - by
        // then the indices have shifted and it would take a different
        // color with it.
        onDropSwatch={draggedUserIdx !== null ? () => {
          desktopDroppedRef.current = true;
          deleteSavedAt(draggedUserIdx);
          setDraggedUserIdx(null);
          setDragHover(null);
        } : undefined}
      />
    </div>
  );
  const poofsJsx = poofs.map((p) => (
  <div
    key={p.id}
    className="fixed pointer-events-none z-50"
    style={{ left: p.x, top: p.y, width: p.w, height: p.h }}
  >
    {Array.from({ length: 6 }).map((_, i) => {
      const angle = (i / 6) * Math.PI * 2;
      const dist = Math.max(p.w, p.h) * 0.9;
      const dx = Math.cos(angle) * dist;
      const dy = Math.sin(angle) * dist;
      return (
        <span
          key={i}
          className="absolute rounded-full"
          style={{
            left: '50%',
            top: '50%',
            width: 10,
            height: 10,
            backgroundColor: p.color,
            animation: 'poof-particle 420ms ease-out forwards',
            ['--dx' as string]: `${dx}px`,
            ['--dy' as string]: `${dy}px`,
          } as CSSProperties}
        />
      );
    })}
  </div>
  ));

  // data-swatch-grid is the plugin's hook for re-laying these out at panel
  // width. It used to select `.grid` inside the section, which broke the day
  // CollapsibleSection started animating its height with a grid - see
  // figma/ui/figma.css.
  const recentGrid = (
    <div data-swatch-grid className={gridClass}>
      {Array.from({ length: bank }, (_, i) => {
        const entry = recentColors[i];
        const color = entry?.hex;
        const isSelected = !!entry && swatchKey(entry.hex, entry.alpha) === activeKey;
        return (
          <button
            key={i}
            className="rounded-md cursor-pointer h-8 w-full transition-shadow duration-200 ease-in-out"
            style={{
              background: entry ? swatchBackground(entry.hex, entry.alpha) : 'transparent',
              boxShadow: isSelected ? '0 0 0 2px white' : 'none',
              border: isSelected ? '2px solid transparent' : '1px solid var(--input)',
              opacity: draggedRecent && entry && draggedRecent.hex === entry.hex && draggedRecent.alpha === entry.alpha ? 0.4 : 1,
            }}
            disabled={!color}
            // Drag a recent color onto a Saved slot to keep it. This
            // copies - Recent is a log of where you have been and should
            // not lose an entry because you filed it somewhere.
            draggable={!!entry}
            onDragStart={(e) => {
              if (!entry) { e.preventDefault(); return; }
              setDraggedRecent(entry);
              e.dataTransfer.effectAllowed = 'copy';
              e.dataTransfer.setData('text/plain', entry.hex);
            }}
            onDragEnd={() => {
              setDraggedRecent(null);
              setDragHover(null);
            }}
            aria-label={color ? `Select ${color}` : 'Empty slot'}
            onClick={() => {
              if (entry && color && onAnimateToHsb) {
                skipNextRecent.current = true;
                markPending(entry.hex, entry.alpha);
                onAlphaRestore?.(entry.alpha);
                const parsed = rgbToHsb(
                  parseInt(color.slice(1, 3), 16),
                  parseInt(color.slice(3, 5), 16),
                  parseInt(color.slice(5, 7), 16),
                );
                onAnimateToHsb(parsed);
              }
            }}
          />
        );
      })}
    </div>
  );
  const savedGrid = (
    <div data-swatch-grid className={gridClass}>
      {displaySlots.map(({ slot, userIdx }, displayIdx) => {
        const color = slot?.hex ?? null;
        const isSelected = !!slot && swatchKey(slot.hex, slot.alpha) === activeKey;
        const isDragging = userIdx === draggedUserIdx || userIdx === touchArmedUserIdx;
        const isHovered = dragHover?.displayIdx === displayIdx;
        const isReplaceTarget = isHovered && dragHover?.zone === 'center' && !isDragging;
        const showInsertLeft = isHovered && dragHover?.zone === 'left' && !isDragging;
        const showInsertRight = isHovered && dragHover?.zone === 'right' && !isDragging;
        const isArmed = userIdx === touchArmedUserIdx;
        return (
          <button
            key={slot ? `c-${slot.addedAt}` : `e-${displayIdx}`}
            ref={(el) => {
              if (!slot) return;
              if (el) savedColorRefs.current.set(slot.addedAt, el);
              else savedColorRefs.current.delete(slot.addedAt);
            }}
            data-saved-idx={userIdx}
            className="rounded-md cursor-pointer h-8 w-full transition-shadow duration-200 ease-in-out relative"
            style={{
              background: slot ? swatchBackground(slot.hex, slot.alpha) : 'transparent',
              boxShadow: isReplaceTarget ? '0 0 0 2px #00BFFF' : isArmed ? '0 0 0 2px #00BFFF' : isSelected ? '0 0 0 2px white' : 'none',
              border: (isReplaceTarget || isSelected || isArmed) ? '2px solid transparent' : color ? '1px solid var(--input)' : '2px dashed var(--input)',
              opacity: isDragging && !isArmed ? 0.4 : 1,
              transform: isArmed ? 'scale(1.1)' : 'scale(1)',
              transition: 'transform 120ms ease-out, box-shadow 120ms ease-out',
              zIndex: isArmed || isDragging ? 20 : undefined,
            }}
            draggable={!!color}
            aria-label={color ? `Load ${color}` : `Save current color to slot ${userIdx + 1}`}
            onDragStart={(e) => {
              if (!color) { e.preventDefault(); return; }
              setDraggedUserIdx(userIdx);
              e.dataTransfer.effectAllowed = 'move';
              e.dataTransfer.setData('text/plain', String(userIdx));
            }}
            onDragOver={(e) => {
              if (draggedUserIdx === null && !draggedRecent) return;
              e.preventDefault();
              e.dataTransfer.dropEffect = draggedRecent ? 'copy' : 'move';
              let hover = computeDragHover(e.clientX, e.clientY);
              // A Recent color has no position in Saved to slide out of,
              // so insert-between means nothing for it: every drop is
              // "put it in this slot".
              if (hover && draggedRecent) hover = { ...hover, zone: 'center' };
              if (hover && (hover.displayIdx !== dragHover?.displayIdx || hover.zone !== dragHover?.zone)) {
                setDragHover(hover);
              }
            }}
            onDragLeave={() => {
              setDragHover((prev) => (prev?.displayIdx === displayIdx ? null : prev));
            }}
            onDrop={(e) => {
              e.preventDefault();
              const from = draggedUserIdx;
              const recent = draggedRecent;
              desktopDroppedRef.current = true;
              const hover = computeDragHover(e.clientX, e.clientY);
              setDraggedUserIdx(null);
              setDraggedRecent(null);
              setDragHover(null);
              if (recent) {
                copyRecentToSaved(recent, hover ? hover.displayIdx : displayIdx);
                return;
              }
              if (from === null) return;
              applyDragHoverDrop(from, hover);
            }}
            onDragEnd={() => {
              if (!desktopDroppedRef.current && draggedUserIdx !== null) {
                deleteSavedAt(draggedUserIdx);
              }
              desktopDroppedRef.current = false;
              setDraggedUserIdx(null);
              setDragHover(null);
            }}
            onPointerDown={(e) => {
              if (e.pointerType !== 'touch' || !color) return;
              touchDrag.current = { startX: e.clientX, startY: e.clientY, userIdx, armed: false };
              if (touchDragTimer.current !== null) window.clearTimeout(touchDragTimer.current);
              touchDragTimer.current = window.setTimeout(() => {
                if (!touchDrag.current) return;
                touchDrag.current.armed = true;
                setTouchArmedUserIdx(touchDrag.current.userIdx);
                document.body.style.overflow = 'hidden';
                document.body.style.userSelect = 'none';
                if (navigator.vibrate) navigator.vibrate(15);
              }, 400);
            }}
            onPointerMove={(e) => {
              const ds = touchDrag.current;
              if (!ds) return;
              if (!ds.armed) {
                const dx = e.clientX - ds.startX;
                const dy = e.clientY - ds.startY;
                if (dx * dx + dy * dy > 64) teardownTouchDrag();
                return;
              }
              e.preventDefault();
              const hover = computeDragHover(e.clientX, e.clientY);
              setDragHover(hover);
            }}
            onPointerUp={(e) => {
              const ds = touchDrag.current;
              if (!ds) return;
              if (ds.armed) {
                const hover = computeDragHover(e.clientX, e.clientY);
                if (hover) {
                  applyDragHoverDrop(ds.userIdx, hover);
                } else {
                  deleteSavedAt(ds.userIdx);
                }
                suppressNextClick.current = true;
              }
              teardownTouchDrag();
            }}
            onPointerCancel={teardownTouchDrag}
            onClick={() => {
              if (suppressNextClick.current) { suppressNextClick.current = false; return; }
              if (color) {
                if (!onAnimateToHsb) return;
                markPending(color, slot?.alpha ?? 100);
                onAlphaRestore?.(slot?.alpha ?? 100);
                const parsed = rgbToHsb(
                  parseInt(color.slice(1, 3), 16),
                  parseInt(color.slice(3, 5), 16),
                  parseInt(color.slice(5, 7), 16),
                );
                onAnimateToHsb(parsed);
              } else {
                const currentHex = rgbToHex(rgb.r, rgb.g, rgb.b);
                // Adopt the currently displayed order as the new user arrangement,
                // then place the new color at the clicked display position.
                const flattened: SavedSlot[] = displaySlots.map((d) => d.slot);
                flattened[displayIdx] = { hex: currentHex, alpha, addedAt: Date.now() };
                setSavedSlots(fitSaved(flattened));
                setSavedSortMode('user');
                playSave();
                if (navigator.vibrate) navigator.vibrate(10);
              }
            }}
          >
            {showInsertLeft && (
              <span
                className="pointer-events-none absolute -left-1 top-0 bottom-0 w-0.5 rounded-full"
                style={{ backgroundColor: '#00BFFF', boxShadow: '0 0 4px #00BFFF' }}
              />
            )}
            {showInsertRight && (
              <span
                className="pointer-events-none absolute -right-1 top-0 bottom-0 w-0.5 rounded-full"
                style={{ backgroundColor: '#00BFFF', boxShadow: '0 0 4px #00BFFF' }}
              />
            )}
          </button>
        );
      })}
    </div>
  );

  if (panel) {
    // Saved has no caption of its own: the panel's title is its title, and its
    // actions ride on that row. Recent keeps its caption and sits under a rule.
    return (
      <>
        <CollapsibleSection id="swatches-group" title="Swatches" level="h2" defaultOpen={!collapsed} headerRight={savedActions}>
          <div className="flex flex-col">
            <div id="saved-colors">{savedGrid}</div>
            <CollapsibleSection
              id="recent-colors"
              title="Recent"
              variant="plain"
              defaultOpen={!collapsed}
              headerRight={recentActions}
              className="mt-3 border-t border-input pt-3"
            >
              {recentGrid}
            </CollapsibleSection>
          </div>
        </CollapsibleSection>
        {poofsJsx}
      </>
    );
  }

  return (
    <>
      {/* Recent Colors */}
      <div className={flushSections ? 'w-full section-flush' : 'w-full mt-2'}>
        <CollapsibleSection
          id="recent-colors"
          title="Recent"
          variant={variant}
          defaultOpen={!collapsed}
          headerRight={recentActions}
        >
          {recentGrid}
        </CollapsibleSection>
      </div>

      {/* Saved Colors */}
      <div className={flushSections ? 'w-full section-flush' : 'w-full mt-2'}>
        <CollapsibleSection
          id="saved-colors"
          title="Saved"
          variant={variant}
          defaultOpen={!collapsed}
          headerRight={savedActions}
        >
          {savedGrid}
        </CollapsibleSection>
      </div>
      {poofsJsx}
    </>
  );
}
