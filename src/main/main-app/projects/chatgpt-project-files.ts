import { createHash, randomUUID } from "node:crypto";
import { createReadStream } from "node:fs";
import { chmod, copyFile, mkdir, open, readFile, readdir, rename, rm, writeFile } from "node:fs/promises";
import path from "node:path";

const PROJECTS_DIRECTORY = ".chatgpt-projects";
const METADATA_DIRECTORY = ".metadata";
const SOURCES_DIRECTORY = "sources";
const METADATA_VERSION = 1;
const INVALID_FILENAME_CHARACTERS = `<>:"/\\|?*`;
const syncsByRoot = new Map<string, Promise<unknown>>();

type ProjectFile = { fileId: string; name: string };
type Metadata = { files: Array<ProjectFile & { sha256: string }>; version: 1 };
type ProjectFileSyncDependencies = {
  RpcHandlerBase: new (...args: any[]) => any;
  usingScopeHelper(): { u<T>(value: T): T; e?: unknown; d(): void };
};

export class ChatGptProjectFileSyncError extends Error {
  constructor(
    readonly stage: "download-link" | "download" | "filesystem",
    readonly fileOrdinal: number | undefined,
    readonly status: number | undefined,
    cause: unknown,
  ) {
    super(`ChatGPT project file sync failed at ${stage}`, { cause });
  }
}

function statusOf(error: unknown) {
  const status = (error as { status?: unknown } | null)?.status;
  return Number.isInteger(status) && (status as number) >= 100 && (status as number) <= 599
    ? (status as number)
    : undefined;
}

function isMetadata(value: unknown): value is Metadata {
  if (value == null || typeof value !== "object" || (value as any).version !== METADATA_VERSION) return false;
  const files = (value as any).files;
  return Array.isArray(files) && files.every((file) =>
    file != null &&
    typeof file === "object" &&
    typeof file.fileId === "string" &&
    typeof file.name === "string" &&
    typeof file.sha256 === "string" &&
    /^[a-f0-9]{64}$/.test(file.sha256));
}

async function readMetadata(metadataPath: string): Promise<Metadata | null> {
  try {
    const value = JSON.parse(await readFile(metadataPath, "utf8"));
    return isMetadata(value) ? value : null;
  } catch {
    return null;
  }
}

async function writeMetadata(metadataPath: string, metadata: Metadata) {
  await mkdir(path.dirname(metadataPath), { recursive: true, mode: 0o700 });
  await writeFile(metadataPath, `${JSON.stringify(metadata)}\n`, { encoding: "utf8", mode: 0o600 });
}

function validateProjectId(projectId: string) {
  if (
    projectId.length === 0 ||
    projectId === "." ||
    projectId === ".." ||
    projectId.toLowerCase() === METADATA_DIRECTORY ||
    !/^[A-Za-z0-9._-]+$/.test(projectId)
  )
    throw Error("Invalid ChatGPT project ID");
}

function sanitizeFilename(name: string) {
  return Array.from(path.basename(name.trim()), (character) =>
    character.charCodeAt(0) < 32 || INVALID_FILENAME_CHARACTERS.includes(character) ? "_" : character,
  ).join("").replace(/[ .]+$/g, "");
}

function isSafeStoredFilename(name: string) {
  return name !== "" && name !== "." && name !== ".." && !name.includes("/") && !name.includes("\\") && path.basename(name) === name;
}

export function projectFilesWithSafeNames(files: ProjectFile[]) {
  const used = new Set<string>();
  return files.map((file) => {
    const sanitized = sanitizeFilename(file.name);
    const parsed = path.parse(sanitized === "" || sanitized === "." || sanitized === ".." ? "file" : sanitized);
    let stem = ["agents.md", "agents.override.md"].includes(sanitized.toLowerCase())
      ? `${parsed.name} (project file)`
      : parsed.name || "file";
    if (/^(?:con|prn|aux|nul|com[1-9]|lpt[1-9])$/i.test(stem.split(".")[0] ?? "")) stem = `_${stem}`;
    const extension = parsed.ext;
    let candidate = `${stem}${extension}`;
    for (let index = 2; used.has(candidate.toLowerCase()); index += 1) candidate = `${stem} (${index})${extension}`;
    used.add(candidate.toLowerCase());
    return { ...file, name: candidate };
  });
}

