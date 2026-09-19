/**
 * The side column: the selected cell as the "current swatch", edited live by
 * the app's own hexagon and Color Editor pieces in their narrow, one-column
 * shape - the Figma plugin's layout (figma/ui/main.tsx), hosted the same way.
 *
 * The Color Editor itself is not a component: ColorPicker.tsx builds it inline
 * from PreviewSwatch, SBBox, HSlider, HexInput and ColorSlider. Those parts are
 * what is reused here, wired to the same useColorState the plugin uses, so no
 * app file changes.
 *
 * Three things ride on top of the colour state:
 *
 *   write-back   every user edit writes the cell (the bench forks the track
 *                into Custom first). Seeds - a new selection, a picker edit in
 *                the popover - are not edits and write nothing.
 *   hysteresis   between a press and its release, the note is sticky
 *                (stickyIndices): what the cell plays and the label hold the
 *                last note until the colour is well past the boundary. With
 *                snap on, release moves the colour to that note's centre.
 *   follow       while the transport plays, the bench pushes the sounding
 *                colour in through `follow` - display only, through the raw
 *                setter, never an edit, never a write. A press pauses it.
 */
import { useCallback, useEffect, useImperativeHandle, useRef, useState, type Ref } from 'react';
import { hexToRgb, rgbToHex, rgbToHsb, type HSB, type RGB } from '../utils/colorConversions';
import {
  blueChannelGradient, blueGradient, brightnessGradient, greenChannelGradient, greenGradient, hslHueGradient,
  hslSaturationGradient, hueGradient, lightnessGradient, redChannelGradient, redGradient, saturationGradient,
  type ColorSpace,
} from '../utils/sliderGradients';
import { setAudioEnabled, toneController } from '../utils/toneControllerLazy';
import { useColorState } from '../hooks/useColorState';
import ColorHexagon from '../components/ColorHexagon';
import ColorSlider from '../components/ColorSlider';
import SBBox from '../components/SBBox';
import HSlider from '../components/HSlider';
import HexInput from '../components/HexInput';
import PreviewSwatch from '../components/PreviewSwatch';
import BlendIcon from '../components/BlendIcon';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { noteIndices, snapToIndices, stickyIndices, type MapConfig, type Slot, type Step } from './sequencer';

export interface CellEditorHandle {
  /** Show `hex` without editing anything (following playback); null returns to the cell. */
  follow: (hex: string | null) => void;
}

export type FollowTarget = 0 | 1 | 'off';

const GROUPS = ['RGB', 'HSB', 'HSL', 'A'] as const;
type Group = (typeof GROUPS)[number];
const BLOCK = 'flex flex-col gap-2 [&:not(:first-child)]:mt-3 [&:not(:first-child)]:border-t [&:not(:first-child)]:border-input [&:not(:first-child)]:pt-3';
const CHECKER = 'repeating-conic-gradient(rgba(128,128,128,.45) 0% 25%, transparent 0% 50%) 0 0/10px 10px';
const DEFAULT_HSB: HSB = { h: 216, s: 69, b: 100 };

const hsbOfHex = (hex: string): HSB | null => {
  const rgb = hexToRgb(hex);
  return rgb ? rgbToHsb(rgb.r, rgb.g, rgb.b) : null;
};

interface Gesture { prev: number[] | null; snapped: string | null }

