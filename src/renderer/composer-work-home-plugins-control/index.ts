import "@rchunk/rolldown-runtime";
import * as sharedChunk from "@rchunk/app-shared";
import * as initialChunk from "@rchunk/app-initial";
import * as primaryChunk from "@rchunk/app-primary";
import * as pluginPickerChunk from "@rchunk/plugin-picker-menu-content";

interface WorkPlugin {
  displayName?: string;
  plugin: { id: string };
  [key: string]: unknown;
}

interface ComposerController {
  getMentionedPluginIdsKey(): string;
  insertMentionAtSelection(value: unknown): void;
  removePluginMentions(id: string): void;
}

interface ComposerWorkHomePluginsControlProps {
  composerController: ComposerController;
  cwd?: string;
  hostId: string;
  menuOpen: boolean;
  onOpenChange(open: boolean): void;
  onRequestComposerFocus(): void;
  pluginHostId?: string | null;
}

interface PluginPickerState {
  connectedPlugins: WorkPlugin[];
  defaultConnectedPluginLimit?: number;
  featuredPlugins: WorkPlugin[];
  hasLoadError: boolean;
  isLoading: boolean;
  openPluginInstall(plugin: WorkPlugin): void;
  pluginInstallationStatus?: {
    phase: "installing" | "loading";
    pluginDisplayName: string;
  } | null;
  pluginsFeatureEnabled: boolean;
}

const shared = sharedChunk as unknown as Record<string, unknown>;
const initial = initialChunk as unknown as Record<string, unknown>;
const primary = primaryChunk as unknown as Record<string, unknown>;
const pluginPicker = pluginPickerChunk as unknown as Record<string, unknown>;

function callInitializer(value: unknown): void {
  if (typeof value === "function") value();
}

for (const value of [
  shared.fI,
  shared.FX,
  shared.K2,
  initial.Qgn,
  pluginPicker.n,
  pluginPicker.a,
  pluginPicker.r,
  initial.Rht,
  initial.Q_,
  primary.dn,
  primary.ma,
  initial.GWt,
  initial.VZ,
  primary.Ml,
]) callInitializer(value);

const jsx = (shared.I3 as () => {
  jsx(component: unknown, props: unknown): unknown;
})();
const React = shared.e6 as () => {
  useRef<T>(value: T): { current: T };
};
const useScope = shared.LX as (scope: unknown) => {
  get(signal: unknown, parameter?: unknown): unknown;
};
const useIntl = shared.n4 as () => {
  formatMessage(message: Record<string, string>, values?: Record<string, unknown>): string;
};
const subscribeComposerValue = initial.UZ as (
  controller: ComposerController,
  selector: (controller: ComposerController) => string,
  channel: string,
) => string;
const usePluginPickerState = pluginPicker.i as (
  options: Record<string, unknown>,
) => PluginPickerState;
const recordPluginSelected = pluginPicker.o as (
  scope: unknown,
  plugin: WorkPlugin,
) => void;
const PluginPickerMenuContent = pluginPicker.t;
const ComposerPluginControl = primary.pa;
const ComposerPluginControlSkeleton = primary.un;

const messages = {
  pluginsTooltip: {
    id: "composer.workMode.plugins.tooltip",
    defaultMessage: "Work with ChatGPT across your favorite tools",
    description: "Tooltip for the Plugins picker in the Chat home composer utility bar",
  },
  installingPlugin: {
    id: "composer.workMode.plugins.installing",
    defaultMessage: "Installing {pluginName}",
    description: "Label for the Plugins picker while installing a named plugin",
  },
  loadingPlugin: {
    id: "composer.workMode.plugins.loading",
    defaultMessage: "Loading {pluginName}",
    description: "Label for the Plugins picker while loading a named plugin installation",
  },
};

