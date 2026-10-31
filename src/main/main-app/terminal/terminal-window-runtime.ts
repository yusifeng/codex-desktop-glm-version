// @ts-nocheck

/** Owns per-renderer terminal RPC, shell discovery/labels, subscriptions, and terminal output filtering. */
export function createTerminalWindowRuntime(dependencies: Record<string, any>) {
  const {
    runtime: n,
    platform,
    environment,
    shellNames,
    findExecutable,
    path,
    pathExists,
    findProgramFilesPath,
    createUsingScope,
  } = dependencies;

var Ott = [`powershell`, `commandPrompt`],
  ktt = [`--login`, `-i`];
function Att() {
  if (platform !== `win32`) return [];
  let e = [...Ott];
  return (v5() != null && e.push(`gitBash`), y5() != null && e.push(`wsl`), e);
}
function jtt(e) {
  if (platform !== `win32`) return [n.Jn()];
  if (e === `powershell`) {
    let e = g5();
    if (e != null) return [e];
  }
  if (e === `commandPrompt`) return [_5()];
  if (e === `gitBash`) {
    let e = v5();
    if (e != null) return [e, ...ktt];
  }
  if (e === `wsl`) {
    let e = y5();
    if (e != null) return [e];
  }
  let t = g5();
  return t == null ? [_5()] : [t];
}
function h5(e) {
  let t = e[0];
  if (t == null || t.length === 0) return `Shell`;
  let n = t.split(/[/\\]/).at(-1)?.toLowerCase();
  if (platform === `win32`) {
    if (n === `wsl` || n === `wsl.exe`) return shellNames.wsl;
    if (n === `pwsh` || n === `pwsh.exe` || n === `powershell` || n === `powershell.exe`)
      return shellNames.powershell;
    if (n === `cmd` || n === `cmd.exe`) return shellNames.commandPrompt;
    if (n === `git-bash.exe` || (n === `bash.exe` && /[\\/]Git[\\/]/i.test(t))) return shellNames.gitBash;
  }
  let r = n?.replace(/\.exe$/i, ``) ?? t;
  return r != null && r.length > 0 ? r : `Shell`;
}
function g5() {
  for (let e of [`pwsh.exe`, `powershell.exe`]) {
    let t = findExecutable(e);
    if (t != null) return t;
  }
  return null;
}
function _5() {
  let e = environment.COMSPEC?.trim();
  return e != null && e.length > 0 ? e : `cmd.exe`;
}
function v5() {
  let e = findExecutable(`git-bash.exe`);
  if (e != null) return e;
  let t = findExecutable(`git.exe`);
  if (t != null) {
    let e = path.dirname(t),
      n = [path.join(e, `bash.exe`), path.join(path.dirname(e), `bin`, `bash.exe`)];
    for (let e of n) if (pathExists(e)) return e;
  }
  return findProgramFilesPath([[`Git`, `bin`, `bash.exe`]]);
}
function y5() {
  return findExecutable(`wsl.exe`);
}
var Mtt = class TerminalWindowService extends n.Uf {
  terminalManager;
  origin;
  handleOriginDestroyed = () => {
    this[Symbol.dispose]();
  };
  listener = null;
  unsubscribeManager = null;
  constructor(e, t) {
    (super(),
      (this.terminalManager = e),
      (this.origin = t),
      t.once(`destroyed`, this.handleOriginDestroyed));
  }
  async attach(e) {
    await this.terminalManager.createOrAttach(this.origin, { ...e, type: `attach` });
  }
  async attachExisting(e) {
    return this.terminalManager.attachExisting(this.origin, e);
  }
  close(e) {
    this.terminalManager.close(this.origin, e);
  }
  async create(e) {
    let { trace: t, ...r } = e,
      i = () => this.terminalManager.createOrAttach(this.origin, { ...r, type: `create` });
    if (t == null) {
      await i();
      return;
    }
    await n.aa(
      {
        attributes: {
          "terminal.host_kind": e.hostId == null || e.hostId === `local` ? `local` : `remote`,
        },
        name: `electron.terminal_create`,
        op: `codex.terminal.create`,
        trace: t,
      },
      i,
    );
  }
  getAvailableShells() {
    return Att();
  }
  async getShellCwd(e, t) {
    return this.terminalManager.getShellCwd(this.origin, e, t);
  }
  getThreadSnapshot(e) {
    return this.terminalManager.getSnapshotForConversationId(e, this.origin.id);
  }
  async transferSessionOwnership(e) {
    return this.terminalManager.transferSessionOwnership(this.origin, e);
  }
  resize(e, t, n, r) {
    this.terminalManager.resize(this.origin, e, t, n, r);
  }
  runAction(e, t, n) {
    this.terminalManager.runAction(this.origin, e, { cwd: t, command: n });
  }
  subscribe(e) {
    (this.unsubscribe(),
      (this.listener = e.dup()),
      this.listener.onRpcBroken(() => this.unsubscribe()),
      (this.unsubscribeManager = this.terminalManager.subscribe(this.origin, (e) => {
        try {
          var t = createUsingScope();
          t.u(this.listener?.(e));
        } catch (e) {
          t.e = e;
        } finally {
          t.d();
        }
      })));
  }
  unsubscribe() {
    (this.unsubscribeManager?.(),
      (this.unsubscribeManager = null),
      this.listener?.[Symbol.dispose](),
      (this.listener = null));
  }
  write(e, t) {
    this.terminalManager.write(this.origin, e, t);
  }
  [Symbol.dispose]() {
    (this.origin.removeListener(`destroyed`, this.handleOriginDestroyed), this.unsubscribe());
  }
};
function Ntt(e) {
  let t = ``;
  for (let n = 0; n < e.length;) {
    if (e[n] !== `\x1B`) {
      ((t += e[n]), (n += 1));
      continue;
    }
    let r = e[n + 1];
    if (r === `[`) {
      let r = n + 2;
      for (; r < e.length;) {
        let t = e[r];
        if (t >= `@` && t <= `~`) break;
        r += 1;
      }
      if (r >= e.length) {
        t += e.slice(n);
        break;
      }
      if (e[r] === `n`) {
        n = r + 1;
        continue;
      }
      ((t += e.slice(n, r + 1)), (n = r + 1));
      continue;
    }
    if (r === `]`) {
      let r = n + 2,
        i = 0,
        a = -1;
      for (; r < e.length;) {
        if (e[r] === `\x07`) {
          ((a = r), (i = 1));
          break;
        }
        if (e.startsWith(`\x1B\\`, r)) {
          ((a = r), (i = 2));
          break;
        }
        r += 1;
      }
      if (a === -1) {
        t += e.slice(n);
        break;
      }
      let o = e.slice(n + 2, a);
      if (/^\d+;\?$/.test(o)) {
        n = a + i;
        continue;
      }
      ((t += e.slice(n, a + i)), (n = a + i));
      continue;
    }
    ((t += e[n]), (n += 1));
  }
  return t;
}

  return {
    TerminalWindowService: Mtt,
    getAvailableShells: Att,
    resolveShellCommand: jtt,
    getShellLabel: h5,
    stripTerminalQueries: Ntt,
  };
}

if (typeof module !== "undefined") {
  module.exports = { createTerminalWindowRuntime };
}

