import { useRef, useEffect, useCallback } from 'react';

/**
 * Shared drag hook. Returns { dragging, startDrag } where:
 * - dragging: ref boolean (true while dragging)
 * - startDrag(): call on pointerdown to begin
 *
 * @param {function} onDrag - called with PointerEvent on each pointermove while dragging
 */
export default function useDrag(onDrag: (e: PointerEvent) => void) {
  const dragging = useRef(false);

  const startDrag = useCallback(() => {
    dragging.current = true;
  }, []);

  useEffect(() => {
    const onPointerMove = (e: PointerEvent) => {
      if (dragging.current) onDrag(e);
    };
    const onPointerUp = () => {
      dragging.current = false;
    };
    /*
     * Every way a press can end without a pointerup. `pointercancel` fires when
     * the browser takes the pointer away - a touch that becomes a scroll, a
     * stylus leaving range, the OS claiming the gesture - and `blur` covers the
     * drag still held when the window goes away, where the release lands in
     * another application and never reaches us. Without both, the press stays
     * latched and the handle keeps following the cursor with no button down.
     */
    const abandon = () => {
      dragging.current = false;
    };
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', abandon);
    window.addEventListener('blur', abandon);
    document.documentElement.addEventListener('pointerleave', abandon);
    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', abandon);
      window.removeEventListener('blur', abandon);
      document.documentElement.removeEventListener('pointerleave', abandon);
    };
  }, [onDrag]);

  return { dragging, startDrag };
}
