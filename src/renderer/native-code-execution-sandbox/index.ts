// Native code-execution sandbox connector. Release chunk: native-code-execution-sandbox-fa3ec5081637.js.
import "@rchunk/rolldown-runtime";
import {
  createSandboxPartition,
  initializeSandboxUrls,
} from "../app-shared/runtime/sandbox-url";
import * as appInitialChunk from "@rchunk/app-initial";
import * as sandboxConnectionChunk from "@rchunk/code-execution-sandbox-connection";

interface ClosablePort {
  close(): void;
}
interface SandboxBootstrap {
  ports: Record<string, ClosablePort | null | undefined> & {
    prepareEnvironment?: ClosablePort | null;
    runUserCode?: ClosablePort | null;
    screenshot?: ClosablePort | null;
    stop?: ClosablePort | null;
  };
  replyPort: ClosablePort;
  [key: string]: unknown;
}
interface SandboxWebview {
  setAttribute(name: string, value: string): void;
}
interface AppInitialRuntime {
  Mnt(input: {
    origin: string;
    sandboxId: string;
    signal?: AbortSignal;
    sourceUrl: string;
    webview: SandboxWebview;
  }): Promise<SandboxBootstrap>;
  Pnt(): void;
  jon(origin: string): string;
}
interface SandboxConnectionRuntime {
  n(): void;
  t(input: SandboxBootstrap & { host: unknown; signal?: AbortSignal }): unknown;
}
const {
  Mnt: createSandboxBootstrap,
  Pnt: initializeAppSandbox,
  jon: hashSandboxOrigin,
} = appInitialChunk as unknown as AppInitialRuntime;
const { n: initializeSandboxConnection, t: connectSandbox } =
  sandboxConnectionChunk as unknown as SandboxConnectionRuntime;

async function connectNativeCodeExecutionSandbox({
  webview,
  sourceUrl,
  host,
  signal,
}: {
  webview: SandboxWebview;
  sourceUrl: string;
  host: unknown;
  signal?: AbortSignal;
}): Promise<unknown | null> {
  const url = new URL(sourceUrl);
  const sandboxId = "code-execution-" + hashSandboxOrigin(url.origin);
  url.searchParams.set("app", "skybridge");
  url.searchParams.set("unsafeSkipTargetOriginCheck", "true");
  webview.setAttribute("partition", createSandboxPartition(sandboxId));
  const bootstrap = await createSandboxBootstrap({
    origin: url.origin,
    sandboxId,
    signal,
    sourceUrl: url.href,
    webview,
  });
  if (
    bootstrap.ports.prepareEnvironment == null ||
    bootstrap.ports.runUserCode == null ||
    bootstrap.ports.screenshot == null ||
    bootstrap.ports.stop == null
  ) {
    for (const port of Object.values(bootstrap.ports)) port?.close();
    bootstrap.replyPort.close();
    return null;
  }
  return connectSandbox({ ...bootstrap, host, signal });
}

initializeSandboxConnection();
initializeSandboxUrls();
initializeAppSandbox();

export { connectNativeCodeExecutionSandbox };
