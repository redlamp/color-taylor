/**
 * Color Taylor - Figma plugin sandbox side.
 *
 * Runs in Figma's QuickJS sandbox: no DOM, no fetch. Plain ES2017 so it loads
 * straight from "Import plugin from manifest" with no build step of its own.
 * The UI half is built from the app - see figma/README.md.
 *
 * There are no Fill/Stroke buttons: picking a colour paints the selection's
 * fill immediately. This file's whole job is that bridge.
 */

const MIN_W = 300;
// Low, because height tracks content: collapse every section and the panel
// should shrink to match rather than leave dead space.
const MIN_H = 160;
const MAX_W = 900;
const MAX_H = 1200;
// A wider default means a larger hexagon out of the box; users can drag either
// way. DEFAULT_H is the measured content height at DEFAULT_W, so the window
// opens already fitted instead of jumping when the UI reports its first
// measurement. Measured with Recent and Saved collapsed, which is how they open.
const DEFAULT_W = 500;
const DEFAULT_H = 595;

figma.showUI(__html__, { width: DEFAULT_W, height: DEFAULT_H, themeColors: true });

/** Figma paint components are sRGB 0..1, not linear. Straight /255. */
function hexToPaintColor(hex) {
  if (typeof hex !== 'string') return null;
  let s = hex.trim().replace(/^#/, '');
  if (/^[0-9a-fA-F]{3}$/.test(s)) s = s[0] + s[0] + s[1] + s[1] + s[2] + s[2];
  if (!/^[0-9a-fA-F]{6}$/.test(s)) return null;
  const n = parseInt(s, 16);
  return { r: ((n >> 16) & 255) / 255, g: ((n >> 8) & 255) / 255, b: (n & 255) / 255 };
}

function channelToHex(c) {
  const n = Math.round(Math.min(1, Math.max(0, c)) * 255);
  return (n < 16 ? '0' : '') + n.toString(16);
}

function paintColorToHex(color) {
  return '#' + channelToHex(color.r) + channelToHex(color.g) + channelToHex(color.b);
}

// Which paint the picker reads and writes. Driven by the UI's Fill/Stroke tabs.
let target = 'fill';

function paintProp() {
  return target === 'stroke' ? 'strokes' : 'fills';
}

/** First visible solid paint in the selection, so the picker opens on it. */
function selectionPaint() {
  const prop = paintProp();
  for (const node of figma.currentPage.selection) {
    const paints = node[prop];
    // May be figma.mixed (a symbol) on mixed-paint text; Array.isArray guards it.
    if (!Array.isArray(paints)) continue;
    for (const paint of paints) {
      if (paint.type === 'SOLID' && paint.visible !== false) {
        return {
          hex: paintColorToHex(paint.color),
          opacity: paint.opacity === undefined ? 1 : paint.opacity,
        };
      }
    }
  }
  return null;
}

function postSelection() {
  const paint = selectionPaint();
  figma.ui.postMessage({
    type: 'selection',
    count: figma.currentPage.selection.length,
    hex: paint ? paint.hex : null,
    opacity: paint ? paint.opacity : 1,
  });
}

/**
 * Recolours the first solid fill on each selected node, preserving opacity and
 * blend mode. Nodes with no fills get a fresh solid; gradient-only nodes get a
 * solid appended rather than having their gradient discarded.
 *
 * Called on every colour change, so it stays silent - no notify() per frame.
 */
function applyPaint(hex, opacity) {
  const color = hexToPaintColor(hex);
  if (!color) return;
  const alpha = typeof opacity === 'number' ? Math.min(1, Math.max(0, opacity)) : 1;
  const prop = paintProp();

  for (const node of figma.currentPage.selection) {
    if (!(prop in node)) continue;
    const current = node[prop];
    let next;
    if (Array.isArray(current) && current.length > 0) {
      next = current.slice();
      const idx = next.findIndex((p) => p.type === 'SOLID');
      if (idx >= 0) next[idx] = Object.assign({}, next[idx], { color, opacity: alpha });
      else next.push({ type: 'SOLID', color, opacity: alpha });
    } else {
      next = [{ type: 'SOLID', color, opacity: alpha }];
    }
    try {
      node[prop] = next;
      // A stroke on a zero-weight node paints nothing, which reads as the
      // plugin being broken. Give it the Figma default rather than leave the
      // user wondering.
      if (prop === 'strokes' && node.strokeWeight === 0) node.strokeWeight = 1;
    } catch (err) {
      // Locked layer, or a read-only node inside an instance. Skip silently:
      // this runs continuously while dragging.
      void err;
    }
  }
}

// Tracked here because figma.ui.resize takes both and there is no way to read
// them back.
const size = { w: DEFAULT_W, h: DEFAULT_H };

// Height is always the content's - there is deliberately no manual height.
function clampW(w) {
  return Math.min(MAX_W, Math.max(MIN_W, Math.round(w)));
}

function clampH(h) {
  return Math.min(MAX_H, Math.max(MIN_H, Math.round(h)));
}

function applySize(w, h) {
  const nw = clampW(w);
  const nh = clampH(h);
  if (nw === size.w && nh === size.h) return;
  size.w = nw;
  size.h = nh;
  figma.ui.resize(nw, nh);
  // resize() can shift the window on its own, so re-assert after every one.
  holdWestAnchor();
}

// getPosition returns { windowSpace, canvasSpace } - not a bare {x, y}.
function readPosition() {
  try {
    if (typeof figma.ui.getPosition !== 'function') return null;
    const pos = figma.ui.getPosition();
    return pos && pos.windowSpace ? pos.windowSpace : null;
  } catch (err) {
    void err;
    return null;
  }
}

function moveTo(x, y) {
  if (!isFinite(x) || !isFinite(y)) return;
  try {
    if (typeof figma.ui.reposition === 'function') figma.ui.reposition(Math.round(x), Math.round(y));
  } catch (err) {
    void err;
  }
}

/**
 * West-edge drag state: the window position and width when the drag began.
 * Null unless a west drag is in progress.
 *
 * Absolute, never relative. Reading the live position each frame and applying a
 * delta compounds: figma.ui.resize can nudge the window by itself, so Figma
 * moves it, then we move it again, and the panel accelerates off-screen. That
 * is what sent it to the bottom corner.
 *
 * Recomputing an absolute x from a fixed anchor cannot accumulate - the same
 * width always maps to the same x - so a wrong coordinate space would show up
 * as a constant offset instead of a runaway. Bounded by the width range either
 * way.
 */
let westAnchor = null;

function holdWestAnchor() {
  if (!westAnchor) return;
  // Never off the left edge, whatever the coordinate space turns out to be.
  moveTo(Math.max(0, westAnchor.x + (westAnchor.w - size.w)), westAnchor.y);
}

function resizeWidth(width, fromLeft) {
  if (fromLeft && !westAnchor) {
    const pos = readPosition();
    // No position API, no west anchoring: resize from the east instead of
    // flinging the window somewhere unrecoverable.
    if (pos) westAnchor = { x: pos.x, y: pos.y, w: size.w };
  }
  applySize(width, size.h);
}

figma.on('selectionchange', postSelection);

figma.ui.onmessage = (msg) => {
  if (!msg || typeof msg.type !== 'string') return;

  switch (msg.type) {
    case 'ready':
      postSelection();
      break;

    case 'apply':
      applyPaint(msg.hex, msg.opacity);
      break;

    // Fill/Stroke switch. Re-seed so the picker shows what that paint already
    // is, rather than immediately overwriting it.
    case 'target':
      target = msg.target === 'stroke' ? 'stroke' : 'fill';
      postSelection();
      break;

    // Figma groups every edit a plugin makes into one undo step. Committing on
    // pointer-up makes each drag its own entry instead of the whole session.
    case 'commit':
      figma.commitUndo();
      break;

    // The UI reporting how tall its content is. This is the only thing that
    // sets height, which is why dead space cannot happen.
    case 'autosize':
      applySize(size.w, msg.height);
      break;

    // An edge drag. Width only - height stays whatever the content needs.
    case 'resizeWidth':
      resizeWidth(msg.width, msg.fromLeft === true);
      break;

    case 'resizeEnd':
      westAnchor = null;
      figma.clientStorage.setAsync('windowWidth', size.w);
      break;

    case 'close':
      figma.closePlugin();
      break;
  }
};

// Restore the last width only. Height always starts as a fit to the content -
// the UI measures itself on mount and reports it. Restoring a stored height
// here would land after that measurement and overwrite it.
figma.clientStorage.getAsync('windowWidth').then((saved) => {
  if (typeof saved === 'number') applySize(saved, size.h);
});
