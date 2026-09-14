import { useRef, useCallback, useEffect, type PointerEvent as ReactPointerEvent } from 'react';
import useDrag from '../hooks/useDrag';
import { hsbToRgb, rgbToHex } from '../utils/colorConversions';

interface SBBoxProps {
  hue: number;
  saturation: number;
  brightness: number;
  onChange: (s: number, b: number) => void;
  /** Which label the vertical axis wears - the header's HSB/HSL toggle, same as the hexagon's bl bar. Defaults to 'brightness' for the lab benches, which have no toggle. */
  blMode?: 'brightness' | 'lightness';
}

/**
 * Axis-title treatment, copied from HexBar.tsx's TITLE_CLASS rather than
 * imported: hex/* is off limits here (see CLAUDE.md), and HexBar does not
 * export it. text-sm, not this project's default text-base, because it is
 * matching that existing furniture size exactly, per instruction - not a new
 * size choice.
 */
const AXIS_LABEL_CLASS = 'absolute select-none whitespace-nowrap px-1 text-sm leading-none pointer-events-none transition-opacity duration-150 ease-out text-white';

/** Softens the label against the gradient without reading as a chip. */
const AXIS_LABEL_SHOWN_OPACITY = 0.8;

/** How close the pointer has to get to a label - or be over it - to fade it out. */
const AXIS_LABEL_HIDE_RADIUS = 24;

/** Squared distance from a point to a rect, 0 if the point is inside it. Avoids a sqrt per label per move. */
function distSqToRect(x: number, y: number, r: DOMRect): number {
  const dx = Math.max(r.left - x, 0, x - r.right);
  const dy = Math.max(r.top - y, 0, y - r.bottom);
  return dx * dx + dy * dy;
}

