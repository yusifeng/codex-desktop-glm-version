import "@rchunk/rolldown-runtime";
import {
  FX as initializeSignalRuntime,
  QI as initializeQueryRuntime,
  QX as createQueryFamily,
  ZI as appScope,
  g4 as initializeValidationRuntime,
  sZ as createDerivedSignal,
  type MaitaiScopeApi,
} from "@rchunk/app-shared";
import {
  Dln as workspacePermissionsQuery,
  G6t as initializeExperiments,
  K6t as selectedAccountIdSignal,
  Oln as initializeAccounts,
  Sun as initializeApiClient,
  cJt as initializeAuthentication,
  gfn as experimentClientSignal,
  mfn as featureFlagFamily,
  pfn as initializeFeatureFlags,
  rJt as apiClient,
  vfn as suppressBrowserSkillsSignal,
  yun as authenticationStateSignal,
} from "@rchunk/app-initial";

interface BrowserSkill {
  creator_id?: string | null;
  description?: string;
  display_name?: string | null;
  enabled?: boolean;
  id: string;
  name: string;
  permissions?: { can_write?: boolean };
  safety_check_status?: string | null;
  safety_scan?: { risk_score?: number | null } | null;
  short_description?: string | null;
  surfaces?: string[] | null;
  updated_at: string;
  [key: string]: unknown;
}

interface BrowserSkillsIdentity { accountId: string; isWorkspace: boolean; userId: string; }
interface BrowserSkillsConfig { get<T>(key: string, fallback: T): T; }
interface SafetySettings { blockedScore: number; enabledFrom: string; warningScore: number; }
interface AuthenticationState {
  accountId?: string | null;
  accountLoading?: boolean;
  accountStructure?: string | null;
  authenticatedAccountId?: string | null;
  authLoading?: boolean;
  authMethod?: string | null;
  userId?: string | null;
}
interface BrowserSkillsQueryClient {
  cancelQueries(options: { queryKey: unknown[] }): Promise<unknown>;
  setQueriesData<T>(options: { queryKey: unknown[] }, updater: (value: T | undefined) => T | undefined): void;
  setQueryData<T>(queryKey: unknown[], value: T | ((current: T | undefined) => T | undefined)): void;
}

const systemSkillId = "system_699a14cbc6e4819181b9a89478de1733";
let browserSkillsConfigSignal: unknown;
let browserSkillsIdentitySignal: unknown;
let browserSkillsEnabledSignal: unknown;
let browserSkillSafetySettingsSignal: unknown;
let canCreateBrowserSkillsSignal: unknown;
let canUploadBrowserSkillsSignal: unknown;
let workspaceSkillsRbacSignal: unknown;
let browserSkillsCollectionQuery: unknown;
let browserSkillDetailQuery: unknown;
let browserSkillShareCapabilitiesSignal: unknown;
let browserSkillSharesQuery: unknown;

function canEditBrowserSkill(skill: BrowserSkill, userId: string): boolean {
  return !skill.id.startsWith("system_") && (skill.permissions?.can_write ?? (skill.creator_id != null && skill.creator_id === userId));
}

function getBrowserSkillSafetyStatus(skill: BrowserSkill, settings: SafetySettings): "blocked" | "needsReview" | null {
  if (!(Date.parse(skill.updated_at) > Date.parse(settings.enabledFrom)) || skill.safety_check_status === "approved") return null;
  const score = skill.safety_scan?.risk_score;
  return score == null || Number.isNaN(score) ? null
    : score >= settings.blockedScore ? "blocked"
      : score >= settings.warningScore ? "needsReview" : null;
}

function supportsBrowserSkillSurface(skill: BrowserSkill, surface: string): boolean {
  return !skill.surfaces?.length || skill.surfaces.includes(surface);
}

function getBrowserSkillDisplayName(skill: BrowserSkill): string {
  return skill.display_name?.trim() || skill.name;
}

function supportsSystemSkill(skill: BrowserSkill, enabled: boolean): boolean {
  return skill.id !== systemSkillId || enabled;
}

