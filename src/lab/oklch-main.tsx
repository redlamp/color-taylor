/**
 * Entry for lab/oklch.html - a third lab page beside lab/cube.html and
 * lab/spectrum.html, so the Oklch bank can use the app's components without
 * touching the app's router or bundle. Dev serves it at /lab/oklch.html with
 * no config; it is deliberately absent from the production build.
 */
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '../index.css';
import { ThemeProvider } from '../hooks/useTheme';
import OklchLab from './OklchLab';

const root = document.getElementById('root');
if (!root) throw new Error('Root element not found');

createRoot(root).render(
  <StrictMode>
    <ThemeProvider>
      <OklchLab />
    </ThemeProvider>
  </StrictMode>,
);
