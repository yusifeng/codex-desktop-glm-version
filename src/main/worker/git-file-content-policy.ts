/** Pure path and Git object-ref policy for repository file reads. */

type PlatformPath = { isAbsolute(path: string): boolean };

/** Returns whether a relative path escapes the repository root. */
function isGitFilePathOutsideRepository(relativePath: string, platformPath: PlatformPath): boolean {
  const normalized = relativePath.replaceAll(`\\`, `/`);
  return platformPath.isAbsolute(relativePath) || normalized === `..` || normalized.startsWith(`../`);
}

/** Converts a platform-relative path to the Git object ref used by `git show`. */
function resolveGitFileObjectRef(relativePath: string, pathSeparator: string, ref?: string): string | null {
  const gitPath = relativePath.split(pathSeparator).join(`/`);
  if (gitPath === `` || gitPath === `.` || gitPath === `..` || gitPath.startsWith(`../`)) return null;
  return ref === `head` ? `HEAD:${gitPath}` : `:${gitPath}`;
}

export { isGitFilePathOutsideRepository, resolveGitFileObjectRef };
if (typeof module !== `undefined`) module.exports = { isGitFilePathOutsideRepository, resolveGitFileObjectRef };
