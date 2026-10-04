export type PanelTarget = "bottom" | "right" | null;

export interface PanelTargetTabs<T> {
  bottom: T | null | undefined;
  right: T | null | undefined;
}

export interface PanelTargetAvailability {
  bottom: boolean;
  right: boolean;
}

export function getFallbackPanelTarget<T>(
  layout: unknown,
  tabs: PanelTargetTabs<T>,
  isPanelTab: (tab: T | null | undefined) => boolean,
): PanelTarget {
  const bottom = isPanelTab(tabs.bottom) ? "bottom" : null;
  const right = isPanelTab(tabs.right) ? "right" : null;
  if (layout === "bottom-panel" && bottom != null) return bottom;
  if (layout === "right-panel" && right != null) return right;
  if (right != null) return right;
  return bottom;
}

export function getPreferredPanelTarget<T>(
  layout: unknown,
  tabs: PanelTargetTabs<T>,
  availability: PanelTargetAvailability,
  isPanelTab: (tab: T | null | undefined) => boolean,
): PanelTarget {
  return getFallbackPanelTarget(
    layout,
    {
      bottom: availability.bottom ? tabs.bottom : null,
      right: availability.right ? tabs.right : null,
    },
    isPanelTab,
  );
}
