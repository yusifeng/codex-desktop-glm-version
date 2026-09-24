// @ts-nocheck
import { n as e } from "./rolldown-runtime-2d059c5e81f4.js";
import { $3 as t, FX as n, HX as r, I3 as i } from "./app-shared-7b9edc1bfb7f.js";
import { Sun as a, _un as o, mun as s, xun as c } from "./app-initial-51da50e6c6e3.js";
import { n as l } from "./library-cloud-file-preview-b3ddfaa823c0.js";
import { t as u } from "./cloud-file-preview-617eec01bc9e.js";
function d(e) {
  let t = (0, f.c)(11),
    { file: n, identity: i, onClose: a } = e,
    u = r(s),
    d = r(o),
    m = r(c);
  if (u !== i.accountId || d !== i.userId || !m) return null;
  let h;
  t[0] !== n.currentVersion || t[1] !== n.fileId || t[2] !== n.modifiedAt || t[3] !== i
    ? ((h = JSON.stringify([i, n.fileId, n.currentVersion, n.modifiedAt])),
      (t[0] = n.currentVersion),
      (t[1] = n.fileId),
      (t[2] = n.modifiedAt),
      (t[3] = i),
      (t[4] = h))
    : (h = t[4]);
  let g;
  t[5] === n
    ? (g = t[6])
    : ((g = {
        id: n.id,
        kind: `cloud-file`,
        cloudFile: n,
        modifiedAt: n.modifiedAt,
        fileType: n.category,
      }),
      (t[5] = n),
      (t[6] = g));
  let _;
  return (
    t[7] !== a || t[8] !== h || t[9] !== g
      ? ((_ = (0, p.jsx)(l, { item: g, showComposer: !1, onClose: a }, h)),
        (t[7] = a),
        (t[8] = h),
        (t[9] = g),
        (t[10] = _))
      : (_ = t[10]),
    _
  );
}
var f, p;
function m() {
  return (m = e(() => {
    ((f = t()), n(), a(), u(), (p = i()));
  }))();
}
m();
export { d as ConnectedFilePreview };
