import "@rchunk/rolldown-runtime";
import {
  $O as timeConstants,
  FX as initializeSignalRuntime,
  QI as initializeQueryRuntime,
  QX as createQueryFamily,
  XX as createInfiniteQueryFamily,
  YX as createMutationSignal,
  ZI as appScope,
  eZ as createQuerySignal,
  ek as initializeQuerySignals,
  uL as infiniteQueryOptions,
} from "@rchunk/app-shared";
import {
  Jr as githubConnectorId,
  Kr as githubEnterpriseTemplateId,
  Sdn as ApiError,
  Yr as initializeConnectorConstants,
  pdn as initializeAccountApi,
  udn as apiClient,
  wdn as initializeApiErrors,
} from "@rchunk/app-initial";

type ShareSettings = "private" | string;
type SecretDomain = string | null;

interface RemoteSecret {
  domain?: SecretDomain;
  name: string;
}

interface EnvironmentSecret {
  domain?: SecretDomain;
  key: string;
  previousDomain?: SecretDomain;
  previousKey?: string;
  value: string;
}

interface CloudEnvironment {
  agent_network_access?: unknown;
  auto_setup_settings?: unknown;
  cache_settings?: unknown;
  description?: string;
  enable_authtranslator?: boolean;
  enable_docker_in_docker?: boolean;
  env_vars?: Record<string, string>;
  etag?: string;
  github_connector_id?: string | null;
  label?: string;
  machine_id?: string;
  maintenance_setup?: string | string[];
  repo_map?: Record<string, { repository_full_name?: string }>;
  repos: string[];
  secrets?: Record<string, unknown>;
  secrets_with_domains?: RemoteSecret[];
  setup?: string | string[];
  share_settings?: ShareSettings;
  share_targets?: Array<{ email: string }>;
  task_count?: number;
  workspace_dir?: string;
}

interface EnvironmentForm {
  agentNetworkAccess: unknown;
  autoSetupSettings: unknown;
  cacheSettings: unknown;
  description: string;
  enableAuthtranslator: boolean;
  enableDockerInDocker: boolean;
  environmentVariables: Array<{ key: string; value: string }>;
  githubConnectorId: string | null;
  label: string;
  machineId: string;
  maintenanceSetupCommands: string;
  repositoryId: string;
  repositoryName: string;
  secrets: EnvironmentSecret[];
  setupCommands: string;
  shareSettings: ShareSettings;
  shareTargets: string[];
  workspaceDirectory: string;
}

interface Connector {
  id: string;
  labels?: { admin_only_connector?: string };
  name: string;
  status?: string;
  template_id?: string;
}

interface Installation {
  account_login: string;
  account_type: string;
  id: string;
}

const redactedSecretValue = "<REDACTED>";
const defaultMachineId = "wham-public/wham-universal";
let productHeaders: Record<string, string>;
let connectorProductHeaders: Record<string, string>;

function setupCommands(value?: string | string[]): string {
  return Array.isArray(value) ? value.join("\n") : (value ?? "");
}

function normalizeDomain(domain?: string | null): SecretDomain {
  return domain?.trim() || null;
}

function secretIdentity(name: string, domain: SecretDomain): string {
  return `${name}::${domain ?? "__global__"}`;
}

function remoteSecrets(environment?: CloudEnvironment | null): RemoteSecret[] {
  if (environment?.secrets_with_domains != null) {
    return environment.secrets_with_domains.flatMap((secret) =>
      typeof secret.name !== "string" || secret.name === ""
        ? []
        : [{ name: secret.name, domain: secret.domain ?? null }]);
  }
  return Object.keys(environment?.secrets ?? {}).map((key) => {
    const [domain, ...nameParts] = key.split("::");
    return nameParts.length === 0
      ? { name: key, domain: null }
      : { name: nameParts.join("::") || key, domain: domain || null };
  });
}

