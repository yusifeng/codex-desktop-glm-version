type AnnotationSurfaceEvent = {
  bubbles?: boolean;
  detail?: string;
};

type EventTargetLike = {
  dispatchEvent(event: AnnotationSurfaceEvent): unknown;
};

type CustomEventConstructor = new (type: string, init: { bubbles: boolean; detail: string }) => AnnotationSurfaceEvent;

function dispatchAnnotationSurfaceRequest(
  target: EventTargetLike,
  eventName: string,
  payload: Record<string, unknown>,
  CustomEventRef: CustomEventConstructor = globalThis.CustomEvent as CustomEventConstructor,
) {
  return target.dispatchEvent(
    new CustomEventRef(eventName, { bubbles: true, detail: JSON.stringify(payload) }),
  );
}

function isAnnotationSurfaceResponseEvent(
  event: unknown,
  CustomEventRef: CustomEventConstructor = globalThis.CustomEvent as CustomEventConstructor,
) {
  return event instanceof CustomEventRef;
}

export { dispatchAnnotationSurfaceRequest, isAnnotationSurfaceResponseEvent };
if (typeof module !== "undefined") module.exports = { dispatchAnnotationSurfaceRequest, isAnnotationSurfaceResponseEvent };
