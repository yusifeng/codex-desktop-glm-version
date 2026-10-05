/** Pure environment policy used by Windows Git executable resolution. */

function getEnvironmentValue(environment: Record<string, string | undefined>, key: string) {
  const actualKey = Object.keys(environment).reverse().find((candidate) => candidate.toLowerCase() === key.toLowerCase());
  return actualKey == null ? undefined : environment[actualKey]?.trim() || undefined;
}

function hasPathOverride(environment: Record<string, string | undefined> | undefined) {
  return environment != null && Object.keys(environment).some((key) => key.toLowerCase() === `path`);
}

function mergeProcessEnvironment(
  environment: Record<string, string | undefined> | undefined,
  processEnvironment: Record<string, string | undefined> = process.env,
) {
  const base = { ...processEnvironment };
  if (hasPathOverride(environment)) {
    for (const key of Object.keys(base)) if (key.toLowerCase() === `path`) delete base[key];
  }
  return { ...base, ...environment };
}

export { getEnvironmentValue, hasPathOverride, mergeProcessEnvironment };
if (typeof module !== `undefined`)
  module.exports = { getEnvironmentValue, hasPathOverride, mergeProcessEnvironment };
