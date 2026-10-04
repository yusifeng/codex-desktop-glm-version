/**
 * Cross-realm DOM element predicate used by renderer interaction handlers.
 *
 * The owner window's constructors are preferred so elements coming from an
 * iframe or shadow document are accepted without relying on the host realm.
 */
export function isElement(value: unknown): boolean {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as {
    ownerDocument?: { defaultView?: { HTMLElement?: unknown; Node?: unknown } | null } | null;
    nodeType?: number;
    getBoundingClientRect?: unknown;
    tagName?: unknown;
  };
  const view = candidate.ownerDocument?.defaultView;
  const HTMLElementConstructor = (view?.HTMLElement ??
    (typeof HTMLElement === "undefined" ? null : HTMLElement)) as Function | null;
  if (HTMLElementConstructor != null && value instanceof HTMLElementConstructor) return true;
  const NodeConstructor = (view?.Node ?? (typeof Node === "undefined" ? null : Node)) as {
    ELEMENT_NODE?: number;
  } | null;
  return NodeConstructor != null &&
    candidate.nodeType === NodeConstructor.ELEMENT_NODE &&
    candidate.ownerDocument != null &&
    typeof candidate.getBoundingClientRect === "function" &&
    typeof candidate.tagName === "string";
}
