// Intel-on-Apple-Silicon 启动警告：打包的 darwin x64 构建且进程运行在
// Rosetta 转译模式下时弹窗，用户选择 Quit 则主流程退出（返回 false）。
// 对应 bootstrap-C4dRql4x.ts 301-308 行（文案常量）与 370-433 行（Ke/qe/Je/Ye）。
import { execFileSync } from "node:child_process";
import { dialog } from "electron";
import type { MessageBoxOptions, MessageBoxReturnValue } from "electron";
import { getLogger } from "@chunk/logger";
import { Bi as sanitizeChildProcessEnv } from "@chunk/shared";
import { NativeIntl, requireNativeIntl } from "../intl/native-intl";

const MESSAGE_ID = "desktop.intelLaunchWarning.message"; // Ne
const MESSAGE_DEFAULT = "{appName} is running the Intel build on an Apple Silicon Mac"; // Pe
const DETAIL_ID = "desktop.intelLaunchWarning.detail"; // Fe
const DETAIL_DEFAULT =
  "This build works through Rosetta, but the Apple Silicon build launches faster and performs better. Quit now to install the Apple Silicon build, or continue with the Intel build"; // Ie
const QUIT_BUTTON_ID = "desktop.intelLaunchWarning.quit"; // Le
const QUIT_BUTTON_DEFAULT = "Quit"; // Re
const CONTINUE_BUTTON_ID = "desktop.intelLaunchWarning.continue"; // ze
const CONTINUE_BUTTON_DEFAULT = "Continue Anyway"; // Be

/** Electron 进程环境描述（isPackaged / platform / arch）。 */
export interface ElectronEnvironmentLike {
  isPackaged: boolean;
  platform: string;
  arch: string;
}

/**
 * 是否需要弹 Intel 警告（原 Ke）：打包的 macOS x64 构建且当前进程运行在
 * Rosetta 下（readProcessTranslated 返回 true）。
 */
export function needsIntelLaunchWarning(
  environment: ElectronEnvironmentLike,
  readProcessTranslated: () => boolean = isRunningTranslated,
): boolean {
  return !environment.isPackaged || environment.platform !== "darwin" || environment.arch !== "x64"
    ? false
    : readProcessTranslated();
}

export interface IntelLaunchWarningOptions {
  appName: string;
  environment: ElectronEnvironmentLike;
  /** 读取进程是否处于转译模式（默认查 sysctl sysctl.proc_translated）。 */
  readProcessTranslated?: () => boolean;
  /** 加载弹窗文案（默认 requireNativeIntl，失败回退默认文案）。 */
  loadNativeIntl?: () => Promise<NativeIntl>;
  showMessageBox?: (options: MessageBoxOptions) => Promise<MessageBoxReturnValue>;
}

/**
 * 弹出 Intel-on-Apple-Silicon 警告（原 qe）。返回是否继续启动：
 * 不需要警告 → true；用户选 Continue Anyway（response 1）→ true；
 * 用户选 Quit → false；弹窗失败 → 记 warning 日志后返回 true。
 */
export async function showIntelOnAppleSiliconWarning({
  appName,
  environment,
  readProcessTranslated = isRunningTranslated,
  loadNativeIntl = loadNativeIntlWithFallback,
  showMessageBox = (options) => dialog.showMessageBox(options),
}: IntelLaunchWarningOptions): Promise<boolean> {
  if (!needsIntelLaunchWarning(environment, readProcessTranslated)) return true;
  try {
    const intl = await loadNativeIntl();
    const { response } = await showMessageBox({
      type: "warning",
      buttons: [
        intl.formatMessage({ messageId: QUIT_BUTTON_ID, defaultMessage: QUIT_BUTTON_DEFAULT }),
        intl.formatMessage({
          messageId: CONTINUE_BUTTON_ID,
          defaultMessage: CONTINUE_BUTTON_DEFAULT,
        }),
      ],
      defaultId: 0,
      cancelId: 0,
      noLink: true,
      message: intl.formatMessage({
        messageId: MESSAGE_ID,
        defaultMessage: MESSAGE_DEFAULT,
        values: { appName },
      }),
      detail: intl.formatMessage({ messageId: DETAIL_ID, defaultMessage: DETAIL_DEFAULT }),
    });
    return response === 1;
  } catch (error) {
    getLogger().warning("Failed to show Intel-on-Apple-Silicon launch warning", {
      safe: { errorName: error instanceof Error ? error.name : null },
      sensitive: {},
    });
    return true;
  }
}

/** 当前进程是否运行在 Rosetta 转译模式下（原 Je；查询失败按非转译处理）。 */
export function isRunningTranslated(): boolean {
  try {
    return (
      execFileSync("/usr/sbin/sysctl", ["-in", "sysctl.proc_translated"], {
        encoding: "utf8",
        env: sanitizeChildProcessEnv(process.env),
        stdio: ["ignore", "pipe", "ignore"],
      }).trim() === "1"
    );
  } catch {
    return false;
  }
}

/** 弹窗文案的兜底加载（原 Ye）：已配置的 NativeIntl → 空路径加载 → 空文案。 */
export async function loadNativeIntlWithFallback(): Promise<NativeIntl> {
  try {
    return requireNativeIntl();
  } catch {
    try {
      return await NativeIntl.load("");
    } catch {
      return NativeIntl.createDefault();
    }
  }
}
