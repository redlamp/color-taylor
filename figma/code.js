// @ts-check
/**
 * Color Taylor - Figma plugin sandbox side.
 *
 * Runs in Figma's QuickJS sandbox: no DOM, no fetch. Plain ES2017 so it loads
 * straight from "Import plugin from manifest" with no build step of its own -
 * typechecked in place against @figma/plugin-typings via `tsc -p figma`.
 * The UI half is built from the app - see figma/README.md.
 *
 * There is no Apply button: picking a color paints the selection immediately.
 * The Fill/Stroke/None tabs choose which paint that is. This file's whole job
 * is that bridge.
 */

/*
 * The bridge protocol types - UiToSandboxMessage, SandboxToUiMessage,
 * PaintTarget - arrive as globals via messages-globals.d.ts, not the usual
 * JSDoc module reference: Figma's loader scans this file's raw source for
 * dynamic-module syntax and rejects it, comments included. Keep this file
 * free of anything shaped like a dynamic-module call - the word alone in
 * prose (the header above) is proven safe, the call form is not.
 */

/**
 * A node the picker might paint. The API has no one type for "has fills or
 * strokes" - those live on per-shape mixins - so the dynamic `node[prop]`
 * access goes through this Partial instead of a per-node-type switch.
 * @typedef {SceneNode & Partial<MinimalFillsMixin> & Partial<MinimalStrokesMixin>} PaintableNode
 */

const MIN_W = 300;
// Low, because height tracks content: collapse every section and the panel
// should shrink to match rather than leave dead space.
const MIN_H = 160;
const MAX_W = 900;
const MAX_H = 1200;
// Opens at the minimum width. A plugin panel is a guest in someone else's
// window, so it takes as little of the canvas as it can and lets the user
// widen it if they want a bigger hexagon; the width they drag to is remembered
// in clientStorage, so this only ever applies on a first run.
//
// DEFAULT_H is the measured content height at DEFAULT_W, so the window opens
// already fitted instead of jumping when the UI reports its first measurement.
// Measured with Recent and Saved collapsed, which is how they open.
//
// Re-measured 2026-08-18 against the built ui.html: 651 at 300, 690 at 340,
// 767 at 420, 844 at 500. The previous pair (500 / 595) was stale by about
// 235px at every width - the app grew an alpha slider and the group toggles
// after it was taken, and nothing here is derived automatically. If the panel
// visibly jumps on open, this is the number to re-measure.
const DEFAULT_W = MIN_W;
const DEFAULT_H = 651;

figma.showUI(__html__, { width: DEFAULT_W, height: DEFAULT_H, themeColors: true });

/**
 * Figma paint components are sRGB 0..1, not linear. Straight /255.
 * @param {unknown} hex
 * @returns {RGB | null}
 */
