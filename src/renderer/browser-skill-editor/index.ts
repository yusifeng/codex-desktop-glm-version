// browser-skill-editor — create and edit Browser Skills, including supporting files.

import * as appInitialChunk from "@rchunk/app-initial";
import * as appPrimaryChunk from "@rchunk/app-primary";
import * as appSharedChunk from "@rchunk/app-shared";
// @ts-ignore -- published semantic chunk; declarations are generated with the shared manifest.
import * as codeEditorChunk from "@rchunk/chatgpt-code-block-editor";
// @ts-ignore -- published semantic chunk; declarations are generated with the shared manifest.
import * as fileRowsChunk from "@rchunk/file-rows";
import * as browserSkillFilesChunk from "@rchunk/browser-skill-files";
import * as browserSkillsStateChunk from "@rchunk/browser-skills-state";
import * as pendingEditsChunk from "@rchunk/pending-edits-dialog";
import * as shareDialogChunk from "@rchunk/skill-share-dialog-runtime";
import "@rchunk/rolldown-runtime";

interface Ref<Value> { current: Value }
interface ReactRuntime {
  useEffect(effect: () => void | (() => void), dependencies?: readonly unknown[]): void;
  useId(): string;
  useRef<Value>(value: Value): Ref<Value>;
  useState<Value>(value: Value | (() => Value)): [Value, (next: Value | ((current: Value) => Value)) => void];
}
interface JsxRuntime {
  Fragment: unknown;
  jsx(type: unknown, props: Record<string, unknown>, key?: string): unknown;
  jsxs(type: unknown, props: Record<string, unknown>, key?: string): unknown;
}
interface Identity { accountId: string; isWorkspace: boolean; userId: string }
interface FileRange { length: number; start: number }
interface BrowserSkill extends Record<string, unknown> {
  creator_id?: string | null;
  description: string;
  display_name?: string | null;
  enabled?: boolean;
  files: Record<string, FileRange | undefined>;
  id: string;
  name: string;
  permissions?: { can_export?: boolean; can_read?: boolean; can_write?: boolean };
  sediment_id?: string | null;
}
type SupportingSource =
  | { content: string; kind: "text" }
  | { file: File; kind: "local" }
  | { kind: "stored"; reference: { file_id: string; path: string; range?: FileRange } };
interface SupportingFile { id: string; path: string; source: SupportingSource }
interface SkillDraft { description: string; files: SupportingFile[]; instructions: string; name: string }
type ValidationFailure = "description" | "instructions" | "name" | "paths" | "save";
type DuplicateResolution = "FORCE_CREATE" | "UPDATE_EXISTING";
interface ApiClient {
  safeDelete<Response>(path: string, options: Record<string, unknown>): Promise<Response>;
  safeGet<Response>(path: string, options: Record<string, unknown>): Promise<Response>;
  safePost<Response>(path: string, options: Record<string, unknown>): Promise<Response>;
}
interface QueryClient {
  cancelQueries(options: { queryKey: unknown[] }): Promise<unknown>;
  invalidateQueries(options: { queryKey: unknown[]; refetchType?: string }): Promise<unknown>;
  setQueriesData<Value>(options: { queryKey: unknown[] }, updater: (value: Value | undefined) => Value | undefined): void;
  setQueryData<Value>(key: unknown[], value: Value | ((current: Value | undefined) => Value | undefined)): void;
}
interface Scope { get(signal: unknown): unknown; queryClient: QueryClient }
interface ToastService { error?(message: string): void; success?(message: string): void }
interface Blocker { proceed(): void; reset(): void; state: string }
interface AppSharedRuntime {
  $3(): void; FX(): void; I3(): JsxRuntime; K2(): void; LX(): Scope;
  HX<Value>(signal: unknown): Value; Y2: unknown; Yh: unknown; Zh(): void; e6(): ReactRuntime; n4(): { formatMessage(descriptor: { defaultMessage: string }): string }; pk: unknown;
}
interface AppInitialRuntime {
  YRt(scope: Scope, upload: { contentType: string; file: File; fileId: string; fileName: string; signal: AbortSignal; uploadUrl: string }): Promise<unknown>;
  cJt(): void; l_n(): { skillId?: string }; n_n?(shouldBlock: () => boolean): Blocker; o_n(): (path: string, options?: Record<string, unknown>) => void; rJt: ApiClient; xpn?(scope: Scope, event: unknown, fields: Record<string, unknown>): void; ypn?(): void;
}

