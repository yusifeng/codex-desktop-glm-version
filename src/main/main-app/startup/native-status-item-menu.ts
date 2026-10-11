export type NativeStatusItemThread = { path: string; title: string };

export function projectNativeStatusItemMenuState(input: {
  appName: string;
  computerHistoryAvailable: boolean;
  computerHistoryEnabled: boolean;
  computerHistoryIndicatorEnabled: boolean;
  computerUseAvailable: boolean;
  menuState: unknown;
  trayMenuThreads: {
    pinnedThreads: NativeStatusItemThread[];
    unreadThreads: NativeStatusItemThread[];
    runningThreads: NativeStatusItemThread[];
  };
  labels: {
    pinned: string;
    unread: string;
    running: string;
    quit: string;
  };
}) {
  const projectThreads = (threads: NativeStatusItemThread[]) =>
    threads.map(({ path, title }) => ({ path, title }));
  return {
    appName: input.appName,
    computerHistoryAvailable: input.computerHistoryAvailable,
    computerHistoryEnabled: input.computerHistoryEnabled,
    computerHistoryIndicatorEnabled: input.computerHistoryIndicatorEnabled,
    computerUseAvailable: input.computerUseAvailable,
    featureState: input.menuState,
    pinnedThreads: projectThreads(input.trayMenuThreads.pinnedThreads),
    unreadThreads: projectThreads(input.trayMenuThreads.unreadThreads),
    runningThreads: projectThreads(input.trayMenuThreads.runningThreads),
    labels: input.labels,
  };
}

if (typeof module !== `undefined`) module.exports = { projectNativeStatusItemMenuState };
