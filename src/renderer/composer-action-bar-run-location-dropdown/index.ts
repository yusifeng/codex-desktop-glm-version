// composer-action-bar-run-location-dropdown —— Work 任务的本机/云端运行位置选择器。
import "@rchunk/app-shared";
import "@rchunk/app-initial";
import "@rchunk/app-primary";

export type RunLocation = "local" | "cloud";
export type UnavailableReason = string | null | undefined;
export interface RunLocationState { effectiveLocation: RunLocation | null; unavailableReasons: { local?: UnavailableReason; cloud?: UnavailableReason } }

function reasonTooltip(location: RunLocation, reason: UnavailableReason): string | undefined {
  if (reason == null) return;
  if (reason === "workspace-disabled") return location === "local"
    ? "Your workspace administrator has disabled Work on your computer"
    : "Your workspace administrator has disabled Work in the cloud";
  return String(reason);
}

function ComposerActionBarRunLocationDropdown(input: {
  cloudUsesLocalExecutor?: boolean;
  isLocalExecutorStarting?: boolean;
  onRunLocationChange(location: RunLocation): void;
  runLocationState: RunLocationState;
}) {
  const { effectiveLocation, unavailableReasons } = input.runLocationState;
  const alternate = effectiveLocation === "cloud" && unavailableReasons.local == null
    ? "local"
    : effectiveLocation === "local" && unavailableReasons.cloud == null ? "cloud" : null;
  const option = (location: RunLocation) => ({
    location,
    selected: effectiveLocation === location,
    disabled: unavailableReasons[location] != null,
    focusableWhenDisabled: unavailableReasons[location] != null,
    label: location === "local" ? "On your computer" : "In the cloud",
    description: location === "local"
      ? "Read and edit local files with permission"
      : input.cloudUsesLocalExecutor ? "Can read and edit local files" : "Can't access local files unless attached",
    tooltip: reasonTooltip(location, unavailableReasons[location]),
    select: () => { if (unavailableReasons[location] == null) input.onRunLocationChange(location); },
  });
  return {
    kind: "composer-action-bar-run-location-dropdown" as const,
    ariaBusy: input.isLocalExecutorStarting === true,
    ariaLabel: input.isLocalExecutorStarting
      ? "Choose where to run this task. Local execution is starting…"
      : "Choose where to run this chat",
    title: "Where should this chat run?",
    effectiveLocation,
    options: [option("local"), option("cloud")] as const,
    keyboardToggleEnabled: alternate != null,
    toggle: () => { if (alternate != null) input.onRunLocationChange(alternate); },
  };
}

export { ComposerActionBarRunLocationDropdown };