const { $3: initializeRuntime, FX: initializeSignals, I3: getJsxRuntime, K2: initializeUi, LX: useScope, HX: useSignalValue, Y2: FormattedMessage, Yh: Button, Zh: initializeButton, e6: getReactRuntime, n4: useIntl, pk: toastSignal } = appSharedChunk as unknown as AppSharedRuntime;
const { YRt: uploadFile, cJt: initializeApi, l_n: useParams, n_n: useBlocker, o_n: useNavigate, rJt: apiClient, xpn: trackEvent, ypn: initializeAnalytics } = appInitialChunk as unknown as AppInitialRuntime;
const { n: initializeCodeEditor, t: CodeEditor } = codeEditorChunk as unknown as { n(): void; t: unknown };
const { t: buildFileRows } = fileRowsChunk as unknown as { t(files: SupportingFile[], collapsed: Set<string>): unknown[] };
const { n: initializeBrowserSkillFiles, t: fetchBrowserSkillFile } = browserSkillFilesChunk;
const { c: canCreateSignal, d: identitySignal, h: canEditBrowserSkill, l: canUploadSignal, n: initializeBrowserSkillsState, s: accessSignal } = browserSkillsStateChunk;
const { n: initializePendingEdits, t: PendingEditsDialog } = pendingEditsChunk;
const { i: downloadSkill, l: parseDuplicateResolution, n: initializeShareRuntime, r: deleteSkillRuntime, s: DuplicateSkillDialog, t: SkillShareDialog } = shareDialogChunk;
void appPrimaryChunk;

const SKILL_NAME_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/u;
const EDITABLE_FILE_PATTERN = /\.(md|txt|json|yaml|yml|toml|csv|ts|tsx|js|jsx|py|sh|css|html|xml|svg|sql|r)$/iu;
const FRONTMATTER_PATTERN = /^---\s*\r?\n[\s\S]*?\r?\n---(?:\r?\n|$)/u;
const MAX_FILE_BYTES = 25 * 1024 * 1024;
const EMPTY_DRAFT: SkillDraft = { description: "", files: [], instructions: "", name: "" };

function validateDraft(draft: SkillDraft): ValidationFailure | null {
  if (!SKILL_NAME_PATTERN.test(draft.name) || draft.name.length > 64) return "name";
  if (!draft.instructions.trim()) return "instructions";
  if (draft.description.length > 500) return "description";
  const paths = new Set(["skill.md"]);
  for (const file of draft.files) {
    const path = file.path;
    const segments = path.split("/");
    const unsafe = !path.trim() || path !== path.trim() || /[\\:]/u.test(path) || [...path].some((character) => character.charCodeAt(0) < 32) || segments.some((segment) => !segment || segment === "." || segment === "..") || paths.has(path.toLowerCase());
    if (unsafe) return "paths";
    paths.add(path.toLowerCase());
  }
  return null;
}

function draftsEqual(left: SkillDraft, right: SkillDraft): boolean {
  return left.name === right.name && left.description === right.description && left.instructions === right.instructions && left.files.length === right.files.length && left.files.every((file, index) => file.path === right.files[index]?.path && file.source === right.files[index]?.source);
}
function canEditText(file: SupportingFile): boolean { return file.source.kind === "text" || EDITABLE_FILE_PATTERN.test(file.path); }
function cleanInstructions(value: string): string { return value.replace(/^\uFEFF/u, "").replace(FRONTMATTER_PATTERN, ""); }
function messageForFailure(failure: ValidationFailure): string {
  return { name: "Use up to 64 lowercase letters, numbers, and single hyphens between words", instructions: "Add instructions before saving", description: "Keep the description to 500 characters or fewer", paths: "Give each file a unique relative path. SKILL.md is reserved for instructions.", save: "Couldn't save this skill. Your edits are still here; try again." }[failure];
}