function PluginControl({
  connectedPlugins,
  defaultConnectedPluginLimit,
  featuredPlugins,
  hasLoadError,
  isLoading,
  menuOpen,
  onConnectPlugin,
  onOpenPluginDirectory,
  onOpenChange,
  onPluginSelectionChange,
  onRequestComposerFocus,
  pluginInstallationStatus,
  selectedPluginIds,
  workRecommendationsHostId,
}: PluginPickerState & {
  menuOpen: boolean;
  onConnectPlugin(plugin: WorkPlugin): void;
  onOpenPluginDirectory(): void;
  onOpenChange(open: boolean): void;
  onPluginSelectionChange(plugin: WorkPlugin, selected: boolean): void;
  onRequestComposerFocus(): void;
  selectedPluginIds: string[];
  workRecommendationsHostId: string;
}): unknown {
  const intl = useIntl();
  const shouldRestoreFocus = React().useRef(false);
  if (isLoading) {
    return jsx.jsx(ComposerPluginControlSkeleton, { menuOpen, onOpenChange });
  }

  const label = intl.formatMessage({
    id: "composer.workMode.plugins.label",
    defaultMessage: "Plugins",
    description: "Label for the Plugins picker in the Chat home composer utility bar",
  });
  const tooltip = intl.formatMessage(messages.pluginsTooltip);
  const installationLabel = pluginInstallationStatus == null
    ? null
    : pluginInstallationStatus.phase === "loading"
      ? intl.formatMessage(messages.loadingPlugin, {
          pluginName: pluginInstallationStatus.pluginDisplayName,
        })
      : intl.formatMessage(messages.installingPlugin, {
          pluginName: pluginInstallationStatus.pluginDisplayName,
        });
  const value = installationLabel ?? label;
  const visibleValue = installationLabel == null
    ? value
    : jsx.jsx("span", {
        className: "loading-shimmer-pure-text [--text-primary:var(--color-text)]",
        children: value,
      });
  const selectPlugin = (plugin: WorkPlugin, selected: boolean) => {
    shouldRestoreFocus.current = true;
    onPluginSelectionChange(plugin, selected);
    onOpenChange(false);
  };
  const content = jsx.jsx(PluginPickerMenuContent, {
    connectedPlugins,
    defaultConnectedPluginLimit,
    featuredPlugins,
    hasLoadError,
    onConnectPlugin,
    onOpenPluginDirectory,
    onPluginSelectionChange: selectPlugin,
    selectedPluginIds,
    workRecommendationsHostId,
  });
  return jsx.jsx(ComposerPluginControl, {
    "aria-label": value,
    "data-composer-navigation-target": "plugins",
    contentClassName: "overflow-hidden!",
    contentMaxHeight: "composerPlugins",
    contentSurface: "opaque",
    contentWidth: "menuWide",
    foreground: "primary",
    iconSource: { 16: shared.pS, 20: shared.mS },
    menuOpen,
    tooltipContent: tooltip,
    value: visibleValue,
    onOpenChange,
    onCloseAutoFocus: (event: { preventDefault(): void }) => {
      if (!shouldRestoreFocus.current) return;
      shouldRestoreFocus.current = false;
      event.preventDefault();
      onRequestComposerFocus();
    },
    children: content,
  });
}

function ComposerWorkHomePluginsControl({
  composerController,
  cwd,
  hostId,
  menuOpen,
  onOpenChange,
  onRequestComposerFocus,
  pluginHostId,
}: ComposerWorkHomePluginsControlProps): unknown {
  const scope = useScope(initial.kht);
  const intl = useIntl();
  const directoryContext = (initial.o_n as () => unknown)();
  const trackSelection = (primary.Nl as (
    options: { hostId: string },
  ) => (plugin: WorkPlugin) => void)({ hostId });
  const mentionedPluginIds = subscribeComposerValue(
    composerController,
    (controller) => controller.getMentionedPluginIdsKey(),
    "document",
  );
  const pickerState = usePluginPickerState({
    cwd,
    hostId,
    pluginHostId,
    workComposer: true,
  });
  if (!pickerState.pluginsFeatureEnabled) return null;

  const selectPlugin = (plugin: WorkPlugin, selected: boolean) => {
    if (selected) {
      recordPluginSelected(scope, plugin);
      const createMention = initial.PWt as (plugin: WorkPlugin, locale: unknown) => unknown;
      const getLocale = initial.zWt as (intl: unknown) => unknown;
      composerController.insertMentionAtSelection(createMention(plugin, getLocale(intl)));
      trackSelection(plugin);
      return;
    }
    composerController.removePluginMentions(plugin.plugin.id);
  };
  const selectedPluginIds = mentionedPluginIds === ""
    ? []
    : mentionedPluginIds.split("\0");
  const openPluginDirectory = () => {
    const openDirectory = initial.$_ as (
      scope: unknown,
      context: unknown,
      enabled: boolean,
      entrypoint: unknown,
      hostId: string,
    ) => void;
    const entrypoint = (shared.iN as Record<string, unknown>)
      .CODEX_PLUGIN_DIRECTORY_ENTRYPOINT_OTHER;
    openDirectory(scope, directoryContext, pickerState.pluginsFeatureEnabled, entrypoint, hostId);
  };

  return jsx.jsx(PluginControl, {
    ...pickerState,
    menuOpen,
    onConnectPlugin: pickerState.openPluginInstall,
    onOpenPluginDirectory: openPluginDirectory,
    onOpenChange,
    onPluginSelectionChange: selectPlugin,
    onRequestComposerFocus,
    selectedPluginIds,
    workRecommendationsHostId: pluginHostId ?? hostId,
  });
}

export { ComposerWorkHomePluginsControl };
