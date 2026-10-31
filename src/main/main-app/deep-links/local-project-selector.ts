// @ts-nocheck

/** Selects or creates the local project used by a new-thread deep link. */
export async function selectLocalProjectForWorkspace(options: Record<string, any>) {
  const {
    globalState,
    projectsManager,
    projectId,
    workspaceRoot,
    windowManager,
    localHostId,
    findProjectByRoot,
    getSelectedProject,
    setSelectedProject,
    globalStateKeys,
  } = options;

  if (projectsManager == null) throw Error(`Missing local project mutation handler`);

  const wasKnownRoot = projectsManager
    .getProjectRootPathsForHost(localHostId)
    .includes(workspaceRoot);
  let project =
    projectId == null
      ? findProjectByRoot(globalState, workspaceRoot)
      : projectsManager.getLocalProjects()[projectId];

  if (project == null) {
    if (projectId != null) return undefined;
    project = await projectsManager.createProjectForRoot(workspaceRoot);
    if (project == null) return undefined;
  }

  if (!wasKnownRoot) {
    windowManager.sendMessageToAllWindows({ type: `workspace-root-options-updated` });
  }

  const selectedProject = getSelectedProject(globalState);
  if (selectedProject?.type === `local` && selectedProject.projectId === project.id) {
    return selectedProject;
  }

  const nextSelection = { type: `local`, projectId: project.id };
  setSelectedProject(globalState, nextSelection);
  windowManager.sendMessageToAllWindows({
    type: `global-state-updated`,
    keys: [
      globalStateKeys.LOCAL_PROJECTS,
      globalStateKeys.PROJECT_ORDER,
      globalStateKeys.SELECTED_PROJECT,
    ],
  });
  return nextSelection;
}

if (typeof module !== "undefined") {
  module.exports = { selectLocalProjectForWorkspace };
}
