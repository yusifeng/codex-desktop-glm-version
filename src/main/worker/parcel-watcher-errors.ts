/** Identifies filesystem errors that mean a watched directory is absent. */
function isParcelWatcherMissingPathError(error: unknown, code: string): boolean {
  return typeof error === `object` && error !== null && `code` in error &&
    (error as { code?: unknown }).code === code;
}

export { isParcelWatcherMissingPathError };
if (typeof module !== `undefined`) module.exports = { isParcelWatcherMissingPathError };
