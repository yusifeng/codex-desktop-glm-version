import { I3 as getJsxRuntime, type JsxRuntime } from "@rchunk/app-shared";
import { pnt as desktopApi } from "@rchunk/app-initial";
import "@rchunk/local-environment-workflow-messages";
import "@rchunk/play-outline";
import "@rchunk/rolldown-runtime";
import "@rchunk/form-runtime";

export type Platform = "darwin" | "linux" | "win32";
export type ScriptPlatform = "default" | Platform;
export type ActionIcon = "tool" | "run" | "debug" | "test";

export interface EnvironmentAction {
  id: string;
  name: string;
  icon: ActionIcon;
  command: string;
  platform: Platform | null;
}

export interface PlatformScripts {
  darwin: string;
  linux: string;
  win32: string;
}

export interface LocalEnvironmentDraft {
  actions: EnvironmentAction[];
  cleanupPlatformScripts: PlatformScripts;
  cleanupScript: string;
  name: string;
  setupPlatformScripts: PlatformScripts;
  setupScript: string;
}

export interface SavedEnvironment {
  actions?: Array<Omit<EnvironmentAction, "id">>;
  cleanup?: {
    script?: string;
    darwin?: { script?: string };
    linux?: { script?: string };
    win32?: { script?: string };
  };
  name: string;
  setup: {
    script: string;
    darwin?: { script?: string };
    linux?: { script?: string };
    win32?: { script?: string };
  };
  version?: number;
}

export interface DraftValidation {
  incompleteActionIds: string[];
  missingName: boolean;
}

export interface SaveConfigResult {
  configPath: string;
  type: "conflict" | "success";
}

interface LocalEnvironmentService {
  saveConfig(input: {
    configPath: string | null;
    expectedRevision?: string | null;
    hostId: string;
    raw: string;
  }): Promise<SaveConfigResult>;
}

interface DesktopApiWithLocalEnvironments {
  localEnvironments?: LocalEnvironmentService;
}

const platforms: Platform[] = ["darwin", "linux", "win32"];
const actionIconOptions: Array<{
  value: ActionIcon;
  message: { defaultMessage: string };
}> = [
  { value: "tool", message: { defaultMessage: "Tool" } },
  { value: "run", message: { defaultMessage: "Run" } },
  { value: "debug", message: { defaultMessage: "Debug" } },
  { value: "test", message: { defaultMessage: "Test" } },
];
const editorMessages = {
  environmentName: { defaultMessage: "Name" },
  setupScript: { defaultMessage: "Setup script" },
  cleanupScript: { defaultMessage: "Cleanup script" },
  actionsTitle: { defaultMessage: "Actions" },
  addAction: { defaultMessage: "Add action" },
};

let jsx: JsxRuntime;

function createPlatformScripts(
  source?: SavedEnvironment["setup"] | SavedEnvironment["cleanup"] | null,
): PlatformScripts {
  return {
    darwin: source?.darwin?.script ?? "",
    linux: source?.linux?.script ?? "",
    win32: source?.win32?.script ?? "",
  };
}

function createEnvironmentDraft(
  input: { defaultName: string } | { environment: SavedEnvironment },
): LocalEnvironmentDraft {
  if ("defaultName" in input) {
    return {
      actions: [],
      cleanupPlatformScripts: createPlatformScripts(null),
      cleanupScript: "",
      name: input.defaultName,
      setupPlatformScripts: createPlatformScripts(null),
      setupScript: "",
    };
  }
  const environment = input.environment;
  return {
    actions: (environment.actions ?? []).map((action) => ({
      ...action,
      id: crypto.randomUUID(),
      icon: action.icon ?? "tool",
      platform: action.platform ?? null,
    })),
    cleanupPlatformScripts: createPlatformScripts(environment.cleanup),
    cleanupScript: environment.cleanup?.script ?? "",
    name: environment.name,
    setupPlatformScripts: createPlatformScripts(environment.setup),
    setupScript: environment.setup.script,
  };
}

function createEnvironmentAction(): EnvironmentAction {
  return {
    id: crypto.randomUUID(),
    name: "",
    icon: "tool",
    command: "",
    platform: null,
  };
}

function validateEnvironmentDraft(
  name: string,
  actions: readonly EnvironmentAction[],
): DraftValidation {
  return {
    incompleteActionIds: actions.flatMap((action) =>
      action.name.trim().length > 0 === action.command.trim().length > 0
        ? []
        : [action.id],
    ),
    missingName: name.trim().length === 0,
  };
}

