// environment-setup-review-entry —— 对话上方的环境配置变更审阅入口。
// 原版：app/webview/assets/entry-9dfda8bcdb55.js。

import * as runtimeChunk from "@rchunk/rolldown-runtime";
import * as appSharedChunk from "@rchunk/app-shared";
import * as appInitialChunk from "@rchunk/app-initial";
import * as appPrimaryChunk from "@rchunk/app-primary";
import * as fixedSurfaceChunk from "@rchunk/above-composer-fixed-content-surface";
import * as secretRowChunk from "@rchunk/secret-row";
import * as rowChunk from "@rchunk/environment-variable-row";
import * as changeMessagesChunk from "@rchunk/change-messages";
import * as configurationFieldsChunk from "@rchunk/configuration-fields";

void runtimeChunk;
void appPrimaryChunk;
void secretRowChunk;
void rowChunk;
void changeMessagesChunk;
void configurationFieldsChunk;

interface JsxRuntime { Fragment: unknown; jsx(type: unknown, props: Record<string, unknown>, key?: unknown): unknown; jsxs(type: unknown, props: Record<string, unknown>, key?: unknown): unknown }
interface ReactRuntime { useState<T>(initial: T): [T, (value: T) => void] }
interface QueryResult<Data> { data?: Data; error?: unknown; isFetching?: boolean; isPending?: boolean; refetch(): Promise<{ isError?: boolean }> }
interface Scope { get<T>(signal: unknown, parameter?: unknown): T; set?<T>(signal: unknown, value: T, parameter?: unknown): void }
interface AppSharedBindings { $3(): void; BX<Parameter, Data>(query: unknown, parameter: Parameter): QueryResult<Data>; I3(): JsxRuntime; K2(): void; LX(scope: unknown): Scope; Y2: unknown; ZI: unknown; e6(): ReactRuntime }
interface AppInitialBindings {
  Gm: unknown;
  Hm: unknown;
  Qm: unknown;
  Vm: unknown;
  Xm(scope: Scope, conversationId: string): void;
  Ypt: unknown;
  Zpt: unknown;
  dmt: unknown;
  emt: unknown;
  ifn(): void;
}
interface FixedSurfaceBindings { n(): void; t: unknown }

type ReviewSection = "network" | "scripts" | "name" | "repositories" | "secrets" | "variables" | "privacy" | "connections";
interface EnvironmentDraft { id: string; revision: string; [key: string]: unknown }
interface DraftResponse { draft?: EnvironmentDraft | null }

const { $3: initializeRuntime, BX: useQuery, I3: getJsxRuntime, K2: initializeComponents, LX: useScope, Y2: FormattedMessage, ZI: appScope, e6: getReactRuntime } = appSharedChunk as unknown as AppSharedBindings;
const { Gm: sectionsQuery, Hm: pendingSectionsQuery, Qm: acceptedSectionsQuery, Vm: revisionSignal, Xm: clearReviewState, Ypt: draftQuery, Zpt: saveQuery, dmt: sectionDraftFamily, emt: sectionErrorFamily, ifn: initializeFeatureGates } = appInitialChunk as unknown as AppInitialBindings;
const { n: initializeFixedSurface, t: FixedSurface } = fixedSurfaceChunk as unknown as FixedSurfaceBindings;

initializeRuntime(); initializeComponents(); initializeFeatureGates(); initializeFixedSurface();
const React = getReactRuntime();
const jsx = getJsxRuntime();

const sectionLabels: Record<ReviewSection, string> = {
  network: "Allow Codex to access the internet?",
  scripts: "Configure setup instructions",
  name: "What should this environment be called?",
  repositories: "Choose repositories",
  secrets: "Configure secrets",
  variables: "Configure environment variables",
  privacy: "Who can use this environment?",
  connections: "Configure identity connections",
};

function EnvironmentSetupReviewEntry({ conversationId }: { conversationId: string }): unknown {
  const scope = useScope(appScope);
  const draftState = useQuery<string, DraftResponse>(draftQuery, conversationId);
  const saveState = useQuery<string, unknown>(saveQuery, conversationId);
  const sections = useQuery<string, ReviewSection[]>(sectionsQuery, conversationId).data ?? [];
  const pendingSections = useQuery<string, ReviewSection[]>(pendingSectionsQuery, conversationId).data ?? [];
  const [open, setOpen] = React.useState(false);

  if (draftState.data?.draft == null || pendingSections.length === 0) return null;

  const refreshAndOpen = async (): Promise<void> => {
    const revision = scope.get<string | null>(revisionSignal, conversationId);
    const result = await draftState.refetch();
    if (!result.isError && scope.get<string | null>(revisionSignal, conversationId) === revision) {
      clearReviewState(scope, conversationId);
      setOpen(true);
    }
  };

  return jsx.jsxs("div", { className: "mb-2 flex min-w-0 flex-col gap-2", children: [
    open
      ? jsx.jsx(ReviewDialog, { conversationId, draft: draftState.data.draft, sections, pendingSections, disabled: Boolean(saveState.isPending || draftState.error), onClose: () => setOpen(false) }, `${draftState.data.draft.id}:${draftState.data.draft.revision}`)
      : jsx.jsx(FixedSurface, { children: jsx.jsx("button", { type: "button", disabled: draftState.isFetching || saveState.isPending, onClick: () => void refreshAndOpen(), children: jsx.jsx(FormattedMessage, { id: "environmentSetup.review.needsAttentionCount", defaultMessage: `Needs attention (${pendingSections.length})`, values: { count: pendingSections.length } }) }) }),
    draftState.error != null || saveState.error != null
      ? jsx.jsx("p", { className: "text-sm text-danger", role: "alert", children: "Couldn’t confirm the saved draft. Try again or open the environment editor" })
      : null,
  ] });
}

function ReviewDialog({ conversationId, draft, sections, pendingSections, disabled, onClose }: { conversationId: string; draft: EnvironmentDraft; sections: ReviewSection[]; pendingSections: ReviewSection[]; disabled: boolean; onClose(): void }): unknown {
  const [index, setIndex] = React.useState(Math.max(0, sections.findIndex((section) => pendingSections.includes(section))));
  const section = sections[index];
  const sectionDraft = useQuery<{ conversationId: string; section: ReviewSection }, Record<string, unknown>>(sectionDraftFamily, { conversationId, section }).data ?? draft;
  const sectionError = useQuery<{ conversationId: string; section: ReviewSection }, unknown>(sectionErrorFamily, { conversationId, section }).error;
  const scope = useScope(appScope);
  const next = (skip: boolean): void => {
    if (!skip && sectionError == null) scope.set?.(acceptedSectionsQuery, section, conversationId);
    if (index >= sections.length - 1) onClose(); else setIndex(index + 1);
  };
  return jsx.jsxs("section", { role: "dialog", "aria-label": "Review environment changes", children: [
    jsx.jsx("h2", { children: sectionLabels[section] }),
    jsx.jsx("pre", { children: JSON.stringify(sectionDraft, null, 2) }),
    sectionError == null ? null : jsx.jsx("p", { role: "alert", children: "This section needs attention before it can be accepted" }),
    jsx.jsxs("div", { children: [
      jsx.jsx("button", { type: "button", disabled, onClick: () => next(true), children: "Skip" }),
      jsx.jsx("button", { type: "button", disabled: disabled || sectionError != null, onClick: () => next(false), children: index === sections.length - 1 ? "Done" : "Next" }),
      jsx.jsx("button", { type: "button", onClick: onClose, children: "Close" }),
    ] }),
  ] });
}

export { EnvironmentSetupReviewEntry };
