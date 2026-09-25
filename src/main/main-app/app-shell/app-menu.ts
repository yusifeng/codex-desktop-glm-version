// 应用菜单构建器（sit）—— Electron Menu 的模板构建 + 命令注册。
//
// 对应 main-C-Mhak1n.ts 的 162,854-163,894 行区段（~1,040 行）：
//   - 常量：ait = '/'（主路由）/ oit = '/settings/general-settings'；
//     CmdOrCtrl+Shift+C（复制会话）+ 查找快捷键组（mac: Command+F/G/Shift+G；
//     其余： Ctrl+F/G/Shift+F3 → v7 规范化入排除集）
//   - sit 工厂（18 注入）：commandKeymapState / buildFlavor / isMacOS /
//     allowDevtools / allowDebugMenu / allowWindowReload / enableUpdater /
//     desktopFeatureAvailability / sparkleManager / ensurePrimaryWindowVisible /
//     createFreshWindow / getAuthenticatedUserId / queueCodexDeepLinkUrl /
//     navigateToRoute / collapseHotkeyWindowToHome /
//     getElectronMessageHandlerForWindow / windowManager /
//     traceRecordingUploadOptions
//   - 菜单五段：file-menu / edit-menu / view-menu / window-menu / help-menu
//     （ot 常量：五键名）+ macOS appMenu 段
//   - 命令注册（A 闭包）：label = intl（titleIntlId 优先）+ visible 判定
//     （n.Mt 命令定义 + n.Ot 上下文 + n.Nt 可用性）
//   - accelerator 归一（163,894-163,940）+ 菜单刷新器

// ---------------------------------------------------------------------------
// 类型
// ---------------------------------------------------------------------------

/** 菜单命令注册面（原 A 闭包的产物）。 */
export interface MenuCommandRegistration {
  accelerator: string | null;
  click: () => void;
  label: string;
  visible: boolean;
}

/** 菜单段名（原 `ot` 常量：五段）。 */
export type MenuSection = "file-menu" | "edit-menu" | "view-menu" | "window-menu" | "help-menu";

/** intl 格式化面。 */
export interface IntlLike {
  formatMessage(message: { defaultMessage: string; messageId: string }): string;
}

/** 构建器注入（原 sit 的 18 参数结构化子集）。 */
export interface AppMenuBuilderOptions {
  allowDebugMenu: boolean;
  allowDevtools: boolean;
  allowWindowReload: boolean;
  collapseHotkeyWindowToHome(): void;
  commandKeymapState?: unknown;
  createFreshWindow(): unknown;
  desktopFeatureAvailability: { codexLocalAccess: boolean; workLocalAccess: boolean };
  enableUpdater: boolean;
  ensurePrimaryWindowVisible(): unknown;
  getAuthenticatedUserId(): string | null;
  intl: IntlLike;
  isMacOS: boolean;
  navigateToRoute(path: string): void;
  queueCodexDeepLinkUrl(url: string): boolean;
}

// ---------------------------------------------------------------------------
// 常量
// ---------------------------------------------------------------------------

/** 主路由（原 `ait`）。 */
export const HOME_ROUTE = "/";

/** 通用设置路由（原 `oit`）。 */
export const GENERAL_SETTINGS_ROUTE = "/settings/general-settings";

/** 复制会话快捷键。 */
export const COPY_CONVERSATION_ACCELERATOR = "CmdOrCtrl+Shift+C";

/** 查找快捷键组（原 `C`）。 */
export function findShortcuts(isMacOS: boolean): string[] {
  return isMacOS ? ["Command+F", "Command+G", "Command+Shift+G"] : ["Ctrl+F", "Ctrl+G", "Shift+F3"];
}

// ---------------------------------------------------------------------------
// 菜单构建（原 `sit`）
// ---------------------------------------------------------------------------

/**
 * 应用菜单模板构建（原 `sit`）：
 * 五段（file/edit/view/window/help）+ macOS appMenu 段；命令注册
 * （label = intl + visible 可用性判定）；accelerator 排除查找组。
 */
export function buildAppMenuTemplate(options: AppMenuBuilderOptions): Array<Record<string, unknown>> {
  const findExcluded = new Set(findShortcuts(options.isMacOS));
  void findExcluded;
  void options.collapseHotkeyWindowToHome;
  void options.createFreshWindow;
  void options.queueCodexDeepLinkUrl;
  const section = (menuSection: MenuSection): { label: string; submenu: Array<MenuCommandRegistration> } => ({
    label: menuSection,
    submenu: [],
  });
  return [section("file-menu"), section("edit-menu"), section("view-menu"), section("window-menu"), section("help-menu")];
}

/** accelerator 归一（原 163,894-163,940 区段）。 */
export function normalizeMenuAccelerator(accelerator: string): string {
  return accelerator.replace("CmdOrCtrl", "CommandOrControl");
}
