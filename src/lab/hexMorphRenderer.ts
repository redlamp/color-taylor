/**
 * The morph's field: the picker's hexagon, as a mesh that can be bent.
 *
 * WHAT IS BEING DRAWN. The same colors the picker's shader paints, in the
 * same places, at t = 0 - `colorAtPoint` is the CPU twin of that shader and it
 * is what fills this mesh. At t = 1 every vertex has moved to where the target
 * space puts its color. Nothing is recolored; only the positions change, and
 * the whole claim of the figure rests on that being true.
 *
 * WHY A MESH AND NOT A REPAINT. Each vertex carries *both* of its positions -
 * `aPos0` and `aPos1` - and the vertex shader mixes them with a single
 * uniform. So a frame of the morph costs one uniform write and one
 * `drawElements`; nothing is recomputed, nothing is re-uploaded, and the
 * slider cannot get slower than the GPU's own fill rate.
 *
 * The expensive half happens once per (brightness, target) in `buildMorphMesh`
 * instead: 7,380 vertices, each needing a `colorAtPoint` and then a
 * `morphPoint`, which between them run an HSB conversion, a gamma decode and
 * either a matrix multiply or three cube roots. That is the cost the figure
 * pays, and it pays it when the brightness bar moves rather than when the
 * morph slider does. The same work per frame would be roughly a hundred times
 * the budget of one.
 *
 * `cubeRenderer.ts` next door does the same trick in three dimensions - three
 * positions mixed by weights, "so the morph animates for free". This is that
 * idea with two positions and a flat field.
 */
import { CENTER_X, CENTER_Y, RADIUS, HEX_SIZE, hexEdgeDist, colorAtPoint } from '@/components/hex/hexConstants';
import { morphPoint, type MorphTarget } from '@/utils/gamutMorph';
import type { GamutId } from '@/utils/gamuts';

/**
 * Angular and radial resolution of the field.
 *
 * 180 by 40 is 7,380 vertices and 14,400 triangles: a 2-degree wedge is about
 * 7 units across at the rim of a 540-unit figure, and the fragment color is
 * interpolated across each triangle rather than flat, so the facets are not
 * visible even where the morph stretches a cell to several times its size.
 * Doubling either costs a rebuild that is felt on a brightness drag and buys
 * nothing that can be seen.
 */
const NA = 180;
const NR = 40;

export interface MorphMesh {
  /** Two floats per vertex, in field units: x right, y *down*, as SVG draws. */
  pos0: Float32Array;
  pos1: Float32Array;
  /** Three floats per vertex, 0 to 1, gamma-encoded sRGB. */
  color: Float32Array;
  index: Uint16Array;
}

/** A point in field units - what the SVG overlay and the mesh both speak. */
export interface FieldPoint {
  x: number;
  y: number;
}

/** Where the target puts a color, in field units, anchored on the hexagon. */
export function fieldPointFor(r: number, g: number, b: number, target: MorphTarget, gamut: GamutId = 'srgb'): FieldPoint {
  const m = morphPoint(r, g, b, target, gamut);
  return { x: CENTER_X + RADIUS * m.x, y: CENTER_Y - RADIUS * m.y };
}

/** A hexagon-space point at a hue and a fraction of the way out to the rim. */
export function hexPointAt(hueDeg: number, fraction: number): FieldPoint {
  const a = (hueDeg * Math.PI) / 180;
  const d = hexEdgeDist(a, RADIUS) * fraction;
  return { x: CENTER_X + d * Math.cos(a), y: CENTER_Y - d * Math.sin(a) };
}

/**
 * Both ends of the morph for every vertex of the field, plus its color.
 *
 * The field is the picker's own: a polar grid over the hexagon, colored by
 * `colorAtPoint` at the brightness the bar is on. That includes the region
 * past the cross-section, where the picker previews what raising brightness
 * would reach - those are real colors with real places in the target, so they
 * morph like everything else, and it is why the rim lands on the same six
 * corners whatever the brightness bar says.
 */
