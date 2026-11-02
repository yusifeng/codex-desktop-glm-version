// Compile src/**/*.ts back into the runnable app tree (app/**/*.js).
//
// 两种源码，输出到完全相同的 chunk 布局：
//   1. 已逆向重写的 chunk（chunk-manifest.mjs 的 REWRITTEN）：
//      src/main/<语义名>/index.ts 是真实的模块化 TypeScript，用 esbuild
//      打包成单个输出 chunk。源码里写作 "@chunk/<语义名>" 的 import 指向
//      兄弟输出 chunk，构建时改写为运行时 require 并保持 external。
//   2. 其余 chunk（每个发布 chunk 一个 .ts 文件）：仅做 TS→JS 转换，
//      不打包，输出与发布版逐字节一致。
//
//   node scripts/build.mjs           build
//   node scripts/build.mjs --check   also verify each *transform-only* file
//                                    compiles identically as TS and as JS
//                                    (TS-only parses such as `a<b>(c)` would
//                                    silently change behavior)
import * as esbuild from "esbuild";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { CHUNKS, EXACT_PROCESS_ROOTS, PRESERVED, REWRITTEN } from "./chunk-manifest.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const check = process.argv.includes("--check");
// verbatimModuleSyntax: never drop imports that look unused (they may have side effects).
const tsconfigRaw = { compilerOptions: { verbatimModuleSyntax: true } };
const common = { target: "esnext", charset: "utf8", legalComments: "inline" };

// These trees are entirely generated from semantic source. Clear them before
// emission so deleted modules cannot survive as stale packaged JS.
for (const generatedTree of ["main-app", "shared"])
  await fs.rm(path.join(ROOT, "app/.vite/build", generatedTree), { recursive: true, force: true });

// main-app modules are emitted as ESM files and loaded from the CommonJS main
// chunk through Node's native module loader. Node's ESM resolver does not add
// file extensions to relative specifiers, while TypeScript source imports are
// intentionally extensionless. Normalize only relative JavaScript imports in
// this emitted tree; bare packages and @chunk/* aliases retain their contract.
function rewriteChunkImports(code, dst) {
  const rewrite = (specifier) => {
    const output = CHUNKS[specifier.slice("@chunk/".length)];
    if (output == null) return specifier;
    let relative = path.relative(path.dirname(dst), path.join(ROOT, "app/.vite/build", output));
    relative = relative.split(path.sep).join("/");
    return relative.startsWith(".") ? relative : `./${relative}`;
  };
  return code
    .replace(/(from\s+["'])@chunk\/([^"']+)(["'])/g, (_m, prefix, name, suffix) =>
      `${prefix}${rewrite(`@chunk/${name}`)}${suffix}`,
    )
    .replace(/(import\(\s*["'])@chunk\/([^"']+)(["']\s*\))/g, (_m, prefix, name, suffix) =>
      `${prefix}${rewrite(`@chunk/${name}`)}${suffix}`,
    )
    .replace(/(require\(\s*["'])@chunk\/([^"']+)(["']\s*\))/g, (_m, prefix, name, suffix) =>
      `${prefix}${rewrite(`@chunk/${name}`)}${suffix}`,
    );
}

function withJsExtensions(code) {
  return code
    .replace(/(from\s+["'])(\.{1,2}\/[^"']+)(["'])/g, (_m, prefix, specifier, suffix) =>
      `${prefix}${/\.(?:js|json|node)$/.test(specifier) ? specifier : `${specifier}.js`}${suffix}`,
    )
    .replace(/(import\(\s*["'])(\.{1,2}\/[^"']+)(["']\s*\))/g, (_m, prefix, specifier, suffix) =>
      `${prefix}${/\.(?:js|json|node)$/.test(specifier) ? specifier : `${specifier}.js`}${suffix}`,
    );
}

// 已重写 chunk 的输出文件名集合，用于跳过对应的旧格式 .ts（正常情况下已被删除）。
const rewrittenOutputs = new Set([...REWRITTEN].map((name) => CHUNKS[name]));

// 把 "@chunk/<语义名>" 映射为对输出 chunk 的外部 require。
const chunkImportPlugin = {
  name: "chunk-imports",
  setup(build) {
    build.onResolve({ filter: /^@chunk\// }, (args) => {
      const name = args.path.slice("@chunk/".length);
      const output = CHUNKS[name];
      if (output == null) throw new Error(`Unknown chunk referenced as @chunk/${name}`);
      return { path: `./${output}`, external: true };
    });
  },
};

