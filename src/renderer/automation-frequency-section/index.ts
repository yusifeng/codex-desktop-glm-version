import "@rchunk/rolldown-runtime";
import "@rchunk/app-initial";
import "@rchunk/date-picker-runtime";
import { I3 as getJsxRuntime, type JsxRuntime } from "@rchunk/app-shared";
type Frequency = "daily" | "hourly" | "monthly" | "weekly";
interface ScheduleDraft { days?: number[]; frequency: Frequency; interval?: number; time?: string; timeZone?: string }
let runtime: JsxRuntime | undefined; function jsx(): JsxRuntime { runtime ??= getJsxRuntime(); return runtime; }
function parseTime(value: string): { hour: number; minute: number } | null { const match = /^(\d{1,2}):(\d{2})$/.exec(value); if (!match) return null; const hour = Number(match[1]), minute = Number(match[2]); return hour <= 23 && minute <= 59 ? { hour, minute } : null; }
function formatTime(value: string): string { const parsed = parseTime(value); if (!parsed) return value; return `${String(parsed.hour).padStart(2, "0")}:${String(parsed.minute).padStart(2, "0")}`; }
function normalizeSchedule(draft: ScheduleDraft): ScheduleDraft { return { ...draft, interval: Math.max(1, draft.interval ?? 1), days: draft.frequency === "weekly" ? [...new Set(draft.days ?? [])].sort((a, b) => a - b) : draft.days, timeZone: draft.timeZone ?? "UTC" }; }
function scheduleLabel(draft: ScheduleDraft): string { const normalized = normalizeSchedule(draft); if (normalized.frequency === "hourly") return `Every ${normalized.interval} hour${normalized.interval === 1 ? "" : "s"}`; return `${normalized.frequency[0].toUpperCase()}${normalized.frequency.slice(1)} at ${formatTime(normalized.time ?? "09:00")} (${normalized.timeZone})`; }
function FrequencySection({ draft, onChange }: { draft: ScheduleDraft; onChange?(draft: ScheduleDraft): void }): unknown { const update = (patch: Partial<ScheduleDraft>) => onChange?.(normalizeSchedule({ ...draft, ...patch })); return jsx().jsxs("section", { children: [jsx().jsx("h3", { children: "Schedule" }), jsx().jsx("select", { "aria-label": "Frequency", value: draft.frequency, onChange: (event: { currentTarget: { value: Frequency } }) => update({ frequency: event.currentTarget.value }), children: ["hourly", "daily", "weekly", "monthly"].map(value => jsx().jsx("option", { value, children: value }, value)) }), jsx().jsx("input", { "aria-label": "Time", value: draft.time ?? "09:00", onChange: (event: { currentTarget: { value: string } }) => update({ time: event.currentTarget.value }) }), jsx().jsx("p", { children: scheduleLabel(draft) })] }); }
function initialize(): void {}
export { initialize as a, normalizeSchedule as c, parseTime as d, formatTime as f, initialize as g, scheduleLabel as h, initialize as i, FrequencySection as l, initialize as m, initialize as n, initialize as o, initialize as p, initialize as r, initialize as s, initialize as t, initialize as u };
