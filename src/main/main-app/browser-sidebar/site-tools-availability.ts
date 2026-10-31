type AnyRecord = Record<string, any>;
type Availability = "available" | "unavailable" | "pending-available" | "pending-unavailable";

/** Owns WebMCP and annotation availability transitions for a browser page. */
export function createSiteToolsAvailabilityRuntime({ isEqual }: { isEqual: (left: unknown, right: unknown) => boolean }) {
  function resolvedAvailability(page: AnyRecord, previous: Availability, hasFeatures: boolean): Availability {
    if (hasFeatures) return "available";
    return page.isMainFrameLoading && previous === "pending-available" ? "pending-available" : "unavailable";
  }

  function pendingAvailability(value: Availability): Availability {
    return value === "available" || value === "pending-available" ? "pending-available" : "pending-unavailable";
  }

  function applyWebMcpTools(page: AnyRecord, tools: unknown[]): boolean {
    const current = page.siteToolsAvailability;
    const webMcp = resolvedAvailability(page, current.webMcp, tools.length > 0);
    if (isEqual(page.webMcpTools, tools) && current.webMcp === webMcp) return false;
    page.webMcpTools = tools;
    page.webMcpToolsRevision += 1;
    page.siteToolsAvailability = { ...current, webMcp };
    return true;
  }

  function applyAnnotationFeatures(page: AnyRecord, features: unknown[] | undefined): boolean {
    const current = page.siteToolsAvailability;
    const annotations = features == null
      ? "unavailable"
      : resolvedAvailability(page, current.annotations, features.length > 0);
    if (isEqual(page.siteAnnotationFeatures, features) && current.annotations === annotations) return false;
    page.siteAnnotationFeatures = features;
    page.siteToolsAvailability = { ...current, annotations };
    return true;
  }

  function markSiteToolsPending(page: AnyRecord): void {
    const current = page.siteToolsAvailability;
    page.siteToolsAvailability = {
      webMcp: pendingAvailability(current.webMcp),
      annotations: pendingAvailability(current.annotations),
    };
  }

  function clearSiteTools(page: AnyRecord): void {
    applyWebMcpTools(page, []);
    applyAnnotationFeatures(page, []);
  }

  function refreshSiteToolsAvailability(page: AnyRecord): void {
    applyWebMcpTools(page, page.webMcpTools);
    applyAnnotationFeatures(page, page.siteAnnotationFeatures);
  }

  return {
    applyWebMcpTools,
    applyAnnotationFeatures,
    markSiteToolsPending,
    clearSiteTools,
    refreshSiteToolsAvailability,
  };
}