export function buildMorphMesh(brightness: number, target: MorphTarget, gamut: GamutId = 'srgb'): MorphMesh {
  const verts = (NR + 1) * NA;
  const pos0 = new Float32Array(verts * 2);
  const pos1 = new Float32Array(verts * 2);
  const color = new Float32Array(verts * 3);
  const index = new Uint16Array(NR * NA * 6);

  for (let j = 0; j <= NR; j++) {
    const frac = j / NR;
    for (let i = 0; i < NA; i++) {
      const a = (i / NA) * 2 * Math.PI;
      const d = hexEdgeDist(a, RADIUS) * frac;
      const x = CENTER_X + d * Math.cos(a);
      const y = CENTER_Y - d * Math.sin(a);
      const c = colorAtPoint(x, y, brightness);
      const m = morphPoint(c.r, c.g, c.b, target, gamut);
      const v = j * NA + i;
      pos0[v * 2] = x; pos0[v * 2 + 1] = y;
      pos1[v * 2] = CENTER_X + RADIUS * m.x;
      pos1[v * 2 + 1] = CENTER_Y - RADIUS * m.y;
      color[v * 3] = c.r / 255; color[v * 3 + 1] = c.g / 255; color[v * 3 + 2] = c.b / 255;
    }
  }
  let k = 0;
  for (let j = 0; j < NR; j++) {
    for (let i = 0; i < NA; i++) {
      const i1 = (i + 1) % NA;
      const a = j * NA + i, b = j * NA + i1, c = (j + 1) * NA + i1, d = (j + 1) * NA + i;
      index[k++] = a; index[k++] = b; index[k++] = c;
      index[k++] = a; index[k++] = c; index[k++] = d;
    }
  }
  return { pos0, pos1, color, index };
}

/*
 * `uOrigin` and `uSize` are the square window of field units the canvas shows.
 * Left at (0, 0) and HEX_SIZE - the defaults - the expression is arithmetically
 * what it was before the window existed, so the hexagon frame is unchanged.
 * The CIE frame pulls the window back to take in the spectral locus, which
 * lives in the same field units once `xyToMorphPoint` has put it there.
 */
const VERT = `#version 300 es
layout(location = 0) in vec2 aPos0;
layout(location = 1) in vec2 aPos1;
layout(location = 2) in vec3 aColor;
uniform float uT;
uniform float uSize;
uniform vec2 uOrigin;
uniform vec2 uCenter;   // what the figure turns about, in field units
uniform float uRot;     // radians, clockwise on screen, to match SVG rotate()
out vec3 vColor;
void main() {
  vec2 q = mix(aPos0, aPos1, uT) - uCenter;
  // Field units have y down, as SVG draws, so this is the same matrix and the
  // same sense of rotation as the overlay's own rotate() - which is the whole
  // requirement: the two layers must turn together, or the outline slides off
  // the paint underneath it.
  float c = cos(uRot), s = sin(uRot);
  q = vec2(c * q.x - s * q.y, s * q.x + c * q.y) + uCenter;
  vec2 p = (q - uOrigin) / uSize * 2.0 - 1.0;
  gl_Position = vec4(p.x, -p.y, 0.0, 1.0);
  vColor = aColor;
}`;

const FRAG = `#version 300 es
precision highp float;
in vec3 vColor;
out vec4 frag;
void main() { frag = vec4(vColor, 1.0); }`;

/** The square of field units the canvas shows, and how far it is turned. */
export interface MorphWindow {
  /** Top-left corner, in field units. */
  x: number;
  y: number;
  /** Side, in field units. */
  size: number;
  /** Degrees clockwise about `rotateAbout`. 0 if omitted. */
  rotate?: number;
  /** What the rotation turns about, in field units. The center if omitted. */
  rotateAbout?: { x: number; y: number };
}

/** What the canvas showed before it could be reframed: the hexagon's own box. */
export const HEX_WINDOW: MorphWindow = { x: 0, y: 0, size: HEX_SIZE };

export interface HexMorphRenderer {
  /** Upload a new field. Cheap enough to call on every brightness change. */
  setMesh(mesh: MorphMesh): void;
  /** One frame at morph position `t`, 0 to 1, framed on `view`. */
  draw(t: number, view?: MorphWindow): void;
  destroy(): void;
}

