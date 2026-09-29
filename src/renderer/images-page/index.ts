import * as appInitialChunk from "@rchunk/app-initial";
import * as appPrimaryChunk from "@rchunk/app-primary";
import * as appSharedChunk from "@rchunk/app-shared";
import * as suggestionsChunk from "@rchunk/image-suggestions-core";
import * as composerControllerChunk from "@rchunk/use-chatgpt-composer-controller";
import "@rchunk/rolldown-runtime";

interface JsxRuntime {
  jsx(type: unknown, props: Record<string, unknown>, key?: string): unknown;
  jsxs(type: unknown, props: Record<string, unknown>, key?: string): unknown;
}

interface ReactRuntime {
  useRef<Value>(value: Value): { current: Value };
  useState<Value>(value: Value): [Value, (next: Value) => void];
}

interface IntlShape {
  formatMessage(descriptor: {
    defaultMessage: string;
    description?: string;
    id: string;
  }): string;
}

interface ScopeApi {
  get<Value>(signal: unknown, parameter?: unknown): Value;
  set(signal: unknown, value: unknown): void;
  set(signal: unknown, parameter: unknown, value: unknown): void;
}

interface SuggestionAction {
  input_requirements?: { source?: string };
  strategy?: string;
}

interface SuggestionItem {
  action?: SuggestionAction;
  id: string;
}

interface SuggestionGroup {
  action?: SuggestionAction;
  id: string;
  presentation?: string;
}

interface SuggestionSelection {
  group: SuggestionGroup;
  item: SuggestionItem;
}

interface FileDropTarget {
  disabled?: boolean;
  onFilesDropped(files: unknown): void;
}

interface AccountConversationState {
  conversationId: string;
}

interface AppSharedImagesApi {
  $3(): void;
  BX<Value>(family: unknown, parameter: unknown): Value;
  FX(): void;
  HX<Value>(signal: unknown): Value;
  I3(): JsxRuntime;
  K2(): void;
  LX(scope: unknown): ScopeApi;
  QI(): void;
  UX: unknown;
  Y2: unknown;
  ZI: unknown;
  e6(): ReactRuntime;
  n4(): IntlShape;
}

interface AppInitialImagesApi {
  NIt: unknown;
  Qgn(): void;
  RIt(): void;
  Rht(): void;
  Sun(): void;
  _un: unknown;
  gln(conversation: unknown): string;
  kht: unknown;
  lT: unknown;
  mun: unknown;
  o_n(): (destination: string) => void;
  uT(): void;
  vln(): void;
}

interface AppPrimaryImagesApi {
  H: unknown;
  Oo: unknown;
  U(): void;
  Ui: unknown;
  Wi(): void;
  au(): void;
  iu(item: SuggestionItem, modes: unknown): string[];
  ko(): void;
  ru(scope: ScopeApi, conversationId: string): void;
  su(
    scope: ScopeApi,
    conversationId: string,
    controller: unknown,
    selection: SuggestionSelection,
  ): void;
  tu: unknown;
}

interface ComposerControllerApi {
  n(input: { conversationId: string }): unknown;
  t(): void;
}

interface SuggestionsApi {
  a(scope: ScopeApi): AccountConversationState;
  c(): void;
  i(
    scope: ScopeApi,
    item: SuggestionItem,
    group: SuggestionGroup,
    imageSendUuid: string,
  ): void;
  n(): void;
  o: unknown;
  r(): void;
  s: unknown;
  t: unknown;
}

const {
  $3: initializeCompilerRuntime,
  BX: useSignalFamilyValue,
  FX: initializeMaitaiRuntime,
  HX: useSignalValue,
  I3: getJsxRuntime,
  K2: initializeIntlRuntime,
  LX: useScope,
  QI: initializeScopeRuntime,
  UX: ScopeProvider,
  Y2: FormattedMessage,
  ZI: globalScope,
  e6: getReactRuntime,
  n4: useIntl,
} = appSharedChunk as unknown as AppSharedImagesApi;

