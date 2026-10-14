import { createHash } from "node:crypto";
import { promises as fs } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

type ArtifactRequest = Record<string, unknown>;

type Failure = { status: "failed"; reason: string };

type NativeSnapshot = {
  status: "ready";
  path: string;
  fileName: string;
  byteLength: number;
  contentType: string;
};

type OpenTarget = {
  available?: boolean;
  target: string;
  id: string;
  kind?: string;
  bundleId?: string | null;
  appPath?: string | null;
  default?: boolean;
  icon?: unknown;
  label?: string;
};

type ExposedTarget = {
  appPath?: string;
  exposed: {
    default?: boolean;
    icon?: unknown;
    id: string;
    label?: string;
  };
};

export type NativeArtifactFileServiceDependencies = {
  downloadCopy(path: string): Promise<unknown>;
  getTargets(request: { cwd: null; hostId: string; path: string }): Promise<{ targets: OpenTarget[] }>;
  hostId: string;
  maxBytes: number;
  open(request: {
    appPath?: string;
    cwd: null;
    hostId: string;
    path: string;
    target: "fileManager" | "systemDefault";
  }): Promise<{ success: boolean }>;
  publishNativeSnapshot(request: ArtifactRequest): Promise<NativeSnapshot | Failure>;
  resolveArtifactKind(
    request: ArtifactRequest,
  ): Promise<{ status: "ready"; kind: "presentation" | "spreadsheet" } | Failure>;
};

/** Owns native target discovery and temporary-file materialization for remote artifacts. */
export class NativeArtifactFileService {
  private readonly dependencies: NativeArtifactFileServiceDependencies;

  constructor(dependencies: NativeArtifactFileServiceDependencies) {
    this.dependencies = dependencies;
  }

  async getTargets(request: ArtifactRequest): Promise<Record<string, unknown>> {
    const result = await this.discoverTargets(request);
    return result.status === "failed"
      ? result
      : {
          fileManagerIcon: result.fileManagerIcon,
          status: "ready",
          targets: result.targets.map(({ exposed }) => exposed),
        };
  }

  async performFileAction(request: ArtifactRequest): Promise<Record<string, unknown>> {
    const action = request.action as
      | { type: "open"; targetId: string }
      | { type: "show-in-folder" | "download-copy" }
      | undefined;
    let selectedTarget: ExposedTarget | undefined;
    if (action?.type === "open") {
      if (!isExposedTargetId(action.targetId)) {
        return { status: "failed", reason: "target-unavailable" };
      }
      const discovery = await this.discoverTargets(request);
      if (discovery.status === "failed") {
        return discovery.reason === "session-unavailable"
          ? { status: "failed", reason: "session-unavailable" }
          : { status: "failed", reason: "target-unavailable" };
      }
      selectedTarget = discovery.targets.find(({ exposed }) => exposed.id === action.targetId);
      if (selectedTarget == null) return { status: "failed", reason: "target-unavailable" };
    } else if (action?.type !== "show-in-folder" && action?.type !== "download-copy") {
      return { status: "failed", reason: "action-failed" };
    }

    const snapshot = await this.dependencies.publishNativeSnapshot(request);
    if (snapshot.status === "failed") return snapshot;
    if (action.type === "download-copy") {
      try {
        await this.dependencies.downloadCopy(snapshot.path);
        return { status: "completed" };
      } catch {
        return { status: "failed", reason: "action-failed" };
      }
    }

    let temporaryDirectory: string | undefined;
    try {
      temporaryDirectory = await fs.mkdtemp(join(tmpdir(), "codex-artifact-native-open-"));
      const temporaryPath = join(temporaryDirectory, snapshot.fileName);
      await fs.copyFile(snapshot.path, temporaryPath);
      await fs.chmod(temporaryPath, 0o600);
      const { success } = await this.dependencies.open({
        appPath: selectedTarget?.appPath,
        cwd: null,
        hostId: this.dependencies.hostId,
        path: temporaryPath,
        target: action.type === "show-in-folder" ? "fileManager" : "systemDefault",
      });
      if (success) return { status: "completed" };
    } catch {}
    if (temporaryDirectory != null) {
      await fs.rm(temporaryDirectory, { force: true, recursive: true }).catch(() => undefined);
    }
    return { status: "failed", reason: "action-failed" };
  }

