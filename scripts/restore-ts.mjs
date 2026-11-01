// Restore the bundled JS in ./app into formatted TypeScript sources under ./src.
//
//   app/.vite/build/*.js   -> src/main/*.ts      (Electron main / preload / worker)
//   app/webview/**/*.js    -> src/webview/**/*.ts (renderer chunks)
//
// The shipped app has no sourcemaps, so original module boundaries and types
// cannot be recovered; files keep their chunk names and get `// @ts-nocheck`.
// Run `node scripts/build.mjs` to compile src back into app.
import { Worker, isMainThread, parentPort, workerData } from "node:worker_threads";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const MAPPINGS = [
  { from: "app/.vite/build", to: "src/main" },
  { from: "app/webview", to: "src/webview" },
];
const HEADER = "// @ts-nocheck\n";
// Prettier gets slow and memory hungry on multi-MB chunks; those are copied unformatted.
const MAX_FORMAT_BYTES = 6 * 1024 * 1024;

export async function listJs(dir) {
  const out = [];
  for (const e of await fs.readdir(dir, { withFileTypes: true, recursive: true })) {
    if (e.isFile() && e.name.endsWith(".js")) out.push(path.join(e.parentPath, e.name));
  }
  return out.sort();
}

async function formatOne(prettier, src, dst) {
  let code = await fs.readFile(src, "utf8");
  code = code.replace(/\n?\/\/# sourceMappingURL=\S+\s*$/, "\n");
  if (code.length <= MAX_FORMAT_BYTES) {
    try {
      code = await prettier.format(code, { parser: "babel", printWidth: 100 });
    } catch (err) {
      return { src, error: String(err.message).split("\n")[0] };
    }
  }
  await fs.mkdir(path.dirname(dst), { recursive: true });
  await fs.writeFile(dst, HEADER + code);
  return { src };
}

if (isMainThread) {
  // 已重写 chunk 的输出不做机械恢复，避免在 src/main/<语义名>/ 旁边生成
  // 会被 build 拒绝的旧格式 .ts（真实源码以 src/main/<语义名>/ 为准）。
  const { CHUNKS, EXACT_PROCESS_ROOTS, REWRITTEN } = await import("./chunk-manifest.mjs");
  const ownedOutputs = new Set([
    ...[...REWRITTEN].map((name) => CHUNKS[name]),
    ...[...EXACT_PROCESS_ROOTS].map(([name]) => CHUNKS[name]),
  ]);
  const jobs = [];
  let skipped = 0;
  for (const { from, to } of MAPPINGS) {
    for (const src of await listJs(path.join(ROOT, from))) {
      const rel = path.relative(path.join(ROOT, from), src);
      if (ownedOutputs.has(rel)) {
        skipped++;
        continue;
      }
      jobs.push([src, path.join(ROOT, to, rel.replace(/\.js$/, ".ts"))]);
    }
  }
  if (skipped) console.log(`skipped ${skipped} source-owned chunk(s) (semantic or exact process source)`);
  // Big files first so they don't all land at the end.
  const sizes = new Map(await Promise.all(jobs.map(async ([s]) => [s, (await fs.stat(s)).size])));
  jobs.sort((a, b) => sizes.get(b[0]) - sizes.get(a[0]));

  const n = Math.max(1, os.cpus().length - 1);
  let next = 0, done = 0;
  const failures = [];
  await Promise.all(
    Array.from({ length: n }, () => new Promise((resolve, reject) => {
      const w = new Worker(fileURLToPath(import.meta.url), { workerData: {} });
      const feed = () => (next < jobs.length ? w.postMessage(jobs[next++]) : w.terminate().then(resolve));
      w.on("message", (r) => {
        if (r.error) failures.push(r);
        if (++done % 500 === 0 || done === jobs.length) console.log(`${done}/${jobs.length}`);
        feed();
      });
      w.on("error", reject);
      feed();
    })),
  );
  for (const f of failures) console.warn(`format failed, copied as-is: ${path.relative(ROOT, f.src)}: ${f.error}`);
  console.log(`restored ${jobs.length} files into src/ (${failures.length} unformatted)`);
} else {
  const prettier = await import("prettier");
  parentPort.on("message", async ([src, dst]) => {
    let r;
    try {
      r = await formatOne(prettier, src, dst);
    } catch (err) {
      r = { src, error: String(err) };
    }
    parentPort.postMessage(r);
  });
  void workerData;
}
