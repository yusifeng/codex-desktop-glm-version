type Constructor<T = object> = new (...args: any[]) => T;

type DesktopFileServiceDependencies = {
  RpcHandlerBase: Constructor;
  defaultHostId: string;
  schema: any;
  electron: any;
  crypto: { randomUUID(): string };
  path: any;
  os: { tmpdir(): string };
  fs: any;
  fsPromises: any;
  streamPromises: { pipeline(...streams: any[]): Promise<void> };
  util: { promisify(fn: (...args: any[]) => any): (...args: any[]) => Promise<any> };
  childProcess: { execFile(...args: any[]): any };
  countFolderFiles(folderPath: string, host: unknown): Promise<unknown> | unknown;
  isRemoteHostConfig(hostConfig: unknown): boolean;
  resolveLocalWorkspacePath(path: string, host: any, state: any): string;
  resolveElectronResourcesPath(options: { env: NodeJS.ProcessEnv; resourcesPath?: string }): string | null;
  loadNativeFileDragAddon(options: { electronAppPath: string; resourcesPath: string | null }): {
    startFileDrag(path: string): boolean;
  };
  normalizeEnvironment(env: NodeJS.ProcessEnv): NodeJS.ProcessEnv;
  pathContains(path: string, parent: string): boolean;
};

const IMAGE_EXTENSIONS = new Map([
  ["image/gif", "gif"],
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
]);
const THUMBNAIL_SIZES = { compact: 96, large: 320 } as const;
const QUICK_LOOK_TIMEOUT_MS = 5_000;

