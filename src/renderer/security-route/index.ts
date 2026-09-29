// security-route —— Codex Security 插件门禁、扫描、发现与仓库工作台。

import "@rchunk/rolldown-runtime";
import * as appSharedChunk from "@rchunk/app-shared";
import * as appInitialChunk from "@rchunk/app-initial";
import "@rchunk/app-primary";
import "@rchunk/tabs";
import "@rchunk/filter-alt";
import "@rchunk/model-and-reasoning-effort-translations";
import "@rchunk/commit";
import "@rchunk/useForm";
import "@rchunk/conversation-blocks";
import "@rchunk/local-conversation-turn";
import "@rchunk/use-resume-conversation-if-needed";
import "@rchunk/bar-chart";
import "@rchunk/detail-page";
import "@rchunk/plus-sm";
import "@rchunk/detail-section-state";
import "@rchunk/filter-alt-badged";
import "@rchunk/settings-host-dropdown";
import "@rchunk/settings-row-disclosure";
import type { JsxRuntime, ReactRuntime } from "@rchunk/app-shared";

type Availability =
  | "disabled-by-admin"
  | "gate-disabled"
  | "host-disconnected"
  | "loading"
  | "plugin-unavailable"
  | "ready"
  | "remote-host";

interface MatchResult {
  params: Record<string, string>;
}

interface SecurityScan {
  findingCount: number;
  mode: "deep" | "diff" | "full";
  progress: { status: string };
  scanId: string;
  targetPath: string;
  updatedAt?: string;
}

interface SecurityFinding {
  occurrenceId: string;
  severity: string;
  status: string;
  title: string;
}

interface SecurityRepository {
  displayName: string;
  openFindingsCount: number;
  targetId: string;
  targetPath: string;
}

interface ToolResult {
  isError?: boolean;
  structuredContent?: Record<string, unknown>;
}

interface SharedRuntime {
  $3(): void;
  I3(): JsxRuntime;
  LX(scope: unknown): unknown;
  ZI: unknown;
  e6: (() => ReactRuntime) & ReactRuntime;
}

interface InitialRuntime {
  Rdt(
    scope: unknown,
    hostId: string,
    server: string,
    tool: string,
    args: Record<string, unknown>,
  ): Promise<ToolResult>;
  _N(): boolean;
  a_n(pattern: string): MatchResult | null;
  b6t(options: { enabled: boolean; hostId: string }): boolean;
  c4t(options: {
    enabled: boolean;
    hostId: string;
    resolveActiveRoots: boolean;
    roots: undefined;
  }): { data: unknown; isLoading: boolean };
  ev(options: {
    installedPlugins: unknown;
    isGateEnabled: boolean;
    isLoading: boolean;
    isRemoteHost: boolean;
  }): Availability;
  nv: string;
  o_n(): (path: string) => void;
  ofn(gate: string): boolean;
  ugn: string;
}

const {
  $3: initializeRuntimeLazy,
  I3: getJsxRuntime,
  LX: useScope,
  ZI: AppScope,
  e6: getReactRuntime,
} = appSharedChunk as unknown as SharedRuntime;
const {
  Rdt: callPluginTool,
  _N: isRemoteHost,
  a_n: matchRoute,
  b6t: usePluginCapability,
  c4t: useInstalledPlugins,
  ev: resolveAvailability,
  nv: securityGate,
  o_n: useNavigate,
  ofn: isGateEnabled,
  ugn: LOCAL_HOST_ID,
} = appInitialChunk as unknown as InitialRuntime;

let React: ReactRuntime;
let jsx: JsxRuntime;
let initialized = false;

function initializeSecurityRoute(): void {
  if (initialized) return;
  initializeRuntimeLazy();
  React = getReactRuntime();
  jsx = getJsxRuntime();
  initialized = true;
}

function asArray<Value>(value: unknown): Value[] {
  return Array.isArray(value) ? (value as Value[]) : [];
}

function messageForAvailability(state: Availability): string {
  switch (state) {
    case "gate-disabled":
      return "The Codex Security workbench is not enabled for this build";
    case "remote-host":
      return "Codex Security is available when working on a local host";
    case "host-disconnected":
      return "The selected remote host is disconnected";
    case "disabled-by-admin":
      return "Your administrator has disabled the Codex Security plugin";
    case "plugin-unavailable":
      return "Install and enable the Codex Security plugin to use this workbench";
    case "loading":
      return "Loading Codex Security…";
    case "ready":
      return "Codex Security";
  }
}

