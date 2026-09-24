// browser-use 本地插件 → bundled 插件迁移 —— 原 main-C-Mhak1n.ts
// 11,203-11,319 行（`rl`→logger、`Gae/Kae`→marketplace schema、
// `qae`→迁移入口、`Jae`→迁移实现、`Yae`→查找本地 browser-use 插件、
// `Xae/Zae/Qae/$ae/il`→marketplace 条目清理）。
//
// 职责：把用户先前手动安装的本地 browser-use 插件（位于
// `<codexHome>/plugins/browser-use`）迁移到 bundled marketplace 版本：
//   1. 卸载本地插件（app-server uninstallPlugin）；
//   2. 本地插件源目录移入回收站（trashItem）；
//   3. 从所在本地 marketplace 的 marketplace.json 中移除该条目；
//   4. 若 bundled browser-use 插件未安装则安装之。
// 由 marketplace 的 bundled 插件描述符清单（`al` 中的 browser 项 migrate 字段）
// 在每次 reconcile 时调用；任何失败只 warning，不阻断 reconcile。

import fs from "node:fs/promises";
import path from "node:path";

import {
  Of as zString,
  ou as BUNDLED_BROWSER_USE_PLUGIN_NAME,
  su as LOCAL_BROWSER_USE_PLUGIN_DIR,
  xf as zRecord,
  hf as zArray,
  wf as zObject,
} from "@chunk/shared";
import { createTaggedLogger } from "@chunk/logger";
import { LOCAL_MARKETPLACE_LIST_FILTER, findBundledPlugin } from "../plugins/marketplace";

const logger = createTaggedLogger(`BrowserUseLocalToBundledMigration`);

/** 本地 marketplace 条目 schema（原 `Gae`）。 */
const localMarketplacePluginSchema = zRecord({
  name: zString(),
  source: zObject({ path: zString().trim().min(1), source: zString() }).optional(),
});
/** 本地 marketplace.json schema（原 `Kae`）。 */
const localMarketplaceSchema = zRecord({ plugins: zArray(localMarketplacePluginSchema) });

/** 迁移入口（吞错只 warning；原 `qae`）。 */
export async function migrateLocalBrowserUseToBundled(options: {
  appServerConnection: {
    listPlugins(filter: unknown): Promise<{ marketplaces: any[] }>;
    uninstallPlugin(input: { pluginId: string }): Promise<unknown>;
    installPlugin(input: { marketplacePath: string; pluginName: string }): Promise<unknown>;
  };
  codexHome: string;
  marketplaceName?: string;
  trashItem(path: string): Promise<unknown>;
}) {
  try {
    await migrateLocalBrowserUseToBundledImpl(options);
  } catch (error) {
    logger.warning(`browser_use_local_to_bundled_migration_failed`, {
      safe: {},
      sensitive: { error },
    });
  }
}

/** 迁移实现（原 `Jae`）。 */
async function migrateLocalBrowserUseToBundledImpl(options: {
  appServerConnection: {
    listPlugins(filter: unknown): Promise<{ marketplaces: any[] }>;
    uninstallPlugin(input: { pluginId: string }): Promise<unknown>;
    installPlugin(input: { marketplacePath: string; pluginName: string }): Promise<unknown>;
  };
  codexHome: string;
  marketplaceName?: string;
  trashItem(path: string): Promise<unknown>;
}) {
  let marketplaceName = options.marketplaceName ?? `openai-bundled`,
    { marketplaces } = await options.appServerConnection.listPlugins(LOCAL_MARKETPLACE_LIST_FILTER),
    bundled = findBundledPlugin({
      marketplaces,
      marketplaceName,
      pluginName: BUNDLED_BROWSER_USE_PLUGIN_NAME,
    });
  if (bundled == null) {
    logger.debug(`bundled_browser_use_plugin_missing_for_migration`, { safe: {}, sensitive: {} });
    return;
  }
  let local = findLocalBrowserUsePlugin({ codexHome: options.codexHome, marketplaces });
  if (local == null) {
    logger.debug(`local_browser_use_plugin_missing_for_migration`, { safe: {}, sensitive: {} });
    return;
  }
  await options.appServerConnection.uninstallPlugin({ pluginId: local.plugin.id }),
    logger.info(`browser_use_local_to_bundled_migration_uninstalled_local`, {
      safe: {},
      sensitive: {},
    }),
    await options.trashItem(local.plugin.source.path),
    logger.info(`browser_use_local_to_bundled_migration_moved_local_to_trash`, {
      safe: {},
      sensitive: { localPluginPath: local.plugin.source.path },
    }),
    await removeLocalEntryFromMarketplace({
      codexHome: options.codexHome,
      localPluginPath: local.plugin.source.path,
      marketplacePath: local.marketplace.path,
    }),
    !bundled.plugin.installed &&
      (await options.appServerConnection.installPlugin({
        marketplacePath: bundled.marketplace.path,
        pluginName: BUNDLED_BROWSER_USE_PLUGIN_NAME,
      }),
      logger.info(`browser_use_local_to_bundled_migration_installed_bundled`, {
        safe: {},
        sensitive: { marketplacePath: bundled.marketplace.path },
      }));
}

