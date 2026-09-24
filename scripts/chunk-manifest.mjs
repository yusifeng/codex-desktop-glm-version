// 主进程 chunk 清单：语义名 → 输出 chunk 文件名（app/.vite/build/ 下）。
//
// 发布包里的 chunk 文件名带有内容哈希，且 chunk 之间通过这些文件名互相
// require，因此输出文件名必须保持不变。语义名用于：
//   - 已重写 chunk 的源码目录：src/main/<语义名>/
//   - 跨 chunk 引用：import ... from "@chunk/<语义名>"
//     （构建时映射为对输出 chunk 的运行时 require）
//
// REWRITTEN 中列出的 chunk 已经逆向重写为真实源码（由 esbuild 打包输出）；
// 其余 chunk 仍是「格式化后的原版代码」（src/main/<chunk 文件名>.ts，
// 仅做 TS→JS 转换，保证与发布版逐字节一致）。两者可以任意比例混合，
// 重写一个 chunk 不需要同时重写它的依赖方或被依赖方。

export const CHUNKS = {
  "early-bootstrap": "early-bootstrap.js",
  "bundler-runtime": "rolldown-runtime-CPUxUITh.js",
  "desktop-open-path-queue": "desktop-open-path-queue-DpR9n1cN.js",
  "electron-resources-path": "electron-resources-path-BDLw2lp0.js",
  logger: "logger-DkO6GWbX.js",
  capture: "capture-DaZJeQgG.js",
  upload: "upload-D8KNqeRP.js",
  "windows-file-copy": "windows-file-copy-B0DNtkPq.js",
  "sandbox-preload": "sandbox-preload.js",
  preload: "preload.js",
  bootstrap: "bootstrap-C4dRql4x.js",
  main: "main-C-Mhak1n.js",
  "git-worker": "worker.js",
  shared: "src-DldfpmrL.js",
  "css-selector": "dist-wQAv1pJP.js",
  "file-type-main": "core-B-w7xKIn.js",
  "file-type-worker": "core-DlTZhmo0.js",
  "device-service": "service-CtZiLFyH.js",
  "worker-shared": "src-BSoROW9v.js",
  "main-shared": "src-C9YLnbgY.js",
  "browser-page-preload": "browser-page-preload.js",
};

// 已完成逆向重写的 chunk（源码在 src/main/<语义名>/ 下）。
export const REWRITTEN = new Set([
  "early-bootstrap",
  "electron-resources-path",
  "desktop-open-path-queue",
  "logger",
  "capture",
  "upload",
  "windows-file-copy",
  "sandbox-preload",
  "preload",
]);
