/** Decide whether setup output removes or persists a worktree shell environment. */
export function getWorktreeShellEnvironmentAction(setup: { shellEnvironment?: unknown } | null | undefined):
  { kind: "remove" } | { kind: "write"; value: unknown } {
  return setup?.shellEnvironment == null
    ? { kind: "remove" }
    : { kind: "write", value: setup.shellEnvironment };
}
if (typeof module !== "undefined") module.exports = { getWorktreeShellEnvironmentAction };
