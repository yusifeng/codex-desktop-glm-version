import {
  I3 as getJsxRuntime,
  Y2 as FormattedMessage,
  n4 as useIntl,
} from "@rchunk/app-shared";
import {
  d2 as initializeAnnouncementModal,
  h2 as useStartImageGeneration,
  l2 as AnnouncementModal,
  u2 as initializeImageGeneration,
} from "@rchunk/app-initial";

export interface ImageGenAnnouncementModalProps {
  dismissAnnouncement(): void;
  imageUrl: string;
  onShown(): void;
}

function ImageGen25AnnouncementModal({
  dismissAnnouncement,
  imageUrl,
  onShown,
}: ImageGenAnnouncementModalProps): unknown {
  const intl = useIntl();
  const startImageGeneration = useStartImageGeneration();
  const jsx = getJsxRuntime();
  const body = jsx.jsx("p", {
    ref: (element: unknown) => {
      if (element != null) onShown();
    },
    className:
      "max-w-xs text-base leading-normal tracking-normal text-codex-description",
    children: jsx.jsx(FormattedMessage, {
      id: "codex.imageGen25Announcement.body",
      defaultMessage:
        "Higher-quality results, faster generation, and smarter creative tools",
      description:
        "Description of the improved image creation capabilities announced in Codex",
    }),
  });
  return jsx.jsx(AnnouncementModal, {
    body,
    closeButtonClassName: "dark:text-default",
    closeButtonTone: "dark",
    initialFocus: "primary",
    media: jsx.jsx("img", {
      className: "h-auto w-full object-contain",
      src: imageUrl,
      alt: "",
    }),
    mediaClassName: "h-auto shrink-0 px-2 pt-14",
    onDismiss: dismissAnnouncement,
    onPrimaryAction: () => {
      dismissAnnouncement();
      startImageGeneration({
        prefillPrompt: intl.formatMessage({
          id: "codex.imageGen25Announcement.promptPrefix",
          defaultMessage: "Create an image of ",
          description:
            "Image creation prompt prefix inserted into the composer when the user clicks Try it. The user continues typing what to create.",
        }) as string,
      });
    },
    primaryActionLabel: jsx.jsx(FormattedMessage, {
      id: "codex.imageGen25Announcement.primaryAction",
      defaultMessage: "Try it",
      description:
        "Primary action to start creating an image from the Codex ImageGen 2.5 announcement",
    }),
    title: jsx.jsx(FormattedMessage, {
      id: "codex.imageGen25Announcement.title",
      defaultMessage: "Image creation got a major upgrade",
      description:
        "Title announcing improved image creation capabilities in Codex",
    }),
  });
}

function initializeImageGenAnnouncementModal(): void {
  initializeAnnouncementModal();
  initializeImageGeneration();
}

initializeImageGenAnnouncementModal();

export { ImageGen25AnnouncementModal };
