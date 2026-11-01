// Codex rollout JSONL diagnostics used by the codex-home IPC request.
// Original shared-chunk owner: Gie/Uie/Wie/$8/e5/Kie/qie/Jie/Yie/Xie/Zie.

import { createReadStream, existsSync } from "node:fs";
import { promises as fs } from "node:fs";
import { join } from "node:path";
import { createInterface } from "node:readline";

const DEFAULT_MAX_ROLLOUTS = 128;
const STANDARD_MS_PER_TOKEN = 18;
const FAST_MS_PER_TOKEN = 12;
const SAVED_MS_PER_TOKEN = 6;

export interface RolloutDiagnosticsParams {
  startTimeMs: number;
  endTimeMs?: number;
  maxRollouts?: number;
}

export interface RolloutDiagnosticsRequest {
  codexHome: string;
  params: RolloutDiagnosticsParams;
}

export interface RolloutDiagnostics {
  startTimeMs: number;
  endTimeMs: number;
  maxRollouts: number;
  scannedRolloutCount: number;
  parsedRolloutCount: number;
  rolloutCountWithCompletedTurns: number;
  rolloutCountWithEstimatedTurns: number;
  completedTurnCount: number;
  estimatedTurnCount: number;
  totalOutputTokens: number;
  totalReasoningOutputTokens: number;
  totalGeneratedTokens: number;
  observedCompletedTurnWallTimeMs: number;
  estimatedStandardMs: number;
  estimatedFastMs: number;
  estimatedSavedMs: number;
}

interface RolloutFileSummary {
  completedTurnCount: number;
  estimatedTurnCount: number;
  outputTokens: number;
  reasoningOutputTokens: number;
  observedCompletedTurnWallTimeMs: number;
}

interface RolloutCandidate {
  path: string;
  modifiedAtMs: number;
}

function normalizeParams(params: RolloutDiagnosticsParams) {
  return {
    startTimeMs: params.startTimeMs,
    endTimeMs: params.endTimeMs ?? Date.now(),
    maxRollouts:
      params.maxRollouts == null
        ? DEFAULT_MAX_ROLLOUTS
        : Math.max(1, Math.floor(params.maxRollouts)),
  };
}

function initialSummary(params: ReturnType<typeof normalizeParams>): RolloutDiagnostics {
  return {
    ...params,
    scannedRolloutCount: 0,
    parsedRolloutCount: 0,
    rolloutCountWithCompletedTurns: 0,
    rolloutCountWithEstimatedTurns: 0,
    completedTurnCount: 0,
    estimatedTurnCount: 0,
    totalOutputTokens: 0,
    totalReasoningOutputTokens: 0,
    totalGeneratedTokens: 0,
    observedCompletedTurnWallTimeMs: 0,
    estimatedStandardMs: 0,
    estimatedFastMs: 0,
    estimatedSavedMs: 0,
  };
}

function finalizeSummary(summary: RolloutDiagnostics): RolloutDiagnostics {
  const totalGeneratedTokens =
    summary.totalOutputTokens + summary.totalReasoningOutputTokens;
  return {
    ...summary,
    totalGeneratedTokens,
    estimatedStandardMs: totalGeneratedTokens * STANDARD_MS_PER_TOKEN,
    estimatedFastMs: totalGeneratedTokens * FAST_MS_PER_TOKEN,
    estimatedSavedMs: totalGeneratedTokens * SAVED_MS_PER_TOKEN,
  };
}

function parseTimestamp(value: unknown): number | null {
  if (value == null) return null;
  const timestamp = Date.parse(String(value));
  return Number.isFinite(timestamp) ? timestamp : null;
}

async function readDirectory(path: string) {
  try {
    return await fs.readdir(path, { withFileTypes: true });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw error;
  }
}

function newestFirst<T extends { name: string }>(entries: T[]): T[] {
  return entries.sort((left, right) => right.name.localeCompare(left.name));
}

async function candidatesForDay(
  dayPath: string,
  startTimeMs: number,
): Promise<RolloutCandidate[]> {
  const entries = newestFirst(
    (await readDirectory(dayPath)).filter(
      (entry) => entry.isFile() && entry.name.endsWith(".jsonl"),
    ),
  );
  return (
    await Promise.all(
      entries.map(async (entry) => {
        const path = join(dayPath, entry.name);
        try {
          const stat = await fs.stat(path);
          return !stat.isFile() || stat.mtimeMs < startTimeMs
            ? null
            : { path, modifiedAtMs: stat.mtimeMs };
        } catch {
          return null;
        }
      }),
    )
  ).filter((candidate): candidate is RolloutCandidate => candidate != null);
}

async function candidatesForMonth(monthPath: string, startTimeMs: number) {
  const days = newestFirst(
    (await readDirectory(monthPath)).filter((entry) => entry.isDirectory()),
  );
  return (
    await Promise.all(
      days.map((day) => candidatesForDay(join(monthPath, day.name), startTimeMs)),
    )
  ).flat();
}

async function candidatesForYear(yearPath: string, startTimeMs: number) {
  const months = newestFirst(
    (await readDirectory(yearPath)).filter((entry) => entry.isDirectory()),
  );
  return (
    await Promise.all(
      months.map((month) =>
        candidatesForMonth(join(yearPath, month.name), startTimeMs),
      ),
    )
  ).flat();
}

