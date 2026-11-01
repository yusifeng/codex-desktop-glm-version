import { n as onceExport } from "@rchunk/rolldown-runtime";
import {
  $3 as initializeCompilerRuntime,
  $O as staleTimes,
  BX as useScopedQuery,
  FX as initializeMaitai,
  HX as useSignalValue,
  I3 as getJsxRuntime,
  K2 as initializeInternationalization,
  QI as initializeScope,
  QX as createQueryFamily,
  Y2 as FormattedMessage,
  ZI as appScope,
  ek as initializeQueryRuntime,
  type JsxRuntime,
} from "@rchunk/app-shared";
import {
  Sun as initializeWorkspaceAccount,
  mnt as initializeEnvironmentConfigs,
  mun as workspaceIdSignal,
  pnt as desktopServices,
  rht as initializeWorkspaceQuery,
  uht as useWorkspace,
} from "@rchunk/app-initial";

type NetworkPolicy =
  | { type: "disabled" }
  | { type: "unrestricted" }
  | {
      type: "restricted";
      egress_rules: Array<{ host: string }>;
      presets?: string[];
    };
interface OutboundIdentityConfiguration {
  accountId: string;
  configId: string;
  userId: string;
}
interface OutboundIdentityRequirement {
  connection_id: string;
}
interface EnvironmentConfigsService {
  listOutboundIdentityConnections(
    input: OutboundIdentityConfiguration,
  ): Promise<unknown>;
}

const once = onceExport as (initializer: () => void) => () => void;
let jsx: JsxRuntime;
let outboundIdentityQuery: any;

const initializeOutboundIdentityQuery = once(() => {
  initializeMaitai();
  initializeEnvironmentConfigs();
  initializeScope();
  initializeQueryRuntime();
  outboundIdentityQuery = createQueryFamily(
    appScope,
    (configuration: OutboundIdentityConfiguration | null | undefined) => {
      const environmentConfigs = (
        desktopServices as unknown as {
          environmentConfigs?: EnvironmentConfigsService;
        }
      )?.environmentConfigs;
      return {
        queryKey: [
          "environment-outbound-identity",
          configuration?.accountId,
          configuration?.userId,
          configuration?.configId,
        ],
        enabled: environmentConfigs != null && configuration != null,
        staleTime: staleTimes.FIVE_SECONDS,
        refetchOnMount: "always",
        retry: false,
        queryFn: async () => {
          if (environmentConfigs == null || configuration == null)
            throw new Error("Outbound identity is unavailable");
          const response =
            await environmentConfigs.listOutboundIdentityConnections(
              configuration,
            );
          const parsed = response as {
            ok: boolean;
            data?: unknown;
            error?: unknown;
            status?: number;
          };
          return parsed.ok
            ? { ok: true, data: parsed.data }
            : { ok: false, error: parsed.error, status: parsed.status };
        },
      };
    },
  );
});

function ScriptConfiguredValue({ script }: { script?: string }): unknown {
  return script?.trim()
    ? jsx.jsx(FormattedMessage, {
        id: "environmentSetup.result.script.configured",
        defaultMessage: "Configured",
        description:
          "Summary indicating that an environment install script or start skill contains non-whitespace content; this does not indicate review or validation",
      })
    : jsx.jsx(FormattedMessage, {
        id: "restricted.environmentSetup.result.script.empty",
        defaultMessage: "Not set",
        description:
          "Summary for an empty environment install script or start skill",
      });
}

