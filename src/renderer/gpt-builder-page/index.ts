// gpt-builder-page — Create, configure, preview, save, and publish a custom GPT.

import * as appInitialChunk from "@rchunk/app-initial";
import "@rchunk/app-primary";
import * as appSharedChunk from "@rchunk/app-shared";
import * as transcriptChunk from "@rchunk/chatgpt-conversation-transcript";
// @ts-ignore -- semantic dependency exists in the published renderer graph.
import * as managementAccessChunk from "@rchunk/gpt-management-access";
import "@rchunk/rolldown-runtime";
import * as tabsChunk from "@rchunk/security-tabs";
import * as threadScrollChunk from "@rchunk/thread-scroll-layout";

interface JsxRuntime {
  Fragment: unknown;
  jsx(type: unknown, props: Record<string, unknown>, key?: string): unknown;
  jsxs(type: unknown, props: Record<string, unknown>, key?: string): unknown;
}

interface ReactRuntime {
  useEffect(effect: () => void | (() => void), dependencies: unknown[]): void;
  useRef<Value>(value: Value): { current: Value };
  useState<Value>(
    value: Value | (() => Value),
  ): [Value, (next: Value | ((current: Value) => Value)) => void];
}

interface QueryResult<Value> {
  data?: Value | null;
}

interface AppSharedApi {
  $3(): void;
  BX<Value>(family: unknown, parameter: string): QueryResult<Value>;
  FX(): void;
  HX<Value>(signal: unknown): Value;
  I3(): JsxRuntime;
  K2(): void;
  Y2: unknown;
  Yh: unknown;
  e6(): ReactRuntime;
}

interface ApiClient {
  safeGet<Value>(
    path: string,
    options: {
      additionalHeaders?: Record<string, string>;
      expectedErrorStatuses?: number[];
      parameters?: Record<string, unknown>;
      signal?: AbortSignal;
    },
  ): Promise<Value>;
  safePost<Value>(
    path: string,
    options: {
      additionalHeaders?: Record<string, string>;
      expectedErrorStatuses?: number[];
      parameters?: Record<string, unknown>;
      requestBody?: unknown;
      signal?: AbortSignal;
    },
  ): Promise<Value>;
}

interface SearchParameters {
  get(name: string): string | null;
}

interface AccountQueryData {
  account: { structure: "personal" | "workspace" };
  features?: string[];
}

interface AppInitialApi {
  Let: unknown;
  d_n(): [SearchParameters];
  ft: unknown;
  ket: unknown;
  mun: unknown;
  o_n(): (destination: unknown, options?: { replace?: boolean }) => void;
  rE: string;
  rJt: ApiClient;
  ytn(gptId: string): string;
}

interface ManagementAccessApi {
  i(): void;
  n(): void;
  r: unknown;
  t: unknown;
}

interface TabsApi {
  n(): void;
  t: unknown;
}

interface ThreadScrollApi {
  n(): void;
  t: unknown;
}

interface TranscriptApi {
  n(): void;
  t: unknown;
}

interface GptFile {
  file_id: string;
  last_modified?: number;
  library_file_id?: string;
  location?: string;
  name: string;
  size?: number;
  type?: string | null;
}

interface GptTool {
  type: "browser" | "image_gen" | "python" | "retrieval";
}

interface GptDraft {
  default_model?: string;
  display: {
    description: string;
    name: string;
    profile_pic_id?: string;
    profile_picture_url?: string;
    prompt_starters: string[];
  };
  files: GptFile[];
  instructions: string;
  tools: GptTool[];
  training_disabled: boolean;
}

interface GptResource {
  files: Array<GptFile & { file_response_type?: string }>;
  gizmo: {
    default_model?: string;
    display: GptDraft["display"];
    id: string;
    instructions?: string | null;
    live_version?: number | null;
    short_url?: string | null;
    training_disabled: boolean;
  };
  project_file_limits?: { max_file_limit?: number };
  tools: Array<{ type: string }>;
}

