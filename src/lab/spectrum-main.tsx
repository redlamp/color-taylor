/**
 * Entry for lab/spectrum.html - a second lab page beside lab/cube.html, so the
 * bench can use the app's components without touching the app's router or
 * bundle. Dev serves it at /lab/spectrum.html with no config; it is
 * deliberately absent from the production build.
 */
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '../index.css';
import { ThemeProvider } from '../hooks/useTheme';
import SpectrumBench from './SpectrumBench';

const root = document.getElementById('root');
if (!root) throw new Error('Root element not found');

createRoot(root).render(
  <StrictMode>
    <ThemeProvider>
      <SpectrumBench />
    </ThemeProvider>
  </StrictMode>,
);
