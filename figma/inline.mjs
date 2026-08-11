/**
 * Vite plugin that folds the build into a single self-contained figma/ui.html.
 *
 * A Figma plugin's UI must be one file - relative <script src> and <link href>
 * do not resolve inside the plugin iframe. Rather than take a dependency for
 * this, we inline the emitted JS and CSS ourselves.
 *
 * It runs as a closeBundle hook rather than a separate script so that
 * `vite build --watch` regenerates ui.html on every save, which is what makes
 * `bun run watch:figma` + Figma's hot reload a real edit loop.
 */
import { readFileSync, writeFileSync, existsSync, rmSync } from 'node:fs';
import { join } from 'node:path';

const kb = (n) => (n / 1024).toFixed(0) + ' KB';

export default function inlineSingleFile({ dist, out }) {
  return {
    name: 'figma-inline-single-file',
    closeBundle() {
      if (!existsSync(dist)) {
        this.error('figma build produced no dist/ directory');
      }

      const js = readFileSync(join(dist, 'ui.js'), 'utf8');
      const cssPath = join(dist, 'ui.css');
      const css = existsSync(cssPath) ? readFileSync(cssPath, 'utf8') : '';

      // A literal </script> inside the bundle would close the tag early.
      const safeJs = js.replace(/<\/script>/gi, '<\\/script>');

      const html = `<!doctype html>
<!-- GENERATED from the app's own components by figma/inline.mjs. Do not edit.
     Rebuild with: bun run build:figma -->
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>Color Taylor</title>
    <style>
${css}
    </style>
  </head>
  <body>
    <div id="root"></div>
    <script>
${safeJs}
    </script>
  </body>
</html>
`;

      writeFileSync(out, html);
      rmSync(dist, { recursive: true, force: true });
      console.log(`\nfigma/ui.html  ${kb(html.length)}  (js ${kb(js.length)}, css ${kb(css.length)})`);
    },
  };
}
