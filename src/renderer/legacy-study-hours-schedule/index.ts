// @ts-nocheck
import { n as e } from "@rchunk/rolldown-runtime";
import { Mqt as t, Nqt as n, jqt as r } from "@rchunk/app-initial";
function i() {
  return {
    enabled: !0,
    blocks: [{ id: `study-hours-always-on`, days: [...r], start_time: `00:00`, end_time: `23:59` }],
  };
}
function a(e, t) {
  switch (t.type) {
    case `set_enabled`:
      return n(e, t);
    case `add_block`:
      return n({ ...e, enabled: !0 }, t);
    case `update_block`:
      return {
        ...e,
        enabled: !0,
        blocks: [
          { ...n(i(), t).blocks[0], id: `web-study-hours-${globalThis.crypto.randomUUID()}` },
          ...e.blocks,
        ],
      };
    case `remove_block`:
      return e;
  }
}
function o() {
  return (o = e(() => {
    t();
  }))();
}
export { i as n, o as r, a as t };
