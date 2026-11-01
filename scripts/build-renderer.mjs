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
import {
  EXACT_ROUTE_SOURCE_OWNERS,
  PRESERVED_ROUTE_SOURCE_OUTPUTS,
  collectConversationRouteClosure,
} from "./renderer-route-recovery.mjs";

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
    build.onResolve({ filter: /^@exact-chunk\// }, (args) => ({
      path: `./${args.path.slice("@exact-chunk/".length)}`,
      external: true,
    }));
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
const preservedRouteSourceDir = path.join(ROOT, "src/renderer-preserved/route-runtime");
const preservedRouteManifest = JSON.parse(
  await fs.readFile(path.join(preservedRouteSourceDir, "manifest.json"), "utf8"),
);
const preservedRouteOutputs = new Set(preservedRouteManifest.outputs);
const exactRouteOutputs = new Set(EXACT_ROUTE_SOURCE_OWNERS.values());

// ---- bundle：已重写的 renderer chunk ----
const errors = [];
const bundleSummaries = [];
let skippedSemanticRouteDrafts = 0;
let exactRouteSourcesBuilt = 0;
for (const name of REWRITTEN) {
  const exactOutput = EXACT_ROUTE_SOURCE_OWNERS.get(name);
  // Several historical semantic names intentionally point at the same release
  // chunk. Once one of those names has a release-faithful exact owner, do not
  // let a later compatibility implementation silently overwrite that output.
  // This matters for runtime-4b6d... (thread-shell-runtime vs runtime) and for
  // pending-onboarding, and keeps output ownership deterministic as additional
  // route dependencies are promoted.
  if (exactOutput == null && exactRouteOutputs.has(CHUNKS[name])) {
    skippedSemanticRouteDrafts += 1;
    continue;
  }
  if (exactOutput != null && exactOutput !== CHUNKS[name]) {
    errors.push(`${name}: exact route owner output ${exactOutput} does not match ${CHUNKS[name]}`);
    continue;
  }
  const entry = path.join(ROOT, "src/renderer", name, exactOutput == null ? "index.ts" : "exact.js");
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
    if (exactOutput != null) exactRouteSourcesBuilt += 1;
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
const preservedRouteCompileErrors = [];
if (
  preservedRouteManifest.moduleCount !== preservedRouteOutputs.size ||
  preservedRouteOutputs.size !== PRESERVED_ROUTE_SOURCE_OUTPUTS.size ||
  [...preservedRouteOutputs].some((output) => !PRESERVED_ROUTE_SOURCE_OUTPUTS.has(output))
) {
  errors.push("preserved route source manifest does not match the reviewed source-owner inventory");
} else {
  await Promise.all(
    [...preservedRouteOutputs].map(async (output) => {
      try {
        const sourceName = output.replace(/\.js$/, ".ts");
        const source = await fs.readFile(path.join(preservedRouteSourceDir, sourceName), "utf8");
        const result = await esbuild.transform(source, {
          ...common,
          format: "esm",
          loader: "ts",
          sourcefile: sourceName,
        });
        await fs.writeFile(path.join(assetsDir, output), result.code);
      } catch (error) {
        preservedRouteCompileErrors.push(`${output}: ${error.message.split("\n")[0]}`);
      }
    }),
  );
}
if (preservedRouteCompileErrors.length > 0) errors.push(...preservedRouteCompileErrors);
console.log(
  `compiled ${preservedRouteOutputs.size - preservedRouteCompileErrors.length}/${preservedRouteOutputs.size} preserved vendor/generated route sources`,
);
const assetNames = (await fs.readdir(assetsDir)).filter((name) => name.endsWith(".js"));
const assetSources = new Map(
  await Promise.all(assetNames.map(async (name) => [name, await fs.readFile(path.join(assetsDir, name), "utf8")])),
);
const hasDefaultExport = (code) =>
  /export\s+default\b|export\s*\{[^}]*\bas\s+default\b/.test(code);
for (const [name, originalCode] of assetSources) {
  // @exact-chunk is a build-only namespace. esbuild rewrites static imports via
  // the plugin above, but release chunks also embed dependency URLs in Vite
  // preload tables and occasionally use template-literal dynamic imports. Turn
  // every surviving build alias back into a sibling runtime URL so lazy route
  // dependencies cannot request app://-/assets/@exact-chunk/... at runtime.
  let code = originalCode.replace(/(["'`])@exact-chunk\//g, "$1./").replace(
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

const leakedExactAliases = [];
for (const name of assetNames) {
  const code = await fs.readFile(path.join(assetsDir, name), "utf8");
  if (code.includes("@exact-chunk/")) leakedExactAliases.push(name);
}
if (leakedExactAliases.length > 0)
  errors.push(`build-only @exact-chunk aliases leaked into ${leakedExactAliases.length} runtime assets`);

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
console.log(`built ${exactRouteSourcesBuilt} release-faithful exact route owners`);
console.log(`skipped ${skippedSemanticRouteDrafts} superseded semantic route drafts`);
for (const b of bundleSummaries)
  console.log(`  ${b.file} <- src/renderer/${b.name}/ (exports: ${b.exports.join(", ") || "none"})`);
if (errors.length) process.exit(1);
