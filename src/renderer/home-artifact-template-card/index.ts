// home-artifact-template-card —— Home 模板画廊中的可预览、编辑和删除卡片。

import * as appInitialChunk from "@rchunk/app-initial";
import * as appSharedChunk from "@rchunk/app-shared";
import * as runtimeChunk from "@rchunk/rolldown-runtime";

void runtimeChunk;

const {
  $3: initializeRuntimeLazy,
  Ah: DialogHeader,
  Ct: initializeIntl,
  FX: initializeScopeRuntime,
  I3: getJsxRuntime,
  If: initializeMenu,
  Ih: Dialog,
  K2: initializeSharedComponents,
  LX: useScope,
  Oh: DialogBody,
  Ph: initializeDialogLayout,
  Yh: Button,
  Zh: initializeButton,
  e6: getReactRuntime,
  gu: MoreButton,
  jf: MenuComponents,
  kf: DropdownMenu,
  kh: DialogActions,
  n4: useIntl,
} = appSharedChunk;
const {
  $3: initializeArtifactRuntime,
  $Wt: getSkillDescription,
  $en: routeScope,
  D3t: initializeGoogleDocsIcon,
  Dft: initializeAppgenState,
  E3t: GoogleSheetsIcon,
  Hlt: initializeArtifactPreview,
  JY: TemplateViewerContent,
  M5t: getSkillTitle,
  O3t: GoogleDocsIcon,
  O5t: initializeArtifactThumbnails,
  P5t: initializeTemplateKinds,
  QY: initializeTemplateViewer,
  S5t: getArtifactTemplateId,
  T3t: initializeGoogleSheetsIcon,
  Ult: openArtifactPreview,
  X3: createArtifactThumbnail,
  YY: TemplateViewer,
  itn: initializeArtifactRoutes,
  k5t: isGoogleTemplateKind,
  kft: openExternalLink,
  w3t: GoogleSlidesIcon,
  w5t: initializeArtifactSkills,
} = appInitialChunk;

type Component = (props: Record<string, unknown>) => unknown;
interface ArtifactSkill extends Record<string, unknown> {
  description?: unknown;
  name?: string;
  path: string;
  templateId?: string | null;
  title?: string;
}
type TemplateKind =
  | "document"
  | "presentation"
  | "spreadsheet"
  | "google-docs"
  | "google-sheets"
  | "google-slides"
  | string;

interface TemplateActionsMenuProps {
  deleteDisabled?: boolean;
  label: string;
  onDelete?(): void;
  onEdit?(): void;
  onView(): void;
}

interface DeleteTemplateDialogProps {
  deleteDisabled?: boolean;
  onConfirm(): void;
  onOpenChange(open: boolean): void;
  open: boolean;
  title: string;
}

interface HomeArtifactTemplateCardProps {
  deleteDisabled?: boolean;
  hostId: string;
  isGoogleDriveGallery?: boolean;
  isSelected?: boolean;
  onBeforeView?(): void;
  onDelete?(): void;
  onEdit?(): void;
  onUse(): void;
  showAddOverlay?: boolean;
  skill: ArtifactSkill;
  sourceUrl?: string | null;
  templateKind: TemplateKind;
  useLabel?: string;
}

interface FormSubmitEvent {
  preventDefault(): void;
}

let React: import("@rchunk/app-shared").ReactRuntime;
let jsx: import("@rchunk/app-shared").JsxRuntime;
let initialized = false;
let normalThumbnailCache = new WeakMap<object, Component>();
let galleryThumbnailCache = new WeakMap<object, Component>();

const GOOGLE_KIND_ICONS: Record<string, Component> = {};

function thumbnailFor(skill: ArtifactSkill, gallery: boolean): Component {
  const cache = gallery ? galleryThumbnailCache : normalThumbnailCache;
  const existing = cache.get(skill);
  if (existing != null) return existing;
  const component = createArtifactThumbnail(skill, {
    size: "large",
    renderCustomSvgAsImage: gallery,
  });
  cache.set(skill, component);
  return component;
}

