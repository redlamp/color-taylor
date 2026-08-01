import { useRef, useEffect, useCallback, useLayoutEffect, useState, useMemo, type ComponentType, type CSSProperties, type ReactNode, type MouseEvent as ReactMouseEvent, type PointerEvent as ReactPointerEvent } from 'react';
import { hsbToRgb, rgbToHsb, rgbToHex, rgbToHsl, hslToRgb, type RGB, type HSB, type HSL } from '../utils/colorConversions';
import type { ColorSpace } from '../utils/sliderGradients';
import type { Channel, ChannelOrder } from './hex/hexConstants';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { ChevronRight, RefreshCw, Trash2 } from 'lucide-react';
import CollapsibleSection from './CollapsibleSection';
import NAMED_COLORS from '../utils/namedColors';
import { getAudioCtx, getMasterGain } from '../utils/audioContext';
import { toneController } from '../utils/toneControllerLazy';
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

const DEFAULT_RECENT = ['#ff0000', '#ffff00', '#00ff00', '#00ffff', '#0000ff', '#ff00ff', '#ffffff', '#808080', '#000000'];

const ACTION_BTN_CLASS =
  'px-2 py-0.5 text-xs rounded-md bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80 cursor-pointer select-none inline-flex items-center';

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
}: {
  label: string;
  icon: ComponentType<{ className?: string }>;
  iconOnly?: boolean;
  onClick: (e: ReactMouseEvent) => void;
}) {
  return (
    <button className={ACTION_BTN_CLASS} title={label} aria-label={label} onClick={onClick}>
      {iconOnly ? <Icon className="!size-3.5" /> : label}
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
}

interface HoveredMarker {
  x: number;
  y: number;
  hex: string;
  name: string;
}

export default function ColorHexagon({ rgb, hue, brightness, saturation, hsl, onHueChange, onRgbChange, onHsbChange, onHslChange, onAnimateToHsb, blMode, onBlModeChange, colorSpace, hoverMatchRgb, showHtmlOnHex, animHolding, onHoverHtmlColor, muted, iconActions, bare, headerLeft }: ColorHexagonProps) {
  const [hexOpen, setHexOpen] = useState(true);
  const [vectorMode] = useState<ChannelOrder>('rgb');
  const [initialHex] = useState(() => rgbToHex(rgb.r, rgb.g, rgb.b));
  const [recentColors, setRecentColors] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('color-taylor-recent');
      if (saved) return JSON.parse(saved);
    } catch { /* localStorage unavailable */ }
    return [];
  });
  const [selectedRecentIdx, setSelectedRecentIdx] = useState<number | null>(null);
  type SavedSlot = { hex: string; addedAt: number } | null;
  type SortMode = 'user' | 'hue' | 'saturation' | 'brightness';
  const [savedSlots, setSavedSlots] = useState<SavedSlot[]>(() => {
    try {
      const raw = localStorage.getItem('color-taylor-saved');
      if (raw) {
        const parsed = JSON.parse(raw);
        const seen = new Set<number>();
        return parsed.map((v: unknown, i: number) => {
          if (!v) return null;
          const slot = typeof v === 'string' ? { hex: v, addedAt: -(i + 1) } : (v as { hex: string; addedAt: number });
          if (seen.has(slot.addedAt)) slot.addedAt = -(i + 1) * 1000;
          seen.add(slot.addedAt);
          return slot;
        });
      }
    } catch { /* localStorage unavailable */ }
    const defaults: SavedSlot[] = DEFAULT_RECENT.map((hex, i) => ({ hex, addedAt: -(i + 1) }));
    while (defaults.length < 12) defaults.push(null);
    return defaults;
  });
  const [selectedSavedIdx, setSelectedSavedIdx] = useState<number | null>(null);
  const [savedSortMode, setSavedSortMode] = useState<SortMode>('user');
  const [draggedUserIdx, setDraggedUserIdx] = useState<number | null>(null);
  const [dragHover, setDragHover] = useState<{ displayIdx: number; zone: 'left' | 'center' | 'right' } | null>(null);
  const [touchArmedUserIdx, setTouchArmedUserIdx] = useState<number | null>(null);
  const touchDrag = useRef<{ startX: number; startY: number; userIdx: number; armed: boolean } | null>(null);
  const touchDragTimer = useRef<number | null>(null);
  const suppressNextClick = useRef(false);
  const desktopDroppedRef = useRef(false);

  type Poof = { id: string; x: number; y: number; w: number; h: number; color: string };
  const [poofs, setPoofs] = useState<Poof[]>([]);
  const mutedRef = useRef<boolean>(!!muted);
  useEffect(() => { mutedRef.current = !!muted; }, [muted]);
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

  const rand = useCallback((center: number, spread: number) => center + (Math.random() * 2 - 1) * spread, []);

  const ensureAudioCtx = useCallback(() => getAudioCtx(), []);

  const playFlit = useCallback(() => {
    if (mutedRef.current) return;
    try {
      const ctx = ensureAudioCtx();
      const t = ctx.currentTime;
      const duration = rand(0.36, 0.04);
      const startFreq = rand(450, 60);
      const peakFreq = rand(1700, 180);
      const endFreq = rand(900, 100);
      const Q = rand(1.2, 0.25);
      const peakGain = rand(0.22, 0.03);

      const buf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * duration), ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;

      const src = ctx.createBufferSource();
      src.buffer = buf;

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.Q.value = Q;
      filter.frequency.setValueAtTime(startFreq, t);
      filter.frequency.exponentialRampToValueAtTime(peakFreq, t + duration * 0.7);
      filter.frequency.exponentialRampToValueAtTime(endFreq, t + duration);

      const tilt = ctx.createBiquadFilter();
      tilt.type = 'highshelf';
      tilt.frequency.value = 3000;
      tilt.gain.value = -6;

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(peakGain, t + 0.09);
      gain.gain.linearRampToValueAtTime(peakGain * 0.82, t + 0.24);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);

      src.connect(filter).connect(tilt).connect(gain).connect(getMasterGain());
      src.start(t);
      src.stop(t + duration + 0.02);
    } catch { /* localStorage unavailable */ }
  }, [ensureAudioCtx, rand]);

  const playClick = useCallback(() => {
    if (mutedRef.current) return;
    try {
      const ctx = ensureAudioCtx();
      const t = ctx.currentTime;

      const duration = rand(0.04, 0.008);
      const filterFreq = rand(2000, 260);
      const filterQ = rand(0.8, 0.18);
      const peakGain = rand(0.18, 0.04);

      const buffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * duration), ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < data.length; i++) {
        data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
      }

      const src = ctx.createBufferSource();
      src.buffer = buffer;

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = filterFreq;
      filter.Q.value = filterQ;

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.001, t);
      gain.gain.exponentialRampToValueAtTime(peakGain, t + 0.002);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);

      src.connect(filter).connect(gain).connect(getMasterGain());
      src.start(t);
      src.stop(t + duration + 0.01);
    } catch { /* localStorage unavailable */ }
  }, [ensureAudioCtx, rand]);

  const playSave = useCallback(() => {
    if (mutedRef.current) return;
    try {
      const ctx = ensureAudioCtx();
      const t = ctx.currentTime;

      const duration = rand(0.11, 0.015);
      const noiseFreq = rand(750, 90);
      const noiseQ = rand(1.1, 0.18);
      const noisePeak = rand(0.18, 0.03);
      const thumpStart = rand(140, 18);
      const thumpEnd = rand(55, 8);
      const thumpDur = rand(0.085, 0.012);
      const thumpPeak = rand(0.18, 0.03);

      const noiseBuf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * duration), ctx.sampleRate);
      const data = noiseBuf.getChannelData(0);
      for (let i = 0; i < data.length; i++) {
        data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
      }
      const noise = ctx.createBufferSource();
      noise.buffer = noiseBuf;

      const bandpass = ctx.createBiquadFilter();
      bandpass.type = 'bandpass';
      bandpass.frequency.value = noiseFreq;
      bandpass.Q.value = noiseQ;

      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.0001, t);
      noiseGain.gain.exponentialRampToValueAtTime(noisePeak, t + 0.003);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, t + duration);

      noise.connect(bandpass).connect(noiseGain).connect(getMasterGain());
      noise.start(t);
      noise.stop(t + duration + 0.02);

      const thump = ctx.createOscillator();
      const thumpGain = ctx.createGain();
      thump.type = 'sine';
      thump.frequency.setValueAtTime(thumpStart, t);
      thump.frequency.exponentialRampToValueAtTime(thumpEnd, t + thumpDur);
      thumpGain.gain.setValueAtTime(0.0001, t);
      thumpGain.gain.exponentialRampToValueAtTime(thumpPeak, t + 0.005);
      thumpGain.gain.exponentialRampToValueAtTime(0.0001, t + thumpDur + 0.01);
      thump.connect(thumpGain).connect(getMasterGain());
      thump.start(t);
      thump.stop(t + thumpDur + 0.02);
    } catch { /* localStorage unavailable */ }
  }, [ensureAudioCtx, rand]);

  const playPop = useCallback(() => {
    if (mutedRef.current) return;
    try {
      const ctx = ensureAudioCtx();

      // Crumple: filtered noise burst with random crinkle envelope.
      const duration = rand(0.32, 0.04);
      const bandpassFreq = rand(2800, 250);
      const bandpassQ = rand(1.4, 0.25);
      const shelfFreq = rand(4000, 300);
      const shelfGain = rand(4, 1);

      const buffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * duration), ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;

      const src = ctx.createBufferSource();
      src.buffer = buffer;

      const bandpass = ctx.createBiquadFilter();
      bandpass.type = 'bandpass';
      bandpass.frequency.value = bandpassFreq;
      bandpass.Q.value = bandpassQ;

      const highshelf = ctx.createBiquadFilter();
      highshelf.type = 'highshelf';
      highshelf.frequency.value = shelfFreq;
      highshelf.gain.value = shelfGain;

      const gain = ctx.createGain();
      const t = ctx.currentTime;
      gain.gain.setValueAtTime(0.0001, t);

      // Random crinkle envelope: 6–10 short spikes within the duration.
      const spikes = 7 + Math.floor(Math.random() * 4);
      const step = duration / spikes;
      let cur = t;
      for (let i = 0; i < spikes; i++) {
        const slot = step * (0.4 + Math.random() * 0.6);
        const rise = 0.004 + Math.random() * 0.01;
        const fall = slot - rise;
        const peak = 0.06 + Math.random() * 0.18;
        cur += rise;
        gain.gain.exponentialRampToValueAtTime(peak, cur);
        cur += Math.max(0.005, fall);
        gain.gain.exponentialRampToValueAtTime(0.003, cur);
      }
      gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);

      src.connect(bandpass).connect(highshelf).connect(gain).connect(getMasterGain());
      src.start(t);
      src.stop(t + duration + 0.05);
    } catch { /* localStorage unavailable */ }
  }, [ensureAudioCtx, rand]);

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

  const lastHex = useRef(initialHex);
  const skipNextRecent = useRef(false);

  // Persist recent + saved colors. Guarded like every read above: storage can
  // throw, not merely return null. A null-origin iframe — which is what the
  // Figma plugin host gives us — raises SecurityError on access, and an
  // uncaught throw inside an effect unmounts the entire tree.
  useEffect(() => {
    try {
      localStorage.setItem('color-taylor-recent', JSON.stringify(recentColors));
    } catch { /* localStorage unavailable */ }
  }, [recentColors]);
  useEffect(() => {
    try {
      localStorage.setItem('color-taylor-saved', JSON.stringify(savedSlots));
    } catch { /* localStorage unavailable */ }
  }, [savedSlots]);

  // Listen for global "reset all" — restore recent + saved to defaults.
  useEffect(() => {
    const onReset = () => {
      setRecentColors([]);
      const defaults: SavedSlot[] = DEFAULT_RECENT.map((hex, i) => ({ hex, addedAt: -(i + 1) }));
      while (defaults.length < 12) defaults.push(null);
      setSavedSlots(defaults);
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
    const filled = indexed.filter((x): x is { slot: { hex: string; addedAt: number }; userIdx: number } => x.slot !== null);
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
    setSavedSlots(flattened);
    setSavedSortMode('user');
    setSelectedSavedIdx(null);
  }, [savedSlots, displaySlots, triggerPoof, playPop]);

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
    setSavedSlots(flattened);
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

    setSavedSlots(flattened);
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
    const order: SortMode[] = ['user', 'hue', 'saturation', 'brightness'];
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

  const SORT_LABELS: Record<SortMode, string> = { user: 'User', hue: 'Hue', saturation: 'Sat', brightness: 'Bright' };
  const draggingBL = useRef(false);
  const svgRef = useRef(null);
  const draggingHue = useRef(false);
  const draggingDot = useRef<{ index: number; channel: Channel; relative: boolean; startValue: number; startProjection: number; lockedRgb: RGB; lockedOrder: Channel[] } | null>(null);
  const draggingFree = useRef(false);
  const hexPointerDown = useRef(null);
  const startingBrightness = useRef(null); // brightness at drag start for rubber-band
  const blPointerDown = useRef(null);
  const [hoveredDot, setHoveredDot] = useState(null); // index of hovered dot
  const [isHexDragging, setIsHexDragging] = useState(false);
  const [hoveredMarker, setHoveredMarker] = useState<HoveredMarker | null>(null);

  const dragTriggerDistance = 4;
  const clickMaxDuration = 200;

  const getSvgCoords = useCallback((e: { clientX: number; clientY: number }) => {
    const rect = svgRef.current!.getBoundingClientRect();
    const sx = SIZE / rect.width;
    const sy = HEX_SIZE / rect.height;
    return { x: (e.clientX - rect.left) * sx, y: (e.clientY - rect.top) * sy };
  }, []);

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

  const dotColors = useMemo(() => points.map((p) => {
    const c = colorAtPoint(p.x, p.y, brightness);
    return rgbToHex(c.r, c.g, c.b);
  }), [points, brightness]);

  const { hueEnd, hueLabel } = useMemo(() => {
    const rad = (hue * PI) / 180;
    return {
      hueEnd: {
        x: CENTER_X + RADIUS * Math.cos(rad),
        y: CENTER_Y - RADIUS * Math.sin(rad),
      },
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
      const matchIdx = recentColors.indexOf(currentHex);
      setSelectedRecentIdx(matchIdx !== -1 ? matchIdx : null);
    }
  }, [animHolding, currentHex, recentColors]);

  // Reset debounce on currentHex change only; reads latest recentColors via ref
  // to avoid restarting the timer when the recent list updates.
  useEffect(() => {
    if (!animHoldingRef.current) setSelectedRecentIdx(null);

    if (addRecentTimer.current) clearTimeout(addRecentTimer.current);
    addRecentTimer.current = setTimeout(() => {
      if (skipNextRecent.current) {
        skipNextRecent.current = false;
        lastHex.current = currentHex;
        return;
      }
      const matchIdx = recentColorsRef.current.indexOf(currentHex);
      if (matchIdx !== -1) {
        setSelectedRecentIdx(matchIdx);
        lastHex.current = currentHex;
        return;
      }
      if (currentHex !== lastHex.current) {
        lastHex.current = currentHex;
        setRecentColors((prev) => {
          if (prev.includes(currentHex)) return prev;
          return [currentHex, ...prev].slice(0, 12);
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
  }, [currentHex]);

  const addToRecent = useCallback((hex: string) => {
    skipNextRecent.current = true;
    lastHex.current = hex;
    setRecentColors((prev) => {
      const filtered = prev.filter((c) => c !== hex);
      return [hex, ...filtered].slice(0, 12);
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

  // Non-passive wheel listener to prevent page scroll
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
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
  }, [blMode, brightness, hsl?.l, hue, saturation, onHsbChange, onHslChange]);

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
    return {
      limitScale,
      limitRadius,
      perimX: CENTER_X - (dx / dist) * edgeDist,
      perimY: CENTER_Y - (dy / dist) * edgeDist,
      arrowTipX,
      arrowY,
    };
  }, [blMode, brightness, hsl?.l]);

  return (
    <div
      id="color-hexagon"
      className={`flex flex-col items-center gap-1 max-w-full${bare ? ' w-full' : ' border border-input rounded-lg p-3'}`}
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
                      <span><TabsTrigger value="brightness" className="w-14">Bright</TabsTrigger></span>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" sideOffset={8} className="text-xs font-semibold">HSB brightness</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span><TabsTrigger value="lightness" className="w-14">Light</TabsTrigger></span>
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
      <div id="hex-stage" className="w-full relative m-4" style={{ maxWidth: SIZE, aspectRatio: `${SIZE} / ${DISPLAY_HEIGHT}` }}>
      <div className="absolute left-0 top-1/2 w-full -translate-y-1/2" style={{ aspectRatio: `${SIZE} / ${HEX_SIZE}` }}>
        <HexCanvas brightness={brightness} colorSpace={colorSpace} />
        <svg
          id="hex-svg"
          ref={svgRef}
          viewBox={`0 0 ${SIZE} ${HEX_SIZE}`}
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
              fill="none" stroke="rgba(128,128,128,0.5)" strokeWidth={2} strokeDasharray="1 4" strokeLinecap="round"
            />
          )}
          <line
            x1={limitHex.arrowTipX} y1={limitHex.arrowY} x2={limitHex.perimX} y2={limitHex.perimY}
            stroke="rgba(128,128,128,0.5)" strokeWidth={2} strokeDasharray="1 4" strokeLinecap="round"
          />

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
            <line id="hue-line" x1={CENTER_X} y1={CENTER_Y} x2={hueEnd.x} y2={hueEnd.y}
              stroke="rgba(255,255,255,0.5)" strokeWidth={1.5} strokeDasharray="4 4"
            />
          )}

          {/* Vector line segments */}
          {points.slice(1).map((p, i) => {
            const prev = points[i];
            const ch = order[i];
            const chValue = rgb[ch];
            // Hide zero-value segments during hex surface drag
            if (isHexDragging && chValue === 0 && ch !== 'r') return null;
            const bright = brightness > 50;
            const baseColor = bright
              ? (ch === 'r' ? 'rgba(220,50,50,0.8)' : ch === 'g' ? 'rgba(50,180,50,0.8)' : 'rgba(50,50,220,0.8)')
              : (ch === 'r' ? 'rgba(255,120,120,0.8)' : ch === 'g' ? 'rgba(120,230,120,0.8)' : 'rgba(120,120,255,0.8)');
            const hoverColor = bright
              ? (ch === 'r' ? 'rgba(240,90,90,1)' : ch === 'g' ? 'rgba(90,200,90,1)' : 'rgba(90,90,240,1)')
              : (ch === 'r' ? 'rgba(255,160,160,1)' : ch === 'g' ? 'rgba(160,255,160,1)' : 'rgba(160,160,255,1)');
            const isHighlighted = hoveredDot === i + 1;
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
                  onPointerEnter={() => setHoveredDot(dotIndex)}
                  onPointerLeave={() => {
                    if (!draggingDot.current && !draggingFree.current) setHoveredDot(null);
                  }}
                  onPointerDown={(e) => handleDotMouseDown(e, dotIndex, true)}
                />
                {/* Visible segment */}
                <line
                  x1={prev.x} y1={prev.y} x2={p.x} y2={p.y}
                  stroke={isHighlighted ? hoverColor : baseColor}
                  strokeWidth={isHighlighted ? 3 : 2}
                  strokeLinecap="round"
                  className="pointer-events-none"
                />
              </g>
            );
          })}

          {/* Dots */}
          {points.map((p, i) => {
            const isLast = i === points.length - 1;
            const isDraggable = i > 0;
            const ch = i > 0 ? order[i - 1] : null;
            // Hide zero-value dots during hex surface drag (except origin and red)
            if (isHexDragging && ch && ch !== 'r' && rgb[ch] === 0) return null;
            const bright = brightness > 50;
            const baseRing = !ch ? 'white' : bright
              ? (ch === 'r' ? 'rgba(220,50,50,0.9)' : ch === 'g' ? 'rgba(50,180,50,0.9)' : 'rgba(50,50,220,0.9)')
              : (ch === 'r' ? 'rgba(255,120,120,0.9)' : ch === 'g' ? 'rgba(120,230,120,0.9)' : 'rgba(120,120,255,0.9)');
            const hoverRing = !ch ? 'white' : bright
              ? (ch === 'r' ? 'rgba(240,90,90,1)' : ch === 'g' ? 'rgba(90,200,90,1)' : 'rgba(90,90,240,1)')
              : (ch === 'r' ? 'rgba(255,160,160,1)' : ch === 'g' ? 'rgba(160,255,160,1)' : 'rgba(160,160,255,1)');
            const isHighlighted = isDraggable && hoveredDot === i;
            const ringColor = isDraggable
              ? (isHighlighted ? hoverRing : baseRing)
              : 'white';
            const isOrigin = i === 0;
            return (
              <circle
                key={i} id={`rgb-dot-${dotNames[i]}`} cx={p.x} cy={p.y}
                r={isOrigin ? 3 : isLast ? 8 : 5}
                fill={isOrigin ? '#ff0000' : dotColors[i]}
                stroke={isOrigin ? 'none' : ringColor}
                strokeWidth={isOrigin ? 0 : isHighlighted ? 3 : 2}
                className={isDraggable ? 'cursor-pointer touch-none' : ''}
                style={isLast ? { filter: 'drop-shadow(0 0 1px rgba(0,0,0,0.3))' } : undefined}
                onPointerDown={isDraggable ? (e) => handleDotMouseDown(e, i) : undefined}
                onPointerEnter={isDraggable ? () => setHoveredDot(i) : undefined}
                onPointerLeave={isDraggable ? () => {
                  if (!draggingDot.current && !draggingFree.current) setHoveredDot(null);
                } : undefined}
              />
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

          <BrightnessBar
            hue={hue} saturation={saturation} brightness={brightness} hsl={hsl}
            blMode={blMode} blPointerDownRef={blPointerDown} draggingBLRef={draggingBL}
            animateBLToValue={animateBLToValue} colorSpace={colorSpace}
          />
        </svg>

        <ColorLabels onColorClick={handleColorLabelClick} />

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
        {showHueLine && <HueHandle hue={hue} hueLabel={hueLabel} onMouseDown={handleHueDragStart} />}
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
      </div>
      </div>

      {/* Recent Colors + Named Color Match */}
      <div className="w-full mt-2">
        <CollapsibleSection
          id="recent-colors"
          title="Recent"
          defaultOpen={true}
          headerRight={
            <div className="flex gap-1">
              <ActionButton
                label="Clear"
                icon={Trash2}
                iconOnly={iconActions}
                onClick={(e) => { e.stopPropagation(); setRecentColors([]); setSelectedRecentIdx(null); }}
              />
            </div>
          }
        >
          <div className="grid grid-cols-6 md:grid-cols-12 gap-1.5">
            {Array.from({ length: 12 }, (_, i) => {
              const color = recentColors[i];
              return (
                <button
                  key={i}
                  className="rounded-md cursor-pointer h-8 w-full transition-shadow duration-200 ease-in-out"
                  style={{
                    backgroundColor: color || 'transparent',
                    boxShadow: i === selectedRecentIdx && color ? '0 0 0 2px white' : 'none',
                    border: i === selectedRecentIdx && color ? '2px solid transparent' : '1px solid var(--input)',
                  }}
                  disabled={!color}
                  aria-label={color ? `Select ${color}` : 'Empty slot'}
                  onClick={() => {
                    if (color && onAnimateToHsb) {
                      skipNextRecent.current = true;
                      setSelectedRecentIdx(i);
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
      <div className="w-full mt-2">
        <CollapsibleSection
          id="saved-colors"
          title="Saved"
          headerLeft={
            <button
              className="px-2 py-0.5 text-xs rounded-md bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80 cursor-pointer select-none tabular-nums"
              onClick={(e) => { e.stopPropagation(); cycleSavedSort(); }}
              aria-label={`Sort by ${SORT_LABELS[savedSortMode]} (click to cycle)`}
            >
              Sort: {SORT_LABELS[savedSortMode]}
            </button>
          }
          headerRight={
            <div className="flex gap-1">
              <ActionButton
                label="Defaults"
                icon={RefreshCw}
                iconOnly={iconActions}
                onClick={(e) => {
                  e.stopPropagation();
                  const defaults: SavedSlot[] = DEFAULT_RECENT.map((hex, i) => ({ hex, addedAt: -(i + 1) }));
                  while (defaults.length < 12) defaults.push(null);
                  setSavedSlots(defaults);
                  setSavedSortMode('user');
                  setSelectedSavedIdx(null);
                }}
              />
              <ActionButton
                label="Clear"
                icon={Trash2}
                iconOnly={iconActions}
                onClick={(e) => { e.stopPropagation(); setSavedSlots(Array(12).fill(null)); setSelectedSavedIdx(null); }}
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
                    backgroundColor: color || 'transparent',
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
                    if (draggedUserIdx === null) return;
                    e.preventDefault();
                    e.dataTransfer.dropEffect = 'move';
                    const hover = computeDragHover(e.clientX, e.clientY);
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
                    desktopDroppedRef.current = true;
                    const hover = computeDragHover(e.clientX, e.clientY);
                    setDraggedUserIdx(null);
                    setDragHover(null);
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
                      flattened[displayIdx] = { hex: currentHex, addedAt: Date.now() };
                      setSavedSlots(flattened);
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
