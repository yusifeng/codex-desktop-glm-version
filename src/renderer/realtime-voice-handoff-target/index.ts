import {
  $3 as getCompilerRuntime,
  I3 as getJsxRuntime,
  e6 as getReactRuntime,
  x_ as usePresentationScale,
  y_ as initializePresentationScale,
  type JsxRuntime,
} from "@rchunk/app-shared";
import {
  $n as rectToScreen,
  Qn as transformVelocity,
  Slt as useReducedMotion,
  Zn as resolveOriginOffset,
  xlt as initializeHandoffGeometry,
} from "@rchunk/app-initial";
import "@rchunk/rolldown-runtime";

type Surface = "global-overlay" | "main-thread" | string;
interface Point { x: number; y: number }
interface Handoff {
  from: "in-window" | "global-overlay" | "main-thread";
  origin?: { width: number; x: number; y: number } | null;
  sequence: number;
  velocity?: Point | null;
}
interface Props {
  children?: unknown;
  className?: string;
  handoff?: Handoff | null;
  presentationAnchorRef?(element: HTMLElement | null): void;
  style?: Record<string, unknown>;
  surface: Surface;
  usesFadeTransition?: boolean;
}
interface AnimationHandle { cancel(): void }
interface ReactRuntime { useRef<T>(value: T): { current: T } }
interface CompilerRuntime { c(size: number): unknown[] }

let compiler: CompilerRuntime;
let React: ReactRuntime;
let jsx: JsxRuntime;
let easing: string;

function fallbackOffset(from: Handoff["from"]): Point {
  switch (from) {
    case "in-window": return { x: 0, y: 0 };
    case "global-overlay": return { x: 0, y: -28 };
    case "main-thread": return { x: 0, y: 18 };
  }
}

function animateHandoff(element: HTMLElement, handoff: Handoff, surface: Surface, fade: boolean, scale: unknown, reduceMotion: boolean): Animation | null {
  if (typeof element.animate !== "function" || reduceMotion) return null;
  if (fade) return element.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 200, easing, fill: "backwards" });
  if (surface === "global-overlay" && handoff.from === "main-thread") {
    return element.animate([{ opacity: 0.96 }, { opacity: 1 }], { duration: 90, easing, fill: "backwards" });
  }
  const bounds = rectToScreen(element.getBoundingClientRect(), { screenX: window.screenX, screenY: window.screenY });
  const offset = handoff.origin == null ? fallbackOffset(handoff.from) : resolveOriginOffset(handoff.origin, bounds, scale, surface === "main-thread" ? 300 : 180);
  if (surface === "main-thread" && Math.hypot(offset.x, offset.y) < 4) {
    return element.animate([{ filter: "blur(1.5px)", opacity: 0.96 }, { filter: "blur(0px)", opacity: 1 }], { duration: 120, easing, fill: "backwards" });
  }
  let initialScale = surface === "main-thread" ? 0.86 : 0.82;
  if (handoff.origin != null && bounds.width !== 0) initialScale = Math.min(1.12, Math.max(0.82, handoff.origin.width / bounds.width));
  const velocity = handoff.velocity == null ? { x: 0, y: 0 } : transformVelocity(handoff.velocity, scale, surface === "main-thread" ? 56 : 48);
  const rotation = Math.min(3, Math.max(-3, offset.x / 40));
  const overshoot = { x: offset.x * 0.3 + velocity.x, y: offset.y * 0.3 + velocity.y };
  return element.animate([
    { opacity: surface === "main-thread" ? 0.88 : 0.82, transform: `translate3d(${offset.x}px, ${offset.y}px, 0) scale(${initialScale}) rotate(${rotation}deg)` },
    { opacity: 1, transform: `translate3d(${overshoot.x}px, ${overshoot.y}px, 0) scale(1.045) rotate(${rotation * -0.35}deg)`, offset: 0.46 },
    { opacity: 1, transform: `translate3d(${overshoot.y * -0.045}px, ${overshoot.x * 0.045 - 2}px, 0) scale(1.018) rotate(0deg)`, offset: 0.8 },
    { opacity: 1, transform: "translate3d(0, 0, 0) scale(1) rotate(0deg)" },
  ], { delay: surface === "global-overlay" ? 24 : 0, duration: surface === "main-thread" ? 300 : 280, easing, fill: "backwards" });
}

function RealtimeVoiceHandoffTarget({ children, className, handoff, presentationAnchorRef, style, surface, usesFadeTransition = false }: Props): unknown {
  const cache = compiler.c(13);
  const scale = (usePresentationScale as () => unknown)();
  const reduceMotion = useReducedMotion();
  const animationRef = React.useRef<AnimationHandle | null>(null);
  const sequenceRef = React.useRef<number | null>(null);
  let ref: (element: HTMLElement | null) => void;
  if (cache[0] !== handoff || cache[1] !== presentationAnchorRef || cache[2] !== reduceMotion || cache[3] !== surface || cache[4] !== usesFadeTransition || cache[5] !== scale) {
    ref = (element) => {
      presentationAnchorRef?.(element);
      animationRef.current?.cancel();
      animationRef.current = null;
      if (handoff == null) { sequenceRef.current = null; return; }
      if (element != null && sequenceRef.current !== handoff.sequence) {
        sequenceRef.current = handoff.sequence;
        animationRef.current = animateHandoff(element, handoff, surface, usesFadeTransition, scale, reduceMotion) as AnimationHandle | null;
      }
    };
    cache[0] = handoff; cache[1] = presentationAnchorRef; cache[2] = reduceMotion; cache[3] = surface; cache[4] = usesFadeTransition; cache[5] = scale; cache[6] = ref;
  } else ref = cache[6] as typeof ref;
  let result: unknown;
  if (cache[7] !== children || cache[8] !== className || cache[9] !== style || cache[10] !== surface || cache[11] !== ref) {
    result = jsx.jsx("div", { ref, className, "data-realtime-voice-handoff-target": surface, style, children });
    cache[7] = children; cache[8] = className; cache[9] = style; cache[10] = surface; cache[11] = ref; cache[12] = result;
  } else result = cache[12];
  return result;
}

function initializeRealtimeVoiceHandoffTarget(): void {
  compiler = getCompilerRuntime() as CompilerRuntime;
  React = getReactRuntime() as ReactRuntime;
  initializePresentationScale();
  initializeHandoffGeometry();
  jsx = getJsxRuntime();
  easing = "cubic-bezier(0.22, 1, 0.36, 1)";
}

export { initializeRealtimeVoiceHandoffTarget as n, RealtimeVoiceHandoffTarget as t };
