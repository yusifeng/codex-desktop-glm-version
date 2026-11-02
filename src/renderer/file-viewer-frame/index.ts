// @ts-nocheck
import { n as e } from "@rchunk/rolldown-runtime";
import { $3 as t, I3 as n } from "@rchunk/app-shared";
import { $dt as r, tft as i } from "@rchunk/app-initial";
import { n as a, t as o } from "@rchunk/view-frame";
function s(e) {
  let t = (0, c.c)(11),
    { recipient: n, className: i, filePath: a, fileViewer: s, mcpAppId: u, lifetime: d } = e,
    f = `codex-resource://${u}`,
    p;
  t[0] !== a || t[1] !== s || t[2] !== f
    ? ((p = r({ fileViewer: s, hostId: s.hostId, path: a, resourceUri: f })),
      (t[0] = a),
      (t[1] = s),
      (t[2] = f),
      (t[3] = p))
    : (p = t[3]);
  let m = p,
    h;
  return (
    t[4] !== i || t[5] !== s || t[6] !== m || t[7] !== d || t[8] !== u || t[9] !== n
      ? ((h = (0, l.jsx)(
          o,
          { recipient: n, lifetime: d, className: i, ...m, mcpAppId: u, view: s },
          u,
        )),
        (t[4] = i),
        (t[5] = s),
        (t[6] = m),
        (t[7] = d),
        (t[8] = u),
        (t[9] = n),
        (t[10] = h))
      : (h = t[10]),
    h
  );
}
var c, l;
function u() {
  return (u = e(() => {
    ((c = t()), i(), a(), (l = n()));
  }))();
}
export { u as n, s as t };
