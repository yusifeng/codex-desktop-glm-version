// 语言服务器运行时资源锁定清单（pyright / TypeScript LS / Java LS / Kotlin /
// rust-analyzer）。
//
// 对应 main-C-Mhak1n.ts 的 128,278-128,458 行区段：
//   - HQ = 9e5（下载超时 90s）
//   - C1e：pyright 1.1.413（npm tgz，sha256 锁定）
//   - w1e：typescript-language-server 5.3.0 + typescript 5.9.3（双包）
//   - T1e + E1e + D1e：java-language-server 0.1.2 + 三平台 config
//     （darwin config_mac / linux config_linux / win32 config_win）
//   - O1e：kotlin-server 0.0.6 vsix 六平台（JetBrains CDN，~390MB/平台）
//   - k1e：rust-analyzer 2026-08-24 六平台（GitHub Releases gz/zip）
//
// 所有条目 URL + sha256 + sizeBytes 锁定（直接证据）。

// ---------------------------------------------------------------------------
// 常量
// ---------------------------------------------------------------------------

/** 下载超时（原 `HQ` = 9e5）。 */
export const LANGUAGE_SERVER_DOWNLOAD_TIMEOUT_MS = 90_000;

// ---------------------------------------------------------------------------
// 类型
// ---------------------------------------------------------------------------

/** 资源格式。 */
export type ResourceFormat = "tar.gz" | "zip" | "gz";

/** 平台资源条目。 */
export interface PlatformResource {
  format: ResourceFormat;
  sha256: string;
  sizeBytes: number;
  targetPath: string;
  url: string;
}

/** 平台键（node 风格）。 */
export type PlatformKey =
  | "darwin-arm64"
  | "darwin-x64"
  | "linux-arm64"
  | "linux-x64"
  | "win32-arm64"
  | "win32-x64";

// ---------------------------------------------------------------------------
// 资源清单（全部 sha256/sizeBytes/URL 与原文逐一核对）
// ---------------------------------------------------------------------------

/** pyright 1.1.413（原 `C1e`）。 */
export const PYRIGHT_RESOURCE: PlatformResource = {
  format: "tar.gz",
  sha256: "7322a75188e788f9fe7cbb71891af435a713bf8985141dc0d28e8ca243977bee",
  sizeBytes: 4_155_725,
  sourcePath: "package",
  targetPath: "node_modules/pyright",
  url: "https://registry.npmjs.org/pyright/-/pyright-1.1.413.tgz",
} as PlatformResource & { sourcePath: string };

/** TypeScript LS 5.3.0 + TypeScript 5.9.3（原 `w1e` 双包）。 */
export const TYPESCRIPT_RESOURCES: Array<PlatformResource & { sourcePath: string }> = [
  {
    format: "tar.gz",
    sha256: "398cacc17fff2108652e7b4050e3182008d17063246b3fea7dcf5fae2ce1560e",
    sizeBytes: 501_633,
    sourcePath: "package",
    targetPath: "node_modules/typescript-language-server",
    url: "https://registry.npmjs.org/typescript-language-server/-/typescript-language-server-5.3.0.tgz",
  },
  {
    format: "tar.gz",
    sha256: "10e108c9cf7d5f2879053dff18515fb405abf2ccef63eaaf017d9c571687a1d3",
    sizeBytes: 4_377_468,
    sourcePath: "package",
    targetPath: "node_modules/typescript",
    url: "https://registry.npmjs.org/typescript/-/typescript-5.9.3.tgz",
  },
];

/** Java LS 0.1.2 主体（原 `T1e`）。 */
export const JAVA_LANGUAGE_SERVER_RESOURCE: PlatformResource & { sourcePath: string } = {
  format: "tar.gz",
  sha256: "634f4c82341b8b4157a36387d163c4658ebecaf8f30ef6cd4b0cd4bd06aaca0d",
  sizeBytes: 51_316_914,
  sourcePath: "package",
  targetPath: "node_modules/@vscjava/java-language-server",
  url: "https://registry.npmjs.org/@vscjava/java-language-server/-/java-language-server-0.1.2.tgz",
};

/** Java LS 三平台 config（原 `E1e`）。 */
export const JAVA_LANGUAGE_SERVER_CONFIG: Record<"darwin" | "linux" | "win32", PlatformResource & { sourcePath: string }> = {
  darwin: {
    format: "tar.gz",
    sha256: "4c064db9be2cb504d551c04396d1ec9597893b129f3b7a7b84e347bfa8715304",
    sizeBytes: 2_495,
    sourcePath: "package",
    targetPath: "node_modules/@vscjava/java-ls-config-darwin",
    url: "https://registry.npmjs.org/@vscjava/java-ls-config-darwin/-/java-ls-config-darwin-0.1.1.tgz",
  },
  linux: {
    format: "tar.gz",
    sha256: "93a9aee0fb678f5c011a1ca607664c126318f906634617dbd1bbcbdfeeb8aef5",
    sizeBytes: 2_477,
    sourcePath: "package",
    targetPath: "node_modules/@vscjava/java-ls-config-linux",
    url: "https://registry.npmjs.org/@vscjava/java-ls-config-linux/-/java-ls-config-linux-0.1.1.tgz",
  },
  win32: {
    format: "tar.gz",
    sha256: "48389859e5142081b054312abd9cf3791edc729ee6b4e9a2d1e25837eec56c38",
    sizeBytes: 10_110_882,
    sourcePath: "package",
    targetPath: "node_modules/@vscjava/java-ls-config-win32",
    url: "https://registry.npmjs.org/@vscjava/java-ls-config-win32/-/java-ls-config-win32-0.1.1.tgz",
  },
};

