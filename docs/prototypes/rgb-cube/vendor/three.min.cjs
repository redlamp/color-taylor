"use strict";
var $K={LEFT:0,MIDDLE:1,RIGHT:2,ROTATE:0,DOLLY:1,PAN:2},KK={ROTATE:0,PAN:1,DOLLY_PAN:2,DOLLY_ROTATE:3};var WK={COMPUTE:"compute",RENDER:"render"},qK={PERSPECTIVE:"perspective",LINEAR:"linear",FLAT:"flat"},BK={NORMAL:"normal",CENTROID:"centroid",SAMPLE:"sample",FIRST:"first",EITHER:"either"},GK={TEXTURE_COMPARE:"depthTextureCompare"};function NK(z){for(let J=z.length-1;J>=0;--J)if(z[J]>=65535)return!0;return!1}var DK={Int8Array,Uint8Array,Uint8ClampedArray,Int16Array,Uint16Array,Int32Array,Uint32Array,Float32Array,Float64Array};function u0(z,J){return new DK[z](J)}function H9(z){return ArrayBuffer.isView(z)&&!(z instanceof DataView)}function F1(z){return document.createElementNS("http://www.w3.org/1999/xhtml",z)}function U9(){let z=F1("canvas");return z.style.display="block",z}var h7={},lQ=null;function ZK(z){lQ=z}function HK(){return lQ}function M1(...z){let J="THREE."+z.shift();if(lQ)lQ("log",J,...z);else console.log(J,...z)}function V9(z){let J=z[0];if(typeof J==="string"&&J.startsWith("TSL:")){let Q=z[1];if(Q&&Q.isStackTrace)z[0]+=" "+Q.getLocation();else z[1]='Stack trace not available. Enable "THREE.Node.captureStackTrace" to capture stack traces.'}return z}function Bz(...z){z=V9(z);let J="THREE."+z.shift();if(lQ)lQ("warn",J,...z);else{let Q=z[0];if(Q&&Q.isStackTrace)console.warn(Q.getError(J));else console.warn(J,...z)}}function Pz(...z){z=V9(z);let J="THREE."+z.shift();if(lQ)lQ("error",J,...z);else{let Q=z[0];if(Q&&Q.isStackTrace)console.error(Q.getError(J));else console.error(J,...z)}}function gQ(...z){let J=z.join(" ");if(J in h7)return;h7[J]=!0,Bz(...z)}function UK(z,J,Q){return new Promise(function($,K){function W(){switch(z.clientWaitSync(J,z.SYNC_FLUSH_COMMANDS_BIT,0)){case z.WAIT_FAILED:K();break;case z.TIMEOUT_EXPIRED:setTimeout(W,Q);break;default:$()}}setTimeout(W,Q)})}var VK={[0]:1,[2]:6,[4]:7,[3]:5,[1]:0,[6]:2,[7]:4,[5]:3};class QQ{addEventListener(z,J){if(this._listeners===void 0)this._listeners={};let Q=this._listeners;if(Q[z]===void 0)Q[z]=[];if(Q[z].indexOf(J)===-1)Q[z].push(J)}hasEventListener(z,J){let Q=this._listeners;if(Q===void 0)return!1;return Q[z]!==void 0&&Q[z].indexOf(J)!==-1}removeEventListener(z,J){let Q=this._listeners;if(Q===void 0)return;let $=Q[z];if($!==void 0){let K=$.indexOf(J);if(K!==-1)$.splice(K,1)}}dispatchEvent(z){let J=this._listeners;if(J===void 0)return;let Q=J[z.type];if(Q!==void 0){z.target=this;let $=Q.slice(0);for(let K=0,W=$.length;K<W;K++)$[K].call(this,z);z.target=null}}}var hJ=["00","01","02","03","04","05","06","07","08","09","0a","0b","0c","0d","0e","0f","10","11","12","13","14","15","16","17","18","19","1a","1b","1c","1d","1e","1f","20","21","22","23","24","25","26","27","28","29","2a","2b","2c","2d","2e","2f","30","31","32","33","34","35","36","37","38","39","3a","3b","3c","3d","3e","3f","40","41","42","43","44","45","46","47","48","49","4a","4b","4c","4d","4e","4f","50","51","52","53","54","55","56","57","58","59","5a","5b","5c","5d","5e","5f","60","61","62","63","64","65","66","67","68","69","6a","6b","6c","6d","6e","6f","70","71","72","73","74","75","76","77","78","79","7a","7b","7c","7d","7e","7f","80","81","82","83","84","85","86","87","88","89","8a","8b","8c","8d","8e","8f","90","91","92","93","94","95","96","97","98","99","9a","9b","9c","9d","9e","9f","a0","a1","a2","a3","a4","a5","a6","a7","a8","a9","aa","ab","ac","ad","ae","af","b0","b1","b2","b3","b4","b5","b6","b7","b8","b9","ba","bb","bc","bd","be","bf","c0","c1","c2","c3","c4","c5","c6","c7","c8","c9","ca","cb","cc","cd","ce","cf","d0","d1","d2","d3","d4","d5","d6","d7","d8","d9","da","db","dc","dd","de","df","e0","e1","e2","e3","e4","e5","e6","e7","e8","e9","ea","eb","ec","ed","ee","ef","f0","f1","f2","f3","f4","f5","f6","f7","f8","f9","fa","fb","fc","fd","fe","ff"],x7=1234567,Z0=Math.PI/180,l0=180/Math.PI;function aJ(){let z=Math.random()*4294967295|0,J=Math.random()*4294967295|0,Q=Math.random()*4294967295|0,$=Math.random()*4294967295|0;return(hJ[z&255]+hJ[z>>8&255]+hJ[z>>16&255]+hJ[z>>24&255]+"-"+hJ[J&255]+hJ[J>>8&255]+"-"+hJ[J>>16&15|64]+hJ[J>>24&255]+"-"+hJ[Q&63|128]+hJ[Q>>8&255]+"-"+hJ[Q>>16&255]+hJ[Q>>24&255]+hJ[$&255]+hJ[$>>8&255]+hJ[$>>16&255]+hJ[$>>24&255]).toLowerCase()}function dz(z,J,Q){return Math.max(J,Math.min(Q,z))}function w6(z,J){return(z%J+J)%J}function YK(z,J,Q,$,K){return $+(z-J)*(K-$)/(Q-J)}function XK(z,J,Q){if(z!==J)return(Q-z)/(J-z);else return 0}function k1(z,J,Q){return(1-Q)*z+Q*J}function kK(z,J,Q,$){return k1(z,J,1-Math.exp(-Q*$))}function EK(z,J=1){return J-Math.abs(w6(z,J*2)-J)}function IK(z,J,Q){if(z<=J)return 0;if(z>=Q)return 1;return z=(z-J)/(Q-J),z*z*(3-2*z)}function AK(z,J,Q){if(z<=J)return 0;if(z>=Q)return 1;return z=(z-J)/(Q-J),z*z*z*(z*(z*6-15)+10)}function OK(z,J){return z+Math.floor(Math.random()*(J-z+1))}function FK(z,J){return z+Math.random()*(J-z)}function MK(z){return z*(0.5-Math.random())}function LK(z){if(z!==void 0)x7=z;let J=x7+=1831565813;return J=Math.imul(J^J>>>15,J|1),J^=J+Math.imul(J^J>>>7,J|61),((J^J>>>14)>>>0)/4294967296}function yK(z){return z*Z0}function SK(z){return z*l0}function wK(z){return(z&z-1)===0&&z!==0}function CK(z){return Math.pow(2,Math.ceil(Math.log(z)/Math.LN2))}function RK(z){return Math.pow(2,Math.floor(Math.log(z)/Math.LN2))}function PK(z,J,Q,$,K){let{cos:W,sin:q}=Math,B=W(Q/2),G=q(Q/2),N=W((J+$)/2),Z=q((J+$)/2),H=W((J-$)/2),D=q((J-$)/2),U=W(($-J)/2),X=q(($-J)/2);switch(K){case"XYX":z.set(B*Z,G*H,G*D,B*N);break;case"YZY":z.set(G*D,B*Z,G*H,B*N);break;case"ZXZ":z.set(G*H,G*D,B*Z,B*N);break;case"XZX":z.set(B*Z,G*X,G*U,B*N);break;case"YXY":z.set(G*U,B*Z,G*X,B*N);break;case"ZYZ":z.set(G*X,G*U,B*Z,B*N);break;default:Bz("MathUtils: .setQuaternionFromProperEuler() encountered an unknown order: "+K)}}function uJ(z,J){switch(J.constructor){case Float32Array:return z;case Uint32Array:return z/4294967295;case Uint16Array:return z/65535;case Uint8Array:return z/255;case Int32Array:return Math.max(z/2147483647,-1);case Int16Array:return Math.max(z/32767,-1);case Int8Array:return Math.max(z/127,-1);default:throw Error("THREE.MathUtils: Invalid component type.")}}function iz(z,J){switch(J.constructor){case Float32Array:return z;case Uint32Array:return Math.round(z*4294967295);case Uint16Array:return Math.round(z*65535);case Uint8Array:return Math.round(z*255);case Int32Array:return Math.round(z*2147483647);case Int16Array:return Math.round(z*32767);case Int8Array:return Math.round(z*127);default:throw Error("THREE.MathUtils: Invalid component type.")}}var vK={DEG2RAD:Z0,RAD2DEG:l0,generateUUID:aJ,clamp:dz,euclideanModulo:w6,mapLinear:YK,inverseLerp:XK,lerp:k1,damp:kK,pingpong:EK,smoothstep:IK,smootherstep:AK,randInt:OK,randFloat:FK,randFloatSpread:MK,seededRandom:LK,degToRad:yK,radToDeg:SK,isPowerOfTwo:wK,ceilPowerOfTwo:CK,floorPowerOfTwo:RK,setQuaternionFromProperEuler:PK,normalize:iz,denormalize:uJ};class a{static{a.prototype.isVector2=!0}constructor(z=0,J=0){this.x=z,this.y=J}get width(){return this.x}set width(z){this.x=z}get height(){return this.y}set height(z){this.y=z}set(z,J){return this.x=z,this.y=J,this}setScalar(z){return this.x=z,this.y=z,this}setX(z){return this.x=z,this}setY(z){return this.y=z,this}setComponent(z,J){switch(z){case 0:this.x=J;break;case 1:this.y=J;break;default:throw Error("THREE.Vector2: index is out of range: "+z)}return this}getComponent(z){switch(z){case 0:return this.x;case 1:return this.y;default:throw Error("THREE.Vector2: index is out of range: "+z)}}clone(){return new this.constructor(this.x,this.y)}copy(z){return this.x=z.x,this.y=z.y,this}add(z){return this.x+=z.x,this.y+=z.y,this}addScalar(z){return this.x+=z,this.y+=z,this}addVectors(z,J){return this.x=z.x+J.x,this.y=z.y+J.y,this}addScaledVector(z,J){return this.x+=z.x*J,this.y+=z.y*J,this}sub(z){return this.x-=z.x,this.y-=z.y,this}subScalar(z){return this.x-=z,this.y-=z,this}subVectors(z,J){return this.x=z.x-J.x,this.y=z.y-J.y,this}multiply(z){return this.x*=z.x,this.y*=z.y,this}multiplyScalar(z){return this.x*=z,this.y*=z,this}divide(z){return this.x/=z.x,this.y/=z.y,this}divideScalar(z){return this.multiplyScalar(1/z)}applyMatrix3(z){let J=this.x,Q=this.y,$=z.elements;return this.x=$[0]*J+$[3]*Q+$[6],this.y=$[1]*J+$[4]*Q+$[7],this}min(z){return this.x=Math.min(this.x,z.x),this.y=Math.min(this.y,z.y),this}max(z){return this.x=Math.max(this.x,z.x),this.y=Math.max(this.y,z.y),this}clamp(z,J){return this.x=dz(this.x,z.x,J.x),this.y=dz(this.y,z.y,J.y),this}clampScalar(z,J){return this.x=dz(this.x,z,J),this.y=dz(this.y,z,J),this}clampLength(z,J){let Q=this.length();return this.divideScalar(Q||1).multiplyScalar(dz(Q,z,J))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this}negate(){return this.x=-this.x,this.y=-this.y,this}dot(z){return this.x*z.x+this.y*z.y}cross(z){return this.x*z.y-this.y*z.x}lengthSq(){return this.x*this.x+this.y*this.y}length(){return Math.sqrt(this.x*this.x+this.y*this.y)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)}normalize(){return this.divideScalar(this.length()||1)}angle(){return Math.atan2(-this.y,-this.x)+Math.PI}angleTo(z){let J=Math.sqrt(this.lengthSq()*z.lengthSq());if(J===0)return Math.PI/2;let Q=this.dot(z)/J;return Math.acos(dz(Q,-1,1))}distanceTo(z){return Math.sqrt(this.distanceToSquared(z))}distanceToSquared(z){let J=this.x-z.x,Q=this.y-z.y;return J*J+Q*Q}manhattanDistanceTo(z){return Math.abs(this.x-z.x)+Math.abs(this.y-z.y)}setLength(z){return this.normalize().multiplyScalar(z)}lerp(z,J){return this.x+=(z.x-this.x)*J,this.y+=(z.y-this.y)*J,this}lerpVectors(z,J,Q){return this.x=z.x+(J.x-z.x)*Q,this.y=z.y+(J.y-z.y)*Q,this}equals(z){return z.x===this.x&&z.y===this.y}fromArray(z,J=0){return this.x=z[J],this.y=z[J+1],this}toArray(z=[],J=0){return z[J]=this.x,z[J+1]=this.y,z}fromBufferAttribute(z,J){return this.x=z.getX(J),this.y=z.getY(J),this}rotateAround(z,J){let Q=Math.cos(J),$=Math.sin(J),K=this.x-z.x,W=this.y-z.y;return this.x=K*Q-W*$+z.x,this.y=K*$+W*Q+z.y,this}random(){return this.x=Math.random(),this.y=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y}}class _J{constructor(z=0,J=0,Q=0,$=1){this.isQuaternion=!0,this._x=z,this._y=J,this._z=Q,this._w=$}static slerpFlat(z,J,Q,$,K,W,q){let B=Q[$+0],G=Q[$+1],N=Q[$+2],Z=Q[$+3],H=K[W+0],D=K[W+1],U=K[W+2],X=K[W+3];if(Z!==X||B!==H||G!==D||N!==U){let k=B*H+G*D+N*U+Z*X;if(k<0)H=-H,D=-D,U=-U,X=-X,k=-k;let Y=1-q;if(k<0.9995){let V=Math.acos(k),L=Math.sin(V);Y=Math.sin(Y*V)/L,q=Math.sin(q*V)/L,B=B*Y+H*q,G=G*Y+D*q,N=N*Y+U*q,Z=Z*Y+X*q}else{B=B*Y+H*q,G=G*Y+D*q,N=N*Y+U*q,Z=Z*Y+X*q;let V=1/Math.sqrt(B*B+G*G+N*N+Z*Z);B*=V,G*=V,N*=V,Z*=V}}z[J]=B,z[J+1]=G,z[J+2]=N,z[J+3]=Z}static multiplyQuaternionsFlat(z,J,Q,$,K,W){let q=Q[$],B=Q[$+1],G=Q[$+2],N=Q[$+3],Z=K[W],H=K[W+1],D=K[W+2],U=K[W+3];return z[J]=q*U+N*Z+B*D-G*H,z[J+1]=B*U+N*H+G*Z-q*D,z[J+2]=G*U+N*D+q*H-B*Z,z[J+3]=N*U-q*Z-B*H-G*D,z}get x(){return this._x}set x(z){this._x=z,this._onChangeCallback()}get y(){return this._y}set y(z){this._y=z,this._onChangeCallback()}get z(){return this._z}set z(z){this._z=z,this._onChangeCallback()}get w(){return this._w}set w(z){this._w=z,this._onChangeCallback()}set(z,J,Q,$){return this._x=z,this._y=J,this._z=Q,this._w=$,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._w)}copy(z){return this._x=z.x,this._y=z.y,this._z=z.z,this._w=z.w,this._onChangeCallback(),this}setFromEuler(z,J=!0){let{_x:Q,_y:$,_z:K,_order:W}=z,q=Math.cos,B=Math.sin,G=q(Q/2),N=q($/2),Z=q(K/2),H=B(Q/2),D=B($/2),U=B(K/2);switch(W){case"XYZ":this._x=H*N*Z+G*D*U,this._y=G*D*Z-H*N*U,this._z=G*N*U+H*D*Z,this._w=G*N*Z-H*D*U;break;case"YXZ":this._x=H*N*Z+G*D*U,this._y=G*D*Z-H*N*U,this._z=G*N*U-H*D*Z,this._w=G*N*Z+H*D*U;break;case"ZXY":this._x=H*N*Z-G*D*U,this._y=G*D*Z+H*N*U,this._z=G*N*U+H*D*Z,this._w=G*N*Z-H*D*U;break;case"ZYX":this._x=H*N*Z-G*D*U,this._y=G*D*Z+H*N*U,this._z=G*N*U-H*D*Z,this._w=G*N*Z+H*D*U;break;case"YZX":this._x=H*N*Z+G*D*U,this._y=G*D*Z+H*N*U,this._z=G*N*U-H*D*Z,this._w=G*N*Z-H*D*U;break;case"XZY":this._x=H*N*Z-G*D*U,this._y=G*D*Z-H*N*U,this._z=G*N*U+H*D*Z,this._w=G*N*Z+H*D*U;break;default:Bz("Quaternion: .setFromEuler() encountered an unknown order: "+W)}if(J===!0)this._onChangeCallback();return this}setFromAxisAngle(z,J){let Q=J/2,$=Math.sin(Q);return this._x=z.x*$,this._y=z.y*$,this._z=z.z*$,this._w=Math.cos(Q),this._onChangeCallback(),this}setFromRotationMatrix(z){let J=z.elements,Q=J[0],$=J[4],K=J[8],W=J[1],q=J[5],B=J[9],G=J[2],N=J[6],Z=J[10],H=Q+q+Z;if(H>0){let D=0.5/Math.sqrt(H+1);this._w=0.25/D,this._x=(N-B)*D,this._y=(K-G)*D,this._z=(W-$)*D}else if(Q>q&&Q>Z){let D=2*Math.sqrt(1+Q-q-Z);this._w=(N-B)/D,this._x=0.25*D,this._y=($+W)/D,this._z=(K+G)/D}else if(q>Z){let D=2*Math.sqrt(1+q-Q-Z);this._w=(K-G)/D,this._x=($+W)/D,this._y=0.25*D,this._z=(B+N)/D}else{let D=2*Math.sqrt(1+Z-Q-q);this._w=(W-$)/D,this._x=(K+G)/D,this._y=(B+N)/D,this._z=0.25*D}return this._onChangeCallback(),this}setFromUnitVectors(z,J){let Q=z.dot(J)+1;if(Q<0.00000001)if(Q=0,Math.abs(z.x)>Math.abs(z.z))this._x=-z.y,this._y=z.x,this._z=0,this._w=Q;else this._x=0,this._y=-z.z,this._z=z.y,this._w=Q;else this._x=z.y*J.z-z.z*J.y,this._y=z.z*J.x-z.x*J.z,this._z=z.x*J.y-z.y*J.x,this._w=Q;return this.normalize()}angleTo(z){return 2*Math.acos(Math.abs(dz(this.dot(z),-1,1)))}rotateTowards(z,J){let Q=this.angleTo(z);if(Q===0)return this;let $=Math.min(1,J/Q);return this.slerp(z,$),this}identity(){return this.set(0,0,0,1)}invert(){return this.conjugate()}conjugate(){return this._x*=-1,this._y*=-1,this._z*=-1,this._onChangeCallback(),this}dot(z){return this._x*z._x+this._y*z._y+this._z*z._z+this._w*z._w}lengthSq(){return this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w}length(){return Math.sqrt(this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w)}normalize(){let z=this.length();if(z===0)this._x=0,this._y=0,this._z=0,this._w=1;else z=1/z,this._x=this._x*z,this._y=this._y*z,this._z=this._z*z,this._w=this._w*z;return this._onChangeCallback(),this}multiply(z){return this.multiplyQuaternions(this,z)}premultiply(z){return this.multiplyQuaternions(z,this)}multiplyQuaternions(z,J){let{_x:Q,_y:$,_z:K,_w:W}=z,q=J._x,B=J._y,G=J._z,N=J._w;return this._x=Q*N+W*q+$*G-K*B,this._y=$*N+W*B+K*q-Q*G,this._z=K*N+W*G+Q*B-$*q,this._w=W*N-Q*q-$*B-K*G,this._onChangeCallback(),this}slerp(z,J){let{_x:Q,_y:$,_z:K,_w:W}=z,q=this.dot(z);if(q<0)Q=-Q,$=-$,K=-K,W=-W,q=-q;let B=1-J;if(q<0.9995){let G=Math.acos(q),N=Math.sin(G);B=Math.sin(B*G)/N,J=Math.sin(J*G)/N,this._x=this._x*B+Q*J,this._y=this._y*B+$*J,this._z=this._z*B+K*J,this._w=this._w*B+W*J,this._onChangeCallback()}else this._x=this._x*B+Q*J,this._y=this._y*B+$*J,this._z=this._z*B+K*J,this._w=this._w*B+W*J,this.normalize();return this}slerpQuaternions(z,J,Q){return this.copy(z).slerp(J,Q)}random(){let z=2*Math.PI*Math.random(),J=2*Math.PI*Math.random(),Q=Math.random(),$=Math.sqrt(1-Q),K=Math.sqrt(Q);return this.set($*Math.sin(z),$*Math.cos(z),K*Math.sin(J),K*Math.cos(J))}equals(z){return z._x===this._x&&z._y===this._y&&z._z===this._z&&z._w===this._w}fromArray(z,J=0){return this._x=z[J],this._y=z[J+1],this._z=z[J+2],this._w=z[J+3],this._onChangeCallback(),this}toArray(z=[],J=0){return z[J]=this._x,z[J+1]=this._y,z[J+2]=this._z,z[J+3]=this._w,z}fromBufferAttribute(z,J){return this._x=z.getX(J),this._y=z.getY(J),this._z=z.getZ(J),this._w=z.getW(J),this._onChangeCallback(),this}toJSON(){return this.toArray()}_onChange(z){return this._onChangeCallback=z,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._w}}class R{static{R.prototype.isVector3=!0}constructor(z=0,J=0,Q=0){this.x=z,this.y=J,this.z=Q}set(z,J,Q){if(Q===void 0)Q=this.z;return this.x=z,this.y=J,this.z=Q,this}setScalar(z){return this.x=z,this.y=z,this.z=z,this}setX(z){return this.x=z,this}setY(z){return this.y=z,this}setZ(z){return this.z=z,this}setComponent(z,J){switch(z){case 0:this.x=J;break;case 1:this.y=J;break;case 2:this.z=J;break;default:throw Error("THREE.Vector3: index is out of range: "+z)}return this}getComponent(z){switch(z){case 0:return this.x;case 1:return this.y;case 2:return this.z;default:throw Error("THREE.Vector3: index is out of range: "+z)}}clone(){return new this.constructor(this.x,this.y,this.z)}copy(z){return this.x=z.x,this.y=z.y,this.z=z.z,this}add(z){return this.x+=z.x,this.y+=z.y,this.z+=z.z,this}addScalar(z){return this.x+=z,this.y+=z,this.z+=z,this}addVectors(z,J){return this.x=z.x+J.x,this.y=z.y+J.y,this.z=z.z+J.z,this}addScaledVector(z,J){return this.x+=z.x*J,this.y+=z.y*J,this.z+=z.z*J,this}sub(z){return this.x-=z.x,this.y-=z.y,this.z-=z.z,this}subScalar(z){return this.x-=z,this.y-=z,this.z-=z,this}subVectors(z,J){return this.x=z.x-J.x,this.y=z.y-J.y,this.z=z.z-J.z,this}multiply(z){return this.x*=z.x,this.y*=z.y,this.z*=z.z,this}multiplyScalar(z){return this.x*=z,this.y*=z,this.z*=z,this}multiplyVectors(z,J){return this.x=z.x*J.x,this.y=z.y*J.y,this.z=z.z*J.z,this}applyEuler(z){return this.applyQuaternion(j7.setFromEuler(z))}applyAxisAngle(z,J){return this.applyQuaternion(j7.setFromAxisAngle(z,J))}applyMatrix3(z){let J=this.x,Q=this.y,$=this.z,K=z.elements;return this.x=K[0]*J+K[3]*Q+K[6]*$,this.y=K[1]*J+K[4]*Q+K[7]*$,this.z=K[2]*J+K[5]*Q+K[8]*$,this}applyNormalMatrix(z){return this.applyMatrix3(z).normalize()}applyMatrix4(z){let J=this.x,Q=this.y,$=this.z,K=z.elements,W=1/(K[3]*J+K[7]*Q+K[11]*$+K[15]);return this.x=(K[0]*J+K[4]*Q+K[8]*$+K[12])*W,this.y=(K[1]*J+K[5]*Q+K[9]*$+K[13])*W,this.z=(K[2]*J+K[6]*Q+K[10]*$+K[14])*W,this}applyQuaternion(z){let J=this.x,Q=this.y,$=this.z,K=z.x,W=z.y,q=z.z,B=z.w,G=2*(W*$-q*Q),N=2*(q*J-K*$),Z=2*(K*Q-W*J);return this.x=J+B*G+W*Z-q*N,this.y=Q+B*N+q*G-K*Z,this.z=$+B*Z+K*N-W*G,this}project(z){return this.applyMatrix4(z.matrixWorldInverse).applyMatrix4(z.projectionMatrix)}unproject(z){return this.applyMatrix4(z.projectionMatrixInverse).applyMatrix4(z.matrixWorld)}transformDirection(z){let J=this.x,Q=this.y,$=this.z,K=z.elements;return this.x=K[0]*J+K[4]*Q+K[8]*$,this.y=K[1]*J+K[5]*Q+K[9]*$,this.z=K[2]*J+K[6]*Q+K[10]*$,this.normalize()}divide(z){return this.x/=z.x,this.y/=z.y,this.z/=z.z,this}divideScalar(z){return this.multiplyScalar(1/z)}min(z){return this.x=Math.min(this.x,z.x),this.y=Math.min(this.y,z.y),this.z=Math.min(this.z,z.z),this}max(z){return this.x=Math.max(this.x,z.x),this.y=Math.max(this.y,z.y),this.z=Math.max(this.z,z.z),this}clamp(z,J){return this.x=dz(this.x,z.x,J.x),this.y=dz(this.y,z.y,J.y),this.z=dz(this.z,z.z,J.z),this}clampScalar(z,J){return this.x=dz(this.x,z,J),this.y=dz(this.y,z,J),this.z=dz(this.z,z,J),this}clampLength(z,J){let Q=this.length();return this.divideScalar(Q||1).multiplyScalar(dz(Q,z,J))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this}dot(z){return this.x*z.x+this.y*z.y+this.z*z.z}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)}normalize(){return this.divideScalar(this.length()||1)}setLength(z){return this.normalize().multiplyScalar(z)}lerp(z,J){return this.x+=(z.x-this.x)*J,this.y+=(z.y-this.y)*J,this.z+=(z.z-this.z)*J,this}lerpVectors(z,J,Q){return this.x=z.x+(J.x-z.x)*Q,this.y=z.y+(J.y-z.y)*Q,this.z=z.z+(J.z-z.z)*Q,this}cross(z){return this.crossVectors(this,z)}crossVectors(z,J){let{x:Q,y:$,z:K}=z,W=J.x,q=J.y,B=J.z;return this.x=$*B-K*q,this.y=K*W-Q*B,this.z=Q*q-$*W,this}projectOnVector(z){let J=z.lengthSq();if(J===0)return this.set(0,0,0);let Q=z.dot(this)/J;return this.copy(z).multiplyScalar(Q)}projectOnPlane(z){return R5.copy(this).projectOnVector(z),this.sub(R5)}reflect(z){return this.sub(R5.copy(z).multiplyScalar(2*this.dot(z)))}angleTo(z){let J=Math.sqrt(this.lengthSq()*z.lengthSq());if(J===0)return Math.PI/2;let Q=this.dot(z)/J;return Math.acos(dz(Q,-1,1))}distanceTo(z){return Math.sqrt(this.distanceToSquared(z))}distanceToSquared(z){let J=this.x-z.x,Q=this.y-z.y,$=this.z-z.z;return J*J+Q*Q+$*$}manhattanDistanceTo(z){return Math.abs(this.x-z.x)+Math.abs(this.y-z.y)+Math.abs(this.z-z.z)}setFromSpherical(z){return this.setFromSphericalCoords(z.radius,z.phi,z.theta)}setFromSphericalCoords(z,J,Q){let $=Math.sin(J)*z;return this.x=$*Math.sin(Q),this.y=Math.cos(J)*z,this.z=$*Math.cos(Q),this}setFromCylindrical(z){return this.setFromCylindricalCoords(z.radius,z.theta,z.y)}setFromCylindricalCoords(z,J,Q){return this.x=z*Math.sin(J),this.y=Q,this.z=z*Math.cos(J),this}setFromMatrixPosition(z){let J=z.elements;return this.x=J[12],this.y=J[13],this.z=J[14],this}setFromMatrixScale(z){let J=this.setFromMatrixColumn(z,0).length(),Q=this.setFromMatrixColumn(z,1).length(),$=this.setFromMatrixColumn(z,2).length();return this.x=J,this.y=Q,this.z=$,this}setFromMatrixColumn(z,J){return this.fromArray(z.elements,J*4)}setFromMatrix3Column(z,J){return this.fromArray(z.elements,J*3)}setFromEuler(z){return this.x=z._x,this.y=z._y,this.z=z._z,this}setFromColor(z){return this.x=z.r,this.y=z.g,this.z=z.b,this}equals(z){return z.x===this.x&&z.y===this.y&&z.z===this.z}fromArray(z,J=0){return this.x=z[J],this.y=z[J+1],this.z=z[J+2],this}toArray(z=[],J=0){return z[J]=this.x,z[J+1]=this.y,z[J+2]=this.z,z}fromBufferAttribute(z,J){return this.x=z.getX(J),this.y=z.getY(J),this.z=z.getZ(J),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this}randomDirection(){let z=Math.random()*Math.PI*2,J=Math.random()*2-1,Q=Math.sqrt(1-J*J);return this.x=Q*Math.cos(z),this.y=J,this.z=Q*Math.sin(z),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z}}var R5=new R,j7=new _J;class lz{static{lz.prototype.isMatrix3=!0}constructor(z,J,Q,$,K,W,q,B,G){if(this.elements=[1,0,0,0,1,0,0,0,1],z!==void 0)this.set(z,J,Q,$,K,W,q,B,G)}set(z,J,Q,$,K,W,q,B,G){let N=this.elements;return N[0]=z,N[1]=$,N[2]=q,N[3]=J,N[4]=K,N[5]=B,N[6]=Q,N[7]=W,N[8]=G,this}identity(){return this.set(1,0,0,0,1,0,0,0,1),this}copy(z){let J=this.elements,Q=z.elements;return J[0]=Q[0],J[1]=Q[1],J[2]=Q[2],J[3]=Q[3],J[4]=Q[4],J[5]=Q[5],J[6]=Q[6],J[7]=Q[7],J[8]=Q[8],this}extractBasis(z,J,Q){return z.setFromMatrix3Column(this,0),J.setFromMatrix3Column(this,1),Q.setFromMatrix3Column(this,2),this}setFromMatrix4(z){let J=z.elements;return this.set(J[0],J[4],J[8],J[1],J[5],J[9],J[2],J[6],J[10]),this}multiply(z){return this.multiplyMatrices(this,z)}premultiply(z){return this.multiplyMatrices(z,this)}multiplyMatrices(z,J){let Q=z.elements,$=J.elements,K=this.elements,W=Q[0],q=Q[3],B=Q[6],G=Q[1],N=Q[4],Z=Q[7],H=Q[2],D=Q[5],U=Q[8],X=$[0],k=$[3],Y=$[6],V=$[1],L=$[4],O=$[7],I=$[2],S=$[5],w=$[8];return K[0]=W*X+q*V+B*I,K[3]=W*k+q*L+B*S,K[6]=W*Y+q*O+B*w,K[1]=G*X+N*V+Z*I,K[4]=G*k+N*L+Z*S,K[7]=G*Y+N*O+Z*w,K[2]=H*X+D*V+U*I,K[5]=H*k+D*L+U*S,K[8]=H*Y+D*O+U*w,this}multiplyScalar(z){let J=this.elements;return J[0]*=z,J[3]*=z,J[6]*=z,J[1]*=z,J[4]*=z,J[7]*=z,J[2]*=z,J[5]*=z,J[8]*=z,this}determinant(){let z=this.elements,J=z[0],Q=z[1],$=z[2],K=z[3],W=z[4],q=z[5],B=z[6],G=z[7],N=z[8];return J*W*N-J*q*G-Q*K*N+Q*q*B+$*K*G-$*W*B}invert(){let z=this.elements,J=z[0],Q=z[1],$=z[2],K=z[3],W=z[4],q=z[5],B=z[6],G=z[7],N=z[8],Z=N*W-q*G,H=q*B-N*K,D=G*K-W*B,U=J*Z+Q*H+$*D;if(U===0)return this.set(0,0,0,0,0,0,0,0,0);let X=1/U;return z[0]=Z*X,z[1]=($*G-N*Q)*X,z[2]=(q*Q-$*W)*X,z[3]=H*X,z[4]=(N*J-$*B)*X,z[5]=($*K-q*J)*X,z[6]=D*X,z[7]=(Q*B-G*J)*X,z[8]=(W*J-Q*K)*X,this}transpose(){let z,J=this.elements;return z=J[1],J[1]=J[3],J[3]=z,z=J[2],J[2]=J[6],J[6]=z,z=J[5],J[5]=J[7],J[7]=z,this}getNormalMatrix(z){return this.setFromMatrix4(z).invert().transpose()}transposeIntoArray(z){let J=this.elements;return z[0]=J[0],z[1]=J[3],z[2]=J[6],z[3]=J[1],z[4]=J[4],z[5]=J[7],z[6]=J[2],z[7]=J[5],z[8]=J[8],this}setUvTransform(z,J,Q,$,K,W,q){let B=Math.cos(K),G=Math.sin(K);return this.set(Q*B,Q*G,-Q*(B*W+G*q)+W+z,-$*G,$*B,-$*(-G*W+B*q)+q+J,0,0,1),this}scale(z,J){return gQ("Matrix3: .scale() is deprecated. Use .makeScale() instead."),this.premultiply(P5.makeScale(z,J)),this}rotate(z){return gQ("Matrix3: .rotate() is deprecated. Use .makeRotation() instead."),this.premultiply(P5.makeRotation(-z)),this}translate(z,J){return gQ("Matrix3: .translate() is deprecated. Use .makeTranslation() instead."),this.premultiply(P5.makeTranslation(z,J)),this}makeTranslation(z,J){if(z.isVector2)this.set(1,0,z.x,0,1,z.y,0,0,1);else this.set(1,0,z,0,1,J,0,0,1);return this}makeRotation(z){let J=Math.cos(z),Q=Math.sin(z);return this.set(J,-Q,0,Q,J,0,0,0,1),this}makeScale(z,J){return this.set(z,0,0,0,J,0,0,0,1),this}equals(z){let J=this.elements,Q=z.elements;for(let $=0;$<9;$++)if(J[$]!==Q[$])return!1;return!0}fromArray(z,J=0){for(let Q=0;Q<9;Q++)this.elements[Q]=z[Q+J];return this}toArray(z=[],J=0){let Q=this.elements;return z[J]=Q[0],z[J+1]=Q[1],z[J+2]=Q[2],z[J+3]=Q[3],z[J+4]=Q[4],z[J+5]=Q[5],z[J+6]=Q[6],z[J+7]=Q[7],z[J+8]=Q[8],z}clone(){return new this.constructor().fromArray(this.elements)}}var P5=new lz,_7=new lz().set(0.4123908,0.3575843,0.1804808,0.212639,0.7151687,0.0721923,0.0193308,0.1191948,0.9505322),b7=new lz().set(3.2409699,-1.5373832,-0.4986108,-0.9692436,1.8759675,0.0415551,0.0556301,-0.203977,1.0569715);function fK(){let z={enabled:!0,workingColorSpace:"srgb-linear",spaces:{},convert:function(K,W,q){if(this.enabled===!1||W===q||!W||!q)return K;if(this.spaces[W].transfer==="srgb")K.r=wQ(K.r),K.g=wQ(K.g),K.b=wQ(K.b);if(this.spaces[W].primaries!==this.spaces[q].primaries)K.applyMatrix3(this.spaces[W].toXYZ),K.applyMatrix3(this.spaces[q].fromXYZ);if(this.spaces[q].transfer==="srgb")K.r=g0(K.r),K.g=g0(K.g),K.b=g0(K.b);return K},workingToColorSpace:function(K,W){return this.convert(K,this.workingColorSpace,W)},colorSpaceToWorking:function(K,W){return this.convert(K,W,this.workingColorSpace)},getPrimaries:function(K){return this.spaces[K].primaries},getTransfer:function(K){if(K==="")return"linear";return this.spaces[K].transfer},getToneMappingMode:function(K){return this.spaces[K].outputColorSpaceConfig.toneMappingMode||"standard"},getLuminanceCoefficients:function(K,W=this.workingColorSpace){return K.fromArray(this.spaces[W].luminanceCoefficients)},define:function(K){Object.assign(this.spaces,K)},_getMatrix:function(K,W,q){return K.copy(this.spaces[W].toXYZ).multiply(this.spaces[q].fromXYZ)},_getDrawingBufferColorSpace:function(K){return this.spaces[K].outputColorSpaceConfig.drawingBufferColorSpace},_getUnpackColorSpace:function(K=this.workingColorSpace){return this.spaces[K].workingColorSpaceConfig.unpackColorSpace},fromWorkingColorSpace:function(K,W){return gQ("ColorManagement: .fromWorkingColorSpace() has been renamed to .workingToColorSpace()."),z.workingToColorSpace(K,W)},toWorkingColorSpace:function(K,W){return gQ("ColorManagement: .toWorkingColorSpace() has been renamed to .colorSpaceToWorking()."),z.colorSpaceToWorking(K,W)}},J=[0.64,0.33,0.3,0.6,0.15,0.06],Q=[0.2126,0.7152,0.0722],$=[0.3127,0.329];return z.define({["srgb-linear"]:{primaries:J,whitePoint:$,transfer:"linear",toXYZ:_7,fromXYZ:b7,luminanceCoefficients:Q,workingColorSpaceConfig:{unpackColorSpace:"srgb"},outputColorSpaceConfig:{drawingBufferColorSpace:"srgb"}},["srgb"]:{primaries:J,whitePoint:$,transfer:"srgb",toXYZ:_7,fromXYZ:b7,luminanceCoefficients:Q,outputColorSpaceConfig:{drawingBufferColorSpace:"srgb"}}}),z}var zJ=fK();function wQ(z){return z<0.04045?z*0.0773993808:Math.pow(z*0.9478672986+0.0521327014,2.4)}function g0(z){return z<0.0031308?z*12.92:1.055*Math.pow(z,0.41666)-0.055}var A0;class C6{static getDataURL(z,J="image/png"){if(/^data:/i.test(z.src))return z.src;if(typeof HTMLCanvasElement>"u")return z.src;let Q;if(z instanceof HTMLCanvasElement)Q=z;else{if(A0===void 0)A0=F1("canvas");A0.width=z.width,A0.height=z.height;let $=A0.getContext("2d");if(z instanceof ImageData)$.putImageData(z,0,0);else $.drawImage(z,0,0,z.width,z.height);Q=A0}return Q.toDataURL(J)}static sRGBToLinear(z){if(typeof HTMLImageElement<"u"&&z instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&z instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&z instanceof ImageBitmap){let J=F1("canvas");J.width=z.width,J.height=z.height;let Q=J.getContext("2d");Q.drawImage(z,0,0,z.width,z.height);let $=Q.getImageData(0,0,z.width,z.height),K=$.data;for(let W=0;W<K.length;W++)K[W]=wQ(K[W]/255)*255;return Q.putImageData($,0,0),J}else if(z.data){let J=z.data.slice(0);for(let Q=0;Q<J.length;Q++)if(J instanceof Uint8Array||J instanceof Uint8ClampedArray)J[Q]=Math.floor(wQ(J[Q]/255)*255);else J[Q]=wQ(J[Q]);return{data:J,width:z.width,height:z.height}}else return Bz("ImageUtils.sRGBToLinear(): Unsupported image type. No color space conversion applied."),z}}var TK=0;class SQ{constructor(z=null){this.isSource=!0,Object.defineProperty(this,"id",{value:TK++}),this.uuid=aJ(),this.data=z,this.dataReady=!0,this.version=0}getSize(z){let J=this.data;if(typeof HTMLVideoElement<"u"&&J instanceof HTMLVideoElement)z.set(J.videoWidth,J.videoHeight,0);else if(typeof VideoFrame<"u"&&J instanceof VideoFrame)z.set(J.displayWidth,J.displayHeight,0);else if(J!==null)z.set(J.width,J.height,J.depth||0);else z.set(0,0,0);return z}set needsUpdate(z){if(z===!0)this.version++}toJSON(z){let J=z===void 0||typeof z==="string";if(!J&&z.images[this.uuid]!==void 0)return z.images[this.uuid];let Q={uuid:this.uuid,url:""},$=this.data;if($!==null){let K;if(Array.isArray($)){K=[];for(let W=0,q=$.length;W<q;W++)if($[W].isDataTexture)K.push(v5($[W].image));else K.push(v5($[W]))}else K=v5($);Q.url=K}if(!J)z.images[this.uuid]=Q;return Q}}function v5(z){if(typeof HTMLImageElement<"u"&&z instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&z instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&z instanceof ImageBitmap)return C6.getDataURL(z);else if(z.data)return{data:Array.from(z.data),width:z.width,height:z.height,type:z.data.constructor.name};else return Bz("Texture: Unable to serialize Texture."),{}}var hK=0,f5=new R;class kJ extends QQ{constructor(z=kJ.DEFAULT_IMAGE,J=kJ.DEFAULT_MAPPING,Q=1001,$=1001,K=1006,W=1008,q=1023,B=1009,G=kJ.DEFAULT_ANISOTROPY,N=""){super();this.isTexture=!0,Object.defineProperty(this,"id",{value:hK++}),this.uuid=aJ(),this.name="",this.source=new SQ(z),this.mipmaps=[],this.mapping=J,this.channel=0,this.wrapS=Q,this.wrapT=$,this.magFilter=K,this.minFilter=W,this.anisotropy=G,this.format=q,this.internalFormat=null,this.type=B,this.offset=new a(0,0),this.repeat=new a(1,1),this.center=new a(0,0),this.rotation=0,this.matrixAutoUpdate=!0,this.matrix=new lz,this.generateMipmaps=!0,this.premultiplyAlpha=!1,this.flipY=!0,this.unpackAlignment=4,this.colorSpace=N,this.userData={},this.updateRanges=[],this.version=0,this.onUpdate=null,this.renderTarget=null,this.isRenderTargetTexture=!1,this.isArrayTexture=z&&z.depth&&z.depth>1?!0:!1,this.pmremVersion=0,this.normalized=!1}get width(){return this.source.getSize(f5).x}get height(){return this.source.getSize(f5).y}get depth(){return this.source.getSize(f5).z}get image(){return this.source.data}set image(z){this.source.data=z}updateMatrix(){this.matrix.setUvTransform(this.offset.x,this.offset.y,this.repeat.x,this.repeat.y,this.rotation,this.center.x,this.center.y)}addUpdateRange(z,J){this.updateRanges.push({start:z,count:J})}clearUpdateRanges(){this.updateRanges.length=0}clone(){return new this.constructor().copy(this)}copy(z){return this.name=z.name,this.source=z.source,this.mipmaps=z.mipmaps.slice(0),this.mapping=z.mapping,this.channel=z.channel,this.wrapS=z.wrapS,this.wrapT=z.wrapT,this.magFilter=z.magFilter,this.minFilter=z.minFilter,this.anisotropy=z.anisotropy,this.format=z.format,this.internalFormat=z.internalFormat,this.type=z.type,this.normalized=z.normalized,this.offset.copy(z.offset),this.repeat.copy(z.repeat),this.center.copy(z.center),this.rotation=z.rotation,this.matrixAutoUpdate=z.matrixAutoUpdate,this.matrix.copy(z.matrix),this.generateMipmaps=z.generateMipmaps,this.premultiplyAlpha=z.premultiplyAlpha,this.flipY=z.flipY,this.unpackAlignment=z.unpackAlignment,this.colorSpace=z.colorSpace,this.renderTarget=z.renderTarget,this.isRenderTargetTexture=z.isRenderTargetTexture,this.isArrayTexture=z.isArrayTexture,this.userData=JSON.parse(JSON.stringify(z.userData)),this.needsUpdate=!0,this}setValues(z){for(let J in z){let Q=z[J];if(Q===void 0){Bz(`Texture.setValues(): parameter '${J}' has value of undefined.`);continue}let $=this[J];if($===void 0){Bz(`Texture.setValues(): property '${J}' does not exist.`);continue}if($&&Q&&($.isVector2&&Q.isVector2))$.copy(Q);else if($&&Q&&($.isVector3&&Q.isVector3))$.copy(Q);else if($&&Q&&($.isMatrix3&&Q.isMatrix3))$.copy(Q);else this[J]=Q}}toJSON(z){let J=z===void 0||typeof z==="string";if(!J&&z.textures[this.uuid]!==void 0)return z.textures[this.uuid];let Q={metadata:{version:4.7,type:"Texture",generator:"Texture.toJSON"},uuid:this.uuid,name:this.name,image:this.source.toJSON(z).uuid,mapping:this.mapping,channel:this.channel,repeat:[this.repeat.x,this.repeat.y],offset:[this.offset.x,this.offset.y],center:[this.center.x,this.center.y],rotation:this.rotation,wrap:[this.wrapS,this.wrapT],format:this.format,internalFormat:this.internalFormat,type:this.type,normalized:this.normalized,colorSpace:this.colorSpace,minFilter:this.minFilter,magFilter:this.magFilter,anisotropy:this.anisotropy,flipY:this.flipY,generateMipmaps:this.generateMipmaps,premultiplyAlpha:this.premultiplyAlpha,unpackAlignment:this.unpackAlignment};if(Object.keys(this.userData).length>0)Q.userData=this.userData;if(!J)z.textures[this.uuid]=Q;return Q}dispose(){this.dispatchEvent({type:"dispose"})}transformUv(z){if(this.mapping!==300)return z;if(z.applyMatrix3(this.matrix),z.x<0||z.x>1)switch(this.wrapS){case 1000:z.x=z.x-Math.floor(z.x);break;case 1001:z.x=z.x<0?0:1;break;case 1002:if(Math.abs(Math.floor(z.x)%2)===1)z.x=Math.ceil(z.x)-z.x;else z.x=z.x-Math.floor(z.x);break}if(z.y<0||z.y>1)switch(this.wrapT){case 1000:z.y=z.y-Math.floor(z.y);break;case 1001:z.y=z.y<0?0:1;break;case 1002:if(Math.abs(Math.floor(z.y)%2)===1)z.y=Math.ceil(z.y)-z.y;else z.y=z.y-Math.floor(z.y);break}if(this.flipY)z.y=1-z.y;return z}set needsUpdate(z){if(z===!0)this.version++,this.source.needsUpdate=!0}set needsPMREMUpdate(z){if(z===!0)this.pmremVersion++}}kJ.DEFAULT_IMAGE=null;kJ.DEFAULT_MAPPING=300;kJ.DEFAULT_ANISOTROPY=1;class BJ{static{BJ.prototype.isVector4=!0}constructor(z=0,J=0,Q=0,$=1){this.x=z,this.y=J,this.z=Q,this.w=$}get width(){return this.z}set width(z){this.z=z}get height(){return this.w}set height(z){this.w=z}set(z,J,Q,$){return this.x=z,this.y=J,this.z=Q,this.w=$,this}setScalar(z){return this.x=z,this.y=z,this.z=z,this.w=z,this}setX(z){return this.x=z,this}setY(z){return this.y=z,this}setZ(z){return this.z=z,this}setW(z){return this.w=z,this}setComponent(z,J){switch(z){case 0:this.x=J;break;case 1:this.y=J;break;case 2:this.z=J;break;case 3:this.w=J;break;default:throw Error("THREE.Vector4: index is out of range: "+z)}return this}getComponent(z){switch(z){case 0:return this.x;case 1:return this.y;case 2:return this.z;case 3:return this.w;default:throw Error("THREE.Vector4: index is out of range: "+z)}}clone(){return new this.constructor(this.x,this.y,this.z,this.w)}copy(z){return this.x=z.x,this.y=z.y,this.z=z.z,this.w=z.w!==void 0?z.w:1,this}add(z){return this.x+=z.x,this.y+=z.y,this.z+=z.z,this.w+=z.w,this}addScalar(z){return this.x+=z,this.y+=z,this.z+=z,this.w+=z,this}addVectors(z,J){return this.x=z.x+J.x,this.y=z.y+J.y,this.z=z.z+J.z,this.w=z.w+J.w,this}addScaledVector(z,J){return this.x+=z.x*J,this.y+=z.y*J,this.z+=z.z*J,this.w+=z.w*J,this}sub(z){return this.x-=z.x,this.y-=z.y,this.z-=z.z,this.w-=z.w,this}subScalar(z){return this.x-=z,this.y-=z,this.z-=z,this.w-=z,this}subVectors(z,J){return this.x=z.x-J.x,this.y=z.y-J.y,this.z=z.z-J.z,this.w=z.w-J.w,this}multiply(z){return this.x*=z.x,this.y*=z.y,this.z*=z.z,this.w*=z.w,this}multiplyScalar(z){return this.x*=z,this.y*=z,this.z*=z,this.w*=z,this}applyMatrix4(z){let J=this.x,Q=this.y,$=this.z,K=this.w,W=z.elements;return this.x=W[0]*J+W[4]*Q+W[8]*$+W[12]*K,this.y=W[1]*J+W[5]*Q+W[9]*$+W[13]*K,this.z=W[2]*J+W[6]*Q+W[10]*$+W[14]*K,this.w=W[3]*J+W[7]*Q+W[11]*$+W[15]*K,this}divide(z){return this.x/=z.x,this.y/=z.y,this.z/=z.z,this.w/=z.w,this}divideScalar(z){return this.multiplyScalar(1/z)}setAxisAngleFromQuaternion(z){this.w=2*Math.acos(z.w);let J=Math.sqrt(1-z.w*z.w);if(J<0.0001)this.x=1,this.y=0,this.z=0;else this.x=z.x/J,this.y=z.y/J,this.z=z.z/J;return this}setAxisAngleFromRotationMatrix(z){let J,Q,$,K,W=0.01,q=0.1,B=z.elements,G=B[0],N=B[4],Z=B[8],H=B[1],D=B[5],U=B[9],X=B[2],k=B[6],Y=B[10];if(Math.abs(N-H)<0.01&&Math.abs(Z-X)<0.01&&Math.abs(U-k)<0.01){if(Math.abs(N+H)<0.1&&Math.abs(Z+X)<0.1&&Math.abs(U+k)<0.1&&Math.abs(G+D+Y-3)<0.1)return this.set(1,0,0,0),this;J=Math.PI;let L=(G+1)/2,O=(D+1)/2,I=(Y+1)/2,S=(N+H)/4,w=(Z+X)/4,C=(U+k)/4;if(L>O&&L>I)if(L<0.01)Q=0,$=0.707106781,K=0.707106781;else Q=Math.sqrt(L),$=S/Q,K=w/Q;else if(O>I)if(O<0.01)Q=0.707106781,$=0,K=0.707106781;else $=Math.sqrt(O),Q=S/$,K=C/$;else if(I<0.01)Q=0.707106781,$=0.707106781,K=0;else K=Math.sqrt(I),Q=w/K,$=C/K;return this.set(Q,$,K,J),this}let V=Math.sqrt((k-U)*(k-U)+(Z-X)*(Z-X)+(H-N)*(H-N));if(Math.abs(V)<0.001)V=1;return this.x=(k-U)/V,this.y=(Z-X)/V,this.z=(H-N)/V,this.w=Math.acos((G+D+Y-1)/2),this}setFromMatrixPosition(z){let J=z.elements;return this.x=J[12],this.y=J[13],this.z=J[14],this.w=J[15],this}min(z){return this.x=Math.min(this.x,z.x),this.y=Math.min(this.y,z.y),this.z=Math.min(this.z,z.z),this.w=Math.min(this.w,z.w),this}max(z){return this.x=Math.max(this.x,z.x),this.y=Math.max(this.y,z.y),this.z=Math.max(this.z,z.z),this.w=Math.max(this.w,z.w),this}clamp(z,J){return this.x=dz(this.x,z.x,J.x),this.y=dz(this.y,z.y,J.y),this.z=dz(this.z,z.z,J.z),this.w=dz(this.w,z.w,J.w),this}clampScalar(z,J){return this.x=dz(this.x,z,J),this.y=dz(this.y,z,J),this.z=dz(this.z,z,J),this.w=dz(this.w,z,J),this}clampLength(z,J){let Q=this.length();return this.divideScalar(Q||1).multiplyScalar(dz(Q,z,J))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this.w=Math.floor(this.w),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this.w=Math.ceil(this.w),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this.w=Math.round(this.w),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this.w=Math.trunc(this.w),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this.w=-this.w,this}dot(z){return this.x*z.x+this.y*z.y+this.z*z.z+this.w*z.w}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)+Math.abs(this.w)}normalize(){return this.divideScalar(this.length()||1)}setLength(z){return this.normalize().multiplyScalar(z)}lerp(z,J){return this.x+=(z.x-this.x)*J,this.y+=(z.y-this.y)*J,this.z+=(z.z-this.z)*J,this.w+=(z.w-this.w)*J,this}lerpVectors(z,J,Q){return this.x=z.x+(J.x-z.x)*Q,this.y=z.y+(J.y-z.y)*Q,this.z=z.z+(J.z-z.z)*Q,this.w=z.w+(J.w-z.w)*Q,this}equals(z){return z.x===this.x&&z.y===this.y&&z.z===this.z&&z.w===this.w}fromArray(z,J=0){return this.x=z[J],this.y=z[J+1],this.z=z[J+2],this.w=z[J+3],this}toArray(z=[],J=0){return z[J]=this.x,z[J+1]=this.y,z[J+2]=this.z,z[J+3]=this.w,z}fromBufferAttribute(z,J){return this.x=z.getX(J),this.y=z.getY(J),this.z=z.getZ(J),this.w=z.getW(J),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this.w=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z,yield this.w}}class b2 extends QQ{constructor(z=1,J=1,Q={}){super();Q=Object.assign({generateMipmaps:!1,internalFormat:null,minFilter:1006,depthBuffer:!0,stencilBuffer:!1,resolveDepthBuffer:!0,resolveStencilBuffer:!0,depthTexture:null,samples:0,count:1,depth:1,multiview:!1,useArrayDepthTexture:!1},Q),this.isRenderTarget=!0,this.width=z,this.height=J,this.depth=Q.depth,this.scissor=new BJ(0,0,z,J),this.scissorTest=!1,this.viewport=new BJ(0,0,z,J),this.textures=[];let $={width:z,height:J,depth:Q.depth},K=new kJ($),W=Q.count;for(let q=0;q<W;q++)this.textures[q]=K.clone(),this.textures[q].isRenderTargetTexture=!0,this.textures[q].renderTarget=this;this._setTextureOptions(Q),this.depthBuffer=Q.depthBuffer,this.stencilBuffer=Q.stencilBuffer,this.resolveDepthBuffer=Q.resolveDepthBuffer,this.resolveStencilBuffer=Q.resolveStencilBuffer,this._depthTexture=null,this.depthTexture=Q.depthTexture,this.samples=Q.samples,this.multiview=Q.multiview,this.useArrayDepthTexture=Q.useArrayDepthTexture}_setTextureOptions(z={}){let J={minFilter:1006,generateMipmaps:!1,flipY:!1,internalFormat:null};if(z.mapping!==void 0)J.mapping=z.mapping;if(z.wrapS!==void 0)J.wrapS=z.wrapS;if(z.wrapT!==void 0)J.wrapT=z.wrapT;if(z.wrapR!==void 0)J.wrapR=z.wrapR;if(z.magFilter!==void 0)J.magFilter=z.magFilter;if(z.minFilter!==void 0)J.minFilter=z.minFilter;if(z.format!==void 0)J.format=z.format;if(z.type!==void 0)J.type=z.type;if(z.anisotropy!==void 0)J.anisotropy=z.anisotropy;if(z.colorSpace!==void 0)J.colorSpace=z.colorSpace;if(z.flipY!==void 0)J.flipY=z.flipY;if(z.generateMipmaps!==void 0)J.generateMipmaps=z.generateMipmaps;if(z.internalFormat!==void 0)J.internalFormat=z.internalFormat;for(let Q=0;Q<this.textures.length;Q++)this.textures[Q].setValues(J)}get texture(){return this.textures[0]}set texture(z){this.textures[0]=z}set depthTexture(z){if(this._depthTexture!==null)this._depthTexture.renderTarget=null;if(z!==null)z.renderTarget=this;this._depthTexture=z}get depthTexture(){return this._depthTexture}setSize(z,J,Q=1){if(this.width!==z||this.height!==J||this.depth!==Q){this.width=z,this.height=J,this.depth=Q;for(let $=0,K=this.textures.length;$<K;$++)if(this.textures[$].image.width=z,this.textures[$].image.height=J,this.textures[$].image.depth=Q,this.textures[$].isData3DTexture!==!0)this.textures[$].isArrayTexture=this.textures[$].image.depth>1;this.dispose()}this.viewport.set(0,0,z,J),this.scissor.set(0,0,z,J)}clone(){return new this.constructor().copy(this)}copy(z){this.width=z.width,this.height=z.height,this.depth=z.depth,this.scissor.copy(z.scissor),this.scissorTest=z.scissorTest,this.viewport.copy(z.viewport),this.textures.length=0;for(let J=0,Q=z.textures.length;J<Q;J++){this.textures[J]=z.textures[J].clone(),this.textures[J].isRenderTargetTexture=!0,this.textures[J].renderTarget=this;let $=Object.assign({},z.textures[J].image);this.textures[J].source=new SQ($)}if(this.depthBuffer=z.depthBuffer,this.stencilBuffer=z.stencilBuffer,this.resolveDepthBuffer=z.resolveDepthBuffer,this.resolveStencilBuffer=z.resolveStencilBuffer,z.depthTexture!==null)this.depthTexture=z.depthTexture.clone();return this.samples=z.samples,this.multiview=z.multiview,this.useArrayDepthTexture=z.useArrayDepthTexture,this}dispose(){this.dispatchEvent({type:"dispose"})}}class nJ extends b2{constructor(z=1,J=1,Q={}){super(z,J,Q);this.isWebGLRenderTarget=!0}}class w1 extends kJ{constructor(z=null,J=1,Q=1,$=1){super(null);this.isDataArrayTexture=!0,this.image={data:z,width:J,height:Q,depth:$},this.magFilter=1003,this.minFilter=1003,this.wrapR=1001,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1,this.layerUpdates=new Set}addLayerUpdate(z){this.layerUpdates.add(z)}clearLayerUpdates(){this.layerUpdates.clear()}}class Y9 extends nJ{constructor(z=1,J=1,Q=1,$={}){super(z,J,$);this.isWebGLArrayRenderTarget=!0,this.depth=Q,this.texture=new w1(null,z,J,Q),this._setTextureOptions($),this.texture.isRenderTargetTexture=!0}}class C1 extends kJ{constructor(z=null,J=1,Q=1,$=1){super(null);this.isData3DTexture=!0,this.image={data:z,width:J,height:Q,depth:$},this.magFilter=1003,this.minFilter=1003,this.wrapR=1001,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}}class X9 extends nJ{constructor(z=1,J=1,Q=1,$={}){super(z,J,$);this.isWebGL3DRenderTarget=!0,this.depth=Q,this.texture=new C1(null,z,J,Q),this._setTextureOptions($),this.texture.isRenderTargetTexture=!0}}class pz{static{pz.prototype.isMatrix4=!0}constructor(z,J,Q,$,K,W,q,B,G,N,Z,H,D,U,X,k){if(this.elements=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],z!==void 0)this.set(z,J,Q,$,K,W,q,B,G,N,Z,H,D,U,X,k)}set(z,J,Q,$,K,W,q,B,G,N,Z,H,D,U,X,k){let Y=this.elements;return Y[0]=z,Y[4]=J,Y[8]=Q,Y[12]=$,Y[1]=K,Y[5]=W,Y[9]=q,Y[13]=B,Y[2]=G,Y[6]=N,Y[10]=Z,Y[14]=H,Y[3]=D,Y[7]=U,Y[11]=X,Y[15]=k,this}identity(){return this.set(1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1),this}clone(){return new pz().fromArray(this.elements)}copy(z){let J=this.elements,Q=z.elements;return J[0]=Q[0],J[1]=Q[1],J[2]=Q[2],J[3]=Q[3],J[4]=Q[4],J[5]=Q[5],J[6]=Q[6],J[7]=Q[7],J[8]=Q[8],J[9]=Q[9],J[10]=Q[10],J[11]=Q[11],J[12]=Q[12],J[13]=Q[13],J[14]=Q[14],J[15]=Q[15],this}copyPosition(z){let J=this.elements,Q=z.elements;return J[12]=Q[12],J[13]=Q[13],J[14]=Q[14],this}setFromMatrix3(z){let J=z.elements;return this.set(J[0],J[3],J[6],0,J[1],J[4],J[7],0,J[2],J[5],J[8],0,0,0,0,1),this}extractBasis(z,J,Q){if(this.determinantAffine()===0)return z.set(1,0,0),J.set(0,1,0),Q.set(0,0,1),this;return z.setFromMatrixColumn(this,0),J.setFromMatrixColumn(this,1),Q.setFromMatrixColumn(this,2),this}makeBasis(z,J,Q){return this.set(z.x,J.x,Q.x,0,z.y,J.y,Q.y,0,z.z,J.z,Q.z,0,0,0,0,1),this}extractRotation(z){if(z.determinantAffine()===0)return this.identity();let J=this.elements,Q=z.elements,$=1/O0.setFromMatrixColumn(z,0).length(),K=1/O0.setFromMatrixColumn(z,1).length(),W=1/O0.setFromMatrixColumn(z,2).length();return J[0]=Q[0]*$,J[1]=Q[1]*$,J[2]=Q[2]*$,J[3]=0,J[4]=Q[4]*K,J[5]=Q[5]*K,J[6]=Q[6]*K,J[7]=0,J[8]=Q[8]*W,J[9]=Q[9]*W,J[10]=Q[10]*W,J[11]=0,J[12]=0,J[13]=0,J[14]=0,J[15]=1,this}makeRotationFromEuler(z){let J=this.elements,Q=z.x,$=z.y,K=z.z,W=Math.cos(Q),q=Math.sin(Q),B=Math.cos($),G=Math.sin($),N=Math.cos(K),Z=Math.sin(K);if(z.order==="XYZ"){let H=W*N,D=W*Z,U=q*N,X=q*Z;J[0]=B*N,J[4]=-B*Z,J[8]=G,J[1]=D+U*G,J[5]=H-X*G,J[9]=-q*B,J[2]=X-H*G,J[6]=U+D*G,J[10]=W*B}else if(z.order==="YXZ"){let H=B*N,D=B*Z,U=G*N,X=G*Z;J[0]=H+X*q,J[4]=U*q-D,J[8]=W*G,J[1]=W*Z,J[5]=W*N,J[9]=-q,J[2]=D*q-U,J[6]=X+H*q,J[10]=W*B}else if(z.order==="ZXY"){let H=B*N,D=B*Z,U=G*N,X=G*Z;J[0]=H-X*q,J[4]=-W*Z,J[8]=U+D*q,J[1]=D+U*q,J[5]=W*N,J[9]=X-H*q,J[2]=-W*G,J[6]=q,J[10]=W*B}else if(z.order==="ZYX"){let H=W*N,D=W*Z,U=q*N,X=q*Z;J[0]=B*N,J[4]=U*G-D,J[8]=H*G+X,J[1]=B*Z,J[5]=X*G+H,J[9]=D*G-U,J[2]=-G,J[6]=q*B,J[10]=W*B}else if(z.order==="YZX"){let H=W*B,D=W*G,U=q*B,X=q*G;J[0]=B*N,J[4]=X-H*Z,J[8]=U*Z+D,J[1]=Z,J[5]=W*N,J[9]=-q*N,J[2]=-G*N,J[6]=D*Z+U,J[10]=H-X*Z}else if(z.order==="XZY"){let H=W*B,D=W*G,U=q*B,X=q*G;J[0]=B*N,J[4]=-Z,J[8]=G*N,J[1]=H*Z+X,J[5]=W*N,J[9]=D*Z-U,J[2]=U*Z-D,J[6]=q*N,J[10]=X*Z+H}return J[3]=0,J[7]=0,J[11]=0,J[12]=0,J[13]=0,J[14]=0,J[15]=1,this}makeRotationFromQuaternion(z){return this.compose(xK,z,jK)}lookAt(z,J,Q){let $=this.elements;if(sJ.subVectors(z,J),sJ.lengthSq()===0)sJ.z=1;if(sJ.normalize(),hQ.crossVectors(Q,sJ),hQ.lengthSq()===0){if(Math.abs(Q.z)===1)sJ.x+=0.0001;else sJ.z+=0.0001;sJ.normalize(),hQ.crossVectors(Q,sJ)}return hQ.normalize(),g1.crossVectors(sJ,hQ),$[0]=hQ.x,$[4]=g1.x,$[8]=sJ.x,$[1]=hQ.y,$[5]=g1.y,$[9]=sJ.y,$[2]=hQ.z,$[6]=g1.z,$[10]=sJ.z,this}multiply(z){return this.multiplyMatrices(this,z)}premultiply(z){return this.multiplyMatrices(z,this)}multiplyMatrices(z,J){let Q=z.elements,$=J.elements,K=this.elements,W=Q[0],q=Q[4],B=Q[8],G=Q[12],N=Q[1],Z=Q[5],H=Q[9],D=Q[13],U=Q[2],X=Q[6],k=Q[10],Y=Q[14],V=Q[3],L=Q[7],O=Q[11],I=Q[15],S=$[0],w=$[4],C=$[8],E=$[12],F=$[1],x=$[5],P=$[9],p=$[13],n=$[2],j=$[6],m=$[10],l=$[14],_=$[3],t=$[7],$z=$[11],qz=$[15];return K[0]=W*S+q*F+B*n+G*_,K[4]=W*w+q*x+B*j+G*t,K[8]=W*C+q*P+B*m+G*$z,K[12]=W*E+q*p+B*l+G*qz,K[1]=N*S+Z*F+H*n+D*_,K[5]=N*w+Z*x+H*j+D*t,K[9]=N*C+Z*P+H*m+D*$z,K[13]=N*E+Z*p+H*l+D*qz,K[2]=U*S+X*F+k*n+Y*_,K[6]=U*w+X*x+k*j+Y*t,K[10]=U*C+X*P+k*m+Y*$z,K[14]=U*E+X*p+k*l+Y*qz,K[3]=V*S+L*F+O*n+I*_,K[7]=V*w+L*x+O*j+I*t,K[11]=V*C+L*P+O*m+I*$z,K[15]=V*E+L*p+O*l+I*qz,this}multiplyScalar(z){let J=this.elements;return J[0]*=z,J[4]*=z,J[8]*=z,J[12]*=z,J[1]*=z,J[5]*=z,J[9]*=z,J[13]*=z,J[2]*=z,J[6]*=z,J[10]*=z,J[14]*=z,J[3]*=z,J[7]*=z,J[11]*=z,J[15]*=z,this}determinant(){let z=this.elements,J=z[0],Q=z[4],$=z[8],K=z[12],W=z[1],q=z[5],B=z[9],G=z[13],N=z[2],Z=z[6],H=z[10],D=z[14],U=z[3],X=z[7],k=z[11],Y=z[15],V=B*D-G*H,L=q*D-G*Z,O=q*H-B*Z,I=W*D-G*N,S=W*H-B*N,w=W*Z-q*N;return J*(X*V-k*L+Y*O)-Q*(U*V-k*I+Y*S)+$*(U*L-X*I+Y*w)-K*(U*O-X*S+k*w)}determinantAffine(){let z=this.elements,J=z[0],Q=z[4],$=z[8],K=z[1],W=z[5],q=z[9],B=z[2],G=z[6],N=z[10];return J*(W*N-q*G)-Q*(K*N-q*B)+$*(K*G-W*B)}transpose(){let z=this.elements,J;return J=z[1],z[1]=z[4],z[4]=J,J=z[2],z[2]=z[8],z[8]=J,J=z[6],z[6]=z[9],z[9]=J,J=z[3],z[3]=z[12],z[12]=J,J=z[7],z[7]=z[13],z[13]=J,J=z[11],z[11]=z[14],z[14]=J,this}setPosition(z,J,Q){let $=this.elements;if(z.isVector3)$[12]=z.x,$[13]=z.y,$[14]=z.z;else $[12]=z,$[13]=J,$[14]=Q;return this}invert(){let z=this.elements,J=z[0],Q=z[1],$=z[2],K=z[3],W=z[4],q=z[5],B=z[6],G=z[7],N=z[8],Z=z[9],H=z[10],D=z[11],U=z[12],X=z[13],k=z[14],Y=z[15],V=J*q-Q*W,L=J*B-$*W,O=J*G-K*W,I=Q*B-$*q,S=Q*G-K*q,w=$*G-K*B,C=N*X-Z*U,E=N*k-H*U,F=N*Y-D*U,x=Z*k-H*X,P=Z*Y-D*X,p=H*Y-D*k,n=V*p-L*P+O*x+I*F-S*E+w*C;if(n===0)return this.set(0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0);let j=1/n;return z[0]=(q*p-B*P+G*x)*j,z[1]=($*P-Q*p-K*x)*j,z[2]=(X*w-k*S+Y*I)*j,z[3]=(H*S-Z*w-D*I)*j,z[4]=(B*F-W*p-G*E)*j,z[5]=(J*p-$*F+K*E)*j,z[6]=(k*O-U*w-Y*L)*j,z[7]=(N*w-H*O+D*L)*j,z[8]=(W*P-q*F+G*C)*j,z[9]=(Q*F-J*P-K*C)*j,z[10]=(U*S-X*O+Y*V)*j,z[11]=(Z*O-N*S-D*V)*j,z[12]=(q*E-W*x-B*C)*j,z[13]=(J*x-Q*E+$*C)*j,z[14]=(X*L-U*I-k*V)*j,z[15]=(N*I-Z*L+H*V)*j,this}scale(z){let J=this.elements,Q=z.x,$=z.y,K=z.z;return J[0]*=Q,J[4]*=$,J[8]*=K,J[1]*=Q,J[5]*=$,J[9]*=K,J[2]*=Q,J[6]*=$,J[10]*=K,J[3]*=Q,J[7]*=$,J[11]*=K,this}getMaxScaleOnAxis(){let z=this.elements,J=z[0]*z[0]+z[1]*z[1]+z[2]*z[2],Q=z[4]*z[4]+z[5]*z[5]+z[6]*z[6],$=z[8]*z[8]+z[9]*z[9]+z[10]*z[10];return Math.sqrt(Math.max(J,Q,$))}makeTranslation(z,J,Q){if(z.isVector3)this.set(1,0,0,z.x,0,1,0,z.y,0,0,1,z.z,0,0,0,1);else this.set(1,0,0,z,0,1,0,J,0,0,1,Q,0,0,0,1);return this}makeRotationX(z){let J=Math.cos(z),Q=Math.sin(z);return this.set(1,0,0,0,0,J,-Q,0,0,Q,J,0,0,0,0,1),this}makeRotationY(z){let J=Math.cos(z),Q=Math.sin(z);return this.set(J,0,Q,0,0,1,0,0,-Q,0,J,0,0,0,0,1),this}makeRotationZ(z){let J=Math.cos(z),Q=Math.sin(z);return this.set(J,-Q,0,0,Q,J,0,0,0,0,1,0,0,0,0,1),this}makeRotationAxis(z,J){let Q=Math.cos(J),$=Math.sin(J),K=1-Q,W=z.x,q=z.y,B=z.z,G=K*W,N=K*q;return this.set(G*W+Q,G*q-$*B,G*B+$*q,0,G*q+$*B,N*q+Q,N*B-$*W,0,G*B-$*q,N*B+$*W,K*B*B+Q,0,0,0,0,1),this}makeScale(z,J,Q){return this.set(z,0,0,0,0,J,0,0,0,0,Q,0,0,0,0,1),this}makeShear(z,J,Q,$,K,W){return this.set(1,Q,K,0,z,1,W,0,J,$,1,0,0,0,0,1),this}compose(z,J,Q){let $=this.elements,K=J._x,W=J._y,q=J._z,B=J._w,G=K+K,N=W+W,Z=q+q,H=K*G,D=K*N,U=K*Z,X=W*N,k=W*Z,Y=q*Z,V=B*G,L=B*N,O=B*Z,I=Q.x,S=Q.y,w=Q.z;return $[0]=(1-(X+Y))*I,$[1]=(D+O)*I,$[2]=(U-L)*I,$[3]=0,$[4]=(D-O)*S,$[5]=(1-(H+Y))*S,$[6]=(k+V)*S,$[7]=0,$[8]=(U+L)*w,$[9]=(k-V)*w,$[10]=(1-(H+X))*w,$[11]=0,$[12]=z.x,$[13]=z.y,$[14]=z.z,$[15]=1,this}decompose(z,J,Q){let $=this.elements;z.x=$[12],z.y=$[13],z.z=$[14];let K=this.determinantAffine();if(K===0)return Q.set(1,1,1),J.identity(),this;let W=O0.set($[0],$[1],$[2]).length(),q=O0.set($[4],$[5],$[6]).length(),B=O0.set($[8],$[9],$[10]).length();if(K<0)W=-W;KQ.copy(this);let G=1/W,N=1/q,Z=1/B;return KQ.elements[0]*=G,KQ.elements[1]*=G,KQ.elements[2]*=G,KQ.elements[4]*=N,KQ.elements[5]*=N,KQ.elements[6]*=N,KQ.elements[8]*=Z,KQ.elements[9]*=Z,KQ.elements[10]*=Z,J.setFromRotationMatrix(KQ),Q.x=W,Q.y=q,Q.z=B,this}makePerspective(z,J,Q,$,K,W,q=2000,B=!1){let G=this.elements,N=2*K/(J-z),Z=2*K/(Q-$),H=(J+z)/(J-z),D=(Q+$)/(Q-$),U,X;if(B)U=K/(W-K),X=W*K/(W-K);else if(q===2000)U=-(W+K)/(W-K),X=-2*W*K/(W-K);else if(q===2001)U=-W/(W-K),X=-W*K/(W-K);else throw Error("THREE.Matrix4.makePerspective(): Invalid coordinate system: "+q);return G[0]=N,G[4]=0,G[8]=H,G[12]=0,G[1]=0,G[5]=Z,G[9]=D,G[13]=0,G[2]=0,G[6]=0,G[10]=U,G[14]=X,G[3]=0,G[7]=0,G[11]=-1,G[15]=0,this}makeOrthographic(z,J,Q,$,K,W,q=2000,B=!1){let G=this.elements,N=2/(J-z),Z=2/(Q-$),H=-(J+z)/(J-z),D=-(Q+$)/(Q-$),U,X;if(B)U=1/(W-K),X=W/(W-K);else if(q===2000)U=-2/(W-K),X=-(W+K)/(W-K);else if(q===2001)U=-1/(W-K),X=-K/(W-K);else throw Error("THREE.Matrix4.makeOrthographic(): Invalid coordinate system: "+q);return G[0]=N,G[4]=0,G[8]=0,G[12]=H,G[1]=0,G[5]=Z,G[9]=0,G[13]=D,G[2]=0,G[6]=0,G[10]=U,G[14]=X,G[3]=0,G[7]=0,G[11]=0,G[15]=1,this}equals(z){let J=this.elements,Q=z.elements;for(let $=0;$<16;$++)if(J[$]!==Q[$])return!1;return!0}fromArray(z,J=0){for(let Q=0;Q<16;Q++)this.elements[Q]=z[Q+J];return this}toArray(z=[],J=0){let Q=this.elements;return z[J]=Q[0],z[J+1]=Q[1],z[J+2]=Q[2],z[J+3]=Q[3],z[J+4]=Q[4],z[J+5]=Q[5],z[J+6]=Q[6],z[J+7]=Q[7],z[J+8]=Q[8],z[J+9]=Q[9],z[J+10]=Q[10],z[J+11]=Q[11],z[J+12]=Q[12],z[J+13]=Q[13],z[J+14]=Q[14],z[J+15]=Q[15],z}}var O0=new R,KQ=new pz,xK=new R(0,0,0),jK=new R(1,1,1),hQ=new R,g1=new R,sJ=new R,d7=new pz,p7=new _J;class NQ{constructor(z=0,J=0,Q=0,$=NQ.DEFAULT_ORDER){this.isEuler=!0,this._x=z,this._y=J,this._z=Q,this._order=$}get x(){return this._x}set x(z){this._x=z,this._onChangeCallback()}get y(){return this._y}set y(z){this._y=z,this._onChangeCallback()}get z(){return this._z}set z(z){this._z=z,this._onChangeCallback()}get order(){return this._order}set order(z){this._order=z,this._onChangeCallback()}set(z,J,Q,$=this._order){return this._x=z,this._y=J,this._z=Q,this._order=$,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._order)}copy(z){return this._x=z._x,this._y=z._y,this._z=z._z,this._order=z._order,this._onChangeCallback(),this}setFromRotationMatrix(z,J=this._order,Q=!0){let $=z.elements,K=$[0],W=$[4],q=$[8],B=$[1],G=$[5],N=$[9],Z=$[2],H=$[6],D=$[10];switch(J){case"XYZ":if(this._y=Math.asin(dz(q,-1,1)),Math.abs(q)<0.9999999)this._x=Math.atan2(-N,D),this._z=Math.atan2(-W,K);else this._x=Math.atan2(H,G),this._z=0;break;case"YXZ":if(this._x=Math.asin(-dz(N,-1,1)),Math.abs(N)<0.9999999)this._y=Math.atan2(q,D),this._z=Math.atan2(B,G);else this._y=Math.atan2(-Z,K),this._z=0;break;case"ZXY":if(this._x=Math.asin(dz(H,-1,1)),Math.abs(H)<0.9999999)this._y=Math.atan2(-Z,D),this._z=Math.atan2(-W,G);else this._y=0,this._z=Math.atan2(B,K);break;case"ZYX":if(this._y=Math.asin(-dz(Z,-1,1)),Math.abs(Z)<0.9999999)this._x=Math.atan2(H,D),this._z=Math.atan2(B,K);else this._x=0,this._z=Math.atan2(-W,G);break;case"YZX":if(this._z=Math.asin(dz(B,-1,1)),Math.abs(B)<0.9999999)this._x=Math.atan2(-N,G),this._y=Math.atan2(-Z,K);else this._x=0,this._y=Math.atan2(q,D);break;case"XZY":if(this._z=Math.asin(-dz(W,-1,1)),Math.abs(W)<0.9999999)this._x=Math.atan2(H,G),this._y=Math.atan2(q,K);else this._x=Math.atan2(-N,D),this._y=0;break;default:Bz("Euler: .setFromRotationMatrix() encountered an unknown order: "+J)}if(this._order=J,Q===!0)this._onChangeCallback();return this}setFromQuaternion(z,J,Q){return d7.makeRotationFromQuaternion(z),this.setFromRotationMatrix(d7,J,Q)}setFromVector3(z,J=this._order){return this.set(z.x,z.y,z.z,J)}reorder(z){return p7.setFromEuler(this),this.setFromQuaternion(p7,z)}equals(z){return z._x===this._x&&z._y===this._y&&z._z===this._z&&z._order===this._order}fromArray(z){if(this._x=z[0],this._y=z[1],this._z=z[2],z[3]!==void 0)this._order=z[3];return this._onChangeCallback(),this}toArray(z=[],J=0){return z[J]=this._x,z[J+1]=this._y,z[J+2]=this._z,z[J+3]=this._order,z}_onChange(z){return this._onChangeCallback=z,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._order}}NQ.DEFAULT_ORDER="XYZ";class R1{constructor(){this.mask=1}set(z){this.mask=(1<<z|0)>>>0}enable(z){this.mask|=1<<z|0}enableAll(){this.mask=-1}toggle(z){this.mask^=1<<z|0}disable(z){this.mask&=~(1<<z|0)}disableAll(){this.mask=0}test(z){return(this.mask&z.mask)!==0}isEnabled(z){return(this.mask&(1<<z|0))!==0}}var _K=0,u7=new R,F0=new _J,EQ=new pz,l1=new R,z1=new R,bK=new R,dK=new _J,g7=new R(1,0,0),l7=new R(0,1,0),m7=new R(0,0,1),c7={type:"added"},pK={type:"removed"},M0={type:"childadded",child:null},T5={type:"childremoved",child:null};class KJ extends QQ{constructor(){super();this.isObject3D=!0,Object.defineProperty(this,"id",{value:_K++}),this.uuid=aJ(),this.name="",this.type="Object3D",this.parent=null,this.children=[],this.up=KJ.DEFAULT_UP.clone();let z=new R,J=new NQ,Q=new _J,$=new R(1,1,1);function K(){Q.setFromEuler(J,!1)}function W(){J.setFromQuaternion(Q,void 0,!1)}J._onChange(K),Q._onChange(W),Object.defineProperties(this,{position:{configurable:!0,enumerable:!0,value:z},rotation:{configurable:!0,enumerable:!0,value:J},quaternion:{configurable:!0,enumerable:!0,value:Q},scale:{configurable:!0,enumerable:!0,value:$},modelViewMatrix:{value:new pz},normalMatrix:{value:new lz}}),this.matrix=new pz,this.matrixWorld=new pz,this.matrixAutoUpdate=KJ.DEFAULT_MATRIX_AUTO_UPDATE,this.matrixWorldAutoUpdate=KJ.DEFAULT_MATRIX_WORLD_AUTO_UPDATE,this.matrixWorldNeedsUpdate=!1,this.layers=new R1,this.visible=!0,this.castShadow=!1,this.receiveShadow=!1,this.frustumCulled=!0,this.renderOrder=0,this.animations=[],this.customDepthMaterial=void 0,this.customDistanceMaterial=void 0,this.static=!1,this.userData={},this.pivot=null}onBeforeShadow(){}onAfterShadow(){}onBeforeRender(){}onAfterRender(){}applyMatrix4(z){if(this.matrixAutoUpdate)this.updateMatrix();this.matrix.premultiply(z),this.matrix.decompose(this.position,this.quaternion,this.scale)}applyQuaternion(z){return this.quaternion.premultiply(z),this}setRotationFromAxisAngle(z,J){this.quaternion.setFromAxisAngle(z,J)}setRotationFromEuler(z){this.quaternion.setFromEuler(z,!0)}setRotationFromMatrix(z){this.quaternion.setFromRotationMatrix(z)}setRotationFromQuaternion(z){this.quaternion.copy(z)}rotateOnAxis(z,J){return F0.setFromAxisAngle(z,J),this.quaternion.multiply(F0),this}rotateOnWorldAxis(z,J){return F0.setFromAxisAngle(z,J),this.quaternion.premultiply(F0),this}rotateX(z){return this.rotateOnAxis(g7,z)}rotateY(z){return this.rotateOnAxis(l7,z)}rotateZ(z){return this.rotateOnAxis(m7,z)}translateOnAxis(z,J){return u7.copy(z).applyQuaternion(this.quaternion),this.position.add(u7.multiplyScalar(J)),this}translateX(z){return this.translateOnAxis(g7,z)}translateY(z){return this.translateOnAxis(l7,z)}translateZ(z){return this.translateOnAxis(m7,z)}localToWorld(z){return this.updateWorldMatrix(!0,!1),z.applyMatrix4(this.matrixWorld)}worldToLocal(z){return this.updateWorldMatrix(!0,!1),z.applyMatrix4(EQ.copy(this.matrixWorld).invert())}lookAt(z,J,Q){if(z.isVector3)l1.copy(z);else l1.set(z,J,Q);let $=this.parent;if(this.updateWorldMatrix(!0,!1),z1.setFromMatrixPosition(this.matrixWorld),this.isCamera||this.isLight)EQ.lookAt(z1,l1,this.up);else EQ.lookAt(l1,z1,this.up);if(this.quaternion.setFromRotationMatrix(EQ),$)EQ.extractRotation($.matrixWorld),F0.setFromRotationMatrix(EQ),this.quaternion.premultiply(F0.invert())}add(z){if(arguments.length>1){for(let J=0;J<arguments.length;J++)this.add(arguments[J]);return this}if(z===this)return Pz("Object3D.add: object can't be added as a child of itself.",z),this;if(z&&z.isObject3D)z.removeFromParent(),z.parent=this,this.children.push(z),z.dispatchEvent(c7),M0.child=z,this.dispatchEvent(M0),M0.child=null;else Pz("Object3D.add: object not an instance of THREE.Object3D.",z);return this}remove(z){if(arguments.length>1){for(let Q=0;Q<arguments.length;Q++)this.remove(arguments[Q]);return this}let J=this.children.indexOf(z);if(J!==-1)z.parent=null,this.children.splice(J,1),z.dispatchEvent(pK),T5.child=z,this.dispatchEvent(T5),T5.child=null;return this}removeFromParent(){let z=this.parent;if(z!==null)z.remove(this);return this}clear(){return this.remove(...this.children)}attach(z){if(this.updateWorldMatrix(!0,!1),EQ.copy(this.matrixWorld).invert(),z.parent!==null)z.parent.updateWorldMatrix(!0,!1),EQ.multiply(z.parent.matrixWorld);return z.applyMatrix4(EQ),z.removeFromParent(),z.parent=this,this.children.push(z),z.updateWorldMatrix(!1,!0),z.dispatchEvent(c7),M0.child=z,this.dispatchEvent(M0),M0.child=null,this}getObjectById(z){return this.getObjectByProperty("id",z)}getObjectByName(z){return this.getObjectByProperty("name",z)}getObjectByProperty(z,J){if(this[z]===J)return this;for(let Q=0,$=this.children.length;Q<$;Q++){let W=this.children[Q].getObjectByProperty(z,J);if(W!==void 0)return W}return}getObjectsByProperty(z,J,Q=[]){if(this[z]===J)Q.push(this);let $=this.children;for(let K=0,W=$.length;K<W;K++)$[K].getObjectsByProperty(z,J,Q);return Q}getWorldPosition(z){return this.updateWorldMatrix(!0,!1),z.setFromMatrixPosition(this.matrixWorld)}getWorldQuaternion(z){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(z1,z,bK),z}getWorldScale(z){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(z1,dK,z),z}getWorldDirection(z){this.updateWorldMatrix(!0,!1);let J=this.matrixWorld.elements;return z.set(J[8],J[9],J[10]).normalize()}raycast(){}traverse(z){z(this);let J=this.children;for(let Q=0,$=J.length;Q<$;Q++)J[Q].traverse(z)}traverseVisible(z){if(this.visible===!1)return;z(this);let J=this.children;for(let Q=0,$=J.length;Q<$;Q++)J[Q].traverseVisible(z)}traverseAncestors(z){let J=this.parent;if(J!==null)z(J),J.traverseAncestors(z)}updateMatrix(){this.matrix.compose(this.position,this.quaternion,this.scale);let z=this.pivot;if(z!==null){let{x:J,y:Q,z:$}=z,K=this.matrix.elements;K[12]+=J-K[0]*J-K[4]*Q-K[8]*$,K[13]+=Q-K[1]*J-K[5]*Q-K[9]*$,K[14]+=$-K[2]*J-K[6]*Q-K[10]*$}this.matrixWorldNeedsUpdate=!0}updateMatrixWorld(z){if(this.matrixAutoUpdate)this.updateMatrix();if(this.matrixWorldNeedsUpdate||z){if(this.matrixWorldAutoUpdate===!0)if(this.parent===null)this.matrixWorld.copy(this.matrix);else this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix);this.matrixWorldNeedsUpdate=!1,z=!0}let J=this.children;for(let Q=0,$=J.length;Q<$;Q++)J[Q].updateMatrixWorld(z)}updateWorldMatrix(z,J,Q=!1){let $=this.parent;if(z===!0&&$!==null)$.updateWorldMatrix(!0,!1);if(this.matrixAutoUpdate)this.updateMatrix();if(this.matrixWorldNeedsUpdate||Q){if(this.matrixWorldAutoUpdate===!0)if(this.parent===null)this.matrixWorld.copy(this.matrix);else this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix);this.matrixWorldNeedsUpdate=!1,Q=!0}if(J===!0){let K=this.children;for(let W=0,q=K.length;W<q;W++)K[W].updateWorldMatrix(!1,!0,Q)}}toJSON(z){let J=z===void 0||typeof z==="string",Q={};if(J)z={geometries:{},materials:{},textures:{},images:{},shapes:{},skeletons:{},animations:{},nodes:{}},Q.metadata={version:4.7,type:"Object",generator:"Object3D.toJSON"};let $={};if($.uuid=this.uuid,$.type=this.type,this.name!=="")$.name=this.name;if(this.castShadow===!0)$.castShadow=!0;if(this.receiveShadow===!0)$.receiveShadow=!0;if(this.visible===!1)$.visible=!1;if(this.frustumCulled===!1)$.frustumCulled=!1;if(this.renderOrder!==0)$.renderOrder=this.renderOrder;if(this.static!==!1)$.static=this.static;if(Object.keys(this.userData).length>0)$.userData=this.userData;if($.layers=this.layers.mask,$.matrix=this.matrix.toArray(),$.up=this.up.toArray(),this.pivot!==null)$.pivot=this.pivot.toArray();if(this.matrixAutoUpdate===!1)$.matrixAutoUpdate=!1;if(this.morphTargetDictionary!==void 0)$.morphTargetDictionary=Object.assign({},this.morphTargetDictionary);if(this.morphTargetInfluences!==void 0)$.morphTargetInfluences=this.morphTargetInfluences.slice();if(this.isInstancedMesh){if($.type="InstancedMesh",$.count=this.count,$.instanceMatrix=this.instanceMatrix.toJSON(),this.instanceColor!==null)$.instanceColor=this.instanceColor.toJSON()}if(this.isBatchedMesh){if($.type="BatchedMesh",$.perObjectFrustumCulled=this.perObjectFrustumCulled,$.sortObjects=this.sortObjects,$.drawRanges=this._drawRanges,$.reservedRanges=this._reservedRanges,$.geometryInfo=this._geometryInfo.map((q)=>({...q,boundingBox:q.boundingBox?q.boundingBox.toJSON():void 0,boundingSphere:q.boundingSphere?q.boundingSphere.toJSON():void 0})),$.instanceInfo=this._instanceInfo.map((q)=>({...q})),$.availableInstanceIds=this._availableInstanceIds.slice(),$.availableGeometryIds=this._availableGeometryIds.slice(),$.nextIndexStart=this._nextIndexStart,$.nextVertexStart=this._nextVertexStart,$.geometryCount=this._geometryCount,$.maxInstanceCount=this._maxInstanceCount,$.maxVertexCount=this._maxVertexCount,$.maxIndexCount=this._maxIndexCount,$.geometryInitialized=this._geometryInitialized,$.matricesTexture=this._matricesTexture.toJSON(z),$.indirectTexture=this._indirectTexture.toJSON(z),this._colorsTexture!==null)$.colorsTexture=this._colorsTexture.toJSON(z);if(this.boundingSphere!==null)$.boundingSphere=this.boundingSphere.toJSON();if(this.boundingBox!==null)$.boundingBox=this.boundingBox.toJSON()}function K(q,B){if(q[B.uuid]===void 0)q[B.uuid]=B.toJSON(z);return B.uuid}if(this.isScene){if(this.background){if(this.background.isColor)$.background=this.background.toJSON();else if(this.background.isTexture)$.background=this.background.toJSON(z).uuid}if(this.environment&&this.environment.isTexture&&this.environment.isRenderTargetTexture!==!0)$.environment=this.environment.toJSON(z).uuid}else if(this.isMesh||this.isLine||this.isPoints){$.geometry=K(z.geometries,this.geometry);let q=this.geometry.parameters;if(q!==void 0&&q.shapes!==void 0){let B=q.shapes;if(Array.isArray(B))for(let G=0,N=B.length;G<N;G++){let Z=B[G];K(z.shapes,Z)}else K(z.shapes,B)}}if(this.isSkinnedMesh){if($.bindMode=this.bindMode,$.bindMatrix=this.bindMatrix.toArray(),this.skeleton!==void 0)K(z.skeletons,this.skeleton),$.skeleton=this.skeleton.uuid}if(this.material!==void 0)if(Array.isArray(this.material)){let q=[];for(let B=0,G=this.material.length;B<G;B++)q.push(K(z.materials,this.material[B]));$.material=q}else $.material=K(z.materials,this.material);if(this.children.length>0){$.children=[];for(let q=0;q<this.children.length;q++)$.children.push(this.children[q].toJSON(z).object)}if(this.animations.length>0){$.animations=[];for(let q=0;q<this.animations.length;q++){let B=this.animations[q];$.animations.push(K(z.animations,B))}}if(J){let q=W(z.geometries),B=W(z.materials),G=W(z.textures),N=W(z.images),Z=W(z.shapes),H=W(z.skeletons),D=W(z.animations),U=W(z.nodes);if(q.length>0)Q.geometries=q;if(B.length>0)Q.materials=B;if(G.length>0)Q.textures=G;if(N.length>0)Q.images=N;if(Z.length>0)Q.shapes=Z;if(H.length>0)Q.skeletons=H;if(D.length>0)Q.animations=D;if(U.length>0)Q.nodes=U}return Q.object=$,Q;function W(q){let B=[];for(let G in q){let N=q[G];delete N.metadata,B.push(N)}return B}}clone(z){return new this.constructor().copy(this,z)}copy(z,J=!0){if(this.name=z.name,this.up.copy(z.up),this.position.copy(z.position),this.rotation.order=z.rotation.order,this.quaternion.copy(z.quaternion),this.scale.copy(z.scale),this.pivot=z.pivot!==null?z.pivot.clone():null,this.matrix.copy(z.matrix),this.matrixWorld.copy(z.matrixWorld),this.matrixAutoUpdate=z.matrixAutoUpdate,this.matrixWorldAutoUpdate=z.matrixWorldAutoUpdate,this.matrixWorldNeedsUpdate=z.matrixWorldNeedsUpdate,this.layers.mask=z.layers.mask,this.visible=z.visible,this.castShadow=z.castShadow,this.receiveShadow=z.receiveShadow,this.frustumCulled=z.frustumCulled,this.renderOrder=z.renderOrder,this.static=z.static,this.animations=z.animations.slice(),this.userData=JSON.parse(JSON.stringify(z.userData)),J===!0)for(let Q=0;Q<z.children.length;Q++){let $=z.children[Q];this.add($.clone())}return this}}KJ.DEFAULT_UP=new R(0,1,0);KJ.DEFAULT_MATRIX_AUTO_UPDATE=!0;KJ.DEFAULT_MATRIX_WORLD_AUTO_UPDATE=!0;class N0 extends KJ{constructor(){super();this.isGroup=!0,this.type="Group"}}var uK={type:"move"};class E1{constructor(){this._targetRay=null,this._grip=null,this._hand=null}getHandSpace(){if(this._hand===null)this._hand=new N0,this._hand.matrixAutoUpdate=!1,this._hand.visible=!1,this._hand.joints={},this._hand.inputState={pinching:!1};return this._hand}getTargetRaySpace(){if(this._targetRay===null)this._targetRay=new N0,this._targetRay.matrixAutoUpdate=!1,this._targetRay.visible=!1,this._targetRay.hasLinearVelocity=!1,this._targetRay.linearVelocity=new R,this._targetRay.hasAngularVelocity=!1,this._targetRay.angularVelocity=new R;return this._targetRay}getGripSpace(){if(this._grip===null)this._grip=new N0,this._grip.matrixAutoUpdate=!1,this._grip.visible=!1,this._grip.hasLinearVelocity=!1,this._grip.linearVelocity=new R,this._grip.hasAngularVelocity=!1,this._grip.angularVelocity=new R,this._grip.eventsEnabled=!1;return this._grip}dispatchEvent(z){if(this._targetRay!==null)this._targetRay.dispatchEvent(z);if(this._grip!==null)this._grip.dispatchEvent(z);if(this._hand!==null)this._hand.dispatchEvent(z);return this}connect(z){if(z&&z.hand){let J=this._hand;if(J)for(let Q of z.hand.values())this._getHandJoint(J,Q)}return this.dispatchEvent({type:"connected",data:z}),this}disconnect(z){if(this.dispatchEvent({type:"disconnected",data:z}),this._targetRay!==null)this._targetRay.visible=!1;if(this._grip!==null)this._grip.visible=!1;if(this._hand!==null)this._hand.visible=!1;return this}update(z,J,Q){let $=null,K=null,W=null,q=this._targetRay,B=this._grip,G=this._hand;if(z&&J.session.visibilityState!=="visible-blurred"){if(G&&z.hand){W=!0;for(let X of z.hand.values()){let k=J.getJointPose(X,Q),Y=this._getHandJoint(G,X);if(k!==null)Y.matrix.fromArray(k.transform.matrix),Y.matrix.decompose(Y.position,Y.rotation,Y.scale),Y.matrixWorldNeedsUpdate=!0,Y.jointRadius=k.radius;Y.visible=k!==null}let N=G.joints["index-finger-tip"],Z=G.joints["thumb-tip"],H=N.position.distanceTo(Z.position),D=0.02,U=0.005;if(G.inputState.pinching&&H>D+U)G.inputState.pinching=!1,this.dispatchEvent({type:"pinchend",handedness:z.handedness,target:this});else if(!G.inputState.pinching&&H<=D-U)G.inputState.pinching=!0,this.dispatchEvent({type:"pinchstart",handedness:z.handedness,target:this})}else if(B!==null&&z.gripSpace){if(K=J.getPose(z.gripSpace,Q),K!==null){if(B.matrix.fromArray(K.transform.matrix),B.matrix.decompose(B.position,B.rotation,B.scale),B.matrixWorldNeedsUpdate=!0,K.linearVelocity)B.hasLinearVelocity=!0,B.linearVelocity.copy(K.linearVelocity);else B.hasLinearVelocity=!1;if(K.angularVelocity)B.hasAngularVelocity=!0,B.angularVelocity.copy(K.angularVelocity);else B.hasAngularVelocity=!1;if(B.eventsEnabled)B.dispatchEvent({type:"gripUpdated",data:z,target:this})}}if(q!==null){if($=J.getPose(z.targetRaySpace,Q),$===null&&K!==null)$=K;if($!==null){if(q.matrix.fromArray($.transform.matrix),q.matrix.decompose(q.position,q.rotation,q.scale),q.matrixWorldNeedsUpdate=!0,$.linearVelocity)q.hasLinearVelocity=!0,q.linearVelocity.copy($.linearVelocity);else q.hasLinearVelocity=!1;if($.angularVelocity)q.hasAngularVelocity=!0,q.angularVelocity.copy($.angularVelocity);else q.hasAngularVelocity=!1;this.dispatchEvent(uK)}}}if(q!==null)q.visible=$!==null;if(B!==null)B.visible=K!==null;if(G!==null)G.visible=W!==null;return this}_getHandJoint(z,J){if(z.joints[J.jointName]===void 0){let Q=new N0;Q.matrixAutoUpdate=!1,Q.visible=!1,z.joints[J.jointName]=Q,z.add(Q)}return z.joints[J.jointName]}}var k9={aliceblue:15792383,antiquewhite:16444375,aqua:65535,aquamarine:8388564,azure:15794175,beige:16119260,bisque:16770244,black:0,blanchedalmond:16772045,blue:255,blueviolet:9055202,brown:10824234,burlywood:14596231,cadetblue:6266528,chartreuse:8388352,chocolate:13789470,coral:16744272,cornflowerblue:6591981,cornsilk:16775388,crimson:14423100,cyan:65535,darkblue:139,darkcyan:35723,darkgoldenrod:12092939,darkgray:11119017,darkgreen:25600,darkgrey:11119017,darkkhaki:12433259,darkmagenta:9109643,darkolivegreen:5597999,darkorange:16747520,darkorchid:10040012,darkred:9109504,darksalmon:15308410,darkseagreen:9419919,darkslateblue:4734347,darkslategray:3100495,darkslategrey:3100495,darkturquoise:52945,darkviolet:9699539,deeppink:16716947,deepskyblue:49151,dimgray:6908265,dimgrey:6908265,dodgerblue:2003199,firebrick:11674146,floralwhite:16775920,forestgreen:2263842,fuchsia:16711935,gainsboro:14474460,ghostwhite:16316671,gold:16766720,goldenrod:14329120,gray:8421504,green:32768,greenyellow:11403055,grey:8421504,honeydew:15794160,hotpink:16738740,indianred:13458524,indigo:4915330,ivory:16777200,khaki:15787660,lavender:15132410,lavenderblush:16773365,lawngreen:8190976,lemonchiffon:16775885,lightblue:11393254,lightcoral:15761536,lightcyan:14745599,lightgoldenrodyellow:16448210,lightgray:13882323,lightgreen:9498256,lightgrey:13882323,lightpink:16758465,lightsalmon:16752762,lightseagreen:2142890,lightskyblue:8900346,lightslategray:7833753,lightslategrey:7833753,lightsteelblue:11584734,lightyellow:16777184,lime:65280,limegreen:3329330,linen:16445670,magenta:16711935,maroon:8388608,mediumaquamarine:6737322,mediumblue:205,mediumorchid:12211667,mediumpurple:9662683,mediumseagreen:3978097,mediumslateblue:8087790,mediumspringgreen:64154,mediumturquoise:4772300,mediumvioletred:13047173,midnightblue:1644912,mintcream:16121850,mistyrose:16770273,moccasin:16770229,navajowhite:16768685,navy:128,oldlace:16643558,olive:8421376,olivedrab:7048739,orange:16753920,orangered:16729344,orchid:14315734,palegoldenrod:15657130,palegreen:10025880,paleturquoise:11529966,palevioletred:14381203,papayawhip:16773077,peachpuff:16767673,peru:13468991,pink:16761035,plum:14524637,powderblue:11591910,purple:8388736,rebeccapurple:6697881,red:16711680,rosybrown:12357519,royalblue:4286945,saddlebrown:9127187,salmon:16416882,sandybrown:16032864,seagreen:3050327,seashell:16774638,sienna:10506797,silver:12632256,skyblue:8900331,slateblue:6970061,slategray:7372944,slategrey:7372944,snow:16775930,springgreen:65407,steelblue:4620980,tan:13808780,teal:32896,thistle:14204888,tomato:16737095,turquoise:4251856,violet:15631086,wheat:16113331,white:16777215,whitesmoke:16119285,yellow:16776960,yellowgreen:10145074},xQ={h:0,s:0,l:0},m1={h:0,s:0,l:0};function h5(z,J,Q){if(Q<0)Q+=1;if(Q>1)Q-=1;if(Q<0.16666666666666666)return z+(J-z)*6*Q;if(Q<0.5)return J;if(Q<0.6666666666666666)return z+(J-z)*6*(0.6666666666666666-Q);return z}class Fz{constructor(z,J,Q){return this.isColor=!0,this.r=1,this.g=1,this.b=1,this.set(z,J,Q)}set(z,J,Q){if(J===void 0&&Q===void 0){let $=z;if($&&$.isColor)this.copy($);else if(typeof $==="number")this.setHex($);else if(typeof $==="string")this.setStyle($)}else this.setRGB(z,J,Q);return this}setScalar(z){return this.r=z,this.g=z,this.b=z,this}setHex(z,J="srgb"){return z=Math.floor(z),this.r=(z>>16&255)/255,this.g=(z>>8&255)/255,this.b=(z&255)/255,zJ.colorSpaceToWorking(this,J),this}setRGB(z,J,Q,$=zJ.workingColorSpace){return this.r=z,this.g=J,this.b=Q,zJ.colorSpaceToWorking(this,$),this}setHSL(z,J,Q,$=zJ.workingColorSpace){if(z=w6(z,1),J=dz(J,0,1),Q=dz(Q,0,1),J===0)this.r=this.g=this.b=Q;else{let K=Q<=0.5?Q*(1+J):Q+J-Q*J,W=2*Q-K;this.r=h5(W,K,z+0.3333333333333333),this.g=h5(W,K,z),this.b=h5(W,K,z-0.3333333333333333)}return zJ.colorSpaceToWorking(this,$),this}setStyle(z,J="srgb"){function Q(K){if(K===void 0)return;if(parseFloat(K)<1)Bz("Color: Alpha component of "+z+" will be ignored.")}let $;if($=/^(\w+)\(([^\)]*)\)/.exec(z)){let K,W=$[1],q=$[2];switch(W){case"rgb":case"rgba":if(K=/^\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(q))return Q(K[4]),this.setRGB(Math.min(255,parseInt(K[1],10))/255,Math.min(255,parseInt(K[2],10))/255,Math.min(255,parseInt(K[3],10))/255,J);if(K=/^\s*(\d+)\%\s*,\s*(\d+)\%\s*,\s*(\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(q))return Q(K[4]),this.setRGB(Math.min(100,parseInt(K[1],10))/100,Math.min(100,parseInt(K[2],10))/100,Math.min(100,parseInt(K[3],10))/100,J);break;case"hsl":case"hsla":if(K=/^\s*(\d*\.?\d+)\s*,\s*(\d*\.?\d+)\%\s*,\s*(\d*\.?\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(q))return Q(K[4]),this.setHSL(parseFloat(K[1])/360,parseFloat(K[2])/100,parseFloat(K[3])/100,J);break;default:Bz("Color: Unknown color model "+z)}}else if($=/^\#([A-Fa-f\d]+)$/.exec(z)){let K=$[1],W=K.length;if(W===3)return this.setRGB(parseInt(K.charAt(0),16)/15,parseInt(K.charAt(1),16)/15,parseInt(K.charAt(2),16)/15,J);else if(W===6)return this.setHex(parseInt(K,16),J);else Bz("Color: Invalid hex color "+z)}else if(z&&z.length>0)return this.setColorName(z,J);return this}setColorName(z,J="srgb"){let Q=k9[z.toLowerCase()];if(Q!==void 0)this.setHex(Q,J);else Bz("Color: Unknown color "+z);return this}clone(){return new this.constructor(this.r,this.g,this.b)}copy(z){return this.r=z.r,this.g=z.g,this.b=z.b,this}copySRGBToLinear(z){return this.r=wQ(z.r),this.g=wQ(z.g),this.b=wQ(z.b),this}copyLinearToSRGB(z){return this.r=g0(z.r),this.g=g0(z.g),this.b=g0(z.b),this}convertSRGBToLinear(){return this.copySRGBToLinear(this),this}convertLinearToSRGB(){return this.copyLinearToSRGB(this),this}getHex(z="srgb"){return zJ.workingToColorSpace(xJ.copy(this),z),Math.round(dz(xJ.r*255,0,255))*65536+Math.round(dz(xJ.g*255,0,255))*256+Math.round(dz(xJ.b*255,0,255))}getHexString(z="srgb"){return("000000"+this.getHex(z).toString(16)).slice(-6)}getHSL(z,J=zJ.workingColorSpace){zJ.workingToColorSpace(xJ.copy(this),J);let{r:Q,g:$,b:K}=xJ,W=Math.max(Q,$,K),q=Math.min(Q,$,K),B,G,N=(q+W)/2;if(q===W)B=0,G=0;else{let Z=W-q;switch(G=N<=0.5?Z/(W+q):Z/(2-W-q),W){case Q:B=($-K)/Z+($<K?6:0);break;case $:B=(K-Q)/Z+2;break;case K:B=(Q-$)/Z+4;break}B/=6}return z.h=B,z.s=G,z.l=N,z}getRGB(z,J=zJ.workingColorSpace){return zJ.workingToColorSpace(xJ.copy(this),J),z.r=xJ.r,z.g=xJ.g,z.b=xJ.b,z}getStyle(z="srgb"){zJ.workingToColorSpace(xJ.copy(this),z);let{r:J,g:Q,b:$}=xJ;if(z!=="srgb")return`color(${z} ${J.toFixed(3)} ${Q.toFixed(3)} ${$.toFixed(3)})`;return`rgb(${Math.round(J*255)},${Math.round(Q*255)},${Math.round($*255)})`}offsetHSL(z,J,Q){return this.getHSL(xQ),this.setHSL(xQ.h+z,xQ.s+J,xQ.l+Q)}add(z){return this.r+=z.r,this.g+=z.g,this.b+=z.b,this}addColors(z,J){return this.r=z.r+J.r,this.g=z.g+J.g,this.b=z.b+J.b,this}addScalar(z){return this.r+=z,this.g+=z,this.b+=z,this}sub(z){return this.r=Math.max(0,this.r-z.r),this.g=Math.max(0,this.g-z.g),this.b=Math.max(0,this.b-z.b),this}multiply(z){return this.r*=z.r,this.g*=z.g,this.b*=z.b,this}multiplyScalar(z){return this.r*=z,this.g*=z,this.b*=z,this}lerp(z,J){return this.r+=(z.r-this.r)*J,this.g+=(z.g-this.g)*J,this.b+=(z.b-this.b)*J,this}lerpColors(z,J,Q){return this.r=z.r+(J.r-z.r)*Q,this.g=z.g+(J.g-z.g)*Q,this.b=z.b+(J.b-z.b)*Q,this}lerpHSL(z,J){this.getHSL(xQ),z.getHSL(m1);let Q=k1(xQ.h,m1.h,J),$=k1(xQ.s,m1.s,J),K=k1(xQ.l,m1.l,J);return this.setHSL(Q,$,K),this}setFromVector3(z){return this.r=z.x,this.g=z.y,this.b=z.z,this}applyMatrix3(z){let J=this.r,Q=this.g,$=this.b,K=z.elements;return this.r=K[0]*J+K[3]*Q+K[6]*$,this.g=K[1]*J+K[4]*Q+K[7]*$,this.b=K[2]*J+K[5]*Q+K[8]*$,this}equals(z){return z.r===this.r&&z.g===this.g&&z.b===this.b}fromArray(z,J=0){return this.r=z[J],this.g=z[J+1],this.b=z[J+2],this}toArray(z=[],J=0){return z[J]=this.r,z[J+1]=this.g,z[J+2]=this.b,z}fromBufferAttribute(z,J){return this.r=z.getX(J),this.g=z.getY(J),this.b=z.getZ(J),this}toJSON(){return this.getHex()}*[Symbol.iterator](){yield this.r,yield this.g,yield this.b}}var xJ=new Fz;Fz.NAMES=k9;class d2{constructor(z,J=0.00025){this.isFogExp2=!0,this.name="",this.color=new Fz(z),this.density=J}clone(){return new d2(this.color,this.density)}toJSON(){return{type:"FogExp2",name:this.name,color:this.color.getHex(),density:this.density}}}class p2{constructor(z,J=1,Q=1000){this.isFog=!0,this.name="",this.color=new Fz(z),this.near=J,this.far=Q}clone(){return new p2(this.color,this.near,this.far)}toJSON(){return{type:"Fog",name:this.name,color:this.color.getHex(),near:this.near,far:this.far}}}class R6 extends KJ{constructor(){super();if(this.isScene=!0,this.type="Scene",this.background=null,this.environment=null,this.fog=null,this.backgroundBlurriness=0,this.backgroundIntensity=1,this.backgroundRotation=new NQ,this.environmentIntensity=1,this.environmentRotation=new NQ,this.overrideMaterial=null,typeof __THREE_DEVTOOLS__<"u")__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}copy(z,J){if(super.copy(z,J),z.background!==null)this.background=z.background.clone();if(z.environment!==null)this.environment=z.environment.clone();if(z.fog!==null)this.fog=z.fog.clone();if(this.backgroundBlurriness=z.backgroundBlurriness,this.backgroundIntensity=z.backgroundIntensity,this.backgroundRotation.copy(z.backgroundRotation),this.environmentIntensity=z.environmentIntensity,this.environmentRotation.copy(z.environmentRotation),z.overrideMaterial!==null)this.overrideMaterial=z.overrideMaterial.clone();return this.matrixAutoUpdate=z.matrixAutoUpdate,this}toJSON(z){let J=super.toJSON(z);if(this.fog!==null)J.object.fog=this.fog.toJSON();if(this.backgroundBlurriness>0)J.object.backgroundBlurriness=this.backgroundBlurriness;if(this.backgroundIntensity!==1)J.object.backgroundIntensity=this.backgroundIntensity;if(J.object.backgroundRotation=this.backgroundRotation.toArray(),this.environmentIntensity!==1)J.object.environmentIntensity=this.environmentIntensity;return J.object.environmentRotation=this.environmentRotation.toArray(),J}}var WQ=new R,IQ=new R,x5=new R,AQ=new R,L0=new R,y0=new R,n7=new R,j5=new R,_5=new R,b5=new R,d5=new BJ,p5=new BJ,u5=new BJ;class cJ{constructor(z=new R,J=new R,Q=new R){this.a=z,this.b=J,this.c=Q}static getNormal(z,J,Q,$){$.subVectors(Q,J),WQ.subVectors(z,J),$.cross(WQ);let K=$.lengthSq();if(K>0)return $.multiplyScalar(1/Math.sqrt(K));return $.set(0,0,0)}static getBarycoord(z,J,Q,$,K){WQ.subVectors($,J),IQ.subVectors(Q,J),x5.subVectors(z,J);let W=WQ.dot(WQ),q=WQ.dot(IQ),B=WQ.dot(x5),G=IQ.dot(IQ),N=IQ.dot(x5),Z=W*G-q*q;if(Z===0)return K.set(0,0,0),null;let H=1/Z,D=(G*B-q*N)*H,U=(W*N-q*B)*H;return K.set(1-D-U,U,D)}static containsPoint(z,J,Q,$){if(this.getBarycoord(z,J,Q,$,AQ)===null)return!1;return AQ.x>=0&&AQ.y>=0&&AQ.x+AQ.y<=1}static getInterpolation(z,J,Q,$,K,W,q,B){if(this.getBarycoord(z,J,Q,$,AQ)===null){if(B.x=0,B.y=0,"z"in B)B.z=0;if("w"in B)B.w=0;return null}return B.setScalar(0),B.addScaledVector(K,AQ.x),B.addScaledVector(W,AQ.y),B.addScaledVector(q,AQ.z),B}static getInterpolatedAttribute(z,J,Q,$,K,W){return d5.setScalar(0),p5.setScalar(0),u5.setScalar(0),d5.fromBufferAttribute(z,J),p5.fromBufferAttribute(z,Q),u5.fromBufferAttribute(z,$),W.setScalar(0),W.addScaledVector(d5,K.x),W.addScaledVector(p5,K.y),W.addScaledVector(u5,K.z),W}static isFrontFacing(z,J,Q,$){return WQ.subVectors(Q,J),IQ.subVectors(z,J),WQ.cross(IQ).dot($)<0}set(z,J,Q){return this.a.copy(z),this.b.copy(J),this.c.copy(Q),this}setFromPointsAndIndices(z,J,Q,$){return this.a.copy(z[J]),this.b.copy(z[Q]),this.c.copy(z[$]),this}setFromAttributeAndIndices(z,J,Q,$){return this.a.fromBufferAttribute(z,J),this.b.fromBufferAttribute(z,Q),this.c.fromBufferAttribute(z,$),this}clone(){return new this.constructor().copy(this)}copy(z){return this.a.copy(z.a),this.b.copy(z.b),this.c.copy(z.c),this}getArea(){return WQ.subVectors(this.c,this.b),IQ.subVectors(this.a,this.b),WQ.cross(IQ).length()*0.5}getMidpoint(z){return z.addVectors(this.a,this.b).add(this.c).multiplyScalar(0.3333333333333333)}getNormal(z){return cJ.getNormal(this.a,this.b,this.c,z)}getPlane(z){return z.setFromCoplanarPoints(this.a,this.b,this.c)}getBarycoord(z,J){return cJ.getBarycoord(z,this.a,this.b,this.c,J)}getInterpolation(z,J,Q,$,K){return cJ.getInterpolation(z,this.a,this.b,this.c,J,Q,$,K)}containsPoint(z){return cJ.containsPoint(z,this.a,this.b,this.c)}isFrontFacing(z){return cJ.isFrontFacing(this.a,this.b,this.c,z)}intersectsBox(z){return z.intersectsTriangle(this)}closestPointToPoint(z,J){let Q=this.a,$=this.b,K=this.c,W,q;L0.subVectors($,Q),y0.subVectors(K,Q),j5.subVectors(z,Q);let B=L0.dot(j5),G=y0.dot(j5);if(B<=0&&G<=0)return J.copy(Q);_5.subVectors(z,$);let N=L0.dot(_5),Z=y0.dot(_5);if(N>=0&&Z<=N)return J.copy($);let H=B*Z-N*G;if(H<=0&&B>=0&&N<=0)return W=B/(B-N),J.copy(Q).addScaledVector(L0,W);b5.subVectors(z,K);let D=L0.dot(b5),U=y0.dot(b5);if(U>=0&&D<=U)return J.copy(K);let X=D*G-B*U;if(X<=0&&G>=0&&U<=0)return q=G/(G-U),J.copy(Q).addScaledVector(y0,q);let k=N*U-D*Z;if(k<=0&&Z-N>=0&&D-U>=0)return n7.subVectors(K,$),q=(Z-N)/(Z-N+(D-U)),J.copy($).addScaledVector(n7,q);let Y=1/(k+X+H);return W=X*Y,q=H*Y,J.copy(Q).addScaledVector(L0,W).addScaledVector(y0,q)}equals(z){return z.a.equals(this.a)&&z.b.equals(this.b)&&z.c.equals(this.c)}}class fJ{constructor(z=new R(1/0,1/0,1/0),J=new R(-1/0,-1/0,-1/0)){this.isBox3=!0,this.min=z,this.max=J}set(z,J){return this.min.copy(z),this.max.copy(J),this}setFromArray(z){this.makeEmpty();for(let J=0,Q=z.length;J<Q;J+=3)this.expandByPoint(qQ.fromArray(z,J));return this}setFromBufferAttribute(z){this.makeEmpty();for(let J=0,Q=z.count;J<Q;J++)this.expandByPoint(qQ.fromBufferAttribute(z,J));return this}setFromPoints(z){this.makeEmpty();for(let J=0,Q=z.length;J<Q;J++)this.expandByPoint(z[J]);return this}setFromCenterAndSize(z,J){let Q=qQ.copy(J).multiplyScalar(0.5);return this.min.copy(z).sub(Q),this.max.copy(z).add(Q),this}setFromObject(z,J=!1){return this.makeEmpty(),this.expandByObject(z,J)}clone(){return new this.constructor().copy(this)}copy(z){return this.min.copy(z.min),this.max.copy(z.max),this}makeEmpty(){return this.min.x=this.min.y=this.min.z=1/0,this.max.x=this.max.y=this.max.z=-1/0,this}isEmpty(){return this.max.x<this.min.x||this.max.y<this.min.y||this.max.z<this.min.z}getCenter(z){return this.isEmpty()?z.set(0,0,0):z.addVectors(this.min,this.max).multiplyScalar(0.5)}getSize(z){return this.isEmpty()?z.set(0,0,0):z.subVectors(this.max,this.min)}expandByPoint(z){return this.min.min(z),this.max.max(z),this}expandByVector(z){return this.min.sub(z),this.max.add(z),this}expandByScalar(z){return this.min.addScalar(-z),this.max.addScalar(z),this}expandByObject(z,J=!1){z.updateWorldMatrix(!1,!1);let Q=z.geometry;if(Q!==void 0){let K=Q.getAttribute("position");if(J===!0&&K!==void 0&&z.isInstancedMesh!==!0)for(let W=0,q=K.count;W<q;W++){if(z.isMesh===!0)z.getVertexPosition(W,qQ);else qQ.fromBufferAttribute(K,W);qQ.applyMatrix4(z.matrixWorld),this.expandByPoint(qQ)}else{if(z.boundingBox!==void 0){if(z.boundingBox===null)z.computeBoundingBox();c1.copy(z.boundingBox)}else{if(Q.boundingBox===null)Q.computeBoundingBox();c1.copy(Q.boundingBox)}c1.applyMatrix4(z.matrixWorld),this.union(c1)}}let $=z.children;for(let K=0,W=$.length;K<W;K++)this.expandByObject($[K],J);return this}containsPoint(z){return z.x>=this.min.x&&z.x<=this.max.x&&z.y>=this.min.y&&z.y<=this.max.y&&z.z>=this.min.z&&z.z<=this.max.z}containsBox(z){return this.min.x<=z.min.x&&z.max.x<=this.max.x&&this.min.y<=z.min.y&&z.max.y<=this.max.y&&this.min.z<=z.min.z&&z.max.z<=this.max.z}getParameter(z,J){return J.set((z.x-this.min.x)/(this.max.x-this.min.x),(z.y-this.min.y)/(this.max.y-this.min.y),(z.z-this.min.z)/(this.max.z-this.min.z))}intersectsBox(z){return z.max.x>=this.min.x&&z.min.x<=this.max.x&&z.max.y>=this.min.y&&z.min.y<=this.max.y&&z.max.z>=this.min.z&&z.min.z<=this.max.z}intersectsSphere(z){return this.clampPoint(z.center,qQ),qQ.distanceToSquared(z.center)<=z.radius*z.radius}intersectsPlane(z){let J,Q;if(z.normal.x>0)J=z.normal.x*this.min.x,Q=z.normal.x*this.max.x;else J=z.normal.x*this.max.x,Q=z.normal.x*this.min.x;if(z.normal.y>0)J+=z.normal.y*this.min.y,Q+=z.normal.y*this.max.y;else J+=z.normal.y*this.max.y,Q+=z.normal.y*this.min.y;if(z.normal.z>0)J+=z.normal.z*this.min.z,Q+=z.normal.z*this.max.z;else J+=z.normal.z*this.max.z,Q+=z.normal.z*this.min.z;return J<=-z.constant&&Q>=-z.constant}intersectsTriangle(z){if(this.isEmpty())return!1;this.getCenter(J1),n1.subVectors(this.max,J1),S0.subVectors(z.a,J1),w0.subVectors(z.b,J1),C0.subVectors(z.c,J1),jQ.subVectors(w0,S0),_Q.subVectors(C0,w0),aQ.subVectors(S0,C0);let J=[0,-jQ.z,jQ.y,0,-_Q.z,_Q.y,0,-aQ.z,aQ.y,jQ.z,0,-jQ.x,_Q.z,0,-_Q.x,aQ.z,0,-aQ.x,-jQ.y,jQ.x,0,-_Q.y,_Q.x,0,-aQ.y,aQ.x,0];if(!g5(J,S0,w0,C0,n1))return!1;if(J=[1,0,0,0,1,0,0,0,1],!g5(J,S0,w0,C0,n1))return!1;return o1.crossVectors(jQ,_Q),J=[o1.x,o1.y,o1.z],g5(J,S0,w0,C0,n1)}clampPoint(z,J){return J.copy(z).clamp(this.min,this.max)}distanceToPoint(z){return this.clampPoint(z,qQ).distanceTo(z)}getBoundingSphere(z){if(this.isEmpty())z.makeEmpty();else this.getCenter(z.center),z.radius=this.getSize(qQ).length()*0.5;return z}intersect(z){if(this.min.max(z.min),this.max.min(z.max),this.isEmpty())this.makeEmpty();return this}union(z){return this.min.min(z.min),this.max.max(z.max),this}applyMatrix4(z){if(this.isEmpty())return this;return OQ[0].set(this.min.x,this.min.y,this.min.z).applyMatrix4(z),OQ[1].set(this.min.x,this.min.y,this.max.z).applyMatrix4(z),OQ[2].set(this.min.x,this.max.y,this.min.z).applyMatrix4(z),OQ[3].set(this.min.x,this.max.y,this.max.z).applyMatrix4(z),OQ[4].set(this.max.x,this.min.y,this.min.z).applyMatrix4(z),OQ[5].set(this.max.x,this.min.y,this.max.z).applyMatrix4(z),OQ[6].set(this.max.x,this.max.y,this.min.z).applyMatrix4(z),OQ[7].set(this.max.x,this.max.y,this.max.z).applyMatrix4(z),this.setFromPoints(OQ),this}translate(z){return this.min.add(z),this.max.add(z),this}equals(z){return z.min.equals(this.min)&&z.max.equals(this.max)}toJSON(){return{min:this.min.toArray(),max:this.max.toArray()}}fromJSON(z){return this.min.fromArray(z.min),this.max.fromArray(z.max),this}}var OQ=[new R,new R,new R,new R,new R,new R,new R,new R],qQ=new R,c1=new fJ,S0=new R,w0=new R,C0=new R,jQ=new R,_Q=new R,aQ=new R,J1=new R,n1=new R,o1=new R,tQ=new R;function g5(z,J,Q,$,K){for(let W=0,q=z.length-3;W<=q;W+=3){tQ.fromArray(z,W);let B=K.x*Math.abs(tQ.x)+K.y*Math.abs(tQ.y)+K.z*Math.abs(tQ.z),G=J.dot(tQ),N=Q.dot(tQ),Z=$.dot(tQ);if(Math.max(-Math.max(G,N,Z),Math.min(G,N,Z))>B)return!1}return!0}var yQ=gK();function gK(){let z=new ArrayBuffer(4),J=new Float32Array(z),Q=new Uint32Array(z),$=new Uint32Array(512),K=new Uint32Array(512);for(let G=0;G<256;++G){let N=G-127;if(N<-27)$[G]=0,$[G|256]=32768,K[G]=24,K[G|256]=24;else if(N<-14)$[G]=1024>>-N-14,$[G|256]=1024>>-N-14|32768,K[G]=-N-1,K[G|256]=-N-1;else if(N<=15)$[G]=N+15<<10,$[G|256]=N+15<<10|32768,K[G]=13,K[G|256]=13;else if(N<128)$[G]=31744,$[G|256]=64512,K[G]=24,K[G|256]=24;else $[G]=31744,$[G|256]=64512,K[G]=13,K[G|256]=13}let W=new Uint32Array(2048),q=new Uint32Array(64),B=new Uint32Array(64);for(let G=1;G<1024;++G){let N=G<<13,Z=0;while((N&8388608)===0)N<<=1,Z-=8388608;N&=-8388609,Z+=947912704,W[G]=N|Z}for(let G=1024;G<2048;++G)W[G]=939524096+(G-1024<<13);for(let G=1;G<31;++G)q[G]=G<<23;q[31]=1199570944,q[32]=2147483648;for(let G=33;G<63;++G)q[G]=2147483648+(G-32<<23);q[63]=3347054592;for(let G=1;G<64;++G)if(G!==32)B[G]=1024;return{floatView:J,uint32View:Q,baseTable:$,shiftTable:K,mantissaTable:W,exponentTable:q,offsetTable:B}}function mJ(z){if(Math.abs(z)>65504)Bz("DataUtils.toHalfFloat(): Value out of range.");z=dz(z,-65504,65504),yQ.floatView[0]=z;let J=yQ.uint32View[0],Q=J>>23&511;return yQ.baseTable[Q]+((J&8388607)>>yQ.shiftTable[Q])}function V1(z){let J=z>>10;return yQ.uint32View[0]=yQ.mantissaTable[yQ.offsetTable[J]+(z&1023)]+yQ.exponentTable[J],yQ.floatView[0]}class E9{static toHalfFloat(z){return mJ(z)}static fromHalfFloat(z){return V1(z)}}var yJ=new R,s1=new a,lK=0;class GJ extends QQ{constructor(z,J,Q=!1){super();if(Array.isArray(z))throw TypeError("THREE.BufferAttribute: array should be a Typed Array.");this.isBufferAttribute=!0,Object.defineProperty(this,"id",{value:lK++}),this.name="",this.array=z,this.itemSize=J,this.count=z!==void 0?z.length/J:0,this.normalized=Q,this.usage=35044,this.updateRanges=[],this.gpuType=1015,this.version=0}onUploadCallback(){}set needsUpdate(z){if(z===!0)this.version++}setUsage(z){return this.usage=z,this}addUpdateRange(z,J){this.updateRanges.push({start:z,count:J})}clearUpdateRanges(){this.updateRanges.length=0}copy(z){return this.name=z.name,this.array=new z.array.constructor(z.array),this.itemSize=z.itemSize,this.count=z.count,this.normalized=z.normalized,this.usage=z.usage,this.gpuType=z.gpuType,this}copyAt(z,J,Q){z*=this.itemSize,Q*=J.itemSize;for(let $=0,K=this.itemSize;$<K;$++)this.array[z+$]=J.array[Q+$];return this}copyArray(z){return this.array.set(z),this}applyMatrix3(z){if(this.itemSize===2)for(let J=0,Q=this.count;J<Q;J++)s1.fromBufferAttribute(this,J),s1.applyMatrix3(z),this.setXY(J,s1.x,s1.y);else if(this.itemSize===3)for(let J=0,Q=this.count;J<Q;J++)yJ.fromBufferAttribute(this,J),yJ.applyMatrix3(z),this.setXYZ(J,yJ.x,yJ.y,yJ.z);return this}applyMatrix4(z){for(let J=0,Q=this.count;J<Q;J++)yJ.fromBufferAttribute(this,J),yJ.applyMatrix4(z),this.setXYZ(J,yJ.x,yJ.y,yJ.z);return this}applyNormalMatrix(z){for(let J=0,Q=this.count;J<Q;J++)yJ.fromBufferAttribute(this,J),yJ.applyNormalMatrix(z),this.setXYZ(J,yJ.x,yJ.y,yJ.z);return this}transformDirection(z){for(let J=0,Q=this.count;J<Q;J++)yJ.fromBufferAttribute(this,J),yJ.transformDirection(z),this.setXYZ(J,yJ.x,yJ.y,yJ.z);return this}set(z,J=0){return this.array.set(z,J),this}getComponent(z,J){let Q=this.array[z*this.itemSize+J];if(this.normalized)Q=uJ(Q,this.array);return Q}setComponent(z,J,Q){if(this.normalized)Q=iz(Q,this.array);return this.array[z*this.itemSize+J]=Q,this}getX(z){let J=this.array[z*this.itemSize];if(this.normalized)J=uJ(J,this.array);return J}setX(z,J){if(this.normalized)J=iz(J,this.array);return this.array[z*this.itemSize]=J,this}getY(z){let J=this.array[z*this.itemSize+1];if(this.normalized)J=uJ(J,this.array);return J}setY(z,J){if(this.normalized)J=iz(J,this.array);return this.array[z*this.itemSize+1]=J,this}getZ(z){let J=this.array[z*this.itemSize+2];if(this.normalized)J=uJ(J,this.array);return J}setZ(z,J){if(this.normalized)J=iz(J,this.array);return this.array[z*this.itemSize+2]=J,this}getW(z){let J=this.array[z*this.itemSize+3];if(this.normalized)J=uJ(J,this.array);return J}setW(z,J){if(this.normalized)J=iz(J,this.array);return this.array[z*this.itemSize+3]=J,this}setXY(z,J,Q){if(z*=this.itemSize,this.normalized)J=iz(J,this.array),Q=iz(Q,this.array);return this.array[z+0]=J,this.array[z+1]=Q,this}setXYZ(z,J,Q,$){if(z*=this.itemSize,this.normalized)J=iz(J,this.array),Q=iz(Q,this.array),$=iz($,this.array);return this.array[z+0]=J,this.array[z+1]=Q,this.array[z+2]=$,this}setXYZW(z,J,Q,$,K){if(z*=this.itemSize,this.normalized)J=iz(J,this.array),Q=iz(Q,this.array),$=iz($,this.array),K=iz(K,this.array);return this.array[z+0]=J,this.array[z+1]=Q,this.array[z+2]=$,this.array[z+3]=K,this}onUpload(z){return this.onUploadCallback=z,this}clone(){return new this.constructor(this.array,this.itemSize).copy(this)}toJSON(){let z={itemSize:this.itemSize,type:this.array.constructor.name,array:Array.from(this.array),normalized:this.normalized};if(this.name!=="")z.name=this.name;if(this.usage!==35044)z.usage=this.usage;return z}dispose(){this.dispatchEvent({type:"dispose"})}}class I9 extends GJ{constructor(z,J,Q){super(new Int8Array(z),J,Q)}}class A9 extends GJ{constructor(z,J,Q){super(new Uint8Array(z),J,Q)}}class O9 extends GJ{constructor(z,J,Q){super(new Uint8ClampedArray(z),J,Q)}}class F9 extends GJ{constructor(z,J,Q){super(new Int16Array(z),J,Q)}}class u2 extends GJ{constructor(z,J,Q){super(new Uint16Array(z),J,Q)}}class M9 extends GJ{constructor(z,J,Q){super(new Int32Array(z),J,Q)}}class g2 extends GJ{constructor(z,J,Q){super(new Uint32Array(z),J,Q)}}class L9 extends GJ{constructor(z,J,Q){super(new Uint16Array(z),J,Q);this.isFloat16BufferAttribute=!0}getX(z){let J=V1(this.array[z*this.itemSize]);if(this.normalized)J=uJ(J,this.array);return J}setX(z,J){if(this.normalized)J=iz(J,this.array);return this.array[z*this.itemSize]=mJ(J),this}getY(z){let J=V1(this.array[z*this.itemSize+1]);if(this.normalized)J=uJ(J,this.array);return J}setY(z,J){if(this.normalized)J=iz(J,this.array);return this.array[z*this.itemSize+1]=mJ(J),this}getZ(z){let J=V1(this.array[z*this.itemSize+2]);if(this.normalized)J=uJ(J,this.array);return J}setZ(z,J){if(this.normalized)J=iz(J,this.array);return this.array[z*this.itemSize+2]=mJ(J),this}getW(z){let J=V1(this.array[z*this.itemSize+3]);if(this.normalized)J=uJ(J,this.array);return J}setW(z,J){if(this.normalized)J=iz(J,this.array);return this.array[z*this.itemSize+3]=mJ(J),this}setXY(z,J,Q){if(z*=this.itemSize,this.normalized)J=iz(J,this.array),Q=iz(Q,this.array);return this.array[z+0]=mJ(J),this.array[z+1]=mJ(Q),this}setXYZ(z,J,Q,$){if(z*=this.itemSize,this.normalized)J=iz(J,this.array),Q=iz(Q,this.array),$=iz($,this.array);return this.array[z+0]=mJ(J),this.array[z+1]=mJ(Q),this.array[z+2]=mJ($),this}setXYZW(z,J,Q,$,K){if(z*=this.itemSize,this.normalized)J=iz(J,this.array),Q=iz(Q,this.array),$=iz($,this.array),K=iz(K,this.array);return this.array[z+0]=mJ(J),this.array[z+1]=mJ(Q),this.array[z+2]=mJ($),this.array[z+3]=mJ(K),this}}class Sz extends GJ{constructor(z,J,Q){super(new Float32Array(z),J,Q)}}var mK=new fJ,Q1=new R,l5=new R;class PJ{constructor(z=new R,J=-1){this.isSphere=!0,this.center=z,this.radius=J}set(z,J){return this.center.copy(z),this.radius=J,this}setFromPoints(z,J){let Q=this.center;if(J!==void 0)Q.copy(J);else mK.setFromPoints(z).getCenter(Q);let $=0;for(let K=0,W=z.length;K<W;K++)$=Math.max($,Q.distanceToSquared(z[K]));return this.radius=Math.sqrt($),this}copy(z){return this.center.copy(z.center),this.radius=z.radius,this}isEmpty(){return this.radius<0}makeEmpty(){return this.center.set(0,0,0),this.radius=-1,this}containsPoint(z){return z.distanceToSquared(this.center)<=this.radius*this.radius}distanceToPoint(z){return z.distanceTo(this.center)-this.radius}intersectsSphere(z){let J=this.radius+z.radius;return z.center.distanceToSquared(this.center)<=J*J}intersectsBox(z){return z.intersectsSphere(this)}intersectsPlane(z){return Math.abs(z.distanceToPoint(this.center))<=this.radius}clampPoint(z,J){let Q=this.center.distanceToSquared(z);if(J.copy(z),Q>this.radius*this.radius)J.sub(this.center).normalize(),J.multiplyScalar(this.radius).add(this.center);return J}getBoundingBox(z){if(this.isEmpty())return z.makeEmpty(),z;return z.set(this.center,this.center),z.expandByScalar(this.radius),z}applyMatrix4(z){return this.center.applyMatrix4(z),this.radius=this.radius*z.getMaxScaleOnAxis(),this}translate(z){return this.center.add(z),this}expandByPoint(z){if(this.isEmpty())return this.center.copy(z),this.radius=0,this;Q1.subVectors(z,this.center);let J=Q1.lengthSq();if(J>this.radius*this.radius){let Q=Math.sqrt(J),$=(Q-this.radius)*0.5;this.center.addScaledVector(Q1,$/Q),this.radius+=$}return this}union(z){if(z.isEmpty())return this;if(this.isEmpty())return this.copy(z),this;if(this.center.equals(z.center)===!0)this.radius=Math.max(this.radius,z.radius);else l5.subVectors(z.center,this.center).setLength(z.radius),this.expandByPoint(Q1.copy(z.center).add(l5)),this.expandByPoint(Q1.copy(z.center).sub(l5));return this}equals(z){return z.center.equals(this.center)&&z.radius===this.radius}clone(){return new this.constructor().copy(this)}toJSON(){return{radius:this.radius,center:this.center.toArray()}}fromJSON(z){return this.radius=z.radius,this.center.fromArray(z.center),this}}var cK=0,JQ=new pz,m5=new KJ,R0=new R,iJ=new fJ,$1=new fJ,CJ=new R;class mz extends QQ{constructor(){super();this.isBufferGeometry=!0,Object.defineProperty(this,"id",{value:cK++}),this.uuid=aJ(),this.name="",this.type="BufferGeometry",this.index=null,this.indirect=null,this.indirectOffset=0,this.attributes={},this.morphAttributes={},this.morphTargetsRelative=!1,this.groups=[],this.boundingBox=null,this.boundingSphere=null,this.drawRange={start:0,count:1/0},this.userData={},this._transformed=!1}getIndex(){return this.index}setIndex(z){if(Array.isArray(z))this.index=new((NK(z))?g2:u2)(z,1);else this.index=z;return this}setIndirect(z,J=0){return this.indirect=z,this.indirectOffset=J,this}getIndirect(){return this.indirect}getAttribute(z){return this.attributes[z]}setAttribute(z,J){return this.attributes[z]=J,this}deleteAttribute(z){return delete this.attributes[z],this}hasAttribute(z){return this.attributes[z]!==void 0}addGroup(z,J,Q=0){this.groups.push({start:z,count:J,materialIndex:Q})}clearGroups(){this.groups=[]}setDrawRange(z,J){this.drawRange.start=z,this.drawRange.count=J}applyMatrix4(z){let J=this.attributes.position;if(J!==void 0)J.applyMatrix4(z),J.needsUpdate=!0;let Q=this.attributes.normal;if(Q!==void 0){let K=new lz().getNormalMatrix(z);Q.applyNormalMatrix(K),Q.needsUpdate=!0}let $=this.attributes.tangent;if($!==void 0)$.transformDirection(z),$.needsUpdate=!0;if(this.boundingBox!==null)this.computeBoundingBox();if(this.boundingSphere!==null)this.computeBoundingSphere();return this._transformed=!0,this}applyQuaternion(z){return JQ.makeRotationFromQuaternion(z),this.applyMatrix4(JQ),this}rotateX(z){return JQ.makeRotationX(z),this.applyMatrix4(JQ),this}rotateY(z){return JQ.makeRotationY(z),this.applyMatrix4(JQ),this}rotateZ(z){return JQ.makeRotationZ(z),this.applyMatrix4(JQ),this}translate(z,J,Q){return JQ.makeTranslation(z,J,Q),this.applyMatrix4(JQ),this}scale(z,J,Q){return JQ.makeScale(z,J,Q),this.applyMatrix4(JQ),this}lookAt(z){return m5.lookAt(z),m5.updateMatrix(),this.applyMatrix4(m5.matrix),this}center(){return this.computeBoundingBox(),this.boundingBox.getCenter(R0).negate(),this.translate(R0.x,R0.y,R0.z),this}setFromPoints(z){let J=this.getAttribute("position");if(J===void 0){let Q=[];for(let $=0,K=z.length;$<K;$++){let W=z[$];Q.push(W.x,W.y,W.z||0)}this.setAttribute("position",new Sz(Q,3))}else{let Q=Math.min(z.length,J.count);for(let $=0;$<Q;$++){let K=z[$];J.setXYZ($,K.x,K.y,K.z||0)}if(z.length>J.count)Bz("BufferGeometry: Buffer size too small for points data. Use .dispose() and create a new geometry.");J.needsUpdate=!0}return this}computeBoundingBox(){if(this.boundingBox===null)this.boundingBox=new fJ;let z=this.attributes.position,J=this.morphAttributes.position;if(z&&z.isGLBufferAttribute){Pz("BufferGeometry.computeBoundingBox(): GLBufferAttribute requires a manual bounding box.",this),this.boundingBox.set(new R(-1/0,-1/0,-1/0),new R(1/0,1/0,1/0));return}if(z!==void 0){if(this.boundingBox.setFromBufferAttribute(z),J)for(let Q=0,$=J.length;Q<$;Q++){let K=J[Q];if(iJ.setFromBufferAttribute(K),this.morphTargetsRelative)CJ.addVectors(this.boundingBox.min,iJ.min),this.boundingBox.expandByPoint(CJ),CJ.addVectors(this.boundingBox.max,iJ.max),this.boundingBox.expandByPoint(CJ);else this.boundingBox.expandByPoint(iJ.min),this.boundingBox.expandByPoint(iJ.max)}}else this.boundingBox.makeEmpty();if(isNaN(this.boundingBox.min.x)||isNaN(this.boundingBox.min.y)||isNaN(this.boundingBox.min.z))Pz('BufferGeometry.computeBoundingBox(): Computed min/max have NaN values. The "position" attribute is likely to have NaN values.',this)}computeBoundingSphere(){if(this.boundingSphere===null)this.boundingSphere=new PJ;let z=this.attributes.position,J=this.morphAttributes.position;if(z&&z.isGLBufferAttribute){Pz("BufferGeometry.computeBoundingSphere(): GLBufferAttribute requires a manual bounding sphere.",this),this.boundingSphere.set(new R,1/0);return}if(z){let Q=this.boundingSphere.center;if(iJ.setFromBufferAttribute(z),J)for(let K=0,W=J.length;K<W;K++){let q=J[K];if($1.setFromBufferAttribute(q),this.morphTargetsRelative)CJ.addVectors(iJ.min,$1.min),iJ.expandByPoint(CJ),CJ.addVectors(iJ.max,$1.max),iJ.expandByPoint(CJ);else iJ.expandByPoint($1.min),iJ.expandByPoint($1.max)}iJ.getCenter(Q);let $=0;for(let K=0,W=z.count;K<W;K++)CJ.fromBufferAttribute(z,K),$=Math.max($,Q.distanceToSquared(CJ));if(J)for(let K=0,W=J.length;K<W;K++){let q=J[K],B=this.morphTargetsRelative;for(let G=0,N=q.count;G<N;G++){if(CJ.fromBufferAttribute(q,G),B)R0.fromBufferAttribute(z,G),CJ.add(R0);$=Math.max($,Q.distanceToSquared(CJ))}}if(this.boundingSphere.radius=Math.sqrt($),isNaN(this.boundingSphere.radius))Pz('BufferGeometry.computeBoundingSphere(): Computed radius is NaN. The "position" attribute is likely to have NaN values.',this)}}computeTangents(){let z=this.index,J=this.attributes;if(z===null||J.position===void 0||J.normal===void 0||J.uv===void 0){Pz("BufferGeometry: .computeTangents() failed. Missing required attributes (index, position, normal or uv)");return}let{position:Q,normal:$,uv:K}=J,W=this.getAttribute("tangent");if(W===void 0||W.count!==Q.count)W=new GJ(new Float32Array(4*Q.count),4),this.setAttribute("tangent",W);let q=[],B=[];for(let C=0;C<Q.count;C++)q[C]=new R,B[C]=new R;let G=new R,N=new R,Z=new R,H=new a,D=new a,U=new a,X=new R,k=new R;function Y(C,E,F){G.fromBufferAttribute(Q,C),N.fromBufferAttribute(Q,E),Z.fromBufferAttribute(Q,F),H.fromBufferAttribute(K,C),D.fromBufferAttribute(K,E),U.fromBufferAttribute(K,F),N.sub(G),Z.sub(G),D.sub(H),U.sub(H);let x=1/(D.x*U.y-U.x*D.y);if(!isFinite(x))return;X.copy(N).multiplyScalar(U.y).addScaledVector(Z,-D.y).multiplyScalar(x),k.copy(Z).multiplyScalar(D.x).addScaledVector(N,-U.x).multiplyScalar(x),q[C].add(X),q[E].add(X),q[F].add(X),B[C].add(k),B[E].add(k),B[F].add(k)}let V=this.groups;if(V.length===0)V=[{start:0,count:z.count}];for(let C=0,E=V.length;C<E;++C){let F=V[C],x=F.start,P=F.count;for(let p=x,n=x+P;p<n;p+=3)Y(z.getX(p+0),z.getX(p+1),z.getX(p+2))}let L=new R,O=new R,I=new R,S=new R;function w(C){I.fromBufferAttribute($,C),S.copy(I);let E=q[C];L.copy(E),L.sub(I.multiplyScalar(I.dot(E))).normalize(),O.crossVectors(S,E);let x=O.dot(B[C])<0?-1:1;W.setXYZW(C,L.x,L.y,L.z,x)}for(let C=0,E=V.length;C<E;++C){let F=V[C],x=F.start,P=F.count;for(let p=x,n=x+P;p<n;p+=3)w(z.getX(p+0)),w(z.getX(p+1)),w(z.getX(p+2))}this._transformed=!0}computeVertexNormals(){let z=this.index,J=this.getAttribute("position");if(J!==void 0){let Q=this.getAttribute("normal");if(Q===void 0||Q.count!==J.count)Q=new GJ(new Float32Array(J.count*3),3),this.setAttribute("normal",Q);else for(let H=0,D=Q.count;H<D;H++)Q.setXYZ(H,0,0,0);let $=new R,K=new R,W=new R,q=new R,B=new R,G=new R,N=new R,Z=new R;if(z)for(let H=0,D=z.count;H<D;H+=3){let U=z.getX(H+0),X=z.getX(H+1),k=z.getX(H+2);$.fromBufferAttribute(J,U),K.fromBufferAttribute(J,X),W.fromBufferAttribute(J,k),N.subVectors(W,K),Z.subVectors($,K),N.cross(Z),q.fromBufferAttribute(Q,U),B.fromBufferAttribute(Q,X),G.fromBufferAttribute(Q,k),q.add(N),B.add(N),G.add(N),Q.setXYZ(U,q.x,q.y,q.z),Q.setXYZ(X,B.x,B.y,B.z),Q.setXYZ(k,G.x,G.y,G.z)}else for(let H=0,D=J.count;H<D;H+=3)$.fromBufferAttribute(J,H+0),K.fromBufferAttribute(J,H+1),W.fromBufferAttribute(J,H+2),N.subVectors(W,K),Z.subVectors($,K),N.cross(Z),Q.setXYZ(H+0,N.x,N.y,N.z),Q.setXYZ(H+1,N.x,N.y,N.z),Q.setXYZ(H+2,N.x,N.y,N.z);this.normalizeNormals(),Q.needsUpdate=!0}}normalizeNormals(){let z=this.attributes.normal;for(let J=0,Q=z.count;J<Q;J++)CJ.fromBufferAttribute(z,J),CJ.normalize(),z.setXYZ(J,CJ.x,CJ.y,CJ.z)}toNonIndexed(){function z(q,B){let{array:G,itemSize:N,normalized:Z}=q,H=new G.constructor(B.length*N),D=0,U=0;for(let X=0,k=B.length;X<k;X++){if(q.isInterleavedBufferAttribute)D=B[X]*q.data.stride+q.offset;else D=B[X]*N;for(let Y=0;Y<N;Y++)H[U++]=G[D++]}return new GJ(H,N,Z)}if(this.index===null)return Bz("BufferGeometry.toNonIndexed(): BufferGeometry is already non-indexed."),this;let J=new mz,Q=this.index.array,$=this.attributes;for(let q in $){let B=$[q],G=z(B,Q);J.setAttribute(q,G)}let K=this.morphAttributes;for(let q in K){let B=[],G=K[q];for(let N=0,Z=G.length;N<Z;N++){let H=G[N],D=z(H,Q);B.push(D)}J.morphAttributes[q]=B}J.morphTargetsRelative=this.morphTargetsRelative;let W=this.groups;for(let q=0,B=W.length;q<B;q++){let G=W[q];J.addGroup(G.start,G.count,G.materialIndex)}return J}toJSON(){let z={metadata:{version:4.7,type:"BufferGeometry",generator:"BufferGeometry.toJSON"}};if(z.uuid=this.uuid,z.type=this.parameters!==void 0&&this._transformed===!0?"BufferGeometry":this.type,this.name!=="")z.name=this.name;if(Object.keys(this.userData).length>0)z.userData=this.userData;if(this.parameters!==void 0&&this._transformed!==!0){let B=this.parameters;for(let G in B)if(B[G]!==void 0)z[G]=B[G];return z}z.data={attributes:{}};let J=this.index;if(J!==null)z.data.index={type:J.array.constructor.name,array:Array.prototype.slice.call(J.array)};let Q=this.attributes;for(let B in Q){let G=Q[B];z.data.attributes[B]=G.toJSON(z.data)}let $={},K=!1;for(let B in this.morphAttributes){let G=this.morphAttributes[B],N=[];for(let Z=0,H=G.length;Z<H;Z++){let D=G[Z];N.push(D.toJSON(z.data))}if(N.length>0)$[B]=N,K=!0}if(K)z.data.morphAttributes=$,z.data.morphTargetsRelative=this.morphTargetsRelative;let W=this.groups;if(W.length>0)z.data.groups=JSON.parse(JSON.stringify(W));let q=this.boundingSphere;if(q!==null)z.data.boundingSphere=q.toJSON();return z}clone(){return new this.constructor().copy(this)}copy(z){this.index=null,this.attributes={},this.morphAttributes={},this.groups=[],this.boundingBox=null,this.boundingSphere=null;let J={};this.name=z.name;let Q=z.index;if(Q!==null)this.setIndex(Q.clone());let $=z.attributes;for(let G in $){let N=$[G];this.setAttribute(G,N.clone(J))}let K=z.morphAttributes;for(let G in K){let N=[],Z=K[G];for(let H=0,D=Z.length;H<D;H++)N.push(Z[H].clone(J));this.morphAttributes[G]=N}this.morphTargetsRelative=z.morphTargetsRelative;let W=z.groups;for(let G=0,N=W.length;G<N;G++){let Z=W[G];this.addGroup(Z.start,Z.count,Z.materialIndex)}let q=z.boundingBox;if(q!==null)this.boundingBox=q.clone();let B=z.boundingSphere;if(B!==null)this.boundingSphere=B.clone();return this.drawRange.start=z.drawRange.start,this.drawRange.count=z.drawRange.count,this.userData=z.userData,this._transformed=z._transformed,this}dispose(){this.dispatchEvent({type:"dispose"})}}class P1{constructor(z,J){this.isInterleavedBuffer=!0,this.array=z,this.stride=J,this.count=z!==void 0?z.length/J:0,this.usage=35044,this.updateRanges=[],this.version=0,this.uuid=aJ()}onUploadCallback(){}set needsUpdate(z){if(z===!0)this.version++}setUsage(z){return this.usage=z,this}addUpdateRange(z,J){this.updateRanges.push({start:z,count:J})}clearUpdateRanges(){this.updateRanges.length=0}copy(z){return this.array=new z.array.constructor(z.array),this.count=z.count,this.stride=z.stride,this.usage=z.usage,this}copyAt(z,J,Q){z*=this.stride,Q*=J.stride;for(let $=0,K=this.stride;$<K;$++)this.array[z+$]=J.array[Q+$];return this}set(z,J=0){return this.array.set(z,J),this}clone(z){if(z.arrayBuffers===void 0)z.arrayBuffers={};if(this.array.buffer._uuid===void 0)this.array.buffer._uuid=aJ();if(z.arrayBuffers[this.array.buffer._uuid]===void 0)z.arrayBuffers[this.array.buffer._uuid]=this.array.slice(0).buffer;let J=new this.array.constructor(z.arrayBuffers[this.array.buffer._uuid]),Q=new this.constructor(J,this.stride);return Q.setUsage(this.usage),Q}onUpload(z){return this.onUploadCallback=z,this}toJSON(z){if(z.arrayBuffers===void 0)z.arrayBuffers={};if(this.array.buffer._uuid===void 0)this.array.buffer._uuid=aJ();if(z.arrayBuffers[this.array.buffer._uuid]===void 0)z.arrayBuffers[this.array.buffer._uuid]=Array.from(new Uint32Array(this.array.buffer));return{uuid:this.uuid,buffer:this.array.buffer._uuid,type:this.array.constructor.name,stride:this.stride}}}var dJ=new R;class H0{constructor(z,J,Q,$=!1){this.isInterleavedBufferAttribute=!0,this.name="",this.data=z,this.itemSize=J,this.offset=Q,this.normalized=$}get count(){return this.data.count}get array(){return this.data.array}set needsUpdate(z){this.data.needsUpdate=z}applyMatrix4(z){for(let J=0,Q=this.data.count;J<Q;J++)dJ.fromBufferAttribute(this,J),dJ.applyMatrix4(z),this.setXYZ(J,dJ.x,dJ.y,dJ.z);return this}applyNormalMatrix(z){for(let J=0,Q=this.count;J<Q;J++)dJ.fromBufferAttribute(this,J),dJ.applyNormalMatrix(z),this.setXYZ(J,dJ.x,dJ.y,dJ.z);return this}transformDirection(z){for(let J=0,Q=this.count;J<Q;J++)dJ.fromBufferAttribute(this,J),dJ.transformDirection(z),this.setXYZ(J,dJ.x,dJ.y,dJ.z);return this}getComponent(z,J){let Q=this.array[z*this.data.stride+this.offset+J];if(this.normalized)Q=uJ(Q,this.array);return Q}setComponent(z,J,Q){if(this.normalized)Q=iz(Q,this.array);return this.data.array[z*this.data.stride+this.offset+J]=Q,this}setX(z,J){if(this.normalized)J=iz(J,this.array);return this.data.array[z*this.data.stride+this.offset]=J,this}setY(z,J){if(this.normalized)J=iz(J,this.array);return this.data.array[z*this.data.stride+this.offset+1]=J,this}setZ(z,J){if(this.normalized)J=iz(J,this.array);return this.data.array[z*this.data.stride+this.offset+2]=J,this}setW(z,J){if(this.normalized)J=iz(J,this.array);return this.data.array[z*this.data.stride+this.offset+3]=J,this}getX(z){let J=this.data.array[z*this.data.stride+this.offset];if(this.normalized)J=uJ(J,this.array);return J}getY(z){let J=this.data.array[z*this.data.stride+this.offset+1];if(this.normalized)J=uJ(J,this.array);return J}getZ(z){let J=this.data.array[z*this.data.stride+this.offset+2];if(this.normalized)J=uJ(J,this.array);return J}getW(z){let J=this.data.array[z*this.data.stride+this.offset+3];if(this.normalized)J=uJ(J,this.array);return J}setXY(z,J,Q){if(z=z*this.data.stride+this.offset,this.normalized)J=iz(J,this.array),Q=iz(Q,this.array);return this.data.array[z+0]=J,this.data.array[z+1]=Q,this}setXYZ(z,J,Q,$){if(z=z*this.data.stride+this.offset,this.normalized)J=iz(J,this.array),Q=iz(Q,this.array),$=iz($,this.array);return this.data.array[z+0]=J,this.data.array[z+1]=Q,this.data.array[z+2]=$,this}setXYZW(z,J,Q,$,K){if(z=z*this.data.stride+this.offset,this.normalized)J=iz(J,this.array),Q=iz(Q,this.array),$=iz($,this.array),K=iz(K,this.array);return this.data.array[z+0]=J,this.data.array[z+1]=Q,this.data.array[z+2]=$,this.data.array[z+3]=K,this}clone(z){if(z===void 0){M1("InterleavedBufferAttribute.clone(): Cloning an interleaved buffer attribute will de-interleave buffer data.");let J=[];for(let Q=0;Q<this.count;Q++){let $=Q*this.data.stride+this.offset;for(let K=0;K<this.itemSize;K++)J.push(this.data.array[$+K])}return new GJ(new this.array.constructor(J),this.itemSize,this.normalized)}else{if(z.interleavedBuffers===void 0)z.interleavedBuffers={};if(z.interleavedBuffers[this.data.uuid]===void 0)z.interleavedBuffers[this.data.uuid]=this.data.clone(z);return new H0(z.interleavedBuffers[this.data.uuid],this.itemSize,this.offset,this.normalized)}}toJSON(z){if(z===void 0){M1("InterleavedBufferAttribute.toJSON(): Serializing an interleaved buffer attribute will de-interleave buffer data.");let J=[];for(let Q=0;Q<this.count;Q++){let $=Q*this.data.stride+this.offset;for(let K=0;K<this.itemSize;K++)J.push(this.data.array[$+K])}return{itemSize:this.itemSize,type:this.array.constructor.name,array:J,normalized:this.normalized}}else{if(z.interleavedBuffers===void 0)z.interleavedBuffers={};if(z.interleavedBuffers[this.data.uuid]===void 0)z.interleavedBuffers[this.data.uuid]=this.data.toJSON(z);return{isInterleavedBufferAttribute:!0,itemSize:this.itemSize,data:this.data.uuid,offset:this.offset,normalized:this.normalized}}}}var nK=0;class vJ extends QQ{constructor(){super();this.isMaterial=!0,Object.defineProperty(this,"id",{value:nK++}),this.uuid=aJ(),this.name="",this.type="Material",this.blending=1,this.side=0,this.vertexColors=!1,this.opacity=1,this.transparent=!1,this.alphaHash=!1,this.blendSrc=204,this.blendDst=205,this.blendEquation=100,this.blendSrcAlpha=null,this.blendDstAlpha=null,this.blendEquationAlpha=null,this.blendColor=new Fz(0,0,0),this.blendAlpha=0,this.depthFunc=3,this.depthTest=!0,this.depthWrite=!0,this.stencilWriteMask=255,this.stencilFunc=519,this.stencilRef=0,this.stencilFuncMask=255,this.stencilFail=7680,this.stencilZFail=7680,this.stencilZPass=7680,this.stencilWrite=!1,this.clippingPlanes=null,this.clipIntersection=!1,this.clipShadows=!1,this.shadowSide=null,this.colorWrite=!0,this.precision=null,this.polygonOffset=!1,this.polygonOffsetFactor=0,this.polygonOffsetUnits=0,this.dithering=!1,this.alphaToCoverage=!1,this.premultipliedAlpha=!1,this.forceSinglePass=!1,this.allowOverride=!0,this.visible=!0,this.toneMapped=!0,this.userData={},this.version=0,this._alphaTest=0}get alphaTest(){return this._alphaTest}set alphaTest(z){if(this._alphaTest>0!==z>0)this.version++;this._alphaTest=z}onBeforeRender(){}onBeforeCompile(){}customProgramCacheKey(){return this.onBeforeCompile.toString()}setValues(z){if(z===void 0)return;for(let J in z){let Q=z[J];if(Q===void 0){Bz(`Material: parameter '${J}' has value of undefined.`);continue}let $=this[J];if($===void 0){Bz(`Material: '${J}' is not a property of THREE.${this.type}.`);continue}if($&&$.isColor)$.set(Q);else if($&&$.isVector2&&(Q&&Q.isVector2)||$&&$.isEuler&&(Q&&Q.isEuler)||$&&$.isVector3&&(Q&&Q.isVector3))$.copy(Q);else this[J]=Q}}toJSON(z){let J=z===void 0||typeof z==="string";if(J)z={textures:{},images:{}};let Q={metadata:{version:4.7,type:"Material",generator:"Material.toJSON"}};if(Q.uuid=this.uuid,Q.type=this.type,this.name!=="")Q.name=this.name;if(this.color&&this.color.isColor)Q.color=this.color.getHex();if(this.roughness!==void 0)Q.roughness=this.roughness;if(this.metalness!==void 0)Q.metalness=this.metalness;if(this.sheen!==void 0)Q.sheen=this.sheen;if(this.sheenColor&&this.sheenColor.isColor)Q.sheenColor=this.sheenColor.getHex();if(this.sheenRoughness!==void 0)Q.sheenRoughness=this.sheenRoughness;if(this.emissive&&this.emissive.isColor)Q.emissive=this.emissive.getHex();if(this.emissiveIntensity!==void 0&&this.emissiveIntensity!==1)Q.emissiveIntensity=this.emissiveIntensity;if(this.specular&&this.specular.isColor)Q.specular=this.specular.getHex();if(this.specularIntensity!==void 0)Q.specularIntensity=this.specularIntensity;if(this.specularColor&&this.specularColor.isColor)Q.specularColor=this.specularColor.getHex();if(this.shininess!==void 0)Q.shininess=this.shininess;if(this.clearcoat!==void 0)Q.clearcoat=this.clearcoat;if(this.clearcoatRoughness!==void 0)Q.clearcoatRoughness=this.clearcoatRoughness;if(this.clearcoatMap&&this.clearcoatMap.isTexture)Q.clearcoatMap=this.clearcoatMap.toJSON(z).uuid;if(this.clearcoatRoughnessMap&&this.clearcoatRoughnessMap.isTexture)Q.clearcoatRoughnessMap=this.clearcoatRoughnessMap.toJSON(z).uuid;if(this.clearcoatNormalMap&&this.clearcoatNormalMap.isTexture)Q.clearcoatNormalMap=this.clearcoatNormalMap.toJSON(z).uuid,Q.clearcoatNormalScale=this.clearcoatNormalScale.toArray();if(this.sheenColorMap&&this.sheenColorMap.isTexture)Q.sheenColorMap=this.sheenColorMap.toJSON(z).uuid;if(this.sheenRoughnessMap&&this.sheenRoughnessMap.isTexture)Q.sheenRoughnessMap=this.sheenRoughnessMap.toJSON(z).uuid;if(this.dispersion!==void 0)Q.dispersion=this.dispersion;if(this.iridescence!==void 0)Q.iridescence=this.iridescence;if(this.iridescenceIOR!==void 0)Q.iridescenceIOR=this.iridescenceIOR;if(this.iridescenceThicknessRange!==void 0)Q.iridescenceThicknessRange=this.iridescenceThicknessRange;if(this.iridescenceMap&&this.iridescenceMap.isTexture)Q.iridescenceMap=this.iridescenceMap.toJSON(z).uuid;if(this.iridescenceThicknessMap&&this.iridescenceThicknessMap.isTexture)Q.iridescenceThicknessMap=this.iridescenceThicknessMap.toJSON(z).uuid;if(this.anisotropy!==void 0)Q.anisotropy=this.anisotropy;if(this.anisotropyRotation!==void 0)Q.anisotropyRotation=this.anisotropyRotation;if(this.anisotropyMap&&this.anisotropyMap.isTexture)Q.anisotropyMap=this.anisotropyMap.toJSON(z).uuid;if(this.map&&this.map.isTexture)Q.map=this.map.toJSON(z).uuid;if(this.matcap&&this.matcap.isTexture)Q.matcap=this.matcap.toJSON(z).uuid;if(this.alphaMap&&this.alphaMap.isTexture)Q.alphaMap=this.alphaMap.toJSON(z).uuid;if(this.lightMap&&this.lightMap.isTexture)Q.lightMap=this.lightMap.toJSON(z).uuid,Q.lightMapIntensity=this.lightMapIntensity;if(this.aoMap&&this.aoMap.isTexture)Q.aoMap=this.aoMap.toJSON(z).uuid,Q.aoMapIntensity=this.aoMapIntensity;if(this.bumpMap&&this.bumpMap.isTexture)Q.bumpMap=this.bumpMap.toJSON(z).uuid,Q.bumpScale=this.bumpScale;if(this.normalMap&&this.normalMap.isTexture)Q.normalMap=this.normalMap.toJSON(z).uuid,Q.normalMapType=this.normalMapType,Q.normalScale=this.normalScale.toArray();if(this.displacementMap&&this.displacementMap.isTexture)Q.displacementMap=this.displacementMap.toJSON(z).uuid,Q.displacementScale=this.displacementScale,Q.displacementBias=this.displacementBias;if(this.roughnessMap&&this.roughnessMap.isTexture)Q.roughnessMap=this.roughnessMap.toJSON(z).uuid;if(this.metalnessMap&&this.metalnessMap.isTexture)Q.metalnessMap=this.metalnessMap.toJSON(z).uuid;if(this.emissiveMap&&this.emissiveMap.isTexture)Q.emissiveMap=this.emissiveMap.toJSON(z).uuid;if(this.specularMap&&this.specularMap.isTexture)Q.specularMap=this.specularMap.toJSON(z).uuid;if(this.specularIntensityMap&&this.specularIntensityMap.isTexture)Q.specularIntensityMap=this.specularIntensityMap.toJSON(z).uuid;if(this.specularColorMap&&this.specularColorMap.isTexture)Q.specularColorMap=this.specularColorMap.toJSON(z).uuid;if(this.envMap&&this.envMap.isTexture){if(Q.envMap=this.envMap.toJSON(z).uuid,this.combine!==void 0)Q.combine=this.combine}if(this.envMapRotation!==void 0)Q.envMapRotation=this.envMapRotation.toArray();if(this.envMapIntensity!==void 0)Q.envMapIntensity=this.envMapIntensity;if(this.reflectivity!==void 0)Q.reflectivity=this.reflectivity;if(this.refractionRatio!==void 0)Q.refractionRatio=this.refractionRatio;if(this.gradientMap&&this.gradientMap.isTexture)Q.gradientMap=this.gradientMap.toJSON(z).uuid;if(this.transmission!==void 0)Q.transmission=this.transmission;if(this.transmissionMap&&this.transmissionMap.isTexture)Q.transmissionMap=this.transmissionMap.toJSON(z).uuid;if(this.thickness!==void 0)Q.thickness=this.thickness;if(this.thicknessMap&&this.thicknessMap.isTexture)Q.thicknessMap=this.thicknessMap.toJSON(z).uuid;if(this.attenuationDistance!==void 0&&this.attenuationDistance!==1/0)Q.attenuationDistance=this.attenuationDistance;if(this.attenuationColor!==void 0)Q.attenuationColor=this.attenuationColor.getHex();if(this.size!==void 0)Q.size=this.size;if(this.shadowSide!==null)Q.shadowSide=this.shadowSide;if(this.sizeAttenuation!==void 0)Q.sizeAttenuation=this.sizeAttenuation;if(this.blending!==1)Q.blending=this.blending;if(this.side!==0)Q.side=this.side;if(this.vertexColors===!0)Q.vertexColors=!0;if(this.opacity<1)Q.opacity=this.opacity;if(this.transparent===!0)Q.transparent=!0;if(this.blendSrc!==204)Q.blendSrc=this.blendSrc;if(this.blendDst!==205)Q.blendDst=this.blendDst;if(this.blendEquation!==100)Q.blendEquation=this.blendEquation;if(this.blendSrcAlpha!==null)Q.blendSrcAlpha=this.blendSrcAlpha;if(this.blendDstAlpha!==null)Q.blendDstAlpha=this.blendDstAlpha;if(this.blendEquationAlpha!==null)Q.blendEquationAlpha=this.blendEquationAlpha;if(this.blendColor&&this.blendColor.isColor)Q.blendColor=this.blendColor.getHex();if(this.blendAlpha!==0)Q.blendAlpha=this.blendAlpha;if(this.depthFunc!==3)Q.depthFunc=this.depthFunc;if(this.depthTest===!1)Q.depthTest=this.depthTest;if(this.depthWrite===!1)Q.depthWrite=this.depthWrite;if(this.colorWrite===!1)Q.colorWrite=this.colorWrite;if(this.stencilWriteMask!==255)Q.stencilWriteMask=this.stencilWriteMask;if(this.stencilFunc!==519)Q.stencilFunc=this.stencilFunc;if(this.stencilRef!==0)Q.stencilRef=this.stencilRef;if(this.stencilFuncMask!==255)Q.stencilFuncMask=this.stencilFuncMask;if(this.stencilFail!==7680)Q.stencilFail=this.stencilFail;if(this.stencilZFail!==7680)Q.stencilZFail=this.stencilZFail;if(this.stencilZPass!==7680)Q.stencilZPass=this.stencilZPass;if(this.stencilWrite===!0)Q.stencilWrite=this.stencilWrite;if(this.rotation!==void 0&&this.rotation!==0)Q.rotation=this.rotation;if(this.polygonOffset===!0)Q.polygonOffset=!0;if(this.polygonOffsetFactor!==0)Q.polygonOffsetFactor=this.polygonOffsetFactor;if(this.polygonOffsetUnits!==0)Q.polygonOffsetUnits=this.polygonOffsetUnits;if(this.linewidth!==void 0&&this.linewidth!==1)Q.linewidth=this.linewidth;if(this.dashSize!==void 0)Q.dashSize=this.dashSize;if(this.gapSize!==void 0)Q.gapSize=this.gapSize;if(this.scale!==void 0)Q.scale=this.scale;if(this.dithering===!0)Q.dithering=!0;if(this.alphaTest>0)Q.alphaTest=this.alphaTest;if(this.alphaHash===!0)Q.alphaHash=!0;if(this.alphaToCoverage===!0)Q.alphaToCoverage=!0;if(this.premultipliedAlpha===!0)Q.premultipliedAlpha=!0;if(this.forceSinglePass===!0)Q.forceSinglePass=!0;if(this.allowOverride===!1)Q.allowOverride=!1;if(this.wireframe===!0)Q.wireframe=!0;if(this.wireframeLinewidth>1)Q.wireframeLinewidth=this.wireframeLinewidth;if(this.wireframeLinecap!=="round")Q.wireframeLinecap=this.wireframeLinecap;if(this.wireframeLinejoin!=="round")Q.wireframeLinejoin=this.wireframeLinejoin;if(this.flatShading===!0)Q.flatShading=!0;if(this.visible===!1)Q.visible=!1;if(this.toneMapped===!1)Q.toneMapped=!1;if(this.fog===!1)Q.fog=!1;if(Object.keys(this.userData).length>0)Q.userData=this.userData;function $(K){let W=[];for(let q in K){let B=K[q];delete B.metadata,W.push(B)}return W}if(J){let K=$(z.textures),W=$(z.images);if(K.length>0)Q.textures=K;if(W.length>0)Q.images=W}return Q}fromJSON(z,J){if(z.uuid!==void 0)this.uuid=z.uuid;if(z.name!==void 0)this.name=z.name;if(z.color!==void 0&&this.color!==void 0)this.color.setHex(z.color);if(z.roughness!==void 0)this.roughness=z.roughness;if(z.metalness!==void 0)this.metalness=z.metalness;if(z.sheen!==void 0)this.sheen=z.sheen;if(z.sheenColor!==void 0)this.sheenColor=new Fz().setHex(z.sheenColor);if(z.sheenRoughness!==void 0)this.sheenRoughness=z.sheenRoughness;if(z.emissive!==void 0&&this.emissive!==void 0)this.emissive.setHex(z.emissive);if(z.specular!==void 0&&this.specular!==void 0)this.specular.setHex(z.specular);if(z.specularIntensity!==void 0)this.specularIntensity=z.specularIntensity;if(z.specularColor!==void 0&&this.specularColor!==void 0)this.specularColor.setHex(z.specularColor);if(z.shininess!==void 0)this.shininess=z.shininess;if(z.clearcoat!==void 0)this.clearcoat=z.clearcoat;if(z.clearcoatRoughness!==void 0)this.clearcoatRoughness=z.clearcoatRoughness;if(z.dispersion!==void 0)this.dispersion=z.dispersion;if(z.iridescence!==void 0)this.iridescence=z.iridescence;if(z.iridescenceIOR!==void 0)this.iridescenceIOR=z.iridescenceIOR;if(z.iridescenceThicknessRange!==void 0)this.iridescenceThicknessRange=z.iridescenceThicknessRange;if(z.transmission!==void 0)this.transmission=z.transmission;if(z.thickness!==void 0)this.thickness=z.thickness;if(z.attenuationDistance!==void 0)this.attenuationDistance=z.attenuationDistance;if(z.attenuationColor!==void 0&&this.attenuationColor!==void 0)this.attenuationColor.setHex(z.attenuationColor);if(z.anisotropy!==void 0)this.anisotropy=z.anisotropy;if(z.anisotropyRotation!==void 0)this.anisotropyRotation=z.anisotropyRotation;if(z.fog!==void 0)this.fog=z.fog;if(z.flatShading!==void 0)this.flatShading=z.flatShading;if(z.blending!==void 0)this.blending=z.blending;if(z.combine!==void 0)this.combine=z.combine;if(z.side!==void 0)this.side=z.side;if(z.shadowSide!==void 0)this.shadowSide=z.shadowSide;if(z.opacity!==void 0)this.opacity=z.opacity;if(z.transparent!==void 0)this.transparent=z.transparent;if(z.alphaTest!==void 0)this.alphaTest=z.alphaTest;if(z.alphaHash!==void 0)this.alphaHash=z.alphaHash;if(z.depthFunc!==void 0)this.depthFunc=z.depthFunc;if(z.depthTest!==void 0)this.depthTest=z.depthTest;if(z.depthWrite!==void 0)this.depthWrite=z.depthWrite;if(z.colorWrite!==void 0)this.colorWrite=z.colorWrite;if(z.blendSrc!==void 0)this.blendSrc=z.blendSrc;if(z.blendDst!==void 0)this.blendDst=z.blendDst;if(z.blendEquation!==void 0)this.blendEquation=z.blendEquation;if(z.blendSrcAlpha!==void 0)this.blendSrcAlpha=z.blendSrcAlpha;if(z.blendDstAlpha!==void 0)this.blendDstAlpha=z.blendDstAlpha;if(z.blendEquationAlpha!==void 0)this.blendEquationAlpha=z.blendEquationAlpha;if(z.blendColor!==void 0&&this.blendColor!==void 0)this.blendColor.setHex(z.blendColor);if(z.blendAlpha!==void 0)this.blendAlpha=z.blendAlpha;if(z.stencilWriteMask!==void 0)this.stencilWriteMask=z.stencilWriteMask;if(z.stencilFunc!==void 0)this.stencilFunc=z.stencilFunc;if(z.stencilRef!==void 0)this.stencilRef=z.stencilRef;if(z.stencilFuncMask!==void 0)this.stencilFuncMask=z.stencilFuncMask;if(z.stencilFail!==void 0)this.stencilFail=z.stencilFail;if(z.stencilZFail!==void 0)this.stencilZFail=z.stencilZFail;if(z.stencilZPass!==void 0)this.stencilZPass=z.stencilZPass;if(z.stencilWrite!==void 0)this.stencilWrite=z.stencilWrite;if(z.wireframe!==void 0)this.wireframe=z.wireframe;if(z.wireframeLinewidth!==void 0)this.wireframeLinewidth=z.wireframeLinewidth;if(z.wireframeLinecap!==void 0)this.wireframeLinecap=z.wireframeLinecap;if(z.wireframeLinejoin!==void 0)this.wireframeLinejoin=z.wireframeLinejoin;if(z.rotation!==void 0)this.rotation=z.rotation;if(z.linewidth!==void 0)this.linewidth=z.linewidth;if(z.dashSize!==void 0)this.dashSize=z.dashSize;if(z.gapSize!==void 0)this.gapSize=z.gapSize;if(z.scale!==void 0)this.scale=z.scale;if(z.polygonOffset!==void 0)this.polygonOffset=z.polygonOffset;if(z.polygonOffsetFactor!==void 0)this.polygonOffsetFactor=z.polygonOffsetFactor;if(z.polygonOffsetUnits!==void 0)this.polygonOffsetUnits=z.polygonOffsetUnits;if(z.dithering!==void 0)this.dithering=z.dithering;if(z.alphaToCoverage!==void 0)this.alphaToCoverage=z.alphaToCoverage;if(z.premultipliedAlpha!==void 0)this.premultipliedAlpha=z.premultipliedAlpha;if(z.forceSinglePass!==void 0)this.forceSinglePass=z.forceSinglePass;if(z.allowOverride!==void 0)this.allowOverride=z.allowOverride;if(z.visible!==void 0)this.visible=z.visible;if(z.toneMapped!==void 0)this.toneMapped=z.toneMapped;if(z.userData!==void 0)this.userData=z.userData;if(z.vertexColors!==void 0)if(typeof z.vertexColors==="number")this.vertexColors=z.vertexColors>0;else this.vertexColors=z.vertexColors;if(z.size!==void 0)this.size=z.size;if(z.sizeAttenuation!==void 0)this.sizeAttenuation=z.sizeAttenuation;if(z.map!==void 0)this.map=J[z.map]||null;if(z.matcap!==void 0)this.matcap=J[z.matcap]||null;if(z.alphaMap!==void 0)this.alphaMap=J[z.alphaMap]||null;if(z.bumpMap!==void 0)this.bumpMap=J[z.bumpMap]||null;if(z.bumpScale!==void 0)this.bumpScale=z.bumpScale;if(z.normalMap!==void 0)this.normalMap=J[z.normalMap]||null;if(z.normalMapType!==void 0)this.normalMapType=z.normalMapType;if(z.normalScale!==void 0){let Q=z.normalScale;if(Array.isArray(Q)===!1)Q=[Q,Q];this.normalScale=new a().fromArray(Q)}if(z.displacementMap!==void 0)this.displacementMap=J[z.displacementMap]||null;if(z.displacementScale!==void 0)this.displacementScale=z.displacementScale;if(z.displacementBias!==void 0)this.displacementBias=z.displacementBias;if(z.roughnessMap!==void 0)this.roughnessMap=J[z.roughnessMap]||null;if(z.metalnessMap!==void 0)this.metalnessMap=J[z.metalnessMap]||null;if(z.emissiveMap!==void 0)this.emissiveMap=J[z.emissiveMap]||null;if(z.emissiveIntensity!==void 0)this.emissiveIntensity=z.emissiveIntensity;if(z.specularMap!==void 0)this.specularMap=J[z.specularMap]||null;if(z.specularIntensityMap!==void 0)this.specularIntensityMap=J[z.specularIntensityMap]||null;if(z.specularColorMap!==void 0)this.specularColorMap=J[z.specularColorMap]||null;if(z.envMap!==void 0)this.envMap=J[z.envMap]||null;if(z.envMapRotation!==void 0)this.envMapRotation.fromArray(z.envMapRotation);if(z.envMapIntensity!==void 0)this.envMapIntensity=z.envMapIntensity;if(z.reflectivity!==void 0)this.reflectivity=z.reflectivity;if(z.refractionRatio!==void 0)this.refractionRatio=z.refractionRatio;if(z.lightMap!==void 0)this.lightMap=J[z.lightMap]||null;if(z.lightMapIntensity!==void 0)this.lightMapIntensity=z.lightMapIntensity;if(z.aoMap!==void 0)this.aoMap=J[z.aoMap]||null;if(z.aoMapIntensity!==void 0)this.aoMapIntensity=z.aoMapIntensity;if(z.gradientMap!==void 0)this.gradientMap=J[z.gradientMap]||null;if(z.clearcoatMap!==void 0)this.clearcoatMap=J[z.clearcoatMap]||null;if(z.clearcoatRoughnessMap!==void 0)this.clearcoatRoughnessMap=J[z.clearcoatRoughnessMap]||null;if(z.clearcoatNormalMap!==void 0)this.clearcoatNormalMap=J[z.clearcoatNormalMap]||null;if(z.clearcoatNormalScale!==void 0)this.clearcoatNormalScale=new a().fromArray(z.clearcoatNormalScale);if(z.iridescenceMap!==void 0)this.iridescenceMap=J[z.iridescenceMap]||null;if(z.iridescenceThicknessMap!==void 0)this.iridescenceThicknessMap=J[z.iridescenceThicknessMap]||null;if(z.transmissionMap!==void 0)this.transmissionMap=J[z.transmissionMap]||null;if(z.thicknessMap!==void 0)this.thicknessMap=J[z.thicknessMap]||null;if(z.anisotropyMap!==void 0)this.anisotropyMap=J[z.anisotropyMap]||null;if(z.sheenColorMap!==void 0)this.sheenColorMap=J[z.sheenColorMap]||null;if(z.sheenRoughnessMap!==void 0)this.sheenRoughnessMap=J[z.sheenRoughnessMap]||null;return this}clone(){return new this.constructor().copy(this)}copy(z){this.name=z.name,this.blending=z.blending,this.side=z.side,this.vertexColors=z.vertexColors,this.opacity=z.opacity,this.transparent=z.transparent,this.blendSrc=z.blendSrc,this.blendDst=z.blendDst,this.blendEquation=z.blendEquation,this.blendSrcAlpha=z.blendSrcAlpha,this.blendDstAlpha=z.blendDstAlpha,this.blendEquationAlpha=z.blendEquationAlpha,this.blendColor.copy(z.blendColor),this.blendAlpha=z.blendAlpha,this.depthFunc=z.depthFunc,this.depthTest=z.depthTest,this.depthWrite=z.depthWrite,this.stencilWriteMask=z.stencilWriteMask,this.stencilFunc=z.stencilFunc,this.stencilRef=z.stencilRef,this.stencilFuncMask=z.stencilFuncMask,this.stencilFail=z.stencilFail,this.stencilZFail=z.stencilZFail,this.stencilZPass=z.stencilZPass,this.stencilWrite=z.stencilWrite;let J=z.clippingPlanes,Q=null;if(J!==null){let $=J.length;Q=Array($);for(let K=0;K!==$;++K)Q[K]=J[K].clone()}return this.clippingPlanes=Q,this.clipIntersection=z.clipIntersection,this.clipShadows=z.clipShadows,this.shadowSide=z.shadowSide,this.colorWrite=z.colorWrite,this.precision=z.precision,this.polygonOffset=z.polygonOffset,this.polygonOffsetFactor=z.polygonOffsetFactor,this.polygonOffsetUnits=z.polygonOffsetUnits,this.dithering=z.dithering,this.alphaTest=z.alphaTest,this.alphaHash=z.alphaHash,this.alphaToCoverage=z.alphaToCoverage,this.premultipliedAlpha=z.premultipliedAlpha,this.forceSinglePass=z.forceSinglePass,this.allowOverride=z.allowOverride,this.visible=z.visible,this.toneMapped=z.toneMapped,this.userData=JSON.parse(JSON.stringify(z.userData)),this}dispose(){this.dispatchEvent({type:"dispose"})}set needsUpdate(z){if(z===!0)this.version++}}class l2 extends vJ{constructor(z){super();this.isSpriteMaterial=!0,this.type="SpriteMaterial",this.color=new Fz(16777215),this.map=null,this.alphaMap=null,this.rotation=0,this.sizeAttenuation=!0,this.transparent=!0,this.fog=!0,this.setValues(z)}copy(z){return super.copy(z),this.color.copy(z.color),this.map=z.map,this.alphaMap=z.alphaMap,this.rotation=z.rotation,this.sizeAttenuation=z.sizeAttenuation,this.fog=z.fog,this}}var P0,K1=new R,v0=new R,f0=new R,T0=new a,W1=new a,y9=new pz,i1=new R,q1=new R,a1=new R,o7=new a,c5=new a,s7=new a;class P6 extends KJ{constructor(z=new l2){super();if(this.isSprite=!0,this.type="Sprite",P0===void 0){P0=new mz;let J=new Float32Array([-0.5,-0.5,0,0,0,0.5,-0.5,0,1,0,0.5,0.5,0,1,1,-0.5,0.5,0,0,1]),Q=new P1(J,5);P0.setIndex([0,1,2,0,2,3]),P0.setAttribute("position",new H0(Q,3,0,!1)),P0.setAttribute("uv",new H0(Q,2,3,!1))}this.geometry=P0,this.material=z,this.center=new a(0.5,0.5),this.count=1}raycast(z,J){if(z.camera===null)Pz('Sprite: "Raycaster.camera" needs to be set in order to raycast against sprites.');if(v0.setFromMatrixScale(this.matrixWorld),y9.copy(z.camera.matrixWorld),this.modelViewMatrix.multiplyMatrices(z.camera.matrixWorldInverse,this.matrixWorld),f0.setFromMatrixPosition(this.modelViewMatrix),z.camera.isPerspectiveCamera&&this.material.sizeAttenuation===!1)v0.multiplyScalar(-f0.z);let Q=this.material.rotation,$,K;if(Q!==0)K=Math.cos(Q),$=Math.sin(Q);let W=this.center;t1(i1.set(-0.5,-0.5,0),f0,W,v0,$,K),t1(q1.set(0.5,-0.5,0),f0,W,v0,$,K),t1(a1.set(0.5,0.5,0),f0,W,v0,$,K),o7.set(0,0),c5.set(1,0),s7.set(1,1);let q=z.ray.intersectTriangle(i1,q1,a1,!1,K1);if(q===null){if(t1(q1.set(-0.5,0.5,0),f0,W,v0,$,K),c5.set(0,1),q=z.ray.intersectTriangle(i1,a1,q1,!1,K1),q===null)return}let B=z.ray.origin.distanceTo(K1);if(B<z.near||B>z.far)return;J.push({distance:B,point:K1.clone(),uv:cJ.getInterpolation(K1,i1,q1,a1,o7,c5,s7,new a),face:null,object:this})}copy(z,J){if(super.copy(z,J),z.center!==void 0)this.center.copy(z.center);return this.material=z.material,this}}function t1(z,J,Q,$,K,W){if(T0.subVectors(z,Q).addScalar(0.5).multiply($),K!==void 0)W1.x=W*T0.x-K*T0.y,W1.y=K*T0.x+W*T0.y;else W1.copy(T0);z.copy(J),z.x+=W1.x,z.y+=W1.y,z.applyMatrix4(y9)}var r1=new R,i7=new R;class v6 extends KJ{constructor(){super();this.isLOD=!0,this._currentLevel=0,this.type="LOD",Object.defineProperties(this,{levels:{enumerable:!0,value:[]}}),this.autoUpdate=!0}copy(z){super.copy(z,!1);let J=z.levels;for(let Q=0,$=J.length;Q<$;Q++){let K=J[Q];this.addLevel(K.object.clone(),K.distance,K.hysteresis)}return this.autoUpdate=z.autoUpdate,this}addLevel(z,J=0,Q=0){J=Math.abs(J);let $=this.levels,K;for(K=0;K<$.length;K++)if(J<$[K].distance)break;return $.splice(K,0,{distance:J,hysteresis:Q,object:z}),this.add(z),this}removeLevel(z){let J=this.levels;for(let Q=0;Q<J.length;Q++)if(J[Q].distance===z){let $=J.splice(Q,1);return this.remove($[0].object),!0}return!1}getCurrentLevel(){return this._currentLevel}getObjectForDistance(z){let J=this.levels;if(J.length>0){let Q,$;for(Q=1,$=J.length;Q<$;Q++){let K=J[Q].distance;if(J[Q].object.visible)K-=K*J[Q].hysteresis;if(z<K)break}return J[Q-1].object}return null}raycast(z,J){if(this.levels.length>0){r1.setFromMatrixPosition(this.matrixWorld);let $=z.ray.origin.distanceTo(r1);this.getObjectForDistance($).raycast(z,J)}}update(z){let J=this.levels;if(J.length>1){r1.setFromMatrixPosition(z.matrixWorld),i7.setFromMatrixPosition(this.matrixWorld);let Q=r1.distanceTo(i7)/z.zoom;J[0].object.visible=!0;let $,K;for($=1,K=J.length;$<K;$++){let W=J[$].distance;if(J[$].object.visible)W-=W*J[$].hysteresis;if(Q>=W)J[$-1].object.visible=!1,J[$].object.visible=!0;else break}this._currentLevel=$-1;for(;$<K;$++)J[$].object.visible=!1}}toJSON(z){let J=super.toJSON(z);if(this.autoUpdate===!1)J.object.autoUpdate=!1;J.object.levels=[];let Q=this.levels;for(let $=0,K=Q.length;$<K;$++){let W=Q[$];J.object.levels.push({object:W.object.uuid,distance:W.distance,hysteresis:W.hysteresis})}return J}}var FQ=new R,n5=new R,e1=new R,bQ=new R,o5=new R,z2=new R,s5=new R;class Y0{constructor(z=new R,J=new R(0,0,-1)){this.origin=z,this.direction=J}set(z,J){return this.origin.copy(z),this.direction.copy(J),this}copy(z){return this.origin.copy(z.origin),this.direction.copy(z.direction),this}at(z,J){return J.copy(this.origin).addScaledVector(this.direction,z)}lookAt(z){return this.direction.copy(z).sub(this.origin).normalize(),this}recast(z){return this.origin.copy(this.at(z,FQ)),this}closestPointToPoint(z,J){J.subVectors(z,this.origin);let Q=J.dot(this.direction);if(Q<0)return J.copy(this.origin);return J.copy(this.origin).addScaledVector(this.direction,Q)}distanceToPoint(z){return Math.sqrt(this.distanceSqToPoint(z))}distanceSqToPoint(z){let J=FQ.subVectors(z,this.origin).dot(this.direction);if(J<0)return this.origin.distanceToSquared(z);return FQ.copy(this.origin).addScaledVector(this.direction,J),FQ.distanceToSquared(z)}distanceSqToSegment(z,J,Q,$){n5.copy(z).add(J).multiplyScalar(0.5),e1.copy(J).sub(z).normalize(),bQ.copy(this.origin).sub(n5);let K=z.distanceTo(J)*0.5,W=-this.direction.dot(e1),q=bQ.dot(this.direction),B=-bQ.dot(e1),G=bQ.lengthSq(),N=Math.abs(1-W*W),Z,H,D,U;if(N>0)if(Z=W*B-q,H=W*q-B,U=K*N,Z>=0)if(H>=-U)if(H<=U){let X=1/N;Z*=X,H*=X,D=Z*(Z+W*H+2*q)+H*(W*Z+H+2*B)+G}else H=K,Z=Math.max(0,-(W*H+q)),D=-Z*Z+H*(H+2*B)+G;else H=-K,Z=Math.max(0,-(W*H+q)),D=-Z*Z+H*(H+2*B)+G;else if(H<=-U)Z=Math.max(0,-(-W*K+q)),H=Z>0?-K:Math.min(Math.max(-K,-B),K),D=-Z*Z+H*(H+2*B)+G;else if(H<=U)Z=0,H=Math.min(Math.max(-K,-B),K),D=H*(H+2*B)+G;else Z=Math.max(0,-(W*K+q)),H=Z>0?K:Math.min(Math.max(-K,-B),K),D=-Z*Z+H*(H+2*B)+G;else H=W>0?-K:K,Z=Math.max(0,-(W*H+q)),D=-Z*Z+H*(H+2*B)+G;if(Q)Q.copy(this.origin).addScaledVector(this.direction,Z);if($)$.copy(n5).addScaledVector(e1,H);return D}intersectSphere(z,J){FQ.subVectors(z.center,this.origin);let Q=FQ.dot(this.direction),$=FQ.dot(FQ)-Q*Q,K=z.radius*z.radius;if($>K)return null;let W=Math.sqrt(K-$),q=Q-W,B=Q+W;if(B<0)return null;if(q<0)return this.at(B,J);return this.at(q,J)}intersectsSphere(z){if(z.radius<0)return!1;return this.distanceSqToPoint(z.center)<=z.radius*z.radius}distanceToPlane(z){let J=z.normal.dot(this.direction);if(J===0){if(z.distanceToPoint(this.origin)===0)return 0;return null}let Q=-(this.origin.dot(z.normal)+z.constant)/J;return Q>=0?Q:null}intersectPlane(z,J){let Q=this.distanceToPlane(z);if(Q===null)return null;return this.at(Q,J)}intersectsPlane(z){let J=z.distanceToPoint(this.origin);if(J===0)return!0;if(z.normal.dot(this.direction)*J<0)return!0;return!1}intersectBox(z,J){let Q,$,K,W,q,B,G=1/this.direction.x,N=1/this.direction.y,Z=1/this.direction.z,H=this.origin;if(G>=0)Q=(z.min.x-H.x)*G,$=(z.max.x-H.x)*G;else Q=(z.max.x-H.x)*G,$=(z.min.x-H.x)*G;if(N>=0)K=(z.min.y-H.y)*N,W=(z.max.y-H.y)*N;else K=(z.max.y-H.y)*N,W=(z.min.y-H.y)*N;if(Q>W||K>$)return null;if(K>Q||isNaN(Q))Q=K;if(W<$||isNaN($))$=W;if(Z>=0)q=(z.min.z-H.z)*Z,B=(z.max.z-H.z)*Z;else q=(z.max.z-H.z)*Z,B=(z.min.z-H.z)*Z;if(Q>B||q>$)return null;if(q>Q||Q!==Q)Q=q;if(B<$||$!==$)$=B;if($<0)return null;return this.at(Q>=0?Q:$,J)}intersectsBox(z){return this.intersectBox(z,FQ)!==null}intersectTriangle(z,J,Q,$,K){o5.subVectors(J,z),z2.subVectors(Q,z),s5.crossVectors(o5,z2);let W=this.direction.dot(s5),q;if(W>0){if($)return null;q=1}else if(W<0)q=-1,W=-W;else return null;bQ.subVectors(this.origin,z);let B=q*this.direction.dot(z2.crossVectors(bQ,z2));if(B<0)return null;let G=q*this.direction.dot(o5.cross(bQ));if(G<0)return null;if(B+G>W)return null;let N=-q*bQ.dot(s5);if(N<0)return null;return this.at(N/W,K)}applyMatrix4(z){return this.origin.applyMatrix4(z),this.direction.transformDirection(z),this}equals(z){return z.origin.equals(this.origin)&&z.direction.equals(this.direction)}clone(){return new this.constructor().copy(this)}}class RQ extends vJ{constructor(z){super();this.isMeshBasicMaterial=!0,this.type="MeshBasicMaterial",this.color=new Fz(16777215),this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.specularMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new NQ,this.combine=0,this.reflectivity=1,this.refractionRatio=0.98,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.fog=!0,this.setValues(z)}copy(z){return super.copy(z),this.color.copy(z.color),this.map=z.map,this.lightMap=z.lightMap,this.lightMapIntensity=z.lightMapIntensity,this.aoMap=z.aoMap,this.aoMapIntensity=z.aoMapIntensity,this.specularMap=z.specularMap,this.alphaMap=z.alphaMap,this.envMap=z.envMap,this.envMapRotation.copy(z.envMapRotation),this.combine=z.combine,this.reflectivity=z.reflectivity,this.refractionRatio=z.refractionRatio,this.wireframe=z.wireframe,this.wireframeLinewidth=z.wireframeLinewidth,this.wireframeLinecap=z.wireframeLinecap,this.wireframeLinejoin=z.wireframeLinejoin,this.fog=z.fog,this}}var a7=new pz,rQ=new Y0,J2=new PJ,t7=new R,Q2=new R,$2=new R,K2=new R,i5=new R,W2=new R,r7=new R,q2=new R;class LJ extends KJ{constructor(z=new mz,J=new RQ){super();this.isMesh=!0,this.type="Mesh",this.geometry=z,this.material=J,this.morphTargetDictionary=void 0,this.morphTargetInfluences=void 0,this.count=1,this.updateMorphTargets()}copy(z,J){if(super.copy(z,J),z.morphTargetInfluences!==void 0)this.morphTargetInfluences=z.morphTargetInfluences.slice();if(z.morphTargetDictionary!==void 0)this.morphTargetDictionary=Object.assign({},z.morphTargetDictionary);return this.material=Array.isArray(z.material)?z.material.slice():z.material,this.geometry=z.geometry,this}updateMorphTargets(){let J=this.geometry.morphAttributes,Q=Object.keys(J);if(Q.length>0){let $=J[Q[0]];if($!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let K=0,W=$.length;K<W;K++){let q=$[K].name||String(K);this.morphTargetInfluences.push(0),this.morphTargetDictionary[q]=K}}}}getVertexPosition(z,J){let Q=this.geometry,$=Q.attributes.position,K=Q.morphAttributes.position,W=Q.morphTargetsRelative;J.fromBufferAttribute($,z);let q=this.morphTargetInfluences;if(K&&q){W2.set(0,0,0);for(let B=0,G=K.length;B<G;B++){let N=q[B],Z=K[B];if(N===0)continue;if(i5.fromBufferAttribute(Z,z),W)W2.addScaledVector(i5,N);else W2.addScaledVector(i5.sub(J),N)}J.add(W2)}return J}raycast(z,J){let Q=this.geometry,$=this.material,K=this.matrixWorld;if($===void 0)return;if(Q.boundingSphere===null)Q.computeBoundingSphere();if(J2.copy(Q.boundingSphere),J2.applyMatrix4(K),rQ.copy(z.ray).recast(z.near),J2.containsPoint(rQ.origin)===!1){if(rQ.intersectSphere(J2,t7)===null)return;if(rQ.origin.distanceToSquared(t7)>(z.far-z.near)**2)return}if(a7.copy(K).invert(),rQ.copy(z.ray).applyMatrix4(a7),Q.boundingBox!==null){if(rQ.intersectsBox(Q.boundingBox)===!1)return}this._computeIntersections(z,J,rQ)}_computeIntersections(z,J,Q){let $,K=this.geometry,W=this.material,q=K.index,B=K.attributes.position,G=K.attributes.uv,N=K.attributes.uv1,Z=K.attributes.normal,H=K.groups,D=K.drawRange;if(q!==null)if(Array.isArray(W))for(let U=0,X=H.length;U<X;U++){let k=H[U],Y=W[k.materialIndex],V=Math.max(k.start,D.start),L=Math.min(q.count,Math.min(k.start+k.count,D.start+D.count));for(let O=V,I=L;O<I;O+=3){let S=q.getX(O),w=q.getX(O+1),C=q.getX(O+2);if($=B2(this,Y,z,Q,G,N,Z,S,w,C),$)$.faceIndex=Math.floor(O/3),$.face.materialIndex=k.materialIndex,J.push($)}}else{let U=Math.max(0,D.start),X=Math.min(q.count,D.start+D.count);for(let k=U,Y=X;k<Y;k+=3){let V=q.getX(k),L=q.getX(k+1),O=q.getX(k+2);if($=B2(this,W,z,Q,G,N,Z,V,L,O),$)$.faceIndex=Math.floor(k/3),J.push($)}}else if(B!==void 0)if(Array.isArray(W))for(let U=0,X=H.length;U<X;U++){let k=H[U],Y=W[k.materialIndex],V=Math.max(k.start,D.start),L=Math.min(B.count,Math.min(k.start+k.count,D.start+D.count));for(let O=V,I=L;O<I;O+=3){let S=O,w=O+1,C=O+2;if($=B2(this,Y,z,Q,G,N,Z,S,w,C),$)$.faceIndex=Math.floor(O/3),$.face.materialIndex=k.materialIndex,J.push($)}}else{let U=Math.max(0,D.start),X=Math.min(B.count,D.start+D.count);for(let k=U,Y=X;k<Y;k+=3){let V=k,L=k+1,O=k+2;if($=B2(this,W,z,Q,G,N,Z,V,L,O),$)$.faceIndex=Math.floor(k/3),J.push($)}}}}function oK(z,J,Q,$,K,W,q,B){let G;if(J.side===1)G=$.intersectTriangle(q,W,K,!0,B);else G=$.intersectTriangle(K,W,q,J.side===0,B);if(G===null)return null;q2.copy(B),q2.applyMatrix4(z.matrixWorld);let N=Q.ray.origin.distanceTo(q2);if(N<Q.near||N>Q.far)return null;return{distance:N,point:q2.clone(),object:z}}function B2(z,J,Q,$,K,W,q,B,G,N){z.getVertexPosition(B,Q2),z.getVertexPosition(G,$2),z.getVertexPosition(N,K2);let Z=oK(z,J,Q,$,Q2,$2,K2,r7);if(Z){let H=new R;if(cJ.getBarycoord(r7,Q2,$2,K2,H),K)Z.uv=cJ.getInterpolatedAttribute(K,B,G,N,H,new a);if(W)Z.uv1=cJ.getInterpolatedAttribute(W,B,G,N,H,new a);if(q){if(Z.normal=cJ.getInterpolatedAttribute(q,B,G,N,H,new R),Z.normal.dot($.direction)>0)Z.normal.multiplyScalar(-1)}let D={a:B,b:G,c:N,normal:new R,materialIndex:0};cJ.getNormal(Q2,$2,K2,D.normal),Z.face=D,Z.barycoord=H}return Z}var B1=new BJ,e7=new BJ,z8=new BJ,sK=new BJ,J8=new pz,G2=new R,a5=new PJ,Q8=new pz,t5=new Y0;class f6 extends LJ{constructor(z,J){super(z,J);this.isSkinnedMesh=!0,this.type="SkinnedMesh",this.bindMode="attached",this.bindMatrix=new pz,this.bindMatrixInverse=new pz,this.boundingBox=null,this.boundingSphere=null}computeBoundingBox(){let z=this.geometry;if(this.boundingBox===null)this.boundingBox=new fJ;this.boundingBox.makeEmpty();let J=z.getAttribute("position");for(let Q=0;Q<J.count;Q++)this.getVertexPosition(Q,G2),this.boundingBox.expandByPoint(G2)}computeBoundingSphere(){let z=this.geometry;if(this.boundingSphere===null)this.boundingSphere=new PJ;this.boundingSphere.makeEmpty();let J=z.getAttribute("position");for(let Q=0;Q<J.count;Q++)this.getVertexPosition(Q,G2),this.boundingSphere.expandByPoint(G2)}copy(z,J){if(super.copy(z,J),this.bindMode=z.bindMode,this.bindMatrix.copy(z.bindMatrix),this.bindMatrixInverse.copy(z.bindMatrixInverse),this.skeleton=z.skeleton,z.boundingBox!==null)this.boundingBox=z.boundingBox.clone();if(z.boundingSphere!==null)this.boundingSphere=z.boundingSphere.clone();return this}raycast(z,J){let Q=this.material,$=this.matrixWorld;if(Q===void 0)return;if(this.boundingSphere===null)this.computeBoundingSphere();if(a5.copy(this.boundingSphere),a5.applyMatrix4($),z.ray.intersectsSphere(a5)===!1)return;if(Q8.copy($).invert(),t5.copy(z.ray).applyMatrix4(Q8),this.boundingBox!==null){if(t5.intersectsBox(this.boundingBox)===!1)return}this._computeIntersections(z,J,t5)}getVertexPosition(z,J){return super.getVertexPosition(z,J),this.applyBoneTransform(z,J),J}bind(z,J){if(this.skeleton=z,J===void 0)this.updateMatrixWorld(!0),this.skeleton.calculateInverses(),J=this.matrixWorld;this.bindMatrix.copy(J),this.bindMatrixInverse.copy(J).invert()}pose(){this.skeleton.pose()}normalizeSkinWeights(){let z=new BJ,J=this.geometry.attributes.skinWeight;for(let Q=0,$=J.count;Q<$;Q++){z.fromBufferAttribute(J,Q);let K=1/z.manhattanLength();if(K!==1/0)z.multiplyScalar(K);else z.set(1,0,0,0);J.setXYZW(Q,z.x,z.y,z.z,z.w)}}updateMatrixWorld(z){if(super.updateMatrixWorld(z),this.bindMode==="attached")this.bindMatrixInverse.copy(this.matrixWorld).invert();else if(this.bindMode==="detached")this.bindMatrixInverse.copy(this.bindMatrix).invert();else Bz("SkinnedMesh: Unrecognized bindMode: "+this.bindMode)}applyBoneTransform(z,J){let Q=this.skeleton,$=this.geometry;if(e7.fromBufferAttribute($.attributes.skinIndex,z),z8.fromBufferAttribute($.attributes.skinWeight,z),J.isVector4)B1.copy(J),J.set(0,0,0,0);else B1.set(...J,1),J.set(0,0,0);B1.applyMatrix4(this.bindMatrix);for(let K=0;K<4;K++){let W=z8.getComponent(K);if(W!==0){let q=e7.getComponent(K);J8.multiplyMatrices(Q.bones[q].matrixWorld,Q.boneInverses[q]),J.addScaledVector(sK.copy(B1).applyMatrix4(J8),W)}}if(J.isVector4)J.w=B1.w;return J.applyMatrix4(this.bindMatrixInverse)}}class m2 extends KJ{constructor(){super();this.isBone=!0,this.type="Bone"}}class tJ extends kJ{constructor(z=null,J=1,Q=1,$,K,W,q,B,G=1003,N=1003,Z,H){super(null,W,q,B,G,N,$,K,Z,H);this.isDataTexture=!0,this.image={data:z,width:J,height:Q},this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}}var $8=new pz,iK=new pz;class c2{constructor(z=[],J=[]){this.uuid=aJ(),this.bones=z.slice(0),this.boneInverses=J,this.boneMatrices=null,this.boneTexture=null,this.init()}init(){let z=this.bones,J=this.boneInverses;if(this.boneMatrices=new Float32Array(z.length*16),J.length===0)this.calculateInverses();else if(z.length!==J.length){Bz("Skeleton: Number of inverse bone matrices does not match amount of bones."),this.boneInverses=[];for(let Q=0,$=this.bones.length;Q<$;Q++)this.boneInverses.push(new pz)}}calculateInverses(){this.boneInverses.length=0;for(let z=0,J=this.bones.length;z<J;z++){let Q=new pz;if(this.bones[z])Q.copy(this.bones[z].matrixWorld).invert();this.boneInverses.push(Q)}}pose(){for(let z=0,J=this.bones.length;z<J;z++){let Q=this.bones[z];if(Q)Q.matrixWorld.copy(this.boneInverses[z]).invert()}for(let z=0,J=this.bones.length;z<J;z++){let Q=this.bones[z];if(Q){if(Q.parent&&Q.parent.isBone)Q.matrix.copy(Q.parent.matrixWorld).invert(),Q.matrix.multiply(Q.matrixWorld);else Q.matrix.copy(Q.matrixWorld);Q.matrix.decompose(Q.position,Q.quaternion,Q.scale)}}}update(){let z=this.bones,J=this.boneInverses,Q=this.boneMatrices,$=this.boneTexture;for(let K=0,W=z.length;K<W;K++){let q=z[K]?z[K].matrixWorld:iK;$8.multiplyMatrices(q,J[K]),$8.toArray(Q,K*16)}if($!==null)$.needsUpdate=!0}clone(){return new c2(this.bones,this.boneInverses)}computeBoneTexture(){let z=Math.sqrt(this.bones.length*4);z=Math.ceil(z/4)*4,z=Math.max(z,4);let J=new Float32Array(z*z*4);J.set(this.boneMatrices);let Q=new tJ(J,z,z,1023,1015);return Q.needsUpdate=!0,this.boneMatrices=J,this.boneTexture=Q,this}getBoneByName(z){for(let J=0,Q=this.bones.length;J<Q;J++){let $=this.bones[J];if($.name===z)return $}return}dispose(){if(this.boneTexture!==null)this.boneTexture.dispose(),this.boneTexture=null}fromJSON(z,J){this.uuid=z.uuid;for(let Q=0,$=z.bones.length;Q<$;Q++){let K=z.bones[Q],W=J[K];if(W===void 0)Bz("Skeleton: No bone found with UUID:",K),W=new m2;this.bones.push(W),this.boneInverses.push(new pz().fromArray(z.boneInverses[Q]))}return this.init(),this}toJSON(){let z={metadata:{version:4.7,type:"Skeleton",generator:"Skeleton.toJSON"},bones:[],boneInverses:[]};z.uuid=this.uuid;let J=this.bones,Q=this.boneInverses;for(let $=0,K=J.length;$<K;$++){let W=J[$];z.bones.push(W.uuid);let q=Q[$];z.boneInverses.push(q.toArray())}return z}}class U0 extends GJ{constructor(z,J,Q,$=1){super(z,J,Q);this.isInstancedBufferAttribute=!0,this.meshPerAttribute=$}copy(z){return super.copy(z),this.meshPerAttribute=z.meshPerAttribute,this}toJSON(){let z=super.toJSON();return z.meshPerAttribute=this.meshPerAttribute,z.isInstancedBufferAttribute=!0,z}}var h0=new pz,K8=new pz,N2=[],W8=new fJ,aK=new pz,G1=new LJ,N1=new PJ;class T6 extends LJ{constructor(z,J,Q){super(z,J);this.isInstancedMesh=!0,this.instanceMatrix=new U0(new Float32Array(Q*16),16),this.instanceColor=null,this.morphTexture=null,this.count=Q,this.boundingBox=null,this.boundingSphere=null;for(let $=0;$<Q;$++)this.setMatrixAt($,aK)}computeBoundingBox(){let z=this.geometry,J=this.count;if(this.boundingBox===null)this.boundingBox=new fJ;if(z.boundingBox===null)z.computeBoundingBox();this.boundingBox.makeEmpty();for(let Q=0;Q<J;Q++)this.getMatrixAt(Q,h0),W8.copy(z.boundingBox).applyMatrix4(h0),this.boundingBox.union(W8)}computeBoundingSphere(){let z=this.geometry,J=this.count;if(this.boundingSphere===null)this.boundingSphere=new PJ;if(z.boundingSphere===null)z.computeBoundingSphere();this.boundingSphere.makeEmpty();for(let Q=0;Q<J;Q++)this.getMatrixAt(Q,h0),N1.copy(z.boundingSphere).applyMatrix4(h0),this.boundingSphere.union(N1)}copy(z,J){if(super.copy(z,J),this.instanceMatrix.copy(z.instanceMatrix),z.morphTexture!==null)this.morphTexture=z.morphTexture.clone();if(z.instanceColor!==null)this.instanceColor=z.instanceColor.clone();if(this.count=z.count,z.boundingBox!==null)this.boundingBox=z.boundingBox.clone();if(z.boundingSphere!==null)this.boundingSphere=z.boundingSphere.clone();return this}getColorAt(z,J){if(this.instanceColor===null)return J.setRGB(1,1,1);else return J.fromArray(this.instanceColor.array,z*3)}getMatrixAt(z,J){return J.fromArray(this.instanceMatrix.array,z*16)}getMorphAt(z,J){let Q=J.morphTargetInfluences,$=this.morphTexture.source.data.data,K=Q.length+1,W=z*K+1;for(let q=0;q<Q.length;q++)Q[q]=$[W+q]}raycast(z,J){let Q=this.matrixWorld,$=this.count;if(G1.geometry=this.geometry,G1.material=this.material,G1.material===void 0)return;if(this.boundingSphere===null)this.computeBoundingSphere();if(N1.copy(this.boundingSphere),N1.applyMatrix4(Q),z.ray.intersectsSphere(N1)===!1)return;for(let K=0;K<$;K++){this.getMatrixAt(K,h0),K8.multiplyMatrices(Q,h0),G1.matrixWorld=K8,G1.raycast(z,N2);for(let W=0,q=N2.length;W<q;W++){let B=N2[W];B.instanceId=K,B.object=this,J.push(B)}N2.length=0}}setColorAt(z,J){if(this.instanceColor===null)this.instanceColor=new U0(new Float32Array(this.instanceMatrix.count*3).fill(1),3);return J.toArray(this.instanceColor.array,z*3),this}setMatrixAt(z,J){return J.toArray(this.instanceMatrix.array,z*16),this}setMorphAt(z,J){let Q=J.morphTargetInfluences,$=Q.length+1;if(this.morphTexture===null)this.morphTexture=new tJ(new Float32Array($*this.count),$,this.count,1028,1015);let K=this.morphTexture.source.data.data,W=0;for(let G=0;G<Q.length;G++)W+=Q[G];let q=this.geometry.morphTargetsRelative?1:1-W,B=$*z;return K[B]=q,K.set(Q,B+1),this}updateMorphTargets(){}dispose(){if(this.dispatchEvent({type:"dispose"}),this.morphTexture!==null)this.morphTexture.dispose(),this.morphTexture=null}}var r5=new R,tK=new R,rK=new lz;class LQ{constructor(z=new R(1,0,0),J=0){this.isPlane=!0,this.normal=z,this.constant=J}set(z,J){return this.normal.copy(z),this.constant=J,this}setComponents(z,J,Q,$){return this.normal.set(z,J,Q),this.constant=$,this}setFromNormalAndCoplanarPoint(z,J){return this.normal.copy(z),this.constant=-J.dot(this.normal),this}setFromCoplanarPoints(z,J,Q){let $=r5.subVectors(Q,J).cross(tK.subVectors(z,J)).normalize();return this.setFromNormalAndCoplanarPoint($,z),this}copy(z){return this.normal.copy(z.normal),this.constant=z.constant,this}normalize(){let z=1/this.normal.length();return this.normal.multiplyScalar(z),this.constant*=z,this}negate(){return this.constant*=-1,this.normal.negate(),this}distanceToPoint(z){return this.normal.dot(z)+this.constant}distanceToSphere(z){return this.distanceToPoint(z.center)-z.radius}projectPoint(z,J){return J.copy(z).addScaledVector(this.normal,-this.distanceToPoint(z))}intersectLine(z,J,Q=!0){let $=z.delta(r5),K=this.normal.dot($);if(K===0){if(this.distanceToPoint(z.start)===0)return J.copy(z.start);return null}let W=-(z.start.dot(this.normal)+this.constant)/K;if(Q===!0&&(W<0||W>1))return null;return J.copy(z.start).addScaledVector($,W)}intersectsLine(z){let J=this.distanceToPoint(z.start),Q=this.distanceToPoint(z.end);return J<0&&Q>0||Q<0&&J>0}intersectsBox(z){return z.intersectsPlane(this)}intersectsSphere(z){return z.intersectsPlane(this)}coplanarPoint(z){return z.copy(this.normal).multiplyScalar(-this.constant)}applyMatrix4(z,J){let Q=J||rK.getNormalMatrix(z),$=this.coplanarPoint(r5).applyMatrix4(z),K=this.normal.applyMatrix3(Q).normalize();return this.constant=-$.dot(K),this}translate(z){return this.constant-=z.dot(this.normal),this}equals(z){return z.normal.equals(this.normal)&&z.constant===this.constant}clone(){return new this.constructor().copy(this)}}var eQ=new PJ,eK=new a(0.5,0.5),D2=new R;class mQ{constructor(z=new LQ,J=new LQ,Q=new LQ,$=new LQ,K=new LQ,W=new LQ){this.planes=[z,J,Q,$,K,W]}set(z,J,Q,$,K,W){let q=this.planes;return q[0].copy(z),q[1].copy(J),q[2].copy(Q),q[3].copy($),q[4].copy(K),q[5].copy(W),this}copy(z){let J=this.planes;for(let Q=0;Q<6;Q++)J[Q].copy(z.planes[Q]);return this}setFromProjectionMatrix(z,J=2000,Q=!1){let $=this.planes,K=z.elements,W=K[0],q=K[1],B=K[2],G=K[3],N=K[4],Z=K[5],H=K[6],D=K[7],U=K[8],X=K[9],k=K[10],Y=K[11],V=K[12],L=K[13],O=K[14],I=K[15];if($[0].setComponents(G-W,D-N,Y-U,I-V).normalize(),$[1].setComponents(G+W,D+N,Y+U,I+V).normalize(),$[2].setComponents(G+q,D+Z,Y+X,I+L).normalize(),$[3].setComponents(G-q,D-Z,Y-X,I-L).normalize(),Q)$[4].setComponents(B,H,k,O).normalize(),$[5].setComponents(G-B,D-H,Y-k,I-O).normalize();else if($[4].setComponents(G-B,D-H,Y-k,I-O).normalize(),J===2000)$[5].setComponents(G+B,D+H,Y+k,I+O).normalize();else if(J===2001)$[5].setComponents(B,H,k,O).normalize();else throw Error("THREE.Frustum.setFromProjectionMatrix(): Invalid coordinate system: "+J);return this}intersectsObject(z){if(z.boundingSphere!==void 0){if(z.boundingSphere===null)z.computeBoundingSphere();eQ.copy(z.boundingSphere).applyMatrix4(z.matrixWorld)}else{let J=z.geometry;if(J.boundingSphere===null)J.computeBoundingSphere();eQ.copy(J.boundingSphere).applyMatrix4(z.matrixWorld)}return this.intersectsSphere(eQ)}intersectsSprite(z){eQ.center.set(0,0,0);let J=eK.distanceTo(z.center);return eQ.radius=0.7071067811865476+J,eQ.applyMatrix4(z.matrixWorld),this.intersectsSphere(eQ)}intersectsSphere(z){let J=this.planes,Q=z.center,$=-z.radius;for(let K=0;K<6;K++)if(J[K].distanceToPoint(Q)<$)return!1;return!0}intersectsBox(z){let J=this.planes;for(let Q=0;Q<6;Q++){let $=J[Q];if(D2.x=$.normal.x>0?z.max.x:z.min.x,D2.y=$.normal.y>0?z.max.y:z.min.y,D2.z=$.normal.z>0?z.max.z:z.min.z,$.distanceToPoint(D2)<0)return!1}return!0}containsPoint(z){let J=this.planes;for(let Q=0;Q<6;Q++)if(J[Q].distanceToPoint(z)<0)return!1;return!0}clone(){return new this.constructor().copy(this)}}var q8=new pz;class n2{constructor(){this.coordinateSystem=2000,this._frustums=[],this._count=0}setFromArrayCamera(z){let J=z.cameras,Q=this._frustums;for(let $=0;$<J.length;$++){let K=J[$];if(q8.multiplyMatrices(K.projectionMatrix,K.matrixWorldInverse),Q[$]===void 0)Q[$]=new mQ;Q[$].setFromProjectionMatrix(q8,K.coordinateSystem,K.reversedDepth)}return this._count=J.length,this}intersectsObject(z){let J=this._frustums;for(let Q=0;Q<this._count;Q++)if(J[Q].intersectsObject(z))return!0;return!1}intersectsSprite(z){let J=this._frustums;for(let Q=0;Q<this._count;Q++)if(J[Q].intersectsSprite(z))return!0;return!1}intersectsSphere(z){let J=this._frustums;for(let Q=0;Q<this._count;Q++)if(J[Q].intersectsSphere(z))return!0;return!1}intersectsBox(z){let J=this._frustums;for(let Q=0;Q<this._count;Q++)if(J[Q].intersectsBox(z))return!0;return!1}containsPoint(z){let J=this._frustums;for(let Q=0;Q<this._count;Q++)if(J[Q].containsPoint(z))return!0;return!1}copy(z){this.coordinateSystem=z.coordinateSystem;let J=this._frustums,Q=z._frustums;for(let $=0;$<z._count;$++){if(J[$]===void 0)J[$]=new mQ;J[$].copy(Q[$])}return this._count=z._count,this}clone(){return new n2().copy(this)}}function e5(z,J){return z-J}function zW(z,J){return z.z-J.z}function JW(z,J){return J.z-z.z}class S9{constructor(){this.index=0,this.pool=[],this.list=[]}push(z,J,Q,$){let K=this.pool,W=this.list;if(this.index>=K.length)K.push({start:-1,count:-1,z:-1,index:-1});let q=K[this.index];W.push(q),this.index++,q.start=z,q.count=J,q.z=Q,q.index=$}reset(){this.list.length=0,this.index=0}}var lJ=new pz,QW=new Fz(1,1,1),$W=new mQ,KW=new n2,Z2=new fJ,z0=new PJ,D1=new R,B8=new R,WW=new R,z6=new S9,jJ=new LJ,H2=[];function qW(z,J,Q=0){let $=J.itemSize;if(z.isInterleavedBufferAttribute||z.array.constructor!==J.array.constructor){let K=z.count;for(let W=0;W<K;W++)for(let q=0;q<$;q++)J.setComponent(W+Q,q,z.getComponent(W,q))}else J.array.set(z.array,Q*$);J.needsUpdate=!0}function J0(z,J){if(z.constructor!==J.constructor){let Q=Math.min(z.length,J.length);for(let $=0;$<Q;$++)J[$]=z[$]}else{let Q=Math.min(z.length,J.length);J.set(new z.constructor(z.buffer,0,Q))}}class h6 extends LJ{constructor(z,J,Q=J*2,$){super(new mz,$);this.isBatchedMesh=!0,this.perObjectFrustumCulled=!0,this.sortObjects=!0,this.boundingBox=null,this.boundingSphere=null,this.customSort=null,this._instanceInfo=[],this._geometryInfo=[],this._availableInstanceIds=[],this._availableGeometryIds=[],this._nextIndexStart=0,this._nextVertexStart=0,this._geometryCount=0,this._visibilityChanged=!0,this._geometryInitialized=!1,this._maxInstanceCount=z,this._maxVertexCount=J,this._maxIndexCount=Q,this._multiDrawCounts=new Int32Array(z),this._multiDrawStarts=new Int32Array(z),this._multiDrawCount=0,this._matricesTexture=null,this._indirectTexture=null,this._colorsTexture=null,this._initMatricesTexture(),this._initIndirectTexture()}get maxInstanceCount(){return this._maxInstanceCount}get instanceCount(){return this._instanceInfo.length-this._availableInstanceIds.length}get unusedVertexCount(){return this._maxVertexCount-this._nextVertexStart}get unusedIndexCount(){return this._maxIndexCount-this._nextIndexStart}_initMatricesTexture(){let z=Math.sqrt(this._maxInstanceCount*4);z=Math.ceil(z/4)*4,z=Math.max(z,4);let J=new Float32Array(z*z*4),Q=new tJ(J,z,z,1023,1015);this._matricesTexture=Q}_initIndirectTexture(){let z=Math.sqrt(this._maxInstanceCount);z=Math.ceil(z);let J=new Uint32Array(z*z),Q=new tJ(J,z,z,1029,1014);this._indirectTexture=Q}_initColorsTexture(){let z=Math.sqrt(this._maxInstanceCount);z=Math.ceil(z);let J=new Float32Array(z*z*4).fill(1),Q=new tJ(J,z,z,1023,1015);Q.colorSpace=zJ.workingColorSpace,this._colorsTexture=Q}_initializeGeometry(z){let J=this.geometry,Q=this._maxVertexCount,$=this._maxIndexCount;if(this._geometryInitialized===!1){for(let K in z.attributes){let W=z.getAttribute(K),{array:q,itemSize:B,normalized:G}=W,N=new q.constructor(Q*B),Z=new GJ(N,B,G);J.setAttribute(K,Z)}if(z.getIndex()!==null){let K=Q>65535?new Uint32Array($):new Uint16Array($);J.setIndex(new GJ(K,1))}this._geometryInitialized=!0}}_validateGeometry(z){let J=this.geometry;if(Boolean(z.getIndex())!==Boolean(J.getIndex()))throw Error('THREE.BatchedMesh: All geometries must consistently have "index".');for(let Q in J.attributes){if(!z.hasAttribute(Q))throw Error(`THREE.BatchedMesh: Added geometry missing "${Q}". All geometries must have consistent attributes.`);let $=z.getAttribute(Q),K=J.getAttribute(Q);if($.itemSize!==K.itemSize||$.normalized!==K.normalized)throw Error("THREE.BatchedMesh: All attributes must have a consistent itemSize and normalized value.")}}validateInstanceId(z){let J=this._instanceInfo;if(z<0||z>=J.length||J[z].active===!1)throw Error(`THREE.BatchedMesh: Invalid instanceId ${z}. Instance is either out of range or has been deleted.`)}validateGeometryId(z){let J=this._geometryInfo;if(z<0||z>=J.length||J[z].active===!1)throw Error(`THREE.BatchedMesh: Invalid geometryId ${z}. Geometry is either out of range or has been deleted.`)}setCustomSort(z){return this.customSort=z,this}computeBoundingBox(){if(this.boundingBox===null)this.boundingBox=new fJ;let z=this.boundingBox,J=this._instanceInfo;z.makeEmpty();for(let Q=0,$=J.length;Q<$;Q++){if(J[Q].active===!1)continue;let K=J[Q].geometryIndex;this.getMatrixAt(Q,lJ),this.getBoundingBoxAt(K,Z2).applyMatrix4(lJ),z.union(Z2)}}computeBoundingSphere(){if(this.boundingSphere===null)this.boundingSphere=new PJ;let z=this.boundingSphere,J=this._instanceInfo;z.makeEmpty();for(let Q=0,$=J.length;Q<$;Q++){if(J[Q].active===!1)continue;let K=J[Q].geometryIndex;this.getMatrixAt(Q,lJ),this.getBoundingSphereAt(K,z0).applyMatrix4(lJ),z.union(z0)}}addInstance(z){if(this._instanceInfo.length>=this.maxInstanceCount&&this._availableInstanceIds.length===0)throw Error("THREE.BatchedMesh: Maximum item count reached.");let Q={visible:!0,active:!0,geometryIndex:z},$=null;if(this._availableInstanceIds.length>0)this._availableInstanceIds.sort(e5),$=this._availableInstanceIds.shift(),this._instanceInfo[$]=Q;else $=this._instanceInfo.length,this._instanceInfo.push(Q);let K=this._matricesTexture;lJ.identity().toArray(K.image.data,$*16),K.needsUpdate=!0;let W=this._colorsTexture;if(W)QW.toArray(W.image.data,$*4),W.needsUpdate=!0;return this._visibilityChanged=!0,$}addGeometry(z,J=-1,Q=-1){this._initializeGeometry(z),this._validateGeometry(z);let $={vertexStart:-1,vertexCount:-1,reservedVertexCount:-1,indexStart:-1,indexCount:-1,reservedIndexCount:-1,start:-1,count:-1,boundingBox:null,boundingSphere:null,active:!0},K=this._geometryInfo;$.vertexStart=this._nextVertexStart,$.reservedVertexCount=J===-1?z.getAttribute("position").count:J;let W=z.getIndex();if(W!==null)$.indexStart=this._nextIndexStart,$.reservedIndexCount=Q===-1?W.count:Q;if($.indexStart!==-1&&$.indexStart+$.reservedIndexCount>this._maxIndexCount||$.vertexStart+$.reservedVertexCount>this._maxVertexCount)throw Error("THREE.BatchedMesh: Reserved space request exceeds the maximum buffer size.");let B;if(this._availableGeometryIds.length>0)this._availableGeometryIds.sort(e5),B=this._availableGeometryIds.shift(),K[B]=$;else B=this._geometryCount,this._geometryCount++,K.push($);return this.setGeometryAt(B,z),this._nextIndexStart=$.indexStart+$.reservedIndexCount,this._nextVertexStart=$.vertexStart+$.reservedVertexCount,B}setGeometryAt(z,J){if(z>=this._geometryCount)throw Error("THREE.BatchedMesh: Maximum geometry count reached.");this._validateGeometry(J);let Q=this.geometry,$=Q.getIndex()!==null,K=Q.getIndex(),W=J.getIndex(),q=this._geometryInfo[z];if($&&W.count>q.reservedIndexCount||J.attributes.position.count>q.reservedVertexCount)throw Error("THREE.BatchedMesh: Reserved space not large enough for provided geometry.");let{vertexStart:B,reservedVertexCount:G}=q;q.vertexCount=J.getAttribute("position").count;for(let N in Q.attributes){let Z=J.getAttribute(N),H=Q.getAttribute(N);qW(Z,H,B);let D=Z.itemSize;for(let U=Z.count,X=G;U<X;U++){let k=B+U;for(let Y=0;Y<D;Y++)H.setComponent(k,Y,0)}H.needsUpdate=!0,H.addUpdateRange(B*D,G*D)}if($){let{indexStart:N,reservedIndexCount:Z}=q;q.indexCount=J.getIndex().count;for(let H=0;H<W.count;H++)K.setX(N+H,B+W.getX(H));for(let H=W.count,D=Z;H<D;H++)K.setX(N+H,B);K.needsUpdate=!0,K.addUpdateRange(N,q.reservedIndexCount)}if(q.start=$?q.indexStart:q.vertexStart,q.count=$?q.indexCount:q.vertexCount,q.boundingBox=null,J.boundingBox!==null)q.boundingBox=J.boundingBox.clone();if(q.boundingSphere=null,J.boundingSphere!==null)q.boundingSphere=J.boundingSphere.clone();return this._visibilityChanged=!0,z}deleteGeometry(z){let J=this._geometryInfo;if(z>=J.length||J[z].active===!1)return this;let Q=this._instanceInfo;for(let $=0,K=Q.length;$<K;$++)if(Q[$].active&&Q[$].geometryIndex===z)this.deleteInstance($);return J[z].active=!1,this._availableGeometryIds.push(z),this._visibilityChanged=!0,this}deleteInstance(z){return this.validateInstanceId(z),this._instanceInfo[z].active=!1,this._availableInstanceIds.push(z),this._visibilityChanged=!0,this}optimize(){let z=0,J=0,Q=this._geometryInfo,$=Q.map((W,q)=>q).sort((W,q)=>{return Q[W].vertexStart-Q[q].vertexStart}),K=this.geometry;for(let W=0,q=Q.length;W<q;W++){let B=$[W],G=Q[B];if(G.active===!1)continue;if(K.index!==null){if(G.indexStart!==J){let{indexStart:N,vertexStart:Z,reservedIndexCount:H}=G,D=K.index,U=D.array,X=z-Z;for(let k=N;k<N+H;k++)U[k]=U[k]+X;D.array.copyWithin(J,N,N+H),D.addUpdateRange(J,H),D.needsUpdate=!0,G.indexStart=J}J+=G.reservedIndexCount}if(G.vertexStart!==z){let{vertexStart:N,reservedVertexCount:Z}=G,H=K.attributes;for(let D in H){let U=H[D],{array:X,itemSize:k}=U;X.copyWithin(z*k,N*k,(N+Z)*k),U.addUpdateRange(z*k,Z*k),U.needsUpdate=!0}G.vertexStart=z}z+=G.reservedVertexCount,G.start=K.index?G.indexStart:G.vertexStart}return this._nextIndexStart=J,this._nextVertexStart=z,this._visibilityChanged=!0,this}getBoundingBoxAt(z,J){if(z>=this._geometryCount)return null;let Q=this.geometry,$=this._geometryInfo[z];if($.boundingBox===null){let K=new fJ,W=Q.index,q=Q.attributes.position;for(let B=$.start,G=$.start+$.count;B<G;B++){let N=B;if(W)N=W.getX(N);K.expandByPoint(D1.fromBufferAttribute(q,N))}$.boundingBox=K}return J.copy($.boundingBox),J}getBoundingSphereAt(z,J){if(z>=this._geometryCount)return null;let Q=this.geometry,$=this._geometryInfo[z];if($.boundingSphere===null){let K=new PJ;this.getBoundingBoxAt(z,Z2),Z2.getCenter(K.center);let W=Q.index,q=Q.attributes.position,B=0;for(let G=$.start,N=$.start+$.count;G<N;G++){let Z=G;if(W)Z=W.getX(Z);D1.fromBufferAttribute(q,Z),B=Math.max(B,K.center.distanceToSquared(D1))}K.radius=Math.sqrt(B),$.boundingSphere=K}return J.copy($.boundingSphere),J}setMatrixAt(z,J){this.validateInstanceId(z);let Q=this._matricesTexture,$=this._matricesTexture.image.data;return J.toArray($,z*16),Q.needsUpdate=!0,this}getMatrixAt(z,J){return this.validateInstanceId(z),J.fromArray(this._matricesTexture.image.data,z*16)}setColorAt(z,J){if(this.validateInstanceId(z),this._colorsTexture===null)this._initColorsTexture();return J.toArray(this._colorsTexture.image.data,z*4),this._colorsTexture.needsUpdate=!0,this}getColorAt(z,J){if(this.validateInstanceId(z),this._colorsTexture===null)if(J.isVector4)return J.set(1,1,1,1);else return J.setRGB(1,1,1);else return J.fromArray(this._colorsTexture.image.data,z*4)}setVisibleAt(z,J){if(this.validateInstanceId(z),this._instanceInfo[z].visible===J)return this;return this._instanceInfo[z].visible=J,this._visibilityChanged=!0,this}getVisibleAt(z){return this.validateInstanceId(z),this._instanceInfo[z].visible}setGeometryIdAt(z,J){return this.validateInstanceId(z),this.validateGeometryId(J),this._instanceInfo[z].geometryIndex=J,this}getGeometryIdAt(z){return this.validateInstanceId(z),this._instanceInfo[z].geometryIndex}getGeometryRangeAt(z,J={}){this.validateGeometryId(z);let Q=this._geometryInfo[z];return J.vertexStart=Q.vertexStart,J.vertexCount=Q.vertexCount,J.reservedVertexCount=Q.reservedVertexCount,J.indexStart=Q.indexStart,J.indexCount=Q.indexCount,J.reservedIndexCount=Q.reservedIndexCount,J.start=Q.start,J.count=Q.count,J}setInstanceCount(z){let J=this._availableInstanceIds,Q=this._instanceInfo;J.sort(e5);while(J[J.length-1]===Q.length-1)Q.pop(),J.pop();if(z<Q.length)throw Error(`THREE.BatchedMesh: Instance ids outside the range ${z} are being used. Cannot shrink instance count.`);let $=new Int32Array(z),K=new Int32Array(z);J0(this._multiDrawCounts,$),J0(this._multiDrawStarts,K),this._multiDrawCounts=$,this._multiDrawStarts=K,this._maxInstanceCount=z;let W=this._indirectTexture,q=this._matricesTexture,B=this._colorsTexture;if(W.dispose(),this._initIndirectTexture(),J0(W.image.data,this._indirectTexture.image.data),q.dispose(),this._initMatricesTexture(),J0(q.image.data,this._matricesTexture.image.data),B)B.dispose(),this._initColorsTexture(),J0(B.image.data,this._colorsTexture.image.data)}setGeometrySize(z,J){let Q=[...this._geometryInfo].filter((q)=>q.active);if(Math.max(...Q.map((q)=>q.vertexStart+q.reservedVertexCount))>z)throw Error(`THREE.BatchedMesh: Geometry vertex values are being used outside the range ${J}. Cannot shrink further.`);if(this.geometry.index){if(Math.max(...Q.map((B)=>B.indexStart+B.reservedIndexCount))>J)throw Error(`THREE.BatchedMesh: Geometry index values are being used outside the range ${J}. Cannot shrink further.`)}let K=this.geometry;if(K.dispose(),this._maxVertexCount=z,this._maxIndexCount=J,this._geometryInitialized)this._geometryInitialized=!1,this.geometry=new mz,this._initializeGeometry(K);let W=this.geometry;if(K.index)J0(K.index.array,W.index.array);for(let q in K.attributes)J0(K.attributes[q].array,W.attributes[q].array)}raycast(z,J){let Q=this._instanceInfo,$=this._geometryInfo,K=this.matrixWorld,W=this.geometry;if(jJ.material=this.material,jJ.geometry.index=W.index,jJ.geometry.attributes=W.attributes,jJ.geometry.boundingBox===null)jJ.geometry.boundingBox=new fJ;if(jJ.geometry.boundingSphere===null)jJ.geometry.boundingSphere=new PJ;for(let q=0,B=Q.length;q<B;q++){if(!Q[q].visible||!Q[q].active)continue;let G=Q[q].geometryIndex,N=$[G];jJ.geometry.setDrawRange(N.start,N.count),this.getMatrixAt(q,jJ.matrixWorld).premultiply(K),this.getBoundingBoxAt(G,jJ.geometry.boundingBox),this.getBoundingSphereAt(G,jJ.geometry.boundingSphere),jJ.raycast(z,H2);for(let Z=0,H=H2.length;Z<H;Z++){let D=H2[Z];D.object=this,D.batchId=q,J.push(D)}H2.length=0}jJ.material=null,jJ.geometry.index=null,jJ.geometry.attributes={},jJ.geometry.setDrawRange(0,1/0)}copy(z){if(super.copy(z),this.geometry=z.geometry.clone(),this.perObjectFrustumCulled=z.perObjectFrustumCulled,this.sortObjects=z.sortObjects,this.boundingBox=z.boundingBox!==null?z.boundingBox.clone():null,this.boundingSphere=z.boundingSphere!==null?z.boundingSphere.clone():null,this._geometryInfo=z._geometryInfo.map((J)=>({...J,boundingBox:J.boundingBox!==null?J.boundingBox.clone():null,boundingSphere:J.boundingSphere!==null?J.boundingSphere.clone():null})),this._instanceInfo=z._instanceInfo.map((J)=>({...J})),this._availableInstanceIds=z._availableInstanceIds.slice(),this._availableGeometryIds=z._availableGeometryIds.slice(),this._nextIndexStart=z._nextIndexStart,this._nextVertexStart=z._nextVertexStart,this._geometryCount=z._geometryCount,this._maxInstanceCount=z._maxInstanceCount,this._maxVertexCount=z._maxVertexCount,this._maxIndexCount=z._maxIndexCount,this._geometryInitialized=z._geometryInitialized,this._multiDrawCounts=z._multiDrawCounts.slice(),this._multiDrawStarts=z._multiDrawStarts.slice(),this._indirectTexture=z._indirectTexture.clone(),this._indirectTexture.image.data=this._indirectTexture.image.data.slice(),this._matricesTexture=z._matricesTexture.clone(),this._matricesTexture.image.data=this._matricesTexture.image.data.slice(),this._colorsTexture!==null)this._colorsTexture=z._colorsTexture.clone(),this._colorsTexture.image.data=this._colorsTexture.image.data.slice();return this}dispose(){if(this.geometry.dispose(),this._matricesTexture.dispose(),this._matricesTexture=null,this._indirectTexture.dispose(),this._indirectTexture=null,this._colorsTexture!==null)this._colorsTexture.dispose(),this._colorsTexture=null}onBeforeRender(z,J,Q,$,K){if(!this._visibilityChanged&&!this.perObjectFrustumCulled&&!this.sortObjects)return;let W=$.getIndex(),q=W===null?1:W.array.BYTES_PER_ELEMENT,B=1;if(K.wireframe)B=2,q=$.attributes.position.count>65535?4:2;let G=this._instanceInfo,N=this._multiDrawStarts,Z=this._multiDrawCounts,H=this._geometryInfo,D=this.perObjectFrustumCulled,U=this._indirectTexture,X=U.image.data,k=Q.isArrayCamera?KW:$W;if(D)if(Q.isArrayCamera)k.setFromArrayCamera(Q);else lJ.multiplyMatrices(Q.projectionMatrix,Q.matrixWorldInverse).multiply(this.matrixWorld),k.setFromProjectionMatrix(lJ,Q.coordinateSystem,Q.reversedDepth);let Y=0;if(this.sortObjects){lJ.copy(this.matrixWorld).invert(),D1.setFromMatrixPosition(Q.matrixWorld).applyMatrix4(lJ),B8.set(0,0,-1).transformDirection(Q.matrixWorld).transformDirection(lJ);for(let O=0,I=G.length;O<I;O++)if(G[O].visible&&G[O].active){let S=G[O].geometryIndex;this.getMatrixAt(O,lJ),this.getBoundingSphereAt(S,z0).applyMatrix4(lJ);let w=!1;if(D)w=!k.intersectsSphere(z0);if(!w){let C=H[S],E=WW.subVectors(z0.center,D1).dot(B8);z6.push(C.start,C.count,E,O)}}let V=z6.list,L=this.customSort;if(L===null)V.sort(K.transparent?JW:zW);else L.call(this,V,Q);for(let O=0,I=V.length;O<I;O++){let S=V[O];N[Y]=S.start*q*B,Z[Y]=S.count*B,X[Y]=S.index,Y++}z6.reset()}else for(let V=0,L=G.length;V<L;V++)if(G[V].visible&&G[V].active){let O=G[V].geometryIndex,I=!1;if(D)this.getMatrixAt(V,lJ),this.getBoundingSphereAt(O,z0).applyMatrix4(lJ),I=!k.intersectsSphere(z0);if(!I){let S=H[O];N[Y]=S.start*q*B,Z[Y]=S.count*B,X[Y]=V,Y++}}U.needsUpdate=!0,this._multiDrawCount=Y,this._visibilityChanged=!1}onBeforeShadow(z,J,Q,$,K,W){this.onBeforeRender(z,null,$,K,W)}}class bJ extends vJ{constructor(z){super();this.isLineBasicMaterial=!0,this.type="LineBasicMaterial",this.color=new Fz(16777215),this.map=null,this.linewidth=1,this.linecap="round",this.linejoin="round",this.fog=!0,this.setValues(z)}copy(z){return super.copy(z),this.color.copy(z.color),this.map=z.map,this.linewidth=z.linewidth,this.linecap=z.linecap,this.linejoin=z.linejoin,this.fog=z.fog,this}}var T2=new R,h2=new R,G8=new pz,Z1=new Y0,U2=new PJ,J6=new R,N8=new R;class CQ extends KJ{constructor(z=new mz,J=new bJ){super();this.isLine=!0,this.type="Line",this.geometry=z,this.material=J,this.morphTargetDictionary=void 0,this.morphTargetInfluences=void 0,this.updateMorphTargets()}copy(z,J){return super.copy(z,J),this.material=Array.isArray(z.material)?z.material.slice():z.material,this.geometry=z.geometry,this}computeLineDistances(){let z=this.geometry;if(z.index===null){let J=z.attributes.position,Q=[0];for(let $=1,K=J.count;$<K;$++)T2.fromBufferAttribute(J,$-1),h2.fromBufferAttribute(J,$),Q[$]=Q[$-1],Q[$]+=T2.distanceTo(h2);z.setAttribute("lineDistance",new Sz(Q,1))}else Bz("Line.computeLineDistances(): Computation only possible with non-indexed BufferGeometry.");return this}raycast(z,J){let Q=this.geometry,$=this.matrixWorld,K=z.params.Line.threshold,W=Q.drawRange;if(Q.boundingSphere===null)Q.computeBoundingSphere();if(U2.copy(Q.boundingSphere),U2.applyMatrix4($),U2.radius+=K,z.ray.intersectsSphere(U2)===!1)return;G8.copy($).invert(),Z1.copy(z.ray).applyMatrix4(G8);let q=K/((this.scale.x+this.scale.y+this.scale.z)/3),B=q*q,G=this.isLineSegments?2:1,N=Q.index,H=Q.attributes.position;if(N!==null){let D=Math.max(0,W.start),U=Math.min(N.count,W.start+W.count);for(let X=D,k=U-1;X<k;X+=G){let Y=N.getX(X),V=N.getX(X+1),L=V2(this,z,Z1,B,Y,V,X);if(L)J.push(L)}if(this.isLineLoop){let X=N.getX(U-1),k=N.getX(D),Y=V2(this,z,Z1,B,X,k,U-1);if(Y)J.push(Y)}}else{let D=Math.max(0,W.start),U=Math.min(H.count,W.start+W.count);for(let X=D,k=U-1;X<k;X+=G){let Y=V2(this,z,Z1,B,X,X+1,X);if(Y)J.push(Y)}if(this.isLineLoop){let X=V2(this,z,Z1,B,U-1,D,U-1);if(X)J.push(X)}}}updateMorphTargets(){let J=this.geometry.morphAttributes,Q=Object.keys(J);if(Q.length>0){let $=J[Q[0]];if($!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let K=0,W=$.length;K<W;K++){let q=$[K].name||String(K);this.morphTargetInfluences.push(0),this.morphTargetDictionary[q]=K}}}}}function V2(z,J,Q,$,K,W,q){let B=z.geometry.attributes.position;if(T2.fromBufferAttribute(B,K),h2.fromBufferAttribute(B,W),Q.distanceSqToSegment(T2,h2,J6,N8)>$)return;J6.applyMatrix4(z.matrixWorld);let N=J.ray.origin.distanceTo(J6);if(N<J.near||N>J.far)return;return{distance:N,point:N8.clone().applyMatrix4(z.matrixWorld),index:q,face:null,faceIndex:null,barycoord:null,object:z}}var D8=new R,Z8=new R;class DQ extends CQ{constructor(z,J){super(z,J);this.isLineSegments=!0,this.type="LineSegments"}computeLineDistances(){let z=this.geometry;if(z.index===null){let J=z.attributes.position,Q=[];for(let $=0,K=J.count;$<K;$+=2)D8.fromBufferAttribute(J,$),Z8.fromBufferAttribute(J,$+1),Q[$]=$===0?0:Q[$-1],Q[$+1]=Q[$]+D8.distanceTo(Z8);z.setAttribute("lineDistance",new Sz(Q,1))}else Bz("LineSegments.computeLineDistances(): Computation only possible with non-indexed BufferGeometry.");return this}}class x6 extends CQ{constructor(z,J){super(z,J);this.isLineLoop=!0,this.type="LineLoop"}}class o2 extends vJ{constructor(z){super();this.isPointsMaterial=!0,this.type="PointsMaterial",this.color=new Fz(16777215),this.map=null,this.alphaMap=null,this.size=1,this.sizeAttenuation=!0,this.fog=!0,this.setValues(z)}copy(z){return super.copy(z),this.color.copy(z.color),this.map=z.map,this.alphaMap=z.alphaMap,this.size=z.size,this.sizeAttenuation=z.sizeAttenuation,this.fog=z.fog,this}}var H8=new pz,I6=new Y0,Y2=new PJ,X2=new R;class j6 extends KJ{constructor(z=new mz,J=new o2){super();this.isPoints=!0,this.type="Points",this.geometry=z,this.material=J,this.morphTargetDictionary=void 0,this.morphTargetInfluences=void 0,this.updateMorphTargets()}copy(z,J){return super.copy(z,J),this.material=Array.isArray(z.material)?z.material.slice():z.material,this.geometry=z.geometry,this}raycast(z,J){let Q=this.geometry,$=this.matrixWorld,K=z.params.Points.threshold,W=Q.drawRange;if(Q.boundingSphere===null)Q.computeBoundingSphere();if(Y2.copy(Q.boundingSphere),Y2.applyMatrix4($),Y2.radius+=K,z.ray.intersectsSphere(Y2)===!1)return;H8.copy($).invert(),I6.copy(z.ray).applyMatrix4(H8);let q=K/((this.scale.x+this.scale.y+this.scale.z)/3),B=q*q,G=Q.index,Z=Q.attributes.position;if(G!==null){let H=Math.max(0,W.start),D=Math.min(G.count,W.start+W.count);for(let U=H,X=D;U<X;U++){let k=G.getX(U);X2.fromBufferAttribute(Z,k),U8(X2,k,B,$,z,J,this)}}else{let H=Math.max(0,W.start),D=Math.min(Z.count,W.start+W.count);for(let U=H,X=D;U<X;U++)X2.fromBufferAttribute(Z,U),U8(X2,U,B,$,z,J,this)}}updateMorphTargets(){let J=this.geometry.morphAttributes,Q=Object.keys(J);if(Q.length>0){let $=J[Q[0]];if($!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let K=0,W=$.length;K<W;K++){let q=$[K].name||String(K);this.morphTargetInfluences.push(0),this.morphTargetDictionary[q]=K}}}}}function U8(z,J,Q,$,K,W,q){let B=I6.distanceSqToPoint(z);if(B<Q){let G=new R;I6.closestPointToPoint(z,G),G.applyMatrix4($);let N=K.ray.origin.distanceTo(G);if(N<K.near||N>K.far)return;W.push({distance:N,distanceToRay:Math.sqrt(B),point:G,index:J,face:null,faceIndex:null,barycoord:null,object:q})}}class _6 extends kJ{constructor(z,J,Q,$,K=1006,W=1006,q,B,G){super(z,J,Q,$,K,W,q,B,G);this.isVideoTexture=!0,this.generateMipmaps=!1,this._requestVideoFrameCallbackId=0;let N=this;function Z(){N.needsUpdate=!0,N._requestVideoFrameCallbackId=z.requestVideoFrameCallback(Z)}if("requestVideoFrameCallback"in z)this._requestVideoFrameCallbackId=z.requestVideoFrameCallback(Z)}clone(){return new this.constructor(this.image).copy(this)}update(){let z=this.image;if("requestVideoFrameCallback"in z===!1&&z.readyState>=z.HAVE_CURRENT_DATA)this.needsUpdate=!0}dispose(){if(this._requestVideoFrameCallbackId!==0)this.source.data.cancelVideoFrameCallback(this._requestVideoFrameCallbackId),this._requestVideoFrameCallbackId=0;super.dispose()}}class w9 extends _6{constructor(z,J,Q,$,K,W,q,B){super({},z,J,Q,$,K,W,q,B);this.isVideoFrameTexture=!0}update(){}clone(){return new this.constructor().copy(this)}setFrame(z){this.image=z,this.needsUpdate=!0}}class C9 extends kJ{constructor(z,J){super({width:z,height:J});this.isFramebufferTexture=!0,this.magFilter=1003,this.minFilter=1003,this.generateMipmaps=!1,this.needsUpdate=!0}}class v1 extends kJ{constructor(z,J,Q,$,K,W,q,B,G,N,Z,H){super(null,W,q,B,G,N,$,K,Z,H);this.isCompressedTexture=!0,this.image={width:J,height:Q},this.mipmaps=z,this.flipY=!1,this.generateMipmaps=!1}}class R9 extends v1{constructor(z,J,Q,$,K,W){super(z,J,Q,K,W);this.isCompressedArrayTexture=!0,this.image.depth=$,this.wrapR=1001,this.layerUpdates=new Set}addLayerUpdate(z){this.layerUpdates.add(z)}clearLayerUpdates(){this.layerUpdates.clear()}}class P9 extends v1{constructor(z,J,Q){super(void 0,z[0].width,z[0].height,J,Q,301);this.isCompressedCubeTexture=!0,this.isCubeTexture=!0,this.image=z}}class i0 extends kJ{constructor(z=[],J=301,Q,$,K,W,q,B,G,N){super(z,J,Q,$,K,W,q,B,G,N);this.isCubeTexture=!0,this.flipY=!1}get images(){return this.image}set images(z){this.image=z}}class v9 extends kJ{constructor(z,J,Q,$,K,W,q,B,G){super(z,J,Q,$,K,W,q,B,G);this.isCanvasTexture=!0,this.needsUpdate=!0}}class f9 extends kJ{constructor(z,J,Q,$,K,W,q,B,G){super(z,J,Q,$,K,W,q,B,G);this.isHTMLTexture=!0,this.generateMipmaps=!1,this.needsUpdate=!0;let N=z?z.parentNode:null;if(N!==null&&"requestPaint"in N)N.onpaint=()=>{this.needsUpdate=!0},N.requestPaint()}dispose(){let z=this.image?this.image.parentNode:null;if(z!==null&&"onpaint"in z)z.onpaint=null;super.dispose()}}class cQ extends kJ{constructor(z,J,Q=1014,$,K,W,q=1003,B=1003,G,N=1026,Z=1){if(N!==1026&&N!==1027)throw Error("THREE.DepthTexture: format must be either THREE.DepthFormat or THREE.DepthStencilFormat");let H={width:z,height:J,depth:Z};super(H,$,K,W,q,B,N,Q,G);this.isDepthTexture=!0,this.flipY=!1,this.generateMipmaps=!1,this.compareFunction=null}copy(z){return super.copy(z),this.source=new SQ(Object.assign({},z.image)),this.compareFunction=z.compareFunction,this}toJSON(z){let J=super.toJSON(z);if(this.compareFunction!==null)J.compareFunction=this.compareFunction;return J}}class b6 extends cQ{constructor(z,J=1014,Q=301,$,K,W=1003,q=1003,B,G=1026){let N={width:z,height:z,depth:1},Z=[N,N,N,N,N,N];super(z,z,J,Q,$,K,W,q,B,G);this.image=Z,this.isCubeDepthTexture=!0,this.isCubeTexture=!0}get images(){return this.image}set images(z){this.image=z}}class s2 extends kJ{constructor(z=null){super();this.sourceTexture=z,this.isExternalTexture=!0}copy(z){return super.copy(z),this.sourceTexture=z.sourceTexture,this}}class X0 extends mz{constructor(z=1,J=1,Q=1,$=1,K=1,W=1){super();this.type="BoxGeometry",this.parameters={width:z,height:J,depth:Q,widthSegments:$,heightSegments:K,depthSegments:W};let q=this;$=Math.floor($),K=Math.floor(K),W=Math.floor(W);let B=[],G=[],N=[],Z=[],H=0,D=0;U("z","y","x",-1,-1,Q,J,z,W,K,0),U("z","y","x",1,-1,Q,J,-z,W,K,1),U("x","z","y",1,1,z,Q,J,$,W,2),U("x","z","y",1,-1,z,Q,-J,$,W,3),U("x","y","z",1,-1,z,J,Q,$,K,4),U("x","y","z",-1,-1,z,J,-Q,$,K,5),this.setIndex(B),this.setAttribute("position",new Sz(G,3)),this.setAttribute("normal",new Sz(N,3)),this.setAttribute("uv",new Sz(Z,2));function U(X,k,Y,V,L,O,I,S,w,C,E){let F=O/w,x=I/C,P=O/2,p=I/2,n=S/2,j=w+1,m=C+1,l=0,_=0,t=new R;for(let $z=0;$z<m;$z++){let qz=$z*x-p;for(let Cz=0;Cz<j;Cz++){let Az=Cz*F-P;t[X]=Az*V,t[k]=qz*L,t[Y]=n,G.push(t.x,t.y,t.z),t[X]=0,t[k]=0,t[Y]=S>0?1:-1,N.push(t.x,t.y,t.z),Z.push(Cz/w),Z.push(1-$z/C),l+=1}}for(let $z=0;$z<C;$z++)for(let qz=0;qz<w;qz++){let Cz=H+qz+j*$z,Az=H+qz+j*($z+1),NJ=H+(qz+1)+j*($z+1),qJ=H+(qz+1)+j*$z;B.push(Cz,Az,qJ),B.push(Az,NJ,qJ),_+=6}q.addGroup(D,_,E),D+=_,H+=l}}copy(z){return super.copy(z),this.parameters=Object.assign({},z.parameters),this}static fromJSON(z){return new X0(z.width,z.height,z.depth,z.widthSegments,z.heightSegments,z.depthSegments)}}class i2 extends mz{constructor(z=1,J=1,Q=4,$=8,K=1){super();this.type="CapsuleGeometry",this.parameters={radius:z,height:J,capSegments:Q,radialSegments:$,heightSegments:K},J=Math.max(0,J),Q=Math.max(1,Math.floor(Q)),$=Math.max(3,Math.floor($)),K=Math.max(1,Math.floor(K));let W=[],q=[],B=[],G=[],N=J/2,Z=Math.PI/2*z,H=J,D=2*Z+H,U=Q*2+K,X=$+1,k=new R,Y=new R;for(let V=0;V<=U;V++){let L=0,O=0,I=0,S=0;if(V<=Q){let E=V/Q,F=E*Math.PI/2;O=-N-z*Math.cos(F),I=z*Math.sin(F),S=-z*Math.cos(F),L=E*Z}else if(V<=Q+K){let E=(V-Q)/K;O=-N+E*J,I=z,S=0,L=Z+E*H}else{let E=(V-Q-K)/Q,F=E*Math.PI/2;O=N+z*Math.sin(F),I=z*Math.cos(F),S=z*Math.sin(F),L=Z+H+E*Z}let w=Math.max(0,Math.min(1,L/D)),C=0;if(V===0)C=0.5/$;else if(V===U)C=-0.5/$;for(let E=0;E<=$;E++){let F=E/$,x=F*Math.PI*2,P=Math.sin(x),p=Math.cos(x);Y.x=-I*p,Y.y=O,Y.z=I*P,q.push(Y.x,Y.y,Y.z),k.set(-I*p,S,I*P),k.normalize(),B.push(k.x,k.y,k.z),G.push(F+C,w)}if(V>0){let E=(V-1)*X;for(let F=0;F<$;F++){let x=E+F,P=E+F+1,p=V*X+F,n=V*X+F+1;W.push(x,P,p),W.push(P,n,p)}}}this.setIndex(W),this.setAttribute("position",new Sz(q,3)),this.setAttribute("normal",new Sz(B,3)),this.setAttribute("uv",new Sz(G,2))}copy(z){return super.copy(z),this.parameters=Object.assign({},z.parameters),this}static fromJSON(z){return new i2(z.radius,z.height,z.capSegments,z.radialSegments,z.heightSegments)}}class a2 extends mz{constructor(z=1,J=32,Q=0,$=Math.PI*2){super();this.type="CircleGeometry",this.parameters={radius:z,segments:J,thetaStart:Q,thetaLength:$},J=Math.max(3,J);let K=[],W=[],q=[],B=[],G=new R,N=new a;W.push(0,0,0),q.push(0,0,1),B.push(0.5,0.5);for(let Z=0,H=3;Z<=J;Z++,H+=3){let D=Q+Z/J*$;G.x=z*Math.cos(D),G.y=z*Math.sin(D),W.push(G.x,G.y,G.z),q.push(0,0,1),N.x=(W[H]/z+1)/2,N.y=(W[H+1]/z+1)/2,B.push(N.x,N.y)}for(let Z=1;Z<=J;Z++)K.push(Z,Z+1,0);this.setIndex(K),this.setAttribute("position",new Sz(W,3)),this.setAttribute("normal",new Sz(q,3)),this.setAttribute("uv",new Sz(B,2))}copy(z){return super.copy(z),this.parameters=Object.assign({},z.parameters),this}static fromJSON(z){return new a2(z.radius,z.segments,z.thetaStart,z.thetaLength)}}class f1 extends mz{constructor(z=1,J=1,Q=1,$=32,K=1,W=!1,q=0,B=Math.PI*2){super();this.type="CylinderGeometry",this.parameters={radiusTop:z,radiusBottom:J,height:Q,radialSegments:$,heightSegments:K,openEnded:W,thetaStart:q,thetaLength:B};let G=this;$=Math.floor($),K=Math.floor(K);let N=[],Z=[],H=[],D=[],U=0,X=[],k=Q/2,Y=0;if(V(),W===!1){if(z>0)L(!0);if(J>0)L(!1)}this.setIndex(N),this.setAttribute("position",new Sz(Z,3)),this.setAttribute("normal",new Sz(H,3)),this.setAttribute("uv",new Sz(D,2));function V(){let O=new R,I=new R,S=0,w=(J-z)/Q;for(let C=0;C<=K;C++){let E=[],F=C/K,x=F*(J-z)+z;for(let P=0;P<=$;P++){let p=P/$,n=p*B+q,j=Math.sin(n),m=Math.cos(n);I.x=x*j,I.y=-F*Q+k,I.z=x*m,Z.push(I.x,I.y,I.z),O.set(j,w,m).normalize(),H.push(O.x,O.y,O.z),D.push(p,1-F),E.push(U++)}X.push(E)}for(let C=0;C<$;C++)for(let E=0;E<K;E++){let F=X[E][C],x=X[E+1][C],P=X[E+1][C+1],p=X[E][C+1];if(z>0||E!==0)N.push(F,x,p),S+=3;if(J>0||E!==K-1)N.push(x,P,p),S+=3}G.addGroup(Y,S,0),Y+=S}function L(O){let I=U,S=new a,w=new R,C=0,E=O===!0?z:J,F=O===!0?1:-1;for(let P=1;P<=$;P++)Z.push(0,k*F,0),H.push(0,F,0),D.push(0.5,0.5),U++;let x=U;for(let P=0;P<=$;P++){let n=P/$*B+q,j=Math.cos(n),m=Math.sin(n);w.x=E*m,w.y=k*F,w.z=E*j,Z.push(w.x,w.y,w.z),H.push(0,F,0),S.x=j*0.5+0.5,S.y=m*0.5*F+0.5,D.push(S.x,S.y),U++}for(let P=0;P<$;P++){let p=I+P,n=x+P;if(O===!0)N.push(n,n+1,p);else N.push(n+1,n,p);C+=3}G.addGroup(Y,C,O===!0?1:2),Y+=C}}copy(z){return super.copy(z),this.parameters=Object.assign({},z.parameters),this}static fromJSON(z){return new f1(z.radiusTop,z.radiusBottom,z.height,z.radialSegments,z.heightSegments,z.openEnded,z.thetaStart,z.thetaLength)}}class T1 extends f1{constructor(z=1,J=1,Q=32,$=1,K=!1,W=0,q=Math.PI*2){super(0,z,J,Q,$,K,W,q);this.type="ConeGeometry",this.parameters={radius:z,height:J,radialSegments:Q,heightSegments:$,openEnded:K,thetaStart:W,thetaLength:q}}static fromJSON(z){return new T1(z.radius,z.height,z.radialSegments,z.heightSegments,z.openEnded,z.thetaStart,z.thetaLength)}}class nQ extends mz{constructor(z=[],J=[],Q=1,$=0){super();this.type="PolyhedronGeometry",this.parameters={vertices:z,indices:J,radius:Q,detail:$};let K=[],W=[];if(q($),G(Q),N(),this.setAttribute("position",new Sz(K,3)),this.setAttribute("normal",new Sz(K.slice(),3)),this.setAttribute("uv",new Sz(W,2)),$===0)this.computeVertexNormals();else this.normalizeNormals();function q(V){let L=new R,O=new R,I=new R;for(let S=0;S<J.length;S+=3)D(J[S+0],L),D(J[S+1],O),D(J[S+2],I),B(L,O,I,V)}function B(V,L,O,I){let S=I+1,w=[];for(let C=0;C<=S;C++){w[C]=[];let E=V.clone().lerp(O,C/S),F=L.clone().lerp(O,C/S),x=S-C;for(let P=0;P<=x;P++)if(P===0&&C===S)w[C][P]=E;else w[C][P]=E.clone().lerp(F,P/x)}for(let C=0;C<S;C++)for(let E=0;E<2*(S-C)-1;E++){let F=Math.floor(E/2);if(E%2===0)H(w[C][F+1]),H(w[C+1][F]),H(w[C][F]);else H(w[C][F+1]),H(w[C+1][F+1]),H(w[C+1][F])}}function G(V){let L=new R;for(let O=0;O<K.length;O+=3)L.x=K[O+0],L.y=K[O+1],L.z=K[O+2],L.normalize().multiplyScalar(V),K[O+0]=L.x,K[O+1]=L.y,K[O+2]=L.z}function N(){let V=new R;for(let L=0;L<K.length;L+=3){V.x=K[L+0],V.y=K[L+1],V.z=K[L+2];let O=k(V)/2/Math.PI+0.5,I=Y(V)/Math.PI+0.5;W.push(O,1-I)}U(),Z()}function Z(){for(let V=0;V<W.length;V+=6){let L=W[V+0],O=W[V+2],I=W[V+4],S=Math.max(L,O,I),w=Math.min(L,O,I);if(S>0.9&&w<0.1){if(L<0.2)W[V+0]+=1;if(O<0.2)W[V+2]+=1;if(I<0.2)W[V+4]+=1}}}function H(V){K.push(V.x,V.y,V.z)}function D(V,L){let O=V*3;L.x=z[O+0],L.y=z[O+1],L.z=z[O+2]}function U(){let V=new R,L=new R,O=new R,I=new R,S=new a,w=new a,C=new a;for(let E=0,F=0;E<K.length;E+=9,F+=6){V.set(K[E+0],K[E+1],K[E+2]),L.set(K[E+3],K[E+4],K[E+5]),O.set(K[E+6],K[E+7],K[E+8]),S.set(W[F+0],W[F+1]),w.set(W[F+2],W[F+3]),C.set(W[F+4],W[F+5]),I.copy(V).add(L).add(O).divideScalar(3);let x=k(I);X(S,F+0,V,x),X(w,F+2,L,x),X(C,F+4,O,x)}}function X(V,L,O,I){if(I<0&&V.x===1)W[L]=V.x-1;if(O.x===0&&O.z===0)W[L]=I/2/Math.PI+0.5}function k(V){return Math.atan2(V.z,-V.x)}function Y(V){return Math.atan2(-V.y,Math.sqrt(V.x*V.x+V.z*V.z))}}copy(z){return super.copy(z),this.parameters=Object.assign({},z.parameters),this}static fromJSON(z){return new nQ(z.vertices,z.indices,z.radius,z.detail)}}class t2 extends nQ{constructor(z=1,J=0){let Q=(1+Math.sqrt(5))/2,$=1/Q,K=[-1,-1,-1,-1,-1,1,-1,1,-1,-1,1,1,1,-1,-1,1,-1,1,1,1,-1,1,1,1,0,-$,-Q,0,-$,Q,0,$,-Q,0,$,Q,-$,-Q,0,-$,Q,0,$,-Q,0,$,Q,0,-Q,0,-$,Q,0,-$,-Q,0,$,Q,0,$],W=[3,11,7,3,7,15,3,15,13,7,19,17,7,17,6,7,6,15,17,4,8,17,8,10,17,10,6,8,0,16,8,16,2,8,2,10,0,12,1,0,1,18,0,18,16,6,10,2,6,2,13,6,13,15,2,16,18,2,18,3,2,3,13,18,1,9,18,9,11,18,11,3,4,14,12,4,12,0,4,0,8,11,9,5,11,5,19,11,19,7,19,5,14,19,14,4,19,4,17,1,12,14,1,14,5,1,5,9];super(K,W,z,J);this.type="DodecahedronGeometry",this.parameters={radius:z,detail:J}}static fromJSON(z){return new t2(z.radius,z.detail)}}var k2=new R,E2=new R,Q6=new R,I2=new cJ;class d6 extends mz{constructor(z=null,J=1){super();if(this.type="EdgesGeometry",this.parameters={geometry:z,thresholdAngle:J},z!==null){let $=Math.pow(10,4),K=Math.cos(Z0*J),W=z.getIndex(),q=z.getAttribute("position"),B=W?W.count:q.count,G=[0,0,0],N=["a","b","c"],Z=[,,,],H={},D=[];for(let U=0;U<B;U+=3){if(W)G[0]=W.getX(U),G[1]=W.getX(U+1),G[2]=W.getX(U+2);else G[0]=U,G[1]=U+1,G[2]=U+2;let{a:X,b:k,c:Y}=I2;if(X.fromBufferAttribute(q,G[0]),k.fromBufferAttribute(q,G[1]),Y.fromBufferAttribute(q,G[2]),I2.getNormal(Q6),Z[0]=`${Math.round(X.x*$)},${Math.round(X.y*$)},${Math.round(X.z*$)}`,Z[1]=`${Math.round(k.x*$)},${Math.round(k.y*$)},${Math.round(k.z*$)}`,Z[2]=`${Math.round(Y.x*$)},${Math.round(Y.y*$)},${Math.round(Y.z*$)}`,Z[0]===Z[1]||Z[1]===Z[2]||Z[2]===Z[0])continue;for(let V=0;V<3;V++){let L=(V+1)%3,O=Z[V],I=Z[L],S=I2[N[V]],w=I2[N[L]],C=`${O}_${I}`,E=`${I}_${O}`;if(E in H&&H[E]){if(Q6.dot(H[E].normal)<=K)D.push(S.x,S.y,S.z),D.push(w.x,w.y,w.z);H[E]=null}else if(!(C in H))H[C]={index0:G[V],index1:G[L],normal:Q6.clone()}}}for(let U in H)if(H[U]){let{index0:X,index1:k}=H[U];k2.fromBufferAttribute(q,X),E2.fromBufferAttribute(q,k),D.push(k2.x,k2.y,k2.z),D.push(E2.x,E2.y,E2.z)}this.setAttribute("position",new Sz(D,3))}}copy(z){return super.copy(z),this.parameters=Object.assign({},z.parameters),this}}class $Q{constructor(){this.type="Curve",this.arcLengthDivisions=200,this.needsUpdate=!1,this.cacheArcLengths=null}getPoint(){Bz("Curve: .getPoint() not implemented.")}getPointAt(z,J){let Q=this.getUtoTmapping(z);return this.getPoint(Q,J)}getPoints(z=5){let J=[];for(let Q=0;Q<=z;Q++)J.push(this.getPoint(Q/z));return J}getSpacedPoints(z=5){let J=[];for(let Q=0;Q<=z;Q++)J.push(this.getPointAt(Q/z));return J}getLength(){let z=this.getLengths();return z[z.length-1]}getLengths(z=this.arcLengthDivisions){if(this.cacheArcLengths&&this.cacheArcLengths.length===z+1&&!this.needsUpdate)return this.cacheArcLengths;this.needsUpdate=!1;let J=[],Q,$=this.getPoint(0),K=0;J.push(0);for(let W=1;W<=z;W++)Q=this.getPoint(W/z),K+=Q.distanceTo($),J.push(K),$=Q;return this.cacheArcLengths=J,J}updateArcLengths(){this.needsUpdate=!0,this.getLengths()}getUtoTmapping(z,J=null){let Q=this.getLengths(),$=0,K=Q.length,W;if(J)W=J;else W=z*Q[K-1];let q=0,B=K-1,G;while(q<=B)if($=Math.floor(q+(B-q)/2),G=Q[$]-W,G<0)q=$+1;else if(G>0)B=$-1;else{B=$;break}if($=B,Q[$]===W)return $/(K-1);let N=Q[$],H=Q[$+1]-N,D=(W-N)/H;return($+D)/(K-1)}getTangent(z,J){let $=z-0.0001,K=z+0.0001;if($<0)$=0;if(K>1)K=1;let W=this.getPoint($),q=this.getPoint(K),B=J||(W.isVector2?new a:new R);return B.copy(q).sub(W).normalize(),B}getTangentAt(z,J){let Q=this.getUtoTmapping(z);return this.getTangent(Q,J)}computeFrenetFrames(z,J=!1){let Q=new R,$=[],K=[],W=[],q=new R,B=new pz;for(let D=0;D<=z;D++){let U=D/z;$[D]=this.getTangentAt(U,new R)}K[0]=new R,W[0]=new R;let G=Number.MAX_VALUE,N=Math.abs($[0].x),Z=Math.abs($[0].y),H=Math.abs($[0].z);if(N<=G)G=N,Q.set(1,0,0);if(Z<=G)G=Z,Q.set(0,1,0);if(H<=G)Q.set(0,0,1);q.crossVectors($[0],Q).normalize(),K[0].crossVectors($[0],q),W[0].crossVectors($[0],K[0]);for(let D=1;D<=z;D++){if(K[D]=K[D-1].clone(),W[D]=W[D-1].clone(),q.crossVectors($[D-1],$[D]),q.length()>Number.EPSILON){q.normalize();let U=Math.acos(dz($[D-1].dot($[D]),-1,1));K[D].applyMatrix4(B.makeRotationAxis(q,U))}W[D].crossVectors($[D],K[D])}if(J===!0){let D=Math.acos(dz(K[0].dot(K[z]),-1,1));if(D/=z,$[0].dot(q.crossVectors(K[0],K[z]))>0)D=-D;for(let U=1;U<=z;U++)K[U].applyMatrix4(B.makeRotationAxis($[U],D*U)),W[U].crossVectors($[U],K[U])}return{tangents:$,normals:K,binormals:W}}clone(){return new this.constructor().copy(this)}copy(z){return this.arcLengthDivisions=z.arcLengthDivisions,this}toJSON(){let z={metadata:{version:4.7,type:"Curve",generator:"Curve.toJSON"}};return z.arcLengthDivisions=this.arcLengthDivisions,z.type=this.type,z}fromJSON(z){return this.arcLengthDivisions=z.arcLengthDivisions,this}}class h1 extends $Q{constructor(z=0,J=0,Q=1,$=1,K=0,W=Math.PI*2,q=!1,B=0){super();this.isEllipseCurve=!0,this.type="EllipseCurve",this.aX=z,this.aY=J,this.xRadius=Q,this.yRadius=$,this.aStartAngle=K,this.aEndAngle=W,this.aClockwise=q,this.aRotation=B}getPoint(z,J=new a){let Q=J,$=Math.PI*2,K=this.aEndAngle-this.aStartAngle,W=Math.abs(K)<Number.EPSILON;while(K<0)K+=$;while(K>$)K-=$;if(K<Number.EPSILON)if(W)K=0;else K=$;if(this.aClockwise===!0&&!W)if(K===$)K=-$;else K=K-$;let q=this.aStartAngle+z*K,B=this.aX+this.xRadius*Math.cos(q),G=this.aY+this.yRadius*Math.sin(q);if(this.aRotation!==0){let N=Math.cos(this.aRotation),Z=Math.sin(this.aRotation),H=B-this.aX,D=G-this.aY;B=H*N-D*Z+this.aX,G=H*Z+D*N+this.aY}return Q.set(B,G)}copy(z){return super.copy(z),this.aX=z.aX,this.aY=z.aY,this.xRadius=z.xRadius,this.yRadius=z.yRadius,this.aStartAngle=z.aStartAngle,this.aEndAngle=z.aEndAngle,this.aClockwise=z.aClockwise,this.aRotation=z.aRotation,this}toJSON(){let z=super.toJSON();return z.aX=this.aX,z.aY=this.aY,z.xRadius=this.xRadius,z.yRadius=this.yRadius,z.aStartAngle=this.aStartAngle,z.aEndAngle=this.aEndAngle,z.aClockwise=this.aClockwise,z.aRotation=this.aRotation,z}fromJSON(z){return super.fromJSON(z),this.aX=z.aX,this.aY=z.aY,this.xRadius=z.xRadius,this.yRadius=z.yRadius,this.aStartAngle=z.aStartAngle,this.aEndAngle=z.aEndAngle,this.aClockwise=z.aClockwise,this.aRotation=z.aRotation,this}}class p6 extends h1{constructor(z,J,Q,$,K,W){super(z,J,Q,Q,$,K,W);this.isArcCurve=!0,this.type="ArcCurve"}}function u6(){let z=0,J=0,Q=0,$=0;function K(W,q,B,G){z=W,J=B,Q=-3*W+3*q-2*B-G,$=2*W-2*q+B+G}return{initCatmullRom:function(W,q,B,G,N){K(q,B,N*(B-W),N*(G-q))},initNonuniformCatmullRom:function(W,q,B,G,N,Z,H){let D=(q-W)/N-(B-W)/(N+Z)+(B-q)/Z,U=(B-q)/Z-(G-q)/(Z+H)+(G-B)/H;D*=Z,U*=Z,K(q,B,D,U)},calc:function(W){let q=W*W,B=q*W;return z+J*W+Q*q+$*B}}}var V8=new R,Y8=new R,$6=new u6,K6=new u6,W6=new u6;class g6 extends $Q{constructor(z=[],J=!1,Q="centripetal",$=0.5){super();this.isCatmullRomCurve3=!0,this.type="CatmullRomCurve3",this.points=z,this.closed=J,this.curveType=Q,this.tension=$}getPoint(z,J=new R){let Q=J,$=this.points,K=$.length,W=(K-(this.closed?0:1))*z,q=Math.floor(W),B=W-q;if(this.closed)q+=q>0?0:(Math.floor(Math.abs(q)/K)+1)*K;else if(B===0&&q===K-1)q=K-2,B=1;let G,N;if(this.closed||q>0)G=$[(q-1)%K];else Y8.subVectors($[0],$[1]).add($[0]),G=Y8;let Z=$[q%K],H=$[(q+1)%K];if(this.closed||q+2<K)N=$[(q+2)%K];else V8.subVectors($[K-1],$[K-2]).add($[K-1]),N=V8;if(this.curveType==="centripetal"||this.curveType==="chordal"){let D=this.curveType==="chordal"?0.5:0.25,U=Math.pow(G.distanceToSquared(Z),D),X=Math.pow(Z.distanceToSquared(H),D),k=Math.pow(H.distanceToSquared(N),D);if(X<0.0001)X=1;if(U<0.0001)U=X;if(k<0.0001)k=X;$6.initNonuniformCatmullRom(G.x,Z.x,H.x,N.x,U,X,k),K6.initNonuniformCatmullRom(G.y,Z.y,H.y,N.y,U,X,k),W6.initNonuniformCatmullRom(G.z,Z.z,H.z,N.z,U,X,k)}else if(this.curveType==="catmullrom")$6.initCatmullRom(G.x,Z.x,H.x,N.x,this.tension),K6.initCatmullRom(G.y,Z.y,H.y,N.y,this.tension),W6.initCatmullRom(G.z,Z.z,H.z,N.z,this.tension);return Q.set($6.calc(B),K6.calc(B),W6.calc(B)),Q}copy(z){super.copy(z),this.points=[];for(let J=0,Q=z.points.length;J<Q;J++){let $=z.points[J];this.points.push($.clone())}return this.closed=z.closed,this.curveType=z.curveType,this.tension=z.tension,this}toJSON(){let z=super.toJSON();z.points=[];for(let J=0,Q=this.points.length;J<Q;J++){let $=this.points[J];z.points.push($.toArray())}return z.closed=this.closed,z.curveType=this.curveType,z.tension=this.tension,z}fromJSON(z){super.fromJSON(z),this.points=[];for(let J=0,Q=z.points.length;J<Q;J++){let $=z.points[J];this.points.push(new R().fromArray($))}return this.closed=z.closed,this.curveType=z.curveType,this.tension=z.tension,this}}function X8(z,J,Q,$,K){let W=($-J)*0.5,q=(K-Q)*0.5,B=z*z,G=z*B;return(2*Q-2*$+W+q)*G+(-3*Q+3*$-2*W-q)*B+W*z+Q}function BW(z,J){let Q=1-z;return Q*Q*J}function GW(z,J){return 2*(1-z)*z*J}function NW(z,J){return z*z*J}function I1(z,J,Q,$){return BW(z,J)+GW(z,Q)+NW(z,$)}function DW(z,J){let Q=1-z;return Q*Q*Q*J}function ZW(z,J){let Q=1-z;return 3*Q*Q*z*J}function HW(z,J){return 3*(1-z)*z*z*J}function UW(z,J){return z*z*z*J}function A1(z,J,Q,$,K){return DW(z,J)+ZW(z,Q)+HW(z,$)+UW(z,K)}class r2 extends $Q{constructor(z=new a,J=new a,Q=new a,$=new a){super();this.isCubicBezierCurve=!0,this.type="CubicBezierCurve",this.v0=z,this.v1=J,this.v2=Q,this.v3=$}getPoint(z,J=new a){let Q=J,$=this.v0,K=this.v1,W=this.v2,q=this.v3;return Q.set(A1(z,$.x,K.x,W.x,q.x),A1(z,$.y,K.y,W.y,q.y)),Q}copy(z){return super.copy(z),this.v0.copy(z.v0),this.v1.copy(z.v1),this.v2.copy(z.v2),this.v3.copy(z.v3),this}toJSON(){let z=super.toJSON();return z.v0=this.v0.toArray(),z.v1=this.v1.toArray(),z.v2=this.v2.toArray(),z.v3=this.v3.toArray(),z}fromJSON(z){return super.fromJSON(z),this.v0.fromArray(z.v0),this.v1.fromArray(z.v1),this.v2.fromArray(z.v2),this.v3.fromArray(z.v3),this}}class l6 extends $Q{constructor(z=new R,J=new R,Q=new R,$=new R){super();this.isCubicBezierCurve3=!0,this.type="CubicBezierCurve3",this.v0=z,this.v1=J,this.v2=Q,this.v3=$}getPoint(z,J=new R){let Q=J,$=this.v0,K=this.v1,W=this.v2,q=this.v3;return Q.set(A1(z,$.x,K.x,W.x,q.x),A1(z,$.y,K.y,W.y,q.y),A1(z,$.z,K.z,W.z,q.z)),Q}copy(z){return super.copy(z),this.v0.copy(z.v0),this.v1.copy(z.v1),this.v2.copy(z.v2),this.v3.copy(z.v3),this}toJSON(){let z=super.toJSON();return z.v0=this.v0.toArray(),z.v1=this.v1.toArray(),z.v2=this.v2.toArray(),z.v3=this.v3.toArray(),z}fromJSON(z){return super.fromJSON(z),this.v0.fromArray(z.v0),this.v1.fromArray(z.v1),this.v2.fromArray(z.v2),this.v3.fromArray(z.v3),this}}class e2 extends $Q{constructor(z=new a,J=new a){super();this.isLineCurve=!0,this.type="LineCurve",this.v1=z,this.v2=J}getPoint(z,J=new a){let Q=J;if(z===1)Q.copy(this.v2);else Q.copy(this.v2).sub(this.v1),Q.multiplyScalar(z).add(this.v1);return Q}getPointAt(z,J){return this.getPoint(z,J)}getTangent(z,J=new a){return J.subVectors(this.v2,this.v1).normalize()}getTangentAt(z,J){return this.getTangent(z,J)}copy(z){return super.copy(z),this.v1.copy(z.v1),this.v2.copy(z.v2),this}toJSON(){let z=super.toJSON();return z.v1=this.v1.toArray(),z.v2=this.v2.toArray(),z}fromJSON(z){return super.fromJSON(z),this.v1.fromArray(z.v1),this.v2.fromArray(z.v2),this}}class m6 extends $Q{constructor(z=new R,J=new R){super();this.isLineCurve3=!0,this.type="LineCurve3",this.v1=z,this.v2=J}getPoint(z,J=new R){let Q=J;if(z===1)Q.copy(this.v2);else Q.copy(this.v2).sub(this.v1),Q.multiplyScalar(z).add(this.v1);return Q}getPointAt(z,J){return this.getPoint(z,J)}getTangent(z,J=new R){return J.subVectors(this.v2,this.v1).normalize()}getTangentAt(z,J){return this.getTangent(z,J)}copy(z){return super.copy(z),this.v1.copy(z.v1),this.v2.copy(z.v2),this}toJSON(){let z=super.toJSON();return z.v1=this.v1.toArray(),z.v2=this.v2.toArray(),z}fromJSON(z){return super.fromJSON(z),this.v1.fromArray(z.v1),this.v2.fromArray(z.v2),this}}class z5 extends $Q{constructor(z=new a,J=new a,Q=new a){super();this.isQuadraticBezierCurve=!0,this.type="QuadraticBezierCurve",this.v0=z,this.v1=J,this.v2=Q}getPoint(z,J=new a){let Q=J,$=this.v0,K=this.v1,W=this.v2;return Q.set(I1(z,$.x,K.x,W.x),I1(z,$.y,K.y,W.y)),Q}copy(z){return super.copy(z),this.v0.copy(z.v0),this.v1.copy(z.v1),this.v2.copy(z.v2),this}toJSON(){let z=super.toJSON();return z.v0=this.v0.toArray(),z.v1=this.v1.toArray(),z.v2=this.v2.toArray(),z}fromJSON(z){return super.fromJSON(z),this.v0.fromArray(z.v0),this.v1.fromArray(z.v1),this.v2.fromArray(z.v2),this}}class J5 extends $Q{constructor(z=new R,J=new R,Q=new R){super();this.isQuadraticBezierCurve3=!0,this.type="QuadraticBezierCurve3",this.v0=z,this.v1=J,this.v2=Q}getPoint(z,J=new R){let Q=J,$=this.v0,K=this.v1,W=this.v2;return Q.set(I1(z,$.x,K.x,W.x),I1(z,$.y,K.y,W.y),I1(z,$.z,K.z,W.z)),Q}copy(z){return super.copy(z),this.v0.copy(z.v0),this.v1.copy(z.v1),this.v2.copy(z.v2),this}toJSON(){let z=super.toJSON();return z.v0=this.v0.toArray(),z.v1=this.v1.toArray(),z.v2=this.v2.toArray(),z}fromJSON(z){return super.fromJSON(z),this.v0.fromArray(z.v0),this.v1.fromArray(z.v1),this.v2.fromArray(z.v2),this}}class Q5 extends $Q{constructor(z=[]){super();this.isSplineCurve=!0,this.type="SplineCurve",this.points=z}getPoint(z,J=new a){let Q=J,$=this.points,K=($.length-1)*z,W=Math.floor(K),q=K-W,B=$[W===0?W:W-1],G=$[W],N=$[W>$.length-2?$.length-1:W+1],Z=$[W>$.length-3?$.length-1:W+2];return Q.set(X8(q,B.x,G.x,N.x,Z.x),X8(q,B.y,G.y,N.y,Z.y)),Q}copy(z){super.copy(z),this.points=[];for(let J=0,Q=z.points.length;J<Q;J++){let $=z.points[J];this.points.push($.clone())}return this}toJSON(){let z=super.toJSON();z.points=[];for(let J=0,Q=this.points.length;J<Q;J++){let $=this.points[J];z.points.push($.toArray())}return z}fromJSON(z){super.fromJSON(z),this.points=[];for(let J=0,Q=z.points.length;J<Q;J++){let $=z.points[J];this.points.push(new a().fromArray($))}return this}}var x2=Object.freeze({__proto__:null,ArcCurve:p6,CatmullRomCurve3:g6,CubicBezierCurve:r2,CubicBezierCurve3:l6,EllipseCurve:h1,LineCurve:e2,LineCurve3:m6,QuadraticBezierCurve:z5,QuadraticBezierCurve3:J5,SplineCurve:Q5});class c6 extends $Q{constructor(){super();this.type="CurvePath",this.curves=[],this.autoClose=!1}add(z){this.curves.push(z)}closePath(){let z=this.curves[0].getPoint(0),J=this.curves[this.curves.length-1].getPoint(1);if(!z.equals(J)){let Q=z.isVector2===!0?"LineCurve":"LineCurve3";this.curves.push(new x2[Q](J,z))}return this}getPoint(z,J){let Q=z*this.getLength(),$=this.getCurveLengths(),K=0;while(K<$.length){if($[K]>=Q){let W=$[K]-Q,q=this.curves[K],B=q.getLength(),G=B===0?0:1-W/B;return q.getPointAt(G,J)}K++}return null}getLength(){let z=this.getCurveLengths();return z[z.length-1]}updateArcLengths(){this.needsUpdate=!0,this.cacheLengths=null,this.getCurveLengths()}getCurveLengths(){if(this.cacheLengths&&this.cacheLengths.length===this.curves.length)return this.cacheLengths;let z=[],J=0;for(let Q=0,$=this.curves.length;Q<$;Q++)J+=this.curves[Q].getLength(),z.push(J);return this.cacheLengths=z,z}getSpacedPoints(z=40){let J=[];for(let Q=0;Q<=z;Q++)J.push(this.getPoint(Q/z));if(this.autoClose)J.push(J[0]);return J}getPoints(z=12){let J=[],Q;for(let $=0,K=this.curves;$<K.length;$++){let W=K[$],q=W.isEllipseCurve?z*2:W.isLineCurve||W.isLineCurve3?1:W.isSplineCurve?z*W.points.length:z,B=W.getPoints(q);for(let G=0;G<B.length;G++){let N=B[G];if(Q&&Q.equals(N))continue;J.push(N),Q=N}}if(this.autoClose&&J.length>1&&!J[J.length-1].equals(J[0]))J.push(J[0]);return J}copy(z){super.copy(z),this.curves=[];for(let J=0,Q=z.curves.length;J<Q;J++){let $=z.curves[J];this.curves.push($.clone())}return this.autoClose=z.autoClose,this}toJSON(){let z=super.toJSON();z.autoClose=this.autoClose,z.curves=[];for(let J=0,Q=this.curves.length;J<Q;J++){let $=this.curves[J];z.curves.push($.toJSON())}return z}fromJSON(z){super.fromJSON(z),this.autoClose=z.autoClose,this.curves=[];for(let J=0,Q=z.curves.length;J<Q;J++){let $=z.curves[J];this.curves.push(new x2[$.type]().fromJSON($))}return this}}class m0 extends c6{constructor(z){super();if(this.type="Path",this.currentPoint=new a,z)this.setFromPoints(z)}setFromPoints(z){this.moveTo(z[0].x,z[0].y);for(let J=1,Q=z.length;J<Q;J++)this.lineTo(z[J].x,z[J].y);return this}moveTo(z,J){return this.currentPoint.set(z,J),this}lineTo(z,J){let Q=new e2(this.currentPoint.clone(),new a(z,J));return this.curves.push(Q),this.currentPoint.set(z,J),this}quadraticCurveTo(z,J,Q,$){let K=new z5(this.currentPoint.clone(),new a(z,J),new a(Q,$));return this.curves.push(K),this.currentPoint.set(Q,$),this}bezierCurveTo(z,J,Q,$,K,W){let q=new r2(this.currentPoint.clone(),new a(z,J),new a(Q,$),new a(K,W));return this.curves.push(q),this.currentPoint.set(K,W),this}splineThru(z){let J=[this.currentPoint.clone()].concat(z),Q=new Q5(J);return this.curves.push(Q),this.currentPoint.copy(z[z.length-1]),this}arc(z,J,Q,$,K,W){let q=this.currentPoint.x,B=this.currentPoint.y;return this.absarc(z+q,J+B,Q,$,K,W),this}absarc(z,J,Q,$,K,W){return this.absellipse(z,J,Q,Q,$,K,W),this}ellipse(z,J,Q,$,K,W,q,B){let G=this.currentPoint.x,N=this.currentPoint.y;return this.absellipse(z+G,J+N,Q,$,K,W,q,B),this}absellipse(z,J,Q,$,K,W,q,B){let G=new h1(z,J,Q,$,K,W,q,B);if(this.curves.length>0){let Z=G.getPoint(0);if(!Z.equals(this.currentPoint))this.lineTo(Z.x,Z.y)}this.curves.push(G);let N=G.getPoint(1);return this.currentPoint.copy(N),this}copy(z){return super.copy(z),this.currentPoint.copy(z.currentPoint),this}toJSON(){let z=super.toJSON();return z.currentPoint=this.currentPoint.toArray(),z}fromJSON(z){return super.fromJSON(z),this.currentPoint.fromArray(z.currentPoint),this}}class a0 extends m0{constructor(z){super(z);this.uuid=aJ(),this.type="Shape",this.holes=[]}getPointsHoles(z){let J=[];for(let Q=0,$=this.holes.length;Q<$;Q++)J[Q]=this.holes[Q].getPoints(z);return J}extractPoints(z){return{shape:this.getPoints(z),holes:this.getPointsHoles(z)}}copy(z){super.copy(z),this.holes=[];for(let J=0,Q=z.holes.length;J<Q;J++){let $=z.holes[J];this.holes.push($.clone())}return this}toJSON(){let z=super.toJSON();z.uuid=this.uuid,z.holes=[];for(let J=0,Q=this.holes.length;J<Q;J++){let $=this.holes[J];z.holes.push($.toJSON())}return z}fromJSON(z){super.fromJSON(z),this.uuid=z.uuid,this.holes=[];for(let J=0,Q=z.holes.length;J<Q;J++){let $=z.holes[J];this.holes.push(new m0().fromJSON($))}return this}}function VW(z,J,Q=2){let $=J&&J.length,K=$?J[0]*Q:z.length,W=T9(z,0,K,Q,!0),q=[];if(!W||W.next===W.prev)return q;let B,G,N;if($)W=IW(z,J,W,Q);if(z.length>80*Q){B=z[0],G=z[1];let Z=B,H=G;for(let D=Q;D<K;D+=Q){let U=z[D],X=z[D+1];if(U<B)B=U;if(X<G)G=X;if(U>Z)Z=U;if(X>H)H=X}N=Math.max(Z-B,H-G),N=N!==0?32767/N:0}return L1(W,q,Q,B,G,N,0),q}function T9(z,J,Q,$,K){let W;if(K===PW(z,J,Q,$)>0)for(let q=J;q<Q;q+=$)W=k8(q/$|0,z[q],z[q+1],W);else for(let q=Q-$;q>=J;q-=$)W=k8(q/$|0,z[q],z[q+1],W);if(W&&c0(W,W.next))S1(W),W=W.next;return W}function V0(z,J){if(!z)return z;if(!J)J=z;let Q=z,$;do if($=!1,!Q.steiner&&(c0(Q,Q.next)||XJ(Q.prev,Q,Q.next)===0)){if(S1(Q),Q=J=Q.prev,Q===Q.next)break;$=!0}else Q=Q.next;while($||Q!==J);return J}function L1(z,J,Q,$,K,W,q){if(!z)return;if(!q&&W)LW(z,$,K,W);let B=z;while(z.prev!==z.next){let{prev:G,next:N}=z;if(W?XW(z,$,K,W):YW(z)){J.push(G.i,z.i,N.i),S1(z),z=N.next,B=N.next;continue}if(z=N,z===B){if(!q)L1(V0(z),J,Q,$,K,W,1);else if(q===1)z=kW(V0(z),J),L1(z,J,Q,$,K,W,2);else if(q===2)EW(z,J,Q,$,K,W);break}}}function YW(z){let J=z.prev,Q=z,$=z.next;if(XJ(J,Q,$)>=0)return!1;let K=J.x,W=Q.x,q=$.x,B=J.y,G=Q.y,N=$.y,Z=Math.min(K,W,q),H=Math.min(B,G,N),D=Math.max(K,W,q),U=Math.max(B,G,N),X=$.next;while(X!==J){if(X.x>=Z&&X.x<=D&&X.y>=H&&X.y<=U&&Y1(K,B,W,G,q,N,X.x,X.y)&&XJ(X.prev,X,X.next)>=0)return!1;X=X.next}return!0}function XW(z,J,Q,$){let K=z.prev,W=z,q=z.next;if(XJ(K,W,q)>=0)return!1;let B=K.x,G=W.x,N=q.x,Z=K.y,H=W.y,D=q.y,U=Math.min(B,G,N),X=Math.min(Z,H,D),k=Math.max(B,G,N),Y=Math.max(Z,H,D),V=A6(U,X,J,Q,$),L=A6(k,Y,J,Q,$),O=z.prevZ,I=z.nextZ;while(O&&O.z>=V&&I&&I.z<=L){if(O.x>=U&&O.x<=k&&O.y>=X&&O.y<=Y&&O!==K&&O!==q&&Y1(B,Z,G,H,N,D,O.x,O.y)&&XJ(O.prev,O,O.next)>=0)return!1;if(O=O.prevZ,I.x>=U&&I.x<=k&&I.y>=X&&I.y<=Y&&I!==K&&I!==q&&Y1(B,Z,G,H,N,D,I.x,I.y)&&XJ(I.prev,I,I.next)>=0)return!1;I=I.nextZ}while(O&&O.z>=V){if(O.x>=U&&O.x<=k&&O.y>=X&&O.y<=Y&&O!==K&&O!==q&&Y1(B,Z,G,H,N,D,O.x,O.y)&&XJ(O.prev,O,O.next)>=0)return!1;O=O.prevZ}while(I&&I.z<=L){if(I.x>=U&&I.x<=k&&I.y>=X&&I.y<=Y&&I!==K&&I!==q&&Y1(B,Z,G,H,N,D,I.x,I.y)&&XJ(I.prev,I,I.next)>=0)return!1;I=I.nextZ}return!0}function kW(z,J){let Q=z;do{let $=Q.prev,K=Q.next.next;if(!c0($,K)&&x9($,Q,Q.next,K)&&y1($,K)&&y1(K,$))J.push($.i,Q.i,K.i),S1(Q),S1(Q.next),Q=z=K;Q=Q.next}while(Q!==z);return V0(Q)}function EW(z,J,Q,$,K,W){let q=z;do{let B=q.next.next;while(B!==q.prev){if(q.i!==B.i&&wW(q,B)){let G=j9(q,B);q=V0(q,q.next),G=V0(G,G.next),L1(q,J,Q,$,K,W,0),L1(G,J,Q,$,K,W,0);return}B=B.next}q=q.next}while(q!==z)}function IW(z,J,Q,$){let K=[];for(let W=0,q=J.length;W<q;W++){let B=J[W]*$,G=W<q-1?J[W+1]*$:z.length,N=T9(z,B,G,$,!1);if(N===N.next)N.steiner=!0;K.push(SW(N))}K.sort(AW);for(let W=0;W<K.length;W++)Q=OW(K[W],Q);return Q}function AW(z,J){let Q=z.x-J.x;if(Q===0){if(Q=z.y-J.y,Q===0){let $=(z.next.y-z.y)/(z.next.x-z.x),K=(J.next.y-J.y)/(J.next.x-J.x);Q=$-K}}return Q}function OW(z,J){let Q=FW(z,J);if(!Q)return J;let $=j9(Q,z);return V0($,$.next),V0(Q,Q.next)}function FW(z,J){let Q=J,$=z.x,K=z.y,W=-1/0,q;if(c0(z,Q))return Q;do{if(c0(z,Q.next))return Q.next;else if(K<=Q.y&&K>=Q.next.y&&Q.next.y!==Q.y){let H=Q.x+(K-Q.y)*(Q.next.x-Q.x)/(Q.next.y-Q.y);if(H<=$&&H>W){if(W=H,q=Q.x<Q.next.x?Q:Q.next,H===$)return q}}Q=Q.next}while(Q!==J);if(!q)return null;let B=q,G=q.x,N=q.y,Z=1/0;Q=q;do{if($>=Q.x&&Q.x>=G&&$!==Q.x&&h9(K<N?$:W,K,G,N,K<N?W:$,K,Q.x,Q.y)){let H=Math.abs(K-Q.y)/($-Q.x);if(y1(Q,z)&&(H<Z||H===Z&&(Q.x>q.x||Q.x===q.x&&MW(q,Q))))q=Q,Z=H}Q=Q.next}while(Q!==B);return q}function MW(z,J){return XJ(z.prev,z,J.prev)<0&&XJ(J.next,z,z.next)<0}function LW(z,J,Q,$){let K=z;do{if(K.z===0)K.z=A6(K.x,K.y,J,Q,$);K.prevZ=K.prev,K.nextZ=K.next,K=K.next}while(K!==z);K.prevZ.nextZ=null,K.prevZ=null,yW(K)}function yW(z){let J,Q=1;do{let $=z,K;z=null;let W=null;J=0;while($){J++;let q=$,B=0;for(let N=0;N<Q;N++)if(B++,q=q.nextZ,!q)break;let G=Q;while(B>0||G>0&&q){if(B!==0&&(G===0||!q||$.z<=q.z))K=$,$=$.nextZ,B--;else K=q,q=q.nextZ,G--;if(W)W.nextZ=K;else z=K;K.prevZ=W,W=K}$=q}W.nextZ=null,Q*=2}while(J>1);return z}function A6(z,J,Q,$,K){return z=(z-Q)*K|0,J=(J-$)*K|0,z=(z|z<<8)&16711935,z=(z|z<<4)&252645135,z=(z|z<<2)&858993459,z=(z|z<<1)&1431655765,J=(J|J<<8)&16711935,J=(J|J<<4)&252645135,J=(J|J<<2)&858993459,J=(J|J<<1)&1431655765,z|J<<1}function SW(z){let J=z,Q=z;do{if(J.x<Q.x||J.x===Q.x&&J.y<Q.y)Q=J;J=J.next}while(J!==z);return Q}function h9(z,J,Q,$,K,W,q,B){return(K-q)*(J-B)>=(z-q)*(W-B)&&(z-q)*($-B)>=(Q-q)*(J-B)&&(Q-q)*(W-B)>=(K-q)*($-B)}function Y1(z,J,Q,$,K,W,q,B){return!(z===q&&J===B)&&h9(z,J,Q,$,K,W,q,B)}function wW(z,J){return z.next.i!==J.i&&z.prev.i!==J.i&&!CW(z,J)&&(y1(z,J)&&y1(J,z)&&RW(z,J)&&(XJ(z.prev,z,J.prev)||XJ(z,J.prev,J))||c0(z,J)&&XJ(z.prev,z,z.next)>0&&XJ(J.prev,J,J.next)>0)}function XJ(z,J,Q){return(J.y-z.y)*(Q.x-J.x)-(J.x-z.x)*(Q.y-J.y)}function c0(z,J){return z.x===J.x&&z.y===J.y}function x9(z,J,Q,$){let K=O2(XJ(z,J,Q)),W=O2(XJ(z,J,$)),q=O2(XJ(Q,$,z)),B=O2(XJ(Q,$,J));if(K!==W&&q!==B)return!0;if(K===0&&A2(z,Q,J))return!0;if(W===0&&A2(z,$,J))return!0;if(q===0&&A2(Q,z,$))return!0;if(B===0&&A2(Q,J,$))return!0;return!1}function A2(z,J,Q){return J.x<=Math.max(z.x,Q.x)&&J.x>=Math.min(z.x,Q.x)&&J.y<=Math.max(z.y,Q.y)&&J.y>=Math.min(z.y,Q.y)}function O2(z){return z>0?1:z<0?-1:0}function CW(z,J){let Q=z;do{if(Q.i!==z.i&&Q.next.i!==z.i&&Q.i!==J.i&&Q.next.i!==J.i&&x9(Q,Q.next,z,J))return!0;Q=Q.next}while(Q!==z);return!1}function y1(z,J){return XJ(z.prev,z,z.next)<0?XJ(z,J,z.next)>=0&&XJ(z,z.prev,J)>=0:XJ(z,J,z.prev)<0||XJ(z,z.next,J)<0}function RW(z,J){let Q=z,$=!1,K=(z.x+J.x)/2,W=(z.y+J.y)/2;do{if(Q.y>W!==Q.next.y>W&&Q.next.y!==Q.y&&K<(Q.next.x-Q.x)*(W-Q.y)/(Q.next.y-Q.y)+Q.x)$=!$;Q=Q.next}while(Q!==z);return $}function j9(z,J){let Q=O6(z.i,z.x,z.y),$=O6(J.i,J.x,J.y),K=z.next,W=J.prev;return z.next=J,J.prev=z,Q.next=K,K.prev=Q,$.next=Q,Q.prev=$,W.next=$,$.prev=W,$}function k8(z,J,Q,$){let K=O6(z,J,Q);if(!$)K.prev=K,K.next=K;else K.next=$.next,K.prev=$,$.next.prev=K,$.next=K;return K}function S1(z){if(z.next.prev=z.prev,z.prev.next=z.next,z.prevZ)z.prevZ.nextZ=z.nextZ;if(z.nextZ)z.nextZ.prevZ=z.prevZ}function O6(z,J,Q){return{i:z,x:J,y:Q,prev:null,next:null,z:0,prevZ:null,nextZ:null,steiner:!1}}function PW(z,J,Q,$){let K=0;for(let W=J,q=Q-$;W<Q;W+=$)K+=(z[q]-z[W])*(z[W+1]+z[q+1]),q=W;return K}class _9{static triangulate(z,J,Q=2){return VW(z,J,Q)}}class GQ{static area(z){let J=z.length,Q=0;for(let $=J-1,K=0;K<J;$=K++)Q+=z[$].x*z[K].y-z[K].x*z[$].y;return Q*0.5}static isClockWise(z){return GQ.area(z)<0}static triangulateShape(z,J){let Q=[],$=[],K=[];E8(z),I8(Q,z);let W=z.length;J.forEach(E8);for(let B=0;B<J.length;B++)$.push(W),W+=J[B].length,I8(Q,J[B]);let q=_9.triangulate(Q,$);for(let B=0;B<q.length;B+=3)K.push(q.slice(B,B+3));return K}}function E8(z){let J=z.length;if(J>2&&z[J-1].equals(z[0]))z.pop()}function I8(z,J){for(let Q=0;Q<J.length;Q++)z.push(J[Q].x),z.push(J[Q].y)}class $5 extends mz{constructor(z=new a0([new a(0.5,0.5),new a(-0.5,0.5),new a(-0.5,-0.5),new a(0.5,-0.5)]),J={}){super();this.type="ExtrudeGeometry",this.parameters={shapes:z,options:J},z=Array.isArray(z)?z:[z];let Q=this,$=[],K=[];for(let q=0,B=z.length;q<B;q++){let G=z[q];W(G)}this.setAttribute("position",new Sz($,3)),this.setAttribute("uv",new Sz(K,2)),this.computeVertexNormals();function W(q){let B=[],G=J.curveSegments!==void 0?J.curveSegments:12,N=J.steps!==void 0?J.steps:1,Z=J.depth!==void 0?J.depth:1,H=J.bevelEnabled!==void 0?J.bevelEnabled:!0,D=J.bevelThickness!==void 0?J.bevelThickness:0.2,U=J.bevelSize!==void 0?J.bevelSize:D-0.1,X=J.bevelOffset!==void 0?J.bevelOffset:0,k=J.bevelSegments!==void 0?J.bevelSegments:3,Y=J.extrudePath,V=J.UVGenerator!==void 0?J.UVGenerator:vW,L,O=!1,I,S,w,C;if(Y){L=Y.getSpacedPoints(N),O=!0,H=!1;let r=Y.isCatmullRomCurve3?Y.closed:!1;I=Y.computeFrenetFrames(N,r),S=new R,w=new R,C=new R}if(!H)k=0,D=0,U=0,X=0;let E=q.extractPoints(G),F=E.shape,x=E.holes;if(!GQ.isClockWise(F)){F=F.reverse();for(let r=0,Qz=x.length;r<Qz;r++){let Jz=x[r];if(GQ.isClockWise(Jz))x[r]=Jz.reverse()}}function p(r){let Ez=r[0];for(let Mz=1;Mz<=r.length;Mz++){let vz=Mz%r.length,Tz=r[vz],cz=Tz.x-Ez.x,nz=Tz.y-Ez.y,v=cz*cz+nz*nz,UJ=Math.max(Math.abs(Tz.x),Math.abs(Tz.y),Math.abs(Ez.x),Math.abs(Ez.y)),ez=0.000000000000000000010000000000000001*UJ*UJ;if(v<=ez){r.splice(vz,1),Mz--;continue}Ez=Tz}}p(F),x.forEach(p);let n=x.length,j=F;for(let r=0;r<n;r++){let Qz=x[r];F=F.concat(Qz)}function m(r,Qz,Jz){if(!Qz)Pz("ExtrudeGeometry: vec does not exist");return r.clone().addScaledVector(Qz,Jz)}let l=F.length;function _(r,Qz,Jz){let Ez,Mz,vz,Tz=r.x-Qz.x,cz=r.y-Qz.y,nz=Jz.x-r.x,v=Jz.y-r.y,UJ=Tz*Tz+cz*cz,ez=Tz*v-cz*nz;if(Math.abs(ez)>Number.EPSILON){let tz=Math.sqrt(UJ),y=Math.sqrt(nz*nz+v*v),A=Qz.x-cz/tz,f=Qz.y+Tz/tz,u=Jz.x-v/y,e=Jz.y+nz/y,Kz=((u-A)*v-(e-f)*nz)/(Tz*v-cz*nz);Ez=A+Tz*Kz-r.x,Mz=f+cz*Kz-r.y;let Dz=Ez*Ez+Mz*Mz;if(Dz<=2)return new a(Ez,Mz);else vz=Math.sqrt(Dz/2)}else{let tz=!1;if(Tz>Number.EPSILON){if(nz>Number.EPSILON)tz=!0}else if(Tz<-Number.EPSILON){if(nz<-Number.EPSILON)tz=!0}else if(Math.sign(cz)===Math.sign(v))tz=!0;if(tz)Ez=-cz,Mz=Tz,vz=Math.sqrt(UJ);else Ez=Tz,Mz=cz,vz=Math.sqrt(UJ/2)}return new a(Ez/vz,Mz/vz)}let t=[];for(let r=0,Qz=j.length,Jz=Qz-1,Ez=r+1;r<Qz;r++,Jz++,Ez++){if(Jz===Qz)Jz=0;if(Ez===Qz)Ez=0;t[r]=_(j[r],j[Jz],j[Ez])}let $z=[],qz,Cz=t.concat();for(let r=0,Qz=n;r<Qz;r++){let Jz=x[r];qz=[];for(let Ez=0,Mz=Jz.length,vz=Mz-1,Tz=Ez+1;Ez<Mz;Ez++,vz++,Tz++){if(vz===Mz)vz=0;if(Tz===Mz)Tz=0;qz[Ez]=_(Jz[Ez],Jz[vz],Jz[Tz])}$z.push(qz),Cz=Cz.concat(qz)}let Az;if(k===0)Az=GQ.triangulateShape(j,x);else{let r=[],Qz=[];for(let Jz=0;Jz<k;Jz++){let Ez=Jz/k,Mz=D*Math.cos(Ez*Math.PI/2),vz=U*Math.sin(Ez*Math.PI/2)+X;for(let Tz=0,cz=j.length;Tz<cz;Tz++){let nz=m(j[Tz],t[Tz],vz);if(Zz(nz.x,nz.y,-Mz),Ez===0)r.push(nz)}for(let Tz=0,cz=n;Tz<cz;Tz++){let nz=x[Tz];qz=$z[Tz];let v=[];for(let UJ=0,ez=nz.length;UJ<ez;UJ++){let tz=m(nz[UJ],qz[UJ],vz);if(Zz(tz.x,tz.y,-Mz),Ez===0)v.push(tz)}if(Ez===0)Qz.push(v)}}Az=GQ.triangulateShape(r,Qz)}let NJ=Az.length,qJ=U+X;for(let r=0;r<l;r++){let Qz=H?m(F[r],Cz[r],qJ):F[r];if(!O)Zz(Qz.x,Qz.y,0);else w.copy(I.normals[0]).multiplyScalar(Qz.x),S.copy(I.binormals[0]).multiplyScalar(Qz.y),C.copy(L[0]).add(w).add(S),Zz(C.x,C.y,C.z)}for(let r=1;r<=N;r++)for(let Qz=0;Qz<l;Qz++){let Jz=H?m(F[Qz],Cz[Qz],qJ):F[Qz];if(!O)Zz(Jz.x,Jz.y,Z/N*r);else w.copy(I.normals[r]).multiplyScalar(Jz.x),S.copy(I.binormals[r]).multiplyScalar(Jz.y),C.copy(L[r]).add(w).add(S),Zz(C.x,C.y,C.z)}for(let r=k-1;r>=0;r--){let Qz=r/k,Jz=D*Math.cos(Qz*Math.PI/2),Ez=U*Math.sin(Qz*Math.PI/2)+X;for(let Mz=0,vz=j.length;Mz<vz;Mz++){let Tz=m(j[Mz],t[Mz],Ez);Zz(Tz.x,Tz.y,Z+Jz)}for(let Mz=0,vz=x.length;Mz<vz;Mz++){let Tz=x[Mz];qz=$z[Mz];for(let cz=0,nz=Tz.length;cz<nz;cz++){let v=m(Tz[cz],qz[cz],Ez);if(!O)Zz(v.x,v.y,Z+Jz);else Zz(v.x,v.y+L[N-1].y,L[N-1].x+Jz)}}}s(),Gz();function s(){let r=$.length/3;if(H){let Qz=0,Jz=l*Qz;for(let Ez=0;Ez<NJ;Ez++){let Mz=Az[Ez];jz(Mz[2]+Jz,Mz[1]+Jz,Mz[0]+Jz)}Qz=N+k*2,Jz=l*Qz;for(let Ez=0;Ez<NJ;Ez++){let Mz=Az[Ez];jz(Mz[0]+Jz,Mz[1]+Jz,Mz[2]+Jz)}}else{for(let Qz=0;Qz<NJ;Qz++){let Jz=Az[Qz];jz(Jz[2],Jz[1],Jz[0])}for(let Qz=0;Qz<NJ;Qz++){let Jz=Az[Qz];jz(Jz[0]+l*N,Jz[1]+l*N,Jz[2]+l*N)}}Q.addGroup(r,$.length/3-r,0)}function Gz(){let r=$.length/3,Qz=0;Oz(j,Qz),Qz+=j.length;for(let Jz=0,Ez=x.length;Jz<Ez;Jz++){let Mz=x[Jz];Oz(Mz,Qz),Qz+=Mz.length}Q.addGroup(r,$.length/3-r,1)}function Oz(r,Qz){let Jz=r.length;while(--Jz>=0){let Ez=Jz,Mz=Jz-1;if(Mz<0)Mz=r.length-1;for(let vz=0,Tz=N+k*2;vz<Tz;vz++){let cz=l*vz,nz=l*(vz+1),v=Qz+Ez+cz,UJ=Qz+Mz+cz,ez=Qz+Mz+nz,tz=Qz+Ez+nz;JJ(v,UJ,ez,tz)}}}function Zz(r,Qz,Jz){B.push(r),B.push(Qz),B.push(Jz)}function jz(r,Qz,Jz){uz(r),uz(Qz),uz(Jz);let Ez=$.length/3,Mz=V.generateTopUV(Q,$,Ez-3,Ez-2,Ez-1);gz(Mz[0]),gz(Mz[1]),gz(Mz[2])}function JJ(r,Qz,Jz,Ez){uz(r),uz(Qz),uz(Ez),uz(Qz),uz(Jz),uz(Ez);let Mz=$.length/3,vz=V.generateSideWallUV(Q,$,Mz-6,Mz-3,Mz-2,Mz-1);gz(vz[0]),gz(vz[1]),gz(vz[3]),gz(vz[1]),gz(vz[2]),gz(vz[3])}function uz(r){$.push(B[r*3+0]),$.push(B[r*3+1]),$.push(B[r*3+2])}function gz(r){K.push(r.x),K.push(r.y)}}}copy(z){return super.copy(z),this.parameters=Object.assign({},z.parameters),this}toJSON(){let z=super.toJSON(),J=this.parameters.shapes,Q=this.parameters.options;return fW(J,Q,z)}static fromJSON(z,J){let Q=[];for(let K=0,W=z.shapes.length;K<W;K++){let q=J[z.shapes[K]];Q.push(q)}let $=z.options.extrudePath;if($!==void 0)z.options.extrudePath=new x2[$.type]().fromJSON($);return new $5(Q,z.options)}}var vW={generateTopUV:function(z,J,Q,$,K){let W=J[Q*3],q=J[Q*3+1],B=J[$*3],G=J[$*3+1],N=J[K*3],Z=J[K*3+1];return[new a(W,q),new a(B,G),new a(N,Z)]},generateSideWallUV:function(z,J,Q,$,K,W){let q=J[Q*3],B=J[Q*3+1],G=J[Q*3+2],N=J[$*3],Z=J[$*3+1],H=J[$*3+2],D=J[K*3],U=J[K*3+1],X=J[K*3+2],k=J[W*3],Y=J[W*3+1],V=J[W*3+2];if(Math.abs(B-Z)<Math.abs(q-N))return[new a(q,1-G),new a(N,1-H),new a(D,1-X),new a(k,1-V)];else return[new a(B,1-G),new a(Z,1-H),new a(U,1-X),new a(Y,1-V)]}};function fW(z,J,Q){if(Q.shapes=[],Array.isArray(z))for(let $=0,K=z.length;$<K;$++){let W=z[$];Q.shapes.push(W.uuid)}else Q.shapes.push(z.uuid);if(Q.options=Object.assign({},J),J.extrudePath!==void 0)Q.options.extrudePath=J.extrudePath.toJSON();return Q}class K5 extends nQ{constructor(z=1,J=0){let Q=(1+Math.sqrt(5))/2,$=[-1,Q,0,1,Q,0,-1,-Q,0,1,-Q,0,0,-1,Q,0,1,Q,0,-1,-Q,0,1,-Q,Q,0,-1,Q,0,1,-Q,0,-1,-Q,0,1],K=[0,11,5,0,5,1,0,1,7,0,7,10,0,10,11,1,5,9,5,11,4,11,10,2,10,7,6,7,1,8,3,9,4,3,4,2,3,2,6,3,6,8,3,8,9,4,9,5,2,4,11,6,2,10,8,6,7,9,8,1];super($,K,z,J);this.type="IcosahedronGeometry",this.parameters={radius:z,detail:J}}static fromJSON(z){return new K5(z.radius,z.detail)}}class W5 extends mz{constructor(z=[new a(0,-0.5),new a(0.5,0),new a(0,0.5)],J=12,Q=0,$=Math.PI*2){super();this.type="LatheGeometry",this.parameters={points:z,segments:J,phiStart:Q,phiLength:$},J=Math.floor(J),$=dz($,0,Math.PI*2);let K=[],W=[],q=[],B=[],G=[],N=1/J,Z=new R,H=new a,D=new R,U=new R,X=new R,k=0,Y=0;for(let V=0;V<=z.length-1;V++)switch(V){case 0:k=z[V+1].x-z[V].x,Y=z[V+1].y-z[V].y,D.x=Y*1,D.y=-k,D.z=Y*0,X.copy(D),D.normalize(),B.push(D.x,D.y,D.z);break;case z.length-1:B.push(X.x,X.y,X.z);break;default:k=z[V+1].x-z[V].x,Y=z[V+1].y-z[V].y,D.x=Y*1,D.y=-k,D.z=Y*0,U.copy(D),D.x+=X.x,D.y+=X.y,D.z+=X.z,D.normalize(),B.push(D.x,D.y,D.z),X.copy(U)}for(let V=0;V<=J;V++){let L=Q+V*N*$,O=Math.sin(L),I=Math.cos(L);for(let S=0;S<=z.length-1;S++){Z.x=z[S].x*O,Z.y=z[S].y,Z.z=z[S].x*I,W.push(Z.x,Z.y,Z.z),H.x=V/J,H.y=S/(z.length-1),q.push(H.x,H.y);let w=B[3*S+0]*O,C=B[3*S+1],E=B[3*S+0]*I;G.push(w,C,E)}}for(let V=0;V<J;V++)for(let L=0;L<z.length-1;L++){let O=L+V*z.length,I=O,S=O+z.length,w=O+z.length+1,C=O+1;K.push(I,S,C),K.push(w,C,S)}this.setIndex(K),this.setAttribute("position",new Sz(W,3)),this.setAttribute("uv",new Sz(q,2)),this.setAttribute("normal",new Sz(G,3))}copy(z){return super.copy(z),this.parameters=Object.assign({},z.parameters),this}static fromJSON(z){return new W5(z.points,z.segments,z.phiStart,z.phiLength)}}class x1 extends nQ{constructor(z=1,J=0){let Q=[1,0,0,-1,0,0,0,1,0,0,-1,0,0,0,1,0,0,-1],$=[0,2,4,0,4,3,0,3,5,0,5,2,1,2,5,1,5,3,1,3,4,1,4,2];super(Q,$,z,J);this.type="OctahedronGeometry",this.parameters={radius:z,detail:J}}static fromJSON(z){return new x1(z.radius,z.detail)}}class t0 extends mz{constructor(z=1,J=1,Q=1,$=1){super();this.type="PlaneGeometry",this.parameters={width:z,height:J,widthSegments:Q,heightSegments:$};let K=z/2,W=J/2,q=Math.floor(Q),B=Math.floor($),G=q+1,N=B+1,Z=z/q,H=J/B,D=[],U=[],X=[],k=[];for(let Y=0;Y<N;Y++){let V=Y*H-W;for(let L=0;L<G;L++){let O=L*Z-K;U.push(O,-V,0),X.push(0,0,1),k.push(L/q),k.push(1-Y/B)}}for(let Y=0;Y<B;Y++)for(let V=0;V<q;V++){let L=V+G*Y,O=V+G*(Y+1),I=V+1+G*(Y+1),S=V+1+G*Y;D.push(L,O,S),D.push(O,I,S)}this.setIndex(D),this.setAttribute("position",new Sz(U,3)),this.setAttribute("normal",new Sz(X,3)),this.setAttribute("uv",new Sz(k,2))}copy(z){return super.copy(z),this.parameters=Object.assign({},z.parameters),this}static fromJSON(z){return new t0(z.width,z.height,z.widthSegments,z.heightSegments)}}class q5 extends mz{constructor(z=0.5,J=1,Q=32,$=1,K=0,W=Math.PI*2){super();this.type="RingGeometry",this.parameters={innerRadius:z,outerRadius:J,thetaSegments:Q,phiSegments:$,thetaStart:K,thetaLength:W},Q=Math.max(3,Q),$=Math.max(1,$);let q=[],B=[],G=[],N=[],Z=z,H=(J-z)/$,D=new R,U=new a;for(let X=0;X<=$;X++){for(let k=0;k<=Q;k++){let Y=K+k/Q*W;D.x=Z*Math.cos(Y),D.y=Z*Math.sin(Y),B.push(D.x,D.y,D.z),G.push(0,0,1),U.x=(D.x/J+1)/2,U.y=(D.y/J+1)/2,N.push(U.x,U.y)}Z+=H}for(let X=0;X<$;X++){let k=X*(Q+1);for(let Y=0;Y<Q;Y++){let V=Y+k,L=V,O=V+Q+1,I=V+Q+2,S=V+1;q.push(L,O,S),q.push(O,I,S)}}this.setIndex(q),this.setAttribute("position",new Sz(B,3)),this.setAttribute("normal",new Sz(G,3)),this.setAttribute("uv",new Sz(N,2))}copy(z){return super.copy(z),this.parameters=Object.assign({},z.parameters),this}static fromJSON(z){return new q5(z.innerRadius,z.outerRadius,z.thetaSegments,z.phiSegments,z.thetaStart,z.thetaLength)}}class B5 extends mz{constructor(z=new a0([new a(0,0.5),new a(-0.5,-0.5),new a(0.5,-0.5)]),J=12){super();this.type="ShapeGeometry",this.parameters={shapes:z,curveSegments:J};let Q=[],$=[],K=[],W=[],q=0,B=0;if(Array.isArray(z)===!1)G(z);else for(let N=0;N<z.length;N++)G(z[N]),this.addGroup(q,B,N),q+=B,B=0;this.setIndex(Q),this.setAttribute("position",new Sz($,3)),this.setAttribute("normal",new Sz(K,3)),this.setAttribute("uv",new Sz(W,2));function G(N){let Z=$.length/3,H=N.extractPoints(J),D=H.shape,U=H.holes;if(GQ.isClockWise(D)===!1)D=D.reverse();for(let k=0,Y=U.length;k<Y;k++){let V=U[k];if(GQ.isClockWise(V)===!0)U[k]=V.reverse()}let X=GQ.triangulateShape(D,U);for(let k=0,Y=U.length;k<Y;k++){let V=U[k];D=D.concat(V)}for(let k=0,Y=D.length;k<Y;k++){let V=D[k];$.push(V.x,V.y,0),K.push(0,0,1),W.push(V.x,V.y)}for(let k=0,Y=X.length;k<Y;k++){let V=X[k],L=V[0]+Z,O=V[1]+Z,I=V[2]+Z;Q.push(L,O,I),B+=3}}}copy(z){return super.copy(z),this.parameters=Object.assign({},z.parameters),this}toJSON(){let z=super.toJSON(),J=this.parameters.shapes;return TW(J,z)}static fromJSON(z,J){let Q=[];for(let $=0,K=z.shapes.length;$<K;$++){let W=J[z.shapes[$]];Q.push(W)}return new B5(Q,z.curveSegments)}}function TW(z,J){if(J.shapes=[],Array.isArray(z))for(let Q=0,$=z.length;Q<$;Q++){let K=z[Q];J.shapes.push(K.uuid)}else J.shapes.push(z.uuid);return J}class j1 extends mz{constructor(z=1,J=32,Q=16,$=0,K=Math.PI*2,W=0,q=Math.PI){super();this.type="SphereGeometry",this.parameters={radius:z,widthSegments:J,heightSegments:Q,phiStart:$,phiLength:K,thetaStart:W,thetaLength:q},J=Math.max(3,Math.floor(J)),Q=Math.max(2,Math.floor(Q));let B=Math.min(W+q,Math.PI),G=0,N=[],Z=new R,H=new R,D=[],U=[],X=[],k=[];for(let Y=0;Y<=Q;Y++){let V=[],L=Y/Q,O=W+L*q,I=z*Math.cos(O),S=Math.sqrt(z*z-I*I),w=0;if(Y===0&&W===0)w=0.5/J;else if(Y===Q&&B===Math.PI)w=-0.5/J;for(let C=0;C<=J;C++){let E=C/J,F=$+E*K;Z.x=-S*Math.cos(F),Z.y=I,Z.z=S*Math.sin(F),U.push(Z.x,Z.y,Z.z),H.copy(Z).normalize(),X.push(H.x,H.y,H.z),k.push(E+w,1-L),V.push(G++)}N.push(V)}for(let Y=0;Y<Q;Y++)for(let V=0;V<J;V++){let L=N[Y][V+1],O=N[Y][V],I=N[Y+1][V],S=N[Y+1][V+1];if(Y!==0||W>0)D.push(L,O,S);if(Y!==Q-1||B<Math.PI)D.push(O,I,S)}this.setIndex(D),this.setAttribute("position",new Sz(U,3)),this.setAttribute("normal",new Sz(X,3)),this.setAttribute("uv",new Sz(k,2))}copy(z){return super.copy(z),this.parameters=Object.assign({},z.parameters),this}static fromJSON(z){return new j1(z.radius,z.widthSegments,z.heightSegments,z.phiStart,z.phiLength,z.thetaStart,z.thetaLength)}}class G5 extends nQ{constructor(z=1,J=0){let Q=[1,1,1,-1,-1,1,-1,1,-1,1,-1,-1],$=[2,1,0,0,3,2,1,3,0,2,3,1];super(Q,$,z,J);this.type="TetrahedronGeometry",this.parameters={radius:z,detail:J}}static fromJSON(z){return new G5(z.radius,z.detail)}}class N5 extends mz{constructor(z=1,J=0.4,Q=12,$=48,K=Math.PI*2,W=0,q=Math.PI*2){super();this.type="TorusGeometry",this.parameters={radius:z,tube:J,radialSegments:Q,tubularSegments:$,arc:K,thetaStart:W,thetaLength:q},Q=Math.floor(Q),$=Math.floor($);let B=[],G=[],N=[],Z=[],H=new R,D=new R,U=new R;for(let X=0;X<=Q;X++){let k=W+X/Q*q;for(let Y=0;Y<=$;Y++){let V=Y/$*K;D.x=(z+J*Math.cos(k))*Math.cos(V),D.y=(z+J*Math.cos(k))*Math.sin(V),D.z=J*Math.sin(k),G.push(D.x,D.y,D.z),H.x=z*Math.cos(V),H.y=z*Math.sin(V),U.subVectors(D,H).normalize(),N.push(U.x,U.y,U.z),Z.push(Y/$),Z.push(X/Q)}}for(let X=1;X<=Q;X++)for(let k=1;k<=$;k++){let Y=($+1)*X+k-1,V=($+1)*(X-1)+k-1,L=($+1)*(X-1)+k,O=($+1)*X+k;B.push(Y,V,O),B.push(V,L,O)}this.setIndex(B),this.setAttribute("position",new Sz(G,3)),this.setAttribute("normal",new Sz(N,3)),this.setAttribute("uv",new Sz(Z,2))}copy(z){return super.copy(z),this.parameters=Object.assign({},z.parameters),this}static fromJSON(z){return new N5(z.radius,z.tube,z.radialSegments,z.tubularSegments,z.arc)}}class D5 extends mz{constructor(z=1,J=0.4,Q=64,$=8,K=2,W=3){super();this.type="TorusKnotGeometry",this.parameters={radius:z,tube:J,tubularSegments:Q,radialSegments:$,p:K,q:W},Q=Math.floor(Q),$=Math.floor($);let q=[],B=[],G=[],N=[],Z=new R,H=new R,D=new R,U=new R,X=new R,k=new R,Y=new R;for(let L=0;L<=Q;++L){let O=L/Q*K*Math.PI*2;V(O,K,W,z,D),V(O+0.01,K,W,z,U),k.subVectors(U,D),Y.addVectors(U,D),X.crossVectors(k,Y),Y.crossVectors(X,k),X.normalize(),Y.normalize();for(let I=0;I<=$;++I){let S=I/$*Math.PI*2,w=-J*Math.cos(S),C=J*Math.sin(S);Z.x=D.x+(w*Y.x+C*X.x),Z.y=D.y+(w*Y.y+C*X.y),Z.z=D.z+(w*Y.z+C*X.z),B.push(Z.x,Z.y,Z.z),H.subVectors(Z,D).normalize(),G.push(H.x,H.y,H.z),N.push(L/Q),N.push(I/$)}}for(let L=1;L<=Q;L++)for(let O=1;O<=$;O++){let I=($+1)*(L-1)+(O-1),S=($+1)*L+(O-1),w=($+1)*L+O,C=($+1)*(L-1)+O;q.push(I,S,C),q.push(S,w,C)}this.setIndex(q),this.setAttribute("position",new Sz(B,3)),this.setAttribute("normal",new Sz(G,3)),this.setAttribute("uv",new Sz(N,2));function V(L,O,I,S,w){let C=Math.cos(L),E=Math.sin(L),F=I/O*L,x=Math.cos(F);w.x=S*(2+x)*0.5*C,w.y=S*(2+x)*E*0.5,w.z=S*Math.sin(F)*0.5}}copy(z){return super.copy(z),this.parameters=Object.assign({},z.parameters),this}static fromJSON(z){return new D5(z.radius,z.tube,z.tubularSegments,z.radialSegments,z.p,z.q)}}class Z5 extends mz{constructor(z=new J5(new R(-1,-1,0),new R(-1,1,0),new R(1,1,0)),J=64,Q=1,$=8,K=!1){super();this.type="TubeGeometry",this.parameters={path:z,tubularSegments:J,radius:Q,radialSegments:$,closed:K};let W=z.computeFrenetFrames(J,K);this.tangents=W.tangents,this.normals=W.normals,this.binormals=W.binormals;let q=new R,B=new R,G=new a,N=new R,Z=[],H=[],D=[],U=[];X(),this.setIndex(U),this.setAttribute("position",new Sz(Z,3)),this.setAttribute("normal",new Sz(H,3)),this.setAttribute("uv",new Sz(D,2));function X(){for(let L=0;L<J;L++)k(L);k(K===!1?J:0),V(),Y()}function k(L){N=z.getPointAt(L/J,N);let O=W.normals[L],I=W.binormals[L];for(let S=0;S<=$;S++){let w=S/$*Math.PI*2,C=Math.sin(w),E=-Math.cos(w);B.x=E*O.x+C*I.x,B.y=E*O.y+C*I.y,B.z=E*O.z+C*I.z,B.normalize(),H.push(B.x,B.y,B.z),q.x=N.x+Q*B.x,q.y=N.y+Q*B.y,q.z=N.z+Q*B.z,Z.push(q.x,q.y,q.z)}}function Y(){for(let L=1;L<=J;L++)for(let O=1;O<=$;O++){let I=($+1)*(L-1)+(O-1),S=($+1)*L+(O-1),w=($+1)*L+O,C=($+1)*(L-1)+O;U.push(I,S,C),U.push(S,w,C)}}function V(){for(let L=0;L<=J;L++)for(let O=0;O<=$;O++)G.x=L/J,G.y=O/$,D.push(G.x,G.y)}}copy(z){return super.copy(z),this.parameters=Object.assign({},z.parameters),this}toJSON(){let z=super.toJSON();return z.path=this.parameters.path.toJSON(),z}static fromJSON(z){return new Z5(new x2[z.path.type]().fromJSON(z.path),z.tubularSegments,z.radius,z.radialSegments,z.closed)}}class n6 extends mz{constructor(z=null){super();if(this.type="WireframeGeometry",this.parameters={geometry:z},z!==null){let J=[],Q=new Set,$=new R,K=new R;if(z.index!==null){let W=z.attributes.position,q=z.index,B=z.groups;if(B.length===0)B=[{start:0,count:q.count,materialIndex:0}];for(let G=0,N=B.length;G<N;++G){let Z=B[G],H=Z.start,D=Z.count;for(let U=H,X=H+D;U<X;U+=3)for(let k=0;k<3;k++){let Y=q.getX(U+k),V=q.getX(U+(k+1)%3);if($.fromBufferAttribute(W,Y),K.fromBufferAttribute(W,V),A8($,K,Q)===!0)J.push($.x,$.y,$.z),J.push(K.x,K.y,K.z)}}}else{let W=z.attributes.position;for(let q=0,B=W.count/3;q<B;q++)for(let G=0;G<3;G++){let N=3*q+G,Z=3*q+(G+1)%3;if($.fromBufferAttribute(W,N),K.fromBufferAttribute(W,Z),A8($,K,Q)===!0)J.push($.x,$.y,$.z),J.push(K.x,K.y,K.z)}}this.setAttribute("position",new Sz(J,3))}}copy(z){return super.copy(z),this.parameters=Object.assign({},z.parameters),this}}function A8(z,J,Q){let $=`${z.x},${z.y},${z.z}-${J.x},${J.y},${J.z}`,K=`${J.x},${J.y},${J.z}-${z.x},${z.y},${z.z}`;if(Q.has($)===!0||Q.has(K)===!0)return!1;else return Q.add($),Q.add(K),!0}var O8=Object.freeze({__proto__:null,BoxGeometry:X0,CapsuleGeometry:i2,CircleGeometry:a2,ConeGeometry:T1,CylinderGeometry:f1,DodecahedronGeometry:t2,EdgesGeometry:d6,ExtrudeGeometry:$5,IcosahedronGeometry:K5,LatheGeometry:W5,OctahedronGeometry:x1,PlaneGeometry:t0,PolyhedronGeometry:nQ,RingGeometry:q5,ShapeGeometry:B5,SphereGeometry:j1,TetrahedronGeometry:G5,TorusGeometry:N5,TorusKnotGeometry:D5,TubeGeometry:Z5,WireframeGeometry:n6});class o6 extends vJ{constructor(z){super();this.isShadowMaterial=!0,this.type="ShadowMaterial",this.color=new Fz(0),this.transparent=!0,this.fog=!0,this.setValues(z)}copy(z){return super.copy(z),this.color.copy(z.color),this.fog=z.fog,this}}function n0(z){let J={};for(let Q in z){J[Q]={};for(let $ in z[Q]){let K=z[Q][$];if(F8(K))if(K.isRenderTargetTexture)Bz("UniformsUtils: Textures of render targets cannot be cloned via cloneUniforms() or mergeUniforms()."),J[Q][$]=null;else J[Q][$]=K.clone();else if(Array.isArray(K))if(F8(K[0])){let W=[];for(let q=0,B=K.length;q<B;q++)W[q]=K[q].clone();J[Q][$]=W}else J[Q][$]=K.slice();else J[Q][$]=K}}return J}function pJ(z){let J={};for(let Q=0;Q<z.length;Q++){let $=n0(z[Q]);for(let K in $)J[K]=$[K]}return J}function F8(z){return z&&(z.isColor||z.isMatrix3||z.isMatrix4||z.isVector2||z.isVector3||z.isVector4||z.isTexture||z.isQuaternion)}function hW(z){let J=[];for(let Q=0;Q<z.length;Q++)J.push(z[Q].clone());return J}function b9(z){let J=z.getRenderTarget();if(J===null)return z.outputColorSpace;if(J.isXRRenderTarget===!0)return J.texture.colorSpace;return zJ.workingColorSpace}var d9={clone:n0,merge:pJ},xW=`void main() {
	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}`,jW=`void main() {
	gl_FragColor = vec4( 1.0, 0.0, 0.0, 1.0 );
}`;class rJ extends vJ{constructor(z){super();if(this.isShaderMaterial=!0,this.type="ShaderMaterial",this.defines={},this.uniforms={},this.uniformsGroups=[],this.vertexShader=xW,this.fragmentShader=jW,this.linewidth=1,this.wireframe=!1,this.wireframeLinewidth=1,this.fog=!1,this.lights=!1,this.clipping=!1,this.forceSinglePass=!0,this.extensions={clipCullDistance:!1,multiDraw:!1},this.defaultAttributeValues={color:[1,1,1],uv:[0,0],uv1:[0,0]},this.index0AttributeName=void 0,this.uniformsNeedUpdate=!1,this.glslVersion=null,z!==void 0)this.setValues(z)}copy(z){return super.copy(z),this.fragmentShader=z.fragmentShader,this.vertexShader=z.vertexShader,this.uniforms=n0(z.uniforms),this.uniformsGroups=hW(z.uniformsGroups),this.defines=Object.assign({},z.defines),this.wireframe=z.wireframe,this.wireframeLinewidth=z.wireframeLinewidth,this.fog=z.fog,this.lights=z.lights,this.clipping=z.clipping,this.extensions=Object.assign({},z.extensions),this.glslVersion=z.glslVersion,this.defaultAttributeValues=Object.assign({},z.defaultAttributeValues),this.index0AttributeName=z.index0AttributeName,this.uniformsNeedUpdate=z.uniformsNeedUpdate,this}toJSON(z){let J=super.toJSON(z);J.glslVersion=this.glslVersion,J.uniforms={};for(let $ in this.uniforms){let W=this.uniforms[$].value;if(W&&W.isTexture)J.uniforms[$]={type:"t",value:W.toJSON(z).uuid};else if(W&&W.isColor)J.uniforms[$]={type:"c",value:W.getHex()};else if(W&&W.isVector2)J.uniforms[$]={type:"v2",value:W.toArray()};else if(W&&W.isVector3)J.uniforms[$]={type:"v3",value:W.toArray()};else if(W&&W.isVector4)J.uniforms[$]={type:"v4",value:W.toArray()};else if(W&&W.isMatrix3)J.uniforms[$]={type:"m3",value:W.toArray()};else if(W&&W.isMatrix4)J.uniforms[$]={type:"m4",value:W.toArray()};else J.uniforms[$]={value:W}}if(Object.keys(this.defines).length>0)J.defines=this.defines;J.vertexShader=this.vertexShader,J.fragmentShader=this.fragmentShader,J.lights=this.lights,J.clipping=this.clipping;let Q={};for(let $ in this.extensions)if(this.extensions[$]===!0)Q[$]=!0;if(Object.keys(Q).length>0)J.extensions=Q;return J}fromJSON(z,J){if(super.fromJSON(z,J),z.uniforms!==void 0)for(let Q in z.uniforms){let $=z.uniforms[Q];switch(this.uniforms[Q]={},$.type){case"t":this.uniforms[Q].value=J[$.value]||null;break;case"c":this.uniforms[Q].value=new Fz().setHex($.value);break;case"v2":this.uniforms[Q].value=new a().fromArray($.value);break;case"v3":this.uniforms[Q].value=new R().fromArray($.value);break;case"v4":this.uniforms[Q].value=new BJ().fromArray($.value);break;case"m3":this.uniforms[Q].value=new lz().fromArray($.value);break;case"m4":this.uniforms[Q].value=new pz().fromArray($.value);break;default:this.uniforms[Q].value=$.value}}if(z.defines!==void 0)this.defines=z.defines;if(z.vertexShader!==void 0)this.vertexShader=z.vertexShader;if(z.fragmentShader!==void 0)this.fragmentShader=z.fragmentShader;if(z.glslVersion!==void 0)this.glslVersion=z.glslVersion;if(z.extensions!==void 0)for(let Q in z.extensions)this.extensions[Q]=z.extensions[Q];if(z.lights!==void 0)this.lights=z.lights;if(z.clipping!==void 0)this.clipping=z.clipping;return this}}class H5 extends rJ{constructor(z){super(z);this.isRawShaderMaterial=!0,this.type="RawShaderMaterial"}}class U5 extends vJ{constructor(z){super();this.isMeshStandardMaterial=!0,this.type="MeshStandardMaterial",this.defines={STANDARD:""},this.color=new Fz(16777215),this.roughness=1,this.metalness=0,this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.emissive=new Fz(0),this.emissiveIntensity=1,this.emissiveMap=null,this.bumpMap=null,this.bumpScale=1,this.normalMap=null,this.normalMapType=0,this.normalScale=new a(1,1),this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.roughnessMap=null,this.metalnessMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new NQ,this.envMapIntensity=1,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.flatShading=!1,this.fog=!0,this.setValues(z)}copy(z){return super.copy(z),this.defines={STANDARD:""},this.color.copy(z.color),this.roughness=z.roughness,this.metalness=z.metalness,this.map=z.map,this.lightMap=z.lightMap,this.lightMapIntensity=z.lightMapIntensity,this.aoMap=z.aoMap,this.aoMapIntensity=z.aoMapIntensity,this.emissive.copy(z.emissive),this.emissiveMap=z.emissiveMap,this.emissiveIntensity=z.emissiveIntensity,this.bumpMap=z.bumpMap,this.bumpScale=z.bumpScale,this.normalMap=z.normalMap,this.normalMapType=z.normalMapType,this.normalScale.copy(z.normalScale),this.displacementMap=z.displacementMap,this.displacementScale=z.displacementScale,this.displacementBias=z.displacementBias,this.roughnessMap=z.roughnessMap,this.metalnessMap=z.metalnessMap,this.alphaMap=z.alphaMap,this.envMap=z.envMap,this.envMapRotation.copy(z.envMapRotation),this.envMapIntensity=z.envMapIntensity,this.wireframe=z.wireframe,this.wireframeLinewidth=z.wireframeLinewidth,this.wireframeLinecap=z.wireframeLinecap,this.wireframeLinejoin=z.wireframeLinejoin,this.flatShading=z.flatShading,this.fog=z.fog,this}}class s6 extends U5{constructor(z){super();this.isMeshPhysicalMaterial=!0,this.defines={STANDARD:"",PHYSICAL:""},this.type="MeshPhysicalMaterial",this.anisotropyRotation=0,this.anisotropyMap=null,this.clearcoatMap=null,this.clearcoatRoughness=0,this.clearcoatRoughnessMap=null,this.clearcoatNormalScale=new a(1,1),this.clearcoatNormalMap=null,this.ior=1.5,Object.defineProperty(this,"reflectivity",{get:function(){return dz(2.5*(this.ior-1)/(this.ior+1),0,1)},set:function(J){this.ior=(1+0.4*J)/(1-0.4*J)}}),this.iridescenceMap=null,this.iridescenceIOR=1.3,this.iridescenceThicknessRange=[100,400],this.iridescenceThicknessMap=null,this.sheenColor=new Fz(0),this.sheenColorMap=null,this.sheenRoughness=1,this.sheenRoughnessMap=null,this.transmissionMap=null,this.thickness=0,this.thicknessMap=null,this.attenuationDistance=1/0,this.attenuationColor=new Fz(1,1,1),this.specularIntensity=1,this.specularIntensityMap=null,this.specularColor=new Fz(1,1,1),this.specularColorMap=null,this._anisotropy=0,this._clearcoat=0,this._dispersion=0,this._iridescence=0,this._sheen=0,this._transmission=0,this.setValues(z)}get anisotropy(){return this._anisotropy}set anisotropy(z){if(this._anisotropy>0!==z>0)this.version++;this._anisotropy=z}get clearcoat(){return this._clearcoat}set clearcoat(z){if(this._clearcoat>0!==z>0)this.version++;this._clearcoat=z}get iridescence(){return this._iridescence}set iridescence(z){if(this._iridescence>0!==z>0)this.version++;this._iridescence=z}get dispersion(){return this._dispersion}set dispersion(z){if(this._dispersion>0!==z>0)this.version++;this._dispersion=z}get sheen(){return this._sheen}set sheen(z){if(this._sheen>0!==z>0)this.version++;this._sheen=z}get transmission(){return this._transmission}set transmission(z){if(this._transmission>0!==z>0)this.version++;this._transmission=z}copy(z){return super.copy(z),this.defines={STANDARD:"",PHYSICAL:""},this.anisotropy=z.anisotropy,this.anisotropyRotation=z.anisotropyRotation,this.anisotropyMap=z.anisotropyMap,this.clearcoat=z.clearcoat,this.clearcoatMap=z.clearcoatMap,this.clearcoatRoughness=z.clearcoatRoughness,this.clearcoatRoughnessMap=z.clearcoatRoughnessMap,this.clearcoatNormalMap=z.clearcoatNormalMap,this.clearcoatNormalScale.copy(z.clearcoatNormalScale),this.dispersion=z.dispersion,this.ior=z.ior,this.iridescence=z.iridescence,this.iridescenceMap=z.iridescenceMap,this.iridescenceIOR=z.iridescenceIOR,this.iridescenceThicknessRange=[...z.iridescenceThicknessRange],this.iridescenceThicknessMap=z.iridescenceThicknessMap,this.sheen=z.sheen,this.sheenColor.copy(z.sheenColor),this.sheenColorMap=z.sheenColorMap,this.sheenRoughness=z.sheenRoughness,this.sheenRoughnessMap=z.sheenRoughnessMap,this.transmission=z.transmission,this.transmissionMap=z.transmissionMap,this.thickness=z.thickness,this.thicknessMap=z.thicknessMap,this.attenuationDistance=z.attenuationDistance,this.attenuationColor.copy(z.attenuationColor),this.specularIntensity=z.specularIntensity,this.specularIntensityMap=z.specularIntensityMap,this.specularColor.copy(z.specularColor),this.specularColorMap=z.specularColorMap,this}}class i6 extends vJ{constructor(z){super();this.isMeshPhongMaterial=!0,this.type="MeshPhongMaterial",this.color=new Fz(16777215),this.specular=new Fz(1118481),this.shininess=30,this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.emissive=new Fz(0),this.emissiveIntensity=1,this.emissiveMap=null,this.bumpMap=null,this.bumpScale=1,this.normalMap=null,this.normalMapType=0,this.normalScale=new a(1,1),this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.specularMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new NQ,this.combine=0,this.reflectivity=1,this.envMapIntensity=1,this.refractionRatio=0.98,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.flatShading=!1,this.fog=!0,this.setValues(z)}copy(z){return super.copy(z),this.color.copy(z.color),this.specular.copy(z.specular),this.shininess=z.shininess,this.map=z.map,this.lightMap=z.lightMap,this.lightMapIntensity=z.lightMapIntensity,this.aoMap=z.aoMap,this.aoMapIntensity=z.aoMapIntensity,this.emissive.copy(z.emissive),this.emissiveMap=z.emissiveMap,this.emissiveIntensity=z.emissiveIntensity,this.bumpMap=z.bumpMap,this.bumpScale=z.bumpScale,this.normalMap=z.normalMap,this.normalMapType=z.normalMapType,this.normalScale.copy(z.normalScale),this.displacementMap=z.displacementMap,this.displacementScale=z.displacementScale,this.displacementBias=z.displacementBias,this.specularMap=z.specularMap,this.alphaMap=z.alphaMap,this.envMap=z.envMap,this.envMapRotation.copy(z.envMapRotation),this.combine=z.combine,this.reflectivity=z.reflectivity,this.envMapIntensity=z.envMapIntensity,this.refractionRatio=z.refractionRatio,this.wireframe=z.wireframe,this.wireframeLinewidth=z.wireframeLinewidth,this.wireframeLinecap=z.wireframeLinecap,this.wireframeLinejoin=z.wireframeLinejoin,this.flatShading=z.flatShading,this.fog=z.fog,this}}class a6 extends vJ{constructor(z){super();this.isMeshToonMaterial=!0,this.defines={TOON:""},this.type="MeshToonMaterial",this.color=new Fz(16777215),this.map=null,this.gradientMap=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.emissive=new Fz(0),this.emissiveIntensity=1,this.emissiveMap=null,this.bumpMap=null,this.bumpScale=1,this.normalMap=null,this.normalMapType=0,this.normalScale=new a(1,1),this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.alphaMap=null,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.fog=!0,this.setValues(z)}copy(z){return super.copy(z),this.color.copy(z.color),this.map=z.map,this.gradientMap=z.gradientMap,this.lightMap=z.lightMap,this.lightMapIntensity=z.lightMapIntensity,this.aoMap=z.aoMap,this.aoMapIntensity=z.aoMapIntensity,this.emissive.copy(z.emissive),this.emissiveMap=z.emissiveMap,this.emissiveIntensity=z.emissiveIntensity,this.bumpMap=z.bumpMap,this.bumpScale=z.bumpScale,this.normalMap=z.normalMap,this.normalMapType=z.normalMapType,this.normalScale.copy(z.normalScale),this.displacementMap=z.displacementMap,this.displacementScale=z.displacementScale,this.displacementBias=z.displacementBias,this.alphaMap=z.alphaMap,this.wireframe=z.wireframe,this.wireframeLinewidth=z.wireframeLinewidth,this.wireframeLinecap=z.wireframeLinecap,this.wireframeLinejoin=z.wireframeLinejoin,this.fog=z.fog,this}}class t6 extends vJ{constructor(z){super();this.isMeshNormalMaterial=!0,this.type="MeshNormalMaterial",this.bumpMap=null,this.bumpScale=1,this.normalMap=null,this.normalMapType=0,this.normalScale=new a(1,1),this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.wireframe=!1,this.wireframeLinewidth=1,this.flatShading=!1,this.setValues(z)}copy(z){return super.copy(z),this.bumpMap=z.bumpMap,this.bumpScale=z.bumpScale,this.normalMap=z.normalMap,this.normalMapType=z.normalMapType,this.normalScale.copy(z.normalScale),this.displacementMap=z.displacementMap,this.displacementScale=z.displacementScale,this.displacementBias=z.displacementBias,this.wireframe=z.wireframe,this.wireframeLinewidth=z.wireframeLinewidth,this.flatShading=z.flatShading,this}}class r6 extends vJ{constructor(z){super();this.isMeshLambertMaterial=!0,this.type="MeshLambertMaterial",this.color=new Fz(16777215),this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.emissive=new Fz(0),this.emissiveIntensity=1,this.emissiveMap=null,this.bumpMap=null,this.bumpScale=1,this.normalMap=null,this.normalMapType=0,this.normalScale=new a(1,1),this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.specularMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new NQ,this.combine=0,this.reflectivity=1,this.envMapIntensity=1,this.refractionRatio=0.98,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.flatShading=!1,this.fog=!0,this.setValues(z)}copy(z){return super.copy(z),this.color.copy(z.color),this.map=z.map,this.lightMap=z.lightMap,this.lightMapIntensity=z.lightMapIntensity,this.aoMap=z.aoMap,this.aoMapIntensity=z.aoMapIntensity,this.emissive.copy(z.emissive),this.emissiveMap=z.emissiveMap,this.emissiveIntensity=z.emissiveIntensity,this.bumpMap=z.bumpMap,this.bumpScale=z.bumpScale,this.normalMap=z.normalMap,this.normalMapType=z.normalMapType,this.normalScale.copy(z.normalScale),this.displacementMap=z.displacementMap,this.displacementScale=z.displacementScale,this.displacementBias=z.displacementBias,this.specularMap=z.specularMap,this.alphaMap=z.alphaMap,this.envMap=z.envMap,this.envMapRotation.copy(z.envMapRotation),this.combine=z.combine,this.reflectivity=z.reflectivity,this.envMapIntensity=z.envMapIntensity,this.refractionRatio=z.refractionRatio,this.wireframe=z.wireframe,this.wireframeLinewidth=z.wireframeLinewidth,this.wireframeLinecap=z.wireframeLinecap,this.wireframeLinejoin=z.wireframeLinejoin,this.flatShading=z.flatShading,this.fog=z.fog,this}}class V5 extends vJ{constructor(z){super();this.isMeshDepthMaterial=!0,this.type="MeshDepthMaterial",this.depthPacking=3200,this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.wireframe=!1,this.wireframeLinewidth=1,this.setValues(z)}copy(z){return super.copy(z),this.depthPacking=z.depthPacking,this.map=z.map,this.alphaMap=z.alphaMap,this.displacementMap=z.displacementMap,this.displacementScale=z.displacementScale,this.displacementBias=z.displacementBias,this.wireframe=z.wireframe,this.wireframeLinewidth=z.wireframeLinewidth,this}}class Y5 extends vJ{constructor(z){super();this.isMeshDistanceMaterial=!0,this.type="MeshDistanceMaterial",this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.setValues(z)}copy(z){return super.copy(z),this.map=z.map,this.alphaMap=z.alphaMap,this.displacementMap=z.displacementMap,this.displacementScale=z.displacementScale,this.displacementBias=z.displacementBias,this}}class e6 extends vJ{constructor(z){super();this.isMeshMatcapMaterial=!0,this.defines={MATCAP:""},this.type="MeshMatcapMaterial",this.color=new Fz(16777215),this.matcap=null,this.map=null,this.bumpMap=null,this.bumpScale=1,this.normalMap=null,this.normalMapType=0,this.normalScale=new a(1,1),this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.alphaMap=null,this.wireframe=!1,this.wireframeLinewidth=1,this.flatShading=!1,this.fog=!0,this.setValues(z)}copy(z){return super.copy(z),this.defines={MATCAP:""},this.color.copy(z.color),this.matcap=z.matcap,this.map=z.map,this.bumpMap=z.bumpMap,this.bumpScale=z.bumpScale,this.normalMap=z.normalMap,this.normalMapType=z.normalMapType,this.normalScale.copy(z.normalScale),this.displacementMap=z.displacementMap,this.displacementScale=z.displacementScale,this.displacementBias=z.displacementBias,this.alphaMap=z.alphaMap,this.wireframe=z.wireframe,this.wireframeLinewidth=z.wireframeLinewidth,this.flatShading=z.flatShading,this.fog=z.fog,this}}class z7 extends bJ{constructor(z){super();this.isLineDashedMaterial=!0,this.type="LineDashedMaterial",this.scale=1,this.dashSize=3,this.gapSize=1,this.setValues(z)}copy(z){return super.copy(z),this.scale=z.scale,this.dashSize=z.dashSize,this.gapSize=z.gapSize,this}}function D0(z,J){if(!z||z.constructor===J)return z;if(typeof J.BYTES_PER_ELEMENT==="number")return new J(z);return Array.prototype.slice.call(z)}function p9(z){function J(K,W){return z[K]-z[W]}let Q=z.length,$=Array(Q);for(let K=0;K!==Q;++K)$[K]=K;return $.sort(J),$}function F6(z,J,Q){let $=z.length,K=new z.constructor($);for(let W=0,q=0;q!==$;++W){let B=Q[W]*J;for(let G=0;G!==J;++G)K[q++]=z[B+G]}return K}function u9(z,J,Q,$){let K=1,W=z[0];while(W!==void 0&&W[$]===void 0)W=z[K++];if(W===void 0)return;let q=W[$];if(q===void 0)return;if(Array.isArray(q))do{if(q=W[$],q!==void 0)J.push(W.time),Q.push(...q);W=z[K++]}while(W!==void 0);else if(q.toArray!==void 0)do{if(q=W[$],q!==void 0)J.push(W.time),q.toArray(Q,Q.length);W=z[K++]}while(W!==void 0);else do{if(q=W[$],q!==void 0)J.push(W.time),Q.push(q);W=z[K++]}while(W!==void 0)}function _W(z,J,Q,$,K=30){let W=z.clone();W.name=J;let q=[];for(let G=0;G<W.tracks.length;++G){let N=W.tracks[G],Z=N.getValueSize(),H=[],D=[];for(let U=0;U<N.times.length;++U){let X=N.times[U]*K;if(X<Q||X>=$)continue;H.push(N.times[U]);for(let k=0;k<Z;++k)D.push(N.values[U*Z+k])}if(H.length===0)continue;N.times=D0(H,N.times.constructor),N.values=D0(D,N.values.constructor),q.push(N)}W.tracks=q;let B=1/0;for(let G=0;G<W.tracks.length;++G)if(B>W.tracks[G].times[0])B=W.tracks[G].times[0];for(let G=0;G<W.tracks.length;++G)W.tracks[G].shift(-1*B);return W.resetDuration(),W}function bW(z,J=0,Q=z,$=30){if($<=0)$=30;let K=Q.tracks.length,W=J/$;for(let q=0;q<K;++q){let B=Q.tracks[q],G=B.ValueTypeName;if(G==="bool"||G==="string")continue;let N=z.tracks.find(function(V){return V.name===B.name&&V.ValueTypeName===G});if(N===void 0)continue;let Z=0,H=B.getValueSize();if(B.createInterpolant.isInterpolantFactoryMethodGLTFCubicSpline)Z=H/3;let D=0,U=N.getValueSize();if(N.createInterpolant.isInterpolantFactoryMethodGLTFCubicSpline)D=U/3;let X=B.times.length-1,k;if(W<=B.times[0]){let V=Z,L=H-Z;k=B.values.slice(V,L)}else if(W>=B.times[X]){let V=X*H+Z,L=V+H-Z;k=B.values.slice(V,L)}else{let V=B.createInterpolant(),L=Z,O=H-Z;V.evaluate(W),k=V.resultBuffer.slice(L,O)}if(G==="quaternion")new _J().fromArray(k).normalize().conjugate().toArray(k);let Y=N.times.length;for(let V=0;V<Y;++V){let L=V*U+D;if(G==="quaternion")_J.multiplyQuaternionsFlat(N.values,L,k,0,N.values,L);else{let O=U-D*2;for(let I=0;I<O;++I)N.values[L+I]-=k[I]}}}return z.blendMode=2501,z}class g9{static convertArray(z,J){return D0(z,J)}static isTypedArray(z){return H9(z)}static getKeyframeOrder(z){return p9(z)}static sortedArray(z,J,Q){return F6(z,J,Q)}static flattenJSON(z,J,Q,$){u9(z,J,Q,$)}static subclip(z,J,Q,$,K=30){return _W(z,J,Q,$,K)}static makeClipAdditive(z,J=0,Q=z,$=30){return bW(z,J,Q,$)}}class k0{constructor(z,J,Q,$){this.parameterPositions=z,this._cachedIndex=0,this.resultBuffer=$!==void 0?$:new J.constructor(Q),this.sampleValues=J,this.valueSize=Q,this.settings=null,this.DefaultSettings_={}}evaluate(z){let J=this.parameterPositions,Q=this._cachedIndex,$=J[Q],K=J[Q-1];z:{J:{let W;Q:{$:if(!(z<$)){for(let q=Q+2;;){if($===void 0){if(z<K)break $;return Q=J.length,this._cachedIndex=Q,this.copySampleValue_(Q-1)}if(Q===q)break;if(K=$,$=J[++Q],z<$)break J}W=J.length;break Q}if(!(z>=K)){let q=J[1];if(z<q)Q=2,K=q;for(let B=Q-2;;){if(K===void 0)return this._cachedIndex=0,this.copySampleValue_(0);if(Q===B)break;if($=K,K=J[--Q-1],z>=K)break J}W=Q,Q=0;break Q}break z}while(Q<W){let q=Q+W>>>1;if(z<J[q])W=q;else Q=q+1}if($=J[Q],K=J[Q-1],K===void 0)return this._cachedIndex=0,this.copySampleValue_(0);if($===void 0)return Q=J.length,this._cachedIndex=Q,this.copySampleValue_(Q-1)}this._cachedIndex=Q,this.intervalChanged_(Q,K,$)}return this.interpolate_(Q,K,z,$)}getSettings_(){return this.settings||this.DefaultSettings_}copySampleValue_(z){let J=this.resultBuffer,Q=this.sampleValues,$=this.valueSize,K=z*$;for(let W=0;W!==$;++W)J[W]=Q[K+W];return J}interpolate_(){throw Error("THREE.Interpolant: Call to abstract method.")}intervalChanged_(){}}class J7 extends k0{constructor(z,J,Q,$){super(z,J,Q,$);this._weightPrev=-0,this._offsetPrev=-0,this._weightNext=-0,this._offsetNext=-0,this.DefaultSettings_={endingStart:2400,endingEnd:2400}}intervalChanged_(z,J,Q){let $=this.parameterPositions,K=z-2,W=z+1,q=$[K],B=$[W];if(q===void 0)switch(this.getSettings_().endingStart){case 2401:K=z,q=2*J-Q;break;case 2402:K=$.length-2,q=J+$[K]-$[K+1];break;default:K=z,q=Q}if(B===void 0)switch(this.getSettings_().endingEnd){case 2401:W=z,B=2*Q-J;break;case 2402:W=1,B=Q+$[1]-$[0];break;default:W=z-1,B=J}let G=(Q-J)*0.5,N=this.valueSize;this._weightPrev=G/(J-q),this._weightNext=G/(B-Q),this._offsetPrev=K*N,this._offsetNext=W*N}interpolate_(z,J,Q,$){let K=this.resultBuffer,W=this.sampleValues,q=this.valueSize,B=z*q,G=B-q,N=this._offsetPrev,Z=this._offsetNext,H=this._weightPrev,D=this._weightNext,U=(Q-J)/($-J),X=U*U,k=X*U,Y=-H*k+2*H*X-H*U,V=(1+H)*k+(-1.5-2*H)*X+(-0.5+H)*U+1,L=(-1-D)*k+(1.5+D)*X+0.5*U,O=D*k-D*X;for(let I=0;I!==q;++I)K[I]=Y*W[N+I]+V*W[G+I]+L*W[B+I]+O*W[Z+I];return K}}class X5 extends k0{constructor(z,J,Q,$){super(z,J,Q,$)}interpolate_(z,J,Q,$){let K=this.resultBuffer,W=this.sampleValues,q=this.valueSize,B=z*q,G=B-q,N=(Q-J)/($-J),Z=1-N;for(let H=0;H!==q;++H)K[H]=W[G+H]*Z+W[B+H]*N;return K}}class Q7 extends k0{constructor(z,J,Q,$){super(z,J,Q,$)}interpolate_(z){return this.copySampleValue_(z-1)}}class $7 extends k0{interpolate_(z,J,Q,$){let K=this.resultBuffer,W=this.sampleValues,q=this.valueSize,B=z*q,G=B-q,N=this.inTangents,Z=this.outTangents;if(!N||!Z){let U=(Q-J)/($-J),X=1-U;for(let k=0;k!==q;++k)K[k]=W[G+k]*X+W[B+k]*U;return K}let H=q*2,D=z-1;for(let U=0;U!==q;++U){let X=W[G+U],k=W[B+U],Y=D*H+U*2,V=Z[Y],L=Z[Y+1],O=z*H+U*2,I=N[O],S=N[O+1],w=(Q-J)/($-J),C,E,F,x,P;for(let p=0;p<8;p++){C=w*w,E=C*w,F=1-w,x=F*F,P=x*F;let j=P*J+3*x*w*V+3*F*C*I+E*$-Q;if(Math.abs(j)<0.0000000001)break;let m=3*x*(V-J)+6*F*w*(I-V)+3*C*($-I);if(Math.abs(m)<0.0000000001)break;w=w-j/m,w=Math.max(0,Math.min(1,w))}K[U]=P*X+3*x*w*L+3*F*C*S+E*k}return K}}class eJ{constructor(z,J,Q,$){if(z===void 0)throw Error("THREE.KeyframeTrack: track name is undefined");if(J===void 0||J.length===0)throw Error("THREE.KeyframeTrack: no keyframes in track named "+z);this.name=z,this.times=D0(J,this.TimeBufferType),this.values=D0(Q,this.ValueBufferType),this.setInterpolation($||this.DefaultInterpolation)}static toJSON(z){let J=z.constructor,Q;if(J.toJSON!==this.toJSON)Q=J.toJSON(z);else{Q={name:z.name,times:D0(z.times,Array),values:D0(z.values,Array)};let $=z.getInterpolation();if($!==z.DefaultInterpolation)Q.interpolation=$}return Q.type=z.ValueTypeName,Q}InterpolantFactoryMethodDiscrete(z){return new Q7(this.times,this.values,this.getValueSize(),z)}InterpolantFactoryMethodLinear(z){return new X5(this.times,this.values,this.getValueSize(),z)}InterpolantFactoryMethodSmooth(z){return new J7(this.times,this.values,this.getValueSize(),z)}InterpolantFactoryMethodBezier(z){let J=new $7(this.times,this.values,this.getValueSize(),z);if(this.settings)J.inTangents=this.settings.inTangents,J.outTangents=this.settings.outTangents;return J}setInterpolation(z){let J;switch(z){case 2300:J=this.InterpolantFactoryMethodDiscrete;break;case 2301:J=this.InterpolantFactoryMethodLinear;break;case 2302:J=this.InterpolantFactoryMethodSmooth;break;case 2303:J=this.InterpolantFactoryMethodBezier;break}if(J===void 0){let Q="unsupported interpolation for "+this.ValueTypeName+" keyframe track named "+this.name;if(this.createInterpolant===void 0)if(z!==this.DefaultInterpolation)this.setInterpolation(this.DefaultInterpolation);else throw Error(Q);return Bz("KeyframeTrack:",Q),this}return this.createInterpolant=J,this}getInterpolation(){switch(this.createInterpolant){case this.InterpolantFactoryMethodDiscrete:return 2300;case this.InterpolantFactoryMethodLinear:return 2301;case this.InterpolantFactoryMethodSmooth:return 2302;case this.InterpolantFactoryMethodBezier:return 2303}}getValueSize(){return this.values.length/this.times.length}shift(z){if(z!==0){let J=this.times;for(let Q=0,$=J.length;Q!==$;++Q)J[Q]+=z}return this}scale(z){if(z!==1){let J=this.times;for(let Q=0,$=J.length;Q!==$;++Q)J[Q]*=z}return this}trim(z,J){let Q=this.times,$=Q.length,K=0,W=$-1;while(K!==$&&Q[K]<z)++K;while(W!==-1&&Q[W]>J)--W;if(++W,K!==0||W!==$){if(K>=W)W=Math.max(W,1),K=W-1;let q=this.getValueSize();this.times=Q.slice(K,W),this.values=this.values.slice(K*q,W*q)}return this}validate(){let z=!0,J=this.getValueSize();if(J-Math.floor(J)!==0)Pz("KeyframeTrack: Invalid value size in track.",this),z=!1;let Q=this.times,$=this.values,K=Q.length;if(K===0)Pz("KeyframeTrack: Track is empty.",this),z=!1;let W=null;for(let q=0;q!==K;q++){let B=Q[q];if(typeof B==="number"&&isNaN(B)){Pz("KeyframeTrack: Time is not a valid number.",this,q,B),z=!1;break}if(W!==null&&W>B){Pz("KeyframeTrack: Out of order keys.",this,q,B,W),z=!1;break}W=B}if($!==void 0){if(H9($))for(let q=0,B=$.length;q!==B;++q){let G=$[q];if(isNaN(G)){Pz("KeyframeTrack: Value is not a valid number.",this,q,G),z=!1;break}}}return z}optimize(){let z=this.times.slice(),J=this.values.slice(),Q=this.getValueSize(),$=this.getInterpolation()===2302,K=z.length-1,W=1;for(let q=1;q<K;++q){let B=!1,G=z[q],N=z[q+1];if(G!==N&&(q!==1||G!==z[0]))if(!$){let Z=q*Q,H=Z-Q,D=Z+Q;for(let U=0;U!==Q;++U){let X=J[Z+U];if(X!==J[H+U]||X!==J[D+U]){B=!0;break}}}else B=!0;if(B){if(q!==W){z[W]=z[q];let Z=q*Q,H=W*Q;for(let D=0;D!==Q;++D)J[H+D]=J[Z+D]}++W}}if(K>0){z[W]=z[K];for(let q=K*Q,B=W*Q,G=0;G!==Q;++G)J[B+G]=J[q+G];++W}if(W!==z.length)this.times=z.slice(0,W),this.values=J.slice(0,W*Q);else this.times=z,this.values=J;return this}clone(){let z=this.times.slice(),J=this.values.slice(),$=new this.constructor(this.name,z,J);return $.createInterpolant=this.createInterpolant,$}}eJ.prototype.ValueTypeName="";eJ.prototype.TimeBufferType=Float32Array;eJ.prototype.ValueBufferType=Float32Array;eJ.prototype.DefaultInterpolation=2301;class oQ extends eJ{constructor(z,J,Q){super(z,J,Q)}}oQ.prototype.ValueTypeName="bool";oQ.prototype.ValueBufferType=Array;oQ.prototype.DefaultInterpolation=2300;oQ.prototype.InterpolantFactoryMethodLinear=void 0;oQ.prototype.InterpolantFactoryMethodSmooth=void 0;class k5 extends eJ{constructor(z,J,Q,$){super(z,J,Q,$)}}k5.prototype.ValueTypeName="color";class _1 extends eJ{constructor(z,J,Q,$){super(z,J,Q,$)}}_1.prototype.ValueTypeName="number";class K7 extends k0{constructor(z,J,Q,$){super(z,J,Q,$)}interpolate_(z,J,Q,$){let K=this.resultBuffer,W=this.sampleValues,q=this.valueSize,B=(Q-J)/($-J),G=z*q;for(let N=G+q;G!==N;G+=4)_J.slerpFlat(K,0,W,G-q,W,G,B);return K}}class b1 extends eJ{constructor(z,J,Q,$){super(z,J,Q,$)}InterpolantFactoryMethodLinear(z){return new K7(this.times,this.values,this.getValueSize(),z)}}b1.prototype.ValueTypeName="quaternion";b1.prototype.InterpolantFactoryMethodSmooth=void 0;class sQ extends eJ{constructor(z,J,Q){super(z,J,Q)}}sQ.prototype.ValueTypeName="string";sQ.prototype.ValueBufferType=Array;sQ.prototype.DefaultInterpolation=2300;sQ.prototype.InterpolantFactoryMethodLinear=void 0;sQ.prototype.InterpolantFactoryMethodSmooth=void 0;class E5 extends eJ{constructor(z,J,Q,$){super(z,J,Q,$)}}E5.prototype.ValueTypeName="vector";class o0{constructor(z="",J=-1,Q=[],$=2500){if(this.name=z,this.tracks=Q,this.duration=J,this.blendMode=$,this.uuid=aJ(),this.userData={},this.duration<0)this.resetDuration()}static parse(z){let J=[],Q=z.tracks,$=1/(z.fps||1);for(let W=0,q=Q.length;W!==q;++W)J.push(pW(Q[W]).scale($));let K=new this(z.name,z.duration,J,z.blendMode);return K.uuid=z.uuid,K.userData=JSON.parse(z.userData||"{}"),K}static toJSON(z){let J=[],Q=z.tracks,$={name:z.name,duration:z.duration,tracks:J,uuid:z.uuid,blendMode:z.blendMode,userData:JSON.stringify(z.userData)};for(let K=0,W=Q.length;K!==W;++K)J.push(eJ.toJSON(Q[K]));return $}static CreateFromMorphTargetSequence(z,J,Q,$){let K=J.length,W=[];for(let q=0;q<K;q++){let B=[],G=[];B.push((q+K-1)%K,q,(q+1)%K),G.push(0,1,0);let N=p9(B);if(B=F6(B,1,N),G=F6(G,1,N),!$&&B[0]===0)B.push(K),G.push(G[0]);W.push(new _1(".morphTargetInfluences["+J[q].name+"]",B,G).scale(1/Q))}return new this(z,-1,W)}static findByName(z,J){let Q=z;if(!Array.isArray(z)){let $=z;Q=$.geometry&&$.geometry.animations||$.animations}for(let $=0;$<Q.length;$++)if(Q[$].name===J)return Q[$];return null}static CreateClipsFromMorphTargetSequences(z,J,Q){let $={},K=/^([\w-]*?)([\d]+)$/;for(let q=0,B=z.length;q<B;q++){let G=z[q],N=G.name.match(K);if(N&&N.length>1){let Z=N[1],H=$[Z];if(!H)$[Z]=H=[];H.push(G)}}let W=[];for(let q in $)W.push(this.CreateFromMorphTargetSequence(q,$[q],J,Q));return W}resetDuration(){let z=this.tracks,J=0;for(let Q=0,$=z.length;Q!==$;++Q){let K=this.tracks[Q];J=Math.max(J,K.times[K.times.length-1])}return this.duration=J,this}trim(){for(let z=0;z<this.tracks.length;z++)this.tracks[z].trim(0,this.duration);return this}validate(){let z=!0;for(let J=0;J<this.tracks.length;J++)z=z&&this.tracks[J].validate();return z}optimize(){for(let z=0;z<this.tracks.length;z++)this.tracks[z].optimize();return this}clone(){let z=[];for(let Q=0;Q<this.tracks.length;Q++)z.push(this.tracks[Q].clone());let J=new this.constructor(this.name,this.duration,z,this.blendMode);return J.userData=JSON.parse(JSON.stringify(this.userData)),J}toJSON(){return this.constructor.toJSON(this)}}function dW(z){switch(z.toLowerCase()){case"scalar":case"double":case"float":case"number":case"integer":return _1;case"vector":case"vector2":case"vector3":case"vector4":return E5;case"color":return k5;case"quaternion":return b1;case"bool":case"boolean":return oQ;case"string":return sQ}throw Error("THREE.KeyframeTrack: Unsupported typeName: "+z)}function pW(z){if(z.type===void 0)throw Error("THREE.KeyframeTrack: track type undefined, can not parse");let J=dW(z.type);if(z.times===void 0){let Q=[],$=[];u9(z.keys,Q,$,"value"),z.times=Q,z.values=$}if(J.parse!==void 0)return J.parse(z);else return new J(z.name,z.times,z.values,z.interpolation)}var YQ={enabled:!1,files:{},add:function(z,J){if(this.enabled===!1)return;if(M8(z))return;this.files[z]=J},get:function(z){if(this.enabled===!1)return;if(M8(z))return;return this.files[z]},remove:function(z){delete this.files[z]},clear:function(){this.files={}}};function M8(z){try{let J=z.slice(z.indexOf(":")+1);return new URL(J).protocol==="blob:"}catch(J){return!1}}class I5{constructor(z,J,Q){let $=this,K=!1,W=0,q=0,B=void 0,G=[];this.onStart=void 0,this.onLoad=z,this.onProgress=J,this.onError=Q,this._abortController=null,this.itemStart=function(N){if(q++,K===!1){if($.onStart!==void 0)$.onStart(N,W,q)}K=!0},this.itemEnd=function(N){if(W++,$.onProgress!==void 0)$.onProgress(N,W,q);if(W===q){if(K=!1,$.onLoad!==void 0)$.onLoad()}},this.itemError=function(N){if($.onError!==void 0)$.onError(N)},this.resolveURL=function(N){if(N=N.normalize("NFC"),B)return B(N);return N},this.setURLModifier=function(N){return B=N,this},this.addHandler=function(N,Z){return G.push(N,Z),this},this.removeHandler=function(N){let Z=G.indexOf(N);if(Z!==-1)G.splice(Z,2);return this},this.getHandler=function(N){for(let Z=0,H=G.length;Z<H;Z+=2){let D=G[Z],U=G[Z+1];if(D.global)D.lastIndex=0;if(D.test(N))return U}return null},this.abort=function(){return this.abortController.abort(),this._abortController=null,this}}get abortController(){if(!this._abortController)this._abortController=new AbortController;return this._abortController}}var l9=new I5;class gJ{constructor(z){if(this.manager=z!==void 0?z:l9,this.crossOrigin="anonymous",this.withCredentials=!1,this.path="",this.resourcePath="",this.requestHeader={},typeof __THREE_DEVTOOLS__<"u")__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}load(){}loadAsync(z,J){let Q=this;return new Promise(function($,K){Q.load(z,$,J,K)})}parse(){}setCrossOrigin(z){return this.crossOrigin=z,this}setWithCredentials(z){return this.withCredentials=z,this}setPath(z){return this.path=z,this}setResourcePath(z){return this.resourcePath=z,this}setRequestHeader(z){return this.requestHeader=z,this}abort(){return this}}gJ.DEFAULT_MATERIAL_NAME="__DEFAULT";var MQ={};class m9 extends Error{constructor(z,J){super(z);this.response=J}}class XQ extends gJ{constructor(z){super(z);this.mimeType="",this.responseType="",this._abortController=new AbortController}load(z,J,Q,$){if(z===void 0)z="";if(this.path!==void 0)z=this.path+z;z=this.manager.resolveURL(z);let K=YQ.get(`file:${z}`);if(K!==void 0){this.manager.itemStart(z),setTimeout(()=>{if(J)J(K);this.manager.itemEnd(z)},0);return}if(MQ[z]!==void 0){MQ[z].push({onLoad:J,onProgress:Q,onError:$});return}MQ[z]=[],MQ[z].push({onLoad:J,onProgress:Q,onError:$});let W=new Request(z,{headers:new Headers(this.requestHeader),credentials:this.withCredentials?"include":"same-origin",signal:typeof AbortSignal.any==="function"?AbortSignal.any([this._abortController.signal,this.manager.abortController.signal]):this._abortController.signal}),q=this.mimeType,B=this.responseType;fetch(W).then((G)=>{if(G.status===200||G.status===0){if(G.status===0)Bz("FileLoader: HTTP Status 0 received.");if(typeof ReadableStream>"u"||G.body===void 0||G.body.getReader===void 0)return G;let N=MQ[z],Z=G.body.getReader(),H=G.headers.get("X-File-Size")||G.headers.get("Content-Length"),D=H?parseInt(H):0,U=D!==0,X=0,k=new ReadableStream({start(Y){V();function V(){Z.read().then(({done:L,value:O})=>{if(L)Y.close();else{X+=O.byteLength;let I=new ProgressEvent("progress",{lengthComputable:U,loaded:X,total:D});for(let S=0,w=N.length;S<w;S++){let C=N[S];if(C.onProgress)C.onProgress(I)}Y.enqueue(O),V()}},(L)=>{Y.error(L)})}}});return new Response(k)}else throw new m9(`fetch for "${G.url}" responded with ${G.status}: ${G.statusText}`,G)}).then((G)=>{switch(B){case"arraybuffer":return G.arrayBuffer();case"blob":return G.blob();case"document":return G.text().then((N)=>{return new DOMParser().parseFromString(N,q)});case"json":return G.json();default:if(q==="")return G.text();else{let Z=/charset="?([^;"\s]*)"?/i.exec(q),H=Z&&Z[1]?Z[1].toLowerCase():void 0,D=new TextDecoder(H);return G.arrayBuffer().then((U)=>D.decode(U))}}}).then((G)=>{YQ.add(`file:${z}`,G);let N=MQ[z];delete MQ[z];for(let Z=0,H=N.length;Z<H;Z++){let D=N[Z];if(D.onLoad)D.onLoad(G)}}).catch((G)=>{let N=MQ[z];if(N===void 0)throw this.manager.itemError(z),G;delete MQ[z];for(let Z=0,H=N.length;Z<H;Z++){let D=N[Z];if(D.onError)D.onError(G)}this.manager.itemError(z)}).finally(()=>{this.manager.itemEnd(z)}),this.manager.itemStart(z)}setResponseType(z){return this.responseType=z,this}setMimeType(z){return this.mimeType=z,this}abort(){return this._abortController.abort(),this._abortController=new AbortController,this}}class c9 extends gJ{constructor(z){super(z)}load(z,J,Q,$){let K=this,W=new XQ(this.manager);W.setPath(this.path),W.setRequestHeader(this.requestHeader),W.setWithCredentials(this.withCredentials),W.load(z,function(q){try{J(K.parse(JSON.parse(q)))}catch(B){if($)$(B);else Pz(B);K.manager.itemError(z)}},Q,$)}parse(z){let J=[];for(let Q=0;Q<z.length;Q++){let $=o0.parse(z[Q]);J.push($)}return J}}class n9 extends gJ{constructor(z){super(z)}load(z,J,Q,$){let K=this,W=[],q=new v1,B=new XQ(this.manager);B.setPath(this.path),B.setResponseType("arraybuffer"),B.setRequestHeader(this.requestHeader),B.setWithCredentials(K.withCredentials);let G=0;function N(Z){B.load(z[Z],function(H){let D=K.parse(H,!0);if(W[Z]={width:D.width,height:D.height,format:D.format,mipmaps:D.mipmaps},G+=1,G===6){if(D.mipmapCount===1)q.minFilter=1006;if(q.image=W,q.format=D.format,q.needsUpdate=!0,J)J(q)}},Q,$)}if(Array.isArray(z))for(let Z=0,H=z.length;Z<H;++Z)N(Z);else B.load(z,function(Z){let H=K.parse(Z,!0);if(H.isCubemap){let D=H.mipmaps.length/H.mipmapCount;for(let U=0;U<D;U++){W[U]={mipmaps:[]};for(let X=0;X<H.mipmapCount;X++)W[U].mipmaps.push(H.mipmaps[U*H.mipmapCount+X]),W[U].format=H.format,W[U].width=H.width,W[U].height=H.height}q.image=W}else q.image.width=H.width,q.image.height=H.height,q.mipmaps=H.mipmaps;if(H.mipmapCount===1)q.minFilter=1006;if(q.format=H.format,q.needsUpdate=!0,J)J(q)},Q,$);return q}}var x0=new WeakMap;class s0 extends gJ{constructor(z){super(z)}load(z,J,Q,$){if(this.path!==void 0)z=this.path+z;z=this.manager.resolveURL(z);let K=this,W=YQ.get(`image:${z}`);if(W!==void 0){if(W.complete===!0)K.manager.itemStart(z),setTimeout(function(){if(J)J(W);K.manager.itemEnd(z)},0);else{let Z=x0.get(W);if(Z===void 0)Z=[],x0.set(W,Z);Z.push({onLoad:J,onError:$})}return W}let q=F1("img");function B(){if(N(),J)J(this);let Z=x0.get(this)||[];for(let H=0;H<Z.length;H++){let D=Z[H];if(D.onLoad)D.onLoad(this)}x0.delete(this),K.manager.itemEnd(z)}function G(Z){if(N(),$)$(Z);YQ.remove(`image:${z}`);let H=x0.get(this)||[];for(let D=0;D<H.length;D++){let U=H[D];if(U.onError)U.onError(Z)}x0.delete(this),K.manager.itemError(z),K.manager.itemEnd(z)}function N(){q.removeEventListener("load",B,!1),q.removeEventListener("error",G,!1)}if(q.addEventListener("load",B,!1),q.addEventListener("error",G,!1),z.slice(0,5)!=="data:"){if(this.crossOrigin!==void 0)q.crossOrigin=this.crossOrigin}return YQ.add(`image:${z}`,q),K.manager.itemStart(z),q.src=z,q}}class o9 extends gJ{constructor(z){super(z)}load(z,J,Q,$){let K=new i0;K.colorSpace="srgb";let W=new s0(this.manager);W.setCrossOrigin(this.crossOrigin),W.setPath(this.path);let q=0;function B(G){W.load(z[G],function(N){if(K.images[G]=N,q++,q===6){if(K.needsUpdate=!0,J)J(K)}},void 0,$)}for(let G=0;G<z.length;++G)B(G);return K}}class s9 extends gJ{constructor(z){super(z)}load(z,J,Q,$){let K=this,W=new tJ,q=new XQ(this.manager);return q.setResponseType("arraybuffer"),q.setRequestHeader(this.requestHeader),q.setPath(this.path),q.setWithCredentials(K.withCredentials),q.load(z,function(B){let G;try{G=K.parse(B)}catch(N){if($!==void 0)$(N);else Pz(N);return}if(K._applyTexData(W,G),J)J(W,G)},Q,$),W}createDataTexture(z){let J=new tJ;return this._applyTexData(J,this.parse(z)),J}_applyTexData(z,J){if(J.image!==void 0)z.image=J.image;else if(J.data!==void 0)z.image.width=J.width,z.image.height=J.height,z.image.data=J.data;if(z.wrapS=J.wrapS!==void 0?J.wrapS:1001,z.wrapT=J.wrapT!==void 0?J.wrapT:1001,z.magFilter=J.magFilter!==void 0?J.magFilter:1006,z.minFilter=J.minFilter!==void 0?J.minFilter:1006,z.anisotropy=J.anisotropy!==void 0?J.anisotropy:1,J.colorSpace!==void 0)z.colorSpace=J.colorSpace;if(J.flipY!==void 0)z.flipY=J.flipY;if(J.format!==void 0)z.format=J.format;if(J.type!==void 0)z.type=J.type;if(J.mipmaps!==void 0)z.mipmaps=J.mipmaps,z.minFilter=1008;if(J.mipmapCount===1)z.minFilter=1006;if(J.generateMipmaps!==void 0)z.generateMipmaps=J.generateMipmaps;z.needsUpdate=!0}}class i9 extends gJ{constructor(z){super(z)}load(z,J,Q,$){let K=new kJ,W=new s0(this.manager);return W.setCrossOrigin(this.crossOrigin),W.setPath(this.path),W.load(z,function(q){if(K.image=q,K.needsUpdate=!0,J!==void 0)J(K)},Q,$),K}}class PQ extends KJ{constructor(z,J=1){super();this.isLight=!0,this.type="Light",this.color=new Fz(z),this.intensity=J}dispose(){this.dispatchEvent({type:"dispose"})}copy(z,J){return super.copy(z,J),this.color.copy(z.color),this.intensity=z.intensity,this}toJSON(z){let J=super.toJSON(z);return J.object.color=this.color.getHex(),J.object.intensity=this.intensity,J}}class W7 extends PQ{constructor(z,J,Q){super(z,Q);this.isHemisphereLight=!0,this.type="HemisphereLight",this.position.copy(KJ.DEFAULT_UP),this.updateMatrix(),this.groundColor=new Fz(J)}copy(z,J){return super.copy(z,J),this.groundColor.copy(z.groundColor),this}toJSON(z){let J=super.toJSON(z);return J.object.groundColor=this.groundColor.getHex(),J}}var q6=new pz,L8=new R,y8=new R;class A5{constructor(z){this.camera=z,this.intensity=1,this.bias=0,this.biasNode=null,this.normalBias=0,this.radius=1,this.blurSamples=8,this.mapSize=new a(512,512),this.mapType=1009,this.map=null,this.mapPass=null,this.matrix=new pz,this.autoUpdate=!0,this.needsUpdate=!1,this._frustum=new mQ,this._frameExtents=new a(1,1),this._viewportCount=1,this._viewports=[new BJ(0,0,1,1)]}getViewportCount(){return this._viewportCount}getFrustum(){return this._frustum}updateMatrices(z){let J=this.camera,Q=this.matrix;if(L8.setFromMatrixPosition(z.matrixWorld),J.position.copy(L8),y8.setFromMatrixPosition(z.target.matrixWorld),J.lookAt(y8),J.updateMatrixWorld(),q6.multiplyMatrices(J.projectionMatrix,J.matrixWorldInverse),this._frustum.setFromProjectionMatrix(q6,J.coordinateSystem,J.reversedDepth),J.coordinateSystem===2001||J.reversedDepth)Q.set(0.5,0,0,0.5,0,0.5,0,0.5,0,0,1,0,0,0,0,1);else Q.set(0.5,0,0,0.5,0,0.5,0,0.5,0,0,0.5,0.5,0,0,0,1);Q.multiply(q6)}getViewport(z){return this._viewports[z]}getFrameExtents(){return this._frameExtents}dispose(){if(this.map)this.map.dispose();if(this.mapPass)this.mapPass.dispose()}copy(z){return this.camera=z.camera.clone(),this.intensity=z.intensity,this.bias=z.bias,this.radius=z.radius,this.autoUpdate=z.autoUpdate,this.needsUpdate=z.needsUpdate,this.normalBias=z.normalBias,this.blurSamples=z.blurSamples,this.mapSize.copy(z.mapSize),this.biasNode=z.biasNode,this}clone(){return new this.constructor().copy(this)}toJSON(){let z={};if(this.intensity!==1)z.intensity=this.intensity;if(this.bias!==0)z.bias=this.bias;if(this.normalBias!==0)z.normalBias=this.normalBias;if(this.radius!==1)z.radius=this.radius;if(this.mapSize.x!==512||this.mapSize.y!==512)z.mapSize=this.mapSize.toArray();return z.camera=this.camera.toJSON(!1).object,delete z.camera.matrix,z}}var F2=new R,M2=new _J,UQ=new R;class d1 extends KJ{constructor(){super();this.isCamera=!0,this.type="Camera",this.matrixWorldInverse=new pz,this.projectionMatrix=new pz,this.projectionMatrixInverse=new pz,this.coordinateSystem=2000,this._reversedDepth=!1}get reversedDepth(){return this._reversedDepth}copy(z,J){return super.copy(z,J),this.matrixWorldInverse.copy(z.matrixWorldInverse),this.projectionMatrix.copy(z.projectionMatrix),this.projectionMatrixInverse.copy(z.projectionMatrixInverse),this.coordinateSystem=z.coordinateSystem,this}getWorldDirection(z){return super.getWorldDirection(z).negate()}updateMatrixWorld(z){if(super.updateMatrixWorld(z),this.matrixWorld.decompose(F2,M2,UQ),UQ.x===1&&UQ.y===1&&UQ.z===1)this.matrixWorldInverse.copy(this.matrixWorld).invert();else this.matrixWorldInverse.compose(F2,M2,UQ.set(1,1,1)).invert()}updateWorldMatrix(z,J,Q=!1){if(super.updateWorldMatrix(z,J,Q),this.matrixWorld.decompose(F2,M2,UQ),UQ.x===1&&UQ.y===1&&UQ.z===1)this.matrixWorldInverse.copy(this.matrixWorld).invert();else this.matrixWorldInverse.compose(F2,M2,UQ.set(1,1,1)).invert()}clone(){return new this.constructor().copy(this)}}var dQ=new R,S8=new a,w8=new a;class RJ extends d1{constructor(z=50,J=1,Q=0.1,$=2000){super();this.isPerspectiveCamera=!0,this.type="PerspectiveCamera",this.fov=z,this.zoom=1,this.near=Q,this.far=$,this.focus=10,this.aspect=J,this.view=null,this.filmGauge=35,this.filmOffset=0,this.updateProjectionMatrix()}copy(z,J){return super.copy(z,J),this.fov=z.fov,this.zoom=z.zoom,this.near=z.near,this.far=z.far,this.focus=z.focus,this.aspect=z.aspect,this.view=z.view===null?null:Object.assign({},z.view),this.filmGauge=z.filmGauge,this.filmOffset=z.filmOffset,this}setFocalLength(z){let J=0.5*this.getFilmHeight()/z;this.fov=l0*2*Math.atan(J),this.updateProjectionMatrix()}getFocalLength(){let z=Math.tan(Z0*0.5*this.fov);return 0.5*this.getFilmHeight()/z}getEffectiveFOV(){return l0*2*Math.atan(Math.tan(Z0*0.5*this.fov)/this.zoom)}getFilmWidth(){return this.filmGauge*Math.min(this.aspect,1)}getFilmHeight(){return this.filmGauge/Math.max(this.aspect,1)}getViewBounds(z,J,Q){dQ.set(-1,-1,0.5).applyMatrix4(this.projectionMatrixInverse),J.set(dQ.x,dQ.y).multiplyScalar(-z/dQ.z),dQ.set(1,1,0.5).applyMatrix4(this.projectionMatrixInverse),Q.set(dQ.x,dQ.y).multiplyScalar(-z/dQ.z)}getViewSize(z,J){return this.getViewBounds(z,S8,w8),J.subVectors(w8,S8)}setViewOffset(z,J,Q,$,K,W){if(this.aspect=z/J,this.view===null)this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1};this.view.enabled=!0,this.view.fullWidth=z,this.view.fullHeight=J,this.view.offsetX=Q,this.view.offsetY=$,this.view.width=K,this.view.height=W,this.updateProjectionMatrix()}clearViewOffset(){if(this.view!==null)this.view.enabled=!1;this.updateProjectionMatrix()}updateProjectionMatrix(){let z=this.near,J=z*Math.tan(Z0*0.5*this.fov)/this.zoom,Q=2*J,$=this.aspect*Q,K=-0.5*$,W=this.view;if(this.view!==null&&this.view.enabled){let{fullWidth:B,fullHeight:G}=W;K+=W.offsetX*$/B,J-=W.offsetY*Q/G,$*=W.width/B,Q*=W.height/G}let q=this.filmOffset;if(q!==0)K+=z*q/this.getFilmWidth();this.projectionMatrix.makePerspective(K,K+$,J,J-Q,z,this.far,this.coordinateSystem,this.reversedDepth),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(z){let J=super.toJSON(z);if(J.object.fov=this.fov,J.object.zoom=this.zoom,J.object.near=this.near,J.object.far=this.far,J.object.focus=this.focus,J.object.aspect=this.aspect,this.view!==null)J.object.view=Object.assign({},this.view);return J.object.filmGauge=this.filmGauge,J.object.filmOffset=this.filmOffset,J}}class a9 extends A5{constructor(){super(new RJ(50,1,0.5,500));this.isSpotLightShadow=!0,this.focus=1,this.aspect=1}updateMatrices(z){let J=this.camera,Q=l0*2*z.angle*this.focus,$=this.mapSize.width/this.mapSize.height*this.aspect,K=z.distance||J.far;if(Q!==J.fov||$!==J.aspect||K!==J.far)J.fov=Q,J.aspect=$,J.far=K,J.updateProjectionMatrix();super.updateMatrices(z)}copy(z){return super.copy(z),this.focus=z.focus,this}}class q7 extends PQ{constructor(z,J,Q=0,$=Math.PI/3,K=0,W=2){super(z,J);this.isSpotLight=!0,this.type="SpotLight",this.position.copy(KJ.DEFAULT_UP),this.updateMatrix(),this.target=new KJ,this.distance=Q,this.angle=$,this.penumbra=K,this.decay=W,this.map=null,this.shadow=new a9}get power(){return this.intensity*Math.PI}set power(z){this.intensity=z/Math.PI}dispose(){super.dispose(),this.shadow.dispose()}copy(z,J){return super.copy(z,J),this.distance=z.distance,this.angle=z.angle,this.penumbra=z.penumbra,this.decay=z.decay,this.target=z.target.clone(),this.map=z.map,this.shadow=z.shadow.clone(),this}toJSON(z){let J=super.toJSON(z);if(J.object.distance=this.distance,J.object.angle=this.angle,J.object.decay=this.decay,J.object.penumbra=this.penumbra,J.object.target=this.target.uuid,this.map&&this.map.isTexture)J.object.map=this.map.toJSON(z).uuid;return J.object.shadow=this.shadow.toJSON(),J}}class t9 extends A5{constructor(){super(new RJ(90,1,0.5,500));this.isPointLightShadow=!0}}class B7 extends PQ{constructor(z,J,Q=0,$=2){super(z,J);this.isPointLight=!0,this.type="PointLight",this.distance=Q,this.decay=$,this.shadow=new t9}get power(){return this.intensity*4*Math.PI}set power(z){this.intensity=z/(4*Math.PI)}dispose(){super.dispose(),this.shadow.dispose()}copy(z,J){return super.copy(z,J),this.distance=z.distance,this.decay=z.decay,this.shadow=z.shadow.clone(),this}toJSON(z){let J=super.toJSON(z);return J.object.distance=this.distance,J.object.decay=this.decay,J.object.shadow=this.shadow.toJSON(),J}}class r0 extends d1{constructor(z=-1,J=1,Q=1,$=-1,K=0.1,W=2000){super();this.isOrthographicCamera=!0,this.type="OrthographicCamera",this.zoom=1,this.view=null,this.left=z,this.right=J,this.top=Q,this.bottom=$,this.near=K,this.far=W,this.updateProjectionMatrix()}copy(z,J){return super.copy(z,J),this.left=z.left,this.right=z.right,this.top=z.top,this.bottom=z.bottom,this.near=z.near,this.far=z.far,this.zoom=z.zoom,this.view=z.view===null?null:Object.assign({},z.view),this}setViewOffset(z,J,Q,$,K,W){if(this.view===null)this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1};this.view.enabled=!0,this.view.fullWidth=z,this.view.fullHeight=J,this.view.offsetX=Q,this.view.offsetY=$,this.view.width=K,this.view.height=W,this.updateProjectionMatrix()}clearViewOffset(){if(this.view!==null)this.view.enabled=!1;this.updateProjectionMatrix()}updateProjectionMatrix(){let z=(this.right-this.left)/(2*this.zoom),J=(this.top-this.bottom)/(2*this.zoom),Q=(this.right+this.left)/2,$=(this.top+this.bottom)/2,K=Q-z,W=Q+z,q=$+J,B=$-J;if(this.view!==null&&this.view.enabled){let G=(this.right-this.left)/this.view.fullWidth/this.zoom,N=(this.top-this.bottom)/this.view.fullHeight/this.zoom;K+=G*this.view.offsetX,W=K+G*this.view.width,q-=N*this.view.offsetY,B=q-N*this.view.height}this.projectionMatrix.makeOrthographic(K,W,q,B,this.near,this.far,this.coordinateSystem,this.reversedDepth),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(z){let J=super.toJSON(z);if(J.object.zoom=this.zoom,J.object.left=this.left,J.object.right=this.right,J.object.top=this.top,J.object.bottom=this.bottom,J.object.near=this.near,J.object.far=this.far,this.view!==null)J.object.view=Object.assign({},this.view);return J}}class r9 extends A5{constructor(){super(new r0(-5,5,5,-5,0.5,500));this.isDirectionalLightShadow=!0}}class G7 extends PQ{constructor(z,J){super(z,J);this.isDirectionalLight=!0,this.type="DirectionalLight",this.position.copy(KJ.DEFAULT_UP),this.updateMatrix(),this.target=new KJ,this.shadow=new r9}dispose(){super.dispose(),this.shadow.dispose()}copy(z){return super.copy(z),this.target=z.target.clone(),this.shadow=z.shadow.clone(),this}toJSON(z){let J=super.toJSON(z);return J.object.shadow=this.shadow.toJSON(),J.object.target=this.target.uuid,J}}class N7 extends PQ{constructor(z,J){super(z,J);this.isAmbientLight=!0,this.type="AmbientLight"}}class D7 extends PQ{constructor(z,J,Q=10,$=10){super(z,J);this.isRectAreaLight=!0,this.type="RectAreaLight",this.width=Q,this.height=$}get power(){return this.intensity*this.width*this.height*Math.PI}set power(z){this.intensity=z/(this.width*this.height*Math.PI)}copy(z){return super.copy(z),this.width=z.width,this.height=z.height,this}toJSON(z){let J=super.toJSON(z);return J.object.width=this.width,J.object.height=this.height,J}}class O5{constructor(){this.isSphericalHarmonics3=!0,this.coefficients=[];for(let z=0;z<9;z++)this.coefficients.push(new R)}set(z){for(let J=0;J<9;J++)this.coefficients[J].copy(z[J]);return this}zero(){for(let z=0;z<9;z++)this.coefficients[z].set(0,0,0);return this}getAt(z,J){let{x:Q,y:$,z:K}=z,W=this.coefficients;return J.copy(W[0]).multiplyScalar(0.282095),J.addScaledVector(W[1],0.488603*$),J.addScaledVector(W[2],0.488603*K),J.addScaledVector(W[3],0.488603*Q),J.addScaledVector(W[4],1.092548*(Q*$)),J.addScaledVector(W[5],1.092548*($*K)),J.addScaledVector(W[6],0.315392*(3*K*K-1)),J.addScaledVector(W[7],1.092548*(Q*K)),J.addScaledVector(W[8],0.546274*(Q*Q-$*$)),J}getIrradianceAt(z,J){let{x:Q,y:$,z:K}=z,W=this.coefficients;return J.copy(W[0]).multiplyScalar(0.886227),J.addScaledVector(W[1],1.023328*$),J.addScaledVector(W[2],1.023328*K),J.addScaledVector(W[3],1.023328*Q),J.addScaledVector(W[4],0.858086*Q*$),J.addScaledVector(W[5],0.858086*$*K),J.addScaledVector(W[6],0.743125*K*K-0.247708),J.addScaledVector(W[7],0.858086*Q*K),J.addScaledVector(W[8],0.429043*(Q*Q-$*$)),J}add(z){for(let J=0;J<9;J++)this.coefficients[J].add(z.coefficients[J]);return this}addScaledSH(z,J){for(let Q=0;Q<9;Q++)this.coefficients[Q].addScaledVector(z.coefficients[Q],J);return this}scale(z){for(let J=0;J<9;J++)this.coefficients[J].multiplyScalar(z);return this}lerp(z,J){for(let Q=0;Q<9;Q++)this.coefficients[Q].lerp(z.coefficients[Q],J);return this}equals(z){for(let J=0;J<9;J++)if(!this.coefficients[J].equals(z.coefficients[J]))return!1;return!0}copy(z){return this.set(z.coefficients)}clone(){return new this.constructor().copy(this)}fromArray(z,J=0){let Q=this.coefficients;for(let $=0;$<9;$++)Q[$].fromArray(z,J+$*3);return this}toArray(z=[],J=0){let Q=this.coefficients;for(let $=0;$<9;$++)Q[$].toArray(z,J+$*3);return z}static getBasisAt(z,J){let{x:Q,y:$,z:K}=z;J[0]=0.282095,J[1]=0.488603*$,J[2]=0.488603*K,J[3]=0.488603*Q,J[4]=1.092548*Q*$,J[5]=1.092548*$*K,J[6]=0.315392*(3*K*K-1),J[7]=1.092548*Q*K,J[8]=0.546274*(Q*Q-$*$)}}class Z7 extends PQ{constructor(z=new O5,J=1){super(void 0,J);this.isLightProbe=!0,this.sh=z}copy(z){return super.copy(z),this.sh.copy(z.sh),this}toJSON(z){let J=super.toJSON(z);return J.object.sh=this.sh.toArray(),J}}var C8={};class F5 extends gJ{constructor(z){super(z);this.textures={}}load(z,J,Q,$){let K=this,W=new XQ(K.manager);W.setPath(K.path),W.setRequestHeader(K.requestHeader),W.setWithCredentials(K.withCredentials),W.load(z,function(q){try{J(K.parse(JSON.parse(q)))}catch(B){if($)$(B);else Pz(B);K.manager.itemError(z)}},Q,$)}parse(z){let J=this.createMaterialFromType(z.type);return J.fromJSON(z,this.textures),J}setTextures(z){return this.textures=z,this}createMaterialFromType(z){return F5.createMaterialFromType(z)}static createMaterialFromType(z){let Q={ShadowMaterial:o6,SpriteMaterial:l2,RawShaderMaterial:H5,ShaderMaterial:rJ,PointsMaterial:o2,MeshPhysicalMaterial:s6,MeshStandardMaterial:U5,MeshPhongMaterial:i6,MeshToonMaterial:a6,MeshNormalMaterial:t6,MeshLambertMaterial:r6,MeshDepthMaterial:V5,MeshDistanceMaterial:Y5,MeshBasicMaterial:RQ,MeshMatcapMaterial:e6,LineDashedMaterial:z7,LineBasicMaterial:bJ,Material:vJ,...C8}[z],$;if(Q===void 0)gQ(`MaterialLoader: Unknown material type "${z}". Use .registerMaterial() before starting the deserialization process.`),$=new vJ;else $=new Q;return $}static registerMaterial(z,J){C8[z]=J}}class j2{static extractUrlBase(z){let J=z.lastIndexOf("/");if(J===-1)return"./";return z.slice(0,J+1)}static resolveURL(z,J){if(typeof z!=="string"||z==="")return"";if(/^https?:\/\//i.test(J)&&/^\//.test(z))J=J.replace(/(^https?:\/\/[^\/]+).*/i,"$1");if(/^(https?:)?\/\//i.test(z))return z;if(/^data:.*,.*$/i.test(z))return z;if(/^blob:.*$/i.test(z))return z;return J+z}}class H7 extends mz{constructor(){super();this.isInstancedBufferGeometry=!0,this.type="InstancedBufferGeometry",this.instanceCount=1/0}copy(z){return super.copy(z),this.instanceCount=z.instanceCount,this}toJSON(){let z=super.toJSON();return z.instanceCount=this.instanceCount,z.isInstancedBufferGeometry=!0,z}}class U7 extends gJ{constructor(z){super(z)}load(z,J,Q,$){let K=this,W=new XQ(K.manager);W.setPath(K.path),W.setRequestHeader(K.requestHeader),W.setWithCredentials(K.withCredentials),W.load(z,function(q){try{J(K.parse(JSON.parse(q)))}catch(B){if($)$(B);else Pz(B);K.manager.itemError(z)}},Q,$)}parse(z){let J={},Q={};function $(D,U){if(J[U]!==void 0)return J[U];let k=D.interleavedBuffers[U],Y=K(D,k.buffer),V=u0(k.type,Y),L=new P1(V,k.stride);return L.uuid=k.uuid,J[U]=L,L}function K(D,U){if(Q[U]!==void 0)return Q[U];let k=D.arrayBuffers[U],Y=new Uint32Array(k).buffer;return Q[U]=Y,Y}let W=z.isInstancedBufferGeometry?new H7:new mz,q=z.data.index;if(q!==void 0){let D=u0(q.type,q.array);W.setIndex(new GJ(D,1))}let B=z.data.attributes;for(let D in B){let U=B[D],X;if(U.isInterleavedBufferAttribute){let k=$(z.data,U.data);X=new H0(k,U.itemSize,U.offset,U.normalized)}else{let k=u0(U.type,U.array);X=new(U.isInstancedBufferAttribute?U0:GJ)(k,U.itemSize,U.normalized)}if(U.name!==void 0)X.name=U.name;if(U.usage!==void 0)X.setUsage(U.usage);W.setAttribute(D,X)}let G=z.data.morphAttributes;if(G)for(let D in G){let U=G[D],X=[];for(let k=0,Y=U.length;k<Y;k++){let V=U[k],L;if(V.isInterleavedBufferAttribute){let O=$(z.data,V.data);L=new H0(O,V.itemSize,V.offset,V.normalized)}else{let O=u0(V.type,V.array);L=new GJ(O,V.itemSize,V.normalized)}if(V.name!==void 0)L.name=V.name;X.push(L)}W.morphAttributes[D]=X}if(z.data.morphTargetsRelative)W.morphTargetsRelative=!0;let Z=z.data.groups||z.data.drawcalls||z.data.offsets;if(Z!==void 0)for(let D=0,U=Z.length;D!==U;++D){let X=Z[D];W.addGroup(X.start,X.count,X.materialIndex)}let H=z.data.boundingSphere;if(H!==void 0)W.boundingSphere=new PJ().fromJSON(H);if(z.name)W.name=z.name;if(z.userData)W.userData=z.userData;return W}}var B6={};class e9 extends gJ{constructor(z){super(z)}load(z,J,Q,$){let K=this,W=this.path===""?j2.extractUrlBase(z):this.path;this.resourcePath=this.resourcePath||W;let q=new XQ(this.manager);q.setPath(this.path),q.setRequestHeader(this.requestHeader),q.setWithCredentials(this.withCredentials),q.load(z,function(B){let G=null;try{G=JSON.parse(B)}catch(Z){if($!==void 0)$(Z);Pz("ObjectLoader: Can't parse "+z+".",Z.message);return}let N=G.metadata;if(N===void 0||N.type===void 0||N.type.toLowerCase()==="geometry"){if($!==void 0)$(Error("THREE.ObjectLoader: Can't load "+z));Pz("ObjectLoader: Can't load "+z);return}K.parse(G,J)},Q,$)}async loadAsync(z,J){let Q=this,$=this.path===""?j2.extractUrlBase(z):this.path;this.resourcePath=this.resourcePath||$;let K=new XQ(this.manager);K.setPath(this.path),K.setRequestHeader(this.requestHeader),K.setWithCredentials(this.withCredentials);let W=await K.loadAsync(z,J),q;try{q=JSON.parse(W)}catch(G){throw Error("THREE.ObjectLoader: Can't parse "+z+". "+G.message)}let B=q.metadata;if(B===void 0||B.type===void 0||B.type.toLowerCase()==="geometry")throw Error("THREE.ObjectLoader: Can't load "+z);return await Q.parseAsync(q)}parse(z,J){let Q=this.parseAnimations(z.animations),$=this.parseShapes(z.shapes),K=this.parseGeometries(z.geometries,$),W=this.parseImages(z.images,function(){if(J!==void 0)J(G)}),q=this.parseTextures(z.textures,W),B=this.parseMaterials(z.materials,q),G=this.parseObject(z.object,K,B,q,Q),N=this.parseSkeletons(z.skeletons,G);if(this.bindSkeletons(G,N),this.bindLightTargets(G),J!==void 0){let Z=!1;for(let H in W)if(W[H].data instanceof HTMLImageElement){Z=!0;break}if(Z===!1)J(G)}return G}async parseAsync(z){let J=this.parseAnimations(z.animations),Q=this.parseShapes(z.shapes),$=this.parseGeometries(z.geometries,Q),K=await this.parseImagesAsync(z.images),W=this.parseTextures(z.textures,K),q=this.parseMaterials(z.materials,W),B=this.parseObject(z.object,$,q,W,J),G=this.parseSkeletons(z.skeletons,B);return this.bindSkeletons(B,G),this.bindLightTargets(B),B}static registerGeometry(z,J){B6[z]=J}parseShapes(z){let J={};if(z!==void 0)for(let Q=0,$=z.length;Q<$;Q++){let K=new a0().fromJSON(z[Q]);J[K.uuid]=K}return J}parseSkeletons(z,J){let Q={},$={};if(J.traverse(function(K){if(K.isBone)$[K.uuid]=K}),z!==void 0)for(let K=0,W=z.length;K<W;K++){let q=new c2().fromJSON(z[K],$);Q[q.uuid]=q}return Q}parseGeometries(z,J){let Q={};if(z!==void 0){let $=new U7;for(let K=0,W=z.length;K<W;K++){let q,B=z[K];switch(B.type){case"BufferGeometry":case"InstancedBufferGeometry":q=$.parse(B);break;default:if(B.type in O8)q=O8[B.type].fromJSON(B,J);else if(B.type in B6)q=B6[B.type].fromJSON(B,J);else Bz(`ObjectLoader: Unknown geometry type "${B.type}". Use .registerGeometry() before starting the deserialization process.`)}if(q.uuid=B.uuid,B.name!==void 0)q.name=B.name;if(B.userData!==void 0)q.userData=B.userData;Q[B.uuid]=q}}return Q}parseMaterials(z,J){let Q={},$={};if(z!==void 0){let K=new F5;K.setTextures(J);for(let W=0,q=z.length;W<q;W++){let B=z[W];if(Q[B.uuid]===void 0)Q[B.uuid]=K.parse(B);$[B.uuid]=Q[B.uuid]}}return $}parseAnimations(z){let J={};if(z!==void 0)for(let Q=0;Q<z.length;Q++){let $=z[Q],K=o0.parse($);J[K.uuid]=K}return J}parseImages(z,J){let Q=this,$={},K;function W(B){return B=Q.manager.resolveURL(B),Q.manager.itemStart(B),K.load(B,function(){Q.manager.itemEnd(B)},void 0,function(){Q.manager.itemError(B),Q.manager.itemEnd(B)})}function q(B){if(typeof B==="string"){let G=B,N=/^(\/\/)|([a-z]+:(\/\/)?)/i.test(G)?G:Q.resourcePath+G;return W(N)}else if(B.data)return{data:u0(B.type,B.data),width:B.width,height:B.height};else return null}if(z!==void 0&&z.length>0){let B=new I5(J);K=new s0(B),K.setCrossOrigin(this.crossOrigin);for(let G=0,N=z.length;G<N;G++){let Z=z[G],H=Z.url;if(Array.isArray(H)){let D=[];for(let U=0,X=H.length;U<X;U++){let k=H[U],Y=q(k);if(Y!==null)if(Y instanceof HTMLImageElement)D.push(Y);else D.push(new tJ(Y.data,Y.width,Y.height))}$[Z.uuid]=new SQ(D)}else{let D=q(Z.url);$[Z.uuid]=new SQ(D)}}}return $}async parseImagesAsync(z){let J=this,Q={},$;async function K(W){if(typeof W==="string"){let q=W,B=/^(\/\/)|([a-z]+:(\/\/)?)/i.test(q)?q:J.resourcePath+q;return await $.loadAsync(B)}else if(W.data)return{data:u0(W.type,W.data),width:W.width,height:W.height};else return null}if(z!==void 0&&z.length>0){$=new s0(this.manager),$.setCrossOrigin(this.crossOrigin);for(let W=0,q=z.length;W<q;W++){let B=z[W],G=B.url;if(Array.isArray(G)){let N=[];for(let Z=0,H=G.length;Z<H;Z++){let D=G[Z],U=await K(D);if(U!==null)if(U instanceof HTMLImageElement)N.push(U);else N.push(new tJ(U.data,U.width,U.height))}Q[B.uuid]=new SQ(N)}else{let N=await K(B.url);Q[B.uuid]=new SQ(N)}}}return Q}parseTextures(z,J){function Q(K,W){if(typeof K==="number")return K;return Bz("ObjectLoader.parseTexture: Constant should be in numeric form.",K),W[K]}let $={};if(z!==void 0)for(let K=0,W=z.length;K<W;K++){let q=z[K];if(q.image===void 0)Bz('ObjectLoader: No "image" specified for',q.uuid);if(J[q.image]===void 0)Bz("ObjectLoader: Undefined image",q.image);let B=J[q.image],G=B.data,N;if(Array.isArray(G)){if(N=new i0,G.length===6)N.needsUpdate=!0}else{if(G&&G.data)N=new tJ;else N=new kJ;if(G)N.needsUpdate=!0}if(N.source=B,N.uuid=q.uuid,q.name!==void 0)N.name=q.name;if(q.mapping!==void 0)N.mapping=Q(q.mapping,uW);if(q.channel!==void 0)N.channel=q.channel;if(q.offset!==void 0)N.offset.fromArray(q.offset);if(q.repeat!==void 0)N.repeat.fromArray(q.repeat);if(q.center!==void 0)N.center.fromArray(q.center);if(q.rotation!==void 0)N.rotation=q.rotation;if(q.wrap!==void 0)N.wrapS=Q(q.wrap[0],R8),N.wrapT=Q(q.wrap[1],R8);if(q.format!==void 0)N.format=q.format;if(q.internalFormat!==void 0)N.internalFormat=q.internalFormat;if(q.type!==void 0)N.type=q.type;if(q.colorSpace!==void 0)N.colorSpace=q.colorSpace;if(q.minFilter!==void 0)N.minFilter=Q(q.minFilter,P8);if(q.magFilter!==void 0)N.magFilter=Q(q.magFilter,P8);if(q.anisotropy!==void 0)N.anisotropy=q.anisotropy;if(q.flipY!==void 0)N.flipY=q.flipY;if(q.generateMipmaps!==void 0)N.generateMipmaps=q.generateMipmaps;if(q.premultiplyAlpha!==void 0)N.premultiplyAlpha=q.premultiplyAlpha;if(q.unpackAlignment!==void 0)N.unpackAlignment=q.unpackAlignment;if(q.compareFunction!==void 0)N.compareFunction=q.compareFunction;if(q.normalized!==void 0)N.normalized=q.normalized;if(q.userData!==void 0)N.userData=q.userData;$[q.uuid]=N}return $}parseObject(z,J,Q,$,K){let W;function q(H){if(J[H]===void 0)Bz("ObjectLoader: Undefined geometry",H);return J[H]}function B(H){if(H===void 0)return;if(Array.isArray(H)){let D=[];for(let U=0,X=H.length;U<X;U++){let k=H[U];if(Q[k]===void 0)Bz("ObjectLoader: Undefined material",k);D.push(Q[k])}return D}if(Q[H]===void 0)Bz("ObjectLoader: Undefined material",H);return Q[H]}function G(H){if($[H]===void 0)Bz("ObjectLoader: Undefined texture",H);return $[H]}let N,Z;switch(z.type){case"Scene":if(W=new R6,z.background!==void 0)if(Number.isInteger(z.background))W.background=new Fz(z.background);else W.background=G(z.background);if(z.environment!==void 0)W.environment=G(z.environment);if(z.fog!==void 0){if(z.fog.type==="Fog")W.fog=new p2(z.fog.color,z.fog.near,z.fog.far);else if(z.fog.type==="FogExp2")W.fog=new d2(z.fog.color,z.fog.density);if(z.fog.name!=="")W.fog.name=z.fog.name}if(z.backgroundBlurriness!==void 0)W.backgroundBlurriness=z.backgroundBlurriness;if(z.backgroundIntensity!==void 0)W.backgroundIntensity=z.backgroundIntensity;if(z.backgroundRotation!==void 0)W.backgroundRotation.fromArray(z.backgroundRotation);if(z.environmentIntensity!==void 0)W.environmentIntensity=z.environmentIntensity;if(z.environmentRotation!==void 0)W.environmentRotation.fromArray(z.environmentRotation);break;case"PerspectiveCamera":if(W=new RJ(z.fov,z.aspect,z.near,z.far),z.focus!==void 0)W.focus=z.focus;if(z.zoom!==void 0)W.zoom=z.zoom;if(z.filmGauge!==void 0)W.filmGauge=z.filmGauge;if(z.filmOffset!==void 0)W.filmOffset=z.filmOffset;if(z.view!==void 0)W.view=Object.assign({},z.view);break;case"OrthographicCamera":if(W=new r0(z.left,z.right,z.top,z.bottom,z.near,z.far),z.zoom!==void 0)W.zoom=z.zoom;if(z.view!==void 0)W.view=Object.assign({},z.view);break;case"AmbientLight":W=new N7(z.color,z.intensity);break;case"DirectionalLight":W=new G7(z.color,z.intensity),W.target=z.target||"";break;case"PointLight":W=new B7(z.color,z.intensity,z.distance,z.decay);break;case"RectAreaLight":W=new D7(z.color,z.intensity,z.width,z.height);break;case"SpotLight":W=new q7(z.color,z.intensity,z.distance,z.angle,z.penumbra,z.decay),W.target=z.target||"";break;case"HemisphereLight":W=new W7(z.color,z.groundColor,z.intensity);break;case"LightProbe":let H=new O5().fromArray(z.sh);W=new Z7(H,z.intensity);break;case"SkinnedMesh":if(N=q(z.geometry),Z=B(z.material),W=new f6(N,Z),z.bindMode!==void 0)W.bindMode=z.bindMode;if(z.bindMatrix!==void 0)W.bindMatrix.fromArray(z.bindMatrix);if(z.skeleton!==void 0)W.skeleton=z.skeleton;break;case"Mesh":N=q(z.geometry),Z=B(z.material),W=new LJ(N,Z);break;case"InstancedMesh":N=q(z.geometry),Z=B(z.material);let{count:D,instanceMatrix:U,instanceColor:X}=z;if(W=new T6(N,Z,D),W.instanceMatrix=new U0(new Float32Array(U.array),16),X!==void 0)W.instanceColor=new U0(new Float32Array(X.array),X.itemSize);break;case"BatchedMesh":if(N=q(z.geometry),Z=B(z.material),W=new h6(z.maxInstanceCount,z.maxVertexCount,z.maxIndexCount,Z),W.geometry=N,W.perObjectFrustumCulled=z.perObjectFrustumCulled,W.sortObjects=z.sortObjects,W._drawRanges=z.drawRanges,W._reservedRanges=z.reservedRanges,W._geometryInfo=z.geometryInfo.map((k)=>{let Y=null,V=null;if(k.boundingBox!==void 0)Y=new fJ().fromJSON(k.boundingBox);if(k.boundingSphere!==void 0)V=new PJ().fromJSON(k.boundingSphere);return{...k,boundingBox:Y,boundingSphere:V}}),W._instanceInfo=z.instanceInfo,W._availableInstanceIds=z._availableInstanceIds,W._availableGeometryIds=z._availableGeometryIds,W._nextIndexStart=z.nextIndexStart,W._nextVertexStart=z.nextVertexStart,W._geometryCount=z.geometryCount,W._maxInstanceCount=z.maxInstanceCount,W._maxVertexCount=z.maxVertexCount,W._maxIndexCount=z.maxIndexCount,W._geometryInitialized=z.geometryInitialized,W._matricesTexture=G(z.matricesTexture.uuid),W._indirectTexture=G(z.indirectTexture.uuid),z.colorsTexture!==void 0)W._colorsTexture=G(z.colorsTexture.uuid);if(z.boundingSphere!==void 0)W.boundingSphere=new PJ().fromJSON(z.boundingSphere);if(z.boundingBox!==void 0)W.boundingBox=new fJ().fromJSON(z.boundingBox);break;case"LOD":W=new v6;break;case"Line":W=new CQ(q(z.geometry),B(z.material));break;case"LineLoop":W=new x6(q(z.geometry),B(z.material));break;case"LineSegments":W=new DQ(q(z.geometry),B(z.material));break;case"PointCloud":case"Points":W=new j6(q(z.geometry),B(z.material));break;case"Sprite":W=new P6(B(z.material));break;case"Group":W=new N0;break;case"Bone":W=new m2;break;default:W=new KJ}if(W.uuid=z.uuid,z.name!==void 0)W.name=z.name;if(z.matrix!==void 0){if(W.matrix.fromArray(z.matrix),z.matrixAutoUpdate!==void 0)W.matrixAutoUpdate=z.matrixAutoUpdate;if(W.matrixAutoUpdate)W.matrix.decompose(W.position,W.quaternion,W.scale)}else{if(z.position!==void 0)W.position.fromArray(z.position);if(z.rotation!==void 0)W.rotation.fromArray(z.rotation);if(z.quaternion!==void 0)W.quaternion.fromArray(z.quaternion);if(z.scale!==void 0)W.scale.fromArray(z.scale)}if(z.up!==void 0)W.up.fromArray(z.up);if(z.pivot!==void 0)W.pivot=new R().fromArray(z.pivot);if(z.morphTargetDictionary!==void 0)W.morphTargetDictionary=Object.assign({},z.morphTargetDictionary);if(z.morphTargetInfluences!==void 0)W.morphTargetInfluences=z.morphTargetInfluences.slice();if(z.castShadow!==void 0)W.castShadow=z.castShadow;if(z.receiveShadow!==void 0)W.receiveShadow=z.receiveShadow;if(z.shadow){if(z.shadow.intensity!==void 0)W.shadow.intensity=z.shadow.intensity;if(z.shadow.bias!==void 0)W.shadow.bias=z.shadow.bias;if(z.shadow.normalBias!==void 0)W.shadow.normalBias=z.shadow.normalBias;if(z.shadow.radius!==void 0)W.shadow.radius=z.shadow.radius;if(z.shadow.mapSize!==void 0)W.shadow.mapSize.fromArray(z.shadow.mapSize);if(z.shadow.camera!==void 0)W.shadow.camera=this.parseObject(z.shadow.camera)}if(z.visible!==void 0)W.visible=z.visible;if(z.frustumCulled!==void 0)W.frustumCulled=z.frustumCulled;if(z.renderOrder!==void 0)W.renderOrder=z.renderOrder;if(z.static!==void 0)W.static=z.static;if(z.userData!==void 0)W.userData=z.userData;if(z.layers!==void 0)W.layers.mask=z.layers;if(z.children!==void 0){let H=z.children;for(let D=0;D<H.length;D++)W.add(this.parseObject(H[D],J,Q,$,K))}if(z.animations!==void 0){let H=z.animations;for(let D=0;D<H.length;D++){let U=H[D];W.animations.push(K[U])}}if(z.type==="LOD"){if(z.autoUpdate!==void 0)W.autoUpdate=z.autoUpdate;let H=z.levels;for(let D=0;D<H.length;D++){let U=H[D],X=W.getObjectByProperty("uuid",U.object);if(X!==void 0)W.addLevel(X,U.distance,U.hysteresis)}}return W}bindSkeletons(z,J){if(Object.keys(J).length===0)return;z.traverse(function(Q){if(Q.isSkinnedMesh===!0&&Q.skeleton!==void 0){let $=J[Q.skeleton];if($===void 0)Bz("ObjectLoader: No skeleton found with UUID:",Q.skeleton);else Q.bind($,Q.bindMatrix)}})}bindLightTargets(z){z.traverse(function(J){if(J.isDirectionalLight||J.isSpotLight){let Q=J.target,$=z.getObjectByProperty("uuid",Q);if($!==void 0)J.target=$;else J.target=new KJ}})}}var uW={UVMapping:300,CubeReflectionMapping:301,CubeRefractionMapping:302,EquirectangularReflectionMapping:303,EquirectangularRefractionMapping:304,CubeUVReflectionMapping:306},R8={RepeatWrapping:1000,ClampToEdgeWrapping:1001,MirroredRepeatWrapping:1002},P8={NearestFilter:1003,NearestMipmapNearestFilter:1004,NearestMipmapLinearFilter:1005,LinearFilter:1006,LinearMipmapNearestFilter:1007,LinearMipmapLinearFilter:1008},G6=new WeakMap;class z$ extends gJ{constructor(z){super(z);if(this.isImageBitmapLoader=!0,typeof createImageBitmap>"u")Bz("ImageBitmapLoader: createImageBitmap() not supported.");if(typeof fetch>"u")Bz("ImageBitmapLoader: fetch() not supported.");this.options={premultiplyAlpha:"none"},this._abortController=new AbortController}setOptions(z){return this.options=z,this}load(z,J,Q,$){if(z===void 0)z="";if(this.path!==void 0)z=this.path+z;z=this.manager.resolveURL(z);let K=this,W=YQ.get(`image-bitmap:${z}`);if(W!==void 0){if(K.manager.itemStart(z),W.then){W.then((G)=>{if(G6.has(W)===!0){if($)$(G6.get(W));K.manager.itemError(z),K.manager.itemEnd(z)}else{if(J)J(G);K.manager.itemEnd(z)}});return}setTimeout(function(){if(J)J(W);K.manager.itemEnd(z)},0);return}let q={};q.credentials=this.crossOrigin==="anonymous"?"same-origin":"include",q.headers=this.requestHeader,q.signal=typeof AbortSignal.any==="function"?AbortSignal.any([this._abortController.signal,this.manager.abortController.signal]):this._abortController.signal;let B=fetch(z,q).then(function(G){return G.blob()}).then(function(G){return createImageBitmap(G,Object.assign(K.options,{colorSpaceConversion:"none"}))}).then(function(G){if(YQ.add(`image-bitmap:${z}`,G),J)J(G);K.manager.itemEnd(z)}).catch(function(G){if($)$(G);G6.set(B,G),YQ.remove(`image-bitmap:${z}`),K.manager.itemError(z),K.manager.itemEnd(z)});YQ.add(`image-bitmap:${z}`,B),K.manager.itemStart(z)}abort(){return this._abortController.abort(),this._abortController=new AbortController,this}}var L2;class M5{static getContext(){if(L2===void 0)L2=new(window.AudioContext||window.webkitAudioContext);return L2}static setContext(z){L2=z}}class J$ extends gJ{constructor(z){super(z)}load(z,J,Q,$){let K=this,W=new XQ(this.manager);W.setResponseType("arraybuffer"),W.setPath(this.path),W.setRequestHeader(this.requestHeader),W.setWithCredentials(this.withCredentials),W.load(z,function(B){try{let G=B.slice(0),N=M5.getContext(),Z=z+"#decode";K.manager.itemStart(Z),N.decodeAudioData(G,function(H){J(H),K.manager.itemEnd(Z)}).catch(function(H){q(H),K.manager.itemEnd(Z)})}catch(G){q(G)}},Q,$);function q(B){if($)$(B);else Pz(B);K.manager.itemError(z)}}}var v8=new pz,f8=new pz,Q0=new pz;class Q${constructor(){this.type="StereoCamera",this.aspect=1,this.eyeSep=0.064,this.cameraL=new RJ,this.cameraL.layers.enable(1),this.cameraL.matrixAutoUpdate=!1,this.cameraR=new RJ,this.cameraR.layers.enable(2),this.cameraR.matrixAutoUpdate=!1,this._cache={focus:null,fov:null,aspect:null,near:null,far:null,zoom:null,eyeSep:null}}update(z){let J=this._cache;if(J.focus!==z.focus||J.fov!==z.fov||J.aspect!==z.aspect*this.aspect||J.near!==z.near||J.far!==z.far||J.zoom!==z.zoom||J.eyeSep!==this.eyeSep){J.focus=z.focus,J.fov=z.fov,J.aspect=z.aspect*this.aspect,J.near=z.near,J.far=z.far,J.zoom=z.zoom,J.eyeSep=this.eyeSep,Q0.copy(z.projectionMatrix);let $=J.eyeSep/2,K=$*J.near/J.focus,W=J.near*Math.tan(Z0*J.fov*0.5)/J.zoom,q,B;f8.elements[12]=-$,v8.elements[12]=$,q=-W*J.aspect+K,B=W*J.aspect+K,Q0.elements[0]=2*J.near/(B-q),Q0.elements[8]=(B+q)/(B-q),this.cameraL.projectionMatrix.copy(Q0),q=-W*J.aspect-K,B=W*J.aspect-K,Q0.elements[0]=2*J.near/(B-q),Q0.elements[8]=(B+q)/(B-q),this.cameraR.projectionMatrix.copy(Q0)}this.cameraL.matrix.copy(z.matrixWorld).multiply(f8),this.cameraL.matrixWorldNeedsUpdate=!0,this.cameraR.matrix.copy(z.matrixWorld).multiply(v8),this.cameraR.matrixWorldNeedsUpdate=!0}}var j0=-90,_0=1;class V7 extends KJ{constructor(z,J,Q){super();this.type="CubeCamera",this.renderTarget=Q,this.coordinateSystem=null,this.activeMipmapLevel=0;let $=new RJ(j0,_0,z,J);$.layers=this.layers,this.add($);let K=new RJ(j0,_0,z,J);K.layers=this.layers,this.add(K);let W=new RJ(j0,_0,z,J);W.layers=this.layers,this.add(W);let q=new RJ(j0,_0,z,J);q.layers=this.layers,this.add(q);let B=new RJ(j0,_0,z,J);B.layers=this.layers,this.add(B);let G=new RJ(j0,_0,z,J);G.layers=this.layers,this.add(G)}updateCoordinateSystem(){let z=this.coordinateSystem,J=this.children.concat(),[Q,$,K,W,q,B]=J;for(let G of J)this.remove(G);if(z===2000)Q.up.set(0,1,0),Q.lookAt(1,0,0),$.up.set(0,1,0),$.lookAt(-1,0,0),K.up.set(0,0,-1),K.lookAt(0,1,0),W.up.set(0,0,1),W.lookAt(0,-1,0),q.up.set(0,1,0),q.lookAt(0,0,1),B.up.set(0,1,0),B.lookAt(0,0,-1);else if(z===2001)Q.up.set(0,-1,0),Q.lookAt(-1,0,0),$.up.set(0,-1,0),$.lookAt(1,0,0),K.up.set(0,0,1),K.lookAt(0,1,0),W.up.set(0,0,-1),W.lookAt(0,-1,0),q.up.set(0,-1,0),q.lookAt(0,0,1),B.up.set(0,-1,0),B.lookAt(0,0,-1);else throw Error("THREE.CubeCamera.updateCoordinateSystem(): Invalid coordinate system: "+z);for(let G of J)this.add(G),G.updateMatrixWorld()}update(z,J){if(this.parent===null)this.updateMatrixWorld();let{renderTarget:Q,activeMipmapLevel:$}=this;if(this.coordinateSystem!==z.coordinateSystem)this.coordinateSystem=z.coordinateSystem,this.updateCoordinateSystem();let[K,W,q,B,G,N]=this.children,Z=z.getRenderTarget(),H=z.getActiveCubeFace(),D=z.getActiveMipmapLevel(),U=z.xr.enabled;z.xr.enabled=!1;let X=Q.texture.generateMipmaps;Q.texture.generateMipmaps=!1;let k=!1;if(z.isWebGLRenderer===!0)k=z.state.buffers.depth.getReversed();else k=z.reversedDepthBuffer;if(z.setRenderTarget(Q,0,$),k&&z.autoClear===!1)z.clearDepth();if(z.render(J,K),z.setRenderTarget(Q,1,$),k&&z.autoClear===!1)z.clearDepth();if(z.render(J,W),z.setRenderTarget(Q,2,$),k&&z.autoClear===!1)z.clearDepth();if(z.render(J,q),z.setRenderTarget(Q,3,$),k&&z.autoClear===!1)z.clearDepth();if(z.render(J,B),z.setRenderTarget(Q,4,$),k&&z.autoClear===!1)z.clearDepth();if(z.render(J,G),Q.texture.generateMipmaps=X,z.setRenderTarget(Q,5,$),k&&z.autoClear===!1)z.clearDepth();z.render(J,N),z.setRenderTarget(Z,H,D),z.xr.enabled=U,Q.texture.needsPMREMUpdate=!0}}class Y7 extends RJ{constructor(z=[]){super();this.isArrayCamera=!0,this.isMultiViewCamera=!1,this.cameras=z}}class X7{constructor(){this._previousTime=0,this._currentTime=0,this._startTime=performance.now(),this._delta=0,this._elapsed=0,this._timescale=1,this._document=null,this._pageVisibilityHandler=null}connect(z){if(this._document=z,z.hidden!==void 0)this._pageVisibilityHandler=gW.bind(this),z.addEventListener("visibilitychange",this._pageVisibilityHandler,!1)}disconnect(){if(this._pageVisibilityHandler!==null)this._document.removeEventListener("visibilitychange",this._pageVisibilityHandler),this._pageVisibilityHandler=null;this._document=null}getDelta(){return this._delta/1000}getElapsed(){return this._elapsed/1000}getTimescale(){return this._timescale}setTimescale(z){return this._timescale=z,this}reset(){return this._currentTime=performance.now()-this._startTime,this}dispose(){this.disconnect()}update(z){if(this._pageVisibilityHandler!==null&&this._document.hidden===!0)this._delta=0;else this._previousTime=this._currentTime,this._currentTime=(z!==void 0?z:performance.now())-this._startTime,this._delta=(this._currentTime-this._previousTime)*this._timescale,this._elapsed+=this._delta;return this}}function gW(){if(this._document.hidden===!1)this.reset()}var $0=new R,N6=new _J,lW=new R,K0=new R,W0=new R;class $$ extends KJ{constructor(){super();this.type="AudioListener",this.context=M5.getContext(),this.gain=this.context.createGain(),this.gain.connect(this.context.destination),this.filter=null,this.timeDelta=0,this._timer=new X7}getInput(){return this.gain}removeFilter(){if(this.filter!==null)this.gain.disconnect(this.filter),this.filter.disconnect(this.context.destination),this.gain.connect(this.context.destination),this.filter=null;return this}getFilter(){return this.filter}setFilter(z){if(this.filter!==null)this.gain.disconnect(this.filter),this.filter.disconnect(this.context.destination);else this.gain.disconnect(this.context.destination);return this.filter=z,this.gain.connect(this.filter),this.filter.connect(this.context.destination),this}getMasterVolume(){return this.gain.gain.value}setMasterVolume(z){return this.gain.gain.setTargetAtTime(z,this.context.currentTime,0.01),this}updateMatrixWorld(z){super.updateMatrixWorld(z),this._timer.update();let J=this.context.listener;if(this.timeDelta=this._timer.getDelta(),this.matrixWorld.decompose($0,N6,lW),K0.set(0,0,-1).applyQuaternion(N6),W0.set(0,1,0).applyQuaternion(N6),J.positionX){let Q=this.context.currentTime+this.timeDelta;J.positionX.linearRampToValueAtTime($0.x,Q),J.positionY.linearRampToValueAtTime($0.y,Q),J.positionZ.linearRampToValueAtTime($0.z,Q),J.forwardX.linearRampToValueAtTime(K0.x,Q),J.forwardY.linearRampToValueAtTime(K0.y,Q),J.forwardZ.linearRampToValueAtTime(K0.z,Q),J.upX.linearRampToValueAtTime(W0.x,Q),J.upY.linearRampToValueAtTime(W0.y,Q),J.upZ.linearRampToValueAtTime(W0.z,Q)}else J.setPosition($0.x,$0.y,$0.z),J.setOrientation(K0.x,K0.y,K0.z,W0.x,W0.y,W0.z)}}class k7 extends KJ{constructor(z){super();this.type="Audio",this.listener=z,this.context=z.context,this.gain=this.context.createGain(),this.gain.connect(z.getInput()),this.autoplay=!1,this.buffer=null,this.detune=0,this.loop=!1,this.loopStart=0,this.loopEnd=0,this.offset=0,this.duration=void 0,this.playbackRate=1,this.isPlaying=!1,this.hasPlaybackControl=!0,this.source=null,this.sourceType="empty",this._startedAt=0,this._progress=0,this._connected=!1,this.filters=[]}getOutput(){return this.gain}setNodeSource(z){return this.hasPlaybackControl=!1,this.sourceType="audioNode",this.source=z,this.connect(),this}setMediaElementSource(z){return this.hasPlaybackControl=!1,this.sourceType="mediaNode",this.source=this.context.createMediaElementSource(z),this.connect(),this}setMediaStreamSource(z){return this.hasPlaybackControl=!1,this.sourceType="mediaStreamNode",this.source=this.context.createMediaStreamSource(z),this.connect(),this}setBuffer(z){if(this.buffer=z,this.sourceType="buffer",this.autoplay)this.play();return this}play(z=0){if(this.isPlaying===!0){Bz("Audio: Audio is already playing.");return}if(this.hasPlaybackControl===!1){Bz("Audio: this Audio has no playback control.");return}this._startedAt=this.context.currentTime+z;let J=this.context.createBufferSource();return J.buffer=this.buffer,J.loop=this.loop,J.loopStart=this.loopStart,J.loopEnd=this.loopEnd,J.onended=this.onEnded.bind(this),J.start(this._startedAt,this._progress+this.offset,this.duration),this.isPlaying=!0,this.source=J,this.setDetune(this.detune),this.setPlaybackRate(this.playbackRate),this.connect()}pause(){if(this.hasPlaybackControl===!1){Bz("Audio: this Audio has no playback control.");return}if(this.isPlaying===!0){if(this._progress+=Math.max(this.context.currentTime-this._startedAt,0)*this.playbackRate,this.loop===!0)this._progress=this._progress%(this.duration||this.buffer.duration);this.source.stop(),this.source.onended=null,this.isPlaying=!1}return this}stop(z=0){if(this.hasPlaybackControl===!1){Bz("Audio: this Audio has no playback control.");return}if(this._progress=0,this.source!==null)this.source.stop(this.context.currentTime+z),this.source.onended=null;return this.isPlaying=!1,this}connect(){if(this.filters.length>0){this.source.connect(this.filters[0]);for(let z=1,J=this.filters.length;z<J;z++)this.filters[z-1].connect(this.filters[z]);this.filters[this.filters.length-1].connect(this.getOutput())}else this.source.connect(this.getOutput());return this._connected=!0,this}disconnect(){if(this._connected===!1)return;if(this.filters.length>0){this.source.disconnect(this.filters[0]);for(let z=1,J=this.filters.length;z<J;z++)this.filters[z-1].disconnect(this.filters[z]);this.filters[this.filters.length-1].disconnect(this.getOutput())}else this.source.disconnect(this.getOutput());return this._connected=!1,this}getFilters(){return this.filters}setFilters(z){if(!z)z=[];if(this._connected===!0)this.disconnect(),this.filters=z.slice(),this.connect();else this.filters=z.slice();return this}setDetune(z){if(this.detune=z,this.isPlaying===!0&&this.source.detune!==void 0)this.source.detune.setTargetAtTime(this.detune,this.context.currentTime,0.01);return this}getDetune(){return this.detune}getFilter(){return this.getFilters()[0]}setFilter(z){return this.setFilters(z?[z]:[])}setPlaybackRate(z){if(this.hasPlaybackControl===!1){Bz("Audio: this Audio has no playback control.");return}if(this.playbackRate=z,this.isPlaying===!0)this.source.playbackRate.setTargetAtTime(this.playbackRate,this.context.currentTime,0.01);return this}getPlaybackRate(){return this.playbackRate}onEnded(){this.isPlaying=!1,this._progress=0}getLoop(){if(this.hasPlaybackControl===!1)return Bz("Audio: this Audio has no playback control."),!1;return this.loop}setLoop(z){if(this.hasPlaybackControl===!1){Bz("Audio: this Audio has no playback control.");return}if(this.loop=z,this.isPlaying===!0)this.source.loop=this.loop;return this}setLoopStart(z){return this.loopStart=z,this}setLoopEnd(z){return this.loopEnd=z,this}getVolume(){return this.gain.gain.value}setVolume(z){return this.gain.gain.setTargetAtTime(z,this.context.currentTime,0.01),this}copy(z,J){if(super.copy(z,J),z.sourceType!=="buffer")return Bz("Audio: Audio source type cannot be copied."),this;return this.autoplay=z.autoplay,this.buffer=z.buffer,this.detune=z.detune,this.loop=z.loop,this.loopStart=z.loopStart,this.loopEnd=z.loopEnd,this.offset=z.offset,this.duration=z.duration,this.playbackRate=z.playbackRate,this.hasPlaybackControl=z.hasPlaybackControl,this.sourceType=z.sourceType,this.filters=z.filters.slice(),this}clone(z){return new this.constructor(this.listener).copy(this,z)}}var q0=new R,T8=new _J,mW=new R,B0=new R;class K$ extends k7{constructor(z){super(z);this.panner=this.context.createPanner(),this.panner.panningModel="HRTF",this.panner.connect(this.gain)}connect(){return super.connect(),this.panner.connect(this.gain),this}disconnect(){return super.disconnect(),this.panner.disconnect(this.gain),this}getOutput(){return this.panner}getRefDistance(){return this.panner.refDistance}setRefDistance(z){return this.panner.refDistance=z,this}getRolloffFactor(){return this.panner.rolloffFactor}setRolloffFactor(z){return this.panner.rolloffFactor=z,this}getDistanceModel(){return this.panner.distanceModel}setDistanceModel(z){return this.panner.distanceModel=z,this}getMaxDistance(){return this.panner.maxDistance}setMaxDistance(z){return this.panner.maxDistance=z,this}setDirectionalCone(z,J,Q){return this.panner.coneInnerAngle=z,this.panner.coneOuterAngle=J,this.panner.coneOuterGain=Q,this}updateMatrixWorld(z){if(super.updateMatrixWorld(z),this.hasPlaybackControl===!0&&this.isPlaying===!1)return;this.matrixWorld.decompose(q0,T8,mW),B0.set(0,0,1).applyQuaternion(T8);let J=this.panner;if(J.positionX){let Q=this.context.currentTime+this.listener.timeDelta;J.positionX.linearRampToValueAtTime(q0.x,Q),J.positionY.linearRampToValueAtTime(q0.y,Q),J.positionZ.linearRampToValueAtTime(q0.z,Q),J.orientationX.linearRampToValueAtTime(B0.x,Q),J.orientationY.linearRampToValueAtTime(B0.y,Q),J.orientationZ.linearRampToValueAtTime(B0.z,Q)}else J.setPosition(q0.x,q0.y,q0.z),J.setOrientation(B0.x,B0.y,B0.z)}}class W${constructor(z,J=2048){this.analyser=z.context.createAnalyser(),this.analyser.fftSize=J,this.data=new Uint8Array(this.analyser.frequencyBinCount),z.getOutput().connect(this.analyser)}getFrequencyData(){return this.analyser.getByteFrequencyData(this.data),this.data}getAverageFrequency(){let z=0,J=this.getFrequencyData();for(let Q=0;Q<J.length;Q++)z+=J[Q];return z/J.length}}class E7{constructor(z,J,Q){this.binding=z,this.valueSize=Q;let $,K,W;switch(J){case"quaternion":$=this._slerp,K=this._slerpAdditive,W=this._setAdditiveIdentityQuaternion,this.buffer=new Float64Array(Q*6),this._workIndex=5;break;case"string":case"bool":$=this._select,K=this._select,W=this._setAdditiveIdentityOther,this.buffer=Array(Q*5);break;default:$=this._lerp,K=this._lerpAdditive,W=this._setAdditiveIdentityNumeric,this.buffer=new Float64Array(Q*5)}this._mixBufferRegion=$,this._mixBufferRegionAdditive=K,this._setIdentity=W,this._origIndex=3,this._addIndex=4,this.cumulativeWeight=0,this.cumulativeWeightAdditive=0,this.useCount=0,this.referenceCount=0}accumulate(z,J){let Q=this.buffer,$=this.valueSize,K=z*$+$,W=this.cumulativeWeight;if(W===0){for(let q=0;q!==$;++q)Q[K+q]=Q[q];W=J}else{W+=J;let q=J/W;this._mixBufferRegion(Q,K,0,q,$)}this.cumulativeWeight=W}accumulateAdditive(z){let J=this.buffer,Q=this.valueSize,$=Q*this._addIndex;if(this.cumulativeWeightAdditive===0)this._setIdentity();this._mixBufferRegionAdditive(J,$,0,z,Q),this.cumulativeWeightAdditive+=z}apply(z){let J=this.valueSize,Q=this.buffer,$=z*J+J,K=this.cumulativeWeight,W=this.cumulativeWeightAdditive,q=this.binding;if(this.cumulativeWeight=0,this.cumulativeWeightAdditive=0,K<1){let B=J*this._origIndex;this._mixBufferRegion(Q,$,B,1-K,J)}if(W>0)this._mixBufferRegionAdditive(Q,$,this._addIndex*J,1,J);for(let B=J,G=J+J;B!==G;++B)if(Q[B]!==Q[B+J]){q.setValue(Q,$);break}}saveOriginalState(){let z=this.binding,J=this.buffer,Q=this.valueSize,$=Q*this._origIndex;z.getValue(J,$);for(let K=Q,W=$;K!==W;++K)J[K]=J[$+K%Q];this._setIdentity(),this.cumulativeWeight=0,this.cumulativeWeightAdditive=0}restoreOriginalState(){let z=this.valueSize*3;this.binding.setValue(this.buffer,z)}_setAdditiveIdentityNumeric(){let z=this._addIndex*this.valueSize,J=z+this.valueSize;for(let Q=z;Q<J;Q++)this.buffer[Q]=0}_setAdditiveIdentityQuaternion(){this._setAdditiveIdentityNumeric(),this.buffer[this._addIndex*this.valueSize+3]=1}_setAdditiveIdentityOther(){let z=this._origIndex*this.valueSize,J=this._addIndex*this.valueSize;for(let Q=0;Q<this.valueSize;Q++)this.buffer[J+Q]=this.buffer[z+Q]}_select(z,J,Q,$,K){if($>=0.5)for(let W=0;W!==K;++W)z[J+W]=z[Q+W]}_slerp(z,J,Q,$){_J.slerpFlat(z,J,z,J,z,Q,$)}_slerpAdditive(z,J,Q,$,K){let W=this._workIndex*K;_J.multiplyQuaternionsFlat(z,W,z,J,z,Q),_J.slerpFlat(z,J,z,J,z,W,$)}_lerp(z,J,Q,$,K){let W=1-$;for(let q=0;q!==K;++q){let B=J+q;z[B]=z[B]*W+z[Q+q]*$}}_lerpAdditive(z,J,Q,$,K){for(let W=0;W!==K;++W){let q=J+W;z[q]=z[q]+z[Q+W]*$}}}var I7="\\[\\]\\.:\\/",cW=new RegExp("["+I7+"]","g"),A7="[^"+I7+"]",nW="[^"+I7.replace("\\.","")+"]",oW=/((?:WC+[\/:])*)/.source.replace("WC",A7),sW=/(WCOD+)?/.source.replace("WCOD",nW),iW=/(?:\.(WC+)(?:\[(.+)\])?)?/.source.replace("WC",A7),aW=/\.(WC+)(?:\[(.+)\])?/.source.replace("WC",A7),tW=new RegExp("^"+oW+sW+iW+aW+"$"),rW=["material","materials","bones","map"];class q${constructor(z,J,Q){let $=Q||$J.parseTrackName(J);this._targetGroup=z,this._bindings=z.subscribe_(J,$)}getValue(z,J){this.bind();let Q=this._targetGroup.nCachedObjects_,$=this._bindings[Q];if($!==void 0)$.getValue(z,J)}setValue(z,J){let Q=this._bindings;for(let $=this._targetGroup.nCachedObjects_,K=Q.length;$!==K;++$)Q[$].setValue(z,J)}bind(){let z=this._bindings;for(let J=this._targetGroup.nCachedObjects_,Q=z.length;J!==Q;++J)z[J].bind()}unbind(){let z=this._bindings;for(let J=this._targetGroup.nCachedObjects_,Q=z.length;J!==Q;++J)z[J].unbind()}}class $J{constructor(z,J,Q){this.path=J,this.parsedPath=Q||$J.parseTrackName(J),this.node=$J.findNode(z,this.parsedPath.nodeName),this.rootNode=z,this.getValue=this._getValue_unbound,this.setValue=this._setValue_unbound}static create(z,J,Q){if(!(z&&z.isAnimationObjectGroup))return new $J(z,J,Q);else return new $J.Composite(z,J,Q)}static sanitizeNodeName(z){return z.replace(/\s/g,"_").replace(cW,"")}static parseTrackName(z){let J=tW.exec(z);if(J===null)throw Error("THREE.PropertyBinding: Cannot parse trackName: "+z);let Q={nodeName:J[2],objectName:J[3],objectIndex:J[4],propertyName:J[5],propertyIndex:J[6]},$=Q.nodeName&&Q.nodeName.lastIndexOf(".");if($!==void 0&&$!==-1){let K=Q.nodeName.substring($+1);if(rW.indexOf(K)!==-1)Q.nodeName=Q.nodeName.substring(0,$),Q.objectName=K}if(Q.propertyName===null||Q.propertyName.length===0)throw Error("THREE.PropertyBinding: can not parse propertyName from trackName: "+z);return Q}static findNode(z,J){if(J===void 0||J===""||J==="."||J===-1||J===z.name||J===z.uuid)return z;if(z.skeleton){let Q=z.skeleton.getBoneByName(J);if(Q!==void 0)return Q}if(z.children){let Q=function(K){for(let W=0;W<K.length;W++){let q=K[W];if(q.name===J||q.uuid===J)return q;let B=Q(q.children);if(B)return B}return null},$=Q(z.children);if($)return $}return null}_getValue_unavailable(){}_setValue_unavailable(){}_getValue_direct(z,J){z[J]=this.targetObject[this.propertyName]}_getValue_array(z,J){let Q=this.resolvedProperty;for(let $=0,K=Q.length;$!==K;++$)z[J++]=Q[$]}_getValue_arrayElement(z,J){z[J]=this.resolvedProperty[this.propertyIndex]}_getValue_toArray(z,J){this.resolvedProperty.toArray(z,J)}_setValue_direct(z,J){this.targetObject[this.propertyName]=z[J]}_setValue_direct_setNeedsUpdate(z,J){this.targetObject[this.propertyName]=z[J],this.targetObject.needsUpdate=!0}_setValue_direct_setMatrixWorldNeedsUpdate(z,J){this.targetObject[this.propertyName]=z[J],this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_array(z,J){let Q=this.resolvedProperty;for(let $=0,K=Q.length;$!==K;++$)Q[$]=z[J++]}_setValue_array_setNeedsUpdate(z,J){let Q=this.resolvedProperty;for(let $=0,K=Q.length;$!==K;++$)Q[$]=z[J++];this.targetObject.needsUpdate=!0}_setValue_array_setMatrixWorldNeedsUpdate(z,J){let Q=this.resolvedProperty;for(let $=0,K=Q.length;$!==K;++$)Q[$]=z[J++];this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_arrayElement(z,J){this.resolvedProperty[this.propertyIndex]=z[J]}_setValue_arrayElement_setNeedsUpdate(z,J){this.resolvedProperty[this.propertyIndex]=z[J],this.targetObject.needsUpdate=!0}_setValue_arrayElement_setMatrixWorldNeedsUpdate(z,J){this.resolvedProperty[this.propertyIndex]=z[J],this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_fromArray(z,J){this.resolvedProperty.fromArray(z,J)}_setValue_fromArray_setNeedsUpdate(z,J){this.resolvedProperty.fromArray(z,J),this.targetObject.needsUpdate=!0}_setValue_fromArray_setMatrixWorldNeedsUpdate(z,J){this.resolvedProperty.fromArray(z,J),this.targetObject.matrixWorldNeedsUpdate=!0}_getValue_unbound(z,J){this.bind(),this.getValue(z,J)}_setValue_unbound(z,J){this.bind(),this.setValue(z,J)}bind(){let z=this.node,J=this.parsedPath,Q=J.objectName,$=J.propertyName,K=J.propertyIndex;if(!z)z=$J.findNode(this.rootNode,J.nodeName),this.node=z;if(this.getValue=this._getValue_unavailable,this.setValue=this._setValue_unavailable,!z){Bz("PropertyBinding: No target node found for track: "+this.path+".");return}if(Q){let G=J.objectIndex;switch(Q){case"materials":if(!z.material){Pz("PropertyBinding: Can not bind to material as node does not have a material.",this);return}if(!z.material.materials){Pz("PropertyBinding: Can not bind to material.materials as node.material does not have a materials array.",this);return}z=z.material.materials;break;case"bones":if(!z.skeleton){Pz("PropertyBinding: Can not bind to bones as node does not have a skeleton.",this);return}z=z.skeleton.bones;for(let N=0;N<z.length;N++)if(z[N].name===G){G=N;break}break;case"map":if("map"in z){z=z.map;break}if(!z.material){Pz("PropertyBinding: Can not bind to material as node does not have a material.",this);return}if(!z.material.map){Pz("PropertyBinding: Can not bind to material.map as node.material does not have a map.",this);return}z=z.material.map;break;default:if(z[Q]===void 0){Pz("PropertyBinding: Can not bind to objectName of node undefined.",this);return}z=z[Q]}if(G!==void 0){if(z[G]===void 0){Pz("PropertyBinding: Trying to bind to objectIndex of objectName, but is undefined.",this,z);return}z=z[G]}}let W=z[$];if(W===void 0){let G=J.nodeName;Pz("PropertyBinding: Trying to update property for track: "+G+"."+$+" but it wasn't found.",z);return}let q=this.Versioning.None;if(this.targetObject=z,z.isMaterial===!0)q=this.Versioning.NeedsUpdate;else if(z.isObject3D===!0)q=this.Versioning.MatrixWorldNeedsUpdate;let B=this.BindingType.Direct;if(K!==void 0){if($==="morphTargetInfluences"){if(!z.geometry){Pz("PropertyBinding: Can not bind to morphTargetInfluences because node does not have a geometry.",this);return}if(!z.geometry.morphAttributes){Pz("PropertyBinding: Can not bind to morphTargetInfluences because node does not have a geometry.morphAttributes.",this);return}if(z.morphTargetDictionary[K]!==void 0)K=z.morphTargetDictionary[K]}B=this.BindingType.ArrayElement,this.resolvedProperty=W,this.propertyIndex=K}else if(W.fromArray!==void 0&&W.toArray!==void 0)B=this.BindingType.HasFromToArray,this.resolvedProperty=W;else if(Array.isArray(W))B=this.BindingType.EntireArray,this.resolvedProperty=W;else this.propertyName=$;this.getValue=this.GetterByBindingType[B],this.setValue=this.SetterByBindingTypeAndVersioning[B][q]}unbind(){this.node=null,this.getValue=this._getValue_unbound,this.setValue=this._setValue_unbound}}$J.Composite=q$;$J.prototype.BindingType={Direct:0,EntireArray:1,ArrayElement:2,HasFromToArray:3};$J.prototype.Versioning={None:0,NeedsUpdate:1,MatrixWorldNeedsUpdate:2};$J.prototype.GetterByBindingType=[$J.prototype._getValue_direct,$J.prototype._getValue_array,$J.prototype._getValue_arrayElement,$J.prototype._getValue_toArray];$J.prototype.SetterByBindingTypeAndVersioning=[[$J.prototype._setValue_direct,$J.prototype._setValue_direct_setNeedsUpdate,$J.prototype._setValue_direct_setMatrixWorldNeedsUpdate],[$J.prototype._setValue_array,$J.prototype._setValue_array_setNeedsUpdate,$J.prototype._setValue_array_setMatrixWorldNeedsUpdate],[$J.prototype._setValue_arrayElement,$J.prototype._setValue_arrayElement_setNeedsUpdate,$J.prototype._setValue_arrayElement_setMatrixWorldNeedsUpdate],[$J.prototype._setValue_fromArray,$J.prototype._setValue_fromArray_setNeedsUpdate,$J.prototype._setValue_fromArray_setMatrixWorldNeedsUpdate]];class B${constructor(){this.isAnimationObjectGroup=!0,this.uuid=aJ(),this._objects=Array.prototype.slice.call(arguments),this.nCachedObjects_=0;let z={};this._indicesByUUID=z;for(let Q=0,$=arguments.length;Q!==$;++Q)z[arguments[Q].uuid]=Q;this._paths=[],this._parsedPaths=[],this._bindings=[],this._bindingsIndicesByPath={};let J=this;this.stats={objects:{get total(){return J._objects.length},get inUse(){return this.total-J.nCachedObjects_}},get bindingsPerObject(){return J._bindings.length}}}add(){let z=this._objects,J=this._indicesByUUID,Q=this._paths,$=this._parsedPaths,K=this._bindings,W=K.length,q=void 0,B=z.length,G=this.nCachedObjects_;for(let N=0,Z=arguments.length;N!==Z;++N){let H=arguments[N],D=H.uuid,U=J[D];if(U===void 0){U=B++,J[D]=U,z.push(H);for(let X=0,k=W;X!==k;++X)K[X].push(new $J(H,Q[X],$[X]))}else if(U<G){q=z[U];let X=--G,k=z[X];J[k.uuid]=U,z[U]=k,J[D]=X,z[X]=H;for(let Y=0,V=W;Y!==V;++Y){let L=K[Y],O=L[X],I=L[U];if(L[U]=O,I===void 0)I=new $J(H,Q[Y],$[Y]);L[X]=I}}else if(z[U]!==q)Pz("AnimationObjectGroup: Different objects with the same UUID detected. Clean the caches or recreate your infrastructure when reloading scenes.")}this.nCachedObjects_=G}remove(){let z=this._objects,J=this._indicesByUUID,Q=this._bindings,$=Q.length,K=this.nCachedObjects_;for(let W=0,q=arguments.length;W!==q;++W){let B=arguments[W],G=B.uuid,N=J[G];if(N!==void 0&&N>=K){let Z=K++,H=z[Z];J[H.uuid]=N,z[N]=H,J[G]=Z,z[Z]=B;for(let D=0,U=$;D!==U;++D){let X=Q[D],k=X[Z],Y=X[N];X[N]=k,X[Z]=Y}}}this.nCachedObjects_=K}uncache(){let z=this._objects,J=this._indicesByUUID,Q=this._bindings,$=Q.length,K=this.nCachedObjects_,W=z.length;for(let q=0,B=arguments.length;q!==B;++q){let G=arguments[q],N=G.uuid,Z=J[N];if(Z!==void 0)if(delete J[N],Z<K){let H=--K,D=z[H],U=--W,X=z[U];J[D.uuid]=Z,z[Z]=D,J[X.uuid]=H,z[H]=X,z.pop();for(let k=0,Y=$;k!==Y;++k){let V=Q[k],L=V[H],O=V[U];V[Z]=L,V[H]=O,V.pop()}}else{let H=--W,D=z[H];if(H>0)J[D.uuid]=Z;z[Z]=D,z.pop();for(let U=0,X=$;U!==X;++U){let k=Q[U];k[Z]=k[H],k.pop()}}}this.nCachedObjects_=K}subscribe_(z,J){let Q=this._bindingsIndicesByPath,$=Q[z],K=this._bindings;if($!==void 0)return K[$];let W=this._paths,q=this._parsedPaths,B=this._objects,G=B.length,N=this.nCachedObjects_,Z=Array(G);$=K.length,Q[z]=$,W.push(z),q.push(J),K.push(Z);for(let H=N,D=B.length;H!==D;++H){let U=B[H];Z[H]=new $J(U,z,J)}return Z}unsubscribe_(z){let J=this._bindingsIndicesByPath,Q=J[z];if(Q!==void 0){let $=this._paths,K=this._parsedPaths,W=this._bindings,q=W.length-1,B=W[q],G=z[q];J[G]=Q,W[Q]=B,W.pop(),K[Q]=K[q],K.pop(),$[Q]=$[q],$.pop()}}}class O7{constructor(z,J,Q=null,$=J.blendMode){this._mixer=z,this._clip=J,this._localRoot=Q,this.blendMode=$;let K=J.tracks,W=K.length,q=Array(W),B={endingStart:2400,endingEnd:2400};for(let G=0;G!==W;++G){let N=K[G].createInterpolant(null);q[G]=N,N.settings=B}this._interpolantSettings=B,this._interpolants=q,this._propertyBindings=Array(W),this._cacheIndex=null,this._byClipCacheIndex=null,this._timeScaleInterpolant=null,this._restoreTimeScale=null,this._weightInterpolant=null,this.loop=2201,this._loopCount=-1,this._startTime=null,this.time=0,this.timeScale=1,this._effectiveTimeScale=1,this.weight=1,this._effectiveWeight=1,this.repetitions=1/0,this.paused=!1,this.enabled=!0,this.clampWhenFinished=!1,this.zeroSlopeAtStart=!0,this.zeroSlopeAtEnd=!0}play(){return this._mixer._activateAction(this),this}stop(){return this._mixer._deactivateAction(this),this.reset()}reset(){return this.paused=!1,this.enabled=!0,this.time=0,this._loopCount=-1,this._startTime=null,this.stopFading().stopWarping()}isRunning(){return this.enabled&&!this.paused&&this.timeScale!==0&&this._startTime===null&&this._mixer._isActiveAction(this)}isScheduled(){return this._mixer._isActiveAction(this)}startAt(z){return this._startTime=z,this}setLoop(z,J){return this.loop=z,this.repetitions=J,this}setEffectiveWeight(z){return this.weight=z,this._effectiveWeight=this.enabled?z:0,this.stopFading()}getEffectiveWeight(){return this._effectiveWeight}fadeIn(z){return this._scheduleFading(z,0,1)}fadeOut(z){return this._scheduleFading(z,1,0)}crossFadeFrom(z,J,Q=!1){if(z.fadeOut(J),this.fadeIn(J),Q===!0){let $=this._clip.duration,K=z._clip.duration,W=K/$,q=$/K;z._restoreTimeScale=z.timeScale,this._restoreTimeScale=this.timeScale,z.warp(1,W,J),this.warp(q,1,J)}return this}crossFadeTo(z,J,Q=!1){return z.crossFadeFrom(this,J,Q)}stopFading(){let z=this._weightInterpolant;if(z!==null)this._weightInterpolant=null,this._mixer._takeBackControlInterpolant(z);return this}setEffectiveTimeScale(z){return this.timeScale=z,this._effectiveTimeScale=this.paused?0:z,this.stopWarping()}getEffectiveTimeScale(){return this._effectiveTimeScale}setDuration(z){return this.timeScale=this._clip.duration/z,this.stopWarping()}syncWith(z){return this.time=z.time,this.timeScale=z.timeScale,this.stopWarping()}halt(z){return this.warp(this._effectiveTimeScale,0,z)}warp(z,J,Q){let $=this._mixer,K=$.time,W=this.timeScale,q=this._timeScaleInterpolant;if(q===null)q=$._lendControlInterpolant(),this._timeScaleInterpolant=q;let{parameterPositions:B,sampleValues:G}=q;return B[0]=K,B[1]=K+Q,G[0]=z/W,G[1]=J/W,this}stopWarping(){let z=this._timeScaleInterpolant;if(z!==null)this._timeScaleInterpolant=null,this._mixer._takeBackControlInterpolant(z);return this._restoreTimeScale=null,this}getMixer(){return this._mixer}getClip(){return this._clip}getRoot(){return this._localRoot||this._mixer._root}_update(z,J,Q,$){if(!this.enabled){this._updateWeight(z);return}let K=this._startTime;if(K!==null){let B=(z-K)*Q;if(B<0||Q===0)J=0;else this._startTime=null,J=Q*B}J*=this._updateTimeScale(z);let W=this._updateTime(J),q=this._updateWeight(z);if(q>0){let B=this._interpolants,G=this._propertyBindings;switch(this.blendMode){case 2501:for(let N=0,Z=B.length;N!==Z;++N)B[N].evaluate(W),G[N].accumulateAdditive(q);break;case 2500:default:for(let N=0,Z=B.length;N!==Z;++N)B[N].evaluate(W),G[N].accumulate($,q)}}}_updateWeight(z){let J=0;if(this.enabled){J=this.weight;let Q=this._weightInterpolant;if(Q!==null){let $=Q.evaluate(z)[0];if(J*=$,z>Q.parameterPositions[1]){if(this.stopFading(),$===0)this.enabled=!1}}}return this._effectiveWeight=J,J}_updateTimeScale(z){let J=0;if(!this.paused){J=this.timeScale;let Q=this._timeScaleInterpolant;if(Q!==null){let $=Q.evaluate(z)[0];if(J*=$,z>Q.parameterPositions[1]){if(J===0)this.paused=!0;else{if(this._restoreTimeScale!==null)J=this._restoreTimeScale;this.timeScale=J}this.stopWarping()}}}return this._effectiveTimeScale=J,J}_updateTime(z){let J=this._clip.duration,Q=this.loop,$=this.time+z,K=this._loopCount,W=Q===2202;if(z===0){if(K===-1)return $;return W&&(K&1)===1?J-$:$}if(Q===2200){if(K===-1)this._loopCount=0,this._setEndings(!0,!0,!1);z:{if($>=J)$=J;else if($<0)$=0;else{this.time=$;break z}if(this.clampWhenFinished)this.paused=!0;else this.enabled=!1;this.time=$,this._mixer.dispatchEvent({type:"finished",action:this,direction:z<0?-1:1})}}else{if(K===-1)if(z>=0)K=0,this._setEndings(!0,this.repetitions===0,W);else this._setEndings(this.repetitions===0,!0,W);if($>=J||$<0){let q=Math.floor($/J);$-=J*q,K+=Math.abs(q);let B=this.repetitions-K;if(B<=0){if(this.clampWhenFinished)this.paused=!0;else this.enabled=!1;$=z>0?J:0,this.time=$,this._mixer.dispatchEvent({type:"finished",action:this,direction:z>0?1:-1})}else{if(B===1){let G=z<0;this._setEndings(G,!G,W)}else this._setEndings(!1,!1,W);this._loopCount=K,this.time=$,this._mixer.dispatchEvent({type:"loop",action:this,loopDelta:q})}}else this._loopCount=K,this.time=$;if(W&&(K&1)===1)return J-$}return $}_setEndings(z,J,Q){let $=this._interpolantSettings;if(Q)$.endingStart=2401,$.endingEnd=2401;else{if(z)$.endingStart=this.zeroSlopeAtStart?2401:2400;else $.endingStart=2402;if(J)$.endingEnd=this.zeroSlopeAtEnd?2401:2400;else $.endingEnd=2402}}_scheduleFading(z,J,Q){let $=this._mixer,K=$.time,W=this._weightInterpolant;if(W===null)W=$._lendControlInterpolant(),this._weightInterpolant=W;let{parameterPositions:q,sampleValues:B}=W;return q[0]=K,B[0]=J,q[1]=K+z,B[1]=Q,this}}var eW=new Float32Array(1);class G$ extends QQ{constructor(z){super();if(this._root=z,this._initMemoryManager(),this._accuIndex=0,this.time=0,this.timeScale=1,typeof __THREE_DEVTOOLS__<"u")__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}_bindAction(z,J){let Q=z._localRoot||this._root,$=z._clip.tracks,K=$.length,W=z._propertyBindings,q=z._interpolants,B=Q.uuid,G=this._bindingsByRootAndName,N=G[B];if(N===void 0)N={},G[B]=N;for(let Z=0;Z!==K;++Z){let H=$[Z],D=H.name,U=N[D];if(U!==void 0)++U.referenceCount,W[Z]=U;else{if(U=W[Z],U!==void 0){if(U._cacheIndex===null)++U.referenceCount,this._addInactiveBinding(U,B,D);continue}let X=J&&J._propertyBindings[Z].binding.parsedPath;U=new E7($J.create(Q,D,X),H.ValueTypeName,H.getValueSize()),++U.referenceCount,this._addInactiveBinding(U,B,D),W[Z]=U}q[Z].resultBuffer=U.buffer}}_activateAction(z){if(!this._isActiveAction(z)){if(z._cacheIndex===null){let Q=(z._localRoot||this._root).uuid,$=z._clip.uuid,K=this._actionsByClip[$];this._bindAction(z,K&&K.knownActions[0]),this._addInactiveAction(z,$,Q)}let J=z._propertyBindings;for(let Q=0,$=J.length;Q!==$;++Q){let K=J[Q];if(K.useCount++===0)this._lendBinding(K),K.saveOriginalState()}this._lendAction(z)}}_deactivateAction(z){if(this._isActiveAction(z)){let J=z._propertyBindings;for(let Q=0,$=J.length;Q!==$;++Q){let K=J[Q];if(--K.useCount===0)K.restoreOriginalState(),this._takeBackBinding(K)}this._takeBackAction(z)}}_initMemoryManager(){this._actions=[],this._nActiveActions=0,this._actionsByClip={},this._bindings=[],this._nActiveBindings=0,this._bindingsByRootAndName={},this._controlInterpolants=[],this._nActiveControlInterpolants=0;let z=this;this.stats={actions:{get total(){return z._actions.length},get inUse(){return z._nActiveActions}},bindings:{get total(){return z._bindings.length},get inUse(){return z._nActiveBindings}},controlInterpolants:{get total(){return z._controlInterpolants.length},get inUse(){return z._nActiveControlInterpolants}}}}_isActiveAction(z){let J=z._cacheIndex;return J!==null&&J<this._nActiveActions}_addInactiveAction(z,J,Q){let $=this._actions,K=this._actionsByClip,W=K[J];if(W===void 0)W={knownActions:[z],actionByRoot:{}},z._byClipCacheIndex=0,K[J]=W;else{let q=W.knownActions;z._byClipCacheIndex=q.length,q.push(z)}z._cacheIndex=$.length,$.push(z),W.actionByRoot[Q]=z}_removeInactiveAction(z){let J=this._actions,Q=J[J.length-1],$=z._cacheIndex;Q._cacheIndex=$,J[$]=Q,J.pop(),z._cacheIndex=null;let K=z._clip.uuid,W=this._actionsByClip,q=W[K],B=q.knownActions,G=B[B.length-1],N=z._byClipCacheIndex;G._byClipCacheIndex=N,B[N]=G,B.pop(),z._byClipCacheIndex=null;let Z=q.actionByRoot,H=(z._localRoot||this._root).uuid;if(delete Z[H],B.length===0)delete W[K];this._removeInactiveBindingsForAction(z)}_removeInactiveBindingsForAction(z){let J=z._propertyBindings;for(let Q=0,$=J.length;Q!==$;++Q){let K=J[Q];if(--K.referenceCount===0)this._removeInactiveBinding(K)}}_lendAction(z){let J=this._actions,Q=z._cacheIndex,$=this._nActiveActions++,K=J[$];z._cacheIndex=$,J[$]=z,K._cacheIndex=Q,J[Q]=K}_takeBackAction(z){let J=this._actions,Q=z._cacheIndex,$=--this._nActiveActions,K=J[$];z._cacheIndex=$,J[$]=z,K._cacheIndex=Q,J[Q]=K}_addInactiveBinding(z,J,Q){let $=this._bindingsByRootAndName,K=this._bindings,W=$[J];if(W===void 0)W={},$[J]=W;W[Q]=z,z._cacheIndex=K.length,K.push(z)}_removeInactiveBinding(z){let J=this._bindings,Q=z.binding,$=Q.rootNode.uuid,K=Q.path,W=this._bindingsByRootAndName,q=W[$],B=J[J.length-1],G=z._cacheIndex;if(B._cacheIndex=G,J[G]=B,J.pop(),delete q[K],Object.keys(q).length===0)delete W[$]}_lendBinding(z){let J=this._bindings,Q=z._cacheIndex,$=this._nActiveBindings++,K=J[$];z._cacheIndex=$,J[$]=z,K._cacheIndex=Q,J[Q]=K}_takeBackBinding(z){let J=this._bindings,Q=z._cacheIndex,$=--this._nActiveBindings,K=J[$];z._cacheIndex=$,J[$]=z,K._cacheIndex=Q,J[Q]=K}_lendControlInterpolant(){let z=this._controlInterpolants,J=this._nActiveControlInterpolants++,Q=z[J];if(Q===void 0)Q=new X5(new Float32Array(2),new Float32Array(2),1,eW),Q.__cacheIndex=J,z[J]=Q;return Q}_takeBackControlInterpolant(z){let J=this._controlInterpolants,Q=z.__cacheIndex,$=--this._nActiveControlInterpolants,K=J[$];z.__cacheIndex=$,J[$]=z,K.__cacheIndex=Q,J[Q]=K}clipAction(z,J,Q){let $=J||this._root,K=$.uuid,W=typeof z==="string"?o0.findByName($,z):z,q=W!==null?W.uuid:z,B=this._actionsByClip[q],G=null;if(Q===void 0)if(W!==null)Q=W.blendMode;else Q=2500;if(B!==void 0){let Z=B.actionByRoot[K];if(Z!==void 0&&Z.blendMode===Q)return Z;if(G=B.knownActions[0],W===null)W=G._clip}if(W===null)return null;let N=new O7(this,W,J,Q);return this._bindAction(N,G),this._addInactiveAction(N,q,K),N}existingAction(z,J){let Q=J||this._root,$=Q.uuid,K=typeof z==="string"?o0.findByName(Q,z):z,W=K?K.uuid:z,q=this._actionsByClip[W];if(q!==void 0)return q.actionByRoot[$]||null;return null}stopAllAction(){let z=this._actions,J=this._nActiveActions;for(let Q=J-1;Q>=0;--Q)z[Q].stop();return this}update(z){z*=this.timeScale;let J=this._actions,Q=this._nActiveActions,$=this.time+=z,K=Math.sign(z),W=this._accuIndex^=1;for(let G=0;G!==Q;++G)J[G]._update($,z,K,W);let q=this._bindings,B=this._nActiveBindings;for(let G=0;G!==B;++G)q[G].apply(W);return this}setTime(z){this.time=0;for(let J=0;J<this._actions.length;J++)this._actions[J].time=0;return this.update(z)}getRoot(){return this._root}uncacheClip(z){let J=this._actions,Q=z.uuid,$=this._actionsByClip,K=$[Q];if(K!==void 0){let W=K.knownActions;for(let q=0,B=W.length;q!==B;++q){let G=W[q];this._deactivateAction(G);let N=G._cacheIndex,Z=J[J.length-1];G._cacheIndex=null,G._byClipCacheIndex=null,Z._cacheIndex=N,J[N]=Z,J.pop(),this._removeInactiveBindingsForAction(G)}delete $[Q]}}uncacheRoot(z){let J=z.uuid,Q=this._actionsByClip;for(let W in Q){let q=Q[W].actionByRoot,B=q[J];if(B!==void 0)this._deactivateAction(B),this._removeInactiveAction(B)}let $=this._bindingsByRootAndName,K=$[J];if(K!==void 0)for(let W in K){let q=K[W];q.restoreOriginalState(),this._removeInactiveBinding(q)}}uncacheAction(z,J){let Q=this.existingAction(z,J);if(Q!==null)this._deactivateAction(Q),this._removeInactiveAction(Q)}}class N$ extends b2{constructor(z=1,J=1,Q=1,$={}){super(z,J,$);this.isRenderTarget3D=!0,this.depth=Q,this.texture=new C1(null,z,J,Q),this._setTextureOptions($),this.texture.isRenderTargetTexture=!0}}class F7{constructor(z){this.value=z}clone(){return new F7(this.value.clone===void 0?this.value:this.value.clone())}}var z3=0;class D$ extends QQ{constructor(){super();this.isUniformsGroup=!0,Object.defineProperty(this,"id",{value:z3++}),this.name="",this.usage=35044,this.uniforms=[]}add(z){return this.uniforms.push(z),this}remove(z){let J=this.uniforms.indexOf(z);if(J!==-1)this.uniforms.splice(J,1);return this}setName(z){return this.name=z,this}setUsage(z){return this.usage=z,this}dispose(){this.dispatchEvent({type:"dispose"})}copy(z){this.name=z.name,this.usage=z.usage;let J=z.uniforms;this.uniforms.length=0;for(let Q=0,$=J.length;Q<$;Q++){let K=Array.isArray(J[Q])?J[Q]:[J[Q]];for(let W=0;W<K.length;W++)this.uniforms.push(K[W].clone())}return this}clone(){return new this.constructor().copy(this)}}class Z$ extends P1{constructor(z,J,Q=1){super(z,J);this.isInstancedInterleavedBuffer=!0,this.meshPerAttribute=Q}copy(z){return super.copy(z),this.meshPerAttribute=z.meshPerAttribute,this}clone(z){let J=super.clone(z);return J.meshPerAttribute=this.meshPerAttribute,J}toJSON(z){let J=super.toJSON(z);return J.isInstancedInterleavedBuffer=!0,J.meshPerAttribute=this.meshPerAttribute,J}}class H${constructor(z,J,Q,$,K,W=!1){this.isGLBufferAttribute=!0,this.name="",this.buffer=z,this.type=J,this.itemSize=Q,this.elementSize=$,this.count=K,this.normalized=W,this.version=0}set needsUpdate(z){if(z===!0)this.version++}setBuffer(z){return this.buffer=z,this}setType(z,J){return this.type=z,this.elementSize=J,this}setItemSize(z){return this.itemSize=z,this}setCount(z){return this.count=z,this}}var h8=new pz;class U${constructor(z,J,Q=0,$=1/0){this.ray=new Y0(z,J),this.near=Q,this.far=$,this.camera=null,this.layers=new R1,this.params={Mesh:{},Line:{threshold:1},LOD:{},Points:{threshold:1},Sprite:{}}}set(z,J){this.ray.set(z,J)}setFromCamera(z,J){if(J.isPerspectiveCamera)this.ray.origin.setFromMatrixPosition(J.matrixWorld),this.ray.direction.set(z.x,z.y,0.5).unproject(J).sub(this.ray.origin).normalize(),this.camera=J;else if(J.isOrthographicCamera)this.ray.origin.set(z.x,z.y,J.projectionMatrix.elements[14]).unproject(J),this.ray.direction.set(0,0,-1).transformDirection(J.matrixWorld),this.camera=J;else Pz("Raycaster: Unsupported camera type: "+J.type)}setFromXRController(z){return h8.identity().extractRotation(z.matrixWorld),this.ray.origin.setFromMatrixPosition(z.matrixWorld),this.ray.direction.set(0,0,-1).applyMatrix4(h8),this}intersectObject(z,J=!0,Q=[]){return M6(z,this,Q,J),Q.sort(x8),Q}intersectObjects(z,J=!0,Q=[]){for(let $=0,K=z.length;$<K;$++)M6(z[$],this,Q,J);return Q.sort(x8),Q}}function x8(z,J){return z.distance-J.distance}function M6(z,J,Q,$){let K=!0;if(z.layers.test(J.layers)){if(z.raycast(J,Q)===!1)K=!1}if(K===!0&&$===!0){let W=z.children;for(let q=0,B=W.length;q<B;q++)M6(W[q],J,Q,!0)}}class V${constructor(z=!0){this.autoStart=z,this.startTime=0,this.oldTime=0,this.elapsedTime=0,this.running=!1,Bz("Clock: This module has been deprecated. Please use THREE.Timer instead.")}start(){this.startTime=performance.now(),this.oldTime=this.startTime,this.elapsedTime=0,this.running=!0}stop(){this.getElapsedTime(),this.running=!1,this.autoStart=!1}getElapsedTime(){return this.getDelta(),this.elapsedTime}getDelta(){let z=0;if(this.autoStart&&!this.running)return this.start(),0;if(this.running){let J=performance.now();z=(J-this.oldTime)/1000,this.oldTime=J,this.elapsedTime+=z}return z}}class Y${constructor(z=1,J=0,Q=0){this.radius=z,this.phi=J,this.theta=Q}set(z,J,Q){return this.radius=z,this.phi=J,this.theta=Q,this}copy(z){return this.radius=z.radius,this.phi=z.phi,this.theta=z.theta,this}makeSafe(){return this.phi=dz(this.phi,0.000001,Math.PI-0.000001),this}setFromVector3(z){return this.setFromCartesianCoords(z.x,z.y,z.z)}setFromCartesianCoords(z,J,Q){if(this.radius=Math.sqrt(z*z+J*J+Q*Q),this.radius===0)this.theta=0,this.phi=0;else this.theta=Math.atan2(z,Q),this.phi=Math.acos(dz(J/this.radius,-1,1));return this}clone(){return new this.constructor().copy(this)}}class X${constructor(z=1,J=0,Q=0){this.radius=z,this.theta=J,this.y=Q}set(z,J,Q){return this.radius=z,this.theta=J,this.y=Q,this}copy(z){return this.radius=z.radius,this.theta=z.theta,this.y=z.y,this}setFromVector3(z){return this.setFromCartesianCoords(z.x,z.y,z.z)}setFromCartesianCoords(z,J,Q){return this.radius=Math.sqrt(z*z+Q*Q),this.theta=Math.atan2(z,Q),this.y=J,this}clone(){return new this.constructor().copy(this)}}class M7{static{M7.prototype.isMatrix2=!0}constructor(z,J,Q,$){if(this.elements=[1,0,0,1],z!==void 0)this.set(z,J,Q,$)}identity(){return this.set(1,0,0,1),this}fromArray(z,J=0){for(let Q=0;Q<4;Q++)this.elements[Q]=z[Q+J];return this}set(z,J,Q,$){let K=this.elements;return K[0]=z,K[2]=J,K[1]=Q,K[3]=$,this}}var j8=new a;class L7{constructor(z=new a(1/0,1/0),J=new a(-1/0,-1/0)){this.isBox2=!0,this.min=z,this.max=J}set(z,J){return this.min.copy(z),this.max.copy(J),this}setFromPoints(z){this.makeEmpty();for(let J=0,Q=z.length;J<Q;J++)this.expandByPoint(z[J]);return this}setFromCenterAndSize(z,J){let Q=j8.copy(J).multiplyScalar(0.5);return this.min.copy(z).sub(Q),this.max.copy(z).add(Q),this}clone(){return new this.constructor().copy(this)}copy(z){return this.min.copy(z.min),this.max.copy(z.max),this}makeEmpty(){return this.min.x=this.min.y=1/0,this.max.x=this.max.y=-1/0,this}isEmpty(){return this.max.x<this.min.x||this.max.y<this.min.y}getCenter(z){return this.isEmpty()?z.set(0,0):z.addVectors(this.min,this.max).multiplyScalar(0.5)}getSize(z){return this.isEmpty()?z.set(0,0):z.subVectors(this.max,this.min)}expandByPoint(z){return this.min.min(z),this.max.max(z),this}expandByVector(z){return this.min.sub(z),this.max.add(z),this}expandByScalar(z){return this.min.addScalar(-z),this.max.addScalar(z),this}containsPoint(z){return z.x>=this.min.x&&z.x<=this.max.x&&z.y>=this.min.y&&z.y<=this.max.y}containsBox(z){return this.min.x<=z.min.x&&z.max.x<=this.max.x&&this.min.y<=z.min.y&&z.max.y<=this.max.y}getParameter(z,J){return J.set((z.x-this.min.x)/(this.max.x-this.min.x),(z.y-this.min.y)/(this.max.y-this.min.y))}intersectsBox(z){return z.max.x>=this.min.x&&z.min.x<=this.max.x&&z.max.y>=this.min.y&&z.min.y<=this.max.y}clampPoint(z,J){return J.copy(z).clamp(this.min,this.max)}distanceToPoint(z){return this.clampPoint(z,j8).distanceTo(z)}intersect(z){if(this.min.max(z.min),this.max.min(z.max),this.isEmpty())this.makeEmpty();return this}union(z){return this.min.min(z.min),this.max.max(z.max),this}translate(z){return this.min.add(z),this.max.add(z),this}equals(z){return z.min.equals(this.min)&&z.max.equals(this.max)}}var _8=new R,y2=new R,b0=new R,d0=new R,D6=new R,J3=new R,Q3=new R;class k${constructor(z=new R,J=new R){this.start=z,this.end=J}set(z,J){return this.start.copy(z),this.end.copy(J),this}copy(z){return this.start.copy(z.start),this.end.copy(z.end),this}getCenter(z){return z.addVectors(this.start,this.end).multiplyScalar(0.5)}delta(z){return z.subVectors(this.end,this.start)}distanceSq(){return this.start.distanceToSquared(this.end)}distance(){return this.start.distanceTo(this.end)}at(z,J){return this.delta(J).multiplyScalar(z).add(this.start)}closestPointToPointParameter(z,J){_8.subVectors(z,this.start),y2.subVectors(this.end,this.start);let Q=y2.dot(y2);if(Q===0)return 0;let K=y2.dot(_8)/Q;if(J)K=dz(K,0,1);return K}closestPointToPoint(z,J,Q){let $=this.closestPointToPointParameter(z,J);return this.delta(Q).multiplyScalar($).add(this.start)}distanceSqToLine3(z,J=J3,Q=Q3){let K,W,q=this.start,B=z.start,G=this.end,N=z.end;b0.subVectors(G,q),d0.subVectors(N,B),D6.subVectors(q,B);let Z=b0.dot(b0),H=d0.dot(d0),D=d0.dot(D6);if(Z<=0.00000000000000010000000000000001&&H<=0.00000000000000010000000000000001)return J.copy(q),Q.copy(B),J.sub(Q),J.dot(J);if(Z<=0.00000000000000010000000000000001)K=0,W=D/H,W=dz(W,0,1);else{let U=b0.dot(D6);if(H<=0.00000000000000010000000000000001)W=0,K=dz(-U/Z,0,1);else{let X=b0.dot(d0),k=Z*H-X*X;if(k!==0)K=dz((X*D-U*H)/k,0,1);else K=0;if(W=(X*K+D)/H,W<0)W=0,K=dz(-U/Z,0,1);else if(W>1)W=1,K=dz((X-U)/Z,0,1)}}return J.copy(q).addScaledVector(b0,K),Q.copy(B).addScaledVector(d0,W),J.distanceToSquared(Q)}applyMatrix4(z){return this.start.applyMatrix4(z),this.end.applyMatrix4(z),this}equals(z){return z.start.equals(this.start)&&z.end.equals(this.end)}clone(){return new this.constructor().copy(this)}}var b8=new R;class E$ extends KJ{constructor(z,J){super();this.light=z,this.matrixAutoUpdate=!1,this.color=J,this.type="SpotLightHelper";let Q=new mz,$=[0,0,0,0,0,1,0,0,0,1,0,1,0,0,0,-1,0,1,0,0,0,0,1,1,0,0,0,0,-1,1];for(let W=0,q=1,B=32;W<B;W++,q++){let G=W/B*Math.PI*2,N=q/B*Math.PI*2;$.push(Math.cos(G),Math.sin(G),1,Math.cos(N),Math.sin(N),1)}Q.setAttribute("position",new Sz($,3));let K=new bJ({fog:!1,toneMapped:!1});this.cone=new DQ(Q,K),this.add(this.cone),this.update()}dispose(){this.cone.geometry.dispose(),this.cone.material.dispose()}update(){if(this.light.updateWorldMatrix(!0,!1),this.light.target.updateWorldMatrix(!0,!1),this.parent)this.parent.updateWorldMatrix(!0),this.matrix.copy(this.parent.matrixWorld).invert().multiply(this.light.matrixWorld);else this.matrix.copy(this.light.matrixWorld);this.matrixWorldNeedsUpdate=!0;let z=this.light.distance?this.light.distance:1000,J=z*Math.tan(this.light.angle);if(this.cone.scale.set(J,J,z),b8.setFromMatrixPosition(this.light.target.matrixWorld),this.cone.lookAt(b8),this.color!==void 0)this.cone.material.color.set(this.color);else this.cone.material.color.copy(this.light.color)}}var pQ=new R,S2=new pz,Z6=new pz;class I$ extends DQ{constructor(z){let J=A$(z),Q=new mz,$=[],K=[];for(let G=0;G<J.length;G++){let N=J[G];if(N.parent&&N.parent.isBone)$.push(0,0,0),$.push(0,0,0),K.push(0,0,0),K.push(0,0,0)}Q.setAttribute("position",new Sz($,3)),Q.setAttribute("color",new Sz(K,3));let W=new bJ({vertexColors:!0,depthTest:!1,depthWrite:!1,toneMapped:!1,transparent:!0});super(Q,W);this.isSkeletonHelper=!0,this.type="SkeletonHelper",this.root=z,this.bones=J,this.matrix=z.matrixWorld,this.matrixAutoUpdate=!1;let q=new Fz(255),B=new Fz(65280);this.setColors(q,B)}updateMatrixWorld(z){let J=this.bones,Q=this.geometry,$=Q.getAttribute("position");Z6.copy(this.root.matrixWorld).invert();for(let K=0,W=0;K<J.length;K++){let q=J[K];if(q.parent&&q.parent.isBone)S2.multiplyMatrices(Z6,q.matrixWorld),pQ.setFromMatrixPosition(S2),$.setXYZ(W,pQ.x,pQ.y,pQ.z),S2.multiplyMatrices(Z6,q.parent.matrixWorld),pQ.setFromMatrixPosition(S2),$.setXYZ(W+1,pQ.x,pQ.y,pQ.z),W+=2}Q.getAttribute("position").needsUpdate=!0,super.updateMatrixWorld(z)}setColors(z,J){let $=this.geometry.getAttribute("color");for(let K=0;K<$.count;K+=2)$.setXYZ(K,z.r,z.g,z.b),$.setXYZ(K+1,J.r,J.g,J.b);return $.needsUpdate=!0,this}dispose(){this.geometry.dispose(),this.material.dispose()}}function A$(z){let J=[];if(z.isBone===!0)J.push(z);for(let Q=0;Q<z.children.length;Q++)J.push(...A$(z.children[Q]));return J}class O$ extends LJ{constructor(z,J,Q){let $=new j1(J,4,2),K=new RQ({wireframe:!0,fog:!1,toneMapped:!1});super($,K);this.light=z,this.color=Q,this.type="PointLightHelper",this.matrix=this.light.matrixWorld,this.matrixAutoUpdate=!1,this.update()}dispose(){this.geometry.dispose(),this.material.dispose()}update(){if(this.matrixWorldNeedsUpdate=!0,this.light.updateWorldMatrix(!0,!1),this.color!==void 0)this.material.color.set(this.color);else this.material.color.copy(this.light.color)}}var $3=new R,d8=new Fz,p8=new Fz;class F$ extends KJ{constructor(z,J,Q){super();this.light=z,this.matrix=z.matrixWorld,this.matrixAutoUpdate=!1,this.color=Q,this.type="HemisphereLightHelper";let $=new x1(J);if($.rotateY(Math.PI*0.5),this.material=new RQ({wireframe:!0,fog:!1,toneMapped:!1}),this.color===void 0)this.material.vertexColors=!0;let K=$.getAttribute("position"),W=new Float32Array(K.count*3);$.setAttribute("color",new GJ(W,3)),this.add(new LJ($,this.material)),this.update()}dispose(){this.children[0].geometry.dispose(),this.children[0].material.dispose()}update(){let z=this.children[0];if(this.color!==void 0)this.material.color.set(this.color);else{let J=z.geometry.getAttribute("color");d8.copy(this.light.color),p8.copy(this.light.groundColor);for(let Q=0,$=J.count;Q<$;Q++){let K=Q<$/2?d8:p8;J.setXYZ(Q,K.r,K.g,K.b)}J.needsUpdate=!0}this.matrixWorldNeedsUpdate=!0,this.light.updateWorldMatrix(!0,!1),z.lookAt($3.setFromMatrixPosition(this.light.matrixWorld).negate())}}class M$ extends DQ{constructor(z=10,J=10,Q=4473924,$=8947848){Q=new Fz(Q),$=new Fz($);let K=J/2,W=z/J,q=z/2,B=[],G=[];for(let H=0,D=0,U=-q;H<=J;H++,U+=W){B.push(-q,0,U,q,0,U),B.push(U,0,-q,U,0,q);let X=H===K?Q:$;X.toArray(G,D),D+=3,X.toArray(G,D),D+=3,X.toArray(G,D),D+=3,X.toArray(G,D),D+=3}let N=new mz;N.setAttribute("position",new Sz(B,3)),N.setAttribute("color",new Sz(G,3));let Z=new bJ({vertexColors:!0,toneMapped:!1});super(N,Z);this.type="GridHelper"}dispose(){this.geometry.dispose(),this.material.dispose()}}class L$ extends DQ{constructor(z=10,J=16,Q=8,$=64,K=4473924,W=8947848){K=new Fz(K),W=new Fz(W);let q=[],B=[];if(J>1)for(let Z=0;Z<J;Z++){let H=Z/J*(Math.PI*2),D=Math.sin(H)*z,U=Math.cos(H)*z;q.push(0,0,0),q.push(D,0,U);let X=Z&1?K:W;B.push(X.r,X.g,X.b),B.push(X.r,X.g,X.b)}for(let Z=0;Z<Q;Z++){let H=Z&1?K:W,D=z-z/Q*Z;for(let U=0;U<$;U++){let X=U/$*(Math.PI*2),k=Math.sin(X)*D,Y=Math.cos(X)*D;q.push(k,0,Y),B.push(H.r,H.g,H.b),X=(U+1)/$*(Math.PI*2),k=Math.sin(X)*D,Y=Math.cos(X)*D,q.push(k,0,Y),B.push(H.r,H.g,H.b)}}let G=new mz;G.setAttribute("position",new Sz(q,3)),G.setAttribute("color",new Sz(B,3));let N=new bJ({vertexColors:!0,toneMapped:!1});super(G,N);this.type="PolarGridHelper"}dispose(){this.geometry.dispose(),this.material.dispose()}}var u8=new R,w2=new R,g8=new R;class y$ extends KJ{constructor(z,J,Q){super();if(this.light=z,this.matrix=z.matrixWorld,this.matrixAutoUpdate=!1,this.color=Q,this.type="DirectionalLightHelper",J===void 0)J=1;let $=new mz;$.setAttribute("position",new Sz([-J,J,0,J,J,0,J,-J,0,-J,-J,0,-J,J,0],3));let K=new bJ({fog:!1,toneMapped:!1});this.lightPlane=new CQ($,K),this.add(this.lightPlane),$=new mz,$.setAttribute("position",new Sz([0,0,0,0,0,1],3)),this.targetLine=new CQ($,K),this.add(this.targetLine),this.update()}dispose(){this.lightPlane.geometry.dispose(),this.lightPlane.material.dispose(),this.targetLine.geometry.dispose(),this.targetLine.material.dispose()}update(){if(this.matrixWorldNeedsUpdate=!0,this.light.updateWorldMatrix(!0,!1),this.light.target.updateWorldMatrix(!0,!1),u8.setFromMatrixPosition(this.light.matrixWorld),w2.setFromMatrixPosition(this.light.target.matrixWorld),g8.subVectors(w2,u8),this.lightPlane.lookAt(w2),this.color!==void 0)this.lightPlane.material.color.set(this.color),this.targetLine.material.color.set(this.color);else this.lightPlane.material.color.copy(this.light.color),this.targetLine.material.color.copy(this.light.color);this.targetLine.lookAt(w2),this.targetLine.scale.z=g8.length()}}var C2=new R,AJ=new d1;class S$ extends DQ{constructor(z){let J=new mz,Q=new bJ({color:16777215,vertexColors:!0,toneMapped:!1}),$=[],K=[],W={};q("n1","n2"),q("n2","n4"),q("n4","n3"),q("n3","n1"),q("f1","f2"),q("f2","f4"),q("f4","f3"),q("f3","f1"),q("n1","f1"),q("n2","f2"),q("n3","f3"),q("n4","f4"),q("p","n1"),q("p","n2"),q("p","n3"),q("p","n4"),q("u1","u2"),q("u2","u3"),q("u3","u1"),q("c","t"),q("p","c"),q("cn1","cn2"),q("cn3","cn4"),q("cf1","cf2"),q("cf3","cf4");function q(U,X){B(U),B(X)}function B(U){if($.push(0,0,0),K.push(0,0,0),W[U]===void 0)W[U]=[];W[U].push($.length/3-1)}J.setAttribute("position",new Sz($,3)),J.setAttribute("color",new Sz(K,3));super(J,Q);if(this.type="CameraHelper",this.camera=z,this.camera.updateProjectionMatrix)this.camera.updateProjectionMatrix();this.matrix=z.matrixWorld,this.matrixAutoUpdate=!1,this.pointMap=W,this.update();let G=new Fz(16755200),N=new Fz(16711680),Z=new Fz(43775),H=new Fz(16777215),D=new Fz(3355443);this.setColors(G,N,Z,H,D)}setColors(z,J,Q,$,K){let q=this.geometry.getAttribute("color");return q.setXYZ(0,z.r,z.g,z.b),q.setXYZ(1,z.r,z.g,z.b),q.setXYZ(2,z.r,z.g,z.b),q.setXYZ(3,z.r,z.g,z.b),q.setXYZ(4,z.r,z.g,z.b),q.setXYZ(5,z.r,z.g,z.b),q.setXYZ(6,z.r,z.g,z.b),q.setXYZ(7,z.r,z.g,z.b),q.setXYZ(8,z.r,z.g,z.b),q.setXYZ(9,z.r,z.g,z.b),q.setXYZ(10,z.r,z.g,z.b),q.setXYZ(11,z.r,z.g,z.b),q.setXYZ(12,z.r,z.g,z.b),q.setXYZ(13,z.r,z.g,z.b),q.setXYZ(14,z.r,z.g,z.b),q.setXYZ(15,z.r,z.g,z.b),q.setXYZ(16,z.r,z.g,z.b),q.setXYZ(17,z.r,z.g,z.b),q.setXYZ(18,z.r,z.g,z.b),q.setXYZ(19,z.r,z.g,z.b),q.setXYZ(20,z.r,z.g,z.b),q.setXYZ(21,z.r,z.g,z.b),q.setXYZ(22,z.r,z.g,z.b),q.setXYZ(23,z.r,z.g,z.b),q.setXYZ(24,J.r,J.g,J.b),q.setXYZ(25,J.r,J.g,J.b),q.setXYZ(26,J.r,J.g,J.b),q.setXYZ(27,J.r,J.g,J.b),q.setXYZ(28,J.r,J.g,J.b),q.setXYZ(29,J.r,J.g,J.b),q.setXYZ(30,J.r,J.g,J.b),q.setXYZ(31,J.r,J.g,J.b),q.setXYZ(32,Q.r,Q.g,Q.b),q.setXYZ(33,Q.r,Q.g,Q.b),q.setXYZ(34,Q.r,Q.g,Q.b),q.setXYZ(35,Q.r,Q.g,Q.b),q.setXYZ(36,Q.r,Q.g,Q.b),q.setXYZ(37,Q.r,Q.g,Q.b),q.setXYZ(38,$.r,$.g,$.b),q.setXYZ(39,$.r,$.g,$.b),q.setXYZ(40,K.r,K.g,K.b),q.setXYZ(41,K.r,K.g,K.b),q.setXYZ(42,K.r,K.g,K.b),q.setXYZ(43,K.r,K.g,K.b),q.setXYZ(44,K.r,K.g,K.b),q.setXYZ(45,K.r,K.g,K.b),q.setXYZ(46,K.r,K.g,K.b),q.setXYZ(47,K.r,K.g,K.b),q.setXYZ(48,K.r,K.g,K.b),q.setXYZ(49,K.r,K.g,K.b),q.needsUpdate=!0,this}update(){let z=this.geometry,J=this.pointMap,Q=1,$=1,K,W;if(AJ.projectionMatrixInverse.copy(this.camera.projectionMatrixInverse),this.camera.reversedDepth===!0)K=1,W=0;else if(this.camera.coordinateSystem===2000)K=-1,W=1;else if(this.camera.coordinateSystem===2001)K=0,W=1;else throw Error("THREE.CameraHelper.update(): Invalid coordinate system: "+this.camera.coordinateSystem);MJ("c",J,z,AJ,0,0,K),MJ("t",J,z,AJ,0,0,W),MJ("n1",J,z,AJ,-1,-1,K),MJ("n2",J,z,AJ,1,-1,K),MJ("n3",J,z,AJ,-1,1,K),MJ("n4",J,z,AJ,1,1,K),MJ("f1",J,z,AJ,-1,-1,W),MJ("f2",J,z,AJ,1,-1,W),MJ("f3",J,z,AJ,-1,1,W),MJ("f4",J,z,AJ,1,1,W),MJ("u1",J,z,AJ,0.7,1.1,K),MJ("u2",J,z,AJ,-0.7,1.1,K),MJ("u3",J,z,AJ,0,2,K),MJ("cf1",J,z,AJ,-1,0,W),MJ("cf2",J,z,AJ,1,0,W),MJ("cf3",J,z,AJ,0,-1,W),MJ("cf4",J,z,AJ,0,1,W),MJ("cn1",J,z,AJ,-1,0,K),MJ("cn2",J,z,AJ,1,0,K),MJ("cn3",J,z,AJ,0,-1,K),MJ("cn4",J,z,AJ,0,1,K),z.getAttribute("position").needsUpdate=!0}dispose(){this.geometry.dispose(),this.material.dispose()}}function MJ(z,J,Q,$,K,W,q){C2.set(K,W,q).unproject($);let B=J[z];if(B!==void 0){let G=Q.getAttribute("position");for(let N=0,Z=B.length;N<Z;N++)G.setXYZ(B[N],C2.x,C2.y,C2.z)}}var R2=new fJ;class w$ extends DQ{constructor(z,J=16776960){let Q=new Uint16Array([0,1,1,2,2,3,3,0,4,5,5,6,6,7,7,4,0,4,1,5,2,6,3,7]),$=new Float32Array(24),K=new mz;K.setIndex(new GJ(Q,1)),K.setAttribute("position",new GJ($,3));super(K,new bJ({color:J,toneMapped:!1}));this.object=z,this.type="BoxHelper",this.matrixAutoUpdate=!1,this.update()}update(){if(this.object!==void 0)R2.setFromObject(this.object);if(R2.isEmpty())return;let{min:z,max:J}=R2,Q=this.geometry.attributes.position,$=Q.array;$[0]=J.x,$[1]=J.y,$[2]=J.z,$[3]=z.x,$[4]=J.y,$[5]=J.z,$[6]=z.x,$[7]=z.y,$[8]=J.z,$[9]=J.x,$[10]=z.y,$[11]=J.z,$[12]=J.x,$[13]=J.y,$[14]=z.z,$[15]=z.x,$[16]=J.y,$[17]=z.z,$[18]=z.x,$[19]=z.y,$[20]=z.z,$[21]=J.x,$[22]=z.y,$[23]=z.z,Q.needsUpdate=!0,this.geometry.computeBoundingSphere()}setFromObject(z){return this.object=z,this.update(),this}copy(z,J){return super.copy(z,J),this.object=z.object,this}dispose(){this.geometry.dispose(),this.material.dispose()}}class C$ extends DQ{constructor(z,J=16776960){let Q=new Uint16Array([0,1,1,2,2,3,3,0,4,5,5,6,6,7,7,4,0,4,1,5,2,6,3,7]),$=[1,1,1,-1,1,1,-1,-1,1,1,-1,1,1,1,-1,-1,1,-1,-1,-1,-1,1,-1,-1],K=new mz;K.setIndex(new GJ(Q,1)),K.setAttribute("position",new Sz($,3));super(K,new bJ({color:J,toneMapped:!1}));this.box=z,this.type="Box3Helper",this.geometry.computeBoundingSphere()}updateMatrixWorld(z){let J=this.box;if(J.isEmpty())return;J.getCenter(this.position),J.getSize(this.scale),this.scale.multiplyScalar(0.5),super.updateMatrixWorld(z)}dispose(){this.geometry.dispose(),this.material.dispose()}}class R$ extends CQ{constructor(z,J=1,Q=16776960){let $=Q,K=[1,-1,0,-1,1,0,-1,-1,0,1,1,0,-1,1,0,-1,-1,0,1,-1,0,1,1,0],W=new mz;W.setAttribute("position",new Sz(K,3)),W.computeBoundingSphere();super(W,new bJ({color:$,toneMapped:!1}));this.type="PlaneHelper",this.plane=z,this.size=J;let q=[1,1,0,-1,1,0,-1,-1,0,1,1,0,-1,-1,0,1,-1,0],B=new mz;B.setAttribute("position",new Sz(q,3)),B.computeBoundingSphere(),this.add(new LJ(B,new RQ({color:$,opacity:0.2,transparent:!0,depthWrite:!1,toneMapped:!1})))}updateMatrixWorld(z){this.position.set(0,0,0),this.scale.set(0.5*this.size,0.5*this.size,1),this.lookAt(this.plane.normal),this.translateZ(-this.plane.constant),super.updateMatrixWorld(z)}dispose(){this.geometry.dispose(),this.material.dispose(),this.children[0].geometry.dispose(),this.children[0].material.dispose()}}var l8=new R,P2,H6;class P$ extends KJ{constructor(z=new R(0,0,1),J=new R(0,0,0),Q=1,$=16776960,K=Q*0.2,W=K*0.2){super();if(this.type="ArrowHelper",P2===void 0)P2=new mz,P2.setAttribute("position",new Sz([0,0,0,0,1,0],3)),H6=new T1(0.5,1,5,1),H6.translate(0,-0.5,0);this.position.copy(J),this.line=new CQ(P2,new bJ({color:$,toneMapped:!1})),this.line.matrixAutoUpdate=!1,this.add(this.line),this.cone=new LJ(H6,new RQ({color:$,toneMapped:!1})),this.cone.matrixAutoUpdate=!1,this.add(this.cone),this.setDirection(z),this.setLength(Q,K,W)}setDirection(z){if(z.y>0.99999)this.quaternion.set(0,0,0,1);else if(z.y<-0.99999)this.quaternion.set(1,0,0,0);else{l8.set(z.z,0,-z.x).normalize();let J=Math.acos(z.y);this.quaternion.setFromAxisAngle(l8,J)}}setLength(z,J=z*0.2,Q=J*0.2){this.line.scale.set(1,Math.max(0.0001,z-J),1),this.line.updateMatrix(),this.cone.scale.set(Q,J,Q),this.cone.position.y=z,this.cone.updateMatrix()}setColor(z){this.line.material.color.set(z),this.cone.material.color.set(z)}copy(z){return super.copy(z,!1),this.line.copy(z.line),this.cone.copy(z.cone),this}dispose(){this.line.geometry.dispose(),this.line.material.dispose(),this.cone.geometry.dispose(),this.cone.material.dispose()}}class v$ extends DQ{constructor(z=1){let J=[0,0,0,z,0,0,0,0,0,0,z,0,0,0,0,0,0,z],Q=[1,0,0,1,0.6,0,0,1,0,0.6,1,0,0,0,1,0,0.6,1],$=new mz;$.setAttribute("position",new Sz(J,3)),$.setAttribute("color",new Sz(Q,3));let K=new bJ({vertexColors:!0,toneMapped:!1});super($,K);this.type="AxesHelper"}setColors(z,J,Q){let $=new Fz,K=this.geometry.attributes.color.array;return $.set(z),$.toArray(K,0),$.toArray(K,3),$.set(J),$.toArray(K,6),$.toArray(K,9),$.set(Q),$.toArray(K,12),$.toArray(K,15),this.geometry.attributes.color.needsUpdate=!0,this}dispose(){this.geometry.dispose(),this.material.dispose()}}class f${constructor(){this.type="ShapePath",this.color=new Fz,this.subPaths=[],this.currentPath=null,this.userData={}}moveTo(z,J){return this.currentPath=new m0,this.subPaths.push(this.currentPath),this.currentPath.moveTo(z,J),this}lineTo(z,J){return this.currentPath.lineTo(z,J),this}quadraticCurveTo(z,J,Q,$){return this.currentPath.quadraticCurveTo(z,J,Q,$),this}bezierCurveTo(z,J,Q,$,K,W){return this.currentPath.bezierCurveTo(z,J,Q,$,K,W),this}splineThru(z){return this.currentPath.splineThru(z),this}toShapes(){function z(B,G){let N=!1,Z=G.length;for(let H=0,D=Z-1;H<Z;D=H++){let U=G[H],X=G[D];if(U.y>B.y!==X.y>B.y&&B.x<(X.x-U.x)*(B.y-U.y)/(X.y-U.y)+U.x)N=!N}return N}function J(B,G){let N=G.getCenter(new a);if(z(N,B))return N;let Z=N.y,H=[],D=B.length;for(let U=0;U<D;U++){let X=B[U],k=B[(U+1)%D];if(X.y>Z!==k.y>Z){let Y=X.x+(Z-X.y)*(k.x-X.x)/(k.y-X.y);H.push(Y)}}if(H.length>1)H.sort((U,X)=>U-X),N.x=(H[0]+H[1])/2;return N}let Q=this.userData.style&&this.userData.style.fillRule||"nonzero";if(Q!=="nonzero"&&Q!=="evenodd")Bz('Fill-rule "'+Q+'" is not supported, falling back to "nonzero".'),Q="nonzero";let $=Q==="nonzero"?(B)=>B!==0:(B)=>(B&1)!==0,K=[];for(let B of this.subPaths){let G=B.getPoints();if(G.length<3)continue;let N=GQ.area(G);if(N===0)continue;let Z=new L7;for(let H=0;H<G.length;H++)Z.expandByPoint(G[H]);K.push({subPath:B,points:G,boundingBox:Z,interiorPoint:J(G,Z),absArea:Math.abs(N),winding:N<0?-1:1,container:null,exclude:!1,role:null})}K.sort((B,G)=>G.absArea-B.absArea);for(let B=0;B<K.length;B++){let G=K[B],N=0;for(let Z=B-1;Z>=0;Z--){let H=K[Z];if(!H.boundingBox.containsBox(G.boundingBox))continue;if(!z(G.interiorPoint,H.points))continue;G.container=H.exclude?H.container:H,N=H.winding,G.winding+=N;break}if($(G.winding)===$(N))G.exclude=!0}for(let B of K){if(B.exclude)continue;B.role=B.container===null||B.container.role==="hole"?"outer":"hole"}let W=[],q=new Map;for(let B of K){if(B.exclude||B.role!=="outer")continue;let G=new a0;G.curves=B.subPath.curves,W.push(G),q.set(B,G)}for(let B of K){if(B.exclude||B.role!=="hole")continue;let G=q.get(B.container);if(!G)continue;let N=new m0;N.curves=B.subPath.curves,G.holes.push(N)}return W}}class T$ extends QQ{constructor(z,J=null){super();this.object=z,this.domElement=J,this.enabled=!0,this.state=-1,this.keys={},this.mouseButtons={LEFT:null,MIDDLE:null,RIGHT:null},this.touches={ONE:null,TWO:null}}connect(z){if(z===void 0){Bz("Controls: connect() now requires an element.");return}if(this.domElement!==null)this.disconnect();this.domElement=z}disconnect(){}dispose(){}update(){}}function K3(z,J){let Q=z.image&&z.image.width?z.image.width/z.image.height:1;if(Q>J)z.repeat.x=1,z.repeat.y=Q/J,z.offset.x=0,z.offset.y=(1-z.repeat.y)/2;else z.repeat.x=J/Q,z.repeat.y=1,z.offset.x=(1-z.repeat.x)/2,z.offset.y=0;return z}function W3(z,J){let Q=z.image&&z.image.width?z.image.width/z.image.height:1;if(Q>J)z.repeat.x=J/Q,z.repeat.y=1,z.offset.x=(1-z.repeat.x)/2,z.offset.y=0;else z.repeat.x=1,z.repeat.y=Q/J,z.offset.x=0,z.offset.y=(1-z.repeat.y)/2;return z}function q3(z){return z.repeat.x=1,z.repeat.y=1,z.offset.x=0,z.offset.y=0,z}function L6(z,J,Q,$){let K=B3($);switch(Q){case 1021:return z*J;case 1028:return z*J/K.components*K.byteLength;case 1029:return z*J/K.components*K.byteLength;case 1030:return z*J*2/K.components*K.byteLength;case 1031:return z*J*2/K.components*K.byteLength;case 1022:return z*J*3/K.components*K.byteLength;case 1023:return z*J*4/K.components*K.byteLength;case 1033:return z*J*4/K.components*K.byteLength;case 33776:case 33777:return Math.floor((z+3)/4)*Math.floor((J+3)/4)*8;case 33778:case 33779:return Math.floor((z+3)/4)*Math.floor((J+3)/4)*16;case 35841:case 35843:return Math.max(z,16)*Math.max(J,8)/4;case 35840:case 35842:return Math.max(z,8)*Math.max(J,8)/2;case 36196:case 37492:case 37488:case 37489:return Math.floor((z+3)/4)*Math.floor((J+3)/4)*8;case 37496:case 37490:case 37491:return Math.floor((z+3)/4)*Math.floor((J+3)/4)*16;case 37808:return Math.floor((z+3)/4)*Math.floor((J+3)/4)*16;case 37809:return Math.floor((z+4)/5)*Math.floor((J+3)/4)*16;case 37810:return Math.floor((z+4)/5)*Math.floor((J+4)/5)*16;case 37811:return Math.floor((z+5)/6)*Math.floor((J+4)/5)*16;case 37812:return Math.floor((z+5)/6)*Math.floor((J+5)/6)*16;case 37813:return Math.floor((z+7)/8)*Math.floor((J+4)/5)*16;case 37814:return Math.floor((z+7)/8)*Math.floor((J+5)/6)*16;case 37815:return Math.floor((z+7)/8)*Math.floor((J+7)/8)*16;case 37816:return Math.floor((z+9)/10)*Math.floor((J+4)/5)*16;case 37817:return Math.floor((z+9)/10)*Math.floor((J+5)/6)*16;case 37818:return Math.floor((z+9)/10)*Math.floor((J+7)/8)*16;case 37819:return Math.floor((z+9)/10)*Math.floor((J+9)/10)*16;case 37820:return Math.floor((z+11)/12)*Math.floor((J+9)/10)*16;case 37821:return Math.floor((z+11)/12)*Math.floor((J+11)/12)*16;case 36492:case 36494:case 36495:return Math.ceil(z/4)*Math.ceil(J/4)*16;case 36283:case 36284:return Math.ceil(z/4)*Math.ceil(J/4)*8;case 36285:case 36286:return Math.ceil(z/4)*Math.ceil(J/4)*16}throw Error(`Unable to determine texture byte length for ${Q} format.`)}function B3(z){switch(z){case 1009:case 1010:return{byteLength:1,components:1};case 1012:case 1011:case 1016:return{byteLength:2,components:1};case 1017:case 1018:return{byteLength:2,components:4};case 1014:case 1013:case 1015:return{byteLength:4,components:1};case 35902:case 35899:return{byteLength:4,components:3}}throw Error(`THREE.TextureUtils: Unknown texture type ${z}.`)}class h${static contain(z,J){return K3(z,J)}static cover(z,J){return W3(z,J)}static fill(z){return q3(z)}static getByteLength(z,J,Q,$){return L6(z,J,Q,$)}}if(typeof __THREE_DEVTOOLS__<"u")__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("register",{detail:{revision:"185"}}));if(typeof window<"u")if(window.__THREE__)Bz("WARNING: Multiple instances of Three.js being imported.");else window.__THREE__="185";function x$(){let z=null,J=!1,Q=null,$=null;function K(W,q){Q(W,q),$=z.requestAnimationFrame(K)}return{start:function(){if(J===!0)return;if(Q===null)return;if(z===null)return;$=z.requestAnimationFrame(K),J=!0},stop:function(){if(z!==null)z.cancelAnimationFrame($);J=!1},setAnimationLoop:function(W){Q=W},setContext:function(W){z=W}}}function G3(z){let J=new WeakMap;function Q(B,G){let{array:N,usage:Z}=B,H=N.byteLength,D=z.createBuffer();z.bindBuffer(G,D),z.bufferData(G,N,Z),B.onUploadCallback();let U;if(N instanceof Float32Array)U=z.FLOAT;else if(typeof Float16Array<"u"&&N instanceof Float16Array)U=z.HALF_FLOAT;else if(N instanceof Uint16Array)if(B.isFloat16BufferAttribute)U=z.HALF_FLOAT;else U=z.UNSIGNED_SHORT;else if(N instanceof Int16Array)U=z.SHORT;else if(N instanceof Uint32Array)U=z.UNSIGNED_INT;else if(N instanceof Int32Array)U=z.INT;else if(N instanceof Int8Array)U=z.BYTE;else if(N instanceof Uint8Array)U=z.UNSIGNED_BYTE;else if(N instanceof Uint8ClampedArray)U=z.UNSIGNED_BYTE;else throw Error("THREE.WebGLAttributes: Unsupported buffer data format: "+N);return{buffer:D,type:U,bytesPerElement:N.BYTES_PER_ELEMENT,version:B.version,size:H}}function $(B,G,N){let{array:Z,updateRanges:H}=G;if(z.bindBuffer(N,B),H.length===0)z.bufferSubData(N,0,Z);else{H.sort((U,X)=>U.start-X.start);let D=0;for(let U=1;U<H.length;U++){let X=H[D],k=H[U];if(k.start<=X.start+X.count+1)X.count=Math.max(X.count,k.start+k.count-X.start);else++D,H[D]=k}H.length=D+1;for(let U=0,X=H.length;U<X;U++){let k=H[U];z.bufferSubData(N,k.start*Z.BYTES_PER_ELEMENT,Z,k.start,k.count)}G.clearUpdateRanges()}G.onUploadCallback()}function K(B){if(B.isInterleavedBufferAttribute)B=B.data;return J.get(B)}function W(B){if(B.isInterleavedBufferAttribute)B=B.data;let G=J.get(B);if(G)z.deleteBuffer(G.buffer),J.delete(B)}function q(B,G){if(B.isInterleavedBufferAttribute)B=B.data;if(B.isGLBufferAttribute){let Z=J.get(B);if(!Z||Z.version<B.version)J.set(B,{buffer:B.buffer,type:B.type,bytesPerElement:B.elementSize,version:B.version});return}let N=J.get(B);if(N===void 0)J.set(B,Q(B,G));else if(N.version<B.version){if(N.size!==B.array.byteLength)throw Error("THREE.WebGLAttributes: The size of the buffer attribute's array buffer does not match the original size. Resizing buffer attributes is not supported.");$(N.buffer,B,G),N.version=B.version}}return{get:K,remove:W,update:q}}var N3=`#ifdef USE_ALPHAHASH
	if ( diffuseColor.a < getAlphaHashThreshold( vPosition ) ) discard;
#endif`,D3=`#ifdef USE_ALPHAHASH
	const float ALPHA_HASH_SCALE = 0.05;
	float hash2D( vec2 value ) {
		return fract( 1.0e4 * sin( 17.0 * value.x + 0.1 * value.y ) * ( 0.1 + abs( sin( 13.0 * value.y + value.x ) ) ) );
	}
	float hash3D( vec3 value ) {
		return hash2D( vec2( hash2D( value.xy ), value.z ) );
	}
	float getAlphaHashThreshold( vec3 position ) {
		float maxDeriv = max(
			length( dFdx( position.xyz ) ),
			length( dFdy( position.xyz ) )
		);
		float pixScale = 1.0 / ( ALPHA_HASH_SCALE * maxDeriv );
		vec2 pixScales = vec2(
			exp2( floor( log2( pixScale ) ) ),
			exp2( ceil( log2( pixScale ) ) )
		);
		vec2 alpha = vec2(
			hash3D( floor( pixScales.x * position.xyz ) ),
			hash3D( floor( pixScales.y * position.xyz ) )
		);
		float lerpFactor = fract( log2( pixScale ) );
		float x = ( 1.0 - lerpFactor ) * alpha.x + lerpFactor * alpha.y;
		float a = min( lerpFactor, 1.0 - lerpFactor );
		vec3 cases = vec3(
			x * x / ( 2.0 * a * ( 1.0 - a ) ),
			( x - 0.5 * a ) / ( 1.0 - a ),
			1.0 - ( ( 1.0 - x ) * ( 1.0 - x ) / ( 2.0 * a * ( 1.0 - a ) ) )
		);
		float threshold = ( x < ( 1.0 - a ) )
			? ( ( x < a ) ? cases.x : cases.y )
			: cases.z;
		return clamp( threshold , 1.0e-6, 1.0 );
	}
#endif`,Z3=`#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, vAlphaMapUv ).g;
#endif`,H3=`#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,U3=`#ifdef USE_ALPHATEST
	#ifdef ALPHA_TO_COVERAGE
	diffuseColor.a = smoothstep( alphaTest, alphaTest + fwidth( diffuseColor.a ), diffuseColor.a );
	if ( diffuseColor.a == 0.0 ) discard;
	#else
	if ( diffuseColor.a < alphaTest ) discard;
	#endif
#endif`,V3=`#ifdef USE_ALPHATEST
	uniform float alphaTest;
#endif`,Y3=`#ifdef USE_AOMAP
	float ambientOcclusion = ( texture2D( aoMap, vAoMapUv ).r - 1.0 ) * aoMapIntensity + 1.0;
	reflectedLight.indirectDiffuse *= ambientOcclusion;
	#if defined( USE_CLEARCOAT ) 
		clearcoatSpecularIndirect *= ambientOcclusion;
	#endif
	#if defined( USE_SHEEN ) 
		sheenSpecularIndirect *= ambientOcclusion;
	#endif
	#if defined( USE_ENVMAP ) && defined( STANDARD )
		float dotNV = saturate( dot( geometryNormal, geometryViewDir ) );
		reflectedLight.indirectSpecular *= computeSpecularOcclusion( dotNV, ambientOcclusion, material.roughness );
	#endif
#endif`,X3=`#ifdef USE_AOMAP
	uniform sampler2D aoMap;
	uniform float aoMapIntensity;
#endif`,k3=`#ifdef USE_BATCHING
	#if ! defined( GL_ANGLE_multi_draw )
	#define gl_DrawID _gl_DrawID
	uniform int _gl_DrawID;
	#endif
	uniform highp sampler2D batchingTexture;
	uniform highp usampler2D batchingIdTexture;
	mat4 getBatchingMatrix( const in float i ) {
		int size = textureSize( batchingTexture, 0 ).x;
		int j = int( i ) * 4;
		int x = j % size;
		int y = j / size;
		vec4 v1 = texelFetch( batchingTexture, ivec2( x, y ), 0 );
		vec4 v2 = texelFetch( batchingTexture, ivec2( x + 1, y ), 0 );
		vec4 v3 = texelFetch( batchingTexture, ivec2( x + 2, y ), 0 );
		vec4 v4 = texelFetch( batchingTexture, ivec2( x + 3, y ), 0 );
		return mat4( v1, v2, v3, v4 );
	}
	float getIndirectIndex( const in int i ) {
		int size = textureSize( batchingIdTexture, 0 ).x;
		int x = i % size;
		int y = i / size;
		return float( texelFetch( batchingIdTexture, ivec2( x, y ), 0 ).r );
	}
#endif
#ifdef USE_BATCHING_COLOR
	uniform sampler2D batchingColorTexture;
	vec4 getBatchingColor( const in float i ) {
		int size = textureSize( batchingColorTexture, 0 ).x;
		int j = int( i );
		int x = j % size;
		int y = j / size;
		return texelFetch( batchingColorTexture, ivec2( x, y ), 0 );
	}
#endif`,E3=`#ifdef USE_BATCHING
	mat4 batchingMatrix = getBatchingMatrix( getIndirectIndex( gl_DrawID ) );
#endif`,I3=`vec3 transformed = vec3( position );
#ifdef USE_ALPHAHASH
	vPosition = vec3( position );
#endif`,A3=`vec3 objectNormal = vec3( normal );
#ifdef USE_TANGENT
	vec3 objectTangent = vec3( tangent.xyz );
#endif`,O3=`float G_BlinnPhong_Implicit( ) {
	return 0.25;
}
float D_BlinnPhong( const in float shininess, const in float dotNH ) {
	return RECIPROCAL_PI * ( shininess * 0.5 + 1.0 ) * pow( dotNH, shininess );
}
vec3 BRDF_BlinnPhong( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in vec3 specularColor, const in float shininess ) {
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNH = saturate( dot( normal, halfDir ) );
	float dotVH = saturate( dot( viewDir, halfDir ) );
	vec3 F = F_Schlick( specularColor, 1.0, dotVH );
	float G = G_BlinnPhong_Implicit( );
	float D = D_BlinnPhong( shininess, dotNH );
	return F * ( G * D );
} // validated`,F3=`#ifdef USE_IRIDESCENCE
	const mat3 XYZ_TO_REC709 = mat3(
		 3.2404542, -0.9692660,  0.0556434,
		-1.5371385,  1.8760108, -0.2040259,
		-0.4985314,  0.0415560,  1.0572252
	);
	vec3 Fresnel0ToIor( vec3 fresnel0 ) {
		vec3 sqrtF0 = sqrt( fresnel0 );
		return ( vec3( 1.0 ) + sqrtF0 ) / ( vec3( 1.0 ) - sqrtF0 );
	}
	vec3 IorToFresnel0( vec3 transmittedIor, float incidentIor ) {
		return pow2( ( transmittedIor - vec3( incidentIor ) ) / ( transmittedIor + vec3( incidentIor ) ) );
	}
	float IorToFresnel0( float transmittedIor, float incidentIor ) {
		return pow2( ( transmittedIor - incidentIor ) / ( transmittedIor + incidentIor ));
	}
	vec3 evalSensitivity( float OPD, vec3 shift ) {
		float phase = 2.0 * PI * OPD * 1.0e-9;
		vec3 val = vec3( 5.4856e-13, 4.4201e-13, 5.2481e-13 );
		vec3 pos = vec3( 1.6810e+06, 1.7953e+06, 2.2084e+06 );
		vec3 var = vec3( 4.3278e+09, 9.3046e+09, 6.6121e+09 );
		vec3 xyz = val * sqrt( 2.0 * PI * var ) * cos( pos * phase + shift ) * exp( - pow2( phase ) * var );
		xyz.x += 9.7470e-14 * sqrt( 2.0 * PI * 4.5282e+09 ) * cos( 2.2399e+06 * phase + shift[ 0 ] ) * exp( - 4.5282e+09 * pow2( phase ) );
		xyz /= 1.0685e-7;
		vec3 rgb = XYZ_TO_REC709 * xyz;
		return rgb;
	}
	vec3 evalIridescence( float outsideIOR, float eta2, float cosTheta1, float thinFilmThickness, vec3 baseF0 ) {
		vec3 I;
		float iridescenceIOR = mix( outsideIOR, eta2, smoothstep( 0.0, 0.03, thinFilmThickness ) );
		float sinTheta2Sq = pow2( outsideIOR / iridescenceIOR ) * ( 1.0 - pow2( cosTheta1 ) );
		float cosTheta2Sq = 1.0 - sinTheta2Sq;
		if ( cosTheta2Sq < 0.0 ) {
			return vec3( 1.0 );
		}
		float cosTheta2 = sqrt( cosTheta2Sq );
		float R0 = IorToFresnel0( iridescenceIOR, outsideIOR );
		float R12 = F_Schlick( R0, 1.0, cosTheta1 );
		float T121 = 1.0 - R12;
		float phi12 = 0.0;
		if ( iridescenceIOR < outsideIOR ) phi12 = PI;
		float phi21 = PI - phi12;
		vec3 baseIOR = Fresnel0ToIor( clamp( baseF0, 0.0, 0.9999 ) );		vec3 R1 = IorToFresnel0( baseIOR, iridescenceIOR );
		vec3 R23 = F_Schlick( R1, 1.0, cosTheta2 );
		vec3 phi23 = vec3( 0.0 );
		if ( baseIOR[ 0 ] < iridescenceIOR ) phi23[ 0 ] = PI;
		if ( baseIOR[ 1 ] < iridescenceIOR ) phi23[ 1 ] = PI;
		if ( baseIOR[ 2 ] < iridescenceIOR ) phi23[ 2 ] = PI;
		float OPD = 2.0 * iridescenceIOR * thinFilmThickness * cosTheta2;
		vec3 phi = vec3( phi21 ) + phi23;
		vec3 R123 = clamp( R12 * R23, 1e-5, 0.9999 );
		vec3 r123 = sqrt( R123 );
		vec3 Rs = pow2( T121 ) * R23 / ( vec3( 1.0 ) - R123 );
		vec3 C0 = R12 + Rs;
		I = C0;
		vec3 Cm = Rs - T121;
		for ( int m = 1; m <= 2; ++ m ) {
			Cm *= r123;
			vec3 Sm = 2.0 * evalSensitivity( float( m ) * OPD, float( m ) * phi );
			I += Cm * Sm;
		}
		return max( I, vec3( 0.0 ) );
	}
#endif`,M3=`#ifdef USE_BUMPMAP
	uniform sampler2D bumpMap;
	uniform float bumpScale;
	vec2 dHdxy_fwd() {
		vec2 dSTdx = dFdx( vBumpMapUv );
		vec2 dSTdy = dFdy( vBumpMapUv );
		float Hll = bumpScale * texture2D( bumpMap, vBumpMapUv ).x;
		float dBx = bumpScale * texture2D( bumpMap, vBumpMapUv + dSTdx ).x - Hll;
		float dBy = bumpScale * texture2D( bumpMap, vBumpMapUv + dSTdy ).x - Hll;
		return vec2( dBx, dBy );
	}
	vec3 perturbNormalArb( vec3 surf_pos, vec3 surf_norm, vec2 dHdxy, float faceDirection ) {
		vec3 vSigmaX = normalize( dFdx( surf_pos.xyz ) );
		vec3 vSigmaY = normalize( dFdy( surf_pos.xyz ) );
		vec3 vN = surf_norm;
		vec3 R1 = cross( vSigmaY, vN );
		vec3 R2 = cross( vN, vSigmaX );
		float fDet = dot( vSigmaX, R1 ) * faceDirection;
		vec3 vGrad = sign( fDet ) * ( dHdxy.x * R1 + dHdxy.y * R2 );
		return normalize( abs( fDet ) * surf_norm - vGrad );
	}
#endif`,L3=`#if NUM_CLIPPING_PLANES > 0
	vec4 plane;
	#ifdef ALPHA_TO_COVERAGE
		float distanceToPlane, distanceGradient;
		float clipOpacity = 1.0;
		#pragma unroll_loop_start
		for ( int i = 0; i < UNION_CLIPPING_PLANES; i ++ ) {
			plane = clippingPlanes[ i ];
			distanceToPlane = - dot( vClipPosition, plane.xyz ) + plane.w;
			distanceGradient = fwidth( distanceToPlane ) / 2.0;
			clipOpacity *= smoothstep( - distanceGradient, distanceGradient, distanceToPlane );
			if ( clipOpacity == 0.0 ) discard;
		}
		#pragma unroll_loop_end
		#if UNION_CLIPPING_PLANES < NUM_CLIPPING_PLANES
			float unionClipOpacity = 1.0;
			#pragma unroll_loop_start
			for ( int i = UNION_CLIPPING_PLANES; i < NUM_CLIPPING_PLANES; i ++ ) {
				plane = clippingPlanes[ i ];
				distanceToPlane = - dot( vClipPosition, plane.xyz ) + plane.w;
				distanceGradient = fwidth( distanceToPlane ) / 2.0;
				unionClipOpacity *= 1.0 - smoothstep( - distanceGradient, distanceGradient, distanceToPlane );
			}
			#pragma unroll_loop_end
			clipOpacity *= 1.0 - unionClipOpacity;
		#endif
		diffuseColor.a *= clipOpacity;
		if ( diffuseColor.a == 0.0 ) discard;
	#else
		#pragma unroll_loop_start
		for ( int i = 0; i < UNION_CLIPPING_PLANES; i ++ ) {
			plane = clippingPlanes[ i ];
			if ( dot( vClipPosition, plane.xyz ) > plane.w ) discard;
		}
		#pragma unroll_loop_end
		#if UNION_CLIPPING_PLANES < NUM_CLIPPING_PLANES
			bool clipped = true;
			#pragma unroll_loop_start
			for ( int i = UNION_CLIPPING_PLANES; i < NUM_CLIPPING_PLANES; i ++ ) {
				plane = clippingPlanes[ i ];
				clipped = ( dot( vClipPosition, plane.xyz ) > plane.w ) && clipped;
			}
			#pragma unroll_loop_end
			if ( clipped ) discard;
		#endif
	#endif
#endif`,y3=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
	uniform vec4 clippingPlanes[ NUM_CLIPPING_PLANES ];
#endif`,S3=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
#endif`,w3=`#if NUM_CLIPPING_PLANES > 0
	vClipPosition = - mvPosition.xyz;
#endif`,C3=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA )
	diffuseColor *= vColor;
#endif`,R3=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#endif`,P3=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	varying vec4 vColor;
#endif`,v3=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	vColor = vec4( 1.0 );
#endif
#ifdef USE_COLOR_ALPHA
	vColor *= color;
#elif defined( USE_COLOR )
	vColor.rgb *= color;
#endif
#ifdef USE_INSTANCING_COLOR
	vColor.rgb *= instanceColor.rgb;
#endif
#ifdef USE_BATCHING_COLOR
	vColor *= getBatchingColor( getIndirectIndex( gl_DrawID ) );
#endif`,f3=`#define PI 3.141592653589793
#define PI2 6.283185307179586
#define PI_HALF 1.5707963267948966
#define RECIPROCAL_PI 0.3183098861837907
#define RECIPROCAL_PI2 0.15915494309189535
#define EPSILON 1e-6
#ifndef saturate
#define saturate( a ) clamp( a, 0.0, 1.0 )
#endif
#define whiteComplement( a ) ( 1.0 - saturate( a ) )
float pow2( const in float x ) { return x*x; }
vec3 pow2( const in vec3 x ) { return x*x; }
float pow3( const in float x ) { return x*x*x; }
float pow4( const in float x ) { float x2 = x*x; return x2*x2; }
float max3( const in vec3 v ) { return max( max( v.x, v.y ), v.z ); }
float average( const in vec3 v ) { return dot( v, vec3( 0.3333333 ) ); }
highp float rand( const in vec2 uv ) {
	const highp float a = 12.9898, b = 78.233, c = 43758.5453;
	highp float dt = dot( uv.xy, vec2( a,b ) ), sn = mod( dt, PI );
	return fract( sin( sn ) * c );
}
#ifdef HIGH_PRECISION
	float precisionSafeLength( vec3 v ) { return length( v ); }
#else
	float precisionSafeLength( vec3 v ) {
		float maxComponent = max3( abs( v ) );
		return length( v / maxComponent ) * maxComponent;
	}
#endif
struct IncidentLight {
	vec3 color;
	vec3 direction;
	bool visible;
};
struct ReflectedLight {
	vec3 directDiffuse;
	vec3 directSpecular;
	vec3 indirectDiffuse;
	vec3 indirectSpecular;
};
#ifdef USE_ALPHAHASH
	varying vec3 vPosition;
#endif
vec3 transformDirection( in vec3 dir, in mat4 matrix ) {
	return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );
}
#define inverseTransformDirection transformDirectionByInverseViewMatrix
vec3 transformNormalByInverseViewMatrix( in vec3 normal, in mat4 viewMatrix ) {
	return normalize( ( vec4( normal, 0.0 ) * viewMatrix ).xyz );
}
vec3 transformDirectionByInverseViewMatrix( in vec3 dir, in mat4 viewMatrix ) {
	return normalize( ( vec4( dir, 0.0 ) * viewMatrix ).xyz );
}
bool isPerspectiveMatrix( mat4 m ) {
	return m[ 2 ][ 3 ] == - 1.0;
}
vec2 equirectUv( in vec3 dir ) {
	float u = atan( dir.z, dir.x ) * RECIPROCAL_PI2 + 0.5;
	float v = asin( clamp( dir.y, - 1.0, 1.0 ) ) * RECIPROCAL_PI + 0.5;
	return vec2( u, v );
}
vec3 BRDF_Lambert( const in vec3 diffuseColor ) {
	return RECIPROCAL_PI * diffuseColor;
}
vec3 F_Schlick( const in vec3 f0, const in float f90, const in float dotVH ) {
	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );
	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );
}
float F_Schlick( const in float f0, const in float f90, const in float dotVH ) {
	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );
	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );
} // validated`,T3=`#ifdef ENVMAP_TYPE_CUBE_UV
	#define cubeUV_minMipLevel 4.0
	#define cubeUV_minTileSize 16.0
	float getFace( vec3 direction ) {
		vec3 absDirection = abs( direction );
		float face = - 1.0;
		if ( absDirection.x > absDirection.z ) {
			if ( absDirection.x > absDirection.y )
				face = direction.x > 0.0 ? 0.0 : 3.0;
			else
				face = direction.y > 0.0 ? 1.0 : 4.0;
		} else {
			if ( absDirection.z > absDirection.y )
				face = direction.z > 0.0 ? 2.0 : 5.0;
			else
				face = direction.y > 0.0 ? 1.0 : 4.0;
		}
		return face;
	}
	vec2 getUV( vec3 direction, float face ) {
		vec2 uv;
		if ( face == 0.0 ) {
			uv = vec2( direction.z, direction.y ) / abs( direction.x );
		} else if ( face == 1.0 ) {
			uv = vec2( - direction.x, - direction.z ) / abs( direction.y );
		} else if ( face == 2.0 ) {
			uv = vec2( - direction.x, direction.y ) / abs( direction.z );
		} else if ( face == 3.0 ) {
			uv = vec2( - direction.z, direction.y ) / abs( direction.x );
		} else if ( face == 4.0 ) {
			uv = vec2( - direction.x, direction.z ) / abs( direction.y );
		} else {
			uv = vec2( direction.x, direction.y ) / abs( direction.z );
		}
		return 0.5 * ( uv + 1.0 );
	}
	vec3 bilinearCubeUV( sampler2D envMap, vec3 direction, float mipInt ) {
		float face = getFace( direction );
		float filterInt = max( cubeUV_minMipLevel - mipInt, 0.0 );
		mipInt = max( mipInt, cubeUV_minMipLevel );
		float faceSize = exp2( mipInt );
		highp vec2 uv = getUV( direction, face ) * ( faceSize - 2.0 ) + 1.0;
		if ( face > 2.0 ) {
			uv.y += faceSize;
			face -= 3.0;
		}
		uv.x += face * faceSize;
		uv.x += filterInt * 3.0 * cubeUV_minTileSize;
		uv.y += 4.0 * ( exp2( CUBEUV_MAX_MIP ) - faceSize );
		uv.x *= CUBEUV_TEXEL_WIDTH;
		uv.y *= CUBEUV_TEXEL_HEIGHT;
		#ifdef texture2DGradEXT
			return texture2DGradEXT( envMap, uv, vec2( 0.0 ), vec2( 0.0 ) ).rgb;
		#else
			return texture2D( envMap, uv ).rgb;
		#endif
	}
	#define cubeUV_r0 1.0
	#define cubeUV_m0 - 2.0
	#define cubeUV_r1 0.8
	#define cubeUV_m1 - 1.0
	#define cubeUV_r4 0.4
	#define cubeUV_m4 2.0
	#define cubeUV_r5 0.305
	#define cubeUV_m5 3.0
	#define cubeUV_r6 0.21
	#define cubeUV_m6 4.0
	float roughnessToMip( float roughness ) {
		float mip = 0.0;
		if ( roughness >= cubeUV_r1 ) {
			mip = ( cubeUV_r0 - roughness ) * ( cubeUV_m1 - cubeUV_m0 ) / ( cubeUV_r0 - cubeUV_r1 ) + cubeUV_m0;
		} else if ( roughness >= cubeUV_r4 ) {
			mip = ( cubeUV_r1 - roughness ) * ( cubeUV_m4 - cubeUV_m1 ) / ( cubeUV_r1 - cubeUV_r4 ) + cubeUV_m1;
		} else if ( roughness >= cubeUV_r5 ) {
			mip = ( cubeUV_r4 - roughness ) * ( cubeUV_m5 - cubeUV_m4 ) / ( cubeUV_r4 - cubeUV_r5 ) + cubeUV_m4;
		} else if ( roughness >= cubeUV_r6 ) {
			mip = ( cubeUV_r5 - roughness ) * ( cubeUV_m6 - cubeUV_m5 ) / ( cubeUV_r5 - cubeUV_r6 ) + cubeUV_m5;
		} else {
			mip = - 2.0 * log2( 1.16 * roughness );		}
		return mip;
	}
	vec4 textureCubeUV( sampler2D envMap, vec3 sampleDir, float roughness ) {
		float mip = clamp( roughnessToMip( roughness ), cubeUV_m0, CUBEUV_MAX_MIP );
		float mipF = fract( mip );
		float mipInt = floor( mip );
		vec3 color0 = bilinearCubeUV( envMap, sampleDir, mipInt );
		if ( mipF == 0.0 ) {
			return vec4( color0, 1.0 );
		} else {
			vec3 color1 = bilinearCubeUV( envMap, sampleDir, mipInt + 1.0 );
			return vec4( mix( color0, color1, mipF ), 1.0 );
		}
	}
#endif`,h3=`vec3 transformedNormal = objectNormal;
#ifdef USE_TANGENT
	vec3 transformedTangent = objectTangent;
#endif
#ifdef USE_BATCHING
	mat3 bm = mat3( batchingMatrix );
	transformedNormal /= vec3( dot( bm[ 0 ], bm[ 0 ] ), dot( bm[ 1 ], bm[ 1 ] ), dot( bm[ 2 ], bm[ 2 ] ) );
	transformedNormal = bm * transformedNormal;
	#ifdef USE_TANGENT
		transformedTangent = bm * transformedTangent;
	#endif
#endif
#ifdef USE_INSTANCING
	mat3 im = mat3( instanceMatrix );
	transformedNormal /= vec3( dot( im[ 0 ], im[ 0 ] ), dot( im[ 1 ], im[ 1 ] ), dot( im[ 2 ], im[ 2 ] ) );
	transformedNormal = im * transformedNormal;
	#ifdef USE_TANGENT
		transformedTangent = im * transformedTangent;
	#endif
#endif
transformedNormal = normalMatrix * transformedNormal;
#ifdef FLIP_SIDED
	transformedNormal = - transformedNormal;
#endif
#ifdef USE_TANGENT
	transformedTangent = ( modelViewMatrix * vec4( transformedTangent, 0.0 ) ).xyz;
#endif`,x3=`#ifdef USE_DISPLACEMENTMAP
	uniform sampler2D displacementMap;
	uniform float displacementScale;
	uniform float displacementBias;
#endif`,j3=`#ifdef USE_DISPLACEMENTMAP
	transformed += normalize( objectNormal ) * ( texture2D( displacementMap, vDisplacementMapUv ).x * displacementScale + displacementBias );
#endif`,_3=`#ifdef USE_EMISSIVEMAP
	vec4 emissiveColor = texture2D( emissiveMap, vEmissiveMapUv );
	#ifdef DECODE_VIDEO_TEXTURE_EMISSIVE
		emissiveColor = sRGBTransferEOTF( emissiveColor );
	#endif
	totalEmissiveRadiance *= emissiveColor.rgb;
#endif`,b3=`#ifdef USE_EMISSIVEMAP
	uniform sampler2D emissiveMap;
#endif`,d3="gl_FragColor = linearToOutputTexel( gl_FragColor );",p3=`vec4 LinearTransferOETF( in vec4 value ) {
	return value;
}
vec4 sRGBTransferEOTF( in vec4 value ) {
	return vec4( mix( pow( value.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), value.rgb * 0.0773993808, vec3( lessThanEqual( value.rgb, vec3( 0.04045 ) ) ) ), value.a );
}
vec4 sRGBTransferOETF( in vec4 value ) {
	return vec4( mix( pow( value.rgb, vec3( 0.41666 ) ) * 1.055 - vec3( 0.055 ), value.rgb * 12.92, vec3( lessThanEqual( value.rgb, vec3( 0.0031308 ) ) ) ), value.a );
}`,u3=`#ifdef USE_ENVMAP
	#ifdef ENV_WORLDPOS
		vec3 cameraToFrag;
		if ( isOrthographic ) {
			cameraToFrag = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );
		} else {
			cameraToFrag = normalize( vWorldPosition - cameraPosition );
		}
		vec3 worldNormal = transformNormalByInverseViewMatrix( normal, viewMatrix );
		#ifdef ENVMAP_MODE_REFLECTION
			vec3 reflectVec = reflect( cameraToFrag, worldNormal );
		#else
			vec3 reflectVec = refract( cameraToFrag, worldNormal, refractionRatio );
		#endif
	#else
		vec3 reflectVec = vReflect;
	#endif
	#ifdef ENVMAP_TYPE_CUBE
		vec4 envColor = textureCube( envMap, envMapRotation * reflectVec );
		#ifdef ENVMAP_BLENDING_MULTIPLY
			outgoingLight = mix( outgoingLight, outgoingLight * envColor.xyz, specularStrength * reflectivity );
		#elif defined( ENVMAP_BLENDING_MIX )
			outgoingLight = mix( outgoingLight, envColor.xyz, specularStrength * reflectivity );
		#elif defined( ENVMAP_BLENDING_ADD )
			outgoingLight += envColor.xyz * specularStrength * reflectivity;
		#endif
	#endif
#endif`,g3=`#ifdef USE_ENVMAP
	uniform float envMapIntensity;
	uniform mat3 envMapRotation;
	#ifdef ENVMAP_TYPE_CUBE
		uniform samplerCube envMap;
	#else
		uniform sampler2D envMap;
	#endif
#endif`,l3=`#ifdef USE_ENVMAP
	uniform float reflectivity;
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		varying vec3 vWorldPosition;
		uniform float refractionRatio;
	#else
		varying vec3 vReflect;
	#endif
#endif`,m3=`#ifdef USE_ENVMAP
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		
		varying vec3 vWorldPosition;
	#else
		varying vec3 vReflect;
		uniform float refractionRatio;
	#endif
#endif`,c3=`#ifdef USE_ENVMAP
	#ifdef ENV_WORLDPOS
		vWorldPosition = worldPosition.xyz;
	#else
		vec3 cameraToVertex;
		if ( isOrthographic ) {
			cameraToVertex = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );
		} else {
			cameraToVertex = normalize( worldPosition.xyz - cameraPosition );
		}
		vec3 worldNormal = transformNormalByInverseViewMatrix( transformedNormal, viewMatrix );
		#ifdef ENVMAP_MODE_REFLECTION
			vReflect = reflect( cameraToVertex, worldNormal );
		#else
			vReflect = refract( cameraToVertex, worldNormal, refractionRatio );
		#endif
	#endif
#endif`,n3=`#ifdef USE_FOG
	vFogDepth = - mvPosition.z;
#endif`,o3=`#ifdef USE_FOG
	varying float vFogDepth;
#endif`,s3=`#ifdef USE_FOG
	#ifdef FOG_EXP2
		float fogFactor = 1.0 - exp( - fogDensity * fogDensity * vFogDepth * vFogDepth );
	#else
		float fogFactor = smoothstep( fogNear, fogFar, vFogDepth );
	#endif
	gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor );
#endif`,i3=`#ifdef USE_FOG
	uniform vec3 fogColor;
	varying float vFogDepth;
	#ifdef FOG_EXP2
		uniform float fogDensity;
	#else
		uniform float fogNear;
		uniform float fogFar;
	#endif
#endif`,a3=`#ifdef USE_GRADIENTMAP
	uniform sampler2D gradientMap;
#endif
vec3 getGradientIrradiance( vec3 normal, vec3 lightDirection ) {
	float dotNL = dot( normal, lightDirection );
	vec2 coord = vec2( dotNL * 0.5 + 0.5, 0.0 );
	#ifdef USE_GRADIENTMAP
		return vec3( texture2D( gradientMap, coord ).r );
	#else
		vec2 fw = fwidth( coord ) * 0.5;
		return mix( vec3( 0.7 ), vec3( 1.0 ), smoothstep( 0.7 - fw.x, 0.7 + fw.x, coord.x ) );
	#endif
}`,t3=`#ifdef USE_LIGHTMAP
	uniform sampler2D lightMap;
	uniform float lightMapIntensity;
#endif`,r3=`LambertMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularStrength = specularStrength;`,e3=`varying vec3 vViewPosition;
struct LambertMaterial {
	vec3 diffuseColor;
	float specularStrength;
};
void RE_Direct_Lambert( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Lambert( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_Lambert
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Lambert`,zq=`uniform bool receiveShadow;
uniform vec3 ambientLightColor;
#if defined( USE_LIGHT_PROBES )
	uniform vec3 lightProbe[ 9 ];
#endif
vec3 shGetIrradianceAt( in vec3 normal, in vec3 shCoefficients[ 9 ] ) {
	float x = normal.x, y = normal.y, z = normal.z;
	vec3 result = shCoefficients[ 0 ] * 0.886227;
	result += shCoefficients[ 1 ] * 2.0 * 0.511664 * y;
	result += shCoefficients[ 2 ] * 2.0 * 0.511664 * z;
	result += shCoefficients[ 3 ] * 2.0 * 0.511664 * x;
	result += shCoefficients[ 4 ] * 2.0 * 0.429043 * x * y;
	result += shCoefficients[ 5 ] * 2.0 * 0.429043 * y * z;
	result += shCoefficients[ 6 ] * ( 0.743125 * z * z - 0.247708 );
	result += shCoefficients[ 7 ] * 2.0 * 0.429043 * x * z;
	result += shCoefficients[ 8 ] * 0.429043 * ( x * x - y * y );
	return result;
}
vec3 getLightProbeIrradiance( const in vec3 lightProbe[ 9 ], const in vec3 normal ) {
	vec3 worldNormal = transformNormalByInverseViewMatrix( normal, viewMatrix );
	vec3 irradiance = shGetIrradianceAt( worldNormal, lightProbe );
	return irradiance;
}
vec3 getAmbientLightIrradiance( const in vec3 ambientLightColor ) {
	vec3 irradiance = ambientLightColor;
	return irradiance;
}
float getDistanceAttenuation( const in float lightDistance, const in float cutoffDistance, const in float decayExponent ) {
	float distanceFalloff = 1.0 / max( pow( lightDistance, decayExponent ), 0.01 );
	if ( cutoffDistance > 0.0 ) {
		distanceFalloff *= pow2( saturate( 1.0 - pow4( lightDistance / cutoffDistance ) ) );
	}
	return distanceFalloff;
}
float getSpotAttenuation( const in float coneCosine, const in float penumbraCosine, const in float angleCosine ) {
	return smoothstep( coneCosine, penumbraCosine, angleCosine );
}
#if NUM_DIR_LIGHTS > 0
	struct DirectionalLight {
		vec3 direction;
		vec3 color;
	};
	uniform DirectionalLight directionalLights[ NUM_DIR_LIGHTS ];
	void getDirectionalLightInfo( const in DirectionalLight directionalLight, out IncidentLight light ) {
		light.color = directionalLight.color;
		light.direction = directionalLight.direction;
		light.visible = true;
	}
#endif
#if NUM_POINT_LIGHTS > 0
	struct PointLight {
		vec3 position;
		vec3 color;
		float distance;
		float decay;
	};
	uniform PointLight pointLights[ NUM_POINT_LIGHTS ];
	void getPointLightInfo( const in PointLight pointLight, const in vec3 geometryPosition, out IncidentLight light ) {
		vec3 lVector = pointLight.position - geometryPosition;
		light.direction = normalize( lVector );
		float lightDistance = length( lVector );
		light.color = pointLight.color;
		light.color *= getDistanceAttenuation( lightDistance, pointLight.distance, pointLight.decay );
		light.visible = ( light.color != vec3( 0.0 ) );
	}
#endif
#if NUM_SPOT_LIGHTS > 0
	struct SpotLight {
		vec3 position;
		vec3 direction;
		vec3 color;
		float distance;
		float decay;
		float coneCos;
		float penumbraCos;
	};
	uniform SpotLight spotLights[ NUM_SPOT_LIGHTS ];
	void getSpotLightInfo( const in SpotLight spotLight, const in vec3 geometryPosition, out IncidentLight light ) {
		vec3 lVector = spotLight.position - geometryPosition;
		light.direction = normalize( lVector );
		float angleCos = dot( light.direction, spotLight.direction );
		float spotAttenuation = getSpotAttenuation( spotLight.coneCos, spotLight.penumbraCos, angleCos );
		if ( spotAttenuation > 0.0 ) {
			float lightDistance = length( lVector );
			light.color = spotLight.color * spotAttenuation;
			light.color *= getDistanceAttenuation( lightDistance, spotLight.distance, spotLight.decay );
			light.visible = ( light.color != vec3( 0.0 ) );
		} else {
			light.color = vec3( 0.0 );
			light.visible = false;
		}
	}
#endif
#if NUM_RECT_AREA_LIGHTS > 0
	struct RectAreaLight {
		vec3 color;
		vec3 position;
		vec3 halfWidth;
		vec3 halfHeight;
	};
	uniform sampler2D ltc_1;	uniform sampler2D ltc_2;
	uniform RectAreaLight rectAreaLights[ NUM_RECT_AREA_LIGHTS ];
#endif
#if NUM_HEMI_LIGHTS > 0
	struct HemisphereLight {
		vec3 direction;
		vec3 skyColor;
		vec3 groundColor;
	};
	uniform HemisphereLight hemisphereLights[ NUM_HEMI_LIGHTS ];
	vec3 getHemisphereLightIrradiance( const in HemisphereLight hemiLight, const in vec3 normal ) {
		float dotNL = dot( normal, hemiLight.direction );
		float hemiDiffuseWeight = 0.5 * dotNL + 0.5;
		vec3 irradiance = mix( hemiLight.groundColor, hemiLight.skyColor, hemiDiffuseWeight );
		return irradiance;
	}
#endif
#include <lightprobes_pars_fragment>`,Jq=`#ifdef USE_ENVMAP
	vec3 getIBLIrradiance( const in vec3 normal ) {
		#ifdef ENVMAP_TYPE_CUBE_UV
			vec3 worldNormal = transformNormalByInverseViewMatrix( normal, viewMatrix );
			vec4 envMapColor = textureCubeUV( envMap, envMapRotation * worldNormal, 1.0 );
			return PI * envMapColor.rgb * envMapIntensity;
		#else
			return vec3( 0.0 );
		#endif
	}
	vec3 getIBLRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness ) {
		#ifdef ENVMAP_TYPE_CUBE_UV
			vec3 reflectVec = reflect( - viewDir, normal );
			reflectVec = normalize( mix( reflectVec, normal, pow4( roughness ) ) );
			reflectVec = transformDirectionByInverseViewMatrix( reflectVec, viewMatrix );
			vec4 envMapColor = textureCubeUV( envMap, envMapRotation * reflectVec, roughness );
			return envMapColor.rgb * envMapIntensity;
		#else
			return vec3( 0.0 );
		#endif
	}
	#ifdef USE_ANISOTROPY
		vec3 getIBLAnisotropyRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness, const in vec3 bitangent, const in float anisotropy ) {
			#ifdef ENVMAP_TYPE_CUBE_UV
				vec3 bentNormal = cross( bitangent, viewDir );
				bentNormal = normalize( cross( bentNormal, bitangent ) );
				bentNormal = normalize( mix( bentNormal, normal, pow2( pow2( 1.0 - anisotropy * ( 1.0 - roughness ) ) ) ) );
				return getIBLRadiance( viewDir, bentNormal, roughness );
			#else
				return vec3( 0.0 );
			#endif
		}
	#endif
#endif`,Qq=`ToonMaterial material;
material.diffuseColor = diffuseColor.rgb;`,$q=`varying vec3 vViewPosition;
struct ToonMaterial {
	vec3 diffuseColor;
};
void RE_Direct_Toon( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {
	vec3 irradiance = getGradientIrradiance( geometryNormal, directLight.direction ) * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Toon( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_Toon
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Toon`,Kq=`BlinnPhongMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularColor = specular;
material.specularShininess = shininess;
material.specularStrength = specularStrength;`,Wq=`varying vec3 vViewPosition;
struct BlinnPhongMaterial {
	vec3 diffuseColor;
	vec3 specularColor;
	float specularShininess;
	float specularStrength;
};
void RE_Direct_BlinnPhong( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
	reflectedLight.directSpecular += irradiance * BRDF_BlinnPhong( directLight.direction, geometryViewDir, geometryNormal, material.specularColor, material.specularShininess ) * material.specularStrength;
}
void RE_IndirectDiffuse_BlinnPhong( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_BlinnPhong
#define RE_IndirectDiffuse		RE_IndirectDiffuse_BlinnPhong`,qq=`PhysicalMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.diffuseContribution = diffuseColor.rgb * ( 1.0 - metalnessFactor );
material.metalness = metalnessFactor;
vec3 dxy = max( abs( dFdx( nonPerturbedNormal ) ), abs( dFdy( nonPerturbedNormal ) ) );
float geometryRoughness = max( max( dxy.x, dxy.y ), dxy.z );
material.roughness = max( roughnessFactor, 0.0525 );material.roughness += geometryRoughness;
material.roughness = min( material.roughness, 1.0 );
#ifdef IOR
	material.ior = ior;
	#ifdef USE_SPECULAR
		float specularIntensityFactor = specularIntensity;
		vec3 specularColorFactor = specularColor;
		#ifdef USE_SPECULAR_COLORMAP
			specularColorFactor *= texture2D( specularColorMap, vSpecularColorMapUv ).rgb;
		#endif
		#ifdef USE_SPECULAR_INTENSITYMAP
			specularIntensityFactor *= texture2D( specularIntensityMap, vSpecularIntensityMapUv ).a;
		#endif
		material.specularF90 = mix( specularIntensityFactor, 1.0, metalnessFactor );
	#else
		float specularIntensityFactor = 1.0;
		vec3 specularColorFactor = vec3( 1.0 );
		material.specularF90 = 1.0;
	#endif
	material.specularColor = min( pow2( ( material.ior - 1.0 ) / ( material.ior + 1.0 ) ) * specularColorFactor, vec3( 1.0 ) ) * specularIntensityFactor;
	material.specularColorBlended = mix( material.specularColor, diffuseColor.rgb, metalnessFactor );
#else
	material.specularColor = vec3( 0.04 );
	material.specularColorBlended = mix( material.specularColor, diffuseColor.rgb, metalnessFactor );
	material.specularF90 = 1.0;
#endif
#ifdef USE_CLEARCOAT
	material.clearcoat = clearcoat;
	material.clearcoatRoughness = clearcoatRoughness;
	material.clearcoatF0 = vec3( 0.04 );
	material.clearcoatF90 = 1.0;
	#ifdef USE_CLEARCOATMAP
		material.clearcoat *= texture2D( clearcoatMap, vClearcoatMapUv ).x;
	#endif
	#ifdef USE_CLEARCOAT_ROUGHNESSMAP
		material.clearcoatRoughness *= texture2D( clearcoatRoughnessMap, vClearcoatRoughnessMapUv ).y;
	#endif
	material.clearcoat = saturate( material.clearcoat );	material.clearcoatRoughness = max( material.clearcoatRoughness, 0.0525 );
	material.clearcoatRoughness += geometryRoughness;
	material.clearcoatRoughness = min( material.clearcoatRoughness, 1.0 );
#endif
#ifdef USE_DISPERSION
	material.dispersion = dispersion;
#endif
#ifdef USE_IRIDESCENCE
	material.iridescence = iridescence;
	material.iridescenceIOR = iridescenceIOR;
	#ifdef USE_IRIDESCENCEMAP
		material.iridescence *= texture2D( iridescenceMap, vIridescenceMapUv ).r;
	#endif
	#ifdef USE_IRIDESCENCE_THICKNESSMAP
		material.iridescenceThickness = (iridescenceThicknessMaximum - iridescenceThicknessMinimum) * texture2D( iridescenceThicknessMap, vIridescenceThicknessMapUv ).g + iridescenceThicknessMinimum;
	#else
		material.iridescenceThickness = iridescenceThicknessMaximum;
	#endif
#endif
#ifdef USE_SHEEN
	material.sheenColor = sheenColor;
	#ifdef USE_SHEEN_COLORMAP
		material.sheenColor *= texture2D( sheenColorMap, vSheenColorMapUv ).rgb;
	#endif
	material.sheenRoughness = clamp( sheenRoughness, 0.0001, 1.0 );
	#ifdef USE_SHEEN_ROUGHNESSMAP
		material.sheenRoughness *= texture2D( sheenRoughnessMap, vSheenRoughnessMapUv ).a;
	#endif
#endif
#ifdef USE_ANISOTROPY
	#ifdef USE_ANISOTROPYMAP
		mat2 anisotropyMat = mat2( anisotropyVector.x, anisotropyVector.y, - anisotropyVector.y, anisotropyVector.x );
		vec3 anisotropyPolar = texture2D( anisotropyMap, vAnisotropyMapUv ).rgb;
		vec2 anisotropyV = anisotropyMat * normalize( 2.0 * anisotropyPolar.rg - vec2( 1.0 ) ) * anisotropyPolar.b;
	#else
		vec2 anisotropyV = anisotropyVector;
	#endif
	material.anisotropy = length( anisotropyV );
	if( material.anisotropy == 0.0 ) {
		anisotropyV = vec2( 1.0, 0.0 );
	} else {
		anisotropyV /= material.anisotropy;
		material.anisotropy = saturate( material.anisotropy );
	}
	material.alphaT = mix( pow2( material.roughness ), 1.0, pow2( material.anisotropy ) );
	material.anisotropyT = tbn[ 0 ] * anisotropyV.x + tbn[ 1 ] * anisotropyV.y;
	material.anisotropyB = tbn[ 1 ] * anisotropyV.x - tbn[ 0 ] * anisotropyV.y;
#endif`,Bq=`uniform sampler2D dfgLUT;
struct PhysicalMaterial {
	vec3 diffuseColor;
	vec3 diffuseContribution;
	vec3 specularColor;
	vec3 specularColorBlended;
	float roughness;
	float metalness;
	float specularF90;
	float dispersion;
	#ifdef USE_CLEARCOAT
		float clearcoat;
		float clearcoatRoughness;
		vec3 clearcoatF0;
		float clearcoatF90;
	#endif
	#ifdef USE_IRIDESCENCE
		float iridescence;
		float iridescenceIOR;
		float iridescenceThickness;
		vec3 iridescenceFresnel;
		vec3 iridescenceF0;
		vec3 iridescenceFresnelDielectric;
		vec3 iridescenceFresnelMetallic;
	#endif
	#ifdef USE_SHEEN
		vec3 sheenColor;
		float sheenRoughness;
	#endif
	#ifdef IOR
		float ior;
	#endif
	#ifdef USE_TRANSMISSION
		float transmission;
		float transmissionAlpha;
		float thickness;
		float attenuationDistance;
		vec3 attenuationColor;
	#endif
	#ifdef USE_ANISOTROPY
		float anisotropy;
		float alphaT;
		vec3 anisotropyT;
		vec3 anisotropyB;
	#endif
};
vec3 clearcoatSpecularDirect = vec3( 0.0 );
vec3 clearcoatSpecularIndirect = vec3( 0.0 );
vec3 sheenSpecularDirect = vec3( 0.0 );
vec3 sheenSpecularIndirect = vec3(0.0 );
vec3 Schlick_to_F0( const in vec3 f, const in float f90, const in float dotVH ) {
    float x = clamp( 1.0 - dotVH, 0.0, 1.0 );
    float x2 = x * x;
    float x5 = clamp( x * x2 * x2, 0.0, 0.9999 );
    return ( f - vec3( f90 ) * x5 ) / ( 1.0 - x5 );
}
float V_GGX_SmithCorrelated( const in float alpha, const in float dotNL, const in float dotNV ) {
	float a2 = pow2( alpha );
	float gv = dotNL * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNV ) );
	float gl = dotNV * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNL ) );
	return 0.5 / max( gv + gl, EPSILON );
}
float D_GGX( const in float alpha, const in float dotNH ) {
	float a2 = pow2( alpha );
	float denom = pow2( dotNH ) * ( a2 - 1.0 ) + 1.0;
	return RECIPROCAL_PI * a2 / pow2( denom );
}
#ifdef USE_ANISOTROPY
	float V_GGX_SmithCorrelated_Anisotropic( const in float alphaT, const in float alphaB, const in float dotTV, const in float dotBV, const in float dotTL, const in float dotBL, const in float dotNV, const in float dotNL ) {
		float gv = dotNL * length( vec3( alphaT * dotTV, alphaB * dotBV, dotNV ) );
		float gl = dotNV * length( vec3( alphaT * dotTL, alphaB * dotBL, dotNL ) );
		return 0.5 / max( gv + gl, EPSILON );
	}
	float D_GGX_Anisotropic( const in float alphaT, const in float alphaB, const in float dotNH, const in float dotTH, const in float dotBH ) {
		float a2 = alphaT * alphaB;
		highp vec3 v = vec3( alphaB * dotTH, alphaT * dotBH, a2 * dotNH );
		highp float v2 = dot( v, v );
		float w2 = a2 / v2;
		return RECIPROCAL_PI * a2 * pow2 ( w2 );
	}
#endif
#ifdef USE_CLEARCOAT
	vec3 BRDF_GGX_Clearcoat( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material) {
		vec3 f0 = material.clearcoatF0;
		float f90 = material.clearcoatF90;
		float roughness = material.clearcoatRoughness;
		float alpha = pow2( roughness );
		vec3 halfDir = normalize( lightDir + viewDir );
		float dotNL = saturate( dot( normal, lightDir ) );
		float dotNV = saturate( dot( normal, viewDir ) );
		float dotNH = saturate( dot( normal, halfDir ) );
		float dotVH = saturate( dot( viewDir, halfDir ) );
		vec3 F = F_Schlick( f0, f90, dotVH );
		float V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );
		float D = D_GGX( alpha, dotNH );
		return F * ( V * D );
	}
#endif
vec3 BRDF_GGX( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material ) {
	vec3 f0 = material.specularColorBlended;
	float f90 = material.specularF90;
	float roughness = material.roughness;
	float alpha = pow2( roughness );
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	float dotNH = saturate( dot( normal, halfDir ) );
	float dotVH = saturate( dot( viewDir, halfDir ) );
	vec3 F = F_Schlick( f0, f90, dotVH );
	#ifdef USE_IRIDESCENCE
		F = mix( F, material.iridescenceFresnel, material.iridescence );
	#endif
	#ifdef USE_ANISOTROPY
		float dotTL = dot( material.anisotropyT, lightDir );
		float dotTV = dot( material.anisotropyT, viewDir );
		float dotTH = dot( material.anisotropyT, halfDir );
		float dotBL = dot( material.anisotropyB, lightDir );
		float dotBV = dot( material.anisotropyB, viewDir );
		float dotBH = dot( material.anisotropyB, halfDir );
		float V = V_GGX_SmithCorrelated_Anisotropic( material.alphaT, alpha, dotTV, dotBV, dotTL, dotBL, dotNV, dotNL );
		float D = D_GGX_Anisotropic( material.alphaT, alpha, dotNH, dotTH, dotBH );
	#else
		float V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );
		float D = D_GGX( alpha, dotNH );
	#endif
	return F * ( V * D );
}
vec2 LTC_Uv( const in vec3 N, const in vec3 V, const in float roughness ) {
	const float LUT_SIZE = 64.0;
	const float LUT_SCALE = ( LUT_SIZE - 1.0 ) / LUT_SIZE;
	const float LUT_BIAS = 0.5 / LUT_SIZE;
	float dotNV = saturate( dot( N, V ) );
	vec2 uv = vec2( roughness, sqrt( 1.0 - dotNV ) );
	uv = uv * LUT_SCALE + LUT_BIAS;
	return uv;
}
float LTC_ClippedSphereFormFactor( const in vec3 f ) {
	float l = length( f );
	return max( ( l * l + f.z ) / ( l + 1.0 ), 0.0 );
}
vec3 LTC_EdgeVectorFormFactor( const in vec3 v1, const in vec3 v2 ) {
	float x = dot( v1, v2 );
	float y = abs( x );
	float a = 0.8543985 + ( 0.4965155 + 0.0145206 * y ) * y;
	float b = 3.4175940 + ( 4.1616724 + y ) * y;
	float v = a / b;
	float theta_sintheta = ( x > 0.0 ) ? v : 0.5 * inversesqrt( max( 1.0 - x * x, 1e-7 ) ) - v;
	return cross( v1, v2 ) * theta_sintheta;
}
vec3 LTC_Evaluate( const in vec3 N, const in vec3 V, const in vec3 P, const in mat3 mInv, const in vec3 rectCoords[ 4 ] ) {
	vec3 v1 = rectCoords[ 1 ] - rectCoords[ 0 ];
	vec3 v2 = rectCoords[ 3 ] - rectCoords[ 0 ];
	vec3 lightNormal = cross( v1, v2 );
	if( dot( lightNormal, P - rectCoords[ 0 ] ) < 0.0 ) return vec3( 0.0 );
	vec3 T1, T2;
	T1 = normalize( V - N * dot( V, N ) );
	T2 = - cross( N, T1 );
	mat3 mat = mInv * transpose( mat3( T1, T2, N ) );
	vec3 coords[ 4 ];
	coords[ 0 ] = mat * ( rectCoords[ 0 ] - P );
	coords[ 1 ] = mat * ( rectCoords[ 1 ] - P );
	coords[ 2 ] = mat * ( rectCoords[ 2 ] - P );
	coords[ 3 ] = mat * ( rectCoords[ 3 ] - P );
	coords[ 0 ] = normalize( coords[ 0 ] );
	coords[ 1 ] = normalize( coords[ 1 ] );
	coords[ 2 ] = normalize( coords[ 2 ] );
	coords[ 3 ] = normalize( coords[ 3 ] );
	vec3 vectorFormFactor = vec3( 0.0 );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 0 ], coords[ 1 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 1 ], coords[ 2 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 2 ], coords[ 3 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 3 ], coords[ 0 ] );
	float result = LTC_ClippedSphereFormFactor( vectorFormFactor );
	return vec3( result );
}
#if defined( USE_SHEEN )
float D_Charlie( float roughness, float dotNH ) {
	float alpha = pow2( roughness );
	float invAlpha = 1.0 / alpha;
	float cos2h = dotNH * dotNH;
	float sin2h = max( 1.0 - cos2h, 0.0078125 );
	return ( 2.0 + invAlpha ) * pow( sin2h, invAlpha * 0.5 ) / ( 2.0 * PI );
}
float V_Neubelt( float dotNV, float dotNL ) {
	return saturate( 1.0 / ( 4.0 * ( dotNL + dotNV - dotNL * dotNV ) ) );
}
vec3 BRDF_Sheen( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, vec3 sheenColor, const in float sheenRoughness ) {
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	float dotNH = saturate( dot( normal, halfDir ) );
	float D = D_Charlie( sheenRoughness, dotNH );
	float V = V_Neubelt( dotNV, dotNL );
	return sheenColor * ( D * V );
}
#endif
float IBLSheenBRDF( const in vec3 normal, const in vec3 viewDir, const in float roughness ) {
	float dotNV = saturate( dot( normal, viewDir ) );
	float r2 = roughness * roughness;
	float rInv = 1.0 / ( roughness + 0.1 );
	float a = -1.9362 + 1.0678 * roughness + 0.4573 * r2 - 0.8469 * rInv;
	float b = -0.6014 + 0.5538 * roughness - 0.4670 * r2 - 0.1255 * rInv;
	float DG = exp( a * dotNV + b );
	return saturate( DG );
}
vec3 EnvironmentBRDF( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float roughness ) {
	float dotNV = saturate( dot( normal, viewDir ) );
	vec2 fab = texture2D( dfgLUT, vec2( roughness, dotNV ) ).rg;
	return specularColor * fab.x + specularF90 * fab.y;
}
#ifdef USE_IRIDESCENCE
void computeMultiscatteringIridescence( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float iridescence, const in vec3 iridescenceF0, const in float roughness, inout vec3 singleScatter, inout vec3 multiScatter ) {
#else
void computeMultiscattering( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float roughness, inout vec3 singleScatter, inout vec3 multiScatter ) {
#endif
	float dotNV = saturate( dot( normal, viewDir ) );
	vec2 fab = texture2D( dfgLUT, vec2( roughness, dotNV ) ).rg;
	#ifdef USE_IRIDESCENCE
		vec3 Fr = mix( specularColor, iridescenceF0, iridescence );
	#else
		vec3 Fr = specularColor;
	#endif
	vec3 FssEss = Fr * fab.x + specularF90 * fab.y;
	float Ess = fab.x + fab.y;
	float Ems = 1.0 - Ess;
	vec3 Favg = Fr + ( 1.0 - Fr ) * 0.047619;	vec3 Fms = FssEss * Favg / ( 1.0 - Ems * Favg );
	singleScatter += FssEss;
	multiScatter += Fms * Ems;
}
vec3 BRDF_GGX_Multiscatter( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material ) {
	vec3 singleScatter = BRDF_GGX( lightDir, viewDir, normal, material );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	vec2 dfgV = texture2D( dfgLUT, vec2( material.roughness, dotNV ) ).rg;
	vec2 dfgL = texture2D( dfgLUT, vec2( material.roughness, dotNL ) ).rg;
	vec3 FssEss_V = material.specularColorBlended * dfgV.x + material.specularF90 * dfgV.y;
	vec3 FssEss_L = material.specularColorBlended * dfgL.x + material.specularF90 * dfgL.y;
	float Ess_V = dfgV.x + dfgV.y;
	float Ess_L = dfgL.x + dfgL.y;
	float Ems_V = 1.0 - Ess_V;
	float Ems_L = 1.0 - Ess_L;
	vec3 Favg = material.specularColorBlended + ( 1.0 - material.specularColorBlended ) * 0.047619;
	vec3 Fms = FssEss_V * FssEss_L * Favg / ( 1.0 - Ems_V * Ems_L * Favg + EPSILON );
	float compensationFactor = Ems_V * Ems_L;
	vec3 multiScatter = Fms * compensationFactor;
	return singleScatter + multiScatter;
}
#if NUM_RECT_AREA_LIGHTS > 0
	void RE_Direct_RectArea_Physical( const in RectAreaLight rectAreaLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
		vec3 normal = geometryNormal;
		vec3 viewDir = geometryViewDir;
		vec3 position = geometryPosition;
		vec3 lightPos = rectAreaLight.position;
		vec3 halfWidth = rectAreaLight.halfWidth;
		vec3 halfHeight = rectAreaLight.halfHeight;
		vec3 lightColor = rectAreaLight.color;
		float roughness = material.roughness;
		vec3 rectCoords[ 4 ];
		rectCoords[ 0 ] = lightPos + halfWidth - halfHeight;		rectCoords[ 1 ] = lightPos - halfWidth - halfHeight;
		rectCoords[ 2 ] = lightPos - halfWidth + halfHeight;
		rectCoords[ 3 ] = lightPos + halfWidth + halfHeight;
		vec2 uv = LTC_Uv( normal, viewDir, roughness );
		vec4 t1 = texture2D( ltc_1, uv );
		vec4 t2 = texture2D( ltc_2, uv );
		mat3 mInv = mat3(
			vec3( t1.x, 0, t1.y ),
			vec3(    0, 1,    0 ),
			vec3( t1.z, 0, t1.w )
		);
		vec3 fresnel = ( material.specularColorBlended * t2.x + ( material.specularF90 - material.specularColorBlended ) * t2.y );
		reflectedLight.directSpecular += lightColor * fresnel * LTC_Evaluate( normal, viewDir, position, mInv, rectCoords );
		reflectedLight.directDiffuse += lightColor * material.diffuseContribution * LTC_Evaluate( normal, viewDir, position, mat3( 1.0 ), rectCoords );
		#ifdef USE_CLEARCOAT
			vec3 Ncc = geometryClearcoatNormal;
			vec2 uvClearcoat = LTC_Uv( Ncc, viewDir, material.clearcoatRoughness );
			vec4 t1Clearcoat = texture2D( ltc_1, uvClearcoat );
			vec4 t2Clearcoat = texture2D( ltc_2, uvClearcoat );
			mat3 mInvClearcoat = mat3(
				vec3( t1Clearcoat.x, 0, t1Clearcoat.y ),
				vec3(             0, 1,             0 ),
				vec3( t1Clearcoat.z, 0, t1Clearcoat.w )
			);
			vec3 fresnelClearcoat = material.clearcoatF0 * t2Clearcoat.x + ( material.clearcoatF90 - material.clearcoatF0 ) * t2Clearcoat.y;
			clearcoatSpecularDirect += lightColor * fresnelClearcoat * LTC_Evaluate( Ncc, viewDir, position, mInvClearcoat, rectCoords );
		#endif
	}
#endif
void RE_Direct_Physical( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	#ifdef USE_CLEARCOAT
		float dotNLcc = saturate( dot( geometryClearcoatNormal, directLight.direction ) );
		vec3 ccIrradiance = dotNLcc * directLight.color;
		clearcoatSpecularDirect += ccIrradiance * BRDF_GGX_Clearcoat( directLight.direction, geometryViewDir, geometryClearcoatNormal, material );
	#endif
	#ifdef USE_SHEEN
 
 		sheenSpecularDirect += irradiance * BRDF_Sheen( directLight.direction, geometryViewDir, geometryNormal, material.sheenColor, material.sheenRoughness );
 
 		float sheenAlbedoV = IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );
 		float sheenAlbedoL = IBLSheenBRDF( geometryNormal, directLight.direction, material.sheenRoughness );
 
 		float sheenEnergyComp = 1.0 - max3( material.sheenColor ) * max( sheenAlbedoV, sheenAlbedoL );
 
 		irradiance *= sheenEnergyComp;
 
 	#endif
	reflectedLight.directSpecular += irradiance * BRDF_GGX_Multiscatter( directLight.direction, geometryViewDir, geometryNormal, material );
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseContribution );
}
void RE_IndirectDiffuse_Physical( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
	vec3 diffuse = irradiance * BRDF_Lambert( material.diffuseContribution );
	#ifdef USE_SHEEN
		float sheenAlbedo = IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );
		float sheenEnergyComp = 1.0 - max3( material.sheenColor ) * sheenAlbedo;
		diffuse *= sheenEnergyComp;
	#endif
	reflectedLight.indirectDiffuse += diffuse;
}
void RE_IndirectSpecular_Physical( const in vec3 radiance, const in vec3 irradiance, const in vec3 clearcoatRadiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight) {
	#ifdef USE_CLEARCOAT
		clearcoatSpecularIndirect += clearcoatRadiance * EnvironmentBRDF( geometryClearcoatNormal, geometryViewDir, material.clearcoatF0, material.clearcoatF90, material.clearcoatRoughness );
	#endif
	#ifdef USE_SHEEN
		sheenSpecularIndirect += irradiance * material.sheenColor * IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness ) * RECIPROCAL_PI;
 	#endif
	vec3 singleScatteringDielectric = vec3( 0.0 );
	vec3 multiScatteringDielectric = vec3( 0.0 );
	vec3 singleScatteringMetallic = vec3( 0.0 );
	vec3 multiScatteringMetallic = vec3( 0.0 );
	#ifdef USE_IRIDESCENCE
		computeMultiscatteringIridescence( geometryNormal, geometryViewDir, material.specularColor, material.specularF90, material.iridescence, material.iridescenceFresnelDielectric, material.roughness, singleScatteringDielectric, multiScatteringDielectric );
		computeMultiscatteringIridescence( geometryNormal, geometryViewDir, material.diffuseColor, material.specularF90, material.iridescence, material.iridescenceFresnelMetallic, material.roughness, singleScatteringMetallic, multiScatteringMetallic );
	#else
		computeMultiscattering( geometryNormal, geometryViewDir, material.specularColor, material.specularF90, material.roughness, singleScatteringDielectric, multiScatteringDielectric );
		computeMultiscattering( geometryNormal, geometryViewDir, material.diffuseColor, material.specularF90, material.roughness, singleScatteringMetallic, multiScatteringMetallic );
	#endif
	vec3 singleScattering = mix( singleScatteringDielectric, singleScatteringMetallic, material.metalness );
	vec3 multiScattering = mix( multiScatteringDielectric, multiScatteringMetallic, material.metalness );
	vec3 totalScatteringDielectric = singleScatteringDielectric + multiScatteringDielectric;
	vec3 diffuse = material.diffuseContribution * ( 1.0 - totalScatteringDielectric );
	vec3 cosineWeightedIrradiance = irradiance * RECIPROCAL_PI;
	vec3 indirectSpecular = radiance * singleScattering;
	indirectSpecular += multiScattering * cosineWeightedIrradiance;
	vec3 indirectDiffuse = diffuse * cosineWeightedIrradiance;
	#ifdef USE_SHEEN
		float sheenAlbedo = IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );
		float sheenEnergyComp = 1.0 - max3( material.sheenColor ) * sheenAlbedo;
		indirectSpecular *= sheenEnergyComp;
		indirectDiffuse *= sheenEnergyComp;
	#endif
	reflectedLight.indirectSpecular += indirectSpecular;
	reflectedLight.indirectDiffuse += indirectDiffuse;
}
#define RE_Direct				RE_Direct_Physical
#define RE_Direct_RectArea		RE_Direct_RectArea_Physical
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Physical
#define RE_IndirectSpecular		RE_IndirectSpecular_Physical
float computeSpecularOcclusion( const in float dotNV, const in float ambientOcclusion, const in float roughness ) {
	return saturate( pow( dotNV + ambientOcclusion, exp2( - 16.0 * roughness - 1.0 ) ) - 1.0 + ambientOcclusion );
}`,Gq=`
vec3 geometryPosition = - vViewPosition;
vec3 geometryNormal = normal;
vec3 geometryViewDir = ( isOrthographic ) ? vec3( 0, 0, 1 ) : normalize( vViewPosition );
vec3 geometryClearcoatNormal = vec3( 0.0 );
#ifdef USE_CLEARCOAT
	geometryClearcoatNormal = clearcoatNormal;
#endif
#ifdef USE_IRIDESCENCE
	float dotNVi = saturate( dot( normal, geometryViewDir ) );
	if ( material.iridescenceThickness == 0.0 ) {
		material.iridescence = 0.0;
	} else {
		material.iridescence = saturate( material.iridescence );
	}
	if ( material.iridescence > 0.0 ) {
		material.iridescenceFresnelDielectric = evalIridescence( 1.0, material.iridescenceIOR, dotNVi, material.iridescenceThickness, material.specularColor );
		material.iridescenceFresnelMetallic = evalIridescence( 1.0, material.iridescenceIOR, dotNVi, material.iridescenceThickness, material.diffuseColor );
		material.iridescenceFresnel = mix( material.iridescenceFresnelDielectric, material.iridescenceFresnelMetallic, material.metalness );
		material.iridescenceF0 = Schlick_to_F0( material.iridescenceFresnel, 1.0, dotNVi );
	}
#endif
IncidentLight directLight;
#if ( NUM_POINT_LIGHTS > 0 ) && defined( RE_Direct )
	PointLight pointLight;
	#if defined( USE_SHADOWMAP ) && NUM_POINT_LIGHT_SHADOWS > 0
	PointLightShadow pointLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_POINT_LIGHTS; i ++ ) {
		pointLight = pointLights[ i ];
		getPointLightInfo( pointLight, geometryPosition, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_POINT_LIGHT_SHADOWS ) && ( defined( SHADOWMAP_TYPE_PCF ) || defined( SHADOWMAP_TYPE_BASIC ) )
		pointLightShadow = pointLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getPointShadow( pointShadowMap[ i ], pointLightShadow.shadowMapSize, pointLightShadow.shadowIntensity, pointLightShadow.shadowBias, pointLightShadow.shadowRadius, vPointShadowCoord[ i ], pointLightShadow.shadowCameraNear, pointLightShadow.shadowCameraFar ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_SPOT_LIGHTS > 0 ) && defined( RE_Direct )
	SpotLight spotLight;
	vec4 spotColor;
	vec3 spotLightCoord;
	bool inSpotLightMap;
	#if defined( USE_SHADOWMAP ) && NUM_SPOT_LIGHT_SHADOWS > 0
	SpotLightShadow spotLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHTS; i ++ ) {
		spotLight = spotLights[ i ];
		getSpotLightInfo( spotLight, geometryPosition, directLight );
		#if ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )
		#define SPOT_LIGHT_MAP_INDEX UNROLLED_LOOP_INDEX
		#elif ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
		#define SPOT_LIGHT_MAP_INDEX NUM_SPOT_LIGHT_MAPS
		#else
		#define SPOT_LIGHT_MAP_INDEX ( UNROLLED_LOOP_INDEX - NUM_SPOT_LIGHT_SHADOWS + NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )
		#endif
		#if ( SPOT_LIGHT_MAP_INDEX < NUM_SPOT_LIGHT_MAPS )
			spotLightCoord = vSpotLightCoord[ i ].xyz / vSpotLightCoord[ i ].w;
			inSpotLightMap = all( lessThan( abs( spotLightCoord * 2. - 1. ), vec3( 1.0 ) ) );
			spotColor = texture2D( spotLightMap[ SPOT_LIGHT_MAP_INDEX ], spotLightCoord.xy );
			directLight.color = inSpotLightMap ? directLight.color * spotColor.rgb : directLight.color;
		#endif
		#undef SPOT_LIGHT_MAP_INDEX
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
		spotLightShadow = spotLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( spotShadowMap[ i ], spotLightShadow.shadowMapSize, spotLightShadow.shadowIntensity, spotLightShadow.shadowBias, spotLightShadow.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_DIR_LIGHTS > 0 ) && defined( RE_Direct )
	DirectionalLight directionalLight;
	#if defined( USE_SHADOWMAP ) && NUM_DIR_LIGHT_SHADOWS > 0
	DirectionalLightShadow directionalLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHTS; i ++ ) {
		directionalLight = directionalLights[ i ];
		getDirectionalLightInfo( directionalLight, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_DIR_LIGHT_SHADOWS )
		directionalLightShadow = directionalLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( directionalShadowMap[ i ], directionalLightShadow.shadowMapSize, directionalLightShadow.shadowIntensity, directionalLightShadow.shadowBias, directionalLightShadow.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_RECT_AREA_LIGHTS > 0 ) && defined( RE_Direct_RectArea )
	RectAreaLight rectAreaLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_RECT_AREA_LIGHTS; i ++ ) {
		rectAreaLight = rectAreaLights[ i ];
		RE_Direct_RectArea( rectAreaLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if defined( RE_IndirectDiffuse )
	vec3 iblIrradiance = vec3( 0.0 );
	vec3 irradiance = getAmbientLightIrradiance( ambientLightColor );
	#if defined( USE_LIGHT_PROBES )
		irradiance += getLightProbeIrradiance( lightProbe, geometryNormal );
	#endif
	#if ( NUM_HEMI_LIGHTS > 0 )
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_HEMI_LIGHTS; i ++ ) {
			irradiance += getHemisphereLightIrradiance( hemisphereLights[ i ], geometryNormal );
		}
		#pragma unroll_loop_end
	#endif
	#ifdef USE_LIGHT_PROBES_GRID
		vec3 probeWorldPos = ( ( vec4( geometryPosition, 1.0 ) - viewMatrix[ 3 ] ) * viewMatrix ).xyz;
		vec3 probeWorldNormal = transformNormalByInverseViewMatrix( geometryNormal, viewMatrix );
		irradiance += getLightProbeGridIrradiance( probeWorldPos, probeWorldNormal );
	#endif
#endif
#if defined( RE_IndirectSpecular )
	vec3 radiance = vec3( 0.0 );
	vec3 clearcoatRadiance = vec3( 0.0 );
#endif`,Nq=`#if defined( RE_IndirectDiffuse )
	#ifdef USE_LIGHTMAP
		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
		vec3 lightMapIrradiance = lightMapTexel.rgb * lightMapIntensity;
		irradiance += lightMapIrradiance;
	#endif
	#if defined( USE_ENVMAP ) && defined( ENVMAP_TYPE_CUBE_UV )
		#if defined( STANDARD ) || defined( LAMBERT ) || defined( PHONG )
			iblIrradiance += getIBLIrradiance( geometryNormal );
		#endif
	#endif
#endif
#if defined( USE_ENVMAP ) && defined( RE_IndirectSpecular )
	#ifdef USE_ANISOTROPY
		radiance += getIBLAnisotropyRadiance( geometryViewDir, geometryNormal, material.roughness, material.anisotropyB, material.anisotropy );
	#else
		radiance += getIBLRadiance( geometryViewDir, geometryNormal, material.roughness );
	#endif
	#ifdef USE_CLEARCOAT
		clearcoatRadiance += getIBLRadiance( geometryViewDir, geometryClearcoatNormal, material.clearcoatRoughness );
	#endif
#endif`,Dq=`#if defined( RE_IndirectDiffuse )
	#if defined( LAMBERT ) || defined( PHONG )
		irradiance += iblIrradiance;
	#endif
	RE_IndirectDiffuse( irradiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif
#if defined( RE_IndirectSpecular )
	RE_IndirectSpecular( radiance, iblIrradiance, clearcoatRadiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif`,Zq=`#ifdef USE_LIGHT_PROBES_GRID
uniform highp sampler3D probesSH;
uniform vec3 probesMin;
uniform vec3 probesMax;
uniform vec3 probesResolution;
vec3 getLightProbeGridIrradiance( vec3 worldPos, vec3 worldNormal ) {
	vec3 res = probesResolution;
	vec3 gridRange = probesMax - probesMin;
	vec3 resMinusOne = res - 1.0;
	vec3 probeSpacing = gridRange / resMinusOne;
	vec3 samplePos = worldPos + worldNormal * probeSpacing * 0.5;
	vec3 uvw = clamp( ( samplePos - probesMin ) / gridRange, 0.0, 1.0 );
	uvw = uvw * resMinusOne / res + 0.5 / res;
	float nz          = res.z;
	float paddedSlices = nz + 2.0;
	float atlasDepth  = 7.0 * paddedSlices;
	float uvZBase     = uvw.z * nz + 1.0;
	vec4 s0 = texture( probesSH, vec3( uvw.xy, ( uvZBase                       ) / atlasDepth ) );
	vec4 s1 = texture( probesSH, vec3( uvw.xy, ( uvZBase +       paddedSlices   ) / atlasDepth ) );
	vec4 s2 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 2.0 * paddedSlices   ) / atlasDepth ) );
	vec4 s3 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 3.0 * paddedSlices   ) / atlasDepth ) );
	vec4 s4 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 4.0 * paddedSlices   ) / atlasDepth ) );
	vec4 s5 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 5.0 * paddedSlices   ) / atlasDepth ) );
	vec4 s6 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 6.0 * paddedSlices   ) / atlasDepth ) );
	vec3 c0 = s0.xyz;
	vec3 c1 = vec3( s0.w, s1.xy );
	vec3 c2 = vec3( s1.zw, s2.x );
	vec3 c3 = s2.yzw;
	vec3 c4 = s3.xyz;
	vec3 c5 = vec3( s3.w, s4.xy );
	vec3 c6 = vec3( s4.zw, s5.x );
	vec3 c7 = s5.yzw;
	vec3 c8 = s6.xyz;
	float x = worldNormal.x, y = worldNormal.y, z = worldNormal.z;
	vec3 result = c0 * 0.886227;
	result += c1 * 2.0 * 0.511664 * y;
	result += c2 * 2.0 * 0.511664 * z;
	result += c3 * 2.0 * 0.511664 * x;
	result += c4 * 2.0 * 0.429043 * x * y;
	result += c5 * 2.0 * 0.429043 * y * z;
	result += c6 * ( 0.743125 * z * z - 0.247708 );
	result += c7 * 2.0 * 0.429043 * x * z;
	result += c8 * 0.429043 * ( x * x - y * y );
	return max( result, vec3( 0.0 ) );
}
#endif`,Hq=`#if defined( USE_LOGARITHMIC_DEPTH_BUFFER )
	gl_FragDepth = vIsPerspective == 0.0 ? gl_FragCoord.z : log2( vFragDepth ) * logDepthBufFC * 0.5;
#endif`,Uq=`#if defined( USE_LOGARITHMIC_DEPTH_BUFFER )
	uniform float logDepthBufFC;
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,Vq=`#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,Yq=`#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
	vFragDepth = 1.0 + gl_Position.w;
	vIsPerspective = float( isPerspectiveMatrix( projectionMatrix ) );
#endif`,Xq=`#ifdef USE_MAP
	vec4 sampledDiffuseColor = texture2D( map, vMapUv );
	#ifdef DECODE_VIDEO_TEXTURE
		sampledDiffuseColor = sRGBTransferEOTF( sampledDiffuseColor );
	#endif
	diffuseColor *= sampledDiffuseColor;
#endif`,kq=`#ifdef USE_MAP
	uniform sampler2D map;
#endif`,Eq=`#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
	#if defined( USE_POINTS_UV )
		vec2 uv = vUv;
	#else
		vec2 uv = ( uvTransform * vec3( gl_PointCoord.x, 1.0 - gl_PointCoord.y, 1 ) ).xy;
	#endif
#endif
#ifdef USE_MAP
	diffuseColor *= texture2D( map, uv );
#endif
#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, uv ).g;
#endif`,Iq=`#if defined( USE_POINTS_UV )
	varying vec2 vUv;
#else
	#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
		uniform mat3 uvTransform;
	#endif
#endif
#ifdef USE_MAP
	uniform sampler2D map;
#endif
#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,Aq=`float metalnessFactor = metalness;
#ifdef USE_METALNESSMAP
	vec4 texelMetalness = texture2D( metalnessMap, vMetalnessMapUv );
	metalnessFactor *= texelMetalness.b;
#endif`,Oq=`#ifdef USE_METALNESSMAP
	uniform sampler2D metalnessMap;
#endif`,Fq=`#ifdef USE_INSTANCING_MORPH
	float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	float morphTargetBaseInfluence = texelFetch( morphTexture, ivec2( 0, gl_InstanceID ), 0 ).r;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		morphTargetInfluences[i] =  texelFetch( morphTexture, ivec2( i + 1, gl_InstanceID ), 0 ).r;
	}
#endif`,Mq=`#if defined( USE_MORPHCOLORS )
	vColor *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		#if defined( USE_COLOR_ALPHA )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ) * morphTargetInfluences[ i ];
		#elif defined( USE_COLOR )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ).rgb * morphTargetInfluences[ i ];
		#endif
	}
#endif`,Lq=`#ifdef USE_MORPHNORMALS
	objectNormal *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) objectNormal += getMorph( gl_VertexID, i, 1 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,yq=`#ifdef USE_MORPHTARGETS
	#ifndef USE_INSTANCING_MORPH
		uniform float morphTargetBaseInfluence;
		uniform float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	#endif
	uniform sampler2DArray morphTargetsTexture;
	uniform ivec2 morphTargetsTextureSize;
	vec4 getMorph( const in int vertexIndex, const in int morphTargetIndex, const in int offset ) {
		int texelIndex = vertexIndex * MORPHTARGETS_TEXTURE_STRIDE + offset;
		int y = texelIndex / morphTargetsTextureSize.x;
		int x = texelIndex - y * morphTargetsTextureSize.x;
		ivec3 morphUV = ivec3( x, y, morphTargetIndex );
		return texelFetch( morphTargetsTexture, morphUV, 0 );
	}
#endif`,Sq=`#ifdef USE_MORPHTARGETS
	transformed *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) transformed += getMorph( gl_VertexID, i, 0 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,wq=`float faceDirection = gl_FrontFacing ? 1.0 : - 1.0;
#ifdef FLAT_SHADED
	vec3 fdx = dFdx( vViewPosition );
	vec3 fdy = dFdy( vViewPosition );
	vec3 normal = normalize( cross( fdx, fdy ) );
#else
	vec3 normal = normalize( vNormal );
	#ifdef DOUBLE_SIDED
		normal *= faceDirection;
	#endif
#endif
#if defined( USE_NORMALMAP_TANGENTSPACE ) || defined( USE_CLEARCOAT_NORMALMAP ) || defined( USE_ANISOTROPY )
	#ifdef USE_TANGENT
		mat3 tbn = mat3( normalize( vTangent ), normalize( vBitangent ), normal );
	#else
		mat3 tbn = getTangentFrame( - vViewPosition, normal,
		#if defined( USE_NORMALMAP )
			vNormalMapUv
		#elif defined( USE_CLEARCOAT_NORMALMAP )
			vClearcoatNormalMapUv
		#else
			vUv
		#endif
		);
	#endif
	#ifdef DOUBLE_SIDED
		tbn[0] *= faceDirection;
		tbn[1] *= faceDirection;
	#endif
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	#ifdef USE_TANGENT
		mat3 tbn2 = mat3( normalize( vTangent ), normalize( vBitangent ), normal );
	#else
		mat3 tbn2 = getTangentFrame( - vViewPosition, normal, vClearcoatNormalMapUv );
	#endif
	#ifdef DOUBLE_SIDED
		tbn2[0] *= faceDirection;
		tbn2[1] *= faceDirection;
	#endif
#endif
vec3 nonPerturbedNormal = normal;`,Cq=`#ifdef USE_NORMALMAP_OBJECTSPACE
	normal = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;
	#ifdef FLIP_SIDED
		normal = - normal;
	#endif
	#ifdef DOUBLE_SIDED
		normal = normal * faceDirection;
	#endif
	normal = normalize( normalMatrix * normal );
#elif defined( USE_NORMALMAP_TANGENTSPACE )
	vec3 mapN = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;
	#if defined( USE_PACKED_NORMALMAP )
		mapN = vec3( mapN.xy, sqrt( saturate( 1.0 - dot( mapN.xy, mapN.xy ) ) ) );
	#endif
	mapN.xy *= normalScale;
	normal = normalize( tbn * mapN );
#elif defined( USE_BUMPMAP )
	normal = perturbNormalArb( - vViewPosition, normal, dHdxy_fwd(), faceDirection );
#endif`,Rq=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,Pq=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,vq=`#ifndef FLAT_SHADED
	vNormal = normalize( transformedNormal );
	#ifdef USE_TANGENT
		vTangent = normalize( transformedTangent );
		vBitangent = normalize( cross( vNormal, vTangent ) * tangent.w );
		#ifdef FLIP_SIDED
			vBitangent = - vBitangent;
		#endif
	#endif
#endif`,fq=`#ifdef USE_NORMALMAP
	uniform sampler2D normalMap;
	uniform vec2 normalScale;
#endif
#ifdef USE_NORMALMAP_OBJECTSPACE
	uniform mat3 normalMatrix;
#endif
#if ! defined ( USE_TANGENT ) && ( defined ( USE_NORMALMAP_TANGENTSPACE ) || defined ( USE_CLEARCOAT_NORMALMAP ) || defined( USE_ANISOTROPY ) )
	mat3 getTangentFrame( vec3 eye_pos, vec3 surf_norm, vec2 uv ) {
		vec3 q0 = dFdx( eye_pos.xyz );
		vec3 q1 = dFdy( eye_pos.xyz );
		vec2 st0 = dFdx( uv.st );
		vec2 st1 = dFdy( uv.st );
		vec3 N = surf_norm;
		vec3 q1perp = cross( q1, N );
		vec3 q0perp = cross( N, q0 );
		vec3 T = q1perp * st0.x + q0perp * st1.x;
		vec3 B = q1perp * st0.y + q0perp * st1.y;
		float det = max( dot( T, T ), dot( B, B ) );
		float scale = ( det == 0.0 ) ? 0.0 : inversesqrt( det );
		return mat3( T * scale, B * scale, N );
	}
#endif`,Tq=`#ifdef USE_CLEARCOAT
	vec3 clearcoatNormal = nonPerturbedNormal;
#endif`,hq=`#ifdef USE_CLEARCOAT_NORMALMAP
	vec3 clearcoatMapN = texture2D( clearcoatNormalMap, vClearcoatNormalMapUv ).xyz * 2.0 - 1.0;
	clearcoatMapN.xy *= clearcoatNormalScale;
	clearcoatNormal = normalize( tbn2 * clearcoatMapN );
#endif`,xq=`#ifdef USE_CLEARCOATMAP
	uniform sampler2D clearcoatMap;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform sampler2D clearcoatNormalMap;
	uniform vec2 clearcoatNormalScale;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform sampler2D clearcoatRoughnessMap;
#endif`,jq=`#ifdef USE_IRIDESCENCEMAP
	uniform sampler2D iridescenceMap;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform sampler2D iridescenceThicknessMap;
#endif`,_q=`#ifdef OPAQUE
diffuseColor.a = 1.0;
#endif
#ifdef USE_TRANSMISSION
diffuseColor.a *= material.transmissionAlpha;
#endif
gl_FragColor = vec4( outgoingLight, diffuseColor.a );`,bq=`vec3 packNormalToRGB( const in vec3 normal ) {
	return normalize( normal ) * 0.5 + 0.5;
}
vec3 unpackRGBToNormal( const in vec3 rgb ) {
	return 2.0 * rgb.xyz - 1.0;
}
const float PackUpscale = 256. / 255.;const float UnpackDownscale = 255. / 256.;const float ShiftRight8 = 1. / 256.;
const float Inv255 = 1. / 255.;
const vec4 PackFactors = vec4( 1.0, 256.0, 256.0 * 256.0, 256.0 * 256.0 * 256.0 );
const vec2 UnpackFactors2 = vec2( UnpackDownscale, 1.0 / PackFactors.g );
const vec3 UnpackFactors3 = vec3( UnpackDownscale / PackFactors.rg, 1.0 / PackFactors.b );
const vec4 UnpackFactors4 = vec4( UnpackDownscale / PackFactors.rgb, 1.0 / PackFactors.a );
vec4 packDepthToRGBA( const in float v ) {
	if( v <= 0.0 )
		return vec4( 0., 0., 0., 0. );
	if( v >= 1.0 )
		return vec4( 1., 1., 1., 1. );
	float vuf;
	float af = modf( v * PackFactors.a, vuf );
	float bf = modf( vuf * ShiftRight8, vuf );
	float gf = modf( vuf * ShiftRight8, vuf );
	return vec4( vuf * Inv255, gf * PackUpscale, bf * PackUpscale, af );
}
vec3 packDepthToRGB( const in float v ) {
	if( v <= 0.0 )
		return vec3( 0., 0., 0. );
	if( v >= 1.0 )
		return vec3( 1., 1., 1. );
	float vuf;
	float bf = modf( v * PackFactors.b, vuf );
	float gf = modf( vuf * ShiftRight8, vuf );
	return vec3( vuf * Inv255, gf * PackUpscale, bf );
}
vec2 packDepthToRG( const in float v ) {
	if( v <= 0.0 )
		return vec2( 0., 0. );
	if( v >= 1.0 )
		return vec2( 1., 1. );
	float vuf;
	float gf = modf( v * 256., vuf );
	return vec2( vuf * Inv255, gf );
}
float unpackRGBAToDepth( const in vec4 v ) {
	return dot( v, UnpackFactors4 );
}
float unpackRGBToDepth( const in vec3 v ) {
	return dot( v, UnpackFactors3 );
}
float unpackRGToDepth( const in vec2 v ) {
	return v.r * UnpackFactors2.r + v.g * UnpackFactors2.g;
}
vec4 pack2HalfToRGBA( const in vec2 v ) {
	vec4 r = vec4( v.x, fract( v.x * 255.0 ), v.y, fract( v.y * 255.0 ) );
	return vec4( r.x - r.y / 255.0, r.y, r.z - r.w / 255.0, r.w );
}
vec2 unpackRGBATo2Half( const in vec4 v ) {
	return vec2( v.x + ( v.y / 255.0 ), v.z + ( v.w / 255.0 ) );
}
float viewZToOrthographicDepth( const in float viewZ, const in float near, const in float far ) {
	return ( viewZ + near ) / ( near - far );
}
float orthographicDepthToViewZ( const in float depth, const in float near, const in float far ) {
	#ifdef USE_REVERSED_DEPTH_BUFFER
	
		return depth * ( far - near ) - far;
	#else
		return depth * ( near - far ) - near;
	#endif
}
float viewZToPerspectiveDepth( const in float viewZ, const in float near, const in float far ) {
	return ( ( near + viewZ ) * far ) / ( ( far - near ) * viewZ );
}
float perspectiveDepthToViewZ( const in float depth, const in float near, const in float far ) {
	
	#ifdef USE_REVERSED_DEPTH_BUFFER
		return ( near * far ) / ( ( near - far ) * depth - near );
	#else
		return ( near * far ) / ( ( far - near ) * depth - far );
	#endif
}`,dq=`#ifdef PREMULTIPLIED_ALPHA
	gl_FragColor.rgb *= gl_FragColor.a;
#endif`,pq=`vec4 mvPosition = vec4( transformed, 1.0 );
#ifdef USE_BATCHING
	mvPosition = batchingMatrix * mvPosition;
#endif
#ifdef USE_INSTANCING
	mvPosition = instanceMatrix * mvPosition;
#endif
mvPosition = modelViewMatrix * mvPosition;
gl_Position = projectionMatrix * mvPosition;`,uq=`#ifdef DITHERING
	gl_FragColor.rgb = dithering( gl_FragColor.rgb );
#endif`,gq=`#ifdef DITHERING
	vec3 dithering( vec3 color ) {
		float grid_position = rand( gl_FragCoord.xy );
		vec3 dither_shift_RGB = vec3( 0.25 / 255.0, -0.25 / 255.0, 0.25 / 255.0 );
		dither_shift_RGB = mix( 2.0 * dither_shift_RGB, -2.0 * dither_shift_RGB, grid_position );
		return color + dither_shift_RGB;
	}
#endif`,lq=`float roughnessFactor = roughness;
#ifdef USE_ROUGHNESSMAP
	vec4 texelRoughness = texture2D( roughnessMap, vRoughnessMapUv );
	roughnessFactor *= texelRoughness.g;
#endif`,mq=`#ifdef USE_ROUGHNESSMAP
	uniform sampler2D roughnessMap;
#endif`,cq=`#if NUM_SPOT_LIGHT_COORDS > 0
	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#if NUM_SPOT_LIGHT_MAPS > 0
	uniform sampler2D spotLightMap[ NUM_SPOT_LIGHT_MAPS ];
#endif
#ifdef USE_SHADOWMAP
	#if NUM_DIR_LIGHT_SHADOWS > 0
		#if defined( SHADOWMAP_TYPE_PCF )
			uniform sampler2DShadow directionalShadowMap[ NUM_DIR_LIGHT_SHADOWS ];
		#else
			uniform sampler2D directionalShadowMap[ NUM_DIR_LIGHT_SHADOWS ];
		#endif
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];
		struct DirectionalLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
		#if defined( SHADOWMAP_TYPE_PCF )
			uniform sampler2DShadow spotShadowMap[ NUM_SPOT_LIGHT_SHADOWS ];
		#else
			uniform sampler2D spotShadowMap[ NUM_SPOT_LIGHT_SHADOWS ];
		#endif
		struct SpotLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		#if defined( SHADOWMAP_TYPE_PCF )
			uniform samplerCubeShadow pointShadowMap[ NUM_POINT_LIGHT_SHADOWS ];
		#elif defined( SHADOWMAP_TYPE_BASIC )
			uniform samplerCube pointShadowMap[ NUM_POINT_LIGHT_SHADOWS ];
		#endif
		varying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];
		struct PointLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
			float shadowCameraNear;
			float shadowCameraFar;
		};
		uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];
	#endif
	#if defined( SHADOWMAP_TYPE_PCF )
		float interleavedGradientNoise( vec2 position ) {
			return fract( 52.9829189 * fract( dot( position, vec2( 0.06711056, 0.00583715 ) ) ) );
		}
		vec2 vogelDiskSample( int sampleIndex, int samplesCount, float phi ) {
			const float goldenAngle = 2.399963229728653;
			float r = sqrt( ( float( sampleIndex ) + 0.5 ) / float( samplesCount ) );
			float theta = float( sampleIndex ) * goldenAngle + phi;
			return vec2( cos( theta ), sin( theta ) ) * r;
		}
	#endif
	#if defined( SHADOWMAP_TYPE_PCF )
		float getShadow( sampler2DShadow shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
			float shadow = 1.0;
			shadowCoord.xyz /= shadowCoord.w;
			shadowCoord.z += shadowBias;
			bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
			bool frustumTest = inFrustum && shadowCoord.z <= 1.0;
			if ( frustumTest ) {
				vec2 texelSize = vec2( 1.0 ) / shadowMapSize;
				float radius = shadowRadius * texelSize.x;
				float phi = interleavedGradientNoise( gl_FragCoord.xy ) * PI2;
				shadow = (
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 0, 5, phi ) * radius, shadowCoord.z ) ) +
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 1, 5, phi ) * radius, shadowCoord.z ) ) +
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 2, 5, phi ) * radius, shadowCoord.z ) ) +
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 3, 5, phi ) * radius, shadowCoord.z ) ) +
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 4, 5, phi ) * radius, shadowCoord.z ) )
				) * 0.2;
			}
			return mix( 1.0, shadow, shadowIntensity );
		}
	#elif defined( SHADOWMAP_TYPE_VSM )
		float getShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
			float shadow = 1.0;
			shadowCoord.xyz /= shadowCoord.w;
			#ifdef USE_REVERSED_DEPTH_BUFFER
				shadowCoord.z -= shadowBias;
			#else
				shadowCoord.z += shadowBias;
			#endif
			bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
			bool frustumTest = inFrustum && shadowCoord.z <= 1.0;
			if ( frustumTest ) {
				vec2 distribution = texture2D( shadowMap, shadowCoord.xy ).rg;
				float mean = distribution.x;
				float variance = distribution.y * distribution.y;
				#ifdef USE_REVERSED_DEPTH_BUFFER
					float hard_shadow = step( mean, shadowCoord.z );
				#else
					float hard_shadow = step( shadowCoord.z, mean );
				#endif
				
				if ( hard_shadow == 1.0 ) {
					shadow = 1.0;
				} else {
					variance = max( variance, 0.0000001 );
					float d = shadowCoord.z - mean;
					float p_max = variance / ( variance + d * d );
					p_max = clamp( ( p_max - 0.3 ) / 0.65, 0.0, 1.0 );
					shadow = max( hard_shadow, p_max );
				}
			}
			return mix( 1.0, shadow, shadowIntensity );
		}
	#else
		float getShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
			float shadow = 1.0;
			shadowCoord.xyz /= shadowCoord.w;
			#ifdef USE_REVERSED_DEPTH_BUFFER
				shadowCoord.z -= shadowBias;
			#else
				shadowCoord.z += shadowBias;
			#endif
			bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
			bool frustumTest = inFrustum && shadowCoord.z <= 1.0;
			if ( frustumTest ) {
				float depth = texture2D( shadowMap, shadowCoord.xy ).r;
				#ifdef USE_REVERSED_DEPTH_BUFFER
					shadow = step( depth, shadowCoord.z );
				#else
					shadow = step( shadowCoord.z, depth );
				#endif
			}
			return mix( 1.0, shadow, shadowIntensity );
		}
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
	#if defined( SHADOWMAP_TYPE_PCF )
	float getPointShadow( samplerCubeShadow shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord, float shadowCameraNear, float shadowCameraFar ) {
		float shadow = 1.0;
		vec3 lightToPosition = shadowCoord.xyz;
		vec3 bd3D = normalize( lightToPosition );
		vec3 absVec = abs( lightToPosition );
		float viewSpaceZ = max( max( absVec.x, absVec.y ), absVec.z );
		if ( viewSpaceZ - shadowCameraFar <= 0.0 && viewSpaceZ - shadowCameraNear >= 0.0 ) {
			#ifdef USE_REVERSED_DEPTH_BUFFER
				float dp = ( shadowCameraNear * ( shadowCameraFar - viewSpaceZ ) ) / ( viewSpaceZ * ( shadowCameraFar - shadowCameraNear ) );
				dp -= shadowBias;
			#else
				float dp = ( shadowCameraFar * ( viewSpaceZ - shadowCameraNear ) ) / ( viewSpaceZ * ( shadowCameraFar - shadowCameraNear ) );
				dp += shadowBias;
			#endif
			float texelSize = shadowRadius / shadowMapSize.x;
			vec3 absDir = abs( bd3D );
			vec3 tangent = absDir.x > absDir.z ? vec3( 0.0, 1.0, 0.0 ) : vec3( 1.0, 0.0, 0.0 );
			tangent = normalize( cross( bd3D, tangent ) );
			vec3 bitangent = cross( bd3D, tangent );
			float phi = interleavedGradientNoise( gl_FragCoord.xy ) * PI2;
			vec2 sample0 = vogelDiskSample( 0, 5, phi );
			vec2 sample1 = vogelDiskSample( 1, 5, phi );
			vec2 sample2 = vogelDiskSample( 2, 5, phi );
			vec2 sample3 = vogelDiskSample( 3, 5, phi );
			vec2 sample4 = vogelDiskSample( 4, 5, phi );
			shadow = (
				texture( shadowMap, vec4( bd3D + ( tangent * sample0.x + bitangent * sample0.y ) * texelSize, dp ) ) +
				texture( shadowMap, vec4( bd3D + ( tangent * sample1.x + bitangent * sample1.y ) * texelSize, dp ) ) +
				texture( shadowMap, vec4( bd3D + ( tangent * sample2.x + bitangent * sample2.y ) * texelSize, dp ) ) +
				texture( shadowMap, vec4( bd3D + ( tangent * sample3.x + bitangent * sample3.y ) * texelSize, dp ) ) +
				texture( shadowMap, vec4( bd3D + ( tangent * sample4.x + bitangent * sample4.y ) * texelSize, dp ) )
			) * 0.2;
		}
		return mix( 1.0, shadow, shadowIntensity );
	}
	#elif defined( SHADOWMAP_TYPE_BASIC )
	float getPointShadow( samplerCube shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord, float shadowCameraNear, float shadowCameraFar ) {
		float shadow = 1.0;
		vec3 lightToPosition = shadowCoord.xyz;
		vec3 absVec = abs( lightToPosition );
		float viewSpaceZ = max( max( absVec.x, absVec.y ), absVec.z );
		if ( viewSpaceZ - shadowCameraFar <= 0.0 && viewSpaceZ - shadowCameraNear >= 0.0 ) {
			float dp = ( shadowCameraFar * ( viewSpaceZ - shadowCameraNear ) ) / ( viewSpaceZ * ( shadowCameraFar - shadowCameraNear ) );
			dp += shadowBias;
			vec3 bd3D = normalize( lightToPosition );
			float depth = textureCube( shadowMap, bd3D ).r;
			#ifdef USE_REVERSED_DEPTH_BUFFER
				depth = 1.0 - depth;
			#endif
			shadow = step( dp, depth );
		}
		return mix( 1.0, shadow, shadowIntensity );
	}
	#endif
	#endif
#endif`,nq=`#if NUM_SPOT_LIGHT_COORDS > 0
	uniform mat4 spotLightMatrix[ NUM_SPOT_LIGHT_COORDS ];
	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#ifdef USE_SHADOWMAP
	#if NUM_DIR_LIGHT_SHADOWS > 0
		uniform mat4 directionalShadowMatrix[ NUM_DIR_LIGHT_SHADOWS ];
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];
		struct DirectionalLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
		struct SpotLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		uniform mat4 pointShadowMatrix[ NUM_POINT_LIGHT_SHADOWS ];
		varying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];
		struct PointLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
			float shadowCameraNear;
			float shadowCameraFar;
		};
		uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];
	#endif
#endif`,oq=`#if ( defined( USE_SHADOWMAP ) && ( NUM_DIR_LIGHT_SHADOWS > 0 || NUM_POINT_LIGHT_SHADOWS > 0 ) ) || ( NUM_SPOT_LIGHT_COORDS > 0 )
	#ifdef HAS_NORMAL
		vec3 shadowWorldNormal = transformNormalByInverseViewMatrix( transformedNormal, viewMatrix );
	#else
		vec3 shadowWorldNormal = vec3( 0.0 );
	#endif
	vec4 shadowWorldPosition;
#endif
#if defined( USE_SHADOWMAP )
	#if NUM_DIR_LIGHT_SHADOWS > 0
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {
			shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * directionalLightShadows[ i ].shadowNormalBias, 0 );
			vDirectionalShadowCoord[ i ] = directionalShadowMatrix[ i ] * shadowWorldPosition;
		}
		#pragma unroll_loop_end
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {
			shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * pointLightShadows[ i ].shadowNormalBias, 0 );
			vPointShadowCoord[ i ] = pointShadowMatrix[ i ] * shadowWorldPosition;
		}
		#pragma unroll_loop_end
	#endif
#endif
#if NUM_SPOT_LIGHT_COORDS > 0
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHT_COORDS; i ++ ) {
		shadowWorldPosition = worldPosition;
		#if ( defined( USE_SHADOWMAP ) && UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
			shadowWorldPosition.xyz += shadowWorldNormal * spotLightShadows[ i ].shadowNormalBias;
		#endif
		vSpotLightCoord[ i ] = spotLightMatrix[ i ] * shadowWorldPosition;
	}
	#pragma unroll_loop_end
#endif`,sq=`float getShadowMask() {
	float shadow = 1.0;
	#ifdef USE_SHADOWMAP
	#if NUM_DIR_LIGHT_SHADOWS > 0
	DirectionalLightShadow directionalLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {
		directionalLight = directionalLightShadows[ i ];
		shadow *= receiveShadow ? getShadow( directionalShadowMap[ i ], directionalLight.shadowMapSize, directionalLight.shadowIntensity, directionalLight.shadowBias, directionalLight.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
	SpotLightShadow spotLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHT_SHADOWS; i ++ ) {
		spotLight = spotLightShadows[ i ];
		shadow *= receiveShadow ? getShadow( spotShadowMap[ i ], spotLight.shadowMapSize, spotLight.shadowIntensity, spotLight.shadowBias, spotLight.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0 && ( defined( SHADOWMAP_TYPE_PCF ) || defined( SHADOWMAP_TYPE_BASIC ) )
	PointLightShadow pointLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {
		pointLight = pointLightShadows[ i ];
		shadow *= receiveShadow ? getPointShadow( pointShadowMap[ i ], pointLight.shadowMapSize, pointLight.shadowIntensity, pointLight.shadowBias, pointLight.shadowRadius, vPointShadowCoord[ i ], pointLight.shadowCameraNear, pointLight.shadowCameraFar ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#endif
	return shadow;
}`,iq=`#ifdef USE_SKINNING
	mat4 boneMatX = getBoneMatrix( skinIndex.x );
	mat4 boneMatY = getBoneMatrix( skinIndex.y );
	mat4 boneMatZ = getBoneMatrix( skinIndex.z );
	mat4 boneMatW = getBoneMatrix( skinIndex.w );
#endif`,aq=`#ifdef USE_SKINNING
	uniform mat4 bindMatrix;
	uniform mat4 bindMatrixInverse;
	uniform highp sampler2D boneTexture;
	mat4 getBoneMatrix( const in float i ) {
		int size = textureSize( boneTexture, 0 ).x;
		int j = int( i ) * 4;
		int x = j % size;
		int y = j / size;
		vec4 v1 = texelFetch( boneTexture, ivec2( x, y ), 0 );
		vec4 v2 = texelFetch( boneTexture, ivec2( x + 1, y ), 0 );
		vec4 v3 = texelFetch( boneTexture, ivec2( x + 2, y ), 0 );
		vec4 v4 = texelFetch( boneTexture, ivec2( x + 3, y ), 0 );
		return mat4( v1, v2, v3, v4 );
	}
#endif`,tq=`#ifdef USE_SKINNING
	vec4 skinVertex = bindMatrix * vec4( transformed, 1.0 );
	vec4 skinned = vec4( 0.0 );
	skinned += boneMatX * skinVertex * skinWeight.x;
	skinned += boneMatY * skinVertex * skinWeight.y;
	skinned += boneMatZ * skinVertex * skinWeight.z;
	skinned += boneMatW * skinVertex * skinWeight.w;
	transformed = ( bindMatrixInverse * skinned ).xyz;
#endif`,rq=`#ifdef USE_SKINNING
	mat4 skinMatrix = mat4( 0.0 );
	skinMatrix += skinWeight.x * boneMatX;
	skinMatrix += skinWeight.y * boneMatY;
	skinMatrix += skinWeight.z * boneMatZ;
	skinMatrix += skinWeight.w * boneMatW;
	skinMatrix = bindMatrixInverse * skinMatrix * bindMatrix;
	objectNormal = vec4( skinMatrix * vec4( objectNormal, 0.0 ) ).xyz;
	#ifdef USE_TANGENT
		objectTangent = vec4( skinMatrix * vec4( objectTangent, 0.0 ) ).xyz;
	#endif
#endif`,eq=`float specularStrength;
#ifdef USE_SPECULARMAP
	vec4 texelSpecular = texture2D( specularMap, vSpecularMapUv );
	specularStrength = texelSpecular.r;
#else
	specularStrength = 1.0;
#endif`,z4=`#ifdef USE_SPECULARMAP
	uniform sampler2D specularMap;
#endif`,J4=`#if defined( TONE_MAPPING )
	gl_FragColor.rgb = toneMapping( gl_FragColor.rgb );
#endif`,Q4=`#ifndef saturate
#define saturate( a ) clamp( a, 0.0, 1.0 )
#endif
uniform float toneMappingExposure;
vec3 LinearToneMapping( vec3 color ) {
	return saturate( toneMappingExposure * color );
}
vec3 ReinhardToneMapping( vec3 color ) {
	color *= toneMappingExposure;
	return saturate( color / ( vec3( 1.0 ) + color ) );
}
vec3 CineonToneMapping( vec3 color ) {
	color *= toneMappingExposure;
	color = max( vec3( 0.0 ), color - 0.004 );
	return pow( ( color * ( 6.2 * color + 0.5 ) ) / ( color * ( 6.2 * color + 1.7 ) + 0.06 ), vec3( 2.2 ) );
}
vec3 RRTAndODTFit( vec3 v ) {
	vec3 a = v * ( v + 0.0245786 ) - 0.000090537;
	vec3 b = v * ( 0.983729 * v + 0.4329510 ) + 0.238081;
	return a / b;
}
vec3 ACESFilmicToneMapping( vec3 color ) {
	const mat3 ACESInputMat = mat3(
		vec3( 0.59719, 0.07600, 0.02840 ),		vec3( 0.35458, 0.90834, 0.13383 ),
		vec3( 0.04823, 0.01566, 0.83777 )
	);
	const mat3 ACESOutputMat = mat3(
		vec3(  1.60475, -0.10208, -0.00327 ),		vec3( -0.53108,  1.10813, -0.07276 ),
		vec3( -0.07367, -0.00605,  1.07602 )
	);
	color *= toneMappingExposure / 0.6;
	color = ACESInputMat * color;
	color = RRTAndODTFit( color );
	color = ACESOutputMat * color;
	return saturate( color );
}
const mat3 LINEAR_REC2020_TO_LINEAR_SRGB = mat3(
	vec3( 1.6605, - 0.1246, - 0.0182 ),
	vec3( - 0.5876, 1.1329, - 0.1006 ),
	vec3( - 0.0728, - 0.0083, 1.1187 )
);
const mat3 LINEAR_SRGB_TO_LINEAR_REC2020 = mat3(
	vec3( 0.6274, 0.0691, 0.0164 ),
	vec3( 0.3293, 0.9195, 0.0880 ),
	vec3( 0.0433, 0.0113, 0.8956 )
);
vec3 agxDefaultContrastApprox( vec3 x ) {
	vec3 x2 = x * x;
	vec3 x4 = x2 * x2;
	return + 15.5 * x4 * x2
		- 40.14 * x4 * x
		+ 31.96 * x4
		- 6.868 * x2 * x
		+ 0.4298 * x2
		+ 0.1191 * x
		- 0.00232;
}
vec3 AgXToneMapping( vec3 color ) {
	const mat3 AgXInsetMatrix = mat3(
		vec3( 0.856627153315983, 0.137318972929847, 0.11189821299995 ),
		vec3( 0.0951212405381588, 0.761241990602591, 0.0767994186031903 ),
		vec3( 0.0482516061458583, 0.101439036467562, 0.811302368396859 )
	);
	const mat3 AgXOutsetMatrix = mat3(
		vec3( 1.1271005818144368, - 0.1413297634984383, - 0.14132976349843826 ),
		vec3( - 0.11060664309660323, 1.157823702216272, - 0.11060664309660294 ),
		vec3( - 0.016493938717834573, - 0.016493938717834257, 1.2519364065950405 )
	);
	const float AgxMinEv = - 12.47393;	const float AgxMaxEv = 4.026069;
	color *= toneMappingExposure;
	color = LINEAR_SRGB_TO_LINEAR_REC2020 * color;
	color = AgXInsetMatrix * color;
	color = max( color, 1e-10 );	color = log2( color );
	color = ( color - AgxMinEv ) / ( AgxMaxEv - AgxMinEv );
	color = clamp( color, 0.0, 1.0 );
	color = agxDefaultContrastApprox( color );
	color = AgXOutsetMatrix * color;
	color = pow( max( vec3( 0.0 ), color ), vec3( 2.2 ) );
	color = LINEAR_REC2020_TO_LINEAR_SRGB * color;
	color = clamp( color, 0.0, 1.0 );
	return color;
}
vec3 NeutralToneMapping( vec3 color ) {
	const float StartCompression = 0.8 - 0.04;
	const float Desaturation = 0.15;
	color *= toneMappingExposure;
	float x = min( color.r, min( color.g, color.b ) );
	float offset = x < 0.08 ? x - 6.25 * x * x : 0.04;
	color -= offset;
	float peak = max( color.r, max( color.g, color.b ) );
	if ( peak < StartCompression ) return color;
	float d = 1. - StartCompression;
	float newPeak = 1. - d * d / ( peak + d - StartCompression );
	color *= newPeak / peak;
	float g = 1. - 1. / ( Desaturation * ( peak - newPeak ) + 1. );
	return mix( color, vec3( newPeak ), g );
}
vec3 CustomToneMapping( vec3 color ) { return color; }`,$4=`#ifdef USE_TRANSMISSION
	material.transmission = transmission;
	material.transmissionAlpha = 1.0;
	material.thickness = thickness;
	material.attenuationDistance = attenuationDistance;
	material.attenuationColor = attenuationColor;
	#ifdef USE_TRANSMISSIONMAP
		material.transmission *= texture2D( transmissionMap, vTransmissionMapUv ).r;
	#endif
	#ifdef USE_THICKNESSMAP
		material.thickness *= texture2D( thicknessMap, vThicknessMapUv ).g;
	#endif
	vec3 pos = vWorldPosition;
	vec3 v = normalize( cameraPosition - pos );
	vec3 n = transformNormalByInverseViewMatrix( normal, viewMatrix );
	vec4 transmitted = getIBLVolumeRefraction(
		n, v, material.roughness, material.diffuseContribution, material.specularColorBlended, material.specularF90,
		pos, modelMatrix, viewMatrix, projectionMatrix, material.dispersion, material.ior, material.thickness,
		material.attenuationColor, material.attenuationDistance );
	material.transmissionAlpha = mix( material.transmissionAlpha, transmitted.a, material.transmission );
	totalDiffuse = mix( totalDiffuse, transmitted.rgb, material.transmission );
#endif`,K4=`#ifdef USE_TRANSMISSION
	uniform float transmission;
	uniform float thickness;
	uniform float attenuationDistance;
	uniform vec3 attenuationColor;
	#ifdef USE_TRANSMISSIONMAP
		uniform sampler2D transmissionMap;
	#endif
	#ifdef USE_THICKNESSMAP
		uniform sampler2D thicknessMap;
	#endif
	uniform vec2 transmissionSamplerSize;
	uniform sampler2D transmissionSamplerMap;
	uniform mat4 modelMatrix;
	uniform mat4 projectionMatrix;
	varying vec3 vWorldPosition;
	float w0( float a ) {
		return ( 1.0 / 6.0 ) * ( a * ( a * ( - a + 3.0 ) - 3.0 ) + 1.0 );
	}
	float w1( float a ) {
		return ( 1.0 / 6.0 ) * ( a *  a * ( 3.0 * a - 6.0 ) + 4.0 );
	}
	float w2( float a ){
		return ( 1.0 / 6.0 ) * ( a * ( a * ( - 3.0 * a + 3.0 ) + 3.0 ) + 1.0 );
	}
	float w3( float a ) {
		return ( 1.0 / 6.0 ) * ( a * a * a );
	}
	float g0( float a ) {
		return w0( a ) + w1( a );
	}
	float g1( float a ) {
		return w2( a ) + w3( a );
	}
	float h0( float a ) {
		return - 1.0 + w1( a ) / ( w0( a ) + w1( a ) );
	}
	float h1( float a ) {
		return 1.0 + w3( a ) / ( w2( a ) + w3( a ) );
	}
	vec4 bicubic( sampler2D tex, vec2 uv, vec4 texelSize, float lod ) {
		uv = uv * texelSize.zw + 0.5;
		vec2 iuv = floor( uv );
		vec2 fuv = fract( uv );
		float g0x = g0( fuv.x );
		float g1x = g1( fuv.x );
		float h0x = h0( fuv.x );
		float h1x = h1( fuv.x );
		float h0y = h0( fuv.y );
		float h1y = h1( fuv.y );
		vec2 p0 = ( vec2( iuv.x + h0x, iuv.y + h0y ) - 0.5 ) * texelSize.xy;
		vec2 p1 = ( vec2( iuv.x + h1x, iuv.y + h0y ) - 0.5 ) * texelSize.xy;
		vec2 p2 = ( vec2( iuv.x + h0x, iuv.y + h1y ) - 0.5 ) * texelSize.xy;
		vec2 p3 = ( vec2( iuv.x + h1x, iuv.y + h1y ) - 0.5 ) * texelSize.xy;
		return g0( fuv.y ) * ( g0x * textureLod( tex, p0, lod ) + g1x * textureLod( tex, p1, lod ) ) +
			g1( fuv.y ) * ( g0x * textureLod( tex, p2, lod ) + g1x * textureLod( tex, p3, lod ) );
	}
	vec4 textureBicubic( sampler2D sampler, vec2 uv, float lod ) {
		vec2 fLodSize = vec2( textureSize( sampler, int( lod ) ) );
		vec2 cLodSize = vec2( textureSize( sampler, int( lod + 1.0 ) ) );
		vec2 fLodSizeInv = 1.0 / fLodSize;
		vec2 cLodSizeInv = 1.0 / cLodSize;
		vec4 fSample = bicubic( sampler, uv, vec4( fLodSizeInv, fLodSize ), floor( lod ) );
		vec4 cSample = bicubic( sampler, uv, vec4( cLodSizeInv, cLodSize ), ceil( lod ) );
		return mix( fSample, cSample, fract( lod ) );
	}
	vec3 getVolumeTransmissionRay( const in vec3 n, const in vec3 v, const in float thickness, const in float ior, const in mat4 modelMatrix ) {
		vec3 refractionVector = refract( - v, normalize( n ), 1.0 / ior );
		vec3 modelScale;
		modelScale.x = length( vec3( modelMatrix[ 0 ].xyz ) );
		modelScale.y = length( vec3( modelMatrix[ 1 ].xyz ) );
		modelScale.z = length( vec3( modelMatrix[ 2 ].xyz ) );
		return normalize( refractionVector ) * thickness * modelScale;
	}
	float applyIorToRoughness( const in float roughness, const in float ior ) {
		return roughness * clamp( ior * 2.0 - 2.0, 0.0, 1.0 );
	}
	vec4 getTransmissionSample( const in vec2 fragCoord, const in float roughness, const in float ior ) {
		float lod = log2( transmissionSamplerSize.x ) * applyIorToRoughness( roughness, ior );
		return textureBicubic( transmissionSamplerMap, fragCoord.xy, lod );
	}
	vec3 volumeAttenuation( const in float transmissionDistance, const in vec3 attenuationColor, const in float attenuationDistance ) {
		if ( isinf( attenuationDistance ) ) {
			return vec3( 1.0 );
		} else {
			vec3 attenuationCoefficient = -log( attenuationColor ) / attenuationDistance;
			vec3 transmittance = exp( - attenuationCoefficient * transmissionDistance );			return transmittance;
		}
	}
	vec4 getIBLVolumeRefraction( const in vec3 n, const in vec3 v, const in float roughness, const in vec3 diffuseColor,
		const in vec3 specularColor, const in float specularF90, const in vec3 position, const in mat4 modelMatrix,
		const in mat4 viewMatrix, const in mat4 projMatrix, const in float dispersion, const in float ior, const in float thickness,
		const in vec3 attenuationColor, const in float attenuationDistance ) {
		vec4 transmittedLight;
		vec3 transmittance;
		#ifdef USE_DISPERSION
			float halfSpread = ( ior - 1.0 ) * 0.025 * dispersion;
			vec3 iors = vec3( ior - halfSpread, ior, ior + halfSpread );
			for ( int i = 0; i < 3; i ++ ) {
				vec3 transmissionRay = getVolumeTransmissionRay( n, v, thickness, iors[ i ], modelMatrix );
				vec3 refractedRayExit = position + transmissionRay;
				vec4 ndcPos = projMatrix * viewMatrix * vec4( refractedRayExit, 1.0 );
				vec2 refractionCoords = ndcPos.xy / ndcPos.w;
				refractionCoords += 1.0;
				refractionCoords /= 2.0;
				vec4 transmissionSample = getTransmissionSample( refractionCoords, roughness, iors[ i ] );
				transmittedLight[ i ] = transmissionSample[ i ];
				transmittedLight.a += transmissionSample.a;
				transmittance[ i ] = diffuseColor[ i ] * volumeAttenuation( length( transmissionRay ), attenuationColor, attenuationDistance )[ i ];
			}
			transmittedLight.a /= 3.0;
		#else
			vec3 transmissionRay = getVolumeTransmissionRay( n, v, thickness, ior, modelMatrix );
			vec3 refractedRayExit = position + transmissionRay;
			vec4 ndcPos = projMatrix * viewMatrix * vec4( refractedRayExit, 1.0 );
			vec2 refractionCoords = ndcPos.xy / ndcPos.w;
			refractionCoords += 1.0;
			refractionCoords /= 2.0;
			transmittedLight = getTransmissionSample( refractionCoords, roughness, ior );
			transmittance = diffuseColor * volumeAttenuation( length( transmissionRay ), attenuationColor, attenuationDistance );
		#endif
		vec3 attenuatedColor = transmittance * transmittedLight.rgb;
		vec3 F = EnvironmentBRDF( n, v, specularColor, specularF90, roughness );
		float transmittanceFactor = ( transmittance.r + transmittance.g + transmittance.b ) / 3.0;
		return vec4( ( 1.0 - F ) * attenuatedColor, 1.0 - ( 1.0 - transmittedLight.a ) * transmittanceFactor );
	}
#endif`,W4=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	varying vec2 vUv;
#endif
#ifdef USE_MAP
	varying vec2 vMapUv;
#endif
#ifdef USE_ALPHAMAP
	varying vec2 vAlphaMapUv;
#endif
#ifdef USE_LIGHTMAP
	varying vec2 vLightMapUv;
#endif
#ifdef USE_AOMAP
	varying vec2 vAoMapUv;
#endif
#ifdef USE_BUMPMAP
	varying vec2 vBumpMapUv;
#endif
#ifdef USE_NORMALMAP
	varying vec2 vNormalMapUv;
#endif
#ifdef USE_EMISSIVEMAP
	varying vec2 vEmissiveMapUv;
#endif
#ifdef USE_METALNESSMAP
	varying vec2 vMetalnessMapUv;
#endif
#ifdef USE_ROUGHNESSMAP
	varying vec2 vRoughnessMapUv;
#endif
#ifdef USE_ANISOTROPYMAP
	varying vec2 vAnisotropyMapUv;
#endif
#ifdef USE_CLEARCOATMAP
	varying vec2 vClearcoatMapUv;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	varying vec2 vClearcoatNormalMapUv;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	varying vec2 vClearcoatRoughnessMapUv;
#endif
#ifdef USE_IRIDESCENCEMAP
	varying vec2 vIridescenceMapUv;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	varying vec2 vIridescenceThicknessMapUv;
#endif
#ifdef USE_SHEEN_COLORMAP
	varying vec2 vSheenColorMapUv;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	varying vec2 vSheenRoughnessMapUv;
#endif
#ifdef USE_SPECULARMAP
	varying vec2 vSpecularMapUv;
#endif
#ifdef USE_SPECULAR_COLORMAP
	varying vec2 vSpecularColorMapUv;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	varying vec2 vSpecularIntensityMapUv;
#endif
#ifdef USE_TRANSMISSIONMAP
	uniform mat3 transmissionMapTransform;
	varying vec2 vTransmissionMapUv;
#endif
#ifdef USE_THICKNESSMAP
	uniform mat3 thicknessMapTransform;
	varying vec2 vThicknessMapUv;
#endif`,q4=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	varying vec2 vUv;
#endif
#ifdef USE_MAP
	uniform mat3 mapTransform;
	varying vec2 vMapUv;
#endif
#ifdef USE_ALPHAMAP
	uniform mat3 alphaMapTransform;
	varying vec2 vAlphaMapUv;
#endif
#ifdef USE_LIGHTMAP
	uniform mat3 lightMapTransform;
	varying vec2 vLightMapUv;
#endif
#ifdef USE_AOMAP
	uniform mat3 aoMapTransform;
	varying vec2 vAoMapUv;
#endif
#ifdef USE_BUMPMAP
	uniform mat3 bumpMapTransform;
	varying vec2 vBumpMapUv;
#endif
#ifdef USE_NORMALMAP
	uniform mat3 normalMapTransform;
	varying vec2 vNormalMapUv;
#endif
#ifdef USE_DISPLACEMENTMAP
	uniform mat3 displacementMapTransform;
	varying vec2 vDisplacementMapUv;
#endif
#ifdef USE_EMISSIVEMAP
	uniform mat3 emissiveMapTransform;
	varying vec2 vEmissiveMapUv;
#endif
#ifdef USE_METALNESSMAP
	uniform mat3 metalnessMapTransform;
	varying vec2 vMetalnessMapUv;
#endif
#ifdef USE_ROUGHNESSMAP
	uniform mat3 roughnessMapTransform;
	varying vec2 vRoughnessMapUv;
#endif
#ifdef USE_ANISOTROPYMAP
	uniform mat3 anisotropyMapTransform;
	varying vec2 vAnisotropyMapUv;
#endif
#ifdef USE_CLEARCOATMAP
	uniform mat3 clearcoatMapTransform;
	varying vec2 vClearcoatMapUv;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform mat3 clearcoatNormalMapTransform;
	varying vec2 vClearcoatNormalMapUv;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform mat3 clearcoatRoughnessMapTransform;
	varying vec2 vClearcoatRoughnessMapUv;
#endif
#ifdef USE_SHEEN_COLORMAP
	uniform mat3 sheenColorMapTransform;
	varying vec2 vSheenColorMapUv;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	uniform mat3 sheenRoughnessMapTransform;
	varying vec2 vSheenRoughnessMapUv;
#endif
#ifdef USE_IRIDESCENCEMAP
	uniform mat3 iridescenceMapTransform;
	varying vec2 vIridescenceMapUv;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform mat3 iridescenceThicknessMapTransform;
	varying vec2 vIridescenceThicknessMapUv;
#endif
#ifdef USE_SPECULARMAP
	uniform mat3 specularMapTransform;
	varying vec2 vSpecularMapUv;
#endif
#ifdef USE_SPECULAR_COLORMAP
	uniform mat3 specularColorMapTransform;
	varying vec2 vSpecularColorMapUv;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	uniform mat3 specularIntensityMapTransform;
	varying vec2 vSpecularIntensityMapUv;
#endif
#ifdef USE_TRANSMISSIONMAP
	uniform mat3 transmissionMapTransform;
	varying vec2 vTransmissionMapUv;
#endif
#ifdef USE_THICKNESSMAP
	uniform mat3 thicknessMapTransform;
	varying vec2 vThicknessMapUv;
#endif`,B4=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	vUv = vec3( uv, 1 ).xy;
#endif
#ifdef USE_MAP
	vMapUv = ( mapTransform * vec3( MAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ALPHAMAP
	vAlphaMapUv = ( alphaMapTransform * vec3( ALPHAMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_LIGHTMAP
	vLightMapUv = ( lightMapTransform * vec3( LIGHTMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_AOMAP
	vAoMapUv = ( aoMapTransform * vec3( AOMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_BUMPMAP
	vBumpMapUv = ( bumpMapTransform * vec3( BUMPMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_NORMALMAP
	vNormalMapUv = ( normalMapTransform * vec3( NORMALMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_DISPLACEMENTMAP
	vDisplacementMapUv = ( displacementMapTransform * vec3( DISPLACEMENTMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_EMISSIVEMAP
	vEmissiveMapUv = ( emissiveMapTransform * vec3( EMISSIVEMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_METALNESSMAP
	vMetalnessMapUv = ( metalnessMapTransform * vec3( METALNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ROUGHNESSMAP
	vRoughnessMapUv = ( roughnessMapTransform * vec3( ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ANISOTROPYMAP
	vAnisotropyMapUv = ( anisotropyMapTransform * vec3( ANISOTROPYMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOATMAP
	vClearcoatMapUv = ( clearcoatMapTransform * vec3( CLEARCOATMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	vClearcoatNormalMapUv = ( clearcoatNormalMapTransform * vec3( CLEARCOAT_NORMALMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	vClearcoatRoughnessMapUv = ( clearcoatRoughnessMapTransform * vec3( CLEARCOAT_ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_IRIDESCENCEMAP
	vIridescenceMapUv = ( iridescenceMapTransform * vec3( IRIDESCENCEMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	vIridescenceThicknessMapUv = ( iridescenceThicknessMapTransform * vec3( IRIDESCENCE_THICKNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SHEEN_COLORMAP
	vSheenColorMapUv = ( sheenColorMapTransform * vec3( SHEEN_COLORMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	vSheenRoughnessMapUv = ( sheenRoughnessMapTransform * vec3( SHEEN_ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULARMAP
	vSpecularMapUv = ( specularMapTransform * vec3( SPECULARMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULAR_COLORMAP
	vSpecularColorMapUv = ( specularColorMapTransform * vec3( SPECULAR_COLORMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	vSpecularIntensityMapUv = ( specularIntensityMapTransform * vec3( SPECULAR_INTENSITYMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_TRANSMISSIONMAP
	vTransmissionMapUv = ( transmissionMapTransform * vec3( TRANSMISSIONMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_THICKNESSMAP
	vThicknessMapUv = ( thicknessMapTransform * vec3( THICKNESSMAP_UV, 1 ) ).xy;
#endif`,G4=`#if defined( USE_ENVMAP ) || defined( DISTANCE ) || defined ( USE_SHADOWMAP ) || defined ( USE_TRANSMISSION ) || NUM_SPOT_LIGHT_COORDS > 0
	vec4 worldPosition = vec4( transformed, 1.0 );
	#ifdef USE_BATCHING
		worldPosition = batchingMatrix * worldPosition;
	#endif
	#ifdef USE_INSTANCING
		worldPosition = instanceMatrix * worldPosition;
	#endif
	worldPosition = modelMatrix * worldPosition;
#endif`,N4=`varying vec2 vUv;
uniform mat3 uvTransform;
void main() {
	vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	gl_Position = vec4( position.xy, 1.0, 1.0 );
}`,D4=`uniform sampler2D t2D;
uniform float backgroundIntensity;
varying vec2 vUv;
void main() {
	vec4 texColor = texture2D( t2D, vUv );
	#ifdef DECODE_VIDEO_TEXTURE
		texColor = vec4( mix( pow( texColor.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), texColor.rgb * 0.0773993808, vec3( lessThanEqual( texColor.rgb, vec3( 0.04045 ) ) ) ), texColor.w );
	#endif
	texColor.rgb *= backgroundIntensity;
	gl_FragColor = texColor;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,Z4=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,H4=`#ifdef ENVMAP_TYPE_CUBE
	uniform samplerCube envMap;
#elif defined( ENVMAP_TYPE_CUBE_UV )
	uniform sampler2D envMap;
#endif
uniform float backgroundBlurriness;
uniform float backgroundIntensity;
uniform mat3 backgroundRotation;
varying vec3 vWorldDirection;
#include <cube_uv_reflection_fragment>
void main() {
	#ifdef ENVMAP_TYPE_CUBE
		vec4 texColor = textureCube( envMap, backgroundRotation * vWorldDirection );
	#elif defined( ENVMAP_TYPE_CUBE_UV )
		vec4 texColor = textureCubeUV( envMap, backgroundRotation * vWorldDirection, backgroundBlurriness );
	#else
		vec4 texColor = vec4( 0.0, 0.0, 0.0, 1.0 );
	#endif
	texColor.rgb *= backgroundIntensity;
	gl_FragColor = texColor;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,U4=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,V4=`uniform samplerCube tCube;
uniform float tFlip;
uniform float opacity;
varying vec3 vWorldDirection;
void main() {
	vec4 texColor = textureCube( tCube, vec3( tFlip * vWorldDirection.x, vWorldDirection.yz ) );
	gl_FragColor = texColor;
	gl_FragColor.a *= opacity;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,Y4=`#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
varying vec2 vHighPrecisionZW;
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <skinbase_vertex>
	#include <morphinstance_vertex>
	#ifdef USE_DISPLACEMENTMAP
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vHighPrecisionZW = gl_Position.zw;
}`,X4=`#if DEPTH_PACKING == 3200
	uniform float opacity;
#endif
#include <common>
#include <packing>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
varying vec2 vHighPrecisionZW;
void main() {
	vec4 diffuseColor = vec4( 1.0 );
	#include <clipping_planes_fragment>
	#if DEPTH_PACKING == 3200
		diffuseColor.a = opacity;
	#endif
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <logdepthbuf_fragment>
	#ifdef USE_REVERSED_DEPTH_BUFFER
		float fragCoordZ = vHighPrecisionZW[ 0 ] / vHighPrecisionZW[ 1 ];
	#else
		float fragCoordZ = 0.5 * vHighPrecisionZW[ 0 ] / vHighPrecisionZW[ 1 ] + 0.5;
	#endif
	#if DEPTH_PACKING == 3200
		gl_FragColor = vec4( vec3( 1.0 - fragCoordZ ), opacity );
	#elif DEPTH_PACKING == 3201
		gl_FragColor = packDepthToRGBA( fragCoordZ );
	#elif DEPTH_PACKING == 3202
		gl_FragColor = vec4( packDepthToRGB( fragCoordZ ), 1.0 );
	#elif DEPTH_PACKING == 3203
		gl_FragColor = vec4( packDepthToRG( fragCoordZ ), 0.0, 1.0 );
	#endif
}`,k4=`#define DISTANCE
varying vec3 vWorldPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <skinbase_vertex>
	#include <morphinstance_vertex>
	#ifdef USE_DISPLACEMENTMAP
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <worldpos_vertex>
	#include <clipping_planes_vertex>
	vWorldPosition = worldPosition.xyz;
}`,E4=`#define DISTANCE
uniform vec3 referencePosition;
uniform float nearDistance;
uniform float farDistance;
varying vec3 vWorldPosition;
#include <common>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( 1.0 );
	#include <clipping_planes_fragment>
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	float dist = length( vWorldPosition - referencePosition );
	dist = ( dist - nearDistance ) / ( farDistance - nearDistance );
	dist = saturate( dist );
	gl_FragColor = vec4( dist, 0.0, 0.0, 1.0 );
}`,I4=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
}`,A4=`uniform sampler2D tEquirect;
varying vec3 vWorldDirection;
#include <common>
void main() {
	vec3 direction = normalize( vWorldDirection );
	vec2 sampleUV = equirectUv( direction );
	gl_FragColor = texture2D( tEquirect, sampleUV );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,O4=`uniform float scale;
attribute float lineDistance;
varying float vLineDistance;
#include <common>
#include <uv_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	vLineDistance = scale * lineDistance;
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
}`,F4=`uniform vec3 diffuse;
uniform float opacity;
uniform float dashSize;
uniform float totalSize;
varying float vLineDistance;
#include <common>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	if ( mod( vLineDistance, totalSize ) > dashSize ) {
		discard;
	}
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,M4=`#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#if defined ( USE_ENVMAP ) || defined ( USE_SKINNING )
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinbase_vertex>
		#include <skinnormal_vertex>
		#include <defaultnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <fog_vertex>
}`,L4=`uniform vec3 diffuse;
uniform float opacity;
#ifndef FLAT_SHADED
	varying vec3 vNormal;
#endif
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	#ifdef USE_LIGHTMAP
		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
		reflectedLight.indirectDiffuse += lightMapTexel.rgb * lightMapIntensity * RECIPROCAL_PI;
	#else
		reflectedLight.indirectDiffuse += vec3( 1.0 );
	#endif
	#include <aomap_fragment>
	reflectedLight.indirectDiffuse *= diffuseColor.rgb;
	vec3 outgoingLight = reflectedLight.indirectDiffuse;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,y4=`#define LAMBERT
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,S4=`#define LAMBERT
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <cube_uv_reflection_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <envmap_physical_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_lambert_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_lambert_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,w4=`#define MATCAP
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <color_pars_vertex>
#include <displacementmap_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
	vViewPosition = - mvPosition.xyz;
}`,C4=`#define MATCAP
uniform vec3 diffuse;
uniform float opacity;
uniform sampler2D matcap;
varying vec3 vViewPosition;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <normal_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	vec3 viewDir = normalize( vViewPosition );
	vec3 x = normalize( vec3( viewDir.z, 0.0, - viewDir.x ) );
	vec3 y = cross( viewDir, x );
	vec2 uv = vec2( dot( x, normal ), dot( y, normal ) ) * 0.495 + 0.5;
	#ifdef USE_MATCAP
		vec4 matcapColor = texture2D( matcap, uv );
	#else
		vec4 matcapColor = vec4( vec3( mix( 0.2, 0.8, uv.y ) ), 1.0 );
	#endif
	vec3 outgoingLight = diffuseColor.rgb * matcapColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,R4=`#define NORMAL
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	varying vec3 vViewPosition;
#endif
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	vViewPosition = - mvPosition.xyz;
#endif
}`,P4=`#define NORMAL
uniform float opacity;
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	varying vec3 vViewPosition;
#endif
#include <uv_pars_fragment>
#include <normal_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( 0.0, 0.0, 0.0, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	gl_FragColor = vec4( normalize( normal ) * 0.5 + 0.5, diffuseColor.a );
	#ifdef OPAQUE
		gl_FragColor.a = 1.0;
	#endif
}`,v4=`#define PHONG
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,f4=`#define PHONG
uniform vec3 diffuse;
uniform vec3 emissive;
uniform vec3 specular;
uniform float shininess;
uniform float opacity;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <cube_uv_reflection_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <envmap_physical_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_phong_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_phong_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + reflectedLight.directSpecular + reflectedLight.indirectSpecular + totalEmissiveRadiance;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,T4=`#define STANDARD
varying vec3 vViewPosition;
#ifdef USE_TRANSMISSION
	varying vec3 vWorldPosition;
#endif
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
#ifdef USE_TRANSMISSION
	vWorldPosition = worldPosition.xyz;
#endif
}`,h4=`#define STANDARD
#ifdef PHYSICAL
	#define IOR
	#define USE_SPECULAR
#endif
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float roughness;
uniform float metalness;
uniform float opacity;
#ifdef IOR
	uniform float ior;
#endif
#ifdef USE_SPECULAR
	uniform float specularIntensity;
	uniform vec3 specularColor;
	#ifdef USE_SPECULAR_COLORMAP
		uniform sampler2D specularColorMap;
	#endif
	#ifdef USE_SPECULAR_INTENSITYMAP
		uniform sampler2D specularIntensityMap;
	#endif
#endif
#ifdef USE_CLEARCOAT
	uniform float clearcoat;
	uniform float clearcoatRoughness;
#endif
#ifdef USE_DISPERSION
	uniform float dispersion;
#endif
#ifdef USE_IRIDESCENCE
	uniform float iridescence;
	uniform float iridescenceIOR;
	uniform float iridescenceThicknessMinimum;
	uniform float iridescenceThicknessMaximum;
#endif
#ifdef USE_SHEEN
	uniform vec3 sheenColor;
	uniform float sheenRoughness;
	#ifdef USE_SHEEN_COLORMAP
		uniform sampler2D sheenColorMap;
	#endif
	#ifdef USE_SHEEN_ROUGHNESSMAP
		uniform sampler2D sheenRoughnessMap;
	#endif
#endif
#ifdef USE_ANISOTROPY
	uniform vec2 anisotropyVector;
	#ifdef USE_ANISOTROPYMAP
		uniform sampler2D anisotropyMap;
	#endif
#endif
varying vec3 vViewPosition;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <iridescence_fragment>
#include <cube_uv_reflection_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_physical_pars_fragment>
#include <fog_pars_fragment>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_physical_pars_fragment>
#include <transmission_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <clearcoat_pars_fragment>
#include <iridescence_pars_fragment>
#include <roughnessmap_pars_fragment>
#include <metalnessmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <roughnessmap_fragment>
	#include <metalnessmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <clearcoat_normal_fragment_begin>
	#include <clearcoat_normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_physical_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 totalDiffuse = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse;
	vec3 totalSpecular = reflectedLight.directSpecular + reflectedLight.indirectSpecular;
	#include <transmission_fragment>
	vec3 outgoingLight = totalDiffuse + totalSpecular + totalEmissiveRadiance;
	#ifdef USE_SHEEN
 
		outgoingLight = outgoingLight + sheenSpecularDirect + sheenSpecularIndirect;
 
 	#endif
	#ifdef USE_CLEARCOAT
		float dotNVcc = saturate( dot( geometryClearcoatNormal, geometryViewDir ) );
		vec3 Fcc = F_Schlick( material.clearcoatF0, material.clearcoatF90, dotNVcc );
		outgoingLight = outgoingLight * ( 1.0 - material.clearcoat * Fcc ) + ( clearcoatSpecularDirect + clearcoatSpecularIndirect ) * material.clearcoat;
	#endif
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,x4=`#define TOON
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,j4=`#define TOON
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <gradientmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_toon_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_toon_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,_4=`uniform float size;
uniform float scale;
#include <common>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
#ifdef USE_POINTS_UV
	varying vec2 vUv;
	uniform mat3 uvTransform;
#endif
void main() {
	#ifdef USE_POINTS_UV
		vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	#endif
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <project_vertex>
	gl_PointSize = size;
	#ifdef USE_SIZEATTENUATION
		bool isPerspective = isPerspectiveMatrix( projectionMatrix );
		if ( isPerspective ) gl_PointSize *= ( scale / - mvPosition.z );
	#endif
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <worldpos_vertex>
	#include <fog_vertex>
}`,b4=`uniform vec3 diffuse;
uniform float opacity;
#include <common>
#include <color_pars_fragment>
#include <map_particle_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_particle_fragment>
	#include <color_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,d4=`#include <common>
#include <batching_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <shadowmap_pars_vertex>
void main() {
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,p4=`uniform vec3 color;
uniform float opacity;
#include <common>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <logdepthbuf_pars_fragment>
#include <shadowmap_pars_fragment>
#include <shadowmask_pars_fragment>
void main() {
	#include <logdepthbuf_fragment>
	gl_FragColor = vec4( color, opacity * ( 1.0 - getShadowMask() ) );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,u4=`uniform float rotation;
uniform vec2 center;
#include <common>
#include <uv_pars_vertex>
#include <fog_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	vec4 mvPosition = modelViewMatrix[ 3 ];
	vec2 scale = vec2( length( modelMatrix[ 0 ].xyz ), length( modelMatrix[ 1 ].xyz ) );
	#ifndef USE_SIZEATTENUATION
		bool isPerspective = isPerspectiveMatrix( projectionMatrix );
		if ( isPerspective ) scale *= - mvPosition.z;
	#endif
	vec2 alignedPosition = ( position.xy - ( center - vec2( 0.5 ) ) ) * scale;
	vec2 rotatedPosition;
	rotatedPosition.x = cos( rotation ) * alignedPosition.x - sin( rotation ) * alignedPosition.y;
	rotatedPosition.y = sin( rotation ) * alignedPosition.x + cos( rotation ) * alignedPosition.y;
	mvPosition.xy += rotatedPosition;
	gl_Position = projectionMatrix * mvPosition;
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
}`,g4=`uniform vec3 diffuse;
uniform float opacity;
#include <common>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
}`,az={alphahash_fragment:N3,alphahash_pars_fragment:D3,alphamap_fragment:Z3,alphamap_pars_fragment:H3,alphatest_fragment:U3,alphatest_pars_fragment:V3,aomap_fragment:Y3,aomap_pars_fragment:X3,batching_pars_vertex:k3,batching_vertex:E3,begin_vertex:I3,beginnormal_vertex:A3,bsdfs:O3,iridescence_fragment:F3,bumpmap_pars_fragment:M3,clipping_planes_fragment:L3,clipping_planes_pars_fragment:y3,clipping_planes_pars_vertex:S3,clipping_planes_vertex:w3,color_fragment:C3,color_pars_fragment:R3,color_pars_vertex:P3,color_vertex:v3,common:f3,cube_uv_reflection_fragment:T3,defaultnormal_vertex:h3,displacementmap_pars_vertex:x3,displacementmap_vertex:j3,emissivemap_fragment:_3,emissivemap_pars_fragment:b3,colorspace_fragment:d3,colorspace_pars_fragment:p3,envmap_fragment:u3,envmap_common_pars_fragment:g3,envmap_pars_fragment:l3,envmap_pars_vertex:m3,envmap_physical_pars_fragment:Jq,envmap_vertex:c3,fog_vertex:n3,fog_pars_vertex:o3,fog_fragment:s3,fog_pars_fragment:i3,gradientmap_pars_fragment:a3,lightmap_pars_fragment:t3,lights_lambert_fragment:r3,lights_lambert_pars_fragment:e3,lights_pars_begin:zq,lights_toon_fragment:Qq,lights_toon_pars_fragment:$q,lights_phong_fragment:Kq,lights_phong_pars_fragment:Wq,lights_physical_fragment:qq,lights_physical_pars_fragment:Bq,lights_fragment_begin:Gq,lights_fragment_maps:Nq,lights_fragment_end:Dq,lightprobes_pars_fragment:Zq,logdepthbuf_fragment:Hq,logdepthbuf_pars_fragment:Uq,logdepthbuf_pars_vertex:Vq,logdepthbuf_vertex:Yq,map_fragment:Xq,map_pars_fragment:kq,map_particle_fragment:Eq,map_particle_pars_fragment:Iq,metalnessmap_fragment:Aq,metalnessmap_pars_fragment:Oq,morphinstance_vertex:Fq,morphcolor_vertex:Mq,morphnormal_vertex:Lq,morphtarget_pars_vertex:yq,morphtarget_vertex:Sq,normal_fragment_begin:wq,normal_fragment_maps:Cq,normal_pars_fragment:Rq,normal_pars_vertex:Pq,normal_vertex:vq,normalmap_pars_fragment:fq,clearcoat_normal_fragment_begin:Tq,clearcoat_normal_fragment_maps:hq,clearcoat_pars_fragment:xq,iridescence_pars_fragment:jq,opaque_fragment:_q,packing:bq,premultiplied_alpha_fragment:dq,project_vertex:pq,dithering_fragment:uq,dithering_pars_fragment:gq,roughnessmap_fragment:lq,roughnessmap_pars_fragment:mq,shadowmap_pars_fragment:cq,shadowmap_pars_vertex:nq,shadowmap_vertex:oq,shadowmask_pars_fragment:sq,skinbase_vertex:iq,skinning_pars_vertex:aq,skinning_vertex:tq,skinnormal_vertex:rq,specularmap_fragment:eq,specularmap_pars_fragment:z4,tonemapping_fragment:J4,tonemapping_pars_fragment:Q4,transmission_fragment:$4,transmission_pars_fragment:K4,uv_pars_fragment:W4,uv_pars_vertex:q4,uv_vertex:B4,worldpos_vertex:G4,background_vert:N4,background_frag:D4,backgroundCube_vert:Z4,backgroundCube_frag:H4,cube_vert:U4,cube_frag:V4,depth_vert:Y4,depth_frag:X4,distance_vert:k4,distance_frag:E4,equirect_vert:I4,equirect_frag:A4,linedashed_vert:O4,linedashed_frag:F4,meshbasic_vert:M4,meshbasic_frag:L4,meshlambert_vert:y4,meshlambert_frag:S4,meshmatcap_vert:w4,meshmatcap_frag:C4,meshnormal_vert:R4,meshnormal_frag:P4,meshphong_vert:v4,meshphong_frag:f4,meshphysical_vert:T4,meshphysical_frag:h4,meshtoon_vert:x4,meshtoon_frag:j4,points_vert:_4,points_frag:b4,shadow_vert:d4,shadow_frag:p4,sprite_vert:u4,sprite_frag:g4},Vz={common:{diffuse:{value:new Fz(16777215)},opacity:{value:1},map:{value:null},mapTransform:{value:new lz},alphaMap:{value:null},alphaMapTransform:{value:new lz},alphaTest:{value:0}},specularmap:{specularMap:{value:null},specularMapTransform:{value:new lz}},envmap:{envMap:{value:null},envMapRotation:{value:new lz},reflectivity:{value:1},ior:{value:1.5},refractionRatio:{value:0.98},dfgLUT:{value:null}},aomap:{aoMap:{value:null},aoMapIntensity:{value:1},aoMapTransform:{value:new lz}},lightmap:{lightMap:{value:null},lightMapIntensity:{value:1},lightMapTransform:{value:new lz}},bumpmap:{bumpMap:{value:null},bumpMapTransform:{value:new lz},bumpScale:{value:1}},normalmap:{normalMap:{value:null},normalMapTransform:{value:new lz},normalScale:{value:new a(1,1)}},displacementmap:{displacementMap:{value:null},displacementMapTransform:{value:new lz},displacementScale:{value:1},displacementBias:{value:0}},emissivemap:{emissiveMap:{value:null},emissiveMapTransform:{value:new lz}},metalnessmap:{metalnessMap:{value:null},metalnessMapTransform:{value:new lz}},roughnessmap:{roughnessMap:{value:null},roughnessMapTransform:{value:new lz}},gradientmap:{gradientMap:{value:null}},fog:{fogDensity:{value:0.00025},fogNear:{value:1},fogFar:{value:2000},fogColor:{value:new Fz(16777215)}},lights:{ambientLightColor:{value:[]},lightProbe:{value:[]},directionalLights:{value:[],properties:{direction:{},color:{}}},directionalLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},directionalShadowMatrix:{value:[]},spotLights:{value:[],properties:{color:{},position:{},direction:{},distance:{},coneCos:{},penumbraCos:{},decay:{}}},spotLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},spotLightMap:{value:[]},spotLightMatrix:{value:[]},pointLights:{value:[],properties:{color:{},position:{},decay:{},distance:{}}},pointLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{},shadowCameraNear:{},shadowCameraFar:{}}},pointShadowMatrix:{value:[]},hemisphereLights:{value:[],properties:{direction:{},skyColor:{},groundColor:{}}},rectAreaLights:{value:[],properties:{color:{},position:{},width:{},height:{}}},ltc_1:{value:null},ltc_2:{value:null},probesSH:{value:null},probesMin:{value:new R},probesMax:{value:new R},probesResolution:{value:new R}},points:{diffuse:{value:new Fz(16777215)},opacity:{value:1},size:{value:1},scale:{value:1},map:{value:null},alphaMap:{value:null},alphaMapTransform:{value:new lz},alphaTest:{value:0},uvTransform:{value:new lz}},sprite:{diffuse:{value:new Fz(16777215)},opacity:{value:1},center:{value:new a(0.5,0.5)},rotation:{value:0},map:{value:null},mapTransform:{value:new lz},alphaMap:{value:null},alphaMapTransform:{value:new lz},alphaTest:{value:0}}},BQ={basic:{uniforms:pJ([Vz.common,Vz.specularmap,Vz.envmap,Vz.aomap,Vz.lightmap,Vz.fog]),vertexShader:az.meshbasic_vert,fragmentShader:az.meshbasic_frag},lambert:{uniforms:pJ([Vz.common,Vz.specularmap,Vz.envmap,Vz.aomap,Vz.lightmap,Vz.emissivemap,Vz.bumpmap,Vz.normalmap,Vz.displacementmap,Vz.fog,Vz.lights,{emissive:{value:new Fz(0)},envMapIntensity:{value:1}}]),vertexShader:az.meshlambert_vert,fragmentShader:az.meshlambert_frag},phong:{uniforms:pJ([Vz.common,Vz.specularmap,Vz.envmap,Vz.aomap,Vz.lightmap,Vz.emissivemap,Vz.bumpmap,Vz.normalmap,Vz.displacementmap,Vz.fog,Vz.lights,{emissive:{value:new Fz(0)},specular:{value:new Fz(1118481)},shininess:{value:30},envMapIntensity:{value:1}}]),vertexShader:az.meshphong_vert,fragmentShader:az.meshphong_frag},standard:{uniforms:pJ([Vz.common,Vz.envmap,Vz.aomap,Vz.lightmap,Vz.emissivemap,Vz.bumpmap,Vz.normalmap,Vz.displacementmap,Vz.roughnessmap,Vz.metalnessmap,Vz.fog,Vz.lights,{emissive:{value:new Fz(0)},roughness:{value:1},metalness:{value:0},envMapIntensity:{value:1}}]),vertexShader:az.meshphysical_vert,fragmentShader:az.meshphysical_frag},toon:{uniforms:pJ([Vz.common,Vz.aomap,Vz.lightmap,Vz.emissivemap,Vz.bumpmap,Vz.normalmap,Vz.displacementmap,Vz.gradientmap,Vz.fog,Vz.lights,{emissive:{value:new Fz(0)}}]),vertexShader:az.meshtoon_vert,fragmentShader:az.meshtoon_frag},matcap:{uniforms:pJ([Vz.common,Vz.bumpmap,Vz.normalmap,Vz.displacementmap,Vz.fog,{matcap:{value:null}}]),vertexShader:az.meshmatcap_vert,fragmentShader:az.meshmatcap_frag},points:{uniforms:pJ([Vz.points,Vz.fog]),vertexShader:az.points_vert,fragmentShader:az.points_frag},dashed:{uniforms:pJ([Vz.common,Vz.fog,{scale:{value:1},dashSize:{value:1},totalSize:{value:2}}]),vertexShader:az.linedashed_vert,fragmentShader:az.linedashed_frag},depth:{uniforms:pJ([Vz.common,Vz.displacementmap]),vertexShader:az.depth_vert,fragmentShader:az.depth_frag},normal:{uniforms:pJ([Vz.common,Vz.bumpmap,Vz.normalmap,Vz.displacementmap,{opacity:{value:1}}]),vertexShader:az.meshnormal_vert,fragmentShader:az.meshnormal_frag},sprite:{uniforms:pJ([Vz.sprite,Vz.fog]),vertexShader:az.sprite_vert,fragmentShader:az.sprite_frag},background:{uniforms:{uvTransform:{value:new lz},t2D:{value:null},backgroundIntensity:{value:1}},vertexShader:az.background_vert,fragmentShader:az.background_frag},backgroundCube:{uniforms:{envMap:{value:null},backgroundBlurriness:{value:0},backgroundIntensity:{value:1},backgroundRotation:{value:new lz}},vertexShader:az.backgroundCube_vert,fragmentShader:az.backgroundCube_frag},cube:{uniforms:{tCube:{value:null},tFlip:{value:-1},opacity:{value:1}},vertexShader:az.cube_vert,fragmentShader:az.cube_frag},equirect:{uniforms:{tEquirect:{value:null}},vertexShader:az.equirect_vert,fragmentShader:az.equirect_frag},distance:{uniforms:pJ([Vz.common,Vz.displacementmap,{referencePosition:{value:new R},nearDistance:{value:1},farDistance:{value:1000}}]),vertexShader:az.distance_vert,fragmentShader:az.distance_frag},shadow:{uniforms:pJ([Vz.lights,Vz.fog,{color:{value:new Fz(0)},opacity:{value:1}}]),vertexShader:az.shadow_vert,fragmentShader:az.shadow_frag}};BQ.physical={uniforms:pJ([BQ.standard.uniforms,{clearcoat:{value:0},clearcoatMap:{value:null},clearcoatMapTransform:{value:new lz},clearcoatNormalMap:{value:null},clearcoatNormalMapTransform:{value:new lz},clearcoatNormalScale:{value:new a(1,1)},clearcoatRoughness:{value:0},clearcoatRoughnessMap:{value:null},clearcoatRoughnessMapTransform:{value:new lz},dispersion:{value:0},iridescence:{value:0},iridescenceMap:{value:null},iridescenceMapTransform:{value:new lz},iridescenceIOR:{value:1.3},iridescenceThicknessMinimum:{value:100},iridescenceThicknessMaximum:{value:400},iridescenceThicknessMap:{value:null},iridescenceThicknessMapTransform:{value:new lz},sheen:{value:0},sheenColor:{value:new Fz(0)},sheenColorMap:{value:null},sheenColorMapTransform:{value:new lz},sheenRoughness:{value:1},sheenRoughnessMap:{value:null},sheenRoughnessMapTransform:{value:new lz},transmission:{value:0},transmissionMap:{value:null},transmissionMapTransform:{value:new lz},transmissionSamplerSize:{value:new a},transmissionSamplerMap:{value:null},thickness:{value:0},thicknessMap:{value:null},thicknessMapTransform:{value:new lz},attenuationDistance:{value:0},attenuationColor:{value:new Fz(0)},specularColor:{value:new Fz(1,1,1)},specularColorMap:{value:null},specularColorMapTransform:{value:new lz},specularIntensity:{value:1},specularIntensityMap:{value:null},specularIntensityMapTransform:{value:new lz},anisotropyVector:{value:new a},anisotropyMap:{value:null},anisotropyMapTransform:{value:new lz}}]),vertexShader:az.meshphysical_vert,fragmentShader:az.meshphysical_frag};var v2={r:0,b:0,g:0},l4=new pz,j$=new lz;j$.set(-1,0,0,0,1,0,0,0,1);function m4(z,J,Q,$,K,W){let q=new Fz(0),B=K===!0?0:1,G,N,Z=null,H=0,D=null;function U(L){let O=L.isScene===!0?L.background:null;if(O&&O.isTexture){let I=L.backgroundBlurriness>0;O=J.get(O,I)}return O}function X(L){let O=!1,I=U(L);if(I===null)Y(q,B);else if(I&&I.isColor)Y(I,1),O=!0;let S=z.xr.getEnvironmentBlendMode();if(S==="additive")Q.buffers.color.setClear(0,0,0,1,W);else if(S==="alpha-blend")Q.buffers.color.setClear(0,0,0,0,W);if(z.autoClear||O)Q.buffers.depth.setTest(!0),Q.buffers.depth.setMask(!0),Q.buffers.color.setMask(!0),z.clear(z.autoClearColor,z.autoClearDepth,z.autoClearStencil)}function k(L,O){let I=U(O);if(I&&(I.isCubeTexture||I.mapping===306)){if(N===void 0)N=new LJ(new X0(1,1,1),new rJ({name:"BackgroundCubeMaterial",uniforms:n0(BQ.backgroundCube.uniforms),vertexShader:BQ.backgroundCube.vertexShader,fragmentShader:BQ.backgroundCube.fragmentShader,side:1,depthTest:!1,depthWrite:!1,fog:!1,allowOverride:!1})),N.geometry.deleteAttribute("normal"),N.geometry.deleteAttribute("uv"),N.onBeforeRender=function(S,w,C){this.matrixWorld.copyPosition(C.matrixWorld)},Object.defineProperty(N.material,"envMap",{get:function(){return this.uniforms.envMap.value}}),$.update(N);if(N.material.uniforms.envMap.value=I,N.material.uniforms.backgroundBlurriness.value=O.backgroundBlurriness,N.material.uniforms.backgroundIntensity.value=O.backgroundIntensity,N.material.uniforms.backgroundRotation.value.setFromMatrix4(l4.makeRotationFromEuler(O.backgroundRotation)).transpose(),I.isCubeTexture&&I.isRenderTargetTexture===!1)N.material.uniforms.backgroundRotation.value.premultiply(j$);if(N.material.toneMapped=zJ.getTransfer(I.colorSpace)!=="srgb",Z!==I||H!==I.version||D!==z.toneMapping)N.material.needsUpdate=!0,Z=I,H=I.version,D=z.toneMapping;N.layers.enableAll(),L.unshift(N,N.geometry,N.material,0,0,null)}else if(I&&I.isTexture){if(G===void 0)G=new LJ(new t0(2,2),new rJ({name:"BackgroundMaterial",uniforms:n0(BQ.background.uniforms),vertexShader:BQ.background.vertexShader,fragmentShader:BQ.background.fragmentShader,side:0,depthTest:!1,depthWrite:!1,fog:!1,allowOverride:!1})),G.geometry.deleteAttribute("normal"),Object.defineProperty(G.material,"map",{get:function(){return this.uniforms.t2D.value}}),$.update(G);if(G.material.uniforms.t2D.value=I,G.material.uniforms.backgroundIntensity.value=O.backgroundIntensity,G.material.toneMapped=zJ.getTransfer(I.colorSpace)!=="srgb",I.matrixAutoUpdate===!0)I.updateMatrix();if(G.material.uniforms.uvTransform.value.copy(I.matrix),Z!==I||H!==I.version||D!==z.toneMapping)G.material.needsUpdate=!0,Z=I,H=I.version,D=z.toneMapping;G.layers.enableAll(),L.unshift(G,G.geometry,G.material,0,0,null)}}function Y(L,O){L.getRGB(v2,b9(z)),Q.buffers.color.setClear(v2.r,v2.g,v2.b,O,W)}function V(){if(N!==void 0)N.geometry.dispose(),N.material.dispose(),N=void 0;if(G!==void 0)G.geometry.dispose(),G.material.dispose(),G=void 0}return{getClearColor:function(){return q},setClearColor:function(L,O=1){q.set(L),B=O,Y(q,B)},getClearAlpha:function(){return B},setClearAlpha:function(L){B=L,Y(q,B)},render:X,addToRenderList:k,dispose:V}}function c4(z,J){let Q=z.getParameter(z.MAX_VERTEX_ATTRIBS),$={},K=D(null),W=K,q=!1;function B(P,p,n,j,m){let l=!1,_=H(P,j,n,p);if(W!==_)W=_,N(W.object);if(l=U(P,j,n,m),l)X(P,j,n,m);if(m!==null)J.update(m,z.ELEMENT_ARRAY_BUFFER);if(l||q){if(q=!1,I(P,p,n,j),m!==null)z.bindBuffer(z.ELEMENT_ARRAY_BUFFER,J.get(m).buffer)}}function G(){return z.createVertexArray()}function N(P){return z.bindVertexArray(P)}function Z(P){return z.deleteVertexArray(P)}function H(P,p,n,j){let m=j.wireframe===!0,l=$[p.id];if(l===void 0)l={},$[p.id]=l;let _=P.isInstancedMesh===!0?P.id:0,t=l[_];if(t===void 0)t={},l[_]=t;let $z=t[n.id];if($z===void 0)$z={},t[n.id]=$z;let qz=$z[m];if(qz===void 0)qz=D(G()),$z[m]=qz;return qz}function D(P){let p=[],n=[],j=[];for(let m=0;m<Q;m++)p[m]=0,n[m]=0,j[m]=0;return{geometry:null,program:null,wireframe:!1,newAttributes:p,enabledAttributes:n,attributeDivisors:j,object:P,attributes:{},index:null}}function U(P,p,n,j){let m=W.attributes,l=p.attributes,_=0,t=n.getAttributes();for(let $z in t)if(t[$z].location>=0){let Cz=m[$z],Az=l[$z];if(Az===void 0){if($z==="instanceMatrix"&&P.instanceMatrix)Az=P.instanceMatrix;if($z==="instanceColor"&&P.instanceColor)Az=P.instanceColor}if(Cz===void 0)return!0;if(Cz.attribute!==Az)return!0;if(Az&&Cz.data!==Az.data)return!0;_++}if(W.attributesNum!==_)return!0;if(W.index!==j)return!0;return!1}function X(P,p,n,j){let m={},l=p.attributes,_=0,t=n.getAttributes();for(let $z in t)if(t[$z].location>=0){let Cz=l[$z];if(Cz===void 0){if($z==="instanceMatrix"&&P.instanceMatrix)Cz=P.instanceMatrix;if($z==="instanceColor"&&P.instanceColor)Cz=P.instanceColor}let Az={};if(Az.attribute=Cz,Cz&&Cz.data)Az.data=Cz.data;m[$z]=Az,_++}W.attributes=m,W.attributesNum=_,W.index=j}function k(){let P=W.newAttributes;for(let p=0,n=P.length;p<n;p++)P[p]=0}function Y(P){V(P,0)}function V(P,p){let{newAttributes:n,enabledAttributes:j,attributeDivisors:m}=W;if(n[P]=1,j[P]===0)z.enableVertexAttribArray(P),j[P]=1;if(m[P]!==p)z.vertexAttribDivisor(P,p),m[P]=p}function L(){let{newAttributes:P,enabledAttributes:p}=W;for(let n=0,j=p.length;n<j;n++)if(p[n]!==P[n])z.disableVertexAttribArray(n),p[n]=0}function O(P,p,n,j,m,l,_){if(_===!0)z.vertexAttribIPointer(P,p,n,m,l);else z.vertexAttribPointer(P,p,n,j,m,l)}function I(P,p,n,j){k();let m=j.attributes,l=n.getAttributes(),_=p.defaultAttributeValues;for(let t in l){let $z=l[t];if($z.location>=0){let qz=m[t];if(qz===void 0){if(t==="instanceMatrix"&&P.instanceMatrix)qz=P.instanceMatrix;if(t==="instanceColor"&&P.instanceColor)qz=P.instanceColor}if(qz!==void 0){let{normalized:Cz,itemSize:Az}=qz,NJ=J.get(qz);if(NJ===void 0)continue;let{buffer:qJ,type:s,bytesPerElement:Gz}=NJ,Oz=s===z.INT||s===z.UNSIGNED_INT||qz.gpuType===1013;if(qz.isInterleavedBufferAttribute){let Zz=qz.data,jz=Zz.stride,JJ=qz.offset;if(Zz.isInstancedInterleavedBuffer){for(let uz=0;uz<$z.locationSize;uz++)V($z.location+uz,Zz.meshPerAttribute);if(P.isInstancedMesh!==!0&&j._maxInstanceCount===void 0)j._maxInstanceCount=Zz.meshPerAttribute*Zz.count}else for(let uz=0;uz<$z.locationSize;uz++)Y($z.location+uz);z.bindBuffer(z.ARRAY_BUFFER,qJ);for(let uz=0;uz<$z.locationSize;uz++)O($z.location+uz,Az/$z.locationSize,s,Cz,jz*Gz,(JJ+Az/$z.locationSize*uz)*Gz,Oz)}else{if(qz.isInstancedBufferAttribute){for(let Zz=0;Zz<$z.locationSize;Zz++)V($z.location+Zz,qz.meshPerAttribute);if(P.isInstancedMesh!==!0&&j._maxInstanceCount===void 0)j._maxInstanceCount=qz.meshPerAttribute*qz.count}else for(let Zz=0;Zz<$z.locationSize;Zz++)Y($z.location+Zz);z.bindBuffer(z.ARRAY_BUFFER,qJ);for(let Zz=0;Zz<$z.locationSize;Zz++)O($z.location+Zz,Az/$z.locationSize,s,Cz,Az*Gz,Az/$z.locationSize*Zz*Gz,Oz)}}else if(_!==void 0){let Cz=_[t];if(Cz!==void 0)switch(Cz.length){case 2:z.vertexAttrib2fv($z.location,Cz);break;case 3:z.vertexAttrib3fv($z.location,Cz);break;case 4:z.vertexAttrib4fv($z.location,Cz);break;default:z.vertexAttrib1fv($z.location,Cz)}}}}L()}function S(){F();for(let P in $){let p=$[P];for(let n in p){let j=p[n];for(let m in j){let l=j[m];for(let _ in l)Z(l[_].object),delete l[_];delete j[m]}}delete $[P]}}function w(P){if($[P.id]===void 0)return;let p=$[P.id];for(let n in p){let j=p[n];for(let m in j){let l=j[m];for(let _ in l)Z(l[_].object),delete l[_];delete j[m]}}delete $[P.id]}function C(P){for(let p in $){let n=$[p];for(let j in n){let m=n[j];if(m[P.id]===void 0)continue;let l=m[P.id];for(let _ in l)Z(l[_].object),delete l[_];delete m[P.id]}}}function E(P){for(let p in $){let n=$[p],j=P.isInstancedMesh===!0?P.id:0,m=n[j];if(m===void 0)continue;for(let l in m){let _=m[l];for(let t in _)Z(_[t].object),delete _[t];delete m[l]}if(delete n[j],Object.keys(n).length===0)delete $[p]}}function F(){if(x(),q=!0,W===K)return;W=K,N(W.object)}function x(){K.geometry=null,K.program=null,K.wireframe=!1}return{setup:B,reset:F,resetDefaultState:x,dispose:S,releaseStatesOfGeometry:w,releaseStatesOfObject:E,releaseStatesOfProgram:C,initAttributes:k,enableAttribute:Y,disableUnusedAttributes:L}}function n4(z,J,Q){let $;function K(G){$=G}function W(G,N){z.drawArrays($,G,N),Q.update(N,$,1)}function q(G,N,Z){if(Z===0)return;z.drawArraysInstanced($,G,N,Z),Q.update(N,$,Z)}function B(G,N,Z){if(Z===0)return;J.get("WEBGL_multi_draw").multiDrawArraysWEBGL($,G,0,N,0,Z);let D=0;for(let U=0;U<Z;U++)D+=N[U];Q.update(D,$,1)}this.setMode=K,this.render=W,this.renderInstances=q,this.renderMultiDraw=B}function o4(z,J,Q,$){let K;function W(){if(K!==void 0)return K;if(J.has("EXT_texture_filter_anisotropic")===!0){let C=J.get("EXT_texture_filter_anisotropic");K=z.getParameter(C.MAX_TEXTURE_MAX_ANISOTROPY_EXT)}else K=0;return K}function q(C){if(C!==1023&&$.convert(C)!==z.getParameter(z.IMPLEMENTATION_COLOR_READ_FORMAT))return!1;return!0}function B(C){let E=C===1016&&(J.has("EXT_color_buffer_half_float")||J.has("EXT_color_buffer_float"));if(C!==1009&&$.convert(C)!==z.getParameter(z.IMPLEMENTATION_COLOR_READ_TYPE)&&C!==1015&&!E)return!1;return!0}function G(C){if(C==="highp"){if(z.getShaderPrecisionFormat(z.VERTEX_SHADER,z.HIGH_FLOAT).precision>0&&z.getShaderPrecisionFormat(z.FRAGMENT_SHADER,z.HIGH_FLOAT).precision>0)return"highp";C="mediump"}if(C==="mediump"){if(z.getShaderPrecisionFormat(z.VERTEX_SHADER,z.MEDIUM_FLOAT).precision>0&&z.getShaderPrecisionFormat(z.FRAGMENT_SHADER,z.MEDIUM_FLOAT).precision>0)return"mediump"}return"lowp"}let N=Q.precision!==void 0?Q.precision:"highp",Z=G(N);if(Z!==N)Bz("WebGLRenderer:",N,"not supported, using",Z,"instead."),N=Z;let H=Q.logarithmicDepthBuffer===!0,D=Q.reversedDepthBuffer===!0&&J.has("EXT_clip_control");if(Q.reversedDepthBuffer===!0&&D===!1)Bz("WebGLRenderer: Unable to use reversed depth buffer due to missing EXT_clip_control extension. Fallback to default depth buffer.");let U=z.getParameter(z.MAX_TEXTURE_IMAGE_UNITS),X=z.getParameter(z.MAX_VERTEX_TEXTURE_IMAGE_UNITS),k=z.getParameter(z.MAX_TEXTURE_SIZE),Y=z.getParameter(z.MAX_CUBE_MAP_TEXTURE_SIZE),V=z.getParameter(z.MAX_VERTEX_ATTRIBS),L=z.getParameter(z.MAX_VERTEX_UNIFORM_VECTORS),O=z.getParameter(z.MAX_VARYING_VECTORS),I=z.getParameter(z.MAX_FRAGMENT_UNIFORM_VECTORS),S=z.getParameter(z.MAX_SAMPLES),w=z.getParameter(z.SAMPLES);return{isWebGL2:!0,getMaxAnisotropy:W,getMaxPrecision:G,textureFormatReadable:q,textureTypeReadable:B,precision:N,logarithmicDepthBuffer:H,reversedDepthBuffer:D,maxTextures:U,maxVertexTextures:X,maxTextureSize:k,maxCubemapSize:Y,maxAttributes:V,maxVertexUniforms:L,maxVaryings:O,maxFragmentUniforms:I,maxSamples:S,samples:w}}function s4(z){let J=this,Q=null,$=0,K=!1,W=!1,q=new LQ,B=new lz,G={value:null,needsUpdate:!1};this.uniform=G,this.numPlanes=0,this.numIntersection=0,this.init=function(H,D){let U=H.length!==0||D||$!==0||K;return K=D,$=H.length,U},this.beginShadows=function(){W=!0,Z(null)},this.endShadows=function(){W=!1},this.setGlobalState=function(H,D){Q=Z(H,D,0)},this.setState=function(H,D,U){let{clippingPlanes:X,clipIntersection:k,clipShadows:Y}=H,V=z.get(H);if(!K||X===null||X.length===0||W&&!Y)if(W)Z(null);else N();else{let L=W?0:$,O=L*4,I=V.clippingState||null;G.value=I,I=Z(X,D,O,U);for(let S=0;S!==O;++S)I[S]=Q[S];V.clippingState=I,this.numIntersection=k?this.numPlanes:0,this.numPlanes+=L}};function N(){if(G.value!==Q)G.value=Q,G.needsUpdate=$>0;J.numPlanes=$,J.numIntersection=0}function Z(H,D,U,X){let k=H!==null?H.length:0,Y=null;if(k!==0){if(Y=G.value,X!==!0||Y===null){let V=U+k*4,L=D.matrixWorldInverse;if(B.getNormalMatrix(L),Y===null||Y.length<V)Y=new Float32Array(V);for(let O=0,I=U;O!==k;++O,I+=4)q.copy(H[O]).applyMatrix4(L,B),q.normal.toArray(Y,I),Y[I+3]=q.constant}G.value=Y,G.needsUpdate=!0}return J.numPlanes=k,J.numIntersection=0,Y}}var uQ=4,m8=[0.125,0.215,0.35,0.446,0.526,0.582],G0=20,i4=256,H1=new r0,c8=new Fz,U6=null,V6=0,Y6=0,X6=!1,a4=new R;class _2{constructor(z){this._renderer=z,this._pingPongRenderTarget=null,this._lodMax=0,this._cubeSize=0,this._sizeLods=[],this._sigmas=[],this._lodMeshes=[],this._backgroundBox=null,this._cubemapMaterial=null,this._equirectMaterial=null,this._blurMaterial=null,this._ggxMaterial=null}fromScene(z,J=0,Q=0.1,$=100,K={}){let{size:W=256,position:q=a4}=K;U6=this._renderer.getRenderTarget(),V6=this._renderer.getActiveCubeFace(),Y6=this._renderer.getActiveMipmapLevel(),X6=this._renderer.xr.enabled,this._renderer.xr.enabled=!1,this._setSize(W);let B=this._allocateTargets();if(B.depthBuffer=!0,this._sceneToCubeUV(z,Q,$,B,q),J>0)this._blur(B,0,0,J);return this._applyPMREM(B),this._cleanup(B),B}fromEquirectangular(z,J=null){return this._fromTexture(z,J)}fromCubemap(z,J=null){return this._fromTexture(z,J)}compileCubemapShader(){if(this._cubemapMaterial===null)this._cubemapMaterial=s8(),this._compileMaterial(this._cubemapMaterial)}compileEquirectangularShader(){if(this._equirectMaterial===null)this._equirectMaterial=o8(),this._compileMaterial(this._equirectMaterial)}dispose(){if(this._dispose(),this._cubemapMaterial!==null)this._cubemapMaterial.dispose();if(this._equirectMaterial!==null)this._equirectMaterial.dispose();if(this._backgroundBox!==null)this._backgroundBox.geometry.dispose(),this._backgroundBox.material.dispose()}_setSize(z){this._lodMax=Math.floor(Math.log2(z)),this._cubeSize=Math.pow(2,this._lodMax)}_dispose(){if(this._blurMaterial!==null)this._blurMaterial.dispose();if(this._ggxMaterial!==null)this._ggxMaterial.dispose();if(this._pingPongRenderTarget!==null)this._pingPongRenderTarget.dispose();for(let z=0;z<this._lodMeshes.length;z++)this._lodMeshes[z].geometry.dispose()}_cleanup(z){this._renderer.setRenderTarget(U6,V6,Y6),this._renderer.xr.enabled=X6,z.scissorTest=!1,p0(z,0,0,z.width,z.height)}_fromTexture(z,J){if(z.mapping===301||z.mapping===302)this._setSize(z.image.length===0?16:z.image[0].width||z.image[0].image.width);else this._setSize(z.image.width/4);U6=this._renderer.getRenderTarget(),V6=this._renderer.getActiveCubeFace(),Y6=this._renderer.getActiveMipmapLevel(),X6=this._renderer.xr.enabled,this._renderer.xr.enabled=!1;let Q=J||this._allocateTargets();return this._textureToCubeUV(z,Q),this._applyPMREM(Q),this._cleanup(Q),Q}_allocateTargets(){let z=3*Math.max(this._cubeSize,112),J=4*this._cubeSize,Q={magFilter:1006,minFilter:1006,generateMipmaps:!1,type:1016,format:1023,colorSpace:"srgb-linear",depthBuffer:!1},$=n8(z,J,Q);if(this._pingPongRenderTarget===null||this._pingPongRenderTarget.width!==z||this._pingPongRenderTarget.height!==J){if(this._pingPongRenderTarget!==null)this._dispose();this._pingPongRenderTarget=n8(z,J,Q);let{_lodMax:K}=this;({lodMeshes:this._lodMeshes,sizeLods:this._sizeLods,sigmas:this._sigmas}=t4(K)),this._blurMaterial=e4(K,z,J),this._ggxMaterial=r4(K,z,J)}return $}_compileMaterial(z){let J=new LJ(new mz,z);this._renderer.compile(J,H1)}_sceneToCubeUV(z,J,Q,$,K){let B=new RJ(90,1,J,Q),G=[1,-1,1,1,1,1],N=[1,1,1,-1,-1,-1],Z=this._renderer,H=Z.autoClear,D=Z.toneMapping;if(Z.getClearColor(c8),Z.toneMapping=0,Z.autoClear=!1,Z.state.buffers.depth.getReversed())Z.setRenderTarget($),Z.clearDepth(),Z.setRenderTarget(null);if(this._backgroundBox===null)this._backgroundBox=new LJ(new X0,new RQ({name:"PMREM.Background",side:1,depthWrite:!1,depthTest:!1}));let X=this._backgroundBox,k=X.material,Y=!1,V=z.background;if(V){if(V.isColor)k.color.copy(V),z.background=null,Y=!0}else k.color.copy(c8),Y=!0;for(let L=0;L<6;L++){let O=L%3;if(O===0)B.up.set(0,G[L],0),B.position.set(K.x,K.y,K.z),B.lookAt(K.x+N[L],K.y,K.z);else if(O===1)B.up.set(0,0,G[L]),B.position.set(K.x,K.y,K.z),B.lookAt(K.x,K.y+N[L],K.z);else B.up.set(0,G[L],0),B.position.set(K.x,K.y,K.z),B.lookAt(K.x,K.y,K.z+N[L]);let I=this._cubeSize;if(p0($,O*I,L>2?I:0,I,I),Z.setRenderTarget($),Y)Z.render(X,B);Z.render(z,B)}Z.toneMapping=D,Z.autoClear=H,z.background=V}_textureToCubeUV(z,J){let Q=this._renderer,$=z.mapping===301||z.mapping===302;if($){if(this._cubemapMaterial===null)this._cubemapMaterial=s8();this._cubemapMaterial.uniforms.flipEnvMap.value=z.isRenderTargetTexture===!1?-1:1}else if(this._equirectMaterial===null)this._equirectMaterial=o8();let K=$?this._cubemapMaterial:this._equirectMaterial,W=this._lodMeshes[0];W.material=K;let q=K.uniforms;q.envMap.value=z;let B=this._cubeSize;p0(J,0,0,3*B,2*B),Q.setRenderTarget(J),Q.render(W,H1)}_applyPMREM(z){let J=this._renderer,Q=J.autoClear;J.autoClear=!1;let $=this._lodMeshes.length;for(let K=1;K<$;K++)this._applyGGXFilter(z,K-1,K);J.autoClear=Q}_applyGGXFilter(z,J,Q){let $=this._renderer,K=this._pingPongRenderTarget,W=this._ggxMaterial,q=this._lodMeshes[Q];q.material=W;let B=W.uniforms,G=Q/(this._lodMeshes.length-1),N=J/(this._lodMeshes.length-1),Z=Math.sqrt(G*G-N*N),H=0+G*1.25,D=Z*H,{_lodMax:U}=this,X=this._sizeLods[Q],k=3*X*(Q>U-uQ?Q-U+uQ:0),Y=4*(this._cubeSize-X);B.envMap.value=z.texture,B.roughness.value=D,B.mipInt.value=U-J,p0(K,k,Y,3*X,2*X),$.setRenderTarget(K),$.render(q,H1),B.envMap.value=K.texture,B.roughness.value=0,B.mipInt.value=U-Q,p0(z,k,Y,3*X,2*X),$.setRenderTarget(z),$.render(q,H1)}_blur(z,J,Q,$,K){let W=this._pingPongRenderTarget;this._halfBlur(z,W,J,Q,$,"latitudinal",K),this._halfBlur(W,z,Q,Q,$,"longitudinal",K)}_halfBlur(z,J,Q,$,K,W,q){let B=this._renderer,G=this._blurMaterial;if(W!=="latitudinal"&&W!=="longitudinal")Pz("blur direction must be either latitudinal or longitudinal!");let N=3,Z=this._lodMeshes[$];Z.material=G;let H=G.uniforms,D=this._sizeLods[Q]-1,U=isFinite(K)?Math.PI/(2*D):2*Math.PI/(2*G0-1),X=K/U,k=isFinite(K)?1+Math.floor(N*X):G0;if(k>G0)Bz(`sigmaRadians, ${K}, is too large and will clip, as it requested ${k} samples when the maximum is set to ${G0}`);let Y=[],V=0;for(let w=0;w<G0;++w){let C=w/X,E=Math.exp(-C*C/2);if(Y.push(E),w===0)V+=E;else if(w<k)V+=2*E}for(let w=0;w<Y.length;w++)Y[w]=Y[w]/V;if(H.envMap.value=z.texture,H.samples.value=k,H.weights.value=Y,H.latitudinal.value=W==="latitudinal",q)H.poleAxis.value=q;let{_lodMax:L}=this;H.dTheta.value=U,H.mipInt.value=L-Q;let O=this._sizeLods[$],I=3*O*($>L-uQ?$-L+uQ:0),S=4*(this._cubeSize-O);p0(J,I,S,3*O,2*O),B.setRenderTarget(J),B.render(Z,H1)}}function t4(z){let J=[],Q=[],$=[],K=z,W=z-uQ+1+m8.length;for(let q=0;q<W;q++){let B=Math.pow(2,K);J.push(B);let G=1/B;if(q>z-uQ)G=m8[q-z+uQ-1];else if(q===0)G=0;Q.push(G);let N=1/(B-2),Z=-N,H=1+N,D=[Z,Z,H,Z,H,H,Z,Z,H,H,Z,H],U=6,X=6,k=3,Y=2,V=1,L=new Float32Array(k*X*U),O=new Float32Array(Y*X*U),I=new Float32Array(V*X*U);for(let w=0;w<U;w++){let C=w%3*2/3-1,E=w>2?0:-1,F=[C,E,0,C+0.6666666666666666,E,0,C+0.6666666666666666,E+1,0,C,E,0,C+0.6666666666666666,E+1,0,C,E+1,0];L.set(F,k*X*w),O.set(D,Y*X*w);let x=[w,w,w,w,w,w];I.set(x,V*X*w)}let S=new mz;if(S.setAttribute("position",new GJ(L,k)),S.setAttribute("uv",new GJ(O,Y)),S.setAttribute("faceIndex",new GJ(I,V)),$.push(new LJ(S,null)),K>uQ)K--}return{lodMeshes:$,sizeLods:J,sigmas:Q}}function n8(z,J,Q){let $=new nJ(z,J,Q);return $.texture.mapping=306,$.texture.name="PMREM.cubeUv",$.scissorTest=!0,$}function p0(z,J,Q,$,K){z.viewport.set(J,Q,$,K),z.scissor.set(J,Q,$,K)}function r4(z,J,Q){return new rJ({name:"PMREMGGXConvolution",defines:{GGX_SAMPLES:i4,CUBEUV_TEXEL_WIDTH:1/J,CUBEUV_TEXEL_HEIGHT:1/Q,CUBEUV_MAX_MIP:`${z}.0`},uniforms:{envMap:{value:null},roughness:{value:0},mipInt:{value:0}},vertexShader:L5(),fragmentShader:`

			precision highp float;
			precision highp int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;
			uniform float roughness;
			uniform float mipInt;

			#define ENVMAP_TYPE_CUBE_UV
			#include <cube_uv_reflection_fragment>

			#define PI 3.14159265359

			// Van der Corput radical inverse
			float radicalInverse_VdC(uint bits) {
				bits = (bits << 16u) | (bits >> 16u);
				bits = ((bits & 0x55555555u) << 1u) | ((bits & 0xAAAAAAAAu) >> 1u);
				bits = ((bits & 0x33333333u) << 2u) | ((bits & 0xCCCCCCCCu) >> 2u);
				bits = ((bits & 0x0F0F0F0Fu) << 4u) | ((bits & 0xF0F0F0F0u) >> 4u);
				bits = ((bits & 0x00FF00FFu) << 8u) | ((bits & 0xFF00FF00u) >> 8u);
				return float(bits) * 2.3283064365386963e-10; // / 0x100000000
			}

			// Hammersley sequence
			vec2 hammersley(uint i, uint N) {
				return vec2(float(i) / float(N), radicalInverse_VdC(i));
			}

			// GGX VNDF importance sampling (Eric Heitz 2018)
			// "Sampling the GGX Distribution of Visible Normals"
			// https://jcgt.org/published/0007/04/01/
			vec3 importanceSampleGGX_VNDF(vec2 Xi, vec3 V, float roughness) {
				float alpha = roughness * roughness;

				// Section 4.1: Orthonormal basis
				vec3 T1 = vec3(1.0, 0.0, 0.0);
				vec3 T2 = cross(V, T1);

				// Section 4.2: Parameterization of projected area
				float r = sqrt(Xi.x);
				float phi = 2.0 * PI * Xi.y;
				float t1 = r * cos(phi);
				float t2 = r * sin(phi);
				float s = 0.5 * (1.0 + V.z);
				t2 = (1.0 - s) * sqrt(1.0 - t1 * t1) + s * t2;

				// Section 4.3: Reprojection onto hemisphere
				vec3 Nh = t1 * T1 + t2 * T2 + sqrt(max(0.0, 1.0 - t1 * t1 - t2 * t2)) * V;

				// Section 3.4: Transform back to ellipsoid configuration
				return normalize(vec3(alpha * Nh.x, alpha * Nh.y, max(0.0, Nh.z)));
			}

			void main() {
				vec3 N = normalize(vOutputDirection);
				vec3 V = N; // Assume view direction equals normal for pre-filtering

				vec3 prefilteredColor = vec3(0.0);
				float totalWeight = 0.0;

				// For very low roughness, just sample the environment directly
				if (roughness < 0.001) {
					gl_FragColor = vec4(bilinearCubeUV(envMap, N, mipInt), 1.0);
					return;
				}

				// Tangent space basis for VNDF sampling
				vec3 up = abs(N.z) < 0.999 ? vec3(0.0, 0.0, 1.0) : vec3(1.0, 0.0, 0.0);
				vec3 tangent = normalize(cross(up, N));
				vec3 bitangent = cross(N, tangent);

				for(uint i = 0u; i < uint(GGX_SAMPLES); i++) {
					vec2 Xi = hammersley(i, uint(GGX_SAMPLES));

					// For PMREM, V = N, so in tangent space V is always (0, 0, 1)
					vec3 H_tangent = importanceSampleGGX_VNDF(Xi, vec3(0.0, 0.0, 1.0), roughness);

					// Transform H back to world space
					vec3 H = normalize(tangent * H_tangent.x + bitangent * H_tangent.y + N * H_tangent.z);
					vec3 L = normalize(2.0 * dot(V, H) * H - V);

					float NdotL = max(dot(N, L), 0.0);

					if(NdotL > 0.0) {
						// Sample environment at fixed mip level
						// VNDF importance sampling handles the distribution filtering
						vec3 sampleColor = bilinearCubeUV(envMap, L, mipInt);

						// Weight by NdotL for the split-sum approximation
						// VNDF PDF naturally accounts for the visible microfacet distribution
						prefilteredColor += sampleColor * NdotL;
						totalWeight += NdotL;
					}
				}

				if (totalWeight > 0.0) {
					prefilteredColor = prefilteredColor / totalWeight;
				}

				gl_FragColor = vec4(prefilteredColor, 1.0);
			}
		`,blending:0,depthTest:!1,depthWrite:!1})}function e4(z,J,Q){let $=new Float32Array(G0),K=new R(0,1,0);return new rJ({name:"SphericalGaussianBlur",defines:{n:G0,CUBEUV_TEXEL_WIDTH:1/J,CUBEUV_TEXEL_HEIGHT:1/Q,CUBEUV_MAX_MIP:`${z}.0`},uniforms:{envMap:{value:null},samples:{value:1},weights:{value:$},latitudinal:{value:!1},dTheta:{value:0},mipInt:{value:0},poleAxis:{value:K}},vertexShader:L5(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;
			uniform int samples;
			uniform float weights[ n ];
			uniform bool latitudinal;
			uniform float dTheta;
			uniform float mipInt;
			uniform vec3 poleAxis;

			#define ENVMAP_TYPE_CUBE_UV
			#include <cube_uv_reflection_fragment>

			vec3 getSample( float theta, vec3 axis ) {

				float cosTheta = cos( theta );
				// Rodrigues' axis-angle rotation
				vec3 sampleDirection = vOutputDirection * cosTheta
					+ cross( axis, vOutputDirection ) * sin( theta )
					+ axis * dot( axis, vOutputDirection ) * ( 1.0 - cosTheta );

				return bilinearCubeUV( envMap, sampleDirection, mipInt );

			}

			void main() {

				vec3 axis = latitudinal ? poleAxis : cross( poleAxis, vOutputDirection );

				if ( all( equal( axis, vec3( 0.0 ) ) ) ) {

					axis = vec3( vOutputDirection.z, 0.0, - vOutputDirection.x );

				}

				axis = normalize( axis );

				gl_FragColor = vec4( 0.0, 0.0, 0.0, 1.0 );
				gl_FragColor.rgb += weights[ 0 ] * getSample( 0.0, axis );

				for ( int i = 1; i < n; i++ ) {

					if ( i >= samples ) {

						break;

					}

					float theta = dTheta * float( i );
					gl_FragColor.rgb += weights[ i ] * getSample( -1.0 * theta, axis );
					gl_FragColor.rgb += weights[ i ] * getSample( theta, axis );

				}

			}
		`,blending:0,depthTest:!1,depthWrite:!1})}function o8(){return new rJ({name:"EquirectangularToCubeUV",uniforms:{envMap:{value:null}},vertexShader:L5(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;

			#include <common>

			void main() {

				vec3 outputDirection = normalize( vOutputDirection );
				vec2 uv = equirectUv( outputDirection );

				gl_FragColor = vec4( texture2D ( envMap, uv ).rgb, 1.0 );

			}
		`,blending:0,depthTest:!1,depthWrite:!1})}function s8(){return new rJ({name:"CubemapToCubeUV",uniforms:{envMap:{value:null},flipEnvMap:{value:-1}},vertexShader:L5(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			uniform float flipEnvMap;

			varying vec3 vOutputDirection;

			uniform samplerCube envMap;

			void main() {

				gl_FragColor = textureCube( envMap, vec3( flipEnvMap * vOutputDirection.x, vOutputDirection.yz ) );

			}
		`,blending:0,depthTest:!1,depthWrite:!1})}function L5(){return`

		precision mediump float;
		precision mediump int;

		attribute float faceIndex;

		varying vec3 vOutputDirection;

		// RH coordinate system; PMREM face-indexing convention
		vec3 getDirection( vec2 uv, float face ) {

			uv = 2.0 * uv - 1.0;

			vec3 direction = vec3( uv, 1.0 );

			if ( face == 0.0 ) {

				direction = direction.zyx; // ( 1, v, u ) pos x

			} else if ( face == 1.0 ) {

				direction = direction.xzy;
				direction.xz *= -1.0; // ( -u, 1, -v ) pos y

			} else if ( face == 2.0 ) {

				direction.x *= -1.0; // ( -u, v, 1 ) pos z

			} else if ( face == 3.0 ) {

				direction = direction.zyx;
				direction.xz *= -1.0; // ( -1, v, -u ) neg x

			} else if ( face == 4.0 ) {

				direction = direction.xzy;
				direction.xy *= -1.0; // ( -u, -1, v ) neg y

			} else if ( face == 5.0 ) {

				direction.z *= -1.0; // ( u, v, -1 ) neg z

			}

			return direction;

		}

		void main() {

			vOutputDirection = getDirection( uv, faceIndex );
			gl_Position = vec4( position, 1.0 );

		}
	`}class y5 extends nJ{constructor(z=1,J={}){super(z,z,J);this.isWebGLCubeRenderTarget=!0;let Q={width:z,height:z,depth:1},$=[Q,Q,Q,Q,Q,Q];this.texture=new i0($),this._setTextureOptions(J),this.texture.isRenderTargetTexture=!0}fromEquirectangularTexture(z,J){this.texture.type=J.type,this.texture.colorSpace=J.colorSpace,this.texture.generateMipmaps=J.generateMipmaps,this.texture.minFilter=J.minFilter,this.texture.magFilter=J.magFilter;let Q={uniforms:{tEquirect:{value:null}},vertexShader:`

				varying vec3 vWorldDirection;

				vec3 transformDirection( in vec3 dir, in mat4 matrix ) {

					return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );

				}

				void main() {

					vWorldDirection = transformDirection( position, modelMatrix );

					#include <begin_vertex>
					#include <project_vertex>

				}
			`,fragmentShader:`

				uniform sampler2D tEquirect;

				varying vec3 vWorldDirection;

				#include <common>

				void main() {

					vec3 direction = normalize( vWorldDirection );

					vec2 sampleUV = equirectUv( direction );

					gl_FragColor = texture2D( tEquirect, sampleUV );

				}
			`},$=new X0(5,5,5),K=new rJ({name:"CubemapFromEquirect",uniforms:n0(Q.uniforms),vertexShader:Q.vertexShader,fragmentShader:Q.fragmentShader,side:1,blending:0});K.uniforms.tEquirect.value=J;let W=new LJ($,K),q=J.minFilter;if(J.minFilter===1008)J.minFilter=1006;return new V7(1,10,this).update(z,W),J.minFilter=q,W.geometry.dispose(),W.material.dispose(),this}clear(z,J=!0,Q=!0,$=!0){let K=z.getRenderTarget();for(let W=0;W<6;W++)z.setRenderTarget(this,W),z.clear(J,Q,$);z.setRenderTarget(K)}}function zB(z){let J=new WeakMap,Q=new WeakMap,$=null;function K(D,U=!1){if(D===null||D===void 0)return null;if(U)return q(D);return W(D)}function W(D){if(D&&D.isTexture){let U=D.mapping;if(U===303||U===304)if(J.has(D)){let X=J.get(D).texture;return B(X,D.mapping)}else{let X=D.image;if(X&&X.height>0){let k=new y5(X.height);return k.fromEquirectangularTexture(z,D),J.set(D,k),D.addEventListener("dispose",N),B(k.texture,D.mapping)}else return null}}return D}function q(D){if(D&&D.isTexture){let U=D.mapping,X=U===303||U===304,k=U===301||U===302;if(X||k){let Y=Q.get(D),V=Y!==void 0?Y.texture.pmremVersion:0;if(D.isRenderTargetTexture&&D.pmremVersion!==V){if($===null)$=new _2(z);return Y=X?$.fromEquirectangular(D,Y):$.fromCubemap(D,Y),Y.texture.pmremVersion=D.pmremVersion,Q.set(D,Y),Y.texture}else if(Y!==void 0)return Y.texture;else{let L=D.image;if(X&&L&&L.height>0||k&&L&&G(L)){if($===null)$=new _2(z);return Y=X?$.fromEquirectangular(D):$.fromCubemap(D),Y.texture.pmremVersion=D.pmremVersion,Q.set(D,Y),D.addEventListener("dispose",Z),Y.texture}else return null}}}return D}function B(D,U){if(U===303)D.mapping=301;else if(U===304)D.mapping=302;return D}function G(D){let U=0,X=6;for(let k=0;k<X;k++)if(D[k]!==void 0)U++;return U===X}function N(D){let U=D.target;U.removeEventListener("dispose",N);let X=J.get(U);if(X!==void 0)J.delete(U),X.dispose()}function Z(D){let U=D.target;U.removeEventListener("dispose",Z);let X=Q.get(U);if(X!==void 0)Q.delete(U),X.dispose()}function H(){if(J=new WeakMap,Q=new WeakMap,$!==null)$.dispose(),$=null}return{get:K,dispose:H}}function JB(z){let J={};function Q($){if(J[$]!==void 0)return J[$];let K=z.getExtension($);return J[$]=K,K}return{has:function($){return Q($)!==null},init:function(){Q("EXT_color_buffer_float"),Q("WEBGL_clip_cull_distance"),Q("OES_texture_float_linear"),Q("EXT_color_buffer_half_float"),Q("WEBGL_multisampled_render_to_texture"),Q("WEBGL_render_shared_exponent")},get:function($){let K=Q($);if(K===null)gQ("WebGLRenderer: "+$+" extension not supported.");return K}}}function QB(z,J,Q,$){let K={},W=new WeakMap;function q(H){let D=H.target;if(D.index!==null)J.remove(D.index);for(let X in D.attributes)J.remove(D.attributes[X]);D.removeEventListener("dispose",q),delete K[D.id];let U=W.get(D);if(U)J.remove(U),W.delete(D);if($.releaseStatesOfGeometry(D),D.isInstancedBufferGeometry===!0)delete D._maxInstanceCount;Q.memory.geometries--}function B(H,D){if(K[D.id]===!0)return D;return D.addEventListener("dispose",q),K[D.id]=!0,Q.memory.geometries++,D}function G(H){let D=H.attributes;for(let U in D)J.update(D[U],z.ARRAY_BUFFER)}function N(H){let D=[],U=H.index,X=H.attributes.position,k=0;if(X===void 0)return;if(U!==null){let L=U.array;k=U.version;for(let O=0,I=L.length;O<I;O+=3){let S=L[O+0],w=L[O+1],C=L[O+2];D.push(S,w,w,C,C,S)}}else{let L=X.array;k=X.version;for(let O=0,I=L.length/3-1;O<I;O+=3){let S=O+0,w=O+1,C=O+2;D.push(S,w,w,C,C,S)}}let Y=new(X.count>=65535?g2:u2)(D,1);Y.version=k;let V=W.get(H);if(V)J.remove(V);W.set(H,Y)}function Z(H){let D=W.get(H);if(D){let U=H.index;if(U!==null){if(D.version<U.version)N(H)}}else N(H);return W.get(H)}return{get:B,update:G,getWireframeAttribute:Z}}function $B(z,J,Q){let $;function K(H){$=H}let W,q;function B(H){W=H.type,q=H.bytesPerElement}function G(H,D){z.drawElements($,D,W,H*q),Q.update(D,$,1)}function N(H,D,U){if(U===0)return;z.drawElementsInstanced($,D,W,H*q,U),Q.update(D,$,U)}function Z(H,D,U){if(U===0)return;J.get("WEBGL_multi_draw").multiDrawElementsWEBGL($,D,0,W,H,0,U);let k=0;for(let Y=0;Y<U;Y++)k+=D[Y];Q.update(k,$,1)}this.setMode=K,this.setIndex=B,this.render=G,this.renderInstances=N,this.renderMultiDraw=Z}function KB(z){let J={geometries:0,textures:0},Q={frame:0,calls:0,triangles:0,points:0,lines:0};function $(W,q,B){switch(Q.calls++,q){case z.TRIANGLES:Q.triangles+=B*(W/3);break;case z.LINES:Q.lines+=B*(W/2);break;case z.LINE_STRIP:Q.lines+=B*(W-1);break;case z.LINE_LOOP:Q.lines+=B*W;break;case z.POINTS:Q.points+=B*W;break;default:Pz("WebGLInfo: Unknown draw mode:",q);break}}function K(){Q.calls=0,Q.triangles=0,Q.points=0,Q.lines=0}return{memory:J,render:Q,programs:null,autoReset:!0,reset:K,update:$}}function WB(z,J,Q){let $=new WeakMap,K=new BJ;function W(q,B,G){let N=q.morphTargetInfluences,Z=B.morphAttributes.position||B.morphAttributes.normal||B.morphAttributes.color,H=Z!==void 0?Z.length:0,D=$.get(B);if(D===void 0||D.count!==H){let F=function(){C.dispose(),$.delete(B),B.removeEventListener("dispose",F)};if(D!==void 0)D.texture.dispose();let U=B.morphAttributes.position!==void 0,X=B.morphAttributes.normal!==void 0,k=B.morphAttributes.color!==void 0,Y=B.morphAttributes.position||[],V=B.morphAttributes.normal||[],L=B.morphAttributes.color||[],O=0;if(U===!0)O=1;if(X===!0)O=2;if(k===!0)O=3;let I=B.attributes.position.count*O,S=1;if(I>J.maxTextureSize)S=Math.ceil(I/J.maxTextureSize),I=J.maxTextureSize;let w=new Float32Array(I*S*4*H),C=new w1(w,I,S,H);C.type=1015,C.needsUpdate=!0;let E=O*4;for(let x=0;x<H;x++){let P=Y[x],p=V[x],n=L[x],j=I*S*4*x;for(let m=0;m<P.count;m++){let l=m*E;if(U===!0)K.fromBufferAttribute(P,m),w[j+l+0]=K.x,w[j+l+1]=K.y,w[j+l+2]=K.z,w[j+l+3]=0;if(X===!0)K.fromBufferAttribute(p,m),w[j+l+4]=K.x,w[j+l+5]=K.y,w[j+l+6]=K.z,w[j+l+7]=0;if(k===!0)K.fromBufferAttribute(n,m),w[j+l+8]=K.x,w[j+l+9]=K.y,w[j+l+10]=K.z,w[j+l+11]=n.itemSize===4?K.w:1}}D={count:H,texture:C,size:new a(I,S)},$.set(B,D),B.addEventListener("dispose",F)}if(q.isInstancedMesh===!0&&q.morphTexture!==null)G.getUniforms().setValue(z,"morphTexture",q.morphTexture,Q);else{let U=0;for(let k=0;k<N.length;k++)U+=N[k];let X=B.morphTargetsRelative?1:1-U;G.getUniforms().setValue(z,"morphTargetBaseInfluence",X),G.getUniforms().setValue(z,"morphTargetInfluences",N)}G.getUniforms().setValue(z,"morphTargetsTexture",D.texture,Q),G.getUniforms().setValue(z,"morphTargetsTextureSize",D.size)}return{update:W}}function qB(z,J,Q,$,K){let W=new WeakMap;function q(N){let Z=K.render.frame,H=N.geometry,D=J.get(N,H);if(W.get(D)!==Z)J.update(D),W.set(D,Z);if(N.isInstancedMesh){if(N.hasEventListener("dispose",G)===!1)N.addEventListener("dispose",G);if(W.get(N)!==Z){if(Q.update(N.instanceMatrix,z.ARRAY_BUFFER),N.instanceColor!==null)Q.update(N.instanceColor,z.ARRAY_BUFFER);W.set(N,Z)}}if(N.isSkinnedMesh){let U=N.skeleton;if(W.get(U)!==Z)U.update(),W.set(U,Z)}return D}function B(){W=new WeakMap}function G(N){let Z=N.target;if(Z.removeEventListener("dispose",G),$.releaseStatesOfObject(Z),Q.remove(Z.instanceMatrix),Z.instanceColor!==null)Q.remove(Z.instanceColor)}return{update:q,dispose:B}}var BB={[1]:"LINEAR_TONE_MAPPING",[2]:"REINHARD_TONE_MAPPING",[3]:"CINEON_TONE_MAPPING",[4]:"ACES_FILMIC_TONE_MAPPING",[6]:"AGX_TONE_MAPPING",[7]:"NEUTRAL_TONE_MAPPING",[5]:"CUSTOM_TONE_MAPPING"};function GB(z,J,Q,$,K,W){let q=new nJ(J,Q,{type:z,depthBuffer:K,stencilBuffer:W,samples:$?4:0,depthTexture:K?new cQ(J,Q):void 0}),B=new nJ(J,Q,{type:1016,depthBuffer:!1,stencilBuffer:!1}),G=new mz;G.setAttribute("position",new Sz([-1,3,0,-1,-1,0,3,-1,0],3)),G.setAttribute("uv",new Sz([0,2,0,0,2,0],2));let N=new H5({uniforms:{tDiffuse:{value:null}},vertexShader:`
			precision highp float;

			uniform mat4 modelViewMatrix;
			uniform mat4 projectionMatrix;

			attribute vec3 position;
			attribute vec2 uv;

			varying vec2 vUv;

			void main() {
				vUv = uv;
				gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
			}`,fragmentShader:`
			precision highp float;

			uniform sampler2D tDiffuse;

			varying vec2 vUv;

			#include <tonemapping_pars_fragment>
			#include <colorspace_pars_fragment>

			void main() {
				gl_FragColor = texture2D( tDiffuse, vUv );

				#ifdef LINEAR_TONE_MAPPING
					gl_FragColor.rgb = LinearToneMapping( gl_FragColor.rgb );
				#elif defined( REINHARD_TONE_MAPPING )
					gl_FragColor.rgb = ReinhardToneMapping( gl_FragColor.rgb );
				#elif defined( CINEON_TONE_MAPPING )
					gl_FragColor.rgb = CineonToneMapping( gl_FragColor.rgb );
				#elif defined( ACES_FILMIC_TONE_MAPPING )
					gl_FragColor.rgb = ACESFilmicToneMapping( gl_FragColor.rgb );
				#elif defined( AGX_TONE_MAPPING )
					gl_FragColor.rgb = AgXToneMapping( gl_FragColor.rgb );
				#elif defined( NEUTRAL_TONE_MAPPING )
					gl_FragColor.rgb = NeutralToneMapping( gl_FragColor.rgb );
				#elif defined( CUSTOM_TONE_MAPPING )
					gl_FragColor.rgb = CustomToneMapping( gl_FragColor.rgb );
				#endif

				#ifdef SRGB_TRANSFER
					gl_FragColor = sRGBTransferOETF( gl_FragColor );
				#endif
			}`,depthTest:!1,depthWrite:!1}),Z=new LJ(G,N),H=new r0(-1,1,1,-1,0,1),D=null,U=null,X=!1,k,Y=null,V=[],L=!1;this.setSize=function(O,I){q.setSize(O,I),B.setSize(O,I);for(let S=0;S<V.length;S++){let w=V[S];if(w.setSize)w.setSize(O,I)}},this.setEffects=function(O){V=O,L=V.length>0&&V[0].isRenderPass===!0;let{width:I,height:S}=q;for(let w=0;w<V.length;w++){let C=V[w];if(C.setSize)C.setSize(I,S)}},this.begin=function(O,I){if(X)return!1;if(O.toneMapping===0&&V.length===0)return!1;if(Y=I,I!==null){let{width:S,height:w}=I;if(q.width!==S||q.height!==w)this.setSize(S,w)}if(L===!1)O.setRenderTarget(q);return k=O.toneMapping,O.toneMapping=0,!0},this.hasRenderPass=function(){return L},this.end=function(O,I){O.toneMapping=k,X=!0;let S=q,w=B;for(let C=0;C<V.length;C++){let E=V[C];if(E.enabled===!1)continue;if(E.render(O,w,S,I),E.needsSwap!==!1){let F=S;S=w,w=F}}if(D!==O.outputColorSpace||U!==O.toneMapping){if(D=O.outputColorSpace,U=O.toneMapping,N.defines={},zJ.getTransfer(D)==="srgb")N.defines.SRGB_TRANSFER="";let C=BB[U];if(C)N.defines[C]="";N.needsUpdate=!0}N.uniforms.tDiffuse.value=S.texture,O.setRenderTarget(Y),O.render(Z,H),Y=null,X=!1},this.isCompositing=function(){return X},this.dispose=function(){if(q.depthTexture)q.depthTexture.dispose();q.dispose(),B.dispose(),G.dispose(),N.dispose()}}var _$=new kJ,y6=new cQ(1,1),b$=new w1,d$=new C1,p$=new i0,i8=[],a8=[],t8=new Float32Array(16),r8=new Float32Array(9),e8=new Float32Array(4);function e0(z,J,Q){let $=z[0];if($<=0||$>0)return z;let K=J*Q,W=i8[K];if(W===void 0)W=new Float32Array(K),i8[K]=W;if(J!==0){$.toArray(W,0);for(let q=1,B=0;q!==J;++q)B+=Q,z[q].toArray(W,B)}return W}function SJ(z,J){if(z.length!==J.length)return!1;for(let Q=0,$=z.length;Q<$;Q++)if(z[Q]!==J[Q])return!1;return!0}function wJ(z,J){for(let Q=0,$=J.length;Q<$;Q++)z[Q]=J[Q]}function S5(z,J){let Q=a8[J];if(Q===void 0)Q=new Int32Array(J),a8[J]=Q;for(let $=0;$!==J;++$)Q[$]=z.allocateTextureUnit();return Q}function NB(z,J){let Q=this.cache;if(Q[0]===J)return;z.uniform1f(this.addr,J),Q[0]=J}function DB(z,J){let Q=this.cache;if(J.x!==void 0){if(Q[0]!==J.x||Q[1]!==J.y)z.uniform2f(this.addr,J.x,J.y),Q[0]=J.x,Q[1]=J.y}else{if(SJ(Q,J))return;z.uniform2fv(this.addr,J),wJ(Q,J)}}function ZB(z,J){let Q=this.cache;if(J.x!==void 0){if(Q[0]!==J.x||Q[1]!==J.y||Q[2]!==J.z)z.uniform3f(this.addr,J.x,J.y,J.z),Q[0]=J.x,Q[1]=J.y,Q[2]=J.z}else if(J.r!==void 0){if(Q[0]!==J.r||Q[1]!==J.g||Q[2]!==J.b)z.uniform3f(this.addr,J.r,J.g,J.b),Q[0]=J.r,Q[1]=J.g,Q[2]=J.b}else{if(SJ(Q,J))return;z.uniform3fv(this.addr,J),wJ(Q,J)}}function HB(z,J){let Q=this.cache;if(J.x!==void 0){if(Q[0]!==J.x||Q[1]!==J.y||Q[2]!==J.z||Q[3]!==J.w)z.uniform4f(this.addr,J.x,J.y,J.z,J.w),Q[0]=J.x,Q[1]=J.y,Q[2]=J.z,Q[3]=J.w}else{if(SJ(Q,J))return;z.uniform4fv(this.addr,J),wJ(Q,J)}}function UB(z,J){let Q=this.cache,$=J.elements;if($===void 0){if(SJ(Q,J))return;z.uniformMatrix2fv(this.addr,!1,J),wJ(Q,J)}else{if(SJ(Q,$))return;e8.set($),z.uniformMatrix2fv(this.addr,!1,e8),wJ(Q,$)}}function VB(z,J){let Q=this.cache,$=J.elements;if($===void 0){if(SJ(Q,J))return;z.uniformMatrix3fv(this.addr,!1,J),wJ(Q,J)}else{if(SJ(Q,$))return;r8.set($),z.uniformMatrix3fv(this.addr,!1,r8),wJ(Q,$)}}function YB(z,J){let Q=this.cache,$=J.elements;if($===void 0){if(SJ(Q,J))return;z.uniformMatrix4fv(this.addr,!1,J),wJ(Q,J)}else{if(SJ(Q,$))return;t8.set($),z.uniformMatrix4fv(this.addr,!1,t8),wJ(Q,$)}}function XB(z,J){let Q=this.cache;if(Q[0]===J)return;z.uniform1i(this.addr,J),Q[0]=J}function kB(z,J){let Q=this.cache;if(J.x!==void 0){if(Q[0]!==J.x||Q[1]!==J.y)z.uniform2i(this.addr,J.x,J.y),Q[0]=J.x,Q[1]=J.y}else{if(SJ(Q,J))return;z.uniform2iv(this.addr,J),wJ(Q,J)}}function EB(z,J){let Q=this.cache;if(J.x!==void 0){if(Q[0]!==J.x||Q[1]!==J.y||Q[2]!==J.z)z.uniform3i(this.addr,J.x,J.y,J.z),Q[0]=J.x,Q[1]=J.y,Q[2]=J.z}else{if(SJ(Q,J))return;z.uniform3iv(this.addr,J),wJ(Q,J)}}function IB(z,J){let Q=this.cache;if(J.x!==void 0){if(Q[0]!==J.x||Q[1]!==J.y||Q[2]!==J.z||Q[3]!==J.w)z.uniform4i(this.addr,J.x,J.y,J.z,J.w),Q[0]=J.x,Q[1]=J.y,Q[2]=J.z,Q[3]=J.w}else{if(SJ(Q,J))return;z.uniform4iv(this.addr,J),wJ(Q,J)}}function AB(z,J){let Q=this.cache;if(Q[0]===J)return;z.uniform1ui(this.addr,J),Q[0]=J}function OB(z,J){let Q=this.cache;if(J.x!==void 0){if(Q[0]!==J.x||Q[1]!==J.y)z.uniform2ui(this.addr,J.x,J.y),Q[0]=J.x,Q[1]=J.y}else{if(SJ(Q,J))return;z.uniform2uiv(this.addr,J),wJ(Q,J)}}function FB(z,J){let Q=this.cache;if(J.x!==void 0){if(Q[0]!==J.x||Q[1]!==J.y||Q[2]!==J.z)z.uniform3ui(this.addr,J.x,J.y,J.z),Q[0]=J.x,Q[1]=J.y,Q[2]=J.z}else{if(SJ(Q,J))return;z.uniform3uiv(this.addr,J),wJ(Q,J)}}function MB(z,J){let Q=this.cache;if(J.x!==void 0){if(Q[0]!==J.x||Q[1]!==J.y||Q[2]!==J.z||Q[3]!==J.w)z.uniform4ui(this.addr,J.x,J.y,J.z,J.w),Q[0]=J.x,Q[1]=J.y,Q[2]=J.z,Q[3]=J.w}else{if(SJ(Q,J))return;z.uniform4uiv(this.addr,J),wJ(Q,J)}}function LB(z,J,Q){let $=this.cache,K=Q.allocateTextureUnit();if($[0]!==K)z.uniform1i(this.addr,K),$[0]=K;let W;if(this.type===z.SAMPLER_2D_SHADOW)y6.compareFunction=Q.isReversedDepthBuffer()?518:515,W=y6;else W=_$;Q.setTexture2D(J||W,K)}function yB(z,J,Q){let $=this.cache,K=Q.allocateTextureUnit();if($[0]!==K)z.uniform1i(this.addr,K),$[0]=K;Q.setTexture3D(J||d$,K)}function SB(z,J,Q){let $=this.cache,K=Q.allocateTextureUnit();if($[0]!==K)z.uniform1i(this.addr,K),$[0]=K;Q.setTextureCube(J||p$,K)}function wB(z,J,Q){let $=this.cache,K=Q.allocateTextureUnit();if($[0]!==K)z.uniform1i(this.addr,K),$[0]=K;Q.setTexture2DArray(J||b$,K)}function CB(z){switch(z){case 5126:return NB;case 35664:return DB;case 35665:return ZB;case 35666:return HB;case 35674:return UB;case 35675:return VB;case 35676:return YB;case 5124:case 35670:return XB;case 35667:case 35671:return kB;case 35668:case 35672:return EB;case 35669:case 35673:return IB;case 5125:return AB;case 36294:return OB;case 36295:return FB;case 36296:return MB;case 35678:case 36198:case 36298:case 36306:case 35682:return LB;case 35679:case 36299:case 36307:return yB;case 35680:case 36300:case 36308:case 36293:return SB;case 36289:case 36303:case 36311:case 36292:return wB}}function RB(z,J){z.uniform1fv(this.addr,J)}function PB(z,J){let Q=e0(J,this.size,2);z.uniform2fv(this.addr,Q)}function vB(z,J){let Q=e0(J,this.size,3);z.uniform3fv(this.addr,Q)}function fB(z,J){let Q=e0(J,this.size,4);z.uniform4fv(this.addr,Q)}function TB(z,J){let Q=e0(J,this.size,4);z.uniformMatrix2fv(this.addr,!1,Q)}function hB(z,J){let Q=e0(J,this.size,9);z.uniformMatrix3fv(this.addr,!1,Q)}function xB(z,J){let Q=e0(J,this.size,16);z.uniformMatrix4fv(this.addr,!1,Q)}function jB(z,J){z.uniform1iv(this.addr,J)}function _B(z,J){z.uniform2iv(this.addr,J)}function bB(z,J){z.uniform3iv(this.addr,J)}function dB(z,J){z.uniform4iv(this.addr,J)}function pB(z,J){z.uniform1uiv(this.addr,J)}function uB(z,J){z.uniform2uiv(this.addr,J)}function gB(z,J){z.uniform3uiv(this.addr,J)}function lB(z,J){z.uniform4uiv(this.addr,J)}function mB(z,J,Q){let $=this.cache,K=J.length,W=S5(Q,K);if(!SJ($,W))z.uniform1iv(this.addr,W),wJ($,W);let q;if(this.type===z.SAMPLER_2D_SHADOW)q=y6;else q=_$;for(let B=0;B!==K;++B)Q.setTexture2D(J[B]||q,W[B])}function cB(z,J,Q){let $=this.cache,K=J.length,W=S5(Q,K);if(!SJ($,W))z.uniform1iv(this.addr,W),wJ($,W);for(let q=0;q!==K;++q)Q.setTexture3D(J[q]||d$,W[q])}function nB(z,J,Q){let $=this.cache,K=J.length,W=S5(Q,K);if(!SJ($,W))z.uniform1iv(this.addr,W),wJ($,W);for(let q=0;q!==K;++q)Q.setTextureCube(J[q]||p$,W[q])}function oB(z,J,Q){let $=this.cache,K=J.length,W=S5(Q,K);if(!SJ($,W))z.uniform1iv(this.addr,W),wJ($,W);for(let q=0;q!==K;++q)Q.setTexture2DArray(J[q]||b$,W[q])}function sB(z){switch(z){case 5126:return RB;case 35664:return PB;case 35665:return vB;case 35666:return fB;case 35674:return TB;case 35675:return hB;case 35676:return xB;case 5124:case 35670:return jB;case 35667:case 35671:return _B;case 35668:case 35672:return bB;case 35669:case 35673:return dB;case 5125:return pB;case 36294:return uB;case 36295:return gB;case 36296:return lB;case 35678:case 36198:case 36298:case 36306:case 35682:return mB;case 35679:case 36299:case 36307:return cB;case 35680:case 36300:case 36308:case 36293:return nB;case 36289:case 36303:case 36311:case 36292:return oB}}class u${constructor(z,J,Q){this.id=z,this.addr=Q,this.cache=[],this.type=J.type,this.setValue=CB(J.type)}}class g${constructor(z,J,Q){this.id=z,this.addr=Q,this.cache=[],this.type=J.type,this.size=J.size,this.setValue=sB(J.type)}}class l${constructor(z){this.id=z,this.seq=[],this.map={}}setValue(z,J,Q){let $=this.seq;for(let K=0,W=$.length;K!==W;++K){let q=$[K];q.setValue(z,J[q.id],Q)}}}var k6=/(\w+)(\])?(\[|\.)?/g;function z9(z,J){z.seq.push(J),z.map[J.id]=J}function iB(z,J,Q){let $=z.name,K=$.length;k6.lastIndex=0;while(!0){let W=k6.exec($),q=k6.lastIndex,B=W[1],G=W[2]==="]",N=W[3];if(G)B=B|0;if(N===void 0||N==="["&&q+2===K){z9(Q,N===void 0?new u$(B,z,J):new g$(B,z,J));break}else{let H=Q.map[B];if(H===void 0)H=new l$(B),z9(Q,H);Q=H}}}class O1{constructor(z,J){this.seq=[],this.map={};let Q=z.getProgramParameter(J,z.ACTIVE_UNIFORMS);for(let W=0;W<Q;++W){let q=z.getActiveUniform(J,W),B=z.getUniformLocation(J,q.name);iB(q,B,this)}let $=[],K=[];for(let W of this.seq)if(W.type===z.SAMPLER_2D_SHADOW||W.type===z.SAMPLER_CUBE_SHADOW||W.type===z.SAMPLER_2D_ARRAY_SHADOW)$.push(W);else K.push(W);if($.length>0)this.seq=$.concat(K)}setValue(z,J,Q,$){let K=this.map[J];if(K!==void 0)K.setValue(z,Q,$)}setOptional(z,J,Q){let $=J[Q];if($!==void 0)this.setValue(z,Q,$)}static upload(z,J,Q,$){for(let K=0,W=J.length;K!==W;++K){let q=J[K],B=Q[q.id];if(B.needsUpdate!==!1)q.setValue(z,B.value,$)}}static seqWithValue(z,J){let Q=[];for(let $=0,K=z.length;$!==K;++$){let W=z[$];if(W.id in J)Q.push(W)}return Q}}function J9(z,J,Q){let $=z.createShader(J);return z.shaderSource($,Q),z.compileShader($),$}var aB=37297,tB=0;function rB(z,J){let Q=z.split(`
`),$=[],K=Math.max(J-6,0),W=Math.min(J+6,Q.length);for(let q=K;q<W;q++){let B=q+1;$.push(`${B===J?">":" "} ${B}: ${Q[q]}`)}return $.join(`
`)}var Q9=new lz;function eB(z){zJ._getMatrix(Q9,zJ.workingColorSpace,z);let J=`mat3( ${Q9.elements.map((Q)=>Q.toFixed(4))} )`;switch(zJ.getTransfer(z)){case"linear":return[J,"LinearTransferOETF"];case"srgb":return[J,"sRGBTransferOETF"];default:return Bz("WebGLProgram: Unsupported color space: ",z),[J,"LinearTransferOETF"]}}function $9(z,J,Q){let $=z.getShaderParameter(J,z.COMPILE_STATUS),W=(z.getShaderInfoLog(J)||"").trim();if($&&W==="")return"";let q=/ERROR: 0:(\d+)/.exec(W);if(q){let B=parseInt(q[1]);return Q.toUpperCase()+`

`+W+`

`+rB(z.getShaderSource(J),B)}else return W}function zG(z,J){let Q=eB(J);return[`vec4 ${z}( vec4 value ) {`,`	return ${Q[1]}( vec4( value.rgb * ${Q[0]}, value.a ) );`,"}"].join(`
`)}var JG={[1]:"Linear",[2]:"Reinhard",[3]:"Cineon",[4]:"ACESFilmic",[6]:"AgX",[7]:"Neutral",[5]:"Custom"};function QG(z,J){let Q=JG[J];if(Q===void 0)return Bz("WebGLProgram: Unsupported toneMapping:",J),"vec3 "+z+"( vec3 color ) { return LinearToneMapping( color ); }";return"vec3 "+z+"( vec3 color ) { return "+Q+"ToneMapping( color ); }"}var f2=new R;function $G(){zJ.getLuminanceCoefficients(f2);let z=f2.x.toFixed(4),J=f2.y.toFixed(4),Q=f2.z.toFixed(4);return["float luminance( const in vec3 rgb ) {",`	const vec3 weights = vec3( ${z}, ${J}, ${Q} );`,"\treturn dot( weights, rgb );","}"].join(`
`)}function KG(z){return[z.extensionClipCullDistance?"#extension GL_ANGLE_clip_cull_distance : require":"",z.extensionMultiDraw?"#extension GL_ANGLE_multi_draw : require":""].filter(X1).join(`
`)}function WG(z){let J=[];for(let Q in z){let $=z[Q];if($===!1)continue;J.push("#define "+Q+" "+$)}return J.join(`
`)}function qG(z,J){let Q={},$=z.getProgramParameter(J,z.ACTIVE_ATTRIBUTES);for(let K=0;K<$;K++){let W=z.getActiveAttrib(J,K),q=W.name,B=1;if(W.type===z.FLOAT_MAT2)B=2;if(W.type===z.FLOAT_MAT3)B=3;if(W.type===z.FLOAT_MAT4)B=4;Q[q]={type:W.type,location:z.getAttribLocation(J,q),locationSize:B}}return Q}function X1(z){return z!==""}function K9(z,J){let Q=J.numSpotLightShadows+J.numSpotLightMaps-J.numSpotLightShadowsWithMaps;return z.replace(/NUM_DIR_LIGHTS/g,J.numDirLights).replace(/NUM_SPOT_LIGHTS/g,J.numSpotLights).replace(/NUM_SPOT_LIGHT_MAPS/g,J.numSpotLightMaps).replace(/NUM_SPOT_LIGHT_COORDS/g,Q).replace(/NUM_RECT_AREA_LIGHTS/g,J.numRectAreaLights).replace(/NUM_POINT_LIGHTS/g,J.numPointLights).replace(/NUM_HEMI_LIGHTS/g,J.numHemiLights).replace(/NUM_DIR_LIGHT_SHADOWS/g,J.numDirLightShadows).replace(/NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS/g,J.numSpotLightShadowsWithMaps).replace(/NUM_SPOT_LIGHT_SHADOWS/g,J.numSpotLightShadows).replace(/NUM_POINT_LIGHT_SHADOWS/g,J.numPointLightShadows)}function W9(z,J){return z.replace(/NUM_CLIPPING_PLANES/g,J.numClippingPlanes).replace(/UNION_CLIPPING_PLANES/g,J.numClippingPlanes-J.numClipIntersection)}var BG=/^[ \t]*#include +<([\w\d./]+)>/gm;function S6(z){return z.replace(BG,NG)}var GG=new Map;function NG(z,J){let Q=az[J];if(Q===void 0){let $=GG.get(J);if($!==void 0)Q=az[$],Bz('WebGLRenderer: Shader chunk "%s" has been deprecated. Use "%s" instead.',J,$);else throw Error("THREE.WebGLProgram: Can not resolve #include <"+J+">")}return S6(Q)}var DG=/#pragma unroll_loop_start\s+for\s*\(\s*int\s+i\s*=\s*(\d+)\s*;\s*i\s*<\s*(\d+)\s*;\s*i\s*\+\+\s*\)\s*{([\s\S]+?)}\s+#pragma unroll_loop_end/g;function q9(z){return z.replace(DG,ZG)}function ZG(z,J,Q,$){let K="";for(let W=parseInt(J);W<parseInt(Q);W++)K+=$.replace(/\[\s*i\s*\]/g,"[ "+W+" ]").replace(/UNROLLED_LOOP_INDEX/g,W);return K}function B9(z){let J=`precision ${z.precision} float;
	precision ${z.precision} int;
	precision ${z.precision} sampler2D;
	precision ${z.precision} samplerCube;
	precision ${z.precision} sampler3D;
	precision ${z.precision} sampler2DArray;
	precision ${z.precision} sampler2DShadow;
	precision ${z.precision} samplerCubeShadow;
	precision ${z.precision} sampler2DArrayShadow;
	precision ${z.precision} isampler2D;
	precision ${z.precision} isampler3D;
	precision ${z.precision} isamplerCube;
	precision ${z.precision} isampler2DArray;
	precision ${z.precision} usampler2D;
	precision ${z.precision} usampler3D;
	precision ${z.precision} usamplerCube;
	precision ${z.precision} usampler2DArray;
	`;if(z.precision==="highp")J+=`
#define HIGH_PRECISION`;else if(z.precision==="mediump")J+=`
#define MEDIUM_PRECISION`;else if(z.precision==="lowp")J+=`
#define LOW_PRECISION`;return J}var HG={[1]:"SHADOWMAP_TYPE_PCF",[3]:"SHADOWMAP_TYPE_VSM"};function UG(z){return HG[z.shadowMapType]||"SHADOWMAP_TYPE_BASIC"}var VG={[301]:"ENVMAP_TYPE_CUBE",[302]:"ENVMAP_TYPE_CUBE",[306]:"ENVMAP_TYPE_CUBE_UV"};function YG(z){if(z.envMap===!1)return"ENVMAP_TYPE_CUBE";return VG[z.envMapMode]||"ENVMAP_TYPE_CUBE"}var XG={[302]:"ENVMAP_MODE_REFRACTION"};function kG(z){if(z.envMap===!1)return"ENVMAP_MODE_REFLECTION";return XG[z.envMapMode]||"ENVMAP_MODE_REFLECTION"}var EG={[0]:"ENVMAP_BLENDING_MULTIPLY",[1]:"ENVMAP_BLENDING_MIX",[2]:"ENVMAP_BLENDING_ADD"};function IG(z){if(z.envMap===!1)return"ENVMAP_BLENDING_NONE";return EG[z.combine]||"ENVMAP_BLENDING_NONE"}function AG(z){let J=z.envMapCubeUVHeight;if(J===null)return null;let Q=Math.log2(J)-2,$=1/J;return{texelWidth:1/(3*Math.max(Math.pow(2,Q),112)),texelHeight:$,maxMip:Q}}function OG(z,J,Q,$){let K=z.getContext(),W=Q.defines,q=Q.vertexShader,B=Q.fragmentShader,G=UG(Q),N=YG(Q),Z=kG(Q),H=IG(Q),D=AG(Q),U=KG(Q),X=WG(W),k=K.createProgram(),Y,V,L=Q.glslVersion?"#version "+Q.glslVersion+`
`:"";if(Q.isRawShaderMaterial){if(Y=["#define SHADER_TYPE "+Q.shaderType,"#define SHADER_NAME "+Q.shaderName,X].filter(X1).join(`
`),Y.length>0)Y+=`
`;if(V=["#define SHADER_TYPE "+Q.shaderType,"#define SHADER_NAME "+Q.shaderName,X].filter(X1).join(`
`),V.length>0)V+=`
`}else Y=[B9(Q),"#define SHADER_TYPE "+Q.shaderType,"#define SHADER_NAME "+Q.shaderName,X,Q.extensionClipCullDistance?"#define USE_CLIP_DISTANCE":"",Q.batching?"#define USE_BATCHING":"",Q.batchingColor?"#define USE_BATCHING_COLOR":"",Q.instancing?"#define USE_INSTANCING":"",Q.instancingColor?"#define USE_INSTANCING_COLOR":"",Q.instancingMorph?"#define USE_INSTANCING_MORPH":"",Q.useFog&&Q.fog?"#define USE_FOG":"",Q.useFog&&Q.fogExp2?"#define FOG_EXP2":"",Q.map?"#define USE_MAP":"",Q.envMap?"#define USE_ENVMAP":"",Q.envMap?"#define "+Z:"",Q.lightMap?"#define USE_LIGHTMAP":"",Q.aoMap?"#define USE_AOMAP":"",Q.bumpMap?"#define USE_BUMPMAP":"",Q.normalMap?"#define USE_NORMALMAP":"",Q.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",Q.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",Q.displacementMap?"#define USE_DISPLACEMENTMAP":"",Q.emissiveMap?"#define USE_EMISSIVEMAP":"",Q.anisotropy?"#define USE_ANISOTROPY":"",Q.anisotropyMap?"#define USE_ANISOTROPYMAP":"",Q.clearcoatMap?"#define USE_CLEARCOATMAP":"",Q.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",Q.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",Q.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",Q.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",Q.specularMap?"#define USE_SPECULARMAP":"",Q.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",Q.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",Q.roughnessMap?"#define USE_ROUGHNESSMAP":"",Q.metalnessMap?"#define USE_METALNESSMAP":"",Q.alphaMap?"#define USE_ALPHAMAP":"",Q.alphaHash?"#define USE_ALPHAHASH":"",Q.transmission?"#define USE_TRANSMISSION":"",Q.transmissionMap?"#define USE_TRANSMISSIONMAP":"",Q.thicknessMap?"#define USE_THICKNESSMAP":"",Q.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",Q.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",Q.mapUv?"#define MAP_UV "+Q.mapUv:"",Q.alphaMapUv?"#define ALPHAMAP_UV "+Q.alphaMapUv:"",Q.lightMapUv?"#define LIGHTMAP_UV "+Q.lightMapUv:"",Q.aoMapUv?"#define AOMAP_UV "+Q.aoMapUv:"",Q.emissiveMapUv?"#define EMISSIVEMAP_UV "+Q.emissiveMapUv:"",Q.bumpMapUv?"#define BUMPMAP_UV "+Q.bumpMapUv:"",Q.normalMapUv?"#define NORMALMAP_UV "+Q.normalMapUv:"",Q.displacementMapUv?"#define DISPLACEMENTMAP_UV "+Q.displacementMapUv:"",Q.metalnessMapUv?"#define METALNESSMAP_UV "+Q.metalnessMapUv:"",Q.roughnessMapUv?"#define ROUGHNESSMAP_UV "+Q.roughnessMapUv:"",Q.anisotropyMapUv?"#define ANISOTROPYMAP_UV "+Q.anisotropyMapUv:"",Q.clearcoatMapUv?"#define CLEARCOATMAP_UV "+Q.clearcoatMapUv:"",Q.clearcoatNormalMapUv?"#define CLEARCOAT_NORMALMAP_UV "+Q.clearcoatNormalMapUv:"",Q.clearcoatRoughnessMapUv?"#define CLEARCOAT_ROUGHNESSMAP_UV "+Q.clearcoatRoughnessMapUv:"",Q.iridescenceMapUv?"#define IRIDESCENCEMAP_UV "+Q.iridescenceMapUv:"",Q.iridescenceThicknessMapUv?"#define IRIDESCENCE_THICKNESSMAP_UV "+Q.iridescenceThicknessMapUv:"",Q.sheenColorMapUv?"#define SHEEN_COLORMAP_UV "+Q.sheenColorMapUv:"",Q.sheenRoughnessMapUv?"#define SHEEN_ROUGHNESSMAP_UV "+Q.sheenRoughnessMapUv:"",Q.specularMapUv?"#define SPECULARMAP_UV "+Q.specularMapUv:"",Q.specularColorMapUv?"#define SPECULAR_COLORMAP_UV "+Q.specularColorMapUv:"",Q.specularIntensityMapUv?"#define SPECULAR_INTENSITYMAP_UV "+Q.specularIntensityMapUv:"",Q.transmissionMapUv?"#define TRANSMISSIONMAP_UV "+Q.transmissionMapUv:"",Q.thicknessMapUv?"#define THICKNESSMAP_UV "+Q.thicknessMapUv:"",Q.vertexTangents&&Q.flatShading===!1?"#define USE_TANGENT":"",Q.vertexNormals?"#define HAS_NORMAL":"",Q.vertexColors?"#define USE_COLOR":"",Q.vertexAlphas?"#define USE_COLOR_ALPHA":"",Q.vertexUv1s?"#define USE_UV1":"",Q.vertexUv2s?"#define USE_UV2":"",Q.vertexUv3s?"#define USE_UV3":"",Q.pointsUvs?"#define USE_POINTS_UV":"",Q.flatShading?"#define FLAT_SHADED":"",Q.skinning?"#define USE_SKINNING":"",Q.morphTargets?"#define USE_MORPHTARGETS":"",Q.morphNormals&&Q.flatShading===!1?"#define USE_MORPHNORMALS":"",Q.morphColors?"#define USE_MORPHCOLORS":"",Q.morphTargetsCount>0?"#define MORPHTARGETS_TEXTURE_STRIDE "+Q.morphTextureStride:"",Q.morphTargetsCount>0?"#define MORPHTARGETS_COUNT "+Q.morphTargetsCount:"",Q.doubleSided?"#define DOUBLE_SIDED":"",Q.flipSided?"#define FLIP_SIDED":"",Q.shadowMapEnabled?"#define USE_SHADOWMAP":"",Q.shadowMapEnabled?"#define "+G:"",Q.sizeAttenuation?"#define USE_SIZEATTENUATION":"",Q.numLightProbes>0?"#define USE_LIGHT_PROBES":"",Q.logarithmicDepthBuffer?"#define USE_LOGARITHMIC_DEPTH_BUFFER":"",Q.reversedDepthBuffer?"#define USE_REVERSED_DEPTH_BUFFER":"","uniform mat4 modelMatrix;","uniform mat4 modelViewMatrix;","uniform mat4 projectionMatrix;","uniform mat4 viewMatrix;","uniform mat3 normalMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;","#ifdef USE_INSTANCING","\tattribute mat4 instanceMatrix;","#endif","#ifdef USE_INSTANCING_COLOR","\tattribute vec3 instanceColor;","#endif","#ifdef USE_INSTANCING_MORPH","\tuniform sampler2D morphTexture;","#endif","attribute vec3 position;","attribute vec3 normal;","attribute vec2 uv;","#ifdef USE_UV1","\tattribute vec2 uv1;","#endif","#ifdef USE_UV2","\tattribute vec2 uv2;","#endif","#ifdef USE_UV3","\tattribute vec2 uv3;","#endif","#ifdef USE_TANGENT","\tattribute vec4 tangent;","#endif","#if defined( USE_COLOR_ALPHA )","\tattribute vec4 color;","#elif defined( USE_COLOR )","\tattribute vec3 color;","#endif","#ifdef USE_SKINNING","\tattribute vec4 skinIndex;","\tattribute vec4 skinWeight;","#endif",`
`].filter(X1).join(`
`),V=[B9(Q),"#define SHADER_TYPE "+Q.shaderType,"#define SHADER_NAME "+Q.shaderName,X,Q.useFog&&Q.fog?"#define USE_FOG":"",Q.useFog&&Q.fogExp2?"#define FOG_EXP2":"",Q.alphaToCoverage?"#define ALPHA_TO_COVERAGE":"",Q.map?"#define USE_MAP":"",Q.matcap?"#define USE_MATCAP":"",Q.envMap?"#define USE_ENVMAP":"",Q.envMap?"#define "+N:"",Q.envMap?"#define "+Z:"",Q.envMap?"#define "+H:"",D?"#define CUBEUV_TEXEL_WIDTH "+D.texelWidth:"",D?"#define CUBEUV_TEXEL_HEIGHT "+D.texelHeight:"",D?"#define CUBEUV_MAX_MIP "+D.maxMip+".0":"",Q.lightMap?"#define USE_LIGHTMAP":"",Q.aoMap?"#define USE_AOMAP":"",Q.bumpMap?"#define USE_BUMPMAP":"",Q.normalMap?"#define USE_NORMALMAP":"",Q.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",Q.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",Q.packedNormalMap?"#define USE_PACKED_NORMALMAP":"",Q.emissiveMap?"#define USE_EMISSIVEMAP":"",Q.anisotropy?"#define USE_ANISOTROPY":"",Q.anisotropyMap?"#define USE_ANISOTROPYMAP":"",Q.clearcoat?"#define USE_CLEARCOAT":"",Q.clearcoatMap?"#define USE_CLEARCOATMAP":"",Q.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",Q.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",Q.dispersion?"#define USE_DISPERSION":"",Q.iridescence?"#define USE_IRIDESCENCE":"",Q.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",Q.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",Q.specularMap?"#define USE_SPECULARMAP":"",Q.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",Q.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",Q.roughnessMap?"#define USE_ROUGHNESSMAP":"",Q.metalnessMap?"#define USE_METALNESSMAP":"",Q.alphaMap?"#define USE_ALPHAMAP":"",Q.alphaTest?"#define USE_ALPHATEST":"",Q.alphaHash?"#define USE_ALPHAHASH":"",Q.sheen?"#define USE_SHEEN":"",Q.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",Q.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",Q.transmission?"#define USE_TRANSMISSION":"",Q.transmissionMap?"#define USE_TRANSMISSIONMAP":"",Q.thicknessMap?"#define USE_THICKNESSMAP":"",Q.vertexTangents&&Q.flatShading===!1?"#define USE_TANGENT":"",Q.vertexColors||Q.instancingColor?"#define USE_COLOR":"",Q.vertexAlphas||Q.batchingColor?"#define USE_COLOR_ALPHA":"",Q.vertexUv1s?"#define USE_UV1":"",Q.vertexUv2s?"#define USE_UV2":"",Q.vertexUv3s?"#define USE_UV3":"",Q.pointsUvs?"#define USE_POINTS_UV":"",Q.gradientMap?"#define USE_GRADIENTMAP":"",Q.flatShading?"#define FLAT_SHADED":"",Q.doubleSided?"#define DOUBLE_SIDED":"",Q.flipSided?"#define FLIP_SIDED":"",Q.shadowMapEnabled?"#define USE_SHADOWMAP":"",Q.shadowMapEnabled?"#define "+G:"",Q.premultipliedAlpha?"#define PREMULTIPLIED_ALPHA":"",Q.numLightProbes>0?"#define USE_LIGHT_PROBES":"",Q.numLightProbeGrids>0?"#define USE_LIGHT_PROBES_GRID":"",Q.decodeVideoTexture?"#define DECODE_VIDEO_TEXTURE":"",Q.decodeVideoTextureEmissive?"#define DECODE_VIDEO_TEXTURE_EMISSIVE":"",Q.logarithmicDepthBuffer?"#define USE_LOGARITHMIC_DEPTH_BUFFER":"",Q.reversedDepthBuffer?"#define USE_REVERSED_DEPTH_BUFFER":"","uniform mat4 viewMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;",Q.toneMapping!==0?"#define TONE_MAPPING":"",Q.toneMapping!==0?az.tonemapping_pars_fragment:"",Q.toneMapping!==0?QG("toneMapping",Q.toneMapping):"",Q.dithering?"#define DITHERING":"",Q.opaque?"#define OPAQUE":"",az.colorspace_pars_fragment,zG("linearToOutputTexel",Q.outputColorSpace),$G(),Q.useDepthPacking?"#define DEPTH_PACKING "+Q.depthPacking:"",`
`].filter(X1).join(`
`);if(q=S6(q),q=K9(q,Q),q=W9(q,Q),B=S6(B),B=K9(B,Q),B=W9(B,Q),q=q9(q),B=q9(B),Q.isRawShaderMaterial!==!0)L=`#version 300 es
`,Y=[U,"#define attribute in","#define varying out","#define texture2D texture"].join(`
`)+`
`+Y,V=["#define varying in",Q.glslVersion==="300 es"?"":"layout(location = 0) out highp vec4 pc_fragColor;",Q.glslVersion==="300 es"?"":"#define gl_FragColor pc_fragColor","#define gl_FragDepthEXT gl_FragDepth","#define texture2D texture","#define textureCube texture","#define texture2DProj textureProj","#define texture2DLodEXT textureLod","#define texture2DProjLodEXT textureProjLod","#define textureCubeLodEXT textureLod","#define texture2DGradEXT textureGrad","#define texture2DProjGradEXT textureProjGrad","#define textureCubeGradEXT textureGrad"].join(`
`)+`
`+V;let O=L+Y+q,I=L+V+B,S=J9(K,K.VERTEX_SHADER,O),w=J9(K,K.FRAGMENT_SHADER,I);if(K.attachShader(k,S),K.attachShader(k,w),Q.index0AttributeName!==void 0)K.bindAttribLocation(k,0,Q.index0AttributeName);else if(Q.hasPositionAttribute===!0)K.bindAttribLocation(k,0,"position");K.linkProgram(k);function C(P){if(z.debug.checkShaderErrors){let p=K.getProgramInfoLog(k)||"",n=K.getShaderInfoLog(S)||"",j=K.getShaderInfoLog(w)||"",m=p.trim(),l=n.trim(),_=j.trim(),t=!0,$z=!0;if(K.getProgramParameter(k,K.LINK_STATUS)===!1)if(t=!1,typeof z.debug.onShaderError==="function")z.debug.onShaderError(K,k,S,w);else{let qz=$9(K,S,"vertex"),Cz=$9(K,w,"fragment");Pz("WebGLProgram: Shader Error "+K.getError()+" - VALIDATE_STATUS "+K.getProgramParameter(k,K.VALIDATE_STATUS)+`

Material Name: `+P.name+`
Material Type: `+P.type+`

Program Info Log: `+m+`
`+qz+`
`+Cz)}else if(m!=="")Bz("WebGLProgram: Program Info Log:",m);else if(l===""||_==="")$z=!1;if($z)P.diagnostics={runnable:t,programLog:m,vertexShader:{log:l,prefix:Y},fragmentShader:{log:_,prefix:V}}}K.deleteShader(S),K.deleteShader(w),E=new O1(K,k),F=qG(K,k)}let E;this.getUniforms=function(){if(E===void 0)C(this);return E};let F;this.getAttributes=function(){if(F===void 0)C(this);return F};let x=Q.rendererExtensionParallelShaderCompile===!1;return this.isReady=function(){if(x===!1)x=K.getProgramParameter(k,aB);return x},this.destroy=function(){$.releaseStatesOfProgram(this),K.deleteProgram(k),this.program=void 0},this.type=Q.shaderType,this.name=Q.shaderName,this.id=tB++,this.cacheKey=J,this.usedTimes=1,this.program=k,this.vertexShader=S,this.fragmentShader=w,this}var FG=0;class m${constructor(){this.shaderCache=new Map,this.materialCache=new Map}update(z,J,Q){let $=this._getShaderCacheForMaterial(z);if($.has(J)===!1)$.add(J),J.usedTimes++;if($.has(Q)===!1)$.add(Q),Q.usedTimes++;return this}remove(z){let J=this.materialCache.get(z);for(let Q of J)if(Q.usedTimes--,Q.usedTimes===0)this.shaderCache.delete(Q.code);return this.materialCache.delete(z),this}getVertexShaderStage(z){return this._getShaderStage(z.vertexShader)}getFragmentShaderStage(z){return this._getShaderStage(z.fragmentShader)}dispose(){this.shaderCache.clear(),this.materialCache.clear()}_getShaderCacheForMaterial(z){let J=this.materialCache,Q=J.get(z);if(Q===void 0)Q=new Set,J.set(z,Q);return Q}_getShaderStage(z){let J=this.shaderCache,Q=J.get(z);if(Q===void 0)Q=new c$(z),J.set(z,Q);return Q}}class c${constructor(z){this.id=FG++,this.code=z,this.usedTimes=0}}function MG(z){return z===1030||z===37490||z===36285}function LG(z,J,Q,$,K,W){let q=new R1,B=new m$,G=new Set,N=[],Z=new Map,H=$.logarithmicDepthBuffer,D=$.precision,U={MeshDepthMaterial:"depth",MeshDistanceMaterial:"distance",MeshNormalMaterial:"normal",MeshBasicMaterial:"basic",MeshLambertMaterial:"lambert",MeshPhongMaterial:"phong",MeshToonMaterial:"toon",MeshStandardMaterial:"physical",MeshPhysicalMaterial:"physical",MeshMatcapMaterial:"matcap",LineBasicMaterial:"basic",LineDashedMaterial:"dashed",PointsMaterial:"points",ShadowMaterial:"shadow",SpriteMaterial:"sprite"};function X(E){if(G.add(E),E===0)return"uv";return`uv${E}`}function k(E,F,x,P,p,n){let j=P.fog,m=p.geometry,l=E.isMeshStandardMaterial||E.isMeshLambertMaterial||E.isMeshPhongMaterial?P.environment:null,_=E.isMeshStandardMaterial||E.isMeshLambertMaterial&&!E.envMap||E.isMeshPhongMaterial&&!E.envMap,t=J.get(E.envMap||l,_),$z=!!t&&t.mapping===306?t.image.height:null,qz=U[E.type];if(E.precision!==null){if(D=$.getMaxPrecision(E.precision),D!==E.precision)Bz("WebGLProgram.getParameters:",E.precision,"not supported, using",D,"instead.")}let Cz=m.morphAttributes.position||m.morphAttributes.normal||m.morphAttributes.color,Az=Cz!==void 0?Cz.length:0,NJ=0;if(m.morphAttributes.position!==void 0)NJ=1;if(m.morphAttributes.normal!==void 0)NJ=2;if(m.morphAttributes.color!==void 0)NJ=3;let qJ,s,Gz,Oz;if(qz){let oz=BQ[qz];qJ=oz.vertexShader,s=oz.fragmentShader}else{qJ=E.vertexShader,s=E.fragmentShader;let oz=B.getVertexShaderStage(E),EJ=B.getFragmentShaderStage(E);B.update(E,oz,EJ),Gz=oz.id,Oz=EJ.id}let Zz=z.getRenderTarget(),jz=z.state.buffers.depth.getReversed(),JJ=p.isInstancedMesh===!0,uz=p.isBatchedMesh===!0,gz=!!E.map,r=!!E.matcap,Qz=!!t,Jz=!!E.aoMap,Ez=!!E.lightMap,Mz=!!E.bumpMap&&E.wireframe===!1,vz=!!E.normalMap,Tz=!!E.displacementMap,cz=!!E.emissiveMap,nz=!!E.metalnessMap,v=!!E.roughnessMap,UJ=E.anisotropy>0,ez=E.clearcoat>0,tz=E.dispersion>0,y=E.iridescence>0,A=E.sheen>0,f=E.transmission>0,u=UJ&&!!E.anisotropyMap,e=ez&&!!E.clearcoatMap,Kz=ez&&!!E.clearcoatNormalMap,Dz=ez&&!!E.clearcoatRoughnessMap,c=y&&!!E.iridescenceMap,i=y&&!!E.iridescenceThicknessMap,Iz=A&&!!E.sheenColorMap,fz=A&&!!E.sheenRoughnessMap,Yz=!!E.specularMap,Wz=!!E.specularColorMap,_z=!!E.specularIntensityMap,bz=f&&!!E.transmissionMap,WJ=f&&!!E.thicknessMap,T=!!E.gradientMap,Nz=!!E.alphaMap,o=E.alphaTest>0,Hz=!!E.alphaHash,Lz=!!E.extensions,zz=0;if(E.toneMapped){if(Zz===null||Zz.isXRRenderTarget===!0)zz=z.toneMapping}let Uz={shaderID:qz,shaderType:E.type,shaderName:E.name,vertexShader:qJ,fragmentShader:s,defines:E.defines,customVertexShaderID:Gz,customFragmentShaderID:Oz,isRawShaderMaterial:E.isRawShaderMaterial===!0,glslVersion:E.glslVersion,precision:D,batching:uz,batchingColor:uz&&p._colorsTexture!==null,instancing:JJ,instancingColor:JJ&&p.instanceColor!==null,instancingMorph:JJ&&p.morphTexture!==null,outputColorSpace:Zz===null?z.outputColorSpace:Zz.isXRRenderTarget===!0?Zz.texture.colorSpace:zJ.workingColorSpace,alphaToCoverage:!!E.alphaToCoverage,map:gz,matcap:r,envMap:Qz,envMapMode:Qz&&t.mapping,envMapCubeUVHeight:$z,aoMap:Jz,lightMap:Ez,bumpMap:Mz,normalMap:vz,displacementMap:Tz,emissiveMap:cz,normalMapObjectSpace:vz&&E.normalMapType===1,normalMapTangentSpace:vz&&E.normalMapType===0,packedNormalMap:vz&&E.normalMapType===0&&MG(E.normalMap.format),metalnessMap:nz,roughnessMap:v,anisotropy:UJ,anisotropyMap:u,clearcoat:ez,clearcoatMap:e,clearcoatNormalMap:Kz,clearcoatRoughnessMap:Dz,dispersion:tz,iridescence:y,iridescenceMap:c,iridescenceThicknessMap:i,sheen:A,sheenColorMap:Iz,sheenRoughnessMap:fz,specularMap:Yz,specularColorMap:Wz,specularIntensityMap:_z,transmission:f,transmissionMap:bz,thicknessMap:WJ,gradientMap:T,opaque:E.transparent===!1&&E.blending===1&&E.alphaToCoverage===!1,alphaMap:Nz,alphaTest:o,alphaHash:Hz,combine:E.combine,mapUv:gz&&X(E.map.channel),aoMapUv:Jz&&X(E.aoMap.channel),lightMapUv:Ez&&X(E.lightMap.channel),bumpMapUv:Mz&&X(E.bumpMap.channel),normalMapUv:vz&&X(E.normalMap.channel),displacementMapUv:Tz&&X(E.displacementMap.channel),emissiveMapUv:cz&&X(E.emissiveMap.channel),metalnessMapUv:nz&&X(E.metalnessMap.channel),roughnessMapUv:v&&X(E.roughnessMap.channel),anisotropyMapUv:u&&X(E.anisotropyMap.channel),clearcoatMapUv:e&&X(E.clearcoatMap.channel),clearcoatNormalMapUv:Kz&&X(E.clearcoatNormalMap.channel),clearcoatRoughnessMapUv:Dz&&X(E.clearcoatRoughnessMap.channel),iridescenceMapUv:c&&X(E.iridescenceMap.channel),iridescenceThicknessMapUv:i&&X(E.iridescenceThicknessMap.channel),sheenColorMapUv:Iz&&X(E.sheenColorMap.channel),sheenRoughnessMapUv:fz&&X(E.sheenRoughnessMap.channel),specularMapUv:Yz&&X(E.specularMap.channel),specularColorMapUv:Wz&&X(E.specularColorMap.channel),specularIntensityMapUv:_z&&X(E.specularIntensityMap.channel),transmissionMapUv:bz&&X(E.transmissionMap.channel),thicknessMapUv:WJ&&X(E.thicknessMap.channel),alphaMapUv:Nz&&X(E.alphaMap.channel),vertexTangents:!!m.attributes.tangent&&(vz||UJ),vertexNormals:!!m.attributes.normal,vertexColors:E.vertexColors,vertexAlphas:E.vertexColors===!0&&!!m.attributes.color&&m.attributes.color.itemSize===4,pointsUvs:p.isPoints===!0&&!!m.attributes.uv&&(gz||Nz),fog:!!j,useFog:E.fog===!0,fogExp2:!!j&&j.isFogExp2,flatShading:E.wireframe===!1&&(E.flatShading===!0||m.attributes.normal===void 0&&vz===!1&&(E.isMeshLambertMaterial||E.isMeshPhongMaterial||E.isMeshStandardMaterial||E.isMeshPhysicalMaterial)),sizeAttenuation:E.sizeAttenuation===!0,logarithmicDepthBuffer:H,reversedDepthBuffer:jz,skinning:p.isSkinnedMesh===!0,hasPositionAttribute:m.attributes.position!==void 0,morphTargets:m.morphAttributes.position!==void 0,morphNormals:m.morphAttributes.normal!==void 0,morphColors:m.morphAttributes.color!==void 0,morphTargetsCount:Az,morphTextureStride:NJ,numDirLights:F.directional.length,numPointLights:F.point.length,numSpotLights:F.spot.length,numSpotLightMaps:F.spotLightMap.length,numRectAreaLights:F.rectArea.length,numHemiLights:F.hemi.length,numDirLightShadows:F.directionalShadowMap.length,numPointLightShadows:F.pointShadowMap.length,numSpotLightShadows:F.spotShadowMap.length,numSpotLightShadowsWithMaps:F.numSpotLightShadowsWithMaps,numLightProbes:F.numLightProbes,numLightProbeGrids:n.length,numClippingPlanes:W.numPlanes,numClipIntersection:W.numIntersection,dithering:E.dithering,shadowMapEnabled:z.shadowMap.enabled&&x.length>0,shadowMapType:z.shadowMap.type,toneMapping:zz,decodeVideoTexture:gz&&E.map.isVideoTexture===!0&&zJ.getTransfer(E.map.colorSpace)==="srgb",decodeVideoTextureEmissive:cz&&E.emissiveMap.isVideoTexture===!0&&zJ.getTransfer(E.emissiveMap.colorSpace)==="srgb",premultipliedAlpha:E.premultipliedAlpha,doubleSided:E.side===2,flipSided:E.side===1,useDepthPacking:E.depthPacking>=0,depthPacking:E.depthPacking||0,index0AttributeName:E.index0AttributeName,extensionClipCullDistance:Lz&&E.extensions.clipCullDistance===!0&&Q.has("WEBGL_clip_cull_distance"),extensionMultiDraw:(Lz&&E.extensions.multiDraw===!0||uz)&&Q.has("WEBGL_multi_draw"),rendererExtensionParallelShaderCompile:Q.has("KHR_parallel_shader_compile"),customProgramCacheKey:E.customProgramCacheKey()};return Uz.vertexUv1s=G.has(1),Uz.vertexUv2s=G.has(2),Uz.vertexUv3s=G.has(3),G.clear(),Uz}function Y(E){let F=[];if(E.shaderID)F.push(E.shaderID);else F.push(E.customVertexShaderID),F.push(E.customFragmentShaderID);if(E.defines!==void 0)for(let x in E.defines)F.push(x),F.push(E.defines[x]);if(E.isRawShaderMaterial===!1)V(F,E),L(F,E),F.push(z.outputColorSpace);return F.push(E.customProgramCacheKey),F.join()}function V(E,F){E.push(F.precision),E.push(F.outputColorSpace),E.push(F.envMapMode),E.push(F.envMapCubeUVHeight),E.push(F.mapUv),E.push(F.alphaMapUv),E.push(F.lightMapUv),E.push(F.aoMapUv),E.push(F.bumpMapUv),E.push(F.normalMapUv),E.push(F.displacementMapUv),E.push(F.emissiveMapUv),E.push(F.metalnessMapUv),E.push(F.roughnessMapUv),E.push(F.anisotropyMapUv),E.push(F.clearcoatMapUv),E.push(F.clearcoatNormalMapUv),E.push(F.clearcoatRoughnessMapUv),E.push(F.iridescenceMapUv),E.push(F.iridescenceThicknessMapUv),E.push(F.sheenColorMapUv),E.push(F.sheenRoughnessMapUv),E.push(F.specularMapUv),E.push(F.specularColorMapUv),E.push(F.specularIntensityMapUv),E.push(F.transmissionMapUv),E.push(F.thicknessMapUv),E.push(F.combine),E.push(F.fogExp2),E.push(F.sizeAttenuation),E.push(F.morphTargetsCount),E.push(F.morphAttributeCount),E.push(F.numDirLights),E.push(F.numPointLights),E.push(F.numSpotLights),E.push(F.numSpotLightMaps),E.push(F.numHemiLights),E.push(F.numRectAreaLights),E.push(F.numDirLightShadows),E.push(F.numPointLightShadows),E.push(F.numSpotLightShadows),E.push(F.numSpotLightShadowsWithMaps),E.push(F.numLightProbes),E.push(F.shadowMapType),E.push(F.toneMapping),E.push(F.numClippingPlanes),E.push(F.numClipIntersection),E.push(F.depthPacking)}function L(E,F){if(q.disableAll(),F.instancing)q.enable(0);if(F.instancingColor)q.enable(1);if(F.instancingMorph)q.enable(2);if(F.matcap)q.enable(3);if(F.envMap)q.enable(4);if(F.normalMapObjectSpace)q.enable(5);if(F.normalMapTangentSpace)q.enable(6);if(F.clearcoat)q.enable(7);if(F.iridescence)q.enable(8);if(F.alphaTest)q.enable(9);if(F.vertexColors)q.enable(10);if(F.vertexAlphas)q.enable(11);if(F.vertexUv1s)q.enable(12);if(F.vertexUv2s)q.enable(13);if(F.vertexUv3s)q.enable(14);if(F.vertexTangents)q.enable(15);if(F.anisotropy)q.enable(16);if(F.alphaHash)q.enable(17);if(F.batching)q.enable(18);if(F.dispersion)q.enable(19);if(F.batchingColor)q.enable(20);if(F.gradientMap)q.enable(21);if(F.packedNormalMap)q.enable(22);if(F.vertexNormals)q.enable(23);if(E.push(q.mask),q.disableAll(),F.fog)q.enable(0);if(F.useFog)q.enable(1);if(F.flatShading)q.enable(2);if(F.logarithmicDepthBuffer)q.enable(3);if(F.reversedDepthBuffer)q.enable(4);if(F.skinning)q.enable(5);if(F.morphTargets)q.enable(6);if(F.morphNormals)q.enable(7);if(F.morphColors)q.enable(8);if(F.premultipliedAlpha)q.enable(9);if(F.shadowMapEnabled)q.enable(10);if(F.doubleSided)q.enable(11);if(F.flipSided)q.enable(12);if(F.useDepthPacking)q.enable(13);if(F.dithering)q.enable(14);if(F.transmission)q.enable(15);if(F.sheen)q.enable(16);if(F.opaque)q.enable(17);if(F.pointsUvs)q.enable(18);if(F.decodeVideoTexture)q.enable(19);if(F.decodeVideoTextureEmissive)q.enable(20);if(F.alphaToCoverage)q.enable(21);if(F.numLightProbeGrids>0)q.enable(22);if(F.hasPositionAttribute)q.enable(23);E.push(q.mask)}function O(E){let F=U[E.type],x;if(F){let P=BQ[F];x=d9.clone(P.uniforms)}else x=E.uniforms;return x}function I(E,F){let x=Z.get(F);if(x!==void 0)++x.usedTimes;else x=new OG(z,F,E,K),N.push(x),Z.set(F,x);return x}function S(E){if(--E.usedTimes===0){let F=N.indexOf(E);N[F]=N[N.length-1],N.pop(),Z.delete(E.cacheKey),E.destroy()}}function w(E){B.remove(E)}function C(){B.dispose()}return{getParameters:k,getProgramCacheKey:Y,getUniforms:O,acquireProgram:I,releaseProgram:S,releaseShaderCache:w,programs:N,dispose:C}}function yG(){let z=new WeakMap;function J(q){return z.has(q)}function Q(q){let B=z.get(q);if(B===void 0)B={},z.set(q,B);return B}function $(q){z.delete(q)}function K(q,B,G){z.get(q)[B]=G}function W(){z=new WeakMap}return{has:J,get:Q,remove:$,update:K,dispose:W}}function SG(z,J){if(z.groupOrder!==J.groupOrder)return z.groupOrder-J.groupOrder;else if(z.renderOrder!==J.renderOrder)return z.renderOrder-J.renderOrder;else if(z.material.id!==J.material.id)return z.material.id-J.material.id;else if(z.materialVariant!==J.materialVariant)return z.materialVariant-J.materialVariant;else if(z.z!==J.z)return z.z-J.z;else return z.id-J.id}function G9(z,J){if(z.groupOrder!==J.groupOrder)return z.groupOrder-J.groupOrder;else if(z.renderOrder!==J.renderOrder)return z.renderOrder-J.renderOrder;else if(z.z!==J.z)return J.z-z.z;else return z.id-J.id}function N9(){let z=[],J=0,Q=[],$=[],K=[];function W(){J=0,Q.length=0,$.length=0,K.length=0}function q(D){let U=0;if(D.isInstancedMesh)U+=2;if(D.isSkinnedMesh)U+=1;return U}function B(D,U,X,k,Y,V){let L=z[J];if(L===void 0)L={id:D.id,object:D,geometry:U,material:X,materialVariant:q(D),groupOrder:k,renderOrder:D.renderOrder,z:Y,group:V},z[J]=L;else L.id=D.id,L.object=D,L.geometry=U,L.material=X,L.materialVariant=q(D),L.groupOrder=k,L.renderOrder=D.renderOrder,L.z=Y,L.group=V;return J++,L}function G(D,U,X,k,Y,V){let L=B(D,U,X,k,Y,V);if(X.transmission>0)$.push(L);else if(X.transparent===!0)K.push(L);else Q.push(L)}function N(D,U,X,k,Y,V){let L=B(D,U,X,k,Y,V);if(X.transmission>0)$.unshift(L);else if(X.transparent===!0)K.unshift(L);else Q.unshift(L)}function Z(D,U,X){if(Q.length>1)Q.sort(D||SG);if($.length>1)$.sort(U||G9);if(K.length>1)K.sort(U||G9);if(X)Q.reverse(),$.reverse(),K.reverse()}function H(){for(let D=J,U=z.length;D<U;D++){let X=z[D];if(X.id===null)break;X.id=null,X.object=null,X.geometry=null,X.material=null,X.group=null}}return{opaque:Q,transmissive:$,transparent:K,init:W,push:G,unshift:N,finish:H,sort:Z}}function wG(){let z=new WeakMap;function J($,K){let W=z.get($),q;if(W===void 0)q=new N9,z.set($,[q]);else if(K>=W.length)q=new N9,W.push(q);else q=W[K];return q}function Q(){z=new WeakMap}return{get:J,dispose:Q}}function CG(){let z={};return{get:function(J){if(z[J.id]!==void 0)return z[J.id];let Q;switch(J.type){case"DirectionalLight":Q={direction:new R,color:new Fz};break;case"SpotLight":Q={position:new R,direction:new R,color:new Fz,distance:0,coneCos:0,penumbraCos:0,decay:0};break;case"PointLight":Q={position:new R,color:new Fz,distance:0,decay:0};break;case"HemisphereLight":Q={direction:new R,skyColor:new Fz,groundColor:new Fz};break;case"RectAreaLight":Q={color:new Fz,position:new R,halfWidth:new R,halfHeight:new R};break}return z[J.id]=Q,Q}}}function RG(){let z={};return{get:function(J){if(z[J.id]!==void 0)return z[J.id];let Q;switch(J.type){case"DirectionalLight":Q={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new a};break;case"SpotLight":Q={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new a};break;case"PointLight":Q={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new a,shadowCameraNear:1,shadowCameraFar:1000};break}return z[J.id]=Q,Q}}}var PG=0;function vG(z,J){return(J.castShadow?2:0)-(z.castShadow?2:0)+(J.map?1:0)-(z.map?1:0)}function fG(z){let J=new CG,Q=RG(),$={version:0,hash:{directionalLength:-1,pointLength:-1,spotLength:-1,rectAreaLength:-1,hemiLength:-1,numDirectionalShadows:-1,numPointShadows:-1,numSpotShadows:-1,numSpotMaps:-1,numLightProbes:-1},ambient:[0,0,0],probe:[],directional:[],directionalShadow:[],directionalShadowMap:[],directionalShadowMatrix:[],spot:[],spotLightMap:[],spotShadow:[],spotShadowMap:[],spotLightMatrix:[],rectArea:[],rectAreaLTC1:null,rectAreaLTC2:null,point:[],pointShadow:[],pointShadowMap:[],pointShadowMatrix:[],hemi:[],numSpotLightShadowsWithMaps:0,numLightProbes:0};for(let N=0;N<9;N++)$.probe.push(new R);let K=new R,W=new pz,q=new pz;function B(N){let Z=0,H=0,D=0;for(let F=0;F<9;F++)$.probe[F].set(0,0,0);let U=0,X=0,k=0,Y=0,V=0,L=0,O=0,I=0,S=0,w=0,C=0;N.sort(vG);for(let F=0,x=N.length;F<x;F++){let P=N[F],p=P.color,n=P.intensity,j=P.distance,m=null;if(P.shadow&&P.shadow.map)if(P.shadow.map.texture.format===1030)m=P.shadow.map.texture;else m=P.shadow.map.depthTexture||P.shadow.map.texture;if(P.isAmbientLight)Z+=p.r*n,H+=p.g*n,D+=p.b*n;else if(P.isLightProbe){for(let l=0;l<9;l++)$.probe[l].addScaledVector(P.sh.coefficients[l],n);C++}else if(P.isDirectionalLight){let l=J.get(P);if(l.color.copy(P.color).multiplyScalar(P.intensity),P.castShadow){let _=P.shadow,t=Q.get(P);t.shadowIntensity=_.intensity,t.shadowBias=_.bias,t.shadowNormalBias=_.normalBias,t.shadowRadius=_.radius,t.shadowMapSize=_.mapSize,$.directionalShadow[U]=t,$.directionalShadowMap[U]=m,$.directionalShadowMatrix[U]=P.shadow.matrix,L++}$.directional[U]=l,U++}else if(P.isSpotLight){let l=J.get(P);l.position.setFromMatrixPosition(P.matrixWorld),l.color.copy(p).multiplyScalar(n),l.distance=j,l.coneCos=Math.cos(P.angle),l.penumbraCos=Math.cos(P.angle*(1-P.penumbra)),l.decay=P.decay,$.spot[k]=l;let _=P.shadow;if(P.map){if($.spotLightMap[S]=P.map,S++,_.updateMatrices(P),P.castShadow)w++}if($.spotLightMatrix[k]=_.matrix,P.castShadow){let t=Q.get(P);t.shadowIntensity=_.intensity,t.shadowBias=_.bias,t.shadowNormalBias=_.normalBias,t.shadowRadius=_.radius,t.shadowMapSize=_.mapSize,$.spotShadow[k]=t,$.spotShadowMap[k]=m,I++}k++}else if(P.isRectAreaLight){let l=J.get(P);l.color.copy(p).multiplyScalar(n),l.halfWidth.set(P.width*0.5,0,0),l.halfHeight.set(0,P.height*0.5,0),$.rectArea[Y]=l,Y++}else if(P.isPointLight){let l=J.get(P);if(l.color.copy(P.color).multiplyScalar(P.intensity),l.distance=P.distance,l.decay=P.decay,P.castShadow){let _=P.shadow,t=Q.get(P);t.shadowIntensity=_.intensity,t.shadowBias=_.bias,t.shadowNormalBias=_.normalBias,t.shadowRadius=_.radius,t.shadowMapSize=_.mapSize,t.shadowCameraNear=_.camera.near,t.shadowCameraFar=_.camera.far,$.pointShadow[X]=t,$.pointShadowMap[X]=m,$.pointShadowMatrix[X]=P.shadow.matrix,O++}$.point[X]=l,X++}else if(P.isHemisphereLight){let l=J.get(P);l.skyColor.copy(P.color).multiplyScalar(n),l.groundColor.copy(P.groundColor).multiplyScalar(n),$.hemi[V]=l,V++}}if(Y>0)if(z.has("OES_texture_float_linear")===!0)$.rectAreaLTC1=Vz.LTC_FLOAT_1,$.rectAreaLTC2=Vz.LTC_FLOAT_2;else $.rectAreaLTC1=Vz.LTC_HALF_1,$.rectAreaLTC2=Vz.LTC_HALF_2;$.ambient[0]=Z,$.ambient[1]=H,$.ambient[2]=D;let E=$.hash;if(E.directionalLength!==U||E.pointLength!==X||E.spotLength!==k||E.rectAreaLength!==Y||E.hemiLength!==V||E.numDirectionalShadows!==L||E.numPointShadows!==O||E.numSpotShadows!==I||E.numSpotMaps!==S||E.numLightProbes!==C)$.directional.length=U,$.spot.length=k,$.rectArea.length=Y,$.point.length=X,$.hemi.length=V,$.directionalShadow.length=L,$.directionalShadowMap.length=L,$.pointShadow.length=O,$.pointShadowMap.length=O,$.spotShadow.length=I,$.spotShadowMap.length=I,$.directionalShadowMatrix.length=L,$.pointShadowMatrix.length=O,$.spotLightMatrix.length=I+S-w,$.spotLightMap.length=S,$.numSpotLightShadowsWithMaps=w,$.numLightProbes=C,E.directionalLength=U,E.pointLength=X,E.spotLength=k,E.rectAreaLength=Y,E.hemiLength=V,E.numDirectionalShadows=L,E.numPointShadows=O,E.numSpotShadows=I,E.numSpotMaps=S,E.numLightProbes=C,$.version=PG++}function G(N,Z){let H=0,D=0,U=0,X=0,k=0,Y=Z.matrixWorldInverse;for(let V=0,L=N.length;V<L;V++){let O=N[V];if(O.isDirectionalLight){let I=$.directional[H];I.direction.setFromMatrixPosition(O.matrixWorld),K.setFromMatrixPosition(O.target.matrixWorld),I.direction.sub(K),I.direction.transformDirection(Y),H++}else if(O.isSpotLight){let I=$.spot[U];I.position.setFromMatrixPosition(O.matrixWorld),I.position.applyMatrix4(Y),I.direction.setFromMatrixPosition(O.matrixWorld),K.setFromMatrixPosition(O.target.matrixWorld),I.direction.sub(K),I.direction.transformDirection(Y),U++}else if(O.isRectAreaLight){let I=$.rectArea[X];I.position.setFromMatrixPosition(O.matrixWorld),I.position.applyMatrix4(Y),q.identity(),W.copy(O.matrixWorld),W.premultiply(Y),q.extractRotation(W),I.halfWidth.set(O.width*0.5,0,0),I.halfHeight.set(0,O.height*0.5,0),I.halfWidth.applyMatrix4(q),I.halfHeight.applyMatrix4(q),X++}else if(O.isPointLight){let I=$.point[D];I.position.setFromMatrixPosition(O.matrixWorld),I.position.applyMatrix4(Y),D++}else if(O.isHemisphereLight){let I=$.hemi[k];I.direction.setFromMatrixPosition(O.matrixWorld),I.direction.transformDirection(Y),k++}}}return{setup:B,setupView:G,state:$}}function D9(z){let J=new fG(z),Q=[],$=[],K=[];function W(D){H.camera=D,Q.length=0,$.length=0,K.length=0}function q(D){Q.push(D)}function B(D){$.push(D)}function G(D){K.push(D)}function N(){J.setup(Q)}function Z(D){J.setupView(Q,D)}let H={lightsArray:Q,shadowsArray:$,lightProbeGridArray:K,camera:null,lights:J,transmissionRenderTarget:{},textureUnits:0};return{init:W,state:H,setupLights:N,setupLightsView:Z,pushLight:q,pushShadow:B,pushLightProbeGrid:G}}function TG(z){let J=new WeakMap;function Q(K,W=0){let q=J.get(K),B;if(q===void 0)B=new D9(z),J.set(K,[B]);else if(W>=q.length)B=new D9(z),q.push(B);else B=q[W];return B}function $(){J=new WeakMap}return{get:Q,dispose:$}}var hG=`void main() {
	gl_Position = vec4( position, 1.0 );
}`,xG=`uniform sampler2D shadow_pass;
uniform vec2 resolution;
uniform float radius;
void main() {
	const float samples = float( VSM_SAMPLES );
	float mean = 0.0;
	float squared_mean = 0.0;
	float uvStride = samples <= 1.0 ? 0.0 : 2.0 / ( samples - 1.0 );
	float uvStart = samples <= 1.0 ? 0.0 : - 1.0;
	for ( float i = 0.0; i < samples; i ++ ) {
		float uvOffset = uvStart + i * uvStride;
		#ifdef HORIZONTAL_PASS
			vec2 distribution = texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( uvOffset, 0.0 ) * radius ) / resolution ).rg;
			mean += distribution.x;
			squared_mean += distribution.y * distribution.y + distribution.x * distribution.x;
		#else
			float depth = texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( 0.0, uvOffset ) * radius ) / resolution ).r;
			mean += depth;
			squared_mean += depth * depth;
		#endif
	}
	mean = mean / samples;
	squared_mean = squared_mean / samples;
	float std_dev = sqrt( max( 0.0, squared_mean - mean * mean ) );
	gl_FragColor = vec4( mean, std_dev, 0.0, 1.0 );
}`,jG=[new R(1,0,0),new R(-1,0,0),new R(0,1,0),new R(0,-1,0),new R(0,0,1),new R(0,0,-1)],_G=[new R(0,-1,0),new R(0,-1,0),new R(0,0,1),new R(0,0,-1),new R(0,-1,0),new R(0,-1,0)],Z9=new pz,U1=new R,E6=new R;function bG(z,J,Q){let $=new mQ,K=new a,W=new a,q=new BJ,B=new V5,G=new Y5,N={},Z=Q.maxTextureSize,H={[0]:1,[1]:0,[2]:2},D=new rJ({defines:{VSM_SAMPLES:8},uniforms:{shadow_pass:{value:null},resolution:{value:new a},radius:{value:4}},vertexShader:hG,fragmentShader:xG}),U=D.clone();U.defines.HORIZONTAL_PASS=1;let X=new mz;X.setAttribute("position",new GJ(new Float32Array([-1,-1,0.5,3,-1,0.5,-1,3,0.5]),3));let k=new LJ(X,D),Y=this;this.enabled=!1,this.autoUpdate=!0,this.needsUpdate=!1,this.type=1;let V=this.type;this.render=function(w,C,E){if(Y.enabled===!1)return;if(Y.autoUpdate===!1&&Y.needsUpdate===!1)return;if(w.length===0)return;if(this.type===2)Bz("WebGLShadowMap: PCFSoftShadowMap has been deprecated. Using PCFShadowMap instead."),this.type=1;let F=z.getRenderTarget(),x=z.getActiveCubeFace(),P=z.getActiveMipmapLevel(),p=z.state;if(p.setBlending(0),p.buffers.depth.getReversed()===!0)p.buffers.color.setClear(0,0,0,0);else p.buffers.color.setClear(1,1,1,1);p.buffers.depth.setTest(!0),p.setScissorTest(!1);let n=V!==this.type;if(n)C.traverse(function(j){if(j.material)if(Array.isArray(j.material))j.material.forEach((m)=>m.needsUpdate=!0);else j.material.needsUpdate=!0});for(let j=0,m=w.length;j<m;j++){let l=w[j],_=l.shadow;if(_===void 0){Bz("WebGLShadowMap:",l,"has no shadow.");continue}if(_.autoUpdate===!1&&_.needsUpdate===!1)continue;K.copy(_.mapSize);let t=_.getFrameExtents();if(K.multiply(t),W.copy(_.mapSize),K.x>Z||K.y>Z){if(K.x>Z)W.x=Math.floor(Z/t.x),K.x=W.x*t.x,_.mapSize.x=W.x;if(K.y>Z)W.y=Math.floor(Z/t.y),K.y=W.y*t.y,_.mapSize.y=W.y}let $z=z.state.buffers.depth.getReversed();if(_.camera._reversedDepth=$z,_.map===null||n===!0){if(_.map!==null){if(_.map.depthTexture!==null)_.map.depthTexture.dispose(),_.map.depthTexture=null;_.map.dispose()}if(this.type===3){if(l.isPointLight){Bz("WebGLShadowMap: VSM shadow maps are not supported for PointLights. Use PCF or BasicShadowMap instead.");continue}_.map=new nJ(K.x,K.y,{format:1030,type:1016,minFilter:1006,magFilter:1006,generateMipmaps:!1}),_.map.texture.name=l.name+".shadowMap",_.map.depthTexture=new cQ(K.x,K.y,1015),_.map.depthTexture.name=l.name+".shadowMapDepth",_.map.depthTexture.format=1026,_.map.depthTexture.compareFunction=null,_.map.depthTexture.minFilter=1003,_.map.depthTexture.magFilter=1003}else{if(l.isPointLight)_.map=new y5(K.x),_.map.depthTexture=new b6(K.x,1014);else _.map=new nJ(K.x,K.y),_.map.depthTexture=new cQ(K.x,K.y,1014);if(_.map.depthTexture.name=l.name+".shadowMap",_.map.depthTexture.format=1026,this.type===1)_.map.depthTexture.compareFunction=$z?518:515,_.map.depthTexture.minFilter=1006,_.map.depthTexture.magFilter=1006;else _.map.depthTexture.compareFunction=null,_.map.depthTexture.minFilter=1003,_.map.depthTexture.magFilter=1003}_.camera.updateProjectionMatrix()}let qz=_.map.isWebGLCubeRenderTarget?6:1;for(let Cz=0;Cz<qz;Cz++){if(_.map.isWebGLCubeRenderTarget)z.setRenderTarget(_.map,Cz),z.clear();else{if(Cz===0)z.setRenderTarget(_.map),z.clear();let Az=_.getViewport(Cz);q.set(W.x*Az.x,W.y*Az.y,W.x*Az.z,W.y*Az.w),p.viewport(q)}if(l.isPointLight){let{camera:Az,matrix:NJ}=_,qJ=l.distance||Az.far;if(qJ!==Az.far)Az.far=qJ,Az.updateProjectionMatrix();U1.setFromMatrixPosition(l.matrixWorld),Az.position.copy(U1),E6.copy(Az.position),E6.add(jG[Cz]),Az.up.copy(_G[Cz]),Az.lookAt(E6),Az.updateMatrixWorld(),NJ.makeTranslation(-U1.x,-U1.y,-U1.z),Z9.multiplyMatrices(Az.projectionMatrix,Az.matrixWorldInverse),_._frustum.setFromProjectionMatrix(Z9,Az.coordinateSystem,Az.reversedDepth)}else _.updateMatrices(l);$=_.getFrustum(),I(C,E,_.camera,l,this.type)}if(_.isPointLightShadow!==!0&&this.type===3)L(_,E);_.needsUpdate=!1}V=this.type,Y.needsUpdate=!1,z.setRenderTarget(F,x,P)};function L(w,C){let E=J.update(k);if(D.defines.VSM_SAMPLES!==w.blurSamples)D.defines.VSM_SAMPLES=w.blurSamples,U.defines.VSM_SAMPLES=w.blurSamples,D.needsUpdate=!0,U.needsUpdate=!0;if(w.mapPass===null)w.mapPass=new nJ(K.x,K.y,{format:1030,type:1016});D.uniforms.shadow_pass.value=w.map.depthTexture,D.uniforms.resolution.value=w.mapSize,D.uniforms.radius.value=w.radius,z.setRenderTarget(w.mapPass),z.clear(),z.renderBufferDirect(C,null,E,D,k,null),U.uniforms.shadow_pass.value=w.mapPass.texture,U.uniforms.resolution.value=w.mapSize,U.uniforms.radius.value=w.radius,z.setRenderTarget(w.map),z.clear(),z.renderBufferDirect(C,null,E,U,k,null)}function O(w,C,E,F){let x=null,P=E.isPointLight===!0?w.customDistanceMaterial:w.customDepthMaterial;if(P!==void 0)x=P;else if(x=E.isPointLight===!0?G:B,z.localClippingEnabled&&C.clipShadows===!0&&Array.isArray(C.clippingPlanes)&&C.clippingPlanes.length!==0||C.displacementMap&&C.displacementScale!==0||C.alphaMap&&C.alphaTest>0||C.map&&C.alphaTest>0||C.alphaToCoverage===!0){let p=x.uuid,n=C.uuid,j=N[p];if(j===void 0)j={},N[p]=j;let m=j[n];if(m===void 0)m=x.clone(),j[n]=m,C.addEventListener("dispose",S);x=m}if(x.visible=C.visible,x.wireframe=C.wireframe,F===3)x.side=C.shadowSide!==null?C.shadowSide:C.side;else x.side=C.shadowSide!==null?C.shadowSide:H[C.side];if(x.alphaMap=C.alphaMap,x.alphaTest=C.alphaToCoverage===!0?0.5:C.alphaTest,x.map=C.map,x.clipShadows=C.clipShadows,x.clippingPlanes=C.clippingPlanes,x.clipIntersection=C.clipIntersection,x.displacementMap=C.displacementMap,x.displacementScale=C.displacementScale,x.displacementBias=C.displacementBias,x.wireframeLinewidth=C.wireframeLinewidth,x.linewidth=C.linewidth,E.isPointLight===!0&&x.isMeshDistanceMaterial===!0){let p=z.properties.get(x);p.light=E}return x}function I(w,C,E,F,x){if(w.visible===!1)return;if(w.layers.test(C.layers)&&(w.isMesh||w.isLine||w.isPoints)){if((w.castShadow||w.receiveShadow&&x===3)&&(!w.frustumCulled||$.intersectsObject(w))){w.modelViewMatrix.multiplyMatrices(E.matrixWorldInverse,w.matrixWorld);let n=J.update(w),j=w.material;if(Array.isArray(j)){let m=n.groups;for(let l=0,_=m.length;l<_;l++){let t=m[l],$z=j[t.materialIndex];if($z&&$z.visible){let qz=O(w,$z,F,x);w.onBeforeShadow(z,w,C,E,n,qz,t),z.renderBufferDirect(E,null,n,qz,w,t),w.onAfterShadow(z,w,C,E,n,qz,t)}}}else if(j.visible){let m=O(w,j,F,x);w.onBeforeShadow(z,w,C,E,n,m,null),z.renderBufferDirect(E,null,n,m,w,null),w.onAfterShadow(z,w,C,E,n,m,null)}}}let p=w.children;for(let n=0,j=p.length;n<j;n++)I(p[n],C,E,F,x)}function S(w){w.target.removeEventListener("dispose",S);for(let E in N){let F=N[E],x=w.target.uuid;if(x in F)F[x].dispose(),delete F[x]}}}function dG(z,J){function Q(){let T=!1,Nz=new BJ,o=null,Hz=new BJ(0,0,0,0);return{setMask:function(Lz){if(o!==Lz&&!T)z.colorMask(Lz,Lz,Lz,Lz),o=Lz},setLocked:function(Lz){T=Lz},setClear:function(Lz,zz,Uz,oz,EJ){if(EJ===!0)Lz*=oz,zz*=oz,Uz*=oz;if(Nz.set(Lz,zz,Uz,oz),Hz.equals(Nz)===!1)z.clearColor(Lz,zz,Uz,oz),Hz.copy(Nz)},reset:function(){T=!1,o=null,Hz.set(-1,0,0,0)}}}function $(){let T=!1,Nz=!1,o=null,Hz=null,Lz=null;return{setReversed:function(zz){if(Nz!==zz){let Uz=J.get("EXT_clip_control");if(zz)Uz.clipControlEXT(Uz.LOWER_LEFT_EXT,Uz.ZERO_TO_ONE_EXT);else Uz.clipControlEXT(Uz.LOWER_LEFT_EXT,Uz.NEGATIVE_ONE_TO_ONE_EXT);Nz=zz;let oz=Lz;Lz=null,this.setClear(oz)}},getReversed:function(){return Nz},setTest:function(zz){if(zz)Zz(z.DEPTH_TEST);else jz(z.DEPTH_TEST)},setMask:function(zz){if(o!==zz&&!T)z.depthMask(zz),o=zz},setFunc:function(zz){if(Nz)zz=VK[zz];if(Hz!==zz){switch(zz){case 0:z.depthFunc(z.NEVER);break;case 1:z.depthFunc(z.ALWAYS);break;case 2:z.depthFunc(z.LESS);break;case 3:z.depthFunc(z.LEQUAL);break;case 4:z.depthFunc(z.EQUAL);break;case 5:z.depthFunc(z.GEQUAL);break;case 6:z.depthFunc(z.GREATER);break;case 7:z.depthFunc(z.NOTEQUAL);break;default:z.depthFunc(z.LEQUAL)}Hz=zz}},setLocked:function(zz){T=zz},setClear:function(zz){if(Lz!==zz){if(Lz=zz,Nz)zz=1-zz;z.clearDepth(zz)}},reset:function(){T=!1,o=null,Hz=null,Lz=null,Nz=!1}}}function K(){let T=!1,Nz=null,o=null,Hz=null,Lz=null,zz=null,Uz=null,oz=null,EJ=null;return{setTest:function(VJ){if(!T)if(VJ)Zz(z.STENCIL_TEST);else jz(z.STENCIL_TEST)},setMask:function(VJ){if(Nz!==VJ&&!T)z.stencilMask(VJ),Nz=VJ},setFunc:function(VJ,ZQ,kQ){if(o!==VJ||Hz!==ZQ||Lz!==kQ)z.stencilFunc(VJ,ZQ,kQ),o=VJ,Hz=ZQ,Lz=kQ},setOp:function(VJ,ZQ,kQ){if(zz!==VJ||Uz!==ZQ||oz!==kQ)z.stencilOp(VJ,ZQ,kQ),zz=VJ,Uz=ZQ,oz=kQ},setLocked:function(VJ){T=VJ},setClear:function(VJ){if(EJ!==VJ)z.clearStencil(VJ),EJ=VJ},reset:function(){T=!1,Nz=null,o=null,Hz=null,Lz=null,zz=null,Uz=null,oz=null,EJ=null}}}let W=new Q,q=new $,B=new K,G=new WeakMap,N=new WeakMap,Z={},H={},D={},U=new WeakMap,X=[],k=null,Y=!1,V=null,L=null,O=null,I=null,S=null,w=null,C=null,E=new Fz(0,0,0),F=0,x=!1,P=null,p=null,n=null,j=null,m=null,l=z.getParameter(z.MAX_COMBINED_TEXTURE_IMAGE_UNITS),_=!1,t=0,$z=z.getParameter(z.VERSION);if($z.indexOf("WebGL")!==-1)t=parseFloat(/^WebGL (\d)/.exec($z)[1]),_=t>=1;else if($z.indexOf("OpenGL ES")!==-1)t=parseFloat(/^OpenGL ES (\d)/.exec($z)[1]),_=t>=2;let qz=null,Cz={},Az=z.getParameter(z.SCISSOR_BOX),NJ=z.getParameter(z.VIEWPORT),qJ=new BJ().fromArray(Az),s=new BJ().fromArray(NJ);function Gz(T,Nz,o,Hz){let Lz=new Uint8Array(4),zz=z.createTexture();z.bindTexture(T,zz),z.texParameteri(T,z.TEXTURE_MIN_FILTER,z.NEAREST),z.texParameteri(T,z.TEXTURE_MAG_FILTER,z.NEAREST);for(let Uz=0;Uz<o;Uz++)if(T===z.TEXTURE_3D||T===z.TEXTURE_2D_ARRAY)z.texImage3D(Nz,0,z.RGBA,1,1,Hz,0,z.RGBA,z.UNSIGNED_BYTE,Lz);else z.texImage2D(Nz+Uz,0,z.RGBA,1,1,0,z.RGBA,z.UNSIGNED_BYTE,Lz);return zz}let Oz={};Oz[z.TEXTURE_2D]=Gz(z.TEXTURE_2D,z.TEXTURE_2D,1),Oz[z.TEXTURE_CUBE_MAP]=Gz(z.TEXTURE_CUBE_MAP,z.TEXTURE_CUBE_MAP_POSITIVE_X,6),Oz[z.TEXTURE_2D_ARRAY]=Gz(z.TEXTURE_2D_ARRAY,z.TEXTURE_2D_ARRAY,1,1),Oz[z.TEXTURE_3D]=Gz(z.TEXTURE_3D,z.TEXTURE_3D,1,1),W.setClear(0,0,0,1),q.setClear(1),B.setClear(0),Zz(z.DEPTH_TEST),q.setFunc(3),Mz(!1),vz(1),Zz(z.CULL_FACE),Jz(0);function Zz(T){if(Z[T]!==!0)z.enable(T),Z[T]=!0}function jz(T){if(Z[T]!==!1)z.disable(T),Z[T]=!1}function JJ(T,Nz){if(D[T]!==Nz){if(z.bindFramebuffer(T,Nz),D[T]=Nz,T===z.DRAW_FRAMEBUFFER)D[z.FRAMEBUFFER]=Nz;if(T===z.FRAMEBUFFER)D[z.DRAW_FRAMEBUFFER]=Nz;return!0}return!1}function uz(T,Nz){let o=X,Hz=!1;if(T){if(o=U.get(Nz),o===void 0)o=[],U.set(Nz,o);let Lz=T.textures;if(o.length!==Lz.length||o[0]!==z.COLOR_ATTACHMENT0){for(let zz=0,Uz=Lz.length;zz<Uz;zz++)o[zz]=z.COLOR_ATTACHMENT0+zz;o.length=Lz.length,Hz=!0}}else if(o[0]!==z.BACK)o[0]=z.BACK,Hz=!0;if(Hz)z.drawBuffers(o)}function gz(T){if(k!==T)return z.useProgram(T),k=T,!0;return!1}let r={[100]:z.FUNC_ADD,[101]:z.FUNC_SUBTRACT,[102]:z.FUNC_REVERSE_SUBTRACT};r[103]=z.MIN,r[104]=z.MAX;let Qz={[200]:z.ZERO,[201]:z.ONE,[202]:z.SRC_COLOR,[204]:z.SRC_ALPHA,[210]:z.SRC_ALPHA_SATURATE,[208]:z.DST_COLOR,[206]:z.DST_ALPHA,[203]:z.ONE_MINUS_SRC_COLOR,[205]:z.ONE_MINUS_SRC_ALPHA,[209]:z.ONE_MINUS_DST_COLOR,[207]:z.ONE_MINUS_DST_ALPHA,[211]:z.CONSTANT_COLOR,[212]:z.ONE_MINUS_CONSTANT_COLOR,[213]:z.CONSTANT_ALPHA,[214]:z.ONE_MINUS_CONSTANT_ALPHA};function Jz(T,Nz,o,Hz,Lz,zz,Uz,oz,EJ,VJ){if(T===0){if(Y===!0)jz(z.BLEND),Y=!1;return}if(Y===!1)Zz(z.BLEND),Y=!0;if(T!==5){if(T!==V||VJ!==x){if(L!==100||S!==100)z.blendEquation(z.FUNC_ADD),L=100,S=100;if(VJ)switch(T){case 1:z.blendFuncSeparate(z.ONE,z.ONE_MINUS_SRC_ALPHA,z.ONE,z.ONE_MINUS_SRC_ALPHA);break;case 2:z.blendFunc(z.ONE,z.ONE);break;case 3:z.blendFuncSeparate(z.ZERO,z.ONE_MINUS_SRC_COLOR,z.ZERO,z.ONE);break;case 4:z.blendFuncSeparate(z.DST_COLOR,z.ONE_MINUS_SRC_ALPHA,z.ZERO,z.ONE);break;default:Pz("WebGLState: Invalid blending: ",T);break}else switch(T){case 1:z.blendFuncSeparate(z.SRC_ALPHA,z.ONE_MINUS_SRC_ALPHA,z.ONE,z.ONE_MINUS_SRC_ALPHA);break;case 2:z.blendFuncSeparate(z.SRC_ALPHA,z.ONE,z.ONE,z.ONE);break;case 3:Pz("WebGLState: SubtractiveBlending requires material.premultipliedAlpha = true");break;case 4:Pz("WebGLState: MultiplyBlending requires material.premultipliedAlpha = true");break;default:Pz("WebGLState: Invalid blending: ",T);break}O=null,I=null,w=null,C=null,E.set(0,0,0),F=0,V=T,x=VJ}return}if(Lz=Lz||Nz,zz=zz||o,Uz=Uz||Hz,Nz!==L||Lz!==S)z.blendEquationSeparate(r[Nz],r[Lz]),L=Nz,S=Lz;if(o!==O||Hz!==I||zz!==w||Uz!==C)z.blendFuncSeparate(Qz[o],Qz[Hz],Qz[zz],Qz[Uz]),O=o,I=Hz,w=zz,C=Uz;if(oz.equals(E)===!1||EJ!==F)z.blendColor(oz.r,oz.g,oz.b,EJ),E.copy(oz),F=EJ;V=T,x=!1}function Ez(T,Nz){T.side===2?jz(z.CULL_FACE):Zz(z.CULL_FACE);let o=T.side===1;if(Nz)o=!o;Mz(o),T.blending===1&&T.transparent===!1?Jz(0):Jz(T.blending,T.blendEquation,T.blendSrc,T.blendDst,T.blendEquationAlpha,T.blendSrcAlpha,T.blendDstAlpha,T.blendColor,T.blendAlpha,T.premultipliedAlpha),q.setFunc(T.depthFunc),q.setTest(T.depthTest),q.setMask(T.depthWrite),W.setMask(T.colorWrite);let Hz=T.stencilWrite;if(B.setTest(Hz),Hz)B.setMask(T.stencilWriteMask),B.setFunc(T.stencilFunc,T.stencilRef,T.stencilFuncMask),B.setOp(T.stencilFail,T.stencilZFail,T.stencilZPass);cz(T.polygonOffset,T.polygonOffsetFactor,T.polygonOffsetUnits),T.alphaToCoverage===!0?Zz(z.SAMPLE_ALPHA_TO_COVERAGE):jz(z.SAMPLE_ALPHA_TO_COVERAGE)}function Mz(T){if(P!==T){if(T)z.frontFace(z.CW);else z.frontFace(z.CCW);P=T}}function vz(T){if(T!==0){if(Zz(z.CULL_FACE),T!==p)if(T===1)z.cullFace(z.BACK);else if(T===2)z.cullFace(z.FRONT);else z.cullFace(z.FRONT_AND_BACK)}else jz(z.CULL_FACE);p=T}function Tz(T){if(T!==n){if(_)z.lineWidth(T);n=T}}function cz(T,Nz,o){if(T){if(Zz(z.POLYGON_OFFSET_FILL),j!==Nz||m!==o){if(j=Nz,m=o,q.getReversed())Nz=-Nz;z.polygonOffset(Nz,o)}}else jz(z.POLYGON_OFFSET_FILL)}function nz(T){if(T)Zz(z.SCISSOR_TEST);else jz(z.SCISSOR_TEST)}function v(T){if(T===void 0)T=z.TEXTURE0+l-1;if(qz!==T)z.activeTexture(T),qz=T}function UJ(T,Nz,o){if(o===void 0)if(qz===null)o=z.TEXTURE0+l-1;else o=qz;let Hz=Cz[o];if(Hz===void 0)Hz={type:void 0,texture:void 0},Cz[o]=Hz;if(Hz.type!==T||Hz.texture!==Nz){if(qz!==o)z.activeTexture(o),qz=o;z.bindTexture(T,Nz||Oz[T]),Hz.type=T,Hz.texture=Nz}}function ez(){let T=Cz[qz];if(T!==void 0&&T.type!==void 0)z.bindTexture(T.type,null),T.type=void 0,T.texture=void 0}function tz(){try{z.compressedTexImage2D(...arguments)}catch(T){Pz("WebGLState:",T)}}function y(){try{z.compressedTexImage3D(...arguments)}catch(T){Pz("WebGLState:",T)}}function A(){try{z.texSubImage2D(...arguments)}catch(T){Pz("WebGLState:",T)}}function f(){try{z.texSubImage3D(...arguments)}catch(T){Pz("WebGLState:",T)}}function u(){try{z.compressedTexSubImage2D(...arguments)}catch(T){Pz("WebGLState:",T)}}function e(){try{z.compressedTexSubImage3D(...arguments)}catch(T){Pz("WebGLState:",T)}}function Kz(){try{z.texStorage2D(...arguments)}catch(T){Pz("WebGLState:",T)}}function Dz(){try{z.texStorage3D(...arguments)}catch(T){Pz("WebGLState:",T)}}function c(){try{z.texImage2D(...arguments)}catch(T){Pz("WebGLState:",T)}}function i(){try{z.texImage3D(...arguments)}catch(T){Pz("WebGLState:",T)}}function Iz(T){if(H[T]!==void 0)return H[T];else return z.getParameter(T)}function fz(T,Nz){if(H[T]!==Nz)z.pixelStorei(T,Nz),H[T]=Nz}function Yz(T){if(qJ.equals(T)===!1)z.scissor(T.x,T.y,T.z,T.w),qJ.copy(T)}function Wz(T){if(s.equals(T)===!1)z.viewport(T.x,T.y,T.z,T.w),s.copy(T)}function _z(T,Nz){let o=N.get(Nz);if(o===void 0)o=new WeakMap,N.set(Nz,o);let Hz=o.get(T);if(Hz===void 0)Hz=z.getUniformBlockIndex(Nz,T.name),o.set(T,Hz)}function bz(T,Nz){let Hz=N.get(Nz).get(T);if(G.get(Nz)!==Hz)z.uniformBlockBinding(Nz,Hz,T.__bindingPointIndex),G.set(Nz,Hz)}function WJ(){z.disable(z.BLEND),z.disable(z.CULL_FACE),z.disable(z.DEPTH_TEST),z.disable(z.POLYGON_OFFSET_FILL),z.disable(z.SCISSOR_TEST),z.disable(z.STENCIL_TEST),z.disable(z.SAMPLE_ALPHA_TO_COVERAGE),z.blendEquation(z.FUNC_ADD),z.blendFunc(z.ONE,z.ZERO),z.blendFuncSeparate(z.ONE,z.ZERO,z.ONE,z.ZERO),z.blendColor(0,0,0,0),z.colorMask(!0,!0,!0,!0),z.clearColor(0,0,0,0),z.depthMask(!0),z.depthFunc(z.LESS),q.setReversed(!1),z.clearDepth(1),z.stencilMask(4294967295),z.stencilFunc(z.ALWAYS,0,4294967295),z.stencilOp(z.KEEP,z.KEEP,z.KEEP),z.clearStencil(0),z.cullFace(z.BACK),z.frontFace(z.CCW),z.polygonOffset(0,0),z.activeTexture(z.TEXTURE0),z.bindFramebuffer(z.FRAMEBUFFER,null),z.bindFramebuffer(z.DRAW_FRAMEBUFFER,null),z.bindFramebuffer(z.READ_FRAMEBUFFER,null),z.useProgram(null),z.lineWidth(1),z.scissor(0,0,z.canvas.width,z.canvas.height),z.viewport(0,0,z.canvas.width,z.canvas.height),z.pixelStorei(z.PACK_ALIGNMENT,4),z.pixelStorei(z.UNPACK_ALIGNMENT,4),z.pixelStorei(z.UNPACK_FLIP_Y_WEBGL,!1),z.pixelStorei(z.UNPACK_PREMULTIPLY_ALPHA_WEBGL,!1),z.pixelStorei(z.UNPACK_COLORSPACE_CONVERSION_WEBGL,z.BROWSER_DEFAULT_WEBGL),z.pixelStorei(z.PACK_ROW_LENGTH,0),z.pixelStorei(z.PACK_SKIP_PIXELS,0),z.pixelStorei(z.PACK_SKIP_ROWS,0),z.pixelStorei(z.UNPACK_ROW_LENGTH,0),z.pixelStorei(z.UNPACK_IMAGE_HEIGHT,0),z.pixelStorei(z.UNPACK_SKIP_PIXELS,0),z.pixelStorei(z.UNPACK_SKIP_ROWS,0),z.pixelStorei(z.UNPACK_SKIP_IMAGES,0),Z={},H={},qz=null,Cz={},D={},U=new WeakMap,X=[],k=null,Y=!1,V=null,L=null,O=null,I=null,S=null,w=null,C=null,E=new Fz(0,0,0),F=0,x=!1,P=null,p=null,n=null,j=null,m=null,qJ.set(0,0,z.canvas.width,z.canvas.height),s.set(0,0,z.canvas.width,z.canvas.height),W.reset(),q.reset(),B.reset()}return{buffers:{color:W,depth:q,stencil:B},enable:Zz,disable:jz,bindFramebuffer:JJ,drawBuffers:uz,useProgram:gz,setBlending:Jz,setMaterial:Ez,setFlipSided:Mz,setCullFace:vz,setLineWidth:Tz,setPolygonOffset:cz,setScissorTest:nz,activeTexture:v,bindTexture:UJ,unbindTexture:ez,compressedTexImage2D:tz,compressedTexImage3D:y,texImage2D:c,texImage3D:i,pixelStorei:fz,getParameter:Iz,updateUBOMapping:_z,uniformBlockBinding:bz,texStorage2D:Kz,texStorage3D:Dz,texSubImage2D:A,texSubImage3D:f,compressedTexSubImage2D:u,compressedTexSubImage3D:e,scissor:Yz,viewport:Wz,reset:WJ}}function pG(z,J,Q,$,K,W,q){let B=J.has("WEBGL_multisampled_render_to_texture")?J.get("WEBGL_multisampled_render_to_texture"):null,G=typeof navigator>"u"?!1:/OculusBrowser/g.test(navigator.userAgent),N=new a,Z=new WeakMap,H=new Set,D,U=new WeakMap,X=!1;try{X=typeof OffscreenCanvas<"u"&&new OffscreenCanvas(1,1).getContext("2d")!==null}catch(y){}function k(y,A){return X?new OffscreenCanvas(y,A):F1("canvas")}function Y(y,A,f){let u=1,e=tz(y);if(e.width>f||e.height>f)u=f/Math.max(e.width,e.height);if(u<1)if(typeof HTMLImageElement<"u"&&y instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&y instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&y instanceof ImageBitmap||typeof VideoFrame<"u"&&y instanceof VideoFrame){let Kz=Math.floor(u*e.width),Dz=Math.floor(u*e.height);if(D===void 0)D=k(Kz,Dz);let c=A?k(Kz,Dz):D;return c.width=Kz,c.height=Dz,c.getContext("2d").drawImage(y,0,0,Kz,Dz),Bz("WebGLRenderer: Texture has been resized from ("+e.width+"x"+e.height+") to ("+Kz+"x"+Dz+")."),c}else{if("data"in y)Bz("WebGLRenderer: Image in DataTexture is too big ("+e.width+"x"+e.height+").");return y}return y}function V(y){return y.generateMipmaps}function L(y){z.generateMipmap(y)}function O(y){if(y.isWebGLCubeRenderTarget)return z.TEXTURE_CUBE_MAP;if(y.isWebGL3DRenderTarget)return z.TEXTURE_3D;if(y.isWebGLArrayRenderTarget||y.isCompressedArrayTexture)return z.TEXTURE_2D_ARRAY;return z.TEXTURE_2D}function I(y,A,f,u,e,Kz=!1){if(y!==null){if(z[y]!==void 0)return z[y];Bz("WebGLRenderer: Attempt to use non-existing WebGL internal format '"+y+"'")}let Dz;if(u){if(Dz=J.get("EXT_texture_norm16"),!Dz)Bz("WebGLRenderer: Unable to use normalized textures without EXT_texture_norm16 extension")}let c=A;if(A===z.RED){if(f===z.FLOAT)c=z.R32F;if(f===z.HALF_FLOAT)c=z.R16F;if(f===z.UNSIGNED_BYTE)c=z.R8;if(f===z.UNSIGNED_SHORT&&Dz)c=Dz.R16_EXT;if(f===z.SHORT&&Dz)c=Dz.R16_SNORM_EXT}if(A===z.RED_INTEGER){if(f===z.UNSIGNED_BYTE)c=z.R8UI;if(f===z.UNSIGNED_SHORT)c=z.R16UI;if(f===z.UNSIGNED_INT)c=z.R32UI;if(f===z.BYTE)c=z.R8I;if(f===z.SHORT)c=z.R16I;if(f===z.INT)c=z.R32I}if(A===z.RG){if(f===z.FLOAT)c=z.RG32F;if(f===z.HALF_FLOAT)c=z.RG16F;if(f===z.UNSIGNED_BYTE)c=z.RG8;if(f===z.UNSIGNED_SHORT&&Dz)c=Dz.RG16_EXT;if(f===z.SHORT&&Dz)c=Dz.RG16_SNORM_EXT}if(A===z.RG_INTEGER){if(f===z.UNSIGNED_BYTE)c=z.RG8UI;if(f===z.UNSIGNED_SHORT)c=z.RG16UI;if(f===z.UNSIGNED_INT)c=z.RG32UI;if(f===z.BYTE)c=z.RG8I;if(f===z.SHORT)c=z.RG16I;if(f===z.INT)c=z.RG32I}if(A===z.RGB_INTEGER){if(f===z.UNSIGNED_BYTE)c=z.RGB8UI;if(f===z.UNSIGNED_SHORT)c=z.RGB16UI;if(f===z.UNSIGNED_INT)c=z.RGB32UI;if(f===z.BYTE)c=z.RGB8I;if(f===z.SHORT)c=z.RGB16I;if(f===z.INT)c=z.RGB32I}if(A===z.RGBA_INTEGER){if(f===z.UNSIGNED_BYTE)c=z.RGBA8UI;if(f===z.UNSIGNED_SHORT)c=z.RGBA16UI;if(f===z.UNSIGNED_INT)c=z.RGBA32UI;if(f===z.BYTE)c=z.RGBA8I;if(f===z.SHORT)c=z.RGBA16I;if(f===z.INT)c=z.RGBA32I}if(A===z.RGB){if(f===z.UNSIGNED_SHORT&&Dz)c=Dz.RGB16_EXT;if(f===z.SHORT&&Dz)c=Dz.RGB16_SNORM_EXT;if(f===z.UNSIGNED_INT_5_9_9_9_REV)c=z.RGB9_E5;if(f===z.UNSIGNED_INT_10F_11F_11F_REV)c=z.R11F_G11F_B10F}if(A===z.RGBA){let i=Kz?"linear":zJ.getTransfer(e);if(f===z.FLOAT)c=z.RGBA32F;if(f===z.HALF_FLOAT)c=z.RGBA16F;if(f===z.UNSIGNED_BYTE)c=i==="srgb"?z.SRGB8_ALPHA8:z.RGBA8;if(f===z.UNSIGNED_SHORT&&Dz)c=Dz.RGBA16_EXT;if(f===z.SHORT&&Dz)c=Dz.RGBA16_SNORM_EXT;if(f===z.UNSIGNED_SHORT_4_4_4_4)c=z.RGBA4;if(f===z.UNSIGNED_SHORT_5_5_5_1)c=z.RGB5_A1}if(c===z.R16F||c===z.R32F||c===z.RG16F||c===z.RG32F||c===z.RGBA16F||c===z.RGBA32F)J.get("EXT_color_buffer_float");return c}function S(y,A){let f;if(y){if(A===null||A===1014||A===1020)f=z.DEPTH24_STENCIL8;else if(A===1015)f=z.DEPTH32F_STENCIL8;else if(A===1012)f=z.DEPTH24_STENCIL8,Bz("DepthTexture: 16 bit depth attachment is not supported with stencil. Using 24-bit attachment.")}else if(A===null||A===1014||A===1020)f=z.DEPTH_COMPONENT24;else if(A===1015)f=z.DEPTH_COMPONENT32F;else if(A===1012)f=z.DEPTH_COMPONENT16;return f}function w(y,A){if(V(y)===!0||y.isFramebufferTexture&&y.minFilter!==1003&&y.minFilter!==1006)return Math.log2(Math.max(A.width,A.height))+1;else if(y.mipmaps!==void 0&&y.mipmaps.length>0)return y.mipmaps.length;else if(y.isCompressedTexture&&Array.isArray(y.image))return A.mipmaps.length;else return 1}function C(y){let A=y.target;if(A.removeEventListener("dispose",C),F(A),A.isVideoTexture)Z.delete(A);if(A.isHTMLTexture)H.delete(A)}function E(y){let A=y.target;A.removeEventListener("dispose",E),P(A)}function F(y){let A=$.get(y);if(A.__webglInit===void 0)return;let f=y.source,u=U.get(f);if(u){let e=u[A.__cacheKey];if(e.usedTimes--,e.usedTimes===0)x(y);if(Object.keys(u).length===0)U.delete(f)}$.remove(y)}function x(y){let A=$.get(y);z.deleteTexture(A.__webglTexture);let f=y.source,u=U.get(f);delete u[A.__cacheKey],q.memory.textures--}function P(y){let A=$.get(y);if(y.depthTexture)y.depthTexture.dispose(),$.remove(y.depthTexture);if(y.isWebGLCubeRenderTarget)for(let u=0;u<6;u++){if(Array.isArray(A.__webglFramebuffer[u]))for(let e=0;e<A.__webglFramebuffer[u].length;e++)z.deleteFramebuffer(A.__webglFramebuffer[u][e]);else z.deleteFramebuffer(A.__webglFramebuffer[u]);if(A.__webglDepthbuffer)z.deleteRenderbuffer(A.__webglDepthbuffer[u])}else{if(Array.isArray(A.__webglFramebuffer))for(let u=0;u<A.__webglFramebuffer.length;u++)z.deleteFramebuffer(A.__webglFramebuffer[u]);else z.deleteFramebuffer(A.__webglFramebuffer);if(A.__webglDepthbuffer)z.deleteRenderbuffer(A.__webglDepthbuffer);if(A.__webglMultisampledFramebuffer)z.deleteFramebuffer(A.__webglMultisampledFramebuffer);if(A.__webglColorRenderbuffer){for(let u=0;u<A.__webglColorRenderbuffer.length;u++)if(A.__webglColorRenderbuffer[u])z.deleteRenderbuffer(A.__webglColorRenderbuffer[u])}if(A.__webglDepthRenderbuffer)z.deleteRenderbuffer(A.__webglDepthRenderbuffer)}let f=y.textures;for(let u=0,e=f.length;u<e;u++){let Kz=$.get(f[u]);if(Kz.__webglTexture)z.deleteTexture(Kz.__webglTexture),q.memory.textures--;$.remove(f[u])}$.remove(y)}let p=0;function n(){p=0}function j(){return p}function m(y){p=y}function l(){let y=p;if(y>=K.maxTextures)Bz("WebGLTextures: Trying to use "+y+" texture units while this GPU supports only "+K.maxTextures);return p+=1,y}function _(y){let A=[];return A.push(y.wrapS),A.push(y.wrapT),A.push(y.wrapR||0),A.push(y.magFilter),A.push(y.minFilter),A.push(y.anisotropy),A.push(y.internalFormat),A.push(y.format),A.push(y.type),A.push(y.generateMipmaps),A.push(y.premultiplyAlpha),A.push(y.flipY),A.push(y.unpackAlignment),A.push(y.colorSpace),A.join()}function t(y,A){let f=$.get(y);if(y.isVideoTexture)UJ(y);if(y.isRenderTargetTexture===!1&&y.isExternalTexture!==!0&&y.version>0&&f.__version!==y.version){let u=y.image;if(u===null)Bz("WebGLRenderer: Texture marked for update but no image data found.");else if(u.complete===!1)Bz("WebGLRenderer: Texture marked for update but image is incomplete");else{jz(f,y,A);return}}else if(y.isExternalTexture)f.__webglTexture=y.sourceTexture?y.sourceTexture:null;Q.bindTexture(z.TEXTURE_2D,f.__webglTexture,z.TEXTURE0+A)}function $z(y,A){let f=$.get(y);if(y.isRenderTargetTexture===!1&&y.version>0&&f.__version!==y.version){jz(f,y,A);return}else if(y.isExternalTexture)f.__webglTexture=y.sourceTexture?y.sourceTexture:null;Q.bindTexture(z.TEXTURE_2D_ARRAY,f.__webglTexture,z.TEXTURE0+A)}function qz(y,A){let f=$.get(y);if(y.isRenderTargetTexture===!1&&y.version>0&&f.__version!==y.version){jz(f,y,A);return}Q.bindTexture(z.TEXTURE_3D,f.__webglTexture,z.TEXTURE0+A)}function Cz(y,A){let f=$.get(y);if(y.isCubeDepthTexture!==!0&&y.version>0&&f.__version!==y.version){JJ(f,y,A);return}Q.bindTexture(z.TEXTURE_CUBE_MAP,f.__webglTexture,z.TEXTURE0+A)}let Az={[1000]:z.REPEAT,[1001]:z.CLAMP_TO_EDGE,[1002]:z.MIRRORED_REPEAT},NJ={[1003]:z.NEAREST,[1004]:z.NEAREST_MIPMAP_NEAREST,[1005]:z.NEAREST_MIPMAP_LINEAR,[1006]:z.LINEAR,[1007]:z.LINEAR_MIPMAP_NEAREST,[1008]:z.LINEAR_MIPMAP_LINEAR},qJ={[512]:z.NEVER,[519]:z.ALWAYS,[513]:z.LESS,[515]:z.LEQUAL,[514]:z.EQUAL,[518]:z.GEQUAL,[516]:z.GREATER,[517]:z.NOTEQUAL};function s(y,A){if(A.type===1015&&J.has("OES_texture_float_linear")===!1&&(A.magFilter===1006||A.magFilter===1007||A.magFilter===1005||A.magFilter===1008||A.minFilter===1006||A.minFilter===1007||A.minFilter===1005||A.minFilter===1008))Bz("WebGLRenderer: Unable to use linear filtering with floating point textures. OES_texture_float_linear not supported on this device.");if(z.texParameteri(y,z.TEXTURE_WRAP_S,Az[A.wrapS]),z.texParameteri(y,z.TEXTURE_WRAP_T,Az[A.wrapT]),y===z.TEXTURE_3D||y===z.TEXTURE_2D_ARRAY)z.texParameteri(y,z.TEXTURE_WRAP_R,Az[A.wrapR]);if(z.texParameteri(y,z.TEXTURE_MAG_FILTER,NJ[A.magFilter]),z.texParameteri(y,z.TEXTURE_MIN_FILTER,NJ[A.minFilter]),A.compareFunction)z.texParameteri(y,z.TEXTURE_COMPARE_MODE,z.COMPARE_REF_TO_TEXTURE),z.texParameteri(y,z.TEXTURE_COMPARE_FUNC,qJ[A.compareFunction]);if(J.has("EXT_texture_filter_anisotropic")===!0){if(A.magFilter===1003)return;if(A.minFilter!==1005&&A.minFilter!==1008)return;if(A.type===1015&&J.has("OES_texture_float_linear")===!1)return;if(A.anisotropy>1||$.get(A).__currentAnisotropy){let f=J.get("EXT_texture_filter_anisotropic");z.texParameterf(y,f.TEXTURE_MAX_ANISOTROPY_EXT,Math.min(A.anisotropy,K.getMaxAnisotropy())),$.get(A).__currentAnisotropy=A.anisotropy}}}function Gz(y,A){let f=!1;if(y.__webglInit===void 0)y.__webglInit=!0,A.addEventListener("dispose",C);let u=A.source,e=U.get(u);if(e===void 0)e={},U.set(u,e);let Kz=_(A);if(Kz!==y.__cacheKey){if(e[Kz]===void 0)e[Kz]={texture:z.createTexture(),usedTimes:0},q.memory.textures++,f=!0;e[Kz].usedTimes++;let Dz=e[y.__cacheKey];if(Dz!==void 0){if(e[y.__cacheKey].usedTimes--,Dz.usedTimes===0)x(A)}y.__cacheKey=Kz,y.__webglTexture=e[Kz].texture}return f}function Oz(y,A,f){return Math.floor(Math.floor(y/f)/A)}function Zz(y,A,f,u){let Kz=y.updateRanges;if(Kz.length===0)Q.texSubImage2D(z.TEXTURE_2D,0,0,0,A.width,A.height,f,u,A.data);else{Kz.sort((fz,Yz)=>fz.start-Yz.start);let Dz=0;for(let fz=1;fz<Kz.length;fz++){let Yz=Kz[Dz],Wz=Kz[fz],_z=Yz.start+Yz.count,bz=Oz(Wz.start,A.width,4),WJ=Oz(Yz.start,A.width,4);if(Wz.start<=_z+1&&bz===WJ&&Oz(Wz.start+Wz.count-1,A.width,4)===bz)Yz.count=Math.max(Yz.count,Wz.start+Wz.count-Yz.start);else++Dz,Kz[Dz]=Wz}Kz.length=Dz+1;let c=Q.getParameter(z.UNPACK_ROW_LENGTH),i=Q.getParameter(z.UNPACK_SKIP_PIXELS),Iz=Q.getParameter(z.UNPACK_SKIP_ROWS);Q.pixelStorei(z.UNPACK_ROW_LENGTH,A.width);for(let fz=0,Yz=Kz.length;fz<Yz;fz++){let Wz=Kz[fz],_z=Math.floor(Wz.start/4),bz=Math.ceil(Wz.count/4),WJ=_z%A.width,T=Math.floor(_z/A.width),Nz=bz,o=1;Q.pixelStorei(z.UNPACK_SKIP_PIXELS,WJ),Q.pixelStorei(z.UNPACK_SKIP_ROWS,T),Q.texSubImage2D(z.TEXTURE_2D,0,WJ,T,Nz,1,f,u,A.data)}y.clearUpdateRanges(),Q.pixelStorei(z.UNPACK_ROW_LENGTH,c),Q.pixelStorei(z.UNPACK_SKIP_PIXELS,i),Q.pixelStorei(z.UNPACK_SKIP_ROWS,Iz)}}function jz(y,A,f){let u=z.TEXTURE_2D;if(A.isDataArrayTexture||A.isCompressedArrayTexture)u=z.TEXTURE_2D_ARRAY;if(A.isData3DTexture)u=z.TEXTURE_3D;let e=Gz(y,A),Kz=A.source;Q.bindTexture(u,y.__webglTexture,z.TEXTURE0+f);let Dz=$.get(Kz);if(Kz.version!==Dz.__version||e===!0){if(Q.activeTexture(z.TEXTURE0+f),(typeof ImageBitmap<"u"&&A.image instanceof ImageBitmap)===!1){let o=zJ.getPrimaries(zJ.workingColorSpace),Hz=A.colorSpace===""?null:zJ.getPrimaries(A.colorSpace),Lz=A.colorSpace===""||o===Hz?z.NONE:z.BROWSER_DEFAULT_WEBGL;Q.pixelStorei(z.UNPACK_FLIP_Y_WEBGL,A.flipY),Q.pixelStorei(z.UNPACK_PREMULTIPLY_ALPHA_WEBGL,A.premultiplyAlpha),Q.pixelStorei(z.UNPACK_COLORSPACE_CONVERSION_WEBGL,Lz)}Q.pixelStorei(z.UNPACK_ALIGNMENT,A.unpackAlignment);let i=Y(A.image,!1,K.maxTextureSize);i=ez(A,i);let Iz=W.convert(A.format,A.colorSpace),fz=W.convert(A.type),Yz=I(A.internalFormat,Iz,fz,A.normalized,A.colorSpace,A.isVideoTexture);s(u,A);let Wz,_z=A.mipmaps,bz=A.isVideoTexture!==!0,WJ=Dz.__version===void 0||e===!0,T=Kz.dataReady,Nz=w(A,i);if(A.isDepthTexture){if(Yz=S(A.format===1027,A.type),WJ)if(bz)Q.texStorage2D(z.TEXTURE_2D,1,Yz,i.width,i.height);else Q.texImage2D(z.TEXTURE_2D,0,Yz,i.width,i.height,0,Iz,fz,null)}else if(A.isDataTexture)if(_z.length>0){if(bz&&WJ)Q.texStorage2D(z.TEXTURE_2D,Nz,Yz,_z[0].width,_z[0].height);for(let o=0,Hz=_z.length;o<Hz;o++)if(Wz=_z[o],bz){if(T)Q.texSubImage2D(z.TEXTURE_2D,o,0,0,Wz.width,Wz.height,Iz,fz,Wz.data)}else Q.texImage2D(z.TEXTURE_2D,o,Yz,Wz.width,Wz.height,0,Iz,fz,Wz.data);A.generateMipmaps=!1}else if(bz){if(WJ)Q.texStorage2D(z.TEXTURE_2D,Nz,Yz,i.width,i.height);if(T)Zz(A,i,Iz,fz)}else Q.texImage2D(z.TEXTURE_2D,0,Yz,i.width,i.height,0,Iz,fz,i.data);else if(A.isCompressedTexture)if(A.isCompressedArrayTexture){if(bz&&WJ)Q.texStorage3D(z.TEXTURE_2D_ARRAY,Nz,Yz,_z[0].width,_z[0].height,i.depth);for(let o=0,Hz=_z.length;o<Hz;o++)if(Wz=_z[o],A.format!==1023)if(Iz!==null)if(bz){if(T)if(A.layerUpdates.size>0){let Lz=L6(Wz.width,Wz.height,A.format,A.type);for(let zz of A.layerUpdates){let Uz=Wz.data.subarray(zz*Lz/Wz.data.BYTES_PER_ELEMENT,(zz+1)*Lz/Wz.data.BYTES_PER_ELEMENT);Q.compressedTexSubImage3D(z.TEXTURE_2D_ARRAY,o,0,0,zz,Wz.width,Wz.height,1,Iz,Uz)}A.clearLayerUpdates()}else Q.compressedTexSubImage3D(z.TEXTURE_2D_ARRAY,o,0,0,0,Wz.width,Wz.height,i.depth,Iz,Wz.data)}else Q.compressedTexImage3D(z.TEXTURE_2D_ARRAY,o,Yz,Wz.width,Wz.height,i.depth,0,Wz.data,0,0);else Bz("WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()");else if(bz){if(T)Q.texSubImage3D(z.TEXTURE_2D_ARRAY,o,0,0,0,Wz.width,Wz.height,i.depth,Iz,fz,Wz.data)}else Q.texImage3D(z.TEXTURE_2D_ARRAY,o,Yz,Wz.width,Wz.height,i.depth,0,Iz,fz,Wz.data)}else{if(bz&&WJ)Q.texStorage2D(z.TEXTURE_2D,Nz,Yz,_z[0].width,_z[0].height);for(let o=0,Hz=_z.length;o<Hz;o++)if(Wz=_z[o],A.format!==1023)if(Iz!==null)if(bz){if(T)Q.compressedTexSubImage2D(z.TEXTURE_2D,o,0,0,Wz.width,Wz.height,Iz,Wz.data)}else Q.compressedTexImage2D(z.TEXTURE_2D,o,Yz,Wz.width,Wz.height,0,Wz.data);else Bz("WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()");else if(bz){if(T)Q.texSubImage2D(z.TEXTURE_2D,o,0,0,Wz.width,Wz.height,Iz,fz,Wz.data)}else Q.texImage2D(z.TEXTURE_2D,o,Yz,Wz.width,Wz.height,0,Iz,fz,Wz.data)}else if(A.isDataArrayTexture)if(bz){if(WJ)Q.texStorage3D(z.TEXTURE_2D_ARRAY,Nz,Yz,i.width,i.height,i.depth);if(T)if(A.layerUpdates.size>0){let o=L6(i.width,i.height,A.format,A.type);for(let Hz of A.layerUpdates){let Lz=i.data.subarray(Hz*o/i.data.BYTES_PER_ELEMENT,(Hz+1)*o/i.data.BYTES_PER_ELEMENT);Q.texSubImage3D(z.TEXTURE_2D_ARRAY,0,0,0,Hz,i.width,i.height,1,Iz,fz,Lz)}A.clearLayerUpdates()}else Q.texSubImage3D(z.TEXTURE_2D_ARRAY,0,0,0,0,i.width,i.height,i.depth,Iz,fz,i.data)}else Q.texImage3D(z.TEXTURE_2D_ARRAY,0,Yz,i.width,i.height,i.depth,0,Iz,fz,i.data);else if(A.isData3DTexture)if(bz){if(WJ)Q.texStorage3D(z.TEXTURE_3D,Nz,Yz,i.width,i.height,i.depth);if(T)Q.texSubImage3D(z.TEXTURE_3D,0,0,0,0,i.width,i.height,i.depth,Iz,fz,i.data)}else Q.texImage3D(z.TEXTURE_3D,0,Yz,i.width,i.height,i.depth,0,Iz,fz,i.data);else if(A.isFramebufferTexture){if(WJ)if(bz)Q.texStorage2D(z.TEXTURE_2D,Nz,Yz,i.width,i.height);else{let{width:o,height:Hz}=i;for(let Lz=0;Lz<Nz;Lz++)Q.texImage2D(z.TEXTURE_2D,Lz,Yz,o,Hz,0,Iz,fz,null),o>>=1,Hz>>=1}}else if(A.isHTMLTexture){if("texElementImage2D"in z){let o=z.canvas;if(!o.hasAttribute("layoutsubtree"))o.setAttribute("layoutsubtree","true");if(i.parentNode!==o){o.appendChild(i),H.add(A),o.onpaint=(Hz)=>{let Lz=Hz.changedElements;for(let zz of H)if(Lz.includes(zz.image))zz.needsUpdate=!0},o.requestPaint();return}if(z.texElementImage2D.length===3)z.texElementImage2D(z.TEXTURE_2D,z.RGBA8,i);else{let{RGBA:Lz,RGBA:zz,UNSIGNED_BYTE:Uz}=z;z.texElementImage2D(z.TEXTURE_2D,0,Lz,zz,Uz,i)}z.texParameteri(z.TEXTURE_2D,z.TEXTURE_MIN_FILTER,z.LINEAR),z.texParameteri(z.TEXTURE_2D,z.TEXTURE_WRAP_S,z.CLAMP_TO_EDGE),z.texParameteri(z.TEXTURE_2D,z.TEXTURE_WRAP_T,z.CLAMP_TO_EDGE)}}else if(_z.length>0){if(bz&&WJ){let o=tz(_z[0]);Q.texStorage2D(z.TEXTURE_2D,Nz,Yz,o.width,o.height)}for(let o=0,Hz=_z.length;o<Hz;o++)if(Wz=_z[o],bz){if(T)Q.texSubImage2D(z.TEXTURE_2D,o,0,0,Iz,fz,Wz)}else Q.texImage2D(z.TEXTURE_2D,o,Yz,Iz,fz,Wz);A.generateMipmaps=!1}else if(bz){if(WJ){let o=tz(i);Q.texStorage2D(z.TEXTURE_2D,Nz,Yz,o.width,o.height)}if(T)Q.texSubImage2D(z.TEXTURE_2D,0,0,0,Iz,fz,i)}else Q.texImage2D(z.TEXTURE_2D,0,Yz,Iz,fz,i);if(V(A))L(u);if(Dz.__version=Kz.version,A.onUpdate)A.onUpdate(A)}y.__version=A.version}function JJ(y,A,f){if(A.image.length!==6)return;let u=Gz(y,A),e=A.source;Q.bindTexture(z.TEXTURE_CUBE_MAP,y.__webglTexture,z.TEXTURE0+f);let Kz=$.get(e);if(e.version!==Kz.__version||u===!0){Q.activeTexture(z.TEXTURE0+f);let Dz=zJ.getPrimaries(zJ.workingColorSpace),c=A.colorSpace===""?null:zJ.getPrimaries(A.colorSpace),i=A.colorSpace===""||Dz===c?z.NONE:z.BROWSER_DEFAULT_WEBGL;Q.pixelStorei(z.UNPACK_FLIP_Y_WEBGL,A.flipY),Q.pixelStorei(z.UNPACK_PREMULTIPLY_ALPHA_WEBGL,A.premultiplyAlpha),Q.pixelStorei(z.UNPACK_ALIGNMENT,A.unpackAlignment),Q.pixelStorei(z.UNPACK_COLORSPACE_CONVERSION_WEBGL,i);let Iz=A.isCompressedTexture||A.image[0].isCompressedTexture,fz=A.image[0]&&A.image[0].isDataTexture,Yz=[];for(let zz=0;zz<6;zz++){if(!Iz&&!fz)Yz[zz]=Y(A.image[zz],!0,K.maxCubemapSize);else Yz[zz]=fz?A.image[zz].image:A.image[zz];Yz[zz]=ez(A,Yz[zz])}let Wz=Yz[0],_z=W.convert(A.format,A.colorSpace),bz=W.convert(A.type),WJ=I(A.internalFormat,_z,bz,A.normalized,A.colorSpace),T=A.isVideoTexture!==!0,Nz=Kz.__version===void 0||u===!0,o=e.dataReady,Hz=w(A,Wz);s(z.TEXTURE_CUBE_MAP,A);let Lz;if(Iz){if(T&&Nz)Q.texStorage2D(z.TEXTURE_CUBE_MAP,Hz,WJ,Wz.width,Wz.height);for(let zz=0;zz<6;zz++){Lz=Yz[zz].mipmaps;for(let Uz=0;Uz<Lz.length;Uz++){let oz=Lz[Uz];if(A.format!==1023)if(_z!==null)if(T){if(o)Q.compressedTexSubImage2D(z.TEXTURE_CUBE_MAP_POSITIVE_X+zz,Uz,0,0,oz.width,oz.height,_z,oz.data)}else Q.compressedTexImage2D(z.TEXTURE_CUBE_MAP_POSITIVE_X+zz,Uz,WJ,oz.width,oz.height,0,oz.data);else Bz("WebGLRenderer: Attempt to load unsupported compressed texture format in .setTextureCube()");else if(T){if(o)Q.texSubImage2D(z.TEXTURE_CUBE_MAP_POSITIVE_X+zz,Uz,0,0,oz.width,oz.height,_z,bz,oz.data)}else Q.texImage2D(z.TEXTURE_CUBE_MAP_POSITIVE_X+zz,Uz,WJ,oz.width,oz.height,0,_z,bz,oz.data)}}}else{if(Lz=A.mipmaps,T&&Nz){if(Lz.length>0)Hz++;let zz=tz(Yz[0]);Q.texStorage2D(z.TEXTURE_CUBE_MAP,Hz,WJ,zz.width,zz.height)}for(let zz=0;zz<6;zz++)if(fz){if(T){if(o)Q.texSubImage2D(z.TEXTURE_CUBE_MAP_POSITIVE_X+zz,0,0,0,Yz[zz].width,Yz[zz].height,_z,bz,Yz[zz].data)}else Q.texImage2D(z.TEXTURE_CUBE_MAP_POSITIVE_X+zz,0,WJ,Yz[zz].width,Yz[zz].height,0,_z,bz,Yz[zz].data);for(let Uz=0;Uz<Lz.length;Uz++){let EJ=Lz[Uz].image[zz].image;if(T){if(o)Q.texSubImage2D(z.TEXTURE_CUBE_MAP_POSITIVE_X+zz,Uz+1,0,0,EJ.width,EJ.height,_z,bz,EJ.data)}else Q.texImage2D(z.TEXTURE_CUBE_MAP_POSITIVE_X+zz,Uz+1,WJ,EJ.width,EJ.height,0,_z,bz,EJ.data)}}else{if(T){if(o)Q.texSubImage2D(z.TEXTURE_CUBE_MAP_POSITIVE_X+zz,0,0,0,_z,bz,Yz[zz])}else Q.texImage2D(z.TEXTURE_CUBE_MAP_POSITIVE_X+zz,0,WJ,_z,bz,Yz[zz]);for(let Uz=0;Uz<Lz.length;Uz++){let oz=Lz[Uz];if(T){if(o)Q.texSubImage2D(z.TEXTURE_CUBE_MAP_POSITIVE_X+zz,Uz+1,0,0,_z,bz,oz.image[zz])}else Q.texImage2D(z.TEXTURE_CUBE_MAP_POSITIVE_X+zz,Uz+1,WJ,_z,bz,oz.image[zz])}}}if(V(A))L(z.TEXTURE_CUBE_MAP);if(Kz.__version=e.version,A.onUpdate)A.onUpdate(A)}y.__version=A.version}function uz(y,A,f,u,e,Kz){let Dz=W.convert(f.format,f.colorSpace),c=W.convert(f.type),i=I(f.internalFormat,Dz,c,f.normalized,f.colorSpace),Iz=$.get(A),fz=$.get(f);if(fz.__renderTarget=A,!Iz.__hasExternalTextures){let Yz=Math.max(1,A.width>>Kz),Wz=Math.max(1,A.height>>Kz);if(e===z.TEXTURE_3D||e===z.TEXTURE_2D_ARRAY)Q.texImage3D(e,Kz,i,Yz,Wz,A.depth,0,Dz,c,null);else Q.texImage2D(e,Kz,i,Yz,Wz,0,Dz,c,null)}if(Q.bindFramebuffer(z.FRAMEBUFFER,y),v(A))B.framebufferTexture2DMultisampleEXT(z.FRAMEBUFFER,u,e,fz.__webglTexture,0,nz(A));else if(e===z.TEXTURE_2D||e>=z.TEXTURE_CUBE_MAP_POSITIVE_X&&e<=z.TEXTURE_CUBE_MAP_NEGATIVE_Z)z.framebufferTexture2D(z.FRAMEBUFFER,u,e,fz.__webglTexture,Kz);Q.bindFramebuffer(z.FRAMEBUFFER,null)}function gz(y,A,f){if(z.bindRenderbuffer(z.RENDERBUFFER,y),A.depthBuffer){let u=A.depthTexture,e=u&&u.isDepthTexture?u.type:null,Kz=S(A.stencilBuffer,e),Dz=A.stencilBuffer?z.DEPTH_STENCIL_ATTACHMENT:z.DEPTH_ATTACHMENT;if(v(A))B.renderbufferStorageMultisampleEXT(z.RENDERBUFFER,nz(A),Kz,A.width,A.height);else if(f)z.renderbufferStorageMultisample(z.RENDERBUFFER,nz(A),Kz,A.width,A.height);else z.renderbufferStorage(z.RENDERBUFFER,Kz,A.width,A.height);z.framebufferRenderbuffer(z.FRAMEBUFFER,Dz,z.RENDERBUFFER,y)}else{let u=A.textures;for(let e=0;e<u.length;e++){let Kz=u[e],Dz=W.convert(Kz.format,Kz.colorSpace),c=W.convert(Kz.type),i=I(Kz.internalFormat,Dz,c,Kz.normalized,Kz.colorSpace);if(v(A))B.renderbufferStorageMultisampleEXT(z.RENDERBUFFER,nz(A),i,A.width,A.height);else if(f)z.renderbufferStorageMultisample(z.RENDERBUFFER,nz(A),i,A.width,A.height);else z.renderbufferStorage(z.RENDERBUFFER,i,A.width,A.height)}}z.bindRenderbuffer(z.RENDERBUFFER,null)}function r(y,A,f){let u=A.isWebGLCubeRenderTarget===!0;if(Q.bindFramebuffer(z.FRAMEBUFFER,y),!(A.depthTexture&&A.depthTexture.isDepthTexture))throw Error("THREE.WebGLTextures: renderTarget.depthTexture must be an instance of THREE.DepthTexture.");let e=$.get(A.depthTexture);if(e.__renderTarget=A,!e.__webglTexture||A.depthTexture.image.width!==A.width||A.depthTexture.image.height!==A.height)A.depthTexture.image.width=A.width,A.depthTexture.image.height=A.height,A.depthTexture.needsUpdate=!0;if(u){if(e.__webglInit===void 0)e.__webglInit=!0,A.depthTexture.addEventListener("dispose",C);if(e.__webglTexture===void 0){e.__webglTexture=z.createTexture(),Q.bindTexture(z.TEXTURE_CUBE_MAP,e.__webglTexture),s(z.TEXTURE_CUBE_MAP,A.depthTexture);let Iz=W.convert(A.depthTexture.format),fz=W.convert(A.depthTexture.type),Yz;if(A.depthTexture.format===1026)Yz=z.DEPTH_COMPONENT24;else if(A.depthTexture.format===1027)Yz=z.DEPTH24_STENCIL8;for(let Wz=0;Wz<6;Wz++)z.texImage2D(z.TEXTURE_CUBE_MAP_POSITIVE_X+Wz,0,Yz,A.width,A.height,0,Iz,fz,null)}}else t(A.depthTexture,0);let Kz=e.__webglTexture,Dz=nz(A),c=u?z.TEXTURE_CUBE_MAP_POSITIVE_X+f:z.TEXTURE_2D,i=A.depthTexture.format===1027?z.DEPTH_STENCIL_ATTACHMENT:z.DEPTH_ATTACHMENT;if(A.depthTexture.format===1026)if(v(A))B.framebufferTexture2DMultisampleEXT(z.FRAMEBUFFER,i,c,Kz,0,Dz);else z.framebufferTexture2D(z.FRAMEBUFFER,i,c,Kz,0);else if(A.depthTexture.format===1027)if(v(A))B.framebufferTexture2DMultisampleEXT(z.FRAMEBUFFER,i,c,Kz,0,Dz);else z.framebufferTexture2D(z.FRAMEBUFFER,i,c,Kz,0);else throw Error("THREE.WebGLTextures: Unknown depthTexture format.")}function Qz(y){let A=$.get(y),f=y.isWebGLCubeRenderTarget===!0;if(A.__boundDepthTexture!==y.depthTexture){let u=y.depthTexture;if(A.__depthDisposeCallback)A.__depthDisposeCallback();if(u){let e=()=>{delete A.__boundDepthTexture,delete A.__depthDisposeCallback,u.removeEventListener("dispose",e)};u.addEventListener("dispose",e),A.__depthDisposeCallback=e}A.__boundDepthTexture=u}if(y.depthTexture&&!A.__autoAllocateDepthBuffer)if(f)for(let u=0;u<6;u++)r(A.__webglFramebuffer[u],y,u);else{let u=y.texture.mipmaps;if(u&&u.length>0)r(A.__webglFramebuffer[0],y,0);else r(A.__webglFramebuffer,y,0)}else if(f){A.__webglDepthbuffer=[];for(let u=0;u<6;u++)if(Q.bindFramebuffer(z.FRAMEBUFFER,A.__webglFramebuffer[u]),A.__webglDepthbuffer[u]===void 0)A.__webglDepthbuffer[u]=z.createRenderbuffer(),gz(A.__webglDepthbuffer[u],y,!1);else{let e=y.stencilBuffer?z.DEPTH_STENCIL_ATTACHMENT:z.DEPTH_ATTACHMENT,Kz=A.__webglDepthbuffer[u];z.bindRenderbuffer(z.RENDERBUFFER,Kz),z.framebufferRenderbuffer(z.FRAMEBUFFER,e,z.RENDERBUFFER,Kz)}}else{let u=y.texture.mipmaps;if(u&&u.length>0)Q.bindFramebuffer(z.FRAMEBUFFER,A.__webglFramebuffer[0]);else Q.bindFramebuffer(z.FRAMEBUFFER,A.__webglFramebuffer);if(A.__webglDepthbuffer===void 0)A.__webglDepthbuffer=z.createRenderbuffer(),gz(A.__webglDepthbuffer,y,!1);else{let e=y.stencilBuffer?z.DEPTH_STENCIL_ATTACHMENT:z.DEPTH_ATTACHMENT,Kz=A.__webglDepthbuffer;z.bindRenderbuffer(z.RENDERBUFFER,Kz),z.framebufferRenderbuffer(z.FRAMEBUFFER,e,z.RENDERBUFFER,Kz)}}Q.bindFramebuffer(z.FRAMEBUFFER,null)}function Jz(y,A,f){let u=$.get(y);if(A!==void 0)uz(u.__webglFramebuffer,y,y.texture,z.COLOR_ATTACHMENT0,z.TEXTURE_2D,0);if(f!==void 0)Qz(y)}function Ez(y){let A=y.texture,f=$.get(y),u=$.get(A);y.addEventListener("dispose",E);let e=y.textures,Kz=y.isWebGLCubeRenderTarget===!0,Dz=e.length>1;if(!Dz){if(u.__webglTexture===void 0)u.__webglTexture=z.createTexture();u.__version=A.version,q.memory.textures++}if(Kz){f.__webglFramebuffer=[];for(let c=0;c<6;c++)if(A.mipmaps&&A.mipmaps.length>0){f.__webglFramebuffer[c]=[];for(let i=0;i<A.mipmaps.length;i++)f.__webglFramebuffer[c][i]=z.createFramebuffer()}else f.__webglFramebuffer[c]=z.createFramebuffer()}else{if(A.mipmaps&&A.mipmaps.length>0){f.__webglFramebuffer=[];for(let c=0;c<A.mipmaps.length;c++)f.__webglFramebuffer[c]=z.createFramebuffer()}else f.__webglFramebuffer=z.createFramebuffer();if(Dz)for(let c=0,i=e.length;c<i;c++){let Iz=$.get(e[c]);if(Iz.__webglTexture===void 0)Iz.__webglTexture=z.createTexture(),q.memory.textures++}if(y.samples>0&&v(y)===!1){f.__webglMultisampledFramebuffer=z.createFramebuffer(),f.__webglColorRenderbuffer=[],Q.bindFramebuffer(z.FRAMEBUFFER,f.__webglMultisampledFramebuffer);for(let c=0;c<e.length;c++){let i=e[c];f.__webglColorRenderbuffer[c]=z.createRenderbuffer(),z.bindRenderbuffer(z.RENDERBUFFER,f.__webglColorRenderbuffer[c]);let Iz=W.convert(i.format,i.colorSpace),fz=W.convert(i.type),Yz=I(i.internalFormat,Iz,fz,i.normalized,i.colorSpace,y.isXRRenderTarget===!0),Wz=nz(y);z.renderbufferStorageMultisample(z.RENDERBUFFER,Wz,Yz,y.width,y.height),z.framebufferRenderbuffer(z.FRAMEBUFFER,z.COLOR_ATTACHMENT0+c,z.RENDERBUFFER,f.__webglColorRenderbuffer[c])}if(z.bindRenderbuffer(z.RENDERBUFFER,null),y.depthBuffer)f.__webglDepthRenderbuffer=z.createRenderbuffer(),gz(f.__webglDepthRenderbuffer,y,!0);Q.bindFramebuffer(z.FRAMEBUFFER,null)}}if(Kz){Q.bindTexture(z.TEXTURE_CUBE_MAP,u.__webglTexture),s(z.TEXTURE_CUBE_MAP,A);for(let c=0;c<6;c++)if(A.mipmaps&&A.mipmaps.length>0)for(let i=0;i<A.mipmaps.length;i++)uz(f.__webglFramebuffer[c][i],y,A,z.COLOR_ATTACHMENT0,z.TEXTURE_CUBE_MAP_POSITIVE_X+c,i);else uz(f.__webglFramebuffer[c],y,A,z.COLOR_ATTACHMENT0,z.TEXTURE_CUBE_MAP_POSITIVE_X+c,0);if(V(A))L(z.TEXTURE_CUBE_MAP);Q.unbindTexture()}else if(Dz){for(let c=0,i=e.length;c<i;c++){let Iz=e[c],fz=$.get(Iz),Yz=z.TEXTURE_2D;if(y.isWebGL3DRenderTarget||y.isWebGLArrayRenderTarget)Yz=y.isWebGL3DRenderTarget?z.TEXTURE_3D:z.TEXTURE_2D_ARRAY;if(Q.bindTexture(Yz,fz.__webglTexture),s(Yz,Iz),uz(f.__webglFramebuffer,y,Iz,z.COLOR_ATTACHMENT0+c,Yz,0),V(Iz))L(Yz)}Q.unbindTexture()}else{let c=z.TEXTURE_2D;if(y.isWebGL3DRenderTarget||y.isWebGLArrayRenderTarget)c=y.isWebGL3DRenderTarget?z.TEXTURE_3D:z.TEXTURE_2D_ARRAY;if(Q.bindTexture(c,u.__webglTexture),s(c,A),A.mipmaps&&A.mipmaps.length>0)for(let i=0;i<A.mipmaps.length;i++)uz(f.__webglFramebuffer[i],y,A,z.COLOR_ATTACHMENT0,c,i);else uz(f.__webglFramebuffer,y,A,z.COLOR_ATTACHMENT0,c,0);if(V(A))L(c);Q.unbindTexture()}if(y.depthBuffer)Qz(y)}function Mz(y){let A=y.textures;for(let f=0,u=A.length;f<u;f++){let e=A[f];if(V(e)){let Kz=O(y),Dz=$.get(e).__webglTexture;Q.bindTexture(Kz,Dz),L(Kz),Q.unbindTexture()}}}let vz=[],Tz=[];function cz(y){if(y.samples>0){if(v(y)===!1){let{textures:A,width:f,height:u}=y,e=z.COLOR_BUFFER_BIT,Kz=y.stencilBuffer?z.DEPTH_STENCIL_ATTACHMENT:z.DEPTH_ATTACHMENT,Dz=$.get(y),c=A.length>1;if(c)for(let Iz=0;Iz<A.length;Iz++)Q.bindFramebuffer(z.FRAMEBUFFER,Dz.__webglMultisampledFramebuffer),z.framebufferRenderbuffer(z.FRAMEBUFFER,z.COLOR_ATTACHMENT0+Iz,z.RENDERBUFFER,null),Q.bindFramebuffer(z.FRAMEBUFFER,Dz.__webglFramebuffer),z.framebufferTexture2D(z.DRAW_FRAMEBUFFER,z.COLOR_ATTACHMENT0+Iz,z.TEXTURE_2D,null,0);Q.bindFramebuffer(z.READ_FRAMEBUFFER,Dz.__webglMultisampledFramebuffer);let i=y.texture.mipmaps;if(i&&i.length>0)Q.bindFramebuffer(z.DRAW_FRAMEBUFFER,Dz.__webglFramebuffer[0]);else Q.bindFramebuffer(z.DRAW_FRAMEBUFFER,Dz.__webglFramebuffer);for(let Iz=0;Iz<A.length;Iz++){if(y.resolveDepthBuffer){if(y.depthBuffer)e|=z.DEPTH_BUFFER_BIT;if(y.stencilBuffer&&y.resolveStencilBuffer)e|=z.STENCIL_BUFFER_BIT}if(c){z.framebufferRenderbuffer(z.READ_FRAMEBUFFER,z.COLOR_ATTACHMENT0,z.RENDERBUFFER,Dz.__webglColorRenderbuffer[Iz]);let fz=$.get(A[Iz]).__webglTexture;z.framebufferTexture2D(z.DRAW_FRAMEBUFFER,z.COLOR_ATTACHMENT0,z.TEXTURE_2D,fz,0)}if(z.blitFramebuffer(0,0,f,u,0,0,f,u,e,z.NEAREST),G===!0){if(vz.length=0,Tz.length=0,vz.push(z.COLOR_ATTACHMENT0+Iz),y.depthBuffer&&y.resolveDepthBuffer===!1)vz.push(Kz),Tz.push(Kz),z.invalidateFramebuffer(z.DRAW_FRAMEBUFFER,Tz);z.invalidateFramebuffer(z.READ_FRAMEBUFFER,vz)}}if(Q.bindFramebuffer(z.READ_FRAMEBUFFER,null),Q.bindFramebuffer(z.DRAW_FRAMEBUFFER,null),c)for(let Iz=0;Iz<A.length;Iz++){Q.bindFramebuffer(z.FRAMEBUFFER,Dz.__webglMultisampledFramebuffer),z.framebufferRenderbuffer(z.FRAMEBUFFER,z.COLOR_ATTACHMENT0+Iz,z.RENDERBUFFER,Dz.__webglColorRenderbuffer[Iz]);let fz=$.get(A[Iz]).__webglTexture;Q.bindFramebuffer(z.FRAMEBUFFER,Dz.__webglFramebuffer),z.framebufferTexture2D(z.DRAW_FRAMEBUFFER,z.COLOR_ATTACHMENT0+Iz,z.TEXTURE_2D,fz,0)}Q.bindFramebuffer(z.DRAW_FRAMEBUFFER,Dz.__webglMultisampledFramebuffer)}else if(y.depthBuffer&&y.resolveDepthBuffer===!1&&G){let A=y.stencilBuffer?z.DEPTH_STENCIL_ATTACHMENT:z.DEPTH_ATTACHMENT;z.invalidateFramebuffer(z.DRAW_FRAMEBUFFER,[A])}}}function nz(y){return Math.min(K.maxSamples,y.samples)}function v(y){let A=$.get(y);return y.samples>0&&J.has("WEBGL_multisampled_render_to_texture")===!0&&A.__useRenderToTexture!==!1}function UJ(y){let A=q.render.frame;if(Z.get(y)!==A)Z.set(y,A),y.update()}function ez(y,A){let{colorSpace:f,format:u,type:e}=y;if(y.isCompressedTexture===!0||y.isVideoTexture===!0)return A;if(f!=="srgb-linear"&&f!=="")if(zJ.getTransfer(f)==="srgb"){if(u!==1023||e!==1009)Bz("WebGLTextures: sRGB encoded textures have to use RGBAFormat and UnsignedByteType.")}else Pz("WebGLTextures: Unsupported texture color space:",f);return A}function tz(y){if(typeof HTMLImageElement<"u"&&y instanceof HTMLImageElement)N.width=y.naturalWidth||y.width,N.height=y.naturalHeight||y.height;else if(typeof VideoFrame<"u"&&y instanceof VideoFrame)N.width=y.displayWidth,N.height=y.displayHeight;else N.width=y.width,N.height=y.height;return N}this.allocateTextureUnit=l,this.resetTextureUnits=n,this.getTextureUnits=j,this.setTextureUnits=m,this.setTexture2D=t,this.setTexture2DArray=$z,this.setTexture3D=qz,this.setTextureCube=Cz,this.rebindTextures=Jz,this.setupRenderTarget=Ez,this.updateRenderTargetMipmap=Mz,this.updateMultisampleRenderTarget=cz,this.setupDepthRenderbuffer=Qz,this.setupFrameBufferTexture=uz,this.useMultisampledRTT=v,this.isReversedDepthBuffer=function(){return Q.buffers.depth.getReversed()}}function n$(z,J){function Q($,K=""){let W,q=zJ.getTransfer(K);if($===1009)return z.UNSIGNED_BYTE;if($===1017)return z.UNSIGNED_SHORT_4_4_4_4;if($===1018)return z.UNSIGNED_SHORT_5_5_5_1;if($===35902)return z.UNSIGNED_INT_5_9_9_9_REV;if($===35899)return z.UNSIGNED_INT_10F_11F_11F_REV;if($===1010)return z.BYTE;if($===1011)return z.SHORT;if($===1012)return z.UNSIGNED_SHORT;if($===1013)return z.INT;if($===1014)return z.UNSIGNED_INT;if($===1015)return z.FLOAT;if($===1016)return z.HALF_FLOAT;if($===1021)return z.ALPHA;if($===1022)return z.RGB;if($===1023)return z.RGBA;if($===1026)return z.DEPTH_COMPONENT;if($===1027)return z.DEPTH_STENCIL;if($===1028)return z.RED;if($===1029)return z.RED_INTEGER;if($===1030)return z.RG;if($===1031)return z.RG_INTEGER;if($===1033)return z.RGBA_INTEGER;if($===33776||$===33777||$===33778||$===33779)if(q==="srgb")if(W=J.get("WEBGL_compressed_texture_s3tc_srgb"),W!==null){if($===33776)return W.COMPRESSED_SRGB_S3TC_DXT1_EXT;if($===33777)return W.COMPRESSED_SRGB_ALPHA_S3TC_DXT1_EXT;if($===33778)return W.COMPRESSED_SRGB_ALPHA_S3TC_DXT3_EXT;if($===33779)return W.COMPRESSED_SRGB_ALPHA_S3TC_DXT5_EXT}else return null;else if(W=J.get("WEBGL_compressed_texture_s3tc"),W!==null){if($===33776)return W.COMPRESSED_RGB_S3TC_DXT1_EXT;if($===33777)return W.COMPRESSED_RGBA_S3TC_DXT1_EXT;if($===33778)return W.COMPRESSED_RGBA_S3TC_DXT3_EXT;if($===33779)return W.COMPRESSED_RGBA_S3TC_DXT5_EXT}else return null;if($===35840||$===35841||$===35842||$===35843)if(W=J.get("WEBGL_compressed_texture_pvrtc"),W!==null){if($===35840)return W.COMPRESSED_RGB_PVRTC_4BPPV1_IMG;if($===35841)return W.COMPRESSED_RGB_PVRTC_2BPPV1_IMG;if($===35842)return W.COMPRESSED_RGBA_PVRTC_4BPPV1_IMG;if($===35843)return W.COMPRESSED_RGBA_PVRTC_2BPPV1_IMG}else return null;if($===36196||$===37492||$===37496||$===37488||$===37489||$===37490||$===37491)if(W=J.get("WEBGL_compressed_texture_etc"),W!==null){if($===36196||$===37492)return q==="srgb"?W.COMPRESSED_SRGB8_ETC2:W.COMPRESSED_RGB8_ETC2;if($===37496)return q==="srgb"?W.COMPRESSED_SRGB8_ALPHA8_ETC2_EAC:W.COMPRESSED_RGBA8_ETC2_EAC;if($===37488)return W.COMPRESSED_R11_EAC;if($===37489)return W.COMPRESSED_SIGNED_R11_EAC;if($===37490)return W.COMPRESSED_RG11_EAC;if($===37491)return W.COMPRESSED_SIGNED_RG11_EAC}else return null;if($===37808||$===37809||$===37810||$===37811||$===37812||$===37813||$===37814||$===37815||$===37816||$===37817||$===37818||$===37819||$===37820||$===37821)if(W=J.get("WEBGL_compressed_texture_astc"),W!==null){if($===37808)return q==="srgb"?W.COMPRESSED_SRGB8_ALPHA8_ASTC_4x4_KHR:W.COMPRESSED_RGBA_ASTC_4x4_KHR;if($===37809)return q==="srgb"?W.COMPRESSED_SRGB8_ALPHA8_ASTC_5x4_KHR:W.COMPRESSED_RGBA_ASTC_5x4_KHR;if($===37810)return q==="srgb"?W.COMPRESSED_SRGB8_ALPHA8_ASTC_5x5_KHR:W.COMPRESSED_RGBA_ASTC_5x5_KHR;if($===37811)return q==="srgb"?W.COMPRESSED_SRGB8_ALPHA8_ASTC_6x5_KHR:W.COMPRESSED_RGBA_ASTC_6x5_KHR;if($===37812)return q==="srgb"?W.COMPRESSED_SRGB8_ALPHA8_ASTC_6x6_KHR:W.COMPRESSED_RGBA_ASTC_6x6_KHR;if($===37813)return q==="srgb"?W.COMPRESSED_SRGB8_ALPHA8_ASTC_8x5_KHR:W.COMPRESSED_RGBA_ASTC_8x5_KHR;if($===37814)return q==="srgb"?W.COMPRESSED_SRGB8_ALPHA8_ASTC_8x6_KHR:W.COMPRESSED_RGBA_ASTC_8x6_KHR;if($===37815)return q==="srgb"?W.COMPRESSED_SRGB8_ALPHA8_ASTC_8x8_KHR:W.COMPRESSED_RGBA_ASTC_8x8_KHR;if($===37816)return q==="srgb"?W.COMPRESSED_SRGB8_ALPHA8_ASTC_10x5_KHR:W.COMPRESSED_RGBA_ASTC_10x5_KHR;if($===37817)return q==="srgb"?W.COMPRESSED_SRGB8_ALPHA8_ASTC_10x6_KHR:W.COMPRESSED_RGBA_ASTC_10x6_KHR;if($===37818)return q==="srgb"?W.COMPRESSED_SRGB8_ALPHA8_ASTC_10x8_KHR:W.COMPRESSED_RGBA_ASTC_10x8_KHR;if($===37819)return q==="srgb"?W.COMPRESSED_SRGB8_ALPHA8_ASTC_10x10_KHR:W.COMPRESSED_RGBA_ASTC_10x10_KHR;if($===37820)return q==="srgb"?W.COMPRESSED_SRGB8_ALPHA8_ASTC_12x10_KHR:W.COMPRESSED_RGBA_ASTC_12x10_KHR;if($===37821)return q==="srgb"?W.COMPRESSED_SRGB8_ALPHA8_ASTC_12x12_KHR:W.COMPRESSED_RGBA_ASTC_12x12_KHR}else return null;if($===36492||$===36494||$===36495)if(W=J.get("EXT_texture_compression_bptc"),W!==null){if($===36492)return q==="srgb"?W.COMPRESSED_SRGB_ALPHA_BPTC_UNORM_EXT:W.COMPRESSED_RGBA_BPTC_UNORM_EXT;if($===36494)return W.COMPRESSED_RGB_BPTC_SIGNED_FLOAT_EXT;if($===36495)return W.COMPRESSED_RGB_BPTC_UNSIGNED_FLOAT_EXT}else return null;if($===36283||$===36284||$===36285||$===36286)if(W=J.get("EXT_texture_compression_rgtc"),W!==null){if($===36283)return W.COMPRESSED_RED_RGTC1_EXT;if($===36284)return W.COMPRESSED_SIGNED_RED_RGTC1_EXT;if($===36285)return W.COMPRESSED_RED_GREEN_RGTC2_EXT;if($===36286)return W.COMPRESSED_SIGNED_RED_GREEN_RGTC2_EXT}else return null;if($===1020)return z.UNSIGNED_INT_24_8;return z[$]!==void 0?z[$]:null}return{convert:Q}}var uG=`
void main() {

	gl_Position = vec4( position, 1.0 );

}`,gG=`
uniform sampler2DArray depthColor;
uniform float depthWidth;
uniform float depthHeight;

void main() {

	vec2 coord = vec2( gl_FragCoord.x / depthWidth, gl_FragCoord.y / depthHeight );

	if ( coord.x >= 1.0 ) {

		gl_FragDepth = texture( depthColor, vec3( coord.x - 1.0, coord.y, 1 ) ).r;

	} else {

		gl_FragDepth = texture( depthColor, vec3( coord.x, coord.y, 0 ) ).r;

	}

}`;class o${constructor(){this.texture=null,this.mesh=null,this.depthNear=0,this.depthFar=0}init(z,J){if(this.texture===null){let Q=new s2(z.texture);if(z.depthNear!==J.depthNear||z.depthFar!==J.depthFar)this.depthNear=z.depthNear,this.depthFar=z.depthFar;this.texture=Q}}getMesh(z){if(this.texture!==null){if(this.mesh===null){let J=z.cameras[0].viewport,Q=new rJ({vertexShader:uG,fragmentShader:gG,uniforms:{depthColor:{value:this.texture},depthWidth:{value:J.z},depthHeight:{value:J.w}}});this.mesh=new LJ(new t0(20,20),Q)}}return this.mesh}reset(){this.texture=null,this.mesh=null}getDepthTexture(){return this.texture}}class s$ extends QQ{constructor(z,J){super();let Q=this,$=null,K=1,W=null,q="local-floor",B=1,G=null,N=null,Z=null,H=null,D=null,U=null,X=typeof XRWebGLBinding<"u",k=new o$,Y={},V=J.getContextAttributes(),L=null,O=null,I=[],S=[],w=new a,C=null,E=new RJ;E.viewport=new BJ;let F=new RJ;F.viewport=new BJ;let x=[E,F],P=new Y7,p=null,n=null;this.cameraAutoUpdate=!0,this.enabled=!1,this.isPresenting=!1,this.getController=function(s){let Gz=I[s];if(Gz===void 0)Gz=new E1,I[s]=Gz;return Gz.getTargetRaySpace()},this.getControllerGrip=function(s){let Gz=I[s];if(Gz===void 0)Gz=new E1,I[s]=Gz;return Gz.getGripSpace()},this.getHand=function(s){let Gz=I[s];if(Gz===void 0)Gz=new E1,I[s]=Gz;return Gz.getHandSpace()};function j(s){let Gz=S.indexOf(s.inputSource);if(Gz===-1)return;let Oz=I[Gz];if(Oz!==void 0)Oz.update(s.inputSource,s.frame,G||W),Oz.dispatchEvent({type:s.type,data:s.inputSource})}function m(){$.removeEventListener("select",j),$.removeEventListener("selectstart",j),$.removeEventListener("selectend",j),$.removeEventListener("squeeze",j),$.removeEventListener("squeezestart",j),$.removeEventListener("squeezeend",j),$.removeEventListener("end",m),$.removeEventListener("inputsourceschange",l);for(let s=0;s<I.length;s++){let Gz=S[s];if(Gz===null)continue;S[s]=null,I[s].disconnect(Gz)}p=null,n=null,k.reset();for(let s in Y)delete Y[s];z.setRenderTarget(L),D=null,H=null,Z=null,$=null,O=null,qJ.stop(),Q.isPresenting=!1,z.setPixelRatio(C),z.setSize(w.width,w.height,!1),Q.dispatchEvent({type:"sessionend"})}this.setFramebufferScaleFactor=function(s){if(K=s,Q.isPresenting===!0)Bz("WebXRManager: Cannot change framebuffer scale while presenting.")},this.setReferenceSpaceType=function(s){if(q=s,Q.isPresenting===!0)Bz("WebXRManager: Cannot change reference space type while presenting.")},this.getReferenceSpace=function(){return G||W},this.setReferenceSpace=function(s){G=s},this.getBaseLayer=function(){return H!==null?H:D},this.getBinding=function(){if(Z===null&&X)Z=new XRWebGLBinding($,J);return Z},this.getFrame=function(){return U},this.getSession=function(){return $},this.setSession=async function(s){if($=s,$!==null){if(L=z.getRenderTarget(),$.addEventListener("select",j),$.addEventListener("selectstart",j),$.addEventListener("selectend",j),$.addEventListener("squeeze",j),$.addEventListener("squeezestart",j),$.addEventListener("squeezeend",j),$.addEventListener("end",m),$.addEventListener("inputsourceschange",l),V.xrCompatible!==!0)await J.makeXRCompatible();if(C=z.getPixelRatio(),z.getSize(w),!(X&&("createProjectionLayer"in XRWebGLBinding.prototype))){let Oz={antialias:V.antialias,alpha:!0,depth:V.depth,stencil:V.stencil,framebufferScaleFactor:K};D=new XRWebGLLayer($,J,Oz),$.updateRenderState({baseLayer:D}),z.setPixelRatio(1),z.setSize(D.framebufferWidth,D.framebufferHeight,!1),O=new nJ(D.framebufferWidth,D.framebufferHeight,{format:1023,type:1009,colorSpace:z.outputColorSpace,stencilBuffer:V.stencil,resolveDepthBuffer:D.ignoreDepthValues===!1,resolveStencilBuffer:D.ignoreDepthValues===!1})}else{let Oz=null,Zz=null,jz=null;if(V.depth)jz=V.stencil?J.DEPTH24_STENCIL8:J.DEPTH_COMPONENT24,Oz=V.stencil?1027:1026,Zz=V.stencil?1020:1014;let JJ={colorFormat:J.RGBA8,depthFormat:jz,scaleFactor:K};Z=this.getBinding(),H=Z.createProjectionLayer(JJ),$.updateRenderState({layers:[H]}),z.setPixelRatio(1),z.setSize(H.textureWidth,H.textureHeight,!1),O=new nJ(H.textureWidth,H.textureHeight,{format:1023,type:1009,depthTexture:new cQ(H.textureWidth,H.textureHeight,Zz,void 0,void 0,void 0,void 0,void 0,void 0,Oz),stencilBuffer:V.stencil,colorSpace:z.outputColorSpace,samples:V.antialias?4:0,resolveDepthBuffer:H.ignoreDepthValues===!1,resolveStencilBuffer:H.ignoreDepthValues===!1})}O.isXRRenderTarget=!0,this.setFoveation(B),G=null,W=await $.requestReferenceSpace(q),qJ.setContext($),qJ.start(),Q.isPresenting=!0,Q.dispatchEvent({type:"sessionstart"})}},this.getEnvironmentBlendMode=function(){if($!==null)return $.environmentBlendMode},this.getDepthTexture=function(){return k.getDepthTexture()};function l(s){for(let Gz=0;Gz<s.removed.length;Gz++){let Oz=s.removed[Gz],Zz=S.indexOf(Oz);if(Zz>=0)S[Zz]=null,I[Zz].disconnect(Oz)}for(let Gz=0;Gz<s.added.length;Gz++){let Oz=s.added[Gz],Zz=S.indexOf(Oz);if(Zz===-1){for(let JJ=0;JJ<I.length;JJ++)if(JJ>=S.length){S.push(Oz),Zz=JJ;break}else if(S[JJ]===null){S[JJ]=Oz,Zz=JJ;break}if(Zz===-1)break}let jz=I[Zz];if(jz)jz.connect(Oz)}}let _=new R,t=new R;function $z(s,Gz,Oz){_.setFromMatrixPosition(Gz.matrixWorld),t.setFromMatrixPosition(Oz.matrixWorld);let Zz=_.distanceTo(t),jz=Gz.projectionMatrix.elements,JJ=Oz.projectionMatrix.elements,uz=jz[14]/(jz[10]-1),gz=jz[14]/(jz[10]+1),r=(jz[9]+1)/jz[5],Qz=(jz[9]-1)/jz[5],Jz=(jz[8]-1)/jz[0],Ez=(JJ[8]+1)/JJ[0],Mz=uz*Jz,vz=uz*Ez,Tz=Zz/(-Jz+Ez),cz=Tz*-Jz;if(Gz.matrixWorld.decompose(s.position,s.quaternion,s.scale),s.translateX(cz),s.translateZ(Tz),s.matrixWorld.compose(s.position,s.quaternion,s.scale),s.matrixWorldInverse.copy(s.matrixWorld).invert(),jz[10]===-1)s.projectionMatrix.copy(Gz.projectionMatrix),s.projectionMatrixInverse.copy(Gz.projectionMatrixInverse);else{let nz=uz+Tz,v=gz+Tz,UJ=Mz-cz,ez=vz+(Zz-cz),tz=r*gz/v*nz,y=Qz*gz/v*nz;s.projectionMatrix.makePerspective(UJ,ez,tz,y,nz,v),s.projectionMatrixInverse.copy(s.projectionMatrix).invert()}}function qz(s,Gz){if(Gz===null)s.matrixWorld.copy(s.matrix);else s.matrixWorld.multiplyMatrices(Gz.matrixWorld,s.matrix);s.matrixWorldInverse.copy(s.matrixWorld).invert()}this.updateCamera=function(s){if($===null)return;let{near:Gz,far:Oz}=s;if(k.texture!==null){if(k.depthNear>0)Gz=k.depthNear;if(k.depthFar>0)Oz=k.depthFar}if(P.near=F.near=E.near=Gz,P.far=F.far=E.far=Oz,p!==P.near||n!==P.far)$.updateRenderState({depthNear:P.near,depthFar:P.far}),p=P.near,n=P.far;P.layers.mask=s.layers.mask|6,E.layers.mask=P.layers.mask&-5,F.layers.mask=P.layers.mask&-3;let Zz=s.parent,jz=P.cameras;qz(P,Zz);for(let JJ=0;JJ<jz.length;JJ++)qz(jz[JJ],Zz);if(jz.length===2)$z(P,E,F);else P.projectionMatrix.copy(E.projectionMatrix);Cz(s,P,Zz)};function Cz(s,Gz,Oz){if(Oz===null)s.matrix.copy(Gz.matrixWorld);else s.matrix.copy(Oz.matrixWorld),s.matrix.invert(),s.matrix.multiply(Gz.matrixWorld);if(s.matrix.decompose(s.position,s.quaternion,s.scale),s.updateMatrixWorld(!0),s.projectionMatrix.copy(Gz.projectionMatrix),s.projectionMatrixInverse.copy(Gz.projectionMatrixInverse),s.isPerspectiveCamera)s.fov=l0*2*Math.atan(1/s.projectionMatrix.elements[5]),s.zoom=1}this.getCamera=function(){return P},this.getFoveation=function(){if(H===null&&D===null)return;return B},this.setFoveation=function(s){if(B=s,H!==null)H.fixedFoveation=s;if(D!==null&&D.fixedFoveation!==void 0)D.fixedFoveation=s},this.hasDepthSensing=function(){return k.texture!==null},this.getDepthSensingMesh=function(){return k.getMesh(P)},this.getCameraTexture=function(s){return Y[s]};let Az=null;function NJ(s,Gz){if(N=Gz.getViewerPose(G||W),U=Gz,N!==null){let Oz=N.views;if(D!==null)z.setRenderTargetFramebuffer(O,D.framebuffer),z.setRenderTarget(O);let Zz=!1;if(Oz.length!==P.cameras.length)P.cameras.length=0,Zz=!0;for(let gz=0;gz<Oz.length;gz++){let r=Oz[gz],Qz=null;if(D!==null)Qz=D.getViewport(r);else{let Ez=Z.getViewSubImage(H,r);if(Qz=Ez.viewport,gz===0)z.setRenderTargetTextures(O,Ez.colorTexture,Ez.depthStencilTexture),z.setRenderTarget(O)}let Jz=x[gz];if(Jz===void 0)Jz=new RJ,Jz.layers.enable(gz),Jz.viewport=new BJ,x[gz]=Jz;if(Jz.matrix.fromArray(r.transform.matrix),Jz.matrix.decompose(Jz.position,Jz.quaternion,Jz.scale),Jz.projectionMatrix.fromArray(r.projectionMatrix),Jz.projectionMatrixInverse.copy(Jz.projectionMatrix).invert(),Jz.viewport.set(Qz.x,Qz.y,Qz.width,Qz.height),gz===0)P.matrix.copy(Jz.matrix),P.matrix.decompose(P.position,P.quaternion,P.scale);if(Zz===!0)P.cameras.push(Jz)}let jz=$.enabledFeatures;if(jz&&jz.includes("depth-sensing")&&$.depthUsage=="gpu-optimized"&&X){Z=Q.getBinding();let gz=Z.getDepthInformation(Oz[0]);if(gz&&gz.isValid&&gz.texture)k.init(gz,$.renderState)}if(jz&&jz.includes("camera-access")&&X){z.state.unbindTexture(),Z=Q.getBinding();for(let gz=0;gz<Oz.length;gz++){let r=Oz[gz].camera;if(r){let Qz=Y[r];if(!Qz)Qz=new s2,Y[r]=Qz;let Jz=Z.getCameraImage(r);Qz.sourceTexture=Jz}}}}for(let Oz=0;Oz<I.length;Oz++){let Zz=S[Oz],jz=I[Oz];if(Zz!==null&&jz!==void 0)jz.update(Zz,Gz,G||W)}if(Az)Az(s,Gz);if(Gz.detectedPlanes)Q.dispatchEvent({type:"planesdetected",data:Gz});U=null}let qJ=new x$;qJ.setAnimationLoop(NJ),this.setAnimationLoop=function(s){Az=s},this.dispose=function(){}}}var lG=new pz,i$=new lz;i$.set(-1,0,0,0,1,0,0,0,1);function mG(z,J){function Q(Y,V){if(Y.matrixAutoUpdate===!0)Y.updateMatrix();V.value.copy(Y.matrix)}function $(Y,V){if(V.color.getRGB(Y.fogColor.value,b9(z)),V.isFog)Y.fogNear.value=V.near,Y.fogFar.value=V.far;else if(V.isFogExp2)Y.fogDensity.value=V.density}function K(Y,V,L,O,I){if(V.isNodeMaterial)V.uniformsNeedUpdate=!1;else if(V.isMeshBasicMaterial)W(Y,V);else if(V.isMeshLambertMaterial){if(W(Y,V),V.envMap)Y.envMapIntensity.value=V.envMapIntensity}else if(V.isMeshToonMaterial)W(Y,V),H(Y,V);else if(V.isMeshPhongMaterial){if(W(Y,V),Z(Y,V),V.envMap)Y.envMapIntensity.value=V.envMapIntensity}else if(V.isMeshStandardMaterial){if(W(Y,V),D(Y,V),V.isMeshPhysicalMaterial)U(Y,V,I)}else if(V.isMeshMatcapMaterial)W(Y,V),X(Y,V);else if(V.isMeshDepthMaterial)W(Y,V);else if(V.isMeshDistanceMaterial)W(Y,V),k(Y,V);else if(V.isMeshNormalMaterial)W(Y,V);else if(V.isLineBasicMaterial){if(q(Y,V),V.isLineDashedMaterial)B(Y,V)}else if(V.isPointsMaterial)G(Y,V,L,O);else if(V.isSpriteMaterial)N(Y,V);else if(V.isShadowMaterial)Y.color.value.copy(V.color),Y.opacity.value=V.opacity;else if(V.isShaderMaterial)V.uniformsNeedUpdate=!1}function W(Y,V){if(Y.opacity.value=V.opacity,V.color)Y.diffuse.value.copy(V.color);if(V.emissive)Y.emissive.value.copy(V.emissive).multiplyScalar(V.emissiveIntensity);if(V.map)Y.map.value=V.map,Q(V.map,Y.mapTransform);if(V.alphaMap)Y.alphaMap.value=V.alphaMap,Q(V.alphaMap,Y.alphaMapTransform);if(V.bumpMap){if(Y.bumpMap.value=V.bumpMap,Q(V.bumpMap,Y.bumpMapTransform),Y.bumpScale.value=V.bumpScale,V.side===1)Y.bumpScale.value*=-1}if(V.normalMap){if(Y.normalMap.value=V.normalMap,Q(V.normalMap,Y.normalMapTransform),Y.normalScale.value.copy(V.normalScale),V.side===1)Y.normalScale.value.negate()}if(V.displacementMap)Y.displacementMap.value=V.displacementMap,Q(V.displacementMap,Y.displacementMapTransform),Y.displacementScale.value=V.displacementScale,Y.displacementBias.value=V.displacementBias;if(V.emissiveMap)Y.emissiveMap.value=V.emissiveMap,Q(V.emissiveMap,Y.emissiveMapTransform);if(V.specularMap)Y.specularMap.value=V.specularMap,Q(V.specularMap,Y.specularMapTransform);if(V.alphaTest>0)Y.alphaTest.value=V.alphaTest;let L=J.get(V),O=L.envMap,I=L.envMapRotation;if(O){if(Y.envMap.value=O,Y.envMapRotation.value.setFromMatrix4(lG.makeRotationFromEuler(I)).transpose(),O.isCubeTexture&&O.isRenderTargetTexture===!1)Y.envMapRotation.value.premultiply(i$);Y.reflectivity.value=V.reflectivity,Y.ior.value=V.ior,Y.refractionRatio.value=V.refractionRatio}if(V.lightMap)Y.lightMap.value=V.lightMap,Y.lightMapIntensity.value=V.lightMapIntensity,Q(V.lightMap,Y.lightMapTransform);if(V.aoMap)Y.aoMap.value=V.aoMap,Y.aoMapIntensity.value=V.aoMapIntensity,Q(V.aoMap,Y.aoMapTransform)}function q(Y,V){if(Y.diffuse.value.copy(V.color),Y.opacity.value=V.opacity,V.map)Y.map.value=V.map,Q(V.map,Y.mapTransform)}function B(Y,V){Y.dashSize.value=V.dashSize,Y.totalSize.value=V.dashSize+V.gapSize,Y.scale.value=V.scale}function G(Y,V,L,O){if(Y.diffuse.value.copy(V.color),Y.opacity.value=V.opacity,Y.size.value=V.size*L,Y.scale.value=O*0.5,V.map)Y.map.value=V.map,Q(V.map,Y.uvTransform);if(V.alphaMap)Y.alphaMap.value=V.alphaMap,Q(V.alphaMap,Y.alphaMapTransform);if(V.alphaTest>0)Y.alphaTest.value=V.alphaTest}function N(Y,V){if(Y.diffuse.value.copy(V.color),Y.opacity.value=V.opacity,Y.rotation.value=V.rotation,V.map)Y.map.value=V.map,Q(V.map,Y.mapTransform);if(V.alphaMap)Y.alphaMap.value=V.alphaMap,Q(V.alphaMap,Y.alphaMapTransform);if(V.alphaTest>0)Y.alphaTest.value=V.alphaTest}function Z(Y,V){Y.specular.value.copy(V.specular),Y.shininess.value=Math.max(V.shininess,0.0001)}function H(Y,V){if(V.gradientMap)Y.gradientMap.value=V.gradientMap}function D(Y,V){if(Y.metalness.value=V.metalness,V.metalnessMap)Y.metalnessMap.value=V.metalnessMap,Q(V.metalnessMap,Y.metalnessMapTransform);if(Y.roughness.value=V.roughness,V.roughnessMap)Y.roughnessMap.value=V.roughnessMap,Q(V.roughnessMap,Y.roughnessMapTransform);if(V.envMap)Y.envMapIntensity.value=V.envMapIntensity}function U(Y,V,L){if(Y.ior.value=V.ior,V.sheen>0){if(Y.sheenColor.value.copy(V.sheenColor).multiplyScalar(V.sheen),Y.sheenRoughness.value=V.sheenRoughness,V.sheenColorMap)Y.sheenColorMap.value=V.sheenColorMap,Q(V.sheenColorMap,Y.sheenColorMapTransform);if(V.sheenRoughnessMap)Y.sheenRoughnessMap.value=V.sheenRoughnessMap,Q(V.sheenRoughnessMap,Y.sheenRoughnessMapTransform)}if(V.clearcoat>0){if(Y.clearcoat.value=V.clearcoat,Y.clearcoatRoughness.value=V.clearcoatRoughness,V.clearcoatMap)Y.clearcoatMap.value=V.clearcoatMap,Q(V.clearcoatMap,Y.clearcoatMapTransform);if(V.clearcoatRoughnessMap)Y.clearcoatRoughnessMap.value=V.clearcoatRoughnessMap,Q(V.clearcoatRoughnessMap,Y.clearcoatRoughnessMapTransform);if(V.clearcoatNormalMap){if(Y.clearcoatNormalMap.value=V.clearcoatNormalMap,Q(V.clearcoatNormalMap,Y.clearcoatNormalMapTransform),Y.clearcoatNormalScale.value.copy(V.clearcoatNormalScale),V.side===1)Y.clearcoatNormalScale.value.negate()}}if(V.dispersion>0)Y.dispersion.value=V.dispersion;if(V.iridescence>0){if(Y.iridescence.value=V.iridescence,Y.iridescenceIOR.value=V.iridescenceIOR,Y.iridescenceThicknessMinimum.value=V.iridescenceThicknessRange[0],Y.iridescenceThicknessMaximum.value=V.iridescenceThicknessRange[1],V.iridescenceMap)Y.iridescenceMap.value=V.iridescenceMap,Q(V.iridescenceMap,Y.iridescenceMapTransform);if(V.iridescenceThicknessMap)Y.iridescenceThicknessMap.value=V.iridescenceThicknessMap,Q(V.iridescenceThicknessMap,Y.iridescenceThicknessMapTransform)}if(V.transmission>0){if(Y.transmission.value=V.transmission,Y.transmissionSamplerMap.value=L.texture,Y.transmissionSamplerSize.value.set(L.width,L.height),V.transmissionMap)Y.transmissionMap.value=V.transmissionMap,Q(V.transmissionMap,Y.transmissionMapTransform);if(Y.thickness.value=V.thickness,V.thicknessMap)Y.thicknessMap.value=V.thicknessMap,Q(V.thicknessMap,Y.thicknessMapTransform);Y.attenuationDistance.value=V.attenuationDistance,Y.attenuationColor.value.copy(V.attenuationColor)}if(V.anisotropy>0){if(Y.anisotropyVector.value.set(V.anisotropy*Math.cos(V.anisotropyRotation),V.anisotropy*Math.sin(V.anisotropyRotation)),V.anisotropyMap)Y.anisotropyMap.value=V.anisotropyMap,Q(V.anisotropyMap,Y.anisotropyMapTransform)}if(Y.specularIntensity.value=V.specularIntensity,Y.specularColor.value.copy(V.specularColor),V.specularColorMap)Y.specularColorMap.value=V.specularColorMap,Q(V.specularColorMap,Y.specularColorMapTransform);if(V.specularIntensityMap)Y.specularIntensityMap.value=V.specularIntensityMap,Q(V.specularIntensityMap,Y.specularIntensityMapTransform)}function X(Y,V){if(V.matcap)Y.matcap.value=V.matcap}function k(Y,V){let L=J.get(V).light;Y.referencePosition.value.setFromMatrixPosition(L.matrixWorld),Y.nearDistance.value=L.shadow.camera.near,Y.farDistance.value=L.shadow.camera.far}return{refreshFogUniforms:$,refreshMaterialUniforms:K}}function cG(z,J,Q,$){let K={},W={},q=[],B=z.getParameter(z.MAX_UNIFORM_BUFFER_BINDINGS);function G(I,S){let w=S.program;$.uniformBlockBinding(I,w)}function N(I,S){let w=K[I.id];if(w===void 0)Y(I),w=Z(I),K[I.id]=w,I.addEventListener("dispose",L);let C=S.program;$.updateUBOMapping(I,C);let E=J.render.frame;if(W[I.id]!==E)D(I),W[I.id]=E}function Z(I){let S=H();I.__bindingPointIndex=S;let w=z.createBuffer(),C=I.__size,E=I.usage;return z.bindBuffer(z.UNIFORM_BUFFER,w),z.bufferData(z.UNIFORM_BUFFER,C,E),z.bindBuffer(z.UNIFORM_BUFFER,null),z.bindBufferBase(z.UNIFORM_BUFFER,S,w),w}function H(){for(let I=0;I<B;I++)if(q.indexOf(I)===-1)return q.push(I),I;return Pz("WebGLRenderer: Maximum number of simultaneously usable uniforms groups reached."),0}function D(I){let S=K[I.id],w=I.uniforms,C=I.__cache;z.bindBuffer(z.UNIFORM_BUFFER,S);for(let E=0,F=w.length;E<F;E++){let x=w[E];if(Array.isArray(x))for(let P=0,p=x.length;P<p;P++)U(x[P],E,P,C);else U(x,E,0,C)}z.bindBuffer(z.UNIFORM_BUFFER,null)}function U(I,S,w,C){if(k(I,S,w,C)===!0){let{__offset:E,value:F}=I;if(Array.isArray(F)){let x=0;for(let P=0;P<F.length;P++){let p=F[P],n=V(p);if(X(p,I.__data,x),typeof p!=="number"&&typeof p!=="boolean"&&!p.isMatrix3&&!ArrayBuffer.isView(p))x+=n.storage/Float32Array.BYTES_PER_ELEMENT}}else X(F,I.__data,0);z.bufferSubData(z.UNIFORM_BUFFER,E,I.__data)}}function X(I,S,w){if(typeof I==="number"||typeof I==="boolean")S[0]=I;else if(I.isMatrix3)S[0]=I.elements[0],S[1]=I.elements[1],S[2]=I.elements[2],S[3]=0,S[4]=I.elements[3],S[5]=I.elements[4],S[6]=I.elements[5],S[7]=0,S[8]=I.elements[6],S[9]=I.elements[7],S[10]=I.elements[8],S[11]=0;else if(ArrayBuffer.isView(I))S.set(new I.constructor(I.buffer,I.byteOffset,S.length));else I.toArray(S,w)}function k(I,S,w,C){let E=I.value,F=S+"_"+w;if(C[F]===void 0){if(typeof E==="number"||typeof E==="boolean")C[F]=E;else if(ArrayBuffer.isView(E))C[F]=E.slice();else C[F]=E.clone();return!0}else{let x=C[F];if(typeof E==="number"||typeof E==="boolean"){if(x!==E)return C[F]=E,!0}else if(ArrayBuffer.isView(E))return!0;else if(x.equals(E)===!1)return x.copy(E),!0}return!1}function Y(I){let S=I.uniforms,w=0,C=16;for(let F=0,x=S.length;F<x;F++){let P=Array.isArray(S[F])?S[F]:[S[F]];for(let p=0,n=P.length;p<n;p++){let j=P[p],m=Array.isArray(j.value)?j.value:[j.value];for(let l=0,_=m.length;l<_;l++){let t=m[l],$z=V(t),qz=w%C,Cz=qz%$z.boundary,Az=qz+Cz;if(w+=Cz,Az!==0&&C-Az<$z.storage)w+=C-Az;j.__data=new Float32Array($z.storage/Float32Array.BYTES_PER_ELEMENT),j.__offset=w,w+=$z.storage}}}let E=w%C;if(E>0)w+=C-E;return I.__size=w,I.__cache={},this}function V(I){let S={boundary:0,storage:0};if(typeof I==="number"||typeof I==="boolean")S.boundary=4,S.storage=4;else if(I.isVector2)S.boundary=8,S.storage=8;else if(I.isVector3||I.isColor)S.boundary=16,S.storage=12;else if(I.isVector4)S.boundary=16,S.storage=16;else if(I.isMatrix3)S.boundary=48,S.storage=48;else if(I.isMatrix4)S.boundary=64,S.storage=64;else if(I.isTexture)Bz("WebGLRenderer: Texture samplers can not be part of an uniforms group.");else if(ArrayBuffer.isView(I))S.boundary=16,S.storage=I.byteLength;else Bz("WebGLRenderer: Unsupported uniform value type.",I);return S}function L(I){let S=I.target;S.removeEventListener("dispose",L);let w=q.indexOf(S.__bindingPointIndex);q.splice(w,1),z.deleteBuffer(K[S.id]),delete K[S.id],delete W[S.id]}function O(){for(let I in K)z.deleteBuffer(K[I]);q=[],K={},W={}}return{bind:G,update:N,dispose:O}}var nG=new Uint16Array([12469,15057,12620,14925,13266,14620,13807,14376,14323,13990,14545,13625,14713,13328,14840,12882,14931,12528,14996,12233,15039,11829,15066,11525,15080,11295,15085,10976,15082,10705,15073,10495,13880,14564,13898,14542,13977,14430,14158,14124,14393,13732,14556,13410,14702,12996,14814,12596,14891,12291,14937,11834,14957,11489,14958,11194,14943,10803,14921,10506,14893,10278,14858,9960,14484,14039,14487,14025,14499,13941,14524,13740,14574,13468,14654,13106,14743,12678,14818,12344,14867,11893,14889,11509,14893,11180,14881,10751,14852,10428,14812,10128,14765,9754,14712,9466,14764,13480,14764,13475,14766,13440,14766,13347,14769,13070,14786,12713,14816,12387,14844,11957,14860,11549,14868,11215,14855,10751,14825,10403,14782,10044,14729,9651,14666,9352,14599,9029,14967,12835,14966,12831,14963,12804,14954,12723,14936,12564,14917,12347,14900,11958,14886,11569,14878,11247,14859,10765,14828,10401,14784,10011,14727,9600,14660,9289,14586,8893,14508,8533,15111,12234,15110,12234,15104,12216,15092,12156,15067,12010,15028,11776,14981,11500,14942,11205,14902,10752,14861,10393,14812,9991,14752,9570,14682,9252,14603,8808,14519,8445,14431,8145,15209,11449,15208,11451,15202,11451,15190,11438,15163,11384,15117,11274,15055,10979,14994,10648,14932,10343,14871,9936,14803,9532,14729,9218,14645,8742,14556,8381,14461,8020,14365,7603,15273,10603,15272,10607,15267,10619,15256,10631,15231,10614,15182,10535,15118,10389,15042,10167,14963,9787,14883,9447,14800,9115,14710,8665,14615,8318,14514,7911,14411,7507,14279,7198,15314,9675,15313,9683,15309,9712,15298,9759,15277,9797,15229,9773,15166,9668,15084,9487,14995,9274,14898,8910,14800,8539,14697,8234,14590,7790,14479,7409,14367,7067,14178,6621,15337,8619,15337,8631,15333,8677,15325,8769,15305,8871,15264,8940,15202,8909,15119,8775,15022,8565,14916,8328,14804,8009,14688,7614,14569,7287,14448,6888,14321,6483,14088,6171,15350,7402,15350,7419,15347,7480,15340,7613,15322,7804,15287,7973,15229,8057,15148,8012,15046,7846,14933,7611,14810,7357,14682,7069,14552,6656,14421,6316,14251,5948,14007,5528,15356,5942,15356,5977,15353,6119,15348,6294,15332,6551,15302,6824,15249,7044,15171,7122,15070,7050,14949,6861,14818,6611,14679,6349,14538,6067,14398,5651,14189,5311,13935,4958,15359,4123,15359,4153,15356,4296,15353,4646,15338,5160,15311,5508,15263,5829,15188,6042,15088,6094,14966,6001,14826,5796,14678,5543,14527,5287,14377,4985,14133,4586,13869,4257,15360,1563,15360,1642,15358,2076,15354,2636,15341,3350,15317,4019,15273,4429,15203,4732,15105,4911,14981,4932,14836,4818,14679,4621,14517,4386,14359,4156,14083,3795,13808,3437,15360,122,15360,137,15358,285,15355,636,15344,1274,15322,2177,15281,2765,15215,3223,15120,3451,14995,3569,14846,3567,14681,3466,14511,3305,14344,3121,14037,2800,13753,2467,15360,0,15360,1,15359,21,15355,89,15346,253,15325,479,15287,796,15225,1148,15133,1492,15008,1749,14856,1882,14685,1886,14506,1783,14324,1608,13996,1398,13702,1183]),VQ=null;function oG(){if(VQ===null)VQ=new tJ(nG,16,16,1030,1016),VQ.name="DFG_LUT",VQ.minFilter=1006,VQ.magFilter=1006,VQ.wrapS=1001,VQ.wrapT=1001,VQ.generateMipmaps=!1,VQ.needsUpdate=!0;return VQ}class a${constructor(z={}){let{canvas:J=U9(),context:Q=null,depth:$=!0,stencil:K=!1,alpha:W=!1,antialias:q=!1,premultipliedAlpha:B=!0,preserveDrawingBuffer:G=!1,powerPreference:N="default",failIfMajorPerformanceCaveat:Z=!1,reversedDepthBuffer:H=!1,outputBufferType:D=1009}=z;this.isWebGLRenderer=!0;let U;if(Q!==null){if(typeof WebGLRenderingContext<"u"&&Q instanceof WebGLRenderingContext)throw Error("THREE.WebGLRenderer: WebGL 1 is not supported since r163.");U=Q.getContextAttributes().alpha}else U=W;let X=D,k=new Set([1033,1031,1029]),Y=new Set([1009,1014,1012,1020,1017,1018]),V=new Uint32Array(4),L=new Int32Array(4),O=new R,I=null,S=null,w=[],C=[],E=null;this.domElement=J,this.debug={checkShaderErrors:!0,onShaderError:null},this.autoClear=!0,this.autoClearColor=!0,this.autoClearDepth=!0,this.autoClearStencil=!0,this.sortObjects=!0,this.clippingPlanes=[],this.localClippingEnabled=!1,this.toneMapping=0,this.toneMappingExposure=1,this.transmissionResolutionScale=1;let F=this,x=!1,P=null,p=null,n=null,j=null;this._outputColorSpace="srgb";let m=0,l=0,_=null,t=-1,$z=null,qz=new BJ,Cz=new BJ,Az=null,NJ=new Fz(0),qJ=0,s=J.width,Gz=J.height,Oz=1,Zz=null,jz=null,JJ=new BJ(0,0,s,Gz),uz=new BJ(0,0,s,Gz),gz=!1,r=new mQ,Qz=!1,Jz=!1,Ez=new pz,Mz=new R,vz=new BJ,Tz={background:null,fog:null,environment:null,overrideMaterial:null,isScene:!0},cz=!1;function nz(){return _===null?Oz:1}let v=Q;function UJ(M,h){return J.getContext(M,h)}try{let M={alpha:!0,depth:$,stencil:K,antialias:q,premultipliedAlpha:B,preserveDrawingBuffer:G,powerPreference:N,failIfMajorPerformanceCaveat:Z};if("setAttribute"in J)J.setAttribute("data-engine","three.js r185");if(J.addEventListener("webglcontextlost",oz,!1),J.addEventListener("webglcontextrestored",EJ,!1),J.addEventListener("webglcontextcreationerror",VJ,!1),v===null){if(v=UJ("webgl2",M),v===null)if(UJ("webgl2"))throw Error("THREE.WebGLRenderer: Error creating WebGL context with your selected attributes.");else throw Error("THREE.WebGLRenderer: Error creating WebGL context.")}}catch(M){throw Pz("WebGLRenderer: "+M.message),M}let ez,tz,y,A,f,u,e,Kz,Dz,c,i,Iz,fz,Yz,Wz,_z,bz,WJ,T,Nz,o,Hz,Lz;function zz(){if(ez=new JB(v),ez.init(),o=new n$(v,ez),tz=new o4(v,ez,z,o),y=new dG(v,ez),tz.reversedDepthBuffer&&H)y.buffers.depth.setReversed(!0);p=v.createFramebuffer(),n=v.createFramebuffer(),j=v.createFramebuffer(),A=new KB(v),f=new yG,u=new pG(v,ez,y,f,tz,o,A),e=new zB(F),Kz=new G3(v),Hz=new c4(v,Kz),Dz=new QB(v,Kz,A,Hz),c=new qB(v,Dz,Kz,Hz,A),WJ=new WB(v,tz,u),Wz=new s4(f),i=new LG(F,e,ez,tz,Hz,Wz),Iz=new mG(F,f),fz=new wG,Yz=new TG(ez),bz=new m4(F,e,y,c,U,B),_z=new bG(F,c,tz),Lz=new cG(v,A,tz,y),T=new n4(v,ez,A),Nz=new $B(v,ez,A),A.programs=i.programs,F.capabilities=tz,F.extensions=ez,F.properties=f,F.renderLists=fz,F.shadowMap=_z,F.state=y,F.info=A}if(zz(),X!==1009)E=new GB(X,J.width,J.height,q,$,K);let Uz=new s$(F,v);this.xr=Uz,this.getContext=function(){return v},this.getContextAttributes=function(){return v.getContextAttributes()},this.forceContextLoss=function(){let M=ez.get("WEBGL_lose_context");if(M)M.loseContext()},this.forceContextRestore=function(){let M=ez.get("WEBGL_lose_context");if(M)M.restoreContext()},this.getPixelRatio=function(){return Oz},this.setPixelRatio=function(M){if(M===void 0)return;Oz=M,this.setSize(s,Gz,!1)},this.getSize=function(M){return M.set(s,Gz)},this.setSize=function(M,h,g=!0){if(Uz.isPresenting){Bz("WebGLRenderer: Can't change size while VR device is presenting.");return}if(s=M,Gz=h,J.width=Math.floor(M*Oz),J.height=Math.floor(h*Oz),g===!0)J.style.width=M+"px",J.style.height=h+"px";if(E!==null)E.setSize(J.width,J.height);this.setViewport(0,0,M,h)},this.getDrawingBufferSize=function(M){return M.set(s*Oz,Gz*Oz).floor()},this.setDrawingBufferSize=function(M,h,g){s=M,Gz=h,Oz=g,J.width=Math.floor(M*g),J.height=Math.floor(h*g),this.setViewport(0,0,M,h)},this.setEffects=function(M){if(X===1009){Pz("WebGLRenderer: setEffects() requires outputBufferType set to HalfFloatType or FloatType.");return}if(M){for(let h=0;h<M.length;h++)if(M[h].isOutputPass===!0){Bz("WebGLRenderer: OutputPass is not needed in setEffects(). Tone mapping and color space conversion are applied automatically.");break}}E.setEffects(M||[])},this.getCurrentViewport=function(M){return M.copy(qz)},this.getViewport=function(M){return M.copy(JJ)},this.setViewport=function(M,h,g,b){if(M.isVector4)JJ.set(M.x,M.y,M.z,M.w);else JJ.set(M,h,g,b);y.viewport(qz.copy(JJ).multiplyScalar(Oz).round())},this.getScissor=function(M){return M.copy(uz)},this.setScissor=function(M,h,g,b){if(M.isVector4)uz.set(M.x,M.y,M.z,M.w);else uz.set(M,h,g,b);y.scissor(Cz.copy(uz).multiplyScalar(Oz).round())},this.getScissorTest=function(){return gz},this.setScissorTest=function(M){y.setScissorTest(gz=M)},this.setOpaqueSort=function(M){Zz=M},this.setTransparentSort=function(M){jz=M},this.getClearColor=function(M){return M.copy(bz.getClearColor())},this.setClearColor=function(){bz.setClearColor(...arguments)},this.getClearAlpha=function(){return bz.getClearAlpha()},this.setClearAlpha=function(){bz.setClearAlpha(...arguments)},this.clear=function(M=!0,h=!0,g=!0){let b=0;if(M){let d=!1;if(_!==null){let kz=_.texture.format;d=k.has(kz)}if(d){let kz=_.texture.type,wz=Y.has(kz),Xz=bz.getClearColor(),Rz=bz.getClearAlpha(),hz=Xz.r,sz=Xz.g,rz=Xz.b;if(wz)V[0]=hz,V[1]=sz,V[2]=rz,V[3]=Rz,v.clearBufferuiv(v.COLOR,0,V);else L[0]=hz,L[1]=sz,L[2]=rz,L[3]=Rz,v.clearBufferiv(v.COLOR,0,L)}else b|=v.COLOR_BUFFER_BIT}if(h)b|=v.DEPTH_BUFFER_BIT,this.state.buffers.depth.setMask(!0);if(g)b|=v.STENCIL_BUFFER_BIT,this.state.buffers.stencil.setMask(4294967295);if(b!==0)v.clear(b)},this.clearColor=function(){this.clear(!0,!1,!1)},this.clearDepth=function(){this.clear(!1,!0,!1)},this.clearStencil=function(){this.clear(!1,!1,!0)},this.setNodesHandler=function(M){M.setRenderer(this),P=M},this.dispose=function(){J.removeEventListener("webglcontextlost",oz,!1),J.removeEventListener("webglcontextrestored",EJ,!1),J.removeEventListener("webglcontextcreationerror",VJ,!1),bz.dispose(),fz.dispose(),Yz.dispose(),f.dispose(),e.dispose(),c.dispose(),Hz.dispose(),Lz.dispose(),i.dispose(),Uz.dispose(),Uz.removeEventListener("sessionstart",S7),Uz.removeEventListener("sessionend",w7),iQ.stop()};function oz(M){M.preventDefault(),M1("WebGLRenderer: Context Lost."),x=!0}function EJ(){M1("WebGLRenderer: Context Restored."),x=!1;let M=A.autoReset,h=_z.enabled,g=_z.autoUpdate,b=_z.needsUpdate,d=_z.type;zz(),A.autoReset=M,_z.enabled=h,_z.autoUpdate=g,_z.needsUpdate=b,_z.type=d}function VJ(M){Pz("WebGLRenderer: A WebGL context could not be created. Reason: ",M.statusMessage)}function ZQ(M){let h=M.target;h.removeEventListener("dispose",ZQ),kQ(h)}function kQ(M){t$(M),f.remove(M)}function t$(M){let h=f.get(M).programs;if(h!==void 0){if(h.forEach(function(g){i.releaseProgram(g)}),M.isShaderMaterial)i.releaseShaderCache(M)}}this.renderBufferDirect=function(M,h,g,b,d,kz){if(h===null)h=Tz;let wz=d.isMesh&&d.matrixWorld.determinantAffine()<0,Xz=zK(M,h,g,b,d);y.setMaterial(b,wz);let Rz=g.index,hz=1;if(b.wireframe===!0){if(Rz=Dz.getWireframeAttribute(g),Rz===void 0)return;hz=2}let sz=g.drawRange,rz=g.attributes.position,xz=sz.start*hz,DJ=(sz.start+sz.count)*hz;if(kz!==null)xz=Math.max(xz,kz.start*hz),DJ=Math.min(DJ,(kz.start+kz.count)*hz);if(Rz!==null)xz=Math.max(xz,0),DJ=Math.min(DJ,Rz.count);else if(rz!==void 0&&rz!==null)xz=Math.max(xz,0),DJ=Math.min(DJ,rz.count);let OJ=DJ-xz;if(OJ<0||OJ===1/0)return;Hz.setup(d,b,Xz,g,Rz);let IJ,ZJ=T;if(Rz!==null)IJ=Kz.get(Rz),ZJ=Nz,ZJ.setIndex(IJ);if(d.isMesh)if(b.wireframe===!0)y.setLineWidth(b.wireframeLinewidth*nz()),ZJ.setMode(v.LINES);else ZJ.setMode(v.TRIANGLES);else if(d.isLine){let TJ=b.linewidth;if(TJ===void 0)TJ=1;if(y.setLineWidth(TJ*nz()),d.isLineSegments)ZJ.setMode(v.LINES);else if(d.isLineLoop)ZJ.setMode(v.LINE_LOOP);else ZJ.setMode(v.LINE_STRIP)}else if(d.isPoints)ZJ.setMode(v.POINTS);else if(d.isSprite)ZJ.setMode(v.TRIANGLES);if(d.isBatchedMesh)if(!ez.get("WEBGL_multi_draw")){let{_multiDrawStarts:TJ,_multiDrawCounts:yz,_multiDrawCount:oJ}=d,QJ=Rz?Kz.get(Rz).bytesPerElement:1,zQ=f.get(b).currentProgram.getUniforms();for(let HQ=0;HQ<oJ;HQ++)zQ.setValue(v,"_gl_DrawID",HQ),ZJ.render(TJ[HQ]/QJ,yz[HQ])}else ZJ.renderMultiDraw(d._multiDrawStarts,d._multiDrawCounts,d._multiDrawCount);else if(d.isInstancedMesh)ZJ.renderInstances(xz,OJ,d.count);else if(g.isInstancedBufferGeometry){let TJ=g._maxInstanceCount!==void 0?g._maxInstanceCount:1/0,yz=Math.min(g.instanceCount,TJ);ZJ.renderInstances(xz,OJ,yz)}else ZJ.render(xz,OJ)};function y7(M,h,g){if(M.transparent===!0&&M.side===2&&M.forceSinglePass===!1)M.side=1,M.needsUpdate=!0,u1(M,h,g),M.side=0,M.needsUpdate=!0,u1(M,h,g),M.side=2;else u1(M,h,g)}this.compile=function(M,h,g=null){if(g===null)g=M;if(S=Yz.get(g),S.init(h),C.push(S),g.traverseVisible(function(d){if(d.isLight&&d.layers.test(h.layers)){if(S.pushLight(d),d.castShadow)S.pushShadow(d)}}),M!==g)M.traverseVisible(function(d){if(d.isLight&&d.layers.test(h.layers)){if(S.pushLight(d),d.castShadow)S.pushShadow(d)}});S.setupLights();let b=new Set;return M.traverse(function(d){if(!(d.isMesh||d.isPoints||d.isLine||d.isSprite))return;let kz=d.material;if(kz)if(Array.isArray(kz))for(let wz=0;wz<kz.length;wz++){let Xz=kz[wz];y7(Xz,g,d),b.add(Xz)}else y7(kz,g,d),b.add(kz)}),S=C.pop(),b},this.compileAsync=function(M,h,g=null){let b=this.compile(M,h,g);return new Promise((d)=>{function kz(){if(b.forEach(function(wz){if(f.get(wz).currentProgram.isReady())b.delete(wz)}),b.size===0){d(M);return}setTimeout(kz,10)}if(ez.get("KHR_parallel_shader_compile")!==null)kz();else setTimeout(kz,10)})};let w5=null;function r$(M){if(w5)w5(M)}function S7(){iQ.stop()}function w7(){iQ.start()}let iQ=new x$;if(iQ.setAnimationLoop(r$),typeof self<"u")iQ.setContext(self);this.setAnimationLoop=function(M){w5=M,Uz.setAnimationLoop(M),M===null?iQ.stop():iQ.start()},Uz.addEventListener("sessionstart",S7),Uz.addEventListener("sessionend",w7),this.render=function(M,h){if(h!==void 0&&h.isCamera!==!0){Pz("WebGLRenderer.render: camera is not an instance of THREE.Camera.");return}if(x===!0)return;if(P!==null)P.renderStart(M,h);let g=Uz.enabled===!0&&Uz.isPresenting===!0,b=E!==null&&(_===null||g)&&E.begin(F,_);if(M.matrixWorldAutoUpdate===!0)M.updateMatrixWorld();if(h.parent===null&&h.matrixWorldAutoUpdate===!0)h.updateMatrixWorld();if(Uz.enabled===!0&&Uz.isPresenting===!0&&(E===null||E.isCompositing()===!1)){if(Uz.cameraAutoUpdate===!0)Uz.updateCamera(h);h=Uz.getCamera()}if(M.isScene===!0)M.onBeforeRender(F,M,h,_);if(S=Yz.get(M,C.length),S.init(h),S.state.textureUnits=u.getTextureUnits(),C.push(S),Ez.multiplyMatrices(h.projectionMatrix,h.matrixWorldInverse),r.setFromProjectionMatrix(Ez,2000,h.reversedDepth),Jz=this.localClippingEnabled,Qz=Wz.init(this.clippingPlanes,Jz),I=fz.get(M,w.length),I.init(),w.push(I),Uz.enabled===!0&&Uz.isPresenting===!0){let wz=F.xr.getDepthSensingMesh();if(wz!==null)C5(wz,h,-1/0,F.sortObjects)}if(C5(M,h,0,F.sortObjects),I.finish(),F.sortObjects===!0)I.sort(Zz,jz,h.reversedDepth);if(cz=Uz.enabled===!1||Uz.isPresenting===!1||Uz.hasDepthSensing()===!1,cz)bz.addToRenderList(I,M);if(this.info.render.frame++,this.info.autoReset===!0)this.info.reset();if(Qz===!0)Wz.beginShadows();let d=S.state.shadowsArray;if(_z.render(d,M,h),Qz===!0)Wz.endShadows();if((b&&E.hasRenderPass())===!1){let{opaque:wz,transmissive:Xz}=I;if(S.setupLights(),h.isArrayCamera){let Rz=h.cameras;if(Xz.length>0)for(let hz=0,sz=Rz.length;hz<sz;hz++){let rz=Rz[hz];R7(wz,Xz,M,rz)}if(cz)bz.render(M);for(let hz=0,sz=Rz.length;hz<sz;hz++){let rz=Rz[hz];C7(I,M,rz,rz.viewport)}}else{if(Xz.length>0)R7(wz,Xz,M,h);if(cz)bz.render(M);C7(I,M,h)}}if(_!==null&&l===0)u.updateMultisampleRenderTarget(_),u.updateRenderTargetMipmap(_);if(b)E.end(F);if(M.isScene===!0)M.onAfterRender(F,M,h);if(Hz.resetDefaultState(),t=-1,$z=null,C.pop(),C.length>0){if(S=C[C.length-1],u.setTextureUnits(S.state.textureUnits),Qz===!0)Wz.setGlobalState(F.clippingPlanes,S.state.camera)}else S=null;if(w.pop(),w.length>0)I=w[w.length-1];else I=null;if(P!==null)P.renderEnd()};function C5(M,h,g,b){if(M.visible===!1)return;if(M.layers.test(h.layers)){if(M.isGroup)g=M.renderOrder;else if(M.isLOD){if(M.autoUpdate===!0)M.update(h)}else if(M.isLightProbeGrid)S.pushLightProbeGrid(M);else if(M.isLight){if(S.pushLight(M),M.castShadow)S.pushShadow(M)}else if(M.isSprite){if(!M.frustumCulled||r.intersectsSprite(M)){if(b)vz.setFromMatrixPosition(M.matrixWorld).applyMatrix4(Ez);let wz=c.update(M),Xz=M.material;if(Xz.visible)I.push(M,wz,Xz,g,vz.z,null)}}else if(M.isMesh||M.isLine||M.isPoints){if(!M.frustumCulled||r.intersectsObject(M)){let wz=c.update(M),Xz=M.material;if(b){if(M.boundingSphere!==void 0){if(M.boundingSphere===null)M.computeBoundingSphere();vz.copy(M.boundingSphere.center)}else{if(wz.boundingSphere===null)wz.computeBoundingSphere();vz.copy(wz.boundingSphere.center)}vz.applyMatrix4(M.matrixWorld).applyMatrix4(Ez)}if(Array.isArray(Xz)){let Rz=wz.groups;for(let hz=0,sz=Rz.length;hz<sz;hz++){let rz=Rz[hz],xz=Xz[rz.materialIndex];if(xz&&xz.visible)I.push(M,wz,xz,g,vz.z,rz)}}else if(Xz.visible)I.push(M,wz,Xz,g,vz.z,null)}}}let kz=M.children;for(let wz=0,Xz=kz.length;wz<Xz;wz++)C5(kz[wz],h,g,b)}function C7(M,h,g,b){let{opaque:d,transmissive:kz,transparent:wz}=M;if(S.setupLightsView(g),Qz===!0)Wz.setGlobalState(F.clippingPlanes,g);if(b)y.viewport(qz.copy(b));if(d.length>0)p1(d,h,g);if(kz.length>0)p1(kz,h,g);if(wz.length>0)p1(wz,h,g);y.buffers.depth.setTest(!0),y.buffers.depth.setMask(!0),y.buffers.color.setMask(!0),y.setPolygonOffset(!1)}function R7(M,h,g,b){if((g.isScene===!0?g.overrideMaterial:null)!==null)return;if(S.state.transmissionRenderTarget[b.id]===void 0){let xz=ez.has("EXT_color_buffer_half_float")||ez.has("EXT_color_buffer_float");S.state.transmissionRenderTarget[b.id]=new nJ(1,1,{generateMipmaps:!0,type:xz?1016:1009,minFilter:1008,samples:Math.max(4,tz.samples),stencilBuffer:K,resolveDepthBuffer:!1,resolveStencilBuffer:!1,colorSpace:zJ.workingColorSpace})}let kz=S.state.transmissionRenderTarget[b.id],wz=b.viewport||qz;kz.setSize(wz.z*F.transmissionResolutionScale,wz.w*F.transmissionResolutionScale);let Xz=F.getRenderTarget(),Rz=F.getActiveCubeFace(),hz=F.getActiveMipmapLevel();if(F.setRenderTarget(kz),F.getClearColor(NJ),qJ=F.getClearAlpha(),qJ<1)F.setClearColor(16777215,0.5);if(F.clear(),cz)bz.render(g);let sz=F.toneMapping;F.toneMapping=0;let rz=b.viewport;if(b.viewport!==void 0)b.viewport=void 0;if(S.setupLightsView(b),Qz===!0)Wz.setGlobalState(F.clippingPlanes,b);if(p1(M,g,b),u.updateMultisampleRenderTarget(kz),u.updateRenderTargetMipmap(kz),ez.has("WEBGL_multisampled_render_to_texture")===!1){let xz=!1;for(let DJ=0,OJ=h.length;DJ<OJ;DJ++){let IJ=h[DJ],{object:ZJ,geometry:TJ,material:yz,group:oJ}=IJ;if(yz.side===2&&ZJ.layers.test(b.layers)){let QJ=yz.side;yz.side=1,yz.needsUpdate=!0,P7(ZJ,g,b,TJ,yz,oJ),yz.side=QJ,yz.needsUpdate=!0,xz=!0}}if(xz===!0)u.updateMultisampleRenderTarget(kz),u.updateRenderTargetMipmap(kz)}if(F.setRenderTarget(Xz,Rz,hz),F.setClearColor(NJ,qJ),rz!==void 0)b.viewport=rz;F.toneMapping=sz}function p1(M,h,g){let b=h.isScene===!0?h.overrideMaterial:null;for(let d=0,kz=M.length;d<kz;d++){let wz=M[d],{object:Xz,geometry:Rz,group:hz}=wz,sz=wz.material;if(sz.allowOverride===!0&&b!==null)sz=b;if(Xz.layers.test(g.layers))P7(Xz,h,g,Rz,sz,hz)}}function P7(M,h,g,b,d,kz){if(M.onBeforeRender(F,h,g,b,d,kz),M.modelViewMatrix.multiplyMatrices(g.matrixWorldInverse,M.matrixWorld),M.normalMatrix.getNormalMatrix(M.modelViewMatrix),d.onBeforeRender(F,h,g,b,M,kz),d.transparent===!0&&d.side===2&&d.forceSinglePass===!1)d.side=1,d.needsUpdate=!0,F.renderBufferDirect(g,h,b,d,M,kz),d.side=0,d.needsUpdate=!0,F.renderBufferDirect(g,h,b,d,M,kz),d.side=2;else F.renderBufferDirect(g,h,b,d,M,kz);M.onAfterRender(F,h,g,b,d,kz)}function u1(M,h,g){if(h.isScene!==!0)h=Tz;let b=f.get(M),d=S.state.lights,kz=S.state.shadowsArray,wz=d.state.version,Xz=i.getParameters(M,d.state,kz,h,g,S.state.lightProbeGridArray),Rz=i.getProgramCacheKey(Xz),hz=b.programs;b.environment=M.isMeshStandardMaterial||M.isMeshLambertMaterial||M.isMeshPhongMaterial?h.environment:null,b.fog=h.fog;let sz=M.isMeshStandardMaterial||M.isMeshLambertMaterial&&!M.envMap||M.isMeshPhongMaterial&&!M.envMap;if(b.envMap=e.get(M.envMap||b.environment,sz),b.envMapRotation=b.environment!==null&&M.envMap===null?h.environmentRotation:M.envMapRotation,hz===void 0)M.addEventListener("dispose",ZQ),hz=new Map,b.programs=hz;let rz=hz.get(Rz);if(rz!==void 0){if(b.currentProgram===rz&&b.lightsStateVersion===wz)return f7(M,Xz),rz}else{if(Xz.uniforms=i.getUniforms(M),P!==null&&M.isNodeMaterial)P.build(M,g,Xz);M.onBeforeCompile(Xz,F),rz=i.acquireProgram(Xz,Rz),hz.set(Rz,rz),b.uniforms=Xz.uniforms}let xz=b.uniforms;if(!M.isShaderMaterial&&!M.isRawShaderMaterial||M.clipping===!0)xz.clippingPlanes=Wz.uniform;if(f7(M,Xz),b.needsLights=QK(M),b.lightsStateVersion=wz,b.needsLights)xz.ambientLightColor.value=d.state.ambient,xz.lightProbe.value=d.state.probe,xz.directionalLights.value=d.state.directional,xz.directionalLightShadows.value=d.state.directionalShadow,xz.spotLights.value=d.state.spot,xz.spotLightShadows.value=d.state.spotShadow,xz.rectAreaLights.value=d.state.rectArea,xz.ltc_1.value=d.state.rectAreaLTC1,xz.ltc_2.value=d.state.rectAreaLTC2,xz.pointLights.value=d.state.point,xz.pointLightShadows.value=d.state.pointShadow,xz.hemisphereLights.value=d.state.hemi,xz.directionalShadowMatrix.value=d.state.directionalShadowMatrix,xz.spotLightMatrix.value=d.state.spotLightMatrix,xz.spotLightMap.value=d.state.spotLightMap,xz.pointShadowMatrix.value=d.state.pointShadowMatrix;return b.lightProbeGrid=S.state.lightProbeGridArray.length>0,b.currentProgram=rz,b.uniformsList=null,rz}function v7(M){if(M.uniformsList===null){let h=M.currentProgram.getUniforms();M.uniformsList=O1.seqWithValue(h.seq,M.uniforms)}return M.uniformsList}function f7(M,h){let g=f.get(M);g.outputColorSpace=h.outputColorSpace,g.batching=h.batching,g.batchingColor=h.batchingColor,g.instancing=h.instancing,g.instancingColor=h.instancingColor,g.instancingMorph=h.instancingMorph,g.skinning=h.skinning,g.morphTargets=h.morphTargets,g.morphNormals=h.morphNormals,g.morphColors=h.morphColors,g.morphTargetsCount=h.morphTargetsCount,g.numClippingPlanes=h.numClippingPlanes,g.numIntersection=h.numClipIntersection,g.vertexAlphas=h.vertexAlphas,g.vertexTangents=h.vertexTangents,g.toneMapping=h.toneMapping}function e$(M,h){if(M.length===0)return null;if(M.length===1)return M[0].texture!==null?M[0]:null;O.setFromMatrixPosition(h.matrixWorld);for(let g=0,b=M.length;g<b;g++){let d=M[g];if(d.texture!==null&&d.boundingBox.containsPoint(O))return d}return null}function zK(M,h,g,b,d){if(h.isScene!==!0)h=Tz;u.resetTextureUnits();let kz=h.fog,wz=b.isMeshStandardMaterial||b.isMeshLambertMaterial||b.isMeshPhongMaterial?h.environment:null,Xz=_===null?F.outputColorSpace:_.isXRRenderTarget===!0?_.texture.colorSpace:zJ.workingColorSpace,Rz=b.isMeshStandardMaterial||b.isMeshLambertMaterial&&!b.envMap||b.isMeshPhongMaterial&&!b.envMap,hz=e.get(b.envMap||wz,Rz),sz=b.vertexColors===!0&&!!g.attributes.color&&g.attributes.color.itemSize===4,rz=!!g.attributes.tangent&&(!!b.normalMap||b.anisotropy>0),xz=!!g.morphAttributes.position,DJ=!!g.morphAttributes.normal,OJ=!!g.morphAttributes.color,IJ=0;if(b.toneMapped){if(_===null||_.isXRRenderTarget===!0)IJ=F.toneMapping}let ZJ=g.morphAttributes.position||g.morphAttributes.normal||g.morphAttributes.color,TJ=ZJ!==void 0?ZJ.length:0,yz=f.get(b),oJ=S.state.lights;if(Qz===!0){if(Jz===!0||M!==$z){let YJ=M===$z&&b.id===t;Wz.setState(b,M,YJ)}}let QJ=!1;if(b.version===yz.__version){if(yz.needsLights&&yz.lightsStateVersion!==oJ.state.version)QJ=!0;else if(yz.outputColorSpace!==Xz)QJ=!0;else if(d.isBatchedMesh&&yz.batching===!1)QJ=!0;else if(!d.isBatchedMesh&&yz.batching===!0)QJ=!0;else if(d.isBatchedMesh&&yz.batchingColor===!0&&d.colorTexture===null)QJ=!0;else if(d.isBatchedMesh&&yz.batchingColor===!1&&d.colorTexture!==null)QJ=!0;else if(d.isInstancedMesh&&yz.instancing===!1)QJ=!0;else if(!d.isInstancedMesh&&yz.instancing===!0)QJ=!0;else if(d.isSkinnedMesh&&yz.skinning===!1)QJ=!0;else if(!d.isSkinnedMesh&&yz.skinning===!0)QJ=!0;else if(d.isInstancedMesh&&yz.instancingColor===!0&&d.instanceColor===null)QJ=!0;else if(d.isInstancedMesh&&yz.instancingColor===!1&&d.instanceColor!==null)QJ=!0;else if(d.isInstancedMesh&&yz.instancingMorph===!0&&d.morphTexture===null)QJ=!0;else if(d.isInstancedMesh&&yz.instancingMorph===!1&&d.morphTexture!==null)QJ=!0;else if(yz.envMap!==hz)QJ=!0;else if(b.fog===!0&&yz.fog!==kz)QJ=!0;else if(yz.numClippingPlanes!==void 0&&(yz.numClippingPlanes!==Wz.numPlanes||yz.numIntersection!==Wz.numIntersection))QJ=!0;else if(yz.vertexAlphas!==sz)QJ=!0;else if(yz.vertexTangents!==rz)QJ=!0;else if(yz.morphTargets!==xz)QJ=!0;else if(yz.morphNormals!==DJ)QJ=!0;else if(yz.morphColors!==OJ)QJ=!0;else if(yz.toneMapping!==IJ)QJ=!0;else if(yz.morphTargetsCount!==TJ)QJ=!0;else if(!!yz.lightProbeGrid!==S.state.lightProbeGridArray.length>0)QJ=!0}else QJ=!0,yz.__version=b.version;let zQ=yz.currentProgram;if(QJ===!0){if(zQ=u1(b,h,d),P&&b.isNodeMaterial)P.onUpdateProgram(b,zQ,yz)}let HQ=!1,vQ=!1,E0=!1,HJ=zQ.getUniforms(),FJ=yz.uniforms;if(y.useProgram(zQ.program))HQ=!0,vQ=!0,E0=!0;if(b.id!==t)t=b.id,vQ=!0;if(yz.needsLights){let YJ=e$(S.state.lightProbeGridArray,d);if(yz.lightProbeGrid!==YJ)yz.lightProbeGrid=YJ,vQ=!0}if(HQ||$z!==M){if(y.buffers.depth.getReversed()&&M.reversedDepth!==!0)M._reversedDepth=!0,M.updateProjectionMatrix();HJ.setValue(v,"projectionMatrix",M.projectionMatrix),HJ.setValue(v,"viewMatrix",M.matrixWorldInverse);let TQ=HJ.map.cameraPosition;if(TQ!==void 0)TQ.setValue(v,Mz.setFromMatrixPosition(M.matrixWorld));if(tz.logarithmicDepthBuffer)HJ.setValue(v,"logDepthBufFC",2/(Math.log(M.far+1)/Math.LN2));if(b.isMeshPhongMaterial||b.isMeshToonMaterial||b.isMeshLambertMaterial||b.isMeshBasicMaterial||b.isMeshStandardMaterial||b.isShaderMaterial)HJ.setValue(v,"isOrthographic",M.isOrthographicCamera===!0);if($z!==M)$z=M,vQ=!0,E0=!0}if(yz.needsLights){if(oJ.state.directionalShadowMap.length>0)HJ.setValue(v,"directionalShadowMap",oJ.state.directionalShadowMap,u);if(oJ.state.spotShadowMap.length>0)HJ.setValue(v,"spotShadowMap",oJ.state.spotShadowMap,u);if(oJ.state.pointShadowMap.length>0)HJ.setValue(v,"pointShadowMap",oJ.state.pointShadowMap,u)}if(d.isSkinnedMesh){HJ.setOptional(v,d,"bindMatrix"),HJ.setOptional(v,d,"bindMatrixInverse");let YJ=d.skeleton;if(YJ){if(YJ.boneTexture===null)YJ.computeBoneTexture();HJ.setValue(v,"boneTexture",YJ.boneTexture,u)}}if(d.isBatchedMesh){if(HJ.setOptional(v,d,"batchingTexture"),HJ.setValue(v,"batchingTexture",d._matricesTexture,u),HJ.setOptional(v,d,"batchingIdTexture"),HJ.setValue(v,"batchingIdTexture",d._indirectTexture,u),HJ.setOptional(v,d,"batchingColorTexture"),d._colorsTexture!==null)HJ.setValue(v,"batchingColorTexture",d._colorsTexture,u)}let fQ=g.morphAttributes;if(fQ.position!==void 0||fQ.normal!==void 0||fQ.color!==void 0)WJ.update(d,g,zQ);if(vQ||yz.receiveShadow!==d.receiveShadow)yz.receiveShadow=d.receiveShadow,HJ.setValue(v,"receiveShadow",d.receiveShadow);if((b.isMeshStandardMaterial||b.isMeshLambertMaterial||b.isMeshPhongMaterial)&&b.envMap===null&&h.environment!==null)FJ.envMapIntensity.value=h.environmentIntensity;if(FJ.dfgLUT!==void 0)FJ.dfgLUT.value=oG();if(vQ){if(HJ.setValue(v,"toneMappingExposure",F.toneMappingExposure),yz.needsLights)JK(FJ,E0);if(kz&&b.fog===!0)Iz.refreshFogUniforms(FJ,kz);if(Iz.refreshMaterialUniforms(FJ,b,Oz,Gz,S.state.transmissionRenderTarget[M.id]),yz.needsLights&&yz.lightProbeGrid){let YJ=yz.lightProbeGrid;FJ.probesSH.value=YJ.texture,FJ.probesMin.value.copy(YJ.boundingBox.min),FJ.probesMax.value.copy(YJ.boundingBox.max),FJ.probesResolution.value.copy(YJ.resolution)}O1.upload(v,v7(yz),FJ,u)}if(b.isShaderMaterial&&b.uniformsNeedUpdate===!0)O1.upload(v,v7(yz),FJ,u),b.uniformsNeedUpdate=!1;if(b.isSpriteMaterial)HJ.setValue(v,"center",d.center);if(HJ.setValue(v,"modelViewMatrix",d.modelViewMatrix),HJ.setValue(v,"normalMatrix",d.normalMatrix),HJ.setValue(v,"modelMatrix",d.matrixWorld),b.uniformsGroups!==void 0){let YJ=b.uniformsGroups;for(let TQ=0,I0=YJ.length;TQ<I0;TQ++){let T7=YJ[TQ];Lz.update(T7,zQ),Lz.bind(T7,zQ)}}return zQ}function JK(M,h){M.ambientLightColor.needsUpdate=h,M.lightProbe.needsUpdate=h,M.directionalLights.needsUpdate=h,M.directionalLightShadows.needsUpdate=h,M.pointLights.needsUpdate=h,M.pointLightShadows.needsUpdate=h,M.spotLights.needsUpdate=h,M.spotLightShadows.needsUpdate=h,M.rectAreaLights.needsUpdate=h,M.hemisphereLights.needsUpdate=h}function QK(M){return M.isMeshLambertMaterial||M.isMeshToonMaterial||M.isMeshPhongMaterial||M.isMeshStandardMaterial||M.isShadowMaterial||M.isShaderMaterial&&M.lights===!0}if(this.getActiveCubeFace=function(){return m},this.getActiveMipmapLevel=function(){return l},this.getRenderTarget=function(){return _},this.setRenderTargetTextures=function(M,h,g){let b=f.get(M);if(b.__autoAllocateDepthBuffer=M.resolveDepthBuffer===!1,b.__autoAllocateDepthBuffer===!1)b.__useRenderToTexture=!1;f.get(M.texture).__webglTexture=h,f.get(M.depthTexture).__webglTexture=b.__autoAllocateDepthBuffer?void 0:g,b.__hasExternalTextures=!0},this.setRenderTargetFramebuffer=function(M,h){let g=f.get(M);g.__webglFramebuffer=h,g.__useDefaultFramebuffer=h===void 0},this.setRenderTarget=function(M,h=0,g=0){_=M,m=h,l=g;let b=null,d=!1,kz=!1;if(M){let Xz=f.get(M);if(Xz.__useDefaultFramebuffer!==void 0){y.bindFramebuffer(v.FRAMEBUFFER,Xz.__webglFramebuffer),qz.copy(M.viewport),Cz.copy(M.scissor),Az=M.scissorTest,y.viewport(qz),y.scissor(Cz),y.setScissorTest(Az),t=-1;return}else if(Xz.__webglFramebuffer===void 0)u.setupRenderTarget(M);else if(Xz.__hasExternalTextures)u.rebindTextures(M,f.get(M.texture).__webglTexture,f.get(M.depthTexture).__webglTexture);else if(M.depthBuffer){let sz=M.depthTexture;if(Xz.__boundDepthTexture!==sz){if(sz!==null&&f.has(sz)&&(M.width!==sz.image.width||M.height!==sz.image.height))throw Error("THREE.WebGLRenderer: Attached DepthTexture is initialized to the incorrect size.");u.setupDepthRenderbuffer(M)}}let Rz=M.texture;if(Rz.isData3DTexture||Rz.isDataArrayTexture||Rz.isCompressedArrayTexture)kz=!0;let hz=f.get(M).__webglFramebuffer;if(M.isWebGLCubeRenderTarget){if(Array.isArray(hz[h]))b=hz[h][g];else b=hz[h];d=!0}else if(M.samples>0&&u.useMultisampledRTT(M)===!1)b=f.get(M).__webglMultisampledFramebuffer;else if(Array.isArray(hz))b=hz[g];else b=hz;qz.copy(M.viewport),Cz.copy(M.scissor),Az=M.scissorTest}else qz.copy(JJ).multiplyScalar(Oz).floor(),Cz.copy(uz).multiplyScalar(Oz).floor(),Az=gz;if(g!==0)b=p;if(y.bindFramebuffer(v.FRAMEBUFFER,b))y.drawBuffers(M,b);if(y.viewport(qz),y.scissor(Cz),y.setScissorTest(Az),d){let Xz=f.get(M.texture);v.framebufferTexture2D(v.FRAMEBUFFER,v.COLOR_ATTACHMENT0,v.TEXTURE_CUBE_MAP_POSITIVE_X+h,Xz.__webglTexture,g)}else if(kz){let Xz=h;for(let Rz=0;Rz<M.textures.length;Rz++){let hz=f.get(M.textures[Rz]);v.framebufferTextureLayer(v.FRAMEBUFFER,v.COLOR_ATTACHMENT0+Rz,hz.__webglTexture,g,Xz)}}else if(M!==null&&g!==0){let Xz=f.get(M.texture);v.framebufferTexture2D(v.FRAMEBUFFER,v.COLOR_ATTACHMENT0,v.TEXTURE_2D,Xz.__webglTexture,g)}t=-1},this.readRenderTargetPixels=function(M,h,g,b,d,kz,wz,Xz=0){if(!(M&&M.isWebGLRenderTarget)){Pz("WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");return}let Rz=f.get(M).__webglFramebuffer;if(M.isWebGLCubeRenderTarget&&wz!==void 0)Rz=Rz[wz];if(Rz){y.bindFramebuffer(v.FRAMEBUFFER,Rz);try{let hz=M.textures[Xz],sz=hz.format,rz=hz.type;if(M.textures.length>1)v.readBuffer(v.COLOR_ATTACHMENT0+Xz);if(!tz.textureFormatReadable(sz)){Pz("WebGLRenderer.readRenderTargetPixels: renderTarget is not in RGBA or implementation defined format.");return}if(!tz.textureTypeReadable(rz)){Pz("WebGLRenderer.readRenderTargetPixels: renderTarget is not in UnsignedByteType or implementation defined type.");return}if(h>=0&&h<=M.width-b&&(g>=0&&g<=M.height-d))v.readPixels(h,g,b,d,o.convert(sz),o.convert(rz),kz)}finally{let hz=_!==null?f.get(_).__webglFramebuffer:null;y.bindFramebuffer(v.FRAMEBUFFER,hz)}}},this.readRenderTargetPixelsAsync=async function(M,h,g,b,d,kz,wz,Xz=0){if(!(M&&M.isWebGLRenderTarget))throw Error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");let Rz=f.get(M).__webglFramebuffer;if(M.isWebGLCubeRenderTarget&&wz!==void 0)Rz=Rz[wz];if(Rz)if(h>=0&&h<=M.width-b&&(g>=0&&g<=M.height-d)){y.bindFramebuffer(v.FRAMEBUFFER,Rz);let hz=M.textures[Xz],sz=hz.format,rz=hz.type;if(M.textures.length>1)v.readBuffer(v.COLOR_ATTACHMENT0+Xz);if(!tz.textureFormatReadable(sz))throw Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in RGBA or implementation defined format.");if(!tz.textureTypeReadable(rz))throw Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in UnsignedByteType or implementation defined type.");let xz=v.createBuffer();v.bindBuffer(v.PIXEL_PACK_BUFFER,xz),v.bufferData(v.PIXEL_PACK_BUFFER,kz.byteLength,v.STREAM_READ),v.readPixels(h,g,b,d,o.convert(sz),o.convert(rz),0);let DJ=_!==null?f.get(_).__webglFramebuffer:null;y.bindFramebuffer(v.FRAMEBUFFER,DJ);let OJ=v.fenceSync(v.SYNC_GPU_COMMANDS_COMPLETE,0);return v.flush(),await UK(v,OJ,4),v.bindBuffer(v.PIXEL_PACK_BUFFER,xz),v.getBufferSubData(v.PIXEL_PACK_BUFFER,0,kz),v.deleteBuffer(xz),v.deleteSync(OJ),kz}else throw Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: requested read bounds are out of range.")},this.copyFramebufferToTexture=function(M,h=null,g=0){let b=Math.pow(2,-g),d=Math.floor(M.image.width*b),kz=Math.floor(M.image.height*b),wz=h!==null?h.x:0,Xz=h!==null?h.y:0;u.setTexture2D(M,0),v.copyTexSubImage2D(v.TEXTURE_2D,g,0,0,wz,Xz,d,kz),y.unbindTexture()},this.copyTextureToTexture=function(M,h,g=null,b=null,d=0,kz=0){let wz,Xz,Rz,hz,sz,rz,xz,DJ,OJ,IJ=M.isCompressedTexture?M.mipmaps[kz]:M.image;if(g!==null)wz=g.max.x-g.min.x,Xz=g.max.y-g.min.y,Rz=g.isBox3?g.max.z-g.min.z:1,hz=g.min.x,sz=g.min.y,rz=g.isBox3?g.min.z:0;else{let FJ=Math.pow(2,-d);if(wz=Math.floor(IJ.width*FJ),Xz=Math.floor(IJ.height*FJ),M.isDataArrayTexture)Rz=IJ.depth;else if(M.isData3DTexture)Rz=Math.floor(IJ.depth*FJ);else Rz=1;hz=0,sz=0,rz=0}if(b!==null)xz=b.x,DJ=b.y,OJ=b.z;else xz=0,DJ=0,OJ=0;let ZJ=o.convert(h.format),TJ=o.convert(h.type),yz;if(h.isData3DTexture)u.setTexture3D(h,0),yz=v.TEXTURE_3D;else if(h.isDataArrayTexture||h.isCompressedArrayTexture)u.setTexture2DArray(h,0),yz=v.TEXTURE_2D_ARRAY;else u.setTexture2D(h,0),yz=v.TEXTURE_2D;y.activeTexture(v.TEXTURE0),y.pixelStorei(v.UNPACK_FLIP_Y_WEBGL,h.flipY),y.pixelStorei(v.UNPACK_PREMULTIPLY_ALPHA_WEBGL,h.premultiplyAlpha),y.pixelStorei(v.UNPACK_ALIGNMENT,h.unpackAlignment);let oJ=y.getParameter(v.UNPACK_ROW_LENGTH),QJ=y.getParameter(v.UNPACK_IMAGE_HEIGHT),zQ=y.getParameter(v.UNPACK_SKIP_PIXELS),HQ=y.getParameter(v.UNPACK_SKIP_ROWS),vQ=y.getParameter(v.UNPACK_SKIP_IMAGES);y.pixelStorei(v.UNPACK_ROW_LENGTH,IJ.width),y.pixelStorei(v.UNPACK_IMAGE_HEIGHT,IJ.height),y.pixelStorei(v.UNPACK_SKIP_PIXELS,hz),y.pixelStorei(v.UNPACK_SKIP_ROWS,sz),y.pixelStorei(v.UNPACK_SKIP_IMAGES,rz);let E0=M.isDataArrayTexture||M.isData3DTexture,HJ=h.isDataArrayTexture||h.isData3DTexture;if(M.isDepthTexture){let FJ=f.get(M),fQ=f.get(h),YJ=f.get(FJ.__renderTarget),TQ=f.get(fQ.__renderTarget);y.bindFramebuffer(v.READ_FRAMEBUFFER,YJ.__webglFramebuffer),y.bindFramebuffer(v.DRAW_FRAMEBUFFER,TQ.__webglFramebuffer);for(let I0=0;I0<Rz;I0++){if(E0)v.framebufferTextureLayer(v.READ_FRAMEBUFFER,v.COLOR_ATTACHMENT0,f.get(M).__webglTexture,d,rz+I0),v.framebufferTextureLayer(v.DRAW_FRAMEBUFFER,v.COLOR_ATTACHMENT0,f.get(h).__webglTexture,kz,OJ+I0);v.blitFramebuffer(hz,sz,wz,Xz,xz,DJ,wz,Xz,v.DEPTH_BUFFER_BIT,v.NEAREST)}y.bindFramebuffer(v.READ_FRAMEBUFFER,null),y.bindFramebuffer(v.DRAW_FRAMEBUFFER,null)}else if(d!==0||M.isRenderTargetTexture||f.has(M)){let FJ=f.get(M),fQ=f.get(h);y.bindFramebuffer(v.READ_FRAMEBUFFER,n),y.bindFramebuffer(v.DRAW_FRAMEBUFFER,j);for(let YJ=0;YJ<Rz;YJ++){if(E0)v.framebufferTextureLayer(v.READ_FRAMEBUFFER,v.COLOR_ATTACHMENT0,FJ.__webglTexture,d,rz+YJ);else v.framebufferTexture2D(v.READ_FRAMEBUFFER,v.COLOR_ATTACHMENT0,v.TEXTURE_2D,FJ.__webglTexture,d);if(HJ)v.framebufferTextureLayer(v.DRAW_FRAMEBUFFER,v.COLOR_ATTACHMENT0,fQ.__webglTexture,kz,OJ+YJ);else v.framebufferTexture2D(v.DRAW_FRAMEBUFFER,v.COLOR_ATTACHMENT0,v.TEXTURE_2D,fQ.__webglTexture,kz);if(d!==0)v.blitFramebuffer(hz,sz,wz,Xz,xz,DJ,wz,Xz,v.COLOR_BUFFER_BIT,v.NEAREST);else if(HJ)v.copyTexSubImage3D(yz,kz,xz,DJ,OJ+YJ,hz,sz,wz,Xz);else v.copyTexSubImage2D(yz,kz,xz,DJ,hz,sz,wz,Xz)}y.bindFramebuffer(v.READ_FRAMEBUFFER,null),y.bindFramebuffer(v.DRAW_FRAMEBUFFER,null)}else if(HJ)if(M.isDataTexture||M.isData3DTexture)v.texSubImage3D(yz,kz,xz,DJ,OJ,wz,Xz,Rz,ZJ,TJ,IJ.data);else if(h.isCompressedArrayTexture)v.compressedTexSubImage3D(yz,kz,xz,DJ,OJ,wz,Xz,Rz,ZJ,IJ.data);else v.texSubImage3D(yz,kz,xz,DJ,OJ,wz,Xz,Rz,ZJ,TJ,IJ);else if(M.isDataTexture)v.texSubImage2D(v.TEXTURE_2D,kz,xz,DJ,wz,Xz,ZJ,TJ,IJ.data);else if(M.isCompressedTexture)v.compressedTexSubImage2D(v.TEXTURE_2D,kz,xz,DJ,IJ.width,IJ.height,ZJ,IJ.data);else v.texSubImage2D(v.TEXTURE_2D,kz,xz,DJ,wz,Xz,ZJ,TJ,IJ);if(y.pixelStorei(v.UNPACK_ROW_LENGTH,oJ),y.pixelStorei(v.UNPACK_IMAGE_HEIGHT,QJ),y.pixelStorei(v.UNPACK_SKIP_PIXELS,zQ),y.pixelStorei(v.UNPACK_SKIP_ROWS,HQ),y.pixelStorei(v.UNPACK_SKIP_IMAGES,vQ),kz===0&&h.generateMipmaps)v.generateMipmap(yz);y.unbindTexture()},this.initRenderTarget=function(M){if(f.get(M).__webglFramebuffer===void 0)u.setupRenderTarget(M)},this.initTexture=function(M){if(M.isCubeTexture)u.setTextureCube(M,0);else if(M.isData3DTexture)u.setTexture3D(M,0);else if(M.isDataArrayTexture||M.isCompressedArrayTexture)u.setTexture2DArray(M,0);else u.setTexture2D(M,0);y.unbindTexture()},this.resetState=function(){m=0,l=0,_=null,y.reset(),Hz.reset()},typeof __THREE_DEVTOOLS__<"u")__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}get coordinateSystem(){return 2000}get outputColorSpace(){return this._outputColorSpace}set outputColorSpace(z){this._outputColorSpace=z;let J=this.getContext();J.drawingBufferColorSpace=zJ._getDrawingBufferColorSpace(z),J.unpackColorSpace=zJ._getUnpackColorSpace()}}exports.ACESFilmicToneMapping=4;exports.AddEquation=100;exports.AddOperation=2;exports.AdditiveAnimationBlendMode=2501;exports.AdditiveBlending=2;exports.AgXToneMapping=6;exports.AlphaFormat=1021;exports.AlwaysCompare=519;exports.AlwaysDepth=1;exports.AlwaysStencilFunc=519;exports.AmbientLight=N7;exports.AnimationAction=O7;exports.AnimationClip=o0;exports.AnimationLoader=c9;exports.AnimationMixer=G$;exports.AnimationObjectGroup=B$;exports.AnimationUtils=g9;exports.ArcCurve=p6;exports.ArrayCamera=Y7;exports.ArrowHelper=P$;exports.AttachedBindMode="attached";exports.Audio=k7;exports.AudioAnalyser=W$;exports.AudioContext=M5;exports.AudioListener=$$;exports.AudioLoader=J$;exports.AxesHelper=v$;exports.BackSide=1;exports.BasicDepthPacking=3200;exports.BasicShadowMap=0;exports.BatchedMesh=h6;exports.BezierInterpolant=$7;exports.Bone=m2;exports.BooleanKeyframeTrack=oQ;exports.Box2=L7;exports.Box3=fJ;exports.Box3Helper=C$;exports.BoxGeometry=X0;exports.BoxHelper=w$;exports.BufferAttribute=GJ;exports.BufferGeometry=mz;exports.BufferGeometryLoader=U7;exports.ByteType=1010;exports.Cache=YQ;exports.Camera=d1;exports.CameraHelper=S$;exports.CanvasTexture=v9;exports.CapsuleGeometry=i2;exports.CatmullRomCurve3=g6;exports.CineonToneMapping=3;exports.CircleGeometry=a2;exports.ClampToEdgeWrapping=1001;exports.Clock=V$;exports.Color=Fz;exports.ColorKeyframeTrack=k5;exports.ColorManagement=zJ;exports.Compatibility=GK;exports.CompressedArrayTexture=R9;exports.CompressedCubeTexture=P9;exports.CompressedTexture=v1;exports.CompressedTextureLoader=n9;exports.ConeGeometry=T1;exports.ConstantAlphaFactor=213;exports.ConstantColorFactor=211;exports.Controls=T$;exports.CubeCamera=V7;exports.CubeDepthTexture=b6;exports.CubeReflectionMapping=301;exports.CubeRefractionMapping=302;exports.CubeTexture=i0;exports.CubeTextureLoader=o9;exports.CubeUVReflectionMapping=306;exports.CubicBezierCurve=r2;exports.CubicBezierCurve3=l6;exports.CubicInterpolant=J7;exports.CullFaceBack=1;exports.CullFaceFront=2;exports.CullFaceFrontBack=3;exports.CullFaceNone=0;exports.Curve=$Q;exports.CurvePath=c6;exports.CustomBlending=5;exports.CustomToneMapping=5;exports.CylinderGeometry=f1;exports.Cylindrical=X$;exports.Data3DTexture=C1;exports.DataArrayTexture=w1;exports.DataTexture=tJ;exports.DataTextureLoader=s9;exports.DataUtils=E9;exports.DecrementStencilOp=7683;exports.DecrementWrapStencilOp=34056;exports.DefaultLoadingManager=l9;exports.DepthFormat=1026;exports.DepthStencilFormat=1027;exports.DepthTexture=cQ;exports.DetachedBindMode="detached";exports.DirectionalLight=G7;exports.DirectionalLightHelper=y$;exports.DiscreteInterpolant=Q7;exports.DodecahedronGeometry=t2;exports.DoubleSide=2;exports.DstAlphaFactor=206;exports.DstColorFactor=208;exports.DynamicCopyUsage=35050;exports.DynamicDrawUsage=35048;exports.DynamicReadUsage=35049;exports.EdgesGeometry=d6;exports.EllipseCurve=h1;exports.EqualCompare=514;exports.EqualDepth=4;exports.EqualStencilFunc=514;exports.EquirectangularReflectionMapping=303;exports.EquirectangularRefractionMapping=304;exports.Euler=NQ;exports.EventDispatcher=QQ;exports.ExternalTexture=s2;exports.ExtrudeGeometry=$5;exports.FileLoader=XQ;exports.Float16BufferAttribute=L9;exports.Float32BufferAttribute=Sz;exports.FloatType=1015;exports.Fog=p2;exports.FogExp2=d2;exports.FramebufferTexture=C9;exports.FrontSide=0;exports.Frustum=mQ;exports.FrustumArray=n2;exports.GLBufferAttribute=H$;exports.GLSL1="100";exports.GLSL3="300 es";exports.GreaterCompare=516;exports.GreaterDepth=6;exports.GreaterEqualCompare=518;exports.GreaterEqualDepth=5;exports.GreaterEqualStencilFunc=518;exports.GreaterStencilFunc=516;exports.GridHelper=M$;exports.Group=N0;exports.HTMLTexture=f9;exports.HalfFloatType=1016;exports.HemisphereLight=W7;exports.HemisphereLightHelper=F$;exports.IcosahedronGeometry=K5;exports.ImageBitmapLoader=z$;exports.ImageLoader=s0;exports.ImageUtils=C6;exports.IncrementStencilOp=7682;exports.IncrementWrapStencilOp=34055;exports.InstancedBufferAttribute=U0;exports.InstancedBufferGeometry=H7;exports.InstancedInterleavedBuffer=Z$;exports.InstancedMesh=T6;exports.Int16BufferAttribute=F9;exports.Int32BufferAttribute=M9;exports.Int8BufferAttribute=I9;exports.IntType=1013;exports.InterleavedBuffer=P1;exports.InterleavedBufferAttribute=H0;exports.Interpolant=k0;exports.InterpolateBezier=2303;exports.InterpolateDiscrete=2300;exports.InterpolateLinear=2301;exports.InterpolateSmooth=2302;exports.InterpolationSamplingMode=BK;exports.InterpolationSamplingType=qK;exports.InvertStencilOp=5386;exports.KeepStencilOp=7680;exports.KeyframeTrack=eJ;exports.LOD=v6;exports.LatheGeometry=W5;exports.Layers=R1;exports.LessCompare=513;exports.LessDepth=2;exports.LessEqualCompare=515;exports.LessEqualDepth=3;exports.LessEqualStencilFunc=515;exports.LessStencilFunc=513;exports.Light=PQ;exports.LightProbe=Z7;exports.Line=CQ;exports.Line3=k$;exports.LineBasicMaterial=bJ;exports.LineCurve=e2;exports.LineCurve3=m6;exports.LineDashedMaterial=z7;exports.LineLoop=x6;exports.LineSegments=DQ;exports.LinearFilter=1006;exports.LinearInterpolant=X5;exports.LinearMipMapLinearFilter=1008;exports.LinearMipMapNearestFilter=1007;exports.LinearMipmapLinearFilter=1008;exports.LinearMipmapNearestFilter=1007;exports.LinearSRGBColorSpace="srgb-linear";exports.LinearToneMapping=1;exports.LinearTransfer="linear";exports.Loader=gJ;exports.LoaderUtils=j2;exports.LoadingManager=I5;exports.LoopOnce=2200;exports.LoopPingPong=2202;exports.LoopRepeat=2201;exports.MOUSE=$K;exports.Material=vJ;exports.MaterialBlending=6;exports.MaterialLoader=F5;exports.MathUtils=vK;exports.Matrix2=M7;exports.Matrix3=lz;exports.Matrix4=pz;exports.MaxEquation=104;exports.Mesh=LJ;exports.MeshBasicMaterial=RQ;exports.MeshDepthMaterial=V5;exports.MeshDistanceMaterial=Y5;exports.MeshLambertMaterial=r6;exports.MeshMatcapMaterial=e6;exports.MeshNormalMaterial=t6;exports.MeshPhongMaterial=i6;exports.MeshPhysicalMaterial=s6;exports.MeshStandardMaterial=U5;exports.MeshToonMaterial=a6;exports.MinEquation=103;exports.MirroredRepeatWrapping=1002;exports.MixOperation=1;exports.MultiplyBlending=4;exports.MultiplyOperation=0;exports.NearestFilter=1003;exports.NearestMipMapLinearFilter=1005;exports.NearestMipMapNearestFilter=1004;exports.NearestMipmapLinearFilter=1005;exports.NearestMipmapNearestFilter=1004;exports.NeutralToneMapping=7;exports.NeverCompare=512;exports.NeverDepth=0;exports.NeverStencilFunc=512;exports.NoBlending=0;exports.NoColorSpace="";exports.NoNormalPacking="";exports.NoToneMapping=0;exports.NormalAnimationBlendMode=2500;exports.NormalBlending=1;exports.NormalGAPacking="ga";exports.NormalRGPacking="rg";exports.NotEqualCompare=517;exports.NotEqualDepth=7;exports.NotEqualStencilFunc=517;exports.NumberKeyframeTrack=_1;exports.Object3D=KJ;exports.ObjectLoader=e9;exports.ObjectSpaceNormalMap=1;exports.OctahedronGeometry=x1;exports.OneFactor=201;exports.OneMinusConstantAlphaFactor=214;exports.OneMinusConstantColorFactor=212;exports.OneMinusDstAlphaFactor=207;exports.OneMinusDstColorFactor=209;exports.OneMinusSrcAlphaFactor=205;exports.OneMinusSrcColorFactor=203;exports.OrthographicCamera=r0;exports.PCFShadowMap=1;exports.PCFSoftShadowMap=2;exports.PMREMGenerator=_2;exports.Path=m0;exports.PerspectiveCamera=RJ;exports.Plane=LQ;exports.PlaneGeometry=t0;exports.PlaneHelper=R$;exports.PointLight=B7;exports.PointLightHelper=O$;exports.Points=j6;exports.PointsMaterial=o2;exports.PolarGridHelper=L$;exports.PolyhedronGeometry=nQ;exports.PositionalAudio=K$;exports.PropertyBinding=$J;exports.PropertyMixer=E7;exports.QuadraticBezierCurve=z5;exports.QuadraticBezierCurve3=J5;exports.Quaternion=_J;exports.QuaternionKeyframeTrack=b1;exports.QuaternionLinearInterpolant=K7;exports.R11_EAC_Format=37488;exports.RED_GREEN_RGTC2_Format=36285;exports.RED_RGTC1_Format=36283;exports.REVISION="185";exports.RG11_EAC_Format=37490;exports.RGBADepthPacking=3201;exports.RGBAFormat=1023;exports.RGBAIntegerFormat=1033;exports.RGBA_ASTC_10x10_Format=37819;exports.RGBA_ASTC_10x5_Format=37816;exports.RGBA_ASTC_10x6_Format=37817;exports.RGBA_ASTC_10x8_Format=37818;exports.RGBA_ASTC_12x10_Format=37820;exports.RGBA_ASTC_12x12_Format=37821;exports.RGBA_ASTC_4x4_Format=37808;exports.RGBA_ASTC_5x4_Format=37809;exports.RGBA_ASTC_5x5_Format=37810;exports.RGBA_ASTC_6x5_Format=37811;exports.RGBA_ASTC_6x6_Format=37812;exports.RGBA_ASTC_8x5_Format=37813;exports.RGBA_ASTC_8x6_Format=37814;exports.RGBA_ASTC_8x8_Format=37815;exports.RGBA_BPTC_Format=36492;exports.RGBA_ETC2_EAC_Format=37496;exports.RGBA_PVRTC_2BPPV1_Format=35843;exports.RGBA_PVRTC_4BPPV1_Format=35842;exports.RGBA_S3TC_DXT1_Format=33777;exports.RGBA_S3TC_DXT3_Format=33778;exports.RGBA_S3TC_DXT5_Format=33779;exports.RGBDepthPacking=3202;exports.RGBFormat=1022;exports.RGBIntegerFormat=1032;exports.RGB_BPTC_SIGNED_Format=36494;exports.RGB_BPTC_UNSIGNED_Format=36495;exports.RGB_ETC1_Format=36196;exports.RGB_ETC2_Format=37492;exports.RGB_PVRTC_2BPPV1_Format=35841;exports.RGB_PVRTC_4BPPV1_Format=35840;exports.RGB_S3TC_DXT1_Format=33776;exports.RGDepthPacking=3203;exports.RGFormat=1030;exports.RGIntegerFormat=1031;exports.RawShaderMaterial=H5;exports.Ray=Y0;exports.Raycaster=U$;exports.RectAreaLight=D7;exports.RedFormat=1028;exports.RedIntegerFormat=1029;exports.ReinhardToneMapping=2;exports.RenderTarget=b2;exports.RenderTarget3D=N$;exports.RepeatWrapping=1000;exports.ReplaceStencilOp=7681;exports.ReverseSubtractEquation=102;exports.RingGeometry=q5;exports.SIGNED_R11_EAC_Format=37489;exports.SIGNED_RED_GREEN_RGTC2_Format=36286;exports.SIGNED_RED_RGTC1_Format=36284;exports.SIGNED_RG11_EAC_Format=37491;exports.SRGBColorSpace="srgb";exports.SRGBTransfer="srgb";exports.Scene=R6;exports.ShaderChunk=az;exports.ShaderLib=BQ;exports.ShaderMaterial=rJ;exports.ShadowMaterial=o6;exports.Shape=a0;exports.ShapeGeometry=B5;exports.ShapePath=f$;exports.ShapeUtils=GQ;exports.ShortType=1011;exports.Skeleton=c2;exports.SkeletonHelper=I$;exports.SkinnedMesh=f6;exports.Source=SQ;exports.Sphere=PJ;exports.SphereGeometry=j1;exports.Spherical=Y$;exports.SphericalHarmonics3=O5;exports.SplineCurve=Q5;exports.SpotLight=q7;exports.SpotLightHelper=E$;exports.Sprite=P6;exports.SpriteMaterial=l2;exports.SrcAlphaFactor=204;exports.SrcAlphaSaturateFactor=210;exports.SrcColorFactor=202;exports.StaticCopyUsage=35046;exports.StaticDrawUsage=35044;exports.StaticReadUsage=35045;exports.StereoCamera=Q$;exports.StreamCopyUsage=35042;exports.StreamDrawUsage=35040;exports.StreamReadUsage=35041;exports.StringKeyframeTrack=sQ;exports.SubtractEquation=101;exports.SubtractiveBlending=3;exports.TOUCH=KK;exports.TangentSpaceNormalMap=0;exports.TetrahedronGeometry=G5;exports.Texture=kJ;exports.TextureLoader=i9;exports.TextureUtils=h$;exports.Timer=X7;exports.TimestampQuery=WK;exports.TorusGeometry=N5;exports.TorusKnotGeometry=D5;exports.Triangle=cJ;exports.TriangleFanDrawMode=2;exports.TriangleStripDrawMode=1;exports.TrianglesDrawMode=0;exports.TubeGeometry=Z5;exports.UVMapping=300;exports.Uint16BufferAttribute=u2;exports.Uint32BufferAttribute=g2;exports.Uint8BufferAttribute=A9;exports.Uint8ClampedBufferAttribute=O9;exports.Uniform=F7;exports.UniformsGroup=D$;exports.UniformsLib=Vz;exports.UniformsUtils=d9;exports.UnsignedByteType=1009;exports.UnsignedInt101111Type=35899;exports.UnsignedInt248Type=1020;exports.UnsignedInt5999Type=35902;exports.UnsignedIntType=1014;exports.UnsignedShort4444Type=1017;exports.UnsignedShort5551Type=1018;exports.UnsignedShortType=1012;exports.VSMShadowMap=3;exports.Vector2=a;exports.Vector3=R;exports.Vector4=BJ;exports.VectorKeyframeTrack=E5;exports.VideoFrameTexture=w9;exports.VideoTexture=_6;exports.WebGL3DRenderTarget=X9;exports.WebGLArrayRenderTarget=Y9;exports.WebGLCoordinateSystem=2000;exports.WebGLCubeRenderTarget=y5;exports.WebGLRenderTarget=nJ;exports.WebGLRenderer=a$;exports.WebGLUtils=n$;exports.WebGPUCoordinateSystem=2001;exports.WebXRController=E1;exports.WireframeGeometry=n6;exports.WrapAroundEnding=2402;exports.ZeroCurvatureEnding=2400;exports.ZeroFactor=200;exports.ZeroSlopeEnding=2401;exports.ZeroStencilOp=0;exports.createCanvasElement=U9;exports.error=Pz;exports.getConsoleFunction=HK;exports.log=M1;exports.setConsoleFunction=ZK;exports.warn=Bz;exports.warnOnce=gQ;
