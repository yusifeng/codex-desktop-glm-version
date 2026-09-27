import "@rchunk/rolldown-runtime";
import {
  I3 as getJsxRuntime,
  K2 as initializeInternationalization,
  Y2 as FormattedMessage,
  Yh as Button,
  bD as selectedIconAsset,
  db as FilterIcon,
  jf as Menu,
  kf as Dropdown,
  lw as initializeIcons,
  n4 as useCurrentAccount,
} from "@rchunk/app-shared";
import {
  Bfn as initializeHostRuntime,
  Yg as DefaultLocalIcon,
  gb as HostIcon,
  ql as SelectedHostTrigger,
  ugn as localHostId,
} from "@rchunk/app-initial";

interface HostOption {
  displayName: string;
  hostId: string;
}

interface SettingsHostDropdownProps {
  align?: "center" | "end" | "start";
  connectedRemoteConnections: HostOption[];
  contentWidth?: string;
  disabled?: boolean;
  includeLocalHost?: boolean;
  localIcon?: unknown;
  localLabel?: string;
  onSelectHost(hostId: string): void;
  selectedHostId: string;
  showConnectedIndicator?: boolean;
  triggerVariant?: "filter" | "selected-host";
}

interface IntlAccount {
  formatMessage(message: { defaultMessage: string; id: string }): string;
}

const jsx = getJsxRuntime();

function ConnectedIndicator(): unknown {
  return jsx.jsx("span", {
    "aria-hidden": true,
    className: "block size-2 shrink-0 rounded-full bg-green-500",
  });
}

function SettingsHostDropdown({
  connectedRemoteConnections,
  disabled = false,
  includeLocalHost = true,
  onSelectHost,
  selectedHostId,
  align = "end",
  contentWidth = "menuWide",
  localIcon = DefaultLocalIcon,
  localLabel,
  showConnectedIndicator = false,
  triggerVariant = "selected-host",
}: SettingsHostDropdownProps): unknown {
  const intl = useCurrentAccount() as IntlAccount;
  const selectedRemote = connectedRemoteConnections.find(
    (connection) => connection.hostId === selectedHostId,
  ) ?? null;
  const resolvedLocalLabel = localLabel ?? intl.formatMessage({
    id: "settings.hostDropdown.local",
    defaultMessage: "Local",
  });
  const options = [
    ...(includeLocalHost
      ? [{ hostId: localHostId, displayName: resolvedLocalLabel }]
      : []),
    ...connectedRemoteConnections,
  ];
  const selectedLabel = selectedRemote?.displayName ?? resolvedLocalLabel;
  const trigger = triggerVariant === "filter"
    ? jsx.jsx(Button, {
        className: "sidebar-icon-button sidebar-hover-icon-button-tint",
        "aria-label": intl.formatMessage({
          id: "settings.hostDropdown.filter",
          defaultMessage: "Filter settings by host",
        }),
        color: "ghostMuted",
        disabled,
        size: "compact",
        uniform: true,
        children: jsx.jsx(FilterIcon as (props: Record<string, unknown>) => unknown, {}),
      })
    : jsx.jsxs(SelectedHostTrigger as (props: Record<string, unknown>) => unknown, {
        disabled,
        chevronClassName: disabled ? "hidden" : undefined,
        children: [
          selectedRemote == null
            ? jsx.jsx(localIcon as (props: Record<string, unknown>) => unknown, {
                className: "icon-xs shrink-0 text-default",
              })
            : jsx.jsx(HostIcon as (props: Record<string, unknown>) => unknown, {
                className: "icon-xs shrink-0",
                hostId: selectedRemote.hostId,
              }),
          jsx.jsx("span", {
            className: "truncate text-start text-default",
            children: selectedLabel,
          }),
          selectedRemote != null && showConnectedIndicator
            ? jsx.jsx(ConnectedIndicator, {})
            : null,
        ],
      });
  if (disabled) return trigger;
  const MenuTitle = (Menu as { Title: unknown }).Title;
  const MenuSection = (Menu as { Section: unknown }).Section;
  const MenuItem = (Menu as { Item: unknown }).Item;
  return jsx.jsxs(Dropdown as (props: Record<string, unknown>) => unknown, {
    align,
    contentWidth,
    triggerButton: trigger,
    children: [
      jsx.jsx(MenuTitle, {
        children: jsx.jsx(FormattedMessage, {
          id: "settings.hostDropdown.title",
          defaultMessage: "Host",
        }),
      }),
      jsx.jsx(MenuSection, {
        className: "max-h-40 overflow-y-auto",
        children: options.map((option) =>
          jsx.jsx(MenuItem, {
            rightIconAsset:
              option.hostId === selectedHostId ? selectedIconAsset : undefined,
            onSelect: () => onSelectHost(option.hostId),
            children: jsx.jsxs("span", {
              className: "flex min-w-0 items-center gap-2",
              children: [
                option.hostId === localHostId
                  ? jsx.jsx(localIcon as (props: Record<string, unknown>) => unknown, {
                      className: "icon-xs shrink-0",
                    })
                  : jsx.jsx(HostIcon as (props: Record<string, unknown>) => unknown, {
                      className: "icon-xs shrink-0",
                      hostId: option.hostId,
                    }),
                jsx.jsx("span", { className: "truncate", children: option.displayName }),
                option.hostId !== localHostId && showConnectedIndicator
                  ? jsx.jsx(ConnectedIndicator, {})
                  : null,
              ],
            }),
          }, option.hostId),
        ),
      }),
    ],
  });
}

function initializeSettingsHostDropdown(): void {
  initializeInternationalization();
  initializeIcons();
  initializeHostRuntime();
}

export { initializeSettingsHostDropdown as n, SettingsHostDropdown as t };
