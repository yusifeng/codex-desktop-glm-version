// @ts-nocheck
import { n as e } from "@rchunk/rolldown-runtime";
import { $3 as t, I3 as n } from "@rchunk/app-shared";
import { n as r, t as i } from "@rchunk/preview-layout";
import { n as a, t as o } from "@rchunk/library-file-preview-loading";
import { n as s, t as c } from "@rchunk/multiplayer-document-runtime";
function l(e) {
  let t = (0, u.c)(9),
    { bottomContent: n, documentId: r, onClose: a, onDownloaded: s, onShare: l, title: f } = e,
    p;
  t[0] !== n || t[1] !== a
    ? ((p = (e) => {
        let { actions: t, content: r, isLoading: s, title: c, titleEndContent: l } = e;
        return s
          ? (0, d.jsx)(o, {})
          : (0, d.jsx)(i, {
              assetName: c,
              bottomContent: n,
              endContent: t,
              onClose: a,
              titleEndContent: l,
              children: r,
            });
      }),
      (t[0] = n),
      (t[1] = a),
      (t[2] = p))
    : (p = t[2]);
  let m;
  return (
    t[3] !== r || t[4] !== s || t[5] !== l || t[6] !== p || t[7] !== f
      ? ((m = (0, d.jsx)(c, { documentId: r, onDownloaded: s, onShare: l, title: f, render: p })),
        (t[3] = r),
        (t[4] = s),
        (t[5] = l),
        (t[6] = p),
        (t[7] = f),
        (t[8] = m))
      : (m = t[8]),
    m
  );
}
var u, d;
function f() {
  return (f = e(() => {
    ((u = t()), a(), r(), s(), (d = n()));
  }))();
}
f();
export { l as MultiplayerNote };
