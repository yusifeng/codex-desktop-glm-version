// @ts-nocheck
import { n as e } from "@rchunk/rolldown-runtime";
import { H4 as t, g4 as n, q4 as r } from "@rchunk/app-shared";
import { Cpn as i, bpn as a } from "@rchunk/app-initial";
function o(e, t) {
  e.get(i).logEventWithStatsig?.(t.name, t.metadata);
}
function s(e, t) {
  let n = {};
  try {
    let e = l.safeParse(JSON.parse(t.message));
    if (e.success) {
      let { error_type: t, reason: r } = e.data.detail;
      n = { ...(t == null ? {} : { error_type: t }), ...(r == null ? {} : { reason: r }) };
    }
  } catch {}
  o(e, { name: `chatgpt_plan_management_modal_handle_update_error`, metadata: n });
}
var c, l;
function u() {
  return (u = e(() => {
    (n(),
      a(),
      (c = r().regex(/^[a-z][a-z0-9_]{0,127}$/)),
      (l = t({
        detail: t({ error_type: c.optional().catch(void 0), reason: c.optional().catch(void 0) }),
      })));
  }))();
}
export { s as n, o as r, u as t };
