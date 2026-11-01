import { n as onceExport } from "@rchunk/rolldown-runtime";
import {
  $3 as initializeCompilerRuntime,
  $Q as initializeMotionValues,
  I3 as getJsxRuntime,
  a$ as initializeTransforms,
  e$ as useTransform,
  e6 as getReactRuntime,
  h4 as initializeMotionComponents,
  m4 as classNames,
  n$ as motionValue,
  o$ as motion,
  t$ as initializeMotionRuntime,
} from "@rchunk/app-shared";
import type { JsxRuntime, ReactRuntime } from "@rchunk/app-shared";
import {
  i as initializeVoiceMotion,
  n as orbTransition,
  r as reducedMotionTransition,
} from "@rchunk/realtime-voice-motion";

interface MotionValue {
  get(): number;
  set(value: number): void;
}
interface Props {
  isConnecting: boolean;
  onHandoffComplete?(): void;
  orb?: unknown;
  orbDiameter: number;
  reduceMotion?: boolean;
}

const once = onceExport as (initializer: () => void) => () => void;
const HANDOFF_DURATION_MS = 1125;
const ORB_FADE_DURATION_MS = 325;
const BLEND_DURATION_MS = 195;
const BLEND_END_MS = 520;
const INITIAL_DOT_DIAMETER = 12;
const DAMPING_RATIO = 0.68;
const cycles = 1088 / BLEND_END_MS;
const angularFrequency = 2 * Math.PI * cycles;
const dampedFrequency = angularFrequency * Math.sqrt(1 - DAMPING_RATIO ** 2);
const firstPeak =
  Math.atan(dampedFrequency / (DAMPING_RATIO * angularFrequency)) /
  dampedFrequency;
const amplitude =
  0.06000000000000005 /
  ((Math.exp(-DAMPING_RATIO * angularFrequency * firstPeak) *
    Math.sin(dampedFrequency * firstPeak)) /
    dampedFrequency);

let React: ReactRuntime;
let jsx: JsxRuntime;

function orbDiameterAt(
  timeMs: number,
  initialDiameter: number,
  targetDiameter: number,
): number {
  const time = Math.max(0, timeMs);
  if (time >= HANDOFF_DURATION_MS) return targetDiameter;
  if (time <= ORB_FADE_DURATION_MS) {
    const progress = time / ORB_FADE_DURATION_MS;
    const smooth = progress ** 2 * (3 - 2 * progress);
    return initialDiameter + (INITIAL_DOT_DIAMETER - initialDiameter) * smooth;
  }
  const ratio = INITIAL_DOT_DIAMETER / targetDiameter;
  if (time <= BLEND_END_MS) {
    const blendSeconds = BLEND_DURATION_MS / 1000;
    const fadeSeconds = ORB_FADE_DURATION_MS / 1000;
    const initialRatio = initialDiameter / targetDiameter;
    const remaining = Math.max(1 - ratio, 1e-4);
    const c1 = (amplitude * blendSeconds) / remaining;
    const curvature =
      ((6 * (initialRatio - ratio)) / fadeSeconds ** 2) *
      (blendSeconds ** 2 / remaining);
    const damping =
      (-2 * DAMPING_RATIO * angularFrequency * amplitude * blendSeconds ** 2) /
      remaining;
    const halfCurvature = curvature / 2;
    const p0 = 1 - halfCurvature;
    const p1 = c1 - 2 * halfCurvature;
    const p2 = damping - 2 * halfCurvature;
    const a = p1 - 3 * p0;
    const b = (p2 - 6 * p0 - 6 * a) / 2;
    const c = a - 2 * b;
    const d = p0 - b - c;
    const x = (time - ORB_FADE_DURATION_MS) / BLEND_DURATION_MS;
    const curve = x ** 2 * (b * x ** 3 + c * x ** 2 + d * x + halfCurvature);
    return targetDiameter * (ratio + (1 - ratio) * curve);
  }
  const seconds = (time - BLEND_END_MS) / 1000;
  return (
    targetDiameter *
    (1 +
      Math.exp(-DAMPING_RATIO * angularFrequency * seconds) *
        (amplitude / dampedFrequency) *
        Math.sin(dampedFrequency * seconds))
  );
}

function orbOpacityAt(timeMs: number): number {
  const progress = Math.min(
    1,
    Math.max(0, (timeMs - ORB_FADE_DURATION_MS) / BLEND_DURATION_MS),
  );
  return progress ** 3 * (progress * (progress * 6 - 15) + 10);
}

function Dot({
  ref,
  reduceMotion,
}: {
  ref: { current: HTMLElement | null };
  reduceMotion?: boolean;
}): unknown {
  return jsx.jsx("div", {
    ref,
    className: classNames(
      "size-[50px] rounded-full bg-primary-solid",
      !reduceMotion && "pulsing-dot",
    ),
  });
}

