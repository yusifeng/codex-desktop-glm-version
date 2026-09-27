import "@rchunk/app-shared";
import { n as initializePluginsSettings, t as PluginsSettingsContent, type PluginsSettingsProps } from "@rchunk/plugins-settings-core";

initializePluginsSettings();
const PluginsSettings = (props: PluginsSettingsProps = {}): unknown => PluginsSettingsContent(props);
export { PluginsSettings };
