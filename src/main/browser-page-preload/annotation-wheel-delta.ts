type WheelLikeEvent = { deltaMode: number; deltaX: number; deltaY: number };
type WheelDeltaDependencies = { lineMode: number; pageMode: number; lineScale: number };

function normalizeAnnotationWheelDelta(
  event: WheelLikeEvent,
  viewport: { innerWidth: number; innerHeight: number },
  dependencies: WheelDeltaDependencies,
) {
  return projectAnnotationWheelDelta(event, viewport, dependencies);
}

export { normalizeAnnotationWheelDelta };
if (typeof module !== `undefined`) module.exports = { normalizeAnnotationWheelDelta };
import { projectAnnotationWheelDelta } from "./annotation-wheel-delta-policy";
