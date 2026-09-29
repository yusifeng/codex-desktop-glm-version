// Conversational onboarding writing tabs. Release chunk: renderer-d200041fe18f.js.
import "@rchunk/rolldown-runtime";
import * as appSharedChunk from "@rchunk/app-shared";
import * as appInitialChunk from "@rchunk/app-initial";
import * as tabsChunk from "@rchunk/tabs";
import * as writingBlockChunk from "@rchunk/quick-chat-writing-block-adapter";

interface JsxRuntime {
  Fragment: unknown;
  jsx(type: unknown, props: Record<string, unknown>, key?: string): unknown;
  jsxs(type: unknown, props: Record<string, unknown>): unknown;
}
interface ReactRuntime {
  useId(): string;
  useState<Value>(initial: Value): [Value, (value: Value) => void];
}
interface SharedRuntime {
  $3(): unknown;
  I3(): JsxRuntime;
  e6(): ReactRuntime;
}
interface InitialRuntime {
  XW: unknown;
  ZW(): void;
}
interface TabsRuntime {
  n(): void;
  t: unknown;
}
interface WritingRuntime {
  r(): void;
  t: unknown;
}
type TabKey = "translation" | "professional_email" | "birthday_message";
interface WritingContent {
  id: string;
  content: string;
}
interface WritingState {
  tab: TabKey;
  ask_me_label: string;
  translation_tab_label: string;
  translation_question: string;
  email_tab_label: string;
  email_question: string;
  message_tab_label: string;
  message_question: string;
  translation: {
    source_text: string;
    translated_text: string;
    source_language: string;
    target_language: string;
  };
  email: WritingContent & { subject: string };
  message: WritingContent;
}
interface Props {
  state: WritingState;
  sourceMessageId: string;
  turnContext: unknown;
}

const sharedRuntime = appSharedChunk as unknown as SharedRuntime;
const initialRuntime = appInitialChunk as unknown as InitialRuntime;
const tabsRuntime = tabsChunk as unknown as TabsRuntime;
const writingRuntime = writingBlockChunk as unknown as WritingRuntime;
let React: ReactRuntime;
let jsx: JsxRuntime;
const tabs = [
  {
    key: "translation",
    label: "translation_tab_label",
    question: "translation_question",
  },
  {
    key: "professional_email",
    label: "email_tab_label",
    question: "email_question",
  },
  {
    key: "birthday_message",
    label: "message_tab_label",
    question: "message_question",
  },
] as const;

function ConversationalOnboardingWriting({
  state,
  sourceMessageId,
  turnContext,
}: Props): unknown {
  const [selectedKey, setSelectedKey] = React.useState<TabKey>(state.tab);
  const id = React.useId();
  const selected = tabs.find((tab) => tab.key === selectedKey) ?? tabs[0];
  const panelId = `${id}-${selected.key}`;
  const isEmail = selectedKey === "professional_email";
  const content = isEmail ? state.email : state.message;
  const tabItems = tabs.map((tab) => ({
    key: tab.key,
    name: state[tab.label],
    panelId: `${id}-${tab.key}`,
  }));
  const tabList = jsx.jsx(tabsRuntime.t, {
    className: "flex-wrap",
    ariaLabel: state.ask_me_label,
    onSelect: setSelectedKey,
    selectedKey,
    tabs: tabItems,
    variant: "pill",
  });
  const prompt = jsx.jsxs("div", {
    className: "flex w-full flex-col",
    children: [
      jsx.jsx("div", {
        className: "text-sm font-medium text-secondary",
        children: state.ask_me_label,
      }),
      jsx.jsx("div", {
        className: "text-lg font-semibold text-default",
        children: jsx.jsx("q", { children: state[selected.question] }),
      }),
    ],
  });
  const body =
    selectedKey === "translation"
      ? jsx.jsx(initialRuntime.XW, {
          reference: {
            type: "client_defined_widget",
            category: "translation_block",
            data: {
              content: state.translation.source_text,
              translated_text: state.translation.translated_text,
              source_language: state.translation.source_language,
              target_language: state.translation.target_language,
              widget_type: "translation_block_widget_v5",
              metadata: JSON.stringify({ version: "trigger_v5" }),
            },
          },
        })
      : jsx.jsx(
          writingRuntime.t,
          {
            id: content.id,
            directive: {
              id: content.id,
              bodyContent: content.content,
              content: content.content,
              emailMetadata: {
                bcc: undefined,
                cc: undefined,
                recipient: undefined,
                subject: isEmail ? state.email.subject : undefined,
              },
              metadata: undefined,
              title: undefined,
              toneSections: null,
              variant: isEmail ? "email" : "chat_message",
            },
            index: Number(!isEmail),
            isLastNodeInMessage: true,
            sourceMessageId,
            turnContext,
          },
          selectedKey,
        );
  const panel = jsx.jsxs("div", {
    id: panelId,
    className: "flex w-full flex-col gap-3 py-4",
    role: "tabpanel",
    "aria-labelledby": `${panelId}-tab`,
    children: [
      prompt,
      jsx.jsx("div", {
        className: "w-full border-t border-subtle",
        "aria-hidden": "true",
      }),
      body,
    ],
  });
  return jsx.jsxs("div", {
    className: "not-prose my-4 flex w-full min-w-0 flex-col",
    children: [tabList, panel],
  });
}

function initialize(): void {
  sharedRuntime.$3();
  React = sharedRuntime.e6();
  tabsRuntime.n();
  writingRuntime.r();
  initialRuntime.ZW();
  jsx = sharedRuntime.I3();
}
initialize();

export { ConversationalOnboardingWriting };