function TemplateActionsMenu({
  deleteDisabled,
  label,
  onDelete,
  onEdit,
  onView,
}: TemplateActionsMenuProps): unknown {
  const MenuItem = MenuComponents.Item;
  return jsx.jsxs(DropdownMenu, {
    align: "end",
    contentWidth: "xs",
    triggerButton: jsx.jsx(MoreButton, { color: "outline", label }),
    children: [
      jsx.jsx(MenuItem, { onSelect: onView, children: "View" }),
      jsx.jsx(MenuItem, {
        disabled: onEdit == null,
        onSelect: onEdit,
        children: "Edit",
      }),
      onDelete == null
        ? null
        : jsx.jsx(MenuItem, {
            disabled: deleteDisabled,
            onSelect: onDelete,
            tone: "danger",
            children: "Delete",
          }),
    ],
  });
}

function DeleteTemplateDialog({
  deleteDisabled,
  onConfirm,
  onOpenChange,
  open,
  title,
}: DeleteTemplateDialogProps): unknown {
  return jsx.jsx(Dialog, {
    open,
    onOpenChange,
    size: "compact",
    children: jsx.jsxs(DialogBody, {
      as: "form",
      onSubmit: (event: FormSubmitEvent) => {
        event.preventDefault();
        onConfirm();
      },
      children: [
        jsx.jsx(DialogHeader, {
          title: `Delete ${title}?`,
          subtitle:
            "This template will be permanently deleted. This cannot be undone.",
        }),
        jsx.jsxs(DialogActions, {
          children: [
            jsx.jsx(Button, {
              color: "ghost",
              disabled: deleteDisabled,
              type: "button",
              onClick: () => onOpenChange(false),
              children: "Cancel",
            }),
            jsx.jsx(Button, {
              color: "danger",
              loading: deleteDisabled,
              type: "submit",
              children: "Delete",
            }),
          ],
        }),
      ],
    }),
  });
}

