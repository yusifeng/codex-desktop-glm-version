import "@rchunk/rolldown-runtime";
import "@rchunk/app-shared";
export interface ToolPayloadFailure { code: "payload_too_large"; retryable: boolean; status: "failed" }
export interface ToolPayload { appData?: Record<string, unknown>; clientDefinedWidgets?: Record<string, unknown>; code: string; constants?: Record<string, unknown>; programFailure?: ToolPayloadFailure }
function parseToolPayload(value: unknown): ToolPayload | null { if (value == null || typeof value !== "object" || Array.isArray(value)) return null; const candidate = value as Record<string, unknown>; if (typeof candidate.code !== "string") return null; for (const key of ["constants", "appData", "clientDefinedWidgets"] as const) if (candidate[key] != null && (typeof candidate[key] !== "object" || Array.isArray(candidate[key]))) return null; const failure = candidate.programFailure; if (failure != null && (typeof failure !== "object" || Array.isArray(failure) || (failure as Record<string, unknown>).status !== "failed" || (failure as Record<string, unknown>).code !== "payload_too_large" || typeof (failure as Record<string, unknown>).retryable !== "boolean")) return null; return candidate as unknown as ToolPayload; }
function initializeToolPayload(): void {}
export { parseToolPayload as n, initializeToolPayload as t };
