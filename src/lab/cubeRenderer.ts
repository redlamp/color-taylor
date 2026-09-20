/**
 * The RGB cube as little cubes, drawn with raw WebGL2 so the lab owes nothing
 * to a scene graph.
 *
 * Position is colour. One little cube per hex step, from a #00 cube at the
 * origin to a #FF cube at the far corner, each drawn flat in exactly the value
 * it stands for and separated from its neighbours by a gap and a dark rim.
 * A colour shows floor(value / step) + 1 whole cubes per channel - the steps
 * work in chunks, and black is still one cube. Nothing here is lit: a face's
 * colour is its place, and light would read as a fourth thing.
 *
 * Over that, the three axes, each in its channel's colour.
 *
 * The same cubes can be re-measured as HSB or HSL: keep each cube's offset
 * from the black-to-white diagonal (its hue and chroma, and so the hexagon),
 * and replace its height along the diagonal with max(r,g,b) for HSB - the
 * hexcone - or (max+min)/2 for HSL - the double hexcone. Three positions,
 * mixed by weights in the vertex shader, so the morph animates for free.
 */

/** The size of one little cube, in 8-bit units: #33 (6 a side), #11 (16 a side) or #01 (256 a side). */
export type CubeStep = 51 | 17 | 1;
/** Which way is up: the black-to-white diagonal (lightness), or one of the channels. */
export type UpAxis = 'neutral' | 'r' | 'g' | 'b';
export type Shape = 'cube' | 'hsb' | 'hsl';

/**
 * A polyline in chromaticity coordinates, laid on the xyY solid's floor: the
 * spectral locus and the gamut triangles. Given as (x, y) pairs because that
 * is what the floor is - `xyYToWorld` puts them in the scene.
 */
export interface FloorPath {
  points: ReadonlyArray<readonly [number, number]>;
  colour: [number, number, number];
  closed?: boolean;
  /** Rod thickness in pixels. 3 if omitted. */
  widthPx?: number;
  /**
   * A luminance per point, so a path can leave the floor. Two points and
   * `heights: [0, Y]` is a drop line from a colour down to its chromaticity,
   * which is the one thing the flat diagram cannot draw.
   */
  heights?: readonly number[];
  /**
   * Drawn with the depth test off, over everything. A drop line is inside the
   * solid by construction - that is what it means - so depth-tested it is
   * invisible in every case it exists for.
   */
  onTop?: boolean;
}

export interface CubeParams {
  /** 0..1 each */
  rgb: [number, number, number];
  cubes: boolean;
  /** In the cube shape: little cubes, or dots like the cones. */
  cubeStyle: 'cubes' | 'dots';
  cubeStep: CubeStep;
  /**
   * A step-size tween in progress: the finer grid unpacks from the centres of
   * its parent cubes in the coarser grid while the coarser grid shrinks away.
   * `unpack` is 0 with the fine steps packed at their parents, 1 settled.
   */
  stepTween: { fine: CubeStep; coarse: CubeStep; unpack: number } | null;
  /** Gap between little cubes, as a fraction of a cube. */
  gap: number;
  /** Dark rim on each face, as a fraction of the cube, and how dark. */
  edge: number;
  edgeDark: number;
  /** Outline round the cube the colour stands in: black on a light colour, white on a dark one. Width in px. */
  outline: boolean;
  outlineW: number;
  /** Point sprite size, as a multiple of the step. */
  pointScale: number;
  /**
   * The selected colour's marker, as a multiple of the size the grid step
   * gives it. 1 - the default - is the grid's own size, which is what a cube
   * you can count the cells of wants. A solid drawn at 256 steps needs more:
   * one step is a pixel there, and the marker is the whole point.
   */
  markerScale: number;

  /** Orthographic only: the hexagon is a property of a parallel projection. */
  up: UpAxis;
  /** The three axes, each in its channel's colour. */
  axes: boolean;
  /** Weights on the cube, HSB cone and HSL bicone positions; sum to 1. */
  shapeW: [number, number, number];
  /**
   * A fourth arm, mixed over whatever `shapeW` produced: the CIE xyY solid.
   * 0 leaves the three shapes above exactly as they were - the shader returns
   * early rather than blending, so this is off, not off-by-a-float.
   *
   * It is the same cloud of colours under a *central* projection from black
   * rather than a parallel one along the diagonal: chromaticity on the floor,
   * relative luminance Y up the neutral axis. The chromaticity is scaled by
   * XYY_SCALE so the sRGB triangle covers about the footprint the hexagon
   * does, which is what makes the two comparable at a glance.
   */
  xyYMix: number;
  /**
   * Which cells to draw. `toColor` keeps the box from black to the selected
   * colour - the cube's cutaway, and the default. `all` draws the whole gamut,
   * which is what a solid has to show if its roof height is the point.
   */
  reveal: 'toColor' | 'all';
  /** Drawn flat on the solid's floor while `xyYMix` is up. Null draws none. */
  xyYFloor: FloorPath[] | null;
  /** Orbit: azimuth and elevation in radians, a zoom factor, and the point orbited. */
  theta: number;
  phi: number;
  zoom: number;
  focus: [number, number, number];
  /** Clear colour, 0..1. */
  ground: [number, number, number];
}

