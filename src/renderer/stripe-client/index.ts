// @ts-nocheck
import { queryOptions as t } from "../app-shared/runtime/query-options";
import { n as e } from "@rchunk/rolldown-runtime";

import {
  pdn as n,
  udn as r,
} from "@rchunk/app-initial";
import { r as i, t as a } from "@rchunk/stripe-pure";
function o(e) {
  let t = getComputedStyle(document.body);
  return {
    theme: e ? `night` : `stripe`,
    labels: `floating`,
    variables: {
      colorPrimary: t.getPropertyValue(`--color-text`).trim() || void 0,
      colorText: t.color || void 0,
      colorTextPlaceholder: t.getPropertyValue(`--color-text-tertiary`).trim() || void 0,
      colorBackground: t.getPropertyValue(`--color-background-primary-soft`).trim() || void 0,
      colorDanger: t.getPropertyValue(`--color-text-danger`).trim() || void 0,
      fontFamily: t.fontFamily || void 0,
      fontSizeBase: t.getPropertyValue(`--text-sm`).trim() || void 0,
      borderRadius: t.getPropertyValue(`--radius-md`).trim() || void 0,
      spacingUnit: t.getPropertyValue(`--spacing`).trim() || void 0,
    },
  };
}
function s(e) {
  return t({
    queryKey: [`consumer-billing-setup`, e, `stripe-client`],
    queryFn: async ({ signal: t }) => {
      let n = await r.safeGet(`/payments/stripe_client_bootstrap`, {
          parameters: { query: { account_id: e } },
          signal: t,
        }),
        a = await i(n.publishable_key);
      if (a == null) throw Error(`Could not load payment form`);
      return { stripe: a, currency: n.currency };
    },
    staleTime: 1 / 0,
    retry: !1,
  });
}
function c() {
  return (c = e(() => {
    (a(), n());
  }))();
}
export { c as n, s as r, o as t };
