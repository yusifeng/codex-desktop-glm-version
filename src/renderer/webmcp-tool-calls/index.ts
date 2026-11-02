// @ts-nocheck
import { n as e } from "@rchunk/rolldown-runtime";
import {
  E4 as t,
  H4 as n,
  M4 as r,
  R4 as i,
  g4 as a,
  k4 as o,
  q4 as s,
} from "@rchunk/app-shared";
function c(e) {
  let t = u.safeParse(e);
  return t.success ? t.data[`codex/toolSurface`].webMcpCalls : [];
}
var l, u;
function d() {
  return (d = e(() => {
    (a(),
      (l = r(`kind`, [
        n({
          kind: i(`listTools`),
          name: i(`webmcp_list_tools`),
          title: s().min(1).optional(),
          description: s().optional(),
          readOnlyHint: o().optional(),
          sourceHostname: s().min(1).optional(),
          outputJson: s().optional(),
          outputTruncated: i(!0).optional(),
        }),
        n({
          kind: i(`invokeTool`),
          name: s().refine((e) => e.trim().length > 0),
          title: s().min(1).optional(),
          description: s().optional(),
          readOnlyHint: o().optional(),
          sourceHostname: s().min(1).optional(),
          inputJson: s().optional(),
          inputTruncated: i(!0).optional(),
          outputJson: s().optional(),
          outputTruncated: i(!0).optional(),
        }),
      ])),
      (u = n({ "codex/toolSurface": n({ kind: i(`browserUse`), webMcpCalls: t(l) }) })));
  }))();
}
export { d as n, c as t };
