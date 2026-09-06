/**
 * Bundle a lab page into one self-contained HTML file, for sharing as an
 * artifact or opening from disk.
 *
 *   node scripts/build-cube-bench.mjs            → dist-lab/cube-bench.html
 *   node scripts/build-cube-bench.mjs spectrum   → dist-lab/spectrum-bench.html
 *
 * The argument names the page in lab/. Each page builds in its own folder
 * under dist-lab, so building one leaves the other's file where it was.
 *
 * The lab page is a second Vite entry that is deliberately not part of the
 * production build, so this drives Vite's JS API with its own build options:
 * one chunk, no code splitting, every asset (the @fontsource woff2 files
 * included) inlined as a data URI. The result is then flattened into the
 * fragment an artifact wants - title, style, body, script - with no html or
 * head of its own.
 */
import { build } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { readFileSync, writeFileSync, rmSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

const name = process.argv[2] ?? 'cube';
const root = resolve(import.meta.dirname, '..');
const outDir = resolve(root, 'dist-lab');
const buildDir = resolve(outDir, name);
rmSync(buildDir, { recursive: true, force: true });

// Not vite.config.js: that file reads __dirname, which only exists when Vite
// bundles the config itself. The two things the lab needs from it are here.
await build({
  configFile: false,
  root,
  base: './',
  logLevel: 'warn',
  plugins: [react(), tailwindcss()],
  resolve: { alias: { '@': resolve(root, 'src') } },
  build: {
    outDir: buildDir,
    emptyOutDir: true,
    assetsInlineLimit: 100_000_000,
    cssCodeSplit: false,
    rolldownOptions: {
      input: resolve(root, `lab/${name}.html`),
      output: { codeSplitting: false },
    },
  },
});

let html = readFileSync(resolve(buildDir, `lab/${name}.html`), 'utf8');
const asset = (href) => readFileSync(resolve(buildDir, 'lab', href), 'utf8');

// The theme bootstrap, read before anything is inlined. react-dom's code has
// a literal `<script><\/script>` in it, so a scan for plain scripts over the
// inlined page ran from there to the module's real closing tag and carried
// the tail of the module - and every asset inlined in it - a second time.
const bootstrap = (html.match(/<script>[\s\S]*?<\/script>/g) ?? []).join('\n');

html = html
  .replace(/<link rel="modulepreload"[^>]*>\s*/g, '')
  .replace(/<link rel="stylesheet"[^>]*href="([^"]+)"[^>]*>/g, (_, href) => `<style>${asset(href)}</style>`)
  .replace(/<script type="module"[^>]*src="([^"]+)"[^>]*><\/script>/g, (_, src) =>
    `<script type="module">${asset(src).replace(/<\/script/g, '<\\/script')}</script>`);

// Flatten to the fragment an artifact wants: keep title, the theme bootstrap,
// styles and body; drop the document shell.
const head = html.match(/<head>([\s\S]*)<\/head>/)[1];
const body = html.match(/<body>([\s\S]*)<\/body>/)[1];
const keep = (re) => (head.match(re) ?? []).join('\n');
const fragment = [
  keep(/<title>[\s\S]*?<\/title>/g),
  bootstrap,
  keep(/<style>[\s\S]*?<\/style>/g),
  keep(/<script type="module">[\s\S]*?<\/script>/g),
  body.trim(),
].filter(Boolean).join('\n');

mkdirSync(outDir, { recursive: true });
const out = resolve(outDir, `${name}-bench.html`);
writeFileSync(out, fragment);
console.log(`${out}  ${(fragment.length / 1024).toFixed(0)} KB`);
