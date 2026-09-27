import "@rchunk/rolldown-runtime";
import { Cq as BuildFlavor, wL as initializeUtilities } from "@rchunk/app-shared";

interface DockIconSettingVisibilityProps {
  buildFlavor?: string;
  dockIconPreviews: unknown;
  platform: string;
}

function DockIconSettingVisibility({
  platform,
  dockIconPreviews,
  buildFlavor = "prod",
}: DockIconSettingVisibilityProps): unknown {
  const agentBuildFlavor = (BuildFlavor as unknown as { Agent: string }).Agent;
  return platform !== "macOS" || buildFlavor === agentBuildFlavor
    ? null
    : dockIconPreviews;
}

function initializeDockIconSettingVisibility(): void {
  initializeUtilities();
}

export { initializeDockIconSettingVisibility as n, DockIconSettingVisibility as t };
