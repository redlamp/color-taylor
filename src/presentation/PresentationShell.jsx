import { useState, useEffect, useCallback } from 'react';
import { slides } from './slides';
import { slideComponents } from './slideComponents.jsx';

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

  const SlideComponent = slideComponents[slide.component];

  return (
    <div className="fixed inset-0 bg-background flex flex-col select-none">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-border/40">
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
      <div className="px-6 pt-4 pb-2">
        <h2 className="text-2xl font-bold">{slide.title}</h2>
      </div>

      {/* Main content */}
      <div className="flex-1 flex items-center justify-center px-6 overflow-auto">
        {SlideComponent ? (
          <SlideComponent {...(slide.props || {})} />
        ) : (
          <p className="text-muted-foreground">Unknown component: {slide.component}</p>
        )}
      </div>

      {/* Bottom bar: caption + nav */}
      <div className="border-t border-border/40 px-6 py-4">
        {slide.caption && (
          <p className="text-sm text-muted-foreground mb-3 max-w-2xl mx-auto text-center leading-relaxed">
            {slide.caption}
          </p>
        )}
        <div className="flex items-center justify-center gap-4">
          <button
            className="px-4 py-1.5 text-sm rounded-md bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
            disabled={currentSlide === 0}
            onClick={prev}
          >
            Previous
          </button>
          {/* Dot indicators */}
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