function HomeArtifactTemplateCard({
  deleteDisabled,
  hostId,
  isSelected,
  onBeforeView,
  onDelete,
  onEdit,
  onUse,
  showAddOverlay = true,
  skill,
  sourceUrl,
  templateKind,
  useLabel,
  isGoogleDriveGallery = false,
}: HomeArtifactTemplateCardProps): unknown {
  initializeHomeArtifactTemplateCard();
  const scope = useScope(routeScope);
  const intl = useIntl();
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [viewerOpen, setViewerOpen] = React.useState(false);
  const title = getSkillTitle(skill) ?? skill.title ?? skill.name ?? "Template";
  const templateId = getArtifactTemplateId(skill, templateKind) ?? null;
  const Thumbnail = thumbnailFor(skill, isGoogleDriveGallery);
  const kindIcon = isGoogleTemplateKind(templateKind)
    ? GOOGLE_KIND_ICONS[templateKind]
    : null;
  const view = () => {
    if (sourceUrl != null) {
      onBeforeView?.();
      openExternalLink({
        href: sourceUrl,
        initiator: "open_in_browser_bridge",
        openTarget: "in-app-browser",
        originHostId: hostId,
      });
      return;
    }
    if (templateId == null) {
      setViewerOpen(true);
      return;
    }
    onBeforeView?.();
    openArtifactPreview(scope, templateId, {
      artifactTemplateSkill: skill,
      hostId,
      isPreview: true,
      tabId: `artifact-template:${hostId}:${templateId}`,
      title,
    });
  };
  const useAriaLabel =
    useLabel ??
    intl.formatMessage(
      {
        id: "home.artifactTemplates.useSkill",
        defaultMessage: "Use {title}",
        description:
          "Accessible label for selecting a document, presentation, or spreadsheet template skill",
      },
      { title },
    ) ??
    `Use ${title}`;
  const actionsLabel =
    intl.formatMessage(
      {
        id: "home.artifactTemplates.actions",
        defaultMessage: "Template actions for {title}",
        description: "Accessible label for actions on an artifact template",
      },
      { title },
    ) ?? `Template actions for ${title}`;
  const previewClass =
    templateKind === "document" || templateKind === "google-docs"
      ? "aspect-[4/5]"
      : "aspect-video";

  const thumbnail = React.createElement(Thumbnail, {
    className: isGoogleDriveGallery
      ? "h-full w-auto max-w-none"
      : "h-full w-full object-cover object-top",
  });
  const button = jsx.jsxs("button", {
    type: "button",
    className:
      "group/use flex w-full cursor-interaction flex-col gap-2 rounded-2xl text-start outline-none",
    "aria-label": useAriaLabel,
    "aria-pressed": isSelected,
    onClick: onUse,
    children: [
      jsx.jsxs("div", {
        className: `relative overflow-hidden rounded-xl border border-default ${isGoogleDriveGallery ? "h-32 w-fit" : previewClass}`,
        children: [
          thumbnail,
          showAddOverlay
            ? jsx.jsx("div", {
                "aria-hidden": true,
                className:
                  "pointer-events-none absolute inset-0 flex items-center justify-center",
                children: "+",
              })
            : null,
        ],
      }),
      jsx.jsxs("div", {
        className:
          "flex min-w-0 items-center gap-1 px-0 pe-2 pb-1 text-xs text-secondary",
        children: [
          kindIcon == null
            ? null
            : React.createElement(kindIcon, { className: "icon-xs shrink-0" }),
          jsx.jsx("span", { className: "truncate", children: title }),
        ],
      }),
    ],
  });

  return jsx.jsxs("div", {
    className: `group/template-card relative flex flex-col gap-2 rounded-2xl ${isGoogleDriveGallery ? "w-min" : "w-full"}`,
    children: [
      button,
      jsx.jsx("div", {
        className:
          "absolute top-2 right-2 rounded-lg bg-surface opacity-0 group-hover/template-card:opacity-100 focus-within:opacity-100",
        children: jsx.jsx(TemplateActionsMenu, {
          deleteDisabled,
          label: actionsLabel,
          onDelete: onDelete == null ? undefined : () => setDeleteOpen(true),
          onEdit,
          onView: view,
        }),
      }),
      templateId == null
        ? jsx.jsx(TemplateViewer, {
            description: getSkillDescription(skill),
            icon: null,
            isOpen: viewerOpen,
            onOpenChange: setViewerOpen,
            title,
            titleText: title,
            children: jsx.jsx(TemplateViewerContent, {
              hostId,
              isOpen: viewerOpen,
              skillPath: skill.path,
              titleText: title,
            }),
          })
        : null,
      onDelete == null
        ? null
        : jsx.jsx(DeleteTemplateDialog, {
            deleteDisabled,
            open: deleteOpen,
            onConfirm: onDelete,
            onOpenChange: setDeleteOpen,
            title,
          }),
    ],
  });
}

function initializeHomeArtifactTemplateCard(): void {
  if (initialized) return;
  initialized = true;
  initializeIntl?.();
  React =
    typeof getReactRuntime === "function" ? getReactRuntime() : getReactRuntime;
  initializeScopeRuntime?.();
  initializeSharedComponents?.();
  initializeArtifactThumbnails?.();
  initializeArtifactSkills?.();
  initializeArtifactPreview?.();
  initializeButton?.();
  initializeAppgenState?.();
  initializeDialogLayout?.();
  initializeMenu?.();
  initializeGoogleDocsIcon?.();
  initializeGoogleSheetsIcon?.();
  initializeArtifactRoutes?.();
  initializeArtifactRuntime?.();
  initializeTemplateViewer?.();
  initializeTemplateKinds?.();
  jsx = typeof getJsxRuntime === "function" ? getJsxRuntime() : getJsxRuntime;
  normalThumbnailCache = new WeakMap();
  galleryThumbnailCache = new WeakMap();
  GOOGLE_KIND_ICONS["google-docs"] = GoogleDocsIcon;
  GOOGLE_KIND_ICONS["google-sheets"] = GoogleSheetsIcon;
  GOOGLE_KIND_ICONS["google-slides"] = GoogleSlidesIcon;
}

initializeHomeArtifactTemplateCard();

export {
  initializeHomeArtifactTemplateCard as n,
  HomeArtifactTemplateCard as t,
};
