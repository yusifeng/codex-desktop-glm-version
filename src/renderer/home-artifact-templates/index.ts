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

void runtimeChunk;

const appShared = appSharedChunk as Record<string, any>;
const appInitial = appInitialChunk as Record<string, any>;
const appPrimary = appPrimaryChunk as Record<string, any>;
const staggeredItem = staggeredItemChunk as Record<string, any>;
const templateCard = templateCardChunk as Record<string, any>;

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

let React: any;
let jsx: any;
let initialized = false;
let artifactTemplateMetadataQuery: any;

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
  intl: any,
  descriptor: MessageDescriptor,
  values: Record<string, any> = {},
): string {
  if (intl?.formatMessage != null)
    return intl.formatMessage(descriptor, values);
  return descriptor.defaultMessage.replace(/\{([^}]+)\}/g, (_, key: string) =>
    String(values[key] ?? `{${key}}`),
  );
}

function useSignal(signal: any): any {
  return typeof appShared.HX === "function" ? appShared.HX(signal) : signal;
}

function createArtifactTemplateMetadataQuery(): any {
  if (typeof appShared.QX !== "function") return null;
  return appShared.QX(
    appShared.ZI,
    ({ hostId, paths, skillsRefreshNonce }: Record<string, any>) => ({
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
              const metadata = await appInitial.Qln("read-file-metadata", {
                params: { hostId, path },
                signal,
              });
              const createdAt = metadata?.createdAtMs;
              return [
                path,
                createdAt != null && createdAt > 0
                  ? createdAt
                  : (metadata?.mtimeMs ?? null),
              ];
            } catch (error) {
              if (signal.aborted) throw error;
              return [path, null];
            }
          }),
        );
        return new Map(entries);
      },
      enabled: paths.length > 0,
      staleTime: 0,
    }),
  );
}

function isTemplateCreator(skill: any): boolean {
  return Boolean(
    skill?.enabled &&
    (skill.name === "template-creator" ||
      skill.name?.endsWith(":template-creator")),
  );
}

function skillPath(skill: any): string {
  return skill.path;
}

function showDangerToast(
  scope: any,
  intl: any,
  descriptor: MessageDescriptor,
): void {
  scope?.get?.(appShared.pk)?.danger?.(format(intl, descriptor), {
    errorAnalytics: { toastId: descriptor.id },
  });
}