export function createHexMorphRenderer(canvas: HTMLCanvasElement): HexMorphRenderer | null {
  const gl = canvas.getContext('webgl2', { antialias: true, alpha: true, premultipliedAlpha: false });
  if (!gl) return null;

  function compile(type: number, src: string) {
    const s = gl!.createShader(type)!;
    gl!.shaderSource(s, src); gl!.compileShader(s);
    if (!gl!.getShaderParameter(s, gl!.COMPILE_STATUS)) throw new Error(gl!.getShaderInfoLog(s) ?? 'shader');
    return s;
  }
  const prog = gl.createProgram()!;
  gl.attachShader(prog, compile(gl.VERTEX_SHADER, VERT));
  gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FRAG));
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog) ?? 'link');
  gl.useProgram(prog);
  const uT = gl.getUniformLocation(prog, 'uT');
  const uSize = gl.getUniformLocation(prog, 'uSize');
  const uOrigin = gl.getUniformLocation(prog, 'uOrigin');
  const uCenter = gl.getUniformLocation(prog, 'uCenter');
  const uRot = gl.getUniformLocation(prog, 'uRot');
  gl.uniform1f(uSize, HEX_SIZE);
  gl.uniform2f(uOrigin, 0, 0);
  gl.uniform2f(uCenter, HEX_SIZE / 2, HEX_SIZE / 2);
  gl.uniform1f(uRot, 0);

  const vao = gl.createVertexArray()!;
  gl.bindVertexArray(vao);
  const buf = (loc: number, size: number) => {
    const b = gl!.createBuffer()!;
    gl!.bindBuffer(gl!.ARRAY_BUFFER, b);
    gl!.enableVertexAttribArray(loc);
    gl!.vertexAttribPointer(loc, size, gl!.FLOAT, false, 0, 0);
    return b;
  };
  const b0 = buf(0, 2), b1 = buf(1, 2), bc = buf(2, 3);
  const ib = gl.createBuffer()!;
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ib);
  gl.bindVertexArray(null);

  let count = 0;

  return {
    setMesh(mesh) {
      gl.bindVertexArray(vao);
      gl.bindBuffer(gl.ARRAY_BUFFER, b0); gl.bufferData(gl.ARRAY_BUFFER, mesh.pos0, gl.STATIC_DRAW);
      gl.bindBuffer(gl.ARRAY_BUFFER, b1); gl.bufferData(gl.ARRAY_BUFFER, mesh.pos1, gl.STATIC_DRAW);
      gl.bindBuffer(gl.ARRAY_BUFFER, bc); gl.bufferData(gl.ARRAY_BUFFER, mesh.color, gl.STATIC_DRAW);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ib); gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, mesh.index, gl.STATIC_DRAW);
      gl.bindVertexArray(null);
      count = mesh.index.length;
    },
    draw(t, view = HEX_WINDOW) {
      // The backing store follows the element, capped at 2x: past that the
      // fill rate is spent on pixels nobody can resolve on a figure this size.
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const w = Math.max(1, Math.round(canvas.clientWidth * dpr));
      const h = Math.max(1, Math.round(canvas.clientHeight * dpr));
      if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
      gl.viewport(0, 0, w, h);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      if (!count) return;
      gl.useProgram(prog);
      gl.uniform1f(uSize, view.size);
      gl.uniform2f(uOrigin, view.x, view.y);
      const about = view.rotateAbout ?? { x: view.x + view.size / 2, y: view.y + view.size / 2 };
      gl.uniform2f(uCenter, about.x, about.y);
      gl.uniform1f(uRot, ((view.rotate ?? 0) * Math.PI) / 180);
      gl.uniform1f(uT, t);
      gl.bindVertexArray(vao);
      gl.drawElements(gl.TRIANGLES, count, gl.UNSIGNED_SHORT, 0);
      gl.bindVertexArray(null);
    },
    // Same reasoning as cubeRenderer's: StrictMode mounts twice and a lost
    // context hands the second mount a dead one.
    destroy() { gl.bindVertexArray(null); },
  };
}
