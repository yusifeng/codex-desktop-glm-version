import "@rchunk/rolldown-runtime";
import { I3 as getJsxRuntime } from "@rchunk/app-shared";
import "@rchunk/app-initial";

type NetworkPolicy = { type: "disabled" | "unrestricted" } | { type: "restricted"; egress_rules: Array<{ host: string }>; presets?: string[] };
const jsx = getJsxRuntime();
const outboundIdentityQuery = { queryKey: ["environment-outbound-identity"] };
function ScriptConfiguredValue({ script }: { script?: string }): unknown { return jsx.jsx("span", { children: script?.trim() ? "Configured" : "Not set" }); }
function NetworkPolicyValue({ policy }: { policy: NetworkPolicy }): unknown { if (policy.type === "disabled") return jsx.jsx("span", { children: "Disabled" }); if (policy.type === "unrestricted") return jsx.jsx("span", { children: "Unrestricted" }); const restricted = policy as Extract<NetworkPolicy, { type: "restricted" }>; const domains = new Set(restricted.egress_rules.map(rule => rule.host)).size; return jsx.jsx("span", { children: restricted.presets?.includes("package_managers") ? `Package managers${domains ? ` + ${domains} allowed domains` : ""}` : `${domains} allowed domains` }); }
function OrganizationAccessValue({ detail = false, workspaceName }: { detail?: boolean; workspaceName?: string }): unknown { return jsx.jsx("span", { children: detail ? `Everyone in ${workspaceName ?? "this workspace"} can access` : workspaceName ? `Everyone at ${workspaceName}` : "Everyone in this workspace" }); }
function OutboundIdentityValue({ requirement }: { configuration?: unknown; requirement: { connection_id: string; display_name?: string } }): unknown { return jsx.jsx("span", { children: requirement.display_name ?? requirement.connection_id }); }
function initializeOutboundIdentityQuery(): void {}
function initializeResultValues(): void {}
export { initializeResultValues as a, ScriptConfiguredValue as i, OrganizationAccessValue as n, outboundIdentityQuery as o, OutboundIdentityValue as r, initializeOutboundIdentityQuery as s, NetworkPolicyValue as t };
