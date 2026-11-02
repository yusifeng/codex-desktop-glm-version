type SpawnedProcess = {
  wait(): Promise<{ code: number | null; [key: string]: unknown }>;
  stdout: ReadableStream<Uint8Array>;
  stderr: ReadableStream<Uint8Array>;
};

type AppServerProcessClient = {
  platformFamily(): Promise<string>;
  spawn(options: {
    args: string[];
    cwd: string;
    env: Record<string, string>;
    timeoutMs: number;
    allowedNonZeroExitCodes: number[];
    killProcessTree: boolean;
  }): Promise<SpawnedProcess>;
};

async function readText(stream: ReadableStream<Uint8Array>): Promise<string> {
  return new TextDecoder("utf-8", { ignoreBOM: true }).decode(await new Response(stream).arrayBuffer()).trim();
}

/** Stops the per-repository fsmonitor daemon before a Windows update replaces the app. */
export async function stopGitFsmonitor(root: string, client: AppServerProcessClient) {
  const hooksPath = await client.platformFamily() === "windows" ? "NUL" : "/dev/null";
  const commandArgs = [
    "git",
    "-c", "safe.bareRepository=explicit",
    "-c", `core.hooksPath=${hooksPath}`,
    "-c", "core.fsmonitor=",
    "fsmonitor--daemon", "stop",
  ];
  try {
    const process = await client.spawn({
      args: commandArgs,
      cwd: root,
      env: { LC_MESSAGES: "C", LANGUAGE: "C", GIT_TERMINAL_PROMPT: "0", GIT_OPTIONAL_LOCKS: "0" },
      timeoutMs: 2_000,
      allowedNonZeroExitCodes: [128],
      killProcessTree: true,
    });
    const [result, stdout, stderr] = await Promise.all([process.wait(), readText(process.stdout), readText(process.stderr)]);
    return {
      command: commandArgs.join(" "),
      success: result.code === 0 || result.code === 128,
      code: result.code,
      stdout,
      stdoutBytes: new TextEncoder().encode(stdout).byteLength,
      stderr,
      stderrBytes: new TextEncoder().encode(stderr).byteLength,
    };
  } catch (error) {
    const stderr = error instanceof Error ? error.message : String(error);
    return {
      command: commandArgs.join(" "), success: false, code: null, stdout: "", stdoutBytes: 0,
      stderr, stderrBytes: new TextEncoder().encode(stderr).byteLength,
    };
  }
}