async function loadEditorDraft(identity: Identity, skillId: string, signal: AbortSignal): Promise<{ draft: SkillDraft; skill: BrowserSkill }> {
  const skill = await apiClient.safeGet<BrowserSkill>("/hazelnuts/{hazelnut_id}", { additionalHeaders: { "ChatGPT-Account-ID": identity.accountId }, expectedErrorStatuses: [403, 404], parameters: { path: { hazelnut_id: skillId }, query: { include_permissions: true } }, signal });
  const instructionPath = Object.keys(skill.files).find((path) => path.toLowerCase() === "skill.md");
  if (instructionPath == null || skill.permissions?.can_read === false) throw new Error("Skill instructions unavailable");
  const instructions = cleanInstructions(new TextDecoder().decode(await fetchBrowserSkillFile(identity.accountId, skill, instructionPath, signal)));
  const files = await Promise.all(Object.entries(skill.files).filter(([path]) => path !== instructionPath).map(async ([path, range]) => ({ id: path, path, source: skill.sediment_id ? { kind: "stored" as const, reference: { file_id: skill.sediment_id, path, range } } : { kind: "local" as const, file: new File([await fetchBrowserSkillFile(identity.accountId, skill, path, signal)], path.split("/").at(-1) ?? path) } })));
  return { skill, draft: { description: skill.description ?? "", files, instructions, name: skill.name } };
}

async function readSupportingFile(identity: Identity, skill: BrowserSkill | null, file: SupportingFile, signal: AbortSignal): Promise<string | null> {
  if (file.source.kind === "text") return file.source.content;
  if (!canEditText(file)) return null;
  if (file.source.kind === "local") return file.source.file.text();
  if (skill == null) throw new Error("Skill file unavailable");
  return new TextDecoder().decode(await fetchBrowserSkillFile(identity.accountId, skill, file.source.reference.path, signal));
}

async function saveDraft(scope: Scope, identity: Identity, draft: SkillDraft, skill: BrowserSkill | null, applyResolution: boolean, signal: AbortSignal): Promise<BrowserSkill> {
  if (validateDraft(draft) != null || scope.get(accessSignal) !== true || (skill ? !canEditBrowserSkill(skill, identity.userId) : scope.get(canCreateSignal) !== true)) throw new Error("Skill draft cannot be saved");
  if (draft.files.some((file) => file.source.kind === "local") && scope.get(canUploadSignal) !== true) throw new Error("Skill upload permission required");
  const storedFiles = (await Promise.all(draft.files.map(async (file) => {
    signal.throwIfAborted();
    if (file.source.kind === "text") return null;
    if (file.source.kind === "stored") return { ...file.source.reference, path: file.path };
    const slots = await apiClient.safePost<{ uploads: Array<{ file_id: string; upload_url: string }> }>("/hazelnuts/draft/uploads", { additionalHeaders: { "ChatGPT-Account-ID": identity.accountId }, requestBody: { files: [{ content_type: file.source.file.type || "application/octet-stream", filename: file.source.file.name }] }, signal });
    const slot = slots.uploads[0];
    if (slot == null) throw new Error("Skill upload unavailable");
    await uploadFile(scope, { contentType: file.source.file.type || "application/octet-stream", file: file.source.file, fileId: slot.file_id, fileName: file.source.file.name, signal, uploadUrl: slot.upload_url });
    await apiClient.safePost("/hazelnuts/uploads/finish", { additionalHeaders: { "ChatGPT-Account-ID": identity.accountId }, requestBody: { file_id: slot.file_id }, signal });
    return { file_id: slot.file_id, path: file.path };
  }))).filter((file): file is NonNullable<typeof file> => file != null);
  const response = await apiClient.safePost<{ hazelnuts: BrowserSkill[] }>("/hazelnuts/draft", { additionalHeaders: { "ChatGPT-Account-ID": identity.accountId }, expectedErrorStatuses: [400, 401, 403, 409, 413, 422], requestBody: { apply_resolution: applyResolution, description: draft.description, display_name: skill?.display_name, file_contents: draft.files.flatMap((file) => file.source.kind === "text" ? [{ content: file.source.content, path: file.path }] : []), files: storedFiles, id: skill?.id, instructions: draft.instructions, name: draft.name }, signal });
  const saved = response.hazelnuts[0];
  if (saved == null) throw new Error("Skill save returned no skill");
  const normalized = { ...saved, permissions: saved.permissions ?? skill?.permissions };
  const rootKey = ["browser-skills", identity.accountId, identity.userId];
  await scope.queryClient.cancelQueries({ queryKey: rootKey });
  scope.queryClient.setQueriesData<BrowserSkill[]>({ queryKey: [...rootKey, "collection"] }, (items) => items?.map((item) => item.id === normalized.id ? normalized : item));
  scope.queryClient.setQueryData([...rootKey, "detail", normalized.id], normalized);
  await scope.queryClient.invalidateQueries({ queryKey: [...rootKey, "editor", normalized.id], refetchType: "none" });
  trackEvent?.(scope, skill ? "browser_skill_updated" : "browser_skill_created", { hazelnutId: normalized.id });
  return normalized;
}

