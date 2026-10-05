/** Read a repository file from HEAD or the index without exposing paths outside the worktree. */
import { isGitFilePathOutsideRepository, resolveGitFileObjectRef } from './git-file-content-policy';

export type GitFileContentDependencies = {
  getWorktreeRepository: (cwd: string, host: any) => Promise<{ root?: string } | null | undefined>;
  platformPath: () => Promise<{
    isAbsolute(path: string): boolean;
    join(...paths: string[]): string;
    relative(from: string, to: string): string;
    sep: string;
  }>;
  runGit: (root: string, args: string[], host: any, options: Record<string, unknown>) => Promise<any>;
  detectMimeType?: (bytes: Uint8Array) => Promise<string | null> | string | null;
};

export async function readGitFileContent(
  params: { cwd: string; path: string; ref?: string },
  host: any,
  signal: AbortSignal | undefined,
  dependencies: GitFileContentDependencies,
) {
  try {
    const repository = await dependencies.getWorktreeRepository(params.cwd, host);
    const root = repository?.root;
    if (root == null || root === ``) return { contentsBase64: null };
    const platformPath = await dependencies.platformPath();
    const cwd = platformPath.isAbsolute(params.cwd)
      ? params.cwd
      : platformPath.join(root, params.cwd);
    const relativePath = platformPath.relative(root, platformPath.join(cwd, params.path));
    if (isGitFilePathOutsideRepository(relativePath, platformPath)) return { contentsBase64: null };
    const objectRef = resolveGitFileObjectRef(relativePath, platformPath.sep, params.ref);
    if (objectRef == null) return { contentsBase64: null };
    const result = await dependencies.runGit(root, [`show`, objectRef], host, {
      collectStdoutBuffer: true,
      trim: false,
      signal,
    });
    if (result?.code !== 0) return { contentsBase64: null };
    const bytes: Uint8Array | undefined = result.stdoutBuffer;
    if (bytes == null || bytes.byteLength === 0) return { contentsBase64: null };
    const mimeType = dependencies.detectMimeType == null ? null : await dependencies.detectMimeType(bytes);
    return {
      contentsBase64: Buffer.from(bytes).toString(`base64`),
      ...(mimeType == null ? {} : { mimeType }),
    };
  } catch {
    return { contentsBase64: null };
  }
}

if (typeof module !== `undefined`) module.exports = { readGitFileContent };
