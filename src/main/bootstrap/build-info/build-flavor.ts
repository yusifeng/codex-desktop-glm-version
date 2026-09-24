// build flavor 模型：dev / agent / nightly / internal-alpha / public-beta / prod
// 六种 flavor 的解析（env BUILD_FLAVOR → package.json codexBuildFlavor →
// NODE_ENV 默认）与各平台更新器 / 能力的开关判定；另含 bundle id 映射。
// M（BuildFlavor）是 shared chunk flavor 枚举（cu）+ 判定方法的聚合命名空间，
// 方法名保持 resolve() / shouldIncludeSparkle() 等（其他模块按此调用）。
// 对应 bootstrap-C4dRql4x.ts 3748-3867 行（Ft/It/Lt/Rt/zt/Bt/Vt/M/Ht）。
import { memoizedTaggedLogger } from "@chunk/logger";
import { cu as buildFlavorEnum } from "@chunk/shared";
import { readPackageMetadataField } from "../metadata/package-metadata";

const logger = memoizedTaggedLogger("build-flavor"); // Ft

type EnvLike = Record<string, string | undefined>;

/** 随安装包分发的 flavor（原 It）。 */
export const DISTRIBUTED_FLAVORS: string[] = [
  buildFlavorEnum.Nightly,
  buildFlavorEnum.InternalAlpha,
  buildFlavorEnum.PublicBeta,
  buildFlavorEnum.Prod,
];

/** Windows 分发配置（原 Lt）。 */
export type WindowsDistributionConfig =
  | { kind: "msix" }
  | {
      kind: "store";
      storeProductId: string;
      storeUpdateManifestUrl: string;
    };

const WINDOWS_DISTRIBUTION_CONFIGS: Record<string, WindowsDistributionConfig> = {
  [buildFlavorEnum.Nightly]: { kind: "msix" },
  [buildFlavorEnum.InternalAlpha]: { kind: "msix" },
  [buildFlavorEnum.PublicBeta]: {
    kind: "store",
    storeProductId: "9N8CJ4W95TBZ",
    storeUpdateManifestUrl:
      "https://persistent.oaistatic.com/codex-app-beta/windows-store-update.json",
  },
  [buildFlavorEnum.Prod]: {
    kind: "store",
    storeProductId: "9PLM9XGG6VKS",
    storeUpdateManifestUrl:
      "https://persistent.oaistatic.com/codex-app-prod/windows-store-update.json",
  },
};

/** CODEX_SPARKLE_ENABLED === "false" 时禁用 Sparkle（原 Rt）。 */
export function isSparkleDisabledByEnv(env: EnvLike): boolean {
  return env.CODEX_SPARKLE_ENABLED === "false";
}

/** flavor 是否为随包分发且运行在指定平台（原 zt）。 */
export function isDistributedFlavorOnPlatform(
  flavor: string,
  platform: string,
  expectedPlatform: string,
  env: EnvLike,
): boolean {
  return !isSparkleDisabledByEnv(env) && DISTRIBUTED_FLAVORS.includes(flavor) && platform === expectedPlatform;
}

/** Windows 更新器 flavor 判定（原 Bt）。 */
export function isWindowsUpdaterFlavor(
  flavor: string,
  platform: string,
  env: EnvLike,
): boolean {
  return isDistributedFlavorOnPlatform(flavor, platform, "win32", env);
}

/** Windows 分发配置查询（原 Vt）；未知 flavor 返回 null。 */
export function getWindowsDistributionConfig(flavor: string): WindowsDistributionConfig | null {
  return WINDOWS_DISTRIBUTION_CONFIGS[flavor] ?? null;
}

/** BuildFlavor 命名空间（原 M）：flavor 枚举成员 + 解析与能力判定方法。 */
export interface BuildFlavorApi {
  Dev: string;
  Agent: string;
  Nightly: string;
  InternalAlpha: string;
  PublicBeta: string;
  Prod: string;
  values: string[];
  help: string;
  isValid(value: unknown): boolean;
  parse(value: string | undefined): string | null;
  isInternal(flavor: string): boolean;
  allowDebugMenu(flavor: string): boolean;
  supportsReactScan(flavor: string): boolean;
  readFromPackageMetadata(): string | null;
  resolve(): string;
  assertMinAppServerVersionForReleaseBuild(
    flavor: string,
    minAppServerVersion: string,
    env?: EnvLike,
  ): void;
  shouldIncludeSparkle(flavor: string, platform: string, env?: EnvLike): boolean;
  shouldIncludeWindowsUpdater(flavor: string, platform: string, env?: EnvLike): boolean;
  shouldIncludeLinuxPackageUpdater(flavor: string, platform: string, env?: EnvLike): boolean;
  shouldIncludeWindowsMsixUpdater(flavor: string, platform: string, env?: EnvLike): boolean;
  shouldIncludeBrowserUsePeerAuthorization(flavor: string, platform: string): boolean;
  shouldIncludeUpdater(flavor: string, platform: string, env?: EnvLike): boolean;
  getWindowsDistributionFlavor(flavor: string, appUserModelId?: string | null): string;
  getWindowsStoreConfig(
    flavor: string,
    appUserModelId?: string | null,
  ): { storeProductId: string; storeUpdateManifestUrl: string } | null;
  shouldIncludeWindowsAppContainedCore(flavor: string, appUserModelId?: string | null): boolean;
  shouldIncludeWindowsSandboxService(flavor: string, appUserModelId?: string | null): boolean;
  allowDevtools(flavor: string): boolean;
}