/** 查找已安装的本地 browser-use 插件（原 `Yae`）。 */
function findLocalBrowserUsePlugin({ codexHome, marketplaces }: { codexHome: string; marketplaces: any[] }) {
  let localPluginDir = path.join(codexHome, `plugins`, LOCAL_BROWSER_USE_PLUGIN_DIR);
  for (let marketplace of marketplaces)
    for (let plugin of marketplace.plugins)
      if (
        plugin.name === `browser-use` &&
        plugin.installed &&
        marketplace.path != null &&
        plugin.source.type === `local` &&
        isSamePath(plugin.source.path, localPluginDir)
      )
        return {
          marketplace: { ...marketplace, path: marketplace.path },
          plugin: { ...plugin, source: plugin.source },
        };
  return null;
}

/** 从本地 marketplace.json 中移除本地 browser-use 条目（原 `Xae`）。 */
async function removeLocalEntryFromMarketplace({
  codexHome,
  localPluginPath,
  marketplacePath,
}: {
  codexHome: string;
  localPluginPath: string;
  marketplacePath: string;
}) {
  try {
    let marketplace = await readLocalMarketplace(marketplacePath),
      remaining = marketplace.plugins.filter(
        (plugin) =>
          !isLocalBrowserUseEntry({ codexHome, localPluginPath, plugin }),
      );
    if (remaining.length === marketplace.plugins.length) {
      logger.debug(`browser_use_local_to_bundled_migration_marketplace_entry_missing`, {
        safe: {},
        sensitive: { marketplacePath },
      });
      return;
    }
    await fs.writeFile(
      marketplacePath,
      JSON.stringify({ ...marketplace, plugins: remaining }, null, 2) + `\n`,
      `utf8`,
    ),
      logger.info(`browser_use_local_to_bundled_migration_removed_marketplace_entry`, {
        safe: {},
        sensitive: { marketplacePath },
      });
  } catch (error) {
    logger.warning(`browser_use_local_to_bundled_migration_marketplace_cleanup_failed`, {
      safe: {},
      sensitive: { error, marketplacePath },
    });
  }
}

/** 读取并校验本地 marketplace.json（原 `Zae`）。 */
async function readLocalMarketplace(marketplacePath: string) {
  return localMarketplaceSchema.parse(JSON.parse(await fs.readFile(marketplacePath, `utf8`)));
}

/** 条目是否为本次迁移的本地 browser-use 条目（原 `Qae`）。 */
function isLocalBrowserUseEntry({
  codexHome,
  localPluginPath,
  plugin,
}: {
  codexHome: string;
  localPluginPath: string;
  plugin: { name: string; source?: { source?: string; path?: string } };
}) {
  return (
    plugin.name === `browser-use` &&
    plugin.source?.source === `local` &&
    matchesLocalPluginPath({
      codexHome,
      localPluginPath,
      sourcePath: plugin.source.path!,
    })
  );
}

/** 条目 sourcePath 是否指向本地插件目录（三种基准解析；原 `$ae`）。 */
function matchesLocalPluginPath({
  codexHome,
  localPluginPath,
  sourcePath,
}: {
  codexHome: string;
  localPluginPath: string;
  sourcePath: string;
}) {
  return [
    path.resolve(sourcePath),
    path.resolve(codexHome, sourcePath),
    path.resolve(path.dirname(codexHome), sourcePath),
  ].some((candidate) => isSamePath(candidate, localPluginPath));
}

/** 路径等价判定（resolve 后比较；原 `il`）。 */
function isSamePath(a: string, b: string): boolean {
  return path.resolve(a) === path.resolve(b);
}
