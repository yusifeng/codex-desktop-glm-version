// 主进程 chunk 清单：语义名 → 输出 chunk 文件名（app/.vite/build/ 下）。
//
// 发布包里的 chunk 文件名带有内容哈希，且 chunk 之间通过这些文件名互相
// require，因此输出文件名必须保持不变。语义名用于：
//   - 已重写 chunk 的源码目录：src/main/<语义名>/
//   - 跨 chunk 引用：import ... from "@chunk/<语义名>"
//     （构建时映射为对输出 chunk 的运行时 require）
//
// REWRITTEN 中列出的 chunk 已经逆向重写为模块化源码（由 esbuild 打包输出）。
// EXACT_PROCESS_ROOTS 是已检查入库、由构建直接编译的精确保真进程组合根；
// 它们不是发布资产回退，也不能再由 restore-ts 覆盖。PRESERVED 只允许登记
// vendor/generated 边界。三条轨道可以混合，输出文件名始终保持发布契约。

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
  "device-service",
  "bootstrap",
]);

// 已恢复的完整进程组合根。业务 owner 已逐批迁到 src/main 的语义模块，
// 这些根继续持有启动/transport/I/O 的精确装配顺序，并从仓库源码直接构建。
export const EXACT_PROCESS_ROOTS = new Map([
  [
    "main",
    {
      source: "main-C-Mhak1n.ts",
      reason: "main process startup/composition root；语义 owner 迁移记录见 docs/main-coverage-audit.md",
    },
  ],
  [
    "git-worker",
    {
      source: "worker.ts",
      reason: "worker transport、host/I/O 与 Git lifecycle composition root；A1 closure 见 docs/git-worker-audit.md",
    },
  ],
  [
    "browser-page-preload",
    {
      source: "browser-page-preload.ts",
      reason: "isolated-world preload startup root；协议 owner 与审计见 docs/preload-audit.md",
    },
  ],
]);

// 经逐段审计确认无 Codex 业务逻辑、应继续走 transform-only 保真的第三方或
// bundler 生成 chunk。Map 的值是保留理由，禁止为这些内容伪造业务源码。
export const PRESERVED = new Map([
  [
    "bundler-runtime",
    "Rolldown runtime bootstrap；仅提供 chunk/module loader，不含 app 业务代码",
  ],
  [
    "shared",
    "原始 shared 发布 chunk 继续提供未消费 vendor/低频导出；已消费导出通过语义 shared 模块接入，保留原 chunk 保证未迁移调用方兼容",
  ],
  [
    "css-selector",
    "HTML parser/css-selector vendor chunk；主进程仅通过其惰性 parser loader 消费，RpcTarget 已由 shared/rpc-core 提供语义门面",
  ],
  [
    "worker-shared",
    "rolldown CJS/ESM 互操作辅助与 npm ms/debug 实现；worker 专用 vendor 运行时",
  ],
  [
    "main-shared",
    "rolldown runtime 包装的 npm ms/debug 实现；无 Codex 业务状态或协议",
  ],
  [
    "file-type-main",
    "file-type/tokenizer 的 magic-bytes 数据与解析器；主进程构建变体",
  ],
  [
    "file-type-worker",
    "file-type/tokenizer 的 magic-bytes 数据与解析器；worker 自包含构建变体",
  ],
]);