function RealtimeVoiceStageLayout({
  isConnecting,
  onHandoffComplete,
  orb,
  orbDiameter,
  reduceMotion,
}: Props): unknown {
  const dotRef = React.useRef<HTMLElement | null>(null);
  const handoffCompleted = React.useRef(false);
  const dotMeasured = React.useRef(false);
  const progress = (motionValue as unknown as (value: number) => MotionValue)(
    +!isConnecting,
  );
  const dotDiameter = (
    motionValue as unknown as (value: number) => MotionValue
  )(50);
  const animatedDiameter = (useTransform as any)(() =>
    orbDiameterAt(
      progress.get() * HANDOFF_DURATION_MS,
      dotDiameter.get(),
      orbDiameter,
    ),
  );
  const orbOpacity = (useTransform as any)(progress, (value: number) =>
    orbOpacityAt(value * HANDOFF_DURATION_MS),
  );
  const dotOpacity = (useTransform as any)(
    orbOpacity,
    (value: number) => 1 - value,
  );
  const orbScale = (useTransform as any)(
    animatedDiameter,
    (value: number) => value / orbDiameter,
  );
  const dotScale = (useTransform as any)(
    () => animatedDiameter.get() / dotDiameter.get(),
  );
  const complete = () => {
    if (
      !isConnecting &&
      (reduceMotion || progress.get() >= 1) &&
      !handoffCompleted.current
    ) {
      handoffCompleted.current = true;
      onHandoffComplete?.();
    }
  };
  const effectComplete =
    (
      React.useEffectEvent as undefined | ((callback: () => void) => () => void)
    )?.(complete) ?? complete;
  React.useEffect(() => {
    if (isConnecting) return;
    const frame = requestAnimationFrame(effectComplete);
    return () => cancelAnimationFrame(frame);
  }, [isConnecting]);
  const transition = reduceMotion ? reducedMotionTransition : orbTransition;
  const onAnimationStart = () => {
    const dot = dotRef.current;
    if (isConnecting) {
      dotMeasured.current = false;
      handoffCompleted.current = false;
      if (dot != null) dot.style.animationPlayState = "";
      return;
    }
    dotMeasured.current = true;
    if (dot == null) return;
    const width = dot.getBoundingClientRect().width;
    if (width > 0) dotDiameter.set(width);
    dot.style.animationPlayState = "paused";
  };
  const onAnimationComplete = () => {
    if (!isConnecting && !reduceMotion && dotMeasured.current) {
      dotMeasured.current = false;
      complete();
    }
  };
  return jsx.jsxs(motion.div, {
    "aria-hidden": true,
    className: "relative flex items-center justify-center",
    initial: false,
    animate: { height: orbDiameter, width: orbDiameter },
    transition,
    children: [
      jsx.jsx(motion.div, {
        className: classNames(
          "absolute inset-0",
          isConnecting && "pointer-events-none",
        ),
        style: { opacity: orbOpacity, scale: orbScale },
        children: orb,
      }),
      jsx.jsx(motion.div, {
        className:
          "pointer-events-none absolute inset-0 flex items-center justify-center",
        style: { opacity: dotOpacity, scale: dotScale },
        children: jsx.jsx(Dot, { ref: dotRef, reduceMotion }),
      }),
      jsx.jsx(motion.span, {
        "aria-hidden": true,
        animate: { opacity: +!isConnecting },
        className: "pointer-events-none absolute size-0",
        initial: false,
        onAnimationStart,
        onAnimationComplete,
        style: { opacity: progress },
        transition: {
          duration: reduceMotion
            ? 0
            : isConnecting
              ? 0.325
              : HANDOFF_DURATION_MS / 1000,
          ease: "linear",
        },
      }),
    ],
  });
}

const initializeRealtimeVoiceStageLayout = once(() => {
  initializeCompilerRuntime();
  initializeMotionComponents();
  initializeTransforms();
  initializeMotionRuntime();
  initializeMotionValues();
  React = getReactRuntime();
  initializeVoiceMotion();
  jsx = getJsxRuntime();
});

let stageFooterClass: string;
let stageContentClass: string;
let contentEnterTransform: string;
let orbExitTransform: string;
const initializeRealtimeVoiceStageConstants = once(() => {
  stageFooterClass =
    "pointer-events-none absolute inset-x-0 bottom-0 z-20 mx-auto h-52 w-full max-w-[900px] px-12";
  stageContentClass =
    "absolute inset-x-12 top-0 flex flex-col items-center gap-1";
  contentEnterTransform = "translateY(52px)";
  orbExitTransform = "translateY(-28px)";
});

export {
  initializeRealtimeVoiceStageConstants as a,
  orbExitTransform as i,
  stageFooterClass as n,
  RealtimeVoiceStageLayout as o,
  contentEnterTransform as r,
  initializeRealtimeVoiceStageLayout as s,
  stageContentClass as t,
};
