// Environment-setup result card. This owns the release component contract
// instead of exposing the earlier repository/branch mock.

import { I3 as getJsxRuntime } from "@rchunk/app-shared";
import * as appInitial from "@rchunk/app-initial";
import "@rchunk/result-values";

type OpenSection = "repositories" | "secrets" | "connections" | "network" | "scripts" | "privacy";
interface NetworkPolicy { type?: "restricted" | "unrestricted" | "disabled" | string; egress_rules?: Array<{ host?: string }>; [key: string]: unknown }
interface ResultDetails {
  access?: string; name: string; networkDomains?: string[]; networkEnabled?: boolean; networkPolicy?: NetworkPolicy;
  outboundIdentityRequirements?: unknown[] | null; repositories: string[]; runtime?: string | null; secretNames: string[];
  setupScript?: string | null; startSkill?: string | null; [key: string]: unknown;
}
interface ResultCardProps { actions?: unknown; configuration?: unknown; details: ResultDetails; onOpen?(section?: OpenSection): void }
const jsx = getJsxRuntime();

function countLabel(values: unknown[], plural: string): string {
  if (values.length === 0) return "None";
  if (values.length === 1) return String(values[0]);
  return `${values.length} ${plural}`;
}
function networkLabel(policy: NetworkPolicy | undefined): string {
  if (policy == null || policy.type === "disabled") return "Disabled";
  if (policy.type === "unrestricted") return "Unrestricted";
  const hosts = (policy.egress_rules ?? []).map((rule) => rule.host).filter((host): host is string => Boolean(host));
  return hosts.length === 0 ? "Restricted" : hosts.join(", ");
}
function scriptLabel(script: string | null | undefined): string {
  const normalized = script?.trim();
  if (!normalized) return "None";
  const firstLine = normalized.split(/\r?\n/, 1)[0] ?? normalized;
  return firstLine.length > 80 ? `${firstLine.slice(0, 77)}…` : firstLine;
}
function DetailRow({ label, value, onOpen }: { label: string; value: unknown; onOpen?(): void }): unknown {
  return jsx.jsxs("div", { className: `relative col-span-2 grid grid-cols-subgrid items-center${onOpen == null ? "" : " select-none"}`, children: [
    jsx.jsx("dt", { className: "text-secondary", children: label }),
    jsx.jsxs("dd", { className: "flex min-w-0 items-center text-default", children: [
      jsx.jsx("span", { className: "min-w-0 flex-1 truncate", children: value }),
      onOpen == null ? null : jsx.jsx("button", { type: "button", onClick: onOpen, "aria-label": `Open ${label.toLowerCase()} settings`, children: "›" }),
    ] }),
  ] });
}
function ResultCard({ actions, configuration, details, onOpen }: ResultCardProps): unknown {
  void configuration;
  const repositories = Array.isArray(details.repositories) ? details.repositories : [];
  const secretNames = Array.isArray(details.secretNames) ? details.secretNames : [];
  const identities = Array.isArray(details.outboundIdentityRequirements) ? details.outboundIdentityRequirements : null;
  return jsx.jsx("article", { className: "my-2", "data-environment-result": true, children: jsx.jsxs("div", { className: "px-4 py-3", children: [
    jsx.jsxs("div", { className: "mb-3 flex items-center justify-between gap-2", children: [
      jsx.jsxs("div", { className: "flex min-w-0 items-center gap-2 text-size-chat font-medium text-default", children: [jsx.jsx("span", { "aria-hidden": true, children: "◈" }), jsx.jsx("span", { className: "truncate", children: details.name })] }),
      onOpen == null ? null : jsx.jsx("button", { type: "button", onClick: () => onOpen(), "aria-label": "Open environment settings", children: "⋯" }),
    ] }),
    jsx.jsxs("dl", { className: "grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-1.5 text-size-chat-sm", children: [
      jsx.jsx(DetailRow, { label: "Repository", value: countLabel(repositories, "repositories"), onOpen: onOpen == null ? undefined : () => onOpen("repositories") }),
      details.runtime == null ? null : jsx.jsx(DetailRow, { label: "Runtime", value: details.runtime, onOpen: onOpen == null ? undefined : () => onOpen() }),
      jsx.jsx(DetailRow, { label: "Secrets", value: countLabel(secretNames, "secrets"), onOpen: onOpen == null ? undefined : () => onOpen("secrets") }),
      identities == null ? null : jsx.jsx(DetailRow, { label: "Outbound identity", value: identities.length === 1 ? describeIdentity(identities[0]) : `${identities.length} connections`, onOpen: onOpen == null ? undefined : () => onOpen("connections") }),
      jsx.jsx(DetailRow, { label: "Network", value: networkLabel(details.networkPolicy), onOpen: onOpen == null ? undefined : () => onOpen("network") }),
      jsx.jsx(DetailRow, { label: "Install script", value: scriptLabel(details.setupScript), onOpen: onOpen == null ? undefined : () => onOpen("scripts") }),
      jsx.jsx(DetailRow, { label: "Start skill", value: scriptLabel(details.startSkill), onOpen: onOpen == null ? undefined : () => onOpen("scripts") }),
      jsx.jsx(DetailRow, { label: "Access", value: details.access === "private" ? "Private" : "Shared", onOpen: onOpen == null ? undefined : () => onOpen("privacy") }),
    ] }),
    jsx.jsx("footer", { className: "mt-3 border-t border-default pt-2 text-size-chat-sm text-codex-description", children: actions ?? "Prototype draft — execution and validation are not connected yet" }),
  ] }) });
}
function describeIdentity(value: unknown): string {
  if (value == null) return "Connection";
  if (typeof value === "string") return value;
  if (typeof value !== "object") return String(value);
  const identity = value as Record<string, unknown>;
  return String(identity.alias ?? identity.name ?? identity.id ?? "Connection");
}
function readCurrentThreadScripts(): { setupScript?: string | null; startSkill?: string | null; environmentExists?: boolean } | null {
  const reader = (appInitial as Record<string, unknown>).getCurrentThreadEnvironmentSummary;
  if (typeof reader !== "function") return null;
  try { return (reader as () => { setupScript?: string | null; startSkill?: string | null; environmentExists?: boolean } | null)(); }
  catch { return null; }
}
function ResultCardForCurrentThread({ details }: Pick<ResultCardProps, "details">): unknown {
  const current = readCurrentThreadScripts();
  if (current?.environmentExists === true) return null;
  const networkPolicy = details.networkPolicy ?? (details.networkDomains?.length
    ? { type: "restricted", egress_rules: details.networkDomains.map((host) => ({ host })) }
    : { type: details.networkEnabled ? "unrestricted" : "disabled" });
  return jsx.jsx(ResultCard, { details: { ...details, setupScript: current?.setupScript ?? details.setupScript, startSkill: current?.startSkill ?? details.startSkill, networkPolicy } });
}
function initializeResultCard(): void {
  for (const name of ["yb", "itn", "pfn", "DLt", "Zpt"] as const) {
    const initializer = (appInitial as Record<string, unknown>)[name];
    if (typeof initializer === "function") (initializer as () => void)();
  }
}
export { ResultCard as n, initializeResultCard as r, ResultCardForCurrentThread as t };
