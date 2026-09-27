// settings-route-state —— 设置页 history state 的容错解析器。
import * as runtimeChunk from "@rchunk/rolldown-runtime";
import * as appSharedChunk from "@rchunk/app-shared";
void runtimeChunk;

const {
  H4: objectSchema,
  R4: literalSchema,
  g4: initializeSchemaRuntime,
  q4: stringSchema,
} = appSharedChunk;

interface SettingsRouteState extends Record<string, unknown> {
  passkeyEnrollmentCompleted?: true;
  pepperOnboardingAccountId?: string;
  pepperOnboardingPersonalization?: true;
  returnToPreviousHistoryEntry?: true;
  securitySubviewHasParent?: true;
  workspaceRoot?: string | null;
}

let routeStateSchema: import("@rchunk/app-shared").SafeParseSchema<SettingsRouteState>;

function parseState(value: unknown): SettingsRouteState | null {
  const result = routeStateSchema.safeParse(value);
  return result.success ? result.data : null;
}

function didCompletePasskeyEnrollment(value: unknown): boolean {
  return parseState(value)?.passkeyEnrollmentCompleted === true;
}

function getPepperOnboardingAccountId(value: unknown): string | null {
  const state = parseState(value);
  return state?.pepperOnboardingPersonalization === true
    ? (state.pepperOnboardingAccountId ?? null)
    : null;
}

function shouldReturnToPreviousHistoryEntry(value: unknown): boolean {
  return parseState(value)?.returnToPreviousHistoryEntry === true;
}

function hasSecuritySubviewParent(value: unknown): boolean {
  return parseState(value)?.securitySubviewHasParent === true;
}

function readWorkspaceRoot(value: unknown): {
  hasValue: boolean;
  workspaceRoot: string | null;
} {
  const state = parseState(value);
  return state == null || !Object.hasOwn(state, "workspaceRoot")
    ? { hasValue: false, workspaceRoot: null }
    : { hasValue: true, workspaceRoot: state.workspaceRoot ?? null };
}

function initializeSettingsRouteState(): void {
  initializeSchemaRuntime();
  routeStateSchema = objectSchema<SettingsRouteState>({
    passkeyEnrollmentCompleted: literalSchema(true).optional(),
    pepperOnboardingPersonalization: literalSchema(true).optional(),
    pepperOnboardingAccountId: stringSchema().optional(),
    returnToPreviousHistoryEntry: literalSchema(true).optional(),
    securitySubviewHasParent: literalSchema(true).optional(),
    workspaceRoot: stringSchema().min(1).nullable().optional(),
  }).loose();
}

initializeSettingsRouteState();

export {
  readWorkspaceRoot as a,
  shouldReturnToPreviousHistoryEntry as i,
  didCompletePasskeyEnrollment as n,
  initializeSettingsRouteState as o,
  getPepperOnboardingAccountId as r,
  hasSecuritySubviewParent as t,
};