function hexToPaintColor(hex) {
  if (typeof hex !== 'string') return null;
  let s = hex.trim().replace(/^#/, '');
  if (/^[0-9a-fA-F]{3}$/.test(s)) s = s[0] + s[0] + s[1] + s[1] + s[2] + s[2];
  if (!/^[0-9a-fA-F]{6}$/.test(s)) return null;
  const n = parseInt(s, 16);
  return { r: ((n >> 16) & 255) / 255, g: ((n >> 8) & 255) / 255, b: (n & 255) / 255 };
}

/** @param {number} c */
function channelToHex(c) {
  const n = Math.round(Math.min(1, Math.max(0, c)) * 255);
  return (n < 16 ? '0' : '') + n.toString(16);
}

/** @param {RGB} color */
function paintColorToHex(color) {
  return '#' + channelToHex(color.r) + channelToHex(color.g) + channelToHex(color.b);
}

// Which paint the picker reads and writes. Driven by the UI's Fill/Stroke tabs.
/** @type {PaintTarget} */
let target = 'fill';

// 'none' still reads from fills so the picker keeps showing the selection; it
// just never writes. applyPaint is simply not called in that mode.
function paintProp() {
  return target === 'stroke' ? 'strokes' : 'fills';
}

/**
 * First visible solid paint in the selection, so the picker opens on it.
 * @returns {{ hex: string, opacity: number } | null}
 */
function selectionPaint() {
  const prop = paintProp();
  for (const node of figma.currentPage.selection) {
    const paints = /** @type {PaintableNode} */ (node)[prop];
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

/**
 * Typed front door for figma.ui.postMessage, whose parameter is `any` - this
 * is where an outbound message that drifted from the protocol fails typecheck.
 * @param {SandboxToUiMessage} msg
 */
function send(msg) {
  figma.ui.postMessage(msg);
}

/** @param {{ hex: string, opacity: number } | null} [known] */
function postSelection(known) {
  const paint = known === undefined ? selectionPaint() : known;
  send({
    type: 'selection',
    count: figma.currentPage.selection.length,
    hex: paint ? paint.hex : null,
    opacity: paint ? paint.opacity : 1,
  });
}

/**
 * Recolors the first solid fill on each selected node, preserving opacity and
 * blend mode. Nodes with no fills get a fresh solid; gradient-only nodes get a
 * solid appended rather than having their gradient discarded.
 *
 * Called on every color change, so it stays silent - no notify() per frame.
 * @param {string} hex
 * @param {number} opacity
 */
function applyPaint(hex, opacity) {
  const color = hexToPaintColor(hex);
  if (!color) return;
  const alpha = typeof opacity === 'number' ? Math.min(1, Math.max(0, opacity)) : 1;
  const prop = paintProp();
  lastWritten = paintKey(hex, alpha);

  for (const node of /** @type {PaintableNode[]} */ (figma.currentPage.selection)) {
    if (!(prop in node)) continue;
    const current = node[prop];
    /** @type {Paint[]} */
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
/** @param {number} w */
function clampW(w) {
  return Math.min(MAX_W, Math.max(MIN_W, Math.round(w)));
}

/** @param {number} h */
function clampH(h) {
  return Math.min(MAX_H, Math.max(MIN_H, Math.round(h)));
}

/**
 * @param {number} w
 * @param {number} h
 */
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

/**
 * @param {number} x
 * @param {number} y
 */
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
/**
 * How long to let a reposition land before reading the position back.
 *
 * The probe used to read immediately after each move, and that is why west
 * anchoring was always off in real Figma: reposition moves a host window, the
 * host applies it asynchronously, and the synchronous readback therefore
 * returned the *old* position every time. That makes the verification step
 * compare a stale p2 against p0 and miss by the full probe distance, so the
 * capability check failed even though repositioning works fine.
 */
const PROBE_SETTLE_MS = 120;
/** @type {boolean | null} */
let westCapable = null;
/** @type {{ x: number, y: number } | null} */
let westBias = null;
/** @type {{ x: number, y: number, w: number } | null} */
let westAnchor = null;

/** @param {number} ms */
function delay(ms) {
  return new Promise(function (resolve) {
    setTimeout(resolve, ms);
  });
}

/**
 * Nudge a known amount, see where we actually land, and keep the difference as
 * a correction. Then put the window back using that correction and check it
 * worked. Three outcomes:
 *
 *   spaces agree        bias 0, verification exact, west anchoring on
 *   constant offset     bias measured, verification exact, west anchoring on
 *   anything else       verification fails, west anchoring off for the session
 *
 * The third case includes any non-translation transform. Off means the west
 * edge resizes like the east one - the panel stays put and usable instead of
 * being flung somewhere unrecoverable.
 *
 * Every readback waits PROBE_SETTLE_MS first. Reading synchronously is what
 * made this fail in real Figma: the move had not been applied yet, so p2 still
 * held the pre-move position and the verification missed by the whole probe
 * distance. Which meant the west edge silently resized without anchoring, for
 * everyone, always.
 *
 * Async, so it runs once at startup rather than on the first west drag - a
 * drag cannot wait 240ms to find out how it should behave.
 */
async function probeWestAnchoring() {
  if (westCapable !== null) return;
  westCapable = false;

  const p0 = readPosition();
  if (!p0) return;

  moveTo(p0.x + PROBE_PX, p0.y);
  await delay(PROBE_SETTLE_MS);
  const p1 = readPosition();
  if (!p1) {
    moveTo(p0.x, p0.y);
    return;
  }

  const bias = { x: p1.x - (p0.x + PROBE_PX), y: p1.y - p0.y };
  moveTo(p0.x - bias.x, p0.y - bias.y);
  await delay(PROBE_SETTLE_MS);
  const p2 = readPosition();
  const err = p2 ? Math.abs(p2.x - p0.x) + Math.abs(p2.y - p0.y) : Infinity;

  westCapable = err <= 1;
  westBias = westCapable ? bias : null;
  // Only the failure is worth a line. The success case ran on every session
  // and put plugin internals in the user's console for no reason.
  if (!westCapable) {
    console.warn(
      '[Color Taylor] west-edge anchoring off, reposition probe missed by',
      err,
    );
  }
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

/**
 * @param {number} width
 * @param {boolean} fromLeft
 */
function resizeWidth(width, fromLeft) {
  // westCapable is already settled - the probe runs at startup, not here.
  if (fromLeft && !westAnchor && westCapable === true) {
    const pos = readPosition();
    if (pos) westAnchor = { x: pos.x, y: pos.y, w: size.w };
  }
  applySize(width, size.h);
}

/**
 * Live-update when the color is changed outside the plugin - Figma's own
 * picker, the right rail, another plugin.
 *
 * The docs only exempt changes a plugin makes *inside* a documentchange
 * callback, so our own paints do come back through here. lastWritten is how we
 * tell an echo from a genuine edit; without it every drag frame would bounce
 * back and fight the picker.
 */
/** @type {string | null} */
let lastWritten = null;

/**
 * @param {string} hex
 * @param {number} opacity
 */
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
/** @type {string | null} */
let lastSeen = null;

/** @param {boolean} force */
function pushIfChanged(force) {
  const count = figma.currentPage.selection.length;
  const paint = selectionPaint();
  const colorKey = paint ? paintKey(paint.hex, paint.opacity) : '-';
  const key = count + '|' + colorKey;
  if (!force && key === lastSeen) return;
  lastSeen = key;

  // Our own paint coming back round. Suppress the color half only: while the
  // user drags our picker, echoing the round-tripped value back would fight
  // the drag. A change in how many nodes are selected still has to get through
  // or the "Selected: N" caption goes stale.
  if (paint && colorKey === lastWritten) {
    send({ type: 'selection', count: count, hex: null, opacity: 1 });
    return;
  }
  postSelection(paint);
}

/**
 * How the picker follows Figma's own color picker.
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
  send({ type: 'wake' });
}

/** @param {NodeChangeEvent} event */
function onNodeChange(event) {
  const selected = new Set(figma.currentPage.selection.map((n) => n.id));
  if (selected.size === 0) return;
  const prop = paintProp();
  const touched = event.nodeChanges.some(
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

/**
 * nodechange rather than documentchange, and no loadAllPagesAsync.
 *
 * Under documentAccess: "dynamic-page" the document-wide event is only
 * available once every page has been loaded, and Figma's guidance is to not
 * pay that: "Because this may introduce a loading delay, consider using more
 * granular alternatives, such as [...] PageNode.on with the 'nodechange'
 * event." On a large file that load is a stall the first time the plugin runs
 * in it, and we never look past the current page's selection anyway.
 *
 * The cost is that the listener belongs to a page, not the file, so it has to
 * follow the user when they switch pages.
 */
/** @type {PageNode | null} */
let watched = null;

function watchCurrentPage() {
  const page = figma.currentPage;
  if (page === watched) return;
  if (watched) {
    try {
      watched.off('nodechange', onNodeChange);
    } catch (err) {
      void err;
    }
  }
  watched = null;
  try {
    page.on('nodechange', onNodeChange);
    watched = page;
  } catch (err) {
    // No PageNode.on on this host. Selection tracking still works; only
    // following an edit made from Figma's own picker is lost.
    console.warn(
      '[Color Taylor] nodechange unavailable:',
      err instanceof Error ? err.message : err,
    );
  }
}

figma.on('selectionchange', function () {
  pushIfChanged(true);
});

figma.on('currentpagechange', watchCurrentPage);
watchCurrentPage();

/**
 * Recent and Saved swatches.
 *
 * The UI cannot keep these itself: its iframe is null-origin, so localStorage
 * raises SecurityError there and every write is lost. clientStorage is the
 * sanctioned store but only exists on this side, so the UI asks for the blob
 * on boot and posts back whenever it changes.
 *
 * Kept as one object under a single key rather than a key each - it is written
 * on every swatch change, and one setAsync is cheaper than several.
 */
const SWATCH_KEY = 'swatches';
/** @type {Record<string, unknown> | null} */
let swatches = null;

function sendSwatches() {
  send({ type: 'swatches', data: swatches || {} });
}

function loadSwatches() {
  figma.clientStorage
    .getAsync(SWATCH_KEY)
    .then((stored) => {
      swatches = stored && typeof stored === 'object' ? stored : {};
      sendSwatches();
    })
    .catch((err) => {
      console.warn('[Color Taylor] could not read saved swatches:', err && err.message);
      swatches = {};
      sendSwatches();
    });
}

figma.ui.onmessage = (/** @type {UiToSandboxMessage} */ msg) => {
  if (!msg || typeof msg.type !== 'string') return;

  switch (msg.type) {
    case 'ready':
      pushIfChanged(true);
      loadSwatches();
      break;

    // A swatch list changed. Ignored until the load has completed, so a UI
    // that started on an empty cache cannot overwrite what is on disk.
    case 'saveSwatches':
      if (swatches === null) break;
      swatches[msg.key] = msg.value;
      figma.clientStorage.setAsync(SWATCH_KEY, swatches).catch((err) => {
        console.warn('[Color Taylor] could not save swatches:', err && err.message);
      });
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

  /*
   * Settle the west-anchoring question once, up front, so a drag never has to
   * wait on it. Deliberately after the width restore: probing first would nudge
   * a window that is about to move anyway.
   *
   * The cost is one 8px round trip at launch, which returns to where it
   * started. Failure is safe by construction - west anchoring simply stays off
   * and the west edge resizes like the east one.
   */
  probeWestAnchoring().catch((err) => {
    console.warn('[Color Taylor] west-anchoring probe failed:', err && err.message);
  });
});
