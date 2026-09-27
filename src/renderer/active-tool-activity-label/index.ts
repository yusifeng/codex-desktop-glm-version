import "@rchunk/rolldown-runtime";
import "@rchunk/app-shared";
import "@rchunk/app-initial";
import "@rchunk/skill-exploration-labels";

interface ToolActivity { callId?: string; executionStatus?: string; parsedCmd?: { cmd?: string; isFinished?: boolean }; summary?: { name?: string; path?: string; query?: string; type?: string }; type?: string; [key: string]: unknown }
interface ActivityLabel { activityKey?: string; icon: string; message: string; values?: Record<string, string> }

function getActiveToolActivityLabel(activity: ToolActivity): ActivityLabel {
  const summary = activity.summary ?? {};
  const type = activity.type ?? summary.type ?? summary.name ?? "unknown";
  if (type === "search") return { activityKey: activity.callId, icon: "code-searching", message: summary.query ? "Searching for {query}" : "Searching files", values: summary.query ? { query: summary.query } : undefined };
  if (type === "list_files") return { activityKey: activity.callId, icon: "list-files", message: summary.path ? "Listing files in {folder}" : "Listing files", values: summary.path ? { folder: summary.path } : undefined };
  if (type === "read") return { activityKey: activity.callId, icon: "run-command", message: "Reading {target}", values: { target: summary.path ?? summary.name ?? "file" } };
  const command = activity.parsedCmd?.cmd?.trim();
  const stopped = activity.executionStatus === "interrupted";
  const finished = activity.parsedCmd?.isFinished === true;
  return { activityKey: activity.callId, icon: stopped ? "stop" : "run-command", message: stopped ? "Stopped command" : finished ? "Ran command" : "Running command", values: command ? { command } : undefined };
}

function initializeActiveToolActivityLabel(): void {}
export { initializeActiveToolActivityLabel as n, getActiveToolActivityLabel as t };
