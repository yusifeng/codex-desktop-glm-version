// home-starter-prompts —— 临床工作区 Home composer 的示例提示卡片。

import * as appInitialChunk from "@rchunk/app-initial";
import * as appSharedChunk from "@rchunk/app-shared";
import * as departmentsChunk from "@rchunk/departments";
import * as runtimeChunk from "@rchunk/rolldown-runtime";
import * as shuffleChunk from "@rchunk/shuffle";
import type {
  DerivedScopedSignalContext,
  MaitaiScope,
  ReadableSignal,
  ScopedDerivedFamily,
  ScopedQuerySignal,
} from "@rchunk/app-shared";

void runtimeChunk;

interface ClinicalIdentity {
  accountId: string | null;
  isCapable: boolean;
  userId: string | null;
}

interface ComposerEditor {
  focus(): void;
  hasText(): boolean;
  setPromptText(prompt: string): void;
}

interface ClinicalPromptsData {
  accountId: string;
  department: string;
  prompts: StarterPrompt[];
  role: string;
  userId: string;
}

interface ClinicalExampleResponse {
  examples: Array<{ kind: string; prompt: string }>;
}

interface AppInitialBindings {
  A2: ReadableSignal<boolean>;
  HZ(): ComposerEditor;
  Qet: unknown;
  UZ<T>(
    editor: ComposerEditor,
    selector: (value: ComposerEditor) => T,
    key: string,
  ): T;
  Xet: ScopedDerivedFamily<
    Record<string, unknown>,
    { name: string },
    { isCapable: boolean }
  >;
  i_n(): { search?: string };
  kht: MaitaiScope<Record<string, unknown>>;
  oNt(scope: unknown): boolean;
  rJt: {
    safePost(
      path: string,
      options: {
        additionalHeaders: Record<string, string | null>;
        requestBody: Record<string, string>;
        signal: AbortSignal;
      },
    ): Promise<ClinicalExampleResponse>;
  };
  v2: ReadableSignal<string | undefined>;
  yln(search: string): boolean;
}

interface JsxRuntime {
  jsx(type: unknown, props: Record<string, unknown>, key?: unknown): unknown;
  jsxs(type: unknown, props: Record<string, unknown>, key?: unknown): unknown;
}

interface ReactRuntime {
  useId(): string;
}

function resolveRuntimeExport<T>(value: unknown): T {
  return (typeof value === "function" ? value() : value) as T;
}

const {
  A2: composerInertSignal,
  HZ: useComposerEditor,
  Qet: identitySignal,
  UZ: selectEditorValue,
  Xet: capabilityFamily,
  i_n: useLocation,
  kht: clinicalWorkspaceScope,
  oNt: shouldKeepEditorBlurred,
  rJt: clinicalApiClient,
  v2: conversationIdSignal,
  yln: isTemporaryConversation,
} = appInitialChunk as unknown as AppInitialBindings;
const {
  $O: queryStaleTimes,
  BX: useSignalFamilyValue,
  FX: initializeMaitaiRuntime,
  HX: useSignalValue,
  I3: jsxRuntimeExport,
  LX: useScope,
  QI: initializeQueryBridge,
  ZI: AppScope,
  e6: reactRuntimeExport,
  eZ: createQuerySignal,
  rZ: createDerivedFamily,
} = appSharedChunk;
const { n: initializeDepartments } = departmentsChunk as unknown as { n(): void };
const { t: shuffleItems } = shuffleChunk as unknown as {
  t<T>(items: T[]): T[];
};

interface StarterPrompt {
  id: string;
  kind:
    "clinical_decision_support" | "documentation_query" | "latest_guidelines";
  prompt: string;
}

let jsx: JsxRuntime;
let React: ReactRuntime;
let clinicalPromptsQuery: ScopedQuerySignal<
  Record<string, unknown>,
  ClinicalPromptsData
>;
let conversationPromptsFamily: ScopedDerivedFamily<
  Record<string, unknown>,
  { conversationId?: string; isTemporaryChat: boolean },
  ClinicalPromptsData | undefined
>;
let initialized = false;

const PROMPT_KINDS = [
  "clinical_decision_support",
  "documentation_query",
  "latest_guidelines",
] as const;

