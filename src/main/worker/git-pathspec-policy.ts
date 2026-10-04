export interface GitCommandFailure { success: boolean; code?: number | null; stderr: string }
export function isSparsePathspecUnsupported(result: GitCommandFailure): boolean {
  return !result.success && result.code === 129 && result.stderr.includes(`unknown option`) && result.stderr.includes(`sparse`);
}
if (typeof module !== `undefined`) module.exports = { isSparsePathspecUnsupported };
