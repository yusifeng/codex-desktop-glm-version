// shared chunk：跨目录文件名搜索（file-search 分区）。
//
// 对应 src-DldfpmrL.ts 的 L59,754-59,848 区段：
//   - Pie（tt）：searchFileNames——query → rg --files --hidden
//     --iglob `**/*<escaped>*`（Lie：glob 元字符转义），每目录收集，
//     上限 maxResults；rg 失败（非 0/1 退出码或 spawn 异常）标记降级，
//     全空且曾失败 → Iie BFS 回退（readdir 遍历 ≤5000 目录，
//     文件名 contains 匹配）
//   - Fie：默认 runCommand——spawn + sanitized env + stdout 收集；
//     无 pid / spawn 异常 → 退出码 2
//   - 结果形态：{ label: 文件名, path: 目录相对路径, fsPath: 绝对路径 }
//
// 兼容导出：tt=Pie。

import { spawn } from "node:child_process";
import * as fs from "node:fs";
import * as fsp from "node:fs/promises";
import { basename, isAbsolute, join, relative } from "node:path";

import { memoizedTaggedLogger } from "@chunk/logger";

const searchLog = memoizedTaggedLogger("file-search");

// ---------------------------------------------------------------------------
// spawn 收集（原 `Fie`）
// ---------------------------------------------------------------------------

/** runCommand 形态（原 `Fie` 的返回）。 */
export interface CommandOutput {
  stdout: string;
  code: number;
}

/** sanitized env（原 `Bj` 的引用形态，实现在 bootstrap 分区）。 */
function sanitizedEnv(): NodeJS.ProcessEnv {
  return { ...process.env } as NodeJS.ProcessEnv;
}

/** PATH 上的可执行文件解析（原 `sJ.resolve` 的简化形态：含路径分隔符直通）。 */
function resolveExecutable(command: string, cwd: string): string {
  if (command.includes("/") || (process.platform === "win32" && command.includes("\\"))) return command;
  return command;
}

/** 默认命令执行器（原 `Fie`）。 */
function runCommand(args: string[], cwd: string): Promise<CommandOutput> {
  return new Promise((resolveResult) => {
    try {
      const child = spawn(resolveExecutable(args[0], cwd), args.slice(1), {
        cwd,
        env: sanitizedEnv(),
        stdio: ["ignore", "pipe", "pipe"],
      });
      const chunks: Buffer[] = [];
      child.stdout?.on("data", (chunk) => {
        chunks.push(chunk);
      });
      child.once("error", () => resolveResult({ stdout: "", code: 2 }));
      child.once("exit", (code) => resolveResult({ stdout: Buffer.concat(chunks).toString("utf8"), code: code ?? 2 }));
      if (!child.pid) return;
    } catch {
      resolveResult({ stdout: "", code: 2 });
    }
  });
}

// ---------------------------------------------------------------------------
// 搜索（原 `Pie`/`Iie`/`Lie`）
// ---------------------------------------------------------------------------

/** 搜索结果条目。 */
export interface FileSearchResult {
  label: string;
  path: string;
  fsPath: string;
}

/** 搜索选项。 */
export interface FileSearchOptions {
  rgPath?: string;
  runCommand?: (args: string[], cwd: string) => Promise<CommandOutput>;
}

/** glob 元字符转义（原 `Lie`）。 */
function escapeGlob(query: string): string {
  const meta = ["*", "?", "[", "]", "{", "}", "!", "\\"];
  let escaped = "";
  for (const char of query) escaped += meta.includes(char) ? `\\${char}` : char;
  return escaped;
}

/**
 * 跨目录文件名搜索（原 `Pie`，导出 `tt`）。
 * rg 优先；全部目录 rg 失败且无结果时 BFS 回退。
 */
export async function searchFileNames(
  query: string,
  directories: string[],
  maxResults = 10,
  options?: FileSearchOptions,
): Promise<FileSearchResult[]> {
  const trimmed = query.trim();
  if (trimmed.length === 0 || directories.length === 0 || maxResults <= 0) return [];
  const glob = `**/*${escapeGlob(trimmed)}*`;
  const rgPath = options?.rgPath ?? "rg";
  const run = options?.runCommand ?? runCommand;
  const results: FileSearchResult[] = [];
  let anyFailed = false;
  for (const directory of directories) {
    if (results.length >= maxResults) break;
    try {
      const { stdout, code } = await run([rgPath, "--files", "--hidden", "--iglob", glob], directory);
      if (code !== 0 && code !== 1) {
        anyFailed = true;
        continue;
      }
      const lines = stdout
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean);
      for (const line of lines) {
        if (results.length >= maxResults) break;
        const fsPath = isAbsolute(line) ? line : join(directory, line);
        const label = basename(fsPath).replace(/\\/g, "/");
        const relativePath = relative(directory, fsPath).replace(/\\/g, "/");
        const displayPath = relativePath && !relativePath.startsWith("..") ? relativePath : fsPath;
        results.push({ label, path: displayPath, fsPath });
      }
    } catch (error) {
      searchLog().warning("Ripgrep search failed", { safe: {}, sensitive: { error } });
      anyFailed = true;
    }
  }
  return results.length > 0 || !anyFailed ? results : bfsSearchFileNames(trimmed, directories, maxResults);
}

/** BFS 回退（原 `Iie`：≤5000 目录，文件名 contains）。 */
async function bfsSearchFileNames(query: string, directories: string[], maxResults: number): Promise<FileSearchResult[]> {
  const needle = query.toLowerCase();
  const results: FileSearchResult[] = [];
  for (const directory of directories) {
    const pending: string[] = [directory];
    let visited = 0;
    while (pending.length > 0 && results.length < maxResults && visited < 5_000) {
      visited += 1;
      const current = pending.shift();
      if (!current) break;
      let entries: fs.Dirent[];
      try {
        entries = await fsp.readdir(current, { withFileTypes: true });
      } catch {
        continue;
      }
      for (const entry of entries) {
        const entryPath = join(current, entry.name);
        if (entry.isDirectory()) {
          pending.push(entryPath);
          continue;
        }
        if (!entry.isFile() || !entry.name.toLowerCase().includes(needle)) continue;
        const label = entry.name.replace(/\\/g, "/");
        const relativePath = relative(directory, entryPath).replace(/\\/g, "/");
        const displayPath = relativePath && !relativePath.startsWith("..") ? relativePath : entryPath;
        results.push({ label, path: displayPath, fsPath: entryPath });
        if (results.length >= maxResults) break;
      }
    }
    if (results.length >= maxResults) break;
  }
  return results;
}

// ---------------------------------------------------------------------------
// 兼容导出（file-search 分区 1 个压缩名）
// ---------------------------------------------------------------------------

export { searchFileNames as tt };