// The browser page preload runs in Electron's sandboxed preload context, whose
// require implementation only exposes approved bare modules such as
// "electron".  Recovered semantic owners therefore cannot remain as runtime
// relative requires.  Resolve the published output-relative specifiers back to
// their TypeScript owners so esbuild can inline the complete graph into the
// single preload entry.
const browserPagePreloadOwnersPlugin = {
  name: "browser-page-preload-owners",
  setup(build) {
    build.onResolve({ filter: /^\.\/browser-page-preload\// }, (args) => ({
      path: path.join(
        ROOT,
        "src/main",
        `${args.path.slice("./".length)}.ts`,
      ),
    }));
  },
};

async function listTs(dir) {
  const out = [];
  for (const e of await fs.readdir(dir, { withFileTypes: true, recursive: true })) {
    // .d.ts 是类型声明（如 @chunk/* 的模块声明），不是 chunk 源码。
    if (e.isFile() && e.name.endsWith(".ts") && !e.name.endsWith(".d.ts"))
      out.push(path.join(e.parentPath, e.name));
  }
  return out;
}

// ---- 1. transform-only：未重写的 chunk ----
const rewrittenDirs = [...REWRITTEN].map((name) => path.join(ROOT, "src/main", name) + path.sep);
const jobs = [];
for (const src of await listTs(path.join(ROOT, "src/main"))) {
  // 已重写 chunk 的源码目录（src/main/<语义名>/）由打包步骤处理，不走 transform。
  if (rewrittenDirs.some((dir) => src.startsWith(dir))) continue;
  const rel = path.relative(path.join(ROOT, "src/main"), src);
  if (rewrittenOutputs.has(rel.replace(/\.ts$/, ".js"))) {
    console.error(`error: ${rel} 对应的 chunk 已重写（见 chunk-manifest.mjs），请删除这个旧文件`);
    process.exit(1);
  }
  jobs.push([src, path.join(ROOT, "app/.vite/build", rel.replace(/\.ts$/, ".js"))]);
}
// Exact-recovery process roots are checked-in application source. Reference
// release files remain audit inputs only and are never consumed by the build.
const recoveredMain = path.join(ROOT, "src/main-recovered");
const recoveredOwnershipBySource = new Map([
  ...[...EXACT_PROCESS_ROOTS].map(([name, owner]) => [owner.source, `exact process root ${name}`]),
  ...[...PRESERVED].map(([name]) => [CHUNKS[name].replace(/\.js$/, ".ts"), `preserved boundary ${name}`]),
]);
const seenRecoveredSources = new Set();
for (const src of await listTs(recoveredMain)) {
  const rel = path.relative(recoveredMain, src);
  if (!recoveredOwnershipBySource.has(rel)) {
    console.error(`error: ${rel} has no exact-process or preserved source owner`);
    process.exit(1);
  }
  seenRecoveredSources.add(rel);
  jobs.push([src, path.join(ROOT, "app/.vite/build", rel.replace(/\.ts$/, ".js"))]);
}
for (const [source, owner] of recoveredOwnershipBySource) {
  if (!seenRecoveredSources.has(source)) {
    console.error(`error: ${owner} source is missing: src/main-recovered/${source}`);
    process.exit(1);
  }
}
for (const src of await listTs(path.join(ROOT, "src/webview"))) {
  const rel = path.relative(path.join(ROOT, "src/webview"), src);
  jobs.push([src, path.join(ROOT, "app/webview", rel.replace(/\.ts$/, ".js"))]);
}

const mismatches = [];
const errors = [];
let i = 0;
async function worker() {
  while (i < jobs.length) {
    const [src, dst] = jobs[i++];
    const code = await fs.readFile(src, "utf8");
    try {
      // The published worker entry is CommonJS and loads extracted helpers via
      // require(). Keep those helper files CommonJS too; plain transform would
      // preserve TypeScript's ESM export syntax under the repo's module mode.
      const commonJsHelper =
        /[\\/]src[\\/]main[\\/]worker[\\/]/.test(src) ||
        /[\\/]src[\\/]main[\\/]browser-page-preload[\\/]/.test(src) ||
        src.endsWith("/src/main/main-app/util/main-business.ts") ||
        src.endsWith("/src/main/main-app/util/url-trust.ts");
      const ts = await esbuild.transform(code, {
        ...common,
        loader: "ts",
        tsconfigRaw,
        ...(commonJsHelper ? { format: "cjs" } : {}),
      });
      // Semantic source directories are authored TypeScript modules. The
      // transform-only JS parity check applies only to preserved published
      // chunks; parsing these modules as plain JS would reject interfaces,
      // type-only imports, and generic syntax by design.
      const semanticSource = /[\\/]src[\\/]main[\\/](shared|main-app|worker|browser-page-preload)[\\/]/.test(src);
      if (check && !semanticSource) {
        const js = await esbuild.transform(code, { ...common, loader: "js" });
        if (js.code !== ts.code) mismatches.push(src);
      }
      await fs.mkdir(path.dirname(dst), { recursive: true });
      const emitted = /[\\/]src[\\/]main[\\/](?:main-app|shared)[\\/]/.test(src)
        ? withJsExtensions(rewriteChunkImports(ts.code, dst))
        : ts.code;
      await fs.writeFile(dst, emitted);
    } catch (err) {
      const detail = err.errors?.[0]?.text ?? err.message.split("\n")[0];
      errors.push(`${path.relative(ROOT, src)}: ${detail}`);
    }
  }
}
// CI and developer hosts can report hundreds of logical CPUs. Spawning one
// esbuild transform loop per CPU exhausts descriptors and makes otherwise
// valid files fail with opaque "Transform failed" errors.
const transformWorkers = Math.min(os.cpus().length, 2);
await Promise.all(Array.from({ length: transformWorkers }, worker));

