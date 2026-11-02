// @ts-nocheck
import { n as e } from "@rchunk/rolldown-runtime";
import { $O as t, ek as n } from "@rchunk/app-shared";
import { cJt as r, ddn as i, oJt as a, pdn as o } from "@rchunk/app-initial";
function s(e) {
  let n = { "ChatGPT-Account-ID": e };
  return {
    addPassword: {
      queryKey: [`chatgpt-security`, e, `add-password-eligibility`],
      queryFn: ({ signal: e }) =>
        c.safeGet(`/accounts/add_password/eligibility`, { additionalHeaders: n, signal: e }),
      staleTime: t.ONE_MINUTE,
      retry: !1,
    },
    changePassword: {
      queryKey: [`chatgpt-security`, e, `change-password-eligibility`],
      queryFn: ({ signal: e }) =>
        c.safeGet(`/accounts/change_password/eligibility`, { additionalHeaders: n, signal: e }),
      staleTime: t.ONE_MINUTE,
      retry: !1,
    },
    mfa: {
      queryKey: [`chatgpt-security`, e, `mfa`],
      queryFn: ({ signal: e }) =>
        c.safeGet(`/accounts/mfa_info`, { additionalHeaders: n, signal: e }),
      staleTime: t.ONE_MINUTE,
      retry: !1,
    },
    sessions: {
      queryKey: [`chatgpt-security`, e, `sessions`],
      queryFn: ({ signal: e }) =>
        c.safeGet(`/accounts/sessions`, { additionalHeaders: n, signal: e }),
      staleTime: t.ONE_MINUTE,
      retry: !1,
    },
    linkedApps: {
      queryKey: [`chatgpt-security`, e, `linked-apps`],
      queryFn: ({ signal: e }) =>
        c.safeGet(`/client_applications`, { additionalHeaders: n, signal: e }),
      staleTime: t.ONE_MINUTE,
      retry: !1,
    },
    cyber: {
      queryKey: [`chatgpt-security`, e, `cyber`],
      queryFn: ({ signal: e }) =>
        c.safeGet(`/cyber_verification/status`, { additionalHeaders: n, signal: e }),
      staleTime: t.ONE_MINUTE,
      retry: !1,
    },
    protection: {
      queryKey: [`chatgpt-security`, e, `protection`],
      queryFn: ({ signal: e }) =>
        c.safeGet(`/accounts/security_settings/info`, { additionalHeaders: n, signal: e }),
      staleTime: t.ONE_MINUTE,
      refetchOnWindowFocus: `always`,
      retry: !1,
    },
  };
}
var c;
function l() {
  return (l = e(() => {
    (r(), n(), o(), (c = new i({ getAdditionalHeaders: a })));
  }))();
}
export { s as n, c as r, l as t };
