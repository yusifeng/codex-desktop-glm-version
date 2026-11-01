import path from "node:path";
import {
  iu as stateKeys,
  qo as parseLocalProjects,
  Ko as preferProjectForRoot,
  Wo as firstWorkspaceRoot,
} from "@chunk/shared";

type GlobalState = {
  get(key: unknown): any;
  getStored?(key: unknown): any;
  set(key: unknown, value: unknown): unknown;
};

export function getLocalProjects(globalState: GlobalState): Record<string, any> {
  return parseLocalProjects(globalState.get(stateKeys.LOCAL_PROJECTS));
}

export function findLocalProjectForRoot(globalState: GlobalState, rootPath: string): any | null {
  let selected = null;
  for (const project of Object.values(getLocalProjects(globalState))) {
    if (!project.rootPaths.some((candidate: string) => path.relative(candidate, rootPath) === "")) continue;
    if (selected == null || preferProjectForRoot(
      { ...project, projectId: project.id, rootPath },
      { ...selected, projectId: selected.id, rootPath },
    )) selected = project;
  }
  return selected;
}

export function getSelectedProject(globalState: GlobalState): any | null {
  return globalState.get(stateKeys.SELECTED_PROJECT) ?? null;
}

export function getSelectedLocalProject(globalState: GlobalState): any | null {
  const selected = getSelectedProject(globalState);
  return selected?.type === "local" ? (getLocalProjects(globalState)[selected.projectId] ?? null) : null;
}

export function getLocalWorkspaceRootOptions(globalState: GlobalState): {
  roots: string[];
  labels: Record<string, string>;
} {
  const projects = getLocalProjects(globalState);
  const order = globalState.get(stateKeys.PROJECT_ORDER) ?? [];
  const ordered = [
    ...order.flatMap((id: string) => projects[id] == null ? [] : [projects[id]]),
    ...Object.values(projects).filter((project: any) => !order.includes(project.id)),
  ];
  const roots: string[] = [];
  const labels: Record<string, string> = {};
  const seen = new Set<string>();
  for (const project of ordered) {
    for (const root of project.rootPaths) {
      if (seen.has(root)) continue;
      seen.add(root);
      roots.push(root);
      if (project.rootPaths.length === 1 && project.name.trim().length > 0) labels[root] = project.name;
    }
  }
  return { roots, labels };
}

export function getDefaultWorkspaceRoot(globalState: GlobalState): string | null {
  return firstWorkspaceRoot(getSelectedLocalProject(globalState)?.rootPaths) ||
    (getLocalWorkspaceRootOptions(globalState).roots[0] ?? null);
}

export function selectProject(globalState: GlobalState, selection: unknown): void {
  globalState.set(stateKeys.SELECTED_PROJECT, selection);
}

export function updateLocalProject(
  globalState: GlobalState,
  projectId: string,
  update: (project: any) => any | null,
): any | null {
  const projects = getLocalProjects(globalState);
  const project = projects[projectId];
  if (project == null) return null;
  const updated = update(project);
  const next = { ...projects };
  if (updated == null) delete next[projectId];
  else next[projectId] = updated;
  globalState.set(stateKeys.LOCAL_PROJECTS, next);
  return updated;
}

export function initializeSelectedProject(globalState: GlobalState): void {
  if (globalState.getStored?.(stateKeys.SELECTED_PROJECT) !== undefined) return;
  const first = Object.values(getLocalProjects(globalState))[0] as any;
  if (first != null) selectProject(globalState, { type: "local", projectId: first.id });
}

export function getRemoteWorkspaceRootOptions(globalState: GlobalState, hostId: string): {
  roots: string[];
  labels: Record<string, string>;
} {
  const projects = globalState.get(stateKeys.REMOTE_PROJECTS) ?? [];
  const roots: string[] = [];
  const labels: Record<string, string> = {};
  const seen = new Set<string>();
  for (const project of projects) {
    if (project.hostId !== hostId) continue;
    const root = project.remotePath.trim();
    if (root.length === 0 || seen.has(root)) continue;
    roots.push(root);
    seen.add(root);
    const label = project.label.trim();
    if (label.length > 0) labels[root] = label;
  }
  return { roots, labels };
}