function NetworkPolicyValue({ policy }: { policy: NetworkPolicy }): unknown {
  if (policy.type === "disabled")
    return jsx.jsx(FormattedMessage, {
      id: "restricted.environmentSetup.result.network.disabled",
      defaultMessage: "Disabled",
      description:
        "Value shown when networking is disabled for an environment setup result",
    });
  if (policy.type === "unrestricted")
    return jsx.jsx(FormattedMessage, {
      id: "restricted.environmentSetup.result.network.unrestricted",
      defaultMessage: "Unrestricted",
      description:
        "Summary for an environment that allows unrestricted network access",
    });
  const domainCount = new Set(policy.egress_rules.map(({ host }) => host)).size;
  if (policy.presets?.includes("package_managers")) {
    return domainCount > 0
      ? jsx.jsx(FormattedMessage, {
          id: "restricted.environmentSetup.result.network.packageManagersWithDomains",
          defaultMessage:
            "Package managers + {count, plural, one {# allowed domain} other {# allowed domains}}",
          description:
            "Network summary for the package-manager preset plus separately allowed domains; the count excludes domains supplied by the preset",
          values: { count: domainCount },
        })
      : jsx.jsx(FormattedMessage, {
          id: "restricted.environmentSetup.result.network.packageManagers",
          defaultMessage: "Package managers",
          description:
            "Network summary when only the package-manager preset is allowed",
        });
  }
  return jsx.jsx(FormattedMessage, {
    id: "restricted.environmentSetup.result.network.domains",
    defaultMessage:
      "{count, plural, one {# allowed domain} other {# allowed domains}}",
    description:
      "Number of explicitly allowed domains in a restricted environment network policy without presets",
    values: { count: domainCount },
  });
}

function OrganizationAccessValue({
  detail = false,
}: {
  detail?: boolean;
}): unknown {
  const { data: workspace } = useWorkspace();
  const workspaceId = useSignalValue(workspaceIdSignal);
  const workspaceName =
    workspace?.id === workspaceId ? workspace.name?.trim() : undefined;
  if (detail) {
    return workspaceName
      ? jsx.jsx(FormattedMessage, {
          id: "restricted.environmentSetup.access.organizationDescriptionNamed",
          defaultMessage: "Everyone in {workspaceName} can access",
          description:
            "Help text below the organization access option in environment onboarding. workspaceName is the authenticated workspace's display name; selecting the option lets its members use the environment",
          values: { workspaceName },
        })
      : jsx.jsx(FormattedMessage, {
          id: "restricted.environmentSetup.access.organizationDescriptionFallback",
          defaultMessage: "Everyone in this workspace can access",
          description:
            "Help text below the organization access option in environment onboarding while the authenticated workspace name is unavailable; selecting the option lets workspace members use the environment",
        });
  }
  return workspaceName
    ? jsx.jsx(FormattedMessage, {
        id: "restricted.environmentSetup.access.organizationName",
        defaultMessage: "Everyone at {workspaceName}",
        description:
          "Short visibility option in environment onboarding, settings, task summary, and result. workspaceName is the authenticated workspace's display name; the other option is private access",
        values: { workspaceName },
      })
    : jsx.jsx(FormattedMessage, {
        id: "restricted.environmentSetup.access.organizationFallback",
        defaultMessage: "Everyone in this workspace",
        description:
          "Short visibility option in environment onboarding, settings, task summary, and result while the authenticated workspace name is unavailable; the other option is private access",
      });
}

function OutboundIdentityValue({
  configuration,
  requirement,
}: {
  configuration?: OutboundIdentityConfiguration;
  requirement: OutboundIdentityRequirement;
}): unknown {
  const { data } = useScopedQuery(outboundIdentityQuery, configuration) as {
    data?: {
      ok: boolean;
      data?: { items: Array<{ connection_id: string; display_name?: string }> };
    };
  };
  const connection = data?.ok
    ? data.data?.items.find(
        (item) => item.connection_id === requirement.connection_id,
      )
    : undefined;
  return jsx.jsx(jsx.Fragment, {
    children: connection?.display_name ?? requirement.connection_id,
  });
}

const initializeResultValues = once(() => {
  initializeCompilerRuntime();
  initializeMaitai();
  initializeInternationalization();
  initializeWorkspaceAccount();
  initializeWorkspaceQuery();
  initializeOutboundIdentityQuery();
  jsx = getJsxRuntime();
});

export {
  initializeResultValues as a,
  ScriptConfiguredValue as i,
  OrganizationAccessValue as n,
  outboundIdentityQuery as o,
  OutboundIdentityValue as r,
  initializeOutboundIdentityQuery as s,
  NetworkPolicyValue as t,
};
