import "@rchunk/rolldown-runtime";
import "@rchunk/app-initial";

export type ScheduleMode = "custom" | "daily" | "hourly" | "monthly" | "weekdays" | "weekly";
export type Weekday = "FR" | "MO" | "SA" | "SU" | "TH" | "TU" | "WE";
export interface ScheduleConfig { customRrule: string; intervalHours: number; intervalMinutes: number | null; mode: ScheduleMode; monthDay: number; oneTimeDate?: string; oneTimeSeconds?: number; time: string; untilDate?: string; untilTime?: string; weekdays: Weekday[] }
export interface AutomationRecord { default_timezone?: string; id: string; is_enabled: boolean; next_run_times: string[]; prompt: string; schedule: string; schedule_components: { by_day?: string | null; by_hour?: number | null; by_minute?: number | null; by_month_day?: number | null; frequency: string; start_time?: string | null }; schedule_time_of_day?: keyof typeof TIME_PRESETS | null; target_time_utc?: string | null; thread_mode?: string | null; timing_mode?: string | number; title: string }
export interface AutomationDraft { id: string; kind: "cron"; name: string; prompt: string; rawRrule: string | null; scheduleConfig: ScheduleConfig; scheduleDirty: boolean; status: "ACTIVE" | "PAUSED"; threadMode?: string | null }
export interface AutomationUpdateRequest { default_timezone?: string; is_enabled: boolean; prompt: string; schedule: string; thread_mode?: string | null; timing_mode?: string | number; title: string }

const TIME_PRESETS = { morning: "09:00", afternoon: "14:00", evening: "18:00", night: "22:00" } as const;
const WEEKDAY_ORDER: Weekday[] = ["MO", "TU", "WE", "TH", "FR", "SA", "SU"];
const WORKDAYS: Weekday[] = ["MO", "TU", "WE", "TH", "FR"];
const DAY_BY_INDEX: Weekday[] = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"];

