import "@rchunk/rolldown-runtime";
import "@rchunk/app-initial";
import "@rchunk/date-picker-runtime";
import { I3 as getJsxRuntime, type JsxRuntime } from "@rchunk/app-shared";

type Weekday = "FR" | "MO" | "SA" | "SU" | "TH" | "TU" | "WE";
type ScheduleMode = "custom" | "daily" | "hourly" | "monthly" | "weekdays" | "weekly" | "yearly";

interface ScheduleConfig {
  customRrule?: string;
  intervalHours?: number;
  intervalMinutes?: number | null;
  mode: ScheduleMode;
  monthDay?: number;
  oneTimeDate?: string | null;
  time?: string;
  timeZone?: string;
  untilDate?: string;
  weekdays?: Weekday[];
}

interface ScheduleOption {
  id: ScheduleMode;
  label: string;
}

const STANDARD_OPTIONS: ScheduleOption[] = [
  { id: "hourly", label: "Hourly" },
  { id: "daily", label: "Daily" },
  { id: "weekdays", label: "Weekdays" },
  { id: "weekly", label: "Weekly" },
  { id: "custom", label: "Custom" },
];
const CLOUD_OPTIONS: ScheduleOption[] = [
  ...STANDARD_OPTIONS.filter((option) => option.id !== "custom"),
  { id: "monthly", label: "Monthly" },
  { id: "custom", label: "Custom" },
];
const WEEKDAYS: Array<{ id: Weekday; label: string; longLabel: string }> = [
  { id: "MO", label: "Mo", longLabel: "Monday" },
  { id: "TU", label: "Tu", longLabel: "Tuesday" },
  { id: "WE", label: "We", longLabel: "Wednesday" },
  { id: "TH", label: "Th", longLabel: "Thursday" },
  { id: "FR", label: "Fr", longLabel: "Friday" },
  { id: "SA", label: "Sa", longLabel: "Saturday" },
  { id: "SU", label: "Su", longLabel: "Sunday" },
];

let runtime: JsxRuntime | undefined;
function jsx(): JsxRuntime {
  runtime ??= getJsxRuntime();
  return runtime;
}
function initialize(): void {}

function parseTime(value: string): { hour: number; minute: number } | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(value);
  if (match == null) return null;
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  return hour <= 23 && minute <= 59 ? { hour, minute } : null;
}

function formatScheduleTime(value: string, intl?: { formatTime?(date: Date, options: Record<string, unknown>): string }): string {
  const parsed = parseTime(value);
  if (parsed == null) return value;
  const normalized = `${String(parsed.hour).padStart(2, "0")}:${String(parsed.minute).padStart(2, "0")}`;
  return intl?.formatTime?.(new Date(2024, 0, 1, parsed.hour, parsed.minute), { hour: "numeric", minute: "2-digit" }) ?? normalized;
}

function Section({ actions, children, title }: { actions?: unknown; children?: unknown; title?: unknown }): unknown {
  return jsx().jsxs("section", {
    className: "flex min-h-0 flex-col",
    children: [
      title == null && actions == null ? null : jsx().jsxs("div", { className: "flex h-8 items-center justify-between", children: [jsx().jsx("span", { children: title }), actions] }),
      jsx().jsx("div", { className: "flex min-h-0 flex-col", children }),
    ],
  });
}

function ScheduleModeSelect({ ariaLabel = "Frequency", options, selectedId, selectedLabel, onSelect }: {
  ariaLabel?: string;
  options: ScheduleOption[];
  selectedId: string;
  selectedLabel?: unknown;
  onSelect(id: ScheduleMode): void;
}): unknown {
  return jsx().jsxs("label", {
    children: [
      selectedLabel,
      jsx().jsx("select", {
        "aria-label": ariaLabel,
        value: selectedId,
        onChange: (event: { currentTarget: { value: ScheduleMode } }) => onSelect(event.currentTarget.value),
        children: options.map((option) => jsx().jsx("option", { value: option.id, children: option.label }, option.id)),
      }),
    ],
  });
}

