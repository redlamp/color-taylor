import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';
// @ts-expect-error - plain .mjs plugin, no types needed
import inlineSingleFile from './inline.mjs';

/**
 * Builds the plugin UI from the app's own components.
 *
 * Three constraints a Figma plugin UI puts on the bundle:
 *   1. One self-contained file. Relative <script src> does not resolve inside
 *      the plugin iframe, so figma/inline.mjs folds JS and CSS into ui.html
 *      after this build.
 *   2. Classic script, not a module. The iframe has a null origin, where
 *      `type="module"` is unreliable - hence format 'iife' and no code
 *      splitting.
 *   3. No network. Every asset has to be inlined, so assetsInlineLimit is
 *      effectively unbounded.
 */
export default defineConfig({
  root: path.resolve(__dirname, 'ui'),
  base: './',
  plugins: [
    react(),
    tailwindcss(),
    inlineSingleFile({
      dist: path.resolve(__dirname, 'dist'),
      out: path.resolve(__dirname, 'ui.html'),
    }),
  ],
  resolve: {
    alias: [
      { find: '@', replacement: path.resolve(__dirname, '../src') },
      // The app's index.css pulls in five @fontsource faces. Inlining ~700 KB
      // of woff2 into the panel to gain Barlow is a bad trade; drop them and
      // let the theme's font stack fall through to the system UI/mono faces.
      { find: /^@fontsource\/.*/, replacement: path.resolve(__dirname, 'ui/empty.css') },
    ],
  },
  build: {
    outDir: path.resolve(__dirname, 'dist'),
    emptyOutDir: true,
    cssCodeSplit: false,
    assetsInlineLimit: Number.MAX_SAFE_INTEGER,
    target: 'es2020',
    rolldownOptions: {
      output: {
        format: 'iife',
        inlineDynamicImports: true,
        entryFileNames: 'ui.js',
        assetFileNames: 'ui.[ext]',
      },
    },
  },
});
