// @ts-nocheck

/** Owns desktop notification sound preview/import, action forwarding, focus, and dismissal. */
export function createNotificationsServiceClass(dependencies: Record<string, any>) {
  const {
    runtime: n,
    promisify,
    execFile,
    spawnProcess,
    platform,
    resolveSoundCommand,
    resolveMacBuiltinSound,
    getCustomSoundDirectory,
    path,
    homeDirectory,
    fs,
    createHash,
    electron,
    createLogger,
    createUsingScope,
  } = dependencies;

var Jet = promisify(execFile),
  Yet = n.wf({
    fileType: n.df([`WAVE`, `AIFF`, `AIFC`, `caff`]),
    format: n.df([`lpcm`, `ima4`, `ulaw`, `alaw`]),
    duration: n.if().positive().lt(30),
  }),
  Xet = class NotificationsService extends n.Uf {
    windowManager;
    origin;
    desktopNotificationManager;
    logger = createLogger(`notifications-service`)();
    #e;
    constructor(e, t, n) {
      (super(), (this.windowManager = e), (this.origin = t), (this.desktopNotificationManager = n));
    }
    async previewSound(e) {
      let t = n.Na.sound.schema.safeParse(e);
      if (!t.success) return !1;
      (this.#e?.kill(), (this.#e = void 0));
      let r = t.data;
      if (r === `none`) return !0;
      if (platform !== `darwin`) {
        if (r !== "default" && r !== `classic`) return !1;
        let e = resolveSoundCommand(r, platform);
        return e != null && this.#t(e.command, e.args);
      }
      let i;
      return (
        (i =
          r === "default" || r === `classic`
            ? resolveMacBuiltinSound(r)
            : typeof r == `object`
              ? path.join(getCustomSoundDirectory(homeDirectory()), r.fileName)
              : path.join(`/System/Library/Sounds`, `${r}.aiff`)),
        this.#t(`/usr/bin/afplay`, [i])
      );
    }
    #t(e, t) {
      return new Promise((n) => {
        let r = spawnProcess(e, t, { stdio: `ignore`, windowsHide: !0 });
        this.#e = r;
        let i = () => {
          r.kill();
        };
        (this.origin.once(`destroyed`, i),
          r.once(`error`, () => n(!1)),
          r.once(`close`, (e, t) => {
            (this.origin.removeListener(`destroyed`, i),
              this.#e === r && (this.#e = void 0),
              n(e === 0 || t === `SIGTERM`));
          }));
      });
    }
    async importSound({ title: e }) {
      if (platform !== `darwin`) return { status: `error` };
      let t = this.#i(this.origin);
      if (t == null) return { status: `cancelled` };
      try {
        let n = await electron.dialog.showOpenDialog(t, {
            title: e,
            properties: [`openFile`],
            filters: [{ name: `WAV, AIFF, CAF`, extensions: [`wav`, `aif`, `aiff`, `caf`] }],
          }),
          r = n.filePaths[0];
        if (n.canceled || r == null) return { status: `cancelled` };
        let i = path.extname(r).toLowerCase(),
          a = i === `.aif` ? `.aiff` : i,
          o = await (0, fs.stat)(r);
        if (!o.isFile() || o.size > 10485760 || ![`.wav`, `.aiff`, `.caf`].includes(a))
          return { status: `error` };
        let s = await (0, fs.readFile)(r),
          c = `codex-custom-${createHash(`sha256`).update(s).digest(`hex`)}${a}`,
          u = getCustomSoundDirectory(homeDirectory());
        await (0, fs.mkdir)(u, { recursive: !0 });
        let d = await (0, fs.mkdtemp)(path.join(u, `.codex-import-`));
        try {
          let e = path.join(d, c);
          await (0, fs.writeFile)(e, s);
          let { stdout: t } = await Jet(`/usr/bin/afinfo`, [`-x`, `-r`, e], {
            timeout: 5e3,
            maxBuffer: 1048576,
          });
          if (
            !Yet.safeParse({
              fileType: t.match(/<file_type>'([^']+)'<\/file_type>/)?.[1],
              format: t.match(/<format_type>([^<]+)<\/format_type>/)?.[1],
              duration: t.match(/<duration units="sec">([^<]+)<\/duration>/)?.[1],
            }).success
          )
            return { status: `error` };
          await (0, fs.rename)(e, path.join(u, c));
        } finally {
          await (0, fs.rm)(d, { recursive: !0, force: !0 });
        }
        return { status: `selected`, sound: { fileName: c, name: path.basename(r) } };
      } catch (e) {
        return (
          this.logger.warning(`failed to import notification sound`, {
            safe: {},
            sensitive: { error: e },
          }),
          { status: `error` }
        );
      }
    }
    #n(e) {
      let t = this.#i(e);
      return t == null
        ? null
        : (this.#r(t, { stealFocus: platform === `win32` }), t.webContents);
    }
    #r(e, { stealFocus: t }) {
      (e.isMinimized() && e.restore(),
        t && platform === `win32` && e.setAlwaysOnTop(!0),
        e.show(),
        e.focus(),
        t && platform === `win32` && e.setAlwaysOnTop(!1));
    }
    #i(e) {
      let t = electron.BrowserWindow.fromWebContents(e),
        n = t != null && !t.isDestroyed() ? t : this.windowManager.getPrimaryWindow();
      return !n || n.isDestroyed() ? null : n;
    }
    show(e, t) {
      let n = t?.dup();
      (this.logger.info(`[desktop-notifications] forward show`, {
        safe: { kind: e.kind },
        sensitive: { notificationId: e.id },
      }),
        this.desktopNotificationManager.showNotification(
          e,
          this.origin,
          (e) => {
            try {
              var t = createUsingScope();
              let r = t.u(n?.dup()),
                i = e.actionType === `open` ? this.#n(this.origin) : null;
              return (
                this.logger.info(`[desktop-notifications] emit action`, {
                  safe: { actionType: e.actionType, actionId: e.actionId ?? `none` },
                  sensitive: { notificationId: e.notificationId },
                }),
                t.u(r?.({ id: e.actionId ?? null, type: e.actionType, reply: e.reply ?? null })),
                i
              );
            } catch (e) {
              t.e = e;
            } finally {
              t.d();
            }
          },
          () => n?.[Symbol.dispose](),
        ));
    }
    hide(e) {
      e.notificationId == null
        ? (this.desktopNotificationManager.dismissByConversationId(e.conversationId ?? null),
          e.navigationPath != null &&
            this.desktopNotificationManager.dismissByNavigationPath(e.navigationPath))
        : this.desktopNotificationManager.dismissByNotificationId(e.notificationId);
    }
  };

  return Xet;
}

if (typeof module !== "undefined") {
  module.exports = { createNotificationsServiceClass };
}