function useRemoveTemplate(forceReload: () => Promise<unknown>): {
  isPending: boolean;
  mutate(input: any): void;
} {
  const scope = appShared.LX?.(appShared.ZI);
  const intl = appShared.n4?.();
  const invalidate = appInitial.sun?.() ?? (async () => {});
  const nonceState = appInitial.Gfn?.("skills_refresh_nonce") ?? [0, () => {}];
  const setNonce = nonceState[1] ?? (() => {});
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
      await invalidate(appInitial.sEt);
      setNonce((value: number | undefined) => (value ?? 0) + 1);
      scope?.get?.(appShared.pk)?.success?.(
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
  return (
    appInitial.iun?.("remove-skill", { onSuccess, onError }) ?? {
      isPending: false,
      mutate: () => {},
    }
  );
}

function TemplateCreatorCard({
  isDocumentTemplates,
  label,
  onClick,
}: Record<string, any>): unknown {
  const Icon = appShared.S_ ?? "span";
  return jsx.jsxs("button", {
    type: "button",
    className:
      "group relative flex w-full cursor-interaction flex-col gap-2 rounded-2xl text-start outline-none focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-ring",
    onClick,
    children: [
      jsx.jsx("div", {
        className: appShared.m4?.(
          "relative flex items-center justify-center overflow-hidden rounded-xl border border-default bg-surface-secondary/85 shadow-sm ring-4 ring-transparent group-hover:border-strong group-hover:bg-text/5 group-focus-visible:ring-ring",
          isDocumentTemplates ? "aspect-[4/5]" : "aspect-video",
        ),
        children: jsx.jsx(Icon, {
          className: "text-text-tertiary/60 group-hover:text-codex-icon",
          "aria-hidden": true,
          asset: appShared.wt,
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

function BuiltInTemplateGallery({
  createTemplateCard,
  kind,
  onAttachTemplate,
}: Record<string, any>): unknown {
  const scope = appShared.LX?.(appShared.ZI);
  const composer = appInitial.HZ?.();
  const intl = appShared.n4?.();
  const [attachingId, setAttachingId] = React.useState(null);
  const portrait = kind === "document" || kind === "google-docs";
  const all = BUILT_IN_TEMPLATES.filter((template) => template.kind === kind);
  const templates = all.slice(
    0,
    !portrait && createTemplateCard != null ? 2 : undefined,
  );
  const StaggeredItem = staggeredItem.t ?? React.Fragment;
  const Icon = appShared.S_ ?? "span";

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
    className: appShared.m4?.(
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
                  className: appShared.m4?.(
                    "relative overflow-hidden rounded-xl border border-default bg-surface shadow-sm ring-4 ring-transparent group-hover:border-strong group-focus-visible:ring-ring",
                    portrait ? "aspect-[4/5]" : "aspect-video",
                  ),
                  children: [
                    jsx.jsx("img", {
                      src: template.previewUrl,
                      alt: "",
                      className: appShared.m4?.(
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
                      children: jsx.jsx(Icon, {
                        "aria-hidden": true,
                        asset: appShared.wt,
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
  composer: any,
  scope: any,
  intl: any,
  skill: any,
): void {
  const editor = composer?.view;
  if (editor?.state != null && appShared.rQ?.atEnd != null) {
    const end = appShared.rQ.atEnd(editor.state.doc);
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
        appInitial.M5t?.(skill) ?? skill.title ?? skill.name,
      );
    if (editor?.state != null && appShared.rQ?.create != null) {
      const { state, dispatch } = editor;
      const from = state.selection.from - 1;
      const transaction = state.tr.insertText(
        suffix,
        from,
        state.selection.from,
      );
      transaction.setSelection(
        appShared.rQ.create(transaction.doc, from + suffix.length),
      );
      dispatch(transaction);
    } else {
      composer?.insertTextAtSelection?.(suffix);
    }
  }
  appPrimary.Ei?.(scope, skill);
}

function ArtifactTemplatePicker({
  canUseTemplateAttachments = false,
  onAddFileAssetAttachment,
  placement = "top",
}: ArtifactTemplatePickerProps): unknown {
  initializeHomeArtifactTemplates();
  const scope = appShared.LX?.(appInitial.kht);
  const composer = appInitial.HZ?.();
  const scrollRef = React.useRef(null);
  const resizeObserverRef = React.useRef(null);
  const scrollKeyRef = React.useRef("");
  const scrollAnimationRef = React.useRef(null);
  const [canScrollBackward, setCanScrollBackward] = React.useState(false);
  const [canScrollForward, setCanScrollForward] = React.useState(false);
  const context = useSignal(appInitial.Syt);
  const hostId = useSignal(appInitial.Dyt);
  const hostCapability = appInitial.Z6t?.(hostId);
  const setting = useSignal(appInitial.Ukt);
  const refreshNonceState = appInitial.Gfn?.("skills_refresh_nonce") ?? [0];
  const skillsRefreshNonce = refreshNonceState[0];
  const templatesEnabled = useSignal(appPrimary.hg);
  const templateFormat = useSignal(appPrimary.gg);
  const intl = appShared.n4?.();
  const composerState =
    appInitial.UZ?.(composer, (value: any) =>
      appPrimary.po?.(value.view.state),
    ) ?? false;
  const selectedKind =
    appInitial.UZ?.(
      composer,
      (value: any) => appPrimary.vg?.(value.view.state.doc, templateFormat),
      "document",
    ) ?? null;
  const activeKind: TemplateKind | null =
    templatesEnabled && !composerState ? selectedKind : null;
  const queryOptions = { enabled: activeKind != null && !hostCapability };
  const skillResult = appInitial.lEt?.(
    context ?? undefined,
    hostId,
    queryOptions,
  ) ?? {
    forceReload: async () => {},
    isLoading: false,
    skills: [],
  };
  const { forceReload, isLoading: skillsLoading, skills = [] } = skillResult;
  const { isPending: deletePending, mutate: removeSkill } =
    useRemoveTemplate(forceReload);
  const relevantSkills = activeKind == null ? [] : skills;
  const galleryResult = appInitial.G1?.(
    relevantSkills,
    hostId,
    skillsRefreshNonce,
  ) ?? {
    data: new Map(),
    isLoading: false,
  };
  const galleryMetadata = galleryResult.data;
  const galleryLoading = galleryResult.isLoading === true;
  const filterSkills = appInitial.C5t ?? ((value: any[]) => value);
  const reusableSkills =
    activeKind == null || galleryMetadata == null
      ? []
      : filterSkills(skills, activeKind, galleryMetadata);
  const canDelete = (skill: any) =>
    appInitial.T5t?.(skill, appInitial.Z6t?.(hostId)) ?? true;
  const deletablePaths = new Set(
    reusableSkills.filter(canDelete).map(skillPath),
  );
  const metadataPaths = [...deletablePaths];
  const creationTimes = appShared.BX?.(artifactTemplateMetadataQuery, {
    hostId,
    paths: metadataPaths,
    skillsRefreshNonce,
  })?.data;
  const mergeMetadata = appInitial.E5t ?? ((value: any[]) => value);
  const visibleSkills = mergeMetadata(
    reusableSkills,
    creationTimes,
    deletablePaths,
  );
  const templateCreator = skills.find(isTemplateCreator);
  const canCreate = templateCreator != null && canUseTemplateAttachments;
  const galleryKind =
    activeKind === "google-drive"
      ? null
      : (appInitial.D5t?.(activeKind) ?? activeKind);
  const isDocumentTemplates =
    activeKind === "document" || activeKind === "google-docs";
  const cardWidth = isDocumentTemplates
    ? "basis-[min(14rem,80vw)] sm:basis-[calc((100%_+_2rem)/5)]"
    : "basis-[min(18rem,85vw)] sm:basis-1/3";
  const isGoogleDriveGallery = activeKind === "google-drive";
  const StaggeredItem = staggeredItem.t ?? React.Fragment;
  const TemplateCard = templateCard.t ?? "div";

  React.useEffect(() => {
    if (activeKind != null) appPrimary.wi?.(scope, activeKind);
  }, [scope, activeKind]);

  const hadTemplates = React.useRef(false);
  React.useEffect(() => {
    if (!templatesEnabled) {
      hadTemplates.current = false;
    } else if (!composerState) {
      if (visibleSkills.length > 0) hadTemplates.current = true;
      else if (!skillsLoading && !galleryLoading && hadTemplates.current)
        appPrimary.vi?.(scope);
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

  const updateScrollState = (element: any) => {
    const bounds = appInitial.Lz?.(element) ?? {
      minimum: 0,
      maximum: Math.max(0, element.scrollWidth - element.clientWidth),
    };
    setCanScrollBackward(element.scrollLeft > bounds.minimum + 1);
    setCanScrollForward(element.scrollLeft < bounds.maximum - 1);
  };
  const galleryKey = [
    ...visibleSkills.map(skillPath),
    ...(canCreate ? ["create-template"] : []),
  ].join("\n");
  const bindScrollContainer = (element: any) => {
    resizeObserverRef.current?.disconnect?.();
    scrollRef.current = element;
    if (element == null || galleryKey === "") return;
    if (scrollKeyRef.current !== galleryKey) {
      scrollKeyRef.current = galleryKey;
      scrollAnimationRef.current?.stop?.();
      element.style.removeProperty("scroll-snap-type");
      const bounds = appInitial.Lz?.(element) ?? { minimum: 0 };
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
    const element: any = scrollRef.current;
    if (element == null) return;
    scrollAnimationRef.current?.stop?.();
    const left =
      appInitial.Rz?.(element, direction) ??
      element.scrollLeft + direction * element.clientWidth;
    if (setting) {
      element.scrollTo({ left });
      element.style.removeProperty("scroll-snap-type");
      updateScrollState(element);
    } else {
      element.style.scrollSnapType = "none";
      scrollAnimationRef.current = appShared.qQ?.(element.scrollLeft, left, {
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
  const useTemplate = (skill: any) =>
    insertTemplateMention(composer, scope, intl, skill);
  const createTemplate = () => {
    appPrimary.Ti?.(scope, TEMPLATE_CREATOR_URL);
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
            const journey = scope?.get?.(appPrimary.bi);
            const attachment = await onAddFileAssetAttachment({
              assetUrl: template.assetUrl,
              label: template.filename,
            });
            if (attachment == null) return null;
            appPrimary.Si?.(scope, {
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
          onScroll: (event: any) => updateScrollState(event.currentTarget),
          children: [
            visibleSkills.map((skill: any, index: number) => {
              const metadata = galleryMetadata?.get?.(skill.path);
              if (metadata == null) return null;
              return jsx.jsx(
                StaggeredItem,
                {
                  className: appShared.m4?.(
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
                              appInitial.b5t?.(templateCreator, skill),
                            ),
                    onUse: () => useTemplate(skill),
                    skill,
                    sourceUrl: metadata.sourceUrl,
                    templateKind:
                      appInitial.D5t?.(metadata.galleryKind) ??
                      metadata.galleryKind,
                    isGoogleDriveGallery,
                  }),
                },
                skill.path,
              );
            }),
            createCard == null
              ? null
              : jsx.jsx(StaggeredItem, {
                  className: appShared.m4?.(
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

  const Button = appShared.Yh ?? "button";
  const Header = appInitial.ZX ?? "header";
  const Body = appInitial.XX ?? "div";
  const Panel = appInitial.YX ?? "section";
  const Surface = appInitial._ ?? "div";
  const Icon = appShared.S_ ?? "span";
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
              children: jsx.jsx(Icon, {
                className: "rotate-180",
                "aria-hidden": true,
                asset: appShared.Yd,
              }),
            }),
            jsx.jsx(Button, {
              "aria-label": "Show more templates",
              color: "ghost",
              disabled: !canScrollForward,
              onClick: () => scroll(1),
              size: "toolbar",
              uniform: true,
              children: jsx.jsx(Icon, {
                "aria-hidden": true,
                asset: appShared.Yd,
              }),
            }),
          ],
        });
  const close = () => {
    appPrimary.Ci?.(
      scope,
      appInitial.qs
        ?.CODEX_ARTIFACT_TEMPLATE_CAROUSEL_DISMISS_REASON_CLOSE_BUTTON,
    );
    appPrimary.vi?.(scope);
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
                  children: jsx.jsx(Icon, {
                    "aria-hidden": true,
                    asset: appShared.dw,
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
  appShared.Ct?.();
  React = typeof appShared.e6 === "function" ? appShared.e6() : appShared.e6;
  jsx = typeof appShared.I3 === "function" ? appShared.I3() : appShared.I3;
  staggeredItem.n?.();
  templateCard.n?.();
  appInitial.O5t?.();
  appInitial.P5t?.();
  appInitial.w5t?.();
  artifactTemplateMetadataQuery = createArtifactTemplateMetadataQuery();
}

initializeHomeArtifactTemplates();

export { ArtifactTemplatePicker };
