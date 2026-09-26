// home-artifact-template-card —— Home 模板画廊中的可预览、编辑和删除卡片。

import * as appInitialChunk from "@rchunk/app-initial";
import * as appSharedChunk from "@rchunk/app-shared";
import * as runtimeChunk from "@rchunk/rolldown-runtime";

void runtimeChunk;

const appInitial = appInitialChunk as Record<string, any>;
const appShared = appSharedChunk as Record<string, any>;

let React: any;
let jsx: any;
let initialized = false;
let normalThumbnailCache = new WeakMap<object, any>();
let galleryThumbnailCache = new WeakMap<object, any>();

const GOOGLE_KIND_ICONS: Record<string, any> = {};

function thumbnailFor(skill: object, gallery: boolean): any {
  const cache = gallery ? galleryThumbnailCache : normalThumbnailCache;
  const existing = cache.get(skill);
  if (existing != null) return existing;
  const component = appInitial.X3?.(skill, {
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
}: Record<string, any>): unknown {
  const Menu = appShared.kf ?? "div";
  const MenuItem = appShared.jf?.Item ?? "button";
  const Trigger = appShared.gu ?? "button";
  return jsx.jsxs(Menu, {
    align: "end",
    contentWidth: "xs",
    triggerButton: jsx.jsx(Trigger, { color: "outline", label }),
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
}: Record<string, any>): unknown {
  const Dialog = appShared.Ih ?? "div";
  const DialogBody = appShared.Oh ?? "div";
  const DialogActions = appShared.kh ?? "div";
  const Button = appShared.Yh ?? "button";
  return jsx.jsx(Dialog, {
    open,
    onOpenChange,
    size: "compact",
    children: jsx.jsxs(DialogBody, {
      as: "form",
      onSubmit: (event: any) => {
        event.preventDefault();
        onConfirm();
      },
      children: [
        jsx.jsx(appShared.$h ?? "header", {
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
}: Record<string, any>): unknown {
  initializeHomeArtifactTemplateCard();
  const scope = appShared.LX?.(appInitial.$en);
  const intl = appShared.n4?.();
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [viewerOpen, setViewerOpen] = React.useState(false);
  const title =
    appInitial.M5t?.(skill) ?? skill.title ?? skill.name ?? "Template";
  const templateId = appInitial.S5t?.(skill, templateKind) ?? null;
  const Thumbnail = thumbnailFor(skill, isGoogleDriveGallery);
  const kindIcon = appInitial.k5t?.(templateKind)
    ? GOOGLE_KIND_ICONS[templateKind]
    : null;
  const view = () => {
    if (sourceUrl != null) {
      onBeforeView?.();
      appInitial.kft?.({
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
    appInitial.Ult?.(scope, templateId, {
      artifactTemplateSkill: skill,
      hostId,
      isPreview: true,
      tabId: `artifact-template:${hostId}:${templateId}`,
      title,
    });
  };
  const useAriaLabel =
    useLabel ??
    intl?.formatMessage?.(
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
    intl?.formatMessage?.(
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
        ? jsx.jsx(appInitial.YY ?? "TemplateViewer", {
            description: appInitial.$Wt?.(skill),
            icon: null,
            isOpen: viewerOpen,
            onOpenChange: setViewerOpen,
            title,
            titleText: title,
            children: jsx.jsx(appInitial.JY ?? "TemplateViewerContent", {
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
  appShared.Ct?.();
  React = typeof appShared.e6 === "function" ? appShared.e6() : appShared.e6;
  appShared.FX?.();
  appShared.K2?.();
  appInitial.O5t?.();
  appInitial.w5t?.();
  appInitial.Hlt?.();
  appShared.Zh?.();
  appInitial.Dft?.();
  appShared.Ph?.();
  appShared.If?.();
  appInitial.D3t?.();
  appInitial.T3t?.();
  appInitial.itn?.();
  appInitial.$3?.();
  appInitial.QY?.();
  appInitial.P5t?.();
  jsx = typeof appShared.I3 === "function" ? appShared.I3() : appShared.I3;
  normalThumbnailCache = new WeakMap();
  galleryThumbnailCache = new WeakMap();
  GOOGLE_KIND_ICONS["google-docs"] = appInitial.O3t;
  GOOGLE_KIND_ICONS["google-sheets"] = appInitial.E3t;
  GOOGLE_KIND_ICONS["google-slides"] = appInitial.w3t;
}

initializeHomeArtifactTemplateCard();

export {
  initializeHomeArtifactTemplateCard as n,
  HomeArtifactTemplateCard as t,
};
