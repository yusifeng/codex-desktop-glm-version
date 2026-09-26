// home-artifact-templates —— Home composer 上方的 artifact 模板选择器。
//
// 原版：app/webview/assets/home-artifact-templates-1e0738b7ddeb.js。
// 该 chunk 把 reusable skill、Template Creator 和内置 Office 模板统一为
// 一个可横向滚动的画廊，并负责把选择结果写回 composer。

import * as runtimeChunk from "@rchunk/rolldown-runtime";
import * as appSharedChunk from "@rchunk/app-shared";
import * as appInitialChunk from "@rchunk/app-initial";
import * as appPrimaryChunk from "@rchunk/app-primary";
import * as staggeredItemChunk from "@rchunk/home-suggestion-staggered-item";
import * as templateCardChunk from "@rchunk/home-artifact-template-card";
import type {
  AnimationPlaybackControls,
  IntlShape,
  MaitaiScope,
  MaitaiScopeApi,
  ReadableSignal,
  ScopedQueryFamily,
} from "@rchunk/app-shared";

void runtimeChunk;

type StateSetter<T> = (value: T | ((current: T) => T)) => void;
type Component = string | ((props: Record<string, unknown>) => unknown);

interface ReactRuntime {
  Fragment: unknown;
  useEffect(
    effect: () => void | (() => void),
    dependencies?: readonly unknown[],
  ): void;
  useRef<T>(initialValue: T): { current: T };
  useState<T>(initialValue: T): [T, StateSetter<T>];
}

interface JsxRuntime {
  Fragment: unknown;
  jsx(type: unknown, props: Record<string, unknown>, key?: unknown): unknown;
  jsxs(type: unknown, props: Record<string, unknown>, key?: unknown): unknown;
}

interface ArtifactSkill {
  enabled?: boolean;
  name: string;
  path: string;
  title?: string;
}

interface GalleryMetadata {
  galleryKind: TemplateKind | string;
  sourceUrl?: string | null;
}

interface ArtifactTemplateMetadataParams {
  hostId: string;
  paths: string[];
  skillsRefreshNonce: number;
}

interface FileMetadata {
  createdAtMs?: number;
  mtimeMs?: number;
}

interface EditorTransaction {
  readonly doc: unknown;
  insertText(text: string, from: number, to: number): EditorTransaction;
  setSelection(selection: unknown): EditorTransaction;
}

interface EditorState {
  readonly doc: unknown;
  readonly selection: { readonly from: number };
  readonly tr: EditorTransaction;
}

interface ComposerController {
  appendPromptText?(text: string | undefined): void;
  focus?(): void;
  insertSkillMentionAtSelection?(skill: ArtifactSkill): void;
  insertTextAtSelection?(text: string): void;
  view?: {
    dispatch(transaction: EditorTransaction): void;
    state: EditorState;
  };
}

interface SkillQueryResult {
  forceReload(): Promise<unknown>;
  isLoading: boolean;
  skills: ArtifactSkill[];
}

interface GalleryQueryResult {
  data: Map<string, GalleryMetadata> | undefined;
  isLoading: boolean;
}

interface RemoveSkillInput {
  hostId: string;
  skillPath: string;
}

interface RemoveSkillMutation {
  isPending: boolean;
  mutate(input: RemoveSkillInput): void;
}

interface ComposerSelector {
  <T>(
    composer: ComposerController | undefined,
    selector: (composer: ComposerController) => T,
  ): T | undefined;
  <T>(
    composer: ComposerController | undefined,
    selector: (composer: ComposerController) => T,
    fallback: T,
  ): T;
}

interface AppInitialBindings {
  Body: Component;
  Header: Component;
  Panel: Component;
  Surface: Component;
  buildEditPrompt(templateCreator: ArtifactSkill, skill: ArtifactSkill): string;
  canDeleteTemplate(skill: ArtifactSkill, hostCapability: boolean): boolean;
  composerContextSignal: ReadableSignal<unknown>;
  dismissReasons?: {
    CODEX_ARTIFACT_TEMPLATE_CAROUSEL_DISMISS_REASON_CLOSE_BUTTON?: unknown;
  };
  filterSkills(
    skills: ArtifactSkill[],
    kind: TemplateKind,
    metadata: Map<string, GalleryMetadata>,
  ): ArtifactSkill[];
  getGallery(
    skills: ArtifactSkill[],
    hostId: string,
    refreshNonce: number,
  ): GalleryQueryResult;
  getScrollBounds(element: HTMLElement): { minimum: number; maximum: number };
  getSkillDisplayName(skill: ArtifactSkill): string;
  getTemplateKind(kind: string): TemplateKind | string;
  hostIdSignal: ReadableSignal<string>;
  initializeArtifactTemplates(): void;
  initializeGallery(): void;
  initializeTemplateCard(): void;
  invalidateQueries(): (queryKey: readonly unknown[]) => Promise<unknown>;
  mergeMetadata(
    skills: ArtifactSkill[],
    creationTimes: Map<string, number | null> | undefined,
    deletablePaths: Set<string>,
  ): ArtifactSkill[];
  nextScrollPosition(element: HTMLElement, direction: number): number;
  pickerScope: MaitaiScope<Record<string, unknown>>;
  readFileMetadata(event: string, payload: unknown): Promise<FileMetadata>;
  selectComposer: ComposerSelector;
  settingsSignal: ReadableSignal<boolean>;
  skillsQueryKey: readonly unknown[];
  useComposer(): ComposerController | undefined;
  useHostCapability(hostId: string): boolean;
  useRemoveSkillMutation(
    name: string,
    options: {
      onError(): void;
      onSuccess(result: { success: boolean }): Promise<void> | void;
    },
  ): RemoveSkillMutation;
  useSkills(
    context: unknown,
    hostId: string,
    options: { enabled: boolean },
  ): SkillQueryResult;
  useStoredNumber(key: string): [number, StateSetter<number>];
}

