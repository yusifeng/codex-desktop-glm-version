import "@rchunk/rolldown-runtime";
import { I3 as getJsxRuntime, e6 as getReactRuntime } from "@rchunk/app-shared";
import { cJt as initializeApiClient } from "@rchunk/app-initial";
import { n as initializeSettingsLoadingRow, t as SettingsLoadingRow } from "@rchunk/settings-loading-row";

type TurnNotificationMode = "off" | "unfocused" | "always";
interface NotificationSettings {
  permissionsEnabled: boolean;
  questionsEnabled: boolean;
  sound?: string;
  turnMode: TurnNotificationMode;
}
interface ChatGptNotificationSettingsProps {
  loading?: boolean;
  onChange?(settings: NotificationSettings): void;
  settings?: Partial<NotificationSettings>;
  soundOptions?: readonly string[];
}
interface NotificationsSettingsPageProps extends ChatGptNotificationSettingsProps { available?: boolean }

const jsx = getJsxRuntime();
const React = getReactRuntime();
const DEFAULT_SETTINGS: NotificationSettings = {
  permissionsEnabled: true,
  questionsEnabled: true,
  turnMode: "unfocused",
  sound: "default",
};

function ChatGptNotificationSettings({ loading = false, onChange, settings, soundOptions = ["default", "classic", "none"] }: ChatGptNotificationSettingsProps): unknown {
  const [current, setCurrent] = React.useState<NotificationSettings>({ ...DEFAULT_SETTINGS, ...settings });
  const update = <Key extends keyof NotificationSettings>(key: Key, value: NotificationSettings[Key]) => {
    setCurrent(previous => {
      const next = { ...previous, [key]: value };
      onChange?.(next);
      return next;
    });
  };
  if (loading) return jsx.jsx(SettingsLoadingRow, { children: "Loading notification settings…" });
  return jsx.jsxs("div", { id: "chatgpt-notification-settings", children: [
    jsx.jsxs("label", { children: ["Turn completion notifications", jsx.jsxs("select", {
      "aria-label": "Turn completion notifications",
      value: current.turnMode,
      onChange: (event: { currentTarget: { value: string } }) => update("turnMode", event.currentTarget.value as TurnNotificationMode),
      children: [
        jsx.jsx("option", { value: "off", children: "Never" }),
        jsx.jsx("option", { value: "unfocused", children: "Only when unfocused" }),
        jsx.jsx("option", { value: "always", children: "Always" }),
      ],
    })] }),
    jsx.jsxs("label", { children: [jsx.jsx("input", { type: "checkbox", checked: current.permissionsEnabled, onChange: (event: { currentTarget: { checked: boolean } }) => update("permissionsEnabled", event.currentTarget.checked) }), "Notify when permissions are required"] }),
    jsx.jsxs("label", { children: [jsx.jsx("input", { type: "checkbox", checked: current.questionsEnabled, onChange: (event: { currentTarget: { checked: boolean } }) => update("questionsEnabled", event.currentTarget.checked) }), "Notify when input is needed"] }),
    soundOptions.length > 0 ? jsx.jsxs("label", { children: ["Notification sound", jsx.jsx("select", { "aria-label": "Notification sound", value: current.sound, onChange: (event: { currentTarget: { value: string } }) => update("sound", event.currentTarget.value), children: soundOptions.map(sound => jsx.jsx("option", { value: sound, children: sound }, sound)) })] }) : null,
  ] });
}

function NotificationsSettingsPage({ available = true, ...props }: NotificationsSettingsPageProps = {}): unknown {
  return jsx.jsxs("main", { "aria-label": "Notifications settings", children: [
    jsx.jsx("h1", { children: "Notifications" }),
    available ? jsx.jsxs("section", { children: [jsx.jsx("h2", { children: "ChatGPT" }), jsx.jsx(ChatGptNotificationSettings, props)] }) : null,
  ] });
}

function initializeNotificationsSettings(): void {
  initializeApiClient();
  initializeSettingsLoadingRow();
}

export { NotificationsSettingsPage as n, initializeNotificationsSettings as r, ChatGptNotificationSettings as t };
