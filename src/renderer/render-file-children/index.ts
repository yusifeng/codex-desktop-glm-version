// @ts-nocheck
import { n as e } from "@rchunk/rolldown-runtime";
import { I3 as t } from "@rchunk/app-shared";
import { KSn as n, SSn as r, xbn as i } from "@rchunk/app-initial";
import { d as a, l as o } from "@rchunk/codex-diff-css";
function s({
  file: e,
  renderCustomHeader: t,
  renderHeaderPrefix: n,
  renderHeaderFilenameSuffix: a,
  renderHeaderMetadata: s,
  renderAnnotation: l,
  lineAnnotations: u,
  renderGutterUtility: d,
  getHoveredLine: f,
  getAnnotationSlotName: p = i,
}) {
  let m = t?.(e),
    h = n?.(e),
    g = a?.(e),
    _ = s?.(e);
  return (0, c.jsxs)(c.Fragment, {
    children: [
      m == null
        ? (0, c.jsxs)(c.Fragment, {
            children: [
              h != null && (0, c.jsx)(`div`, { slot: `header-prefix`, children: h }),
              g != null && (0, c.jsx)(`div`, { slot: `header-filename-suffix`, children: g }),
              _ != null && (0, c.jsx)(`div`, { slot: `header-metadata`, children: _ }),
            ],
          })
        : (0, c.jsx)(`div`, { slot: r, children: m }),
      l != null && u?.map((e, t) => (0, c.jsx)(`div`, { slot: p(e), children: l(e) }, t)),
      d != null && (0, c.jsx)(`div`, { slot: `gutter-utility-slot`, style: o, children: d(f) }),
    ],
  });
}
var c;
function l() {
  return (l = e(() => {
    (n(), a(), (c = t()));
  }))();
}
export { s as n, l as t };
