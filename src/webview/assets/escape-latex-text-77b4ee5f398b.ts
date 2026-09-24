// @ts-nocheck
import { n as e } from "./rolldown-runtime-2d059c5e81f4.js";
var t, n, r, i;
function a() {
  return (a = e(() => {
    ((t = /[\\{}$&#_%^~]/g),
      (n = {
        "\\": `\\textbackslash{}`,
        "{": `\\{`,
        "}": `\\}`,
        $: `\\$`,
        "&": `\\&`,
        "#": `\\#`,
        _: `\\_`,
        "%": `\\%`,
        "^": `\\textasciicircum{}`,
        "~": `\\textasciitilde{}`,
      }),
      (r = (e) => e.replace(t, (e) => n[e] ?? e)),
      (i = (e) => `\\text{${r(e)}}`));
  }))();
}
export { a as n, i as t };
