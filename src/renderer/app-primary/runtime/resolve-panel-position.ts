export interface PanelPosition { bottom?: number | null; right?: number | null }

/** Resolve the preferred side for a panel from available coordinates. */
export function resolvePanelPosition(kind: string, position: PanelPosition): "bottom" | "right" | null {
  const bottom = position.bottom ?? null;
  const right = position.right ?? null;
  if (kind === "bottom-panel" && bottom != null) return "bottom";
  if ((kind === "right-panel" && right != null) || right != null) return "right";
  return bottom == null ? null : "bottom";
}
