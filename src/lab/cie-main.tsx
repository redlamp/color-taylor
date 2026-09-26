/**
 * Entry for lab/cie.html - a fourth Vite page, so the lab can use the app's
 * components without touching the app's router or bundle. Dev serves it at
 * /lab/cie.html with no config; it is deliberately absent from the production
 * build.
 */
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '../index.css';
import { ThemeProvider } from '../hooks/useTheme';
import CieLab from './CieLab';

const root = document.getElementById('root');
if (!root) throw new Error('Root element not found');

createRoot(root).render(
  <StrictMode>
    <ThemeProvider>
      <CieLab />
    </ThemeProvider>
  </StrictMode>,
);
