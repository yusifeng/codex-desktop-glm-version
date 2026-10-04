// plan-tab-content —— 计划侧栏 Markdown 内容与每个计划独立的滚动位置。

import "@rchunk/rolldown-runtime";
import {
  $3 as initializeSharedRuntime,
  FX as initializeSharedFeatures,
  HX as useSignalValue,
  I3 as getJsxRuntime,
  __ as useCallbackRefImport,
  g_ as initializeCallbackRef,
} from "@rchunk/app-shared";
import { Dyt as hostIdSignal, byt as initializeHostState } from "@rchunk/app-initial";
// @ts-expect-error The generated declaration is updated centrally after module registration.
import { wt as initializeConversationSurfaceImport } from "@rchunk/app-primary";
import { PLAN_SELECTION_SURFACE_ATTRIBUTE as conversationDataAttribute } from "../app-primary/runtime/plan-selection-surface";
import { i as initializeMarkdownSurface, r as MarkdownSurface } from "@rchunk/surface";
import type { JsxRuntime } from "@rchunk/app-shared";

interface PlanTabState { planKey?: string | null; scrollTop: number }
interface PlanSidePanelTabContentProps {
  content: string;
  conversationId: string;
  cwd?: string | null;
  hideCodeBlocks?: boolean;
  planKey: string;
  setTabState(next: PlanTabState | ((current: PlanTabState) => PlanTabState)): void;
  tabState: PlanTabState;
}
type CallbackRef<Element> = (element: Element | null) => void | (() => void);
type UseCallbackRef = <Element>(callback: CallbackRef<Element>) => CallbackRef<Element>;

const useCallbackRef = useCallbackRefImport as unknown as UseCallbackRef;
const initializeConversationSurface = initializeConversationSurfaceImport as unknown as () => void;
let jsx: JsxRuntime;
let initialized = false;

function initializePlanSidePanelTabContent(): void {
  if (initialized) return;
  initializeSharedRuntime();
  initializeSharedFeatures();
  initializeMarkdownSurface();
  initializeHostState();
  initializeCallbackRef();
  initializeConversationSurface();
  jsx = getJsxRuntime();
  initialized = true;
}

function PlanSidePanelTabContent({ content, conversationId, cwd, hideCodeBlocks, planKey, setTabState, tabState }: PlanSidePanelTabContentProps): unknown {
  const hostId = useSignalValue<string>(hostIdSignal);
  const ref = useCallbackRef<HTMLDivElement>((element) => {
    if (element == null) return;
    element.scrollTop = tabState.planKey === planKey ? tabState.scrollTop : 0;
    return () => {
      const scrollTop = element.scrollTop;
      setTabState((current) => current.planKey === planKey && current.scrollTop === scrollTop ? current : { planKey, scrollTop });
    };
  });
  return jsx.jsx("div", {
    ref,
    className: "h-full min-h-0 overflow-y-auto px-1",
    [conversationDataAttribute]: conversationId,
    children: jsx.jsx(MarkdownSurface, { markdown: content, conversationId, cwd, hideCodeBlocks, hostId }),
  }, planKey);
}

initializePlanSidePanelTabContent();
export { PlanSidePanelTabContent };
