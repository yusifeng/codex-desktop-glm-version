// @ts-nocheck
import { n as e } from "./rolldown-runtime-2d059c5e81f4.js";
import { Pdn as t, Rln as n } from "./app-initial-51da50e6c6e3.js";
function r(e) {
  switch (e) {
    case t.GO:
      return `chatgptgoplan`;
    case t.PLUS:
      return `chatgptplusplan`;
    case t.PROLITE:
      return `chatgptprolite`;
    case t.PRO:
      return `chatgptpro`;
  }
}
function i(e) {
  switch (e) {
    case `chatgptgoplan`:
      return t.GO;
    case `chatgptplusplan`:
      return t.PLUS;
    case `chatgptprolite`:
      return t.PROLITE;
    case `chatgptpro`:
      return t.PRO;
  }
}
function a() {
  return (a = e(() => {
    n();
  }))();
}
export { i as n, a as r, r as t };
