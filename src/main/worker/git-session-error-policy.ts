export function isWorkingDirectoryPermissionError(error: unknown): boolean {
  const message = (error instanceof Error ? error.message : String(error)).toLowerCase();
  return message.includes(`unable to read current working directory`) && (message.includes(`operation not permitted`) || message.includes(`permission denied`));
}
export function isGitProcessTimeout(error: unknown): boolean {
  return error instanceof Error && error.message.includes(`git process timed out after`);
}
if (typeof module !== `undefined`) module.exports = { isWorkingDirectoryPermissionError, isGitProcessTimeout };