export default function SBBox({ hue, saturation, brightness, onChange, blMode = 'brightness' }: SBBoxProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const satLabelRef = useRef<HTMLDivElement | null>(null);
  const blLabelRef = useRef<HTMLDivElement | null>(null);
  // A ref, not state: this is read and written on every pointermove, and a
  // dragging box already repaints the field's own gradients/cursor every
  // frame - routing the labels' opacity through React state on top of that
  // would mean a render per move for furniture that never affects layout.
  const draggingRef = useRef(false);

  const update = useCallback((clientX: number, clientY: number) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    const y = Math.max(0, Math.min(clientY - rect.top, rect.height));
    const s = Math.round((x / rect.width) * 100);
    const b = Math.round((1 - y / rect.height) * 100);
    onChange(s, b);
  }, [onChange]);

  const { startDrag } = useDrag(useCallback((e: PointerEvent | ReactPointerEvent) => {
    update(e.clientX, e.clientY);
  }, [update]));

  /**
   * Fade whichever label the pointer has gotten close to, and only that one -
   * the two are on opposite bounds, so a corner reading zero on both is rare
   * and each should still answer to its own approach independently.
   *
   * Written straight to style.opacity rather than through a class toggle so
   * this stays a style mutation, not a render.
   */
  const updateLabelProximity = useCallback((clientX: number, clientY: number) => {
    const r2 = AXIS_LABEL_HIDE_RADIUS * AXIS_LABEL_HIDE_RADIUS;
    for (const labelRef of [satLabelRef, blLabelRef]) {
      const el = labelRef.current;
      if (!el) continue;
      const near = distSqToRect(clientX, clientY, el.getBoundingClientRect()) <= r2;
      el.style.opacity = near ? '0' : String(AXIS_LABEL_SHOWN_OPACITY);
    }
  }, []);

  const showLabels = useCallback(() => {
    if (satLabelRef.current) satLabelRef.current.style.opacity = String(AXIS_LABEL_SHOWN_OPACITY);
    if (blLabelRef.current) blLabelRef.current.style.opacity = String(AXIS_LABEL_SHOWN_OPACITY);
  }, []);

  const hideLabels = useCallback(() => {
    if (satLabelRef.current) satLabelRef.current.style.opacity = '0';
    if (blLabelRef.current) blLabelRef.current.style.opacity = '0';
  }, []);

  /*
   * useDrag's own pointerup listener lives on window (see hooks/useDrag.ts -
   * the drag moves and ends there, not on this element), so this window
   * listener is what the labels need too: a release dispatched at window,
   * the way the presentation's ghost cursor ends its drags (drive.ts
   * releaseNow), reaches this the same way a real mouse's does, and neither
   * reaches a plain onPointerUp prop on the box.
   */
  useEffect(() => {
    const onWindowPointerUp = () => {
      if (!draggingRef.current) return;
      draggingRef.current = false;
      showLabels();
    };
    window.addEventListener('pointerup', onWindowPointerUp);
    return () => window.removeEventListener('pointerup', onWindowPointerUp);
  }, [showLabels]);

  const hueColor = `hsl(${hue}, 100%, 50%)`;
  // The handle is filled with the colour it is standing on, so it reads as the
  // selection rather than as a hole punched in the gradient - and stays
  // legible where it hangs over the edge, off the field that would have
  // explained it.
  const selected = (() => {
    const { r, g, b } = hsbToRgb(hue, saturation, brightness);
    return rgbToHex(r, g, b);
  })();

  return (
    <div
      id="sb-area"
      role="slider"
      aria-label="Saturation and brightness"
      aria-valuetext={`Saturation ${saturation}%, Brightness ${brightness}%`}
      tabIndex={0}
      // No aspect ratio. Height comes from the row, which the Color Editor
      // section sizes so the sliders column can meet the hexagon's height - with
      // an aspect ratio here the box set its own height from its width and the
      // section could not flex at all. Safe to drop because the pointer maths
      // reads rect.width and rect.height at the time of the event, so saturation
      // and brightness stay correct at any shape.
      // No overflow clip: at the edges of the box the handle is the thing
      // being positioned, and half a ring reads as a rendering fault rather
      // than as "fully saturated". It is absolutely positioned, so hanging
      // over the edge costs no layout - the box does not grow to hold it.
      // The two gradients below are inset-0 and cannot spill in any case.
      className="relative flex-1 min-w-0 cursor-crosshair select-none touch-none"
      ref={ref}
      style={{ backgroundColor: hueColor }}
      onPointerDown={(e) => {
        startDrag();
        draggingRef.current = true;
        hideLabels();
        update(e.clientX, e.clientY);
      }}
      onPointerMove={(e) => {
        if (draggingRef.current) return;
        updateLabelProximity(e.clientX, e.clientY);
      }}
      onPointerLeave={() => {
        // Not during a drag: the drag keeps going past the box's own edge
        // (useDrag tracks it on window), and the labels should stay hidden
        // until the window pointerup above, not pop back the moment the
        // pointer wanders off the field mid-drag.
        if (draggingRef.current) return;
        showLabels();
      }}
      onKeyDown={(e) => {
        const step = e.shiftKey ? 5 : 1;
        let s = saturation;
        let b = brightness;
        switch (e.key) {
          case 'ArrowRight': s = Math.min(100, s + step); break;
          case 'ArrowLeft':  s = Math.max(0, s - step);   break;
          case 'ArrowUp':    b = Math.min(100, b + step);  break;
          case 'ArrowDown':  b = Math.max(0, b - step);    break;
          default: return;
        }
        e.preventDefault();
        onChange(s, b);
      }}
    >
      <div id="sb-white-gradient" className="absolute inset-0 bg-gradient-to-r from-white to-transparent" />
      <div id="sb-black-gradient" className="absolute inset-0 bg-gradient-to-t from-black to-transparent" />
      <div
        id="sb-cursor"
        className="absolute w-4 h-4 border-2 border-white rounded-full pointer-events-none"
        style={{
          left: `${saturation}%`,
          top: `${100 - brightness}%`,
          transform: 'translate(-50%, -50%)',
          backgroundColor: selected,
          boxShadow: '0 0 0 1px rgba(0,0,0,0.3), inset 0 0 0 1px rgba(0,0,0,0.3)',
        }}
      />
      {/*
        Centred along the top bound, left to right: saturation runs 0 at the
        left edge to 100 at the right, so the word reads the same direction
        as the axis it names, and sits mid-axis rather than at either end. text-shadow rather than this project's usual token
        because the ground underneath is the field itself, not a card
        surface - the corner it starts from is white, so a plain foreground
        color would vanish without one.
      */}
      <div
        id="sb-sat-title"
        ref={satLabelRef}
        className={AXIS_LABEL_CLASS}
        style={{ bottom: 4, right: 4, opacity: AXIS_LABEL_SHOWN_OPACITY, textShadow: '0 0 3px rgb(0 0 0 / .7)' }}
      >
        Saturation
      </div>
      {/*
        Centred along the left bound, bottom to top: brightness (or, in HSL
        mode, lightness) runs 0 at the bottom to 100 at the top. Same
        construction as HexBar's vertical bl-title - vertical-rl flows
        top-to-bottom, and the 180 turns that into bottom-to-top. Centring
        on the edge also keeps the two labels' hide zones apart, so nearing
        one never reads as nearing both.
      */}
      <div
        id="sb-bl-title"
        ref={blLabelRef}
        className={`${AXIS_LABEL_CLASS} rotate-180 [writing-mode:vertical-rl]`}
        style={{ bottom: 4, left: 4, opacity: AXIS_LABEL_SHOWN_OPACITY, textShadow: '0 0 3px rgb(0 0 0 / .7)' }}
      >
        {blMode === 'lightness' ? 'Lightness' : 'Brightness'}
      </div>
    </div>
  );
}
