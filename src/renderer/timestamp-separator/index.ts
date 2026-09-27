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
  e6: React,
  f$: initializeMotionComponents,
  h4: initializeClassNames,
  m4: classNames,
  n4: useIntl,
  o$: motion,
} = appSharedChunk;
const initializeTimestampConstants = initializeTimestampConstantsExport;
const groupedTimestamp = groupedTimestampExport;

let jsx: JsxRuntime;
const transition = { duration: 0.22, ease: [0.23, 1, 0.32, 1] };
const messages = defineMessages({
  recent: {
    id: "conversation.timestampSeparator.recent",
    defaultMessage: "<day>{date}</day> {time}",
  },
  older: {
    id: "conversation.timestampSeparator.older",
    defaultMessage: "<day>{date}</day> at {time}",
  },
} satisfies Record<string, MessageDescriptor>);

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
  const reducedMotion = Boolean(useReducedMotion());
  const content = isVisible
    ? jsx.jsx(motion.div, {
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
      })
    : null;
  return jsx.jsx(AnimatePresence, { initial: false, children: content });
}

function Day({ children }: { children?: unknown }): unknown {
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
  return jsx.jsx("div", {
    "aria-label": label,
    className: compact
      ? "flex justify-center py-2"
      : "flex justify-center py-4",
    role: label == null ? undefined : "separator",
    children: jsx.jsx("time", {
      className: compact
        ? "text-xs text-tertiary select-none"
        : "text-sm leading-5 font-normal text-tertiary select-none",
      dateTime: new Date(sentAtMs).toISOString(),
      children,
    }),
  });
}

function TimestampSeparator({
  sentAtMs,
  nowMs,
}: {
  sentAtMs: number;
  nowMs?: number;
}): unknown {
  initializeTimestampSeparator();
  const intl = useIntl();
  const [initialNow] = React.useState(() => Date.now());
  if (!Number.isFinite(sentAtMs)) return null;
  const { date, time, includeAt } = groupedTimestamp(
    intl,
    new Date(sentAtMs),
    new Date(nowMs ?? initialNow),
  ) as { date: string; time: string; includeAt: boolean };
  const descriptor = includeAt ? messages.older : messages.recent;
  const label = intl.formatMessage(descriptor, { date, time, day: joinDay });
  return jsx.jsx(TimestampLabel, {
    label,
    sentAtMs,
    children: jsx.jsx(FormattedMessage, {
      ...descriptor,
      values: { date, time, day: Day },
    }),
  });
}

let animationInitialized = false;
function initializeTimestampSeparatorAnimation(): void {
  if (animationInitialized) return;
  initializeClassNames();
  initializeMotionComponents();
  initializeAnimationRuntime();
  initializePresenceRuntime();
  jsx = getJsxRuntime();
  animationInitialized = true;
}

let initialized = false;
function initializeTimestampSeparator(): void {
  if (initialized) return;
  React();
  initializeIntlRuntime();
  initializeTimestampConstants();
  jsx = getJsxRuntime();
  initialized = true;
}

initializeTimestampSeparatorAnimation();
initializeTimestampSeparator();
export {
  initializeTimestampSeparatorAnimation as i,
  initializeTimestampSeparator as n,
  VisibilityCollapse as r,
  TimestampSeparator as t,
};
