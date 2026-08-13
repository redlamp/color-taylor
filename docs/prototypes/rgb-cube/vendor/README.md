# Vendored three.js

`three.min.cjs` — three.js **r185**, MIT. Copied from `node_modules/three/build/three.cjs`
and minified with `bun build --minify --format cjs`, which takes it from 2.0 MB to
737 KB. The package ships no minified CommonJS build, hence minifying it here.

## Why it is here rather than in package.json

The app does not depend on three.js and should not start depending on it for one
prototype. Its own WebGL is a single fragment shader in
`src/components/hex/hexShader.ts`; adding a 600 KB scene graph as a real
dependency would be a much larger decision than this prototype justifies.

So three was installed into a scratch directory, this one file was copied out,
and nothing was added to `package.json`.

## Why the CommonJS build

It is the only single-file build with no internal imports. The ES module build
splits into `three.module.min.js` plus `three.core.min.js` and needs either a
bundler or an HTTP origin — module scripts do not load over `file://`. The
minified module pair is smaller (740 KB against 2 MB) but costs you the ability
to open the prototype by double-clicking it, which is the whole point of a file
in `docs/prototypes/`.

`index.html` shims `exports` to an empty object before loading this, then hands
the result to `window.THREE`.

## Refreshing it

```
mkdir /tmp/tjs && cd /tmp/tjs && npm init -y && npm i three
cp node_modules/three/build/three.cjs .
bun build three.cjs --minify --format cjs --outfile <repo>/docs/prototypes/rgb-cube/vendor/three.min.cjs
```

Check `index.html` still reaches `__cubeReady` afterwards; the shim depends on
the build still assigning onto a global `exports`.
