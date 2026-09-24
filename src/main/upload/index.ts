// 桌面内容追踪（content tracing，Chrome tracing 格式）录制结果的上报。
//
// 把 .pftrace/.trace 文件 gzip 压缩、写一份 metadata JSON，连同桌面日志归档
// 一起交给 uploadFeedback 上报通道，最后清理所有临时文件。
import { promisify } from "node:util";
import { basename } from "node:path";
import { readFile, rm, writeFile } from "node:fs/promises";
import { gzip } from "node:zlib";
import { memoizedTaggedLogger } from "@chunk/logger";
import { t as createDesktopLogArchive, n as deleteDesktopLogArchive } from "@chunk/main";
// 原版模块在加载时顺带 require 了共享库（副作用导入），保持一致。
import "@chunk/shared";

const gzipAsync = promisify(gzip);
const logger = memoizedTaggedLogger("content-tracing");

const DEFAULT_UPLOAD_REASON = "Desktop content trace recording";

export interface TraceRecordingCorrelation {
  conversationId?: string;
  hostId?: string;
  windowId?: number | string;
}

export interface TraceRecordingRuntimeHealth {
  gpuVendor?: string;
  gpuRenderer?: string;
  hardwareAccelerationEnabled?: boolean;
}

export interface TraceRecordingUploadInput {
  tracePath: string;
  additionalTraceFiles?: string[];
  buildFlavor?: string;
  buildNumber?: string;
  appVersion: string;
  traceRecordingNote?: string;
  recordingDurationMs?: number;
  correlation?: TraceRecordingCorrelation | null;
  runtimeHealth?: TraceRecordingRuntimeHealth | null;
  uploadFeedback: (payload: {
    classification: string;
    reason: string;
    threadId: string | null;
    includeLogs: boolean;
    extraLogFiles: string[];
    tags: Record<string, string | undefined>;
  }) => Promise<{ threadId: string | null }>;
}

async function removeTempFile(path: string) {
  try {
    await rm(path, { force: true });
  } catch (error) {
    logger().warning("Failed to remove temporary trace upload file.", {
      safe: {},
      sensitive: { error, path },
    });
  }
}

export async function uploadTraceRecording({
  tracePath,
  additionalTraceFiles,
  buildFlavor,
  buildNumber,
  appVersion,
  traceRecordingNote,
  recordingDurationMs,
  correlation,
  runtimeHealth,
  uploadFeedback,
}: TraceRecordingUploadInput): Promise<string | null> {
  const gzipPath = `${tracePath}.gz`;
  const pftraceFile = additionalTraceFiles?.find((file) => file.endsWith(".pftrace"));
  const primaryTraceFile = pftraceFile ?? gzipPath;
  const metadataPath = `${tracePath}.metadata.json`;
  const note = traceRecordingNote?.trim() || null;
  let archiveId: string | null = null;
  try {
    const traceData = await readFile(tracePath);
    const gzipped = pftraceFile == null ? await gzipAsync(traceData) : null;
    await Promise.all([
      ...(gzipped == null ? [] : [writeFile(gzipPath, gzipped)]),
      writeFile(
        metadataPath,
        JSON.stringify(
          {
            classification: "trace-recording",
            description: note,
            recordingDurationMs: recordingDurationMs ?? null,
            correlation: correlation ?? null,
            runtimeHealth: runtimeHealth ?? null,
            trace: {
              filename: basename(pftraceFile ?? tracePath),
              sizeBytes: traceData.byteLength,
              gzipSizeBytes: gzipped?.byteLength ?? null,
            },
          },
          null,
          2,
        ),
      ),
    ]);
    const logArchive = await createDesktopLogArchive();
    archiveId = logArchive?.archiveId ?? null;
    const { threadId } = await uploadFeedback({
      classification: "trace-recording",
      reason: note ?? DEFAULT_UPLOAD_REASON,
      threadId: correlation?.conversationId ?? null,
      includeLogs: true,
      extraLogFiles: [
        primaryTraceFile,
        metadataPath,
        ...(additionalTraceFiles?.filter((file) => file !== pftraceFile) ?? []),
        ...(logArchive?.filePaths ?? []),
      ],
      tags: {
        app_version: appVersion,
        app_build: buildNumber ?? void 0,
        buildFlavor,
        trace_recording: "content-trace",
        trace_filename: basename(primaryTraceFile),
        platform: process.platform,
        recording_duration_ms:
          recordingDurationMs == null ? void 0 : String(recordingDurationMs),
        host_id: correlation?.hostId ?? void 0,
        window_id:
          correlation?.windowId == null ? void 0 : String(correlation.windowId),
        gpu_vendor: runtimeHealth?.gpuVendor ?? void 0,
        gpu_renderer: runtimeHealth?.gpuRenderer ?? void 0,
        hardware_acceleration:
          runtimeHealth == null
            ? void 0
            : runtimeHealth.hardwareAccelerationEnabled
              ? "enabled"
              : "disabled",
      },
    });
    return threadId;
  } finally {
    await Promise.all([
      removeTempFile(gzipPath),
      removeTempFile(metadataPath),
      ...(archiveId == null ? [] : [deleteDesktopLogArchive(archiveId)]),
    ]);
  }
}
