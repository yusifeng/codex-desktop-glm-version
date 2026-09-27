// chatgpt-project-report-dialog —— 共享 ChatGPT 项目的举报弹窗宿主。
// 原版：app/webview/assets/report-dialog-8c64736bd11c.js。

import * as runtimeChunk from "@rchunk/rolldown-runtime";
import * as appSharedChunk from "@rchunk/app-shared";
import * as appInitialChunk from "@rchunk/app-initial";
import * as codexThreadReportDialogChunk from "@rchunk/codex-thread-report-dialog";
import type { JsxRuntime } from "@rchunk/app-shared";

void runtimeChunk;
const {
  $3: initializeJsxRuntime,
  FX: initializeMaitaiRuntime,
  HX: useSignalValue,
  I3: getJsxRuntime,
  K2: initializeIntlRuntime,
  Y2: FormattedMessage,
} = appSharedChunk;
const {
  Jot: ExternalLink,
  Sun: initializeActiveAccount,
  Xot: initializeExternalLink,
  mun: activeAccountIdSignal,
} = appInitialChunk;
const {
  n: initializeCodexThreadReportDialog,
  t: CodexThreadReportDialog,
} = codexThreadReportDialogChunk;

let jsxRuntime: JsxRuntime | null = null;

interface ChatGptProject {
  gizmo: {
    display: { name: string };
    id: string;
  };
}

interface ChatGptProjectReportDialogProps {
  accountId: string;
  onClose(): void;
  project: ChatGptProject;
}

function LearnMoreLink(children: unknown): unknown {
  return getInitializedJsxRuntime().jsx(ExternalLink, {
    href: "https://openai.com/transparency-and-content-moderation/",
    initiator: "open_in_browser_bridge",
    openTarget: "external-browser",
    children,
  });
}

function ChatGptProjectReportDialog({
  accountId,
  onClose,
  project,
}: ChatGptProjectReportDialogProps): unknown {
  const jsx = getInitializedJsxRuntime();
  const activeAccountId = useSignalValue(activeAccountIdSignal);
  if (activeAccountId !== accountId) return null;

  const projectName = project.gizmo.display.name;
  return jsx.jsx(
    CodexThreadReportDialog,
    {
      onClose,
      reportEntityType: "project",
      successBody: jsx.jsx(FormattedMessage, {
        id: "chatgptProjectHome.report.successBody",
        defaultMessage:
          "We appreciate you taking the time to share this. Our team will review the content to determine if it violates our policies. <learnMore>Learn how reports are handled</learnMore>",
        description:
          "Confirmation after reporting a shared ChatGPT project, with a link to OpenAI's content moderation policy",
        values: { learnMore: LearnMoreLink },
      }),
      threadId: project.gizmo.id,
      title: projectName
        ? jsx.jsx(FormattedMessage, {
            id: "chatgptProjectHome.report.title",
            defaultMessage: "Report {projectName}",
            description:
              "Title of the safety and legal reporting dialog for a shared ChatGPT project, with the project's name",
            values: { projectName },
          })
        : jsx.jsx(FormattedMessage, {
            id: "chatgptProjectHome.report.fallbackTitle",
            defaultMessage: "Report project",
            description:
              "Title of the safety and legal reporting dialog when the shared ChatGPT project has no name",
          }),
    },
    project.gizmo.id,
  );
}

function initializeChatGptProjectReportDialog(): void {
  if (jsxRuntime != null) return;
  initializeJsxRuntime();
  initializeMaitaiRuntime();
  initializeIntlRuntime();
  initializeActiveAccount();
  initializeExternalLink();
  initializeCodexThreadReportDialog();
  jsxRuntime = getJsxRuntime();
}

function getInitializedJsxRuntime(): JsxRuntime {
  initializeChatGptProjectReportDialog();
  if (jsxRuntime == null) {
    throw new Error("Project report dialog JSX runtime failed to initialize");
  }
  return jsxRuntime;
}

initializeChatGptProjectReportDialog();

export { ChatGptProjectReportDialog };
