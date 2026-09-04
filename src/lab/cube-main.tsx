/**
 * Entry for lab/cube.html - a second Vite page, so the bench can use the app's
 * components without touching the app's router or bundle. Dev serves it at
 * /lab/cube.html with no config; it is deliberately absent from the production
 * build.
 */
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '../index.css';
import { ThemeProvider } from '../hooks/useTheme';
import CubeBench from './CubeBench';

const root = document.getElementById('root');
if (!root) throw new Error('Root element not found');

createRoot(root).render(
  <StrictMode>
    <ThemeProvider>
      <CubeBench />
    </ThemeProvider>
  </StrictMode>,
);