function environmentToForm(
  environment?: CloudEnvironment | null,
  fallbackConnectorId?: string | null,
): EnvironmentForm {
  const secrets = remoteSecrets(environment);
  const repositoryId = environment?.repos[0] ?? "";
  return {
    label: environment?.label ?? "",
    description: environment?.description ?? "",
    shareSettings: environment?.share_settings ?? "private",
    shareTargets: environment?.share_targets?.map(({ email }) => email) ?? [],
    machineId: environment?.machine_id ?? defaultMachineId,
    repositoryId,
    repositoryName:
      environment?.repo_map?.[repositoryId]?.repository_full_name ?? repositoryId,
    githubConnectorId: environment?.github_connector_id ?? fallbackConnectorId ?? null,
    workspaceDirectory: environment?.workspace_dir ?? "/workspace",
    agentNetworkAccess: environment?.agent_network_access ?? { mode: "off" },
    setupCommands: setupCommands(environment?.setup),
    maintenanceSetupCommands: setupCommands(environment?.maintenance_setup),
    secrets: secrets.map(({ name, domain }) => ({
      key: name,
      value: redactedSecretValue,
      domain,
      previousKey: name,
      previousDomain: domain,
    })),
    environmentVariables: Object.entries(environment?.env_vars ?? {}).map(([key, value]) => ({ key, value })),
    autoSetupSettings: environment?.auto_setup_settings ?? { use_auto_setup: true },
    cacheSettings: environment?.cache_settings ?? { post_setup_cache_enabled: true },
    enableAuthtranslator: environment?.enable_authtranslator ?? false,
    enableDockerInDocker: environment?.enable_docker_in_docker ?? false,
  };
}

function requiresGlobalRenameValue(secret: EnvironmentSecret): boolean {
  return secret.previousDomain !== undefined
    && secret.previousDomain == null
    && normalizeDomain(secret.domain) == null
    && secret.previousKey != null
    && secret.previousKey !== secret.key.trim()
    && secret.value === redactedSecretValue;
}

function validateEnvironmentForm(form: EnvironmentForm): Record<string, string> {
  const errors: Record<string, string> = {};
  if (form.label.trim() === "") errors.label = "required";
  if (form.machineId === "") errors.machineId = "required";
  if (form.repositoryId === "") errors.repositoryId = "required";
  const secrets = form.secrets.map(({ key, domain }) => ({
    key: key.trim(),
    identity: secretIdentity(key.trim(), normalizeDomain(domain)),
  }));
  if (secrets.some(({ key }) => key === "")) errors.secrets = "name-required";
  else if (new Set(secrets.map(({ identity }) => identity)).size !== secrets.length) {
    errors.secrets = "duplicate-name";
  } else if (form.secrets.some(({ value }) => value.trim() === "")) {
    errors.secrets = "value-required";
  } else if (form.secrets.some(requiresGlobalRenameValue)) {
    errors.secrets = "global-rename-value-required";
  }
  const variableNames = form.environmentVariables.map(({ key }) => key.trim());
  if (variableNames.some((key) => key === "")) errors.environmentVariables = "name-required";
  else if (new Set(variableNames).size !== variableNames.length) {
    errors.environmentVariables = "duplicate-name";
  } else if (form.environmentVariables.some(({ value }) => value.trim() === "")) {
    errors.environmentVariables = "value-required";
  }
  return errors;
}

function canSaveEnvironment(form: EnvironmentForm, canChangeMachine: boolean, currentMachineId: string): boolean {
  return (canChangeMachine || form.machineId === currentMachineId)
    && Object.keys(validateEnvironmentForm(form)).length === 0;
}

function shareTargets(form: EnvironmentForm) {
  return form.shareSettings === "private" ? [] : form.shareTargets
    .map((email) => email.trim())
    .filter((email) => email !== "")
    .map((email) => ({ email, permission: "editor", type: "user" }));
}

