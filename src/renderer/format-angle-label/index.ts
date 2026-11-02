// @ts-nocheck
import { n as e } from "@rchunk/rolldown-runtime";
var t, n;
function r() {
  return (r = e(() => {
    ((t = {
      "\\theta": `θ`,
      "\\Theta": `Θ`,
      "\\alpha": `α`,
      "\\Alpha": `Α`,
      "\\beta": `β`,
      "\\Beta": `Β`,
      "\\phi": `φ`,
      "\\varphi": `φ`,
      "\\gamma": `γ`,
    }),
      (n = (e) =>
        (() => {
          let n = e.match(/^(?<base>\\[A-Za-z]+)(?<suffix>_[\p{L}0-9]+)$/u);
          if (n?.groups?.base && n.groups.suffix) {
            let e = t[n.groups.base];
            if (e) return `${e}${n.groups.suffix}`;
          }
          return t[e] ?? e;
        })()));
  }))();
}
export { r as n, n as t };