interface PromoteResponse {
  error?: string | null;
  resource?: GptResource | null;
}

interface UploadResponse {
  file_id: string;
  library_file_id?: string;
  name?: string;
}

type ActiveTab = "configure" | "create" | "preview";
type LoadState =
  | { status: "loading" }
  | { error: unknown; status: "error" }
  | { resource: GptResource | null; status: "ready" };
type SaveState = "error" | "saved" | "saving";
type ValidationField = "description" | "instructions" | "name";

const {
  $3: initializeJsxRuntime,
  BX: useSignalFamilyValue,
  FX: initializeSignals,
  HX: useSignalValue,
  I3: getJsxRuntime,
  K2: initializeIntl,
  Y2: FormattedMessage,
  Yh: Button,
  e6: getReactRuntime,
} = appSharedChunk as unknown as AppSharedApi;
const {
  Let: LoadingStateView,
  d_n: useSearchParameters,
  ket: ErrorStateView,
  mun: currentAccountIdSignal,
  o_n: useNavigate,
  rE: gptBuilderRoute,
  rJt: apiClient,
  ytn: buildGptRoute,
} = appInitialChunk as unknown as AppInitialApi;
const {
  i: initializeManagementQueries,
  n: initializeManagementAccess,
  r: accountQueryFamily,
  t: GptManagementAccessBoundary,
} = managementAccessChunk as unknown as ManagementAccessApi;
const { n: initializeTabs, t: Tabs } = tabsChunk as unknown as TabsApi;
const { n: initializeThreadScroll, t: ThreadScrollLayout } =
  threadScrollChunk as unknown as ThreadScrollApi;
const { n: initializeTranscript, t: ConversationTranscript } =
  transcriptChunk as unknown as TranscriptApi;

const ACCOUNT_HEADER = "OpenAI-Account-ID";
const MAX_LENGTHS: Record<ValidationField, number> = {
  description: 300,
  instructions: 8_000,
  name: 50,
};
const SAVE_DELAY_MS = 750;

let jsx: JsxRuntime;
let React: ReactRuntime;

function message(id: string, defaultMessage: string, description: string): unknown {
  return jsx.jsx(FormattedMessage, { id, defaultMessage, description });
}

function blankDraft(browsingAllowed: boolean): GptDraft {
  return {
    display: { description: "", name: "", prompt_starters: [] },
    files: [],
    instructions: "",
    tools: browsingAllowed
      ? [{ type: "browser" }, { type: "image_gen" }]
      : [{ type: "image_gen" }],
    training_disabled: false,
  };
}

function resourceToDraft(resource: GptResource): GptDraft {
  const tools = resource.tools.flatMap((tool): GptTool[] => {
    if (tool.type === "browser" || tool.type === "image_gen" || tool.type === "python") {
      return [{ type: tool.type }];
    }
    if (tool.type === "retrieval") return [{ type: "retrieval" }];
    return [];
  });
  return {
    default_model: resource.gizmo.default_model,
    display: {
      description: resource.gizmo.display.description ?? "",
      name: resource.gizmo.display.name,
      profile_pic_id: resource.gizmo.display.profile_pic_id,
      profile_picture_url: resource.gizmo.display.profile_picture_url,
      prompt_starters: resource.gizmo.display.prompt_starters ?? [],
    },
    files: resource.files.flatMap((file) =>
      file.file_response_type != null && file.file_response_type !== "full_file_response"
        ? []
        : [{
            file_id: file.file_id,
            last_modified: file.last_modified,
            library_file_id: file.library_file_id,
            location: file.location,
            name: file.name || file.file_id,
            size: file.size,
            type: file.type,
          }],
    ),
    instructions: resource.gizmo.instructions ?? "",
    tools,
    training_disabled: resource.gizmo.training_disabled,
  };
}

