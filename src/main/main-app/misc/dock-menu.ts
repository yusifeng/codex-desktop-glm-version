// macOS Dock 菜单（原版 13,038-13,137 区段）。
//
// 职责：
//   - DockMenuManager（原 ose）：消费 tray-menu 线程清单（未读 + 已完成 +
//     最近线程），构造两级 Dock 菜单——每类前 3 条直排（原 Ll = 3），超出
//     部分折进「More」子菜单（标题超 35 字符截断，原 ase）；
//   - 仅 darwin 下调用 `app.dock?.setMenu`（13,104 直接证据）。
//
// 注意（深析 §3.8）：真正的托盘（tray）菜单在 16 万区，与本模块无关——
// 这里只是 dock 图标右键菜单；文案常量（trayMenu.*）与 tray 共用。
//
// 依赖约束：electron + nativeIntl（@chunk/bootstrap 的 intl 装配注入），
// 无模块加载期副作用。

import { app, Menu } from "electron";
import type { MenuItemConstructorOptions } from "electron";

/** 每类线程直排数量上限（原 Ll，13,056）。 */
const DIRECT_THREAD_ITEMS = 3;

/** 线程标题截断长度（原 ase，13,057）。 */
const THREAD_TITLE_MAX_CHARS = 35;

// ---------------------------------------------------------------------------
// 文案常量（i18n message id + 默认文案；与 tray 共用，原 13,038-13,055）
// ---------------------------------------------------------------------------

const MORE_MESSAGE = { messageId: `trayMenu.more`, defaultMessage: `More` };
const PROJECTLESS_MESSAGE = {
  messageId: `trayMenu.projectlessThreads`,
  defaultMessage: `Chats`,
};
const UNREAD_MESSAGE = { messageId: `trayMenu.unreadThreads`, defaultMessage: `Unread` };
const RECENT_MESSAGE = { messageId: `trayMenu.recentThreads`, defaultMessage: `Recent` };

/** nativeIntl.formatMessage 的最小接口（由启动装配注入）。 */
export interface NativeIntlLike {
  formatMessage(message: { messageId: string; defaultMessage: string }): string;
}

/** tray-menu 线程条目（renderer 的 tray-menu-threads-changed 消息载荷）。 */
export interface TrayMenuThread {
  path: string;
  title: string;
  isProjectless?: boolean;
  projectLabel?: string;
}

/** 构造菜单所需参数。 */
export interface DockMenuManagerOptions {
  /** 点击线程条目时回调（参数为线程 path）。 */
  onOpenThread: (path: string) => void;
  /** 本地化格式化器（bootstrap intl 装配注入）。 */
  nativeIntl: NativeIntlLike;
}

/**
 * Dock 菜单管理器（原 ose，13,058-13,106）。
 * 构造时即刷新一次菜单；随后由外部在收到 tray-menu-threads-changed /
 * 完成线程变化时调用对应方法。
 */
export class DockMenuManager {
  private onOpenThread: (path: string) => void;
  private nativeIntl: NativeIntlLike;
  private completedThreads: TrayMenuThread[] = [];
  private unreadThreads: TrayMenuThread[] = [];
  private recentThreads: TrayMenuThread[] = [];

  constructor(onOpenThread: (path: string) => void, nativeIntl: NativeIntlLike) {
    this.onOpenThread = onOpenThread;
    this.nativeIntl = nativeIntl;
    this.refreshMenu();
  }

  /** 处理 renderer 线程清单消息（原 handleMessage，仅 trays 变化时刷新）。 */
  async handleMessage(message: {
    type: string;
    trayMenuThreads?: { unreadThreads: TrayMenuThread[]; recentThreads: TrayMenuThread[] };
  }): Promise<void> {
    if (message.type === `tray-menu-threads-changed`) {
      this.unreadThreads = message.trayMenuThreads!.unreadThreads;
      this.recentThreads = message.trayMenuThreads!.recentThreads;
      this.refreshMenu();
      return;
    }
  }