const {
  NIt: imageInputModes,
  Qgn: initializeAuthenticationUrl,
  RIt: initializeImageConversation,
  Rht: initializeImagesRuntime,
  Sun: initializeThreadRouting,
  _un: currentUserId,
  gln: buildConversationRoute,
  kht: imagesScope,
  lT: PageLayout,
  mun: currentAccountId,
  o_n: useNavigate,
  uT: initializeComposerRuntime,
  vln: initializeConversationRuntime,
} = appInitialChunk as unknown as AppInitialImagesApi;

const {
  H: FileDropZone,
  Oo: ComposerPlacement,
  U: initializeFileDropZone,
  Ui: Composer,
  Wi: initializeComposer,
  au: initializeComposerPlacement,
  iu: getSuggestionInputTypes,
  ko: initializePageLayout,
  ru: resetImageConversation,
  su: handleSuggestionFilesUploaded,
  tu: selectedSuggestionByConversation,
} = appPrimaryChunk as unknown as AppPrimaryImagesApi;

const {
  n: useChatGptComposerController,
  t: initializeComposerController,
} = composerControllerChunk as unknown as ComposerControllerApi;

const {
  a: createAccountConversation,
  c: initializeImageConversationFamily,
  i: markSuggestionSubmitted,
  n: initializeSuggestions,
  o: accountConversationByIdentity,
  r: initializeSuggestionQueries,
  s: imageConversationIdByIdentity,
  t: ImageSuggestions,
} = suggestionsChunk as unknown as SuggestionsApi;

const COMPOSER_PLACEMENT = { kind: "home", overlayPlacement: "bottom" };

let React: ReactRuntime;
let jsx: JsxRuntime;

function ImagesPage(): unknown {
  const accountId = useSignalValue<string | null>(currentAccountId);
  const userId = useSignalValue<string | null>(currentUserId);
  const accountKey = JSON.stringify([accountId, userId]);
  return jsx.jsx(AccountImagesPage, { accountKey }, accountKey);
}

function AccountImagesPage({ accountKey }: { accountKey: string }): unknown {
  const conversationId = useSignalFamilyValue<string>(
    imageConversationIdByIdentity,
    accountKey,
  );
  const context = {
    kind: "chatgpt",
    conversationId,
    browserTabMentionConversationId: null,
    routeConversationId: null,
  };
  return jsx.jsx(ScopeProvider, {
    scope: imagesScope,
    value: context,
    children: jsx.jsx(
      ImagesContent,
      { accountKey, conversationId },
      conversationId,
    ),
  });
}