export default function SequencerCellEditor({
  ref, selectionKey, title, slot, step, cfg, snap, onSnapChange, onChange, onLive,
  follow, onFollow, followPaused, onGrab,
}: {
  ref?: Ref<CellEditorHandle>;
  /** Changes whenever a different cell is selected; null with nothing selected. */
  selectionKey: string | null;
  title: string;
  slot: Slot;
  /** What the cell plays right now - the sticky note while a drag is on. */
  step: Step | null;
  cfg: MapConfig;
  snap: boolean;
  onSnapChange: (v: boolean) => void;
  onChange: (slot: Slot) => void;
  /** The sticky colour the cell plays during a drag, null when the drag ends. */
  onLive: (hex: string | null) => void;
  follow: FollowTarget;
  onFollow: (f: FollowTarget) => void;
  followPaused: boolean;
  onGrab: () => void;
}) {
  // The hexagon's hold tone goes through the app's toneController, which is
  // off until the app's settings switch it on. This page mounts no settings,
  // so it is off already; said out loud here so it stays that way.
  useEffect(() => { setAudioEnabled(false); toneController.setMuted(true); }, []);

  const userEdit = useRef(false);
  const mark = useCallback(() => { userEdit.current = true; }, []);
  const {
    hsb, rgb, hsl, setHsb, clearOverride, setHsbClear, setRgb, setRgbChannel, setHslChannel, animateToHsb,
  } = useColorState({
    initial: (slot && hsbOfHex(slot.hex)) || DEFAULT_HSB,
    onTweenFrame: () => { userEdit.current = true; },
  });
  const hex = rgbToHex(rgb.r, rgb.g, rgb.b);
  const [blMode, setBlMode] = useState<'brightness' | 'lightness'>('brightness');
  const [colorSpace, setColorSpace] = useState<ColorSpace>('srgb');
  const [groups, setGroups] = useState<Group[]>(['RGB', 'HSB', 'A']);
  const [blend, setBlend] = useState(true);

  // Latest props for the handlers below, which must not close over a stale render.
  const latest = useRef({ slot, cfg, snap, selectionKey, onChange, onLive, onGrab });
  useEffect(() => { latest.current = { slot, cfg, snap, selectionKey, onChange, onLive, onGrab }; });

  /** The hex last written to (or seeded from) the cell - its echo is not a new seed. */
  const lastWritten = useRef<string | null>(null);
  const following = useRef(false);

  /** Show the cell's exact colour. Through the typed RGB writer, then un-flagged: a seed is not an edit. */
  const seed = useCallback((cellHex: string) => {
    const next = hexToRgb(cellHex);
    if (!next) return;
    setRgb(next);
    userEdit.current = false;
    lastWritten.current = cellHex;
  }, [setRgb]);

  // A new selection, or the cell changed from outside (popover, snap, undo of a fork): seed.
  const seededKey = useRef<string | null>(null);
  const cellHex = slot?.hex ?? null;
  useEffect(() => {
    const keyChanged = seededKey.current !== selectionKey;
    seededKey.current = selectionKey;
    if (following.current || !cellHex) return;
    if (!keyChanged && cellHex === lastWritten.current) return;
    seed(cellHex);
  }, [selectionKey, cellHex, seed]);

  useImperativeHandle(ref, () => ({
    follow: (next) => {
      if (next === null) {
        if (!following.current) return;
        following.current = false;
        const s = latest.current.slot;
        if (s) seed(s.hex);
        return;
      }
      following.current = true;
      const c = hexToRgb(next);
      if (!c) return;
      // Display only: the raw setter with the override cleared, the way the
      // plugin seeds from a selection. No onEdit, no write-back.
      clearOverride();
      setHsb(rgbToHsb(c.r, c.g, c.b));
      userEdit.current = false;
    },
  }), [seed, clearOverride, setHsb]);

  // --- the press: pauses following, starts the sticky note --------------------
  const gesture = useRef<Gesture | null>(null);
  const [endTick, setEndTick] = useState(0);
  const onPressStart = useCallback(() => {
    const { slot: s, cfg: c } = latest.current;
    if (following.current) {
      following.current = false;
      latest.current.onGrab();
      if (s) seed(s.hex);
    }
    gesture.current = { prev: s ? noteIndices(s.hex, c) : null, snapped: null };
  }, [seed]);
  useEffect(() => {
    const up = () => { if (gesture.current) setEndTick((t) => t + 1); };
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
    return () => { window.removeEventListener('pointerup', up); window.removeEventListener('pointercancel', up); };
  }, []);
  // Runs a render after the release, so the last move's write has landed first.
  useEffect(() => {
    if (endTick === 0) return;
    const g = gesture.current;
    gesture.current = null;
    const { slot: s, snap: doSnap, selectionKey: key, onChange: write, onLive: live } = latest.current;
    live(null);
    if (!g?.snapped || !doSnap || !key) return;
    write({ hex: g.snapped, alpha: s?.alpha ?? 100 });
    seed(g.snapped);
  }, [endTick, seed]);

  // --- write-back ------------------------------------------------------------
  useEffect(() => {
    if (!userEdit.current) return;
    userEdit.current = false;
    const { slot: s, cfg: c, selectionKey: key, onChange: write, onLive: live } = latest.current;
    if (!key) return;
    const g = gesture.current;
    if (g) {
      const sticky = stickyIndices(hex, c, g.prev);
      g.prev = sticky;
      g.snapped = snapToIndices(hex, c, sticky);
      live(g.snapped);
    }
    lastWritten.current = hex;
    write({ hex, alpha: s?.alpha ?? 100 });
  }, [hex]);

  const writeAlpha = useCallback((a: number) => {
    const { slot: s, selectionKey: key, onChange: write } = latest.current;
    if (!key) return;
    write({ hex: s?.hex ?? hex, alpha: a });
  }, [hex]);

  // --- handlers: every one is a user edit -------------------------------------
  const onHueChange = useCallback((h: number) => { mark(); setHsbClear((p) => ({ ...p, h })); }, [mark, setHsbClear]);
  const onHsbChange = useCallback((n: Partial<HSB>) => { mark(); setHsbClear((p) => ({ ...p, ...n })); }, [mark, setHsbClear]);
  const onRgbChange = useCallback((ch: 'r' | 'g' | 'b', v: number) => { mark(); setRgbChannel(ch, v); }, [mark, setRgbChannel]);
  const onHslChange = useCallback((ch: 'h' | 's' | 'l', v: number) => { mark(); setHslChannel(ch, v); }, [mark, setHslChannel]);
  const onAnimate = useCallback((t: HSB) => { mark(); animateToHsb(t); }, [mark, animateToHsb]);
  const onSb = useCallback((s: number, b: number) => { mark(); setHsbClear((p) => ({ ...p, s, b })); }, [mark, setHsbClear]);
  const onHex = useCallback((c: RGB) => { mark(); setRgb(c); }, [mark, setRgb]);

  const alpha = slot?.alpha ?? 100;
  const plays = !step ? '' : step.rest ? (step.tie ? 'tie' : 'rest') : step.detail;

  return (
    <div className="flex flex-col gap-3" data-cell-editor="">
      <div className="flex flex-col gap-1">
        <h2 className="text-xl font-semibold">Current swatch</h2>
        <div className="flex items-baseline justify-between gap-3 text-base">
          <span className="text-muted-foreground" data-selection="">{title}</span>
          <span className="tabular-nums" data-live-note="">{selectionKey ? plays : ''}</span>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-base" data-control="follow">
        <span className="text-muted-foreground">Follow</span>
        {([[0, 'Track A'], [1, 'Track B'], ['off', 'Off']] as [FollowTarget, string][]).map(([v, label]) => (
          <Button key={String(v)} size="sm" variant={follow === v ? 'default' : 'outline'} className="text-base"
            aria-pressed={follow === v} onClick={() => onFollow(v)}>
            {label}
          </Button>
        ))}
        {followPaused && follow !== 'off' && <span className="text-muted-foreground">paused</span>}
      </div>

      <div
        className="panel-frame @container/editor flex flex-col gap-3 rounded-lg border border-border p-2.5"
        onPointerDownCapture={onPressStart}
        data-editor-surface=""
      >
        <ColorHexagon
          rgb={rgb}
          hue={hsb.h}
          brightness={hsb.b}
          saturation={hsb.s}
          hsl={hsl}
          onHueChange={onHueChange}
          onRgbChange={onRgbChange}
          onHsbChange={onHsbChange}
          onHslChange={onHslChange}
          onAnimateToHsb={onAnimate}
          blMode={blMode}
          onBlModeChange={setBlMode}
          colorSpace={colorSpace}
          onColorSpaceChange={setColorSpace}
          bare
          blBar={false}
          satBar={false}
          stemRange={[2, 4]}
        />

        <div className="flex min-w-0 gap-3" style={{ height: 132 }}>
          <PreviewSwatch hex={hex} />
          <div className="flex min-w-0 flex-1 gap-3">
            <SBBox hue={hsb.h} saturation={hsb.s} brightness={hsb.b} onChange={onSb} blMode={blMode} />
            <HSlider hue={hsb.h} onChange={onHueChange} />
          </div>
        </div>

        <div className="grid grid-cols-[auto_auto_1fr] items-center gap-2">
          <ToggleGroup multiple value={groups} aria-label="Slider groups"
            onValueChange={(v) => setGroups(GROUPS.filter((g) => (v as Group[]).includes(g)))}>
            {GROUPS.map((g) => <ToggleGroupItem key={g} value={g} className="w-10 text-base">{g}</ToggleGroupItem>)}
          </ToggleGroup>
          <ToggleGroup multiple value={blend ? ['blend'] : []} onValueChange={(v) => setBlend(v.length > 0)}>
            <ToggleGroupItem value="blend" className="px-2" aria-label={blend ? 'Show source colors' : 'Show mixed colors'}>
              <BlendIcon filled={blend} />
            </ToggleGroupItem>
          </ToggleGroup>
          {/* HexInput sets text-sm on itself; the lab's rule is text-base. */}
          <div className="justify-self-end [&_input]:w-[5.75rem] [&_input]:text-base">
            <HexInput hex={hex} onChange={onHex} />
          </div>
        </div>

        <div className="flex flex-col">
          {groups.includes('RGB') && (
            <div className={BLOCK} role="group" aria-label="RGB">
              <ColorSlider label="R" group="rgb" value={rgb.r} max={255} onChange={(v) => onRgbChange('r', v)}
                gradient={blend ? redGradient(rgb.g, rgb.b) : redChannelGradient} />
              <ColorSlider label="G" group="rgb" value={rgb.g} max={255} onChange={(v) => onRgbChange('g', v)}
                gradient={blend ? greenGradient(rgb.r, rgb.b) : greenChannelGradient} />
              <ColorSlider label="B" group="rgb" value={rgb.b} max={255} onChange={(v) => onRgbChange('b', v)}
                gradient={blend ? blueGradient(rgb.r, rgb.g) : blueChannelGradient} />
            </div>
          )}
          {groups.includes('HSB') && (
            <div className={BLOCK} role="group" aria-label="HSB">
              <ColorSlider label="H" group="hsb" value={hsb.h} max={360} wrap onChange={onHueChange}
                gradient={hueGradient(blend ? hsb.s : 100, blend ? hsb.b : 100, colorSpace)} />
              <ColorSlider label="S" group="hsb" value={hsb.s} max={100} onChange={(v) => onHsbChange({ s: v })}
                gradient={saturationGradient(hsb.h, blend ? hsb.b : 100, colorSpace)} />
              <ColorSlider label="B" group="hsb" value={hsb.b} max={100} onChange={(v) => onHsbChange({ b: v })}
                gradient={brightnessGradient(hsb.h, blend ? hsb.s : 0, colorSpace)} />
            </div>
          )}
          {groups.includes('HSL') && (
            <div className={BLOCK} role="group" aria-label="HSL">
              <ColorSlider label="H" group="hsl" value={hsl.h} max={360} wrap onChange={(v) => onHslChange('h', v)}
                gradient={hslHueGradient(blend ? hsl.s : 100, blend ? hsl.l : 50, colorSpace)} />
              <ColorSlider label="S" group="hsl" value={hsl.s} max={100} onChange={(v) => onHslChange('s', v)}
                gradient={hslSaturationGradient(hsl.h, blend ? hsl.l : 50, colorSpace)} />
              <ColorSlider label="L" group="hsl" value={hsl.l} max={100} onChange={(v) => onHslChange('l', v)}
                gradient={lightnessGradient(hsl.h, blend ? hsl.s : 0, colorSpace)} />
            </div>
          )}
          {groups.includes('A') && (
            <div className={BLOCK} role="group" aria-label="Alpha">
              <ColorSlider label="A" group="alpha" value={alpha} max={100} suffix="%" onChange={writeAlpha}
                gradient={`linear-gradient(to right, transparent, ${hex}),${CHECKER}`} />
            </div>
          )}
        </div>
      </div>

      <label className="flex items-center gap-2 text-base">
        <Checkbox checked={snap} onCheckedChange={(v) => onSnapChange(v === true)} aria-label="Snap to note centre on release" />
        Snap to the note&apos;s centre on release
      </label>
      {!selectionKey && <p className="text-base text-muted-foreground">Select a step to edit it here.</p>}
    </div>
  );
}
