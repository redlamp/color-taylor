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
const MIN_H = 380;
const MAX_W = 900;
const MAX_H = 1200;
const DEFAULT_W = 420;
const DEFAULT_H = 560;

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

/** First visible solid fill in the selection, so the picker opens on it. */
function selectionHex() {
  for (const node of figma.currentPage.selection) {
    const fills = node.fills;
    // fills is figma.mixed (a symbol) on mixed-fill text; Array.isArray guards it.
    if (!Array.isArray(fills)) continue;
    for (const paint of fills) {
      if (paint.type === 'SOLID' && paint.visible !== false) return paintColorToHex(paint.color);
    }
  }
  return null;
}

function postSelection() {
  figma.ui.postMessage({
    type: 'selection',
    count: figma.currentPage.selection.length,
    hex: selectionHex(),
  });
}

/**
 * Recolours the first solid fill on each selected node, preserving opacity and
 * blend mode. Nodes with no fills get a fresh solid; gradient-only nodes get a
 * solid appended rather than having their gradient discarded.
 *
 * Called on every colour change, so it stays silent - no notify() per frame.
 */
function applyFill(hex) {
  const color = hexToPaintColor(hex);
  if (!color) return;

  for (const node of figma.currentPage.selection) {
    if (!('fills' in node)) continue;
    const current = node.fills;
    let next;
    if (Array.isArray(current) && current.length > 0) {
      next = current.slice();
      const idx = next.findIndex((p) => p.type === 'SOLID');
      if (idx >= 0) next[idx] = Object.assign({}, next[idx], { color });
      else next.push({ type: 'SOLID', color });
    } else {
      next = [{ type: 'SOLID', color }];
    }
    try {
      node.fills = next;
    } catch (err) {
      // Locked layer, or a read-only node inside an instance. Skip silently:
      // this runs continuously while dragging.
      void err;
    }
  }
}

function clampSize(w, h) {
  return {
    w: Math.min(MAX_W, Math.max(MIN_W, Math.round(w))),
    h: Math.min(MAX_H, Math.max(MIN_H, Math.round(h))),
  };
}

figma.on('selectionchange', postSelection);

figma.ui.onmessage = (msg) => {
  if (!msg || typeof msg.type !== 'string') return;

  switch (msg.type) {
    case 'ready':
      postSelection();
      break;

    case 'apply':
      applyFill(msg.hex);
      break;

    // Figma groups every edit a plugin makes into one undo step. Committing on
    // pointer-up makes each drag its own entry instead of the whole session.
    case 'commit':
      figma.commitUndo();
      break;

    case 'resize': {
      const size = clampSize(msg.width, msg.height);
      figma.ui.resize(size.w, size.h);
      figma.clientStorage.setAsync('windowSize', size);
      break;
    }

    case 'close':
      figma.closePlugin();
      break;
  }
};

// Restore the last window size. Runs after showUI so the default is never
// visible for more than a frame.
figma.clientStorage.getAsync('windowSize').then((saved) => {
  if (saved && saved.w && saved.h) {
    const size = clampSize(saved.w, saved.h);
    figma.ui.resize(size.w, size.h);
  }
});
