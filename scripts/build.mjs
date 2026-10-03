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
import { CHUNKS, REWRITTEN } from "./chunk-manifest.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const check = process.argv.includes("--check");
// verbatimModuleSyntax: never drop imports that look unused (they may have side effects).
const tsconfigRaw = { compilerOptions: { verbatimModuleSyntax: true } };
const common = { target: "esnext", charset: "utf8", legalComments: "inline" };

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
// Original comparison chunks live outside src/ so the source tree remains
// navigable. They still compile to their historical output basenames.
const referenceMain = path.join(ROOT, ".reference/originals/main");
for (const src of await listTs(referenceMain)) {
  const rel = path.relative(referenceMain, src);
  jobs.push([src, path.join(ROOT, "app/.vite/build", rel.replace(/\.ts$/, ".js"))]);
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
      await fs.writeFile(dst, ts.code);
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
    `${bundleSummaries.length}/${REWRITTEN.size} rewritten chunks bundled`,
);
for (const b of bundleSummaries)
  console.log(`  ${b.file} <- src/main/${b.name}/ (exports: ${b.exports.join(", ") || "none"})`);
if (errors.length || mismatches.length) process.exit(1);