function projectInstructions(projectName: string, instructions: string, failedCount: number) {
  const trimmed = instructions.trim();
  return `# ChatGPT project context

This directory is a local mirror of the ChatGPT project “${projectName}”.

- Treat every file under \`${SOURCES_DIRECTORY}/\` as read-only reference material.
- Do not edit, rename, move, or delete synced project files.
- These files may be replaced the next time a task is created from this ChatGPT project.
${failedCount === 0 ? "" : `- ${failedCount} project source${failedCount === 1 ? "" : "s"} could not be synced. Do not assume the local mirror is complete.\n`}

## Project instructions

${trimmed || "This project has no custom instructions."}
`;
}

async function hashFile(filePath: string) {
  const hash = createHash("sha256");
  await new Promise<void>((resolve, reject) => {
    const stream = createReadStream(filePath);
    stream.on("data", (chunk) => hash.update(chunk));
    stream.on("end", resolve);
    stream.on("error", reject);
  });
  return hash.digest("hex");
}

async function copyCachedFile(sourcePath: string, destinationPath: string, expectedHash: string) {
  try {
    await copyFile(sourcePath, destinationPath);
    if ((await hashFile(destinationPath)) === expectedHash) {
      await chmod(destinationPath, 0o444);
      return true;
    }
    await rm(destinationPath, { force: true });
    return false;
  } catch {
    await rm(destinationPath, { force: true }).catch(() => undefined);
    return false;
  }
}

async function downloadProjectFile(
  destinationPath: string,
  fileId: string,
  fileOrdinal: number,
  getFileDownloadRequest: (fileId: string) => Promise<unknown>,
  downloadFile: (request: unknown) => Promise<ReadableStream<Uint8Array>>,
) {
  const hash = createHash("sha256");
  let stage: ChatGptProjectFileSyncError["stage"] = "filesystem";
  try {
    const file = await open(destinationPath, "w", 0o444);
    try {
      stage = "download-link";
      const request = await getFileDownloadRequest(fileId);
      stage = "download";
      const reader = (await downloadFile(request)).getReader();
      try {
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          hash.update(value);
          stage = "filesystem";
          await file.writeFile(value);
          stage = "download";
        }
      } finally {
        reader.releaseLock();
      }
      stage = "filesystem";
    } finally {
      await file.close();
    }
  } catch (error) {
    throw new ChatGptProjectFileSyncError(stage, fileOrdinal, statusOf(error), error);
  }
  return hash.digest("hex");
}

