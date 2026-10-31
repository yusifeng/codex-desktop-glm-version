// @ts-nocheck

/** Owns checkout webview attachment, auth, navigation, CDP observation, and cleanup. */
export function createCheckoutWebviewRuntime({
  authenticateChatGptWebview: xW,
  chatGptBaseUrl: bW,
  chatGptPurchaseUrl: ie,
  createLogger,
  electronSession,
  openLink: IH,
  readChatGptPlanFromSession: CW,
  shared: n,
}: Record<string, any>) {
  const l = { session: electronSession };
  var checkoutLogger = createLogger(`checkout-webview`),
    activeWebviewCountBySession = new Map(),
    authenticatedAccountBySession = new WeakMap(),
    sessionTaskBySession = new Map(),
    checkoutSessions = new Set(),
    presentedUrlsByOwner = new WeakMap(),
    AUTH_SESSION_PATH = `/api/auth/session`,
    LINK_SESSION_PATH = `/api/auth/link-session`,
    PURCHASE_PATH = `${new URL(ie).pathname}/purchase/`,
    PURCHASE_CREDITS_PATH = `${PURCHASE_PATH}credits`,
    PAY_OPENAI_ORIGIN = `https://pay.openai.com`,
    STRIPE_PAY_PATH = `/c/pay/`,
    CHECKOUT_PATH = `/checkout/`,
    PAYMENTS_SUCCESS_PATH = `/payments/success`,
    PAYMENTS_SUCCESS_INDIVIDUAL_PATH = `/payments/success-ind`,
    CREDIT_SUCCESS_PATH = `/payments/success-credit-purchase`,
    RATE_LIMIT_RESET_SUCCESS_PATH = `/payments/success-rate-limit-reset`,
    USAGE_SETTINGS_PATH = `/codex/cloud/settings/usage`,
    OPEN_APP_PATH = `/codex/open-app`,
    BUSINESS_SUCCESS_PATH = `/payments/success-team`,
    COMPLETE_FRAGMENT = `#complete`,
    PRICING_PATH = `/pricing/`,
    ROOT_PATH = `/`,
    PRICING_FRAGMENT = `#pricing`,
    ABOUT_PROTOCOL = `about:`,
    BLANK_PATH = `blank`,
    SUBSCRIPTION_UPDATE_PATH = `/backend-api/subscriptions/update`,
    STRIPE_API_ORIGIN = `https://api.stripe.com`,
    STRIPE_REDIRECT_ORIGIN = `https://pm-redirects.stripe.com`,
    PAYPAL_ORIGINS = new Set([`https://paypal.com`, `https://www.paypal.com`]),
    SUBSCRIPTION_RETRY_DELAYS_MS = [
      0,
      ...Array.from({ length: 20 }, () => 500),
      15e3,
      3e4,
    ],
    STRIPE_CONFIRM_PATH = /^\/v1\/payment_intents\/[^/]+\/confirm$/,
    responseBodySchema = n.wf({
      base64Encoded: n.gf().optional(),
      body: n.Of(),
    }),
    succeededResponseSchema = n.wf({ status: n.bf(`succeeded`) }),
    authClaimsSchema = n.wf({
      "https://api.openai.com/auth": n.wf({ chatgpt_plan_type: n.Of() }),
    }),
    resetOutcomeSchema = n.df([
      `redeemed`,
      `pending`,
      `payment_failed`,
      `other_error`,
    ]);
  function hardenCheckoutWebPreferences({ params: e, webPreferences: t }) {
    if (!isCheckoutAttachParams(e)) return !1;
    let n = sessionForPartition(e.partition);
    return (
      checkoutSessions.add(n),
      (t.session = n),
      delete t.preload,
      delete e.disablewebsecurity,
      delete e.webpreferences,
      (e.allowpopups = ``),
      (t.sandbox = !0),
      (t.devTools = !0),
      (t.nodeIntegration = !1),
      (t.nodeIntegrationInSubFrames = !1),
      (t.nodeIntegrationInWorker = !1),
      (t.contextIsolation = !0),
      (t.webSecurity = !0),
      (t.allowRunningInsecureContent = !1),
      (t.webviewTag = !1),
      (t.plugins = !1),
      Object.assign(t, { disablePopups: !1 }),
      !0
    );
  }
  function isCheckoutAttachParams(e) {
    return (
      e.partition === `codex-checkout` ||
      e.partition?.startsWith(`codex-credit-`) === !0 ||
      e.partition?.startsWith(`codex-pricing-`) === !0
    );
  }
  function isCheckoutWebContents(e) {
    return (
      e.session === sessionForPartition(`codex-checkout`) ||
      checkoutSessions.has(e.session)
    );
  }
  function updateCheckoutPresentation(e, { partition: t, url: n }) {
    let r = presentedUrlsByOwner.get(e);
    if (n == null) {
      (r?.delete(t), r?.size === 0 && presentedUrlsByOwner.delete(e));
      return;
    }
    try {
      let i = r ?? new Map();
      (i.set(t, new URL(n).toString()), presentedUrlsByOwner.set(e, i));
    } catch {
      r?.delete(t);
    }
  }
  function installCheckoutWebviewLifecycle({
    getAuthToken: e,
    onBusinessCheckoutComplete: t,
    onPersonalCheckoutComplete: n,
    onPurchaseCheckoutComplete: r,
    onReturnToCodex: i,
    owner: a,
  }) {
    let o = [],
      s = (e, t, n) => {
        if (hardenCheckoutWebPreferences({ params: n, webPreferences: t })) {
          let e = n.src ?? ``;
          o.push({
            initialPersonalPlanType: initialPlanFromUrl(e),
            initialTargetUrl: isCheckoutWrapperUrl(e)
              ? targetUrlFromWrapper(e)
              : null,
            isPrewarmed:
              n.partition !== `codex-checkout` || isPrewarmedCheckout(e),
            partition: n.partition,
          });
        }
      },
      c = (s, c) => {
        if (o.length === 0 || !isCheckoutWebContents(c)) return;
        let l = o.shift();
        if (l == null) return;
        let u = c.getURL(),
          d =
            l.initialTargetUrl ??
            (isCheckoutWrapperUrl(u) ? targetUrlFromWrapper(u) : null),
          f = l.isPrewarmed || isPrewarmedCheckout(u);
        manageCheckoutWebContents({
          getAuthToken: e,
          initialPersonalPlanType:
            l.initialPersonalPlanType ?? initialPlanFromUrl(u),
          initialTargetUrl: d,
          isPresented: (e) => !f || isCheckoutPresented(a, l.partition, e),
          onBusinessCheckoutComplete: t,
          onPersonalCheckoutComplete: n,
          onPurchaseCheckoutComplete: r,
          onReturnToCodex: i,
          webContents: c,
        });
      },
      l = () => {
        (a.removeListener(`will-attach-webview`, s),
          a.removeListener(`did-attach-webview`, c),
          a.removeListener(`destroyed`, l));
      };
    return (
      a.on(`will-attach-webview`, s),
      a.on(`did-attach-webview`, c),
      a.on(`destroyed`, l),
      l
    );
  }
  function isCheckoutPresented(e, t, n) {
    return n != null && presentedUrlsByOwner.get(e)?.get(t) === n;
  }
  function manageCheckoutWebContents({
    getAuthToken: e,
    initialPersonalPlanType: t,
    initialTargetUrl: n,
    isPresented: r,
    onBusinessCheckoutComplete: i,
    onPersonalCheckoutComplete: a,
    onPurchaseCheckoutComplete: o,
    onReturnToCodex: s,
    webContents: c,
  }) {
    let l = c.session;
    adjustActiveWebviewCount(l, 1);
    let u = !1,
      d = !1,
      f = isCheckoutWrapperUrl(c.getURL()),
      p = !1,
      m = !1,
      h = !1,
      g = !1,
      _ = !1,
      v = !1,
      y = !1,
      b = !1,
      x = !1,
      S = !1,
      C = null,
      w = null,
      T = null,
      E = t,
      D = n,
      O = null,
      k = null,
      A = null,
      j = () => r(D),
      M = (e) => {
        D == null &&
          isChatGptCheckoutUrl(e) &&
          (D = new URL(e, bW()).toString());
      },
      N = (e) => {
        let t = businessAccountIdFromSuccessUrl(e);
        return t == null ? null : ((O = t), (h = !0), (p = !0), t);
      },
      P = (e) => {
        isBusinessCompleteUrl(e) && (_ = !0);
      },
      F = (e) => {
        let t = personalPlanFromSuccessUrl(e);
        t != null && ((k = t), (p = !0));
      },
      I = (e) => {
        let t = purchaseKindFromSuccessUrl(e);
        t != null && ((A = t), (p = !0));
      },
      L = (e) => {
        k != null &&
          (isCheckoutPathUrl(e) || isPricingUrlString(e)) &&
          ((k = null), (C = null));
      },
      R = async (t) => {
        if (e == null) return null;
        try {
          return planFromAuthToken(await e({ refreshToken: t }));
        } catch {
          return null;
        }
      },
      z = () => {
        if (e == null || w != null) return;
        let t = R(!0);
        ((w = t),
          t.finally(() => {
            w === t && (w = null);
          }));
      },
      B = () => {
        v || O == null || !j() || c.isDestroyed() || ((v = !0), c.stop(), i(O));
      },
      V = (e, t) => {
        if (y || A !== e || !j() || c.isDestroyed()) return;
        ((y = !0), c.stop());
        let n =
          e === `rate-limit-reset` && t != null
            ? rateLimitResetOutcome(t)
            : void 0;
        o(
          e === `rate-limit-reset`
            ? { kind: e, outcome: n ?? `other_error` }
            : { kind: e },
        );
      },
      ee = () => {
        if (b || k == null) return;
        ((b = !0),
          c.isDestroyed() || c.stop(),
          !d && j() && ((d = !0), s()),
          z());
        let e = k;
        Promise.resolve(w).then(() => {
          a(e);
        });
      },
      te = (e) => {
        ((k = e), (p = !0), ee());
      },
      ne = (e, t) => {
        ((k = e),
          (p = !0),
          (async () => {
            for (let t of SUBSCRIPTION_RETRY_DELAYS_MS) {
              t > 0 && (await new Promise((e) => setTimeout(e, t)));
              let n = await CW(l).catch(() => null);
              if (c.isDestroyed() || b || k !== e) return;
              if (n === e) {
                te(e);
                return;
              }
            }
            C === t && (C = null);
          })().catch(() => {
            C === t && (C = null);
          }));
      },
      H = (e) => {
        (E == null || isPlanUpgrade(E, e)) && te(e);
      },
      re = async () => {
        let e = E;
        if (e != null && p)
          for (let t of SUBSCRIPTION_RETRY_DELAYS_MS) {
            if (b) return;
            (t > 0 && (await new Promise((e) => setTimeout(e, t))), z());
            let [n, r] = await Promise.all([R(!1), CW(l).catch(() => null)]);
            if (n != null && isPlanUpgrade(e, n)) {
              te(n);
              return;
            }
            let i = paidPlan(r);
            if (i != null && isPlanUpgrade(e, i)) {
              te(i);
              return;
            }
          }
      },
      U = () => {
        !d && j() && ((d = !0), (T = re()), s());
      },
      ie = observeCheckoutNetwork(c, {
        onCreditPaymentConfirmed: () => {
          if (x || !m || c.isDestroyed()) return;
          let e = customCreditSuccessUrl(c.getURL());
          e != null &&
            ((x = !0),
            c.loadURL(e).catch((e) => {
              ((x = !1),
                checkoutLogger().warning(
                  `Failed to finalize custom credit checkout`,
                  {
                    safe: {},
                    sensitive: { error: e },
                  },
                ));
            }));
        },
        onPersonalSubscriptionUpdateComplete: (e) => {
          if (e != null) {
            H(e);
            return;
          }
          CW(l)
            .then((e) => {
              let t = paidPlan(e);
              t != null && H(t);
            })
            .catch(() => {});
        },
      }),
      ae = (e) => {
        C !== e &&
          !b &&
          k != null &&
          isPersonalSuccessUrlString(e) &&
          ((C = e), ne(k, e));
      },
      oe = (e, t) => {
        if (
          (e.isMainFrame &&
            (N(t), P(t), I(t), F(t), (m ||= isCustomCreditCheckout(t))),
          e.isMainFrame && k != null && isChatGptRootUrl(t))
        ) {
          (e.preventDefault(), ee());
          return;
        }
        if (e.isMainFrame && h && O != null && g && _ && isChatGptRootUrl(t)) {
          (e.preventDefault(), B());
          return;
        }
        if (e.isMainFrame && A != null && isReturnToCodexUrl(t)) {
          (e.preventDefault(), V(A, t));
          return;
        }
        if (e.isMainFrame && A === `rate-limit-reset` && isChatGptRootUrl(t)) {
          (e.preventDefault(), V(`rate-limit-reset`));
          return;
        }
        if (e.isMainFrame && f && isChatGptRootUrl(t)) {
          (e.preventDefault(), U());
          return;
        }
        e.isMainFrame &&
          !isAllowedCheckoutNavigation(
            t,
            p,
            O != null,
            m,
            A != null,
            k != null,
          ) &&
          (e.preventDefault(), U());
      },
      se = (e) => {
        oe(e, e.url);
      },
      ce = (e, t) => {
        oe(e, e.url ?? t);
      },
      le = (e, t) => {
        oe(e, e.url ?? t);
      },
      ue = (t) => {
        !S &&
          isCheckoutWrapperUrl(t) &&
          ((D ??= targetUrlFromWrapper(t)),
          (E ??= initialPlanFromUrl(t)),
          (S = !0),
          authenticateCheckoutWebview(c, t, e).catch((e) => {
            checkoutLogger().warning(
              `Failed to load checkout webview auth handoff`,
              {
                safe: {},
                sensitive: { error: e },
              },
            );
            let n = targetUrlFromWrapper(t);
            n != null && isAdminBillingTarget(n) && U();
          }));
      },
      de = (e, t, n, r) => {
        r && (M(t), N(t), P(t), I(t), F(t), (m ||= isCustomCreditCheckout(t)));
      },
      fe = (e) => {
        if (!isCheckoutWrapperUrl(e)) {
          if (
            (N(e), P(e), I(e), F(e), L(e), O != null && isBusinessSuccessUrl(e))
          ) {
            g = !0;
            return;
          }
          if ((isChatGptCheckoutUrl(e) && (f = !0), isCheckoutPathUrl(e))) {
            p = !0;
            return;
          }
          if (k != null && isChatGptRootUrl(e)) {
            ee();
            return;
          }
          if (A != null && isReturnToCodexUrl(e)) {
            V(A, e);
            return;
          }
          if (A === `rate-limit-reset` && isChatGptRootUrl(e)) {
            V(`rate-limit-reset`);
            return;
          }
          if (h && O != null && g && _ && isChatGptRootUrl(e)) {
            B();
            return;
          }
          if (f && isChatGptRootUrl(e)) {
            U();
            return;
          }
          isAllowedCheckoutNavigation(
            e,
            p,
            O != null,
            m,
            A != null,
            k != null,
          ) || U();
        }
      },
      W = (e, t) => {
        fe(t);
      },
      G = (e, t, n) => {
        n && (fe(t), ae(t));
      },
      pe = () => {
        let e = c.getURL();
        (ue(e), ae(e));
      },
      me = () => {
        u ||
          ((u = !0),
          ie(),
          c.removeListener(`will-frame-navigate`, se),
          c.removeListener(`will-navigate`, ce),
          c.removeListener(`will-redirect`, le),
          c.removeListener(`did-start-navigation`, de),
          c.removeListener(`did-navigate`, W),
          c.removeListener(`did-navigate-in-page`, G),
          c.removeListener(`did-finish-load`, pe),
          c.removeListener(`destroyed`, me),
          adjustActiveWebviewCount(l, -1),
          (async () => {
            (await T,
              await enqueueSessionTask(l, async () => {
                (activeWebviewCountBySession.get(l) ?? 0) === 0 &&
                  (authenticatedAccountBySession.delete(l),
                  await l.clearStorageData({ storages: [`cookies`] }));
              }));
          })().catch((e) => {
            checkoutLogger().warning(
              `Failed to clear checkout webview auth cookies`,
              {
                safe: {},
                sensitive: { error: e },
              },
            );
          }));
      };
    (c.on(`will-frame-navigate`, se),
      c.on(`will-navigate`, ce),
      c.on(`will-redirect`, le),
      c.on(`did-start-navigation`, de),
      c.on(`did-navigate`, W),
      c.on(`did-navigate-in-page`, G),
      c.on(`did-finish-load`, pe),
      c.on(`destroyed`, me),
      ue(c.getURL()),
      c.setWindowOpenHandler(({ url: e }) =>
        e === `about:blank` || allowsCheckoutPopup(c.getURL())
          ? { action: isSafePopupUrl(e) ? `allow` : `deny` }
          : (isSafePopupUrl(e) &&
              IH({ request: { openTarget: `external-browser`, url: e } }),
            { action: `deny` }),
      ));
  }
  function sessionForPartition(e) {
    return l.session.fromPartition(e);
  }
  function enqueueSessionTask(e, t) {
    let n = (sessionTaskBySession.get(e) ?? Promise.resolve()).then(t, t);
    return (
      sessionTaskBySession.set(
        e,
        n.catch(() => void 0),
      ),
      n
    );
  }
  function adjustActiveWebviewCount(e, t) {
    let n = (activeWebviewCountBySession.get(e) ?? 0) + t;
    if (n === 0) {
      activeWebviewCountBySession.delete(e);
      return;
    }
    activeWebviewCountBySession.set(e, n);
  }
  function observeCheckoutNetwork(
    e,
    { onCreditPaymentConfirmed: t, onPersonalSubscriptionUpdateComplete: n },
  ) {
    let r = new Map(),
      i = new Set(),
      a = !1,
      o = !1,
      s = !1,
      c = !1,
      l = !1,
      u = (a, c, u) => {
        if (!isRecord(u)) return;
        let d = stringField(u, `requestId`);
        if (d == null) return;
        if (c === `Network.requestWillBeSent`) {
          let t = u.request;
          if (!isRecord(t)) return;
          let n = stringField(t, `method`),
            a = stringField(t, `url`),
            o = stringField(t, `postData`);
          if (n === `POST` && a != null && isStripePaymentConfirmation(a)) {
            i.add(d);
            return;
          }
          if (n !== `POST` || a == null || !isSubscriptionUpdate(a)) return;
          let s = planFromSubscriptionPostData(o),
            c =
              s == null
                ? e.debugger
                    .sendCommand(`Network.getRequestPostData`, { requestId: d })
                    .then((e) =>
                      isRecord(e)
                        ? planFromSubscriptionPostData(
                            stringField(e, `postData`),
                          )
                        : null,
                    )
                    .catch(() => null)
                : Promise.resolve(s);
          r.set(d, c);
          return;
        }
        if (c === `Network.loadingFailed`) {
          (r.delete(d), i.delete(d));
          return;
        }
        if (c === `Network.loadingFinished`) {
          if (!i.delete(d) || o) return;
          e.debugger
            .sendCommand(`Network.getResponseBody`, { requestId: d })
            .then((e) => {
              let n = responseBodySchema.safeParse(e);
              if (!n.success || o || l) return;
              let r = n.data.base64Encoded
                  ? Buffer.from(n.data.body, `base64`).toString(`utf8`)
                  : n.data.body,
                i;
              try {
                i = JSON.parse(r);
              } catch {
                return;
              }
              succeededResponseSchema.safeParse(i).success && ((o = !0), t());
            })
            .catch(() => {});
          return;
        }
        if (c !== `Network.responseReceived`) return;
        let f = u.response;
        if (!isRecord(f)) return;
        let p = numberField(f, `status`);
        i.has(d) && (p == null || p < 200 || p >= 300) && i.delete(d);
        let m = r.get(d);
        m != null &&
          (r.delete(d),
          !(p == null || p < 200 || p >= 300 || s) &&
            m.then((e) => {
              s || l || ((s = !0), n(e));
            }));
      },
      d = () => {
        l ||
          ((l = !0),
          r.clear(),
          i.clear(),
          c && !e.isDestroyed() && e.debugger.removeListener(`message`, u),
          a &&
            !e.isDestroyed() &&
            e.debugger.isAttached() &&
            e.debugger.detach());
      };
    try {
      (e.debugger.isAttached() || (e.debugger.attach(`1.3`), (a = !0)),
        e.debugger.on(`message`, u),
        (c = !0),
        e.debugger
          .sendCommand(`Network.enable`, { maxPostDataSize: 65536 })
          .catch((e) => {
            l ||
              (checkoutLogger().warning(
                `Failed to enable checkout network observation`,
                {
                  safe: {},
                  sensitive: { error: e },
                },
              ),
              d());
          }));
    } catch (e) {
      (checkoutLogger().warning(`Failed to observe checkout network requests`, {
        safe: {},
        sensitive: { error: e },
      }),
        d());
    }
    return d;
  }
  function isStripePaymentConfirmation(e) {
    try {
      let t = new URL(e);
      return (
        t.origin === STRIPE_API_ORIGIN && STRIPE_CONFIRM_PATH.test(t.pathname)
      );
    } catch {
      return !1;
    }
  }
  function isSubscriptionUpdate(e) {
    try {
      let t = new URL(e);
      return t.origin === bW() && t.pathname === SUBSCRIPTION_UPDATE_PATH;
    } catch {
      return !1;
    }
  }
  function planFromSubscriptionPostData(e) {
    if (e == null) return null;
    try {
      let t = JSON.parse(e);
      if (!isRecord(t)) return null;
      switch (t.updated_plan) {
        case `chatgptgoplan`:
          return `go`;
        case `chatgptplusplan`:
          return `plus`;
        case `chatgptprolite`:
          return `prolite`;
        case `chatgptpro`:
          return `pro`;
        default:
          return null;
      }
    } catch {
      return null;
    }
  }
  function isRecord(e) {
    return typeof e == `object` && !!e;
  }
  function stringField(e, t) {
    let n = e[t];
    return typeof n == `string` ? n : null;
  }
  function numberField(e, t) {
    let n = e[t];
    return typeof n == `number` ? n : null;
  }
  async function authenticateCheckoutWebview(e, t, n) {
    let r = targetUrlFromWrapper(t),
      i = accountIdFromWrapper(t);
    if (r == null) return;
    let a = isCustomCreditCheckout(r),
      o = isPrewarmedCheckout(t) && a,
      s = e.session;
    await enqueueSessionTask(s, async () => {
      if (!e.isDestroyed()) {
        if (
          !o &&
          a &&
          authenticatedAccountBySession.has(s) &&
          authenticatedAccountBySession.get(s) === i
        ) {
          await e.loadURL(r);
          return;
        }
        if (
          (authenticatedAccountBySession.delete(s),
          await s.clearStorageData({ storages: [`cookies`] }),
          !e.isDestroyed())
        ) {
          try {
            (await xW({
              accountId: i,
              getAuthToken: n,
              loadTarget: !o,
              session: s,
              targetUrl: r,
              webContents: e,
            }),
              o && authenticatedAccountBySession.set(s, i));
            return;
          } catch (e) {
            if (
              (checkoutLogger().warning(
                `Failed to authenticate checkout webview`,
                {
                  safe: {},
                  sensitive: { error: e },
                },
              ),
              isAdminBillingTarget(r))
            )
              throw e;
          }
          !o && !e.isDestroyed() && (await e.loadURL(r));
        }
      }
    });
  }
  function isAdminBillingTarget(e) {
    let t = new URL(e).pathname;
    return (
      t === `/admin/billing` || t === `/admin/billing/manage_member_usage_limit`
    );
  }
  function targetUrlFromWrapper(e) {
    let t = new URL(e).searchParams.get(`toUrl`);
    return t == null || !isChatGptCheckoutUrl(t)
      ? null
      : new URL(t, bW()).toString();
  }
  function accountIdFromWrapper(e) {
    let t = new URL(e).searchParams.get(`accountId`);
    return t != null && t.length > 0 ? t : null;
  }
  function isPrewarmedCheckout(e) {
    try {
      return new URL(e).searchParams.get(`prewarm`) === `true`;
    } catch {
      return !1;
    }
  }
  function initialPlanFromUrl(e) {
    try {
      let t = new URL(e).searchParams.get(`currentPlan`);
      switch (t) {
        case `free`:
        case `go`:
        case `plus`:
        case `prolite`:
        case `pro`:
          return t;
        default:
          return null;
      }
    } catch {
      return null;
    }
  }
  function isPlanUpgrade(e, t) {
    return planRank(t) > planRank(e);
  }
  function paidPlan(e) {
    switch (e) {
      case `go`:
      case `plus`:
      case `prolite`:
      case `pro`:
        return e;
      default:
        return null;
    }
  }
  function planFromAuthToken(e) {
    let t = e?.split(`.`)[1];
    if (t == null) return null;
    try {
      let e = authClaimsSchema.safeParse(
        JSON.parse(Buffer.from(t, `base64url`).toString(`utf8`)),
      );
      return e.success
        ? paidPlan(e.data[`https://api.openai.com/auth`].chatgpt_plan_type)
        : null;
    } catch {
      return null;
    }
  }
  function planRank(e) {
    switch (e) {
      case `free`:
        return 0;
      case `go`:
        return 1;
      case `plus`:
        return 2;
      case `prolite`:
        return 3;
      case `pro`:
        return 4;
    }
  }
  function isCheckoutWrapperUrl(e) {
    try {
      let t = new URL(e),
        n = t.searchParams.get(`toUrl`);
      return (
        t.protocol === ABOUT_PROTOCOL &&
        t.pathname === BLANK_PATH &&
        isChatGptCheckoutUrl(n)
      );
    } catch {
      return !1;
    }
  }
  function isAllowedCheckoutNavigation(e, t, n, r, i, a) {
    if (e === `about:blank` || isCheckoutWrapperUrl(e)) return !t;
    try {
      let o = new URL(e);
      return (r && isStripePaymentUrl(o)) ||
        (t &&
          (o.origin === STRIPE_REDIRECT_ORIGIN || PAYPAL_ORIGINS.has(o.origin)))
        ? !0
        : o.origin === bW()
          ? isChatGptCheckoutUrl(e) ||
            (!t && isAuthApiPath(o)) ||
            (i && isPurchaseSuccessUrl(o)) ||
            (a && isPersonalSuccessUrl(o)) ||
            (n && o.pathname === BUSINESS_SUCCESS_PATH)
          : !1;
    } catch {
      return !1;
    }
  }
  function isCustomCreditCheckout(e) {
    try {
      let t = new URL(e);
      return (
        t.origin === bW() &&
        (t.pathname === PURCHASE_CREDITS_PATH ||
          t.pathname === `/admin/billing` ||
          (isCheckoutPathUrl(e) &&
            t.searchParams.get(`source`) === `codex-embedded-checkout`))
      );
    } catch {
      return !1;
    }
  }
  function customCreditSuccessUrl(e) {
    try {
      let t = new URL(e);
      if (t.origin !== bW()) return null;
      let n = /^\/checkout\/([^/]+)\/([^/]+)\/?$/.exec(t.pathname);
      if (n == null) return null;
      let [, r, i] = n;
      if (r == null || i == null) return null;
      let a = new URL(CREDIT_SUCCESS_PATH, bW());
      return (
        a.searchParams.set(`stripe_session_id`, i),
        a.searchParams.set(`processor_entity`, r),
        a.toString()
      );
    } catch {
      return null;
    }
  }
  function isStripePaymentUrl(e) {
    return (
      e.origin === PAY_OPENAI_ORIGIN && e.pathname.startsWith(STRIPE_PAY_PATH)
    );
  }
  function isAuthApiPath(e) {
    return e.pathname === AUTH_SESSION_PATH || e.pathname === LINK_SESSION_PATH;
  }
  function personalPlanFromSuccessUrl(e) {
    try {
      let t = new URL(e);
      if (!isPersonalSuccessUrl(t)) return null;
      let n = t.searchParams.get(`plan_type`);
      switch (n) {
        case `go`:
        case `plus`:
        case `prolite`:
        case `pro`:
          return n;
        default:
          return null;
      }
    } catch {
      return null;
    }
  }
  function isPersonalSuccessUrl(e) {
    return (
      e.origin === bW() &&
      (e.pathname === PAYMENTS_SUCCESS_PATH ||
        e.pathname === PAYMENTS_SUCCESS_INDIVIDUAL_PATH)
    );
  }
  function isPersonalSuccessUrlString(e) {
    try {
      return isPersonalSuccessUrl(new URL(e));
    } catch {
      return !1;
    }
  }
  function purchaseKindFromSuccessUrl(e) {
    try {
      let t = new URL(e);
      if (t.origin !== bW()) return null;
      switch (t.pathname) {
        case CREDIT_SUCCESS_PATH:
          return `credit`;
        case RATE_LIMIT_RESET_SUCCESS_PATH:
          return `rate-limit-reset`;
        default:
          return null;
      }
    } catch {
      return null;
    }
  }
  function isPurchaseSuccessUrl(e) {
    return (
      e.origin === bW() &&
      (e.pathname === CREDIT_SUCCESS_PATH ||
        e.pathname === RATE_LIMIT_RESET_SUCCESS_PATH)
    );
  }
  function isReturnToCodexUrl(e) {
    try {
      let t = new URL(e);
      return (
        t.origin === bW() &&
        (t.pathname === USAGE_SETTINGS_PATH ||
          t.pathname === `/admin/billing` ||
          (t.pathname === OPEN_APP_PATH &&
            t.searchParams.get(`target`) === `launch`))
      );
    } catch {
      return !1;
    }
  }
  function rateLimitResetOutcome(e) {
    let t = resetOutcomeSchema.safeParse(
      new URL(e).searchParams.get(`reset_outcome`),
    );
    return t.success ? t.data : void 0;
  }
  function isPricingUrlString(e) {
    try {
      let t = new URL(e);
      return t.origin === bW() && isPricingUrl(t);
    } catch {
      return !1;
    }
  }
  function isChatGptCheckoutUrl(e) {
    if (e == null) return !1;
    try {
      let t = new URL(e, bW());
      return (
        t.origin === bW() &&
        (t.pathname.startsWith(PURCHASE_PATH) ||
          t.pathname.startsWith(CHECKOUT_PATH) ||
          t.pathname === `/admin/billing` ||
          t.pathname === `/admin/billing/manage_member_usage_limit` ||
          isPricingUrl(t))
      );
    } catch {
      return !1;
    }
  }
  function isPricingUrl(e) {
    return (
      e.pathname === PRICING_PATH ||
      (e.pathname === ROOT_PATH && e.hash === PRICING_FRAGMENT)
    );
  }
  function businessAccountIdFromSuccessUrl(e) {
    try {
      let t = new URL(e);
      if (!isBusinessSuccessUrl(t)) return null;
      let n = t.searchParams.get(`account_id`);
      return n != null && n.length > 0 ? n : null;
    } catch {
      return null;
    }
  }
  function isBusinessSuccessUrl(e) {
    try {
      let t = typeof e == `string` ? new URL(e) : e;
      return t.origin === bW() && t.pathname === BUSINESS_SUCCESS_PATH;
    } catch {
      return !1;
    }
  }
  function isBusinessCompleteUrl(e) {
    return isBusinessUrlWithHash(e, COMPLETE_FRAGMENT);
  }
  function isBusinessUrlWithHash(e, t) {
    try {
      let n = new URL(e);
      return isBusinessSuccessUrl(n) && n.hash === t;
    } catch {
      return !1;
    }
  }
  function isChatGptRootUrl(e) {
    try {
      let t = new URL(e);
      return t.origin === bW() && t.pathname === `/` && !isPricingUrl(t);
    } catch {
      return !1;
    }
  }
  function isCheckoutPathUrl(e) {
    try {
      let t = new URL(e);
      return t.origin === bW() && t.pathname.startsWith(CHECKOUT_PATH);
    } catch {
      return !1;
    }
  }
  function allowsCheckoutPopup(e) {
    if (isCheckoutPathUrl(e)) return !0;
    try {
      return isStripePaymentUrl(new URL(e));
    } catch {
      return !1;
    }
  }
  function isSafePopupUrl(e) {
    if (e === `about:blank`) return !0;
    try {
      return new URL(e).protocol === `https:`;
    } catch {
      return !1;
    }
  }

  return {
    hardenCheckoutWebPreferences,
    installCheckoutWebviewLifecycle,
    isAllowedCheckoutNavigation,
    isCheckoutAttachParams,
    observeCheckoutNetwork,
    updateCheckoutPresentation,
  };
}
