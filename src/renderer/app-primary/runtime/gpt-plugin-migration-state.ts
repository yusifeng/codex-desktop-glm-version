// @ts-nocheck
import { isTerminalConversationStatus as anySignalEnabled } from "../../app-initial/runtime/is-terminal-conversation-status";
import { n as once } from "@rchunk/rolldown-runtime";
import {
  FX as initializeSignals,
  QI as initializeSharedRuntime,
  ZI as signalScope,
  iZ as createWritableDerivedFamily,
  oZ as createMutableFamily,
  rZ as createDerivedFamily,
} from "@rchunk/app-shared";
import {
  RIt as initializeConversationState,
  Sun as initializeAccounts,
  YVt as conversationSignalOne,
  _Vt as conversationSignalThree,
  _un as currentUserIdSignal,
  bln as parseConversationRoute,
  fN as gptResourceQuery,
  gVt as initializeMigrationRuntime,
  gln as normalizeConversationId,
  mN as initializeRouter,
  mfn as statsigSignalFamily,
  mun as currentAccountIdSignal,
  pfn as initializeGptQueries,
  uHt as initializeConversationSignals,
  vln as initializeGptResource,
  xIt as conversationSignalTwo,
} from "@rchunk/app-initial";

function hasConversationVisit(get, conversationId) {
  return (
    anySignalEnabled(get(conversationSignalOne, conversationId)) ||
    get(conversationSignalTwo, conversationId) ||
    get(conversationSignalThree)
  );
}

let migrationVisitState;
let conversationVisitState;
let migrationVisitEligible;
let migrationConversationEligible;
let migrationNoticeDismissed;

export const initializeGptPluginMigrationState = once(() => {
  initializeSignals();
  initializeAccounts();
  initializeMigrationRuntime();
  initializeSharedRuntime();
  initializeGptQueries();
  initializeConversationState();
  initializeRouter();
  initializeConversationSignals();
  initializeGptResource();
  migrationVisitState = createMutableFamily(
    signalScope,
    () => ({ continued: false, migrationNoticeDismissed: false }),
    undefined,
    {
      autoDispose: true,
      key: ({ gizmoId, visitKey, accountId, userId }) => {
        const conversationId = parseConversationRoute(visitKey)?.params.conversationId;
        return JSON.stringify([
          gizmoId,
          conversationId == null ? visitKey : normalizeConversationId(conversationId),
          accountId,
          userId,
        ]);
      },
    },
  );
  conversationVisitState = createWritableDerivedFamily(
    signalScope,
    (conversationId, { get }) => hasConversationVisit(get, conversationId.conversationId),
    ({ conversationId, ...visit }, { scope, set }) =>
      scope.watch((snapshot) => {
        const visited = hasConversationVisit(snapshot.get, conversationId);
        set(visited);
        if (visited) {
          snapshot.set(migrationVisitState, visit, (state) =>
            state.continued ? state : { ...state, continued: true },
          );
        }
      }),
    { autoDispose: true },
  );
  migrationVisitEligible = createDerivedFamily(
    signalScope,
    ({ gizmoId, visitKey }, { get }) => {
      if (gizmoId == null || !get(statsigSignalFamily, "2160578039")) return false;
      const { data, isError } = get(gptResourceQuery, gizmoId);
      const { continued } = get(migrationVisitState, {
        gizmoId,
        visitKey,
        accountId: get(currentAccountIdSignal),
        userId: get(currentUserIdSignal),
      });
      return !continued && (data == null ? !isError : data.gizmo.gizmo_type === "gpt" && !!data.gizmo.migrated_plugin_id);
    },
    { autoDispose: true },
  );
  migrationConversationEligible = createDerivedFamily(
    signalScope,
    ({ conversationId, ...visit }, { get }) => {
      if (visit.gizmoId == null || !get(statsigSignalFamily, "2160578039")) return false;
      const eligible = get(migrationVisitEligible, visit);
      const visited = get(conversationVisitState, {
        ...visit,
        conversationId,
        accountId: get(currentAccountIdSignal),
        userId: get(currentUserIdSignal),
      });
      return eligible && !visited;
    },
    { autoDispose: true },
  );
  migrationNoticeDismissed = createDerivedFamily(
    signalScope,
    (visit, { get }) =>
      get(migrationVisitState, {
        ...visit,
        accountId: get(currentAccountIdSignal),
        userId: get(currentUserIdSignal),
      }).migrationNoticeDismissed,
    { autoDispose: true },
  );
});

export function markGptPluginMigrationContinued(scope, visit) {
  scope.set(
    migrationVisitState,
    { ...visit, accountId: scope.get(currentAccountIdSignal), userId: scope.get(currentUserIdSignal) },
    (state) => (state.continued ? state : { ...state, continued: true }),
  );
}

export function dismissGptPluginMigrationNotice(scope, visit) {
  scope.set(
    migrationVisitState,
    { ...visit, accountId: scope.get(currentAccountIdSignal), userId: scope.get(currentUserIdSignal) },
    (state) =>
      state.migrationNoticeDismissed ? state : { ...state, migrationNoticeDismissed: true },
  );
}

export { migrationNoticeDismissed, migrationVisitEligible };
