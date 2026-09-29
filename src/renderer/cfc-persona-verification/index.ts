import "@rchunk/rolldown-runtime";
import * as appSharedChunk from "@rchunk/app-shared";
import * as appInitialChunk from "@rchunk/app-initial";

interface PersonaClient {
  destroy(): void;
  open(): void;
}

interface PersonaClientConstructor {
  new (options: {
    inquiryId: string;
    onCancel(): void;
    onComplete(): void;
    onError(error: { code?: string; message?: string }): void;
    onLoad(): void;
  }): PersonaClient;
}

interface PersonaModule {
  default: { Client: PersonaClientConstructor };
}

interface ApiClient {
  safePost(
    path: string,
    options: {
      additionalHeaders: Record<string, string>;
      requestBody: { enabled: boolean };
      signal: AbortSignal;
    },
  ): Promise<{ id: string }>;
}

interface OpenPersonaOptions {
  accountId?: string | null;
  onCancel(): void;
  onComplete(): void;
  onError(error: Error): void;
  onLoad?(): void;
}

const sharedRuntime = appSharedChunk as unknown as {
  H3?(): void;
  V3?<Value>(
    loader: () => Promise<Value>,
    dependencies: string[],
    importerUrl: string,
  ): Promise<Value>;
};
const initialRuntime = appInitialChunk as unknown as {
  cJt?(): void;
  rJt?: ApiClient;
};

const {
  H3: initializeChunkLoader,
  V3: loadChunk,
} = sharedRuntime;
const {
  cJt: initializeNavigation,
  rJt: api,
} = initialRuntime;

initializeNavigation?.();
initializeChunkLoader?.();

async function loadPersonaModule(): Promise<PersonaModule> {
  const loader = () => import("@rchunk/persona-runtime") as Promise<PersonaModule>;
  return loadChunk == null
    ? loader()
    : loadChunk(loader, ["persona-runtime", "rolldown-runtime"], import.meta.url);
}

function openPersonaVerification(options: OpenPersonaOptions): () => void {
  const controller = new AbortController();
  let destroyed = false;
  let client: PersonaClient | null = null;

  const destroy = () => {
    if (destroyed) return;
    destroyed = true;
    controller.abort();
    const activeClient = client;
    client = null;
    activeClient?.destroy();
  };
  const fail = (error: unknown) => {
    if (destroyed) return;
    destroy();
    options.onError(
      error instanceof Error
        ? error
        : new Error("Could not start Persona verification", { cause: error }),
    );
  };

  if (api == null) {
    fail(new Error("Persona verification API is unavailable"));
    return destroy;
  }

  void Promise.all([
    loadPersonaModule(),
    api.safePost("/compliance/npi_verification/persona/inquiries", {
      additionalHeaders:
        options.accountId == null
          ? {}
          : { "Chatgpt-Account-Id": options.accountId },
      requestBody: { enabled: true },
      signal: controller.signal,
    }),
  ])
    .then(([personaModule, inquiry]) => {
      if (destroyed) return;
      const nextClient = new personaModule.default.Client({
        inquiryId: inquiry.id,
        onLoad: () => {
          if (!destroyed) options.onLoad?.();
        },
        onComplete: () => {
          if (destroyed) return;
          destroy();
          options.onComplete();
        },
        onCancel: () => {
          if (destroyed) return;
          destroy();
          options.onCancel();
        },
        onError: (error) => {
          fail(new Error(error.message ?? error.code ?? "Persona verification failed", { cause: error }));
        },
      });
      if (destroyed) {
        nextClient.destroy();
        return;
      }
      client = nextClient;
      client.open();
    })
    .catch(fail);

  return destroy;
}

export { openPersonaVerification };
