// @ts-nocheck

export type ApplicationMenuBuilderDependencies = {
  shared: Record<string, any>;
  bootstrap: { hn(): { formatMessage(descriptor: Record<string, any>): string } };
  electron: Record<string, any>;
  menuIds: { file: string; edit: string; view: string; window: string; help: string };
  sparkleLogger(): { info(message: string, fields?: Record<string, any>): void; warning(message: string, fields?: Record<string, any>): void };
  showAboutDialog(options: Record<string, any>): unknown;
  resolveCloseTabCommand(state: unknown): Record<string, any> | null;
  resolveOriginPanel(state: unknown): string | null;
  createTraceMenuItem(options: Record<string, any>): Record<string, any>;
  publishTraceState(windowManager: Record<string, any>): void;
  normalizeMenuAccelerator(accelerator: string, isMacOS: boolean): string;
};

export type ApplicationMenuOptions = {
  commandKeymapState?: unknown;
  buildFlavor: string;
  isMacOS: boolean;
  allowDevtools: boolean;
  allowDebugMenu: boolean;
  allowWindowReload: boolean;
  enableUpdater: boolean;
  desktopFeatureAvailability: Record<string, any>;
  sparkleManager: Record<string, any>;
  ensurePrimaryWindowVisible(): Promise<any>;
  createFreshWindow(route: string): Promise<any>;
  getAuthenticatedUserId(): Promise<string | null>;
  queueCodexDeepLinkUrl(url: string): boolean;
  navigateToRoute(window: any, route: string, state?: unknown): unknown;
  collapseHotkeyWindowToHome?(): Promise<unknown> | unknown;
  getElectronMessageHandlerForWindow(window: any): any;
  windowManager: Record<string, any>;
  traceRecordingUploadOptions?: Record<string, any>;
};

