// @ts-nocheck

/** Registers synchronous startup/bootstrap IPC and native drag entry points. */
export function registerStartupIpcHandlers(options: Record<string, any>) {
  const {
    ipcMain,
    channels,
    runtime,
    buildFlavor,
    getContextForWebContents,
    isTrustedIpcEvent,
    getSentryBootstrap,
    logger,
  } = options;
  const linkDragSchema = runtime.wf({
    url: runtime.Nf().refine((value: string) => /^https?:\/\//i.test(value)),
    title: runtime.Of(),
    html: runtime.Of(),
  });

  ipcMain.on(channels.sentryBootstrap, (event: Record<string, any>) => {
    event.returnValue = isTrustedIpcEvent(event) ? getSentryBootstrap() : null;
  });
  ipcMain.on(channels.buildFlavor, (event: Record<string, any>) => {
    event.returnValue = isTrustedIpcEvent(event) ? buildFlavor : null;
  });
  ipcMain.on(channels.sharedObjects, (event: Record<string, any>) => {
    event.returnValue = isTrustedIpcEvent(event)
      ? (getContextForWebContents(event.sender)?.getSharedObjectSnapshot() ?? {})
      : {};
  });
  ipcMain.on(channels.sidebarBootstrap, (event: Record<string, any>) => {
    event.returnValue = isTrustedIpcEvent(event)
      ? (getContextForWebContents(event.sender)?.getInitialSidebarBootstrap() ?? null)
      : null;
  });
  ipcMain.on(channels.fileDrag, (event: Record<string, any>, payload: unknown) => {
    event.returnValue = isTrustedIpcEvent(event)
      ? (getContextForWebContents(event.sender)?.startFileDrag(event.sender, payload) ?? false)
      : false;
  });
  ipcMain.on(channels.linkDrag, (event: Record<string, any>, payload: unknown) => {
    if (!isTrustedIpcEvent(event)) return;
    const parsed = linkDragSchema.safeParse(payload);
    if (!parsed.success) return;
    try {
      Reflect.apply(event.sender.startDrag.bind(event.sender), event.sender, [parsed.data]);
    } catch (error) {
      logger.n().warning(`Failed to start native link drag`, {
        safe: {},
        sensitive: { error },
      });
    }
  });
  ipcMain.on(channels.theme, (event: Record<string, any>) => {
    event.returnValue = isTrustedIpcEvent(event) && options.getShouldUseDarkColors()
      ? `dark`
      : `light`;
  });
}

if (typeof module !== "undefined") {
  module.exports = { registerStartupIpcHandlers };
}
