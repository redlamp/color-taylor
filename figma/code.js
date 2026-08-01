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
// The UI scales down from HEX_PANEL_WIDTH (614), so a wider default means
// larger, more legible type out of the box. Users can drag it either way.
const DEFAULT_W = 500;
const DEFAULT_H = 680;

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

// Width is the user's (the grip); height follows the content. Tracked here
// because figma.ui.resize takes both and there is no way to read them back.
const size = { w: DEFAULT_W, h: DEFAULT_H };

function clampW(w) {
  return Math.min(MAX_W, Math.max(MIN_W, Math.round(w)));
}

function clampH(h) {
  return Math.min(MAX_H, Math.max(MIN_H, Math.round(h)));
}

function applySize(w, h) {
  const next = { w: clampW(w), h: clampH(h) };
  if (next.w === size.w && next.h === size.h) return;
  size.w = next.w;
  size.h = next.h;
  figma.ui.resize(size.w, size.h);
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

    // The grip. Width only, and remembered between runs.
    case 'resize':
      applySize(msg.width, size.h);
      figma.clientStorage.setAsync('windowWidth', size.w);
      break;

    // The UI reporting how tall its content is. Clamped to MAX_H, past which
    // the panel scrolls rather than growing off-screen.
    case 'autosize':
      applySize(size.w, msg.height);
      break;

    case 'close':
      figma.closePlugin();
      break;
  }
};

// Restore the last width. Height is not restored - the UI reports its content
// height as soon as it mounts, which is a better answer than whatever the
// window happened to be last time.
figma.clientStorage.getAsync('windowWidth').then((saved) => {
  if (typeof saved === 'number') applySize(saved, size.h);
});