function scriptPlaceholder(
  scriptType: "action" | "setup" | "cleanup",
  platform: ScriptPlatform = "default",
): string {
  if (scriptType === "action") return "npm run dev";
  if (platform === "win32") {
    return scriptType === "setup"
      ? "python -m pip install -r requirements.txt\npnpm install"
      : "docker compose down --remove-orphans";
  }
  return scriptType === "setup"
    ? 'cd "$CODEX_WORKTREE_PATH"\npip install -r requirements.txt\nnpm install\n./run/setup.sh'
    : "docker compose down --remove-orphans\nrm -rf .cache/tmp";
}

function quoteToml(value: string): string {
  const normalized = value.replace(/\r\n?/g, "\n");
  if (!normalized.includes("\n")) return JSON.stringify(normalized);
  if (!normalized.includes("'''")) return `'''\n${normalized}'''`;
  return `"""\n${normalized.replace(/\\/g, "\\\\").replace(/"""/g, '\\"""')}"""`;
}

function appendScript(
  lines: string[],
  section: "setup" | "cleanup",
  script: string,
  platformScripts: PlatformScripts,
): void {
  const overrides = platforms.flatMap((platform) =>
    platformScripts[platform]
      ? [{ platform, script: platformScripts[platform] }]
      : [],
  );
  if (section === "setup" || script || overrides.length) {
    lines.push("", `[${section}]`, `script = ${quoteToml(script)}`);
  }
  overrides.forEach((override, index) => {
    lines.push(
      "",
      `[${section}.${override.platform}]`,
      `script = ${quoteToml(override.script)}`,
    );
    if (index < overrides.length - 1) lines.push("");
  });
}

function serializeEnvironment(
  input: LocalEnvironmentDraft & { version: number },
): string {
  const actions = input.actions.flatMap((action) => {
    const name = action.name.trim();
    const command = action.command.trim();
    return name && command ? [{ ...action, name, command }] : [];
  });
  const lines = [
    "# THIS IS AUTOGENERATED. DO NOT EDIT MANUALLY",
    `version = ${input.version}`,
    `name = ${quoteToml(input.name.trim())}`,
  ];
  appendScript(lines, "setup", input.setupScript, input.setupPlatformScripts);
  appendScript(
    lines,
    "cleanup",
    input.cleanupScript,
    input.cleanupPlatformScripts,
  );
  if (actions.length) lines.push("");
  for (const action of actions) {
    lines.push("[[actions]]", `name = ${quoteToml(action.name)}`);
    if (action.icon) lines.push(`icon = ${quoteToml(action.icon)}`);
    lines.push(`command = ${quoteToml(action.command)}`);
    if (action.platform) lines.push(`platform = ${quoteToml(action.platform)}`);
    lines.push("");
  }
  return `${lines.join("\n").trimEnd()}\n`;
}

async function saveRawEnvironment(input: {
  configPath: string | null;
  expectedRevision?: string | null;
  hostId: string;
  queryClient?: {
    invalidateQueries?(options?: unknown): Promise<unknown> | unknown;
  };
  raw: string;
  selectEnvironment?(
    configPath: string,
  ): Promise<boolean | void> | boolean | void;
  workspaceRoot: string;
}): Promise<{
  configPath?: string;
  type: "conflict" | "selection-failed" | "success";
}> {
  const service = (desktopApi as DesktopApiWithLocalEnvironments)
    .localEnvironments;
  if (!service)
    throw new Error("Local environments are not supported by this host.");
  const saved = await service.saveConfig({
    configPath: input.configPath,
    expectedRevision: input.expectedRevision,
    hostId: input.hostId,
    raw: input.raw,
  });
  if (saved.type === "conflict") return { type: "conflict" };
  await input.queryClient?.invalidateQueries?.();
  const selected = await input.selectEnvironment?.(saved.configPath);
  return {
    configPath: saved.configPath,
    type: selected === false ? "selection-failed" : "success",
  };
}

async function saveEnvironmentDraft(
  input: Parameters<typeof saveRawEnvironment>[0] & {
    draft: LocalEnvironmentDraft;
    version: number;
  },
): Promise<{
  configPath?: string;
  type: "conflict" | "invalid" | "selection-failed" | "success";
}> {
  const validation = validateEnvironmentDraft(
    input.draft.name,
    input.draft.actions,
  );
  if (validation.missingName || validation.incompleteActionIds.length)
    return { type: "invalid" };
  return saveRawEnvironment({
    ...input,
    raw: serializeEnvironment({ ...input.draft, version: input.version }),
  });
}

async function selectSavedEnvironment(input: {
  codexWorktree: boolean;
  configPath: string;
  gitRoot: string | null;
  selectForWorkspace(configPath: string): void;
  selectForWorktree(
    gitRoot: string,
    configPath: string,
  ): Promise<boolean> | boolean;
}): Promise<boolean> {
  if (input.codexWorktree)
    return (
      input.gitRoot != null &&
      input.selectForWorktree(input.gitRoot, input.configPath)
    );
  input.selectForWorkspace(input.configPath);
  return true;
}

