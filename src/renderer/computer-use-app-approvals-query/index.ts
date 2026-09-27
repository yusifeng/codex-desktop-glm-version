import "@rchunk/rolldown-runtime";
import {
  $O as timeConstants,
  FX as initializeSignalRuntime,
  QI as initializeQueryRuntime,
  UI as invokeDesktopBridge,
  ZI as appScope,
  eZ as createQuerySignal,
  ek as initializeQuerySignals,
  rZ as createDerivedFamily,
} from "@rchunk/app-shared";
import {
  $fn as initializeHostRequirements,
  $sn as initializeRemoteControlState,
  Qfn as readRemoteControlState,
  Su as isComputerUseAvailable,
  Ysn as hostRequirementsQuery,
  mfn as featureGateFamily,
  mnt as initializeDesktopBridge,
  pfn as initializeFeatureGates,
  pnt as desktopBridge,
  xu as initializeComputerUseAvailability,
} from "@rchunk/app-initial";

interface HostRequirements {
  computerUse?: { allowLockedComputerUse?: boolean };
}

interface HostRequirementsResult {
  data?: { requirements?: HostRequirements };
}

interface ComputerUseSettingsBridge {
  getAppApprovals(): Promise<unknown>;
  getLockedUseState(): Promise<unknown>;
  getMessagesReadDecisions(): Promise<unknown>;
  getMessagesSendApprovals(): Promise<unknown>;
  getSoundMode(): Promise<unknown>;
  removeAppApproval(id: string): Promise<unknown>;
  removeMessagesReadDecision(id: string): Promise<unknown>;
  removeMessagesSendApproval(id: string): Promise<unknown>;
  searchMessagesChats(query: string): Promise<unknown>;
  setLockedUseEnabled(enabled: boolean): Promise<unknown>;
  setMessagesReadAccessPolicy(policy: unknown): Promise<unknown>;
  setMessagesReadDecision(id: string, decision: unknown, metadata: unknown): Promise<unknown>;
  setMessagesSendAllowAllChats(enabled: boolean): Promise<unknown>;
  setSoundMode(mode: unknown): Promise<unknown>;
}

const computerUseSettings = (desktopBridge as unknown as {
  computerUseSettings: ComputerUseSettingsBridge;
}).computerUseSettings;

let computerUseEnabledForHost: unknown;
let searchQueue = Promise.resolve();
let appApprovalsQuery: unknown;
let messagesReadDecisionsQuery: unknown;
let messagesSendApprovalsQuery: unknown;
let soundModeQuery: unknown;
let lockedUseQuery: unknown;

function initializeComputerUseAvailabilityQuery(): void {
  initializeSignalRuntime();
  initializeRemoteControlState();
  initializeComputerUseAvailability();
  initializeQueryRuntime();
  initializeHostRequirements();
  initializeFeatureGates();
  computerUseEnabledForHost = createDerivedFamily(
    appScope,
    (hostId: string, { get }): boolean =>
      get(featureGateFamily, "2296472986")
      && isComputerUseAvailable({
        remoteControlConnectionsState: readRemoteControlState(
          get,
          "remote_control_connections_state",
        ),
        slingshotEnabled: get(featureGateFamily, "1042620455"),
      })
      && (get(hostRequirementsQuery, { hostId }) as HostRequirementsResult)
        .data?.requirements?.computerUse?.allowLockedComputerUse !== false,
  );
}

const removeAppApproval = (id: string) =>
  invokeDesktopBridge(computerUseSettings.removeAppApproval(id));

async function searchMessagesChats(query: string, signal: AbortSignal): Promise<unknown> {
  const request = searchQueue.then(() => {
    signal.throwIfAborted();
    return invokeDesktopBridge(computerUseSettings.searchMessagesChats(query));
  });
  searchQueue = request.then(() => undefined, () => undefined);
  const result = await request;
  signal.throwIfAborted();
  return result;
}

const setMessagesReadAccessPolicy = (policy: unknown) =>
  invokeDesktopBridge(computerUseSettings.setMessagesReadAccessPolicy(policy));
const setMessagesReadDecision = (id: string, decision: unknown, metadata: unknown) =>
  invokeDesktopBridge(computerUseSettings.setMessagesReadDecision(id, decision, metadata));
const removeMessagesReadDecision = (id: string) =>
  invokeDesktopBridge(computerUseSettings.removeMessagesReadDecision(id));
const setMessagesSendAllowAllChats = (enabled: boolean) =>
  invokeDesktopBridge(computerUseSettings.setMessagesSendAllowAllChats(enabled));
const removeMessagesSendApproval = (id: string) =>
  invokeDesktopBridge(computerUseSettings.removeMessagesSendApproval(id));
const setSoundMode = (mode: unknown) =>
  invokeDesktopBridge(computerUseSettings.setSoundMode(mode));
const setLockedUseEnabled = (enabled: boolean) =>
  invokeDesktopBridge(computerUseSettings.setLockedUseEnabled(enabled));

function initializeComputerUseApprovalQueries(): void {
  initializeSignalRuntime();
  initializeDesktopBridge();
  initializeQueryRuntime();
  initializeQuerySignals();
  const query = (
    queryKey: string,
    queryFn: () => Promise<unknown>,
    staleTime: number,
  ) => createQuerySignal(appScope, () => ({
    queryFn,
    queryKey: [queryKey],
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
    staleTime,
  }));
  appApprovalsQuery = query(
    "computer-use-app-approvals",
    () => invokeDesktopBridge(computerUseSettings.getAppApprovals()),
    timeConstants.ONE_MINUTE,
  );
  messagesReadDecisionsQuery = query(
    "messages-read-decisions",
    () => invokeDesktopBridge(computerUseSettings.getMessagesReadDecisions()),
    timeConstants.ONE_MINUTE,
  );
  messagesSendApprovalsQuery = query(
    "messages-send-approvals",
    () => invokeDesktopBridge(computerUseSettings.getMessagesSendApprovals()),
    timeConstants.ONE_MINUTE,
  );
  soundModeQuery = query(
    "computer-use-sound-mode",
    () => invokeDesktopBridge(computerUseSettings.getSoundMode()),
    timeConstants.FIVE_SECONDS,
  );
  lockedUseQuery = query(
    "locked-computer-use",
    () => invokeDesktopBridge(computerUseSettings.getLockedUseState()),
    timeConstants.FIVE_SECONDS,
  );
}

export {
  initializeComputerUseAvailabilityQuery as _,
  messagesReadDecisionsQuery as a,
  removeMessagesReadDecision as c,
  setLockedUseEnabled as d,
  setMessagesReadAccessPolicy as f,
  computerUseEnabledForHost as g,
  setSoundMode as h,
  lockedUseQuery as i,
  removeMessagesSendApproval as l,
  setMessagesSendAllowAllChats as m,
  soundModeQuery as n,
  messagesSendApprovalsQuery as o,
  setMessagesReadDecision as p,
  initializeComputerUseApprovalQueries as r,
  removeAppApproval as s,
  appApprovalsQuery as t,
  searchMessagesChats as u,
};