function createEnvironmentRequest(form: EnvironmentForm) {
  return {
    label: form.label.trim(), description: form.description, machine_id: form.machineId,
    repos: [form.repositoryId], github_connector_id: form.githubConnectorId,
    workspace_dir: form.workspaceDirectory, agent_network_access: form.agentNetworkAccess,
    setup: form.setupCommands, maintenance_setup: form.maintenanceSetupCommands,
    env_vars: Object.fromEntries(form.environmentVariables.map(({ key, value }) => [key.trim(), value])),
    secrets_with_domains: form.secrets.map(({ key, value, domain }) => ({
      name: key.trim(), domain: normalizeDomain(domain), value,
    })),
    share_settings: form.shareSettings, share_targets: shareTargets(form),
    auto_setup_settings: form.autoSetupSettings, cache_settings: form.cacheSettings,
    enable_authtranslator: form.enableAuthtranslator,
    enable_docker_in_docker: form.enableDockerInDocker,
  };
}

function connectorIdFromUri(value: string): string | null {
  const separator = value.indexOf(":");
  return separator === -1 ? null : value.slice(7, separator);
}

function secretUpdates(current: EnvironmentSecret[], previous: RemoteSecret[]) {
  const retained = new Set<string>();
  const updates: Array<Record<string, unknown>> = [];
  for (const secret of current) {
    const name = secret.key.trim();
    const domain = normalizeDomain(secret.domain);
    if (secret.previousDomain === undefined) {
      if (secret.value !== "") {
        retained.add(secretIdentity(name, domain));
        updates.push({ name, domain, value: secret.value });
      }
      continue;
    }
    const previousName = secret.previousKey ?? secret.key;
    const previousDomain = normalizeDomain(secret.previousDomain);
    retained.add(secretIdentity(previousName, previousDomain));
    const renamed = previousName !== name;
    const moved = previousDomain !== domain;
    const valueChanged = secret.value !== redactedSecretValue;
    if (renamed || moved || valueChanged) {
      updates.push({
        name, domain, value: valueChanged ? secret.value : null,
        previous_domain: previousDomain,
        ...(renamed ? { previous_name: previousName } : {}),
      });
    }
  }
  for (const { name, domain } of previous) {
    if (!retained.has(secretIdentity(name, domain))) {
      updates.push({ name, domain: null, value: null, previous_domain: domain });
    }
  }
  return updates;
}

function updateEnvironmentRequest(form: EnvironmentForm, environment: CloudEnvironment) {
  return {
    etag: environment.etag,
    label: form.label.trim(), description: form.description, machine_id: form.machineId,
    workspace_dir: form.workspaceDirectory, agent_network_access: form.agentNetworkAccess,
    setup: form.setupCommands, maintenance_setup: form.maintenanceSetupCommands,
    env_vars: Object.fromEntries(form.environmentVariables.map(({ key, value }) => [key.trim(), value])),
    secrets_with_domains: secretUpdates(form.secrets, remoteSecrets(environment)),
    share_settings: form.shareSettings, share_targets: shareTargets(form),
    auto_setup_settings: form.autoSetupSettings, cache_settings: form.cacheSettings,
    enable_authtranslator: form.enableAuthtranslator,
    enable_docker_in_docker: form.enableDockerInDocker,
  };
}

function initializeEnvironmentConstants(): void {
  // Constants are eager in maintainable source; this initializer preserves the chunk API.
}

async function fetchGithubConnectors({ applyEligibilityFilter }: { applyEligibilityFilter: boolean }): Promise<Connector[]> {
  const [github, { connectors }] = await Promise.all([
    apiClient.safeGet<Connector>("/aip/connectors/{connector_id}", {
      parameters: { path: { connector_id: githubConnectorId }, query: {
        include_actions: false, apply_eligibility_filter: applyEligibilityFilter,
      } },
      additionalHeaders: productHeaders,
      expectedErrorStatuses: [403, 404],
    }).catch((error: unknown) => {
      if (error instanceof ApiError && (error.status === 403 || error.status === 404)) return null;
      throw error;
    }),
    apiClient.safeGet<{ connectors: Connector[] }>("/ps/connectors/by-template", {
      parameters: { query: { template_id: githubEnterpriseTemplateId } },
      additionalHeaders: productHeaders,
    }),
  ]);
  return [...(github == null ? [] : [github]), ...connectors]
    .filter((connector) => connector.id === "connector_76869538009648d5b282a4bb21c3d157"
      || connector.template_id === "templated_apps_GitHubEnterprise")
    .sort((left, right) => left.id === "connector_76869538009648d5b282a4bb21c3d157"
      ? -1
      : right.id === "connector_76869538009648d5b282a4bb21c3d157"
        ? 1
        : left.name.localeCompare(right.name));
}

