// @ts-nocheck
import { n as e } from "@rchunk/rolldown-runtime";
import { Pdn as t, Rln as n } from "@rchunk/app-initial";
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
