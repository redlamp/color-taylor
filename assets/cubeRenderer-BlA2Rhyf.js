import{c as e,v as t}from"./colorConversions-TltCQAHP.js";var n=[[360,1299e-7,3917e-9,6061e-7],[365,2321e-7,6965e-9,.001086],[370,4149e-7,1239e-8,.001946],[375,7416e-7,2202e-8,.003486],[380,.001368,39e-6,.006450001],[385,.002236,64e-6,.01054999],[390,.004243,12e-5,.02005001],[395,.00765,217e-6,.03621],[400,.01431,396e-6,.06785001],[405,.02319,64e-5,.1102],[410,.04351,.00121,.2074],[415,.07763,.00218,.3713],[420,.13438,.004,.6456],[425,.21477,.0073,1.0390501],[430,.2839,.0116,1.3856],[435,.3285,.01684,1.62296],[440,.34828,.023,1.74706],[445,.34806,.0298,1.7826],[450,.3362,.038,1.77211],[455,.3187,.048,1.7441],[460,.2908,.06,1.6692],[465,.2511,.0739,1.5281],[470,.19536,.09098,1.28764],[475,.1421,.1126,1.0419],[480,.09564,.13902,.8129501],[485,.05795001,.1693,.6162],[490,.03201,.20802,.46518],[495,.0147,.2586,.3533],[500,.0049,.323,.272],[505,.0024,.4073,.2123],[510,.0093,.503,.1582],[515,.0291,.6082,.1117],[520,.06327,.71,.07824999],[525,.1096,.7932,.05725001],[530,.1655,.862,.04216],[535,.2257499,.9148501,.02984],[540,.2904,.954,.0203],[545,.3597,.9803,.0134],[550,.4334499,.9949501,.008749999],[555,.5120501,1,.005749999],[560,.5945,.995,.0039],[565,.6784,.9786,.002749999],[570,.7621,.952,.0021],[575,.8425,.9154,.0018],[580,.9163,.87,.001650001],[585,.9786,.8163,.0014],[590,1.0263,.757,.0011],[595,1.0567,.6949,.001],[600,1.0622,.631,8e-4],[605,1.0456,.5668,6e-4],[610,1.0026,.503,34e-5],[615,.9384,.4412,24e-5],[620,.8544499,.381,19e-5],[625,.7514,.321,1e-4],[630,.6424,.265,4999999e-11],[635,.5419,.217,3e-5],[640,.4479,.175,2e-5],[645,.3608,.1382,1e-5],[650,.2835,.107,0],[655,.2187,.0816,0],[660,.1649,.061,0],[665,.1212,.04458,0],[670,.0874,.032,0],[675,.0636,.0232,0],[680,.04677,.017,0],[685,.0329,.01192,0],[690,.0227,.00821,0],[695,.01584,.005723,0],[700,.01135916,.004102,0],[705,.008110916,.002929,0],[710,.005790346,.002091,0],[715,.004109457,.001484,0],[720,.002899327,.001047,0],[725,.00204919,74e-5,0],[730,.001439971,52e-5,0],[735,.0009999493,3611e-7,0],[740,.0006900786,2492e-7,0],[745,.0004760213,1719e-7,0],[750,.0003323011,12e-5,0],[755,.0002348261,848e-7,0],[760,.0001661505,6e-5,0],[765,117413e-9,424e-7,0],[770,8307527e-11,3e-5,0],[775,5870652e-11,212e-7,0],[780,4150994e-11,1499e-8,0],[785,2935326e-11,106e-7,0],[790,2067383e-11,74657e-10,0],[795,1455977e-11,52578e-10,0],[800,1025398e-11,37029e-10,0],[805,7221456e-12,26078e-10,0],[810,5085868e-12,18366e-10,0],[815,3581652e-12,12934e-10,0],[820,2522525e-12,9.1093e-7,0],[825,1776509e-12,6.4153e-7,0],[830,1251141e-12,4.5181e-7,0]],r=[[.4123907992659595,.35758433938387796,.1804807884018343],[.21263900587151036,.7151686787677559,.07219231536073371],[.01933081871559185,.11919477979462599,.9505321522496606]];r[1][0],r[1][1],r[1][2];function i(e){let[[t,n,r],[i,a,o],[s,c,l]]=e,u=a*l-o*c,d=o*s-i*l,f=i*c-a*s,p=t*u+n*d+r*f;return[[u/p,(r*c-n*l)/p,(n*o-r*a)/p],[d/p,(t*l-r*s)/p,(r*i-t*o)/p],[f/p,(n*s-t*c)/p,(t*a-n*i)/p]]}var a=i(r);function o(e,t){return[0,1,2].map(n=>e[n][0]*t[0]+e[n][1]*t[1]+e[n][2]*t[2])}function s(e,t,n){return o(r,[e,t,n])}function c(e,t,n){let r=e+t+n;return r<=0?null:{x:e/r,y:t/r,Y:t}}function l(e,n,r){let[i,a,o]=s(t(e),t(n),t(r));return c(i,a,o)}function u(e,t,n){let r=c(...s(e,t,n));if(!r)throw Error(`a primary with no chromaticity`);return{x:r.x,y:r.y}}var d=[u(1,0,0),u(0,1,0),u(0,0,1)],f=u(1,1,1),p=n.filter(([e])=>e>=380&&e<=700).map(([e,t,n,r])=>{let i=t+n+r;return{nm:e,x:t/i,y:n/i}});function m(e,t){let n=!1;for(let r=0,i=t.length-1;r<t.length;i=r++){let a=t[r],o=t[i];a.y>e.y!=o.y>e.y&&e.x<(o.x-a.x)*(e.y-a.y)/(o.y-a.y)+a.x&&(n=!n)}return n}function h(t,n){if(n<=0)return null;let[r,i,s]=o(a,[t/n,1,(1-t-n)/n]),c=-1e-9;if(r<c||i<c||s<c)return null;let l=Math.max(r,i,s);return l<=0?null:{r:e(r/l),g:e(i/l),b:e(s/l)}}function g(e,t,n){let r=n.x-t.x,i=n.y-t.y,a=r*r+i*i,o=a===0?0:Math.max(0,Math.min(1,((e.x-t.x)*r+(e.y-t.y)*i)/a));return Math.hypot(e.x-(t.x+o*r),e.y-(t.y+o*i))}function _(e,t){let n=1/0;for(let r=0;r<t.length;r++)n=Math.min(n,g(e,t[r],t[(r+1)%t.length]));return n}function v(e,t=d,n=f){let r=0;for(let i=0;i<t.length;i++){let a=t[i],o=t[(i+1)%t.length],s=Math.abs((o.x-a.x)*(a.y-n.y)-(a.x-n.x)*(o.y-a.y))/Math.hypot(o.x-a.x,o.y-a.y);s<e&&(r+=2*Math.acos(s/e))}return Math.min(1,r/(2*Math.PI))}var y={rgb:[1,0,1],cubes:!0,cubeStyle:`cubes`,cubeStep:17,stepTween:null,gap:.02,edge:.04,edgeDark:.1,outline:!0,outlineW:2,pointScale:1,markerScale:1,up:`neutral`,axes:!0,shapeW:[1,0,0],xyYMix:0,reveal:`toColor`,xyYFloor:null,xyYRgbToXyz:r,xyYTrc:[.04045,12.92,.055,2.4],theta:Math.PI/2,phi:Math.PI/2,zoom:.75,focus:[.5,.5,.5],ground:[32/255,32/255,32/255],bufferColorSpace:`srgb`},b=`
uniform float uXyY;          // 0 the RGB-shaped solids; 1 the CIE xyY solid
uniform mat3  uRgbToXyz;     // the active space's matrix; sRGB's by default
uniform vec4  uTrc;          // its transfer function: cut, slope, a, gamma
const float XY_SCALE = 2.5;  // must match XYY_SCALE below
vec3 placeXyY(vec3 v) {
  vec3 c = clamp(v, 0.0, 1.0);
  // One shape for every space this page draws - see TRCS in src/utils/gamuts.ts.
  // With cut at 0 the toe never fires and with a at 0 the knee is a plain
  // power, so a pure-gamma space is these same four numbers with two off.
  vec3 lin = mix(c / uTrc.y, pow((c + uTrc.z) / (1.0 + uTrc.z), vec3(uTrc.w)), step(vec3(uTrc.x), c));
  vec3 XYZ = uRgbToXyz * lin;
  float s = XYZ.x + XYZ.y + XYZ.z;
  // Black is the one color with no chromaticity - every ray meets at the
  // origin - so it stands on the white point, at height zero.
  vec2 xy = s > 1e-7 ? XYZ.xy / s : vec2(0.3127, 0.3290);
  vec3 n  = vec3(0.57735027);
  vec3 e1 = vec3(0.81649658, -0.40824829, -0.40824829);
  vec3 e2 = vec3(0.0, 0.70710678, -0.70710678);
  return e1 * ((xy.x - 0.3127) * XY_SCALE)
       + e2 * ((xy.y - 0.3290) * XY_SCALE)
       + n  * (XYZ.y * 1.73205081);
}
`,x=`#version 300 es
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
${b}
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
    vec3 center = place(vCol, aOff + uCellSz * 0.5);
    if (uUnpack < 1.0) {
      // the parent cube in the coarser grid: the value floored to its step
      vec3 pi = floor((vCol * 255.0 + 0.5) / uCoarseStep);
      vec3 parent = place(pi * uCoarseStep / 255.0, (pi + 0.5) / uCoarseN);
      center = mix(parent, center, uUnpack);
    }
    w = center + (local.xyz - uCellSz * 0.5);
  } else {
    vCol = vec3(0.0);
    w = local.xyz + aOff;
  }
  vPos = w;
  vNrm = normalize(mat3(uModel) * aNrm);
  gl_Position = uProj * uView * vec4(w, 1.0);
}`,S=`#version 300 es
precision highp float;
in vec3 vPos; in vec3 vNrm; flat in vec3 vCol;
out vec4 frag;
uniform int   uKind;        // 0 little cube, 1 flat color, 2 little sphere
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
}`,C=`#version 300 es
uniform mat4 uProj, uView;
uniform float uN;           // steps per axis
uniform vec3  uIdx;         // the selected step's index: cubes above it in any channel are hidden
uniform vec3  uShapeW;      // weights: cube, HSB cone, HSL bicone
uniform float uPx;          // point size in pixels
uniform float uThin;        // keep interior steps whose index is a multiple of this
uniform float uUnpack, uCoarseStep, uCoarseN;   // as in the cube shader
flat out vec3 vCol;
${b}
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
}`,w=`#version 300 es
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
}`,T={add:(e,t)=>[e[0]+t[0],e[1]+t[1],e[2]+t[2]],sub:(e,t)=>[e[0]-t[0],e[1]-t[1],e[2]-t[2]],mul:(e,t)=>[e[0]*t,e[1]*t,e[2]*t],dot:(e,t)=>e[0]*t[0]+e[1]*t[1]+e[2]*t[2],cross:(e,t)=>[e[1]*t[2]-e[2]*t[1],e[2]*t[0]-e[0]*t[2],e[0]*t[1]-e[1]*t[0]],norm:e=>{let t=Math.hypot(e[0],e[1],e[2])||1;return[e[0]/t,e[1]/t,e[2]/t]}},E={ident:()=>[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],ortho(e,t,n,r){return[1/(e*t),0,0,0,0,1/e,0,0,0,0,-2/(r-n),0,0,0,-(r+n)/(r-n),1]},basisAt:(e,t,n,r)=>[e[0],e[1],e[2],0,t[0],t[1],t[2],0,n[0],n[1],n[2],0,r[0],r[1],r[2],1],scaleTrans:(e,t)=>[e[0],0,0,0,0,e[1],0,0,0,0,e[2],0,t[0],t[1],t[2],1]},D={neutral:T.norm([1,1,1]),r:[1,0,0],g:[0,1,0],b:[0,0,1]};function O(e){let t=D[e.up],n=[1,0,0];n=T.sub(n,T.mul(t,T.dot(n,t))),Math.hypot(...n)<1e-4&&(n=[0,0,1]),n=T.norm(n);let r=T.cross(n,t);return{up:t,east:n,third:r}}function k(e){let{up:t,east:n,third:r}=O(e),i=Math.cos(e.phi),a=Math.sin(e.phi);return T.norm(T.add(T.mul(T.add(T.mul(n,Math.cos(e.theta)),T.mul(r,Math.sin(e.theta))),i),T.mul(t,a)))}function A(e){let t=k(e),n=O(e),r=T.norm(T.sub(T.mul(n.east,Math.sin(e.theta)),T.mul(n.third,Math.cos(e.theta))));return{right:r,up:T.cross(t,r),dir:t}}var j=2.5,M=T.norm([1,1,1]),N=T.norm([2,-1,-1]),P=T.cross(M,N),F=[.3127,.329];function I(e,t,n){return T.add(T.add(T.mul(N,(e-F[0])*j),T.mul(P,(t-F[1])*j)),T.mul(M,n*Math.sqrt(3)))}function L(e){let t=e.getContext(`webgl2`,{antialias:!0,alpha:!1});if(!t)return null;function n(e,n){let r=t.createShader(e);if(t.shaderSource(r,n),t.compileShader(r),!t.getShaderParameter(r,t.COMPILE_STATUS))throw Error(t.getShaderInfoLog(r)??`shader`);return r}let r=t.createProgram();if(t.attachShader(r,n(t.VERTEX_SHADER,x)),t.attachShader(r,n(t.FRAGMENT_SHADER,S)),t.linkProgram(r),!t.getProgramParameter(r,t.LINK_STATUS))throw Error(t.getProgramInfoLog(r)??`link`);t.useProgram(r);let i={};for(let e of[`uProj`,`uView`,`uModel`,`uKind`,`uFlat`,`uQuant`,`uCellSz`,`uShapeW`,`uXyY`,`uRgbToXyz`,`uTrc`,`uViewDir`,`uCell`,`uInset`,`uEdge`,`uEdgeDark`,`uUnpack`,`uCoarseStep`,`uCoarseN`])i[e]=t.getUniformLocation(r,e);let a=t.createProgram();if(t.attachShader(a,n(t.VERTEX_SHADER,C)),t.attachShader(a,n(t.FRAGMENT_SHADER,w)),t.linkProgram(a),!t.getProgramParameter(a,t.LINK_STATUS))throw Error(t.getProgramInfoLog(a)??`link`);let o={};for(let e of[`uProj`,`uView`,`uN`,`uIdx`,`uShapeW`,`uXyY`,`uRgbToXyz`,`uTrc`,`uPx`,`uThin`,`uEdgeDark`,`uUnpack`,`uCoarseStep`,`uCoarseN`])o[e]=t.getUniformLocation(a,e);let s=t.createVertexArray();function c(e,n,r){let i=t.createVertexArray();t.bindVertexArray(i);let a=t.createBuffer();t.bindBuffer(t.ARRAY_BUFFER,a),t.bufferData(t.ARRAY_BUFFER,new Float32Array(e),t.STATIC_DRAW),t.enableVertexAttribArray(0),t.vertexAttribPointer(0,3,t.FLOAT,!1,0,0);let o=t.createBuffer();t.bindBuffer(t.ARRAY_BUFFER,o),t.bufferData(t.ARRAY_BUFFER,new Float32Array(n),t.STATIC_DRAW),t.enableVertexAttribArray(1),t.vertexAttribPointer(1,3,t.FLOAT,!1,0,0);let s=t.createBuffer();return t.bindBuffer(t.ELEMENT_ARRAY_BUFFER,s),t.bufferData(t.ELEMENT_ARRAY_BUFFER,new Uint16Array(r),t.STATIC_DRAW),t.bindVertexArray(null),{vao:i,n:r.length,pb:a,nb:o,ib:s}}let l=(()=>{let e=[],t=[],n=[];for(let r=0;r<3;r++)for(let i=0;i<2;i++){let a=(r+1)%3,o=(r+2)%3,s=[0,0,0];s[r]=i?1:-1;let c=e.length/3;for(let[n,c]of[[0,0],[1,0],[1,1],[0,1]]){let l=[0,0,0];l[r]=i,l[a]=n,l[o]=c,e.push(...l),t.push(...s)}i?n.push(c,c+1,c+2,c,c+2,c+3):n.push(c,c+2,c+1,c,c+3,c+2)}return c(e,t,n)})(),u=((e,t)=>{let n=[],r=[],i=[];for(let i=0;i<=e;i++){let a=Math.PI*i/e;for(let e=0;e<=t;e++){let i=2*Math.PI*e/t,o=Math.sin(a)*Math.cos(i),s=Math.cos(a),c=Math.sin(a)*Math.sin(i);n.push(o,s,c),r.push(o,s,c)}}for(let n=0;n<e;n++)for(let e=0;e<t;e++){let r=n*(t+1)+e,a=r+t+1;i.push(r,r+1,a,a,r+1,a+1)}return c(n,r,i)})(7,12);t.vertexAttrib3f(2,0,0,0);let d=t.createBuffer(),f=(()=>{let e=t.createVertexArray();return t.bindVertexArray(e),t.bindBuffer(t.ARRAY_BUFFER,l.pb),t.enableVertexAttribArray(0),t.vertexAttribPointer(0,3,t.FLOAT,!1,0,0),t.bindBuffer(t.ARRAY_BUFFER,l.nb),t.enableVertexAttribArray(1),t.vertexAttribPointer(1,3,t.FLOAT,!1,0,0),t.bindBuffer(t.ARRAY_BUFFER,d),t.enableVertexAttribArray(2),t.vertexAttribPointer(2,3,t.FLOAT,!1,0,0),t.vertexAttribDivisor(2,1),t.bindBuffer(t.ELEMENT_ARRAY_BUFFER,l.ib),t.bindVertexArray(null),{vao:e,ob:d,n:0,key:``}})();function p(e,n,r,a){t.uniformMatrix4fv(i.uModel,!1,n),t.uniform1i(i.uKind,r),a&&t.uniform3fv(i.uFlat,a),t.bindVertexArray(e.vao),t.drawElements(t.TRIANGLES,e.n,t.UNSIGNED_SHORT,0)}function m(e){let t=t=>(t+e/60)%6,n=e=>1-Math.max(0,Math.min(t(e),4-t(e),1));return[n(5),n(3),n(1)]}function h(e,t,n,r){let i=T.sub(t,e),a=Math.hypot(...i);if(a<1e-6)return;let o=T.mul(i,1/a),s=Math.abs(o[0])<.9?[1,0,0]:[0,1,0];s=T.norm(T.sub(s,T.mul(o,T.dot(s,o))));let c=T.cross(o,s),u=T.sub(T.sub(e,T.mul(s,n/2)),T.mul(c,n/2));p(l,E.basisAt(T.mul(o,a),T.mul(s,n),T.mul(c,n),u),1,r)}function g(n){let c=n.xyYRgbToXyz,d=new Float32Array([c[0][0],c[1][0],c[2][0],c[0][1],c[1][1],c[2][1],c[0][2],c[1][2],c[2][2]]),g=e=>{t.uniformMatrix3fv(e.uRgbToXyz,!1,d),t.uniform4f(e.uTrc,n.xyYTrc[0],n.xyYTrc[1],n.xyYTrc[2],n.xyYTrc[3])},_=Math.min(window.devicePixelRatio||1,2),v=Math.round(e.clientWidth*_),y=Math.round(e.clientHeight*_);if(!v||!y)return;let b=n.bufferColorSpace??`srgb`;try{let e=t;`drawingBufferColorSpace`in e&&e.drawingBufferColorSpace!==b&&(e.drawingBufferColorSpace=b)}catch{}(e.width!==v||e.height!==y)&&(e.width=v,e.height=y);let x=v/y,{right:S,up:C,dir:w}=A(n),D=T.add(n.focus,T.mul(w,6)),O=[S[0],C[0],w[0],0,S[1],C[1],w[1],0,S[2],C[2],w[2],0,-T.dot(S,D),-T.dot(C,D),-T.dot(w,D),1],k=E.ortho(1/n.zoom,x,.01,20),j=y/2*n.zoom,M=1/j;t.viewport(0,0,v,y),t.clearColor(n.ground[0],n.ground[1],n.ground[2],1),t.enable(t.DEPTH_TEST),t.depthFunc(t.LEQUAL),t.disable(t.BLEND),t.disable(t.CULL_FACE),t.clear(t.COLOR_BUFFER_BIT|t.DEPTH_BUFFER_BIT),t.uniformMatrix4fv(i.uProj,!1,k),t.uniformMatrix4fv(i.uView,!1,O),t.uniform3fv(i.uViewDir,w);let N=n.rgb,P=(e,c,u)=>{let d=255/e+1,p=1/d,m=p*j<6||n.gap<=0?0:Math.max(n.gap,M/p),h=p*j<3||n.edge<=0?0:Math.max(n.edge*p,M),_=N.map(t=>Math.floor(Math.round(t*255)/e)),v=n.reveal===`all`,y=v?[d-1,d-1,d-1]:_,b=v?()=>!1:(e,t,n)=>e>_[0]||t>_[1]||n>_[2],x=p*(1-m),S=p*m/2,C=n.shapeW[0],w=d>16||n.cubeStyle===`dots`?1:1-C,T=p*j*n.pointScale*w*c,D=u?u.unpack:1,A=u?u.step:e,P=255/A+1;if(t.enable(t.CULL_FACE),t.cullFace(t.BACK),w>.01&&T>.3&&(t.useProgram(a),t.uniformMatrix4fv(o.uProj,!1,k),t.uniformMatrix4fv(o.uView,!1,O),t.uniform1f(o.uN,d),t.uniform3fv(o.uIdx,y),t.uniform3fv(o.uShapeW,n.shapeW),t.uniform1f(o.uXyY,n.xyYMix),g(o),t.uniform1f(o.uPx,Math.max(1.5,T)),t.uniform1f(o.uThin,d>16?4:1),t.uniform1f(o.uEdgeDark,n.edgeDark),t.uniform1f(o.uUnpack,D),t.uniform1f(o.uCoarseStep,A),t.uniform1f(o.uCoarseN,P),t.bindVertexArray(s),t.drawArrays(t.POINTS,0,d*d*d),t.useProgram(r)),d<=16&&n.cubeStyle===`cubes`&&C>.01&&c>.01){let r=`${e}|${v?`all`:_.join()}`;if(r!==f.key){let e=[];for(let t=0;t<d;t++)for(let n=0;n<d;n++)for(let r=0;r<d;r++)b(t,n,r)||e.push(t*p,n*p,r*p);t.bindBuffer(t.ARRAY_BUFFER,f.ob),t.bufferData(t.ARRAY_BUFFER,new Float32Array(e),t.DYNAMIC_DRAW),f.n=e.length/3,f.key=r}t.uniform1f(i.uQuant,d),t.uniform1f(i.uCellSz,p),t.uniform3fv(i.uShapeW,n.shapeW),t.uniform1f(i.uXyY,n.xyYMix),g(i),g(i),t.uniform1f(i.uEdgeDark,n.edgeDark),t.uniform1f(i.uUnpack,D),t.uniform1f(i.uCoarseStep,A),t.uniform1f(i.uCoarseN,P);let a=x*C*c,o=S+(x-a)/2;t.uniform1i(i.uKind,0),t.uniform1f(i.uCell,p),t.uniform1f(i.uInset,(p-a)/2/p),t.uniform1f(i.uEdge,h),t.uniformMatrix4fv(i.uModel,!1,E.scaleTrans([a,a,a],[o,o,o])),t.bindVertexArray(f.vao),t.drawElementsInstanced(t.TRIANGLES,l.n,t.UNSIGNED_SHORT,0,f.n)}return{N:d,sz:p,idx:_,fs:x,fo:S,wc:C,pointW:w,edge:h}};if(n.cubes){let e=n.stepTween,r;e?n.cubeStep===e.fine?(P(e.coarse,1-e.unpack,null),r=P(e.fine,1,{step:e.coarse,unpack:e.unpack})):(P(e.fine,1,{step:e.coarse,unpack:e.unpack}),r=P(e.coarse,1-e.unpack,null)):r=P(n.cubeStep,1,null);let{N:a,sz:o,idx:s,fs:c,fo:d,wc:f,pointW:m,edge:h}=r;if(t.uniform1f(i.uQuant,a),t.uniform1f(i.uCellSz,o),t.uniform3fv(i.uShapeW,n.shapeW),t.uniform1f(i.uXyY,n.xyYMix),g(i),t.uniform1f(i.uEdgeDark,n.edgeDark),t.uniform1f(i.uUnpack,1),n.outline&&n.outlineW>0){let e=n.outlineW*M,r=.2126*N[0]+.7152*N[1]+.0722*N[2]>.45?[.04,.05,.06]:[.97,.98,1];t.vertexAttrib3f(2,s[0]*o,s[1]*o,s[2]*o),t.disable(t.DEPTH_TEST);let g=a>16||n.cubeStyle===`dots`?0:f,_=c*g,v=d+(c-_)/2,y=Math.max(.75*M,o*n.pointScale*m/2)*n.markerScale,b=o/2;g>.01&&p(l,E.scaleTrans([_+2*e,_+2*e,_+2*e],[v-e,v-e,v-e]),1,r),m>.01&&p(u,E.scaleTrans([y+e,y+e,y+e],[b,b,b]),1,r),g>.01&&(t.uniform1i(i.uKind,0),t.uniform1f(i.uCell,o),t.uniform1f(i.uInset,(o-_)/2/o),t.uniform1f(i.uEdge,h),p(l,E.scaleTrans([_,_,_],[v,v,v]),0)),m>.01&&p(u,E.scaleTrans([y,y,y],[b,b,b]),2),t.enable(t.DEPTH_TEST),t.vertexAttrib3f(2,0,0,0)}t.disable(t.CULL_FACE),t.uniform1f(i.uQuant,0)}if(n.axes&&n.xyYMix<.99){let e=n.shapeW[0];if(e>.01){let t=4*M*e,n=t/2;p(l,E.scaleTrans([1,t,t],[0,-n,-n]),1,[.9,.2,.2]),p(l,E.scaleTrans([t,1,t],[-n,0,-n]),1,[.2,.8,.2]),p(l,E.scaleTrans([t,t,1],[-n,-n,0]),1,[.35,.45,1])}if(e<.99){let t=4*M*(1-e),r=T.norm([1,1,1]),i=(n.shapeW[1]*1+n.shapeW[2]*.5)/(n.shapeW[1]+n.shapeW[2]||1)*Math.sqrt(3),a=e=>{let t=m(e),n=T.sub(t,T.mul(r,T.dot(t,r)));return T.add(n,T.mul(r,i))};for(let e=0;e<36;e++){let n=e/36*360,r=(e+1)/36*360;h(a(n),a(r),t,m((n+r)/2))}for(let e=0;e<16;e++){let n=e/16,r=(e+1)/16,i=(n+r)/2;h([n,n,n],[r,r,r],t,[i,i,i])}}}if(n.xyYMix>.001){let e=3*M*n.xyYMix;t.uniform1f(i.uQuant,0);for(let e of[!1,!0]){e&&t.disable(t.DEPTH_TEST);for(let t of n.xyYFloor??[]){if(!!t.onTop!==e)continue;let r=(t.widthPx??3)*M*n.xyYMix,i=t.points,a=t.heights,o=e=>I(i[e][0],i[e][1],a?a[e]:0),s=t.closed?i.length:i.length-1;for(let e=0;e<s;e++)h(o(e),o((e+1)%i.length),r,t.color)}e&&t.enable(t.DEPTH_TEST)}for(let t=0;t<24;t++){let n=t/24,r=(t+1)/24,i=(n+r)/2,a=i<=.0031308?i*12.92:1.055*i**(1/2.4)-.055;h(I(F[0],F[1],n),I(F[0],F[1],r),e,[a,a,a])}}}return{render:g,destroy(){t.bindVertexArray(null)}}}export{d as a,v as c,l as d,p as i,_ as l,L as n,a as o,f as r,h as s,y as t,m as u};