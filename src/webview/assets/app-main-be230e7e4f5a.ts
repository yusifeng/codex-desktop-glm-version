// @ts-nocheck
import { n as e } from "./rolldown-runtime-2d059c5e81f4.js";
import { I3 as t, N3 as n, e6 as r } from "./app-shared-7b9edc1bfb7f.js";
import { Dt as i, Et as a } from "./app-initial-51da50e6c6e3.js";
var o, s, c, l;
function u() {
  return (u = e(() => {
    if ((r(), (o = n()), a(), t(), (s = document.getElementById(`root`)), !s))
      throw Error(`Root container not found`);
    ((c = window),
      c.__codexRoot ?? (c.__codexRoot = (0, o.createRoot)(s)),
      (l = c.__codexRoot),
      i().then((e) => l.render(e)));
  }))();
}
u();
