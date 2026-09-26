// beacon-modal —— Pepper onboarding Beacon 的账号守卫和懒加载外壳。

import * as appInitialChunk from "@rchunk/app-initial";
import * as appSharedChunk from "@rchunk/app-shared";
import * as runtimeChunk from "@rchunk/rolldown-runtime";

void runtimeChunk;

const appInitial = appInitialChunk as Record<string, any>;
const appShared = appSharedChunk as Record<string, any>;

interface ReactRuntime {
  useEffect(effect: () => void, dependencies: unknown[]): void;
}

interface JsxRuntime {
  jsx(type: unknown, props: Record<string, unknown>): unknown;
}

let React: ReactRuntime | null = null;
let jsx: JsxRuntime | null = null;
let LazyPepperOnboardingModal: unknown = null;

function PepperOnboardingBeaconModal({
  accountId,
  onClose,
}: {
  accountId: string;
  onClose(): void;
}): unknown {
  initializePepperOnboardingBeaconModal();
  const scope = appShared.LX(appShared.ZI);
  const activeAccountId = appShared.HX(appInitial.U6t);
  (React as ReactRuntime).useEffect(() => {
    if (activeAccountId !== accountId) {
      appInitial.zzt?.(scope, PepperOnboardingBeaconModal);
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
  appShared.FX?.();
  appInitial.Sqt?.();
  appShared.qm?.();
  appInitial.Vzt?.();
  appShared.QI?.();
  React ??= typeof appShared.e6 === "function" ? appShared.e6() : appShared.e6;
  jsx ??= typeof appShared.I3 === "function" ? appShared.I3() : appShared.I3;
  const load = async () =>
    (await import("@rchunk/pepper-onboarding-modal")).PepperOnboardingModal;
  LazyPepperOnboardingModal =
    typeof appShared.Jm === "function" ? appShared.Jm(load) : load;
}

initializePepperOnboardingBeaconModal();

export { PepperOnboardingBeaconModal };
