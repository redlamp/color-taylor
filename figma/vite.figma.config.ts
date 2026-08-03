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
      // Plugin-only swaps for things the panel does not need. Each is a
      // like-for-like module with the same exports, so nothing in src/ changes
      // and the app is entirely unaffected.
      //
      // Order matters, and these must come first: Vite walks the list in
      // order, and the bare '@' find below matches any '@/...' importee - it
      // would rewrite these to a resolved path before the specific rules ever
      // saw them, which silently costs ~140 KB.

      // Base UI's Tooltip is the single most expensive thing in the panel:
      // 66 KB once its positioning engine, collision detection, safe-polygon
      // hover paths and dismissal handling are counted, to label six letters
      // and a few icon buttons that already carry aria-label.
      { find: /^@\/components\/ui\/tooltip$/, replacement: path.resolve(__dirname, 'ui/lite/tooltip.tsx') },

      // Tabs and ToggleGroup bring a composite roving-focus machine for what
      // are, here, two segmented controls of three buttons each. Button and
      // Input are the last Base UI importers, so swapping them drops the
      // package entirely rather than most of it.
      { find: /^@\/components\/ui\/tabs$/, replacement: path.resolve(__dirname, 'ui/lite/tabs.tsx') },
      { find: /^@\/components\/ui\/toggle-group$/, replacement: path.resolve(__dirname, 'ui/lite/toggle-group.tsx') },
      { find: /^@\/components\/ui\/button$/, replacement: path.resolve(__dirname, 'ui/lite/button.tsx') },
      { find: /^@\/components\/ui\/input$/, replacement: path.resolve(__dirname, 'ui/lite/input.tsx') },

      // tailwind-merge is 26 KB of runtime class-conflict resolution.
      { find: /^@\/lib\/utils$/, replacement: path.resolve(__dirname, 'ui/lite/cn.ts') },

      // Dead in the panel: the colour-name table is only read through
      // showHtmlOnHex, and the brightness bar only renders when blBar is on.
      // Both are runtime props, so the bundler cannot drop them on its own.
      { find: /^.*utils\/namedColors$/, replacement: path.resolve(__dirname, 'ui/lite/named-colors.ts') },
      { find: /^.*hex\/Brightness(Bar|Handle|Markers)$/, replacement: path.resolve(__dirname, 'ui/lite/no-brightness.tsx') },

      // Interface sounds are a layer on top of the picker, not part of it.
      // A Figma panel chiming on save is out of place, and the real hook pulls
      // an AudioContext and four oscillator graphs in behind it.
      { find: /^.*hooks\/useUiSounds$/, replacement: path.resolve(__dirname, 'ui/lite/ui-sounds.ts') },

      // The tone synth is ~17 KB of oscillator graph for a hold-tone, and with
      // codeSplitting off its dynamic import is inlined rather than deferred -
      // so it ships whether or not it is ever used.
      { find: /^.*utils\/toneControllerLazy$/, replacement: path.resolve(__dirname, 'ui/silent-tone.ts') },

      // The app's index.css pulls in five @fontsource faces. Inlining ~700 KB
      // of woff2 into the panel to gain Barlow is a bad trade; drop them and
      // let the theme's font stack fall through to the system UI/mono faces.
      { find: /^@fontsource\/.*/, replacement: path.resolve(__dirname, 'ui/empty.css') },

      { find: '@', replacement: path.resolve(__dirname, '../src') },
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
