import { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { hsbToRgb, rgbToHsb, rgbToHex, rgbToHsl } from '../utils/colorConversions';
import {
  hueGradient, saturationGradient, brightnessGradient,
  redChannelGradient, greenChannelGradient, blueChannelGradient,
} from '../utils/sliderGradients';
import { PANEL_W, PANEL_H } from './slides/MonitorPanel';
import AnimatedGrid from './slides/AnimatedGrid';
import ColorSlider from '../components/ColorSlider';
import PreviewSwatch from '../components/PreviewSwatch';
import HexInput from '../components/HexInput';
import EquationsPanel from '../components/EquationsPanel';
import ColorOperations from '../components/ColorOperations';
import ColorHexagon from '../components/ColorHexagon';
import NarrativeSlide from './slides/NarrativeSlide';
import HsbCircle from './HsbCircle';
import ColorPicker from '../components/ColorPicker';

export default function PresentationStage({ slide, slideIndex }) {
  // ── Color state (persists across all slides) ──────────────────────
  const [hsb, setHsb] = useState({ h: 0, s: 100, b: 100 });
  const hsbRef = useRef(hsb);
  hsbRef.current = hsb;
  const animRef = useRef(null);
  const rgbOverride = useRef(null);

  const rgbFromHsb = useMemo(() => hsbToRgb(hsb.h, hsb.s, hsb.b), [hsb.h, hsb.s, hsb.b]);
  const rgb = rgbOverride.current || rgbFromHsb;
  const hex = useMemo(() => rgbToHex(rgb.r, rgb.g, rgb.b), [rgb.r, rgb.g, rgb.b]);
  const hsl = useMemo(() => rgbToHsl(rgb.r, rgb.g, rgb.b), [rgb.r, rgb.g, rgb.b]);

  const animateToHsb = useCallback((target) => {
    rgbOverride.current = null;
    if (animRef.current) cancelAnimationFrame(animRef.current);
    const duration = 1000;
    const from = { ...hsbRef.current };
    let start = null;
    const easeInOut = (t) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
    const tick = (ts) => {
      if (!start) start = ts;
      const t = easeInOut(Math.min((ts - start) / duration, 1));
      let dh = target.h - from.h;
      if (dh > 180) dh -= 360;
      if (dh < -180) dh += 360;
      setHsb({
        h: Math.round(((from.h + dh * t) % 360 + 360) % 360),
        s: Math.round(from.s + (target.s - from.s) * t),
        b: Math.round(from.b + (target.b - from.b) * t),
      });
      rgbOverride.current = null;
      if ((ts - start) < duration) animRef.current = requestAnimationFrame(tick);
      else animRef.current = null;
    };
    animRef.current = requestAnimationFrame(tick);
  }, []);

  // ── User interaction pause for RGB animation ───────────────────────
  const userInteracting = useRef(false);
  const userResumeTimer = useRef(null);
  const RESUME_DELAY = 4000; // ms before animation resumes after user stops

  const signalUserInteraction = useCallback(() => {
    userInteracting.current = true;
    if (userResumeTimer.current) clearTimeout(userResumeTimer.current);
    userResumeTimer.current = setTimeout(() => {
      userInteracting.current = false;
    }, RESUME_DELAY);
  }, []);

  const setHsbClear = useCallback((valOrFn) => {
    signalUserInteraction();
    rgbOverride.current = null;
    setHsb(valOrFn);
  }, [signalUserInteraction]);

  const handleRgbChange = useCallback((channel, value) => {
    signalUserInteraction();
    setHsb((prev) => {
      const cur = rgbOverride.current || hsbToRgb(prev.h, prev.s, prev.b);
      const next = { ...cur, [channel]: value };
      rgbOverride.current = next;
      return rgbToHsb(next.r, next.g, next.b);
    });
  }, []);

  // ── Slide classification ──────────────────────────────────────────
  const isStatic = slide.type === 'static';
  const isNarrative = slide.type === 'narrative';
  const panels = slide.props?.visiblePanels || [];
  const has = (p) => panels.includes(p);
  const hasLargePreview = has('large-preview');
  const hasHexagon = has('hexagon');
  const usesPanel = isStatic || hasLargePreview;
  const locked = slide.props?.lockedChannels || [];
  const hasSliders = has('rgb-sliders') || has('hsb-sliders') || has('hex-input') || has('equations') || has('conversions');

  // ── Set color when entering a new interactive slide ────────────────
  // Between interactive slides, keep the current color (no reset).
  // Only set initialHsb when coming from a static slide.
  const prevIdx = useRef(slideIndex);
  const prevWasStatic = useRef(isStatic);
  useEffect(() => {
    if (slideIndex !== prevIdx.current) {
      const comingFromStatic = prevWasStatic.current;
      prevIdx.current = slideIndex;
      prevWasStatic.current = isStatic;
      if (slide.props?.initialHsb && comingFromStatic) {
        rgbOverride.current = null;
        setHsb(slide.props.initialHsb);
      }
    } else {
      prevWasStatic.current = isStatic;
    }
  }, [slideIndex, slide.props?.initialHsb, isStatic]);

  // ── Track previous panel mode for gradient transitions ─────────────
  const panelMode = isStatic ? slide.props?.mode || 'bw' : 'swatch';
  const prevPanelMode = useRef(panelMode);
  const [leavingGradient, setLeavingGradient] = useState(false);
  const [introExiting, setIntroExiting] = useState(false);
  const introExitMode = useRef(null); // which intro mode is exiting ('intro' or 'acronyms')
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

  // ── Sine wave animation (Finding HSB slide) ───────────────────────
  const [sineActive, setSineActive] = useState(false);
  const [sinePeriods, setSinePeriods] = useState({ h: 15000, s: 11000, b: 9000 });
  const sinePeriodsRef = useRef(sinePeriods);
  sinePeriodsRef.current = sinePeriods;
  const sineRaf = useRef(null);

  // Reset sine wave when leaving the slide
  useEffect(() => {
    if (!slide.props?.showSineWave) setSineActive(false);
  }, [slideIndex, slide.props?.showSineWave]);

  useEffect(() => {
    if (!sineActive) {
      if (sineRaf.current) cancelAnimationFrame(sineRaf.current);
      sineRaf.current = null;
      return;
    }
    const start = performance.now();
    const tick = (ts) => {
      const elapsed = ts - start;
      const p = sinePeriodsRef.current;
      const h = Math.round(((elapsed % p.h) / p.h) * 360);
      const s = Math.round(((Math.sin(elapsed * 2 * Math.PI / p.s) + 1) / 2) * 100);
      const b = Math.round(Math.pow((Math.sin(elapsed * 2 * Math.PI / p.b) + 1) / 2, 0.4) * 100);
      rgbOverride.current = null;
      setHsb({ h, s, b });
      sineRaf.current = requestAnimationFrame(tick);
    };
    sineRaf.current = requestAnimationFrame(tick);
    return () => {
      if (sineRaf.current) cancelAnimationFrame(sineRaf.current);
    };
  }, [sineActive]);

  // ── RGB keyframe animation ──────────────────────────────────────────
  // Always auto-starts when showRgbAnimate is set. No checkbox UI.
  // Slide 8: red only. Slide 9+: full Black,R,Y,G,C,B,M,W cycle.
  // When entering a new slide, finds the closest keyframe to the current
  // color and starts the animation from that point.
  const [rgbAnimActive, setRgbAnimActive] = useState(false);
  const rgbAnimRaf = useRef(null);
  const rgbAnimKeyframesRef = useRef(null); // track current keyframe set

  const FULL_KEYFRAMES = [
    { r: 0,   g: 0,   b: 0   }, // Black
    { r: 255, g: 0,   b: 0   }, // Red
    { r: 255, g: 255, b: 0   }, // Yellow
    { r: 0,   g: 255, b: 0   }, // Green
    { r: 0,   g: 255, b: 255 }, // Cyan
    { r: 0,   g: 0,   b: 255 }, // Blue
    { r: 255, g: 0,   b: 255 }, // Magenta
    { r: 255, g: 255, b: 255 }, // White
  ];
  const RED_KEYFRAMES = [
    { r: 0,   g: 0,   b: 0   },
    { r: 255, g: 0,   b: 0   },
  ];

  const rgbAnimDelay = useRef(null);
  useEffect(() => {
    if (rgbAnimDelay.current) clearTimeout(rgbAnimDelay.current);
    if (!slide.props?.showRgbAnimate) {
      setRgbAnimActive(false);
    } else {
      // Always pause briefly when changing slides to let cell tweens settle.
      // Longer delay when coming from static (swatch expand needs ~1.2s).
      // Shorter delay between interactive slides (just need CSS to settle).
      const delay = prevWasStatic.current ? 1000 : 300;
      setRgbAnimActive(false); // pause current animation
      rgbAnimDelay.current = setTimeout(() => setRgbAnimActive(true), delay);
    }
    return () => { if (rgbAnimDelay.current) clearTimeout(rgbAnimDelay.current); };
  }, [slideIndex, slide.props?.showRgbAnimate]);

  useEffect(() => {
    if (!rgbAnimActive) {
      if (rgbAnimRaf.current) cancelAnimationFrame(rgbAnimRaf.current);
      rgbAnimRaf.current = null;
      return;
    }

    const redOnly = slide.props?.lockedChannels?.includes('g');
    const keyframes = redOnly ? RED_KEYFRAMES : FULL_KEYFRAMES;
    rgbAnimKeyframesRef.current = keyframes;

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

    const start = performance.now() - timeOffset;
    const LERP_DUR = 1500; // ms to lerp from user color back to animation
    let resumeStart = null; // when the user stopped interacting
    let resumeFrom = null; // the user's color when they stopped

    function getAnimColor(ts) {
      const elapsed = ts - start;
      const t = elapsed % CYCLE_DUR;
      const frameIdx = Math.floor(t / STEP_DUR);
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

    const tick = (ts) => {
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
  }, [rgbAnimActive, slideIndex]);

  // ── Derived values (must be above early returns to keep hook order stable) ──
  const enterColor = useMemo(() => {
    if (!slide.props?.initialHsb) return null;
    const { h, s, b: bv } = slide.props.initialHsb;
    const result = hsbToRgb(h, s, bv);
    return rgbToHex(result.r, result.g, result.b);
  }, [slide.props?.initialHsb]);

  const textColor = (rgb.r * 0.299 + rgb.g * 0.587 + rgb.b * 0.114) > 130 ? '#000' : '#fff';

  // ── App reveal: mount hidden at small scale, then expand ──
  const [appReady, setAppReady] = useState(false);  // true = painted at start scale
  const [appExpanded, setAppExpanded] = useState(false); // true = scale up + fade in
  useEffect(() => {
    if (!has('color-taylor-app')) { setAppReady(false); setAppExpanded(false); return; }
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
  }, [slideIndex]);

  // ── HSB Circle entrance animation (must be above ALL early returns) ──
  const [circleIn, setCircleIn] = useState(false);
  useEffect(() => {
    if (!has('hsb-circle')) { setCircleIn(false); return; }
    setCircleIn(false);
    const id = requestAnimationFrame(() => requestAnimationFrame(() => setCircleIn(true)));
    return () => cancelAnimationFrame(id);
  }, [slideIndex]);

  const showCircle = has('hsb-circle');

  // ── Narrative slides ──────────────────────────────────────────────
  if (isNarrative) return <NarrativeSlide {...(slide.props || {})} />;

  // ── Color Taylor App reveal — scales up from presentation width ───
  const appRef = useRef(null);
  if (has('color-taylor-app')) {
    // Measure actual app width to compute accurate start scale
    const appWidth = appRef.current?.offsetWidth || 1150;
    const startScale = PANEL_W / appWidth;
    return (
      <div
        ref={appRef}
        style={{
          transform: `scale(${appExpanded ? 1 : startScale})`,
          transformOrigin: 'center center',
          opacity: appExpanded ? 1 : 0,
          transition: appReady ? 'transform 0.6s ease-out, opacity 0.4s ease-out' : 'none',
        }}
      >
        <ColorPicker />
      </div>
    );
  }

  // ── Hexagon slides (different layout entirely) ────────────────────
  if (hasHexagon) {
    return (
      <div className="flex gap-6 items-start">
        <div className="shrink-0">
          <ColorHexagon
            rgb={rgb} hue={hsb.h} brightness={hsb.b} saturation={hsb.s} hsl={hsl}
            onHueChange={(h) => setHsbClear(p => ({ ...p, h }))}
            onRgbChange={handleRgbChange}
            onHsbChange={(v) => setHsbClear(p => ({ ...p, ...v }))}
            onHslChange={() => {}} onAnimateToHsb={animateToHsb}
            blMode="brightness" onBlModeChange={() => {}}
            colorSpace="srgb" onColorSpaceChange={() => {}}
            hoverMatchRgb={null} showHtmlOnHex={false} onHoverHtmlColor={() => {}}
          />
        </div>
        {has('preview') && (
          <div className="flex flex-col gap-4 min-w-[360px]">
            <div className="flex gap-3 items-stretch">
              <PreviewSwatch hex={hex} />
              <div className="flex-1 font-mono text-lg flex items-center">{hex.toUpperCase()}</div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── Panel slides (static grids + interactive color swatch) ────────

  const showEquations = has('equations');
  const halfW = (PANEL_W - 16) / 2;
  const swatchH = showEquations ? 64 : PANEL_H;
  const circleSize = showEquations ? PANEL_H - swatchH - 8 : PANEL_H - 24;

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
          <div className="presentation-equations" style={{ fontSize: '0.65rem' }}>
            <style>{`.presentation-equations > div { display: flex !important; flex-direction: column !important; gap: 4px !important; grid-template-columns: none !important; }`}</style>
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
          left: showEquations ? halfW + 16 : (showCircle ? 0 : 0),
          bottom: 0,
          width: showCircle ? halfW : PANEL_W,
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

        {/* Millions gradient overlay — smooth R/G/B/Gray bars over thousands cells */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 2,
            opacity: slide.props?.mode === 'millions' ? 1 : 0,
            transition: slide.props?.mode === 'millions'
              ? 'opacity 0.3s ease-out'
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
          <IntroPanel mode={introExiting ? introExitMode.current : slide.props.mode} exiting={introExiting} />
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
        width: showCircle ? halfW : 0,
        height: circleSize,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: circleIn ? 1 : 0,
        overflow: 'hidden',
        transition: 'width 0.5s ease-out, opacity 0.4s ease-out 0.1s',
      }}>
        <HsbCircle
          size={circleSize}
          hue={hsb.h}
          saturation={hsb.s}
          brightness={hsb.b}
          shape={slide.props?.hsbCircleShape || 'circle'}
          onHsbChange={(newHsb) => { signalUserInteraction(); setHsbClear(p => ({ ...p, ...newHsb })); }}
        />
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
            <div className="border border-input rounded-lg p-3" style={{
              position: 'absolute',
              top: 0,
              left: has('hsb-sliders') ? 0 : '25%',
              width: 'calc(50% - 8px)',
              transition: 'left 0.4s ease-out',
            }}>
              <h3 className="text-sm font-semibold mb-2">RGB</h3>
              <div className="flex flex-col gap-2">
                <ColorSlider label="R" value={rgb.r} max={255} gradient={redChannelGradient} onChange={(v) => handleRgbChange('r', v)} hideStepper={!showCircle} />
                {!locked.includes('g') && <ColorSlider label="G" value={rgb.g} max={255} gradient={greenChannelGradient} onChange={(v) => handleRgbChange('g', v)} hideStepper={!showCircle} />}
                {!locked.includes('b') && <ColorSlider label="B" value={rgb.b} max={255} gradient={blueChannelGradient} onChange={(v) => handleRgbChange('b', v)} hideStepper={!showCircle} />}
              </div>
            </div>
          )}
          {/* HSB sliders — absolute positioned so it doesn't push RGB off-center */}
          <div className="border border-input rounded-lg p-3" style={{
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
                <ColorSlider label="H" value={hsb.h} max={360} wrap gradient={hueGradient(hsb.s, hsb.b, 'srgb')} onChange={(v) => setHsbClear(p => ({ ...p, h: v }))} hideStepper={!showCircle} />
                <ColorSlider label="S" value={hsb.s} max={100} gradient={saturationGradient(hsb.h, hsb.b, 'srgb')} onChange={(v) => setHsbClear(p => ({ ...p, s: v }))} hideStepper={!showCircle} />
                <ColorSlider label="B" value={hsb.b} max={100} gradient={brightnessGradient(hsb.h, hsb.s, 'srgb')} onChange={(v) => setHsbClear(p => ({ ...p, b: v }))} hideStepper={!showCircle} />
              </div>
            </div>
          {has('hex-input') && (
            <div className="border border-input rounded-lg p-3">
              <h3 className="text-sm font-semibold mb-2">Hex</h3>
              <div className="flex gap-3 items-stretch">
                <PreviewSwatch hex={hex} />
                <div className="flex-1 min-w-0">
                  <HexInput hex={hex} onChange={(parsed) => setHsbClear(rgbToHsb(parsed.r, parsed.g, parsed.b))} />
                </div>
              </div>
            </div>
          )}
          {/* Equations panel is now in the left column above the swatch */}
          {has('conversions') && (
            <div className="col-span-2">
              <ColorOperations hsb={hsb} onAnimateToHsb={animateToHsb} />
            </div>
          )}
        </div>
        {/* Animate Colors checkbox removed — animation auto-starts */}
        {slide.props?.showSineWave && (
          <div className="mt-3 flex flex-col gap-2">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={sineActive}
                onChange={(e) => setSineActive(e.target.checked)}
                className="w-4 h-4 rounded accent-current cursor-pointer"
              />
              <span className="text-sm text-muted-foreground">Animate HSB</span>
            </label>
            {/* Period sliders — hidden for now
            <div className="grid grid-cols-3 gap-4">
              {[
                { key: 'h', label: 'H', color: 'hsl(0,70%,60%)' },
                { key: 's', label: 'S', color: 'hsl(120,70%,60%)' },
                { key: 'b', label: 'B', color: 'hsl(240,70%,60%)' },
              ].map(({ key, label, color }) => (
                <div key={key} className="flex flex-col gap-1">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span className="font-semibold" style={{ color }}>{label}</span>
                    <span className="tabular-nums">{(sinePeriods[key] / 1000).toFixed(1)}s</span>
                  </div>
                  <input
                    type="range"
                    min={500}
                    max={15000}
                    step={100}
                    value={sinePeriods[key]}
                    onChange={(e) => setSinePeriods(p => ({ ...p, [key]: Number(e.target.value) }))}
                    className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
                    style={{ accentColor: color }}
                  />
                </div>
              ))}
            </div>
            */}
          </div>
        )}
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
const H_STYLE = {
  backgroundImage: 'conic-gradient(from 0deg at 50% 50%, hsl(0,100%,50%), hsl(60,100%,50%), hsl(120,100%,50%), hsl(180,100%,50%), hsl(240,100%,50%), hsl(300,100%,50%), hsl(360,100%,50%))',
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

const LETTER_DATA = [
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
const ACRO_LETTER_X = { rgb: 60, hsb: 423 };
// Letter x-offsets within the 80px-wide frame (centered per letter width)
const ACRO_LETTER_XOFF = {
  r: 10, g: 5, b1: 10,
  h: 7, s: 12, b2: 10,
};
const ACRO_LETTER_Y = 40; // top of letter frame
const ROW_STEP = 87; // y distance between letter rows

// Acronyms label positions
const ACRO_LABEL_X = { rgb: 160, hsb: 523 };
const ACRO_LABEL_Y = 65; // top of label frame

// Intro label positions (hidden, with x-offsets for slide-in animation)
const INTRO_LABEL_XOFF = {
  rgb: [0, 50, 120],   // Red, Green, Blue x-offsets within frame
  hsb: [0, 50, 100],   // Hue, Saturation, Brightness x-offsets within frame
};

const INTRO_Y = 111; // top of letters in intro (125 - 14 line-height compensation)
const LETTER_H = 67; // rendered cap-height
const ACRO_Y_OFFSET = -14; // compensation for lineHeight:1 vs cap-height trim

function IntroPanel({ mode, exiting = false }) {
  const exp = mode === 'acronyms';

  // When exiting, hold positions in place (BW cells will expand over them)
  function getLetterPos(l) {
    if (exiting || exp) {
      return {
        x: ACRO_LETTER_X[l.group] + (ACRO_LETTER_XOFF[l.id] || 0),
        y: ACRO_LETTER_Y + ACRO_Y_OFFSET + l.row * ROW_STEP,
      };
    }
    return { x: l.introX + l.introXOff, y: INTRO_Y };
  }

  function getLabelPos(l) {
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
