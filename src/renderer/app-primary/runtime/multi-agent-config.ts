/** Read the validated ChatGPT multi-agent concurrency limit from remote auth config. */
export function getMaxConcurrentThreadsPerSession({
  authMethod,
  config,
}: {
  authMethod: unknown;
  config: unknown;
}): number | undefined {
  if (authMethod !== "chatgpt" || typeof config !== "object" || config == null || Array.isArray(config)) return;
  const features = Reflect.get(config, "features");
  if (typeof features !== "object" || features == null || Array.isArray(features)) return;
  const multiAgent = Reflect.get(features, "multi_agent_v2");
  if (typeof multiAgent !== "object" || multiAgent == null || Array.isArray(multiAgent)) return;
  const limit = Reflect.get(multiAgent, "max_concurrent_threads_per_session");
  return typeof limit === "number" && Number.isInteger(limit) && limit >= 8 ? limit : undefined;
}