export const DEFAULT_PARAMS: CubeParams = {
  rgb: [1, 0, 1],
  cubes: true, cubeStyle: 'cubes', cubeStep: 17, stepTween: null, gap: 0.02, edge: 0.04, edgeDark: 0.1, outline: true, outlineW: 2, pointScale: 1, markerScale: 1,
  up: 'neutral', axes: true, shapeW: [1, 0, 0], xyYMix: 0, reveal: 'toColor', xyYFloor: null,
  theta: Math.PI / 2, phi: Math.PI / 2, zoom: 0.75, focus: [0.5, 0.5, 0.5],
  ground: [0x20 / 255, 0x20 / 255, 0x20 / 255],   // #202020
};

/**
 * The CIE xyY arm, shared verbatim by the cube shader and the point shader so
 * the two can never disagree about where a colour stands.
 *
 * The matrix is `SRGB_TO_XYZ_D65` from src/utils/cie.ts, column-major as GLSL
 * wants it, and the decode is the same piecewise sRGB transfer function
 * src/components/hex/hexShader.ts encodes with, run backwards. Everything up
 * to the divide is linear light; the divide by X+Y+Z is the central projection
 * from black, and what it throws away - the scale of the colour - is exactly
 * what Y is put back on the vertical axis to hold.
 *
 * The screen basis is the hexagon's: red east, so the two pictures are the
 * same way round, with the neutral axis up.
 */
export const XYY_GLSL = `
uniform float uXyY;          // 0 the RGB-shaped solids; 1 the CIE xyY solid
const mat3 RGB_TO_XYZ = mat3(
  0.41239080, 0.21263901, 0.01933082,
  0.35758434, 0.71516868, 0.11919478,
  0.18048079, 0.07219232, 0.95053215);
const float XY_SCALE = 2.5;  // must match XYY_SCALE below
vec3 placeXyY(vec3 v) {
  vec3 c = clamp(v, 0.0, 1.0);
  vec3 lin = mix(c / 12.92, pow((c + 0.055) / 1.055, vec3(2.4)), step(vec3(0.04045), c));
  vec3 XYZ = RGB_TO_XYZ * lin;
  float s = XYZ.x + XYZ.y + XYZ.z;
  // Black is the one colour with no chromaticity - every ray meets at the
  // origin - so it stands on the white point, at height zero.
  vec2 xy = s > 1e-7 ? XYZ.xy / s : vec2(0.3127, 0.3290);
  vec3 n  = vec3(0.57735027);
  vec3 e1 = vec3(0.81649658, -0.40824829, -0.40824829);
  vec3 e2 = vec3(0.0, 0.70710678, -0.70710678);
  return e1 * ((xy.x - 0.3127) * XY_SCALE)
       + e2 * ((xy.y - 0.3290) * XY_SCALE)
       + n  * (XYZ.y * 1.73205081);
}
`;

const VERT = `#version 300 es
layout(location=0) in vec3 aPos;
layout(location=1) in vec3 aNrm;
layout(location=2) in vec3 aOff;   // per-instance, zero for plain draws
uniform mat4 uProj, uView, uModel;
uniform float uQuant;       // cubes a side; 0 for plain draws
uniform float uCellSz;      // 1 / uQuant
uniform vec3  uShapeW;      // weights: cube, HSB cone, HSL bicone
uniform float uUnpack;      // 1 settled; below that, mixed toward the parent cube in the coarser grid
uniform float uCoarseStep;  // the coarser grid's step, 8-bit units
uniform float uCoarseN;     // the coarser grid's cubes a side
out vec3 vPos; out vec3 vNrm; flat out vec3 vCol;
${XYY_GLSL}
// Where a value sits in each model, mixed by the shape weights. The offset
// from the diagonal is kept - hue and chroma, the hexagon - and only the
// height changes: max for HSB (the hexcone), (max+min)/2 for HSL (the double
// hexcone).
vec3 place(vec3 v, vec3 cube) {
  vec3 n = normalize(vec3(1.0));
  vec3 q = v - dot(v, n) * n;
  float hi = max(v.r, max(v.g, v.b)), lo = min(v.r, min(v.g, v.b));
  vec3 cHsb = q + hi * sqrt(3.0) * n;
  vec3 cHsl = q + (hi + lo) * 0.5 * sqrt(3.0) * n;
  vec3 base = uShapeW.x * cube + uShapeW.y * cHsb + uShapeW.z * cHsl;
  // Returned early rather than blended through: with the arm off, the three
  // shapes above come out bit for bit what they were before it existed.
  if (uXyY <= 0.0) return base;
  return mix(base, placeXyY(v), uXyY);
}
void main() {
  vec4 local = uModel * vec4(aPos, 1.0);
  vec3 w;
  if (uQuant > 0.0) {
    // The cube's value, from its own offset - never from a face position,
    // which sits on a cell boundary and rounds either way.
    vCol = round(aOff * uQuant) / (uQuant - 1.0);
    vec3 centre = place(vCol, aOff + uCellSz * 0.5);
    if (uUnpack < 1.0) {
      // the parent cube in the coarser grid: the value floored to its step
      vec3 pi = floor((vCol * 255.0 + 0.5) / uCoarseStep);
      vec3 parent = place(pi * uCoarseStep / 255.0, (pi + 0.5) / uCoarseN);
      centre = mix(parent, centre, uUnpack);
    }
    w = centre + (local.xyz - uCellSz * 0.5);
  } else {
    vCol = vec3(0.0);
    w = local.xyz + aOff;
  }
  vPos = w;
  vNrm = normalize(mat3(uModel) * aNrm);
  gl_Position = uProj * uView * vec4(w, 1.0);
}`;

