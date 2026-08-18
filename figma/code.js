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

/**
 * Where the panel opens.
 *
 * Left unset, it landed over Figma's own left-hand menus. These clear the
 * toolbar and the layers/assets panel and leave a small margin, so it opens in
 * canvas space rather than on top of the chrome.
 *
 * `position` in showUI is the documented way to place the window, and unlike
 * `reposition` it is applied once at creation - so it does not depend on the
 * getPosition/reposition coordinate-space question that west anchoring is
 * still stuck on.
 */
const INITIAL_X = 280;
const INITIAL_Y = 72;

figma.showUI(__html__, {
  width: DEFAULT_W,
  height: DEFAULT_H,
  position: { x: INITIAL_X, y: INITIAL_Y },
  themeColors: true,
});

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

/**
 * Which of getPosition's two spaces `reposition` actually speaks.
 *
 * Decided by measurement at startup, not assumed - see calibrateWindowSpace.
 * Until then reads default to windowSpace, which is only used for logging.
 *
 * @type {'window' | 'canvas'}
 */
let positionSpace = 'window';

/** Both spaces, raw. getPosition returns a pair, not a bare {x, y}. */
function readRawPosition() {
  try {
    if (typeof figma.ui.getPosition !== 'function') return null;
    const pos = figma.ui.getPosition();
    return pos && pos.windowSpace && pos.canvasSpace ? pos : null;
  } catch (err) {
    void err;
    return null;
  }
}

/** The panel's position in the space `reposition` writes in. */
function readPosition() {
  const pos = readRawPosition();
  if (!pos) return null;
  return positionSpace === 'canvas' ? pos.canvasSpace : pos.windowSpace;
}

/**
 * Converts a distance in screen pixels into the units the write space uses.
 *
 * The panel's width is screen pixels - figma.ui.resize deals in them - but its
 * position may be canvas coordinates, and those are only the same thing at
 * 100% zoom. Subtracting a pixel width delta straight from a canvas x is
 * therefore wrong by a factor of the zoom, which is what made west dragging
 * overshoot: reported 2026-08-19 as the panel growing *and* sliding west, so
 * the east edge crept instead of staying pinned. Zoomed in, every pixel of
 * growth moved the window more than a pixel.
 *
 * @param {number} px
 */
function pxToWrite(px) {
  if (positionSpace !== 'canvas') return px;
  const zoom = figma.viewport.zoom;
  return isFinite(zoom) && zoom > 0 ? px / zoom : px;
}

/**
 * Moves the panel so its top-left lands on a given *windowSpace* point.
 *
 * Positions are remembered in window space on purpose, even when we write in
 * canvas space: window space is where the user actually put the panel on their
 * screen, and it survives panning and zooming between sessions. A stored
 * canvas coordinate would reopen the panel wherever that bit of canvas has
 * since scrolled to.
 *
 * @param {number} wx
 * @param {number} wy
 */
