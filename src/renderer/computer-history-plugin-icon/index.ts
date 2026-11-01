import "@rchunk/rolldown-runtime";

let computerHistoryPluginIconUrl: string;
function initializeComputerHistoryPluginIcon(): void {
  computerHistoryPluginIconUrl = new URL(
    "computer-history-plugin-icon-cc68b3ed4fe9.png",
    import.meta.url,
  ).href;
}
export {
  initializeComputerHistoryPluginIcon as n,
  computerHistoryPluginIconUrl as t,
};