function initializeConnectorQueries(): void {
  initializeAccountApi();
  initializeApiErrors();
  initializeConnectorConstants();
  productHeaders = { "OAI-Product-Sku": "CODEX" };
}

const searchEnvironments = (query: string, cursor: string | null, limit: number) =>
  apiClient.safeGet<{ cursor?: string | null }>("/wham/environments/search", {
    parameters: { query: { query: query || undefined, cursor: cursor ?? undefined, limit } },
  });
const compareEnvironmentUsage = (left: CloudEnvironment, right: CloudEnvironment) =>
  (right.task_count ?? 0) - (left.task_count ?? 0)
  || (left.label ?? "").localeCompare(right.label ?? "");
const getEnvironment = (environmentId: string) => apiClient.safeGet<CloudEnvironment>(
  "/wham/environments/{environment_id}/with-creator-and-machine",
  { parameters: { path: { environment_id: environmentId } } },
);
const getMachines = () => apiClient.safeGet("/wham/machines");

async function getLinkedGithubConnectors(): Promise<Connector[]> {
  const connectors = (await fetchGithubConnectors({ applyEligibilityFilter: true }))
    .filter((connector) => connector.status !== "DISABLED_BY_ADMIN"
      && connector.labels?.admin_only_connector !== "true");
  const links = await Promise.all(connectors.map((connector) => apiClient.safeGet<{ link?: unknown }>(
    "/aip/connectors/{connector_id}/link",
    { parameters: { path: { connector_id: connector.id } }, additionalHeaders: connectorProductHeaders },
  )));
  return connectors.filter((_connector, index) => links[index].link != null);
}

const searchRepositories = (query: string, connectorId: string, page?: number) =>
  apiClient.safeGet("/wham/github/repositories/search/all-installations", {
    parameters: { query: { query, limit: 20, page, connector_id: connectorId } },
  });
const getGithubHandle = async (connectorId: string) => {
  const response = await apiClient.safeGet<{ github_handle: string }>(
    "/wham/task_suggestions/github/user_handle",
    { parameters: { query: { connector_id: connectorId } } },
  );
  return response.github_handle;
};
const getInstallations = (connectorId: string) => apiClient.safeGet(
  "/wham/github/installations/v2",
  { parameters: { query: { connector_id: connectorId } } },
);

function getRepositoryPage(
  input: { connectorId: string; installation: Installation | null; query: string },
  page: number,
) {
  if (input.query !== "") {
    return input.installation == null
      ? searchRepositories(input.query, input.connectorId, page)
      : apiClient.safeGet("/wham/github/repositories/search", { parameters: { query: {
        account_login: input.installation.account_login,
        account_type: input.installation.account_type,
        query: input.query, page, per_page: 20, connector_id: input.connectorId,
      } } });
  }
  const query = { page, per_page: 20, connector_id: input.connectorId };
  return input.installation == null
    ? apiClient.safeGet("/wham/github/list-repositories", { parameters: { query } })
    : apiClient.safeGet("/wham/github/repositories/v2/{installation_id}", {
      parameters: { path: { installation_id: input.installation.id }, query },
    });
}

const createEnvironment = (requestBody: unknown) => apiClient.safePost("/wham/environments", { requestBody });
const updateEnvironment = ({ environmentId, requestBody }: { environmentId: string; requestBody: unknown }) =>
  apiClient.safePatch("/wham/environments/{environment_id}", {
    parameters: { path: { environment_id: environmentId } }, requestBody,
  });
