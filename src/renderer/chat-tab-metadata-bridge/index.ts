import "@rchunk/rolldown-runtime";
import {
  $3 as initializeCompilerRuntime,
  FX as initializeSignalRuntime,
  I3 as getJsxRuntime,
  K2 as initializeIntlComponents,
  LX as useScope,
  V_ as UnarchiveIcon,
  Y2 as FormattedMessage,
  e6 as reactRuntime,
  lw as initializeReactRuntime,
} from "@rchunk/app-shared";
import {
  $en as chatTabMetadataScope,
  Lb as commonMessages,
  Rb as initializeCommonMessages,
  X7 as initializeButton,
  Xct as chatTabTitleSignal,
  Yct as initializeChatTabTitle,
  itn as initializeChatTabMetadataScope,
  l9 as Button,
} from "@rchunk/app-initial";

interface ArchivedConversationActionsProps extends Record<string, unknown> {
  deleting?: boolean;
  onDelete?: () => void;
  onDone(): void;
  onUnarchive(): void;
  restored: boolean;
  restoring: boolean;
}

const jsx = getJsxRuntime();

function ArchivedConversationActions({
  restored,
  restoring,
  deleting = false,
  onDelete,
  onUnarchive,
  onDone,
}: ArchivedConversationActionsProps): unknown {
  const description = restoring
    ? jsx.jsx(FormattedMessage, {
      id: "localConversation.archived.restoringDescription",
      defaultMessage: "Restoring this chat and its workspace…",
      description: "Progress message while an archived task is being restored",
    })
    : restored
      ? jsx.jsx(FormattedMessage, {
        id: "localConversation.archived.restoredDescription",
        defaultMessage: "This chat has been restored",
        description: "Confirmation shown before leaving an archived task preview",
      })
      : jsx.jsx(FormattedMessage, {
        id: "localConversation.archived.previewDescription",
        defaultMessage: "This chat is archived. To continue, unarchive it first",
        description: "Explanation displayed beneath a read-only archived task preview",
      });
  const deleteButton = !restored && onDelete != null
    ? jsx.jsx(Button, {
      color: "danger", variant: "solid", disabled: restoring, loading: deleting,
      size: "lg", onClick: onDelete,
      children: jsx.jsx(FormattedMessage, { ...commonMessages.delete }),
    })
    : null;
  const primaryContent = restored && !restoring
    ? jsx.jsx(FormattedMessage, {
      id: "localConversation.archived.previewDone", defaultMessage: "Done",
      description: "Leaves Archive with the restored task selected",
    })
    : jsx.jsxs(jsx.Fragment, {
      children: [jsx.jsx(UnarchiveIcon, {}), jsx.jsx(FormattedMessage, { ...commonMessages.unarchive })],
    });
  return jsx.jsxs("div", {
    className: "flex flex-col items-center gap-4 py-4",
    children: [
      jsx.jsx("span", { className: "text-sm text-secondary select-none", children: description }),
      jsx.jsxs("div", {
        className: "pointer-events-auto flex items-center gap-2",
        children: [deleteButton, jsx.jsx(Button, {
          color: "primary", variant: "solid", disabled: deleting, loading: restoring,
          size: "lg", onClick: restored ? onDone : onUnarchive, children: primaryContent,
        })],
      }),
    ],
  });
}

function initializeArchivedConversationActions(): void {
  initializeCompilerRuntime();
  initializeButton();
  initializeIntlComponents();
  initializeReactRuntime();
  initializeCommonMessages();
}

function ChatTabTitleMetadata({ title }: { title: string }): null {
  const scope = useScope(chatTabMetadataScope);
  reactRuntime.useLayoutEffect(() => {
    scope.set(chatTabTitleSignal, title);
  }, [scope, title]);
  reactRuntime.useLayoutEffect(() => () => {
    scope.set(chatTabTitleSignal, null);
  }, [scope]);
  return null;
}

function initializeChatTabTitleMetadata(): void {
  initializeCompilerRuntime();
  initializeSignalRuntime();
  initializeReactRuntime();
  initializeChatTabMetadataScope();
  initializeChatTabTitle();
}

export {
  initializeArchivedConversationActions as i,
  initializeChatTabTitleMetadata as n,
  ArchivedConversationActions as r,
  ChatTabTitleMetadata as t,
};
