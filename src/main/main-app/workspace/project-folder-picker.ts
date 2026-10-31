// @ts-nocheck

const HIDDEN_FILES_PREFERENCE_TIMEOUT_MS = 100;

/** Owns local project-directory picking and remote workspace-picker routing. */
export function createProjectFolderPickerClass(dependencies: Record<string, any>) {
  const {
    clearTimeout,
    createLogger,
    electron,
    formatProjectRoot,
    normalizeProjectSource,
    normalizeWorkspaceRoots,
    now,
    platform,
    resolvePath,
    runCommand,
    setTimeout,
    stat,
  } = dependencies;

  return class ProjectFolderPicker {
    host: any;
    windowManager: any;
    projectsManager: any;
    logger = createLogger(`project-folder-picker`);

    constructor(host: any, windowManager: any, projectsManager: any) {
      this.host = host;
      this.windowManager = windowManager;
      this.projectsManager = projectsManager;
    }

    async createOrSelectProject(origin: any, requestedPath?: string, requestedName?: string) {
      if (this.host.id !== `local`) {
        this.windowManager.sendMessageToWebContents(origin, {
          type: `remote-workspace-root-requested`,
          mode: `add`,
          host: this.host.display_name,
          hostId: this.host.id,
          setActive: true,
        });
        return;
      }
      const sources =
        requestedPath == null
          ? await this.pickLocalDirectories(origin)
          : [await this.resolveProjectSource(requestedPath)].filter((value) => value != null);
      const root = normalizeWorkspaceRoots(sources);
      if (root == null) {
        this.windowManager.sendInlineMessageForView(origin, {
          type: `workspace-root-option-add-canceled`,
        });
        return;
      }
      const projectsBefore = this.projectsManager.getLocalProjects();
      const [project] = await this.projectsManager.createOrSelectLocalProjects([root]);
      if (project == null) {
        this.windowManager.sendInlineMessageForView(origin, {
          type: `workspace-root-option-add-canceled`,
        });
        return;
      }
      const isNewProject = projectsBefore[project.id] == null;
      if (requestedName != null && isNewProject)
        await this.projectsManager.renameLocal({ projectId: project.id, name: requestedName });
      this.windowManager.sendInlineMessageForView(origin, {
        type: `workspace-root-option-added`,
        projectId: isNewProject ? project.id : null,
        root: formatProjectRoot(root),
        ...(isNewProject ? {} : { selectedProjectId: project.id }),
      });
      this.windowManager.sendInlineMessageForView(origin, {
        type: `navigate-to-route`,
        path: `/`,
        state: { focusComposerNonce: now() },
      });
    }

    async pickProjectSources(origin: any, allowMultiple: boolean) {
      if (this.host.id !== `local`) {
        this.windowManager.sendMessageToWebContents(origin, {
          type: `remote-workspace-root-requested`,
          mode: `pick`,
          host: this.host.display_name,
          hostId: this.host.id,
        });
        return;
      }
      for (const root of await this.pickLocalDirectories(origin, allowMultiple)) {
        this.windowManager.sendInlineMessageForView(origin, {
          type: `workspace-root-option-picked`,
          root: formatProjectRoot(root),
        });
      }
    }

    async pickLocalDirectories(origin: any, allowMultiple = false) {
      if (this.host.id !== `local`) throw Error(`Project picker is only supported for local hosts`);
      const properties = [`openDirectory`, `createDirectory`];
      if (allowMultiple) properties.push(`multiSelections`);
      if (await this.shouldShowHiddenFiles()) properties.push(`showHiddenFiles`);
      const options = { properties, title: `Select Project Root` };
      const ownerWindow = electron.BrowserWindow.fromWebContents(origin);
      const result =
        ownerWindow == null
          ? await electron.dialog.showOpenDialog(options)
          : await electron.dialog.showOpenDialog(ownerWindow, options);
      if (result.canceled) return [];
      return (await Promise.all(result.filePaths.map((value: string) => this.resolveProjectSource(value))))
        .filter((value) => value != null);
    }

    async resolveProjectSource(source: string) {
      try {
        const normalized = await normalizeProjectSource(source, this.host);
        return (await stat(normalized)).isDirectory() ? resolvePath(normalized) : null;
      } catch (error) {
        this.logger().warning(`Failed to stat project source`, {
          safe: {},
          sensitive: { error },
        });
        return null;
      }
    }

    async shouldShowHiddenFiles() {
      if (platform !== `darwin`) return false;
      const abortController = new AbortController();
      let timedOut = false;
      const timeout = setTimeout(() => {
        timedOut = true;
        abortController.abort();
      }, HIDDEN_FILES_PREFERENCE_TIMEOUT_MS);
      try {
        const { stdout, code } = await runCommand({
          args: [`/usr/bin/defaults`, `read`, `com.apple.finder`, `AppleShowAllFiles`],
          signal: abortController.signal,
        }).wait();
        if (timedOut || code !== 0) return false;
        const value = stdout.trim().toLowerCase();
        return value === `1` || value === `true` || value === `yes`;
      } catch (error) {
        if (!timedOut)
          this.logger().warning(`Failed to read hidden files preference`, {
            safe: {},
            sensitive: { error },
          });
        return false;
      } finally {
        clearTimeout(timeout);
      }
    }
  };
}

if (typeof module !== `undefined`) module.exports = { createProjectFolderPickerClass };
