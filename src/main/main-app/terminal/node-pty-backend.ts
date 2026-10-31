// @ts-nocheck

/**
 * Creates the local node-pty backend and its Windows console-process enumerator.
 * Platform and process primitives stay injectable so lifecycle behavior can be tested without a real PTY.
 */
export function createNodePtyBackendRuntime(dependencies: Record<string, any>) {
  const {
    runtime,
    promisify,
    execFile,
    path,
    createRequire,
    moduleFilename,
    platform,
    environment,
    killProcess,
  } = dependencies;

  const execFileAsync = promisify(execFile);
  const processIdList = runtime.hf(runtime.if().int().positive());
  const consoleProcessIdEnvironmentKey = `CODEX_CONSOLE_PROCESS_ID`;
  const getConsoleProcessListScript = `
$ErrorActionPreference = 'Stop'
Add-Type -TypeDefinition @'
using System;
using System.Runtime.InteropServices;

public static class CodexConsoleProcessListNative {
    [DllImport("kernel32.dll", SetLastError = true)]
    [return: MarshalAs(UnmanagedType.Bool)]
    public static extern bool AttachConsole(uint processId);

    [DllImport("kernel32.dll", SetLastError = true)]
    [return: MarshalAs(UnmanagedType.Bool)]
    public static extern bool FreeConsole();

    [DllImport("kernel32.dll", SetLastError = true)]
    public static extern uint GetConsoleProcessList([Out] uint[] processIds, uint processCount);
}
'@

$processId = [uint32]$env:${consoleProcessIdEnvironmentKey}
[void][CodexConsoleProcessListNative]::FreeConsole()
if (-not [CodexConsoleProcessListNative]::AttachConsole($processId)) {
    throw 'AttachConsole failed'
}

try {
    $capacity = 64
    do {
        $processIds = [uint32[]]::new($capacity)
        $count = [CodexConsoleProcessListNative]::GetConsoleProcessList($processIds, $capacity)
        $capacity = [int]$count
    } while ($count -gt $processIds.Length)

    $result = if ($count -eq 0) {
        ''
    } else {
        @(
            $processIds[0..([int]$count - 1)] |
                Where-Object { $_ -ne $PID }
        ) -join ','
    }
} finally {
    [void][CodexConsoleProcessListNative]::FreeConsole()
}

[Console]::Out.Write($result)
`;

  async function getWindowsConsoleProcessList(processId: number) {
    const windowsRoot = environment.SystemRoot ?? environment.windir ?? `C:\\Windows`;
    const { stdout } = await execFileAsync(
      path.win32.join(
        windowsRoot,
        `System32`,
        `WindowsPowerShell`,
        `v1.0`,
        `powershell.exe`,
      ),
      [`-NoLogo`, `-NoProfile`, `-NonInteractive`, `-Command`, getConsoleProcessListScript],
      {
        encoding: `utf8`,
        env: {
          ...runtime.Bi(environment),
          [consoleProcessIdEnvironmentKey]: `${processId}`,
        },
        maxBuffer: 65_536,
        timeout: 5_000,
        windowsHide: true,
      },
    );
    const output = stdout.trim();
    return output === `` ? [] : processIdList.parse(output.split(`,`));
  }

  const requireFromMain = createRequire(moduleFilename);

  function normalizeExitSignal(signal: unknown) {
    return signal == null ? null : String(signal);
  }

  class NodePtyBackend {
    pty;

    static create(options: Record<string, any>) {
      const { spawn } = requireFromMain(`node-pty`);
      const [command, ...args] = options.command;
      const pty = spawn(command, args, {
        cols: options.cols,
        rows: options.rows,
        cwd: options.cwd,
        env: options.env,
        getConsoleProcessList:
          platform === `win32` ? getWindowsConsoleProcessList : undefined,
      });
      pty.onData((data: string) => {
        options.callbacks.onData(data);
      });
      pty.onExit(({ exitCode, signal }: Record<string, any>) => {
        options.callbacks.onExit({ code: exitCode, signal: normalizeExitSignal(signal) });
      });
      return new NodePtyBackend(pty);
    }

    constructor(pty: any) {
      this.pty = pty;
    }

    async write(data: string) {
      this.pty.write(data);
    }

    async resize(columns: number, rows: number) {
      this.pty.resize(columns, rows);
    }

    async terminate() {
      await this.pty.kill();
    }

    async dispose({ killProcessTree }: { killProcessTree: boolean }) {
      if (killProcessTree && platform === `darwin`) {
        try {
          const processTree = await runtime.nn(this.pty.pid);
          let firstError;
          for (const processInfo of processTree.reverse()) {
            try {
              killProcess(processInfo.pid, `SIGKILL`);
            } catch (error) {
              if (!(error instanceof Error && `code` in error && error.code === `ESRCH`)) {
                firstError ??=
                  error instanceof Error ? error : Error(`Failed to stop terminal process`);
              }
            }
          }
          if (firstError instanceof Error) {
            throw Error(`Failed to stop terminal process`, { cause: firstError });
          }
        } finally {
          await this.pty.kill(`SIGKILL`);
        }
        return;
      }
      await this.pty.kill();
    }
  }

  return {
    NodePtyBackend,
    getWindowsConsoleProcessList,
    normalizeExitSignal,
  };
}

if (typeof module !== "undefined") {
  module.exports = { createNodePtyBackendRuntime };
}
