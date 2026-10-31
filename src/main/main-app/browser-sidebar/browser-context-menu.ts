type AnyRecord = Record<string, any>;

export function createBrowserContextMenuRuntime(dependencies: AnyRecord) {
  const { clipboard, menu, messages, shared } = dependencies;

  function canCommentOnSnapshot(snapshot: AnyRecord): boolean {
    return snapshot.tabType === shared.lu.WEB && snapshot.commentModeDisabledReason == null;
  }

  function selectedText(params: AnyRecord): string {
    return !params.formControlType.endsWith("password") && params.selectionText.trim().length > 0
      ? params.selectionText
      : "";
  }

  function passwordItems(params: AnyRecord, webContents: AnyRecord): AnyRecord[] {
    const manager = params.passwordManager;
    if (manager == null) return [];
    const items: AnyRecord[] = [];
    if (manager.selectPassword != null) items.push({ label: manager.selectPassword.label, click: () => executePasswordCommand(webContents, "select-password") });
    if (manager.suggestPassword != null) items.push({ label: manager.suggestPassword.label, click: () => executePasswordCommand(webContents, "suggest-password") });
    return items;
  }

  function executePasswordCommand(webContents: AnyRecord, command: string): void {
    if (!webContents.isDestroyed() && typeof webContents._executePasswordManagerContextMenuCommand === "function") {
      webContents._executePasswordManagerContextMenuCommand(command);
    }
  }

  function isPageNavigationContext(params: AnyRecord): boolean {
    return !params.isEditable && params.formControlType === "none" && params.mediaType === "none" &&
      params.linkURL.length === 0 && params.srcURL.length === 0 && params.selectionText.length === 0;
  }

  function showBrowserContextMenu(input: AnyRecord): void {
    const { canAttachImage, canReload, isAnnotationModeEnabled = true, isDefaultBrowser, snapshot, params, webContents, window } = input;
    const intl = dependencies.getIntl();
    const template: AnyRecord[] = [];
    if (isAnnotationModeEnabled && snapshot != null && canCommentOnSnapshot(snapshot)) {
      template.push(
        { label: intl.formatMessage({ messageId: messages.quickAnnotate, defaultMessage: "Quick annotate" }), click: () => { if (!webContents.isDestroyed()) input.onComment({ x: params.x, y: params.y }, shared.gu.QUICK, selectedText(params)); } },
        { label: intl.formatMessage({ messageId: messages.commentWithCodex, defaultMessage: "Annotate" }), click: () => { if (!webContents.isDestroyed()) input.onComment({ x: params.x, y: params.y }, shared.gu.BATCH, selectedText(params)); } },
        { type: "separator" },
      );
    }
    if (canAttachImage && dependencies.isImageContext(params)) {
      template.push(
        { label: intl.formatMessage({ messageId: messages.attachImage, defaultMessage: "Attach image to chat" }), click: () => { if (!webContents.isDestroyed()) input.onAttachImage(params.srcURL); } },
        { type: "separator" },
      );
    }
    const passwords = passwordItems(params, webContents);
    if (passwords.length > 0) template.push(...passwords, { type: "separator" });
    const hasLink = params.linkURL.length > 0;
    if (hasLink) {
      const previousLength = template.length;
      const isHttp = dependencies.isHttpUrl(params.linkURL);
      if (isHttp) template.push({ label: intl.formatMessage({ messageId: messages.openLinkInNewTab, defaultMessage: "Open link in new tab" }), click: () => input.onOpenInBrowser(params.linkURL) });
      if ((!isDefaultBrowser || !isHttp) && dependencies.canOpenExternalUrl(params.linkURL)) {
        template.push({ label: intl.formatMessage({ messageId: messages.openExternalBrowser, defaultMessage: "Open in external browser" }), click: () => input.onOpenExternal(params.linkURL) });
      }
      if (template.length > previousLength) template.push({ type: "separator" });
    }
    const editable = params.isEditable;
    const selection = selectedText(params);
    if (hasLink || editable || selection) {
      if (hasLink) template.push({ label: intl.formatMessage({ messageId: messages.copyLink, defaultMessage: "Copy link address" }), click: () => clipboard.writeText(params.linkURL) });
      if (editable) template.push({ role: "cut", enabled: params.editFlags.canCut });
      if (editable || selection) template.push({ role: "copy", enabled: params.editFlags.canCopy });
      if (editable) template.push({ role: "paste", enabled: params.editFlags.canPaste });
      template.push({ type: "separator" });
    }
    if (isPageNavigationContext(params)) {
      template.push(
        { label: intl.formatMessage({ messageId: messages.back, defaultMessage: "Back" }), enabled: webContents.canGoBack(), click: () => { if (!webContents.isDestroyed()) input.onBack(); } },
        { label: intl.formatMessage({ messageId: messages.forward, defaultMessage: "Forward" }), enabled: webContents.canGoForward(), click: () => { if (!webContents.isDestroyed()) input.onForward(); } },
        { label: intl.formatMessage({ messageId: messages.reload, defaultMessage: "Reload" }), enabled: canReload, click: () => { if (!webContents.isDestroyed()) input.onReload(); } },
        { type: "separator" },
      );
    }
    template.push({ label: intl.formatMessage({ messageId: messages.inspect, defaultMessage: "Inspect" }), click: () => { if (!webContents.isDestroyed()) input.onInspect({ x: params.x, y: params.y }); } });
    menu.buildFromTemplate(template).popup({ window });
  }

  return { canCommentOnSnapshot, showBrowserContextMenu };
}
