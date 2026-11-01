import type { Hash } from "node:crypto";
import type path from "node:path";

import { parseLocalProjects as parseStoredLocalProjects } from "../../shared/project-state";

export interface GlobalStateMigrationStore {
  get(key: unknown): any;
  getStored(key: unknown): any;
  set(key: unknown, value: unknown): void;
  delete(key: unknown): void;
  flushOrThrow(): Promise<void>;
}

export interface LocalProject {
  id: string;
  name: string;
  rootPaths: string[];
  createdAt: number;
  updatedAt: number;
}

export interface RemoteProject {
  id: string;
  hostId: string;
  label: string;
  remotePath: string;
}

export type SelectedProject =
  | { type: "local"; projectId: string }
  | { type: "remote"; projectId: string };

export interface LocalDataMigration {
  id: string;
  runAsync(store: GlobalStateMigrationStore): Promise<void>;
}

interface TaggedLogger {
  info(message: string, details: { safe: Record<string, unknown>; sensitive: Record<string, unknown> }): void;
  warning(message: string, details: { safe: Record<string, unknown>; sensitive: Record<string, unknown> }): void;
}

export interface ProjectMigrationDependencies {
  runtime: any;
  createHash(algorithm: string): Hash;
  randomUUID(): string;
  path: typeof path;
  uniqueBy<T>(items: T[], key: (item: T) => unknown): T[];
  createLogger(tag: string): () => TaggedLogger;
  readSelectedProject(store: GlobalStateMigrationStore): SelectedProject | undefined;
  now?: () => number;
}

const COMPLETED_MIGRATIONS_KEY = "electron-completed-local-data-migration-ids";
const LEGACY_BROWSER_DOWNLOAD_HISTORY_KEY = "electron-browser-download-history";

function record(value: unknown): Record<string, any> | null {
  return value != null && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, any>
    : null;
}

function stringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((entry): entry is string => typeof entry === "string") : [];
}

function optionalStringArray(value: unknown): string[] | null {
  return value == null ? null : Array.isArray(value)
    ? value.filter((entry): entry is string => typeof entry === "string")
    : null;
}

function stringRecord(value: unknown): Record<string, string> {
  let source = record(value);
  if (source == null) return {};
  return Object.fromEntries(
    Object.entries(source).filter((entry): entry is [string, string] => typeof entry[1] === "string"),
  );
}

function validLocalProject(value: unknown): value is Omit<LocalProject, "id" | "rootPaths"> & { rootPaths?: string[] } {
  let candidate = record(value);
  return candidate != null &&
    typeof candidate.name === "string" &&
    (candidate.rootPaths === undefined || stringArray(candidate.rootPaths).length === candidate.rootPaths.length) &&
    typeof candidate.createdAt === "number" &&
    typeof candidate.updatedAt === "number";
}

