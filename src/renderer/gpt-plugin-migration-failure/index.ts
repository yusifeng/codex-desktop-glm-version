// gpt-plugin-migration-failure —— GPT 迁移时资料文件与头像复制失败详情。
// 原版：app/webview/assets/failure-603af107ec4d.js。

import * as runtimeChunk from "@rchunk/rolldown-runtime";
import * as appSharedChunk from "@rchunk/app-shared";
import * as appInitialChunk from "@rchunk/app-initial";
import type {
  JsxRuntime,
  ScopedSignalFamily,
} from "@rchunk/app-shared";

void runtimeChunk;

export interface MigrationFailedFile extends Record<string, unknown> {
  file_id?: string;
  message?: string;
  type: "knowledge_file" | "profile_picture" | string;
}

export interface MigrationIssue extends Record<string, unknown> {
  message?: string;
  resource: { id?: string; name?: string; type: string };
}

export interface MigrationUploadedFile extends Record<string, unknown> {
  file_id?: string;
  file_response_type?: string;
  name?: string;
}

export interface MigrationFailureValue {
  failedFiles: MigrationFailedFile[];
}

export interface MigrationFailureDetailsProps {
  failedFiles: MigrationFailedFile[];
  files?: MigrationUploadedFile[];
  issues?: MigrationIssue[];
  migrationSucceeded: boolean;
}

const {
  $3: initializeRuntimeLazy,
  FX: initializeSignalRuntime,
  I3: getJsxRuntime,
  K2: initializeReactRuntime,
  QI: initializeAppScope,
  Y2: FormattedMessage,
  ZI: appScope,
  oZ: createSignalFamily,
  om: Alert,
  sm: initializeAlert,
} = appSharedChunk;
const {
  afn: getExperiment,
  ifn: initializeMigrationExperiments,
  n7: AnnouncementBanner,
  r7: initializeAccountPlan,
} = appInitialChunk;

let jsx: JsxRuntime;
let migrationFailureState: ScopedSignalFamily<
  Record<string, unknown>,
  string,
  MigrationFailureValue | null
>;

function initializeMigrationFailureState(): void {
  if (migrationFailureState != null) return;
  initializeSignalRuntime();
  initializeAppScope();
  migrationFailureState = createSignalFamily(appScope, () => null);
}

function isKnowledgeFile(file: MigrationFailedFile): boolean {
  return file.type === "knowledge_file";
}
function isProfilePicture(file: MigrationFailedFile): boolean {
  return file.type === "profile_picture";
}

function FailedKnowledgeFile({
  file,
  files,
  issues,
}: {
  file: MigrationFailedFile;
  files?: MigrationUploadedFile[];
  issues?: MigrationIssue[];
}): unknown {
  const matchingIssues = issues?.filter(
    (issue) =>
      issue.resource.type === "knowledge_file" &&
      file.file_id != null &&
      issue.resource.id === file.file_id,
  );
  const uploadedFile = files?.find(
    (candidate) => candidate.file_id === file.file_id,
  );
  const filename =
    matchingIssues?.find((issue) => issue.resource.name)?.resource.name ||
    (uploadedFile?.file_response_type === "full_file_response"
      ? uploadedFile.name
      : undefined) ||
    file.file_id;
  const message = matchingIssues?.[0]?.message || file.message;
  return jsx.jsx("li", {
    className: "wrap-anywhere text-default select-text",
    children: filename
      ? jsx.jsx(FormattedMessage, {
          id: "chatgptConversations.gpts.migration.referenceFileCopyErrorWithFilename",
          defaultMessage: "<strong>{filename}</strong> — {message}",
          description:
            "One failed reference file and the server's reason it could not be copied during GPT migration",
          values: {
            filename,
            message,
            strong: (children: unknown) => jsx.jsx("strong", { children }),
          },
        })
      : jsx.jsx(FormattedMessage, {
          id: "chatgptConversations.gpts.migration.unnamedReferenceFileCopyErrorWithLabel",
          defaultMessage: "<strong>Reference file</strong> — {message}",
          description:
            "Copy failure and the server's reason when neither a reference file's name nor identifier is available during GPT migration",
          values: {
            message,
            strong: (children: unknown) => jsx.jsx("strong", { children }),
          },
        }),
  });
}

