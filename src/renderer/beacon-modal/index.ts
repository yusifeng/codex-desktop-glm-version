// beacon-modal —— Pepper onboarding Beacon 的账号守卫和懒加载外壳。

import * as appInitialChunk from "@rchunk/app-initial";
import * as appSharedChunk from "@rchunk/app-shared";
import * as runtimeChunk from "@rchunk/rolldown-runtime";
import type {
  JsxRuntime,
  LazyComponent,
  ReactRuntime,
} from "@rchunk/app-shared";

void runtimeChunk;

export interface PepperOnboardingBeaconModalProps
  extends Record<string, unknown> {
  accountId: string;
  onClose(): void;
}

const pepperModalDependencies = [
  "./modal-66828775ce7a.js",
  "./rolldown-runtime-2d059c5e81f4.js",
  "./app-shared-7b9edc1bfb7f.js",
  "./app-shared-fa570b9eb9dd.css",
  "./app-initial-51da50e6c6e3.js",
  "./app-initial-e8ceb32eb626.css",
  "./persona-a3bb93441dce.js",
  "./chatgpt-accent-messages-4d4e312a3596.js",
] as const;

const {
  $3: initializeRuntimeLazy,
  FX: initializeSignalRuntime,
  H3: initializePreloadHelper,
  HX: useSignalValue,
  I3: getJsxRuntime,
  Jm: createLazyComponent,
  LX: useSignalScope,
  QI: initializeAppScope,
  V3: preloadModule,
  ZI: appScope,
  e6: getReactRuntime,
  qm: initializeQueryRuntime,
} = appSharedChunk;
const {
  Sqt: initializePepperOnboarding,
  U6t: activeAccountIdSignal,
  Vzt: initializeDialogHost,
  zzt: dismissDialog,
} = appInitialChunk;

let React: ReactRuntime | null = null;
let jsx: JsxRuntime | null = null;
let LazyPepperOnboardingModal: LazyComponent<PepperOnboardingBeaconModalProps> | null =
  null;

function PepperOnboardingBeaconModal({
  accountId,
  onClose,
}: PepperOnboardingBeaconModalProps): unknown {
  initializePepperOnboardingBeaconModal();
  const scope = useSignalScope(appScope);
  const activeAccountId = useSignalValue(activeAccountIdSignal);
  (React as ReactRuntime).useEffect(() => {
    if (activeAccountId !== accountId) {
      dismissDialog(scope, PepperOnboardingBeaconModal);
    }
  }, [accountId, activeAccountId, scope]);
  if (activeAccountId !== accountId) return null;
  return (jsx as JsxRuntime).jsx(LazyPepperOnboardingModal, {
    accountId,
    onClose,
  });
}

function initializePepperOnboardingBeaconModal(): void {
  if (LazyPepperOnboardingModal != null) return;
  initializeRuntimeLazy();
  initializeSignalRuntime();
  React = getReactRuntime();
  initializePepperOnboarding();
  initializeQueryRuntime();
  initializeDialogHost();
  initializeAppScope();
  jsx = getJsxRuntime();
  initializePreloadHelper();
  LazyPepperOnboardingModal =
    createLazyComponent<PepperOnboardingBeaconModalProps>(async () => {
      const loaded = await preloadModule(
        async () => import("@rchunk/pepper-onboarding-modal"),
        pepperModalDependencies,
        import.meta.url,
      );
      return loaded.PepperOnboardingModal;
    });
}

initializePepperOnboardingBeaconModal();

export { PepperOnboardingBeaconModal };
