// Deferred clinician identity-verification banner. Release chunk: deferred-verification-banner-e314c15c65cb.js.
import "@rchunk/rolldown-runtime";
import * as appSharedChunk from "@rchunk/app-shared";
import * as appInitialChunk from "@rchunk/app-initial";
import * as personaChunk from "@rchunk/cfc-persona-verification";

interface Identity { accountId: string; userId: string }
interface VerificationRequirement { required?: boolean; loading?: boolean; accountError?: boolean; identity: Identity }
interface Scope {
  get(signal: unknown): { danger(message: unknown, options: Record<string, unknown>): void };
  set(signal: unknown, key: Identity, value: "closed" | "loading" | "open"): void;
}
interface ReactRuntime { useEffect(effect: () => void | (() => void), dependencies: readonly unknown[]): void }
interface JsxRuntime { jsx(type: unknown, props: Record<string, unknown>, key?: string): unknown }
interface SharedRuntime {
  $3(): unknown; BX<T>(signal: unknown, key: Identity): T; FX(): void; HX<T>(signal: unknown): T; I3(): JsxRuntime; K2(): void; LX(signal: unknown): Scope; QI(): void;
  Y2: unknown; Yh: unknown; ZI: unknown; Zh(): void; e6(): ReactRuntime; gx: unknown; lk(): void; lw(): void; pk: unknown;
}
interface InitialRuntime {
  Qgn(): void; aNt(): void; iNt: unknown; i_n(): { pathname: string }; n7: unknown; nNt: unknown; oNt(scope: Scope): void; r7(): void; rNt: unknown;
}
interface PersonaRuntime {
  n(options: { accountId: string; onLoad(): void; onComplete(): void; onCancel(): void; onError(): void }): () => void;
  t(): void;
}
const shared = appSharedChunk as unknown as SharedRuntime;
const initial = appInitialChunk as unknown as InitialRuntime;
const persona = personaChunk as unknown as PersonaRuntime;
let React: ReactRuntime;
let jsx: JsxRuntime;
let initialized = false;

function translatedMessage(id: string, defaultMessage: string, description: string): unknown {
  return jsx.jsx(shared.Y2, { id, defaultMessage, description });
}

function VerificationAnnouncement({ isOpen, isLoading, onVerify }: { isOpen: boolean; isLoading: boolean; onVerify(): void }): unknown {
  return jsx.jsx(initial.n7, {
    variant: "announcement",
    icon: jsx.jsx(shared.gx, {}),
    title: translatedMessage("healthcareVerificationPage.workspaceVerificationTitle", "Verify your identity to start chatting", "Heading above the composer explaining identity verification is required in a provisional clinician workspace"),
    content: translatedMessage("healthcareVerificationPage.workspaceVerificationDescription", "Complete verification with Persona before sending your first message.", "Explains that Persona verification must complete before a clinician can send a message"),
    customCtas: jsx.jsx(shared.Yh, {
      type: "button", size: "dialog", disabled: isOpen, loading: isLoading, onClick: onVerify,
      children: translatedMessage("healthcareVerificationPage.workspaceVerificationCta", "Verify", "Button that opens Persona verification to unlock a clinician's message composer"),
    }),
  });
}

function VerificationForIdentity({ identity }: { identity: Identity }): unknown {
  const scope = shared.LX(shared.ZI);
  const dialogState = shared.BX<"closed" | "loading" | "open">(initial.iNt, identity);
  const query = shared.BX<{ refetch(): void }>(initial.nNt, identity);
  const isOpen = dialogState !== "closed";

  React.useEffect(() => {
    if (!isOpen) return;
    let disposed = false;
    const close = (): void => scope.set(initial.iNt, identity, "closed");
    const showStartError = (): void => {
      if (disposed) return;
      close();
      scope.get(shared.pk).danger(
        translatedMessage("healthcareVerificationPage.workspaceVerificationStartError", "We couldn’t start identity verification. Please try again.", "Error shown when Persona identity verification cannot start inside a provisional clinician workspace"),
        { errorAnalytics: { toastId: "healthcareVerificationPage.workspaceVerificationStartError" } },
      );
    };
    scope.set(initial.iNt, identity, "loading");
    const disposePersona = persona.n({
      accountId: identity.accountId,
      onLoad: () => scope.set(initial.iNt, identity, "open"),
      onComplete: () => { close(); query.refetch(); },
      onCancel: close,
      onError: showStartError,
    });
    return () => { disposed = true; disposePersona(); close(); };
  }, [identity.accountId, isOpen, query.refetch, scope, identity.userId]);

  return jsx.jsx(VerificationAnnouncement, {
    isOpen,
    isLoading: dialogState === "loading",
    onVerify: () => initial.oNt(scope),
  });
}

function DeferredClinicianVerificationBanner(): unknown {
  initialize();
  const scope = shared.LX(shared.ZI);
  const requirement = shared.HX<VerificationRequirement | null | undefined>(initial.rNt);
  const { pathname } = initial.i_n();
  if (!requirement?.required || requirement.loading || pathname === "/onboarding") return null;
  if (requirement.accountError) {
    return jsx.jsx(initial.n7, {
      type: "error",
      content: translatedMessage("healthcareVerificationPage.workspaceVerificationStatusError", "We couldn’t check your verification status", "Error shown when the clinician workspace verification requirements cannot be loaded"),
      primaryCtaText: translatedMessage("healthcareVerificationPage.workspaceVerificationStatusRetry", "Retry", "Button to retry loading clinician workspace verification requirements"),
      onPrimaryCtaClick: () => initial.oNt(scope),
    });
  }
  const { identity } = requirement;
  return jsx.jsx(VerificationForIdentity, { identity }, identity.accountId + ":" + identity.userId);
}

function initialize(): void {
  if (initialized) return;
  initialized = true;
  shared.$3(); shared.FX(); React = shared.e6(); shared.K2(); initial.Qgn(); initial.r7(); shared.Zh(); shared.lw(); shared.lk(); shared.QI(); initial.aNt(); persona.t(); jsx = shared.I3();
}

initialize();
export { DeferredClinicianVerificationBanner };
