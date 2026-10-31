// @ts-nocheck

export function createSftpTransfers({ isSshHostConfig, resolveExecutable, spawn }) {
  function sftpOptions(sshArgs) {
    const options = ["-o", "BatchMode=yes"];
    for (let index = 0; index < sshArgs.length; index += 1) {
      const argument = sshArgs[index];
      if (argument === "-p") {
        const port = sshArgs[index + 1];
        if (port == null) throw new Error("SSH terminal command is missing a port value");
        options.push("-P", port);
        index += 1;
        continue;
      }
      options.push(argument);
    }
    return options;
  }

  function quoteSftpPath(path) {
    if (/[\r\n]/.test(path)) throw new Error("SFTP batch paths cannot contain newlines");
    return `"${path.replace(/[\\"]/g, "\\$&")}"`;
  }

  async function runSftpBatch({ command, operation, sourcePath, targetPath, hostConfig }) {
    if (!isSshHostConfig(hostConfig)) throw new Error(`SFTP ${operation}s require an SSH host`);
    const [sshCommand, ...sshArgs] = hostConfig.terminal_command;
    if (sshCommand !== "ssh") throw new Error("SSH host is missing an ssh terminal command");
    const quotedSource = quoteSftpPath(sourcePath);
    const quotedTarget = quoteSftpPath(targetPath);
    const child = spawn(
      resolveExecutable("sftp") ?? "sftp",
      ["-b", "-", ...sftpOptions(sshArgs)],
      { stdio: ["pipe", "pipe", "pipe"] },
    );
    child.stdin?.end(`${command} ${quotedSource} ${quotedTarget}\n`);
    const stderrChunks = [];
    child.stderr?.on("data", (chunk) => stderrChunks.push(chunk));
    const exitCode = await new Promise((resolve) => {
      child.on("close", resolve);
      child.on("error", () => resolve(null));
    });
    if (exitCode !== 0) {
      const stderr = Buffer.concat(stderrChunks).toString("utf8").trim();
      throw new Error(`SFTP ${operation} failed${stderr.length > 0 ? `: ${stderr}` : ""}`);
    }
  }

  return {
    sftpUpload: ({ sourcePath, targetPath, hostConfig }) =>
      runSftpBatch({ command: "put", operation: "upload", sourcePath, targetPath, hostConfig }),
    sftpDownload: ({ sourcePath, targetPath, hostConfig }) =>
      runSftpBatch({ command: "get", operation: "download", sourcePath, targetPath, hostConfig }),
  };
}

if (typeof module !== "undefined") module.exports = { createSftpTransfers };
