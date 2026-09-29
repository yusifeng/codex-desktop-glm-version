import "@rchunk/rolldown-runtime";
import {
  H3 as initializePreloadRuntime,
  V3 as loadWithPreload,
} from "@rchunk/app-shared";
import { p4 as initializeAsyncRuntimeImport } from "@rchunk/app-shared";

interface AnalyticsTarget {
  _plugins?: unknown;
}

const initializeAsyncRuntime = initializeAsyncRuntimeImport as unknown as () => void;
const preloadDependencies = [
  "./index.umd-4af9c310b668.js",
  "./rolldown-runtime-2d059c5e81f4.js",
] as const;

initializeAsyncRuntime();
initializePreloadRuntime();

async function loadLegacyVideoPlugins(target: AnalyticsTarget): Promise<void> {
  const plugins = await loadWithPreload(
    () =>
      // @ts-expect-error The semantic alias is registered by the renderer chunk manifest.
      import("@rchunk/legacy-video-plugins-runtime").then(
        (module) => module.default,
      ),
    preloadDependencies,
    import.meta.url,
  );
  target._plugins = plugins;
}

export { loadLegacyVideoPlugins };
