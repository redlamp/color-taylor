import { useState, useEffect, useCallback, useRef } from 'react';
import { slides } from './slides';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { useTheme } from '../hooks/useTheme';
import PresentationStage from './PresentationStage';

// Animated number counter — tweens from previous value to target
function useAnimatedNumber(target, duration = 800) {
  const [display, setDisplay] = useState(target);
  const prevTarget = useRef(target);
  const rafRef = useRef(null);

  useEffect(() => {
    const from = prevTarget.current;
    prevTarget.current = target;
    if (from === target) return;

    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    const start = performance.now();
    const tick = (ts) => {
      const t = Math.min((ts - start) / duration, 1);
      const eased = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
      setDisplay(Math.round(from + (target - from) * eased));
      if (t < 1) rafRef.current = requestAnimationFrame(tick);
      else rafRef.current = null;
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [target, duration]);

  return display;
}

export default function PresentationShell({ navigate }) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const slide = slides[currentSlide];
  const total = slides.length;

  const goTo = useCallback((idx) => {
    const clamped = Math.max(0, Math.min(total - 1, idx));
    setCurrentSlide(clamped);
  }, [total]);

  const prev = useCallback(() => goTo(currentSlide - 1), [currentSlide, goTo]);
  const next = useCallback(() => goTo(currentSlide + 1), [currentSlide, goTo]);

  // Keyboard navigation
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault();
        next();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        prev();
      } else if (e.key === 'Escape') {
        navigate('#/');
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [next, prev, navigate]);

  // Sync hash with slide index
  useEffect(() => {
    const hash = `#/presentation/${currentSlide}`;
    if (window.location.hash !== hash) {
      window.history.replaceState(null, '', hash);
    }
  }, [currentSlide]);

  // ── Last slide: fade background + chrome, then transition to app ──
  const isLastSlide = currentSlide === total - 1;
  const [chromeFading, setChromeFading] = useState(false);

  // Restore theme + fade background on last slide
  const { restore } = useTheme();
  useEffect(() => {
    if (isLastSlide) {
      restore(); // switch back to user's theme (triggers dark→light if needed)
      document.body.style.setProperty('--pres-bg-override', 'var(--background)');
    } else {
      document.body.style.removeProperty('--pres-bg-override');
    }
    return () => document.body.style.removeProperty('--pres-bg-override');
  }, [isLastSlide]);

  useEffect(() => {
    if (!isLastSlide) { setChromeFading(false); return; }
    // Caption stays visible longer on last slide
    const tid = setTimeout(() => setChromeFading(true), 6000);
    return () => clearTimeout(tid);
  }, [isLastSlide]);

  useEffect(() => {
    if (!chromeFading) return;
    const tid = setTimeout(() => navigate('#/'), 1500);
    return () => clearTimeout(tid);
  }, [chromeFading, navigate]);

  // Top bar and nav fade immediately on last slide, caption fades with chromeFading
  const topBarOpacity = isLastSlide ? 0 : 1;
  const captionOpacity = chromeFading ? 0 : 1;
  const chromeTransition = 'opacity 1s ease-in-out';

  return (
    <div className="fixed inset-0 flex flex-col select-none" style={{ overflow: 'hidden' }}>
      {/* Top bar — collapses on last slide so it doesn't take layout space */}
      <div className="flex items-center justify-between px-6 border-b border-border/40 shrink-0 z-10"
        style={{
          opacity: topBarOpacity,
          height: isLastSlide ? 0 : 'auto',
          padding: isLastSlide ? '0 24px' : '12px 24px',
          borderColor: isLastSlide ? 'transparent' : undefined,
          overflow: 'hidden',
          transition: `${chromeTransition}, height 0.5s ease-out, padding 0.5s ease-out`,
        }}>
        <h1 className="text-sm font-semibold tracking-wide">Color Taylor 🧵</h1>
        <span className="text-xs text-muted-foreground tabular-nums">
          {currentSlide + 1} / {total}
        </span>
        <button
          className="text-xs text-muted-foreground hover:text-foreground cursor-pointer"
          onClick={() => navigate('#/')}
        >
          Exit
        </button>
      </div>

      {/* Slide title — absolute so it doesn't shift the display area */}
      <div className="absolute left-0 right-0 pointer-events-none z-10" style={{ top: 52, opacity: topBarOpacity, transition: chromeTransition }}>
        <SlideTitle slide={slide} />
      </div>

      {/* Main content — fills space below top bar, centered */}
      <div className={`flex-1 flex items-center justify-center px-6 relative ${isLastSlide ? 'overflow-hidden' : 'overflow-auto'}`}>
        <PresentationStage slide={slide} slideIndex={currentSlide} />
      </div>

      {/* Caption — absolute overlay, doesn't affect content centering */}
      {slide.caption && (
        <div className="absolute bottom-16 left-0 right-0 pointer-events-none z-10"
          style={{ opacity: captionOpacity, transition: chromeTransition }}>
          <p className="text-lg text-muted-foreground max-w-5xl mx-auto text-center leading-relaxed px-6 whitespace-pre-line">
            {slide.caption.split(/(_[^_]+_)/).map((part, i) =>
              part.startsWith('_') && part.endsWith('_')
                ? <em key={i}>{part.slice(1, -1)}</em>
                : part
            )}
          </p>
        </div>
      )}

      {/* Bottom nav bar — collapses on last slide */}
      <div className="border-t border-border/40 px-6 shrink-0 z-10"
        style={{
          opacity: topBarOpacity,
          height: isLastSlide ? 0 : 'auto',
          padding: isLastSlide ? '0 24px' : '12px 24px',
          borderColor: isLastSlide ? 'transparent' : undefined,
          overflow: 'hidden',
          transition: `${chromeTransition}, height 0.5s ease-out, padding 0.5s ease-out`,
        }}>
        <div className="flex items-center justify-center gap-4">
          <button
            className="px-4 py-1.5 text-sm rounded-md bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
            disabled={currentSlide === 0}
            onClick={prev}
          >
            Previous
          </button>
          <div className="flex items-center gap-1">
            {slides.map((s, i) => (
              <Tooltip key={i}>
                <TooltipTrigger asChild>
                  <button
                    className={`w-2 h-2 rounded-full cursor-pointer transition-colors ${
                      i === currentSlide ? 'bg-foreground' : 'bg-muted-foreground/30 hover:bg-muted-foreground/60'
                    }`}
                    onClick={() => goTo(i)}
                    aria-label={`Go to slide ${i + 1}`}
                  />
                </TooltipTrigger>
                <TooltipContent side="top" sideOffset={8} className="text-xs">
                  Slide {i + 1}{s.title ? `: ${s.title}` : ''}
                </TooltipContent>
              </Tooltip>
            ))}
          </div>
          <button
            className="px-4 py-1.5 text-sm rounded-md bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
            disabled={currentSlide === total - 1}
            onClick={next}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}

function SlideTitle({ slide }) {
  const meta = slide.titleMeta;
  const animatedBits = useAnimatedNumber(meta?.bits || 0, 400);
  const animatedYear = useAnimatedNumber(meta?.year || 0, 600);
  const animatedCount = useAnimatedNumber(meta?.colorCount || 0, 800);

  if (!meta) {
    if (!slide.title) return null;
    return (
      <div className="px-6 pt-4 pb-2 shrink-0 z-10">
        <h1 className="text-2xl font-bold">{slide.title}</h1>
        {slide.subtitle && (
          <h2 className="text-lg text-muted-foreground">{slide.subtitle}</h2>
        )}
      </div>
    );
  }

  return (
    <div className="px-6 pt-4 pb-2 shrink-0 z-10">
      <h1 className="text-2xl font-bold">{slide.title}</h1>
      <h2 className="text-lg font-semibold tabular-nums">
        {animatedBits}-bit, {animatedCount.toLocaleString()} colors
      </h2>
      <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
        {meta.os} ({animatedYear})
      </h3>
    </div>
  );
}