interface AppPrimaryBindings {
  closePicker(scope: MaitaiScopeApi<unknown> | undefined): void;
  dismissPicker(
    scope: MaitaiScopeApi<unknown> | undefined,
    reason: unknown,
  ): void;
  isComposerBlocked(state: EditorState | undefined): boolean;
  journeySignal: unknown;
  recordAttachment(
    scope: MaitaiScopeApi<unknown> | undefined,
    event: { attachmentPath: string; journey: unknown; templateId: string },
  ): void;
  recordCreate(scope: MaitaiScopeApi<unknown> | undefined, url: string): void;
  recordOpen(
    scope: MaitaiScopeApi<unknown> | undefined,
    kind: TemplateKind,
  ): void;
  recordUse(
    scope: MaitaiScopeApi<unknown> | undefined,
    skill: ArtifactSkill,
  ): void;
  selectedKind(document: unknown, format: unknown): TemplateKind | null;
  templateFormatSignal: ReadableSignal<unknown>;
  templatesEnabledSignal: ReadableSignal<boolean>;
}

const {
  BX: useSignalFamilyValue,
  Ct: initializeSharedRuntime,
  HX: useSignalValue,
  I3: jsxRuntimeExport,
  LX: useScope,
  QX: createQueryFamily,
  S_: IconAsset,
  Yd: arrowRightIcon,
  Yh: Button,
  ZI: appScope,
  dw: closeIcon,
  e6: reactRuntimeExport,
  m4: classNames,
  n4: useIntl,
  pk: toastSignal,
  qQ: animateNumber,
  rQ: TextSelection,
  wt: plusIcon,
} = appSharedChunk;

const {
  C5t: filterSkills,
  D5t: getTemplateKind,
  Dyt: hostIdSignal,
  E5t: mergeMetadata,
  G1: getGallery,
  Gfn: useStoredNumber,
  HZ: useComposer,
  Lz: getScrollBounds,
  M5t: getSkillDisplayName,
  O5t: initializeArtifactTemplates,
  P5t: initializeGallery,
  Qln: readFileMetadata,
  Rz: nextScrollPosition,
  Syt: composerContextSignal,
  T5t: canDeleteTemplate,
  UZ: selectComposer,
  Ukt: settingsSignal,
  XX: Body,
  YX: Panel,
  Z6t: useHostCapability,
  ZX: Header,
  _: Surface,
  b5t: buildEditPrompt,
  iun: useRemoveSkillMutation,
  kht: pickerScope,
  lEt: useSkills,
  qs: dismissReasons,
  sEt: skillsQueryKey,
  sun: invalidateQueries,
  w5t: initializeTemplateCard,
} = appInitialChunk as unknown as {
  C5t: AppInitialBindings["filterSkills"];
  D5t: AppInitialBindings["getTemplateKind"];
  Dyt: AppInitialBindings["hostIdSignal"];
  E5t: AppInitialBindings["mergeMetadata"];
  G1: AppInitialBindings["getGallery"];
  Gfn: AppInitialBindings["useStoredNumber"];
  HZ: AppInitialBindings["useComposer"];
  Lz: AppInitialBindings["getScrollBounds"];
  M5t: AppInitialBindings["getSkillDisplayName"];
  O5t: AppInitialBindings["initializeArtifactTemplates"];
  P5t: AppInitialBindings["initializeGallery"];
  Qln: AppInitialBindings["readFileMetadata"];
  Rz: AppInitialBindings["nextScrollPosition"];
  Syt: AppInitialBindings["composerContextSignal"];
  T5t: AppInitialBindings["canDeleteTemplate"];
  UZ: AppInitialBindings["selectComposer"];
  Ukt: AppInitialBindings["settingsSignal"];
  XX: AppInitialBindings["Body"];
  YX: AppInitialBindings["Panel"];
  Z6t: AppInitialBindings["useHostCapability"];
  ZX: AppInitialBindings["Header"];
  _: AppInitialBindings["Surface"];
  b5t: AppInitialBindings["buildEditPrompt"];
  iun: AppInitialBindings["useRemoveSkillMutation"];
  kht: AppInitialBindings["pickerScope"];
  lEt: AppInitialBindings["useSkills"];
  qs: AppInitialBindings["dismissReasons"];
  sEt: AppInitialBindings["skillsQueryKey"];
  sun: AppInitialBindings["invalidateQueries"];
  w5t: AppInitialBindings["initializeTemplateCard"];
};

const {
  Ci: dismissPicker,
  Ei: recordUse,
  Si: recordAttachment,
  Ti: recordCreate,
  bi: journeySignal,
  gg: templateFormatSignal,
  hg: templatesEnabledSignal,
  po: isComposerBlocked,
  vg: selectedKindFromDocument,
  vi: closePicker,
  wi: recordOpen,
} = appPrimaryChunk as unknown as {
  Ci: AppPrimaryBindings["dismissPicker"];
  Ei: AppPrimaryBindings["recordUse"];
  Si: AppPrimaryBindings["recordAttachment"];
  Ti: AppPrimaryBindings["recordCreate"];
  bi: AppPrimaryBindings["journeySignal"];
  gg: AppPrimaryBindings["templateFormatSignal"];
  hg: AppPrimaryBindings["templatesEnabledSignal"];
  po: AppPrimaryBindings["isComposerBlocked"];
  vg: AppPrimaryBindings["selectedKind"];
  vi: AppPrimaryBindings["closePicker"];
  wi: AppPrimaryBindings["recordOpen"];
};

