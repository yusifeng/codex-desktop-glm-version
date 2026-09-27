import "@rchunk/app-shared";
import "@rchunk/app-initial";

export interface InstallPluginInput { id: string; name?: string; [key: string]: unknown }
export async function installPlugin(plugin: InstallPluginInput, installer?: (plugin: InstallPluginInput) => Promise<unknown>): Promise<unknown> { return installer == null ? { ...plugin, installed: true } : installer(plugin); }
