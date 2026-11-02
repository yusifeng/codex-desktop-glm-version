// @ts-nocheck
import { createCommandQueryKey as r } from "../app-initial/runtime/create-command-query-key";
import { n as e } from "@rchunk/rolldown-runtime";
import {
  iW as t,
  wL as n,
} from "@rchunk/app-shared";
import {
  Qln as i,
  aun as a,
  nun as o,
  oun as s,
  q3t as c,
  s6t as l,
} from "@rchunk/app-initial";
import { a as u, n as d } from "@rchunk/new-chat-page-suggestions-eligibility";
async function f({ hostId: e, queryClient: n, refreshAppsList: a }) {
  let o = n.getQueriesData({ queryKey: [`apps`, `list`, e] }),
    l = o.some(([, e]) => e != null) ? o.flatMap(([, e]) => e ?? []) : void 0,
    [u] = await Promise.all([a(), s(n, c)]);
  return p({ previousApps: l, nextApps: u })
    ? (await s(n, d(e)),
      await Promise.all(
        h.map((n) =>
          i(`ambient-suggestions-refresh`, {
            params: { domain: n, hostId: e, projectRoot: t(`~`), mode: `first-plugin-connect` },
          }),
        ),
      ),
      await Promise.all([
        n.invalidateQueries({ queryKey: r(`ambient-suggestions`) }),
        n.invalidateQueries({ queryKey: r(`ambient-suggestions-refresh`) }),
      ]),
      u)
    : u;
}
function p({ previousApps: e, nextApps: t }) {
  return e != null && !e.some(m) && t.some(m);
}
function m(e) {
  return e.isAccessible && e.isEnabled;
}
var h;
function g() {
  return (g = e(() => {
    (n(), u(), a(), o(), l(), (h = [null, `science`]));
  }))();
}
export { f as n, g as t };
