// Lazy-initialized shared math compatibility layer. Release chunk: math-de3a0e0db4e2.js.
import "@rchunk/rolldown-runtime";

let absolute: typeof Math.abs;
let atan2: typeof Math.atan2;
let cosine: typeof Math.cos;
let maximum: typeof Math.max;
let minimum: typeof Math.min;
let sine: typeof Math.sin;
let squareRoot: typeof Math.sqrt;
let epsilon: number;
let pi: number;
let halfPi: number;
let twoPi: number;

function safeAcos(value: number): number {
  return value > 1 ? 0 : value < -1 ? pi : Math.acos(value);
}

function safeAsin(value: number): number {
  return value >= 1 ? halfPi : value <= -1 ? -halfPi : Math.asin(value);
}

function initializeMathLazyRuntime(): void {
  absolute = Math.abs;
  atan2 = Math.atan2;
  cosine = Math.cos;
  maximum = Math.max;
  minimum = Math.min;
  sine = Math.sin;
  squareRoot = Math.sqrt;
  epsilon = 1e-12;
  pi = Math.PI;
  halfPi = pi / 2;
  twoPi = 2 * pi;
}

export {
  cosine as a,
  initializeMathLazyRuntime as c,
  pi as d,
  sine as f,
  atan2 as i,
  maximum as l,
  twoPi as m,
  safeAcos as n,
  epsilon as o,
  squareRoot as p,
  safeAsin as r,
  halfPi as s,
  absolute as t,
  minimum as u,
};
