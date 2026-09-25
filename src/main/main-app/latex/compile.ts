// LaTeX 产物编译：compile_latex.py → tectonic 两级回退。
//
// 对应 main-C-Mhak1n.ts 92,481-92,665：
//   - QRe compileLatexArtifact：60s 超时 + mkdtemp 工作目录；先试插件的
//     python 脚本（候选解释器逐个回退），失败再走 tectonic；产物读 base64
//   - $Re/EV/eze：python 路径（win32 与其余的候选顺序不同）逐个尝试 +
//     --output-directory --json 输出协议（pdfExists/pdfPath）
//   - tze：tectonic -X compile --untrusted（TECTONIC_UNTRUSTED_MODE=1）
//   - ize/aze：marketplace 里定位已安装的本地 latex 插件
import { join, dirname, basename, posix, win32 } from "node:path";
import { tmpdir } from "node:os";
import { access, mkdtemp, mkdir, readFile, rm } from "node:fs/promises";
import {
  Kn as spawnProcess,
  Bo as localPluginPath,
  Ul as marketplaceNameForFlavor,
} from "@chunk/shared";
import { in as BuildFlavor } from "@chunk/bootstrap";
import { selectBundledMarketplaces } from "../plugins/marketplace";

const COMPILE_TIMEOUT_MS = 60_000;
const COMPILE_SCRIPT_PATH = ["scripts", "compile_latex.py"];
const PYTHON_CANDIDATES = process.platform === "win32" ? ["python", "python3"] : ["python3", "python"];

interface AppServerConnectionLike {
  codexHome(): Promise<string>;
  listPlugins(options: unknown): Promise<{ marketplaces: Array<{ name: string; plugins: Array<{ name: string; installed: boolean; enabled: boolean; source: { type: string }; localVersion?: string }> }> }>;
}

/** 编译入口（原 `QRe`）：两级回退 + 超时 + 临时目录清理。 */
async function compileLatexArtifact(
  sourcePath: string,
  latexPluginPath: string | null,
): Promise<{ contentsBase64: string | null }> {
  if (latexPluginPath == null) return { contentsBase64: null };
  const abort = new AbortController();
  const timeout = setTimeout(() => {
    abort.abort();
  }, COMPILE_TIMEOUT_MS);
  let workDirectory: string | null = null;
  try {
    workDirectory = await mkdtemp(join(tmpdir(), "codex-latex-artifact-"));
    await mkdir(workDirectory, { recursive: true });
    const scriptResult = await tryPythonScript({
      abortSignal: abort.signal,
      latexPluginPath,
      outputDirectory: workDirectory,
      sourcePath,
    });
    if (scriptResult.contentsBase64 != null) return scriptResult;
    const tectonicPath = tectonicExecutablePath(latexPluginPath);
    return await compileWithTectonic({
      abortSignal: abort.signal,
      outputDirectory: workDirectory,
      sourcePath,
      tectonicExecutablePath: tectonicPath,
    });
  } catch {
    return { contentsBase64: null };
  } finally {
    clearTimeout(timeout);
    if (workDirectory != null) await rm(workDirectory, { recursive: true, force: true }).catch(() => void 0);
  }
}

/** python 脚本存在性检查（原 `$Re`）。 */
async function tryPythonScript({
  abortSignal,
  latexPluginPath,
  outputDirectory,
  sourcePath,
}: {
  abortSignal: AbortSignal;
  latexPluginPath: string;
  outputDirectory: string;
  sourcePath: string;
}): Promise<{ contentsBase64: string | null }> {
  const scriptPath = join(latexPluginPath, ...COMPILE_SCRIPT_PATH);
  try {
    await access(scriptPath);
  } catch {
    return { contentsBase64: null };
  }
  return tryPythonCandidates({
    abortSignal,
    latexPluginPath,
    outputDirectory,
    pythonExecutables: PYTHON_CANDIDATES,
    scriptPath,
    sourcePath,
  });
}

/** python 候选逐个回退（原 `EV`）。 */
async function tryPythonCandidates({
  abortSignal,
  latexPluginPath,
  outputDirectory,
  pythonExecutables,
  scriptPath,
  sourcePath,
}: {
  abortSignal: AbortSignal;
  latexPluginPath: string;
  outputDirectory: string;
  pythonExecutables: string[];
  scriptPath: string;
  sourcePath: string;
}): Promise<{ contentsBase64: string | null }> {
  const [candidate, ...rest] = pythonExecutables;
  if (candidate == null) return { contentsBase64: null };
  const result = await runPythonScript({
    abortSignal,
    latexPluginPath,
    outputDirectory,
    pythonExecutable: candidate,
    scriptPath,
    sourcePath,
  });
  return result.contentsBase64 == null
    ? tryPythonCandidates({
        abortSignal,
        latexPluginPath,
        outputDirectory,
        pythonExecutables: rest,
        scriptPath,
        sourcePath,
      })
    : result;
}

