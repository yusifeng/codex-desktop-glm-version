import * as appInitialChunk from "@rchunk/app-initial";
const { aE: initializeEpicChartIndicator, oE: loadEpicChartIndicator } = appInitialChunk as unknown as { aE(): void; oE(): Promise<unknown> };
initializeEpicChartIndicator();
export { loadEpicChartIndicator };