function moveToWindowPoint(wx, wy) {
  const raw = readRawPosition();
  if (!raw) return;
  const here = positionSpace === 'canvas' ? raw.canvasSpace : raw.windowSpace;
  moveTo(
    here.x + pxToWrite(wx - raw.windowSpace.x),
    here.y + pxToWrite(wy - raw.windowSpace.y),
  );
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
 * It is now answered without moving anything. The docs describe `reposition`
 * and showUI's `position` option as the same setting - "the position can also
 * be set in the initial options" - so they share a coordinate space, and we
 * *choose* the position we pass to showUI. Reading getPosition() straight
 * afterwards therefore measures the offset between the two spaces directly:
 *
 *     bias = getPosition().windowSpace - the position we asked for
 *
 * Everything after that converts between them by subtracting the bias.
 *
 * This replaces a nudge-and-verify probe that moved the window 8px and put it
 * back using a position it had read itself. That was circular - if the spaces
 * disagreed, which is the thing it was trying to detect, "back" was somewhere
 * else - and on 2026-08-18 it opened the panel on top of Figma's left menus.
 * The probe also chased a wrong hypothesis: it waited for repositions to
 * "settle" asynchronously, but the docs state reposition is synchronous.
 */
/** @type {boolean | null} */
let westCapable = null;
/** @type {{ x: number, y: number, w: number } | null} */
let westAnchor = null;

/** How close a reading has to be to count as "this is the space we wrote in". */
const SPACE_MATCH_TOLERANCE = 2;

/**
 * Works out which space `reposition` speaks, by asking showUI for a position
 * we chose and seeing which of getPosition's two readings comes back holding
 * it. Whichever matches is the space reposition writes in, because the docs
 * describe showUI's `position` and `reposition` as the same setting.
 *
 * Nothing moves and there is nothing to restore - the measurement is just a
 * comparison against a number we already know.
 *
 * The first attempt at this compared only against windowSpace, and on
 * 2026-08-18 a real session returned asked (280, 72) against windowSpace
 * (1370, 407). Read as an offset that is nonsense - 1090px is not chrome - but
 * as a *canvas pan* it is entirely ordinary, which is what suggested checking
 * both spaces rather than assuming one.
 *
 * If neither matches, showUI's position was not honoured at all, west
 * anchoring stays off, and the west edge resizes like the east one.
 *
 * @param {{ x: number, y: number }} asked - the position passed to showUI
 */
function calibrateWindowSpace(asked) {
  const pos = readRawPosition();
  if (!pos) {
    westCapable = false;
    console.log('[Color Taylor] window-space calibration: OFF (no position available)');
    return;
  }

  /** @param {{x: number, y: number}} v */
  const missBy = (v) => Math.abs(v.x - asked.x) + Math.abs(v.y - asked.y);
  const windowMiss = missBy(pos.windowSpace);
  const canvasMiss = missBy(pos.canvasSpace);

  if (canvasMiss <= SPACE_MATCH_TOLERANCE) positionSpace = 'canvas';
  else if (windowMiss <= SPACE_MATCH_TOLERANCE) positionSpace = 'window';

  westCapable = canvasMiss <= SPACE_MATCH_TOLERANCE || windowMiss <= SPACE_MATCH_TOLERANCE;

  console.log(
    '[Color Taylor] window-space calibration: ' +
      (westCapable ? 'ON (' + positionSpace + ' space)' : 'OFF (position not honoured)'),
    JSON.stringify({
      asked: asked,
      windowSpace: pos.windowSpace,
      canvasSpace: pos.canvasSpace,
      windowMiss: windowMiss,
      canvasMiss: canvasMiss,
      zoom: figma.viewport.zoom,
      viewportBounds: figma.viewport.bounds,
      hasReposition: typeof figma.ui.reposition === 'function',
    }),
  );
}

/*
 * Calibrate here rather than beside showUI, even though that reads better.
 * westCapable and positionSpace are `let` bindings declared above, so calling
 * this any earlier lands in their temporal dead zone and throws. Everything to
 * this point is synchronous top-level code, so the window is still sitting
 * exactly where showUI put it - which is the only thing the measurement needs.
 */
calibrateWindowSpace({ x: INITIAL_X, y: INITIAL_Y });

/**
 * Holds the east edge still while the west edge moves.
 *
 * y is the anchor's, never re-read - re-reading and writing it back each frame
 * is what let the window drift down out of the app. x is absolute from the
 * anchor, so it cannot accumulate: the same width always maps to the same x.
 */
function holdWestAnchor() {
  if (!westAnchor) return;
  // The width delta is screen pixels; the position may not be. See pxToWrite.
  moveTo(westAnchor.x + pxToWrite(westAnchor.w - size.w), westAnchor.y);
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
      rememberPosition();
      break;

    case 'close':
      figma.closePlugin();
      break;
  }
};

/**
 * Stores where the panel is so the next launch can put it back.
 *
 * Only once calibration has identified the space - otherwise the number would
 * be in whichever space we guessed, and restoring it next launch would move
 * the panel somewhere arbitrary. Better to reopen at the default than to
 * persist a coordinate we cannot interpret.
 */
function rememberPosition() {
  if (westCapable !== true) return;
  const raw = readRawPosition();
  if (!raw) return;
  // Window space, always - see moveToWindowPoint for why.
  figma.clientStorage.setAsync('windowPos', {
    x: raw.windowSpace.x,
    y: raw.windowSpace.y,
  });
}

/*
 * Restore the remembered width and position.
 *
 * Height is deliberately not restored: it is always a fit to the content, and
 * the UI measures itself on mount and reports it, so a stored height would
 * land after that measurement and overwrite it.
 *
 * Position is applied with `reposition` rather than being passed to showUI,
 * because clientStorage is async and showUI has already run by the time this
 * resolves. That means a first-run-since-move opens at INITIAL_X/Y for a
 * moment and then hops to the remembered spot. Accepted: the alternative is
 * awaiting storage before showing any UI at all, which trades a small hop for
 * a blank panel on every launch.
 */
figma.clientStorage.getAsync('windowWidth').then((saved) => {
  if (typeof saved === 'number') applySize(saved, size.h);
});

figma.clientStorage.getAsync('windowPos').then((saved) => {
  if (westCapable !== true) return;
  if (!saved || typeof saved.x !== 'number' || typeof saved.y !== 'number') return;
  if (!isFinite(saved.x) || !isFinite(saved.y)) return;
  // Entries written before positions were stored in window space carried a
  // `space` field. Those coordinates mean something different; ignore them and
  // let this session write a fresh one.
  if (saved.space) return;
  moveToWindowPoint(saved.x, saved.y);
});
