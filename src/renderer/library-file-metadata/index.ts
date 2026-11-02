// @ts-nocheck
import { n as e } from "@rchunk/rolldown-runtime";
import { Sdn as t, cJt as n, rJt as r, wdn as i } from "@rchunk/app-initial";
async function a(e, n, i) {
  let a = {
    parameters: { path: { library_file_id: e } },
    additionalHeaders: { "ChatGPT-Account-ID": n },
    expectedErrorStatuses: [403, 404],
    signal: i,
  };
  i.throwIfAborted();
  try {
    let e = await r.safeGet(`/files/library/files/{library_file_id}`, a);
    return (i.throwIfAborted(), e);
  } catch (e) {
    if (!(e instanceof t) || (e.status !== 403 && e.status !== 404)) throw e;
  }
  i.throwIfAborted();
  try {
    let e = await r.safeGet(`/files/library/files/{library_file_id}/node`, a);
    return (i.throwIfAborted(), e);
  } catch (n) {
    if (!(n instanceof t) || (n.status !== 403 && n.status !== 404)) throw n;
    let o = null,
      s = new Set();
    do {
      i.throwIfAborted();
      let t = await r.safePost(`/files/library`, {
        requestBody: {
          cursor: o,
          limit: 100,
          include_hidden_files: !0,
          include_saved_entities: !0,
        },
        additionalHeaders: a.additionalHeaders,
        expectedErrorStatuses: [403, 404],
        signal: i,
      });
      i.throwIfAborted();
      let n = t.items.find((t) => t.id === e);
      if (n != null) return n;
      if (((o = t.cursor ?? null), o == null || s.has(o))) break;
      s.add(o);
    } while (o != null);
    throw n;
  }
}
function o() {
  return (o = e(() => {
    (n(), i());
  }))();
}
export { o as n, a as t };
