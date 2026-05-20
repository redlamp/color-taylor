import { useState, useEffect, useCallback } from 'react';

const INTRO_ENABLED = import.meta.env.VITE_INTRO_ENABLED === 'true';

function gate(hash: string): string {
  // Redirect presentation route to picker when the section is flagged off.
  if (!INTRO_ENABLED && hash.startsWith('#/presentation')) return '#/';
  return hash;
}

export function useHashRoute() {
  const [route, setRoute] = useState(() => gate(window.location.hash || '#/'));

  useEffect(() => {
    const onHashChange = () => setRoute(gate(window.location.hash || '#/'));
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const navigate = useCallback((hash: string) => {
    window.location.hash = gate(hash);
  }, []);

  return { route, navigate };
}
