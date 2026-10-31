// @ts-nocheck

const SOUND_NAMES = { default: "codex-notification", classic: "codex-classic" };
const NOTIFICATION_GROUP_ID = "2DC432GLL2.com.openai.codex.notifications";
const MAX_DEDUPLICATION_IDS = 1_000;

export function createNotificationSoundHelpers(dependencies: Record<string, any>) {
  const { electron, fs, os, path, process: processRuntime } = dependencies;
  const resolveMacBuiltinSound = (sound: "default" | "classic") => {
    const filename = `${SOUND_NAMES[sound]}.wav`;
    if (typeof processRuntime.resourcesPath === "string") {
      const resourcePath = path.join(processRuntime.resourcesPath, filename);
      if (fs.existsSync(resourcePath)) return resourcePath;
    }
    return path.join(electron.app.getAppPath(), "assets", "sounds", filename);
  };
  const resolveSoundCommand = (sound: "default" | "classic", platform: string) => {
    const soundPath = resolveMacBuiltinSound(sound);
    if (platform === "linux") {
      return { command: "/usr/bin/canberra-gtk-play", args: ["-f", soundPath] };
    }
    if (platform === "win32") {
      const script = `[System.Media.SoundPlayer]::new('${soundPath.replaceAll("'", "''")}').PlaySync()`;
      return {
        command: "powershell.exe",
        args: [
          "-NoLogo",
          "-NoProfile",
          "-NonInteractive",
          "-EncodedCommand",
          Buffer.from(script, "utf16le").toString("base64"),
        ],
      };
    }
  };
  const getCustomSoundDirectory = (homeDirectory = os.homedir()) =>
    path.join(
      homeDirectory,
      "Library",
      "Group Containers",
      NOTIFICATION_GROUP_ID,
      "Library",
      "Sounds",
    );
  return { resolveMacBuiltinSound, resolveSoundCommand, getCustomSoundDirectory };
}

