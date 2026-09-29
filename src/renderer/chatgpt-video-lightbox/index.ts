import "@rchunk/rolldown-runtime";
import {
  $3 as initializeSharedRuntime,
  I3 as getJsxRuntime,
  K2 as initializeUiRuntime,
  e6 as getReactRuntime,
  n4 as useIntl,
  type JsxRuntime,
} from "@rchunk/app-shared";
import { Trt as initializeLightbox, wrt as Lightbox } from "@rchunk/app-initial";

interface VideoRequest {
  selectedIndex: number;
  videos: readonly { title?: string | null; videoId: string }[];
}
interface VideoLightboxProps {
  onClose(): void;
  onCloseAutoFocus?: () => void;
  request: VideoRequest;
}
interface IntlRuntime {
  formatMessage(
    descriptor: { defaultMessage: string; description?: string; id: string },
    values?: Record<string, string | number>,
  ): string;
}
interface ReactHooks {
  useCallback<Callback>(callback: Callback, dependencies: readonly unknown[]): Callback;
  useState<Value>(initialValue: Value): [Value, (value: Value | ((current: Value) => Value)) => void];
}

let React: ReactHooks;
let jsx: JsxRuntime;
let initialized = false;

function ChatGptVideoLightbox({ request, onClose, onCloseAutoFocus }: VideoLightboxProps): unknown {
  const intl = useIntl() as IntlRuntime;
  const [selectedIndex, setSelectedIndex] = React.useState(request.selectedIndex);
  const video = request.videos[selectedIndex];
  const close = React.useCallback((open: boolean): void => {
    if (!open) onClose();
  }, [onClose]);
  const previous = React.useCallback((): void => {
    setSelectedIndex((current) => Math.max(0, current - 1));
  }, []);
  const next = React.useCallback((): void => {
    setSelectedIndex((current) => Math.min(request.videos.length - 1, current + 1));
  }, [request.videos.length]);
  if (video == null) return null;

  const title = video.title ?? intl.formatMessage({
    id: "chatgpt.videoLightbox.playerTitle",
    defaultMessage: "YouTube video player",
    description: "Accessible title of the embedded YouTube player in the video lightbox when the video has no title",
  });
  const source = "https://www.youtube.com/embed/" + video.videoId + "?autoplay=1&playsinline=1&rel=0&fs=0";
  const caption = request.videos.length === 1
    ? title
    : video.title == null
      ? intl.formatMessage({
          id: "chatgpt.videoLightbox.position",
          defaultMessage: "Video {current, number} of {total, number}",
          description: "Caption in the video lightbox when the selected video has no title",
        }, { current: selectedIndex + 1, total: request.videos.length })
      : intl.formatMessage({
          id: "chatgpt.videoLightbox.titleAndPosition",
          defaultMessage: "{title} ({current, number} of {total, number})",
          description: "Caption in the video lightbox with its position",
        }, { title: video.title, current: selectedIndex + 1, total: request.videos.length });
  const closeLabel = intl.formatMessage({ id: "chatgpt.videoLightbox.close", defaultMessage: "Close video player" });
  const dialogLabel = intl.formatMessage({ id: "chatgpt.videoLightbox.dialogLabel", defaultMessage: "Video player" });
  const nextLabel = intl.formatMessage({ id: "chatgpt.videoLightbox.nextVideo", defaultMessage: "Next video" });
  const previousLabel = intl.formatMessage({ id: "chatgpt.videoLightbox.previousVideo", defaultMessage: "Previous video" });
  const previewContent = jsx.jsx("div", {
    className: "[container-type:size] pointer-events-none flex size-full items-center justify-center",
    children: jsx.jsx("div", {
      className: "pointer-events-auto aspect-[9/16] w-[min(100cqw,56.25cqh)] overflow-hidden rounded-lg bg-surface",
      children: jsx.jsx("iframe", {
        className: "size-full border-0",
        allow: "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share",
        allowFullScreen: true,
        referrerPolicy: "strict-origin-when-cross-origin",
        src: source,
        title,
      }, video.videoId),
    }),
  });

  return jsx.jsx(Lightbox, {
    alt: title,
    caption,
    closeAriaLabel: closeLabel,
    dialogAriaLabel: dialogLabel,
    nextAriaLabel: nextLabel,
    onCloseAutoFocus,
    onNextImage: selectedIndex >= request.videos.length - 1 ? undefined : next,
    onOpenChange: close,
    onPreviousImage: selectedIndex === 0 ? undefined : previous,
    open: true,
    previewContent,
    previousAriaLabel: previousLabel,
    showDownload: false,
    showZoomControls: false,
    src: source,
  });
}

function initializeChatGptVideoLightbox(): void {
  if (initialized) return;
  initialized = true;
  initializeSharedRuntime();
  React = getReactRuntime() as unknown as ReactHooks;
  initializeUiRuntime();
  initializeLightbox();
  jsx = getJsxRuntime();
}

initializeChatGptVideoLightbox();

export { ChatGptVideoLightbox };
