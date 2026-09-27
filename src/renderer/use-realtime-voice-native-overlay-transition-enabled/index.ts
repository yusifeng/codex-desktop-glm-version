import * as appInitialChunk from "@rchunk/app-initial";
import "@rchunk/app-shared";
import "@rchunk/rolldown-runtime";

interface Bindings { Mrn(): string; ofn(experimentId: string): boolean; }
const { Mrn: getPlatform, ofn: useExperiment } = appInitialChunk as unknown as Bindings;
function useRealtimeVoiceNativeOverlayTransitionEnabled(): boolean {
  return getPlatform() === "macOS" && useExperiment("620613358");
}
function initializeRealtimeVoiceNativeOverlayTransition(): void {}
export { useRealtimeVoiceNativeOverlayTransitionEnabled as n, initializeRealtimeVoiceNativeOverlayTransition as t };
