import { resolveStableMetadata } from "./git-stable-metadata-request-handler";

type StableMetadataDispatchDependencies = Parameters<typeof resolveStableMetadata>[1];

/** Dispatch the stable-metadata request while preserving its watcher semantics. */
async function dispatchStableMetadataRequest(
  method: string,
  params: any,
  deps: StableMetadataDispatchDependencies,
) {
  if (method !== `stable-metadata`)
    return { handled: false, result: undefined };
  return {
    handled: true,
    result: await resolveStableMetadata(params, deps),
  };
}

export { dispatchStableMetadataRequest };
if (typeof module !== "undefined")
  module.exports = { dispatchStableMetadataRequest };