const { n: initializeStaggeredItem, t: StaggeredItem } =
  staggeredItemChunk as unknown as { n: () => void; t: Component };
const { n: initializeTemplateCardChunk, t: TemplateCard } =
  templateCardChunk as unknown as { n: () => void; t: Component };

type TemplateKind =
  | "document"
  | "presentation"
  | "spreadsheet"
  | "site"
  | "google-drive"
  | "google-docs"
  | "google-slides"
  | "google-sheets"
  | "imagegen"
  | "product-design"
  | "email"
  | "slack";

interface BuiltInTemplate {
  id: string;
  kind: "document" | "presentation" | "spreadsheet";
  title: MessageDescriptor;
  filename: string;
  assetUrl: string;
  previewUrl: string;
}

interface MessageDescriptor {
  id: string;
  defaultMessage: string;
  description: string;
}

interface ArtifactTemplatePickerProps {
  canUseTemplateAttachments?: boolean;
  onAddFileAssetAttachment?: (input: {
    assetUrl: string;
    label: string;
  }) => Promise<{ path: string } | null | undefined>;
  placement?: "top" | "bottom" | string;
}

const TEMPLATE_CREATOR_URL = "plugin://template-creator@openai-primary-runtime";
const TEMPLATE_CREATOR_MENTION = `[@Template Creator](${TEMPLATE_CREATOR_URL})`;
const TEMPLATE_NAME_PLACEHOLDER = "__CODEX_TEMPLATE_NAME_PLACEHOLDER__";

const CREATE_PROMPTS: Record<TemplateKind, MessageDescriptor> = {
  document: {
    id: "home.artifactTemplates.createDocument.prompt",
    defaultMessage:
      "Create a new document template using {templateCreator}. First, explain how templates work and how to use them. Then ask me to upload a reference file and if needed interview me on how and when to use the template.",
    description:
      "Composer prefill for creating a document template from a reference file",
  },
  presentation: {
    id: "home.artifactTemplates.createPresentation.prompt",
    defaultMessage:
      "Create a new presentation template using {templateCreator}. First, explain how templates work and how to use them. Then ask me to upload a reference file and if needed interview me on how and when to use the template.",
    description:
      "Composer prefill for creating a presentation template from a reference file",
  },
  spreadsheet: {
    id: "home.artifactTemplates.createSpreadsheet.prompt",
    defaultMessage:
      "Create a new spreadsheet template using {templateCreator}. First, explain how templates work and how to use them. Then ask me to upload a reference file and if needed interview me on how and when to use the template.",
    description:
      "Composer prefill for creating a spreadsheet template from a reference file",
  },
  site: {
    id: "home.artifactTemplates.createSite.prompt",
    defaultMessage:
      "Create a new Site template using {templateCreator}. First, explain how templates work and how to use them. Then ask me which existing Site project to use and if needed interview me on how and when to use the template.",
    description:
      "Composer prefill for creating a Site template from an existing Site project",
  },
  "google-drive": {
    id: "home.artifactTemplates.createGoogleWorkspace.prompt",
    defaultMessage:
      "Create a new Google Workspace template using {templateCreator}. First, explain how templates work and how to use them. Then ask me to provide a Google Docs, Slides, or Sheets link and if needed interview me on how and when to use the template.",
    description:
      "Composer prefill for creating a Google Workspace template from a Google Drive link",
  },
  "google-docs": {
    id: "home.artifactTemplates.createGoogleDoc.prompt",
    defaultMessage:
      "Create a new Google Doc template using {templateCreator}. First, explain how templates work and how to use them. Then ask me to provide a Google Doc link and if needed interview me on how and when to use the template.",
    description:
      "Composer prefill for creating a Google Doc template from a Google Doc link",
  },
  "google-slides": {
    id: "home.artifactTemplates.createGoogleSlides.prompt",
    defaultMessage:
      "Create a new Google Slides template using {templateCreator}. First, explain how templates work and how to use them. Then ask me to provide a Google Slides link and if needed interview me on how and when to use the template.",
    description:
      "Composer prefill for creating a Google Slides template from a Google Slides link",
  },
  "google-sheets": {
    id: "home.artifactTemplates.createGoogleSheet.prompt",
    defaultMessage:
      "Create a new Google Sheet template using {templateCreator}. First, explain how templates work and how to use them. Then ask me to provide a Google Sheet link and if needed interview me on how and when to use the template.",
    description:
      "Composer prefill for creating a Google Sheet template from a Google Sheet link",
  },
  imagegen: {
    id: "home.artifactTemplates.createImagegen.prompt",
    defaultMessage:
      "Create a new image template for ImageGen using {templateCreator}. First, explain how templates work and how to use them. Then ask me to upload a PNG reference and if needed interview me on how and when to use the template.",
    description:
      "Composer prefill for creating an ImageGen template from a PNG reference",
  },
  "product-design": {
    id: "home.artifactTemplates.createProductDesign.prompt",
    defaultMessage:
      "Create a new image template for Product Design using {templateCreator}. First, explain how templates work and how to use them. Then ask me to upload a PNG reference and if needed interview me on how and when to use the template.",
    description:
      "Composer prefill for creating a Product Design template from a PNG reference",
  },
  email: {
    id: "home.artifactTemplates.createEmail.prompt",
    defaultMessage:
      "Create a new email template using {templateCreator}. First, explain how templates work and how to use them. Then ask me to paste or upload the reference email text and if needed interview me on how and when to use the template.",
    description:
      "Composer prefill for creating an email template from reference text",
  },
  slack: {
    id: "home.artifactTemplates.createSlack.prompt",
    defaultMessage:
      "Create a new Slack template using {templateCreator}. First, explain how templates work and how to use them. Then ask me to paste or upload the reference Slack message and if needed interview me on how and when to use the template.",
    description:
      "Composer prefill for creating a Slack template from a reference message",
  },
};