// Overwrite the transform-only process-root emission with a sandbox-safe
// single-file bundle.  The individual owner outputs remain available for
// focused tests and audits, but the packaged preload has no relative runtime
// require fallback.
let browserPagePreloadBundled = false;
try {
  await esbuild.build({
    entryPoints: [path.join(ROOT, "src/main-recovered/browser-page-preload.ts")],
    outfile: path.join(ROOT, "app/.vite/build/browser-page-preload.js"),
    bundle: true,
    format: "cjs",
    platform: "node",
    target: "esnext",
    charset: "utf8",
    packages: "external",
    plugins: [browserPagePreloadOwnersPlugin],
    logLevel: "warning",
  });
  browserPagePreloadBundled = true;
} catch (err) {
  errors.push(`browser-page-preload bundle: ${err.message.split("\n")[0]}`);
}

// ---- 2. bundle：已重写的 chunk ----
const bundleSummaries = [];
for (const name of REWRITTEN) {
  const entry = path.join(ROOT, "src/main", name, "index.ts");
  const outfile = path.join(ROOT, "app/.vite/build", CHUNKS[name]);
  try {
    const result = await esbuild.build({
      entryPoints: [entry],
      outfile,
      bundle: true,
      format: "cjs",
      platform: "node",
      target: "esnext",
      charset: "utf8",
      // node: 内置模块、electron 等裸导入一律保持外部 require。
      packages: "external",
      metafile: true,
      plugins: [chunkImportPlugin],
      logLevel: "warning",
    });
    // CJS 输出的 metafile 不报告 exports；从产物的 __export(_, { ... }) 块里扫。
    const code = await fs.readFile(outfile, "utf8");
    const exports = [
      ...code.matchAll(/__export\(\w+, \{([\s\S]*?)\n\}\)/g),
    ].flatMap((m) => [...m[1].matchAll(/^\s*([A-Za-z0-9_$]+):/gm)].map((k) => k[1]));
    bundleSummaries.push({ name, file: CHUNKS[name], exports: [...new Set(exports)] });
  } catch (err) {
    errors.push(`${name}: ${err.message.split("\n")[0]}`);
  }
}

for (const e of errors) console.error(`error: ${e}`);
for (const m of mismatches) console.error(`TS/JS semantics differ: ${path.relative(ROOT, m)}`);
const transformed = jobs.length - errors.length;
console.log(
  `built ${transformed}/${jobs.length} transform-only files, ` +
    `${bundleSummaries.length}/${REWRITTEN.size} rewritten chunks bundled, ` +
    `${browserPagePreloadBundled ? 1 : 0}/1 sandbox preload roots bundled`,
);
for (const b of bundleSummaries)
  console.log(`  ${b.file} <- src/main/${b.name}/ (exports: ${b.exports.join(", ") || "none"})`);
if (errors.length || mismatches.length) process.exit(1);

// The preserved main chunk still has one historical direct require for this
// helper path.  The module is now bundled into bootstrap, so retain a tiny
// compatibility facade at the published path instead of shipping a second
// copy of the protocol implementation.
await fs.mkdir(path.join(ROOT, "app/.vite/build/bootstrap/protocol"), { recursive: true });
await fs.writeFile(
  path.join(ROOT, "app/.vite/build/bootstrap/protocol/app-protocol.js"),
  'const bootstrap = require("../../bootstrap-C4dRql4x.js");\nmodule.exports = { getWebviewEntryPath: bootstrap.ln };\n',
);

// The transform-only webview pass above emits every captured release source,
// including filenames now owned by readable semantic renderer modules. Always
// finish the aggregate build with the renderer pipeline so `npm run build`
// cannot leave those runtime assets silently overwritten by their historical
// transform-only counterparts.
await import("./build-renderer.mjs");