/** 单个 python 解释器执行（原 `eze`）：--json 输出协议。 */
async function runPythonScript({
  abortSignal,
  latexPluginPath,
  outputDirectory,
  pythonExecutable,
  scriptPath,
  sourcePath,
}: {
  abortSignal: AbortSignal;
  latexPluginPath: string;
  outputDirectory: string;
  pythonExecutable: string;
  scriptPath: string;
  sourcePath: string;
}): Promise<{ contentsBase64: string | null }> {
  try {
    const completed = await spawnProcess({
      args: [pythonExecutable, scriptPath, sourcePath, "--output-directory", outputDirectory, "--json"],
      cwd: latexPluginPath,
      spawnInsideWsl: false,
      signal: abortSignal,
    }).wait();
    if (completed.code !== 0) return { contentsBase64: null };
    const report = parseJsonOutput(completed.stdout) as { pdfExists?: boolean; pdfPath?: string } | null;
    return report?.pdfExists !== true || typeof report.pdfPath != "string"
      ? { contentsBase64: null }
      : { contentsBase64: (await readFile(report.pdfPath)).toString("base64") };
  } catch {
    return { contentsBase64: null };
  }
}

/** tectonic 回退（原 `tze`）：--untrusted + TECTONIC_UNTRUSTED_MODE=1。 */
async function compileWithTectonic({
  abortSignal,
  outputDirectory,
  sourcePath,
  tectonicExecutablePath,
}: {
  abortSignal: AbortSignal;
  outputDirectory: string;
  sourcePath: string;
  tectonicExecutablePath: string;
}): Promise<{ contentsBase64: string | null }> {
  const sourceDirectory = dirname(sourcePath);
  const sourceName = basename(sourcePath);
  try {
    await access(tectonicExecutablePath);
    const completed = await spawnProcess({
      args: [
        tectonicExecutablePath,
        "-X",
        "compile",
        "--outdir",
        outputDirectory,
        "--outfmt",
        "pdf",
        "--print",
        "--untrusted",
        sourceName,
      ],
      cwd: sourceDirectory,
      env: { TECTONIC_UNTRUSTED_MODE: "1" },
      collectOutput: false,
      spawnInsideWsl: false,
      signal: abortSignal,
    }).wait();
    if (completed.code !== 0) return { contentsBase64: null };
    const pdfPath = join(outputDirectory, sourceName.replace(/\.[^.]+$/u, ".pdf"));
    return { contentsBase64: (await readFile(pdfPath)).toString("base64") };
  } catch {
    return { contentsBase64: null };
  }
}

function parseJsonOutput(stdout: string): unknown {
  try {
    return JSON.parse(stdout.trim());
  } catch {
    return null;
  }
}

/** tectonic 可执行文件路径（原 `rze`）。 */
function tectonicExecutablePath(latexPluginPath: string, platform = process.platform): string {
  return (platform === "win32" ? win32 : posix).join(
    latexPluginPath,
    "bin",
    platform === "win32" ? "tectonic.exe" : "tectonic",
  );
}

/** 定位已安装的本地 latex 插件（原 `ize`/`aze`）。 */
async function findLatexPluginPath(appServerConnection: AppServerConnectionLike): Promise<string | null> {
  try {
    const [codexHome, { marketplaces }] = await Promise.all([
      appServerConnection.codexHome(),
      appServerConnection.listPlugins({ marketplaceKinds: ["local"] }),
    ]);
    const pluginPath = findLatexInMarketplaces({
      codexHome,
      marketplaces,
    });
    return pluginPath == null ? null : (await access(pluginPath), pluginPath);
  } catch {
    return null;
  }
}

function findLatexInMarketplaces({
  codexHome,
  marketplaces,
  marketplaceName = (marketplaceNameForFlavor as (flavor: string) => string)(
    (BuildFlavor as { resolve(): string }).resolve(),
  ),
}: {
  codexHome: string;
  marketplaces: Array<{ name: string; plugins: Array<{ name: string; installed: boolean; enabled: boolean; source: { type: string }; localVersion?: string }> }>;
  marketplaceName?: string;
}): string | null {
  for (const marketplace of (selectBundledMarketplaces as (opts: unknown) => Array<{ name: string; plugins: unknown[] }>)({ marketplaceName, marketplaces })) {
    const plugin = marketplace.plugins.find(
      (plugin: { name: string; installed: boolean; enabled: boolean; source: { type: string } }) =>
        plugin.name === "latex" && plugin.installed && plugin.enabled && plugin.source.type === "local",
    ) as { name: string; localVersion?: string; source: { type: string } } | undefined;
    if (plugin?.source.type === "local")
      return (localPluginPath as (opts: Record<string, unknown>) => string)({
        codexHome,
        localVersion: plugin.localVersion,
        marketplaceName: marketplace.name,
        pluginName: plugin.name,
      });
  }
  return null;
}

export {
  compileLatexArtifact,
  findLatexPluginPath,
  tectonicExecutablePath,
  COMPILE_TIMEOUT_MS,
};
