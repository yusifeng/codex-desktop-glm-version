// @ts-nocheck
const __vite__mapDeps = (
  i,
  m = __vite__mapDeps,
  d = m.f ||
    (m.f = [
      "@rchunk/browser-site-actions-state",
      "@rchunk/rolldown-runtime",
      "@rchunk/app-shared",
      "./app-shared-fa570b9eb9dd.css",
      "@rchunk/app-initial",
      "./app-initial-e8ceb32eb626.css",
      "@rchunk/appgen-access",
      "@rchunk/appgen-browser-site-core",
      "@rchunk/app-primary",
      "./app-primary-484df789f2f5.css",
      "@rchunk/local-conversation-artifacts-signals",
      "@rchunk/local-conversation-external-resources",
      "@rchunk/local-conversation-sources-signals",
      "@rchunk/local-conversation-sources-signals-entry",
      "@rchunk/local-conversation-webmcp-tools-model-entry",
      "@rchunk/local-conversation-webmcp-tools-model",
      "@rchunk/webmcp-tool-calls",
      "@rchunk/appgen-browser-site-entry",
      "@rchunk/appgen-query",
      "@rchunk/appgen-access-entry",
      "@rchunk/open-local-conversation-sources-side-panel-tab-entry",
      "@rchunk/open-local-conversation-sources-side-panel-tab",
      "@rchunk/open-sources-side-panel-tab",
      "@rchunk/dialog-launcher-entry",
      "@rchunk/dialog-launcher-core",
      "@rchunk/browser-profile-import-availability",
      "@rchunk/browser-profile-import-analytics",
      "@rchunk/browser-profile-import-nux",
      "@rchunk/thread-panel-secondary-state",
      "@rchunk/appgen-settings-dialog",
      "@rchunk/appgen-settings-page",
      "@rchunk/appgen-site-detail-layout",
      "@rchunk/security-tabs",
      "@rchunk/toolbar-breadcrumb",
      "@rchunk/appgen-disabled-tooltip",
      "@rchunk/start-appgen-conversation",
      "@rchunk/appgen-access-state-messages",
      "@rchunk/lock",
      "@rchunk/building",
      "@rchunk/open-appgen-share-dialog",
      "@rchunk/appgen-site-card",
      "@rchunk/modal-controller-state",
      "@rchunk/appgen-share-dialog",
      "@rchunk/dialog-action",
      "@rchunk/permission-dropdown",
    ]),
) => i.map((i) => d[i]);
import { sitesSharingSources as n } from "../app-shared/runtime/sites-sharing-source";
import { resolveBrowserContext as ze, subscribeBrowserCommentReadiness as Le } from "../app-primary-browser-comment-runtime/index";
import { isBrowserCommentForTab as Re } from "../app-primary/runtime/is-browser-comment-for-tab";
import { parseUrlOrFallback as Ue } from "../app-primary/runtime/parse-url-or-fallback";
import { hasQueuedDesignChange as r } from "../app-shared/runtime/has-queued-design-change";
import { n as e } from "@rchunk/rolldown-runtime";
import {
  $j as t,
  EF as i,
  EI as a,
  EJ as o,
  G3 as s,
  H3 as c,
  Hj as l,
  OJ as u,
  TF as ee,
  Uj as d,
  Um as f,
  V3 as p,
  Vj as te,
  Vm as ne,
  W3 as re,
  Wj as ie,
  Yj as ae,
  _J as m,
  aM as h,
  ac as g,
  dK as _,
  fI as v,
  gK as y,
  iM as b,
  lY as oe,
  lk as se,
  mK as ce,
  nc as le,
  pk as ue,
  rc as x,
  sK as de,
  tM as fe,
  uK as pe,
  vz as S,
  wI as me,
  wL as C,
  yI as w,
} from "@rchunk/app-shared";
import {
  $Q as he,
  $fn as ge,
  Bcn as T,
  Dft as _e,
  F9 as ve,
  Hkt as E,
  Ms as D,
  Ns as O,
  Oft as k,
  P9 as A,
  Ps as j,
  QQ as M,
  Ucn as N,
  Ukt as P,
  Vcn as F,
  X6 as ye,
  Y6 as be,
  en as xe,
  gpn as Se,
  hpn as Ce,
  itn as we,
  js as I,
  kft as Te,
  m0t as Ee,
  mfn as L,
  mnt as De,
  mpn as R,
  ngn as Oe,
  ont as ke,
  p0t as Ae,
  pfn as z,
  pnt as B,
  ppn as V,
  rgn as je,
  rtn as Me,
  snt as Ne,
  tn as Pe,
  tpn as Fe,
  xpn as H,
  ypn as Ie,
} from "@rchunk/app-initial";
import {
  Vi as Be,
  Ws as Ve,
  Xf as He,
  cf as We,
  lf as Ge,
  of as U,
  sf as Ke,
  uf as qe,
} from "@rchunk/app-primary";
import { r as Je, t as Ye } from "@rchunk/local-conversation-artifacts-signals";
import { i as Xe, n as Ze, r as Qe } from "@rchunk/comment-mode-coachmark-state";
import {
  a as $e,
  n as et,
  r as W,
  t as tt,
} from "@rchunk/source-annotation-host-registry";
import { n as nt, t as G } from "@rchunk/browser-profile-import-availability";
import { i as rt, r as it, t as at } from "@rchunk/browser-use-origin-state-queries";
import { t as ot } from "@rchunk/assert-never";
function st(e) {
  return {
    locale: e.locale,
    defaultLocale: e.defaultLocale,
    messages: Object.fromEntries(
      Object.entries(e.messages).filter(
        (e) => (q.has(e[0]) || K.some((t) => e[0].startsWith(t))) && typeof e[1] == `string`,
      ),
    ),
  };
}
var K, q;
function J() {
  return (J = e(() => {
    ((K = [
      `browserSidebar.zoomBanner.`,
      `codex.threadFindBar.`,
      `downloads.`,
      `settings.browserUse.browser.`,
      `settings.browserUse.clearBrowsingData.`,
      `thread.browser.`,
    ]),
      (q = new Set([
        `clipboard.copyError.description`,
        `clipboard.copyError.title`,
        `codex.dialog.closeButton`,
      ])));
  }))();
}
var Y, X;
function Z() {
  return (Z = e(() => {
    (v(),
      g(),
      j(),
      C(),
      u(),
      f(),
      Se(),
      he(),
      Be(),
      Xe(),
      Ve(),
      et(),
      G(),
      Ke(),
      xe(),
      be(),
      _e(),
      A(),
      se(),
      V(),
      re(),
      Ie(),
      Ne(),
      De(),
      we(),
      rt(),
      E(),
      F(),
      ge(),
      Ae(),
      z(),
      He(),
      Je(),
      je(),
      c(),
      (Y = {
        "context-menu-annotate":
          l.CODEX_IN_APP_BROWSER_ANNOTATION_MODE_ENTRY_SOURCE_CONTEXT_MENU_ANNOTATE,
        "context-menu-quick-annotate":
          l.CODEX_IN_APP_BROWSER_ANNOTATION_MODE_ENTRY_SOURCE_CONTEXT_MENU_QUICK_ANNOTATE,
        "keyboard-shortcut": l.CODEX_IN_APP_BROWSER_ANNOTATION_MODE_ENTRY_SOURCE_KEYBOARD_SHORTCUT,
        "toolbar-button": l.CODEX_IN_APP_BROWSER_ANNOTATION_MODE_ENTRY_SOURCE_TOOLBAR_BUTTON,
      }),
      (X = class {
        scope;
        content;
        tabId;
        lifecycle;
        onStateChanged;
        #e;
        #t = null;
        #n;
        #r;
        #i;
        #a;
        #o = null;
        #s = new AbortController();
        #c = !1;
        #l = null;
        #u = null;
        #d = [];
        #f = !0;
        #p;
        #m;
        constructor(e, t, n, r, i) {
          ((this.scope = e),
            (this.content = t),
            (this.tabId = n),
            (this.lifecycle = r),
            (this.onStateChanged = i),
            (this.#e = t.snapshot.url),
            (this.#n = e.watch(({ get: e }) => {
              if (e(M) !== `available` || this.#t != null) return;
              let t = !0;
              return (
                p(
                  () =>
                    import(`@rchunk/browser-site-actions-state`).then(
                      (e) => {
                        t && ((this.#t = e), i());
                      },
                      () => {},
                    ),
                  __vite__mapDeps([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]),
                  import.meta.url,
                ),
                () => {
                  t = !1;
                }
              );
            })),
            (this.#p = `${t.snapshot.interactionMode}:${t.snapshot.annotationFlow ?? m.BATCH}`),
            (this.#m =
              t.snapshot.interactionMode === `comment` &&
              (t.snapshot.annotationEditorMode === `design` ||
                t.snapshot.isTweaksEditorOpen === !0)),
            (this.#r = Ge(t.conversationId, i)),
            (this.#i = Le(t.conversationId, () => this.#g())),
            (this.#a = $e(t.browserTabId, t.conversationId, () => {
              (W(t.browserTabId, t.conversationId) &&
                this.lifecycle().state === `detached` &&
                this.lifecycle().ownsTab &&
                (this.#o?.(),
                (this.#o = null),
                this.#u != null && (s.dispatchHostMessage(this.#u), (this.#u = null)),
                this.#l != null && (s.dispatchHostMessage(this.#l), (this.#l = null))),
                this.lifecycle().state === `detached` &&
                  this.lifecycle().ownsTab &&
                  !W(t.browserTabId, t.conversationId) &&
                  this.#h(),
                i());
            })),
            W(t.browserTabId, t.conversationId) || this.#h());
        }
        dispose() {
          (this.#n(),
            this.setImageAttachmentsEnabled(!1, !1),
            this.#s.abort(),
            this.#r(),
            this.#i(),
            this.#a(),
            this.#o?.(),
            (this.#o = null),
            (this.#u = null),
            (this.#l = null));
        }
        setImageAttachmentsEnabled(e, t) {
          if (((this.#f = e), e)) return;
          let n = this.#d.length > 0;
          ((this.#d = []),
            (n || t) &&
              this.scope
                .get(ue)
                .info(
                  this.scope
                    .get(R)
                    .formatMessage({
                      id: `browser.detached.imageAttachmentCanceled`,
                      defaultMessage: `Image attachment canceled`,
                      description: `Notice that an unfinished browser image attachment was canceled because its detached window is closing or returning to the main window. The user can attach the image again.`,
                    }),
                  { id: `browser-image-attachment-canceled-${this.content.browserTabId}` },
                ));
        }
        recordBrowserAddressCommit(e) {
          this.lifecycle().state === `detached` &&
            this.lifecycle().ownsTab &&
            H(this.scope, te, { ...e });
        }
        recordBrowserAutocompleteSuggestionsShown(e) {
          this.lifecycle().state === `detached` && this.lifecycle().ownsTab && H(this.scope, ie, e);
        }
        recordBrowserNavigation(e) {
          this.lifecycle().state === `detached` &&
            this.lifecycle().ownsTab &&
            H(this.scope, t, {
              ...e,
              initiator: e.initiator === `os_open` ? `external_link` : e.initiator,
            });
        }
        forwardBrowserAnnotationMessage(e) {
          if (
            e.browserTabId === this.content.browserTabId &&
            e.conversationId === this.content.conversationId
          ) {
            if (e.type === `browser-sidebar-image-attachment-status`) {
              this.setImageAttachmentsEnabled(e.enabled, e.hadPendingDownloads);
              return;
            }
            if (this.lifecycle().state === `detached` && this.lifecycle().ownsTab) {
              if (e.type === `browser-sidebar-state`) {
                (this.#e !== e.snapshot.url && ((this.#e = e.snapshot.url), this.onStateChanged()),
                  this.#_(e.snapshot));
                return;
              }
              if (e.type === `browser-sidebar-image-attachment`) {
                if (!this.#f) return;
                (this.#d.push(e), this.#g());
                return;
              }
              if (
                !W(e.browserTabId, e.conversationId) &&
                e.type === `browser-sidebar-comment-overlay-session`
              ) {
                this.#l = e;
                return;
              }
              s.dispatchHostMessage(e);
            }
          }
        }
        #h() {
          this.#o ??= s.subscribe(`browser-sidebar-state`, (e) => {
            e.browserTabId === this.content.browserTabId &&
              e.conversationId === this.content.conversationId &&
              this.lifecycle().ownsTab &&
              (this.#u = e);
          });
        }
        #g() {
          for (; this.#f && this.#d.length > 0;) {
            if (this.lifecycle().state !== `detached` || !this.lifecycle().ownsTab) {
              this.setImageAttachmentsEnabled(!1, !1);
              return;
            }
            let e = this.#d[0];
            if (e == null || ze(e) == null) return;
            this.#d[0] === e && this.#d.shift();
          }
        }
        #_(e) {
          let t = `${e.interactionMode}:${e.annotationFlow ?? m.BATCH}`,
            n =
              e.interactionMode === `comment` &&
              (e.annotationEditorMode === `design` || e.isTweaksEditorOpen === !0);
          if (t === this.#p && n === this.#m) return;
          let i = o(e.comments) || this.#v(this.scope.get) > 0,
            a = r(e.comments);
          (t !== this.#p &&
            (H(this.scope, d, {
              enabled: e.interactionMode === `comment`,
              hasPendingAnnotations: i,
              hasQueuedDesignTweaks: a,
              annotationEditorMode:
                e.annotationEditorMode === `design` || e.isTweaksEditorOpen === !0
                  ? `design`
                  : `comment`,
              entrySource:
                e.interactionMode === `comment` && e.annotationModeEntrySource != null
                  ? Y[e.annotationModeEntrySource]
                  : void 0,
            }),
            (this.#p = t)),
            n !== this.#m &&
              (H(this.scope, ae, {
                enabled: n,
                hasPendingAnnotations: i,
                hasQueuedDesignTweaks: a,
              }),
              (this.#m = n)));
        }
        #v(e) {
          return e(ye, {
            conversationId: Me(this.scope.value) ?? this.content.conversationId,
            path: null,
            pullRequestReviewKey: null,
          }).filter((e) => Re(e, this.content.browserTabId)).length;
        }
        async getBrowserSiteToolsContext(e) {
          let t = { canOpenSources: !1, recentToolCallCount: 0 };
          if (
            (this.lifecycle().state !== `source` && this.lifecycle().state !== `detached`) ||
            !this.lifecycle().ownsTab
          )
            return t;
          let [n, r] = await Promise.all([
            p(
              () => import(`@rchunk/local-conversation-sources-signals-entry`),
              __vite__mapDeps([13, 2, 1, 3, 12, 4, 5]),
              import.meta.url,
            ),
            p(
              () => import(`@rchunk/local-conversation-webmcp-tools-model-entry`),
              __vite__mapDeps([14, 15, 1, 2, 3, 4, 5, 16]),
              import.meta.url,
            ),
          ]);
          if (
            (this.lifecycle().state !== `source` && this.lifecycle().state !== `detached`) ||
            !this.lifecycle().ownsTab
          )
            return t;
          let i =
              this.scope.value.routeKind === `local-thread`
                ? this.scope.value.conversationId
                : void 0,
            a = r.getHostnameFromWebUrl(e),
            o = i == null ? null : this.scope.get(n.conversationTurnsForSources$, i);
          return {
            canOpenSources: i != null,
            sourcesConversationId: i,
            recentToolCallCount:
              a == null || o == null
                ? 0
                : r
                    .getWebMcpCallsForSummaryPanel(o)
                    .filter((e) => e.kind === `invokeTool` && e.sourceHostname === a).length,
          };
        }
        getSiteActions(e, t) {
          return e(M) !== `available` || this.#t == null
            ? null
            : this.#t.getBrowserSiteActionsState(e, this.content, this.#e, t);
        }
        async #y(e, t = !1) {
          if (
            (this.lifecycle().state !== `source` && this.lifecycle().state !== `detached`) ||
            !this.lifecycle().ownsTab ||
            this.scope.get(M) !== `available`
          )
            return null;
          let [{ getAppgenBrowserSiteForUrl: n }, { appgenProjectQuery$: r }, i] =
            await Promise.all([
              p(
                () => import(`@rchunk/appgen-browser-site-entry`),
                __vite__mapDeps([17, 7, 1, 8, 2, 3, 4, 5, 9]),
                import.meta.url,
              ),
              p(
                () => import(`@rchunk/appgen-query`),
                __vite__mapDeps([18, 2, 1, 3, 4, 5]),
                import.meta.url,
              ),
              p(
                () => import(`@rchunk/appgen-access-entry`),
                __vite__mapDeps([19, 4, 1, 2, 3, 5, 6]),
                import.meta.url,
              ),
            ]);
          if (
            (this.lifecycle().state !== `source` && this.lifecycle().state !== `detached`) ||
            !this.lifecycle().ownsTab ||
            this.scope.get(M) !== `available`
          )
            return null;
          let a = this.content,
            o = () =>
              n(
                this.scope.get(Ye, {
                  conversationId: oe(a.conversationId),
                  hostId: this.lifecycle().hostId,
                }),
                e,
              ),
            s = o();
          if (s == null) return null;
          let c = this.scope.get(r, s.projectId),
            l = t || c.data == null ? await c.refetch() : null;
          if (t && l?.isSuccess !== !0) return null;
          let u = l?.data ?? c.data;
          return (this.lifecycle().state !== `source` && this.lifecycle().state !== `detached`) ||
            !this.lifecycle().ownsTab ||
            this.scope.get(M) !== `available` ||
            o()?.projectId !== s.projectId
            ? null
            : {
                siteUrl: e,
                projectId: s.projectId,
                canManage: i.canManageAppgenProject(u),
                isOwnerOnly:
                  u != null && i.isAppgenAccessOwnerOnly(i.getAppgenAccessState(u.access_policy)),
              };
        }
        async requestBrowserToolbarAction(e) {
          if (this.lifecycle().state !== `detached` || !this.lifecycle().ownsTab) return !1;
          if (e.type === `record-error-toast`)
            return (ve((...e) => H(this.scope, ...e), { toastId: e.toastId }), !0);
          if (e.type === `set-annotation-markers-visible`)
            return this.getCapabilities(this.scope.get, this.lifecycle().hostId)
              .annotationModeEnabled
              ? (await N(this.scope, S.annotationMarkersVisible, e.visible),
                this.lifecycle().state === `detached` && this.lifecycle().ownsTab)
              : !1;
          if (e.type === `dismiss-active-annotation-editor`)
            return tt(this.content.browserTabId, this.content.conversationId);
          if (e.type === `dismiss-annotation-coachmark`) return (Ze(), !0);
          if (e.type === `submit-browser-tweaks`)
            return this.getCapabilities(this.scope.get, this.lifecycle().hostId).canUseComposer
              ? this.#b()
              : !1;
          if (e.type === `submit-browser-tweaks-after-focus`) {
            if (this.#c) return !1;
            this.#c = !0;
            try {
              return !(await qe(this.content.conversationId, this.#s.signal, 5e3)) ||
                this.#s.signal.aborted ||
                this.lifecycle().state !== `detached` ||
                !this.lifecycle().ownsTab ||
                U(this.content.conversationId) !== !0
                ? !1
                : await this.#b();
            } finally {
              this.#c = !1;
            }
          }
          if (e.type === `capture-screenshot-clicked`)
            return (
              H(this.scope, b, {
                action: h.CODEX_IN_APP_BROWSER_TOOLBAR_ACTION_TYPE_CAPTURE_SCREENSHOT_CLICKED,
              }),
              !0
            );
          if (e.type === `open-external`)
            return (
              e.url.trim().length !== 0 &&
              (H(this.scope, fe, {}),
              H(this.scope, b, {
                action: h.CODEX_IN_APP_BROWSER_TOOLBAR_ACTION_TYPE_OPENED_IN_EXTERNAL_BROWSER,
              }),
              Te({
                href: ne(e.url, { openAIGoLinksEnabled: this.scope.get(L, `3646210497`) }),
                initiator: `open_in_browser_bridge`,
                openTarget: `external-browser`,
              }))
            );
          if (e.type === `capture-screenshot-selected`)
            return this.getCapabilities(this.scope.get, this.lifecycle().hostId)
              .canCaptureScreenshot
              ? (H(this.scope, D, {
                  action: O.CODEX_BROWSER_SURFACE_ACTION_TYPE_CAPTURE_SCREENSHOT_SELECTED,
                  surface: I.CODEX_BROWSER_SURFACE_IN_APP_BROWSER_OVERFLOW_MENU,
                }),
                !0)
              : !1;
          if (e.type === `device-toolbar-shown`)
            return (
              H(this.scope, D, {
                action: O.CODEX_BROWSER_SURFACE_ACTION_TYPE_SHOW_DEVICE_TOOLBAR_SELECTED,
                surface: I.CODEX_BROWSER_SURFACE_IN_APP_BROWSER_OVERFLOW_MENU,
              }),
              !0
            );
          if (e.type === `device-toolbar-action`) {
            let t = {
              "dimensions-input-changed":
                h.CODEX_IN_APP_BROWSER_TOOLBAR_ACTION_TYPE_DEVICE_TOOLBAR_DIMENSIONS_INPUT_CHANGED,
              "dimensions-drag-changed":
                h.CODEX_IN_APP_BROWSER_TOOLBAR_ACTION_TYPE_DEVICE_TOOLBAR_DIMENSIONS_DRAG_CHANGED,
              rotated: h.CODEX_IN_APP_BROWSER_TOOLBAR_ACTION_TYPE_DEVICE_TOOLBAR_ROTATED,
            };
            return t[e.action] != null && (H(this.scope, b, { action: t[e.action] }), !0);
          }
          if (e.type === `set-extensions-toolbar-visible`)
            return this.getCapabilities(this.scope.get, this.lifecycle().hostId).extensionsEnabled
              ? (await N(this.scope, S.extensionsToolbarVisible, e.visible, { optimistic: !1 }),
                this.lifecycle().state === `detached`)
              : !1;
          if (e.type === `open-extensions-web-store`)
            return this.getCapabilities(this.scope.get, this.lifecycle().hostId).extensionsEnabled
              ? k({
                  event: { ...e.click, preventDefault: () => {} },
                  href: `https://chromewebstore.google.com/`,
                  initiator: `side_panel_menu`,
                  openTarget: `in-app-browser`,
                })
              : !1;
          if (e.type === `record-site-tools-action`) {
            let t = {
              "menu-opened": x.CODEX_BROWSER_INTERACTIONS_SITE_TOOLS_ACTION_MENU_OPENED,
              "learn-more-clicked":
                x.CODEX_BROWSER_INTERACTIONS_SITE_TOOLS_ACTION_LEARN_MORE_CLICKED,
              "history-opened": x.CODEX_BROWSER_INTERACTIONS_SITE_TOOLS_ACTION_HISTORY_OPENED,
            }[e.action];
            return t != null && (H(this.scope, le, { action: t }), !0);
          }
          if (e.type === `open-site-tools-help`) {
            let t = this.getCapabilities(this.scope.get, this.lifecycle().hostId).siteToolsHelpUrl;
            return (
              e.url === t &&
              k({
                event: { ...e.click, preventDefault: () => {} },
                href: t,
                initiator: `open_in_browser_bridge`,
              })
            );
          }
          if (e.type === `open-site-tools-sources`) {
            let e =
              this.scope.value.routeKind === `local-thread`
                ? this.scope.value.conversationId
                : void 0;
            if (e == null) return !1;
            let t = this.content.browserTabId,
              { openLocalConversationSourcesSidePanelTab: n } = await p(
                async () => {
                  let { openLocalConversationSourcesSidePanelTab: e } = await import(
                    `@rchunk/open-local-conversation-sources-side-panel-tab-entry`
                  );
                  return { openLocalConversationSourcesSidePanelTab: e };
                },
                __vite__mapDeps([20, 21, 1, 2, 3, 4, 5, 22]),
                import.meta.url,
              );
            return this.lifecycle().state !== `detached` || !this.lifecycle().ownsTab
              ? !1
              : (n(
                  this.scope,
                  { conversationId: e, hostId: this.lifecycle().hostId },
                  this.scope
                    .get(R)
                    .formatMessage({
                      id: `codex.localConversation.sources.title`,
                      defaultMessage: `Sources`,
                      description: `Title for the section and tab containing sources of information used by the conversation`,
                    }),
                  t,
                ),
                !0);
          }
          if (e.type === `open-profile-import`) {
            let { openBrowserProfileImportDialog: e } = await p(
              async () => {
                let { openBrowserProfileImportDialog: e } = await import(
                  `@rchunk/dialog-launcher-entry`
                );
                return { openBrowserProfileImportDialog: e };
              },
              __vite__mapDeps([23, 24, 1, 2, 3, 4, 5, 25, 26]),
              import.meta.url,
            );
            if (this.lifecycle().state !== `detached` || !this.lifecycle().ownsTab) return !1;
            let t = e(this.scope, B.browserProfileImport, `in-app-browser-overflow-menu`);
            if (t) {
              let { acknowledgeBrowserProfileImportNux: e } = await p(
                async () => {
                  let { acknowledgeBrowserProfileImportNux: e } = await import(
                    `@rchunk/browser-profile-import-nux`
                  );
                  return { acknowledgeBrowserProfileImportNux: e };
                },
                __vite__mapDeps([27, 28, 1, 2, 3, 4, 5]),
                import.meta.url,
              );
              e(this.scope);
            }
            return t;
          }
          if (e.type === `browsing-data-cleared`)
            return Array.isArray(e.dataTypes)
              ? (await Promise.all([
                  this.scope.queryClient.invalidateQueries({
                    queryKey: [`browser-browsing-history`],
                  }),
                  ...(e.dataTypes.includes(`downloads`)
                    ? [
                        this.scope.queryClient.invalidateQueries({
                          queryKey: [`browser-download-history`],
                        }),
                      ]
                    : []),
                ]),
                this.lifecycle().state === `detached` && this.lifecycle().ownsTab)
              : !1;
          if (e.type === `clear-browser-data`) {
            if (
              B.browsingHistory != null ||
              (e.dataType !== `cookies` && e.dataType !== `cache` && e.dataType !== `downloads`)
            )
              return !1;
            try {
              await it([e.dataType]);
            } catch {
              return !1;
            }
            return this.lifecycle().state === `detached` && this.lifecycle().ownsTab;
          }
          if (e.type === `open-appgen-site-settings`)
            try {
              var t = w();
              let n = await this.#y(e.siteUrl);
              if (n?.canManage !== !0 || this.lifecycle().state !== `detached`) return !1;
              let [{ AppgenSettingsDialog: r }, { openModal: i }] = await Promise.all([
                  p(
                    () => import(`@rchunk/appgen-settings-dialog`),
                    __vite__mapDeps([
                      29, 1, 2, 3, 30, 4, 5, 8, 9, 6, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40,
                    ]),
                    import.meta.url,
                  ),
                  p(
                    () => import(`@rchunk/modal-controller-state`),
                    __vite__mapDeps([41, 2, 1, 3, 4, 5]),
                    import.meta.url,
                  ),
                ]),
                a = await this.#y(e.siteUrl, !0);
              return a?.projectId !== n.projectId ||
                !a.canManage ||
                this.lifecycle().state !== `detached` ||
                !this.lifecycle().ownsTab ||
                (await t
                  .u(await B.browserHost?.detachedTabs)
                  ?.isCurrentBrowserSiteUrl(
                    this.scope.value.clientThreadId,
                    this.tabId,
                    e.siteUrl,
                  )) !== !0 ||
                this.lifecycle().state !== `detached` ||
                !this.lifecycle().ownsTab
                ? !1
                : (H(this.scope, b, {
                    action: h.CODEX_IN_APP_BROWSER_TOOLBAR_ACTION_TYPE_SITES_SETTINGS_CLICKED,
                  }),
                  i(this.scope, r, { projectId: n.projectId }),
                  !0);
            } catch (e) {
              t.e = e;
            } finally {
              t.d();
            }
          if (e.type === `open-appgen-site-share`)
            try {
              var r = w();
              let t = await this.#y(e.siteUrl);
              if (t == null || this.lifecycle().state !== `detached`) return !1;
              let [{ AppgenShareDialog: a }, { openModal: o }] = await Promise.all([
                p(
                  () => import(`@rchunk/appgen-share-dialog`),
                  __vite__mapDeps([42, 1, 2, 3, 4, 5, 6, 40, 8, 9, 43, 44]),
                  import.meta.url,
                ),
                p(
                  () => import(`@rchunk/modal-controller-state`),
                  __vite__mapDeps([41, 2, 1, 3, 4, 5]),
                  import.meta.url,
                ),
              ]);
              if (
                (await this.#y(e.siteUrl, !0))?.projectId !== t.projectId ||
                this.lifecycle().state !== `detached` ||
                !this.lifecycle().ownsTab ||
                (await r
                  .u(await B.browserHost?.detachedTabs)
                  ?.isCurrentBrowserSiteUrl(
                    this.scope.value.clientThreadId,
                    this.tabId,
                    e.siteUrl,
                  )) !== !0 ||
                this.lifecycle().state !== `detached` ||
                !this.lifecycle().ownsTab
              )
                return !1;
              H(this.scope, b, {
                action: h.CODEX_IN_APP_BROWSER_TOOLBAR_ACTION_TYPE_SITES_SHARE_CLICKED,
              });
              let s = n.CODEX_SITES_SHARING_SOURCE_IN_APP_BROWSER;
              try {
                H(this.scope, i, {
                  action: ee.CODEX_SITES_SHARING_ACTION_OPENED,
                  projectId: t.projectId,
                  source: s,
                });
              } catch {}
              return (
                o(this.scope, a, { projectId: t.projectId, showVisitAction: !1, source: s }),
                !0
              );
            } catch (e) {
              r.e = e;
            } finally {
              r.d();
            }
          if (e.type === `open-settings`) {
            let t = {
                browser: `/settings/browser-use`,
                "contact-info": de,
                downloads: pe,
                extensions: _,
                history: ce,
                "password-manager": y,
              },
              n = {
                browser: O.CODEX_BROWSER_SURFACE_ACTION_TYPE_BROWSER_SETTINGS_SELECTED,
                "contact-info": O.CODEX_BROWSER_SURFACE_ACTION_TYPE_CONTACT_INFO_SELECTED,
                downloads: O.CODEX_BROWSER_SURFACE_ACTION_TYPE_DOWNLOADS_SELECTED,
                extensions: null,
                history: O.CODEX_BROWSER_SURFACE_ACTION_TYPE_HISTORY_SELECTED,
                "password-manager": O.CODEX_BROWSER_SURFACE_ACTION_TYPE_PASSWORD_MANAGER_SELECTED,
              }[e.destination];
            n != null &&
              H(this.scope, D, {
                action: n,
                surface: I.CODEX_BROWSER_SURFACE_IN_APP_BROWSER_OVERFLOW_MENU,
              });
            let r = this.scope.get(Ce).prepareNavigation(t[e.destination]);
            return r != null && (await r(), !0);
          }
          return ot(e);
        }
        async #b() {
          let e = We(this.content.conversationId);
          if (e == null) return !1;
          try {
            await e;
          } catch {
            return !1;
          }
          return this.lifecycle().state === `detached` && this.lifecycle().ownsTab;
        }
        getCapabilities(e, t) {
          let { data: n, isLoading: r } = e(ke, t),
            i = !r && (n?.find((e) => e.name === `in_app_browser`)?.enabled ?? !0),
            a = U(this.content.conversationId);
          return {
            appgenAvailable: e(M) === `available`,
            annotationModeEnabled: W(this.content.browserTabId, this.content.conversationId),
            annotationMarkersVisible: T(e, S.annotationMarkersVisible),
            showAnnotationCoachmark: !(
              e(Qe) ?? Oe(`browser-sidebar-comment-mode-coachmark-dismissed`, !1)
            ),
            tweaksEnabled: e(L, `2327881676`),
            canUseComposer: a === !0,
            isComposerListenerRegistered: a !== void 0,
            pendingCommentAttachmentCount: this.#v(e),
            browserSettingsSections: {
              contactInfo: i,
              downloads: i,
              history: i,
              passwordManager: i,
            },
            canCaptureScreenshot: !0,
            canClearBrowsingData: B.browsingHistory != null,
            canImportProfile: B.browserProfileImport != null && e(nt),
            canUseWebMcp:
              e(Pe) &&
              B.browserHost?.getWebMcpInspectorData != null &&
              e(at).data?.webMcpEnabled !== !1,
            extensionsEnabled: i && e(L, `2982604767`),
            extensionsToolbarVisible: T(e, S.extensionsToolbarVisible),
            isDefaultBrowser: e(Fe, `is_default_browser`) === !0,
            reduceMotion: e(P),
            siteToolsHelpUrl: Ue(
              e(Ee, `3999280432`)?.value ?? {},
              `https://help.openai.com/articles/20001423`,
            ),
            zeroStateAutocompleteEnabled: e(L, `2002769348`),
          };
        }
      }));
  }))();
}
function ct(e, t, n) {
  let r = !1,
    i = new X(
      e,
      t,
      n.tabId,
      () => {
        let e = n.getLifecycle();
        return { ...e, ownsTab: !r && e.ownsTab };
      },
      n.onStateChanged.bind(n),
    );
  return {
    toolbar: { kind: `browser`, service: new Q(i) },
    getState: (e, t) => ({
      browserIntlConfig: st(e(R)),
      browserToolbarCapabilities: i.getCapabilities(e, t),
      browserHostId: t,
      openAIGoLinksEnabled: e(L, `3646210497`),
      showFullUrl: T(e, S.showFullUrl),
      siteActions: i.getSiteActions(e, t),
    }),
    [Symbol.dispose]: () => {
      r || ((r = !0), i.dispose());
    },
  };
}
var Q;
function $() {
  return ($ = e(() => {
    (a(),
      C(),
      V(),
      F(),
      z(),
      J(),
      Z(),
      (Q = class extends me {
        #e;
        constructor(e) {
          (super(), (this.#e = e));
        }
        recordBrowserAddressCommit(e) {
          this.#e.recordBrowserAddressCommit(e);
        }
        recordBrowserAutocompleteSuggestionsShown(e) {
          this.#e.recordBrowserAutocompleteSuggestionsShown(e);
        }
        recordBrowserNavigation(e) {
          this.#e.recordBrowserNavigation(e);
        }
        getBrowserSiteToolsContext(e) {
          return this.#e.getBrowserSiteToolsContext(e);
        }
        requestBrowserToolbarAction(e) {
          return this.#e.requestBrowserToolbarAction(e);
        }
        forwardBrowserAnnotationMessage(e) {
          this.#e.forwardBrowserAnnotationMessage(e);
        }
      }));
  }))();
}
$();
export { ct as createBrowserWindowToolbarContribution };