/** BuildFlavor 命名空间（原 M）：枚举成员来自 shared chunk 的 flavor 枚举。 */
export const BuildFlavor: BuildFlavorApi = {
  ...buildFlavorEnum,
  readFromPackageMetadata() {
    const flavor = readPackageMetadataField<string | null>("codexBuildFlavor", {
      parse: (value) => (BuildFlavor.isValid(value) ? value : null),
    });
    if (flavor) {
      logger().debug("Resolved build flavor from package metadata", {
        safe: { value: flavor },
        sensitive: {},
      });
      return flavor;
    }
    logger().warning("Missing codexBuildFlavor from package metadata");
    return null;
  },
  resolve() {
    const fromEnv = process.env.BUILD_FLAVOR;
    const parsed = BuildFlavor.parse(fromEnv);
    if (parsed) {
      logger().info("Resolved build flavor from env", { safe: { value: parsed }, sensitive: {} });
      return parsed;
    }
    if (fromEnv?.trim())
      logger().warning("Invalid BUILD_FLAVOR", {
        safe: { value: fromEnv, expected: BuildFlavor.help },
        sensitive: {},
      });
    return (
      BuildFlavor.readFromPackageMetadata() ||
      (process.env.NODE_ENV === "production"
        ? (logger().warning("BUILD_FLAVOR missing; defaulting to prod in production runtime"),
          BuildFlavor.Prod)
        : (logger().warning("BUILD_FLAVOR missing; defaulting to dev in non-production runtime"),
          BuildFlavor.Dev))
    );
  },
  assertMinAppServerVersionForReleaseBuild(
    flavor: string,
    minAppServerVersion: string,
    env: EnvLike = process.env,
  ) {
    if (
      env.CODEX_RELEASE_BUILD_FLAVOR != null &&
      !BuildFlavor.isInternal(flavor) &&
      /-alpha(?:\.|$)/.test(minAppServerVersion)
    )
      throw Error(
        `MIN_APP_SERVER_VERSION cannot be an alpha version for public-beta or prod builds (received ${minAppServerVersion})`,
      );
  },
  shouldIncludeSparkle(flavor: string, platform: string, env: EnvLike = process.env): boolean {
    return isDistributedFlavorOnPlatform(flavor, platform, "darwin", env);
  },
  shouldIncludeWindowsUpdater(flavor: string, platform: string, env: EnvLike = process.env): boolean {
    return isWindowsUpdaterFlavor(flavor, platform, env) && getWindowsDistributionConfig(flavor) != null;
  },
  shouldIncludeLinuxPackageUpdater(flavor: string, platform: string, env: EnvLike = process.env): boolean {
    return isDistributedFlavorOnPlatform(flavor, platform, "linux", env);
  },
  shouldIncludeWindowsMsixUpdater(flavor: string, platform: string, env: EnvLike = process.env): boolean {
    return isWindowsUpdaterFlavor(flavor, platform, env) && getWindowsDistributionConfig(flavor)?.kind === "msix";
  },
  shouldIncludeBrowserUsePeerAuthorization(flavor: string, platform: string): boolean {
    return platform === "darwin" && DISTRIBUTED_FLAVORS.includes(flavor);
  },
  shouldIncludeUpdater(flavor: string, platform: string, env: EnvLike = process.env): boolean {
    return (
      BuildFlavor.shouldIncludeSparkle(flavor, platform, env) ||
      BuildFlavor.shouldIncludeWindowsUpdater(flavor, platform, env) ||
      BuildFlavor.shouldIncludeLinuxPackageUpdater(flavor, platform, env)
    );
  },
  getWindowsDistributionFlavor(flavor: string, appUserModelId?: string | null): string {
    return flavor === BuildFlavor.Prod && appUserModelId === "OpenAI.CodexBeta"
      ? BuildFlavor.PublicBeta
      : flavor;
  },
  getWindowsStoreConfig(flavor: string, appUserModelId: string | null = null) {
    const config = getWindowsDistributionConfig(
      BuildFlavor.getWindowsDistributionFlavor(flavor, appUserModelId),
    );
    return config?.kind === "store"
      ? { storeProductId: config.storeProductId, storeUpdateManifestUrl: config.storeUpdateManifestUrl }
      : null;
  },
  shouldIncludeWindowsAppContainedCore(flavor: string, appUserModelId: string | null = null): boolean {
    const distributionFlavor = BuildFlavor.getWindowsDistributionFlavor(flavor, appUserModelId);
    return (
      distributionFlavor === BuildFlavor.Dev ||
      distributionFlavor === BuildFlavor.Nightly ||
      distributionFlavor === BuildFlavor.InternalAlpha ||
      distributionFlavor === BuildFlavor.PublicBeta ||
      distributionFlavor === BuildFlavor.Prod
    );
  },
  shouldIncludeWindowsSandboxService(flavor: string, appUserModelId: string | null = null): boolean {
    const distributionFlavor = BuildFlavor.getWindowsDistributionFlavor(flavor, appUserModelId);
    return distributionFlavor === BuildFlavor.Nightly || distributionFlavor === BuildFlavor.Prod;
  },
  allowDevtools(flavor: string): boolean {
    return BuildFlavor.isInternal(flavor);
  },
};

/** flavor → 应用 bundle id（原 Ht；Windows AppUserModelId 与 appData 子目录名用）。 */
export function bundleIdentifier(flavor: string): string {
  switch (flavor) {
    case BuildFlavor.Agent:
      return "com.openai.codex.agent";
    case BuildFlavor.Dev:
      return "com.openai.codex.dev";
    case BuildFlavor.Nightly:
      return "com.openai.codex.nightly";
    case BuildFlavor.InternalAlpha:
      return "com.openai.codex.alpha";
    case BuildFlavor.PublicBeta:
      return "com.openai.codex.beta";
    case BuildFlavor.Prod:
      return "com.openai.codex";
  }
}