async function findRolloutCandidates(
  sessionsPath: string,
  startTimeMs: number,
  maxRollouts: number,
) {
  const years = newestFirst(
    (await readDirectory(sessionsPath)).filter((entry) => entry.isDirectory()),
  );
  return (
    await Promise.all(
      years.map((year) =>
        candidatesForYear(join(sessionsPath, year.name), startTimeMs),
      ),
    )
  )
    .flat()
    .sort((left, right) => right.modifiedAtMs - left.modifiedAtMs)
    .slice(0, maxRollouts);
}

async function parseRolloutFile({
  path,
  startTimeMs,
  endTimeMs,
}: {
  path: string;
  startTimeMs: number;
  endTimeMs: number;
}): Promise<RolloutFileSummary> {
  const summary: RolloutFileSummary = {
    completedTurnCount: 0,
    estimatedTurnCount: 0,
    outputTokens: 0,
    reasoningOutputTokens: 0,
    observedCompletedTurnWallTimeMs: 0,
  };
  let activeTurn: {
    startedAtMs: number | null;
    outputTokens: number;
    reasoningOutputTokens: number;
  } | null = null;
  const lines = createInterface({
    input: createReadStream(path, { encoding: "utf8" }),
    crlfDelay: Number.POSITIVE_INFINITY,
  });
  try {
    for await (const line of lines) {
      if (line.length === 0) continue;
      let record: any;
      try {
        record = JSON.parse(line);
      } catch {
        continue;
      }
      if (record.type !== "event_msg" || record.payload == null) continue;
      const eventType = record.payload.type;
      if (eventType === "task_started") {
        activeTurn = {
          startedAtMs: parseTimestamp(record.timestamp),
          outputTokens: 0,
          reasoningOutputTokens: 0,
        };
        continue;
      }
      if (eventType === "token_count") {
        if (activeTurn == null) continue;
        const usage = record.payload.info?.last_token_usage;
        const outputTokens = usage?.output_tokens ?? 0;
        const reasoningOutputTokens = usage?.reasoning_output_tokens ?? 0;
        if (outputTokens <= 0 && reasoningOutputTokens <= 0) continue;
        activeTurn.outputTokens += outputTokens;
        activeTurn.reasoningOutputTokens += reasoningOutputTokens;
        continue;
      }
      if (eventType !== "task_complete" || activeTurn == null) continue;
      const completedAtMs = parseTimestamp(record.timestamp);
      if (
        completedAtMs != null &&
        completedAtMs >= startTimeMs &&
        completedAtMs <= endTimeMs
      ) {
        const generatedTokens =
          activeTurn.outputTokens + activeTurn.reasoningOutputTokens;
        summary.completedTurnCount += 1;
        summary.observedCompletedTurnWallTimeMs +=
          activeTurn.startedAtMs == null
            ? 0
            : Math.max(0, completedAtMs - activeTurn.startedAtMs);
        if (generatedTokens > 0) {
          summary.estimatedTurnCount += 1;
          summary.outputTokens += activeTurn.outputTokens;
          summary.reasoningOutputTokens += activeTurn.reasoningOutputTokens;
        }
      }
      activeTurn = null;
    }
  } finally {
    lines.close();
  }
  return summary;
}

/** Scan recent rollout JSONL files and aggregate observed/token-derived timing. */
export async function collectRolloutDiagnostics({
  codexHome,
  params: rawParams,
}: RolloutDiagnosticsRequest): Promise<RolloutDiagnostics> {
  const params = normalizeParams(rawParams);
  const summary = initialSummary(params);
  const sessionsPath = join(codexHome, "sessions");
  if (!existsSync(sessionsPath)) return summary;
  const candidates = await findRolloutCandidates(
    sessionsPath,
    params.startTimeMs,
    params.maxRollouts,
  );
  summary.scannedRolloutCount = candidates.length;
  for (const candidate of candidates) {
    let parsed: RolloutFileSummary;
    try {
      parsed = await parseRolloutFile({
        path: candidate.path,
        startTimeMs: params.startTimeMs,
        endTimeMs: params.endTimeMs,
      });
    } catch {
      continue;
    }
    summary.parsedRolloutCount += 1;
    if (parsed.completedTurnCount > 0)
      summary.rolloutCountWithCompletedTurns += 1;
    if (parsed.estimatedTurnCount > 0)
      summary.rolloutCountWithEstimatedTurns += 1;
    summary.completedTurnCount += parsed.completedTurnCount;
    summary.estimatedTurnCount += parsed.estimatedTurnCount;
    summary.totalOutputTokens += parsed.outputTokens;
    summary.totalReasoningOutputTokens += parsed.reasoningOutputTokens;
    summary.observedCompletedTurnWallTimeMs +=
      parsed.observedCompletedTurnWallTimeMs;
  }
  return finalizeSummary(summary);
}

export {
  DEFAULT_MAX_ROLLOUTS,
  STANDARD_MS_PER_TOKEN,
  FAST_MS_PER_TOKEN,
  SAVED_MS_PER_TOKEN,
};
