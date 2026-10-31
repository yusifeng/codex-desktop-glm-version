// @ts-nocheck

/** Drains OS open-file events into projects, projectless tasks, or browser tabs. */
export function installDesktopOpenPathHandler(options: Record<string, any>) {
  const {
    ensureWindow,
    errorReporter,
    globalState,
    isMacOS,
    projectsManager,
    windowManager,
    installEarlyOpenPathListeners,
    setOpenFilesHandler,
    releaseOpenFilesHandler,
    subscribeFeatureAvailability,
    getFeatureAvailability,
    stat,
    resolvePath,
    extname,
    pathToFileURL,
    classifyDesktopOpenPath,
    createOpenFileDescriptors,
    collectFileExtensions,
    getSelectedProject,
    setSelectedProject,
    localHostId,
    globalStateKeys,
    normalizeError,
    logger,
    now = Date.now,
  } = options;

  const removeEarlyListeners = installEarlyOpenPathListeners(isMacOS);
  const pendingPaths: string[] = [];
  let pendingDrain: Promise<void> | null = null;

  async function openDirectories(paths: string[]) {
    const uniquePaths = [...new Set(paths)];
    if (uniquePaths.length === 0) return;
    const existingRoots = projectsManager.getProjectRootPathsForHost(localHostId);
    const addedRoots = [];
    let selectedProjectId = null;
    const projects = await projectsManager.createProjectsForRoots(uniquePaths);
    if (projects.length === 0) return;
    for (const project of projects) {
      selectedProjectId = project.id;
      const root = project.rootPaths[0];
      if (root != null && !existingRoots.includes(root)) {
        addedRoots.push({ projectId: project.id, root });
      }
    }
    if (selectedProjectId == null) return;
    const window = await ensureWindow();
    if (addedRoots.length > 0) {
      windowManager.sendMessageToAllWindows({
        type: `global-state-updated`,
        keys: [globalStateKeys.LOCAL_PROJECTS, globalStateKeys.PROJECT_ORDER],
      });
      windowManager.sendMessageToAllWindows({ type: `workspace-root-options-updated` });
      for (const { projectId, root } of addedRoots) {
        windowManager.sendMessageToAllWindows({
          type: `workspace-root-option-added`,
          root,
        });
        if (window != null && !window.isDestroyed()) {
          windowManager.sendMessageToWindow(window, {
            type: `workspace-root-option-added`,
            projectId,
            root,
          });
        }
      }
    }
    const selectedProject = getSelectedProject(globalState);
    if (
      selectedProject?.type !== `local` ||
      selectedProject.projectId !== selectedProjectId
    ) {
      setSelectedProject(globalState, {
        type: `local`,
        projectId: selectedProjectId,
      });
      windowManager.sendMessageToAllWindows({
        type: `global-state-updated`,
        keys: [globalStateKeys.SELECTED_PROJECT],
      });
    }
    windowManager.showPrimaryWindow({ stealFocus: true });
    if (window != null && !window.isDestroyed()) {
      windowManager.sendMessageToWindow(window, {
        type: `navigate-to-route`,
        path: `/`,
        state: {
          focusComposerNonce: now(),
          project: { type: `local`, projectId: selectedProjectId },
        },
      });
    }
  }

  async function openFiles(files: string[], browserDocuments: string[]) {
    const descriptors = createOpenFileDescriptors(files);
    if (descriptors.length === 0 && browserDocuments.length === 0) return;
    const window = await ensureWindow();
    if (window == null || window.isDestroyed()) return;
    windowManager.showPrimaryWindow({ stealFocus: true });
    if (descriptors.length > 0) {
      const hasSkill = files.some((path: string) => extname(path).toLowerCase() === `.skill`);
      const previewFiles = descriptors.filter(
        ({ path }: Record<string, any>) => extname(path).toLowerCase() !== `.skill`,
      );
      windowManager.sendMessageToWindow(window, {
        type: `new-projectless-task`,
        files: descriptors,
        ...(hasSkill ? { prefillPromptKind: `install-skill` } : {}),
        ...(previewFiles.length > 0 ? { previewFiles } : {}),
      });
      logger.n().info(`Opened desktop files in projectless task`, {
        safe: {
          fileCount: descriptors.length,
          fileExtensions: collectFileExtensions(descriptors),
        },
      });
    }
    for (const path of browserDocuments) {
      windowManager.sendMessageToWindow(window, {
        type: `toggle-browser-panel`,
        open: true,
        url: pathToFileURL(path).href,
        source: `manual`,
        initiator: `os_open`,
      });
    }
  }

  async function classifyPath(path: string) {
    const resolvedPath = resolvePath(path);
    try {
      return classifyDesktopOpenPath(resolvedPath, await stat(resolvedPath));
    } catch (error) {
      logger.n().warning(`Failed to stat desktop open path`, {
        safe: {},
        sensitive: { error },
      });
      return null;
    }
  }

  async function drain() {
    if (pendingPaths.length === 0 || getFeatureAvailability().status === `loading`) return;
    const paths = pendingPaths.splice(0, pendingPaths.length);
    const classifiedPaths = await Promise.all(paths.map(classifyPath));
    const directories = [];
    const files = [];
    const browserDocuments = [];
    for (const classified of classifiedPaths) {
      if (classified == null) continue;
      if (classified.kind === `directory`) directories.push(classified.path);
      else if (classified.kind === `browser-document`) browserDocuments.push(classified.path);
      else files.push(classified.path);
    }
    const availability = getFeatureAvailability();
    if (availability.status === `loading`) return;
    if (availability.codexLocalAccess || availability.workLocalAccess) {
      await openDirectories(directories);
    }
    await openFiles(
      availability.codexLocalAccess
        ? files
        : files.filter((path: string) => extname(path).toLowerCase() !== `.skill`),
      browserDocuments,
    );
    if (pendingPaths.length > 0) await drain();
  }

  async function runDrain() {
    if (pendingDrain != null) return pendingDrain;
    pendingDrain = drain();
    try {
      await pendingDrain;
    } finally {
      pendingDrain = null;
    }
  }

  function scheduleDrain() {
    if (getFeatureAvailability().status === `loading`) return;
    runDrain().catch((error: unknown) => {
      errorReporter.reportNonFatal(
        error instanceof Error ? error : normalizeError(error),
        { kind: `desktop-open-paths` },
      );
    });
  }

  const handleOpenFiles = (paths: string[]) => {
    pendingPaths.push(...paths);
    scheduleDrain();
  };
  const removeFeatureAvailabilityListener = subscribeFeatureAvailability(scheduleDrain);
  const initiallyPending = setOpenFilesHandler(handleOpenFiles);
  if (initiallyPending.length > 0) handleOpenFiles(initiallyPending);

  return () => {
    removeFeatureAvailabilityListener();
    releaseOpenFilesHandler(handleOpenFiles);
    removeEarlyListeners();
  };
}

if (typeof module !== "undefined") {
  module.exports = { installDesktopOpenPathHandler };
}