  /** 已完成线程（追加在未读之后展示，原 setCompletedThreads）。 */
  setCompletedThreads(threads: TrayMenuThread[]): void {
    this.completedThreads = threads;
    this.refreshMenu();
  }

  /** 重算并下发 Dock 菜单（原 refreshMenu，13,078-13,102）。 */
  private refreshMenu(): void {
    let moreLabel = this.nativeIntl.formatMessage(MORE_MESSAGE);
    let projectlessLabel = this.nativeIntl.formatMessage(PROJECTLESS_MESSAGE);
    let unreadPlusCompleted = mergeUniqueByPath(this.unreadThreads, this.completedThreads);
    let unreadPaths = new Set(unreadPlusCompleted.map((thread) => thread.path));
    let sections = [
      buildThreadSection({
        label: this.nativeIntl.formatMessage(UNREAD_MESSAGE),
        moreLabel,
        threads: unreadPlusCompleted,
        projectlessLabel,
        onOpenThread: this.onOpenThread,
      }),
      buildThreadSection({
        label: this.nativeIntl.formatMessage(RECENT_MESSAGE),
        moreLabel,
        threads: this.recentThreads.filter((thread) => !unreadPaths.has(thread.path)),
        projectlessLabel,
        onOpenThread: this.onOpenThread,
      }),
    ]
      .filter((section) => section.length > 0)
      .flatMap((section, index) => (index === 0 ? section : [{ type: `separator` } as const, ...section]));
    this.setDockMenu(sections);
  }

  /** darwin 下设置 Dock 菜单（原 setDockMenu，13,103-13,105）。 */
  private setDockMenu(template: MenuItemConstructorOptions[]): void {
    if (process.platform === `darwin`) app.dock?.setMenu(Menu.buildFromTemplate(template));
  }
}

/** 未读在前、已完成补后（按 path 去重，原 sse，13,107-13,110）。 */
function mergeUniqueByPath(
  unread: TrayMenuThread[],
  completed: TrayMenuThread[],
): TrayMenuThread[] {
  let unreadPaths = new Set(unread.map((thread) => thread.path));
  return [...unread, ...completed.filter((thread) => !unreadPaths.has(thread.path))];
}

/**
 * 构造一类线程的菜单条目（原 Rl，13,111-13,127）：
 * 禁用的节标题 + 前 3 条直排 + 余量进 More 子菜单。
 */
function buildThreadSection({
  label,
  moreLabel,
  threads,
  projectlessLabel,
  onOpenThread,
}: {
  label: string;
  moreLabel: string;
  threads: TrayMenuThread[];
  projectlessLabel: string;
  onOpenThread: (path: string) => void;
}): MenuItemConstructorOptions[] {
  if (threads.length === 0) return [];
  let direct = threads.slice(0, DIRECT_THREAD_ITEMS);
  let overflow = threads.slice(DIRECT_THREAD_ITEMS);
  return [
    { label, enabled: false },
    ...direct.map((thread) =>
      buildThreadItem({ thread, projectlessLabel, onOpenThread }),
    ),
    ...(overflow.length > 0
      ? [
          {
            label: moreLabel,
            submenu: overflow.map((thread) =>
              buildThreadItem({ thread, projectlessLabel, onOpenThread }),
            ),
          },
        ]
      : []),
  ];
}

/** 单条线程菜单项（原 zl，13,128-13,137）：标题截断 + sublabel + 点击回调。 */
function buildThreadItem({
  thread,
  projectlessLabel,
  onOpenThread,
}: {
  thread: TrayMenuThread;
  projectlessLabel: string;
  onOpenThread: (path: string) => void;
}): MenuItemConstructorOptions {
  let titleChars = Array.from(thread.title);
  let sublabel = thread.isProjectless ? projectlessLabel : (thread.projectLabel ?? ``);
  return {
    label: titleChars.length <= THREAD_TITLE_MAX_CHARS
      ? thread.title
      : `${titleChars.slice(0, 34).join(``).trimEnd()}…`,
    ...(sublabel.length > 0 ? { sublabel } : {}),
    click: () => {
      onOpenThread(thread.path);
    },
  };
}
