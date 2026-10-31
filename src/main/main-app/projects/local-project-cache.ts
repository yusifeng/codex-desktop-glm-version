// @ts-nocheck

/** Owns the persisted local-project cache and appearance projection for the local host. */
export function createLocalProjectCacheClass(dependencies: Record<string, any>) {
  const {
    runtime: n,
    hostId,
    getLocalProjects,
    updateLocalProject,
    now,
  } = dependencies;

  return class LocalProjectCache {
    globalState;
    hostId = hostId;

    constructor(globalState: any) {
      this.globalState = globalState;
    }

    getProjects() {
      return getLocalProjects(this.globalState);
    }

    getAppearance(projectId: string) {
      return n.Io(this.globalState.get(n.iu.PROJECT_APPEARANCES))[projectId] ?? null;
    }

    writeProject(method: string, project: any, appearance: any) {
      if (method === "project/create")
        this.globalState.set(n.iu.LOCAL_PROJECTS, {
          ...this.getProjects(),
          [project.id]: project,
        });
      else updateLocalProject(this.globalState, project.id, () => null);
      this.updateAppearance(project.id, appearance);
    }

    updateProject(projectId: string, update: any) {
      updateLocalProject(this.globalState, projectId, (project: any) => ({
        ...project,
        name: update.name ?? project.name,
        rootPaths: update.rootPaths ?? project.rootPaths,
        updatedAt:
          update.name !== undefined || update.rootPaths !== undefined
            ? now()
            : project.updatedAt,
      }));
      this.updateAppearance(projectId, update.appearance);
    }

    updateAppearance(projectId: string, appearance: any) {
      if (appearance === undefined) return;
      this.globalState.set(
        n.iu.PROJECT_APPEARANCES,
        n.Fo({
          projectAppearances: n.Io(
            this.globalState.get(n.iu.PROJECT_APPEARANCES),
          ),
          projectId,
          appearance,
        }),
      );
    }
  };
}

if (typeof module !== "undefined")
  module.exports = { createLocalProjectCacheClass };
