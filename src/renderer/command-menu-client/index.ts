// @ts-nocheck
import { EXPECTED_ACCOUNT_ID_HEADER as t } from "../app-shared/runtime/request-protocol";
import { n as e } from "@rchunk/rolldown-runtime";
import {
  wL as n,
} from "@rchunk/app-shared";
import {
  cJt as r,
  rJt as i,
} from "@rchunk/app-initial";
function a(e) {
  return { "ChatGPT-Account-ID": e, [t]: e };
}
function o(e, t) {
  let n = e.name?.trim() || t,
    r = e.email?.trim();
  return r
    ? {
        name: n,
        email: r,
        phone_number: e.phone_number ?? null,
        relationship: e.relationship ?? null,
      }
    : null;
}
function s(e, t) {
  let n = [`trusted-contact`, e, t],
    r = a(t);
  return {
    enabled: {
      queryKey: [...n, `enabled`],
      queryFn: async ({ signal: e }) =>
        (await i.safeGet(`/trusted_contact/enabled`, { additionalHeaders: r, signal: e })).enabled,
      staleTime: 3e4,
      retry: !1,
    },
    list: {
      queryKey: [...n, `list`],
      queryFn: ({ signal: e }) =>
        i.safeGet(`/trusted_contact`, { additionalHeaders: r, signal: e }),
      staleTime: 3e4,
      retry: !1,
    },
  };
}
function c() {
  return (c = e(() => {
    (n(), r());
  }))();
}
export { s as i, o as n, c as r, a as t };
