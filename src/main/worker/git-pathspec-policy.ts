export interface GitCommandFailure { success: boolean; code?: number | null; stderr: string }
export function isSparsePathspecUnsupported(result: GitCommandFailure): boolean {
  return !result.success && result.code === 129 && result.stderr.includes(`unknown option`) && result.stderr.includes(`sparse`);
}
export function createGitAddFailure(message: string) {
  return { code: null, command: `git add`, stderr: message, stderrBytes: Buffer.byteLength(message, `utf8`), stdout: ``, stdoutBytes: 0, success: false };
}
if (typeof module !== `undefined`) module.exports = { isSparsePathspecUnsupported, createGitAddFailure };
