/** Pure projection of rev-parse and symbolic-ref responses into branch state. */

export function projectCurrentBranchState(
  head: { success?: boolean; stdout?: string | null } | null | undefined,
  symbolicHead: { success?: boolean; stdout?: string | null; code?: number } | null | undefined,
) {
  if (head?.success && head.stdout && head.stdout !== `HEAD`)
    return { type: `branch`, branch: head.stdout };
  if (symbolicHead?.success && symbolicHead.stdout)
    return { type: `branch`, branch: symbolicHead.stdout };
  return symbolicHead?.code === 1 ? { type: `detached` } : { type: `unknown` };
}

if (typeof module !== `undefined`) module.exports = { projectCurrentBranchState };
