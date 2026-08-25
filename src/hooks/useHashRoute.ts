import { useState, useEffect, useCallback } from 'react';

/**
 * The presentation route is always reachable, including in builds where the
 * intro is not advertised.
 *
 * It used to be gated on VITE_INTRO_ENABLED alongside the button, so turning the
 * button off made the deck unreachable rather than merely unlinked - and there
 * was no way to hand someone the link. Those are two different questions, and
 * only the button is a question of readiness. The flag now answers just that
 * one; `public/intro/index.html` is the shareable front door.
 */
export function useHashRoute() {
  const [route, setRoute] = useState(() => window.location.hash || '#/');

  useEffect(() => {
    const onHashChange = () => setRoute(window.location.hash || '#/');
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const navigate = useCallback((hash: string) => {
    window.location.hash = hash;
  }, []);

  return { route, navigate };
}