async function setBrowserSkillEnabled(scope: MaitaiScopeApi<unknown>, skill: BrowserSkill, enabled: boolean): Promise<boolean> {
  const identity = scope.get(browserSkillsIdentitySignal) as BrowserSkillsIdentity | null;
  if (identity == null || scope.get(browserSkillsEnabledSignal) !== true || (!enabled && skill.id.startsWith("system_"))) return false;
  await apiClient.safePost(`/hazelnuts/{hazelnut_id}/status`, {
    additionalHeaders: { "ChatGPT-Account-ID": identity.accountId },
    parameters: { path: { hazelnut_id: skill.id } },
    requestBody: { enabled },
  });
  const rootKey = ["browser-skills", identity.accountId, identity.userId];
  const queryClient = scope.queryClient as BrowserSkillsQueryClient;
  await queryClient.cancelQueries({ queryKey: rootKey });
  queryClient.setQueriesData({ queryKey: [...rootKey, "collection"] }, (skills: BrowserSkill[] | undefined) =>
    skills?.map((item) => item.id === skill.id ? { ...item, enabled } : item));
  queryClient.setQueryData([...rootKey, "collection", "installed"], (skills: BrowserSkill[] | undefined) =>
    enabled ? [...(skills?.filter((item) => item.id !== skill.id) ?? []), { ...skill, enabled }]
      : skills?.filter((item) => item.id !== skill.id));
  queryClient.setQueryData([...rootKey, "detail", skill.id], { ...skill, enabled });
  const current = scope.get(browserSkillsIdentitySignal) as BrowserSkillsIdentity | null;
  return current?.accountId === identity.accountId && current.userId === identity.userId;
}

async function approveBrowserSkill(scope: MaitaiScopeApi<unknown>, skill: BrowserSkill): Promise<void> {
  const identity = scope.get(browserSkillsIdentitySignal) as BrowserSkillsIdentity | null;
  if (identity == null || scope.get(browserSkillsEnabledSignal) !== true) return;
  const approved = await apiClient.safePatch<BrowserSkill>(`/hazelnuts/{hazelnut_id}`, {
    additionalHeaders: { "ChatGPT-Account-ID": identity.accountId },
    parameters: { path: { hazelnut_id: skill.id } },
    requestBody: { safety_check_status: "approved" },
  });
  const rootKey = ["browser-skills", identity.accountId, identity.userId];
  const queryClient = scope.queryClient as BrowserSkillsQueryClient;
  await queryClient.cancelQueries({ queryKey: rootKey });
  queryClient.setQueriesData({ queryKey: [...rootKey, "collection"] }, (skills: BrowserSkill[] | undefined) =>
    skills?.map((item) => item.id === skill.id ? approved : item));
  queryClient.setQueryData([...rootKey, "detail", skill.id], approved);
}

function initializeSystemSkillId(): void {}

