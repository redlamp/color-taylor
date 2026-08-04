import { useRef, useEffect, useCallback, useLayoutEffect, useState, useMemo, type ComponentType, type CSSProperties, type ReactNode, type MouseEvent as ReactMouseEvent, type PointerEvent as ReactPointerEvent } from 'react';
import { hsbToRgb, rgbToHsb, rgbToHex, hexToRgb, rgbToHsl, hslToRgb, lighter, type RGB, type HSB, type HSL } from '../utils/colorConversions';
import { swatchBackground, type ColorSpace } from '../utils/sliderGradients';
import type { Channel, ChannelOrder } from './hex/hexConstants';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { ChevronRight, RefreshCw, Trash2 } from 'lucide-react';
import CollapsibleSection from './CollapsibleSection';
import NAMED_COLORS from '../utils/namedColors';
import { HANDLE, ringRadius } from '../utils/handleStyle';
import { readSwatch, writeSwatch, SWATCHES_READY } from '../utils/swatchStore';
import { toneController } from '../utils/toneControllerLazy';
import useUiSounds from '../hooks/useUiSounds';
import {
  HEX_SIZE, SIZE, HEX_PANEL_WIDTH, CENTER_X, CENTER_Y, RADIUS, PI, DIRS, DISPLAY_HEIGHT,
  BL_BAR_X, BL_BAR_TOP, BL_BAR_HEIGHT, BL_ARROW_SIZE,
  hexEdgeDist, hexPoints, colorAtPoint, getOrder,
} from './hex/hexConstants';
import HexCanvas from './hex/HexCanvas';
import BrightnessBar from './hex/BrightnessBar';
import ColorLabels from './hex/ColorLabels';
import HueHandle from './hex/HueHandle';
import BrightnessHandle from './hex/BrightnessHandle';
import BrightnessMarkers from './hex/BrightnessMarkers';

/** The three channel vectors, at full strength. Stems and handle borders share
 *  these so the two can never drift apart. */
const CHANNEL_COLOR: Record<'r' | 'g' | 'b', string> = {
  r: '#ff0000',
  g: '#00ff00',
  b: '#0000ff',
};

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
const SAVED_MAX = 36;
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
function fitSaved(slots: SavedSlot[]): SavedSlot[] {
  const filled = slots.filter(Boolean).length;
  const last = lastFilled(slots);
  let size = SAVED_BANK;
  while (size < SAVED_MAX && (last >= size || size - filled < SAVED_MIN_FREE)) size += SAVED_BANK;
  return resizeSaved(slots, size);
}

function toSwatch(v: unknown): Swatch {
  if (typeof v === 'string') return { hex: v, alpha: legacyAlpha(v) };
  const o = v as Swatch;
  return { hex: o.hex, alpha: typeof o.alpha === 'number' ? o.alpha : legacyAlpha(o.hex) };
}

function defaultSaved(): SavedSlot[] {
  const slots: SavedSlot[] = DEFAULT_RECENT.map((hex, i) => ({ hex, alpha: 100, addedAt: -(i + 1) }));
  return fitSaved(slots);
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

function parseSaved(raw: unknown): SavedSlot[] {
  if (!Array.isArray(raw)) return defaultSaved();
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
    SAVED_BANK,
    Math.min(SAVED_MAX, Math.ceil(slots.length / SAVED_BANK) * SAVED_BANK),
    Math.ceil((lastFilled(slots) + 1) / SAVED_BANK) * SAVED_BANK,
  );
  return resizeSaved(slots, size);
}

const DEFAULT_RECENT = ['#ff0000', '#ffff00', '#00ff00', '#00ffff', '#0000ff', '#ff00ff', '#ffffff', '#808080', '#000000'];

const ACTION_BTN_CLASS =
  'px-2 py-0.5 text-xs rounded-md bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80 cursor-pointer select-none inline-flex items-center justify-center';

/**
 * Header controls hold a width instead of tracking their content.
 *
 * All three change what they say: Sort cycles five labels, and the two
 * confirming actions swap to "Sure?" when armed - from an icon, in the plugin,
 * which is the largest jump of the lot. Left to size themselves they shuffle
 * each other sideways on every click.
 *
 * Measured in both surfaces, then rounded up to the 4px spacing step:
 *
 *                widest content    plugin (Inter 11)   app (Barlow)
 *     Sort       "Sort: Bright"         72px              98px
 *     action     "Defaults"/"Sure?"     43px              74px
 *
 * Narrow hosts get the tighter pair rather than one shared width. The app's
 * numbers in a 300px panel would leave the section title nowhere to go, and
 * the plugin never renders the wide labels anyway - its actions are icons.
 * These are floors, not fixed widths: an unexpected font should push a button
 * wider rather than clip its label.
 */
const SORT_BTN_W = { narrow: 'min-w-19', wide: 'min-w-26' };
const ACTION_BTN_W = { narrow: 'min-w-12', wide: 'min-w-20' };

/**
 * Header action for the Recent / Saved sections. Renders its label as text, or
 * as an icon where horizontal room is scarce (`iconActions`, used by the Figma
 * plugin). The label stays on as title/aria-label either way.
 */
