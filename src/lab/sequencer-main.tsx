/**
 * Entry for lab/sequencer.html - a lab page beside lab/spectrum.html, so the
 * bench can use the app's components without touching the app's router or
 * bundle. Dev serves it at /lab/sequencer.html with no config; it is
 * deliberately absent from the production build.
 */
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '../index.css';
import { ThemeProvider } from '../hooks/useTheme';
import SequencerBench from './SequencerBench';

const root = document.getElementById('root');
if (!root) throw new Error('Root element not found');

createRoot(root).render(
  <StrictMode>
    <ThemeProvider>
      <SequencerBench />
    </ThemeProvider>
  </StrictMode>,
);