function validateDraft(draft: GptDraft): ValidationField[] {
  const errors: ValidationField[] = [];
  if (draft.display.name.length > MAX_LENGTHS.name) errors.push("name");
  if (draft.display.description.length > MAX_LENGTHS.description) errors.push("description");
  if (draft.instructions.length > MAX_LENGTHS.instructions) errors.push("instructions");
  return errors;
}

function serializableDraft(draft: GptDraft): GptDraft {
  return {
    ...draft,
    display: {
      ...draft.display,
      prompt_starters: draft.display.prompt_starters.filter((starter) => starter.trim().length > 0),
    },
  };
}

function useDraftResource(accountId: string, gizmoId: string | null): [LoadState, () => void] {
  const [revision, setRevision] = React.useState(0);
  const [state, setState] = React.useState<LoadState>(() =>
    gizmoId == null ? { resource: null, status: "ready" } : { status: "loading" },
  );
  React.useEffect(() => {
    if (gizmoId == null) {
      setState({ resource: null, status: "ready" });
      return;
    }
    const controller = new AbortController();
    setState({ status: "loading" });
    void apiClient
      .safeGet<GptResource>("/gizmos/{gizmo_id_or_short_url}", {
        additionalHeaders: { [ACCOUNT_HEADER]: accountId },
        expectedErrorStatuses: [401, 403, 404],
        parameters: { path: { gizmo_id_or_short_url: gizmoId }, query: { draft: true } },
        signal: controller.signal,
      })
      .then((resource) => setState({ resource, status: "ready" }))
      .catch((error: unknown) => {
        if (!controller.signal.aborted) setState({ error, status: "error" });
      });
    return () => controller.abort();
  }, [accountId, gizmoId, revision]);
  return [state, () => setRevision((value) => value + 1)];
}

function GptBuilderPage(): unknown {
  const accountId = useSignalValue<string | null>(currentAccountIdSignal);
  if (accountId == null) return jsx.jsx(LoadingStateView, { debugName: "GptBuilderAccount" });
  return jsx.jsx(GptManagementAccessBoundary, {
    loadingFallback: jsx.jsx(LoadingStateView, { debugName: "GptBuilderAccess" }),
    unavailableFallback: jsx.jsx(ErrorStateView, {
      layout: "page",
      title: message(
        "gptBuilder.accessUnavailable",
        "GPT creation is unavailable for this account",
        "Message shown when GPT creation access is unavailable",
      ),
    }),
    children: jsx.jsx(GptBuilderRoute, { accountId }, accountId),
  });
}

function GptBuilderRoute({ accountId }: { accountId: string }): unknown {
  const [searchParameters] = useSearchParameters();
  const [gizmoId] = React.useState(() => searchParameters.get("gizmo"));
  const accountQuery = useSignalFamilyValue<AccountQueryData>(accountQueryFamily, accountId);
  const [loadState, retry] = useDraftResource(accountId, gizmoId);
  if (accountQuery.data == null || loadState.status === "loading") {
    return jsx.jsx(LoadingStateView, { debugName: "GptBuilderDraft" });
  }
  if (loadState.status === "error") {
    return jsx.jsx(ErrorStateView, {
      layout: "page",
      title: message(
        "gptBuilder.loadError",
        "Couldn't load this GPT draft",
        "Error shown when reopening a GPT creation draft fails",
      ),
      actions: jsx.jsx(Button, {
        onClick: retry,
        children: message("gptBuilder.reload", "Try again", "Retries loading the GPT draft"),
      }),
    });
  }
  const resource = loadState.resource;
  if (resource != null && (resource.gizmo.live_version ?? 0) > 0) {
    return jsx.jsx(ErrorStateView, {
      layout: "page",
      title: message(
        "gptBuilder.alreadyPublished",
        "This GPT is already published",
        "Message shown when a published GPT is opened in the creation route",
      ),
    });
  }
  const browsingAllowed =
    accountQuery.data.account.structure !== "workspace" ||
    accountQuery.data.features?.includes("browsing_available") === true;
  return jsx.jsx(GptDraftEditor, { accountId, browsingAllowed, initialResource: resource });
}

