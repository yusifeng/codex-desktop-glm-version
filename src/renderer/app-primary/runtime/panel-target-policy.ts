export type PanelTarget = "bottom" | "right" | null;

export interface PanelTargetTab {
  kind?: string | null;
  tabId?: string | null;
}

export interface PanelTargetTabs<T extends PanelTargetTab> {
  bottom: T | null | undefined;
  right: T | null | undefined;
}

export interface PanelTargetAvailability {
  bottom: boolean;
  right: boolean;
}

function getBrowserTabId(tab: PanelTargetTab | null | undefined): string | null {
  if (tab == null) return null;
  const tabId = tab.tabId;
  if (tabId == null) return null;
  if (tabId.startsWith("browser:")) return tabId.slice("browser:".length);
  return tab.kind === "browser" ? tabId : null;
}

export function getFallbackPanelTarget<T extends PanelTargetTab>(
  layout: unknown,
  tabs: PanelTargetTabs<T>,
): PanelTarget {
  const bottom = getBrowserTabId(tabs.bottom);
  const right = getBrowserTabId(tabs.right);
  if (layout === "bottom-panel" && bottom != null) return "bottom";
  if (layout === "right-panel" && right != null) return "right";
  if (right != null) return "right";
  return bottom == null ? null : "bottom";
}

export function getPreferredPanelTarget<T extends PanelTargetTab>(
  layout: unknown,
  tabs: PanelTargetTabs<T>,
  availability: PanelTargetAvailability,
): PanelTarget {
  return getFallbackPanelTarget(
    layout,
    {
      bottom: availability.bottom ? tabs.bottom : null,
      right: availability.right ? tabs.right : null,
    },
  );
}
