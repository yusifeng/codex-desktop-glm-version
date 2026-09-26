// worktree-onboarding-banner-controller —— Worktree 建议横幅及动作控制。

import * as appInitialChunk from "@rchunk/app-initial";
import * as appPrimaryChunk from "@rchunk/app-primary";
import * as appSharedChunk from "@rchunk/app-shared";
import * as runtimeChunk from "@rchunk/rolldown-runtime";
import * as stateChunk from "@rchunk/worktree-onboarding-state";

void runtimeChunk;

const appInitial = appInitialChunk as Record<string, any>;
const appPrimary = appPrimaryChunk as Record<string, any>;
const appShared = appSharedChunk as Record<string, any>;
const state = stateChunk as Record<string, any>;

let jsx: any;

function WorktreeOnboardingBanner({
  onDismiss,
  onLearnMore,
  onNewWorktree,
}: any): unknown {
  const intl = appShared.n4?.();
  const Banner = appPrimary.Sm;
  const text = (defaultMessage: string) => defaultMessage;
  const props = {
    title: text("Start another task without disturbing your work"),
    description: text("A Git worktree gives your task its own workspace"),
    primaryAction: { label: text("New worktree"), onClick: onNewWorktree },
    secondaryAction: { label: text("Learn more"), onClick: onLearnMore },
    dismissAction: {
      ariaLabel:
        intl?.formatMessage?.({
          defaultMessage: "Dismiss worktree suggestion",
        }) ?? "Dismiss worktree suggestion",
      icon: appShared.ig,
      onClick: onDismiss,
    },
  };
  return Banner == null
    ? jsx.jsx("aside", { className: "worktree-onboarding-banner", ...props })
    : jsx.jsx(Banner, props);
}

function WorktreeOnboardingBannerController(): unknown {
  initializeWorktreeOnboardingBanner();
  const scope = appShared.LX(appInitial.kht);
  const workspace = appShared.HX(appInitial.mdt);
  const onDismiss = () => scope.set(state.r, "dismissed");
  const onNewWorktree = () => {
    appInitial.xpn?.(scope, appShared.MA, { mode: "worktree" });
    appInitial.j3?.(
      scope,
      appInitial.kst?.({ cwd: workspace.cwd, hostId: workspace.hostId }),
      "worktree",
    );
    appInitial.xvt?.();
  };
  const onLearnMore = (event: unknown) =>
    appInitial.Oft?.({
      event,
      href: appInitial.QTt,
      initiator: "open_in_browser_bridge",
    });
  return jsx.jsx(WorktreeOnboardingBanner, {
    onDismiss,
    onLearnMore,
    onNewWorktree,
  });
}

function initializeWorktreeOnboardingBanner(): void {
  if (jsx != null) return;
  appShared.fI?.();
  appShared.FX?.();
  appInitial.eEt?.();
  appInitial.Dft?.();
  appInitial.ypn?.();
  appInitial.pdt?.();
  appInitial.Rht?.();
  appInitial.jst?.();
  appInitial.x3?.();
  appInitial.Evt?.();
  state.t?.();
  appPrimary.Cm?.();
  jsx = typeof appShared.I3 === "function" ? appShared.I3() : appShared.I3;
}

initializeWorktreeOnboardingBanner();

export { WorktreeOnboardingBannerController };