function GptDraftEditor({
  accountId,
  browsingAllowed,
  initialResource,
}: {
  accountId: string;
  browsingAllowed: boolean;
  initialResource: GptResource | null;
}): unknown {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = React.useState<ActiveTab>("configure");
  const [draft, setDraft] = React.useState<GptDraft>(() =>
    initialResource == null ? blankDraft(browsingAllowed) : resourceToDraft(initialResource),
  );
  const [resource, setResource] = React.useState<GptResource | null>(initialResource);
  const [saveState, setSaveState] = React.useState<SaveState>("saved");
  const [operationError, setOperationError] = React.useState<
    "publish" | "upload" | "uploadLimit" | null
  >(null);
  const [isPublishing, setPublishing] = React.useState(false);
  const [isUploading, setUploading] = React.useState(false);
  const dirty = React.useRef(false);
  const saving = React.useRef<Promise<GptResource> | null>(null);
  const draftRef = React.useRef(draft);
  draftRef.current = draft;

  const validationErrors = validateDraft(draft);
  const disabled = isPublishing || isUploading;

  const flush = (): Promise<GptResource> => {
    if (!dirty.current && resource != null) return Promise.resolve(resource);
    if (saving.current != null) return saving.current;
    if (validateDraft(draftRef.current).length > 0) {
      setSaveState("error");
      return Promise.reject(new Error("gpt_builder_invalid_draft"));
    }
    setSaveState("saving");
    const currentResource = resource;
    const request = apiClient
      .safePost<GptResource>("/gizmos", {
        additionalHeaders: { [ACCOUNT_HEADER]: accountId },
        expectedErrorStatuses: [400, 401, 403, 404, 409],
        parameters: { query: { gizmo_id: currentResource?.gizmo.id } },
        requestBody: serializableDraft(draftRef.current),
      })
      .then((savedResource) => {
        dirty.current = false;
        setResource(savedResource);
        setSaveState("saved");
        if (currentResource == null) {
          navigate(
            {
              pathname: gptBuilderRoute,
              search: new URLSearchParams({ gizmo: savedResource.gizmo.id }).toString(),
            },
            { replace: true },
          );
        }
        return savedResource;
      })
      .catch((error: unknown) => {
        setSaveState("error");
        throw error;
      })
      .finally(() => {
        saving.current = null;
      });
    saving.current = request;
    return request;
  };

  React.useEffect(() => {
    if (!dirty.current || validationErrors.length > 0) return;
    const timer = setTimeout(() => void flush().catch(() => undefined), SAVE_DELAY_MS);
    return () => clearTimeout(timer);
  }, [draft]);

  const changeDraft = (next: GptDraft): void => {
    dirty.current = true;
    setSaveState("saving");
    setDraft(next);
  };

  const changeDisplay = (field: "description" | "name", value: string): void => {
    changeDraft({ ...draft, display: { ...draft.display, [field]: value } });
  };

  const toggleTool = (type: GptTool["type"]): void => {
    const enabled = draft.tools.some((tool) => tool.type === type);
    changeDraft({
      ...draft,
      tools: enabled ? draft.tools.filter((tool) => tool.type !== type) : [...draft.tools, { type }],
    });
  };

  const onBack = (): void => {
    if (!dirty.current) {
      navigate("/gpts");
      return;
    }
    void flush().then(() => navigate("/gpts")).catch(() => undefined);
  };

  const onPublish = (): void => {
    if (disabled || validationErrors.length > 0) return;
    setPublishing(true);
    setOperationError(null);
    void flush()
      .then((savedResource) =>
        apiClient.safePost<PromoteResponse>("/gizmos/{gizmo_id}/promote", {
          additionalHeaders: { [ACCOUNT_HEADER]: accountId },
          expectedErrorStatuses: [400, 401, 403, 404, 409],
          parameters: { path: { gizmo_id: savedResource.gizmo.id } },
          requestBody: { sharing: [{ type: "private" }] },
        }),
      )
      .then((response) => {
        if (response.error != null || response.resource == null) {
          throw new Error(response.error ?? "gpt_promotion_failed");
        }
        navigate(buildGptRoute(response.resource.gizmo.short_url ?? response.resource.gizmo.id));
      })
      .catch(() => setOperationError("publish"))
      .finally(() => setPublishing(false));
  };

  const onUploadFiles = (files: FileList | File[]): void => {
    if (disabled) return;
    const selected = Array.from(files);
    const limit = resource?.project_file_limits?.max_file_limit;
    if (limit != null && draft.files.length + selected.length > limit) {
      setOperationError("uploadLimit");
      return;
    }
    setUploading(true);
    setOperationError(null);
    void flush()
      .then(async (savedResource) => {
        const uploaded: GptFile[] = [];
        for (const file of selected) {
          const response = await apiClient.safePost<UploadResponse>("/files", {
            additionalHeaders: { [ACCOUNT_HEADER]: accountId },
            parameters: { query: { gizmo_id: savedResource.gizmo.id } },
            requestBody: { file, use_case: "gizmo" },
          });
          uploaded.push({
            file_id: response.file_id,
            library_file_id: response.library_file_id,
            name: response.name ?? file.name,
            size: file.size,
            type: file.type || null,
          });
        }
        const nextDraft = { ...draftRef.current, files: [...draftRef.current.files, ...uploaded] };
        changeDraft(nextDraft);
      })
      .catch(() => setOperationError("upload"))
      .finally(() => setUploading(false));
  };

  const removeFile = (fileId: string): void => {
    changeDraft({ ...draft, files: draft.files.filter((file) => file.file_id !== fileId) });
  };

  const statusText =
    validationErrors.length > 0 || saveState === "error"
      ? "Unsaved changes"
      : saveState === "saving"
        ? "Saving…"
        : resource == null
          ? "Draft"
          : "Draft saved";

  return jsx.jsxs("main", {
    "data-page": "gpt-builder",
    children: [
      jsx.jsxs("header", {
        children: [
          jsx.jsx("button", { type: "button", "aria-label": "Back to GPTs", onClick: onBack, children: "Back" }),
          jsx.jsx("h1", { children: draft.display.name || "New GPT" }),
          jsx.jsx("span", { "data-save-state": saveState, children: statusText }),
          jsx.jsx(Button, {
            disabled: disabled || validationErrors.length > 0,
            onClick: onPublish,
            children: initialResource == null ? "Create" : "Update",
          }),
        ],
      }),
      operationError === "publish"
        ? jsx.jsx("div", { role: "alert", children: "Your GPT could not be published. Your draft is still saved." })
        : operationError === "upload"
          ? jsx.jsx("div", { role: "alert", children: "A file could not be added. Try uploading it again." })
          : operationError === "uploadLimit"
            ? jsx.jsx("div", { role: "alert", children: "This GPT has reached its knowledge file limit." })
            : null,
      jsx.jsx(Tabs, {
        ariaLabel: "GPT editor",
        onSelect: (key: string) => setActiveTab(key as ActiveTab),
        selectedKey: activeTab,
        tabs: [
          { key: "create", name: "Create", panelId: "gpt-create" },
          { key: "configure", name: "Configure", panelId: "gpt-configure" },
          { key: "preview", name: "Preview", panelId: "gpt-preview" },
        ],
      }),
      activeTab === "configure"
        ? jsx.jsxs("section", {
            id: "gpt-configure",
            "aria-label": "Configure your GPT",
            children: [
              textField("Name", draft.display.name, MAX_LENGTHS.name, disabled, (value) => changeDisplay("name", value)),
              textField("Description", draft.display.description, MAX_LENGTHS.description, disabled, (value) => changeDisplay("description", value), true),
              textField("Instructions", draft.instructions, MAX_LENGTHS.instructions, disabled, (value) => changeDraft({ ...draft, instructions: value }), true),
              jsx.jsxs("label", {
                children: [
                  "Conversation starters",
                  jsx.jsx("textarea", {
                    "aria-label": "Conversation starters",
                    disabled,
                    value: draft.display.prompt_starters.join("\n"),
                    onChange: (event: { target: { value: string } }) =>
                      changeDraft({
                        ...draft,
                        display: { ...draft.display, prompt_starters: event.target.value.split("\n") },
                      }),
                  }),
                ],
              }),
              jsx.jsxs("section", {
                children: [
                  jsx.jsx("h2", { children: "Knowledge" }),
                  draft.files.map((file) =>
                    jsx.jsxs("div", {
                      "data-file-id": file.file_id,
                      children: [
                        jsx.jsx("span", { children: file.name }),
                        jsx.jsx("button", {
                          type: "button",
                          "aria-label": `Remove ${file.name}`,
                          disabled,
                          onClick: () => removeFile(file.file_id),
                          children: "Remove",
                        }),
                      ],
                    }, file.file_id),
                  ),
                  jsx.jsx("input", {
                    type: "file",
                    multiple: true,
                    "aria-label": "Upload files",
                    disabled,
                    onChange: (event: { target: { files: FileList | null } }) => {
                      if (event.target.files != null) onUploadFiles(event.target.files);
                    },
                  }),
                ],
              }),
              jsx.jsxs("section", {
                children: [
                  jsx.jsx("h2", { children: "Capabilities" }),
                  capabilityToggle("Web search", "browser", draft, disabled || !browsingAllowed, toggleTool),
                  capabilityToggle("Image generation", "image_gen", draft, disabled, toggleTool),
                  capabilityToggle("Code Interpreter & Data Analysis", "python", draft, disabled, toggleTool),
                ],
              }),
              saveState === "error"
                ? jsx.jsx(Button, {
                    disabled: validationErrors.length > 0,
                    onClick: () => void flush().catch(() => undefined),
                    children: "Retry",
                  })
                : null,
            ],
          })
        : activeTab === "preview"
          ? jsx.jsx("section", {
              id: "gpt-preview",
              "aria-label": "Preview",
              children: jsx.jsx(ThreadScrollLayout, {
                children: jsx.jsx(ConversationTranscript, {
                  conversationId: resource?.gizmo.id ?? "draft-gpt-preview",
                  emptyState: jsx.jsx("p", { children: "Preview your GPT here" }),
                }),
              }),
            })
          : jsx.jsx("section", {
              id: "gpt-create",
              "aria-label": "Create your GPT",
              children: jsx.jsx("p", { children: "What would you like to make?" }),
            }),
    ],
  });
}