const BUILT_IN_TEMPLATES: readonly BuiltInTemplate[] = [
  builtIn(
    "project-brief",
    "document",
    "Project brief",
    "project-brief.docx",
    "project-brief-e08b85749970.docx",
    "project-brief-1b2fde67dca7.png",
  ),
  builtIn(
    "meeting-notes",
    "document",
    "Meeting notes",
    "meeting-notes.docx",
    "meeting-notes-217e093e29da.docx",
    "meeting-notes-7b6594a27c56.png",
  ),
  builtIn(
    "report-outline",
    "document",
    "Report outline",
    "report-outline.docx",
    "report-outline-d47cda7d5af6.docx",
    "report-outline-905623fd6794.png",
  ),
  builtIn(
    "monthly-business-review",
    "presentation",
    "Monthly Business Review",
    "monthly-business-review.pptx",
    "monthly-business-review-aa25b4112c50.pptx",
    "monthly-business-review-22cb5f8fa897.png",
  ),
  builtIn(
    "sales-discovery",
    "presentation",
    "Sales discovery",
    "sales-discovery.pptx",
    "sales-discovery-c8f07eacd6f2.pptx",
    "sales-discovery-85b7f00aa916.png",
  ),
  builtIn(
    "design-review",
    "presentation",
    "Design review",
    "design-review.pptx",
    "design-review-df0c95705aed.pptx",
    "design-review-f9653b2f8191.png",
  ),
  builtIn(
    "project-tracker",
    "spreadsheet",
    "Project tracker",
    "project-tracker.xlsx",
    "project-tracker-12f7a4dcd6be.xlsx",
    "project-tracker-6cad71e02486.png",
  ),
  builtIn(
    "budget-planner",
    "spreadsheet",
    "Budget planner",
    "budget-planner.xlsx",
    "budget-planner-7fc57dcf2653.xlsx",
    "budget-planner-ddcc27bcc140.png",
  ),
  builtIn(
    "content-calendar",
    "spreadsheet",
    "Content calendar",
    "content-calendar.xlsx",
    "content-calendar-f684eeebe28d.xlsx",
    "content-calendar-addfb8f880a9.png",
  ),
];

let React: ReactRuntime;
let jsx: JsxRuntime;
let initialized = false;
let artifactTemplateMetadataQuery: ScopedQueryFamily<
  Record<string, unknown>,
  ArtifactTemplateMetadataParams,
  Map<string, number | null>
>;

function builtIn(
  id: string,
  kind: BuiltInTemplate["kind"],
  title: string,
  filename: string,
  asset: string,
  preview: string,
): BuiltInTemplate {
  return {
    id,
    kind,
    title: {
      id: `home.artifactTemplates.${id.replace(/-([a-z])/g, (_, letter: string) => letter.toUpperCase())}`,
      defaultMessage: title,
      description: `Title for a ${kind} template card`,
    },
    filename,
    assetUrl: new URL(asset, import.meta.url).href,
    previewUrl: new URL(preview, import.meta.url).href,
  };
}

function format(
  intl: IntlShape | undefined,
  descriptor: MessageDescriptor,
  values: Record<string, unknown> = {},
): string {
  if (intl?.formatMessage != null)
    return intl.formatMessage(descriptor, values);
  return descriptor.defaultMessage.replace(/\{([^}]+)\}/g, (_, key: string) =>
    String(values[key] ?? `{${key}}`),
  );
}

function useSignal<T>(signal: ReadableSignal<T>): T {
  return useSignalValue(signal);
}

function createArtifactTemplateMetadataQuery(): ScopedQueryFamily<
  Record<string, unknown>,
  ArtifactTemplateMetadataParams,
  Map<string, number | null>
> {
  return createQueryFamily<
    Record<string, unknown>,
    ArtifactTemplateMetadataParams,
    Map<string, number | null>
  >(appScope, ({ hostId, paths, skillsRefreshNonce }) => ({
    queryKey: [
      "artifact-template-skill-creation-times",
      hostId,
      skillsRefreshNonce,
      ...paths,
    ],
    queryFn: async ({ signal }: { signal: AbortSignal }) => {
      const entries = await Promise.all(
        paths.map(async (path: string) => {
          try {
            const metadata = await readFileMetadata("read-file-metadata", {
              params: { hostId, path },
              signal,
            });
            const createdAt = metadata?.createdAtMs;
            return [
              path,
              createdAt != null && createdAt > 0
                ? createdAt
                : (metadata?.mtimeMs ?? null),
            ] as const;
          } catch (error) {
            if (signal.aborted) throw error;
            return [path, null] as const;
          }
        }),
      );
      return new Map(entries);
    },
    enabled: paths.length > 0,
    staleTime: 0,
  }));
}

function isTemplateCreator(skill: ArtifactSkill): boolean {
  return Boolean(
    skill?.enabled &&
    (skill.name === "template-creator" ||
      skill.name?.endsWith(":template-creator")),
  );
}