function ActionIconView({
  icon,
  className,
}: {
  icon: ActionIcon;
  className?: string;
}): unknown {
  return ensureJsx().jsx("span", {
    className,
    "data-icon": icon,
    children: icon,
  });
}

function PlatformSelector(props: {
  leadingOption: ScriptPlatform;
  selectedId: ScriptPlatform;
  ariaLabel?: string;
  onSelect(value: ScriptPlatform): void;
}): unknown {
  return ensureJsx().jsx("select", {
    "aria-label": props.ariaLabel,
    value: props.selectedId,
    onChange: (event: { currentTarget: { value: string } }) =>
      props.onSelect(event.currentTarget.value as ScriptPlatform),
    children: [props.leadingOption, ...platforms].map((platform) =>
      ensureJsx().jsx(
        "option",
        { value: platform, children: platform },
        platform,
      ),
    ),
  });
}

function SetupEnvironmentVariables(): unknown {
  return ensureJsx().jsxs("div", {
    className: "setup-environment-variables",
    children: ["CODEX_WORKTREE_PATH", "CODEX_WORKSPACE_PATH"].map((name) =>
      ensureJsx().jsx("code", { children: name }, name),
    ),
  });
}

export interface LocalEnvironmentEditorProps {
  configPath: string | null;
  expectedRevision?: string | null;
  hostId: string;
  initialEnvironment?: SavedEnvironment | null;
  hasParseError?: boolean;
  hasReadError?: boolean;
  simpleSetup?: boolean;
  workspaceRoot: string;
  onDirtyChange?(dirty: boolean): void;
  onDiscardConflict(): void;
  onRetryRead(): void;
  onSavingChange?(saving: boolean): void;
  onSaved(configPath: string, draft?: LocalEnvironmentDraft): void;
}

function LocalEnvironmentEditor(props: LocalEnvironmentEditorProps): unknown {
  const runtime = ensureJsx();
  const draft = createEnvironmentDraft(
    props.initialEnvironment
      ? { environment: props.initialEnvironment }
      : { defaultName: "local" },
  );
  const validation = validateEnvironmentDraft(draft.name, draft.actions);
  return runtime.jsxs("form", {
    className: "local-environment-editor",
    "data-simple-setup": props.simpleSetup || undefined,
    onSubmit: (event: { preventDefault(): void }) => event.preventDefault(),
    children: [
      runtime.jsx("input", {
        "aria-label": "Name",
        "aria-invalid": validation.missingName,
        defaultValue: draft.name,
        onChange: () => props.onDirtyChange?.(true),
      }),
      runtime.jsx("textarea", {
        "aria-label": "Setup script",
        defaultValue: draft.setupScript,
      }),
      runtime.jsx("textarea", {
        "aria-label": "Cleanup script",
        defaultValue: draft.cleanupScript,
      }),
      runtime.jsx(SetupEnvironmentVariables, {}),
      props.hasReadError
        ? runtime.jsx("button", {
            type: "button",
            onClick: props.onRetryRead,
            children: "Retry",
          })
        : null,
      runtime.jsx("button", {
        type: "submit",
        disabled: validation.missingName,
        children: props.simpleSetup ? "Set up project" : "Save",
      }),
    ],
  });
}

function ensureJsx(): JsxRuntime {
  if (jsx == null) jsx = getJsxRuntime();
  return jsx;
}

function initializeActionIcon(): void {
  jsx = getJsxRuntime();
}
function initializeActionOptions(): void {
  jsx = getJsxRuntime();
}
function initializeEditorMessages(): void {
  jsx = getJsxRuntime();
}
function initializePlatformSelector(): void {
  jsx = getJsxRuntime();
}
function initializePlaceholders(): void {
  jsx = getJsxRuntime();
}
function initializeSetupVariables(): void {
  jsx = getJsxRuntime();
}
function initializeLocalEnvironmentEditor(): void {
  jsx = getJsxRuntime();
}

export {
  initializeActionIcon as _,
  PlatformSelector as a,
  saveEnvironmentDraft as c,
  createEnvironmentAction as d,
  createEnvironmentDraft as f,
  ActionIconView as g,
  initializeActionOptions as h,
  initializeSetupVariables as i,
  initializeEditorMessages as l,
  actionIconOptions as m,
  initializeLocalEnvironmentEditor as n,
  initializePlatformSelector as o,
  initializePlaceholders as p,
  SetupEnvironmentVariables as r,
  initializePlatformSelector as s,
  LocalEnvironmentEditor as t,
  editorMessages as u,
};

void scriptPlaceholder;
void selectSavedEnvironment;
