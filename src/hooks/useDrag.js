import { useRef, useEffect, useCallback } from 'react';

/**
 * Shared drag hook. Returns { dragging, startDrag } where:
 * - dragging: ref boolean (true while dragging)
 * - startDrag(): call on pointerdown to begin
 *
 * @param {function} onDrag - called with PointerEvent on each pointermove while dragging
 */
export default function useDrag(onDrag) {
  const dragging = useRef(false);

  const startDrag = useCallback(() => {
    dragging.current = true;
  }, []);

  useEffect(() => {
    const onPointerMove = (e) => {
      if (dragging.current) onDrag(e);
    };
    const onPointerUp = () => {
      dragging.current = false;
    };
    const onPointerLeave = () => {
      dragging.current = false;
    };
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    document.documentElement.addEventListener('pointerleave', onPointerLeave);
    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      document.documentElement.removeEventListener('pointerleave', onPointerLeave);
    };
  }, [onDrag]);

  return { dragging, startDrag };
}