function TimePicker({ isOptionVisible, value, onChange }: {
  isOptionVisible?(value: string): boolean;
  value: string;
  onChange(value: string): void;
}): unknown {
  return jsx().jsx("select", {
    "aria-label": "Time",
    value,
    onChange: (event: { currentTarget: { value: string } }) => onChange(event.currentTarget.value),
    children: Array.from({ length: 96 }, (_, index) => {
      const minutes = index * 15;
      const option = `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
      return isOptionVisible?.(option) === false ? null : jsx().jsx("option", { value: option, children: formatScheduleTime(option) }, option);
    }),
  });
}

function WeekdayPicker({ value, onChange }: { value: Weekday[]; onChange(value: Weekday[]): void }): unknown {
  return jsx().jsx("div", {
    "aria-label": "Days of the week",
    children: WEEKDAYS.map((weekday) => {
      const checked = value.includes(weekday.id);
      return jsx().jsxs("label", {
        children: [
          jsx().jsx("input", {
            type: "checkbox",
            checked,
            onChange: () => {
              const next = checked ? value.filter((candidate) => candidate !== weekday.id) : [...value, weekday.id];
              if (next.length > 0) onChange(next);
            },
          }),
          weekday.label,
        ],
      }, weekday.id);
    }),
  });
}

function DateInput({ ariaLabel, timeZone = "UTC", value, onChange }: {
  ariaLabel?: string;
  timeZone?: string;
  value: string;
  onChange(value: string): void;
}): unknown {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date());
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((candidate) => candidate.type === type)?.value ?? "";
  const minimum = `${part("year")}-${part("month")}-${part("day")}`;
  return jsx().jsx("input", {
    type: "date",
    "aria-label": ariaLabel ?? "End repeat date",
    min: minimum,
    value,
    onChange: (event: { currentTarget: { value: string } }) => onChange(event.currentTarget.value),
  });
}

function FrequencySection({
  afterScheduleRows,
  beforeScheduleRows,
  grouped = false,
  heading = "Schedule",
  intervalStyle,
  scheduleConfig,
  scheduleSource = "local",
  timeZone = "UTC",
  onUpdateScheduleDraft,
}: {
  afterScheduleRows?: unknown;
  beforeScheduleRows?: unknown;
  grouped?: boolean;
  heading?: unknown;
  intervalStyle?: "heartbeat";
  scheduleConfig: ScheduleConfig;
  scheduleSource?: "cloud" | "local";
  timeZone?: string;
  onUpdateScheduleDraft(patch: Partial<ScheduleConfig>): void;
}): unknown {
  const options = scheduleSource === "cloud" ? CLOUD_OPTIONS : STANDARD_OPTIONS;
  const row = (label: string, control: unknown) => jsx().jsxs("label", { className: "flex items-center justify-between gap-4", children: [jsx().jsx("span", { children: label }), control] });
  const controls: unknown[] = [beforeScheduleRows];
  controls.push(row("Repeat", jsx().jsx(ScheduleModeSelect, {
    options,
    selectedId: scheduleConfig.mode,
    selectedLabel: options.find((option) => option.id === scheduleConfig.mode)?.label,
    onSelect: (mode: ScheduleMode) => onUpdateScheduleDraft({ mode }),
  })));
  if (scheduleConfig.mode === "hourly") {
    controls.push(row(intervalStyle === "heartbeat" ? "Check every" : "Repeat every", jsx().jsx("input", {
      type: "number",
      "aria-label": "Interval hours",
      min: 1,
      max: 23,
      value: scheduleConfig.intervalHours ?? 1,
      onChange: (event: { currentTarget: { valueAsNumber: number } }) => onUpdateScheduleDraft({ intervalHours: Math.min(23, Math.max(1, event.currentTarget.valueAsNumber)) }),
    })));
  } else if (scheduleConfig.mode !== "custom") {
    controls.push(row("Time", jsx().jsx(TimePicker, { value: scheduleConfig.time ?? "09:00", onChange: (time: string) => onUpdateScheduleDraft({ time }) })));
  }
  if (scheduleConfig.mode === "weekly") controls.push(row("Days", jsx().jsx(WeekdayPicker, { value: scheduleConfig.weekdays ?? ["MO"], onChange: (weekdays: Weekday[]) => onUpdateScheduleDraft({ weekdays }) })));
  if (scheduleConfig.mode === "monthly") controls.push(row("Day", jsx().jsx("input", { type: "number", "aria-label": "Day of month", min: 1, max: 31, value: scheduleConfig.monthDay ?? 1, onChange: (event: { currentTarget: { valueAsNumber: number } }) => onUpdateScheduleDraft({ monthDay: Math.min(31, Math.max(1, event.currentTarget.valueAsNumber)) }) })));
  if (scheduleConfig.mode === "custom") controls.push(row("Rule", jsx().jsx("textarea", { "aria-label": "Custom RRULE", value: scheduleConfig.customRrule ?? "", onChange: (event: { currentTarget: { value: string } }) => onUpdateScheduleDraft({ customRrule: event.currentTarget.value }) })));
  if (scheduleConfig.mode !== "custom") controls.push(row("End repeat", jsx().jsx(DateInput, { timeZone, value: scheduleConfig.untilDate ?? "", onChange: (untilDate: string) => onUpdateScheduleDraft({ untilDate: untilDate || undefined }) })));
  controls.push(afterScheduleRows);
  const content = jsx().jsx("div", { "data-grouped": grouped || undefined, children: controls });
  return jsx().jsx(Section, { title: heading, children: content });
}

export {
  initialize as a,
  ScheduleModeSelect as c,
  initialize as d,
  CLOUD_OPTIONS as f,
  initialize as g,
  formatScheduleTime as h,
  Section as i,
  initialize as l,
  WEEKDAYS as m,
  DateInput as n,
  WeekdayPicker as o,
  STANDARD_OPTIONS as p,
  initialize as r,
  initialize as s,
  FrequencySection as t,
  TimePicker as u,
};