  async readSnapshot(request: ArtifactRequest): Promise<Record<string, unknown>> {
    const snapshot = await this.dependencies.publishNativeSnapshot(request);
    if (snapshot.status === "failed") return snapshot;
    try {
      const metadata = await fs.stat(snapshot.path);
      if (
        !metadata.isFile() ||
        metadata.size !== snapshot.byteLength ||
        metadata.size > this.dependencies.maxBytes
      ) {
        return { status: "failed", reason: "materialization-failed" };
      }
      const bytes = await fs.readFile(snapshot.path);
      return bytes.byteLength === snapshot.byteLength
        ? {
            bytes: new Uint8Array(bytes),
            contentType: snapshot.contentType,
            fileName: snapshot.fileName,
            status: "ready",
          }
        : { status: "failed", reason: "materialization-failed" };
    } catch {
      return { status: "failed", reason: "materialization-failed" };
    }
  }

  private async discoverTargets(
    request: ArtifactRequest,
  ): Promise<
    | Failure
    | { status: "ready"; fileManagerIcon: unknown; targets: ExposedTarget[] }
  > {
    const resolved = await this.dependencies.resolveArtifactKind(request);
    if (resolved.status === "failed") return resolved;
    let temporaryDirectory: string | undefined;
    try {
      temporaryDirectory = await fs.mkdtemp(join(tmpdir(), "codex-artifact-open-in-"));
      const temporaryPath = join(
        temporaryDirectory,
        resolved.kind === "presentation" ? "presentation.pptx" : "workbook.xlsx",
      );
      await fs.writeFile(temporaryPath, "");
      const { targets } = await this.dependencies.getTargets({
        cwd: null,
        hostId: this.dependencies.hostId,
        path: temporaryPath,
      });
      return {
        fileManagerIcon:
          targets.find((target) => target.available !== false && target.target === "fileManager")
            ?.icon ?? null,
        status: "ready",
        targets: projectOpenTargets(targets),
      };
    } catch {
      return { status: "failed", reason: "target-discovery-failed" };
    } finally {
      if (temporaryDirectory != null) {
        await fs.rm(temporaryDirectory, { force: true, recursive: true }).catch(() => undefined);
      }
    }
  }
}

const NATIVE_APP_TARGET_ID = /^native-app:[a-f0-9]{64}$/;

function projectOpenTargets(targets: OpenTarget[]): ExposedTarget[] {
  const projected = new Map<string, ExposedTarget>();
  for (const target of targets) {
    if (target.available === false || target.target !== "systemDefault") continue;
    let id: string | undefined;
    let appPath: string | undefined;
    if (target.id === "systemDefault") {
      id = "system-default";
    } else if (
      target.kind === "native" &&
      target.bundleId != null &&
      target.bundleId.length > 0 &&
      target.appPath != null &&
      target.appPath.length > 0
    ) {
      id = `native-app:${createHash("sha256")
        .update(target.bundleId)
        .update("\0")
        .update(target.id)
        .digest("hex")}`;
      appPath = target.appPath;
    } else {
      continue;
    }
    if (!projected.has(id)) {
      projected.set(id, {
        appPath,
        exposed: {
          default: target.default,
          icon: target.icon,
          id,
          label: target.label,
        },
      });
    }
  }
  return [...projected.values()];
}

function isExposedTargetId(value: unknown): value is string {
  return value === "system-default" || (typeof value === "string" && NATIVE_APP_TARGET_ID.test(value));
}

if (typeof module !== "undefined") {
  module.exports = { NativeArtifactFileService };
}