export const FRAG = `#version 300 es
precision highp float;
in vec3 vPos; in vec3 vNrm; flat in vec3 vCol;
out vec4 frag;
uniform int   uKind;        // 0 little cube, 1 flat colour, 2 little sphere
uniform vec3  uViewDir;     // toward the eye; orthographic, so one direction for the whole frame
uniform vec3  uFlat;
uniform float uCell;        // cell size, for the rim pattern
uniform float uInset;       // how far the cube is shrunk into its cell, as a fraction of the cell
uniform float uEdge, uEdgeDark;
void main() {
  if (uKind == 1) { frag = vec4(uFlat, 1.0); return; }
  vec3 col = clamp(vCol, 0.0, 1.0);
  if (uKind == 2) {
    // a sphere in its value, darkened only at the silhouette - the cube rim's
    // counterpart, view-dependent but not lit
    float k = smoothstep(0.55, 1.0, 1.0 - abs(dot(normalize(vNrm), uViewDir)));
    frag = vec4(mix(col, col * (1.0 - uEdgeDark), k), 1.0);
    return;
  }
  vec3 p = vPos;
  if (uEdge > 0.0) {
    vec3 N = abs(normalize(vNrm));
    vec3 q = fract(p / uCell);
    // distance to the rim of the shrunk cube, ignoring the axis this face is perpendicular to
    vec3 t = max(min(q, 1.0 - q) - uInset, 0.0) * uCell;
    vec3 tt = mix(t, vec3(9.0), step(0.5, N));
    float e = min(tt.x, min(tt.y, tt.z));
    float k = 1.0 - smoothstep(0.0, uEdge, e);
    col = mix(col, col * (1.0 - uEdgeDark), k);
  }
  frag = vec4(col, 1.0);
}`;

/**
 * At 256 steps per axis the grid is 16.7M cells, so each step is a point
 * sprite instead: one vertex, no geometry, and no buffer either - the vertex
 * decodes its own grid index from gl_VertexID. The interior is thinned to
 * every fourth step; the surface of the filled box is always kept.
 */
const PVERT = `#version 300 es
uniform mat4 uProj, uView;
uniform float uN;           // steps per axis
uniform vec3  uIdx;         // the selected step's index: cubes above it in any channel are hidden
uniform vec3  uShapeW;      // weights: cube, HSB cone, HSL bicone
uniform float uPx;          // point size in pixels
uniform float uThin;        // keep interior steps whose index is a multiple of this
uniform float uUnpack, uCoarseStep, uCoarseN;   // as in the cube shader
flat out vec3 vCol;
${XYY_GLSL}
vec3 place(vec3 v, vec3 cube) {
  vec3 n = normalize(vec3(1.0));
  vec3 q = v - dot(v, n) * n;
  float hi = max(v.r, max(v.g, v.b)), lo = min(v.r, min(v.g, v.b));
  vec3 base = uShapeW.x * cube + uShapeW.y * (q + hi * sqrt(3.0) * n) + uShapeW.z * (q + (hi + lo) * 0.5 * sqrt(3.0) * n);
  if (uXyY <= 0.0) return base;
  return mix(base, placeXyY(v), uXyY);
}
void main() {
  float id = float(gl_VertexID), n = uN;
  vec3 g = vec3(mod(id, n), mod(floor(id / n), n), floor(id / (n * n)));
  bool hidden = any(greaterThan(g, uIdx + 0.5));
  bool surface = any(lessThan(g, vec3(0.5))) || any(greaterThan(g, uIdx - 0.5));
  bool thinned = !surface && any(greaterThan(mod(g, uThin), vec3(0.5)));
  if (hidden || thinned) { gl_Position = vec4(2.0, 2.0, 2.0, 1.0); gl_PointSize = 0.0; vCol = vec3(0.0); return; }
  vec3 v = g / (n - 1.0);
  vCol = v;
  vec3 c = place(v, (g + 0.5) / n);
  if (uUnpack < 1.0) {
    vec3 pi = floor((v * 255.0 + 0.5) / uCoarseStep);
    c = mix(place(pi * uCoarseStep / 255.0, (pi + 0.5) / uCoarseN), c, uUnpack);
  }
  gl_Position = uProj * uView * vec4(c, 1.0);
  gl_PointSize = uPx;
}`;

const PFRAG = `#version 300 es
precision highp float;
flat in vec3 vCol;
uniform float uPx, uEdgeDark;
out vec4 frag;
void main() {
  // round once there is room for it, with the same silhouette darkening the spheres get
  vec2 d = gl_PointCoord - 0.5;
  float r2 = dot(d, d);
  if (uPx > 2.5 && r2 > 0.25) discard;
  float k = uPx > 4.0 ? smoothstep(0.14, 0.25, r2) : 0.0;
  frag = vec4(mix(vCol, vCol * (1.0 - uEdgeDark), k), 1.0);
}`;

