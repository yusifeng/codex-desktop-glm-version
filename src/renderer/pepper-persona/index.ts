import "@rchunk/rolldown-runtime";
import {
  H3 as initializeLazyComponents,
  vW as accountUserHeader,
  wL as initializeWindowRuntime,
} from "@rchunk/app-shared";
import {
  cJt as initializeApiClient,
  rJt as apiClient,
} from "@rchunk/app-initial";

interface PersonaClient {
  destroy(): void;
  open(): void;
}

interface PersonaOptions {
  accountId: string;
  kind?: "age" | "guardian";
  onCancel?(): void;
  onComplete(): void;
  onError(): void;
  onLoad?(): void;
}

function openPersonaVerification({
  accountId,
  kind = "age",
  onLoad,
  onComplete,
  onCancel,
  onError,
}: PersonaOptions): () => void {
  const controller = new AbortController();
  let destroyed = false;
  let client: PersonaClient | null = null;
  const destroy = (): void => {
    destroyed = true;
    controller.abort();
    client?.destroy();
    client = null;
  };
  const path = kind === "guardian"
    ? "/compliance/guardian_verification/persona/inquiries"
    : "/compliance/age_verification/persona/inquiries";
  const headers = kind === "guardian"
    ? { "ChatGPT-Account-ID": accountId, [accountUserHeader]: accountId }
    : { "ChatGPT-Account-ID": accountId };
  Promise.all([
    import("@rchunk/persona-runtime"),
    apiClient.safePost<{ id: string }>(path, {
      additionalHeaders: headers,
      requestBody: { enabled: true },
      signal: controller.signal,
    }),
  ]).then(([persona, inquiry]) => {
    if (destroyed) return;
    client = new persona.default.Client({
      inquiryId: inquiry.id,
      onLoad: () => { if (!destroyed) onLoad?.(); },
      onComplete: () => { if (!destroyed) { destroy(); onComplete(); } },
      onCancel: () => { if (!destroyed) { destroy(); onCancel?.(); } },
      onError: () => { if (!destroyed) { destroy(); onError(); } },
    });
    client.open();
  }).catch(() => {
    if (!destroyed) { destroy(); onError(); }
  });
  return destroy;
}

function initializePepperPersona(): void {
  initializeWindowRuntime();
  initializeApiClient();
  initializeLazyComponents();
}

export { openPersonaVerification as n, initializePepperPersona as t };
