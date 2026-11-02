// @ts-nocheck
import { n as e } from "@rchunk/rolldown-runtime";
import { I3 as t, N3 as n, e6 as r } from "@rchunk/app-shared";
import { Dt as i, Et as a } from "@rchunk/app-initial";
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
