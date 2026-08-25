import { CENTER_X, CENTER_Y, RADIUS, HEX_SIZE } from './hexConstants';

/**
 * WebGL renderer for the hexagon field.
 *
 * The 2D path paints 540x540 pixels in JavaScript and then CSS-scales that
 * bitmap, so a wide panel shows a stretched 540px image - visibly soft. This
 * renders at whatever size it is actually displayed at, and the per-pixel cost
 * moves to the GPU, where a dozen ALU ops over a quad is nothing.
 *
 * The maths is a transcription of colorAtPoint, deliberately: hue is the polar
 * angle and saturation is distance over the hexagon's edge distance at that
 * angle. Any drift here would put the field out of step with every handle
 * position, which are all computed from those same functions.
 */
const VERT = `
attribute vec2 aPos;
void main() { gl_Position = vec4(aPos, 0.0, 1.0); }
`;

const FRAG = `
precision highp float;
uniform vec2 uResolution;
uniform float uBrightness;
uniform float uLightness;
/** 0 = the bar drives HSB brightness, 1 = it drives HSL lightness. */
uniform float uMode;
/** 0 draws a circle, 1 the hexagon, between them the morph. */
uniform float uShape;
uniform float uLinear;

const float PI = 3.14159265359;
const float TAU = 6.28318530718;
const float SQRT3_2 = 0.86602540378;

float hexEdgeDist(float a, float r) {
  float sector = mod(a, PI / 3.0);
  return (r * SQRT3_2) / cos(sector - PI / 6.0);
}

vec3 hsb2rgb(float h, float s, float b) {
  float c = (b / 100.0) * (s / 100.0);
  float x = c * (1.0 - abs(mod(h / 60.0, 2.0) - 1.0));
  float m = b / 100.0 - c;
  vec3 rgb;
  if (h < 60.0) rgb = vec3(c, x, 0.0);
  else if (h < 120.0) rgb = vec3(x, c, 0.0);
  else if (h < 180.0) rgb = vec3(0.0, c, x);
  else if (h < 240.0) rgb = vec3(0.0, x, c);
  else if (h < 300.0) rgb = vec3(x, 0.0, c);
  else rgb = vec3(c, 0.0, x);
  return rgb + m;
}

// HSL's own cross-section, for when the B/L bar is driving L. Chroma is
// (1 - |2L-1|) * S here, which is why the reachable hexagon is widest at L=50
// and vanishes at both ends.
vec3 hsl2rgb(float h, float s, float l) {
  float sN = s / 100.0;
  float lN = l / 100.0;
  float c = (1.0 - abs(2.0 * lN - 1.0)) * sN;
  float x = c * (1.0 - abs(mod(h / 60.0, 2.0) - 1.0));
  float m = lN - c / 2.0;
  vec3 rgb;
  if (h < 60.0) rgb = vec3(c, x, 0.0);
  else if (h < 120.0) rgb = vec3(x, c, 0.0);
  else if (h < 180.0) rgb = vec3(0.0, c, x);
  else if (h < 240.0) rgb = vec3(0.0, x, c);
  else if (h < 300.0) rgb = vec3(x, 0.0, c);
  else rgb = vec3(c, 0.0, x);
  return rgb + m;
}

float toSrgb(float c) {
  return c <= 0.0031308 ? c * 12.92 : 1.055 * pow(c, 1.0 / 2.4) - 0.055;
}

void main() {
  // Into the same 540-unit space the 2D path and every handle position use.
  vec2 uv = vec2(gl_FragCoord.x / uResolution.x, 1.0 - gl_FragCoord.y / uResolution.y) * ${HEX_SIZE.toFixed(1)};
  float dx = uv.x - ${CENTER_X.toFixed(1)};
  float dy = uv.y - ${CENTER_Y.toFixed(1)};
  float dist = length(vec2(dx, dy));
  // A hair past the radius, not exactly on it: the vertices reach RADIUS, and
  // an exact cut would take the outer half of their feather off again.
  if (dist > ${(RADIUS + 2).toFixed(1)}) discard;

  float angle = atan(-dy, dx);
  if (angle < 0.0) angle += TAU;
  // The morph, in one line: a circle is just the hexagon with a constant edge
  // distance, so lerping the edge moves the whole field between the two.
  float edge = mix(${RADIUS.toFixed(1)}, hexEdgeDist(angle, ${RADIUS.toFixed(1)}), uShape);

  // Feathered rather than a hard discard, because the context is created with
  // antialias off and nothing else would smooth this boundary. It only became
  // worth doing once the shape started moving: a straight hexagon edge hides
  // its own stair-stepping, a slowly curving one part-way through the morph
  // does not. One field unit either side, converted from device pixels so the
  // feather stays a pixel wide at any size.
  float px = ${HEX_SIZE.toFixed(1)} / uResolution.x;
  float cov = 1.0 - smoothstep(edge - px, edge + px, dist);
  if (cov <= 0.0) discard;

  float h = angle * 180.0 / PI;

  // Radius is chroma, not saturation.
  //
  // At brightness b the reachable colours are the cube's cross-section - a
  // hexagon of radius b/100 - which is what the dashed limit hexagon draws and
  // where the vector chain's tip actually lands. Painting saturation across the
  // full radius instead put the field, the handle and the pointer on three
  // different maps: a click at the rim at b=30 set the handle less than half
  // the way out.
  //
  // Inside the cross-section, saturation is measured against *its* edge, so the
  // handle sits exactly under the cursor. Outside it, the pixel previews what
  // dragging there would select - full saturation at the brightness that reach
  // requires - drawn faint, because it is not reachable without moving the
  // brightness bar. The two branches meet at s=100, b=uBrightness, so the seam
  // is continuous and only the alpha steps.
  // The bound depends on which axis the bar is driving: b/100 under HSB, and
  // 1 - |2L-1| under HSL, which peaks at L=50. Mirrors blLimitScale.
  float scale = uMode < 0.5
    ? uBrightness / 100.0
    : 1.0 - abs(2.0 * (uLightness / 100.0) - 1.0);
  // Softened toward "no bound" as the shape leaves the hexagon. A circle is not
  // the cube's cross-section and cannot show one, so on a wheel the bound opens
  // out to the edge and the reading is the plain one: distance is saturation.
  // Mirrors shapeLimitScale.
  scale = mix(1.0, scale, uShape);
  float limit = edge * scale;
  float r = dist / edge;

  // Inside, saturation is measured against the cross-section's own edge, so the
  // handle sits under the cursor. Outside, the pixel previews what dragging
  // there would select - full saturation at the value that reach requires -
  // faint, because getting there means moving the bar. Expanding under HSL runs
  // L toward 50 rather than up, since that is the direction the cross-section
  // widens in.
  float sIn = limit > 0.0 ? min((dist / limit) * 100.0, 100.0) : 0.0;
  float a = dist <= limit ? 1.0 : 0.32;

  vec3 col;
  if (uMode < 0.5) {
    col = dist <= limit ? hsb2rgb(h, sIn, uBrightness) : hsb2rgb(h, 100.0, r * 100.0);
  } else {
    float lOut = uLightness <= 50.0 ? r * 50.0 : 100.0 - r * 50.0;
    col = dist <= limit ? hsl2rgb(h, sIn, uLightness) : hsl2rgb(h, 100.0, lOut);
  }

  if (uLinear > 0.5) {
    // The color is built in linear units, then transferred - the scale and the
    // transfer do not commute, so the transfer has to come last.
    col = vec3(toSrgb(col.r), toSrgb(col.g), toSrgb(col.b));
  }
  a *= cov;
  gl_FragColor = vec4(clamp(col, 0.0, 1.0) * a, a);
}
`;

