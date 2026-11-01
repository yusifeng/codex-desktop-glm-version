import * as appSharedChunk from "@rchunk/app-shared";
import "@rchunk/rolldown-runtime";
import {
  a as initializeTimestampConstantsExport,
  r as groupedTimestampExport,
} from "@rchunk/timestamps";
import type { JsxRuntime, MessageDescriptor } from "@rchunk/app-shared";

const {
  G2: defineMessages,
  I3: getJsxRuntime,
  K2: initializeIntlRuntime,
  XQ: useReducedMotion,
  Y2: FormattedMessage,
  YQ: initializePresenceRuntime,
  a$: initializeAnimationRuntime,
  d$: AnimatePresence,
  e6: getReactRuntime,
  f$: initializeMotionComponents,
  h4: initializeClassNames,
  m4: classNames,
  n4: useIntl,
  o$: motion,
} = appSharedChunk;
const initializeTimestampConstants = initializeTimestampConstantsExport;
const groupedTimestamp = groupedTimestampExport;

let jsx: JsxRuntime;
interface CompilerRuntime { c(size: number): unknown[] }
let animationCompilerRuntime: CompilerRuntime;
let timestampCompilerRuntime: CompilerRuntime;
let React: ReturnType<typeof getReactRuntime>;
let transition: { duration: number; ease: number[] };
let messages: Record<"recent" | "older", MessageDescriptor>;

function VisibilityCollapse({
  className,
  children,
  isVisible,
}: {
  className?: string;
  children?: unknown;
  isVisible: boolean;
}): unknown {
  initializeTimestampSeparatorAnimation();
  const cache = animationCompilerRuntime.c(7);
  const reducedMotion = Boolean(useReducedMotion());
  let content: unknown;
  if (cache[0] !== children || cache[1] !== className || cache[2] !== isVisible || cache[3] !== reducedMotion) {
    content = isVisible ? jsx.jsx(motion.div, {
        className: classNames("overflow-hidden", className),
        animate: {
          height: "auto",
          opacity: 1,
          transitionEnd: { overflow: "visible" },
        },
        exit: reducedMotion
          ? { opacity: 0, overflow: "hidden", pointerEvents: "none" }
          : {
              height: 0,
              opacity: 0,
              overflow: "hidden",
              pointerEvents: "none",
            },
        transition,
        children,
      }) : null;
    cache[0] = children; cache[1] = className; cache[2] = isVisible;
    cache[3] = reducedMotion; cache[4] = content;
  } else content = cache[4];
  if (cache[5] !== content) { cache[5] = content; cache[6] = jsx.jsx(AnimatePresence, { initial: false, children: content }); }
  return cache[6];
}

function Day(children: unknown): unknown {
  return jsx.jsx("span", { className: "font-medium", children });
}

function joinDay(chunks: readonly unknown[]): string {
  return chunks.join("");
}

function TimestampLabel({
  children,
  compact = false,
  label,
  sentAtMs,
}: {
  children?: unknown;
  compact?: boolean;
  label?: string;
  sentAtMs: number;
}): unknown {
  initializeTimestampSeparator();
  const cache = timestampCompilerRuntime.c(11);
  const containerClass = compact ? "flex justify-center py-2" : "flex justify-center py-4";
  const role = label == null ? undefined : "separator";
  const timeClass = compact ? "text-xs text-tertiary select-none" : "text-sm leading-5 font-normal text-tertiary select-none";
  let dateTime: string;
  if (cache[0] === sentAtMs) dateTime = cache[1] as string;
  else { dateTime = new Date(sentAtMs).toISOString(); cache[0] = sentAtMs; cache[1] = dateTime; }
  let time: unknown;
  if (cache[2] === children && cache[3] === timeClass && cache[4] === dateTime) time = cache[5];
  else { time = jsx.jsx("time", { className: timeClass, dateTime, children }); cache[2] = children; cache[3] = timeClass; cache[4] = dateTime; cache[5] = time; }
  if (cache[6] !== label || cache[7] !== containerClass || cache[8] !== role || cache[9] !== time) {
    cache[6] = label; cache[7] = containerClass; cache[8] = role; cache[9] = time;
    cache[10] = jsx.jsx("div", { "aria-label": label, className: containerClass, role, children: time });
  }
  return cache[10];
}

