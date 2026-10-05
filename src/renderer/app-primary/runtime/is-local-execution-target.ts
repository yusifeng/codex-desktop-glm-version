/** Whether an execution target is local rather than the cloud target. */
export function isLocalExecutionTarget(target: string): boolean {
  return target !== "cloud";
}