export interface HexGL {
  draw(brightness: number, lightness: number, lightnessMode: boolean, linear: boolean, shape: number): void;
  resize(w: number, h: number): void;
  dispose(): void;
}

function compile(gl: WebGLRenderingContext, type: number, src: string) {
  const sh = gl.createShader(type);
  if (!sh) return null;
  gl.shaderSource(sh, src);
  gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    gl.deleteShader(sh);
    return null;
  }
  return sh;
}

/** Returns null when WebGL is unavailable, so the caller can fall back. */
export function createHexGL(canvas: HTMLCanvasElement): HexGL | null {
  const gl = (canvas.getContext('webgl', { alpha: true, antialias: false, premultipliedAlpha: true }) ||
    canvas.getContext('experimental-webgl', { alpha: true })) as WebGLRenderingContext | null;
  if (!gl) return null;

  const vs = compile(gl, gl.VERTEX_SHADER, VERT);
  const fs = compile(gl, gl.FRAGMENT_SHADER, FRAG);
  if (!vs || !fs) return null;

  const prog = gl.createProgram();
  if (!prog) return null;
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return null;
  gl.useProgram(prog);

  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const aPos = gl.getAttribLocation(prog, 'aPos');
  gl.enableVertexAttribArray(aPos);
  gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

  const uResolution = gl.getUniformLocation(prog, 'uResolution');
  const uBrightness = gl.getUniformLocation(prog, 'uBrightness');
  const uLightness = gl.getUniformLocation(prog, 'uLightness');
  const uMode = gl.getUniformLocation(prog, 'uMode');
  const uShape = gl.getUniformLocation(prog, 'uShape');
  const uLinear = gl.getUniformLocation(prog, 'uLinear');

  gl.clearColor(0, 0, 0, 0);

  return {
    resize(w, h) {
      canvas.width = w;
      canvas.height = h;
      gl.viewport(0, 0, w, h);
      gl.uniform2f(uResolution, w, h);
    },
    draw(brightness, lightness, lightnessMode, linear, shape) {
      gl.uniform1f(uBrightness, brightness);
      gl.uniform1f(uLightness, lightness);
      gl.uniform1f(uMode, lightnessMode ? 1 : 0);
      gl.uniform1f(uShape, shape);
      gl.uniform1f(uLinear, linear ? 1 : 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    },
    dispose() {
      gl.deleteProgram(prog);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
      gl.deleteBuffer(buf);
    },
  };
}
