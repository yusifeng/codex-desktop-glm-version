// Windows OEM / contained core 判定（原 bootstrap-C4dRql4x.ts 24852-24899 行的
// `YA/XA/ZA/QA/$A`）。
//
// `YA`（isWindowsContainedCore）：win32 + packaged + MSIX 包内
// （app.asar 的 package.json 带 codexWindowsAppContainedCore=1）且未用
// CODEX_CLI_PATH 覆盖时，主进程以「contained core」模式运行（codex 运行时
// 从注册的 core 目录取，而不是 app.asar 内）。
//
// `XA`（registerWindowsCore）：把 resourcesPath 注册为 shared chunk 的
// Windows core 根目录（读取其 plugins/ 列表），并打
// CODEX_WINDOWS_REGISTERED_CORE=1 标记（供后续 gate 与遥测判断）。
//
// `$A`（readWindowsOemCustomData）：OEM 预装镜像写在
// `…/microsoft.system.package.metadata/Custom.data` 的 JSON（<= 4 KiB，
// 允许 UTF-8 BOM），提取 partner/deal/provisioned_on 三个已知字段，
// 其余字段原样序列化为 customDataJson。

import { readFile, stat } from "node:fs/promises";
import { dirname, join } from "node:path";

import { app } from "electron";
// @chunk/shared（src-DldfpmrL.js，尚未重写）的压缩名导出，按语义重命名导入：
//   Hn → 注册 Windows contained core 根目录并读取 plugins 列表（内部符号 dY）
//   xf → zod loose object 构造器（内部符号 Kp，catchall unknown）
//   Of → zod string 构造器、If → zod ISO date 构造器（内部符号 Gd）
import {
  Hn as setWindowsCoreRoot,
  If as isoDateSchema_,
  Of as stringSchema_,
  xf as looseObjectSchema_,
} from "@chunk/shared";

// 压缩名导入后重绑为 any：d.ts 的 Schema 接口未声明 zod 的链式方法。
const looseObjectSchema: any = looseObjectSchema_;
const stringSchema: any = stringSchema_;
const isoDateSchema: any = isoDateSchema_;
import { readPackageMetadataField } from "../metadata/package-metadata";

/** Custom.data 的最大字节数（原 `ZA`）。 */
const OEM_CUSTOM_DATA_MAX_BYTES = 4096;

/** OEM Custom.data 的 zod schema（原 `QA`，loose：未知字段保留）。 */
const oemCustomDataSchema: any = looseObjectSchema({
  partner: stringSchema()
    .optional()
    .catch(void 0),
  deal: stringSchema()
    .optional()
    .catch(void 0),
  provisioned_on: isoDateSchema()
    .optional()
    .catch(void 0),
});

/** 解析后的 OEM Custom.data（原 `$A` 的返回值）。 */
export interface WindowsOemCustomData {
  partner?: string;
  deal?: string;
  provisionedUtcDate?: string;
  customDataJson: string;
}

/**
 * 是否以 Windows contained core 模式运行（原 `YA`）。
 * 语义见文件头；任何条件不满足返回 false。
 */
export function isWindowsContainedCore(): boolean {
  return (
    process.platform === `win32` &&
    app.isPackaged &&
    process.resourcesPath != null &&
    !process.env.CODEX_CLI_PATH?.trim() &&
    readPackageMetadataField(`codexWindowsAppContainedCore`, {
      candidates: [join(process.resourcesPath, `app.asar`, `package.json`)],
    }) === `1`
  );
}

/**
 * 注册 contained core（原 `XA`）：把 resourcesPath 设为 shared chunk 的
 * Windows core 根目录，并写 CODEX_WINDOWS_REGISTERED_CORE=1。
 */
export function registerWindowsCore(): void {
  setWindowsCoreRoot(process.resourcesPath);
  process.env.CODEX_WINDOWS_REGISTERED_CORE = `1`;
}

/**
 * 读取 OEM Custom.data（原 `$A`）：文件超过 4 KiB、解析或校验失败、
 * 非 win32/非 packaged 均返回 undefined。
 */
export async function readWindowsOemCustomData(): Promise<WindowsOemCustomData | undefined> {
  if (process.platform === `win32` && app.isPackaged)
    try {
      const customDataPath = join(
        dirname(dirname(process.execPath)),
        `microsoft.system.package.metadata`,
        `Custom.data`,
      );
      if ((await stat(customDataPath)).size > OEM_CUSTOM_DATA_MAX_BYTES) return;
      const contents = await readFile(customDataPath);
      if (contents.byteLength > OEM_CUSTOM_DATA_MAX_BYTES) return;
      const parsed = oemCustomDataSchema.safeParse(
        JSON.parse(contents.toString(`utf8`).replace(/^\uFEFF/, ``)),
      );
      if (!parsed.success) return;
      const { partner, deal, provisioned_on, ...rest } = parsed.data;
      return {
        partner,
        deal,
        provisionedUtcDate: provisioned_on,
        customDataJson: JSON.stringify(rest),
      };
    } catch {
      return;
    }
}