function useSecurityCollection<Value>(
  tool: string,
  key: string,
  enabled: boolean,
): { data: Value[] | null; error: string | null; refresh(): void } {
  const scope = useScope(AppScope);
  const [version, setVersion] = React.useState(0);
  const [data, setData] = React.useState<Value[] | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  React.useEffect(() => {
    if (!enabled) return;
    let active = true;
    setError(null);
    void callPluginTool(scope, LOCAL_HOST_ID, "codex-security", tool, {})
      .then((result) => {
        if (!active) return;
        if (result.isError) throw new Error("Codex Security could not complete the request.");
        setData(asArray<Value>(result.structuredContent?.[key]));
      })
      .catch((reason: unknown) => {
        if (!active) return;
        setError(reason instanceof Error ? reason.message : String(reason));
      });
    return () => {
      active = false;
    };
  }, [enabled, key, scope, tool, version]);
  return { data, error, refresh: () => setVersion((value) => value + 1) };
}

function Navigation({ active }: { active: string }): unknown {
  const navigate = useNavigate();
  return jsx.jsx("nav", {
    "aria-label": "Security sections",
    children: [
      ["scans", "Scans", "/security"],
      ["findings", "Findings", "/security/findings"],
      ["repositories", "Repositories", "/security/repositories"],
    ].map(([id, label, path]) =>
      jsx.jsx("button", {
        type: "button",
        "aria-current": active === id ? "page" : undefined,
        onClick: () => navigate(path),
        children: label,
      }, id),
    ),
  });
}

function ScansPage(): unknown {
  const navigate = useNavigate();
  const { data, error, refresh } = useSecurityCollection<SecurityScan>(
    "list_codex_security_scans",
    "scans",
    true,
  );
  return jsx.jsxs("section", {
    "data-security-page": "scans",
    children: [
      jsx.jsxs("header", { children: [
        jsx.jsx("h1", { children: "Security scans" }),
        jsx.jsx("button", { type: "button", onClick: () => navigate("/security/new"), children: "New scan" }),
      ] }),
      error == null ? null : jsx.jsx("p", { role: "alert", children: error }),
      data == null
        ? jsx.jsx("p", { role: "status", children: "Loading Security scans" })
        : data.length === 0
          ? jsx.jsxs("div", { children: [
              jsx.jsx("p", { children: "No Security scans yet" }),
              jsx.jsx("button", { type: "button", onClick: refresh, children: "Refresh" }),
            ] })
          : jsx.jsx("ul", { children: data.map((scan) => jsx.jsx("li", {
              children: jsx.jsx("button", {
                type: "button",
                onClick: () => navigate(`/security/scans/${scan.scanId}`),
                children: `${scan.targetPath} · ${scan.findingCount} findings · ${scan.progress.status}`,
              }),
            }, scan.scanId)) }),
    ],
  });
}

function NewScanPage(): unknown {
  const scope = useScope(AppScope);
  const navigate = useNavigate();
  const [targetPath, setTargetPath] = React.useState("");
  const [mode, setMode] = React.useState<"full" | "diff">("full");
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const submit = async (): Promise<void> => {
    const target = targetPath.trim();
    if (target.length === 0 || pending) return;
    setPending(true);
    setError(null);
    try {
      const result = await callPluginTool(scope, LOCAL_HOST_ID, "codex-security", "start_codex_security_scan", {
        mode, scope: "workspace", targetPath: target,
      });
      if (result.isError) throw new Error("Codex Security could not start the scan.");
      const scanId = result.structuredContent?.scanId;
      navigate(typeof scanId === "string" ? `/security/scans/${scanId}` : "/security");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : String(reason));
    } finally {
      setPending(false);
    }
  };
  return jsx.jsxs("form", {
    "data-security-page": "new-scan",
    onSubmit: (event: { preventDefault(): void }) => { event.preventDefault(); void submit(); },
    children: [
      jsx.jsx("h1", { children: "New Security scan" }),
      jsx.jsx("input", {
        "aria-label": "Target path",
        value: targetPath,
        onChange: (event: { target: { value: string } }) => setTargetPath(event.target.value),
      }),
      jsx.jsx("select", {
        "aria-label": "Scan mode",
        value: mode,
        onChange: (event: { target: { value: string } }) => setMode(event.target.value === "diff" ? "diff" : "full"),
        children: [jsx.jsx("option", { value: "full", children: "Full codebase" }), jsx.jsx("option", { value: "diff", children: "Changes only" })],
      }),
      error == null ? null : jsx.jsx("p", { role: "alert", children: error }),
      jsx.jsx("button", { type: "submit", disabled: pending || targetPath.trim().length === 0, children: pending ? "Starting…" : "Start scan" }),
    ],
  });
}

