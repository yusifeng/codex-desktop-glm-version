export type WorkspacePolicyRestartDialogOptions = {
  getIntl: () => { formatMessage: (descriptor: { messageId: string; defaultMessage: string; values?: Record<string, string> }) => string };
  getAppName: () => string;
  showMessageBoxSync: (options: {
    type: `info`;
    message: string;
    detail: string;
    buttons: [string];
    defaultId: 0;
    cancelId: 0;
    noLink: true;
  }) => unknown;
  markQuitApproved: () => void;
  quit: () => void;
  onError?: (error: unknown) => void;
};

const RESTART_MESSAGES = {
  title: {
    messageId: `desktop.workspacePolicyRestart.title`,
    defaultMessage: `Restart to apply workspace settings`,
  },
  detail: {
    messageId: `desktop.workspacePolicyRestart.detail`,
    defaultMessage: `Restart {appName} to apply your workspace settings. Active local chats will be interrupted`,
  },
  restart: { messageId: `desktop.workspacePolicyRestart.restart`, defaultMessage: `Restart` },
};

export function showWorkspacePolicyRestartDialog(options: WorkspacePolicyRestartDialogOptions) {
  try {
    const intl = options.getIntl();
    options.showMessageBoxSync({
      type: `info`,
      message: intl.formatMessage(RESTART_MESSAGES.title),
      detail: intl.formatMessage({ ...RESTART_MESSAGES.detail, values: { appName: options.getAppName() } }),
      buttons: [intl.formatMessage(RESTART_MESSAGES.restart)],
      defaultId: 0,
      cancelId: 0,
      noLink: true,
    });
  } catch (error) {
    options.onError?.(error);
  }
  options.markQuitApproved();
  options.quit();
}

if (typeof module !== `undefined`) module.exports = { showWorkspacePolicyRestartDialog };