export function createDesktopFileServicesRuntime(dependencies: DesktopFileServiceDependencies) {
  const {
    RpcHandlerBase,
    defaultHostId,
    schema,
    electron,
    crypto,
    path: pathModule,
    os,
    fs,
    fsPromises,
    streamPromises,
    util,
    childProcess,
    countFolderFiles,
    isRemoteHostConfig,
    resolveLocalWorkspacePath,
    resolveElectronResourcesPath,
    loadNativeFileDragAddon,
    normalizeEnvironment,
    pathContains,
  } = dependencies;
  const path = pathModule.default ?? pathModule;
  const RpcHandler = RpcHandlerBase as Constructor<any>;
  const execFile = util.promisify(childProcess.execFile);

  class AppServerClientRegistry<T = any> {
    readonly hosts = new Map<string, T>();
    readonly defaultHostId: string;

    constructor(initialDefaultHostId = defaultHostId) {
      this.defaultHostId = initialDefaultHostId;
    }

    add(hostId: string, client: T) {
      this.hosts.set(hostId, client);
    }

    get(hostId = this.defaultHostId): T {
      const client = this.getMaybe(hostId);
      if (client == null) throw new Error(`App server client for host ID ${hostId} not found`);
      return client;
    }

    getMaybe(hostId = this.defaultHostId): T | undefined {
      return this.hosts.get(hostId);
    }

    remove(hostId: string) {
      this.hosts.delete(hostId);
    }
  }

  class FileAttachmentsService extends RpcHandler {
    constructor(readonly executionHostRegistry: AppServerClientRegistry) {
      super();
    }

    countFolderFiles({ folderPath, hostId }: { folderPath: string; hostId: string }) {
      return countFolderFiles(folderPath, this.executionHostRegistry.get(hostId));
    }

    async persistImageFileToTemp({ bytes, mimeType }: { bytes: Uint8Array; mimeType: string }) {
      const extension = IMAGE_EXTENSIONS.get(mimeType);
      if (extension == null) return null;
      const destination = path.join(os.tmpdir(), `codex-clipboard-${crypto.randomUUID()}.${extension}`);
      await fsPromises.writeFile(destination, bytes, { flag: "wx", mode: 0o600 });
      return destination;
    }
  }

  let nativeFileDragAddon: { startFileDrag(path: string): boolean } | null | undefined;

  function getNativeFileDragAddon() {
    if (nativeFileDragAddon !== undefined) return nativeFileDragAddon;
    const resourcesPath = resolveElectronResourcesPath({
      env: process.env,
      resourcesPath: (process as NodeJS.Process & { resourcesPath?: string }).resourcesPath,
    });
    try {
      nativeFileDragAddon = loadNativeFileDragAddon({
        electronAppPath: electron.app.getAppPath(),
        resourcesPath,
      });
    } catch {
      nativeFileDragAddon = null;
    }
    return nativeFileDragAddon;
  }

  function startNativeFileDrag(filePath: string): boolean {
    if (process.platform !== "darwin") return false;
    try {
      return getNativeFileDragAddon()?.startFileDrag(filePath) === true;
    } catch {
      return false;
    }
  }

  const fileDragPayload = schema.wf({ hostId: schema.Of().trim().min(1), path: schema.Of().min(1) });

  class FileDragService extends RpcHandler {
    pendingFilePath: string | null = null;
    preparedFileDrag: { filePath: string; icon: unknown } | null = null;

    constructor(
      readonly executionHostRegistry: AppServerClientRegistry,
      readonly globalState: unknown,
      readonly origin: { startDrag?(payload: { file: string; icon: unknown }): void },
    ) {
      super();
    }

    async prepareDrag(payload: unknown) {
      let filePath: string | null = null;
      try {
        filePath = this.resolveFilePath(payload);
        if (
          filePath == null ||
          this.preparedFileDrag?.filePath === filePath ||
          this.pendingFilePath === filePath ||
          fs.statSync(filePath, { throwIfNoEntry: false })?.isFile() !== true
        ) return;
        this.preparedFileDrag = null;
        this.pendingFilePath = filePath;
        const icon = await electron.app.getFileIcon(filePath, { size: "normal" });
        if (this.pendingFilePath === filePath) this.preparedFileDrag = { filePath, icon };
      } catch {
        if (this.pendingFilePath === filePath) this.preparedFileDrag = null;
      } finally {
        if (this.pendingFilePath === filePath) this.pendingFilePath = null;
      }
    }

    startDrag = (payload: unknown): boolean => {
      try {
        const filePath = this.resolveFilePath(payload);
        if (filePath == null || fs.statSync(filePath, { throwIfNoEntry: false })?.isFile() !== true)
          return false;
        if (this.origin.startDrag == null) return startNativeFileDrag(filePath);
        if (this.preparedFileDrag?.filePath !== filePath) return false;
        this.origin.startDrag({ file: filePath, icon: this.preparedFileDrag.icon });
        return true;
      } catch {
        return false;
      }
    };

    private resolveFilePath(payload: unknown): string | null {
      const result = fileDragPayload.safeParse(payload);
      if (!result.success) return null;
      const { hostId, path: requestedPath } = result.data as { hostId: string; path: string };
      const host = this.executionHostRegistry.get(hostId) as any;
      return isRemoteHostConfig(host.hostConfig)
        ? null
        : resolveLocalWorkspacePath(requestedPath, host, this.globalState);
    }
  }

  class LibraryFileAccess {
    allowedLibraryRealPathsPromise: Promise<Array<string | null>> | null = null;
    readonly previewPaths = new Set<string>();

    constructor(readonly backend: any) {}

    async prepareFilePreview(sourcePath: string): Promise<string> {
      const source = await this.openAllowedFile(sourcePath);
      let previewDirectory: string | null = null;
      try {
        previewDirectory = await fsPromises.mkdtemp(path.join(os.tmpdir(), "codex-library-preview-"));
        const previewPath = path.join(previewDirectory, path.basename(sourcePath.replaceAll("\\", "/")));
        await streamPromises.pipeline(
          source.createReadStream({ autoClose: false }),
          fs.createWriteStream(previewPath, { flags: "wx", mode: 0o600 }),
        );
        this.previewPaths.add(previewPath);
        return previewPath;
      } catch {
        if (previewDirectory != null)
          await fsPromises.rm(previewDirectory, { force: true, recursive: true });
        throw new Error("Library file is unavailable");
      } finally {
        await source.close();
      }
    }

    async releaseFilePreview(previewPath: string) {
      if (this.previewPaths.delete(previewPath))
        await fsPromises.rm(path.dirname(previewPath), { force: true, recursive: true });
    }

    async openAllowedFile(sourcePath: string): Promise<any> {
      const desktopPath = this.backend.convertPathForDesktopHost(sourcePath);
      let initialStat: any;
      let realPath: string;
      try {
        const [stat, resolvedPath] = await Promise.all([
          fsPromises.lstat(desktopPath),
          fsPromises.realpath(desktopPath),
        ]);
        if (!stat.isFile() || stat.isSymbolicLink()) throw new Error("Invalid Library file");
        initialStat = stat;
        realPath = resolvedPath;
      } catch {
        throw new Error("Library file is unavailable");
      }
      if (!(await this.getAllowedLibraryRealPaths()).some(
        (allowedPath) => allowedPath != null && pathContains(realPath, allowedPath),
      )) throw new Error("Library file is unavailable");
      try {
        const handle = await fsPromises.open(realPath, fs.constants.O_RDONLY | fs.constants.O_NOFOLLOW);
        try {
          const [openedStat, linkStat, finalRealPath] = await Promise.all([
            handle.stat(),
            fsPromises.lstat(realPath),
            fsPromises.realpath(realPath),
          ]);
          if (
            !openedStat.isFile() || openedStat.dev !== initialStat.dev || openedStat.ino !== initialStat.ino ||
            linkStat.isSymbolicLink() || openedStat.dev !== linkStat.dev || openedStat.ino !== linkStat.ino ||
            finalRealPath !== realPath
          ) throw new Error("Invalid Library file");
          return handle;
        } catch {
          await handle.close();
          throw new Error("Library file is unavailable");
        }
      } catch {
        throw new Error("Library file is unavailable");
      }
    }

    getAllowedLibraryRealPaths(): Promise<Array<string | null>> {
      this.allowedLibraryRealPathsPromise ??= this.loadAllowedLibraryRealPaths();
      return this.allowedLibraryRealPathsPromise;
    }

    private async loadAllowedLibraryRealPaths(): Promise<Array<string | null>> {
      try {
        return await Promise.all((await this.backend.getAllowedLibraryDirectories()).map(
          async (directory: string) => {
            try {
              const [stat, realPath] = await Promise.all([
                fsPromises.lstat(directory),
                fsPromises.realpath(directory),
              ]);
              return stat.isDirectory() && !stat.isSymbolicLink() ? realPath : null;
            } catch {
              return null;
            }
          },
        ));
      } finally {
        this.allowedLibraryRealPathsPromise = null;
      }
    }
  }

  class LibraryThumbnailGenerator {
    queue = Promise.resolve();
    constructor(readonly fileAccess: LibraryFileAccess) {}

    getDataUrl(sourcePath: string, size: keyof typeof THUMBNAIL_SIZES) {
      const operation = this.queue.then(async () => {
        const source = await this.fileAccess.openAllowedFile(sourcePath);
        try {
          const sourceDirectory = await fsPromises.mkdtemp(path.join(os.tmpdir(), "codex-library-source-"));
          const localPath = path.join(sourceDirectory, path.basename(sourcePath.replaceAll("\\", "/")));
          try {
            await streamPromises.pipeline(
              source.createReadStream({ autoClose: false }),
              fs.createWriteStream(localPath, { flags: "wx" }),
            );
            const dimension = THUMBNAIL_SIZES[size];
            const quickLook = await createQuickLookThumbnail(localPath, dimension);
            if (quickLook != null) return { dataUrl: quickLook };
            const image = await electron.nativeImage.createThumbnailFromPath(localPath, {
              height: dimension,
              width: dimension,
            });
            return { dataUrl: image.isEmpty() ? null : image.toDataURL() };
          } finally {
            await fsPromises.rm(sourceDirectory, { force: true, recursive: true });
          }
        } finally {
          await source.close();
        }
      });
      this.queue = operation.then(() => undefined, () => undefined);
      return operation;
    }
  }

  async function createQuickLookThumbnail(localPath: string, dimension: number): Promise<string | null> {
    if (process.platform !== "darwin") return null;
    const outputDirectory = await fsPromises.mkdtemp(path.join(os.tmpdir(), "codex-library-thumbnail-"));
    const outputPath = path.join(outputDirectory, `${path.basename(localPath)}.png`);
    try {
      await execFile("/usr/bin/qlmanage", ["-t", "-s", String(dimension), "-o", outputDirectory, localPath], {
        env: normalizeEnvironment(process.env),
        timeout: QUICK_LOOK_TIMEOUT_MS,
      });
      return `data:image/png;base64,${(await fsPromises.readFile(outputPath)).toString("base64")}`;
    } catch {
      return null;
    } finally {
      await fsPromises.rm(outputDirectory, { recursive: true, force: true });
    }
  }

  class LibraryFilesService extends RpcHandler {
    readonly fileAccess: LibraryFileAccess;
    readonly thumbnailGenerator: LibraryThumbnailGenerator;
    constructor(readonly backend: any) {
      super();
      this.fileAccess = new LibraryFileAccess(backend);
      this.thumbnailGenerator = new LibraryThumbnailGenerator(this.fileAccess);
    }
    getThumbnailDataUrl({ size, sourcePath }: { size: keyof typeof THUMBNAIL_SIZES; sourcePath: string }) {
      return this.thumbnailGenerator.getDataUrl(sourcePath, size);
    }
    listOutputFiles() { return this.backend.listOutputFiles(); }
    async prepareFilePreview({ sourcePath }: { sourcePath: string }) {
      return { previewPath: await this.fileAccess.prepareFilePreview(sourcePath) };
    }
    releaseFilePreview({ previewPath }: { previewPath: string }) {
      return this.fileAccess.releaseFilePreview(previewPath);
    }
  }

  return {
    AppServerClientRegistry,
    FileAttachmentsService,
    FileDragService,
    LibraryFileAccess,
    LibraryFilesService,
    LibraryThumbnailGenerator,
    startNativeFileDrag,
  };
}
