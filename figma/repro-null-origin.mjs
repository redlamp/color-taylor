/**
 * Reproduces the Figma plugin iframe's hostile bits outside Figma.
 *
 * The plugin UI runs in a sandboxed, null-origin iframe. The consequence that
 * actually bites: touching `localStorage` there throws SecurityError rather
 * than returning null, and an uncaught throw inside a React effect unmounts the
 * tree - which presents as a blank black panel with no clue as to why.
 *
 * This writes a copy of ui.html with storage rigged to throw, so the condition
 * can be tested in a normal browser.
 *
 *   node figma/repro-null-origin.mjs [outPath]
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const src = join(here, 'ui.html');
const out = resolve(process.argv[2] ?? join(here, 'ui.null-origin.html'));

const PRELUDE = `<script>
(function () {
  var boom = function () { throw new DOMException('localStorage is not available', 'SecurityError'); };
  var trap = new Proxy({}, { get: boom, set: boom, has: boom, deleteProperty: boom });
  for (var key of ['localStorage', 'sessionStorage']) {
    Object.defineProperty(window, key, { get: boom, configurable: true });
  }
  void trap;
})();
</script>`;

const html = readFileSync(src, 'utf8');
if (!html.includes('<body>')) throw new Error('ui.html has no <body> - was it built?');

writeFileSync(out, html.replace('<body>', '<body>\n' + PRELUDE));
console.log('wrote', out);
