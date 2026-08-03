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

// 'none' still reads from fills so the picker keeps showing the selection; it
// just never writes. applyPaint is simply not called in that mode.
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

function postSelection(known) {
  const paint = known === undefined ? selectionPaint() : known;
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
  lastWritten = paintKey(hex, alpha);

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
 * West-edge dragging has to move the window as it resizes, and that has now
 * broken three different ways. The cause is that figma.ui.reposition and
 * figma.ui.getPosition are not documented as sharing a coordinate space -
 * getPosition returns { windowSpace, canvasSpace } and reposition's docs say
 * nothing at all - so every version of "read here, write there" has been a
 * guess.
 *
 * So: prove it before relying on it. Nudge the window a known amount, read
 * back, and only enable west anchoring if it actually moved by that amount. A
 * stale readback and a mismatched space both fail the check, and a failure
 * means we simply never reposition - the west edge then resizes like the east
 * one. Degraded, but the panel can never be flung off-screen again.
 */
const PROBE_PX = 8;
let westCapable = null;
let westBias = null;
let westAnchor = null;

/**
 * Nudge a known amount, see where we actually land, and keep the difference as
 * a correction. Then put the window back using that correction and check it
 * worked. Three outcomes:
 *
 *   spaces agree        bias 0, verification exact, west anchoring on
 *   constant offset     bias measured, verification exact, west anchoring on
 *   anything else       verification fails, west anchoring off for the session
 *
 * The third case includes a stale readback and any non-translation transform.
 * Off means the west edge resizes like the east one - the panel stays put and
 * usable instead of being flung somewhere unrecoverable.
 */
function canReposition() {
  if (westCapable !== null) return westCapable;
  westCapable = false;
  const p0 = readPosition();
  if (!p0) return false;

  moveTo(p0.x + PROBE_PX, p0.y);
  const p1 = readPosition();
  if (!p1) {
    moveTo(p0.x, p0.y);
    return false;
  }

  const bias = { x: p1.x - (p0.x + PROBE_PX), y: p1.y - p0.y };
  moveTo(p0.x - bias.x, p0.y - bias.y);
  const p2 = readPosition();
  const err = p2 ? Math.abs(p2.x - p0.x) + Math.abs(p2.y - p0.y) : Infinity;

  westCapable = err <= 1;
  westBias = westCapable ? bias : null;
  console.log(
    '[Color Taylor] reposition probe:',
    JSON.stringify({ p0, p1, p2, bias, err, usable: westCapable }),
  );
  return westCapable;
}

/**
 * Holds the east edge still while the west edge moves.
 *
 * y is the anchor's, never re-read - re-reading and writing it back each frame
 * is what let the window drift down out of the app. x is absolute from the
 * anchor, so it cannot accumulate: the same width always maps to the same x.
 */
function holdWestAnchor() {
  if (!westAnchor || !westBias) return;
  moveTo(
    Math.max(0, westAnchor.x + (westAnchor.w - size.w)) - westBias.x,
    westAnchor.y - westBias.y,
  );
}

function resizeWidth(width, fromLeft) {
  if (fromLeft && !westAnchor && canReposition()) {
    const pos = readPosition();
    if (pos) westAnchor = { x: pos.x, y: pos.y, w: size.w };
  }
  applySize(width, size.h);
}

/**
 * Live-update when the colour is changed outside the plugin - Figma's own
 * picker, the right rail, another plugin.
 *
 * The docs only exempt changes a plugin makes *inside* a documentchange
 * callback, so our own paints do come back through here. lastWritten is how we
 * tell an echo from a genuine edit; without it every drag frame would bounce
 * back and fight the picker.
 */
let lastWritten = null;

function paintKey(hex, opacity) {
  return String(hex).toLowerCase() + '|' + Math.round(opacity * 1000);
}

/**
 * The one place that decides whether the UI needs telling.
 *
 * Both the poll below and documentchange come through here, so a change is
 * only ever sent once however it was noticed, and the echo rule is written
 * down once rather than in each caller.
 */
let lastSeen = null;

function pushIfChanged(force) {
  const count = figma.currentPage.selection.length;
  const paint = selectionPaint();
  const colorKey = paint ? paintKey(paint.hex, paint.opacity) : '-';
  const key = count + '|' + colorKey;
  if (!force && key === lastSeen) return;
  lastSeen = key;

  // Our own paint coming back round. Suppress the colour half only: while the
  // user drags our picker, echoing the round-tripped value back would fight
  // the drag. A change in how many nodes are selected still has to get through
  // or the "Selected: N" caption goes stale.
  if (paint && colorKey === lastWritten) {
    figma.ui.postMessage({ type: 'selection', count: count, hex: null, opacity: 1 });
    return;
  }
  postSelection(paint);
}

/**
 * How the picker follows Figma's own colour picker.
 *
 * documentchange is the documented signal, but Figma "will not call the
 * callback synchronously and will instead batch the updates and send them to
 * the callback periodically", so on its own it always trails the drag.
 *
 * This sandbox cannot fix that by polling: it is a JavaScript VM with no
 * display and no browser APIs, so there is no setInterval here and no frames
 * to hang a loop on. The UI iframe has both. So the division is:
 *
 *   sandbox  knows when an edit started (documentchange) and can read a paint
 *   iframe   has requestAnimationFrame, and drives the asking
 *
 * documentchange therefore does one extra thing - tell the UI to start asking.
 * The UI then sends `poll` once per animation frame until the edit goes quiet,
 * and each of those is answered from the scene graph directly, which is
 * synchronous and cheap (selectionPaint stops at the first solid paint).
 */
function wakeUi() {
  figma.ui.postMessage({ type: 'wake' });
}

function onDocumentChange(event) {
  const selected = new Set(figma.currentPage.selection.map((n) => n.id));
  if (selected.size === 0) return;
  const prop = paintProp();
  const touched = event.documentChanges.some(
    (c) =>
      c.type === 'PROPERTY_CHANGE' &&
      selected.has(c.id) &&
      Array.isArray(c.properties) &&
      c.properties.indexOf(prop) !== -1,
  );
  if (!touched) return;
  wakeUi();
  pushIfChanged(false);
}

figma.on('selectionchange', function () {
  pushIfChanged(true);
});

// documentchange needs documentAccess: "dynamic-page" in the manifest, and the
// pages loaded first. Registered after the load so a slow document delays the
// listener rather than throwing.
(async () => {
  try {
    if (typeof figma.loadAllPagesAsync === 'function') await figma.loadAllPagesAsync();
    figma.on('documentchange', onDocumentChange);
  } catch (err) {
    console.warn('[Color Taylor] documentchange unavailable:', err && err.message);
  }
})();

figma.ui.onmessage = (msg) => {
  if (!msg || typeof msg.type !== 'string') return;

  switch (msg.type) {
    case 'ready':
      pushIfChanged(true);
      break;

    // One animation frame's worth of "has it changed?", asked by the UI. The
    // answer is silence unless it has.
    case 'poll':
      pushIfChanged(false);
      break;

    case 'apply':
      applyPaint(msg.hex, msg.opacity);
      break;

    // Fill/Stroke switch. Re-seed so the picker shows what that paint already
    // is, rather than immediately overwriting it.
    case 'target':
      target = msg.target === 'stroke' || msg.target === 'none' ? msg.target : 'fill';
      pushIfChanged(true);
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
