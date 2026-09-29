import "@rchunk/rolldown-runtime";
import {
  $3 as initializeSharedRuntime,
  HX as useSignalValue,
  I3 as getJsxRuntime,
  K2 as initializeUiRuntime,
  Y2 as FormattedMessage,
  Yh as Button,
  e6 as getReactRuntime,
  type JsxRuntime,
} from "@rchunk/app-shared";
// @ts-expect-error The compressed plugin-installation state surface is registered centrally.
import { S2t as usePluginInstallationController, g2t as initializePluginInstallationState, v2t as pluginInstallationSessionSignal } from "@rchunk/app-initial";
import "@rchunk/app-primary";
import "@rchunk/app-card";
import "@rchunk/app-connect-link-navigation";
import "@rchunk/app-connect-modal";
import "@rchunk/app-connect-availability";
import "@rchunk/browser-extension-status-description";
import "@rchunk/browser-extension-setup-messages";
import "@rchunk/computer-use-app-approvals-query";
import "@rchunk/find-plugin-mcp-extension-view";
import "@rchunk/first-app-connect-ambient-suggestions";
import "@rchunk/plugin-disabled-reason";
import "@rchunk/profile-lock";
import "@rchunk/requested-plugin-connection";

interface ReactHooks {
  useCallback<Callback extends (...parameters: never[]) => unknown>(
    callback: Callback,
    dependencies: readonly unknown[],
  ): Callback;
}

interface PluginSummary {
  description?: string | null;
  id: string;
  name: string;
}

interface PluginDescriptor {
  interface?: { defaultPrompt?: string | null };
  plugin: PluginSummary;
}

interface RequiredApp {
  appId: string;
  description?: string | null;
  installUrl?: string | null;
  logoUrl?: string | null;
  name: string;
  status: "connected" | "pending" | "waitingForCallback" | string;
}

interface RequiredBrowserExtension {
  browserFamily: string;
  isInstalled?: boolean;
  name?: string;
}

type PluginInstallSession =
  | { kind: "closed" }
  | { kind: "loadingPlugin" }
  | { kind: "reviewIncentive"; requestId: string; title?: string }
  | { kind: "details"; activeProject?: unknown; plugin: PluginDescriptor; postInstallComposerPrefill?: string }
  | { kind: "installing" | "preparingApp"; plugin: PluginDescriptor }
  | { kind: "error"; message?: string; plugin?: PluginDescriptor }
  | {
      activeProject?: unknown;
      kind: "needsApps";
      plugin: PluginDescriptor;
      requiredApps: RequiredApp[];
      requiredBrowserExtensions: RequiredBrowserExtension[];
    }
  | {
      activeProject?: unknown;
      app: RequiredApp;
      kind: "connectApp";
      plugin: PluginDescriptor;
      requiredBrowserExtensions?: RequiredBrowserExtension[];
    };

interface PluginInstallationController {
  closePluginInstall(): void;
  connectRequiredApp?(app: RequiredApp): void | Promise<void>;
  installPlugin?(plugin: PluginDescriptor): void | Promise<void>;
  isInstalling?: boolean;
  openPluginInstallDetails?(plugin: PluginDescriptor): void;
  retryPluginInstall?(): void | Promise<void>;
  session?: PluginInstallSession;
  tryPluginInChat?(plugin: PluginDescriptor, prompt?: string): void;
}

let jsx: JsxRuntime;
let react: ReactHooks;
let initialized = false;

function message(id: string, defaultMessage: string): unknown {
  return jsx.jsx(FormattedMessage, { id, defaultMessage });
}

function pluginName(plugin: PluginDescriptor): string {
  return plugin.plugin.name || plugin.plugin.id;
}

function PluginHeader({ plugin }: { plugin: PluginDescriptor }): unknown {
  return jsx.jsxs("header", {
    className: "flex flex-col gap-1",
    children: [
      jsx.jsx("h2", { className: "text-lg font-semibold", children: pluginName(plugin) }),
      plugin.plugin.description == null
        ? null
        : jsx.jsx("p", { className: "text-sm text-secondary", children: plugin.plugin.description }),
    ],
  });
}

function RequiredAppRow({
  app,
  disabled,
  onConnect,
}: {
  app: RequiredApp;
  disabled: boolean;
  onConnect(app: RequiredApp): void;
}): unknown {
  const connected = app.status === "connected";
  const waiting = app.status === "waitingForCallback";
  return jsx.jsxs("li", {
    className: "flex items-center justify-between gap-3 rounded-lg border border-default p-3",
    "data-app-id": app.appId,
    children: [
      jsx.jsxs("div", {
        className: "min-w-0",
        children: [
          jsx.jsx("div", { className: "font-medium", children: app.name }),
          app.description == null ? null : jsx.jsx("div", { className: "text-sm text-secondary", children: app.description }),
        ],
      }),
      connected
        ? jsx.jsx("span", { className: "text-sm text-success", children: message("plugins.install.connected", "Connected") })
        : jsx.jsx(Button, {
            color: "secondary",
            disabled,
            loading: waiting,
            onClick: () => onConnect(app),
            children: waiting
              ? message("plugins.install.waitingForConnection", "Waiting…")
              : message("plugins.install.connect", "Connect"),
          }),
    ],
  });
}

