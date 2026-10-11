/** Resolves a registered open target while preserving the existing error contract. */
function resolveOpenTarget<T>(registry: Map<string, T>, target: string): T {
  const descriptor = registry.get(target);
  if (descriptor == null) throw Error(`Unknown open target "${target}"`);
  return descriptor;
}

export { resolveOpenTarget };
if (typeof module !== `undefined`) module.exports = { resolveOpenTarget };