/** Owns native desktop notification presentation, actions, sound, and dismissal state. */
export function createNativeNotificationManagerClass(dependencies: Record<string, any>) {
  const {
    createLogger,
    electron,
    fs,
    fsPromises,
    os,
    path,
    process: processRuntime,
    sanitizeText,
    spawn,
  } = dependencies;

  const { resolveMacBuiltinSound, resolveSoundCommand, getCustomSoundDirectory } =
    createNotificationSoundHelpers({ electron, fs, os, path, process: processRuntime });

  return class NativeNotificationManager {
    options;
    isSupported;
    createNotification;
    logger = createLogger("desktop-notifications");
    notificationSoundStaging = new Map();
    notificationSoundPlayer;
    deliveredNotificationIds = new Set();
    notifications = new Map();

    constructor(options: Record<string, any>) {
      this.options = options;
      this.isSupported = options.isSupported ?? (() => electron.Notification.isSupported());
      this.createNotification =
        options.createNotification ??
        ((notificationOptions: any) => {
          const notification = new electron.Notification(notificationOptions);
          return {
            show: () => notification.show(),
            on: (event: string, listener: (...args: any[]) => void) => {
              if (event === "action") {
                return notification.on("action", (nativeEvent: unknown, index: number) => {
                  listener(nativeEvent, index);
                });
              }
              if (event === "reply") {
                return notification.on("reply", (nativeEvent: unknown, reply: unknown) => {
                  listener(nativeEvent, reply);
                });
              }
              return notification.on(event, () => listener(undefined));
            },
            close: () => notification.close(),
          };
        });
    }

    showNotification(notification: any, target: any, handleAction: any, onRemoved?: () => void) {
      if (!this.isSupported()) {
        this.logger.warning("Notification API not supported on this host");
        onRemoved?.();
        return;
      }
      if (target.isDestroyed()) {
        this.logger.warning("target webContents destroyed; dropping notification", {
          safe: {},
          sensitive: { notificationId: notification.id },
        });
        onRemoved?.();
        return;
      }
      if (notification.deduplicate) {
        if (this.deliveredNotificationIds.has(notification.id)) {
          onRemoved?.();
          return;
        }
        this.deliveredNotificationIds.add(notification.id);
        if (this.deliveredNotificationIds.size > MAX_DEDUPLICATION_IDS) {
          const oldestId = this.deliveredNotificationIds.values().next().value;
          if (oldestId != null) this.deliveredNotificationIds.delete(oldestId);
        }
      }
      const actions = (notification.actions ?? []).slice(0, 4);
      this.logger.info("show notification", {
        safe: { kind: notification.kind, actionCount: actions.length },
        sensitive: { notificationId: notification.id },
      });
      const timeoutType =
        notification.kind === "permission" || notification.kind === "question"
          ? "never"
          : undefined;
      const hasReply =
        notification.kind === "turn-complete" &&
        typeof notification.replyPlaceholder === "string";
      const previous = this.notifications.get(notification.id);
      if (previous != null) {
        this.removeNotification(notification.id);
        previous.notification.close?.();
      }
      const title = notification.title;
      const selectedSound = this.options.getSound?.() ?? "default";
      let nativeSound = SOUND_NAMES.default;
      if (typeof selectedSound === "object") nativeSound = selectedSound.fileName;
      else if (selectedSound === "classic") nativeSound = SOUND_NAMES.classic;
      else if (selectedSound !== "default" && selectedSound !== "none") {
        nativeSound = selectedSound;
      }
      const nativeNotification = this.createNotification({
        title,
        body: sanitizeText(notification.body),
        silent: selectedSound === "none" || this.options.platform !== "darwin",
        sound: this.options.platform === "darwin" ? nativeSound : undefined,
        timeoutType,
        hasReply,
        replyPlaceholder: hasReply ? notification.replyPlaceholder : undefined,
        actions: actions.map((action: any) => ({ type: "button", text: action.title })),
      });
      nativeNotification.on("click", () => {
        const destination = handleAction({
          notificationId: notification.id,
          actionId: null,
          actionType: "open",
        });
        if (destination != null) {
          this.options.onAppEntrySource?.(
            { channel: "push_notification", source: "native_notification" },
            destination,
          );
        }
        this.logger.info("notification click open", {
          safe: {},
          sensitive: { notificationId: notification.id },
        });
      });
      nativeNotification.on("action", (_event: unknown, index: number | undefined) => {
        const action = actions[index ?? -1];
        if (action == null) return;
        this.logger.info("notification action", {
          safe: { actionId: action.id, actionType: action.actionType },
          sensitive: { notificationId: notification.id },
        });
        handleAction({
          notificationId: notification.id,
          actionId: action.id,
          actionType: action.actionType,
        });
      });
      nativeNotification.on("reply", (_event: unknown, reply: unknown) => {
        handleAction({
          notificationId: notification.id,
          actionId: null,
          actionType: "reply",
          reply:
            typeof reply === "string"
              ? reply
              : reply == null
                ? ""
                : (JSON.stringify(reply) ?? ""),
        });
      });
      nativeNotification.on("close", () => {
        if (this.notifications.get(notification.id)?.notification === nativeNotification) {
          this.removeNotification(notification.id);
        }
      });
      nativeNotification.on("failed", () => {
        if (this.notifications.get(notification.id)?.notification === nativeNotification) {
          this.removeNotification(notification.id);
        }
      });
      this.notifications.set(notification.id, {
        notification: nativeNotification,
        conversationId: notification.conversationId ?? null,
        navigationPath: notification.navigationPath ?? null,
        completedThread:
          notification.kind === "turn-complete" && notification.navigationPath != null
            ? {
                title,
                path: notification.navigationPath,
                projectLabel: "",
                isProjectless: false,
              }
            : null,
        onNotificationRemoved: onRemoved,
      });
      this.emitCompletedThreadsChanged();
      const present = () => {
        nativeNotification.show();
        if (this.options.platform !== "darwin" && selectedSound !== "none") {
          this.playBundledNotificationSound(
            selectedSound === "classic" ? "classic" : "default",
          );
        }
      };
      const staging =
        selectedSound === "default" || selectedSound === "classic"
          ? this.stageNotificationSoundIfNeeded(selectedSound)
          : undefined;
      if (staging == null) present();
      else {
        staging.then(() => {
          if (this.notifications.get(notification.id)?.notification !== nativeNotification) return;
          if (target.isDestroyed()) {
            this.removeNotification(notification.id);
            return;
          }
          present();
        });
      }
    }

    playBundledNotificationSound(sound: "default" | "classic") {
      if (this.notificationSoundPlayer != null) return;
      const command = resolveSoundCommand(sound, this.options.platform);
      if (command == null) return;
      const player = spawn(command.command, command.args, { stdio: "ignore", windowsHide: true });
      this.notificationSoundPlayer = player;
      const clearPlayer = () => {
        if (this.notificationSoundPlayer === player) this.notificationSoundPlayer = undefined;
      };
      player.once("error", (error: unknown) => {
        clearPlayer();
        this.logger.warning("failed to play notification sound", {
          safe: {},
          sensitive: { error },
        });
      });
      player.once("close", clearPlayer);
    }

    stageNotificationSoundIfNeeded(sound: "default" | "classic") {
      if (
        this.options.platform !== "darwin" ||
        typeof processRuntime.resourcesPath !== "string"
      ) {
        return;
      }
      const existing = this.notificationSoundStaging.get(sound);
      if (existing != null) return existing;
      const destinationDirectory = getCustomSoundDirectory(os.homedir());
      const sourcePath = resolveMacBuiltinSound(sound);
      if (!fs.existsSync(sourcePath)) return;
      const staging = fsPromises
        .mkdir(destinationDirectory, { recursive: true })
        .then(async () => {
          const temporaryDirectory = await fsPromises.mkdtemp(
            path.join(destinationDirectory, ".codex-bundled-"),
          );
          try {
            const temporaryPath = path.join(temporaryDirectory, path.basename(sourcePath));
            await fsPromises.copyFile(sourcePath, temporaryPath, fs.constants.COPYFILE_EXCL);
            await fsPromises.rename(
              temporaryPath,
              path.join(destinationDirectory, path.basename(sourcePath)),
            );
          } finally {
            await fsPromises.rm(temporaryDirectory, { recursive: true, force: true });
          }
        })
        .catch((error: unknown) => {
          this.logger.warning("failed to stage notification sound", {
            safe: {},
            sensitive: { error },
          });
        });
      this.notificationSoundStaging.set(sound, staging);
      return staging;
    }

    dismissByConversationId(conversationId: string) {
      for (const [id, entry] of this.notifications.entries()) {
        if (entry.conversationId === conversationId) {
          entry.notification.close?.();
          this.removeNotification(id);
        }
      }
    }
    dismissByNotificationId(id: string) {
      this.notifications.get(id)?.notification.close?.();
      this.removeNotification(id);
    }
    dismissByNavigationPath(navigationPath: string) {
      for (const [id, entry] of this.notifications.entries()) {
        if (entry.navigationPath === navigationPath) {
          entry.notification.close?.();
          this.removeNotification(id);
        }
      }
    }
    removeNotification(id: string) {
      const entry = this.notifications.get(id);
      if (entry == null) return;
      this.notifications.delete(id);
      entry.onNotificationRemoved?.();
      this.emitCompletedThreadsChanged();
    }
    emitCompletedThreadsChanged() {
      if (this.options.onCompletedThreadsChanged == null) return;
      const seenPaths = new Set();
      const completedThreads = [];
      for (const entry of [...this.notifications.values()].reverse()) {
        if (entry.completedThread == null || seenPaths.has(entry.completedThread.path)) continue;
        seenPaths.add(entry.completedThread.path);
        completedThreads.push(entry.completedThread);
      }
      this.options.onCompletedThreadsChanged(completedThreads);
    }
  };
}

if (typeof module !== "undefined") {
  module.exports = { createNativeNotificationManagerClass, createNotificationSoundHelpers };
}
