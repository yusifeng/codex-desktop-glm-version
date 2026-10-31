// macOS launch-services-helper 门面。
//
// 对应 main-C-Mhak1n.ts 79,286-79,354：
//   - helper 二进制定位（Rj/Bj：resourcesPath 优先，dev 构建目录兜底）
//   - zj invokeHelper：2s 超时 + JSON 输出 schema 解析，非 darwin/缺 helper 返回 null
//   - Nj listApplications / Pj appForBundleId / Fj listWebUrlHandlers /
//     Ij notifyDownloadComplete
//   - Lj setAppIcon：串行队列（kj）+ .app bundle 探测（Vj），5s 超时
//
// 与 bootstrap 的 dock tile 修复（mA）共享同一 helper 二进制。
import { execFile } from "node:child_process";
import { existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { promisify } from "node:util";
import { app } from "electron";
import { wf as objectSchema, hf as arraySchema, Of as stringSchema, gf as booleanSchema, bf as literalSchema } from "@chunk/shared";

const execFileAsync = promisify(execFile);
/** setAppIcon 的串行队列（原 `kj`）。 */
let setAppIconQueue = Promise.resolve();

const applicationSchema = objectSchema({
  appPath: stringSchema(),
  bundleId: stringSchema(),
  displayName: stringSchema(),
  isDefault: booleanSchema().optional(),
});
const applicationListSchema = arraySchema(applicationSchema);
const webUrlHandlersSchema = objectSchema({ applications: applicationListSchema, defaultApplicationPath: stringSchema().nullish() });

/** helper 二进制候选路径（原 `Bj`）。 */
function launchServicesHelperCandidates(): string[] {
  return [
    join(process.resourcesPath, "native", "launch-services-helper"),
    join(
      app.getAppPath(),
      "native",
      "launch-services-helper",
      "build",
      `Release-${process.arch}`,
      "launch-services-helper",
    ),
  ];
}

/** 定位 helper（原 `Rj`）。 */
function launchServicesHelperPath(): string | null {
  for (const candidate of launchServicesHelperCandidates()) if (existsSync(candidate)) return candidate;
  return null;
}

/** 调用 helper 并解析 JSON 输出（原 `zj`）。 */
async function invokeHelper<T>(args: string[], outputSchema: { parse(input: unknown): T }): Promise<T | null> {
  if (process.platform !== "darwin") return null;
  const helperPath = launchServicesHelperPath();
  if (helperPath == null) return null;
  try {
    const { stdout } = await execFileAsync(helperPath, args, { timeout: 2e3 });
    return outputSchema.parse(JSON.parse(stdout));
  } catch {
    return null;
  }
}

/** 应用列表（原 `Nj`）。 */
async function listApplicationsForFile(argument: string): Promise<Array<{ appPath: string; bundleId: string; displayName: string; isDefault?: boolean }> | null> {
  return invokeHelper([argument], applicationListSchema as never);
}

/** 全量应用列表。 */
async function listApplications(): Promise<Array<{ appPath: string; bundleId: string; displayName: string; isDefault?: boolean }> | null> {
  return invokeHelper(["list-applications"], applicationListSchema as never);
}

/** 按 bundle id 查应用（原 `Pj`）。 */
async function appForBundleId(bundleId: string): Promise<{ appPath: string; bundleId: string; displayName: string; isDefault?: boolean } | null> {
  return invokeHelper(["app-for-bundle-id", bundleId], (applicationSchema as unknown as { nullable(): { parse(input: unknown): never } }).nullable() as never);
}

/** 默认浏览器等 web url handler（原 `Fj`）。 */
async function listWebUrlHandlers(): Promise<{ applications: Array<{ appPath: string; bundleId: string; displayName: string; isDefault?: boolean }>; defaultApplicationPath: string | null | undefined } | null> {
  return invokeHelper(["list-web-url-handlers"], webUrlHandlersSchema as never);
}

/** 通知下载完成（原 `Ij`）。 */
async function notifyDownloadComplete(path: string): Promise<void> {
  await invokeHelper(["notify-download-complete", path], literalSchema(true) as never);
}

/** 当前 .app bundle 路径（原 `Vj`）。 */
function appBundlePath(): string | null {
  const frameworksDir = dirname(dirname(process.execPath));
  const bundleDir = dirname(frameworksDir);
  return bundleDir.endsWith(".app") ? bundleDir : null;
}

/** 设置应用图标（原 `Lj`）：仅打包的 darwin；串行队列；5s 超时。 */
function setAppIcon({ preference, resourceName }: { preference: string; resourceName?: string }): Promise<boolean> {
  if (process.platform !== "darwin" || !app.isPackaged) return Promise.resolve(false);
  const helperPath = launchServicesHelperPath();
  const bundlePath = appBundlePath();
  if (helperPath == null || bundlePath == null) return Promise.resolve(false);
  const attempt = setAppIconQueue.then(async () => {
    try {
      await execFileAsync(helperPath, ["set-app-icon", bundlePath, preference, resourceName ?? ""], { timeout: 5e3 });
      return true;
    } catch {
      return false;
    }
  });
  setAppIconQueue = attempt.then(() => void 0);
  return attempt;
}

export {
  listApplications,
  listApplicationsForFile,
  appForBundleId,
  listWebUrlHandlers,
  notifyDownloadComplete,
  setAppIcon,
  launchServicesHelperPath,
};
