// @ts-nocheck

/** Owns workspace-settings webview attachment, authentication, navigation, and cleanup. */
export function createWorkspaceSettingsWebviewRuntime({
  authenticateChatGptWebview: xW,
  chatGptBaseUrl: bW,
  createLogger,
  electronSession,
  isSafeExternalUrl: MH,
  openLink: IH,
  partitionPrefix: at,
}: Record<string, any>) {
  const l = { session: electronSession };
  var workspaceSettingsLogger = createLogger(`workspace-settings-webview`),
    activeWebviewCountBySession = new Map(),
    sessionTaskBySession = new Map(),
    workspaceSettingsSessions = new WeakSet(),
    presentedPartitionsByOwner = new WeakMap(),
    AUTH_PATH_PREFIX = `/api/auth/`,
    CHECKOUT_PATH_PREFIX = `/checkout/`,
    CREDIT_SUCCESS_PATH = `/payments/success-credit-purchase`,
    ADMIN_PATH = `/admin`,
    RETRY_DELAY_MS = 1e3;
  function isWorkspaceSettingsAttachParams(e) {
    return e.partition?.startsWith(at) === !0;
  }
  function isWorkspaceSettingsWebContents(e) {
    return workspaceSettingsSessions.has(e.session);
  }
  function updateWorkspaceSettingsPresentation(
    e,
    { partition: t, presented: n },
  ) {
    let r = presentedPartitionsByOwner.get(e) ?? new Set();
    if (n) {
      (r.add(t), presentedPartitionsByOwner.set(e, r));
      return;
    }
    (r.delete(t), r.size === 0 && presentedPartitionsByOwner.delete(e));
  }
  function installWorkspaceSettingsWebviewLifecycle({
    getAuthToken: e,
    onReturnToCodex: t,
    owner: n,
  }) {
    let r = [],
      i = (e, t, n) => {
        if (!isWorkspaceSettingsAttachParams(n)) return;
        let i = l.session.fromPartition(n.partition);
        (workspaceSettingsSessions.add(i),
          (t.session = i),
          delete t.preload,
          delete n.disablewebsecurity,
          delete n.webpreferences,
          (n.allowpopups = ``),
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
          r.push({ bootstrapUrl: n.src ?? ``, partition: n.partition }));
      },
      a = (i, a) => {
        if (r.length === 0 || !isWorkspaceSettingsWebContents(a)) return;
        let o = r.shift();
        o != null &&
          manageWorkspaceSettingsWebContents({
            bootstrapUrl: o.bootstrapUrl || a.getURL(),
            getAuthToken: e,
            isPresented: () =>
              presentedPartitionsByOwner.get(n)?.has(o.partition) === !0,
            onReturnToCodex: t,
            webContents: a,
          });
      },
      o = () => {
        (n.removeListener(`will-attach-webview`, i),
          n.removeListener(`did-attach-webview`, a),
          n.removeListener(`destroyed`, o));
      };
    return (
      n.on(`will-attach-webview`, i),
      n.on(`did-attach-webview`, a),
      n.on(`destroyed`, o),
      o
    );
  }
  function manageWorkspaceSettingsWebContents({
    bootstrapUrl: e,
    getAuthToken: t,
    isPresented: n,
    onReturnToCodex: r,
    webContents: i,
  }) {
    let a = i.session;
    adjustActiveWebviewCount(a, 1);
    let o = !1,
      s = !1,
      c = !1,
      l = !1,
      u = !1,
      d = () => {
        !s && n() && ((s = !0), r());
      },
      f = (e) => {
        n() &&
          MH(e) &&
          IH({ request: { openTarget: `external-browser`, url: e } });
      },
      p = () => {
        if (u || i.isDestroyed()) return;
        u = !0;
        let t = parseWorkspaceSettingsBootstrap(e);
        if (t == null) {
          ((u = !1),
            workspaceSettingsLogger().warning(
              `Invalid workspace settings reload target`,
              { safe: {}, sensitive: {} },
            ));
          return;
        }
        setTimeout(() => {
          i.isDestroyed() ||
            i.loadURL(t.url).catch((e) => {
              ((u = !1),
                (s = !1),
                !l &&
                  !i.isDestroyed() &&
                  ((l = !0),
                  setTimeout(() => {
                    p();
                  }, RETRY_DELAY_MS)),
                workspaceSettingsLogger().warning(
                  `Failed to reload workspace settings webview`,
                  {
                    safe: {},
                    sensitive: { error: e },
                  },
                ));
            });
        }, 0);
      },
      m = (e, t) => {
        e.isMainFrame &&
          !isAllowedWorkspaceSettingsNavigation(t) &&
          (e.preventDefault(), f(t));
      },
      h = (e, t) => {
        m(e, e.url ?? t);
      },
      g = (e, t) => {
        m(e, e.url ?? t);
      },
      _ = (e) => {
        if (isWorkspaceAdminUrl(e)) {
          ((s = !1), (c = !1), (l = !1), (u = !1));
          return;
        }
        isAllowedWorkspaceSettingsNavigation(e) || (d(), p());
      },
      v = (e, t) => {
        _(t);
      },
      y = (e, t, n) => {
        n && _(t);
      },
      b = () => {
        _(i.getURL());
      },
      x = () => {
        if (
          o ||
          ((o = !0),
          i.removeListener(`will-navigate`, h),
          i.removeListener(`will-redirect`, g),
          i.removeListener(`did-navigate`, v),
          i.removeListener(`did-navigate-in-page`, y),
          i.removeListener(`did-finish-load`, b),
          i.removeListener(`destroyed`, x),
          adjustActiveWebviewCount(a, -1) !== 0)
        )
          return;
        let e = (sessionTaskBySession.get(a) ?? Promise.resolve()).then(
            async () => {
              activeWebviewCountBySession.has(a) ||
                (await a.clearStorageData({ storages: [`cookies`] }));
            },
          ),
          t = e.catch(() => void 0);
        (sessionTaskBySession.set(a, t),
          e
            .catch((e) => {
              workspaceSettingsLogger().warning(
                `Failed to clear workspace settings auth cookies`,
                {
                  safe: {},
                  sensitive: { error: e },
                },
              );
            })
            .then(() => {
              activeWebviewCountBySession.has(a) ||
                sessionTaskBySession.get(a) !== t ||
                sessionTaskBySession.delete(a);
            }));
      };
    (i.on(`will-navigate`, h),
      i.on(`will-redirect`, g),
      i.on(`did-navigate`, v),
      i.on(`did-navigate-in-page`, y),
      i.on(`did-finish-load`, b),
      i.on(`destroyed`, x),
      i.setWindowOpenHandler(({ url: e }) =>
        isWorkspaceAdminUrl(e)
          ? (i.loadURL(e).catch((e) => {
              workspaceSettingsLogger().warning(
                `Failed to navigate workspace settings webview`,
                {
                  safe: {},
                  sensitive: { error: e },
                },
              );
            }),
            { action: `deny` })
          : (f(e), { action: `deny` }),
      ));
    let S = () => {
      i.isDestroyed() ||
        authenticateWorkspaceSettingsWebview(i, e, t).catch((e) => {
          (!c &&
            !i.isDestroyed() &&
            ((c = !0),
            setTimeout(() => {
              S();
            }, RETRY_DELAY_MS)),
            workspaceSettingsLogger().warning(
              `Failed to load workspace settings auth handoff`,
              {
                safe: {},
                sensitive: { error: e },
              },
            ));
        });
    };
    S();
  }
  function adjustActiveWebviewCount(e, t) {
    let n = Math.max(0, (activeWebviewCountBySession.get(e) ?? 0) + t);
    return (
      n === 0
        ? activeWebviewCountBySession.delete(e)
        : activeWebviewCountBySession.set(e, n),
      n
    );
  }
  async function authenticateWorkspaceSettingsWebview(e, t, n) {
    let r = parseWorkspaceSettingsBootstrap(t);
    if (r == null) throw Error(`Invalid workspace settings bootstrap target`);
    let i = e.session,
      a = (sessionTaskBySession.get(i) ?? Promise.resolve()).then(async () => {
        e.isDestroyed() ||
          (await i.clearStorageData({ storages: [`cookies`] }),
          !e.isDestroyed() &&
            (await xW({
              accountId: r.accountId,
              getAuthToken: n,
              session: i,
              targetUrl: r.url,
              webContents: e,
              workspaceRoutingOverride: r.routingOverride,
            })));
      });
    return (
      sessionTaskBySession.set(
        i,
        a.catch(() => void 0),
      ),
      a
    );
  }
  function parseWorkspaceSettingsBootstrap(e) {
    try {
      let t = new URL(e),
        n = t.searchParams.get(`toUrl`),
        r = t.searchParams.get(`accountId`),
        i = t.searchParams.get(`routingOverride`)?.trim().toLowerCase();
      if (
        t.protocol !== `about:` ||
        t.pathname !== `blank` ||
        n == null ||
        r == null ||
        (i != null && !/^[a-z0-9_-]+$/.test(i))
      )
        return null;
      let a = new URL(n, bW()).toString();
      return isWorkspaceAdminUrl(a)
        ? { accountId: r, routingOverride: i || void 0, url: a }
        : null;
    } catch {
      return null;
    }
  }
  function isAllowedWorkspaceSettingsNavigation(e) {
    try {
      let t = new URL(e);
      return (
        t.protocol === `about:` ||
        (t.origin === bW() &&
          (isWorkspaceAdminUrl(t) ||
            t.pathname.startsWith(AUTH_PATH_PREFIX) ||
            t.pathname.startsWith(CHECKOUT_PATH_PREFIX) ||
            t.pathname === CREDIT_SUCCESS_PATH))
      );
    } catch {
      return !1;
    }
  }
  function isWorkspaceAdminUrl(e) {
    try {
      let t = typeof e == `string` ? new URL(e, bW()) : e;
      return (
        t.origin === bW() &&
        (t.pathname === ADMIN_PATH || t.pathname.startsWith(`${ADMIN_PATH}/`))
      );
    } catch {
      return !1;
    }
  }

  return {
    installWorkspaceSettingsWebviewLifecycle,
    isAllowedWorkspaceSettingsNavigation,
    isWorkspaceAdminUrl,
    isWorkspaceSettingsAttachParams,
    parseWorkspaceSettingsBootstrap,
    updateWorkspaceSettingsPresentation,
  };
}