function timePeriod(time: string): keyof typeof TIME_PRESETS { const hour = Number(time.split(":")[0]); return hour >= 21 || hour < 6 ? "night" : hour < 12 ? "morning" : hour < 17 ? "afternoon" : "evening"; }
function compactUtc(date: Date): string { return date.toISOString().replaceAll("-", "").replaceAll(":", "").replace(/\.\d{3}Z$/, "Z"); }
function localParts(date: Date): string { return new Intl.DateTimeFormat("sv-SE", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23" }).format(date); }
function ruleValue(schedule: string): string | null { return /(?:^|\r?\n)RRULE:([^\r\n]+)/.exec(schedule)?.[1] ?? null; }
function fields(rule: string | null): Map<string, string> { const result = new Map<string, string>(); for (const part of rule?.split(";") ?? []) { const [key, value] = part.split("=", 2); if (key && value) result.set(key, value); } return result; }
function zonedDate(year: number, month: number, day: number, hour: number, minute: number, second: number, timeZone?: string): Date {
  if (timeZone == null) return new Date(year, month - 1, day, hour, minute, second);
  const desired = Date.UTC(year, month - 1, day, hour, minute, second);
  let candidate = desired;
  for (let iteration = 0; iteration < 3; iteration++) {
    const parts = new Intl.DateTimeFormat("en-US", { timeZone, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23" }).formatToParts(new Date(candidate));
    const read = (type: Intl.DateTimeFormatPartTypes) => Number(parts.find((part) => part.type === type)?.value ?? 0);
    const observed = Date.UTC(read("year"), read("month") - 1, read("day"), read("hour"), read("minute"), read("second"));
    const correction = desired - observed;
    candidate += correction;
    if (correction === 0) break;
  }
  return new Date(candidate);
}
function parseUntilDate(automation: AutomationRecord): Date | null {
  const value = fields(ruleValue(automation.schedule)).get("UNTIL");
  const match = /^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2})(Z?))?$/.exec(value ?? "");
  if (match == null) return null;
  const [, year, month, day, hour = "23", minute = "59", second = "59", utc] = match;
  const numeric = [year, month, day, hour, minute, second].map(Number);
  const date = utc === "Z"
    ? new Date(Date.UTC(numeric[0], numeric[1] - 1, numeric[2], numeric[3], numeric[4], numeric[5]))
    : zonedDate(numeric[0], numeric[1], numeric[2], numeric[3], numeric[4], numeric[5], automation.default_timezone);
  if (Number.isNaN(date.getTime())) return null;
  const validation = new Date(Date.UTC(numeric[0], numeric[1] - 1, numeric[2], numeric[3], numeric[4], numeric[5]));
  return validation.toISOString().slice(0, 19) === `${year}-${month}-${day}T${hour}:${minute}:${second}` ? date : null;
}
function hourlyInterval(automation: AutomationRecord): number | null {
  const parsed = fields(ruleValue(automation.schedule));
  if (parsed.get("FREQ") !== "HOURLY" || (parsed.has("BYMINUTE") && parsed.get("BYMINUTE") !== "0") || (parsed.has("BYSECOND") && parsed.get("BYSECOND") !== "0")) return null;
  const raw = parsed.get("INTERVAL") ?? "1", interval = Number(raw);
  return /^\d{1,2}$/.test(raw) && interval >= 1 && interval <= 23 ? interval : null;
}
function scheduleKey(config: ScheduleConfig): string {
  if (config.oneTimeDate != null) return JSON.stringify([config.oneTimeDate, config.time, config.oneTimeSeconds ?? 0]);
  const until = config.untilDate == null ? null : [config.untilDate, config.untilTime ?? "23:59:59"];
  if (config.mode === "hourly") return JSON.stringify(["hourly", config.intervalHours, until]);
  if (config.mode === "daily") return JSON.stringify(["daily", config.time, until]);
  if (config.mode === "weekdays") return JSON.stringify(["weekly", WORKDAYS, config.time, until]);
  if (config.mode === "weekly") return JSON.stringify(["weekly", WEEKDAY_ORDER.filter((day) => config.weekdays.includes(day)), config.time, until]);
  if (config.mode === "monthly") return JSON.stringify(["monthly", config.monthDay, config.time, until]);
  return JSON.stringify(["custom", config.customRrule, config.monthDay, config.weekdays, until]);
}
function customRule(frequency: "daily" | "monthly" | "weekly", time: string, weekdays: Weekday[], monthDay: number): string {
  const [hour, minute] = time.split(":").map(Number);
  const values = [`FREQ=${frequency.toUpperCase()}`, "INTERVAL=1"];
  if (frequency === "weekly") values.push(`BYDAY=${weekdays.join(",")}`);
  if (frequency === "monthly") values.push(`BYMONTHDAY=${monthDay}`);
  values.push(`BYHOUR=${hour}`, `BYMINUTE=${minute}`);
  return values.join(";");
}
function automationToDraft(automation: AutomationRecord): AutomationDraft {
  const parsed = fields(ruleValue(automation.schedule));
  const frequency = parsed.get("FREQ") ?? automation.schedule_components.frequency.toUpperCase();
  const rawDays = (parsed.get("BYDAY") ?? automation.schedule_components.by_day ?? "").split(",").map((day) => day.trim()).filter(Boolean);
  const validDays = rawDays.length > 0 && rawDays.every((day) => WEEKDAY_ORDER.includes(day as Weekday));
  const weekdays = validDays ? WEEKDAY_ORDER.filter((day) => rawDays.includes(day)) : [DAY_BY_INDEX[new Date().getDay()] ?? "MO"];
  const hour = Number(parsed.get("BYHOUR") ?? automation.schedule_components.by_hour ?? 9);
  const minute = Number(parsed.get("BYMINUTE") ?? automation.schedule_components.by_minute ?? 0);
  const time = `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
  const interval = hourlyInterval(automation);
  const until = parseUntilDate(automation);
  let mode: ScheduleMode = "custom";
  if (interval != null) mode = "hourly";
  else if (automation.timing_mode !== "exact_schedule") {
    if (frequency === "DAILY") mode = "daily";
    else if (frequency === "WEEKLY" && validDays && weekdays.length === 5 && WORKDAYS.every((day) => weekdays.includes(day))) mode = "weekdays";
    else if (frequency === "WEEKLY" && validDays && weekdays.length <= 3) mode = "weekly";
    else if (frequency === "MONTHLY") mode = "monthly";
  }
  const monthDay = Math.min(31, Math.max(1, Number(parsed.get("BYMONTHDAY") ?? automation.schedule_components.by_month_day ?? new Date().getDate())));
  const standardFrequency = frequency === "WEEKLY" || frequency === "MONTHLY" ? frequency.toLowerCase() as "weekly" | "monthly" : "daily";
  const config: ScheduleConfig = { customRrule: ruleValue(automation.schedule) ?? customRule(standardFrequency, time, weekdays, monthDay), intervalHours: interval ?? 1, intervalMinutes: null, mode, monthDay, time: mode === "custom" ? time : TIME_PRESETS[automation.schedule_time_of_day ?? timePeriod(time)], weekdays, untilDate: until == null ? undefined : localParts(until).slice(0, 10), untilTime: until == null ? undefined : localParts(until).slice(11) };
  const once = automation.schedule_components.frequency === "once" || (/^DTSTART/m.test(automation.schedule) && !/^(RRULE|RDATE|EXRULE|EXDATE)/m.test(automation.schedule));
  if (once) {
    const floor = new Date(); floor.setSeconds(0, 0);
    const start = automation.schedule_components.frequency === "once" ? automation.schedule_components.start_time : null;
    let date = start == null ? null : new Date(start);
    if (date == null || Number.isNaN(date.getTime())) date = [automation.target_time_utc, ...automation.next_run_times].flatMap((value) => value == null ? [] : [new Date(value)]).find((candidate) => candidate.getTime() >= floor.getTime()) ?? null;
    if (date == null) { date = new Date(floor); date.setHours(date.getHours() + 1); }
    const value = localParts(date); config.oneTimeDate = value.slice(0, 10); config.time = value.slice(11, 16); config.oneTimeSeconds = date.getSeconds();
  }
  return { id: automation.id, kind: "cron", name: automation.title, prompt: automation.prompt, rawRrule: automation.schedule, scheduleConfig: config, scheduleDirty: false, status: automation.is_enabled ? "ACTIVE" : "PAUSED", threadMode: automation.thread_mode };
}
function switchScheduleMode(automation: AutomationRecord, config: ScheduleConfig, mode: ScheduleMode): ScheduleConfig {
  const original = automationToDraft(automation).scheduleConfig;
  const preserveTime = config.mode !== "custom" && config.mode !== "hourly";
  const next = { ...original, mode, untilDate: config.untilDate, untilTime: config.untilTime };
  if (mode === "custom" && ["daily", "weekdays", "weekly", "monthly"].includes(config.mode)) {
    const frequency = config.mode === "weekdays" ? "weekly" : config.mode as "daily" | "monthly" | "weekly";
    next.weekdays = config.mode === "weekdays" ? [...WORKDAYS] : [...config.weekdays];
    next.monthDay = config.monthDay;
    next.time = config.time;
    next.customRrule = customRule(frequency, config.time, next.weekdays, next.monthDay);
  } else {
    next.time = preserveTime ? config.time : TIME_PRESETS[automation.schedule_time_of_day ?? timePeriod(`${automation.schedule_components.by_hour ?? 9}:00`)];
    next.intervalHours = mode === "hourly" && config.mode === "hourly" ? config.intervalHours : 1;
  }
  return next;
}
function isDraftDirty(automation: AutomationRecord, draft: AutomationDraft): boolean { return draft.name !== automation.title || draft.prompt !== automation.prompt || (draft.threadMode != null && draft.threadMode !== automation.thread_mode) || (draft.scheduleDirty && scheduleKey(draft.scheduleConfig) !== scheduleKey(automationToDraft(automation).scheduleConfig)); }
function serializeSchedule(config: ScheduleConfig): string {
  if (config.oneTimeDate != null) return `BEGIN:VEVENT\nDTSTART:${compactUtc(new Date(`${config.oneTimeDate}T${config.time}:${String(config.oneTimeSeconds ?? 0).padStart(2, "0")}`))}\nEND:VEVENT`;
  let rule = config.mode === "hourly" ? `FREQ=HOURLY;INTERVAL=${config.intervalHours};BYMINUTE=0` : config.mode === "custom" ? config.customRrule.trim() : config.mode === "monthly" ? `FREQ=MONTHLY;BYMONTHDAY=${config.monthDay};BYHOUR=${Number(config.time.slice(0, 2))};BYMINUTE=${Number(config.time.slice(3))}` : config.mode === "weekly" || config.mode === "weekdays" ? `FREQ=WEEKLY;BYDAY=${(config.mode === "weekdays" ? WORKDAYS : WEEKDAY_ORDER.filter((day) => config.weekdays.includes(day))).join(",")};BYHOUR=${Number(config.time.slice(0, 2))};BYMINUTE=${Number(config.time.slice(3))}` : `FREQ=DAILY;BYHOUR=${Number(config.time.slice(0, 2))};BYMINUTE=${Number(config.time.slice(3))}`;
  if (/^(DTSTART|RDATE|EXRULE|EXDATE)[:;]/.test(rule)) return `BEGIN:VEVENT\n${rule}\nEND:VEVENT`;
  rule = rule.replace(/^RRULE:/, "");
  if (config.untilDate != null) rule += `;UNTIL=${compactUtc(new Date(`${config.untilDate}T${config.untilTime ?? "23:59:59"}`))}`;
  return `BEGIN:VEVENT\nRRULE:${rule}\nEND:VEVENT`;
}
function draftToUpdateRequest(automation: AutomationRecord, draft: AutomationDraft): AutomationUpdateRequest {
  const base: AutomationUpdateRequest = { default_timezone: automation.default_timezone, is_enabled: draft.status === "ACTIVE", prompt: draft.prompt, schedule: automation.schedule, thread_mode: draft.threadMode, timing_mode: automation.timing_mode, title: draft.name };
  if (!draft.scheduleDirty || scheduleKey(draft.scheduleConfig) === scheduleKey(automationToDraft(automation).scheduleConfig)) return base;
  const config = draft.scheduleConfig;
  if (config.oneTimeDate != null) return { ...base, default_timezone: Intl.DateTimeFormat().resolvedOptions().timeZone, schedule: serializeSchedule(config), timing_mode: Number(automation.timing_mode === "flexible_schedule") };
  const original = automationToDraft(automation).scheduleConfig;
  const endChanged = config.untilDate !== original.untilDate || config.untilTime !== original.untilTime;
  const comparable = { ...config, untilDate: original.untilDate, untilTime: original.untilTime };
  const structureUnchanged = scheduleKey(comparable) === scheduleKey(original);
  let schedule: string;
  if ((config.mode === "hourly" && hourlyInterval(automation) != null) || structureUnchanged) {
    schedule = automation.schedule.replace(/(^|\r?\n)RRULE:([^\r\n]*)/, (_match, prefix: string, body: string) => {
      const retained = body.split(";").filter((field) => !field.startsWith("UNTIL=") && (config.mode !== "hourly" || !field.startsWith("INTERVAL=")));
      if (config.mode === "hourly") retained.push(`INTERVAL=${config.intervalHours}`);
      if (config.untilDate != null) retained.push(`UNTIL=${compactUtc(new Date(`${config.untilDate}T${config.untilTime ?? "23:59:59"}`))}`);
      return `${prefix}RRULE:${retained.join(";")}`;
    });
  } else {
    schedule = serializeSchedule(config);
    const startLine = /^DTSTART[^\r\n]*/m.exec(automation.schedule)?.[0];
    if (startLine != null && !/^DTSTART[:;]/m.test(schedule)) schedule = schedule.replace("BEGIN:VEVENT\n", `BEGIN:VEVENT\n${startLine}\n`);
  }
  let timingMode = base.timing_mode;
  if (!structureUnchanged && automation.timing_mode !== "condition_watch") timingMode = config.mode === "custom" || config.mode === "hourly" ? 0 : 1;
  return { ...base, schedule: endChanged || schedule !== automation.schedule ? schedule : automation.schedule, timing_mode: timingMode };
}
function validationError(config: ScheduleConfig, now: Date): "end-past" | "past" | "too-far" | null { const floor = new Date(now); floor.setSeconds(0, 0); if (config.oneTimeDate != null) { const date = new Date(`${config.oneTimeDate}T${config.time}:${String(config.oneTimeSeconds ?? 0).padStart(2, "0")}`); if (date < floor) return "past"; const limit = new Date(now); limit.setFullYear(limit.getFullYear() + 2); return date >= limit ? "too-far" : null; } const until = config.untilDate == null ? null : new Date(`${config.untilDate}T${config.untilTime ?? "23:59:59"}`); return until != null && until < floor ? "end-past" : null; }
function draftValidationError(automation: AutomationRecord, draft: AutomationDraft, now: Date): "end-past" | "past" | "too-far" | null { return draft.scheduleDirty && scheduleKey(draft.scheduleConfig) !== scheduleKey(automationToDraft(automation).scheduleConfig) ? validationError(draft.scheduleConfig, now) : null; }
function initializeScheduleDraft(): void {}
export { timePeriod as a, initializeScheduleDraft as c, draftValidationError as i, switchScheduleMode as l, automationToDraft as n, parseUntilDate as o, draftToUpdateRequest as r, isDraftDirty as s, TIME_PRESETS as t };