const deleteEnvironment = (environmentId: string) => apiClient.safeDelete(
  "/wham/environments/{environment_id}",
  { parameters: { path: { environment_id: environmentId } } },
);
const resetEnvironmentCache = (environmentId: string) => apiClient.safePost(
  "/wham/environments/{environment_id}/reset-cache",
  { parameters: { path: { environment_id: environmentId } } },
);

function initializeEnvironmentApi(): void {
  initializeConnectorQueries();
  initializeAccountApi();
  connectorProductHeaders = { "OAI-Product-Sku": "CODEX" };
}

function environmentSearchOptions(query: string) {
  return infiniteQueryOptions({
    queryKey: ["cloud-environments", "search", query],
    queryFn: ({ pageParam }: { pageParam: string | null }) =>
      searchEnvironments(query, pageParam, pageParam == null ? 25 : 100),
    initialPageParam: null,
    getNextPageParam: (page: { cursor?: string | null }) => page.cursor ?? null,
    refetchOnMount: true,
    retry: false,
    staleTime: timeConstants.FIVE_MINUTES,
  });
}

interface QueryScope {
  query: {
    getOptions(query: unknown, parameter: unknown): { queryKey: readonly unknown[] };
    invalidate(query: unknown, parameter: unknown, options: { exact: boolean }): Promise<unknown>;
  };
  queryClient: {
    invalidateQueries(options: { queryKey: readonly unknown[] }): Promise<unknown>;
    removeQueries(options: { queryKey: readonly unknown[] }): void;
  };
}

async function invalidateEnvironmentLists(scope: QueryScope): Promise<void> {
  await Promise.all([
    scope.queryClient.invalidateQueries({ queryKey: ["cloud-environments", "search"] }),
    scope.queryClient.invalidateQueries({ queryKey: ["environments"] }),
    scope.queryClient.invalidateQueries({ queryKey: ["workspace", "environments-search"] }),
    scope.queryClient.invalidateQueries({ queryKey: ["workspace", "environments-by-repo"] }),
  ]);
}

let environmentDetailsQuery: unknown;
let machinesQuery: unknown;
let githubConnectorsQuery: unknown;
let githubHandleQuery: unknown;
let installationsQuery: unknown;
let repositoryPagesQuery: unknown;
let repositorySearchQuery: unknown;
let createEnvironmentMutation: unknown;
let updateEnvironmentMutation: unknown;
let deleteEnvironmentMutation: unknown;
let resetEnvironmentCacheMutation: unknown;