type V3 = [number, number, number];
const v3 = {
  add: (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]],
  sub: (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]],
  mul: (a: V3, s: number): V3 => [a[0] * s, a[1] * s, a[2] * s],
  dot: (a: V3, b: V3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2],
  cross: (a: V3, b: V3): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]],
  norm: (a: V3): V3 => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; },
};
// column-major mat4
const M = {
  ident: () => [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1],
  ortho(h: number, aspect: number, n: number, f: number) {
    const w = h * aspect;
    return [1 / w, 0, 0, 0, 0, 1 / h, 0, 0, 0, 0, -2 / (f - n), 0, 0, 0, -(f + n) / (f - n), 1];
  },
  basisAt: (x: V3, y: V3, z: V3, o: V3) => [x[0], x[1], x[2], 0, y[0], y[1], y[2], 0, z[0], z[1], z[2], 0, o[0], o[1], o[2], 1],
  scaleTrans: (s: V3, o: V3) => [s[0], 0, 0, 0, 0, s[1], 0, 0, 0, 0, s[2], 0, o[0], o[1], o[2], 1],
};

const UPS: Record<UpAxis, V3> = { neutral: v3.norm([1, 1, 1]), r: [1, 0, 0], g: [0, 1, 0], b: [0, 0, 1] };

/**
 * How far the chromaticity plane is blown up to sit under the solid.
 *
 * The hexagon's red vertex is `sqrt(6)/3 = 0.8165` from its centre; red's
 * chromaticity is 0.3273 from D65. 2.5 puts the triangle's red corner at
 * 0.8183 - a quarter of a percent past the hexagon's - so the two pictures are
 * drawn at one scale and the eye can compare them directly. A round number
 * rather than the exact ratio, because the ratio is not a constant of
 * anything: the other five corners land wherever they land, and that is the
 * lesson.
 */
export const XYY_SCALE = 2.5;
const N_AXIS: V3 = v3.norm([1, 1, 1]);
/** Red east and the neutral up, the same screen basis the hexagon is built on. */
const E1: V3 = v3.norm([2, -1, -1]);
const E2: V3 = v3.cross(N_AXIS, E1);
const D65: [number, number] = [0.3127, 0.3290];

/**
 * A chromaticity and a luminance, in the scene's world space. The TS twin of
 * `placeXyY` in XYY_GLSL - the two have to agree, because this is what draws
 * the floor the shader stands the solid on.
 */
export function xyYToWorld(x: number, y: number, Y: number): V3 {
  return v3.add(
    v3.add(v3.mul(E1, (x - D65[0]) * XYY_SCALE), v3.mul(E2, (y - D65[1]) * XYY_SCALE)),
    v3.mul(N_AXIS, Y * Math.sqrt(3)),
  );
}

interface Mesh { vao: WebGLVertexArrayObject; n: number; pb: WebGLBuffer; nb: WebGLBuffer; ib: WebGLBuffer }

export interface CubeRenderer {
  render(p: CubeParams): void;
  destroy(): void;
}

