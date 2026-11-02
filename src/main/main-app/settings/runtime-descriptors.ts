type SettingDescriptor<T> = {
  agentAccess: "hidden" | "read-only" | "read-write";
  default: T;
  description: string;
  key: string;
  hostStorage: { kind: "configuration" | "global-state" | "persisted-atom"; key: string };
};

function descriptor<T>(key: string, defaultValue: T, description: string, hostStorage: SettingDescriptor<T>["hostStorage"]["kind"], agentAccess: SettingDescriptor<T>["agentAccess"] = "hidden"): SettingDescriptor<T> {
  return { agentAccess, default: defaultValue, description, key, hostStorage: { kind: hostStorage, key } };
}

export const ambientSuggestionSettings = {
  enabled: descriptor("ambient-suggestions-enabled", true, "Whether home-page ambient suggestions are enabled", "global-state", "read-write"),
};

export const browserRuntimeSettings = {
  annotationMarkersVisible: descriptor("browser-annotation-markers-visible", true, "Whether saved annotations show markers on browser pages", "persisted-atom"),
  extensionsToolbarVisible: descriptor("browser-extensions-toolbar-visible", true, "Whether the extensions puzzle button is pinned to the browser toolbar", "persisted-atom"),
  showFullUrl: descriptor("browser-show-full-url", false, "Whether the in-app browser address bar shows the full URL", "persisted-atom"),
  annotationScreenshotsMode: descriptor("browser-annotation-screenshots-mode", "always", "When browser annotation screenshots are included", "global-state", "read-write"),
  disabledSiteAnnotationHostnames: descriptor("browser-disabled-site-annotation-hostnames", [] as string[], "Hostnames where custom site annotation features are disabled", "persisted-atom"),
  siteAnnotationPermissionAnsweredHostnames: descriptor("browser-site-annotation-permission-answered-hostnames", [] as string[], "Hostnames whose site annotation permission prompt the user answered", "persisted-atom"),
  debugChromePagesEnabled: descriptor("debug-chrome-pages-enabled", false, "Whether Browser Use may open trusted chrome:// diagnostic pages", "global-state"),
  downloadDirectory: descriptor<string | null>("browser-download-directory", null, "Folder where files downloaded by the in-app browser are saved", "global-state"),
  promptForDownloadLocation: descriptor("browser-download-prompt-enabled", false, "Whether manual browser downloads ask where to save each file", "global-state"),
};

export const appshotSettings = {
  destination: descriptor("appshotDestination", "automatic", "Where global shortcut appshots are attached", "configuration", "read-write"),
  soundEnabled: descriptor("appshotSoundEnabled", true, "Whether appshots play a sound effect", "configuration", "read-write"),
};

export const computerUseSettings = {
  alwaysHidePictureInPicture: descriptor("computerUseAlwaysHidePictureInPicture", false, "Whether Computer Use picture in picture is always hidden", "configuration"),
};
