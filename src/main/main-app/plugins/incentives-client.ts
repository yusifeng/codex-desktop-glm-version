// @ts-nocheck

/** Owns plugin incentive identity checks, retry policy, receipts, and request cancellation. */
export function createPluginIncentivesClientRuntime(
  dependencies: Record<string, any>,
) {
  const { runtime: n, authHeaders: a } = dependencies;

  const x6e = n.wf({ campaign_ids: n.hf(n.Of().min(1)) }),
    S6e = n.wf({
      campaign_id: n.Of().min(1),
      connector_id: n.Of().min(1),
      plugin_id: n.Of().min(1),
      reward_credits: n.Cf().int().positive(),
      claim_window_seconds: n.Cf().int().positive().optional(),
      remaining_redemptions: n.Cf().int().nonnegative(),
      claim_status: n.df([`pending`, `success_verified`]).nullish(),
      claim_expires_at: n.Lf({ offset: !0 }).nullish(),
      reward_granted_at: n.Lf({ offset: !0 }).nullish(),
      reward_starts_at: n.Lf({ offset: !0 }).nullish(),
      reward_expires_at: n.Lf({ offset: !0 }).nullish(),
    }),
    C6e = n.wf({
      exp: n.Cf().int().positive(),
      "https://api.openai.com/auth": n.wf({
        chatgpt_account_id: n.Of(),
        chatgpt_user_id: n.Of(),
      }),
    }),
    B0 = new Set(),
    PluginIncentivesClient = class extends n.Uf {
      options;
      #e = new AbortController();
      constructor(e) {
        (super(), (this.options = e));
      }
      read(e) {
        return this.#n(e, `GET`);
      }
      acknowledgeReceipt(e) {
        return !B0.has(e) && (B0.add(e), !0);
      }
      enroll(e) {
        return this.#n(e, `POST`);
      }
      async listClaims(e) {
        let t = await this.#r(e, `/incentives/claims`, `GET`, x6e, !1);
        return t.kind === `success`
          ? { kind: `claims`, campaignIds: t.data.campaign_ids }
          : t;
      }
      async checkIdentity(e) {
        try {
          return (await this.#t(e, !1)) == null
            ? `identity-changed`
            : `matched`;
        } catch {
          return `retryable`;
        }
      }
      async #t(e, t) {
        let [n, r] = await Promise.all([
          this.options.localClient.getAuthToken({ refreshToken: t }),
          this.options
            .clientForHost(e.hostId)
            .getAuthToken({ refreshToken: t }),
        ]);
        return V0(n, e.identity) && V0(r, e.identity) ? n : null;
      }
      async #n(e, t) {
        let n = await this.#r(
          e,
          `/incentives/${encodeURIComponent(e.campaignId)}${t === `POST` ? `/enroll` : ``}`,
          t,
          S6e,
          !1,
        );
        return n.kind === `success`
          ? n.data.campaign_id === e.campaignId
            ? { kind: `offer`, offer: n.data }
            : { kind: `retryable` }
          : n;
      }
      async #r(e, t, r, i, o) {
        try {
          let s = await this.#t(e, o);
          if (s == null) return { kind: `identity-changed` };
          let c = { [n.Hs]: `1` };
          a.mt(c, s, { desktopOriginator: this.options.desktopOriginator });
          let l = await this.options.fetch(
            { url: t, method: r, headers: c },
            AbortSignal.any([this.#e.signal, AbortSignal.timeout(1e4)]),
          );
          if ((await this.#t(e, !1)) == null)
            return (
              `response` in l && (await l.response.body?.cancel()),
              { kind: `identity-changed` }
            );
          if (!(`response` in l)) {
            if (l.status === 409) {
              let e = n.wf({ detail: n.Of() }).safeParse(JSON.parse(l.error));
              return {
                kind:
                  e.success && e.data.detail === `capacity_exhausted`
                    ? `capacity-exhausted`
                    : `retryable`,
              };
            }
            switch (l.status) {
              case 404:
                return { kind: `unavailable` };
              case 401:
                return o
                  ? { kind: `identity-changed` }
                  : await this.#r(e, t, r, i, !0);
              default:
                return { kind: `retryable` };
            }
          }
          let u = i.safeParse(await l.response.json());
          return u.success
            ? (await this.#t(e, !1)) == null
              ? { kind: `identity-changed` }
              : { kind: `success`, data: u.data }
            : { kind: `retryable` };
        } catch {
          return { kind: `retryable` };
        }
      }
      [Symbol.dispose]() {
        this.#e.abort();
      }
    };
  function V0(e, t) {
    let n = e?.split(`.`)[1];
    if (n == null) return !1;
    try {
      let e = C6e.parse(
          JSON.parse(Buffer.from(n, `base64url`).toString(`utf8`)),
        ),
        r = e[`https://api.openai.com/auth`];
      return (
        e.exp * 1e3 > Date.now() &&
        r.chatgpt_account_id === t.accountId &&
        r.chatgpt_user_id === t.userId
      );
    } catch {
      return !1;
    }
  }

  return { PluginIncentivesClient };
}

if (typeof module !== "undefined")
  module.exports = { createPluginIncentivesClientRuntime };