function StarterPromptCards({
  prompts,
  disabled,
  onSelect,
}: {
  prompts: StarterPrompt[];
  disabled: boolean;
  onSelect(prompt: StarterPrompt): void;
}): unknown {
  if (prompts.length === 0) return null;
  const headingId = React.useId();
  return jsx.jsxs("section", {
    className: "@container flex w-full min-w-0 flex-col gap-2 select-none",
    "aria-labelledby": headingId,
    children: [
      jsx.jsx("h2", {
        id: headingId,
        className: "px-1 text-base leading-7 text-secondary @xl:text-sm",
        children: "Try something new",
      }),
      jsx.jsx("div", {
        className: "flex items-stretch gap-3 overflow-x-auto pb-4 @xl:gap-4",
        children: prompts.map((prompt) =>
          jsx.jsxs(
            "button",
            {
              type: "button",
              "aria-label": prompt.prompt,
              disabled,
              className:
                "flex min-h-28 w-41 flex-none cursor-interaction flex-col items-start gap-2 rounded-2xl border border-default p-4 text-start text-secondary shadow-card enabled:hover:bg-primary-ghost-hover disabled:opacity-60 @xl:flex-1",
              onClick: () => onSelect(prompt),
              children: [
                jsx.jsx("span", {
                  "aria-hidden": true,
                  className: "text-xs font-medium uppercase text-tertiary",
                  children: prompt.kind.replaceAll("_", " "),
                }),
                jsx.jsx("span", {
                  className:
                    "line-clamp-3 text-base leading-6.5 tracking-tight",
                  children: prompt.prompt,
                }),
              ],
            },
            prompt.id,
          ),
        ),
      }),
    ],
  });
}

function ClinicalStarterPrompts(): unknown {
  initializeClinicalStarterPrompts();
  const scope = useScope(clinicalWorkspaceScope);
  const editor = useComposerEditor();
  const conversationId = useSignalValue(conversationIdSignal);
  const inert = useSignalValue(composerInertSignal) === true;
  const search = useLocation().search ?? "";
  const temporaryChat = isTemporaryConversation(search) === true;
  const capability = useSignalFamilyValue(capabilityFamily, {
    name: "chatgpt.clinical-starter-prompts",
  });
  const data = useSignalFamilyValue(conversationPromptsFamily, {
    conversationId,
    isTemporaryChat: temporaryChat,
  });
  const editorEmpty = selectEditorValue(
    editor,
    (value) => !value.hasText(),
    "document",
  );
  if (
    !capability?.isCapable ||
    !editorEmpty ||
    data == null ||
    data.prompts.length === 0
  )
    return null;
  const onSelect = (prompt: StarterPrompt) => {
    const identity = scope.get<ClinicalIdentity>(identitySignal);
    if (
      !editor.hasText() &&
      scope.get(capabilityFamily, {
        name: "chatgpt.clinical-starter-prompts",
      }).isCapable &&
      identity.accountId === data.accountId &&
      identity.userId === data.userId
    ) {
      editor.setPromptText(prompt.prompt);
      if (!shouldKeepEditorBlurred(scope)) editor.focus();
    }
  };
  return jsx.jsx("div", {
    className: [
      "mt-6",
      temporaryChat && "max-sm:hidden",
      inert && "pointer-events-none",
    ]
      .filter(Boolean)
      .join(" "),
    inert,
    children: jsx.jsx(StarterPromptCards, {
      prompts: data.prompts,
      disabled: false,
      onSelect,
    }),
  });
}

function initializeClinicalStarterPrompts(): void {
  if (initialized) return;
  initialized = true;
  initializeDepartments();
  initializeMaitaiRuntime();
  initializeQueryBridge();
  React = resolveRuntimeExport<ReactRuntime>(reactRuntimeExport);
  jsx = resolveRuntimeExport<JsxRuntime>(jsxRuntimeExport);
  clinicalPromptsQuery = createQuerySignal<
    Record<string, unknown>,
    ClinicalPromptsData
  >(AppScope, ({ get }) => {
    const identity = get<ClinicalIdentity>(identitySignal);
    const accountId = identity.accountId;
    const userId = identity.userId;
    const role = "physician";
    const department = "internal_medicine";
    return {
      queryKey: [
        "quorum-starter-prompts",
        accountId,
        userId,
        role,
        department,
      ],
      enabled:
        identity.isCapable &&
        accountId != null &&
        userId != null,
      queryFn: async ({ signal }) => {
        if (accountId == null || userId == null) {
          throw new Error(
            "Clinical starter prompts require an authenticated identity",
          );
        }
        const response = await clinicalApiClient.safePost(
          "/onboarding/quorum/examples",
          {
            requestBody: { source: "starter_prompts", role, department },
            additionalHeaders: {
              "ChatGPT-Account-ID": accountId,
            },
            signal,
          },
        );
        const prompts = PROMPT_KINDS.flatMap((kind) => {
          const example = response.examples.find(
            (entry: { kind: string }) => entry.kind === kind,
          );
          return example == null
            ? []
            : [
                {
                  id: `health_${role}_${department}_${kind}`,
                  kind,
                  prompt: example.prompt,
                },
              ];
        });
        return {
          accountId,
          userId,
          role,
          department,
          prompts: shuffleItems(prompts),
        };
      },
      retry: false,
      staleTime: queryStaleTimes.ONE_MINUTE,
    };
  });
  conversationPromptsFamily = createDerivedFamily(
    AppScope,
    (
      _key: { conversationId?: string; isTemporaryChat: boolean },
      { get }: DerivedScopedSignalContext<Record<string, unknown>>,
    ) => get(clinicalPromptsQuery).data,
  );
}

initializeClinicalStarterPrompts();

export { ClinicalStarterPrompts };