/** config 子目录名（原 `D1e`）。 */
export const JAVA_CONFIG_DIRECTORIES: Record<"darwin" | "linux" | "win32", string> = {
  darwin: "config_mac",
  linux: "config_linux",
  win32: "config_win",
};

/** Kotlin server 0.0.6 六平台 vsix（原 `O1e`）。 */
export const KOTLIN_SERVER_RESOURCES: Record<PlatformKey, PlatformResource> = {
  "darwin-arm64": {
    format: "zip",
    sha256: "bef5789896b8b25034d44e08422fc81e690c66e371047b669b02b8f5726e58db",
    sizeBytes: 389_865_891,
    targetPath: "server",
    url: "https://download-cdn.jetbrains.com/language-server/kotlin-server/262.9593.0/kotlin-server-0.0.6-mac-aarch64.vsix",
  },
  "darwin-x64": {
    format: "zip",
    sha256: "4b45381d9869475c085a3659895d4aa336922989464e7856beaa9deaa23b99c4",
    sizeBytes: 391_701_096,
    targetPath: "server",
    url: "https://download-cdn.jetbrains.com/language-server/kotlin-server/262.9593.0/kotlin-server-0.0.6-mac-amd64.vsix",
  },
  "linux-arm64": {
    format: "zip",
    sha256: "c9c11d98194c72fd1056ca58d1434e9ce708b9f524e9c6b356ca3085c6db60fa",
    sizeBytes: 396_017_119,
    targetPath: "server",
    url: "https://download-cdn.jetbrains.com/language-server/kotlin-server/262.9593.0/kotlin-server-0.0.6-linux-aarch64.vsix",
  },
  "linux-x64": {
    format: "zip",
    sha256: "90974cd81d31fa27b5c487c29f712a956bc6887667d5712c260303f7e33687ec",
    sizeBytes: 396_915_522,
    targetPath: "server",
    url: "https://download-cdn.jetbrains.com/language-server/kotlin-server/262.9593.0/kotlin-server-0.0.6-linux-amd64.vsix",
  },
  "win32-arm64": {
    format: "zip",
    sha256: "a930cef3f74d478cf2a986e01ab325199ef65210747c97090ccb3341a1b660d6",
    sizeBytes: 372_167_599,
    targetPath: "server",
    url: "https://download-cdn.jetbrains.com/language-server/kotlin-server/262.9593.0/kotlin-server-0.0.6-win-aarch64.vsix",
  },
  "win32-x64": {
    format: "zip",
    sha256: "b00793e9474925d9fb17ddbb73114233b84637aa33656031d1c62ed00501298d",
    sizeBytes: 392_537_879,
    targetPath: "server",
    url: "https://download-cdn.jetbrains.com/language-server/kotlin-server/262.9593.0/kotlin-server-0.0.6-win-amd64.vsix",
  },
};

/** rust-analyzer 2026-08-24 六平台（原 `k1e`）。 */
export const RUST_ANALYZER_RESOURCES: Record<PlatformKey, PlatformResource> = {
  "darwin-arm64": {
    format: "gz",
    sha256: "5f4557c2ea4d62f80f1ffeea2646d0d56fab7172a0db11f3065c4d246b763989",
    sizeBytes: 13_875_126,
    targetPath: "rust-analyzer",
    url: "https://github.com/rust-lang/rust-analyzer/releases/download/2026-08-24/rust-analyzer-aarch64-apple-darwin.gz",
  },
  "darwin-x64": {
    format: "gz",
    sha256: "822cc4369562fc2ed26d1cf3953ef93927d8fdda4302d82e2eec407e2734eefd",
    sizeBytes: 14_591_602,
    targetPath: "rust-analyzer",
    url: "https://github.com/rust-lang/rust-analyzer/releases/download/2026-08-24/rust-analyzer-x86_64-apple-darwin.gz",
  },
  "linux-arm64": {
    format: "gz",
    sha256: "3463f9115c725fc5dfb002431833ec83d1f1f9c4c35b76ad5f47b92c58a521f1",
    sizeBytes: 14_317_193,
    targetPath: "rust-analyzer",
    url: "https://github.com/rust-lang/rust-analyzer/releases/download/2026-08-24/rust-analyzer-aarch64-unknown-linux-gnu.gz",
  },
  "linux-x64": {
    format: "gz",
    sha256: "c4d409690b98d84ce98174829362a59214825d72304fe2504f4b906a116b51fe",
    sizeBytes: 14_865_773,
    targetPath: "rust-analyzer",
    url: "https://github.com/rust-lang/rust-analyzer/releases/download/2026-08-24/rust-analyzer-x86_64-unknown-linux-gnu.gz",
  },
  "win32-arm64": {
    format: "zip",
    sha256: "8685e2b4df4ad9ac6fe6b08be7600383496199cd29d413ca47ad67c658e3a510",
    sizeBytes: 15_632_264,
    targetPath: "rust-analyzer",
    url: "https://github.com/rust-lang/rust-analyzer/releases/download/2026-08-24/rust-analyzer-aarch64-pc-windows-msvc.zip",
  },
  "win32-x64": {
    format: "zip",
    sha256: "f6d80045e6f475606f62d294fa3b618304fd24d2ff86160495440f23d5f7fcdb",
    sizeBytes: 17_510_347,
    targetPath: "rust-analyzer",
    url: "https://github.com/rust-lang/rust-analyzer/releases/download/2026-08-24/rust-analyzer-x86_64-pc-windows-msvc.zip",
  },
};