function TimestampSeparator({
  sentAtMs,
  nowMs,
}: {
  sentAtMs: number;
  nowMs?: number;
}): unknown {
  initializeTimestampSeparator();
  const cache = timestampCompilerRuntime.c(20);
  const intl = useIntl();
  const [initialNow] = React.useState(() => Date.now());
  if (!Number.isFinite(sentAtMs)) return null;
  let date: string, time: string, descriptor: MessageDescriptor, label: string;
  if (cache[0] !== intl || cache[1] !== initialNow || cache[2] !== nowMs || cache[3] !== sentAtMs) {
    const grouped = groupedTimestamp(intl, new Date(sentAtMs), new Date(nowMs ?? initialNow)) as { date: string; time: string; includeAt: boolean };
    date = grouped.date; time = grouped.time;
    descriptor = grouped.includeAt ? messages.older : messages.recent;
    label = intl.formatMessage(descriptor, { date, time, day: joinDay }) as string;
    cache[0] = intl; cache[1] = initialNow; cache[2] = nowMs; cache[3] = sentAtMs;
    cache[4] = TimestampLabel; cache[5] = date; cache[6] = descriptor; cache[7] = label; cache[8] = time;
  } else { date = cache[5] as string; descriptor = cache[6] as MessageDescriptor; label = cache[7] as string; time = cache[8] as string; }
  let values: Record<string, unknown>;
  if (cache[9] !== date || cache[10] !== time) { values = { date, time, day: Day }; cache[9] = date; cache[10] = time; cache[11] = values; }
  else values = cache[11] as Record<string, unknown>;
  let formatted: unknown;
  if (cache[12] !== descriptor || cache[13] !== values) { formatted = jsx.jsx(FormattedMessage, { ...descriptor, values }); cache[12] = descriptor; cache[13] = values; cache[14] = formatted; }
  else formatted = cache[14];
  if (cache[15] !== TimestampLabel || cache[16] !== sentAtMs || cache[17] !== label || cache[18] !== formatted) {
    cache[15] = TimestampLabel; cache[16] = sentAtMs; cache[17] = label; cache[18] = formatted;
    cache[19] = jsx.jsx(TimestampLabel, { label, sentAtMs, children: formatted });
  }
  return cache[19];
}

let animationInitialized = false;
function initializeTimestampSeparatorAnimation(): void {
  if (animationInitialized) return;
  animationCompilerRuntime = appSharedChunk.$3() as unknown as CompilerRuntime;
  initializeClassNames();
  initializeMotionComponents();
  initializeAnimationRuntime();
  initializePresenceRuntime();
  jsx = getJsxRuntime();
  transition = { duration: 0.22, ease: [0.23, 1, 0.32, 1] };
  animationInitialized = true;
}

let initialized = false;
function initializeTimestampSeparator(): void {
  if (initialized) return;
  timestampCompilerRuntime = appSharedChunk.$3() as unknown as CompilerRuntime;
  React = getReactRuntime();
  initializeIntlRuntime();
  initializeTimestampConstants();
  jsx = getJsxRuntime();
  messages = defineMessages({
    recent: {
      id: "conversation.timestampSeparator.recent",
      defaultMessage: "<day>{date}</day> {time}",
      description: "Centered timestamp separating messages in a Codex conversation. The date is a localized relative day such as Today, Yesterday, or Monday; time is the localized time of day. The day tag emphasizes the date. Keep the complete label short and adjust its order or punctuation for the locale.",
    },
    older: {
      id: "conversation.timestampSeparator.older",
      defaultMessage: "<day>{date}</day> at {time}",
      description: "Centered timestamp separating older messages in a Codex conversation. The date is a localized calendar date, including the year when more than 365 days old; time is the localized time of day. The day tag emphasizes the date. Keep the complete label short and translate the date-time relationship naturally.",
    },
  });
  initialized = true;
}

export {
  initializeTimestampSeparatorAnimation as i,
  initializeTimestampSeparator as n,
  VisibilityCollapse as r,
  TimestampSeparator as t,
};
