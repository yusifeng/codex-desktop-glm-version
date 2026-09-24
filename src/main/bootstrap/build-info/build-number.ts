// 构建 number 懒读取：优先 CODEX_BUILD_NUMBER 环境变量，打包时读 package.json
// 的 codexBuildNumber 字段（缺失时记 error 日志并返回 null）。
// BuildNumber.value 保持懒 getter 语义（原 Kt，3879-3883 行）：首次访问时才
// 读取并缓存（`Ut === void 0` 表示未读取），后续读取直接命中缓存。
// 对应 bootstrap-C4dRql4x.ts 3868-3883 行（Ut/Wt/Gt/Kt）。
import { app } from "electron";
import { memoizedTaggedLogger } from "@chunk/logger";
import { readPackageMetadataField } from "../metadata/package-metadata";

const logger = memoizedTaggedLogger("codex-build-number"); // Wt

// void 0 表示「尚未读取」，与「读取结果为 null」区分（原 Ut）。
let cachedBuildNumber: string | null | undefined = void 0;

/** 读取构建 number（原 Gt）。 */
function readBuildNumber(): string | null {
  return (
    process.env.CODEX_BUILD_NUMBER?.trim() ||
    (app.isPackaged
      ? readPackageMetadataField("codexBuildNumber") ||
          (logger().error("CodexBuildNumber missing from package metadata."), null)
      : null)
  );
}

/** 构建 number 懒缓存（原 Kt）：通过 `.value` 首次访问时读取并缓存。 */
export const BuildNumber = {
  get value(): string | null {
    if (cachedBuildNumber === void 0) cachedBuildNumber = readBuildNumber();
    return cachedBuildNumber;
  },
};