function FindingsPage(): unknown {
  const { data, error } = useSecurityCollection<SecurityFinding>("list_codex_security_global_findings", "findings", true);
  return jsx.jsxs("section", {
    "data-security-page": "findings",
    children: [
      jsx.jsx("h1", { children: "Security findings" }),
      error == null ? null : jsx.jsx("p", { role: "alert", children: error }),
      data == null ? jsx.jsx("p", { role: "status", children: "Loading findings" })
        : data.length === 0 ? jsx.jsx("p", { children: "No open findings" })
          : jsx.jsx("ul", { children: data.map((finding) => jsx.jsx("li", { children: `${finding.title} · ${finding.severity} · ${finding.status}` }, finding.occurrenceId)) }),
    ],
  });
}

function RepositoriesPage(): unknown {
  const { data, error } = useSecurityCollection<SecurityRepository>("list_codex_security_repositories", "repositories", true);
  return jsx.jsxs("section", {
    "data-security-page": "repositories",
    children: [
      jsx.jsx("h1", { children: "Security repositories" }),
      error == null ? null : jsx.jsx("p", { role: "alert", children: error }),
      data == null ? jsx.jsx("p", { role: "status", children: "Loading repositories" })
        : data.length === 0 ? jsx.jsx("p", { children: "No scanned repositories yet" })
          : jsx.jsx("ul", { children: data.map((repository) => jsx.jsx("li", { children: `${repository.displayName} · ${repository.openFindingsCount} open findings · ${repository.targetPath}` }, repository.targetId)) }),
    ],
  });
}

function SecurityRoute(): unknown {
  const navigate = useNavigate();
  const gateEnabled = isGateEnabled(securityGate);
  const remote = isRemoteHost();
  const capability = usePluginCapability({ enabled: gateEnabled && !remote, hostId: LOCAL_HOST_ID });
  const plugins = useInstalledPlugins({ enabled: capability, hostId: LOCAL_HOST_ID, roots: undefined, resolveActiveRoots: true });
  const availability = resolveAvailability({ installedPlugins: capability ? plugins.data : undefined, isGateEnabled: gateEnabled, isLoading: plugins.isLoading, isRemoteHost: remote });

  if (availability !== "ready") {
    return jsx.jsxs("main", {
      "data-security-state": availability,
      children: [
        jsx.jsx("h1", { children: availability === "loading" ? "Codex Security" : "Codex Security is unavailable" }),
        jsx.jsx("p", { children: messageForAvailability(availability) }),
        remote ? jsx.jsx("button", { type: "button", onClick: () => navigate("/security"), children: "Use local" }) : null,
      ],
    });
  }

  const isNew = matchRoute("/security/new") != null;
  const isFindings = matchRoute("/security/findings") != null || matchRoute("/security/findings/:findingId") != null;
  const isRepositories = matchRoute("/security/repositories") != null || matchRoute("/security/repositories/:targetId") != null;
  const active = isFindings ? "findings" : isRepositories ? "repositories" : "scans";
  return jsx.jsxs("main", {
    "data-security-state": "ready",
    children: [
      jsx.jsx(Navigation, { active }),
      isNew ? jsx.jsx(NewScanPage, {}) : isFindings ? jsx.jsx(FindingsPage, {}) : isRepositories ? jsx.jsx(RepositoriesPage, {}) : jsx.jsx(ScansPage, {}),
    ],
  });
}

initializeSecurityRoute();
export { SecurityRoute };