function initializeBrowserSkillsState(): void {
  if (browserSkillsConfigSignal != null) return;
  initializeSignalRuntime(); initializeValidationRuntime(); initializeExperiments(); initializeApiClient();
  initializeAccounts(); initializeAuthentication(); initializeQueryRuntime(); initializeFeatureFlags();
  browserSkillsConfigSignal = createDerivedSignal(appScope, ({ get }) =>
    get(suppressBrowserSkillsSignal) ? null : ((get(experimentClientSignal) as { getDynamicConfig?(id: string): BrowserSkillsConfig | null } | null)?.getDynamicConfig?.("3553340571") ?? null));
  browserSkillsIdentitySignal = createDerivedSignal(appScope, ({ get }) => {
    const auth = get(authenticationStateSignal) as AuthenticationState;
    const selectedAccountId = get(selectedAccountIdSignal) as string | null;
    return auth.authLoading || auth.accountLoading || auth.authMethod !== "chatgpt" || selectedAccountId == null || auth.accountId !== selectedAccountId || auth.authenticatedAccountId !== selectedAccountId || auth.userId == null
      ? null : { accountId: selectedAccountId, userId: auth.userId, isWorkspace: auth.accountStructure === "workspace" };
  });
  browserSkillsEnabledSignal = createDerivedSignal(appScope, ({ get }) => {
    const config = get(browserSkillsConfigSignal) as BrowserSkillsConfig | null;
    const identity = get(browserSkillsIdentitySignal) as BrowserSkillsIdentity | null;
    if (config == null || identity == null) return null;
    if (!config.get("enable_api", false)) return false;
    if (!identity.isWorkspace) return true;
    const rbacEnabled = get(featureFlagFamily, "1355972088") as boolean;
    if (rbacEnabled && !config.get("skills_rbac_enabled", false)) return true;
    const permissions = get(workspacePermissionsQuery, identity.accountId) as { data?: { beta_settings?: { skills?: boolean }; permissions?: string[] }; isError?: boolean; isLoading?: boolean };
    return permissions.isLoading ? null : rbacEnabled
      ? !permissions.isError && permissions.data?.permissions?.includes("chatgpt.workspace.skills.access") === true
      : (permissions.data?.beta_settings?.skills ?? true);
  });
  browserSkillSafetySettingsSignal = createDerivedSignal(appScope, ({ get }) => {
    const config = get(browserSkillsConfigSignal) as BrowserSkillsConfig | null;
    const numberOr = (value: unknown, fallback: number) => Number.isFinite(Number(value)) ? Number(value) : fallback;
    return { enabledFrom: config?.get("enable_safety_filter_date", "") ?? "", warningScore: numberOr(config?.get("hazelnut_min_warning_safety_score", undefined), 2), blockedScore: numberOr(config?.get("hazelnut_min_blocked_safety_score", undefined), 5) };
  });
  workspaceSkillsRbacSignal = createDerivedSignal(appScope, ({ get }) =>
    (get(browserSkillsIdentitySignal) as BrowserSkillsIdentity | null)?.isWorkspace === true &&
    Boolean((get(browserSkillsConfigSignal) as BrowserSkillsConfig | null)?.get("skills_rbac_enabled", false)));
  canCreateBrowserSkillsSignal = createDerivedSignal(appScope, ({ get }) => get(browserSkillsEnabledSignal) === true);
  canUploadBrowserSkillsSignal = createDerivedSignal(appScope, ({ get }) => get(browserSkillsEnabledSignal) === true);
  browserSkillsCollectionQuery = createQueryFamily(appScope, (collection: string, { get }) => {
    const identity = get(browserSkillsIdentitySignal) as BrowserSkillsIdentity | null;
    const shared = collection === "workspace-shared" || collection === "shared-personal";
    return {
      queryKey: ["browser-skills", identity?.accountId, identity?.userId, "collection", collection],
      enabled: get(browserSkillsEnabledSignal) === true && identity != null && (!shared || identity.isWorkspace) && (collection !== "shared-personal" || get(workspaceSkillsRbacSignal) === true),
      staleTime: 300_000,
      queryFn: async () => {
        if (identity == null) throw new Error("Skills account unavailable");
        const response = await apiClient.safeGet<{ hazelnuts: BrowserSkill[] }>("/hazelnuts", { additionalHeaders: { "ChatGPT-Account-ID": identity.accountId }, parameters: { query: { scope: collection, include_permissions: true } } });
        return response.hazelnuts;
      },
    };
  });
  browserSkillDetailQuery = createQueryFamily(appScope, (skillId: string, { get }) => {
    const identity = get(browserSkillsIdentitySignal) as BrowserSkillsIdentity | null;
    return { queryKey: ["browser-skills", identity?.accountId, identity?.userId, "detail", skillId], enabled: get(browserSkillsEnabledSignal) === true && identity != null, staleTime: 300_000, retryOnMount: false, queryFn: () => {
      if (identity == null) throw new Error("Skills account unavailable");
      return apiClient.safeGet("/hazelnuts/{hazelnut_id}", { additionalHeaders: { "ChatGPT-Account-ID": identity.accountId }, expectedErrorStatuses: [403, 404], parameters: { path: { hazelnut_id: skillId }, query: { include_permissions: true } } });
    } };
  });
  browserSkillShareCapabilitiesSignal = createDerivedSignal(appScope, ({ get }) => {
    const identity = get(browserSkillsIdentitySignal) as BrowserSkillsIdentity | null;
    return { individuals: identity?.isWorkspace === true, workspace: identity?.isWorkspace === true, enableWorkspace: identity?.isWorkspace === true };
  });
  browserSkillSharesQuery = createQueryFamily(appScope, (skillId: string, { get }) => {
    const identity = get(browserSkillsIdentitySignal) as BrowserSkillsIdentity | null;
    return { queryKey: ["browser-skills", identity?.accountId, identity?.userId, "shares", skillId], enabled: identity?.isWorkspace === true && get(browserSkillsEnabledSignal) === true, staleTime: 60_000, queryFn: () => {
      if (identity == null) throw new Error("Skills account unavailable");
      return apiClient.safeGet("/hazelnuts/{hazelnut_id}/share", { additionalHeaders: { "ChatGPT-Account-ID": identity.accountId }, parameters: { path: { hazelnut_id: skillId } } });
    } };
  });
}

export { getBrowserSkillDisplayName as _, browserSkillSafetySettingsSignal as a, supportsBrowserSkillSurface as b, canCreateBrowserSkillsSignal as c, browserSkillsIdentitySignal as d, workspaceSkillsRbacSignal as f, supportsSystemSkill as g, canEditBrowserSkill as h, browserSkillDetailQuery as i, canUploadBrowserSkillsSignal as l, systemSkillId as m, initializeBrowserSkillsState as n, browserSkillSharesQuery as o, browserSkillShareCapabilitiesSignal as p, setBrowserSkillEnabled as r, browserSkillsEnabledSignal as s, approveBrowserSkill as t, browserSkillsCollectionQuery as u, getBrowserSkillSafetyStatus as v, initializeSystemSkillId as y };