async function syncProjectFiles(options: {
  downloadFile(request: unknown): Promise<ReadableStream<Uint8Array>>;
  files: ProjectFile[];
  getFileDownloadRequest(fileId: string): Promise<unknown>;
  instructions: string;
  projectName: string;
  rootPath: string;
}) {
  const parent = path.dirname(options.rootPath);
  const name = path.basename(options.rootPath);
  const stagingPath = path.join(parent, `.${name}-staging-${randomUUID()}`);
  const previousPath = path.join(parent, `.${name}-previous-${randomUUID()}`);
  const sourcesPath = path.join(stagingPath, SOURCES_DIRECTORY);
  const metadataPath = path.join(parent, METADATA_DIRECTORY, `${name}.json`);
  const previousMetadata = await readMetadata(metadataPath);
  await mkdir(sourcesPath, { recursive: true });
  try {
    const failedFiles: Array<{ fileOrdinal: number; stage: string; status: number | undefined }> = [];
    const syncedFiles: Metadata["files"] = [];
    for (const [index, projectFile] of projectFilesWithSafeNames(options.files).entries()) {
      const cached = previousMetadata?.files.find((file) => file.fileId === projectFile.fileId && isSafeStoredFilename(file.name));
      const destinationPath = path.join(sourcesPath, projectFile.name);
      if (cached != null && await copyCachedFile(path.join(options.rootPath, SOURCES_DIRECTORY, cached.name), destinationPath, cached.sha256)) {
        syncedFiles.push({ ...projectFile, sha256: cached.sha256 });
        continue;
      }
      try {
        const sha256 = await downloadProjectFile(destinationPath, projectFile.fileId, index + 1, options.getFileDownloadRequest, options.downloadFile);
        syncedFiles.push({ ...projectFile, sha256 });
      } catch (error) {
        if (!(error instanceof ChatGptProjectFileSyncError) || error.stage === "filesystem") throw error;
        await rm(destinationPath, { force: true });
        failedFiles.push({ fileOrdinal: error.fileOrdinal ?? index + 1, stage: error.stage, status: error.status });
      }
    }
    await writeFile(path.join(stagingPath, "AGENTS.md"), projectInstructions(options.projectName, options.instructions, failedFiles.length), {
      encoding: "utf8",
      mode: 0o444,
    });
    let hadPrevious = false;
    try {
      await rename(options.rootPath, previousPath);
      hadPrevious = true;
    } catch (error) {
      if (!(error instanceof Error && "code" in error && error.code === "ENOENT")) throw error;
    }
    try {
      await rename(stagingPath, options.rootPath);
    } catch (error) {
      if (hadPrevious) await rename(previousPath, options.rootPath).catch(() => undefined);
      throw error;
    }
    if (hadPrevious) {
      await Promise.all((await readdir(previousPath))
        .filter((entry) => entry !== "AGENTS.md" && entry !== SOURCES_DIRECTORY)
        .map((entry) => rename(path.join(previousPath, entry), path.join(options.rootPath, entry))));
      await rm(previousPath, { recursive: true, force: true }).catch(() => undefined);
    }
    await writeMetadata(metadataPath, { files: syncedFiles, version: METADATA_VERSION }).catch(() => undefined);
    return { failedFiles, rootPath: options.rootPath };
  } catch (error) {
    await rm(stagingPath, { recursive: true, force: true }).catch(() => undefined);
    throw error instanceof ChatGptProjectFileSyncError
      ? error
      : new ChatGptProjectFileSyncError("filesystem", undefined, statusOf(error), error);
  }
}

export function createChatGptProjectFilesServiceClass(dependencies: ProjectFileSyncDependencies) {
  return class ChatGptProjectFilesService extends dependencies.RpcHandlerBase {
    constructor(private readonly codexHome: string, private readonly downloadFile: (request: unknown) => Promise<ReadableStream<Uint8Array>>) {
      super();
    }

    async sync(input: any) {
      const scope = dependencies.usingScopeHelper();
      try {
        const getFileDownloadRequest = scope.u(input.getFileDownloadRequest);
        const { files, instructions, projectId, projectName } = input;
        validateProjectId(projectId);
        const rootPath = path.join(this.codexHome, PROJECTS_DIRECTORY, projectId);
        const previous = syncsByRoot.get(rootPath);
        const current = (async () => {
          await previous?.catch(() => undefined);
          return syncProjectFiles({
            downloadFile: this.downloadFile,
            files,
            getFileDownloadRequest,
            instructions,
            projectName,
            rootPath,
          });
        })();
        syncsByRoot.set(rootPath, current);
        try {
          return await current;
        } finally {
          if (syncsByRoot.get(rootPath) === current) syncsByRoot.delete(rootPath);
        }
      } catch (error) {
        scope.e = error;
      } finally {
        scope.d();
      }
    }
  };
}