function ActionButton({
  label,
  icon: Icon,
  iconOnly,
  onClick,
  confirm,
  onDropSwatch,
}: {
  label: string;
  icon: ComponentType<{ className?: string }>;
  iconOnly?: boolean;
  onClick: (e: ReactMouseEvent) => void;
  /** Require a second click. For the actions that throw away saved work. */
  confirm?: boolean;
  /**
   * Accept a swatch dragged onto the button. Deliberately skips `confirm`:
   * dropping one color on the bin is already a deliberate, aimed gesture, and
   * it names its own target - unlike Clear, which takes everything.
   */
  onDropSwatch?: () => void;
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

  const shown = armed ? 'Sure?' : label;
  return (
    <button
      className={`${ACTION_BTN_CLASS} ${iconOnly ? ACTION_BTN_W.narrow : ACTION_BTN_W.wide} transition-transform duration-100`}
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
      {iconOnly && !armed ? <Icon className="!size-3.5" /> : shown}
    </button>
  );
}

interface ColorHexagonProps {
  rgb: RGB;
  hue: number;
  brightness: number;
  saturation: number;
  hsl: HSL;
  onHueChange: (h: number) => void;
  onRgbChange: (channel: 'r' | 'g' | 'b', value: number) => void;
  onHsbChange: (newHsb: Partial<HSB>) => void;
  onHslChange: (channel: 'h' | 's' | 'l', value: number) => void;
  onAnimateToHsb?: (target: HSB) => void;
  blMode: 'brightness' | 'lightness';
  onBlModeChange: (mode: 'brightness' | 'lightness') => void;
  colorSpace: ColorSpace;
  onColorSpaceChange?: (cs: ColorSpace) => void;
  hoverMatchRgb?: RGB | null;
  showHtmlOnHex?: boolean;
  animHolding?: boolean;
  onHoverHtmlColor?: (marker: HoveredMarker | null) => void;
  muted?: boolean;
  /** Render Recent/Saved header actions as icons - for narrow hosts (Figma). */
  iconActions?: boolean;
  /** Drop the card border and "Hexagon" title: the host already frames it. */
  bare?: boolean;
  /** Content for the header slot the title vacates in `bare` mode. */
  headerLeft?: ReactNode;
  /** Extra controls rendered directly under the hexagon, above Recent. */
  belowStage?: ReactNode;
  /** Start Recent and Saved closed - they cost a lot of height in a panel. */
  collapsedSections?: boolean;
  /**
   * Shape of the Recent/Saved sections. 'flush' drops the card and gives them
   * the Figma sidebar look: a full-bleed rule above each, content inset by the
   * host's padding. See CollapsibleSection.
   */
  sectionVariant?: 'card' | 'flush';
  /**
   * Opacity of the current color, 0-100. Recorded alongside each Recent and
   * Saved swatch and shown on its right half, the way Figma does. Hosts with
   * no alpha concept leave it out and every swatch stays opaque.
   */
  alpha?: number;
  /** Restore a swatch's stored alpha when it is clicked. */
  onAlphaRestore?: (alpha: number) => void;
  /**
   * Let the wheel over the hexagon drive brightness/lightness. On a page that
   * is the natural gesture; in a panel that scrolls, it steals the wheel from
   * the panel, so a host with its own scroll turns it off.
   */
  wheelAdjusts?: boolean;
  /**
   * Draw the vertical brightness bar beside the hexagon. Off lets a host put
   * brightness on its own horizontal slider, and hands the width the bar was
   * reserving back to the hexagon.
   */
  blBar?: boolean;
  /**
   * Where the host's brightness handle sits, as a fraction of the hexagon's
   * width. Only used when blBar is off, to land the limit-hexagon connector on
   * the handle rather than near it - the slider's track and the hexagon are
   * different widths, so the value alone is not enough.
   */
  blHandleX?: number | null;
  /** Draw the line tying the brightness control to the limit hexagon. */
  blConnector?: boolean;
  /**
   * Rendered stem thickness in CSS px as [min, max]. The stems scale with the
   * hexagon, which across the plugin's range means 1.15px at the narrow end and
   * 3.3px at the wide one - too thin to read, then heavier than the handles.
   * Given a range they scale between those bounds instead. Omit for the plain
   * 2-user-unit behavior.
   */
  stemRange?: [number, number] | null;
}

interface HoveredMarker {
  x: number;
  y: number;
  hex: string;
  name: string;
}

export default function ColorHexagon({ rgb, hue, brightness, saturation, hsl, onHueChange, onRgbChange, onHsbChange, onHslChange, onAnimateToHsb, blMode, onBlModeChange, colorSpace, hoverMatchRgb, showHtmlOnHex, animHolding, onHoverHtmlColor, muted, iconActions, bare, headerLeft, belowStage, collapsedSections, sectionVariant = 'card', alpha = 100, onAlphaRestore, wheelAdjusts = true, blBar = true, blHandleX = null, blConnector = true, stemRange = null }: ColorHexagonProps) {
  const flushSections = sectionVariant === 'flush';
  // Horizontal extent of the SVG coordinate space. Without the bar the hexagon
  // is the whole picture, so the 50px reserved to its right goes away - and the
  // extent becomes twice CENTER_X, which is what actually puts the hexagon in
  // the middle. At HEX_SIZE it sat 10px left of center.
  const EXTENT = blBar ? SIZE : CENTER_X * 2;
  const [hexOpen, setHexOpen] = useState(true);
  const [vectorMode] = useState<ChannelOrder>('rgb');
  const [initialHex] = useState(() => rgbToHex(rgb.r, rgb.g, rgb.b));
  const [recentColors, setRecentColors] = useState<Swatch[]>(() => parseRecent(readSwatch(RECENT_KEY)));
  const [selectedRecentIdx, setSelectedRecentIdx] = useState<number | null>(null);

  const alphaRef = useRef(alpha);
  alphaRef.current = alpha;

  type SortMode = 'user' | 'hue' | 'saturation' | 'brightness' | 'alpha';
  const [savedSlots, setSavedSlots] = useState<SavedSlot[]>(() => parseSaved(readSwatch(SAVED_KEY)));
  const [selectedSavedIdx, setSelectedSavedIdx] = useState<number | null>(null);
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
  const liveHsbRef = useRef<HSB>({ h: hue, s: saturation, b: brightness });
  useEffect(() => { liveHsbRef.current = { h: hue, s: saturation, b: brightness }; }, [hue, saturation, brightness]);
  const toneActiveRef = useRef(false);
  const holdToneTimer = useRef<number | null>(null);
  const scheduleHoldTone = useCallback(() => {
    if (holdToneTimer.current !== null) clearTimeout(holdToneTimer.current);
    holdToneTimer.current = window.setTimeout(() => {
      if (!toneActiveRef.current) {
        toneController.start(liveHsbRef.current);
        toneActiveRef.current = true;
      }
      holdToneTimer.current = null;
    }, 250);
  }, []);
  const cancelHoldTone = useCallback(() => {
    if (holdToneTimer.current !== null) { clearTimeout(holdToneTimer.current); holdToneTimer.current = null; }
  }, []);

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
      setSavedSlots(parseSaved(readSwatch(SAVED_KEY)));
    };
    window.addEventListener(SWATCHES_READY, hydrate);
    return () => window.removeEventListener(SWATCHES_READY, hydrate);
  }, []);

  // Listen for global "reset all" — restore recent + saved to defaults.
  useEffect(() => {
    const onReset = () => {
      setRecentColors([]);
      setSavedSlots(defaultSaved());
      setSelectedRecentIdx(null);
      setSelectedSavedIdx(null);
    };
    window.addEventListener('color-taylor:reset-all', onReset);
    return () => window.removeEventListener('color-taylor:reset-all', onReset);
  }, []);

  // Display order — sorts a snapshot of the user's arrangement without mutating it.
  // Switching back to "user" mode restores the original positions.
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
    setSavedSlots(fitSaved(flattened));
    setSavedSortMode('user');
    setSelectedSavedIdx(null);
  }, [savedSlots, displaySlots, triggerPoof, playPop]);

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
    setSavedSlots(fitSaved(flattened));
    setSavedSortMode('user');
    setSelectedSavedIdx(displayIdx);
    playSave();
    if (navigator.vibrate) navigator.vibrate(10);
  }, [displaySlots, playSave]);

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
    setSavedSlots(fitSaved(flattened));
    setSavedSortMode('user');
    setSelectedSavedIdx(toDisplayIdx);
    playClick();
    if (navigator.vibrate) navigator.vibrate(8);
  }, [displaySlots, playClick, captureFlipRects]);

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

    setSavedSlots(fitSaved(flattened));
    setSavedSortMode('user');
    setSelectedSavedIdx(target);
    playClick();
    if (navigator.vibrate) navigator.vibrate(8);
  }, [displaySlots, playClick, captureFlipRects]);

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

  const cycleSavedSort = useCallback(() => {
    captureFlipRects(true);
    const order: SortMode[] = ['user', 'hue', 'saturation', 'brightness', 'alpha'];
    const next = order[(order.indexOf(savedSortMode) + 1) % order.length];
    setSavedSortMode(next);
    setSelectedSavedIdx(null);
  }, [savedSortMode, captureFlipRects]);

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

  const SORT_LABELS: Record<SortMode, string> = { user: 'User', hue: 'Hue', saturation: 'Sat', brightness: 'Bright', alpha: 'Alpha' };
  const draggingBL = useRef(false);
  const svgRef = useRef(null);
  const draggingHue = useRef(false);
  const draggingDot = useRef<{ index: number; channel: Channel; relative: boolean; startValue: number; startProjection: number; lockedRgb: RGB; lockedOrder: Channel[] } | null>(null);
  const draggingFree = useRef(false);
  const hexPointerDown = useRef(null);
  const startingBrightness = useRef(null); // brightness at drag start for rubber-band
  const blPointerDown = useRef(null);
  const [hoveredDot, setHoveredDot] = useState(null); // index of hovered dot
  // Separate from hoveredDot: a segment and the handle at its end are different
  // targets, and highlighting one should not light up the other.
  const [hoveredLeg, setHoveredLeg] = useState<number | null>(null);
  // SVG user units per rendered pixel. The hexagon and its legs scale with the
  // viewBox, but the handles should stay the same physical size, so their radii
  // and strokes are multiplied by this.
  const [uiScale, setUiScale] = useState(1);
  const [isHexDragging, setIsHexDragging] = useState(false);
  const [hoveredMarker, setHoveredMarker] = useState<HoveredMarker | null>(null);

  const dragTriggerDistance = 4;
  const clickMaxDuration = 200;

  useLayoutEffect(() => {
    const el = svgRef.current;
    if (!el) return;
    const measure = () => {
      const w = el.getBoundingClientRect().width;
      if (w > 0) setUiScale(EXTENT / w);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [EXTENT]);

  const getSvgCoords = useCallback((e: { clientX: number; clientY: number }) => {
    const rect = svgRef.current!.getBoundingClientRect();
    const sx = EXTENT / rect.width;
    const sy = HEX_SIZE / rect.height;
    return { x: (e.clientX - rect.left) * sx, y: (e.clientY - rect.top) * sy };
  }, [EXTENT]);

  const getHsbFromPosition = useCallback((svgX: number, svgY: number, clampOnly = false) => {
    const dx = svgX - CENTER_X;
    const dy = svgY - CENTER_Y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const angle = Math.atan2(-dy, dx);
    const edgeDist = hexEdgeDist(angle, RADIUS);

    // For initial clicks, reject if outside hex; for drags (clampOnly), clamp instead
    if (!clampOnly && dist > edgeDist) return null;

    let h = (angle * 180) / PI;
    if (h < 0) h += 360;
    const s = Math.round(Math.min((dist / edgeDist) * 100, 100));

    // Rubber-band brightness: expand if outside limit, snap back if inside
    const base = startingBrightness.current ?? brightness;
    const limitEdgeDist = hexEdgeDist(angle, RADIUS * base / 100);
    let b;
    if (dist <= limitEdgeDist) {
      b = base;
    } else {
      b = Math.min(100, Math.round((dist / edgeDist) * 100));
    }
    return { h: Math.round(h), s, b };
  }, [brightness]);

  const hueFromMouse = useCallback((e: { clientX: number; clientY: number }) => {
    const { x, y } = getSvgCoords(e);
    let angle = Math.atan2(-(y - CENTER_Y), x - CENTER_X) * (180 / PI);
    if (angle < 0) angle += 360;
    const h = Math.round(angle);
    onHueChange(h);
    return h;
  }, [onHueChange, getSvgCoords]);

  // Vector chain
  // eslint-disable-next-line react-hooks/exhaustive-deps -- rgb accessed via dynamic key; r/g/b deps cover all reads
  const order = useMemo(() => getOrder(vectorMode, rgb), [vectorMode, rgb.r, rgb.g, rgb.b]);
  const scale = RADIUS / 255;
  const { points, dotNames } = useMemo(() => {
    const p0 = { x: CENTER_X, y: CENTER_Y };
    const pts = [p0];
    const names = ['origin'];
    let current = p0;
    for (const ch of order) {
      const dir = DIRS[ch];
      const value = rgb[ch];
      current = {
        x: current.x + value * scale * dir.x,
        y: current.y + value * scale * dir.y,
      };
      pts.push(current);
      names.push(ch === 'r' ? 'red' : ch === 'g' ? 'green' : 'blue');
    }
    return { points: pts, dotNames: names };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- rgb accessed via dynamic key; r/g/b deps cover all reads
  }, [order, rgb.r, rgb.g, rgb.b, scale]);

  /**
   * Same hue, lifted - the hover state of any element is its own color,
   * lighter.
   *
   * A pure primary is already at full brightness, so raising it does nothing
   * and hover would be invisible. With no headroom left, lighten by pulling
   * saturation out instead, which is what "lighter" means for a saturated
   * color.
   */
  const lift = useCallback((hex: string, amount = 22) => {
    const c = hexToRgb(hex);
    if (!c) return hex;
    const h = rgbToHsb(c.r, c.g, c.b);
    const next = h.b >= 100
      ? { h: h.h, s: Math.max(0, h.s - amount * 1.6), b: 100 }
      : lighter(h.h, h.s, h.b, amount);
    const out = hsbToRgb(next.h, next.s, next.b);
    return rgbToHex(out.r, out.g, out.b);
  }, []);

  /** The color the field shows at each joint - each handle's fill. */
  const dotColors = useMemo(() => points.map((p) => {
    const c = colorAtPoint(p.x, p.y, brightness);
    return rgbToHex(c.r, c.g, c.b);
  }), [points, brightness]);

  // hueLabel is the pill's center - HueHandle is translated -50%/-50% onto it -
  // so the hue line ending here points at the pill rather than stopping short
  // at the circumscribed circle. The pill is opaque and painted above the SVG,
  // so the last stretch is hidden behind it.
  const { hueLabel } = useMemo(() => {
    const rad = (hue * PI) / 180;
    return {
      hueLabel: {
        x: CENTER_X + (RADIUS + 28) * Math.cos(rad),
        y: CENTER_Y - (RADIUS + 28) * Math.sin(rad),
      },
    };
  }, [hue]);

  const hoverDot = useMemo(() => {
    if (!hoverMatchRgb) return null;
    const hsb = rgbToHsb(hoverMatchRgb.r, hoverMatchRgb.g, hoverMatchRgb.b);
    const rad = (hsb.h * PI) / 180;
    const edgeDist = hexEdgeDist(rad, RADIUS);
    const dist = (hsb.s / 100) * edgeDist;
    return {
      x: CENTER_X + dist * Math.cos(rad),
      y: CENTER_Y - dist * Math.sin(rad),
      hex: rgbToHex(hoverMatchRgb.r, hoverMatchRgb.g, hoverMatchRgb.b),
    };
  }, [hoverMatchRgb]);

  const showHueLine = saturation > 0;

  // Named color markers on hex
  const htmlColorMarkers = useMemo(() => {
    if (!showHtmlOnHex) return [];
    return NAMED_COLORS.map((c) => {
      const hsb = rgbToHsb(c.r, c.g, c.b);
      // Only show colors within ±15 brightness of current
      if (Math.abs(hsb.b - brightness) > 15) return null;
      const rad = (hsb.h * PI) / 180;
      // Position at where it would be at the color's own brightness level
      const colorLimitRadius = RADIUS * hsb.b / 100;
      const edgeDist = hexEdgeDist(rad, colorLimitRadius);
      const dist = (hsb.s / 100) * edgeDist;
      return {
        x: CENTER_X + dist * Math.cos(rad),
        y: CENTER_Y - dist * Math.sin(rad),
        hex: rgbToHex(c.r, c.g, c.b),
        name: c.name,
      };
    }).filter(Boolean);
  }, [showHtmlOnHex, brightness]);

  // Highlight and add to recent — only after color has settled (1000ms).
  // Exception: highlight immediately during animation hold phases.
  const currentHex = rgbToHex(rgb.r, rgb.g, rgb.b);
  const addRecentTimer = useRef(null);
  const recentColorsRef = useRef(recentColors);
  recentColorsRef.current = recentColors;
  const animHoldingRef = useRef(animHolding);
  animHoldingRef.current = animHolding;

  // Immediate highlight during animation holds
  useEffect(() => {
    if (animHolding) {
      const matchIdx = recentColors.findIndex((c) => c.hex === currentHex && c.alpha === alpha);
      setSelectedRecentIdx(matchIdx !== -1 ? matchIdx : null);
    }
  }, [animHolding, currentHex, alpha, recentColors]);

  // Reset debounce on currentHex change only; reads latest recentColors via ref
  // to avoid restarting the timer when the recent list updates.
  useEffect(() => {
    if (!animHoldingRef.current) setSelectedRecentIdx(null);

    if (addRecentTimer.current) clearTimeout(addRecentTimer.current);
    addRecentTimer.current = setTimeout(() => {
      if (skipNextRecent.current) {
        skipNextRecent.current = false;
        lastRecorded.current = swatchKey(currentHex, alphaRef.current);
        return;
      }
      const a = alphaRef.current;
      const matchIdx = recentColorsRef.current.findIndex((c) => c.hex === currentHex && c.alpha === a);
      if (matchIdx !== -1) {
        setSelectedRecentIdx(matchIdx);
        lastRecorded.current = swatchKey(currentHex, a);
        return;
      }
      if (swatchKey(currentHex, a) !== lastRecorded.current) {
        lastRecorded.current = swatchKey(currentHex, a);
        setRecentColors((prev) => {
          if (prev.some((c) => c.hex === currentHex && c.alpha === a)) return prev;
          return [{ hex: currentHex, alpha: a }, ...prev].slice(0, 12);
        });
        setSelectedRecentIdx(0);
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
  }, [currentHex, alpha]);

  const addToRecent = useCallback((hex: string) => {
    const a = alphaRef.current;
    skipNextRecent.current = true;
    lastRecorded.current = swatchKey(hex, a);
    setRecentColors((prev) => {
      const filtered = prev.filter((c) => !(c.hex === hex && c.alpha === a));
      return [{ hex, alpha: a }, ...filtered].slice(0, 12);
    });
    setSelectedRecentIdx(0);
  }, []);

  // Solve for multiple channel values given a target 2D position
  const solveChannels = useCallback((targetX: number, targetY: number, channelKeys: Channel[]) => {
    const dx = targetX - CENTER_X;
    const dy = targetY - CENTER_Y;
    const n = channelKeys.length;

    if (n === 1) {
      const dir = DIRS[channelKeys[0]];
      const proj = dx * dir.x + dy * dir.y;
      return { [channelKeys[0]]: Math.max(0, Math.min(255, Math.round(proj / scale))) };
    }

    if (n === 2) {
      // Solve 2x2 linear system: dx = a*d1x + b*d2x, dy = a*d1y + b*d2y
      const d1 = DIRS[channelKeys[0]], d2 = DIRS[channelKeys[1]];
      const det = d1.x * d2.y - d1.y * d2.x;
      if (Math.abs(det) < 0.0001) return null;
      const a = (dx * d2.y - dy * d2.x) / det / scale;
      const b = (d1.x * dy - d1.y * dx) / det / scale;
      return {
        [channelKeys[0]]: Math.max(0, Math.min(255, Math.round(a))),
        [channelKeys[1]]: Math.max(0, Math.min(255, Math.round(b))),
      };
    }

    // n >= 3: underdetermined, use geometric H+S approach
    return null;
  }, [scale]);

  // Drag handlers
  const handleDotDrag = useCallback((e: { clientX: number; clientY: number }) => {
    if (draggingDot.current && onRgbChange) {
      const { index, channel } = draggingDot.current;
      const isLast = index === points.length - 1;
      const isRelative = draggingDot.current.relative;

      // Dot drag (non-relative): free multi-channel solve based on which dot
      if (!isRelative) {
        const { x, y } = getSvgCoords(e);

        // Last dot (all 3 channels): set color from hex position
        if (isLast && onHsbChange) {
          startingBrightness.current = startingBrightness.current ?? brightness;
          const picked = getHsbFromPosition(x, y, true);
          if (picked) onHsbChange(picked);
          return;
        }

        // Solve for channels 0..index-1
        const channelKeys = order.slice(0, index);
        const solved = solveChannels(x, y, channelKeys);
        if (solved) {
          for (const [ch, val] of Object.entries(solved)) {
            onRgbChange(ch as 'r' | 'g' | 'b', val as number);
          }
          return;
        }
      }

      // Segment drag (relative): adjust only this dot's channel
      const { x, y } = getSvgCoords(e);
      const { startValue, startProjection } = draggingDot.current;
      let prev = { x: CENTER_X, y: CENTER_Y };
      for (let i = 0; i < index - 1; i++) {
        const ch = order[i];
        const dir = DIRS[ch];
        prev = {
          x: prev.x + rgb[ch] * scale * dir.x,
          y: prev.y + rgb[ch] * scale * dir.y,
        };
      }
      const dir = DIRS[channel];
      const dx = x - prev.x;
      const dy = y - prev.y;
      const currentProjection = dx * dir.x + dy * dir.y;
      const delta = (currentProjection - startProjection) / scale;
      const value = Math.max(0, Math.min(255, Math.round(startValue + delta)));
      onRgbChange(channel, value);
    }
    if (draggingFree.current && onHsbChange) {
      const { x, y } = getSvgCoords(e);
      const picked = getHsbFromPosition(x, y, true);
      if (picked) onHsbChange(picked);
    }
  }, [getSvgCoords, onRgbChange, onHsbChange, points, scale, getHsbFromPosition, order, rgb, brightness, solveChannels]);

  const getBLValueFromClientY = useCallback((clientY: number) => {
    if (!svgRef.current) return null;
    const svgRect = svgRef.current.getBoundingClientRect();
    const sy = HEX_SIZE / svgRect.height;
    const svgY = (clientY - svgRect.top) * sy;
    const y = Math.max(0, Math.min(svgY - BL_BAR_TOP, BL_BAR_HEIGHT));
    return Math.round((1 - y / BL_BAR_HEIGHT) * 100);
  }, []);

  const applyBLValue = useCallback((value: number) => {
    if (blMode === 'brightness') {
      onHsbChange({ b: value });
    } else if (onHslChange) {
      onHslChange('l', value);
    }
  }, [blMode, onHsbChange, onHslChange]);

  const animateBLToValue = useCallback((targetValue: number) => {
    if (!onAnimateToHsb) return;
    if (blMode === 'brightness') {
      onAnimateToHsb({ h: hue, s: saturation, b: targetValue });
    } else {
      // Convert target lightness to HSB via RGB for tweening
      const currentRgb = hsbToRgb(hue, saturation, brightness);
      const currentHsl = rgbToHsl(currentRgb.r, currentRgb.g, currentRgb.b);
      const targetRgb = hslToRgb(currentHsl.h, currentHsl.s, targetValue);
      const targetHsb = rgbToHsb(targetRgb.r, targetRgb.g, targetRgb.b);
      onAnimateToHsb(targetHsb);
    }
  }, [blMode, onAnimateToHsb, hue, saturation, brightness]);

  const handleHexSurfaceDrag = useCallback((e: { clientX: number; clientY: number }) => {
    if (!hexPointerDown.current || !onHsbChange) return null;
    const { x, y } = getSvgCoords(e);
    const picked = getHsbFromPosition(x, y, true);
    if (picked) onHsbChange(picked);
    return picked ?? null;
  }, [getSvgCoords, getHsbFromPosition, onHsbChange]);

  // Global mouse listeners
  useEffect(() => {
    const clearAll = () => {
      draggingHue.current = false;
      draggingDot.current = null;
      draggingFree.current = false;
      draggingBL.current = false;
      hexPointerDown.current = null;
      blPointerDown.current = null;
      startingBrightness.current = null;
      setHoveredDot(null);
      setIsHexDragging(false);
      cancelHoldTone();
      if (toneActiveRef.current) {
        toneController.release();
        toneActiveRef.current = false;
      }
    };
    const ensureToneStart = () => {
      cancelHoldTone();
      if (!toneActiveRef.current) {
        toneController.start(liveHsbRef.current);
        toneActiveRef.current = true;
      }
    };
    const updateTone = (partial: Partial<HSB>) => {
      if (!toneActiveRef.current) return;
      toneController.update({ ...liveHsbRef.current, ...partial });
    };
    const onPointerMove = (e: PointerEvent) => {
      if (draggingHue.current) {
        ensureToneStart();
        const newH = hueFromMouse(e);
        if (typeof newH === 'number') updateTone({ h: newH });
      }
      if (draggingDot.current) {
        ensureToneStart();
        handleDotDrag(e);
        updateTone({});
      }
      if (draggingBL.current) {
        ensureToneStart();
        const val = getBLValueFromClientY(e.clientY);
        if (val !== null) {
          applyBLValue(val);
          if (blMode === 'brightness') updateTone({ b: val });
          else updateTone({});
        }
      }
      if (draggingFree.current) {
        ensureToneStart();
        const { x, y } = getSvgCoords(e);
        const picked = getHsbFromPosition(x, y);
        if (picked) { onHsbChange(picked); updateTone(picked); }
      }
      if (hexPointerDown.current) {
        const pd = hexPointerDown.current;
        if (!pd.isDragging) {
          const dx = e.clientX - pd.clientX;
          const dy = e.clientY - pd.clientY;
          if (Math.sqrt(dx * dx + dy * dy) >= dragTriggerDistance) {
            pd.isDragging = true;
            setIsHexDragging(true);
          }
        }
        if (pd.isDragging) {
          ensureToneStart();
          const picked = handleHexSurfaceDrag(e);
          if (picked) updateTone(picked);
        }
      }
      if (blPointerDown.current) {
        const pd = blPointerDown.current;
        if (!pd.isDragging) {
          const dx = e.clientX - pd.clientX;
          const dy = e.clientY - pd.clientY;
          if (Math.sqrt(dx * dx + dy * dy) >= dragTriggerDistance) pd.isDragging = true;
        }
        if (pd.isDragging) {
          ensureToneStart();
          const val = getBLValueFromClientY(e.clientY);
          if (val !== null) {
            applyBLValue(val);
            if (blMode === 'brightness') updateTone({ b: val });
            else updateTone({});
          }
        }
      }
    };
    const onPointerUp = (e: PointerEvent) => {
      if (hexPointerDown.current && !hexPointerDown.current.isDragging) {
        const elapsed = Date.now() - hexPointerDown.current.time;
        if (elapsed <= clickMaxDuration && onAnimateToHsb) {
          const { x, y } = getSvgCoords(e);
          const picked = getHsbFromPosition(x, y);
          if (picked) {
            const targetRgb = hsbToRgb(picked.h, picked.s, picked.b);
            addToRecent(rgbToHex(targetRgb.r, targetRgb.g, targetRgb.b));
            onAnimateToHsb(picked);
            if (navigator.vibrate) navigator.vibrate(12);
          }
        }
      }
      if (blPointerDown.current && !blPointerDown.current.isDragging) {
        const elapsed = Date.now() - blPointerDown.current.time;
        if (elapsed <= clickMaxDuration) {
          const val = getBLValueFromClientY(e.clientY);
          if (val !== null) animateBLToValue(val);
        }
      }
      clearAll();
    };
    const onPointerLeave = () => clearAll();
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    document.documentElement.addEventListener('pointerleave', onPointerLeave);
    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      document.documentElement.removeEventListener('pointerleave', onPointerLeave);
    };
  }, [hueFromMouse, handleDotDrag, handleHexSurfaceDrag, getBLValueFromClientY, applyBLValue, animateBLToValue, getSvgCoords, getHsbFromPosition, onAnimateToHsb, onHsbChange, addToRecent, blMode, cancelHoldTone]);

  // Non-passive wheel listener to prevent page scroll. Not registered at all
  // when the host owns the wheel - a listener that conditionally declines to
  // preventDefault still has to be non-passive, which costs the browser its
  // scrolling fast path for no reason.
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg || !wheelAdjusts) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const step = Math.abs(e.deltaY) > 50 ? 2 : 1;
      const delta = e.deltaY > 0 ? -step : step;
      if (blMode === 'brightness') {
        const target = Math.max(0, Math.min(100, brightness + delta));
        onHsbChange({ b: target });
      } else if (onHslChange) {
        const currentL = hsl?.l ?? 50;
        const target = Math.max(0, Math.min(100, currentL + delta));
        if (target >= 99) {
          onHsbChange({ h: hue, s: 0, b: 100 });
        } else if (target <= 1) {
          onHsbChange({ h: hue, s: saturation, b: 0 });
        } else {
          onHslChange('l', target);
        }
      }
    };
    svg.addEventListener('wheel', onWheel, { passive: false });
    return () => svg.removeEventListener('wheel', onWheel);
  }, [wheelAdjusts, blMode, brightness, hsl?.l, hue, saturation, onHsbChange, onHslChange]);

  const handleHueDragStart = (e: ReactPointerEvent) => {
    e.preventDefault();
    draggingHue.current = true;
    hueFromMouse(e);
    scheduleHoldTone();
  };

  const handleDotMouseDown = (e: ReactPointerEvent, dotIndex: number, relative = false) => {
    if (dotIndex === 0) return;
    e.preventDefault();
    e.stopPropagation();
    setHoveredDot(dotIndex);
    const channel = order[dotIndex - 1];
    const { x, y } = getSvgCoords(e);
    let prev = { x: CENTER_X, y: CENTER_Y };
    for (let i = 0; i < dotIndex - 1; i++) {
      const ch = order[i];
      const dir = DIRS[ch];
      prev = {
        x: prev.x + rgb[ch] * scale * dir.x,
        y: prev.y + rgb[ch] * scale * dir.y,
      };
    }
    const dir = DIRS[channel];
    const startProjection = (x - prev.x) * dir.x + (y - prev.y) * dir.y;
    draggingDot.current = {
      index: dotIndex,
      channel,
      lockedRgb: { ...rgb },
      lockedOrder: [...order],
      startValue: rgb[channel],
      startProjection,
      relative,
    };
  };

  const handleHexMouseDown = useCallback((e: ReactPointerEvent) => {
    const { x, y } = getSvgCoords(e);
    const dx = x - CENTER_X;
    const dy = y - CENTER_Y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const angle = Math.atan2(-dy, dx);
    const edgeDist = hexEdgeDist(angle, RADIUS);
    if (dist > edgeDist) return;
    startingBrightness.current = brightness;
    hexPointerDown.current = {
      clientX: e.clientX,
      clientY: e.clientY,
      time: Date.now(),
      isDragging: false,
    };
    scheduleHoldTone();
  }, [getSvgCoords, brightness, scheduleHoldTone]);

  const handleColorLabelClick = useCallback((deg: number) => {
    if (!onAnimateToHsb) return;
    let target;
    if (blMode === 'brightness') {
      target = { h: deg, s: 100, b: 100 };
    } else {
      const targetRgb = hslToRgb(deg, 100, 50);
      target = rgbToHsb(targetRgb.r, targetRgb.g, targetRgb.b);
    }
    const rgb = hsbToRgb(target.h, target.s, target.b);
    addToRecent(rgbToHex(rgb.r, rgb.g, rgb.b));
    onAnimateToHsb(target);
  }, [onAnimateToHsb, blMode, addToRecent]);

  // Brightness limit hex
  /**
   * User units that render at a fixed pixel size, whatever the panel width.
   *
   * Everything inside the SVG is drawn in a fixed viewBox, so a plain
   * strokeWidth scales with the panel - at the narrow end the dashed strokes
   * fall under a device pixel and wash out. Multiplying by uiScale (user units
   * per rendered px) cancels that exactly.
   *
   * Dash patterns go through it too, or the texture drifts even when the line
   * itself holds. At the viewBox's natural size every call below is a no-op,
   * so these resolve to the values the hexagon has always used.
   */
  const pxUnits = (n: number) => n * uiScale;

  const limitHex = useMemo(() => {
    const limitScale = blMode === 'brightness'
      ? brightness / 100
      : 1 - Math.abs(2 * (hsl?.l ?? 50) / 100 - 1);
    const limitRadius = RADIUS * Math.min(limitScale, 1);
    const blValue = blMode === 'brightness' ? brightness : (hsl?.l ?? 50);
    const arrowY = BL_BAR_TOP + (1 - blValue / 100) * BL_BAR_HEIGHT;
    const arrowTipX = BL_BAR_X - BL_ARROW_SIZE - 2;
    const dx = CENTER_X - arrowTipX;
    const dy = CENTER_Y - arrowY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const angle = Math.atan2(-dy, dx);
    const edgeDist = hexEdgeDist(angle, limitRadius);
    // Where the horizontal slider's handle meets the bottom edge, and the point
    // where the line from there to the center crosses the limit hexagon - so
    // the connector points at the middle rather than dropping straight down.
    const sliderX = (blHandleX ?? blValue / 100) * HEX_SIZE;
    const sdx = CENTER_X - sliderX;
    const sdy = CENTER_Y - HEX_SIZE;
    const sdist = Math.sqrt(sdx * sdx + sdy * sdy) || 1;
    const sEdge = hexEdgeDist(Math.atan2(-sdy, sdx), limitRadius);

    return {
      limitScale,
      limitRadius,
      perimX: CENTER_X - (dx / dist) * edgeDist,
      perimY: CENTER_Y - (dy / dist) * edgeDist,
      arrowTipX,
      arrowY,
      sliderX,
      downX: CENTER_X - (sdx / sdist) * sEdge,
      downY: CENTER_Y - (sdy / sdist) * sEdge,
    };
  }, [blMode, brightness, hsl?.l, blHandleX]);

  return (
    <div
      id="color-hexagon"
      // Built by joining whole strings, not by interpolating into one. Tailwind
      // scans raw source text: `...max-w-full${cond}` makes the extractor read
      // `max-w-full${cond` as the candidate, so the utility is never generated
      // and the card silently overflows its column.
      className={[
        'flex flex-col items-center gap-1 max-w-full',
        bare ? 'w-full' : 'border border-input rounded-lg p-3',
      ].join(' ')}
      style={bare ? undefined : { width: HEX_PANEL_WIDTH }}
    >
      <div className="flex items-start gap-1.5 w-full">
        {/* In `bare` hosts the surrounding chrome is the container, so the
            title and its collapse affordance are redundant. The Bright/Light
            tabs stay - they are a control, not decoration. */}
        {!bare && (
          <div
            className="flex items-center gap-1.5 flex-1 min-w-0 cursor-pointer select-none"
            onClick={() => setHexOpen((o) => !o)}
          >
            <ChevronRight className={`!size-4 text-muted-foreground transition-transform duration-200 ${hexOpen ? 'rotate-90' : ''}`} />
            <h2 className="text-lg font-semibold tracking-tight text-foreground">Hexagon</h2>
          </div>
        )}
        {bare && <div className="flex-1 min-w-0">{headerLeft}</div>}
        {hexOpen && (
          <div className="flex items-start gap-2" onClick={(e) => e.stopPropagation()}>
            <div className="flex flex-col items-center gap-0.5">
              <Tabs value={blMode} onValueChange={onBlModeChange}>
                <TabsList>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span><TabsTrigger value="brightness" className="w-14">HSB</TabsTrigger></span>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" sideOffset={8} className="text-xs font-semibold">HSB brightness</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span><TabsTrigger value="lightness" className="w-14">HSL</TabsTrigger></span>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" sideOffset={8} className="text-xs font-semibold">HSL lightness</TooltipContent>
                  </Tooltip>
                </TabsList>
              </Tabs>
              <span className="text-[10px] text-muted-foreground">Luminance</span>
            </div>
          </div>
        )}
      </div>
      {hexOpen && <>
      {/* id is a styling hook for narrow hosts. The hue badge and brightness
          pill are absolutely positioned against this element at percentage
          offsets but sized in fixed px, so anything narrower than
          HEX_PANEL_WIDTH must cap this width to keep them on screen. Padding
          cannot do it - abs-positioned children resolve against the padding
          box. See figma/ui/figma.css. */}
      <div id="hex-stage" className="w-full relative m-4" style={{ maxWidth: EXTENT, aspectRatio: `${EXTENT} / ${DISPLAY_HEIGHT}` }}>
      <div className="absolute left-0 top-1/2 w-full -translate-y-1/2" style={{ aspectRatio: `${EXTENT} / ${HEX_SIZE}` }}>
        <HexCanvas brightness={brightness} colorSpace={colorSpace} extent={EXTENT} />
        <svg
          id="hex-svg"
          ref={svgRef}
          viewBox={`0 0 ${EXTENT} ${HEX_SIZE}`}
          preserveAspectRatio="xMidYMid meet"
          role="img"
          aria-label="Color hexagon with RGB vector visualization"
          className="absolute inset-0 z-[5] w-full h-full touch-none"
          onPointerDown={handleHexMouseDown}
        >
          <circle id="hex-circumscribe" cx={CENTER_X} cy={CENTER_Y} r={RADIUS} fill="none" stroke="var(--input)" strokeWidth={1.5} />
          <polygon id="hex-outline" points={hexPoints(CENTER_X, CENTER_Y, RADIUS)} fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth={1} />

          {/* Brightness limit hex + connector */}
          {limitHex.limitScale < 1 && (
            <polygon
              id="hex-brightness-limit"
              points={hexPoints(CENTER_X, CENTER_Y, limitHex.limitRadius)}
              fill="none" stroke="rgba(128,128,128,0.5)" strokeWidth={pxUnits(2)} strokeDasharray={`${pxUnits(1)} ${pxUnits(4)}`} strokeLinecap="round"
            />
          )}
          {/* Ties the brightness control to the limit hexagon. With the bar it
              runs to the bar's arrow; without it, down to the bottom edge at
              the x the brightness value sits at, which is where the horizontal
              slider's handle is. */}
          {blBar ? (
            <line
              x1={limitHex.arrowTipX} y1={limitHex.arrowY} x2={limitHex.perimX} y2={limitHex.perimY}
              stroke="rgba(128,128,128,0.5)" strokeWidth={pxUnits(2)} strokeDasharray={`${pxUnits(1)} ${pxUnits(4)}`} strokeLinecap="round"
            />
          ) : blConnector ? (
            <line
              id="hex-brightness-connector"
              x1={limitHex.sliderX} y1={HEX_SIZE} x2={limitHex.downX} y2={limitHex.downY}
              stroke="rgba(128,128,128,0.5)" strokeWidth={pxUnits(2)} strokeDasharray={`${pxUnits(1)} ${pxUnits(4)}`} strokeLinecap="round"
            />
          ) : null}

          {/* HTML named color markers */}
          {htmlColorMarkers.map((m) => (
            <circle
              key={m.name}
              cx={m.x}
              cy={m.y}
              r={4}
              fill={m.hex}
              stroke="rgba(255,255,255,0.5)"
              strokeWidth={1}
              className="cursor-pointer"
              onMouseEnter={() => { setHoveredMarker(m); onHoverHtmlColor?.(m); }}
              onMouseLeave={() => { setHoveredMarker(null); onHoverHtmlColor?.(null); }}
              onClick={(e) => {
                e.stopPropagation();
                if (onAnimateToHsb) {
                  const parsed = rgbToHsb(
                    parseInt(m.hex.slice(1, 3), 16),
                    parseInt(m.hex.slice(3, 5), 16),
                    parseInt(m.hex.slice(5, 7), 16),
                  );
                  addToRecent(m.hex);
                  onAnimateToHsb(parsed);
                }
              }}
            />
          ))}

          {/* Hue line */}
          {showHueLine && (
            <line id="hue-line" x1={CENTER_X} y1={CENTER_Y} x2={hueLabel.x} y2={hueLabel.y}
              stroke="rgba(255,255,255,0.5)" strokeWidth={pxUnits(2)} strokeDasharray={`${pxUnits(4)} ${pxUnits(4)}`}
            />
          )}

          {/* Vector line segments */}
          {points.slice(1).map((p, i) => {
            const prev = points[i];
            const ch = order[i];
            const chValue = rgb[ch];
            // Hide zero-value segments during hex surface drag
            if (isHexDragging && chValue === 0 && ch !== 'r') return null;
            const baseColor = CHANNEL_COLOR[ch];
            const hoverColor = lift(baseColor);
            // uiScale is user-units-per-rendered-px, so a target thickness in
            // px converts by multiplying, and the natural size is where the
            // upper bound lands.
            const stemPx = stemRange
              ? Math.min(stemRange[1], Math.max(stemRange[0], stemRange[1] / uiScale))
              : 2 / uiScale;
            const stemUnits = stemPx * uiScale;
            const isHighlighted = hoveredLeg === i;
            const dotIndex = i + 1;
            return (
              <g key={i}>
                {/* Invisible wider hit area for easier clicking */}
                <line
                  x1={prev.x} y1={prev.y} x2={p.x} y2={p.y}
                  stroke="transparent"
                  strokeWidth={12}
                  strokeLinecap="round"
                  className="cursor-pointer touch-none"
                  onPointerEnter={() => {
                    if (draggingDot.current || draggingFree.current) return;
                    setHoveredLeg(i);
                  }}
                  onPointerLeave={() => {
                    if (!draggingDot.current && !draggingFree.current) setHoveredLeg(null);
                  }}
                  onPointerDown={(e) => handleDotMouseDown(e, dotIndex, true)}
                />
                {/* Visible segment */}
                <line
                  x1={prev.x} y1={prev.y} x2={p.x} y2={p.y}
                  stroke={isHighlighted ? hoverColor : baseColor}
                  strokeWidth={isHighlighted ? stemUnits * 1.5 : stemUnits}
                  strokeLinecap="round"
                  className="pointer-events-none"
                />
              </g>
            );
          })}

          {/* Dots */}
          {points.map((p, i) => {
            const isDraggable = i > 0;
            const ch = i > 0 ? order[i - 1] : null;
            // Hide zero-value dots during hex surface drag (except origin and red)
            if (isHexDragging && ch && ch !== 'r' && rgb[ch] === 0) return null;
            const isHighlighted = isDraggable && hoveredDot === i;
            const isOrigin = i === 0;
            // uiScale keeps the handles a constant size on screen while the
            // hexagon and its legs scale with the viewBox.
            const k = uiScale;

            if (isOrigin) {
              return (
                <circle
                  key={i} id={`rgb-dot-${dotNames[i]}`} cx={p.x} cy={p.y}
                  r={3 * k} fill="#ff0000"
                />
              );
            }

            const handlers = isDraggable ? {
              onPointerDown: (e: ReactPointerEvent) => handleDotMouseDown(e, i),
              // Ignored mid-drag: the element being dragged keeps the highlight
              // rather than handing it to whatever the pointer passes over.
              onPointerEnter: () => {
                if (draggingDot.current || draggingFree.current) return;
                setHoveredDot(i);
              },
              onPointerLeave: () => {
                if (!draggingDot.current && !draggingFree.current) setHoveredDot(null);
              },
            } : {};

            // Border is the channel this handle belongs to, at full strength;
            // fill is the color the field shows underneath it.
            const baseRing = CHANNEL_COLOR[ch];
            const hoverRing = lift(baseRing);
            // Thickens outward on hover, same 1.5x the stems use.
            const ringW = isHighlighted ? HANDLE.ring * HANDLE.hoverScale : HANDLE.ring;

            return (
              <g
                key={i}
                className={isDraggable ? 'cursor-pointer touch-none' : ''}
                // Through pxUnits like every other stroke here: a CSS filter on
                // an SVG element measures in user space, so the shadow scaled
                // with the panel - about 1.3px of blur when narrow and 3.8px
                // when wide, against the slider handles flat 2.5px.
                style={{ filter: `drop-shadow(0 ${pxUnits(HANDLE.shadowY)}px ${pxUnits(HANDLE.shadowBlur)}px ${HANDLE.shadowColor})` }}
                {...handlers}
              >
                <circle
                  id={`rgb-dot-${dotNames[i]}`}
                  cx={p.x} cy={p.y} r={ringRadius(ringW) * k}
                  fill={dotColors[i]}
                  stroke={isHighlighted ? hoverRing : baseRing}
                  strokeWidth={ringW * k}
                />
                {/* The tint inside the ring, matching the slider handles. */}
                <circle
                  cx={p.x} cy={p.y} r={(ringRadius(ringW) + ringW / 2 - 0.5) * k}
                  fill="none" stroke={HANDLE.inner} strokeWidth={k}
                />
              </g>
            );
          })}

          {/* Hover preview dot for named color match */}
          {hoverDot && (
            <circle
              cx={hoverDot.x}
              cy={hoverDot.y}
              r={10}
              fill={hoverDot.hex}
              stroke="white"
              strokeWidth={2}
              strokeDasharray="3 3"
              className="pointer-events-none"
              style={{ filter: 'drop-shadow(0 0 4px rgba(0,0,0,0.5))' }}
            />
          )}

          {blBar && (
            <BrightnessBar
              hue={hue} saturation={saturation} brightness={brightness} hsl={hsl}
              blMode={blMode} blPointerDownRef={blPointerDown} draggingBLRef={draggingBL}
              animateBLToValue={animateBLToValue} colorSpace={colorSpace}
            />
          )}
        </svg>

        <ColorLabels onColorClick={handleColorLabelClick} extent={EXTENT} />

        {/* HTML color marker tooltip */}
        {hoveredMarker && (() => {
          const mr = parseInt(hoveredMarker.hex.slice(1, 3), 16);
          const mg = parseInt(hoveredMarker.hex.slice(3, 5), 16);
          const mb = parseInt(hoveredMarker.hex.slice(5, 7), 16);
          const tc = (mr * 0.299 + mg * 0.587 + mb * 0.114) > 150 ? '#000' : '#fff';
          return (
            <div
              className="absolute z-[9] -translate-x-1/2 pointer-events-none"
              style={{ left: hoveredMarker.x, top: hoveredMarker.y - 14 }}
            >
              <div
                className="px-2 py-1 rounded-md text-xs font-semibold whitespace-nowrap shadow-md -translate-y-full"
                style={{ backgroundColor: hoveredMarker.hex, color: tc }}
              >
                {hoveredMarker.name}
                <div
                  className="absolute left-1/2 -translate-x-1/2 -bottom-[5px] w-0 h-0"
                  style={{
                    borderLeft: '5px solid transparent',
                    borderRight: '5px solid transparent',
                    borderTop: `5px solid ${hoveredMarker.hex}`,
                  }}
                />
              </div>
            </div>
          );
        })()}
        {showHueLine && <HueHandle hue={hue} hueLabel={hueLabel} extent={EXTENT} onMouseDown={handleHueDragStart} />}
        {blBar && <BrightnessMarkers onPick={animateBLToValue} />}
        {blBar && (
          <BrightnessHandle
            hue={hue}
            saturation={saturation}
            brightness={brightness}
            hsl={hsl}
            blMode={blMode}
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
              draggingBL.current = true;
              scheduleHoldTone();
            }}
          />
        )}
      </div>
      </div>

      {belowStage && <div className="w-full">{belowStage}</div>}

      {/* Recent Colors + Named Color Match */}
      <div className={flushSections ? 'w-full section-flush' : 'w-full mt-2'}>
        <CollapsibleSection
          id="recent-colors"
          title="Recent"
          variant={sectionVariant}
          defaultOpen={!collapsedSections}
          headerRight={
            <div className="flex gap-1">
              <ActionButton
                label="Clear"
                icon={Trash2}
                iconOnly={iconActions}
                confirm
                onClick={(e) => { e.stopPropagation(); setRecentColors([]); setSelectedRecentIdx(null); }}
              />
            </div>
          }
        >
          <div className="grid grid-cols-6 md:grid-cols-12 gap-1.5">
            {Array.from({ length: 12 }, (_, i) => {
              const entry = recentColors[i];
              const color = entry?.hex;
              return (
                <button
                  key={i}
                  className="rounded-md cursor-pointer h-8 w-full transition-shadow duration-200 ease-in-out"
                  style={{
                    background: entry ? swatchBackground(entry.hex, entry.alpha) : 'transparent',
                    boxShadow: i === selectedRecentIdx && color ? '0 0 0 2px white' : 'none',
                    border: i === selectedRecentIdx && color ? '2px solid transparent' : '1px solid var(--input)',
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
                      setSelectedRecentIdx(i);
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
        </CollapsibleSection>
      </div>

      {/* Saved Colors */}
      <div className={flushSections ? 'w-full section-flush' : 'w-full mt-2'}>
        <CollapsibleSection
          id="saved-colors"
          title="Saved"
          variant={sectionVariant}
          defaultOpen={!collapsedSections}
          headerRight={
            <div className="flex gap-1">
              {/* Sort sits with the other header actions rather than opposite
                  them. It is the only one that reads rather than destroys, so
                  it leads the group and the two confirming actions follow. */}
              <button
                className={`${ACTION_BTN_CLASS} tabular-nums ${iconActions ? SORT_BTN_W.narrow : SORT_BTN_W.wide}`}
                onClick={(e) => { e.stopPropagation(); cycleSavedSort(); }}
                aria-label={`Sort by ${SORT_LABELS[savedSortMode]} (click to cycle)`}
              >
                Sort: {SORT_LABELS[savedSortMode]}
              </button>
              <ActionButton
                label="Defaults"
                icon={RefreshCw}
                iconOnly={iconActions}
                confirm
                onClick={(e) => {
                  e.stopPropagation();
                  setSavedSlots(defaultSaved());
                  setSavedSortMode('user');
                  setSelectedSavedIdx(null);
                }}
              />
              <ActionButton
                label="Clear"
                icon={Trash2}
                iconOnly={iconActions}
                confirm
                onClick={(e) => { e.stopPropagation(); setSavedSlots(Array(SAVED_BANK).fill(null)); setSelectedSavedIdx(null); }}
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
          }
        >
          <div className="grid grid-cols-6 md:grid-cols-12 gap-1.5">
            {displaySlots.map(({ slot, userIdx }, displayIdx) => {
              const color = slot?.hex ?? null;
              const isSelected = userIdx === selectedSavedIdx && color;
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
                      setSelectedSavedIdx(userIdx);
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
                      setSelectedSavedIdx(displayIdx);
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
        </CollapsibleSection>
      </div></>}

      {poofs.map((p) => (
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
      ))}
    </div>
  );
}
