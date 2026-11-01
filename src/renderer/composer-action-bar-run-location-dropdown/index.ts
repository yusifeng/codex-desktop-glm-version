import "@rchunk/rolldown-runtime";
import * as sharedChunk from "@rchunk/app-shared";
import * as initialChunk from "@rchunk/app-initial";
import * as primaryChunk from "@rchunk/app-primary";

export type RunLocation = "cloud" | "local";
export type UnavailableReason = string | null | undefined;
export interface RunLocationState {
  effectiveLocation: RunLocation | null;
  unavailableReasons: { cloud?: UnavailableReason; local?: UnavailableReason };
}

interface ComposerActionBarRunLocationDropdownProps {
  cloudUsesLocalExecutor?: boolean;
  isLocalExecutorStarting?: boolean;
  onRunLocationChange(location: RunLocation): void;
  runLocationState: RunLocationState;
}

const shared = sharedChunk as unknown as Record<string, unknown>;
const initial = initialChunk as unknown as Record<string, unknown>;
const primary = primaryChunk as unknown as Record<string, unknown>;

function callInitializer(value: unknown): void {
  if (typeof value === "function") value();
}

for (const value of [
  shared.xD,
  shared.WT,
  shared.h4,
  shared.K2,
  initial.Mp,
  shared.Zh,
  shared.If,
  shared.C_,
  shared.c_,
  initial.yb,
  initial.aW,
  primary.Ns,
]) callInitializer(value);

const jsx = (shared.I3 as () => {
  jsx(component: unknown, props: unknown): unknown;
  jsxs(component: unknown, props: unknown): unknown;
})();
const classNames = shared.m4 as (...values: unknown[]) => string;
const useIntl = shared.n4 as () => {
  formatMessage(message: Record<string, string>): string;
};
const FormattedMessage = shared.Y2;
const Tooltip = shared.o_;
const IconButton = shared.Yh;
const IconAsset = shared.S_;
const fallbackAsset = shared.GT;
const checkAsset = shared.bD;
const Dropdown = shared.kf;
const Menu = shared.jf as { Item: unknown; Title: unknown };
const CloudIcon = initial.vb;
const LocalIcon = initial.iW;
const parseUnavailableReason = initial.jp as (
  reason: UnavailableReason,
) => Record<string, unknown> | null | undefined;
const useShortcut = primary.Ps as (
  id: string,
  callback: () => void,
  options: { enabled: boolean },
) => void;

function workspaceDisabledTooltip(location: RunLocation): unknown {
  return jsx.jsxs("span", {
    children: [
      jsx.jsx(IconAsset, {
        "aria-hidden": false,
        asset: fallbackAsset,
        className: "me-1 inline-block align-middle",
      }),
      jsx.jsx(FormattedMessage, location === "local" ? {
        id: "composer.runLocation.local.tooltip.workspaceDisabled",
        defaultMessage: "Your workspace administrator has disabled Work on your computer",
        description: "Tooltip on the disabled local Work composer option when the member's workspace role does not grant the Work Local permission",
      } : {
        id: "composer.runLocation.cloud.tooltip.workspaceDisabled",
        defaultMessage: "Your workspace administrator has disabled Work in the cloud",
        description: "Tooltip on the disabled Cloud Work composer option when the member's workspace role does not grant the Work Cloud permission",
      }),
    ],
  });
}

