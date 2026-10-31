// @ts-nocheck

/**
 * Creates the terminal session manager while keeping platform/runtime adapters in the main chunk.
 * The returned class owns all session, pending-create, action, listener, and cleanup state.
 */
export function createTerminalSessionManagerClass(dependencies: Record<string, any>) {
  const { n, v, D, _, Pr, Bn, zn, Ntt, Gtt, jtt, h5, C5, ztt, NQ, loginShellProbeCommand, Vtt, Htt, x5, Utt } = dependencies;
  const terminalSessionKey = (ownerId: string | number, conversationId: string) =>
    `${ownerId}:${conversationId}`;
  return class TerminalSessionManager {
  globalState;
  getIntegratedTerminalShellPreference;
  getWorktreeShellEnvironmentForCwd;
  getHostConfigForHostId;
  getProcessConnectionForHostId;
  createEnvironmentBackend;
  getRestartBlockers() {
    return [
      ...(this.sessions.size > 0 ? [`terminal.session`] : []),
      ...(this.pendingCreates.size > 0 ? [`terminal.pending-create`] : []),
    ];
  }
  sessions = new Map();
  sessionsByWindowConversation = new Map();
  actionRestartPromises = new Map();
  createPromises = new Set();
  pendingCreates = new Map();
  listenersByOwnerId = new Map();
  trackedOrigins = new Set();
  terminalCommand;
  disposed = !1;
  constructor(e, t, n, r, i, a, o) {
    ((this.globalState = e),
      (this.getIntegratedTerminalShellPreference = t),
      (this.getWorktreeShellEnvironmentForCwd = r),
      (this.getHostConfigForHostId = i),
      (this.getProcessConnectionForHostId = a),
      (this.createEnvironmentBackend = o),
      (this.terminalCommand = n ?? null));
  }
  track(e) {
    this.trackedOrigins.has(e.id) ||
      (this.trackedOrigins.add(e.id),
      e.once(`destroyed`, () => {
        (this.trackedOrigins.delete(e.id),
          this.listenersByOwnerId.delete(e.id),
          this.cleanupForOrigin(e.id));
      }));
  }
  subscribe(e, t) {
    this.track(e);
    let n = this.listenersByOwnerId.get(e.id) ?? new Set();
    return (
      n.add(t),
      this.listenersByOwnerId.set(e.id, n),
      () => {
        (n.delete(t), n.size === 0 && this.listenersByOwnerId.delete(e.id));
      }
    );
  }
  async createOrAttach(e, t) {
    let n = this.getExistingSessionId({
      ownerId: e.id,
      allowConversationSessionFallback: t.type === `attach`,
      ...t,
    });
    if (n)
      return this.attach(e, n, {
        nextSessionId: t.sessionId,
        conversationId: t.conversationId,
        conversationTitle: t.conversationTitle,
        hostId: t.hostId,
        environmentId: t.environmentId,
        cwd: t.cwd,
        forceCwdSync: t.forceCwdSync,
        cols: t.cols,
        rows: t.rows,
        preserveOnOwnerDestroy: t.preserveOnOwnerDestroy,
      });
    let r = this.create(e, t);
    this.createPromises.add(r);
    try {
      return await r;
    } finally {
      this.createPromises.delete(r);
    }
  }
  async attachExisting(e, t) {
    let n = this.sessions.get(t.sessionId);
    return n == null ||
      n.conversationId !== t.conversationId ||
      (n.hostId ?? null) !== (t.hostId ?? null) ||
      (t.environmentId != null && n.environmentId !== t.environmentId) ||
      (!n.owner.isDestroyed() && n.ownerId !== e.id)
      ? !1
      : (await this.attach(e, t.sessionId, {
          conversationId: t.conversationId,
          hostId: t.hostId,
          environmentId: n.environmentId,
        })) === t.sessionId;
  }
  write(e, t, n) {
    let r = this.sessions.get(t);
    if (!r) {
      this.sendError(e, t, `Session missing`);
      return;
    }
    if (r.ownerId !== e.id) {
      this.sendError(e, t, `Session owned by another window`);
      return;
    }
    this.performSessionAction({
      session: r,
      action: async () => {
        await r.backend.write(n);
      },
    });
  }
  runAction(e, t, n) {
    let r = this.sessions.get(t);
    if (!r) {
      this.sendError(e, t, `Session missing`);
      return;
    }
    if (r.ownerId !== e.id) {
      this.sendError(e, t, `Session owned by another window`);
      return;
    }
    let i = (this.actionRestartPromises.get(t) ?? Promise.resolve())
      .catch(() => void 0)
      .then(async () => {
        this.sessions.get(t) === r &&
          (await this.performSessionAction({
            session: r,
            action: () => this.restartSessionForAction(r, t, n),
          }));
      });
    (this.actionRestartPromises.set(t, i),
      i.finally(() => {
        this.actionRestartPromises.get(t) === i && this.actionRestartPromises.delete(t);
      }));
  }
  resize(e, t, n, r, i = !1) {
    let a = this.sessions.get(t);
    if (!a) {
      this.sendError(e, t, `Session missing`);
      return;
    }
    if (a.ownerId !== e.id) {
      this.sendError(e, t, `Session owned by another window`);
      return;
    }
    this.resizeSession(a, n, r, i ? `repaint` : `resize`);
  }
  close(e, t) {
    let n = this.sessions.get(t);
    if (!n) {
      this.pendingCreates.get(`${e.id}:${t}`)?.abort();
      return;
    }
    if (n.ownerId !== e.id) {
      this.sendError(e, t, `Session owned by another window`);
      return;
    }
    this.destroySession(n, { code: null, signal: null });
  }
  transferSessionOwnership(
    e,
    {
      nextSourceActiveSessionId: t,
      sessionId: n,
      sourceConversationId: r,
      targetConversationId: i,
    },
  ) {
    let a = this.sessions.get(n),
      o = t == null ? null : this.sessions.get(t);
    return a == null ||
      a.environmentId != null ||
      a.ownerId !== e.id ||
      !a.attached ||
      a.conversationId !== r ||
      r === i ||
      (t != null &&
        (t === n || o == null || o.ownerId !== e.id || !o.attached || o.conversationId !== r))
      ? !1
      : (this.deleteConversationMapping(e.id, String(r), n),
        (a.conversationId = i),
        this.sessionsByWindowConversation.set(terminalSessionKey(e.id, String(i)), n),
        t != null && this.sessionsByWindowConversation.set(terminalSessionKey(e.id, String(r)), t),
        !0);
  }
  async dispose() {
    this.disposed = !0;
    for (let e of this.pendingCreates.values()) e.abort();
    let e = Array.from(this.actionRestartPromises.values());
    await Promise.all([
      ...Array.from(this.sessions.values(), (e) =>
        this.destroySession(e, { code: null, signal: null }),
      ),
      ...this.createPromises,
      ...e,
    ]);
  }
  appendOutput(e, t) {
    let n = this.sessions.get(e);
    n &&
      ((n.buffer = `${n.buffer}${t}`.slice(-16e3)),
      n.attached && this.send(n.owner, { type: `data`, sessionId: n.id, data: t }));
  }
  getSnapshotForConversationId(e, t) {
    let n = this.sessionsByWindowConversation.get(terminalSessionKey(t, e));
    if (!n) return null;
    let r = this.sessions.get(n);
    return r
      ? { cwd: r.cwd, shell: r.shell, buffer: r.buffer, truncated: r.buffer.length >= Vtt }
      : null;
  }
  getShellCwd(e, t, n) {
    let r = this.sessions.get(t);
    return r == null || r.ownerId !== e.id ? null : this.resolveShellCwd(r.shellKind, n);
  }
  async create(e, t) {
    if (this.disposed) return null;
    let r = t.sessionId ?? (0, _.randomUUID)(),
      i = `${e.id}:${r}`,
      a = new AbortController();
    (this.pendingCreates.get(i)?.abort(), this.pendingCreates.set(i, a));
    try {
      let n = await this.createTerminalBackend({
        hostId: t.hostId,
        environmentId: t.environmentId,
        conversationTitle: t.conversationTitle,
        cwd: t.cwd,
        cols: t.cols ?? 80,
        rows: t.rows ?? 24,
        signal: a.signal,
      });
      if (this.disposed || a.signal.aborted || (e.isDestroyed() && !t.preserveOnOwnerDestroy))
        return (await n.backend.dispose({ killProcessTree: !0 }), null);
      let i = {
        id: r,
        backend: n.backend,
        owner: e,
        ownerId: e.id,
        buffer: ``,
        cwd: n.cwd,
        shell: n.shell,
        shellKind: n.shellKind,
        size: { cols: t.cols ?? 80, rows: t.rows ?? 24 },
        attached: !1,
        conversationId: t.conversationId,
        hostId: t.hostId,
        environmentId: t.environmentId,
        conversationTitle: t.conversationTitle,
        preserveOnOwnerDestroy: t.preserveOnOwnerDestroy ?? !1,
      };
      (this.sessions.set(r, i),
        t.conversationId &&
          this.sessionsByWindowConversation.set(terminalSessionKey(e.id, String(t.conversationId)), r),
        n.pendingState.buffer.length > 0 && (i.buffer = n.pendingState.buffer.slice(-16e3)));
      let o = n.initialShellCwd;
      return o != null &&
        !(await this.performSessionAction({
          session: i,
          action: async () => {
            await this.seedShellCwd(i, o);
          },
        }))
        ? null
        : (this.flushInit(i),
          this.sendAttached(i),
          n.pendingState.exit != null && this.destroySession(i, n.pendingState.exit),
          r);
    } catch (t) {
      return (!a.signal.aborted && !e.isDestroyed() && this.sendError(e, r, n.Zo(t)), null);
    } finally {
      this.pendingCreates.get(i) === a && this.pendingCreates.delete(i);
    }
  }
  async attach(e, t, r) {
    let i = this.sessions.get(t);
    if (!i) return (this.sendError(e, t, `Session missing`), null);
    if (
      (i.environmentId != null || r.environmentId != null || r.hostId === `durable`) &&
      (i.hostId !== r.hostId ||
        i.environmentId !== r.environmentId ||
        i.conversationId !== r.conversationId)
    )
      return (this.sendError(e, t, `Terminal target changed. Open a new terminal tab.`), null);
    if (i.owner.isDestroyed() || i.ownerId === e.id) ((i.owner = e), (i.ownerId = e.id));
    else if (i.ownerId !== e.id)
      return (this.sendError(e, t, `Session owned by another window`), null);
    (r.conversationId &&
      ((i.conversationId = r.conversationId),
      this.sessionsByWindowConversation.set(terminalSessionKey(e.id, String(r.conversationId)), i.id)),
      r.hostId !== void 0 && (i.hostId = r.hostId),
      r.conversationTitle !== void 0 && (i.conversationTitle = r.conversationTitle));
    let { cols: a, rows: o } = r;
    if (a != null && o != null && !(await this.resizeSession(i, a, o, `resync`))) return null;
    if (i.environmentId == null && r.forceCwdSync && r.cwd) {
      let e = this.resolveRequestedCwd(r.cwd, r.hostId),
        t = r.hostId == null ? null : (this.getHostConfigForHostId?.(r.hostId) ?? null);
      if (
        ((t != null && n.Es(t)) ||
          i.shellKind !== `posix` ||
          this.resolveLocalCwd(e) !== process.cwd()) &&
        ((i.cwd = e),
        !(await this.performSessionAction({
          session: i,
          action: async () => {
            await this.seedShellCwd(i, e);
          },
        })))
      )
        return null;
    }
    return (
      r.nextSessionId && r.nextSessionId !== i.id && this.rekeySession(i, r.nextSessionId),
      r.preserveOnOwnerDestroy != null && (i.preserveOnOwnerDestroy = r.preserveOnOwnerDestroy),
      this.flushInit(i),
      this.sendAttached(i),
      i.id
    );
  }
  destroySession(e, t) {
    if (this.sessions.get(e.id) !== e) return Promise.resolve();
    (this.sessions.delete(e.id),
      this.actionRestartPromises.delete(e.id),
      e.conversationId &&
        this.deleteConversationMapping(e.ownerId, String(e.conversationId), e.id));
    let r = e.backend.dispose({ killProcessTree: this.disposed }).catch((t) => {
        e.owner.isDestroyed() || this.sendError(e.owner, e.id, n.Zo(t));
      }),
      i = {
        type: `exit`,
        sessionId: e.id,
        code: t?.code ?? null,
        signal: t?.signal ?? null,
        error: t?.error,
      };
    return (e.owner.isDestroyed() || this.send(e.owner, i), r);
  }
  async restartSessionForAction(e, t, n) {
    let r = e.backend;
    if (
      ((e.backend = Utt),
      (e.attached = !1),
      await r.dispose({ killProcessTree: !0 }),
      this.sessions.get(t) !== e)
    )
      return;
    let i = await this.createTerminalBackend({
      hostId: e.hostId,
      environmentId: e.environmentId,
      conversationTitle: e.conversationTitle,
      cwd: n.cwd,
      cols: e.size.cols,
      rows: e.size.rows,
    });
    if (this.sessions.get(t) !== e) {
      await i.backend.dispose({ killProcessTree: this.disposed });
      return;
    }
    if (
      ((e.backend = i.backend),
      (e.cwd = i.cwd),
      (e.shell = i.shell),
      (e.shellKind = i.shellKind),
      (e.buffer = i.pendingState.buffer.slice(-16e3)),
      this.flushInit(e, !0),
      this.sendAttached(e),
      i.pendingState.exit != null)
    ) {
      this.destroySession(e, i.pendingState.exit);
      return;
    }
    await e.backend.write(Gtt(e.shellKind, this.resolveShellCwd(e.shellKind, n.cwd), n.command));
  }
  async performSessionAction(e) {
    try {
      return (await e.action(), !0);
    } catch (t) {
      return (
        this.sessions.get(e.session.id) === e.session &&
          this.destroySession(e.session, { code: null, signal: null, error: n.Zo(t) }),
        !1
      );
    }
  }
  resizeSession(e, t, n, r) {
    let i = e.size.cols === t && e.size.rows === n;
    if (r === `resize` && i) return Promise.resolve(!0);
    e.size = { cols: t, rows: n };
    let a = (e.resizeChain ?? Promise.resolve(!0)).then((a) =>
      !a || this.sessions.get(e.id) !== e
        ? !1
        : this.performSessionAction({
            session: e,
            action: async () => {
              (r === `repaint` &&
                i &&
                (e.size.cols !== t ||
                  e.size.rows !== n ||
                  (await e.backend.resize(t === 1 ? 2 : t - 1, n),
                  await (0, D.setTimeout)(Htt),
                  this.sessions.get(e.id) !== e || e.size.cols !== t || e.size.rows !== n))) ||
                (await e.backend.resize(t, n));
            },
          }),
    );
    return ((e.resizeChain = a), a);
  }
  flushInit(e, t = !1) {
    if (t || e.buffer.length > 0) {
      let t = e.buffer.length > 0 ? Ntt(e.buffer) : ``;
      this.send(e.owner, { type: `init-log`, sessionId: e.id, log: t });
    }
    e.attached = !0;
  }
  sendAttached(e) {
    this.send(e.owner, { type: `attached`, sessionId: e.id, cwd: e.cwd, shell: e.shell });
  }
  send(e, t) {
    for (let n of this.listenersByOwnerId.get(e.id) ?? []) n(t);
  }
  sendError(e, t, n) {
    this.send(e, { type: `error`, sessionId: t, message: n });
  }
  resolveRequestedCwd(e, t) {
    if (e) return e;
    let r = n.Wo(Pr(this.globalState)?.rootPaths);
    if (r) return r;
    if (t != null) {
      let e = this.getHostConfigForHostId?.(t) ?? null;
      if (e?.home_dir != null && e.home_dir.length > 0) return e.home_dir;
    }
    return process.cwd();
  }
  resolveLocalCwd(e) {
    let t = Bn(e);
    return (0, v.existsSync)(t) ? t : (0, v.existsSync)(e) ? e : process.cwd();
  }
  resolveShellCwd(e, t) {
    if (e === `wsl`) return zn(t, !0);
    if (e === `posix`) return t;
    let n = Bn(t);
    return (0, v.existsSync)(n) ? n : t;
  }
  async seedShellCwd(e, t) {
    await e.backend.write(`cd ${n.$n(t)}\n`);
  }
  getExistingSessionId(e) {
    if (e.sessionId && this.sessions.has(e.sessionId)) return e.sessionId;
    if (e.allowConversationSessionFallback && e.conversationId) {
      let t = this.sessionsByWindowConversation.get(terminalSessionKey(e.ownerId, String(e.conversationId)));
      if (t) return t;
    }
  }
  cleanupForOrigin(e) {
    for (let t of Array.from(this.sessions.values()))
      if (t.ownerId === e) {
        if (t.preserveOnOwnerDestroy) {
          t.attached = !1;
          continue;
        }
        this.destroySession(t, { code: null, signal: null });
      }
  }
  rekeySession(e, t) {
    this.sessions.get(e.id) === e &&
      (this.sessions.delete(e.id),
      (e.id = t),
      this.sessions.set(t, e),
      e.conversationId &&
        this.sessionsByWindowConversation.set(terminalSessionKey(e.ownerId, String(e.conversationId)), t));
  }
  deleteConversationMapping(e, t, n) {
    let r = terminalSessionKey(e, t);
    this.sessionsByWindowConversation.get(r) === n && this.sessionsByWindowConversation.delete(r);
  }
  resolveTerminalCommand(e) {
    let t = null;
    return (
      e != null && (t = this.getHostConfigForHostId?.(e)?.terminal_command ?? null),
      t && t.length > 0
        ? t
        : this.terminalCommand && this.terminalCommand.length > 0
          ? this.terminalCommand
          : jtt(this.getIntegratedTerminalShellPreference() ?? null)
    );
  }
  async buildTerminalEnv(e, t, r) {
    let i = { ...process.env };
    if ((t != null && (i.CODEX_APP_TITLE = t), this.isLocalTerminalSession(r))) {
      let t = await this.getWorktreeShellEnvironmentForCwd(e);
      if (t != null) {
        for (let e of t.exclude) delete i[e];
        Object.assign(i, t.set);
      }
    }
    return (
      process.platform !== `win32` && ((i.TERM = x5), delete i.TERMINFO, delete i.TERMINFO_DIRS),
      n.Bi(i)
    );
  }
  isLocalTerminalSession(e) {
    return e == null || this.getHostConfigForHostId?.(e)?.kind === `local`;
  }
  buildRemoteProcessEnv() {
    return { TERM: x5, TERMINFO: null, TERMINFO_DIRS: null };
  }
  async createTerminalBackend(e) {
    let { hostId: t } = e,
      r = null,
      i = { buffer: ``, exit: null },
      a = () => (r == null ? null : this.getSessionForBackend(r)),
      o = {
        onData: (e) => {
          let t = a();
          if (t == null) {
            i.buffer = `${i.buffer}${e}`.slice(-16e3);
            return;
          }
          this.appendOutput(t.id, e);
        },
        onExit: (e) => {
          let t = a();
          if (t == null) {
            i.exit = e;
            return;
          }
          this.destroySession(t, e);
        },
      };
    if (t === `durable`) {
      if (e.environmentId == null || this.createEnvironmentBackend == null)
        throw Error(`The task's terminal environment is unavailable`);
      let t = await this.createEnvironmentBackend({
        environmentId: e.environmentId,
        cwd: e.cwd,
        cols: e.cols,
        rows: e.rows,
        callbacks: o,
        signal: e.signal,
      });
      return ((r = t.backend), { ...t, shellKind: `posix`, pendingState: i });
    }
    let s = this.resolveRequestedCwd(e.cwd, t),
      c = t == null ? null : (this.getHostConfigForHostId?.(t) ?? null),
      l = await (t != null && c && n.Es(c)
        ? this.createRemoteTerminalBackend({
            hostId: t,
            requestedCwd: s,
            cols: e.cols,
            rows: e.rows,
            callbacks: o,
          })
        : this.createLocalTerminalBackend({
            hostId: e.hostId,
            conversationTitle: e.conversationTitle,
            requestedCwd: s,
            cols: e.cols,
            rows: e.rows,
            callbacks: o,
          }));
    return ((r = l.backend), { ...l, pendingState: i });
  }
  getSessionForBackend(e) {
    for (let t of this.sessions.values()) if (t.backend === e) return t;
    return null;
  }
  async createLocalTerminalBackend(e) {
    let t = this.resolveLocalCwd(e.requestedCwd),
      r = this.resolveTerminalCommand(e.hostId),
      i = C5(r) === `wsl` && r.length === 1 ? (n.Hi(e.requestedCwd) ?? n.Hi(t)) : null;
    return {
      backend: ztt.create({
        command: i == null ? r : [...r, `-d`, i, `--cd`, n.Vi(e.requestedCwd)],
        cwd: t,
        env: await this.buildTerminalEnv(t, e.conversationTitle, e.hostId),
        cols: e.cols,
        rows: e.rows,
        callbacks: e.callbacks,
      }),
      shell: h5(r),
      shellKind: C5(r),
      cwd: e.requestedCwd,
      initialShellCwd:
        i == null && e.requestedCwd !== t && t === process.cwd() ? e.requestedCwd : void 0,
      pendingState: { buffer: ``, exit: null },
    };
  }
  createRemoteTerminalBackend(e) {
    let t = this.getProcessConnectionForHostId?.(e.hostId) ?? null,
      n = loginShellProbeCommand(),
      r = null;
    return (
      (r = new NQ(
        t?.startProcessSession({
          command: n,
          tty: !0,
          size: { cols: e.cols, rows: e.rows },
          streamStdoutStderr: !0,
          outputBytesCap: null,
          timeoutMs: null,
          cwd: e.requestedCwd,
          env: this.buildRemoteProcessEnv(),
          onStdoutDelta: (e) => {
            r?.handleOutputDelta(e);
          },
          onStderrDelta: (e) => {
            r?.handleOutputDelta(e);
          },
        }) ?? Promise.reject(Error(`Remote process connection is unavailable`)),
        e.callbacks,
      )),
      {
        backend: r,
        shell: h5(n),
        shellKind: `posix`,
        cwd: e.requestedCwd,
        pendingState: { buffer: ``, exit: null },
      }
    );
  }
  };
}

if (typeof module !== "undefined") {
  module.exports = { createTerminalSessionManagerClass };
}
