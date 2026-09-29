import * as appInitialChunk from "@rchunk/app-initial";
import * as appSharedChunk from "@rchunk/app-shared";
import { n as initializeChronicleSettings } from "@rchunk/chronicle-settings";
import "@rchunk/rolldown-runtime";

interface ExperimentalFeature { name: string; stage: string; }
const { wL: initializeSharedRuntime } = appSharedChunk as unknown as { wL(): void };
const { dnt: initializeExperimentalFeatures } = appInitialChunk as unknown as { dnt(): void };
function isVisibleExperimentalFeature(feature: ExperimentalFeature): boolean {
  return feature.stage === "beta" && !["memories", "multi_agent", "plugins", "plugin", "remote_control", "chronicle", "workspace_dependencies"].includes(feature.name) && !feature.name.startsWith("realtime_");
}
function initialize(): void { initializeSharedRuntime(); initializeExperimentalFeatures(); initializeChronicleSettings(); }
export { isVisibleExperimentalFeature as n, initialize as t };