function textField(
  label: string,
  value: string,
  limit: number,
  disabled: boolean,
  onChange: (value: string) => void,
  multiline = false,
): unknown {
  const invalid = value.length > limit;
  const Control = multiline ? "textarea" : "input";
  return jsx.jsxs("label", {
    children: [
      label,
      jsx.jsx(Control, {
        "aria-invalid": invalid,
        "aria-label": label,
        disabled,
        value,
        onChange: (event: { target: { value: string } }) => onChange(event.target.value),
      }),
      invalid
        ? jsx.jsx("span", { role: "alert", children: `${label} must be ${limit} characters or fewer` })
        : null,
    ],
  });
}

function capabilityToggle(
  label: string,
  type: GptTool["type"],
  draft: GptDraft,
  disabled: boolean,
  onToggle: (type: GptTool["type"]) => void,
): unknown {
  return jsx.jsxs("label", {
    children: [
      label,
      jsx.jsx("input", {
        type: "checkbox",
        "aria-label": label,
        checked: draft.tools.some((tool) => tool.type === type),
        disabled,
        onChange: () => onToggle(type),
      }),
    ],
  });
}

initializeJsxRuntime();
initializeSignals();
initializeIntl();
initializeTabs();
initializeThreadScroll();
initializeTranscript();
initializeManagementAccess();
initializeManagementQueries();
jsx = getJsxRuntime();
React = getReactRuntime();

export { GptBuilderPage };
