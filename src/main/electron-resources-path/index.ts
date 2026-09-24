// 解析应用 resources 目录路径。
//
// 优先使用 CODEX_ELECTRON_RESOURCES_PATH 环境变量（开发/测试时用来把宿主
// 应用指向自定义的 resources 目录），否则回退到 Electron 提供的
// process.resourcesPath。

export interface ElectronResourcesPathInput {
  env: Record<string, string | undefined>;
  resourcesPath: string;
}

export function resolveElectronResourcesPath({
  env,
  resourcesPath,
}: ElectronResourcesPathInput): string {
  return env.CODEX_ELECTRON_RESOURCES_PATH?.trim() || resourcesPath;
}

// 兼容导出：未还原的 chunk 通过 require(...).t 引用。
export { resolveElectronResourcesPath as t };
