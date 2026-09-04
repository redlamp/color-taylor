import { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { hsbToRgb, rgbToHsb, rgbToHex, getContrastTextColor, type HSB, type RGB } from '../utils/colorConversions';
import type { Slide } from './slides';
import {
  hueGradient, saturationGradient, brightnessGradient,
  redChannelGradient, greenChannelGradient, blueChannelGradient,
} from '../utils/sliderGradients';
import { PANEL_W, PANEL_H } from './panelConstants';
import AnimatedGrid from './slides/AnimatedGrid';
import ColorSlider from '../components/ColorSlider';
import EquationsPanel from '../components/EquationsPanel';
import ColorHexagon from '../components/ColorHexagon';
import { RADIUS as HEX_RADIUS, CENTER_X as HEX_CENTER_X, DISPLAY_HEIGHT as HEX_STAGE_H } from '../components/hex/hexConstants';
import DiscBrightnessBar, { BAR_CHROME } from './DiscBrightnessBar';
import { useColorState } from '../hooks/useColorState';
import { HSB_TWEEN_MS, easeInOutQuad } from '../utils/colorTween';
import ColorPicker from '../components/ColorPicker';

/** The panel shapes a slide can ask for. Named so the exit-mode ref can hold
 *  one without restating the union. */
type PanelMode =
  | 'intro' | 'acronyms' | 'bw' | 'c16' | 'c256'
  | 'thousands' | 'millions' | 'hsl-gradient' | 'swatch';

const FULL_KEYFRAMES = [
  { r: 0,   g: 0,   b: 0   },
  { r: 255, g: 0,   b: 0   },
  { r: 255, g: 255, b: 0   },
  { r: 0,   g: 255, b: 0   },
  { r: 0,   g: 255, b: 255 },
  { r: 0,   g: 0,   b: 255 },
  { r: 255, g: 0,   b: 255 },
  { r: 255, g: 255, b: 255 },
];
/** Wheel to hexagon. Slower than the slide change, so the shape is still
 *  moving once the reader's eye has arrived. */
const SHAPE_MORPH_MS = 700;

const RED_KEYFRAMES = [
  { r: 0,   g: 0,   b: 0   },
  { r: 255, g: 0,   b: 0   },
];

export default function PresentationStage({ slide, slideIndex, animPaused = false }: { slide: Slide; slideIndex: number; animPaused?: boolean }) {
  // ── User interaction pause for RGB animation ───────────────────────
  const userInteracting = useRef(false);
  const userResumeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const RESUME_DELAY = 4000; // ms before animation resumes after user stops

  const signalUserInteraction = useCallback(() => {
    userInteracting.current = true;
    if (userResumeTimer.current) clearTimeout(userResumeTimer.current);
    userResumeTimer.current = setTimeout(() => {
      userInteracting.current = false;
    }, RESUME_DELAY);
  }, []);

  // ── Color state (persists across all slides) ──────────────────────
  // The app's own hook - decision-hsb-canonical-rgb-override implemented once.
  // Before this the deck carried its own copy, and that copy re-derived the
  // HSL gesture origin on every write, which is the drift hslWrite.ts warns
  // against; it went unnoticed because nobody drags the deck's HSL sliders.
  const {
    hsb, setHsb, rgb, hsl, hsbRef, rgbOverride,
    setHsbClear, setRgbChannel: handleRgbChange, setHslChannel: onHslChange,
    animateToHsb: tweenTo,
  } = useColorState({ initial: { h: 0, s: 100, b: 100 }, onEdit: signalUserInteraction });
  const hex = useMemo(() => rgbToHex(rgb.r, rgb.g, rgb.b), [rgb.r, rgb.g, rgb.b]);

  /**
   * The handlers ColorHexagon expects, on top of the ones the deck already had.
   *
   * onAnimateToHsb is not optional in practice: handleColorLabelClick and the
   * bar markers early-return without it, so the vertex letters would be dead
   * controls. Same rAF tween the app and the plugin use, from utils/colorTween,
   * so the deck's letters feel like the app's rather than snapping.
   */
  const onAnimateToHsb = useCallback((target: Partial<HSB>) => {
    signalUserInteraction();
    tweenTo({ ...hsbRef.current, ...target });
  }, [signalUserInteraction, tweenTo, hsbRef]);


  // ── Slide classification ──────────────────────────────────────────
  const isStatic = slide.type === 'static';
  const panels = slide.props?.visiblePanels || [];
  const has = (p: string) => panels.includes(p);
  const locked = slide.props?.lockedChannels || [];
  const hasSliders = has('rgb-sliders') || has('hsb-sliders') || has('equations');

  // ── Set color when entering a new interactive slide ────────────────
  // Between interactive slides, keep the current color (no reset).
  // Only set initialHsb when coming from a static slide.
  const prevIdx = useRef(slideIndex);
  const prevWasStatic = useRef(isStatic);
  /**
   * Whether the slide we just left was static, for the animation start-up delay
   * below to read.
   *
   * It cannot read prevWasStatic. That ref is updated by this effect, which is
   * declared first and so flushes first, so by the time the delay effect runs it
   * already holds the CURRENT slide's value - and a slide with showRgbAnimate is
   * never static, which made the longer delay unreachable and the branch dead.
   */
  const cameFromStatic = useRef(false);
  useEffect(() => {
    if (slideIndex !== prevIdx.current) {
      const comingFromStatic = prevWasStatic.current;
      cameFromStatic.current = comingFromStatic;
      prevIdx.current = slideIndex;
      prevWasStatic.current = isStatic;
      if (slide.props?.initialHsb && comingFromStatic) {
        rgbOverride.current = null;
        setHsb(slide.props.initialHsb);
      }
    } else {
      prevWasStatic.current = isStatic;
    }
  }, [slideIndex, slide.props?.initialHsb, isStatic, rgbOverride, setHsb]);

  // ── Track previous panel mode for gradient transitions ─────────────
  const panelMode = (isStatic ? slide.props?.mode || 'bw' : 'swatch') as PanelMode;
  const prevPanelMode = useRef(panelMode);
  const [leavingGradient, setLeavingGradient] = useState(false);
  const [introExiting, setIntroExiting] = useState(false);
  const introExitMode = useRef<PanelMode | null>(null); // which intro mode is exiting ('intro' or 'acronyms')
  useEffect(() => {
    if (prevPanelMode.current === 'hsl-gradient' && panelMode !== 'hsl-gradient') {
      setLeavingGradient(true);
      const tid = setTimeout(() => setLeavingGradient(false), 400);
      prevPanelMode.current = panelMode;
      return () => clearTimeout(tid);
    }
    const wasIntro = prevPanelMode.current === 'intro' || prevPanelMode.current === 'acronyms';
    const isIntro = panelMode === 'intro' || panelMode === 'acronyms';
    if (wasIntro && !isIntro) {
      introExitMode.current = prevPanelMode.current;
      setIntroExiting(true);
      const tid = setTimeout(() => setIntroExiting(false), 900);
      prevPanelMode.current = panelMode;
      return () => clearTimeout(tid);
    }
    prevPanelMode.current = panelMode;
  }, [panelMode]);

  // ── Entrance animation for sliders ────────────────────────────────
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    setVisible(false);
    const id = requestAnimationFrame(() => requestAnimationFrame(() => setVisible(true)));
    return () => cancelAnimationFrame(id);
  }, [slideIndex]);

  // ── RGB keyframe animation ──────────────────────────────────────────
  // Always auto-starts when showRgbAnimate is set. No checkbox UI.
  // Slide 8: red only. Slide 9+: full Black,R,Y,G,C,B,M,W cycle.
  // When entering a new slide, finds the closest keyframe to the current
  // color and starts the animation from that point.
  const [rgbAnimActive, setRgbAnimActive] = useState(false);
  const rgbAnimRaf = useRef<number | null>(null);
  const rgbAnimKeyframesRef = useRef<typeof FULL_KEYFRAMES | null>(null); // track current keyframe set
  /**
   * Origin of the keyframe cycle, on the rAF clock, kept across slide changes.
   *
   * It has to outlive the animation effect. That effect re-runs on slideIndex,
   * and when it also recomputed the origin, every slide boundary restarted the
   * cycle at the beginning of the nearest keyframe's hold - so a colour that was
   * halfway from black to red reversed and walked back down, then set off again.
   * Held here, the cycle's phase is continuous and a slide change is invisible
   * to it.
   *
   * null means "not established yet"; the first tick sets it from its own
   * timestamp. See the note there about which clock.
   */
  const cycleStart = useRef<number | null>(null);

  const rgbAnimDelay = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevHadRgbAnim = useRef(false);
  useEffect(() => {
    if (rgbAnimDelay.current) clearTimeout(rgbAnimDelay.current);
    // A slider nudged on the slide before this one must not leave this one
    // frozen. The pause is a component-level ref with a 4s timer, so it outlived
    // the slide it belonged to: touch a slider and advance 300ms later, and the
    // new slide arrived dead for the remaining 3.7s.
    if (userResumeTimer.current) clearTimeout(userResumeTimer.current);
    userInteracting.current = false;
    if (!slide.props?.showRgbAnimate) {
      setRgbAnimActive(false);
      prevHadRgbAnim.current = false;
    } else if (prevHadRgbAnim.current && rgbAnimActive) {
      // Both previous and current slides have animation — keep it running.
      // No pause needed. The animation effect will restart with new keyframes
      // via the slideIndex dependency.
      prevHadRgbAnim.current = true;
    } else {
      // Starting fresh or coming from static/non-animated slide
      const delay = cameFromStatic.current ? 1000 : 300;
      setRgbAnimActive(false);
      rgbAnimDelay.current = setTimeout(() => setRgbAnimActive(true), delay);
      prevHadRgbAnim.current = true;
    }
    return () => { if (rgbAnimDelay.current) clearTimeout(rgbAnimDelay.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- rgbAnimActive intentionally read at slide-change time only
  }, [slideIndex, slide.props?.showRgbAnimate]);

  useEffect(() => {
    if (!rgbAnimActive || animPaused) {
      if (rgbAnimRaf.current) cancelAnimationFrame(rgbAnimRaf.current);
      rgbAnimRaf.current = null;
      // Next activation should pick up from whatever colour is on screen then,
      // so the cycle has to be re-established rather than resumed. That is also
      // what makes the pause button read correctly: resuming continues from the
      // colour you paused on instead of snapping back into the old phase.
      cycleStart.current = null;
      return;
    }

    const redOnly = slide.props?.lockedChannels?.includes('g');
    const keyframes = redOnly ? RED_KEYFRAMES : FULL_KEYFRAMES;
    const prevKeyframes = rgbAnimKeyframesRef.current;
    rgbAnimKeyframesRef.current = keyframes;
    // Sync the cycle to the colour on screen only when it is genuinely starting:
    // first activation, or a switch between the red-only and full keyframe sets
    // (slide 8 to 9). On every other slide change the cycle carries on.
    const needsSync = cycleStart.current === null || prevKeyframes !== keyframes;

    const TRANSITION_DUR = 1200;
    const HOLD_DUR = 800;
    const STEP_DUR = TRANSITION_DUR + HOLD_DUR;
    const CYCLE_DUR = keyframes.length * STEP_DUR;

    // Find the closest keyframe to the current color to start from
    const curRgb = rgbOverride.current || hsbToRgb(hsbRef.current.h, hsbRef.current.s, hsbRef.current.b);
    let bestIdx = 0;
    let bestDist = Infinity;
    for (let i = 0; i < keyframes.length; i++) {
      const kf = keyframes[i];
      const d = Math.abs(curRgb.r - kf.r) + Math.abs(curRgb.g - kf.g) + Math.abs(curRgb.b - kf.b);
      if (d < bestDist) { bestDist = d; bestIdx = i; }
    }
    // Start the cycle offset so this keyframe is the current hold
    const timeOffset = bestIdx * STEP_DUR;

    const LERP_DUR = 1500; // ms to lerp from user color back to animation
    let resumeStart: number | null = null; // when the user stopped interacting
    let resumeFrom: RGB | null = null; // the user's color when they stopped

    function getAnimColor(ts: number) {
      const elapsed = ts - (cycleStart.current ?? ts);
      /*
       * Both guards below are load-bearing, and each one on its own was enough
       * to kill this loop for the rest of the deck.
       *
       * The origin used to come from performance.now() while `ts` is the rAF
       * clock - the timestamp of the frame that has already begun. A rAF
       * scheduled from inside a commit running in that same frame gets a `ts`
       * up to one frame EARLIER than the performance.now() reading it was
       * subtracted from, so elapsed went negative. Measured: 131 of 4198
       * callbacks over one run of the deck, by 0.6ms to 17.5ms.
       *
       * JS % keeps the sign of its left operand, so a negative elapsed gave a
       * negative t, floor() gave frameIdx -1, and keyframes[-1] is undefined -
       * `from.r` threw inside the callback, before the reschedule below. The
       * animation did not stall, it died, and it stayed dead until the next
       * slide change re-ran this effect, which usually threw again on the same
       * dark colour. That is the freeze: 21 seconds pinned across six slides.
       *
       * The origin now comes from the same clock it is compared against, which
       * makes elapsed non-negative by construction. The non-negative modulo and
       * the clamped index are belt and braces: any future clock slip becomes a
       * one-frame visual glitch rather than a dead deck.
       */
      const t = ((elapsed % CYCLE_DUR) + CYCLE_DUR) % CYCLE_DUR;
      const frameIdx = Math.min(keyframes.length - 1, Math.max(0, Math.floor(t / STEP_DUR)));
      const frameT = t - frameIdx * STEP_DUR;

      if (frameT < HOLD_DUR) {
        return keyframes[frameIdx];
      }
      const p = Math.sin(((frameT - HOLD_DUR) / TRANSITION_DUR) * Math.PI / 2);
      const from = keyframes[frameIdx];
      const to = keyframes[(frameIdx + 1) % keyframes.length];
      return {
        r: Math.round(from.r + (to.r - from.r) * p),
        g: Math.round(from.g + (to.g - from.g) * p),
        b: Math.round(from.b + (to.b - from.b) * p),
      };
    }

    let synced = !needsSync;
    const tick = (ts: number) => {
      // Established here rather than at effect setup so the origin is read off
      // the rAF clock, which is the only clock `ts` can safely be compared to.
      if (!synced) {
        cycleStart.current = ts - timeOffset;
        synced = true;
      }
      if (userInteracting.current) {
        // Paused — user is dragging. Reset resume state.
        resumeStart = null;
        resumeFrom = null;
        rgbAnimRaf.current = requestAnimationFrame(tick);
        return;
      }

      const animColor = getAnimColor(ts);

      // If we just resumed from user interaction, lerp back
      if (resumeStart === null && resumeFrom === null) {
        // Check if we need to start a lerp (user was interacting, now stopped)
        const curRgb = rgbOverride.current || hsbToRgb(hsbRef.current.h, hsbRef.current.s, hsbRef.current.b);
        const dist = Math.abs(curRgb.r - animColor.r) + Math.abs(curRgb.g - animColor.g) + Math.abs(curRgb.b - animColor.b);
        if (dist > 10) {
          resumeStart = ts;
          resumeFrom = { ...curRgb };
        }
      }

      let r, g, b;
      if (resumeStart !== null && resumeFrom !== null) {
        const lerpT = Math.min((ts - resumeStart) / LERP_DUR, 1);
        const eased = lerpT < 0.5 ? 2 * lerpT * lerpT : -1 + (4 - 2 * lerpT) * lerpT;
        r = Math.round(resumeFrom.r + (animColor.r - resumeFrom.r) * eased);
        g = Math.round(resumeFrom.g + (animColor.g - resumeFrom.g) * eased);
        b = Math.round(resumeFrom.b + (animColor.b - resumeFrom.b) * eased);
        if (lerpT >= 1) {
          resumeStart = null;
          resumeFrom = null;
        }
      } else {
        ({ r, g, b } = animColor);
      }

      rgbOverride.current = { r, g, b };
      setHsb(rgbToHsb(r, g, b));
      rgbAnimRaf.current = requestAnimationFrame(tick);
    };
    rgbAnimRaf.current = requestAnimationFrame(tick);
    return () => {
      if (rgbAnimRaf.current) cancelAnimationFrame(rgbAnimRaf.current);
    };
  }, [rgbAnimActive, animPaused, slideIndex, slide.props?.lockedChannels, hsbRef, rgbOverride, setHsb]);

  // ── Derived values (must be above early returns to keep hook order stable) ──
  const enterColor = useMemo(() => {
    if (!slide.props?.initialHsb) return undefined;
    const { h, s, b: bv } = slide.props.initialHsb;
    const result = hsbToRgb(h, s, bv);
    return rgbToHex(result.r, result.g, result.b);
  }, [slide.props?.initialHsb]);

  const textColor = getContrastTextColor(rgb.r, rgb.g, rgb.b);

  // ── App reveal: mount hidden at small scale, then expand ──
  const [appReady, setAppReady] = useState(false);  // true = painted at start scale
  const [appExpanded, setAppExpanded] = useState(false); // true = scale up + fade in
  /**
   * True once the expand has finished, at which point the scale is dropped
   * entirely rather than left at scale(1).
   *
   * A transform establishes a containing block for `position: fixed`, and the
   * identity matrix counts - scale(1) captures fixed children just as firmly as
   * scale(0.6). The app's Settings panel is fixed and hides itself by sliding off
   * the right of the viewport with translate-x-[110%]; parented to this wrapper
   * instead, "off the viewport" became "off the wrapper", and 181px of a panel
   * that reported aria-hidden="true" sat visible on the last slide of the deck.
   */
  const [appSettled, setAppSettled] = useState(false);
  useEffect(() => {
    if (!appExpanded) { setAppSettled(false); return; }
    // Just past the 0.3s transform transition below.
    const t = setTimeout(() => setAppSettled(true), 360);
    return () => clearTimeout(t);
  }, [appExpanded]);
  useEffect(() => {
    const hasApp = (slide.props?.visiblePanels || []).includes('color-taylor-app');
    if (!hasApp) { setAppReady(false); setAppExpanded(false); return; }
    // Step 1: render at start scale, invisible (no transition)
    setAppReady(false);
    setAppExpanded(false);
    // Step 2: after paint, mark ready (still invisible)
    const raf = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setAppReady(true);
        // Step 3: after another frame, expand + fade in (with transition)
        requestAnimationFrame(() => setAppExpanded(true));
      });
    });
    return () => cancelAnimationFrame(raf);
  }, [slideIndex, slide.props?.visiblePanels]);

  // ── HSB Circle entrance animation (must be above ALL early returns) ──
  const [circleIn, setCircleIn] = useState(false);
  useEffect(() => {
    const hasCircle = (slide.props?.visiblePanels || []).includes('hsb-circle');
    if (!hasCircle) { setCircleIn(false); return; }
    setCircleIn(false);
    const id = requestAnimationFrame(() => requestAnimationFrame(() => setCircleIn(true)));
    return () => cancelAnimationFrame(id);
  }, [slideIndex, slide.props?.visiblePanels]);

  const showCircle = has('hsb-circle');

  const isHexSlide = slide.props?.hsbCircleShape === 'hexagon';

  /*
   * The wheel and the hexagon are one picker, and this tweens between them.
   *
   * The deck's argument here is that the wheel every tool shows is a guess at a
   * shape the cube actually has. Cutting between two pictures states that;
   * turning one into the other shows it, which is the whole reason the pair of
   * slides exists. ColorHexagon interpolates its own edge distance, so the
   * field, the outline, the brightness cross-section, the pointer mapping and
   * the handle fills all travel together and the picker stays coherent at every
   * frame rather than only at the ends.
   *
   * Stepped on rAF rather than tweened in CSS because the target is a number a
   * component reads, not a style, and the shader redraws each frame regardless.
   * Above the early returns with the other hooks - rules-of-hooks.
   */
  const [shapeMix, setShapeMix] = useState(isHexSlide ? 1 : 0);
  const shapeMixRef = useRef(shapeMix);
  shapeMixRef.current = shapeMix;
  const shapeRaf = useRef<number | null>(null);
  useEffect(() => {
    const target = isHexSlide ? 1 : 0;
    // Read through the ref, not a setState updater: an interrupted morph has to
    // resume from wherever it actually got to, and StrictMode runs updaters twice.
    const from = shapeMixRef.current;
    if (from === target) return;
    if (shapeRaf.current) cancelAnimationFrame(shapeRaf.current);
    let start: number | null = null;
    const tick = (ts: number) => {
      if (start === null) start = ts;
      const t = Math.min((ts - start) / SHAPE_MORPH_MS, 1);
      setShapeMix(from + (target - from) * easeInOutQuad(t));
      shapeRaf.current = t < 1 ? requestAnimationFrame(tick) : null;
    };
    shapeRaf.current = requestAnimationFrame(tick);
    return () => { if (shapeRaf.current) cancelAnimationFrame(shapeRaf.current); };
  }, [isHexSlide]);

  // Must be declared above ALL early returns — rules-of-hooks
  const appRef = useRef<HTMLDivElement | null>(null);

  // ── Color Taylor App reveal — scales up from presentation width ───
  if (has('color-taylor-app')) {
     
    const appWidth = appRef.current?.offsetWidth || 1150;
    const startScale = PANEL_W / appWidth;
     
    return (
      <div
        ref={appRef}
        style={{
          // 'none', not scale(1) - see appSettled. Visually identical, but it
          // hands fixed-position descendants back to the viewport.
          transform: appSettled ? 'none' : `scale(${appExpanded ? 1 : startScale})`,
          transformOrigin: 'center center',
          opacity: appExpanded ? 1 : 0,
          transition: appReady ? 'transform 0.3s ease-out, opacity 0.3s ease-out' : 'none',
        }}
      >
        <ColorPicker />
      </div>
    );
  }

  // ── Panel slides (static grids + interactive color swatch) ────────

  const showEquations = has('equations');
  const halfW = (PANEL_W - 16) / 2;
  const swatchH = showEquations ? 64 : PANEL_H;
  /*
   * One disc, two shapes.
   *
   * The wheel and the hexagon are the same object at different slides, so their
   * discs have to be the same size and land on the same centre - otherwise
   * moving between them reads as two unrelated diagrams rather than one being
   * corrected into the other. Both carry a brightness bar for the same reason.
   *
   * Derived from the app's own constants rather than numbers copied here, so
   * the deck cannot drift from the component it renders.
   */
  /*
   * Both shapes are just shapes, and share one brightness bar beside them.
   *
   * Each used to bring its own - the circle drew one, ColorHexagon has one built
   * in - which made them different controls at different sizes on consecutive
   * slides. ColorHexagon's also sits inside its own box, so it ate the width the
   * hexagon needed and left the ring smaller than the wheel it is meant to be
   * corrected into. With no bar in either, the disc is simply the column less
   * the shared bar, and the ring matches the wheel by construction.
   */
  const HEX_NO_BAR_EXTENT = HEX_CENTER_X * 2;                  // ColorHexagon's width with blBar off
  const RING_RATIO = (2 * HEX_RADIUS) / HEX_NO_BAR_EXTENT;     // ring / component width
  const HEX_STAGE_RATIO = HEX_STAGE_H / HEX_NO_BAR_EXTENT;     // stage height / component width

  const discW = halfW;
  const swatchW = halfW;

  /** The disc is the column, less the bar the two shapes share. */
  const discSize = Math.floor(Math.min(PANEL_H, halfW - BAR_CHROME));

  /*
   * Wider than the disc on purpose: ColorHexagon still reserves room either side
   * for the hue badge, which the deck turns off, so that padding is empty and
   * cropped by the clip-path. flexShrink: 0 or the flex row shrinks it back and
   * the ring never grows.
   */
  const hexSize = Math.round(discSize / RING_RATIO);
  /*
   * The same height for both shapes, not each shape's own.
   *
   * The column is bottom-anchored, so a taller column reaches higher and its
   * centre sits higher with it - which put the hexagon's centre fifteen pixels
   * above the wheel's on the slide before, for no reason a reader could see.
   * The hexagon's stage is the taller of the two, so both take that.
   */
  const discColH = Math.round(discSize * (HEX_STAGE_RATIO / RING_RATIO));


  return (
    <div className="flex flex-col items-center" style={{ width: PANEL_W }}>
      {/* Top area — relative container for absolute positioning */}
      <div style={{ position: 'relative', width: '100%', height: PANEL_H }}>

      {/* Equations panel — left column, bottom-aligned, auto height */}
      <div style={{
        position: 'absolute',
        left: 0,
        bottom: 0,
        width: halfW,
        opacity: showEquations ? 1 : 0,
        transform: showEquations ? 'translateY(0)' : 'translateY(-30px)',
        pointerEvents: showEquations ? 'auto' : 'none',
        transition: 'opacity 0.5s ease-out 0.3s, transform 0.5s ease-out 0.3s',
      }}>
        {showEquations && (
          <div className="presentation-equations" style={{ width: halfW }}>
            <style>{`.presentation-equations > div { grid-template-columns: 1fr !important; gap: 4px !important; }`}</style>
            <EquationsPanel
              rgb={rgb}
              hue={hsb.h}
              saturation={hsb.s}
              brightness={hsb.b}
              hsl={hsl}
              blMode="brightness"
            />
          </div>
        )}
      </div>

      {/* ── THE PERSISTENT PANEL (swatch) — tweens between positions, bottom-aligned ── */}
      <div
        style={{
          position: 'absolute',
          left: showEquations ? halfW + 16 : 0,
          bottom: 0,
          width: showCircle ? swatchW : PANEL_W,
          height: swatchH,
          backgroundColor: '#1F2C33',
          borderRadius: 16,
          overflow: 'hidden',
          transition: showEquations
            ? 'height 0.4s ease-out, left 0.4s ease-out 0.3s, width 0.4s ease-out 0.3s'
            : 'left 0.4s ease-out, width 0.4s ease-out, height 0.4s ease-out 0.3s',
        }}
      >
        {/* Animated grid — tweens between grid layouts and full swatch */}
        {/* z:3 when leaving gradient or intro so expanding cells appear ABOVE */}
        <div style={{ position: 'absolute', inset: 0, zIndex: (leavingGradient || introExiting) ? 3 : 1 }}>
          <AnimatedGrid
            mode={panelMode}
            swatchColor={hex}
            enterColor={enterColor}
          />
        </div>

        {/* Smooth R/G/B/Grey gradients over the discrete ramp cells. Driven by
            props.smoothOverlay, not by a mode name: the slide that used to own
            this (05-millions) was merged into the ramps slide. */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 2,
            opacity: slide.props?.smoothOverlay ? 1 : 0,
            transition: slide.props?.smoothOverlay
              ? 'opacity 0.3s ease-out 0.9s'
              : 'opacity 0.3s ease-out',
            display: 'flex',
            flexDirection: 'column',
            pointerEvents: 'none',
          }}
        >
          <div style={{ flex: 1, background: 'linear-gradient(to right, #000000, #ff0000)' }} />
          <div style={{ flex: 1, background: 'linear-gradient(to right, #000000, #00ff00)' }} />
          <div style={{ flex: 1, background: 'linear-gradient(to right, #000000, #0000ff)' }} />
          <div style={{ flex: 1, background: 'linear-gradient(to right, #000000, #ffffff)' }} />
        </div>

        {/* Smooth HSL gradient overlay — single opaque layer, fades in after cells settle */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 2,
            opacity: slide.props?.mode === 'hsl-gradient' ? 1 : 0,
            transition: slide.props?.mode === 'hsl-gradient'
              ? 'opacity 0.6s ease-in 0.8s'
              : 'opacity 0.3s ease-out',
            background: `
              linear-gradient(to bottom, white 0%, rgba(255,255,255,0) 50%, black 100%),
              linear-gradient(to right,
                hsl(0,100%,50%), hsl(30,100%,50%), hsl(60,100%,50%),
                hsl(90,100%,50%), hsl(120,100%,50%), hsl(150,100%,50%),
                hsl(180,100%,50%), hsl(210,100%,50%), hsl(240,100%,50%),
                hsl(270,100%,50%), hsl(300,100%,50%), hsl(330,100%,50%),
                hsl(360,100%,50%)
              )`,
            pointerEvents: 'none',
          }}
        />

        {/* Hex/RGB/HSB labels inside swatch */}
        {slide.props?.showHexInPreview && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: isStatic ? 0 : 1,
              transition: 'all 0.7s ease-in-out',
              zIndex: 2,
              color: textColor,
              containerType: 'inline-size',
            }}
          >
            {/* Hex — scales to fit container width */}
            <span className="font-mono font-bold tracking-wider" style={{ fontSize: 'min(4.5rem, 12cqw)' }}>{hex.toUpperCase()}</span>

            {/* RGB + HSB/HSL below hex — uses margin trick for centering */}
            <div style={{
              position: 'relative',
              width: '100%',
              marginTop: 8,
            }}>
              {/* RGB values — slides from center to left half */}
              <div style={{
                position: 'absolute',
                top: 0,
                left: slide.props?.showHsbInPreview ? 0 : '25%',
                width: '50%',
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                transition: 'left 0.4s ease-out',
              }}>
                <span className="font-mono text-sm font-bold opacity-70 tabular-nums whitespace-nowrap">
                  rgb({'\u2007\u2007'}{String(rgb.r).padStart(3, '\u2007')}, {'\u2007\u2007'}{String(rgb.g).padStart(3, '\u2007')}, {'\u2007\u2007'}{String(rgb.b).padStart(3, '\u2007')})
                </span>
                <span className="font-mono text-sm font-bold opacity-50 whitespace-nowrap">
                  rgb({(rgb.r / 255).toFixed(3)}, {(rgb.g / 255).toFixed(3)}, {(rgb.b / 255).toFixed(3)})
                </span>
              </div>

              {/* HSB/HSL values — slides in from right */}
              <div style={{
                position: 'absolute',
                top: 0,
                left: '50%',
                width: '50%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                opacity: slide.props?.showHsbInPreview ? 1 : 0,
                transform: slide.props?.showHsbInPreview ? 'translateX(0)' : 'translateX(30px)',
                transition: 'opacity 0.4s ease-out, transform 0.4s ease-out',
                whiteSpace: 'nowrap',
              }}>
                <span className="font-mono text-sm opacity-70 tabular-nums">
                  hsb({String(hsb.h).padStart(3, '\u2007')}, {String(hsb.s).padStart(3, '\u2007')}%, {String(hsb.b).padStart(3, '\u2007')}%)
                </span>
                <span className="font-mono text-sm font-bold opacity-50 tabular-nums">
                  hsl({String(hsl.h).padStart(3, '\u2007')}, {String(hsl.s).padStart(3, '\u2007')}%, {String(hsl.l).padStart(3, '\u2007')}%)
                </span>
              </div>
              {/* Spacer for height */}
              <div style={{ visibility: 'hidden' }}>
                <span className="font-mono text-sm">placeholder</span>
                <span className="font-mono text-sm">placeholder</span>
              </div>
            </div>
          </div>
        )}

        {/* Intro / Acronyms — shared elements that tween between slides */}
        {(slide.props?.mode === 'intro' || slide.props?.mode === 'acronyms' || introExiting) && (
           
          <IntroPanel mode={introExiting ? (introExitMode.current ?? 'intro') : panelMode} exiting={introExiting} />
        )}

        {/* Hex value overlay inside swatch */}
        {showCircle && (
          <div style={{
            position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 2, color: textColor, containerType: 'inline-size',
          }}>
            <span className="font-mono font-bold tracking-wider" style={{ fontSize: showEquations ? '8cqw' : '12cqw', transition: 'font-size 0.4s ease-out' }}>{hex.toUpperCase()}</span>
          </div>
        )}
      </div>

      {/* HSB Circle — right column, bottom-aligned above the swatch */}
      <div style={{
        position: 'absolute',
        right: 0,
        bottom: showEquations ? swatchH + 8 : 0,
        width: showCircle ? discW : 0,
        height: discColH,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: circleIn ? 1 : 0,
        /*
         * The clip is here for the width transition, which animates from 0 -
         * but the picker's overhangs are legitimate, and `overflow: hidden`
         * took 7px off the top of the hue badge every time the cycle passed
         * through green.
         *
         * clip-path does what overflow cannot: clip one axis. Flush at the left
         * and right so the reveal still wipes, open top and bottom so the
         * overhang survives. Not conditional on the shape: it is one component
         * on both slides, and mid-morph it is neither.
         */
        overflow: 'visible',
        clipPath: 'inset(-48px -56px)',
        transition: 'width 0.5s ease-out, opacity 0.4s ease-out 0.1s',
      }}>
        {/*
          Both shape slides render the app's own picker, not a lookalike - see
          decision-intro-renders-the-real-picker. The circle used to be a second
          renderer because it was the one thing ColorHexagon could not be; now
          the component interpolates its own edge, so there is one picker here
          and the wheel-to-hexagon correction is a morph rather than a cut.

          Mounted the way the Figma plugin mounts it: bare, with its own bars
          off, so what shows is the field, the stems and the handles and nothing
          else. The wheel does not adjust the field in any host now.
        */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
        <div style={{
          width: discSize, height: discColH, flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
        <div style={{ width: hexSize, flexShrink: 0 }}>
          <ColorHexagon
            rgb={rgb}
            hue={hsb.h}
            brightness={hsb.b}
            saturation={hsb.s}
            hsl={hsl}
            onHueChange={(h) => setHsbClear(p => ({ ...p, h }))}
            onRgbChange={handleRgbChange}
            onHsbChange={(next) => setHsbClear(p => ({ ...p, ...next }))}
            onHslChange={onHslChange}
            onAnimateToHsb={onAnimateToHsb}
            blMode="brightness"
            onBlModeChange={() => {}}
            colorSpace="srgb"
            bare
            collapsedSections
            sectionVariant="flush"
            blBar={false}
            satBar={false}
            stemRange={[2, 4]}
            swatchSections={false}
            blModeTabs={false}
            vertexLabels={false}
            blMarkers={false}
            hueIndicator={false}
            shapeMix={shapeMix}
            /*
             * The chain rides the morph rather than having its own timing.
             *
             * They are the same claim. The wheel shows where your color is and
             * cannot say why, having no geometry that maps to the channels; the
             * hexagon does, and the three segments are what that buys. So the
             * stems arrive exactly as the shape that explains them does, and the
             * handle - the selected color - is the one thing that never leaves.
             */
            chainReveal={shapeMix}
            muted
          />
        </div>
        </div>
        {/*
          Above the shape, not beside it.

          The hexagon's wrapper is deliberately wider than its column - the
          component still reserves room either side for a hue badge the deck
          turns off - and that empty padding is a transparent SVG that lands on
          top of the bar. The bar was not merely hard to hit, it was dead across
          its whole width. A stacking context puts the control back in front of
          the padding that was covering it.
        */}
        <div style={{ position: 'relative', zIndex: 1, display: 'flex' }}>
        <DiscBrightnessBar
          hue={hsb.h}
          saturation={hsb.s}
          brightness={hsb.b}
          height={discSize}
          onChange={(b) => { signalUserInteraction(); setHsbClear(p => ({ ...p, b })); }}
        />
        </div>
        </div>
      </div>
      </div>

      {/* ── SLIDERS (always in DOM, tween in/out) ── */}
      <div
        className="transition-all duration-700 ease-out"
        style={{
          width: PANEL_W,
          opacity: hasSliders && visible ? 1 : 0,
          transform: hasSliders && visible ? 'translateY(0)' : 'translateY(24px)',
          marginTop: 12,
          pointerEvents: hasSliders ? 'auto' : 'none',
        }}
      >
        <div style={{ position: 'relative', minHeight: 120 }}>
          {/* RGB sliders — centered when alone, slides to left when HSB appears */}
          {has('rgb-sliders') && (
            <div className="border border-border rounded-lg p-3" style={{
              position: 'absolute',
              top: 0,
              left: has('hsb-sliders') ? 0 : '25%',
              width: 'calc(50% - 8px)',
              transition: 'left 0.4s ease-out',
            }}>
              <h3 className="text-sm font-semibold mb-2">RGB</h3>
              <div className="flex flex-col gap-2">
                <ColorSlider group='rgb' label="R" value={rgb.r} max={255} gradient={redChannelGradient} onChange={(v) => handleRgbChange('r', v)} hideStepper={!showCircle} />
                {!locked.includes('g') && <ColorSlider group='rgb' label="G" value={rgb.g} max={255} gradient={greenChannelGradient} onChange={(v) => handleRgbChange('g', v)} hideStepper={!showCircle} />}
                {!locked.includes('b') && <ColorSlider group='rgb' label="B" value={rgb.b} max={255} gradient={blueChannelGradient} onChange={(v) => handleRgbChange('b', v)} hideStepper={!showCircle} />}
              </div>
            </div>
          )}
          {/* HSB sliders — absolute positioned so it doesn't push RGB off-center */}
          <div className="border border-border rounded-lg p-3" style={{
            position: 'absolute',
            right: 0,
            top: 0,
            width: 'calc(50% - 8px)',
            opacity: has('hsb-sliders') ? 1 : 0,
            transform: has('hsb-sliders') ? 'translateX(0)' : 'translateX(40px)',
            transition: 'opacity 0.4s ease-out, transform 0.4s ease-out',
            pointerEvents: has('hsb-sliders') ? 'auto' : 'none',
          }}>
              <h3 className="text-sm font-semibold mb-2">HSB</h3>
              <div className="flex flex-col gap-2">
                <ColorSlider group='hsb' label="H" value={hsb.h} max={360} wrap gradient={hueGradient(hsb.s, hsb.b, 'srgb')} onChange={(v) => setHsbClear(p => ({ ...p, h: v }))} hideStepper={!showCircle} />
                <ColorSlider group='hsb' label="S" value={hsb.s} max={100} gradient={saturationGradient(hsb.h, hsb.b, 'srgb')} onChange={(v) => setHsbClear(p => ({ ...p, s: v }))} hideStepper={!showCircle} />
                <ColorSlider group='hsb' label="B" value={hsb.b} max={100} gradient={brightnessGradient(hsb.h, hsb.s, 'srgb')} onChange={(v) => setHsbClear(p => ({ ...p, b: v }))} hideStepper={!showCircle} />
              </div>
            </div>
          {/* Equations panel is now in the left column above the swatch */}
        </div>
        {/* Animate Colors checkbox removed — animation auto-starts */}
      </div>
    </div>
  );
}

// ── Shared intro/acronyms panel with tweening positions ─────────────

const TRANS_INTRO = 'all 0.7s cubic-bezier(0.4, 0, 0.2, 1)';
const LETTER_SZ = '6rem';
const LETTER_W = 900;
const LETTER_FONT = "'Barlow', sans-serif";
const DROP = 'drop-shadow(3px 3px 0 rgba(0,0,0,0.9))';

const R_STYLE = { color: '#FF4444', filter: DROP };
const G_STYLE = { color: '#44DD44', filter: DROP };
const B_STYLE = { color: '#6688FF', filter: DROP };
// Linear at the same 165deg and the same 20-80% inset as S and B below, so the
// three read as one family. It was a conic sweep, which put a visible pivot in
// the middle of the glyph and pointed a different way from its two neighbours.
const H_STYLE = {
  backgroundImage: 'linear-gradient(165deg, hsl(0,100%,50%) 20%, hsl(60,100%,50%) 30%, hsl(120,100%,50%) 40%, hsl(180,100%,50%) 50%, hsl(240,100%,50%) 60%, hsl(300,100%,50%) 70%, hsl(360,100%,50%) 80%)',
  WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent', filter: DROP,
};
const S_STYLE = {
  backgroundImage: 'linear-gradient(165deg, #FF9900 20%, #FFFFFF 80%)',
  WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent', filter: DROP,
};
const B_HSB_STYLE = {
  backgroundImage: 'linear-gradient(165deg, #FFFFFF 20%, #000000 80%)',
  WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent', filter: DROP,
};

// Each letter absolutely positioned, tweens from intro row to acronym columns.
// Positions in % of panel. Letter container is fixed width for alignment.

// Exact positions from Figma metadata (726×320 panel).
// Letter rendered height = 67px (96px font with cap-height trim).
// Row spacing in acronyms: 87px between letter tops.

type LetterGroup = 'rgb' | 'hsb';
type LetterId = 'r' | 'g' | 'b1' | 'h' | 's' | 'b2';
interface Letter {
  id: LetterId;
  char: string;
  style: React.CSSProperties;
  group: LetterGroup;
  row: number;
  introX: number;
  introXOff: number;
  label: string;
}

const LETTER_DATA: Letter[] = [
  // Intro: absolute position within panel. Acronyms: stacked column positions.
  // introX = parent frame x, introXOff = letter offset within group (tuned for Barlow)
  { id: 'r',  char: 'R', style: R_STYLE, group: 'rgb', row: 0, introX: 85,  introXOff: 0,   label: 'Red' },
  { id: 'g',  char: 'G', style: G_STYLE, group: 'rgb', row: 1, introX: 85,  introXOff: 60,  label: 'Green' },
  { id: 'b1', char: 'B', style: B_STYLE, group: 'rgb', row: 2, introX: 85,  introXOff: 130, label: 'Blue' },
  { id: 'h',  char: 'H', style: H_STYLE, group: 'hsb', row: 0, introX: 440, introXOff: 0,   label: 'Hue' },
  { id: 's',  char: 'S', style: S_STYLE, group: 'hsb', row: 1, introX: 440, introXOff: 65,  label: 'Saturation' },
  { id: 'b2', char: 'B', style: B_HSB_STYLE, group: 'hsb', row: 2, introX: 440, introXOff: 130, label: 'Brightness' },
];

// Acronyms letter frame positions
const ACRO_LETTER_X: Record<LetterGroup, number> = { rgb: 60, hsb: 423 };
// Letter x-offsets within the 80px-wide frame (centered per letter width)
const ACRO_LETTER_XOFF: Record<LetterId, number> = {
  r: 10, g: 5, b1: 10,
  h: 7, s: 12, b2: 10,
};
const ACRO_LETTER_Y = 40; // top of letter frame
const ROW_STEP = 87; // y distance between letter rows

// Acronyms label positions
const ACRO_LABEL_X: Record<LetterGroup, number> = { rgb: 160, hsb: 523 };
const ACRO_LABEL_Y = 65; // top of label frame

// Intro label positions (hidden, with x-offsets for slide-in animation)
const INTRO_LABEL_XOFF: Record<LetterGroup, number[]> = {
  rgb: [0, 50, 120],   // Red, Green, Blue x-offsets within frame
  hsb: [0, 50, 100],   // Hue, Saturation, Brightness x-offsets within frame
};

const INTRO_Y = 111; // top of letters in intro (125 - 14 line-height compensation)
const LETTER_H = 67; // rendered cap-height
const ACRO_Y_OFFSET = -14; // compensation for lineHeight:1 vs cap-height trim

function IntroPanel({ mode, exiting = false }: { mode: PanelMode; exiting?: boolean }) {
  const exp = mode === 'acronyms';

  // When exiting, hold positions in place (BW cells will expand over them)
  function getLetterPos(l: Letter) {
    if (exiting || exp) {
      return {
        x: ACRO_LETTER_X[l.group] + (ACRO_LETTER_XOFF[l.id] || 0),
        y: ACRO_LETTER_Y + ACRO_Y_OFFSET + l.row * ROW_STEP,
      };
    }
    return { x: l.introX + l.introXOff, y: INTRO_Y };
  }

  function getLabelPos(l: Letter) {
    if (exiting || exp) {
      return { x: ACRO_LABEL_X[l.group], y: ACRO_LABEL_Y + l.row * ROW_STEP };
    }
    const introXOff = INTRO_LABEL_XOFF[l.group][l.row];
    return { x: (l.group === 'rgb' ? 210 : 573) + introXOff, y: 65 + l.row * ROW_STEP };
  }

  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 2, overflow: 'hidden' }}>
      {/* Letters */}
      {LETTER_DATA.map(l => {
        const pos = getLetterPos(l);
        return (
          <div key={l.id} style={{
            position: 'absolute',
            left: pos.x,
            top: pos.y,
            opacity: 1,
            transition: TRANS_INTRO,
          }}>
            <span style={{
              fontSize: 96,
              fontWeight: LETTER_W,
              fontFamily: LETTER_FONT,
              lineHeight: 1,
              display: 'block',
              textTransform: 'uppercase',
              overflow: 'visible',
              ...l.style,
            }}>
              {l.char}
            </span>
          </div>
        );
      })}

      {/* Labels */}
      {LETTER_DATA.map(l => {
        const pos = getLabelPos(l);
        return (
          <div key={l.id + '-label'} style={{
            position: 'absolute',
            left: pos.x,
            top: pos.y,
            opacity: (exp || exiting) ? 1 : 0,
            transition: TRANS_INTRO,
            whiteSpace: 'nowrap',
          }}>
            <span className="text-xl text-white">
              {l.label}
            </span>
          </div>
        );
      })}

      {/* Arrow */}
      <div style={{
        position: 'absolute',
        left: 0,
        right: 0,
        top: INTRO_Y,
        height: 96,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: exp || exiting ? 0.3 : 0.6,
        transition: TRANS_INTRO,
        pointerEvents: 'none',
      }}>
        <span style={{ fontSize: 48, fontWeight: 300, color: '#fff' }}>&#x2194;</span>
      </div>

      {/* Subtitle */}
      <div style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 30,
        textAlign: 'center',
        opacity: (exp || exiting) ? 0 : 1,
        transition: TRANS_INTRO,
      }}>
        <span className="text-xl text-muted-foreground">How does one become the other?</span>
      </div>
    </div>
  );
}
