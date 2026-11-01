import "@rchunk/rolldown-runtime";
import "@rchunk/gpt-plugin-retirement";
import "@rchunk/gpt-report-menu-item";
import "@rchunk/card-tile";
import "@rchunk/migrated-plugin-access";
import "@rchunk/gpt-plugin-migration-notices";
import "@rchunk/gpt-plugin-migration-dialog";
import { I3 as getJsxRuntime } from "@rchunk/app-shared";
import { cJt as initializeApiClient } from "@rchunk/app-initial";

interface GptTool { type?: string; [key: string]: unknown }
interface GptData {
  author?: { display_name?: string; link_to?: string; user_id?: string };
  display?: { description?: string | null; name?: string; profile_picture_url?: string | null };
  gizmo_type?: string;
  id: string;
  live_version?: number;
  share_recipient?: string;
  short_url?: string;
  tags?: string[];
  [key: string]: unknown;
}
interface GptResource {
  gizmo: GptData;
  tools?: GptTool[];
  [key: string]: unknown;
}
interface GptAboutDialogProps {
  accountId: string;
  gizmo: GptData | GptResource | string;
  isError?: boolean;
  isOwnerAndWorkspaceAllowsSpecific?: boolean;
  onClose(): void;
  onRefetch?(): void;
  onStartChat?(resource: GptResource): void;
  relatedGpts?: GptResource[];
}

const jsx = getJsxRuntime();
const TOOL_LABELS: Readonly<Record<string, { description?: string; title: string } | null>> = {
  browser: { title: "Web Search" },
  canvas: { title: "Canvas" },
  python: { title: "Code Interpreter & Data Analysis" },
  dalle: { title: "DALL·E Images" },
  image_gen: { title: "4o Image Generation" },
  memory: { title: "Memory", description: "Learns from previous chats to improve future conversations" },
  plugin: { title: "Actions", description: "Retrieves or takes actions outside of ChatGPT" },
  connector: { title: "Apps" },
  context_connector: null,
  function: null,
  gizmo_contacts: null,
  intent: null,
  parallel_browse: null,
  plugins_prototype: null,
  retrieval: null,
};

function blockedGptReason(tags: readonly string[], workspaceAllowsSpecific: boolean): string | null {
  if (tags.includes("interactions_disabled")) return "interactions_disabled";
  if (tags.includes("fedramp_incompatible")) return "fedramp_incompatible";
  if (tags.includes("openai_gpt_workspace_disabled")) return "openai_gpt_workspace_disabled";
  return tags.includes("workspace_disabled") && !workspaceAllowsSpecific ? "workspace_disabled" : null;
}
function initializeGptDiscoveryQueries(): void {}
function gptDiscoveryQueryKey(accountId: string): unknown[] {
  return ["chatgpt-gizmos", accountId, "discovery"];
}
function gptDiscoveryCutQueryKey(accountId: string, category: unknown, cursor: unknown): unknown[] {
  return ["chatgpt-gizmos", accountId, "discovery-cut", category, cursor];
}
function gptSearchQueryKey(accountId: string, query: unknown, cursor: unknown): unknown[] {
  return ["chatgpt-gizmos", accountId, "search", query, cursor];
}
function initializeGptCreatorQueries(): void {}

