// @ts-nocheck

/** Creates the screenshot and sandboxed HTML reader used by inline visualizations. */
export function createVisualizationServiceRuntime(dependencies: Record<string, any>) {
  const {
    runtime,
    RpcHandlerBase,
    electron,
    platform,
    getSandboxWebContents,
    projectCaptureRect,
    getFeatureFlags,
    temporaryDirectory,
    realpathSync,
    uniqueBy,
    maxFileBytes = 5_000_000,
  } = dependencies;

  const sandboxIdSchema = runtime.Of().regex(/^visualization-[0-9a-f]{16}$/);
  const screenshotRequestSchema = runtime
    .wf({
      captureRect: runtime.wf({
        height: runtime.Cf().positive(),
        width: runtime.Cf().positive(),
        x: runtime.Cf().nonnegative(),
        y: runtime.Cf().nonnegative(),
      }),
      sandboxId: sandboxIdSchema,
      viewportSize: runtime.wf({
        height: runtime.Cf().positive(),
        width: runtime.Cf().positive(),
      }),
    })
    .refine(
      ({ captureRect, viewportSize }: Record<string, any>) =>
        captureRect.x + captureRect.width <= viewportSize.width &&
        captureRect.y + captureRect.height <= viewportSize.height,
    );
  const readRequestSchema = runtime.wf({
    hostId: runtime.Of().trim().min(1).optional(),
    path: runtime.Of().min(1),
    sandboxPolicy: runtime
      .wf({
        excludeSlashTmp: runtime.gf(),
        excludeTmpdirEnvVar: runtime.gf(),
        type: runtime.bf(`workspaceWrite`),
        writableRoots: runtime.hf(runtime.Of().min(1)),
      })
      .optional(),
    threadId: runtime.Of().regex(/^[a-zA-Z0-9_-]+$/),
  });

  function isPathWithin(directory: string, candidate: string, path: any) {
    const relative = path.relative(directory, candidate);
    return relative !== `..` && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative);
  }

  async function resolveAuthorizedAbsolutePath(
    candidatePath: string,
    roots: Record<string, any>[],
    executionHost: any,
    path: any,
  ) {
    const uniqueRoots = uniqueBy(
      roots.filter((root) => path.isAbsolute(root.directory)),
      (root: Record<string, any>) => root.directory,
    );
    const directRoot = uniqueRoots
      .filter((root) => isPathWithin(root.directory, candidatePath, path))
      .sort((left, right) => right.directory.length - left.directory.length)[0];
    if (directRoot != null) {
      const realBoundary = (await runtime.Lt([directRoot.boundary], executionHost))[directRoot.boundary];
      if (realBoundary == null) throw Error(`Invalid visualization read request`);
      return {
        boundary: realBoundary,
        path: path.join(realBoundary, path.relative(directRoot.boundary, candidatePath)),
      };
    }

    const controller = new AbortController();
    let index = 0;
    try {
      return await Promise.any(
        Array.from({ length: Math.min(4, uniqueRoots.length) }, async () => {
          while (!controller.signal.aborted && index < uniqueRoots.length) {
            const root = uniqueRoots[index++];
            const realBoundary = (await runtime.Lt(
              [root.boundary],
              executionHost,
              controller.signal,
            ))[root.boundary];
            if (
              realBoundary != null &&
              isPathWithin(
                path.join(realBoundary, path.relative(root.boundary, root.directory)),
                candidatePath,
                path,
              )
            ) {
              return { boundary: realBoundary, path: candidatePath };
            }
          }
          throw Error(`Invalid visualization read request`);
        }),
      );
    } catch {
      throw Error(`Invalid visualization read request`);
    } finally {
      controller.abort();
    }
  }

  class VisualizationService extends RpcHandlerBase {
    executionHostRegistry;
    origin;
    getThreadWorkspaceRoot;

    constructor(executionHostRegistry: any, origin: any, getThreadWorkspaceRoot: any) {
      super();
      this.executionHostRegistry = executionHostRegistry;
      this.origin = origin;
      this.getThreadWorkspaceRoot = getThreadWorkspaceRoot;
    }

    async copyImage(request: unknown) {
      const parsed = screenshotRequestSchema.safeParse(request);
      if (!parsed.success) throw Error(`codex-inline-vis-screenshot: invalid request`);
      const { captureRect, sandboxId, viewportSize } = parsed.data;
      const sandbox = getSandboxWebContents(this.origin, sandboxId);
      if (sandbox == null) throw Error(`codex-inline-vis-screenshot: sandbox is unavailable`);
      const image = await sandbox.capturePage();
      const cropRect = projectCaptureRect(
        image.getSize(),
        captureRect,
        viewportSize,
        Math.min(captureRect.x, captureRect.y),
      );
      if (cropRect == null) throw Error(`codex-inline-vis-screenshot: capture is empty`);
      const cropped = image.crop(cropRect);
      const clipboardImage =
        platform === `win32`
          ? electron.nativeImage.createFromBitmap(cropped.toBitmap(), cropped.getSize())
          : cropped;
      electron.clipboard.writeImage(clipboardImage);
    }

    async getTemporaryRoots(hostId: string) {
      if (!this.executionHostRegistry.get(hostId).isLocal) return [];
      const directory = temporaryDirectory();
      return [directory, realpathSync(directory)];
    }

    async read(request: unknown) {
      const parsed = readRequestSchema.safeParse(request);
      if (!parsed.success) throw Error(`Invalid visualization read request`);
      const { hostId, path: requestedPath, sandboxPolicy, threadId } = parsed.data;
      const executionHost = this.executionHostRegistry.get(hostId);
      const [codexHome, workspacesRoot, path] = await Promise.all([
        executionHost.codexHome(),
        executionHost.workspacesRoot().catch(() => null),
        executionHost.platformPath(),
      ]);
      const normalizedThreadId = runtime.qi(threadId);
      if (normalizedThreadId == null) throw Error(`Invalid visualization read request`);
      const normalizedCodexHome =
        executionHost.isLocal && path.sep === `/` ? runtime.Vi(codexHome) : codexHome;
      const visualizationRoots = (getFeatureFlags().workspaceDir
        ? [workspacesRoot, normalizedCodexHome]
        : [normalizedCodexHome, workspacesRoot]
      )
        .filter((value) => value != null)
        .map((value) => ({
          boundary: value,
          directory: path.join(
            value,
            `visualizations`,
            ...normalizedThreadId.split(`/`),
            threadId,
          ),
        }));
      const filename = path.basename(requestedPath);
      if (!/^[a-z0-9]+(?:-[a-z0-9]+)*\.html$/.test(filename)) {
        throw Error(`Invalid visualization read request`);
      }
      let candidates = visualizationRoots.map(({ directory, boundary }) => ({
        path: path.join(directory, filename),
        boundary,
      }));

      if (path.isAbsolute(requestedPath)) {
        const normalizedPath = path.normalize(requestedPath);
        if (normalizedPath !== requestedPath.replaceAll(`/`, path.sep)) {
          throw Error(`Invalid visualization read request`);
        }
        const workspaceRoot = this.getThreadWorkspaceRoot?.(executionHost.id, threadId);
        const temporaryRoots = [
          ...(sandboxPolicy?.excludeSlashTmp === false && path.sep === `/`
            ? [`/tmp`, `/private/tmp`]
            : []),
          ...(sandboxPolicy?.excludeTmpdirEnvVar === false && executionHost.isLocal
            ? [temporaryDirectory(), realpathSync(temporaryDirectory())]
            : []),
        ];
        candidates = [
          await resolveAuthorizedAbsolutePath(
            normalizedPath,
            [
              ...visualizationRoots,
              ...[workspaceRoot, ...(sandboxPolicy?.writableRoots ?? []), ...temporaryRoots]
                .filter((value) => value != null)
                .map((value) => ({ directory: value, boundary: value })),
            ],
            executionHost,
            path,
          ),
        ];
      } else if (requestedPath !== filename) {
        throw Error(`Invalid visualization read request`);
      }

      for (const [index, candidate] of candidates.entries()) {
        try {
          const ancestors = runtime.Ki(path.dirname(candidate.path), candidate.boundary);
          if (ancestors == null) throw Error(`Invalid visualization read request`);
          const [fileStat, ...ancestorStats] = await Promise.all([
            executionHost.stat(candidate.path, { bypassCache: true, followSymlinks: false }),
            ...ancestors.map((ancestor: string) =>
              executionHost.stat(ancestor, { bypassCache: true, followSymlinks: false }),
            ),
          ]);
          if (
            !fileStat.isFile() ||
            fileStat.isSymbolicLink() ||
            ancestorStats.some((stat) => !stat.isDirectory() || stat.isSymbolicLink())
          ) {
            throw Error(`Invalid visualization read request`);
          }
          const contents = await executionHost
            .readFile(candidate.path)
            .then((value: unknown) => new Response(value).arrayBuffer());
          return contents.byteLength <= maxFileBytes
            ? { contents: Buffer.from(contents).toString(`utf8`) }
            : null;
        } catch (error) {
          if (!runtime.ds(error) || index === candidates.length - 1) throw error;
        }
      }
      return null;
    }
  }

  return { VisualizationService, isPathWithin, resolveAuthorizedAbsolutePath };
}
