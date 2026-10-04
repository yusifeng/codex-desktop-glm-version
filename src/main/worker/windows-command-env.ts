/** Pure environment merge policy for Windows command launchers. */
export function withWindowsCommandPath(
  environment: Record<string, string | undefined>,
  commandDirectory: string,
): Record<string, string | undefined> {
  const pathKey = environment.Path == null ? `PATH` : `Path`;
  const entries = (environment[pathKey] ?? ``).split(`;`).filter(Boolean);
  if (!entries.some((entry) => entry.toLowerCase() === commandDirectory.toLowerCase())) entries.unshift(commandDirectory);
  return { ...environment, [pathKey]: entries.join(`;`) };
}
if (typeof module !== `undefined`) module.exports = { withWindowsCommandPath };