function toolDetails(tool: GptTool): { description?: string; title: string } | null {
  return typeof tool.type === "string" ? TOOL_LABELS[tool.type] ?? null : null;
}
function displayName(resource: GptResource): string {
  return resource.gizmo.display?.name?.trim() || resource.gizmo.id;
}
function isGptResource(value: GptData | GptResource): value is GptResource {
  return typeof value.gizmo === "object" && value.gizmo != null && typeof (value.gizmo as GptData).id === "string";
}
function GptCard({ resource, onStartChat }: { resource: GptResource; onStartChat?(resource: GptResource): void }): unknown {
  const name = displayName(resource);
  return jsx.jsxs("button", {
    className: "gpt-about-dialog__related-card",
    type: "button",
    onClick: () => onStartChat?.(resource),
    children: [
      resource.gizmo.display?.profile_picture_url ? jsx.jsx("img", { alt: "", src: resource.gizmo.display.profile_picture_url }) : null,
      jsx.jsx("strong", { children: name }),
      resource.gizmo.display?.description ? jsx.jsx("span", { children: resource.gizmo.display.description }) : null,
    ],
  });
}
function GptAboutDialog({ accountId, gizmo, isError = false, isOwnerAndWorkspaceAllowsSpecific = false, onClose, onRefetch, onStartChat, relatedGpts = [] }: GptAboutDialogProps): unknown {
  if (typeof gizmo === "string") {
    return jsx.jsxs("dialog", {
      open: true,
      "data-account-id": accountId,
      children: isError
        ? [jsx.jsx("h2", { children: "Couldn't load this GPT" }), jsx.jsx("p", { children: "Check your connection and try again." }), jsx.jsx("button", { type: "button", onClick: onRefetch, children: "Try again" })]
        : [jsx.jsx("h2", { className: "sr-only", children: "Loading GPT details" }), jsx.jsx("p", { role: "status", children: "Loading information about this GPT" })],
    });
  }
  const resource: GptResource = isGptResource(gizmo) ? gizmo : { gizmo };
  const name = displayName(resource);
  const author = resource.gizmo.author?.display_name?.trim() || null;
  const capabilities = [...new Map((resource.tools ?? []).map(toolDetails).filter((value): value is { description?: string; title: string } => value != null).map(value => [value.title, value])).values()];
  const blockedReason = blockedGptReason(resource.gizmo.tags ?? [], isOwnerAndWorkspaceAllowsSpecific);
  return jsx.jsxs("dialog", {
    open: true,
    "aria-label": name,
    "data-account-id": accountId,
    "data-blocked-reason": blockedReason ?? undefined,
    children: [
      jsx.jsx("button", { "aria-label": "Close", type: "button", onClick: onClose, children: "Close" }),
      resource.gizmo.display?.profile_picture_url ? jsx.jsx("img", { alt: "", src: resource.gizmo.display.profile_picture_url }) : null,
      jsx.jsx("h1", { children: name }),
      author == null ? null : jsx.jsx("p", { children: `By ${author}` }),
      resource.gizmo.display?.description == null
        ? jsx.jsx("p", { className: "sr-only", children: `Details for ${name}` })
        : jsx.jsx("p", { children: resource.gizmo.display.description }),
      blockedReason == null ? null : jsx.jsx("p", { role: "alert", children: blockedReason.replaceAll("_", " ") }),
      capabilities.length === 0 ? null : jsx.jsxs("section", {
        children: [
          jsx.jsx("h2", { children: "Capabilities" }),
          jsx.jsx("ul", { children: capabilities.map(capability => jsx.jsxs("li", { children: [jsx.jsx("strong", { children: capability.title }), capability.description == null ? null : jsx.jsx("span", { children: capability.description })] }, capability.title)) }),
        ],
      }),
      relatedGpts.length === 0 ? null : jsx.jsxs("section", {
        children: [jsx.jsx("h2", { children: author == null ? "More from this creator" : `More by ${author}` }), jsx.jsx("div", { children: relatedGpts.filter(item => blockedGptReason(item.gizmo.tags ?? [], isOwnerAndWorkspaceAllowsSpecific) == null).map(item => jsx.jsx(GptCard, { resource: item, onStartChat }, item.gizmo.id)) })],
      }),
      blockedReason == null ? jsx.jsx("button", { type: "button", onClick: () => onStartChat?.(resource), children: "Start chat" }) : null,
    ],
  });
}
function initializeGptAboutDialog(): void {
  initializeApiClient();
  initializeGptDiscoveryQueries();
  initializeGptCreatorQueries();
}

export {
  gptSearchQueryKey as a,
  initializeGptDiscoveryQueries as c,
  gptDiscoveryQueryKey as i,
  initializeGptAboutDialog as n,
  initializeGptCreatorQueries as o,
  gptDiscoveryCutQueryKey as r,
  blockedGptReason as s,
  GptAboutDialog as t,
};
