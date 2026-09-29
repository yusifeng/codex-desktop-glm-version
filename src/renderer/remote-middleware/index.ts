// remote-middleware —— 按配置并行加载 Segment 远程中间件。

import "@rchunk/rolldown-runtime";
import "@rchunk/app-shared";
// @ts-expect-error Preserved release asset; its semantic alias is registered by the shared manifest owner.
import * as loadScriptChunk from "@rchunk/load-script";

interface Logger {
  log(level: "error", reason: unknown): void;
  stats: { increment(metric: "failed_remote_middleware"): void };
}
interface RemoteMiddlewareSettings { enabledMiddleware?: Record<string, boolean | null | undefined> }
interface LoadScriptRuntime {
  a(): string;
  m(): boolean;
  n(url: string): Promise<unknown>;
  o(): void;
}
type RemoteMiddleware = unknown;

const { a: getRemoteBaseUrl, m: remoteLoadingDisabled, n: loadScript, o: initializeLoadScript } = loadScriptChunk as unknown as LoadScriptRuntime;

async function remoteMiddlewares(logger: Logger, settings: RemoteMiddlewareSettings, obfuscateNames = false): Promise<RemoteMiddleware[]> {
  if (remoteLoadingDisabled()) return [];
  const baseUrl = getRemoteBaseUrl();
  const names = Object.entries(settings.enabledMiddleware ?? {}).filter(([, enabled]) => enabled === true).map(([name]) => name);
  const loaded = await Promise.all(names.map(async (configuredName) => {
    const name = configuredName.replace("@segment/", "");
    const remoteName = obfuscateNames ? btoa(name).replace(/=/g, "") : name;
    const url = baseUrl + "/middleware/" + remoteName + "/latest/" + remoteName + ".js.gz";
    try {
      await loadScript(url);
      return (window as unknown as Record<string, unknown>)[name + "Middleware"];
    } catch (reason) {
      logger.log("error", reason);
      logger.stats.increment("failed_remote_middleware");
      return undefined;
    }
  }));
  return loaded.filter((middleware): middleware is RemoteMiddleware => middleware != null);
}

initializeLoadScript();
export { remoteMiddlewares };