/** Creates the complete Electron application-menu builder used by the desktop shell. */
export function createApplicationMenuBuilder(
  dependencies: ApplicationMenuBuilderDependencies,
): (options: ApplicationMenuOptions) => void {
  const {
    shared: n,
    bootstrap: a,
    electron: l,
    menuIds: ot,
    sparkleLogger: _7,
    showAboutDialog: Qrt,
    resolveCloseTabCommand: dU,
    resolveOriginPanel: fU,
    createTraceMenuItem: IQe,
    publishTraceState: UZ,
    normalizeMenuAccelerator,
  } = dependencies;
  const c7 = `codex.aboutDialog.title`;
  const l7 = `About {appName}`;

  const g7 = {
    closeTab: `codex.tabs.contextMenu.close`,
    closeWindow: `codex.tabs.contextMenu.close`,
    copyWorkingDirectory: `threadHeader.copyWorkingDirectory`,
    newWindow: `electron.appMenu.file.newWindow`,
    reloadBrowserPage: `thread.browser.reload`,
    renameThread: `sidebarElectron.renameThread`,
    searchFiles: `codex.commandMenu.fileSearchPlaceholder`,
    toggleFileTreePanel: `review.fileSource.browser.toggleFileTree`,
  };
  [
    ...n.Ft.flatMap((e) =>
      !(`electron` in e) || e.electron?.menuTitle == null || !(`titleIntlId` in e)
        ? []
        : [e.titleIntlId],
    ),
    ...Object.values(g7),
  ];
  function createBaseRoleMenus({ nativeIntl: e, isMacOS: t }) {
    return {
      editMenu: {
        label: e.formatMessage({ messageId: `windowsMenuBar.edit`, defaultMessage: `Edit` }),
        role: `editMenu`,
        id: ot.edit,
        submenu: [
          {
            label: e.formatMessage({
              messageId: `electron.appMenu.edit.undo`,
              defaultMessage: `Undo`,
            }),
            role: `undo`,
          },
          {
            label: e.formatMessage({
              messageId: `electron.appMenu.edit.redo`,
              defaultMessage: `Redo`,
            }),
            role: `redo`,
          },
          { type: `separator` },
          {
            label: e.formatMessage({ messageId: `electron.appMenu.edit.cut`, defaultMessage: `Cut` }),
            role: `cut`,
          },
          {
            label: e.formatMessage({
              messageId: `electron.appMenu.edit.copy`,
              defaultMessage: `Copy`,
            }),
            role: `copy`,
          },
          {
            label: e.formatMessage({
              messageId: `electron.appMenu.edit.paste`,
              defaultMessage: `Paste`,
            }),
            role: `paste`,
          },
          ...(t
            ? [
                {
                  label: e.formatMessage({
                    messageId: `electron.appMenu.edit.pasteAndMatchStyle`,
                    defaultMessage: `Paste and Match Style`,
                  }),
                  role: `pasteAndMatchStyle`,
                  accelerator: `Command+Option+Shift+V`,
                  acceleratorWorksWhenHidden: !0,
                },
              ]
            : []),
          {
            label: e.formatMessage({
              messageId: `electron.appMenu.edit.delete`,
              defaultMessage: `Delete`,
            }),
            role: `delete`,
          },
          { type: `separator` },
          {
            label: e.formatMessage({
              messageId: `electron.appMenu.edit.selectAll`,
              defaultMessage: `Select All`,
            }),
            role: `selectAll`,
          },
          ...(t
            ? [
                { type: `separator` },
                {
                  label: e.formatMessage({
                    messageId: `electron.appMenu.edit.substitutions`,
                    defaultMessage: `Substitutions`,
                  }),
                  submenu: [
                    {
                      label: e.formatMessage({
                        messageId: `electron.appMenu.edit.showSubstitutions`,
                        defaultMessage: `Show Substitutions`,
                      }),
                      role: `showSubstitutions`,
                    },
                    { type: `separator` },
                    {
                      label: e.formatMessage({
                        messageId: `electron.appMenu.edit.smartQuotes`,
                        defaultMessage: `Smart Quotes`,
                      }),
                      role: `toggleSmartQuotes`,
                    },
                    {
                      label: e.formatMessage({
                        messageId: `electron.appMenu.edit.smartDashes`,
                        defaultMessage: `Smart Dashes`,
                      }),
                      role: `toggleSmartDashes`,
                    },
                    {
                      label: e.formatMessage({
                        messageId: `electron.appMenu.edit.textReplacement`,
                        defaultMessage: `Text Replacement`,
                      }),
                      role: `toggleTextReplacement`,
                    },
                  ],
                },
                {
                  label: e.formatMessage({
                    messageId: `electron.appMenu.edit.speech`,
                    defaultMessage: `Speech`,
                  }),
                  submenu: [
                    {
                      label: e.formatMessage({
                        messageId: `electron.appMenu.edit.startSpeaking`,
                        defaultMessage: `Start Speaking`,
                      }),
                      role: `startSpeaking`,
                    },
                    {
                      label: e.formatMessage({
                        messageId: `electron.appMenu.edit.stopSpeaking`,
                        defaultMessage: `Stop Speaking`,
                      }),
                      role: `stopSpeaking`,
                    },
                  ],
                },
              ]
            : []),
        ],
      },
      windowMenu: {
        label: e.formatMessage({ messageId: `electron.appMenu.window`, defaultMessage: `Window` }),
        role: `windowMenu`,
        id: ot.window,
        submenu: [
          {
            label: e.formatMessage({
              messageId: `electron.appMenu.window.minimize`,
              defaultMessage: `Minimize`,
            }),
            role: `minimize`,
          },
          {
            label: e.formatMessage({
              messageId: `electron.appMenu.window.zoom`,
              defaultMessage: `Zoom`,
            }),
            role: `zoom`,
          },
          { type: `separator` },
          {
            label: e.formatMessage({
              messageId: `electron.appMenu.window.bringAllToFront`,
              defaultMessage: `Bring All to Front`,
            }),
            role: `front`,
          },
        ],
      },
    };
  }
  const ait = `/`,
    oit = `/settings/general-settings`;
  function buildApplicationMenu({
    commandKeymapState: e = n.Ct(),
    buildFlavor: t,
    isMacOS: r,
    allowDevtools: i,
    allowDebugMenu: o,
    allowWindowReload: s,
    enableUpdater: c,
    desktopFeatureAvailability: u,
    sparkleManager: d,
    ensurePrimaryWindowVisible: f,
    createFreshWindow: p,
    getAuthenticatedUserId: m,
    queueCodexDeepLinkUrl: h,
    navigateToRoute: g,
    collapseHotkeyWindowToHome: _,
    getElectronMessageHandlerForWindow: v,
    windowManager: y,
    traceRecordingUploadOptions: b,
  }: ApplicationMenuOptions) {
    let x = a.hn(),
      S = `CmdOrCtrl+Shift+C`,
      C = r ? [`Command+F`, `Command+G`, `Command+Shift+G`] : [`Ctrl+F`, `Ctrl+G`, `Shift+F3`],
      w = new Set(C.map((e) => normalizeMenuAccelerator(e, r))),
      T = { codexLocal: u.codexLocalAccess, workLocal: u.workLocalAccess },
      E = (t) => n.At({ commandId: t, keymapState: e, isMacOS: r }),
      D = (e) => !e.includes(` `) && !n.Pt(e),
      O = (e) => E(e).filter((e) => D(e) && !w.has(normalizeMenuAccelerator(e, r))),
      k = async () => {
        let e = l.BrowserWindow.getFocusedWindow();
        return e && !e.isDestroyed() ? e : f();
      },
      A = (e, t) => {
        let r = n.Mt({ commandId: e });
        if (r == null) throw Error(`Electron menu command '${e}' is not defined`);
        let i = n.Ot(e),
          a = i == null || n.Nt(i, T);
        return {
          label: x.formatMessage({
            messageId: i != null && `titleIntlId` in i ? i.titleIntlId : (g7[e] ?? r.menuTitleIntlId),
            defaultMessage: r.menuTitle,
          }),
          accelerator: a ? O(e)[t ?? 0] : void 0,
          visible: a ? void 0 : !1,
        };
      },
      j = new Set(
        n.Ft.filter(
          (e) =>
            `electron` in e &&
            e.electron != null &&
            `isOverridableByBrowserWebpage` in e.electron &&
            e.electron.isOverridableByBrowserWebpage === !0,
        ).map(({ id: e }) => e),
      ),
      M = new Set();
    for (let e of n.Ft)
      if (!(
        j.has(e.id) ||
        !n.Nt(e, T) ||
        (e.id === `showWorkspaceTabView` && !u.unifiedTabStrip) ||
        (e.id === `toggleDebugModal` && !o)
      ))
        for (let t of O(e.id)) M.add(normalizeMenuAccelerator(t, r));
    let N = (e) => e.filter((e) => D(e) && !M.has(normalizeMenuAccelerator(e, r))),
      P = (e) => N(E(e)),
      F = ({ accelerators: e, click: t, enabled: n, label: r }) =>
        e.map((e) => ({
          label: r,
          accelerator: e,
          acceleratorWorksWhenHidden: !0,
          enabled: n,
          visible: !1,
          click: t,
        })),
      I = {
        ...A(`settings`),
        click: async (e, t, n) => {
          let r = await f();
          if (r) {
            if (n?.triggeredByAccelerator === !0) {
              y.sendMessageToWindow(r, {
                type: `run-command`,
                id: `settings`,
                keyboardEvent: {
                  altKey: n.altKey === !0,
                  ctrlKey: n.ctrlKey === !0,
                  key: e.accelerator?.split(`+`).at(-1) ?? ``,
                  metaKey: n.metaKey === !0,
                  repeat: !1,
                  shiftKey: n.shiftKey === !0,
                },
              });
              return;
            }
            g(r, oit);
          }
        },
      },
      L = {
        ...A(`newTask`),
        click: async (e, t, n) => {
          let r = await k();
          if (r) {
            if (y.isHotkeyWindowThread(r)) {
              await _?.();
              return;
            }
            (r.webContents.focus(),
              y.sendMessageToWindow(
                r,
                n?.triggeredByAccelerator === !0
                  ? {
                      type: `run-command`,
                      id: `newTask`,
                      keyboardEvent: {
                        altKey: n.altKey === !0,
                        ctrlKey: n.ctrlKey === !0,
                        key: e.accelerator?.split(`+`).at(-1) ?? ``,
                        metaKey: n.metaKey === !0,
                        repeat: !1,
                        shiftKey: n.shiftKey === !0,
                      },
                    }
                  : { type: `run-command`, id: `newTask` },
              ));
          }
        },
      },
      R = { ...A(`newTask`, 1), acceleratorWorksWhenHidden: !0, visible: !1, click: L.click },
      z = y.getPrimaryWindow?.() ?? l.BrowserWindow.getFocusedWindow(),
      B = {
        ...A(`temporaryChat`),
        enabled:
          z != null && y.getAppShellShortcutState?.(z.webContents.id)?.temporaryChatEnabled === !0,
        click: () => {
          z == null ||
            z.isDestroyed() ||
            y.sendMessageToWindow(z, { type: `run-command`, id: `temporaryChat` });
        },
      },
      V = {
        ...A(`newProjectlessTask`),
        acceleratorWorksWhenHidden: !0,
        visible: !1,
        click: async () => {
          let e = await f();
          e && y.sendMessageToWindow(e, { type: `run-command`, id: `newProjectlessTask` });
        },
      },
      ee = {
        ...A(`newWindow`),
        click: async () => {
          let e = await p(ait);
          e && (e.isMinimized() && e.restore(), e.show(), e.focus());
        },
      },
      te = A(`closeWindow`),
      ne = (e) => {
        if (e != null && n.xt({ commandId: `closeTab`, isMacOS: r }).includes(e)) {
          let e = l.webContents.getFocusedWebContents(),
            t = l.BrowserWindow.getFocusedWindow();
          if (t != null && !t.isDestroyed()) {
            let e = Fe(t);
            if (e != null) {
              y.sendMessageToWindow(t, e);
              return;
            }
          }
          if (e != null) {
            let n = t != null && !t.isDestroyed() ? [t] : l.BrowserWindow.getAllWindows();
            for (let t of n)
              if (!t.isDestroyed() && Ne(t)?.closeFocusedVisibleBrowserTab(t, e)) return;
          }
          if (t != null && !t.isDestroyed()) {
            let e = dU(y.getAppShellShortcutState(t.webContents.id));
            if (e != null) {
              y.sendMessageToWindow(t, e);
              return;
            }
          }
        }
        let t = l.BrowserWindow.getFocusedWindow();
        t == null || t.isDestroyed() || t.close();
      },
      H = {
        ...te,
        click: () => {
          ne(te.accelerator);
        },
      },
      re = A(`closeWindow`, 1),
      U = {
        ...re,
        acceleratorWorksWhenHidden: !0,
        visible: !1,
        click: () => {
          ne(re.accelerator);
        },
      },
      ie = {
        ...A(`openFolder`),
        click: async () => {
          let e = await k();
          if (!e) return;
          let t = v(e);
          t && (await t.createOrSelectProject(e.webContents));
        },
      },
      ae = {
        ...A(`logOut`),
        click: async () => {
          let e = await k();
          e && y.sendMessageToWindow(e, { type: `run-command`, id: `logOut` });
        },
      },
      oe = async (e) => {
        let t = await k();
        t && y.sendMessageToWindow(t, { type: `command-menu`, query: e });
      },
      se = async () => {
        let e = await k();
        e && y.sendMessageToWindow(e, { type: `file-search-command-menu` });
      },
      ce = async () => {
        let e = await k();
        e && y.sendMessageToWindow(e, { type: `chat-search-command-menu` });
      },
      le = async (e, { allowAppShellTabShortcut: t = !1 } = {}) => {
        let n = await k();
        if (!n) return;
        let r =
            t &&
            ((e !== `nextThread` && e !== `previousThread`) ||
              y.getAppShellShortcutState(n.webContents.id)?.threadNavigationShortcutLocked !== !0),
          i = e === `focusBrowserAddressBar` || (r && Re(e)) ? q(n) : null;
        y.sendMessageToWindow(n, {
          type: `run-command`,
          id: e,
          ...(r ? { allowAppShellTabShortcut: !0 } : {}),
          originPanel: i ?? void 0,
        });
      },
      ue = async () => {
        await le(`feedback`);
      },
      de = async () => {
        let e = await k();
        e && y.sendMessageToWindow(e, { type: `copy-conversation-path` });
      },
      fe = async () => {
        let e = await k();
        e && y.sendMessageToWindow(e, { type: `toggle-thread-pin` });
      },
      W = async () => {
        let e = await k();
        e && y.sendMessageToWindow(e, { type: `rename-thread` });
      },
      G = async () => {
        let e = await k();
        e && y.sendMessageToWindow(e, { type: `archive-thread`, source: `native_accelerator` });
      },
      pe = async () => {
        if (we.accelerator != null && normalizeMenuAccelerator(we.accelerator, r) === normalizeMenuAccelerator(S, r) && Pe({ type: `copy-url` }))
          return;
        let e = await k();
        e && y.sendMessageToWindow(e, { type: `copy-working-directory` });
      },
      me = async () => {
        let e = await k();
        e && y.sendMessageToWindow(e, { type: `copy-deeplink` });
      },
      he = {
        ...A(`openCommandMenu`, 1),
        acceleratorWorksWhenHidden: !0,
        visible: !1,
        click: async () => {
          await oe(``);
        },
      },
      ge = {
        ...A(`openCommandMenu`),
        acceleratorWorksWhenHidden: !0,
        visible: !1,
        click: async () => {
          await oe();
        },
      },
      _e = { ...A(`searchFiles`), acceleratorWorksWhenHidden: !0, visible: !1, click: se },
      ve = { ...A(`searchChats`), acceleratorWorksWhenHidden: !0, visible: !1, click: ce },
      ye = n.Dt.map((e) => ({
        ...A(e),
        acceleratorWorksWhenHidden: !0,
        visible: !1,
        click: async () => {
          await le(e);
        },
      })),
      be = { ...A(`copyConversationPath`), acceleratorWorksWhenHidden: !0, visible: !1, click: de },
      xe = { ...A(`toggleThreadPin`), acceleratorWorksWhenHidden: !0, visible: !1, click: fe },
      Se = { ...A(`renameThread`), acceleratorWorksWhenHidden: !0, visible: !1, click: W },
      Ce = { ...A(`archiveThread`), acceleratorWorksWhenHidden: !0, visible: !1, click: G },
      we = { ...A(`copyWorkingDirectory`), acceleratorWorksWhenHidden: !0, visible: !1, click: pe },
      Te = { ...A(`copyDeeplink`), acceleratorWorksWhenHidden: !0, visible: !1, click: me },
      Ee = {
        label: x.formatMessage({
          messageId: c7,
          defaultMessage: l7,
          values: { appName: l.app.getName() },
        }),
        click: (e, n) => {
          Qrt({
            buildFlavor: t,
            parent: n instanceof l.BrowserWindow && !n.isDestroyed() ? n : null,
          });
        },
      },
      De = {
        ...A(`toggleSidebar`),
        click: async () => {
          let e = await k();
          e && y.sendMessageToWindow(e, { type: `toggle-sidebar` });
        },
      },
      Oe = {
        ...A(`toggleBottomPanel`),
        click: async () => {
          let e = await k();
          e && y.sendMessageToWindow(e, { type: `toggle-bottom-panel` });
        },
      },
      ke = {
        ...A(`togglePinnedSummary`),
        click: () => {
          le(`togglePinnedSummary`);
        },
      },
      Ae = {
        ...A(`toggleTerminal`),
        click: async () => {
          let e = await k();
          e && y.sendMessageToWindow(e, { type: `toggle-terminal` });
        },
      },
      je = {
        ...A(`toggleFileTreePanel`),
        click: async () => {
          let e = await k();
          e && y.sendMessageToWindow(e, { type: `toggle-file-tree-panel` });
        },
      },
      K = {
        label: u.unifiedTabStrip
          ? x.formatMessage({
              messageId: `codex.command.stepWorkspaceLayout`,
              defaultMessage: `Show or hide tabs`,
            })
          : x.formatMessage({
              messageId: `codex.command.toggleBrowserPanel`,
              defaultMessage: `Toggle browser panel`,
            }),
        accelerator: O(`stepWorkspaceLayout`)[0],
        acceleratorWorksWhenHidden: !0,
        visible: !1,
        click: () => {
          le(`stepWorkspaceLayout`);
        },
      },
      Me = {
        ...A(`openBrowserTab`),
        click: async () => {
          let e = await k();
          e &&
            y.sendMessageToWindow(e, {
              type: `open-browser-tab`,
              source: `manual`,
              initiator: `app_menu`,
            });
        },
      },
      Ne = (e) => v(e)?.getBrowserHostManager?.(),
      Pe = (e) => {
        let t = l.webContents.getFocusedWebContents();
        if (t == null) return !1;
        let n = l.BrowserWindow.getFocusedWindow();
        return (n != null && !n.isDestroyed() ? [n] : l.BrowserWindow.getAllWindows()).some(
          (n) => !n.isDestroyed() && Ne(n)?.runFocusedVisiblePageCommand(n, t, e) === !0,
        );
      },
      Fe = (e) => {
        let t = y.getAppShellShortcutState(e.webContents.id);
        return t?.focusArea === `main` ? null : dU(t);
      },
      Ie = {
        ...A(`focusBrowserAddressBar`),
        accelerator: void 0,
        click: async () => {
          await le(`focusBrowserAddressBar`);
        },
      },
      q = (e) => {
        let t = y.getAppShellShortcutState(e.webContents.id);
        if (t?.focusArea === `bottom-panel` && t.bottomPanelBrowserTabId == null) return null;
        let n =
          Ne(e)?.getFocusedVisibleBrowserTabPanel(e, l.webContents.getFocusedWebContents()) ?? null;
        if (n != null) return n;
        switch (t?.focusArea) {
          case `bottom-panel`:
            return `bottom`;
          case `right-panel`:
            return `right`;
          case `main`:
          case void 0:
        }
        return fU(t);
      },
      Le = (e) =>
        e === `nextRecentThread` || e === `nextThread`
          ? `nextTab`
          : e === `previousRecentThread` || e === `previousThread`
            ? `previousTab`
            : null,
      Re = (e) => Le(e) != null,
      ze = (e, t) => {
        let i = Le(e);
        return i != null && n.xt({ commandId: i, isMacOS: r }).includes(t);
      },
      Be = (e, t, n) => n?.triggeredByAccelerator === !0 && t != null && ze(e, t),
      Ve = l.BrowserWindow.getFocusedWindow(),
      He = l.webContents.getFocusedWebContents(),
      Ue = Ve != null && !Ve.isDestroyed() && !!Ne(Ve)?.canReloadActiveVisiblePage(Ve, He),
      We = async (e = !1) => {
        let t = await k();
        if (!t) return;
        let n = Ne(t);
        if (n == null) return;
        let r = l.webContents.getFocusedWebContents();
        if (e) {
          n.reloadActiveVisiblePageWithOptions(t, { ignoreCache: !0 }, r);
          return;
        }
        n.reloadActiveVisiblePage(t, r);
      },
      Ge = {
        ...A(`reloadBrowserPage`),
        accelerator: P(`reloadBrowserPage`)[0],
        enabled: Ue,
        click: async () => {
          await We();
        },
      },
      Ke = [
        Ge,
        ...F({
          accelerators: P(`reloadBrowserPage`).slice(1),
          click: () => We(),
          enabled: Ue,
          label: Ge.label ?? `Reload Browser Page`,
        }),
      ],
      qe = {
        ...A(`hardReloadBrowserPage`),
        accelerator: P(`hardReloadBrowserPage`)[0],
        acceleratorWorksWhenHidden: !0,
        enabled: Ue,
        visible: !1,
        click: async () => {
          await We(!0);
        },
      },
      Je = [
        qe,
        ...F({
          accelerators: P(`hardReloadBrowserPage`).slice(1),
          click: () => We(!0),
          enabled: Ue,
          label: qe.label ?? `Force Reload Browser Page`,
        }),
      ],
      Ye = {
        label: x.formatMessage({
          messageId: `electron.appMenu.view.reloadWindow`,
          defaultMessage: `Reload Window`,
        }),
        accelerator: `Command+Control+R`,
        click: async () => {
          let e = await k();
          e && e.reload();
        },
      },
      Xe = {
        ...A(`toggleSidePanel`),
        click: async () => {
          let e = await k();
          e && y.sendMessageToWindow(e, { type: `toggle-diff-panel` });
        },
      },
      Ze = IQe({
        allowDevtools: i,
        accelerator: A(`toggleTraceRecording`).accelerator,
        windowManager: y,
        traceRecordingUploadOptions: b,
      }),
      Qe = async () => {
        if (Pe({ type: `open-find` })) return;
        let e = await k();
        e && y.sendMessageToWindow(e, { type: `find-in-thread` });
      },
      $e = { ...A(`findInThread`), accelerator: C[0], click: Qe },
      et = {
        label: `Find Next`,
        accelerator: r ? `Command+G` : `Ctrl+G`,
        acceleratorWorksWhenHidden: !0,
        visible: !1,
        click: async () => {
          if (Pe({ type: `find-next` })) return;
          let e = await k();
          e != null && y.sendMessageToWindow(e, { type: `find-next-in-thread` });
        },
      },
      tt = {
        label: `Find Previous`,
        accelerator: r ? `Command+Shift+G` : `Shift+F3`,
        acceleratorWorksWhenHidden: !0,
        visible: !1,
        click: async () => {
          if (Pe({ type: `find-previous` })) return;
          let e = await k();
          e != null && y.sendMessageToWindow(e, { type: `find-previous-in-thread` });
        },
      },
      nt = A(`previousThread`),
      rt = {
        ...nt,
        click: async (e, t, n) => {
          await le(`previousThread`, {
            allowAppShellTabShortcut: Be(`previousThread`, nt.accelerator, n),
          });
        },
      },
      it = A(`previousThread`, 1),
      at = {
        ...it,
        acceleratorWorksWhenHidden: !0,
        visible: !1,
        click: async (e, t, n) => {
          await le(`previousThread`, {
            allowAppShellTabShortcut: Be(`previousThread`, it.accelerator, n),
          });
        },
      },
      st = A(`nextThread`),
      ct = {
        ...st,
        click: async (e, t, n) => {
          await le(`nextThread`, { allowAppShellTabShortcut: Be(`nextThread`, st.accelerator, n) });
        },
      },
      lt = A(`nextThread`, 1),
      ut = {
        ...lt,
        acceleratorWorksWhenHidden: !0,
        visible: !1,
        click: async (e, t, n) => {
          await le(`nextThread`, { allowAppShellTabShortcut: Be(`nextThread`, lt.accelerator, n) });
        },
      },
      dt = {
        label: x.formatMessage({
          messageId: `codex.command.toggleDebugModal`,
          defaultMessage: `Toggle Debug Panel`,
        }),
        accelerator: O(`toggleDebugModal`)[0],
        click: async () => {
          let e = await k();
          e && y.sendMessageToWindow(e, { type: `toggle-debug-modal` });
        },
      },
      ft = {
        label: `Open Deeplink from Clipboard`,
        click: () => {
          h(l.clipboard.readText().trim()) ||
            l.dialog.showMessageBox({
              type: `info`,
              title: `Invalid Deeplink`,
              message: `Clipboard does not contain a valid codex:// deeplink.`,
              detail: `Copy a codex:// URL to the clipboard and try again.`,
            });
        },
      },
      pt = {
        label: `Copy User ID`,
        click: async () => {
          let e = await m();
          e != null && l.clipboard.writeText(e);
        },
      },
      mt = {
        label: x.formatMessage({
          messageId: `debug.sidebarRamUsageIndicator.toggle`,
          defaultMessage: `Show/Hide RAM Usage`,
        }),
        click: async () => {
          let e = await k();
          e != null && y.sendMessageToWindow(e, { type: `toggle-ram-usage-indicator` });
        },
      },
      ht = {
        label: `Toggle Query Devtools`,
        accelerator: `CmdOrCtrl+Alt+Y`,
        click: async () => {
          let e = await k();
          e && y.sendMessageToWindow(e, { type: `toggle-query-devtools` });
        },
      },
      gt = {
        label: `Toggle React Scan`,
        click: async () => {
          let e = await k();
          e && y.sendMessageToWindow(e, { type: `toggle-react-scan` });
        },
      },
      _t = async (e) => {
        if (Pe({ type: `step-zoom`, delta: e })) return;
        let t = await k();
        t && y.sendMessageToWindow(t, { type: `step-window-zoom`, delta: e });
      },
      vt = async () => {
        if (Pe({ type: `reset-zoom` })) return;
        let e = await k();
        e && y.sendMessageToWindow(e, { type: `reset-window-zoom` });
      },
      yt = () => {
        let e = l.BrowserWindow.getFocusedWindow();
        e && !e.isDestroyed() && e.setFullScreen(!e.isFullScreen());
      },
      bt = {
        ...A(`navigateBack`),
        click: async () => {
          let e = await k();
          e && y.sendMessageToWindow(e, { type: `navigate-back` });
        },
      },
      xt = {
        ...A(`navigateForward`),
        accelerator: r ? O(`navigateForward`)[0] : void 0,
        click: async () => {
          let e = await k();
          e && y.sendMessageToWindow(e, { type: `navigate-forward` });
        },
      },
      St = {
        label: x.formatMessage({
          messageId: `electron.appMenu.app.checkForUpdates`,
          defaultMessage: `Check for Updates…`,
        }),
        enabled: !0,
        click: () => {
          (_7().info(`Check for updates requested via menu.`),
            d.checkForUpdates().then(() => {
              if (d.hasUpdater()) return;
              let e = d.getUnavailableReason() ?? `unknown`;
              (_7().warning(`Desktop updater unavailable; init likely skipped.`, {
                safe: { reason: e },
                sensitive: {},
              }),
                l.dialog.showMessageBox({
                  type: `info`,
                  title: `Updates Unavailable`,
                  message: `Automatic updates are unavailable right now.`,
                  detail: `Updater initialization skipped: ${e}`,
                }));
            }));
        },
      },
      Ct = {
        label: x.formatMessage({
          messageId: `electron.appMenu.app.quit`,
          defaultMessage: `Quit {appName}`,
          values: { appName: l.app.getName() },
        }),
        role: `quit`,
      },
      wt = [
        Ee,
        { type: `separator` },
        I,
        ...(c ? [St] : []),
        ae,
        { type: `separator` },
        {
          label: x.formatMessage({
            messageId: `electron.appMenu.app.services`,
            defaultMessage: `Services`,
          }),
          role: `services`,
        },
        { type: `separator` },
        {
          label: x.formatMessage({
            messageId: `electron.appMenu.app.hide`,
            defaultMessage: `Hide {appName}`,
            values: { appName: l.app.getName() },
          }),
          role: `hide`,
        },
        {
          label: x.formatMessage({
            messageId: `electron.appMenu.app.hideOthers`,
            defaultMessage: `Hide Others`,
          }),
          role: `hideOthers`,
        },
        {
          label: x.formatMessage({
            messageId: `electron.appMenu.app.showAll`,
            defaultMessage: `Show All`,
          }),
          role: `unhide`,
        },
        { type: `separator` },
        Ct,
      ],
      Tt = {
        label: x.formatMessage({ messageId: `windowsMenuBar.file`, defaultMessage: `File` }),
        id: ot.file,
        submenu: [],
      },
      Et = { role: `appMenu`, submenu: wt },
      Dt = {
        label: x.formatMessage({ messageId: `windowsMenuBar.view`, defaultMessage: `View` }),
        id: ot.view,
        submenu: [],
      },
      Ot = [
        ...F({
          accelerators: P(`navigateBrowserBack`),
          click: () => {
            Pe({ type: `go-back` });
          },
          label: `Browser Back`,
        }),
        ...F({
          accelerators: P(`navigateBrowserForward`),
          click: () => {
            Pe({ type: `go-forward` });
          },
          label: `Browser Forward`,
        }),
      ],
      kt = [
        De,
        Oe,
        ke,
        Ae,
        je,
        ...(u.unifiedTabStrip
          ? F({
              accelerators: O(`showWorkspaceTabView`),
              label: x.formatMessage({
                messageId: `codex.command.showWorkspaceTabView`,
                defaultMessage: `Full view`,
              }),
              click: () => le(`showWorkspaceTabView`),
            })
          : []),
        ...(u.browserPane || u.unifiedTabStrip ? [K] : []),
        Xe,
        ...(u.browserPane
          ? [
              { type: `separator` },
              {
                label: x.formatMessage({
                  messageId: `settings.nav.browser-use`,
                  defaultMessage: `Browser`,
                }),
                submenu: [
                  Me,
                  Ie,
                  ...Ke,
                  ...Je,
                  ...F({
                    accelerators: N([S]),
                    click: () => {
                      Pe({ type: `copy-url` });
                    },
                    label: `Copy Browser URL`,
                  }),
                  ...Ot,
                ],
              },
            ]
          : []),
        { type: `separator` },
        $e,
        et,
        tt,
        { type: `separator` },
        rt,
        at,
        ct,
        ut,
        bt,
        xt,
        ...(s ? [Ye] : []),
      ],
      At = [
        ...(o ? [pt, dt, ft, mt] : []),
        ...(i ? [{ role: `toggleDevTools` }] : []),
        ...(i && n.cu.supportsReactScan(t) ? [gt] : []),
        ...(n.Mo({ buildFlavor: t, isDev: !1 }) ? [ht] : []),
      ],
      jt = r
        ? []
        : [
            {
              label: `Zoom In`,
              accelerator: `Ctrl+=`,
              acceleratorWorksWhenHidden: !0,
              visible: !1,
              click: async () => {
                await _t(1);
              },
            },
          ],
      Mt = [
        {
          label: x.formatMessage({
            messageId: `browserSidebar.zoomBanner.zoomIn`,
            defaultMessage: `Zoom In`,
          }),
          accelerator: `CmdOrCtrl+Plus`,
          click: async () => {
            await _t(1);
          },
        },
        ...jt,
        {
          label: x.formatMessage({
            messageId: `browserSidebar.zoomBanner.zoomOut`,
            defaultMessage: `Zoom Out`,
          }),
          accelerator: `CmdOrCtrl+-`,
          click: async () => {
            await _t(-1);
          },
        },
        {
          label: x.formatMessage({
            messageId: `electron.appMenu.view.actualSize`,
            defaultMessage: `Actual Size`,
          }),
          accelerator: `CmdOrCtrl+0`,
          click: async () => {
            await vt();
          },
        },
        ...F({
          accelerators: N([`CmdOrCtrl+numadd`]),
          click: () => {
            Pe({ type: `step-zoom`, delta: 1 });
          },
          label: `Zoom In`,
        }),
        ...F({
          accelerators: N([`CmdOrCtrl+numsub`]),
          click: () => {
            Pe({ type: `step-zoom`, delta: -1 });
          },
          label: `Zoom Out`,
        }),
        ...F({
          accelerators: N([`CmdOrCtrl+num0`]),
          click: () => {
            Pe({ type: `reset-zoom` });
          },
          label: `Actual Size`,
        }),
      ];
    (kt.push({ type: `separator` }, ...Mt),
      At.length > 0 &&
        kt.push(
          { type: `separator` },
          {
            label: x.formatMessage({
              messageId: `plugins.detail.information.developer`,
              defaultMessage: `Developer`,
            }),
            submenu: At,
          },
        ),
      r
        ? kt.push(
            { type: `separator` },
            {
              label: `Toggle Full Screen`,
              accelerator: `Command+Control+F`,
              visible: !1,
              acceleratorWorksWhenHidden: !0,
              click: yt,
            },
          )
        : kt.push(
            { type: `separator` },
            {
              label: x.formatMessage({
                messageId: `electron.appMenu.view.toggleFullScreen`,
                defaultMessage: `Toggle Full Screen`,
              }),
              accelerator: `F11`,
              click: yt,
            },
          ),
      kt.push(he, ge, ve, _e, ...ye, ...(r ? [be] : []), xe, Se, Ce, we, Te),
      (Dt.submenu = kt));
    let Nt = [],
      { editMenu: Pt, windowMenu: Ft } = createBaseRoleMenus({ nativeIntl: x, isMacOS: r }),
      It = [
        ...(r ? [Et, Tt] : [Tt]),
        Pt,
        Dt,
        ...(r ? [Ft] : []),
        {
          label: x.formatMessage({ messageId: `windowsMenuBar.help`, defaultMessage: `Help` }),
          role: `help`,
          id: ot.help,
          submenu: [
            {
              label: x.formatMessage({
                messageId: `loadingPage.documentationLink`,
                defaultMessage: `Documentation`,
              }),
              click: () => {
                l.shell.openExternal(`https://developers.openai.com/codex/app`);
              },
            },
            {
              ...A(`showKeyboardShortcuts`),
              click: async () => {
                await le(`showKeyboardShortcuts`);
              },
            },
            {
              label: x.formatMessage({
                messageId: `sidebarHelp.whatsNew`,
                defaultMessage: `What's New`,
              }),
              click: () => {
                l.shell.openExternal(`https://developers.openai.com/codex/changelog`);
              },
            },
            { type: `separator` },
            {
              label: x.formatMessage({
                messageId: `electron.appMenu.help.troubleshooting`,
                defaultMessage: `Troubleshooting`,
              }),
              click: () => {
                l.shell.openExternal(`https://developers.openai.com/codex/app/troubleshooting`);
              },
            },
            {
              label: x.formatMessage({
                messageId: `electron.appMenu.help.systemStatus`,
                defaultMessage: `System Status`,
              }),
              click: () => {
                l.shell.openExternal(`https://status.openai.com`);
              },
            },
            {
              label: x.formatMessage({
                messageId: `artifactFeedback.button.label`,
                defaultMessage: `Send Feedback`,
              }),
              click: ue,
            },
            { type: `separator` },
            {
              label: x.formatMessage({
                messageId: `electron.appMenu.help.taskManager`,
                defaultMessage: `Task Manager`,
              }),
              click: () => l.app.showTaskManager(),
            },
            Ze,
            ...Nt,
            ...(r
              ? []
              : [{ type: `separator` }, ...(c && process.platform !== `linux` ? [St] : []), Ee]),
          ],
        },
      ],
      Lt = l.Menu.buildFromTemplate(It),
      Rt = Lt.getMenuItemById(ot.edit)?.submenu;
    if (r) {
      let e = Rt?.items.find((e) => e.role?.toLowerCase() === `pasteandmatchstyle`);
      Rt &&
        e &&
        ((e.visible = !1),
        Rt.insert(
          Rt.items.indexOf(e),
          new l.MenuItem({
            label: x.formatMessage({
              messageId: `electron.appMenu.edit.pasteAndMatchStyle`,
              defaultMessage: `Paste and Match Style`,
            }),
            role: `pasteAndMatchStyle`,
            accelerator: `Command+Shift+V`,
          }),
        ));
    } else
      process.platform === `win32` &&
        Rt &&
        (Rt.append(new l.MenuItem({ type: `separator` })), Rt.append(new l.MenuItem(I)));
    let zt = Lt.getMenuItemById(ot.file)?.submenu;
    if (zt) {
      let e = 0;
      (u.multiWindow && zt.insert(e++, new l.MenuItem(ee)),
        zt.insert(e++, new l.MenuItem(L)),
        zt.insert(e++, new l.MenuItem(B)),
        zt.insert(e++, new l.MenuItem(V)),
        zt.insert(e++, new l.MenuItem(R)),
        zt.insert(e++, new l.MenuItem({ type: `separator` })),
        zt.insert(e++, new l.MenuItem(ie)),
        zt.insert(e++, new l.MenuItem({ type: `separator` })),
        zt.insert(e++, new l.MenuItem(H)),
        U.accelerator != null && zt.insert(e++, new l.MenuItem(U)),
        r ||
          (zt.insert(e, new l.MenuItem({ type: `separator` })),
          process.platform !== `win32` &&
            (zt.append(new l.MenuItem(I)), zt.append(new l.MenuItem({ type: `separator` }))),
          zt.append(new l.MenuItem(ae)),
          zt.append(new l.MenuItem({ ...Ct, accelerator: `Ctrl+Q` }))));
    }
    (l.Menu.setApplicationMenu(Lt), UZ(y));
  }

  return buildApplicationMenu;
}

if (typeof module !== `undefined`) {
  module.exports = { createApplicationMenuBuilder };
}
