import { useState, useEffect, useCallback } from 'react';

const LEGACY_PREFIX = '#/presentation';
const ROUTE_PREFIX = '#/intro';

/**
 * `#/presentation` still resolves, silently, as `#/intro`.
 *
 * The route was renamed to match what the deck is called everywhere a reader
 * meets it - the /intro link, the button. Nothing public ever linked the old
 * one, since the route was gated off in production, but the dev channel has
 * been deploying with it live and bookmarks are cheap to honour.
 *
 * Rewritten with replaceState rather than by assigning to location.hash: the
 * latter pushes a history entry, so Back would land on the old URL and bounce
 * straight forward again.
 */
function canonical(hash: string): string {
  if (hash.startsWith(LEGACY_PREFIX)) return ROUTE_PREFIX + hash.slice(LEGACY_PREFIX.length);
  return hash || '#/';
}

/**
 * The intro route is always reachable, including in builds where it is not
 * advertised.
 *
 * It used to be gated on VITE_INTRO_ENABLED alongside the button, so turning the
 * button off made the deck unreachable rather than merely unlinked - and there
 * was no way to hand someone the link. Those are two different questions, and
 * only the button is a question of readiness. The flag now answers just that
 * one; `public/intro/index.html` is the shareable front door.
 */
export function useHashRoute() {
  const [route, setRoute] = useState(() => canonical(window.location.hash));

  useEffect(() => {
    const sync = () => {
      const next = canonical(window.location.hash);
      if (next !== window.location.hash && window.location.hash) {
        window.history.replaceState(null, '', next);
      }
      setRoute(next);
    };
    sync();
    window.addEventListener('hashchange', sync);
    return () => window.removeEventListener('hashchange', sync);
  }, []);

  const navigate = useCallback((hash: string) => {
    window.location.hash = canonical(hash);
  }, []);

  return { route, navigate };
}
