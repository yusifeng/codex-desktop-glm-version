// SFTP 批处理传输：SSH 主机文件的 put/get（spawn sftp -b -）。
//
// 对应 main-C-Mhak1n.ts 97,918-97,961：
//   - RBe/zBe：upload/download 入口
//   - QH：批处理执行（stdin 写入命令行；退出码非 0 → 汇总 stderr 抛错）
//   - BBe：ssh 选项转 sftp 选项（-p <port> → -P <port>，附加 BatchMode=yes）
//   - $H：批处理路径引号转义（换行拒绝 + 反斜杠/引号转义）
//
// 模块加载期副作用：无。

import { spawn } from "node:child_process";
import {
  Os as isSshHostConfig,
  qn as executableResolver,
} from "@chunk/shared";

/** SSH 主机配置面（结构化子集）。 */
export interface SshHostConfigLike {
  terminal_command: string[];
}

/** ssh 选项 → sftp 选项（原 `BBe`）：-p <port> → -P <port> + BatchMode=yes。 */
function sftpOptions(sshArgs: string[]): string[] {
  const options = ["-o", "BatchMode=yes"];
  for (let index = 0; index < sshArgs.length; index += 1) {
    const arg = sshArgs[index];
    if (arg === "-p") {
      const port = sshArgs[index + 1];
      if (port == null) throw new Error("SSH terminal command is missing a port value");
      options.push("-P", port);
      index += 1;
      continue;
    }
    options.push(arg);
  }
  return options;
}

/** 批处理路径引号转义（原 `$H`）：换行拒绝 + 反斜杠/引号转义。 */
function quoteSftpPath(path: string): string {
  if (/[\r\n]/.test(path)) throw new Error("SFTP batch paths cannot contain newlines");
  return `"${path.replace(/[\\"]/g, "\\$&")}"`;
}

/** 批处理执行（原 `QH`）。 */
async function runSftpBatch({
  command,
  operation,
  sourcePath,
  targetPath,
  hostConfig,
}: {
  command: "put" | "get";
  operation: "upload" | "download";
  sourcePath: string;
  targetPath: string;
  hostConfig: SshHostConfigLike;
}): Promise<void> {
  if (!isSshHostConfig(hostConfig)) throw new Error(`SFTP ${operation}s require an SSH host`);
  const [sshCommand, ...sshArgs] = hostConfig.terminal_command;
  if (sshCommand !== "ssh") throw new Error("SSH host is missing an ssh terminal command");
  const quotedSource = quoteSftpPath(sourcePath);
  const quotedTarget = quoteSftpPath(targetPath);
  const child = spawn(executableResolver.resolve("sftp") ?? "sftp", ["-b", "-", ...sftpOptions(sshArgs)], {
    stdio: ["pipe", "pipe", "pipe"],
  });
  child.stdin?.end(`${command} ${quotedSource} ${quotedTarget}\n`);
  const stderrChunks: Buffer[] = [];
  child.stderr?.on("data", (chunk: Buffer) => stderrChunks.push(chunk));
  const exitCode = await new Promise<number | null>((resolve) => {
    child.on("close", (code) => resolve(code));
    child.on("error", () => resolve(null));
  });
  if (exitCode !== 0) {
    const stderr = Buffer.concat(stderrChunks).toString("utf8").trim();
    throw new Error(`SFTP ${operation} failed${stderr.length > 0 ? `: ${stderr}` : ""}`);
  }
}

/** 上传（原 `RBe`）。 */
export async function sftpUpload({ sourcePath, targetPath, hostConfig }: { sourcePath: string; targetPath: string; hostConfig: SshHostConfigLike }): Promise<void> {
  await runSftpBatch({ command: "put", operation: "upload", sourcePath, targetPath, hostConfig });
}

/** 下载（原 `zBe`）。 */
export async function sftpDownload({ sourcePath, targetPath, hostConfig }: { sourcePath: string; targetPath: string; hostConfig: SshHostConfigLike }): Promise<void> {
  await runSftpBatch({ command: "get", operation: "download", sourcePath, targetPath, hostConfig });
}
