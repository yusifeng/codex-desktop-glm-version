// 渲染进程构建：把 src/renderer/** 编译回 app/webview/（可运行树）。
//
// 与 scripts/build.mjs（主进程）同一双轨模式，差异：
//   - 输出布局：app/webview/assets/<chunk 文件名>.js（ES module）
//   - 已重写 chunk 的源码在 src/renderer/<语义名>/，用 esbuild bundle，
//     format: "esm"，platform: "browser"
//   - "@rchunk/<语义名>" 的 import 映射为 `./<输出文件名>` 的 external import
//     （renderer chunk 间是相对路径的 ESM 互引）
//   - CSS：src/renderer/<语义名>/index.css（若有）按同哈希名输出到 assets/
//   - transform-only 兜底树继续由 src/webview/assets/<文件名>.ts 提供
//     （scripts/build.mjs 已经处理它；本脚本跳过）
//
//   node scripts/build-renderer.mjs           build
//   node scripts/build-renderer.mjs --check   transform 一致性检查（交 build.mjs）

import * as esbuild from "esbuild";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { CHUNKS, IMPORT_ALIASES, REWRITTEN } from "./renderer-chunk-manifest.mjs";
import { collectConversationRouteClosure } from "./renderer-route-recovery.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const tsconfigRaw = { compilerOptions: { verbatimModuleSyntax: true, jsx: "react-jsx" } };
const common = { target: "esnext", charset: "utf8", legalComments: "inline" };

const chunkImportPlugin = {
  name: "renderer-chunk-imports",
  setup(build) {
    build.onResolve({ filter: /^@rchunk\// }, (args) => {
      const name = args.path.slice("@rchunk/".length);
      const output = CHUNKS[name] ?? IMPORT_ALIASES[name];
      if (output == null) throw new Error(`Unknown renderer chunk referenced as @rchunk/${name}`);
      return { path: `./${output}`, external: true };
    });
    // A few restored chunks retain exact release-file imports for lazily loaded
    // language runtimes and preview entries. They already live beside the output
    // chunk in app/webview/assets, so preserve the basename and keep them external
    // instead of recursively bundling the transform-only source tree.
    build.onResolve({ filter: /^\.\.\/\.\.\/webview\/assets\/.+\.js$/ }, (args) => ({
      path: `./${path.basename(args.path)}`,
      external: true,
    }));
    // npm 依赖（react/react-dom 等）：按 external 处理——renderer 发布包没有
    // node_modules，这些依赖已在被引用的共享 chunk 里，重写模块应通过
    // @rchunk/app-shared 或后续登记的 vendor chunk 引入。
    build.onResolve({ filter: /^[^./@]/ }, (args) => ({ path: args.path, external: true }));
  },
};

async function listSourceFiles(dir) {
  const out = [];
  let entries;
  try {
    entries = await fs.readdir(dir, { withFileTypes: true, recursive: true });
  } catch {
    return out;
  }
  for (const e of entries) {
    if (e.isFile() && (e.name.endsWith(".ts") || e.name.endsWith(".tsx")) && !e.name.endsWith(".d.ts"))
      out.push(path.join(e.parentPath, e.name));
  }
  return out;
}

// Route composition roots and their eager dependency closure are maintained as
// one recovered ESM graph. Resolve that graph before the semantic chunk pass so
// draft rewrites are not needlessly bundled and then replaced.
const recoveredRouteSourceDir = path.join(ROOT, "src/renderer-recovered/conversation-route");
const recoveredRouteChunks = await collectConversationRouteClosure(recoveredRouteSourceDir);

// ---- bundle：已重写的 renderer chunk ----
const errors = [];
const bundleSummaries = [];
let skippedSemanticRouteDrafts = 0;
for (const name of REWRITTEN) {
  const entry = path.join(ROOT, "src/renderer", name, "index.ts");
  const outfile = path.join(ROOT, "app/webview/assets", CHUNKS[name]);
  if (recoveredRouteChunks.has(CHUNKS[name])) {
    skippedSemanticRouteDrafts += 1;
    continue;
  }
  try {
    const result = await esbuild.build({
      entryPoints: [entry],
      outfile,
      bundle: true,
      format: "esm",
      platform: "browser",
      target: "esnext",
      charset: "utf8",
      metafile: true,
      plugins: [chunkImportPlugin],
      logLevel: "warning",
    });
    const code = await fs.readFile(outfile, "utf8");
    // ESM 输出的导出面：匹配 `export { a as b, ... };` 语句。
    const exports = [
      ...code.matchAll(/export \{([\s\S]*?)\};/g),
    ].flatMap((m) =>
      [...m[1].matchAll(/(?:[A-Za-z0-9_$]+) as ([A-Za-z0-9_$]+)|(?:^|,\s*)([A-Za-z0-9_$]+)(?=\s*(?:,|$))/gm)]
        .map((k) => k[1] ?? k[2])
        .filter(Boolean),
    );
    bundleSummaries.push({ name, file: CHUNKS[name], exports: [...new Set(exports)] });
  } catch (err) {
    errors.push(`${name}: ${err.message.split("\n")[0]}`);
  }
}

