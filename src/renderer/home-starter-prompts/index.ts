// home-starter-prompts —— 临床工作区 Home composer 的示例提示卡片。

import * as appInitialChunk from "@rchunk/app-initial";
import * as appSharedChunk from "@rchunk/app-shared";
import * as departmentsChunk from "@rchunk/departments";
import * as runtimeChunk from "@rchunk/rolldown-runtime";
import * as shuffleChunk from "@rchunk/shuffle";

void runtimeChunk;

const appInitial = appInitialChunk as Record<string, any>;
const appShared = appSharedChunk as Record<string, any>;
const departments = departmentsChunk as Record<string, any>;
const shuffle = shuffleChunk as Record<string, any>;

interface StarterPrompt {
  id: string;
  kind:
    "clinical_decision_support" | "documentation_query" | "latest_guidelines";
  prompt: string;
}

let jsx: any;
let React: any;
let clinicalPromptsQuery: unknown = Symbol("clinical-prompts-query");
let conversationPromptsFamily: unknown = Symbol(
  "conversation-clinical-prompts",
);
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
  const scope = appShared.LX(appInitial.kht);
  const editor = appInitial.HZ?.();
  const conversationId = appShared.HX(appInitial.v2);
  const inert = appShared.HX(appInitial.A2) === true;
  const search = appInitial.i_n?.().search ?? "";
  const temporaryChat = appInitial.yln?.(search) === true;
  const capability = appShared.BX?.(appInitial.Xet, {
    name: "chatgpt.clinical-starter-prompts",
  });
  const data = appShared.BX?.(conversationPromptsFamily, {
    conversationId,
    isTemporaryChat: temporaryChat,
  });
  const editorEmpty = appInitial.UZ?.(
    editor,
    (value: any) => !value.hasText(),
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
    const identity = scope.get(appInitial.Qet);
    if (
      !editor.hasText() &&
      scope.get(appInitial.Xet, {
        name: "chatgpt.clinical-starter-prompts",
      }).isCapable &&
      identity.accountId === data.accountId &&
      identity.userId === data.userId
    ) {
      editor.setPromptText(prompt.prompt);
      if (!appInitial.oNt?.(scope)) editor.focus();
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
  departments.n?.();
  appShared.FX?.();
  appShared.QI?.();
  React = typeof appShared.e6 === "function" ? appShared.e6() : appShared.e6;
  jsx = typeof appShared.I3 === "function" ? appShared.I3() : appShared.I3;
  clinicalPromptsQuery =
    appShared.eZ?.(appShared.ZI, ({ get }: any) => {
      const identity = get(appInitial.Qet);
      const role = "physician";
      const department = "internal_medicine";
      return {
        queryKey: [
          "quorum-starter-prompts",
          identity.accountId,
          identity.userId,
          role,
          department,
        ],
        enabled:
          identity.isCapable &&
          identity.accountId != null &&
          identity.userId != null,
        queryFn: async ({ signal }: { signal: AbortSignal }) => {
          const response = await appInitial.rJt.safePost(
            "/onboarding/quorum/examples",
            {
              requestBody: { source: "starter_prompts", role, department },
              additionalHeaders: {
                "ChatGPT-Account-ID": identity.accountId,
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
            accountId: identity.accountId,
            userId: identity.userId,
            role,
            department,
            prompts: shuffle.t?.(prompts) ?? prompts,
          };
        },
        retry: false,
        staleTime: appShared.$O?.ONE_MINUTE,
      };
    }) ?? clinicalPromptsQuery;
  conversationPromptsFamily =
    appShared.rZ?.(
      appShared.ZI,
      (_key: unknown, { get }: any) => get(clinicalPromptsQuery).data,
    ) ?? conversationPromptsFamily;
}

initializeClinicalStarterPrompts();

export { ClinicalStarterPrompts };
