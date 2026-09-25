// 渲染进程 chunk 清单：语义名 → 输出 chunk 文件名（app/webview/assets/ 下）。
//
// 与主进程的 chunk-manifest.mjs 同一模式：
//   - REWRITTEN 列出的 chunk 已逆向重写为真实源码（src/renderer/<语义名>/，
//     由 esbuild 打包成单个输出 chunk，输出文件名必须与发布版一致）；
//   - 其余 chunk 仍是「格式化后的原版代码」（src/webview/assets/<文件名>.ts，
//     仅做 TS→JS 转换，保证与发布版逐字节一致）；
//   - 两者可任意比例混合。
//
// 注意与 main 的差异：renderer chunk 是 ES module（import/export），且
// chunk 间引用经 `./<文件名>` 相对路径，构建时由 chunkImportPlugin 改写为
// external import。
//
// 本清单按重写推进逐步登记：key = 语义名（src/renderer/<语义名>/ 目录名），
// value = 发布版 chunk 文件名。

export const CHUNKS = {
  "app-shared": "app-shared-7b9edc1bfb7f.js",
  "app-initial": "app-initial-51da50e6c6e3.js",
  "app-primary": "app-primary-d66705000d76.js",
  "app-main": "app-main-be230e7e4f5a.js",
  "index-entry": "index-e0f46c018fe4.js",
  "rpc": "rpc-971deaddf2c2.js",
  "rolldown-runtime": "rolldown-runtime-2d059c5e81f4.js",
};

// 已完成逆向重写的 chunk（源码在 src/renderer/<语义名>/ 下）。
export const REWRITTEN = new Set([
  "rpc",
]);
