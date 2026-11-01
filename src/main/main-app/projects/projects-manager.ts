// @ts-nocheck

import { parseLocalProjects } from "../../shared/project-state";

/** Owns local and remote project CRUD, ordering, appearance, membership recovery, and renderer broadcasts. */
export function createProjectsManagerClass(dependencies: Record<string, any>) {
  const {
    runtime: n,
    createLogger,
    LocalProjectCache: p2,
    resolveProjectStorageCapabilities: Xze,
    normalizeStoragePath: Vn,
    getLocalProjects: jr,
    getWorkspaceRootOptions: Fr,
    getCanonicalPathMapSync: vte,
    localHostConfig: ls,
    normalizeRoots: Gn,
    normalizeLabels: Jn,
    canonicalizeRoots: Kn,
    normalizeProjectRoots: Zn,
    normalizeProjectRoot: Xn,
    selectProject: Lr,
    randomUUID,
    path,
    assignUnassignedThreadsBeforeRootsChange: t8e,
    normalizeDesktopRootPaths: Hn,
    now,
  } = dependencies;

function m2(e, t, n) {
  if (e == null) return e;
  let r = new Set(t),
    i = new Set(n),
    a = [...new Set(e)].filter((e) => !r.has(e) || i.has(e)),
    o = new Set(a),
    s = [],
    c = 0;
  for (let e of n ?? [])
    !r.has(e) && !o.has(e) ? s.push(e) : o.has(e) && (s.push(...a.slice(c, c + 1)), (c += 1));
  return (s.push(...a.slice(c)), s);
}
const r8e = n.wf({
    appearance: n.Lo.nullable(),
    initializeDefaultWorkspaceGitRepository: n.gf(),
    name: n.Of(),
    sources: n.hf(n.Of()),
  }),
  h2 = n.wf({ projectId: n.Of(), name: n.Of(), sources: n.hf(n.Of()) }),
  g2 = n.wf({ projectId: n.Of(), name: n.Of() }),
  i8e = n.wf({ appearance: n.Lo.nullable(), hostId: n.Of(), label: n.Of(), remotePath: n.Of() }),
  _2 = n.wf({
    index: n.Cf().int().nonnegative().optional(),
    project: n.wf({ hostId: n.Of(), id: n.Of(), label: n.Of(), remotePath: n.Of() }),
  }),
  a8e = n.wf({ appearance: n.Lo.nullable(), projectId: n.Of() }),
  o8e = class ProjectsManager extends n.Uf {
    globalState;
    threadProjectAssignments;
    host;
    windowManager;
    confirmProjectFolders;
    listThreads;
    readThread;
    getGitOriginUrl;
    createDefaultWorkspaceRoot;
    logger = createLogger(`projects-manager`);
    projectBackend;
    pendingProjectOrderWrite = Promise.resolve();
    createProjectForRoots = async (e, t, n) => {
      let r = await Zn(e, this.host);
      return (
        (n?.allowDuplicateProject
          ? void 0
          : Object.values(this.getLocalProjects()).find(
              (e) => e.rootPaths.length === r.length && e.rootPaths.every((e, t) => e === r[t]),
            )) ?? ((await this.confirmProjectFolders(`local`, r)) ? this.#r(r, t, n) : null)
      );
    };
    constructor(e, t, n, r, i, a, o, s, c, l) {
      (super(),
        (this.globalState = e),
        (this.threadProjectAssignments = t),
        (this.host = n),
        (this.windowManager = r),
        (this.confirmProjectFolders = i),
        (this.listThreads = a),
        (this.readThread = o),
        (this.getGitOriginUrl = s),
        (this.createDefaultWorkspaceRoot = c),
        (this.projectBackend = l ?? new p2(e)));
    }
    async getProjectStorageCapabilities(e) {
      let t = this.#u();
      return Xze(Vn(n.Of().parse(e), t), { allowWslPaths: t });
    }
    getLocalProjects() {
      return jr(this.globalState);
    }
    setProjectBackend(e) {
      this.projectBackend = e;
    }
    getRemoteProjects() {
      return this.globalState.get(n.iu.REMOTE_PROJECTS) ?? [];
    }
    getProjectAppearances() {
      return n.Io(this.globalState.get(n.iu.PROJECT_APPEARANCES));
    }
    async setProjectOrder(e) {
      let t = n.hf(n.Of()).optional().parse(e),
        r = this.globalState.get(n.iu.PROJECT_ORDER);
      await this.#t(() => this.#e(t, r));
    }
    async #e(e, t) {
      let r = m2(e, t, this.globalState.get(n.iu.PROJECT_ORDER));
      if (r != null && this.projectBackend.setProjectOrder != null) {
        let e = this.getLocalProjects(),
          t = (this.globalState.get(n.iu.PROJECT_ORDER) ?? []).filter((t) => e[t] != null),
          i = r.filter((t) => e[t] != null);
        (t.length !== i.length || t.some((e, t) => e !== i[t])) &&
          (await this.projectBackend.setProjectOrder(t, i));
      }
      (this.globalState.set(n.iu.PROJECT_ORDER, m2(e, t, this.globalState.get(n.iu.PROJECT_ORDER))),
        this.#l([n.iu.PROJECT_ORDER]));
    }
    #t(e) {
      let t = this.pendingProjectOrderWrite.then(e);
      return (
        (this.pendingProjectOrderWrite = t.then(
          () => {},
          () => {},
        )),
        t
      );
    }
    #n(e) {
      return e === `local`
        ? Object.values(this.getLocalProjects())
        : this.getRemoteProjects().filter((t) => t.hostId === e);
    }
    getProjectRootPathsForHost(e) {
      return e === `local` ? Fr(this.globalState).roots : this.#c(e).roots;
    }
    getLocalWorkspaceRootOptionsSync() {
      let e = this.#u(),
        { labels: t, roots: n } = Fr(this.globalState),
        r = vte(n, ls, e);
      return {
        ...(Object.keys(r).length === 0 ? {} : { canonicalPathByRoot: r }),
        roots: Gn(n, ls, e),
        labels: Jn(t, ls, e),
      };
    }
    async getWorkspaceRootOptions(e) {
      if (e.id !== `local` && n.Es(e)) return this.#c(e.id);
      let t = e.id === `local` && this.#u(),
        { labels: r, roots: i } = Fr(this.globalState),
        a = Jn(r, e, t),
        o = await Kn(i, e, t);
      return {
        ...(Object.keys(o).length === 0 ? {} : { canonicalPathByRoot: o }),
        roots: Gn(i, e, t),
        labels: a,
      };
    }
    async createOrSelectLocalProjects(e) {
      if (e.length === 0) return [];
      let t = await this.createProjectsForRoots(e),
        r = t[0];
      return r == null
        ? []
        : (Lr(this.globalState, { type: `local`, projectId: r.id }),
          this.#l([n.iu.LOCAL_PROJECTS, n.iu.PROJECT_ORDER, n.iu.SELECTED_PROJECT]),
          this.#s(),
          t);
    }
    createProjectsForRoots = async (e, t) => {
      let n = await Zn(e, this.host),
        r = n.filter((e) => this.#i(e) == null);
      return (await this.confirmProjectFolders(`local`, r))
        ? (await this.assignUnassignedThreadsBeforeProjectRootsChange(r, t),
          (await Promise.all(n.toReversed().map((e) => this.#r([e])))).toReversed())
        : [];
    };
    hasProjectNamed(e) {
      return Object.values(this.getLocalProjects()).some((t) => t.name.trim() === e);
    }
    async createProjectForRoot(e, t) {
      let n = await Xn(e, this.host);
      return (
        this.#i(n) ??
        ((await this.confirmProjectFolders(`local`, [n]))
          ? (await this.assignUnassignedThreadsBeforeProjectRootsChange([n]), this.#r([n], t))
          : null)
      );
    }
    #r(e, t, { allowDuplicateProject: r = !1, appearance: i } = {}) {
      return this.#t(async () => {
        let a = [...new Set(e)].filter((e) => e.trim().length > 0);
        if (a.length === 0) throw Error(`A local project root path is required`);
        let o = this.getLocalProjects(),
          s = r
            ? void 0
            : Object.values(o).find(
                (e) => e.rootPaths.length === a.length && e.rootPaths.every((e, t) => e === a[t]),
              );
        if (s != null)
          return (
            i != null && (await this.projectBackend.updateProject(s.id, { appearance: i })),
            s
          );
        let c = now(),
          l = n.Jo(randomUUID()),
          u = {
            id: l,
            name: t?.trim() || path.basename(a[0] ?? ``) || a[0] || `Project`,
            rootPaths: a,
            createdAt: c,
            updatedAt: c,
          };
        await this.projectBackend.writeProject(`project/create`, u, i);
        let d = (this.globalState.get(n.iu.PROJECT_ORDER) ?? []).filter((e) => e !== l),
          f = this.getLocalProjects();
        try {
          await this.projectBackend.moveProject?.(l, d.find((e) => f[e] != null) ?? null);
        } catch (e) {
          this.logger().warning(`Failed to order newly created app-server project`, {
            safe: {},
            sensitive: { error: e },
          });
        }
        return (
          this.globalState.set(n.iu.PROJECT_ORDER, [
            l,
            ...(this.globalState.get(n.iu.PROJECT_ORDER) ?? []).filter((e) => e !== l),
          ]),
          u
        );
      });
    }
    async createLocal(e) {
      let t = r8e.safeParse(e);
      if (!t.success) throw Error(`Invalid local project create request`);
      let {
          appearance: r,
          initializeDefaultWorkspaceGitRepository: i,
          name: a,
          sources: o,
        } = t.data,
        s = o.length === 0 ? [await this.createDefaultWorkspaceRoot(a, i)] : await Zn(o, this.host);
      if (!(await this.confirmProjectFolders(`local`, s))) return null;
      (o.length > 0 || s.some((e) => this.#i(e) == null)) &&
        (await this.assignUnassignedThreadsBeforeProjectRootsChange(s));
      let c = await this.#r(s, a, { allowDuplicateProject: o.length > 0, appearance: r });
      return (
        Lr(this.globalState, { type: `local`, projectId: c.id }),
        this.#l([
          n.iu.LOCAL_PROJECTS,
          n.iu.PROJECT_ORDER,
          n.iu.PROJECT_APPEARANCES,
          n.iu.SELECTED_PROJECT,
        ]),
        this.#s(),
        { projectId: c.id, rootPaths: c.rootPaths }
      );
    }
    async editLocal(e) {
      let t = h2.safeParse(e);
      if (!t.success) throw Error(`Invalid local project edit request`);
      let { name: n, projectId: r, sources: i } = t.data,
        a = await Zn(i, this.host),
        o = this.getLocalProjects()[r];
      return o == null ||
        !(await this.confirmProjectFolders(
          `local`,
          a.filter((e) => !o.rootPaths.includes(e)),
        ))
        ? !1
        : ((o.rootPaths.length !== a.length || o.rootPaths.some((e, t) => e !== a[t])) &&
            (await this.assignUnassignedThreadsBeforeProjectRootsChange([...o.rootPaths, ...a])),
          await this.projectBackend.updateProject(r, { name: n.trim() || void 0, rootPaths: a }),
          this.#a(),
          this.#s(),
          !0);
    }
    async removeLocal(e) {
      let t = this.getLocalProjects()[e];
      if (t == null) return { previousMemberships: [] };
      await this.assignUnassignedThreadsBeforeProjectRootsChange(t.rootPaths);
      let r = await this.threadProjectAssignments.moveLocalProjectThreadsToProjectless(e);
      (await this.projectBackend.writeProject(`project/delete`, t),
        this.globalState.set(
          n.iu.PROJECT_ORDER,
          this.globalState.get(n.iu.PROJECT_ORDER)?.filter((t) => t !== e),
        ),
        this.globalState.set(
          n.iu.PINNED_PROJECT_IDS,
          this.globalState.get(n.iu.PINNED_PROJECT_IDS)?.filter((t) => t !== e),
        ));
      let i = [n.iu.LOCAL_PROJECTS, n.iu.PROJECT_ORDER, n.iu.PINNED_PROJECT_IDS];
      return (
        this.#l(i),
        this.#s(),
        {
          previousMemberships: r,
          undoExpiresAtMs: this.projectBackend.getProjectDeletionDeadline?.(e),
        }
      );
    }
    async renameLocal(e) {
      let t = g2.safeParse(e);
      if (!t.success) throw Error(`Invalid local project rename request`);
      let { name: n, projectId: r } = t.data,
        i = this.getLocalProjects()[r],
        a = n.trim();
      i != null &&
        a.length !== 0 &&
        a !== i.name &&
        (await this.projectBackend.updateProject(r, { name: a }), this.#a(), this.#s());
    }
    async upsertLocal(e, t) {
      let r = h2.safeParse(e);
      if (!r.success) throw Error(`Invalid local project upsert request`);
      let { name: i, projectId: a, sources: o } = r.data;
      if (this.getLocalProjects()[a] != null) return this.editLocal(r.data);
      let s = await Zn(o, this.host);
      if (t === `sync` && !(await this.confirmProjectFolders(`local`, s))) return !1;
      await this.assignUnassignedThreadsBeforeProjectRootsChange(s);
      let c = now(),
        l = { id: n.Jo(a), name: i.trim(), rootPaths: s, createdAt: c, updatedAt: c };
      return (
        await this.projectBackend.writeProject(`project/create`, l),
        this.#a(),
        this.#s(),
        !0
      );
    }
    async createRemote(e) {
      let t = i8e.safeParse(e);
      if (!t.success) throw Error(`Invalid remote project create request`);
      let { appearance: r, hostId: i, label: a, remotePath: o } = t.data,
        s = n.ya(o),
        c = n.va(s),
        l = () => this.getRemoteProjects().find((e) => e.hostId === i && n.va(e.remotePath) === c);
      if (l() != null) throw Error(`A project already exists for this remote host and path`);
      if (!(await this.confirmProjectFolders(i, [s]))) return null;
      let u = l();
      if (u != null) return u;
      let d = {
        id: n.Jo(randomUUID()),
        hostId: i,
        remotePath: s,
        label: a.trim() || n._a(s),
      };
      return (
        this.globalState.set(n.iu.REMOTE_PROJECTS, [d, ...this.getRemoteProjects()]),
        this.globalState.set(n.iu.PROJECT_ORDER, [
          d.id,
          ...(this.globalState.get(n.iu.PROJECT_ORDER) ?? []).filter((e) => e !== d.id),
        ]),
        r != null &&
          this.globalState.set(
            n.iu.PROJECT_APPEARANCES,
            n.Fo({
              projectAppearances: this.getProjectAppearances(),
              projectId: d.id,
              appearance: r,
            }),
          ),
        this.#l([
          n.iu.REMOTE_PROJECTS,
          n.iu.PROJECT_ORDER,
          ...(r == null ? [] : [n.iu.PROJECT_APPEARANCES]),
        ]),
        this.#s(),
        d
      );
    }
    async editRemote(e) {
      let t = _2.safeParse(e);
      if (!t.success) throw Error(`Invalid remote project edit request`);
      let { project: r } = t.data,
        i = this.getRemoteProjects().find(({ id: e }) => e === r.id);
      if (i == null || i.hostId !== r.hostId)
        throw Error(`Cannot edit an unavailable remote project`);
      (i.remotePath === r.remotePath ||
        (await this.confirmProjectFolders(r.hostId, [r.remotePath]))) &&
        (this.globalState.set(
          n.iu.REMOTE_PROJECTS,
          this.getRemoteProjects().map((e) => (e.id === r.id ? r : e)),
        ),
        this.#o());
    }
    async removeRemote(e) {
      if (!this.getRemoteProjects().some(({ id: t }) => t === e))
        throw Error(`Cannot remove an unavailable remote project`);
      (this.globalState.set(
        n.iu.REMOTE_PROJECTS,
        this.getRemoteProjects().filter(({ id: t }) => t !== e),
      ),
        this.globalState.set(
          n.iu.PROJECT_ORDER,
          this.globalState.get(n.iu.PROJECT_ORDER)?.filter((t) => t !== e),
        ),
        this.globalState.set(
          n.iu.PINNED_PROJECT_IDS,
          this.globalState.get(n.iu.PINNED_PROJECT_IDS)?.filter((t) => t !== e),
        ),
        this.#l([n.iu.REMOTE_PROJECTS, n.iu.PROJECT_ORDER, n.iu.PINNED_PROJECT_IDS]),
        this.#s());
    }
    async renameRemote(e) {
      let t = g2.safeParse(e);
      if (!t.success) throw Error(`Invalid remote project rename request`);
      let { name: r, projectId: i } = t.data,
        a = this.getRemoteProjects().find(({ id: e }) => e === i);
      if (a == null) throw Error(`Cannot rename an unavailable remote project`);
      let o = r.trim() || n._a(a.remotePath);
      o !== a.label && (await this.editRemote({ project: { ...a, label: o } }));
    }
    async upsertRemote(e) {
      let t = _2.safeParse(e);
      if (!t.success) throw Error(`Invalid remote project upsert request`);
      let { index: r, project: i } = t.data,
        a = this.getRemoteProjects().filter(({ id: e }) => e !== i.id);
      (a.splice(Math.min(r ?? 0, a.length), 0, i),
        this.globalState.set(n.iu.REMOTE_PROJECTS, a),
        this.#o());
    }
    async setAppearance(e) {
      let t = a8e.safeParse(e);
      if (!t.success) throw Error(`Invalid project appearance update request`);
      let { appearance: r, projectId: i } = t.data;
      (this.getLocalProjects()[i] == null
        ? this.globalState.set(
            n.iu.PROJECT_APPEARANCES,
            n.Fo({ projectAppearances: this.getProjectAppearances(), projectId: i, appearance: r }),
          )
        : await this.projectBackend.updateProject(i, { appearance: r }),
        this.#l([n.iu.PROJECT_APPEARANCES]));
    }
    async assignUnassignedThreadsBeforeProjectRootsChange(
      e,
      { excludedThreadIds: t = new Set(), matchRootsByCanonicalHostIdentity: n = !1 } = {},
    ) {
      await t8e({
        affectedRootPaths: e,
        excludedThreadIds: t,
        getGitOriginUrl: this.getGitOriginUrl,
        globalState: this.globalState,
        host: this.host,
        listThreads: this.listThreads,
        matchRootsByCanonicalHostIdentity: n,
        readThread: this.readThread,
        threadProjectAssignments: this.threadProjectAssignments,
      });
    }
    getLocalProjectsForRenderer() {
      return Object.fromEntries(
        Object.entries(this.getLocalProjects()).map(([e, t]) => [
          e,
          { ...t, rootPaths: Gn(t.rootPaths, ls, this.#u()) },
        ]),
      );
    }
    getLocalProjectsForDesktopState(e) {
      return Object.fromEntries(
        Object.entries(parseLocalProjects(e)).map(([e, t]) => [
          e,
          { ...t, rootPaths: Hn(t.rootPaths, this.#u()) },
        ]),
      );
    }
    #i(e) {
      return Object.values(this.getLocalProjects()).find(
        (t) => t.rootPaths.length === 1 && t.rootPaths[0] === e,
      );
    }
    #a() {
      this.#l([n.iu.LOCAL_PROJECTS]);
    }
    #o() {
      (this.#l([n.iu.REMOTE_PROJECTS]), this.#s());
    }
    #s() {
      this.windowManager.sendMessageToAllWindows({ type: `workspace-root-options-updated` });
    }
    #c(e) {
      let t = [],
        n = {},
        r = new Set();
      for (let i of this.#n(e)) {
        if (!(`remotePath` in i)) continue;
        let e = i.remotePath.trim();
        if (e.length === 0 || r.has(e)) continue;
        (t.push(e), r.add(e));
        let a = i.label.trim();
        a.length > 0 && (n[e] = a);
      }
      return { roots: t, labels: n };
    }
    #l(e) {
      this.windowManager.sendMessageToAllWindows({ type: `global-state-updated`, keys: e });
    }
    #u() {
      return n.zi(ls);
    }
  };

  return o8e;
}

if (typeof module !== "undefined")
  module.exports = { createProjectsManagerClass };
