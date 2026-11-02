// @ts-nocheck
const __vite__mapDeps = (
  i,
  m = __vite__mapDeps,
  d = m.f ||
    (m.f = [
      "@rchunk/xterm-output-panel",
      "@rchunk/rolldown-runtime",
      "@rchunk/app-shared",
      "./app-shared-fa570b9eb9dd.css",
      "@rchunk/app-initial",
      "./app-initial-e8ceb32eb626.css",
      "@rchunk/theme-font-family",
      "@rchunk/theme-font-face-loader",
      "@rchunk/xterm-window-zoom",
      "./xterm-window-zoom-241c9f83d2ce.css",
      "@rchunk/terminal-panel-bootstrap",
      "./terminal-panel-e74d48fceaac.css",
    ]),
) => i.map((i) => d[i]);
import { n as e } from "@rchunk/rolldown-runtime";
import {
  $3 as t,
  BX as n,
  FX as r,
  H3 as i,
  I3 as a,
  Jm as o,
  K2 as s,
  V3 as c,
  Y2 as l,
  e6 as u,
  qm as d,
} from "@rchunk/app-shared";
import { HZt as f, Lgn as p, Rgn as m, n$t as h } from "@rchunk/app-initial";
function g(e) {
  let t = (0, b.c)(10),
    { conversationId: r, renderSlots: i, setTabState: a, terminalId: o } = e,
    s = n(h, r),
    c;
  t[0] !== o || t[1] !== s ? ((c = y(s, o)), (t[0] = o), (t[1] = s), (t[2] = c)) : (c = t[2]);
  let u = c,
    d = _(o),
    f = u?.aggregatedOutput ?? d?.buffer ?? ``,
    p;
  if (t[3] !== f || t[4] !== i || t[5] !== a) {
    let e;
    (t[7] !== f || t[8] !== a
      ? ((e = (0, S.jsx)(`div`, {
          className: `h-full min-h-0 bg-surface`,
          children:
            f.length > 0
              ? (0, S.jsx)(C, { output: f, onRenderedOutputReady: (e) => a({ readOutput: e }) })
              : (0, S.jsx)(`div`, {
                  className: `p-4 font-code text-size-code-sm text-codex-description`,
                  children: (0, S.jsx)(l, {
                    id: `codex.localConversation.backgroundTerminalTab.noOutput`,
                    defaultMessage: `No output yet`,
                    description: `Placeholder shown in a background terminal output tab before any terminal output is available`,
                  }),
                }),
        })),
        (t[7] = f),
        (t[8] = a),
        (t[9] = e))
      : (e = t[9]),
      (p = i({ headerRows: [], content: e })),
      (t[3] = f),
      (t[4] = i),
      (t[5] = a),
      (t[6] = p));
  } else p = t[6];
  return p;
}
function _(e) {
  let t = (0, b.c)(4),
    n;
  t[0] === e
    ? (n = t[1])
    : ((n = (t) => m.subscribeToSessionSnapshot(e, t)), (t[0] = e), (t[1] = n));
  let r;
  return (
    t[2] === e ? (r = t[3]) : ((r = () => m.getSnapshot(e)), (t[2] = e), (t[3] = r)),
    (0, x.useSyncExternalStore)(n, r, v)
  );
}
function v() {
  return null;
}
function y(e, t) {
  if (e == null) return null;
  for (let n = e.length - 1; n >= 0; --n) {
    let r = e[n];
    if (r != null) {
      for (let e of r.items) if (e.type === `commandExecution` && e.id === t) return e;
    }
  }
  return null;
}
var b, x, S, C;
function w() {
  return (w = e(() => {
    ((b = t()),
      r(),
      (x = u()),
      s(),
      f(),
      d(),
      p(),
      (S = a()),
      i(),
      (C = o(
        async () => {
          let { XtermOutputPanel: e } = await c(
            async () => {
              let { XtermOutputPanel: e } = await import(`@rchunk/xterm-output-panel`);
              return { XtermOutputPanel: e };
            },
            __vite__mapDeps([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]),
            import.meta.url,
          );
          return e;
        },
        { propagateLoadError: !0 },
      )));
  }))();
}
w();
export { g as LocalConversationBackgroundTerminalTab };
