import { useRef, useEffect, useCallback } from 'react';

/**
 * Shared drag hook. Returns { dragging, startDrag } where:
 * - dragging: ref boolean (true while dragging)
 * - startDrag(): call on mousedown to begin
 *
 * @param {function} onDrag - called with MouseEvent on each mousemove while dragging
 */
export default function useDrag(onDrag) {
  const dragging = useRef(false);

  const startDrag = useCallback(() => {
    dragging.current = true;
  }, []);

  useEffect(() => {
    const onMouseMove = (e) => {
      if (dragging.current) onDrag(e);
    };
    const onMouseUp = () => {
      dragging.current = false;
    };
    const onMouseLeave = () => {
      dragging.current = false;
    };
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    document.documentElement.addEventListener('mouseleave', onMouseLeave);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      document.documentElement.removeEventListener('mouseleave', onMouseLeave);
    };
  }, [onDrag]);

  return { dragging, startDrag };
}