function BrowserSkillEditor(): unknown {
  const React = getReactRuntime();
  const jsx = getJsxRuntime();
  const scope = useScope();
  const intl = useIntl();
  const navigate = useNavigate();
  const { skillId } = useParams();
  const identity = useSignalValue<Identity | null>(identitySignal);
  const access = useSignalValue<boolean | null>(accessSignal);
  const inputId = React.useId();
  const [loadVersion, setLoadVersion] = React.useState(0);
  const [loadState, setLoadState] = React.useState<"error" | "loading" | "ready">(skillId ? "loading" : "ready");
  const [skill, setSkill] = React.useState<BrowserSkill | null>(null);
  const [baseline, setBaseline] = React.useState<SkillDraft>(EMPTY_DRAFT);
  const [draft, setDraft] = React.useState<SkillDraft>(EMPTY_DRAFT);
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [selectedContent, setSelectedContent] = React.useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = React.useState<"error" | "loading" | "ready">("ready");
  const [saving, setSaving] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);
  const [downloading, setDownloading] = React.useState(false);
  const [downloadError, setDownloadError] = React.useState(false);
  const [failure, setFailure] = React.useState<ValidationFailure | null>(null);
  const [duplicateResolution, setDuplicateResolution] = React.useState<DuplicateResolution | null>(null);
  const [shareOpen, setShareOpen] = React.useState(false);
  const [leaveOpen, setLeaveOpen] = React.useState(false);
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const saveController = React.useRef<AbortController | null>(null);
  const selectedFile = draft.files.find((file) => file.id === selectedId) ?? null;
  const editable = identity != null && (skill ? canEditBrowserSkill(skill, identity.userId) : scope.get(canCreateSignal) === true);
  const dirty = !draftsEqual(baseline, draft);
  const shouldBlock = dirty || saving;
  const blocker = useBlocker?.(() => shouldBlock);

  React.useEffect(() => {
    if (!skillId || identity == null || access !== true) return;
    const controller = new AbortController();
    setLoadState("loading");
    loadEditorDraft(identity, skillId, controller.signal).then((loaded) => { if (!controller.signal.aborted) { setSkill(loaded.skill); setBaseline(loaded.draft); setDraft(loaded.draft); setLoadState("ready"); } }).catch(() => { if (!controller.signal.aborted) setLoadState("error"); });
    return () => controller.abort();
  }, [access, identity?.accountId, identity?.userId, loadVersion, skillId]);

  React.useEffect(() => {
    if (!shouldBlock) return;
    const preventUnload = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", preventUnload);
    return () => window.removeEventListener("beforeunload", preventUnload);
  }, [shouldBlock]);

  const toast = scope.get(toastSignal) as ToastService | null;
  const close = () => shouldBlock ? setLeaveOpen(true) : navigate("/skills", { state: { initialTab: "skills" } });
  const confirmLeave = () => { saveController.current?.abort(); setLeaveOpen(false); if (blocker?.state === "blocked") blocker.proceed(); else navigate("/skills", { state: { initialTab: "skills" } }); };
  const selectFile = (file: SupportingFile | null) => {
    setSelectedId(file?.id ?? null); setSelectedContent(file?.source.kind === "text" ? file.source.content : null); setSelectedStatus("ready");
    if (file == null || identity == null || !canEditText(file) || file.source.kind === "text") return;
    const controller = new AbortController(); setSelectedStatus("loading");
    readSupportingFile(identity, skill, file, controller.signal).then((content) => { setSelectedContent(content); setSelectedStatus("ready"); }).catch(() => setSelectedStatus("error"));
  };
  const submit = async (applyResolution = false) => {
    if (identity == null || saving) return;
    const validation = validateDraft(draft); setFailure(validation); if (validation != null) return;
    const controller = new AbortController(); saveController.current = controller; setSaving(true); setDuplicateResolution(null);
    try {
      const saved = await saveDraft(scope, identity, draft, skill, applyResolution, controller.signal);
      const nextDraft: SkillDraft = { ...draft, name: saved.name, description: saved.description ?? "", files: draft.files.map((file) => file.source.kind !== "text" && saved.sediment_id && saved.files[file.path] ? { ...file, source: { kind: "stored", reference: { file_id: saved.sediment_id, path: file.path, range: saved.files[file.path] } } } : file) };
      setSkill(saved); setBaseline(nextDraft); setDraft(nextDraft); toast?.success?.(intl.formatMessage({ defaultMessage: "Skill saved" }));
      if (saved.id !== skill?.id) navigate(`/skills/editor/${encodeURIComponent(saved.id)}`, { replace: true, state: { initialTab: "skills" } });
    } catch (error) {
      if (!controller.signal.aborted) { const resolution = applyResolution ? null : parseDuplicateResolution(error); if (resolution) setDuplicateResolution(resolution); else { setFailure("save"); toast?.error?.(messageForFailure("save")); } }
    } finally { saveController.current = null; setSaving(false); }
  };
  const removeSkill = async () => {
    if (skill == null || identity == null || deleting) return; setDeleting(true);
    try {
      await apiClient.safeDelete("/hazelnuts/{hazelnut_id}", { additionalHeaders: { "ChatGPT-Account-ID": identity.accountId }, parameters: { path: { hazelnut_id: skill.id } } });
      await deleteSkillRuntime(scope, skill); navigate("/skills", { replace: true, state: { initialTab: "skills" } });
    } catch { toast?.error?.("Couldn't delete this skill. Try again."); } finally { setDeleting(false); setDeleteOpen(false); }
  };
  const onFiles = (list: FileList | null) => {
    if (!list || !editable) return; const files = [...list]; if (files.some((file) => file.size > MAX_FILE_BYTES)) { setFailure("paths"); return; }
    setDraft({ ...draft, files: [...draft.files, ...files.map((file) => ({ id: crypto.randomUUID(), path: file.name, source: { kind: "local" as const, file } }))] }); setFailure(null);
  };

  if (access !== true || identity == null) return jsx.jsxs("main", { "data-page": "browser-skill-editor", children: [jsx.jsx("p", { role: access === false ? "alert" : "status", children: access === false ? "Skills aren't available for this account" : "Loading skill…" }), jsx.jsx("button", { onClick: close, type: "button", children: "Back" })] });
  if (skillId && loadState !== "ready") return jsx.jsxs("main", { "data-page": "browser-skill-editor", children: [jsx.jsx("p", { role: loadState === "error" ? "alert" : "status", children: loadState === "error" ? "Couldn't load this skill for editing" : "Loading skill…" }), loadState === "error" ? jsx.jsx("button", { onClick: () => setLoadVersion((value) => value + 1), type: "button", children: "Retry" }) : null, jsx.jsx("button", { onClick: close, type: "button", children: "Back" })] });

  const fileRows = buildFileRows(draft.files, new Set());
  const editorValue = selectedFile == null ? draft.instructions : selectedFile.source.kind === "text" ? selectedFile.source.content : selectedContent ?? "";
  const validationMessage = failure == null ? null : messageForFailure(failure);
  return jsx.jsxs(jsx.Fragment, { children: [
    jsx.jsxs("main", { "data-page": "browser-skill-editor", children: [
      jsx.jsxs("header", { children: [jsx.jsx("button", { onClick: close, type: "button", children: "Back" }), jsx.jsx("h1", { children: skill ? "Edit skill" : "Create skill" }), skill && identity.isWorkspace ? jsx.jsx("button", { disabled: saving, onClick: () => setShareOpen(true), type: "button", children: "Share" }) : null, skill ? jsx.jsx("button", { disabled: downloading || !skill.sediment_id || skill.permissions?.can_export === false, onClick: () => { setDownloading(true); setDownloadError(false); void downloadSkill(scope, skill).catch(() => setDownloadError(true)).finally(() => setDownloading(false)); }, type: "button", children: downloading ? "Downloading…" : "Download skill" }) : null, skill && editable ? jsx.jsx("button", { disabled: deleting || saving, onClick: () => setDeleteOpen(true), type: "button", children: "Delete" }) : null, jsx.jsx(Button, { disabled: !editable || saving || validateDraft(draft) != null || Boolean(skill && !dirty), onClick: () => void submit(), type: "button", children: saving ? "Saving…" : skill ? "Save changes" : "Create" })] }),
      !editable ? jsx.jsx("p", { role: "alert", children: "You don't have permission to edit this skill" }) : null,
      jsx.jsxs("div", { className: "browser-skill-editor-layout", children: [
        jsx.jsxs("aside", { children: [jsx.jsx("h2", { children: "Files" }), jsx.jsx("button", { disabled: !editable || saving, onClick: () => { const file = { id: crypto.randomUUID(), path: `untitled-${draft.files.length + 1}.txt`, source: { kind: "text" as const, content: "" } }; setDraft({ ...draft, files: [...draft.files, file] }); selectFile(file); }, type: "button", children: "New text file" }), jsx.jsx("input", { "aria-label": "Supporting files", disabled: !editable || saving, multiple: true, onChange: (event: { target: { files: FileList | null; value: string } }) => { onFiles(event.target.files); event.target.value = ""; }, type: "file" }), jsx.jsx("button", { className: selectedId == null ? "active" : "", onClick: () => selectFile(null), type: "button", children: "SKILL.md" }), ...draft.files.map((file) => jsx.jsxs("div", { "data-file-row": file.path, children: [jsx.jsx("button", { onClick: () => selectFile(file), type: "button", children: file.path }), editable ? jsx.jsx("button", { onClick: () => { setDraft({ ...draft, files: draft.files.filter((candidate) => candidate.id !== file.id) }); if (selectedId === file.id) selectFile(null); }, type: "button", children: "Remove" }) : null] }, file.id)), jsx.jsx("span", { hidden: true, children: String(fileRows.length) })] }),
        jsx.jsxs("section", { children: [selectedFile == null ? jsx.jsxs("div", { children: [jsx.jsx("label", { htmlFor: `${inputId}-name`, children: "Name" }), jsx.jsx("input", { disabled: !editable || saving, id: `${inputId}-name`, maxLength: 64, onChange: (event: { target: { value: string } }) => { setDraft({ ...draft, name: event.target.value }); setFailure(null); }, placeholder: "your-skill-name", value: draft.name }), jsx.jsx("label", { htmlFor: `${inputId}-description`, children: "Description" }), jsx.jsx("textarea", { disabled: !editable || saving, id: `${inputId}-description`, maxLength: 500, onChange: (event: { target: { value: string } }) => setDraft({ ...draft, description: event.target.value }), placeholder: "Describe what the skill does", value: draft.description })] }) : null, selectedStatus === "loading" ? jsx.jsx("p", { role: "status", children: "Loading file…" }) : null, selectedStatus === "error" ? jsx.jsxs("div", { role: "alert", children: ["Couldn't load this file", jsx.jsx("button", { onClick: () => selectFile(selectedFile), type: "button", children: "Retry" })] }) : null, selectedFile && !canEditText(selectedFile) ? jsx.jsx("p", { children: "Use the file menu to download and view this file" }) : jsx.jsx(CodeEditor, { code: editorValue, language: selectedFile?.path.split(".").at(-1) ?? "markdown", onChange: (value: string) => { if (!editable || saving) return; setDraft(selectedFile == null ? { ...draft, instructions: value } : { ...draft, files: draft.files.map((file) => file.id === selectedFile.id ? { ...file, source: { kind: "text", content: value } } : file) }); }, placeholder: selectedFile == null ? "Write skill instructions…" : undefined, wrapLines: true }), validationMessage ? jsx.jsx("p", { role: "alert", children: validationMessage }) : null, downloadError ? jsx.jsx("p", { role: "alert", children: "Couldn't download this skill. Try again." }) : null] })
      ] })
    ] }),
    shareOpen && skill ? jsx.jsx(SkillShareDialog, { onClose: () => setShareOpen(false), skill }) : null,
    duplicateResolution ? jsx.jsx(DuplicateSkillDialog, { disabled: saving || !editable, onCancel: () => setDuplicateResolution(null), onConfirm: () => void submit(true), resolution: duplicateResolution }) : null,
    jsx.jsx(PendingEditsDialog, { onCancel: () => { setLeaveOpen(false); blocker?.reset(); }, onConfirm: confirmLeave, open: leaveOpen || blocker?.state === "blocked" }),
    deleteOpen ? jsx.jsx("dialog", { open: true, children: jsx.jsxs("form", { onSubmit: (event: { preventDefault(): void }) => { event.preventDefault(); void removeSkill(); }, children: [jsx.jsx("h2", { children: "Delete skill?" }), jsx.jsx("p", { children: "This action cannot be undone." }), jsx.jsx("button", { onClick: () => setDeleteOpen(false), type: "button", children: "Cancel" }), jsx.jsx("button", { disabled: deleting, type: "submit", children: deleting ? "Deleting…" : "Delete" })] }) }) : null
  ] });
}

initializeRuntime(); initializeSignals(); initializeUi(); initializeButton(); initializeApi(); initializeAnalytics?.(); initializeBrowserSkillsState(); initializeBrowserSkillFiles(); initializeCodeEditor(); initializePendingEdits(); initializeShareRuntime();

export { BrowserSkillEditor };