function initializeCloudEnvironmentQueries(): void {
  initializeSignalRuntime();
  initializeQueryRuntime();
  initializeQuerySignals();
  initializeEnvironmentApi();
  environmentDetailsQuery = createQueryFamily(appScope, (environmentId: string) => ({
    queryKey: ["cloud-environments", "details", environmentId], queryFn: () => getEnvironment(environmentId),
    refetchOnMount: true, staleTime: timeConstants.FIVE_MINUTES,
  }));
  machinesQuery = createQuerySignal(appScope, () => ({
    queryKey: ["cloud-environments", "machines"], queryFn: getMachines,
    refetchOnMount: true, retry: false, staleTime: timeConstants.FIVE_MINUTES,
  }));
  githubConnectorsQuery = createQuerySignal(appScope, () => ({
    queryKey: ["cloud-environments", "github-connectors"], queryFn: getLinkedGithubConnectors,
    refetchOnMount: true, refetchOnWindowFocus: true, retry: false, staleTime: timeConstants.FIVE_MINUTES,
  }));
  githubHandleQuery = createQueryFamily(appScope, (connectorId: string) => ({
    queryKey: ["cloud-environments", "github-user-handle", connectorId], queryFn: () => getGithubHandle(connectorId),
    refetchOnWindowFocus: false, retry: false, staleTime: timeConstants.FIVE_MINUTES,
  }));
  installationsQuery = createQueryFamily(appScope, (connectorId: string) => ({
    queryKey: ["cloud-environments", "github-installations", connectorId], queryFn: () => getInstallations(connectorId),
    refetchOnWindowFocus: false, retry: false, staleTime: timeConstants.FIVE_MINUTES,
  }));
  repositoryPagesQuery = createInfiniteQueryFamily(appScope, (input: {
    connectorId: string; installation: Installation | null; query: string;
  }) => ({
    queryKey: ["cloud-environments", "github-repository-pages", input.connectorId, input.installation?.id ?? null, input.query],
    initialPageParam: 1,
    queryFn: ({ pageParam }: { pageParam: number }) => getRepositoryPage(input, pageParam),
    getNextPageParam: (page: { repositories: unknown[] }, _pages: unknown[], pageNumber: number) =>
      page.repositories.length === 20 ? pageNumber + 1 : undefined,
    refetchOnWindowFocus: false, staleTime: timeConstants.FIVE_MINUTES,
  }));
  repositorySearchQuery = createQueryFamily(appScope, ({ connectorId, query }: {
    connectorId: string | null; query: string;
  }) => ({
    queryKey: ["cloud-environments", "repositories", connectorId, query],
    enabled: query !== "" && connectorId != null,
    queryFn: () => {
      if (connectorId == null) throw new Error("A connector ID is required to search repositories");
      return searchRepositories(query, connectorId);
    },
    refetchOnMount: true, refetchOnWindowFocus: true, retry: false, staleTime: timeConstants.FIVE_MINUTES,
  }));
  createEnvironmentMutation = createMutationSignal(appScope, ({ scope }) => ({
    mutationFn: createEnvironment,
    onSuccess: () => invalidateEnvironmentLists(scope as unknown as QueryScope),
  }));
  updateEnvironmentMutation = createMutationSignal(appScope, ({ scope }) => ({
    mutationFn: updateEnvironment,
    onSuccess: async (_result: unknown, { environmentId }: { environmentId: string }) => {
      await Promise.all([
        invalidateEnvironmentLists(scope as unknown as QueryScope),
        (scope as unknown as QueryScope).query.invalidate(environmentDetailsQuery, environmentId, { exact: true }),
      ]);
    },
  }));
  deleteEnvironmentMutation = createMutationSignal(appScope, ({ scope }) => ({
    mutationFn: deleteEnvironment,
    onSuccess: async (_result: unknown, environmentId: string) => {
      const typedScope = scope as unknown as QueryScope;
      typedScope.queryClient.removeQueries({
        queryKey: typedScope.query.getOptions(environmentDetailsQuery, environmentId).queryKey,
      });
      await invalidateEnvironmentLists(typedScope);
    },
  }));
  resetEnvironmentCacheMutation = createMutationSignal(appScope, ({ scope }) => ({
    mutationFn: resetEnvironmentCache,
    onSuccess: (_result: unknown, environmentId: string) =>
      (scope as unknown as QueryScope).query.invalidate(environmentDetailsQuery, environmentId, { exact: true }),
  }));
}

export {
  initializeEnvironmentConstants as C,
  updateEnvironmentRequest as S,
  fetchGithubConnectors as _,
  githubConnectorsQuery as a,
  connectorIdFromUri as b,
  githubHandleQuery as c,
  initializeCloudEnvironmentQueries as d,
  resetEnvironmentCacheMutation as f,
  initializeConnectorQueries as g,
  initializeEnvironmentApi as h,
  environmentSearchOptions as i,
  createEnvironmentMutation as l,
  compareEnvironmentUsage as m,
  machinesQuery as n,
  installationsQuery as o,
  updateEnvironmentMutation as p,
  repositorySearchQuery as r,
  repositoryPagesQuery as s,
  environmentDetailsQuery as t,
  deleteEnvironmentMutation as u,
  canSaveEnvironment as v,
  validateEnvironmentForm as w,
  environmentToForm as x,
  createEnvironmentRequest as y,
};
