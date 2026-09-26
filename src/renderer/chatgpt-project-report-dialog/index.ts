// chatgpt-project-report-dialog —— 共享 ChatGPT 项目的举报弹窗宿主。
// 原版：app/webview/assets/report-dialog-8c64736bd11c.js。

import * as runtimeChunk from "@rchunk/rolldown-runtime";
import * as appSharedChunk from "@rchunk/app-shared";
import * as appInitialChunk from "@rchunk/app-initial";
import * as codexThreadReportDialogChunk from "@rchunk/codex-thread-report-dialog";

void runtimeChunk;
const appShared = appSharedChunk as Record<string, any>;
const appInitial = appInitialChunk as Record<string, any>;
const codexThreadReportDialog = codexThreadReportDialogChunk as Record<
  string,
  any
>;
const jsx = appShared.I3();

function LearnMoreLink(children: any) {
  return jsx.jsx(appInitial.Jot, {
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
}: {
  accountId: string;
  onClose: () => void;
  project: any;
}) {
  const activeAccountId = appShared.HX(appInitial.mun);
  if (activeAccountId !== accountId) return null;

  const projectName = project.gizmo.display.name;
  return jsx.jsx(
    codexThreadReportDialog.t,
    {
      onClose,
      reportEntityType: "project",
      successBody: jsx.jsx(appShared.Y2, {
        id: "chatgptProjectHome.report.successBody",
        defaultMessage:
          "We appreciate you taking the time to share this. Our team will review the content to determine if it violates our policies. <learnMore>Learn how reports are handled</learnMore>",
        description:
          "Confirmation after reporting a shared ChatGPT project, with a link to OpenAI's content moderation policy",
        values: { learnMore: LearnMoreLink },
      }),
      threadId: project.gizmo.id,
      title: projectName
        ? jsx.jsx(appShared.Y2, {
            id: "chatgptProjectHome.report.title",
            defaultMessage: "Report {projectName}",
            description:
              "Title of the safety and legal reporting dialog for a shared ChatGPT project, with the project's name",
            values: { projectName },
          })
        : jsx.jsx(appShared.Y2, {
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
  appShared.$3?.();
  appShared.FX?.();
  appShared.K2?.();
  appInitial.Sun?.();
  appInitial.Xot?.();
  codexThreadReportDialog.n?.();
}

initializeChatGptProjectReportDialog();

export { ChatGptProjectReportDialog };
