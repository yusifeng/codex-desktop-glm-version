import {
  $3 as reactCompilerRuntime,
  I3 as getJsxRuntime,
  K2 as initializeMessageRuntime,
  Lo as FailureIcon,
  Ro as initializeFailureIcon,
  Tc as initializeSuccessIcon,
  Y2 as FormattedMessage,
  e6 as initializeReactRuntime,
  h4 as initializeStyleRuntime,
  m4 as classNames,
  wc as SuccessIcon,
} from "@rchunk/app-shared";
import {
  $v as NoChecksIcon,
  Hg as initializeCheckIcons,
  Vg as EmptyChecksRingIcon,
  ey as initializePullRequestChecks,
} from "@rchunk/app-initial";

void reactCompilerRuntime;

export type PullRequestCheckStatus =
  | "failing"
  | "neutral"
  | "passing"
  | "pending"
  | "skipped"
  | "unknown";

export type PullRequestCiStatus = "failing" | "none" | "passing" | "pending";

export interface PullRequestCheck {
  status: PullRequestCheckStatus;
}

interface CheckSegment {
  color: string;
  key: string;
  offset: number;
  ratio: number;
}

const RADIUS = 5.75;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const SEGMENT_GAP = 1.5;

function HalfCircleIcon(props: Record<string, unknown>): unknown {
  const { jsx } = getJsxRuntime();
  return jsx("svg", {
    xmlns: "http://www.w3.org/2000/svg",
    width: 20,
    height: 20,
    fill: "currentColor",
    viewBox: "0 0 20 20",
    ...props,
    children: jsx("path", {
      d: "M10.012 1.669a8.343 8.343 0 0 1 8.343 8.343 8.343 8.343 0 0 1-8.343 8.343 8.343 8.343 0 0 1-8.343-8.343 8.343 8.343 0 0 1 8.343-8.343Zm0 1.668a6.675 6.675 0 1 0 0 13.35 6.675 6.675 0 0 0 0-13.35Zm0 1.669a5.007 5.007 0 1 1 0 10.012V5.006Z",
    }),
  });
}

function initializeHalfCircleIcon(): void {
  initializeReactRuntime();
  getJsxRuntime();
}

function getCheckSegments(checks: readonly PullRequestCheck[]): CheckSegment[] {
  if (checks.length === 0) return [];
  const counts: Record<PullRequestCheckStatus, number> = {
    failing: 0,
    neutral: 0,
    passing: 0,
    pending: 0,
    skipped: 0,
    unknown: 0,
  };
  for (const check of checks) counts[check.status] += 1;
  let offset = 0;
  return [
    { color: "var(--color-chart-green)", count: counts.passing, key: "passing" },
    { color: "var(--color-chart-red)", count: counts.failing, key: "failing" },
    { color: "var(--color-chart-yellow)", count: counts.pending, key: "pending" },
    {
      color: "var(--color-codex-description)",
      count: counts.neutral + counts.skipped + counts.unknown,
      key: "skipped",
    },
  ]
    .filter(({ count }) => count > 0)
    .map(({ color, count, key }) => {
      const ratio = count / checks.length;
      const segment = { color, key, offset, ratio };
      offset += CIRCUMFERENCE * ratio;
      return segment;
    });
}

function ChecksRing({
  checks,
  className = "icon-sm shrink-0",
}: {
  checks: readonly PullRequestCheck[];
  className?: string;
}): unknown {
  const { jsx } = getJsxRuntime();
  const segments = getCheckSegments(checks);
  const combinedClassName = classNames("text-codex-description", className);
  if (segments.length === 0) return jsx(EmptyChecksRingIcon, { className: combinedClassName });
  const gap = segments.length > 1 ? SEGMENT_GAP : 0;
  return jsx("svg", {
    "aria-hidden": true,
    className: combinedClassName,
    fill: "none",
    viewBox: "0 0 18 18",
    children: jsx("g", {
      transform: "rotate(-90 9 9)",
      children: segments.map((segment) =>
        jsx(
          "circle",
          {
            cx: "9",
            cy: "9",
            r: RADIUS,
            stroke: segment.color,
            strokeDasharray: `${Math.max(CIRCUMFERENCE * segment.ratio - gap, 0.001)} ${CIRCUMFERENCE}`,
            strokeDashoffset: -(segment.offset + gap / 2),
            strokeLinecap: "butt",
            strokeWidth: "1.7",
          },
          segment.key,
        ),
      ),
    }),
  });
}

function PullRequestChecksIcon({
  checks,
  ciStatus,
}: {
  checks: readonly PullRequestCheck[];
  ciStatus: PullRequestCiStatus;
}): unknown {
  const { jsx } = getJsxRuntime();
  if (checks.length === 0) {
    switch (ciStatus) {
      case "failing":
        return jsx(FailureIcon, { className: "icon-sm shrink-0 text-chart-red" });
      case "none":
        return jsx(NoChecksIcon, { className: "icon-sm shrink-0" });
      case "passing":
        return jsx(SuccessIcon, { className: "icon-sm shrink-0 text-chart-green" });
      case "pending":
        return jsx(HalfCircleIcon, { className: "icon-sm shrink-0 text-chart-yellow" });
    }
  }
  return ciStatus === "none"
    ? jsx(NoChecksIcon, { className: "icon-sm shrink-0" })
    : jsx(ChecksRing, { checks });
}

const statusMessages: Record<
  PullRequestCiStatus,
  { defaultMessage: string; description: string; id: string }
> = {
  failing: {
    id: "localConversation.pullRequest.actions.checksFailing",
    defaultMessage: "Checks failing",
    description: "Status row shown when pull request checks are failing",
  },
  none: {
    id: "localConversation.pullRequest.actions.noCiChecks",
    defaultMessage: "No CI checks",
    description: "Status row shown when the pull request currently has no CI checks",
  },
  passing: {
    id: "localConversation.pullRequest.actions.checksSuccessful",
    defaultMessage: "Checks successful",
    description: "Status row shown when pull request checks are passing",
  },
  pending: {
    id: "localConversation.pullRequest.actions.checksPending",
    defaultMessage: "Checks pending",
    description: "Status row shown when pull request checks are still pending",
  },
};

function PullRequestChecksMessage(status: PullRequestCiStatus): unknown {
  const { jsx } = getJsxRuntime();
  return jsx(FormattedMessage, statusMessages[status]);
}

function initializePullRequestChecksSummary(): void {
  initializeMessageRuntime();
  initializeSuccessIcon();
  initializeHalfCircleIcon();
  initializePullRequestChecks();
  initializeFailureIcon();
  initializeCheckIcons();
  initializeStyleRuntime();
  getJsxRuntime();
}

export {
  initializeHalfCircleIcon as a,
  HalfCircleIcon as i,
  PullRequestChecksMessage as n,
  initializePullRequestChecksSummary as r,
  PullRequestChecksIcon as t,
};