function skillPath(skill: ArtifactSkill): string {
  return skill.path;
}

function showDangerToast(
  scope: MaitaiScopeApi<unknown> | undefined,
  intl: IntlShape | undefined,
  descriptor: MessageDescriptor,
): void {
  scope?.get(toastSignal).danger(format(intl, descriptor), {
    errorAnalytics: { toastId: descriptor.id },
  });
}

function useRemoveTemplate(forceReload: () => Promise<unknown>): {
  isPending: boolean;
  mutate(input: RemoveSkillInput): void;
} {
  const scope = useScope(appScope);
  const intl = useIntl();
  const invalidate = invalidateQueries();
  const [, setNonce] = useStoredNumber("skills_refresh_nonce");
  const onError = () =>
    showDangerToast(scope, intl, {
      id: "home.artifactTemplates.deleteFailed",
      defaultMessage: "Unable to delete template",
      description:
        "Toast shown when deleting a personal artifact template fails",
    });
  const onSuccess = async ({ success }: { success: boolean }) => {
    if (!success) return onError();
    try {
      await forceReload();
      await invalidate(skillsQueryKey);
      setNonce((value) => value + 1);
      scope.get(toastSignal).success(
        format(intl, {
          id: "home.artifactTemplates.deleteSuccess",
          defaultMessage: "Template deleted",
          description:
            "Toast shown after deleting a personal artifact template succeeds",
        }),
      );
    } catch {
      showDangerToast(scope, intl, {
        id: "home.artifactTemplates.refreshAfterDeleteFailed",
        defaultMessage: "Template deleted, but the gallery could not refresh",
        description:
          "Toast shown when the template was deleted but refreshing the template gallery fails",
      });
    }
  };
  return useRemoveSkillMutation("remove-skill", { onSuccess, onError });
}

interface TemplateCreatorCardProps {
  isDocumentTemplates: boolean;
  label: string;
  onClick(): void;
}

function TemplateCreatorCard({
  isDocumentTemplates,
  label,
  onClick,
}: TemplateCreatorCardProps): unknown {
  return jsx.jsxs("button", {
    type: "button",
    className:
      "group relative flex w-full cursor-interaction flex-col gap-2 rounded-2xl text-start outline-none focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-ring",
    onClick,
    children: [
      jsx.jsx("div", {
        className: classNames(
          "relative flex items-center justify-center overflow-hidden rounded-xl border border-default bg-surface-secondary/85 shadow-sm ring-4 ring-transparent group-hover:border-strong group-hover:bg-text/5 group-focus-visible:ring-ring",
          isDocumentTemplates ? "aspect-[4/5]" : "aspect-video",
        ),
        children: jsx.jsx(IconAsset, {
          className: "text-text-tertiary/60 group-hover:text-codex-icon",
          "aria-hidden": true,
          asset: plusIcon,
        }),
      }),
      jsx.jsx("div", {
        className:
          "min-w-0 -translate-y-0.5 truncate ps-0.5 pe-2 pb-1 text-sm leading-5 font-normal tracking-normal text-secondary group-hover:text-default group-focus-visible:text-default",
        children: label,
      }),
    ],
  });
}

interface BuiltInTemplateGalleryProps {
  createTemplateCard: unknown;
  kind: TemplateKind | string;
  onAttachTemplate(
    template: BuiltInTemplate,
  ): Promise<{ path: string } | null | undefined>;
}

function BuiltInTemplateGallery({
  createTemplateCard,
  kind,
  onAttachTemplate,
}: BuiltInTemplateGalleryProps): unknown {
  const scope = useScope(appScope);
  const composer = useComposer();
  const intl = useIntl();
  const [attachingId, setAttachingId] = React.useState<string | null>(null);
  const portrait = kind === "document" || kind === "google-docs";
  const all = BUILT_IN_TEMPLATES.filter((template) => template.kind === kind);
  const templates = all.slice(
    0,
    !portrait && createTemplateCard != null ? 2 : undefined,
  );

  const attach = async (template: BuiltInTemplate) => {
    setAttachingId(template.id);
    try {
      if ((await onAttachTemplate(template)) != null) composer?.focus?.();
    } catch {
      showDangerToast(scope, intl, {
        id: "home.artifactTemplates.attachError",
        defaultMessage: "Unable to attach template",
        description:
          "Toast shown when attaching a document, presentation, or spreadsheet template fails",
      });
    } finally {
      setAttachingId(null);
    }
  };

  return jsx.jsxs("div", {
    className: classNames(
      "hide-scrollbar grid snap-x snap-mandatory grid-flow-col gap-4 overflow-x-auto scroll-pe-4 scroll-ps-3 pe-4 ps-3 py-1 sm:snap-none sm:grid-flow-row sm:auto-cols-auto sm:overflow-visible",
      portrait
        ? "auto-cols-[min(14rem,80vw)] sm:grid-cols-4"
        : "auto-cols-[min(18rem,85vw)] sm:grid-cols-3",
    ),
    role: "group",
    "aria-label": format(intl, {
      id: "home.artifactTemplates.gallery",
      defaultMessage: "Templates",
      description:
        "Accessible label for the document, presentation, or spreadsheet template gallery",
    }),
    children: [
      templates.map((template, index) =>
        jsx.jsx(
          StaggeredItem,
          {
            className: "-m-1 min-w-0 snap-start p-1 sm:snap-none",
            index,
            variant: "card",
            children: jsx.jsxs("button", {
              type: "button",
              className:
                "group relative flex w-full cursor-interaction flex-col gap-2 rounded-2xl text-start outline-none focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-ring disabled:cursor-default disabled:opacity-70",
              "aria-label": `Attach ${format(intl, template.title)}`,
              disabled: attachingId != null,
              onClick: () => void attach(template),
              children: [
                jsx.jsxs("div", {
                  className: classNames(
                    "relative overflow-hidden rounded-xl border border-default bg-surface shadow-sm ring-4 ring-transparent group-hover:border-strong group-focus-visible:ring-ring",
                    portrait ? "aspect-[4/5]" : "aspect-video",
                  ),
                  children: [
                    jsx.jsx("img", {
                      src: template.previewUrl,
                      alt: "",
                      className: classNames(
                        "h-full w-full object-top",
                        portrait ? "object-contain" : "object-cover",
                        attachingId === template.id &&
                          "motion-safe:animate-pulse",
                      ),
                      draggable: false,
                    }),
                    jsx.jsx("div", {
                      "aria-hidden": true,
                      className:
                        "pointer-events-none absolute inset-0 flex items-center justify-center bg-text/0 text-text-primary-solid/0 group-hover:bg-text/25 group-hover:text-primary-solid group-focus-visible:bg-text/25 group-focus-visible:text-primary-solid",
                      children: jsx.jsx(IconAsset, {
                        "aria-hidden": true,
                        asset: plusIcon,
                      }),
                    }),
                  ],
                }),
                jsx.jsx("div", {
                  className:
                    "min-w-0 -translate-y-0.5 truncate ps-0.5 pe-2 pb-1 text-sm leading-5 font-normal tracking-normal text-secondary group-hover:text-default group-focus-visible:text-default",
                  children: format(intl, template.title),
                }),
              ],
            }),
          },
          template.id,
        ),
      ),
      createTemplateCard == null
        ? null
        : jsx.jsx(StaggeredItem, {
            className: "-m-1 min-w-0 snap-start p-1 sm:snap-none",
            index: templates.length,
            variant: "card",
            children: createTemplateCard,
          }),
    ],
  });
}

