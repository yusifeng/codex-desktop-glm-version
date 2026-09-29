// Shared math compatibility layer. Release chunk: math-d32c9f1b6861.js.
const absolute = Math.abs;
const atan2 = Math.atan2;
const cosine = Math.cos;
const maximum = Math.max;
const minimum = Math.min;
const sine = Math.sin;
const squareRoot = Math.sqrt;
const epsilon = 1e-12;
const pi = Math.PI;
const halfPi = pi / 2;
const twoPi = 2 * pi;
function safeAcos(value: number): number {
  return value > 1 ? 0 : value < -1 ? Math.PI : Math.acos(value);
}
function safeAsin(value: number): number {
  return value >= 1 ? halfPi : value <= -1 ? -halfPi : Math.asin(value);
}
export {
  cosine as a,
  maximum as c,
  sine as d,
  squareRoot as f,
  atan2 as i,
  minimum as l,
  safeAcos as n,
  epsilon as o,
  twoPi as p,
  safeAsin as r,
  halfPi as s,
  absolute as t,
  pi as u,
};