function ImagesContent({
  accountKey,
  conversationId,
}: {
  accountKey: string;
  conversationId: string;
}): unknown {
  const scope = useScope(globalScope);
  const intl = useIntl();
  const navigate = useNavigate();
  const composerController = useChatGptComposerController({ conversationId });
  const [composer, setComposer] = React.useState<unknown>(null);
  const selection = useSignalFamilyValue<SuggestionSelection | null>(
    selectedSuggestionByConversation,
    conversationId,
  );
  const latestSelection = React.useRef(selection);
  const pendingSubmission = React.useRef<{
    imageSendUuid: string;
    selection: SuggestionSelection;
  } | null>(null);
  const [fileDropTarget, setFileDropTarget] =
    React.useState<FileDropTarget | null>(null);

  const getMessageMetadata =
    selection == null
      ? undefined
      : () => {
          if (
            scope.get<SuggestionSelection | null>(
              selectedSuggestionByConversation,
              conversationId,
            ) !== selection
          ) {
            return undefined;
          }
          const imageSendUuid = crypto.randomUUID();
          const action = selection.item.action ?? selection.group.action;
          const inputTypes = getSuggestionInputTypes(
            selection.item,
            scope.get(imageInputModes, conversationId),
          );
          const shouldTrackSubmission =
            (action?.input_requirements?.source === "styles" &&
              (action.strategy ?? "auto_send") === "auto_send") ||
            (inputTypes.length === 1 && inputTypes[0] === "picture_v2");
          pendingSubmission.current = shouldTrackSubmission
            ? { selection, imageSendUuid }
            : null;
          return {
            image_feature: "prompt",
            image_prompt_id: selection.item.id,
            image_prompt_group_id: selection.group.id,
            image_prompt_group_presentation: selection.group.presentation,
            image_send_uuid: imageSendUuid,
          };
        };

  const onFilesUploaded = (): void => {
    if (
      latestSelection.current === selection &&
      scope.get<AccountConversationState>(
        accountConversationByIdentity,
        accountKey,
      ).conversationId === conversationId
    ) {
      handleSuggestionFilesUploaded(
        scope,
        conversationId,
        composerController,
        selection as SuggestionSelection,
      );
    }
  };

  const placeholder = intl.formatMessage({
    id: "images.composer.placeholder",
    defaultMessage: "Describe an image",
    description:
      "Placeholder in the Images page composer where a person describes an image to create",
  });

  const onSubmitAccepted = (conversation: unknown): void => {
    const pending = pendingSubmission.current;
    pendingSubmission.current = null;
    if (
      pending != null &&
      scope.get(selectedSuggestionByConversation, conversationId) ===
        pending.selection &&
      scope.get<AccountConversationState>(
        accountConversationByIdentity,
        accountKey,
      ).conversationId === conversationId
    ) {
      markSuggestionSubmitted(
        scope,
        pending.selection.item,
        pending.selection.group,
        pending.imageSendUuid,
      );
    }
    resetImageConversation(scope, conversationId);
    scope.set(
      accountConversationByIdentity,
      accountKey,
      createAccountConversation(scope),
    );
    navigate(buildConversationRoute(conversation));
  };

  const composerNode = jsx.jsx(ComposerPlacement, {
    placement: COMPOSER_PLACEMENT,
    children: jsx.jsx(Composer, {
      ref: setComposer,
      composerController,
      conversationId,
      composerLayoutMode: "multiline",
      getMessageMetadata,
      getSystemHintsForSubmission: undefined,
      onFileDropTargetChange: setFileDropTarget,
      onFilesUploaded,
      placeholder,
      onSubmitAccepted,
      showError: true,
    }),
  });

  const composerSection = jsx.jsx("div", {
    className: "flex flex-col gap-8",
    children: jsx.jsx(FileDropZone, {
      disabled: fileDropTarget?.disabled ?? true,
      onFilesDropped: (files: unknown) => fileDropTarget?.onFilesDropped(files),
      children: composerNode,
    }),
  });

  const suggestions = jsx.jsx(ImageSuggestions, {
    conversationId,
    composerController,
    composer,
    disabled: fileDropTarget?.disabled ?? true,
    onUploadSelectionChange: (next: SuggestionSelection | null) => {
      latestSelection.current = next;
    },
  });

  return jsx.jsx(PageLayout, {
    title: jsx.jsx(FormattedMessage, {
      id: "images.page.title",
      defaultMessage: "Images",
      description: "Heading of the image discovery and creation page",
    }),
    headerVariant: "compact",
    animateContentLayout: false,
    children: jsx.jsxs("div", {
      className: "flex min-w-0 flex-col gap-8",
      children: [composerSection, suggestions],
    }),
  });
}

function initializeImagesPage(): void {
  initializeCompilerRuntime();
  initializeMaitaiRuntime();
  React = getReactRuntime();
  initializeIntlRuntime();
  initializeAuthenticationUrl();
  initializeThreadRouting();
  initializeComposer();
  initializeImageConversation();
  initializeFileDropZone();
  initializeComposerPlacement();
  initializeComposerController();
  initializeConversationRuntime();
  initializePageLayout();
  initializeComposerRuntime();
  initializeScopeRuntime();
  initializeImagesRuntime();
  initializeImageConversationFamily();
  initializeSuggestionQueries();
  initializeSuggestions();
  jsx = getJsxRuntime();
}

initializeImagesPage();

export { ImagesPage };
