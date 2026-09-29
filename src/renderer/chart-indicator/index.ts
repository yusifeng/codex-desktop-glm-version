// Epic chart patient/encounter banner resolved from message metadata or native launch state.

import "@rchunk/rolldown-runtime";
import * as appSharedChunk from "@rchunk/app-shared";
import * as appInitialChunk from "@rchunk/app-initial";
// @ts-expect-error The generated chunk declaration is added centrally after registration.
import * as contractsChunk from "@rchunk/contracts";

interface JsxRuntime { jsx(type: unknown, props: object, key?: string): unknown }
interface ReactRuntime { useSyncExternalStore<Value>(subscribe: (listener: () => void) => () => void, getSnapshot: () => Value, getServerSnapshot: () => Value): Value }
interface ParseResult { success: boolean; data?: { epic_patient_label: string; epic_encounter_label?: string | null } }
interface Schema { safeParse(value: unknown): ParseResult }
interface StringSchema { nullable(): StringSchema; optional(): StringSchema }
interface MessageRecord { message?: { id?: string | null; metadata?: unknown } }
interface NativeLaunchBridge { pending(): string | null; get(): string | null; destination(): string | null; ownsMessage(messageId: string): boolean }
interface QueryResult<Data> { data?: Data; isError: boolean }

const shared = appSharedChunk as unknown as {
  $3?: () => void;
  BX?: <Data>(query: unknown, parameter: unknown) => Data;
  FX?: () => void;
  H4?: (shape: Record<string, unknown>) => Schema;
  I3: () => JsxRuntime;
  K2?: () => void;
  Y2?: unknown;
  _L?: <Data>(options: Record<string, unknown>) => QueryResult<Data>;
  e6: () => ReactRuntime;
  g4?: () => StringSchema;
  gL?: () => void;
  q4?: () => void;
};
const initial = appInitialChunk as unknown as {
  RVt?: unknown;
  cJt?: () => void;
  n7?: unknown;
  r7?: () => void;
  rJt?: { safePost(path: string, options: Record<string, unknown>): Promise<{ patient_label?: string; encounter_label?: string }> };
  uHt?: () => void;
};
const contracts = contractsChunk as unknown as { r?: () => void; t?: string };
const { $3: initializeSharedRuntime, BX: useScopedQuery, FX: initializeSignals, H4: createSchema, I3: getJsxRuntime, K2: initializeReactCompilerRuntime, Y2: FormattedMessage, _L: useQuery, e6: getReactRuntime, g4: stringSchema, gL: initializeQueryRuntime, q4: initializeQueryClient } = shared;
const { RVt: conversationMessagesQuery, cJt: initializeEpicQueries, n7: CompactNotice, r7: initializeEpicRuntime, rJt: apiClient, uHt: initializeNativeLaunch } = initial;
const { r: initializeContracts, t: nativeLaunchEvent } = contracts;

let jsx: JsxRuntime;
let React: ReactRuntime;
let metadataSchema: Schema;
let initialized = false;

function initializeEpicChartIndicator(): void {
  if (initialized) return;
  initializeSharedRuntime?.();
  initializeQueryRuntime?.();
  initializeSignals?.();
  React = getReactRuntime();
  initializeReactCompilerRuntime?.();
  initializeQueryClient?.();
  initializeEpicQueries?.();
  initializeNativeLaunch?.();
  initializeEpicRuntime?.();
  initializeContracts?.();
  jsx = getJsxRuntime();
  const patient = stringSchema?.();
  metadataSchema = createSchema?.({ epic_patient_label: patient, epic_encounter_label: patient?.nullable().optional() }) ?? { safeParse: () => ({ success: false }) };
  initialized = true;
}

function EpicChartIndicator({ conversationId }: { conversationId: string }): unknown {
  initializeEpicChartIndicator();
  const messages = useScopedQuery?.<Record<string, MessageRecord>>(conversationMessagesQuery, conversationId);
  const metadata = metadataSchema.safeParse(Object.values(messages ?? {}).find(hasEpicMetadata)?.message?.metadata);
  const pendingLaunch = React.useSyncExternalStore(subscribeNativeLaunch, readPendingLaunch, readNoLaunch);
  const nativeLaunch = pendingLaunch ?? (Object.values(messages ?? {}).some(isOwnedEpicMessage) ? getNativeLaunch()?.get() ?? null : null);
  const destination = nativeLaunch == null ? null : getNativeLaunch()?.destination() ?? null;
  const query = useQuery?.<{ patient_label?: string; encounter_label?: string }>({ queryKey: ["epic-launch-preview", destination], enabled: nativeLaunch != null && !metadata.success, queryFn: () => apiClient?.safePost("/epic/native-launch/resolve", { requestBody: { snapshot: nativeLaunch ?? "" } }), staleTime: Number.POSITIVE_INFINITY, gcTime: 0, retry: false }) ?? { isError: false };
  const patient = metadata.success ? metadata.data?.epic_patient_label : query.data?.patient_label;
  const encounter = metadata.success ? metadata.data?.epic_encounter_label : query.data?.encounter_label;
  return ChartIdentity({ patient, encounter, unavailable: query.isError && !metadata.success });
}

function ChartIdentity({ patient, encounter, unavailable }: { patient?: string | null; encounter?: string | null; unavailable?: boolean }): unknown {
  if (patient == null && !unavailable) return null;
  if (unavailable) return jsx.jsx(CompactNotice ?? "div", { density: "compact", content: jsx.jsx(FormattedMessage ?? "span", { id: "epic.chart.unavailable", defaultMessage: "Reopen ChatGPT from the patient’s chart in Epic to continue" }) });
  if (encounter == null) return jsx.jsx(CompactNotice ?? "div", { density: "compact", content: patient });
  return jsx.jsx(CompactNotice ?? "div", { density: "compact", content: jsx.jsx(FormattedMessage ?? "span", { id: "epic.chart.patientEncounter", defaultMessage: "{patient} · {encounter}", values: { patient, encounter } }) });
}

function getNativeLaunch(): NativeLaunchBridge | undefined { return (globalThis as unknown as { __oaiEpicNativeLaunch?: NativeLaunchBridge }).__oaiEpicNativeLaunch; }
function hasEpicMetadata(record: MessageRecord): boolean { return metadataSchema.safeParse(record.message?.metadata).success; }
function isOwnedEpicMessage(record: MessageRecord): boolean { const id = record.message?.id; return id != null && getNativeLaunch()?.ownsMessage(id) === true; }
function readPendingLaunch(): string | null { return getNativeLaunch()?.pending() ?? null; }
function readNoLaunch(): null { return null; }
function subscribeNativeLaunch(listener: () => void): () => void {
  if (nativeLaunchEvent == null || typeof globalThis.addEventListener !== "function") return () => undefined;
  globalThis.addEventListener(nativeLaunchEvent, listener);
  return () => globalThis.removeEventListener(nativeLaunchEvent, listener);
}

initializeEpicChartIndicator();
export { EpicChartIndicator };