function insertTemplateMention(
  composer: ComposerController | undefined,
  scope: MaitaiScopeApi<unknown> | undefined,
  intl: IntlShape | undefined,
  skill: ArtifactSkill,
): void {
  const editor = composer?.view;
  if (editor?.state != null) {
    const end = TextSelection.atEnd(editor.state.doc);
    const before = end.$from?.nodeBefore;
    editor.dispatch(editor.state.tr.setSelection(end));
    if (before != null && (!before.isText || !/\s$/.test(before.text ?? ""))) {
      composer.insertTextAtSelection?.(" ");
    }
  }

  const prompt = format(
    intl,
    {
      id: "home.artifactTemplates.useTemplate.prompt",
      defaultMessage: `Use the ${TEMPLATE_NAME_PLACEHOLDER} template.`,
      description: "Composer text added after selecting an artifact template",
    },
    { templateName: TEMPLATE_NAME_PLACEHOLDER },
  );
  const placeholder = prompt.indexOf(TEMPLATE_NAME_PLACEHOLDER);
  if (placeholder < 0) {
    composer?.insertSkillMentionAtSelection?.(skill);
    composer?.insertTextAtSelection?.(prompt);
  } else {
    composer?.insertTextAtSelection?.(prompt.slice(0, placeholder));
    composer?.insertSkillMentionAtSelection?.(skill);
    const suffix = prompt
      .slice(placeholder + TEMPLATE_NAME_PLACEHOLDER.length)
      .replaceAll(
        TEMPLATE_NAME_PLACEHOLDER,
        getSkillDisplayName(skill) ?? skill.title ?? skill.name,
      );
    if (editor?.state != null) {
      const { state, dispatch } = editor;
      const from = state.selection.from - 1;
      const transaction = state.tr.insertText(
        suffix,
        from,
        state.selection.from,
      );
      transaction.setSelection(
        TextSelection.create(transaction.doc, from + suffix.length),
      );
      dispatch(transaction);
    } else {
      composer?.insertTextAtSelection?.(suffix);
    }
  }
  recordUse(scope, skill);
}