export function createProjectLocalDataMigrationRuntime(dependencies: ProjectMigrationDependencies) {
  const {
    runtime,
    createHash,
    randomUUID,
    path,
    uniqueBy,
    createLogger,
    readSelectedProject,
    now = Date.now,
  } = dependencies;
  const stateKeys = runtime.iu;
  const normalizeProjectId = runtime.Jo as (id: string) => string;
  const normalizeWritableRoots = runtime.No as (value: unknown) => Record<string, Array<{ path: string }>>;
  const normalizeProjectAppearances = runtime.Io as (value: unknown) => Record<string, unknown>;
  const normalizeProjectFiles = runtime.Po as (value: unknown) => Record<string, Array<{ path: string }>>;
  const normalizeSidebarProjectOrders = runtime.Ca as (value: unknown) => Record<string, any>;
  const normalizeThreadAssignments = runtime.ca as (value: unknown) => Record<string, any>;
  const normalizeLocalProjects = parseStoredLocalProjects as (value: unknown) => Record<string, LocalProject>;
  const commonRootPath = runtime.Wo as (paths: string[]) => string | null;
  const insertLocalProject = runtime.Go as (input: { localProjects: Record<string, LocalProject>; projectId: string; project: LocalProject }) => Record<string, LocalProject>;
  const migrateAutomationCwds = runtime.Ir as (map: (cwd: string) => Promise<unknown>) => Promise<number>;
  const remapAutomationProjectTargets = runtime.Rr as (map: (projectId: string) => string) => number;
  const isProjectPath = runtime.vl as (cwd: string) => boolean;
  const toProjectPath = runtime.Tl as (cwd: string) => string;
  const comparablePath = runtime._l as (cwd: string) => string;
  const automationLogger = createLogger("automation-project-migration");
  const remoteLogger = createLogger("remote-project-migration");

  function stableHash(value: string): string {
    return createHash("sha256").update(value).digest("hex").slice(0, 32);
  }

  function localProjectId(rootPath: string): string {
    return normalizeProjectId(`local-${stableHash(rootPath)}`);
  }

  function localSelectionId(projectIds: string[]): string {
    return normalizeProjectId(`local-selection-${stableHash(JSON.stringify(projectIds))}`);
  }

  function defaultProjectName(rootPaths: string[]): string {
    let root = commonRootPath(rootPaths);
    return root == null ? "Project" : path.basename(root) || root;
  }

  function isAbsolutePath(value: string): boolean {
    return path.isAbsolute(value) || /^[a-zA-Z]:[\\/]/.test(value) || value.startsWith("\\\\");
  }

  function projectRootPaths(
    projectId: string,
    writableRoots: Record<string, Array<{ path: string }>>,
  ): string[] {
    return Object.hasOwn(writableRoots, projectId)
      ? writableRoots[projectId]?.map((entry) => entry.path) ?? []
      : isAbsolutePath(projectId) ? [projectId] : [];
  }

  function parseLocalProjects(
    value: unknown,
    writableRoots: Record<string, Array<{ path: string }>>,
  ): Record<string, LocalProject> {
    let source = record(value);
    if (source == null) return {};
    let result: Record<string, LocalProject> = {};
    for (let [projectId, rawProject] of Object.entries(source)) {
      if (!validLocalProject(rawProject)) continue;
      result[projectId] = {
        id: normalizeProjectId(projectId),
        name: rawProject.name,
        rootPaths: rawProject.rootPaths ?? projectRootPaths(projectId, writableRoots),
        createdAt: rawProject.createdAt,
        updatedAt: rawProject.updatedAt,
      };
    }
    return result;
  }

  function canonicalizePathProjectIds(localProjects: Record<string, LocalProject>): Map<string, string> {
    let replacements = new Map<string, string>();
    for (let [projectId, project] of Object.entries(localProjects)) {
      if (!isAbsolutePath(projectId)) continue;
      let canonicalId = localProjectId(projectId);
      replacements.set(projectId, canonicalId);
      localProjects[canonicalId] ??= { ...project, id: canonicalId };
      delete localProjects[projectId];
    }
    return replacements;
  }

  function parseRemoteProjectIds(value: unknown): string[] {
    return Array.isArray(value)
      ? value.flatMap((entry) => {
          let candidate = record(entry);
          return typeof candidate?.id === "string" ? [candidate.id] : [];
        })
      : [];
  }

  function remoteSelfMappedRoots(store: GlobalStateMigrationStore): Set<string> {
    let byHost = record(store.getStored(stateKeys.REMOTE_CWDS_BY_HOST_AND_WORKSPACE));
    let roots = new Set<string>();
    if (byHost == null) return roots;
    for (let rawHostMappings of Object.values(byHost)) {
      let hostMappings = record(rawHostMappings);
      if (hostMappings == null) continue;
      for (let [workspaceRoot, cwd] of Object.entries(hostMappings))
        if (typeof cwd === "string" && workspaceRoot === cwd) roots.add(workspaceRoot);
    }
    return roots;
  }

  function selectedProject(
    store: GlobalStateMigrationStore,
    localProjects: Record<string, LocalProject>,
    remapId: (id: string) => string,
  ): SelectedProject | undefined {
    let candidate = record(store.getStored(stateKeys.SELECTED_PROJECT));
    if ((candidate?.type !== "local" && candidate?.type !== "remote") || typeof candidate.projectId !== "string")
      return undefined;
    if (candidate.type === "local") {
      let projectId = normalizeProjectId(remapId(candidate.projectId));
      return localProjects[projectId] == null ? undefined : { type: "local", projectId };
    }
    return parseRemoteProjectIds(store.getStored(stateKeys.REMOTE_PROJECTS)).includes(candidate.projectId)
      ? { type: "remote", projectId: normalizeProjectId(candidate.projectId) }
      : undefined;
  }

  function fallbackSelection({
    activeLocalProjectIds,
    activeRemoteProjectId,
    localProjects,
    remoteProjectIds,
    timestamp,
  }: {
    activeLocalProjectIds: string[];
    activeRemoteProjectId?: string;
    localProjects: Record<string, LocalProject>;
    remoteProjectIds: Set<string>;
    timestamp: number;
  }): SelectedProject | undefined {
    if (activeRemoteProjectId != null && remoteProjectIds.has(activeRemoteProjectId))
      return { type: "remote", projectId: normalizeProjectId(activeRemoteProjectId) };
    let projectIds = [...new Set(activeLocalProjectIds)];
    if (projectIds.length === 0) return undefined;
    if (projectIds.length === 1) return { type: "local", projectId: projectIds[0] };
    let roots = [...new Set(projectIds.flatMap((projectId) => localProjects[projectId]?.rootPaths ?? []))];
    let projectId = localSelectionId(projectIds);
    let existing = localProjects[projectId];
    if (existing == null) {
      localProjects[projectId] = {
        id: projectId,
        name: defaultProjectName(roots),
        rootPaths: roots,
        createdAt: timestamp,
        updatedAt: timestamp,
      };
    } else if (!sameStrings(existing.rootPaths, roots)) {
      localProjects[projectId] = {
        ...existing,
        name: existing.name === defaultProjectName(existing.rootPaths)
          ? defaultProjectName(roots)
          : existing.name,
        rootPaths: roots,
        updatedAt: timestamp,
      };
    }
    return { type: "local", projectId };
  }

  function remapObjectKeys(
    store: GlobalStateMigrationStore,
    key: unknown,
    normalize: (value: unknown) => Record<string, any>,
    remapId: (id: string) => string,
  ): void {
    let value = store.getStored(key);
    if (value == null) return;
    let normalized = normalize(value);
    store.set(key, normalize(Object.fromEntries(
      Object.entries(normalized).map(([projectId, entry]) => [remapId(projectId), entry]),
    )));
  }

  function remapProjectMetadata(
    store: GlobalStateMigrationStore,
    remapId: (id: string) => string,
  ): void {
    let order = optionalStringArray(store.getStored(stateKeys.PROJECT_ORDER));
    if (order != null) store.set(stateKeys.PROJECT_ORDER, [...new Set(order.map(remapId))]);
    let pinned = optionalStringArray(store.getStored(stateKeys.PINNED_PROJECT_IDS));
    if (pinned != null) store.set(stateKeys.PINNED_PROJECT_IDS, [...new Set(pinned.map(remapId))]);
    remapObjectKeys(store, stateKeys.PROJECT_APPEARANCES, normalizeProjectAppearances, remapId);
    remapObjectKeys(store, stateKeys.PROJECT_FILES, normalizeProjectFiles, remapId);
    remapObjectKeys(store, stateKeys.SIDEBAR_PROJECT_THREAD_ORDERS, normalizeSidebarProjectOrders, remapId);
    let rawAssignments = store.getStored(stateKeys.THREAD_PROJECT_ASSIGNMENTS);
    if (rawAssignments == null) return;
    let assignments = normalizeThreadAssignments(rawAssignments);
    store.set(stateKeys.THREAD_PROJECT_ASSIGNMENTS, Object.fromEntries(
      Object.entries(assignments).map(([threadId, assignment]) => [
        threadId,
        assignment.projectKind === "local"
          ? { ...assignment, projectId: remapId(assignment.projectId) }
          : assignment,
      ]),
    ));
  }

  function migrateLegacyLocalProjects(store: GlobalStateMigrationStore): void {
    let timestamp = now();
    let writableRoots = normalizeWritableRoots(store.getStored(stateKeys.PROJECT_WRITABLE_ROOTS));
    let localProjects = parseLocalProjects(store.getStored(stateKeys.LOCAL_PROJECTS), writableRoots);
    let remoteRoots = remoteSelfMappedRoots(store);
    let workspaceRoots = stringArray(store.getStored(stateKeys.WORKSPACE_ROOT_OPTIONS))
      .filter((root) => !remoteRoots.has(root));
    let labels = stringRecord(store.getStored(stateKeys.WORKSPACE_ROOT_LABELS));
    let pathProjectIds = canonicalizePathProjectIds(localProjects);
    let ensureProject = (rootPath: string, offset: number): string => {
      let projectId = localProjectId(rootPath);
      pathProjectIds.set(rootPath, projectId);
      let roots = projectRootPaths(rootPath, writableRoots);
      let name = labels[rootPath]?.trim() || path.basename(rootPath) || rootPath;
      let existing = localProjects[projectId];
      localProjects[projectId] = existing == null
        ? { id: projectId, name, rootPaths: roots, createdAt: timestamp - offset, updatedAt: timestamp - offset }
        : { ...existing, name, rootPaths: roots };
      return projectId;
    };
    workspaceRoots.forEach((root, index) => ensureProject(root, index));
    let activeLocalIds = stringArray(store.getStored(stateKeys.ACTIVE_WORKSPACE_ROOTS))
      .filter((root) => !remoteRoots.has(root))
      .map((root, index) => ensureProject(root, workspaceRoots.length + index));
    let activeRemoteProjectId = typeof store.getStored(stateKeys.ACTIVE_REMOTE_PROJECT_ID) === "string"
      ? store.getStored(stateKeys.ACTIVE_REMOTE_PROJECT_ID) as string
      : undefined;
    let fallback = fallbackSelection({
      activeLocalProjectIds: activeLocalIds,
      activeRemoteProjectId,
      localProjects,
      remoteProjectIds: new Set(parseRemoteProjectIds(store.getStored(stateKeys.REMOTE_PROJECTS))),
      timestamp,
    });
    let remapId = (id: string) => pathProjectIds.get(id) ?? id;
    let current = selectedProject(store, localProjects, remapId);
    store.set(stateKeys.LOCAL_PROJECTS, localProjects);
    store.set(stateKeys.SELECTED_PROJECT, current ?? fallback);
    remapProjectMetadata(store, remapId);
  }

  function sameStrings(left: string[], right: string[]): boolean {
    return left.length === right.length && left.every((value, index) => value === right[index]);
  }

  function parseAutomationLocalProjects(
    value: unknown,
    writableRoots: Record<string, Array<{ path: string }>>,
  ): Record<string, LocalProject> {
    let source = record(value) ?? {};
    let entries = Object.entries(source);
    if (entries.some(([, rawProject]) => !validLocalProject(rawProject))) return {};
    return Object.fromEntries(entries.map(([projectId, rawProject]) => {
      let project = rawProject as Omit<LocalProject, "id" | "rootPaths"> & { rootPaths?: string[] };
      return [projectId, {
        id: normalizeProjectId(projectId),
        name: project.name,
        rootPaths: project.rootPaths ?? writableRoots[projectId]?.map((entry) => entry.path) ?? (isProjectPath(projectId) ? [projectId] : []),
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
      } satisfies LocalProject];
    }));
  }

  function findProjectForCwd(
    cwd: string,
    legacyProjectIds: string[],
    localProjects: Record<string, LocalProject>,
  ): string | null {
    let normalizedCwd = comparablePath(cwd);
    return Object.keys(localProjects).find((projectId) => {
      let roots = localProjects[projectId]?.rootPaths ?? [];
      return roots.length === 1 && roots[0] != null && comparablePath(roots[0]) === normalizedCwd;
    }) ?? legacyProjectIds.find((projectId) => comparablePath(projectId) === normalizedCwd) ?? null;
  }

  async function migrateAutomationProjectTargets(store: GlobalStateMigrationStore): Promise<number> {
    let writableRoots = normalizeWritableRoots(store.getStored(stateKeys.PROJECT_WRITABLE_ROOTS));
    let localProjects = parseAutomationLocalProjects(store.getStored(stateKeys.LOCAL_PROJECTS), writableRoots);
    let projectOrder = store.get(stateKeys.PROJECT_ORDER) ?? [];
    let legacyProjectIds = stringArray(store.getStored(stateKeys.WORKSPACE_ROOT_OPTIONS));
    let createdProjectCount = 0;
    let migratedAutomationCount = await migrateAutomationCwds(async (cwd) => {
      if (cwd === "~") return { type: "projectless" };
      if (!isProjectPath(cwd)) {
        automationLogger().warning("Skipping automation cwd that cannot become a project", {
          safe: {},
          sensitive: { cwd },
        });
        return null;
      }
      let existingProjectId = findProjectForCwd(cwd, legacyProjectIds, localProjects);
      if (existingProjectId != null) return { type: "project", projectId: existingProjectId };
      let projectId = normalizeProjectId(randomUUID());
      let timestamp = now();
      localProjects = insertLocalProject({
        localProjects,
        projectId,
        project: {
          id: projectId,
          name: path.posix.basename(toProjectPath(cwd)) || cwd,
          rootPaths: [cwd],
          createdAt: timestamp,
          updatedAt: timestamp,
        },
      });
      projectOrder = [...projectOrder, projectId];
      store.set(stateKeys.LOCAL_PROJECTS, localProjects);
      store.set(stateKeys.PROJECT_ORDER, projectOrder);
      await store.flushOrThrow();
      createdProjectCount += 1;
      return { type: "project", projectId };
    });
    if (migratedAutomationCount > 0 || createdProjectCount > 0) {
      automationLogger().info("Migrated automations to project targets", {
        safe: { createdProjectCount, migratedAutomationCount },
        sensitive: {},
      });
    }
    return migratedAutomationCount;
  }

  function remapLegacyAutomationProjectTargets(store: GlobalStateMigrationStore): number {
    let localProjectIds = new Set(Object.keys(store.getStored(stateKeys.LOCAL_PROJECTS) ?? {}));
    let remapped = remapAutomationProjectTargets((projectId) => {
      if (!isProjectPath(projectId)) return projectId;
      let canonicalId = localProjectId(projectId);
      return localProjectIds.has(canonicalId) ? canonicalId : projectId;
    });
    if (remapped > 0) {
      automationLogger().info("Remapped legacy automation project targets", {
        safe: { remappedAutomationCount: remapped },
        sensitive: {},
      });
    }
    return remapped;
  }

  function mergeRepairedProjectMetadata(
    store: GlobalStateMigrationStore,
    replacements: Map<string, string>,
  ): void {
    let appearances = { ...store.getStored(stateKeys.PROJECT_APPEARANCES) };
    let files = { ...store.getStored(stateKeys.PROJECT_FILES) };
    let sidebarOrders = normalizeSidebarProjectOrders(store.getStored(stateKeys.SIDEBAR_PROJECT_THREAD_ORDERS));
    for (let [id, value] of Object.entries(appearances))
      if (normalizeProjectAppearances({ [id]: value })[id] == null) delete appearances[id];
    for (let [id, value] of Object.entries(files))
      if (normalizeProjectFiles({ [id]: value })[id] == null) delete files[id];
    let appearancesChanged = false;
    let filesChanged = false;
    let sidebarChanged = false;
    for (let [canonicalId, legacyId] of replacements) {
      let appearance = appearances[canonicalId];
      if (appearance != null) {
        appearances[legacyId] = appearance;
        delete appearances[canonicalId];
        appearancesChanged = true;
      }
      let canonicalFiles = files[canonicalId];
      if (canonicalFiles != null) {
        files[legacyId] = uniqueBy(
          [...canonicalFiles, ...(files[legacyId] ?? [])],
          (entry) => comparablePath(entry.path),
        );
        delete files[canonicalId];
        filesChanged = true;
      }
      let canonicalOrder = sidebarOrders[canonicalId];
      if (canonicalOrder != null) {
        let legacyOrder = sidebarOrders[legacyId];
        sidebarOrders[legacyId] = {
          threadIds: [...new Set([...canonicalOrder.threadIds, ...(legacyOrder?.threadIds ?? [])])],
          sortKey: canonicalOrder.sortKey ?? legacyOrder?.sortKey,
        };
        delete sidebarOrders[canonicalId];
        sidebarChanged = true;
      }
    }
    if (appearancesChanged) store.set(stateKeys.PROJECT_APPEARANCES, appearances);
    if (filesChanged) store.set(stateKeys.PROJECT_FILES, files);
    if (sidebarChanged) store.set(stateKeys.SIDEBAR_PROJECT_THREAD_ORDERS, sidebarOrders);
  }

  function repairMetadataLocalProjects(store: GlobalStateMigrationStore): number {
    let localProjects = normalizeLocalProjects(store.getStored(stateKeys.LOCAL_PROJECTS));
    let replacements = new Map<string, string>();
    for (let [legacyId, legacyProject] of Object.entries(localProjects)) {
      let canonicalId = localProjectId(legacyId);
      let canonicalProject = localProjects[canonicalId];
      if (canonicalProject?.name !== legacyId) continue;
      replacements.set(canonicalId, legacyId);
      localProjects[legacyId] = {
        ...legacyProject,
        rootPaths: canonicalProject.rootPaths.length > 0 ? canonicalProject.rootPaths : legacyProject.rootPaths,
        updatedAt: Math.max(legacyProject.updatedAt, canonicalProject.updatedAt),
      };
      delete localProjects[canonicalId];
    }
    if (replacements.size === 0) return 0;
    let remapId = (id: string) => replacements.get(id) ?? id;
    remapAutomationProjectTargets(remapId);
    store.set(stateKeys.LOCAL_PROJECTS, localProjects);
    for (let key of [stateKeys.PROJECT_ORDER, stateKeys.PINNED_PROJECT_IDS]) {
      let ids = optionalStringArray(store.getStored(key));
      if (ids != null) store.set(key, [...new Set(ids.map(remapId))]);
    }
    let current = readSelectedProject(store);
    if (current?.type === "local") {
      let projectId = remapId(current.projectId);
      if (projectId !== current.projectId)
        store.set(stateKeys.SELECTED_PROJECT, { type: "local", projectId: normalizeProjectId(projectId) });
    }
    mergeRepairedProjectMetadata(store, replacements);
    let rawAssignments = store.getStored(stateKeys.THREAD_PROJECT_ASSIGNMENTS);
    if (rawAssignments != null) {
      let assignments = normalizeThreadAssignments(rawAssignments);
      store.set(stateKeys.THREAD_PROJECT_ASSIGNMENTS, Object.fromEntries(
        Object.entries(assignments).map(([threadId, assignment]) => [
          threadId,
          assignment.projectKind === "local"
            ? { ...assignment, projectId: remapId(assignment.projectId) }
            : assignment,
        ]),
      ));
    }
    return replacements.size;
  }

  function parseRemoteCwds(value: unknown): Record<string, Record<string, string>> | undefined {
    let source = record(value);
    if (source == null) return undefined;
    let result: Record<string, Record<string, string>> = {};
    for (let [hostId, rawMappings] of Object.entries(source)) {
      let mappings = stringRecord(rawMappings);
      if (Object.keys(mappings).length > 0) result[hostId] = mappings;
    }
    return Object.keys(result).length > 0 ? result : undefined;
  }

  function parseRemoteProjects(value: unknown): RemoteProject[] {
    return Array.isArray(value) ? value.flatMap((entry) => {
      let candidate = stringRecord(entry);
      return candidate.hostId == null || candidate.id == null || candidate.label == null || candidate.remotePath == null
        ? []
        : [{ hostId: candidate.hostId, id: candidate.id, label: candidate.label, remotePath: candidate.remotePath }];
    }) : [];
  }

  function retainRemoteCwds({
    remoteCwdsByHostAndWorkspace,
    remoteProjects,
    workspaceRootOptions,
  }: {
    remoteCwdsByHostAndWorkspace?: Record<string, Record<string, string>>;
    remoteProjects: RemoteProject[];
    workspaceRootOptions: string[];
  }): Record<string, Record<string, string>> | undefined {
    if (remoteCwdsByHostAndWorkspace == null) return undefined;
    let projectKeys = new Set(remoteProjects.map((project) => `${project.hostId}::${project.remotePath}`));
    let roots = new Set(workspaceRootOptions);
    let result: Record<string, Record<string, string>> = {};
    for (let [hostId, mappings] of Object.entries(remoteCwdsByHostAndWorkspace)) {
      let retained: Record<string, string> = {};
      for (let [workspaceRoot, cwd] of Object.entries(mappings))
        if (workspaceRoot === cwd && (roots.has(workspaceRoot) || projectKeys.has(`${hostId}::${cwd}`)))
          retained[workspaceRoot] = cwd;
      if (Object.keys(retained).length > 0) result[hostId] = retained;
    }
    return Object.keys(result).length > 0 ? result : undefined;
  }

  function migrateStringRemoteProjects(store: GlobalStateMigrationStore): void {
    let workspaceRootOptions = stringArray(store.getStored(stateKeys.WORKSPACE_ROOT_OPTIONS));
    let remoteCwds = parseRemoteCwds(store.getStored(stateKeys.REMOTE_CWDS_BY_HOST_AND_WORKSPACE));
    if (workspaceRootOptions.length === 0 || remoteCwds == null) return;
    let selectedRemoteHostId = typeof store.getStored(stateKeys.SELECTED_REMOTE_HOST_ID) === "string"
      ? store.getStored(stateKeys.SELECTED_REMOTE_HOST_ID) as string
      : undefined;
    let labels = stringRecord(store.getStored(stateKeys.WORKSPACE_ROOT_LABELS));
    let activeRoots = stringArray(store.getStored(stateKeys.ACTIVE_WORKSPACE_ROOTS));
    let projectOrder = optionalStringArray(store.getStored(stateKeys.PROJECT_ORDER));
    let activeRemoteProjectId = typeof store.getStored(stateKeys.ACTIVE_REMOTE_PROJECT_ID) === "string"
      ? store.getStored(stateKeys.ACTIVE_REMOTE_PROJECT_ID) as string
      : undefined;
    let remoteProjects = parseRemoteProjects(store.getStored(stateKeys.REMOTE_PROJECTS));
    let existingKeys = new Set(remoteProjects.map((project) => `${project.hostId}::${project.remotePath}`));
    let candidates: Array<{ hostId: string; workspaceRoot: string; remotePath: string; label: string }> = [];
    let missingRoots: Array<{ hostId: string; workspaceRoot: string }> = [];
    let ignoredLocalMappings = 0;
    for (let [hostId, mappings] of Object.entries(remoteCwds)) {
      for (let [workspaceRoot, remotePath] of Object.entries(mappings)) {
        if (workspaceRoot !== remotePath) {
          ignoredLocalMappings += 1;
        } else if (!workspaceRootOptions.includes(workspaceRoot)) {
          missingRoots.push({ hostId, workspaceRoot });
        } else {
          candidates.push({
            hostId,
            workspaceRoot,
            remotePath,
            label: labels[workspaceRoot]?.trim() || path.posix.basename(remotePath) || remotePath,
          });
        }
      }
    }
    if (candidates.length === 0) {
      let retained = retainRemoteCwds({ remoteCwdsByHostAndWorkspace: remoteCwds, remoteProjects, workspaceRootOptions });
      if (JSON.stringify(retained) !== JSON.stringify(remoteCwds))
        store.set(stateKeys.REMOTE_CWDS_BY_HOST_AND_WORKSPACE, retained);
      remoteLogger().info("[remote-project-migration] no string-based remote projects found", {
        safe: { ignoredLocalProjectMappings: ignoredLocalMappings, selfMappingsMissingWorkspaceRootCount: missingRoots.length },
        sensitive: { selfMappingsMissingWorkspaceRoot: missingRoots },
      });
      return;
    }
    remoteLogger().info("[remote-project-migration] found string-based remote projects", {
      safe: { candidateCount: candidates.length, ignoredLocalProjectMappings: ignoredLocalMappings, selfMappingsMissingWorkspaceRootCount: missingRoots.length },
      sensitive: { stringBasedRemoteProjects: candidates, selfMappingsMissingWorkspaceRoot: missingRoots },
    });
    let migratedRoots = new Set(candidates.map((candidate) => candidate.workspaceRoot));
    let createdProjects: RemoteProject[] = [];
    let reusedProjects: Array<{ hostId: string; remotePath: string }> = [];
    for (let candidate of candidates) {
      let key = `${candidate.hostId}::${candidate.remotePath}`;
      if (existingKeys.has(key)) {
        reusedProjects.push({ hostId: candidate.hostId, remotePath: candidate.remotePath });
      } else {
        createdProjects.push({ id: randomUUID(), hostId: candidate.hostId, remotePath: candidate.remotePath, label: candidate.label });
        existingKeys.add(key);
      }
    }
    remoteLogger().info("[remote-project-migration] prepared remote project objects", {
      safe: { createdRemoteProjectsCount: createdProjects.length, reusedRemoteProjectsCount: reusedProjects.length, migratedWorkspaceRootCount: migratedRoots.size },
      sensitive: { newRemoteProjects: createdProjects, reusedRemoteProjects: reusedProjects },
    });
    let nextRemoteProjects = createdProjects.length > 0 ? [...remoteProjects, ...createdProjects] : remoteProjects;
    let projectsByPath = new Map<string, RemoteProject[]>();
    for (let project of nextRemoteProjects) {
      let entries = projectsByPath.get(project.remotePath) ?? [];
      entries.push(project);
      projectsByPath.set(project.remotePath, entries);
    }
    let migratedOptions = workspaceRootOptions.filter((root) => migratedRoots.has(root));
    let replacementIds = new Map<string, string[]>();
    for (let root of migratedOptions) {
      let projects = [...(projectsByPath.get(root) ?? [])];
      projects.sort((left, right) => {
        let leftPriority = left.hostId === selectedRemoteHostId ? 0 : 1;
        let rightPriority = right.hostId === selectedRemoteHostId ? 0 : 1;
        return leftPriority === rightPriority
          ? left.hostId.localeCompare(right.hostId)
          : leftPriority - rightPriority;
      });
      replacementIds.set(root, projects.map((project) => project.id));
    }
    let remainingOptions = workspaceRootOptions.filter((root) => !migratedRoots.has(root));
    let activeRoot = activeRoots.find((root) => migratedRoots.has(root));
    let priorOrder = projectOrder ?? workspaceRootOptions;
    let nextOrder: string[] = [];
    let ordered = new Set<string>();
    for (let entry of priorOrder) {
      let replacements = migratedRoots.has(entry) ? replacementIds.get(entry) ?? [] : [entry];
      for (let projectId of replacements) if (!ordered.has(projectId)) {
        nextOrder.push(projectId);
        ordered.add(projectId);
      }
    }
    for (let root of migratedOptions)
      for (let projectId of replacementIds.get(root) ?? []) if (!ordered.has(projectId)) {
        nextOrder.push(projectId);
        ordered.add(projectId);
      }
    let nextActiveRemoteProjectId = activeRoot == null
      ? activeRemoteProjectId
      : replacementIds.get(activeRoot)?.[0] ?? activeRemoteProjectId;
    remoteLogger().info("[remote-project-migration] rewriting project state", {
      safe: { nextWorkspaceRootOptionsCount: remainingOptions.length, nextProjectOrderCount: nextOrder.length, hasNextActiveRemoteProjectId: nextActiveRemoteProjectId != null },
      sensitive: {
        migratedWorkspaceRoots: [...migratedRoots],
        replacementRemoteProjectIdsByWorkspaceRoot: Object.fromEntries(replacementIds),
        nextWorkspaceRootOptions: remainingOptions,
        nextProjectOrder: nextOrder,
        nextActiveRemoteProjectId,
      },
    });
    if (createdProjects.length > 0) store.set(stateKeys.REMOTE_PROJECTS, nextRemoteProjects);
    store.set(stateKeys.PROJECT_ORDER, nextOrder.length > 0 ? nextOrder : undefined);
    if (nextActiveRemoteProjectId != null)
      store.set(stateKeys.SELECTED_PROJECT, { type: "remote", projectId: normalizeProjectId(nextActiveRemoteProjectId) });
    store.set(stateKeys.REMOTE_CWDS_BY_HOST_AND_WORKSPACE, retainRemoteCwds({
      remoteCwdsByHostAndWorkspace: remoteCwds,
      remoteProjects: nextRemoteProjects,
      workspaceRootOptions: remainingOptions,
    }));
  }

  function clearLegacyBrowserDownloadHistory(store: GlobalStateMigrationStore): boolean {
    if (store.getStored(LEGACY_BROWSER_DOWNLOAD_HISTORY_KEY) == null) return false;
    store.delete(LEGACY_BROWSER_DOWNLOAD_HISTORY_KEY);
    return true;
  }

  const migrations: LocalDataMigration[] = [
    { id: "2026-07-13-string-based-remote-projects", runAsync: async (store) => migrateStringRemoteProjects(store) },
    { id: "2026-07-13-automation-project-targets", runAsync: async (store) => { await migrateAutomationProjectTargets(store); } },
    { id: "2026-07-13-local-projects", runAsync: async (store) => migrateLegacyLocalProjects(store) },
    { id: "2026-07-13-remap-legacy-automation-project-targets", runAsync: async (store) => { remapLegacyAutomationProjectTargets(store); } },
    { id: "2026-07-13-clear-legacy-browser-download-history", runAsync: async (store) => { clearLegacyBrowserDownloadHistory(store); } },
    { id: "2026-07-14-repair-metadata-local-projects", runAsync: async (store) => { repairMetadataLocalProjects(store); } },
  ];

  async function runLocalDataMigrations(
    store: GlobalStateMigrationStore,
    migrationList: LocalDataMigration[] = migrations,
  ): Promise<void> {
    let completed = new Set<string>(store.get(COMPLETED_MIGRATIONS_KEY) ?? []);
    for (let migration of migrationList) {
      if (completed.has(migration.id)) continue;
      await migration.runAsync(store);
      completed.add(migration.id);
      store.set(COMPLETED_MIGRATIONS_KEY, [...completed]);
      await store.flushOrThrow();
    }
  }

  async function clearLegacyBrowserDownloadHistoryOnStartup(store: GlobalStateMigrationStore): Promise<void> {
    if (clearLegacyBrowserDownloadHistory(store)) await store.flushOrThrow();
  }

  return {
    migrations,
    runLocalDataMigrations,
    clearLegacyBrowserDownloadHistoryOnStartup,
    clearLegacyBrowserDownloadHistory,
    migrateLegacyLocalProjects,
    migrateAutomationProjectTargets,
    remapLegacyAutomationProjectTargets,
    repairMetadataLocalProjects,
    migrateStringRemoteProjects,
    retainRemoteCwds,
  };
}
