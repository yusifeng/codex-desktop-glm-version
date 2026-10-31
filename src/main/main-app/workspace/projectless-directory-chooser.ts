// @ts-nocheck

/** Creates the projectless workspace directory picker and validation boundary. */
export function createProjectlessDirectoryChooserClass(
  dependencies: Record<string, any>,
) {
  const {
    RpcHandlerBase,
    BrowserWindow,
    dialog,
    settings,
    getHomeDirectory,
    path,
    getDefaultWorkspaceRoot,
    validateProjectlessDirectory,
    getUseWslPaths,
    hostConfig,
    lstat,
    access,
    accessModes,
  } = dependencies;

  return class ProjectlessDirectoryChooser extends RpcHandlerBase {
    constructor(origin: any, settingsStore: any) {
      super();
      this.origin = origin;
      this.settingsStore = settingsStore;
    }

    async chooseDirectory() {
      const options = {
        defaultPath: getDefaultWorkspaceRoot({
          configuredWorkspaceRoot: this.settingsStore.getEffective(
            settings.projectlessWorkspaceRoot.key,
          ),
          homeDirectory: getHomeDirectory(),
          path,
        }),
        properties: ["openDirectory", "createDirectory"],
        title: "Choose Projectless Task Folder",
      };
      const owner = BrowserWindow.fromWebContents(this.origin);
      const result =
        owner == null
          ? await dialog.showOpenDialog(options)
          : await dialog.showOpenDialog(owner, options);
      const directory = result.filePaths[0];
      if (result.canceled || directory == null) return null;
      if (!path.isAbsolute(directory))
        throw Error("Projectless chat folder must be an absolute local path");
      validateProjectlessDirectory(directory, getUseWslPaths(hostConfig));
      const fileStat = await lstat(directory);
      if (!fileStat.isDirectory() || fileStat.isSymbolicLink())
        throw Error("Projectless chat folder must be a real directory");
      await Promise.all([
        access(directory, accessModes.R_OK),
        access(directory, accessModes.W_OK),
        access(directory, accessModes.X_OK),
      ]);
      return directory;
    }
  };
}

if (typeof module !== "undefined")
  module.exports = { createProjectlessDirectoryChooserClass };