function ArtifactTemplatePicker({
  canUseTemplateAttachments = false,
  onAddFileAssetAttachment,
  placement = "top",
}: ArtifactTemplatePickerProps): unknown {
  initializeHomeArtifactTemplates();
  const scope = useScope(pickerScope);
  const composer = useComposer();
  const scrollRef = React.useRef<HTMLElement | null>(null);
  const resizeObserverRef = React.useRef<ResizeObserver | null>(null);
  const scrollKeyRef = React.useRef("");
  const scrollAnimationRef = React.useRef<AnimationPlaybackControls | null>(
    null,
  );
  const [canScrollBackward, setCanScrollBackward] = React.useState(false);
  const [canScrollForward, setCanScrollForward] = React.useState(false);
  const context = useSignal(composerContextSignal);
  const hostId = useSignal(hostIdSignal);
  const hostCapability = useHostCapability(hostId);
  const setting = useSignal(settingsSignal);
  const [skillsRefreshNonce] = useStoredNumber("skills_refresh_nonce");
  const templatesEnabled = useSignal(templatesEnabledSignal);
  const templateFormat = useSignal(templateFormatSignal);
  const intl = useIntl();
  const composerState =
    selectComposer(composer, (value) => isComposerBlocked(value.view?.state)) ??
    false;
  const selectedKind = selectComposer(
    composer,
    (value) => selectedKindFromDocument(value.view?.state.doc, templateFormat),
    "document",
  );
  const activeKind: TemplateKind | null =
    templatesEnabled && !composerState ? selectedKind : null;
  const queryOptions = { enabled: activeKind != null && !hostCapability };
  const skillResult = useSkills(context ?? undefined, hostId, queryOptions);
  const { forceReload, isLoading: skillsLoading, skills = [] } = skillResult;
  const { isPending: deletePending, mutate: removeSkill } =
    useRemoveTemplate(forceReload);
  const relevantSkills = activeKind == null ? [] : skills;
  const galleryResult = getGallery(relevantSkills, hostId, skillsRefreshNonce);
  const galleryMetadata = galleryResult.data;
  const galleryLoading = galleryResult.isLoading === true;
  const reusableSkills =
    activeKind == null || galleryMetadata == null
      ? []
      : filterSkills(skills, activeKind, galleryMetadata);
  const canDelete = (skill: ArtifactSkill) =>
    canDeleteTemplate(skill, useHostCapability(hostId));
  const deletablePaths = new Set(
    reusableSkills.filter(canDelete).map(skillPath),
  );
  const metadataPaths = [...deletablePaths];
  const creationTimes = useSignalFamilyValue(artifactTemplateMetadataQuery, {
    hostId,
    paths: metadataPaths,
    skillsRefreshNonce,
  }).data;
  const visibleSkills = mergeMetadata(
    reusableSkills,
    creationTimes,
    deletablePaths,
  );
  const templateCreator = skills.find(isTemplateCreator);
  const canCreate = templateCreator != null && canUseTemplateAttachments;
  const galleryKind =
    activeKind === "google-drive" ? null : getTemplateKind(activeKind);
  const isDocumentTemplates =
    activeKind === "document" || activeKind === "google-docs";
  const cardWidth = isDocumentTemplates
    ? "basis-[min(14rem,80vw)] sm:basis-[calc((100%_+_2rem)/5)]"
    : "basis-[min(18rem,85vw)] sm:basis-1/3";
  const isGoogleDriveGallery = activeKind === "google-drive";

  React.useEffect(() => {
    if (activeKind != null) recordOpen(scope, activeKind);
  }, [scope, activeKind]);

  const hadTemplates = React.useRef(false);
  React.useEffect(() => {
    if (!templatesEnabled) {
      hadTemplates.current = false;
    } else if (!composerState) {
      if (visibleSkills.length > 0) hadTemplates.current = true;
      else if (!skillsLoading && !galleryLoading && hadTemplates.current)
        closePicker(scope);
    }
  }, [
    skillsLoading,
    galleryLoading,
    scope,
    composerState,
    templatesEnabled,
    visibleSkills.length,
  ]);

  if (activeKind == null) return null;

  const updateScrollState = (element: HTMLElement) => {
    const bounds = getScrollBounds(element);
    setCanScrollBackward(element.scrollLeft > bounds.minimum + 1);
    setCanScrollForward(element.scrollLeft < bounds.maximum - 1);
  };
  const galleryKey = [
    ...visibleSkills.map(skillPath),
    ...(canCreate ? ["create-template"] : []),
  ].join("\n");
  const bindScrollContainer = (element: HTMLElement | null) => {
    resizeObserverRef.current?.disconnect?.();
    scrollRef.current = element;
    if (element == null || galleryKey === "") return;
    if (scrollKeyRef.current !== galleryKey) {
      scrollKeyRef.current = galleryKey;
      scrollAnimationRef.current?.stop?.();
      element.style.removeProperty("scroll-snap-type");
      const bounds = getScrollBounds(element);
      element.scrollTo({ left: bounds.minimum });
    }
    updateScrollState(element);
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(() => updateScrollState(element));
    observer.observe(element);
    for (const child of element.children) observer.observe(child);
    resizeObserverRef.current = observer;
  };
  const scroll = (direction: number) => {
    const element = scrollRef.current;
    if (element == null) return;
    scrollAnimationRef.current?.stop?.();
    const left = nextScrollPosition(element, direction);
    if (setting) {
      element.scrollTo({ left });
      element.style.removeProperty("scroll-snap-type");
      updateScrollState(element);
    } else {
      element.style.scrollSnapType = "none";
      scrollAnimationRef.current = animateNumber(element.scrollLeft, left, {
        duration: 0.2,
        ease: [0.165, 0.84, 0.44, 1],
        onUpdate: (value: number) => element.scrollTo({ left: value }),
        onComplete: () => {
          element.style.removeProperty("scroll-snap-type");
          if (scrollRef.current === element) updateScrollState(element);
        },
      });
    }
  };
  const useTemplate = (skill: ArtifactSkill) =>
    insertTemplateMention(composer, scope, intl, skill);
  const createTemplate = () => {
    recordCreate(scope, TEMPLATE_CREATOR_URL);
    composer?.appendPromptText?.(
      format(intl, CREATE_PROMPTS[activeKind], {
        templateCreator: TEMPLATE_CREATOR_MENTION,
      }),
    );
  };
  const createCard = canCreate
    ? jsx.jsx(TemplateCreatorCard, {
        isDocumentTemplates,
        label: format(intl, {
          id: "home.artifactTemplates.create",
          defaultMessage: "Create a template",
          description:
            "Accessible label for adding the Template Creator skill from the artifact template gallery",
        }),
        onClick: createTemplate,
      })
    : null;
  const builtInGallery =
    visibleSkills.length === 0 &&
    !skillsLoading &&
    !galleryLoading &&
    galleryKind != null &&
    canUseTemplateAttachments &&
    onAddFileAssetAttachment != null
      ? jsx.jsx(BuiltInTemplateGallery, {
          createTemplateCard: createCard,
          kind: galleryKind,
          onAttachTemplate: async (template: BuiltInTemplate) => {
            const journey = scope.get(journeySignal);
            const attachment = await onAddFileAssetAttachment({
              assetUrl: template.assetUrl,
              label: template.filename,
            });
            if (attachment == null) return null;
            recordAttachment(scope, {
              attachmentPath: attachment.path,
              journey,
              templateId: template.id,
            });
            return attachment;
          },
        })
      : null;
  const reusableGallery =
    visibleSkills.length > 0 || (galleryKind == null && createCard != null)
      ? jsx.jsxs("div", {
          ref: bindScrollContainer,
          className:
            "hide-scrollbar flex snap-x snap-mandatory scroll-px-3 gap-3 overflow-x-auto px-3 py-1",
          role: "group",
          "aria-label": "Templates",
          onScroll: (event: { currentTarget: HTMLElement }) =>
            updateScrollState(event.currentTarget),
          children: [
            visibleSkills.map((skill: ArtifactSkill, index: number) => {
              const metadata = galleryMetadata?.get?.(skill.path);
              if (metadata == null) return null;
              return jsx.jsx(
                StaggeredItem,
                {
                  className: classNames(
                    "-m-1 min-w-0 shrink-0 snap-start p-1",
                    isGoogleDriveGallery ? "w-fit" : cardWidth,
                  ),
                  index,
                  variant: "card",
                  children: jsx.jsx(TemplateCard, {
                    hostId,
                    deleteDisabled: deletePending,
                    onDelete: deletablePaths.has(skill.path)
                      ? () => removeSkill({ hostId, skillPath: skill.path })
                      : undefined,
                    onEdit:
                      templateCreator == null
                        ? undefined
                        : () =>
                            composer?.appendPromptText?.(
                              buildEditPrompt(templateCreator, skill),
                            ),
                    onUse: () => useTemplate(skill),
                    skill,
                    sourceUrl: metadata.sourceUrl,
                    templateKind: getTemplateKind(metadata.galleryKind),
                    isGoogleDriveGallery,
                  }),
                },
                skill.path,
              );
            }),
            createCard == null
              ? null
              : jsx.jsx(StaggeredItem, {
                  className: classNames(
                    "-m-1 min-w-0 shrink-0 snap-start p-1",
                    cardWidth,
                  ),
                  index: visibleSkills.length,
                  variant: "card",
                  children: createCard,
                }),
          ],
        })
      : null;

  const scrollButtons =
    visibleSkills.length === 0
      ? null
      : jsx.jsxs(jsx.Fragment, {
          children: [
            jsx.jsx(Button, {
              "aria-label": "Show previous templates",
              color: "ghost",
              disabled: !canScrollBackward,
              onClick: () => scroll(-1),
              size: "toolbar",
              uniform: true,
              children: jsx.jsx(IconAsset, {
                className: "rotate-180",
                "aria-hidden": true,
                asset: arrowRightIcon,
              }),
            }),
            jsx.jsx(Button, {
              "aria-label": "Show more templates",
              color: "ghost",
              disabled: !canScrollForward,
              onClick: () => scroll(1),
              size: "toolbar",
              uniform: true,
              children: jsx.jsx(IconAsset, {
                "aria-hidden": true,
                asset: arrowRightIcon,
              }),
            }),
          ],
        });
  const close = () => {
    dismissPicker(
      scope,
      dismissReasons?.CODEX_ARTIFACT_TEMPLATE_CAROUSEL_DISMISS_REASON_CLOSE_BUTTON,
    );
    closePicker(scope);
  };

  return jsx.jsx(Surface, {
    isActive: true,
    placement,
    spacing: "compact",
    children: jsx.jsxs(Panel, {
      className: "max-h-[320px]",
      padded: false,
      children: [
        jsx.jsxs(Header, {
          background: "transparent",
          className: "flex h-9 items-center justify-between gap-3 ps-3 pe-1",
          children: [
            jsx.jsx("div", {
              className: "min-w-0 truncate",
              children: "Templates",
            }),
            jsx.jsxs("div", {
              className: "flex shrink-0 items-center gap-1",
              children: [
                scrollButtons,
                jsx.jsx(Button, {
                  "aria-label": "Close templates",
                  color: "ghost",
                  onClick: close,
                  size: "toolbar",
                  uniform: true,
                  children: jsx.jsx(IconAsset, {
                    "aria-hidden": true,
                    asset: closeIcon,
                  }),
                }),
              ],
            }),
          ],
        }),
        jsx.jsxs(Body, { children: [builtInGallery, reusableGallery] }),
      ],
    }),
  });
}

function initializeHomeArtifactTemplates(): void {
  if (initialized) return;
  initialized = true;
  initializeSharedRuntime();
  React = resolveRuntimeExport<ReactRuntime>(reactRuntimeExport);
  jsx = resolveRuntimeExport<JsxRuntime>(jsxRuntimeExport);
  initializeStaggeredItem();
  initializeTemplateCardChunk();
  initializeArtifactTemplates();
  initializeGallery();
  initializeTemplateCard();
  artifactTemplateMetadataQuery = createArtifactTemplateMetadataQuery();
}

function resolveRuntimeExport<T>(value: unknown): T {
  return (typeof value === "function" ? value() : value) as T;
}

initializeHomeArtifactTemplates();

export { ArtifactTemplatePicker };