function MigrationFailureDetails({
  failedFiles,
  files,
  issues,
  migrationSucceeded,
}: MigrationFailureDetailsProps): unknown {
  const updatesDisabled =
    getExperiment("2513446768").get("disable_gpt_updates", false);
  const knowledgeFiles = failedFiles.filter(isKnowledgeFile);
  const profilePictures = failedFiles.filter(isProfilePicture);
  const profileWarning =
    profilePictures.length === 0
      ? null
      : jsx.jsx(AnnouncementBanner, {
          type: "warning",
          variant: "callout",
          layout: "vertical",
          role: "alert",
          content: jsx.jsx("p", {
            className: "select-none",
            children: jsx.jsx(FormattedMessage, {
              id: migrationSucceeded
                ? "chatgptConversations.gpts.migration.profileCopyFailedAfterSuccess"
                : "chatgptConversations.gpts.migration.profileCopyFailedBeforeSuccess",
              defaultMessage: migrationSucceeded
                ? "Your plugin was created, but we couldn’t copy the GPT’s profile picture. To add a logo, open your plugin and choose Edit plugin."
                : "We couldn’t copy the GPT’s profile picture. After migration succeeds, open your plugin and choose Edit plugin to add a logo.",
              description: "GPT profile picture copy failure",
            }),
          }),
        });
  let description: unknown;
  if (migrationSucceeded)
    description = jsx.jsx(FormattedMessage, {
      id: "chatgptConversations.gpts.migration.referenceCopyWarningAfterSuccess",
      defaultMessage:
        "Your plugin was created without these files. Open your plugin and choose Edit plugin to add them.",
      description: "Reference files omitted after successful migration",
    });
  else if (updatesDisabled)
    description = jsx.jsx(FormattedMessage, {
      id: "chatgptConversations.gpts.migration.referenceCopyFailedReadonlyDescription",
      defaultMessage: "Your plugin wasn’t created. Try again later.",
      description: "Readonly GPT migration copy failure",
    });
  else
    description = jsx.jsx(FormattedMessage, {
      id: "chatgptConversations.gpts.migration.referenceCopyFailedDescription",
      defaultMessage:
        "Your plugin wasn’t created. Try again, or fix these files and republish the GPT.",
      description: "GPT migration copy failure recovery",
    });
  const fileFailures =
    knowledgeFiles.length === 0
      ? null
      : jsx.jsx(Alert, {
          level: "danger",
          children: jsx.jsxs("div", {
            className: "flex flex-col gap-1 text-sm",
            children: [
              jsx.jsx("h3", {
                className: "font-semibold text-default select-none",
                children: jsx.jsx(FormattedMessage, {
                  id: "chatgptConversations.gpts.migration.referenceCopyFailed",
                  defaultMessage:
                    "{count, plural, one {A reference file couldn’t be synced} other {Reference files couldn’t be synced}}",
                  description: "GPT reference file copy failure heading",
                  values: { count: knowledgeFiles.length },
                }),
              }),
              jsx.jsx("p", {
                className: "text-secondary select-none",
                children: description,
              }),
              jsx.jsx("ul", {
                className: "flex list-disc flex-col gap-1 ps-5",
                children: knowledgeFiles.map((file, index) =>
                  jsx.jsx(FailedKnowledgeFile, { file, files, issues }, index),
                ),
              }),
            ],
          }),
        });
  return jsx.jsxs("div", {
    className: "flex flex-col gap-3 text-start text-sm",
    children: [profileWarning, fileFailures],
  });
}

let initialized = false;
function initializeMigrationFailure(): void {
  if (initialized) return;
  initializeRuntimeLazy();
  initializeReactRuntime();
  initializeAlert();
  initializeMigrationExperiments();
  initializeAccountPlan();
  jsx = getJsxRuntime();
  initialized = true;
}

initializeMigrationFailureState();
initializeMigrationFailure();
export {
  migrationFailureState as i,
  initializeMigrationFailure as n,
  initializeMigrationFailureState as r,
  MigrationFailureDetails as t,
};
