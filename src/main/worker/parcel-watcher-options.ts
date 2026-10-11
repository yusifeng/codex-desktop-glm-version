type PosixPathApi = { relative(from: string, to: string): string };

/** Builds parcel/inotify ignore globs relative to the subscription root. */
function buildParcelWatcherOptions(pathApi: PosixPathApi, root: string, ignoredPaths: string[]): { backend: string; ignore: string[] } {
  return {
    backend: `inotify`,
    ignore: ignoredPaths.map((path) => {
      const relative = /[\\?*()[\]{}!+@]/.test(path) ? pathApi.relative(root, path) : path;
      return /[\\?*()[\]{}!+@]/.test(relative) ? `${relative.replace(/[\\?*()[\]{}!+@]/g, `\\$&`)}{,/**}` : relative;
    }),
  };
}

export { buildParcelWatcherOptions };
if (typeof module !== `undefined`) module.exports = { buildParcelWatcherOptions };