export function createCubeRenderer(canvas: HTMLCanvasElement): CubeRenderer | null {
  const gl = canvas.getContext('webgl2', { antialias: true, alpha: false });
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
  const U: Record<string, WebGLUniformLocation | null> = {};
  for (const n of ['uProj', 'uView', 'uModel', 'uKind', 'uFlat', 'uQuant', 'uCellSz', 'uShapeW', 'uXyY', 'uViewDir', 'uCell', 'uInset', 'uEdge', 'uEdgeDark', 'uUnpack', 'uCoarseStep', 'uCoarseN']) U[n] = gl.getUniformLocation(prog, n);
  const pprog = gl.createProgram()!;
  gl.attachShader(pprog, compile(gl.VERTEX_SHADER, PVERT));
  gl.attachShader(pprog, compile(gl.FRAGMENT_SHADER, PFRAG));
  gl.linkProgram(pprog);
  if (!gl.getProgramParameter(pprog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(pprog) ?? 'link');
  const PU: Record<string, WebGLUniformLocation | null> = {};
  for (const n of ['uProj', 'uView', 'uN', 'uIdx', 'uShapeW', 'uXyY', 'uPx', 'uThin', 'uEdgeDark', 'uUnpack', 'uCoarseStep', 'uCoarseN']) PU[n] = gl.getUniformLocation(pprog, n);
  const emptyVao = gl.createVertexArray()!;

  function mesh(pos: number[], nrm: number[], idx: number[]): Mesh {
    const vao = gl!.createVertexArray()!; gl!.bindVertexArray(vao);
    const pb = gl!.createBuffer()!; gl!.bindBuffer(gl!.ARRAY_BUFFER, pb); gl!.bufferData(gl!.ARRAY_BUFFER, new Float32Array(pos), gl!.STATIC_DRAW);
    gl!.enableVertexAttribArray(0); gl!.vertexAttribPointer(0, 3, gl!.FLOAT, false, 0, 0);
    const nb = gl!.createBuffer()!; gl!.bindBuffer(gl!.ARRAY_BUFFER, nb); gl!.bufferData(gl!.ARRAY_BUFFER, new Float32Array(nrm), gl!.STATIC_DRAW);
    gl!.enableVertexAttribArray(1); gl!.vertexAttribPointer(1, 3, gl!.FLOAT, false, 0, 0);
    const ib = gl!.createBuffer()!; gl!.bindBuffer(gl!.ELEMENT_ARRAY_BUFFER, ib); gl!.bufferData(gl!.ELEMENT_ARRAY_BUFFER, new Uint16Array(idx), gl!.STATIC_DRAW);
    gl!.bindVertexArray(null);
    return { vao, n: idx.length, pb, nb, ib };
  }

  // Unit cube, outward normals, CCW seen from outside.
  const CUBE = (() => {
    const pos: number[] = [], nrm: number[] = [], idx: number[] = [];
    for (let a = 0; a < 3; a++) for (let s = 0; s < 2; s++) {
      const u = (a + 1) % 3, v = (a + 2) % 3;
      const n = [0, 0, 0]; n[a] = s ? 1 : -1;
      const base = pos.length / 3;
      for (const [uu, vv] of [[0, 0], [1, 0], [1, 1], [0, 1]]) {
        const p = [0, 0, 0]; p[a] = s; p[u] = uu; p[v] = vv;
        pos.push(...p); nrm.push(...n);
      }
      if (s) idx.push(base, base + 1, base + 2, base, base + 2, base + 3);
      else idx.push(base, base + 2, base + 1, base, base + 3, base + 2);
    }
    return mesh(pos, nrm, idx);
  })();
  // A small sphere, unit radius, for the cone modes. Low poly on purpose: it
  // is instanced hundreds of thousands of times at 256 a side.
  const SPHERE = ((rings: number, segs: number) => {
    const pos: number[] = [], nrm: number[] = [], idx: number[] = [];
    for (let i = 0; i <= rings; i++) {
      const th = Math.PI * i / rings;
      for (let j = 0; j <= segs; j++) {
        const ph = 2 * Math.PI * j / segs;
        const x = Math.sin(th) * Math.cos(ph), y = Math.cos(th), z = Math.sin(th) * Math.sin(ph);
        pos.push(x, y, z); nrm.push(x, y, z);
      }
    }
    for (let i = 0; i < rings; i++) for (let j = 0; j < segs; j++) {
      const a = i * (segs + 1) + j, b = a + segs + 1;
      idx.push(a, a + 1, b, b, a + 1, b + 1);
    }
    return mesh(pos, nrm, idx);
  })(7, 12);

  // The cube and the sphere again with a per-instance offset: the whole grid
  // in one draw. Both VAOs read the same offset buffer.
  gl.vertexAttrib3f(2, 0, 0, 0);
  const offsetBuf = gl.createBuffer()!;
  const INST = (() => {
    const vao = gl!.createVertexArray()!; gl!.bindVertexArray(vao);
    gl!.bindBuffer(gl!.ARRAY_BUFFER, CUBE.pb); gl!.enableVertexAttribArray(0); gl!.vertexAttribPointer(0, 3, gl!.FLOAT, false, 0, 0);
    gl!.bindBuffer(gl!.ARRAY_BUFFER, CUBE.nb); gl!.enableVertexAttribArray(1); gl!.vertexAttribPointer(1, 3, gl!.FLOAT, false, 0, 0);
    gl!.bindBuffer(gl!.ARRAY_BUFFER, offsetBuf); gl!.enableVertexAttribArray(2); gl!.vertexAttribPointer(2, 3, gl!.FLOAT, false, 0, 0);
    gl!.vertexAttribDivisor(2, 1);
    gl!.bindBuffer(gl!.ELEMENT_ARRAY_BUFFER, CUBE.ib);
    gl!.bindVertexArray(null);
    return { vao, ob: offsetBuf, n: 0, key: '' };
  })();
  function frame(p: CubeParams) {
    const up = UPS[p.up];
    let east: V3 = [1, 0, 0];
    east = v3.sub(east, v3.mul(up, v3.dot(east, up)));
    if (Math.hypot(...east) < 1e-4) east = [0, 0, 1];   // red is up: green points right instead
    east = v3.norm(east);
    const third = v3.cross(east, up);
    return { up, east, third };
  }
  function eyeDir(p: CubeParams): V3 {
    const { up, east, third } = frame(p);
    const c = Math.cos(p.phi), s = Math.sin(p.phi);
    return v3.norm(v3.add(v3.mul(v3.add(v3.mul(east, Math.cos(p.theta)), v3.mul(third, Math.sin(p.theta))), c), v3.mul(up, s)));
  }

  function draw(m: Mesh, model: number[], kind: number, flat?: V3) {
    gl!.uniformMatrix4fv(U.uModel, false, model);
    gl!.uniform1i(U.uKind, kind);
    if (flat) gl!.uniform3fv(U.uFlat, flat);
    gl!.bindVertexArray(m.vao);
    gl!.drawElements(gl!.TRIANGLES, m.n, gl!.UNSIGNED_SHORT, 0);
  }
  /** Full-saturation, full-value colour at a hue, degrees. */
  function hsvToRgb(h: number): V3 {
    const k = (n: number) => (n + h / 60) % 6;
    const f = (n: number) => 1 - Math.max(0, Math.min(k(n), 4 - k(n), 1));
    return [f(5), f(3), f(1)];
  }
  /** A rod from a to b, thickness t, flat colour: a cube stretched along the segment. */
  function rod(a: V3, b: V3, t: number, colour: V3) {
    const d = v3.sub(b, a);
    const len = Math.hypot(...d);
    if (len < 1e-6) return;
    const dir = v3.mul(d, 1 / len);
    let u: V3 = Math.abs(dir[0]) < 0.9 ? [1, 0, 0] : [0, 1, 0];
    u = v3.norm(v3.sub(u, v3.mul(dir, v3.dot(u, dir))));
    const v = v3.cross(dir, u);
    const o = v3.sub(v3.sub(a, v3.mul(u, t / 2)), v3.mul(v, t / 2));
    draw(CUBE, M.basisAt(v3.mul(dir, len), v3.mul(u, t), v3.mul(v, t), o), 1, colour);
  }

  function render(p: CubeParams) {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = Math.round(canvas.clientWidth * dpr), h = Math.round(canvas.clientHeight * dpr);
    if (!w || !h) return;
    if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
    const aspect = w / h;
    const dir = eyeDir(p);
    const dist = 6;
    const eye = v3.add(p.focus, v3.mul(dir, dist));
    // The view basis comes from the orbit angles, not from a lookAt with a
    // global up: screen-right depends on the azimuth alone, so the top-down
    // view is continuous with however you arrived and there is no pole to snap
    // at. At theta = pi/2 looking down, red points right - the hexagon.
    const fr = frame(p);
    const x = v3.norm(v3.sub(v3.mul(fr.east, Math.sin(p.theta)), v3.mul(fr.third, Math.cos(p.theta))));
    const y = v3.cross(dir, x);
    const view = [x[0], y[0], dir[0], 0, x[1], y[1], dir[1], 0, x[2], y[2], dir[2], 0, -v3.dot(x, eye), -v3.dot(y, eye), -v3.dot(dir, eye), 1];
    const proj = M.ortho(1.0 / p.zoom, aspect, 0.01, 20);
    const pxPerUnit = (h / 2) * p.zoom, wpp = 1 / pxPerUnit;

    gl!.viewport(0, 0, w, h);
    gl!.clearColor(p.ground[0], p.ground[1], p.ground[2], 1);
    gl!.enable(gl!.DEPTH_TEST); gl!.depthFunc(gl!.LEQUAL);
    gl!.disable(gl!.BLEND); gl!.disable(gl!.CULL_FACE);
    gl!.clear(gl!.COLOR_BUFFER_BIT | gl!.DEPTH_BUFFER_BIT);
    gl!.uniformMatrix4fv(U.uProj, false, proj);
    gl!.uniformMatrix4fv(U.uView, false, view);
    gl!.uniform3fv(U.uViewDir, dir);

    const c = p.rgb;

    // ── the little cubes ──────────────────────────────────────────────
    /**
     * One grid. `shrink` scales its cells down (the coarser grid leaving during
     * a step tween); `parent` packs its cells toward the coarser grid by
     * `unpack` (the finer grid arriving).
     */
    const drawGrid = (step: CubeStep, shrink: number, parent: { step: CubeStep; unpack: number } | null) => {
      const N = 255 / step + 1, sz = 1 / N;
      const g = sz * pxPerUnit < 6 || p.gap <= 0 ? 0 : Math.max(p.gap, wpp / sz);
      const edge = sz * pxPerUnit < 3 || p.edge <= 0 ? 0 : Math.max(p.edge * sz, wpp);
      const idx = c.map((x) => Math.floor(Math.round(x * 255) / step));
      // `all` draws the whole gamut; the marker still stands on `idx`.
      const all = p.reveal === 'all';
      const visIdx = all ? [N - 1, N - 1, N - 1] : idx;
      const hidden = all
        ? () => false
        : (a: number, b: number, d: number) => a > idx[0] || b > idx[1] || d > idx[2];
      const fs = sz * (1 - g), fo = sz * g / 2;
      const wc = p.shapeW[0];
      const pointW = N > 16 || p.cubeStyle === 'dots' ? 1 : 1 - wc;
      const pointPx = sz * pxPerUnit * p.pointScale * pointW * shrink;
      const unpack = parent ? parent.unpack : 1;
      const coarseStep = parent ? parent.step : step, coarseN = 255 / coarseStep + 1;
      gl!.enable(gl!.CULL_FACE); gl!.cullFace(gl!.BACK);
      if (pointW > 0.01 && pointPx > 0.3) {
        // Point sprites, one per step, decoded from the vertex number.
        gl!.useProgram(pprog);
        gl!.uniformMatrix4fv(PU.uProj, false, proj); gl!.uniformMatrix4fv(PU.uView, false, view);
        gl!.uniform1f(PU.uN, N); gl!.uniform3fv(PU.uIdx, visIdx); gl!.uniform3fv(PU.uShapeW, p.shapeW);
        gl!.uniform1f(PU.uXyY, p.xyYMix);
        gl!.uniform1f(PU.uPx, Math.max(1.5, pointPx)); gl!.uniform1f(PU.uThin, N > 16 ? 4 : 1); gl!.uniform1f(PU.uEdgeDark, p.edgeDark);
        gl!.uniform1f(PU.uUnpack, unpack); gl!.uniform1f(PU.uCoarseStep, coarseStep); gl!.uniform1f(PU.uCoarseN, coarseN);
        gl!.bindVertexArray(emptyVao);
        gl!.drawArrays(gl!.POINTS, 0, N * N * N);
        gl!.useProgram(prog);
      }
      if (N <= 16 && p.cubeStyle === 'cubes' && wc > 0.01 && shrink > 0.01) {
        const key = `${step}|${all ? 'all' : idx.join()}`;
        if (key !== INST.key) {
          // Every cell. In the cube the interior is never seen, but in the
          // cones the greys along the axis are interior cells of the box.
          const offs: number[] = [];
          for (let a = 0; a < N; a++) for (let b = 0; b < N; b++) for (let d = 0; d < N; d++) {
            if (!hidden(a, b, d)) offs.push(a * sz, b * sz, d * sz);
          }
          gl!.bindBuffer(gl!.ARRAY_BUFFER, INST.ob);
          gl!.bufferData(gl!.ARRAY_BUFFER, new Float32Array(offs), gl!.DYNAMIC_DRAW);
          INST.n = offs.length / 3; INST.key = key;
        }
        gl!.uniform1f(U.uQuant, N); gl!.uniform1f(U.uCellSz, sz); gl!.uniform3fv(U.uShapeW, p.shapeW);
        gl!.uniform1f(U.uXyY, p.xyYMix); gl!.uniform1f(U.uEdgeDark, p.edgeDark);
        gl!.uniform1f(U.uUnpack, unpack); gl!.uniform1f(U.uCoarseStep, coarseStep); gl!.uniform1f(U.uCoarseN, coarseN);
        const cs = fs * wc * shrink, co = fo + (fs - cs) / 2;
        gl!.uniform1i(U.uKind, 0);
        gl!.uniform1f(U.uCell, sz); gl!.uniform1f(U.uInset, (sz - cs) / 2 / sz);
        gl!.uniform1f(U.uEdge, edge);
        gl!.uniformMatrix4fv(U.uModel, false, M.scaleTrans([cs, cs, cs], [co, co, co]));
        gl!.bindVertexArray(INST.vao);
        gl!.drawElementsInstanced(gl!.TRIANGLES, CUBE.n, gl!.UNSIGNED_SHORT, 0, INST.n);
      }
      return { N, sz, idx, fs, fo, wc, pointW, edge };
    };

    if (p.cubes) {
      const tw = p.stepTween;
      // During a tween the grid being arrived at draws last, so it sits over
      // the one leaving: fine over coarse going finer, coarse over fine going
      // coarser - the small dots return underneath the big ones.
      let G;
      if (!tw) G = drawGrid(p.cubeStep, 1, null);
      else if (p.cubeStep === tw.fine) {
        drawGrid(tw.coarse, 1 - tw.unpack, null);
        G = drawGrid(tw.fine, 1, { step: tw.coarse, unpack: tw.unpack });
      } else {
        drawGrid(tw.fine, 1, { step: tw.coarse, unpack: tw.unpack });
        G = drawGrid(tw.coarse, 1 - tw.unpack, null);
      }
      const { N, sz, idx, fs, fo, wc, pointW, edge } = G;
      // the outline path below needs these on the main program whichever drew the grid
      gl!.uniform1f(U.uQuant, N); gl!.uniform1f(U.uCellSz, sz); gl!.uniform3fv(U.uShapeW, p.shapeW);
      gl!.uniform1f(U.uXyY, p.xyYMix);
      gl!.uniform1f(U.uEdgeDark, p.edgeDark); gl!.uniform1f(U.uUnpack, 1);

      if (p.outline && p.outlineW > 0) {
        // inverted hull: the selected cube again, a few pixels bigger, back
        // faces only, flat - an outline that sits behind the cube
        // Through the same instance path as the cubes, with the selected cube's
        // offset as the generic attribute, so it morphs with its cube.
        const ow = p.outlineW * wpp;
        const lum = 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
        const ink: V3 = lum > 0.45 ? [0.04, 0.05, 0.06] : [0.97, 0.98, 1.0];
        // On top of everything: the hull as a filled silhouette with the depth
        // test off, then the cell itself over it, so a colour deep inside the
        // solid still shows, outlined.
        gl!.vertexAttrib3f(2, idx[0] * sz, idx[1] * sz, idx[2] * sz);
        gl!.disable(gl!.DEPTH_TEST);
        const cubeW = N > 16 || p.cubeStyle === 'dots' ? 0 : wc;
        const cs = fs * cubeW, co = fo + (fs - cs) / 2;
        const r = Math.max(0.75 * wpp, (sz * p.pointScale * pointW) / 2) * p.markerScale, h2 = sz / 2;
        if (cubeW > 0.01) draw(CUBE, M.scaleTrans([cs + 2 * ow, cs + 2 * ow, cs + 2 * ow], [co - ow, co - ow, co - ow]), 1, ink);
        if (pointW > 0.01) draw(SPHERE, M.scaleTrans([r + ow, r + ow, r + ow], [h2, h2, h2]), 1, ink);
        if (cubeW > 0.01) {
          gl!.uniform1i(U.uKind, 0);
          gl!.uniform1f(U.uCell, sz); gl!.uniform1f(U.uInset, (sz - cs) / 2 / sz); gl!.uniform1f(U.uEdge, edge);
          draw(CUBE, M.scaleTrans([cs, cs, cs], [co, co, co]), 0);
        }
        if (pointW > 0.01) draw(SPHERE, M.scaleTrans([r, r, r], [h2, h2, h2]), 2);
        gl!.enable(gl!.DEPTH_TEST);
        gl!.vertexAttrib3f(2, 0, 0, 0);
      }
      gl!.disable(gl!.CULL_FACE);
      gl!.uniform1f(U.uQuant, 0);
    }

    // ── axes, each in its channel's colour ────────────────────────────
    // Rods four pixels thick (WebGL lines are one pixel), depth-tested so they
    // sit below the cubes rather than over them. The RGB axes belong to the
    // cube and fade out with it; the cones get a hue ring through the six
    // pure hues and a brightness / lightness axis up the middle.
    if (p.axes && p.xyYMix < 0.99) {
      const wc = p.shapeW[0];
      if (wc > 0.01) {
        const t = 4 * wpp * wc, h2 = t / 2;
        draw(CUBE, M.scaleTrans([1, t, t], [0, -h2, -h2]), 1, [0.9, 0.2, 0.2]);
        draw(CUBE, M.scaleTrans([t, 1, t], [-h2, 0, -h2]), 1, [0.2, 0.8, 0.2]);
        draw(CUBE, M.scaleTrans([t, t, 1], [-h2, -h2, 0]), 1, [0.35, 0.45, 1]);
      }
      if (wc < 0.99) {
        const t = 4 * wpp * (1 - wc);
        const n = v3.norm([1, 1, 1]);
        // the ring's height: white's plane for HSB, the equator for HSL
        const hRing = (p.shapeW[1] * 1 + p.shapeW[2] * 0.5) / (p.shapeW[1] + p.shapeW[2] || 1) * Math.sqrt(3);
        const at = (hue: number): V3 => {
          const c = hsvToRgb(hue);
          const q = v3.sub(c, v3.mul(n, v3.dot(c, n)));
          return v3.add(q, v3.mul(n, hRing));
        };
        const SEG = 36;
        for (let i = 0; i < SEG; i++) {
          const a0 = (i / SEG) * 360, a1 = ((i + 1) / SEG) * 360;
          rod(at(a0), at(a1), t, hsvToRgb((a0 + a1) / 2));
        }
        // black to white through the middle, in grey steps
        const STEPS = 16;
        for (let i = 0; i < STEPS; i++) {
          const g0 = i / STEPS, g1 = (i + 1) / STEPS, g = (g0 + g1) / 2;
          rod([g0, g0, g0], [g1, g1, g1], t, [g, g, g]);
        }
      }
    }

    // ── the xyY solid's floor and its luminance axis ─────────────
    // The floor is the chromaticity plane: the spectral locus and whatever
    // gamut outlines the host handed in, laid flat at Y = 0. The column is the
    // greys, which all have D65's chromaticity and so all stand on the white
    // point - it is both the axis the solid's height is measured on and a
    // literal slice of the solid.
    if (p.xyYMix > 0.001) {
      const t = 3 * wpp * p.xyYMix;
      gl!.uniform1f(U.uQuant, 0);
      // Depth-tested paths first, then the ones that must be seen through the
      // solid - which is every path that says something about the colour.
      for (const onTop of [false, true]) {
        if (onTop) gl!.disable(gl!.DEPTH_TEST);
        for (const path of p.xyYFloor ?? []) {
          if (!!path.onTop !== onTop) continue;
          const w = (path.widthPx ?? 3) * wpp * p.xyYMix;
          const pts = path.points, hs = path.heights;
          const at = (i: number) => xyYToWorld(pts[i][0], pts[i][1], hs ? hs[i] : 0);
          const last = path.closed ? pts.length : pts.length - 1;
          for (let i = 0; i < last; i++) rod(at(i), at((i + 1) % pts.length), w, path.colour);
        }
        if (onTop) gl!.enable(gl!.DEPTH_TEST);
      }
      // Y is linear luminance, so the grey that *looks* halfway up is nowhere
      // near Y = 0.5. Each step wears the encoded grey whose luminance it is,
      // which is the caveat the page makes in words, drawn.
      const STEPS = 24;
      for (let i = 0; i < STEPS; i++) {
        const y0 = i / STEPS, y1 = (i + 1) / STEPS, y = (y0 + y1) / 2;
        const e = y <= 0.0031308 ? y * 12.92 : 1.055 * Math.pow(y, 1 / 2.4) - 0.055;
        rod(xyYToWorld(D65[0], D65[1], y0), xyYToWorld(D65[0], D65[1], y1), t, [e, e, e]);
      }
    }
  }

  return {
    render,
    // Deliberately does not lose the context: StrictMode mounts twice, and the
    // second getContext() on a lost canvas hands back the dead context.
    destroy() { gl!.bindVertexArray(null); },
  };
}
