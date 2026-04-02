import { useState, useEffect, useCallback, useRef } from 'react';
import { slides } from './slides';
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

  return (
    <div className="fixed inset-0 flex flex-col select-none">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-border/40 shrink-0 z-10">
        <h1 className="text-sm font-semibold tracking-wide">Color Taylor</h1>
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

      {/* Slide title */}
      <SlideTitle slide={slide} />

      {/* Main content — persistent stage handles all slide types */}
      <div className="flex-1 flex items-center justify-center px-6 overflow-auto relative">
        <PresentationStage slide={slide} slideIndex={currentSlide} />
      </div>

      {/* Caption — absolute overlay, doesn't affect content centering */}
      {slide.caption && (
        <div className="absolute bottom-16 left-0 right-0 pointer-events-none z-10">
          <p className="text-sm text-muted-foreground max-w-2xl mx-auto text-center leading-relaxed px-6">
            {slide.caption}
          </p>
        </div>
      )}

      {/* Bottom nav bar */}
      <div className="border-t border-border/40 px-6 py-3 shrink-0 z-10">
        <div className="flex items-center justify-center gap-4">
          <button
            className="px-4 py-1.5 text-sm rounded-md bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
            disabled={currentSlide === 0}
            onClick={prev}
          >
            Previous
          </button>
          <div className="flex items-center gap-1">
            {slides.map((_, i) => (
              <button
                key={i}
                className={`w-2 h-2 rounded-full cursor-pointer transition-colors ${
                  i === currentSlide ? 'bg-foreground' : 'bg-muted-foreground/30 hover:bg-muted-foreground/60'
                }`}
                onClick={() => goTo(i)}
                aria-label={`Go to slide ${i + 1}`}
              />
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
  const animatedYear = useAnimatedNumber(meta?.year || 0, 600);
  const animatedCount = useAnimatedNumber(meta?.colorCount || 0, 800);

  if (!meta) {
    return (
      <div className="px-6 pt-4 pb-2 shrink-0 z-10">
        <h1 className="text-2xl font-bold">{slide.title}</h1>
      </div>
    );
  }

  return (
    <div className="px-6 pt-4 pb-2 shrink-0 z-10">
      <h1 className="text-2xl font-bold">
        {slide.title}
        <span className="text-lg font-normal text-muted-foreground ml-2">
          ({animatedCount.toLocaleString()} colors)
        </span>
      </h1>
      <h2 className="text-lg font-semibold tabular-nums">{animatedYear}</h2>
      <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">{meta.os}</h3>
    </div>
  );
}
