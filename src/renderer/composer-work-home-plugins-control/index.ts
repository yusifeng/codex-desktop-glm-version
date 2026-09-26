// composer-work-home-plugins-control —— Work 首页 composer 的插件选择控件。
import "@rchunk/app-shared";
import "@rchunk/app-initial";
import "@rchunk/app-primary";
import "@rchunk/plugin-picker-menu-content";

export interface WorkPlugin { plugin: { id: string }; displayName?: string; [key: string]: unknown }
export interface ComposerWorkHomePluginsControlProps {
  composerController: { insertMentionAtSelection(value: unknown): void; removePluginMentions(id: string): void };
  hostId: string; pluginHostId?: string | null; menuOpen: boolean; onOpenChange(open: boolean): void;
  onRequestComposerFocus(): void; pluginsFeatureEnabled?: boolean; isLoading?: boolean; hasLoadError?: boolean;
  connectedPlugins?: WorkPlugin[]; featuredPlugins?: WorkPlugin[]; defaultConnectedPluginLimit?: number;
  selectedPluginIds?: string[] | string; pluginInstallationStatus?: { phase: "loading" | "installing"; pluginDisplayName: string } | null;
  openPluginInstall?(plugin: WorkPlugin): void; openPluginDirectory?(): void; createMention?(plugin: WorkPlugin): unknown;
  trackPluginSelected?(plugin: WorkPlugin): void;
}

function ComposerWorkHomePluginsControl(props: ComposerWorkHomePluginsControlProps) {
  if (props.pluginsFeatureEnabled === false) return null;
  const selectedPluginIds = Array.isArray(props.selectedPluginIds)
    ? props.selectedPluginIds
    : props.selectedPluginIds == null || props.selectedPluginIds === "" ? [] : props.selectedPluginIds.split("\0");
  const status = props.pluginInstallationStatus;
  const value = status == null ? "Plugins" : `${status.phase === "loading" ? "Loading" : "Installing"} ${status.pluginDisplayName}`;
  return {
    kind: "composer-work-home-plugins-control" as const,
    loadingSkeleton: props.isLoading === true,
    menuOpen: props.menuOpen,
    value,
    tooltip: "Work with ChatGPT across your favorite tools",
    selectedPluginIds,
    connectedPlugins: props.connectedPlugins ?? [], featuredPlugins: props.featuredPlugins ?? [],
    defaultConnectedPluginLimit: props.defaultConnectedPluginLimit, hasLoadError: props.hasLoadError === true,
    workRecommendationsHostId: props.pluginHostId ?? props.hostId,
    setOpen: props.onOpenChange,
    closeAndFocus() { props.onOpenChange(false); props.onRequestComposerFocus(); },
    selectPlugin(plugin: WorkPlugin, selected: boolean) {
      if (selected) {
        props.trackPluginSelected?.(plugin);
        props.composerController.insertMentionAtSelection(props.createMention?.(plugin) ?? plugin);
      } else props.composerController.removePluginMentions(plugin.plugin.id);
      props.onOpenChange(false);
    },
    openDirectory: props.openPluginDirectory,
    connectPlugin: props.openPluginInstall,
  };
}

export { ComposerWorkHomePluginsControl };