function InstallationPanel({
  controller,
  session,
}: {
  controller: PluginInstallationController;
  session: Exclude<PluginInstallSession, { kind: "closed" | "loadingPlugin" | "reviewIncentive" }>;
}): unknown {
  const plugin = session.plugin;
  const apps = session.kind === "needsApps" ? session.requiredApps : session.kind === "connectApp" ? [session.app] : [];
  const extensions =
    session.kind === "needsApps"
      ? session.requiredBrowserExtensions
      : session.kind === "connectApp"
        ? session.requiredBrowserExtensions ?? []
        : [];
  const requirementsReady =
    apps.every((app) => app.status === "connected") &&
    extensions.every((extension) => extension.isInstalled === true);
  const busy = controller.isInstalling === true || session.kind === "installing" || session.kind === "preparingApp";
  const onConnect = react.useCallback(
    (app: RequiredApp) => { void controller.connectRequiredApp?.(app); },
    [controller],
  );
  const onInstall = react.useCallback(
    () => { void controller.installPlugin?.(plugin); },
    [controller, plugin],
  );
  const onTryInChat = react.useCallback(
    () => controller.tryPluginInChat?.(plugin, plugin.interface?.defaultPrompt ?? undefined),
    [controller, plugin],
  );

  if (session.kind === "error") {
    return jsx.jsxs("section", {
      role: "alert",
      className: "flex flex-col gap-4 p-6",
      children: [
        jsx.jsx(PluginHeader, { plugin }),
        jsx.jsx("p", { children: session.message ?? "Plugin installation failed" }),
        jsx.jsxs("div", { className: "flex gap-2", children: [
          jsx.jsx(Button, { color: "primary", onClick: controller.retryPluginInstall, children: message("plugins.install.retry", "Try again") }),
          jsx.jsx(Button, { color: "ghost", onClick: controller.closePluginInstall, children: message("plugins.install.close", "Close") }),
        ] }),
      ],
    });
  }

  return jsx.jsxs("section", {
    className: "flex flex-col gap-5 p-6",
    "data-session-kind": session.kind,
    children: [
      jsx.jsx(PluginHeader, { plugin }),
      apps.length === 0
        ? null
        : jsx.jsxs("div", { children: [
            jsx.jsx("h3", { className: "mb-2 font-medium", children: message("plugins.install.requiredApps", "Connect required apps") }),
            jsx.jsx("ul", { className: "flex flex-col gap-2", children: apps.map((app) => jsx.jsx(RequiredAppRow, { app, disabled: busy, onConnect }, app.appId)) }),
          ] }),
      extensions.length === 0
        ? null
        : jsx.jsx("ul", {
            className: "flex flex-col gap-2",
            children: extensions.map((extension) => jsx.jsxs("li", {
              "data-browser-family": extension.browserFamily,
              children: [extension.name ?? extension.browserFamily, extension.isInstalled === true ? " — Installed" : " — Required"],
            }, extension.browserFamily)),
          }),
      jsx.jsxs("div", { className: "flex flex-wrap justify-end gap-2", children: [
        jsx.jsx(Button, { color: "ghost", onClick: controller.closePluginInstall, children: message("plugins.install.cancel", "Cancel") }),
        session.kind === "details"
          ? jsx.jsx(Button, { color: "ghostSecondary", onClick: () => controller.openPluginInstallDetails?.(plugin), children: message("plugins.install.viewDetails", "View details") })
          : null,
        session.kind === "details"
          ? jsx.jsx(Button, { color: "secondary", onClick: onTryInChat, children: message("plugins.install.tryInChat", "Try in chat") })
          : null,
        jsx.jsx(Button, {
          color: "primary",
          disabled: busy || ((session.kind === "needsApps" || session.kind === "connectApp") && !requirementsReady),
          loading: busy,
          onClick: onInstall,
          children: busy ? message("plugins.install.installing", "Installing…") : message("plugins.install.install", "Install"),
        }),
      ] }),
    ],
  });
}

function PluginInstallationContent(): unknown {
  const signalSession = useSignalValue(pluginInstallationSessionSignal) as unknown as PluginInstallSession;
  const controller = usePluginInstallationController() as unknown as PluginInstallationController;
  const session = controller.session ?? signalSession;
  if (session.kind === "closed") return null;
  if (session.kind === "loadingPlugin") {
    return jsx.jsx("div", { role: "status", "aria-live": "polite", className: "p-6", children: message("plugins.install.loading", "Loading plugin…") });
  }
  const incentive =
    session.kind === "reviewIncentive"
      ? jsx.jsxs("section", { className: "p-6", "data-request-id": session.requestId, children: [
          jsx.jsx("h2", { children: session.title ?? "Review this plugin offer" }),
          jsx.jsx(Button, { color: "ghost", onClick: controller.closePluginInstall, children: message("plugins.install.close", "Close") }),
        ] })
      : null;
  return jsx.jsxs(jsx.Fragment, {
    children: [
      incentive,
      session.kind === "reviewIncentive" ? null : jsx.jsx(InstallationPanel, { controller, session }),
    ],
  });
}

function initializePluginInstallationContent(): void {
  if (initialized) return;
  initialized = true;
  initializeSharedRuntime();
  initializeUiRuntime();
  initializePluginInstallationState();
  jsx = getJsxRuntime();
  react = getReactRuntime() as unknown as ReactHooks;
}

initializePluginInstallationContent();

export { PluginInstallationContent };