// Recovered semantic chunks often keep a dependency only for its initialization
// side effects.  Some of those imports were reconstructed as default imports even
// though the release chunk exposes named exports only, which makes the browser
// reject the whole module graph before any code can run.  Normalize only imports
// whose target demonstrably has no default export; namespace imports preserve the
// module evaluation and remain usable by the few owners that inspect the module.
const assetsDir = path.join(ROOT, "app/webview/assets");
// The route-critical graph is recovered as checked-in ESM source rather than as
// runtime release assets.  Compile every module from that source graph so the
// application build has one reproducible source pipeline and never copies a
// published JavaScript file into the runtime tree.  Keeping the graph together
// also preserves its exact cross-chunk aliases while the readable semantic
// composition roots continue to be recovered independently.
const routeCompileErrors = [];
await Promise.all(
  [...recoveredRouteChunks].map(async (name) => {
    try {
      const source = await fs.readFile(path.join(recoveredRouteSourceDir, name), "utf8");
      const result = await esbuild.transform(source, {
        ...common,
        format: "esm",
        loader: "js",
        sourcefile: name,
      });
      await fs.writeFile(path.join(assetsDir, name), result.code);
    } catch (error) {
      routeCompileErrors.push(`${name}: ${error.message.split("\n")[0]}`);
    }
  }),
);
if (routeCompileErrors.length > 0) errors.push(...routeCompileErrors);
console.log(`compiled ${recoveredRouteChunks.size - routeCompileErrors.length}/${recoveredRouteChunks.size} recovered runtime-route source modules`);
const assetNames = (await fs.readdir(assetsDir)).filter((name) => name.endsWith(".js"));
const assetSources = new Map(
  await Promise.all(assetNames.map(async (name) => [name, await fs.readFile(path.join(assetsDir, name), "utf8")])),
);
const hasDefaultExport = (code) =>
  /export\s+default\b|export\s*\{[^}]*\bas\s+default\b/.test(code);
for (const [name, originalCode] of assetSources) {
  let code = originalCode.replace(
    /import\s+\{\s*default\s+as\s+([A-Za-z_$][\w$]*)\s*\}\s+from\s+(["'])\.\/([^"']+\.js)\2;/g,
    (statement, binding, quote, target) => {
      const targetCode = assetSources.get(target);
      return targetCode != null && !hasDefaultExport(targetCode)
        ? `import * as ${binding} from ${quote}./${target}${quote};`
        : statement;
    },
  );
  if (code !== originalCode) await fs.writeFile(path.join(assetsDir, name), code);
}

// ---- CSS：src/renderer/<语义名>/index.css → assets/<chunk 基名>.css ----
for (const name of REWRITTEN) {
  const cssEntry = path.join(ROOT, "src/renderer", name, "index.css");
  try {
    await fs.access(cssEntry);
  } catch {
    continue;
  }
  try {
    const css = await fs.readFile(cssEntry, "utf8");
    await fs.writeFile(path.join(ROOT, "app/webview/assets", CHUNKS[name].replace(/\.js$/, ".css")), css);
  } catch (err) {
    errors.push(`${name}/index.css: ${err.message.split("\n")[0]}`);
  }
}

for (const e of errors) console.error(`error: ${e}`);
console.log(`built ${bundleSummaries.length}/${REWRITTEN.size} rewritten renderer chunks`);
console.log(`skipped ${skippedSemanticRouteDrafts} superseded semantic route drafts`);
for (const b of bundleSummaries)
  console.log(`  ${b.file} <- src/renderer/${b.name}/ (exports: ${b.exports.join(", ") || "none"})`);
if (errors.length) process.exit(1);
