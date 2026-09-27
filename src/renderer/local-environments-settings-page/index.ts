import {
  I3 as getJsxRuntime,
  e6 as getReactRuntime,
  type JsxRuntime,
  type ReactRuntime,
} from "@rchunk/app-shared";
import {
  Gv as useSettingsHostSelection,
  i_n as useRouterLocation,
  o_n as useNavigate,
} from "@rchunk/app-initial";
import { t as LocalEnvironmentEditor } from "@rchunk/local-environment-editor";
import { t as Tabs } from "@rchunk/security-tabs";
import { t as ToolbarBreadcrumb } from "@rchunk/toolbar-breadcrumb";
import "@rchunk/allowed-domains-input";
import "@rchunk/app-primary";
import "@rchunk/create-dialog";
import "@rchunk/environment-configuration-fields";
import "@rchunk/local-environment-workflow-messages";
import "@rchunk/personal-vault-settings";
import "@rchunk/rolldown-runtime";
import "@rchunk/settings-row-disclosure";
import "@rchunk/validation-message";

const routeRoot = "/settings/local-environments";

interface LocalEnvironmentSummary {
  configPath: string | null;
  name: string;
  workspaceRoot: string;
}

interface EditorState {
  configPath: string | null;
  mode: "create" | "edit";
  name: string;
  workspaceRoot: string;
}

let React: ReactRuntime;
let jsx: JsxRuntime;

function locationTabs(selected: "cloud" | "local", navigate: (path: string) => void): unknown {
  return Tabs({
    ariaLabel: "Environment location",
    selectedKey: selected,
    onSelect: (key) =>
      navigate(key === "local" ? `${routeRoot}?tab=local` : routeRoot),
    tabs: [
      { key: "cloud", name: "Cloud" },
      { key: "local", name: "Local" },
    ],
    variant: "page",
  });
}

function LocalCatalog(props: {
  hostId: string;
  locationTabs?: unknown;
}): unknown {
  const [environments, setEnvironments] = React.useState<LocalEnvironmentSummary[]>([]);
  const [editor, setEditor] = React.useState<EditorState | null>(null);
  if (editor != null) {
    return jsx.jsxs("main", {
      className: "local-environments-settings-page",
      "data-host-id": props.hostId,
      children: [
        ToolbarBreadcrumb({
          ancestors: [
            {
              id: "environments",
              label: "Environments",
              onClick: () => setEditor(null),
            },
          ],
          current: editor.mode === "create" ? "Create" : editor.name,
        }),
        LocalEnvironmentEditor({
          configPath: editor.configPath,
          defaultName: editor.name,
          hostId: props.hostId,
          workspaceRoot: editor.workspaceRoot,
          onCancel: () => setEditor(null),
          onSaved: (result: { configPath?: string }) => {
            const next = {
              configPath: result.configPath ?? editor.configPath,
              name: editor.name,
              workspaceRoot: editor.workspaceRoot,
            };
            setEnvironments([
              ...environments.filter(
                (environment) => environment.workspaceRoot !== next.workspaceRoot,
              ),
              next,
            ]);
            setEditor(null);
          },
        }),
      ],
    });
  }
  return jsx.jsxs("main", {
    className: "local-environments-settings-page",
    "data-host-id": props.hostId,
    children: [
      props.locationTabs ?? null,
      jsx.jsxs("header", {
        children: [
          jsx.jsx("h1", { children: "Local environments" }),
          jsx.jsx("button", {
            type: "button",
            onClick: () =>
              setEditor({
                configPath: null,
                mode: "create",
                name: "New environment",
                workspaceRoot: "",
              }),
            children: "Create environment",
          }),
        ],
      }),
      environments.length === 0
        ? jsx.jsx("p", {
            children:
              "Create an environment to define setup scripts and reusable actions for a workspace.",
          })
        : jsx.jsx("ul", {
            children: environments.map((environment) =>
              jsx.jsx(
                "li",
                {
                  children: jsx.jsx("button", {
                    type: "button",
                    onClick: () =>
                      setEditor({ ...environment, mode: "edit" }),
                    children: environment.name,
                  }),
                },
                environment.configPath ?? environment.workspaceRoot,
              ),
            ),
          }),
    ],
  });
}

function LocalHostSettings(props: { hostId: string }): unknown {
  const location = useRouterLocation();
  const navigate = useNavigate();
  const parameters = new URLSearchParams(location.search);
  const selectedTab = parameters.get("tab");
  const personalVault = parameters.get("view") === "personal-vault";
  if (personalVault) {
    return jsx.jsxs("main", {
      children: [
        jsx.jsx("button", {
          type: "button",
          onClick: () => navigate(routeRoot),
          children: "Back",
        }),
        jsx.jsx("h1", { children: "Personal vault" }),
        jsx.jsx("p", {
          children: "Manage reusable secrets for local environments.",
        }),
      ],
    });
  }
  if (selectedTab === "local" || location.pathname !== routeRoot) {
    return jsx.jsx(LocalCatalog, {
      hostId: props.hostId,
      locationTabs: locationTabs("local", navigate),
    });
  }
  return jsx.jsxs("main", {
    className: "environment-location-catalog",
    children: [
      locationTabs("cloud", navigate),
      jsx.jsx("h1", { children: "Environments" }),
      jsx.jsx("p", {
        children:
          "Choose Cloud for reusable hosted environments or Local for workspace configuration files.",
      }),
      jsx.jsx("button", {
        type: "button",
        onClick: () => navigate(`${routeRoot}?tab=local`),
        children: "Browse local environments",
      }),
    ],
  });
}

function LocalEnvironmentsSettings(): unknown {
  const location = useRouterLocation();
  const { selectedHostId } = useSettingsHostSelection();
  if (selectedHostId === "local")
    return jsx.jsx(LocalHostSettings, { hostId: selectedHostId });
  return jsx.jsx(
    LocalCatalog,
    { hostId: selectedHostId },
    `${selectedHostId}:${location.key}`,
  );
}

function initializeLocalEnvironmentsSettings(): void {
  React = getReactRuntime();
  jsx = getJsxRuntime();
}

initializeLocalEnvironmentsSettings();

export { LocalEnvironmentsSettings };
