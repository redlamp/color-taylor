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

float toSrgb(float c) {
  return c <= 0.0031308 ? c * 12.92 : 1.055 * pow(c, 1.0 / 2.4) - 0.055;
}

void main() {
  // Into the same 540-unit space the 2D path and every handle position use.
  vec2 uv = vec2(gl_FragCoord.x / uResolution.x, 1.0 - gl_FragCoord.y / uResolution.y) * ${HEX_SIZE.toFixed(1)};
  float dx = uv.x - ${CENTER_X.toFixed(1)};
  float dy = uv.y - ${CENTER_Y.toFixed(1)};
  float dist = length(vec2(dx, dy));
  if (dist > ${RADIUS.toFixed(1)}) discard;

  float angle = atan(-dy, dx);
  if (angle < 0.0) angle += TAU;
  float edge = hexEdgeDist(angle, ${RADIUS.toFixed(1)});
  if (dist > edge) discard;

  float h = angle * 180.0 / PI;
  float s = (dist / edge) * 100.0;

  vec3 col;
  if (uLinear > 0.5) {
    // The linear space builds the colour at unit brightness, scales, then
    // applies the transfer - the two do not commute.
    vec3 lin = hsb2rgb(h, s, 100.0) * (uBrightness / 100.0);
    col = vec3(toSrgb(lin.r), toSrgb(lin.g), toSrgb(lin.b));
  } else {
    col = hsb2rgb(h, s, uBrightness);
  }
  gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
}
`;

export interface HexGL {
  draw(brightness: number, linear: boolean): void;
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
  const uLinear = gl.getUniformLocation(prog, 'uLinear');

  gl.clearColor(0, 0, 0, 0);

  return {
    resize(w, h) {
      canvas.width = w;
      canvas.height = h;
      gl.viewport(0, 0, w, h);
      gl.uniform2f(uResolution, w, h);
    },
    draw(brightness, linear) {
      gl.uniform1f(uBrightness, brightness);
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