function ComposerActionBarRunLocationDropdown({
  cloudUsesLocalExecutor,
  isLocalExecutorStarting,
  onRunLocationChange,
  runLocationState,
}: ComposerActionBarRunLocationDropdownProps): unknown {
  const intl = useIntl();
  const { effectiveLocation, unavailableReasons } = runLocationState;
  const parsedCloudUnavailableReason = parseUnavailableReason(unavailableReasons.cloud);
  let alternateLocation: RunLocation | null = null;
  if (effectiveLocation === "cloud" && unavailableReasons.local == null) {
    alternateLocation = "local";
  } else if (effectiveLocation === "local" && unavailableReasons.cloud == null) {
    alternateLocation = "cloud";
  }
  useShortcut(
    "composer.toggleWorkRunLocation",
    () => { if (alternateLocation != null) onRunLocationChange(alternateLocation); },
    { enabled: alternateLocation != null },
  );
  const triggerLabel = intl.formatMessage(isLocalExecutorStarting ? {
    id: "composer.runLocation.triggerLabel.localExecutorStarting",
    defaultMessage: "Choose where to run this task. Local execution is starting…",
    description: "Accessible label for the run location menu while local execution starts",
  } : {
    id: "composer.runLocation.triggerLabel",
    defaultMessage: "Choose where to run this chat",
    description: "Accessible label for the run location menu",
  });
  const triggerButton = jsx.jsx(Tooltip, {
    cloneCustomTrigger: true,
    tooltipContent: triggerLabel,
    children: jsx.jsxs(IconButton, {
      "aria-busy": isLocalExecutorStarting,
      "aria-label": triggerLabel,
      "data-composer-navigation-target": "run-location",
      color: "ghost",
      size: "composerSm",
      uniform: true,
      children: [
        effectiveLocation === "cloud" ? jsx.jsx(CloudIcon, {
          className: classNames("icon-xs", isLocalExecutorStarting && "motion-safe:animate-pulse"),
        }) : null,
        effectiveLocation === "local" ? jsx.jsx(LocalIcon, { className: "icon-xs" }) : null,
        effectiveLocation == null ? jsx.jsx(IconAsset, { "aria-hidden": false, asset: fallbackAsset }) : null,
      ],
    }),
  });
  const localDisabled = unavailableReasons.local != null;
  const localItem = jsx.jsx(Menu.Item, {
    LeftIcon: LocalIcon,
    SubText: jsx.jsx("span", {
      className: "text-codex-description",
      children: jsx.jsx(FormattedMessage, {
        id: "composer.runLocation.local.description",
        defaultMessage: "Read and edit local files with permission",
        description: "Description explaining file access when a task runs on the user's computer",
      }),
    }),
    allowWrap: true,
    disabled: localDisabled,
    focusableWhenDisabled: localDisabled,
    rightIconAsset: effectiveLocation === "local" ? checkAsset : undefined,
    tooltipText: unavailableReasons.local === "workspace-disabled"
      ? workspaceDisabledTooltip("local")
      : undefined,
    onClick: () => onRunLocationChange("local"),
    children: jsx.jsx(FormattedMessage, {
      id: "composer.runLocation.local.optionLabel",
      defaultMessage: "On your computer",
      description: "Option to run a task on the user's computer",
    }),
  });
  const cloudDisabled = unavailableReasons.cloud != null;
  const cloudTooltip = unavailableReasons.cloud === "workspace-disabled"
    ? workspaceDisabledTooltip("cloud")
    : parsedCloudUnavailableReason == null
      ? undefined
      : jsx.jsx(FormattedMessage, { ...parsedCloudUnavailableReason });
  const cloudItem = jsx.jsx(Menu.Item, {
    LeftIcon: CloudIcon,
    SubText: jsx.jsx("span", {
      className: "text-codex-description",
      children: jsx.jsx(FormattedMessage, cloudUsesLocalExecutor ? {
        id: "composer.runLocation.cloud.description.localExecutor",
        defaultMessage: "Can read and edit local files",
        description: "Description for the Cloud run location when local execution is enabled. Explains that ChatGPT runs in the cloud while retaining access to files on the user's computer.",
      } : {
        id: "composer.runLocation.cloud.description",
        defaultMessage: "Can't access local files unless attached",
        description: "Description explaining file access limitations when a task runs in the cloud",
      }),
    }),
    allowWrap: true,
    disabled: cloudDisabled,
    focusableWhenDisabled: cloudDisabled,
    rightIconAsset: effectiveLocation === "cloud" ? checkAsset : undefined,
    tooltipText: cloudTooltip,
    onClick: () => onRunLocationChange("cloud"),
    children: jsx.jsx(FormattedMessage, {
      id: "composer.runLocation.cloud",
      defaultMessage: "In the cloud",
      description: "Option to run a task in the cloud",
    }),
  });
  return jsx.jsxs(Dropdown, {
    align: "end",
    contentWidth: "sm",
    side: "top",
    triggerButton,
    children: [
      jsx.jsx(Menu.Title, {
        children: jsx.jsx(FormattedMessage, {
          id: "composer.runLocation.title.question",
          defaultMessage: "Where should this chat run?",
          description: "Header above the run location options in the composer action bar",
        }),
      }),
      localItem,
      cloudItem,
    ],
  });
}

export { ComposerActionBarRunLocationDropdown };
