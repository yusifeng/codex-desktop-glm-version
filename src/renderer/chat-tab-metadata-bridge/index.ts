import "@rchunk/rolldown-runtime";
import {
  $3 as getCompilerRuntime,
  FX as initializeSignalRuntime,
  I3 as getJsxRuntime,
  K2 as initializeIntlComponents,
  LX as useScope,
  V_ as UnarchiveIcon,
  Y2 as FormattedMessage,
  e6 as getReactRuntime,
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

interface CompilerRuntime {
  c(size: number): unknown[];
}

let archivedActionsCompiler: CompilerRuntime;
let titleMetadataCompiler: CompilerRuntime;
let jsx: ReturnType<typeof getJsxRuntime>;
let React: ReturnType<typeof getReactRuntime>;

function ArchivedConversationActions({
  restored,
  restoring,
  deleting = false,
  onDelete,
  onUnarchive,
  onDone,
}: ArchivedConversationActionsProps): unknown {
  const cache = archivedActionsCompiler.c(31);
  const isDeleting = deleting;
  let restoringDescription: unknown;
  if (cache[0] === restoring) {
    restoringDescription = cache[1];
  } else {
    restoringDescription = restoring
      ? jsx.jsx(FormattedMessage, {
      id: "localConversation.archived.restoringDescription",
      defaultMessage: "Restoring this chat and its workspace…",
      description: "Progress message while an archived task is being restored",
    })
      : null;
    cache[0] = restoring;
    cache[1] = restoringDescription;
  }
  let restoredDescription: unknown;
  if (cache[2] === restored && cache[3] === restoring) {
    restoredDescription = cache[4];
  } else {
    restoredDescription = !restoring && restored
      ? jsx.jsx(FormattedMessage, {
        id: "localConversation.archived.restoredDescription",
        defaultMessage: "This chat has been restored",
        description: "Confirmation shown before leaving an archived task preview",
      })
      : null;
    cache[2] = restored;
    cache[3] = restoring;
    cache[4] = restoredDescription;
  }
  let previewDescription: unknown;
  if (cache[5] === restored && cache[6] === restoring) {
    previewDescription = cache[7];
  } else {
    previewDescription = !restoring && !restored
      ? jsx.jsx(FormattedMessage, {
        id: "localConversation.archived.previewDescription",
        defaultMessage: "This chat is archived. To continue, unarchive it first",
        description: "Explanation displayed beneath a read-only archived task preview",
      })
      : null;
    cache[5] = restored;
    cache[6] = restoring;
    cache[7] = previewDescription;
  }
  let description: unknown;
  if (cache[8] !== restoringDescription || cache[9] !== restoredDescription || cache[10] !== previewDescription) {
    description = jsx.jsxs("span", {
      className: "text-sm text-secondary select-none",
      children: [restoringDescription, restoredDescription, previewDescription],
    });
    cache[8] = restoringDescription;
    cache[9] = restoredDescription;
    cache[10] = previewDescription;
    cache[11] = description;
  } else {
    description = cache[11];
  }
  let deleteButton: unknown;
  if (cache[12] !== isDeleting || cache[13] !== onDelete || cache[14] !== restored || cache[15] !== restoring) {
    deleteButton = !restored && onDelete != null
      ? jsx.jsx(Button, {
        color: "danger", variant: "solid", disabled: restoring, loading: isDeleting,
        size: "lg", onClick: onDelete,
        children: jsx.jsx(FormattedMessage, { ...commonMessages.delete }),
      })
      : null;
    cache[12] = isDeleting;
    cache[13] = onDelete;
    cache[14] = restored;
    cache[15] = restoring;
    cache[16] = deleteButton;
  } else {
    deleteButton = cache[16];
  }
  const primaryAction = restored ? onDone : onUnarchive;
  let primaryContent: unknown;
  if (cache[17] !== restored || cache[18] !== restoring) {
    primaryContent = restored && !restoring
      ? jsx.jsx(FormattedMessage, {
      id: "localConversation.archived.previewDone", defaultMessage: "Done",
      description: "Leaves Archive with the restored task selected",
    })
      : jsx.jsxs(jsx.Fragment, {
        children: [jsx.jsx(UnarchiveIcon, {}), jsx.jsx(FormattedMessage, { ...commonMessages.unarchive })],
      });
    cache[17] = restored;
    cache[18] = restoring;
    cache[19] = primaryContent;
  } else {
    primaryContent = cache[19];
  }
  let primaryButton: unknown;
  if (cache[20] !== isDeleting || cache[21] !== restoring || cache[22] !== primaryAction || cache[23] !== primaryContent) {
    primaryButton = jsx.jsx(Button, {
      color: "primary", variant: "solid", disabled: isDeleting, loading: restoring,
      size: "lg", onClick: primaryAction, children: primaryContent,
    });
    cache[20] = isDeleting;
    cache[21] = restoring;
    cache[22] = primaryAction;
    cache[23] = primaryContent;
    cache[24] = primaryButton;
  } else {
    primaryButton = cache[24];
  }
  let actions: unknown;
  if (cache[25] !== deleteButton || cache[26] !== primaryButton) {
    actions = jsx.jsxs("div", {
        className: "pointer-events-auto flex items-center gap-2",
        children: [deleteButton, primaryButton],
    });
    cache[25] = deleteButton;
    cache[26] = primaryButton;
    cache[27] = actions;
  } else {
    actions = cache[27];
  }
  let result: unknown;
  if (cache[28] !== actions || cache[29] !== description) {
    result = jsx.jsxs("div", {
      className: "flex flex-col items-center gap-4 py-4",
      children: [description, actions],
    });
    cache[28] = actions;
    cache[29] = description;
    cache[30] = result;
  } else {
    result = cache[30];
  }
  return result;
}

function initializeArchivedConversationActions(): void {
  archivedActionsCompiler = getCompilerRuntime() as unknown as CompilerRuntime;
  initializeButton();
  initializeIntlComponents();
  initializeReactRuntime();
  initializeCommonMessages();
  jsx = getJsxRuntime();
}

function ChatTabTitleMetadata({ title }: { title: string }): null {
  const cache = titleMetadataCompiler.c(7);
  const scope = useScope(chatTabMetadataScope);
  let setTitle: () => void;
  let setTitleDependencies: readonly unknown[];
  if (cache[0] !== scope || cache[1] !== title) {
    setTitle = () => { scope.set(chatTabTitleSignal, title); };
    setTitleDependencies = [scope, title];
    cache[0] = scope;
    cache[1] = title;
    cache[2] = setTitle;
    cache[3] = setTitleDependencies;
  } else {
    setTitle = cache[2] as () => void;
    setTitleDependencies = cache[3] as readonly unknown[];
  }
  React.useLayoutEffect(setTitle, setTitleDependencies);
  let clearTitle: () => () => void;
  let clearTitleDependencies: readonly unknown[];
  if (cache[4] === scope) {
    clearTitle = cache[5] as () => () => void;
    clearTitleDependencies = cache[6] as readonly unknown[];
  } else {
    clearTitle = () => () => { scope.set(chatTabTitleSignal, null); };
    clearTitleDependencies = [scope];
    cache[4] = scope;
    cache[5] = clearTitle;
    cache[6] = clearTitleDependencies;
  }
  React.useLayoutEffect(clearTitle, clearTitleDependencies);
  return null;
}

function initializeChatTabTitleMetadata(): void {
  titleMetadataCompiler = getCompilerRuntime() as unknown as CompilerRuntime;
  initializeSignalRuntime();
  React = getReactRuntime();
  initializeChatTabMetadataScope();
  initializeChatTabTitle();
}

export {
  initializeArchivedConversationActions as i,
  initializeChatTabTitleMetadata as n,
  ArchivedConversationActions as r,
  ChatTabTitleMetadata as t,
};
